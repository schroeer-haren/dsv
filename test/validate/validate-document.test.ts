import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../../src/schema/wettkampfdefinitionsliste.js';
import { validateDocument } from '../../src/validate/validate-document.js';

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

/** Validiert ein Dokument aus den gegebenen Zeilen. */
function validate(lines: readonly string[]) {
  const { document } = parseDsv(`${lines.join('\n')}\n`);
  return validateDocument(document, WETTKAMPFDEFINITIONSLISTE);
}

/** Entfernt alle Zeilen des Elements. */
function without(element: string, lines = minimal()): string[] {
  return lines.filter((l) => !l.startsWith(element));
}

/** Ersetzt die Zeile des Elements durch eine mit den gegebenen Feldern. */
function replace(lines: string[], element: string, fields: readonly string[]): string[] {
  return lines.map((l) => (l.startsWith(`${element}:`) ? line(element, fields) : l));
}

describe('validateDocument', () => {
  it('meldet für ein vollständiges Minimaldokument gar nichts', () => {
    expect(validate(minimal(8))).toEqual([]);
  });

  it('meldet auch für dasselbe Dokument als DSV7 gar nichts', () => {
    expect(validate(minimal(7))).toEqual([]);
  });

  describe('Formatversion', () => {
    it('lehnt ein DSV6-Dokument fatal ab', () => {
      const diagnostics = validate(minimal(6));

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]?.code).toBe('unsupported-format-version');
      expect(diagnostics[0]?.severity).toBe('fatal');
      expect(diagnostics[0]?.data).toMatchObject({ version: 6 });
    });

    it('lehnt ein Dokument ohne lesbare Version fatal ab', () => {
      const lines = minimal();
      lines[0] = line('FORMAT', ['Wettkampfdefinitionsliste', 'acht']);

      expect(validate(lines).map((d) => d.code)).toEqual(['unsupported-format-version']);
    });
  });

  describe('Kardinalitäten', () => {
    it('meldet ein fehlendes Pflichtelement', () => {
      const diagnostics = validate(without('MELDESCHLUSS'));

      expect(diagnostics.map((d) => d.code)).toEqual(['cardinality-violation']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toEqual({
        element: 'MELDESCHLUSS',
        min: 1,
        max: 1,
        actual: 0,
      });
    });

    it('meldet ein doppeltes Element mit Höchstzahl 1', () => {
      const lines = [...minimal()];
      lines.splice(9, 0, line('MELDESCHLUSS', ['02.05.2026', '18:00']));

      const diagnostics = validate(lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['cardinality-violation']);
      expect(diagnostics[0]?.data).toEqual({
        element: 'MELDESCHLUSS',
        min: 1,
        max: 1,
        actual: 2,
      });
    });

    it('erlaubt mehrfache Elemente ohne Höchstzahl', () => {
      const lines = [...minimal()];
      lines.splice(11, 0, line('ABSCHNITT', ['2', '11.05.2026', '', '', '09:00', '']));

      expect(validate(lines)).toEqual([]);
    });

    it('meldet ein Element, das nicht zur Listenart gehört', () => {
      const lines = [...minimal()];
      lines.splice(12, 0, line('KAMPFRICHTER', ['Test']));

      const diagnostics = validate(lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['unknown-element']);
      expect(diagnostics[0]?.data).toMatchObject({ element: 'KAMPFRICHTER' });
    });
  });

  describe('Elemente, die es erst ab DSV8 gibt', () => {
    it('erlaubt LASTSCHRIFT in DSV8', () => {
      const lines = without('BANKVERBINDUNG', minimal(8));
      lines.splice(9, 0, line('LASTSCHRIFT', ['J']));

      expect(validate(lines)).toEqual([]);
    });

    it('meldet LASTSCHRIFT in DSV7 als unbekanntes Element', () => {
      const lines = minimal(7);
      lines.splice(9, 0, line('LASTSCHRIFT', ['J']));

      const diagnostics = validate(lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['unknown-element']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({ element: 'LASTSCHRIFT' });
    });
  });

  describe('LASTSCHRIFT und BANKVERBINDUNG', () => {
    it('erlaubt BANKVERBINDUNG allein', () => {
      const lines = minimal(8);
      lines.splice(9, 0, line('BANKVERBINDUNG', ['Sparkasse', 'DE02', 'BYLA', 'SV Test']));

      expect(validate(lines)).toEqual([]);
    });

    it('meldet beide zusammen als sich ausschliessend', () => {
      const lines = minimal(8);
      lines.splice(9, 0, line('BANKVERBINDUNG', ['Sparkasse', 'DE02', 'BYLA', 'SV Test']));
      lines.splice(10, 0, line('LASTSCHRIFT', ['J']));

      const diagnostics = validate(lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['mutually-exclusive-elements']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({ elements: ['LASTSCHRIFT', 'BANKVERBINDUNG'] });
    });
  });

  describe('Wkmeldegeld', () => {
    it('meldet ein Wkmeldegeld ohne Wettkampfnummer', () => {
      const lines = without('MELDEGELD');
      lines.splice(12, 0, line('MELDEGELD', ['Wkmeldegeld', '5,00', '']));

      const diagnostics = validate(lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['conditional-field-required']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({ field: 'wettkampfnr' });
    });

    it('akzeptiert ein Wkmeldegeld mit Wettkampfnummer', () => {
      const lines = without('MELDEGELD');
      lines.splice(12, 0, line('MELDEGELD', ['Wkmeldegeld', '5,00', '1']));

      expect(validate(lines)).toEqual([]);
    });

    it('prüft den Typ ohne Rücksicht auf Gross-/Kleinschreibung', () => {
      const lines = without('MELDEGELD');
      lines.splice(12, 0, line('MELDEGELD', ['WKMELDEGELD', '5,00', '']));

      expect(validate(lines).map((d) => d.code)).toEqual(['conditional-field-required']);
    });

    it('verlangt bei anderen Meldegeldtypen keine Wettkampfnummer', () => {
      expect(validate(minimal(8))).toEqual([]);
    });
  });

  describe('Feld- und Wertprüfungen je Record', () => {
    it('führt die Feldanzahlprüfung mit', () => {
      const lines = replace(minimal(), 'MELDESCHLUSS', ['01.05.2026']);

      expect(validate(lines).map((d) => d.code)).toEqual(['unexpected-field-count']);
    });

    it('führt die Pflichtfeldprüfung mit', () => {
      const lines = replace(minimal(), 'MELDESCHLUSS', ['', '18:00']);

      expect(validate(lines).map((d) => d.code)).toEqual(['missing-required-field']);
    });

    it('führt die Wertprüfung mit', () => {
      const lines = replace(minimal(), 'MELDESCHLUSS', ['31.13.2026', '18:00']);

      expect(validate(lines).map((d) => d.code)).toEqual(['invalid-value']);
    });

    it('führt die Wertelistenprüfung versionsabhängig mit', () => {
      const divers = ['1', 'E', '1', '1', '50', 'F', 'GL', 'D', 'SW', '', ''];

      expect(validate(replace(minimal(8), 'WETTKAMPF', divers))).toEqual([]);
      expect(validate(replace(minimal(7), 'WETTKAMPF', divers)).map((d) => d.code)).toEqual([
        'invalid-enum-value',
      ]);
    });

    it('meldet den Befund an der Zeile des Records', () => {
      const lines = replace(minimal(), 'MELDESCHLUSS', ['31.13.2026', '18:00']);

      expect(validate(lines)[0]?.start.line).toBe(9);
    });
  });
});
