import type { ParseResult } from '../document/types.js';
import { WETTKAMPFERGEBNISLISTE } from '../schema/wettkampfergebnisliste.js';
import type { TypedList } from './parse-typed-list.js';
import { parseTypedList } from './parse-typed-list.js';

/** Eine gelesene Wettkampfergebnisliste. */
export type Wettkampfergebnisliste = TypedList;

/**
 * Liest eine Wettkampfergebnisliste und legt jeden Feldwert unter seinem
 * Schema-Namen ab.
 *
 * Wie bei der Wettkampfdefinitionsliste wird nachsichtig gelesen: Mängel stehen
 * in den Diagnostics, verhindern aber die typisierten Records nicht. Nur eine
 * falsche Listenart und eine nicht unterstützte Formatversion — etwa DSV6 —
 * führen zu `fatal` und einem leeren Bestand.
 */
export function parseWettkampfergebnisliste(input: string): ParseResult<Wettkampfergebnisliste> {
  return parseTypedList(input, WETTKAMPFERGEBNISLISTE);
}
