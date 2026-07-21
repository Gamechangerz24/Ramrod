#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { arch, hostname, platform } from "node:os";
import { executeSafeAgentStep, safeAgentStepKeys } from "./lib/agent-executor.mjs";

loadDotEnv(".env.local");

const config = {
  controlPlaneUrl: String(process.env.RAMROD_CONTROL_PLANE_URL || "http://127.0.0.1:3001").replace(/\/+$/, ""),
  token: String(process.env.RAMROD_AGENT_TOKEN || ""),
  organizationId: String(process.env.RAMROD_AGENT_ORGANIZATION_ID || "").trim(),
  workerKey: String(process.env.RAMROD_AGENT_WORKER_KEY || defaultWorkerKey()),
  workerName: String(process.env.RAMROD_AGENT_WORKER_NAME || `RAMROD Safe Runner ${hostname()}`),
  pollMs: clamp(process.env.RAMROD_AGENT_POLL_MS, 500, 60_000, 3000),
  leaseSeconds: clamp(process.env.RAMROD_AGENT_LEASE_SECONDS, 30, 3600, 180),
  once: process.argv.includes("--once")
};

if (!config.token) {
  console.error("RAMROD_AGENT_TOKEN is required.");
  process.exit(1);
}

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

log("agent_runner_started", {
  workerKey: config.workerKey,
  organizationId: config.organizationId || "all",
  stepKeys: safeAgentStepKeys,
  once: config.once
});

do {
  let claim;
  try {
    claim = await controlPlaneRequest("/api/agent-steps/claim", {
      method: "POST",
      body: JSON.stringify({
        organizationId: config.organizationId || null,
        workerKey: config.workerKey,
        workerName: config.workerName,
        executionModes: ["ramrod", "agent"],
        actionTypes: ["read", "research", "prepare"],
        stepKeys: safeAgentStepKeys,
        leaseSeconds: config.leaseSeconds,
        metadata: { runtime: "node", host: hostname(), platform: platform(), arch: arch(), runner: "safe" }
      })
    });
  } catch (error) {
    log("agent_claim_failed", { message: safeMessage(error) });
    if (config.once) {
      process.exitCode = 1;
      break;
    }
    await sleep(config.pollMs);
    continue;
  }

  if (!claim?.step) {
    if (config.once) break;
    await sleep(config.pollMs);
    continue;
  }

  await executeClaim(claim);
  if (config.once) break;
} while (!stopping);

log("agent_runner_stopped", { workerKey: config.workerKey });

async function executeClaim(claim) {
  const step = claim.step;
  const startedAt = Date.now();
  const heartbeat = setInterval(() => {
    controlPlaneRequest(`/api/agent-steps/${step.id}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ workerKey: config.workerKey, leaseSeconds: config.leaseSeconds })
    }).catch((error) => log("agent_heartbeat_failed", { stepId: step.id, message: safeMessage(error) }));
  }, Math.max(10, Math.floor(config.leaseSeconds / 3)) * 1000);
  heartbeat.unref();

  log("agent_step_started", { runId: step.agent_run_id, stepId: step.id, stepKey: step.step_key, attempt: step.attempts });
  try {
    const output = await executeSafeAgentStep(claim);
    await controlPlaneRequest(`/api/agent-steps/${step.id}/complete`, {
      method: "POST",
      body: JSON.stringify({
        workerKey: config.workerKey,
        output: { ...output, durationMs: Date.now() - startedAt }
      })
    });
    log("agent_step_succeeded", { runId: step.agent_run_id, stepId: step.id, stepKey: step.step_key, durationMs: Date.now() - startedAt });
  } catch (error) {
    await controlPlaneRequest(`/api/agent-steps/${step.id}/fail`, {
      method: "POST",
      body: JSON.stringify({
        workerKey: config.workerKey,
        retryDelaySeconds: retryDelay(step.attempts),
        error: {
          code: error.code || "agent_step_failed",
          message: safeMessage(error),
          retryable: error.retryable !== false,
          failedAt: new Date().toISOString()
        }
      })
    }).catch((finishError) => log("agent_failure_persist_failed", { stepId: step.id, message: safeMessage(finishError) }));
    log("agent_step_failed", { runId: step.agent_run_id, stepId: step.id, stepKey: step.step_key, message: safeMessage(error) });
  } finally {
    clearInterval(heartbeat);
  }
}

async function controlPlaneRequest(path, options = {}) {
  const response = await fetch(`${config.controlPlaneUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...(config.organizationId ? { "X-Ramrod-Organization": config.organizationId } : {}),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(30_000)
  });
  const text = await response.text();
  const body = text ? parseJson(text) : {};
  if (!response.ok) {
    const error = new Error(body.message || body.error || `RAMROD HTTP ${response.status}`);
    error.code = body.error || "control_plane_error";
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }
  return body;
}

function defaultWorkerKey() {
  return `agent-safe-${createHash("sha256").update(`${hostname()}:${platform()}:${arch()}`).digest("hex").slice(0, 16)}`;
}

function retryDelay(attempts) {
  return Math.min(3600, 30 * (2 ** Math.max(0, Number(attempts || 1) - 1)));
}

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback;
}

function parseJson(value) {
  try { return JSON.parse(value); } catch { return { message: String(value).slice(0, 500) }; }
}

function safeMessage(error) {
  return String(error?.message || error || "Unknown agent runner error")
    .replace(/(?:sk|k)-proj-[A-Za-z0-9_-]+/g, "[redacted-api-key]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .slice(0, 1000);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function log(event, details = {}) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...details }));
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
