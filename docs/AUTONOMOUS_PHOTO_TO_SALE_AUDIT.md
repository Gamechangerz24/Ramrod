# RAMROD Audit: Vom Foto zum Verkauf

Stand: 28.07.2026

## Ziel

Der Operator fotografiert einen oder mehrere Artikel. RAMROD soll danach bis zum Versand selbstständig:

1. Bilder prüfen, drehen, gruppieren und den Hauptartikel erkennen.
2. Identität, Variante, Zustand, Vollständigkeit und Risiken bestimmen.
3. Marktpreise aus belastbaren Quellen vergleichen.
4. Verkaufskanal, Preis, Aufbereitung und Verkaufsformat wählen.
5. Listing, Content und Kampagnen vorbereiten.
6. Auf geeigneten Kanälen veröffentlichen.
7. Listings, Nachrichten, Preisentwicklung und Verkäufe überwachen.
8. Nach einem Verkauf den Bestand reservieren und andere Listings beenden.
9. Dem Menschen nur riskante Entscheidungen, Login/KYC/2FA und den Versand vorlegen.

Das Ziel ist nicht "ein KI-Formular", sondern eine nachweisbare Zustandsmaschine:

```text
Foto
  -> erkannt
  -> Markt belegt
  -> Strategie gewählt
  -> freigegeben oder regelbasiert freigabefähig
  -> veröffentlicht
  -> überwacht
  -> verkauft
  -> auf anderen Kanälen beendet
  -> versandbereit
```

## Kurzurteil

RAMROD besitzt eine brauchbare Grundlage für Erkennung, Preisrecherche, Strategie, Mandanten, Freigaben und Agenten-Orchestrierung. Die eigentliche autonome Verkaufsstrecke ist noch nicht geschlossen.

Aktuell ist RAMROD ungefähr:

- **70 % Analyse- und Entscheidungswerkzeug**
- **40 % Agenten-Kontrollzentrum**
- **10 % externer Verkaufsagent**
- **0 % nachgewiesener Foto-bis-Verkauf-Durchlauf**

Der größte fehlende Baustein ist kein weiteres LLM. Es fehlen produktive Kanal-Connectoren und Browser-Executors, die erlaubte Schritte wirklich ausführen und deren Ergebnis verifizieren.

## Nachgewiesener Produktionszustand

Die laufende Version unter `admin.ramrod.live` meldet:

- OpenAI aktiv
- hybride Erkennung aktiv
- eBay Browse und SerpApi aktiv
- Agent Control aktiv
- Telegram-Freigaben nicht eingerichtet
- VPS Safe Runner online
- Mac Mini Hermes Runner online
- keine Agentenmission ausgeführt
- keine Freigabe offen oder abgeschlossen
- kein Verkaufskonto verbunden

Der aktuelle eBay-Endpunkt erzeugt nur ein lokales Listing-Datenpaket. Er ruft nicht die eBay-Operationen `createOrReplaceInventoryItem`, `createOffer` und `publishOffer` auf.

Die automatischen Agententests bestätigen absichtlich, dass `publish_listing` derzeit nicht unterstützt wird.

## Soll-Ist-Matrix

| Fähigkeit | Soll | Ist | Bewertung |
| --- | --- | --- | --- |
| Fotoaufnahme mobil | Ein Foto oder Serie startet automatisch den Prozess | Einzel- und Serienaufnahme vorhanden | weitgehend vorhanden |
| Bilder gruppieren | Mehrere Ansichten sicher einem Artikel zuordnen | Serienaufnahme vorhanden, keine belastbar geprüfte Gruppierungslogik für wilde Stapel | teilweise |
| Bilder drehen/prüfen | Orientierung und Qualität automatisch korrigieren | Vorverarbeitung vorhanden | vorhanden, weiter messen |
| Artikel erkennen | Exakte Variante mit sichtbaren Belegen | Cloud-Erkennung plus lokaler Qwen-Fallback | vorhanden, nicht 100 % garantierbar |
| Pflichtmerkmale | Nur echte Blocker, klare Nachforderung | Freigabe-Checkliste vorhanden | teilweise |
| Preis ermitteln | Verkaufte Vergleichsartikel und weitere Fachquellen | eBay aktive Angebote plus SerpApi; Sold-Preise nicht belastbar integriert | kritisch unvollständig |
| Verkaufsstrategie | Kanal, Preis, Reparatur, Bundle, Zeit | Entscheidungslogik vorhanden | vorhanden |
| Freigabe | Nur riskante Fälle zum Menschen | UI-Freigaben vorhanden, Telegram fehlt | teilweise |
| Listing erzeugen | Kanalspezifische Daten vollständig | interne eBay-Drafts und Content-Briefs | teilweise |
| eBay veröffentlichen | API-Listing mit externer ID und URL | nicht implementiert | fehlt |
| Whatnot veröffentlichen | Produkte/Kampagnen und Sale Events | Kampagnen/Export; API-Zugang derzeit nicht verfügbar | fehlt |
| Eigener Shop | Produkt, Checkout, Order Webhook | Katalogvorschau, kein produktiver Commerce-Connector | fehlt |
| Instagram | Content planen und automatisch veröffentlichen | Content-Entwürfe | fehlt |
| Browser-Kanäle | Isolierte Profile, Login-Handoff, kontrollierte Veröffentlichung | Hermes kann sichere Vorbereitungs-Schritte übernehmen | externer Write-Executor fehlt |
| Verkauf erkennen | Webhook oder Polling je Kanal | Datenmodell vorhanden | fehlt |
| Cross-Channel Delist | Nach Verkauf atomar reservieren und beenden | Playbook und Tabellen vorhanden | Ausführung fehlt |
| Audit und Wiederholung | Jeder externe Versuch mit Beleg und Retry | Agent Steps, Leases und Audit-Basis vorhanden | gute Grundlage |

