export function ebayListingContentSchema() {
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
      "itemSpecifics"
    ],
    properties: {
      title: { type: "string", maxLength: 80 },
      shortDescription: { type: "string" },
      conditionDescription: { type: "string" },
      includedItems: { type: "array", items: { type: "string" } },
      defects: { type: "array", items: { type: "string" } },
      sellingPoints: { type: "array", items: { type: "string" } },
      itemSpecifics: {
        type: "array",
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

export function buildEbayListingPrompt(item, categoryContext = {}) {
  const requiredAspects = (categoryContext.aspects || [])
    .filter((entry) => entry.required)
    .map((entry) => ({ name: entry.name, allowedValues: entry.values?.slice(0, 30) || [] }));
  const recommendedAspects = (categoryContext.aspects || [])
    .filter((entry) => !entry.required)
    .slice(0, 12)
    .map((entry) => ({ name: entry.name, allowedValues: entry.values?.slice(0, 20) || [] }));
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
    existingDraft: item.listingDraft || null,
    categorySuggestion: categoryContext.category || null,
    requiredAspects,
    recommendedAspects
  };

  return [
    "Du bist der eBay-Listing-Agent fuer RAMROD.",
    "Erzeuge einen sachlichen, suchstarken deutschen eBay-Text fuer genau diesen gebrauchten Einzelartikel.",
    "Der Titel hat maximal 80 Zeichen. Nutze zuerst Marke/Franchise, exakten Produktnamen, Plattform/Variante und kaufrelevanten Zustand.",
    "Keine Keyword-Wiederholungen, Superlative, Emojis, Grossbuchstaben-Spam oder unbelegte Behauptungen.",
    "Erfinde keine Edition, Funktion, Echtheit, Vollstaendigkeit, Seriennummer, Garantie oder Zubehoerteile.",
    "Uebernimm sichtbare Maengel klar in conditionDescription und defects. Unsichere Fakten duerfen nicht als sicher dargestellt werden.",
    "Bei itemSpecifics nur Werte mit mindestens 75 Prozent Sicherheit ausgeben. Verwende die exakten Namen der eBay-Merkmale.",
    "Wenn ein Pflichtmerkmal nicht belegt ist, lasse es weg; RAMROD fragt es anschliessend beim Menschen ab.",
    "Antworte ausschliesslich im JSON-Schema und auf Deutsch.",
    `ARTIKELFAKTEN: ${JSON.stringify(facts)}`
  ].join(" ");
}

export function buildFallbackEbayContent(item) {
  const title = clampText(cleanText(item.listingDraft?.title || item.title || "Gebrauchter Artikel"), 80);
  const conditionDescription = cleanText(item.aiConditionObservations || item.notes || item.condition || "Gebrauchter Zustand; bitte Fotos beachten.");
  return {
    title,
    shortDescription: cleanText(item.listingDraft?.description || `${title}. Zustand und Lieferumfang entsprechen den Artikelangaben und Fotos.`),
    conditionDescription,
    includedItems: splitList(item.completeness || "Lieferumfang siehe Fotos"),
    defects: (item.aiRiskFlags || []).filter(Boolean).slice(0, 8),
    sellingPoints: [item.franchise, item.category].filter(Boolean).map(cleanText),
    itemSpecifics: [
      item.franchise ? { name: "Marke", value: cleanText(item.franchise), confidence: Number(item.confidence || 75) } : null,
      item.category ? { name: "Produktart", value: cleanText(item.category), confidence: Number(item.confidence || 75) } : null
    ].filter(Boolean)
  };
}

export function normalizeEbayListingContent(content, item) {
  const fallback = buildFallbackEbayContent(item);
  const specifics = Array.isArray(content?.itemSpecifics) ? content.itemSpecifics : fallback.itemSpecifics;
  return {
    title: clampText(cleanText(content?.title || fallback.title), 80),
    shortDescription: cleanText(content?.shortDescription || fallback.shortDescription),
    conditionDescription: cleanText(content?.conditionDescription || fallback.conditionDescription),
    includedItems: cleanList(content?.includedItems || fallback.includedItems),
    defects: cleanList(content?.defects || fallback.defects),
    sellingPoints: cleanList(content?.sellingPoints || fallback.sellingPoints),
    itemSpecifics: specifics
      .map((entry) => ({
        name: cleanText(entry?.name),
        value: cleanText(entry?.value),
        confidence: clampNumber(entry?.confidence, 0, 100, 0)
      }))
      .filter((entry) => entry.name && entry.value && entry.confidence >= 75)
  };
}

export function buildEbayListingPreview({
  item,
  content,
  category,
  categoryAspects = [],
  sellerSetup = {},
  sellerProfile = null
}) {
  const normalized = normalizeEbayListingContent(content, item);
  const specifics = Object.fromEntries(normalized.itemSpecifics.map((entry) => [entry.name, [entry.value]]));
  const requiredAspects = categoryAspects.filter((entry) => entry.required);
  const missingAspects = requiredAspects
    .filter((entry) => !specifics[entry.name]?.[0])
    .map((entry) => ({ name: entry.name, values: entry.values?.slice(0, 50) || [] }));
  const channelPlan = item.salesStrategy?.channelPlan || {};
  const ebayPlan = [channelPlan.primary, ...(channelPlan.parallel || []), channelPlan.fallback]
    .filter(Boolean)
    .find((entry) => String(entry.name || entry.id || "").toLowerCase() === "ebay");
  const marketValue = Math.max(0, Number(ebayPlan?.targetPrice || item.salesStrategy?.targetPrice || item.priceCheck?.fair || item.fair || 0));
  const salesFormat = item.ebaySaleMode === "auction_1_euro" ? "auction" : "fixed_price";
  const startPrice = salesFormat === "auction" ? 1 : marketValue;
  const price = startPrice;
  const listingDuration = salesFormat === "auction" ? "DAYS_7" : "GTC";
  const sourceImages = uniqueStrings([
    ...(Array.isArray(item.images) ? item.images : []),
    item.image
  ]).filter((value) => /^https:\/\//i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value));
  const descriptionHtml = buildDescriptionHtml(normalized, sellerProfile);
  const privateTrading = sellerSetup.listingMode === "trading";
  const shipping = privateTrading
    ? selectLocalShippingProfile(sellerSetup, item)
    : selectFulfillmentPolicy(sellerSetup, item);
  const returns = privateTrading
    ? { id: "trading:return-policy", name: sellerSetup.returnsAccepted ? `${sellerSetup.returnDays || 30} Tage Rueckgabe` : "Keine freiwillige Rueckgabe", summary: "Wird direkt im eBay-Artikel gespeichert." }
    : policySummary(sellerSetup.returnPolicy, sellerSetup.returnPolicyId, "Rueckgaberegel");
  const payment = privateTrading
    ? { id: "trading:managed-payments", name: "eBay-Zahlungsabwicklung", summary: "Wird von eBay abgewickelt." }
    : policySummary(sellerSetup.paymentPolicy, sellerSetup.paymentPolicyId, "Zahlungsregel");
  const policiesReady = privateTrading
    ? Boolean(sellerSetup.privateSellerRulesReady && shipping.id)
    : Boolean(shipping.id && returns.id && payment.id);
  const locationValue = privateTrading ? sellerSetup.merchantPostalCode : sellerSetup.merchantLocationKey;
  const readiness = [
    readinessStep("title", "Titel", Boolean(normalized.title), normalized.title || "Titel fehlt"),
    readinessStep("category", "eBay-Kategorie", Boolean(category?.id), category?.name || "Kategorie fehlt"),
    readinessStep("images", "Fotos", sourceImages.length > 0, sourceImages.length ? `${sourceImages.length} Foto${sourceImages.length === 1 ? "" : "s"}` : "Mindestens ein HTTPS-Foto fehlt"),
    readinessStep("price", salesFormat === "auction" ? "Auktionsstart" : "Preis", price > 0, price > 0 ? `${price.toFixed(2)} EUR` : "Preis fehlt"),
    readinessStep("policies", "Versand, Zahlung und Rueckgabe", policiesReady, policiesReady ? (privateTrading ? "Private Regeln pro Artikel" : "eBay-Regeln gefunden") : "eBay-Regeln fehlen"),
    readinessStep("location", "Versandort", Boolean(locationValue), locationValue || "Versandort fehlt"),
    readinessStep("aspects", "Pflichtmerkmale", missingAspects.length === 0, missingAspects.length ? `Fehlt: ${missingAspects.map((entry) => entry.name).join(", ")}` : "Vollstaendig")
  ];

  return {
    status: readiness.every((entry) => entry.ready) ? "ready_for_ebay" : "needs_input",
    generatedAt: new Date().toISOString(),
    sku: item.sku,
    marketplaceId: sellerSetup.marketplaceId || "EBAY_DE",
    listingMode: privateTrading ? "trading" : "inventory",
    sellerType: sellerProfile?.seller_type || "unknown",
    condition: item.condition || "Gebraucht",
    completeness: item.completeness || "siehe Fotos",
    title: normalized.title,
    price,
    marketValue,
    startPrice,
    salesFormat,
    listingDuration,
    category: category || null,
    content: normalized,
    descriptionHtml,
    itemSpecifics: specifics,
    missingAspects,
    sourceImages,
    shipping,
    returns,
    payment,
    warranty: sellerProfile?.config?.warrantyText
      ? { mode: "seller_profile", text: cleanText(sellerProfile.config.warrantyText) }
      : { mode: "not_stated", text: "RAMROD erzeugt keine unbelegte Garantieangabe." },
    merchantLocationKey: sellerSetup.merchantLocationKey || "",
    merchantPostalCode: sellerSetup.merchantPostalCode || "",
    handlingDays: Number(sellerSetup.handlingDays ?? 2),
    returnsAccepted: Boolean(sellerSetup.returnsAccepted),
    returnDays: Number(sellerSetup.returnDays || 30),
    returnShippingCostPayer: sellerSetup.returnShippingCostPayer || "BUYER",
    readiness,
    warnings: [
      "Noch nicht bei eBay angelegt oder veroeffentlicht.",
      ...(salesFormat === "auction" ? ["Auktion ab 1 EUR ohne Mindestpreis: Der Verkaufspreis kann deutlich unter dem geschaetzten Marktwert liegen."] : []),
      "Versandkosten und Rueckgabe folgen den im eBay-Konto ausgewaehlten Verkaufsregeln.",
      "Kategorieabhaengige Produkt- und Sicherheitsangaben koennen beim eBay-Check zusaetzlich erforderlich werden."
    ]
  };
}

export async function suggestEbayCategory(config, appToken, query, fetchImpl = fetch) {
  const marketplaceId = config.marketplaceId || "EBAY_DE";
  const treeResponse = await ebayRequest(`${config.apiBaseUrl}/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(marketplaceId)}`, {
    headers: { Authorization: `Bearer ${appToken}` }
  }, fetchImpl);
  const treeId = treeResponse.body?.categoryTreeId;
  if (!treeId) throw new Error("eBay hat keinen Kategoriebaum geliefert.");
  const suggestions = await ebayRequest(`${config.apiBaseUrl}/commerce/taxonomy/v1/category_tree/${encodeURIComponent(treeId)}/get_category_suggestions?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${appToken}` }
  }, fetchImpl);
  const first = suggestions.body?.categorySuggestions?.[0];
  if (!first?.category?.categoryId) throw new Error("eBay hat keine passende Kategorie vorgeschlagen.");
  return {
    id: String(first.category.categoryId),
    name: first.category.categoryName || "eBay-Kategorie",
    treeId: String(treeId),
    path: [...(first.categoryTreeNodeAncestors || [])].reverse().map((entry) => entry.categoryName).filter(Boolean)
  };
}

