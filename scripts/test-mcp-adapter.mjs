import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["scripts/ramrod-mcp-server.mjs"],
  env: {
    ...process.env,
    RAMROD_CONTROL_PLANE_URL: "http://127.0.0.1:9",
    RAMROD_AGENT_TOKEN: "test-agent-token",
    RAMROD_ORGANIZATION_ID: "31f94b3a-7ddc-4dc5-9025-5b6af04f9f53"
  },
  stderr: "pipe"
});
const client = new Client({ name: "ramrod-mcp-test", version: "0.1.0" });

try {
  await client.connect(transport);
  const listed = await client.listTools();
  assert.deepEqual(listed.tools.map((tool) => tool.name).sort(), [
    "ramrod_claim_step",
    "ramrod_complete_step",
    "ramrod_create_mission",
    "ramrod_fail_step",
    "ramrod_get_agent_control",
    "ramrod_request_approval"
  ]);
  assert.ok(!listed.tools.some((tool) => /approve|publish|browser/i.test(tool.name)));
  console.log("RAMROD MCP capability test passed.");
} finally {
  await client.close();
}
