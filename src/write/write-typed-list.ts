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
 * Das Ergebnis des Schreibens mit Durchreichen vorbestehender Mängel.
 *
 * Der Rückgabewert ist bewusst kein blosser Text: Wer den Weg über
 * `…PreservingDefects` wählt, soll nicht daran vorbeikommen zu erfahren, was
 * durchgereicht wurde. Stilles Durchwinken wäre so schlimm wie die
 * Verweigerung — der Ausrichter bekäme die mangelhafte Datei, ohne dass
 * irgendwo stünde, woran es fehlt.
 */
export interface WriteResult {
  /** Der erzeugte Text — dieselbe kanonische Form wie beim strengen Weg. */
  readonly text: string;
  /**
   * Die durchgereichten Mängel, in der Reihenfolge der Rücklese. Leer, wenn
   * nichts durchzureichen war; dann ist die Ausgabe so streng geprüft wie beim
   * Vorgabeweg.
   */
  readonly preservedDefects: readonly Diagnostic[];
}

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
 * und abweichende Schreibweisen sind lesbar, aber nicht schreibbar. Die
 * `specGap`-Fassung desselben Codes hat Schwere `info` und wird davon nicht
 * berührt.
 *
 * Vier echte Dateien verlangen hier gemessen eine Ausnahme und bekommen sie
 * nicht: `wettkampfart` mit `A`/`N` ausserhalb von WERTUNG,
 * `meldegeldTyp` in Grossschreibung, `position` mit `SPR`. Sie lassen sich
 * deshalb auch auf dem ausdrücklichen Weg nicht ausschreiben. Das ist eine
 * eigene, offene Frage — entweder gehören diese Werte in die Wertelisten
 * beziehungsweise als `specGap` markiert, oder der Writer müsste die
 * Schreibweise vereinheitlichen. Beides ist eine Entscheidung über die
 * Leseseite und gehört nicht in die Durchreiche-Stufe: Ein Wert ausserhalb der
 * Werteliste ist kein fehlender Wert.
 *
 * Die drei Graph-Codes sind hier ohnehin unerreichbar: Sie entstehen erst in
 * den Projektionen unter `src/document`, nicht in `parseTypedList`. `'never'`
 * ist für sie die sichere Vorbelegung.
 *
 * Seit dem Durchreichen vorbestehender Mängel hat die Tabelle drei Stufen statt
 * zwei. Die dritte, `'preexisting-defect'`, ist die Antwort auf einen Fall, den
 * die zweiwertige Fassung nicht kannte: Eine echte Datei bringt ein leeres
 * Pflichtfeld mit, der Anwender ändert einen ganz anderen Eintrag und will
 * speichern. Verweigert die Bibliothek das, kann sie nichts, was sie gelesen
 * hat, wieder ausschreiben. Winkt sie es stillschweigend durch, schickt sie den
 * Mangel weiter an den Ausrichter. Die Stufe erlaubt beides zu trennen: nur auf
 * ausdrücklichen Wunsch, und nur gegen einen Bericht.
 *
 * Die Trennlinie innerhalb der Stufe ist, ob der Mangel die Datei unlesbar
 * macht:
 *
 * - **Ein leeres Pflichtfeld** (`missing-required-field`) ist ein fehlender
 *   Wert. Die Datei bleibt zerlegbar, jedes andere Feld bleibt auswertbar, und
 *   der Mangel stammt messbar aus der erzeugenden Software — 53 Vorkommen in 28
 *   von 142 echten Dateien, allen voran `KAMPFGERICHT.vereinDesKampfrichters`
 *   mit 35. Er darf durchgereicht werden.
 * - **Alles andere nicht.** Ein unzulässiger Aufzählungswert
 *   (`invalid-enum-value`) ist kein fehlender Wert, sondern ein Wert, den ein
 *   fremder Leser anders oder gar nicht auflöst; eine falsche Feldzahl
 *   (`unexpected-field-count`), eine kaputte Elementreihenfolge
 *   (`element-order-violation`) oder ein unbekanntes Element
 *   (`unknown-element`) zerstören die Zerlegbarkeit selbst. Dort erzeugte der
 *   Aufrufer eine Datei, die niemand mehr auswerten kann — das ist kein
 *   vorbestehender Mangel mehr, sondern ein neuer.
 */
type Schreiberlaubnis =
  /** Auch in eigener Ausgabe zulässig; erzeugt nie einen Schreibfehler. */
  | 'always'
  /** Nie zulässig, auch nicht auf dem ausdrücklichen Weg. */
  | 'never'
  /**
   * Nur auf ausdrücklichen Wunsch und nur gegen Bericht: ein Mangel, den die
   * Datei mitbringt und der sie lesbar lässt.
   */
  | 'preexisting-defect';

