import { describe, expect, it } from 'vitest';

import { DSV8_DELTA, markierungen } from './dsv8-delta.js';

describe('DSV8-Delta gegenüber DSV7', () => {
  for (const [name, schema, erwartet] of DSV8_DELTA) {
    describe(name, () => {
      it('markiert genau die Elemente, die DSV8 einführt', () => {
        expect(markierungen(schema).elemente).toEqual(erwartet.elemente);
      });

      it('markiert genau die Felder, die DSV8 einführt', () => {
        expect(markierungen(schema).felder).toEqual(erwartet.felder);
      });

      it('markiert genau die Werte, die DSV8 einführt', () => {
        expect(markierungen(schema).werte).toEqual(erwartet.werte);
      });
    });
  }

  /**
   * Das Delta ist über alle vier Listenarten hinweg endlich und klein. Die
   * Gesamtzahl steht hier ausgeschrieben, damit eine neue Markierung irgendwo
   * im Schema nicht unbemerkt durchrutscht, weil sie zufällig an eine Stelle
   * fällt, die eine der obigen Listen ohnehin erwartet.
   */
  it('umfasst insgesamt ein Element, vier Felder und fünfzehn Werte', () => {
    const alle = DSV8_DELTA.map(([, schema]) => markierungen(schema));

    expect(alle.flatMap((d) => d.elemente)).toHaveLength(1);
    expect(alle.flatMap((d) => d.felder)).toHaveLength(4);
    expect(alle.flatMap((d) => d.werte)).toHaveLength(15);
  });
});
