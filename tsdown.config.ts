import { defineConfig } from 'tsdown';

// tsdown statt tsup: tsup erzeugt mit TypeScript 7 keine Typdeklarationen
// mehr (rollup-plugin-dts braucht die Compiler-API, die TS 7 nicht hat), und
// das Projekt hat TS-7-Unterstützung abgelehnt und verweist auf tsdown
// (egoist/tsup#1405). Ausgabe wie bisher: dist/index.js (ESM), index.cjs,
// index.d.ts und index.d.cts, jeweils mit Sourcemap.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: 'es2022',
  platform: 'neutral',
  // `.js` für ESM wie bisher (package.json hat "type": "module"), nicht `.mjs`.
  fixedExtension: false,
});
