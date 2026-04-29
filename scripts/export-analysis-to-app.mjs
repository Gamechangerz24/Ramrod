import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2] || "data/drive-demo-analysis.json";
const outputPath = process.argv[3] || "data/app-import-items.json";

const data = JSON.parse(await readFile(inputPath, "utf8"));

const items = data.results.map((result, index) => {
  const item = result.analysis.dominantItem;
  const workflow = result.analysis.workflow;
  return {
    id: `ai-${String(index + 1).padStart(4, "0")}`,
    sku: `SV-DEMO-${String(index + 1).padStart(4, "0")}`,
    boxId: "SV-DEMO",
    title: item.title,
    category: item.category,
    franchise: item.brandOrFranchise,
    condition: workflow.needsHumanReview ? "Pruefen" : "Gebraucht",
    completeness: item.completeness,
    confidence: item.confidence,
    low: item.estimatedPriceLow,
    fair: item.estimatedPriceFair,
    aggressive: item.estimatedPriceHigh,
    channel: item.recommendedChannel,
    stage: workflow.needsHumanReview ? "Gescannt" : "Freigabe",
    weight: 0,
    image: result.source.normalizedLocalPath || result.source.localPath,
    notes: [
      item.conditionObservations,
      item.riskFlags.length ? `Risiken: ${item.riskFlags.join("; ")}` : ""
    ]
      .filter(Boolean)
      .join(" "),
    research: item.researchQueries.map((query) => ({
      source: "OpenAI Query",
      label: query,
      price: item.estimatedPriceFair,
      age: "KI"
    })),
    whatnotScript: item.whatnotScript,
    listingDraft: item.listingDraft,
    otherVisibleItems: result.analysis.otherVisibleItems,
    sourceFile: result.source.name,
    sourceDriveUrl: result.source.driveUrl,
    sourceType: "batch_openai",
    analysisModel: data.model
  };
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(
    {
      source: inputPath,
      model: data.model,
      createdAt: new Date().toISOString(),
      count: items.length,
      items
    },
    null,
    2
  )
);

console.log(`Exported ${items.length} app items -> ${outputPath}`);
