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

describe('lexLine — Elementzeilen', () => {
  it('trennt Elementnamen und Felder', () => {
    const l = lexLine('WETTKAMPF:1;V;', 1);
    expect(l.kind).toBe('element');
    if (l.kind !== 'element') return;
    expect(l.element).toBe('WETTKAMPF');
    expect(l.fields).toEqual(['1', 'V']);
  });

  it('verwirft genau ein leeres Schlussfeld, nicht mehr', () => {
    const l = lexLine('A:1;;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['1', '']);
  });

  it('behält ein Feld ohne abschliessendes Trennzeichen', () => {
    const l = lexLine('STZWISCHENZEIT:21148;27;E', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['21148', '27', 'E']);
  });

  it('trimmt Werte, behält aber den Rohtext', () => {
    const l = lexLine('FORMAT: Wettkampfergebnisliste;7;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['Wettkampfergebnisliste', '7']);
    expect(l.rawFields).toEqual([' Wettkampfergebnisliste', '7']);
  });

  it('behandelt Anführungszeichen als gewöhnliche Zeichen', () => {
    const l = lexLine('VERANSTALTUNG:"Letzte Chance";Dresden;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields[0]).toBe('"Letzte Chance"');
  });

  it('erkennt DATEIENDE als Element ohne Doppelpunkt', () => {
    const l = lexLine('DATEIENDE', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.element).toBe('DATEIENDE');
    expect(l.bare).toBe(true);
    expect(l.fields).toEqual([]);
  });
});

describe('lexLine — Kommentar am Zeilenende', () => {
  it('trennt einen Kommentar hinter dem letzten Semikolon ab', () => {
    const l = lexLine('PNERGEBNIS:1;E;1011; (* Jahrgang 2007 *)', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['1', 'E', '1011']);
    expect(l.comment).toBe(' (* Jahrgang 2007 *)');
  });

  it('lässt ein (* innerhalb eines Feldes unangetastet', () => {
    const l = lexLine('VERANSTALTUNG:Cup (* kein Kommentar;Ort;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['Cup (* kein Kommentar', 'Ort']);
    expect(l.comment).toBeNull();
  });

  it('setzt comment auf null, wenn keiner vorhanden ist', () => {
    const l = lexLine('A:1;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.comment).toBeNull();
  });
});

describe('lexLine — Leerzeichen um Werte', () => {
  // Die Spec erlaubt führende und abschliessende Leerzeichen im Attribut
  // (dsv8.md:233); echte Dateien nutzen das. Der getrimmte Wert und der
  // Rohtext werden beide gebraucht.
  it('trimmt abschliessende Leerzeichen und behält sie im Rohtext', () => {
    const l = lexLine('A:wert ;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['wert']);
    expect(l.rawFields).toEqual(['wert ']);
  });

  it('macht aus einem Feld nur aus Leerzeichen einen leeren Wert', () => {
    // Kommt in echten Dateien vor; entscheidet, ob das Attribut als
    // „nicht angegeben" gilt.
    const l = lexLine('A: ;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['']);
    expect(l.rawFields).toEqual([' ']);
  });

  it('lässt Leerzeichen innerhalb eines Wertes unangetastet', () => {
    const l = lexLine('VERANSTALTUNG:Alter Fritz 2026;', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['Alter Fritz 2026']);
  });
});

describe('lexLine — Zeilen ohne Doppelpunkt', () => {
  it('behandelt jede Zeile ohne Doppelpunkt als attributloses Element', () => {
    // Bewusste Festlegung: Der Lexer kennt keine Elementnamen. Ob es sich
    // tatsächlich um DATEIENDE handelt, entscheidet der Parser.
    const l = lexLine('Irgendein Fliesstext', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.bare).toBe(true);
    expect(l.element).toBe('Irgendein Fliesstext');
    expect(l.fields).toEqual([]);
  });
});
