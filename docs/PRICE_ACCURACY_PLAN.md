# RAMROD Price Accuracy Plan

Stand: 2026-07-24

## Problem

Ein Vision-Modell kann einen plausiblen Preis nennen, kennt aber weder den
aktuellen Markt noch die konkrete Angebotslage. Ein zweites frei antwortendes
LLM ist deshalb keine unabhaengige Preisquelle. Es darf nur Vergleichstreffer
klassifizieren, nicht den Marktwert erfinden.

Die bisherige erste Preislogik hatte vier Schwachstellen:

1. Aehnliche Titel wurden ungeachtet von Plattform, Variante und Zustand
   zusammengefasst.
2. Aktive Wunschpreise und verkaufte Preise hatten fast dieselbe Wirkung.
3. Die urspruengliche KI-Sicherheit floss zu stark in die Preis-Sicherheit ein.
4. KI-Suchvorschlaege konnten als scheinbar unabhaengige Preisbelege auftreten.

## Neue Berechnung

Der Preischeck arbeitet jetzt in fuenf Schritten:

1. Produktidentitaet aus Titel, Plattform, Modellnummer, Edition, Region,
   Barcode und weiteren sichtbaren Kennungen aufbauen.
2. Jeden Treffer gegen diese Identitaet pruefen.
3. Falsche Plattformen, andere Produkte, leere Verpackungen, Zubehoer,
   Ersatzteile, abweichende Bundles und Defektangebote ausschliessen.
4. Verkaufte Treffer, Preisguides, aktive Angebote und KI-Hinweise getrennt
   gewichten.
5. Preis-Sicherheit aus Trefferanzahl, Match-Qualitaet und Streuung berechnen.

Grundgewichtung:

| Evidenz | Gewicht |
| --- | ---: |
| Tatsaechlich verkauft | 1.00 |
| Kategorie-Preisguide | 0.85 |
| Aktives Angebot | 0.38 |
| KI-Vorbewertung | 0.08 |

Bei mindestens drei passenden Verkaufstreffern basiert der Marktwert
hauptsaechlich auf deren gewichtetem Median. Gibt es nur aktive Angebote,
werden sie je Kategorie mit einem Angebots-zu-Verkauf-Faktor von 78 bis 88
Prozent reduziert und die Sicherheit bleibt unter 60 Prozent.

Die Faktoren sind Startwerte. Sie muessen spaeter anhand der eigenen
RAMROD-Verkaeufe kalibriert werden.

## Rolle eines Price Verification Agent

Der Agent ist ein Reranker, kein Schaetzer.

Eingabe:

- bestaetigte Artikelidentitaet
- Zustand und Vollstaendigkeit
- 10 bis 30 Markttreffer mit URL, Titel, Preis, Versand, Datum und Quelle

Aufgabe:

- gleiches Produkt oder Fehl-Treffer
- gleiche Plattform, Edition, Region und Menge
- Zustandsklasse und Vollstaendigkeit
- verkaufte Transaktion oder aktives Angebot
- Begruendung und Match-Sicherheit

Der Agent wird nur eingesetzt, wenn deterministische Regeln nicht reichen,
der erwartete Wert hoch ist oder die Preisstreuung gross bleibt. Das spart
Kosten und vermeidet, dass ein LLM klare Barcode- oder Plattformregeln
ueberstimmt.

## Quellen nach Kategorie

### Allgemein

- eBay Browse API: aktive Angebote, GTIN/EPID/Kategorie/Aspekte und in
  Deutschland auch Bildsuche. Keine allgemein verfuegbaren Verkaufspreise.
- eBay Marketplace Insights: Verkaufshistorie, aber laut eBay aktuell
  eingeschraenkt und nicht fuer neue Nutzer offen.
- SerpApi: praktikabler Such-Fallback fuer eBay-Webtreffer. Ergebnisse muessen
  als Drittanbieter-Daten validiert und duerfen nicht blind als verkauft
  behandelt werden.
- Eigene RAMROD-Verkaeufe: langfristig die wichtigste Quelle fuer realen
  Verkaufspreis, Gebuehren, Rabatt, Verkaufsdauer und Retouren.

### Games und Konsolen

- PriceCharting fuer Produktzuordnung und aktuelle Zustandswerte.
- Die Prices API liefert aktuelle Werte, keine historische Verkaufsliste.
- eBay und eigene Verkaeufe bleiben fuer den deutschen Markt notwendig.

### LEGO

- BrickLink Price Guide mit getrennten Daten fuer verkauft/Bestand,
  neu/gebraucht und die letzten sechs Monate.

### TCG

- Cardmarket fuer Produkt- und Angebotsdaten, sofern professioneller,
  manuell genehmigter API-Zugang vorhanden ist.
- Karten-ID, Set, Sprache, Nummer, Foil und Zustand sind Pflichtmerkmale.

### Musik

- Discogs Release-ID, Barcode und Pressung fuer Identifikation.
- Sales History und Preisvorschlaege unterliegen den Discogs-API- und
  Marketplace-Nutzungsbedingungen.

### Allgemeine Gebrauchtware

- eBay aktive und, soweit rechtlich/technisch verfuegbar, verkaufte Treffer.
- Kleinanzeigen/Facebook/Vinted liefern primaer aktuelle Angebotsdaten.
- Region, Abholung, Versandfaehigkeit und Saison muessen in das Modell.

## Eigener Lernkreislauf

Bei jedem Verkauf sollte RAMROD speichern:

- urspruengliche Schaetzung und Quellen
- Listenpreis
- akzeptierter Verkaufspreis
- Versand und Plattformgebuehren
- Nettoerloes
- Tage bis Verkauf
- Anzahl Preisreduzierungen
- Retouren oder Streitfaelle

Damit werden pro Kategorie und Kanal folgende Werte gelernt:

- Angebots-zu-Verkauf-Faktor
- typischer Verhandlungsabschlag
- Preiselastizitaet
- Sell-through nach 7, 30 und 90 Tagen
- optimaler Quick-Sale- und Max-Margin-Preis

## Naechste Integrationen

1. Price Verification Agent fuer die Top-Treffer und nur bei Unsicherheit.
2. PriceCharting-Adapter fuer Games und Konsolen.
3. BrickLink-Adapter fuer LEGO.
4. Persistente Speicherung abgelehnter und angenommener Vergleichstreffer.
5. Sale-Outcome-Auswertung aus `listings` und `sales`.
6. Kalibrierungsdashboard mit Fehler in EUR und Prozent je Kategorie.

## Quellen

- eBay Browse API:
  https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search
- eBay Buy API Support und Marketplace Insights Hinweis:
  https://developer.ebay.com/api-docs/buy/ref-marketplace-supported.html
- PriceCharting API:
  https://www.pricecharting.com/api-documentation
- BrickLink Price Guide:
  https://static.bricklink.com/alpha/default/api_wiki.html
- Cardmarket API:
  https://api.cardmarket.com/ws/documentation
- Discogs API-Nutzungsbedingungen:
  https://support.discogs.com/hc/de/articles/360009334593-API-Nutzungsbedingungen
