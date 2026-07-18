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
