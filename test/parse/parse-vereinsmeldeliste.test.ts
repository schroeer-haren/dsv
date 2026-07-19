import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { parseVereinsmeldeliste } from '../../src/parse/parse-vereinsmeldeliste.js';
import { VEREINSMELDELISTE } from '../../src/schema/vereinsmeldeliste.js';
import { fieldsForVersion } from '../../src/validate/validate-fields.js';
import { writeDsv } from '../../src/write/write-dsv.js';
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

/**
 * Alle Fixtures eines Verzeichnisses, die eine Vereinsmeldeliste sind.
 *
 * Bis zu diesem Bestand gab es für diese Listenart keine einzige echte Datei —
 * das Schema war ausschliesslich gegen Kapitel 5.2 der Spezifikation gebaut.
 * Die 34 Dateien hier sind die erste Konfrontation dieser Tabelle mit echten
 * Daten.
 */
function meldeLists(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /\.dsv[678]?$/i.test(f))
    .filter((f) => !f.includes('-verstoss'))
    .filter((f) => {
      const { document } = parseDsv(readFileSync(join(dir, f), 'utf8'));
      return (
        document.listenart?.toLowerCase() === 'vereinsmeldeliste' &&
        (document.version === 7 || document.version === 8)
      );
    });
}

const REAL = 'test/fixtures/real';
const realMeldeLists = meldeLists(REAL);

const readReal = (name: string): string => readFileSync(join(REAL, name), 'utf8');

