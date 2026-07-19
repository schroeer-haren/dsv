import { describe, expect, it } from 'vitest';
import type { ParseResult } from '../src/document/types.js';
import { projectVereinsergebnisliste } from '../src/document/vereinsergebnisliste.js';
import { projectVereinsmeldeliste } from '../src/document/vereinsmeldeliste.js';
import { projectWettkampfdefinitionsliste } from '../src/document/wettkampfdefinitionsliste.js';
import { projectWettkampfergebnisliste } from '../src/document/wettkampfergebnisliste.js';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { parseVereinsergebnisliste } from '../src/parse/parse-vereinsergebnisliste.js';
import { parseVereinsmeldeliste } from '../src/parse/parse-vereinsmeldeliste.js';
import { parseWettkampfdefinitionsliste } from '../src/parse/parse-wettkampfdefinitionsliste.js';
import { parseWettkampfergebnisliste } from '../src/parse/parse-wettkampfergebnisliste.js';
import { writeDsv } from '../src/write/write-dsv.js';

/**
 * Die Bibliothek liest Dateien aus einem Dutzend fremder Programme. Sie muss
 * mit kaputten Eingaben umgehen, ohne zu werfen.
 *
 * Die Zusicherung lautet: **Keine Ausnahme.** Jede Eingabe liefert ein
 * Ergebnis, notfalls ein leeres Dokument mit Diagnostics. Die Stufe `fatal`
 * bezeichnet dabei nicht eine geworfene Ausnahme, sondern das Urteil "keine
 * verwertbare DSV-Datei" — sie steht in `diagnostics`, und nur die werfende
 * Bequemlichkeits-API `parseDsvOrThrow` macht daraus eine Ausnahme.
 *
 * Geprüft wird das für alle vier typisierten Parser und für den schema-freien.
 */

/** Eine Eingabe, die für jede Listenart passend erzeugt wird. */
interface Case {
  readonly name: string;
  readonly build: (listenart: string) => string;
}

/** Als Escape statt als Zeichen, sonst greift `no-irregular-whitespace`. */
const BOM = '\uFEFF';

/** Rund vier Megabyte in einem einzigen Feld. */
const HUGE_FIELD = 'A'.repeat(4 * 1024 * 1024);

const cases: readonly Case[] = [
  {
    name: 'abgeschnittene Zeile mitten im Feld',
    build: (l) => `FORMAT:${l};7;\r\nVERANSTALTUNG:Name;Ort`,
  },
  {
    name: 'zu viele Felder',
    build: (l) => `FORMAT:${l};7;9;9;9;9;9;9;9;9;\r\nDATEIENDE\r\n`,
  },
  { name: 'zu wenige Felder', build: (l) => `FORMAT:${l};\r\nDATEIENDE\r\n` },
  { name: 'vollständig leere Datei', build: () => '' },
  {
    name: 'nur Kommentare',
    build: () => '(* ein Kommentar *)\r\n(* noch einer *)\r\n',
  },
  {
    name: 'Datei mit BOM',
    build: (l) => `${BOM}FORMAT:${l};7;\r\nDATEIENDE\r\n`,
  },
  {
    name: 'gemischte Zeilenenden',
    build: (l) => `FORMAT:${l};7;\r\n(* CR LF oben, LF hier *)\nDATEIENDE\r\n`,
  },
  {
    name: 'sehr lange Zeile (mehrere Megabyte)',
    build: (l) => `FORMAT:${l};7;\r\nVERANSTALTUNG:${HUGE_FIELD};\r\nDATEIENDE\r\n`,
  },
  {
    name: 'ohne abschliessendes Zeilenende',
    build: (l) => `FORMAT:${l};7;\r\nDATEIENDE`,
  },
  { name: 'nur DATEIENDE', build: () => 'DATEIENDE\r\n' },
  {
    name: 'Nullbytes im Inhalt',
    build: (l) => `FORMAT:${l};7;\r\nVERANSTALTUNG:Na\0me;\0;\r\nDATEIENDE\r\n`,
  },
  {
    name: 'ungültiges UTF-8 (Ersatzzeichen)',
    build: (l) => `FORMAT:${l};7;\r\nVERANSTALTUNG:M�nchen;\r\nDATEIENDE\r\n`,
  },
  {
    name: 'Zeile aus ausschliesslich Semikola',
    build: (l) => `FORMAT:${l};7;\r\n;;;;;;;;\r\nDATEIENDE\r\n`,
  },
  {
    name: 'Elementname mit Sonderzeichen',
    build: (l) => `FORMAT:${l};7;\r\n(*!"§$%&/()=?:Wert;\r\nÄÖÜ-ß~\\|<>:Wert;\r\nDATEIENDE\r\n`,
  },
];

