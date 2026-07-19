import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TypedRecord } from '../../src/parse/parse-wettkampfdefinitionsliste.js';
import { parseWettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';
import {
  DsvWriteError,
  writeWettkampfdefinitionsliste,
} from '../../src/write/write-wettkampfdefinitionsliste.js';

/** Baut eine Elementzeile; jedes Attribut wird mit `;` terminiert. */
function line(element: string, fields: readonly string[]): string {
  return `${element}:${fields.map((f) => `${f};`).join('')}`;
}

/** Die Zeilen eines vollständigen, gültigen Minimaldokuments in DSV8. */
function minimal(): string[] {
  return [
    line('FORMAT', ['Wettkampfdefinitionsliste', '8']),
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

/** Die typisierten Records eines Minimaldokuments. */
function minimalRecords(): readonly TypedRecord[] {
  const result = parseWettkampfdefinitionsliste(`${minimal().join('\r\n')}\r\n`);
  expect(result.ok).toBe(true);
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

describe('writeWettkampfdefinitionsliste', () => {
  it('schreibt kanonisch: kein Leerzeichen nach dem Doppelpunkt, jedes Feld terminiert', () => {
    const text = writeWettkampfdefinitionsliste(minimalRecords());

    expect(text.startsWith('FORMAT:Wettkampfdefinitionsliste;8;\r\n')).toBe(true);
    expect(text).toContain('MELDESCHLUSS:01.05.2026;18:00;\r\n');
    expect(text.endsWith('DATEIENDE\r\n')).toBe(true);
    expect(text).not.toContain(': ');
  });

  it('schreibt standardmässig CRLF und auf Wunsch LF', () => {
    expect(writeWettkampfdefinitionsliste(minimalRecords())).toContain('\r\n');

    const lf = writeWettkampfdefinitionsliste(minimalRecords(), { eol: '\n' });
    expect(lf).not.toContain('\r');
    expect(lf.endsWith('DATEIENDE\n')).toBe(true);
  });

  it('schreibt DSV7 ohne die Felder, die es erst ab DSV8 gibt', () => {
    const records = withValue(minimalRecords(), 'FORMAT', 'version', '7');
    const text = writeWettkampfdefinitionsliste(records, { version: 7 });

    expect(text.startsWith('FORMAT:Wettkampfdefinitionsliste;7;\r\n')).toBe(true);
    expect(parseWettkampfdefinitionsliste(text).ok).toBe(true);
  });

  it('trimmt jeden Feldwert', () => {
    const records = withValue(minimalRecords(), 'VERANSTALTUNG', 'veranstaltungsort', '  Kiel  ');
    const text = writeWettkampfdefinitionsliste(records);

    expect(text).toContain('VERANSTALTUNG:Testwettkampf;Kiel;25;HANDZEIT;\r\n');
    expect(text).not.toContain('  Kiel  ');
  });

  it('gibt options.version den Vorrang vor dem FORMAT-Record', () => {
    // Ohne Version im FORMAT-Record trägt allein die Option die Entscheidung;
    // sie landet auch im Versionsfeld der Ausgabe, sonst wäre die Datei falsch
    // ausgezeichnet und die abschliessende Prüfung läse sie als versionslos.
    const records = withValue(minimalRecords(), 'FORMAT', 'version', '');
    const text = writeWettkampfdefinitionsliste(records, { version: 8 });

    expect(text.startsWith('FORMAT:Wettkampfdefinitionsliste;8;\r\n')).toBe(true);
    expect(parseWettkampfdefinitionsliste(text).document.version).toBe(8);
  });

  it('schreibt eine abweichende FORMAT-Version auf die Option um', () => {
    const records = withValue(minimalRecords(), 'FORMAT', 'version', '8');
    const text = writeWettkampfdefinitionsliste(records, { version: 7 });

    expect(text.startsWith('FORMAT:Wettkampfdefinitionsliste;7;\r\n')).toBe(true);
    expect(parseWettkampfdefinitionsliste(text).document.version).toBe(7);
  });

  it('wirft bei einem tolerierten Aufzählungswert', () => {
    // `N` ist im Format bekannt, für diese Listenart aber nicht vorgesehen.
    // Beim Lesen nur eine Warnung, beim Schreiben unzulässig.
    const records = withValue(minimalRecords(), 'WETTKAMPF', 'wettkampfart', 'N');

    const read = parseWettkampfdefinitionsliste(
      writeWettkampfdefinitionsliste(minimalRecords()).replace('WETTKAMPF:1;E;', 'WETTKAMPF:1;N;'),
    );
    expect(read.ok).toBe(true);
    expect(read.diagnostics.some((d) => d.data?.['tolerated'] === true)).toBe(true);

    expect(() => writeWettkampfdefinitionsliste(records)).toThrow(/tolerated|not specified/i);
  });

  it('wirft bei einem fehlenden Pflichtfeld', () => {
    const records = withValue(minimalRecords(), 'VERANSTALTUNG', 'veranstaltungsort', '');
    expect(() => writeWettkampfdefinitionsliste(records)).toThrow(DsvWriteError);
  });

  it('wirft bei einem unzulässigen Wert', () => {
    const records = withValue(minimalRecords(), 'MELDESCHLUSS', 'datum', '2026-05-01');
    expect(() => writeWettkampfdefinitionsliste(records)).toThrow(DsvWriteError);
  });

  it('wirft bei einem unbekannten Element', () => {
    const records: TypedRecord[] = [
      ...minimalRecords(),
      { element: 'ERGEBNIS', line: 0, values: { irgendwas: 'x' } },
    ];
    expect(() => writeWettkampfdefinitionsliste(records)).toThrow(/ERGEBNIS/);
  });

  it('wirft, wenn ein Pflichtelement fehlt', () => {
    const records = minimalRecords().filter((r) => r.element !== 'MELDEGELD');
    expect(() => writeWettkampfdefinitionsliste(records)).toThrow(DsvWriteError);
  });
});

const REAL = 'test/fixtures/real';

/**
 * Echte Wettkampfdefinitionslisten, die streng gültig sind — also ohne Fehler
 * und ohne tolerierte Werte. Nur die lassen sich zurückschreiben.
 */
const strictFiles = readdirSync(REAL)
  .filter((f) => /\.dsv[678]?$/i.test(f))
  .filter((f) => {
    const result = parseWettkampfdefinitionsliste(readFileSync(join(REAL, f), 'utf8'));
    return (
      result.document.listenart.toLowerCase() === 'wettkampfdefinitionsliste' &&
      result.ok &&
      !result.diagnostics.some((d) => d.data?.['tolerated'] === true)
    );
  });

describe('Round-Trip über echte Dateien', () => {
  it('findet genügend streng gültige Dateien', () => {
    expect(strictFiles.length).toBeGreaterThanOrEqual(3);
  });

  it.each(strictFiles)('%s: parse → write → parse ist semantisch äquivalent', (name) => {
    const first = parseWettkampfdefinitionsliste(readFileSync(join(REAL, name), 'utf8'));
    const written = writeWettkampfdefinitionsliste(first.document.records);
    const second = parseWettkampfdefinitionsliste(written);

    expect(second.ok).toBe(true);
    expect(shape(second.document.records)).toEqual(shape(first.document.records));
  });

  it('ist NICHT byte-identisch, wo die Quelle nach dem Doppelpunkt ein Leerzeichen setzt', () => {
    // Festgehalten, damit es niemand für einen Fehler hält: Der schema-basierte
    // Writer gibt kanonisch aus und verwirft Abweichungen der Quelle —
    // Leerzeichen nach dem Doppelpunkt, Kommentar- und Leerzeilen. Wer Byte-
    // Identität braucht, nimmt `writeDsv` auf dem schema-freien Dokument.
    const source = `${minimal()
      .map((l) => l.replace(':', ': '))
      .join('\r\n')}\r\n`;
    const first = parseWettkampfdefinitionsliste(source);
    const written = writeWettkampfdefinitionsliste(first.document.records);

    expect(first.ok).toBe(true);
    expect(written).not.toBe(source);
    expect(source).toContain(': ');
    expect(written).not.toContain(': ');
    expect(shape(parseWettkampfdefinitionsliste(written).document.records)).toEqual(
      shape(first.document.records),
    );
  });
});
