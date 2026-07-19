import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvDocument, ParseResult } from '../document/types.js';
import type { ListSchema } from '../schema/list-schema.js';
import { validateDocument } from '../validate/validate-document.js';
import type { FormatVersion } from '../validate/format-version.js';
import { isSupportedVersion, unsupportedFormatVersion } from '../validate/format-version.js';
import { fieldsForVersion } from '../validate/validate-fields.js';
import { parseDsv } from './parse-dsv.js';

/** Ein Record, dessen Feldwerte unter ihren Schema-Namen erreichbar sind. */
export interface TypedRecord {
  readonly element: string;
  readonly line: number;
  /** Feldwerte unter ihrem Schema-Namen. Fehlende optionale Felder sind ''. */
  readonly values: Readonly<Record<string, string>>;
}

/**
 * Eine gelesene Liste, unabhängig von ihrer Listenart.
 *
 * `TListenart` unterscheidet die Listenarten allein im Typsystem: Alle
 * Listenarten tragen dieselbe Struktur, wären also strukturell wechselseitig
 * zuweisbar — `projectWettkampfdefinitionsliste(ergebnisliste)` käme durch den
 * Compiler. Das Phantomfeld `__listenart` wird nie gesetzt und existiert nicht
 * zur Laufzeit; es ist optional, damit es beim Erzeugen einer Liste nirgends
 * angegeben werden muss. Der Weg kostet damit keine Zeremonie: kein Wrapper,
 * keine Kopie der Struktur je Listenart, keine Änderung am Verhalten.
 */
export interface TypedList<TListenart extends string = string> {
  readonly listenart: string;
  readonly version: FormatVersion;
  readonly records: readonly TypedRecord[];
  /** Das zugrunde liegende schema-freie Dokument, für Round-Trip und Rohzugriff. */
  readonly document: DsvDocument;
  /**
   * Phantomfeld: nur zur Unterscheidung der Listenarten im Typsystem. Wird nie
   * gesetzt und nie gelesen.
   */
  readonly __listenart?: TListenart;
}

const AT_START = { line: 1 };

/** Ergebnis ohne typisierte Records, wenn die Datei gar nicht auswertbar ist. */
function rejected<TListenart extends string>(
  document: DsvDocument,
  diagnostics: readonly Diagnostic[],
): ParseResult<TypedList<TListenart>> {
  return {
    document: {
      listenart: document.listenart ?? '',
      // Platzhalter: `records` ist leer, damit ist die Version bedeutungslos.
      version: 7,
      records: [],
      document,
    },
    diagnostics,
    ok: false,
  };
}

/**
 * Liest eine Liste der gegebenen Listenart und legt jeden Feldwert unter seinem
 * Schema-Namen ab.
 *
 * Gelesen wird bewusst nachsichtig: Auch wenn Felder fehlen oder Werte
 * unzulässig sind, entstehen typisierte Records — die Mängel stehen in den
 * Diagnostics. Nur eine falsche Listenart und eine nicht unterstützte
 * Formatversion verhindern die Auswertung ganz, weil dann jede weitere Zuordnung
 * von Feldnamen zu Werten geraten wäre.
 *
 * Die Listenart steckt allein in `schema` — das Lesen selbst ist für alle
 * Listenarten dasselbe Verfahren und nicht bloss ähnlich aussehender Code.
 */
export function parseTypedList<TListenart extends string = string>(
  input: string,
  schema: ListSchema,
): ParseResult<TypedList<TListenart>> {
  const parsed = parseDsv(input);
  const document = parsed.document;
  const listenart = document.listenart;
  const expected = schema.listenart;

  if (listenart !== null && listenart.toLowerCase() !== expected.toLowerCase()) {
    return rejected(document, [
      ...parsed.diagnostics,
      createDiagnostic(
        'wrong-list-type',
        'fatal',
        `Expected list type ${expected}, found ${listenart}`,
        { ...AT_START, data: { expected, actual: listenart } },
      ),
    ]);
  }

  if (!isSupportedVersion(document.version)) {
    // Hier nicht über `validateDocument` gehen: Bei nicht unterstützter Version
    // liefert es genau dieselbe Diagnostic, die `parseDsv` oben schon gemeldet
    // hat — eine DSV6-Datei ergäbe `unsupported-format-version` sonst doppelt.
    //
    // `parseDsv` meldet sie allerdings nur, wenn überhaupt eine Versionszahl
    // lesbar war. Ist keine lesbar (`version === null`), fehlt die Meldung dort
    // und muss hier nachgetragen werden.
    const bereitsGemeldet = parsed.diagnostics.some((d) => d.code === 'unsupported-format-version');

    return rejected(
      document,
      bereitsGemeldet
        ? [...parsed.diagnostics]
        : [...parsed.diagnostics, unsupportedFormatVersion(document.version)],
    );
  }

  const diagnostics = [...parsed.diagnostics, ...validateDocument(document, schema)];

  const version = document.version;
  const records: TypedRecord[] = [];

  for (const item of document.items) {
    if (item.kind !== 'element') continue;

    const def = schema.find(item.element)?.def;
    if (def === undefined) continue;

    const values: Record<string, string> = {};
    for (const [index, fieldDef] of fieldsForVersion(def, version).entries()) {
      values[fieldDef.name] = item.fields[index] ?? '';
    }

    records.push({ element: def.name, line: item.line, values });
  }

  return {
    document: { listenart: listenart ?? expected, version, records, document },
    diagnostics,
    ok: !diagnostics.some((d) => d.severity === 'error' || d.severity === 'fatal'),
  };
}
