import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const manifestPath = process.argv[2] || "data/drive-demo-files.json";
const limitArg = Number(process.argv[3] || process.env.SCANAPP_ANALYZE_LIMIT || 3);
const outputPath = process.env.SCANAPP_ANALYSIS_OUTPUT || "data/drive-demo-analysis.json";

loadDotEnv(".env.local");

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const detail = process.env.OPENAI_IMAGE_DETAIL || "high";

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing. Add it to .env.local or export it in the shell.");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const files = manifest.files.slice(0, Number.isFinite(limitArg) ? limitArg : 3);

await mkdir(path.dirname(outputPath), { recursive: true });

const results = [];

for (const file of files) {
  console.log(`Analyzing ${file.name} with ${model}...`);
  const imagePath = file.normalizedLocalPath || file.localPath;
  const image = await readFile(imagePath);
  const dataUrl = `data:${file.mimeType};base64,${image.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
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
                "Analysiere dieses Foto aus einer wilden Strongvision-Kiste.",
                "Ein Foto kann einen dominanten Artikel und weitere Nebenartikel zeigen.",
                "Erkenne nur, was visuell begruendbar ist. Erfinde keine Barcodes, Seriennummern oder Editionen.",
                "Gib eine operative Artikelkarte fuer den Verkauf aus.",
                "Preise sind nur grobe Vor-Recherche-Startwerte in EUR, keine finale Bewertung."
              ].join(" ")
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "scanapp_item_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["image", "dominantItem", "otherVisibleItems", "workflow"],
            properties: {
              image: {
                type: "object",
                additionalProperties: false,
                required: ["fileName", "qualityNotes"],
                properties: {
                  fileName: { type: "string" },
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
          }
        }
      }
    })
  });

  const body = await response.json();

  if (!response.ok) {
    const code = body.error?.code || "unknown_error";
    const message = body.error?.message ? redactSecret(body.error.message) : "No error message";
    throw new Error(`${response.status} ${response.statusText}: ${code}: ${message}`);
  }

  results.push({
    source: file,
    usage: body.usage || null,
    analysis: extractJson(body)
  });
}

await writeFile(
  outputPath,
  JSON.stringify(
    {
      model,
      detail,
      createdAt: new Date().toISOString(),
      sourceManifest: manifestPath,
      count: results.length,
      results
    },
    null,
    2
  )
);

console.log(`Wrote ${results.length} analyses -> ${outputPath}`);

function extractJson(body) {
  if (typeof body.output_text === "string") {
    return JSON.parse(body.output_text);
  }

  const text = body.output
    ?.flatMap((entry) => entry.content || [])
    ?.find((part) => part.type === "output_text")?.text;

  if (!text) {
    throw new Error(`Could not find output_text in response: ${JSON.stringify(body)}`);
  }

  return JSON.parse(text);
}

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSyncCompat(filePath);
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

function readFileSyncCompat(filePath) {
  return readFileSync(filePath, "utf8");
}

function redactSecret(value) {
  return String(value).replace(/(?:sk|k)-proj-[A-Za-z0-9_-]+/g, "[redacted-api-key]");
}
