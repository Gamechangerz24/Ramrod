export const listingCopyAgent = Object.freeze({
  id: "listing-copy-editor",
  label: "Listing-Redakteur",
  version: 1,
  purpose: "Schreibt suchstarke, ehrliche und kaufbare Angebotstexte aus bestaetigten Artikelfakten."
});

export function listingCopyContentSchema() {
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
      "buyerSearchTerms",
      "criticalMissingFacts",
      "itemSpecifics"
    ],
    properties: {
      title: { type: "string", maxLength: 80 },
      shortDescription: { type: "string", minLength: 40, maxLength: 600 },
      conditionDescription: { type: "string", minLength: 20, maxLength: 500 },
      includedItems: { type: "array", maxItems: 20, items: { type: "string" } },
      defects: { type: "array", maxItems: 20, items: { type: "string" } },
      sellingPoints: { type: "array", maxItems: 12, items: { type: "string" } },
      buyerSearchTerms: { type: "array", maxItems: 15, items: { type: "string" } },
      criticalMissingFacts: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "question", "reason", "severity"],
          properties: {
            field: { type: "string" },
            question: { type: "string" },
            reason: { type: "string" },
            severity: { type: "string", enum: ["blocking", "warning"] }
          }
        }
      },
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

export function buildListingCopyPrompt(item, categoryContext = {}) {
  const requiredAspects = (categoryContext.aspects || [])
    .filter((entry) => entry.required)
    .map((entry) => ({ name: entry.name, allowedValues: entry.values?.slice(0, 30) || [] }));
  const recommendedAspects = (categoryContext.aspects || [])
    .filter((entry) => !entry.required)
    .slice(0, 16)
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
    operatorAnswers: item.listingCopyAnswers || {},
    existingDraft: item.listingDraft || null,
    categorySuggestion: categoryContext.category || null,
    requiredAspects,
    recommendedAspects
  };

  return [
    `Du bist ${listingCopyAgent.label}, ein spezialisierter eBay-Texter fuer RAMROD.`,
    "Deine einzige Aufgabe ist ein ehrlicher, suchstarker und leicht kaufbarer deutscher Angebotstext fuer genau diesen Einzelartikel.",
    "Schreibe aus Sicht eines interessierten Kaeufers: Was ist es genau? Welche Variante ist es? Was ist enthalten? Wie ist der konkrete Zustand? Welche bestaetigten Besonderheiten oder Maengel sind kaufrelevant?",
    "Der Titel hat maximal 80 Zeichen. Ordne Marke oder Franchise, exakten Produktnamen, Modell oder Variante, Plattform oder Format und einen kaufrelevanten Zusatz nach Suchwert. Keine Keyword-Wiederholung, Emojis, Sonderzeichen-Dekoration oder Grossbuchstaben-Spam.",
    "shortDescription besteht aus zwei bis vier kurzen Saetzen. Beginne mit der eindeutigen Produktidentitaet und dem Lieferumfang. Schreibe natuerlich, konkret und ohne Werbefloskeln wie Raritaet, Highlight, Must-have oder perfekt, sofern das nicht belegt ist.",
    "conditionDescription nennt nur bestaetigte Zustandsmerkmale und echte Funktionstests. Formuliere sachlich. Eine nicht fotografierte Rueckseite, eine unbekannte Groesse oder ein nicht sichtbares Etikett sind keine Maengel und gehoeren nicht in defects.",
    "Unbestaetigte, aber kaufentscheidende Angaben kommen ausschliesslich in criticalMissingFacts. blocking bedeutet: Ohne diese Information darf der Artikel nicht veroeffentlicht werden. warning bedeutet: Die Angabe waere hilfreich, verhindert den Verkauf aber nicht.",
    "Erfinde niemals Edition, Alter, Funktion, Echtheit, Vollstaendigkeit, Groesse, Modellnummer, Seriennummer, Garantie, Sicherheit, Zubehoer oder Originalitaet.",
    "includedItems beschreibt exakt den sichtbaren oder bestaetigten Lieferumfang. defects enthaelt nur sichtbare oder bestaetigte Schaeden und Funktionsfehler. sellingPoints enthaelt zwei bis sechs bestaetigte, kaufrelevante Fakten und keine Meinung.",
    "Bei sicherheitsrelevanten Kinder-, Schutz-, Sport- oder Elektroartikeln sind fehlende Groesse, Gewichtsfreigabe, Typenschild, Sicherheitskennzeichnung oder Funktionspruefung blocking, wenn sie fuer die sichere Nutzung oder eindeutige Identifikation entscheidend sind.",
    "operatorAnswers enthaelt vom Menschen bestaetigte Fakten. Verwende diese Angaben im Text oder in den Artikelmerkmalen und frage sie nicht erneut ab.",
    "Bei itemSpecifics nur Werte mit mindestens 75 Prozent Sicherheit ausgeben und die exakten eBay-Merkmalsnamen verwenden. Fehlende Pflichtmerkmale nicht raten.",
    `Beachte die kategoriespezifischen Kaeuferfragen: ${categoryBuyerChecklist(item)}.`,
    "Antworte ausschliesslich im vorgegebenen JSON-Schema und auf Deutsch.",
    `ARTIKELFAKTEN: ${JSON.stringify(facts)}`
  ].join(" ");
}

