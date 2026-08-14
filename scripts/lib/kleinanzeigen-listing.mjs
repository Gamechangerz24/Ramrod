import {
  evaluateListingCopy,
  inferCriticalMissingFacts
} from "./listing-copy-agent.mjs";

const TITLE_LIMIT = 65;

export function kleinanzeigenListingContentSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "shortDescription",
      "conditionDescription",
      "includedItems",
      "defects",
      "sellingPoints",
      "buyerSearchTerms",
      "criticalMissingFacts",
      "categoryHint",
      "attributes"
    ],
    properties: {
      title: { type: "string", maxLength: TITLE_LIMIT },
      shortDescription: { type: "string", minLength: 40, maxLength: 1800 },
      conditionDescription: { type: "string", minLength: 15, maxLength: 600 },
      includedItems: { type: "array", maxItems: 20, items: { type: "string" } },
      defects: { type: "array", maxItems: 20, items: { type: "string" } },
      sellingPoints: { type: "array", maxItems: 10, items: { type: "string" } },
      buyerSearchTerms: { type: "array", maxItems: 15, items: { type: "string" } },
      criticalMissingFacts: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "question", "reason", "severity"],
          properties: {
            field: { type: "string" },
            question: { type: "string" },
            reason: { type: "string" },
            severity: { type: "string", enum: ["blocking", "warning"] }
          }
        }
      },
      categoryHint: { type: "string", maxLength: 160 },
      attributes: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "value", "confidence"],
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            confidence: { type: "integer", minimum: 0, maximum: 100 }
          }
        }
      }
    }
  };
}

export function buildKleinanzeigenListingPrompt(item, accountDefaults = {}) {
  const facts = {
    title: item.title,
    category: item.category,
    franchise: item.franchise,
    condition: item.condition,
    completeness: item.completeness,
    notes: item.notes,
    recognizedCondition: item.aiConditionObservations,
    risks: item.aiRiskFlags || [],
    barcode: item.barcode || "",
    dimensions: item.dimensions || null,
    weightKg: Number(item.weight || 0),
    operatorAnswers: item.listingCopyAnswers || {},
    existingDraft: item.listingDraft || null,
    preferredDelivery: inferDeliveryMode(item),
    sellerMode: accountDefaults.sellerMode || "unknown"
  };

  return [
    "Du bist der Kleinanzeigen-Redakteur von RAMROD.",
    "Erstelle aus den bestaetigten Fakten eine ehrliche, gut auffindbare deutsche Kleinanzeige fuer genau diesen Einzelartikel.",
    `Der Titel hat maximal ${TITLE_LIMIT} Zeichen und nennt zuerst Marke oder Produktart, danach Modell, Variante und den wichtigsten Suchbegriff.`,
    "Die Beschreibung beginnt mit der eindeutigen Produktidentitaet. Danach folgen Zustand, Lieferumfang, bestaetigte Maengel und die vorgesehene Uebergabe. Schreibe kurze Absaetze ohne Keyword-Spam, Emojis oder unbelegte Superlative.",
    "Erfinde niemals Echtheit, Funktion, Edition, Alter, Groesse, Material, Zubehoer, Garantie, Tier- oder Rauchfreiheit, Versandart oder Originalitaet.",
    "Unbestaetigte kaufentscheidende Fakten gehoeren nur in criticalMissingFacts. Blocking verhindert die Freigabe; warning ist hilfreich, aber nicht zwingend.",
    "Defects enthaelt nur sichtbare oder vom Menschen bestaetigte Maengel. includedItems enthaelt nur sichtbaren oder bestaetigten Lieferumfang.",
    "categoryHint ist ein verstaendlicher Navigationshinweis fuer Kleinanzeigen, keine erfundene technische Kategorie-ID.",
    "attributes duerfen nur Werte mit mindestens 75 Prozent Sicherheit enthalten.",
    "operatorAnswers sind bestaetigte Angaben und haben Vorrang vor der Bilderkennung.",
    "Antworte ausschliesslich im vorgegebenen JSON-Schema und auf Deutsch.",
    `ARTIKELFAKTEN: ${JSON.stringify(facts)}`
  ].join(" ");
}

