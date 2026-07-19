import { describe, expect, it } from 'vitest';

import { parseWettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';
import { BANKVERBINDUNG, MELDEGELD } from '../../src/schema/wettkampfdefinitionsliste.js';

/**
 * Die beiden Stellen, an denen DSV8 nicht ergänzt, sondern umdeutet.
 *
 * Alle übrigen Unterschiede sind additiv — ein Element, ein Feld oder ein Wert
 * kommt hinzu. Diese beiden sind es nicht, und sie verhalten sich zueinander
 * gegensätzlich: `MELDEGELDPAUSCHALE` ändert seine Bedeutung, ohne dass sich
 * an der Datei etwas ändert; `BANKVERBINDUNG.kontoinhaber` ändert die Datei,
 * ohne dass sich eine Bedeutung verschiebt.
 */

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

/** Die Zeilen eines vollständigen, gültigen Minimaldokuments. */
function minimal(version: 7 | 8): string[] {
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
  ];
}

/** Der Rumpf, den jede Definitionsliste hinter der Bankverbindung braucht. */
const rumpf = [
  line('ABSCHNITT', ['1', '10.05.2026', '', '', '09:00', '']),
  line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
  line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']),
  line('MELDEGELD', ['Meldegeldpauschale', '10,00', '']),
  'DATEIENDE',
];

const text = (lines: readonly string[]): string => `${lines.join('\r\n')}\r\n`;

/** Ein Dokument mit einer BANKVERBINDUNG der angegebenen Feldzahl. */
function mitBankverbindung(version: 7 | 8, felder: readonly string[]): string {
  return text([...minimal(version), line('BANKVERBINDUNG', felder), ...rumpf]);
}

const OHNE_KONTOINHABER = ['Testbank', 'DE02120300000000202051', 'BYLADEM1001'];
const MIT_KONTOINHABER = [...OHNE_KONTOINHABER, 'SV Test'];

describe('MELDEGELDPAUSCHALE — Bedeutungsänderung ohne strukturelle Folge', () => {
  /**
   * DSV7 erhebt den Betrag „pro Meldung“ (dsv7.md:1317), DSV8 „pro Verein“
   * (dsv8.md:1403). Wert, Datentyp und Stellung im Element bleiben identisch;
   * dieselbe Zeile ist in beiden Fassungen gültig und meint doch etwas
   * anderes.
   *
   * Prüfbar ist das nicht: Eine Bibliothek, die Dateien liest und schreibt,
   * rechnet keine Meldegelder ab. Sie kann den Unterschied nur festhalten —
   * dieser Test hält fest, dass sie ihn festhält, und dass keine Diagnose
   * behauptet, hier gäbe es eine Versionsabhängigkeit.
   */
  it('bleibt in beiden Formatversionen derselbe zulässige Wert', () => {
    const zeilen = (version: 7 | 8): string =>
      text([
        ...minimal(version),
        line('ABSCHNITT', ['1', '10.05.2026', '', '', '09:00', '']),
        line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
        line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']),
        line('MELDEGELD', ['Meldegeldpauschale', '10,00', '']),
        'DATEIENDE',
      ]);

    expect(parseWettkampfdefinitionsliste(zeilen(7)).ok).toBe(true);
    expect(parseWettkampfdefinitionsliste(zeilen(8)).ok).toBe(true);
  });

  it('trägt keine Versionsmarkierung, weil sich die Struktur nicht ändert', () => {
    const typ = MELDEGELD.fields.find((f) => f.name === 'meldegeldTyp');
    const pauschale = typ?.values?.find((v) => v.value === 'Meldegeldpauschale');

    expect(pauschale?.since).toBeUndefined();
  });

  /**
   * Was bleibt, ist die Dokumentation am Feld. Sie muss beide Lesarten nennen —
   * stünde dort nur die DSV8-Bedeutung, führte die Bibliothek jeden in die
   * Irre, der eine DSV7-Datei auswertet.
   */
  it('nennt in seiner Dokumentation beide Lesarten', () => {
    const typ = MELDEGELD.fields.find((f) => f.name === 'meldegeldTyp');
    const pauschale = typ?.values?.find((v) => v.value === 'Meldegeldpauschale');

    expect(pauschale?.doc).toMatch(/DSV7/);
    expect(pauschale?.doc).toMatch(/Meldung/);
    expect(pauschale?.doc).toMatch(/DSV8/);
    expect(pauschale?.doc).toMatch(/Verein/);
  });
});

describe('BANKVERBINDUNG.kontoinhaber — ab DSV8 vorhanden und Pflicht', () => {
  it('ist als Pflichtfeld ab DSV8 im Schema hinterlegt', () => {
    const feld = BANKVERBINDUNG.fields.find((f) => f.name === 'kontoinhaber');

    expect(feld?.since).toBe(8);
    expect(feld?.required).toBe(true);
  });

  it('nimmt die vollständige Bankverbindung in DSV8 an', () => {
    const result = parseWettkampfdefinitionsliste(mitBankverbindung(8, MIT_KONTOINHABER));

    expect(result.ok).toBe(true);
    expect(
      result.document.records.find((r) => r.element === 'BANKVERBINDUNG')?.values.kontoinhaber,
    ).toBe('SV Test');
  });

  it('nimmt die Bankverbindung ohne das Feld in DSV7 an', () => {
    const result = parseWettkampfdefinitionsliste(mitBankverbindung(7, OHNE_KONTOINHABER));

    expect(result.ok).toBe(true);
  });

  /**
   * Die Gegenprobe in beide Richtungen — der eigentliche Beweis, dass die
   * Versionsabhängigkeit trägt. Die Feldzahl ist im DSV-Standard exakt: Auch
   * ein optionales Attribut am Zeilenende braucht sein Trennzeichen. Ein
   * fehlendes wie ein überzähliges Feld fällt deshalb als
   * `unexpected-field-count` auf.
   */
  it('beanstandet eine DSV8-Datei ohne das Feld', () => {
    const result = parseWettkampfdefinitionsliste(mitBankverbindung(8, OHNE_KONTOINHABER));

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toContain('unexpected-field-count');
  });

  it('beanstandet eine DSV7-Datei mit dem Feld', () => {
    const result = parseWettkampfdefinitionsliste(mitBankverbindung(7, MIT_KONTOINHABER));

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toContain('unexpected-field-count');
  });

  /**
   * Vorhanden, aber leer ist im DSV-Standard dasselbe wie nicht vorhanden.
   * Weil das Feld ab DSV8 Pflicht ist, genügt das richtige Trennzeichen
   * allein nicht.
   */
  it('beanstandet eine DSV8-Datei mit leerem Feld', () => {
    const result = parseWettkampfdefinitionsliste(mitBankverbindung(8, [...OHNE_KONTOINHABER, '']));

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toContain('missing-required-field');
  });
});
