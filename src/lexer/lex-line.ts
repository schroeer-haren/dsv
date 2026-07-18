/** Eine Zeile, die vollständig aus einem `(* … *)`-Kommentar besteht. */
export interface LexedComment {
  readonly kind: 'comment';
  /** Die unveränderte Zeile ohne Zeilenende. */
  readonly raw: string;
  /** 1-basiert. */
  readonly line: number;
}

/** Eine leere Zeile oder eine Zeile aus reinem Leerraum. */
export interface LexedBlank {
  readonly kind: 'blank';
  /** Die unveränderte Zeile ohne Zeilenende. */
  readonly raw: string;
  /** 1-basiert. */
  readonly line: number;
}

export type LexedLine = LexedComment | LexedBlank;

/**
 * Zerlegt eine einzelne Zeile in ihre Bestandteile.
 *
 * @param raw Die Zeile ohne Zeilenende.
 * @param line 1-basierte Zeilennummer.
 */
export function lexLine(raw: string, line: number): LexedLine {
  const trimmed = raw.trim();

  if (trimmed === '') return { kind: 'blank', raw, line };
  if (trimmed.startsWith('(*')) return { kind: 'comment', raw, line };

  throw new Error('not implemented');
}
