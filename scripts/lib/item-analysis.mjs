export function buildItemAnalysisPrompt(recognition = null) {
  const prompt = [
    "Du bist der AI-Scanner fuer CREATORS Projekt RAMROD.",
    "Analysiere ein frisch aufgenommenes Foto aus einem Kunden-, CREATORS- oder privaten Warenbestand.",
    "Ein Foto kann einen dominanten Artikel und Nebenartikel enthalten.",
    "Pruefe zuerst, ob das Bild gedreht ist, und lies Beschriftungen gedanklich in allen vier 90-Grad-Ausrichtungen. Nenne die vermutete notwendige Rotation in image.qualityNotes.",
    "Erfinde keine Barcodes, Seriennummern, Editionen, Preise oder sichtbaren Maengel.",
    "Eine Seriennummer, Folgenummer oder Edition darf nur im Titel stehen, wenn sie im Bild eindeutig sichtbar ist. Ist zum Beispiel nur MASS EFFECT lesbar, aber keine 2 oder 3 sicher erkennbar, verwende einen neutralen Titel ohne Folgenummer und setze einen Risk Flag.",
    "Trenne sichere Beobachtungen von Vermutungen. Senke die Confidence, wenn die exakte Variante nicht sichtbar belegt ist.",
    "Nutze sichtbare Initialen, Farb-Codierungen und Beschriftungen zur Charakteridentifikation. Bei Teenage Mutant Ninja Turtles gilt: orange Maske oder M am Guertel = Michelangelo, blau oder L = Leonardo, rot oder R = Raphael, lila oder D = Donatello.",
    "Gib eine operative Artikelkarte fuer Weiterverkauf, Plattformrouting und Whatnot-Vorbereitung aus.",
    "Beruecksichtige je nach Artikel eBay, Whatnot, Kleinanzeigen, Vinted, Facebook Marketplace, Spezialforen und den eigenen Shop. Waehle den Kanal mit dem besten Verhaeltnis aus Zielgruppe, Nettoerloes, Verkaufsdauer und Arbeitsaufwand.",
    "Wenn Whatnot geeignet ist, sortiere den Artikel in einen konkreten Show-Kanal. Halte Pokemon Cards, PlayStation Games, Xbox Games, Retro Games, Comics, Action Figures und Anime Figures getrennt.",
    "Erstelle eine konkrete Verkaufsstrategie und entscheide zwischen direkt verkaufen, reinigen, reparieren, buendeln, pruefen oder als defekt/Teiletraeger verkaufen.",
    "Empfiehl eine Reparatur nur, wenn der konservativ erwartete Mehrerloes die geschaetzten Teile-, Arbeits- und Risikokosten sinnvoll uebersteigt.",
    "Nenne erforderliche Funktions- und Echtheitspruefungen, eine kurze Fotoliste, Verkaufsformat, Zielpreis, Untergrenze und erwartete Verkaufsdauer.",
    "Alle Preise sind nur eine vorlaeufige EUR-Vorbewertung ohne aktuelle Marktrecherche. Formuliere passende Suchanfragen fuer die spaetere Preisrecherche.",
    "Antworte ausschliesslich im vorgegebenen JSON-Schema und auf Deutsch."
  ].join(" ");

  if (!recognition?.identity) return prompt;

  const compactRecognition = {
    identity: recognition.identity,
    visibleText: recognition.visibleText || [],
    identifiers: recognition.identifiers || [],
    missingEvidence: recognition.missingEvidence || [],
    evidence: recognition.evidence || null
  };

  return `${prompt} Eine vorgeschaltete Schnellerkennung lieferte folgende, noch nicht als Wahrheit bestaetigte Evidenz: ${JSON.stringify(compactRecognition)}. Nutze sie als Hinweis, ueberstimme sie nur mit sichtbarem Gegenbeleg und erfinde keine fehlenden Details.`;
}

