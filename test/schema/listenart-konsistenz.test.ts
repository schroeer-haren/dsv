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

/**
 * Die Werte eines Feldes als vergleichbare Zeichenkette.
 *
 * `?` markiert einen tolerierten Wert (beim Lesen `warning`, beim Schreiben
 * gesperrt), `~` eine Lücke der Vorlage (beim Lesen `info`, beim Schreiben
 * erlaubt). Der Unterschied gehört in die Zeichenkette, weil er das Verhalten
 * bestimmt: Ein Vergleich, der nur die Codes führte, hielte eine Verschiebung
 * zwischen den beiden Markierungen für unverändert.
 */
function werte(feld: FieldDef): string {
  return (feld.values ?? [])
    .map((v) => `${v.value}${v.tolerated === true ? '?' : ''}${v.specGap === true ? '~' : ''}`)
    .join(',');
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

describe('wettkampfart über alle Listenarten', () => {
  /**
   * `A` (Ausschwimmen) und `N` (Nachschwimmen) an jedem `wettkampfart`-Feld
   * aller vier Listenarten, samt Markierung.
   *
   * Die Wertetabellen der Spezifikation taugen für dieses Feld nicht als
   * Aufzählung des erlaubten Vorrats — sie widersprechen sich innerhalb
   * desselben Standards. Dasselbe Element WERTUNG mit demselben Feld führt
   * `A` und `N` in der Wettkampfergebnisliste (dsv8.md:4913-4919,
   * dsv7.md:4749-4755) und lässt sie in der Vereinsergebnisliste weg
   * (dsv8.md:3231-3235, dsv7.md:3075-3079). Beide Listen beschreiben
   * dieselbe Veranstaltung, einmal aus Sicht des Ausrichters, einmal aus
   * Sicht des Vereins; ein sachlicher Grund für den Unterschied ist nicht
   * denkbar. Ein Verbot spricht ausserdem in keiner der beiden Fassungen aus:
   * die einzigen Fundstellen von „Ausschwimmen" sind Zeilen der Wertetabellen.
   *
   * Wo eine Tabelle die beiden also weglässt, ist das eine Auslassung der
   * Vorlage und kein Ausschluss — mithin `specGap`, nicht `tolerated`. Der
   * Bestand echter Dateien bestätigt es an beiden Enden: Das DSV-Portal selbst
   * schreibt `WETTKAMPF: 102;N` in eine Wettkampfdefinitionsliste
   * (dsvportal-13062024-Wk.dsv7:31-33), und eine Vereinsmeldeliste antwortet
   * mit `WETTKAMPF: 903;A` (2026-06-28-Gera-SVHaren-Me.dsv7:25).
   *
   * Die Liste unten hält jede einzelne Markierung fest. Sie ist der Wächter
   * gegen eine einseitige Änderung: Wer `A`/`N` in einer Listenart wieder auf
   * `tolerated` zurückdreht oder sie in einer weiteren Listenart markiert,
   * ohne die Begründung über alle vier zu prüfen, bekommt hier einen roten
   * Test statt einer stillen Uneinheitlichkeit.
   */
  const felder = alleFelder().filter(({ feld }) => feld.name === 'wettkampfart');

  it('führt überall genau die sechs Wettkampfarten', () => {
    for (const { listenart, element, feld } of felder) {
      expect(
        (feld.values ?? []).map((v) => v.value),
        `${listenart}.${element}`,
      ).toEqual(['V', 'Z', 'F', 'E', 'A', 'N']);
    }
  });

  it('markiert A und N nirgends als toleriert', () => {
    /**
     * Die harte Grenze: `tolerated` sperrt das Schreiben. Ein Ausrichter
     * könnte dann kein Nachschwimmen ausschreiben, obwohl das DSV-Portal
     * genau das tut — die Bibliothek könnte dessen eigene Datei lesen, aber
     * nicht wieder erzeugen. Das ist kein Mangel der Datei, sondern einer der
     * Vorlage, und `write…PreservingDefects` ist dafür nicht der richtige Weg:
     * dieser Durchgriff ist für Mängel eingelesener Dateien gedacht, nicht
     * dafür, einen sachlich einwandfreien Wettkampf neu anzulegen.
     */
    const toleriert = felder
      .filter(({ feld }) => (feld.values ?? []).some((v) => v.tolerated === true))
      .map(({ listenart, element }) => `${listenart}.${element}`);

    expect(toleriert).toEqual([]);
  });

  it('markiert genau die Stellen als specGap, an denen die Spezifikation A und N auslässt', () => {
    const je = felder.map(
      ({ listenart, element, feld }) => `${listenart}.${element}: ${werte(feld)}`,
    );

    expect(je).toEqual([
      // Die Wettkampfdefinitionsliste lässt A und N in jeder ihrer drei
      // Wertetabellen weg (dsv8.md:1015, 1197, 1276) — belegt vorkommen tun
      // sie trotzdem. Eine Ausschreibung ist die Quelle der Wettkampfnummern;
      // könnte sie die Art A nicht ausdrücken, könnte ein Ausschwimmen nie
      // in einer Ergebnisliste auftauchen, wo die Spezifikation es ausdrücklich
      // vorsieht.
      'Wettkampfdefinitionsliste.WETTKAMPF: V,Z,F,E,A~,N~',
      'Wettkampfdefinitionsliste.WERTUNG: V,Z,F,E,A~,N~',
      'Wettkampfdefinitionsliste.PFLICHTZEIT: V,Z,F,E,A~,N~',
      // Die Vereinsmeldeliste wiederholt die Wettkampfdefinitionen, auf die
      // sie meldet (dsv8.md:1729). Sie muss ausdrücken können, was dort steht.
      'Vereinsmeldeliste.WETTKAMPF: V,Z,F,E,A~,N~',
      // In der Vereinsergebnisliste führt allein die WERTUNG A und N nicht
      // (dsv8.md:3231) — ihr eigenes WETTKAMPF nennt sie (dsv8.md:3054-3059),
      // und das gleichnamige Element der Wettkampfergebnisliste ebenso.
      'Vereinsergebnisliste.WETTKAMPF: V,Z,F,E,A,N',
      'Vereinsergebnisliste.WERTUNG: V,Z,F,E,A~,N~',
      'Vereinsergebnisliste.PERSONENERGEBNIS: V,Z,F,E,A,N',
      'Vereinsergebnisliste.PNZWISCHENZEIT: V,Z,F,E,A,N',
      'Vereinsergebnisliste.PNREAKTION: V,Z,F,E,A,N',
      'Vereinsergebnisliste.STAFFELPERSON: V,Z,F,E,A,N',
      'Vereinsergebnisliste.STAFFELERGEBNIS: V,Z,F,E,A,N',
      'Vereinsergebnisliste.STZWISCHENZEIT: V,Z,F,E,A,N',
      'Vereinsergebnisliste.STABLOESE: V,Z,F,E,A,N',
      // Die Wettkampfergebnisliste führt A und N durchgehend regulär
      // (dsv8.md:4736-4741 und fort).
      'Wettkampfergebnisliste.WETTKAMPF: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.WERTUNG: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.PNERGEBNIS: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.PNZWISCHENZEIT: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.PNREAKTION: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.STERGEBNIS: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.STAFFELPERSON: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.STZWISCHENZEIT: V,Z,F,E,A,N',
      'Wettkampfergebnisliste.STABLOESE: V,Z,F,E,A,N',
    ]);
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
