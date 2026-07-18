import { describe, expect, it } from 'vitest';
import { renderElement } from '../../scripts/generate-types.js';
import { ABSCHNITT_WKDEF } from '../../src/schema/spike-abschnitt.js';

describe('renderElement', () => {
  const dsv7 = renderElement('AbschnittWkdef', ABSCHNITT_WKDEF, 7);

  it('erzeugt ein benanntes Interface', () => {
    expect(dsv7).toContain('export interface AbschnittWkdef {');
  });

  it('macht optionale Felder optional', () => {
    expect(dsv7).toContain('abschnittsnr: string;');
    expect(dsv7).toContain('einlass?: string;');
  });

  it('schreibt JSDoc mit Spec-Fundstelle an jedes Feld', () => {
    expect(dsv7).toContain('Nummer des Abschnitts, maximal zweistellig.');
    expect(dsv7).toContain('@see dsv8.md:904');
  });

  it('lässt seit DSV8 hinzugekommene Felder in der DSV7-Fassung weg', () => {
    const withSince = {
      ...ABSCHNITT_WKDEF,
      fields: [
        ...ABSCHNITT_WKDEF.fields,
        {
          name: 'neu',
          type: 'ZK' as const,
          required: false,
          since: 8 as const,
          doc: 'Neu',
          specRef: 'dsv8.md:1',
        },
      ],
    };
    expect(renderElement('X', withSince, 7)).not.toContain('neu');
    expect(renderElement('X', withSince, 8)).toContain('neu?: string;');
  });
});
