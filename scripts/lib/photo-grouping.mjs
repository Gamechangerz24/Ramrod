export function buildPhotoGroupingPrompt(imageCount) {
  return [
    `Du erhaeltst ${imageCount} nummerierte Fotos aus einer privaten Spiele- und Filmsammlung.`,
    "Gruppiere Fotos, die dasselbe physische Exemplar zeigen: Vorderseite, Rueckseite, Ruecken, Barcode oder Datentraeger eines Spiels oder Films.",
    "Nutze sichtbaren Titel, Motiv, Plattform, Medienformat, Edition, Barcode und Verpackungsdetails. Die Reihenfolge ist ein Hinweis, aber kein Beweis.",
    "Mehrere Vorderseiten verschiedener Exemplare bleiben getrennt, auch wenn Titel oder Motiv identisch sind.",
    "Verbinde Bilder nur bei belastbarer Uebereinstimmung. Bei Unsicherheit bleibt ein Foto eine eigene Gruppe.",
    "Jede Bildnummer muss genau einmal vorkommen. Eine Gruppe darf hoechstens sechs Bilder enthalten.",
    "titleHint ist nur ein kurzer sichtbarer Arbeitstitel. Keine Preise, Marktanalyse oder erfundenen Editionen.",
    "Gib ausschliesslich das vorgegebene JSON aus."
  ].join(" ");
}

export function photoGroupingSchema(imageCount) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["groups", "unassigned"],
    properties: {
      groups: {
        type: "array",
        maxItems: imageCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["imageIndexes", "titleHint", "confidence", "reason"],
          properties: {
            imageIndexes: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: { type: "integer", minimum: 1, maximum: imageCount }
            },
            titleHint: { type: "string" },
            confidence: { type: "integer", minimum: 0, maximum: 100 },
            reason: { type: "string" }
          }
        }
      },
      unassigned: {
        type: "array",
        maxItems: imageCount,
        items: { type: "integer", minimum: 1, maximum: imageCount }
      }
    }
  };
}

export function normalizePhotoGroups(input, imageCount) {
  const count = Math.max(0, Math.min(30, Number(imageCount) || 0));
  const seen = new Set();
  const groups = [];

  for (const candidate of Array.isArray(input?.groups) ? input.groups : []) {
    const indexes = [];
    for (const rawIndex of Array.isArray(candidate?.imageIndexes) ? candidate.imageIndexes : []) {
      const index = Number(rawIndex) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= count || seen.has(index)) continue;
      seen.add(index);
      indexes.push(index);
      if (indexes.length >= 6) break;
    }
    if (!indexes.length) continue;
    groups.push({
      imageIndexes: indexes.sort((left, right) => left - right),
      titleHint: String(candidate?.titleHint || "").replace(/\s+/g, " ").trim().slice(0, 160),
      confidence: clamp(candidate?.confidence, 0, 100),
      reason: String(candidate?.reason || "Automatisch nach sichtbaren Merkmalen gruppiert.").replace(/\s+/g, " ").trim().slice(0, 240)
    });
  }

  for (const rawIndex of Array.isArray(input?.unassigned) ? input.unassigned : []) {
    const index = Number(rawIndex) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= count || seen.has(index)) continue;
    seen.add(index);
    groups.push(singlePhotoGroup(index));
  }

  for (let index = 0; index < count; index += 1) {
    if (!seen.has(index)) groups.push(singlePhotoGroup(index));
  }

  return groups.sort((left, right) => left.imageIndexes[0] - right.imageIndexes[0]);
}

function singlePhotoGroup(index) {
  return {
    imageIndexes: [index],
    titleHint: "",
    confidence: 0,
    reason: "Keine sichere Zuordnung; als einzelnes Exemplar vorbereitet."
  };
}

function clamp(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(number)));
}
