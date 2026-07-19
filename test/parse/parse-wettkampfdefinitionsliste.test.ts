import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { parseWettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

/** Die Zeilen eines vollständigen, gültigen Minimaldokuments. */
function minimal(version: 6 | 7 | 8 = 8): string[] {
  return [
    line('FORMAT', ['Wettkampfdefinitionsliste', String(version)]),
    line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
    line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
    line('VERANSTALTUNGSORT', ['Schwimmhalle Kiel', '', '', 'Kiel', 'GER', '', '', '']),
    line('AUSSCHREIBUNGIMNETZ', ['https://example.org/ausschreibung']),
    line('VERANSTALTER', ['SV Test']),
    line('AUSRICHTER', ['SV Test', 'Max Mustermann', '', '', '', '', '', '', 'info@example.org']),
    line('MELDEADRESSE', ['Max Mustermann', '', '', '', '', '', '', 'info@example.org']),
    line('MELDESCHLUSS', ['01.05.2026', '18:00']),
    line('ABSCHNITT', ['1', '10.05.2026', '', '', '09:00', '']),
    line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
    line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']),
    line('MELDEGELD', ['Meldegeldpauschale', '10,00', '']),
    'DATEIENDE',
  ];
}

const text = (lines: readonly string[]): string => `${lines.join('\r\n')}\r\n`;

describe('parseWettkampfdefinitionsliste', () => {
  it('liefert typisierte Records mit benannten Feldern', () => {
    const result = parseWettkampfdefinitionsliste(text(minimal(8)));

    expect(result.ok).toBe(true);
    expect(result.document.listenart).toBe('Wettkampfdefinitionsliste');
    expect(result.document.version).toBe(8);

    const veranstaltung = result.document.records.find((r) => r.element === 'VERANSTALTUNG');
    expect(veranstaltung?.values).toEqual({
      veranstaltungsbezeichnung: 'Testwettkampf',
      veranstaltungsort: 'Kiel',
      bahnlaenge: '25',
      zeitmessung: 'HANDZEIT',
    });
  });

  it('führt DATEIENDE als Record ohne Feldwerte', () => {
    const result = parseWettkampfdefinitionsliste(text(minimal(8)));
    const dateiende = result.document.records.find((r) => r.element === 'DATEIENDE');

    expect(dateiende).toBeDefined();
    expect(dateiende?.values).toEqual({});
  });

  it('lässt Felder aus DSV8 in einer DSV7-Datei weg', () => {
    // BANKVERBINDUNG.kontoinhaber gibt es erst ab DSV8 — in DSV7 fehlt auch
    // sein Trennzeichen.
    const withBank = (version: 7 | 8): string[] => [
      ...minimal(version).slice(0, -1),
      line(
        'BANKVERBINDUNG',
        version === 8
          ? ['Testbank', 'DE02120300000000202051', 'BYLADEM1001', 'SV Test']
          : ['Testbank', 'DE02120300000000202051', 'BYLADEM1001'],
      ),
      'DATEIENDE',
    ];

    const v7 = parseWettkampfdefinitionsliste(text(withBank(7)));
    const v8 = parseWettkampfdefinitionsliste(text(withBank(8)));

    const names = (result: typeof v7): string[] =>
      Object.keys(
        result.document.records.find((r) => r.element === 'BANKVERBINDUNG')?.values ?? {},
      );

    expect(v7.ok).toBe(true);
    expect(v8.ok).toBe(true);
    expect(names(v7)).toEqual(['nameDerBank', 'iban', 'bic']);
    expect(names(v8)).toEqual(['nameDerBank', 'iban', 'bic', 'kontoinhaber']);
  });

  it('lehnt eine Wettkampfergebnisliste mit wrong-list-type ab', () => {
    const lines = [...minimal(8)];
    lines[0] = line('FORMAT', ['Wettkampfergebnisliste', '8']);

    const result = parseWettkampfdefinitionsliste(text(lines));

    expect(result.ok).toBe(false);
    expect(result.document.records).toEqual([]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'wrong-list-type', severity: 'fatal' }),
    );
  });

  it('akzeptiert die Listenart ohne Rücksicht auf Gross-/Kleinschreibung', () => {
    const lines = [...minimal(8)];
    lines[0] = line('FORMAT', ['WETTKAMPFDEFINITIONSLISTE', '8']);

    expect(parseWettkampfdefinitionsliste(text(lines)).ok).toBe(true);
  });

  it('lehnt eine DSV6-Datei als fatal ab und liefert keine Records', () => {
    const result = parseWettkampfdefinitionsliste(text(minimal(6)));

    expect(result.ok).toBe(false);
    expect(result.document.records).toEqual([]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'unsupported-format-version', severity: 'fatal' }),
    );
  });

  it('meldet ein unbekanntes Element und typisiert es nicht', () => {
    // Ohne das Überspringen entstünde ein Record mit leerem `values`, der still
    // durch Projektion und Writer liefe.
    const lines = minimal(8);
    lines.splice(lines.length - 1, 0, line('KAMPFRICHTER', ['1', 'X']));
    const result = parseWettkampfdefinitionsliste(text(lines));

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'unknown-element' }));
    expect(result.document.records.some((r) => r.element === 'KAMPFRICHTER')).toBe(false);
  });

  it('führt die Diagnostics aus parseDsv mit denen der Validierung zusammen', () => {
    // Ohne DATEIENDE meldet parseDsv eine Warnung, die Validierung einen Fehler.
    const result = parseWettkampfdefinitionsliste(text(minimal(8).slice(0, -1)));

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'missing-dateiende-element', severity: 'warning' }),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'cardinality-violation', severity: 'error' }),
    );
    expect(result.ok).toBe(false);
  });
});