export async function getEbayCategoryAspects(config, appToken, category, fetchImpl = fetch) {
  if (!category?.treeId || !category?.id) return [];
  const result = await ebayRequest(`${config.apiBaseUrl}/commerce/taxonomy/v1/category_tree/${encodeURIComponent(category.treeId)}/get_item_aspects_for_category?category_id=${encodeURIComponent(category.id)}`, {
    headers: { Authorization: `Bearer ${appToken}` }
  }, fetchImpl);
  return (result.body?.aspects || []).map((entry) => ({
    name: entry.localizedAspectName || "",
    required: Boolean(entry.aspectConstraint?.aspectRequired),
    usage: entry.aspectConstraint?.aspectUsage || "",
    values: (entry.aspectValues || []).map((value) => value.localizedValue).filter(Boolean)
  })).filter((entry) => entry.name);
}

export async function uploadEbayImageFromUrl(config, accessToken, imageUrl, fetchImpl = fetch) {
  const mediaBaseUrl = config.environment === "production" ? "https://apim.ebay.com" : "https://apim.sandbox.ebay.com";
  const result = await ebayRequest(`${mediaBaseUrl}/commerce/media/v1_beta/image/create_image_from_url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ imageUrl })
  }, fetchImpl);
  const epsUrl = result.body?.imageUrl;
  if (!epsUrl) throw new Error("eBay hat fuer das Foto keine verwendbare Bild-URL geliefert.");
  return { imageUrl: epsUrl, location: result.headers?.get?.("location") || "" };
}

export async function uploadEbayImageFromDataUrl(config, accessToken, dataUrl, fetchImpl = fetch) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Das eingebettete Artikelfoto ist ungueltig.");
  const mediaBaseUrl = config.environment === "production" ? "https://apim.ebay.com" : "https://apim.sandbox.ebay.com";
  const extension = match[1].split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const form = new FormData();
  form.append("image", new Blob([Buffer.from(match[2], "base64")], { type: match[1] }), `ramrod-item.${extension}`);
  const result = await ebayRequest(`${mediaBaseUrl}/commerce/media/v1_beta/image/create_image_from_file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  }, fetchImpl);
  const epsUrl = result.body?.imageUrl;
  if (!epsUrl) throw new Error("eBay hat fuer das Foto keine verwendbare Bild-URL geliefert.");
  return { imageUrl: epsUrl, location: result.headers?.get?.("location") || "" };
}

