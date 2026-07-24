const STOP_WORDS = new Set([
  "a", "an", "and", "aus", "avec", "bei", "das", "de", "der", "die", "ein", "eine",
  "for", "fur", "gebraucht", "game", "games", "in", "inkl", "mit", "of", "ohne",
  "original", "originale", "originaler", "originales", "the", "und", "von", "with"
]);

const PLATFORM_PATTERNS = [
  ["ps5", /\b(?:ps\s*5|playstation\s*5)\b/i],
  ["ps4", /\b(?:ps\s*4|playstation\s*4)\b/i],
  ["ps3", /\b(?:ps\s*3|playstation\s*3)\b/i],
  ["ps2", /\b(?:ps\s*2|playstation\s*2)\b/i],
  ["ps1", /\b(?:ps\s*1|playstation(?:\s*1)?)\b/i],
  ["xbox-series", /\bxbox\s+series\s+[sx]\b/i],
  ["xbox-one", /\bxbox\s+one\b/i],
  ["xbox-360", /\bxbox\s*360\b/i],
  ["switch", /\bnintendo\s+switch\b|\bswitch\b/i],
  ["wii-u", /\bwii\s*u\b/i],
  ["wii", /\bwii\b/i],
  ["gamecube", /\bgame\s*cube\b|\bgamecube\b/i],
  ["dreamcast", /\bdreamcast\b/i],
  ["n64", /\bnintendo\s*64\b|\bn64\b/i],
  ["snes", /\bsuper\s+nintendo\b|\bsnes\b/i],
  ["nes", /\bnintendo\s+entertainment\s+system\b|\bnes\b/i],
  ["3ds", /\bnintendo\s*3ds\b|\b3ds\b/i],
  ["ds", /\bnintendo\s*ds\b|\bnds\b/i],
  ["pc", /\bpc\b|\bwindows\b/i]
];

const WRONG_ITEM_PATTERNS = [
  /\b(?:box|karton|verpackung)\s+(?:only|leer|allein)\b/i,
  /\b(?:empty|leere?)\s+(?:box|karton|verpackung)\b/i,
  /\b(?:case|hulle|huelle)\s+only\b/i,
  /\b(?:manual|anleitung)\s+only\b/i,
  /\b(?:ohne\s+(?:spiel|figur|konsole|controller|inhalt))\b/i,
  /\b(?:ersatzteil|replacement\s+part|parts\s+only|defekt\s+fur\s+bastler)\b/i,
  /\b(?:download\s+code|digital\s+code|key\s+only)\b/i,
  /\b(?:skin|sticker|poster|print)\s+only\b/i
];

const BUNDLE_PATTERN = /\b(?:bundle|konvolut|lot|paket|sammlung|set\s+of|[2-9]\s*x)\b/i;
const DEFECT_PATTERN = /\b(?:defekt|bastler|parts\s+only|not\s+working|ungepruft|ungetestet)\b/i;
const SEALED_PATTERN = /\b(?:neu|new|sealed|versiegelt|ungeoffnet|ungeoeffnet|ovp)\b/i;

export function evaluateComparableEvidence(item, evidence = []) {
  const target = buildTargetIdentity(item);
  const accepted = [];
  const rejected = [];

  for (const rawEntry of evidence) {
    const entry = normalizeEvidence(rawEntry);
    if (!entry.price) {
      rejected.push({ ...entry, rejected: true, rejectionReason: "Kein verwertbarer Preis" });
      continue;
    }

    const result = scoreComparable(target, entry);
    const enriched = {
      ...entry,
      matchScore: result.score,
      matchReasons: result.reasons,
      conditionMatch: result.conditionMatch,
      evidenceKind: evidenceKind(entry),
      evidenceWeight: evidenceWeight(entry, result.score, result.conditionMatch)
    };

    if (result.rejected) {
      rejected.push({
        ...enriched,
        rejected: true,
        rejectionReason: result.rejectionReason
      });
    } else {
      accepted.push(enriched);
    }
  }

  return {
    accepted,
    rejected,
    target: {
      title: target.title,
      platform: target.platform,
      modelNumber: target.modelNumber,
      condition: target.condition,
      completeness: target.completeness
    }
  };
}

