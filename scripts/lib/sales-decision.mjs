import { channelPlanEntry } from "./channel-registry.mjs";

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
  const isSingleCard = isCard && /single|einzelkarte|graded|psa|bgs|cgc|karte\b/.test(categoryText) && !/display|booster box|sealed|versiegelt/.test(categoryText);
  const isLego = /\blego\b|minifig|bricklink|klemmbaustein/.test(categoryText);
  const isVinyl = /vinyl|schallplatte|lp\b|12.?inch|7.?inch|discogs/.test(categoryText);
  const isMusicGear = /gitarre|bassgitarre|synthesizer|keyboard|mischpult|audio interface|effektpedal|gitarrenverstärker|gitarrenverstaerker/.test(categoryText);
  const isVintageDecor = /vintage.?deko|mid.?century|antiquität|antiquitaet|designobjekt|keramik|porzellan/.test(categoryText);
  const isNerdItem = isGame || isCard || isCollectible || isLego || /star wars|star trek|anime|manga|comic|retro/.test(categoryText);
  const isVisualStory = isNerdItem || isFashion || isVintageDecor;
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
  } else if (isSingleCard) {
    channel = "Cardmarket";
    reasons.push("Die Karte ist katalogisierbar und erreicht auf Cardmarket gezielt Käufer, die nach Set, Sprache und Zustand suchen.");
  } else if (isLego && /set|minifig|figur|technic|creator|nummer|\b\d{4,6}\b/.test(categoryText)) {
    channel = "BrickLink";
    reasons.push("Identifizierte LEGO Sets, Minifiguren und Teile sind auf BrickLink präziser katalogisierbar als auf einem allgemeinen Marktplatz.");
  } else if (isVinyl) {
    channel = "Discogs";
    reasons.push("Für Tonträger liefert Discogs das passendere Katalog- und Sammlerumfeld; Pressung und Medienzustand müssen belegt sein.");
  } else if (isMusicGear) {
    channel = "Reverb";
    reasons.push("Musikinstrumente und Studioequipment erreichen auf Reverb Fachkäufer; Funktionstest und Seriennummer sind dafür entscheidend.");
  } else if ((isVintageDecor || specialEdition) && fair >= 250) {
    channel = "Catawiki";
    reasons.push("Der erwartete Wert und die Besonderheit rechtfertigen eine kuratierte Auktion mit Expertenprüfung.");
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

  const channelPlan = buildChannelPlan({
    channel,
    fair,
    low,
    reasons,
    isCard,
    isLego,
    isVinyl,
    isMusicGear,
    isLocalGeneral,
    isEverydayBundle,
    isFashion,
    isNerdItem,
    isVisualStory,
    isVintageDecor,
    specialEdition,
    explicitFunctionalIssue
  });
  const alternativeChannels = uniqueStrings([
    ...channelPlan.parallel.map((entry) => entry.name),
    ...channelPlan.discovery.map((entry) => entry.name),
    ...(channelPlan.fallback ? [channelPlan.fallback.name] : [])
  ]);
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
    channelPlan,
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

function buildChannelPlan(context) {
  const {
    channel,
    fair,
    low,
    reasons,
    isCard,
    isLego,
    isVinyl,
    isMusicGear,
    isLocalGeneral,
    isEverydayBundle,
    isFashion,
    isNerdItem,
    isVisualStory,
    isVintageDecor,
    specialEdition,
    explicitFunctionalIssue
  } = context;

  const primary = channelPlanEntry(channel, {
    role: "primary",
    roleLabel: channel === "Pruefen" ? "Vor Freigabe" : "Hauptverkauf",
    score: channel === "Pruefen" ? 0 : 92,
    targetPrice: fair,
    activation: channel === "Pruefen" ? "blocked" : "after-approval",
    reason: reasons.join(" ")
  });
  const parallel = [];
  const discovery = [];

  const addParallel = (name, roleLabel, score, reason, activation = "after-approval") => {
    if (name === channel || parallel.some((entry) => entry.name === name)) return;
    parallel.push(channelPlanEntry(name, { role: "parallel", roleLabel, score, targetPrice: fair, activation, reason }));
  };
  const addDiscovery = (name, roleLabel, score, reason) => {
    if (name === channel || discovery.some((entry) => entry.name === name)) return;
    discovery.push(channelPlanEntry(name, { role: "discovery", roleLabel, score, targetPrice: fair, activation: "content-after-approval", reason }));
  };

  if (channel !== "Pruefen") {
    if (isCard) addParallel("Cardmarket", "Fachmarkt", 88, "Set, Sprache und Zustand lassen sich dort präzise vergleichen und anbieten.", "when-connector-ready");
    if (isLego) addParallel("BrickLink", "Fachmarkt", 88, "Setnummer, Figuren und Teile treffen dort auf spezialisiertes Suchverhalten.", "when-connector-ready");
    if (isVinyl) addParallel("Discogs", "Fachmarkt", 88, "Pressung und Medienzustand sind im Discogs-Katalog direkt vergleichbar.", "when-connector-ready");
    if (isMusicGear) addParallel("Reverb", "Fachmarkt", 88, "Technische Käufer suchen dort gezielt nach Modell und Zustand.", "when-connector-ready");
    if (isLocalGeneral || isEverydayBundle) {
      addParallel(channel === "Kleinanzeigen" ? "Facebook Marketplace" : "Kleinanzeigen", "Lokale Reichweite", 82, "Ein zweiter lokaler Kanal erhöht die Abholreichweite ohne zusätzlichen Versand.", "manual-after-approval");
    }
    if (isFashion) {
      addParallel("Kleinanzeigen", "Lokaler Zweitmarkt", 76, "Für Taschen, Schuhe und Mode kann ein lokales Angebot zusätzliche Nachfrage ohne Rückversandrisiko liefern.", "manual-after-approval");
    }
    if (isNerdItem) {
      addParallel("RAMROD Shop", "Eigener Shop", 80, "Der eigene Katalog baut SEO, Kundendaten und Marge auf; Veröffentlichung startet erst mit aktivem Bestandssync.", "when-shop-sync-ready");
    }
    if ((isVintageDecor || specialEdition) && fair >= 120) {
      addParallel("Catawiki", "Kuratierte Auktion", 78, "Für besondere höherwertige Stücke kann die Expertenauktion einen besseren Käuferkreis liefern.", "expert-review");
    }
    if (isVisualStory && fair >= 20) {
      addDiscovery("Instagram", "Reichweite", 74, "Ein kurzer Fund-, Detail- oder Aufbereitungsbeitrag führt Interessenten zum Hauptangebot oder Shop.");
    }
  }

  let fallback = null;
  if (channel !== "Pruefen") {
    if (explicitFunctionalIssue || fair < 8) {
      fallback = channelPlanEntry("Liquidation Basket", {
        role: "fallback",
        roleLabel: "Schneller Abverkauf",
        score: 55,
        targetPrice: low,
        activation: "after-30-days",
        reason: "Wenn Einzelverkauf und Aufbereitung unwirtschaftlich bleiben, in ein transparentes Restposten-Bundle verschieben."
      });
    } else if (channel !== "eBay" && !isLocalGeneral && !isEverydayBundle) {
      fallback = channelPlanEntry("eBay", {
        role: "fallback",
        roleLabel: "Breiter Zweitmarkt",
        score: 68,
        targetPrice: low,
        activation: "after-14-days",
        reason: "Wenn der Fach- oder Live-Kanal nicht verkauft, nach 14 Tagen als suchbares Festpreisangebot testen."
      });
    } else if (channel === "eBay" && isNerdItem && fair <= 25) {
      fallback = channelPlanEntry("Whatnot", {
        role: "fallback",
        roleLabel: "Themen-Bundle",
        score: 66,
        targetPrice: low,
        activation: "after-14-days",
        reason: "Bleibt das Einzelangebot liegen, mit passenden Artikeln in eine thematische Live-Kampagne bündeln."
      });
    }
  }

  return {
    version: 1,
    primary,
    parallel: parallel.sort((left, right) => right.score - left.score).slice(0, 3),
    discovery: discovery.slice(0, 1),
    fallback,
    inventoryPolicy: {
      sourceOfTruth: "RAMROD",
      publishParallelOnlyWithSaleSync: true,
      reserveOnSale: true,
      delistOtherChannels: true,
      note: "Ein Artikel bleibt ein Bestandseintrag. Parallele Transaktionsangebote werden erst mit zuverlässigem Verkaufssync aktiviert."
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
