import assert from "node:assert/strict";

import {
  estimatePriceFromEvidence,
  evaluateComparableEvidence
} from "./lib/price-evidence.mjs";

const massEffect = {
  title: "Mass Effect 2",
  category: "Videospiel",
  condition: "Gebraucht",
  completeness: "Vollstaendig",
  confidence: 88,
  recognitionEvidence: { score: 84 },
  recognition: {
    identity: {
      title: "Mass Effect 2",
      platform: "PlayStation 3",
      edition: "",
      region: "PAL",
      modelNumber: ""
    },
    identifiers: []
  }
};

const massEffectEvidence = [
  sold("Mass Effect 2 PS3 PAL komplett mit Anleitung", 12),
  sold("Mass Effect 2 PlayStation 3 gebraucht", 14),
  sold("Mass Effect 2 PS3 CIB", 13),
  active("Mass Effect 2 PS3 gebraucht", 19),
  active("Mass Effect 2 PS3 neu sealed", 38),
  sold("Mass Effect 2 PS4", 25),
  active("Mass Effect 2 PS3 leere Box only", 30),
  active("Dragon Age 2 PS3", 18)
];

const evaluatedMassEffect = evaluateComparableEvidence(massEffect, massEffectEvidence);
assert.equal(evaluatedMassEffect.accepted.length, 5);
assert.equal(evaluatedMassEffect.rejected.length, 3);
assert.ok(evaluatedMassEffect.rejected.some((entry) => entry.rejectionReason.includes("Falsche Plattform")));
assert.ok(evaluatedMassEffect.rejected.some((entry) => entry.rejectionReason.includes("Zubehoer")));
assert.ok(evaluatedMassEffect.rejected.some((entry) => entry.rejectionReason.includes("Produktname")));

const massEffectPrice = estimatePriceFromEvidence(massEffect, evaluatedMassEffect.accepted);
assert.equal(massEffectPrice.calculation.soldCount, 3);
assert.equal(massEffectPrice.calculation.activeCount, 2);
assert.ok(massEffectPrice.fair >= 12 && massEffectPrice.fair <= 16);
assert.ok(massEffectPrice.confidence >= 55 && massEffectPrice.confidence <= 86);

const joyCons = {
  title: "Nintendo Switch Joy-Con Neon Rot Blau Paar",
  category: "Controller",
  condition: "Gebraucht",
  completeness: "Vollstaendig",
  confidence: 90,
  recognitionEvidence: { score: 86 },
  recognition: {
    identity: {
      title: "Nintendo Switch Joy-Con Neon Rot Blau Paar",
      platform: "Nintendo Switch",
      edition: "",
      region: "",
      modelNumber: ""
    },
    identifiers: []
  }
};

const evaluatedJoyCons = evaluateComparableEvidence(joyCons, [
  active("Nintendo Switch Joy-Con Neon Rot Blau Paar gebraucht", 48),
  active("Nintendo Switch Joy-Con Controller Paar Rot Blau", 52),
  active("Nintendo Switch Joy-Con Huelle Case Only", 8),
  active("PS4 Controller Rot Blau", 25)
]);
assert.equal(evaluatedJoyCons.accepted.length, 2);
assert.equal(evaluatedJoyCons.rejected.length, 2);

const joyConPrice = estimatePriceFromEvidence(joyCons, evaluatedJoyCons.accepted);
assert.equal(joyConPrice.calculation.soldCount, 0);
assert.equal(joyConPrice.calculation.activeCount, 2);
assert.ok(joyConPrice.fair >= 39 && joyConPrice.fair <= 45);
assert.ok(joyConPrice.confidence <= 50);

const modelOnly = evaluateComparableEvidence({
  title: "Unbekannte Actionfigur",
  fair: 30,
  confidence: 80
}, [
  {
    source: "RAMROD",
    title: "KI Fair Estimate",
    price: 30,
    status: "model_hint"
  }
]);
const modelPrice = estimatePriceFromEvidence({ fair: 30, confidence: 80 }, modelOnly.accepted);
assert.equal(modelPrice.fair, 30);
assert.ok(modelPrice.confidence <= 35);

console.log("price evidence tests passed");

function sold(title, price) {
  return {
    source: "SerpApi eBay Sold",
    title,
    price,
    condition: "Gebraucht",
    status: "sold_listing"
  };
}

function active(title, price) {
  return {
    source: "eBay Browse",
    title,
    price,
    condition: title,
    status: "active_listing"
  };
}
