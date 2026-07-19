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

  it('erkennt Elementnamen unabhängig von der Schreibweise', () => {
    // Der Parser vergleicht den ELEMENTNAMEN case-insensitiv. In allen echten
    // Dateien stehen FORMAT und DATEIENDE gross — ein Erzeuger mit kleiner
    // Schreibweise würde sonst stillschweigend als „FORMAT fehlt" durchfallen.
    const { document, diagnostics } = parseDsv('Format:Vereinsmeldeliste;7;\r\nDateiende\r\n');

    expect(document.listenart).toBe('Vereinsmeldeliste');
    expect(diagnostics.map((d) => d.code)).not.toContain('missing-format-element');
    expect(diagnostics.map((d) => d.code)).not.toContain('missing-dateiende-element');
  });

  it('gibt die Listart unverändert zurück, ohne Normalisierung', () => {
    const { document } = parseDsv('FORMAT:WETTKAMPFERGEBNISLISTE;7;\r\nDATEIENDE\r\n');
    expect(document.listenart).toBe('WETTKAMPFERGEBNISLISTE');
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
    expect(found?.line).toBe(2);
  });

  it('meldet FORMAT an vierter Stelle als Warnung', () => {
    const { diagnostics } = parseDsv(
      'ERZEUGER:X;1;a@b.de;\r\nVERANSTALTER:A;\r\nAUSRICHTER:B;\r\nFORMAT:X;7;\r\nDATEIENDE\r\n',
    );
    const found = diagnostics.find((d) => d.code === 'format-not-first-element');

    expect(found?.severity).toBe('warning');
    expect(found?.line).toBe(4);
  });

  it('lässt Kommentare und Leerzeilen vor FORMAT zu', () => {
    const { diagnostics } = parseDsv('(* Erzeuger XY *)\r\n\r\nFORMAT:X;7;\r\nDATEIENDE\r\n');

    expect(diagnostics.map((d) => d.code)).toEqual([]);
  });

  it('meldet ein DATEIENDE, das nicht das letzte Element ist', () => {
    const { diagnostics } = parseDsv('FORMAT:X;7;\r\nDATEIENDE\r\nERZEUGER:X;1;a@b.de;\r\n');
    const found = diagnostics.find((d) => d.code === 'element-order-violation');

    expect(found?.severity).toBe('warning');
    expect(found?.line).toBe(2);
    expect(found?.data).toMatchObject({ element: 'DATEIENDE' });
  });

  it('lässt Kommentare nach DATEIENDE zu', () => {
    const { diagnostics } = parseDsv('FORMAT:X;7;\r\nDATEIENDE\r\n(* Ende *)\r\n');

    expect(diagnostics.map((d) => d.code)).toEqual([]);
  });

  it('liest auch die ältere Formatversion 6', () => {
    const { document } = parseDsv('FORMAT:Wettkampfergebnisliste;6;\r\nDATEIENDE\r\n');
    expect(document.version).toBe(6);
  });
});

