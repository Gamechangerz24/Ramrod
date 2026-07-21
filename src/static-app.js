let boxes = [
  { id: "SV-001", label: "Pokemon / TCG Mischkiste", location: "CREATORS A-01", stage: "Freigabe" },
  { id: "SV-002", label: "Retro Games & Konsolen", location: "CREATORS A-02", stage: "Gescannt" },
  { id: "SV-003", label: "Figuren / Collectibles", location: "CREATORS B-04", stage: "Eingang" }
];

const seedItems = [
  {
    id: "itm-001",
    sku: "SV-001-0001",
    boxId: "SV-001",
    title: "Pokemon Display Box, deutsche Edition, ungeoeffnet",
    category: "Trading Cards",
    franchise: "Pokemon",
    condition: "Sehr gut",
    completeness: "Versiegelt, leichte Lagerspuren",
    confidence: 88,
    low: 120,
    fair: 155,
    aggressive: 189,
    channel: "eBay",
    stage: "Freigabe",
    weight: 0.42,
    image: "https://images.unsplash.com/photo-1609372332255-611485350f25?auto=format&fit=crop&w=900&q=80",
    notes: "Preisanker ueber verkaufte Displays pruefen. Fotos von Siegeln sind entscheidend.",
    sourceType: "demo",
    research: [["eBay", "Aehnliche aktive Listings", 169, "heute"], ["eBay Solds", "Verkaufte Displays", 149, "14 Tage"], ["Collector Signal", "Nachfrage stabil", 158, "30 Tage"]]
  },
  {
    id: "itm-002",
    sku: "SV-002-0003",
    boxId: "SV-002",
    title: "Nintendo DS Spiel, lose Cartridge, Mario Franchise",
    category: "Games",
    franchise: "Nintendo",
    condition: "Gut",
    completeness: "Ohne Huellenpapier, Cartridge getestet",
    confidence: 74,
    low: 18,
    fair: 26,
    aggressive: 35,
    channel: "Whatnot",
    stage: "Gescannt",
    weight: 0.08,
    image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80",
    notes: "Als schneller Live-Artikel geeignet. Zustand zeigen, Funktionstest nennen.",
    sourceType: "demo",
    research: [["eBay", "Lose Cartridges", 24, "7 Tage"], ["PriceCharting", "Loose average", 27, "30 Tage"], ["Whatnot", "Live-Startpreise", 15, "manuell"]]
  },
  {
    id: "itm-003",
    sku: "SV-003-0002",
    boxId: "SV-003",
    title: "Anime Figur mit Originalkarton, limitierte Variante",
    category: "Collectibles",
    franchise: "Anime",
    condition: "Gebraucht",
    completeness: "Box vorhanden, Blister fehlt, Staubspuren",
    confidence: 59,
    low: 45,
    fair: 69,
    aggressive: 95,
    channel: "Pruefen",
    stage: "Gescannt",
    weight: 0.82,
    image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=900&q=80",
    notes: "Variante muss validiert werden. Potenziell wertvoll, nicht automatisch listen.",
    sourceType: "demo",
    research: [["eBay", "Unklare Varianten", 80, "21 Tage"], ["Forum", "Limitierte Serie erwaehnt", 90, "alt"], ["CREATORS Regel", "Confidence unter 65", 0, "jetzt"]]
  }
];

const hints = [
  { tokens: ["pokemon", "tcg", "karte", "display", "booster"], category: "Trading Cards", franchise: "Pokemon", low: 25, fair: 84, aggressive: 139, channel: "eBay", confidence: 82 },
  { tokens: ["nintendo", "gameboy", "ds", "switch", "spiel", "konsole"], category: "Games", franchise: "Nintendo", low: 12, fair: 34, aggressive: 59, channel: "Whatnot", confidence: 76 },
  { tokens: ["funko", "figur", "anime", "statue", "collectible"], category: "Collectibles", franchise: "Pop Culture", low: 18, fair: 49, aggressive: 89, channel: "Pruefen", confidence: 62 }
];

const whatnotChannels = [
  {
    id: "pokemon-cards",
    label: "Pokemon Cards",
    description: "Sealed, Singles, Promos und Pokemon TCG Lots",
    tokens: ["pokemon", "tcg", "booster pack", "booster box", "pikachu", "charizard"],
    defaultCampaign: "Pokemon Singles & Sealed",
    icon: "PK",
    priority: 1
  },
  {
    id: "playstation-games",
    label: "PlayStation Games",
    description: "PS4, PS5, PS3 und passende Sony-Spiele",
    tokens: ["ps4", "ps5", "ps3", "playstation", "sony"],
    defaultCampaign: "PlayStation Games Batch",
    icon: "PS",
    priority: 2
  },
  {
    id: "xbox-games",
    label: "Xbox Games",
    description: "Xbox, Xbox 360, Xbox One und Series Spiele",
    tokens: ["xbox", "xbox 360", "xbox one", "series x", "microsoft xbox"],
    defaultCampaign: "Xbox Games Batch",
    icon: "XB",
    priority: 3
  },
  {
    id: "retro-games",
    label: "Retro Games",
    description: "Dreamcast, Atari, Nintendo DS, Game Boy, Sega und Retro-Software",
    tokens: ["dreamcast", "atari", "gameboy", "game boy", "nintendo ds", "sega", "snes", "mega drive", "cartridge", "modul", "soulcalibur", "ecco"],
    defaultCampaign: "Retro Games Show",
    icon: "RG",
    priority: 4
  },
  {
    id: "comics",
    label: "Comics",
    description: "Comics, Hefte, Taschenbuecher und Marvel/DC Lots",
    tokens: ["comic", "comics", "marvel", "dc comics", "jahrbuch", "pocket", "manga"],
    defaultCampaign: "Comics & Hefte",
    icon: "CO",
    priority: 5
  },
  {
    id: "action-figures",
    label: "Action Figures",
    description: "Turtles, Star Wars, Superhelden, Toy Lines und lose Figuren",
    tokens: ["figure", "figur", "action", "tmnt", "turtle", "star wars", "star trek", "mario", "jakks", "superman", "muhammad ali"],
    defaultCampaign: "Action Figures & Toys",
    icon: "AF",
    priority: 6
  },
  {
    id: "anime-figures",
    label: "Anime Figures",
    description: "Anime-, Manga- und Japan-Figuren",
    tokens: ["anime", "manga", "dragon ball", "dragonball", "one piece", "naruto"],
    defaultCampaign: "Anime Figures",
    icon: "AN",
    priority: 7
  },
  {
    id: "premium-collectibles",
    label: "Premium Collectibles",
    description: "Hoeherwertige Einzelstuecke mit Review vor Live-Verkauf",
    tokens: [],
    defaultCampaign: "Premium Review",
    icon: "PR",
    priority: 98
  },
  {
    id: "low-value-bundles",
    label: "Low Value Bundles",
    description: "Kleine Artikel, Becher, Hefte und schnelle Bundle-Lots",
    tokens: ["becher", "heft", "magazin", "vhs", "deko", "lampe", "zubehoer"],
    defaultCampaign: "Bundle Night",
    icon: "LB",
    priority: 99
  }
];

const fallbackChannelCatalog = [
  { id: "ebay", name: "eBay", status: "draft-ready", statusLabel: "Entwurf bereit", spotlight: true, selectable: true },
  { id: "whatnot", name: "Whatnot", status: "assisted", statusLabel: "Show vorbereitet", spotlight: true, selectable: true },
  { id: "kleinanzeigen", name: "Kleinanzeigen", status: "assisted", statusLabel: "Assistiert", spotlight: true, selectable: true },
  { id: "vinted", name: "Vinted", status: "assisted", statusLabel: "Assistiert", selectable: true },
  { id: "facebook_marketplace", name: "Facebook Marketplace", status: "assisted", statusLabel: "Assistiert", selectable: true },
  { id: "instagram", name: "Instagram", status: "assisted", statusLabel: "Content assistiert", selectable: false },
  { id: "spezialforum", name: "Spezialforum", status: "assisted", statusLabel: "Beitrag assistiert", selectable: true },
  { id: "ramrod_shop", name: "RAMROD Shop", status: "building", statusLabel: "Im Aufbau", selectable: false },
  { id: "cardmarket", name: "Cardmarket", status: "planned", statusLabel: "Connector geplant", selectable: false },
  { id: "bricklink", name: "BrickLink", status: "planned", statusLabel: "Connector geplant", selectable: false },
  { id: "discogs", name: "Discogs", status: "planned", statusLabel: "Connector geplant", selectable: false },
  { id: "reverb", name: "Reverb", status: "planned", statusLabel: "Connector geplant", selectable: false },
  { id: "catawiki", name: "Catawiki", status: "assisted", statusLabel: "Einreichung assistiert", selectable: true }
];
let runtimeChannelCatalog = fallbackChannelCatalog;

const app = document.querySelector("#app");
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const icon = (label) => `<span class="mini-icon" aria-hidden="true">${label}</span>`;
const devMode = new URLSearchParams(window.location.search).get("dev") === "1";
const authStorageKey = "ramrod-auth-session";
const organizationStorageKey = "ramrod-active-organization";
const initialOrganizationId = localStorage.getItem(organizationStorageKey) || "";

window.addEventListener("error", (event) => {
  const message = event.error?.message || event.message || "Unbekannter Frontend-Fehler";
  if (app) {
    app.innerHTML = `<section class="workspace"><div class="status-strip">RAMROD konnte nicht starten: ${escapeHtml(message)}. Versuche /?reset=1 oder lade hart neu.</div></section>`;
  }
});

const state = {
  booting: true,
  view: "today",
  organizations: [],
  activeOrganizationId: initialOrganizationId,
  activeOrganization: null,
  platformAdmin: false,
  adminOverview: [],
  creatingOrganization: false,
  selected: "itm-001",
  search: "",
  boxFilter: "",
  importStatus: "Lade lokale App...",
  channelPlan: null,
  persistence: { configured: false, writable: false },
  runtimeConfig: { authRequired: false, supabaseUrl: "", supabaseAnonKey: "", channels: [], providers: {} },
  authSession: loadAuthSession(),
  recoverySession: loadRecoverySession(),
  authError: "",
  authNotice: "",
  authLoading: false,
  authResetLoading: false,
  showAllChannels: false,
  recognizing: false,
  recognition: null,
  recognitionMeta: null,
  recognitionRequestId: 0,
  analyzing: false,
  captureMode: "single",
  batchDrafts: [],
  batchAnalyzing: false,
  batchProgress: null,
  batchSummary: null,
  mobileDetailsItem: "",
  priceChecking: "",
  ebayDrafting: "",
  approving: "",
  draft: createEmptyDraft("SV-001"),
  items: normalizeItems(loadStoredItems(initialOrganizationId))
};
const watchedAutomationJobs = new Set();

function localItemsKey(organizationId = state.activeOrganizationId) {
  return organizationId ? `ramrod-items:${organizationId}` : "creators-scanapp-items";
}
const saveLocal = () => localStorage.setItem(localItemsKey(), JSON.stringify(state.items));
const save = saveLocal;

function createEmptyDraft(boxId = "SV-001") {
  return {
    query: "",
    boxId,
    condition: "Gut",
    completeness: "Ungeprüft, Fotos vorhanden",
    barcode: "",
    photo: "",
    photos: [],
    weight: "0.25"
  };
}

function loadAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(authStorageKey) || "null");
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
}

function loadRecoverySession() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (params.get("type") !== "recovery" || !params.get("access_token")) return null;
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token") || "",
    expires_in: Number(params.get("expires_in") || 0),
    token_type: params.get("token_type") || "bearer"
  };
}

function saveAuthSession(session) {
  state.authSession = session || null;
  if (session) localStorage.setItem(authStorageKey, JSON.stringify(session));
  else localStorage.removeItem(authStorageKey);
}

function loadStoredItems(organizationId = "") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") {
    localStorage.removeItem(localItemsKey(organizationId));
    return seedItems;
  }

  try {
    return JSON.parse(localStorage.getItem(localItemsKey(organizationId)) || "null") || seedItems;
  } catch (error) {
    localStorage.removeItem(localItemsKey(organizationId));
    return seedItems;
  }
}

function nextSku(boxId) {
  return `${boxId}-${String(state.items.filter((item) => item.boxId === boxId).length + 1).padStart(4, "0")}`;
}

function analyze(draft = state.draft) {
  const text = `${draft.query} ${draft.barcode}`.toLowerCase();
  const hint = hints.find((entry) => entry.tokens.some((token) => text.includes(token))) || hints[2];
  const incomplete = draft.condition === "Unvollständig" || draft.condition === "Unvollstaendig" || draft.condition === "Defekt";
  const confidence = Math.max(38, hint.confidence - (incomplete ? 18 : 0));
  const fair = Math.round(hint.fair * (draft.condition === "Sehr gut" ? 1.18 : 1));
  return enrichWorkflow({
    id: makeId(),
    sku: nextSku(draft.boxId),
    boxId: draft.boxId,
    title: draft.query.trim() || "Unbekannter Sammlerartikel",
    category: hint.category,
    franchise: hint.franchise,
    condition: draft.condition,
    completeness: draft.completeness,
    confidence,
    low: Math.round(hint.low * (incomplete ? 0.65 : 1)),
    fair,
    aggressive: Math.round(hint.aggressive * (draft.condition === "Sehr gut" ? 1.15 : 1)),
    channel: confidence < 65 ? "Pruefen" : hint.channel,
    stage: confidence < 70 ? "Gescannt" : "Freigabe",
    weight: Number(draft.weight) || 0.25,
    image: draft.photo || "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=900&q=80",
    notes: confidence < 65 ? "KI ist unsicher. Variante, Zustand und Vergleichspreise vor Listing manuell prüfen." : "Listing-Entwurf bereit. Titel, Zustand und Versandgewicht vor Veröffentlichung bestätigen.",
    sourceType: "mock",
    research: [["eBay", "Aktive Vergleichsartikel", fair + 12, "simuliert"], ["eBay Solds", "Verkaufte Vergleichsartikel", fair - 8, "simuliert"], ["CREATORS", "Routing-Regel", fair, "jetzt"]]
  });
}

function normalizeItems(items) {
  return (items || []).map((item) => enrichWorkflow(item));
}

function enrichWorkflow(item) {
  const whatnot = classifyWhatnot(item);
  const shouldBeWhatnot = item.channel === "Whatnot" || item.whatnotEligible === true;
  const showLotType = item.showLotType || inferShowLotType(item, whatnot);
  const campaignId = shouldBeWhatnot ? campaignIdFor(whatnot, item) : "";

  return {
    ...item,
    whatnotEligible: shouldBeWhatnot,
    whatnotChannel: shouldBeWhatnot ? whatnot.id : "",
    whatnotChannelLabel: shouldBeWhatnot ? whatnot.label : "",
    campaignId,
    campaignSuggestion: shouldBeWhatnot ? campaignTitleFor(whatnot, item) : "",
    showLotType,
    sortOrderScore: Number(item.sortOrderScore ?? scoreShowLot(item, whatnot, showLotType)),
    bundleSuggestion: item.bundleSuggestion || bundleSuggestionFor(item, whatnot, showLotType),
    whatnotScript: item.whatnotScript || scriptForWhatnot(item, whatnot, showLotType),
    salesStrategy: normalizeSalesStrategy(item)
  };
}

function normalizeSalesStrategy(item) {
  const strategy = item.salesStrategy || {};
  const repair = strategy.repairDecision || {};
  const text = [item.title, item.category, item.condition, item.completeness, item.notes].filter(Boolean).join(" ").toLowerCase();
  const hasVisibleIssue = ["kratzer", "staub", "verschmutz", "beschäd", "beschaed", "defekt", "unvoll", "bruch", "riss"].some((token) => text.includes(token));
  const needsFunctionTest = ["konsole", "spiel", "game", "elektronik", "controller", "gerät", "geraet"].some((token) => text.includes(token));
  const fair = Number(item.fair) || 0;
  const low = Number(item.low) || Math.max(1, Math.round(fair * 0.65));
  const defaultAction = text.includes("defekt") ? "parts_or_defect" : hasVisibleIssue ? "clean_and_sell" : "sell_as_is";
  const defaultRepair = text.includes("defekt") ? "needs_quote" : hasVisibleIssue ? "repair_if_cheap" : "not_applicable";
  const channelPlan = normalizeChannelPlan(item, strategy, fair, low);

  return {
    recommendedAction: strategy.recommendedAction || defaultAction,
    headline: strategy.headline || (hasVisibleIssue ? "Erst aufbereiten, dann mit transparentem Zustand verkaufen" : "Direkt verkaufsfertig machen"),
    rationale: strategy.rationale || (hasVisibleIssue
      ? "Sichtbare Gebrauchsspuren beeinflussen den Preis. Reinigung und saubere Zustandsfotos sind risikoarm; ein Teiletausch lohnt sich erst nach Kostenvergleich."
      : "Es ist kein klarer wirtschaftlicher Reparaturbedarf dokumentiert. Fokus auf Identifikation, Funktionsnachweis und gute Fotos."),
    detectedDefects: Array.isArray(strategy.detectedDefects) ? strategy.detectedDefects : (hasVisibleIssue ? [item.condition || item.completeness || "Gebrauchsspuren prüfen"] : []),
    preparationSteps: Array.isArray(strategy.preparationSteps) && strategy.preparationSteps.length
      ? strategy.preparationSteps
      : ["Trocken und materialschonend reinigen", "Zustand und Lieferumfang vollständig dokumentieren", "Versandgewicht und Lagerplatz bestätigen"],
    repairDecision: {
      recommendation: repair.recommendation || defaultRepair,
      action: repair.action || (hasVisibleIssue ? "Vor einem Teiletausch Ersatzteil, Arbeitszeit und realen Mehrerlös vergleichen." : "Keine Reparatur vorgesehen."),
      estimatedCostLow: Number(repair.estimatedCostLow || 0),
      estimatedCostHigh: Number(repair.estimatedCostHigh || 0),
      estimatedValueGainLow: Number(repair.estimatedValueGainLow || 0),
      estimatedValueGainHigh: Number(repair.estimatedValueGainHigh || 0),
      netGainEstimate: Number(repair.netGainEstimate || 0),
      caveat: repair.caveat || "Schätzung aus Bild und Artikeldaten; Teilepreis, Arbeitszeit und Funktion vor Umsetzung prüfen."
    },
    routeReason: strategy.routeReason || `${channelLabel(item.channel)} passt aktuell am besten zu Wert, Artikeltyp und Bearbeitungsaufwand.`,
    alternativeChannels: Array.isArray(strategy.alternativeChannels) && strategy.alternativeChannels.length
      ? strategy.alternativeChannels
      : channelPlanAlternatives(channelPlan),
    channelPlan,
    salesFormat: strategy.salesFormat || (item.channel === "Whatnot" ? "live_show" : item.channel === "Bundle" ? "bundle" : "fixed_price"),
    targetPrice: Number(strategy.targetPrice || fair),
    minimumAcceptablePrice: Number(strategy.minimumAcceptablePrice || low),
    expectedTimeToSell: strategy.expectedTimeToSell || "unknown",
    requiredChecks: Array.isArray(strategy.requiredChecks) && strategy.requiredChecks.length
      ? strategy.requiredChecks
      : [needsFunctionTest ? "Funktionstest mit Ergebnis dokumentieren" : "Variante und sichtbare Kennzeichnungen bestätigen", "Lieferumfang prüfen"],
    photoChecklist: Array.isArray(strategy.photoChecklist) && strategy.photoChecklist.length
      ? strategy.photoChecklist
      : ["Gesamtansicht vorne und hinten", "Typenschild oder relevante Kennzeichnung", "Mängel als Nahaufnahme", "Lieferumfang auf einem Bild"],
    approvalSummary: strategy.approvalSummary || `Nach Prüfung für ${channelLabel(item.channel)} zum Zielpreis ${euro(fair)} vorbereiten.`
  };
}

