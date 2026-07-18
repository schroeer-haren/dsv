# @schroeer-haren/dsv

TypeScript-Bibliothek zum **Parsen und Erzeugen von DSV-Dateien** des Deutschen
Schwimm-Verbands – Formate **DSV7** und **DSV8**.

> ⚠️ **Status: frühe Entwicklung (0.0.x).** Aktuell existiert nur das Grundgerüst
> mit ein paar Low-Level-Helfern. Die Format-Implementierung folgt.

## Installation

```bash
npm install @schroeer-haren/dsv
```

## Verwendung

```ts
import { parseLine, formatLine, DSV_FORMATS } from '@schroeer-haren/dsv';

parseLine('FORMAT:Wettkampfdefinitionsliste;7;');
// → ['FORMAT:Wettkampfdefinitionsliste', '7']

formatLine(['FORMAT:Wettkampfdefinitionsliste', '7']);
// → 'FORMAT:Wettkampfdefinitionsliste;7;'

DSV_FORMATS;
// → ['DSV7', 'DSV8']
```

## Entwicklung

```bash
npm install
npm run typecheck   # TypeScript prüfen
npm test            # Tests (vitest)
npm run build       # dist/ bauen (ESM + CJS + .d.ts)
```

## Roadmap

- [ ] DSV7: Wettkampfdefinitionsliste lesen/schreiben
- [ ] DSV7: Vereinsmeldeliste lesen/schreiben
- [ ] DSV7: Wettkampfergebnisliste lesen/schreiben
- [ ] DSV8-Unterstützung
- [ ] Validierung & aussagekräftige Fehlermeldungen

## Lizenz

MIT
