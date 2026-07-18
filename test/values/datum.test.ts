import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeDatum, encodeDatum } from '../../src/values/datum.js';

/** Unabhängig vom Produktivcode gehaltene Referenz für den Property-Test. */
function tageImMonat(month: number, year: number): number {
  if (month === 2) {
    const schaltjahr = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return schaltjahr ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

describe('decodeDatum', () => {
  it('liest TT.MM.JJJJ', () => {
    expect(decodeDatum('01.02.2024')).toEqual({ day: 1, month: 2, year: 2024 });
    expect(decodeDatum('31.12.1999')).toEqual({ day: 31, month: 12, year: 1999 });
  });

  it('weist fehlerhafte Werte mit null zurück, statt zu raten', () => {
    expect(decodeDatum('')).toBeNull();
    expect(decodeDatum('1.2.2024')).toBeNull();
    expect(decodeDatum('01.02.24')).toBeNull();
    expect(decodeDatum('01/02/2024')).toBeNull();
    expect(decodeDatum('00.02.2024')).toBeNull();
    expect(decodeDatum('32.01.2024')).toBeNull();
    expect(decodeDatum('01.00.2024')).toBeNull();
    expect(decodeDatum('01.13.2024')).toBeNull();
  });

  it('weist Tage zurück, die es im angegebenen Monat nicht gibt', () => {
    expect(decodeDatum('31.04.2026')).toBeNull();
    expect(decodeDatum('31.06.2026')).toBeNull();
    expect(decodeDatum('31.09.2026')).toBeNull();
    expect(decodeDatum('31.11.2026')).toBeNull();
    expect(decodeDatum('30.02.2026')).toBeNull();
    expect(decodeDatum('31.02.2026')).toBeNull();
  });

  it('liest Tage, die es im angegebenen Monat gibt', () => {
    expect(decodeDatum('31.01.2026')).toEqual({ day: 31, month: 1, year: 2026 });
    expect(decodeDatum('30.04.2026')).toEqual({ day: 30, month: 4, year: 2026 });
    expect(decodeDatum('28.02.2026')).toEqual({ day: 28, month: 2, year: 2026 });
  });

  it('kennt den Schalttag nach der vollen Regel', () => {
    // Durch vier teilbar: Schaltjahr.
    expect(decodeDatum('29.02.2024')).toEqual({ day: 29, month: 2, year: 2024 });
    expect(decodeDatum('29.02.2025')).toBeNull();
    // Durch 100 teilbar: kein Schaltjahr — ausser durch 400 teilbar.
    expect(decodeDatum('29.02.1900')).toBeNull();
    expect(decodeDatum('29.02.2000')).toEqual({ day: 29, month: 2, year: 2000 });
  });
});

describe('encodeDatum', () => {
  it('schreibt führende Nullen', () => {
    expect(encodeDatum({ day: 1, month: 2, year: 2024 })).toBe('01.02.2024');
    expect(encodeDatum({ day: 9, month: 9, year: 903 })).toBe('09.09.0903');
  });

  it('encode und decode sind für jedes gültige Tripel zueinander invers', () => {
    // Der Tag wird erst gezogen, wenn Monat und Jahr feststehen — sonst
    // erzeugte der Generator überwiegend Tripel, die es gar nicht gibt.
    const gueltigesDatum = fc
      .record({
        month: fc.integer({ min: 1, max: 12 }),
        year: fc.integer({ min: 0, max: 9999 }),
      })
      .chain(({ month, year }) =>
        fc.integer({ min: 1, max: tageImMonat(month, year) }).map((day) => ({ day, month, year })),
      );

    fc.assert(
      fc.property(gueltigesDatum, (datum) => {
        expect(decodeDatum(encodeDatum(datum))).toEqual(datum);
      }),
    );
  });
});
