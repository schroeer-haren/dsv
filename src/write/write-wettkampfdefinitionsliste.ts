import type { TypedRecord } from '../parse/parse-wettkampfdefinitionsliste.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../schema/wettkampfdefinitionsliste.js';
import type { WriteOptions } from './write-typed-list.js';
import type { WriteResult } from './write-typed-list.js';
import { writeTypedList, writeTypedListPreservingDefects } from './write-typed-list.js';

// Weiter von hier exportiert, damit die bisherigen Importpfade gültig bleiben.
export { DsvWriteError } from './write-typed-list.js';
export type { WriteOptions, WriteResult } from './write-typed-list.js';

/**
 * Schreibt typisierte Records als Wettkampfdefinitionsliste.
 *
 * Kanonische Ausgabe und strenge Prüfung besorgt `writeTypedList`; hier steht
 * nur noch, um welche Listenart es geht. Insbesondere sind tolerierte
 * Aufzählungswerte beim Schreiben unzulässig, obwohl sie beim Lesen nur eine
 * Warnung ergeben.
 *
 * @throws {DsvWriteError} wenn Pflichtfelder fehlen, Werte unzulässig sind,
 * Elemente unbekannt sind oder Kardinalitäten verletzt werden.
 */
export function writeWettkampfdefinitionsliste(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): string {
  return writeTypedList(records, WETTKAMPFDEFINITIONSLISTE, options);
}

/**
 * Schreibt eine Wettkampfdefinitionsliste und reicht vorbestehende Mängel durch.
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
export function writeWettkampfdefinitionslistePreservingDefects(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): WriteResult {
  return writeTypedListPreservingDefects(records, WETTKAMPFDEFINITIONSLISTE, options);
}
