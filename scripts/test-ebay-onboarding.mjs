import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildEbayConsentUrl,
  createEbayOAuthState,
  ebayOAuthConfig,
  exchangeEbayAuthorizationCode,
  inspectEbaySellerSetup,
  mapEbayTokenResponse,
  verifyEbayOAuthState
} from "./lib/ebay-oauth.mjs";
import {
  buildSecretRef,
  createEncryptedSecretStore
} from "./lib/secret-store.mjs";

const config = ebayOAuthConfig({
  EBAY_ENV: "production",
  EBAY_CLIENT_ID: "client-id",
  EBAY_CLIENT_SECRET: "client-secret",
  EBAY_RUNAME: "Ramrod-Test-RuName",
  EBAY_MARKETPLACE_ID: "EBAY_DE",
  RAMROD_OAUTH_STATE_SECRET: "state-secret"
});

const state = createEbayOAuthState({
  organizationId: "11111111-1111-4111-8111-111111111111",
  channelAccountId: "22222222-2222-4222-8222-222222222222"
}, config.stateSecret, 1_000);
assert.equal(verifyEbayOAuthState(state, config.stateSecret, 1_500).organizationId, "11111111-1111-4111-8111-111111111111");
assert.throws(() => verifyEbayOAuthState(state, "wrong-secret", 1_500));
assert.throws(() => verifyEbayOAuthState(state, config.stateSecret, 1_000 + 11 * 60 * 1000));

const consentUrl = new URL(buildEbayConsentUrl(config, state));
assert.equal(consentUrl.origin, "https://auth.ebay.com");
assert.equal(consentUrl.searchParams.get("redirect_uri"), "Ramrod-Test-RuName");
assert.equal(consentUrl.searchParams.get("response_type"), "code");
assert.equal(consentUrl.searchParams.get("locale"), "en-US");
assert.equal(consentUrl.searchParams.get("prompt"), "login");

const tokenResponse = await exchangeEbayAuthorizationCode(config, "authorization-code", async (_url, request) => {
  assert.match(String(request.headers.Authorization), /^Basic /);
  assert.match(String(request.body), /grant_type=authorization_code/);
  return jsonResponse({
    access_token: "access",
    expires_in: 7200,
    refresh_token: "refresh",
    refresh_token_expires_in: 47304000,
    token_type: "User Access Token"
  });
});
const credentials = mapEbayTokenResponse(tokenResponse, config.scopes, { environment: "production" });
assert.equal(credentials.refreshToken, "refresh");
assert.ok(credentials.accessTokenExpiresAt > Date.now());

const setup = await inspectEbaySellerSetup(config, "access", async (url) => {
  if (url.includes("payment_policy")) return jsonResponse({ total: 1, paymentPolicies: [{ paymentPolicyId: "pay-1" }] });
  if (url.includes("fulfillment_policy")) return jsonResponse({ total: 1, fulfillmentPolicies: [{ fulfillmentPolicyId: "ship-1" }] });
  if (url.includes("return_policy")) return jsonResponse({ total: 1, returnPolicies: [{ returnPolicyId: "return-1" }] });
  return jsonResponse({ total: 1, locations: [{ merchantLocationKey: "warehouse-1" }] });
});
assert.equal(setup.paymentPolicyId, "pay-1");
assert.equal(setup.fulfillmentPolicyId, "ship-1");
assert.equal(setup.returnPolicyId, "return-1");
assert.equal(setup.merchantLocationKey, "warehouse-1");

const directory = mkdtempSync(join(tmpdir(), "ramrod-secret-store-"));
const filePath = join(directory, "credentials.enc.json");
const store = createEncryptedSecretStore({
  filePath,
  encryptionKey: "a".repeat(64)
});
const ref = buildSecretRef("ebay", "11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222");
store.put(ref, credentials);
assert.equal(store.has(ref), true);
assert.equal(store.get(ref).refreshToken, "refresh");
assert.equal(readFileSync(filePath, "utf8").includes("refresh"), false);

const tampered = JSON.parse(readFileSync(filePath, "utf8"));
tampered.entries[ref].ciphertext = Buffer.from("tampered").toString("base64");
writeFileSync(filePath, JSON.stringify(tampered));
assert.throws(() => store.get(ref));
rmSync(directory, { recursive: true, force: true });

console.log("eBay onboarding tests passed.");

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  };
}
