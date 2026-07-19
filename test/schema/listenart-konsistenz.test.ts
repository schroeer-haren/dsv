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

describe('FORMAT.listart nennt seine eigene Listenart', () => {
  /**
   * Die selbstbezügliche Probe: Der Doc-Kommentar von `FORMAT.listart` muss
   * den Namen der Listenart nennen, zu der das Schema gehört. Sie fängt das
   * Schema, das aus einem Nachbarkapitel kopiert wurde, ohne dass der Name
   * mitgezogen ist.
   *
   * Drei der vier Listenarten prüften das je für sich; der
   * Wettkampfdefinitionsliste fehlte es. Hier gilt es für alle vier zugleich
   * und kann deshalb beim Anlegen einer weiteren nicht mehr vergessen werden.
   */
  it.each(DSV8_DELTA.map(([name]) => name))('%s', (listenart) => {
    const schema = DSV8_DELTA.find(([name]) => name === listenart)?.[1];
    const format = schema?.elements.find(({ def }) => def.name === 'FORMAT')?.def;
    const listart = format?.fields.find((f) => f.name === 'listart');

    expect(listart?.doc).toContain(listenart);
  });
});

describe('KAMPFGERICHT.position in beiden Ergebnislisten', () => {
  /**
   * Die beiden Ergebnislisten führen dasselbe Element mit derselben
   * Wertetabelle, und beide Kapitel enthalten dieselbe Beispielzeile
   * `KAMPFGERICHT:1;SPR;…` (dsv8.md:4255 und 5852), die mit `SPR` einen Wert
   * schreibt, den die Wertetabelle nicht führt.
   *
   * Die Tolerierung von `SPR` stand deshalb lange nur in der
   * Wettkampfergebnisliste — dort gibt es zusätzlich einen Realbeleg, während
   * es überhaupt keine echten Vereinsergebnislisten gibt. Der fehlende
   * Realbeleg ist aber kein Gegenbeleg, und die Beispielzeile gilt für beide
   * gleich. Dass die beiden nicht wieder auseinanderlaufen, hält dieser Test
   * fest.
   */
  const felder = alleFelder().filter(
    ({ element, feld }) => element === 'KAMPFGERICHT' && feld.name === 'position',
  );

  it('kommt in genau den beiden Ergebnislisten vor', () => {
    expect(felder.map((f) => f.listenart)).toEqual([
      'Vereinsergebnisliste',
      'Wettkampfergebnisliste',
    ]);
  });

  it('führt in beiden dieselbe Werteliste, mit SPR als einzigem tolerierten Wert', () => {
    const [vel, wel] = felder;

    expect(werte(vel?.feld ?? ({} as FieldDef))).toBe(werte(wel?.feld ?? ({} as FieldDef)));
    expect(werte(vel?.feld ?? ({} as FieldDef))).toBe(
      'SCH,STA,ZRO,ZR,ZNO,ZN,RZN,SR,WRO,WR,AUS,SP,PKF,STO,WKH,ASCH,SIB,SAUF,VER,ZBV,SPR?',
    );
  });
});

