import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TypedRecord } from '../../src/parse/parse-typed-list.js';
import { parseWettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';
import { DsvWriteError } from '../../src/write/write-typed-list.js';
import { writeWettkampfergebnisliste } from '../../src/write/write-wettkampfergebnisliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

/** Die Zeilen einer vollständigen, gültigen Minimalliste in DSV7. */
function minimal(): string[] {
  return [
    line('FORMAT', ['Wettkampfergebnisliste', '7']),
    line('ERZEUGER', ['Testsoftware', '1.0', 'info@example.org']),
    line('VERANSTALTUNG', ['Testwettkampf', 'Kiel', '25', 'HANDZEIT']),
    line('VERANSTALTER', ['SV Test']),
    line('AUSRICHTER', ['SV Test', 'Max Mustermann', '', '', '', '', '', '', 'info@example.org']),
    line('ABSCHNITT', ['1', '10.05.2026', '09:00', '']),
    line('KAMPFGERICHT', ['1', 'SCH', 'Muster, Erika', 'SV Test']),
    line('WETTKAMPF', ['1', 'E', '1', '1', '50', 'F', 'GL', 'M', 'SW', '', '']),
    line('WERTUNG', ['1', 'E', '1', 'JG', '2010', '', '', 'offene Wertung']),
    line('VEREIN', ['SV Test', '1234', '10', 'GER']),
    line('PNERGEBNIS', [
      '1',
      'E',
      '1',
      '1',
      '',
      'Muster, Max',
      '100001',
      '1',
      'M',
      '2010',
      '',
      'SV Test',
      '1234',
      '00:00:28,15',
      '',
      '',
      'GER',
      '',
      '',
    ]),
    line('PNZWISCHENZEIT', ['1', '1', 'E', '25', '00:00:13,50']),
    line('PNREAKTION', ['1', '1', 'E', '+', '00:00:00,70']),
    'DATEIENDE',
  ];
}

/** Die typisierten Records einer Minimalliste. */
function minimalRecords(): readonly TypedRecord[] {
  const result = parseWettkampfergebnisliste(`${minimal().join('\r\n')}\r\n`);
  expect(result.diagnostics).toEqual([]);
  return result.document.records;
}

/** Ersetzt in einem Record einen Feldwert. */
function withValue(
  records: readonly TypedRecord[],
  element: string,
  field: string,
  value: string,
): TypedRecord[] {
  return records.map((r) =>
    r.element === element ? { ...r, values: { ...r.values, [field]: value } } : r,
  );
}

/** Vergleichbare Gestalt eines Records — ohne Zeilennummer. */
const shape = (records: readonly TypedRecord[]): unknown[] =>
  records.map((r) => ({ element: r.element, values: r.values }));

describe('writeWettkampfergebnisliste', () => {
  it('schreibt kanonisch: kein Leerzeichen nach dem Doppelpunkt, jedes Feld terminiert', () => {
    const text = writeWettkampfergebnisliste(minimalRecords());

    expect(text.startsWith('FORMAT:Wettkampfergebnisliste;7;\r\n')).toBe(true);
    expect(text).toContain('VEREIN:SV Test;1234;10;GER;\r\n');
    expect(text.endsWith('DATEIENDE\r\n')).toBe(true);
    expect(text).not.toContain(': ');
  });

  it('schreibt standardmässig CRLF und auf Wunsch LF', () => {
    expect(writeWettkampfergebnisliste(minimalRecords())).toContain('\r\n');

    const lf = writeWettkampfergebnisliste(minimalRecords(), { eol: '\n' });
    expect(lf).not.toContain('\r');
    expect(lf.endsWith('DATEIENDE\n')).toBe(true);
  });

  it('gibt options.version den Vorrang vor dem FORMAT-Record', () => {
    const records = withValue(minimalRecords(), 'FORMAT', 'version', '');
    const text = writeWettkampfergebnisliste(records, { version: 8 });

    expect(text.startsWith('FORMAT:Wettkampfergebnisliste;8;\r\n')).toBe(true);
    expect(parseWettkampfergebnisliste(text).document.version).toBe(8);
  });

  it('trimmt jeden Feldwert', () => {
    const records = withValue(minimalRecords(), 'VERANSTALTUNG', 'veranstaltungsort', '  Kiel  ');
    const text = writeWettkampfergebnisliste(records);

    expect(text).toContain('VERANSTALTUNG:Testwettkampf;Kiel;25;HANDZEIT;\r\n');
  });

  it('wirft bei dem tolerierten Aufzählungswert SPR', () => {
    // Die Spezifikation kennt für die Sprecherin nur SP; ihr eigenes Beispiel
    // und eine echte Datei schreiben SPR. Beim Lesen Warnung, beim Schreiben
    // unzulässig — die Bibliothek liefert nur aus, was der Spec entspricht.
    const records = withValue(minimalRecords(), 'KAMPFGERICHT', 'position', 'SPR');

    const read = parseWettkampfergebnisliste(
      `${minimal().join('\r\n').replace('KAMPFGERICHT:1;SCH;', 'KAMPFGERICHT:1;SPR;')}\r\n`,
    );
    expect(read.ok).toBe(true);
    expect(read.diagnostics.some((d) => d.data?.['tolerated'] === true)).toBe(true);

    expect(() => writeWettkampfergebnisliste(records)).toThrow(/tolerated|not specified/i);
  });

  it('wirft bei einem fehlenden Pflichtfeld', () => {
    const records = withValue(minimalRecords(), 'PNERGEBNIS', 'name', '');
    expect(() => writeWettkampfergebnisliste(records)).toThrow(DsvWriteError);
  });

  it('wirft bei einem unzulässigen Wert', () => {
    const records = withValue(minimalRecords(), 'PNERGEBNIS', 'endzeit', '28,15');
    expect(() => writeWettkampfergebnisliste(records)).toThrow(DsvWriteError);
  });

  it('wirft bei einem Element der anderen Listenart', () => {
    const records: TypedRecord[] = [
      ...minimalRecords(),
      { element: 'MELDEGELD', line: 0, values: { meldegeldTyp: 'Meldegeldpauschale' } },
    ];
    expect(() => writeWettkampfergebnisliste(records)).toThrow(/MELDEGELD/);
  });

  it('wirft, wenn ein Pflichtelement fehlt', () => {
    const records = minimalRecords().filter((r) => r.element !== 'VEREIN');
    expect(() => writeWettkampfergebnisliste(records)).toThrow(DsvWriteError);
  });

  it('wirft ohne erkennbare Formatversion', () => {
    const records = withValue(minimalRecords(), 'FORMAT', 'version', '');
    expect(() => writeWettkampfergebnisliste(records)).toThrow(/version/i);
  });
});

const DIRS = ['test/fixtures/real', 'test/fixtures/synth'];

/**
 * Ergebnislisten, die streng gültig sind — ohne Fehler und ohne tolerierte
 * Werte. Nur die lassen sich zurückschreiben.
 *
 * Von den 75 echten Ergebnislisten sind 3 in DSV6 und damit gar nicht
 * auswertbar; von den verbleibenden 72 tragen 24 Fehler, überwiegend fehlende
 * Pflichtfelder. Die Zahl der tauglichen Dateien steht unten als feste
 * Erwartung, damit auffällt, wenn ein Fixture oder eine Prüfung sich ändert.
 */
const strictFiles = DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => /\.dsv[678]?$/i.test(f))
    .map((f) => join(dir, f))
    .filter((path) => {
      const result = parseWettkampfergebnisliste(readFileSync(path, 'utf8'));
      return (
        result.document.listenart.toLowerCase() === 'wettkampfergebnisliste' &&
        result.ok &&
        !result.diagnostics.some((d) => d.data?.['tolerated'] === true)
      );
    }),
);

