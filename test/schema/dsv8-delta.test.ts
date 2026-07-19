import { describe, expect, it } from 'vitest';

import { VEREINSERGEBNISLISTE } from '../../src/schema/vereinsergebnisliste.js';
import { VEREINSMELDELISTE } from '../../src/schema/vereinsmeldeliste.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../../src/schema/wettkampfdefinitionsliste.js';
import { WETTKAMPFERGEBNISLISTE } from '../../src/schema/wettkampfergebnisliste.js';
import type { ListSchema } from '../../src/schema/list-schema.js';

/**
 * Das vollständige Delta zwischen DSV7 und DSV8, erhoben aus dem Vergleich von
 * `spec/dsv7.md` und `spec/dsv8.md`.
 *
 * Dieser Test ist die eine Stelle, an der die Bibliothek sagt, was DSV8 gegen
 * DSV7 neu einführt. Er ist bewusst erschöpfend: Er zählt nicht nur auf, was
 * `since: 8` trägt, sondern verlangt Gleichheit mit der Liste unten. Damit
 * fällt beides auf — eine Markierung, für die es in der Spezifikation keinen
 * Unterschied gibt, und ein Unterschied, den der Code nicht markiert. Nur die
 * zweite Richtung ist gefährlich: Ohne Markierung nähme die Bibliothek eine
 * DSV7-Datei mit DSV8-Inhalt stillschweigend an.
 *
 * Das Änderungsverzeichnis der Spezifikation (dsv8.md:105–126) ist als Quelle
 * nicht belastbar — es lässt die Kicks `KB`/`KR`, das Geschlecht `D` und die
 * gepackte Dateivariante teils unerwähnt und kündigt für die Vereinsmeldeliste
 * ein Element `LASTSCHRIFT` an, wo die Tabelle nur ein Attribut `Lastschrift`
 * am Element `VEREIN` führt (dsv8.md:1863). Massgeblich ist der Zeilenvergleich
 * beider Fassungen.
 */

/** Ein einzelner Eintrag des Deltas, wie ihn die Erhebung ausweist. */
interface Delta {
  readonly elemente: readonly string[];
  readonly felder: readonly string[];
  readonly werte: readonly string[];
}

/**
 * Wettkampfdefinitionsliste.
 *
 * - `LASTSCHRIFT` als eigenes Element (dsv7: fehlt, dsv8.md:801–832)
 * - `BANKVERBINDUNG.kontoinhaber`, zugleich Pflichtfeld (dsv8.md:791)
 * - Ausübungen `KB`/`KR` (dsv8.md:1070–1073)
 * - Geschlecht `D` am WETTKAMPF (dsv7 nur M/W/X, dsv8.md:1092)
 * - Meldegeldtypen `Teilnehmermeldegeld` und `Abschnittspauschale`
 *   (dsv8.md:1378–1381, beschrieben dsv8.md:1421–1426)
 *
 * Nicht neu: Geschlecht `D` an WERTUNG (dsv7:1152 / dsv8:1234) und an
 * PFLICHTZEIT (dsv7:1262 / dsv8:1344) — beides steht schon in DSV7.
 */
const WETTKAMPFDEFINITIONSLISTE_DELTA: Delta = {
  elemente: ['LASTSCHRIFT'],
  felder: ['BANKVERBINDUNG.kontoinhaber'],
  werte: [
    'WETTKAMPF.ausuebung=KB',
    'WETTKAMPF.ausuebung=KR',
    'WETTKAMPF.geschlecht=D',
    'MELDEGELD.meldegeldTyp=Teilnehmermeldegeld',
    'MELDEGELD.meldegeldTyp=Abschnittspauschale',
  ],
};

/**
 * Vereinsmeldeliste.
 *
 * - `VEREIN.lastschrift` (dsv8.md:1863–1894) — ein Attribut, kein Element
 * - `KARIMELDUNG.geschlecht` (dsv8.md:2018–2044)
 * - `TRAINER.geschlecht` (dsv8.md:2145–2159)
 * - Ausübungen `KB`/`KR` (dsv8.md:1773–1776)
 * - Geschlecht `D` am WETTKAMPF (dsv7 nur M/W/X, dsv8.md:1791)
 *
 * Nicht neu: Geschlecht `D` an PNMELDUNG (dsv7:2070 / dsv8:2219).
 */
const VEREINSMELDELISTE_DELTA: Delta = {
  elemente: [],
  felder: ['VEREIN.lastschrift', 'KARIMELDUNG.geschlecht', 'TRAINER.geschlecht'],
  werte: ['WETTKAMPF.ausuebung=KB', 'WETTKAMPF.ausuebung=KR', 'WETTKAMPF.geschlecht=D'],
};

