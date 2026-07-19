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

  it('nimmt bei mehreren Kommentaren den letzten, dem ein Semikolon vorausgeht', () => {
    const l = lexLine('A:1;(* a *);(* b *)', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['1', '(* a *)']);
    expect(l.comment).toBe('(* b *)');
  });

  it('weicht auf ein früheres (* aus, wenn dem letzten kein Semikolon vorausgeht', () => {
    const l = lexLine('A:1; (* a *) (* b *)', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.fields).toEqual(['1']);
    expect(l.comment).toBe(' (* a *) (* b *)');
  });

  it('erkennt keinen Kommentar ohne abschliessendes *)', () => {
    const l = lexLine('A:1; (* offen', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.comment).toBeNull();
  });

  it('erkennt keinen Kommentar, wenn hinter *) noch Text steht', () => {
    const l = lexLine('A:1; (* x *) y', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.comment).toBeNull();
  });

  it('verlangt ein Semikolon unmittelbar vor dem Kommentar', () => {
    const l = lexLine('A:1;wert (* x *)', 1);
    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.comment).toBeNull();
    expect(l.fields).toEqual(['1', 'wert (* x *)']);
  });

  // Die frühere Fassung `/^(.*;)(\s*\(\*.*\*\)\s*)$/` war quadratisch: Das
  // gierige `.*;` probierte jede Semikolonposition durch und suchte an jeder
  // den Zeilenrest vergeblich nach einem `*)`. Eine wohlgeformte Zeile aus
  // lauter `;(*` brauchte für 469 KB rund 38 Sekunden — ohne eine einzige
  // Diagnose. Die Schranke ist grosszügig; sie soll nur die Rückkehr der
  // quadratischen Laufzeit fangen, nicht Millisekunden messen.
  it('bleibt bei vielen unabgeschlossenen (* linear', () => {
    const raw = `VERANSTALTUNG:${';(*'.repeat(60_000)}`;
    const start = performance.now();
    const l = lexLine(raw, 1);
    const dauer = performance.now() - start;

    if (l.kind !== 'element') throw new Error('erwartet: element');
    expect(l.comment).toBeNull();
    expect(dauer).toBeLessThan(1000);
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