export function estimatePriceFromEvidence(item, evidence = []) {
  const sold = evidence.filter((entry) => entry.evidenceKind === "sold");
  const guides = evidence.filter((entry) => entry.evidenceKind === "guide");
  const active = evidence.filter((entry) => entry.evidenceKind === "active");
  const models = evidence.filter((entry) => entry.evidenceKind === "model");
  const activeRealization = activeRealizationFactor(item);

  const soldMedian = weightedMedian(sold);
  const guideMedian = weightedMedian(guides);
  const activeMedian = weightedMedian(active);
  const modelMedian = weightedMedian(models) || positiveNumber(item.fair);

  let fair = 0;
  let basis = "KI-Vorbewertung";
  let formula = "Keine belastbaren Marktdaten; KI-Wert bleibt nur eine Vorbewertung";
  let confidenceCap = 35;

  if (sold.length >= 3) {
    fair = weightedBlend([
      [soldMedian, 0.8],
      [guideMedian, guides.length ? 0.12 : 0],
      [activeMedian * activeRealization, active.length ? 0.08 : 0]
    ]);
    basis = "verkaufte Vergleichsartikel";
    formula = "80% gewichteter Median verkaufter Treffer, ergaenzt um Preisguide und aktive Angebote";
    confidenceCap = sold.length >= 6 ? 92 : 86;
  } else if (sold.length) {
    const secondary = guideMedian || (activeMedian ? activeMedian * activeRealization : 0) || modelMedian;
    fair = weightedBlend([[soldMedian, 0.7], [secondary, 0.3]]);
    basis = "wenige verkaufte Treffer plus Sekundaerquelle";
    formula = "70% verkaufte Treffer, 30% Preisguide oder rabattierte aktive Angebote";
    confidenceCap = 75;
  } else if (guides.length) {
    fair = weightedBlend([
      [guideMedian, 0.75],
      [activeMedian * activeRealization, active.length ? 0.25 : 0]
    ]);
    basis = "Kategorie-Preisguide";
    formula = "75% Kategorie-Preisguide, 25% rabattierte aktive Angebote";
    confidenceCap = 72;
  } else if (active.length) {
    fair = activeMedian * activeRealization;
    basis = "aktive Angebotspreise";
    formula = `Gewichteter Median aktiver Angebote x ${(activeRealization * 100).toFixed(0)}% Angebots-zu-Verkauf-Faktor`;
    confidenceCap = active.length >= 5 ? 58 : 50;
  } else {
    fair = modelMedian || 1;
  }

  fair = Math.max(1, Math.round(fair));
  const primary = sold.length ? sold : guides.length ? guides : active.length ? active : models;
  const prices = primary.map((entry) => entry.price).sort((left, right) => left - right);
  const lowAnchor = prices.length >= 3 ? percentile(prices, 0.2) : fair * 0.75;
  const highAnchor = prices.length >= 3
    ? percentile(prices, 0.8)
    : activeMedian
      ? activeMedian
      : fair * 1.25;
  const low = Math.max(1, Math.round(Math.min(fair, lowAnchor) * 0.95));
  const aggressive = Math.max(fair, Math.round(highAnchor * (sold.length ? 1.03 : 1)));

  const spread = relativeSpread(prices, fair);
  const meanMatch = weightedAverage(
    evidence.map((entry) => [entry.matchScore, entry.evidenceWeight])
  ) || 0;
  const identityScore = clamp(
    item?.recognitionEvidence?.score ?? item?.recognition?.evidence?.score ?? item?.confidence,
    0,
    100,
    50
  );
  const rawConfidence = 22
    + Math.min(42, sold.length * 8)
    + Math.min(14, guides.length * 7)
    + Math.min(12, active.length * 2)
    + meanMatch * 0.12
    + identityScore * 0.08
    - Math.min(28, spread * 24);
  const confidence = clamp(Math.round(rawConfidence), 20, confidenceCap, 25);

  return {
    low,
    fair,
    aggressive,
    confidence,
    calculation: {
      basis,
      formula,
      usableCount: evidence.length,
      soldCount: sold.length,
      activeCount: active.length,
      guideCount: guides.length,
      modelCount: models.length,
      soldMedian: soldMedian || null,
      guideMedian: guideMedian || null,
      activeMedian: activeMedian || null,
      activeRealization,
      median: weightedMedian(primary) || fair,
      average: Math.round(weightedAverage(primary.map((entry) => [entry.price, entry.evidenceWeight])) || fair),
      minComparable: prices.length ? Math.min(...prices) : fair,
      maxComparable: prices.length ? Math.max(...prices) : fair
    }
  };
}

