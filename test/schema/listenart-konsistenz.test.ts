import { describe, expect, it } from 'vitest';

import { DSV8_DELTA } from './dsv8-delta.js';
import type { FieldDef } from '../../src/schema/types.js';

/**
 * Zusicherungen, die über alle vier Listenarten hinweg gelten müssen.
 *
 * Die vier Schemata sind analog aufgebaut und weitgehend voneinander
 * abgeschrieben. Genau das macht sie anfällig: Ein Wert, der in einer Listenart
 * versehentlich mitgeschleppt wird, und eine Fundstelle, die beim Kopieren aus
 * dem Nachbarkapitel stehen bleibt, fallen in den je Listenart getrennten Tests
 * nicht auf, weil dort jede für sich betrachtet stimmig aussieht. Was hier
 * steht, vergleicht sie deshalb gegeneinander.
 */

/** Ein Feld samt der Listenart und dem Element, aus dem es stammt. */
interface Fundort {
  readonly listenart: string;
  readonly element: string;
  readonly feld: FieldDef;
}

/** Alle Felder aller vier Listenarten, mit ihrer Herkunft benannt. */
function alleFelder(): readonly Fundort[] {
  return DSV8_DELTA.flatMap(([listenart, schema]) =>
    schema.elements.flatMap(({ def }) =>
      def.fields.map((feld) => ({ listenart, element: def.name, feld })),
    ),
  );
}

/** Die Werte eines Feldes als vergleichbare Zeichenkette. */
function werte(feld: FieldDef): string {
  return (feld.values ?? []).map((v) => `${v.value}${v.tolerated === true ? '?' : ''}`).join(',');
}

describe('qualifikationswettkampfart über alle Listenarten', () => {
  /**
   * Aus einem Aus- oder Nachschwimmen qualifiziert man sich nicht weiter. Alle
   * vier Wertetabellen der Spezifikation sagen das übereinstimmend und führen
   * nur V, Z, F und E (dsv8.md:1119, 1815, 3177, 4826) — anders als das
   * Nachbarfeld `wettkampfart`, das A und N kennt.
   *
   * Der Test steht hier, weil sich der Fehler nur im Vergleich zeigt: Zwei
   * Listenarten teilten sich für dieses Feld versehentlich die Konstante des
   * Nachbarfeldes und tolerierten dadurch A und N, die beiden anderen nicht.
   */
  const felder = alleFelder().filter(({ feld }) => feld.name === 'qualifikationswettkampfart');

  it('kommt in allen vier Listenarten vor', () => {
    expect(felder.map((f) => f.listenart)).toEqual([
      'Wettkampfdefinitionsliste',
      'Vereinsmeldeliste',
      'Vereinsergebnisliste',
      'Wettkampfergebnisliste',
    ]);
  });

  it('führt überall dieselbe Werteliste', () => {
    const je = felder.map(
      ({ listenart, element, feld }) => `${listenart}.${element}: ${werte(feld)}`,
    );

    expect(je).toEqual([
      'Wettkampfdefinitionsliste.WETTKAMPF: V,Z,F,E',
      'Vereinsmeldeliste.WETTKAMPF: V,Z,F,E',
      'Vereinsergebnisliste.WETTKAMPF: V,Z,F,E',
      'Wettkampfergebnisliste.WETTKAMPF: V,Z,F,E',
    ]);
  });

  it('kennt weder Ausschwimmen noch Nachschwimmen', () => {
    for (const { listenart, feld } of felder) {
      expect(
        (feld.values ?? []).map((v) => v.value),
        listenart,
      ).not.toContain('A');
      expect(
        (feld.values ?? []).map((v) => v.value),
        listenart,
      ).not.toContain('N');
    }
  });
});

/**
 * Der Zeilenbereich, in dem das Kapitel einer Listenart in `spec/dsv8.md`
 * steht. Untergrenze ist die Zeile mit dem `FORMAT:`-Element der Tabelle,
 * Obergrenze die Zeile, in der das Beispiel des Kapitels beginnt.
 *
 * Eine Fundstelle ausserhalb dieses Bereichs zeigt in ein fremdes Kapitel. Das
 * ist der plausibelste Fehler beim Anlegen von vier analogen Schemata, und er
 * bleibt unbemerkt, solange die Zeile im Nachbarkapitel zufällig etwas
 * Ähnliches beschreibt — die Kapitel sind einander sehr ähnlich.
 */
const KAPITEL: Readonly<Record<string, readonly [number, number]>> = {
  Wettkampfdefinitionsliste: [353, 1445],
  Vereinsmeldeliste: [1523, 2588],
  Vereinsergebnisliste: [2673, 4240],
  Wettkampfergebnisliste: [4323, 5837],
};

describe('Fundstellen liegen im Kapitel ihrer Listenart', () => {
  it('deckt alle vier Listenarten ab', () => {
    expect(Object.keys(KAPITEL)).toEqual(DSV8_DELTA.map(([name]) => name));
  });

  it.each(DSV8_DELTA.map(([name]) => name))('%s', (listenart) => {
    const [von, bis] = KAPITEL[listenart] ?? [0, 0];
    const fremd = alleFelder()
      .filter((f) => f.listenart === listenart)
      .filter(({ feld }) => {
        const nr = Number(feld.specRef.split(':')[1]);
        return nr < von || nr > bis;
      })
      .map(({ element, feld }) => `${element}.${feld.name} -> ${feld.specRef}`);

    expect(fremd).toEqual([]);
  });
});
