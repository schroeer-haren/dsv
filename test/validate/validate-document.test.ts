import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../../src/schema/wettkampfdefinitionsliste.js';
import type { ListSchema } from '../../src/schema/list-schema.js';
import { VEREINSERGEBNISLISTE } from '../../src/schema/vereinsergebnisliste.js';
import { VEREINSMELDELISTE } from '../../src/schema/vereinsmeldeliste.js';
import { WETTKAMPFERGEBNISLISTE } from '../../src/schema/wettkampfergebnisliste.js';
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

      // Die Querregel greift trotz fremder Schreibweise; die Schreibweise
      // selbst wird zusaetzlich als Abweichung gemeldet.
      expect(validate(lines).map((d) => d.code)).toEqual([
        'invalid-enum-value',
        'conditional-field-required',
      ]);
    });

    it('verlangt bei anderen Meldegeldtypen keine Wettkampfnummer', () => {
      expect(validate(minimal(8))).toEqual([]);
    });
  });

  describe('Kicks nur bei Schmetterling', () => {
    const wettkampf = (technik: string, ausuebung: string): string[] => [
      '1',
      'E',
      '1',
      '1',
      '50',
      technik,
      ausuebung,
      'M',
      'SW',
      '',
      '',
    ];

    it.each(['KB', 'KR'])('akzeptiert %s bei Technik S', (ausuebung) => {
      expect(validate(replace(minimal(8), 'WETTKAMPF', wettkampf('S', ausuebung)))).toEqual([]);
    });

    it.each(['KB', 'KR'])('meldet %s bei Technik F', (ausuebung) => {
      const diagnostics = validate(replace(minimal(8), 'WETTKAMPF', wettkampf('F', ausuebung)));

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({
        field: 'ausuebung',
        value: ausuebung,
        technik: 'F',
      });
    });

    it.each(['F', 'R', 'B', 'S', 'L', 'X'])('akzeptiert GL bei Technik %s', (technik) => {
      expect(validate(replace(minimal(8), 'WETTKAMPF', wettkampf(technik, 'GL')))).toEqual([]);
    });
  });

  describe('Qualifikationswettkampf bei Zwischenlauf und Finale', () => {
    const wettkampf = (art: string, qualifikationsnr: string): string[] => [
      '2',
      art,
      '1',
      '1',
      '50',
      'F',
      'GL',
      'M',
      'SW',
      qualifikationsnr,
      qualifikationsnr === '' ? '' : 'V',
    ];

    // Nur eine Warnung: 22 der 67 Zwischenläufe und Finals in
    // test/fixtures/real lassen das Feld leer, siehe validate-document.ts.
    it.each(['Z', 'F'])('warnt bei Wettkampfart %s ohne Qualifikationswettkampfnr', (art) => {
      const diagnostics = validate(replace(minimal(8), 'WETTKAMPF', wettkampf(art, '')));

      expect(diagnostics.map((d) => d.code)).toEqual(['conditional-field-required']);
      expect(diagnostics[0]?.severity).toBe('warning');
      expect(diagnostics[0]?.data).toMatchObject({
        element: 'WETTKAMPF',
        field: 'qualifikationswettkampfnr',
        condition: art,
      });
    });

    it.each(['Z', 'F'])('akzeptiert Wettkampfart %s mit Qualifikationswettkampfnr', (art) => {
      expect(validate(replace(minimal(8), 'WETTKAMPF', wettkampf(art, '1')))).toEqual([]);
    });

    it.each(['V', 'E'])('verlangt bei Wettkampfart %s keine Qualifikationswettkampfnr', (art) => {
      expect(validate(replace(minimal(8), 'WETTKAMPF', wettkampf(art, '')))).toEqual([]);
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

      expect(validate(lines)[0]?.line).toBe(9);
    });
  });
});

/** Die Zeilen einer vollständigen, gültigen Minimal-Ergebnisliste. */
function minimalErgebnis(version: 7 | 8 = 8): string[] {
  return [
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
  ];
}

/** Validiert eine Ergebnisliste aus den gegebenen Zeilen. */
function validateErgebnis(lines: readonly string[]) {
  const { document } = parseDsv(`${lines.join('\n')}\n`);
  return validateDocument(document, WETTKAMPFERGEBNISLISTE);
}