const WARNUNG_IN_EIGENER_AUSGABE_ERLAUBT: Record<DiagnosticCode, Schreiberlaubnis> = {
  'missing-format-element': 'never',
  'missing-dateiende-element': 'never',
  'format-not-first-element': 'never',
  'element-order-violation': 'never',
  'unknown-encoding-replacement-character': 'never',
  'unexpected-bom': 'never',
  'unterminated-field-list': 'never',
  'unexpected-field-count': 'never',
  'unknown-element': 'never',
  'missing-required-field': 'preexisting-defect',
  'invalid-value': 'always',
  'invalid-enum-value': 'never',
  'cardinality-violation': 'never',
  'mutually-exclusive-elements': 'never',
  'conditional-field-required': 'always',
  'unsupported-format-version': 'never',
  'wrong-list-type': 'never',
  'dangling-reference': 'never',
  'ambiguous-reference': 'never',
  'incomplete-relay': 'never',
  'empty-input': 'never',
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
  return WARNUNG_IN_EIGENER_AUSGABE_ERLAUBT[d.code] !== 'always';
}

/**
 * Ob ein Schreibfehler als vorbestehender Mangel durchgereicht werden darf.
 *
 * `fatal` nie: Diese Stufe sagt, dass gar keine verwertbare DSV-Datei
 * vorliegt — da ist nichts durchzureichen, sondern etwas grundlegend kaputt.
 * Sonst entscheidet allein die Tabelle, und zwar unabhängig von der Schwere:
 * `missing-required-field` ist heute `error`, und genau dieser Fall soll
 * durchgereicht werden können. Die Schwere beschreibt, wie schlimm der Mangel
 * ist; die Tabelle, wer ihn zu verantworten hat.
 */
function istVorbestehenderMangel(d: Diagnostic): boolean {
  if (d.severity === 'fatal') return false;
  return WARNUNG_IN_EIGENER_AUSGABE_ERLAUBT[d.code] === 'preexisting-defect';
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
  return write(records, schema, options, false).text;
}

/**
 * Schreibt wie `writeTypedList`, reicht aber vorbestehende Mängel durch.
 *
 * Gedacht für den einen Fall, an dem der strenge Weg scheitern muss: Eine echte
 * Datei einlesen, einen Eintrag ändern, wieder speichern. Bringt die Datei ein
 * leeres Pflichtfeld mit — 28 der 142 gesammelten echten Dateien tun das, allen
 * voran `KAMPFGERICHT.vereinDesKampfrichters` —, so verweigert `writeTypedList`
 * die Ausgabe wegen eines Mangels, den der Anwender nie verursacht und nie
 * berührt hat. Er stammt aus der erzeugenden Software (EasyWk, WebClub,
 * Splash).
 *
 * Der Name sagt, was hier geschieht: Ein bekannter Mangel wird **unverändert
 * weitergereicht**. Das ist keine Bequemlichkeitsoption und heisst deshalb auch
 * nicht `strict: false` — wer diesen Weg wählt, erklärt, dass er eine Datei mit
 * einem Mangel ausliefern will.
 *
 * Durchgereicht wird nur, was die Datei mitbringt und lesbar lässt: heute allein
 * `missing-required-field`. Ein unzulässiger Aufzählungswert, eine falsche
 * Feldzahl oder eine kaputte Elementreihenfolge bleiben verwehrt — dort erzeugte
 * der Aufrufer eine Datei, die niemand mehr auswerten kann. Die Zuordnung steht
 * in `WARNUNG_IN_EIGENER_AUSGABE_ERLAUBT`.
 *
 * Der Rückgabewert ist ein `WriteResult`, kein Text: Wer diesen Weg geht, kommt
 * nicht daran vorbei zu erfahren, was durchgereicht wurde. Sind
 * `preservedDefects` leer, ist die Ausgabe so streng geprüft wie beim
 * Vorgabeweg.
 *
 * @throws {DsvWriteError} bei jedem Befund, der kein vorbestehender Mangel ist.
 */
export function writeTypedListPreservingDefects(
  records: readonly TypedRecord[],
  schema: ListSchema,
  options: WriteOptions = {},
): WriteResult {
  return write(records, schema, options, true);
}

function write(
  records: readonly TypedRecord[],
  schema: ListSchema,
  options: WriteOptions,
  preserve: boolean,
): WriteResult {
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

  const preservedDefects = preserve ? problems.filter(istVorbestehenderMangel) : [];
  const blocking = problems.filter((d) => !preservedDefects.includes(d));

  if (blocking.length > 0) throw new DsvWriteError(blocking);

  return { text, preservedDefects };
}
