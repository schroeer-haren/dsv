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