const parsers = [
  { name: 'parseDsv (schema-frei)', listenart: 'Wettkampfdefinitionsliste', parse: parseDsv },
  {
    name: 'parseWettkampfdefinitionsliste',
    listenart: 'Wettkampfdefinitionsliste',
    parse: parseWettkampfdefinitionsliste,
  },
  {
    name: 'parseWettkampfergebnisliste',
    listenart: 'Wettkampfergebnisliste',
    parse: parseWettkampfergebnisliste,
  },
  {
    name: 'parseVereinsmeldeliste',
    listenart: 'Vereinsmeldeliste',
    parse: parseVereinsmeldeliste,
  },
  {
    name: 'parseVereinsergebnisliste',
    listenart: 'Vereinsergebnisliste',
    parse: parseVereinsergebnisliste,
  },
] as const satisfies readonly {
  name: string;
  listenart: string;
  parse: (input: string) => ParseResult<unknown>;
}[];

describe.each(parsers)('$name gegen kaputte Eingaben', ({ listenart, parse }) => {
  it.each(cases)('$name wirft nicht und liefert ein Ergebnis', ({ build }) => {
    const input = build(listenart);

    // Die eigentliche Zusicherung: kein Wurf, unter keiner dieser Eingaben.
    const result = parse(input);

    expect(result).toBeDefined();
    expect(Array.isArray(result.diagnostics)).toBe(true);
    expect(result.document).toBeDefined();
    expect(typeof result.ok).toBe('boolean');
    // Ein nicht-ok Ergebnis muss auch begründet sein.
    if (!result.ok) {
      expect(result.diagnostics.length).toBeGreaterThan(0);
    }
  });
});

describe('schema-freies Lesen im Einzelnen', () => {
  it('meldet die leere Datei als fatal und liefert ein leeres Dokument', () => {
    const result = parseDsv('');

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toContain('empty-input');
    expect(result.diagnostics.some((d) => d.severity === 'fatal')).toBe(true);
    expect(result.document.items).toEqual([]);
  });

  it('nimmt die Datei nur mit Kommentaren an, ohne Element zu erfinden', () => {
    const result = parseDsv('(* nur ein Kommentar *)\r\n');

    expect(result.document.items.every((i) => i.kind === 'comment')).toBe(true);
    expect(result.document.listenart).toBeNull();
  });

  it('erkennt das BOM und hält es aus dem Inhalt heraus', () => {
    const result = parseDsv(`${BOM}FORMAT:Wettkampfdefinitionsliste;7;\r\nDATEIENDE\r\n`);

    expect(result.document.hasBom).toBe(true);
    expect(result.document.listenart).toBe('Wettkampfdefinitionsliste');
  });

  it('meldet das Ersatzzeichen als Hinweis auf die falsche Kodierung', () => {
    const result = parseDsv('FORMAT:Wettkampfdefinitionsliste;7;\r\nV:M�nchen;\r\nDATEIENDE\r\n');

    expect(result.diagnostics.map((d) => d.code)).toContain(
      'unknown-encoding-replacement-character',
    );
  });

  it('behält beide Zeilenenden getrennt bei', () => {
    const result = parseDsv('FORMAT:Wettkampfdefinitionsliste;7;\r\nDATEIENDE\n');

    expect(result.document.items.map((i) => i.eol)).toEqual(['\r\n', '\n']);
  });

  it('merkt sich das fehlende Zeilenende am Dateiende', () => {
    const result = parseDsv('FORMAT:Wettkampfdefinitionsliste;7;\r\nDATEIENDE');

    expect(result.document.items[result.document.items.length - 1]?.eol).toBe('');
  });

  it('behandelt die Zeile aus lauter Semikola als Element ohne Namen', () => {
    const result = parseDsv('FORMAT:Wettkampfdefinitionsliste;7;\r\n;;;;\r\nDATEIENDE\r\n');

    expect(result.document.items).toHaveLength(3);
  });

  it('verkraftet ein Feld von mehreren Megabyte', () => {
    const input = `FORMAT:Wettkampfdefinitionsliste;7;\r\nV:${HUGE_FIELD};\r\nDATEIENDE\r\n`;
    const result = parseDsv(input);

    expect(result.document.items).toHaveLength(3);
    const record = result.document.items[1];
    expect(record?.kind === 'element' && record.fields[0]?.length).toBe(HUGE_FIELD.length);
  });
});

