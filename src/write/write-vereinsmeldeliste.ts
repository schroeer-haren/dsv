import type { TypedRecord } from '../parse/parse-typed-list.js';
import { VEREINSMELDELISTE } from '../schema/vereinsmeldeliste.js';
import type { WriteOptions } from './write-typed-list.js';
import type { WriteResult } from './write-typed-list.js';
import { writeTypedList, writeTypedListPreservingDefects } from './write-typed-list.js';

/**
 * Schreibt typisierte Records als Vereinsmeldeliste.
 *
 * Kanonische Ausgabe und strenge Prüfung besorgt `writeTypedList`; hier steht
 * nur noch, um welche Listenart es geht.
 *
 * @throws {DsvWriteError} wenn Pflichtfelder fehlen, Werte unzulässig sind,
 * Elemente unbekannt sind oder Kardinalitäten verletzt werden.
 */
export function writeVereinsmeldeliste(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): string {
  return writeTypedList(records, VEREINSMELDELISTE, options);
}

/**
 * Schreibt eine Vereinsmeldeliste und reicht vorbestehende Mängel durch.
 *
 * Der ausdrückliche Weg für den Fall, dass eine eingelesene echte Datei ein
 * Pflichtfeld leer mitbringt: Sie liesse sich sonst nicht wieder ausschreiben,
 * obwohl der Anwender den Mangel weder verursacht noch berührt hat. Was
 * durchgereicht wurde, steht in `preservedDefects` — an dieser Angabe kommt
 * kein Aufrufer vorbei. Alles, was die Datei unlesbar machen würde, bleibt
 * auch hier verwehrt.
 *
 * @throws {DsvWriteError} bei jedem Befund, der kein vorbestehender Mangel ist.
 */
export function writeVereinsmeldelistePreservingDefects(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): WriteResult {
  return writeTypedListPreservingDefects(records, VEREINSMELDELISTE, options);
}