/** Ein PNERGEBNIS mit gegebenem Platz und Grund der Nichtwertung. */
function pnergebnis(platz: string, grund: string): string {
  return line('PNERGEBNIS', [
    '1',
    'E',
    '1',
    platz,
    grund,
    'Mustermann, Max',
    '123456',
    '1',
    'M',
    '2010',
    '',
    'SV Test',
    '1234',
    '00:00:30,00',
    '',
    '',
    '',
    '',
    '',
  ]);
}

/** Ein STERGEBNIS mit gegebenem Platz und Grund der Nichtwertung. */
function stergebnis(platz: string, grund: string): string {
  return line('STERGEBNIS', [
    '1',
    'E',
    '1',
    platz,
    grund,
    '1',
    '1',
    'SV Test',
    '1234',
    '00:02:00,00',
    '',
    '',
    '',
  ]);
}

describe('validateDocument für die Wettkampfergebnisliste', () => {
  it('meldet für eine vollständige Minimalliste gar nichts', () => {
    expect(validateErgebnis(minimalErgebnis(8))).toEqual([]);
    expect(validateErgebnis(minimalErgebnis(7))).toEqual([]);
  });

  it('lehnt eine DSV6-Ergebnisliste fatal ab', () => {
    const lines = replace(minimalErgebnis(), 'FORMAT', ['Wettkampfergebnisliste', '6']);

    expect(validateErgebnis(lines).map((d) => d.severity)).toEqual(['fatal']);
  });

  describe('Kicks nur bei Schmetterling', () => {
    it('greift auch in der Ergebnisliste', () => {
      const lines = replace(minimalErgebnis(8), 'WETTKAMPF', [
        '1',
        'E',
        '1',
        '1',
        '50',
        'F',
        'KB',
        'M',
        'SW',
        '',
        '',
      ]);

      expect(validateErgebnis(lines).map((d) => d.code)).toEqual(['invalid-value']);
    });
  });

  describe('Platz 0 bei Nichtwertung', () => {
    it.each(['PNERGEBNIS', 'STERGEBNIS'])('akzeptiert Platz 0 mit Grund in %s', (element) => {
      const record = element === 'PNERGEBNIS' ? pnergebnis('0', 'DS') : stergebnis('0', 'DS');

      expect(validateErgebnis([...minimalErgebnis(), record])).toEqual([]);
    });

    it.each(['PNERGEBNIS', 'STERGEBNIS'])('akzeptiert einen Platz ohne Grund in %s', (element) => {
      const record = element === 'PNERGEBNIS' ? pnergebnis('3', '') : stergebnis('3', '');

      expect(validateErgebnis([...minimalErgebnis(), record])).toEqual([]);
    });

    it.each(['PNERGEBNIS', 'STERGEBNIS'])('meldet Platz ungleich 0 mit Grund in %s', (element) => {
      const record = element === 'PNERGEBNIS' ? pnergebnis('3', 'DS') : stergebnis('3', 'DS');
      const diagnostics = validateErgebnis([...minimalErgebnis(), record]);

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({
        element,
        field: 'platz',
        value: '3',
        grundDerNichtwertung: 'DS',
      });
    });

    // Verlangt ist die Ziffer 0, nicht „irgendetwas Nullartiges": Ein leerer
    // Platz ist keine 0, und `01` ist eine Platzierung, die nur so anfängt.
    it.each(['PNERGEBNIS', 'STERGEBNIS'])(
      'meldet einen leeren Platz mit Grund in %s',
      (element) => {
        const record = element === 'PNERGEBNIS' ? pnergebnis('', 'DS') : stergebnis('', 'DS');
        const diagnostics = validateErgebnis([...minimalErgebnis(), record]);

        expect(diagnostics.map((d) => d.code)).toContain('invalid-value');
        expect(diagnostics.find((d) => d.code === 'invalid-value')?.data).toMatchObject({
          element,
          field: 'platz',
          value: '',
          grundDerNichtwertung: 'DS',
        });
      },
    );

    it.each(['PNERGEBNIS', 'STERGEBNIS'])('meldet Platz 01 mit Grund in %s', (element) => {
      const record = element === 'PNERGEBNIS' ? pnergebnis('01', 'DS') : stergebnis('01', 'DS');
      const diagnostics = validateErgebnis([...minimalErgebnis(), record]);

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.data).toMatchObject({
        element,
        field: 'platz',
        value: '01',
        grundDerNichtwertung: 'DS',
      });
    });
  });
});

