import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import type { TypedList } from '../src/parse/parse-typed-list.js';
import { parseVereinsergebnisliste } from '../src/parse/parse-vereinsergebnisliste.js';
import { parseVereinsmeldeliste } from '../src/parse/parse-vereinsmeldeliste.js';
import type { ParseResult } from '../src/document/types.js';
import type { ListSchema } from '../src/schema/list-schema.js';
import { VEREINSERGEBNISLISTE } from '../src/schema/vereinsergebnisliste.js';
import { VEREINSMELDELISTE } from '../src/schema/vereinsmeldeliste.js';

const DIRS = ['test/fixtures/real', 'test/fixtures/synth'];

/** Alle Fixtures, die eine Liste der angegebenen Listenart sind. */
function fixturesOf(listenart: string): string[] {
  return DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => /\.dsv[678]?$/i.test(f))
      .map((f) => join(dir, f))
      .filter((path) => {
        const { document } = parseDsv(readFileSync(path, 'utf8'));
        return (
          document.listenart?.toLowerCase() === listenart.toLowerCase() &&
          (document.version === 7 || document.version === 8)
        );
      }),
  );
}

interface Listenart {
  readonly schema: ListSchema;
  readonly parse: (input: string) => ParseResult<TypedList<string>>;
  /**
   * Optionale Felder, die in keinem Fixture leer vorkommen. Soll leer bleiben:
   * Für die Vereinsergebnisliste gibt es keine echte Datei, die Fixtures sind
   * dort vollständig in der Hand dieses Projekts, und jede Lücke lässt sich mit
   * einer weiteren Zeile schliessen. Für die Vereinsmeldeliste kommen seit dem
   * Bestand von 34 echten WebClub-Dateien Realdaten hinzu; sie schliessen die
   * Lücken zusätzlich, statt sie zu öffnen.
   */
  readonly expectedNeverEmptyOptional: readonly string[];
}

const LISTENARTEN: readonly Listenart[] = [
  {
    schema: VEREINSMELDELISTE,
    parse: parseVereinsmeldeliste,
    expectedNeverEmptyOptional: [],
  },
  {
    schema: VEREINSERGEBNISLISTE,
    parse: parseVereinsergebnisliste,
    expectedNeverEmptyOptional: [],
  },
];

describe.each(LISTENARTEN)(
  'Abdeckung der Schemafelder — $schema.listenart',
  ({ schema, parse, expectedNeverEmptyOptional }) => {
    const paths = fixturesOf(schema.listenart);

    /** `ELEMENT.feld` für jedes Feld des Schemas, in Reihenfolge der Spezifikation. */
    const allFields: string[] = schema.elements.flatMap((occurrence) =>
      occurrence.def.fields.map((f) => `${occurrence.def.name}.${f.name}`),
    );

    const set = new Set<string>();
    const empty = new Set<string>();

    for (const path of paths) {
      for (const record of parse(readFileSync(path, 'utf8')).document.records) {
        for (const [name, value] of Object.entries(record.values)) {
          (value.trim() === '' ? empty : set).add(`${record.element}.${name}`);
        }
      }
    }

    const neverSet = allFields.filter((f) => !set.has(f));
    const neverEmpty = allFields.filter((f) => !empty.has(f));

    const required = new Set<string>(
      schema.elements.flatMap((o) =>
        o.def.fields.filter((f) => f.required).map((f) => `${o.def.name}.${f.name}`),
      ),
    );

    it('wertet überhaupt Fixtures aus', () => {
      expect(paths.length).toBeGreaterThan(0);
      expect(allFields.length).toBeGreaterThan(0);
    });

    it('kennt zu jedem Schemafeld mindestens einen gesetzten Wert', () => {
      expect(neverSet).toEqual([]);
    });

    /**
     * Anders als bei den beiden Wettkampflisten steht hier die vollständige
     * Menge der Pflichtfelder: Kein Fixture lässt ein Pflichtfeld leer — ein
     * leerer Wert wäre dort ein `missing-required-field`. Der Test schlägt an,
     * sobald doch eines leer auftaucht.
     *
     * Für die Vereinsmeldeliste ist das seit den 34 echten WebClub-Dateien
     * keine blosse Eigenschaft selbstgebauter Fixtures mehr, sondern an echten
     * Daten belegt: Auch sie lassen kein Pflichtfeld leer.
     */
    it('lässt kein Pflichtfeld leer', () => {
      expect(neverEmpty.filter((f) => required.has(f))).toEqual(
        allFields.filter((f) => required.has(f)),
      );
      expect(required.size).toBeGreaterThan(0);
    });

    it('hält die optionalen Felder fest, die nie leer vorkommen', () => {
      expect(neverEmpty.filter((f) => !required.has(f))).toEqual(expectedNeverEmptyOptional);
    });
  },
);