## Agentenprüfung

### Was bereits gut ist

- Missionen und geordnete Schritte werden dauerhaft gespeichert.
- Schritte besitzen Risiko, Freigabepflicht, Lease, Heartbeat, Retry und Versuchszähler.
- Ein Runner kann keine Vorgänger überspringen.
- Der Agent kann seine eigene Freigabe nicht erteilen.
- Passwörter, Tokens und Cookies sollen nicht in Missionen oder Geschäftstabellen liegen.
- Mandanten und Verkaufskonten sind organisatorisch getrennt.
- VPS und Mac Mini melden sich als getrennte Runner.

### Was noch nicht autonom ist

Der VPS Runner unterstützt nur:

- Artikel validieren
- Kandidaten auswählen
- Kanalplan bilden
- Bestand clustern
- Content-Briefs erzeugen

Der Hermes Runner ist für Recherche und Vorbereitung registriert. Sein aktuelles Rechteprofil enthält keine externen Schreibaktionen. Besonders nicht freigegeben sind:

- `create_external_account`
- `connect_oauth`
- `publish_listing`
- `publish_channel_plan`
- `publish_campaign`
- `reserve_inventory`
- `delist_other_channels`

Das ist eine sinnvolle Sicherheitsgrenze für den Aufbau. Es bedeutet aber: Der Agent kann heute planen, jedoch nicht verkaufen.

## Einrichtungsprüfung

### Was ein neuer Kunde heute kann

- Konto anlegen
- neuen Kundenbereich oder Privatbereich erzeugen
- erste Kanäle auswählen
- Teammitglieder per Einladungslink hinzufügen
- Rollen und Mandantentrennung nutzen

### Was danach fehlt

Die Kanalauswahl legt nur einen Datensatz mit Status `planned` an. Es fehlt ein echter Setup-Assistent, der pro Kanal:

1. Verkäufer- und Firmendaten prüft.
2. Rechtsform, Adresse, Steuerdaten, Retouren und Auszahlung abfragt.
3. API/OAuth oder ein isoliertes Browserprofil verbindet.
4. erforderliche Richtlinien und Lagerorte prüft.
5. einen Testentwurf erzeugt.
6. externe ID, Rechte und Limits verifiziert.
7. Auto-Publish- und Freigaberegeln festlegt.
8. Verkaufserkennung und Delisting testet.

### Was immer menschlich bleiben muss

- AGB oder Plattformbedingungen akzeptieren
- KYC und Identitätsprüfung
- CAPTCHA
- Bank- und Auszahlungsdaten bestätigen
- 2FA/Passkeys
- erstmalige OAuth-Rechte bewusst erteilen
- außergewöhnliche Gebühren, Werbung oder Ausgaben genehmigen

Der Agent darf diese Schritte vorbereiten, den richtigen Bildschirm öffnen und danach weiterarbeiten. Er darf sie nicht vortäuschen oder umgehen.

## Zielarchitektur

```text
Smartphone / Webapp
        |
        v
RAMROD Control Plane auf VPS
  - Artikelzustand
  - Missionsplan
  - Freigaberegeln
  - Kanal-Routing
  - Webhooks und Verkaufssync
        |
        +-------------------+
        |                   |
        v                   v
API Connectoren         Mac Mini Browser Worker
eBay, Shop, Meta,       isoliertes Profil je
später Vinted Pro       Kunde und Verkaufskanal
        |                   |
        +---------+---------+
                  v
      Listings, Content, Orders
                  |
                  v
     Sale Lock + Cross-Channel Delist
                  |
                  v
            Versandaufgabe
```

