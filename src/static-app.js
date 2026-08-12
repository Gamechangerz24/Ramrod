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
  { id: "catawiki", name: "Catawiki", status: "assisted", statusLabel: "Einreichung assistiert", selectable: true },
  { id: "jtl_wawi", name: "JTL-Wawi", type: "erp", status: "planned", statusLabel: "Verbindung vorbereiten", selectable: false, integrationKind: "erp" }
];
let runtimeChannelCatalog = fallbackChannelCatalog;

const app = document.querySelector("#app");
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const icon = (label) => `<span class="mini-icon" aria-hidden="true">${label}</span>`;
const devMode = new URLSearchParams(window.location.search).get("dev") === "1";
const authStorageKey = "ramrod-auth-session";
const organizationStorageKey = "ramrod-active-organization";
const initialOrganizationId = localStorage.getItem(organizationStorageKey) || "";
const invitationToken = new URLSearchParams(window.location.search).get("invite") || "";
const initialView = window.location.pathname.replace(/^\/+|\/+$/g, "") === "vault"
  ? "vault"
  : new URLSearchParams(window.location.search).get("view") || "";
const ebayCallbackState = new URLSearchParams(window.location.search).get("ebay") || "";

window.addEventListener("error", (event) => {
  const message = event.error?.message || event.message || "Unbekannter Frontend-Fehler";
  if (app) {
    app.innerHTML = `<section class="workspace"><div class="status-strip">RAMROD konnte nicht starten: ${escapeHtml(message)}. Versuche /?reset=1 oder lade hart neu.</div></section>`;
  }
});

const state = {
  booting: true,
  view: ["agents", "today", "scan", "vault-scan", "review", "sell", "shipping", "inventory", "archive", "vault", "settings", "admin"].includes(initialView) ? initialView : "today",
  organizations: [],
  activeOrganizationId: initialOrganizationId,
  activeOrganization: null,
  platformAdmin: false,
  membership: null,
  permissions: [],
  needsOnboarding: false,
  pendingInvitations: [],
  invitationToken,
  invitationPreview: null,
  invitationLoading: false,
  onboardingMode: invitationToken ? "join" : "choice",
  onboardingOverlay: false,
  onboardingChannels: ["ebay", "whatnot", "kleinanzeigen"],
  onboardingLoading: false,
  team: null,
  teamLoading: false,
  inviteResultUrl: "",
  adminOverview: [],
  agentControl: { available: false, playbooks: [], runs: [], approvals: [], channelAccounts: [] },
  startingAgent: "",
  decidingApproval: "",
  ebaySetupBusy: "",
  creatingOrganization: false,
  selected: "itm-001",
  search: "",
  boxFilter: "",
  importStatus: ebayCallbackState === "connected" ? "eBay hat den Zugriff bestätigt. RAMROD prüft jetzt die Verkaufseinstellungen." : "Lade lokale App...",
  channelPlan: null,
  persistence: { configured: false, writable: false },
  runtimeConfig: { authRequired: false, supabaseUrl: "", supabaseAnonKey: "", channels: [], providers: {} },
  authSession: loadAuthSession(),
  recoverySession: loadRecoverySession(),
  authError: "",
  authNotice: "",
  authMode: invitationToken ? "signup" : "login",
  authLoading: false,
  authResetLoading: false,
  showAllChannels: false,
  recognizing: false,
  recognition: null,
  recognitionMeta: null,
  recognitionRequestId: 0,
  analyzing: false,
  captureMode: "single",
  captureDestination: initialView === "vault-scan" ? "vault" : "sales",
  batchDrafts: [],
  batchAnalyzing: false,
  batchProgress: null,
  batchSummary: null,
  mobileReviewItem: "",
  mobileDetailsItem: "",
  priceChecking: "",
  ebayDrafting: "",
  ebayPreparing: "",
  ebayPublishing: "",
  approving: "",
  vaultSelected: "",
  vaultFilter: "all",
  vaultFormOpen: false,
  vaultEditingItem: "",
  vaultReidentifyItem: "",
  vaultLoanItem: "",
  vaultConfirmSaleItem: "",
  vaultBusy: "",
  vaultScope: "mine",
  vaultNetworkBusy: "",
  collectionNetwork: {
    available: false,
    message: "",
    ownedShares: [],
    receivedShares: [],
    sharedItems: [],
    incomingAccessRequests: [],
    outgoingAccessRequests: [],
    ownerLoanRequests: [],
    requesterLoanRequests: []
  },
  draft: createEmptyDraft("SV-001"),
  items: normalizeItems(loadStoredItems(initialOrganizationId))
};
const watchedAutomationJobs = new Set();

function localItemsKey(organizationId = state.activeOrganizationId) {
  return organizationId ? `ramrod-items:${organizationId}` : "creators-scanapp-items";
}

function localItemJson(items = state.items) {
  return JSON.stringify(items, (key, value) => {
    if (typeof value === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value)) return "";
    if (key === "photos" && Array.isArray(value)) return [];
    if (key === "sourceImages" && Array.isArray(value)) {
      return value.filter((entry) => typeof entry === "string" && !/^data:image\//i.test(entry)).slice(0, 12);
    }
    return value;
  });
}

function minimalLocalItems(items = state.items) {
  return items.map((item) => ({
    id: item.id,
    dbId: item.dbId,
    sku: item.sku,
    boxId: item.boxId,
    title: item.title,
    category: item.category,
    franchise: item.franchise,
    condition: item.condition,
    completeness: item.completeness,
    confidence: item.confidence,
    low: item.low,
    fair: item.fair,
    aggressive: item.aggressive,
    channel: item.channel,
    stage: item.stage,
    weight: item.weight,
    image: typeof item.image === "string" && !/^data:image\//i.test(item.image) ? item.image : "",
    sourceType: item.sourceType,
    archivedAt: item.archivedAt || null,
    collection: item.collection || null
  }));
}

function saveLocal() {
  const key = localItemsKey();
  try {
    localStorage.setItem(key, localItemJson());
  } catch (error) {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(minimalLocalItems()));
    } catch {
      // Supabase remains authoritative when Safari declines all local caching.
    }
    console.warn("RAMROD local cache was compacted:", error?.name || "storage_limit");
  }
}
const save = saveLocal;

function liveAnalysisErrorMessage(error) {
  const message = String(error?.message || "Unbekannter Fehler");
  if (error?.name === "QuotaExceededError" || /quota has been exceeded/i.test(message)) {
    return "Der lokale Gerätespeicher war voll. RAMROD hat den Cache bereinigt. Bitte den Scan erneut speichern.";
  }
  return `Live-KI fehlgeschlagen: ${message}. Es wurde kein Live-Artikel erzeugt.`;
}

function createEmptyDraft(boxId = "SV-001") {
  return {
    query: "",
    boxId,
    condition: "Gut",
    completeness: "Ungeprüft, Fotos vorhanden",
    barcode: "",
    photo: "",
    photos: [],
    photoSetComplete: false,
    manualIdentityConfirmed: false,
    recognitionCorrection: null,
    useVisualSearch: false,
    visualMatchesSearched: false,
    visualMatches: [],
    visualSearchWarning: "",
    weight: "0.25"
  };
}

function loadAuthSession() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (hash.get("access_token") && hash.get("type") !== "recovery") {
    const callbackSession = {
      access_token: hash.get("access_token"),
      refresh_token: hash.get("refresh_token") || "",
      expires_in: Number(hash.get("expires_in") || 0),
      token_type: hash.get("token_type") || "bearer"
    };
    localStorage.setItem(authStorageKey, JSON.stringify(callbackSession));
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    return callbackSession;
  }
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

function inventoryItemFromRecognition(draft = state.draft, recognition = state.recognition) {
  const identity = recognition?.identity || {};
  const estimate = recognition?.quickEstimate || {};
  const evidence = recognition?.evidence || {};
  const fair = Math.max(0, Number(estimate.fair || 0));
  const low = Math.max(0, Number(estimate.low || fair));
  const high = Math.max(fair, Number(estimate.high || fair));
  const confidence = Math.max(0, Math.min(100, Number(evidence.score || recognition?.modelConfidence || estimate.confidence || 0)));
  const title = String(identity.title || draft.query || "Unbekanntes Medium").trim();

  return enrichWorkflow({
    id: makeId(),
    sku: nextVaultSku(),
    boxId: draft.boxId,
    title,
    category: identity.category || identity.productType || "Medium",
    franchise: identity.franchise || identity.brand || identity.platform || "",
    condition: draft.condition,
    completeness: draft.completeness,
    confidence,
    low,
    fair,
    aggressive: high,
    channel: "Sammlung",
    stage: "Sammlung",
    weight: Number(draft.weight) || 0,
    barcode: draft.barcode || "",
    image: draft.photos?.[0]?.dataUrl || draft.photo || "",
    notes: estimate.basis || "Schneller Inventareintrag. Medieninformationen werden im Hintergrund ergänzt.",
    sourceType: "vault-recognition",
    research: []
  });
}

