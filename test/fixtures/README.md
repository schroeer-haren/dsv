# Fixtures

## `real/` – anonymisierte Realdaten

108 echte DSV-Dateien von öffentlich ausgeschriebenen Schwimmwettkämpfen,
erzeugt mit [`scripts/anonymize.ts`](../../scripts/anonymize.ts) aus den
Originalen in `spec/samples/`.

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

| Listenart                  | DSV7 | DSV6 |
| -------------------------- | ---- | ---- |
| Wettkampfergebnisliste     | 72   | 3    |
| Wettkampfdefinitionsliste  | 31   | 2    |

Zeilenenden: 95× CRLF, 13× LF. Erzeuger überwiegend EasyWk, dazu 9× SPLASH
Meet Manager. Darunter mehrere **Paare aus Ausschreibung und zugehörigem
Protokoll** desselben Wettkampfs – die eignen sich für Konsistenztests über
zwei Dateien hinweg.

### Lücken

- **Vereinsmeldeliste und Vereinsergebnisliste fehlen vollständig.** Beide
  enthalten die Meldedaten eines einzelnen Vereins, gehen direkt an den
  Ausrichter und werden nie veröffentlicht.
- **DSV8 fehlt vollständig.** Der Standard gilt erst ab 01.08.2026, und die
  Landesverbände empfehlen, die Übergangsfrist bis 31.12.2026 auszuschöpfen.
  Selbst Ausschreibungen für Dezember 2026 liegen noch als DSV7 vor.

Beides muss über `synth/` abgedeckt werden.

## `synth/` – synthetische Fixtures

Aus der Spezifikation abgeleitete Dateien, die alle Schemafelder abdecken –
insbesondere die beiden Listenarten und die Formatversion, für die es keine
Realdaten gibt.

## Originale

Die unveränderten Originale liegen lokal in `spec/samples/` und sind
gitignored. **Sie dürfen nicht committet werden.**
