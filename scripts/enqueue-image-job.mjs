import { existsSync, readFileSync } from "node:fs";

loadDotEnv(".env.local");

const imageUrl = process.argv[2];
if (!imageUrl || !/^https:\/\//.test(imageUrl)) {
  console.error("Usage: node enqueue-image-job.mjs <https-image-url>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/jobs`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  },
  body: JSON.stringify({
    job_type: "analyze_image",
    status: "queued",
    priority: 100,
    payload: {
      imageUrl,
      boxId: "SV-QWEN-TEST",
      condition: "Gebraucht",
      completeness: "Ungeprueft, nur Testfoto",
      weight: 0
    },
    max_attempts: 1,
    idempotency_key: `qwen-image-smoke:${Date.now()}`
  })
});

const result = await response.json();
if (!response.ok || !result[0]?.id) {
  console.error(JSON.stringify({ status: response.status, result }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ jobId: result[0].id, status: result[0].status }));

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