export async function createOrReplaceEbayInventoryItem(config, accessToken, preview, imageUrls, fetchImpl = fetch) {
  const payload = {
    availability: { shipToLocationAvailability: { quantity: 1 } },
    condition: mapEbayCondition(preview.condition || "Gebraucht"),
    conditionDescription: preview.content.conditionDescription,
    product: {
      title: preview.title,
      description: preview.descriptionHtml,
      imageUrls,
      aspects: preview.itemSpecifics
    }
  };
  await ebayRequest(`${config.apiBaseUrl}/sell/inventory/v1/inventory_item/${encodeURIComponent(preview.sku)}`, {
    method: "PUT",
    headers: ebaySellerHeaders(accessToken, preview.marketplaceId),
    body: JSON.stringify(payload)
  }, fetchImpl);
  return payload;
}

export async function createEbayOffer(config, accessToken, preview, fetchImpl = fetch) {
  const auction = preview.salesFormat === "auction";
  const payload = {
    sku: preview.sku,
    marketplaceId: preview.marketplaceId,
    format: auction ? "AUCTION" : "FIXED_PRICE",
    availableQuantity: 1,
    categoryId: preview.category.id,
    merchantLocationKey: preview.merchantLocationKey,
    listingDescription: preview.descriptionHtml,
    listingDuration: auction ? (preview.listingDuration || "DAYS_7") : "GTC",
    pricingSummary: auction
      ? { auctionStartPrice: { value: Number(preview.startPrice || preview.price || 1).toFixed(2), currency: "EUR" } }
      : { price: { value: Number(preview.price).toFixed(2), currency: "EUR" } },
    listingPolicies: {
      paymentPolicyId: preview.payment.id,
      fulfillmentPolicyId: preview.shipping.id,
      returnPolicyId: preview.returns.id
    }
  };
  const result = await ebayRequest(`${config.apiBaseUrl}/sell/inventory/v1/offer`, {
    method: "POST",
    headers: ebaySellerHeaders(accessToken, preview.marketplaceId),
    body: JSON.stringify(payload)
  }, fetchImpl);
  if (!result.body?.offerId) throw new Error("eBay hat keine Angebots-ID geliefert.");
  return { offerId: result.body.offerId, payload };
}

