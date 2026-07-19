import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DSV8_DELTA } from './dsv8-delta.js';
import type { FieldDef } from '../../src/schema/types.js';

const SPEC = join(import.meta.dirname, '..', '..', 'spec');

const dsv8 = readFileSync(join(SPEC, 'dsv8.md'), 'utf8').split('\n');
const dsv7 = readFileSync(join(SPEC, 'dsv7.md'), 'utf8').split('\n');

/** Die Zeile einer Fundstelle, ohne umgebende Leerzeichen. */
const zeile = (datei: readonly string[], nr: number): string => (datei[nr - 1] ?? '').trim();

/** Zerlegt `dsv8.md:791` in seine Zeilennummer. */
function zeilennummer(specRef: string): number {
  const treffer = /^dsv8\.md:(\d+)$/.exec(specRef);
  if (treffer?.[1] === undefined) throw new Error(`Unbrauchbare Fundstelle: ${specRef}`);
  return Number(treffer[1]);
}

/**
 * Zeilen, die nichts beschreiben: Seitenzahlen, die Fusszeile und die
 * Trennstriche, die die Textextraktion zwischen den Seiten stehen lässt.
 *
 * Eine Fundstelle, die auf so eine Zeile zeigt, ist wertlos — sie sagt nur,
 * dass irgendwo in der Nähe etwas stehen könnte.
 */
function istFuellzeile(text: string): boolean {
  return (
    text === '' ||
    text === '-' ||
    /^\d+ \/ \d+$/.test(text) ||
    text.startsWith('Abteilung Wettkampfsport')
  );
}

/** Alle Felder aller vier Listenarten, mit ihrer Herkunft benannt. */
function alleFelder(): readonly { readonly pfad: string; readonly feld: FieldDef }[] {
  return DSV8_DELTA.flatMap(([listenart, schema]) =>
    schema.elements.flatMap(({ def }) =>
      def.fields.map((feld) => ({ pfad: `${listenart}.${def.name}.${feld.name}`, feld })),
    ),
  );
}

describe('Fundstellen im Schema', () => {
  /**
   * Der breite Durchgang über alle Felder, nicht nur die des Deltas. Er fängt
   * die Fundstelle ab, die auf eine Seitenzahl oder die Fusszeile zeigt — der
   * häufigste Fehler, wenn man Zeilennummern aus einer PDF-Textextraktion
   * abliest, weil die Tabellen dort über Seitenumbrüche zerrissen sind.
   */
  it('zeigt für jedes Feld auf eine Zeile mit Inhalt', () => {
    const wertlos = alleFelder()
      .filter(({ feld }) => istFuellzeile(zeile(dsv8, zeilennummer(feld.specRef))))
      .map(({ pfad, feld }) => `${pfad} -> ${feld.specRef}`);

    expect(wertlos).toEqual([]);
  });

  it('verweist ausschliesslich auf dsv8.md', () => {
    const fremd = alleFelder()
      .filter(({ feld }) => !/^dsv8\.md:\d+$/.test(feld.specRef))
      .map(({ pfad, feld }) => `${pfad} -> ${feld.specRef}`);

    expect(fremd).toEqual([]);
  });
});

/**
 * Der zeilengenaue Abgleich für die Stellen des Deltas.
 *
 * Für jedes Feld, das DSV8 einführt, und für jeden Wert, den DSV8 ergänzt,
 * steht hier die Zeile, die es in `spec/dsv8.md` tatsächlich beschreibt, samt
 * ihrem Wortlaut. Ein blosser Zeilenverweis liesse sich nicht nachprüfen; der
 * mitgeführte Wortlaut macht die Prüfung scharf und überlebt eine Neuextraktion
 * der Spezifikation nicht stillschweigend.
 */
