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
  /** `true` bei einem Element ohne Doppelpunkt und ohne Attribute (`DATEIENDE`). */
  readonly bare: boolean;
  /** Die unveränderte Zeile ohne Zeilenende. */
  readonly raw: string;
  /** 1-basiert. */
  readonly line: number;
}

export type LexedLine = LexedComment | LexedBlank | LexedElement;

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
    return { kind: 'element', element: trimmed, fields: [], rawFields: [], bare: true, raw, line };
  }

  const element = raw.slice(0, colon).trim();
  const rest = raw.slice(colon + 1);

  // Attribute sind mit `;` terminiert, nicht getrennt: `split` liefert daher ein
  // leeres Schlusselement, das kein Feld ist und genau einmal verworfen wird.
  const parts = rest.split(';');
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();

  return {
    kind: 'element',
    element,
    fields: parts.map((part) => part.trim()),
    rawFields: parts,
    bare: false,
    raw,
    line,
  };
}
