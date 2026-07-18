import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvDocument, DsvItem, DsvRecord, ParseResult } from '../document/types.js';
import { lexLine } from '../lexer/lex-line.js';
import type { SourceLine } from '../source/source-text.js';
import { createSourceText } from '../source/source-text.js';

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

  if (source.lines.length > 0 && !elements.some((e) => e.element.toUpperCase() === 'DATEIENDE')) {
    diagnostics.push(
      createDiagnostic(
        'missing-dateiende-element',
        'warning',
        'DATEIENDE element is missing',
        AT_START,
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

  const version = format?.fields[1];

  const document: DsvDocument = {
    listenart: format?.fields[0] ?? null,
    version: version !== undefined && /^\d+$/.test(version) ? Number(version) : null,
    items,
    hasBom: source.hasBom,
  };

  return {
    document,
    diagnostics,
    ok: !diagnostics.some((d) => d.severity === 'error' || d.severity === 'fatal'),
  };
}
