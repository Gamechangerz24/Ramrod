import assert from "node:assert/strict";
import { normalizePhotoGroups } from "./lib/photo-grouping.mjs";

const normalized = normalizePhotoGroups({
  groups: [
    { imageIndexes: [1, 2], titleHint: "Spiel A", confidence: 92, reason: "Cover und Rueckseite" },
    { imageIndexes: [3, 3, 99], titleHint: "Film B", confidence: 75, reason: "Cover" }
  ],
  unassigned: [4]
}, 5);

assert.deepEqual(normalized.map((group) => group.imageIndexes), [[0, 1], [2], [3], [4]]);
assert.equal(normalized[0].titleHint, "Spiel A");
assert.equal(normalized[0].confidence, 92);
assert.equal(normalized[3].confidence, 0);

console.log("Photo grouping tests passed.");
