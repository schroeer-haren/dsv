# @schroeer-haren/dsv

[![CI](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/schroeer-haren/dsv/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@schroeer-haren/dsv.svg)](https://www.npmjs.com/package/@schroeer-haren/dsv)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

TypeScript-Bibliothek zum **Parsen und Erzeugen von DSV-Dateien** des Deutschen
Schwimm-Verbands – Formate **DSV7** und **DSV8**.

> ⚠️ **Status: frühe Entwicklung (0.0.x).** Aktuell existiert nur das Grundgerüst
> mit ein paar Low-Level-Helfern. Die Format-Implementierung folgt.

## Installation

```
npm i @schroeer-haren/dsv
```

Benötigt Node.js >= 18. Die Bibliothek hat keine Runtime-Abhängigkeiten und wird
als ESM und CommonJS inklusive Type-Declarations ausgeliefert.

## Verwendung

```typescript
import { parseLine, formatLine, DSV_FORMATS } from '@schroeer-haren/dsv';

parseLine('FORMAT:Wettkampfdefinitionsliste;7;');
// → ['FORMAT:Wettkampfdefinitionsliste', '7']

formatLine(['FORMAT:Wettkampfdefinitionsliste', '7']);
// → 'FORMAT:Wettkampfdefinitionsliste;7;'

DSV_FORMATS;
// → ['DSV7', 'DSV8']
```

## Roadmap

- [ ] DSV7: Wettkampfdefinitionsliste lesen/schreiben
- [ ] DSV7: Vereinsmeldeliste lesen/schreiben
- [ ] DSV7: Wettkampfergebnisliste lesen/schreiben
- [ ] DSV8-Unterstützung
- [ ] Validierung & aussagekräftige Fehlermeldungen

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
