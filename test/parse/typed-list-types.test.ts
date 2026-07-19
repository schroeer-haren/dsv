import { describe, expect, expectTypeOf, it } from 'vitest';
import { parseWettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';
import type { Wettkampfdefinitionsliste } from '../../src/parse/parse-wettkampfdefinitionsliste.js';
import { parseWettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';
import type { Wettkampfergebnisliste } from '../../src/parse/parse-wettkampfergebnisliste.js';

/**
 * Die beiden Listenarten dürfen einander nicht zuweisbar sein. Sonst nähme
 * etwa `projectWettkampfdefinitionsliste` eine Ergebnisliste entgegen, ohne
 * dass der Compiler eingriffe.
 */
describe('Listenarten sind typseitig unterscheidbar', () => {
  it('hält Ergebnis- und Definitionsliste auseinander', () => {
    expectTypeOf<Wettkampfergebnisliste>().not.toExtend<Wettkampfdefinitionsliste>();
    expectTypeOf<Wettkampfdefinitionsliste>().not.toExtend<Wettkampfergebnisliste>();
  });

  it('gibt aus den Wrappern den jeweils passenden Typ zurück', () => {
    expectTypeOf(parseWettkampfdefinitionsliste('')).toEqualTypeOf<
      ReturnType<typeof parseWettkampfdefinitionsliste>
    >();
    expectTypeOf(
      parseWettkampfdefinitionsliste('').document,
    ).toEqualTypeOf<Wettkampfdefinitionsliste>();
    expectTypeOf(parseWettkampfergebnisliste('').document).toEqualTypeOf<Wettkampfergebnisliste>();
  });
});

describe('Verhalten bleibt unverändert', () => {
  const text = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';

  it('liest eine Ergebnisliste weiterhin gleich', () => {
    const result = parseWettkampfergebnisliste(text);
    expect(result.document.listenart).toBe('Wettkampfergebnisliste');
    expect(result.document.version).toBe(7);
    // Das Phantomfeld existiert nur im Typ, nicht zur Laufzeit.
    expect(Object.keys(result.document).sort()).toEqual([
      'document',
      'listenart',
      'records',
      'version',
    ]);
  });

  it('lehnt eine Definitionsliste mit falscher Listenart ab', () => {
    const result = parseWettkampfdefinitionsliste(text);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'wrong-list-type')).toBe(true);
  });
});