function salesItemFromRecognition(draft = state.draft, recognition = state.recognition, error = null) {
  const item = inventoryItemFromRecognition(draft, recognition);
  return enrichWorkflow({
    ...item,
    sku: nextSku(draft.boxId),
    channel: "Pruefen",
    stage: "Gescannt",
    sourceType: "live_recognition",
    analysisPending: true,
    analysisWarning: error?.message || "Markt- und Strategieanalyse steht noch aus.",
    notes: "Produkt erkannt. Der angezeigte Preis ist eine vorläufige Bildschätzung; Marktquellen, Verkaufskanal und Strategie werden noch geprüft."
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
    salesFormat: item.channel === "eBay"
      ? (ebaySaleModeFor(item) === "auction_1_euro" ? "auction" : "fixed_price")
      : strategy.salesFormat || (item.channel === "Whatnot" ? "live_show" : item.channel === "Bundle" ? "bundle" : "fixed_price"),
    targetPrice: Number(channelPlan.primary?.targetPrice || strategy.targetPrice || fair),
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
  }, { fair, low, role: "primary" });
  const legacyAlternatives = Array.isArray(strategy.alternativeChannels) && strategy.alternativeChannels.length
    ? strategy.alternativeChannels
    : channelAlternatives(item.channel);
  const parallel = Array.isArray(source.parallel) && source.parallel.length
    ? source.parallel.map((entry) => normalizeChannelPlanEntry(entry, {}, { fair, low, role: "parallel" }))
    : legacyAlternatives.slice(0, 2).map((name, index) => normalizeChannelPlanEntry(null, {
      name: channelLabel(name),
      role: "parallel",
      roleLabel: index === 0 ? "Ergänzung" : "Zweitmarkt",
      score: 70 - index * 5,
      targetPrice: fair,
      activation: "manual-after-approval",
      reason: "Als ergänzender Kanal nach Freigabe prüfen."
    }, { fair, low, role: "parallel" }));
  const discovery = Array.isArray(source.discovery)
    ? source.discovery.map((entry) => normalizeChannelPlanEntry(entry, {}, { fair, low, role: "discovery" }))
    : [];
  const fallback = source.fallback
    ? normalizeChannelPlanEntry(source.fallback, {}, { fair, low, role: "fallback" })
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

function normalizeChannelPlanEntry(entry, fallback = {}, pricingContext = {}) {
  const value = { ...fallback, ...(entry || {}) };
  const registry = channelCatalog().find((channel) => channel.id === value.id || channel.name === value.name);
  const pricing = clientChannelPricing(value.name || registry?.name, pricingContext);
  const hasChannelPricing = Boolean(value.priceLabel);
  return {
    id: value.id || registry?.id || channelClass(value.name || "offen"),
    name: value.name || registry?.name || "Offen",
    role: value.role || "parallel",
    roleLabel: value.roleLabel || "Ergänzung",
    score: Number(value.score || 0),
    targetPrice: Number(hasChannelPricing ? value.targetPrice : pricing.targetPrice),
    priceLabel: value.priceLabel || pricing.priceLabel,
    expectedSalePrice: Number(hasChannelPricing ? value.expectedSalePrice : pricing.expectedSalePrice),
    expectedPriceLabel: value.expectedPriceLabel || pricing.expectedPriceLabel,
    priceBasis: value.priceBasis || pricing.priceBasis,
    activation: value.activation || "after-approval",
    reason: value.reason || "Als ergänzenden Verkaufskanal prüfen.",
    status: value.status || registry?.status || "planned",
    statusLabel: value.statusLabel || registry?.statusLabel || "Geplant",
    publishingMode: value.publishingMode || registry?.publishingMode || "manual",
    automationLevel: value.automationLevel || registry?.automationLevel || "manual",
    delistSupported: value.delistSupported ?? registry?.delistSupported ?? false
  };
}

function clientChannelPricing(identifier, context = {}) {
  const channel = String(identifier || "").trim().toLowerCase();
  const fair = Math.max(0, Number(context.fair) || 0);
  const low = Math.max(0, Number(context.low) || Math.round(fair * 0.65));
  const role = context.role || "parallel";
  const amount = (value) => value > 0 ? Math.max(1, Math.round(value)) : 0;
  const result = (targetPrice, priceLabel, expectedSalePrice, expectedPriceLabel, priceBasis) => ({
    targetPrice: amount(targetPrice),
    priceLabel,
    expectedSalePrice: amount(expectedSalePrice),
    expectedPriceLabel,
    priceBasis
  });

  if (role === "discovery" || ["instagram", "google shopping", "tiktok shop"].includes(channel)) {
    return result(0, "Reichweite", 0, "Kein eigener Verkaufspreis", "Preis bleibt am Hauptangebot.");
  }
  if (role === "fallback") {
    if (channel === "whatnot") return result(low * 0.65, "Startpreis", low, "Erwarteter Abverkauf", "Späterer Live-Abverkauf.");
    if (channel === "liquidation basket") return result(low * 0.7, "Postenwert", low * 0.7, "Erwarteter Erlös", "Konservativer Restpostenwert.");
    return result(low, "Schnellpreis", low, "Erwarteter Verkauf", "Reduzierter Zweitmarktpreis.");
  }
  if (channel === "whatnot") return result(low * 0.65, "Startpreis", fair * 0.85, "Erwarteter Zuschlag", "Live-Start statt Festpreis.");
  if (["kleinanzeigen", "facebook marketplace", "vinted"].includes(channel)) return result(fair * 1.1, "Angebotspreis", fair, "Nach Verhandlung", "Verhandlungsspielraum eingerechnet.");
  if (channel === "ebay") return result(fair * 1.08, "Angebotspreis", fair, "Erwarteter Verkauf", "Preisvorschläge eingerechnet.");
  if (channel === "ramrod shop") return result(fair, "Shoppreis", fair, "Erwarteter Verkauf", "Marktnaher Direktpreis.");
  if (channel === "catawiki") return result(low * 0.75, "Auktionsstart", fair * 1.05, "Erwarteter Zuschlag", "Auktionsstart mit Sammlerpotenzial.");
  if (["cardmarket", "bricklink", "discogs", "reverb", "spezialforum"].includes(channel)) return result(fair * 1.04, "Fachmarktpreis", fair, "Erwarteter Verkauf", "Leichter Fachmarkt-Aufschlag.");
  return result(fair, channel === "pruefen" ? "Vorläufiger Marktwert" : "Zielpreis", fair, "Erwarteter Verkauf", "Marktwert als Preisbasis.");
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
    if (state.invitationToken && !state.invitationPreview) {
      try {
        state.invitationPreview = (await fetchPublicJson(`/api/invitations/${encodeURIComponent(state.invitationToken)}`)).invitation;
      } catch (error) {
        state.authNotice = error.message;
      }
    }
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
    state.membership = payload.membership || null;
    state.permissions = payload.permissions || [];
    state.needsOnboarding = Boolean(payload.needsOnboarding);
    state.pendingInvitations = payload.invitations || [];
    state.adminOverview = payload.adminOverview || [];
    state.agentControl = payload.agentControl || state.agentControl;
    if (state.activeOrganizationId) localStorage.setItem(organizationStorageKey, state.activeOrganizationId);

    if (state.needsOnboarding) {
      boxes = [];
      state.items = [];
      state.importStatus = "";
      render();
      return;
    }

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
    await loadCollectionNetwork();
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

async function loadCollectionNetwork() {
  try {
    const payload = await fetchJson("/api/collection-network");
    state.collectionNetwork = {
      available: Boolean(payload.available),
      message: payload.message || "",
      ownedShares: payload.ownedShares || [],
      receivedShares: payload.receivedShares || [],
      sharedItems: normalizeItems(payload.sharedItems || []),
      incomingAccessRequests: payload.incomingAccessRequests || [],
      outgoingAccessRequests: payload.outgoingAccessRequests || [],
      ownerLoanRequests: payload.ownerLoanRequests || [],
      requesterLoanRequests: payload.requesterLoanRequests || []
    };
  } catch (error) {
    state.collectionNetwork = { ...state.collectionNetwork, available: false, message: error.message };
  }
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
  if (result.priceCheck || result.decision) {
    item.analysisPending = false;
    item.analysisWarning = "";
  }
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
  const active = items.filter((item) => !isArchived(item) && !isCollectionOnly(item));
  return state.boxFilter ? active.filter((item) => item.boxId === state.boxFilter) : active;
}

function collectionItems(items = state.items) {
  return items.filter((item) => !isArchived(item) && Boolean(item.collection));
}

function isCollectionOnly(item) {
  return Boolean(item.collection) && ["owned", "loaned"].includes(String(item.collection.status || "owned"));
}

function collectionStatus(item) {
  if (item.stage === "Verkauft" || item.collection?.status === "sold") return "sold";
  if (item.stage === "Gelistet" || item.ebayListing?.status === "active" || item.collection?.status === "listed") return "listed";
  return item.collection?.status || "owned";
}

function collectionStatusLabel(item) {
  return {
    owned: "In Sammlung",
    loaned: "Verliehen",
    selling: "Verkauf wird vorbereitet",
    listed: "Im Verkauf",
    sold: "Verkauft"
  }[collectionStatus(item)] || "In Sammlung";
}

function archivedItems(items = state.items) {
  const archived = items.filter(isArchived);
  return state.boxFilter ? archived.filter((item) => item.boxId === state.boxFilter) : archived;
}

function isArchived(item) {
  return Boolean(item.archivedAt) || ["archiv", "archiviert", "archived"].includes(String(item.stage || "").toLowerCase());
}

function getWorkQueues(items = visibleItems()) {
  const approvedItems = items.filter((item) => item.approval?.status === "approved");
  const review = items.filter((item) => item.approval?.status !== "approved" && (
    item.channel === "Pruefen"
    || item.confidence < 70
    || ["Gescannt", "Freigabe"].includes(item.stage)
  ));
  const ebay = approvedItems.filter((item) => item.channel === "eBay" && item.ebayListing?.status !== "active");
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
  if (item.ebayListing?.status === "active" || item.stage === "Gelistet") return "Bei eBay live";
  if (item.ebayListing?.status === "prepared") return "Bei eBay vorbereitet";
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
      ${state.runtimeConfig.selfServiceSignup ? `<button class="organization-action" data-add-workspace type="button" title="Neuen Bereich anlegen">+</button>` : ""}
      ${state.platformAdmin ? `<button class="organization-action ${state.view === "admin" ? "active" : ""}" data-view="admin" type="button" title="Plattform-Admin">AD</button>` : ""}
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

function can(permission) {
  return state.platformAdmin || state.permissions.includes(permission);
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

  if (state.needsOnboarding) {
    renderOnboarding();
    bindOnboardingEvents();
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
  const systemView = ["admin", "agents", "settings"].includes(state.view);
  const vaultScanView = state.view === "vault-scan";
  const standaloneView = systemView || state.view === "vault" || vaultScanView;

  app.innerHTML = `
    ${organizationRail()}
    <aside class="sidebar ${vaultScanView ? "vault-flow" : ""}">
      <div class="brand tenant-brand"><span class="tenant-avatar" style="--organization-color:${escapeHtml(organization.brandColor || "#ff6a00")}">${escapeHtml(organization.shortCode || "RR")}</span><div><strong>${escapeHtml(organization.name)}</strong><small>${organization.type === "personal" ? "Privatverkauf" : organization.type === "internal" ? "CREATORS Bereich" : "Kundenbereich"}</small></div></div>
      <nav class="nav-list" aria-label="Arbeitsbereiche">
        ${navButton("today", "HE", "Heute")}
        ${vaultScanView ? vaultScanNavButton() : navButton("scan", "ER", "Erfassen")}
        ${navButton("review", "PR", "Prüfen")}
        ${navButton("sell", "VK", "Verkaufen")}
        ${navButton("shipping", "VS", "Versand")}
        ${navButton("inventory", "DB", "Bestand")}
        ${navButton("vault", "SA", "Sammlung")}
        ${navButton("archive", "AR", "Archiv")}
        ${navButton("agents", "AG", "Agenten")}
        ${can("team:manage") ? navButton("settings", "TM", "Team & Kanäle") : ""}
      </nav>
      <nav class="mobile-nav-list ${vaultScanView ? "vault-mobile-nav" : ""}" aria-label="Mobiler Arbeitsablauf">
        ${vaultScanView
          ? `${mobileNavButton("vault", "SA", "Sammlung")}${vaultScanNavButton(true)}`
          : `${mobileNavButton("scan", "KA", "Scannen")}${mobileNavButton("review", "OK", "Freigeben")}${mobileNavButton("sell", "VK", "Verkäufe")}${mobileNavButton("vault", "SA", "Sammlung")}`}
      </nav>
    </aside>
    <section class="workspace view-${state.view}">
      <header class="topbar">
        <div><p>${escapeHtml(organization.name)} · ${escapeHtml(roleLabel(organization.role))}</p><h1>${pageTitle()}</h1></div>
        <div class="topbar-actions">
          ${standaloneView ? "" : `<div class="search-box">${icon("SU")}<input id="search" value="${escapeHtml(state.search)}" placeholder="SKU, Titel, Plattform..." /></div>`}
          ${state.runtimeConfig.authRequired ? `<button class="icon-button" id="sign-out" type="button" title="Abmelden">${icon("AU")}</button>` : ""}
        </div>
      </header>
      ${state.importStatus ? `<div class="status-strip">${escapeHtml(state.importStatus)}</div>` : ""}
      ${standaloneView ? "" : `<section class="metrics" aria-label="Kennzahlen">
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
  const signup = state.authMode === "signup" && state.runtimeConfig.selfServiceSignup;
  const invite = state.invitationPreview;
  app.innerHTML = `<section class="auth-shell">
    <div class="auth-card ${invite ? "with-invite" : ""}">
      <div class="auth-brand"><img src="/app/assets/ramrod-icon-192.png" alt="" /><div><p>RAMROD</p><h1>${signup ? "Konto anlegen" : "Anmelden"}</h1><span>${invite ? `${escapeHtml(invite.organization?.name || "Kundenbereich")} beitreten` : "Deine Verkaufsmaschine"}</span></div></div>
      ${invite ? `<div class="invite-context"><span class="tenant-avatar" style="--organization-color:${escapeHtml(invite.organization?.brandColor || "#ff6a00")}">${escapeHtml(invite.organization?.shortCode || "OR")}</span><div><small>Du wurdest eingeladen</small><strong>${escapeHtml(invite.organization?.name || "Kundenbereich")}</strong><span>Als ${escapeHtml(roleLabel(invite.role))} · für ${escapeHtml(invite.emailHint)}</span></div></div>` : ""}
      <form id="auth-form">
        ${signup ? `<label class="field"><span>Name</span><input name="name" type="text" autocomplete="name" required /></label>` : ""}
        <label class="field"><span>E-Mail</span><input id="auth-email" name="email" type="email" autocomplete="username" required /></label>
        <label class="field"><span>Passwort</span><input id="auth-password" name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" required minlength="8" /></label>
        ${signup ? `<label class="field"><span>Passwort wiederholen</span><input name="confirmation" type="password" autocomplete="new-password" required minlength="8" /></label>` : ""}
        ${state.authNotice ? `<div class="auth-notice">${escapeHtml(state.authNotice)}</div>` : ""}
        ${state.authError ? `<div class="auth-error">${escapeHtml(state.authError)}</div>` : ""}
        <button class="primary-action" type="submit" ${state.authLoading ? "disabled" : ""}>${icon(signup ? "PL" : "AU")}${state.authLoading ? "Einen Moment..." : signup ? "Konto anlegen" : "Anmelden"}</button>
        ${signup ? `<button class="auth-link" data-auth-mode="login" type="button">Ich habe bereits ein Konto</button>` : `${state.runtimeConfig.selfServiceSignup ? `<button class="auth-link" data-auth-mode="signup" type="button">Neues Konto anlegen</button>` : ""}<button class="auth-link" id="forgot-password" type="button" ${state.authResetLoading ? "disabled" : ""}>${state.authResetLoading ? "Reset-Mail wird gesendet..." : "Passwort vergessen?"}</button>`}
      </form>
    </div>
  </section>`;
}

function renderOnboarding() {
  const join = state.onboardingMode === "join" && state.invitationPreview;
  const create = state.onboardingMode === "create";
  const channels = channelCatalog().filter((entry) => entry.selectable || ["instagram", "ramrod_shop"].includes(entry.id)).slice(0, 10);
  app.innerHTML = `<section class="onboarding-shell">
    <header class="onboarding-top"><div class="auth-brand"><img src="/app/assets/ramrod-icon-192.png" alt="" /><div><p>RAMROD</p><strong>Arbeitsbereich einrichten</strong></div></div><div>${state.onboardingOverlay ? `<button class="secondary-action" data-onboarding-cancel type="button">Abbrechen</button>` : ""}<button class="secondary-action" data-onboarding-signout type="button">Abmelden</button></div></header>
    <main class="onboarding-card">
      ${join ? onboardingJoinMarkup() : create ? `<form id="workspace-onboarding-form" class="onboarding-form">
        <div class="onboarding-heading"><span>Neue Instanz</span><h1>Deine Verkaufsmaschine</h1><p>Bestand, Team, Kanäle und Zugangsdaten bleiben vollständig von anderen Kundenbereichen getrennt.</p></div>
        <div class="onboarding-fields">
          <label class="field"><span>Name des Bereichs</span><input name="name" type="text" placeholder="Zum Beispiel Retro Store Stuttgart" required minlength="2" /></label>
          <label class="field"><span>Verkaufsart</span><select name="type"><option value="customer">Unternehmen oder Händler</option><option value="personal">Privater Verkauf</option></select></label>
          <label class="field"><span>Kürzel</span><input name="shortCode" type="text" maxlength="3" placeholder="RS" /></label>
        </div>
        <fieldset class="channel-setup"><legend>Erste Verkaufskanäle</legend><p>Wähle, wo RAMROD deine Artikel vorbereiten soll. Konten werden erst im nächsten Schritt sicher verbunden.</p><div class="channel-choice-grid">${channels.map((channel) => `<label class="channel-choice"><input type="checkbox" name="channels" value="${escapeHtml(channel.id)}" ${state.onboardingChannels.includes(channel.id) ? "checked" : ""} /><span><strong>${escapeHtml(channel.name)}</strong><small>${escapeHtml(channel.statusLabel || "Einrichtung folgt")}</small></span></label>`).join("")}</div></fieldset>
        ${state.authError ? `<div class="auth-error">${escapeHtml(state.authError)}</div>` : ""}
        <div class="onboarding-actions"><button class="secondary-action" data-onboarding-choice type="button">Zurück</button><button class="primary-action" type="submit" ${state.onboardingLoading ? "disabled" : ""}>${icon("GO")}${state.onboardingLoading ? "Wird eingerichtet..." : "Bereich anlegen"}</button></div>
      </form>` : onboardingChoiceMarkup()}
    </main>
  </section>`;
}

function onboardingChoiceMarkup() {
  return `<div class="onboarding-heading"><span>Willkommen</span><h1>Wie möchtest du starten?</h1><p>Ein Konto kann zu mehreren Kundenbereichen gehören. Jeder Bereich hat getrennte Artikel, Teams und Verkaufskonten.</p></div>
    <div class="onboarding-paths">
      <button data-onboarding-create type="button"><span>${icon("PL")}</span><strong>Neuen Bereich anlegen</strong><small>Für dein Unternehmen, einen neuen Kunden oder private Verkäufe.</small></button>
      <div class="onboarding-path muted"><span>${icon("TM")}</span><strong>Bestehendem Bereich beitreten</strong><small>Öffne dafür den persönlichen Einladungslink deines Admins.</small>${state.pendingInvitations.length ? `<em>${state.pendingInvitations.length} Einladung${state.pendingInvitations.length === 1 ? "" : "en"} für deine E-Mail vorhanden</em>` : ""}</div>
    </div>`;
}

function onboardingJoinMarkup() {
  const invite = state.invitationPreview;
  return `<div class="onboarding-heading"><span>Einladung</span><h1>${escapeHtml(invite.organization?.name || "Kundenbereich")} beitreten</h1><p>Du erhältst die Rolle <strong>${escapeHtml(roleLabel(invite.role))}</strong>. Daten anderer Bereiche bleiben für dich unsichtbar.</p></div>
    <div class="join-summary"><span class="organization-card-avatar" style="--organization-color:${escapeHtml(invite.organization?.brandColor || "#ff6a00")}">${escapeHtml(invite.organization?.shortCode || "OR")}</span><div><strong>${escapeHtml(invite.organization?.name || "Kundenbereich")}</strong><small>${escapeHtml(invite.emailHint)} · gültig bis ${escapeHtml(formatDate(invite.expiresAt))}</small></div></div>
    ${state.authError ? `<div class="auth-error">${escapeHtml(state.authError)}</div>` : ""}
    <div class="onboarding-actions"><button class="secondary-action" data-onboarding-create type="button">Eigenen Bereich anlegen</button><button class="primary-action" data-accept-invitation type="button" ${state.invitationLoading ? "disabled" : ""}>${icon("OK")}${state.invitationLoading ? "Wird verbunden..." : "Einladung annehmen"}</button></div>`;
}

function bindOnboardingEvents() {
  document.querySelector("[data-onboarding-create]")?.addEventListener("click", () => {
    state.onboardingMode = "create";
    state.authError = "";
    render();
  });
  document.querySelector("[data-onboarding-choice]")?.addEventListener("click", () => {
    state.onboardingMode = state.invitationPreview ? "join" : "choice";
    state.authError = "";
    render();
  });
  document.querySelector("[data-onboarding-cancel]")?.addEventListener("click", () => {
    state.needsOnboarding = false;
    state.onboardingOverlay = false;
    state.onboardingMode = "choice";
    render();
  });
  document.querySelector("[data-onboarding-signout]")?.addEventListener("click", () => {
    saveAuthSession(null);
    state.needsOnboarding = false;
    state.onboardingOverlay = false;
    render();
  });
  document.querySelector("#workspace-onboarding-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.onboardingLoading) return;
    const formData = new FormData(event.currentTarget);
    state.onboardingLoading = true;
    state.authError = "";
    render();
    try {
      const result = await postJson("/api/onboarding/organizations", {
        name: formData.get("name"),
        type: formData.get("type"),
        shortCode: formData.get("shortCode"),
        channels: formData.getAll("channels")
      });
      state.activeOrganizationId = result.organization.id;
      localStorage.setItem(organizationStorageKey, result.organization.id);
      state.needsOnboarding = false;
      state.onboardingOverlay = false;
      state.view = "scan";
      await hydrateAppState();
    } catch (error) {
      state.onboardingLoading = false;
      state.authError = error.message;
      render();
    }
  });
  document.querySelector("[data-accept-invitation]")?.addEventListener("click", async () => {
    if (state.invitationLoading || !state.invitationToken) return;
    state.invitationLoading = true;
    state.authError = "";
    render();
    try {
      const result = await postJson(`/api/invitations/${encodeURIComponent(state.invitationToken)}/accept`, {});
      state.activeOrganizationId = result.organization.id;
      localStorage.setItem(organizationStorageKey, result.organization.id);
      state.needsOnboarding = false;
      state.invitationToken = "";
      state.invitationPreview = null;
      window.history.replaceState({}, document.title, window.location.pathname);
      state.view = "today";
      await hydrateAppState();
    } catch (error) {
      state.invitationLoading = false;
      state.authError = error.message;
      render();
    }
  });
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

  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => {
    state.authMode = button.dataset.authMode;
    state.authError = "";
    state.authNotice = "";
    render();
  }));

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
    const signup = state.authMode === "signup" && state.runtimeConfig.selfServiceSignup;
    if (signup && password !== String(event.target.elements.confirmation.value || "")) {
      state.authError = "Die beiden Passwörter stimmen nicht überein.";
      render();
      return;
    }
    state.authLoading = true;
    state.authError = "";
    render();
    try {
      const session = signup
        ? await signUpWithPassword(email, password, String(event.target.elements.name.value || "").trim())
        : await signInWithPassword(email, password);
      if (!session?.access_token) {
        state.authLoading = false;
        state.authMode = "login";
        state.authNotice = "Konto angelegt. Bitte bestätige jetzt den Link in deiner E-Mail und melde dich danach an.";
        render();
        return;
      }
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
    vault: "Sammlung",
    "vault-scan": "Sammlung scannen",
    archive: "Archiv",
    agents: "Agenten",
    settings: "Team & Kanäle",
    admin: "Plattform-Admin"
  }[state.view] || "RAMROD";
}

function navButton(id, iconLabel, label) {
  return `<button class="nav-button ${state.view === id ? "active" : ""}" data-view="${id}" type="button" title="${label}">${icon(iconLabel)}<span>${label}</span></button>`;
}

function mobileNavButton(id, iconLabel, label) {
  const groupedViews = id === "sell" ? ["sell", "inventory", "archive", "shipping", "campaigns", "routing", "agents"] : [id];
  return `<button class="nav-button ${groupedViews.includes(state.view) ? "active" : ""}" data-view="${id}" type="button" title="${label}">${icon(iconLabel)}<span>${label}</span></button>`;
}

function vaultScanNavButton(mobile = false) {
  const label = mobile ? "Kamera" : "Sammlung scannen";
  return `<button class="nav-button active" data-view="vault-scan" type="button" title="${label}">${icon("KA")}<span>${label}</span></button>`;
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
  if (state.view === "vault-scan") return vaultScanView();
  if (state.view === "scan") return scanView();
  if (state.view === "review") return reviewView(selected);
  if (state.view === "sell") return sellView();
  if (state.view === "routing") return routingView();
  if (state.view === "campaigns") return campaignsView();
  if (state.view === "shipping") return shippingView();
  if (state.view === "vault") return vaultView();
  if (state.view === "archive") return archiveView();
  if (state.view === "agents") return agentsView();
  if (state.view === "admin") return adminView();
  if (state.view === "settings") return settingsView();
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

function nextVaultSku() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VLT-${stamp}-${suffix}`;
}

function inferMediaType(item) {
  const text = [item.title, item.category, item.franchise].filter(Boolean).join(" ").toLowerCase();
  if (["blu-ray", "bluray", "dvd", "film", "movie", "vhs"].some((token) => text.includes(token))) return "film";
  if (["spiel", "game", "xbox", "playstation", "nintendo", "switch", "dreamcast", "atari"].some((token) => text.includes(token))) return "game";
  return "other";
}

function collectionDefaults(item, overrides = {}) {
  const previous = item.collection || {};
  return {
    status: previous.status || "owned",
    mediaType: previous.mediaType || inferMediaType(item),
    platform: previous.platform || item.franchise || "",
    edition: previous.edition || "",
    barcode: previous.barcode || item.barcode || "",
    location: previous.location || item.boxId || "",
    purchaseDate: previous.purchaseDate || "",
    purchasePrice: Number(previous.purchasePrice || 0),
    estimatedValue: Number(previous.estimatedValue || item.fair || 0),
    borrowerName: previous.borrowerName || "",
    borrowerContact: previous.borrowerContact || "",
    loanedAt: previous.loanedAt || "",
    dueAt: previous.dueAt || "",
    returnedAt: previous.returnedAt || "",
    notes: previous.notes || "",
    canonicalIds: previous.canonicalIds || { imdb: "", tmdb: "", igdb: "" },
    genres: Array.isArray(previous.genres) ? previous.genres : [],
    themes: Array.isArray(previous.themes) ? previous.themes : [],
    moods: Array.isArray(previous.moods) ? previous.moods : [],
    people: Array.isArray(previous.people) ? previous.people : [],
    keywords: Array.isArray(previous.keywords) ? previous.keywords : [],
    releaseYear: previous.releaseYear || "",
    runtimeMinutes: Number(previous.runtimeMinutes || 0),
    ageRating: previous.ageRating || "",
    summary: previous.summary || "",
    reviewLinks: Array.isArray(previous.reviewLinks) ? previous.reviewLinks : [],
    enrichment: previous.enrichment || { status: "pending", sources: [], enrichedAt: "" },
    capturedViews: Number(previous.capturedViews || 0),
    history: Array.isArray(previous.history) ? previous.history : [],
    addedAt: previous.addedAt || new Date().toISOString(),
    ...overrides
  };
}

function identityFromItem(item) {
  const collection = collectionDefaults(item);
  const recognized = item.recognition?.identity || {};
  return {
    title: item.title || recognized.title || "",
    productType: collection.mediaType === "film" ? "Film" : collection.mediaType === "game" ? "Videospiel" : (recognized.productType || item.category || "Sammlungsstück"),
    category: item.category || recognized.category || "",
    brand: recognized.brand || item.franchise || "",
    franchise: item.franchise || recognized.franchise || "",
    platform: collection.platform || recognized.platform || "",
    edition: collection.edition || recognized.edition || "",
    region: recognized.region || recognized.language || ""
  };
}

function identitiesDiffer(left, right) {
  const keys = ["title", "productType", "category", "brand", "franchise", "platform", "edition", "region"];
  return keys.some((key) => String(left?.[key] || "").trim().toLowerCase() !== String(right?.[key] || "").trim().toLowerCase());
}

async function submitRecognitionFeedback({ item, predictedIdentity, correctedIdentity, correctionNote = "", source = "manual_correction" }) {
  if (!identitiesDiffer(predictedIdentity, correctedIdentity)) return null;
  try {
    const result = await postJson("/api/recognition-feedback", {
      itemId: item.dbId || item.id,
      predictedIdentity,
      correctedIdentity,
      correctionNote,
      comparisonContext: {
        barcode: collectionDefaults(item).barcode || item.barcode || "",
        captureIntent: "media_library",
        source
      }
    });
    const comparison = result.comparison || {};
    state.importStatus = comparison.status === "active"
      ? "Korrektur gespeichert. Mehrere passende Fälle bestätigen dieses Vergleichsmuster; neue Scans werden damit gegengeprüft."
      : "Korrektur gespeichert. Sie wird mit weiteren passenden Fällen verglichen, aber nicht ungeprüft übernommen.";
    return result;
  } catch (error) {
    state.importStatus = `Artikel gespeichert. Lernhinweis konnte noch nicht abgeglichen werden: ${error.message}`;
    return null;
  }
}

function moveItemToCollection(item, overrides = {}) {
  const recognitionSource = item.collection?.recognitionSource || item.sourceType || "unknown";
  item.collection = collectionDefaults(item, { recognitionSource, ...overrides });
  item.stage = "Sammlung";
  item.channel = "Sammlung";
  item.sourceType = "vault";
  item.approval = { ...(item.approval || {}), status: "pending", strategyAccepted: false };
  item.ebayDraft = null;
  item.ebayListing = null;
  return enrichWorkflow(item);
}

function capturePhotoLimit() {
  return state.view === "vault-scan" || state.captureMode === "batch" ? 6 : 4;
}

function captureIntent() {
  return state.view === "vault-scan" || state.captureDestination === "vault" ? "media_library" : "sales";
}

function photoSourceActions(photoCount, photoLimit) {
  if (photoCount >= photoLimit) return "";
  return `<div class="photo-source-actions" aria-label="Bilder hinzufügen">
    <button class="secondary-action" data-photo-camera type="button">${icon("KA")}${photoCount ? "Weiteres Foto aufnehmen" : "Foto aufnehmen"}</button>
    <button class="secondary-action" data-photo-upload type="button">${icon("UP")}${photoCount ? "Weitere Bilder hochladen" : "Bilder hochladen"}</button>
    <input class="photo-source-input" id="photo-upload" accept="image/*" type="file" multiple />
  </div>`;
}

async function addPhotosToDraft(fileList, { startVaultScan = false } = {}) {
  if (startVaultScan) {
    state.recognitionRequestId += 1;
    state.captureDestination = "vault";
    state.captureMode = "single";
    state.vaultReidentifyItem = "";
    state.draft = createEmptyDraft(state.draft.boxId || boxes[0]?.id || "VLT-001");
    state.recognition = null;
    state.recognitionMeta = null;
    state.view = "vault-scan";
  }

  const photoLimit = capturePhotoLimit();
  const remaining = Math.max(0, photoLimit - (state.draft.photos?.length || 0));
  const files = [...(fileList || [])].slice(0, remaining);
  if (!files.length) return false;
  const previousPhotoCount = state.draft.photos?.length || 0;
  state.importStatus = `${files.length} Foto${files.length === 1 ? "" : "s"} wird vorbereitet...`;
  render();
  try {
    const preparedPhotos = [];
    for (const file of files) preparedPhotos.push(await prepareImageForAi(file));
    state.draft.photos = [...(state.draft.photos || []), ...preparedPhotos].slice(0, photoLimit);
    state.draft.photo = state.draft.photos[0]?.dataUrl || "";
    state.draft.photoSetComplete = false;
    state.draft.recognitionCorrection = null;
    if (state.draft.useVisualSearch && previousPhotoCount === 0) {
      state.draft.visualMatchesSearched = false;
      state.draft.visualMatches = [];
    }
    state.recognition = null;
    state.recognitionMeta = null;
    const weakest = Math.min(...state.draft.photos.map((entry) => entry.quality?.score ?? 100));
    state.importStatus = `${state.draft.photos.length} Foto${state.draft.photos.length === 1 ? "" : "s"} bereit · schwächste Bildqualität ${weakest}%.`;
  } catch (error) {
    state.importStatus = `Bildvorbereitung fehlgeschlagen: ${error.message}.`;
  }
  render();
  if ((state.captureMode === "single" || state.view === "vault-scan") && state.draft.photos.length) await runFastRecognition();
  return true;
}

function vaultScanView() {
  const reidentifyItem = state.items.find((item) => item.id === state.vaultReidentifyItem);
  const photos = state.draft.photos?.length
    ? state.draft.photos
    : state.draft.photo
      ? [{ dataUrl: state.draft.photo, quality: null }]
      : [];
  const photoLimit = capturePhotoLimit();
  const recognitionStatus = state.recognition?.evidence?.status || "";
  const evidence = state.recognition?.evidence || {};
  const identityNeedsConfirmation = recognitionStatus === "manual_review_ready"
    && !evidence.operatorCorrected
    && (Boolean(evidence.manualIdentityRequired) || Boolean(evidence.categoryConflict) || Number(evidence.score || 0) < 55);
  const recognitionCanProceed = recognitionStatus === "ready_for_research"
    || (recognitionStatus === "manual_review_ready" && (!identityNeedsConfirmation || state.draft.manualIdentityConfirmed));
  const activeStep = state.analyzing ? 4 : state.recognition ? 3 : state.recognizing ? 2 : 1;
  const actionLabel = state.analyzing
    ? "Wird gespeichert..."
    : state.recognizing
      ? "Medium wird erkannt..."
      : recognitionCanProceed
        ? (reidentifyItem ? "Identität ersetzen" : "In Sammlung speichern")
        : state.recognition
          ? identityNeedsConfirmation
            ? "Titel und Medienformat bestätigen"
            : "Fotosatz zuerst abschließen"
          : "Medium erkennen";
  const actionDisabled = state.analyzing || state.recognizing || (!photos.length && !devMode) || Boolean(state.recognition && !recognitionCanProceed);
  const needsPhotoEvidence = Boolean(state.recognition && !recognitionCanProceed);

  return `<section class="vault-scan-shell">
    <header class="vault-scan-header">
      <button class="secondary-action" data-vault-back type="button">${icon("BK")}Sammlung</button>
      <div><p>${reidentifyItem ? "Identität reparieren · Bildsuche aktiv" : "Nur Inventar · kein Verkauf"}</p><h2>${reidentifyItem ? escapeHtml(reidentifyItem.title) : "Ein Spiel oder einen Film erfassen"}</h2><span>${reidentifyItem ? "Fotografiere Cover, Rückseite, Rücken und Barcode neu. RAMROD ersetzt nur die falsche Identität; SKU, Besitzstatus und Historie bleiben erhalten." : "Bis zu sechs Ansichten gehören zu demselben Exemplar. RAMROD erkennt sie gemeinsam und legt ausschließlich einen Sammlungseintrag an."}</span></div>
    </header>
    ${reidentifyItem ? `<section class="vault-reidentify-notice">${icon("VS")}<div><strong>Neue Methode: visuelle Produktsuche plus KI</strong><span>Das erste Foto wird gezielt mit Google Lens über SerpApi abgeglichen. Treffer dienen als Kandidaten und werden mit Text, Barcode und weiteren Fotos gegengeprüft.</span></div></section>` : ""}
    <div class="vault-scan-grid">
      <section class="vault-scan-capture">
        <div class="workflow-progress vault-progress" aria-label="Sammlungsworkflow">${["Foto", "Erkennen", "Inventar", "Speichern"].map((label, index) => `<span class="${activeStep === index + 1 ? "active" : activeStep > index + 1 ? "done" : ""}">${index + 1} ${label}</span>`).join("")}</div>
        <div class="vault-photo-guide" aria-label="Empfohlene Ansichten">
          <span>${icon("01")}Cover / Vorderseite</span><span>${icon("02")}Rückseite und Barcode</span><span>${icon("03")}Rücken oder Plattform</span><span>${icon("04")}Datenträger und Zustand</span>
        </div>
        <label class="photo-drop vault-photo-drop ${needsPhotoEvidence ? "attention-required" : ""}">${photos[0] ? `<img src="${photos[0].dataUrl}" alt="Vorschau des Sammlungsstücks" />` : `<span>${icon("KA")}<strong>Erstes Foto aufnehmen</strong><small>Beginne mit dem vollständigen Cover oder der Vorderseite</small></span>`}<input id="photo" accept="image/*" capture="environment" type="file" multiple /></label>
        <div class="photo-capture-meta"><span>${photos.length}/${photoLimit} Ansichten</span><strong>${photos.length ? "Weitere Seite desselben Exemplars" : "Kamera oder vorhandene Bilder"}</strong></div>
        ${photoSourceActions(photos.length, photoLimit)}
        ${photos.length ? `<div class="photo-thumbnails vault-photo-thumbnails">${photos.map((photo, index) => `<div><img src="${photo.dataUrl}" alt="Ansicht ${index + 1}" /><button data-remove-photo="${index}" type="button" title="Foto entfernen">×</button><small>${photo.quality ? `${photo.quality.score}% Qualität` : `Ansicht ${index + 1}`}</small></div>`).join("")}</div>` : ""}
        ${quickValueCard(state.recognition, true)}
        ${identityNeedsConfirmation ? `<section class="vault-identity-confirmation">
          <strong>Treffer unsicher: Titel kurz korrigieren</strong>
          <p>RAMROD konnte Medienformat oder Edition nicht sicher belegen. Trage den sichtbaren Titel inklusive Format ein, zum Beispiel „Spider-Man: Far From Home · 4K UHD Limited Edition Steelbook“.</p>
          ${field("Titel und Medienformat", `<input id="query" value="${escapeHtml(state.draft.query)}" placeholder="Titel · Format · Edition" />`)}
        </section>` : ""}
        <details class="capture-details vault-capture-details">
          <summary>Inventarangaben ergänzen</summary>
          <div class="form-grid">
            ${identityNeedsConfirmation ? "" : field("Titelhinweis", `<input id="query" value="${escapeHtml(state.draft.query)}" placeholder="z. B. Titel oder Edition" />`)}
            ${field("Barcode", `<div class="input-with-icon">${icon("BC")}<input id="barcode" value="${escapeHtml(state.draft.barcode)}" inputmode="numeric" placeholder="EAN / UPC" /></div>`)}
            ${field("Standort", `<select id="boxId">${boxes.map((box) => `<option ${box.id === state.draft.boxId ? "selected" : ""}>${box.id}</option>`).join("")}</select>`)}
            ${field("Zustand", `<select id="condition">${["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"].map((value) => `<option ${value === state.draft.condition ? "selected" : ""}>${value}</option>`).join("")}</select>`)}
            ${field("Vollständigkeit", `<input id="completeness" value="${escapeHtml(state.draft.completeness)}" />`)}
          </div>
        </details>
        <button class="primary-action mobile-primary-action" id="add-item" type="button" ${actionDisabled ? "disabled" : ""}>${icon("SA")}${actionLabel}</button>
      </section>
      <aside class="vault-scan-recognition">${fastRecognitionPanel(photos)}</aside>
    </div>
  </section>`;
}

function scanView() {
  const photos = state.draft.photos?.length
    ? state.draft.photos
    : state.draft.photo
      ? [{ dataUrl: state.draft.photo, quality: null }]
      : [];
  const batchMode = state.captureMode === "batch";
  const photoLimit = capturePhotoLimit();
  const currentBatchNumber = state.batchDrafts.length + 1;
  const capturedCount = state.batchDrafts.length + (photos.length ? 1 : 0);
  const activeStep = state.analyzing ? 4 : state.recognition ? 3 : state.recognizing ? 2 : 1;
  const recognitionStatus = state.recognition?.evidence?.status || "";
  const recognitionCanProceed = recognitionStatus === "ready_for_research" || recognitionStatus === "manual_review_ready";
  const vaultCapture = state.captureDestination === "vault";
  const progressSteps = vaultCapture ? ["Foto", "Erkennen", "Inventar", "Speichern"] : ["Foto", "Erkennen", "Markt", "Strategie", "Freigeben"];
  const actionLabel = state.analyzing
    ? (vaultCapture ? "Wird gespeichert..." : "Analyse läuft...")
    : state.recognizing
      ? "Produkt wird erkannt..."
      : recognitionCanProceed
        ? (vaultCapture ? "In Sammlung speichern" : "Preis, Kanal und Strategie ermitteln")
        : state.recognition
          ? "Fotosatz zuerst abschließen"
          : (vaultCapture ? "Für Sammlung erkennen" : "Artikel analysieren");
  const actionDisabled = state.analyzing || state.recognizing || (!photos.length && !devMode) || Boolean(state.recognition && !recognitionCanProceed);
  const needsPhotoEvidence = Boolean(state.recognition && !recognitionCanProceed);
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

  return `${vaultCapture ? `<section class="vault-capture-banner"><div>${icon("SA")}<span><strong>Eigener Sammlungs-Scan</strong><small>Hier entsteht ausschließlich ein Inventareintrag. Ein Verkauf startet erst später über „Über RAMROD verkaufen“.</small></span></div><button class="secondary-action" data-vault-back type="button">Zurück zur Sammlung</button></section>` : ""}<section class="work-grid ${batchMode ? "batch-capture-workspace" : ""}">
    <div class="scan-panel">
      <div class="panel-heading"><div><p>${batchMode ? `Serienaufnahme · Artikel ${currentBatchNumber}` : (vaultCapture ? "Sammlungsaufnahme" : "Einzelaufnahme")}</p><h2>${batchMode ? (vaultCapture ? "Sammlung nacheinander erfassen" : "Viele Artikel nacheinander") : (vaultCapture ? "Sammlungsstück erfassen" : "Einen Artikel analysieren")}</h2></div><button class="icon-button" id="reset" title="Aufnahme zurücksetzen">${icon("NE")}</button></div>
      <div class="capture-mode" role="group" aria-label="Aufnahmemodus">
        <button class="${batchMode ? "" : "selected"}" data-capture-mode="single" type="button">Ein Artikel</button>
        <button class="${batchMode ? "selected" : ""}" data-capture-mode="batch" type="button">Serienaufnahme</button>
      </div>
      ${batchMode
        ? `<div class="batch-instruction"><strong>${state.batchDrafts.length} Artikel gespeichert</strong><span>Fotografiere alle Seiten dieses Artikels. Danach „Nächster Artikel“.</span></div>`
        : `<div class="workflow-progress ${vaultCapture ? "vault-progress" : ""}" aria-label="${vaultCapture ? "Sammlungsworkflow" : "Verkaufsworkflow"}">${progressSteps.map((label, index) => `<span class="${activeStep === index + 1 ? "active" : activeStep > index + 1 ? "done" : ""}">${index + 1} ${label}</span>`).join("")}</div>`}
      <label class="photo-drop ${needsPhotoEvidence ? "attention-required" : ""}">${photos[0] ? `<img src="${photos[0].dataUrl}" alt="Artikelvorschau" />` : `<span>${icon("KA")}<strong>${batchMode ? `Artikel ${currentBatchNumber} fotografieren` : "Erstes Foto aufnehmen"}</strong><small>Vorderseite vollständig und gerade</small></span>`}<input id="photo" accept="image/*" capture="environment" type="file" multiple /></label>
      <div class="photo-capture-meta"><span>${photos.length}/${photoLimit} Ansichten</span><strong>${photos.length ? "Weiteres Foto desselben Artikels" : "Kamera oder vorhandene Bilder"}</strong></div>
      ${photoSourceActions(photos.length, photoLimit)}
      ${photos.length ? `<div class="photo-thumbnails">${photos.map((photo, index) => `<div><img src="${photo.dataUrl}" alt="Ansicht ${index + 1}" /><button data-remove-photo="${index}" type="button" title="Foto entfernen">×</button><small>${photo.quality ? `${photo.quality.score}% Bildqualität` : `Ansicht ${index + 1}`}</small></div>`).join("")}</div>` : ""}
      ${quickValueCard(state.recognition, vaultCapture)}
      ${manualFields}
      ${batchMode
        ? `<div class="batch-capture-actions">
            <button class="secondary-action" id="batch-next" type="button" ${!photos.length || state.batchAnalyzing ? "disabled" : ""}>${icon("NX")}Nächster Artikel</button>
            <button class="primary-action" id="batch-finish" type="button" ${!capturedCount || state.batchAnalyzing ? "disabled" : ""}>${icon(vaultCapture ? "SA" : "AI")}${state.batchAnalyzing ? (vaultCapture ? "Inventar wird erstellt..." : "Sammelanalyse läuft...") : (vaultCapture ? `${capturedCount} in Sammlung speichern` : `${capturedCount} Artikel analysieren`)}</button>
          </div>`
        : `<button class="primary-action mobile-primary-action" id="add-item" type="button" ${actionDisabled ? "disabled" : ""}>${icon(vaultCapture ? "SA" : "AI")}${actionLabel}</button>`}
    </div>
    <div class="ai-panel">
      ${batchMode ? batchCapturePanel() : fastRecognitionPanel(photos)}
    </div>
  </section>`;
}

function batchCapturePanel() {
  const vaultCapture = state.captureDestination === "vault";
  const progress = state.batchProgress;
  if (state.batchAnalyzing && progress) {
    const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
    return `<div class="panel-heading"><div><p>Sammelanalyse</p><h2>${progress.completed}/${progress.total} verarbeitet</h2></div>${icon("AI")}</div>
      <div class="batch-progress"><span><i style="width:${percent}%"></i></span><strong>${escapeHtml(progress.label || "Artikel werden analysiert")}</strong><small>${progress.failed} benötigen bisher eine manuelle Prüfung.</small></div>
      ${batchDraftList()}`;
  }

  return `<div class="panel-heading"><div><p>Aufnahmesession</p><h2>${state.batchDrafts.length} Artikel bereit</h2></div>${icon("ST")}</div>
    <div class="batch-explainer"><strong>${vaultCapture ? "Erst fotografieren, dann gemeinsam ins Inventar übernehmen." : "Erst fotografieren, dann gemeinsam analysieren."}</strong><p>Weitere Ansichten gehören zum aktuellen Artikel. Mit „Nächster Artikel“ beginnt das nächste Objekt.</p></div>
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
    analyzing: state.captureDestination === "vault" ? "Inventar wird erstellt" : "Strategie wird berechnet",
    completed: state.captureDestination === "vault" ? "gespeichert" : "analysiert",
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
  const vaultCapture = state.captureDestination === "vault";
  state.batchProgress = { total: entries.length, completed: 0, failed: 0, label: vaultCapture ? "Inventar wird vorbereitet" : "Sammelanalyse wird vorbereitet" };
  state.importStatus = vaultCapture
    ? `${entries.length} Sammlungsstücke werden gemeinsam ins Inventar übernommen.`
    : `${entries.length} Artikel werden gemeinsam analysiert. Du kannst das Smartphone liegen lassen.`;
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
      state.batchProgress.label = vaultCapture
        ? `Artikel ${index + 1}: Inventareintrag speichern`
        : `Artikel ${index + 1}: Preis, Kanal und Strategie`;
      render();
      let item;
      if (vaultCapture) {
        item = inventoryItemFromRecognition(state.draft, recognition);
      } else {
        try {
          item = enrichWorkflow(await analyzeWithApi());
        } catch (error) {
          item = salesItemFromRecognition(state.draft, recognition, error);
          entry.warning = "Produkt erkannt; Markt- und Strategieanalyse wird nachgeholt.";
        }
      }
      item.recognition = recognition;
      item.recognitionEvidence = recognition.evidence || null;
      if (vaultCapture) {
        item = moveItemToCollection(item, {
          barcode: state.draft.barcode || item.barcode || "",
          capturedViews: state.draft.photos?.length || 1,
          enrichment: { status: "pending", sources: [], enrichedAt: "" }
        });
      } else if (recognition.evidence?.status !== "ready_for_research") {
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
  state.view = state.captureDestination === "vault" ? "vault" : "review";
  state.importStatus = state.captureDestination === "vault"
    ? `${completedItemIds.length} Artikel zur Sammlung hinzugefügt${failedEntries.length ? ` · ${failedEntries.length} Aufnahme${failedEntries.length === 1 ? "" : "n"} erneut prüfen` : ""}.`
    : `${completedItemIds.length} Artikel analysiert${failedEntries.length ? ` · ${failedEntries.length} Aufnahme${failedEntries.length === 1 ? "" : "n"} erneut prüfen` : ""}. Preischecks laufen im Hintergrund.`;
  saveLocal();
  render();
}

function fastRecognitionPanel(photos) {
  const vaultCapture = state.captureDestination === "vault";
  if (state.recognizing) {
    return `<div class="panel-heading"><div><p>Schnellerkennung</p><h2>Produkt wird gelesen</h2></div>${icon("AI")}</div>
      <div class="recognition-running"><span class="activity-line"></span><strong>Text, Marke und Variante werden geprüft</strong><small>${photos.length} Foto${photos.length === 1 ? "" : "s"} · ${vaultCapture ? "Inventareintrag folgt" : "Preis und Strategie folgen separat"}</small></div>`;
  }

  const recognition = state.recognition;
  if (!recognition) {
    const qualityIssues = photos.flatMap((photo) => photo.quality?.issues || []);
    return `<div class="panel-heading"><div><p>Schnellerkennung</p><h2>Noch kein Produkt erkannt</h2></div>${icon("AI")}</div>
      <div class="recognition-empty"><strong>${photos.length ? "Foto bereit" : "Fotografiere zuerst den Artikel"}</strong><p>${qualityIssues.length ? escapeHtml(qualityIssues.join(" · ")) : (vaultCapture ? "RAMROD prüft Bildqualität und Identität und legt danach ein Sammlungsstück an. Ein Verkauf wird nicht gestartet." : "RAMROD prüft zuerst Bildqualität und Identität. Marktpreis und Verkaufsstrategie werden erst danach berechnet.")}</p></div>`;
  }

  const identity = recognition.identity || {};
  const evidence = recognition.evidence || {};
  const score = Number(evidence.score || 0);
  const missing = recognition.missingEvidence || [];
  const requests = recognition.requestedPhotos || [];
  const visibleText = recognition.visibleText || [];
  const visualEvidence = recognition.externalVisualEvidence;
  const learning = recognition.learningComparison;
  const statusLabel = {
    ready_for_research: "Bereit für Quellenabgleich",
    manual_review_ready: "Weiter mit manueller Prüfung",
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
    ${learning?.comparedCases ? `<section class="recognition-learning ${learning.conflicts ? "conflict" : ""}"><div><strong>Erfahrungsabgleich</strong><small>${learning.comparedCases} vergleichbare Korrektur${learning.comparedCases === 1 ? "" : "en"} · ${learning.distinctOrganizations || 0} Kundenbereiche</small></div>${learning.recommendation ? `<p>${learning.conflicts ? "Abweichender Hinweis" : "Bestätigt"}: <strong>${escapeHtml(learning.recommendation.title || "Produktvariante")}</strong>${learning.recommendation.edition ? ` · ${escapeHtml(learning.recommendation.edition)}` : ""}</p>` : ""}<span>${escapeHtml(learning.notice || "Wird nur zur Gegenprüfung genutzt und nicht automatisch übernommen.")}</span></section>` : ""}
    ${recognitionCorrectionPanel(identity)}
    ${visualEvidence?.matches?.length ? `<section class="recognition-visual-matches"><strong>Visuelle Produktsuche</strong><small>${escapeHtml(visualEvidence.provider === "serpapi-google-lens" ? "Google Lens über SerpApi" : visualEvidence.provider || "Bildsuche")} · ${visualEvidence.matches.length} Kandidaten</small><div>${visualEvidence.matches.slice(0, 3).map((entry) => `<span>${entry.exact ? "Exakt · " : ""}${escapeHtml(entry.title)}</span>`).join("")}</div></section>` : ""}
    ${visibleText.length ? `<section class="recognition-evidence"><strong>Sichtbar gelesen</strong><div>${visibleText.slice(0, 8).map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}</div></section>` : ""}
    ${missing.length ? `<section class="recognition-missing"><strong>Noch nicht belegt</strong><p>${missing.slice(0, 5).map(escapeHtml).join(" · ")}</p></section>` : ""}
    ${requests.length && evidence.status !== "manual_review_ready" ? `<section class="requested-photos"><strong>Nächstes hilfreiches Foto</strong>${requests.slice(0, 3).map((entry) => `<div>${icon("KA")}<span>${escapeHtml(entry.instruction)}</span></div>`).join("")}</section>` : ""}
    ${scanReleaseGuide(recognition)}`;
}

function recognitionCorrectionPanel(identity = {}) {
  const savedCorrection = state.draft.recognitionCorrection || {};
  const productType = String(identity.productType || identity.category || "").toLowerCase();
  const mediaType = productType.includes("film") || productType.includes("blu") || productType.includes("dvd")
    ? "film"
    : productType.includes("spiel") || productType.includes("game")
      ? "game"
      : "other";
  return `<details class="recognition-correction" ${state.draft.recognitionCorrection ? "open" : ""}>
    <summary><span><strong>Erkennung korrigieren</strong><small>Falls Titel, Format oder Edition nicht stimmen</small></span>${state.draft.recognitionCorrection ? `<em>Korrigiert</em>` : ""}</summary>
    <form data-recognition-correction-form>
      ${field("Richtiger Titel", `<input name="title" required value="${escapeHtml(identity.title || state.draft.query || "")}" />`)}
      ${field("Art", `<select name="mediaType"><option value="game" ${mediaType === "game" ? "selected" : ""}>Spiel</option><option value="film" ${mediaType === "film" ? "selected" : ""}>Film</option><option value="other" ${mediaType === "other" ? "selected" : ""}>Sonstiges</option></select>`)}
      ${field("Plattform / Format", `<input name="platform" value="${escapeHtml(identity.platform || "")}" placeholder="z. B. Switch 2, 4K UHD" />`)}
      ${field("Edition", `<input name="edition" value="${escapeHtml(identity.edition || "")}" placeholder="z. B. Download-Code, Steelbook" />`)}
      ${field("Woran erkannt?", `<textarea name="correctionNote" rows="2" placeholder="Nur sichtbare Merkmale nennen, niemals Download- oder Aktivierungscodes">${escapeHtml(savedCorrection.correctionNote || "")}</textarea>`)}
      <p>Der Hinweis wird ohne Fotos und Besitzerdaten mit ähnlichen Korrekturen verglichen. Er verändert andere Erkennungen nicht sofort.</p>
      <button class="secondary-action" type="submit">Korrektur übernehmen</button>
    </form>
  </details>`;
}

function quickValueCard(recognition, vaultCapture = false) {
  const estimate = recognition?.quickEstimate;
  const fair = Number(estimate?.fair || 0);
  if (!fair) return "";
  const low = Number(estimate.low || fair);
  const high = Number(estimate.high || fair);
  return `<section class="quick-value-card" aria-label="Erste Wertschätzung">
    <div class="quick-value-heading"><div><small>Erste Wertschätzung</small><strong>${euro(fair)}</strong></div><span>Vorläufig</span></div>
    <p>${euro(low)} bis ${euro(high)} · ${Number(estimate.confidence || 0)}% Sicherheit</p>
    <small>${escapeHtml(estimate.basis || "Bildschätzung ohne aktuelle Marktquellen.")} ${vaultCapture ? "Der Wert dient nur zur Orientierung im Inventar. Ein Verkauf wird nicht gestartet." : "Marktcheck und Plattformpreise folgen danach."}</small>
  </section>`;
}

function scanReleaseGuide(recognition) {
  const evidence = recognition.evidence || {};
  const identityReady = evidence.status === "ready_for_research";
  const manualReviewReady = evidence.status === "manual_review_ready";
  const canProceed = identityReady || manualReviewReady;
  const missing = Array.isArray(recognition.missingEvidence) ? recognition.missingEvidence.filter(Boolean) : [];
  const request = recognition.requestedPhotos?.[0]?.instruction || "Zusätzliche Kennzeichnung oder Rückseite fotografieren";
  const photoCount = state.draft.photos?.length || 0;
  const photoLimit = capturePhotoLimit();
  if (state.captureDestination === "vault") {
    return `<section class="scan-release-guide ${identityReady ? "ready" : manualReviewReady ? "manual" : "blocked"}">
      <div class="release-guide-head">
        <div><small>Nächster Schritt</small><strong>${canProceed ? "Sammlungsstück speichern" : "Identität vervollständigen"}</strong></div>
        <span>${canProceed ? "Inventar bereit" : "Foto prüfen"}</span>
      </div>
      <div class="release-guide-list">
        ${releaseGuideRow(true, "Produkt erkannt", recognition.identity?.title || "Produktkandidat erkannt")}
        ${releaseGuideRow(canProceed, identityReady ? "Bildbelege ausreichend" : manualReviewReady ? "Fotosatz abgeschlossen" : "Zusatzbeleg fehlt", canProceed ? "RAMROD kann den Inventareintrag jetzt speichern." : (missing.join(" · ") || request))}
        ${releaseGuideRow(false, "In Sammlung speichern", "Erstellt nur den Inventareintrag. Preisrecherche und Verkauf bleiben ausgeschaltet.", true)}
      </div>
      ${canProceed
        ? ""
        : `<div class="release-guide-actions">
            ${photoCount < photoLimit ? `<button class="secondary-action release-guide-action" data-capture-more type="button">${icon("KA")}Hilfreiches Foto aufnehmen</button>` : ""}
            <button class="secondary-action quiet-action release-guide-action" data-complete-photo-set type="button">${icon("OK")}Alle sinnvollen Fotos vorhanden</button>
          </div>
          <p class="manual-review-note">Du bleibst nicht hängen: Unsichere Merkmale bleiben im Inventar sichtbar. Ein Verkauf startet nicht.</p>`}
    </section>`;
  }
  return `<section class="scan-release-guide ${identityReady ? "ready" : manualReviewReady ? "manual" : "blocked"}">
    <div class="release-guide-head">
      <div><small>Nächster Schritt</small><strong>${identityReady ? "Markt und Verkaufsstrategie berechnen" : manualReviewReady ? "Marktrecherche starten, Details später prüfen" : "Identität vervollständigen"}</strong></div>
      <span>${identityReady ? "1/3 bereit" : manualReviewReady ? "Manuelle Prüfung" : "Foto prüfen"}</span>
    </div>
    <div class="release-guide-list">
      ${releaseGuideRow(true, "Produkt erkannt", recognition.identity?.title || "Produktkandidat erkannt")}
      ${releaseGuideRow(canProceed, identityReady ? "Bildbelege ausreichend" : manualReviewReady ? "Fotosatz abgeschlossen" : "Zusatzbeleg fehlt", identityReady ? "RAMROD kann mit der Marktrecherche fortfahren." : manualReviewReady ? "Nicht lesbare Merkmale werden vor der Verkaufsfreigabe einmal manuell bestätigt." : (missing.join(" · ") || request))}
      ${releaseGuideRow(false, "Preisquellen abgleichen", canProceed ? "Startet automatisch mit dem nächsten Button." : "Startet nach Foto oder bewusstem Abschluss des Fotosatzes.", true)}
      ${releaseGuideRow(false, "Pflichtangaben prüfen", "Werden nach der Analyse einzeln angezeigt und können dort direkt ergänzt werden.", true)}
    </div>
    ${canProceed
      ? `<button class="primary-action release-guide-action" data-run-next-step type="button">${icon("AI")}Preis, Kanal und Strategie ermitteln</button>`
      : `<div class="release-guide-actions">
          ${photoCount < photoLimit ? `<button class="secondary-action release-guide-action" data-capture-more type="button">${icon("KA")}Hilfreiches Foto aufnehmen</button>` : ""}
          <button class="secondary-action quiet-action release-guide-action" data-complete-photo-set type="button">${icon("OK")}Alle sinnvollen Fotos vorhanden</button>
        </div>
        <p class="manual-review-note">Du bleibst nicht hängen: Danach geht es zur Preisrecherche. Unsichere Merkmale müssen vor der Veröffentlichung bestätigt werden.</p>`}
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

  return `<div class="review-flow">${batchSummaryCard()}${mobileReviewAccordion(reviewItems)}<section class="inventory-layout review-workspace">
    <div class="inventory-list">
      <div class="panel-heading"><div><p>Freigaben</p><h2>Was braucht deine Entscheidung?</h2></div><span class="queue-count">${reviewItems.length} offen</span></div>
      ${reviewItems.map(itemRow).join("")}
    </div>
    ${active ? inspector(active) : ""}
  </section></div>`;
}

function mobileReviewAccordion(items) {
  return `<section class="mobile-review-accordion" aria-label="Offene Freigaben">
    <div class="mobile-review-heading"><div><p>Freigaben</p><h2>Alle offenen Artikel</h2></div><span>${items.length} offen</span></div>
    <div class="mobile-review-list">
      ${items.map((item) => {
        const requirements = releaseRequirements(item);
        const blockers = requirements.filter((entry) => !entry.ready);
        const expanded = state.mobileReviewItem === item.id;
        const strategy = normalizeSalesStrategy(item);
        const blockerLabel = blockers.length
          ? blockers.map((entry) => entry.label).join(" · ")
          : "Bereit für deine Freigabe";
        return `<article class="mobile-review-card ${expanded ? "expanded" : ""}">
          <button class="mobile-review-toggle" data-toggle-review-item="${item.id}" type="button" aria-expanded="${expanded}">
            <img src="${item.image}" alt="" />
            <span class="mobile-review-title"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.sku)} · ${escapeHtml(channelLabel(item.channel))} · ${euro(strategy.targetPrice || item.fair)}</small><em>${escapeHtml(blockerLabel)}</em></span>
            <span class="mobile-review-count"><strong>${blockers.length}</strong><small>${blockers.length === 1 ? "offen" : "offen"}</small><i aria-hidden="true">${expanded ? "−" : "+"}</i></span>
          </button>
          ${expanded ? `<div class="mobile-review-panel">
            <div class="mobile-review-facts">
              ${suggestion("Kategorie", escapeHtml(item.category || "Bitte prüfen"))}
              ${suggestion("Zustand", escapeHtml(item.condition || "Bitte prüfen"))}
              ${suggestion("Lieferumfang", escapeHtml(item.completeness || "Bitte prüfen"))}
            </div>
            ${itemLifecycleActions(item)}
            ${salesStrategyCard(item)}
          </div>` : ""}
        </article>`;
      }).join("")}
    </div>
  </section>`;
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
      <button class="primary-action" data-bulk-approve type="button" ${ready.length && can("sales:approve") ? "" : "disabled"}>${icon("OK")}${!can("sales:approve") ? "Admin-Freigabe erforderlich" : ready.length ? `${ready.length} sichere Artikel freigeben` : waiting.length ? "Marktchecks laufen" : "Keine Sammelfreigabe möglich"}</button>
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
    <div class="inventory-list"><div class="panel-heading"><div><p>Bestand</p><h2>Artikelkarten</h2></div><div class="panel-actions"><button class="icon-button" data-view="archive" title="Archiv öffnen">${icon("AR")}</button><button class="icon-button" data-view="scan" title="Artikel hinzufügen">${icon("PL")}</button></div></div>${filtered.map(itemRow).join("")}</div>
    ${active ? inspector(active) : `<section class="empty-state compact-empty"><h2>Kein Treffer</h2><p>Ändere Suche oder Lagerfilter, um wieder Artikel zu sehen.</p></section>`}
  </section>`;
}

function vaultView() {
  const ownItems = collectionItems();
  const sharedItems = state.collectionNetwork.sharedItems || [];
  const sharedScope = state.vaultScope === "shared";
  const allItems = sharedScope ? sharedItems : ownItems;
  const query = state.search.trim().toLowerCase();
  const filtered = allItems.filter((item) => {
    const status = collectionStatus(item);
    const matchesFilter = state.vaultFilter === "all"
      || status === state.vaultFilter
      || (state.vaultFilter === "selling" && status === "listed");
    const matchesQuery = !query || [item.title, item.sku, item.category, item.franchise, item.collection?.platform, item.collection?.edition, item.collection?.location, item.collection?.borrowerName, item.sharedAccess?.ownerName]
      .filter(Boolean).join(" ").toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });
  const selected = filtered.find((item) => item.id === state.vaultSelected)
    || allItems.find((item) => item.id === state.vaultSelected)
    || filtered[0]
    || allItems[0];
  if (selected && selected.id !== state.vaultSelected) state.vaultSelected = selected.id;
  const owned = allItems.filter((item) => collectionStatus(item) === "owned").length;
  const loaned = allItems.filter((item) => collectionStatus(item) === "loaned").length;
  const selling = allItems.filter((item) => ["selling", "listed"].includes(collectionStatus(item))).length;
  const totalValue = allItems.filter((item) => collectionStatus(item) !== "sold").reduce((sum, item) => sum + Number(item.collection?.estimatedValue || item.fair || 0), 0);
  const importable = state.items.filter((item) => !isArchived(item) && !item.collection).slice(0, 8);

  return `<section class="vault-shell">
    <header class="vault-hero">
      <div><p>RAMROD VAULT</p><h2>${sharedScope ? "Freigegebene Sammlungen" : "Deine Spiele- und Filmsammlung"}</h2><span>${sharedScope ? "Du siehst nur die Bereiche, die andere Personen ausdrücklich mit dir geteilt haben." : "Inventar, Leihstatus und Wert an einem Ort. Verkauft wird erst nach deinem Klick."}</span></div>
      ${sharedScope ? "" : `<div class="vault-hero-actions">
        <button class="secondary-action" data-vault-new type="button">${icon("NE")}Manuell hinzufügen</button>
        <button class="secondary-action" data-vault-upload type="button">${icon("UP")}Bilder auswählen</button>
        <button class="primary-action" data-vault-scan type="button">${icon("KA")}Kamera öffnen</button>
      </div>`}
    </header>
    ${sharedScope ? "" : `<input class="photo-source-input" id="vault-start-upload" accept="image/*" type="file" multiple />`}
    <nav class="vault-scope-tabs" aria-label="Sammlungsbereich">
      <button class="${sharedScope ? "" : "active"}" data-vault-scope="mine" type="button">${icon("SA")}Meine Sammlung <span>${ownItems.length}</span></button>
      <button class="${sharedScope ? "active" : ""}" data-vault-scope="shared" type="button">${icon("FR")}Mit mir geteilt <span>${sharedItems.length}</span></button>
    </nav>
    <section class="vault-metrics" aria-label="Sammlungsübersicht">
      ${vaultMetric("SA", "In Sammlung", owned)}
      ${vaultMetric("VL", "Verliehen", loaned)}
      ${vaultMetric("VK", "Im Verkauf", selling)}
      ${vaultMetric("EU", "Sammlungswert", euro(totalValue))}
    </section>
    ${sharedScope ? "" : (state.vaultFormOpen ? vaultEntryForm() : "")}
    ${collectionNetworkPanel()}
    <section class="vault-toolbar">
      <label class="vault-search">${icon("SU")}<input id="vault-search" value="${escapeHtml(state.search)}" placeholder="Titel, Plattform, Person oder Lagerort" /></label>
      <div class="vault-filters" role="group" aria-label="Sammlung filtern">
        ${vaultFilterButton("all", "Alle", allItems.length)}
        ${vaultFilterButton("owned", "Da", owned)}
        ${vaultFilterButton("loaned", "Verliehen", loaned)}
        ${vaultFilterButton("selling", "Verkauf", selling)}
      </div>
    </section>
    ${allItems.length ? `<section class="vault-layout">
      <div class="vault-list">${filtered.length ? filtered.map((item) => sharedScope ? sharedVaultItemRow(item) : vaultItemRow(item)).join("") : `<div class="vault-empty compact"><strong>Kein Treffer</strong><span>Ändere Suche oder Filter.</span></div>`}</div>
      ${selected ? (sharedScope ? sharedVaultInspector(selected) : vaultInspector(selected)) : ""}
    </section>` : (sharedScope ? sharedVaultEmptyState() : vaultEmptyState(importable))}
    ${!sharedScope && allItems.length && importable.length ? vaultImportStrip(importable) : ""}
  </section>`;
}

function collectionNetworkPanel() {
  const network = state.collectionNetwork;
  if (!network.available) {
    return network.message ? `<p class="vault-network-note">${escapeHtml(network.message)}</p>` : "";
  }
  const activeShares = network.ownedShares.filter((entry) => entry.status === "active");
  const incoming = network.incomingAccessRequests.filter((entry) => entry.status === "requested");
  const outgoing = network.outgoingAccessRequests.filter((entry) => entry.status === "requested");
  const ownerLoans = network.ownerLoanRequests.filter((entry) => ["requested", "loaned"].includes(entry.status));
  const myLoans = network.requesterLoanRequests.filter((entry) => ["requested", "loaned"].includes(entry.status));
  const attention = incoming.length + ownerLoans.filter((entry) => entry.status === "requested").length;
  return `<details class="vault-network" ${attention ? "open" : ""}>
    <summary><span><strong>Freigaben & Ausleihen</strong><small>${attention ? `${attention} Anfrage${attention === 1 ? "" : "n"} wartet auf dich` : "Privat und von dir steuerbar"}</small></span><em>${attention || activeShares.length + network.receivedShares.length}</em></summary>
    <div class="vault-network-grid">
      <section class="vault-network-section"><div><small>Sammlung teilen</small><strong>Bereiche gezielt freigeben</strong></div>
        <form data-collection-share-form class="vault-share-form">
          ${field("RAMROD-Konto", `<input name="email" type="email" required placeholder="name@example.com" />`)}
          ${collectionScopeFields()}
          <button class="primary-action" type="submit" ${state.vaultNetworkBusy ? "disabled" : ""}>${icon("FR")}Freigeben</button>
        </form>
        ${activeShares.length ? `<div class="vault-network-list">${activeShares.map((share) => `<article class="vault-share-row"><span><strong>${escapeHtml(share.recipientEmail)}</strong><small>${escapeHtml(collectionScopeLabel(share.scope))}</small></span><button class="secondary-action" data-collection-share-revoke="${share.id}" type="button">Beenden</button></article>`).join("")}</div>` : `<p class="vault-network-empty">Noch keine aktive Freigabe.</p>`}
      </section>
      <section class="vault-network-section"><div><small>Zugriff anfragen</small><strong>Sammlung einer anderen Person</strong></div>
        <form data-collection-access-request-form class="vault-access-form">
          ${field("E-Mail des Eigentümers", `<input name="ownerEmail" type="email" required placeholder="name@example.com" />`)}
          ${field("Nachricht", `<input name="message" placeholder="Welche Sammlung möchtest du sehen?" />`)}
          <button class="secondary-action" type="submit" ${state.vaultNetworkBusy ? "disabled" : ""}>Anfrage senden</button>
        </form>
        ${outgoing.length ? `<div class="vault-network-list">${outgoing.map((entry) => `<article class="vault-request-row"><span><strong>Anfrage gesendet</strong><small>${formatShortDate(entry.created_at)}</small></span><button class="secondary-action" data-collection-access-action="cancel" data-request-id="${entry.id}" type="button">Zurückziehen</button></article>`).join("")}</div>` : ""}
      </section>
      ${incoming.length ? `<section class="vault-network-section wide"><div><small>Zugriffsanfragen</small><strong>Du entscheidest Umfang und Altersfreigaben</strong></div><div class="vault-network-list">${incoming.map(collectionAccessRequestRow).join("")}</div></section>` : ""}
      ${(ownerLoans.length || myLoans.length) ? `<section class="vault-network-section wide"><div><small>Ausleihen</small><strong>Anfragen und laufende Leihen</strong></div><div class="vault-network-list">${ownerLoans.map((entry) => collectionLoanRequestRow(entry, true)).join("")}${myLoans.map((entry) => collectionLoanRequestRow(entry, false)).join("")}</div></section>` : ""}
    </div>
  </details>`;
}

function collectionScopeFields() {
  return `<fieldset class="vault-scope-fields"><legend>Sichtbarer Bereich</legend><label><input name="mediaTypes" value="film" type="checkbox" checked /> Filme</label><label><input name="mediaTypes" value="game" type="checkbox" checked /> Spiele</label><label><input name="mediaTypes" value="other" type="checkbox" /> Sonstiges</label><label><input name="hideFsk18" value="true" type="checkbox" checked /> FSK 18 ausblenden</label><label><input name="allowLoans" value="true" type="checkbox" checked /> Ausleihanfragen erlauben</label></fieldset>`;
}

function collectionScopeFromForm(form) {
  const formData = new FormData(form);
  return {
    mediaTypes: formData.getAll("mediaTypes"),
    hiddenAgeRatings: formData.get("hideFsk18") ? ["FSK 18"] : [],
    hiddenItemIds: [],
    allowLoans: Boolean(formData.get("allowLoans"))
  };
}

function collectionScopeLabel(scope = {}) {
  const labels = { film: "Filme", game: "Spiele", other: "Sonstiges" };
  const media = (scope.mediaTypes || []).map((entry) => labels[entry] || entry).join(", ") || "Keine Bereiche";
  return `${media}${(scope.hiddenAgeRatings || []).includes("FSK 18") ? " · ohne FSK 18" : ""}${scope.allowLoans === false ? " · nur ansehen" : " · Ausleihe möglich"}`;
}

function collectionAccessRequestRow(entry) {
  return `<form class="vault-request-row approval" data-collection-access-approve="${entry.id}"><span><strong>${escapeHtml(entry.requester_name || entry.requester_email)}</strong><small>${escapeHtml(entry.message || "Möchte deine Sammlung sehen")}</small></span>${collectionScopeFields()}<div><button class="secondary-action" data-collection-access-action="decline" data-request-id="${entry.id}" type="button">Ablehnen</button><button class="primary-action" type="submit">Bereich freigeben</button></div></form>`;
}

function loanItemLabel(entry) {
  const own = state.items.find((item) => item.dbId === entry.item_id || item.id === entry.item_id);
  const shared = (state.collectionNetwork.sharedItems || []).find((item) => item.dbId === entry.item_id || item.id === entry.item_id);
  return own?.title || shared?.title || "Sammlungsstück";
}

function collectionLoanRequestRow(entry, ownerView) {
  const requested = entry.status === "requested";
  const loaned = entry.status === "loaned";
  return `<article class="vault-request-row"><span><strong>${escapeHtml(loanItemLabel(entry))}</strong><small>${ownerView ? `${escapeHtml(entry.requester_name || entry.requester_email)} · ` : ""}${requested ? "Ausleihe angefragt" : "Aktuell verliehen"}${entry.due_at ? ` · bis ${formatShortDate(entry.due_at)}` : ""}</small></span><div>${ownerView && requested ? `<button class="secondary-action" data-collection-loan-action="decline" data-request-id="${entry.id}" type="button">Ablehnen</button><button class="primary-action" data-collection-loan-action="approve" data-request-id="${entry.id}" type="button">Ausleihen</button>` : ownerView && loaned ? `<button class="primary-action" data-collection-loan-action="return" data-request-id="${entry.id}" type="button">Rückgabe bestätigen</button>` : requested ? `<button class="secondary-action" data-collection-loan-action="cancel" data-request-id="${entry.id}" type="button">Zurückziehen</button>` : ""}</div></article>`;
}

function sharedVaultEmptyState() {
  return `<section class="vault-empty compact"><strong>Noch keine Sammlung mit dir geteilt</strong><span>Sende oben eine Zugriffsanfrage. Der Eigentümer entscheidet anschließend über Bereiche, FSK 18 und Ausleihen.</span></section>`;
}

function sharedVaultItemRow(item) {
  const status = collectionStatus(item);
  return `<button class="vault-item-row ${state.vaultSelected === item.id ? "active" : ""}" data-vault-select="${item.id}" type="button"><img src="${escapeHtml(item.image)}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.sharedAccess?.ownerName || "Geteilte Sammlung")} · ${escapeHtml(item.collection?.platform || item.category || "Medium")}</small></span><span class="vault-row-meta"><em class="vault-status ${status}">${escapeHtml(collectionStatusLabel(item))}</em></span></button>`;
}

function sharedVaultInspector(item) {
  const collection = item.collection || {};
  const status = collectionStatus(item);
  const existingRequest = (state.collectionNetwork.requesterLoanRequests || []).find((entry) => entry.item_id === item.dbId && ["requested", "loaned"].includes(entry.status));
  return `<article class="vault-inspector shared"><div class="vault-inspector-media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" /><span class="vault-status ${status}">${escapeHtml(collectionStatusLabel(item))}</span></div><div class="vault-inspector-content"><div><p>${escapeHtml(item.sharedAccess?.ownerName || "Geteilte Sammlung")}</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml([collection.platform, collection.edition].filter(Boolean).join(" · ") || item.category || "Sammlungsstück")}</span></div><dl class="vault-facts"><div><dt>Wert</dt><dd>${euro(collection.estimatedValue || item.fair || 0)}</dd></div><div><dt>Zustand</dt><dd>${escapeHtml(item.condition || "Nicht erfasst")}</dd></div><div><dt>Altersfreigabe</dt><dd>${escapeHtml(collection.ageRating || "Nicht erfasst")}</dd></div><div><dt>Jahr</dt><dd>${escapeHtml(collection.releaseYear || "Nicht erfasst")}</dd></div></dl>${collection.summary ? `<p class="vault-shared-summary">${escapeHtml(collection.summary)}</p>` : ""}${state.vaultLoanItem === item.id ? `<form class="vault-loan-form" data-shared-loan-form="${item.id}">${field("Nachricht", `<input name="note" placeholder="Optional" />`)}${field("Rückgabe geplant", `<input name="dueAt" type="date" />`)}<button class="primary-action" type="submit">Ausleihe anfragen</button></form>` : ""}<div class="vault-actions">${existingRequest ? `<span class="vault-request-state">${existingRequest.status === "loaned" ? "An dich verliehen" : "Anfrage gesendet"}</span>` : item.sharedAccess?.allowLoans && status === "owned" ? `<button class="primary-action" data-shared-loan="${item.id}" type="button">${icon("VL")}Ausleihe anfragen</button>` : `<span class="vault-request-state">Nur Ansicht</span>`}</div><p class="vault-safety-note">Du siehst nur freigegebene Sammlungsdaten. Private Notizen, Kontakte und ausgeblendete Titel bleiben geschützt.</p></div></article>`;
}

function vaultMetric(iconLabel, label, value) {
  return `<div class="vault-metric">${icon(iconLabel)}<span><strong>${value}</strong><small>${label}</small></span></div>`;
}

function vaultFilterButton(id, label, count) {
  return `<button class="${state.vaultFilter === id ? "active" : ""}" data-vault-filter="${id}" type="button">${escapeHtml(label)} <span>${count}</span></button>`;
}

function vaultEntryForm() {
  const defaultLocation = boxes[0]?.location || boxes[0]?.id || "";
  return `<form class="vault-entry-form" id="vault-entry-form">
    <div class="panel-heading"><div><p>Neues Exemplar</p><h3>Zur Sammlung hinzufügen</h3></div><button class="icon-button" data-vault-close-form type="button" title="Schließen">×</button></div>
    <div class="vault-form-grid">
      ${field("Titel", `<input name="title" required placeholder="z. B. The Legend of Zelda: Wind Waker" />`)}
      ${field("Art", `<select name="mediaType"><option value="game">Spiel</option><option value="film">Film</option><option value="other">Sonstiges</option></select>`)}
      ${field("Plattform / Format", `<input name="platform" placeholder="z. B. GameCube, PS3, Blu-ray" />`)}
      ${field("Edition", `<input name="edition" placeholder="Standard, Steelbook, Collector's Edition" />`)}
      ${field("Barcode", `<input name="barcode" inputmode="numeric" placeholder="EAN / UPC" />`)}
      ${field("Standort", `<input name="location" value="${escapeHtml(defaultLocation)}" placeholder="Regal, Raum oder Kiste" />`)}
      ${field("Zustand", `<select name="condition">${["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"].map((value) => `<option>${value}</option>`).join("")}</select>`)}
      ${field("Geschätzter Wert", `<div class="input-with-icon">${icon("EU")}<input name="estimatedValue" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" /></div>`)}
    </div>
    <div class="vault-form-actions"><button class="secondary-action" data-vault-close-form type="button">Abbrechen</button><button class="primary-action" type="submit" ${state.vaultBusy ? "disabled" : ""}>${icon("SA")}${state.vaultBusy === "create" ? "Wird gespeichert..." : "Exemplar speichern"}</button></div>
  </form>`;
}

function vaultEmptyState(importable) {
  return `<section class="vault-empty">
    <span>${icon("SA")}</span><div><p>Dein Vault ist bereit</p><h3>Beginne mit dem ersten Spiel oder Film</h3><small>Fotografiere den Artikel oder übernimm vorhandene RAMROD-Datensätze. Nichts wird automatisch angeboten.</small></div>
    <div class="vault-empty-actions"><button class="primary-action" data-vault-scan type="button">${icon("KA")}Kamera öffnen</button><button class="secondary-action" data-vault-upload type="button">${icon("UP")}Bilder auswählen</button><button class="secondary-action" data-vault-new type="button">Manuell erfassen</button></div>
  </section>${importable.length ? vaultImportStrip(importable) : ""}`;
}

function vaultImportStrip(items) {
  return `<details class="vault-import-strip"><summary>Vorhandene RAMROD-Artikel in die Sammlung übernehmen <span>${items.length}</span></summary><div>${items.map((item) => `<article><img src="${escapeHtml(item.image)}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.sku)} · ${euro(item.fair)}</small></span><button class="secondary-action" data-vault-import="${item.id}" type="button">Übernehmen</button></article>`).join("")}</div></details>`;
}

function vaultItemRow(item) {
  const collection = collectionDefaults(item);
  const status = collectionStatus(item);
  const subtitle = status === "loaned"
    ? `Bei ${collection.borrowerName || "unbekannt"}${collection.dueAt ? ` · bis ${formatShortDate(collection.dueAt)}` : ""}`
    : `${collection.platform || item.category || "Ohne Plattform"}${collection.location ? ` · ${collection.location}` : ""}`;
  return `<button class="vault-item-row ${state.vaultSelected === item.id ? "active" : ""}" data-vault-select="${item.id}" type="button">
    <img src="${escapeHtml(item.image)}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(subtitle)}</small></span>
    <span class="vault-row-meta"><em class="vault-status ${status}">${escapeHtml(collectionStatusLabel(item))}</em><strong>${euro(collection.estimatedValue || item.fair || 0)}</strong></span>
  </button>`;
}

function vaultEnrichmentStatus(collection) {
  const status = collection.enrichment?.status || "pending";
  const labels = {
    pending: ["Metadaten ausstehend", "Genres, Stimmung, Mitwirkende und Reviews werden später ergänzt."],
    queued: ["Anreicherung eingeplant", "Der Hintergrunddienst übernimmt diesen Titel als Nächstes."],
    running: ["Metadaten werden ergänzt", "Du kannst RAMROD währenddessen weiter benutzen."],
    complete: ["Medienwissen vollständig", "Der Titel kann für Suche, Empfehlungen und Zusammenstellungen verwendet werden."],
    failed: ["Anreicherung prüfen", "Der Inventareintrag bleibt erhalten; nur die Zusatzinformationen fehlen."]
  };
  const [label, description] = labels[status] || labels.pending;
  return `<section class="vault-enrichment ${escapeHtml(status)}"><span>${icon(status === "complete" ? "OK" : "AI")}</span><div><small>Medienwissen</small><strong>${escapeHtml(label)}</strong><p>${escapeHtml(description)}</p></div></section>`;
}

function vaultInspector(item) {
  const collection = collectionDefaults(item);
  const status = collectionStatus(item);
  return `<article class="vault-inspector">
    <div class="vault-inspector-media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" /><span class="vault-status ${status}">${escapeHtml(collectionStatusLabel(item))}</span></div>
    <div class="vault-inspector-content">
      <div><p>${escapeHtml(item.sku)}</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml([collection.platform, collection.edition].filter(Boolean).join(" · ") || item.category || "Sammlungsstück")}</span></div>
      ${state.vaultEditingItem === item.id ? vaultEditForm(item) : `<dl class="vault-facts">
        <div><dt>Wert</dt><dd>${euro(collection.estimatedValue || item.fair || 0)}</dd></div>
        <div><dt>Zustand</dt><dd>${escapeHtml(item.condition || "Nicht erfasst")}</dd></div>
        <div><dt>Standort</dt><dd>${escapeHtml(collection.location || "Nicht zugeordnet")}</dd></div>
        <div><dt>Barcode</dt><dd>${escapeHtml(collection.barcode || "Nicht erfasst")}</dd></div>
      </dl>`}
      ${vaultEnrichmentStatus(collection)}
      ${status === "loaned" ? `<section class="vault-loan-summary"><span>${icon("VL")}</span><div><small>Verliehen an</small><strong>${escapeHtml(collection.borrowerName || "Unbekannt")}</strong><p>${collection.loanedAt ? `Seit ${formatShortDate(collection.loanedAt)}` : ""}${collection.dueAt ? ` · Rückgabe ${formatShortDate(collection.dueAt)}` : ""}</p></div></section>` : ""}
      ${state.vaultLoanItem === item.id ? vaultLoanForm(item) : ""}
      <div class="vault-actions">${vaultActions(item)}</div>
      <p class="vault-safety-note">${status === "owned" ? "Dieses Exemplar ist nur inventarisiert und auf keinem Verkaufskanal sichtbar." : status === "loaned" ? "Verliehene Exemplare sind für den Verkauf gesperrt." : "RAMROD führt dieses Exemplar weiter im Verkaufsprozess; sein Sammlungsstatus bleibt sichtbar."}</p>
    </div>
  </article>`;
}

function vaultEditForm(item) {
  const collection = collectionDefaults(item);
  const mediaType = collection.mediaType || inferMediaType(item);
  const conditions = ["Pruefen", "Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"];
  return `<form class="vault-edit-form" data-vault-edit-form="${item.id}">
    <div class="vault-form-grid">
      ${field("Titel", `<input name="title" required value="${escapeHtml(item.title)}" />`)}
      ${field("Art", `<select name="mediaType"><option value="game" ${mediaType === "game" ? "selected" : ""}>Spiel</option><option value="film" ${mediaType === "film" ? "selected" : ""}>Film</option><option value="other" ${mediaType === "other" ? "selected" : ""}>Sonstiges</option></select>`)}
      ${field("Plattform / Format", `<input name="platform" value="${escapeHtml(collection.platform)}" placeholder="z. B. 4K UHD, Blu-ray, PS3" />`)}
      ${field("Edition", `<input name="edition" value="${escapeHtml(collection.edition)}" placeholder="Steelbook, Collector's Edition" />`)}
      ${field("Barcode", `<input name="barcode" inputmode="numeric" value="${escapeHtml(collection.barcode)}" />`)}
      ${field("Standort", `<input name="location" value="${escapeHtml(collection.location)}" />`)}
      ${field("Zustand", `<select name="condition">${conditions.map((value) => `<option value="${value}" ${value === item.condition ? "selected" : ""}>${value === "Pruefen" ? "Noch prüfen" : value}</option>`).join("")}</select>`)}
      ${field("Geschätzter Wert", `<div class="input-with-icon">${icon("EU")}<input name="estimatedValue" type="number" min="0" step="0.01" value="${Number(collection.estimatedValue || item.fair || 0)}" /></div>`)}
      ${field("Korrekturhinweis", `<textarea name="correctionNote" rows="2" placeholder="Woran ist die richtige Version zu erkennen? z. B. Steelbook-Schriftzug, Plattformlogo oder Rückseitentext"></textarea>`)}
    </div>
    <p class="vault-learning-note">RAMROD vergleicht diese Korrektur anonymisiert mit ähnlichen Fällen aus anderen Kundenbereichen. Erst mehrfach bestätigte Muster werden als Gegenprüfung genutzt; Zustand und Vollständigkeit bleiben immer artikelspezifisch.</p>
    <div class="vault-form-actions"><button class="secondary-action" data-vault-edit-cancel type="button">Abbrechen</button><button class="primary-action" type="submit" ${state.vaultBusy ? "disabled" : ""}>${icon("OK")}Änderungen speichern</button></div>
  </form>`;
}

function vaultActions(item) {
  const status = collectionStatus(item);
  if (status === "loaned") {
    return `<button class="primary-action" data-vault-return="${item.id}" type="button" ${state.vaultBusy ? "disabled" : ""}>${icon("RS")}Rückgabe bestätigen</button>`;
  }
  if (["selling", "listed"].includes(status)) {
    return `<button class="primary-action" data-vault-open-sale="${item.id}" type="button">${icon("VK")}Verkaufsstatus öffnen</button>${status === "selling" ? `<button class="secondary-action" data-vault-cancel-sale="${item.id}" type="button" ${state.vaultBusy ? "disabled" : ""}>Im Vault behalten</button>` : ""}`;
  }
  if (status === "sold") return `<button class="secondary-action" data-view="shipping" type="button">${icon("VS")}Verkauf ansehen</button>`;
  if (state.vaultLoanItem === item.id) {
    return `<button class="secondary-action" data-vault-loan="${item.id}" type="button">Ausleihe abbrechen</button>`;
  }
  if (state.vaultConfirmSaleItem === item.id) {
    return `<section class="vault-sale-confirm"><div><strong>An RAMROD übergeben?</strong><span>Preis, Kanal und Strategie werden neu geprüft. Es wird noch nichts veröffentlicht.</span></div><div><button class="secondary-action" data-vault-sale-abort="${item.id}" type="button">Abbrechen</button><button class="primary-action" data-vault-sale-confirm="${item.id}" type="button">Jetzt übergeben</button></div></section>`;
  }
  return `<button class="secondary-action" data-vault-edit="${item.id}" type="button">${icon("BE")}Bearbeiten</button><button class="secondary-action" data-vault-reidentify="${item.id}" type="button">${icon("VS")}Neu identifizieren</button><button class="secondary-action" data-vault-loan="${item.id}" type="button">${icon("VL")}Verleihen</button><button class="secondary-action" data-archive-item="${item.id}" type="button">${icon("AR")}Archivieren</button><button class="primary-action" data-vault-sell="${item.id}" type="button" ${state.vaultBusy || !can("inventory:write") ? "disabled" : ""}>${icon("VK")}Über RAMROD verkaufen</button>`;
}

function vaultLoanForm(item) {
  return `<form class="vault-loan-form" data-vault-loan-form="${item.id}">
    ${field("Verliehen an", `<input name="borrowerName" required placeholder="Name" />`)}
    ${field("Kontakt", `<input name="borrowerContact" placeholder="Telefon oder E-Mail, optional" />`)}
    ${field("Rückgabe geplant", `<input name="dueAt" type="date" />`)}
    <button class="primary-action" type="submit" ${state.vaultBusy ? "disabled" : ""}>Ausleihe speichern</button>
  </form>`;
}

function formatShortDate(value) {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) || !value ? "unbekannt" : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
}

function archiveView() {
  const needle = state.search.toLowerCase();
  const items = archivedItems().filter((item) => [item.title, item.sku, item.category, item.boxId, item.archiveReason].join(" ").toLowerCase().includes(needle));
  return `<section class="archive-view">
    <div class="panel-heading"><div><p>Artikelverwaltung</p><h2>Archivierte Artikel</h2></div><span class="queue-count">${items.length}</span></div>
    <p class="archive-intro">Archivierte Artikel sind aus Freigabe, Verkauf, Bestand und Versand entfernt. Alle Daten bleiben erhalten und können wiederhergestellt werden.</p>
    ${items.length ? `<div class="archive-list">${items.map(archivedItemRow).join("")}</div>` : `<div class="empty-state compact-empty"><h2>Archiv ist leer</h2><p>Artikel, die du nicht mehr verkaufen möchtest, erscheinen später hier.</p><button class="secondary-action inline-action" data-view="inventory" type="button">${icon("DB")}Zum Bestand</button></div>`}
  </section>`;
}

function archivedItemRow(item) {
  return `<article class="archive-row">
    <img src="${item.image}" alt="" />
    <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.sku)} · ${escapeHtml(item.boxId || "Ohne Kiste")}</span><small>${escapeHtml(item.archiveReason || "Nicht mehr für den Verkauf vorgesehen")} · ${formatArchiveDate(item.archivedAt)}</small></div>
    <button class="secondary-action" data-restore-item="${item.id}" type="button">${icon("RS")}Wiederherstellen</button>
  </article>`;
}

function formatArchiveDate(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime()) || !value) return "Zeitpunkt unbekannt";
  return `Archiviert am ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
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
      ${itemNextStepCard(item)}
      <div class="source-strip">${sourceBadge(item)}</div>
      ${salesStrategyCard(item)}
      <button class="mobile-details-toggle" data-toggle-item-details="${item.id}" type="button">${state.mobileDetailsItem === item.id ? "Weniger Details" : "Preisquellen, Zustand und Alternativen"}<span aria-hidden="true">${state.mobileDetailsItem === item.id ? "−" : "+"}</span></button>
      <div class="item-secondary-details ${state.mobileDetailsItem === item.id ? "expanded" : ""}">
        <div class="price-grid">${suggestion("Minimum", euro(item.low))}${suggestion("Marktwert", euro(item.fair))}${suggestion("Optimistisch", euro(item.aggressive))}${suggestion("Erkennung", `${item.confidence}%`)}</div>
        <div class="draft-actions">
          <button class="secondary-action" data-price-check="${item.id}" type="button">${icon("EU")}${state.priceChecking === item.id ? "Prüfe..." : "Preise checken"}</button>
          <button class="secondary-action" data-ebay-draft="${item.id}" type="button">${icon("EB")}${state.ebayDrafting === item.id ? "Optimiere..." : "eBay-Vorschau"}</button>
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
      ${itemLifecycleActions(item)}
    </div>
  </div>`;
}

function itemNextStepCard(item) {
  const approved = item.approval?.status === "approved";
  const blocker = releaseRequirements(item).find((entry) => !entry.ready);
  const prepared = item.ebayListing?.status === "prepared";
  const active = item.ebayListing?.status === "active" || item.stage === "Gelistet";
  const draftReady = item.ebayDraft?.status === "ready_for_ebay"
    && (item.ebayDraft.readiness || []).every((entry) => entry.ready);

  if (active) {
    return `<section class="item-next-step complete"><div><small>Aktueller Status</small><strong>Der Artikel ist bei eBay live</strong><span>RAMROD überwacht als Nächstes Verkauf und Versand.</span></div>${item.ebayListing?.url ? `<a class="primary-action" href="${escapeHtml(item.ebayListing.url)}" target="_blank" rel="noreferrer">${icon("EB")}Auf eBay ansehen</a>` : `<button class="secondary-action" data-view="sell" type="button">${icon("VK")}Verkaufsstatus</button>`}</section>`;
  }

  if (!approved) {
    if (blocker?.id === "sources") {
      return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>Marktpreis prüfen</strong><span>Danach kann RAMROD den Verkauf freigeben.</span></div><button class="primary-action" data-price-check="${item.id}" type="button" ${state.priceChecking ? "disabled" : ""}>${icon("EU")}${state.priceChecking === item.id ? "Preise werden geprüft..." : "Preise jetzt prüfen"}</button></section>`;
    }
    if (blocker?.id === "required") {
      return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>Fehlende Artikelangaben ergänzen</strong><span>RAMROD markiert die Felder direkt für dich.</span></div><button class="primary-action" data-focus-release-fields type="button">${icon("OK")}Angaben öffnen</button></section>`;
    }
    if (blocker?.id === "channel") {
      return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>Verkaufskanal bestätigen</strong><span>Wähle den empfohlenen oder einen anderen Kanal.</span></div><button class="primary-action" data-focus-channel-picker type="button">${icon("RT")}Kanal auswählen</button></section>`;
    }
    return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>Verkauf freigeben</strong><span>Danach bereitet RAMROD den gewählten Kanal vor.</span></div><button class="primary-action" data-approve-sale="${item.id}" type="button" ${blocker || state.approving || !can("sales:approve") ? "disabled" : ""}>${icon("GO")}${state.approving === item.id ? "Wird freigegeben..." : "Verkauf freigeben"}</button></section>`;
  }

  if (item.channel === "eBay") {
    const auction = ebaySaleModeFor(item) === "auction_1_euro";
    if (prepared) {
      return `<section class="item-next-step ebay"><div><small>Nächster Schritt</small><strong>${auction ? "eBay-Auktion ab 1 € veröffentlichen" : "eBay-Angebot veröffentlichen"}</strong><span>Der Entwurf ist geprüft, aber noch nicht sichtbar.</span></div><button class="primary-action danger-confirm" data-ebay-publish="${item.id}" type="button" ${state.ebayPublishing ? "disabled" : ""}>${icon("GO")}${state.ebayPublishing === item.id ? "Wird veröffentlicht..." : "Jetzt bei eBay veröffentlichen"}</button></section>`;
    }
    if (!item.ebayDraft) {
      return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>eBay-Angebot erstellen</strong><span>RAMROD erzeugt Titel, Beschreibung und Verkaufsregeln.</span></div><button class="primary-action" data-ebay-draft="${item.id}" type="button" ${state.ebayDrafting ? "disabled" : ""}>${icon("AI")}${state.ebayDrafting === item.id ? "Wird erstellt..." : "eBay-Vorschau erstellen"}</button></section>`;
    }
    if (!draftReady) {
      return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>eBay-Angaben vervollständigen</strong><span>Die Vorschau zeigt dir, was noch fehlt.</span></div><button class="primary-action" data-focus-ebay-card type="button">${icon("EB")}eBay-Angaben öffnen</button></section>`;
    }
    return `<section class="item-next-step ebay"><div><small>Nächster Schritt</small><strong>${auction ? "Auktion ab 1 € bei eBay vorbereiten" : "Unveröffentlichten eBay-Entwurf anlegen"}</strong><span>Fotos und Daten werden geprüft zu eBay übertragen. Noch kein Verkauf.</span></div><button class="primary-action" data-ebay-prepare="${item.id}" type="button" ${state.ebayPreparing ? "disabled" : ""}>${icon("EB")}${state.ebayPreparing === item.id ? "Wird vorbereitet..." : "Bei eBay vorbereiten"}</button></section>`;
  }

  return `<section class="item-next-step"><div><small>Nächster Schritt</small><strong>Verkaufsplan ausführen</strong><span>Öffne die Übersicht für ${escapeHtml(channelLabel(item.channel))}.</span></div><button class="primary-action" data-view="sell" type="button">${icon("VK")}Zu den Verkäufen</button></section>`;
}

function itemLifecycleActions(item) {
  return `<section class="item-lifecycle-actions">
    <div><small>Artikelverwaltung</small><strong>Nicht mehr verkaufen?</strong><p>Der Artikel verschwindet aus allen Arbeitslisten, bleibt aber vollständig im Archiv erhalten.</p></div>
    <button class="secondary-action" data-archive-item="${item.id}" type="button">${icon("AR")}Archivieren</button>
  </section>`;
}

function salesStrategyCard(item) {
  const strategy = normalizeSalesStrategy(item);
  const repair = strategy.repairDecision;
  const approved = item.approval?.status === "approved";
  const requirements = releaseRequirements(item);
  const blockers = requirements.filter((entry) => !entry.ready);
  const pricePending = ["queued", "running"].includes(item.automationJob?.status) && !item.priceCheck;
  const disabled = !approved && (blockers.length > 0 || Boolean(state.approving) || !can("sales:approve"));
  const approvalLabel = approved
    ? "Verkauf freigegeben"
    : !can("sales:approve")
      ? "Wartet auf Admin-Freigabe"
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
    ${item.channel === "eBay" ? ebaySaleModeCard(item, strategy) : ""}
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

function ebaySaleModeFor(item) {
  return item.ebaySaleMode === "auction_1_euro" ? "auction_1_euro" : "fixed_price";
}

function ebaySaleModeCard(item, strategy) {
  const mode = ebaySaleModeFor(item);
  const locked = ["prepared", "active"].includes(item.ebayListing?.status);
  const marketValue = Number(item.priceCheck?.fair || item.fair || strategy.targetPrice || 0);
  return `<fieldset class="ebay-sale-mode" ${locked ? "disabled" : ""}>
    <legend>Wie soll der Artikel angeboten werden?</legend>
    <div class="ebay-sale-mode-options">
      <button class="${mode === "fixed_price" ? "selected" : ""}" data-ebay-sale-mode="fixed_price" data-item-id="${item.id}" type="button" ${locked ? "disabled" : ""}>
        ${icon("FP")}<span><strong>Festpreis</strong><small>${euro(strategy.targetPrice)}</small></span>
      </button>
      <button class="${mode === "auction_1_euro" ? "selected" : ""}" data-ebay-sale-mode="auction_1_euro" data-item-id="${item.id}" type="button" ${locked ? "disabled" : ""}>
        ${icon("1€")}<span><strong>Auktion ab 1 €</strong><small>7 Tage · ohne Mindestpreis</small></span>
      </button>
    </div>
    <p>${mode === "auction_1_euro"
      ? `Geschätzter Marktwert: ${euro(marketValue)}. Der tatsächliche Verkaufspreis wird durch die Gebote bestimmt und kann deutlich darunter liegen.`
      : `RAMROD setzt den berechneten Zielpreis an. Geschätzter Marktwert: ${euro(marketValue)}.`}</p>
    ${locked ? `<small class="ebay-sale-mode-lock">Die Verkaufsart ist gesperrt, weil bereits ein eBay-Angebot vorbereitet wurde.</small>` : ""}
  </fieldset>`;
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
  const priceMarkup = entry.targetPrice
    ? `<small class="channel-price-label">${escapeHtml(entry.priceLabel || "Zielpreis")}</small><strong>${euro(entry.targetPrice)}</strong>${entry.expectedSalePrice && entry.expectedSalePrice !== entry.targetPrice ? `<em>${escapeHtml(entry.expectedPriceLabel || "Erwartet")} ${euro(entry.expectedSalePrice)}</em>` : ""}`
    : `<strong class="channel-no-price">${escapeHtml(entry.priceLabel || "Reichweite")}</strong>`;
  return `<article class="channel-plan-step ${statusTone}">
    <span class="channel-plan-index">${index}</span>
    <div class="channel-plan-copy"><small>${escapeHtml(phase)} · ${escapeHtml(entry.roleLabel || "Kanal")}</small><strong>${escapeHtml(channelLabel(entry.name))}</strong><p>${escapeHtml(entry.reason || "Als Verkaufskanal prüfen.")}</p></div>
    <div class="channel-plan-status">${priceMarkup}<span>${escapeHtml(entry.statusLabel || channelActivationLabel(entry.activation))}</span></div>
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
  const rejectedEvidence = Array.isArray(check.rejectedEvidence) ? check.rejectedEvidence : [];
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
        ${calculation.soldMedian ? suggestion("Verkauft-Median", euro(calculation.soldMedian)) : ""}
        ${calculation.activeMedian ? suggestion("Angebots-Median", euro(calculation.activeMedian)) : ""}
        ${suggestion("Vergleichsspanne", `${euro(calculation.minComparable)} - ${euro(calculation.maxComparable)}`)}
        ${suggestion("Ausreißer", Number(calculation.outlierCount ?? outlierCount))}
      </div>
    </div>` : ""}
    <div class="evidence-summary">
      <span>${icon("EB")} ${ebayCount} eBay-Live-Treffer</span>
      <span>${webCount} Web-Treffer · ${soldCount} verkauft</span>
      <span>${outlierCount} Ausreißer markiert</span>
      <span>${Number(calculation.rejectedCount || rejectedEvidence.length)} unpassend</span>
      <span>Query: ${escapeHtml(check.query || "-")}</span>
    </div>
    <div class="evidence-list">
      ${evidence.length ? evidence.map(evidenceRow).join("") : `<p class="muted-copy">Keine verwertbaren Vergleichstreffer gefunden.</p>`}
    </div>
    ${rejectedEvidence.length ? `<details class="rejected-evidence">
      <summary>${rejectedEvidence.length} beispielhafte Fehl-Treffer anzeigen</summary>
      <div class="evidence-list">${rejectedEvidence.map(rejectedEvidenceRow).join("")}</div>
    </details>` : ""}
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
      <small>${escapeHtml(status)} · ${escapeHtml(entry.age || "live")} · ${Number(entry.matchScore || 0)}% Match${entry.matchReasons?.length ? ` · ${escapeHtml(entry.matchReasons.slice(0, 2).join(", "))}` : ""}${entry.query ? ` · Query: ${escapeHtml(entry.query)}` : ""}</small>
    </div>
    <em>${euro(entry.price)}</em>
  </article>`;
}

