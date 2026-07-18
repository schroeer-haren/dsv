import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { parseWettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

/** Die Zeilen einer vollständigen, gültigen Minimal-Ergebnisliste. */
function minimal(version: 7 | 8 = 8): string {
  return `${[
    line('FORMAT', ['Wettkampfergebnisliste', String(version)]),
    line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
    line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
    line('VERANSTALTER', ['SV Test']),
    line('AUSRICHTER', ['SV Test', 'Max Mustermann', '', '', '', '', '', '', 'info@example.org']),
    line('ABSCHNITT', ['1', '10.05.2026', '09:00', '']),
    line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
    line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']),
    line('VEREIN', ['SV Test', '1234', '5', 'GER']),
    'DATEIENDE',
  ].join('\n')}\n`;
}

describe('parseWettkampfergebnisliste', () => {
  it('liest eine gültige Minimalliste ohne Befund', () => {
    const result = parseWettkampfergebnisliste(minimal());

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.document.listenart).toBe('Wettkampfergebnisliste');
    expect(result.document.version).toBe(8);
  });

  it('legt jeden Feldwert unter seinem Schema-Namen ab', () => {
    const { document } = parseWettkampfergebnisliste(minimal());
    const wettkampf = document.records.find((r) => r.element === 'WETTKAMPF');

    expect(wettkampf?.values).toMatchObject({
      wettkampfnr: '1',
      wettkampfart: 'E',
      einzelstrecke: '50',
      technik: 'F',
      ausuebung: 'GL',
      geschlecht: 'M',
      zuordnungBestenliste: 'SW',
      qualifikationswettkampfnr: '',
    });
  });

  it('lehnt eine Wettkampfdefinitionsliste fatal ab', () => {
    const result = parseWettkampfergebnisliste('FORMAT:Wettkampfdefinitionsliste;7;\nDATEIENDE\n');

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toContain('wrong-list-type');
    expect(result.document.records).toEqual([]);
  });

  it('lehnt DSV6 fatal ab', () => {
    const result = parseWettkampfergebnisliste(minimal(7).replace(';7;', ';6;'));

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.severity)).toContain('fatal');
    expect(result.document.records).toEqual([]);
  });

  it('liest trotz Mängeln typisierte Records', () => {
    const result = parseWettkampfergebnisliste(minimal().replace(';1234;5;GER;', ';1234;5;;'));

    expect(result.ok).toBe(false);
    expect(result.document.records.length).toBeGreaterThan(0);
  });
});

/**
 * Bestand an Befunden über alle 72 echten Ergebnislisten, nach Severity und Code.
 *
 * Alle Befunde sind Mängel der Dateien, nicht der Elementtabelle — jeder wurde
 * gegen die Spezifikation geprüft:
 * - `missing-required-field`: 35-mal KAMPFGERICHT.vereinDesKampfrichters,
 *   7-mal VEREIN.nationenkuerzel, 4-mal AUSRICHTER.email, je einmal
 *   VERANSTALTER.nameDesVeranstalters, AUSRICHTER.nameDesAusrichters und
 *   AUSRICHTER.name. Alle sechs Felder sind in der Spezifikation mit `J`
 *   gekennzeichnet (etwa dsv8.md:4664 für den Verein des Kampfrichters).
 * - `conditional-field-required`: Zwischenläufe und Finals ohne
 *   Qualifikationswettkampfnr, dieselbe Warnung wie in der
 *   Wettkampfdefinitionsliste (dsv8.md:1110).
 * - `invalid-enum-value`: einmal KAMPFGERICHT.position `SPR`, bereits als
 *   `tolerated` im Schema hinterlegt (dsv8.md:5852).
 */
const EXPECTED_DIAGNOSTICS: Readonly<Record<string, number>> = {
  'error:missing-required-field': 49,
  'warning:conditional-field-required': 36,
  'warning:invalid-enum-value': 1,
};

/** Anzahl der Dateien mit mindestens einem `error` oder `fatal`. */
const EXPECTED_FILES_WITH_ERRORS = 24;

const REAL = 'test/fixtures/real';

/** Alle Dateien des Ordners, die eine Ergebnisliste der gegebenen Version sind. */
function resultLists(versions: readonly number[]): string[] {
  return readdirSync(REAL)
    .filter((f) => /\.dsv[678]$/i.test(f))
    .filter((f) => {
      const { document } = parseDsv(readFileSync(join(REAL, f), 'utf8'));
      return (
        document.listenart?.toLowerCase() === 'wettkampfergebnisliste' &&
        document.version !== null &&
        versions.includes(document.version)
      );
    });
}

const realLists = resultLists([7]);
const legacyLists = resultLists([6]);

describe('Wettkampfergebnislisten aus test/fixtures/real', () => {
  it('findet den erwarteten Bestand', () => {
    expect(realLists).toHaveLength(72);
  });

  it.each(realLists)('%s wird ohne fatal gelesen', (name) => {
    const result = parseWettkampfergebnisliste(readFileSync(join(REAL, name), 'utf8'));

    expect(result.diagnostics.filter((d) => d.severity === 'fatal')).toEqual([]);
    expect(result.document.records.length).toBeGreaterThan(0);
  });

  it('lehnt die DSV6-Ergebnislisten fatal ab', () => {
    expect(legacyLists).toHaveLength(3);

    for (const name of legacyLists) {
      const result = parseWettkampfergebnisliste(readFileSync(join(REAL, name), 'utf8'));

      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((d) => d.code)).toContain('unsupported-format-version');
    }
  });

  /**
   * Hält den Bestand an Befunden exakt fest: Steigt die Zahl der betroffenen
   * Dateien oder kommt eine Art hinzu, schlägt der Test fehl.
   */
  it('erzeugt genau den festgehaltenen Bestand an Befunden', () => {
    const byCode = new Map<string, number>();
    const filesWithErrors = new Set<string>();

    for (const name of realLists) {
      const result = parseWettkampfergebnisliste(readFileSync(join(REAL, name), 'utf8'));

      for (const d of result.diagnostics) {
        const key = `${d.severity}:${d.code}`;
        byCode.set(key, (byCode.get(key) ?? 0) + 1);
        if (d.severity === 'error' || d.severity === 'fatal') filesWithErrors.add(name);
      }
    }

    expect(Object.fromEntries([...byCode].sort())).toEqual(EXPECTED_DIAGNOSTICS);
    expect(filesWithErrors.size).toBe(EXPECTED_FILES_WITH_ERRORS);
  });
});
