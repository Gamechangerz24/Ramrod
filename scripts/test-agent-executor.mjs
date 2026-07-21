import assert from "node:assert/strict";
import { executeSafeAgentStep, safeAgentStepKeys } from "./lib/agent-executor.mjs";

assert.deepEqual([...safeAgentStepKeys].sort(), [
  "build_channel_plan",
  "cluster_inventory",
  "create_content",
  "select_candidates",
  "validate_item"
]);

const validation = await executeSafeAgentStep({
  step: { step_key: "validate_item" },
  item: { title: "Nintendo Switch Joy-Con Paar", image_url: "https://example.test/item.jpg", price_fair: 42, primary_channel: "eBay", condition: "Gebraucht" }
});
assert.equal(validation.ready, true);
assert.equal(validation.blockers.length, 0);

const selection = await executeSafeAgentStep({
  step: { step_key: "select_candidates" },
  candidates: [
    { id: "1", sku: "A-1", title: "Mass Effect 2", price_fair: 8, primary_channel: "Whatnot", stage: "Freigabe" },
    { id: "2", sku: "A-2", title: "Archiv", price_fair: 20, archived_at: "2026-01-01T00:00:00Z" }
  ]
});
assert.equal(selection.candidateCount, 1);

const plan = await executeSafeAgentStep({
  step: { step_key: "build_channel_plan" },
  priorSteps: [{ output: selection }]
});
assert.equal(plan.routeCount, 1);
assert.equal(plan.routes[0].channel, "Whatnot");
assert.equal(plan.routes[0].fairValue, 8);

await assert.rejects(
  () => executeSafeAgentStep({ step: { step_key: "publish_listing" } }),
  (error) => error.code === "unsupported_agent_step" && error.retryable === false
);

console.log("Agent executor tests passed.");
