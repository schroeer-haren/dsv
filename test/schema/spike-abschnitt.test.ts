import { describe, expect, it } from 'vitest';
import { element } from '../../src/schema/types.js';
import { ABSCHNITT_ERGEBNIS, ABSCHNITT_WKDEF } from '../../src/schema/spike-abschnitt.js';

describe('ABSCHNITT', () => {
  it('hat 6 Attribute in der Wettkampfdefinitionsliste', () => {
    expect(ABSCHNITT_WKDEF.fields.map((f) => f.name)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'einlass',
      'kampfrichtersitzung',
      'anfangszeit',
      'relativeAngabe',
    ]);
  });

  it('hat 4 Attribute in den übrigen Listenarten', () => {
    expect(ABSCHNITT_ERGEBNIS.fields.map((f) => f.name)).toEqual([
      'abschnittsnr',
      'abschnittsdatum',
      'anfangszeit',
      'relativeAngabe',
    ]);
  });

  it('kennzeichnet Pflichtfelder', () => {
    const required = ABSCHNITT_WKDEF.fields.filter((f) => f.required).map((f) => f.name);
    expect(required).toEqual(['abschnittsnr', 'abschnittsdatum', 'anfangszeit']);
  });

  it('belegt jedes Feld mit einer Spec-Fundstelle', () => {
    for (const f of ABSCHNITT_WKDEF.fields) {
      expect(f.specRef).toMatch(/^dsv8\.md:\d+$/);
      expect(f.doc.length).toBeGreaterThan(0);
    }
  });

  it('kennzeichnet attributlose Elemente', () => {
    expect(element('DATEIENDE', [], { bare: true }).bare).toBe(true);
    expect(ABSCHNITT_WKDEF.bare).toBe(false);
  });
});
