# RAMROD Media Library

## Ziel

Die Sammlung ist ein eigenes Produktmodul. Ein Scan erzeugt zuerst ein privates Inventarobjekt. Er startet weder Preisrecherche noch Verkaufsfreigabe. Erst die ausdrueckliche Aktion `Ueber RAMROD verkaufen` uebergibt ein Exemplar an die Verkaufsmaschine.

Die Bibliothek soll spaeter Fragen wie diese beantworten:

- Welche Spiele und Filme besitze ich?
- Was ist verliehen und an wen?
- Zeig mir romantische Actionfilme fuer heute Abend.
- Stelle eine Alien-, Cyberpunk- oder 90er-Kompilation aus meiner Sammlung zusammen.
- Welche Ausgaben fehlen in einer Reihe?
- Welches Exemplar kann ich mit einem Klick verkaufen?

## Erfassungsfluss

1. Der Nutzer oeffnet `Sammlung scannen`.
2. Bis zu sechs Fotos werden demselben Exemplar zugeordnet: Cover, Rueckseite/Barcode, Ruecken, Datentraeger und Zustand.
3. Die Erkennung liest Titel, Edition, Plattform/Format und Codes.
4. Ein Inventareintrag wird gespeichert. Sein Enrichment-Status ist `pending`.
5. Ein Enrichment-Agent ordnet den physischen Gegenstand einem kanonischen Medienwerk zu und ergaenzt Metadaten.
6. Das Exemplar bleibt privat inventarisiert, bis der Besitzer bewusst Verkauf oder Ausleihe startet.

## Datenmodell

Physisches Exemplar und kanonisches Werk muessen getrennt bleiben.

### Exemplar

- Besitzer und Mandant
- SKU, Barcode, Edition, Plattform/Format
- Zustand, Vollstaendigkeit, Standort
- Kaufpreis und Schaetzwert
- Ausleihe, Verkauf und Historie

### Kanonisches Werk

- Titel und Alternativtitel
- IMDb-, TMDB- oder IGDB-ID
- Erscheinungsjahr, Laufzeit, Altersfreigabe
- Genres, Themen, Stimmungen und Schlagwoerter
- Regie, Cast, Entwickler oder Publisher
- Inhaltsbeschreibung und Serien-/Franchise-Zugehoerigkeit
- Trailer-, Review- und Referenzlinks

Mehrere physische Exemplare koennen auf dasselbe Werk zeigen. Dadurch werden Metadaten nicht fuer jede Blu-ray oder Edition dupliziert.

## Enrichment-Agent

Der Agent arbeitet nach dem Scan asynchron:

1. Barcode, OCR-Texte, Titel, Jahr und Plattform normalisieren.
2. Kandidaten bei den passenden Quellen suchen.
3. Kandidaten anhand sichtbarer Merkmale und IDs bewerten.
4. Nur einen ausreichend sicheren Treffer automatisch uebernehmen.
5. Metadaten, Quellen und Zeitstempel speichern.
6. Bei Unsicherheit zwei oder drei Kandidaten zur kurzen Auswahl anzeigen.
7. Einen Suchtext fuer die semantische Empfehlung erzeugen und einbetten.

## Quellen

- Filme und Serien: TMDB als pragmatische erste Quelle. Fuer kommerzielle Nutzung muss eine passende Lizenz vereinbart werden.
- IMDb: kanonische IMDb-IDs und Links sind wertvoll. Die offizielle Echtzeit-API und Bulk-Daten werden ueber AWS Data Exchange lizenziert; IMDb sollte nicht gescrapt werden.
- Spiele: IGDB fuer Spiele, Plattformen, Genres, Themes, Unternehmen und Releases. Kommerzielle Nutzung benoetigt eine Partnerschaft.
- Videos: YouTube Data API fuer Trailer und Reviews. Suchergebnisse werden als Links gespeichert, nicht kopiert.
- Barcode: aus Foto/OCR plus externer Produktauflosung; ein Barcode allein beweist die konkrete Edition nicht immer.

## Suche und Empfehlungen

Ein reines RAG ist nicht die Grundlage. RAMROD braucht eine hybride Suche:

1. Strukturierte Filter grenzen Besitz, Medientyp, Plattform, Altersfreigabe, Laufzeit und Status ein.
2. Vektor-Suche findet weiche Begriffe wie Stimmung, Motiv oder Anlass.
3. Ein Sprachmodell sortiert die Treffer und erklaert die Empfehlung.
4. Antworten duerfen nur Exemplare aus dem aktiven Mandanten empfehlen.

Supabase Postgres bleibt die Quelle der Wahrheit. `pgvector` kann die semantischen Einbettungen direkt neben den strukturierten Metadaten speichern. Ein separates Vektorprodukt ist fuer den MVP nicht erforderlich.

## Naechste Ausbaustufen

### Stufe 1: belastbares Inventar

- eigener Mehrfoto-Scan
- Barcode und Edition erfassen
- Exemplar ohne Verkaufsautomatik speichern
- Ausleihe, Standort und Verkaufsknopf

### Stufe 2: kanonische Medien

- Tabellen `media_works`, `media_external_ids`, `media_people`, `media_links`
- Enrichment-Job und Quellenprotokoll
- TMDB-Adapter und IGDB-Adapter
- unsichere Treffer in einer kleinen Pruefqueue

### Stufe 3: Bibliothekar

- `pgvector` aktivieren
- Embeddings aus Beschreibung, Genres, Themen, Stimmung und Personen
- natuerliche Suche nur ueber die eigene Sammlung
- gespeicherte Zusammenstellungen und Empfehlungen

### Stufe 4: Reviews und persoenliche Signale

- YouTube-Trailer und Reviews verlinken
- gesehen/gespielt, Bewertung, Favoriten und Abbruch erfassen
- Empfehlungen aus Besitz plus persoenlichem Geschmack verbessern