/** Die Zeilen einer vollständigen, gültigen Minimal-Vereinsmeldeliste. */
function minimalVereinsmeldung(): string[] {
  return [
    line('FORMAT', ['Vereinsmeldeliste', '8']),
    line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
    line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
    line('ABSCHNITT', ['1', '10.05.2026', '09:00', '']),
    line('WETTKAMPF', ['1', 'V', '1', '', '100', 'F', 'GL', 'W', '', '']),
    line('VEREIN', ['SV Test', '1234', '5', 'GER', '']),
    line('ANSPRECHPARTNER', ['Muster, Mia', '', '', '', '', '', '', 'info@example.org']),
    'DATEIENDE',
  ];
}

/** Die Zeilen einer vollständigen, gültigen Minimal-Vereinsergebnisliste. */
function minimalVereinsergebnis(): string[] {
  return [
    line('FORMAT', ['Vereinsergebnisliste', '8']),
    line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
    line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
    line('VERANSTALTER', ['Schwimmverband Musterland']),
    line('AUSRICHTER', ['SV Test', 'Muster, Mia', '', '', '', '', '', '', 'info@example.org']),
    line('ABSCHNITT', ['1', '10.05.2026', '09:00', 'N']),
    line('WETTKAMPF', ['1', 'V', '1', '1', '100', 'F', 'GL', 'W', 'SW', '', '']),
    line('WERTUNG', ['1', 'V', '1', 'JG', '0', '9999', '', 'Offene Wertung']),
    line('VEREIN', ['SV Test', '1234', '5', 'GER']),
    'DATEIENDE',
  ];
}

/** Validiert eine Liste aus den gegebenen Zeilen gegen das gegebene Schema. */
function validateWith(schema: ListSchema, lines: readonly string[]) {
  const { document } = parseDsv(`${lines.join('\n')}\n`);
  return validateDocument(document, schema);
}

/** Ein PERSONENERGEBNIS mit gegebenem Platz und Grund der Nichtwertung. */
function personenergebnis(platz: string, grund: string): string {
  return line('PERSONENERGEBNIS', ['9001', '1', 'V', '1', platz, '00:01:05,00', grund, '', '']);
}

/** Ein STAFFELERGEBNIS mit gegebenem Platz und Grund der Nichtwertung. */
function staffelergebnis(platz: string, grund: string): string {
  return line('STAFFELERGEBNIS', ['8001', '1', 'V', '1', platz, '00:04:05,00', grund, '', '', '']);
}