function normalizeChannelPlan(item, strategy, fair, low) {
  const source = strategy.channelPlan || {};
  const primary = normalizeChannelPlanEntry(source.primary, {
    name: channelLabel(item.channel),
    role: "primary",
    roleLabel: item.channel === "Pruefen" ? "Vor Freigabe" : "Hauptverkauf",
    score: item.channel === "Pruefen" ? 0 : 80,
    targetPrice: fair,
    activation: item.channel === "Pruefen" ? "blocked" : "after-approval",
    reason: strategy.routeReason || `${channelLabel(item.channel)} passt aktuell am besten zu diesem Artikel.`
  });
  const legacyAlternatives = Array.isArray(strategy.alternativeChannels) && strategy.alternativeChannels.length
    ? strategy.alternativeChannels
    : channelAlternatives(item.channel);
  const parallel = Array.isArray(source.parallel) && source.parallel.length
    ? source.parallel.map((entry) => normalizeChannelPlanEntry(entry))
    : legacyAlternatives.slice(0, 2).map((name, index) => normalizeChannelPlanEntry(null, {
      name: channelLabel(name),
      role: "parallel",
      roleLabel: index === 0 ? "Ergänzung" : "Zweitmarkt",
      score: 70 - index * 5,
      targetPrice: fair,
      activation: "manual-after-approval",
      reason: "Als ergänzender Kanal nach Freigabe prüfen."
    }));
  const discovery = Array.isArray(source.discovery)
    ? source.discovery.map((entry) => normalizeChannelPlanEntry(entry))
    : [];
  const fallback = source.fallback
    ? normalizeChannelPlanEntry(source.fallback)
    : null;

  return {
    version: Number(source.version || 1),
    primary,
    parallel,
    discovery,
    fallback,
    inventoryPolicy: {
      sourceOfTruth: source.inventoryPolicy?.sourceOfTruth || "RAMROD",
      publishParallelOnlyWithSaleSync: source.inventoryPolicy?.publishParallelOnlyWithSaleSync !== false,
      reserveOnSale: source.inventoryPolicy?.reserveOnSale !== false,
      delistOtherChannels: source.inventoryPolicy?.delistOtherChannels !== false,
      note: source.inventoryPolicy?.note || "RAMROD führt den Bestand zentral und verhindert Doppelverkäufe."
    },
    floorPrice: low
  };
}

function normalizeChannelPlanEntry(entry, fallback = {}) {
  const value = { ...fallback, ...(entry || {}) };
  const registry = channelCatalog().find((channel) => channel.id === value.id || channel.name === value.name);
  return {
    id: value.id || registry?.id || channelClass(value.name || "offen"),
    name: value.name || registry?.name || "Offen",
    role: value.role || "parallel",
    roleLabel: value.roleLabel || "Ergänzung",
    score: Number(value.score || 0),
    targetPrice: Number(value.targetPrice || 0),
    activation: value.activation || "after-approval",
    reason: value.reason || "Als ergänzenden Verkaufskanal prüfen.",
    status: value.status || registry?.status || "planned",
    statusLabel: value.statusLabel || registry?.statusLabel || "Geplant",
    publishingMode: value.publishingMode || registry?.publishingMode || "manual",
    automationLevel: value.automationLevel || registry?.automationLevel || "manual",
    delistSupported: value.delistSupported ?? registry?.delistSupported ?? false
  };
}

function channelPlanAlternatives(plan) {
  return [...plan.parallel, ...plan.discovery, ...(plan.fallback ? [plan.fallback] : [])]
    .map((entry) => entry.name)
    .filter(Boolean);
}

function classifyWhatnot(item) {
  const text = [
    item.title,
    item.category,
    item.franchise,
    item.completeness,
    item.notes
  ].filter(Boolean).join(" ").toLowerCase();
  const fair = Number(item.fair) || 0;

  if (fair >= 100 && !text.includes("pokemon")) {
    return whatnotChannels.find((channel) => channel.id === "premium-collectibles");
  }

  const direct = whatnotChannels
    .filter((channel) => channel.tokens.length)
    .find((channel) => channel.tokens.some((token) => text.includes(token)));

  if (direct) return direct;
  if (fair <= 12) return whatnotChannels.find((channel) => channel.id === "low-value-bundles");
  return whatnotChannels.find((channel) => channel.id === "action-figures");
}

function inferShowLotType(item, whatnot) {
  const fair = Number(item.fair) || 0;
  const text = [item.title, item.category, item.completeness].filter(Boolean).join(" ").toLowerCase();
  if (fair >= 100 || whatnot.id === "premium-collectibles") return "premium";
  if (fair <= 12 || text.includes("lose") || text.includes("heft") || text.includes("becher")) return "bundle";
  return "single";
}

function scoreShowLot(item, whatnot, showLotType) {
  const base = Math.round(Number(item.confidence) || 50);
  const valueBoost = Math.min(18, Math.round((Number(item.fair) || 0) / 10));
  const typeBoost = showLotType === "premium" ? 16 : showLotType === "single" ? 8 : 2;
  return Math.max(1, Math.min(100, base + valueBoost + typeBoost - whatnot.priority / 20));
}

function campaignIdFor(whatnot, item) {
  const boxSuffix = String(item.boxId || "SV").replace(/[^A-Z0-9-]/gi, "").toUpperCase();
  return `WN-${whatnot.id.toUpperCase()}-${boxSuffix || "MIX"}`;
}

function campaignTitleFor(whatnot, item) {
  const box = item.boxId || "Batch";
  return `${whatnot.defaultCampaign} · ${box}`;
}

function bundleSuggestionFor(item, whatnot, showLotType) {
  if (showLotType === "premium") return "Vor Live-Verkauf bestätigen und als Highlight später in der Show platzieren.";
  if (showLotType === "bundle") return `Mit ähnlichen Artikeln aus ${whatnot.label} bündeln, wenn der Marktwert unter 12 EUR bleibt.`;
  return `Als Einzel-Lot in ${whatnot.label}; thematisch neben ähnliche Artikel sortieren.`;
}

function scriptForWhatnot(item, whatnot, showLotType) {
  const start = Math.max(1, Math.round((Number(item.low) || Number(item.fair) || 1) * 0.65));
  const type = showLotType === "premium" ? "Highlight-Lot" : showLotType === "bundle" ? "Bundle-Lot" : "Einzel-Lot";
  return `${type} für ${whatnot.label}. Start bei ${euro(start)}. Marktwert ${euro(Number(item.fair) || 0)}. Zustand: ${item.condition || "siehe Fotos"}. ${item.completeness || "Vollständigkeit prüfen."} Besonderheiten kurz zeigen und bei Unsicherheit als Hinweis nennen.`;
}

function buildWhatnotCampaigns(items) {
  const grouped = new Map();
  normalizeItems(items)
    .filter((item) => item.whatnotEligible || item.channel === "Whatnot")
    .forEach((item) => {
      const key = item.campaignId || campaignIdFor(classifyWhatnot(item), item);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title: item.campaignSuggestion || campaignTitleFor(classifyWhatnot(item), item),
          channelId: item.whatnotChannel,
          channelLabel: item.whatnotChannelLabel,
          items: []
        });
      }
      grouped.get(key).items.push(item);
    });

  return [...grouped.values()]
    .map((campaign) => ({
      ...campaign,
      fairValue: campaign.items.reduce((sum, item) => sum + (Number(item.fair) || 0), 0),
      startValue: campaign.items.reduce((sum, item) => sum + Math.max(1, Math.round((Number(item.low) || Number(item.fair) || 1) * 0.65)), 0),
      reviewCount: campaign.items.filter((item) => item.confidence < 70 || item.showLotType === "premium").length,
      durationMinutes: Math.max(10, Math.round(campaign.items.length * 2.5)),
      items: campaign.items.sort((a, b) => b.sortOrderScore - a.sortOrderScore)
    }))
    .sort((a, b) => {
      const priorityA = whatnotChannels.find((channel) => channel.id === a.channelId)?.priority || 50;
      const priorityB = whatnotChannels.find((channel) => channel.id === b.channelId)?.priority || 50;
      return priorityA - priorityB || b.fairValue - a.fairValue;
    });
}

async function hydrateAppState() {
  state.booting = true;
  render();
  try {
    state.runtimeConfig = await fetchPublicJson("/api/config");
    runtimeChannelCatalog = Array.isArray(state.runtimeConfig.channels) && state.runtimeConfig.channels.length
      ? state.runtimeConfig.channels
      : fallbackChannelCatalog;
    state.booting = false;
    if (state.runtimeConfig.authRequired && !state.authSession?.access_token) {
      state.importStatus = "";
      render();
      return;
    }

    const payload = await fetchJson("/api/app-state");
    state.persistence = payload.persistence || state.persistence;
    state.organizations = payload.organizations || [];
    state.activeOrganization = payload.activeOrganization || state.organizations[0] || null;
    state.activeOrganizationId = state.activeOrganization?.id || "";
    state.platformAdmin = Boolean(payload.platformAdmin);
    state.adminOverview = payload.adminOverview || [];
    if (state.activeOrganizationId) localStorage.setItem(organizationStorageKey, state.activeOrganizationId);

    boxes = payload.boxes || [];
    if (!boxes.some((box) => box.id === state.draft.boxId)) {
      state.draft.boxId = boxes[0]?.id || `${state.activeOrganization?.shortCode || "RR"}-001`;
    }

    if (Array.isArray(payload.items)) {
      state.items = normalizeItems(payload.items);
      state.selected = state.items[0]?.id || "";
      saveLocal();
      state.importStatus = payload.items.length
        ? `${payload.items.length} Artikel aus ${state.activeOrganization?.name || "dem Kundenbereich"} geladen.`
        : `${state.activeOrganization?.name || "Dieser Kundenbereich"} ist bereit für die erste Erfassung.`;
      state.items
        .filter((item) => ["queued", "running"].includes(item.automationJob?.status))
        .forEach((item) => watchAutomationJob(item, item.automationJob.id));
    } else if (!state.persistence.configured) {
      state.importStatus = "Lokaler Modus: Datenbank ist nicht verbunden.";
    }
  } catch (error) {
    state.booting = false;
    if (error.status === 401) {
      saveAuthSession(null);
      state.authError = error.message;
      state.importStatus = "";
    } else if (error.status === 403) {
      state.importStatus = error.message;
      state.items = [];
      boxes = [];
    } else {
      state.importStatus = `Daten konnten nicht geladen werden: ${error.message}. Demo-Bestand bleibt sichtbar.`;
    }
  }
  render();
}

async function persistItem(item, action = "Artikel") {
  saveLocal();
  if (!state.persistence?.writable) return null;

  try {
    const result = await postJson("/api/items", { item });
    if (result.item) {
      Object.assign(item, normalizeItems([result.item])[0]);
    }
    if (result.automationJob || ["queued", "running"].includes(item.automationJob?.status)) {
      const job = result.automationJob || item.automationJob;
      item.automationJob = { ...item.automationJob, ...job };
      state.importStatus = `${action} gespeichert. Der automatische Preischeck ${job.status === "running" ? "läuft" : "wartet auf den Worker"}.`;
      watchAutomationJob(item, job.id);
    } else {
      state.importStatus = `${action} gespeichert.`;
    }
    saveLocal();
    return result.item || item;
  } catch (error) {
    state.importStatus = `${action} lokal gespeichert, Datenbank-Sync fehlgeschlagen: ${error.message}`;
    return null;
  }
}

async function watchAutomationJob(item, jobId) {
  if (!jobId || watchedAutomationJobs.has(jobId)) return;
  watchedAutomationJobs.add(jobId);

  try {
    for (let attempt = 0; attempt < 45; attempt += 1) {
      const payload = await fetchJson(`/api/jobs?id=${encodeURIComponent(jobId)}&limit=1`);
      const job = payload.jobs?.[0];
      if (!job) return;

      const current = state.items.find((entry) => entry.dbId === item.dbId || entry.id === item.id) || item;
      current.automationJob = {
        id: job.id,
        status: job.status,
        attempts: Number(job.attempts || 0),
        maxAttempts: Number(job.max_attempts || 0),
        createdAt: job.created_at || null,
        updatedAt: job.updated_at || null,
        error: job.error || null
      };

      if (job.status === "succeeded") {
        applyAutomationResult(current, job.result || {});
        state.importStatus = `Automatischer Preischeck für ${current.sku} abgeschlossen: Marktwert ${euro(current.fair)}.`;
        saveLocal();
        render();
        return;
      }

      if (["failed", "cancelled"].includes(job.status)) {
        state.importStatus = `Automatischer Preischeck für ${current.sku} fehlgeschlagen. Der manuelle Preischeck bleibt verfügbar.`;
        saveLocal();
        render();
        return;
      }

      render();
      await delay(2000);
    }

    state.importStatus = "Der Preischeck läuft im Hintergrund weiter. Der Status wird beim nächsten Laden aktualisiert.";
    render();
  } catch (error) {
    state.importStatus = `Preischeck-Status konnte nicht geladen werden: ${error.message}`;
    render();
  } finally {
    watchedAutomationJobs.delete(jobId);
  }
}

function applyAutomationResult(item, result) {
  if (result.priceCheck) {
    item.priceCheck = result.priceCheck;
    item.low = Number(result.priceCheck.low ?? item.low);
    item.fair = Number(result.priceCheck.fair ?? item.fair);
    item.aggressive = Number(result.priceCheck.aggressive ?? item.aggressive);
    item.confidence = Math.max(Number(item.confidence || 0), Number(result.priceCheck.confidence || 0));
  }
  if (result.decision) applySalesDecision(item, result.decision);
  if (result.ebayDraft) item.ebayDraft = result.ebayDraft;
}

