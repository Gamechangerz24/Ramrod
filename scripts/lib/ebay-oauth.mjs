import {
  createHmac,
  randomBytes,
  timingSafeEqual
} from "node:crypto";

export const defaultEbayScopes = Object.freeze([
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment"
]);

export function ebayOAuthConfig(env = process.env) {
  const production = String(env.EBAY_ENV || "sandbox").toLowerCase() === "production";
  const runame = String(env.EBAY_RUNAME || env.EBAY_REDIRECT_URI || "").trim();
  const scopes = String(env.EBAY_OAUTH_SCOPES || "")
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    environment: production ? "production" : "sandbox",
    clientId: String(env.EBAY_CLIENT_ID || "").trim(),
    clientSecret: String(env.EBAY_CLIENT_SECRET || "").trim(),
    runame,
    scopes: scopes.length ? [...new Set(scopes)] : [...defaultEbayScopes],
    marketplaceId: String(env.EBAY_MARKETPLACE_ID || "EBAY_DE").trim(),
    authBaseUrl: production ? "https://auth.ebay.com" : "https://auth.sandbox.ebay.com",
    apiBaseUrl: production ? "https://api.ebay.com" : "https://api.sandbox.ebay.com",
    oauthLocale: String(env.EBAY_OAUTH_LOCALE || "en-US").trim(),
    stateSecret: String(env.RAMROD_OAUTH_STATE_SECRET || "").trim()
  };
}

export function ebayOAuthReadiness(config) {
  const missing = [];
  if (!config.clientId) missing.push("EBAY_CLIENT_ID");
  if (!config.clientSecret) missing.push("EBAY_CLIENT_SECRET");
  if (!config.runame) missing.push("EBAY_RUNAME");
  if (!config.stateSecret) missing.push("RAMROD_OAUTH_STATE_SECRET");
  return { ready: missing.length === 0, missing };
}

export function createEbayOAuthState(payload, secret, now = Date.now()) {
  if (!secret) throw new Error("OAuth-State-Schutz fehlt.");
  const body = {
    ...payload,
    nonce: randomBytes(16).toString("base64url"),
    issuedAt: now,
    expiresAt: now + 10 * 60 * 1000
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyEbayOAuthState(value, secret, now = Date.now()) {
  if (!secret) throw new Error("OAuth-State-Schutz fehlt.");
  const [encoded, signature, extra] = String(value || "").split(".");
  if (!encoded || !signature || extra) throw new Error("Ungültiger OAuth-Status.");
  const expected = createHmac("sha256", secret).update(encoded).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new Error("Die OAuth-Anfrage konnte nicht sicher bestätigt werden.");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!payload.expiresAt || Number(payload.expiresAt) < now) {
    throw new Error("Die OAuth-Anfrage ist abgelaufen. Bitte erneut starten.");
  }
  return payload;
}

export function buildEbayConsentUrl(config, state) {
  const readiness = ebayOAuthReadiness(config);
  if (!readiness.ready) throw new Error(`eBay OAuth ist unvollständig: ${readiness.missing.join(", ")}`);
  const url = new URL("/oauth2/authorize", config.authBaseUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.runame);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "login");
  if (config.oauthLocale) url.searchParams.set("locale", config.oauthLocale);
  return url.toString();
}

export async function exchangeEbayAuthorizationCode(config, code, fetchImpl = fetch) {
  return requestEbayToken(config, {
    grant_type: "authorization_code",
    code: String(code || ""),
    redirect_uri: config.runame
  }, fetchImpl);
}

export async function refreshEbayUserToken(config, refreshToken, fetchImpl = fetch) {
  return requestEbayToken(config, {
    grant_type: "refresh_token",
    refresh_token: String(refreshToken || ""),
    scope: config.scopes.join(" ")
  }, fetchImpl);
}

export async function ensureFreshEbayCredentials(config, credentials, fetchImpl = fetch) {
  if (!credentials?.refreshToken) throw new Error("Die eBay-Freigabe ist unvollständig.");
  const expiresAt = Number(credentials.accessTokenExpiresAt || 0);
  if (credentials.accessToken && expiresAt > Date.now() + 60_000) return credentials;
  const token = await refreshEbayUserToken(config, credentials.refreshToken, fetchImpl);
  return mapEbayTokenResponse(token, config.scopes, credentials);
}

export function mapEbayTokenResponse(token, scopes, previous = {}) {
  const now = Date.now();
  return {
    provider: "ebay",
    environment: previous.environment || "",
    accessToken: token.access_token,
    accessTokenExpiresAt: now + Number(token.expires_in || 0) * 1000,
    refreshToken: token.refresh_token || previous.refreshToken || "",
    refreshTokenExpiresAt: token.refresh_token_expires_in
      ? now + Number(token.refresh_token_expires_in) * 1000
      : previous.refreshTokenExpiresAt || null,
    scopes: token.scope ? String(token.scope).split(/\s+/).filter(Boolean) : scopes,
    tokenType: token.token_type || "User Access Token",
    updatedAt: new Date(now).toISOString()
  };
}

