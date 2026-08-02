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
assert.equal(massEffect.salesStrategy.targetPrice, 25);
assert.equal(massEffect.salesStrategy.channelPlan.primary.name, "eBay");
assert.equal(massEffect.salesStrategy.channelPlan.primary.priceLabel, "Angebotspreis");
assert.equal(massEffect.salesStrategy.channelPlan.primary.expectedSalePrice, 23);
assert.ok(massEffect.salesStrategy.channelPlan.parallel.some((entry) => entry.name === "RAMROD Shop"));
assert.equal(massEffect.salesStrategy.channelPlan.parallel.find((entry) => entry.name === "RAMROD Shop").targetPrice, 23);
assert.equal(massEffect.salesStrategy.channelPlan.discovery.find((entry) => entry.name === "Instagram").targetPrice, 0);
assert.equal(massEffect.salesStrategy.channelPlan.fallback.name, "Whatnot");
assert.equal(massEffect.salesStrategy.channelPlan.fallback.targetPrice, 3);

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
assert.equal(cheapGame.salesStrategy.channelPlan.primary.priceLabel, "Startpreis");
assert.equal(cheapGame.salesStrategy.channelPlan.primary.targetPrice, 1);

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

const childSeat = reconcileSalesDecision({
  title: "Britax Römer Kindersitz",
  category: "Kindersitz / Baby",
  condition: "Gebraucht",
  confidence: 91,
  recognitionEvidence: { score: 86 }
}, {
  method: "multi-source",
  low: 35,
  fair: 55,
  aggressive: 75,
  confidence: 72,
  evidence: [{ price: 45 }, { price: 55 }, { price: 65 }]
});

assert.equal(childSeat.channel, "Kleinanzeigen");
assert.equal(childSeat.salesStrategy.salesFormat, "local_pickup");
assert.deepEqual(childSeat.salesStrategy.alternativeChannels, ["Facebook Marketplace"]);
assert.equal(childSeat.salesStrategy.channelPlan.primary.targetPrice, 61);

const handbag = reconcileSalesDecision({
  title: "Leder Handtasche Damen",
  category: "Mode / Handtasche",
  condition: "Sehr gut",
  confidence: 90,
  recognitionEvidence: { score: 84 }
}, {
  method: "multi-source",
  low: 30,
  fair: 50,
  aggressive: 70,
  confidence: 70,
  evidence: [{ price: 42 }, { price: 50 }, { price: 60 }]
});

assert.equal(handbag.channel, "Vinted");
assert.ok(handbag.salesStrategy.alternativeChannels.includes("Kleinanzeigen"));
assert.ok(handbag.salesStrategy.alternativeChannels.includes("Instagram"));
assert.equal(handbag.salesStrategy.channelPlan.primary.targetPrice, 55);

const householdBundle = reconcileSalesDecision({
  title: "Gemischtes Spielzeugpaket zur Abholung",
  category: "Spielzeugpaket",
  condition: "Gebraucht",
  confidence: 88,
  recognitionEvidence: { score: 80 }
}, {
  method: "multi-source",
  low: 10,
  fair: 20,
  aggressive: 30,
  confidence: 66,
  evidence: [{ price: 15 }, { price: 20 }, { price: 25 }]
});

assert.equal(householdBundle.channel, "Facebook Marketplace");

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
assert.equal(unknown.salesStrategy.channelPlan.primary.activation, "blocked");

const singleCard = decisionFor({
  title: "Pokemon Glurak Einzelkarte Base Set deutsch",
  category: "TCG Einzelkarte",
  fair: 90
});
assert.equal(singleCard.channel, "Cardmarket");
assert.equal(singleCard.salesStrategy.channelPlan.primary.name, "Cardmarket");
assert.ok(singleCard.salesStrategy.channelPlan.parallel.some((entry) => entry.name === "RAMROD Shop"));
assert.equal(singleCard.salesStrategy.channelPlan.fallback.name, "eBay");

const lego = decisionFor({
  title: "LEGO Star Wars Minifigur Set 75257",
  category: "LEGO Minifigur",
  fair: 45
});
assert.equal(lego.channel, "BrickLink");
assert.ok(lego.salesStrategy.channelPlan.discovery.some((entry) => entry.name === "Instagram"));

const vinyl = decisionFor({
  title: "Pink Floyd The Wall Vinyl LP Erstpressung",
  category: "Schallplatte Vinyl",
  fair: 65
});
assert.equal(vinyl.channel, "Discogs");
assert.equal(vinyl.salesStrategy.channelPlan.fallback.name, "eBay");

const guitar = decisionFor({
  title: "Fender Stratocaster E-Gitarre",
  category: "Musikinstrument Gitarre",
  fair: 720
});
assert.equal(guitar.channel, "Reverb");

const rareDesign = decisionFor({
  title: "Limitierte Mid Century Designobjekt Keramik",
  category: "Vintage Deko",
  fair: 420
});
assert.equal(rareDesign.channel, "Catawiki");

function decisionFor({ title, category, fair }) {
  return reconcileSalesDecision({
    title,
    category,
    condition: "Sehr gut",
    completeness: "Vollständig",
    confidence: 91,
    recognitionEvidence: { score: 88 }
  }, {
    method: "multi-source",
    low: Math.round(fair * 0.7),
    fair,
    aggressive: Math.round(fair * 1.25),
    confidence: 78,
    evidence: [{ price: fair * 0.9 }, { price: fair }, { price: fair * 1.1 }]
  });
}

console.log("Sales decision guardrail tests passed.");
