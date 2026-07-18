import { describe, expect, it } from 'vitest';
import type { DsvRecord } from '../../src/document/types.js';
import {
  BANKVERBINDUNG,
  DATEIENDE,
  MELDESCHLUSS,
} from '../../src/schema/wettkampfdefinitionsliste.js';
import { validateFields } from '../../src/validate/validate-fields.js';

function record(element: string, fields: readonly string[], line = 1): DsvRecord {
  return {
    kind: 'element',
    element,
    fields,
    rawFields: fields,
    comment: null,
    bare: fields.length === 0,
    line,
    raw: `${element}:${fields.join(';')}`,
    eol: '\n',
  };
}

describe('validateFields', () => {
  it('meldet zu wenige Felder mit erwarteter und tatsächlicher Anzahl', () => {
    const diagnostics = validateFields(record('MELDESCHLUSS', ['01.05.2026']), MELDESCHLUSS, 8);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe('unexpected-field-count');
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.data).toEqual({ expected: 2, actual: 1 });
  });

  it('meldet zu viele Felder', () => {
    const diagnostics = validateFields(
      record('MELDESCHLUSS', ['01.05.2026', '18:00', 'zuviel']),
      MELDESCHLUSS,
      8,
    );

    expect(diagnostics.map((d) => d.code)).toEqual(['unexpected-field-count']);
    expect(diagnostics[0]?.data).toEqual({ expected: 2, actual: 3 });
  });

  it('meldet nichts bei richtiger Feldanzahl', () => {
    expect(
      validateFields(record('MELDESCHLUSS', ['01.05.2026', '18:00']), MELDESCHLUSS, 8),
    ).toEqual([]);
  });

  it('meldet ein leeres Pflichtfeld', () => {
    const diagnostics = validateFields(record('MELDESCHLUSS', ['', '18:00']), MELDESCHLUSS, 8);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe('missing-required-field');
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.data).toEqual({ field: 'datum' });
  });

  it('behandelt ein Pflichtfeld aus Leerzeichen wie ein leeres', () => {
    const diagnostics = validateFields(record('MELDESCHLUSS', ['   ', '18:00']), MELDESCHLUSS, 8);

    expect(diagnostics.map((d) => d.code)).toEqual(['missing-required-field']);
  });

  it('meldet ein leeres optionales Feld nicht', () => {
    const diagnostics = validateFields(
      record('BANKVERBINDUNG', ['', 'DE02120300000000202051', '', 'Kasse']),
      BANKVERBINDUNG,
      8,
    );

    expect(diagnostics).toEqual([]);
  });

  it('meldet die Zeile des Records', () => {
    const diagnostics = validateFields(record('MELDESCHLUSS', [], 42), MELDESCHLUSS, 8);

    expect(diagnostics[0]?.start).toEqual({ line: 42, column: 1 });
    expect(diagnostics[0]?.end).toEqual({ line: 42, column: 1 });
  });

  it('meldet bei bare-Elementen ohne Felder nichts', () => {
    expect(validateFields(record('DATEIENDE', []), DATEIENDE, 8)).toEqual([]);
  });

  describe('Versionsabhängigkeit der Feldanzahl', () => {
    const drei = ['Sparkasse', 'DE02120300000000202051', 'BYLADEM1001'];
    const vier = [...drei, 'Kasse des Vereins'];

    it('akzeptiert BANKVERBINDUNG mit drei Feldern in DSV7', () => {
      expect(validateFields(record('BANKVERBINDUNG', drei), BANKVERBINDUNG, 7)).toEqual([]);
    });

    it('meldet BANKVERBINDUNG mit drei Feldern in DSV8', () => {
      const diagnostics = validateFields(record('BANKVERBINDUNG', drei), BANKVERBINDUNG, 8);

      expect(diagnostics.map((d) => d.code)).toEqual(['unexpected-field-count']);
      expect(diagnostics[0]?.data).toEqual({ expected: 4, actual: 3 });
    });

    it('akzeptiert BANKVERBINDUNG mit vier Feldern in DSV8', () => {
      expect(validateFields(record('BANKVERBINDUNG', vier), BANKVERBINDUNG, 8)).toEqual([]);
    });

    it('meldet BANKVERBINDUNG mit vier Feldern in DSV7', () => {
      const diagnostics = validateFields(record('BANKVERBINDUNG', vier), BANKVERBINDUNG, 7);

      expect(diagnostics.map((d) => d.code)).toEqual(['unexpected-field-count']);
      expect(diagnostics[0]?.data).toEqual({ expected: 3, actual: 4 });
    });

    it('prüft in DSV7 kein Pflichtfeld, das es dort nicht gibt', () => {
      expect(validateFields(record('BANKVERBINDUNG', drei), BANKVERBINDUNG, 7)).toEqual([]);
    });
  });
});