describe('Querregeln greifen listenartunabhängig', () => {
  describe('Kicks nur bei Schmetterling', () => {
    /** WETTKAMPF der Vereinsmeldeliste — ein Feld kürzer als in den anderen Listen. */
    const meldungWettkampf = (technik: string, ausuebung: string): string[] => [
      '1',
      'V',
      '1',
      '',
      '100',
      technik,
      ausuebung,
      'W',
      '',
      '',
    ];

    const ergebnisWettkampf = (technik: string, ausuebung: string): string[] => [
      '1',
      'V',
      '1',
      '1',
      '100',
      technik,
      ausuebung,
      'W',
      'SW',
      '',
      '',
    ];

    it.each(['KB', 'KR'])('meldet %s bei Technik F in der Vereinsmeldeliste', (ausuebung) => {
      const lines = replace(minimalVereinsmeldung(), 'WETTKAMPF', meldungWettkampf('F', ausuebung));
      const diagnostics = validateWith(VEREINSMELDELISTE, lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.data).toMatchObject({ field: 'ausuebung', value: ausuebung });
    });

    it.each(['KB', 'KR'])('meldet %s bei Technik F in der Vereinsergebnisliste', (ausuebung) => {
      const lines = replace(
        minimalVereinsergebnis(),
        'WETTKAMPF',
        ergebnisWettkampf('F', ausuebung),
      );
      const diagnostics = validateWith(VEREINSERGEBNISLISTE, lines);

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.data).toMatchObject({ field: 'ausuebung', value: ausuebung });
    });

    it('akzeptiert KB bei Technik S in beiden Vereinslisten', () => {
      expect(
        validateWith(
          VEREINSMELDELISTE,
          replace(minimalVereinsmeldung(), 'WETTKAMPF', meldungWettkampf('S', 'KB')),
        ),
      ).toEqual([]);
      expect(
        validateWith(
          VEREINSERGEBNISLISTE,
          replace(minimalVereinsergebnis(), 'WETTKAMPF', ergebnisWettkampf('S', 'KB')),
        ),
      ).toEqual([]);
    });
  });

  describe('Qualifikationswettkampf bei Zwischenlauf und Finale', () => {
    /**
     * Die Regel beschreibt den Ergebnisfall und ist deshalb an die Listenarten
     * gebunden, die eine gelaufene Veranstaltung abbilden. Die Vereinsmeldeliste
     * entsteht vor der Veranstaltung — dort kann sich niemand qualifiziert
     * haben, siehe validate-document.ts und docs/architecture.md.
     */
    it.each(['Z', 'F'])(
      'verlangt in der Vereinsmeldeliste bei Wettkampfart %s keinen Qualifikationswettkampf',
      (art) => {
        const lines = replace(minimalVereinsmeldung(), 'WETTKAMPF', [
          '2',
          art,
          '1',
          '',
          '100',
          'F',
          'GL',
          'W',
          '',
          '',
        ]);

        expect(validateWith(VEREINSMELDELISTE, lines)).toEqual([]);
      },
    );

    it.each(['Z', 'F'])(
      'meldet den fehlenden Qualifikationswettkampf bei Wettkampfart %s in der Vereinsergebnisliste',
      (art) => {
        const lines = replace(minimalVereinsergebnis(), 'WETTKAMPF', [
          '1',
          art,
          '1',
          '1',
          '100',
          'F',
          'GL',
          'W',
          'SW',
          '',
          '',
        ]);
        const diagnostics = validateWith(VEREINSERGEBNISLISTE, lines);

        expect(diagnostics.map((d) => d.code)).toEqual(['conditional-field-required']);
        expect(diagnostics[0]?.severity).toBe('warning');
        expect(diagnostics[0]?.data).toMatchObject({
          element: 'WETTKAMPF',
          field: 'qualifikationswettkampfnr',
          condition: art,
        });
      },
    );

    it('schweigt, wenn die Vereinsergebnisliste den Qualifikationswettkampf nennt', () => {
      const lines = replace(minimalVereinsergebnis(), 'WETTKAMPF', [
        '1',
        'F',
        '1',
        '1',
        '100',
        'F',
        'GL',
        'W',
        'SW',
        '1',
        'V',
      ]);

      expect(validateWith(VEREINSERGEBNISLISTE, lines)).toEqual([]);
    });
  });

  describe('Platz 0 bei Nichtwertung in der Vereinsergebnisliste', () => {
    const person = line('PERSON', [
      'Mustermann, Maxi',
      '123456',
      '9001',
      'W',
      '2010',
      '',
      'GER',
      '',
      '',
    ]);
    const staffel = line('STAFFEL', ['1', '8001', 'JG', '0', '9999']);

    it.each([
      ['PERSONENERGEBNIS', personenergebnis('0', 'DS')],
      ['STAFFELERGEBNIS', staffelergebnis('0', 'DS')],
    ])('akzeptiert Platz 0 mit Grund in %s', (_element, record) => {
      expect(
        validateWith(VEREINSERGEBNISLISTE, [...minimalVereinsergebnis(), person, staffel, record]),
      ).toEqual([]);
    });

    it.each([
      ['PERSONENERGEBNIS', personenergebnis('3', '')],
      ['STAFFELERGEBNIS', staffelergebnis('3', '')],
    ])('akzeptiert einen Platz ohne Grund in %s', (_element, record) => {
      expect(
        validateWith(VEREINSERGEBNISLISTE, [...minimalVereinsergebnis(), person, staffel, record]),
      ).toEqual([]);
    });

    it.each([
      ['PERSONENERGEBNIS', personenergebnis('3', 'DS')],
      ['STAFFELERGEBNIS', staffelergebnis('3', 'DS')],
    ])('meldet Platz ungleich 0 mit Grund in %s', (element, record) => {
      const diagnostics = validateWith(VEREINSERGEBNISLISTE, [
        ...minimalVereinsergebnis(),
        person,
        staffel,
        record,
      ]);

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.severity).toBe('error');
      expect(diagnostics[0]?.data).toMatchObject({
        element,
        field: 'platz',
        value: '3',
        grundDerNichtwertung: 'DS',
      });
    });

    // Wie in der Wettkampfergebnisliste: Verlangt ist die Ziffer 0.
    it.each([
      ['PERSONENERGEBNIS', personenergebnis('', 'DS')],
      ['STAFFELERGEBNIS', staffelergebnis('', 'DS')],
    ])('meldet einen leeren Platz mit Grund in %s', (element, record) => {
      const diagnostics = validateWith(VEREINSERGEBNISLISTE, [
        ...minimalVereinsergebnis(),
        person,
        staffel,
        record,
      ]);

      expect(diagnostics.map((d) => d.code)).toContain('invalid-value');
      expect(diagnostics.find((d) => d.code === 'invalid-value')?.data).toMatchObject({
        element,
        field: 'platz',
        value: '',
        grundDerNichtwertung: 'DS',
      });
    });

    it.each([
      ['PERSONENERGEBNIS', personenergebnis('01', 'DS')],
      ['STAFFELERGEBNIS', staffelergebnis('01', 'DS')],
    ])('meldet Platz 01 mit Grund in %s', (element, record) => {
      const diagnostics = validateWith(VEREINSERGEBNISLISTE, [
        ...minimalVereinsergebnis(),
        person,
        staffel,
        record,
      ]);

      expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
      expect(diagnostics[0]?.data).toMatchObject({
        element,
        field: 'platz',
        value: '01',
        grundDerNichtwertung: 'DS',
      });
    });
  });

  describe('Listenarten ohne Ergebnisfelder', () => {
    it('meldet in der Wettkampfdefinitionsliste keine Nichtwertungsbefunde', () => {
      expect(validate(minimal(8))).toEqual([]);
    });

    it('meldet in der Vereinsmeldeliste keine Nichtwertungsbefunde', () => {
      expect(validateWith(VEREINSMELDELISTE, minimalVereinsmeldung())).toEqual([]);
    });
  });
});

