import assert from "node:assert/strict";

import { scoreItemRecognition } from "./lib/item-recognition.mjs";

const clearGame = scoreItemRecognition({
  image: { rotation: 0, usable: true, issues: [] },
  identity: {
    title: "Dragon Age Inquisition",
    productType: "Videospiel",
    category: "Games",
    brand: "BioWare",
    franchise: "Dragon Age",
    platform: "Xbox One",
    edition: "",
    region: "PAL",
    modelNumber: ""
  },
  visibleText: ["DRAGON AGE INQUISITION", "XBOX ONE", "BIOWARE", "PAL"],
  identifiers: [{ type: "ean", value: "5030930111345" }],
  alternatives: [],
  missingEvidence: [],
  requestedPhotos: [],
  modelConfidence: 98
}, { imageCount: 2 });

assert.equal(clearGame.evidence.status, "ready_for_research");
assert.ok(clearGame.evidence.score >= 65);
assert.equal(clearGame.evidence.autoApprovalEligible, false);
assert.equal(clearGame.evidence.releaseGate, "blocked_until_source_match");

const blurryUnknown = scoreItemRecognition({
  image: { rotation: 90, usable: false, issues: ["unscharf", "abgeschnitten"] },
  identity: {
    title: "",
    productType: "",
    category: "",
    brand: "",
    franchise: "",
    platform: "",
    edition: "",
    region: "",
    modelNumber: ""
  },
  visibleText: [],
  identifiers: [],
  alternatives: [],
  missingEvidence: ["Identität"],
  requestedPhotos: [],
  modelConfidence: 10
}, { imageCount: 1, clientImageQualities: [{ score: 20 }] });

assert.equal(blurryUnknown.evidence.status, "needs_better_photo");
assert.ok(blurryUnknown.requestedPhotos.some((photo) => photo.type === "retake"));

const figureWithoutMaker = scoreItemRecognition({
  image: { rotation: 0, usable: true, issues: [] },
  identity: {
    title: "Boba Fett Actionfigur",
    productType: "Actionfigur",
    category: "Collectibles",
    brand: "",
    franchise: "Star Wars",
    platform: "",
    edition: "",
    region: "",
    modelNumber: ""
  },
  visibleText: ["BOBA FETT", "STAR WARS"],
  identifiers: [],
  alternatives: [],
  missingEvidence: ["Inhalt der Verpackung nicht sichtbar"],
  requestedPhotos: [],
  modelConfidence: 80
}, { imageCount: 1 });

assert.equal(figureWithoutMaker.evidence.status, "needs_more_evidence");
assert.ok(figureWithoutMaker.evidence.criticalMissing.includes("brand"));
assert.ok(figureWithoutMaker.requestedPhotos.some((photo) => photo.type === "label"));
assert.ok(figureWithoutMaker.requestedPhotos.some((photo) => photo.type === "contents"));

const joyConPhotoSet = scoreItemRecognition({
  image: { rotation: 0, usable: true, issues: [] },
  identity: {
    title: "Nintendo Switch Joy-Con Paar Neon-Rot und Neon-Blau",
    productType: "Joy-Con Controller Zubehör",
    category: "Gaming-Zubehör",
    brand: "Nintendo",
    franchise: "",
    platform: "Nintendo Switch",
    edition: "",
    region: "",
    modelNumber: ""
  },
  visibleText: [],
  identifiers: [],
  alternatives: [],
  missingEvidence: [],
  requestedPhotos: [],
  modelConfidence: 92
}, {
  imageCount: 4,
  clientImageQualities: [{ score: 91 }, { score: 88 }, { score: 34 }, { score: 86 }]
});

assert.equal(joyConPhotoSet.evidence.status, "ready_for_research");
assert.ok(!joyConPhotoSet.evidence.criticalMissing.includes("modelNumber"));
assert.equal(joyConPhotoSet.evidence.qualityScore, 91);

console.log("Item recognition evidence tests passed.");
