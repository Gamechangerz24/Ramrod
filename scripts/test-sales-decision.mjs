import assert from "node:assert/strict";

import { reconcileSalesDecision } from "./lib/sales-decision.mjs";

const massEffect = reconcileSalesDecision({
  title: "Mass Effect Collector's Edition",
  category: "Video Game",
  condition: "Gebraucht",
  operatorCondition: "Gebraucht",
  confidence: 75,
  recognitionEvidence: { score: 75 },
  channel: "Whatnot",
  salesStrategy: {
    recommendedAction: "repair_then_sell",
    detectedDefects: [],
    repairDecision: { recommendation: "needs_quote" }
  }
}, {
  method: "multi-source",
  low: 5,
  fair: 23,
  aggressive: 41,
  confidence: 65,
  evidence: Array.from({ length: 6 }, (_, index) => ({ source: "eBay", price: 18 + index }))
});

assert.equal(massEffect.channel, "eBay");
assert.equal(massEffect.salesStrategy.recommendedAction, "clean_and_sell");
assert.equal(massEffect.salesStrategy.repairDecision.recommendation, "not_applicable");
assert.equal(massEffect.salesStrategy.targetPrice, 23);

const suspectedScratch = reconcileSalesDecision({
  title: "Mass Effect Collector's Edition",
  category: "Video Game",
  condition: "Pruefen",
  operatorCondition: "Gebraucht",
  notes: "KI vermutet einen Kratzer",
  confidence: 75,
  recognitionEvidence: { score: 75 },
  salesStrategy: {
    detectedDefects: ["Kratzer vermutet"],
    recommendedAction: "repair_then_sell"
  }
}, {
  method: "multi-source",
  low: 5,
  fair: 23,
  aggressive: 41,
  confidence: 65,
  evidence: [{ price: 20 }, { price: 23 }, { price: 28 }]
});

assert.equal(suspectedScratch.channel, "eBay");
assert.equal(suspectedScratch.salesStrategy.recommendedAction, "needs_inspection");
assert.equal(suspectedScratch.reviewRequired, true);

const cheapGame = reconcileSalesDecision({
  title: "FIFA 14",
  category: "Videospiel PS3",
  condition: "Gut",
  confidence: 88,
  recognitionEvidence: { score: 78 }
}, {
  method: "ebay-browse",
  low: 2,
  fair: 6,
  aggressive: 9,
  confidence: 74,
  evidence: [{ price: 5 }, { price: 6 }, { price: 8 }]
});

assert.equal(cheapGame.channel, "Whatnot");

const scratchedConsole = reconcileSalesDecision({
  title: "Sony PlayStation 3 Slim",
  category: "Konsole",
  condition: "Gebraucht, Kratzer an der Front",
  confidence: 90,
  recognitionEvidence: { score: 82 }
}, {
  method: "multi-source",
  low: 55,
  fair: 80,
  aggressive: 110,
  confidence: 78,
  evidence: [{ price: 70 }, { price: 82 }, { price: 90 }]
});

assert.equal(scratchedConsole.channel, "eBay");
assert.equal(scratchedConsole.salesStrategy.recommendedAction, "clean_and_sell");
assert.equal(scratchedConsole.salesStrategy.repairDecision.recommendation, "repair_if_cheap");

const unknown = reconcileSalesDecision({
  title: "Unbekannter Sammlerartikel",
  category: "Collectible",
  confidence: 40,
  recognitionEvidence: { score: 35 }
}, {
  method: "local-evidence",
  low: 10,
  fair: 20,
  aggressive: 30,
  confidence: 45,
  evidence: [{ price: 20 }]
});

assert.equal(unknown.channel, "Pruefen");
assert.equal(unknown.reviewRequired, true);

console.log("Sales decision guardrail tests passed.");