const realStrictFiles = strictFiles.filter((p) => p.startsWith('test/fixtures/real'));

/** Alle auswertbaren echten Ergebnislisten, samt der fehlerhaften. */
const realFiles = readdirSync('test/fixtures/real')
  .filter((f) => /\.dsv[678]?$/i.test(f))
  .map((f) => join('test/fixtures/real', f))
  .map((path) => parseWettkampfergebnisliste(readFileSync(path, 'utf8')))
  .filter((r) => r.document.listenart.toLowerCase() === 'wettkampfergebnisliste');

/** Davon die, die ohne Fehler gelesen werden — einschliesslich tolerierter Werte. */
const realErrorFree = realFiles.filter((r) => r.ok);

describe('Round-Trip über echte Ergebnislisten', () => {
  it('findet genau die erwartete Zahl streng gültiger Dateien', () => {
    // 48 der 72 DSV7-Dateien sind fehlerfrei. Eine davon schreibt die
    // Kampfrichterposition als SPR — ein tolerierter Wert, der beim Lesen nur
    // eine Warnung ergibt, beim Schreiben aber unzulässig ist. Es bleiben 47.
    // 75 echte Ergebnislisten, davon 3 in DSV6 und damit nicht auswertbar.
    expect(realFiles.length).toBe(75);
    expect(realFiles.filter((r) => r.document.records.length > 0).length).toBe(72);
    expect(realErrorFree.length).toBe(48);
    expect(realStrictFiles.length).toBe(47);
    // Dazu die synthetischen Ergebnis-Fixtures: die vier ursprünglichen und
    // die beiden gültigen Fassungen der DSV8-Gegenprobe. Die dritte Fassung,
    // `delta-wettkampfergebnisliste-verstoss.dsv7`, ist absichtlich ungültig
    // und fällt schon aus `strictFiles` heraus.
    expect(strictFiles.length).toBe(53);
  });

  it.each(strictFiles)('%s: parse → write → parse ist semantisch äquivalent', (path) => {
    const first = parseWettkampfergebnisliste(readFileSync(path, 'utf8'));
    const written = writeWettkampfergebnisliste(first.document.records);
    const second = parseWettkampfergebnisliste(written);

    expect(second.ok).toBe(true);
    expect(shape(second.document.records)).toEqual(shape(first.document.records));
  });
});