export async function publishEbayOffer(config, accessToken, offerId, marketplaceId = "EBAY_DE", fetchImpl = fetch) {
  const result = await ebayRequest(`${config.apiBaseUrl}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`, {
    method: "POST",
    headers: ebaySellerHeaders(accessToken, marketplaceId),
    body: "{}"
  }, fetchImpl);
  if (!result.body?.listingId) throw new Error("eBay hat keine Listing-ID geliefert.");
  return result.body;
}

function ebaySellerHeaders(accessToken, marketplaceId) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Content-Language": "de-DE",
    "X-EBAY-C-MARKETPLACE-ID": marketplaceId || "EBAY_DE"
  };
}

async function ebayRequest(url, options, fetchImpl) {
  const response = await fetchImpl(url, options);
  const text = typeof response.text === "function" ? await response.text() : "";
  let body = {};
  if (text) {
    try { body = JSON.parse(text); } catch { body = { message: text }; }
  } else if (typeof response.json === "function") {
    body = await response.json().catch(() => ({}));
  }
  if (!response.ok) {
    const message = body?.errors?.[0]?.longMessage
      || body?.errors?.[0]?.message
      || body?.error_description
      || body?.message
      || `eBay HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = body?.errors || [];
    throw error;
  }
  return { body, headers: response.headers };
}

function buildDescriptionHtml(content, sellerProfile) {
  const profileNotice = sellerProfile?.config?.legalNotice
    ? `<h2>Hinweis des Verkaeufers</h2><p>${escapeHtml(sellerProfile.config.legalNotice)}</p>`
    : "";
  return [
    `<h1>${escapeHtml(content.title)}</h1>`,
    `<p>${escapeHtml(content.shortDescription)}</p>`,
    "<h2>Zustand</h2>",
    `<p>${escapeHtml(content.conditionDescription)}</p>`,
    listSection("Lieferumfang", content.includedItems),
    listSection("Besonderheiten", content.sellingPoints),
    listSection("Bekannte Maengel", content.defects),
    profileNotice,
    "<p>Bitte beachte die Originalfotos; sie sind Bestandteil der Artikelbeschreibung.</p>"
  ].filter(Boolean).join("");
}

function listSection(title, values) {
  if (!values?.length) return "";
  return `<h2>${escapeHtml(title)}</h2><ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function policySummary(policy, fallbackId, fallbackName) {
  return {
    id: policy?.id || fallbackId || "",
    name: policy?.name || fallbackName,
    summary: policy?.summary || "Details werden aus dem verbundenen eBay-Konto uebernommen."
  };
}

function selectFulfillmentPolicy(sellerSetup, item) {
  const candidates = Array.isArray(sellerSetup.fulfillmentPolicies)
    ? sellerSetup.fulfillmentPolicies.filter((policy) => policy?.id)
    : [];
  if (!candidates.length) {
    return policySummary(sellerSetup.fulfillmentPolicy, sellerSetup.fulfillmentPolicyId, "Versandregel");
  }

  const itemWeightKg = Number(item.shippingWeightKg || item.weight || 0);
  const estimatedPackedWeightKg = itemWeightKg > 0
    ? Math.round((itemWeightKg * 1.15 + 0.2) * 100) / 100
    : 0;
  const weighted = candidates
    .filter((policy) => Number(policy.maxWeightKg) > 0)
    .sort((left, right) => Number(left.maxWeightKg) - Number(right.maxWeightKg));
  const selected = estimatedPackedWeightKg > 0
    ? weighted.find((policy) => Number(policy.maxWeightKg) >= estimatedPackedWeightKg) || weighted.at(-1)
    : weighted[0] || candidates[0];
  const selectionNote = estimatedPackedWeightKg > 0
    ? `Automatisch gewählt für ca. ${estimatedPackedWeightKg.toFixed(2).replace(".", ",")} kg Versandgewicht.`
    : "Vor Veröffentlichung anhand von Gewicht und Verpackung prüfen.";

  return {
    ...policySummary(selected, selected?.id, "Versandregel"),
    maxWeightKg: selected?.maxWeightKg || null,
    shippingCost: selected?.shippingCost ?? null,
    estimatedPackedWeightKg: estimatedPackedWeightKg || null,
    selectionMode: estimatedPackedWeightKg > 0 ? "automatic" : "requires_check",
    summary: [selected?.summary, selectionNote].filter(Boolean).join(" · ")
  };
}

function selectLocalShippingProfile(sellerSetup, item) {
  const candidates = (Array.isArray(sellerSetup.localShippingProfiles) ? sellerSetup.localShippingProfiles : [])
    .filter((profile) => Number(profile?.maxWeightKg) > 0)
    .sort((left, right) => Number(left.maxWeightKg) - Number(right.maxWeightKg));
  if (!candidates.length) return { id: "", name: "Versandklasse", summary: "Private Versandregeln fehlen." };
  const itemWeightKg = Number(item.shippingWeightKg || item.weight || 0);
  const estimatedPackedWeightKg = itemWeightKg > 0 ? Math.round((itemWeightKg * 1.15 + 0.2) * 100) / 100 : 0;
  const selected = estimatedPackedWeightKg > 0
    ? candidates.find((profile) => Number(profile.maxWeightKg) >= estimatedPackedWeightKg) || candidates.at(-1)
    : candidates[0];
  return {
    id: `trading:${selected.maxWeightKg}:${selected.shippingCost}`,
    name: selected.name || `DHL Paket bis ${selected.maxWeightKg} kg`,
    summary: estimatedPackedWeightKg > 0
      ? `Automatisch gewaehlt fuer ca. ${estimatedPackedWeightKg.toFixed(2).replace(".", ",")} kg Versandgewicht.`
      : "Vor Veroeffentlichung anhand von Gewicht und Verpackung pruefen.",
    serviceCode: "DE_DHLPaket",
    maxWeightKg: selected.maxWeightKg,
    shippingCost: selected.shippingCost,
    estimatedPackedWeightKg: estimatedPackedWeightKg || null,
    selectionMode: estimatedPackedWeightKg > 0 ? "automatic" : "requires_check"
  };
}

function readinessStep(id, label, ready, detail) {
  return { id, label, ready: Boolean(ready), detail };
}

function splitList(value) {
  return String(value || "").split(/[;,]/).map(cleanText).filter(Boolean);
}

function cleanList(values) {
  return (Array.isArray(values) ? values : []).map(cleanText).filter(Boolean).slice(0, 20);
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clampText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).trim();
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function mapEbayCondition(value = "") {
  const text = String(value).toLowerCase();
  if (text.includes("neu")) return "NEW";
  if (text.includes("defekt")) return "FOR_PARTS_OR_NOT_WORKING";
  if (text.includes("sehr gut")) return "USED_EXCELLENT";
  if (text.includes("gut")) return "USED_GOOD";
  return "USED_ACCEPTABLE";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}
