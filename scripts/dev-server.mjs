import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

loadDotEnv(".env.local");

const root = resolve(".");
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const liveImageDetail = process.env.OPENAI_LIVE_IMAGE_DETAIL || process.env.OPENAI_IMAGE_DETAIL || "low";
const ebayPriceProvider = (process.env.EBAY_PRICE_PROVIDER || "local").toLowerCase();
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
let ebayAppTokenCache = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/app-state") {
      await handleAppState(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/analyze-image") {
      await handleAnalyzeImage(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/items") {
      await handleSaveItem(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/price-check") {
      await handlePriceCheck(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/ebay-draft") {
      await handleEbayDraft(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "internal_error", message: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Scanapp server listening on http://${host}:${port}`);
});

async function handleAppState(_request, response) {
  const persistence = supabasePersistenceStatus();

  if (!persistence.configured) {
    sendJson(response, 200, {
      persistence,
      customers: [],
      boxes: [],
      items: [],
      message: "Supabase is not configured."
    });
    return;
  }

  try {
    const [customers, boxes, items] = await Promise.all([
      supabaseSelect("/customers?select=id,name,slug&order=name.asc"),
      supabaseSelect("/boxes?select=id,code,label,location,status,customer_id&order=code.asc"),
      supabaseSelect("/items?select=*&order=created_at.desc&limit=500")
    ]);

    sendJson(response, 200, {
      persistence,
      customers,
      boxes: boxes.map(mapDbBoxToUi),
      items: items.map((item) => mapDbItemToUi(item, boxes))
    });
  } catch (error) {
    sendJson(response, 200, {
      persistence: { ...persistence, available: false },
      customers: [],
      boxes: [],
      items: [],
      message: redactSecret(error.message)
    });
  }
}

async function handleSaveItem(request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.writable) {
    sendJson(response, 503, {
      error: "supabase_not_writable",
      message: "SUPABASE_SERVICE_ROLE_KEY is required for server-side writes."
    });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 12 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  try {
    const customer = await getOrCreateCustomer();
    const box = await getBoxByCode(customer.id, item.boxId || "SV-001");
    const savedRows = await supabaseUpsert("/items?on_conflict=sku", mapUiItemToDb(item, customer, box));
    const saved = savedRows[0] || null;

    if (item.priceCheck && saved) {
      await supabaseInsert("/price_checks", mapUiPriceCheckToDb(saved.id, item.priceCheck));
    }

    sendJson(response, 200, {
      persistence,
      item: saved ? mapDbItemToUi(saved, box ? [box] : []) : item
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "supabase_save_failed",
      message: redactSecret(error.message)
    });
  }
}

async function handleAnalyzeImage(request, response) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    sendJson(response, 400, {
      error: "missing_openai_api_key",
      message: "OPENAI_API_KEY is not configured on the local server."
    });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 18 * 1024 * 1024));

  if (!body.imageDataUrl?.startsWith("data:image/")) {
    sendJson(response, 400, {
      error: "missing_image",
      message: "imageDataUrl must be a data:image URL."
    });
    return;
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Du bist der AI-Scanner fuer CREATORS Projekt RAMROD.",
                "Analysiere ein frisch aufgenommenes Foto aus einer wilden Strongvision-Kiste.",
                "Ein Foto kann einen dominanten Artikel und Nebenartikel enthalten.",
                "Erfinde keine Barcodes, Seriennummern oder Editionen.",
                "Nutze sichtbare Initialen, Farb-Codierungen und Beschriftungen zur Charakteridentifikation. Bei Teenage Mutant Ninja Turtles gilt: orange Maske oder M am Guertel = Michelangelo, blau oder L = Leonardo, rot oder R = Raphael, lila oder D = Donatello. Wenn sichtbare Hinweise einem bekannten Namen widersprechen, priorisiere die sichtbaren Hinweise und senke die Confidence.",
                "Gib eine operative Artikelkarte fuer Weiterverkauf, Plattformrouting und Whatnot-Vorbereitung aus.",
                "Wenn Whatnot geeignet ist, sortiere den Artikel in einen konkreten Show-Kanal. Halte zusammenpassende Artikel zusammen: Pokemon Cards separat, PlayStation Games separat, Retro Games separat, Comics separat, Action Figures separat.",
                "Preise sind nur Vorbewertung in EUR ohne Webrecherche."
              ].join(" ")
            },
            {
              type: "input_image",
              image_url: body.imageDataUrl,
              detail: liveImageDetail
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "scanapp_live_item_analysis",
          strict: true,
          schema: itemAnalysisSchema()
        }
      }
    })
  });

  const result = await openAiResponse.json();

  if (!openAiResponse.ok) {
    sendJson(response, openAiResponse.status, {
      error: result.error?.code || "openai_error",
      message: redactSecret(result.error?.message || "OpenAI request failed")
    });
    return;
  }

  const analysis = extractJson(result);
  const item = mapAnalysisToItem(analysis, body);

  sendJson(response, 200, {
    model,
    usage: result.usage || null,
    analysis,
    item
  });
}

