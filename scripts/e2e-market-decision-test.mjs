import { existsSync, readFileSync } from "node:fs";

loadDotEnv(".env.local");

const controlPlaneUrl = String(process.argv[2] || "https://ramrod.live").replace(/\/$/, "");
const workerToken = process.env.RAMROD_WORKER_TOKEN || "";
const localControlPlane = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(controlPlaneUrl);
if (!localControlPlane && !workerToken) throw new Error("RAMROD_WORKER_TOKEN is required for remote tests.");

const response = await fetch(`${controlPlaneUrl}/api/price-check`, {
  method: "POST",
  headers: {
    ...(workerToken ? { Authorization: `Bearer ${workerToken}` } : {}),
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    item: {
      sku: "SV-E2E-MASS-EFFECT",
      title: "Mass Effect Collector's Edition",
      category: "Video Game",
      franchise: "Mass Effect",
      condition: "Pruefen",
      operatorCondition: "Gebraucht",
      operatorCompleteness: "Ungeprüft",
      notes: "KI vermutet einen Kratzer",
      confidence: 75,
      recognitionEvidence: { score: 75 },
      low: 5,
      fair: 25,
      aggressive: 40,
      channel: "Whatnot",
      salesStrategy: {
        recommendedAction: "repair_then_sell",
        detectedDefects: ["Kratzer vermutet"],
        repairDecision: { recommendation: "needs_quote" }
      }
    }
  })
});

const result = await response.json();
if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
console.log(JSON.stringify({
  method: result.priceCheck?.method,
  fair: result.priceCheck?.fair,
  marketConfidence: result.priceCheck?.confidence,
  evidenceCount: result.priceCheck?.evidence?.length || 0,
  channel: result.decision?.channel,
  action: result.decision?.salesStrategy?.recommendedAction,
  repair: result.decision?.salesStrategy?.repairDecision?.recommendation,
  reviewRequired: result.decision?.reviewRequired,
  sourceMatchReady: result.decision?.sourceMatchReady
}, null, 2));

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
