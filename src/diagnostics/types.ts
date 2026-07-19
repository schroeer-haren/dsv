/**
 * `fatal` bedeutet: Die Eingabe ist keine verwertbare DSV-Datei. Nur diese
 * Stufe wirft auch in der nicht-werfenden API.
 */
export type Severity = 'fatal' | 'error' | 'warning' | 'info';

export type DiagnosticCode =
  | 'missing-format-element'
  | 'missing-dateiende-element'
  | 'format-not-first-element'
  | 'element-order-violation'
  | 'unknown-encoding-replacement-character'
  | 'unexpected-bom'
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
  | 'incomplete-relay'
  | 'empty-input';

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: Severity;
  /**
   * Eine englische Beschreibung für Menschen — Protokolle, Fehlerausgaben,
   * Entwicklerwerkzeuge.
   *
   * Der Wortlaut ist **ausdrücklich nicht zugesichert** und ändert sich ohne
   * Bruch der Schnittstelle, auch in Patch-Versionen. Er ist keine
   * Programmierschnittstelle: Wer einen Befund auswertet, unterscheidet ihn
   * über `code` und liest seine Einzelheiten aus `data`. Wer ihn anzeigt,
   * lokalisiert ihn ebenso über `code` und `data`. Ein Abgleich auf den
   * Meldungstext — Gleichheit, Teilzeichenkette, reguläre Ausdrücke — bricht
   * ohne Vorwarnung.
   */
  readonly message: string;
  /**
   * Die 1-basierte Quellzeile, auf die sich der Befund bezieht.
   *
   * DSV ist zeilenorientiert: Jedes Element belegt genau eine Zeile, und jeder
   * Befund betrifft ein Element, eine Beziehung zwischen Elementen oder die
   * Datei als Ganzes (dann Zeile 1). Eine Spalte oder eine Span innerhalb der
   * Zeile wird bewusst **nicht** geführt — der Lexer hält keine Feldoffsets,
   * und ein Feld auszuzeichnen wäre für keinen der Befunde die richtige
   * Granularität. Wer eine Editor-Markierung braucht, hebt die ganze Zeile
   * hervor.
   */
  readonly line: number;
  readonly data?: Readonly<Record<string, unknown>>;
}