describe('Bereiche am WETTKAMPF über alle Listenarten', () => {
  /**
   * Die Zahlenbereiche des WETTKAMPF, festgehalten für alle vier Listenarten
   * zugleich. Sie stehen in jeder Listenart gleich in der Spezifikation, und
   * genau das prüft hier niemand sonst: Die je Listenart getrennten Tests
   * führten sie nur für Vereinsmelde- und Vereinsergebnisliste, sodass sich
   * `range` in den beiden anderen ersatzlos streichen liess, ohne dass ein
   * Test rot wurde. Die Werteprüfung fängt das nicht — sie ist über die
   * Wettkampfdefinitionsliste eingespannt und sieht die anderen Schemata nie.
   */
  const ERWARTET: readonly (readonly [string, { min: number; max: number }])[] = [
    ['wettkampfnr', { min: 0, max: 999 }],
    ['abschnittsnr', { min: 0, max: 99 }],
    ['einzelstrecke', { min: 0, max: 25000 }],
    ['qualifikationswettkampfnr', { min: 0, max: 999 }],
  ];

  it.each(DSV8_DELTA.map(([name]) => name))('%s', (listenart) => {
    const schema = DSV8_DELTA.find(([name]) => name === listenart)?.[1];
    const wettkampf = schema?.elements.find(({ def }) => def.name === 'WETTKAMPF')?.def;

    const gefunden = (wettkampf?.fields ?? [])
      .filter((f) => f.range !== undefined)
      .map((f) => [f.name, f.range] as const);

    expect(gefunden).toEqual(ERWARTET);
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

/**
 * Gleichnamige Felder müssen denselben Code auch gleich beschreiben.
 *
 * Die Doc-Texte der Werte landen als JSDoc in der ausgelieferten öffentlichen
 * API. Weichen zwei Listenarten für denselben Code voneinander ab, ist
 * mindestens eine von beiden falsch — und wer sich auf die falsche verlässt,
 * schreibt inhaltlich falsche Dateien, ohne dass die Validierung anschlägt:
 * der Wertevorrat stimmt ja.
 *
 * Genau so waren im Kampfgericht `ZRO` und `ZNO` paarweise vertauscht (Spec:
 * `ZRO = Zielrichterobmann`, `ZNO = Zeitnehmerobmann`, dsv8.md:2085-2093) und
 * `GL` in zwei von vier Listenarten als „Gleichgültig" statt „ganze Lage"
 * beschrieben (dsv8.md:1764) — jeweils zwei Listenarten richtig, zwei falsch.
 * Beide Male hätte dieser Vergleich es sofort gezeigt — er hat beim Anlegen
 * ausserdem `grundDerNichtwertung.ZU` („zurückgezogen" statt
 * „Zeitüberschreitung", dsv8.md:3566) und die drei Codes von
 * `erhoehtesNachtraeglichesMeldegeld` (dsv8.md:3579) gefunden.
 *
 * Nicht jede Abweichung ist ein Fehler: Manche gleichnamigen Felder gehören zu
 * verschiedenen Elementen und bedeuten dort tatsächlich Verschiedenes. Die
 * sind unten einzeln aufgeführt und begründet — was dort nicht steht, gilt als
 * Fehler.
 */
const ERLAUBTE_ABWEICHUNGEN: readonly string[] = [
  // NACHWEIS.bahnlaenge schränkt ein, welche Bahnlänge als Nachweis zählt
  // (dsv8.md:1093); WETTKAMPF.bahnlaenge benennt die Bahn selbst.
  'bahnlaenge.25',
  'bahnlaenge.50',
  // `geschlecht` steht sowohl an Wettkampf- als auch an Personenelementen: bei
  // Wettkämpfen meint X die gemischte Austragung, bei Personen die gemischte
  // Wertung einer Staffel.
  'geschlecht.X',
  // `art` trägt das Vorzeichen einmal einer Reaktionszeit (Start relativ zum
  // Signal), einmal einer Ablöse-/Zwischenzeit (schlicht das Vorzeichen).
  'art.+',
  'art.-',
  // Beide Texte beschreiben dieselbe Toleranz, nennen aber die Fundstelle des
  // jeweils eigenen Kapitels.
  'position.SPR',
];

describe('gleichnamige Felder beschreiben gleiche Codes gleich', () => {
  it('führt keine widersprüchlichen Doc-Texte', () => {
    /** Feldname -> Code -> Doc-Text -> Fundorte. */
    const docs = new Map<string, Map<string, Map<string, string[]>>>();

    for (const { listenart, element, feld } of alleFelder()) {
      const proFeld = docs.get(feld.name) ?? new Map<string, Map<string, string[]>>();
      docs.set(feld.name, proFeld);
      for (const wert of feld.values ?? []) {
        const proCode = proFeld.get(wert.value) ?? new Map<string, string[]>();
        proFeld.set(wert.value, proCode);
        proCode.set(wert.doc, [...(proCode.get(wert.doc) ?? []), `${listenart}.${element}`]);
      }
    }

    const widersprueche: string[] = [];
    for (const [feldname, proFeld] of docs) {
      for (const [code, proDoc] of proFeld) {
        if (proDoc.size <= 1) continue;
        if (ERLAUBTE_ABWEICHUNGEN.includes(`${feldname}.${code}`)) continue;
        widersprueche.push(`${feldname}.${code}: ${[...proDoc.keys()].join(' | ')}`);
      }
    }

    expect(widersprueche).toEqual([]);
  });
});