function buildTargetIdentity(item) {
  const identity = item?.recognition?.identity || {};
  const title = cleanText(identity.title || item?.title || "");
  const combined = cleanText([
    title,
    identity.brand,
    identity.franchise,
    identity.platform,
    identity.edition,
    identity.region,
    identity.modelNumber,
    item?.category,
    item?.franchise
  ].filter(Boolean).join(" "));
  const identifiers = [
    ...(item?.recognition?.identifiers || []).map((entry) => entry?.value),
    identity.modelNumber,
    item?.barcode
  ].map(cleanIdentifier).filter(Boolean);

  return {
    title,
    tokens: meaningfulTokens(title),
    allTokens: meaningfulTokens(combined),
    platform: detectPlatform(identity.platform || combined),
    modelNumber: cleanIdentifier(identity.modelNumber),
    identifiers,
    condition: conditionBucket(`${item?.operatorCondition || ""} ${item?.condition || ""}`),
    completeness: completenessBucket(`${item?.operatorCompleteness || ""} ${item?.completeness || ""}`),
    isBundle: BUNDLE_PATTERN.test(title),
    isAccessory: accessoryOnly(title)
  };
}

function scoreComparable(target, entry) {
  if (entry.evidenceKind === "model" || evidenceKind(entry) === "model") {
    return {
      score: 35,
      reasons: ["Nur KI-Vorbewertung"],
      conditionMatch: 0.35,
      rejected: false,
      rejectionReason: ""
    };
  }

  const candidateText = cleanText(`${entry.title || ""} ${entry.subtitle || ""}`);
  const candidateTokens = meaningfulTokens(candidateText);
  const candidatePlatform = detectPlatform(candidateText);
  const candidateCondition = conditionBucket(`${entry.condition || ""} ${entry.age || ""} ${candidateText}`);
  const coverage = tokenCoverage(target.tokens, candidateTokens);
  const allCoverage = tokenCoverage(target.allTokens, candidateTokens);
  const reasons = [];
  let score = 18 + coverage * 52 + allCoverage * 12;

  if (target.platform && candidatePlatform) {
    if (target.platform !== candidatePlatform) {
      return rejectedResult(10, `Falsche Plattform: ${candidatePlatform}`, 0.1);
    }
    score += 12;
    reasons.push("Plattform stimmt");
  } else if (target.platform && !candidatePlatform) {
    score -= 8;
    reasons.push("Plattform im Treffer nicht belegt");
  }

  const identifierMatch = target.identifiers.find((identifier) => candidateText.includes(identifier));
  if (identifierMatch) {
    score += 18;
    reasons.push("Kennung stimmt exakt");
  } else if (target.modelNumber) {
    score -= 5;
  }

  if (!target.isAccessory && accessoryOnly(candidateText)) {
    return rejectedResult(8, "Nur Zubehoer, Verpackung oder Ersatzteil", 0.05);
  }

  if (!target.isBundle && BUNDLE_PATTERN.test(candidateText)) {
    score -= 22;
    reasons.push("Abweichende Menge oder Bundle");
  }

  if (!target.condition.includes("defect") && DEFECT_PATTERN.test(candidateText)) {
    return rejectedResult(18, "Defekter oder ungepruefter Vergleich", 0.1);
  }

  const conditionMatch = compareCondition(target.condition, candidateCondition);
  score += Math.round((conditionMatch - 0.6) * 20);
  if (conditionMatch >= 0.9) reasons.push("Zustand vergleichbar");
  if (conditionMatch <= 0.45) reasons.push("Zustand weicht ab");

  if (target.completeness === "complete" && completenessBucket(candidateText) === "incomplete") {
    score -= 20;
    reasons.push("Unvollstaendiger Vergleich");
  }

  score = clamp(Math.round(score), 0, 100, 0);
  if (coverage < 0.42 || score < 55) {
    return rejectedResult(score, coverage < 0.42 ? "Produktname stimmt nicht ausreichend" : "Vergleich zu ungenau", conditionMatch, reasons);
  }

  if (coverage >= 0.78) reasons.unshift("Produktname stimmt weitgehend");
  return { score, reasons, conditionMatch, rejected: false, rejectionReason: "" };
}

function rejectedResult(score, rejectionReason, conditionMatch, reasons = []) {
  return { score, reasons, conditionMatch, rejected: true, rejectionReason };
}

function normalizeEvidence(entry = {}) {
  const price = positiveNumber(entry.totalPrice) || positiveNumber(entry.price);
  return {
    ...entry,
    title: String(entry.title || "").trim(),
    price,
    condition: String(entry.condition || "").trim()
  };
}

function evidenceKind(entry) {
  const status = String(entry.status || "").toLowerCase();
  const source = String(entry.source || "").toLowerCase();
  if (status.includes("sold") || source.includes("sold") || source.includes("verkauft")) return "sold";
  if (status.includes("guide") || source.includes("pricecharting") || source.includes("price guide")) return "guide";
  if (status.includes("model") || source === "ramrod" || source.includes("openai") || source.includes("ki ")) return "model";
  return "active";
}

