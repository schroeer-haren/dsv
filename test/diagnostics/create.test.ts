import { describe, expect, it } from 'vitest';
import { createDiagnostic } from '../../src/diagnostics/create.js';

describe('createDiagnostic', () => {
  it('trägt Code, Severity, Position und Nachricht', () => {
    const d = createDiagnostic('missing-format-element', 'error', 'FORMAT element is missing', {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 1 },
    });

    expect(d.code).toBe('missing-format-element');
    expect(d.severity).toBe('error');
    expect(d.start.line).toBe(1);
  });

  it('nimmt strukturierte Zusatzdaten auf', () => {
    const d = createDiagnostic('unexpected-field-count', 'warning', 'Unexpected field count', {
      start: { line: 5, column: 1 },
      end: { line: 5, column: 20 },
      data: { expected: 6, actual: 4 },
    });

    expect(d.data).toEqual({ expected: 6, actual: 4 });
  });
});
