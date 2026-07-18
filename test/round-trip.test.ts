import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { writeDsv } from '../src/write/write-dsv.js';

const DIR = 'test/fixtures/real';
const files = readdirSync(DIR).filter((f) => /\.dsv[678]?$/i.test(f));

describe('Round-Trip über echte Dateien', () => {
  it('findet den erwarteten Bestand', () => {
    expect(files).toHaveLength(108);
  });

  it.each(files)('%s bleibt byte-identisch', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it.each(files)('%s wird ohne Fehler gelesen', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    const errors = parseDsv(text).diagnostics.filter(
      (d) => d.severity === 'error' || d.severity === 'fatal',
    );
    expect(errors).toEqual([]);
  });
});

describe('Zerlegung echter Dateien', () => {
  it.each(files)('%s: kein Feld enthält ein Trennzeichen', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    // Nur bei einem Treffer assertieren: Ein expect je Feld ergäbe
    // hunderttausende Assertions und dominierte die Laufzeit der Suite.
    const offenders: string[] = [];

    for (const item of parseDsv(text).document.items) {
      if (item.kind !== 'element') continue;
      for (const f of item.fields) {
        if (f.includes(';') || f.includes('\n')) offenders.push(f);
      }
    }

    expect(offenders).toEqual([]);
  });

  it.each(files)('%s: gleichnamige Elemente haben gleich viele Felder', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    const counts = new Map<string, Set<number>>();

    for (const item of parseDsv(text).document.items) {
      if (item.kind !== 'element' || item.bare) continue;
      const seen = counts.get(item.element) ?? new Set<number>();
      seen.add(item.fields.length);
      counts.set(item.element, seen);
    }

    for (const [element, sizes] of counts) {
      expect(sizes.size, `${element} hat unterschiedliche Feldzahlen`).toBe(1);
    }
  });

  it('trennt Kommentare am Zeilenende in der erwarteten Grössenordnung ab', () => {
    let withComment = 0;
    for (const name of files) {
      const text = readFileSync(join(DIR, name), 'utf8');
      for (const item of parseDsv(text).document.items) {
        if (item.kind === 'element' && item.comment !== null) withComment++;
      }
    }
    expect(withComment).toBeGreaterThan(80_000);
  });
});
