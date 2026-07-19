import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseVereinsergebnisliste } from '../../src/parse/parse-vereinsergebnisliste.js';
import { parseVereinsmeldeliste } from '../../src/parse/parse-vereinsmeldeliste.js';
import { parseWettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';
import { parseWettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';
import type { Diagnostic } from '../../src/diagnostics/types.js';
import type { TypedRecord } from '../../src/parse/parse-typed-list.js';
import { DSV8_DELTA, markierungen } from './dsv8-delta.js';

const SYNTH = join(import.meta.dirname, '..', 'fixtures', 'synth');

const lies = (name: string): string => readFileSync(join(SYNTH, name), 'utf8');

/**
 * Das Ergebnis, das alle vier Parser gemeinsam haben. Die Listenarten
 * unterscheiden sich nur im Typparameter des Dokuments; für diesen Test zählt
 * allein, was allen vieren gemeinsam ist.
 */
interface ParseErgebnis {
  readonly ok: boolean;
  readonly diagnostics: readonly Diagnostic[];
  readonly document: { readonly records: readonly TypedRecord[] };
}

type Parser = (text: string) => ParseErgebnis;

/**
 * Die Gegenproben je Listenart, wie `scripts/build-synth-fixtures.ts` sie
 * erzeugt: drei Dateien, die sich paarweise nur in einer Hinsicht
 * unterscheiden.
 */
const GEGENPROBEN: readonly {
  readonly name: string;
  readonly praefix: string;
  readonly parse: Parser;
}[] = [
  {
    name: 'Wettkampfdefinitionsliste',
    praefix: 'delta-wettkampfdefinitionsliste',
    parse: parseWettkampfdefinitionsliste,
  },
  {
    name: 'Wettkampfdefinitionsliste — LASTSCHRIFT',
    praefix: 'delta-lastschrift',
    parse: parseWettkampfdefinitionsliste,
  },
  {
    name: 'Vereinsmeldeliste',
    praefix: 'delta-vereinsmeldeliste',
    parse: parseVereinsmeldeliste,
  },
  {
    name: 'Vereinsergebnisliste',
    praefix: 'delta-vereinsergebnisliste',
    parse: parseVereinsergebnisliste,
  },
  {
    name: 'Wettkampfergebnisliste',
    praefix: 'delta-wettkampfergebnisliste',
    parse: parseWettkampfergebnisliste,
  },
];

describe('DSV8-Gegenprobe je Listenart', () => {
  for (const { name, praefix, parse } of GEGENPROBEN) {
    describe(name, () => {
      it('nimmt dieselbe Datei ohne DSV8-Inhalt als DSV7 an', () => {
        const result = parse(lies(`${praefix}-dsv7.dsv7`));

        expect(result.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
        expect(result.ok).toBe(true);
      });

      it('nimmt dieselbe Datei mit DSV8-Inhalt als DSV8 an', () => {
        const result = parse(lies(`${praefix}-dsv8.dsv8`));

        expect(result.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
        expect(result.ok).toBe(true);
      });

      /**
       * Der Kern der Sache. Diese Datei ist Zeile für Zeile dieselbe wie die
       * vorige — bis auf die Versionsnummer im FORMAT-Element. Ginge sie
       * durch, hiesse das, dass die Bibliothek DSV8-Inhalt in einer
       * DSV7-Datei stillschweigend annimmt.
       */
      it('beanstandet dieselbe Datei mit DSV8-Inhalt als DSV7', () => {
        const result = parse(lies(`${praefix}-verstoss.dsv7`));

        expect(result.ok).toBe(false);
        expect(result.diagnostics.filter((d) => d.severity === 'error').length).toBeGreaterThan(0);
      });

      /**
       * Die beiden DSV8-Dateien unterscheiden sich wirklich nur in der
       * Versionsnummer. Ohne diese Prüfung liesse sich die Gegenprobe
       * unbemerkt entwerten, indem die Verstossdatei zusätzlich einen ganz
       * anderen Fehler bekäme und schon deshalb beanstandet würde.
       */
      it('unterscheidet die beiden DSV8-Dateien allein in der Versionsnummer', () => {
        const alsDsv8 = lies(`${praefix}-dsv8.dsv8`);
        const alsDsv7 = lies(`${praefix}-verstoss.dsv7`);

        expect(alsDsv7).not.toEqual(alsDsv8);
        expect(alsDsv7.replace(/;7;/, ';8;')).toEqual(alsDsv8);
      });
    });
  }
});

/**
 * Der Abdeckungsnachweis.
 *
 * Jedes Element, jedes Feld und jeder Wert, den das Schema mit `since: 8`
 * markiert, muss in mindestens einer DSV8-Fixture tatsächlich vorkommen. Ohne
 * diese Prüfung bliebe eine Markierung möglich, die nie ausgeführt wird — sie
 * stünde im Schema, ohne dass je eine Datei sie belegt.
 *
 * Geprüft wird am geparsten Dokument, nicht am Dateitext: Ein Wert wie `D`
 * kommt in vielen Feldern vor, und nur die Zuordnung zu Element und Feld sagt
 * aus, ob die markierte Stelle gemeint ist.
 */
describe('DSV8-Abdeckung durch die synthetischen Fixtures', () => {
  /** Alle DSV8-Fixtures, nach Listenart gebündelt. */
  const FIXTURES: readonly { readonly listenart: string; readonly dateien: readonly string[] }[] = [
    {
      listenart: 'Wettkampfdefinitionsliste',
      dateien: [
        'lastschrift-dsv8.dsv8',
        'bankverbindung-dsv8.dsv8',
        'dsv8-neue-werte.dsv8',
        'delta-wettkampfdefinitionsliste-dsv8.dsv8',
        'delta-lastschrift-dsv8.dsv8',
        'delta-lastschrift-leer-dsv8.dsv8',
      ],
    },
    {
      listenart: 'Vereinsmeldeliste',
      dateien: [
        'vereinsmeldung.dsv8',
        'vereinsmeldung-knapp.dsv8',
        'delta-vereinsmeldeliste-dsv8.dsv8',
      ],
    },
    {
      listenart: 'Vereinsergebnisliste',
      dateien: [
        'vereinsergebnis.dsv8',
        'vereinsergebnis-knapp.dsv8',
        'delta-vereinsergebnisliste-dsv8.dsv8',
      ],
    },
    {
      listenart: 'Wettkampfergebnisliste',
      dateien: ['ergebnis-dsv8.dsv8', 'delta-wettkampfergebnisliste-dsv8.dsv8'],
    },
  ];

  const PARSER: Record<string, Parser> = {
    Wettkampfdefinitionsliste: parseWettkampfdefinitionsliste,
    Vereinsmeldeliste: parseVereinsmeldeliste,
    Vereinsergebnisliste: parseVereinsergebnisliste,
    Wettkampfergebnisliste: parseWettkampfergebnisliste,
  };

  /** Sammelt aus allen Fixtures einer Listenart, was sie belegen. */
  function belegt(listenart: string, dateien: readonly string[]): Set<string> {
    const gefunden = new Set<string>();
    const parse = PARSER[listenart];
    if (parse === undefined) throw new Error(`Kein Parser für ${listenart}`);

    for (const datei of dateien) {
      const records = parse(lies(datei)).document.records;

      for (const record of records) {
        gefunden.add(record.element);
        for (const [feld, wert] of Object.entries(record.values)) {
          if (wert === undefined || wert.trim() === '') continue;
          gefunden.add(`${record.element}.${feld}`);
          gefunden.add(`${record.element}.${feld}=${wert}`);
        }
      }
    }

    return gefunden;
  }

  for (const [listenart, schema] of DSV8_DELTA.map(([n, s]) => [n, s] as const)) {
    const eintrag = FIXTURES.find((f) => f.listenart === listenart);

    describe(listenart, () => {
      it('belegt jedes markierte Element, Feld und jeden markierten Wert', () => {
        expect(eintrag).toBeDefined();
        const gefunden = belegt(listenart, eintrag?.dateien ?? []);
        const { elemente, felder, werte } = markierungen(schema);

        const fehlend = [...elemente, ...felder, ...werte].filter((x) => !gefunden.has(x));

        expect(fehlend).toEqual([]);
      });
    });
  }

  /**
   * Optionale Delta-Felder müssen zusätzlich einmal leer vorkommen. Gesetzt
   * allein genügt nicht: Erst das leere Feld zeigt, dass sein Trennzeichen in
   * DSV8 auch dann dasteht, wenn kein Wert folgt.
   */
  it('zeigt jedes optionale Delta-Feld auch einmal leer', () => {
    const optionale: readonly (readonly [string, readonly string[], string, string])[] = [
      ['Wettkampfdefinitionsliste', ['delta-lastschrift-leer-dsv8.dsv8'], 'LASTSCHRIFT', 'hinweis'],
      ['Vereinsmeldeliste', ['vereinsmeldung-knapp.dsv8'], 'VEREIN', 'lastschrift'],
      ['Vereinsmeldeliste', ['vereinsmeldung.dsv8'], 'KARIMELDUNG', 'geschlecht'],
      ['Vereinsmeldeliste', ['vereinsmeldung.dsv8'], 'TRAINER', 'geschlecht'],
    ];

    for (const [listenart, dateien, element, feld] of optionale) {
      const parse = PARSER[listenart];
      if (parse === undefined) throw new Error(`Kein Parser für ${listenart}`);

      const leer = dateien
        .flatMap((d) => parse(lies(d)).document.records)
        .filter((r) => r.element === element)
        .some((r) => (r.values[feld] ?? '').trim() === '');

      expect(leer, `${element}.${feld} kommt in keiner Fixture leer vor`).toBe(true);
    }
  });
});