function rejectedEvidenceRow(entry) {
  const title = escapeHtml(entry.title || "Unbenannter Treffer");
  const link = entry.url
    ? `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">${title}</a>`
    : `<strong>${title}</strong>`;
  return `<article class="evidence-row rejected">
    <div class="evidence-main">
      <span class="source-pill">Ausgeschlossen</span>
      ${link}
      <small>${escapeHtml(entry.rejectionReason || "Nicht ausreichend vergleichbar")} · ${Number(entry.matchScore || 0)}% Match</small>
    </div>
    <em>${euro(entry.price)}</em>
  </article>`;
}

function ebayDraftCard(item) {
  const draft = item.ebayDraft;
  if (!draft) return "";
  if (!draft.readiness) {
    return `<section class="script-box ebay-draft-card legacy-draft">
      <div class="ebay-listing-head"><div><small>Alter lokaler Entwurf</small><h3>eBay-Vorschau neu erzeugen</h3></div><span class="status-pill muted">Nicht verkaufsfähig</span></div>
      <p>Dieser Entwurf stammt noch aus der alten Platzhalter-Logik. Klicke erneut auf „eBay-Vorschau“, damit Titel, Kategorie, Versand und Rückgabe vollständig geprüft werden.</p>
    </section>`;
  }
  const ready = draft.status === "ready_for_ebay" && draft.readiness.every((entry) => entry.ready);
  const prepared = item.ebayListing?.status === "prepared";
  const active = item.ebayListing?.status === "active";
  const missing = draft.missingAspects || [];
  const content = draft.content || {};
  const auction = draft.salesFormat === "auction";
  return `<section class="script-box ebay-draft-card ${ready ? "ready" : "needs-input"}">
    <div class="ebay-listing-head">
      <div><small>Käuferansicht vor Veröffentlichung</small><h3>eBay-Angebot</h3></div>
      <span class="status-pill ${active ? "live" : prepared ? "running" : ready ? "ready" : "muted"}">${active ? "Live" : prepared ? "Bei eBay vorbereitet" : ready ? "Bereit" : "Angaben fehlen"}</span>
    </div>
    <div class="ebay-preview-title"><strong>${escapeHtml(draft.title || item.title)}</strong><em>${auction ? `Start ${euro(Number(draft.startPrice || draft.price || 1))}` : euro(Number(draft.price || item.fair))}</em></div>
    <div class="ebay-preview-meta">
      <span>${auction ? "Auktion · 7 Tage · ab 1 €" : "Festpreis"}</span>
      <span>${escapeHtml(draft.category?.name || "Kategorie offen")}</span>
      <span>${escapeHtml(draft.condition || item.condition)}</span>
      <span>${Number(draft.sourceImages?.length || 0)} Foto${Number(draft.sourceImages?.length || 0) === 1 ? "" : "s"}</span>
      <span>${escapeHtml(draft.sellerType === "private" ? "Privater Verkäufer" : draft.sellerType === "business" ? "Gewerblicher Verkäufer" : "Verkäuferprofil")}</span>
    </div>
    ${auction ? `<div class="ebay-auction-warning"><strong>Geschätzter Marktwert: ${euro(Number(draft.marketValue || item.fair || 0))}</strong><span>Kein Mindestpreis: Der Artikel kann für 1 € zuzüglich Versand verkauft werden, wenn es nur ein Gebot gibt.</span></div>` : ""}
    ${listingCopyAgentCard(item, draft)}
    <div class="ebay-preview-copy">
      <div><small>Beschreibung</small><p>${escapeHtml(content.shortDescription || "-")}</p></div>
      <div><small>Zustand</small><p>${escapeHtml(content.conditionDescription || item.condition || "-")}</p></div>
      ${content.includedItems?.length ? `<div><small>Lieferumfang</small><p>${escapeHtml(content.includedItems.join(" · "))}</p></div>` : ""}
      ${content.defects?.length ? `<div><small>Bekannte Mängel</small><p>${escapeHtml(content.defects.join(" · "))}</p></div>` : ""}
    </div>
    <div class="ebay-policy-grid">
      ${ebayPolicyCard("Versand", draft.shipping)}
      ${ebayPolicyCard("Rückgabe", draft.returns)}
      ${ebayPolicyCard("Zahlung", draft.payment)}
      ${ebayPolicyCard("Garantie", draft.warranty)}
    </div>
    <section class="ebay-readiness">
      <div class="section-title"><h3>Vor dem Einstellen</h3><span>${draft.readiness.filter((entry) => entry.ready).length}/${draft.readiness.length}</span></div>
      ${draft.readiness.map((entry) => `<div class="ebay-readiness-row ${entry.ready ? "done" : "missing"}">${icon(entry.ready ? "OK" : "!")}<span><strong>${escapeHtml(entry.label)}</strong><small>${escapeHtml(entry.detail)}</small></span></div>`).join("")}
    </section>
    ${missing.length ? `<form class="ebay-missing-form" data-ebay-missing-form="${item.id}">
      <strong>Fehlende eBay-Merkmale ergänzen</strong>
      <p>Diese Angaben verlangt die gewählte eBay-Kategorie. Bitte nur sichere Werte eintragen.</p>
      <div class="ebay-missing-grid">${missing.map((entry) => ebayAspectField(entry)).join("")}</div>
      <button class="secondary-action" type="submit">${icon("OK")}Merkmale übernehmen</button>
    </form>` : ""}
    ${item.ebayListing ? `<div class="ebay-external-status"><strong>${active ? "Das Angebot ist live" : "eBay-Prüfung erfolgreich, noch nicht öffentlich"}</strong><span>${item.ebayListing.seller?.userId ? `Verkäufer: ${escapeHtml(item.ebayListing.seller.userId)} · ` : ""}${item.ebayListing.verification ? `eBay-Status: ${escapeHtml(item.ebayListing.verification.ack || "geprüft")} · mögliche Einstellgebühr: ${euro(item.ebayListing.verification.feeTotal || 0)}` : `Offer-ID ${escapeHtml(item.ebayListing.offerId || "-")}`}${item.ebayListing.listingId ? ` · Listing ${escapeHtml(item.ebayListing.listingId)}` : ""}</span>${item.ebayListing.verification?.warnings?.length ? `<span>${item.ebayListing.verification.warnings.map((entry) => escapeHtml(entry.longMessage || entry.shortMessage || "eBay-Hinweis")).join(" · ")}</span>` : ""}${item.ebayListing.url ? `<a href="${escapeHtml(item.ebayListing.url)}" target="_blank" rel="noreferrer">Auf eBay ansehen</a>` : ""}</div>` : ""}
    <div class="ebay-publish-actions">
      <button class="secondary-action" data-ebay-draft="${item.id}" type="button" ${state.ebayDrafting ? "disabled" : ""}>${icon("AI")}${state.ebayDrafting === item.id ? "Optimiere..." : "Vorschau neu erzeugen"}</button>
      ${!prepared && !active ? `<button class="primary-action" data-ebay-prepare="${item.id}" type="button" ${!ready || state.ebayPreparing ? "disabled" : ""}>${icon("EB")}${state.ebayPreparing === item.id ? "Wird angelegt..." : "Bei eBay vorbereiten"}</button>` : ""}
      ${prepared ? `<button class="primary-action danger-confirm" data-ebay-publish="${item.id}" type="button" ${state.ebayPublishing ? "disabled" : ""}>${icon("GO")}${state.ebayPublishing === item.id ? "Wird veröffentlicht..." : "Jetzt bei eBay veröffentlichen"}</button>` : ""}
    </div>
    <small class="ebay-safety-note">„Bei eBay vorbereiten“ ist noch nicht öffentlich. Erst „Jetzt bei eBay veröffentlichen“ erzeugt das sichtbare Angebot.</small>
  </section>`;
}

