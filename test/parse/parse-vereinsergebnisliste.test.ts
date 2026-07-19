import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseVereinsergebnisliste } from '../../src/parse/parse-vereinsergebnisliste.js';
import { VEREINSERGEBNISLISTE } from '../../src/schema/vereinsergebnisliste.js';
import { writeVereinsergebnisliste } from '../../src/write/write-vereinsergebnisliste.js';

const FIXTURES = [
  'test/fixtures/synth/vereinsergebnis.dsv8',
  'test/fixtures/synth/vereinsergebnis-knapp.dsv8',
];

const [VOLL, KNAPP] = FIXTURES as [string, string];
const text = readFileSync(VOLL, 'utf8');

describe('parseVereinsergebnisliste', () => {
  it.each(FIXTURES)('%s wird ohne eine einzige Diagnostic gelesen', (path) => {
    const result = parseVereinsergebnisliste(readFileSync(path, 'utf8'));
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.document.listenart).toBe('Vereinsergebnisliste');
    expect(result.document.version).toBe(8);
  });

  it('enthält jedes der zwanzig Elemente mindestens einmal', () => {
    const vorhanden = new Set(
      parseVereinsergebnisliste(text).document.records.map((r) => r.element),
    );
    const erwartet = VEREINSERGEBNISLISTE.elements.map((e) => e.def.name);
    expect(erwartet).toHaveLength(20);
    expect([...vorhanden].sort()).toEqual([...erwartet].sort());
  });

  it('legt die Feldwerte unter ihren Schema-Namen ab', () => {
    const records = parseVereinsergebnisliste(text).document.records;

    const verein = records.find((r) => r.element === 'VEREIN');
    expect(verein?.values['vereinsbezeichnung']).toBe('SV Musterstadt');
    expect(Object.keys(verein?.values ?? {})).not.toContain('lastschrift');

    const staffelperson = records.find((r) => r.element === 'STAFFELPERSON');
    expect(Object.keys(staffelperson?.values ?? {})).toEqual([
      'veranstaltungsIdStaffel',
      'wettkampfnr',
      'wettkampfart',
      'name',
      'dsvId',
      'startnummer',
      'geschlecht',
      'jahrgang',
      'altersklasse',
      'nationalitaet1',
      'nationalitaet2',
      'nationalitaet3',
    ]);
  });

  it('kennt STAFFELERGEBNIS und nicht STERGEBNIS', () => {
    const elemente = new Set(
      parseVereinsergebnisliste(text).document.records.map((r) => r.element),
    );
    expect(elemente.has('STAFFELERGEBNIS')).toBe(true);
    expect(elemente.has('STERGEBNIS')).toBe(false);
  });

  it('lehnt eine fremde Listenart ab', () => {
    const result = parseVereinsergebnisliste('FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n');
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'wrong-list-type')).toBe(true);
  });
});

describe('writeVereinsergebnisliste', () => {
  it.each(FIXTURES)('%s wird byte-genau zurückgeschrieben', (path) => {
    const original = readFileSync(path, 'utf8');
    const records = parseVereinsergebnisliste(original).document.records;
    expect(writeVereinsergebnisliste(records)).toBe(original);
  });

  it('weist ein Element einer fremden Listenart zurück', () => {
    const records = parseVereinsergebnisliste(text).document.records;
    expect(() =>
      writeVereinsergebnisliste([
        ...records,
        { element: 'STERGEBNIS', line: 0, values: { wettkampfnr: '1' } },
      ]),
    ).toThrow(/STERGEBNIS/);
  });

  it('verlangt die Pflichtelemente auch im knappen Fixture', () => {
    const records = parseVereinsergebnisliste(readFileSync(KNAPP, 'utf8')).document.records;
    expect(() => writeVereinsergebnisliste(records.filter((r) => r.element !== 'VEREIN'))).toThrow(
      /VEREIN/,
    );
  });
});

/**
 * Das Beispiel der Spezifikation schreibt `FORMAT:VEREINSERGEBNISLISTE;8;` in
 * Grossbuchstaben, die Attributtabelle dagegen „Konstant
 * 'Vereinsergebnisliste'". Auch die echten Dateien der anderen Listenarten
 * variieren darin (siehe `docs/architecture.md`, Realdaten-Befund 3). Der
 * Vergleich ist deshalb case-insensitiv — belegt war das für diese Listenart
 * bisher nicht.
 */
describe('Vereinsergebnisliste — Grossschreibung der Listart', () => {
  const ORIGINAL = readFileSync(VOLL, 'utf8');

  it('akzeptiert die Listart in Grossbuchstaben', () => {
    const gross = ORIGINAL.replace('Vereinsergebnisliste', 'VEREINSERGEBNISLISTE');

    expect(gross).toContain('VEREINSERGEBNISLISTE');

    const result = parseVereinsergebnisliste(gross);

    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('akzeptiert die Listart in Kleinbuchstaben', () => {
    const result = parseVereinsergebnisliste(
      ORIGINAL.replace('Vereinsergebnisliste', 'vereinsergebnisliste'),
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('weist eine wirklich andere Listart weiterhin zurück', () => {
    const result = parseVereinsergebnisliste(
      ORIGINAL.replace('Vereinsergebnisliste', 'Wettkampfdefinitionsliste'),
    );

    expect(result.diagnostics.map((d) => d.code)).toContain('wrong-list-type');
  });
});
