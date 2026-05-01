import { readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.env.SCANAPP_TEST_BASE_URL || "http://127.0.0.1:3001";
const inputPath = process.argv[2] || "data/app-import-items.json";
const limit = Number(process.env.SCANAPP_TEST_LIMIT || process.argv[3] || 10);
const outputPath = process.env.SCANAPP_TEST_OUTPUT || "";

const payload = JSON.parse(readFileSync(inputPath, "utf8"));
const items = (payload.items || []).slice(0, limit);
const rows = [];

for (const item of items) {
  const response = await fetch(`${baseUrl}/api/price-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item })
  });
  const result = await response.json();
  if (!response.ok) {
    rows.push({
      sku: item.sku,
      title: item.title,
      error: result.message || result.error || `HTTP ${response.status}`
    });
    continue;
  }

  rows.push({
    sku: item.sku,
    title: item.title,
    category: item.category,
    provider: result.provider,
    before: {
      low: Math.round(Number(item.low) || 0),
      fair: Math.round(Number(item.fair) || 0),
      aggressive: Math.round(Number(item.aggressive) || 0),
      confidence: Math.round(Number(item.confidence) || 0)
    },
    after: {
      low: result.priceCheck.low,
      fair: result.priceCheck.fair,
      aggressive: result.priceCheck.aggressive,
      confidence: result.priceCheck.confidence
    },
    deltaFair: result.priceCheck.fair - Math.round(Number(item.fair) || 0),
    evidenceCount: result.priceCheck.evidence.length,
    evidence: result.priceCheck.evidence.map((entry) => ({
      source: entry.source,
      title: entry.title,
      price: entry.price,
      status: entry.status,
      matchScore: entry.matchScore
    })),
    notes: result.priceCheck.notes
  });
}

const summary = {
  baseUrl,
  inputPath,
  tested: rows.length,
  providerCounts: rows.reduce((acc, row) => {
    const key = row.provider || "error";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}),
  averageFairDelta: Math.round(rows.reduce((sum, row) => sum + (row.deltaFair || 0), 0) / Math.max(1, rows.filter((row) => !row.error).length)),
  errors: rows.filter((row) => row.error).length
};

const report = { summary, rows };

if (outputPath) {
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
