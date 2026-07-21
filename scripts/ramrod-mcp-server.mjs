#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { agentTypeIds } from "./lib/agent-control.mjs";

const controlPlaneUrl = String(process.env.RAMROD_CONTROL_PLANE_URL || "").replace(/\/+$/, "");
const agentToken = String(process.env.RAMROD_AGENT_TOKEN || "");
const organizationId = String(process.env.RAMROD_ORGANIZATION_ID || "");

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