export function applyAnalysisGuardrails(input) {
  const analysis = structuredClone(input);
  const dominant = analysis?.dominantItem;
  if (!dominant || !analysis.workflow) {
    throw new Error("Analysis is missing dominantItem or workflow.");
  }

  const confidence = Math.max(0, Math.min(100, Number(dominant.confidence) || 0));
  dominant.confidence = Math.round(confidence);
  const prices = [dominant.estimatedPriceLow, dominant.estimatedPriceFair, dominant.estimatedPriceHigh]
    .map((value) => Math.max(0, Number(value) || 0))
    .sort((left, right) => left - right);
  [dominant.estimatedPriceLow, dominant.estimatedPriceFair, dominant.estimatedPriceHigh] = prices;

  if (confidence < 65) {
    dominant.recommendedChannel = "Pruefen";
    dominant.whatnotEligible = false;
    dominant.whatnotChannel = "";
    dominant.whatnotChannelLabel = "";
    analysis.workflow.needsHumanReview = true;
    analysis.workflow.nextAction = "Exakte Identitaet und sichtbare Kennzeichnungen manuell bestaetigen.";
    if (!dominant.riskFlags.includes("Identitaet unter 65 Prozent sicher")) {
      dominant.riskFlags.push("Identitaet unter 65 Prozent sicher");
    }
    if (dominant.salesStrategy) {
      dominant.salesStrategy.recommendedAction = "needs_inspection";
      dominant.salesStrategy.headline = "Identitaet und Zustand pruefen, noch nicht listen";
      dominant.salesStrategy.routeReason = "Der Verkaufskanal wird erst nach bestaetigter Identitaet festgelegt.";
      dominant.salesStrategy.approvalSummary = "Nicht freigeben: Exakte Identitaet und Variante zuerst bestaetigen.";
      if (!dominant.salesStrategy.requiredChecks.includes("Exakte Produktvariante anhand sichtbarer Kennzeichnungen bestaetigen")) {
        dominant.salesStrategy.requiredChecks.unshift("Exakte Produktvariante anhand sichtbarer Kennzeichnungen bestaetigen");
      }
    }
    if (dominant.listingDraft) {
      dominant.listingDraft.title = dominant.title;
      dominant.listingDraft.description = "Entwurf gesperrt, bis Identitaet und Variante bestaetigt sind.";
    }
    dominant.whatnotScript = "Noch nicht fuer eine Show freigegeben: Identitaet und Variante zuerst pruefen.";
  }

  const strategy = dominant.salesStrategy;
  const repair = strategy?.repairDecision;
  const defects = Array.isArray(strategy?.detectedDefects) ? strategy.detectedDefects.filter(Boolean) : [];
  const conditionText = String(dominant.conditionObservations || "").toLowerCase();
  const visibleDefect = defects.length > 0 || ["kratzer", "riss", "bruch", "defekt", "beschaed", "beschäd", "delle", "verschmutz", "fehlt"].some((token) => conditionText.includes(token));
  const conservativeNetGain = Number(repair?.estimatedValueGainLow || 0) - Number(repair?.estimatedCostHigh || 0);

  if (strategy?.recommendedAction === "repair_then_sell" && (!visibleDefect || conservativeNetGain <= 0)) {
    strategy.recommendedAction = confidence < 65 ? "needs_inspection" : "sell_as_is";
    strategy.headline = confidence < 65
      ? "Identitaet und Zustand pruefen, noch keine Reparatur ausloesen"
      : "Ohne belegten Defekt direkt verkaufsfertig machen";
    repair.recommendation = visibleDefect ? "needs_quote" : "not_applicable";
    repair.action = visibleDefect
      ? "Reparatur erst nach belastbarem Kosten- und Mehrerloesvergleich freigeben."
      : "Keine Reparatur: Auf dem Foto ist kein konkreter Defekt belegt.";
    repair.caveat = "RAMROD blockiert Reparaturempfehlungen ohne sichtbaren Defekt und positiven konservativen Nettoertrag.";
  }

  return analysis;
}

export function mapAnalysisToItem(analysis, body, options = {}) {
  const dominant = analysis.dominantItem;
  const now = Date.now().toString(36);
  const sourceType = options.sourceType || "live_ai";
  const model = options.model || "unknown";
  const researchSource = options.researchSource || "AI Query";

  return {
    id: `live-${now}`,
    sku: body.sku || `SV-LIVE-${now.toUpperCase()}`,
    boxId: body.boxId || "SV-LIVE",
    title: dominant.title,
    category: dominant.category,
    franchise: dominant.brandOrFranchise,
    condition: analysis.workflow.needsHumanReview ? "Pruefen" : (body.condition || "Gebraucht"),
    completeness: dominant.completeness,
    operatorCondition: body.condition || "",
    operatorCompleteness: body.completeness || "",
    aiConditionObservations: dominant.conditionObservations || "",
    aiRiskFlags: dominant.riskFlags || [],
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
    image: body.imageDataUrl || null,
    imageStoragePath: body.imageStoragePath || "",
    notes: [dominant.conditionObservations, ...(dominant.riskFlags || [])].filter(Boolean).join(" "),
    research: (dominant.researchQueries || []).map((query) => ({
      source: researchSource,
      label: query,
      price: dominant.estimatedPriceFair,
      age: "Live"
    })),
    whatnotScript: dominant.whatnotScript,
    listingDraft: dominant.listingDraft,
    salesStrategy: dominant.salesStrategy,
    workflow: analysis.workflow,
    otherVisibleItems: analysis.otherVisibleItems,
    sourceType,
    analysisModel: model
  };
}

