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
  /**
   * Ob die Attributliste mit `;` abgeschlossen ist (dsv8.md:228-229).
   *
   * Bei `bare` immer `true` — dort gibt es keine Attributliste.
   */
  readonly terminated: boolean;
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
  // Bewusst ohne regulären Ausdruck. Die frühere Fassung
  // `/^(.*;)(\s*\(\*.*\*\)\s*)$/` war quadratisch: Das gierige `.*;` probiert
  // jede Semikolonposition durch, und an jeder, auf die ein `(*` folgt, sucht
  // das innere `.*\*\)` den Zeilenrest vergeblich nach einem `*)` ab. Eine
  // wohlgeformte Zeile aus vielen `;(*` ohne je ein `*)` brauchte so für
  // 469 KB rund 38 Sekunden — ohne eine einzige Diagnose.
  //
  // Dieselbe Sprache, in einem Durchlauf: Der Kommentar endet mit `*)` am
  // Zeilenende (nur Leerraum dahinter) und beginnt am letztmöglichen `(*`,
  // vor dem nur Leerraum und davor ein `;` steht.
  let ende = rest.length;
  while (ende > 0 && /\s/.test(rest[ende - 1]!)) ende -= 1;
  if (ende < 4 || !rest.startsWith('*)', ende - 2)) return { body: rest, comment: null };

  // Von hinten nach vorn, damit das letzte passende `(*` gewinnt — das ist die
  // längste Fassung des Rumpfes und damit dieselbe Wahl wie beim gierigen
  // `.*;` von zuvor.
  let auf = rest.lastIndexOf('(*', ende - 4);
  while (auf !== -1) {
    let vor = auf;
    while (vor > 0 && /\s/.test(rest[vor - 1]!)) vor -= 1;
    if (vor > 0 && rest[vor - 1] === ';') {
      return { body: rest.slice(0, vor), comment: rest.slice(vor) };
    }
    // `lastIndexOf` deutet einen negativen Startwert als 0 und fände dieselbe
    // Stelle erneut — bei `auf === 0` gibt es keine frühere mehr.
    if (auf === 0) break;
    auf = rest.lastIndexOf('(*', auf - 1);
  }

  return { body: rest, comment: null };
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
      terminated: true,
      raw,
      line,
    };
  }

  const element = raw.slice(0, colon).trim();
  const { body, comment } = splitTrailingComment(raw.slice(colon + 1));

  // Attribute sind mit `;` terminiert, nicht getrennt: `split` liefert daher ein
  // leeres Schlusselement, das kein Feld ist und genau einmal verworfen wird.
  //
  // Fehlt das abschliessende `;`, bleibt das letzte Feld ein echtes Feld und
  // wird gelesen. Das ist Absicht — echte Dateien lassen es weg, siehe die
  // Begründung zum Befund `unterminated-field-list` in `parse-dsv.ts`. Der
  // Mangel wird hier nur festgehalten, nicht geheilt und nicht bestraft.
  //
  // `terminated` beurteilt den Rohtext, nicht das Ergebnis von `split`: Ein
  // Leerzeichen hinter dem letzten `;` (`A:1; `) ist erlaubt und terminiert
  // trotzdem. Ein leerer Rumpf (`A:`) hat keine Attributliste, die man
  // abschliessen könnte.
  const parts = body.split(';');
  const terminated = body.trim() === '' || body.trimEnd().endsWith(';');
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();

  return {
    kind: 'element',
    element,
    fields: parts.map((part) => part.trim()),
    rawFields: parts,
    comment,
    bare: false,
    terminated,
    raw,
    line,
  };
}