export function buildFallbackKleinanzeigenContent(item) {
  const title = clampText(cleanText(item.listingDraft?.title || item.title || "Gebrauchter Artikel"), TITLE_LIMIT);
  const conditionDescription = cleanText(
    item.aiConditionObservations || item.notes || item.condition || "Gebrauchter Zustand; bitte Fotos beachten."
  );
  return {
    title,
    shortDescription: cleanText(
      item.listingDraft?.description
      || `${title}. Angeboten wird der abgebildete Artikel mit dem genannten Lieferumfang. Zustand und bekannte Maengel sind unten aufgefuehrt.`
    ),
    conditionDescription,
    includedItems: splitList(item.completeness || "Lieferumfang wie abgebildet"),
    defects: cleanList(item.aiRiskFlags || []),
    sellingPoints: uniqueStrings([item.franchise, item.category]).slice(0, 6),
    buyerSearchTerms: uniqueStrings([item.franchise, item.category, ...title.split(/\s+/)]).slice(0, 15),
    criticalMissingFacts: inferKleinanzeigenMissingFacts(item),
    categoryHint: cleanText(item.category || "Sonstiges"),
    attributes: [
      item.franchise ? { name: "Marke / Franchise", value: cleanText(item.franchise), confidence: Number(item.confidence || 75) } : null,
      item.category ? { name: "Produktart", value: cleanText(item.category), confidence: Number(item.confidence || 75) } : null
    ].filter(Boolean)
  };
}

export function normalizeKleinanzeigenContent(content, item) {
  const fallback = buildFallbackKleinanzeigenContent(item);
  const missingFacts = uniqueMissingFacts([
    ...(Array.isArray(content?.criticalMissingFacts) ? content.criticalMissingFacts : []),
    ...inferKleinanzeigenMissingFacts(item)
  ]);
  return {
    title: clampText(cleanText(content?.title || fallback.title), TITLE_LIMIT),
    shortDescription: sanitizePublicText(content?.shortDescription || fallback.shortDescription) || fallback.shortDescription,
    conditionDescription: sanitizePublicText(content?.conditionDescription || fallback.conditionDescription) || fallback.conditionDescription,
    includedItems: cleanList(content?.includedItems || fallback.includedItems),
    defects: cleanList(content?.defects || fallback.defects).filter((entry) => !containsUncertainty(entry)),
    sellingPoints: cleanList(content?.sellingPoints || fallback.sellingPoints),
    buyerSearchTerms: cleanList(content?.buyerSearchTerms || fallback.buyerSearchTerms),
    criticalMissingFacts: missingFacts,
    categoryHint: cleanText(content?.categoryHint || fallback.categoryHint),
    attributes: (Array.isArray(content?.attributes) ? content.attributes : fallback.attributes)
      .map((entry) => ({
        name: cleanText(entry?.name),
        value: cleanText(entry?.value),
        confidence: clampNumber(entry?.confidence, 0, 100, 0)
      }))
      .filter((entry) => entry.name && entry.value && entry.confidence >= 75)
  };
}

