import { existsSync, readFileSync } from "node:fs";

loadDotEnv(".env.local");

const email = String(process.argv[2] || "").trim().toLowerCase();
const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!email || !email.includes("@")) throw new Error("Usage: npm run supabase:set-admin -- user@example.com");
if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

const usersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
  headers: adminHeaders()
});
const usersBody = await usersResponse.json();
if (!usersResponse.ok) throw new Error(usersBody.message || `Could not list users: HTTP ${usersResponse.status}`);

const user = (usersBody.users || []).find((entry) => String(entry.email || "").toLowerCase() === email);
if (!user) throw new Error(`No Supabase Auth user found for ${email}.`);

const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
  method: "PUT",
  headers: { ...adminHeaders(), "Content-Type": "application/json" },
  body: JSON.stringify({
    app_metadata: {
      ...(user.app_metadata || {}),
      ramrod_role: "admin"
    }
  })
});
const updatedUser = await updateResponse.json();
if (!updateResponse.ok) throw new Error(updatedUser.message || `Could not update user: HTTP ${updateResponse.status}`);

const platformAdminResponse = await fetch(`${supabaseUrl}/rest/v1/platform_admins?on_conflict=user_id`, {
  method: "POST",
  headers: {
    ...adminHeaders(),
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal"
  },
  body: JSON.stringify({ user_id: user.id, role: "admin", active: true })
});

console.log(JSON.stringify({
  email,
  appMetadataRole: updatedUser.app_metadata?.ramrod_role || "",
  platformAdminRow: platformAdminResponse.ok ? "upserted" : "pending_migration"
}, null, 2));

function adminHeaders() {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json"
  };
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
