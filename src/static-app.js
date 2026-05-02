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

const primaryChannels = [
  { id: "eBay", label: "eBay", status: "bereit", note: "API geplant" },
  { id: "Whatnot", label: "Whatnot", status: "bereit", note: "Show-Batch" },
  { id: "Strongvision", label: "Strongvision", status: "bereit", note: "Website/DB" }
];

const futureChannels = [
  "Shopify Hub",
  "WooCommerce",
  "Kaufland",
  "Amazon",
  "Hood.de",
  "Etsy",
  "BrickLink",
  "Cardmarket",
  "Discogs",
  "Kleinanzeigen",
  "Facebook Marketplace",
  "Vinted",
  "Catawiki",
  "Liquidation Basket"
].map((label) => ({ id: label, label, status: "noch nicht verfuegbar", note: "Roadmap" }));

const state = {
  view: "scan",
  selected: "itm-001",
  search: "",
  importStatus: "Lade lokale App...",
  channelPlan: null,
  persistence: { configured: false, writable: false },
  showAllChannels: false,
  analyzing: false,
  priceChecking: "",
  ebayDrafting: "",
  draft: {
    query: "",
    boxId: "SV-001",
    condition: "Gut",
    completeness: "Ungeprueft, Fotos vorhanden",
    barcode: "",
    photo: "",
    weight: "0.25"
  },
  items: normalizeItems(loadStoredItems())
};

const app = document.querySelector("#app");
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const icon = (label) => `<span class="mini-icon" aria-hidden="true">${label}</span>`;
const saveLocal = () => localStorage.setItem("creators-scanapp-items", JSON.stringify(state.items));
const save = saveLocal;

window.addEventListener("error", (event) => {
  const message = event.error?.message || event.message || "Unbekannter Frontend-Fehler";
  app.innerHTML = `<section class="workspace"><div class="status-strip">RAMROD konnte nicht starten: ${escapeHtml(message)}. Versuche /?reset=1 oder lade hart neu.</div></section>`;
});

function loadStoredItems() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") {
    localStorage.removeItem("creators-scanapp-items");
    return seedItems;
  }

  try {
    return JSON.parse(localStorage.getItem("creators-scanapp-items") || "null") || seedItems;
  } catch (error) {
    localStorage.removeItem("creators-scanapp-items");
    return seedItems;
  }
}

function nextSku(boxId) {
  return `${boxId}-${String(state.items.filter((item) => item.boxId === boxId).length + 1).padStart(4, "0")}`;
}

function analyze(draft = state.draft) {
  const text = `${draft.query} ${draft.barcode}`.toLowerCase();
  const hint = hints.find((entry) => entry.tokens.some((token) => text.includes(token))) || hints[2];
  const incomplete = draft.condition === "Unvollstaendig" || draft.condition === "Defekt";
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
    notes: confidence < 65 ? "KI ist unsicher. Variante, Zustand und Vergleichspreise vor Listing manuell pruefen." : "Listing-Entwurf bereit. Titel, Zustand und Versandgewicht vor Publikation bestaetigen.",
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
    whatnotScript: item.whatnotScript || scriptForWhatnot(item, whatnot, showLotType)
  };
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
  if (showLotType === "premium") return "Vor Live-Verkauf durch Reviewer bestaetigen und als Highlight spaeter in der Show platzieren.";
  if (showLotType === "bundle") return `Mit aehnlichen Artikeln aus ${whatnot.label} buendeln, wenn Fair Value unter 12 EUR bleibt.`;
  return `Als Einzel-Lot in ${whatnot.label}; thematisch neben aehnliche Artikel sortieren.`;
}