/**
 * Vereinsergebnisliste — rein additiv, kein Element und kein Feld kommt hinzu.
 *
 * - Ausübungen `KB`/`KR` (dsv8.md:3119–3122)
 * - Geschlecht `D` am WETTKAMPF (dsv8.md:3143) und an der WERTUNG (dsv8.md:3285)
 *
 * Nicht neu: Geschlecht `D` an PERSON (dsv7:3260 / dsv8:3419) und an
 * STAFFELPERSON (dsv7:3731 / dsv8:3890).
 */
const VEREINSERGEBNISLISTE_DELTA: Delta = {
  elemente: [],
  felder: [],
  werte: [
    'WETTKAMPF.ausuebung=KB',
    'WETTKAMPF.ausuebung=KR',
    'WETTKAMPF.geschlecht=D',
    'WERTUNG.geschlecht=D',
  ],
};

/**
 * Wettkampfergebnisliste — ebenfalls rein additiv.
 *
 * - Ausübungen `KB`/`KR` (dsv8.md:4779–4782)
 * - Geschlecht `D` an der WERTUNG (dsv7:4780 führt nur M/W/X, dsv8.md:4942)
 *
 * Nicht neu: Geschlecht `D` am WETTKAMPF. Diese Listenart ist die einzige, die
 * `D` dort schon in DSV7 kennt (dsv7:4636 / dsv8:4799); die drei übrigen Listen
 * ziehen erst mit DSV8 nach. Die Ungleichheit ist eine Eigenheit von DSV7, kein
 * Fehler der Erhebung.
 */
const WETTKAMPFERGEBNISLISTE_DELTA: Delta = {
  elemente: [],
  felder: [],
  werte: ['WETTKAMPF.ausuebung=KB', 'WETTKAMPF.ausuebung=KR', 'WERTUNG.geschlecht=D'],
};

/** Liest aus einer Listenart heraus, was sie mit `since: 8` markiert. */
export function markierungen(schema: ListSchema): Delta {
  const elemente: string[] = [];
  const felder: string[] = [];
  const werte: string[] = [];

  for (const { def } of schema.elements) {
    if (def.since === 8) elemente.push(def.name);
    for (const f of def.fields) {
      if (f.since === 8) felder.push(`${def.name}.${f.name}`);
      for (const v of f.values ?? []) {
        if (v.since === 8) werte.push(`${def.name}.${f.name}=${v.value}`);
      }
    }
  }

  return { elemente, felder, werte };
}

/** Alle vier Listenarten mit dem Delta, das für sie gilt. */
export const DSV8_DELTA: readonly (readonly [string, ListSchema, Delta])[] = [
  ['Wettkampfdefinitionsliste', WETTKAMPFDEFINITIONSLISTE, WETTKAMPFDEFINITIONSLISTE_DELTA],
  ['Vereinsmeldeliste', VEREINSMELDELISTE, VEREINSMELDELISTE_DELTA],
  ['Vereinsergebnisliste', VEREINSERGEBNISLISTE, VEREINSERGEBNISLISTE_DELTA],
  ['Wettkampfergebnisliste', WETTKAMPFERGEBNISLISTE, WETTKAMPFERGEBNISLISTE_DELTA],
];

describe('DSV8-Delta gegenüber DSV7', () => {
  for (const [name, schema, erwartet] of DSV8_DELTA) {
    describe(name, () => {
      it('markiert genau die Elemente, die DSV8 einführt', () => {
        expect(markierungen(schema).elemente).toEqual(erwartet.elemente);
      });

      it('markiert genau die Felder, die DSV8 einführt', () => {
        expect(markierungen(schema).felder).toEqual(erwartet.felder);
      });

      it('markiert genau die Werte, die DSV8 einführt', () => {
        expect(markierungen(schema).werte).toEqual(erwartet.werte);
      });
    });
  }

  /**
   * Das Delta ist über alle vier Listenarten hinweg endlich und klein. Die
   * Gesamtzahl steht hier ausgeschrieben, damit eine neue Markierung irgendwo
   * im Schema nicht unbemerkt durchrutscht, weil sie zufällig an eine Stelle
   * fällt, die eine der obigen Listen ohnehin erwartet.
   */
  it('umfasst insgesamt ein Element, vier Felder und fünfzehn Werte', () => {
    const alle = DSV8_DELTA.map(([, schema]) => markierungen(schema));

    expect(alle.flatMap((d) => d.elemente)).toHaveLength(1);
    expect(alle.flatMap((d) => d.felder)).toHaveLength(4);
    expect(alle.flatMap((d) => d.werte)).toHaveLength(15);
  });
});
