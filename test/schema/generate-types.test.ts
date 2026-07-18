import { describe, expect, it } from 'vitest';
import { renderBothVersions, renderElement } from '../../scripts/generate-types.js';
import { field } from '../../src/schema/types.js';
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
        // Über field() gebaut statt als Objektliteral: So bleibt der Test
        // immun gegen künftige Pflichtfelder in FieldDef.
        field('neu', 'ZK', { since: 8, doc: 'Neu', specRef: 'dsv8.md:1' }),
      ],
    };
    expect(renderElement('X', withSince, 7)).not.toContain('neu');
    expect(renderElement('X', withSince, 8)).toContain('neu?: string;');
  });
});

describe('renderBothVersions', () => {
  it('macht die DSV8-Fassung zum Alias, wenn kein Feld seit DSV8 hinzukam', () => {
    const out = renderBothVersions('AbschnittWkdef', ABSCHNITT_WKDEF);
    expect(out).toContain('export interface AbschnittWkdefV7 {');
    expect(out).toContain('export type AbschnittWkdefV8 = AbschnittWkdefV7;');
  });

  it('gibt zwei eigene Interfaces aus, wenn sich die Fassungen unterscheiden', () => {
    const withSince = {
      ...ABSCHNITT_WKDEF,
      fields: [
        ...ABSCHNITT_WKDEF.fields,
        // Über field() gebaut statt als Objektliteral: So bleibt der Test
        // immun gegen künftige Pflichtfelder in FieldDef.
        field('neu', 'ZK', { since: 8, doc: 'Neu', specRef: 'dsv8.md:1' }),
      ],
    };
    const out = renderBothVersions('X', withSince);
    expect(out).toContain('export interface XV7 {');
    expect(out).toContain('export interface XV8 {');
    expect(out).not.toContain('export type XV8 =');
  });
});
