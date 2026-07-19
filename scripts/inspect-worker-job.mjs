import { existsSync, readFileSync } from "node:fs";

loadDotEnv(".env.local");

const jobId = process.argv[2];
if (!/^[0-9a-f-]{36}$/i.test(jobId || "")) {
  console.error("Usage: node inspect-worker-job.mjs <job-uuid>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const response = await fetch(
  `${supabaseUrl.replace(/\/$/, "")}/rest/v1/jobs?id=eq.${encodeURIComponent(jobId)}&select=id,status,attempts,result,error`,
  {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json"
    }
  }
);
const rows = await response.json();
if (!response.ok || !rows[0]) {
  console.error(JSON.stringify({ status: response.status, rows }, null, 2));
  process.exit(1);
}

const job = rows[0];
const dominant = job.result?.analysis?.dominantItem || {};
const recognition = job.result?.recognition || {};
console.log(JSON.stringify({
  id: job.id,
  status: job.status,
  attempts: job.attempts,
  provider: job.result?.provider || null,
  model: job.result?.model || null,
  durationMs: job.result?.usage?.durationMs || job.result?.worker?.durationMs || null,
  title: dominant.title || recognition.identity?.title || null,
  category: dominant.category || recognition.identity?.category || null,
  franchise: dominant.brandOrFranchise || null,
  confidence: dominant.confidence ?? recognition.evidence?.score ?? null,
  identifiedText: dominant.identifiedText || recognition.visibleText || [],
  rotation: recognition.image?.rotation ?? null,
  imageIssues: recognition.image?.issues || [],
  evidenceStatus: recognition.evidence?.status || null,
  requestedPhotos: recognition.requestedPhotos || [],
  condition: dominant.conditionObservations || null,
  completeness: dominant.completeness || null,
  priceRange: [dominant.estimatedPriceLow, dominant.estimatedPriceFair, dominant.estimatedPriceHigh],
  channel: dominant.recommendedChannel || null,
  strategy: dominant.salesStrategy?.headline || null,
  action: dominant.salesStrategy?.recommendedAction || null,
  riskFlags: dominant.riskFlags || [],
  error: job.error || null
}, null, 2));

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
