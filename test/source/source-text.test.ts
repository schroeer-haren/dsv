import { describe, expect, it } from 'vitest';
import { createSourceText } from '../../src/source/source-text.js';

describe('createSourceText', () => {
  it('trennt ein BOM ab und merkt es sich', () => {
    const src = createSourceText('﻿FORMAT:X;7;');
    expect(src.hasBom).toBe(true);
    expect(src.lines[0]!.content).toBe('FORMAT:X;7;');
  });

  it('erhält CRLF je Zeile', () => {
    const src = createSourceText('A\r\nB\r\n');
    expect(src.lines.map((l) => l.eol)).toEqual(['\r\n', '\r\n']);
    expect(src.lines.map((l) => l.content)).toEqual(['A', 'B']);
  });

  it('erhält gemischte Zeilenenden', () => {
    const src = createSourceText('A\r\nB\nC');
    expect(src.lines.map((l) => l.eol)).toEqual(['\r\n', '\n', '']);
  });

  it('merkt sich eine letzte Zeile ohne Zeilenumbruch', () => {
    expect(createSourceText('A\nB').lines[1]!.eol).toBe('');
    expect(createSourceText('A\nB\n').lines[1]!.eol).toBe('\n');
  });

  it('nummeriert Zeilen ab 1', () => {
    expect(createSourceText('A\nB').lines.map((l) => l.number)).toEqual([1, 2]);
  });

  it('liefert für leere Eingabe keine Zeilen', () => {
    expect(createSourceText('').lines).toEqual([]);
  });

  it('erzeugt keine Phantomzeile nach abschliessendem Zeilenumbruch', () => {
    expect(createSourceText('A\r\nB\r\n').lines).toHaveLength(2);
  });
});