export function inferCriticalMissingFacts(item = {}) {
  const identity = `${item.category || ""} ${item.franchise || ""} ${item.title || ""}`.toLowerCase();
  const knownFacts = [
    item.title,
    item.category,
    item.completeness,
    item.notes,
    item.aiConditionObservations,
    ...Object.values(item.listingCopyAnswers || {})
  ].map(clean).join(" ").toLowerCase();
  if (!/kind|schwimm|schutz|helm|sicherheit/.test(identity)) return [];

  const missing = [];
  if (!/(groesse|größe|gewicht|\bkg\b|\blbs?\b|alters?bereich)/.test(knownFacts)) {
    missing.push(missingFact(
      "Groesse oder Gewichtsbereich",
      "Welche Größe oder welcher zugelassene Gewichtsbereich steht auf dem Etikett?",
      "Diese Angabe entscheidet, für welches Kind die Schwimm- oder Schutzhilfe vorgesehen ist."
    ));
  }
  if (!/(typenschild|etikett|kennzeichnung|ce\b|en\s?13\d{2}|din\b)/.test(knownFacts)) {
    missing.push(missingFact(
      "Sicherheitskennzeichnung",
      "Welche Sicherheits-, Norm- oder Herstellerkennzeichnung ist auf dem Etikett lesbar?",
      "Sicherheitsrelevante Angaben dürfen nicht aus Foto oder Modellname geraten werden."
    ));
  }
  if (!/(verschluss|schnalle|naht|nähte|funktion).*(geprueft|geprüft|intakt|funktioniert)/.test(knownFacts)) {
    missing.push(missingFact(
      "Funktionsprüfung",
      "Wurden Verschlüsse, Nähte und Funktion geprüft, und mit welchem Ergebnis?",
      "Nur ein tatsächlich bestätigter Test darf im öffentlichen Angebot genannt werden."
    ));
  }
  return missing;
}

