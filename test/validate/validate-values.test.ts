import { describe, expect, it } from 'vitest';
import type { DsvRecord } from '../../src/document/types.js';
import { element, field } from '../../src/schema/types.js';
import type { ElementDef } from '../../src/schema/types.js';
import {
  MELDEGELD,
  MELDESCHLUSS,
  PFLICHTZEIT,
  WERTUNG,
  WETTKAMPF,
} from '../../src/schema/wettkampfdefinitionsliste.js';
import { validateValues } from '../../src/validate/validate-values.js';
import type { FormatVersion } from '../../src/validate/validate-fields.js';

function record(element: string, fields: readonly string[], line = 1): DsvRecord {
  return {
    kind: 'element',
    element,
    fields,
    rawFields: fields,
    comment: null,
    bare: fields.length === 0,
    line,
    raw: `${element}:${fields.join(';')}`,
    eol: '\n',
  };
}

/** Setzt ein einzelnes Feld eines Elements und prüft nur dieses. */
function check(def: ElementDef, fieldName: string, value: string, version: FormatVersion = 8) {
  const fields = def.fields.map((f) => (f.name === fieldName ? value : ''));
  return validateValues(record(def.name, fields), def, version);
}

/** Baut ein Element mit einem einzigen Feld des gegebenen Typs. */
function single(def: ReturnType<typeof field>): ElementDef {
  return element('T', [def]);
}

