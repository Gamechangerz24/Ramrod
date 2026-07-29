import { chmodSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const envPath = process.argv[2];
if (!envPath) {
  console.error("Usage: node update-production-env.mjs <production-env-file>");
  process.exit(1);
}

const updates = {
  OPENAI_MODEL: "gpt-5.6-terra",
  OPENAI_RECOGNITION_MODEL: "gpt-5.4-mini",
  OPENAI_RECOGNITION_FALLBACK_MODEL: "gpt-5.6-luna",
  OPENAI_STRATEGY_MODEL: "gpt-5.6-terra",
  OPENAI_RECOGNITION_REASONING_EFFORT: "none",
  OPENAI_STRATEGY_REASONING_EFFORT: "none",
  OPENAI_RECOGNITION_IMAGE_DETAIL: "low",
  RAMROD_SELF_SERVICE_SIGNUP: "true",
  SHOP_PREVIEW_MODE: "false",
  SHOP_HOST_ROUTING: "true",
  SHOP_ORGANIZATION_SLUG: "creators",
  RAMROD_PUBLIC_APP_URL: "https://admin.ramrod.live",
  RAMROD_SECRET_STORE_PATH: "/home/node/.ramrod/credentials.enc.json"
};

const ensureKeys = [
  "RAMROD_AGENT_TOKEN",
  "RAMROD_AGENT_ORGANIZATION_ID",
  "RAMROD_AGENT_WORKER_KEY",
  "RAMROD_AGENT_WORKER_NAME",
  "RAMROD_AGENT_EXECUTION_MODES",
  "RAMROD_AGENT_ACTION_TYPES",
  "RAMROD_AGENT_STEP_KEYS",
  "RAMROD_TELEGRAM_BOT_TOKEN",
  "RAMROD_TELEGRAM_WEBHOOK_SECRET",
  "RAMROD_TELEGRAM_APPROVAL_CHAT_ID",
  "RAMROD_TELEGRAM_ALLOWED_CHAT_IDS",
  "EBAY_RUNAME",
  "EBAY_OAUTH_SCOPES"
];

const generatedSecretKeys = [
  "RAMROD_SECRET_ENCRYPTION_KEY",
  "RAMROD_OAUTH_STATE_SECRET"
];

let text = readFileSync(envPath, "utf8");
for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  text = pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
}

for (const key of ensureKeys) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (!pattern.test(text)) text = `${text.trimEnd()}\n${key}=\n`;
}

for (const key of generatedSecretKeys) {
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const match = text.match(pattern);
  if (!match || !String(match[1] || "").trim()) {
    const line = `${key}=${randomBytes(32).toString("hex")}`;
    text = pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
  }
}

const temporaryPath = `${envPath}.tmp`;
writeFileSync(temporaryPath, text, { mode: 0o600 });
chmodSync(temporaryPath, 0o600);
renameSync(temporaryPath, envPath);
console.log(JSON.stringify({ updatedKeys: Object.keys(updates), ensuredKeys: ensureKeys, generatedSecretKeys }));
