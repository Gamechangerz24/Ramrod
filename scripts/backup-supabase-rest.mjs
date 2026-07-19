import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

loadDotEnv(".env.local");

const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const tables = [
  "customers",
  "boxes",
  "items",
  "item_images",
  "price_checks",
  "channels",
  "campaigns",
  "campaign_items",
  "listings",
  "sales",
  "shipments",
  "audit_events",
  "workers",
  "jobs",
  "organization_memberships",
  "platform_admins",
  "locations",
  "seller_profiles",
  "consignment_contracts"
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDirectory = resolve("backups", `supabase-${stamp}`);
await mkdir(outputDirectory, { recursive: true, mode: 0o700 });

const manifest = {
  createdAt: new Date().toISOString(),
  projectUrl: supabaseUrl,
  tables: []
};

for (const table of tables) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      Prefer: "count=exact"
    }
  });

  if (!response.ok) {
    const message = summarizeError(await response.text());
    manifest.tables.push({ table, status: "unavailable", httpStatus: response.status, message });
    continue;
  }

  const rows = await response.json();
  await writeFile(`${outputDirectory}/${table}.json`, `${JSON.stringify(rows, null, 2)}\n`, { mode: 0o600 });
  manifest.tables.push({ table, status: "backed_up", rows: rows.length });
}

await writeFile(`${outputDirectory}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ outputDirectory, tables: manifest.tables }, null, 2));

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
