import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';

describe('öffentliche API', () => {
  it('exportiert genau die vorgesehene Oberfläche', () => {
    expect(Object.keys(api).sort()).toEqual([
      'DsvParseError',
      'DsvWriteError',
      'decodeDatum',
      'decodeUhrzeit',
      'decodeZeit',
      'encodeDatum',
      'encodeUhrzeit',
      'encodeZeit',
      'isZeroZeit',
      'parseDsv',
      'parseDsvOrThrow',
      'parseVereinsergebnisliste',
      'parseVereinsmeldeliste',
      'parseWettkampfdefinitionsliste',
      'parseWettkampfergebnisliste',
      'projectVereinsergebnisliste',
      'projectVereinsmeldeliste',
      'projectWettkampfdefinitionsliste',
      'projectWettkampfergebnisliste',
      'writeDsv',
      'writeVereinsergebnisliste',
      'writeVereinsmeldeliste',
      'writeWettkampfdefinitionsliste',
      'writeWettkampfergebnisliste',
    ]);
  });

  it('macht die Wert-Codecs für Anwender nutzbar', () => {
    expect(api.encodeZeit(api.decodeZeit('00:01:04,37') ?? 0)).toBe('00:01:04,37');
    expect(api.encodeDatum(api.decodeDatum('05.07.2025') ?? { day: 1, month: 1, year: 1970 })).toBe(
      '05.07.2025',
    );
    expect(api.encodeUhrzeit(api.decodeUhrzeit('09:30') ?? 0)).toBe('09:30');
    expect(api.isZeroZeit(0)).toBe(true);
    expect(api.isZeroZeit(1)).toBe(false);
  });

  it('liest und schreibt eine Datei', () => {
    const text = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';
    expect(api.writeDsv(api.parseDsvOrThrow(text))).toBe(text);
  });
});
