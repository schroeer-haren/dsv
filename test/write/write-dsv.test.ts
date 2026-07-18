import { describe, expect, it } from 'vitest';
import { parseDsv } from '../../src/parse/parse-dsv.js';
import { writeDsv } from '../../src/write/write-dsv.js';

describe('writeDsv', () => {
  it('gibt eine unveränderte Datei byte-identisch zurück', () => {
    const text = 'FORMAT: X;7;\r\n(* c *)\r\nDATEIENDE\r\n';
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it('erhält ein BOM', () => {
    const text = '﻿FORMAT:X;7;\nDATEIENDE\n';
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it('erhält gemischte Zeilenenden', () => {
    const text = 'FORMAT:X;7;\r\nA:1;\nDATEIENDE';
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });
});
