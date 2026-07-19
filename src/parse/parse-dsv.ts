import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvDocument, DsvItem, DsvRecord, ParseResult } from '../document/types.js';
import { lexLine } from '../lexer/lex-line.js';
import type { SourceLine } from '../source/source-text.js';
import { createSourceText } from '../source/source-text.js';
import { isSupportedVersion, unsupportedFormatVersion } from '../validate/format-version.js';

/**
 * Verarbeitet Zeilen zu Items. Nimmt bewusst ein `Iterable` statt eines Arrays
 * entgegen: Damit lässt sich später eine streamende Quelle einsetzen, ohne
 * diese Funktion zu ändern.
 */
function collectItems(lines: Iterable<SourceLine>): DsvItem[] {
  const items: DsvItem[] = [];

  for (const line of lines) {
    const lexed = lexLine(line.content, line.number);

    if (lexed.kind === 'element') {
      items.push({
        kind: 'element',
        element: lexed.element,
        fields: lexed.fields,
        rawFields: lexed.rawFields,
        comment: lexed.comment,
        bare: lexed.bare,
        line: line.number,
        raw: line.content,
        eol: line.eol,
      });
      continue;
    }

    items.push({ kind: lexed.kind, raw: line.content, line: line.number, eol: line.eol });
  }

  return items;
}

const AT_START = { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };

export function parseDsv(input: string): ParseResult<DsvDocument> {
  const source = createSourceText(input);
  const items = collectItems(source.lines);
  const diagnostics: Diagnostic[] = [];

  const elements = items.filter((i): i is DsvRecord => i.kind === 'element');
  const format = elements.find((e) => e.element.toUpperCase() === 'FORMAT');

  if (source.lines.length === 0) {
    diagnostics.push(createDiagnostic('empty-input', 'fatal', 'Input is empty', AT_START));
  } else if (format === undefined) {
    diagnostics.push(
      createDiagnostic('missing-format-element', 'error', 'FORMAT element is missing', AT_START),
    );
  } else if (elements[0] !== format) {
    // Kommentarzeilen davor sind normal und zählen nicht mit — FORMAT muss nur
    // das erste ELEMENT sein (dsv8.md:331).
    diagnostics.push(
      createDiagnostic(
        'format-not-first-element',
        'warning',
        'FORMAT is not the first element in the file',
        { start: { line: format.line, column: 1 }, end: { line: format.line, column: 1 } },
      ),
    );
  }

  const dateiende = elements.find((e) => e.element.toUpperCase() === 'DATEIENDE');

  if (source.lines.length > 0 && dateiende === undefined) {
    diagnostics.push(
      createDiagnostic(
        'missing-dateiende-element',
        'warning',
        'DATEIENDE element is missing',
        AT_START,
      ),
    );
  } else if (dateiende !== undefined && elements[elements.length - 1] !== dateiende) {
    // Gegenstück zu `format-not-first-element`: Kommentar- und Leerzeilen nach
    // DATEIENDE zählen nicht mit — DATEIENDE muss nur das letzte ELEMENT sein
    // (dsv8.md:325). Wie dort eine Warnung: Die Daten selbst bleiben lesbar.
    diagnostics.push(
      createDiagnostic(
        'element-order-violation',
        'warning',
        'DATEIENDE is not the last element in the file',
        {
          start: { line: dateiende.line, column: 1 },
          end: { line: dateiende.line, column: 1 },
          data: { element: 'DATEIENDE' },
        },
      ),
    );
  }

  if (input.includes('�')) {
    diagnostics.push(
      createDiagnostic(
        'unknown-encoding-replacement-character',
        'warning',
        'Input contains U+FFFD; it was probably decoded with the wrong encoding',
        AT_START,
      ),
    );
  }

  const raw = format?.fields[1];
  const version = raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null;

  // Auch auf dieser Ebene gilt: Nur DSV7 und DSV8 werden angenommen. Gemeldet
  // wird mit demselben Code und derselben Meldung wie in `validateDocument` —
  // beide Ebenen sollen zu derselben Datei dasselbe sagen.
  //
  // `version === null` ist ein anderer Fall: Dann ist gar keine Versionsangabe
  // lesbar, wofür `missing-format-element` bzw. die Feldprüfung der typisierten
  // Ebene einsteht. „Version nicht unterstützt" wäre hier eine Behauptung über
  // eine Zahl, die es nicht gibt.
  //
  // Anders als die typisierte Ebene bricht `parseDsv` deswegen nicht ab: Die
  // zerlegten Zeilen bleiben zur Diagnose brauchbar, `fatal` heisst hier „nicht
  // verwendbar", nicht „nichts gelesen".
  if (version !== null && !isSupportedVersion(version)) {
    diagnostics.push(unsupportedFormatVersion(version));
  }

  const document: DsvDocument = {
    listenart: format?.fields[0] ?? null,
    version,
    items,
    hasBom: source.hasBom,
  };

  return {
    document,
    diagnostics,
    ok: !diagnostics.some((d) => d.severity === 'error' || d.severity === 'fatal'),
  };
}

export class DsvParseError extends Error {
  constructor(readonly diagnostics: readonly Diagnostic[]) {
    const first = diagnostics[0];
    super(first === undefined ? 'DSV parse failed' : `${first.code}: ${first.message}`);
    this.name = 'DsvParseError';
  }
}

export function parseDsvOrThrow(input: string): DsvDocument {
  const result = parseDsv(input);
  if (!result.ok) {
    throw new DsvParseError(result.diagnostics.filter((d) => d.severity !== 'warning'));
  }
  return result.document;
}
