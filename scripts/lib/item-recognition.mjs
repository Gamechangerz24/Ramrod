export function buildItemRecognitionPrompt() {
  return [
    "Erkenne schnell und konservativ den dominanten Verkaufsartikel.",
    "Lies das Bild in allen vier 90-Grad-Ausrichtungen. image.rotation ist die nötige Drehung im Uhrzeigersinn, damit der längste Produkttitel horizontal von links nach rechts steht.",
    "Wenn der Produkttitel vertikal oder kopfstehend ist, darf rotation nicht 0 sein.",
    "Uebernimm Identitaetsfelder nur bei sichtbarem Beleg; sonst leerer String.",
    "Verpackung beweist keinen Inhalt. Erfinde keine Variante oder Vollstaendigkeit.",
    "visibleText enthaelt maximal 12 sicher gelesene Texte, identifiers maximal 4 Codes oder Modellnummern.",
    "Keine Preise, Erklaerungen, Alternativen oder Verkaufsstrategie. Nur JSON auf Deutsch."
  ].join(" ");
}

export function itemRecognitionSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["image", "identity", "visibleText", "identifiers", "modelConfidence"],
    properties: {
      image: {
        type: "object",
        additionalProperties: false,
        required: ["rotation", "usable", "issues"],
        properties: {
          rotation: { type: "integer", enum: [0, 90, 180, 270] },
          usable: { type: "boolean" },
          issues: { type: "array", maxItems: 3, items: { type: "string" } }
        }
      },
      identity: {
        type: "object",
        additionalProperties: false,
        required: ["title", "productType", "category", "brand", "franchise", "platform", "edition", "region", "modelNumber"],
        properties: {
          title: { type: "string" },
          productType: { type: "string" },
          category: { type: "string" },
          brand: { type: "string" },
          franchise: { type: "string" },
          platform: { type: "string" },
          edition: { type: "string" },
          region: { type: "string" },
          modelNumber: { type: "string" }
        }
      },
      visibleText: { type: "array", maxItems: 12, items: { type: "string" } },
      identifiers: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "value"],
          properties: {
            type: { type: "string" },
            value: { type: "string" }
          }
        }
      },
      modelConfidence: { type: "integer", minimum: 0, maximum: 100 }
    }
  };
}

export function scoreItemRecognition(input, context = {}) {
  const recognition = structuredClone(input);
  recognition.alternatives = Array.isArray(recognition.alternatives) ? recognition.alternatives : [];
  recognition.missingEvidence = Array.isArray(recognition.missingEvidence) ? recognition.missingEvidence : [];
  recognition.requestedPhotos = Array.isArray(recognition.requestedPhotos) ? recognition.requestedPhotos : [];
  const identity = recognition.identity || {};
  const visibleText = uniqueStrings(recognition.visibleText);
  const identifiers = uniqueIdentifiers(recognition.identifiers);
  const imageIssues = normalizeImageIssues(recognition.image?.issues);
  const actionableImageIssues = imageIssues.filter((issue) => !isOrientationIssue(issue));
  const imageCount = clampInteger(context.imageCount, 1, 4, 1);
  const barcode = String(context.barcode || "").trim();
  const clientQualityScores = (context.clientImageQualities || [])
    .map((entry) => Number(entry?.score))
    .filter(Number.isFinite);
  const modelConfidence = clampInteger(recognition.modelConfidence, 0, 100, 0);
  const evidenceText = [
    ...visibleText,
    ...identifiers.map((entry) => entry.value),
    barcode
  ].join(" ");
  const titleCoverage = tokenCoverage(identity.title, evidenceText);
  const supportedFields = ["brand", "franchise", "platform", "edition", "region", "modelNumber"]
    .filter((field) => identity[field] && tokenCoverage(identity[field], evidenceText) >= 0.5);
  const criticalMissing = requiredIdentityFields(identity)
    .filter((field) => !String(identity[field] || "").trim());

  let qualityScore = recognition.image?.usable === false ? 20 : 100;
  qualityScore -= Math.min(60, actionableImageIssues.length * 15);
  // A weak detail shot must not invalidate an otherwise usable multi-angle set.
  // The model still has the final say through image.usable and image.issues.
  if (clientQualityScores.length) qualityScore = Math.min(qualityScore, Math.max(...clientQualityScores));
  qualityScore = clampInteger(qualityScore, 0, 100, 0);

  let identityScore = 5;
  if (identity.title && identity.productType) identityScore += Math.round(modelConfidence * 0.5);
  identityScore += Math.round(titleCoverage * 35);
  identityScore += Math.min(30, identifiers.length * 15 + (barcode ? 15 : 0));
  identityScore += Math.min(20, supportedFields.length * 4);
  identityScore += Math.min(10, Math.max(0, imageCount - 1) * 5);
  identityScore -= Math.min(30, criticalMissing.length * 8);
  identityScore -= Math.min(20, uniqueStrings(recognition.missingEvidence).length * 4);
  identityScore = clampInteger(identityScore, 0, 90, 0);

  const score = clampInteger(Math.round(identityScore * (qualityScore / 100)), 0, 90, 0);
  const status = qualityScore < 55
    ? "needs_better_photo"
    : score < 55 || criticalMissing.length
      ? "needs_more_evidence"
      : "ready_for_research";
  const requestedPhotos = mergeRequestedPhotos(
    recognition.requestedPhotos,
    deterministicPhotoRequests(identity, criticalMissing, actionableImageIssues)
  );

  recognition.visibleText = visibleText;
  recognition.identifiers = identifiers;
  recognition.image = { ...(recognition.image || {}), issues: imageIssues };
  recognition.missingEvidence = uniqueStrings([
    ...(recognition.missingEvidence || []),
    ...criticalMissing.map(identityFieldLabel)
  ]);
  recognition.requestedPhotos = requestedPhotos;
  recognition.evidence = {
    score,
    identityScore,
    qualityScore,
    titleCoverage: Math.round(titleCoverage * 100),
    supportedFields,
    criticalMissing,
    status,
    releaseGate: "blocked_until_source_match",
    autoApprovalEligible: false
  };

  return recognition;
}

