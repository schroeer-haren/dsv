import { describe, expect, it } from 'vitest';
import { DsvParseError, parseDsvOrThrow } from '../../src/parse/parse-dsv.js';
import {
  DsvWriteError,
  writeWettkampfdefinitionsliste,
} from '../../src/write/write-wettkampfdefinitionsliste.js';
import type { TypedRecord } from '../../src/parse/parse-typed-list.js';

/**
 * Die beiden öffentlichen Fehlerklassen.
 *
 * Geprüft wird ausdrücklich die **Klasse** und ihr `diagnostics`-Feld, nicht der
 * Meldungstext: Der Wortlaut ist laut architecture.md nicht zugesichert, `code`
 * und `data` sind es. Ein nacktes `toThrow()` ohne Argument nähme auch einen
 * TypeError aus einem Tippfehler an und belegte nichts.
 */
describe('DsvParseError', () => {
  /** Eine Eingabe, die keine verwertbare DSV-Datei ist. */
  const kaputt = 'das ist kein DSV\r\n';

  it('wird von parseDsvOrThrow geworfen und ist ein DsvParseError', () => {
    expect(() => parseDsvOrThrow(kaputt)).toThrow(DsvParseError);
  });

  it('ist auch ein Error und trägt seinen Namen', () => {
    try {
      parseDsvOrThrow(kaputt);
      expect.unreachable('parseDsvOrThrow hätte werfen müssen');
    } catch (error) {
      expect(error).toBeInstanceOf(DsvParseError);
      expect(error).toBeInstanceOf(Error);
      expect((error as DsvParseError).name).toBe('DsvParseError');
    }
  });

  it('trägt die auslösenden Diagnostics mit Code und Zeile', () => {
    try {
      parseDsvOrThrow(kaputt);
      expect.unreachable('parseDsvOrThrow hätte werfen müssen');
    } catch (error) {
      const { diagnostics } = error as DsvParseError;
      expect(diagnostics.length).toBeGreaterThan(0);
      // Keine blosse Warnung: Geworfen wird nur wegen error/fatal.
      expect(diagnostics.every((d) => d.severity !== 'warning')).toBe(true);
      expect(diagnostics.map((d) => d.code)).toContain('missing-format-element');
      for (const d of diagnostics) expect(typeof d.line).toBe('number');
    }
  });

  it('wirft nicht bei einer gültigen Datei', () => {
    const text = ['FORMAT:Wettkampfdefinitionsliste;8;', 'DATEIENDE'].join('\r\n');
    expect(() => parseDsvOrThrow(text)).not.toThrow();
  });
});

describe('DsvWriteError', () => {
  /** Ein Record-Satz mit einem unbekannten Element — das Schreiben muss scheitern. */
  function records(): TypedRecord[] {
    return [{ element: 'ERGEBNIS', line: 0, values: { irgendwas: 'x' } }];
  }

  it('wird beim Schreiben schemawidriger Daten geworfen', () => {
    expect(() => writeWettkampfdefinitionsliste(records())).toThrow(DsvWriteError);
  });

  it('ist auch ein Error und trägt seinen Namen', () => {
    try {
      writeWettkampfdefinitionsliste(records());
      expect.unreachable('writeWettkampfdefinitionsliste hätte werfen müssen');
    } catch (error) {
      expect(error).toBeInstanceOf(DsvWriteError);
      expect(error).toBeInstanceOf(Error);
      expect((error as DsvWriteError).name).toBe('DsvWriteError');
    }
  });

  it('trägt die Diagnostics der strengen Prüfung, nicht eine leere Liste', () => {
    try {
      writeWettkampfdefinitionsliste(records());
      expect.unreachable('writeWettkampfdefinitionsliste hätte werfen müssen');
    } catch (error) {
      const { diagnostics } = error as DsvWriteError;
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.every((d) => d.severity !== 'warning')).toBe(true);
      for (const d of diagnostics) expect(typeof d.code).toBe('string');
    }
  });
});