function listingCopyAgentCard(item, draft) {
  const agent = draft.copyAgent;
  if (!agent) return `<section class="listing-copy-agent legacy"><span>${icon("TX")}</span><div><small>Listing-Redakteur</small><strong>Textprüfung beim nächsten Entwurf aktiv</strong><p>Erzeuge die Vorschau neu, damit Käufertext und offene Angaben getrennt geprüft werden.</p></div></section>`;
  const missing = Array.isArray(agent.missingFacts) ? agent.missingFacts : [];
  const locked = ["prepared", "active"].includes(item.ebayListing?.status);
  const tone = agent.status === "ready" ? "ready" : agent.status === "needs_input" ? "blocked" : "review";
  const status = agent.status === "ready" ? "Text bereit" : agent.status === "needs_input" ? "Angaben fehlen" : "Text prüfen";
  return `<section class="listing-copy-agent ${tone}">
    <header><span>${icon("TX")}</span><div><small>Listing-Redakteur</small><strong>${escapeHtml(status)} · ${Number(agent.score || 0)}/100</strong></div><em>${escapeHtml(agent.label || "Text-Agent")}</em></header>
    <p>${escapeHtml(agent.summary || "Der Verkaufstext wurde aus Käufersicht geprüft.")}</p>
    <div class="listing-copy-checks">${(agent.checks || []).map((entry) => `<span class="${entry.ready ? "done" : "missing"}">${icon(entry.ready ? "OK" : "!")}${escapeHtml(entry.label)}</span>`).join("")}</div>
    ${missing.length ? `<div class="listing-copy-questions"><strong>Vor dem Einstellen klären</strong>${missing.map((entry) => `<article><span class="${entry.severity === "blocking" ? "blocking" : "warning"}">${entry.severity === "blocking" ? "Pflicht" : "Hinweis"}</span><div><strong>${escapeHtml(entry.question)}</strong><small>${escapeHtml(entry.reason)}</small></div></article>`).join("")}</div>` : ""}
    ${missing.length && !locked ? `<form data-listing-copy-form="${item.id}"><div>${missing.map((entry) => `<label><span>${escapeHtml(entry.field)}</span><input name="${escapeHtml(entry.field)}" value="${escapeHtml(item.listingCopyAnswers?.[entry.field] || "")}" placeholder="Sichere Angabe eintragen" ${entry.severity === "blocking" ? "required" : ""} /></label>`).join("")}</div><button class="secondary-action" type="submit">${icon("AI")}Text neu schreiben</button></form>` : ""}
  </section>`;
}