export function evaluateListingCopy(content, item = {}) {
  const title = clean(content?.title);
  const description = clean(content?.shortDescription);
  const condition = clean(content?.conditionDescription);
  const included = cleanList(content?.includedItems);
  const searchTerms = cleanList(content?.buyerSearchTerms);
  const missingFacts = normalizeMissingFacts(content?.criticalMissingFacts);
  const publicCopy = `${description} ${condition} ${cleanList(content?.defects).join(" ")}`;
  const unknownDump = publicCopy.match(/\b(nicht sichtbar|nicht erkennbar|unklar|unbekannt|vermutlich|wahrscheinlich)\b/gi) || [];
  const blockingFacts = missingFacts.filter((entry) => entry.severity === "blocking");
  const checks = [
    check("identity", "Produkt eindeutig benannt", title.length >= 20 && !/unbekannt|unknown/i.test(title)),
    check("buyer_summary", "Kaeuferfragen kompakt beantwortet", description.length >= 70),
    check("condition", "Zustand konkret beschrieben", condition.length >= 30),
    check("scope", "Lieferumfang klar", included.length > 0),
    check("search", "Suchbegriffe abgedeckt", searchTerms.length >= 3),
    check("facts", "Keine Unsicherheiten im Verkaufstext", unknownDump.length <= 1),
    check("blocking", "Keine kaufkritischen Angaben offen", blockingFacts.length === 0)
  ];
  const failed = checks.filter((entry) => !entry.ready);
  const score = Math.max(0, 100 - failed.length * 12 - Math.min(24, blockingFacts.length * 8));
  const status = blockingFacts.length ? "needs_input" : score >= 76 ? "ready" : "needs_review";
  return {
    id: listingCopyAgent.id,
    label: listingCopyAgent.label,
    version: listingCopyAgent.version,
    status,
    score,
    checks,
    missingFacts,
    summary: status === "ready"
      ? "Titel und Beschreibung sind aus Kaeufersicht klar und faktenbasiert."
      : status === "needs_input"
        ? `${blockingFacts.length} kaufkritische Angabe${blockingFacts.length === 1 ? "" : "n"} muss noch bestaetigt werden.`
        : "Der Text ist verwendbar, sollte aber vor dem Einstellen noch geschaerft werden."
  };
}

function categoryBuyerChecklist(item) {
  const haystack = `${item?.category || ""} ${item?.franchise || ""} ${item?.title || ""}`.toLowerCase();
  if (/spiel|playstation|xbox|nintendo|switch|dvd|blu.?ray|4k|film/.test(haystack)) {
    return "Plattform oder Medienformat, genaue Ausgabe, Sprache oder Region, Datentraeger, Huellen- und Disc-Zustand, Vollstaendigkeit und bestaetigter Funktionstest";
  }
  if (/konsole|controller|elektronik|geraet|handheld|computer|audio/.test(haystack)) {
    return "Hersteller, Modell, Variante oder Speicher, Serienzuordnung, Funktionstest, Akku- oder Displayzustand, Anschluesse, Zubehoer und konkrete Defekte";
  }
  if (/figur|collectible|toy|spielzeug|puppe|modell/.test(haystack)) {
    return "Hersteller, Reihe, Charakter, Massstab oder Groesse, Erscheinungsjahr, Verpackung, Zubehoer, Gelenke, Farbabrieb und Bruchstellen";
  }
  if (/pokemon|karte|trading card|tcg|comic/.test(haystack)) {
    return "Set oder Serie, Kartennummer oder Ausgabe, Sprache, Seltenheit, Zustand, Vollstaendigkeit und nur belegte Echtheit oder Bewertung";
  }
  if (/kleidung|schuh|tasche|textil|shirt|jacke|hose/.test(haystack)) {
    return "Marke, Modell, Groesse, relevante Masse, Material, Farbe, Verschluesse, Innenraum oder Sohlen und konkrete Gebrauchsspuren";
  }
  if (/kind|schwimm|schutz|helm|sicherheit|sport/.test(haystack)) {
    return "Hersteller und Modell, Groesse oder Gewichtsbereich, Typenschild und Sicherheitskennzeichnung, Verschluesse, Materialzustand, Lieferumfang und nur belegte Funktionsaussagen";
  }
  return "exakte Produktidentitaet, Modell oder Variante, Masse oder Groesse, Material, Lieferumfang, bestaetigte Funktion und konkrete Gebrauchsspuren";
}

function normalizeMissingFacts(values) {
  return (Array.isArray(values) ? values : [])
    .map((entry) => ({
      field: clean(entry?.field).slice(0, 80),
      question: clean(entry?.question).slice(0, 240),
      reason: clean(entry?.reason).slice(0, 240),
      severity: entry?.severity === "blocking" ? "blocking" : "warning"
    }))
    .filter((entry) => entry.field && entry.question);
}

function check(id, label, ready) {
  return { id, label, ready: Boolean(ready) };
}

function missingFact(field, question, reason) {
  return { field, question, reason, severity: "blocking" };
}

function cleanList(values) {
  return (Array.isArray(values) ? values : []).map(clean).filter(Boolean);
}

function clean(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}
