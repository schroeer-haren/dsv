import { describe, expect, it } from 'vitest';
import { element, field } from '../../src/schema/types.js';
import { listSchema, occurrence } from '../../src/schema/list-schema.js';

const dummy = element('X', [field('a', 'ZK', { doc: 'a', specRef: 'dsv8.md:1' })]);

describe('listSchema', () => {
  const schema = listSchema('Wettkampfdefinitionsliste', [
    occurrence(dummy, { min: 1, max: 1 }),
    occurrence(element('Y', []), { min: 0, max: null }),
  ]);

  it('kennt die Listart', () => {
    expect(schema.listenart).toBe('Wettkampfdefinitionsliste');
  });

  it('findet ein Element unabhängig von der Schreibweise', () => {
    expect(schema.find('x')?.def.name).toBe('X');
    expect(schema.find('X')?.def.name).toBe('X');
    expect(schema.find('nicht-da')).toBeUndefined();
  });

  it('führt Kardinalitäten je Element', () => {
    expect(schema.find('X')?.min).toBe(1);
    expect(schema.find('X')?.max).toBe(1);
    expect(schema.find('Y')?.max).toBeNull();
  });

  it('behält die Reihenfolge der Elemente bei', () => {
    expect(schema.elements.map((e) => e.def.name)).toEqual(['X', 'Y']);
  });
});
