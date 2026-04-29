import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

loadDotEnv(".env.local");

const root = resolve(".");
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

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
                "Gib eine operative Artikelkarte fuer Weiterverkauf, Plattformrouting und Whatnot-Vorbereitung aus.",
                "Preise sind nur Vorbewertung in EUR ohne Webrecherche."
              ].join(" ")
            },
            {
              type: "input_image",
              image_url: body.imageDataUrl,
              detail: process.env.OPENAI_IMAGE_DETAIL || "high"
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
    otherVisibleItems: analysis.otherVisibleItems
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

  createReadStream(filePath).pipe(response);
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