function requiredIdentityFields(identity) {
  const text = `${identity.category || ""} ${identity.productType || ""}`.toLowerCase();
  const fields = ["title", "productType"];
  const isControllerOrAccessory = /joy.?con|controller|gamepad|zubehoer|zubehör|accessor|peripher/.test(text);
  if (/game|spiel|software|videospiel/.test(text)) fields.push("platform");
  if (isControllerOrAccessory) fields.push("brand", "platform");
  if (!isControllerOrAccessory && /konsole|console|elektronik|electronic|geraet|gerät|appliance/.test(text)) fields.push("brand", "modelNumber");
  if (/figur|figure|collectible|toy|spielzeug/.test(text)) fields.push("brand");
  if (/karte|card|tcg/.test(text)) fields.push("edition", "region");
  return [...new Set(fields)];
}

function deterministicPhotoRequests(identity, missingFields, issues) {
  const requests = [];
  if (issues.length) {
    requests.push({ type: "retake", instruction: "Artikel gerade, vollständig, scharf und ohne Spiegelung fotografieren." });
  }
  if (missingFields.includes("platform") || missingFields.includes("edition") || missingFields.includes("region")) {
    requests.push({ type: "back", instruction: "Rückseite mit Plattform-, Regions- und Editionsangaben fotografieren." });
  }
  if (missingFields.includes("brand") || missingFields.includes("modelNumber")) {
    requests.push({ type: "label", instruction: "Typenschild, Unterseite oder Herstellerprägung formatfüllend fotografieren." });
  }
  if (/figur|figure|collectible|toy|spielzeug/i.test(`${identity.category || ""} ${identity.productType || ""}`)) {
    requests.push({ type: "contents", instruction: "Artikel und sichtbares Zubehör außerhalb oder neben der Verpackung zeigen." });
  }
  return requests;
}

function mergeRequestedPhotos(primary = [], fallback = []) {
  const merged = [];
  const seen = new Set();
  for (const entry of [...primary, ...fallback]) {
    const type = String(entry?.type || "detail").trim();
    const instruction = String(entry?.instruction || "").trim();
    if (!instruction) continue;
    const key = `${type}:${instruction}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ type, instruction });
    if (merged.length === 3) break;
  }
  return merged;
}

function uniqueStrings(values = []) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function uniqueIdentifiers(values = []) {
  const result = [];
  const seen = new Set();
  for (const entry of values || []) {
    const type = String(entry?.type || "unknown").trim();
    const value = String(entry?.value || "").trim();
    if (!value) continue;
    const key = `${type}:${value}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ type, value });
  }
  return result;
}

function tokenCoverage(needle, haystack) {
  const expected = tokenize(needle);
  if (!expected.size) return 0;
  const actual = tokenize(haystack);
  const matches = [...expected].filter((token) => actual.has(token)).length;
  return matches / expected.size;
}

function tokenize(value) {
  return new Set(String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1));
}

function identityFieldLabel(field) {
  return {
    title: "Exakter Produktname",
    productType: "Produkttyp",
    platform: "Plattform",
    brand: "Hersteller oder Marke",
    modelNumber: "Modellnummer",
    edition: "Edition",
    region: "Region"
  }[field] || field;
}

function clampInteger(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}

function isOrientationIssue(value) {
  return /rotation|orientation|gedreht|seitlich|kopfstehend|querformat/i.test(String(value || ""));
}

function normalizeImageIssues(values = []) {
  const knownIssue = /unscharf|blur|dunkel|dark|überbelichtet|ueberbelichtet|overexposed|abgeschnitten|cropped|spiegelung|reflection|glare|verdeckt|occluded|rotation|orientation|gedreht|seitlich|kopfstehend|querformat|auflösung|aufloesung|resolution|beschädigt|beschaedigt|unleserlich|illegible/i;
  return uniqueStrings(values).filter((value) => knownIssue.test(value));
}
