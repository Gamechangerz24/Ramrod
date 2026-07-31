import assert from "node:assert/strict";
import {
  buildEbayListingPreview,
  createEbayOffer,
  createOrReplaceEbayInventoryItem,
  getEbayCategoryAspects,
  publishEbayOffer,
  suggestEbayCategory,
  uploadEbayImageFromDataUrl,
  uploadEbayImageFromUrl
} from "./lib/ebay-listing.mjs";

const item = {
  sku: "PR-TEST-001",
  title: "Nintendo Switch Joy-Con Paar Neon Rot Blau",
  category: "Controller",
  franchise: "Nintendo",
  condition: "Gut",
  completeness: "Linker und rechter Joy-Con",
  fair: 49,
  confidence: 94,
  image: "https://images.example.test/joycon.jpg"
};
const content = {
  title: "Nintendo Switch Joy-Con Paar Neon Rot Blau Controller gebraucht",
  shortDescription: "Originales Joy-Con-Paar fuer Nintendo Switch im gebrauchten Zustand.",
  conditionDescription: "Gebrauchsspuren sichtbar; Funktion vor Versand erneut pruefen.",
  includedItems: ["Linker Joy-Con", "Rechter Joy-Con"],
  defects: ["Leichte Gebrauchsspuren"],
  sellingPoints: ["Neon Rot und Blau"],
  itemSpecifics: [
    { name: "Marke", value: "Nintendo", confidence: 99 },
    { name: "Plattform", value: "Nintendo Switch", confidence: 99 }
  ]
};
const sellerSetup = {
  marketplaceId: "EBAY_DE",
  paymentPolicyId: "pay-1",
  fulfillmentPolicyId: "ship-1",
  returnPolicyId: "return-1",
  merchantLocationKey: "warehouse-1",
  paymentPolicy: { id: "pay-1", name: "eBay-Zahlung", summary: "Zahlung ueber eBay" },
  fulfillmentPolicy: { id: "ship-1", name: "DHL Paket", summary: "DHL Paket: 5.49 EUR" },
  returnPolicy: { id: "return-1", name: "Keine Rueckgabe", summary: "Keine Rueckgabe laut eBay-Regel" }
};
const category = { id: "117042", name: "Controller", treeId: "77", path: ["Videospiele"] };
const categoryAspects = [
  { name: "Marke", required: true, values: ["Nintendo"] },
  { name: "Plattform", required: true, values: ["Nintendo Switch"] }
];

const preview = buildEbayListingPreview({
  item,
  content,
  category,
  categoryAspects,
  sellerSetup,
  sellerProfile: { seller_type: "private", config: {} }
});
assert.equal(preview.status, "ready_for_ebay");
assert.equal(preview.title.length <= 80, true);
assert.equal(preview.shipping.id, "ship-1");
assert.equal(preview.warranty.mode, "not_stated");
assert.deepEqual(preview.missingAspects, []);

const incomplete = buildEbayListingPreview({
  item,
  content: { ...content, itemSpecifics: content.itemSpecifics.filter((entry) => entry.name !== "Plattform") },
  category,
  categoryAspects,
  sellerSetup,
  sellerProfile: { seller_type: "private", config: {} }
});
assert.equal(incomplete.status, "needs_input");
assert.equal(incomplete.missingAspects[0].name, "Plattform");

const config = {
  environment: "production",
  apiBaseUrl: "https://api.ebay.com",
  marketplaceId: "EBAY_DE"
};
const calls = [];
const fetchMock = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  if (String(url).includes("get_default_category_tree_id")) return response({ categoryTreeId: "77" });
  if (String(url).includes("get_category_suggestions")) return response({ categorySuggestions: [{ category: { categoryId: "117042", categoryName: "Controller" }, categoryTreeNodeAncestors: [] }] });
  if (String(url).includes("get_item_aspects_for_category")) return response({ aspects: [{ localizedAspectName: "Marke", aspectConstraint: { aspectRequired: true }, aspectValues: [{ localizedValue: "Nintendo" }] }] });
  if (String(url).includes("create_image_from_url")) return response({ imageUrl: "https://i.ebayimg.com/images/g/test/s-l1600.jpg" }, 201, { location: "https://apim.ebay.com/commerce/media/v1_beta/image/image-1" });
  if (String(url).includes("create_image_from_file")) return response({ imageUrl: "https://i.ebayimg.com/images/g/data/s-l1600.jpg" }, 201, { location: "https://apim.ebay.com/commerce/media/v1_beta/image/image-2" });
  if (String(url).includes("/inventory_item/")) return response(null, 204);
  if (/\/offer$/.test(String(url))) return response({ offerId: "offer-1" }, 201);
  if (String(url).includes("/publish")) return response({ listingId: "123456789" }, 200);
  return response({ message: "unexpected request" }, 500);
};

const suggested = await suggestEbayCategory(config, "app-token", item.title, fetchMock);
assert.equal(suggested.id, "117042");
const aspects = await getEbayCategoryAspects(config, "app-token", suggested, fetchMock);
assert.equal(aspects[0].required, true);
const image = await uploadEbayImageFromUrl(config, "user-token", item.image, fetchMock);
assert.match(image.imageUrl, /ebayimg/);
const embeddedImage = await uploadEbayImageFromDataUrl(config, "user-token", "data:image/jpeg;base64,aGVsbG8=", fetchMock);
assert.match(embeddedImage.imageUrl, /ebayimg/);
assert.equal(calls.find((entry) => entry.url.includes("create_image_from_file"))?.options.body instanceof FormData, true);
await createOrReplaceEbayInventoryItem(config, "user-token", preview, [image.imageUrl], fetchMock);
const offer = await createEbayOffer(config, "user-token", preview, fetchMock);
assert.equal(offer.offerId, "offer-1");
const published = await publishEbayOffer(config, "user-token", offer.offerId, "EBAY_DE", fetchMock);
assert.equal(published.listingId, "123456789");
assert.equal(calls.some((entry) => entry.options.method === "PUT"), true);
assert.equal(calls.some((entry) => entry.url.endsWith("/publish")), true);

console.log("eBay listing tests passed.");

function response(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[String(name).toLowerCase()] || headers[name] || null },
    async text() {
      return body === null ? "" : JSON.stringify(body);
    }
  };
}