function ebayPolicyCard(label, policy) {
  return `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(policy?.name || "Offen")}</strong><span>${escapeHtml(policy?.summary || policy?.text || "Noch nicht hinterlegt")}</span></article>`;
}

function ebayAspectField(entry) {
  const name = escapeHtml(entry.name || "Merkmal");
  const values = Array.isArray(entry.values) ? entry.values.filter(Boolean) : [];
  if (values.length && values.length <= 40) {
    return `<label><span>${name}</span><select name="${name}" required><option value="">Bitte wählen</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select></label>`;
  }
  return `<label><span>${name}</span><input name="${name}" required /></label>`;
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
  const ebayPreviews = queues.ebay.filter((item) => item.ebayDraft && item.ebayListing?.status !== "prepared");
  const ebayPrepared = queues.ebay.filter((item) => item.ebayListing?.status === "prepared");
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
        <h3>Vorschau in RAMROD</h3>
        ${listingQueue(ebayPreviews, "Noch keine eBay-Vorschau erstellt.")}
      </div>
      <div class="sell-section">
        <h3>Bei eBay vorbereitet, noch nicht veröffentlicht</h3>
        ${listingQueue(ebayPrepared, "Noch kein Angebot zu eBay übertragen.")}
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
      <div class="sales-overview-actions"><button class="secondary-action" data-view="agents" type="button">${icon("AG")}Agenten</button><button class="secondary-action" data-view="inventory" type="button">${icon("DB")}Alle Artikel</button><button class="secondary-action" data-view="archive" type="button">${icon("AR")}Archiv</button><button class="secondary-action" data-view="shipping" type="button">${icon("VS")}Versand</button></div>
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
  if ((item.channel === "eBay" && item.ebayListing?.status === "prepared") || (item.approval?.status === "approved" && ["Whatnot", "Strongvision"].includes(item.channel))) return 3;
  if (item.approval?.status === "approved") return 2;
  return item.priceCheck ? 1 : 0;
}

