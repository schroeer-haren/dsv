import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeZeit, encodeZeit, isZeroZeit } from '../../src/values/zeit.js';
import { DsvWriteError } from '../../src/write/write-error.js';

/** Der Maximalwert 99:59:59,99 in Hundertsteln. */
const MAX = 35_999_999;

describe('decodeZeit', () => {
  it('liest HH:MM:SS,hh als Hundertstel', () => {
    expect(decodeZeit('00:01:00,82')).toBe(6082);
    expect(decodeZeit('00:00:29,03')).toBe(2903);
    expect(decodeZeit('01:00:00,00')).toBe(360000);
  });

  it('erkennt die Nullzeit, den Unterlassungswert für „keine Zeit"', () => {
    expect(decodeZeit('00:00:00,00')).toBe(0);
    expect(isZeroZeit(0)).toBe(true);
  });

  it('weist fehlerhafte Werte mit null zurück, statt zu raten', () => {
    expect(decodeZeit('1:01,44')).toBeNull();
    expect(decodeZeit('')).toBeNull();
    expect(decodeZeit('00:00:00.00')).toBeNull();
    expect(decodeZeit('00:60:00,00')).toBeNull();
    expect(decodeZeit('00:00:60,00')).toBeNull();
  });

  it('weist ein Vorzeichen zurück — der Datentyp Zeit ist vorzeichenlos', () => {
    // Das Vorzeichen ist ein eigenes Attribut `Art` von PNREAKTION und
    // STABLOESE (dsv8.md:3698, 4201), es gehört nicht in die Zeit. Würde
    // decodeZeit es abschneiden, liefe eine negative Endzeit als gültiger
    // positiver Wert durch, ohne dass ein `invalid-value` entsteht.
    expect(decodeZeit('-00:00:28,15')).toBeNull();
    expect(decodeZeit('+00:00:28,15')).toBeNull();
    expect(decodeZeit('-00:00:00,00')).toBeNull();
  });

  it('weist mehr als zwei Stellen je Gruppe zurück', () => {
    expect(decodeZeit('100:00:00,00')).toBeNull();
    expect(decodeZeit('00:00:00,000')).toBeNull();
    expect(decodeZeit('0:00:00,00')).toBeNull();
  });
});

describe('encodeZeit', () => {
  it('ist die Umkehrung von decodeZeit', () => {
    for (const s of ['00:01:00,82', '00:00:29,03', '00:04:30,84', '00:00:00,00']) {
      expect(encodeZeit(decodeZeit(s)!)).toBe(s);
    }
  });

  it('schreibt führende Nullen', () => {
    expect(encodeZeit(5)).toBe('00:00:00,05');
  });

  it('schreibt den Maximalwert 99:59:59,99', () => {
    // architecture.md nennt 99:59:59,99 als Maximalwert; das sind 35 999 999
    // Hundertstel, nicht 99 * 360 000 (= 99:00:00,00).
    expect(encodeZeit(MAX)).toBe('99:59:59,99');
    expect(decodeZeit('99:59:59,99')).toBe(MAX);
  });

  it('encode und decode sind zueinander invers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MAX }), (cs) => {
        expect(decodeZeit(encodeZeit(cs))).toBe(cs);
      }),
    );
  });
});

// Die Encoder sind seit 0.9.0 öffentlich, damit niemand die Formatierungsregel
// selbst nachbaut. Sie prüften ihre Eingabe aber nicht und erzeugten klaglos
// Zeichenketten, die der eigene Decoder zurückweist — `encodeZeit(-1)` ergab
// "00:00:00,-1". Das verletzt denselben Grundsatz, den `writeTypedList`
// umsetzt: Was unser eigener Leser nicht akzeptiert, dürfen wir nicht
// ausliefern.
describe('encodeZeit — Eingabeprüfung', () => {
  it.each([-1, -0.5, NaN, Infinity, -Infinity, 0.5, 1e18, MAX + 1])('weist %p zurück', (wert) => {
    expect(() => encodeZeit(wert)).toThrow(DsvWriteError);
  });

  it('lässt die Randwerte des gültigen Bereichs durch', () => {
    expect(encodeZeit(0)).toBe('00:00:00,00');
    expect(encodeZeit(MAX)).toBe('99:59:59,99');
  });

  it('erzeugt nur, was der eigene Decoder zurückliest', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: MAX + 1000 }), (cs) => {
        let text: string;
        try {
          text = encodeZeit(cs);
        } catch {
          return; // zurückgewiesen ist in Ordnung
        }
        expect(decodeZeit(text)).toBe(cs);
      }),
    );
  });
});