### Agentenrollen

1. **Intake Agent**: Bildqualität, Rotation, Artikelgruppen und fehlende Ansichten.
2. **Identity Agent**: exakte Identität und sichtbare Belege.
3. **Market Agent**: verkaufte und aktive Vergleiche, Fachquellen und Ausreißer.
4. **Strategy Agent**: Kanal, Preis, Aufbereitung, Bundle und Zeitplan.
5. **Listing Agent**: kanalspezifische Titel, Merkmale, Bilder und Texte.
6. **Policy Agent**: Pflichtfelder, Verbote, Risiko und Freigaberegeln.
7. **Publisher Agent**: API- oder Browser-Ausführung mit Verifikation.
8. **Demand Agent**: Shop, Instagram, Whatnot-Shows und Kampagnen.
9. **Sale Agent**: Orders erkennen, Bestand sperren und andere Listings beenden.

Die Rollen sind keine neun frei laufenden Chatbots. Sie sind klar begrenzte Schritte in einer gemeinsamen, dauerhaften Zustandsmaschine.

## API oder Browser

### API zuerst

API-Connectoren sind stabiler, schneller, prüfbarer und besser für:

- eBay
- eigener Shopify- oder vergleichbarer Shop
- Instagram Professional Content Publishing
- Vinted Pro, falls RAMROD zugelassen wird
- Whatnot, falls wieder Seller-API-Zugang vergeben wird
- spätere Fachmärkte mit offizieller Händler-API

### Browser nur als Adapter

Browserautomation ist sinnvoll für Plattformen ohne nutzbare API, zum Beispiel als kontrollierter Versuch für Kleinanzeigen oder andere assistierte Kanäle.

Benötigt werden:

- separates persistentes Browserprofil je Kunde und Plattform
- verschlüsselter Credential-Tresor oder manuelle Login-Übergabe
- genau ein aktiver Task pro Profil
- Domain- und Aktions-Allowlist
- Screenshots und DOM-Belege vor und nach externen Änderungen
- Gebühren- und Publikationsgrenzen
- Kill Switch
- Erkennung von Login, CAPTCHA, 2FA und geänderten Formularen
- kein Zugriff auf persönliche Browserprofile

Hermes oder OpenClaw können diese Browserarbeit ausführen. Sie ersetzen aber weder den RAMROD-Zustand noch Kanalregeln, Freigaben, Verkaufssync und Audit.

## Kanalrealität

### eBay

Die offizielle Inventory API unterstützt den vollständigen Weg von Inventory Item über Offer bis Publish. Vorher werden OAuth, Business Policies und ein Inventory Location Key benötigt. Das ist der sinnvollste erste geschlossene Kanal.

### Whatnot

Die Seller API kann Produkte und Verkaufsereignisse verwalten, befindet sich aber in Developer Preview und nimmt aktuell keine neuen Bewerber an. Bis ein Zugang verfügbar ist, bleiben CSV/Kampagnen und ein menschlicher Show-Start der realistische Weg.

### Eigener Shop

Ein eigener Commerce-Connector ist strategisch wichtig: Katalog, Checkout, Orders und Webhooks sind kontrollierbar. RAMROD sollte nicht selbst ein komplettes Shopsystem nachbauen, sondern Produkt- und Bestandsmaster bleiben und ein etabliertes Commerce-System anbinden.

### Instagram

Professionelle Accounts können Inhalte über die offizielle Instagram API veröffentlichen. Das ist ein Nachfrage- und Shop-Traffic-Kanal, kein Ersatz für den zentralen Transaktionskanal.

### Vinted

Vinted Pro Integrations bietet Items, Webhooks und Orders, ist aber nur für ausgewählte Unternehmen freigeschaltet. Zugang beantragen; bis dahin nicht auf private, inoffizielle APIs bauen.

### Kleinanzeigen und Facebook Marketplace

Ohne freigegebenen Händler-Connector müssen diese Kanäle als Browser-assistiert gelten. Vollautonomie ist dort fragiler und muss nach Plattformbedingungen, Kontotyp und realer Browserstabilität einzeln freigegeben werden.

## Freigabepolitik

### Automatisch erlaubt

