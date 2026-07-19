import type { Diagnostic, DiagnosticCode, Severity } from './types.js';

interface DiagnosticLocation {
  /** 1-basierte Quellzeile. */
  readonly line: number;
  readonly data?: Readonly<Record<string, unknown>>;
}

export function createDiagnostic(
  code: DiagnosticCode,
  severity: Severity,
  message: string,
  location: DiagnosticLocation,
): Diagnostic {
  return {
    code,
    severity,
    message,
    line: location.line,
    ...(location.data === undefined ? {} : { data: location.data }),
  };
}
