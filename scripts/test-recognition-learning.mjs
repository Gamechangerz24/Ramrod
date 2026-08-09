import assert from "node:assert/strict";
import {
  aggregateRecognitionFeedback,
  correctedIdentitySignature,
  recognitionFingerprint,
  scopeAllowsCollectionItem
} from "./lib/recognition-learning.mjs";

const steelbook = {
  title: "Spider-Man: Far From Home",
  productType: "Film",
  platform: "4K UHD + Blu-ray",
  edition: "Limited Edition Steelbook",
  region: "DE"
};
const standard = { ...steelbook, edition: "Standard Edition" };
assert.notEqual(recognitionFingerprint(steelbook), recognitionFingerprint(standard));
assert.equal(recognitionFingerprint(steelbook, { barcode: "5050630592476" }), recognitionFingerprint(standard, { barcode: "5050630592476" }));
assert.notEqual(correctedIdentitySignature(steelbook), correctedIdentitySignature(standard));

const grouped = aggregateRecognitionFeedback([
  { id: "1", item_id: "item-a", organization_id: "a", corrected_identity: steelbook },
  { id: "2", item_id: "item-b", organization_id: "b", corrected_identity: steelbook },
  { id: "duplicate", item_id: "item-a", organization_id: "a", corrected_identity: steelbook },
  { id: "3", organization_id: "a", corrected_identity: standard }
]);
assert.equal(grouped[0].confirmations, 2);
assert.equal(grouped[0].distinctOrganizations, 2);

const film = { id: "film-1", collection: { mediaType: "film", ageRating: "FSK 18" } };
assert.equal(scopeAllowsCollectionItem({ mediaTypes: ["film"], hiddenAgeRatings: ["FSK 18"] }, film), false);
assert.equal(scopeAllowsCollectionItem({ mediaTypes: ["film"] }, film), true);
assert.equal(scopeAllowsCollectionItem({ mediaTypes: ["game"] }, film), false);

console.log("Recognition learning and collection sharing tests passed.");
