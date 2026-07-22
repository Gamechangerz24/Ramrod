# RAMROD Kundenbereiche, Einladungen und Rechte

## Zwei Einstiege

1. **Neue Instanz:** Eine registrierte Person legt einen vollständig getrennten Kundenbereich an, wählt Unternehmen oder Privat und markiert die ersten Verkaufskanäle. Sie wird dessen `owner`.
2. **Bestehendem Bereich beitreten:** Ein `owner` oder `admin` erzeugt in **Team & Kanäle** einen persönlichen Einladungslink. Der Empfänger registriert sich oder meldet sich an und tritt genau diesem Bereich mit der vorgegebenen Rolle bei.

Eine Supabase-Identität kann Mitglied mehrerer Kundenbereiche sein. Der aktive Bereich wird links gewechselt. Artikel, Bilder, Lagerorte, Agentenläufe, Verkaufskonten und Einladungen bleiben mandantenspezifisch.

## Rollen

| Rolle | Bestand sehen | Artikel/KI bearbeiten | Verkauf freigeben | Kanäle | Team | Bereich |
| --- | --- | --- | --- | --- | --- | --- |
| Inhaber (`owner`) | Ja | Ja | Ja | Verwalten | Verwalten | Verwalten |
| Admin (`admin`) | Ja | Ja | Ja | Verwalten | Operator/Leser verwalten | Nein |
| Operator (`operator`) | Ja | Ja | Nein | Nur verwenden | Nein | Nein |
| Leser (`viewer`) | Ja | Nein | Nein | Nein | Nein | Nein |

Die Rechte werden im Server geprüft. Ausgeblendete Buttons sind nur Bedienkomfort und keine Sicherheitsgrenze.

## Einladungen

- 256-Bit-Zufallstoken; gespeichert wird ausschließlich der SHA-256-Hash.
- Standardgültigkeit: sieben Tage.
- Einmalige Annahme; danach Status `accepted`.
- E-Mail des angemeldeten Kontos muss exakt der eingeladenen Adresse entsprechen.
- Admins dürfen Operatoren und Leser einladen. Nur Inhaber dürfen weitere Admins einladen.
- `owner` wird nicht per normaler Einladung vergeben. Eine spätere Eigentumsübertragung braucht einen eigenen, protokollierten Prozess.
- Links können erneuert oder widerrufen werden. Ein erneuerter Link macht den alten Token sofort ungültig.

## Verkaufskonten

- Verkaufskonten gehören immer zu genau einem Kundenbereich.
- Im Onboarding werden nur Kanalwünsche mit Status `planned` gespeichert.
- OAuth-Tokens, Passwörter und Browser-Cookies dürfen nie in `metadata` oder der Datenbank stehen. `secret_ref` enthält ausschließlich eine Referenz auf einen Secret Vault.
- Nur Inhaber und Admins verbinden oder verändern Konten. Operatoren dürfen konfigurierte Kanäle im vorgesehenen Workflow verwenden.

## Vor echtem Rollout zusätzlich nötig

- Supabase Redirect URLs für `https://admin.ramrod.live/` freigeben.
- E-Mail-Absender und Templates für Registrierung, Bestätigung und Passwort-Reset branden.
- CAPTCHA und Rate Limits für offene Registrierung aktivieren.
- Audit Log für Mitglieds-, Rollen-, Kanal- und Freigabeänderungen ergänzen.
- Eigentumsübertragung, Account-Löschung und Datenexport als gesonderte Flows bauen.
- DSGVO: Auftragsverarbeitung, Löschfristen, Auskunft, Datenexport und Protokollaufbewahrung festlegen.
- Verkaufserlöse und Auszahlungen müssen je Eigentümer/Kunde getrennt abrechenbar sein.
- Support-Zugriff zeitlich begrenzen und sichtbar protokollieren.

## Testfälle

1. Neue E-Mail registriert sich und sieht keine fremden Bereiche.
2. Neue E-Mail legt einen Bereich an und ist dessen Inhaber.
3. Strongvision-Admin lädt einen Operator ein.
4. Eine andere E-Mail kann den Link nicht annehmen.
5. Operator kann scannen, aber weder Team verwalten noch Verkauf freigeben.
6. Leser kann Artikel ansehen, aber keine Schreib-API verwenden.
7. Widerrufener, abgelaufener und bereits angenommener Link wird abgelehnt.
8. Wechsel des Kundenbereichs wechselt Bestand, Agenten und Kanäle vollständig.
