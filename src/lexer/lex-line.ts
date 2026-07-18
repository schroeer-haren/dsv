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

/** Eine Elementzeile der Form `ELEMENTNAME:attr1;attr2;`. */
export interface LexedElement {
  readonly kind: 'element';
  /** Der Elementname vor dem Doppelpunkt. */
  readonly element: string;
  /** Die Feldwerte ohne umgebenden Leerraum. */
  readonly fields: readonly string[];
  /** Die Feldwerte im Rohtext, damit byte-genau zurückgeschrieben werden kann. */
  readonly rawFields: readonly string[];
  /** Ein Kommentar am Zeilenende hinter dem letzten Semikolon, sonst `null`. */
  readonly comment: string | null;
  /** `true` bei einem Element ohne Doppelpunkt und ohne Attribute (`DATEIENDE`). */
  readonly bare: boolean;
  /** Die unveränderte Zeile ohne Zeilenende. */
  readonly raw: string;
  /** 1-basiert. */
  readonly line: number;
}

export type LexedLine = LexedComment | LexedBlank | LexedElement;

/**
 * Trennt einen Kommentar am Zeilenende ab. Nur ein `(* … *)`, das dem letzten
 * Semikolon folgt, gilt als Kommentar — innerhalb eines Feldes ist `(*`
 * gewöhnlicher ZK-Inhalt (dsv8.md:251).
 */
function splitTrailingComment(rest: string): { body: string; comment: string | null } {
  const match = /^(.*;)(\s*\(\*.*\*\)\s*)$/.exec(rest);
  if (match === null) return { body: rest, comment: null };
  return { body: match[1]!, comment: match[2]! };
}

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

  const colon = raw.indexOf(':');

  if (colon === -1) {
    return {
      kind: 'element',
      element: trimmed,
      fields: [],
      rawFields: [],
      comment: null,
      bare: true,
      raw,
      line,
    };
  }

  const element = raw.slice(0, colon).trim();
  const { body, comment } = splitTrailingComment(raw.slice(colon + 1));

  // Attribute sind mit `;` terminiert, nicht getrennt: `split` liefert daher ein
  // leeres Schlusselement, das kein Feld ist und genau einmal verworfen wird.
  const parts = body.split(';');
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();

  return {
    kind: 'element',
    element,
    fields: parts.map((part) => part.trim()),
    rawFields: parts,
    comment,
    bare: false,
    raw,
    line,
  };
}
