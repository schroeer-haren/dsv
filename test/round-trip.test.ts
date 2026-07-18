import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { writeDsv } from '../src/write/write-dsv.js';

const DIR = 'test/fixtures/real';
const files = readdirSync(DIR).filter((f) => /\.dsv[678]?$/i.test(f));

const read = (name: string): string => readFileSync(join(DIR, name), 'utf8');

/**
 * Fünf Fixtures deklarieren die ältere Formatversion 6. Sie werden hier
 * getrennt geführt: Auf der schema-freien Ebene sind sie unauffällig, weil die
 * Zeilensyntax über alle Formatversionen identisch ist. Ab der Schema-Ebene
 * sollen sie dagegen mit `fatal` abgelehnt werden — dann muss diese Trennung
 * schon stehen, statt den Test zur Bremse gegen die eigene Entscheidung zu
 * machen.
 */
const dsv6Files = files.filter((f) => parseDsv(read(f)).document.version === 6);
const dsv7Files = files.filter((f) => parseDsv(read(f)).document.version === 7);

describe('Round-Trip über echte Dateien', () => {
  it('findet den erwarteten Bestand', () => {
    expect(files).toHaveLength(108);
  });

  it.each(files)('%s bleibt byte-identisch', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it('teilt sich in 103 DSV7- und 5 DSV6-Dateien auf', () => {
    expect(dsv7Files).toHaveLength(103);
    expect(dsv6Files).toHaveLength(5);
  });

  it.each(dsv7Files)('%s wird ohne Fehler gelesen', (name) => {
    const errors = parseDsv(read(name)).diagnostics.filter(
      (d) => d.severity === 'error' || d.severity === 'fatal',
    );
    expect(errors).toEqual([]);
  });

  it.each(dsv6Files)('%s (DSV6) wird schema-frei ebenfalls fehlerfrei gelesen', (name) => {
    // Gilt nur auf dieser Ebene. Ab der Schema-Ebene ist DSV6 abzulehnen.
    const errors = parseDsv(read(name)).diagnostics.filter(
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
    // Exakter Wert statt unterer Schranke: Eine Schranke bemerkt nicht, wenn
    // zu gierig abgetrennt wird.
    expect(withComment).toBe(92_261);
  });
});
