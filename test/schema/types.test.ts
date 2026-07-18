import { describe, expect, it } from 'vitest';
import { element, field } from '../../src/schema/types.js';

describe('element', () => {
  it('hält Name und Felder in Reihenfolge', () => {
    const def = element('ABSCHNITT', [
      field('abschnittsnr', 'Zahl', { required: true, doc: 'Nummer', specRef: 'dsv8.md:904' }),
      field('einlass', 'Uhrzeit', { doc: 'Einlass', specRef: 'dsv8.md:922' }),
    ]);

    expect(def.name).toBe('ABSCHNITT');
    expect(def.fields.map((f) => f.name)).toEqual(['abschnittsnr', 'einlass']);
    expect(def.fields[0]!.required).toBe(true);
    expect(def.fields[1]!.required).toBe(false);
  });

  it('markiert Felder, die es erst ab DSV8 gibt', () => {
    const def = element('BANKVERBINDUNG', [
      field('kontoinhaber', 'ZK', {
        required: true,
        since: 8,
        doc: 'Inhaber',
        specRef: 'dsv8.md:786',
      }),
    ]);

    expect(def.fields[0]!.since).toBe(8);
  });
});

describe('field mit Aufzählungswerten', () => {
  it('trägt die erlaubten Werte mit Bedeutung', () => {
    const f = field('zeitmessung', 'ZK', {
      required: true,
      doc: 'Art der Zeitmessung.',
      specRef: 'dsv8.md:435',
      values: [
        { value: 'HANDZEIT', doc: 'Handzeit' },
        { value: 'AUTOMATISCH', doc: 'Automatische Zeitmessung' },
      ],
    });

    expect(f.values?.map((v) => v.value)).toEqual(['HANDZEIT', 'AUTOMATISCH']);
  });

  it('markiert Werte, die es erst ab DSV8 gibt', () => {
    const f = field('ausuebung', 'ZK', {
      required: true,
      doc: 'Ausübung.',
      specRef: 'dsv8.md:1037',
      values: [
        { value: 'GL', doc: 'ganze Lage' },
        { value: 'KB', doc: 'Kicks Bauchlage', since: 8 },
      ],
    });

    expect(f.values?.find((v) => v.value === 'KB')?.since).toBe(8);
  });

  it('nimmt einen Unterlassungswert auf', () => {
    const f = field('relativeAngabe', 'Zeichen', {
      doc: 'Relative Angabe.',
      specRef: 'dsv8.md:932',
      values: [
        { value: 'J', doc: 'relativ' },
        { value: 'N', doc: 'absolut' },
      ],
      default: 'N',
    });

    expect(f.default).toBe('N');
  });

  it('vergleicht Werte je nach Feld strikt oder case-insensitiv', () => {
    const strikt = field('technik', 'Zeichen', {
      required: true,
      doc: 'Technik.',
      specRef: 'dsv8.md:1029',
      values: [{ value: 'F', doc: 'Freistil' }],
    });
    const lax = field('meldegeldTyp', 'ZK', {
      required: true,
      doc: 'Meldegeld-Typ.',
      specRef: 'dsv8.md:1360',
      values: [{ value: 'Meldegeldpauschale', doc: 'pauschal je Verein' }],
      caseInsensitive: true,
    });

    expect(strikt.caseInsensitive).toBe(false);
    expect(lax.caseInsensitive).toBe(true);
  });

  it('lässt Felder ohne Werteliste unverändert', () => {
    const f = field('name', 'ZK', { required: true, doc: 'Name.', specRef: 'dsv8.md:1' });
    expect(f.values).toBeUndefined();
    expect(f.default).toBeUndefined();
    expect(f.caseInsensitive).toBe(false);
  });
});

describe('element mit Versionsmarkierung', () => {
  it('markiert Elemente, die es erst ab DSV8 gibt', () => {
    expect(element('LASTSCHRIFT', [], { since: 8 }).since).toBe(8);
  });

  it('lässt since bei Elementen beider Versionen weg', () => {
    expect(element('ABSCHNITT', []).since).toBeUndefined();
  });
});
