/**
 * Wertelisten, die in mehreren Listenarten wortgleich gelten.
 *
 * Hier stehen nur die Vorräte, die in Wettkampfdefinitions- und
 * Wettkampfergebnisliste tatsächlich identisch sind. Ähnlich aussehende, aber
 * abweichende Listen — etwa die Wettkampfart oder das Geschlecht — bleiben
 * bewusst bei der jeweiligen Listenart, damit eine Änderung dort nicht
 * versehentlich die andere Listenart mitverändert.
 */

import type { EnumValue } from './types.js';

/** Bahnlänge des Wettkampfbeckens (dsv8.md:427, dsv8.md:4394). */
export const BAHNLAENGE_WERTE: readonly EnumValue[] = [
  { value: '16', doc: '16⅔ m' },
  { value: '20', doc: '20 m' },
  { value: '25', doc: '25 m' },
  { value: '33', doc: '33⅓ m' },
  { value: '50', doc: '50 m' },
  { value: 'FW', doc: 'Freiwasser' },
  { value: 'X', doc: 'sonstige Bahnlänge' },
];

/** Art der Zeitmessung (dsv8.md:435, dsv8.md:4402). */
export const ZEITMESSUNG_WERTE: readonly EnumValue[] = [
  { value: 'HANDZEIT', doc: 'Handzeit' },
  { value: 'AUTOMATISCH', doc: 'automatische Zeitmessung' },
  { value: 'HALBAUTOMATISCH', doc: 'halbautomatische Zeitmessung' },
];

/** Schwimmart (dsv8.md:1029, dsv8.md:4715). */
export const TECHNIK_WERTE: readonly EnumValue[] = [
  { value: 'F', doc: 'Freistil' },
  { value: 'R', doc: 'Rücken' },
  { value: 'B', doc: 'Brust' },
  { value: 'S', doc: 'Schmetterling' },
  { value: 'L', doc: 'Lagen' },
  { value: 'X', doc: 'beliebige Sonderform' },
];

/**
 * Zuordnung für Bestenlistenauswertungen (dsv8.md:1075, dsv8.md:4784).
 *
 * Die Reihenfolge folgt Kapitel 5.1 (dsv8.md:1097–1107). Kapitel 5.4 führt
 * denselben Wertevorrat als SW, MS, KG, EW, PA, XX auf (dsv8.md:4804–4813).
 * Diese Liste wird von beiden Listenarten benutzt und kann deshalb nur einer
 * der beiden Reihenfolgen folgen; die Reihenfolge trägt keine Bedeutung, da
 * die Prüfung nur Zugehörigkeit zur Menge feststellt.
 */
export const ZUORDNUNG_BESTENLISTE_WERTE: readonly EnumValue[] = [
  { value: 'SW', doc: 'Schwimmen für Jugend und offene Klasse' },
  { value: 'EW', doc: 'vereinfachter Wettkampf' },
  { value: 'PA', doc: 'Wettkämpfe für Para-Schwimmer' },
  { value: 'MS', doc: 'Schwimmen der Masters' },
  { value: 'KG', doc: 'reiner kindgerechter Wettkampf' },
  { value: 'XX', doc: 'Andere' },
];

/** Art der Wertungsklasse (dsv8.md:1165, dsv8.md:4877). */
export const WERTUNGSKLASSE_WERTE: readonly EnumValue[] = [
  { value: 'JG', doc: 'Jahrgang' },
  { value: 'AK', doc: 'Altersklasse' },
];