/** Alle Fixtures eines Verzeichnisses, die eine Wettkampfdefinitionsliste sind. */
function definitionLists(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /\.dsv[678]?$/i.test(f))
    .filter((f) => {
      const { document } = parseDsv(readFileSync(join(dir, f), 'utf8'));
      return (
        document.listenart?.toLowerCase() === 'wettkampfdefinitionsliste' &&
        (document.version === 7 || document.version === 8)
      );
    });
}

const REAL = 'test/fixtures/real';
const SYNTH = 'test/fixtures/synth';

const realLists = definitionLists(REAL);
const synthLists = definitionLists(SYNTH);

describe('Wettkampfdefinitionslisten aus test/fixtures/real', () => {
  it('findet den erwarteten Bestand', () => {
    expect(realLists).toHaveLength(31);
  });

  it.each(realLists)('%s wird ohne fatal gelesen', (name) => {
    const result = parseWettkampfdefinitionsliste(readFileSync(join(REAL, name), 'utf8'));
    expect(result.diagnostics.filter((d) => d.severity === 'fatal')).toEqual([]);
    expect(result.document.records.length).toBeGreaterThan(0);
  });

  /**
   * Erwartete Abweichung: Vier echte Dateien lassen das Pflichtfeld
   * `BESONDERES.anmerkungen` leer. Das ist ein Mangel der erzeugenden Software,
   * kein Mangel des Schemas — deshalb bleibt es ein `error` und wird hier
   * namentlich festgehalten. Steigt die Zahl, ist das ein Fund.
   */
  it('hat genau vier Dateien mit Fehlern, alle wegen leerem BESONDERES.anmerkungen', () => {
    const withErrors = realLists
      .map((name) => ({
        name,
        errors: parseWettkampfdefinitionsliste(
          readFileSync(join(REAL, name), 'utf8'),
        ).diagnostics.filter((d) => d.severity === 'error'),
      }))
      .filter((f) => f.errors.length > 0);

    expect(withErrors.map((f) => f.name)).toHaveLength(4);

    for (const file of withErrors) {
      for (const error of file.errors) {
        expect({ file: file.name, code: error.code, data: error.data }).toEqual({
          file: file.name,
          code: 'missing-required-field',
          data: { field: 'anmerkungen' },
        });
      }
    }
  });

  /**
   * Erwartete Abweichung: Zwei echte Dateien lassen bei Finals die
   * Qualifikationswettkampfnr leer, obwohl dsv8.md:1110 sie verlangt. Deshalb
   * ist die Regel eine Warnung. Steigt die Zahl, ist das ein Fund.
   */
  it('warnt genau 22-mal wegen fehlender Qualifikationswettkampfnr', () => {
    const warnings = realLists.flatMap((name) =>
      parseWettkampfdefinitionsliste(readFileSync(join(REAL, name), 'utf8'))
        .diagnostics.filter(
          (d) => d.code === 'conditional-field-required' && d.severity === 'warning',
        )
        .map((d) => ({ name, data: d.data })),
    );

    expect(warnings).toHaveLength(22);
    expect(new Set(warnings.map((w) => w.name))).toEqual(
      new Set(['b-csc-2026-02-22-Gersthof-Wk.dsv7', 'b-freital-2026-07-04-Windbergfest-Wk.dsv7']),
    );
    for (const warning of warnings) {
      expect(warning.data).toMatchObject({ field: 'qualifikationswettkampfnr' });
    }
  });

  /**
   * Erwartete Abweichung: dsv8.md:3159 verlangt für gemischte Wettkämpfe die
   * Zuordnung `SW`. Fünf echte Ausschreibungen halten sich nicht daran und
   * tragen stattdessen `KG` (kindgerechte Wettkämpfe) oder `MS` (Masters) —
   * beides fachlich sinnvoll. Deshalb ist die Regel eine Warnung.
   *
   * Über alle 103 echten Dateien betrifft das 74 von 244 gemischten
   * Wettkämpfen; die übrigen 37 stehen in den Ergebnislisten und sind dort
   * festgehalten. Steigt die Zahl, ist das ein Fund.
   */
  it('warnt genau 37-mal wegen gemischter Wettkämpfe ohne SW', () => {
    const warnings = realLists.flatMap((name) =>
      parseWettkampfdefinitionsliste(readFileSync(join(REAL, name), 'utf8'))
        .diagnostics.filter((d) => d.code === 'invalid-value' && d.severity === 'warning')
        .map((d) => ({ name, data: d.data })),
    );

    expect(warnings).toHaveLength(37);
    expect(new Set(warnings.map((w) => w.name))).toEqual(
      new Set([
        'b-potsdam-2024-11-23-Potsdam-Wk.dsv7',
        'dachau-2025-02-23-Dachau-Wk.dsv7',
        'dsvportal-13062024-Wk.dsv7',
        'dsvportal-13392023-Wk.dsv7',
        'dsvportal-1582026-Wk.dsv7',
      ]),
    );
    for (const warning of warnings) {
      expect(warning.data).toMatchObject({ field: 'zuordnungBestenliste', geschlecht: 'X' });
      expect(['KG', 'MS']).toContain(warning.data?.['value']);
    }
  });
});

describe('Wettkampfdefinitionslisten aus test/fixtures/synth', () => {
  it('findet mindestens eine Datei', () => {
    expect(synthLists.length).toBeGreaterThan(0);
  });

  it.each(synthLists)('%s wird fehlerfrei gelesen', (name) => {
    const result = parseWettkampfdefinitionsliste(readFileSync(join(SYNTH, name), 'utf8'));
    expect(
      result.diagnostics.filter((d) => d.severity === 'error' || d.severity === 'fatal'),
    ).toEqual([]);
  });
});