export function buildKleinanzeigenListingPreview({ item, content, account = null }) {
  const normalized = normalizeKleinanzeigenContent(content, item);
  const copyAgent = evaluateListingCopy({
    ...normalized,
    itemSpecifics: normalized.attributes
  }, item);
  const price = kleinanzeigenTargetPrice(item);
  const priceMode = price > 0 ? "negotiable" : "giveaway";
  const deliveryMode = inferDeliveryMode(item);
  const sourceImages = uniqueStrings([
    ...(Array.isArray(item.images) ? item.images : []),
    item.image
  ]).filter((value) => /^https:\/\//i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value));
  const postalCode = cleanText(account?.metadata?.postalCode || account?.metadata?.postal_code || "");
  const browserProfileKey = cleanText(account?.browser_profile_key || "");
  const authorizationReference = cleanText(
    account?.metadata?.automationAuthorizationRef
    || account?.metadata?.automation_authorization_ref
    || account?.metadata?.partnerIntegrationRef
    || account?.metadata?.partner_integration_ref
    || ""
  );
  const accountConnected = account?.status === "connected" && Boolean(browserProfileKey);
  const automatedAccessAuthorized = Boolean(authorizationReference);
  const connectorReady = accountConnected && automatedAccessAuthorized;
  const description = buildPublicDescription(normalized, deliveryMode);
  const readiness = [
    readinessStep("title", "Titel", Boolean(normalized.title), normalized.title || "Titel fehlt"),
    readinessStep("copy", "Verkaufstext", copyAgent.status === "ready", copyAgent.summary),
    readinessStep("category", "Kategorie", Boolean(normalized.categoryHint), normalized.categoryHint || "Kategorie fehlt"),
    readinessStep("images", "Fotos", sourceImages.length > 0, sourceImages.length ? `${sourceImages.length} Foto${sourceImages.length === 1 ? "" : "s"}` : "Mindestens ein Foto fehlt"),
    readinessStep("price", "Preis", priceMode === "giveaway" || price > 0, priceMode === "giveaway" ? "Zu verschenken" : `${price.toFixed(2)} EUR VB`),
    readinessStep("delivery", "Uebergabe", Boolean(deliveryMode), deliveryLabel(deliveryMode)),
    readinessStep("facts", "Kaufentscheidende Angaben", !normalized.criticalMissingFacts.some((entry) => entry.severity === "blocking"), normalized.criticalMissingFacts.some((entry) => entry.severity === "blocking") ? "Pflichtfragen offen" : "Keine blockierenden Fragen")
  ];

  return {
    status: readiness.every((entry) => entry.ready) ? "ready_for_approval" : "needs_input",
    generatedAt: new Date().toISOString(),
    sku: item.sku,
    title: normalized.title,
    description,
    categoryHint: normalized.categoryHint,
    condition: item.condition || "Gebraucht",
    price,
    priceMode,
    deliveryMode,
    shippingCost: deliveryMode === "pickup" ? null : numberOrNull(item.shippingCost),
    postalCode,
    content: normalized,
    copyAgent,
    sourceImages,
    readiness,
    connector: {
      ready: connectorReady,
      status: account?.status || "missing",
      accountId: account?.id || null,
      displayName: account?.display_name || "Kein Kleinanzeigen-Konto verbunden",
      browserProfileReady: Boolean(browserProfileKey),
      automatedAccessAuthorized,
      authorizationReference: authorizationReference || null,
      message: connectorReady
        ? "Der autorisierte Connector ist bereit. Die Veroeffentlichung bleibt freigabepflichtig."
        : accountConnected
          ? "Browserprofil verbunden. Vor automatisiertem Zugriff fehlt noch eine dokumentierte Kleinanzeigen- oder Partnerfreigabe."
          : "Verbinde zuerst ein Kleinanzeigen-Konto mit einem isolierten Browserprofil."
    },
    warnings: [
      "Diese Vorschau ist noch nicht auf Kleinanzeigen veroeffentlicht.",
      "RAMROD gibt keine Zugangsdaten an das Sprachmodell weiter.",
      "CAPTCHA, 2FA, Identitaetspruefung und Aenderungen der Plattform muessen durch einen Menschen bestaetigt werden."
    ]
  };
}

export function buildKleinanzeigenBrowserTask({ item, preview, account }) {
  if (!item?.sku || !preview?.title) throw new Error("Artikel und gepruefte Kleinanzeigen-Vorschau werden benoetigt.");
  if (preview.status !== "ready_for_approval" || preview.readiness?.some((entry) => !entry.ready)) {
    throw new Error("Die Kleinanzeigen-Vorschau ist noch nicht freigabefaehig.");
  }
  if (account?.status !== "connected" || !account?.browser_profile_key) {
    throw new Error("Das Kleinanzeigen-Browserprofil ist noch nicht verbunden.");
  }
  const authorizationReference = cleanText(
    account?.metadata?.automationAuthorizationRef
    || account?.metadata?.automation_authorization_ref
    || account?.metadata?.partnerIntegrationRef
    || account?.metadata?.partner_integration_ref
    || ""
  );
  if (!authorizationReference) {
    throw new Error("Fuer automatisierten Kleinanzeigen-Zugriff fehlt eine dokumentierte Plattform- oder Partnerfreigabe.");
  }
  const images = (preview.sourceImages || []).filter((value) => /^https:\/\//i.test(String(value))).slice(0, 20);
  return {
    version: 1,
    channelId: "kleinanzeigen",
    action: "create_listing",
    itemId: item.dbId || item.id || null,
    sku: item.sku,
    browserProfileKey: account.browser_profile_key,
    authorizationReference,
    allowedOrigins: ["https://www.kleinanzeigen.de"],
    listing: {
      title: preview.title,
      description: preview.description,
      categoryHint: preview.categoryHint,
      condition: preview.condition,
      price: preview.price,
      priceMode: preview.priceMode,
      deliveryMode: preview.deliveryMode,
      shippingCost: preview.shippingCost,
      postalCode: preview.postalCode,
      images
    },
    guardrails: {
      externalWriteRequiresApproval: true,
      stopBeforeFinalSubmit: true,
      credentialAccess: "browser-profile-only",
      stopOnCaptcha: true,
      stopOnTwoFactor: true,
      stopOnIdentityCheck: true,
      stopOnUnexpectedFields: true
    }
  };
}

function buildPublicDescription(content, deliveryMode) {
  const sections = [content.shortDescription];
  if (content.conditionDescription) sections.push(`Zustand:\n${content.conditionDescription}`);
  if (content.includedItems.length) sections.push(`Lieferumfang:\n${content.includedItems.map((entry) => `- ${entry}`).join("\n")}`);
  if (content.defects.length) sections.push(`Bekannte Maengel:\n${content.defects.map((entry) => `- ${entry}`).join("\n")}`);
  sections.push(`Uebergabe:\n${deliveryLabel(deliveryMode)}.`);
  return sections.filter(Boolean).join("\n\n").slice(0, 4000);
}

function inferKleinanzeigenMissingFacts(item) {
  const missing = [...inferCriticalMissingFacts(item)];
  const identity = `${item.category || ""} ${item.title || ""}`.toLowerCase();
  const known = [
    item.notes,
    item.aiConditionObservations,
    item.completeness,
    ...Object.values(item.listingCopyAnswers || {})
  ].map(cleanText).join(" ").toLowerCase();
  if (/(elektronik|elektrogeraet|elektrogerat|staubsauger|konsole|controller|computer|audio|fernseher)/.test(identity)
    && !/(funktioniert|funktionstest|funktionspruefung|funktionsprüfung|getestet|defekt)/.test(known)) {
    missing.push({
      field: "Funktionstest",
      question: "Wurde das Geraet getestet und welche Funktionen wurden bestaetigt?",
      reason: "Bei Elektroartikeln ist der konkrete Funktionszustand kaufentscheidend.",
      severity: "blocking"
    });
  }
  return uniqueMissingFacts(missing);
}

function kleinanzeigenTargetPrice(item) {
  const entries = [
    item.salesStrategy?.channelPlan?.primary,
    ...(item.salesStrategy?.channelPlan?.parallel || []),
    item.salesStrategy?.channelPlan?.fallback
  ].filter(Boolean);
  const plan = entries.find((entry) => String(entry.id || entry.name || "").toLowerCase() === "kleinanzeigen");
  const base = Number(plan?.targetPrice || item.salesStrategy?.targetPrice || item.priceCheck?.fair || item.fair || 0);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.max(1, Math.round(base));
}

function inferDeliveryMode(item) {
  const text = `${item.category || ""} ${item.title || ""} ${item.notes || ""} ${item.salesStrategy?.salesFormat || ""}`.toLowerCase();
  const bulky = /(moebel|möbel|schrank|sofa|tisch|bett|matratze|kommode|regal|abholung|local_pickup)/.test(text)
    || Number(item.weight || 0) >= 15;
  return bulky ? "pickup" : "pickup_or_shipping";
}

function deliveryLabel(mode) {
  return {
    pickup: "Nur Abholung",
    shipping: "Versand moeglich",
    pickup_or_shipping: "Abholung oder Versand nach Absprache"
  }[mode] || "Uebergabe nach Absprache";
}

function readinessStep(id, label, ready, detail) {
  return { id, label, ready: Boolean(ready), detail: cleanText(detail) };
}

function uniqueMissingFacts(entries) {
  const normalized = entries
    .map((entry) => ({
      field: cleanText(entry?.field),
      question: cleanText(entry?.question),
      reason: cleanText(entry?.reason),
      severity: entry?.severity === "blocking" ? "blocking" : "warning"
    }))
    .filter((entry) => entry.field && entry.question);
  return normalized.filter((entry, index) => normalized.findIndex((candidate) => `${candidate.field}:${candidate.question}`.toLowerCase() === `${entry.field}:${entry.question}`.toLowerCase()) === index);
}

function splitList(value) {
  return cleanText(value).split(/[,;\n]+/).map(cleanText).filter(Boolean).slice(0, 20);
}

function cleanList(value) {
  return uniqueStrings(Array.isArray(value) ? value : splitList(value)).slice(0, 20);
}

function uniqueStrings(values) {
  const output = [];
  const seen = new Set();
  for (const value of values || []) {
    const cleanValue = cleanText(value);
    const key = cleanValue.toLowerCase();
    if (!cleanValue || seen.has(key)) continue;
    seen.add(key);
    output.push(cleanValue);
  }
  return output;
}

function sanitizePublicText(value) {
  return cleanText(value)
    .replace(/\b(?:nicht sichtbar|nicht erkennbar|nicht pruefbar|nicht geprueft|unbekannt|nur eingeschraenkt beurteilbar)\b[^.!?]*(?:[.!?]|$)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function containsUncertainty(value) {
  return /nicht sichtbar|nicht erkennbar|nicht pruefbar|nicht geprueft|unbekannt/i.test(String(value || ""));
}

function clampText(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "").trim() || text.slice(0, maxLength).trim();
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
