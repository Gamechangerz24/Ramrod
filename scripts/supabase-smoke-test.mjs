import { existsSync, readFileSync } from "node:fs";

loadDotEnv(".env.local");

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.");
  process.exit(1);
}

const checks = [
  ["channels", "id,name,status"],
  ["customers", "id,name,slug"],
  ["items", "id,sku,title"]
];

const results = [];

for (const [table, select] of checks) {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json"
    }
  });

  const body = await response.text();
  results.push({
    table,
    status: response.status,
    ok: response.ok,
    hint: response.ok ? "reachable" : summarizeError(body)
  });
}

console.log(JSON.stringify({ supabaseUrl, results }, null, 2));

if (results.some((result) => !result.ok)) {
  process.exit(1);
}

function summarizeError(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed.message || parsed.msg || parsed.code || "unknown_error";
  } catch {
    return value.slice(0, 180);
  }
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
