import { describe, expect, it } from 'vitest';
import {
  LISTS,
  renderAll,
  renderBothVersions,
  renderElement,
} from '../../scripts/generate-types.js';
import { field } from '../../src/schema/types.js';
import { ABSCHNITT as ERGEBNIS_ABSCHNITT } from '../../src/schema/wettkampfergebnisliste.js';
import { ABSCHNITT, VERANSTALTUNG, WETTKAMPF } from '../../src/schema/wettkampfdefinitionsliste.js';

describe('renderElement', () => {
  const dsv7 = renderElement('Abschnitt', ABSCHNITT, 7);

  it('erzeugt ein benanntes Interface', () => {
    expect(dsv7).toContain('export interface Abschnitt {');
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
      ...ABSCHNITT,
      fields: [
        ...ABSCHNITT.fields,
        // Über field() gebaut statt als Objektliteral: So bleibt der Test
        // immun gegen künftige Pflichtfelder in FieldDef.
        field('neu', 'ZK', { since: 8, doc: 'Neu', specRef: 'dsv8.md:1' }),
      ],
    };
    expect(renderElement('X', withSince, 7)).not.toContain('neu');
    expect(renderElement('X', withSince, 8)).toContain('neu?: string;');
  });

  it('rendert Felder mit Werteliste als String-Literal-Union', () => {
    const out = renderElement('Veranstaltung', VERANSTALTUNG, 8);
    expect(out).toContain("zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH';");
  });

  it('schreibt die Bedeutungen der Werte ins JSDoc', () => {
    const out = renderElement('Veranstaltung', VERANSTALTUNG, 8);
    expect(out).toContain('- `HANDZEIT` — Handzeit');
    expect(out).toContain('- `AUTOMATISCH` — automatische Zeitmessung');
  });

  it('lässt seit DSV8 hinzugekommene Werte in der DSV7-Union weg', () => {
    const v7 = renderElement('Wettkampf', WETTKAMPF, 7);
    const v8 = renderElement('Wettkampf', WETTKAMPF, 8);
    // geschlecht: D ist erst ab DSV8 zulässig.
    expect(v7).not.toContain("'D'");
    expect(v8).toContain("'D'");
    // ausuebung: KB und KR ebenfalls erst ab DSV8 — sie gehören zur Ausübung,
    // nicht zur Technik.
    expect(v7).not.toContain("'KB'");
    expect(v8).toContain("'KB'");
  });

  it('lässt seit DSV8 hinzugekommene Werte auch aus dem JSDoc weg', () => {
    const v7 = renderElement('Wettkampf', WETTKAMPF, 7);
    expect(v7).not.toContain('divers');
  });

  it('nimmt tolerierte Werte in die Union auf und kennzeichnet sie im JSDoc', () => {
    const out = renderElement('Wettkampf', WETTKAMPF, 8);
    // A und N kommen real vor, auch wenn die Spec sie hier nicht vorsieht.
    expect(out).toContain("'A'");
    expect(out).toContain("'N'");
    expect(out).toMatch(/- `A` — .*laut Spezifikation nicht für diese Listenart vorgesehen/);
  });
});

describe('renderBothVersions', () => {
  it('macht die DSV8-Fassung zum Alias, wenn sich die Fassungen nicht unterscheiden', () => {
    const out = renderBothVersions('Abschnitt', ABSCHNITT);
    expect(out).toContain('export interface AbschnittV7 {');
    expect(out).toContain('export type AbschnittV8 = AbschnittV7;');
  });

  it('gibt zwei eigene Interfaces aus, wenn ein Feld seit DSV8 hinzukam', () => {
    const withSince = {
      ...ABSCHNITT,
      fields: [
        ...ABSCHNITT.fields,
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

  it('aliast nicht, wenn sich nur die Unions unterscheiden', () => {
    // Kein Feld trägt `since`, wohl aber ein Wert — die Fassungen sind
    // trotzdem verschieden.
    const withValueSince = {
      ...ABSCHNITT,
      fields: [
        ...ABSCHNITT.fields,
        field('art', 'ZK', {
          doc: 'Art',
          specRef: 'dsv8.md:1',
          values: [
            { value: 'A', doc: 'A' },
            { value: 'B', doc: 'B', since: 8 as const },
          ],
        }),
      ],
    };
    const out = renderBothVersions('Y', withValueSince);
    expect(out).toContain('export interface YV7 {');
    expect(out).toContain('export interface YV8 {');
    expect(out).not.toContain('export type YV8 =');
  });
});

describe('alle vier Listenarten', () => {
  const output = renderAll();

  /** Namen aller erzeugten Typen, in Reihenfolge des Auftretens. */
  const declared = [...output.matchAll(/^export (?:interface|type) (\w+)/gm)].map((m) => m[1]!);

  it('deckt jede der vier Listenarten ab', () => {
    expect(LISTS.map((l) => l.schema.listenart)).toEqual([
      'Wettkampfdefinitionsliste',
      'Wettkampfergebnisliste',
      'Vereinsmeldeliste',
      'Vereinsergebnisliste',
    ]);
  });

  it('erzeugt für jedes Element jeder Listenart beide Formatversionen', () => {
    const erwartet = LISTS.reduce((n, l) => n + l.schema.elements.length, 0) * 2;

    expect(declared).toHaveLength(erwartet);
  });

  it('vergibt jeden Typnamen genau einmal', () => {
    // Der eigentliche Grund für die Präfixe: Dasselbe Element führt je
    // Listenart unterschiedlich viele Felder, darf also nicht denselben Namen
    // bekommen.
    expect(new Set(declared).size).toBe(declared.length);
  });

  it('trennt ABSCHNITT nach Listenart — sechs Felder gegen vier', () => {
    expect(declared).toContain('AbschnittV7');
    expect(declared).toContain('ErgebnisAbschnittV7');

    const definition = renderElement('X', ABSCHNITT, 7);
    const ergebnis = renderElement('X', ERGEBNIS_ABSCHNITT, 7);

    expect(definition).not.toBe(ergebnis);
  });

  it('trägt je Element die Fundstelle in der Spezifikation', () => {
    expect(output).toContain('@see dsv8.md:');
  });
});
