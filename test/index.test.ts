import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';

describe('öffentliche API', () => {
  it('exportiert genau die vorgesehene Oberfläche', () => {
    expect(Object.keys(api).sort()).toEqual([
      'DsvParseError',
      'parseDsv',
      'parseDsvOrThrow',
      'writeDsv',
    ]);
  });

  it('liest und schreibt eine Datei', () => {
    const text = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';
    expect(api.writeDsv(api.parseDsvOrThrow(text))).toBe(text);
  });
});
