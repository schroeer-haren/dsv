import type { Diagnostic } from '../diagnostics/types.js';
import type { LineEnding } from '../source/source-text.js';

export interface DsvRecord {
  readonly kind: 'element';
  readonly element: string;
  readonly fields: readonly string[];
  readonly rawFields: readonly string[];
  readonly comment: string | null;
  readonly bare: boolean;
  /**
   * Ob die Attributliste mit `;` abgeschlossen ist (dsv8.md:228-229).
   *
   * Bei `bare` immer `true` — dort gibt es keine Attributliste.
   */
  readonly terminated: boolean;
  readonly line: number;
  /** Vollständige Originalzeile ohne Zeilenende. Grundlage der Byte-Identität. */
  readonly raw: string;
  readonly eol: LineEnding;
}

export interface DsvComment {
  readonly kind: 'comment';
  readonly raw: string;
  readonly line: number;
  readonly eol: LineEnding;
}

export interface DsvBlank {
  readonly kind: 'blank';
  readonly raw: string;
  readonly line: number;
  readonly eol: LineEnding;
}

export type DsvItem = DsvRecord | DsvComment | DsvBlank;

export interface DsvDocument {
  /** Rohwert aus FORMAT. Vergleiche immer case-insensitiv. */
  readonly listenart: string | null;
  readonly version: number | null;
  readonly items: readonly DsvItem[];
  readonly hasBom: boolean;
}

export interface ParseResult<T> {
  readonly document: T;
  readonly diagnostics: readonly Diagnostic[];
  /** `true`, wenn keine Diagnostic mit Severity `error` oder `fatal` vorliegt. */
  readonly ok: boolean;
}
