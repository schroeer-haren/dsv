import type { TypedRecord } from '../parse/parse-wettkampfdefinitionsliste.js';
import { WETTKAMPFDEFINITIONSLISTE } from '../schema/wettkampfdefinitionsliste.js';
import type { WriteOptions } from './write-typed-list.js';
import { writeTypedList } from './write-typed-list.js';

// Weiter von hier exportiert, damit die bisherigen Importpfade gültig bleiben.
export { DsvWriteError } from './write-typed-list.js';
export type { WriteOptions } from './write-typed-list.js';

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
