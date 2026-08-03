import assert from "node:assert/strict";
import {
  buildTradingItemRequest,
  getTradingEbayUser,
  publishTradingEbayItem,
  tradingConditionId,
  verifyTradingEbayItem
} from "./lib/ebay-trading-listing.mjs";

const config = { environment: "production", tradingApiUrl: "https://api.ebay.test/ws/api.dll" };
const preview = {
  sku: "PR-TEST-001",
  title: "Nintendo Switch Konsole mit weissen Joy-Con gebraucht",
  descriptionHtml: "<p>Gebrauchte Nintendo Switch.</p>",
  category: { id: "139971", name: "Konsolen" },
  price: 165,
  condition: "Gebraucht",
  sourceImages: ["https://i.ebayimg.com/example.jpg"],
  itemSpecifics: { Marke: ["Nintendo"], Modell: ["Nintendo Switch"] },
  merchantPostalCode: "73730",
  handlingDays: 2,
  returnsAccepted: false,
  shipping: { serviceCode: "DE_DHLPaket", shippingCost: "6.19" }
};

const request = buildTradingItemRequest(preview);
assert.equal(request.ListingType, "FixedPriceItem");
assert.equal(request.ConditionID, 3000);
assert.equal(request.ShippingDetails.ShippingServiceOptions.ShippingServiceCost["#text"], "6.19");
assert.equal(tradingConditionId("Defekt"), 7000);

const auctionRequest = buildTradingItemRequest({
  ...preview,
  salesFormat: "auction",
  startPrice: 1,
  marketValue: 165,
  listingDuration: "DAYS_7"
});
assert.equal(auctionRequest.ListingType, "Chinese");
assert.equal(auctionRequest.ListingDuration, "Days_7");
assert.equal(auctionRequest.StartPrice["#text"], "1.00");

const calls = [];
const fetchMock = async (_url, options) => {
  calls.push(options);
  const call = options.headers["X-EBAY-API-CALL-NAME"];
  if (call === "GetUser") return xmlResponse(`<?xml version="1.0"?><GetUserResponse xmlns="urn:ebay:apis:eBLBaseComponents"><Ack>Success</Ack><User><UserID>private-seller</UserID><FeedbackScore>42</FeedbackScore><SellerInfo><SellerBusinessType>Private</SellerBusinessType></SellerInfo></User></GetUserResponse>`);
  if (call === "VerifyAddItem") return xmlResponse(`<?xml version="1.0"?><VerifyAddItemResponse xmlns="urn:ebay:apis:eBLBaseComponents"><Ack>Warning</Ack><Fees><Fee><Name>InsertionFee</Name><Fee currencyID="EUR">0.00</Fee></Fee></Fees><Errors><SeverityCode>Warning</SeverityCode><ErrorCode>1</ErrorCode><ShortMessage>Hinweis</ShortMessage></Errors></VerifyAddItemResponse>`);
  return xmlResponse(`<?xml version="1.0"?><AddItemResponse xmlns="urn:ebay:apis:eBLBaseComponents"><Ack>Success</Ack><ItemID>1234567890</ItemID><Fees><Fee><Name>InsertionFee</Name><Fee currencyID="EUR">0.35</Fee></Fee></Fees></AddItemResponse>`);
};

const seller = await getTradingEbayUser(config, "token", fetchMock);
assert.equal(seller.userId, "private-seller");
assert.equal(seller.sellerBusinessType, "Private");
const verified = await verifyTradingEbayItem(config, "token", preview, preview.sourceImages, fetchMock);
assert.equal(verified.ack, "Warning");
assert.equal(verified.warnings.length, 1);
const published = await publishTradingEbayItem(config, "token", preview, preview.sourceImages, fetchMock);
assert.equal(published.listingId, "1234567890");
assert.equal(published.feeTotal, 0.35);
assert.match(calls[1].body, /VerifyAddItemRequest/);
assert.match(calls[2].body, /AddItemRequest/);

console.log("eBay private Trading tests passed.");

function xmlResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, async text() { return body; } };
}