function applySalesDecision(item, decision) {
  if (!decision) return;
  item.channel = decision.channel || item.channel;
  item.whatnotEligible = Boolean(decision.whatnotEligible);
  item.salesStrategy = decision.salesStrategy || item.salesStrategy;
  item.salesDecision = decision;
  Object.assign(item, enrichWorkflow(item));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function persistItems(items, action = "Artikel") {
  saveLocal();
  if (!state.persistence?.writable) return;

  const results = await Promise.allSettled(items.map((item) => persistItem(item, action)));
  const failed = results.filter((result) => result.status === "rejected").length;
  state.importStatus = failed
    ? `${items.length - failed}/${items.length} ${action} gespeichert.`
    : `${items.length} ${action} gespeichert.`;
  render();
}

function isWhatnotCandidate(item) {
  if (item.channel === "Problemfall" || item.channel === "Pruefen") return false;
  const text = [item.title, item.category, item.franchise].filter(Boolean).join(" ").toLowerCase();
  const tokens = ["pokemon", "karte", "tcg", "game", "spiel", "dreamcast", "atari", "xbox", "ps4", "ps5", "ps3", "comic", "figur", "figure", "star wars", "star trek", "anime", "mario"];
  return tokens.some((token) => text.includes(token));
}

function markWhatnotCandidates() {
  state.items = state.items.map((item) => item.approval?.status === "approved" && isWhatnotCandidate(item)
    ? enrichWorkflow({ ...item, channel: "Whatnot", whatnotEligible: true, whatnotChannel: "", whatnotChannelLabel: "", campaignId: "", campaignSuggestion: "" })
    : enrichWorkflow({ ...item, whatnotEligible: item.channel === "Whatnot" })
  );
  saveLocal();
}

function metric(iconLabel, label, value) {
  return `<div class="metric"><span>${icon(iconLabel)}</span><div><strong>${value}</strong><small>${label}</small></div></div>`;
}

function suggestion(label, value) {
  return `<div class="suggestion"><small>${label}</small><strong>${value}</strong></div>`;
}

function visibleItems(items = state.items) {
  return state.boxFilter ? items.filter((item) => item.boxId === state.boxFilter) : items;
}

function getWorkQueues(items = visibleItems()) {
  const approvedItems = items.filter((item) => item.approval?.status === "approved");
  const review = items.filter((item) => item.approval?.status !== "approved" && (
    item.channel === "Pruefen"
    || item.confidence < 70
    || ["Gescannt", "Freigabe"].includes(item.stage)
  ));
  const ebay = approvedItems.filter((item) => item.channel === "eBay");
  const whatnot = approvedItems.filter((item) => item.whatnotEligible || item.channel === "Whatnot");
  const assisted = approvedItems.filter((item) => ["Kleinanzeigen", "Vinted", "Facebook Marketplace", "Spezialforum", "Strongvision", "RAMROD Shop"].includes(item.channel));
  const problem = items.filter((item) => item.channel === "Problemfall");
  const shipping = items.filter((item) => item.stage === "Verkauft" || item.stage === "Versand");
  const sellReady = [...new Map([...ebay, ...whatnot, ...assisted].map((item) => [item.id, item])).values()];

  return {
    review,
    ebay,
    whatnot,
    assisted,
    problem,
    shipping,
    sellReady,
    campaigns: buildWhatnotCampaigns(approvedItems)
  };
}

function workStatus(item) {
  if (item.stage === "Versand") return "Versand";
  if (item.stage === "Verkauft") return "Verkauft";
  if (item.approval?.status === "approved" || item.stage === "Verkaufsbereit") return "Freigegeben";
  if (item.channel === "Problemfall") return "Problem";
  if (item.channel === "Pruefen" || item.confidence < 70) return "Prüfen";
  if (item.ebayDraft) return "eBay-Entwurf";
  if (item.channel === "eBay" || item.channel === "Whatnot" || item.whatnotEligible) return "Verkaufen";
  return "Erfasst";
}

function isDemoItem(item) {
  return String(item.sku || "").includes("DEMO") || String(item.boxId || "").includes("DEMO") || item.sourceType === "demo";
}

function demoBadge(item) {
  return isDemoItem(item) ? `<span class="demo-badge">DEMO</span>` : "";
}

function activeOrganization() {
  return state.activeOrganization
    || state.organizations.find((entry) => entry.id === state.activeOrganizationId)
    || state.organizations[0]
    || { id: "", name: "RAMROD", shortCode: "RR", type: "internal", brandColor: "#ff6a00", role: "operator" };
}

function organizationRail() {
  const organization = activeOrganization();
  return `<aside class="organization-rail" aria-label="Kundenbereiche">
    <button class="platform-mark" data-view="today" type="button" title="RAMROD Start"><img src="/app/assets/ramrod-icon-192.png" alt="" /></button>
    <div class="organization-list">
      ${state.organizations.map((entry) => `<button class="organization-button ${entry.id === organization.id ? "active" : ""}" data-organization="${entry.id}" type="button" title="${escapeHtml(entry.name)}" style="--organization-color:${escapeHtml(entry.brandColor || "#ff6a00")}">${entry.iconUrl ? `<img src="${escapeHtml(entry.iconUrl)}" alt="" />` : `<span>${escapeHtml(entry.shortCode || "OR")}</span>`}</button>`).join("")}
    </div>
    <div class="organization-rail-footer">
      ${state.platformAdmin ? `<button class="organization-action" data-new-organization type="button" title="Kundenbereich anlegen">+</button><button class="organization-action ${state.view === "admin" ? "active" : ""}" data-view="admin" type="button" title="Plattform-Admin">AD</button>` : ""}
    </div>
  </aside>`;
}

function roleLabel(role) {
  return {
    platform_admin: "Plattform-Admin",
    owner: "Inhaber",
    admin: "Admin",
    operator: "Operator",
    viewer: "Lesen"
  }[role] || "Operator";
}

function channelCatalog() {
  return (runtimeChannelCatalog || fallbackChannelCatalog).map((channel) => ({
    ...channel,
    label: channel.name || channel.label || channel.id,
    routeId: channel.name || channel.label || channel.id
  }));
}

function channelLabel(channel) {
  const registryMatch = channelCatalog().find((entry) => entry.id === channel || entry.name === channel || entry.routeId === channel);
  if (registryMatch) return registryMatch.name;
  return {
    Pruefen: "Prüfen",
    eBay: "eBay",
    Whatnot: "Whatnot",
    Kleinanzeigen: "Kleinanzeigen",
    Vinted: "Vinted",
    "Facebook Marketplace": "Facebook Marketplace",
    Spezialforum: "Spezialforum",
    "RAMROD Shop": "RAMROD Shop",
    Strongvision: "Strongvision",
    Bundle: "Bundle",
    Problemfall: "Problemfall"
  }[channel] || channel || "Offen";
}

function channelAlternatives(channel) {
  return {
    eBay: ["RAMROD Shop", "Spezialforum"],
    Whatnot: ["eBay", "RAMROD Shop"],
    Kleinanzeigen: ["Facebook Marketplace"],
    Vinted: ["Kleinanzeigen"],
    "Facebook Marketplace": ["Kleinanzeigen"],
    Spezialforum: ["eBay"],
    Strongvision: ["eBay"]
  }[channel] || [];
}

function channelClass(channel) {
  return String(channel || "offen")
    .toLowerCase()
    .replace("ü", "ue")
    .replace(/[^a-z0-9-]/g, "");
}

function queuePreview(items, emptyText = "Keine offenen Artikel") {
  if (!items.length) return `<p class="muted-copy">${emptyText}</p>`;
  return `<div class="queue-preview">${items.slice(0, 5).map((item) => `<button class="queue-row" data-select="${item.id}" data-view-after="inventory" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${escapeHtml(workStatus(item))} · ${euro(item.fair)}</small></span></button>`).join("")}</div>`;
}

function render() {
  if (state.booting) {
    app.innerHTML = `<section class="auth-shell"><div class="auth-card"><img src="/app/assets/ramrod-icon-192.png" alt="" /><p>RAMROD wird geladen...</p></div></section>`;
    return;
  }

  if (state.recoverySession?.access_token) {
    renderPasswordReset();
    bindPasswordResetEvents();
    return;
  }

  if (state.runtimeConfig.authRequired && !state.authSession?.access_token) {
    renderLogin();
    bindAuthEvents();
    return;
  }

  const items = visibleItems();
  const selected = items.find((item) => item.id === state.selected) || items[0] || state.items.find((item) => item.id === state.selected) || state.items[0];
  const queues = getWorkQueues();
  const stats = {
    count: items.length,
    value: items.reduce((sum, item) => sum + item.fair, 0),
    auto: items.filter((item) => item.confidence >= 70).length,
    review: queues.review.length,
    whatnot: queues.whatnot.length,
    campaigns: queues.campaigns.length
  };
  const organization = activeOrganization();

  app.innerHTML = `
    ${organizationRail()}
    <aside class="sidebar">
      <div class="brand tenant-brand"><span class="tenant-avatar" style="--organization-color:${escapeHtml(organization.brandColor || "#ff6a00")}">${escapeHtml(organization.shortCode || "RR")}</span><div><strong>${escapeHtml(organization.name)}</strong><small>${organization.type === "personal" ? "Privatverkauf" : organization.type === "internal" ? "CREATORS Bereich" : "Kundenbereich"}</small></div></div>
      <nav class="nav-list" aria-label="Arbeitsbereiche">
        ${navButton("today", "HE", "Heute")}
        ${navButton("scan", "ER", "Erfassen")}
        ${navButton("review", "PR", "Prüfen")}
        ${navButton("sell", "VK", "Verkaufen")}
        ${navButton("shipping", "VS", "Versand")}
        ${navButton("inventory", "DB", "Bestand")}
      </nav>
      <nav class="mobile-nav-list" aria-label="Mobiler Arbeitsablauf">
        ${mobileNavButton("scan", "KA", "Scannen")}
        ${mobileNavButton("review", "OK", "Freigeben")}
        ${mobileNavButton("sell", "VK", "Verkäufe")}
      </nav>
    </aside>
    <section class="workspace view-${state.view}">
      <header class="topbar">
        <div><p>${escapeHtml(organization.name)} · ${escapeHtml(roleLabel(organization.role))}</p><h1>${pageTitle()}</h1></div>
        <div class="topbar-actions">
          ${state.view === "admin" ? "" : `<div class="search-box">${icon("SU")}<input id="search" value="${escapeHtml(state.search)}" placeholder="SKU, Titel, Plattform..." /></div>`}
          ${state.runtimeConfig.authRequired ? `<button class="icon-button" id="sign-out" type="button" title="Abmelden">${icon("AU")}</button>` : ""}
        </div>
      </header>
      ${state.importStatus ? `<div class="status-strip">${escapeHtml(state.importStatus)}</div>` : ""}
      ${state.view === "admin" ? "" : `<section class="metrics" aria-label="Kennzahlen">
        ${metric("AR", "Artikel", stats.count)}
        ${metric("AI", "Automatisch", `${stats.count ? Math.round((stats.auto / stats.count) * 100) : 0}%`)}
        ${metric("PR", "Prüfen", stats.review)}
        ${metric("WN", "Whatnot", `${stats.whatnot}/${stats.campaigns}`)}
        ${metric("EU", "Marktwert", euro(stats.value))}
      </section>
      ${boxFilterBar()}`}
      ${viewMarkup(selected)}
    </section>`;

  bindEvents();
}

function renderLogin() {
  app.innerHTML = `<section class="auth-shell">
    <div class="auth-card">
      <img src="/app/assets/ramrod-icon-192.png" alt="" />
      <div><p>RAMROD</p><h1>Anmelden</h1><span>Verkaufsmaschine</span></div>
      <form id="auth-form">
        <label class="field"><span>E-Mail</span><input id="auth-email" name="email" type="email" autocomplete="username" required /></label>
        <label class="field"><span>Passwort</span><input id="auth-password" name="password" type="password" autocomplete="current-password" required /></label>
        ${state.authNotice ? `<div class="auth-notice">${escapeHtml(state.authNotice)}</div>` : ""}
        ${state.authError ? `<div class="auth-error">${escapeHtml(state.authError)}</div>` : ""}
        <button class="primary-action" type="submit" ${state.authLoading ? "disabled" : ""}>${icon("AU")}${state.authLoading ? "Anmeldung läuft..." : "Anmelden"}</button>
        <button class="auth-link" id="forgot-password" type="button" ${state.authResetLoading ? "disabled" : ""}>${state.authResetLoading ? "Reset-Mail wird gesendet..." : "Passwort vergessen?"}</button>
      </form>
    </div>
  </section>`;
}

function renderPasswordReset() {
  app.innerHTML = `<section class="auth-shell">
    <div class="auth-card">
      <img src="/app/assets/ramrod-icon-192.png" alt="" />
      <div><p>RAMROD</p><h1>Neues Passwort</h1><span>Mindestens acht Zeichen</span></div>
      <form id="password-reset-form">
        <label class="field"><span>Neues Passwort</span><input name="password" type="password" autocomplete="new-password" required minlength="8" /></label>
        <label class="field"><span>Passwort wiederholen</span><input name="confirmation" type="password" autocomplete="new-password" required minlength="8" /></label>
        ${state.authError ? `<div class="auth-error">${escapeHtml(state.authError)}</div>` : ""}
        <button class="primary-action" type="submit" ${state.authLoading ? "disabled" : ""}>${icon("OK")}${state.authLoading ? "Wird gespeichert..." : "Passwort speichern"}</button>
      </form>
    </div>
  </section>`;
}

function bindPasswordResetEvents() {
  const form = document.querySelector("#password-reset-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.authLoading) return;
    const password = String(event.currentTarget.elements.password.value || "");
    const confirmation = String(event.currentTarget.elements.confirmation.value || "");
    if (password.length < 8) {
      state.authError = "Das Passwort muss mindestens acht Zeichen lang sein.";
      render();
      return;
    }
    if (password !== confirmation) {
      state.authError = "Die beiden Passwörter stimmen nicht überein.";
      render();
      return;
    }
    state.authLoading = true;
    state.authError = "";
    render();
    try {
      await updateSupabasePassword(password, state.recoverySession.access_token);
      state.recoverySession = null;
      state.authLoading = false;
      state.authNotice = "Passwort gespeichert. Du kannst dich jetzt anmelden.";
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
      render();
    } catch (error) {
      state.authLoading = false;
      state.authError = error.message;
      render();
    }
  });
}

function bindAuthEvents() {
  const form = document.querySelector("#auth-form");
  if (!form) return;

  document.querySelector("#forgot-password")?.addEventListener("click", async () => {
    if (state.authResetLoading) return;
    const email = String(form.elements.email.value || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      state.authError = "Bitte zuerst deine E-Mail-Adresse eingeben.";
      state.authNotice = "";
      render();
      return;
    }
    state.authResetLoading = true;
    state.authError = "";
    state.authNotice = "";
    render();
    try {
      await requestSupabasePasswordReset(email);
      state.authResetLoading = false;
      state.authNotice = "Reset-Mail gesendet. Bitte auch den Spam-Ordner prüfen.";
      render();
    } catch (error) {
      state.authResetLoading = false;
      state.authError = error.message;
      render();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.authLoading) return;
    const email = String(event.target.elements.email.value || "").trim();
    const password = String(event.target.elements.password.value || "");
    state.authLoading = true;
    state.authError = "";
    render();
    try {
      const session = await signInWithPassword(email, password);
      saveAuthSession(session);
      state.authLoading = false;
      await hydrateAppState();
    } catch (error) {
      state.authLoading = false;
      state.authError = error.message;
      render();
    }
  });
}

function pageTitle() {
  return {
    today: "Heute",
    scan: "Scannen",
    review: "Freigeben",
    sell: "Verkäufe",
    shipping: "Versand",
    inventory: "Bestand",
    admin: "Plattform-Admin"
  }[state.view] || "RAMROD";
}

function navButton(id, iconLabel, label) {
  return `<button class="nav-button ${state.view === id ? "active" : ""}" data-view="${id}" type="button" title="${label}">${icon(iconLabel)}<span>${label}</span></button>`;
}

function mobileNavButton(id, iconLabel, label) {
  const groupedViews = id === "sell" ? ["sell", "inventory", "shipping", "campaigns", "routing"] : [id];
  return `<button class="nav-button ${groupedViews.includes(state.view) ? "active" : ""}" data-view="${id}" type="button" title="${label}">${icon(iconLabel)}<span>${label}</span></button>`;
}

function boxLabel(box) {
  if (!box.id) return "Alle Kisten";
  const location = String(box.location || "").replace(/^CREATORS\s*/i, "").trim();
  return `Kiste ${location || box.id}`;
}

function boxButton(box) {
  const selected = state.boxFilter === box.id || (!state.boxFilter && !box.id);
  return `<button class="filter-chip ${selected ? "selected" : ""}" data-box="${box.id}" type="button"><strong>${boxLabel(box)}</strong><small>${box.id || "Gesamter Bestand"}</small></button>`;
}

function boxFilterBar() {
  return `<section class="filter-bar" aria-label="Lagerfilter">
    <div><span>Lagerfilter</span><strong>${state.boxFilter ? boxLabel(boxes.find((box) => box.id === state.boxFilter) || { id: state.boxFilter, location: state.boxFilter }) : "Alle Kisten"}</strong></div>
    <div class="filter-chips">${boxButton({ id: "", label: "Alle Kisten", location: "Gesamter Bestand" })}${boxes.map(boxButton).join("")}</div>
  </section>`;
}

function viewMarkup(selected) {
  if (state.view === "today") return todayView();
  if (state.view === "scan") return scanView();
  if (state.view === "review") return reviewView(selected);
  if (state.view === "sell") return sellView();
  if (state.view === "routing") return routingView();
  if (state.view === "campaigns") return campaignsView();
  if (state.view === "shipping") return shippingView();
  if (state.view === "admin") return adminView();
  return inventoryView(selected);
}

function todayView() {
  const queues = getWorkQueues();
  const nextAction = queues.review.length ? "Prüfen starten" : queues.sellReady.length ? "Verkaufen vorbereiten" : "Neue Artikel erfassen";
  const nextView = queues.review.length ? "review" : queues.sellReady.length ? "sell" : "scan";
  const items = visibleItems();

  return `<section class="operator-dashboard">
    <div class="day-focus">
      <div>
        <p>Nächster sinnvoller Schritt</p>
        <h2>${nextAction}</h2>
        <span>${queues.review.length} Prüfung · ${queues.ebay.length} eBay · ${queues.campaigns.length} Whatnot-Kampagnen · ${queues.shipping.length} Versand</span>
      </div>
      <button class="primary-action inline-action" data-view="${nextView}" type="button">${icon("GO")}${nextAction}</button>
    </div>
    <div class="task-grid">
      ${taskCard("Erfassen", "Neue Ware scannen oder Fotos hochladen.", "scan", "ER", items.filter((item) => item.stage === "Gescannt" || item.stage === "Eingang").length, queuePreview(items.slice(0, 3)))}
      ${taskCard("Prüfen", "Unsichere Preise, Zustände und Plattformen entscheiden.", "review", "PR", queues.review.length, queuePreview(queues.review))}
      ${taskCard("Verkaufen", "eBay-Entwürfe und Whatnot-Kampagnen vorbereiten.", "sell", "VK", queues.sellReady.length, queuePreview(queues.sellReady))}
      ${taskCard("Versand", "Verkaufte Artikel finden, packen und verschicken.", "shipping", "VS", queues.shipping.length, queuePreview(queues.shipping, "Noch keine verkauften Artikel im Versand."))}
    </div>
    ${devMode ? `<details class="dev-tools">
      <summary>Demo- und Importwerkzeuge</summary>
      <div><button class="secondary-action" id="load-ai-import" type="button">${icon("AI")}AI Import laden</button><button class="secondary-action" id="load-channel-plan" type="button">${icon("RT")}Channel Plan laden</button></div>
    </details>` : ""}
  </section>`;
}

function taskCard(title, description, view, iconLabel, count, body) {
  return `<article class="task-card">
    <div class="task-card-head"><span>${icon(iconLabel)}</span><div><strong>${title}</strong><small>${description}</small></div><em>${count}</em></div>
    ${body}
    <button class="secondary-action" data-view="${view}" type="button">${title} öffnen</button>
  </article>`;
}

function scanView() {
  const photos = state.draft.photos?.length
    ? state.draft.photos
    : state.draft.photo
      ? [{ dataUrl: state.draft.photo, quality: null }]
      : [];
  const batchMode = state.captureMode === "batch";
  const photoLimit = batchMode ? 6 : 4;
  const currentBatchNumber = state.batchDrafts.length + 1;
  const capturedCount = state.batchDrafts.length + (photos.length ? 1 : 0);
  const activeStep = state.analyzing ? 4 : state.recognition ? 3 : state.recognizing ? 2 : 1;
  const actionLabel = state.analyzing
    ? "Analyse läuft..."
    : state.recognizing
      ? "Produkt wird erkannt..."
      : state.recognition?.evidence?.status === "ready_for_research"
        ? "Preis, Kanal und Strategie ermitteln"
        : state.recognition
          ? "Analyse mit Prüfung fortsetzen"
          : "Artikel analysieren";
  const actionDisabled = state.analyzing || state.recognizing || (!photos.length && !devMode);
  const needsPhotoEvidence = Boolean(state.recognition && state.recognition.evidence?.status !== "ready_for_research");
  const manualFields = `<details class="capture-details">
    <summary>Optionale Angaben</summary>
    <div class="form-grid">
      ${field("Artikelhinweis", `<input id="query" value="${escapeHtml(state.draft.query)}" placeholder="z.B. Pokemon Display, PS3, Handtasche" />`)}
      ${field("Barcode / Seriennummer", `<div class="input-with-icon">${icon("BC")}<input id="barcode" value="${escapeHtml(state.draft.barcode)}" placeholder="optional" /></div>`)}
      ${field("Kiste", `<select id="boxId">${boxes.map((box) => `<option ${box.id === state.draft.boxId ? "selected" : ""}>${box.id}</option>`).join("")}</select>`)}
      ${field("Zustand", `<select id="condition">${["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"].map((value) => `<option ${value === state.draft.condition ? "selected" : ""}>${value}</option>`).join("")}</select>`)}
      ${field("Gewicht kg", `<div class="input-with-icon">${icon("KG")}<input id="weight" value="${escapeHtml(state.draft.weight)}" inputmode="decimal" /></div>`)}
      ${field("Vollständigkeit", `<input id="completeness" value="${escapeHtml(state.draft.completeness)}" />`)}
    </div>
  </details>`;

  return `<section class="work-grid ${batchMode ? "batch-capture-workspace" : ""}">
    <div class="scan-panel">
      <div class="panel-heading"><div><p>${batchMode ? `Serienaufnahme · Artikel ${currentBatchNumber}` : "Einzelaufnahme"}</p><h2>${batchMode ? "Viele Artikel nacheinander" : "Einen Artikel analysieren"}</h2></div><button class="icon-button" id="reset" title="Aufnahme zurücksetzen">${icon("NE")}</button></div>
      <div class="capture-mode" role="group" aria-label="Aufnahmemodus">
        <button class="${batchMode ? "" : "selected"}" data-capture-mode="single" type="button">Ein Artikel</button>
        <button class="${batchMode ? "selected" : ""}" data-capture-mode="batch" type="button">Serienaufnahme</button>
      </div>
      ${batchMode
        ? `<div class="batch-instruction"><strong>${state.batchDrafts.length} Artikel gespeichert</strong><span>Fotografiere alle Seiten dieses Artikels. Danach „Nächster Artikel“.</span></div>`
        : `<div class="workflow-progress" aria-label="Verkaufsworkflow">${["Foto", "Erkennen", "Markt", "Strategie", "Freigeben"].map((label, index) => `<span class="${activeStep === index + 1 ? "active" : activeStep > index + 1 ? "done" : ""}">${index + 1} ${label}</span>`).join("")}</div>`}
      <label class="photo-drop ${needsPhotoEvidence ? "attention-required" : ""}">${photos[0] ? `<img src="${photos[0].dataUrl}" alt="Artikelvorschau" />` : `<span>${icon("KA")}<strong>${batchMode ? `Artikel ${currentBatchNumber} fotografieren` : "Erstes Foto aufnehmen"}</strong><small>Vorderseite vollständig und gerade</small></span>`}<input id="photo" accept="image/*" capture="environment" type="file" multiple /></label>
      <div class="photo-capture-meta"><span>${photos.length}/${photoLimit} Ansichten</span><strong>${photos.length ? "Weiteres Foto desselben Artikels" : "Kamera oder Mediathek"}</strong></div>
      ${photos.length ? `<div class="photo-thumbnails">${photos.map((photo, index) => `<div><img src="${photo.dataUrl}" alt="Ansicht ${index + 1}" /><button data-remove-photo="${index}" type="button" title="Foto entfernen">×</button><small>${photo.quality ? `${photo.quality.score}% Bildqualität` : `Ansicht ${index + 1}`}</small></div>`).join("")}</div>` : ""}
      ${manualFields}
      ${batchMode
        ? `<div class="batch-capture-actions">
            <button class="secondary-action" id="batch-next" type="button" ${!photos.length || state.batchAnalyzing ? "disabled" : ""}>${icon("NX")}Nächster Artikel</button>
            <button class="primary-action" id="batch-finish" type="button" ${!capturedCount || state.batchAnalyzing ? "disabled" : ""}>${icon("AI")}${state.batchAnalyzing ? "Sammelanalyse läuft..." : `${capturedCount} Artikel analysieren`}</button>
          </div>`
        : `<button class="primary-action mobile-primary-action" id="add-item" type="button" ${actionDisabled ? "disabled" : ""}>${icon("AI")}${actionLabel}</button>`}
    </div>
    <div class="ai-panel">
      ${batchMode ? batchCapturePanel() : fastRecognitionPanel(photos)}
    </div>
  </section>`;
}

function batchCapturePanel() {
  const progress = state.batchProgress;
  if (state.batchAnalyzing && progress) {
    const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
    return `<div class="panel-heading"><div><p>Sammelanalyse</p><h2>${progress.completed}/${progress.total} verarbeitet</h2></div>${icon("AI")}</div>
      <div class="batch-progress"><span><i style="width:${percent}%"></i></span><strong>${escapeHtml(progress.label || "Artikel werden analysiert")}</strong><small>${progress.failed} benötigen bisher eine manuelle Prüfung.</small></div>
      ${batchDraftList()}`;
  }

  return `<div class="panel-heading"><div><p>Aufnahmesession</p><h2>${state.batchDrafts.length} Artikel bereit</h2></div>${icon("ST")}</div>
    <div class="batch-explainer"><strong>Erst fotografieren, dann gemeinsam analysieren.</strong><p>Weitere Ansichten gehören zum aktuellen Artikel. Mit „Nächster Artikel“ beginnt das nächste Objekt.</p></div>
    ${batchDraftList()}`;
}

function batchDraftList() {
  if (!state.batchDrafts.length) return `<div class="recognition-empty"><strong>Noch kein Artikel abgeschlossen</strong><p>Fotografiere den ersten Artikel von mehreren Seiten.</p></div>`;
  return `<div class="batch-draft-list">${state.batchDrafts.map((entry, index) => `<article class="batch-draft-row">
    <img src="${entry.draft.photos[0]?.dataUrl || entry.draft.photo}" alt="Artikel ${index + 1}" />
    <span><strong>Artikel ${index + 1}</strong><small>${entry.draft.photos.length} Ansicht${entry.draft.photos.length === 1 ? "" : "en"} · ${escapeHtml(batchEntryStatus(entry.status))}</small></span>
    ${state.batchAnalyzing ? "" : `<button data-remove-batch="${entry.id}" type="button" title="Artikel aus Session entfernen">×</button>`}
  </article>`).join("")}</div>`;
}

function batchEntryStatus(status) {
  return {
    captured: "bereit",
    recognizing: "wird erkannt",
    analyzing: "Strategie wird berechnet",
    completed: "analysiert",
    failed: "manuell prüfen"
  }[status] || "bereit";
}

function cloneCaptureDraft(draft) {
  return {
    ...draft,
    photos: (draft.photos || []).map((photo) => ({ ...photo, quality: photo.quality ? { ...photo.quality } : null }))
  };
}

function queueCurrentBatchDraft() {
  const photos = state.draft.photos || [];
  if (!photos.length) return false;
  state.batchDrafts.push({
    id: makeId(),
    status: "captured",
    draft: cloneCaptureDraft(state.draft)
  });
  state.recognitionRequestId += 1;
  state.draft = createEmptyDraft(state.draft.boxId);
  state.recognition = null;
  state.recognitionMeta = null;
  return true;
}

async function runBatchAnalysis() {
  if (state.batchAnalyzing) return;
  queueCurrentBatchDraft();
  const entries = [...state.batchDrafts];
  if (!entries.length) return;

  state.batchAnalyzing = true;
  state.batchProgress = { total: entries.length, completed: 0, failed: 0, label: "Sammelanalyse wird vorbereitet" };
  state.importStatus = `${entries.length} Artikel werden gemeinsam analysiert. Du kannst das Smartphone liegen lassen.`;
  render();

  const completedItemIds = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    try {
      state.draft = cloneCaptureDraft(entry.draft);
      state.recognition = null;
      state.recognitionMeta = null;
      entry.status = "recognizing";
      state.batchProgress.label = `Artikel ${index + 1}: Produkt erkennen`;
      render();

      const recognition = await runFastRecognition();
      if (!recognition) throw new Error("Produkt konnte nicht erkannt werden");

      entry.status = "analyzing";
      state.batchProgress.label = `Artikel ${index + 1}: Preis, Kanal und Strategie`;
      render();
      const item = enrichWorkflow(await analyzeWithApi());
      item.recognition = recognition;
      item.recognitionEvidence = recognition.evidence || null;
      if (recognition.evidence?.status !== "ready_for_research") {
        item.channel = "Pruefen";
        item.stage = "Gescannt";
        Object.assign(item, enrichWorkflow(item));
      }
      state.items.unshift(item);
      state.selected = item.id;
      await persistItem(item, `Artikel ${index + 1}`);
      entry.status = "completed";
      entry.itemId = item.id;
      completedItemIds.push(item.id);
    } catch (error) {
      entry.status = "failed";
      entry.error = error.message;
      state.batchProgress.failed += 1;
    } finally {
      state.batchProgress.completed += 1;
      render();
    }
  }

  const failedEntries = entries.filter((entry) => entry.status === "failed");
  state.batchSummary = {
    itemIds: completedItemIds,
    total: entries.length,
    completed: completedItemIds.length,
    failed: failedEntries.length,
    createdAt: new Date().toISOString()
  };
  state.batchDrafts = failedEntries.map((entry) => ({ ...entry, status: "captured" }));
  state.batchAnalyzing = false;
  state.batchProgress = null;
  state.draft = createEmptyDraft(state.draft.boxId);
  state.recognition = null;
  state.recognitionMeta = null;
  state.view = "review";
  state.importStatus = `${completedItemIds.length} Artikel analysiert${failedEntries.length ? ` · ${failedEntries.length} Aufnahme${failedEntries.length === 1 ? "" : "n"} erneut prüfen` : ""}. Preischecks laufen im Hintergrund.`;
  saveLocal();
  render();
}

function fastRecognitionPanel(photos) {
  if (state.recognizing) {
    return `<div class="panel-heading"><div><p>Schnellerkennung</p><h2>Produkt wird gelesen</h2></div>${icon("AI")}</div>
      <div class="recognition-running"><span class="activity-line"></span><strong>Text, Marke und Variante werden geprüft</strong><small>${photos.length} Foto${photos.length === 1 ? "" : "s"} · Preis und Strategie folgen separat</small></div>`;
  }

  const recognition = state.recognition;
  if (!recognition) {
    const qualityIssues = photos.flatMap((photo) => photo.quality?.issues || []);
    return `<div class="panel-heading"><div><p>Schnellerkennung</p><h2>Noch kein Produkt erkannt</h2></div>${icon("AI")}</div>
      <div class="recognition-empty"><strong>${photos.length ? "Foto bereit" : "Fotografiere zuerst den Artikel"}</strong><p>${qualityIssues.length ? escapeHtml(qualityIssues.join(" · ")) : "RAMROD prüft zuerst Bildqualität und Identität. Marktpreis und Verkaufsstrategie werden erst danach berechnet."}</p></div>`;
  }

  const identity = recognition.identity || {};
  const evidence = recognition.evidence || {};
  const score = Number(evidence.score || 0);
  const missing = recognition.missingEvidence || [];
  const requests = recognition.requestedPhotos || [];
  const visibleText = recognition.visibleText || [];
  const statusLabel = {
    ready_for_research: "Bereit für Quellenabgleich",
    needs_more_evidence: "Zusatzbeleg erforderlich",
    needs_better_photo: "Besseres Foto erforderlich"
  }[evidence.status] || "Prüfung erforderlich";
  const provider = state.recognitionMeta?.provider === "openai-fast" ? "Cloud-Schnellerkennung" : "Lokale Schnellerkennung";
  const seconds = state.recognitionMeta?.durationMs ? `${(state.recognitionMeta.durationMs / 1000).toFixed(1)} s` : "";
  const rotation = Number(state.recognitionMeta?.autoRotation || 0);
  const rotationLabel = rotation ? ` · Foto ${rotation}° korrigiert` : "";

  return `<div class="panel-heading"><div><p>Schnellerkennung</p><h2>${escapeHtml(identity.title || "Identität noch offen")}</h2></div>${icon("AI")}</div>
    <div class="evidence-hero ${evidence.status || "needs_more_evidence"}">
      <div><strong>${score}%</strong><span>Evidenz</span></div>
      <div><strong>${escapeHtml(statusLabel)}</strong><small>${escapeHtml(provider)}${seconds ? ` · ${seconds}` : ""}${rotationLabel}</small></div>
    </div>
    <div class="confidence"><span style="width:${score}%"></span></div>
    <div class="suggestion-list">
      ${suggestion("Produkttyp", escapeHtml(identity.productType || "Offen"))}
      ${suggestion("Kategorie", escapeHtml(identity.category || "Offen"))}
      ${suggestion("Marke", escapeHtml(identity.brand || "Nicht belegt"))}
      ${suggestion("Plattform / Modell", escapeHtml(identity.platform || identity.modelNumber || "Nicht belegt"))}
    </div>
    ${visibleText.length ? `<section class="recognition-evidence"><strong>Sichtbar gelesen</strong><div>${visibleText.slice(0, 8).map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}</div></section>` : ""}
    ${missing.length ? `<section class="recognition-missing"><strong>Noch nicht belegt</strong><p>${missing.slice(0, 5).map(escapeHtml).join(" · ")}</p></section>` : ""}
    ${requests.length ? `<section class="requested-photos"><strong>Nächstes hilfreiches Foto</strong>${requests.slice(0, 3).map((entry) => `<div>${icon("KA")}<span>${escapeHtml(entry.instruction)}</span></div>`).join("")}</section>` : ""}
    ${scanReleaseGuide(recognition)}`;
}

function scanReleaseGuide(recognition) {
  const evidence = recognition.evidence || {};
  const identityReady = evidence.status === "ready_for_research";
  const missing = Array.isArray(recognition.missingEvidence) ? recognition.missingEvidence.filter(Boolean) : [];
  const request = recognition.requestedPhotos?.[0]?.instruction || "Zusätzliche Kennzeichnung oder Rückseite fotografieren";
  return `<section class="scan-release-guide ${identityReady ? "ready" : "blocked"}">
    <div class="release-guide-head">
      <div><small>Nächster Schritt</small><strong>${identityReady ? "Markt und Verkaufsstrategie berechnen" : "Identität vervollständigen"}</strong></div>
      <span>${identityReady ? "1/3 bereit" : "Foto fehlt"}</span>
    </div>
    <div class="release-guide-list">
      ${releaseGuideRow(true, "Produkt erkannt", recognition.identity?.title || "Produktkandidat erkannt")}
      ${releaseGuideRow(identityReady, identityReady ? "Bildbelege ausreichend" : "Zusatzbeleg fehlt", identityReady ? "RAMROD kann mit der Marktrecherche fortfahren." : (missing.join(" · ") || request))}
      ${releaseGuideRow(false, "Preisquellen abgleichen", identityReady ? "Startet automatisch mit dem nächsten Button." : "Startet nach ausreichender Produkterkennung.", true)}
      ${releaseGuideRow(false, "Pflichtangaben prüfen", "Werden nach der Analyse einzeln angezeigt und können dort direkt ergänzt werden.", true)}
    </div>
    <button class="${identityReady ? "primary-action" : "secondary-action"} release-guide-action" ${identityReady ? "data-run-next-step" : "data-capture-more"} type="button">${icon(identityReady ? "AI" : "KA")}${identityReady ? "Preis, Kanal und Strategie ermitteln" : "Fehlendes Foto aufnehmen"}</button>
  </section>`;
}

function releaseGuideRow(done, label, note, upcoming = false) {
  const status = done ? "done" : upcoming ? "upcoming" : "missing";
  const mark = done ? "OK" : upcoming ? "NX" : "!";
  return `<div class="release-guide-row ${status}">${icon(mark)}<p><strong>${escapeHtml(label)}</strong><span>${escapeHtml(note)}</span></p></div>`;
}

function field(label, control) {
  return `<label class="field"><span>${label}</span>${control}</label>`;
}

function reviewView(selected) {
  const needle = state.search.toLowerCase();
  const reviewItems = getWorkQueues().review.filter((item) => [item.title, item.sku, item.category, item.channel, item.boxId].join(" ").toLowerCase().includes(needle));
  const active = reviewItems.find((item) => item.id === selected?.id) || reviewItems[0];
  if (active && !reviewItems.some((item) => item.id === state.selected)) state.selected = active.id;

  if (!reviewItems.length) {
    return `<div class="review-flow">${batchSummaryCard()}<section class="empty-state"><h2>Keine offenen Freigaben</h2><p>Alle analysierten Artikel sind bereits freigegeben oder warten in ihrer Verkaufsübersicht.</p><button class="primary-action inline-action" data-view="scan" type="button">${icon("ER")}Weitere Artikel scannen</button></section></div>`;
  }

  return `<div class="review-flow">${batchSummaryCard()}<section class="inventory-layout review-workspace">
    <div class="inventory-list">
      <div class="panel-heading"><div><p>Freigaben</p><h2>Was braucht deine Entscheidung?</h2></div><span class="queue-count">${reviewItems.length} offen</span></div>
      ${reviewItems.map(itemRow).join("")}
    </div>
    ${active ? inspector(active) : ""}
  </section></div>`;
}

function batchSummaryCard() {
  const summary = state.batchSummary;
  if (!summary) return "";
  const items = (summary.itemIds || []).map((id) => state.items.find((item) => item.id === id)).filter(Boolean);
  const approved = items.filter((item) => item.approval?.status === "approved");
  const openItems = items.filter((item) => item.approval?.status !== "approved");
  const ready = openItems.filter((item) => releaseRequirements(item).every((entry) => entry.ready));
  const waiting = openItems.filter((item) => releaseRequirements(item).some((entry) => entry.id === "sources" && !entry.ready && entry.pending));
  const manual = openItems.filter((item) => !ready.includes(item) && !waiting.includes(item));
  return `<section class="batch-summary-card">
    <div class="batch-summary-head"><div><p>Sammelanalyse abgeschlossen</p><h2>${summary.completed} Artikel verarbeitet</h2></div><button class="icon-button" data-dismiss-batch-summary type="button" title="Zusammenfassung schließen">×</button></div>
    <div class="batch-summary-stats">
      ${suggestion("Freigabebereit", ready.length)}
      ${suggestion("Marktcheck läuft", waiting.length)}
      ${suggestion("Manuell prüfen", manual.length + Number(summary.failed || 0))}
      ${suggestion("Freigegeben", approved.length)}
    </div>
    <div class="batch-summary-actions">
      <button class="primary-action" data-bulk-approve type="button" ${ready.length ? "" : "disabled"}>${icon("OK")}${ready.length ? `${ready.length} sichere Artikel freigeben` : waiting.length ? "Marktchecks laufen" : "Keine Sammelfreigabe möglich"}</button>
      <button class="secondary-action" data-view="scan" type="button">${icon("KA")}Weitere scannen</button>
    </div>
  </section>`;
}

function inventoryView(selected) {
  const needle = state.search.toLowerCase();
  const filtered = visibleItems().filter((item) => [item.title, item.sku, item.category, item.channel, item.boxId, item.whatnotChannelLabel, item.campaignSuggestion].join(" ").toLowerCase().includes(needle));
  const active = filtered.find((item) => item.id === selected?.id) || filtered[0];
  if (active && active.id !== state.selected) state.selected = active.id;
  return `<section class="inventory-layout">
    <div class="inventory-list"><div class="panel-heading"><div><p>Bestand</p><h2>Artikelkarten</h2></div><button class="icon-button" data-view="scan" title="Artikel hinzufügen">${icon("PL")}</button></div>${filtered.map(itemRow).join("")}</div>
    ${active ? inspector(active) : `<section class="empty-state compact-empty"><h2>Kein Treffer</h2><p>Ändere Suche oder Lagerfilter, um wieder Artikel zu sehen.</p></section>`}
  </section>`;
}

function itemRow(item) {
  const strategy = normalizeSalesStrategy(item);
  return `<button class="item-row ${state.selected === item.id ? "active" : ""}" data-select="${item.id}" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${escapeHtml(workStatus(item))}</small><small class="item-recommendation">Empfehlung: ${escapeHtml(channelLabel(item.channel))} · ${euro(strategy.targetPrice || item.fair)}</small></span><span class="row-meta">${demoBadge(item)}<em>${euro(item.fair)}</em></span></button>`;
}

function inspector(item) {
  const script = item.whatnotScript || `Start bei ${euro(Math.max(1, Math.round(item.low * 0.6)))}. ${item.franchise} / ${item.category}, Zustand: ${item.condition}. Fairer Preisanker liegt bei ${euro(item.fair)}. ${item.completeness}. Kurz in die Kamera halten und besondere Details zeigen.`;
  const research = (item.research || []).map((comp) => Array.isArray(comp)
    ? comp
    : [comp.source, comp.label, comp.price, comp.age]
  );
  const otherVisible = item.otherVisibleItems?.length
    ? `<section class="script-box"><h3>Nebenartikel im Foto</h3><p>${item.otherVisibleItems.map((entry) => `${entry.title} (${entry.confidence}%): ${entry.note}`).join(" ")}</p></section>`
    : "";
  return `<div class="inspector">
    <div class="inspector-media"><img src="${item.image}" alt="${escapeHtml(item.title)}" /></div>
    <div class="inspector-content">
      <div class="breadcrumb"><button data-view="today" type="button">Heute</button><span>›</span><button data-view="${state.view}" type="button">${escapeHtml(pageTitle())}</button><span>›</span><strong>${escapeHtml(item.sku)}</strong></div>
      <div class="inspector-title"><div><p>${item.sku} ${demoBadge(item)}</p><h2>${escapeHtml(item.title)}</h2></div><span class="channel-badge ${channelClass(item.channel)}">${channelLabel(item.channel)}</span></div>
      <div class="source-strip">${sourceBadge(item)}</div>
      ${salesStrategyCard(item)}
      <button class="mobile-details-toggle" data-toggle-item-details="${item.id}" type="button">${state.mobileDetailsItem === item.id ? "Weniger Details" : "Preisquellen, Zustand und Alternativen"}<span aria-hidden="true">${state.mobileDetailsItem === item.id ? "−" : "+"}</span></button>
      <div class="item-secondary-details ${state.mobileDetailsItem === item.id ? "expanded" : ""}">
        <div class="price-grid">${suggestion("Minimum", euro(item.low))}${suggestion("Marktwert", euro(item.fair))}${suggestion("Optimistisch", euro(item.aggressive))}${suggestion("Erkennung", `${item.confidence}%`)}</div>
        <div class="draft-actions">
          <button class="secondary-action" data-price-check="${item.id}" type="button">${icon("EU")}${state.priceChecking === item.id ? "Prüfe..." : "Preise checken"}</button>
          <button class="secondary-action" data-ebay-draft="${item.id}" type="button">${icon("EB")}${state.ebayDrafting === item.id ? "Baue..." : "eBay-Entwurf"}</button>
        </div>
        ${priceCheckCard(item)}
        ${ebayDraftCard(item)}
        ${channelPicker(item)}
        ${whatnotRoutingCard(item)}
        <div class="detail-grid">${suggestion("Kiste", item.boxId)}${suggestion("Zustand", item.condition)}${suggestion("Vollständigkeit", item.completeness)}${suggestion("Gewicht", `${item.weight.toFixed(2)} kg`)}</div>
        <section class="research"><h3>Preisquellen</h3>${research.map((comp) => `<div class="research-row"><span>${comp[0]}</span><strong>${comp[1]}</strong><em>${comp[2] ? euro(comp[2]) : "Regel"}</em><small>${comp[3]}</small></div>`).join("")}</section>
        <section class="script-box"><h3>Whatnot Skript</h3><p>${script}</p></section>
        ${otherVisible}
      </div>
    </div>
  </div>`;
}

function salesStrategyCard(item) {
  const strategy = normalizeSalesStrategy(item);
  const repair = strategy.repairDecision;
  const approved = item.approval?.status === "approved";
  const requirements = releaseRequirements(item);
  const blockers = requirements.filter((entry) => !entry.ready);
  const pricePending = ["queued", "running"].includes(item.automationJob?.status) && !item.priceCheck;
  const disabled = !approved && (blockers.length > 0 || Boolean(state.approving));
  const approvalLabel = approved
    ? "Verkauf freigegeben"
    : pricePending
      ? "Marktcheck läuft"
      : blockers[0]?.id === "sources"
        ? "Zuerst Preise prüfen"
        : blockers[0]?.id === "required"
          ? "Pflichtangaben ergänzen"
          : blockers[0]?.id === "channel"
            ? "Verkaufskanal wählen"
          : state.approving === item.id
            ? "Verkauf wird vorbereitet..."
            : "Verkauf freigeben";
  const action = strategyActionLabel(strategy.recommendedAction);
  const repairLabel = repairDecisionLabel(repair.recommendation);

  return `<section class="sales-strategy-card ${blockers.length ? "has-release-blockers" : "release-ready"}">
    <div class="recommendation-banner">
      <div><small>RAMROD empfiehlt</small><h3>${escapeHtml(channelLabel(item.channel))} · ${euro(strategy.targetPrice)}</h3><p>${escapeHtml(strategy.routeReason)}</p></div>
      <span class="strategy-action">${escapeHtml(action)}</span>
    </div>
    ${channelPlanCard(strategy.channelPlan)}
    <div class="strategy-metrics">
      ${suggestion("Format", escapeHtml(salesFormatLabel(strategy.salesFormat)))}
      ${suggestion("Untergrenze", euro(strategy.minimumAcceptablePrice))}
      ${suggestion("Verkaufsdauer", escapeHtml(salesTimeLabel(strategy.expectedTimeToSell)))}
    </div>
    ${releaseChecklist(item, requirements)}
    ${requiredItemFieldsEditor(item, requirements.find((entry) => entry.id === "required"))}
    <div class="approval-bar ${approved ? "approved" : ""}">
      <div><strong>${approved ? "Freigegeben" : blockers.length ? `${blockers.length} Schritt${blockers.length === 1 ? "" : "e"} bis zur Freigabe` : "Bereit für deine Entscheidung"}</strong><span>${escapeHtml(approved ? item.approval.summary || strategy.approvalSummary : blockers.length ? blockers.map((entry) => entry.label).join(" · ") : strategy.approvalSummary)}</span></div>
      <button class="primary-action inline-action" data-approve-sale="${item.id}" type="button" ${disabled || approved ? "disabled" : ""}>${icon(approved ? "OK" : "GO")}${approvalLabel}</button>
    </div>
    <details class="strategy-details">
      <summary>Warum diese Empfehlung?</summary>
      <p class="strategy-rationale">${escapeHtml(strategy.rationale)}</p>
      <div class="repair-decision ${repair.recommendation}">
        <div><small>Aufbereitung / Reparatur</small><strong>${escapeHtml(repairLabel)}</strong><p>${escapeHtml(repair.action)}</p></div>
        <div class="repair-economics">
          ${suggestion("Kosten", strategyRange(repair.estimatedCostLow, repair.estimatedCostHigh))}
          ${suggestion("Mehrerlös", strategyRange(repair.estimatedValueGainLow, repair.estimatedValueGainHigh))}
          ${suggestion("Netto-Schätzung", euro(repair.netGainEstimate))}
        </div>
        <small class="strategy-caveat">${escapeHtml(repair.caveat)}</small>
      </div>
      <div class="strategy-columns">
        ${strategyChecklist("Vorbereiten", strategy.preparationSteps)}
        ${strategyChecklist("Noch prüfen", strategy.requiredChecks)}
        ${strategyChecklist("Fotoliste", strategy.photoChecklist)}
      </div>
      ${strategy.detectedDefects.length ? `<div class="defect-strip"><strong>Erkannte Punkte</strong><span>${strategy.detectedDefects.map(escapeHtml).join(" · ")}</span></div>` : ""}
    </details>
  </section>`;
}

function channelPlanCard(plan) {
  if (!plan?.primary) return "";
  const nextChannels = [...(plan.parallel || []), ...(plan.discovery || [])];
  return `<section class="channel-plan-card" aria-label="Verkaufsplan">
    <div class="channel-plan-head">
      <div><small>Verkaufsplan</small><strong>Wo der Artikel verkauft und beworben wird</strong></div>
      <span>${nextChannels.length + (plan.fallback ? 1 : 0)} weitere</span>
    </div>
    <div class="channel-plan-steps">
      ${channelPlanStep(plan.primary, 1, "Jetzt")}
      ${nextChannels.map((entry, index) => channelPlanStep(entry, index + 2, entry.role === "discovery" ? "Reichweite" : "Parallel")).join("")}
      ${plan.fallback ? channelPlanStep(plan.fallback, nextChannels.length + 2, "Falls unverkauft") : ""}
    </div>
    <p class="channel-plan-policy">${escapeHtml(plan.inventoryPolicy?.note || "RAMROD hält den Bestand zentral und verhindert Doppelverkäufe.")}</p>
  </section>`;
}

function channelPlanStep(entry, index, phase) {
  const statusTone = ["draft-ready", "connected"].includes(entry.status)
    ? "ready"
    : entry.status === "assisted"
      ? "assisted"
      : entry.activation === "blocked"
        ? "blocked"
        : "planned";
  return `<article class="channel-plan-step ${statusTone}">
    <span class="channel-plan-index">${index}</span>
    <div class="channel-plan-copy"><small>${escapeHtml(phase)} · ${escapeHtml(entry.roleLabel || "Kanal")}</small><strong>${escapeHtml(channelLabel(entry.name))}</strong><p>${escapeHtml(entry.reason || "Als Verkaufskanal prüfen.")}</p></div>
    <div class="channel-plan-status"><strong>${entry.targetPrice ? euro(entry.targetPrice) : ""}</strong><span>${escapeHtml(entry.statusLabel || channelActivationLabel(entry.activation))}</span></div>
  </article>`;
}

function channelActivationLabel(value) {
  return {
    blocked: "Prüfung nötig",
    "after-approval": "Nach Freigabe",
    "manual-after-approval": "Manuell nach Freigabe",
    "when-connector-ready": "Nach Connector",
    "when-shop-sync-ready": "Nach Shop-Sync",
    "content-after-approval": "Content vorbereiten",
    "after-14-days": "Nach 14 Tagen",
    "after-30-days": "Nach 30 Tagen",
    "expert-review": "Expertenprüfung"
  }[value] || "Geplant";
}

function releaseRequirements(item) {
  const unknown = /^(unbekannt|unbekannter sammlerartikel|offen|nicht belegt|prüfen|pruefen|-)?$/i;
  const unchecked = /^(ungeprüft|ungeprueft|offen|prüfen|pruefen|-)/i;
  const titleReady = Boolean(String(item.title || "").trim()) && !unknown.test(String(item.title || "").trim());
  const categoryReady = Boolean(String(item.category || "").trim()) && !unknown.test(String(item.category || "").trim());
  const conditionReady = Boolean(String(item.condition || "").trim()) && !unknown.test(String(item.condition || "").trim());
  const completenessReady = Boolean(String(item.completeness || "").trim()) && !unchecked.test(String(item.completeness || "").trim());
  const imageReady = Boolean(item.image);
  const evidenceStatus = item.recognitionEvidence?.status || item.recognition?.evidence?.status || "";
  const evidenceReady = !evidenceStatus || evidenceStatus === "ready_for_research" || Boolean(item.requiredFieldsConfirmedAt);
  const fieldState = { title: titleReady, category: categoryReady, condition: conditionReady, completeness: completenessReady, image: imageReady };
  const missingFields = Object.entries(fieldState).filter(([, ready]) => !ready).map(([name]) => name);
  const requiredReady = missingFields.length === 0 && evidenceReady;
  const sourcePending = ["queued", "running"].includes(item.automationJob?.status) && !item.priceCheck;
  const channelReady = Boolean(item.channel) && !["Pruefen", "Problemfall"].includes(item.channel);
  const evidenceMissing = Array.isArray(item.recognition?.missingEvidence) ? item.recognition.missingEvidence.filter(Boolean) : [];

  return [
    {
      id: "required",
      label: "Pflichtangaben bestätigen",
      ready: requiredReady,
      detail: requiredReady
        ? "Identität, Kategorie, Zustand und Lieferumfang sind bestätigt."
        : missingFields.length
          ? `Fehlt: ${missingFields.map(releaseFieldLabel).join(", ")}.`
          : evidenceMissing.length
            ? `Noch bestätigen: ${evidenceMissing.slice(0, 3).join(" · ")}.`
            : "Identität oder Variante muss einmal bestätigt werden.",
      missingFields
    },
    {
      id: "sources",
      label: "Preisquellen abgleichen",
      ready: Boolean(item.priceCheck),
      pending: sourcePending,
      detail: item.priceCheck
        ? `Marktwert ${euro(item.priceCheck.fair || item.fair)} aus ${priceCheckProviderLabel(item.priceCheck.method)}.`
        : sourcePending
          ? "eBay- und Web-Quellen werden gerade automatisch geprüft."
          : "Es wurde noch kein Live-Quellenabgleich durchgeführt."
    },
    {
      id: "channel",
      label: "Verkaufskanal festlegen",
      ready: channelReady,
      detail: channelReady
        ? `${channelLabel(item.channel)} ist als bester Verkaufsweg gewählt.`
        : "RAMROD braucht deine Bestätigung für eBay, Whatnot oder Kleinanzeigen."
    }
  ];
}

function releaseFieldLabel(name) {
  return {
    title: "Titel / Variante",
    category: "Kategorie",
    condition: "Zustand",
    completeness: "Lieferumfang",
    image: "Foto"
  }[name] || name;
}

function releaseChecklist(item, requirements) {
  const done = requirements.filter((entry) => entry.ready).length;
  const channelRequirement = requirements.find((entry) => entry.id === "channel");
  return `<section class="release-checklist ${done === requirements.length ? "complete" : ""}">
    <div class="release-checklist-head"><div><small>Freigabe-Check</small><strong>${done}/${requirements.length} erledigt</strong></div><span>${done === requirements.length ? "Bereit" : "Noch nicht freigeben"}</span></div>
    <div class="release-checklist-rows">
      ${requirements.map((entry) => `<div class="release-check-row ${entry.ready ? "done" : entry.pending ? "pending" : "missing"}">
        ${icon(entry.ready ? "OK" : entry.pending ? "…" : "!")}
        <p><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.detail)}</span></p>
        ${!entry.ready && entry.id === "required" ? `<button data-focus-release-fields type="button">Jetzt pflegen</button>` : ""}
        ${!entry.ready && entry.id === "sources" ? `<button data-price-check="${item.id}" type="button" ${entry.pending || state.priceChecking === item.id ? "disabled" : ""}>${entry.pending || state.priceChecking === item.id ? "Prüfung läuft" : "Jetzt prüfen"}</button>` : ""}
      </div>`).join("")}
    </div>
    ${!channelRequirement.ready ? `<div class="release-channel-choice"><strong>Verkaufskanal auswählen</strong><div class="segment-control">${channelCatalog().filter((channel) => channel.spotlight).map((channel) => channelButton(channel, item)).join("")}</div></div>` : ""}
  </section>`;
}

function requiredItemFieldsEditor(item, requirement) {
  const missing = new Set(requirement?.missingFields || []);
  const needsConfirmation = requirement && !requirement.ready;
  const conditions = ["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"];
  return `<details class="release-fields ${needsConfirmation ? "attention-required" : ""}" ${needsConfirmation ? "open" : ""}>
    <summary><span>Pflichtangaben</span><strong>${needsConfirmation ? "Bitte prüfen und speichern" : "Vollständig"}</strong></summary>
    <form data-release-fields="${item.id}" class="release-fields-form">
      <label class="field ${missing.has("title") ? "missing" : ""}"><span>Titel und Variante</span><input name="title" value="${escapeHtml(item.title || "")}" required /></label>
      <label class="field ${missing.has("category") ? "missing" : ""}"><span>Kategorie</span><input name="category" value="${escapeHtml(item.category || "")}" required /></label>
      <label class="field ${missing.has("condition") ? "missing" : ""}"><span>Zustand</span><select name="condition" required>${conditions.includes(item.condition) ? "" : `<option value="" selected disabled>Bitte wählen</option>`}${conditions.map((value) => `<option ${value === item.condition ? "selected" : ""}>${value}</option>`).join("")}</select></label>
      <label class="field ${missing.has("completeness") ? "missing" : ""}"><span>Lieferumfang / Vollständigkeit</span><input name="completeness" value="${escapeHtml(item.completeness || "")}" placeholder="z.B. vollständig, Anleitung fehlt" required /></label>
      <button class="secondary-action" type="submit">${icon("OK")}Angaben bestätigen</button>
    </form>
  </details>`;
}

function strategyChecklist(title, entries) {
  const items = Array.isArray(entries) ? entries.filter(Boolean) : [];
  return `<div class="strategy-checklist"><strong>${title}</strong>${items.length ? `<ul>${items.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>` : `<span>Nichts offen</span>`}</div>`;
}

function strategyRange(low, high) {
  const min = Number(low) || 0;
  const max = Number(high) || 0;
  if (!min && !max) return "noch offen";
  if (min === max) return euro(min);
  return `${euro(min)} – ${euro(max)}`;
}

function strategyActionLabel(value) {
  return {
    sell_as_is: "Direkt verkaufen",
    clean_and_sell: "Reinigen & verkaufen",
    repair_then_sell: "Reparieren & verkaufen",
    bundle: "Bündeln",
    parts_or_defect: "Defekt / Teile",
    needs_inspection: "Erst prüfen"
  }[value] || "Prüfen";
}

function repairDecisionLabel(value) {
  return {
    do_not_repair: "Nicht reparieren",
    repair_if_cheap: "Nur bei günstiger Lösung",
    repair_recommended: "Reparatur lohnt sich voraussichtlich",
    needs_quote: "Kostenvoranschlag nötig",
    not_applicable: "Keine Reparatur nötig"
  }[value] || "Prüfen";
}

function salesFormatLabel(value) {
  return {
    fixed_price: "Festpreis",
    auction: "Auktion",
    live_show: "Live-Show",
    bundle: "Bundle",
    local_pickup: "Abholung",
    parts: "Teileverkauf"
  }[value] || "Festpreis";
}

function salesTimeLabel(value) {
  return { fast: "schnell", normal: "normal", slow: "eher langsam", unknown: "noch offen" }[value] || "noch offen";
}

function whatnotRoutingCard(item) {
  if (!(item.whatnotEligible || item.channel === "Whatnot")) {
    return `<section class="script-box"><h3>Whatnot-Vorbereitung</h3><p>Nicht für Whatnot markiert. Setze den Artikel bei Bedarf im Plattformbereich auf Whatnot, dann wird automatisch eine passende Kampagne vorgeschlagen.</p></section>`;
  }
  return `<section class="whatnot-card">
    <div class="whatnot-card-head">
      <span>${icon("WN")}Whatnot-Vorbereitung</span>
      <strong>${escapeHtml(item.whatnotChannelLabel || "Unsortiert")}</strong>
    </div>
    <div class="detail-grid">
      ${suggestion("Kampagne", item.campaignSuggestion || "-")}
      ${suggestion("Lot-Typ", lotTypeLabel(item.showLotType))}
      ${suggestion("Show Score", `${item.sortOrderScore}/100`)}
      ${suggestion("Bundle", item.bundleSuggestion || "-")}
    </div>
  </section>`;
}

function lotTypeLabel(value) {
  return {
    single: "Einzel-Lot",
    bundle: "Bundle",
    premium: "Premium Review",
    problem: "Problemfall"
  }[value] || value || "-";
}

function priceCheckCard(item) {
  const check = item.priceCheck;
  if (!check) {
    const job = item.automationJob;
    if (["queued", "running"].includes(job?.status)) {
      const running = job.status === "running";
      return `<section class="research compact automation-progress">
        <div class="section-title"><h3>Automatischer Preischeck</h3><span class="status-pill ${running ? "running" : "muted"}">${running ? "Läuft" : "Wartet"}</span></div>
        <p>${running
          ? "Der RAMROD-Worker vergleicht den Artikel gerade mit eBay und Web-Quellen. Der Marktwert wird danach automatisch aktualisiert."
          : "Der Artikel steht in der Preiswarteschlange. Sobald der RAMROD-Worker frei ist, startet die Recherche automatisch."}</p>
        ${job.attempts ? `<small>Versuch ${job.attempts} von ${job.maxAttempts || 3}</small>` : ""}
      </section>`;
    }
    if (["failed", "cancelled"].includes(job?.status)) {
      const message = job.error?.message || "Der Hintergrundjob konnte nicht abgeschlossen werden.";
      return `<section class="research compact automation-progress failed">
        <div class="section-title"><h3>Automatischer Preischeck</h3><span class="status-pill failed">Fehlgeschlagen</span></div>
        <p>${escapeHtml(message)} Nutze „Preise checken“ für einen direkten neuen Versuch.</p>
      </section>`;
    }
    return `<section class="research compact attention-required"><div class="section-title"><h3>Preischeck</h3><span class="status-pill muted">Offen</span></div><p>Noch nicht geprüft. Klicke auf „Preise checken“, um Live-Vergleiche über eBay und Web-Quellen zu erzeugen.</p></section>`;
  }
  const evidence = Array.isArray(check.evidence) ? check.evidence : [];
  const ebayCount = evidence.filter((entry) => entry.source === "eBay Browse" && !entry.outlier).length;
  const webCount = evidence.filter((entry) => entry.webResearch && !entry.outlier).length;
  const soldCount = evidence.filter((entry) => entry.status === "sold_listing" && !entry.outlier).length;
  const outlierCount = evidence.filter((entry) => entry.outlier).length;
  const providerLabel = priceCheckProviderLabel(check.method);
  const notes = Array.isArray(check.notes) ? check.notes : [];
  const previous = check.previous || {};
  const calculation = check.calculation || {};
  return `<section class="research price-check-card">
    <div class="section-title">
      <h3>Preischeck</h3>
      <span class="status-pill ${check.method === "ebay-browse" ? "live" : "muted"}">${providerLabel}</span>
    </div>
    <div class="applied-price">
      <div>
        <small>Angewendeter Preis</small>
        <strong>${euro(check.fair)}</strong>
        <span>${priceDelta(previous.fair, check.fair)}</span>
      </div>
      <p>${priceCheckExplanation(check)}</p>
    </div>
    <div class="price-grid">${suggestion("Minimum", euro(check.low))}${suggestion("Marktwert", euro(check.fair))}${suggestion("Optimistisch", euro(check.aggressive))}${suggestion("Preis-Sicherheit", `${check.confidence}%`)}</div>
    ${calculation.formula ? `<div class="calculation-box">
      <strong>So wurde geschätzt</strong>
      <p>${escapeHtml(calculation.formula)}.</p>
      <div class="calculation-grid">
        ${suggestion("Basis", escapeHtml(calculation.basis || providerLabel))}
        ${suggestion("Nutzbare Treffer", Number(calculation.usableCount || 0))}
        ${suggestion("Median", euro(calculation.median))}
        ${suggestion("Durchschnitt", euro(calculation.average))}
        ${suggestion("Vergleichsspanne", `${euro(calculation.minComparable)} - ${euro(calculation.maxComparable)}`)}
        ${suggestion("Ausreißer", Number(calculation.outlierCount ?? outlierCount))}
      </div>
    </div>` : ""}
    <div class="evidence-summary">
      <span>${icon("EB")} ${ebayCount} eBay-Live-Treffer</span>
      <span>${webCount} Web-Treffer · ${soldCount} verkauft</span>
      <span>${outlierCount} Ausreißer markiert</span>
      <span>Query: ${escapeHtml(check.query || "-")}</span>
    </div>
    <div class="evidence-list">
      ${evidence.length ? evidence.map(evidenceRow).join("") : `<p class="muted-copy">Keine verwertbaren Vergleichstreffer gefunden.</p>`}
    </div>
    ${notes.length ? `<ul class="price-notes">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}
  </section>`;
}

function priceDelta(previous, current) {
  const before = Number(previous);
  const after = Number(current);
  if (!before || !after) return "Neu berechnet";
  const delta = after - before;
  if (!delta) return `unverändert zu vorher ${euro(before)}`;
  return `${delta > 0 ? "+" : ""}${euro(delta)} gegenüber vorher ${euro(before)}`;
}

function priceCheckExplanation(check) {
  const source = check.method === "multi-source"
    ? "eBay-Live-Angeboten und Web Research"
    : check.method === "web-research"
      ? "Web-Research-Treffern"
      : check.method === "ebay-browse"
        ? "eBay-Live-Angeboten"
        : "lokalen Hinweisen";
  const usable = Number(check.calculation?.usableCount || 0);
  const outliers = Number(check.calculation?.outlierCount || 0);
  return `RAMROD hat den Artikelpreis aus ${usable || "den"} nutzbaren ${source} berechnet${outliers ? ` und ${outliers} Ausreißer nicht gewichtet` : ""}.`;
}

function priceCheckProviderLabel(method) {
  if (method === "multi-source") return "eBay + Web";
  if (method === "web-research") return "Web Research";
  if (method === "ebay-browse") return "eBay live";
  if (method === "serpapi") return "Web live";
  return "Lokal";
}

function evidenceRow(entry) {
  const status = entry.outlier
    ? "Ausreißer"
    : entry.status === "active_listing"
      ? "Aktives Angebot"
      : entry.status === "sold_listing"
        ? "Verkauft"
        : entry.status === "active_web_listing"
          ? "Web-Angebot"
          : entry.status || "Hinweis";
  const title = escapeHtml(entry.title || "Unbenannter Treffer");
  const link = entry.url
    ? `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">${title}</a>`
    : `<strong>${title}</strong>`;
  return `<article class="evidence-row ${entry.outlier ? "outlier" : ""}">
    <div class="evidence-main">
      <span class="source-pill">${escapeHtml(entry.source || "Quelle")}</span>
      ${link}
      <small>${escapeHtml(status)} · ${escapeHtml(entry.age || "live")} · ${Number(entry.matchScore || 0)}% Match${entry.query ? ` · Query: ${escapeHtml(entry.query)}` : ""}</small>
    </div>
    <em>${euro(entry.price)}</em>
  </article>`;
}

function ebayDraftCard(item) {
  const draft = item.ebayDraft;
  if (!draft) return "";
  return `<section class="script-box ebay-draft-card">
    <h3>eBay-Entwurf</h3>
    <div class="detail-grid">${suggestion("Status", draft.status)}${suggestion("SKU", draft.sku)}${suggestion("Marktplatz", draft.marketplaceId)}${suggestion("Preis", euro(Number(draft.offerDraft?.pricingSummary?.price?.value || item.fair)))}</div>
    <p>${escapeHtml(draft.inventoryItem?.product?.title || item.title)}</p>
    <div class="source-strip">Kategorie: ${escapeHtml(draft.offerDraft?.categoryId || "TODO")} · Location: ${escapeHtml(draft.offerDraft?.merchantLocationKey || "-")}</div>
  </section>`;
}

function channelPicker(item) {
  const catalog = channelCatalog();
  const selectedChannel = catalog.find((channel) => channel.routeId === item.channel || channel.id === item.channel);
  const spotlight = catalog.filter((channel) => channel.spotlight);
  const compact = [selectedChannel, ...spotlight]
    .filter(Boolean)
    .filter((channel, index, entries) => entries.findIndex((entry) => entry.id === channel.id) === index)
    .slice(0, 3);
  const options = state.showAllChannels ? catalog : compact;
  const moreLabel = state.showAllChannels ? "Weniger anzeigen" : "Mehr anzeigen";
  const needsChannel = !item.channel || ["Pruefen", "Problemfall"].includes(item.channel);
  return `<section class="channel-picker ${needsChannel ? "attention-required" : ""}" aria-label="Plattformrouting">
    <div class="channel-picker-head"><span>Verkaufskanal</span><button data-toggle-channels type="button">${moreLabel}</button></div>
    <div class="segment-control">${options.map((channel) => channelButton(channel, item)).join("")}</div>
    <p>${state.showAllChannels ? "RAMROD trennt fertige Entwürfe, assistierte Übergaben und geplante Connectoren klar voneinander." : "Der Hauptkanal kommt aus dem Verkaufsplan. Du kannst ihn hier bewusst ändern."}</p>
  </section>`;
}

function channelButton(channel, item) {
  const disabled = channel.selectable === false;
  const selected = item.channel === channel.routeId || item.channel === channel.id;
  const attrs = disabled ? "disabled aria-disabled=\"true\"" : `data-route="${escapeHtml(channel.routeId)}" data-id="${item.id}"`;
  return `<button class="${selected ? "selected" : ""} ${disabled ? "locked" : ""}" ${attrs} type="button"><strong>${escapeHtml(channel.label)}</strong><small>${escapeHtml(channel.statusLabel || channel.status || "Geplant")}</small></button>`;
}

function routingView() {
  if (state.channelPlan) return channelPlanView();
  const items = visibleItems();
  const whatnotBuckets = whatnotChannels
    .map((channel) => ({
      channel,
      items: items.filter((item) => (item.whatnotEligible || item.channel === "Whatnot") && item.whatnotChannel === channel.id)
    }))
    .filter((bucket) => bucket.items.length);
  const columns = [
    routeColumn("Prüfen", items.filter((item) => item.channel === "Pruefen")),
    routeColumn("eBay", items.filter((item) => item.channel === "eBay")),
    ...whatnotBuckets.map((bucket) => routeColumn(`Whatnot: ${bucket.channel.label}`, bucket.items, bucket.channel.icon)),
    routeColumn("Strongvision", items.filter((item) => item.channel === "Strongvision")),
    routeColumn("Bundle", items.filter((item) => item.channel === "Bundle")),
    routeColumn("Problemfall", items.filter((item) => item.channel === "Problemfall"))
  ];
  return `<section class="routing-board">${columns.join("")}</section>`;
}

function sellView() {
  const queues = getWorkQueues();
  const campaigns = queues.campaigns;
  const ebayNeedsDraft = queues.ebay.filter((item) => !item.ebayDraft);
  const ebayDrafts = queues.ebay.filter((item) => item.ebayDraft);
  const assistedItems = visibleItems().filter((item) => item.approval?.status === "approved" && !["eBay", "Whatnot", "Pruefen", "Problemfall"].includes(item.channel));

  return `<div class="sales-flow">
    ${salesOverview()}
    ${assistedItems.length ? assistedSalesQueue(assistedItems) : ""}
    <section class="sell-layout">
    <div class="sell-column">
      <div class="panel-heading"><div><p>eBay</p><h2>Angebote vorbereiten</h2></div><span class="queue-count">${queues.ebay.length}</span></div>
      <div class="sell-section">
        <h3>Bereit für eBay</h3>
        ${listingQueue(ebayNeedsDraft, "Keine offenen eBay-Entwürfe.")}
      </div>
      <div class="sell-section">
        <h3>Entwurf vorbereitet, noch nicht veröffentlicht</h3>
        ${listingQueue(ebayDrafts, "Noch keine eBay-Entwürfe erstellt.")}
      </div>
    </div>
    <div class="sell-column">
      <div class="panel-heading"><div><p>Whatnot</p><h2>Show Vorbereitung</h2></div><button class="secondary-action" id="auto-whatnot" type="button">${icon("WN")}Sortieren</button></div>
      ${campaigns.length ? campaigns.map(campaignCard).join("") : `<div class="empty-state compact-empty"><h2>Keine Kampagnen</h2><p>Setze passende Artikel auf Whatnot oder nutze “Sortieren”, um Kandidaten nach Themen zu gruppieren.</p></div>`}
    </div>
    </section>
  </div>`;
}

function assistedSalesQueue(items) {
  return `<section class="assisted-sales">
    <div class="panel-heading"><div><p>Weitere Empfehlungen</p><h2>Assistierte Verkaufskanäle</h2></div><span class="queue-count">${items.length}</span></div>
    <p class="assisted-note">RAMROD bereitet Preis, Text, Fotos und Vorgehen vor. Die Veröffentlichung bleibt manuell, bis der jeweilige Connector verfügbar ist.</p>
    <div class="assisted-sales-list">${items.map((item) => {
      const strategy = normalizeSalesStrategy(item);
      const connector = strategy.channelPlan?.primary?.statusLabel || "Assistiert";
      return `<button class="assisted-sales-row" data-select="${item.id}" data-view-after="inventory" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(channelLabel(item.channel))} · Ziel ${euro(strategy.targetPrice || item.fair)}</small><em>${escapeHtml(connector)} · Verkaufsplan freigegeben</em></span><b aria-hidden="true">›</b></button>`;
    }).join("")}</div>
  </section>`;
}

function salesOverview() {
  const items = visibleItems()
    .filter((item) => item.approval?.status === "approved" || ["Verkaufsbereit", "Verkauft", "Versand"].includes(item.stage))
    .sort((left, right) => String(right.approval?.approvedAt || "").localeCompare(String(left.approval?.approvedAt || "")));
  const approved = items.filter((item) => item.approval?.status === "approved").length;
  const prepared = items.filter((item) => salesProgress(item) >= 3).length;
  const sold = items.filter((item) => ["Verkauft", "Versand"].includes(item.stage)).length;
  const shipping = items.filter((item) => item.stage === "Versand").length;

  return `<section class="sales-overview">
    <div class="sales-overview-head">
      <div><p>Deine Artikel</p><h2>Verkaufsstatus verfolgen</h2><span>Nach der Freigabe siehst du hier immer, was als Nächstes passiert.</span></div>
      <div class="sales-overview-actions"><button class="secondary-action" data-view="inventory" type="button">${icon("DB")}Alle Artikel</button><button class="secondary-action" data-view="shipping" type="button">${icon("VS")}Versand</button></div>
    </div>
    <div class="sales-overview-stats">
      ${suggestion("Freigegeben", approved)}
      ${suggestion("Vorbereitet", prepared)}
      ${suggestion("Verkauft", sold)}
      ${suggestion("Im Versand", shipping)}
    </div>
    ${items.length
      ? `<div class="sales-tracking-list">${items.map(salesTrackingRow).join("")}</div>`
      : `<div class="sales-empty"><strong>Noch nichts freigegeben</strong><p>Scanne einen Artikel, prüfe die Empfehlung und gib ihn für den Verkauf frei.</p><button class="primary-action inline-action" data-view="scan" type="button">${icon("KA")}Ersten Artikel scannen</button></div>`}
  </section>`;
}

function salesProgress(item) {
  if (item.stage === "Versand") return 5;
  if (item.stage === "Verkauft") return 4;
  if ((item.channel === "eBay" && item.ebayDraft) || (item.approval?.status === "approved" && ["Whatnot", "Strongvision"].includes(item.channel))) return 3;
  if (item.approval?.status === "approved") return 2;
  return item.priceCheck ? 1 : 0;
}

function salesStatus(item) {
  if (item.stage === "Versand") return { label: "Versandbereit", note: "Verkauf erkannt · jetzt packen und versenden", tone: "shipping" };
  if (item.stage === "Verkauft") return { label: "Verkauft", note: "Der Verkauf wurde erkannt", tone: "sold" };
  if (item.channel === "eBay" && item.ebayDraft) return { label: "eBay-Entwurf", note: "Vorbereitet · noch nicht auf eBay veröffentlicht", tone: "prepared" };
  if (item.channel === "Whatnot" && item.approval?.status === "approved") return { label: "Whatnot-Kampagne", note: item.campaignSuggestion || "Für die passende Live-Show vorsortiert", tone: "prepared" };
  if (!["eBay", "Whatnot", "Pruefen", "Problemfall", "Strongvision"].includes(item.channel) && item.approval?.status === "approved") {
    const primary = normalizeSalesStrategy(item).channelPlan?.primary;
    return { label: `${channelLabel(item.channel)} freigegeben`, note: `${primary?.statusLabel || "Inhalt vorbereitet"} · RAMROD zeigt den nächsten Übergabeschritt`, tone: "approved" };
  }
  if (item.channel === "Strongvision" && item.approval?.status === "approved") return { label: "Shop-Übergabe", note: "Freigegeben · Shop-Connector folgt", tone: "prepared" };
  return { label: "Freigegeben", note: `Für ${channelLabel(item.channel)} bestätigt`, tone: "approved" };
}

function salesTrackingRow(item) {
  const status = salesStatus(item);
  const progress = salesProgress(item);
  const strategy = normalizeSalesStrategy(item);
  const additionalChannels = (strategy.channelPlan?.parallel?.length || 0) + (strategy.channelPlan?.discovery?.length || 0);
  const steps = ["Analysiert", "Freigegeben", "Vorbereitet", "Verkauft", "Versand"];
  return `<button class="sales-tracking-row" data-select="${item.id}" data-view-after="inventory" type="button">
    <img src="${item.image}" alt="" />
    <span class="sales-tracking-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(channelLabel(item.channel))} · Ziel ${euro(strategy.targetPrice || item.fair)}${additionalChannels ? ` · +${additionalChannels} Reichweitenkanäle` : ""}</small><em class="tracking-status ${status.tone}">${escapeHtml(status.label)}</em><small>${escapeHtml(status.note)}</small></span>
    <span class="sales-timeline" aria-label="Fortschritt: ${escapeHtml(status.label)}">${steps.map((step, index) => `<i class="${progress >= index + 1 ? "done" : ""}"><b></b><small>${step}</small></i>`).join("")}</span>
    <span class="tracking-arrow" aria-hidden="true">›</span>
  </button>`;
}

function listingQueue(items, emptyText) {
  if (!items.length) return `<p class="muted-copy">${emptyText}</p>`;
  return `<div class="listing-queue">${items.map((item) => `<article class="listing-row">
    <button class="queue-row" data-select="${item.id}" data-view-after="inventory" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${euro(item.fair)} · ${item.confidence}% KI-Sicherheit</small><small>${priceCheckInline(item)}</small></span></button>
    <div class="listing-actions">
      <button class="secondary-action" data-price-check="${item.id}" type="button">${state.priceChecking === item.id ? "Prüfe..." : "Preischeck"}</button>
      <button class="secondary-action" data-ebay-draft="${item.id}" type="button">${state.ebayDrafting === item.id ? "Baue..." : "Entwurf"}</button>
    </div>
  </article>`).join("")}</div>`;
}

function priceCheckInline(item) {
  if (!item.priceCheck) {
    if (item.automationJob?.status === "queued") return "Automatischer Preischeck wartet";
    if (item.automationJob?.status === "running") return "Automatischer Preischeck läuft";
    if (["failed", "cancelled"].includes(item.automationJob?.status)) return "Preischeck fehlgeschlagen";
    return "Preischeck offen";
  }
  const evidence = Array.isArray(item.priceCheck.evidence) ? item.priceCheck.evidence : [];
  const liveCount = evidence.filter((entry) => entry.source === "eBay Browse" && !entry.outlier).length;
  if (item.priceCheck.method === "ebay-browse") return `${liveCount} eBay-Treffer · Marktwert ${euro(item.priceCheck.fair)}`;
  return `Lokaler Preischeck · Marktwert ${euro(item.priceCheck.fair)}`;
}

function routeColumn(title, items, iconLabel = title.slice(0, 2).toUpperCase()) {
  return `<div class="route-column">
    <div class="route-heading"><span>${escapeHtml(iconLabel)}</span><strong>${escapeHtml(title)}</strong><span>${items.length}</span></div>
    ${items.map((item) => `<button class="route-item" data-select="${item.id}" data-view-after="inventory" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${euro(item.fair)} · ${item.confidence}% sicher${item.campaignSuggestion ? ` · ${escapeHtml(item.campaignSuggestion)}` : ""}</small></span></button>`).join("")}
  </div>`;
}

function campaignsView() {
  const campaigns = buildWhatnotCampaigns(state.items.filter((item) => item.approval?.status === "approved"));
  if (!campaigns.length) {
    return `<section class="empty-state"><h2>Keine Whatnot-Kampagnen</h2><p>Setze Artikel im Verkaufskanal auf Whatnot. RAMROD sortiert sie danach automatisch in Kanäle und Kampagnen.</p><button class="primary-action inline-action" id="auto-whatnot" type="button">${icon("WN")}Kandidaten sortieren</button></section>`;
  }
  return `<section class="campaigns-layout">
    <div class="campaigns-list">
      <div class="panel-heading"><div><p>Whatnot</p><h2>Kampagnen</h2></div><div class="panel-actions"><button class="secondary-action" id="auto-whatnot" type="button">${icon("WN")}Kandidaten sortieren</button><button class="secondary-action" type="button">${icon("EX")}Export später</button></div></div>
      ${campaigns.map(campaignCard).join("")}
    </div>
    <div class="show-console">
      <div class="panel-heading"><div><p>Show-Modus</p><h2>Nächste Kampagne</h2></div>${icon("WN")}</div>
      ${showModePreview(campaigns[0])}
    </div>
  </section>`;
}

function campaignCard(campaign) {
  return `<article class="campaign-card">
    <div class="campaign-card-head">
      <span>${icon(whatnotChannels.find((channel) => channel.id === campaign.channelId)?.icon || "WN")}</span>
      <div><strong>${escapeHtml(campaign.title)}</strong><small>${escapeHtml(campaign.channelLabel)} · ${campaign.items.length} Artikel · ca. ${campaign.durationMinutes} Min.</small></div>
      <em>${euro(campaign.fairValue)}</em>
    </div>
    <div class="campaign-stats">
      ${suggestion("Startsumme", euro(campaign.startValue))}
      ${suggestion("Review", campaign.reviewCount)}
      ${suggestion("Status", campaign.reviewCount ? "Entwurf" : "Bereit")}
    </div>
    <div class="campaign-items">${campaign.items.map((item, index) => `<button class="campaign-item" data-select="${item.id}" data-view-after="inventory" type="button"><span>${index + 1}</span><img src="${item.image}" alt="" /><strong>${escapeHtml(item.title)}</strong><em>${euro(item.fair)}</em></button>`).join("")}</div>
  </article>`;
}

function showModePreview(campaign) {
  const first = campaign.items[0];
  return `<div class="show-preview">
    <div class="show-hero"><img src="${first.image}" alt="" /><div><small>${escapeHtml(campaign.channelLabel)}</small><h3>${escapeHtml(first.title)}</h3><p>${escapeHtml(first.whatnotScript || "")}</p></div></div>
    <div class="detail-grid">
      ${suggestion("Start", euro(Math.max(1, Math.round((Number(first.low) || Number(first.fair) || 1) * 0.65))))}
      ${suggestion("Fair", euro(first.fair))}
      ${suggestion("Lot", lotTypeLabel(first.showLotType))}
      ${suggestion("Nächste Lots", campaign.items.length - 1)}
    </div>
    <div class="show-runlist">${campaign.items.slice(0, 8).map((item, index) => `<button class="show-runlist-row" data-select="${item.id}" data-view-after="inventory" type="button"><span>${index + 1}</span><strong>${escapeHtml(item.title)}</strong><em>${euro(item.fair)}</em></button>`).join("")}</div>
  </div>`;
}

function channelPlanView() {
  const plan = state.channelPlan;
  return `<section class="channel-plan-layout">
    <div class="channel-summary">
      ${suggestion("Artikel", plan.summary.total)}
      ${suggestion("Freigabe nötig", plan.summary.needsApproval)}
      ${suggestion("Marktwert", euro(plan.summary.fairValue))}
      ${suggestion("Primärkanäle", Object.entries(plan.summary.byPrimary).map(([key, value]) => `${key}: ${value}`).join(", "))}
    </div>
    <div class="channel-plan-list">
      ${plan.plans.map(channelPlanRow).join("")}
    </div>
  </section>`;
}

function channelPlanRow(plan) {
  const actions = plan.listingActions
    .map((action) => `<span class="${action.status === "ready_to_publish" ? "ready" : "hold"}">${action.channelName}: ${action.status === "ready_to_publish" ? "bereit" : "Approval"}</span>`)
    .join("");
  const reasons = plan.approval.reasons.length ? plan.approval.reasons.join(" ") : "Auto-listing moeglich.";
  return `<article class="channel-plan-row">
    <div>
      <strong>${escapeHtml(plan.title)}</strong>
      <small>${plan.sku} · ${euro(plan.fairValue)} · ${plan.confidence}% KI-Sicherheit</small>
    </div>
    <div class="channel-action-tags">${actions}</div>
    <p>${escapeHtml(reasons)} Verkaufsregel: ${plan.saleLockPolicy.delistEverywhereExceptSoldChannel ? "bei Verkauf überall entfernen" : "manuell prüfen"}.</p>
  </article>`;
}

function adminView() {
  const summaryByOrganization = new Map(state.adminOverview.map((entry) => [entry.organizationId, entry]));
  const totals = state.adminOverview.reduce((result, entry) => ({
    items: result.items + Number(entry.itemCount || 0),
    review: result.review + Number(entry.reviewCount || 0),
    ready: result.ready + Number(entry.readyCount || 0),
    value: result.value + Number(entry.fairValue || 0)
  }), { items: 0, review: 0, ready: 0, value: 0 });

  return `<section class="admin-layout">
    <div class="admin-summary" aria-label="Plattformübersicht">
      ${suggestion("Kundenbereiche", state.organizations.length)}
      ${suggestion("Artikel", totals.items)}
      ${suggestion("Offene Prüfungen", totals.review)}
      ${suggestion("Verkaufsbereit", totals.ready)}
      ${suggestion("Marktwert", euro(totals.value))}
    </div>

    <div class="admin-content">
      <section class="admin-organizations">
        <div class="panel-heading"><div><p>Mandanten</p><h2>Kunden und eigene Bereiche</h2></div></div>
        <div class="organization-cards">
          ${state.organizations.map((organization) => {
            const summary = summaryByOrganization.get(organization.id) || {};
            return `<button class="organization-card" data-organization="${organization.id}" type="button">
              <span class="organization-card-avatar" style="--organization-color:${escapeHtml(organization.brandColor || "#ff6a00")}">${escapeHtml(organization.shortCode || "OR")}</span>
              <span class="organization-card-main"><strong>${escapeHtml(organization.name)}</strong><small>${escapeHtml(organizationTypeLabel(organization.type))} · ${escapeHtml(roleLabel(organization.role))}</small></span>
              <span class="organization-card-metric"><strong>${Number(summary.itemCount || 0)}</strong><small>Artikel</small></span>
              <span class="organization-card-metric warning"><strong>${Number(summary.reviewCount || 0)}</strong><small>Prüfen</small></span>
              <span class="organization-card-metric"><strong>${euro(summary.fairValue || 0)}</strong><small>Marktwert</small></span>
              <span class="organization-card-arrow">›</span>
            </button>`;
          }).join("") || `<p class="muted-copy">Noch keine Kundenbereiche vorhanden.</p>`}
        </div>
      </section>

      <section class="admin-create">
        <div class="panel-heading"><div><p>Onboarding</p><h2>Kundenbereich anlegen</h2></div></div>
        <form id="organization-form" class="organization-form">
          <label class="field"><span>Name</span><input name="name" type="text" placeholder="Zum Beispiel Nerdshop Müller" required minlength="2" /></label>
          <label class="field"><span>Bereich</span><select name="type"><option value="customer">Kunde</option><option value="personal">Privat</option><option value="internal">CREATORS intern</option><option value="demo">Demo</option></select></label>
          <label class="field"><span>Kürzel</span><input name="shortCode" type="text" maxlength="3" placeholder="NM" /></label>
          <label class="field"><span>Akzentfarbe</span><input name="brandColor" type="color" value="#ff6a00" /></label>
          <button class="primary-action" type="submit" ${state.creatingOrganization ? "disabled" : ""}>${icon("PL")}${state.creatingOrganization ? "Wird angelegt..." : "Kundenbereich anlegen"}</button>
        </form>
        <p class="admin-note">Der neue Bereich erhält einen getrennten Bestand und eine erste Eingangskiste. Benutzer und Verkaufskonten werden anschließend in seinen Einstellungen eingeladen.</p>
      </section>
    </div>
  </section>`;
}

function organizationTypeLabel(type) {
  return {
    internal: "CREATORS intern",
    customer: "Kunde",
    personal: "Privatverkauf",
    demo: "Demo"
  }[type] || "Kundenbereich";
}

function shippingView() {
  return `<section class="shipping-layout">
    <div class="shipping-queue"><div class="panel-heading"><div><p>Packen & Versenden</p><h2>Versandstation</h2></div><button class="secondary-action" type="button">${icon("CSV")}Verkäufe importieren</button></div>${visibleItems().filter((item) => item.channel !== "Problemfall").map((item) => `<div class="ship-row"><img src="${item.image}" alt="" /><div><strong>${item.sku}</strong><span>${escapeHtml(item.title)}</span></div><small>${item.boxId}</small><small>${item.weight.toFixed(2)} kg</small><button data-ship="${item.id}" title="Als versandbereit markieren">${icon("OK")}</button></div>`).join("")}</div>
    <div class="shipping-guide"><h2>Versandetiketten</h2><p>Der MVP sammelt Gewicht, Lagerplatz und SKU. Im nächsten Schritt verbinden wir DHL, eBay Orders und Whatnot Export, damit die Packstation automatisch Picklisten und Labels erzeugt.</p><div class="guide-steps"><span>1. Verkauf importieren</span><span>2. SKU scannen</span><span>3. Gewicht validieren</span><span>4. Label drucken</span></div></div>
  </section>`;
}

async function approveItemForSale(item) {
  const blockers = releaseRequirements(item).filter((entry) => !entry.ready);
  if (blockers.length) {
    throw new Error(`Noch offen: ${blockers.map((entry) => entry.label).join(", ")}.`);
  }
  if (item.channel === "eBay" && !item.ebayDraft) {
    const result = await postJson("/api/ebay-draft", { item });
    item.ebayDraft = result.ebayDraft;
  }
  const strategy = normalizeSalesStrategy(item);
  item.approval = {
    status: "approved",
    approvedAt: new Date().toISOString(),
    strategyAccepted: true,
    summary: strategy.approvalSummary
  };
  item.stage = "Verkaufsbereit";
  await persistItem(item, "Verkaufsfreigabe");
  return item;
}

function bindEvents() {
  const signOut = document.querySelector("#sign-out");
  if (signOut) signOut.addEventListener("click", () => {
    saveAuthSession(null);
    state.batchDrafts = [];
    state.batchSummary = null;
    state.batchProgress = null;
    state.draft = createEmptyDraft();
    state.authError = "";
    state.importStatus = "";
    render();
  });

  document.querySelectorAll("[data-organization]").forEach((button) => button.addEventListener("click", async () => {
    const organizationId = button.dataset.organization;
    if (!organizationId) return;
    state.activeOrganizationId = organizationId;
    state.activeOrganization = state.organizations.find((entry) => entry.id === organizationId) || null;
    localStorage.setItem(organizationStorageKey, organizationId);
    state.boxFilter = "";
    state.search = "";
    state.selected = "";
    state.items = [];
    state.batchDrafts = [];
    state.batchSummary = null;
    state.batchProgress = null;
    state.draft = createEmptyDraft();
    boxes = [];
    state.view = "today";
    await hydrateAppState();
  }));

  const newOrganization = document.querySelector("[data-new-organization]");
  if (newOrganization) newOrganization.addEventListener("click", () => {
    state.view = "admin";
    render();
    requestAnimationFrame(() => document.querySelector("#organization-form input[name='name']")?.focus());
  });

  const organizationForm = document.querySelector("#organization-form");
  if (organizationForm) organizationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.creatingOrganization) return;
    const formData = new FormData(event.currentTarget);
    state.creatingOrganization = true;
    state.importStatus = "Der neue Kundenbereich wird angelegt...";
    render();
    try {
      const result = await postJson("/api/organizations", {
        name: formData.get("name"),
        type: formData.get("type"),
        shortCode: formData.get("shortCode"),
        brandColor: formData.get("brandColor")
      });
      state.activeOrganizationId = result.organization.id;
      localStorage.setItem(organizationStorageKey, result.organization.id);
      state.view = "today";
      state.importStatus = `${result.organization.name} wurde angelegt.`;
      await hydrateAppState();
    } catch (error) {
      state.importStatus = `Kundenbereich konnte nicht angelegt werden: ${error.message}`;
    } finally {
      state.creatingOrganization = false;
      render();
    }
  });

  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    state.view = button.dataset.view;
    render();
  }));
  document.querySelectorAll("[data-box]").forEach((button) => button.addEventListener("click", () => {
    state.boxFilter = button.dataset.box || "";
    if (button.dataset.box) state.draft.boxId = button.dataset.box;
    render();
  }));
  document.querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => {
    state.selected = button.dataset.select;
    if (button.dataset.viewAfter) state.view = button.dataset.viewAfter;
    render();
  }));
  document.querySelector("[data-dismiss-batch-summary]")?.addEventListener("click", () => {
    state.batchSummary = null;
    render();
  });
  document.querySelectorAll("[data-toggle-item-details]").forEach((button) => button.addEventListener("click", () => {
    state.mobileDetailsItem = state.mobileDetailsItem === button.dataset.toggleItemDetails ? "" : button.dataset.toggleItemDetails;
    render();
  }));
  document.querySelectorAll("[data-focus-release-fields]").forEach((button) => button.addEventListener("click", () => {
    const details = button.closest(".sales-strategy-card")?.querySelector(".release-fields");
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => details.querySelector(".field.missing input, .field.missing select, input, select")?.focus());
  }));
  document.querySelectorAll("[data-release-fields]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = state.items.find((entry) => entry.id === event.currentTarget.dataset.releaseFields);
    if (!item) return;
    const values = new FormData(event.currentTarget);
    item.title = String(values.get("title") || "").trim();
    item.category = String(values.get("category") || "").trim();
    item.condition = String(values.get("condition") || "").trim();
    item.completeness = String(values.get("completeness") || "").trim();
    item.requiredFieldsConfirmedAt = new Date().toISOString();
    Object.assign(item, enrichWorkflow(item));
    state.importStatus = `${item.sku}: Pflichtangaben bestätigt.`;
    await persistItem(item, "Pflichtangaben");
    render();
  }));
  document.querySelector("[data-bulk-approve]")?.addEventListener("click", async () => {
    if (state.approving || !state.batchSummary) return;
    const ready = (state.batchSummary.itemIds || [])
      .map((id) => state.items.find((item) => item.id === id))
      .filter((item) => item && item.approval?.status !== "approved" && releaseRequirements(item).every((entry) => entry.ready));
    if (!ready.length) return;
    state.approving = "batch";
    state.importStatus = `${ready.length} sichere Artikel werden freigegeben...`;
    render();
    let completed = 0;
    try {
      for (const item of ready) {
        await approveItemForSale(item);
        completed += 1;
      }
      state.view = "sell";
      state.importStatus = `${completed} Artikel freigegeben. Du siehst jetzt, wie sie je Verkaufskanal weiterlaufen.`;
    } catch (error) {
      state.importStatus = `${completed}/${ready.length} freigegeben. Abbruch: ${error.message}`;
    } finally {
      state.approving = "";
      saveLocal();
      render();
    }
  });
  document.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", async () => {
    const index = state.items.findIndex((entry) => entry.id === button.dataset.id);
    if (index === -1) return;
    const selectedChannel = button.dataset.route;
    const previousStrategy = state.items[index].salesStrategy || {};
    state.items[index] = enrichWorkflow({
      ...state.items[index],
      channel: selectedChannel,
      whatnotEligible: selectedChannel === "Whatnot",
      salesStrategy: {
        ...previousStrategy,
        routeReason: `${channelLabel(selectedChannel)} wurde bewusst als Hauptkanal gewählt.`,
        alternativeChannels: channelAlternatives(selectedChannel),
        channelPlan: null
      }
    });
    await persistItem(state.items[index], "Verkaufskanal");
    render();
  }));
  document.querySelectorAll("[data-toggle-channels]").forEach((button) => button.addEventListener("click", () => {
    state.showAllChannels = !state.showAllChannels;
    render();
  }));
  document.querySelectorAll("[data-capture-mode]").forEach((button) => button.addEventListener("click", () => {
    if (state.batchAnalyzing) return;
    state.captureMode = button.dataset.captureMode === "batch" ? "batch" : "single";
    state.recognitionRequestId += 1;
    state.recognition = null;
    state.recognitionMeta = null;
    state.importStatus = state.captureMode === "batch"
      ? "Serienaufnahme bereit: mehrere Ansichten aufnehmen, dann zum nächsten Artikel."
      : "Einzelaufnahme bereit.";
    render();
  }));
  document.querySelectorAll("[data-capture-more]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#photo")?.click();
  }));
  document.querySelectorAll("[data-run-next-step]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#add-item")?.click();
  }));
  document.querySelectorAll("[data-price-check]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.priceCheck);
    if (!item || state.priceChecking) return;
    state.priceChecking = item.id;
    state.importStatus = "Preischeck läuft...";
    render();
    try {
      const result = await postJson("/api/price-check", { item });
      item.priceCheck = result.priceCheck;
      item.ebayDraft = result.ebayDraft;
      item.low = result.priceCheck.low;
      item.fair = result.priceCheck.fair;
      item.aggressive = result.priceCheck.aggressive;
      item.confidence = Math.max(item.confidence, result.priceCheck.confidence);
      applySalesDecision(item, result.decision);
      state.importStatus = result.priceCheck?.method === "ebay-browse"
        ? "eBay-Live-Preischeck erzeugt. Aktive Angebote wurden als Vergleich gespeichert."
        : "Lokaler Preischeck erzeugt. Fuer echte Live-Preise brauchen wir eBay Browse oder SerpApi.";
      await persistItem(item, "Preischeck");
    } catch (error) {
      state.importStatus = `Preischeck fehlgeschlagen: ${error.message}`;
    } finally {
      state.priceChecking = "";
      render();
    }
  }));
  document.querySelectorAll("[data-ebay-draft]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.ebayDraft);
    if (!item || state.ebayDrafting) return;
    state.ebayDrafting = item.id;
    state.importStatus = "eBay-Entwurf wird lokal erzeugt...";
    render();
    try {
      const result = await postJson("/api/ebay-draft", { item });
      item.ebayDraft = result.ebayDraft;
      state.importStatus = "eBay-Entwurf erzeugt. Noch nicht an eBay gesendet.";
      await persistItem(item, "eBay-Entwurf");
    } catch (error) {
      state.importStatus = `eBay-Entwurf fehlgeschlagen: ${error.message}`;
    } finally {
      state.ebayDrafting = "";
      render();
    }
  }));
  document.querySelectorAll("[data-approve-sale]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.approveSale);
    if (!item || state.approving || releaseRequirements(item).some((entry) => !entry.ready)) return;
    state.approving = item.id;
    state.importStatus = `${item.sku} wird für den Verkauf vorbereitet...`;
    render();
    try {
      await approveItemForSale(item);
      state.view = "sell";
      state.importStatus = item.channel === "eBay"
        ? `${item.sku} freigegeben. Der eBay-Entwurf ist vorbereitet; die Live-Veröffentlichung folgt mit dem eBay-Connector.`
        : `${item.sku} freigegeben und für ${channelLabel(item.channel)} vorbereitet.`;
    } catch (error) {
      state.importStatus = `Freigabe fehlgeschlagen: ${error.message}`;
    } finally {
      state.approving = "";
      render();
    }
  }));
  document.querySelectorAll("[data-ship]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.ship);
    item.stage = "Versand";
    await persistItem(item, "Versandstatus");
    render();
  }));

  const search = document.querySelector("#search");
  if (search) search.addEventListener("input", (event) => {
    state.search = event.target.value;
  });
  if (search) search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") render();
  });

  ["query", "barcode", "weight", "completeness"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (input) input.addEventListener("input", (event) => {
      state.draft[id] = event.target.value;
    });
  });

  ["boxId", "condition"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (input) input.addEventListener("change", (event) => {
      state.draft[id] = event.target.value;
      render();
    });
  });

  const photo = document.querySelector("#photo");
  if (photo) photo.addEventListener("change", async (event) => {
    const photoLimit = state.captureMode === "batch" ? 6 : 4;
    const remaining = Math.max(0, photoLimit - (state.draft.photos?.length || 0));
    const files = [...(event.target.files || [])].slice(0, remaining);
    if (!files.length) return;
    state.importStatus = `${files.length} Foto${files.length === 1 ? "" : "s"} wird vorbereitet...`;
    render();
    try {
      const preparedPhotos = [];
      for (const file of files) {
        const prepared = await prepareImageForAi(file);
        preparedPhotos.push(prepared);
      }
      state.draft.photos = [...(state.draft.photos || []), ...preparedPhotos].slice(0, photoLimit);
      state.draft.photo = state.draft.photos[0]?.dataUrl || "";
      state.recognition = null;
      state.recognitionMeta = null;
      const weakest = Math.min(...state.draft.photos.map((entry) => entry.quality?.score ?? 100));
      state.importStatus = `${state.draft.photos.length} Foto${state.draft.photos.length === 1 ? "" : "s"} bereit · schwächste Bildqualität ${weakest}%.`;
    } catch (error) {
      state.importStatus = `Bildvorbereitung fehlgeschlagen: ${error.message}.`;
    }
    render();
    if (state.captureMode === "single" && state.draft.photos.length) await runFastRecognition();
  });

  document.querySelectorAll("[data-remove-photo]").forEach((button) => button.addEventListener("click", async () => {
    const index = Number(button.dataset.removePhoto);
    state.recognitionRequestId += 1;
    state.draft.photos = (state.draft.photos || []).filter((_, photoIndex) => photoIndex !== index);
    state.draft.photo = state.draft.photos[0]?.dataUrl || "";
    state.recognition = null;
    state.recognitionMeta = null;
    state.importStatus = state.draft.photos.length ? "Foto entfernt. Identität wird neu geprüft." : "Alle Fotos entfernt.";
    render();
    if (state.captureMode === "single" && state.draft.photos.length) await runFastRecognition();
  }));

  document.querySelectorAll("[data-remove-batch]").forEach((button) => button.addEventListener("click", () => {
    if (state.batchAnalyzing) return;
    state.batchDrafts = state.batchDrafts.filter((entry) => entry.id !== button.dataset.removeBatch);
    state.importStatus = `${state.batchDrafts.length} Artikel in der Aufnahmesession.`;
    render();
  }));

  const batchNext = document.querySelector("#batch-next");
  if (batchNext) batchNext.addEventListener("click", () => {
    if (!queueCurrentBatchDraft()) return;
    state.importStatus = `Artikel ${state.batchDrafts.length} gespeichert. Fotografiere jetzt Artikel ${state.batchDrafts.length + 1}.`;
    render();
  });

  const batchFinish = document.querySelector("#batch-finish");
  if (batchFinish) batchFinish.addEventListener("click", runBatchAnalysis);

  const add = document.querySelector("#add-item");
  if (add) add.addEventListener("click", async () => {
    if (state.analyzing) return;
    const usedLiveAi = Boolean(state.draft.photo);
    try {
      if (usedLiveAi && !state.recognition) await runFastRecognition();
      if (usedLiveAi && !state.recognition) {
        throw new Error("Die Identität konnte noch nicht erkannt werden. Bitte Foto oder Verbindung prüfen.");
      }
      if (usedLiveAi && state.recognition?.evidence?.status === "needs_better_photo") {
        throw new Error("Die Bildqualität reicht nicht aus. Bitte das angeforderte Foto neu aufnehmen.");
      }
      state.analyzing = true;
      state.importStatus = usedLiveAi
        ? "Identität wird mit Markt, Zustand und Verkaufsstrategie angereichert..."
        : "Kein Foto vorhanden, nutze lokalen Demo-Vorschlag.";
      render();
      const item = enrichWorkflow(usedLiveAi ? await analyzeWithApi() : analyze());
      item.recognition = state.recognition;
      item.recognitionEvidence = state.recognition?.evidence || null;
      state.items.unshift(item);
      state.selected = item.id;
      state.draft = createEmptyDraft(state.draft.boxId);
      state.recognition = null;
      state.recognitionMeta = null;
      state.view = "review";
      state.importStatus = usedLiveAi
        ? "Artikel erkannt und Verkaufsstrategie erstellt. Der Marktcheck läuft automatisch; danach kannst du freigeben."
        : "Demo-Artikelkarte und Verkaufsstrategie erzeugt.";
      await persistItem(item, "Artikel");
    } catch (error) {
      state.importStatus = `Live-KI fehlgeschlagen: ${error.message}. Es wurde kein Live-Artikel erzeugt.`;
    } finally {
      state.analyzing = false;
      render();
    }
  });

  const reset = document.querySelector("#reset");
  if (reset) reset.addEventListener("click", () => {
    state.recognitionRequestId += 1;
    state.draft = createEmptyDraft(state.draft.boxId);
    state.recognition = null;
    state.recognitionMeta = null;
    state.importStatus = "Neue Erfassung bereit.";
    render();
  });

  const loadAiImport = document.querySelector("#load-ai-import");
  if (loadAiImport) loadAiImport.addEventListener("click", async () => {
    state.importStatus = "Lade AI Import...";
    render();
    try {
      const response = await fetch("/data/app-import-items.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      state.items = normalizeItems(payload.items);
      state.selected = payload.items[0]?.id || "";
      state.view = "review";
      state.importStatus = `${payload.count} OpenAI-Artikel aus ${payload.model} geladen.`;
      saveLocal();
      await persistItems(state.items, "AI-Import-Artikel");
    } catch (error) {
      state.importStatus = `AI Import fehlgeschlagen: ${error.message}`;
    }
    render();
  });

  const loadChannelPlan = document.querySelector("#load-channel-plan");
  if (loadChannelPlan) loadChannelPlan.addEventListener("click", async () => {
    state.importStatus = "Lade Channel Plan...";
    render();
    try {
      const response = await fetch("/data/channel-listing-plan.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.channelPlan = await response.json();
      state.view = "sell";
      state.importStatus = `${state.channelPlan.summary.total} Listing-Plaene geladen.`;
    } catch (error) {
      state.importStatus = `Channel Plan fehlgeschlagen: ${error.message}`;
    }
    render();
  });

  const autoWhatnot = document.querySelector("#auto-whatnot");
  if (autoWhatnot) autoWhatnot.addEventListener("click", () => {
    markWhatnotCandidates();
    state.importStatus = "Whatnot-Kandidaten wurden nach Kanälen und Kampagnen sortiert.";
    state.view = "sell";
    persistItems(state.items.filter((item) => item.whatnotEligible || item.channel === "Whatnot"), "Whatnot-Kandidaten");
    render();
  });
}

async function fetchJson(url) {
  const response = await apiFetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw apiError(response, result);
  return result;
}

async function postJson(url, payload) {
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw apiError(response, result);
  return result;
}

async function fetchPublicJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw apiError(response, result);
  return result;
}

