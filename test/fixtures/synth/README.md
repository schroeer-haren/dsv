# Synthetische Fixtures

Erzeugt von [`scripts/build-synth-fixtures.ts`](../../../scripts/build-synth-fixtures.ts).
Der Ordner wird bei jedem Lauf neu geschrieben — hier nichts von Hand ablegen.

Sie decken ab, wofür es in den 108 echten Dateien keine Belege gibt:

| Datei | Deckt ab |
| --- | --- |
| `nachweis.dsv7` | Element `NACHWEIS` — kommt in keiner echten Datei vor |
| `lastschrift-dsv8.dsv8` | Element `LASTSCHRIFT` — DSV8-Neuheit |
| `bankverbindung-dsv8.dsv8` | `BANKVERBINDUNG.kontoinhaber` — DSV8-Neuheit |
| `bankverbindung-dsv7.dsv7` | dieselbe Zeile ohne das DSV8-Feld, als Gegenprobe |
| `pflichtzeit.dsv7` | `PFLICHTZEIT` in allen Geschlechtsvarianten |
| `dsv8-neue-werte.dsv8` | `KB`/`KR`, `D` bei WETTKAMPF, die zwei neuen Meldegeldtypen, Masters-Notation `100+` |

`PFLICHTZEIT` ist die riskanteste Stelle: In echten Dateien kommt es nur
zweimal vor, und die unabhängige Ruby-Implementierung, die sonst als
Gegencheck dient, lässt das Element ausdrücklich aus — ihr Autor hielt die
Spec-Beispiele für widersprüchlich. Für dieses Element gibt es also weder
nennenswerte Realdaten noch eine zweite Lesart.
