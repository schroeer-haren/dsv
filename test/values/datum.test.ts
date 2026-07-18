import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeDatum, encodeDatum } from '../../src/values/datum.js';

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
});

describe('encodeDatum', () => {
  it('schreibt führende Nullen', () => {
    expect(encodeDatum({ day: 1, month: 2, year: 2024 })).toBe('01.02.2024');
    expect(encodeDatum({ day: 9, month: 9, year: 903 })).toBe('09.09.0903');
  });

  it('encode und decode sind zueinander invers', () => {
    fc.assert(
      fc.property(
        fc.record({
          day: fc.integer({ min: 1, max: 31 }),
          month: fc.integer({ min: 1, max: 12 }),
          year: fc.integer({ min: 0, max: 9999 }),
        }),
        (datum) => {
          expect(decodeDatum(encodeDatum(datum))).toEqual(datum);
        },
      ),
    );
  });
});
