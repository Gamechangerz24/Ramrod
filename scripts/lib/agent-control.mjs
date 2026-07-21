const riskRank = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });

const playbooks = Object.freeze({
  onboard_channel_account: {
    label: "Verkaufskonto einrichten",
    defaultObjective: "Ein neues Verkaufskonto sicher vorbereiten und nach menschlicher Freigabe verbinden.",
    steps: [
      step("inspect_requirements", "Anforderungen prüfen", "research", "browser", "low", false, "Aktuelle Konto-, Unternehmens- und Plattformanforderungen erfassen."),
      step("prepare_account_data", "Kontodaten vorbereiten", "prepare", "browser", "medium", false, "Bestätigte Unternehmensdaten in ein prüfbares Formular übertragen."),
      step("create_external_account", "Externes Konto anlegen", "external_write", "browser", "high", true, "Das Konto wird öffentlich und kann Vertragswirkungen auslösen."),
      step("complete_identity", "Identität und Zahlung bestätigen", "human_handoff", "human", "critical", true, "KYC, Bank, Passwort, 2FA oder CAPTCHA benötigen den Kontoinhaber."),
      step("connect_oauth", "OAuth-Verbindung herstellen", "credential_grant", "api", "high", true, "RAMROD erhält begrenzte Rechte für das Verkaufskonto."),
      step("verify_connector", "Verbindung testen", "read", "api", "low", false, "Kontostatus, Rechte und verfügbare Verkaufslimits prüfen.")
    ]
  },
  publish_item: {
    label: "Artikel veröffentlichen",
    defaultObjective: "Einen freigegebenen Artikel auf dem empfohlenen Kanal veröffentlichen und verifizieren.",
    steps: [
      step("validate_item", "Artikel und Freigabe prüfen", "read", "ramrod", "low", false, "Pflichtfelder, Preisquellen, Bestand und menschliche Freigabe prüfen."),
      step("prepare_listing", "Angebot vorbereiten", "prepare", "connector", "medium", false, "Kanaltext, Merkmale, Preis, Bilder und Versandregeln erzeugen."),
      step("publish_listing", "Angebot veröffentlichen", "external_write", "connector", "high", true, "Das Angebot wird extern sichtbar und kann Gebühren oder Bestellungen auslösen."),
      step("verify_listing", "Veröffentlichung verifizieren", "read", "connector", "low", false, "Externe ID, URL, Preis und verfügbaren Bestand abgleichen."),
      step("register_listing", "Listing registrieren", "internal_write", "ramrod", "low", false, "Externes Listing mit dem RAMROD-Masterartikel verknüpfen.")
    ]
  },
  distribute_inventory: {
    label: "Artikel auf Kanäle verteilen",
    defaultObjective: "Freigegebene Artikel wirtschaftlich auf geeignete Verkaufskanäle verteilen.",
    steps: [
      step("select_candidates", "Verkaufsbereite Artikel wählen", "read", "ramrod", "low", false, "Freigegebene, nicht reservierte Artikel nach Wert und Kanalpassung wählen."),
      step("build_channel_plan", "Kanalplan berechnen", "research", "agent", "low", false, "Hauptkanal, Reichweitenkanäle, Preise und Rückfallroute begründen."),
      step("prepare_channel_drafts", "Kanalentwürfe erstellen", "prepare", "connector", "medium", false, "Noch nicht öffentliche Angebote und Kampagnen vorbereiten."),
      step("publish_channel_plan", "Kanalplan veröffentlichen", "external_write", "connector", "high", true, "Mehrere externe Veröffentlichungen werden ausgelöst."),
      step("monitor_distribution", "Veröffentlichungen überwachen", "read", "connector", "low", false, "Status, Fehler, Verkäufe und Reservierungen fortlaufend abgleichen.")
    ]
  },
  create_demand_campaign: {
    label: "Verkaufskampagne planen",
    defaultObjective: "Passende Artikel zu einer Kampagne bündeln und Nachfrage für Shop und Marktplätze erzeugen.",
    steps: [
      step("cluster_inventory", "Artikel thematisch clustern", "read", "ramrod", "low", false, "Franchise, Kategorie, Zielgruppe und Preisniveau gruppieren."),
      step("create_content", "Content und Ablauf erstellen", "prepare", "agent", "low", false, "Hook, Caption, Shotlist, Skript und Produktverknüpfungen erzeugen."),
      step("review_claims", "Fakten und Rechte prüfen", "review", "human", "medium", true, "Preisaussagen, Marken, Musik- und Bildrechte menschlich kontrollieren."),
      step("schedule_campaign", "Kampagne planen", "external_write", "connector", "high", true, "Beiträge oder Live-Termine werden auf externen Kanälen geplant."),
      step("measure_campaign", "Ergebnis messen", "read", "connector", "low", false, "Reichweite, Klicks, Verkäufe und Deckungsbeitrag zurückführen.")
    ]
  },
  reconcile_sale: {
    label: "Verkauf synchronisieren",
    defaultObjective: "Einen Verkauf bestätigen, Bestand reservieren und andere Angebote beenden.",
    steps: [
      step("verify_order", "Bestellung prüfen", "read", "connector", "low", false, "Order, Zahlung, Artikel und Kanal eindeutig zuordnen."),
      step("reserve_inventory", "Bestand reservieren", "internal_write", "ramrod", "medium", false, "Einzelstück atomar gegen Doppelverkauf sperren."),
      step("delist_other_channels", "Andere Angebote beenden", "external_write", "connector", "high", true, "Parallele öffentliche Angebote werden beendet."),
      step("create_shipping_task", "Versandauftrag erzeugen", "internal_write", "ramrod", "low", false, "Pick-, Pack- und Versanddaten bereitstellen.")
    ]
  }
});

