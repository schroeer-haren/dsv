import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { parseWettkampfdefinitionsliste } from '../src/parse/parse-wettkampfdefinitionsliste.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../src/schema/wettkampfdefinitionsliste.js';

const DIRS = ['test/fixtures/real', 'test/fixtures/synth'];

/** Alle Fixtures, die eine Wettkampfdefinitionsliste in DSV7 oder DSV8 sind. */
function definitionLists(): string[] {
  return DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => /\.dsv[678]?$/i.test(f))
      .map((f) => join(dir, f))
      .filter((path) => {
        const { document } = parseDsv(readFileSync(path, 'utf8'));
        return (
          document.listenart?.toLowerCase() === 'wettkampfdefinitionsliste' &&
          (document.version === 7 || document.version === 8)
        );
      }),
  );
}

/** `ELEMENT.feld` für jedes Feld des Schemas, in Reihenfolge der Spezifikation. */
const allFields: string[] = WETTKAMPFDEFINITIONSLISTE.elements.flatMap((occurrence) =>
  occurrence.def.fields.map((f) => `${occurrence.def.name}.${f.name}`),
);

/** Ermittelt, welche Felder in den Fixtures gesetzt bzw. leer vorkommen. */
function observe(): { set: Set<string>; empty: Set<string> } {
  const set = new Set<string>();
  const empty = new Set<string>();

  for (const path of definitionLists()) {
    const result = parseWettkampfdefinitionsliste(readFileSync(path, 'utf8'));

    for (const record of result.document.records) {
      for (const [name, value] of Object.entries(record.values)) {
        (value.trim() === '' ? empty : set).add(`${record.element}.${name}`);
      }
    }
  }

  return { set, empty };
}

const observed = observe();

const neverSet = allFields.filter((f) => !observed.set.has(f));
const neverEmpty = allFields.filter((f) => !observed.empty.has(f));

const required = new Set<string>(
  WETTKAMPFDEFINITIONSLISTE.elements.flatMap((o) =>
    o.def.fields.filter((f) => f.required).map((f) => `${o.def.name}.${f.name}`),
  ),
);

/**
 * Pflichtfelder, die nie leer beobachtet wurden. Das ist keine Lücke, die sich
 * schliessen liesse: Ein leerer Wert wäre dort ein `missing-required-field`.
 * Die Liste steht hier trotzdem vollständig, damit auffällt, wenn ein Fixture
 * anfängt, ein Pflichtfeld leer zu lassen — genau das tun vier Dateien mit
 * `BESONDERES.anmerkungen`, weshalb dieses Feld hier fehlt.
 */
const EXPECTED_NEVER_EMPTY_REQUIRED: readonly string[] = [
  'FORMAT.listart',
  'FORMAT.version',
  'ERZEUGER.software',
  'ERZEUGER.version',
  'ERZEUGER.kontakt',
  'VERANSTALTUNG.veranstaltungsbezeichnung',
  'VERANSTALTUNG.veranstaltungsort',
  'VERANSTALTUNG.bahnlaenge',
  'VERANSTALTUNG.zeitmessung',
  'VERANSTALTUNGSORT.nameSchwimmhalle',
  'VERANSTALTUNGSORT.ort',
  'VERANSTALTUNGSORT.land',
  'VERANSTALTER.nameDesVeranstalters',
  'AUSRICHTER.nameDesAusrichters',
  'AUSRICHTER.name',
  'AUSRICHTER.email',
  'MELDEADRESSE.name',
  'MELDEADRESSE.email',
  'MELDESCHLUSS.datum',
  'MELDESCHLUSS.uhrzeit',
  'BANKVERBINDUNG.iban',
  'BANKVERBINDUNG.kontoinhaber',
  'NACHWEIS.nachweisVon',
  'NACHWEIS.bahnlaenge',
  'ABSCHNITT.abschnittsnr',
  'ABSCHNITT.abschnittsdatum',
  'ABSCHNITT.anfangszeit',
  'WETTKAMPF.wettkampfnr',
  'WETTKAMPF.wettkampfart',
  'WETTKAMPF.abschnittsnr',
  'WETTKAMPF.einzelstrecke',
  'WETTKAMPF.technik',
  'WETTKAMPF.ausuebung',
  'WETTKAMPF.geschlecht',
  'WETTKAMPF.zuordnungBestenliste',
  'WERTUNG.wettkampfnr',
  'WERTUNG.wettkampfart',
  'WERTUNG.wertungsId',
  'WERTUNG.wertungsklasseTyp',
  'WERTUNG.mindestJgAk',
  'WERTUNG.wertungsname',
  'PFLICHTZEIT.wettkampfnr',
  'PFLICHTZEIT.wettkampfart',
  'PFLICHTZEIT.wertungsklasseTyp',
  'PFLICHTZEIT.mindestJgAk',
  'PFLICHTZEIT.pflichtzeit',
  'MELDEGELD.meldegeldTyp',
  'MELDEGELD.betrag',
];

/**
 * Echte Abdeckungslücken: optionale Felder, die in keinem Fixture weggelassen
 * werden. Sie stammen alle aus Elementen, für die es nur ein einziges,
 * synthetisches Fixture gibt (BANKVERBINDUNG, LASTSCHRIFT, NACHWEIS,
 * PFLICHTZEIT) — dieses eine Fixture füllt jedes Feld aus, damit die Werte
 * überhaupt einmal geprüft werden. Schliessen liesse sich die Lücke mit einer
 * zweiten Variante je Element, die nur die Pflichtfelder setzt.
 */
const EXPECTED_NEVER_EMPTY_OPTIONAL: readonly string[] = [
  'BANKVERBINDUNG.bic',
  'LASTSCHRIFT.hinweis',
  'NACHWEIS.nachweisBis',
  'PFLICHTZEIT.maximalJgAk',
];

describe('Abdeckung der Schemafelder durch die Fixtures', () => {
  it('wertet überhaupt Fixtures aus', () => {
    expect(definitionLists().length).toBeGreaterThan(0);
    expect(allFields.length).toBeGreaterThan(0);
  });

  it('kennt zu jedem Schemafeld mindestens einen gesetzten Wert', () => {
    expect(neverSet).toEqual([]);
  });

  it('hält die Pflichtfelder fest, die nie leer vorkommen', () => {
    expect(neverEmpty.filter((f) => required.has(f))).toEqual(EXPECTED_NEVER_EMPTY_REQUIRED);
  });

  it('hält die optionalen Felder fest, die nie leer vorkommen', () => {
    expect(neverEmpty.filter((f) => !required.has(f))).toEqual(EXPECTED_NEVER_EMPTY_OPTIONAL);
  });
});
