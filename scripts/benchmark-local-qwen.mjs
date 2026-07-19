import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  applyAnalysisGuardrails,
  buildItemAnalysisPrompt,
  itemAnalysisSchema
} from "./lib/item-analysis.mjs";

const args = parseArgs(process.argv.slice(2));
const manifestPath = args.manifest || "data/drive-demo-files.json";
const referencePath = args.reference || "data/drive-demo-analysis.json";
const outputPath = args.output || "data/qwen-openai-benchmark.json";
const imageDir = args["image-dir"] || "";
const indexes = parseIndexes(args.indexes || "");
const ollamaUrl = String(args["ollama-url"] || process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const model = args.model || process.env.OLLAMA_VISION_MODEL || "qwen3-vl:8b-instruct";
const timeoutMs = clampNumber(args.timeout || process.env.OLLAMA_TIMEOUT_MS, 30_000, 900_000, 300_000);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const reference = JSON.parse(await readFile(referencePath, "utf8"));
const selectedIndexes = indexes.length
  ? indexes
  : manifest.files.map((_, index) => index + 1);
const previous = await readExistingOutput(outputPath);
const completed = new Map((previous?.results || []).map((result) => [result.index, result]));

const benchmark = {
  benchmarkVersion: 1,
  createdAt: previous?.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  localModel: model,
  referenceModel: reference.model || "unknown",
  sourceManifest: manifestPath,
  referenceSource: referencePath,
  selectedIndexes,
  count: selectedIndexes.length,
  completed: completed.size,
  results: [...completed.values()].sort((left, right) => left.index - right.index)
};

await persist();

for (const index of selectedIndexes) {
  if (completed.has(index)) {
    console.log(`[${index}] already completed`);
    continue;
  }

  const file = manifest.files[index - 1];
  if (!file) throw new Error(`Manifest does not contain index ${index}.`);

  const referenceResult = findReference(reference, file, index);
  const imagePath = imageDir
    ? path.join(imageDir, path.basename(file.normalizedLocalPath || file.localPath || file.name))
    : (file.normalizedLocalPath || file.localPath);
  const image = await readFile(imagePath);
  const startedAt = Date.now();

  console.log(`[${index}/${manifest.files.length}] ${file.name} -> ${model}`);

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      keep_alive: "15m",
      format: itemAnalysisSchema(),
      messages: [{
        role: "user",
        content: buildItemAnalysisPrompt(),
        images: [image.toString("base64")]
      }],
      options: {
        temperature: 0.1,
        num_ctx: 16384
      }
    })
  });

  const body = JSON.parse(await response.text());
  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${body?.error || "unknown error"}`);
  }

  const rawAnalysis = JSON.parse(String(body?.message?.content || ""));
  const guardedAnalysis = applyAnalysisGuardrails(rawAnalysis);
  const qwenItem = guardedAnalysis.dominantItem;
  const referenceItem = referenceResult?.analysis?.dominantItem || null;
  const durationMs = Date.now() - startedAt;
  const result = {
    index,
    fileName: file.name,
    imagePath,
    reference: referenceItem ? summarizeItem(referenceItem) : null,
    qwen: summarizeItem(qwenItem),
    workflow: guardedAnalysis.workflow,
    comparison: referenceItem ? compareItems(referenceItem, qwenItem) : null,
    usage: {
      durationMs,
      loadDurationMs: nanosecondsToMilliseconds(body.load_duration),
      promptTokens: numberOrNull(body.prompt_eval_count),
      outputTokens: numberOrNull(body.eval_count)
    },
    analyzedAt: new Date().toISOString()
  };

  completed.set(index, result);
  benchmark.results = [...completed.values()].sort((left, right) => left.index - right.index);
  benchmark.completed = completed.size;
  benchmark.updatedAt = new Date().toISOString();
  await persist();

  console.log(`  reference: ${referenceItem?.title || "-"}`);
  console.log(`  qwen:      ${qwenItem.title} (${qwenItem.confidence}%, ${Math.round(durationMs / 1000)}s)`);
}

console.log(`Benchmark complete: ${benchmark.completed}/${benchmark.count} -> ${outputPath}`);

async function persist() {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(benchmark, null, 2)}\n`);
}

function summarizeItem(item) {
  return {
    title: item.title,
    category: item.category,
    brandOrFranchise: item.brandOrFranchise,
    identifiedText: item.identifiedText || [],
    confidence: Number(item.confidence) || 0,
    priceLow: Number(item.estimatedPriceLow) || 0,
    priceFair: Number(item.estimatedPriceFair) || 0,
    priceHigh: Number(item.estimatedPriceHigh) || 0,
    recommendedChannel: item.recommendedChannel,
    riskFlags: item.riskFlags || [],
    salesAction: item.salesStrategy?.recommendedAction || null
  };
}

function compareItems(referenceItem, candidateItem) {
  const title = compareText(referenceItem.title, candidateItem.title);
  const category = compareText(referenceItem.category, candidateItem.category);
  const franchise = compareText(referenceItem.brandOrFranchise, candidateItem.brandOrFranchise);
  return {
    titleTokenJaccard: title.jaccard,
    referenceTitleCoverage: title.leftCoverage,
    qwenTitleCoverage: title.rightCoverage,
    categoryTokenJaccard: category.jaccard,
    franchiseTokenJaccard: franchise.jaccard,
    confidenceDelta: (Number(candidateItem.confidence) || 0) - (Number(referenceItem.confidence) || 0),
    fairPriceDelta: (Number(candidateItem.estimatedPriceFair) || 0) - (Number(referenceItem.estimatedPriceFair) || 0)
  };
}

function compareText(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return {
    jaccard: round(union ? intersection / union : 0),
    leftCoverage: round(leftTokens.size ? intersection / leftTokens.size : 0),
    rightCoverage: round(rightTokens.size ? intersection / rightTokens.size : 0)
  };
}

function tokenize(value) {
  const stopWords = new Set(["der", "die", "das", "the", "a", "an", "and", "mit", "im", "in", "von", "und", "fuer", "für"]);
  return new Set(String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token)));
}

function findReference(referenceData, file, index) {
  return referenceData.results?.find((result) => result.source?.name === file.name)
    || referenceData.results?.[index - 1]
    || null;
}

async function readExistingOutput(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    parsed[key] = values[index + 1] && !values[index + 1].startsWith("--")
      ? values[++index]
      : true;
  }
  return parsed;
}

function parseIndexes(value) {
  return String(value || "")
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
}

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function nanosecondsToMilliseconds(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number / 1_000_000) : null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
