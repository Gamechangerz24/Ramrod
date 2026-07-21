import assert from "node:assert/strict";
import {
  agentTypeIds,
  buildAgentPlan,
  firstApprovalStep,
  parseTelegramApprovalCallback,
  publicAgentPlaybooks,
  redactAgentPayload,
  telegramApprovalKeyboard
} from "./lib/agent-control.mjs";

assert.equal(agentTypeIds.length, 5);
assert.equal(publicAgentPlaybooks().length, agentTypeIds.length);

for (const agentType of agentTypeIds) {
  const plan = buildAgentPlan({ agentType });
  assert.equal(plan.agentType, agentType);
  assert.ok(plan.steps.length >= 4);
  assert.ok(["low", "medium", "high", "critical"].includes(plan.riskLevel));
  assert.ok(firstApprovalStep(plan), `${agentType} must stop at a human approval`);
  assert.equal(plan.steps.filter((step) => step.status === "waiting_approval").length, 1);
}

const accountPlan = buildAgentPlan({
  agentType: "onboard_channel_account",
  objective: "Ein eBay-Verkaufskonto für CREATORS sicher verbinden.",
  channelId: "ebay"
});
assert.equal(accountPlan.status, "waiting_approval");
assert.equal(firstApprovalStep(accountPlan).key, "create_external_account");
assert.equal(accountPlan.riskLevel, "critical");

const approvalId = "31f94b3a-7ddc-4dc5-9025-5b6af04f9f53";
const keyboard = telegramApprovalKeyboard(approvalId);
for (const button of keyboard.inline_keyboard.flat()) {
  assert.ok(Buffer.byteLength(button.callback_data, "utf8") <= 64);
}
assert.deepEqual(parseTelegramApprovalCallback(`ramrod:approve:${approvalId}`), {
  decision: "approved",
  approvalId
});
assert.deepEqual(parseTelegramApprovalCallback(`ramrod:reject:${approvalId}`), {
  decision: "rejected",
  approvalId
});
assert.equal(parseTelegramApprovalCallback("ramrod:approve:not-a-uuid"), null);

const redacted = redactAgentPayload({
  title: "Sicher",
  accessToken: "must-not-leak",
  nested: { password: "must-not-leak", harmless: "sichtbar" }
});
assert.equal(redacted.title, "Sicher");
assert.equal(redacted.accessToken, "[REDACTED]");
assert.equal(redacted.nested.password, "[REDACTED]");
assert.equal(redacted.nested.harmless, "sichtbar");

assert.throws(() => buildAgentPlan({ agentType: "rogue_agent" }), /Unsupported agent type/);

console.log("Agent control policy tests passed.");
