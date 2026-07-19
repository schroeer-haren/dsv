# @schroeer-haren/dsv

[![CI](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@schroeer-haren/dsv.svg)](https://www.npmjs.com/package/@schroeer-haren/dsv)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

TypeScript-Bibliothek zum **Parsen und Erzeugen von DSV-Dateien** des Deutschen
Schwimm-Verbands – Formate **DSV7** und **DSV8**.

> ⚠️ **Status: 0.4.0.** Die schema-freie Ebene liest und schreibt Dateien aller
> vier Listenarten byte-identisch zurück. Darauf setzt die typisierte Ebene auf –
> seit 0.4.0 für **alle vier Listenarten**: benannte Felder, Validierung gegen
> das Schema und ein Objektgraph mit aufgelösten Bezügen.

## Installation

```
npm i @schroeer-haren/dsv
```

Benötigt Node.js >= 18. Die Bibliothek hat keine Runtime-Abhängigkeiten und wird
als ESM und CommonJS inklusive Type-Declarations ausgeliefert.

## Verwendung

Die Bibliothek hat zwei Ebenen. Die **schema-freie Ebene** (`parseDsv`,
`writeDsv`) funktioniert für alle vier Listenarten und interessiert sich nicht
für Feldbedeutungen. Die **typisierte Ebene** kennt das Schema und gibt es
inzwischen für alle vier Listenarten.

### Die vier Listenarten im Überblick

Jede Listenart hat dieselben drei Funktionen: `parse…` liest und validiert,
`write…` schreibt typisierte Records zurück, `project…` löst die Bezüge zu einem
Objektgraph auf.

| Listenart                     | Elemente | Funktionen                                                                                             |
| ----------------------------- | -------: | ------------------------------------------------------------------------------------------------------ |
| **Wettkampfdefinitionsliste** |       19 | `parseWettkampfdefinitionsliste`, `writeWettkampfdefinitionsliste`, `projectWettkampfdefinitionsliste` |
| **Wettkampfergebnisliste**    |       18 | `parseWettkampfergebnisliste`, `writeWettkampfergebnisliste`, `projectWettkampfergebnisliste`          |
| **Vereinsmeldeliste**         |       17 | `parseVereinsmeldeliste`, `writeVereinsmeldeliste`, `projectVereinsmeldeliste`                         |
| **Vereinsergebnisliste**      |       20 | `parseVereinsergebnisliste`, `writeVereinsergebnisliste`, `projectVereinsergebnisliste`                |

Die beiden Wettkampflisten sind die Sicht des Veranstalters, die beiden
Vereinslisten die Sicht des Vereins: Was er meldet und was er als Protokoll
zurückbekommt. Alle vier gibt es als DSV7 und DSV8.

### Schema-frei: alle Listenarten

`parseDsv` liefert das Dokument zusammen mit Diagnostics. Ein unverändertes
Dokument schreibt `writeDsv` byte-identisch zurück:

```typescript
import { parseDsv, writeDsv } from '@schroeer-haren/dsv';

const text = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';

const { document, diagnostics, ok } = parseDsv(text);

document.listenart; // → 'Wettkampfergebnisliste'
document.version; // → 7
document.items.length; // → 2
ok; // → true (keine Diagnostic mit Severity 'error' oder 'fatal')
diagnostics; // → []

writeDsv(document) === text; // → true
```

Diagnostics melden Auffälligkeiten mit Position, ohne das Lesen abzubrechen –
fehlt etwa das abschliessende `DATEIENDE`, wird das Dokument trotzdem geliefert:

```typescript
const { diagnostics } = parseDsv('FORMAT:Wettkampfergebnisliste;7;\r\n');

diagnostics[0];
// → {
//     code: 'missing-dateiende-element',
//     severity: 'warning',
//     message: 'DATEIENDE element is missing',
//     start: { line: 1, column: 1 },
//     end: { line: 1, column: 1 },
//   }
```

Wer bei fehlerhaften Dateien lieber eine Exception möchte, nutzt
`parseDsvOrThrow`; es wirft einen `DsvParseError`, der die Diagnostics trägt:

```typescript
import { parseDsvOrThrow, DsvParseError } from '@schroeer-haren/dsv';

try {
  const document = parseDsvOrThrow(text);
  writeDsv(document);
} catch (error) {
  if (error instanceof DsvParseError) console.error(error.diagnostics);
}
```

### Typisiert: Wettkampfdefinitionsliste

`parseWettkampfdefinitionsliste` prüft die Datei gegen das Schema und legt jeden
Feldwert unter seinem Namen ab – statt unter einem Index:

```typescript
import { parseWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

// Eine minimale, vollständige Wettkampfdefinitionsliste
const definition =
  [
    'FORMAT:Wettkampfdefinitionsliste;7;',
    'ERZEUGER:Beispiel;1.0;info@example.org;',
    'VERANSTALTUNG:Herbstpokal 2026;Musterstadt;25;HANDZEIT;',
    'VERANSTALTUNGSORT:Hallenbad;Beispielweg 1;12345;Musterstadt;GER;;;;',
    'AUSSCHREIBUNGIMNETZ:https://example.org/ausschreibung;',
    'VERANSTALTER:SV Musterstadt;',
    'AUSRICHTER:SV Musterstadt;Meier, Anna;Beispielweg 1;12345;Musterstadt;GER;;;anna@example.org;',
    'MELDEADRESSE:Meier, Anna;Beispielweg 1;12345;Musterstadt;;;;anna@example.org;',
    'MELDESCHLUSS:01.10.2026;23:59;',
    'ABSCHNITT:1;10.10.2026;08:00;08:30;09:00;;',
    'WETTKAMPF:1;E;1;1;50;B;GL;M;SW;;;',
    'WERTUNG:1;E;1;AK;0;0;M;offen;',
    'MELDEGELD:EINZELMELDEGELD;3,00;;',
    'DATEIENDE',
  ].join('\r\n') + '\r\n';

const { document: liste, diagnostics, ok } = parseWettkampfdefinitionsliste(definition);

ok; // → true
liste.version; // → 7
diagnostics; // → []

const wettkampf = liste.records.find((r) => r.element === 'WETTKAMPF')!;

wettkampf.values.einzelstrecke; // → '50'
wettkampf.values.technik; // → 'B'
wettkampf.values.zuordnungBestenliste; // → 'SW'
```

Gelesen wird bewusst nachsichtig: Fehlende Felder oder unzulässige Werte
verhindern die typisierten Records nicht, sie stehen als Diagnostics daneben.
Nur eine falsche Listenart und eine nicht unterstützte Formatversion brechen die
Auswertung ab – DSV6 wird mit `fatal` abgelehnt. Geprüft werden Feldanzahl,
Pflichtfelder, Werttypen, Aufzählungswerte, Zahlenbereiche, Kardinalitäten und
elementübergreifende Regeln, jeweils abhängig davon, ob die Datei DSV7 oder DSV8
ist.

`projectWettkampfdefinitionsliste` löst daraus die Bezüge auf und liefert einen
Objektgraph – Wettkämpfe hängen an ihrem Abschnitt, Wertungen und Pflichtzeiten
an ihrem Wettkampf:

```typescript
import { projectWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

const { graph } = projectWettkampfdefinitionsliste(liste);

graph.veranstaltung.bezeichnung; // → 'Herbstpokal 2026'

const abschnitt = graph.abschnitte[0];

abschnitt.datum; // → { day: 10, month: 10, year: 2026 }
abschnitt.anfangszeit; // → 540 (Minuten seit Mitternacht)
abschnitt.wettkaempfe.length; // → 1
abschnitt.wettkaempfe[0].wertungen[0].name; // → 'offen'

// Index-Map über alle Wettkämpfe; Schlüssel ist `${nummer}:${art}`
graph.wettkampfByKey.get('1:E')?.einzelstrecke; // → 50
```

Ein Wettkampf wird über das Paar aus Nummer und Art adressiert, nicht über die
Nummer allein: Dieselbe Nummer kommt regelmässig als Vorlauf und als
Entscheidung vor. Datum, Uhrzeit und Zeit sind dekodiert, alle übrigen Werte
bleiben Zeichenketten – die Rohwerte werden für den Round-Trip gebraucht.

`writeWettkampfdefinitionsliste` schreibt typisierte Records wieder als Text.
Anders als beim Lesen wird hier streng validiert und im Fehlerfall ein
`DsvWriteError` geworfen – was beim Lesen nur eine Warnung war, verhindert das
Schreiben:

```typescript
import { writeWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

writeWettkampfdefinitionsliste(liste.records) === definition; // → true
```

### Typisiert: Wettkampfergebnisliste

Die Ergebnisliste funktioniert genauso – `parseWettkampfergebnisliste`,
`projectWettkampfergebnisliste` und `writeWettkampfergebnisliste`:

```typescript
import { parseWettkampfergebnisliste, projectWettkampfergebnisliste } from '@schroeer-haren/dsv';

// Eine minimale Ergebnisliste: ein Einzelwettkampf und eine Staffel
const ergebnis =
  [
    'FORMAT:Wettkampfergebnisliste;7;',
    'ERZEUGER:Beispiel;1.0;info@example.org;',
    'VERANSTALTUNG:Herbstpokal 2026;Musterstadt;25;HANDZEIT;',
    'VERANSTALTER:SV Musterstadt;',
    'AUSRICHTER:SV Musterstadt;Meier, Anna;Beispielweg 1;12345;Musterstadt;GER;;;anna@example.org;',
    'ABSCHNITT:1;10.10.2026;09:00;N;',
    'KAMPFGERICHT:1;SR;Meier, Anna;SV Musterstadt;',
    'WETTKAMPF:25;E;1;2;50;F;GL;W;SW;;;',
    'WETTKAMPF:40;E;1;1;100;L;GL;X;SW;;;',
    'WERTUNG:25;E;1;JG;2010;2011;W;Jugend weiblich;',
    'WERTUNG:40;E;2;AK;100;;X;Staffel offen;',
    'VEREIN:SV Musterstadt;1234;10;GER;',
    'PNERGEBNIS:25;E;1;1;;Schmidt, Lea;100001;501;W;2010;;SV Musterstadt;1234;00:00:28,44;;;GER;;;',
    'PNZWISCHENZEIT:501;25;E;25;00:00:13,72;',
    'PNREAKTION:501;25;E;+;00:00:00,71;',
    'PNERGEBNIS:25;E;1;0;DS;Bauer, Mia;100002;502;W;2011;;SV Musterstadt;1234;00:00:00,00;Fehlstart;;GER;;;',
    'STERGEBNIS:40;E;2;1;;1;901;SV Musterstadt;1234;00:04:12,34;;;;',
    'STAFFELPERSON:901;40;E;Schmidt, Lea;100001;1;W;2010;;GER;;;',
    'STAFFELPERSON:901;40;E;Bauer, Mia;100002;2;W;2011;;GER;;;',
    'STZWISCHENZEIT:901;40;E;1;50;00:00:31,00;',
    'STABLOESE:901;40;E;2;+;00:00:00,68;',
    'DATEIENDE',
  ].join('\r\n') + '\r\n';

const { document: liste, ok } = parseWettkampfergebnisliste(ergebnis);

ok; // → true

const { graph } = projectWettkampfergebnisliste(liste);

graph.veranstaltung.bezeichnung; // → 'Herbstpokal 2026'
graph.abschnitte[0].kampfgericht[0].position; // → 'SR'
```

Ein `Start` ist der Schwimmvorgang einer Person in einem Wettkampf. Zeiten sind
in Hundertstelsekunden dekodiert:

```typescript
const wettkampf = graph.wettkampfByKey.get('25:E')!;

wettkampf.starts.length; // → 2

const start = wettkampf.starts[0];

start.name; // → 'Schmidt, Lea'
start.endzeit; // → 2844 (Hundertstelsekunden)
start.zwischenzeiten; // → [{ distanz: 25, zeit: 1372, line: 14 }]
start.reaktionen; // → [{ art: '+', zeit: 71, line: 15 }]
```

Die Datei kennt keine Personen-Entität, sondern wiederholt dieselbe Person je
Wertung. Der Objektgraph fasst diese Zeilen zu einem Start zusammen; die
Wertungen hängen als `Platzierung` daran:

```typescript
start.platzierungen[0].wertungsId; // → 1
start.platzierungen[0].platz; // → 1

// Bei Nichtwertung ist der Platz 0 – das erzwingt die Validierung
wettkampf.starts[1].platzierungen[0].platz; // → 0
wettkampf.starts[1].platzierungen[0].grundDerNichtwertung; // → 'DS'
wettkampf.starts[1].platzierungen[0].disqualifikationsbemerkung; // → 'Fehlstart'
```

Staffeln sind ebenso aufgebaut, tragen aber ihre Besetzung und die Ablösezeiten.
Adressiert werden sie über das Tripel aus Veranstaltungs-ID, Wettkampfnummer und
Wettkampfart – dieselbe Mannschaft startet unter derselben ID in mehreren
Wettkämpfen:

```typescript
const staffel = graph.staffelByKey.get('901:40:E')!;

staffel.verein; // → 'SV Musterstadt'
staffel.endzeit; // → 25234
staffel.personen.map((p) => p.name); // → ['Schmidt, Lea', 'Bauer, Mia']
staffel.zwischenzeiten; // → [{ startnummer: 1, distanz: 50, zeit: 3100, line: 20 }]
staffel.abloesen; // → [{ startnummer: 2, art: '+', zeit: 68, line: 21 }]
```

Dazu gibt es Index-Maps über Wettkampf, Wertung, Abschnitt, Verein, Start,
Staffel und Schwimmer. `Schwimmer` steht so in keiner Datei – die Entität wird
aus den Ergebniszeilen zusammengesetzt und sammelt alle Starts einer Person:

```typescript
graph.schwimmerById.get(501)!.name; // → 'Schmidt, Lea'
graph.schwimmerById.get(501)!.starts.length; // → 1

// Die Kennzahl 0 steht für Vereine ausserhalb des DSV und ist kein
// Schlüssel – sie bleibt aus der Map heraus.
graph.vereinByKennzahl.get(1234)!.bezeichnung; // → 'SV Musterstadt'
```

### Typisiert: Vereinsmeldeliste

Die Vereinsmeldeliste ist das, was ein Verein an den Ausrichter schickt: seine
Meldungen, seine Staffeln, seine Kampfrichter und Trainer.
`projectVereinsmeldeliste` löst die Bezüge auf – Meldungen hängen an ihrer
Person, die Person an ihrem Trainer:

```typescript
import {
  parseVereinsmeldeliste,
  projectVereinsmeldeliste,
  writeVereinsmeldeliste,
} from '@schroeer-haren/dsv';

const meldung =
  [
    'FORMAT:Vereinsmeldeliste;8;',
    'ERZEUGER:Beispiel;1.0;info@example.org;',
    'VERANSTALTUNG:Herbstpokal 2026;Musterstadt;25;HANDZEIT;',
    'ABSCHNITT:1;10.10.2026;09:00;N;',
    'WETTKAMPF:1;E;1;1;50;F;GL;W;;;',
    'WETTKAMPF:4;E;1;4;50;F;GL;W;;;',
    'VEREIN:SV Musterstadt;1234;10;GER;J;',
    'ANSPRECHPARTNER:Meier, Anna;Beispielweg 1;12345;Musterstadt;GER;;;anna@example.org;',
    'TRAINER:1;Trainer, Tina;W;',
    'PNMELDUNG:Schmidt, Lea;100001;1;W;2010;;1;GER;;;',
    'PNMELDUNG:Bauer, Mia;100002;2;W;2011;;;;;;',
    'HANDICAP:1;DBS-4711;IPC-4711;S10;SB10;SM10;;',
    'STARTPN:1;1;00:00:29,10;',
    'STARTPN:2;1;;',
    'STMELDUNG:1;9001;JG;2010;2011;Staffel A;',
    'STARTST:9001;4;00:02:05,00;',
    'STAFFELPERSON:9001;4;1;1;',
    'STAFFELPERSON:9001;4;2;2;',
    'DATEIENDE',
  ].join('\r\n') + '\r\n';

const { document: liste, ok } = parseVereinsmeldeliste(meldung);

ok; // → true
liste.version; // → 8

const { graph } = projectVereinsmeldeliste(liste);

graph.verein!.bezeichnung; // → 'SV Musterstadt'
graph.verein!.kennzahl; // → 1234
graph.ansprechpartner!.email; // → 'anna@example.org'
graph.abschnitte[0].datum; // → { day: 10, month: 10, year: 2026 }
graph.abschnitte[0].anfangszeit; // → 540 (Minuten seit Mitternacht)
graph.meldungen.length; // → 2
```

Eine gemeldete Person trägt ihre Einzelstarts, ihre Nationalitäten, ihren
aufgelösten Trainer und – bei Para-Schwimmerinnen und -Schwimmern – ihr
Handicap:

```typescript
const lea = graph.meldungById.get(1)!;

lea.name; // → 'Schmidt, Lea'
lea.jahrgang; // → '2010'
lea.trainer!.name; // → 'Trainer, Tina'
lea.nationalitaeten; // → ['GER']
lea.starts; // → [{ wettkampfnr: 1, wettkampfart: 'E', meldezeit: 2910, line: 13 }]
```

Meldezeiten sind wie alle Zeiten in Hundertstelsekunden dekodiert. Staffeln
stehen daneben und nennen ihre Besetzung als Verweis auf die gemeldeten
Personen:

```typescript
const staffel = graph.staffelmeldungById.get(9001)!;

staffel.name; // → 'Staffel A'
staffel.wertungsklasseTyp; // → 'JG'
staffel.starts; // → [{ wettkampfnr: 4, wettkampfart: 'E', meldezeit: 12500, line: 16 }]
staffel.personen.map((p) => p.veranstaltungsId); // → [1, 2]

writeVereinsmeldeliste(liste.records) === meldung; // → true
```

Das Beispiel enthält absichtlich die Bruststartklasse `SB10`. Sie fehlt in der
Werteliste der Spezifikation, obwohl `S10` und `SM10` bei den beiden anderen
Startklassen stehen – eine Lücke der Vorlage, kein Verbot. Der Wert wird
deshalb gelesen und geschrieben und nur als `info` vermerkt:

```typescript
const { diagnostics } = parseVereinsmeldeliste(meldung);

diagnostics[0];
// → {
//     code: 'invalid-enum-value',
//     severity: 'info',
//     message:
//       'HANDICAP.startklasseBrust: "SB10" is missing from the specification\'s list, accepted as a gap',
//     start: { line: 12, column: 1 },
//     end: { line: 12, column: 1 },
//     data: { field: 'startklasseBrust', value: 'SB10', specGap: true },
//   }
```

### Typisiert: Vereinsergebnisliste

Die Vereinsergebnisliste ist das Protokoll, das der Verein zurückbekommt – auf
seine Teilnehmenden beschränkt. Anders als die Wettkampfergebnisliste kennt sie
`PERSON` als eigenes Element; die Person muss also nicht aus den Ergebniszeilen
zusammengesetzt werden:

```typescript
import { parseVereinsergebnisliste, projectVereinsergebnisliste } from '@schroeer-haren/dsv';

const ergebnis =
  [
    'FORMAT:Vereinsergebnisliste;8;',
    'ERZEUGER:Beispiel;1.0;info@example.org;',
    'VERANSTALTUNG:Herbstpokal 2026;Musterstadt;25;HANDZEIT;',
    'VERANSTALTER:Schwimmverband Musterland;',
    'AUSRICHTER:SV Musterstadt;Meier, Anna;Beispielweg 1;12345;Musterstadt;GER;;;anna@example.org;',
    'ABSCHNITT:1;10.10.2026;09:00;N;',
    'KAMPFGERICHT:1;SR;Meier, Anna;SV Musterstadt;',
    'WETTKAMPF:1;E;1;1;50;F;GL;W;SW;;;',
    'WETTKAMPF:4;E;1;4;200;F;ST;X;SW;;;',
    'WERTUNG:1;E;1;JG;2010;2011;W;Jugend weiblich;',
    'WERTUNG:4;E;2;AK;100;;X;Staffel offen;',
    'VEREIN:SV Musterstadt;1234;10;GER;',
    'PERSON:Schmidt, Lea;100001;1;W;2010;;GER;;;',
    'PERSON:Bauer, Mia;100002;2;W;2011;;GER;;;',
    'PERSONENERGEBNIS:1;1;E;1;1;00:00:28,44;;;;',
    'PERSONENERGEBNIS:2;1;E;1;0;00:00:00,00;DS;Fehlstart;;',
    'PNZWISCHENZEIT:1;1;E;25;00:00:13,72;',
    'PNREAKTION:1;1;E;+;00:00:00,71;',
    'STAFFEL:1;9001;AK;100;;',
    'STAFFELPERSON:9001;4;E;Schmidt, Lea;100001;1;W;2010;;GER;;;',
    'STAFFELPERSON:9001;4;E;Bauer, Mia;100002;2;W;2011;;GER;;;',
    'STAFFELERGEBNIS:9001;4;E;2;1;00:02:05,00;;;;;',
    'STZWISCHENZEIT:9001;4;E;1;100;00:01:03,61;',
    'STABLOESE:9001;4;E;2;+;00:00:00,32;',
    'DATEIENDE',
  ].join('\r\n') + '\r\n';

const { document: liste, ok } = parseVereinsergebnisliste(ergebnis);

ok; // → true

const { graph } = projectVereinsergebnisliste(liste);

graph.veranstaltung.bezeichnung; // → 'Herbstpokal 2026'
graph.verein!.bezeichnung; // → 'SV Musterstadt'
graph.abschnitte[0].kampfgericht[0].position; // → 'SR'
graph.personen.length; // → 2
graph.wertungById.get(1)!.name; // → 'Jugend weiblich'
```

Ein `Start` hängt an seiner Person und trägt Endzeit, Zwischenzeiten,
Reaktionszeiten und die Platzierungen – alle Zeiten in Hundertstelsekunden:

```typescript
const person = graph.personById.get(1)!;

person.name; // → 'Schmidt, Lea'
person.starts.length; // → 1

const start = person.starts[0];

start.endzeit; // → 2844
start.zwischenzeiten; // → [{ distanz: 25, zeit: 1372, line: 17 }]
start.reaktionen; // → [{ art: '+', zeit: 71, line: 18 }]
start.platzierungen[0].wertungsId; // → 1
start.platzierungen[0].platz; // → 1

// Bei Nichtwertung ist der Platz 0 – das erzwingt die Validierung
const mia = graph.personById.get(2)!;

mia.starts[0].platzierungen[0].platz; // → 0
mia.starts[0].platzierungen[0].grundDerNichtwertung; // → 'DS'
mia.starts[0].platzierungen[0].disqualifikationsbemerkung; // → 'Fehlstart'
```

Staffeln sind wie in der Wettkampfergebnisliste über das Tripel aus
Veranstaltungs-ID, Wettkampfnummer und Wettkampfart adressiert und tragen ihre
Besetzung samt Ablösezeiten:

```typescript
const staffel = graph.staffelById.get(9001)!;

staffel.wertungsklasseTyp; // → 'AK'
staffel.starts.length; // → 1

const staffelStart = graph.staffelStartByKey.get('9001:4:E')!;

staffelStart.endzeit; // → 12500
staffelStart.personen.map((p) => p.name); // → ['Schmidt, Lea', 'Bauer, Mia']
staffelStart.zwischenzeiten; // → [{ startnummer: 1, distanz: 100, zeit: 6361, line: 23 }]
staffelStart.abloesen; // → [{ startnummer: 2, art: '+', zeit: 32, line: 24 }]
```

Zwei Regeln greifen hier besonders. Bei **gemischten Wettkämpfen** (Geschlecht
`X`) verlangt die Spezifikation `SW` als Zuordnung zur Bestenliste; das meldet
die Bibliothek nur als Warnung, weil 74 von 244 echten gemischten Wettkämpfen
stattdessen `KG` oder `MS` tragen. Und die **Wertungs-ID eines Ergebnisses** muss
auf eine Wertung des eigenen Wettkampfs zeigen – ein Fremdbezug ist ein
`dangling-reference`. Diese Regel halten alle 97.330 Ergebnisse der echten
Dateien ausnahmslos ein.

## Roadmap

- [x] Schema-freies Lesen beliebiger DSV-Dateien in Records
- [x] Byte-identisches Zurückschreiben unveränderter Dokumente
- [x] Diagnostics mit Code, Severity und Position
- [x] Wettkampfdefinitionsliste typisiert lesen/schreiben (DSV7 und DSV8)
- [x] Validierung von Feldtypen, Aufzählungswerten und Kardinalitäten
- [x] Objektgraph mit aufgelösten Bezügen für die Wettkampfdefinitionsliste
- [x] Wettkampfergebnisliste typisiert lesen/schreiben (DSV7 und DSV8)
- [x] Objektgraph mit aufgelösten Bezügen für die Wettkampfergebnisliste
- [x] Vereinsmeldeliste typisiert lesen/schreiben (DSV7 und DSV8)
- [x] Objektgraph mit aufgelösten Bezügen für die Vereinsmeldeliste
- [x] Vereinsergebnisliste typisiert lesen/schreiben (DSV7 und DSV8)
- [x] Objektgraph mit aufgelösten Bezügen für die Vereinsergebnisliste

Damit sind alle vier Listenarten des DSV-Standards typisiert erschlossen.

## Entwicklung

Dieses Projekt nutzt [npm](https://www.npmjs.com/) als Paketmanager. Nach dem
Klonen die Abhängigkeiten installieren und die bereitgestellten Skripte nutzen:

```
npm install        # Abhängigkeiten installieren
npm run build      # nach ./dist bauen (ESM + CJS + .d.ts, via tsup)
npm run lint       # Lint-Regeln prüfen (ESLint)
npm run lint:fix   # sichere Lint-Fixes anwenden
npm run format     # Formatierung anwenden (Prettier)
npm run typecheck  # TypeScript prüfen (tsc --noEmit)
npm test           # Tests ausführen (Vitest)
npm run test:watch # Tests im Watch-Modus
npm run check      # lint + typecheck + test
```

Dieselben Schritte (Build, Lint, Typecheck, Test) laufen bei jedem Push und
Pull-Request auf `main` automatisch über GitHub Actions.

## Release

Releases werden über GitHub Actions veröffentlicht: Ein GitHub-Release mit dem
Tag `vX.Y.Z` löst den `Release`-Workflow aus, der die Version aus dem Tag setzt,
baut, prüft und via **npm Trusted Publishing (OIDC)** mit Provenance nach npm
veröffentlicht. Es wird kein npm-Token im Repository benötigt.

```
gh release create v0.4.0 --title v0.4.0 --generate-notes
```

## Built With

- [TypeScript](https://www.typescriptlang.org/) – Programmiersprache
- [tsup](https://tsup.egoist.dev/) – Bundler für ESM, CJS und Type-Declarations
- [Vitest](https://vitest.dev/) – Test-Framework
- [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) – Linter und Formatter
- [npm](https://www.npmjs.com/) – Paketmanager

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz – siehe [LICENSE](LICENSE).
