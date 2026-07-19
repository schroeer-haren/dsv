import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseVereinsmeldeliste } from '../../src/parse/parse-vereinsmeldeliste.js';
import { writeVereinsmeldeliste } from '../../src/write/write-vereinsmeldeliste.js';

const FIXTURE = 'test/fixtures/synth/vereinsmeldung.dsv8';
const text = readFileSync(FIXTURE, 'utf8');

describe('parseVereinsmeldeliste', () => {
  it('liest die synthetische Meldung ohne eine einzige Diagnostic', () => {
    const result = parseVereinsmeldeliste(text);
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.document.listenart).toBe('Vereinsmeldeliste');
    expect(result.document.version).toBe(8);
  });

  it('enthält jedes Element der Listenart mindestens einmal', () => {
    const vorhanden = new Set(parseVereinsmeldeliste(text).document.records.map((r) => r.element));
    expect([...vorhanden].sort()).toEqual(
      [
        'ABSCHNITT',
        'ANSPRECHPARTNER',
        'DATEIENDE',
        'ERZEUGER',
        'FORMAT',
        'HANDICAP',
        'KARIABSCHNITT',
        'KARIMELDUNG',
        'PNMELDUNG',
        'STAFFELPERSON',
        'STARTPN',
        'STARTST',
        'STMELDUNG',
        'TRAINER',
        'VERANSTALTUNG',
        'VEREIN',
        'WETTKAMPF',
      ].sort(),
    );
  });

  it('legt die Feldwerte unter ihren Schema-Namen ab', () => {
    const records = parseVereinsmeldeliste(text).document.records;
    const verein = records.find((r) => r.element === 'VEREIN');
    expect(verein?.values['vereinsbezeichnung']).toBe('SV Musterstadt');
    expect(verein?.values['lastschrift']).toBe('J');

    const staffelperson = records.find((r) => r.element === 'STAFFELPERSON');
    expect(Object.keys(staffelperson?.values ?? {})).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnummer',
      'veranstaltungsId',
      'startnummer',
    ]);
  });

  it('lehnt eine fremde Listenart ab', () => {
    const result = parseVereinsmeldeliste('FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n');
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'wrong-list-type')).toBe(true);
  });
});

describe('writeVereinsmeldeliste', () => {
  it('schreibt die gelesene Meldung byte-genau zurück', () => {
    const records = parseVereinsmeldeliste(text).document.records;
    expect(writeVereinsmeldeliste(records)).toBe(text);
  });

  it('weist ein Element einer fremden Listenart zurück', () => {
    const records = parseVereinsmeldeliste(text).document.records;
    expect(() =>
      writeVereinsmeldeliste([
        ...records,
        { element: 'MELDEGELD', line: 0, values: { meldegeldtyp: 'Meldegeldpauschale' } },
      ]),
    ).toThrow(/MELDEGELD/);
  });
});

/**
 * Das Beispiel der Spezifikation schreibt die Listart in Grossbuchstaben, die
 * Attributtabelle dagegen „Konstant 'Vereinsmeldeliste'". Auch die echten
 * Dateien der anderen Listenarten variieren darin (siehe `docs/architecture.md`,
 * Realdaten-Befund 3). Der Vergleich ist deshalb case-insensitiv — belegt war
 * das für diese Listenart bisher nicht.
 */
describe('Vereinsmeldeliste — Grossschreibung der Listart', () => {
  it('akzeptiert die Listart in Grossbuchstaben', () => {
    const gross = text.replace('Vereinsmeldeliste', 'VEREINSMELDELISTE');

    expect(gross).toContain('VEREINSMELDELISTE');

    const result = parseVereinsmeldeliste(gross);

    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('akzeptiert die Listart in Kleinbuchstaben', () => {
    const result = parseVereinsmeldeliste(text.replace('Vereinsmeldeliste', 'vereinsmeldeliste'));

    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('weist eine wirklich andere Listart weiterhin zurück', () => {
    const result = parseVereinsmeldeliste(
      text.replace('Vereinsmeldeliste', 'Wettkampfdefinitionsliste'),
    );

    expect(result.diagnostics.map((d) => d.code)).toContain('wrong-list-type');
  });
});
