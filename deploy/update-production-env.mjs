import { chmodSync, readFileSync, renameSync, writeFileSync } from "node:fs";

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
  OPENAI_RECOGNITION_IMAGE_DETAIL: "low"
};

let text = readFileSync(envPath, "utf8");
for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  text = pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
}

const temporaryPath = `${envPath}.tmp`;
writeFileSync(temporaryPath, text, { mode: 0o600 });
chmodSync(temporaryPath, 0o600);
renameSync(temporaryPath, envPath);
console.log(JSON.stringify({ updatedKeys: Object.keys(updates) }));
