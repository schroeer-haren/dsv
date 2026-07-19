# Beispiele

Lauffähiger Code je Listenart und Anwendungsfall.

**Alle Ausgaben in diesem Dokument wurden ausgeführt**, gegen den gebauten
`dist/`-Stand und die Fixtures unter `test/fixtures/`. Was hinter `// →` steht,
ist das, was tatsächlich herauskam — nicht das, was herauskommen sollte. Wer ein
Beispiel ändert, führt es aus und trägt das Ergebnis ein.

Die Beispieldateien sind die im Repository liegenden Fixtures. Die
`synth/`-Dateien sind synthetisch erzeugt und enthalten ausschließlich
Platzhalternamen; die `real/`-Dateien sind echte Wettkampfdateien, deren
Personennamen und DSV-IDs ersetzt wurden.

## Inhalt

- [Eine Datei lesen](#eine-datei-lesen)
- [Wettkampfdefinitionsliste](#wettkampfdefinitionsliste)
- [Wettkampfergebnisliste](#wettkampfergebnisliste)
- [Vereinsmeldeliste](#vereinsmeldeliste)
- [Vereinsergebnisliste](#vereinsergebnisliste)
- [Diagnostics verstehen](#diagnostics-verstehen)
- [Zeiten, Daten und Uhrzeiten formatieren](#zeiten-daten-und-uhrzeiten-formatieren)
- [Schema-frei arbeiten und byte-identisch zurückschreiben](#schema-frei-arbeiten-und-byte-identisch-zurückschreiben)

## Eine Datei lesen

Die Bibliothek macht kein I/O — sie nimmt und liefert `string`. Das Einlesen und
Dekodieren bleibt beim Aufrufer:

```typescript
import { readFileSync } from 'node:fs';
import { parseWettkampfergebnisliste } from '@schroeer-haren/dsv';

const text = readFileSync('protokoll.dsv7', 'utf8');
const { document, diagnostics, ok } = parseWettkampfergebnisliste(text);
```

Die Listenart wird **ausschließlich** aus dem `FORMAT`-Element gelesen, nie aus
dem Dateinamen — echte Dateien halten sich an die Namenskonvention der
Spezifikation meist nicht. Wenn du nicht weißt, was du vor dir hast, frag zuerst
schema-frei:

```typescript
import { parseDsv } from '@schroeer-haren/dsv';

const { document } = parseDsv(text);
document.listenart; // → 'Wettkampfergebnisliste'  (Rohwert, Vergleich case-insensitiv)
document.version; //   → 7
```

## Wettkampfdefinitionsliste

Die Ausschreibung: was wann geschwommen wird, in welcher Wertung, zu welchem
Meldegeld. Beispieldatei:
`test/fixtures/synth/delta-wettkampfdefinitionsliste-dsv7.dsv7`.

### Lesen und Feldwerte unter ihrem Namen holen

```typescript
import { readFileSync } from 'node:fs';
import { parseWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

const text = readFileSync('test/fixtures/synth/delta-wettkampfdefinitionsliste-dsv7.dsv7', 'utf8');
const { document: liste, diagnostics, ok } = parseWettkampfdefinitionsliste(text);

ok; // → true
diagnostics.length; // → 0
liste.version; // → 7
liste.listenart; // → 'Wettkampfdefinitionsliste'
liste.records.length; // → 17

const wettkampf = liste.records.find((r) => r.element === 'WETTKAMPF')!;

wettkampf.values.wettkampfnr; // → '1'
wettkampf.values.einzelstrecke; // → '50'
wettkampf.values.technik; // → 'F'
wettkampf.values.zuordnungBestenliste; // → 'SW'
```

`records` enthält nur Elemente. Die Kommentarzeile am Dateianfang steht in
`liste.document.items` — deshalb sind es 17 Records bei 18 Zeilen.

### Den Objektgraphen benutzen

`project…` löst die Bezüge auf: Wettkämpfe hängen an ihrem Abschnitt, Wertungen
an ihrem Wettkampf.

```typescript
import { projectWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

const { graph } = projectWettkampfdefinitionsliste(liste);

graph.veranstaltung.bezeichnung; // → 'Synthetischer Wettkampf'
graph.veranstaltung.bahnlaenge; // → '25'

const abschnitt = graph.abschnitte[0];

abschnitt.datum; //          → { day: 15, month: 3, year: 2026 }
abschnitt.anfangszeit; //    → 540   (Minuten seit Mitternacht = 09:00)
abschnitt.einlass; //        → 480   (= 08:00)
abschnitt.relativeAngabe; // → 'N'
abschnitt.wettkaempfe.length; // → 2
```

`relativeAngabe` steht in der Datei als leeres Feld. Der Objektgraph setzt den
in der Spezifikation festgelegten Unterlassungswert `N` ein — die Records tun
das bewusst nicht, sonst stünde er beim Zurückschreiben ausgeschrieben da.

Ein Wettkampf wird über das Paar aus Nummer und Art adressiert, nie über die
Nummer allein: Dieselbe Nummer kommt regelmäßig als Vorlauf und als Entscheidung
vor.

```typescript
[...graph.wettkampfByKey.keys()]; // → ['1:V', '2:V']

graph.wettkampfByKey.get('1:V')!.einzelstrecke; // → 50
graph.wettkampfByKey.get('1:V')!.wertungen[0].name; // → 'Offene Wertung'
```

Beachte den Unterschied zur Record-Ebene: `wettkampf.values.einzelstrecke` ist
der String `'50'`, `graph.…einzelstrecke` die Zahl `50`.

### Schreiben

```typescript
import { writeWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

const zurueck = writeWettkampfdefinitionsliste(liste.records);

zurueck === text; // → false
```

**Das ist kein Fehler.** Die typisierten `write…`-Funktionen nehmen _Records_,
und Records sind Elemente. Die Kommentarzeile `(* synthetische Fixture … *)` am
Dateianfang hat in `records` kein Gegenstück und fällt weg:

```typescript
zurueck === text.split('\r\n').slice(1).join('\r\n'); // → true
```

Wer eine Datei **byte-identisch** durchreichen will — mit Kommentaren,
Leerzeilen und allen Eigenheiten des Erzeugers —, nimmt die schema-freie Ebene,
siehe [unten](#schema-frei-arbeiten-und-byte-identisch-zurückschreiben).

## Wettkampfergebnisliste

Das Protokoll der ganzen Veranstaltung: alle Starts aller Vereine. Beispieldatei:
`test/fixtures/synth/ergebnis-staffel.dsv7`.

```typescript
import { readFileSync } from 'node:fs';
import {
  parseWettkampfergebnisliste,
  projectWettkampfergebnisliste,
  encodeZeit,
} from '@schroeer-haren/dsv';

const text = readFileSync('test/fixtures/synth/ergebnis-staffel.dsv7', 'utf8');
const { document: liste, diagnostics, ok } = parseWettkampfergebnisliste(text);

ok; // → true
diagnostics.map((d) => d.code); // → []

const { graph } = projectWettkampfergebnisliste(liste);

graph.veranstaltung.bezeichnung; // → 'Synthetischer Wettkampf'
graph.abschnitte[0].datum; // → { day: 15, month: 3, year: 2026 }
graph.vereine.map((v) => v.bezeichnung); // → ['SV Musterstadt', 'Auslandsverein']
```

Die Kennzahl `0` steht für Vereine außerhalb des DSV. Sie ist kein Schlüssel und
bleibt deshalb aus der Index-Map heraus — der Auslandsverein ist über
`graph.vereine` erreichbar, über `vereinByKennzahl` nicht:

```typescript
[...graph.vereinByKennzahl.keys()]; // → [1234]
```

Derselbe Wettkampf kommt in mehreren Arten vor — Vorlauf, Finale, Zwischenlauf,
Ausschwimmen, Nachschwimmen:

```typescript
[...graph.wettkampfByKey.keys()]; // → ['10:V', '10:F', '10:Z', '10:A', '10:N']
```

### Staffeln

Staffeln sind über das Tripel aus Veranstaltungs-ID, Wettkampfnummer und
Wettkampfart adressiert: Dieselbe Mannschaft startet unter derselben ID in
mehreren Wettkämpfen.

```typescript
const staffel = graph.staffelByKey.get('9001:10:V')!;

staffel.verein; // → 'SV Musterstadt'
staffel.endzeit; // → 25234
encodeZeit(staffel.endzeit!); // → '00:04:12,34'

staffel.personen.map((p) => p.name);
// → ['Erste, Anna', 'Zweite, Bea', 'Dritte, Cara', 'Vierte, Dora']

staffel.personen[0].nationalitaeten; // → ['GER', 'POL', 'UKR']
```

Zwischenzeiten und Ablösezeiten hängen an der Staffel und tragen jeweils die
Quellzeile mit, damit ein Befund zuordenbar bleibt:

```typescript
staffel.zwischenzeiten;
// → [{ startnummer: 1, distanz: 50, zeit: 3100, line: 25 },
//    { startnummer: 2, distanz: 50, zeit: 6250, line: 26 }]

staffel.abloesen;
// → [{ startnummer: 1, art: '+', zeit: 68, line: 27 },
//    { startnummer: 2, art: '-', zeit: 4,  line: 28 },
//    { startnummer: 3, art: '+', zeit: 21, line: 29 },
//    { startnummer: 4, art: '+', zeit: 33, line: 30 }]
```

Die Ablöse in Zeile 29 steht in der Datei ohne Vorzeichen; `'+'` ist der
eingesetzte Unterlassungswert. Das Vorzeichen ist bewusst ein eigenes Feld und
steckt nicht in `zeit` — sonst ginge der Unterschied zwischen „`+` geschrieben"
und „`+` weggelassen" beim Zurückschreiben verloren.

Die Platzierungen hängen als eigene Ebene daran, weil eine Person oder Staffel
pro Wertung eine eigene Ergebniszeile bekommt:

```typescript
staffel.platzierungen[0];
// → { wertungsId: 1, platz: 1, grundDerNichtwertung: '',
//     disqualifikationsbemerkung: '', erhoehtesNachtraeglichesMeldegeld: '', line: 20 }
```

### `ErgebnisPerson` steht in keiner Datei

Die Wettkampfergebnisliste hat **kein `PERSON`-Element**; `PNERGEBNIS` wiederholt
Name, DSV-ID und Verein in jeder Zeile. `graph.personById` aggregiert diese
Zeilen zu einer Person und sammelt alle ihre Starts. Diese Entität ist eine
Ableitung der Bibliothek, kein Dateiinhalt — in der Vereinsergebnisliste, die
`PERSON` kennt, ist sie es nicht.

## Vereinsmeldeliste

Was ein Verein an den Ausrichter schickt. Beispieldatei:
`test/fixtures/synth/vereinsmeldung.dsv8`.

```typescript
import { readFileSync } from 'node:fs';
import {
  parseVereinsmeldeliste,
  projectVereinsmeldeliste,
  writeVereinsmeldeliste,
} from '@schroeer-haren/dsv';

const text = readFileSync('test/fixtures/synth/vereinsmeldung.dsv8', 'utf8');
const { document: liste, diagnostics, ok } = parseVereinsmeldeliste(text);

ok; // → true
diagnostics.map((d) => d.code); // → []
liste.version; // → 8

const { graph } = projectVereinsmeldeliste(liste);

graph.verein!.bezeichnung; // → 'SV Musterstadt'
graph.verein!.kennzahl; // → 1234
graph.ansprechpartner!.email; // → 'meldung@example.org'
graph.personen.length; // → 3
graph.personen.map((p) => p.name); // → ['Muster, Mia', 'Muster, Mo', 'Muster, Alex']
```

Eine gemeldete Person trägt ihre Einzelstarts und ihren aufgelösten Trainer:

```typescript
const person = graph.personen[0];

person.veranstaltungsId; // → 1
person.jahrgang; // → '2008'
person.trainer!.name; // → 'Trainer, Tina'
person.starts;
// → [{ wettkampfnr: 1, wettkampfart: 'V', meldezeit: 6211, line: 46 }]
```

`jahrgang` ist eine **Zeichenkette**, keine Zahl: Das Feld hat den Spec-Typ
`JGAK` und trägt je nach Kontext einen Jahrgang (`'2008'`), eine Altersklasse
(`'A'`), ein Masters-Alter (`'20'`) oder ein Mindest-Gesamtalter (`'100+'`).
Welche Deutung gilt, entscheidet das `Typ`-Feld (`JG`/`AK`) des umgebenden
Elements — die Bibliothek deutet es nicht vor.

Staffeln nennen ihre Besetzung als Verweis auf die gemeldeten Personen:

```typescript
graph.staffeln.length; // → 2
graph.staffeln[0].name; // → 'Staffel A'
graph.staffeln[0].personen.map((p) => p.veranstaltungsId); // → [1, 2, 3]
```

Diese Datei hat keine Kommentarzeile, deshalb ist der Round-Trip über die
Records hier exakt:

```typescript
writeVereinsmeldeliste(liste.records) === text; // → true
```

## Vereinsergebnisliste

Das Protokoll, das der Verein zurückbekommt — auf seine Teilnehmenden
beschränkt. Anders als die Wettkampfergebnisliste kennt sie `PERSON` als eigenes
Element. Beispieldatei: `test/fixtures/synth/vereinsergebnis.dsv8`.

> **Einschränkung.** Für diese Listenart existiert **keine einzige echte
> Testdatei.** Sie geht direkt an den Ausrichter und wird nie veröffentlicht.
> Ihr Schema und ihre Projektion ruhen allein auf der Spezifikation und auf
> synthetischen Fixtures — als einzige der vier Listenarten. Sie ist genauso
> vollständig implementiert, aber kein echter Erzeuger hat ihr je
> widersprochen.

```typescript
import { readFileSync } from 'node:fs';
import { parseVereinsergebnisliste, projectVereinsergebnisliste } from '@schroeer-haren/dsv';

const text = readFileSync('test/fixtures/synth/vereinsergebnis.dsv8', 'utf8');
const { document: liste, diagnostics, ok } = parseVereinsergebnisliste(text);

ok; // → true
diagnostics.map((d) => d.code); // → ['invalid-enum-value', 'invalid-enum-value']
```

Zwei Befunde, und `ok` bleibt trotzdem `true` — beide sind `info`, siehe
[Diagnostics](#diagnostics-verstehen).

```typescript
const { graph } = projectVereinsergebnisliste(liste);

graph.verein!.bezeichnung; // → 'SV Musterstadt'
graph.personen.length; // → 3
graph.personen.map((p) => p.name); // → ['Muster, Mia', 'Muster, Mo', 'Muster, Alex']

graph.abschnitte.map((a) => a.kampfrichter.length); // → [7, 7, 6]
graph.abschnitte[0].kampfrichter[0].position; // → 'SCH'
```

Ein Start hängt an seiner Person und trägt Endzeit, Zwischenzeiten,
Reaktionszeiten und Platzierungen:

```typescript
const person = graph.personById.get(1)!;

person.name; // → 'Muster, Mia'
person.starts.length; // → 2

const start = person.starts[0];

start.endzeit; // → 6211
start.zwischenzeiten; // → [{ distanz: 50, zeit: 2903, line: 55 }]
start.reaktionen; // → [{ art: '+', zeit: 72, line: 57 }]
start.platzierungen[0];
// → { wertungsId: 1, platz: 1, grundDerNichtwertung: '',
//     disqualifikationsbemerkung: '', erhoehtesNachtraeglichesMeldegeld: '', line: 49 }
```

### Staffelbesetzung hängt an `STAFFEL`, nicht am Ergebnis

`STAFFELERGEBNIS` darf fehlen (Vorkommen 0..N). Die Besetzung ist deshalb an
`STAFFEL` verankert und über `besetzungen` erreichbar — je Wettkampf ein
Eintrag:

```typescript
graph.staffeln.length; // → 3

const staffel = graph.staffeln[0];

staffel.veranstaltungsId; // → 9001
staffel.besetzungen.length; // → 1
staffel.besetzungen[0].wettkampfnr; // → 4
staffel.besetzungen[0].wettkampfart; // → 'E'
staffel.besetzungen[0].personen.map((p) => p.name);
// → ['Muster, Mia', 'Muster, Mo', 'Muster, Alex', 'Muster, Kim']
staffel.besetzungen[0].zwischenzeiten;
// → [{ startnummer: 1, distanz: 100, zeit: 6361, line: 76 },
//    { startnummer: 2, distanz: 200, zeit: 13002, line: 77 }]
```

`VereinsergebnisStaffelStart` führt dieselben Personen und Zwischenzeiten
weiterhin unter `personen` und `zwischenzeiten`; beide Wege zeigen auf dieselben
Objekte. Der Weg über `besetzungen` funktioniert auch dann, wenn es gar kein
`STAFFELERGEBNIS` gibt.

## Diagnostics verstehen

Alle `parse…`-Funktionen geben statt einer Exception ein `ParseResult` zurück:
den Wert, eine Liste von `Diagnostic`s und ein `ok`-Kennzeichen. Jede Diagnostic
trägt einen stabilen `code`, eine `severity`, die 1-basierte Quellzeile `line`,
eine englische `message` und ein strukturiertes `data`.

> Der **Wortlaut von `message` gehört nicht zur zugesicherten Oberfläche** und
> kann sich in jeder Version ändern. Wer einen Befund auswertet oder übersetzt,
> nimmt `code` und `data`.

### Die vier Schweregrade

| Severity  | Bedeutung                                     | Wirkung auf `ok` |
| --------- | --------------------------------------------- | ---------------- |
| `fatal`   | Die Eingabe ist keine verwertbare DSV-Datei.  | `false`          |
| `error`   | Die Datei verletzt das Schema.                | `false`          |
| `warning` | Auffällig, in echten Dateien aber verbreitet. | bleibt `true`    |
| `info`    | Hinweis, meist eine Lücke der Spezifikation.  | bleibt `true`    |

**`fatal` — die Eingabe ist unbrauchbar.** Eine DSV6-Datei etwa:

```typescript
const text = readFileSync('test/fixtures/real/gh-dsvparser-Ergebnisdatei.dsv6', 'utf8');
const { ok, diagnostics } = parseWettkampfergebnisliste(text);

ok; // → false
diagnostics.map((d) => [d.code, d.severity, d.line]);
// → [['unsupported-format-version', 'fatal', 1],
//    ['unsupported-format-version', 'fatal', 1]]
```

**`error` — das Schema ist verletzt, die Daten kommen trotzdem.** Dieser Fall
ist in echten Dateien der Normalfall, nicht die Ausnahme (siehe unten):

```typescript
const text = readFileSync('test/fixtures/real/b-potsdam-2025-lm-protokoll.dsv7', 'utf8');
const { document, diagnostics, ok } = parseWettkampfergebnisliste(text);

ok; // → false
diagnostics.length; // → 3

const fehler = diagnostics[0];

fehler.code; //     → 'missing-required-field'
fehler.severity; // → 'error'
fehler.line; //     → 58
fehler.message; //  → 'KAMPFGERICHT requires a value for field vereinDesKampfrichters'
fehler.data; //     → { field: 'vereinDesKampfrichters' }

// Die Datei bleibt trotzdem vollständig auswertbar:
document.records.length; // → 9857
```

**`warning` — auffällig, aber verbreitet.** `ok` bleibt `true`:

```typescript
const { ok, diagnostics } = parseDsv('FORMAT:Wettkampfergebnisliste;7;\r\n');

ok; // → true
diagnostics.map((d) => [d.code, d.severity, d.line]);
// → [['missing-dateiende-element', 'warning', 1]]
```

**`info` — eine Lücke der Spezifikation.** Die Wertetabelle von
`WERTUNG.wettkampfart` lässt in der Vereinsergebnisliste `A` (Ausschwimmen) und
`N` (Nachschwimmen) aus, obwohl die Nachbarelemente derselben Listenart sie
führen. Solche Werte werden gelesen **und** dürfen geschrieben werden — das
unterscheidet `info` von `warning`:

```typescript
const text = readFileSync('test/fixtures/synth/vereinsergebnis.dsv8', 'utf8');
const { diagnostics, ok } = parseVereinsergebnisliste(text);

ok; // → true
diagnostics[0].code; //     → 'invalid-enum-value'
diagnostics[0].severity; // → 'info'
diagnostics[0].line; //     → 43
diagnostics[0].message;
// → 'WERTUNG.wettkampfart: "A" is missing from the specification\'s list, accepted as a gap'
diagnostics[0].data; // → { field: 'wettkampfart', value: 'A', specGap: true }
```

Ein `warning` mit `data.tolerated === true` bedeutet das Gegenteil: beim Lesen
geduldet, beim Schreiben gesperrt. Etwa `WETTKAMPF.wettkampfart: "A"` in einer
echten Vereinsmeldeliste.

### Warum so viele echte Dateien `error` melden

**28 der 142 echten Dateien im Testbestand — knapp ein Fünftel — enthalten
mindestens einen `error`.** Das ist kein Fehler der Bibliothek: Diese Dateien
sind streng genommen nicht spec-konform. Über alle 137 echten DSV7-Dateien
hinweg:

| Code                         | Schwere   | Anzahl |
| ---------------------------- | --------- | -----: |
| `missing-required-field`     | `error`   |     53 |
| `invalid-value`              | `warning` |     74 |
| `unterminated-field-list`    | `warning` |     73 |
| `conditional-field-required` | `warning` |     58 |
| `invalid-enum-value`         | `warning` |     12 |

Die 53 `error` sind fast ausschließlich ein fehlendes
`KAMPFGERICHT.vereinDesKampfrichters` — ein Pflichtfeld, das verbreitete
Wettkampfsoftware schlicht leer lässt. **Erwarte das, statt dich darauf zu
verlassen, dass `ok === true` ist.** Die brauchbare Haltung ist:

```typescript
const { document, diagnostics, ok } = parseWettkampfergebnisliste(text);

// Nicht: if (!ok) throw …  — damit scheiterst du an jeder fünften echten Datei.
const fatal = diagnostics.filter((d) => d.severity === 'fatal');
if (fatal.length > 0) throw new Error('keine verwertbare DSV-Datei');

// Alles andere anzeigen oder protokollieren und weiterarbeiten:
for (const d of diagnostics) console.warn(`${d.line}: [${d.severity}] ${d.code}`);
```

Beim **Schreiben** ist die Bibliothek dagegen streng. Was beim Lesen nur
gemeldet wurde, verhindert das Schreiben:

```typescript
import { writeWettkampfdefinitionsliste, DsvWriteError } from '@schroeer-haren/dsv';

try {
  writeWettkampfdefinitionsliste([...liste.records].reverse());
} catch (fehler) {
  if (fehler instanceof DsvWriteError) {
    fehler.message;
    // → 'format-not-first-element: FORMAT is not the first element in the file'
    fehler.diagnostics.map((d) => [d.code, d.severity]);
    // → [['format-not-first-element', 'warning'],
    //    ['element-order-violation', 'warning']]
  }
}
```

Beachte: Beide Befunde sind `warning`. Ob ein Befund die eigene Ausgabe sperrt,
hängt am **Code**, nicht an der Schwere — sonst wäre jede Nachsicht beim Lesen
automatisch eine Erlaubnis beim Schreiben.

### `parseDsvOrThrow`

`parseDsvOrThrow` gibt das Dokument direkt zurück und wirft einen
`DsvParseError`, der die Diagnostics mitträgt:

```typescript
import { parseDsvOrThrow, DsvParseError } from '@schroeer-haren/dsv';

try {
  parseDsvOrThrow('');
} catch (fehler) {
  (fehler as DsvParseError).diagnostics.map((d) => [d.code, d.severity]);
  // → [['empty-input', 'fatal']]
}
```

> **Es wirft nicht nur bei `fatal`.** Der Wurf hängt an `ok`, und `ok` ist auch
> bei `error` `false`. Eine Datei ohne `FORMAT`-Element wirft also ebenfalls:
>
> ```typescript
> parseDsvOrThrow('VERANSTALTUNG:X;Y;25;HANDZEIT;\r\nDATEIENDE\r\n');
> // wirft DsvParseError → [['missing-format-element', 'error']]
> ```
>
> Für echte Dateien ist `parseDsvOrThrow` deshalb der falsche Weg: Knapp jede
> fünfte enthält einen `error`. Nimm `parseDsv` und entscheide selbst.

Für die typisierten `parse…`-Funktionen gibt es keine werfende Variante; dort
ist die Diagnostics-Liste der einzige Weg.

## Zeiten, Daten und Uhrzeiten formatieren

Der Objektgraph hält Zeiten als Hundertstelsekunden, Uhrzeiten als Minuten seit
Mitternacht und Daten als `{ day, month, year }`. Zum Anzeigen oder
Zurückschreiben braucht es die Formatierungsregel des Formats — führende Nullen,
Komma als Dezimaltrennzeichen, volle `HH:MM:SS,hh`-Form auch unter einer Stunde.
Sie wird erfahrungsgemäß knapp daneben nachgebaut, deshalb sind dieselben Codecs
exportiert, die die Bibliothek intern benutzt.

```typescript
import {
  decodeZeit,
  encodeZeit,
  isZeroZeit,
  decodeDatum,
  encodeDatum,
  decodeUhrzeit,
  encodeUhrzeit,
} from '@schroeer-haren/dsv';

decodeZeit('00:01:04,37'); // → 6437
decodeZeit('1:04,37'); //     → null    (Kurzform ist nicht spec-konform)
encodeZeit(6437); //          → '00:01:04,37'

decodeDatum('15.03.2026'); // → { day: 15, month: 3, year: 2026 }
decodeDatum('31.02.2026'); // → null    (echter Kalender wird geprüft)
encodeDatum({ day: 15, month: 3, year: 2026 }); // → '15.03.2026'

decodeUhrzeit('09:00'); // → 540
encodeUhrzeit(540); //     → '09:00'
```

Die Decoder geben `null` zurück, wenn die Eingabe nicht dem Format entspricht —
sie lesen fremde Daten, und Ungültiges gehört dort zum Ergebnis.

`00:00:00,00` ist der spezifizierte Unterlassungswert für „keine Zeit" und wird
bewusst **nicht** auf `null` abgebildet; sonst ginge beim Zurückschreiben der
Unterschied zwischen „nicht angegeben" und „ausdrücklich null" verloren:

```typescript
encodeZeit(0); //     → '00:00:00,00'
isZeroZeit(0); //     → true
isZeroZeit(6437); //  → false
```

Die **Encoder werfen** dagegen bei ungültiger Eingabe, statt unlesbare Werte zu
liefern. Ein Encoder bekommt den eigenen Wert des Aufrufers; ist der ungültig,
liegt ein Programmfehler vor:

```typescript
encodeZeit(-1);
// wirft DsvWriteError:
// 'invalid-value: Cannot encode Zeit from -1; expected an integer between 0 and 35999999 (99:59:59,99)'

encodeDatum({ day: 31, month: 2, year: 2026 });
// wirft DsvWriteError:
// 'invalid-value: Cannot encode Datum from {"day":31,"month":2,"year":2026}; expected an existing calendar day with a year between 0 and 9999'
```

Gültig sind ganze Zahlen von `0` bis `35999999` (`99:59:59,99`) für
`encodeZeit`, `0` bis `1439` (`23:59`) für `encodeUhrzeit` und ein wirklich
existierender Kalendertag mit Jahr `0`–`9999` für `encodeDatum`.

## Schema-frei arbeiten und byte-identisch zurückschreiben

`parseDsv` und `writeDsv` zerlegen jede DSV-Datei in Records, Kommentare und
Leerzeilen und schreiben sie **byte-identisch** zurück — ohne das Schema zu
kennen.

```typescript
import { parseDsv, writeDsv } from '@schroeer-haren/dsv';

const text = readFileSync('test/fixtures/synth/ergebnis-staffel.dsv7', 'utf8');
const { document } = parseDsv(text);

document.listenart; //   → 'Wettkampfergebnisliste'
document.version; //     → 7
document.hasBom; //      → false
document.items.length; // → 47

// items enthält alles, auch Nicht-Elemente:
document.items.reduce((a, i) => ((a[i.kind] = (a[i.kind] ?? 0) + 1), a), {});
// → { comment: 1, element: 46 }

writeDsv(document) === text; // → true
```

Jedes Item führt genug mit, um seine Zeile exakt zu rekonstruieren:

```typescript
const record = document.items.find((i) => i.kind === 'element' && i.element === 'ABSCHNITT')!;

record.element; //    → 'ABSCHNITT'
record.fields; //     → ['1', '15.03.2026', '09:00', 'N']
record.line; //       → 7
record.eol; //        → '\r\n'
record.terminated; // → true    (die Attributliste endet auf ';')
record.bare; //       → false
record.raw; //        → 'ABSCHNITT:1;15.03.2026;09:00;N;'
```

`terminated` hält fest, ob das abschließende Semikolon dastand. Die
Spezifikation verlangt es, verbreitete Software lässt es weg — 73 Zeilen in
3 der 142 echten Dateien. Gemeldet wird das als `warning`; beim Schreiben
terminiert die Bibliothek immer.

`bare` unterscheidet die zweite Zeilenform. Genau ein Element hat keine
Attributliste und **keinen Doppelpunkt**:

```typescript
const ende = document.items.find((i) => i.kind === 'element' && i.element === 'DATEIENDE')!;

ende.bare; //   → true
ende.fields; // → []
```

Ein Serializer, der das ignoriert, schreibt `DATEIENDE:` und bricht den
Round-Trip.

**Nimm diese Ebene**, wenn du Dateien unverändert durchreichen, gezielt einzelne
Zeilen ändern und den Rest byte-identisch behalten, unbekannte Listenarten
verarbeiten oder eine abgelehnte Datei trotzdem ansehen willst. Die typisierte
Ebene setzt auf `parseDsv` auf — du verlierst also nichts, wenn du schema-frei
anfängst.