function salesStatus(item) {
  if (item.stage === "Versand") return { label: "Versandbereit", note: "Verkauf erkannt · jetzt packen und versenden", tone: "shipping" };
  if (item.stage === "Verkauft") return { label: "Verkauft", note: "Der Verkauf wurde erkannt", tone: "sold" };
  if (item.ebayListing?.status === "active" || item.stage === "Gelistet") return { label: "Bei eBay live", note: "Öffentlich gelistet · Verkauf wird überwacht", tone: "prepared" };
  if (item.ebayListing?.status === "prepared") return { label: "eBay bereit", note: "Bei eBay vorbereitet · noch nicht veröffentlicht", tone: "prepared" };
  if (item.channel === "eBay" && item.ebayDraft) {
    const ready = item.ebayDraft.status === "ready_for_ebay";
    return {
      label: ready ? "eBay-Vorschau bereit" : "eBay-Angaben offen",
      note: ready ? "Nur in RAMROD · noch nicht zu eBay übertragen" : "Vorschau erstellt · Pflichtangaben oder Kontoeinrichtung fehlen",
      tone: ready ? "approved" : "muted"
    };
  }
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
      <button class="secondary-action" data-ebay-draft="${item.id}" type="button">${state.ebayDrafting === item.id ? "Optimiere..." : "Vorschau"}</button>
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

function agentsView() {
  const control = state.agentControl || {};
  if (!control.available) {
    return `<section class="agent-control-view">
      <div class="agent-hero">
        <div><p>Autonomie-Zentrale</p><h2>Agenten sicher steuern</h2><span>Missionen planen, externe Aktionen freigeben und jede Ausführung nachvollziehen.</span></div>
        <span class="agent-state waiting">Einrichtung offen</span>
      </div>
      <section class="agent-setup">
        <div>${icon("DB")}<h3>Datenmodell aktivieren</h3><p>${escapeHtml(control.message || "Die Agent-Control-Migration muss noch in Supabase ausgeführt werden.")}</p></div>
        <code>supabase/migrations/20260722100000_agent_control_layer.sql</code>
      </section>
    </section>`;
  }

  const runs = Array.isArray(control.runs) ? control.runs : [];
  const approvals = (control.approvals || []).filter((entry) => entry.status === "pending");
  const accounts = Array.isArray(control.channelAccounts) ? control.channelAccounts : [];
  const runners = Array.isArray(control.runners) ? control.runners : [];
  const activeRuns = runs.filter((run) => ["queued", "planning", "waiting_approval", "ready", "running"].includes(run.status));
  const completedRuns = runs.filter((run) => run.status === "succeeded");
  const connectedAccounts = accounts.filter((account) => account.status === "connected");
  const onlineRunners = runners.filter(agentRunnerOnline);
  const hermesRunner = runners.find((runner) => runner.metadata?.runner === "hermes-mcp");
  const missions = [
    { type: "distribute_inventory", icon: "RT", title: "Bestand verteilen", text: "Verkaufsbereite Artikel nach Preis, Zielgruppe und Kanalpassung aufteilen." },
    { type: "create_demand_campaign", icon: "MK", title: "Kampagne aufbauen", text: "Passende Artikel bündeln und Content für Shop, Social und Live-Verkauf vorbereiten." },
    { type: "reconcile_sale", icon: "VK", title: "Verkäufe synchronisieren", text: "Bestellungen prüfen, Einzelstücke reservieren und parallele Angebote kontrolliert beenden." }
  ];

  return `<section class="agent-control-view">
    <div class="agent-hero">
      <div><p>Autonomie-Zentrale</p><h2>RAMROD arbeitet, du entscheidest</h2><span>Agenten recherchieren und bereiten vor. Veröffentlichungen, Konten und Rechte bleiben unter menschlicher Kontrolle.</span></div>
      <div class="agent-provider-state"><span class="agent-state ${onlineRunners.length ? "online" : "waiting"}">${onlineRunners.length ? `${onlineRunners.length} Runner aktiv` : "Runner wartet"}</span><span class="agent-state ${hermesRunner && agentRunnerOnline(hermesRunner) ? "online" : "waiting"}">${hermesRunner && agentRunnerOnline(hermesRunner) ? "Hermes verbunden" : "Hermes offen"}</span><span class="agent-state ${control.telegramConfigured ? "online" : "waiting"}">${control.telegramConfigured ? "Telegram bereit" : "Telegram offen"}</span></div>
    </div>

    ${ebaySetupPanel(control.ebaySetup)}

    <div class="agent-stats" aria-label="Agentenstatus">
      ${agentStat("Aktive Missionen", activeRuns.length)}
      ${agentStat("Deine Freigaben", approvals.length, approvals.length ? "attention" : "")}
      ${agentStat("Verbundene Konten", connectedAccounts.length)}
      ${agentStat("Aktive Runner", onlineRunners.length)}
      ${agentStat("Abgeschlossen", completedRuns.length)}
    </div>

    ${agentTeamOverview(activeRuns, runners)}

    ${channelConnectorPanel(accounts)}

    <section class="agent-section">
      <div class="panel-heading"><div><p>Neue Mission</p><h2>Was soll RAMROD übernehmen?</h2></div></div>
      <div class="agent-mission-grid">${missions.map((mission) => `<article class="agent-mission-card">
        <span class="agent-mission-icon">${mission.icon}</span>
        <div><h3>${escapeHtml(mission.title)}</h3><p>${escapeHtml(mission.text)}</p></div>
        <button class="primary-action" data-start-agent="${mission.type}" ${mission.channelId ? `data-agent-channel="${mission.channelId}"` : ""} type="button" ${state.startingAgent ? "disabled" : ""}>${state.startingAgent === mission.type ? "Wird geplant..." : "Mission starten"}</button>
      </article>`).join("")}</div>
    </section>

    <section class="agent-section approvals-section">
      <div class="panel-heading"><div><p>Kontrollpunkt</p><h2>Freigaben</h2></div><span class="queue-count">${approvals.length}</span></div>
      <div class="approval-list">${approvals.length ? approvals.map(agentApprovalCard).join("") : `<div class="agent-empty"><strong>Keine Entscheidung offen</strong><p>Agenten können lesen und vorbereiten. Sobald eine externe Aktion ansteht, erscheint sie hier.</p></div>`}</div>
    </section>

    <div class="agent-columns">
      <section class="agent-section">
        <div class="panel-heading"><div><p>Aktivität</p><h2>Letzte Missionen</h2></div></div>
        <div class="agent-run-list">${runs.length ? runs.map((run) => agentRunRow(run, runners)).join("") : `<div class="agent-empty"><strong>Noch keine Mission</strong><p>Starte oben den ersten kontrollierten Auftrag.</p></div>`}</div>
      </section>
      <section class="agent-section">
        <div class="panel-heading"><div><p>Ausführung</p><h2>Runner</h2></div></div>
        <div class="agent-runner-list">${runners.length ? runners.map(agentRunnerRow).join("") : `<div class="agent-empty"><strong>Noch kein Runner gemeldet</strong><p>Der VPS-Runner erscheint hier, sobald die Executor-Migration aktiv ist.</p></div>`}</div>
        <div class="panel-heading agent-subheading"><div><p>Connectoren</p><h2>Verkaufskonten</h2></div></div>
        <div class="agent-account-list">${accounts.length ? accounts.map(agentAccountRow).join("") : `<div class="agent-empty"><strong>Noch kein Konto verbunden</strong><p>Mit „eBay-Konto verbinden“ beginnt das geführte Onboarding.</p></div>`}</div>
      </section>
    </div>
  </section>`;
}

function agentTeamOverview(activeRuns, runners) {
  const assignments = activeRuns
    .map((run) => ({ run, step: currentAgentStep(run) }))
    .filter((entry) => entry.step);
  return `<section class="agent-section agent-team-section">
    <div class="panel-heading"><div><p>Live-Team</p><h2>Wer arbeitet gerade woran?</h2></div><span class="queue-count">${assignments.length} aktiv</span></div>
    <div class="agent-org-chart">
      <article class="agent-lead-card">
        <span class="agent-avatar lead">VL</span>
        <div><small>Hauptagent</small><strong>RAMROD Verkaufsleiter</strong><p>${assignments.length ? `Steuert ${assignments.length} laufende Aufgabe${assignments.length === 1 ? "" : "n"}, prüft Ergebnisse und eskaliert Entscheidungen.` : "Bereit. Plant Verkauf, verteilt Arbeit und ruft dich nur an Kontrollpunkten hinzu."}</p></div>
        <em class="agent-state ${assignments.length ? "online" : "waiting"}">${assignments.length ? "Koordiniert" : "Bereit"}</em>
      </article>
      <div class="agent-specialist-grid">
        ${assignments.length ? assignments.map(({ run, step }) => agentAssignmentCard(run, step, runners)).join("") : `<div class="agent-empty agent-team-empty"><strong>Kein Spezialagent beschäftigt</strong><p>Starte eine Mission oder gib einen Artikel frei. Der Verkaufsleiter stellt danach das passende Team zusammen.</p></div>`}
      </div>
    </div>
  </section>`;
}

function channelConnectorPanel(accounts) {
  const connectableChannels = runtimeChannelCatalog.filter((entry) => entry.type !== "erp" && !["spezialforum", "ramrod_shop"].includes(entry.id));
  const connected = accounts.filter((account) => account.status === "connected");
  const defaultEmail = state.authSession?.user?.email || "";
  const disabled = !can("channels:manage") || Boolean(state.startingAgent);
  return `<section class="agent-section channel-onboarding-section">
    <div class="panel-heading"><div><p>Kanal-Connector</p><h2>Neues Verkaufskonto aufbauen</h2><span>Der Mac Mini recherchiert Anforderungen, füllt Formulare und wartet bei Kontoeröffnung, AGB, CAPTCHA, KYC oder 2FA auf deine Freigabe.</span></div><span class="queue-count">${connected.length} verbunden</span></div>
    <form class="channel-onboarding-form" data-channel-onboarding-form>
      <label><span>Plattform</span><select name="channelId" required>${connectableChannels.map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.name)}</option>`).join("")}</select></label>
      <label><span>Kontakt-E-Mail</span><input name="accountEmail" type="email" autocomplete="email" value="${escapeHtml(defaultEmail)}" placeholder="verkauf@firma.de" required /></label>
      <label><span>Verkäuferart</span><select name="sellerMode" required><option value="business">Gewerblich</option><option value="private">Privat</option></select></label>
      <label><span>Bezeichnung</span><input name="accountLabel" type="text" maxlength="120" placeholder="z. B. Strongvision Kleinanzeigen" /></label>
      <button class="primary-action" type="submit" ${disabled ? "disabled" : ""}>${state.startingAgent === "onboard_channel_account" ? "Agent plant..." : `${icon("AG")}Agent beauftragen`}</button>
    </form>
    <div class="channel-onboarding-safety"><span>${icon("OK")}Keine Passwörter in RAMROD</span><span>${icon("MM")}Browser-Arbeit auf dem Mac Mini</span><span>${icon("TG")}Freigaben in RAMROD oder Telegram</span></div>
    ${!can("channels:manage") ? `<p class="agent-permission-note">Nur Inhaber und Admins dürfen neue Verkaufskonten einrichten.</p>` : ""}
  </section>`;
}

function ebaySetupPanel(setup) {
  if (!setup) return "";
  const steps = Array.isArray(setup.steps) ? setup.steps : [];
  const busy = Boolean(state.ebaySetupBusy);
  const complete = Boolean(setup.ready);
  const defaults = setup.sellerDefaults || {};
  const needsDefaults = Boolean(setup.needsSellerDefaults);
  const privateSeller = Boolean(setup.privateSeller);
  return `<section class="ebay-setup-panel ${complete ? "complete" : ""}">
    <div class="ebay-setup-copy">
      <p>Geführte Einrichtung</p>
      <h2>${complete ? "eBay ist verbunden" : "eBay Schritt für Schritt verbinden"}</h2>
      <span>${complete ? (privateSeller ? "Privates eBay-Konto verbunden. Versand und Rückgabe werden bei jedem Artikel passend gesetzt." : "RAMROD kann jetzt Angebote vorbereiten und den Kontostatus prüfen.") : "RAMROD erledigt die Technik. Du meldest dich nur bei eBay an und bestätigst den Zugriff."}</span>
    </div>
    <ol class="ebay-setup-steps">
      ${steps.map((step, index) => `<li class="${step.ready ? "ready" : ""}">
        <span>${step.ready ? "✓" : index + 1}</span>
        <div><strong>${escapeHtml(step.label)}</strong><small>${escapeHtml(step.detail)}</small></div>
      </li>`).join("")}
    </ol>
    ${needsDefaults ? `<form class="ebay-defaults-form" data-ebay-defaults-form>
      <div class="ebay-defaults-heading"><div><p>${privateSeller ? "Private Verkäuferregeln" : "Einmalige Kontoregeln"}</p><h3>Versandlogik und Rückgabe festlegen</h3></div><span>Kein Artikel wird veröffentlicht</span></div>
      ${privateSeller ? `<div class="ebay-private-note"><strong>Privates eBay-Konto erkannt</strong><span>Dieses Konto unterstützt keine eBay-Unternehmensrichtlinien. RAMROD speichert die Angaben deshalb pro Artikel und überträgt sie beim Einstellen.</span></div>` : ""}
      <div class="ebay-shipping-logic">
        <div><strong>Versand wird pro Artikel berechnet</strong><span>${privateSeller ? "RAMROD nutzt DHL-Klassen von 2 bis 31,5 kg und überträgt die passende Versandart direkt in den Artikel." : "RAMROD legt DHL-Klassen von 2 bis 31,5 kg an und wählt später anhand von Gewicht, Verpackung und Größe."}</span></div>
        <div class="ebay-shipping-tiers"><span>bis 2 kg</span><span>bis 5 kg</span><span>bis 10 kg</span><span>bis 20 kg</span><span>bis 31,5 kg</span></div>
      </div>
      <div class="ebay-defaults-grid">
        <label><span>Versand aus PLZ</span><input name="postalCode" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" placeholder="z. B. 73730" value="${escapeHtml(defaults.postalCode || "")}" required /></label>
        <label><span>Versandbereit in</span><select name="handlingDays"><option value="1" ${Number(defaults.handlingDays) === 1 ? "selected" : ""}>1 Werktag</option><option value="2" ${defaults.handlingDays === undefined || Number(defaults.handlingDays) === 2 ? "selected" : ""}>2 Werktagen</option><option value="3" ${Number(defaults.handlingDays) === 3 ? "selected" : ""}>3 Werktagen</option><option value="5" ${Number(defaults.handlingDays) === 5 ? "selected" : ""}>5 Werktagen</option></select></label>
        <label><span>Freiwillige Rückgabe</span><select name="returnsAccepted" data-ebay-returns-select><option value="false" ${defaults.returnsAccepted !== true ? "selected" : ""}>Nein</option><option value="true" ${defaults.returnsAccepted === true ? "selected" : ""}>Ja</option></select></label>
        <label data-ebay-return-option ${defaults.returnsAccepted === true ? "" : "hidden"}><span>Rückgabefrist</span><select name="returnDays"><option value="30" ${Number(defaults.returnDays || 30) === 30 ? "selected" : ""}>30 Tage</option><option value="60" ${Number(defaults.returnDays) === 60 ? "selected" : ""}>60 Tage</option></select></label>
        <label data-ebay-return-option ${defaults.returnsAccepted === true ? "" : "hidden"}><span>Rückversand</span><select name="returnShippingCostPayer"><option value="BUYER" ${defaults.returnShippingCostPayer !== "SELLER" ? "selected" : ""}>Käufer zahlt Rückversand</option><option value="SELLER" ${defaults.returnShippingCostPayer === "SELLER" ? "selected" : ""}>Verkäufer zahlt Rückversand</option></select></label>
      </div>
      <label class="ebay-defaults-confirm"><input name="confirm" type="checkbox" required /><span>Ich bestätige diese ${privateSeller ? "Verkaufsregeln" : "Kontoregeln"}. Die konkrete Versandklasse wird für jeden Artikel einzeln gewählt. Gesetzliche Rechte bleiben unberührt.</span></label>
      <div class="ebay-defaults-footer"><p>RAMROD verspricht bei gebrauchten Artikeln keine Garantie und erfindet weder Funktion noch Zubehör. Unklare Versanddaten oder Artikelangaben werden vor dem Einstellen erneut geprüft.</p><button class="primary-action" type="submit" ${busy ? "disabled" : ""}>${busy ? (privateSeller ? "Wird gespeichert..." : "Wird bei eBay angelegt...") : (privateSeller ? "Privatregeln speichern" : "Kontoregeln anlegen")}</button></div>
    </form>` : `<div class="ebay-setup-action">
      <button class="primary-action" data-ebay-setup-action="${escapeHtml(setup.nextAction)}" type="button" ${busy || complete ? "disabled" : ""}>
        ${busy ? "RAMROD prüft..." : escapeHtml(setup.actionLabel)}
      </button>
      ${setup.oauthConnected ? `<button class="secondary-action" data-ebay-setup-action="reconnect" type="button" ${busy ? "disabled" : ""}>eBay-Konto wechseln</button>` : ""}
      <small>${setup.environment === "production" ? "Echtes eBay-Verkäuferkonto" : "eBay-Sandbox zum Testen"}</small>
    </div>`}
  </section>`;
}

function agentStat(label, value, tone = "") {
  return `<div class="agent-stat ${tone}"><strong>${Number(value || 0)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function agentApprovalCard(approval) {
  const payload = approval.payload || {};
  return `<article class="approval-card">
    <div class="approval-copy"><span class="risk-badge ${escapeHtml(payload.riskLevel || "high")}">${escapeHtml(agentRiskLabel(payload.riskLevel))}</span><div><strong>${escapeHtml(approval.summary)}</strong><small>${escapeHtml(payload.channelId ? channelLabel(payload.channelId) : "Externe Aktion")} · gültig bis ${escapeHtml(formatAgentDate(approval.expires_at))}</small></div></div>
    ${can("sales:approve") ? `<div class="approval-actions"><button class="secondary-action reject" data-agent-decision="reject" data-approval-id="${approval.id}" type="button" ${state.decidingApproval ? "disabled" : ""}>Ablehnen</button><button class="primary-action" data-agent-decision="approve" data-approval-id="${approval.id}" type="button" ${state.decidingApproval ? "disabled" : ""}>${state.decidingApproval === approval.id ? "Wird gespeichert..." : "Freigeben"}</button></div>` : `<span class="status-pill waiting">Wartet auf Admin</span>`}
  </article>`;
}

function agentRunRow(run, runners = []) {
  const plan = run.plan || {};
  const steps = Array.isArray(run.steps) ? run.steps : [];
  const active = ["queued", "planning", "waiting_approval", "ready", "running"].includes(run.status);
  return `<details class="agent-run-row" ${active ? "open" : ""}>
    <summary class="agent-run-summary">
      <span class="agent-avatar lead">VL</span>
      <div><small>RAMROD Verkaufsleiter</small><strong>${escapeHtml(plan.label || agentTypeLabel(run.agent_type))}</strong><p>${escapeHtml(run.objective)}</p></div>
      <div class="agent-run-state"><span class="agent-state ${agentStatusTone(run.status)}">${escapeHtml(agentStatusLabel(run.status))}</span><time>${escapeHtml(formatAgentDate(run.created_at))}</time></div>
    </summary>
    <div class="agent-step-tree">${steps.map((step) => agentStepRow(step, runners)).join("")}</div>
  </details>`;
}

function currentAgentStep(run) {
  const steps = Array.isArray(run?.steps) ? run.steps : [];
  return steps.find((step) => step.status === "running")
    || steps.find((step) => step.status === "waiting_approval")
    || steps.find((step) => step.status === "approved")
    || steps.find((step) => step.status === "planned")
    || null;
}

function agentAssignmentCard(run, step, runners) {
  const specialist = agentSpecialist(step);
  const runner = agentRunnerForStep(step, runners);
  return `<article class="agent-assignment-card ${agentStatusTone(step.status)}">
    <span class="agent-avatar">${escapeHtml(specialist.icon)}</span>
    <div><small>${escapeHtml(specialist.name)}</small><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.status === "waiting_approval" ? "Wartet auf deine Entscheidung." : step.summary || run.objective)}</p><span>${escapeHtml(agentTypeLabel(run.agent_type))}${runner ? ` · ${escapeHtml(runner.name || runner.worker_key)}` : ""}</span></div>
    <em class="agent-state ${agentStatusTone(step.status)}">${escapeHtml(agentStatusLabel(step.status))}</em>
  </article>`;
}

function agentStepRow(step, runners) {
  const specialist = agentSpecialist(step);
  const runner = agentRunnerForStep(step, runners);
  const result = agentStepResult(step);
  return `<article class="agent-step-row ${agentStatusTone(step.status)}">
    <span class="agent-tree-line" aria-hidden="true"></span>
    <span class="agent-avatar">${escapeHtml(specialist.icon)}</span>
    <div class="agent-step-copy"><small>${escapeHtml(specialist.name)}${runner ? ` · ${escapeHtml(runner.name || runner.worker_key)}` : ""}</small><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(result)}</p></div>
    <div class="agent-step-meta"><em class="agent-state ${agentStatusTone(step.status)}">${escapeHtml(agentStatusLabel(step.status))}</em>${step.started_at ? `<time>Start ${escapeHtml(formatAgentDate(step.started_at))}</time>` : ""}</div>
  </article>`;
}

function agentRunnerForStep(step, runners = []) {
  return runners.find((runner) => runner.id === step.locked_by) || null;
}

function agentStepResult(step) {
  if (step.status === "failed") return step.error?.message || "Der Schritt ist fehlgeschlagen und wird kontrolliert erneut versucht.";
  if (step.status === "succeeded") return step.output?.summary || step.output?.message || "Ergebnis geprüft und an den Verkaufsleiter übergeben.";
  if (step.status === "waiting_approval") return step.summary || "Dieser Schritt benötigt deine Entscheidung.";
  return step.summary || "Aufgabe ist vorbereitet und wartet auf ihre Ausführung.";
}

function agentSpecialist(step) {
  const specialists = {
    inspect_requirements: ["RS", "Plattform-Scout"],
    prepare_account_data: ["KA", "Konto-Assistent"],
    create_external_account: ["BA", "Browser-Agent"],
    complete_identity: ["DU", "Kontoinhaber"],
    connect_oauth: ["CO", "Connector-Agent"],
    verify_connector: ["CP", "Connector-Prüfer"],
    validate_item: ["AP", "Artikel-Prüfer"],
    prepare_listing: ["TX", "Listing-Redakteur"],
    publish_listing: ["PB", "Publisher"],
    verify_listing: ["LP", "Listing-Prüfer"],
    register_listing: ["BS", "Bestands-Synchronisierer"],
    select_candidates: ["PA", "Portfolio-Agent"],
    build_channel_plan: ["KS", "Kanalstratege"],
    prepare_channel_drafts: ["LT", "Listing-Team"],
    publish_channel_plan: ["KP", "Kanal-Publisher"],
    monitor_distribution: ["VM", "Verkaufsmonitor"],
    cluster_inventory: ["SA", "Sortier-Agent"],
    create_content: ["CA", "Content-Agent"],
    review_claims: ["RP", "Rechte-Prüfer"],
    schedule_campaign: ["KM", "Kampagnen-Agent"],
    measure_campaign: ["PF", "Performance-Agent"],
    verify_order: ["OA", "Order-Agent"],
    reserve_inventory: ["BW", "Bestandswächter"],
    delist_other_channels: ["DW", "Dubletten-Wächter"],
    create_shipping_task: ["VA", "Versand-Agent"]
  };
  const match = specialists[step?.step_key] || ["AG", step?.execution_mode === "human" ? "Kontoinhaber" : "Spezialagent"];
  return { icon: match[0], name: match[1] };
}

function agentAccountRow(account) {
  return `<article class="agent-account-row"><span>${String(account.channel_id || "CH").slice(0, 2).toUpperCase()}</span><div><strong>${escapeHtml(account.display_name)}</strong><small>${escapeHtml(channelLabel(account.channel_id))} · ${escapeHtml(account.auth_mode || "oauth")}</small></div><em class="agent-state ${agentStatusTone(account.status)}">${escapeHtml(agentAccountStatusLabel(account.status))}</em></article>`;
}

function agentRunnerRow(runner) {
  const online = agentRunnerOnline(runner);
  const mode = runner.metadata?.runner === "hermes-mcp" ? "Hermes / Browser" : runner.metadata?.runner === "safe" ? "Interne Vorbereitung" : "Agent Runner";
  return `<article class="agent-account-row agent-runner-row"><span>RN</span><div><strong>${escapeHtml(runner.name || runner.worker_key)}</strong><small>${escapeHtml(mode)} · zuletzt ${escapeHtml(formatAgentDate(runner.last_seen_at))}</small></div><em class="agent-state ${online ? "online" : "waiting"}">${online ? runner.status === "busy" ? "Arbeitet" : "Bereit" : "Offline"}</em></article>`;
}

function agentRunnerOnline(runner) {
  const seen = new Date(runner?.last_seen_at || 0).getTime();
  return ["online", "busy"].includes(runner?.status) && Number.isFinite(seen) && Date.now() - seen < 2 * 60 * 1000;
}

function agentTypeLabel(value) {
  return {
    onboard_channel_account: "Verkaufskonto einrichten",
    publish_item: "Artikel veröffentlichen",
    distribute_inventory: "Artikel verteilen",
    create_demand_campaign: "Kampagne planen",
    reconcile_sale: "Verkauf synchronisieren"
  }[value] || "Agentenmission";
}

function agentStatusLabel(value) {
  return {
    queued: "Wartet", planning: "Plant", waiting_approval: "Freigabe nötig", ready: "Freigegeben",
    running: "Läuft", succeeded: "Abgeschlossen", failed: "Fehlgeschlagen", cancelled: "Gestoppt",
    planned: "Geplant", approved: "Freigegeben", skipped: "Übersprungen"
  }[value] || String(value || "Offen");
}

function agentStatusTone(value) {
  if (["connected", "ready", "approved", "succeeded", "online"].includes(value)) return "online";
  if (["failed", "error", "rejected", "cancelled", "suspended"].includes(value)) return "failed";
  return "waiting";
}

function agentAccountStatusLabel(value) {
  return { planned: "Geplant", onboarding: "Einrichtung", connected: "Verbunden", action_required: "Aktion nötig", suspended: "Pausiert", disconnected: "Getrennt", error: "Fehler" }[value] || value || "Offen";
}

function agentRiskLabel(value) {
  return { low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch" }[value] || "Hoch";
}

function formatAgentDate(value) {
  if (!value) return "offen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "offen";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
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

function settingsView() {
  if (!can("team:manage")) return `<section class="empty-state"><h2>Keine Berechtigung</h2><p>Team und Verkaufskonten können nur Inhaber oder Admins verwalten.</p></section>`;
  if (!state.team) return `<section class="settings-layout"><div class="settings-loading"><h2>Team wird geladen...</h2><p>Mitglieder, Einladungen und Verkaufskanäle werden sicher aus diesem Kundenbereich geladen.</p></div></section>`;
  const organization = activeOrganization();
  const members = state.team.members || [];
  const invitations = state.team.invitations || [];
  const connectedIds = new Set((state.team.channels || []).map((entry) => entry.channel_id));
  const availableChannels = channelCatalog().filter((entry) => entry.type !== "erp" && !connectedIds.has(entry.id) && (entry.selectable || ["instagram", "ramrod_shop"].includes(entry.id))).slice(0, 10);
  const jtlAccount = (state.team.channels || []).find((entry) => entry.channel_id === "jtl_wawi");
  return `<section class="settings-layout">
    <header class="settings-intro"><div><p>${escapeHtml(organization.name)}</p><h2>Team, Verkaufskanäle und Systeme</h2><span>Ein Login pro Person. Rechte und Verbindungen gelten nur in diesem Kundenbereich.</span></div><div class="role-legend"><span><b>Inhaber</b> alles</span><span><b>Admin</b> Team + Freigaben</span><span><b>Operator</b> Artikel + KI</span><span><b>Leser</b> nur ansehen</span></div></header>
    <div class="settings-columns">
      <section class="team-section"><div class="panel-heading"><div><p>Zugänge</p><h2>${members.length} Teammitglieder</h2></div></div>
        <div class="team-list">${members.map(teamMemberRow).join("") || `<p class="muted-copy">Noch keine Mitglieder.</p>`}</div>
        <form id="invite-member-form" class="invite-form"><label class="field"><span>E-Mail einladen</span><input name="email" type="email" placeholder="name@firma.de" required /></label><label class="field"><span>Rolle</span><select name="role">${activeOrganization().role === "owner" || state.platformAdmin ? `<option value="admin">Admin</option>` : ""}<option value="operator" selected>Operator</option><option value="viewer">Leser</option></select></label><button class="primary-action" type="submit" ${state.teamLoading ? "disabled" : ""}>${icon("PL")}Link erzeugen</button></form>
        ${state.inviteResultUrl ? `<div class="invite-link-result"><div><small>Persönlicher Einladungslink</small><strong>Einmal teilen, sieben Tage gültig</strong></div><input value="${escapeHtml(state.inviteResultUrl)}" readonly /><button class="secondary-action" data-copy-invite type="button">${icon("CP")}Kopieren</button></div>` : ""}
        ${invitations.length ? `<details class="pending-invitations"><summary>${invitations.filter((entry) => entry.status === "pending").length} offene Einladungen</summary><div>${invitations.map(invitationRow).join("")}</div></details>` : ""}
      </section>
      <section class="channel-section"><div class="panel-heading"><div><p>Verkauf</p><h2>Kanäle dieses Bereichs</h2></div></div>
        <div class="configured-channels">${(state.team.channels || []).map((account) => `<div class="configured-channel"><span>${icon(channelAbbreviation(account.channel_id))}</span><div><strong>${escapeHtml(channelLabel(account.channel_id))}</strong><small>${escapeHtml(agentAccountStatusLabel(account.status))}</small></div><em class="status-pill ${agentStatusTone(account.status)}">${escapeHtml(agentAccountStatusLabel(account.status))}</em></div>`).join("") || `<p class="muted-copy">Noch keine Kanäle ausgewählt.</p>`}</div>
        ${availableChannels.length ? `<form id="channel-settings-form" class="channel-settings-form"><fieldset><legend>Weitere Kanäle vormerken</legend>${availableChannels.map((channel) => `<label><input type="checkbox" name="channels" value="${escapeHtml(channel.id)}" /><span><strong>${escapeHtml(channel.name)}</strong><small>${escapeHtml(channel.statusLabel || "Geplant")}</small></span></label>`).join("")}</fieldset><button class="secondary-action" type="submit">${icon("PL")}Auswahl hinzufügen</button></form>` : `<p class="settings-note">Alle verfügbaren Kanäle sind bereits ausgewählt.</p>`}
        ${organization.slug === "strongvision" ? `<div class="configured-channel"><span>${icon("JT")}</span><div><strong>JTL-Wawi</strong><small>${escapeHtml(jtlAccount ? agentAccountStatusLabel(jtlAccount.status) : "Lesenden Pilot vorbereiten")}</small></div><em class="status-pill ${jtlAccount ? agentStatusTone(jtlAccount.status) : "waiting"}">${escapeHtml(jtlAccount ? agentAccountStatusLabel(jtlAccount.status) : "Offen")}</em></div><p class="settings-note">JTL führt Artikelstamm, Bestand, Lager und Aufträge. RAMROD ergänzt Fotos, KI-Analyse, Preise und Verkaufskanäle.</p>` : ""}
      </section>
    </div>
  </section>`;
}

function teamMemberRow(member) {
  const locked = member.role === "owner";
  const actorCanAssignAdmin = activeOrganization().role === "owner" || state.platformAdmin;
  return `<form class="team-member-row" data-membership-form="${escapeHtml(member.id)}"><span class="member-avatar">${escapeHtml(String(member.name || member.email || "M").slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(member.name || member.email || "Mitglied")}</strong><small>${escapeHtml(member.email || "")}${member.user_id === state.authSession?.user?.id ? " · Du" : ""}</small></div><select name="role" ${locked ? "disabled" : ""}>${locked ? `<option value="owner">Inhaber</option>` : `${actorCanAssignAdmin ? `<option value="admin" ${member.role === "admin" ? "selected" : ""}>Admin</option>` : ""}<option value="operator" ${member.role === "operator" ? "selected" : ""}>Operator</option><option value="viewer" ${member.role === "viewer" ? "selected" : ""}>Leser</option>`}</select><select name="status" ${locked ? "disabled" : ""}><option value="active" ${member.status === "active" ? "selected" : ""}>Aktiv</option><option value="suspended" ${member.status === "suspended" ? "selected" : ""}>Gesperrt</option></select>${locked ? `<span class="member-owner-label">Geschützt</span>` : `<button class="icon-button" type="submit" title="Änderung speichern">${icon("OK")}</button>`}</form>`;
}

function invitationRow(invitation) {
  return `<div class="invitation-row"><div><strong>${escapeHtml(invitation.email)}</strong><small>${escapeHtml(roleLabel(invitation.role))} · ${escapeHtml(invitation.status === "pending" ? `bis ${formatDate(invitation.expires_at)}` : invitation.status)}</small></div>${invitation.status === "pending" ? `<button class="auth-link" data-invitation-action="renew" data-invitation-id="${escapeHtml(invitation.id)}" type="button">Neuer Link</button><button class="auth-link danger" data-invitation-action="revoke" data-invitation-id="${escapeHtml(invitation.id)}" type="button">Widerrufen</button>` : ""}</div>`;
}

function channelAbbreviation(channelId) {
  return { ebay: "EB", whatnot: "WN", kleinanzeigen: "KA", instagram: "IG", ramrod_shop: "RS", vinted: "VI", facebook_marketplace: "FB", jtl_wawi: "JT" }[channelId] || String(channelId || "CH").slice(0, 2).toUpperCase();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "offen";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

async function loadTeamSettings() {
  if (!can("team:manage") || state.teamLoading) return;
  state.teamLoading = true;
  try {
    state.team = await fetchJson("/api/organization-team");
  } catch (error) {
    state.importStatus = `Team konnte nicht geladen werden: ${error.message}`;
  } finally {
    state.teamLoading = false;
    render();
  }
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
  item.stage = item.channel === "eBay" && item.ebayDraft?.status !== "ready_for_ebay"
    ? "Freigegeben"
    : "Verkaufsbereit";
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
    state.team = null;
    state.inviteResultUrl = "";
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

  document.querySelector("[data-add-workspace]")?.addEventListener("click", () => {
    state.onboardingOverlay = true;
    state.needsOnboarding = true;
    state.onboardingMode = "create";
    state.authError = "";
    render();
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
    if (state.view === "scan") state.captureDestination = "sales";
    if (state.view === "vault-scan") state.captureDestination = "vault";
    render();
    if (state.view === "settings" && !state.team) loadTeamSettings();
  }));

  document.querySelectorAll("[data-vault-scan]").forEach((button) => button.addEventListener("click", () => {
    state.captureDestination = "vault";
    state.captureMode = "single";
    state.vaultReidentifyItem = "";
    state.draft = createEmptyDraft(state.draft.boxId || boxes[0]?.id || "VLT-001");
    state.recognition = null;
    state.recognitionMeta = null;
    state.view = "vault-scan";
    render();
  }));
  document.querySelectorAll("[data-vault-upload]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#vault-start-upload")?.click();
  }));
  document.querySelector("#vault-start-upload")?.addEventListener("change", async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    await addPhotosToDraft(files, { startVaultScan: true });
  });
  document.querySelector("[data-vault-back]")?.addEventListener("click", () => {
    state.recognitionRequestId += 1;
    state.draft = createEmptyDraft(state.draft.boxId || boxes[0]?.id || "VLT-001");
    state.recognition = null;
    state.recognitionMeta = null;
    state.vaultReidentifyItem = "";
    state.view = "vault";
    render();
  });
  document.querySelector("[data-scan-sales]")?.addEventListener("click", () => {
    state.captureDestination = "sales";
    state.view = "scan";
    render();
  });
  document.querySelectorAll("[data-vault-new]").forEach((button) => button.addEventListener("click", () => {
    state.vaultFormOpen = true;
    render();
    requestAnimationFrame(() => document.querySelector("#vault-entry-form input[name='title']")?.focus());
  }));
  document.querySelectorAll("[data-vault-close-form]").forEach((button) => button.addEventListener("click", () => {
    state.vaultFormOpen = false;
    render();
  }));
  document.querySelectorAll("[data-vault-filter]").forEach((button) => button.addEventListener("click", () => {
    state.vaultFilter = button.dataset.vaultFilter || "all";
    render();
  }));
  document.querySelectorAll("[data-vault-scope]").forEach((button) => button.addEventListener("click", () => {
    state.vaultScope = button.dataset.vaultScope === "shared" ? "shared" : "mine";
    state.vaultSelected = "";
    state.vaultLoanItem = "";
    state.vaultFilter = "all";
    render();
  }));
  document.querySelector("[data-recognition-correction-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.recognition?.identity) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const predictedIdentity = { ...state.recognition.identity };
    const mediaType = String(values.mediaType || "other");
    const correctedIdentity = {
      ...predictedIdentity,
      title: String(values.title || "").trim(),
      productType: mediaType === "game" ? "Videospiel" : mediaType === "film" ? "Film" : "Sammlungsstück",
      category: mediaType === "game" ? "Games" : mediaType === "film" ? "Filme" : "Sammlung",
      platform: String(values.platform || "").trim(),
      edition: String(values.edition || "").trim()
    };
    state.recognition.identity = correctedIdentity;
    state.recognition.evidence = {
      ...(state.recognition.evidence || {}),
      originalStatus: state.recognition.evidence?.originalStatus || state.recognition.evidence?.status,
      status: "manual_review_ready",
      manualIdentityRequired: false,
      operatorCorrected: true,
      autoApprovalEligible: false
    };
    state.draft.query = correctedIdentity.title;
    state.draft.manualIdentityConfirmed = true;
    state.draft.recognitionCorrection = {
      predictedIdentity,
      correctedIdentity,
      correctionNote: String(values.correctionNote || "").trim()
    };
    state.importStatus = "Korrektur übernommen. Sie wird beim Speichern als Vergleichshinweis gesichert und nicht blind auf andere Artikel übertragen.";
    render();
  });
  document.querySelector("[data-collection-share-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.vaultNetworkBusy) return;
    const formData = new FormData(event.currentTarget);
    const scope = collectionScopeFromForm(event.currentTarget);
    state.vaultNetworkBusy = "share";
    state.importStatus = "Sammlungsfreigabe wird gespeichert...";
    render();
    try {
      await postJson("/api/collection-shares", { email: formData.get("email"), scope });
      await loadCollectionNetwork();
      state.importStatus = "Sammlungsbereich wurde sicher freigegeben.";
    } catch (error) {
      state.importStatus = `Freigabe fehlgeschlagen: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  });
  document.querySelectorAll("[data-collection-share-revoke]").forEach((button) => button.addEventListener("click", async () => {
    if (state.vaultNetworkBusy) return;
    state.vaultNetworkBusy = button.dataset.collectionShareRevoke;
    render();
    try {
      await postJson(`/api/collection-shares/${encodeURIComponent(button.dataset.collectionShareRevoke)}/revoke`, {});
      await loadCollectionNetwork();
      state.importStatus = "Sammlungsfreigabe wurde beendet.";
    } catch (error) {
      state.importStatus = `Freigabe konnte nicht beendet werden: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  }));
  document.querySelector("[data-collection-access-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.vaultNetworkBusy) return;
    const formData = new FormData(event.currentTarget);
    state.vaultNetworkBusy = "access-request";
    render();
    try {
      await postJson("/api/collection-access-requests", { ownerEmail: formData.get("ownerEmail"), message: formData.get("message") });
      await loadCollectionNetwork();
      state.importStatus = "Zugriffsanfrage wurde gesendet.";
    } catch (error) {
      state.importStatus = `Anfrage fehlgeschlagen: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  });
  document.querySelectorAll("[data-collection-access-approve]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.vaultNetworkBusy) return;
    const requestId = event.currentTarget.dataset.collectionAccessApprove;
    const scope = collectionScopeFromForm(event.currentTarget);
    state.vaultNetworkBusy = requestId;
    render();
    try {
      await postJson(`/api/collection-access-requests/${encodeURIComponent(requestId)}/approve`, { scope });
      await loadCollectionNetwork();
      state.importStatus = "Sammlungszugriff wurde im gewählten Umfang freigegeben.";
    } catch (error) {
      state.importStatus = `Anfrage konnte nicht freigegeben werden: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  }));
  document.querySelectorAll("[data-collection-access-action]").forEach((button) => button.addEventListener("click", async () => {
    if (state.vaultNetworkBusy) return;
    const requestId = button.dataset.requestId;
    const action = button.dataset.collectionAccessAction;
    state.vaultNetworkBusy = requestId;
    render();
    try {
      await postJson(`/api/collection-access-requests/${encodeURIComponent(requestId)}/${encodeURIComponent(action)}`, {});
      await loadCollectionNetwork();
      state.importStatus = action === "decline" ? "Zugriffsanfrage wurde abgelehnt." : "Zugriffsanfrage wurde zurückgezogen.";
    } catch (error) {
      state.importStatus = `Anfrage konnte nicht geändert werden: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  }));
  document.querySelectorAll("[data-shared-loan]").forEach((button) => button.addEventListener("click", () => {
    state.vaultLoanItem = state.vaultLoanItem === button.dataset.sharedLoan ? "" : button.dataset.sharedLoan;
    render();
  }));
  document.querySelectorAll("[data-shared-loan-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.vaultNetworkBusy) return;
    const item = (state.collectionNetwork.sharedItems || []).find((entry) => entry.id === event.currentTarget.dataset.sharedLoanForm);
    if (!item) return;
    const formData = new FormData(event.currentTarget);
    state.vaultNetworkBusy = item.id;
    render();
    try {
      await postJson("/api/collection-loan-requests", { shareId: item.sharedAccess.shareId, itemId: item.dbId, note: formData.get("note"), dueAt: formData.get("dueAt") || null });
      await loadCollectionNetwork();
      state.vaultLoanItem = "";
      state.importStatus = "Ausleihanfrage wurde gesendet.";
    } catch (error) {
      state.importStatus = `Ausleihanfrage fehlgeschlagen: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  }));
  document.querySelectorAll("[data-collection-loan-action]").forEach((button) => button.addEventListener("click", async () => {
    if (state.vaultNetworkBusy) return;
    const requestId = button.dataset.requestId;
    const action = button.dataset.collectionLoanAction;
    state.vaultNetworkBusy = requestId;
    render();
    try {
      await postJson(`/api/collection-loan-requests/${encodeURIComponent(requestId)}/${encodeURIComponent(action)}`, {});
      if (["approve", "return"].includes(action)) await hydrateAppState();
      else await loadCollectionNetwork();
      state.importStatus = { approve: "Ausleihe wurde bestätigt.", decline: "Ausleihanfrage wurde abgelehnt.", return: "Rückgabe wurde bestätigt.", cancel: "Ausleihanfrage wurde zurückgezogen." }[action];
    } catch (error) {
      state.importStatus = `Ausleihe konnte nicht geändert werden: ${error.message}`;
    } finally {
      state.vaultNetworkBusy = "";
      render();
    }
  }));
  document.querySelectorAll("[data-vault-select]").forEach((button) => button.addEventListener("click", () => {
    state.vaultSelected = button.dataset.vaultSelect;
    state.vaultLoanItem = "";
    state.vaultEditingItem = "";
    render();
  }));
  document.querySelectorAll("[data-vault-edit]").forEach((button) => button.addEventListener("click", () => {
    state.vaultEditingItem = state.vaultEditingItem === button.dataset.vaultEdit ? "" : button.dataset.vaultEdit;
    state.vaultLoanItem = "";
    state.vaultConfirmSaleItem = "";
    render();
  }));
  document.querySelector("[data-vault-edit-cancel]")?.addEventListener("click", () => {
    state.vaultEditingItem = "";
    render();
  });
  document.querySelector("[data-vault-edit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = state.items.find((entry) => entry.id === event.currentTarget.dataset.vaultEditForm);
    if (!item || state.vaultBusy || collectionStatus(item) !== "owned") return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const predictedIdentity = identityFromItem(item);
    const mediaType = String(values.mediaType || "other");
    const value = Math.max(0, Number(values.estimatedValue || 0));
    const now = new Date().toISOString();
    item.title = String(values.title || item.title).trim();
    item.category = mediaType === "game" ? "Games" : mediaType === "film" ? "Filme" : "Sammlung";
    item.condition = String(values.condition || item.condition || "Gut");
    item.low = value ? Math.round(value * 0.75) : 0;
    item.fair = value;
    item.aggressive = value ? Math.round(value * 1.2) : 0;
    item.collection = collectionDefaults(item, {
      mediaType,
      platform: String(values.platform || "").trim(),
      edition: String(values.edition || "").trim(),
      barcode: String(values.barcode || "").trim(),
      location: String(values.location || "").trim(),
      estimatedValue: value
    });
    item.collection.history.push({ type: "edited", at: now, note: "Sammlungsangaben manuell korrigiert" });
    state.vaultBusy = item.id;
    state.vaultEditingItem = "";
    await persistItem(item, "Sammlungsangaben");
    const feedbackResult = await submitRecognitionFeedback({
      item,
      predictedIdentity,
      correctedIdentity: identityFromItem(item),
      correctionNote: String(values.correctionNote || "").trim(),
      source: "vault_edit"
    });
    state.vaultBusy = "";
    if (!feedbackResult) state.importStatus = `${item.title} wurde aktualisiert.`;
    render();
  });
  document.querySelectorAll("[data-vault-reidentify]").forEach((button) => button.addEventListener("click", () => {
    const item = state.items.find((entry) => entry.id === button.dataset.vaultReidentify);
    if (!item || collectionStatus(item) !== "owned") return;
    const collection = collectionDefaults(item);
    state.captureDestination = "vault";
    state.captureMode = "single";
    state.vaultReidentifyItem = item.id;
    state.vaultEditingItem = "";
    state.draft = createEmptyDraft(item.boxId || collection.location || boxes[0]?.id || "VLT-001");
    state.draft.barcode = collection.barcode || "";
    state.draft.condition = ["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"].includes(item.condition) ? item.condition : "Gut";
    state.draft.useVisualSearch = true;
    state.recognition = null;
    state.recognitionMeta = null;
    state.view = "vault-scan";
    state.importStatus = "Neu identifizieren: Fotografiere das Exemplar erneut. Die visuelle Produktsuche wird beim ersten Foto zugeschaltet.";
    render();
  }));
  const vaultSearch = document.querySelector("#vault-search");
  vaultSearch?.addEventListener("input", (event) => {
    state.search = event.currentTarget.value;
  });
  vaultSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") render();
  });
  document.querySelector("#vault-entry-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.vaultBusy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const value = Math.max(0, Number(values.estimatedValue || 0));
    const mediaType = String(values.mediaType || "other");
    const item = moveItemToCollection(enrichWorkflow({
      id: makeId(),
      sku: nextVaultSku(),
      boxId: boxes[0]?.id || `${activeOrganization().shortCode || "VLT"}-001`,
      title: String(values.title || "Unbenanntes Sammlungsstück").trim(),
      category: mediaType === "game" ? "Games" : mediaType === "film" ? "Filme" : "Sammlung",
      franchise: String(values.platform || "").trim(),
      condition: String(values.condition || "Gut"),
      completeness: "Noch nicht im Detail erfasst",
      confidence: 100,
      low: value ? Math.round(value * 0.75) : 0,
      fair: value,
      aggressive: value ? Math.round(value * 1.2) : 0,
      channel: "Sammlung",
      stage: "Sammlung",
      weight: 0,
      image: "/app/assets/ramrod-icon-512.png",
      notes: "Privates Sammlungsinventar. Nicht zum Verkauf freigegeben.",
      sourceType: "vault-manual",
      research: []
    }), {
      mediaType,
      platform: String(values.platform || "").trim(),
      edition: String(values.edition || "").trim(),
      barcode: String(values.barcode || "").trim(),
      location: String(values.location || "").trim(),
      estimatedValue: value
    });
    state.vaultBusy = "create";
    state.items.unshift(item);
    state.vaultSelected = item.id;
    state.vaultFormOpen = false;
    state.importStatus = "Sammlungsstück wird gespeichert...";
    render();
    await persistItem(item, "Sammlungsstück");
    state.vaultBusy = "";
    state.importStatus = `${item.title} ist jetzt in deiner Sammlung.`;
    render();
  });
  document.querySelectorAll("[data-vault-import]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.vaultImport);
    if (!item || item.collection || state.vaultBusy) return;
    const activeSale = item.stage === "Gelistet" || item.ebayListing?.status === "active";
    item.collection = collectionDefaults(item, { status: activeSale ? "listed" : "selling" });
    item.collection.history.push({ type: "imported", at: new Date().toISOString(), note: "Aus RAMROD-Bestand übernommen" });
    state.vaultBusy = item.id;
    state.vaultSelected = item.id;
    await persistItem(item, "Sammlungszuordnung");
    state.vaultBusy = "";
    state.importStatus = `${item.title} wurde in den Vault übernommen.`;
    render();
  }));
  document.querySelectorAll("[data-vault-loan]").forEach((button) => button.addEventListener("click", () => {
    state.vaultLoanItem = state.vaultLoanItem === button.dataset.vaultLoan ? "" : button.dataset.vaultLoan;
    render();
  }));
  document.querySelectorAll("[data-vault-loan-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = state.items.find((entry) => entry.id === event.currentTarget.dataset.vaultLoanForm);
    if (!item || state.vaultBusy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const now = new Date().toISOString();
    item.collection = collectionDefaults(item, {
      status: "loaned",
      borrowerName: String(values.borrowerName || "").trim(),
      borrowerContact: String(values.borrowerContact || "").trim(),
      loanedAt: now,
      dueAt: String(values.dueAt || "")
    });
    item.collection.history.push({ type: "loaned", at: now, borrowerName: item.collection.borrowerName, dueAt: item.collection.dueAt });
    state.vaultBusy = item.id;
    state.vaultLoanItem = "";
    await persistItem(item, "Ausleihe");
    state.vaultBusy = "";
    state.importStatus = `${item.title} ist als verliehen markiert.`;
    render();
  }));
  document.querySelectorAll("[data-vault-return]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.vaultReturn);
    if (!item || state.vaultBusy) return;
    const now = new Date().toISOString();
    item.collection = collectionDefaults(item, { status: "owned", returnedAt: now, borrowerName: "", borrowerContact: "", loanedAt: "", dueAt: "" });
    item.collection.history.push({ type: "returned", at: now });
    state.vaultBusy = item.id;
    await persistItem(item, "Rückgabe");
    state.vaultBusy = "";
    state.importStatus = `${item.title} ist wieder zurück in deiner Sammlung.`;
    render();
  }));
  document.querySelectorAll("[data-vault-sell]").forEach((button) => button.addEventListener("click", () => {
    const item = state.items.find((entry) => entry.id === button.dataset.vaultSell);
    if (!item || state.vaultBusy || collectionStatus(item) !== "owned") return;
    state.vaultConfirmSaleItem = item.id;
    state.vaultLoanItem = "";
    render();
  }));
  document.querySelectorAll("[data-vault-sale-abort]").forEach((button) => button.addEventListener("click", () => {
    if (state.vaultConfirmSaleItem !== button.dataset.vaultSaleAbort) return;
    state.vaultConfirmSaleItem = "";
    render();
  }));
  document.querySelectorAll("[data-vault-sale-confirm]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.vaultSaleConfirm);
    if (!item || state.vaultBusy || collectionStatus(item) !== "owned") return;
    const now = new Date().toISOString();
    item.collection = collectionDefaults(item, { status: "selling", saleRequestedAt: now });
    item.collection.history.push({ type: "sale_requested", at: now });
    item.stage = "Freigabe";
    item.channel = "Pruefen";
    item.sourceType = "vault-handoff";
    item.approval = { status: "pending", approvedAt: "", strategyAccepted: false, summary: "" };
    item.ebayDraft = null;
    item.ebayListing = null;
    state.vaultBusy = item.id;
    await persistItem(item, "Verkaufsübergabe");
    state.vaultBusy = "";
    state.vaultConfirmSaleItem = "";
    state.selected = item.id;
    state.view = "review";
    state.importStatus = "Sammlungsstück übergeben. RAMROD prüft jetzt Marktwert, Kanal und Verkaufsstrategie.";
    render();
  }));
  document.querySelectorAll("[data-vault-cancel-sale]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.vaultCancelSale);
    if (!item || state.vaultBusy || item.ebayListing?.status === "active") return;
    const now = new Date().toISOString();
    item.collection = collectionDefaults(item, { status: "owned", saleRequestedAt: "" });
    item.collection.history.push({ type: "sale_cancelled", at: now });
    moveItemToCollection(item);
    state.vaultBusy = item.id;
    await persistItem(item, "Verkaufsübergabe");
    state.vaultBusy = "";
    state.importStatus = `${item.title} bleibt in deiner Sammlung.`;
    render();
  }));
  document.querySelectorAll("[data-vault-open-sale]").forEach((button) => button.addEventListener("click", () => {
    state.selected = button.dataset.vaultOpenSale;
    state.view = "review";
    render();
  }));

  document.querySelector("#invite-member-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.teamLoading) return;
    const formData = new FormData(event.currentTarget);
    state.teamLoading = true;
    state.importStatus = "Sicherer Einladungslink wird erzeugt...";
    render();
    try {
      const result = await postJson("/api/organization-invitations", { email: formData.get("email"), role: formData.get("role") });
      state.inviteResultUrl = result.inviteUrl;
      state.team = null;
      state.teamLoading = false;
      await loadTeamSettings();
      state.importStatus = "Einladung erstellt. Teile jetzt den persönlichen Link.";
    } catch (error) {
      state.teamLoading = false;
      state.importStatus = `Einladung fehlgeschlagen: ${error.message}`;
      render();
    }
  });
  document.querySelector("[data-copy-invite]")?.addEventListener("click", async () => {
    if (!state.inviteResultUrl) return;
    await navigator.clipboard.writeText(state.inviteResultUrl);
    state.importStatus = "Einladungslink kopiert.";
    render();
  });
  document.querySelectorAll("[data-membership-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await patchJson(`/api/organization-memberships/${event.currentTarget.dataset.membershipForm}`, { role: formData.get("role"), status: formData.get("status") });
      state.team = null;
      state.importStatus = "Berechtigung gespeichert.";
      await loadTeamSettings();
    } catch (error) {
      state.importStatus = `Berechtigung konnte nicht gespeichert werden: ${error.message}`;
      render();
    }
  }));
  document.querySelectorAll("[data-invitation-action]").forEach((button) => button.addEventListener("click", async () => {
    try {
      const result = await postJson(`/api/organization-invitations/${button.dataset.invitationId}/${button.dataset.invitationAction}`, {});
      if (result.inviteUrl) state.inviteResultUrl = result.inviteUrl;
      state.team = null;
      state.importStatus = button.dataset.invitationAction === "revoke" ? "Einladung widerrufen." : "Neuer Einladungslink erzeugt.";
      await loadTeamSettings();
    } catch (error) {
      state.importStatus = `Einladung konnte nicht geändert werden: ${error.message}`;
      render();
    }
  }));
  document.querySelector("#channel-settings-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await postJson("/api/organization-channels", { channels: formData.getAll("channels") });
      state.team = null;
      state.importStatus = "Verkaufskanäle vorgemerkt.";
      await loadTeamSettings();
    } catch (error) {
      state.importStatus = `Kanäle konnten nicht gespeichert werden: ${error.message}`;
      render();
    }
  });
  document.querySelector("[data-ebay-defaults-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.ebaySetupBusy) return;
    const values = new FormData(event.currentTarget);
    const settings = {
      postalCode: String(values.get("postalCode") || "").trim(),
      handlingDays: Number(values.get("handlingDays")),
      returnsAccepted: String(values.get("returnsAccepted")) === "true",
      returnDays: Number(values.get("returnDays") || 30),
      returnShippingCostPayer: String(values.get("returnShippingCostPayer") || "BUYER")
    };
    const privateSeller = Boolean(state.agentControl?.ebaySetup?.privateSeller);
    const confirmed = window.confirm(`${privateSeller ? "Diese privaten Verkaufsregeln in RAMROD speichern?" : "Diese Kontoregeln einmalig bei eBay anlegen?"}\n\nVersand: automatische Klassen von 2 bis 31,5 kg\nBearbeitung: ${settings.handlingDays} Werktag(e)\nFreiwillige Rückgabe: ${settings.returnsAccepted ? `Ja, ${settings.returnDays} Tage` : "Nein"}\n\nDer konkrete Versand wird später pro Artikel gewählt. Dabei wird kein Artikel veröffentlicht.`);
    if (!confirmed) return;
    state.ebaySetupBusy = "defaults";
    state.importStatus = privateSeller ? "RAMROD speichert die privaten Verkaufsregeln..." : "RAMROD legt die bestätigten Verkaufsregeln und den Versandstandort bei eBay an...";
    render();
    try {
      const result = await postJson("/api/channel-setup/ebay/defaults", { settings, confirm: true });
      state.agentControl.ebaySetup = result.setup;
      state.importStatus = result.message;
    } catch (error) {
      state.importStatus = `eBay-Regeln konnten nicht angelegt werden: ${error.message}`;
    } finally {
      state.ebaySetupBusy = "";
      render();
    }
  });
  document.querySelector("[data-ebay-returns-select]")?.addEventListener("change", (event) => {
    const visible = event.currentTarget.value === "true";
    document.querySelectorAll("[data-ebay-return-option]").forEach((field) => {
      field.hidden = !visible;
    });
  });
  document.querySelectorAll("[data-ebay-setup-action]").forEach((button) => button.addEventListener("click", async (event) => {
    const action = event.currentTarget.dataset.ebaySetupAction;
    const setup = state.agentControl?.ebaySetup;
    if (!action || !setup || state.ebaySetupBusy) return;

    if (action === "developer") {
      window.open(setup.links?.developerPortal || "https://developer.ebay.com/my/keys", "_blank", "noopener");
      state.importStatus = "eBay Developer ist geöffnet. RAMROD zeigt dir dort als Nächstes nur die nötige Bestätigung.";
      render();
      return;
    }

    if (action === "policies") {
      window.open(setup.links?.sellerPolicies || "https://www.ebay.de/sh/pp", "_blank", "noopener");
      state.importStatus = "eBay-Verkaufsregeln sind geöffnet. Nach dem Speichern klickst du hier nur noch auf „Verbindung prüfen“.";
      state.agentControl.ebaySetup = { ...setup, nextAction: "verify", actionLabel: "Verbindung prüfen" };
      render();
      return;
    }

    state.ebaySetupBusy = action;
    state.importStatus = action === "connect" || action === "reconnect"
      ? "Sichere eBay-Anmeldung wird vorbereitet. Prüfe vor der Freigabe das angezeigte Verkäuferkonto."
      : "RAMROD prüft eBay-Zugriff, Verkaufsregeln und Lagerort...";
    render();
    try {
      if (action === "connect" || action === "reconnect") {
        const result = await postJson("/api/channel-setup/ebay/start", {});
        window.location.assign(result.authorizeUrl);
        return;
      }
      const result = await postJson("/api/channel-setup/ebay/verify", {});
      state.agentControl.ebaySetup = result.setup;
      state.importStatus = result.setup?.ready
        ? "eBay ist vollständig verbunden und für Angebote bereit."
        : "eBay ist verbunden. RAMROD zeigt den nächsten fehlenden Schritt.";
    } catch (error) {
      state.importStatus = `eBay-Einrichtung: ${error.message}`;
    } finally {
      state.ebaySetupBusy = "";
      render();
    }
  }));
  document.querySelectorAll("[data-start-agent]").forEach((button) => button.addEventListener("click", async () => {
    if (state.startingAgent) return;
    const agentType = button.dataset.startAgent;
    state.startingAgent = agentType;
    state.importStatus = "RAMROD plant die Mission und prüft die Sicherheitsgrenzen...";
    render();
    try {
      const result = await postJson("/api/agent-runs", {
        agentType,
        channelId: button.dataset.agentChannel || undefined
      });
      state.agentControl = result.snapshot || state.agentControl;
      state.importStatus = result.approval
        ? "Mission geplant. Vor der ersten externen Aktion ist deine Freigabe nötig."
        : "Mission geplant und zur Ausführung bereit.";
    } catch (error) {
      state.importStatus = `Mission konnte nicht gestartet werden: ${error.message}`;
    } finally {
      state.startingAgent = "";
      render();
    }
  }));
  document.querySelector("[data-channel-onboarding-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.startingAgent) return;
    const formData = new FormData(event.currentTarget);
    const channelId = String(formData.get("channelId") || "").trim();
    const accountEmail = String(formData.get("accountEmail") || "").trim();
    const sellerMode = String(formData.get("sellerMode") || "").trim();
    const accountLabel = String(formData.get("accountLabel") || "").trim();
    if (!channelId || !accountEmail || !sellerMode) {
      state.importStatus = "Bitte Plattform, Kontakt-E-Mail und Verkäuferart ausfüllen.";
      render();
      return;
    }
    state.startingAgent = "onboard_channel_account";
    state.importStatus = "Der Verkaufsleiter plant die Kontoeinrichtung und verteilt die ersten Aufgaben...";
    render();
    try {
      const platform = channelLabel(channelId);
      const result = await postJson("/api/agent-runs", {
        agentType: "onboard_channel_account",
        channelId,
        accountEmail,
        sellerMode,
        accountLabel,
        objective: `${platform}-Verkaufskonto ${accountLabel || accountEmail} vorbereiten, sicher verbinden und den Connector prüfen.`
      });
      state.agentControl = result.snapshot || state.agentControl;
      state.importStatus = result.approval
        ? `${platform}-Einrichtung geplant. Der Agent arbeitet bis zum ersten persönlichen Freigabepunkt.`
        : `${platform}-Einrichtung wurde dem Agententeam übergeben.`;
    } catch (error) {
      state.importStatus = `Kontoeinrichtung konnte nicht gestartet werden: ${error.message}`;
    } finally {
      state.startingAgent = "";
      render();
    }
  });
  document.querySelectorAll("[data-agent-decision]").forEach((button) => button.addEventListener("click", async () => {
    const approvalId = button.dataset.approvalId;
    if (!approvalId || state.decidingApproval) return;
    state.decidingApproval = approvalId;
    state.importStatus = button.dataset.agentDecision === "approve" ? "Freigabe wird protokolliert..." : "Mission wird gestoppt...";
    render();
    try {
      const result = await postJson(`/api/approvals/${approvalId}/${button.dataset.agentDecision}`, {});
      state.agentControl = result.snapshot || state.agentControl;
      state.importStatus = button.dataset.agentDecision === "approve"
        ? "Aktion freigegeben. Der Agent darf bis zum nächsten Kontrollpunkt fortfahren."
        : "Aktion abgelehnt. Die Mission wurde gestoppt.";
    } catch (error) {
      state.importStatus = `Entscheidung konnte nicht gespeichert werden: ${error.message}`;
    } finally {
      state.decidingApproval = "";
      render();
    }
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
  document.querySelectorAll("[data-toggle-review-item]").forEach((button) => button.addEventListener("click", () => {
    const itemId = button.dataset.toggleReviewItem;
    state.mobileReviewItem = state.mobileReviewItem === itemId ? "" : itemId;
    state.selected = itemId;
    render();
  }));
  document.querySelectorAll("[data-archive-item]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.archiveItem);
    if (!item || isArchived(item)) return;
    item.archivedFromStage = item.stage || "Gescannt";
    item.archivedAt = new Date().toISOString();
    item.archiveReason = "Nicht mehr für den Verkauf vorgesehen";
    item.stage = "Archiviert";
    state.mobileReviewItem = "";
    state.mobileDetailsItem = "";
    state.selected = visibleItems().find((entry) => entry.id !== item.id)?.id || "";
    await persistItem(item, "Archivstatus");
    state.importStatus = `${item.sku} wurde archiviert und aus allen Verkaufslisten entfernt.`;
    render();
  }));
  document.querySelectorAll("[data-restore-item]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.restoreItem);
    if (!item || !isArchived(item)) return;
    item.stage = item.archivedFromStage || (item.approval?.status === "approved" ? "Verkaufsbereit" : "Freigabe");
    item.restoredAt = new Date().toISOString();
    item.archivedAt = "";
    item.archiveReason = "";
    state.selected = item.id;
    await persistItem(item, "Archivstatus");
    state.importStatus = `${item.sku} wurde wiederhergestellt.`;
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
    const details = button.closest(".sales-strategy-card")?.querySelector(".release-fields")
      || button.closest(".inspector-content")?.querySelector(".release-fields");
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => details.querySelector(".field.missing input, .field.missing select, input, select")?.focus());
  }));
  document.querySelectorAll("[data-focus-channel-picker]").forEach((button) => button.addEventListener("click", () => {
    button.closest(".inspector-content")?.querySelector(".channel-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  document.querySelectorAll("[data-focus-ebay-card]").forEach((button) => button.addEventListener("click", () => {
    button.closest(".inspector-content")?.querySelector(".ebay-draft-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  document.querySelectorAll("[data-photo-camera]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#photo")?.click();
  }));
  document.querySelectorAll("[data-photo-upload]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#photo-upload")?.click();
  }));
  document.querySelectorAll("[data-complete-photo-set]").forEach((button) => button.addEventListener("click", () => {
    if (!state.recognition) return;
    state.draft.photoSetComplete = true;
    const currentEvidence = state.recognition.evidence || {};
    const manualIdentityRequired = state.captureDestination === "vault"
      && (Boolean(currentEvidence.categoryConflict) || Boolean(currentEvidence.mediaFormatMissing) || Number(currentEvidence.score || 0) < 55);
    state.draft.manualIdentityConfirmed = false;
    state.recognition.evidence = {
      ...currentEvidence,
      originalStatus: state.recognition.evidence?.originalStatus || state.recognition.evidence?.status || "needs_more_evidence",
      status: "manual_review_ready",
      operatorPhotoComplete: true,
      manualIdentityRequired,
      releaseGate: "blocked_until_manual_confirmation",
      autoApprovalEligible: false
    };
    state.importStatus = state.captureDestination === "vault"
      ? manualIdentityRequired
        ? "Fotosatz abgeschlossen. Bitte den sichtbaren Titel und das Medienformat einmal korrigieren oder bestätigen."
        : "Fotosatz abgeschlossen. RAMROD kann das Stück jetzt ins Inventar übernehmen. Ein Verkauf wird nicht gestartet."
      : "Fotosatz abgeschlossen. RAMROD recherchiert jetzt Preis und Kanal; offene Merkmale bestätigst du vor der Freigabe.";
    render();
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
  document.querySelectorAll("[data-ebay-sale-mode]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.itemId);
    const mode = button.dataset.ebaySaleMode;
    if (!item || !["fixed_price", "auction_1_euro"].includes(mode)) return;
    if (["prepared", "active"].includes(item.ebayListing?.status)) {
      state.importStatus = "Die Verkaufsart kann nach der eBay-Vorbereitung nicht mehr geändert werden.";
      render();
      return;
    }
    if (ebaySaleModeFor(item) === mode) return;
    item.ebaySaleMode = mode;
    item.salesStrategy = {
      ...(item.salesStrategy || {}),
      salesFormat: mode === "auction_1_euro" ? "auction" : "fixed_price"
    };
    item.ebayDraft = null;
    item.ebayListing = null;
    const message = mode === "auction_1_euro"
      ? "Auktion ab 1 € gewählt. Erzeuge jetzt die eBay-Vorschau neu; der Marktwert bleibt als Orientierung erhalten."
      : "Festpreis gewählt. Erzeuge jetzt die eBay-Vorschau neu.";
    await persistItem(item, "eBay-Verkaufsart");
    state.importStatus = message;
    render();
  }));
  document.querySelectorAll("[data-ebay-draft]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.ebayDraft);
    if (!item || state.ebayDrafting) return;
    state.ebayDrafting = item.id;
    state.importStatus = "RAMROD optimiert Titel, Kategorie und Käufertext und prüft die eBay-Regeln...";
    render();
    try {
      const result = await postJson("/api/ebay-draft", { item });
      item.ebayDraft = result.ebayDraft;
      item.ebayListing = null;
      state.selected = item.id;
      state.view = "inventory";
      state.mobileDetailsItem = item.id;
      state.importStatus = result.ebayDraft?.status === "ready_for_ebay"
        ? "eBay-Vorschau vollständig. Prüfe sie und lege danach den unveröffentlichten Entwurf bei eBay an."
        : "eBay-Vorschau erzeugt. Ergänze die markierten Pflichtangaben.";
      await persistItem(item, "eBay-Vorschau");
    } catch (error) {
      state.importStatus = `eBay-Vorschau fehlgeschlagen: ${error.message}`;
    } finally {
      state.ebayDrafting = "";
      render();
    }
  }));
  document.querySelectorAll("[data-listing-copy-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = state.items.find((entry) => entry.id === form.dataset.listingCopyForm);
    if (!item || state.ebayDrafting || ["prepared", "active"].includes(item.ebayListing?.status)) return;
    const values = Object.fromEntries(new FormData(form).entries());
    item.listingCopyAnswers = {
      ...(item.listingCopyAnswers || {}),
      ...Object.fromEntries(Object.entries(values).map(([name, value]) => [name, String(value).trim()]).filter(([, value]) => value))
    };
    state.ebayDrafting = item.id;
    state.importStatus = "Der Listing-Redakteur schreibt den Text mit den neuen Angaben neu...";
    render();
    try {
      const result = await postJson("/api/ebay-draft", { item: { ...item, ebayDraft: null } });
      item.ebayDraft = result.ebayDraft;
      state.importStatus = result.ebayDraft?.copyAgent?.status === "ready"
        ? "Der Listing-Redakteur hat einen verkaufsfertigen Text erstellt."
        : "Text neu erstellt. Prüfe bitte die weiterhin markierten Angaben.";
      await persistItem(item, "Listing-Text");
    } catch (error) {
      state.importStatus = `Text-Agent fehlgeschlagen: ${error.message}`;
    } finally {
      state.ebayDrafting = "";
      render();
    }
  }));
  document.querySelectorAll("[data-ebay-missing-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = state.items.find((entry) => entry.id === form.dataset.ebayMissingForm);
    if (!item?.ebayDraft) return;
    const values = Object.fromEntries(new FormData(form).entries());
    item.ebayDraft.itemSpecifics = { ...(item.ebayDraft.itemSpecifics || {}) };
    Object.entries(values).forEach(([name, value]) => {
      if (String(value).trim()) item.ebayDraft.itemSpecifics[name] = [String(value).trim()];
    });
    item.ebayDraft.missingAspects = (item.ebayDraft.missingAspects || []).filter((entry) => !item.ebayDraft.itemSpecifics[entry.name]?.[0]);
    const aspectStep = item.ebayDraft.readiness.find((entry) => entry.id === "aspects");
    if (aspectStep) {
      aspectStep.ready = item.ebayDraft.missingAspects.length === 0;
      aspectStep.detail = aspectStep.ready ? "Vollständig" : `Fehlt: ${item.ebayDraft.missingAspects.map((entry) => entry.name).join(", ")}`;
    }
    item.ebayDraft.status = item.ebayDraft.readiness.every((entry) => entry.ready) ? "ready_for_ebay" : "needs_input";
    state.importStatus = item.ebayDraft.status === "ready_for_ebay"
      ? "Alle eBay-Pflichtmerkmale sind ergänzt. Die Vorschau ist bereit."
      : "Merkmale gespeichert. Es fehlen noch Angaben.";
    await persistItem(item, "eBay-Pflichtmerkmale");
    render();
  }));
  document.querySelectorAll("[data-ebay-prepare]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.ebayPrepare);
    if (!item?.ebayDraft || state.ebayPreparing) return;
    state.ebayPreparing = item.id;
    state.importStatus = "Fotos und Artikeldaten werden sicher zu eBay übertragen. Das Angebot bleibt noch unsichtbar.";
    render();
    try {
      const result = await postJson("/api/ebay-listing/prepare", { item });
      item.ebayListing = { ...result.listing, status: "prepared" };
      item.stage = "Verkaufsbereit";
      state.importStatus = result.message || "Unveröffentlichter eBay-Entwurf angelegt.";
      await persistItem(item, "eBay-Angebot vorbereitet");
    } catch (error) {
      state.importStatus = `eBay konnte den Entwurf nicht anlegen: ${error.message}`;
    } finally {
      state.ebayPreparing = "";
      render();
    }
  }));
  document.querySelectorAll("[data-ebay-publish]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.ebayPublish);
    if (!item?.ebayListing || state.ebayPublishing) return;
    const sellerAccount = item.ebayListing?.payload?.seller?.userId || item.ebayListing?.seller?.userId || "verbundenes eBay-Konto";
    const auction = item.ebayDraft?.salesFormat === "auction";
    const priceLine = auction
      ? `Auktion ab ${euro(item.ebayDraft?.startPrice || 1)} · 7 Tage · ohne Mindestpreis\nGeschätzter Marktwert: ${euro(item.ebayDraft?.marketValue || item.fair)}`
      : `Festpreis: ${euro(item.ebayDraft?.price || item.fair)}`;
    const confirmed = window.confirm(`Jetzt wirklich live auf eBay veröffentlichen?\n\n${item.ebayDraft?.title || item.title}\n${priceLine}\nVerkäufer: ${sellerAccount}\n\nDas Angebot ist danach öffentlich und kann gekauft werden.`);
    if (!confirmed) return;
    state.ebayPublishing = item.id;
    state.importStatus = "eBay veröffentlicht das Angebot...";
    render();
    try {
      const result = await postJson("/api/ebay-listing/publish", {
        item: { dbId: item.dbId || "", sku: item.sku },
        confirm: true
      });
      item.ebayListing = { ...item.ebayListing, ...result.listing, listingId: result.listingId, url: result.url, status: "active" };
      item.stage = "Gelistet";
      state.importStatus = result.message || "Der Artikel ist jetzt live bei eBay.";
      await persistItem(item, "eBay-Angebot veröffentlicht");
    } catch (error) {
      if (error.status === 409 && /unveröffentlichten eBay-Entwurf/i.test(error.message)) {
        item.ebayListing = null;
        item.stage = "Verkaufsbereit";
        state.importStatus = "Der lokale eBay-Status war veraltet und wurde korrigiert. Nutze oben als Nächstes „Bei eBay vorbereiten“.";
        await persistItem(item, "eBay-Status korrigiert").catch(() => {});
      } else {
        state.importStatus = `eBay-Veröffentlichung fehlgeschlagen: ${error.message}`;
      }
    } finally {
      state.ebayPublishing = "";
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
        ? item.ebayDraft?.status === "ready_for_ebay"
          ? `${item.sku} freigegeben. Die RAMROD-Vorschau ist vollständig; noch wurde nichts zu eBay übertragen.`
          : `${item.sku} freigegeben. Die RAMROD-Vorschau zeigt noch offene eBay- oder Kontoeinstellungen.`
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
      if (id === "query" && state.recognition?.evidence?.manualIdentityRequired) {
        const suggestion = String(state.recognition?.identity?.title || "").trim().toLowerCase();
        const correction = String(event.target.value || "").trim().toLowerCase();
        state.draft.manualIdentityConfirmed = correction.length >= 3 && correction !== suggestion;
        const addButton = document.querySelector("#add-item");
        if (addButton) addButton.disabled = !state.draft.manualIdentityConfirmed;
      }
    });
    if (input && id === "query") input.addEventListener("change", render);
  });

  ["boxId", "condition"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (input) input.addEventListener("change", (event) => {
      state.draft[id] = event.target.value;
      render();
    });
  });

  const photoInputs = document.querySelectorAll("#photo, #photo-upload");
  photoInputs.forEach((photoInput) => photoInput.addEventListener("change", async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    await addPhotosToDraft(files);
  }));

  document.querySelectorAll("[data-remove-photo]").forEach((button) => button.addEventListener("click", async () => {
    const index = Number(button.dataset.removePhoto);
    state.recognitionRequestId += 1;
    state.draft.photos = (state.draft.photos || []).filter((_, photoIndex) => photoIndex !== index);
    state.draft.photo = state.draft.photos[0]?.dataUrl || "";
    state.draft.photoSetComplete = false;
    state.draft.recognitionCorrection = null;
    if (state.draft.useVisualSearch && index === 0) {
      state.draft.visualMatchesSearched = false;
      state.draft.visualMatches = [];
    }
    state.recognition = null;
    state.recognitionMeta = null;
    state.importStatus = state.draft.photos.length ? "Foto entfernt. Identität wird neu geprüft." : "Alle Fotos entfernt.";
    render();
    if ((state.captureMode === "single" || state.view === "vault-scan") && state.draft.photos.length) await runFastRecognition();
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
      state.importStatus = state.captureDestination === "vault"
        ? (usedLiveAi ? "Identität und Zustand werden für dein Inventar aufbereitet..." : "Sammlungsstück wird vorbereitet...")
        : usedLiveAi
          ? "Identität wird mit Markt, Zustand und Verkaufsstrategie angereichert..."
          : "Kein Foto vorhanden, nutze lokalen Demo-Vorschlag.";
      render();
      const vaultCapture = state.captureDestination === "vault";
      let deferredAnalysisError = null;
      let recognitionFeedback = null;
      const operatorCorrection = state.draft.recognitionCorrection;
      let item;
      if (usedLiveAi && vaultCapture) {
        item = inventoryItemFromRecognition(state.draft, state.recognition);
      } else if (usedLiveAi) {
        try {
          item = enrichWorkflow(await analyzeWithApi());
        } catch (error) {
          deferredAnalysisError = error;
          item = salesItemFromRecognition(state.draft, state.recognition, error);
        }
      } else {
        item = enrichWorkflow(analyze());
      }
      item.recognition = state.recognition;
      item.recognitionEvidence = state.recognition?.evidence || null;
      if (vaultCapture) {
        const existingIndex = state.items.findIndex((entry) => entry.id === state.vaultReidentifyItem);
        if (existingIndex >= 0) {
          const previous = state.items[existingIndex];
          const previousCollection = collectionDefaults(previous);
          const identity = state.recognition?.identity || {};
          const now = new Date().toISOString();
          item = {
            ...previous,
            ...item,
            id: previous.id,
            dbId: previous.dbId,
            sku: previous.sku,
            boxId: previous.boxId,
            recognition: state.recognition,
            recognitionEvidence: state.recognition?.evidence || null
          };
          item = moveItemToCollection(item, {
            ...previousCollection,
            status: "owned",
            mediaType: inferMediaType(item),
            platform: identity.platform || item.franchise || previousCollection.platform,
            edition: identity.edition || previousCollection.edition,
            barcode: state.draft.barcode || item.barcode || previousCollection.barcode,
            location: previousCollection.location || previous.boxId,
            estimatedValue: Number(item.fair || previousCollection.estimatedValue || 0),
            capturedViews: state.draft.photos?.length || 1,
            recognitionSource: state.recognitionMeta?.provider || item.sourceType || "visual-search",
            history: [...previousCollection.history, { type: "reidentified", at: now, previousTitle: previous.title, newTitle: item.title, method: state.draft.visualMatches?.length ? "visual-search-plus-ai" : "ai-rescan" }]
          });
          recognitionFeedback = {
            predictedIdentity: identityFromItem(previous),
            correctedIdentity: identityFromItem(item),
            correctionNote: state.draft.query ? `Neuidentifikation mit Bedienerhinweis: ${state.draft.query}` : "Neuidentifikation mit weiteren Produktfotos",
            source: "vault_reidentify"
          };
          state.items[existingIndex] = item;
        } else {
          const identity = state.recognition?.identity || {};
          item = moveItemToCollection(item, {
            mediaType: inferMediaType(item),
            platform: identity.platform || item.franchise || "",
            edition: identity.edition || "",
            barcode: state.draft.barcode || item.barcode || "",
            capturedViews: state.draft.photos?.length || 1,
            enrichment: { status: "pending", sources: [], enrichedAt: "" }
          });
          state.items.unshift(item);
        }
      } else {
        state.items.unshift(item);
      }
      if (operatorCorrection) {
        recognitionFeedback = {
          predictedIdentity: operatorCorrection.predictedIdentity,
          correctedIdentity: operatorCorrection.correctedIdentity,
          correctionNote: operatorCorrection.correctionNote,
          source: vaultCapture ? "vault_scan_correction" : "sales_scan_correction"
        };
      }
      state.selected = item.id;
      if (state.captureDestination === "vault") state.vaultSelected = item.id;
      const reidentified = Boolean(state.vaultReidentifyItem);
      state.draft = createEmptyDraft(state.draft.boxId);
      state.recognition = null;
      state.recognitionMeta = null;
      state.vaultReidentifyItem = "";
      state.view = state.captureDestination === "vault" ? "vault" : "review";
      state.importStatus = state.captureDestination === "vault"
        ? reidentified
          ? "Identität aktualisiert. SKU, Besitzstatus und Historie des Sammlungsstücks wurden beibehalten."
          : "Artikel erkannt und in deiner Sammlung gespeichert. Er wird erst nach deiner ausdrücklichen Übergabe verkauft."
        : deferredAnalysisError
          ? "Artikel erkannt und mit vorläufigem Preis gespeichert. Marktquellen, Kanal und Verkaufsstrategie werden in der Prüfung nachgeholt."
          : usedLiveAi
            ? "Artikel erkannt und Verkaufsstrategie erstellt. Der Marktcheck läuft automatisch; danach kannst du freigeben."
          : "Demo-Artikelkarte und Verkaufsstrategie erzeugt.";
      await persistItem(item, "Artikel");
      if (recognitionFeedback) await submitRecognitionFeedback({ item, ...recognitionFeedback });
    } catch (error) {
      state.importStatus = liveAnalysisErrorMessage(error);
    } finally {
      state.analyzing = false;
      render();
    }
  });

  const reset = document.querySelector("#reset");
  if (reset) reset.addEventListener("click", () => {
    state.recognitionRequestId += 1;
    const reidentifyItem = state.items.find((item) => item.id === state.vaultReidentifyItem);
    const reidentifyCollection = reidentifyItem ? collectionDefaults(reidentifyItem) : null;
    state.draft = createEmptyDraft(state.draft.boxId);
    if (reidentifyItem) {
      state.draft.barcode = reidentifyCollection.barcode || "";
      state.draft.condition = ["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollständig", "Defekt"].includes(reidentifyItem.condition) ? reidentifyItem.condition : "Gut";
      state.draft.useVisualSearch = true;
    }
    state.recognition = null;
    state.recognitionMeta = null;
    state.importStatus = reidentifyItem ? "Neue Fotos für die erneute Identifikation bereit." : "Neue Erfassung bereit.";
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
  return readJsonResponse(response);
}

async function postJson(url, payload) {
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJsonResponse(response);
}

async function patchJson(url, payload) {
  const response = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJsonResponse(response);
}

async function fetchPublicJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  return readJsonResponse(response);
}