describe('Zeilengenauer Abgleich der DSV8-Stellen', () => {
  /** Felder und Elemente, die DSV8 einführt, mit Fundstelle und Wortlaut. */
  const FELDER: readonly (readonly [string, number, string])[] = [
    ['BANKVERBINDUNG.kontoinhaber', 791, 'Kontoinhaber  ZK'],
    ['LASTSCHRIFT (Element)', 801, 'LASTSCHRIFT:'],
    ['LASTSCHRIFT.hinweis', 813, 'Hinweis'],
    ['VEREIN.lastschrift', 1863, 'Lastschrift'],
    ['KARIMELDUNG.geschlecht', 2018, 'Geschlecht des'],
    ['TRAINER.geschlecht', 2145, 'Geschlecht des'],
  ];

  it.each(FELDER)('%s steht in dsv8.md:%i', (_name, nr, wortlaut) => {
    expect(zeile(dsv8, nr)).toBe(wortlaut);
  });

  /**
   * Die Werte des Deltas. Neben der Fundstelle in DSV8 steht, ob DSV7 den Wert
   * an dieser Stelle kennt — bei den Kicks nirgends, bei divers je nach Feld.
   */
  const WERTE: readonly (readonly [string, number, string])[] = [
    [
      'Wettkampfdefinitionsliste WETTKAMPF.ausuebung=KB',
      1070,
      'KB = Kicks Bauchlage (nur Technik = S)',
    ],
    [
      'Wettkampfdefinitionsliste WETTKAMPF.ausuebung=KR',
      1072,
      'KR = Kicks Rückenlage (nur Technik = S)',
    ],
    ['Wettkampfdefinitionsliste WETTKAMPF.geschlecht=D', 1092, 'D = divers'],
    [
      'Wettkampfdefinitionsliste MELDEGELD.meldegeldTyp=Teilnehmermeldegeld',
      1378,
      'Teilnehmermeldegeld',
    ],
    [
      'Wettkampfdefinitionsliste MELDEGELD.meldegeldTyp=Abschnittspauschale',
      1380,
      'Abschnittspauschale',
    ],
    ['Vereinsmeldeliste WETTKAMPF.ausuebung=KB', 1774, 'KB = Kicks Bauchlage (nur Technik = S)'],
    ['Vereinsmeldeliste WETTKAMPF.ausuebung=KR', 1776, 'KR = Kicks Rückenlage (nur Technik = S)'],
    ['Vereinsmeldeliste WETTKAMPF.geschlecht=D', 1791, 'D = divers'],
    ['Vereinsergebnisliste WETTKAMPF.ausuebung=KB', 3120, 'KB = Kicks Bauchlage (nur Technik = S)'],
    [
      'Vereinsergebnisliste WETTKAMPF.ausuebung=KR',
      3122,
      'KR = Kicks Rückenlage (nur Technik = S)',
    ],
    ['Vereinsergebnisliste WETTKAMPF.geschlecht=D', 3143, 'D = divers'],
    ['Vereinsergebnisliste WERTUNG.geschlecht=D', 3285, 'D = divers'],
    [
      'Wettkampfergebnisliste WETTKAMPF.ausuebung=KB',
      4779,
      'KB = Kicks Bauchlage (nur Technik = S)',
    ],
    [
      'Wettkampfergebnisliste WETTKAMPF.ausuebung=KR',
      4781,
      'KR = Kicks Rückenlage (nur Technik = S)',
    ],
    ['Wettkampfergebnisliste WERTUNG.geschlecht=D', 4942, 'D = divers'],
  ];

  it.each(WERTE)('%s steht in dsv8.md:%i', (_name, nr, wortlaut) => {
    expect(zeile(dsv8, nr)).toBe(wortlaut);
  });

  it('führt für jeden markierten Wert genau eine Fundstelle', () => {
    const markierteWerte = DSV8_DELTA.flatMap(([, schema]) =>
      schema.elements.flatMap(({ def }) =>
        def.fields.flatMap((f) => (f.values ?? []).filter((v) => v.since === 8)),
      ),
    );

    expect(WERTE).toHaveLength(markierteWerte.length);
  });

  /**
   * Die Gegenrechnung an beiden Spezifikationen. Sie ist der Grund, dass die
   * Erhebung des Deltas nachprüfbar bleibt: Die Kicks kommen in DSV7
   * überhaupt nicht vor, divers gibt es dort achtmal und in DSV8 fünfzehnmal.
   * Die Differenz von sieben ist genau das, was oben an divers-Stellen steht —
   * fünf ergänzte Werte plus die beiden Geschlechtsfelder von KARIMELDUNG und
   * TRAINER, die es in DSV7 gar nicht gibt.
   */
  it('deckt sich mit der Zählung über beide Spezifikationen', () => {
    const zaehle = (datei: readonly string[], muster: RegExp): number =>
      datei.filter((z) => muster.test(z.trim())).length;

    expect(zaehle(dsv7, /^K[BR] = Kicks/)).toBe(0);
    expect(zaehle(dsv8, /^K[BR] = Kicks/)).toBe(8);

    expect(zaehle(dsv7, /^D = divers$/)).toBe(8);
    expect(zaehle(dsv8, /^D = divers$/)).toBe(15);

    expect(zaehle(dsv7, /^(Teilnehmermeldegeld|Abschnittspauschale)$/)).toBe(0);
    expect(zaehle(dsv8, /^(Teilnehmermeldegeld|Abschnittspauschale)$/)).toBe(2);
  });

  /**
   * Die Umdeutung von MELDEGELDPAUSCHALE, an ihren beiden Fundstellen
   * festgehalten. Sie ist der einzige Unterschied des Deltas, der sich in
   * keiner Markierung niederschlägt.
   */
  it('hält die geänderte Bedeutung der Meldegeldpauschale an beiden Fundstellen fest', () => {
    expect(zeile(dsv7, 1317)).toBe('Ein pauschaler Betrag, der pro Meldung hinzukommt');
    expect(zeile(dsv8, 1403)).toBe('Ein pauschaler Betrag, der pro Verein hinzukommt');
  });
});
