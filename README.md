# @schroeer-haren/dsv

[![CI](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@schroeer-haren/dsv.svg)](https://www.npmjs.com/package/@schroeer-haren/dsv)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

TypeScript-Bibliothek zum **Lesen und Schreiben von DSV-Dateien** des Deutschen
Schwimm-Verbands – Formate **DSV7** und **DSV8**, alle vier Listenarten.

> **Status: 1.0 – stabil.** Der Funktionsumfang steht, und die öffentliche
> Oberfläche ist eingefroren: Was in [`docs/public-api.md`](docs/public-api.md)
> steht, bleibt bis zur nächsten Hauptversion.

## Installation

```
npm i @schroeer-haren/dsv
```

Benötigt Node.js >= 18. Die Bibliothek hat keine Runtime-Abhängigkeiten und wird
als ESM und CommonJS inklusive Type-Declarations ausgeliefert.

## Schnellstart

Eine Ergebnisliste lesen und die Zeiten eines Wettkampfs ausgeben:

```typescript
import { parseWettkampfergebnisliste, projectWettkampfergebnisliste } from '@schroeer-haren/dsv';

const datei =
  [
    'FORMAT:Wettkampfergebnisliste;7;',
    'ERZEUGER:Beispiel;1.0;info@example.org;',
    'VERANSTALTUNG:Herbstpokal 2026;Musterstadt;25;HANDZEIT;',
    'VERANSTALTER:SV Musterstadt;',
    'AUSRICHTER:SV Musterstadt;Meier, Anna;Beispielweg 1;12345;Musterstadt;GER;;;anna@example.org;',
    'ABSCHNITT:1;10.10.2026;09:00;N;',
    'WETTKAMPF:25;E;1;2;50;F;GL;W;SW;;;',
    'WERTUNG:25;E;1;JG;2010;2011;W;Jugend weiblich;',
    'VEREIN:SV Musterstadt;1234;10;GER;',
    'PNERGEBNIS:25;E;1;1;;Schmidt, Lea;100001;501;W;2010;;SV Musterstadt;1234;00:00:28,44;;;GER;;;',
    'DATEIENDE',
  ].join('\r\n') + '\r\n';

const {
  document: gelesen,
  diagnostics: befunde,
  ok: gelesenOk,
} = parseWettkampfergebnisliste(datei);

gelesenOk; // → true
befunde; // → []

const { graph: wettkaempfe } = projectWettkampfergebnisliste(gelesen);
const lauf = wettkaempfe.wettkampfByKey.get('25:E')!;

lauf.starts[0].name; // → 'Schmidt, Lea'
lauf.starts[0].endzeit; // → 2844
```

Zeiten sind in Hundertstelsekunden dekodiert, Daten als Tripel aus Tag, Monat
und Jahr. Alle übrigen Werte bleiben Zeichenketten – die Rohwerte werden für
das byte-identische Zurückschreiben gebraucht.

## Die zwei Ebenen

Die Bibliothek bietet zwei Ebenen, die aufeinander aufbauen:

|                             | schema-freie Ebene     | typisierte Ebene                            |
| --------------------------- | ---------------------- | ------------------------------------------- |
| Funktionen                  | `parseDsv`, `writeDsv` | `parse…`, `project…`, `write…` je Listenart |
| Kennt Feldbedeutungen       | nein                   | ja                                          |
| Validiert gegen das Schema  | nein                   | ja                                          |
| Byte-identischer Round-Trip | ja                     | ja                                          |
| Listenarten                 | alle, auch unbekannte  | die vier bekannten                          |
| Formatversionen             | DSV7 und DSV8          | DSV7 und DSV8                               |

**Nimm die typisierte Ebene**, wenn du mit den Inhalten arbeitest: Ergebnisse
auswerten, Meldungen erzeugen, Dateien prüfen. Sie gibt dir benannte Felder,
dekodierte Werte und einen Objektgraph mit aufgelösten Bezügen.

**Nimm die schema-freie Ebene**, wenn dich die Bedeutung der Felder nicht
interessiert – siehe [Schema-frei arbeiten](#schema-frei-arbeiten).

### Die vier Listenarten

Jede Listenart hat dieselben drei Funktionen: `parse…` liest und validiert,
`project…` löst die Bezüge zu einem Objektgraph auf, `write…` schreibt
typisierte Records zurück.

| Listenart                     | Elemente | Funktionen                                                                                             |
| ----------------------------- | -------: | ------------------------------------------------------------------------------------------------------ |
| **Wettkampfdefinitionsliste** |       19 | `parseWettkampfdefinitionsliste`, `projectWettkampfdefinitionsliste`, `writeWettkampfdefinitionsliste` |
| **Wettkampfergebnisliste**    |       18 | `parseWettkampfergebnisliste`, `projectWettkampfergebnisliste`, `writeWettkampfergebnisliste`          |
| **Vereinsmeldeliste**         |       17 | `parseVereinsmeldeliste`, `projectVereinsmeldeliste`, `writeVereinsmeldeliste`                         |
| **Vereinsergebnisliste**      |       20 | `parseVereinsergebnisliste`, `projectVereinsergebnisliste`, `writeVereinsergebnisliste`                |

Die beiden Wettkampflisten sind die Sicht des Veranstalters, die beiden
Vereinslisten die Sicht des Vereins: Was er meldet und was er als Protokoll
zurückbekommt. Alle vier gibt es als DSV7 und DSV8.

## Wettkampfdefinitionsliste

Die Ausschreibung: Was wird wann geschwommen, in welcher Wertung, zu welchem
Meldegeld. `parseWettkampfdefinitionsliste` prüft die Datei gegen das Schema und
legt jeden Feldwert unter seinem Namen ab – statt unter einem Index:

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
    'MELDEGELD:Einzelmeldegeld;3,00;;',
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

`projectWettkampfdefinitionsliste` löst daraus die Bezüge auf und liefert einen
Objektgraph – Wettkämpfe hängen an ihrem Abschnitt, Wertungen und Pflichtzeiten
an ihrem Wettkampf:

```typescript
import { projectWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

const { graph } = projectWettkampfdefinitionsliste(liste);

graph.veranstaltung.bezeichnung; // → 'Herbstpokal 2026'

const abschnitt = graph.abschnitte[0];

abschnitt.datum; // → { day: 10, month: 10, year: 2026 }
abschnitt.anfangszeit; // → 540
abschnitt.wettkaempfe.length; // → 1
abschnitt.wettkaempfe[0].wertungen[0].name; // → 'offen'

// Index-Map über alle Wettkämpfe; Schlüssel ist `${nummer}:${art}`
graph.wettkampfByKey.get('1:E')?.einzelstrecke; // → 50
```

`anfangszeit` zählt Minuten seit Mitternacht. Ein Wettkampf wird über das Paar
aus Nummer und Art adressiert, nicht über die Nummer allein: Dieselbe Nummer
kommt regelmässig als Vorlauf und als Entscheidung vor.

`writeWettkampfdefinitionsliste` schreibt typisierte Records wieder als Text:

```typescript
import { writeWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

writeWettkampfdefinitionsliste(liste.records) === definition; // → true
```

## Wettkampfergebnisliste

Das Protokoll der ganzen Veranstaltung: alle Starts aller Vereine.

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
graph.abschnitte[0].kampfrichter[0].position; // → 'SR'
```

Ein `ErgebnisStart` ist der Schwimmvorgang einer Person in einem Wettkampf:

```typescript
const wettkampf = graph.wettkampfByKey.get('25:E')!;

wettkampf.starts.length; // → 2

const start = wettkampf.starts[0];

start.name; // → 'Schmidt, Lea'
start.endzeit; // → 2844
start.zwischenzeiten; // → [{ distanz: 25, zeit: 1372, line: 14 }]
start.reaktionen; // → [{ art: '+', zeit: 71, line: 15 }]
```

Die Datei kennt keine Personen-Entität, sondern wiederholt dieselbe Person je
Wertung. Der Objektgraph fasst diese Zeilen zu einem Start zusammen; die
Wertungen hängen als `ErgebnisPlatzierung` daran:

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
Staffel und Person. `ErgebnisPerson` steht so in keiner Datei – die
Wettkampfergebnisliste hat kein `PERSON`-Element, die Entität wird aus den
Ergebniszeilen aggregiert und sammelt alle Starts einer Person:

```typescript
graph.personById.get(501)!.name; // → 'Schmidt, Lea'
graph.personById.get(501)!.starts.length; // → 1

// Die Kennzahl 0 steht für Vereine ausserhalb des DSV und ist kein
// Schlüssel – sie bleibt aus der Map heraus.
graph.vereinByKennzahl.get(1234)!.bezeichnung; // → 'SV Musterstadt'
```

## Vereinsmeldeliste

Was ein Verein an den Ausrichter schickt: seine Meldungen, seine Staffeln, seine
Kampfrichter und Trainer.

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
graph.abschnitte[0].anfangszeit; // → 540
graph.personen.length; // → 2
```

Eine gemeldete Person trägt ihre Einzelstarts, ihre Nationalitäten, ihren
aufgelösten Trainer und – bei Para-Schwimmerinnen und -Schwimmern – ihr
Handicap:

```typescript
const lea = graph.personById.get(1)!;

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
const staffel = graph.staffelById.get(9001)!;

staffel.name; // → 'Staffel A'
staffel.wertungsklasseTyp; // → 'JG'
staffel.starts; // → [{ wettkampfnr: 4, wettkampfart: 'E', meldezeit: 12500, line: 16 }]
staffel.personen.map((p) => p.veranstaltungsId); // → [1, 2]

writeVereinsmeldeliste(liste.records) === meldung; // → true
```

## Vereinsergebnisliste

Das Protokoll, das der Verein zurückbekommt – auf seine Teilnehmenden
beschränkt. Anders als die Wettkampfergebnisliste kennt sie `PERSON` als eigenes
Element; die Person muss also nicht aus den Ergebniszeilen zusammengesetzt
werden:

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
graph.abschnitte[0].kampfrichter[0].position; // → 'SR'
graph.personen.length; // → 2
graph.wertungById.get(1)!.name; // → 'Jugend weiblich'
```

Ein `ErgebnisStart` hängt an seiner Person und trägt Endzeit, Zwischenzeiten,
Reaktionszeiten und die Platzierungen:

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

## Werte formatieren

Der Objektgraph hält Zeiten als Hundertstelsekunden, Uhrzeiten als Minuten seit
Mitternacht und Daten als Tripel. Zum Anzeigen oder Zurückschreiben braucht es
die Formatierungsregel des Formats – führende Nullen, Komma als
Dezimaltrennzeichen und die volle `HH:MM:SS,hh`-Form auch für Zeiten unter einer
Stunde. Nachgebaut wird sie leicht knapp daneben, deshalb sind dieselben Codecs
exportiert, die die Bibliothek intern benutzt:

```typescript
import { encodeZeit, encodeDatum, encodeUhrzeit, isZeroZeit } from '@schroeer-haren/dsv';

const start = graph.wettkampfByKey.get('25:E')!.starts[0]!;
const abschnitt = graph.abschnitte[0]!;

start.endzeit; // → 2844
encodeZeit(start.endzeit!); // → '00:00:28,44'

abschnitt.datum; // → { day: 10, month: 10, year: 2026 }
encodeDatum(abschnitt.datum!); // → '10.10.2026'

abschnitt.anfangszeit; // → 540
encodeUhrzeit(abschnitt.anfangszeit!); // → '09:00'
```

`00:00:00,00` ist der spezifizierte Unterlassungswert für „keine Zeit" und wird
bewusst nicht auf `null` abgebildet – sonst ginge beim Zurückschreiben die
Unterscheidung zwischen „nicht angegeben" und „ausdrücklich Null" verloren.
`isZeroZeit` fragt ihn ab:

```typescript
isZeroZeit(start.endzeit!); // → false
isZeroZeit(0); // → true
```

In der Gegenrichtung lesen `decodeZeit`, `decodeDatum` und `decodeUhrzeit` eine
Zeichenkette ein und geben `null` zurück, wenn sie nicht dem Format entspricht:

```typescript
decodeZeit('00:01:04,37'); // → 6437
decodeZeit('1:04,37'); // → null
```

## Diagnostics

Alle `parse…`-Funktionen geben statt einer Exception ein `ParseResult` zurück:
den Wert, eine Liste von `Diagnostic`s und ein `ok`-Kennzeichen. Jede Diagnostic
trägt einen stabilen `code`, eine `severity`, eine Quellzeile und eine Meldung.

Es gibt vier Severities:

| Severity  | Bedeutung                                     | Wirkung                                           |
| --------- | --------------------------------------------- | ------------------------------------------------- |
| `fatal`   | Die Eingabe ist keine verwertbare DSV-Datei.  | Auswertung bricht ab, `ok` ist `false`            |
| `error`   | Die Datei verletzt das Schema.                | Werte werden trotzdem geliefert, `ok` ist `false` |
| `warning` | Auffällig, aber in echten Dateien verbreitet. | `ok` bleibt `true`                                |
| `info`    | Hinweis, etwa eine Lücke der Spezifikation.   | `ok` bleibt `true`                                |

`ok` ist genau dann `true`, wenn **keine** Diagnostic die Stufe `error` oder
`fatal` hat. `warning` und `info` lassen `ok` unberührt – sie beschreiben
Dateien, die im Wettkampfbetrieb üblich sind.

Gelesen wird bewusst nachsichtig: Ein unzulässiger Wert verhindert die
typisierten Records nicht, er steht als Diagnostic daneben. So kannst du eine
fehlerhafte Datei trotzdem anzeigen, statt nur eine Fehlermeldung zu haben:

```typescript
import { parseWettkampfdefinitionsliste } from '@schroeer-haren/dsv';

// bahnlaenge '99' gibt es nicht – erlaubt sind 16, 20, 25, 33, 50, FW und X
const kaputt =
  [
    'FORMAT:Wettkampfdefinitionsliste;7;',
    'ERZEUGER:Beispiel;1.0;info@example.org;',
    'VERANSTALTUNG:Herbstpokal 2026;Musterstadt;99;HANDZEIT;',
    'VERANSTALTUNGSORT:Hallenbad;Beispielweg 1;12345;Musterstadt;GER;;;;',
    'AUSSCHREIBUNGIMNETZ:https://example.org/ausschreibung;',
    'VERANSTALTER:SV Musterstadt;',
    'AUSRICHTER:SV Musterstadt;Meier, Anna;Beispielweg 1;12345;Musterstadt;GER;;;anna@example.org;',
    'MELDEADRESSE:Meier, Anna;Beispielweg 1;12345;Musterstadt;;;;anna@example.org;',
    'MELDESCHLUSS:01.10.2026;23:59;',
    'ABSCHNITT:1;10.10.2026;08:00;08:30;09:00;;',
    'WETTKAMPF:1;E;1;1;50;B;GL;M;SW;;;',
    'WERTUNG:1;E;1;AK;0;0;M;offen;',
    'MELDEGELD:Einzelmeldegeld;3,00;;',
    'DATEIENDE',
  ].join('\r\n') + '\r\n';

const {
  document: trotzdem,
  diagnostics: befunde,
  ok: istOk,
} = parseWettkampfdefinitionsliste(kaputt);

istOk; // → false
trotzdem.records.length; // → 14
befunde[0].code; // → 'invalid-enum-value'
befunde[0].severity; // → 'error'
befunde[0].message; // → 'VERANSTALTUNG.bahnlaenge: "99" is not an allowed value in DSV7'
befunde[0].line; // → 3
befunde[0].data; // → { field: 'bahnlaenge', value: '99' }
```

Beim **Schreiben** ist die Bibliothek dagegen streng: Was beim Lesen nur
gemeldet wurde, verhindert das Schreiben und wirft einen `DsvWriteError`. Sonst
entstünden Dateien, die andere Programme nicht lesen können:

```typescript
import { writeWettkampfdefinitionsliste, DsvWriteError } from '@schroeer-haren/dsv';

let meldungText = '';
try {
  writeWettkampfdefinitionsliste(trotzdem.records);
} catch (fehler) {
  if (fehler instanceof DsvWriteError) meldungText = fehler.message;
}

meldungText; // → 'invalid-enum-value: VERANSTALTUNG.bahnlaenge: "99" is not an allowed value in DSV7'
```

### Echte Dateien sind oft nicht spec-konform

Darauf solltest du vorbereitet sein, bevor es dich überrascht: **28 der 142
echten Wettkampfdateien im Testbestand – knapp ein Fünftel – enthalten
mindestens einen `error`.** Ganz überwiegend ist es dasselbe fehlende
Pflichtfeld, `KAMPFGERICHT.vereinDesKampfrichters`, das verbreitete
Wettkampfsoftware schlicht leer lässt.

Das ist kein Fehler der Bibliothek: Die Dateien verletzen die Spezifikation
wirklich, und ein `error` ist die richtige Meldung. Es heißt aber, dass
`ok === true` **kein brauchbares Eingangstor** für echte Dateien ist – damit
weist du jede fünfte zurück, obwohl ihre Daten einwandfrei sind. Über alle 137
echten DSV7-Dateien hinweg:

| Code                         | Schwere   | Anzahl |
| ---------------------------- | --------- | -----: |
| `missing-required-field`     | `error`   |     53 |
| `invalid-value`              | `warning` |     74 |
| `unterminated-field-list`    | `warning` |     73 |
| `conditional-field-required` | `warning` |     58 |
| `invalid-enum-value`         | `warning` |     12 |

Die tragfähige Haltung ist, `fatal` als Abbruchgrund zu nehmen und alles andere
zu protokollieren:

```typescript
const { document, diagnostics } = parseWettkampfergebnisliste(text);

if (diagnostics.some((d) => d.severity === 'fatal')) {
  throw new Error('keine verwertbare DSV-Datei');
}

for (const d of diagnostics) console.warn(`${d.line}: [${d.severity}] ${d.code}`);
// … mit document weiterarbeiten
```

### Wann `parseDsvOrThrow`?

`parseDsv` liefert auch bei kaputter Eingabe ein Ergebnis. Wenn dich nur der
Erfolgsfall interessiert – etwa in einem Skript, das bei einer unbrauchbaren
Datei ohnehin abbrechen soll – nimm `parseDsvOrThrow`. Es gibt das Dokument
direkt zurück und wirft bei einer Diagnostic der Stufe `fatal` einen
`DsvParseError`, der die Diagnostics mitträgt:

```typescript
import { parseDsvOrThrow, DsvParseError } from '@schroeer-haren/dsv';

let codes: string[] = [];
try {
  parseDsvOrThrow('');
} catch (fehler) {
  if (fehler instanceof DsvParseError) codes = fehler.diagnostics.map((d) => d.code);
}

codes; // → ['empty-input']
```

`parseDsvOrThrow` wirft immer dann, wenn `ok` `false` ist – also **nicht nur
bei `fatal`, sondern auch bei `error`**. Eine Datei ohne `FORMAT`-Element wirft
damit ebenfalls. Für echte Wettkampfdateien ist das der falsche Weg: Knapp jede
fünfte enthält einen `error` (siehe [Grenzen](#grenzen)). Nimm dort `parseDsv`
und entscheide selbst, was du durchgehen lässt.

Für die typisierten `parse…`-Funktionen gibt es keine werfende Variante; dort
ist die Diagnostics-Liste der einzige Weg.

## Schema-frei arbeiten

`parseDsv` und `writeDsv` zerlegen jede DSV-Datei in Records, Kommentare und
Leerzeilen und schreiben sie byte-identisch zurück – ohne das Schema zu kennen:

```typescript
import { parseDsv, writeDsv } from '@schroeer-haren/dsv';

const text = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';

const { document, diagnostics, ok } = parseDsv(text);

document.listenart; // → 'Wettkampfergebnisliste'
document.version; // → 7
document.items.length; // → 2
ok; // → true
diagnostics; // → []

writeDsv(document) === text; // → true
```

Diagnostics melden Auffälligkeiten mit Quellzeile, ohne das Lesen abzubrechen –
fehlt etwa das abschliessende `DATEIENDE`, wird das Dokument trotzdem geliefert:

```typescript
const unvollstaendig = parseDsv('FORMAT:Wettkampfergebnisliste;7;\r\n');

unvollstaendig.ok; // → true
unvollstaendig.diagnostics[0].code; // → 'missing-dateiende-element'
unvollstaendig.diagnostics[0].severity; // → 'warning'
```

Nimm diese Ebene, wenn du

- **Dateien unverändert durchreichen** willst – Ablage, Weiterleitung, Prüfung
  auf Lesbarkeit,
- **gezielt einzelne Zeilen ändern** und den Rest byte-identisch behalten willst,
- **unbekannte Listenarten** verarbeiten musst: Die schema-freie Ebene liest sie
  strukturell, die typisierte lehnt sie mit `fatal` ab,
- eine **abgelehnte Datei trotzdem ansehen** willst: Eine nicht unterstützte
  Formatversion meldet auch `parseDsv` mit `fatal` – die Zeilen zerlegt es
  trotzdem, `document.items` bleibt also zur Diagnose brauchbar,
- **eigene Regeln** über die Rohfelder legen willst, statt das mitgelieferte
  Schema zu benutzen.

Die typisierte Ebene setzt auf `parseDsv` auf – du verlierst also nichts, wenn du
schema-frei anfängst und später auf die typisierte Ebene wechselst.

## Generierte Elementtypen

Für jedes Element der Spezifikation gibt es einen Typ je Formatversion, benannt
nach Element und Version: `VeranstaltungV7`, `WettkampfV8`, `MeldungPersonV8`
und so fort. Sie werden aus den Schema-Definitionen erzeugt und tragen die
Feldbedeutung, die zulässigen Werte und die Fundstelle in der Spezifikation als
Doc-Kommentar – beim Tippen sichtbar:

```typescript
import type { VeranstaltungV7 } from '@schroeer-haren/dsv';

const veranstaltung: VeranstaltungV7 = {
  veranstaltungsbezeichnung: 'Herbstpokal 2026',
  veranstaltungsort: 'Musterstadt',
  bahnlaenge: '25', // '16' | '20' | '25' | '33' | '50' | 'FW' | 'X'
  zeitmessung: 'HANDZEIT',
};

veranstaltung.bahnlaenge; // → '25'
```

Felder mit fester Werteliste sind String-Literal-Unions, ein falscher Wert fällt
also schon beim Kompilieren auf. Die Typen beschreiben die **Rohfelder** einer
Zeile; für ausgewertete Daten nimm den Objektgraph aus `project…`.

## Grenzen

Was die Bibliothek **nicht** tut:

- **DSV6** wird nicht angenommen. Beide Ebenen lehnen es mit
  `unsupported-format-version` (`fatal`) ab – nur DSV7 und DSV8 gelten als
  unterstützt. `parseDsv` zerlegt die Datei trotzdem in Zeilen, damit du sehen
  kannst, was drinsteht; `parseDsvOrThrow` wirft.
- **Die ZIP-Variante** des Standards wird nicht unterstützt. Die Bibliothek
  verarbeitet Text, keine Archive – entpacke sie vorher selbst.
- **Meldegelder werden nicht berechnet.** Die `MELDEGELD`-Zeilen werden gelesen,
  geschrieben und validiert, aber nicht zu einer Rechnung summiert.
- **Zwischen DSV7 und DSV8 wird nicht konvertiert.** Beide Formatversionen
  werden gelesen und geschrieben, jede in sich; eine DSV7-Datei nach DSV8 zu
  überführen ist Sache der aufrufenden Anwendung.
- **Dateinamen** nach der Namenskonvention der Spezifikation werden nicht
  abgeleitet.
- **Zeichenkodierung** ist nicht Aufgabe der Bibliothek: Sie arbeitet auf
  Strings. Der Standard schreibt UTF-8 ohne BOM vor, und alle 142 gesammelten
  echten Dateien halten sich daran – dekodiere sie beim Einlesen trotzdem
  selbst.

## Weiterlesen

| Dokument                                       | Beantwortet                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| [`docs/beispiele.md`](docs/beispiele.md)       | Lauffähiger Code je Listenart und Anwendungsfall, mit echter Ausgabe. |
| [`docs/public-api.md`](docs/public-api.md)     | Jeder Export mit einer Zeile, was er tut.                             |
| [`docs/architecture.md`](docs/architecture.md) | Warum die Bibliothek so gebaut ist, wie sie gebaut ist.               |
| [`docs/benchmark.md`](docs/benchmark.md)       | Laufzeit und Speicherbedarf, gemessen.                                |
| [`CHANGELOG.md`](CHANGELOG.md)                 | Was sich wann geändert hat, inklusive aller Breaking Changes.         |

Ein vollständiger Wegweiser steht in [`docs/README.md`](docs/README.md).

## Öffentliche API

Die vollständige Oberfläche steht in [`docs/public-api.md`](docs/public-api.md):
jede exportierte Funktion, Klasse und jeder Typ mit einer Zeile, was sie tut. Ein
Test hält die Liste mit den tatsächlichen Exporten deckungsgleich. Mit 1.0 wird
diese Oberfläche eingefroren.

## Erprobung an echten Dateien

Die Bibliothek wird nicht nur gegen die Spezifikation getestet, sondern gegen
**142 echte DSV-Dateien** aus dem Wettkampfbetrieb – jede davon wird
byte-identisch zurückgeschrieben.

| Listenart                 | Dateien |
| ------------------------- | ------: |
| Wettkampfergebnisliste    |      75 |
| Vereinsmeldeliste         |      34 |
| Wettkampfdefinitionsliste |      33 |
| Vereinsergebnisliste      |       0 |

Die Dateien stammen aus **fünf Erzeuger-Dialekten** – EasyWk, SPLASH Meet
Manager, cps-schwimm, Schwimmsoftware und WebClub. Die Dialekte unterscheiden
sich real: WebClub schreibt Kommentare nur in eigenen Zeilen und setzt die
Trennzeichen immer vollständig, EasyWk lässt sie in etwa 40 % der Zeilen weg.

Für die **Vereinsergebnisliste** gibt es keine einzige echte Datei – und das
wird sich kaum ändern: Sie geht direkt an den Ausrichter und wird nie
veröffentlicht. Diese Listenart ruht damit als einzige der vier **allein auf der
Spezifikation** und auf synthetischen Fixtures. Sie ist genauso vollständig
implementiert wie die anderen, aber kein echter Erzeuger hat ihr je
widersprochen. Wer sie produktiv einsetzt, sollte das wissen. 137 Dateien sind DSV7, 5 sind
DSV6 – **DSV8 ist in freier Wildbahn noch nicht anzutreffen**. Die
DSV8-Unterstützung ist deshalb gegen das vollständige, zeilenweise erhobene
Delta zwischen beiden Spezifikationen abgesichert statt gegen Realdaten.

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
npm run generate   # generierte Elementtypen neu erzeugen
npm run check      # lint + typecheck + test + build + publint + attw
```

Dieselben Schritte laufen bei jedem Push und Pull-Request auf `main`
automatisch über GitHub Actions.

## Release

Releases werden über GitHub Actions veröffentlicht: Ein GitHub-Release mit dem
Tag `vX.Y.Z` löst den `Release`-Workflow aus, der die Version aus dem Tag setzt,
baut, prüft und via **npm Trusted Publishing (OIDC)** mit Provenance nach npm
veröffentlicht. Es wird kein npm-Token im Repository benötigt.

```
gh release create v1.0.0 --title v1.0.0 --generate-notes
```

## Built With

- [TypeScript](https://www.typescriptlang.org/) – Programmiersprache
- [tsup](https://tsup.egoist.dev/) – Bundler für ESM, CJS und Type-Declarations
- [Vitest](https://vitest.dev/) – Test-Framework
- [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) – Linter und Formatter
- [npm](https://www.npmjs.com/) – Paketmanager

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz – siehe [LICENSE](LICENSE).
