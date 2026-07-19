import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeUhrzeit, encodeUhrzeit } from '../../src/values/uhrzeit.js';
import { DsvWriteError } from '../../src/write/write-error.js';

describe('decodeUhrzeit', () => {
  it('liest HH:MM als Minuten seit Mitternacht', () => {
    expect(decodeUhrzeit('00:00')).toBe(0);
    expect(decodeUhrzeit('09:30')).toBe(570);
    expect(decodeUhrzeit('23:59')).toBe(1439);
  });

  it('weist fehlerhafte Werte mit null zurück, statt zu raten', () => {
    expect(decodeUhrzeit('')).toBeNull();
    expect(decodeUhrzeit('9:30')).toBeNull();
    expect(decodeUhrzeit('09.30')).toBeNull();
    expect(decodeUhrzeit('24:00')).toBeNull();
    expect(decodeUhrzeit('09:60')).toBeNull();
    expect(decodeUhrzeit('09:30:00')).toBeNull();
  });
});

describe('encodeUhrzeit', () => {
  it('schreibt führende Nullen', () => {
    expect(encodeUhrzeit(570)).toBe('09:30');
    expect(encodeUhrzeit(0)).toBe('00:00');
  });

  it('encode und decode sind zueinander invers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1439 }), (minutes) => {
        expect(decodeUhrzeit(encodeUhrzeit(minutes))).toBe(minutes);
      }),
    );
  });
});

// Siehe die Begründung bei `encodeZeit`: Der Encoder darf nichts erzeugen, was
// der eigene Decoder zurückweist.
describe('encodeUhrzeit — Eingabeprüfung', () => {
  it.each([-1, NaN, Infinity, 0.5, 1e5, 1440])('weist %p zurück', (wert) => {
    expect(() => encodeUhrzeit(wert)).toThrow(DsvWriteError);
  });

  it('lässt die Randwerte des Tages durch', () => {
    expect(encodeUhrzeit(0)).toBe('00:00');
    expect(encodeUhrzeit(1439)).toBe('23:59');
  });

  it('erzeugt nur, was der eigene Decoder zurückliest', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 1600 }), (m) => {
        let text: string;
        try {
          text = encodeUhrzeit(m);
        } catch {
          return; // zurückgewiesen ist in Ordnung
        }
        expect(decodeUhrzeit(text)).toBe(m);
      }),
    );
  });
});
