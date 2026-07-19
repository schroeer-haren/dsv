import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import type { TypedRecord } from '../../src/parse/parse-typed-list.js';
import { parseTypedList } from '../../src/parse/parse-typed-list.js';
import { parseWettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../../src/schema/wettkampfdefinitionsliste.js';
import { WETTKAMPFERGEBNISLISTE } from '../../src/schema/wettkampfergebnisliste.js';
import { VEREINSMELDELISTE } from '../../src/schema/vereinsmeldeliste.js';
import { VEREINSERGEBNISLISTE } from '../../src/schema/vereinsergebnisliste.js';
import { DsvWriteError } from '../../src/write/write-error.js';
import {
  writeTypedList,
  writeTypedListPreservingDefects,
} from '../../src/write/write-typed-list.js';
import { writeWettkampfergebnisliste } from '../../src/write/write-wettkampfergebnisliste.js';
import { writeWettkampfergebnislistePreservingDefects } from '../../src/write/write-wettkampfergebnisliste.js';

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

describe('Durchreichen vorbestehender Mängel', () => {
  /**
   * Die Vorgabe darf sich nicht bewegen: Wer nichts angibt, bekommt weiterhin
   * die Verweigerung. Der Weg über `…PreservingDefects` muss ausdrücklich
   * gewählt werden.
   */
  it('verweigert ein leeres Pflichtfeld weiterhin, wenn nichts angegeben wird', () => {
    const records = withValue(minimalRecords(), 'KAMPFGERICHT', 'vereinDesKampfrichters', '');

    expect(() => writeWettkampfergebnisliste(records)).toThrow(DsvWriteError);
  });

  it('reicht ein leeres Pflichtfeld durch, wenn es ausdrücklich verlangt wird', () => {
    const records = withValue(minimalRecords(), 'KAMPFGERICHT', 'vereinDesKampfrichters', '');
    const result = writeWettkampfergebnislistePreservingDefects(records);

    expect(result.text).toContain('KAMPFGERICHT:1;SCH;Muster, Erika;;');
  });

  /**
   * Stilles Durchwinken wäre so schlimm wie die Verweigerung. Das Ergebnis ist
   * deshalb kein blosser Text mehr, sondern trägt die durchgereichten Befunde
   * mit — an ihnen kommt kein Aufrufer vorbei.
   */
  it('meldet jeden durchgereichten Mangel im Ergebnis', () => {
    const records = withValue(minimalRecords(), 'KAMPFGERICHT', 'vereinDesKampfrichters', '');
    const result = writeWettkampfergebnislistePreservingDefects(records);

    expect(result.preservedDefects).toHaveLength(1);
    expect(result.preservedDefects[0]?.code).toBe('missing-required-field');
    expect(result.preservedDefects[0]?.data?.['field']).toBe('vereinDesKampfrichters');
  });

  it('meldet eine leere Liste, wenn nichts durchzureichen war', () => {
    const result = writeWettkampfergebnislistePreservingDefects(minimalRecords());

    expect(result.preservedDefects).toEqual([]);
    expect(result.text).toBe(writeWettkampfergebnisliste(minimalRecords()));
  });

  /**
   * Ein leeres Pflichtfeld ist ein Mangel, den die Datei mitbringt — sie bleibt
   * lesbar. Ein unzulässiger Aufzählungswert, eine falsche Feldzahl oder eine
   * kaputte Elementreihenfolge sind etwas anderes: Dort erzeugte der Aufrufer
   * eine Datei, die niemand mehr auswerten kann. Diese Codes bleiben verwehrt,
   * auch auf dem ausdrücklichen Weg.
   */
  it('reicht einen unzulässigen Aufzählungswert auch dann nicht durch', () => {
    const records = withValue(minimalRecords(), 'KAMPFGERICHT', 'position', 'SPR');

    expect(() => writeWettkampfergebnislistePreservingDefects(records)).toThrow(DsvWriteError);
  });

  it('reicht eine verletzte Elementreihenfolge auch dann nicht durch', () => {
    const records = minimalRecords();
    const reordered = [records[0]!, ...records.slice(1).reverse()];

    expect(() => writeWettkampfergebnislistePreservingDefects(reordered)).toThrow(DsvWriteError);
  });

  it('reicht ein unbekanntes Element auch dann nicht durch', () => {
    const records = [...minimalRecords(), { element: 'GIBTESNICHT', line: 99, values: {} }];

    expect(() => writeWettkampfergebnislistePreservingDefects(records)).toThrow(DsvWriteError);
  });

  it('reicht einen unzulässigen Wert auch dann nicht durch', () => {
    const records = withValue(minimalRecords(), 'ABSCHNITT', 'abschnittsdatum', '99.99.9999');

    expect(() => writeWettkampfergebnislistePreservingDefects(records)).toThrow(DsvWriteError);
  });

  it('verweigert eine fehlende Formatversion auch auf dem ausdrücklichen Weg', () => {
    expect(() =>
      writeTypedListPreservingDefects([], WETTKAMPFERGEBNISLISTE, { version: undefined }),
    ).toThrow(DsvWriteError);
  });
});

const DIR = 'test/fixtures/real';
const files = readdirSync(DIR).filter((f) => /\.dsv[678]?$/i.test(f));
const read = (name: string): string => readFileSync(join(DIR, name), 'utf8');
const schemas = [
  WETTKAMPFDEFINITIONSLISTE,
  WETTKAMPFERGEBNISLISTE,
  VEREINSMELDELISTE,
  VEREINSERGEBNISLISTE,
];

/**
 * Der Bestand echter Dateien, nach Formatversion getrennt. Die fünf
 * DSV6-Dateien bleiben zu Recht abgewiesen — sie werden hier gar nicht erst
 * angeboten.
 */
const dsv7Files = files.filter((f) => parseDsv(read(f)).document.version === 7);

/**
 * Die vier Dateien, die auch auf dem ausdrücklichen Weg abgewiesen bleiben:
 * Ihr Mangel ist ein tolerierter Aufzählungswert, kein fehlender Wert.
 */
const EXPECTED_ENUM_FAILURES = [
  '2026-06-28-Gera-SVHaren-Me.dsv7',
  'dsvportal-13062024-Wk.dsv7',
  'gh-dsvparser-definition.dsv7',
  'gh-dsvparser-ergebnis.dsv7',
];

describe('Durchreichen über den echten Bestand', () => {
  it('führt 137 DSV7-Dateien und 5 DSV6-Dateien', () => {
    expect(files).toHaveLength(142);
    expect(dsv7Files).toHaveLength(137);
    expect(files.filter((f) => parseDsv(read(f)).document.version === 6)).toHaveLength(5);
  });

  /**
   * Das eigentliche Abnahmekriterium: Ein Protokoll einlesen, es unverändert
   * wieder ausschreiben. Vor diesem Commit scheiterten 28 Dateien an einem
   * Pflichtfeld, das schon im Original leer war.
   */
  it('schreibt jede DSV7-Datei über den ausdrücklichen Weg aus — bis auf die vier Enum-Fälle', () => {
    const gescheitert: string[] = [];
    let mitMangel = 0;

    for (const name of dsv7Files) {
      const text = read(name);
      const listenart = (parseDsv(text).document.listenart ?? '').trim().toLowerCase();
      const schema = schemas.find((s) => s.listenart.toLowerCase() === listenart);
      expect(schema, name).toBeDefined();

      const parsed = parseTypedList(text, schema!);

      try {
        const result = writeTypedListPreservingDefects(parsed.document.records, schema!, {
          version: 7,
        });
        if (result.preservedDefects.length > 0) mitMangel++;
      } catch {
        gescheitert.push(name);
      }
    }

    // Vier Dateien tragen einen tolerierten Aufzählungswert (`wettkampfart`
    // A/N, `meldegeldTyp` in Grossschreibung, `position` SPR). Sie bleiben
    // abgewiesen: Ein Aufzählungswert ausserhalb der Werteliste ist kein
    // fehlender Wert, sondern ein Wert, den ein fremder Leser anders oder gar
    // nicht auflöst. Das ist eine eigene Entscheidung, keine dieses Commits.
    expect(gescheitert).toEqual(EXPECTED_ENUM_FAILURES);
    expect(mitMangel).toBe(28);
  });

  /**
   * DSV6 bleibt abgewiesen, und zwar auch auf dem ausdrücklichen Weg: Eine
   * nicht unterstützte Formatversion ist `fatal` — kein vorbestehender Mangel,
   * sondern gar keine verwertbare Eingabe.
   */
  it('weist die fünf DSV6-Dateien auch auf dem ausdrücklichen Weg ab', () => {
    const dsv6Files = files.filter((f) => parseDsv(read(f)).document.version === 6);
    expect(dsv6Files).toHaveLength(5);

    for (const name of dsv6Files) {
      const parsed = parseTypedList(read(name), WETTKAMPFERGEBNISLISTE);
      expect(() =>
        writeTypedListPreservingDefects(parsed.document.records, WETTKAMPFERGEBNISLISTE),
      ).toThrow(DsvWriteError);
    }
  });

  /**
   * Die Vorgabe bleibt streng: Ohne den ausdrücklichen Weg scheitern dieselben
   * 32 Dateien weiterhin. Fiele diese Zahl auf 4, wäre die Strenge still
   * abgeschafft worden.
   */
  it('verweigert weiterhin 32 Dateien auf dem Vorgabeweg', () => {
    let gescheitert = 0;

    for (const name of dsv7Files) {
      const text = read(name);
      const listenart = (parseDsv(text).document.listenart ?? '').trim().toLowerCase();
      const schema = schemas.find((s) => s.listenart.toLowerCase() === listenart)!;
      const parsed = parseTypedList(text, schema);

      try {
        writeTypedList(parsed.document.records, schema, { version: 7 });
      } catch {
        gescheitert++;
      }
    }

    expect(gescheitert).toBe(32);
  });
});
