const safeStepHandlers = Object.freeze({
  validate_item: validateItem,
  select_candidates: selectCandidates,
  build_channel_plan: buildChannelPlan,
  cluster_inventory: clusterInventory,
  create_content: createContent
});

export const safeAgentStepKeys = Object.freeze(Object.keys(safeStepHandlers));

export async function executeSafeAgentStep(claim) {
  const stepKey = String(claim?.step?.step_key || "");
  const handler = safeStepHandlers[stepKey];
  if (!handler) {
    const error = new Error(`No safe executor is registered for agent step: ${stepKey || "missing"}`);
    error.code = "unsupported_agent_step";
    error.retryable = false;
    throw error;
  }
  const result = await handler(claim);
  return {
    schemaVersion: 1,
    stepKey,
    executor: "ramrod-safe-runner",
    completedAt: new Date().toISOString(),
    ...result
  };
}

function validateItem({ item }) {
  if (!item) return {
    status: "blocked",
    ready: false,
    blockers: ["Die Mission enthält keinen Artikel."],
    checks: []
  };

  const checks = [
    check("identity", "Identität", Boolean(clean(item.title) && !/unbekannt|unknown/i.test(clean(item.title)))),
    check("image", "Mindestens ein Bild", Boolean(item.image_url || item.image || item.images?.length)),
    check("price", "Marktpreis", positive(item.price_fair ?? item.fair)),
    check("channel", "Verkaufskanal", Boolean(clean(item.primary_channel ?? item.channel) && !/prüfen|pruefen/i.test(clean(item.primary_channel ?? item.channel)))),
    check("condition", "Zustand", Boolean(clean(item.condition)))
  ];
  const blockers = checks.filter((entry) => !entry.ready).map((entry) => `${entry.label} fehlt oder ist noch nicht belastbar.`);
  return { status: blockers.length ? "blocked" : "ready", ready: blockers.length === 0, blockers, checks };
}

function selectCandidates({ candidates = [] }) {
  const selected = candidates
    .filter((item) => !item.archived_at)
    .filter((item) => !["Verkauft", "Versand", "Archiviert"].includes(String(item.stage || "")))
    .filter((item) => positive(item.price_fair ?? item.fair))
    .slice(0, 100)
    .map(candidateSummary);
  return {
    status: selected.length ? "ready" : "empty",
    candidateCount: selected.length,
    candidates: selected,
    note: selected.length ? "Verkaufsfähiger Bestand wurde für die Kanalplanung vorbereitet." : "Kein ausreichend bewerteter, aktiver Artikel gefunden."
  };
}

function buildChannelPlan({ candidates = [], priorSteps = [] }) {
  const priorCandidates = priorSteps
    .flatMap((entry) => Array.isArray(entry.output?.candidates) ? entry.output.candidates : []);
  const source = priorCandidates.length ? priorCandidates : candidates.map(candidateSummary);
  const byChannel = new Map();
  for (const item of source) {
    const channel = clean(item.channel || item.primary_channel) || "Prüfen";
    if (!byChannel.has(channel)) byChannel.set(channel, { channel, itemCount: 0, fairValue: 0, items: [] });
    const group = byChannel.get(channel);
    group.itemCount += 1;
    group.fairValue += number(item.fair ?? item.price_fair);
    if (group.items.length < 20) group.items.push({ id: item.id, sku: item.sku, title: item.title, fair: number(item.fair ?? item.price_fair) });
  }
  const routes = [...byChannel.values()].sort((left, right) => right.fairValue - left.fairValue);
  return {
    status: routes.length ? "ready" : "empty",
    routeCount: routes.length,
    itemCount: source.length,
    routes,
    requiresApproval: routes.some((entry) => entry.channel !== "Prüfen")
  };
}

function clusterInventory({ candidates = [] }) {
  const groups = new Map();
  for (const item of candidates.filter((entry) => !entry.archived_at).slice(0, 200)) {
    const label = clean(item.franchise) || clean(item.category) || "Gemischter Bestand";
    if (!groups.has(label)) groups.set(label, { label, itemCount: 0, fairValue: 0, items: [] });
    const group = groups.get(label);
    group.itemCount += 1;
    group.fairValue += number(item.price_fair ?? item.fair);
    if (group.items.length < 20) group.items.push(candidateSummary(item));
  }
  const clusters = [...groups.values()]
    .sort((left, right) => right.itemCount - left.itemCount || right.fairValue - left.fairValue)
    .slice(0, 20);
  return { status: clusters.length ? "ready" : "empty", clusterCount: clusters.length, clusters };
}

function createContent({ priorSteps = [], run }) {
  const clusters = priorSteps.flatMap((entry) => Array.isArray(entry.output?.clusters) ? entry.output.clusters : []);
  const briefs = (clusters.length ? clusters : [{ label: "Aktueller Bestand", itemCount: 0, fairValue: 0 }])
    .slice(0, 8)
    .map((cluster) => ({
      cluster: cluster.label,
      format: cluster.itemCount >= 8 ? "Live-Show und Kurzvideo" : "Produktkarussell",
      hook: `${cluster.label}: ausgewählte Stücke mit belegtem Zustand und Marktpreis`,
      callToAction: "Artikel ansehen und Verfügbarkeit prüfen",
      productCount: cluster.itemCount,
      fairValue: cluster.fairValue,
      publishStatus: "draft"
    }));
  return {
    status: "drafted",
    objective: clean(run?.objective),
    briefs,
    note: "Content-Entwürfe sind intern vorbereitet. Eine Veröffentlichung ist damit nicht erfolgt."
  };
}

function candidateSummary(item) {
  return {
    id: item.id || null,
    sku: clean(item.sku),
    title: clean(item.title),
    category: clean(item.category),
    franchise: clean(item.franchise),
    channel: clean(item.primary_channel ?? item.channel) || "Prüfen",
    fair: number(item.price_fair ?? item.fair),
    confidence: number(item.confidence)
  };
}

function check(key, label, ready) {
  return { key, label, ready: Boolean(ready) };
}

function positive(value) {
  return number(value) > 0;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clean(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}