export async function inspectEbaySellerSetup(config, accessToken, fetchImpl = fetch) {
  const marketplaceId = config.marketplaceId || "EBAY_DE";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "X-EBAY-C-MARKETPLACE-ID": marketplaceId
  };
  const requests = [
    ["paymentPolicies", `/sell/account/v1/payment_policy?marketplace_id=${encodeURIComponent(marketplaceId)}`],
    ["fulfillmentPolicies", `/sell/account/v1/fulfillment_policy?marketplace_id=${encodeURIComponent(marketplaceId)}`],
    ["returnPolicies", `/sell/account/v1/return_policy?marketplace_id=${encodeURIComponent(marketplaceId)}`],
    ["locations", "/sell/inventory/v1/location?limit=20"]
  ];
  const settled = await Promise.all(requests.map(async ([key, path]) => {
    const response = await fetchImpl(`${config.apiBaseUrl}${path}`, { headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return [key, { ok: false, status: response.status, message: ebayApiMessage(body, response.status) }];
    }
    return [key, { ok: true, count: ebayCollectionCount(body), body }];
  }));
  const results = Object.fromEntries(settled);
  const authorizationError = Object.values(results).find((entry) => [401, 403].includes(entry.status));
  if (authorizationError) throw new Error(authorizationError.message);

  return {
    marketplaceId,
    paymentPolicyCount: results.paymentPolicies?.count || 0,
    fulfillmentPolicyCount: results.fulfillmentPolicies?.count || 0,
    returnPolicyCount: results.returnPolicies?.count || 0,
    locationCount: results.locations?.count || 0,
    paymentPolicyId: firstCollectionValue(results.paymentPolicies?.body, "paymentPolicies", "paymentPolicyId"),
    fulfillmentPolicyId: firstCollectionValue(results.fulfillmentPolicies?.body, "fulfillmentPolicies", "fulfillmentPolicyId"),
    returnPolicyId: firstCollectionValue(results.returnPolicies?.body, "returnPolicies", "returnPolicyId"),
    merchantLocationKey: firstCollectionValue(results.locations?.body, "locations", "merchantLocationKey"),
    paymentPolicy: summarizePolicy(results.paymentPolicies?.body, "paymentPolicies", "paymentPolicyId", summarizePaymentPolicy),
    fulfillmentPolicy: summarizePolicy(results.fulfillmentPolicies?.body, "fulfillmentPolicies", "fulfillmentPolicyId", summarizeFulfillmentPolicy),
    returnPolicy: summarizePolicy(results.returnPolicies?.body, "returnPolicies", "returnPolicyId", summarizeReturnPolicy),
    warnings: Object.entries(results)
      .filter(([, entry]) => !entry.ok)
      .map(([key, entry]) => `${key}: ${entry.message}`),
    verifiedAt: new Date().toISOString()
  };
}

async function requestEbayToken(config, form, fetchImpl) {
  const readiness = ebayOAuthReadiness(config);
  if (!readiness.ready) throw new Error(`eBay OAuth ist unvollständig: ${readiness.missing.join(", ")}`);
  const response = await fetchImpl(`${config.apiBaseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(form).toString()
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(ebayApiMessage(body, response.status));
  return body;
}

function ebayCollectionCount(body) {
  if (Number.isFinite(Number(body?.total))) return Number(body.total);
  for (const key of ["paymentPolicies", "fulfillmentPolicies", "returnPolicies", "locations"]) {
    if (Array.isArray(body?.[key])) return body[key].length;
  }
  return 0;
}

function firstCollectionValue(body, collectionKey, valueKey) {
  const rows = body?.[collectionKey];
  return Array.isArray(rows) ? rows.find((entry) => entry?.[valueKey])?.[valueKey] || null : null;
}

function summarizePolicy(body, collectionKey, idKey, summarizer) {
  const policy = Array.isArray(body?.[collectionKey])
    ? body[collectionKey].find((entry) => entry?.[idKey])
    : null;
  if (!policy) return null;
  return {
    id: policy[idKey],
    name: policy.name || "eBay-Regel",
    summary: summarizer(policy)
  };
}

function summarizePaymentPolicy(policy) {
  const methods = (policy.paymentMethods || [])
    .map((entry) => entry.paymentMethodType)
    .filter(Boolean);
  return methods.length ? `Zahlung: ${methods.join(", ")}` : "Zahlung wird ueber eBay abgewickelt.";
}

function summarizeFulfillmentPolicy(policy) {
  const services = (policy.shippingOptions || [])
    .flatMap((option) => option.shippingServices || [])
    .map((service) => {
      const name = service.shippingServiceCode || service.shippingCarrierCode || "Versand";
      const amount = service.shippingCost?.value;
      return amount !== undefined ? `${name}: ${amount} ${service.shippingCost?.currency || "EUR"}` : name;
    });
  const handling = policy.handlingTime?.value !== undefined
    ? `Bearbeitung ${policy.handlingTime.value} ${policy.handlingTime.unit || "BUSINESS_DAY"}`
    : "";
  return [services.slice(0, 3).join("; "), handling].filter(Boolean).join(" · ") || "Versanddetails sind im eBay-Konto hinterlegt.";
}

function summarizeReturnPolicy(policy) {
  if (policy.returnsAccepted === false) return "Keine Rueckgabe laut eBay-Regel.";
  const period = policy.returnPeriod?.value !== undefined
    ? `${policy.returnPeriod.value} ${policy.returnPeriod.unit || "DAY"}`
    : "";
  const payer = policy.returnShippingCostPayer ? `Rueckversand: ${policy.returnShippingCostPayer}` : "";
  return [policy.returnsAccepted ? "Rueckgabe akzeptiert" : "Rueckgabedetails laut eBay", period, payer].filter(Boolean).join(" · ");
}

function ebayApiMessage(body, status) {
  return body?.error_description
    || body?.message
    || body?.errors?.[0]?.longMessage
    || body?.errors?.[0]?.message
    || `eBay HTTP ${status}`;
}
