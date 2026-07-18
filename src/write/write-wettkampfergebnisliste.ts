import type { TypedRecord } from '../parse/parse-typed-list.js';
import { WETTKAMPFERGEBNISLISTE } from '../schema/wettkampfergebnisliste.js';
import type { WriteOptions } from './write-typed-list.js';
import { writeTypedList } from './write-typed-list.js';

/**
 * Schreibt typisierte Records als Wettkampfergebnisliste.
 *
 * Kanonische Ausgabe und strenge Prüfung besorgt `writeTypedList`; hier steht
 * nur noch, um welche Listenart es geht.
 *
 * Für diese Listenart ist der tolerierte Wert `SPR` der Kampfrichterposition
 * der praktisch bedeutsame Fall: Er kommt in einer echten Datei und im Beispiel
 * der Spezifikation vor, gehört aber nicht zu deren eigener Werteliste. Gelesen
 * wird er mit einer Warnung, geschrieben gar nicht — sonst gäbe die Bibliothek
 * einen Wert aus, den die Spezifikation nicht kennt.
 *
 * @throws {DsvWriteError} wenn Pflichtfelder fehlen, Werte unzulässig sind,
 * Elemente unbekannt sind oder Kardinalitäten verletzt werden.
 */
export function writeWettkampfergebnisliste(
  records: readonly TypedRecord[],
  options: WriteOptions = {},
): string {
  return writeTypedList(records, WETTKAMPFERGEBNISLISTE, options);
}