function scriptForWhatnot(item, whatnot, showLotType) {
  const start = Math.max(1, Math.round((Number(item.low) || Number(item.fair) || 1) * 0.65));
  const type = showLotType === "premium" ? "Highlight-Lot" : showLotType === "bundle" ? "Bundle-Lot" : "Einzel-Lot";
  return `${type} fuer ${whatnot.label}. Start bei ${euro(start)}. Fair Value ${euro(Number(item.fair) || 0)}. Zustand: ${item.condition || "siehe Fotos"}. ${item.completeness || "Vollstaendigkeit pruefen."} Besonderheiten kurz zeigen und bei Unsicherheit als Review-Hinweis nennen.`;
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
  render();
  try {
    const payload = await fetchJson("/api/app-state");
    state.persistence = payload.persistence || state.persistence;

    if (payload.boxes?.length) {
      boxes = payload.boxes;
    }

    if (payload.items?.length) {
      state.items = normalizeItems(payload.items);
      state.selected = state.items[0]?.id || "";
      saveLocal();
      state.importStatus = `Supabase verbunden: ${payload.items.length} Artikel geladen${state.persistence.writable ? " und schreibbereit" : ", aktuell nur lesend"}.`;
    } else if (state.persistence.writable) {
      state.importStatus = "Supabase verbunden und schreibbereit. Noch keine Artikel in der Datenbank, lokale Demo bleibt sichtbar.";
    } else if (state.persistence.configured) {
      state.importStatus = "Supabase erreichbar, aber noch ohne Service-Role-Key nur eingeschraenkt nutzbar. Lokale Demo bleibt sichtbar.";
    } else {
      state.importStatus = "Lokaler Modus: Supabase ist nicht konfiguriert.";
    }
  } catch (error) {
    state.importStatus = `Supabase Laden fehlgeschlagen: ${error.message}. Lokale Demo bleibt sichtbar.`;
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
    state.importStatus = `${action} in Supabase gespeichert.`;
    saveLocal();
    return result.item || item;
  } catch (error) {
    state.importStatus = `${action} lokal gespeichert, Supabase Sync fehlgeschlagen: ${error.message}`;
    return null;
  }
}

async function persistItems(items, action = "Artikel") {
  saveLocal();
  if (!state.persistence?.writable) return;

  const results = await Promise.allSettled(items.map((item) => persistItem(item, action)));
  const failed = results.filter((result) => result.status === "rejected").length;
  state.importStatus = failed
    ? `${items.length - failed}/${items.length} ${action} in Supabase gespeichert.`
    : `${items.length} ${action} in Supabase gespeichert.`;
  render();
}

function isWhatnotCandidate(item) {
  if (item.channel === "Problemfall" || item.channel === "Pruefen") return false;
  const text = [item.title, item.category, item.franchise].filter(Boolean).join(" ").toLowerCase();
  const tokens = ["pokemon", "karte", "tcg", "game", "spiel", "dreamcast", "atari", "xbox", "ps4", "ps5", "ps3", "comic", "figur", "figure", "star wars", "star trek", "anime", "mario"];
  return tokens.some((token) => text.includes(token));
}

