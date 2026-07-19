import { describe, expect, it } from 'vitest';
import { createDiagnostic } from '../../src/diagnostics/create.js';

describe('createDiagnostic', () => {
  it('trägt Code, Severity, Zeile und Nachricht', () => {
    const d = createDiagnostic('missing-format-element', 'error', 'FORMAT element is missing', {
      line: 1,
    });

    expect(d.code).toBe('missing-format-element');
    expect(d.severity).toBe('error');
    expect(d.message).toBe('FORMAT element is missing');
    expect(d.line).toBe(1);
  });

  it('übernimmt die Zeile unverändert statt auf 1 zurückzufallen', () => {
    const d = createDiagnostic('unexpected-field-count', 'warning', 'Unexpected field count', {
      line: 5,
    });

    expect(d.line).toBe(5);
  });

  it('nimmt strukturierte Zusatzdaten auf', () => {
    const d = createDiagnostic('unexpected-field-count', 'warning', 'Unexpected field count', {
      line: 5,
      data: { expected: 6, actual: 4 },
    });

    expect(d.line).toBe(5);
    expect(d.data).toEqual({ expected: 6, actual: 4 });
  });

  it('lässt data weg, wenn nichts übergeben wurde', () => {
    const d = createDiagnostic('empty-input', 'fatal', 'Empty input', { line: 1 });

    expect('data' in d).toBe(false);
  });
});
