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

## Vereinsmeldeliste

Für diese Listenart gibt es **keine einzige** echte Datei. Das Fixture ist
damit der einzige Beleg dafür, dass Schema, Leser und Schreiber zusammenpassen
— was es prüft, ist die Lesart der Spezifikation, nicht die Wirklichkeit.

| Datei | Deckt ab |
| --- | --- |
| `vereinsmeldung.dsv8` | alle 17 Elemente mindestens einmal; die DSV8-Neuheiten `VEREIN.lastschrift`, Geschlecht `D` bei KARIMELDUNG, TRAINER und PNMELDUNG sowie die Ausübungen `KB`/`KR`; alle vier Wettkampfarten, alle vier Kampfrichtergruppen und alle 18 Einsatzwünsche |
| `vereinsmeldung-knapp.dsv8` | dieselbe Listenart mit nur den Pflichtfeldern — `ANSPRECHPARTNER` und `VEREIN` stehen genau einmal je Datei, ihre optionalen Felder lassen sich deshalb erst in einer zweiten Datei leer zeigen |

## Vereinsergebnisliste

Auch für diese Listenart gibt es **keine einzige** echte Datei. Es gilt
dasselbe: Geprüft wird die Lesart der Spezifikation, nicht die Wirklichkeit.

| Datei | Deckt ab |
| --- | --- |
| `vereinsergebnis.dsv8` | alle 20 Elemente mindestens einmal; alle sechs Wettkampfarten (`V`, `Z`, `F`, `E`, `A`, `N`) an WETTKAMPF und den Ergebniselementen, aber nur `V`, `Z`, `F`, `E` an WERTUNG; alle 20 Kampfrichterpositionen einschliesslich `WKH` und `ZBV`; alle Techniken, Ausübungen, Geschlechter und Zuordnungen zur Bestenliste; alle fünf Gründe der Nichtwertung und alle drei Meldegeldkennzeichen; `STAFFELPERSON` mit zwölf Feldern und `STAFFELERGEBNIS` statt `STERGEBNIS` |
| `vereinsergebnis-knapp.dsv8` | dieselbe Listenart mit nur den Pflichtfeldern — `AUSRICHTER` steht genau einmal je Datei, seine sechs optionalen Adressfelder lassen sich deshalb erst in einer zweiten Datei leer zeigen |

Zusammen setzen die beiden Dateien jedes der 117 Schemafelder mindestens
einmal und lassen jedes der 30 optionalen Felder mindestens einmal leer;
`test/coverage-vereinslisten.test.ts` hält das fest. Bei den Pflichtfeldern ist
das keine Lücke, sondern die Regel: Ein leerer Wert wäre dort ein
`missing-required-field`.

`PNREAKTION` und `STABLOESE` sind die riskantesten Stellen dieser Listenart:
Zu beiden führt das Kapitel **keine Beispielzeile**, ihre Attributzahl ist
also nicht gegenprüfbar. `STABLOESE` verweist in seiner Beschreibung ausserdem
auf ein Element `STERGEBNIS`, das es in dieser Listenart gar nicht gibt —
gemeint ist `STAFFEL`.

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
