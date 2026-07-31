import assert from "node:assert/strict";
import {
  buildMerchantLocationKey,
  createMissingEbaySellerDefaults,
  normalizeEbaySellerDefaults
} from "./lib/ebay-seller-setup.mjs";

const config = {
  apiBaseUrl: "https://api.ebay.test",
  marketplaceId: "EBAY_DE"
};

const normalized = normalizeEbaySellerDefaults({
  postalCode: "73730",
  shippingServiceCode: "DE_DHLPaket",
  shippingCost: 6.19,
  handlingDays: 2,
  returnsAccepted: false
});
assert.equal(normalized.shippingCost, "6.19");
assert.equal(normalized.shippingCarrierCode, "DHL");
assert.equal(buildMerchantLocationKey("73730"), "ramrod-de-73730");
assert.throws(() => normalizeEbaySellerDefaults({ postalCode: "7373" }), /Postleitzahl/);

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

assert.deepEqual(result.created, ["Zahlungsregel", "Versandregel", "Rückgaberegel", "Versandstandort"]);
assert.equal(requests.length, 4);
assert.equal(requests[1].body.shippingOptions[0].optionType, "DOMESTIC");
assert.equal(requests[1].body.shippingOptions[0].shippingServices[0].shippingServiceCode, "DE_DHLPaket");
assert.equal(requests[1].body.shippingOptions[0].shippingServices[0].shippingCost.value, "6.19");
assert.equal(requests[2].body.returnsAccepted, false);
assert.equal(requests[3].body.location.address.postalCode, "73730");

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