async function apiFetch(url, options = {}, allowRefresh = true) {
  const headers = new Headers(options.headers || {});
  if (state.authSession?.access_token) headers.set("Authorization", `Bearer ${state.authSession.access_token}`);
  if (state.activeOrganizationId) headers.set("X-Ramrod-Organization", state.activeOrganizationId);
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && allowRefresh && state.authSession?.refresh_token) {
    const refreshed = await refreshAuthSession();
    if (refreshed) return apiFetch(url, options, false);
  }

  return response;
}

async function signInWithPassword(email, password) {
  const config = state.runtimeConfig;
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error("Supabase Auth ist nicht konfiguriert.");
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error(result.msg || result.error_description || result.message || "Anmeldung fehlgeschlagen.");
  return result;
}

async function requestSupabasePasswordReset(email) {
  const config = state.runtimeConfig;
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error("Supabase Auth ist nicht konfiguriert.");
  const redirectTo = `${window.location.origin}/`;
  const response = await fetch(`${config.supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg || result.error_description || result.message || "Reset-Mail konnte nicht gesendet werden.");
}

async function updateSupabasePassword(password, accessToken) {
  const config = state.runtimeConfig;
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error("Supabase Auth ist nicht konfiguriert.");
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.msg || result.message || result.error_description || "Passwort konnte nicht gespeichert werden.");
  return result;
}

async function refreshAuthSession() {
  const config = state.runtimeConfig;
  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: state.authSession.refresh_token })
    });
    const result = await response.json();
    if (!response.ok || !result.access_token) {
      saveAuthSession(null);
      return false;
    }
    saveAuthSession(result);
    return true;
  } catch {
    saveAuthSession(null);
    return false;
  }
}

function apiError(response, result) {
  const error = new Error(result.message || result.error || `HTTP ${response.status}`);
  error.status = response.status;
  return error;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

async function prepareImageForAi(file) {
  const image = await loadImage(file);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas nicht verfuegbar");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(image.src);
  const quality = measureCanvasQuality(canvas);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return {
    dataUrl,
    width,
    height,
    bytes: Math.round((dataUrl.length * 3) / 4),
    quality
  };
}

function measureCanvasQuality(sourceCanvas) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) return { score: 50, brightness: 0, contrast: 0, sharpness: 0, issues: ["Bildqualität konnte nicht gemessen werden"] };
  context.drawImage(sourceCanvas, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const luminance = new Float32Array(size * size);
  let sum = 0;
  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * 4;
    const value = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
    luminance[index] = value;
    sum += value;
  }
  const brightness = sum / luminance.length;
  let variance = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      variance += (luminance[index] - brightness) ** 2;
      if (x + 1 < size) {
        edgeSum += Math.abs(luminance[index] - luminance[index + 1]);
        edgeCount += 1;
      }
      if (y + 1 < size) {
        edgeSum += Math.abs(luminance[index] - luminance[index + size]);
        edgeCount += 1;
      }
    }
  }
  const contrast = Math.sqrt(variance / luminance.length);
  const sharpness = edgeCount ? edgeSum / edgeCount : 0;
  const issues = [];
  let score = 100;
  if (brightness < 45) {
    issues.push("Bild ist zu dunkel");
    score -= 30;
  } else if (brightness > 220) {
    issues.push("Bild ist überbelichtet");
    score -= 30;
  }
  if (contrast < 28) {
    issues.push("Zu wenig Kontrast");
    score -= 20;
  }
  if (sharpness < 7) {
    issues.push("Foto wirkt unscharf");
    score -= 35;
  }
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    sharpness: Math.round(sharpness * 10) / 10,
    issues
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
    image.src = URL.createObjectURL(file);
  });
}

function loadDataUrlImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Bild konnte nicht gedreht werden"));
    image.src = dataUrl;
  });
}

async function rotatePreparedPhoto(photo, degrees) {
  const rotation = ((Number(degrees) % 360) + 360) % 360;
  if (![90, 180, 270].includes(rotation)) return photo;
  const image = await loadDataUrlImage(photo.dataUrl);
  const swapSides = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swapSides ? image.naturalHeight : image.naturalWidth;
  canvas.height = swapSides ? image.naturalWidth : image.naturalHeight;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas nicht verfügbar");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(rotation * Math.PI / 180);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return {
    ...photo,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    bytes: Math.round((dataUrl.length * 3) / 4),
    rotationApplied: ((Number(photo.rotationApplied || 0) + rotation) % 360)
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "unbekannt";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(milliseconds) {
  const value = Number(milliseconds);
  if (!Number.isFinite(value) || value <= 0) return "wenigen Sekunden";
  return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;
}

async function runFastRecognition() {
  const photos = state.draft.photos?.length
    ? state.draft.photos
    : state.draft.photo
      ? [{ dataUrl: state.draft.photo, quality: null }]
      : [];
  if (!photos.length || state.recognizing) return state.recognition;

  const requestId = ++state.recognitionRequestId;
  state.recognizing = true;
  state.importStatus = "Schnellerkennung gestartet: Text und Identität werden gelesen...";
  render();
  try {
    const response = await apiFetch("/api/recognize-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl: photos[0].dataUrl,
        imageDataUrls: photos.map((photo) => photo.dataUrl),
        clientImageQualities: photos.map((photo) => photo.quality || null),
        barcode: state.draft.barcode,
        query: state.draft.query
      })
    });
    const payload = await response.json();
    if (!response.ok) throw apiError(response, payload);
    const result = response.status === 202 && payload.job?.id
      ? await waitForRecognition(payload.job.id)
      : payload;
    if (requestId !== state.recognitionRequestId) return null;

    const autoRotation = Number(result.recognition?.image?.rotation || 0);
    if ([90, 180, 270].includes(autoRotation) && state.draft.photos?.[0]) {
      state.draft.photos[0] = await rotatePreparedPhoto(state.draft.photos[0], autoRotation);
      state.draft.photo = state.draft.photos[0].dataUrl;
    }
    state.recognition = result.recognition;
    state.recognitionMeta = {
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs || result.usage?.durationMs || result.worker?.durationMs || null,
      autoRotation: [90, 180, 270].includes(autoRotation) ? autoRotation : 0
    };
    if (!state.draft.query && result.recognition?.identity?.title) {
      state.draft.query = result.recognition.identity.title;
    }
    const score = result.recognition?.evidence?.score || 0;
    const needsPhotos = result.recognition?.requestedPhotos?.length || 0;
    state.importStatus = result.recognition?.evidence?.status === "ready_for_research"
      ? `Produktkandidat in ${formatDuration(state.recognitionMeta.durationMs)} erkannt · ${score}% Evidenz. Quellenabgleich kann starten.`
      : `Produktkandidat erkannt · ${score}% Evidenz · ${needsPhotos} Zusatzfoto${needsPhotos === 1 ? "" : "s"} empfohlen.`;
    return result.recognition;
  } catch (error) {
    if (requestId === state.recognitionRequestId) {
      state.recognition = null;
      state.recognitionMeta = null;
      state.importStatus = `Schnellerkennung fehlgeschlagen: ${error.message}`;
    }
    return null;
  } finally {
    if (requestId === state.recognitionRequestId) state.recognizing = false;
    render();
  }
}

async function waitForRecognition(jobId) {
  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    state.importStatus = "Lokale Schnellerkennung läuft auf dem Mac Mini...";
    render();
    await new Promise((resolve) => setTimeout(resolve, 750));
    const payload = await fetchJson(`/api/jobs?id=${encodeURIComponent(jobId)}&limit=1`);
    const job = payload.jobs?.[0];
    if (!job) throw new Error("Der Erkennungsjob wurde nicht gefunden.");
    if (job.status === "succeeded" && job.result?.recognition) return job.result;
    if (["failed", "cancelled"].includes(job.status)) {
      throw new Error(job.error?.message || "Die lokale Schnellerkennung ist fehlgeschlagen.");
    }
  }
  throw new Error("Die Schnellerkennung hat länger als drei Minuten gedauert.");
}

async function analyzeWithApi() {
  const photos = state.draft.photos?.length
    ? state.draft.photos
    : [{ dataUrl: state.draft.photo, quality: null }];
  const response = await apiFetch("/api/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDataUrl: photos[0].dataUrl,
      imageDataUrls: photos.map((photo) => photo.dataUrl),
      clientImageQualities: photos.map((photo) => photo.quality || null),
      boxId: state.draft.boxId,
      condition: state.draft.condition,
      completeness: state.draft.completeness,
      barcode: state.draft.barcode,
      weight: state.draft.weight,
      recognition: state.recognition
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw apiError(response, payload);
  }
  if (response.status === 202 && payload.job?.id) {
    const item = await waitForImageAnalysis(payload.job.id);
    item.image = photos[0].dataUrl;
    return item;
  }
  return payload.item;
}

async function waitForImageAnalysis(jobId) {
  const deadline = Date.now() + 7 * 60 * 1000;
  while (Date.now() < deadline) {
    state.importStatus = "Lokales Qwen analysiert das Foto auf dem Mac Mini...";
    render();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const payload = await fetchJson(`/api/jobs?id=${encodeURIComponent(jobId)}&limit=1`);
    const job = payload.jobs?.[0];
    if (!job) throw new Error("Der Bildanalyse-Job wurde nicht gefunden.");
    if (job.status === "succeeded" && job.result?.item) return job.result.item;
    if (["failed", "cancelled"].includes(job.status)) {
      throw new Error(job.error?.message || "Die lokale Bildanalyse ist fehlgeschlagen.");
    }
  }
  throw new Error("Die lokale Bildanalyse hat länger als sieben Minuten gedauert.");
}

function sourceBadge(item) {
  const source = item.sourceType || (item.sourceFile ? "batch_openai" : "unknown");
  const labels = {
    live_openai: "Quelle: Live-OpenAI",
    batch_openai: "Quelle: Drive-Batch OpenAI",
    local_qwen: "Quelle: Lokales Qwen",
    mock: "Quelle: Mock/Simulation",
    demo: "Quelle: Demo-Daten",
    unknown: "Quelle: unbekannt"
  };
  return labels[source] || labels.unknown;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

hydrateAppState();