async function handlePriceCheck(request, response) {
  const body = JSON.parse(await readRequestBody(request, 8 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  const priceCheck = await buildPriceCheck(item);
  const ebayDraft = buildEbayDraft(item, priceCheck);

  sendJson(response, 200, {
    provider: priceCheck.method,
    liveProviderAvailable: {
      ebayBrowse: Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
      ebayBrowseEnabled: ebayPriceProvider === "ebay-browse",
      serpApi: Boolean(process.env.SERPAPI_API_KEY),
      webResearch: Boolean(process.env.SERPAPI_API_KEY)
    },
    priceCheck,
    ebayDraft
  });
}

async function handleEbayDraft(request, response) {
  const body = JSON.parse(await readRequestBody(request, 8 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  sendJson(response, 200, {
    provider: "local-draft",
    ebayDraft: buildEbayDraft(item, item.priceCheck || null)
  });
}

async function buildPriceCheck(item) {
  const liveEvidence = [];
  const notes = [];
  let ebayFailed = "";
  let webFailed = "";

  if (ebayPriceProvider === "ebay-browse") {
    try {
      const evidence = await fetchEbayBrowseEvidence(item);
      if (evidence.length) {
        liveEvidence.push(...evidence);
        notes.push("Live-eBay-Browse-Preischeck aus aktiven eBay-Angeboten.");
      } else {
        notes.push("eBay Browse wurde abgefragt, lieferte aber keine verwertbaren aktiven Treffer.");
      }
    } catch (error) {
      ebayFailed = redactSecret(error.message);
      notes.push(`eBay Browse nicht verfuegbar: ${ebayFailed}.`);
    }
  }

  if (process.env.SERPAPI_API_KEY) {
    try {
      const webEvidence = await fetchSerpApiEbayEvidence(item);
      if (webEvidence.length) {
        liveEvidence.push(...webEvidence);
        notes.push("Web Research ueber SerpApi wurde in die Preisberechnung einbezogen.");
      } else {
        notes.push("Web Research ueber SerpApi lieferte keine verwertbaren Treffer.");
      }
    } catch (error) {
      webFailed = redactSecret(error.message);
      notes.push(`Web Research nicht verfuegbar: ${webFailed}.`);
    }
  } else {
    notes.push("Web Research ist vorbereitet, aber SERPAPI_API_KEY ist noch nicht gesetzt.");
  }

  if (liveEvidence.length) {
    const hasEbay = liveEvidence.some((entry) => entry.source === "eBay Browse");
    const hasWeb = liveEvidence.some((entry) => entry.source?.startsWith("SerpApi"));
    const method = hasEbay && hasWeb ? "multi-source" : hasWeb ? "web-research" : "ebay-browse";
    return buildPriceCheckFromEvidence(item, liveEvidence, method, [
      ...notes,
      "Finaler Preis bleibt Review-pflichtig."
    ]);
  }

  const fallback = buildLocalPriceCheck(item);
  fallback.notes = [
    ...notes,
    ebayFailed || webFailed
      ? "Keine Live-Quelle konnte verwertbare Treffer liefern; lokaler Fallback genutzt."
      : "Keine Live-Quelle aktiv; lokaler Fallback genutzt.",
    "Weitere Quellen wie SerpApi, PriceCharting oder Kategorie-spezifische Adapter koennen die Trefferquote verbessern."
  ];
  return fallback;
}

function buildLocalPriceCheck(item) {
  const evidence = normalizeResearch(item)
    .filter((entry) => Number(entry.price) > 0)
    .map((entry, index) => ({
      source: entry.source || "RAMROD",
      title: entry.label || item.title,
      price: Math.round(Number(entry.price)),
      status: entry.source?.toLowerCase().includes("sold") ? "sold_hint" : "active_or_hint",
      age: entry.age || "unbekannt",
      matchScore: Math.max(52, Math.min(96, Math.round((Number(item.confidence) || 70) - index * 7)))
    }));

  if (!evidence.length) {
    evidence.push(
      { source: "RAMROD", title: "KI Low Estimate", price: Math.round(Number(item.low) || 1), status: "model_hint", age: "jetzt", matchScore: 56 },
      { source: "RAMROD", title: "KI Fair Estimate", price: Math.round(Number(item.fair) || 1), status: "model_hint", age: "jetzt", matchScore: 62 },
      { source: "RAMROD", title: "KI Aggressive Estimate", price: Math.round(Number(item.aggressive) || Number(item.fair) || 1), status: "model_hint", age: "jetzt", matchScore: 50 }
    );
  }

  return buildPriceCheckFromEvidence(item, evidence, "local-evidence", [
    "Lokaler Preischeck aus vorhandenen RAMROD-Hinweisen.",
    "Noch keine Live-eBay-Abfrage.",
    "Live-Provider wird spaeter ueber eBay Browse oder SerpApi aktiviert."
  ]);
}

function buildPriceCheckFromEvidence(item, evidence, method, notes) {
  const markedEvidence = markPriceOutliers(evidence);
  const usableEvidence = markedEvidence.filter((entry) => !entry.outlier);
  const prices = usableEvidence.map((entry) => entry.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const fair = Math.round((median * 0.6) + (average * 0.4));
  const variance = Math.max(...prices) - Math.min(...prices);
  const baseConfidence = Math.round((Number(item.confidence) || 65) + Math.min(12, evidence.length * 3) - Math.min(22, variance / Math.max(1, fair) * 20));
  const evidenceCap = method === "ebay-browse" || method === "web-research" || method === "multi-source"
    ? (usableEvidence.length === 1 ? 62 : usableEvidence.length === 2 ? 72 : 94)
    : 94;
  const confidence = Math.max(35, Math.min(evidenceCap, baseConfidence));
  const finalNotes = [
    ...notes,
    ...(["ebay-browse", "web-research", "multi-source"].includes(method) && usableEvidence.length < 3
      ? ["Nur wenige Live-Treffer gefunden; Preis als Indikation, nicht als belastbarer Marktwert."]
      : []),
    ...(markedEvidence.some((entry) => entry.outlier)
      ? ["Ausreisser wurden in der Preisberechnung markiert und nicht gewichtet."]
      : [])
  ];

  return {
    checkedAt: new Date().toISOString(),
    method,
    query: buildSearchQuery(item),
    low: Math.max(1, Math.round(Math.min(...prices) * 0.88)),
    fair,
    aggressive: Math.max(fair, Math.round(Math.max(...prices) * 1.08)),
    confidence,
    previous: {
      low: numberOrNull(item.low),
      fair: numberOrNull(item.fair),
      aggressive: numberOrNull(item.aggressive),
      confidence: clampNumber(item.confidence, 0, 100, 0)
    },
    calculation: {
      basis: priceCheckBasis(method),
      formula: "Marktwert = 60% Median + 40% Durchschnitt der nutzbaren Treffer",
      usableCount: usableEvidence.length,
      outlierCount: markedEvidence.filter((entry) => entry.outlier).length,
      median,
      average,
      minComparable: Math.min(...prices),
      maxComparable: Math.max(...prices)
    },
    evidence: markedEvidence.slice(0, 6),
    notes: finalNotes
  };
}

function priceCheckBasis(method) {
  if (method === "multi-source") return "eBay + Web Research";
  if (method === "web-research") return "Web Research";
  if (method === "ebay-browse") return "aktive eBay-Angebote";
  return "lokale RAMROD-Hinweise";
}

function markPriceOutliers(evidence) {
  if (evidence.length < 4) return evidence;

  const prices = evidence.map((entry) => entry.price).filter((price) => Number(price) > 0).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const lower = Math.max(1, median / 3);
  const upper = Math.max(median * 3, median + 40);

  return evidence.map((entry) => {
    const outlier = entry.price < lower || entry.price > upper;
    return outlier
      ? { ...entry, status: `${entry.status}_outlier`, matchScore: Math.min(entry.matchScore, 35), outlier: true }
      : entry;
  });
}

async function fetchEbayBrowseEvidence(item) {
  const token = await getEbayAppToken();
  const baseUrl = ebayApiBaseUrl();
  const marketplaceId = process.env.EBAY_MARKETPLACE_ID || "EBAY_DE";
  const query = buildSearchQuery(item);
  const url = new URL(`${baseUrl}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
      "Accept-Language": "de-DE"
    }
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.errors?.[0]?.message || body.message || `eBay Browse HTTP ${response.status}`);
  }

  return (body.itemSummaries || [])
    .filter((entry) => Number(entry.price?.value) > 0)
    .map((entry, index) => ({
      source: "eBay Browse",
      title: entry.title || item.title,
      price: Math.round(Number(entry.price.value)),
      status: "active_listing",
      age: entry.itemCreationDate ? new Date(entry.itemCreationDate).toLocaleDateString("de-DE") : "live",
      matchScore: Math.max(48, Math.min(94, Math.round((Number(item.confidence) || 70) - index * 4))),
      url: entry.itemWebUrl || ""
    }));
}

async function fetchSerpApiEbayEvidence(item) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const [sold, active] = await Promise.all([
    fetchSerpApiEbaySearch(item, "Sold"),
    fetchSerpApiEbaySearch(item, "")
  ]);

  return [...sold, ...active].slice(0, 10);
}

async function fetchSerpApiEbaySearch(item, showOnly) {
  const query = buildSearchQuery(item);
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "ebay");
  url.searchParams.set("ebay_domain", "ebay.de");
  url.searchParams.set("_nkw", query);
  url.searchParams.set("_ipg", "25");
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
  if (showOnly) url.searchParams.set("show_only", showOnly);

  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error || `SerpApi HTTP ${response.status}`);
  }

  return (body.organic_results || [])
    .map((entry, index) => {
      const price = extractSerpApiPrice(entry.price);
      if (!price) return null;
      const sold = Boolean(entry.sold_date || showOnly === "Sold");
      return {
        source: sold ? "SerpApi eBay Sold" : "SerpApi eBay Web",
        title: entry.title || item.title,
        price: Math.round(price),
        status: sold ? "sold_listing" : "active_web_listing",
        age: entry.sold_date || entry.condition || entry.quantity_sold || "web",
        matchScore: Math.max(44, Math.min(88, Math.round((Number(item.confidence) || 70) - index * 3 + (sold ? 6 : 0)))),
        url: entry.link || "",
        webResearch: true
      };
    })
    .filter(Boolean);
}

function extractSerpApiPrice(price) {
  if (!price) return 0;
  if (Number(price.extracted) > 0) return Number(price.extracted);
  if (Number(price.from?.extracted) > 0 && Number(price.to?.extracted) > 0) {
    return (Number(price.from.extracted) + Number(price.to.extracted)) / 2;
  }
  if (Number(price.from?.extracted) > 0) return Number(price.from.extracted);
  if (Number(price.to?.extracted) > 0) return Number(price.to.extracted);
  return 0;
}

async function getEbayAppToken() {
  const now = Date.now();
  if (ebayAppTokenCache && ebayAppTokenCache.expiresAt > now + 60_000) {
    return ebayAppTokenCache.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required for eBay Browse.");
  }

  const baseUrl = ebayApiBaseUrl();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope"
  });

  const response = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error_description || result.error || `eBay OAuth HTTP ${response.status}`);
  }

  ebayAppTokenCache = {
    token: result.access_token,
    expiresAt: now + Number(result.expires_in || 7200) * 1000
  };

  return ebayAppTokenCache.token;
}

function ebayApiBaseUrl() {
  return (process.env.EBAY_ENV || "sandbox").toLowerCase() === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
}

function buildEbayDraft(item, priceCheck = null) {
  const fair = Number(priceCheck?.fair || item.fair || 1);
  const title = clampText(cleanTitle(item.title), 80);
  const description = [
    `<p><strong>${escapeHtml(title)}</strong></p>`,
    `<p>Zustand: ${escapeHtml(item.condition || "Gebraucht")}</p>`,
    `<p>Vollstaendigkeit: ${escapeHtml(item.completeness || "siehe Fotos")}</p>`,
    item.notes ? `<p>Hinweise: ${escapeHtml(item.notes)}</p>` : "",
    `<p>SKU: ${escapeHtml(item.sku)}</p>`,
    "<p>Bitte Fotos genau pruefen. Verkauf erfolgt aus dem CREATORS RAMROD Intake.</p>"
  ].filter(Boolean).join("");

  return {
    status: "draft_only",
    sku: item.sku,
    marketplaceId: process.env.EBAY_MARKETPLACE_ID || "EBAY_DE",
    inventoryItem: {
      sku: item.sku,
      availability: {
        shipToLocationAvailability: { quantity: 1 }
      },
      condition: mapEbayCondition(item.condition),
      product: {
        title,
        description,
        imageUrls: item.image?.startsWith("http") ? [item.image] : [],
        aspects: {
          Brand: [item.franchise || "Unbekannt"],
          Type: [item.category || "Collectible"],
          ConditionNotes: [item.completeness || item.condition || "siehe Fotos"]
        }
      }
    },
    offerDraft: {
      marketplaceId: process.env.EBAY_MARKETPLACE_ID || "EBAY_DE",
      format: "FIXED_PRICE",
      availableQuantity: 1,
      categoryId: "TODO_TAXONOMY_LOOKUP",
      merchantLocationKey: process.env.EBAY_MERCHANT_LOCATION_KEY || "creators-warehouse-01",
      listingDescription: description,
      pricingSummary: {
        price: { value: fair.toFixed(2), currency: "EUR" }
      },
      listingPolicies: {
        paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID || "TODO_PAYMENT_POLICY_ID",
        fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID || "TODO_FULFILLMENT_POLICY_ID",
        returnPolicyId: process.env.EBAY_RETURN_POLICY_ID || "TODO_RETURN_POLICY_ID"
      }
    },
    warnings: [
      "Noch nicht an eBay gesendet.",
      "Kategorie und Business Policies muessen vor Publish gesetzt sein.",
      "Bilder als Data-URL muessen vor eBay Upload extern gehostet oder per Media API verarbeitet werden."
    ]
  };
}

function normalizeResearch(item) {
  return (item.research || []).map((entry) => {
    if (Array.isArray(entry)) {
      return { source: entry[0], label: entry[1], price: entry[2], age: entry[3] };
    }
  return entry;
  });
}

function supabasePersistenceStatus() {
  return {
    configured: Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)),
    writable: Boolean(supabaseUrl && supabaseServiceRoleKey),
    projectUrl: supabaseUrl || null
  };
}

async function supabaseSelect(path) {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return supabaseRequest(path, { method: "GET" }, key);
}

async function supabaseInsert(path, payload) {
  return supabaseRequest(path, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  }, supabaseServiceRoleKey);
}

async function supabaseUpsert(path, payload) {
  return supabaseRequest(path, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload)
  }, supabaseServiceRoleKey);
}

async function supabaseRequest(path, options = {}, key) {
  if (!supabaseUrl || !key) {
    throw new Error("Supabase URL/key missing.");
  }

  const url = new URL(`/rest/v1${path}`, supabaseUrl);
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.message || body?.msg || body?.code || `Supabase HTTP ${response.status}`);
  }

  return body || [];
}

async function getOrCreateCustomer() {
  const customers = await supabaseSelect("/customers?select=id,name,slug&slug=eq.strongvision&limit=1");
  if (customers[0]) return customers[0];
  const rows = await supabaseInsert("/customers", {
    name: "Strongvision",
    slug: "strongvision",
    notes: "Pilotkunde fuer RAMROD Intake"
  });
  return rows[0];
}

async function getBoxByCode(customerId, code) {
  const rows = await supabaseSelect(`/boxes?select=id,code,label,location,status,customer_id&customer_id=eq.${encodeURIComponent(customerId)}&code=eq.${encodeURIComponent(code)}&limit=1`);
  if (rows[0]) return rows[0];
  const inserted = await supabaseInsert("/boxes", {
    customer_id: customerId,
    code,
    label: code,
    location: "CREATORS",
    status: "intake"
  });
  return inserted[0];
}

function mapDbBoxToUi(box) {
  return {
    id: box.code,
    dbId: box.id,
    label: box.label || box.code,
    location: box.location || "CREATORS",
    stage: box.status || "intake"
  };
}

function mapUiItemToDb(item, customer, box) {
  return {
    customer_id: customer.id,
    box_id: box?.id || null,
    sku: item.sku,
    title: item.title,
    category: item.category || null,
    franchise: item.franchise || null,
    condition: item.condition || null,
    completeness: item.completeness || null,
    confidence: clampNumber(item.confidence, 0, 100, 0),
    price_low: numberOrNull(item.low),
    price_fair: numberOrNull(item.fair),
    price_aggressive: numberOrNull(item.aggressive),
    weight_kg: numberOrNull(item.weight),
    primary_channel: item.channel || "Pruefen",
    status: item.stage || "scanned",
    source_type: item.sourceType || "scanapp",
    notes: item.notes || null,
    raw_analysis: {
      uiItem: item,
      image: item.image || "",
      research: item.research || [],
      whatnot: {
        eligible: Boolean(item.whatnotEligible),
        channel: item.whatnotChannel || "",
        channelLabel: item.whatnotChannelLabel || "",
        campaignId: item.campaignId || "",
        campaignSuggestion: item.campaignSuggestion || "",
        showLotType: item.showLotType || "",
        sortOrderScore: item.sortOrderScore || 0,
        bundleSuggestion: item.bundleSuggestion || "",
        script: item.whatnotScript || ""
      },
      listingDraft: item.listingDraft || null,
      ebayDraft: item.ebayDraft || null
    }
  };
}

function mapDbItemToUi(row, boxes = []) {
  const raw = row.raw_analysis || {};
  const ui = raw.uiItem || {};
  const box = boxes.find((entry) => entry.id === row.box_id || entry.dbId === row.box_id);
  const whatnot = raw.whatnot || {};

  return {
    ...ui,
    id: ui.id || row.id,
    dbId: row.id,
    sku: row.sku,
    boxId: ui.boxId || box?.code || box?.id || "SV-001",
    title: row.title,
    category: row.category || ui.category || "",
    franchise: row.franchise || ui.franchise || "",
    condition: row.condition || ui.condition || "Gebraucht",
    completeness: row.completeness || ui.completeness || "siehe Fotos",
    confidence: Number(row.confidence || ui.confidence || 0),
    low: Number(row.price_low ?? ui.low ?? 0),
    fair: Number(row.price_fair ?? ui.fair ?? 0),
    aggressive: Number(row.price_aggressive ?? ui.aggressive ?? 0),
    channel: row.primary_channel || ui.channel || "Pruefen",
    stage: row.status || ui.stage || "Gescannt",
    weight: Number(row.weight_kg ?? ui.weight ?? 0),
    image: ui.image || raw.image || "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=900&q=80",
    notes: row.notes || ui.notes || "",
    sourceType: row.source_type || ui.sourceType || "supabase",
    research: raw.research || ui.research || [],
    whatnotEligible: Boolean(whatnot.eligible ?? ui.whatnotEligible),
    whatnotChannel: whatnot.channel || ui.whatnotChannel || "",
    whatnotChannelLabel: whatnot.channelLabel || ui.whatnotChannelLabel || "",
    campaignId: whatnot.campaignId || ui.campaignId || "",
    campaignSuggestion: whatnot.campaignSuggestion || ui.campaignSuggestion || "",
    showLotType: whatnot.showLotType || ui.showLotType || "",
    sortOrderScore: Number(whatnot.sortOrderScore || ui.sortOrderScore || 0),
    bundleSuggestion: whatnot.bundleSuggestion || ui.bundleSuggestion || "",
    whatnotScript: whatnot.script || ui.whatnotScript || "",
    listingDraft: raw.listingDraft || ui.listingDraft || null,
    ebayDraft: raw.ebayDraft || ui.ebayDraft || null
  };
}

function mapUiPriceCheckToDb(itemId, priceCheck) {
  return {
    item_id: itemId,
    method: priceCheck.method || "unknown",
    query: priceCheck.query || null,
    low: numberOrNull(priceCheck.low),
    fair: numberOrNull(priceCheck.fair),
    aggressive: numberOrNull(priceCheck.aggressive),
    confidence: clampNumber(priceCheck.confidence, 0, 100, 0),
    evidence: priceCheck.evidence || [],
    notes: priceCheck.notes || [],
    checked_at: priceCheck.checkedAt || new Date().toISOString()
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildSearchQuery(item) {
  return [item.franchise, item.title, item.category].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function cleanTitle(value) {
  return String(value || "Sammlerartikel").replace(/\s+/g, " ").trim();
}

function clampText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function mapEbayCondition(value = "") {
  const text = value.toLowerCase();
  if (text.includes("neu")) return "NEW";
  if (text.includes("defekt")) return "FOR_PARTS_OR_NOT_WORKING";
  if (text.includes("sehr gut")) return "USED_EXCELLENT";
  if (text.includes("gut")) return "USED_GOOD";
  return "USED_ACCEPTABLE";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function mapAnalysisToItem(analysis, body) {
  const dominant = analysis.dominantItem;
  const now = Date.now().toString(36);
  return {
    id: `live-${now}`,
    sku: body.sku || `SV-LIVE-${now.toUpperCase()}`,
    boxId: body.boxId || "SV-LIVE",
    title: dominant.title,
    category: dominant.category,
    franchise: dominant.brandOrFranchise,
    condition: analysis.workflow.needsHumanReview ? "Pruefen" : "Gebraucht",
    completeness: dominant.completeness,
    confidence: dominant.confidence,
    low: dominant.estimatedPriceLow,
    fair: dominant.estimatedPriceFair,
    aggressive: dominant.estimatedPriceHigh,
    channel: dominant.recommendedChannel,
    whatnotEligible: dominant.whatnotEligible,
    whatnotChannel: dominant.whatnotChannel,
    whatnotChannelLabel: dominant.whatnotChannelLabel,
    campaignSuggestion: dominant.campaignSuggestion,
    showLotType: dominant.showLotType,
    sortOrderScore: dominant.sortOrderScore,
    bundleSuggestion: dominant.bundleSuggestion,
    stage: analysis.workflow.needsHumanReview ? "Gescannt" : "Freigabe",
    weight: Number(body.weight) || 0,
    image: body.imageDataUrl,
    notes: [dominant.conditionObservations, dominant.riskFlags.join("; ")].filter(Boolean).join(" "),
    research: dominant.researchQueries.map((query) => ({
      source: "OpenAI Query",
      label: query,
      price: dominant.estimatedPriceFair,
      age: "Live"
    })),
    whatnotScript: dominant.whatnotScript,
    listingDraft: dominant.listingDraft,
    otherVisibleItems: analysis.otherVisibleItems,
    sourceType: "live_openai",
    analysisModel: model
  };
}

function itemAnalysisSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["image", "dominantItem", "otherVisibleItems", "workflow"],
    properties: {
      image: {
        type: "object",
        additionalProperties: false,
        required: ["qualityNotes"],
        properties: {
          qualityNotes: { type: "string" }
        }
      },
      dominantItem: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "category",
          "brandOrFranchise",
          "identifiedText",
          "conditionObservations",
          "completeness",
          "confidence",
          "estimatedPriceLow",
          "estimatedPriceFair",
          "estimatedPriceHigh",
          "recommendedChannel",
          "whatnotEligible",
          "whatnotChannel",
          "whatnotChannelLabel",
          "campaignSuggestion",
          "showLotType",
          "sortOrderScore",
          "bundleSuggestion",
          "researchQueries",
          "listingDraft",
          "whatnotScript",
          "riskFlags"
        ],
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          brandOrFranchise: { type: "string" },
          identifiedText: { type: "array", items: { type: "string" } },
          conditionObservations: { type: "string" },
          completeness: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
          estimatedPriceLow: { type: "number" },
          estimatedPriceFair: { type: "number" },
          estimatedPriceHigh: { type: "number" },
          recommendedChannel: {
            type: "string",
            enum: ["eBay", "Whatnot", "Bundle", "Pruefen", "Problemfall"]
          },
          whatnotEligible: { type: "boolean" },
          whatnotChannel: {
            type: "string",
            enum: ["", "pokemon-cards", "playstation-games", "xbox-games", "retro-games", "comics", "action-figures", "anime-figures", "premium-collectibles", "low-value-bundles"]
          },
          whatnotChannelLabel: { type: "string" },
          campaignSuggestion: { type: "string" },
          showLotType: {
            type: "string",
            enum: ["single", "bundle", "premium", "problem"]
          },
          sortOrderScore: { type: "integer", minimum: 0, maximum: 100 },
          bundleSuggestion: { type: "string" },
          researchQueries: { type: "array", items: { type: "string" } },
          listingDraft: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description", "attributes"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              attributes: { type: "array", items: { type: "string" } }
            }
          },
          whatnotScript: { type: "string" },
          riskFlags: { type: "array", items: { type: "string" } }
        }
      },
      otherVisibleItems: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "confidence", "note"],
          properties: {
            title: { type: "string" },
            confidence: { type: "integer", minimum: 0, maximum: 100 },
            note: { type: "string" }
          }
        }
      },
      workflow: {
        type: "object",
        additionalProperties: false,
        required: ["shouldCreateItem", "needsHumanReview", "nextAction"],
        properties: {
          shouldCreateItem: { type: "boolean" },
          needsHumanReview: { type: "boolean" },
          nextAction: { type: "string" }
        }
      }
    }
  };
}

function serveStatic(request, response) {
  const url = new URL(request.url, "http://localhost");
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = resolve(root, normalize(pathname).replace(/^\/+/, ""));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(readFileSync(filePath));
}

function readRequestBody(request, limit) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function extractJson(body) {
  if (typeof body.output_text === "string") return JSON.parse(body.output_text);
  const text = body.output
    ?.flatMap((entry) => entry.content || [])
    ?.find((part) => part.type === "output_text")?.text;
  if (!text) throw new Error("Could not find output_text in OpenAI response");
  return JSON.parse(text);
}

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function redactSecret(value) {
  return String(value).replace(/(?:sk|k)-proj-[A-Za-z0-9_-]+/g, "[redacted-api-key]");
}