export function itemAnalysisSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["image", "dominantItem", "otherVisibleItems", "workflow"],
    properties: {
      image: {
        type: "object",
        additionalProperties: false,
        required: ["qualityNotes"],
        properties: { qualityNotes: { type: "string" } }
      },
      dominantItem: {
        type: "object",
        additionalProperties: false,
        required: [
          "title", "category", "brandOrFranchise", "identifiedText", "conditionObservations",
          "completeness", "confidence", "estimatedPriceLow", "estimatedPriceFair", "estimatedPriceHigh",
          "recommendedChannel", "whatnotEligible", "whatnotChannel", "whatnotChannelLabel",
          "campaignSuggestion", "showLotType", "sortOrderScore", "bundleSuggestion", "researchQueries",
          "listingDraft", "salesStrategy", "whatnotScript", "riskFlags"
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
          recommendedChannel: { type: "string", enum: ["eBay", "Whatnot", "Kleinanzeigen", "Vinted", "Facebook Marketplace", "Spezialforum", "Strongvision", "Bundle", "Pruefen", "Problemfall"] },
          whatnotEligible: { type: "boolean" },
          whatnotChannel: {
            type: "string",
            enum: ["", "pokemon-cards", "playstation-games", "xbox-games", "retro-games", "comics", "action-figures", "anime-figures", "premium-collectibles", "low-value-bundles"]
          },
          whatnotChannelLabel: { type: "string" },
          campaignSuggestion: { type: "string" },
          showLotType: { type: "string", enum: ["single", "bundle", "premium", "problem"] },
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
          salesStrategy: {
            type: "object",
            additionalProperties: false,
            required: [
              "recommendedAction", "headline", "rationale", "detectedDefects", "preparationSteps",
              "repairDecision", "routeReason", "alternativeChannels", "salesFormat", "targetPrice", "minimumAcceptablePrice",
              "expectedTimeToSell", "requiredChecks", "photoChecklist", "approvalSummary"
            ],
            properties: {
              recommendedAction: {
                type: "string",
                enum: ["sell_as_is", "clean_and_sell", "repair_then_sell", "bundle", "parts_or_defect", "needs_inspection"]
              },
              headline: { type: "string" },
              rationale: { type: "string" },
              detectedDefects: { type: "array", items: { type: "string" } },
              preparationSteps: { type: "array", items: { type: "string" } },
              repairDecision: {
                type: "object",
                additionalProperties: false,
                required: ["recommendation", "action", "estimatedCostLow", "estimatedCostHigh", "estimatedValueGainLow", "estimatedValueGainHigh", "netGainEstimate", "caveat"],
                properties: {
                  recommendation: { type: "string", enum: ["do_not_repair", "repair_if_cheap", "repair_recommended", "needs_quote", "not_applicable"] },
                  action: { type: "string" },
                  estimatedCostLow: { type: "number" },
                  estimatedCostHigh: { type: "number" },
                  estimatedValueGainLow: { type: "number" },
                  estimatedValueGainHigh: { type: "number" },
                  netGainEstimate: { type: "number" },
                  caveat: { type: "string" }
                }
              },
              routeReason: { type: "string" },
              alternativeChannels: { type: "array", items: { type: "string" } },
              salesFormat: { type: "string", enum: ["fixed_price", "auction", "live_show", "bundle", "local_pickup", "parts"] },
              targetPrice: { type: "number" },
              minimumAcceptablePrice: { type: "number" },
              expectedTimeToSell: { type: "string", enum: ["fast", "normal", "slow", "unknown"] },
              requiredChecks: { type: "array", items: { type: "string" } },
              photoChecklist: { type: "array", items: { type: "string" } },
              approvalSummary: { type: "string" }
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
