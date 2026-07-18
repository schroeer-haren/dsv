# @schroeer-haren/dsv

[![CI](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@schroeer-haren/dsv.svg)](https://www.npmjs.com/package/@schroeer-haren/dsv)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

TypeScript-Bibliothek zum **Parsen und Erzeugen von DSV-Dateien** des Deutschen
Schwimm-Verbands – Formate **DSV7** und **DSV8**.

> ⚠️ **Status: 0.2.0.** Die schema-freie Ebene liest und schreibt Dateien aller
> vier Listenarten byte-identisch zurück. Darauf setzt die typisierte Ebene auf,
> bislang für die **Wettkampfdefinitionsliste**: benannte Felder, Validierung
> gegen das Schema und ein Objektgraph mit aufgelösten Bezügen. Die übrigen
> Listenarten folgen.

## Installation

```
npm i @schroeer-haren/dsv
```

Benötigt Node.js >= 18. Die Bibliothek hat keine Runtime-Abhängigkeiten und wird
als ESM und CommonJS inklusive Type-Declarations ausgeliefert.

## Verwendung

Die Bibliothek hat zwei Ebenen. Die **schema-freie Ebene** (`parseDsv`,
`writeDsv`) funktioniert für alle vier Listenarten und interessiert sich nicht
für Feldbedeutungen. Die **typisierte Ebene** kennt das Schema und gibt es für
die Wettkampfdefinitionsliste.

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

## Roadmap

- [x] Schema-freies Lesen beliebiger DSV-Dateien in Records
- [x] Byte-identisches Zurückschreiben unveränderter Dokumente
- [x] Diagnostics mit Code, Severity und Position
- [x] Wettkampfdefinitionsliste typisiert lesen/schreiben (DSV7 und DSV8)
- [x] Validierung von Feldtypen, Aufzählungswerten und Kardinalitäten
- [x] Objektgraph mit aufgelösten Bezügen für die Wettkampfdefinitionsliste
- [ ] Vereinsmeldeliste typisiert lesen/schreiben
- [ ] Wettkampfergebnisliste typisiert lesen/schreiben
- [ ] Vereinsergebnisliste typisiert lesen/schreiben

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
gh release create v0.2.0 --title v0.2.0 --generate-notes
```

## Built With

- [TypeScript](https://www.typescriptlang.org/) – Programmiersprache
- [tsup](https://tsup.egoist.dev/) – Bundler für ESM, CJS und Type-Declarations
- [Vitest](https://vitest.dev/) – Test-Framework
- [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) – Linter und Formatter
- [npm](https://www.npmjs.com/) – Paketmanager

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz – siehe [LICENSE](LICENSE).
