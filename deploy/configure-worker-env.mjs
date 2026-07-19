import { chmodSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const [envPath, tokenPath, profile = "worker"] = process.argv.slice(2);
if (!envPath || !tokenPath) {
  console.error("Usage: node configure-worker-env.mjs <env-file> <token-file> [worker|control-plane]");
  process.exit(1);
}

const token = readFileSync(tokenPath, "utf8").trim();
if (!/^[a-f0-9]{64}$/.test(token)) {
  throw new Error("Worker token must be a 64-character hexadecimal secret.");
}

const updates = { RAMROD_WORKER_TOKEN: token };
if (profile === "worker") {
  Object.assign(updates, {
    RAMROD_WORKER_CAPABILITIES: "health_check,price_check,ebay_draft,recognize_image,analyze_image",
    RAMROD_CONTROL_PLANE_URL: "https://ramrod.live",
    RAMROD_WORKER_POLL_MS: "1000",
    RAMROD_IMAGE_ANALYSIS_PROVIDER: "ollama",
    OLLAMA_URL: "http://127.0.0.1:11434",
    OLLAMA_VISION_MODEL: "qwen3-vl:8b-instruct",
    OLLAMA_RECOGNITION_MODEL: "qwen3-vl:2b-instruct",
    OLLAMA_TIMEOUT_MS: "300000",
    OLLAMA_KEEP_ALIVE: "10m",
    RAMROD_IMAGE_CLOUD_FALLBACK: "false"
  });
} else if (profile !== "control-plane") {
  throw new Error(`Unknown profile: ${profile}`);
}

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
console.log(JSON.stringify({ profile, updatedKeys: Object.keys(updates) }));
