import { describe, expect, it } from 'vitest';
import { parseDsv, parseDsvOrThrow } from '../../src/parse/parse-dsv.js';

const FILE = [
  '(* erzeugt mit EasyWk *)',
  'FORMAT: Wettkampfergebnisliste;7;',
  'ERZEUGER:EasyWk;5.27;info@easywk.de;',
  'DATEIENDE',
  '',
].join('\r\n');

describe('parseDsv', () => {
  it('liest Listart und Version, auch mit Leerzeichen nach dem Doppelpunkt', () => {
    const { document } = parseDsv(FILE);
    expect(document.listenart).toBe('Wettkampfergebnisliste');
    expect(document.version).toBe(7);
  });

  it('vergleicht die Listart case-insensitiv', () => {
    const { document } = parseDsv('FORMAT:WETTKAMPFERGEBNISLISTE;7;\r\nDATEIENDE\r\n');
    expect(document.listenart?.toLowerCase()).toBe('wettkampfergebnisliste');
  });

  it('akzeptiert Kommentarzeilen vor FORMAT', () => {
    const { diagnostics } = parseDsv(FILE);
    expect(diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
  });

  it('behält alle Zeilen in Originalreihenfolge', () => {
    const { document } = parseDsv(FILE);
    // Vier Zeilen, nicht fünf: Ein abschliessendes \r\n beendet die vierte
    // Zeile, es beginnt keine leere fünfte.
    expect(document.items.map((i) => i.kind)).toEqual(['comment', 'element', 'element', 'element']);
  });

  it('meldet eine fehlende FORMAT-Zeile', () => {
    const { diagnostics, ok } = parseDsv('DATEIENDE\r\n');
    expect(ok).toBe(false);
    expect(diagnostics.map((d) => d.code)).toContain('missing-format-element');
  });

  it('meldet leere Eingabe als fatal', () => {
    expect(parseDsv('').diagnostics[0]?.severity).toBe('fatal');
  });
});

describe('parseDsvOrThrow', () => {
  it('liefert das Dokument bei fehlerfreier Eingabe', () => {
    expect(parseDsvOrThrow(FILE).listenart).toBe('Wettkampfergebnisliste');
  });

  it('wirft bei einer Diagnostic der Severity error', () => {
    expect(() => parseDsvOrThrow('DATEIENDE\r\n')).toThrow(/missing-format-element/);
  });

  it('wirft nicht bei blossen Warnungen', () => {
    expect(() => parseDsvOrThrow(FILE)).not.toThrow();
  });
});

describe('parseDsv — Reihenfolge und Vollständigkeit', () => {
  it('meldet ein fehlendes DATEIENDE als Warnung, liefert das Dokument aber', () => {
    // Ohne FORMAT ist keine Elementdeutung möglich, das ist ein Fehler.
    // Ein fehlendes DATEIENDE lässt dagegen alle Daten intakt.
    const { document, diagnostics, ok } = parseDsv('FORMAT:Wettkampfergebnisliste;7;\r\n');

    expect(diagnostics.map((d) => d.code)).toContain('missing-dateiende-element');
    expect(diagnostics.find((d) => d.code === 'missing-dateiende-element')?.severity).toBe(
      'warning',
    );
    expect(ok).toBe(true);
    expect(document.listenart).toBe('Wettkampfergebnisliste');
  });

  it('meldet FORMAT nach einem anderen Element als Warnung', () => {
    const { diagnostics } = parseDsv('ERZEUGER:X;1;a@b.de;\r\nFORMAT:X;7;\r\nDATEIENDE\r\n');
    const found = diagnostics.find((d) => d.code === 'format-not-first-element');

    expect(found?.severity).toBe('warning');
    expect(found?.start.line).toBe(2);
  });

  it('liest auch die ältere Formatversion 6', () => {
    const { document } = parseDsv('FORMAT:Wettkampfergebnisliste;6;\r\nDATEIENDE\r\n');
    expect(document.version).toBe(6);
  });
});
