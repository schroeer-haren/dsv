# @schroeer-haren/dsv

[![CI](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@schroeer-haren/dsv.svg)](https://www.npmjs.com/package/@schroeer-haren/dsv)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

TypeScript-Bibliothek zum **Parsen und Erzeugen von DSV-Dateien** des Deutschen
Schwimm-Verbands – Formate **DSV7** und **DSV8**.

> ⚠️ **Status: 0.1.0.** Die Bibliothek liest und schreibt DSV-Dateien
> schema-frei: Sie zerlegt jede Datei in Records und schreibt sie byte-identisch
> zurück, prüft aber weder Feldtypen noch Kardinalitäten. Typisierte Listenarten
> folgen ab 0.2.0.

## Installation

```
npm i @schroeer-haren/dsv
```

Benötigt Node.js >= 18. Die Bibliothek hat keine Runtime-Abhängigkeiten und wird
als ESM und CommonJS inklusive Type-Declarations ausgeliefert.

## Verwendung

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

## Roadmap

- [x] Schema-freies Lesen beliebiger DSV-Dateien in Records
- [x] Byte-identisches Zurückschreiben unveränderter Dokumente
- [x] Diagnostics mit Code, Severity und Position
- [ ] DSV7: Wettkampfdefinitionsliste typisiert lesen/schreiben
- [ ] DSV7: Vereinsmeldeliste typisiert lesen/schreiben
- [ ] DSV7: Wettkampfergebnisliste typisiert lesen/schreiben
- [ ] DSV8-Unterstützung
- [ ] Validierung von Feldtypen und Kardinalitäten

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
gh release create v0.1.0 --title v0.1.0 --generate-notes
```

## Built With

- [TypeScript](https://www.typescriptlang.org/) – Programmiersprache
- [tsup](https://tsup.egoist.dev/) – Bundler für ESM, CJS und Type-Declarations
- [Vitest](https://vitest.dev/) – Test-Framework
- [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) – Linter und Formatter
- [npm](https://www.npmjs.com/) – Paketmanager

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz – siehe [LICENSE](LICENSE).
