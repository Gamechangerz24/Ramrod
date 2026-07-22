import { createHash, randomBytes } from "node:crypto";

export const organizationRoles = ["owner", "admin", "operator", "viewer"];

const rolePermissions = {
  owner: ["inventory:read", "inventory:write", "sales:approve", "agents:run", "channels:manage", "team:manage", "organization:manage"],
  admin: ["inventory:read", "inventory:write", "sales:approve", "agents:run", "channels:manage", "team:manage"],
  operator: ["inventory:read", "inventory:write", "agents:run"],
  viewer: ["inventory:read"]
};

export function permissionsForRole(role, platformAdmin = false) {
  if (platformAdmin) return [...new Set(Object.values(rolePermissions).flat())];
  return [...(rolePermissions[normalizeOrganizationRole(role)] || rolePermissions.viewer)];
}

export function hasOrganizationPermission(role, permission, platformAdmin = false) {
  return permissionsForRole(role, platformAdmin).includes(permission);
}

export function normalizeOrganizationRole(role, fallback = "viewer") {
  const value = String(role || "").trim().toLowerCase();
  return organizationRoles.includes(value) ? value : fallback;
}

export function canAssignOrganizationRole(actorRole, requestedRole, platformAdmin = false) {
  if (platformAdmin) return ["admin", "operator", "viewer"].includes(normalizeOrganizationRole(requestedRole, ""));
  const actor = normalizeOrganizationRole(actorRole);
  const requested = normalizeOrganizationRole(requestedRole, "");
  if (!requested || requested === "owner") return false;
  if (actor === "owner") return ["admin", "operator", "viewer"].includes(requested);
  if (actor === "admin") return ["operator", "viewer"].includes(requested);
  return false;
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

export function normalizeInvitationEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function invitationExpiresAt(days = 7, now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + Math.max(1, Math.min(30, Number(days) || 7)));
  return expiresAt.toISOString();
}
