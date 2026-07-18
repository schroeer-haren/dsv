import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeUhrzeit, encodeUhrzeit } from '../../src/values/uhrzeit.js';

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