/**
 * Formen, die kein echtes Programm erzeugt, aber ein beschädigter Transport
 * oder ein Fuzzer. Sie stehen hier vor allem als Wächter gegen quadratisches
 * Verhalten: Eine Zeile aus einer Million Semikola und ein Elementname von zwei
 * Megabyte finden eine versehentlich eingebaute Schleife über Schleife sofort.
 */
describe('pathologische Formen', () => {
  const pathological: readonly [name: string, input: string][] = [
    [
      'eine Million Semikola in einer Zeile',
      `FORMAT:Wettkampfdefinitionsliste;7;\r\nX:${';'.repeat(1_000_000)}\r\nDATEIENDE\r\n`,
    ],
    [
      'Elementname von zwei Megabyte',
      `FORMAT:Wettkampfdefinitionsliste;7;\r\n${'E'.repeat(2_000_000)}:a;\r\nDATEIENDE\r\n`,
    ],
    ['nur ein Doppelpunkt', 'FORMAT:Wettkampfdefinitionsliste;7;\r\n:\r\nDATEIENDE\r\n'],
    ['einzelnes CR ohne LF', 'FORMAT:Wettkampfdefinitionsliste;7;\rDATEIENDE\r'],
    [
      'einzelne Ersatzhälfte (lone surrogate)',
      'FORMAT:Wettkampfdefinitionsliste;7;\r\nV:\uD800;\r\nDATEIENDE\r\n',
    ],
    [
      'nicht geschlossener Kommentar',
      '(* nie geschlossen\r\nFORMAT:Wettkampfdefinitionsliste;7;\r\nDATEIENDE\r\n',
    ],
    ['unsinnig grosse Formatversion', 'FORMAT:Wettkampfdefinitionsliste;99999999999999999999;\r\n'],
    ['nur ein BOM', BOM],
    ['nur ein Zeilenende', '\r\n'],
  ];

  it.each(pathological)('%s wird gelesen, ohne zu werfen', (_name, input) => {
    const result = parseWettkampfdefinitionsliste(input);

    expect(result).toBeDefined();
    // Und bleibt schema-frei byte-identisch schreibbar.
    expect(writeDsv(parseDsv(input).document)).toBe(input);
  });
});

/**
 * Der Objektgraph ist die Ebene, die Nutzerinnen und Nutzer am häufigsten
 * anfassen. Sie bekommt hier dieselbe Zusicherung: Auch aus einer kaputten
 * Datei entsteht ein Ergebnis, kein Wurf.
 */
describe('Projektion in den Objektgraph gegen kaputte Eingaben', () => {
  const projections = [
    {
      name: 'Wettkampfdefinitionsliste',
      listenart: 'Wettkampfdefinitionsliste',
      run: (i: string) =>
        projectWettkampfdefinitionsliste(parseWettkampfdefinitionsliste(i).document),
    },
    {
      name: 'Wettkampfergebnisliste',
      listenart: 'Wettkampfergebnisliste',
      run: (i: string) => projectWettkampfergebnisliste(parseWettkampfergebnisliste(i).document),
    },
    {
      name: 'Vereinsmeldeliste',
      listenart: 'Vereinsmeldeliste',
      run: (i: string) => projectVereinsmeldeliste(parseVereinsmeldeliste(i).document),
    },
    {
      name: 'Vereinsergebnisliste',
      listenart: 'Vereinsergebnisliste',
      run: (i: string) => projectVereinsergebnisliste(parseVereinsergebnisliste(i).document),
    },
  ] as const;

  describe.each(projections)('$name', ({ listenart, run }) => {
    it.each(cases)('$name wirft nicht', ({ build }) => {
      const result = run(build(listenart));

      expect(result).toBeDefined();
      expect(Array.isArray(result.diagnostics)).toBe(true);
    });
  });
});

describe('Round-Trip auch bei kaputten Eingaben', () => {
  // Der schema-freie Weg sichert Byte-Identität zu. Das muss gerade dann
  // gelten, wenn die Eingabe merkwürdig ist — sonst verlöre ein Werkzeug beim
  // Durchreichen Inhalt, den es gar nicht verstehen musste.
  it.each(cases)('$name bleibt byte-identisch', ({ build }) => {
    const input = build('Wettkampfdefinitionsliste');

    expect(writeDsv(parseDsv(input).document)).toBe(input);
  });
});
