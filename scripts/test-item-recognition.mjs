import assert from "node:assert/strict";

import { buildItemRecognitionPrompt, normalizeVisualSearchMatches, scoreItemRecognition } from "./lib/item-recognition.mjs";

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
  quickEstimate: { low: 14, fair: 9, high: 6, confidence: 52, basis: "Grobe Bildschätzung ohne Marktquellen" },
  alternatives: [],
  missingEvidence: [],
  requestedPhotos: [],
  modelConfidence: 98
}, { imageCount: 2 });

assert.equal(clearGame.evidence.status, "ready_for_research");
assert.ok(clearGame.evidence.score >= 65);
assert.equal(clearGame.evidence.autoApprovalEligible, false);
assert.equal(clearGame.evidence.releaseGate, "blocked_until_source_match");
assert.deepEqual(
  [clearGame.quickEstimate.low, clearGame.quickEstimate.fair, clearGame.quickEstimate.high],
  [6, 9, 14]
);
assert.equal(clearGame.quickEstimate.confidence, 52);

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

const titlelessSteelbookMisreadAsCard = scoreItemRecognition({
  image: { rotation: 0, usable: true, issues: ["Spiegelung auf der Oberfläche"] },
  identity: {
    title: "Spider-Man: No Way Home Sammelkarte/Promo-Card",
    productType: "Sammelkarte",
    category: "Film-Merchandise",
    brand: "Marvel",
    franchise: "Spider-Man",
    platform: "",
    edition: "",
    region: "",
    modelNumber: ""
  },
  visibleText: [],
  identifiers: [],
  alternatives: [],
  missingEvidence: ["Kein Titel oder Format sichtbar"],
  requestedPhotos: [],
  quickEstimate: { low: 1, fair: 2, high: 5, confidence: 20, basis: "Motivvermutung" },
  modelConfidence: 33
}, { imageCount: 1, captureIntent: "media_library" });

assert.equal(titlelessSteelbookMisreadAsCard.evidence.status, "needs_more_evidence");
assert.equal(titlelessSteelbookMisreadAsCard.evidence.categoryConflict, true);
assert.equal(titlelessSteelbookMisreadAsCard.evidence.mediaFormatMissing, true);
assert.equal(titlelessSteelbookMisreadAsCard.evidence.releaseGate, "blocked_until_media_confirmation");
assert.ok(titlelessSteelbookMisreadAsCard.evidence.score <= 25);
assert.equal(titlelessSteelbookMisreadAsCard.quickEstimate.fair, 0);
assert.ok(titlelessSteelbookMisreadAsCard.requestedPhotos.some((photo) => photo.type === "media_back"));

const confirmedSteelbook = scoreItemRecognition({
  image: { rotation: 0, usable: true, issues: [] },
  identity: {
    title: "Spider-Man: Far From Home",
    productType: "4K Ultra HD und Blu-ray Steelbook",
    category: "Film",
    brand: "Sony Pictures",
    franchise: "Spider-Man",
    platform: "4K Ultra HD / Blu-ray",
    edition: "Limited Edition Steelbook",
    region: "",
    modelNumber: ""
  },
  visibleText: ["SPIDER-MAN FAR FROM HOME", "4K ULTRA HD", "BLU-RAY", "LIMITED EDITION STEELBOOK"],
  identifiers: [{ type: "ean", value: "5050630901234" }],
  alternatives: [],
  missingEvidence: [],
  requestedPhotos: [],
  quickEstimate: { low: 25, fair: 40, high: 55, confidence: 65, basis: "Exakte Edition sichtbar" },
  modelConfidence: 94
}, { imageCount: 2, captureIntent: "media_library", barcode: "5050630901234" });

assert.equal(confirmedSteelbook.evidence.status, "ready_for_research");
assert.equal(confirmedSteelbook.evidence.categoryConflict, false);
assert.equal(confirmedSteelbook.evidence.mediaFormatMissing, false);

const visualMatches = normalizeVisualSearchMatches([
  { title: "Spider-Man: Far From Home 4K Ultra HD Limited Edition Steelbook", source: "Amazon", exact_matches: true },
  { title: "Spider-Man: Far From Home 4K Ultra HD Limited Edition Steelbook", source: "Duplicate" },
  { title: "Spider-Man Far From Home Zavvi Exclusive Lenticular Steelbook", source: "Zavvi", link: "https://example.com/item" }
]);
assert.equal(visualMatches.length, 2);
assert.equal(visualMatches[0].exact, true);
const visualPrompt = buildItemRecognitionPrompt({ captureIntent: "media_library", visualMatches });
assert.match(visualPrompt, /Bildsuchkandidaten/);
assert.match(visualPrompt, /mindestens zwei unabhaengige Treffer/);
assert.match(visualPrompt, /Far From Home/);

console.log("Item recognition evidence tests passed.");
