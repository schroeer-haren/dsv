import type { Diagnostic, DiagnosticCode, Position, Severity } from './types.js';

interface DiagnosticLocation {
  readonly start: Position;
  readonly end: Position;
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
    start: location.start,
    end: location.end,
    ...(location.data === undefined ? {} : { data: location.data }),
  };
}
