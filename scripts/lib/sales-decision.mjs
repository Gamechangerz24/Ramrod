export function reconcileSalesDecision(item, priceCheck) {
  const title = String(item?.title || "").trim();
  const categoryText = [title, item?.category, item?.franchise, item?.productType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const operatorContext = [item?.operatorCondition, item?.operatorCompleteness, item?.operatorNotes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const conditionText = operatorContext || [item?.condition, item?.completeness, item?.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const fair = positiveNumber(priceCheck?.fair, item?.fair, 0);
  const low = positiveNumber(priceCheck?.low, item?.low, Math.max(1, Math.round(fair * 0.65)));
  const marketConfidence = clamp(priceCheck?.confidence, 0, 100, 0);
  const evidenceCount = (priceCheck?.evidence || []).filter((entry) => !entry?.outlier).length;
  const recognitionScore = clamp(
    item?.recognitionEvidence?.score ?? item?.recognition?.evidence?.score ?? item?.confidence,
    0,
    100,
    0
  );
  const liveMarket = ["ebay-browse", "web-research", "multi-source"].includes(priceCheck?.method);
  const unknownIdentity = !title || /unbekannt|unknown|sammlerartikel|nicht erkannt/i.test(title);
  const sourceMatchReady = !unknownIdentity
    && recognitionScore >= 60
    && marketConfidence >= 55
    && (!liveMarket || evidenceCount >= 2);

  const isGame = /videospiel|video game|xbox|playstation|nintendo|dreamcast|game boy|switch|ps[1-5]\b/.test(categoryText);
  const isCard = /pokemon|pokémon|trading card|sammelkarte|tcg|magic the gathering|yu-gi-oh/.test(categoryText);
  const isCollectible = /collectible|sammler|actionfigur|action figure|figur|comic|toy|spielzeug/.test(categoryText);
  const isFashion = /handtasche|designer.?tasche|schuhe|sneaker|kleidung|jacke|mantel|kleid\b|mode|fashion/.test(categoryText);
  const isLocalGeneral = /staubsauger|kindersitz|kinderwagen|möbel|moebel|sofa|esstisch|haushaltsgerät|haushaltsgeraet|waschmaschine|kühlschrank|kuehlschrank|fahrrad|fitnessgerät|fitnessgeraet/.test(categoryText);
  const isEverydayBundle = /spielzeugpaket|kleiderpaket|haushaltspaket|kinderkleidung.?paket|haushaltsauflösung|haushaltsaufloesung/.test(categoryText);
  const isSpecialist = /modelleisenbahn|modellbahn|analogkamera|plattenspieler|verstärker|verstaerker|hi-?fi|vintage.?uhr/.test(categoryText);
  const specialEdition = /collector|collectors|collector's|limited|special edition|steelbook|deluxe|first edition|erstauflage/.test(categoryText);
  const explicitCosmeticIssue = /kratzer|scratch|delle|dent|staub|dust|verschmutz|verfärb|verfaerb|abrieb/.test(conditionText);
  const explicitFunctionalIssue = /defekt|kaputt|broken|bruch|riss|funktioniert nicht|untested|ungetestet/.test(conditionText);

  let channel = "Pruefen";
  const reasons = [];
  if (!sourceMatchReady) {
    reasons.push("Identität oder Marktbelege reichen für eine automatische Kanalempfehlung noch nicht aus.");
  } else if (isFashion) {
    channel = "Vinted";
    reasons.push("Mode, Schuhe und Taschen erreichen auf Vinted eine passende kaufbereite Zielgruppe; Marke, Größe und Zustand müssen klar belegt sein.");
  } else if (isLocalGeneral) {
    channel = "Kleinanzeigen";
    reasons.push("Sperrige oder alltagsnahe Gebrauchtware ist über Kleinanzeigen mit Abholung meist wirtschaftlicher als Paketversand.");
  } else if (isEverydayBundle) {
    channel = "Facebook Marketplace";
    reasons.push("Lokale Pakete und gemischte Alltagsware lassen sich über Facebook Marketplace zielgruppennah als Abhol-Bundle anbieten.");
  } else if (isSpecialist && fair >= 75) {
    channel = "Spezialforum";
    reasons.push("Der Artikel braucht Fachpublikum und erklärungsbedürftige Zustandsdetails; ein passendes Spezialforum kann qualifiziertere Käufer liefern.");
  } else if (isGame) {
    channel = specialEdition || fair >= 12 ? "eBay" : "Whatnot";
    reasons.push(channel === "eBay"
      ? "Identifizierte Spiele, Sondereditionen und höherwertige Einzelstücke sind über eBay gezielter suchbar."
      : "Niedrigpreisige Standardspiele sind wirtschaftlicher in einer passenden Whatnot-Show oder als Bundle.");
  } else if (isCard) {
    channel = fair >= 25 ? "eBay" : "Whatnot";
    reasons.push(channel === "eBay"
      ? "Der Einzelwert rechtfertigt ein suchbares Festpreisangebot."
      : "Niedrigpreisige Karten werden nach Spiel und Set in eine Whatnot-Kampagne gruppiert.");
  } else if (isCollectible) {
    channel = fair >= 20 || specialEdition ? "eBay" : "Whatnot";
    reasons.push(channel === "eBay"
      ? "Der Artikel ist als identifiziertes Einzelstück mit Festpreis sinnvoll."
      : "Der Artikel passt wirtschaftlich besser in eine thematisch passende Live-Kampagne.");
  } else {
    channel = "eBay";
    reasons.push("Für das identifizierte Einzelstück ist ein suchbares Festpreisangebot der belastbarste Startkanal.");
  }

  const currentStrategy = structuredClone(item?.salesStrategy || {});
  const modelDefects = Array.isArray(currentStrategy.detectedDefects) ? currentStrategy.detectedDefects : [];
  let recommendedAction = "sell_as_is";
  let repairDecision = {
    recommendation: "not_applicable",
    action: "Keine Reparatur vorgesehen. Reinigen, prüfen und den tatsächlichen Zustand fotografisch belegen.",
    estimatedCostLow: 0,
    estimatedCostHigh: 0,
    estimatedValueGainLow: 0,
    estimatedValueGainHigh: 0,
    netGainEstimate: 0,
    caveat: "Ein Teiletausch wird erst nach dokumentiertem Defekt und Kostenvergleich empfohlen."
  };

  if (explicitFunctionalIssue) {
    recommendedAction = "needs_inspection";
    repairDecision = {
      ...repairDecision,
      recommendation: fair >= 30 ? "needs_quote" : "do_not_repair",
      action: fair >= 30
        ? "Funktion und Ursache prüfen; Reparaturkosten vor Freigabe gegen den belegten Mehrerlös rechnen."
        : "Als defekt oder für Teile anbieten, sofern eine günstige Reparatur nicht sicher belegt ist."
    };
  } else if (explicitCosmeticIssue) {
    recommendedAction = "clean_and_sell";
    repairDecision = {
      ...repairDecision,
      recommendation: "repair_if_cheap",
      action: "Zuerst reinigen und neu fotografieren. Sichtteile nur tauschen, wenn Kosten und Mehrerlös vorher belegt sind."
    };
  } else if (modelDefects.length) {
    recommendedAction = "needs_inspection";
    repairDecision = {
      ...repairDecision,
      recommendation: "needs_quote",
      action: "Die KI vermutet einen Mangel. Vor Reparatur oder Verkauf muss er mit Detailfoto oder Funktionstest bestätigt werden."
    };
  } else if (/gebraucht|used/.test(conditionText)) {
    recommendedAction = "clean_and_sell";
  }

  const alternativeChannels = {
    eBay: ["RAMROD Shop", "Spezialforum"],
    Whatnot: ["eBay", "RAMROD Shop"],
    Kleinanzeigen: ["Facebook Marketplace"],
    Vinted: ["Kleinanzeigen"],
    "Facebook Marketplace": ["Kleinanzeigen"],
    Spezialforum: ["eBay"],
    Strongvision: ["eBay"]
  }[channel] || [];
  const salesFormat = channel === "Whatnot"
    ? "live_show"
    : ["Kleinanzeigen", "Facebook Marketplace"].includes(channel)
      ? "local_pickup"
      : "fixed_price";
  const strategy = {
    ...currentStrategy,
    recommendedAction,
    headline: channel === "Pruefen"
      ? "Erst Identität und Marktbelege vervollständigen"
      : `${channel}: zum belegten Marktpreis vorbereiten`,
    rationale: reasons.join(" "),
    repairDecision,
    routeReason: reasons.join(" "),
    alternativeChannels,
    salesFormat,
    targetPrice: fair,
    minimumAcceptablePrice: low,
    expectedTimeToSell: fair < 15 ? "fast" : "normal",
    requiredChecks: uniqueStrings([
      ...(currentStrategy.requiredChecks || []),
      "Identität mit sichtbarem Merkmal oder Katalogquelle bestätigen",
      "Zustand und Lieferumfang vor Veröffentlichung bestätigen"
    ]),
    approvalSummary: channel === "Pruefen"
      ? "Noch nicht freigeben: Identität oder Marktbelege fehlen."
      : `Nach Zustandsprüfung für ${channel} zum Zielpreis ${Math.round(fair)} EUR vorbereiten.`
  };

  return {
    channel,
    whatnotEligible: channel === "Whatnot",
    reviewRequired: channel === "Pruefen" || recommendedAction === "needs_inspection",
    sourceMatchReady,
    reasons,
    salesStrategy: strategy,
    evidence: {
      recognitionScore,
      marketConfidence,
      evidenceCount,
      liveMarket
    }
  };
}

function positiveNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}
