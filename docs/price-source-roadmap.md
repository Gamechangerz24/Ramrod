# RAMROD Price Source Roadmap

Stand: 2026-05-01

Diese Notiz haelt fest, welche Preisquellen wir spaeter fuer belastbarere Marktwerte anbinden wollen. Ziel ist eine Preis-Pipeline, die KI-Schaetzung, aktive Angebote, verkaufte Preise und kategoriespezifische Quellen kombiniert.

## Zielbild

Jeder Artikel bekommt nicht nur einen Preis, sondern auch eine belastbare Quellenlage:

- A: 5+ Sold-Comps oder exakter Spezialdatenbank-Treffer
- B: 2-4 Sold-Comps
- C: nur aktive Listings
- D: nur KI-/Modell-Schaetzung

Die App soll den Preis trotzdem schnell vorschlagen, aber transparent zeigen, wie sicher der Marktwert ist.

## Quellen

### eBay Marketplace Insights

Offizielle eBay-Quelle fuer Sold-Price-Daten. Liefert Sales-History bis zu 90 Tage zurueck, ist aber Limited Release.

Was wir brauchen:

- Production-Zugang zur eBay App
- Freigabe/Approval fuer Marketplace Insights
- Business Case fuer eBay: Inventory valuation/listing tool for collectibles, games, toys
- Kategorie-Wunschliste: Toys, Collectibles, Video Games, Trading Cards, Comics

Einsatz:

- Primaere offizielle Quelle fuer verkaufte eBay-Preise
- Adapter: `ebay-marketplace-insights`

Risiko:

- Freigabe durch eBay ist nicht garantiert
- Kategorien koennen whitelisted werden muessen

### eBay Product Research / Terapeak

Sehr starke eBay-interne Research-Quelle mit laengerem Zeitraum und echten Verkaufsdaten. Eher Seller-Hub-Tool als oeffentliche API.

Was wir brauchen:

- eBay Seller Hub Zugang
- Ggf. Shop-/Business-Setup
- Spaeter optional Browser-Automation auf dem MacMini

Einsatz:

- Manuelle Validierung
- Spaeter "High Confidence Research" fuer wertvolle Artikel

Risiko:

- Keine saubere oeffentliche API eingeplant
- Browser-Automation kann fragil sein

### PriceCharting

Sehr gute Spezialquelle fuer Videospiele, Konsolen, Cards, Comics, Funko und aehnliche Kategorien.

Was wir brauchen:

- PriceCharting Account/Subscription
- API Token
- Mapping von Titel, Plattform, Region und Zustand

Einsatz:

- Primaerquelle fuer Games und kompatible Sammlerkategorien
- Adapter: `pricecharting`

Besonders wichtig:

- PAL/NTSC/Japan unterscheiden
- Loose, CIB, Sealed unterscheiden
- Plattform erkennen, z. B. Dreamcast, Xbox 360, PS3

### SerpApi eBay Sold

Strukturierte eBay-Suchergebnisse ueber SerpApi. Kann eBay-Sold-Filter nutzen und ist schnell integrierbar.

Was wir brauchen:

- SerpApi Account
- API Key
- Budget pro Suchabfrage
- Query-Strategie mit mehreren Suchvarianten pro Artikel

Einsatz:

- Schneller Sold-Price-Fallback
- Adapter: `serpapi-ebay-sold`

Risiko:

- Drittanbieter-Wrapper
- Qualitaet haengt stark von Query und Filterung ab

### Apify eBay Sold Listings

Fertige Scraper/Actors fuer eBay Sold Listings. Eignet sich besonders fuer Batch-Jobs.

Was wir brauchen:

- Apify Account
- API Token
- Auswahl eines stabilen Actors
- Kostenkontrolle pro Batch

Einsatz:

- Nachtlauf auf MacMini
- Preis-Datenbank fuellen und aktualisieren
- Adapter: `apify-ebay-sold`

Risiko:

- Actor-Qualitaet variiert
- Scraping kann langsamer und fragiler sein als offizielle APIs

## Empfohlene Reihenfolge

1. PriceCharting fuer Games anbinden.
2. SerpApi oder Apify fuer eBay Sold Listings als schnelle breite Quelle testen.
3. eBay Marketplace Insights beantragen und Adapter vorbereiten.
4. Terapeak/Product Research spaeter als Premium-/Review-Workflow pruefen.

## Preisberechnung

Die spaetere Preislogik sollte Quellen gewichten:

- Sold-Comps hoeher als aktive Listings
- Spezialdatenbanken hoeher als allgemeine Webtreffer
- Exakte Plattform-/Zustandsmatches hoeher als unscharfe Titelmatches
- Ausreisser markieren und nicht in die Hauptberechnung nehmen
- Bei weniger als 3 echten Vergleichswerten Confidence deckeln

## Naechster technischer Schritt

Wenn wir diese Roadmap wieder aufnehmen:

1. `.env.local.example` um Provider-Keys erweitern.
2. Einheitliches Interface bauen: `getPriceEvidence(item)`.
3. Adapter fuer `pricecharting`, `serpapi-ebay-sold`, `apify-ebay-sold`, `ebay-marketplace-insights`.
4. Price-Check UI um Quellenampel A/B/C/D erweitern.
5. Batch-Job fuer MacMini vorbereiten.
