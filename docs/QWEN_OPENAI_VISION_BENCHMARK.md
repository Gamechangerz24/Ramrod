# RAMROD Vision Benchmark: Qwen vs. OpenAI-Referenz

Stand: 2026-07-19T06:27:03.224Z

## Einordnung

Dieser Test vergleicht das lokale Modell **qwen3-vl:8b-instruct** auf dem Mac Mini mit den bereits vorhandenen Analysen von **gpt-5.4-mini** für dieselben Strongvision-Fotos. Die OpenAI-Ausgaben sind eine Referenz, keine verifizierte Ground Truth. Marktpreise wurden in diesem Test nicht gegen tatsächlich verkaufte Artikel validiert.

## Ergebnis

| Messwert | Ergebnis |
| --- | ---: |
| Getestete Bilder | 20 |
| Durchschnittliche Qwen-Laufzeit | 127.9 s |
| Durchsatz eines Workers | 28.1 Artikel/Stunde |
| Durchschnittliche Ausgabe | 1300 Tokens |
| Durchschnittliche Qwen-Confidence | 0.0% |
| Von Guardrails zur Prüfung geschickt | 20/20 |
| Mindestens 75% Referenztitel-Abdeckung | 4/20 |
| Unter 50% Referenztitel-Abdeckung | 8/20 |
| Mittlere Referenztitel-Abdeckung | 54.0% |
| Qwen-Fair-Value pauschal 25 EUR | 14/20 |
| Mittlere absolute Fair-Preis-Abweichung zur Referenz | 15.00 EUR |

## Interpretation

- **Identifikation:** Titel-Abdeckung misst nur Textüberschneidung mit OpenAI. Varianten, Editionen und sichtbare Modellnummern müssen zusätzlich manuell bewertet werden.
- **Confidence:** Eine schlecht kalibrierte Modellzahl darf keine automatische Freigabe auslösen. RAMROD sollte Sicherheit aus sichtbaren Belegen, Quellenkonsens und Modellvergleich ableiten.
- **Geschwindigkeit:** Die Laufzeit ist für Hintergrundanreicherung brauchbar. Für eine interaktive Smartphone-Freigabe ist eine schnelle Cloud-Eskalation sinnvoll.
- **Preise:** Qwen vergibt bei 14 von 20 Artikeln pauschal 25 EUR. Diese Werte sind keine belastbare Schätzung. Dafür sind eBay-/Web-/Spezialquellen und verkaufte Vergleichsartikel erforderlich.

## Einzelresultate

Nr. | Datei | OpenAI-Referenz | Qwen | Titel-Abdeckung | Qwen-Confidence | Prüfung | Zeit
---: | --- | --- | --- | ---: | ---: | --- | ---:
1 | IMG_6271.JPG | Mario Kart Spin Out Mario Kart mit Banane (Mario-Figur im Kart) | Spin Out Mario Kart mit Banane | 83% | 0% | Ja | 133s
2 | IMG_6272.JPG | Dragon Age: Inquisition | Dragon Age: Inquisition | 100% | 0% | Ja | 129s
3 | IMG_6273.JPG | iRobot Robotkopf/Displayfigur mit blauem Augen-Design | iRobot Kopf-Modell | 17% | 0% | Ja | 127s
4 | IMG_6274.JPG | Classic Star Trek Movie Series Action Figure: Captain James T. Kirk (Admiral Kirk carded) | Classic Star Trek Movie Series - Admiral Kirk | 58% | 0% | Ja | 137s
5 | IMG_6275.JPG | Mattel Electronics Battlestar Galactica Space Alert Handheld-Spiel in Originalverpackung | Battlestar Galactica Space Alert | 44% | 0% | Ja | 133s
6 | IMG_6276.JPG | Atari Game Program: Space Invaders (CX2632) – Cartridge | Space Invaders | 29% | 0% | Ja | 123s
8 | IMG_6278.JPG | SoulCalibur (Sega Dreamcast) | Soulcalibur | 33% | 0% | Ja | 127s
10 | IMG_6280.JPG | Super Mario Maker Amiibo Figur in OVP | amiibo Super Mario | 50% | 0% | Ja | 126s
11 | IMG_6281.JPG | Star Trek: The Original Series – The Naked Time: Sulu Bobble Head | Star Trek: The Original Series - Sulu Bobble Head (The Naked Time) | 100% | 0% | Ja | 128s
12 | IMG_6282.JPG | Stranger Things Vecna LED Desk Lamp / Schreibtischlampe im Retro-Design | Stranger Things Vecna LED Desk Lamp | 67% | 0% | Ja | 132s
15 | IMG_6285.JPG | Star Wars TIE Fighter Miniatur / Spielzeugmodell (ohne erkennbare Marke) | TIE Fighter Modell | 22% | 0% | Ja | 122s
16 | IMG_6286.JPG | The Warriors Deluxe Box Set (5 Points) action figure set | Mezco Toyz - The Army of the Night Deluxe Box Set | 43% | 0% | Ja | 124s
17 | IMG_6287.JPG | Mad Max: The Road Warrior Actionfigur (N2 Toys) in Blisterverpackung | Mad Max The Road Warrior Actionfigur | 63% | 0% | Ja | 125s
18 | IMG_6288.JPG | Kenner Star Wars Boba Fett Action Figure Cardback/Blister Packaging | Star Wars Boba Fett Actionfigur | 40% | 0% | Ja | 129s
20 | IMG_6290.JPG | DC Comics Figuren-Set: Superman vs. Muhammad Ali (verpackt) | Superman vs. Muhammad Ali Action Figure Set | 56% | 0% | Ja | 134s
21 | IMG_6291.JPG | Super Mario Odyssey Mario and Cappy Action Figure (JAKKS Pacific) | Super Mario Odyssey - Mario and Cappy | 50% | 0% | Ja | 118s
24 | IMG_6294.JPG | Star Wars Black Series / The Vintage Collection: New York Toy Fair 2015 (Mepoz?) Collector Box | Star Wars Limited Edition New York Toy Fair 2015 | 50% | 0% | Ja | 122s
25 | IMG_6295.JPG | Ecco the Dolphin: Defender of the Future | Ecco: The Dolphin - Defender of the Future | 100% | 0% | Ja | 129s
26 | IMG_6296.JPG | Legacy of Kain: Soul Reaver (Dreamcast, PAL/European release wahrscheinlich) | Legacy of Kain: Soul Reaver | 50% | 0% | Ja | 125s
30 | IMG_6300.JPG | Xbox 360 Spiel: Mass Effect 2 (BioWare / Electronic Arts) | Mass Effect Collector's Edition | 25% | 0% | Ja | 136s

## Empfohlene Betriebslogik

1. Qwen übernimmt lokal Bildrotation, OCR, grobe Kategorie, offensichtliche Marke und Datenschutz-freundliche Vorverarbeitung.
2. RAMROD berechnet eine Evidence-Confidence aus sichtbarem Text, Barcode, Plattform, Marke und Variantenmerkmalen.
3. Unklare Variante, hoher Wert, Widerspruch oder geringe Evidence-Confidence löst automatisch eine Cloud-Zweitmeinung aus.
4. Erst danach folgen eBay-/Web-Recherche, Verkaufsstrategie und Preisbildung.
5. Autonomes Listing ist nur bei hoher Identitätssicherheit, Quellenkonsens und unkritischem Wert erlaubt; sonst genügt ein menschliches Go.