function evidenceWeight(entry, matchScore, conditionMatch) {
  const kindWeight = {
    sold: 1,
    guide: 0.85,
    active: 0.38,
    model: 0.08
  }[evidenceKind(entry)] || 0.25;
  return round(kindWeight * Math.max(0.2, matchScore / 100) * Math.max(0.2, conditionMatch), 4);
}

function conditionBucket(value) {
  const text = cleanText(value);
  if (DEFECT_PATTERN.test(text)) return "defect";
  if (SEALED_PATTERN.test(text)) return "sealed";
  if (/\b(?:sehr gut|like new|mint|neuwertig)\b/i.test(text)) return "very_good";
  if (/\b(?:gut|good|gebraucht|used|acceptable|akzeptabel)\b/i.test(text)) return "used";
  return "unknown";
}

function completenessBucket(value) {
  const text = cleanText(value);
  if (/\b(?:unvollstaendig|incomplete|disc only|loose|ohne anleitung|ohne ovp)\b/i.test(text)) return "incomplete";
  if (/\b(?:vollstaendig|complete|cib|mit anleitung)\b/i.test(text)) return "complete";
  return "unknown";
}

function compareCondition(target, candidate) {
  if (target === "unknown" || candidate === "unknown") return 0.7;
  if (target === candidate) return 1;
  if (target === "defect" || candidate === "defect") return 0.2;
  if (target === "sealed" || candidate === "sealed") return 0.4;
  if ([target, candidate].includes("very_good") && [target, candidate].includes("used")) return 0.8;
  return 0.6;
}

function accessoryOnly(value) {
  return WRONG_ITEM_PATTERNS.some((pattern) => pattern.test(value));
}

function detectPlatform(value) {
  const text = cleanText(value);
  return PLATFORM_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] || "";
}

function meaningfulTokens(value) {
  return [...new Set(cleanText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !/^\d{1,2}$/.test(token)))];
}

function tokenCoverage(expected, actual) {
  if (!expected.length) return 0;
  const actualSet = new Set(actual);
  return expected.filter((token) => actualSet.has(token)).length / expected.length;
}

function cleanText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanIdentifier(value) {
  return cleanText(value).replace(/\s+/g, "");
}

function activeRealizationFactor(item) {
  const text = cleanText(`${item?.category || ""} ${item?.title || ""}`);
  if (/\b(?:spiel|game|software|blu ray|dvd|vinyl|cd)\b/.test(text)) return 0.86;
  if (/\b(?:karte|card|tcg|pokemon|magic)\b/.test(text)) return 0.88;
  if (/\b(?:konsole|console|elektronik|controller|handy|computer)\b/.test(text)) return 0.82;
  if (/\b(?:figur|collectible|toy|lego|comic)\b/.test(text)) return 0.8;
  if (/\b(?:mode|tasche|schuhe|kleidung)\b/.test(text)) return 0.78;
  return 0.82;
}

function weightedMedian(entries) {
  const values = entries
    .filter((entry) => positiveNumber(entry.price))
    .map((entry) => ({
      value: Number(entry.price),
      weight: Math.max(0.0001, Number(entry.evidenceWeight) || 1)
    }))
    .sort((left, right) => left.value - right.value);
  if (!values.length) return 0;
  const total = values.reduce((sum, entry) => sum + entry.weight, 0);
  let cumulative = 0;
  for (const entry of values) {
    cumulative += entry.weight;
    if (cumulative >= total / 2) return entry.value;
  }
  return values.at(-1).value;
}

function weightedAverage(values) {
  const usable = values.filter(([value, weight]) => Number.isFinite(Number(value)) && Number(weight) > 0);
  const totalWeight = usable.reduce((sum, [, weight]) => sum + Number(weight), 0);
  if (!totalWeight) return 0;
  return usable.reduce((sum, [value, weight]) => sum + Number(value) * Number(weight), 0) / totalWeight;
}

function weightedBlend(values) {
  return weightedAverage(values.filter(([value, weight]) => positiveNumber(value) && weight > 0));
}

function relativeSpread(prices, center) {
  if (prices.length < 2 || !center) return 0.2;
  const sorted = [...prices].sort((left, right) => left - right);
  return Math.max(0, (percentile(sorted, 0.8) - percentile(sorted, 0.2)) / center);
}

function percentile(sorted, fraction) {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