describe('parseDsv — Diagnostics vollständig', () => {
  const VALID = 'FORMAT:Wettkampfergebnisliste;7;\r\nDATEIENDE\r\n';

  // Tabellengetrieben, damit jeder Diagnostic-Code mindestens einmal auf sein
  // Auftreten, seine Severity und seine Wirkung auf `ok` geprüft ist.
  const cases: ReadonlyArray<{
    name: string;
    input: string;
    code: string;
    severity: string;
    ok: boolean;
  }> = [
    {
      name: 'leere Eingabe',
      input: '',
      code: 'empty-input',
      severity: 'fatal',
      ok: false,
    },
    {
      name: 'fehlendes FORMAT',
      input: 'DATEIENDE\r\n',
      code: 'missing-format-element',
      severity: 'error',
      ok: false,
    },
    {
      name: 'fehlendes DATEIENDE',
      input: 'FORMAT:X;7;\r\n',
      code: 'missing-dateiende-element',
      severity: 'warning',
      ok: true,
    },
    {
      name: 'FORMAT nicht als erstes Element',
      input: 'ERZEUGER:X;1;a@b.de;\r\nFORMAT:X;7;\r\nDATEIENDE\r\n',
      code: 'format-not-first-element',
      severity: 'warning',
      ok: true,
    },
    {
      name: 'DATEIENDE nicht als letztes Element',
      input: 'FORMAT:X;7;\r\nDATEIENDE\r\nERZEUGER:X;1;a@b.de;\r\n',
      code: 'element-order-violation',
      severity: 'warning',
      ok: true,
    },
    {
      name: 'Ersatzzeichen aus falschem Encoding',
      input: `FORMAT:X;7;\r\nVEREIN:M\uFFFDller;\r\nDATEIENDE\r\n`,
      code: 'unknown-encoding-replacement-character',
      severity: 'warning',
      ok: true,
    },
    {
      name: 'BOM am Dateianfang',
      input: '﻿FORMAT:X;7;\r\nDATEIENDE\r\n',
      code: 'unexpected-bom',
      severity: 'warning',
      ok: true,
    },
    {
      name: 'fehlendes Schluss-Semikolon',
      input: 'FORMAT:X;7;\r\nSTZWISCHENZEIT:1;50;00:00:30,10\r\nDATEIENDE\r\n',
      code: 'unterminated-field-list',
      severity: 'warning',
      ok: true,
    },
  ];

  it.each(cases)('$name meldet $code mit Severity $severity', ({ input, code, severity, ok }) => {
    const result = parseDsv(input);
    const found = result.diagnostics.find((d) => d.code === code);

    expect(found, `Diagnostic ${code} fehlt`).toBeDefined();
    expect(found?.severity).toBe(severity);
    expect(result.ok).toBe(ok);
  });

  it('meldet für eine fehlerfreie Datei gar nichts', () => {
    const result = parseDsv(VALID);
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('wirft auch bei Severity fatal, nicht nur bei error', () => {
    expect(() => parseDsvOrThrow('')).toThrow(/empty-input/);
  });
});

describe('parseDsv — fehlendes Schluss-Semikolon', () => {
  // dsv8.md:228-229 — "Da die Attribute aber durch eine feste Reihenfolge
  // definiert sind, muss auf jeden Fall das Trennzeichen(;) gesetzt werden."
  // Die Toleranz ist gegen die Realität richtig, aber sie muss sichtbar sein.
  const codes = (input: string): string[] => parseDsv(input).diagnostics.map((d) => d.code);

  it('liest die Zeile trotzdem vollständig', () => {
    const { document } = parseDsv('FORMAT:X;7;\r\nA:1;2;3\r\nDATEIENDE\r\n');
    const record = document.items.find((i) => i.kind === 'element' && i.element === 'A');

    expect(record?.kind).toBe('element');
    if (record?.kind !== 'element') throw new Error('erwartet: element');
    expect(record.fields).toEqual(['1', '2', '3']);
    expect(record.terminated).toBe(false);
  });

  it('nennt Element und Zeile', () => {
    const found = parseDsv('FORMAT:X;7;\r\nA:1;2;3\r\nDATEIENDE\r\n').diagnostics.find(
      (d) => d.code === 'unterminated-field-list',
    );

    expect(found?.line).toBe(2);
    expect(found?.data).toMatchObject({ element: 'A' });
  });

  it('schweigt bei ordentlich terminierten Zeilen', () => {
    expect(codes('FORMAT:X;7;\r\nA:1;2;3;\r\nDATEIENDE\r\n')).toEqual([]);
  });

  it('duldet Leerraum hinter dem letzten Semikolon', () => {
    expect(codes('FORMAT:X;7;\r\nA:1;2;3; \r\nDATEIENDE\r\n')).toEqual([]);
  });

  it('schweigt bei DATEIENDE — dort gibt es keine Attributliste', () => {
    expect(codes('FORMAT:X;7;\r\nDATEIENDE\r\n')).toEqual([]);
  });

  it('schweigt bei einem Element ganz ohne Attribute', () => {
    expect(codes('FORMAT:X;7;\r\nA:\r\nDATEIENDE\r\n')).toEqual([]);
  });

  it('beurteilt den Rumpf vor einem Zeilenendkommentar', () => {
    expect(codes('FORMAT:X;7;\r\nA:1;2; (* ok *)\r\nDATEIENDE\r\n')).toEqual([]);
    expect(codes('FORMAT:X;7;\r\nA:1;2 (* ok *)\r\nDATEIENDE\r\n')).toEqual([
      'unterminated-field-list',
    ]);
  });
});

describe('parseDsv — Version', () => {
  it('liefert null statt zu raten, wenn die Version fehlt oder unlesbar ist', () => {
    expect(parseDsv('FORMAT:X;;\r\nDATEIENDE\r\n').document.version).toBeNull();
    expect(parseDsv('FORMAT:X;abc;\r\nDATEIENDE\r\n').document.version).toBeNull();
    expect(parseDsv('FORMAT:X;\r\nDATEIENDE\r\n').document.version).toBeNull();
  });
});

const DSV6 = [
  'FORMAT:Wettkampfergebnisliste;6;',
  'ERZEUGER:EasyWk;5.27;info@easywk.de;',
  'DATEIENDE',
  '',
].join('\r\n');

describe('parseDsv — nicht unterstützte Formatversion', () => {
  it('lehnt DSV6 schon schema-frei mit fatal ab', () => {
    const { diagnostics, ok } = parseDsv(DSV6);
    const found = diagnostics.find((d) => d.code === 'unsupported-format-version');

    expect(found?.severity).toBe('fatal');
    expect(found?.message).toContain('6');
    expect(found?.data).toEqual({ version: 6 });
    expect(ok).toBe(false);
  });

  it('zerlegt die Datei trotz fatal weiter — die Zeilen bleiben für die Diagnose da', () => {
    const { document } = parseDsv(DSV6);

    expect(document.listenart).toBe('Wettkampfergebnisliste');
    expect(document.version).toBe(6);
    expect(document.items.filter((i) => i.kind === 'element')).toHaveLength(3);
  });

  it('lässt parseDsvOrThrow bei DSV6 werfen', () => {
    expect(() => parseDsvOrThrow(DSV6)).toThrow(/unsupported-format-version/);
  });

  it('meldet für DSV7 und DSV8 nichts', () => {
    for (const version of [7, 8]) {
      const { diagnostics } = parseDsv(
        `FORMAT:Wettkampfergebnisliste;${String(version)};\r\nDATEIENDE\r\n`,
      );
      expect(diagnostics.map((d) => d.code)).not.toContain('unsupported-format-version');
    }
  });

  it('unterscheidet eine fehlende oder unlesbare Version von einer Version 6', () => {
    // `version === null` heisst „keine Versionsangabe lesbar" — dafür stehen
    // `missing-format-element` bzw. die Feldprüfung der typisierten Ebene ein.
    // Eine unbelegte Behauptung „Version nicht unterstützt" wäre hier falsch.
    for (const input of ['DATEIENDE\r\n', 'FORMAT:X;;\r\nDATEIENDE\r\n', 'FORMAT:X;abc;\r\n']) {
      expect(parseDsv(input).diagnostics.map((d) => d.code)).not.toContain(
        'unsupported-format-version',
      );
    }
  });
});
