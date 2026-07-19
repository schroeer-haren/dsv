# Fixtures

## `real/` – anonymisierte Realdaten

142 echte DSV-Dateien von Schwimmwettkämpfen, erzeugt mit
[`scripts/anonymize.ts`](../../scripts/anonymize.ts) aus den Originalen in
`spec/samples/`. Die Wettkampflisten stammen aus öffentlichen Ausschreibungen
und Protokollen, die 34 Vereinsmeldelisten direkt von einem Verein.

Der Ordner wird bei jedem Lauf des Skripts vollständig neu geschrieben – dort
nichts von Hand ablegen.

### Was verändert wurde

Ersetzt sind ausschließlich personenbezogene Feldinhalte: Namen von
Schwimmer\*innen, Kampfrichter\*innen und Ansprechpartner\*innen, DSV-IDs,
Straßen, Telefonnummern, E-Mail-Adressen und Bankverbindungen.

Die Zuordnung ist deterministisch – derselbe Klarname ergibt immer dasselbe
Pseudonym, auch dateiübergreifend. Querbezüge zwischen Elementen und zwischen
Ausschreibung und Protokoll desselben Wettkampfs bleiben damit intakt.

### Was unverändert ist

Alles andere, byte-genau: Struktur, Elementreihenfolge, Feldanzahl,
Trennzeichen, führende und abschließende Leerzeichen, Schwimmzeiten,
Jahrgänge, Vereinsnamen, Kommentare und Zeilenenden.

Nach dem Anonymisieren wurde verifiziert, dass Semikolon-Anzahl, Zeilenzahl,
Anzahl der `\r` und Anzahl der Kommentare je Datei identisch geblieben sind und
dass sämtliche Schwimmzeiten nach Wert und Häufigkeit unverändert sind.

Vereinsnamen bleiben erhalten: Vereine sind Organisationen, keine natürlichen
Personen, und ihre Bezeichnungen sind für Tests strukturell relevant.

### Bestand

| Listenart                 | DSV7 | DSV6 |
| ------------------------- | ---- | ---- |
| Wettkampfergebnisliste    | 72   | 3    |
| Wettkampfdefinitionsliste | 31   | 2    |
| Vereinsmeldeliste         | 34   | –    |

Zeilenenden: 129× CRLF, 13× LF. Erzeuger: 91× EasyWk, 34× WebClub 1.76,
9× SPLASH Meet Manager, 6× cps-schwimm, 2× Schwimmsoftware. Unter den
Wettkampflisten mehrere **Paare aus Ausschreibung und zugehörigem Protokoll**
desselben Wettkampfs – die eignen sich für Konsistenztests über zwei Dateien
hinweg.

Die 34 Vereinsmeldelisten stammen alle von einem Verein (SV Haren) und alle von
WebClub 1.76. Sie sind der einzige Bestand dieser Listenart und damit die erste
Konfrontation ihrer Schematabelle mit echten Daten; der vollständige Befund
steht in `test/parse/parse-vereinsmeldeliste.test.ts`.

### Lücken

- **Die Vereinsergebnisliste fehlt vollständig.** Sie enthält die Ergebnisdaten
  eines einzelnen Vereins, geht direkt an den Ausrichter und wird nie
  veröffentlicht. Für die Vereinsmeldeliste galt das bis zu diesem Bestand
  ebenso – dort liegen inzwischen 34 echte Dateien vor.
- **Nur ein Erzeuger und ein Verein je Vereinsmeldeliste.** Eigenheiten von
  WebClub 1.76 lassen sich mangels zweitem Erzeuger nicht von Eigenschaften der
  Listenart trennen.
- **DSV8 fehlt vollständig.** Der Standard gilt erst ab 01.08.2026, und die
  Landesverbände empfehlen, die Übergangsfrist bis 31.12.2026 auszuschöpfen.
  Selbst Ausschreibungen für Dezember 2026 liegen noch als DSV7 vor.

Das muss über `synth/` abgedeckt werden.

## `synth/` – synthetische Fixtures

Aus der Spezifikation abgeleitete Dateien, die alle Schemafelder abdecken –
insbesondere die Vereinsergebnisliste und die Formatversion, für die es keine
Realdaten gibt, sowie die DSV8-Felder der Vereinsmeldeliste, die in den echten
DSV7-Dateien naturgemäß fehlen.

## Originale

Die unveränderten Originale liegen lokal in `spec/samples/` und sind
gitignored. **Sie dürfen nicht committet werden.**
