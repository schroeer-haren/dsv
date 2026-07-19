import type { ParseResult } from '../document/types.js';
import { VEREINSERGEBNISLISTE } from '../schema/vereinsergebnisliste.js';
import type { TypedList } from './parse-typed-list.js';
import { parseTypedList } from './parse-typed-list.js';

/**
 * Eine gelesene Vereinsergebnisliste.
 *
 * Der Typparameter ist ein Phantom: Er unterscheidet die Listenart im
 * Typsystem, ohne die Laufzeitform zu verändern.
 */
export type Vereinsergebnisliste = TypedList<'Vereinsergebnisliste'>;

/**
 * Liest eine Vereinsergebnisliste und legt jeden Feldwert unter seinem
 * Schema-Namen ab.
 *
 * Wie bei den anderen Listenarten wird nachsichtig gelesen: Mängel stehen in
 * den Diagnostics, verhindern aber die typisierten Records nicht. Nur eine
 * falsche Listenart und eine nicht unterstützte Formatversion führen zu
 * `fatal` und einem leeren Bestand.
 */
export function parseVereinsergebnisliste(input: string): ParseResult<Vereinsergebnisliste> {
  return parseTypedList<'Vereinsergebnisliste'>(input, VEREINSERGEBNISLISTE);
}
