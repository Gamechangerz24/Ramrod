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
    if (request.method === "POST" && request.url === "/api/analyze-image") {
      await handleAnalyzeImage(request, response);
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
      serpApi: Boolean(process.env.SERPAPI_API_KEY)
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
  if (ebayPriceProvider === "ebay-browse") {
    try {
      const evidence = await fetchEbayBrowseEvidence(item);
      if (evidence.length) {
        return buildPriceCheckFromEvidence(item, evidence, "ebay-browse", [
          "Live-eBay-Browse-Preischeck aus aktiven eBay-Angeboten.",
          "Sold-Prices sind hier noch nicht enthalten.",
          "Finaler Preis bleibt Review-pflichtig."
        ]);
      }
      const fallback = buildLocalPriceCheck(item);
      fallback.notes = [
        "eBay Browse wurde abgefragt, lieferte aber keine verwertbaren Treffer; lokaler Fallback genutzt.",
        "Die Query kann zu eng sein oder eBay hat fuer diesen Artikel keine passenden aktiven Angebote geliefert.",
        "Weitere Quellen wie SerpApi, PriceCharting oder Kategorie-spezifische Adapter koennen die Trefferquote verbessern."
      ];
      return fallback;
    } catch (error) {
      const fallback = buildLocalPriceCheck(item);
      fallback.notes = [
        `eBay Browse nicht verfuegbar: ${redactSecret(error.message)}. Lokaler Fallback genutzt.`,
        "Fuer echte eBay-Preise brauchen wir einen gueltigen Live-Provider."
      ];
      return fallback;
    }
  }

  return buildLocalPriceCheck(item);
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
  const evidenceCap = method === "ebay-browse"
    ? (usableEvidence.length === 1 ? 62 : usableEvidence.length === 2 ? 72 : 94)
    : 94;
  const confidence = Math.max(35, Math.min(evidenceCap, baseConfidence));
  const finalNotes = [
    ...notes,
    ...(method === "ebay-browse" && usableEvidence.length < 3
      ? ["Nur wenige eBay-Treffer gefunden; Preis als Indikation, nicht als belastbarer Marktwert."]
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
    evidence: markedEvidence.slice(0, 6),
    notes: finalNotes
  };
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
