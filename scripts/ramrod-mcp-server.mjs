#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { agentTypeIds } from "./lib/agent-control.mjs";

const controlPlaneUrl = String(process.env.RAMROD_CONTROL_PLANE_URL || "").replace(/\/+$/, "");
const agentToken = String(process.env.RAMROD_AGENT_TOKEN || "");
const organizationId = String(process.env.RAMROD_ORGANIZATION_ID || "");
const workerKey = String(process.env.RAMROD_AGENT_WORKER_KEY || "hermes-mcp");
const workerName = String(process.env.RAMROD_AGENT_WORKER_NAME || "Hermes MCP Runner");
const executionModes = parseList(process.env.RAMROD_AGENT_EXECUTION_MODES || "browser,api,connector");
const actionTypes = parseList(process.env.RAMROD_AGENT_ACTION_TYPES || "read,research,prepare");
const stepKeys = parseList(process.env.RAMROD_AGENT_STEP_KEYS || "inspect_requirements,prepare_account_data,verify_connector,prepare_listing,verify_listing,prepare_channel_drafts,monitor_distribution,measure_campaign,verify_order");
const leaseSeconds = clampNumber(process.env.RAMROD_AGENT_LEASE_SECONDS, 30, 3600, 900);

if (!controlPlaneUrl || !agentToken || !organizationId) {
  console.error("RAMROD_CONTROL_PLANE_URL, RAMROD_AGENT_TOKEN and RAMROD_ORGANIZATION_ID are required.");
  process.exit(1);
}

const server = new McpServer({
  name: "ramrod-agent-control",
  version: "0.1.0"
});

server.registerTool("ramrod_get_agent_control", {
  title: "RAMROD Agent Control lesen",
  description: "Liest Missionen, Schritte, Kanalverbindungen und offene menschliche Freigaben des ausgewählten Kundenbereichs.",
  inputSchema: {}
}, async () => toolResult(await controlPlaneRequest("/api/agent-control")));

server.registerTool("ramrod_create_mission", {
  title: "RAMROD Mission anlegen",
  description: "Legt einen nachvollziehbaren Agentenauftrag an. Externe Schreibaktionen bleiben blockiert, bis ein Mensch sie in RAMROD oder Telegram freigibt.",
  inputSchema: {
    agentType: z.enum(agentTypeIds),
    objective: z.string().min(8).max(800),
    channelId: z.string().max(120).optional(),
    itemId: z.string().uuid().optional()
  }
}, async (input) => toolResult(await controlPlaneRequest("/api/agent-runs", {
  method: "POST",
  body: JSON.stringify(input)
})));

server.registerTool("ramrod_request_approval", {
  title: "Menschliche Freigabe anfordern",
  description: "Fordert für einen bereits geplanten freigabepflichtigen Schritt eine Entscheidung an. Dieses Tool kann keine Freigabe erteilen.",
  inputSchema: {
    runId: z.string().uuid(),
    stepId: z.string().uuid(),
    summary: z.string().min(8).max(240).optional()
  }
}, async (input) => toolResult(await controlPlaneRequest("/api/approval-requests", {
  method: "POST",
  body: JSON.stringify(input)
})));

server.registerTool("ramrod_claim_step", {
  title: "Nächsten RAMROD-Schritt übernehmen",
  description: "Übernimmt atomar den nächsten freigegebenen und zur Hermes-Allowlist passenden Schritt. Nicht freigegebene externe Aktionen bleiben gesperrt.",
  inputSchema: {}
}, async () => toolResult(await controlPlaneRequest("/api/agent-steps/claim", {
  method: "POST",
  body: JSON.stringify({
    organizationId,
    workerKey,
    workerName,
    executionModes,
    actionTypes,
    stepKeys,
    leaseSeconds,
    metadata: { runner: "hermes-mcp" }
  })
})));

server.registerTool("ramrod_heartbeat_step", {
  title: "RAMROD-Schrittlease verlängern",
  description: "Verlängert die Lease eines vom selben Hermes-Runner übernommenen Schritts während längerer, erlaubter Recherchearbeiten.",
  inputSchema: {
    stepId: z.string().uuid()
  }
}, async (input) => toolResult(await controlPlaneRequest(`/api/agent-steps/${input.stepId}/heartbeat`, {
  method: "POST",
  body: JSON.stringify({ workerKey, leaseSeconds })
})));

server.registerTool("ramrod_complete_step", {
  title: "RAMROD-Schritt abschließen",
  description: "Schließt einen vom selben Hermes-Runner geleasten Schritt ab und speichert redigierte Ergebnisse und Belege.",
  inputSchema: {
    stepId: z.string().uuid(),
    output: z.record(z.unknown()).optional()
  }
}, async (input) => toolResult(await controlPlaneRequest(`/api/agent-steps/${input.stepId}/complete`, {
  method: "POST",
  body: JSON.stringify({ workerKey, output: input.output || {} })
})));

server.registerTool("ramrod_fail_step", {
  title: "RAMROD-Schritt mit Fehler beenden",
  description: "Meldet einen nachvollziehbaren Fehler. RAMROD entscheidet anhand der Retry-Grenzen, ob der Schritt erneut angeboten wird.",
  inputSchema: {
    stepId: z.string().uuid(),
    code: z.string().min(2).max(100),
    message: z.string().min(2).max(1000),
    retryable: z.boolean().default(true)
  }
}, async (input) => toolResult(await controlPlaneRequest(`/api/agent-steps/${input.stepId}/fail`, {
  method: "POST",
  body: JSON.stringify({
    workerKey,
    error: { code: input.code, message: input.message, retryable: input.retryable }
  })
})));

function toolResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value
  };
}

async function controlPlaneRequest(path, options = {}) {
  const response = await fetch(`${controlPlaneUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${agentToken}`,
      "X-Ramrod-Organization": organizationId,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(body.message || body.error || `RAMROD HTTP ${response.status}`);
  }
  return body;
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("RAMROD MCP adapter connected over stdio.");

function parseList(value) {
  return [...new Set(String(value || "").split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean))];
}

function clampNumber(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}
