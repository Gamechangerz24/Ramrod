import { createHash } from "node:crypto";

export function normalizeIdentityValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function recognitionFingerprint(identity = {}, context = {}) {
  const barcode = normalizeIdentityValue(context.barcode || identity.barcode);
  if (barcode) {
    return createHash("sha256").update(`barcode:${barcode}`).digest("hex");
  }
  const parts = [
    `type:${normalizeIdentityValue(identity.productType || identity.category)}`,
    `brand:${normalizeIdentityValue(identity.brand || identity.franchise)}`,
    `title:${normalizeIdentityValue(identity.title)}`,
    `platform:${normalizeIdentityValue(identity.platform)}`,
    `edition:${normalizeIdentityValue(identity.edition)}`,
    `region:${normalizeIdentityValue(identity.region || identity.language)}`
  ].filter(Boolean);
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function correctedIdentitySignature(identity = {}) {
  return [
    identity.title,
    identity.productType || identity.category,
    identity.brand || identity.franchise,
    identity.platform,
    identity.edition,
    identity.region || identity.language
  ].map(normalizeIdentityValue).join("|");
}

export function aggregateRecognitionFeedback(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const corrected = row.corrected_identity || row.correctedIdentity || {};
    const signature = correctedIdentitySignature(corrected);
    if (!signature.replaceAll("|", "")) continue;
    const group = groups.get(signature) || {
      signature,
      correctedIdentity: corrected,
      confirmations: 0,
      organizations: new Set(),
      confirmationKeys: new Set(),
      feedbackIds: []
    };
    const organizationId = row.organization_id || row.organizationId || "unknown";
    const itemId = row.item_id || row.itemId || row.id || "unknown";
    const confirmationKey = `${organizationId}:${itemId}`;
    if (!group.confirmationKeys.has(confirmationKey)) {
      group.confirmationKeys.add(confirmationKey);
      group.confirmations += 1;
    }
    if (organizationId !== "unknown") group.organizations.add(organizationId);
    if (row.id) group.feedbackIds.push(row.id);
    groups.set(signature, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, distinctOrganizations: group.organizations.size, organizations: undefined, confirmationKeys: undefined }))
    .sort((left, right) => right.confirmations - left.confirmations || right.distinctOrganizations - left.distinctOrganizations);
}

export function scopeAllowsCollectionItem(scope = {}, item = {}) {
  const collection = item.collection || {};
  const mediaTypes = Array.isArray(scope.mediaTypes) ? scope.mediaTypes : [];
  const hiddenItemIds = new Set(Array.isArray(scope.hiddenItemIds) ? scope.hiddenItemIds : []);
  const hiddenAgeRatings = new Set((Array.isArray(scope.hiddenAgeRatings) ? scope.hiddenAgeRatings : []).map(normalizeIdentityValue));
  const itemId = item.dbId || item.id;
  if (itemId && hiddenItemIds.has(itemId)) return false;
  if (mediaTypes.length && !mediaTypes.includes(collection.mediaType || "other")) return false;
  if (hiddenAgeRatings.has(normalizeIdentityValue(collection.ageRating))) return false;
  return true;
}
