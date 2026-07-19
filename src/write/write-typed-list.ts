import type { Diagnostic, DiagnosticCode } from '../diagnostics/types.js';
import { DsvWriteError } from './write-error.js';
import type { TypedRecord } from '../parse/parse-typed-list.js';
import { parseTypedList } from '../parse/parse-typed-list.js';
import type { ListSchema } from '../schema/list-schema.js';
import type { FormatVersion } from '../validate/format-version.js';
import { isSupportedVersion } from '../validate/format-version.js';
import { fieldsForVersion } from '../validate/validate-fields.js';

export interface WriteOptions {
  readonly eol?: '\r\n' | '\n';
  readonly version?: FormatVersion;
}

export { DsvWriteError } from './write-error.js';

/**
 * Welche Warnungen in selbst erzeugtem Text vorkommen dürfen.
 *
 * Die Leseseite ist absichtlich milde: Echte Dateien haben Eigenheiten, die
 * die Bibliothek nicht zurückweisen darf, und sie drückt diese Milde als
 * `warning` aus. Der Writer hat früher schlicht auf `error`/`fatal` gefiltert
 * und damit jede Lese-Milde geerbt — jede neue Warnung wurde automatisch zur
 * Schreib-Erlaubnis. So konnte `writeTypedList` eine Datei mit `DATEIENDE` in
 * Zeile 1 klaglos ausliefern. Zwei Einzelfälle nachzutragen würde den nächsten
 * Fall wieder durchlassen; die Zuordnung gehört deshalb an den Code.
 *
 * Vorbelegung ist **unzulässig**: Aufgeführt wird nur, was ausdrücklich erlaubt
 * ist. Über `Record<DiagnosticCode, …>` ist die Tabelle vollständig — ein neuer
 * Code lässt sich nicht einführen, ohne hier zu entscheiden. Stillschweigend
 * erlaubt wird nichts mehr.
 *
 * Die Trennlinie ist, wer den Mangel in der Hand hat:
 *
 * - **Der Writer selbst** — Aufbau der Datei (Elementreihenfolge, FORMAT
 *   zuerst, DATEIENDE zuletzt, Terminierung, Feldzahl, Kodierung, Listenart,
 *   Version). Diese Befunde kann er immer vermeiden, also darf er sie nie
 *   erzeugen.
 * - **Die Daten des Aufrufers** — die Querregeln über Felder, die die
 *   Spezifikation als „should" formuliert. Sie sind hier erlaubt, weil echte,
 *   vom DSV ausgelieferte Dateien sie verletzen: `zuordnungBestenliste` und
 *   `qualifikationswettkampfnr` tun das in mehreren Fixtures. Verweigerte der
 *   Writer sie, liesse sich eine eingelesene echte Datei nicht wieder
 *   ausschreiben — die Bibliothek verlöre ihren Durchreicheweg. Der Befund
 *   bleibt beim Lesen sichtbar; das ist die richtige Stelle dafür.
 *
 * `invalid-enum-value` steht bewusst **nicht** auf der Liste: Tolerierte Werte
 * und abweichende Schreibweisen sind lesbar, aber nicht schreibbar — und keine
 * echte Datei verlangt hier eine Ausnahme. Die `specGap`-Fassung desselben
 * Codes hat Schwere `info` und wird davon nicht berührt.
 *
 * Die drei Graph-Codes sind hier ohnehin unerreichbar: Sie entstehen erst in
 * den Projektionen unter `src/document`, nicht in `parseTypedList`. `false`
 * ist für sie die sichere Vorbelegung.
 */
const WARNUNG_IN_EIGENER_AUSGABE_ERLAUBT: Record<DiagnosticCode, boolean> = {
  'missing-format-element': false,
  'missing-dateiende-element': false,
  'format-not-first-element': false,
  'element-order-violation': false,
  'unknown-encoding-replacement-character': false,
  'unterminated-field-list': false,
  'unexpected-field-count': false,
  'unknown-element': false,
  'missing-required-field': false,
  'invalid-value': true,
  'invalid-enum-value': false,
  'cardinality-violation': false,
  'mutually-exclusive-elements': false,
  'conditional-field-required': true,
  'unsupported-format-version': false,
  'wrong-list-type': false,
  'dangling-reference': false,
  'ambiguous-reference': false,
  'incomplete-relay': false,
  'empty-input': false,
};

/**
 * Ob ein Befund der Rücklese die Ausgabe verhindert.
 *
 * `fatal` und `error` sind es immer. `info` nie: Diese Stufe trägt keinen
 * Mangel vor, sondern hält eine bewusste Entscheidung fest — einziger Fall ist
 * heute `specGap`, ein Wert, den die Spezifikation in ihrer Werteliste
 * vergessen hat, der aber belegt vorkommt und ausdrücklich gelesen **und**
 * geschrieben werden soll. Für `warning` entscheidet die Tabelle.
 */
function istSchreibfehler(d: Diagnostic): boolean {
  if (d.severity === 'fatal' || d.severity === 'error') return true;
  if (d.severity === 'info') return false;
  return !WARNUNG_IN_EIGENER_AUSGABE_ERLAUBT[d.code];
}