- Recherche und Preisvergleich
- Titel, Beschreibung und Merkmale als Entwurf
- Bildauswahl und Bildreihenfolge
- Whatnot-Gruppierung
- Content-Entwürfe
- bestehende Orders und Listings lesen
- Listing nach Verkauf pausieren, wenn der Connector getestet und die Regel explizit aktiviert ist

### Einmalige Regel-Freigabe möglich

- eBay Festpreis veröffentlichen bis zu einer festgelegten Preisuntergrenze
- im eigenen Shop veröffentlichen
- Instagram-Beiträge aus freigegebenen Vorlagen planen
- Preis innerhalb eines begrenzten Korridors anpassen

### Immer einzeln freigeben

- neue Konten oder Vertragsänderungen
- OAuth-Rechte
- kostenpflichtige Hervorhebung oder Werbung
- Auktion ohne Mindestpreis
- Reparaturen oder Einkauf von Ersatzteilen
- hochpreisige, rechtlich sensible oder unsicher erkannte Artikel

## Priorisierter Build

### Phase 1: Ein echter Verkaufskanal

1. eBay OAuth-Tokens in einem Vault speichern und erneuern.
2. Business Policies und Inventory Location im Setup-Assistenten prüfen.
3. eBay Inventory Item, Offer und Publish implementieren.
4. externe Listing-ID, URL, Preis und Bestand in `publication_runs` speichern.
5. Order-Polling oder Notifications anbinden.
6. verkauften Artikel atomar sperren.
7. Publish- und Sale-Sync mit Testartikeln in Sandbox und danach Produktion beweisen.

Erfolgskriterium: Ein Foto erzeugt nach einer Freigabe ein echtes eBay-Listing und ein erkannter Testverkauf erzeugt eine Versandaufgabe.

### Phase 2: Automatische Mission nach Foto

1. Beim Speichern des Fotos automatisch eine `photo_to_sale`-Mission erzeugen.
2. Erkennung, Markt, Strategie und Listing ohne weitere Navigation ausführen.
3. Nur Blocker oder eine kompakte Freigabe auf Smartphone/Telegram zeigen.
4. Freigaberegeln pro Mandant und Wertgrenze speichern.

Erfolgskriterium: Der Operator öffnet nach dem Foto keine Fachansicht mehr.

### Phase 3: Telegram und Setup

1. eigenen RAMROD Telegram Bot konfigurieren.
2. Freigabe, Ablehnung und fehlende menschliche Schritte zustellen.
3. Kanal-Setup-Assistent mit echten Connector-Tests bauen.
4. Secret Vault integrieren.

### Phase 4: Shop und Nachfrage

1. Commerce-System für `ramrod.live` anbinden.
2. Produkt-, Bestands- und Order-Sync umsetzen.
3. Instagram Professional verbinden.
4. Content Agent aus passenden Artikelgruppen speisen.

### Phase 5: Ein Browserkanal

1. Kleinanzeigen als ersten isolierten Browser-Connector auswählen.
2. zunächst nur Entwurf plus Verifikation.
3. danach kontrolliertes Publizieren mit Freigabe.
4. Formularänderungen und Login-Handoffs messen.

Erst nach einem stabilen Piloten den gleichen Mechanismus auf weitere Browserkanäle übertragen.

## Nächste konkrete Arbeit

Der nächste Build sollte nicht ein weiterer allgemeiner Agent sein. Er sollte den eBay-Kreis schließen:

```text
freigegebener Artikel
  -> echtes eBay Inventory Item
  -> echtes Offer
  -> menschliche Freigabe
  -> Publish
  -> externe ID verifizieren
  -> Order erkennen
  -> Bestand sperren
  -> Versandaufgabe
```

Parallel werden Telegram-Freigaben und der Secret Vault eingerichtet. Danach bekommt Hermes genau einen produktiven Browserkanal. So wächst Autonomie messbar, statt nur neue Missionen und Oberflächen zu erzeugen.

## Quellen

- [eBay Inventory API](https://developer.ebay.com/develop/api/sell/inventory_api)
- [eBay: Inventory Item to Offer](https://developer.ebay.com/api-docs/sell/static/inventory/inventory-item-to-offer.html)
- [Shopify productCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/productcreate)
- [Shopify Webhook Topics](https://shopify.dev/docs/api/admin-graphql/latest/enums/WebhookSubscriptionTopic)
- [Whatnot Seller API](https://developers.whatnot.com/)
- [Vinted Pro Integrations](https://pro-docs.svc.vinted.com/)
- [Instagram API](https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00)
- [Hermes Browser Automation](https://hermes-agent.nousresearch.com/docs/user-guide/features/browser/)
- [OpenClaw Browser](https://docs.openclaw.ai/tools/browser)
