import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

loadDotEnv(".env.local");

const imagePath = process.argv[2];
if (!imagePath || !existsSync(imagePath)) {
  console.error("Usage: node e2e-local-qwen-test.mjs <image-file>");
  process.exit(1);
}

const workerToken = process.env.RAMROD_WORKER_TOKEN || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!workerToken || !supabaseUrl || !serviceRoleKey) {
  throw new Error("RAMROD_WORKER_TOKEN, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const bytes = readFileSync(imagePath);
const extension = basename(imagePath).split(".").pop()?.toLowerCase();
const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
const response = await fetch("https://ramrod.live/api/analyze-image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${workerToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    imageDataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
    boxId: "SV-QWEN-E2E",
    condition: "Gebraucht",
    completeness: "Ungeprueft, E2E-Test",
    weight: 0
  })
});
const queued = await response.json();
if (response.status !== 202 || !queued.job?.id) {
  console.error(JSON.stringify({ status: response.status, queued }, null, 2));
  process.exit(1);
}

const jobId = queued.job.id;
const deadline = Date.now() + 7 * 60 * 1000;
while (Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const jobResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/jobs?id=eq.${encodeURIComponent(jobId)}&select=id,status,attempts,result,error`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  const jobs = await jobResponse.json();
  const job = jobs[0];
  if (!job || !jobResponse.ok) throw new Error("Queued job could not be read.");
  if (job.status === "failed") throw new Error(job.error?.message || "Qwen worker failed.");
  if (job.status !== "succeeded") continue;

  const dominant = job.result?.analysis?.dominantItem || {};
  console.log(JSON.stringify({
    jobId,
    status: job.status,
    provider: job.result?.provider,
    model: job.result?.model,
    durationMs: job.result?.usage?.durationMs,
    title: dominant.title,
    confidence: dominant.confidence,
    channel: dominant.recommendedChannel,
    action: dominant.salesStrategy?.recommendedAction,
    nextAction: job.result?.analysis?.workflow?.nextAction
  }, null, 2));
  process.exit(0);
}

throw new Error("Timed out waiting for the Qwen worker.");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
