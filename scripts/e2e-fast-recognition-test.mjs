import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

loadDotEnv(".env.local");

const imagePath = process.argv[2];
const controlPlaneUrl = String(process.argv[3] || process.env.RAMROD_CONTROL_PLANE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
if (!imagePath || !existsSync(imagePath)) {
  console.error("Usage: node e2e-fast-recognition-test.mjs <image-file> [control-plane-url]");
  process.exit(1);
}

const workerToken = process.env.RAMROD_WORKER_TOKEN || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const bytes = readFileSync(imagePath);
const extension = basename(imagePath).split(".").pop()?.toLowerCase();
const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
const startedAt = Date.now();
const response = await fetch(`${controlPlaneUrl}/api/recognize-image`, {
  method: "POST",
  headers: {
    ...(workerToken ? { Authorization: `Bearer ${workerToken}` } : {}),
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    imageDataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
    barcode: "",
    query: ""
  })
});
const initial = await response.json();
if (response.status === 200 && initial.recognition) {
  printResult(initial, Date.now() - startedAt);
  process.exit(0);
}
if (response.status !== 202 || !initial.job?.id) {
  console.error(JSON.stringify({ status: response.status, initial }, null, 2));
  process.exit(1);
}

const jobId = initial.job.id;
const deadline = Date.now() + 4 * 60 * 1000;
while (Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const jobResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/jobs?id=eq.${encodeURIComponent(jobId)}&select=id,status,attempts,result,error`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  const jobs = await jobResponse.json();
  const job = jobs[0];
  if (!job || !jobResponse.ok) throw new Error("Queued recognition job could not be read.");
  if (job.status === "failed") throw new Error(job.error?.message || "Fast recognition worker failed.");
  if (job.status !== "succeeded") continue;
  printResult(job.result, Date.now() - startedAt, jobId);
  process.exit(0);
}

throw new Error("Timed out waiting for fast recognition.");

function printResult(result, wallDurationMs, jobId = null) {
  const recognition = result.recognition || {};
  console.log(JSON.stringify({
    jobId,
    provider: result.provider,
    model: result.model,
    modelDurationMs: result.durationMs || result.usage?.durationMs || result.worker?.durationMs || null,
    wallDurationMs,
    title: recognition.identity?.title,
    productType: recognition.identity?.productType,
    platform: recognition.identity?.platform,
    rotation: recognition.image?.rotation,
    imageIssues: recognition.image?.issues,
    visibleText: recognition.visibleText,
    evidence: recognition.evidence,
    requestedPhotos: recognition.requestedPhotos
  }, null, 2));
}

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