describe('Gemischte Wettkämpfe gehören in die Standard-Bestenliste', () => {
  /** WETTKAMPF der Listenarten mit `zuordnungBestenliste` — elf Felder. */
  const wettkampf = (geschlecht: string, zuordnung: string): string[] => [
    '1',
    'V',
    '1',
    '1',
    '100',
    'F',
    'GL',
    geschlecht,
    zuordnung,
    '',
    '',
  ];

  it.each([
    ['Wettkampfdefinitionsliste', WETTKAMPFDEFINITIONSLISTE, minimal(8)],
    ['Vereinsergebnisliste', VEREINSERGEBNISLISTE, minimalVereinsergebnis()],
  ])('meldet Geschlecht X mit anderer Zuordnung als SW in der %s', (_name, schema, lines) => {
    const diagnostics = validateWith(
      schema,
      replace([...lines], 'WETTKAMPF', wettkampf('X', 'EW')),
    );

    expect(diagnostics.map((d) => d.code)).toEqual(['invalid-value']);
    expect(diagnostics[0]?.severity).toBe('warning');
    expect(diagnostics[0]?.data).toMatchObject({
      field: 'zuordnungBestenliste',
      value: 'EW',
      geschlecht: 'X',
    });
  });

  it('akzeptiert Geschlecht X mit SW', () => {
    expect(
      validateWith(
        VEREINSERGEBNISLISTE,
        replace(minimalVereinsergebnis(), 'WETTKAMPF', wettkampf('X', 'SW')),
      ),
    ).toEqual([]);
  });

  it.each(['M', 'W', 'D'])('lässt Zuordnung EW bei Geschlecht %s unberührt', (geschlecht) => {
    expect(
      validateWith(
        VEREINSERGEBNISLISTE,
        replace(minimalVereinsergebnis(), 'WETTKAMPF', wettkampf(geschlecht, 'EW')),
      ),
    ).toEqual([]);
  });

  it('greift in der Vereinsmeldeliste nicht, weil dort die Zuordnung fehlt', () => {
    expect(validateWith(VEREINSMELDELISTE, minimalVereinsmeldung())).toEqual([]);
  });
});
