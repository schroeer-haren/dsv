import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { lexLine } from '../../src/lexer/lex-line.js';

/** ZK erlaubt alle Zeichen ausser Semikolon und Zeilenumbruch (dsv8.md:251). */
const zk = fc.stringMatching(/^[^;\r\n]*$/);

describe('lexLine — Eigenschaften', () => {
  it('erhält die Feldwerte über Zerlegen und Zusammensetzen', () => {
    fc.assert(
      fc.property(fc.array(zk, { minLength: 1, maxLength: 12 }), (fields) => {
        const line = `X:${fields.join(';')};`;
        const lexed = lexLine(line, 1);
        if (lexed.kind !== 'element') throw new Error('erwartet: element');
        expect(lexed.rawFields).toEqual(fields);
      }),
    );
  });

  it('gibt für jede Elementzeile den Rohtext unverändert zurück', () => {
    fc.assert(
      fc.property(fc.array(zk, { maxLength: 6 }), (fields) => {
        const line = `X:${fields.join(';')};`;
        expect(lexLine(line, 1).raw).toBe(line);
      }),
    );
  });
});

describe('lexLine — Kommentar-Pfad', () => {
  /**
   * Die Property oben kann den Kommentar-Pfad nicht erreichen: Sie baut immer
   * Zeilen mit abschliessendem Semikolon, und `splitTrailingComment` verlangt,
   * dass die Zeile auf `*)` endet. Dieser Generator hängt deshalb gezielt einen
   * Kommentar an.
   */
  const kommentarInhalt = fc.stringMatching(/^[^;\r\n*]*$/);

  it('trennt einen angehängten Kommentar ab, ohne die Felder zu verändern', () => {
    fc.assert(
      fc.property(fc.array(zk, { minLength: 1, maxLength: 6 }), kommentarInhalt, (fields, text) => {
        const kommentar = `(*${text}*)`;
        const lexed = lexLine(`X:${fields.join(';')}; ${kommentar}`, 1);
        if (lexed.kind !== 'element') throw new Error('erwartet: element');
        expect(lexed.rawFields).toEqual(fields);
        expect(lexed.comment).toBe(` ${kommentar}`);
      }),
    );
  });

  it('behandelt einen Kommentar ohne vorangehendes Semikolon als Feldinhalt', () => {
    // Bewusste Grenze des Lexers: Ohne Terminator davor ist es kein Kommentar.
    const lexed = lexLine('X:wert (* kein Kommentar *)', 1);
    if (lexed.kind !== 'element') throw new Error('erwartet: element');
    expect(lexed.comment).toBeNull();
    expect(lexed.fields).toEqual(['wert (* kein Kommentar *)']);
  });
});