describe('validateValues', () => {
  it('meldet nichts für ein gültiges Element', () => {
    expect(
      validateValues(record('MELDESCHLUSS', ['01.05.2026', '18:00']), MELDESCHLUSS, 8),
    ).toEqual([]);
  });

  it('überspringt leere Werte — die Pflichtprüfung hat sie behandelt', () => {
    expect(validateValues(record('MELDESCHLUSS', ['', '']), MELDESCHLUSS, 8)).toEqual([]);
  });

  it('meldet die Zeile des Records', () => {
    const diagnostics = validateValues(
      record('MELDESCHLUSS', ['kein Datum', '18:00'], 7),
      MELDESCHLUSS,
      8,
    );

    expect(diagnostics[0]?.start).toEqual({ line: 7, column: 1 });
  });

  describe('ZK', () => {
    const def = single(field('a', 'ZK', { doc: 'a', specRef: 'dsv8.md:1' }));

    it('akzeptiert jeden Wert', () => {
      expect(validateValues(record('T', ['irgendwas 123 !']), def, 8)).toEqual([]);
    });
  });

  describe('Zeichen', () => {
    const def = single(field('a', 'Zeichen', { doc: 'a', specRef: 'dsv8.md:1' }));

    it('akzeptiert genau ein Zeichen', () => {
      expect(validateValues(record('T', ['X']), def, 8)).toEqual([]);
    });

    it('weist mehr als ein Zeichen zurück', () => {
      expect(validateValues(record('T', ['XY']), def, 8).map((d) => d.code)).toEqual([
        'invalid-value',
      ]);
    });
  });

  describe('Zahl', () => {
    const def = single(field('a', 'Zahl', { doc: 'a', specRef: 'dsv8.md:1' }));

    it('akzeptiert Ziffernfolgen', () => {
      expect(validateValues(record('T', ['0']), def, 8)).toEqual([]);
      expect(validateValues(record('T', ['12345']), def, 8)).toEqual([]);
    });

    it('weist Vorzeichen, Dezimaltrennzeichen und Buchstaben zurück', () => {
      for (const bad of ['-1', '+1', '1,5', '1.5', 'abc', '1 2']) {
        expect(validateValues(record('T', [bad]), def, 8).map((d) => d.code)).toEqual([
          'invalid-value',
        ]);
      }
    });
  });

  describe('einzelstrecke', () => {
    it('akzeptiert 0 und 25000', () => {
      expect(check(WETTKAMPF, 'einzelstrecke', '0')).toEqual([]);
      expect(check(WETTKAMPF, 'einzelstrecke', '25000')).toEqual([]);
    });

    it('weist 25001 zurück', () => {
      const diagnostics = check(WETTKAMPF, 'einzelstrecke', '25001');

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.data).toMatchObject({ field: 'einzelstrecke', value: '25001' });
    });

    it('weist -1 und abc zurück', () => {
      expect(check(WETTKAMPF, 'einzelstrecke', '-1').map((d) => d.code)).toEqual(['invalid-value']);
      expect(check(WETTKAMPF, 'einzelstrecke', 'abc').map((d) => d.code)).toEqual([
        'invalid-value',
      ]);
    });
  });

  describe('Datum, Uhrzeit und Zeit', () => {
    it('akzeptiert gültige Angaben', () => {
      expect(check(MELDESCHLUSS, 'datum', '01.05.2026')).toEqual([]);
      expect(check(MELDESCHLUSS, 'uhrzeit', '18:00')).toEqual([]);
      expect(check(PFLICHTZEIT, 'pflichtzeit', '00:01:23,45')).toEqual([]);
    });

    it('weist ein ungültiges Datum zurück', () => {
      expect(check(MELDESCHLUSS, 'datum', '2026-05-01').map((d) => d.code)).toEqual([
        'invalid-value',
      ]);
      expect(check(MELDESCHLUSS, 'datum', '32.13.2026').map((d) => d.code)).toEqual([
        'invalid-value',
      ]);
    });

    it('weist eine ungültige Uhrzeit zurück', () => {
      expect(check(MELDESCHLUSS, 'uhrzeit', '25:00').map((d) => d.code)).toEqual(['invalid-value']);
    });

    it('weist eine ungültige Zeit zurück', () => {
      expect(check(PFLICHTZEIT, 'pflichtzeit', '1:23,45').map((d) => d.code)).toEqual([
        'invalid-value',
      ]);
    });
  });

  describe('Betrag', () => {
    it('akzeptiert Ziffern mit zwei Nachkommastellen', () => {
      expect(check(MELDEGELD, 'betrag', '10,00')).toEqual([]);
      expect(check(MELDEGELD, 'betrag', '0,50')).toEqual([]);
    });

    it('weist andere Schreibweisen zurück', () => {
      for (const bad of ['10', '10,0', '10,000', '10.00', '-1,00', 'abc']) {
        expect(check(MELDEGELD, 'betrag', bad).map((d) => d.code)).toEqual(['invalid-value']);
      }
    });
  });

  describe('JGAK', () => {
    it('akzeptiert Jahrgänge, Altersklassenbuchstaben und Masters-Staffeln', () => {
      for (const good of ['1990', '0', '25', 'A', 'B', 'C', 'D', 'E', 'J', '100+', '25+']) {
        expect(check(WERTUNG, 'mindestJgAk', good)).toEqual([]);
      }
    });

    it('weist ungültige Formen zurück', () => {
      for (const bad of ['19900', 'Z', '1+', 'AB', '+100', '19.90']) {
        expect(check(WERTUNG, 'mindestJgAk', bad).map((d) => d.code)).toEqual(['invalid-value']);
      }
    });
  });

  describe('Aufzählungswerte', () => {
    it('akzeptiert einen Wert aus der Werteliste', () => {
      expect(check(WETTKAMPF, 'technik', 'F')).toEqual([]);
    });

    it('meldet einen Wert ausserhalb der Werteliste', () => {
      const diagnostics = check(WETTKAMPF, 'technik', 'Q');

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-enum-value']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({ field: 'technik', value: 'Q' });
    });

    it('vergleicht strikt, wenn das Feld nicht caseInsensitive ist', () => {
      expect(check(WETTKAMPF, 'technik', 'f').map((d) => d.code)).toEqual(['invalid-enum-value']);
    });

    it('vergleicht ohne Rücksicht auf Gross-/Kleinschreibung bei caseInsensitive', () => {
      expect(check(MELDEGELD, 'meldegeldTyp', 'MELDEGELDPAUSCHALE')).toEqual([]);
      expect(check(MELDEGELD, 'meldegeldTyp', 'Meldegeldpauschale')).toEqual([]);
    });

    it('nutzt den Wertevorrat des jeweiligen Feldes, nicht den eines gleichnamigen', () => {
      expect(check(WETTKAMPF, 'geschlecht', 'X')).toEqual([]);
      expect(check(PFLICHTZEIT, 'geschlecht', 'X').map((d) => d.code)).toEqual([
        'invalid-enum-value',
      ]);
    });

    describe('Versionsabhängigkeit der Werte', () => {
      it('erlaubt geschlecht D nur ab DSV8', () => {
        expect(check(WETTKAMPF, 'geschlecht', 'D', 8)).toEqual([]);
        expect(check(WETTKAMPF, 'geschlecht', 'D', 7).map((d) => d.code)).toEqual([
          'invalid-enum-value',
        ]);
      });

      it('erlaubt ausuebung KB nur ab DSV8', () => {
        expect(check(WETTKAMPF, 'ausuebung', 'KB', 8)).toEqual([]);
        expect(check(WETTKAMPF, 'ausuebung', 'KB', 7).map((d) => d.code)).toEqual([
          'invalid-enum-value',
        ]);
      });

      it('erlaubt Teilnehmermeldegeld nur ab DSV8', () => {
        expect(check(MELDEGELD, 'meldegeldTyp', 'Teilnehmermeldegeld', 8)).toEqual([]);
        expect(
          check(MELDEGELD, 'meldegeldTyp', 'Teilnehmermeldegeld', 7).map((d) => d.code),
        ).toEqual(['invalid-enum-value']);
      });

      it('prüft in DSV7 kein Feld, das es dort nicht gibt', () => {
        expect(
          validateValues(
            record('T', ['XY']),
            single(field('a', 'Zeichen', { since: 8, doc: 'a', specRef: 'dsv8.md:1' })),
            7,
          ),
        ).toEqual([]);
      });
    });
  });
});
