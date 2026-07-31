import assert from "node:assert/strict";
import {
  buildPrivateEbaySellerSetup,
  buildMerchantLocationKey,
  createMissingEbaySellerDefaults,
  ebayBusinessPoliciesUnavailable,
  normalizeEbaySellerDefaults
} from "./lib/ebay-seller-setup.mjs";

const config = {
  apiBaseUrl: "https://api.ebay.test",
  marketplaceId: "EBAY_DE"
};

const normalized = normalizeEbaySellerDefaults({
  postalCode: "73730",
  handlingDays: 2,
  returnsAccepted: false
});
assert.equal(normalized.shippingProfiles.length, 5);
assert.equal(normalized.shippingProfiles[0].shippingCost, "6.19");
assert.equal(normalized.shippingProfiles.at(-1).maxWeightKg, 31.5);
assert.equal(buildMerchantLocationKey("73730"), "ramrod-de-73730");
assert.throws(() => normalizeEbaySellerDefaults({ postalCode: "7373" }), /Postleitzahl/);

const privateSetup = buildPrivateEbaySellerSetup({
  warnings: ["paymentPolicies: User is not eligible for Business Policy."]
}, normalized, new Date("2026-07-31T12:00:00.000Z"));
assert.equal(ebayBusinessPoliciesUnavailable(privateSetup.sellerSetup), true);
assert.equal(privateSetup.sellerSetup.listingMode, "trading");
assert.equal(privateSetup.sellerSetup.privateSellerRulesReady, true);
assert.equal(privateSetup.sellerSetup.merchantPostalCode, "73730");
assert.equal(privateSetup.sellerSetup.verifiedAt, "2026-07-31T12:00:00.000Z");

const requests = [];
const result = await createMissingEbaySellerDefaults(config, "access", {
  paymentPolicyCount: 0,
  fulfillmentPolicyCount: 0,
  returnPolicyCount: 0,
  locationCount: 0
}, normalized, async (url, request) => {
  requests.push({ url, request, body: JSON.parse(request.body) });
  return jsonResponse({}, url.includes("/location/") ? 204 : 201);
});

assert.deepEqual(result.created, ["Zahlungsregel", "5 Versandklassen", "Rückgaberegel", "Versandstandort"]);
assert.equal(requests.length, 8);
assert.equal(requests[1].body.shippingOptions[0].optionType, "DOMESTIC");
assert.equal(requests[1].body.shippingOptions[0].shippingServices[0].shippingServiceCode, "DE_DHLPaket");
assert.equal(requests[1].body.shippingOptions[0].shippingServices[0].shippingCost.value, "6.19");
assert.equal(requests[5].body.shippingOptions[0].shippingServices[0].shippingCost.value, "23.99");
assert.equal(requests[6].body.returnsAccepted, false);
assert.equal(requests[7].body.location.address.postalCode, "73730");

const noChanges = await createMissingEbaySellerDefaults(config, "access", {
  paymentPolicyCount: 1,
  fulfillmentPolicyCount: 1,
  returnPolicyCount: 1,
  locationCount: 1
}, normalized, async () => {
  throw new Error("No request expected");
});
assert.deepEqual(noChanges.created, []);

console.log("eBay seller setup tests passed.");

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  };
}
