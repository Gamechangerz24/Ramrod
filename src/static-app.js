const boxes = [
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
    research: [["eBay", "Unklare Varianten", 80, "21 Tage"], ["Forum", "Limitierte Serie erwaehnt", 90, "alt"], ["CREATORS Regel", "Confidence unter 65", 0, "jetzt"]]
  }
];

const hints = [
  { tokens: ["pokemon", "tcg", "karte", "display", "booster"], category: "Trading Cards", franchise: "Pokemon", low: 25, fair: 84, aggressive: 139, channel: "eBay", confidence: 82 },
  { tokens: ["nintendo", "gameboy", "ds", "switch", "spiel", "konsole"], category: "Games", franchise: "Nintendo", low: 12, fair: 34, aggressive: 59, channel: "Whatnot", confidence: 76 },
  { tokens: ["funko", "figur", "anime", "statue", "collectible"], category: "Collectibles", franchise: "Pop Culture", low: 18, fair: 49, aggressive: 89, channel: "Pruefen", confidence: 62 }
];

const state = {
  view: "scan",
  selected: "itm-001",
  search: "",
  importStatus: "",
  channelPlan: null,
  draft: {
    query: "",
    boxId: "SV-001",
    condition: "Gut",
    completeness: "Ungeprueft, Fotos vorhanden",
    barcode: "",
    photo: "",
    weight: "0.25"
  },
  items: JSON.parse(localStorage.getItem("creators-scanapp-items") || "null") || seedItems
};

const app = document.querySelector("#app");
const euro = (value) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const icon = (label) => `<span class="mini-icon" aria-hidden="true">${label}</span>`;
const save = () => localStorage.setItem("creators-scanapp-items", JSON.stringify(state.items));

function nextSku(boxId) {
  return `${boxId}-${String(state.items.filter((item) => item.boxId === boxId).length + 1).padStart(4, "0")}`;
}

function analyze(draft = state.draft) {
  const text = `${draft.query} ${draft.barcode}`.toLowerCase();
  const hint = hints.find((entry) => entry.tokens.some((token) => text.includes(token))) || hints[2];
  const incomplete = draft.condition === "Unvollstaendig" || draft.condition === "Defekt";
  const confidence = Math.max(38, hint.confidence - (incomplete ? 18 : 0));
  const fair = Math.round(hint.fair * (draft.condition === "Sehr gut" ? 1.18 : 1));
  return {
    id: crypto.randomUUID(),
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
    research: [["eBay", "Aktive Vergleichsartikel", fair + 12, "simuliert"], ["eBay Solds", "Verkaufte Vergleichsartikel", fair - 8, "simuliert"], ["CREATORS", "Routing-Regel", fair, "jetzt"]]
  };
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
    whatnot: state.items.filter((item) => item.channel === "Whatnot").length
  };

  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">C</div><div><strong>CREATORS RAMROD</strong><span>Strongvision Intake</span></div></div>
      <nav class="nav-list" aria-label="Arbeitsbereiche">
        ${navButton("scan", "SC", "Scan")}
        ${navButton("inventory", "BX", "Bestand")}
        ${navButton("routing", "RT", "Routing")}
        ${navButton("shipping", "VS", "Versand")}
      </nav>
      <div class="box-stack"><div class="section-label">Kisten</div>${boxes.map(boxButton).join("")}</div>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div><p>Projekt RAMROD</p><h1>Lagerbestand in Liquiditaet verwandeln</h1></div>
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
        ${metric("WN", "Whatnot", stats.whatnot)}
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
      <button class="primary-action" id="add-item" type="button">${icon("AI")}KI-Vorschlag erzeugen</button>
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
  const filtered = state.items.filter((item) => [item.title, item.sku, item.category, item.channel, item.boxId].join(" ").toLowerCase().includes(needle));
  return `<section class="inventory-layout">
    <div class="inventory-list"><div class="panel-heading"><div><p>Bestand</p><h2>Artikelkarten</h2></div><button class="icon-button" data-view="scan" title="Artikel hinzufuegen">${icon("PL")}</button></div>${filtered.map(itemRow).join("")}</div>
    ${selected ? inspector(selected) : ""}
  </section>`;
}

function itemRow(item) {
  return `<button class="item-row ${state.selected === item.id ? "active" : ""}" data-select="${item.id}" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${item.category}</small></span><em>${euro(item.fair)}</em></button>`;
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
      <div class="price-grid">${suggestion("Low", euro(item.low))}${suggestion("Fair", euro(item.fair))}${suggestion("Aggressiv", euro(item.aggressive))}${suggestion("Confidence", `${item.confidence}%`)}</div>
      <div class="segment-control" aria-label="Plattformrouting">${["Pruefen", "eBay", "Whatnot", "Bundle", "Problemfall"].map((channel) => `<button class="${item.channel === channel ? "selected" : ""}" data-route="${channel}" data-id="${item.id}" type="button">${channel}</button>`).join("")}</div>
      <div class="detail-grid">${suggestion("Kiste", item.boxId)}${suggestion("Zustand", item.condition)}${suggestion("Vollstaendigkeit", item.completeness)}${suggestion("Gewicht", `${item.weight.toFixed(2)} kg`)}</div>
      <section class="research"><h3>Preisquellen</h3>${research.map((comp) => `<div class="research-row"><span>${comp[0]}</span><strong>${comp[1]}</strong><em>${comp[2] ? euro(comp[2]) : "Regel"}</em><small>${comp[3]}</small></div>`).join("")}</section>
      <section class="script-box"><h3>Whatnot Skript</h3><p>${script}</p></section>
      ${otherVisible}
    </div>
  </div>`;
}

function routingView() {
  if (state.channelPlan) return channelPlanView();
  return `<section class="routing-board">${["Pruefen", "eBay", "Whatnot", "Bundle", "Problemfall"].map((channel) => `<div class="route-column"><div class="route-heading"><span>${channel}</span><strong>${channel}</strong><span>${state.items.filter((item) => item.channel === channel).length}</span></div>${state.items.filter((item) => item.channel === channel).map((item) => `<button class="route-item" data-select="${item.id}" data-view-after="inventory" type="button"><img src="${item.image}" alt="" /><span><strong>${escapeHtml(item.title)}</strong><small>${item.sku} · ${euro(item.fair)} · ${item.confidence}% sicher</small></span></button>`).join("")}</div>`).join("")}</section>`;
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
  document.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => {
    const item = state.items.find((entry) => entry.id === button.dataset.id);
    item.channel = button.dataset.route;
    save();
    render();
  }));
  document.querySelectorAll("[data-ship]").forEach((button) => button.addEventListener("click", () => {
    const item = state.items.find((entry) => entry.id === button.dataset.ship);
    item.stage = "Versand";
    save();
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
  if (photo) photo.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.draft.photo = String(reader.result);
      render();
    };
    reader.readAsDataURL(file);
  });

  const add = document.querySelector("#add-item");
  if (add) add.addEventListener("click", () => {
    const item = analyze();
    state.items.unshift(item);
    state.selected = item.id;
    state.draft = { query: "", boxId: state.draft.boxId, condition: "Gut", completeness: "Ungeprueft, Fotos vorhanden", barcode: "", photo: "", weight: "0.25" };
    state.view = "inventory";
    save();
    render();
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
      state.items = payload.items;
      state.selected = payload.items[0]?.id || "";
      state.view = "inventory";
      state.importStatus = `${payload.count} OpenAI-Artikel aus ${payload.model} geladen.`;
      save();
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
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

render();
