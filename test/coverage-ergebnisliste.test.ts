import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { parseWettkampfergebnisliste } from '../src/parse/parse-wettkampfergebnisliste.js';
import { WETTKAMPFERGEBNISLISTE } from '../src/schema/wettkampfergebnisliste.js';

const DIRS = ['test/fixtures/real', 'test/fixtures/synth'];

/** Alle Fixtures, die eine Wettkampfergebnisliste in DSV7 oder DSV8 sind. */
function resultLists(): string[] {
  return DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => /\.dsv[678]?$/i.test(f))
      .map((f) => join(dir, f))
      .filter((path) => {
        const { document } = parseDsv(readFileSync(path, 'utf8'));
        return (
          document.listenart?.toLowerCase() === 'wettkampfergebnisliste' &&
          (document.version === 7 || document.version === 8)
        );
      }),
  );
}

/** `ELEMENT.feld` für jedes Feld des Schemas, in Reihenfolge der Spezifikation. */
const allFields: string[] = WETTKAMPFERGEBNISLISTE.elements.flatMap((occurrence) =>
  occurrence.def.fields.map((f) => `${occurrence.def.name}.${f.name}`),
);

/** Ermittelt, welche Felder in den Fixtures gesetzt bzw. leer vorkommen. */
function observe(): { set: Set<string>; empty: Set<string> } {
  const set = new Set<string>();
  const empty = new Set<string>();

  for (const path of resultLists()) {
    const result = parseWettkampfergebnisliste(readFileSync(path, 'utf8'));

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
  WETTKAMPFERGEBNISLISTE.elements.flatMap((o) =>
    o.def.fields.filter((f) => f.required).map((f) => `${o.def.name}.${f.name}`),
  ),
);

/**
 * Pflichtfelder, die nie leer beobachtet wurden. Das ist keine Lücke, die sich
 * schliessen liesse: Ein leerer Wert wäre dort ein `missing-required-field`.
 * Die Liste steht hier trotzdem vollständig, damit auffällt, wenn ein Fixture
 * anfängt, ein Pflichtfeld leer zu lassen.
 *
 * Sechs Pflichtfelder fehlen in dieser Liste, weil echte Dateien sie
 * tatsächlich leer lassen: `VERANSTALTER.nameDesVeranstalters`,
 * `AUSRICHTER.nameDesAusrichters`, `AUSRICHTER.name`, `AUSRICHTER.email`,
 * `KAMPFGERICHT.vereinDesKampfrichters` und `VEREIN.nationenkuerzel`. Diese
 * Leerstellen sind Mängel der Quellen, keine Absicht der Fixtures.
 *
 * `PNREAKTION.art` gehört nicht dazu: Das Feld ist gar kein Pflichtfeld,
 * sondern optional mit dem Unterlassungswert `+`, und taucht in dieser Liste
 * deshalb ohnehin nicht auf.
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
  'ABSCHNITT.abschnittsnr',
  'ABSCHNITT.abschnittsdatum',
  'ABSCHNITT.anfangszeit',
  'KAMPFGERICHT.abschnittsnr',
  'KAMPFGERICHT.position',
  'KAMPFGERICHT.nameKampfrichter',
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
  'VEREIN.vereinsbezeichnung',
  'VEREIN.vereinskennzahl',
  'VEREIN.landesschwimmverband',
  'PNERGEBNIS.wettkampfnr',
  'PNERGEBNIS.wettkampfart',
  'PNERGEBNIS.wertungsId',
  'PNERGEBNIS.platz',
  'PNERGEBNIS.name',
  'PNERGEBNIS.dsvId',
  'PNERGEBNIS.veranstaltungsId',
  'PNERGEBNIS.geschlecht',
  'PNERGEBNIS.jahrgang',
  'PNERGEBNIS.verein',
  'PNERGEBNIS.vereinskennzahl',
  'PNERGEBNIS.endzeit',
  'PNZWISCHENZEIT.veranstaltungsId',
  'PNZWISCHENZEIT.wettkampfnr',
  'PNZWISCHENZEIT.wettkampfart',
  'PNZWISCHENZEIT.distanz',
  'PNZWISCHENZEIT.zwischenzeit',
  'PNREAKTION.veranstaltungsId',
  'PNREAKTION.wettkampfnr',
  'PNREAKTION.wettkampfart',
  'PNREAKTION.reaktionszeit',
  'STERGEBNIS.wettkampfnr',
  'STERGEBNIS.wettkampfart',
  'STERGEBNIS.wertungsId',
  'STERGEBNIS.platz',
  'STERGEBNIS.nummerDerMannschaft',
  'STERGEBNIS.veranstaltungsId',
  'STERGEBNIS.verein',
  'STERGEBNIS.vereinskennzahl',
  'STERGEBNIS.endzeit',
  'STAFFELPERSON.veranstaltungsIdStaffel',
  'STAFFELPERSON.wettkampfnr',
  'STAFFELPERSON.wettkampfart',
  'STAFFELPERSON.name',
  'STAFFELPERSON.dsvId',
  'STAFFELPERSON.startnummer',
  'STAFFELPERSON.geschlecht',
  'STAFFELPERSON.jahrgang',
  'STZWISCHENZEIT.veranstaltungsIdStaffel',
  'STZWISCHENZEIT.wettkampfnr',
  'STZWISCHENZEIT.wettkampfart',
  'STZWISCHENZEIT.startnummer',
  'STZWISCHENZEIT.distanz',
  'STZWISCHENZEIT.zwischenzeit',
  'STABLOESE.veranstaltungsIdStaffel',
  'STABLOESE.wettkampfnr',
  'STABLOESE.wettkampfart',
  'STABLOESE.startnummer',
  'STABLOESE.reaktionszeit',
];

/**
 * Verbleibende Lücken bei den optionalen Feldern: keine.
 *
 * Die synthetischen Fixtures führen von jedem Element, dessen optionale Felder
 * in echten Dateien durchgängig gefüllt sind, eine zweite Zeile mit, die diese
 * Felder leer lässt — insbesondere `art` in PNREAKTION und STABLOESE, deren
 * Unterlassungswert `+` sonst nie zum Zuge käme.
 */
const EXPECTED_NEVER_EMPTY_OPTIONAL: readonly string[] = [];

describe('Abdeckung der Schemafelder der Ergebnisliste durch die Fixtures', () => {
  it('wertet überhaupt Fixtures aus', () => {
    expect(resultLists().length).toBeGreaterThan(0);
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
