import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Hält die Paketkonfiguration fest. Sie ist bei einem Dual-Publish aus ESM und
 * CJS die häufigste Fehlerquelle — und sie trifft erst die Nutzerinnen und
 * Nutzer, nicht die Entwicklung. `publint` und `attw` prüfen das gebaute Paket
 * im `check`-Skript; diese Tests halten zusätzlich die Absicht fest, damit ein
 * Rückschritt schon ohne Build auffällt.
 */

interface Manifest {
  readonly main: string;
  readonly module: string;
  readonly types: string;
  readonly exports: Record<string, unknown>;
  readonly files: readonly string[];
}

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as Manifest;

describe('Paketkonfiguration', () => {
  it('gibt je Modulsystem eine eigene Typdeklaration an', () => {
    // Eine einzige `types`-Bedingung wird beim Auflösen über `require` als ESM
    // gelesen, obwohl das Paket dort CJS ausliefert ("Masquerading as ESM").
    expect(manifest.exports['.']).toEqual({
      import: { types: './dist/index.d.ts', default: './dist/index.js' },
      require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
    });
  });

  it('stellt die package.json selbst bereit', () => {
    // Viele Werkzeuge lesen die package.json des Pakets zur Laufzeit; ohne
    // diesen Eintrag scheitert das an der `exports`-Map.
    expect(manifest.exports['./package.json']).toBe('./package.json');
  });

  it('nennt die Einstiegspunkte für Werkzeuge ohne exports-Unterstützung', () => {
    expect(manifest.main).toBe('./dist/index.cjs');
    expect(manifest.module).toBe('./dist/index.js');
    expect(manifest.types).toBe('./dist/index.d.ts');
  });

  it('liefert nur dist aus', () => {
    expect(manifest.files).toEqual(['dist']);
  });
});
