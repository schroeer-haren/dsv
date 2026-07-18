/**
 * `fatal` bedeutet: Die Eingabe ist keine verwertbare DSV-Datei. Nur diese
 * Stufe wirft auch in der nicht-werfenden API.
 */
export type Severity = 'fatal' | 'error' | 'warning' | 'info';

/** 1-basiert; `column` zählt UTF-16-Code-Units. */
export interface Position {
  readonly line: number;
  readonly column: number;
}

export type DiagnosticCode =
  | 'missing-format-element'
  | 'missing-dateiende-element'
  | 'format-not-first-element'
  | 'element-order-violation'
  | 'unknown-encoding-replacement-character'
  | 'unterminated-field-list'
  | 'unexpected-field-count'
  | 'unknown-element'
  | 'missing-required-field'
  | 'invalid-value'
  | 'invalid-enum-value'
  | 'cardinality-violation'
  | 'mutually-exclusive-elements'
  | 'conditional-field-required'
  | 'unsupported-format-version'
  | 'wrong-list-type'
  | 'dangling-reference'
  | 'ambiguous-reference'
  | 'empty-input';

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: Severity;
  /** Englisch. Lokalisierung erfolgt über `code` und `data`. */
  readonly message: string;
  readonly start: Position;
  readonly end: Position;
  readonly data?: Readonly<Record<string, unknown>>;
}