describe('Vereinsmeldelisten aus test/fixtures/real', () => {
  it('findet den erwarteten Bestand', () => {
    expect(realMeldeLists).toHaveLength(34);
  });

  it('stammt vollständig von WebClub 1.76', () => {
    const erzeuger = new Set(
      realMeldeLists.map((name) => {
        const record = parseVereinsmeldeliste(readReal(name)).document.records.find(
          (r) => r.element === 'ERZEUGER',
        );
        return `${String(record?.values['software'])} ${String(record?.values['version'])}`;
      }),
    );

    expect([...erzeuger]).toEqual(['WebClub 1.76']);
  });

  it.each(realMeldeLists)('%s wird ohne fatal gelesen', (name) => {
    const result = parseVereinsmeldeliste(readReal(name));
    expect(result.diagnostics.filter((d) => d.severity === 'fatal')).toEqual([]);
    expect(result.document.records.length).toBeGreaterThan(0);
  });

  it('hat keine einzige Datei mit einem Fehler', () => {
    const withErrors = realMeldeLists.filter(
      (name) =>
        parseVereinsmeldeliste(readReal(name)).diagnostics.filter((d) => d.severity === 'error')
          .length > 0,
    );

    expect(withErrors).toEqual([]);
  });

  it.each(realMeldeLists)('%s bleibt beim Round-Trip byte-identisch', (name) => {
    const original = readReal(name);
    expect(writeDsv(parseDsv(original).document)).toBe(original);
  });

  /**
   * Der vollständige Befund über alle 34 Dateien, nach Code und Severity. Ein
   * exakter Wert statt einer Schranke: Jede Abweichung ist entweder ein Mangel
   * der Dateien oder ein Fehler in der Schematabelle, und beides soll auffallen.
   */
  it('erzeugt genau eine Warnung und sonst nichts', () => {
    const byCode = new Map<string, number>();

    for (const name of realMeldeLists) {
      for (const d of parseVereinsmeldeliste(readReal(name)).diagnostics) {
        const key = `${d.severity}/${d.code}`;
        byCode.set(key, (byCode.get(key) ?? 0) + 1);
      }
    }

    expect(Object.fromEntries([...byCode].sort())).toEqual({
      'warning/invalid-enum-value': 1,
    });
  });

  /**
   * Die Messung, die der Entscheidung zugrunde liegt (docs/architecture.md):
   * Die Spezifikation verlangt bei Zwischenläufen und Finals die Nummer des
   * qualifizierenden Wettkampfes (dsv8.md:1793). In diesen Dateien lassen
   * **alle 170 Wettkämpfe mit Art `F` das Feld leer, ausnahmslos** — eine Quote
   * von 100 % über 34 unabhängig erzeugte Dateien.
   *
   * Die Gegenprobe ist ebenso eindeutig: In keiner Datei gibt es unter der
   * Nummer eines Finales einen Vorlauf oder Zwischenlauf, auf den überhaupt
   * verwiesen werden könnte. Damit liegt der Fehler in der Regel, nicht in den
   * Dateien — eine Vereinsmeldung entsteht vor der Veranstaltung, also bevor
   * sich jemand qualifizieren konnte. `F` bezeichnet hier einen direkt
   * ausgeschriebenen Endlauf, keinen Lauf mit vorgeschaltetem Vorlauf.
   *
   * Der Test hält beide Zahlen fest: die 170 Finals ohne Qualifikationsnummer
   * bleiben, die Warnung dazu entfällt.
   */
  it('nennt bei keinem der 170 Finals einen Qualifikationswettkampf — und warnt nicht', () => {
    const finals = realMeldeLists.flatMap((name) =>
      parseVereinsmeldeliste(readReal(name)).document.records.filter(
        (r) => r.element === 'WETTKAMPF' && r.values['wettkampfart'] === 'F',
      ),
    );

    expect(finals).toHaveLength(170);
    expect(
      finals.filter((r) => (r.values['qualifikationswettkampfnr'] ?? '').trim() !== ''),
    ).toEqual([]);

    // Gegenprobe: kein Finale trägt eine Nummer, unter der die Datei einen
    // Vorlauf oder Zwischenlauf führt.
    const referenceable = realMeldeLists.flatMap((name) => {
      const { records } = parseVereinsmeldeliste(readReal(name)).document;
      const heats = new Set(
        records
          .filter(
            (r) =>
              r.element === 'WETTKAMPF' &&
              (r.values['wettkampfart'] === 'V' || r.values['wettkampfart'] === 'Z'),
          )
          .map((r) => r.values['wettkampfnr']),
      );

      return records
        .filter((r) => r.element === 'WETTKAMPF' && r.values['wettkampfart'] === 'F')
        .filter((r) => heats.has(r.values['wettkampfnr']))
        .map((r) => `${name}:${String(r.values['wettkampfnr'])}`);
    });

    expect(referenceable).toEqual([]);

    const warnings = realMeldeLists.flatMap((name) =>
      parseVereinsmeldeliste(readReal(name)).diagnostics.filter(
        (d) => d.code === 'conditional-field-required',
      ),
    );

    expect(warnings).toEqual([]);
  });

  /**
   * Einzelbefund: `2026-06-28-Gera-SVHaren-Me.dsv7` meldet einen Wettkampf mit
   * Art `A` (Ausschwimmen). Die Wertetabelle der Vereinsmeldeliste kennt den
   * Wert nicht — sie nennt sogar nur `V` und `E` —, die Ergebnislisten dagegen
   * schon (dsv8.md:3058). Das ist eine Lücke der Vorlage, kein Mangel der Datei;
   * `A` und `N` werden deshalb wie in der Wettkampfdefinitionsliste toleriert.
   */
  it('toleriert die Wettkampfart A genau einmal', () => {
    const tolerated = realMeldeLists.flatMap((name) =>
      parseVereinsmeldeliste(readReal(name))
        .diagnostics.filter((d) => d.code === 'invalid-enum-value')
        .map((d) => ({ name, data: d.data })),
    );

    expect(tolerated).toEqual([
      {
        name: '2026-06-28-Gera-SVHaren-Me.dsv7',
        data: { field: 'wettkampfart', value: 'A', tolerated: true },
      },
    ]);
  });

  /**
   * Die Feldanzahl je Element ist über alle 34 Dateien konstant und deckt sich
   * mit dem Schema — gemessen gegen die Felder der Formatversion 7, denn Felder
   * mit `since: 8` haben in einer DSV7-Datei nicht einmal ein Trennzeichen.
   *
   * Das bestätigt die Tabelle an einer Stelle, die bisher nur behauptet war:
   * `VEREIN.lastschrift`, `KARIMELDUNG.geschlecht` und `TRAINER.geschlecht`
   * fehlen in den echten Dateien genau so, wie es ihr `since: 8` vorhersagt.
   */
  it('hält je Element eine konstante Feldanzahl, die zum Schema passt', () => {
    const observed = new Map<string, Set<number>>();

    for (const name of realMeldeLists) {
      for (const item of parseDsv(readReal(name)).document.items) {
        if (item.kind !== 'element' || item.bare) continue;
        const seen = observed.get(item.element) ?? new Set<number>();
        seen.add(item.fields.length);
        observed.set(item.element, seen);
      }
    }

    const expected = new Map(
      VEREINSMELDELISTE.elements.map((o) => [o.def.name, fieldsForVersion(o.def, 7).length]),
    );

    const actual = [...observed]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([element, sizes]) => [element, [...sizes]]);

    expect(actual).toEqual(
      [...observed]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([element]) => [element, [expected.get(element)]]),
    );
  });
});
