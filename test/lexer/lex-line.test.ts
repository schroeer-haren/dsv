import { describe, expect, it } from 'vitest';
import { lexLine } from '../../src/lexer/lex-line.js';

describe('lexLine — Kommentare und Leerzeilen', () => {
  it('erkennt eine Kommentarzeile', () => {
    expect(lexLine('(* erzeugt mit EasyWk *)', 1).kind).toBe('comment');
  });

  it('erkennt eine eingerückte Kommentarzeile', () => {
    expect(lexLine('   (* x *)', 1).kind).toBe('comment');
  });

  it('erkennt eine leere Zeile', () => {
    expect(lexLine('', 1).kind).toBe('blank');
    expect(lexLine('   ', 1).kind).toBe('blank');
  });

  it('behält die Originalzeile bei', () => {
    expect(lexLine('   (* x *)', 7).raw).toBe('   (* x *)');
    expect(lexLine('   (* x *)', 7).line).toBe(7);
  });
});
