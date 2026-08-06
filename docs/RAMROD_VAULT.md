# RAMROD Vault

RAMROD Vault ist das private oder mandantenbezogene Inventar fuer Spiele, Filme und andere Sammlungsstuecke. Vault und Verkauf nutzen denselben Artikelkern, aber unterschiedliche Arbeitszustaende.

## Produktgrenze

- Vault beantwortet: Was besitze ich, wo liegt es, was ist es wert und an wen ist es verliehen?
- RAMROD Sales beantwortet: Wie, wo und zu welchem Preis wird ein freigegebener Artikel verkauft?
- Ein Vault-Artikel wird niemals allein durch das Erfassen veroeffentlicht.
- Erst die ausdrueckliche Aktion `Ueber RAMROD verkaufen` uebergibt ihn an Preispruefung, Kanalwahl und Freigabe.

## Ein Datensatz pro Exemplar

Ein physisches Exemplar bleibt ein Artikel. Die Sammlungsdaten liegen im Feld `raw_analysis.uiItem.collection` des bestehenden Supabase-Artikels. Dadurch bleiben Foto, SKU, Preisverlauf, Standort und Verkaufshistorie zusammen.

Wichtige Sammlungszustaende:

- `owned`: in der Sammlung und nicht im Verkaufsprozess
- `loaned`: verliehen und fuer Verkauf gesperrt
- `selling`: an RAMROD uebergeben, aber noch nicht live
- `listed`: auf einem Verkaufskanal aktiv
- `sold`: verkauft und als Historie im Vault sichtbar

## Ablauf

1. Artikel fotografieren oder manuell erfassen.
2. Plattform, Edition, Barcode, Zustand, Standort und Schaetzwert speichern.
3. Optional an eine Person verleihen und Rueckgabe dokumentieren.
4. Bei Verkaufswunsch `Ueber RAMROD verkaufen` waehlen.
5. RAMROD prueft Marktwert, Kanal und Strategie und legt den Artikel in die Freigabe.
6. Erst nach der normalen Verkaufsfreigabe darf ein Kanal-Connector veroeffentlichen.

## Mandanten

Jeder Kundenbereich hat einen eigenen Vault. Rechte und Datenzugriff folgen den vorhandenen Organisationen und Mitgliedschaften. Ein Vault-Artikel wird immer im aktuell ausgewaehlten Kundenbereich gespeichert.

## Einstiegspunkte

- Navigation: `Sammlung`
- Direkter Pfad: `/vault`
- Mobil: vierter Hauptpunkt `Sammlung`