function step(key, title, actionType, executionMode, riskLevel, approvalRequired, summary) {
  return Object.freeze({ key, title, actionType, executionMode, riskLevel, approvalRequired, summary });
}

export const agentTypeIds = Object.freeze(Object.keys(playbooks));

export function publicAgentPlaybooks() {
  return agentTypeIds.map((id) => ({
    id,
    label: playbooks[id].label,
    defaultObjective: playbooks[id].defaultObjective,
    stepCount: playbooks[id].steps.length,
    approvalCount: playbooks[id].steps.filter((entry) => entry.approvalRequired).length
  }));
}

export function buildAgentPlan({ agentType, objective, channelId = null, itemId = null } = {}) {
  const playbook = playbooks[String(agentType || "")];
  if (!playbook) {
    throw new Error(`Unsupported agent type: ${String(agentType || "missing")}`);
  }

  const cleanObjective = cleanText(objective || playbook.defaultObjective, 800);
  const firstApprovalIndex = playbook.steps.findIndex((entry) => entry.approvalRequired);
  const steps = playbook.steps.map((entry, index) => ({
    ...entry,
    ordinal: index + 1,
    status: index === 0 && index === firstApprovalIndex ? "waiting_approval" : "planned"
  }));
  const highestRisk = steps.reduce((highest, entry) => riskRank[entry.riskLevel] > riskRank[highest] ? entry.riskLevel : highest, "low");

  return {
    agentType,
    label: playbook.label,
    objective: cleanObjective,
    channelId: cleanIdentifier(channelId),
    itemId: cleanIdentifier(itemId),
    riskLevel: highestRisk,
    status: steps[0]?.status === "waiting_approval" ? "waiting_approval" : "ready",
    steps
  };
}

export function firstApprovalStep(plan) {
  return plan?.steps?.find((entry) => entry.approvalRequired) || null;
}

export function buildApprovalSummary({ organizationName, run, step, itemTitle = "", channelName = "" } = {}) {
  const subject = itemTitle || channelName || run?.objective || "Agentenauftrag";
  return cleanText(`${organizationName || "RAMROD"}: ${step?.title || "Aktion freigeben"} für ${subject}`, 240);
}

export function buildTelegramApprovalMessage({ organizationName, run, step, itemTitle = "", channelName = "", approvalId } = {}) {
  const lines = [
    "RAMROD benötigt deine Freigabe",
    "",
    `Kundenbereich: ${organizationName || "Unbekannt"}`,
    `Mission: ${run?.label || run?.agent_type || "Agentenauftrag"}`,
    `Aktion: ${step?.title || "Externe Aktion"}`,
    itemTitle ? `Artikel: ${itemTitle}` : "",
    channelName ? `Plattform: ${channelName}` : "",
    `Risiko: ${riskLabel(step?.riskLevel || step?.risk_level)}`,
    "",
    cleanText(step?.summary || "Bitte Aktion vor Ausführung prüfen.", 500),
    "",
    `Freigabe-ID: ${String(approvalId || "").slice(0, 8)}`
  ].filter(Boolean);
  return lines.join("\n");
}

export function telegramApprovalKeyboard(approvalId) {
  const id = String(approvalId || "").trim();
  if (!isUuid(id)) throw new Error("A valid approval UUID is required.");
  return {
    inline_keyboard: [[
      { text: "Freigeben", callback_data: `ramrod:approve:${id}` },
      { text: "Ablehnen", callback_data: `ramrod:reject:${id}` }
    ]]
  };
}

export function parseTelegramApprovalCallback(value) {
  const match = /^ramrod:(approve|reject):([0-9a-f-]{36})$/i.exec(String(value || ""));
  if (!match || !isUuid(match[2])) return null;
  return { decision: match[1].toLowerCase() === "approve" ? "approved" : "rejected", approvalId: match[2].toLowerCase() };
}

export function redactAgentPayload(value, depth = 0) {
  if (depth > 6) return "[MAX_DEPTH]";
  if (Array.isArray(value)) return value.slice(0, 100).map((entry) => redactAgentPayload(entry, depth + 1));
  if (!value || typeof value !== "object") return typeof value === "string" ? cleanText(value, 4000) : value;

  const output = {};
  for (const [key, entry] of Object.entries(value).slice(0, 100)) {
    if (/password|secret|token|authorization|cookie|bank|iban|bic|credential|api.?key/i.test(key)) {
      output[key] = "[REDACTED]";
    } else {
      output[key] = redactAgentPayload(entry, depth + 1);
    }
  }
  return output;
}

export function riskLabel(value) {
  return { low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch" }[String(value || "").toLowerCase()] || "Unbekannt";
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function cleanIdentifier(value) {
  const text = String(value || "").trim();
  return text ? text.slice(0, 120) : null;
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
