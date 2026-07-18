# Synthetische Fixtures

Erzeugt von [`scripts/build-synth-fixtures.ts`](../../../scripts/build-synth-fixtures.ts).
Der Ordner wird bei jedem Lauf neu geschrieben — hier nichts von Hand ablegen.

Sie decken ab, wofür es in den 108 echten Dateien keine Belege gibt.

## Wettkampfdefinitionsliste

| Datei | Deckt ab |
| --- | --- |
| `nachweis.dsv7` | Element `NACHWEIS` — kommt in keiner echten Datei vor |
| `lastschrift-dsv8.dsv8` | Element `LASTSCHRIFT` — DSV8-Neuheit |
| `bankverbindung-dsv8.dsv8` | `BANKVERBINDUNG.kontoinhaber` — DSV8-Neuheit |
| `bankverbindung-dsv7.dsv7` | dieselbe Zeile ohne das DSV8-Feld, als Gegenprobe |
| `pflichtzeit.dsv7` | `PFLICHTZEIT` in allen Geschlechtsvarianten |
| `dsv8-neue-werte.dsv8` | `KB`/`KR`, `D` bei WETTKAMPF, die zwei neuen Meldegeldtypen, Masters-Notation `100+` |

## Wettkampfergebnisliste

Von den 75 echten Ergebnislisten sind 72 DSV7 und 3 DSV6; eine DSV8-Datei gibt
es nicht. Die vier synthetischen Dateien schliessen die Stellen, für die es
deshalb keinen Beleg gibt.

| Datei | Deckt ab |
| --- | --- |
| `ergebnis-staffel.dsv7` | Element `STABLOESE` — kommt in **keiner** echten Datei vor; dazu `nationalitaet3`, `altersklasse` und die Wettkampfarten `Z`, `A`, `N` an allen vier Staffelelementen |
| `ergebnis-nichtwertung.dsv7` | alle fünf Gründe der Nichtwertung (`DS`, `NA`, `AB`, `AU`, `ZU`) bei PNERGEBNIS und STERGEBNIS, alle drei Meldegeldkennzeichen, `startnummerDisqualifiziert` |
| `ergebnis-kampfgericht.dsv7` | alle 20 Kampfrichterpositionen, darunter die real fehlenden `ASCH`, `SIB`, `SAUF`, `VER`, `STO`, `WKH`; die Wettkampfarten `A` und `N`; die Ausübungen `AR`, `ST`, `WE`, `GB` |
| `ergebnis-dsv8.dsv8` | die DSV8-Fassung — strukturell mit DSV7 identisch, kein Element und kein Feld kommt hinzu; dazu Geschlecht `D` und die Kicks `KB`/`KR` |

Alle vier Dateien werden von `parseWettkampfergebnisliste` ohne eine einzige
Diagnostic gelesen; sie taugen damit auch als Eingabe für den Round-Trip des
Schreibers.

### Verbleibende Lücke

`VERANSTALTUNG.bahnlaenge` ist im Wert `20` nicht belegt. `VERANSTALTUNG` steht
genau einmal je Datei, es gibt vier Ergebnis-Fixtures, und fünf Werte (`16`,
`20`, `33`, `FW`, `X`) sind in echten Dateien unbelegt — einer bleibt
zwangsläufig übrig. Schliessen liesse sich das mit einer fünften Datei, die
sonst nichts Neues zeigte.

`STABLOESE` ist die riskanteste Stelle der Ergebnisliste: kein einziges
Vorkommen in echten Daten, Feldfolge und Wertevorrat allein aus der
Spezifikation. Was dieses Fixture prüft, ist die Lesart der Spezifikation, nicht
die Wirklichkeit.

`PFLICHTZEIT` ist die riskanteste Stelle: In echten Dateien kommt es nur
zweimal vor, und die unabhängige Ruby-Implementierung, die sonst als
Gegencheck dient, lässt das Element ausdrücklich aus — ihr Autor hielt die
Spec-Beispiele für widersprüchlich. Für dieses Element gibt es also weder
nennenswerte Realdaten noch eine zweite Lesart.
