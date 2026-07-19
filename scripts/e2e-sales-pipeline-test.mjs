import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

loadDotEnv(".env.local");

const imagePath = process.argv[2];
const controlPlaneUrl = String(process.argv[3] || "https://ramrod.live").replace(/\/$/, "");
const localControlPlane = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(controlPlaneUrl);
if (!imagePath || !existsSync(imagePath)) {
  console.error("Usage: node e2e-sales-pipeline-test.mjs <image-file> [control-plane-url]");
  process.exit(1);
}

const workerToken = process.env.RAMROD_WORKER_TOKEN || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if ((!localControlPlane && !workerToken) || !supabaseUrl || !serviceRoleKey) {
  throw new Error("RAMROD_WORKER_TOKEN is required for remote tests; SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are always required.");
}

const bytes = readFileSync(imagePath);
const extension = basename(imagePath).split(".").pop()?.toLowerCase();
const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
const imageDataUrl = `data:${contentType};base64,${bytes.toString("base64")}`;
const pipelineStartedAt = Date.now();

const recognitionStartedAt = Date.now();
const recognition = await postAndResolve("/api/recognize-image", {
  imageDataUrl,
  barcode: "",
  query: ""
});

const analysisStartedAt = Date.now();
const analysis = await postAndResolve("/api/analyze-image", {
  imageDataUrl,
  boxId: "SV-PIPELINE-E2E",
  condition: "Gebraucht",
  completeness: "Ungeprüft, Pipeline-Test",
  weight: 0,
  recognition: recognition.recognition
});
analysis.item.recognition = recognition.recognition;
analysis.item.recognitionEvidence = recognition.recognition?.evidence || null;

const priceStartedAt = Date.now();
const priceResponse = await fetch(`${controlPlaneUrl}/api/price-check`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({ item: analysis.item })
});
const price = await priceResponse.json();
if (!priceResponse.ok) throw new Error(price.message || `Price check HTTP ${priceResponse.status}`);

const strategy = analysis.item?.salesStrategy || {};
console.log(JSON.stringify({
  recognition: {
    durationMs: analysisDuration(recognition, recognitionStartedAt),
    provider: recognition.provider,
    model: recognition.model,
    title: recognition.recognition?.identity?.title,
    platform: recognition.recognition?.identity?.platform,
    rotation: recognition.recognition?.image?.rotation,
    evidenceScore: recognition.recognition?.evidence?.score,
    evidenceStatus: recognition.recognition?.evidence?.status
  },
  strategy: {
    durationMs: analysisDuration(analysis, analysisStartedAt),
    provider: analysis.provider,
    model: analysis.model,
    title: analysis.item?.title,
    channel: analysis.item?.channel,
    action: strategy.recommendedAction,
    repair: strategy.repairDecision?.recommendation,
    targetPrice: strategy.targetPrice,
    confidence: analysis.item?.confidence
  },
  market: {
    durationMs: Date.now() - priceStartedAt,
    method: price.priceCheck?.method,
    low: price.priceCheck?.low,
    fair: price.priceCheck?.fair,
    aggressive: price.priceCheck?.aggressive,
    confidence: price.priceCheck?.confidence,
    evidenceCount: price.priceCheck?.evidence?.length || 0
  },
  decision: {
    channel: price.decision?.channel,
    action: price.decision?.salesStrategy?.recommendedAction,
    repair: price.decision?.salesStrategy?.repairDecision?.recommendation,
    targetPrice: price.decision?.salesStrategy?.targetPrice,
    reviewRequired: price.decision?.reviewRequired,
    sourceMatchReady: price.decision?.sourceMatchReady
  },
  totalDurationMs: Date.now() - pipelineStartedAt
}, null, 2));

async function postAndResolve(path, payload) {
  const response = await fetch(`${controlPlaneUrl}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  if (response.status === 200) return body;
  if (response.status !== 202 || !body.job?.id) {
    throw new Error(body.message || `${path} HTTP ${response.status}`);
  }
  return waitForJob(body.job.id);
}

async function waitForJob(jobId) {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/jobs?id=eq.${encodeURIComponent(jobId)}&select=id,status,result,error`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
    );
    const rows = await response.json();
    const job = rows[0];
    if (!response.ok || !job) throw new Error(`Job ${jobId} could not be read.`);
    if (job.status === "failed") throw new Error(job.error?.message || `Job ${jobId} failed.`);
    if (job.status === "succeeded") return job.result;
  }
  throw new Error(`Job ${jobId} timed out.`);
}

function authHeaders() {
  return {
    ...(workerToken ? { Authorization: `Bearer ${workerToken}` } : {}),
    "Content-Type": "application/json"
  };
}

function analysisDuration(result, startedAt) {
  return result.durationMs || result.usage?.durationMs || result.worker?.durationMs || Date.now() - startedAt;
}

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
