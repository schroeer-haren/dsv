import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeZeit, encodeZeit, isZeroZeit } from '../../src/values/zeit.js';

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

  it('encode und decode sind zueinander invers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 99 * 360000 }), (cs) => {
        expect(decodeZeit(encodeZeit(cs))).toBe(cs);
      }),
    );
  });
});
