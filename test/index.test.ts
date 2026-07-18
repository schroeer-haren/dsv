import { describe, expect, it } from 'vitest';

import { DSV_FORMATS, formatLine, parseLine } from '../src/index.js';

describe('DSV_FORMATS', () => {
  it('enthält DSV7 und DSV8', () => {
    expect(DSV_FORMATS).toEqual(['DSV7', 'DSV8']);
  });
});

describe('parseLine', () => {
  it('zerlegt eine Zeile in Felder', () => {
    expect(parseLine('FORMAT:Wettkampfdefinitionsliste;7;')).toEqual([
      'FORMAT:Wettkampfdefinitionsliste',
      '7',
    ]);
  });

  it('gibt für eine leere Zeile ein leeres Array zurück', () => {
    expect(parseLine('')).toEqual([]);
  });
});

describe('formatLine', () => {
  it('ist die Umkehrung von parseLine', () => {
    const line = 'VERANSTALTUNG:Testwettkampf;Testbad;GER;25;HANDZEIT;';
    expect(formatLine(parseLine(line))).toBe(line);
  });
});
