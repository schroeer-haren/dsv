import type { TypedRecord } from '../parse/parse-typed-list.js';
import { VEREINSERGEBNISLISTE } from '../schema/vereinsergebnisliste.js';
import type { WriteOptions } from './write-typed-list.js';
import { writeTypedList } from './write-typed-list.js';

/**
 * Schreibt typisierte Records als Vereinsergebnisliste.
 *
 * Kanonische Ausgabe und strenge Prüfung besorgt `writeTypedList`; hier steht
 * nur noch, um welche Listenart es geht.
 *
 * @throws {DsvWriteError} wenn Pflichtfelder fehlen, Werte unzulässig sind,
 * Elemente unbekannt sind oder Kardinalitäten verletzt werden.
 */
export function writeVereinsergebnisliste(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): string {
  return writeTypedList(records, VEREINSERGEBNISLISTE, options);
}
