# RAMROD Sammlung: Schnellerfassung und Medienintelligenz

## Zielbild

Der Sammlungsmodus optimiert auf Durchsatz, nicht auf Verkaufsfertigkeit:

1. Fotos aufnehmen.
2. Medium und Edition grob erkennen.
3. Inventareintrag sofort speichern und Kamera wieder freigeben.
4. Metadaten, Empfehlungen, Reviews und Wertentwicklung im Hintergrund ergänzen.
5. Verkaufsanalyse erst starten, wenn der Besitzer auf "Über RAMROD verkaufen" klickt.

## Aktueller Stand

### Umgesetzt

- Getrennter Sammlungs-Scan mit bis zu sechs Ansichten.
- Schnellerkennung für Titel, Medienart, Plattform, Edition und Barcode.
- Vorläufige Wertspanne ohne Verkaufsfreigabe.
- Inventar, Standort, Zustand, Leihstatus und Übergabe an RAMROD.
- Datenfelder für externe IDs, Genres, Themen, Stimmungen, Personen, Schlagwörter und Reviews.
- Der Sammlungs-Scan überspringt die große Verkaufs- und Strategieanalyse.

### Noch nicht umgesetzt

- Persistente kanonische Werke, getrennt von den physischen Exemplaren.
- Hintergrund-Queue für Medien-Anreicherung.
- TMDB-, IMDb-, IGDB- und YouTube-Adapter.
- Embeddings und semantische Suche.
- Persönliche Bewertungen, gesehen/gespielt, Favoriten und Abbrüche.
- Empfehlungsdialog und automatisch gespeicherte Zusammenstellungen.

## Datenmodell

### Physisches Exemplar

Ein konkretes Steelbook, Spiel oder eine Blu-ray im Regal:

- Besitzer und Kundenbereich
- Barcode, Edition, Plattform und Region
- Zustand, Vollständigkeit und Standort
- Ausleihe, Verkauf und Historie
- Fotos und geschätzter Wert
- Verweis auf ein kanonisches Werk

### Kanonisches Werk

Der Film oder das Spiel unabhängig von der konkreten Ausgabe:

- Titel, Originaltitel, Erscheinungsjahr und Laufzeit
- Genres, Themen, Stimmungen und Schlagwörter
- Regie, Darsteller, Studio oder Entwickler
- Altersfreigabe und Zusammenfassung
- IMDb-, TMDB- oder IGDB-ID
- ausgewählte Review- und Trailer-Links
- Suchtext und Embedding

Mehrere physische Ausgaben dürfen auf dasselbe Werk zeigen. So werden Metadaten nur einmal recherchiert.

## Hintergrundprozess

`captured -> identifying -> matched -> enriching -> ready`

1. RAMROD speichert den Inventareintrag und die Fotos.
2. Der Enrichment-Agent sucht per Barcode und Titel nach einem kanonischen Werk.
3. Eindeutige Treffer werden automatisch verknüpft.
4. Unsichere Treffer erzeugen zwei oder drei auswählbare Kandidaten.
5. Metadaten und Links werden gecacht und mit Quellen versehen.
6. Ein Embedding wird aus Titel, Genres, Themen, Stimmung, Personen und Zusammenfassung erzeugt.

Fehler bei der Anreicherung blockieren nie das Inventar.

## Suche und Empfehlungen

Klassisches Dokument-RAG allein reicht nicht. RAMROD verwendet eine hybride Auswahl:

1. Strukturierte Filter grenzen auf den eigenen, verfügbaren Bestand ein.
2. Vektorsuche findet weiche Wünsche wie "romantische Action" oder "kurzes Koop-Spiel".
3. Ein Sprachmodell sortiert nur die besten Treffer neu und erklärt die Auswahl.
4. Persönliche Signale verbessern die Rangfolge später.

Beispiel: "Ich habe Lust auf romantische Action, höchstens zwei Stunden."

- Filter: Film, vorhanden, nicht verliehen, Laufzeit bis 120 Minuten.
- Semantische Suche: Action, Romantik, Tempo, Stimmung.
- Ergebnis: drei eigene Filme mit kurzer Begründung.

Zusammenstellungen speichern nur Werk- oder Exemplar-IDs und lassen sich später erneut berechnen.

## Technische Basis

- Supabase Postgres bleibt die zentrale Datenbank.
- `pgvector` reicht für den MVP; eine separate Vektordatenbank ist zunächst unnötig.
- Mac Mini oder Worker führt Anreicherung, Embeddings und größere Batch-Aufgaben aus.
- Interaktive Scans dürfen nicht vom Mac Mini oder einem langsamen Agenten abhängen.
- Jede externe Quelle benötigt Cache, Zeitstempel, Provenienz und Lizenzprüfung.

## Quellenstrategie

- Filme und Serien: lizenzierter TMDB- oder IMDb-Zugang; IMDb nicht scrapen.
- Spiele: IGDB oder weitere lizenzierte Spieledatenquelle.
- Reviews und Trailer: YouTube Data API, nur Links und Metadaten speichern.
- Edition und Marktwert: Barcode, visuelle Produktsuche und Marktplatzquellen getrennt behandeln.

## Umsetzungsschritte

1. Sammlungs-Scan ohne Verkaufsanalyse ausliefern.
2. Tabellen für kanonische Werke, externe IDs, Personen, Links und Exemplare ergänzen.
3. `media_enrichment`-Jobs und sichtbare Statusanzeige anbinden.
4. Einen Film- und einen Spiele-Adapter als Pilot implementieren.
5. `pgvector` aktivieren und Suchtexte automatisch einbetten.
6. Bibliothekar-Ansicht für natürliche Sprache und Zusammenstellungen bauen.
7. Persönliche Signale und Empfehlungsfeedback ergänzen.
