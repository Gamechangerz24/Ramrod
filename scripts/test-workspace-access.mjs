import assert from "node:assert/strict";
import {
  canAssignOrganizationRole,
  createInvitationToken,
  hashInvitationToken,
  hasOrganizationPermission,
  invitationExpiresAt,
  normalizeInvitationEmail,
  permissionsForRole
} from "./lib/workspace-access.mjs";

assert.equal(hasOrganizationPermission("owner", "organization:manage"), true);
assert.equal(hasOrganizationPermission("admin", "team:manage"), true);
assert.equal(hasOrganizationPermission("operator", "inventory:write"), true);
assert.equal(hasOrganizationPermission("operator", "sales:approve"), false);
assert.equal(hasOrganizationPermission("viewer", "inventory:write"), false);
assert.equal(hasOrganizationPermission("viewer", "channels:manage", true), true);
assert.equal(canAssignOrganizationRole("owner", "admin"), true);
assert.equal(canAssignOrganizationRole("admin", "admin"), false);
assert.equal(canAssignOrganizationRole("admin", "operator"), true);
assert.equal(canAssignOrganizationRole("operator", "viewer"), false);
assert.equal(canAssignOrganizationRole("owner", "owner"), false);
assert.equal(normalizeInvitationEmail("  Test@Example.COM "), "test@example.com");

const token = createInvitationToken();
assert.equal(token.length >= 40, true);
assert.equal(hashInvitationToken(token), hashInvitationToken(token));
assert.notEqual(hashInvitationToken(token), token);
assert.equal(new Date(invitationExpiresAt(7, new Date("2026-07-22T00:00:00Z"))).toISOString(), "2026-07-29T00:00:00.000Z");
assert.equal(permissionsForRole("viewer").join(","), "inventory:read");

console.log("Workspace access tests passed.");