async function readJsonResponse(response) {
  const text = await response.text();
  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    const message = response.status === 413
      ? "Die Anfrage war zu groß. RAMROD sendet beim nächsten Versuch nur noch die Artikelreferenz."
      : response.status >= 500
        ? `Der RAMROD-Server ist momentan nicht erreichbar oder hat die Anfrage abgebrochen (HTTP ${response.status}).`
        : `Der Server hat keine gültige Antwort geliefert (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
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

async function signUpWithPassword(email, password, name) {
  const config = state.runtimeConfig;
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error("Supabase Auth ist nicht konfiguriert.");
  const response = await fetch(`${config.supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(`${window.location.origin}/${state.invitationToken ? `?invite=${state.invitationToken}` : ""}`)}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password, data: { name } })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.msg || result.error_description || result.message || "Konto konnte nicht angelegt werden.");
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
  state.importStatus = state.draft.useVisualSearch && !state.draft.visualMatchesSearched
    ? "Visuelle Produktsuche gestartet: Das Foto wird mit Produktbildern abgeglichen..."
    : "Schnellerkennung gestartet: Text und Identität werden gelesen...";
  render();
  try {
    if (state.draft.useVisualSearch && !state.draft.visualMatchesSearched) {
      try {
        const visualResult = await postJson("/api/visual-match", {
          imageDataUrl: photos[0].dataUrl,
          query: state.draft.query
        });
        state.draft.visualMatches = Array.isArray(visualResult.matches) ? visualResult.matches : [];
        state.draft.visualSearchWarning = "";
      } catch (error) {
        state.draft.visualMatches = [];
        state.draft.visualSearchWarning = error.message;
      } finally {
        state.draft.visualMatchesSearched = true;
      }
      if (requestId !== state.recognitionRequestId) return null;
      state.importStatus = state.draft.visualMatches.length
        ? `${state.draft.visualMatches.length} Bildsuchkandidaten gefunden. KI gleicht jetzt Text, Barcode und Produktform ab...`
        : "Bildsuche ohne eindeutigen Treffer. KI prüft jetzt Text, Barcode und Produktform...";
      render();
    }
    const response = await apiFetch("/api/recognize-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl: photos[0].dataUrl,
        imageDataUrls: photos.map((photo) => photo.dataUrl),
        clientImageQualities: photos.map((photo) => photo.quality || null),
        captureIntent: captureIntent(),
        barcode: state.draft.barcode,
        query: state.draft.query,
        visualMatches: state.draft.visualMatches || []
      })
    });
    const payload = await readJsonResponse(response);
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
    state.draft.manualIdentityConfirmed = false;
    if (!state.draft.barcode) {
      const barcodeIdentifier = (result.recognition?.identifiers || []).find((entry) =>
        /barcode|ean|upc|gtin/i.test(String(entry?.type || ""))
        || /^\d{8,14}$/.test(String(entry?.value || "").replace(/\s/g, ""))
      );
      if (barcodeIdentifier?.value) state.draft.barcode = String(barcodeIdentifier.value).replace(/\s/g, "");
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
      query: state.draft.query,
      captureIntent: captureIntent(),
      recognition: state.recognition
    })
  });
  const payload = await readJsonResponse(response);
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
    live_recognition: "Quelle: Schnellerkennung · Marktcheck offen",
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
