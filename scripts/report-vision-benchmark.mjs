import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2] || "data/qwen-openai-benchmark.json";
const outputPath = process.argv[3] || "docs/QWEN_OPENAI_VISION_BENCHMARK.md";
const benchmark = JSON.parse(await readFile(inputPath, "utf8"));
const results = benchmark.results || [];

if (!results.length) throw new Error("Benchmark contains no results.");

const averageDurationSeconds = average(results.map((result) => result.usage?.durationMs || 0)) / 1000;
const averageConfidence = average(results.map((result) => result.qwen?.confidence || 0));
const reviewCount = results.filter((result) => result.workflow?.needsHumanReview).length;
const strongTitleMatches = results.filter((result) => result.comparison?.referenceTitleCoverage >= 0.75).length;
const weakTitleMatches = results.filter((result) => result.comparison?.referenceTitleCoverage < 0.5).length;
const averageReferenceCoverage = average(results.map((result) => result.comparison?.referenceTitleCoverage || 0));
const averageFairPriceDelta = average(results.map((result) => Math.abs(result.comparison?.fairPriceDelta || 0)));
const flatTwentyFiveCount = results.filter((result) => Number(result.qwen?.priceFair) === 25).length;
const throughputPerHour = averageDurationSeconds ? 3600 / averageDurationSeconds : 0;
const averageOutputTokens = average(results.map((result) => result.usage?.outputTokens || 0));

const rows = results.map((result) => {
  const coverage = Math.round((result.comparison?.referenceTitleCoverage || 0) * 100);
  const duration = Math.round((result.usage?.durationMs || 0) / 1000);
  return [
    result.index,
    escapeCell(result.fileName),
    escapeCell(result.reference?.title || "-"),
    escapeCell(result.qwen?.title || "-"),
    `${coverage}%`,
    `${result.qwen?.confidence || 0}%`,
    result.workflow?.needsHumanReview ? "Ja" : "Nein",
    `${duration}s`
  ].join(" | ");
});

const report = `# RAMROD Vision Benchmark: Qwen vs. OpenAI-Referenz

Stand: ${new Date().toISOString()}

## Einordnung

Dieser Test vergleicht das lokale Modell **${benchmark.localModel}** auf dem Mac Mini mit den bereits vorhandenen Analysen von **${benchmark.referenceModel}** für dieselben Strongvision-Fotos. Die OpenAI-Ausgaben sind eine Referenz, keine verifizierte Ground Truth. Marktpreise wurden in diesem Test nicht gegen tatsächlich verkaufte Artikel validiert.

## Ergebnis

| Messwert | Ergebnis |
| --- | ---: |
| Getestete Bilder | ${results.length} |
| Durchschnittliche Qwen-Laufzeit | ${averageDurationSeconds.toFixed(1)} s |
| Durchsatz eines Workers | ${throughputPerHour.toFixed(1)} Artikel/Stunde |
| Durchschnittliche Ausgabe | ${averageOutputTokens.toFixed(0)} Tokens |
| Durchschnittliche Qwen-Confidence | ${averageConfidence.toFixed(1)}% |
| Von Guardrails zur Prüfung geschickt | ${reviewCount}/${results.length} |
| Mindestens 75% Referenztitel-Abdeckung | ${strongTitleMatches}/${results.length} |
| Unter 50% Referenztitel-Abdeckung | ${weakTitleMatches}/${results.length} |
| Mittlere Referenztitel-Abdeckung | ${(averageReferenceCoverage * 100).toFixed(1)}% |
| Qwen-Fair-Value pauschal 25 EUR | ${flatTwentyFiveCount}/${results.length} |
| Mittlere absolute Fair-Preis-Abweichung zur Referenz | ${averageFairPriceDelta.toFixed(2)} EUR |

## Interpretation

- **Identifikation:** Titel-Abdeckung misst nur Textüberschneidung mit OpenAI. Varianten, Editionen und sichtbare Modellnummern müssen zusätzlich manuell bewertet werden.
- **Confidence:** Eine schlecht kalibrierte Modellzahl darf keine automatische Freigabe auslösen. RAMROD sollte Sicherheit aus sichtbaren Belegen, Quellenkonsens und Modellvergleich ableiten.
- **Geschwindigkeit:** Die Laufzeit ist für Hintergrundanreicherung brauchbar. Für eine interaktive Smartphone-Freigabe ist eine schnelle Cloud-Eskalation sinnvoll.
- **Preise:** Qwen vergibt bei ${flatTwentyFiveCount} von ${results.length} Artikeln pauschal 25 EUR. Diese Werte sind keine belastbare Schätzung. Dafür sind eBay-/Web-/Spezialquellen und verkaufte Vergleichsartikel erforderlich.

## Einzelresultate

Nr. | Datei | OpenAI-Referenz | Qwen | Titel-Abdeckung | Qwen-Confidence | Prüfung | Zeit
---: | --- | --- | --- | ---: | ---: | --- | ---:
${rows.join("\n")}

## Empfohlene Betriebslogik

1. Qwen übernimmt lokal Bildrotation, OCR, grobe Kategorie, offensichtliche Marke und Datenschutz-freundliche Vorverarbeitung.
2. RAMROD berechnet eine Evidence-Confidence aus sichtbarem Text, Barcode, Plattform, Marke und Variantenmerkmalen.
3. Unklare Variante, hoher Wert, Widerspruch oder geringe Evidence-Confidence löst automatisch eine Cloud-Zweitmeinung aus.
4. Erst danach folgen eBay-/Web-Recherche, Verkaufsstrategie und Preisbildung.
5. Autonomes Listing ist nur bei hoher Identitätssicherheit, Quellenkonsens und unkritischem Wert erlaubt; sonst genügt ein menschliches Go.
`;

await writeFile(outputPath, report);
console.log(`Wrote benchmark report -> ${outputPath}`);

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}