function markWhatnotCandidates() {
  state.items = state.items.map((item) => isWhatnotCandidate(item)
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

function render() {
  const selected = state.items.find((item) => item.id === state.selected) || state.items[0];
  const stats = {
    count: state.items.length,
    value: state.items.reduce((sum, item) => sum + item.fair, 0),
    auto: state.items.filter((item) => item.confidence >= 70).length,
    review: state.items.filter((item) => item.channel === "Pruefen").length,
    whatnot: state.items.filter((item) => item.whatnotEligible || item.channel === "Whatnot").length,
    campaigns: buildWhatnotCampaigns(state.items).length
  };

  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><img class="brand-logo" src="/app/assets/ramrod-icon.png" alt="" /><div><strong><span>R</span>AMROD</strong><small>CREATORS Intake</small></div></div>
      <nav class="nav-list" aria-label="Arbeitsbereiche">
        ${navButton("scan", "SC", "Scan")}
        ${navButton("inventory", "BX", "Bestand")}
        ${navButton("routing", "RT", "Routing")}
        ${navButton("campaigns", "WN", "Kampagnen")}
        ${navButton("shipping", "VS", "Versand")}
      </nav>
      <div class="box-stack"><div class="section-label">Kisten</div>${boxes.map(boxButton).join("")}</div>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div><p>Strongvision Workflow</p><h1>RAMROD Intake Console</h1></div>
        <div class="topbar-actions">
          <button class="secondary-action" id="load-ai-import" type="button">${icon("AI")}AI Import laden</button>
          <button class="secondary-action" id="load-channel-plan" type="button">${icon("RT")}Channel Plan</button>
          <div class="search-box">${icon("SU")}<input id="search" value="${escapeHtml(state.search)}" placeholder="SKU, Titel, Plattform..." /></div>
        </div>
      </header>
      ${state.importStatus ? `<div class="status-strip">${escapeHtml(state.importStatus)}</div>` : ""}
      <section class="metrics" aria-label="Kennzahlen">
        ${metric("AR", "Artikel", stats.count)}
        ${metric("AI", "KI-Autoquote", `${Math.round((stats.auto / stats.count) * 100)}%`)}
        ${metric("PR", "Pruefen", stats.review)}
        ${metric("WN", "Whatnot", `${stats.whatnot}/${stats.campaigns}`)}
        ${metric("EU", "Fair Value", euro(stats.value))}
      </section>
      ${viewMarkup(selected)}
    </section>`;

  bindEvents();
}

function navButton(id, iconLabel, label) {
  return `<button class="nav-button ${state.view === id ? "active" : ""}" data-view="${id}" type="button" title="${label}">${icon(iconLabel)}<span>${label}</span></button>`;
}

function boxButton(box) {
  return `<button class="box-row ${state.draft.boxId === box.id ? "selected" : ""}" data-box="${box.id}" type="button"><span><strong>${box.id}</strong><small>${box.location}</small></span><span>›</span></button>`;
}

function viewMarkup(selected) {
  if (state.view === "scan") return scanView();
  if (state.view === "routing") return routingView();
  if (state.view === "campaigns") return campaignsView();
  if (state.view === "shipping") return shippingView();
  return inventoryView(selected);
}

function scanView() {
  const preview = analyze();
  return `<section class="work-grid">
    <div class="scan-panel">
      <div class="panel-heading"><div><p>Intake</p><h2>Artikel scannen</h2></div><button class="icon-button" id="reset" title="Neue Erfassung">${icon("NE")}</button></div>
      <label class="photo-drop">${state.draft.photo ? `<img src="${state.draft.photo}" alt="Artikelvorschau" />` : `<span>${icon("KA")}<strong>Foto aufnehmen oder hochladen</strong></span>`}<input id="photo" accept="image/*" type="file" /></label>
      <div class="form-grid">
        ${field("Artikelhinweis", `<input id="query" value="${escapeHtml(state.draft.query)}" placeholder="z.B. Pokemon Display, DS Spiel, Anime Figur" />`)}
        ${field("Barcode / Seriennummer", `<div class="input-with-icon">${icon("BC")}<input id="barcode" value="${escapeHtml(state.draft.barcode)}" placeholder="optional" /></div>`)}
        ${field("Kiste", `<select id="boxId">${boxes.map((box) => `<option ${box.id === state.draft.boxId ? "selected" : ""}>${box.id}</option>`).join("")}</select>`)}
        ${field("Zustand", `<select id="condition">${["Neu", "Sehr gut", "Gut", "Gebraucht", "Unvollstaendig", "Defekt"].map((value) => `<option ${value === state.draft.condition ? "selected" : ""}>${value}</option>`).join("")}</select>`)}
        ${field("Gewicht kg", `<div class="input-with-icon">${icon("KG")}<input id="weight" value="${escapeHtml(state.draft.weight)}" inputmode="decimal" /></div>`)}
        ${field("Vollstaendigkeit", `<input id="completeness" value="${escapeHtml(state.draft.completeness)}" />`)}
      </div>
      <button class="primary-action" id="add-item" type="button">${icon("AI")}${state.analyzing ? "Analysiere Foto..." : "KI-Vorschlag erzeugen"}</button>
    </div>
    <div class="ai-panel">
      <div class="panel-heading"><div><p>AI Copilot</p><h2>Vorschau</h2></div>${icon("AI")}</div>
      <div class="price-range"><span>${euro(preview.low)}</span><strong>${euro(preview.fair)}</strong><span>${euro(preview.aggressive)}</span></div>
      <div class="confidence"><span style="width:${preview.confidence}%"></span></div>
      <div class="suggestion-list">${suggestion("Kategorie", preview.category)}${suggestion("Franchise", preview.franchise)}${suggestion("Routing", preview.channel)}${suggestion("SKU", preview.sku)}</div>
      <div class="callout">${icon("IN")}<p>${preview.notes}</p></div>
    </div>
  </section>`;
}

function field(label, control) {
  return `<label class="field"><span>${label}</span>${control}</label>`;
}

function inventoryView(selected) {
  const needle = state.search.toLowerCase();
  const filtered = state.items.filter((item) => [item.title, item.sku, item.category, item.channel, item.boxId, item.whatnotChannelLabel, item.campaignSuggestion].join(" ").toLowerCase().includes(needle));
  return `<section class="inventory-layout">
    <div class="inventory-list"><div class="panel-heading"><div><p>Bestand</p><h2>Artikelkarten</h2></div><button class="icon-button" data-view="scan" title="Artikel hinzufuegen">${icon("PL")}</button></div>${filtered.map(itemRow).join("")}</div>
    ${selected ? inspector(selected) : ""}
  </section>`;
}

function itemRow(item) {
  return `<button class="item-row ${state.selected === item.id ? "active" : ""}" data-select="${item.id}" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${item.category}</small><small>${sourceBadge(item)}</small></span><em>${euro(item.fair)}</em></button>`;
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
      <div class="inspector-title"><div><p>${item.sku}</p><h2>${escapeHtml(item.title)}</h2></div><span class="channel-badge ${item.channel.toLowerCase()}">${item.channel}</span></div>
      <div class="source-strip">${sourceBadge(item)}</div>
      <div class="price-grid">${suggestion("Low", euro(item.low))}${suggestion("Fair", euro(item.fair))}${suggestion("Aggressiv", euro(item.aggressive))}${suggestion("Confidence", `${item.confidence}%`)}</div>
      <div class="draft-actions">
        <button class="secondary-action" data-price-check="${item.id}" type="button">${icon("EU")}${state.priceChecking === item.id ? "Pruefe..." : "Preise checken"}</button>
        <button class="secondary-action" data-ebay-draft="${item.id}" type="button">${icon("EB")}${state.ebayDrafting === item.id ? "Baue..." : "eBay Draft"}</button>
      </div>
      ${priceCheckCard(item)}
      ${ebayDraftCard(item)}
      ${channelPicker(item)}
      ${whatnotRoutingCard(item)}
      <div class="detail-grid">${suggestion("Kiste", item.boxId)}${suggestion("Zustand", item.condition)}${suggestion("Vollstaendigkeit", item.completeness)}${suggestion("Gewicht", `${item.weight.toFixed(2)} kg`)}</div>
      <section class="research"><h3>Preisquellen</h3>${research.map((comp) => `<div class="research-row"><span>${comp[0]}</span><strong>${comp[1]}</strong><em>${comp[2] ? euro(comp[2]) : "Regel"}</em><small>${comp[3]}</small></div>`).join("")}</section>
      <section class="script-box"><h3>Whatnot Skript</h3><p>${script}</p></section>
      ${otherVisible}
    </div>
  </div>`;
}

function whatnotRoutingCard(item) {
  if (!(item.whatnotEligible || item.channel === "Whatnot")) {
    return `<section class="script-box"><h3>Whatnot Sorter</h3><p>Nicht fuer Whatnot markiert. Bei Bedarf im Plattformrouting auf Whatnot setzen, dann wird automatisch ein Kanal und eine Kampagne vorgeschlagen.</p></section>`;
  }
  return `<section class="whatnot-card">
    <div class="whatnot-card-head">
      <span>${icon("WN")}Whatnot Sorter</span>
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
    return `<section class="research compact"><h3>Preischeck</h3><p>Noch nicht geprueft. Erstellt lokale Evidence; Live-eBay folgt, sobald API-Zugang steht.</p></section>`;
  }
  return `<section class="research price-check-card">
    <h3>Preischeck</h3>
    <div class="price-grid">${suggestion("Low", euro(check.low))}${suggestion("Fair", euro(check.fair))}${suggestion("Aggressiv", euro(check.aggressive))}${suggestion("Confidence", `${check.confidence}%`)}</div>
    <div class="source-strip">Methode: ${escapeHtml(check.method)} · Query: ${escapeHtml(check.query)}</div>
    ${check.evidence.map((entry) => `<div class="research-row"><span>${escapeHtml(entry.source)}</span><strong>${escapeHtml(entry.title)}</strong><em>${euro(entry.price)}</em><small>${entry.matchScore}% Match</small></div>`).join("")}
  </section>`;
}

function ebayDraftCard(item) {
  const draft = item.ebayDraft;
  if (!draft) return "";
  return `<section class="script-box ebay-draft-card">
    <h3>eBay Draft</h3>
    <div class="detail-grid">${suggestion("Status", draft.status)}${suggestion("SKU", draft.sku)}${suggestion("Marktplatz", draft.marketplaceId)}${suggestion("Preis", euro(Number(draft.offerDraft?.pricingSummary?.price?.value || item.fair)))}</div>
    <p>${escapeHtml(draft.inventoryItem?.product?.title || item.title)}</p>
    <div class="source-strip">Kategorie: ${escapeHtml(draft.offerDraft?.categoryId || "TODO")} · Location: ${escapeHtml(draft.offerDraft?.merchantLocationKey || "-")}</div>
  </section>`;
}

function channelPicker(item) {
  const options = state.showAllChannels ? [...primaryChannels, ...futureChannels] : primaryChannels;
  const moreLabel = state.showAllChannels ? "Weniger anzeigen" : "Mehr anzeigen";
  return `<section class="channel-picker" aria-label="Plattformrouting">
    <div class="channel-picker-head"><span>Plattformrouting</span><button data-toggle-channels type="button">${moreLabel}</button></div>
    <div class="segment-control">${options.map((channel) => channelButton(channel, item)).join("")}</div>
    <p>${state.showAllChannels ? "Weitere Kanaele sind als Roadmap sichtbar und noch gesperrt." : "Die drei operativen Optionen fuer den aktuellen Demo-Flow."}</p>
  </section>`;
}

function channelButton(channel, item) {
  const disabled = channel.status !== "bereit";
  const selected = item.channel === channel.id;
  const attrs = disabled ? "disabled aria-disabled=\"true\"" : `data-route="${channel.id}" data-id="${item.id}"`;
  return `<button class="${selected ? "selected" : ""} ${disabled ? "locked" : ""}" ${attrs} type="button"><strong>${escapeHtml(channel.label)}</strong><small>${escapeHtml(channel.status)}</small></button>`;
}

function routingView() {
  if (state.channelPlan) return channelPlanView();
  const whatnotBuckets = whatnotChannels
    .map((channel) => ({
      channel,
      items: state.items.filter((item) => (item.whatnotEligible || item.channel === "Whatnot") && item.whatnotChannel === channel.id)
    }))
    .filter((bucket) => bucket.items.length);
  const columns = [
    routeColumn("Pruefen", state.items.filter((item) => item.channel === "Pruefen")),
    routeColumn("eBay", state.items.filter((item) => item.channel === "eBay")),
    ...whatnotBuckets.map((bucket) => routeColumn(`Whatnot: ${bucket.channel.label}`, bucket.items, bucket.channel.icon)),
    routeColumn("Strongvision", state.items.filter((item) => item.channel === "Strongvision")),
    routeColumn("Bundle", state.items.filter((item) => item.channel === "Bundle")),
    routeColumn("Problemfall", state.items.filter((item) => item.channel === "Problemfall"))
  ];
  return `<section class="routing-board">${columns.join("")}</section>`;
}

function routeColumn(title, items, iconLabel = title.slice(0, 2).toUpperCase()) {
  return `<div class="route-column">
    <div class="route-heading"><span>${escapeHtml(iconLabel)}</span><strong>${escapeHtml(title)}</strong><span>${items.length}</span></div>
    ${items.map((item) => `<button class="route-item" data-select="${item.id}" data-view-after="inventory" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${euro(item.fair)} · ${item.confidence}% sicher${item.campaignSuggestion ? ` · ${escapeHtml(item.campaignSuggestion)}` : ""}</small></span></button>`).join("")}
  </div>`;
}

function campaignsView() {
  const campaigns = buildWhatnotCampaigns(state.items);
  if (!campaigns.length) {
    return `<section class="empty-state"><h2>Keine Whatnot-Kampagnen</h2><p>Setze Artikel im Plattformrouting auf Whatnot. RAMROD sortiert sie danach automatisch in Kanaele und Kampagnen.</p><button class="primary-action inline-action" id="auto-whatnot" type="button">${icon("WN")}Kandidaten sortieren</button></section>`;
  }
  return `<section class="campaigns-layout">
    <div class="campaigns-list">
      <div class="panel-heading"><div><p>Whatnot</p><h2>Kampagnen</h2></div><div class="panel-actions"><button class="secondary-action" id="auto-whatnot" type="button">${icon("WN")}Kandidaten sortieren</button><button class="secondary-action" type="button">${icon("EX")}Export spaeter</button></div></div>
      ${campaigns.map(campaignCard).join("")}
    </div>
    <div class="show-console">
      <div class="panel-heading"><div><p>Show-Modus</p><h2>Naechste Kampagne</h2></div>${icon("WN")}</div>
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
      ${suggestion("Naechste Lots", campaign.items.length - 1)}
    </div>
    <div class="show-runlist">${campaign.items.slice(0, 8).map((item, index) => `<button class="show-runlist-row" data-select="${item.id}" data-view-after="inventory" type="button"><span>${index + 1}</span><strong>${escapeHtml(item.title)}</strong><em>${euro(item.fair)}</em></button>`).join("")}</div>
  </div>`;
}

function channelPlanView() {
  const plan = state.channelPlan;
  return `<section class="channel-plan-layout">
    <div class="channel-summary">
      ${suggestion("Artikel", plan.summary.total)}
      ${suggestion("Freigabe noetig", plan.summary.needsApproval)}
      ${suggestion("Fair Value", euro(plan.summary.fairValue))}
      ${suggestion("Primaerkanaele", Object.entries(plan.summary.byPrimary).map(([key, value]) => `${key}: ${value}`).join(", "))}
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
      <small>${plan.sku} · ${euro(plan.fairValue)} · ${plan.confidence}% Confidence</small>
    </div>
    <div class="channel-action-tags">${actions}</div>
    <p>${escapeHtml(reasons)} Delist-Policy: ${plan.saleLockPolicy.delistEverywhereExceptSoldChannel ? "bei Verkauf ueberall entfernen" : "manuell pruefen"}.</p>
  </article>`;
}

function shippingView() {
  return `<section class="shipping-layout">
    <div class="shipping-queue"><div class="panel-heading"><div><p>Pick & Pack</p><h2>Versandstation</h2></div><button class="secondary-action" type="button">${icon("CSV")}CSV Import</button></div>${state.items.filter((item) => item.channel !== "Problemfall").map((item) => `<div class="ship-row"><img src="${item.image}" alt="" /><div><strong>${item.sku}</strong><span>${escapeHtml(item.title)}</span></div><small>${item.boxId}</small><small>${item.weight.toFixed(2)} kg</small><button data-ship="${item.id}" title="Als versandbereit markieren">${icon("OK")}</button></div>`).join("")}</div>
    <div class="shipping-guide"><h2>Label-Logik</h2><p>Der MVP sammelt Gewicht, Lagerplatz und SKU. Im naechsten Schritt verbinden wir DHL, eBay Orders und Whatnot Export, damit die Packstation automatisch Picklisten und Labels erzeugt.</p><div class="guide-steps"><span>1. Verkauf importieren</span><span>2. SKU scannen</span><span>3. Gewicht validieren</span><span>4. Label drucken</span></div></div>
  </section>`;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    state.view = button.dataset.view;
    render();
  }));
  document.querySelectorAll("[data-box]").forEach((button) => button.addEventListener("click", () => {
    state.draft.boxId = button.dataset.box;
    render();
  }));
  document.querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => {
    state.selected = button.dataset.select;
    if (button.dataset.viewAfter) state.view = button.dataset.viewAfter;
    render();
  }));
  document.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", async () => {
    const index = state.items.findIndex((entry) => entry.id === button.dataset.id);
    if (index === -1) return;
    state.items[index] = enrichWorkflow({
      ...state.items[index],
      channel: button.dataset.route,
      whatnotEligible: button.dataset.route === "Whatnot" ? true : false
    });
    await persistItem(state.items[index], "Routing");
    render();
  }));
  document.querySelectorAll("[data-toggle-channels]").forEach((button) => button.addEventListener("click", () => {
    state.showAllChannels = !state.showAllChannels;
    render();
  }));
  document.querySelectorAll("[data-price-check]").forEach((button) => button.addEventListener("click", async () => {
    const item = state.items.find((entry) => entry.id === button.dataset.priceCheck);
    if (!item || state.priceChecking) return;
    state.priceChecking = item.id;
    state.importStatus = "Lokaler Preischeck laeuft...";
    render();
    try {
      const result = await postJson("/api/price-check", { item });
      item.priceCheck = result.priceCheck;
      item.ebayDraft = result.ebayDraft;
      item.low = result.priceCheck.low;
      item.fair = result.priceCheck.fair;
      item.aggressive = result.priceCheck.aggressive;
      item.confidence = Math.max(item.confidence, result.priceCheck.confidence);
      state.importStatus = result.liveProviderAvailable?.ebayBrowse || result.liveProviderAvailable?.serpApi
        ? "Preischeck erzeugt. Live-Provider ist konfiguriert, aber noch nicht aktiv geschaltet."
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
    state.importStatus = "eBay Draft wird lokal erzeugt...";
    render();
    try {
      const result = await postJson("/api/ebay-draft", { item });
      item.ebayDraft = result.ebayDraft;
      state.importStatus = "eBay Draft erzeugt. Noch nicht an eBay gesendet.";
      await persistItem(item, "eBay Draft");
    } catch (error) {
      state.importStatus = `eBay Draft fehlgeschlagen: ${error.message}`;
    } finally {
      state.ebayDrafting = "";
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
    const file = event.target.files?.[0];
    if (!file) return;
    state.importStatus = `Foto wird vorbereitet (${formatBytes(file.size)})...`;
    render();
    try {
      const prepared = await prepareImageForAi(file);
      state.draft.photo = prepared.dataUrl;
      state.importStatus = `Foto bereit fuer Live-KI (${prepared.width}x${prepared.height}, ${formatBytes(prepared.bytes)}).`;
    } catch (error) {
      state.importStatus = `Bildoptimierung fehlgeschlagen: ${error.message}. Nutze Originalbild.`;
      state.draft.photo = await readFileAsDataUrl(file);
    }
    render();
  });

  const add = document.querySelector("#add-item");
  if (add) add.addEventListener("click", async () => {
    if (state.analyzing) return;
    const usedLiveAi = Boolean(state.draft.photo);
    state.analyzing = true;
    state.importStatus = usedLiveAi ? "OpenAI analysiert das Foto..." : "Kein Foto vorhanden, nutze lokalen Mock-Vorschlag.";
    render();
    try {
      const item = enrichWorkflow(usedLiveAi ? await analyzeWithApi() : analyze());
      state.items.unshift(item);
      state.selected = item.id;
      state.draft = { query: "", boxId: state.draft.boxId, condition: "Gut", completeness: "Ungeprueft, Fotos vorhanden", barcode: "", photo: "", weight: "0.25" };
      state.view = "inventory";
      state.importStatus = usedLiveAi ? "Live-KI Artikelkarte erzeugt." : "Mock-Artikelkarte erzeugt.";
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
    state.draft = { query: "", boxId: state.draft.boxId, condition: "Gut", completeness: "Ungeprueft, Fotos vorhanden", barcode: "", photo: "", weight: "0.25" };
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
      state.view = "inventory";
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
      state.view = "routing";
      state.importStatus = `${state.channelPlan.summary.total} Listing-Plaene geladen.`;
    } catch (error) {
      state.importStatus = `Channel Plan fehlgeschlagen: ${error.message}`;
    }
    render();
  });

  const autoWhatnot = document.querySelector("#auto-whatnot");
  if (autoWhatnot) autoWhatnot.addEventListener("click", () => {
    markWhatnotCandidates();
    state.importStatus = "Whatnot-Kandidaten wurden nach Kanaelen und Kampagnen sortiert.";
    state.view = "campaigns";
    persistItems(state.items.filter((item) => item.whatnotEligible || item.channel === "Whatnot"), "Whatnot-Kandidaten");
    render();
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);
  return result;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || result.error || `HTTP ${response.status}`);
  return result;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

async function prepareImageForAi(file) {
  const image = await loadImage(file);
  const maxSide = 1600;
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
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return {
    dataUrl,
    width,
    height,
    bytes: Math.round((dataUrl.length * 3) / 4)
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

async function analyzeWithApi() {
  const response = await fetch("/api/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDataUrl: state.draft.photo,
      boxId: state.draft.boxId,
      condition: state.draft.condition,
      completeness: state.draft.completeness,
      barcode: state.draft.barcode,
      weight: state.draft.weight
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || payload.error || `HTTP ${response.status}`);
  }
  return payload.item;
}

function sourceBadge(item) {
  const source = item.sourceType || (item.sourceFile ? "batch_openai" : "unknown");
  const labels = {
    live_openai: "Quelle: Live-OpenAI",
    batch_openai: "Quelle: Drive-Batch OpenAI",
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