/**
 * Ermittelt die Formatversion aus den Optionen, sonst aus dem FORMAT-Record.
 *
 * `options.version` hat Vorrang. Damit dieser Vorrang benutzbar ist, schreibt
 * `serialize` die ermittelte Version auch in das Versionsfeld des FORMAT-Records
 * — sonst trüge die Ausgabe eine andere Versionsangabe als die Feldauswahl, mit
 * der sie erzeugt wurde, und die abschliessende Prüfung läse sie falsch zurück.
 */
function resolveVersion(
  records: readonly TypedRecord[],
  options: WriteOptions,
): FormatVersion | null {
  if (options.version !== undefined) return options.version;

  const declared = Number(
    records.find((r) => r.element.toUpperCase() === 'FORMAT')?.values['version'],
  );
  return isSupportedVersion(declared) ? declared : null;
}

/** Erzeugt den kanonischen Text, ohne zu prüfen. */
function serialize(
  records: readonly TypedRecord[],
  schema: ListSchema,
  version: FormatVersion,
  eol: string,
): { text: string; unknown: string[] } {
  const lines: string[] = [];
  const unknown: string[] = [];

  for (const record of records) {
    const def = schema.find(record.element)?.def;

    if (def === undefined || (def.since !== undefined && def.since > version)) {
      unknown.push(record.element);
      continue;
    }

    if (def.bare) {
      lines.push(def.name);
      continue;
    }

    // Das FORMAT-Element trägt die Version, mit der geschrieben wird — nicht
    // die, die zufällig im Record steht.
    const isFormat = def.name.toUpperCase() === 'FORMAT';

    const fields = fieldsForVersion(def, version)
      .map((f) => {
        const raw =
          isFormat && f.name === 'version' ? String(version) : (record.values[f.name] ?? '');
        return `${raw.trim()};`;
      })
      .join('');
    lines.push(`${def.name}:${fields}`);
  }

  return { text: lines.map((l) => l + eol).join(''), unknown };
}

/**
 * Schreibt typisierte Records als Liste der gegebenen Listenart.
 *
 * Ausgabeform ist kanonisch: kein Leerzeichen nach dem Doppelpunkt, jedes Feld
 * mit `;` terminiert, `DATEIENDE` ohne Doppelpunkt, standardmässig CRLF.
 * Kommentare, Leerzeilen und Abweichungen der Quelle gehen dabei verloren — wer
 * Byte-Identität braucht, nimmt `writeDsv` auf dem schema-freien Dokument.
 *
 * Geprüft wird streng, und zwar am erzeugten Text statt an den Records: Ein
 * Wert, den der eigene Leser nicht wieder als gültig annimmt, darf die
 * Bibliothek nicht ausliefern. Diese Reihenfolge prüft beides in einem Durchgang
 * — den Inhalt der Records und die Serialisierung selbst — und kann nicht von
 * der Leseseite abweichen, weil sie dieselbe Prüfung benutzt.
 *
 * Die Formatversion kommt aus `options.version`, sonst aus dem FORMAT-Record.
 * Sie bestimmt nicht nur die Feldauswahl, sondern wird auch in das Versionsfeld
 * des FORMAT-Elements geschrieben: Die Ausgabe zeichnet sich damit stets als das
 * aus, als was sie erzeugt wurde. Ohne das hinge an einer Option, die von der
 * Angabe im Record abweicht, eine falsch ausgezeichnete Datei.
 *
 * Strenger als beim Lesen ist dabei alles: Jeder Befund der Rücklese verhindert
 * die Ausgabe, nicht nur `error` und `fatal`. Was der DSV ausliefert, muss die
 * Bibliothek lesen können; was sie selbst erzeugt, soll der Spezifikation
 * entsprechen — und die Milde der Leseseite ist durchweg als `warning`
 * ausgedrückt. Betroffen sind damit tolerierte Aufzählungswerte, abweichende
 * Schreibweisen und ebenso die Elementreihenfolge. Ausgenommen ist allein
 * `info`; siehe `IN_EIGENER_AUSGABE_ERLAUBT`.
 *
 * Die Listenart steckt allein in `schema` — wie beim Lesen ist das Schreiben
 * für alle Listenarten dasselbe Verfahren und nicht bloss ähnlich aussehender
 * Code.
 *
 * @throws {DsvWriteError} wenn Pflichtfelder fehlen, Werte unzulässig sind,
 * Elemente unbekannt sind oder Kardinalitäten verletzt werden.
 */
export function writeTypedList(
  records: readonly TypedRecord[],
  schema: ListSchema,
  options: WriteOptions = {},
): string {
  const version = resolveVersion(records, options);

  if (version === null) {
    throw new DsvWriteError([
      {
        code: 'unsupported-format-version',
        severity: 'fatal',
        message: 'No supported DSV format version given; pass options.version or a FORMAT record',
        line: 1,
      },
    ]);
  }

  const { text, unknown } = serialize(records, schema, version, options.eol ?? '\r\n');

  if (unknown.length > 0) {
    throw new DsvWriteError(
      unknown.map((element) => ({
        code: 'unknown-element' as const,
        severity: 'error' as const,
        message: `${element} is not an element of ${schema.listenart} in DSV${String(version)}`,
        line: 1,
        data: { element },
      })),
    );
  }

  const check = parseTypedList(text, schema);
  const problems = check.diagnostics.filter(istSchreibfehler);

  if (problems.length > 0) throw new DsvWriteError(problems);

  return text;
}
