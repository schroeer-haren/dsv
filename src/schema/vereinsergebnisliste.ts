/**
 * Schema der Vereinsergebnisliste (dsv8.md:2670 ff.).
 *
 * Wie bei der Vereinsmeldeliste gibt es für diese Listenart keine einzige echte
 * Datei. Die Definitionen stützen sich allein auf Kapitel 5.3 der
 * Spezifikation, gegengeprüft an den Beispielzeilen desselben Kapitels
 * (dsv8.md:4240 ff.) und an einer fremden Ruby-Implementierung.
 *
 * Vier Eigenheiten dieser Listenart sind festzuhalten:
 *
 * - Das Element heisst hier `STAFFELERGEBNIS`, in der Wettkampfergebnisliste
 *   dagegen `STERGEBNIS`. Dasselbe fachliche Ding trägt in verschiedenen
 *   Kapiteln verschiedene Namen; beide Namen bleiben deshalb bei ihrer
 *   jeweiligen Listenart stehen.
 * - `STABLOESE` verweist in seiner Beschreibung (dsv8.md:4175) auf ein Element
 *   „STERGEBNIS", das es in dieser Listenart gar nicht gibt. Gemeint ist
 *   `STAFFEL`; der Verweis ist ein Copy-Paste-Rest der Spezifikation.
 * - Zu `PNREAKTION` und `STABLOESE` führt das Kapitel keine Beispielzeile. Ihre
 *   Attributzahl ist damit nicht gegenprüfbar und stammt allein aus der
 *   Tabelle.
 * - `STAFFELPERSON` hat hier zwölf Attribute, in der Vereinsmeldeliste nur
 *   vier. Gleicher Name, grundverschiedenes Element — ein weiterer Grund,
 *   warum jede Listenart ihre Elemente selbst definiert.
 */

import { listSchema, occurrence } from './list-schema.js';
import {
  BAHNLAENGE_WERTE,
  TECHNIK_WERTE,
  WERTUNGSKLASSE_WERTE,
  ZEITMESSUNG_WERTE,
  ZUORDNUNG_BESTENLISTE_WERTE,
} from './shared-values.js';
import type { EnumValue } from './types.js';
import { element, field } from './types.js';

/**
 * Wertevorrat der Wettkampfart in WETTKAMPF, WERTUNG und den Ergebniselementen.
 *
 * Die Wertetabelle der WERTUNG dieser Listenart nennt A und N nicht
 * (dsv8.md:3197) — anders als WETTKAMPF (dsv8.md:3057) und PERSONENERGEBNIS
 * (dsv8.md:3465), die beide alle sechs Arten führen. Weil `wertungsId` in
 * jedem Ergebnis Pflicht ist und eine Wertung nur zum eigenen Wettkampf
 * gehören darf, könnten Ergebnisse eines Aus- oder Nachschwimmens sonst
 * überhaupt keine gültige Wertung haben.
 *
 * Die engere Tabelle ist deshalb als unvollständig gelesen, nicht als Grenze:
 *
 * - Die Wettkampfergebnisliste, dieselbe Sache in anderer Form, führt A und N
 *   bei WERTUNG ausdrücklich auf (dsv8.md:4913).
 * - In `test/fixtures/real` gibt es Wertungen der Art A (1x) und N (3x); die
 *   beiden Ergebnisse eines Ausschwimmens zeigen dort auf die A-Wertung ihres
 *   eigenen Wettkampfs.
 */
const WETTKAMPFART_WERTE: readonly EnumValue[] = [
  { value: 'V', doc: 'Vorlauf' },
  { value: 'Z', doc: 'Zwischenlauf' },
  { value: 'F', doc: 'Finale' },
  { value: 'E', doc: 'Entscheidung' },
  { value: 'A', doc: 'Ausschwimmen' },
  { value: 'N', doc: 'Nachschwimmen' },
];

/**
 * Wettkampfart des qualifizierenden Laufs. Aus einem Aus- oder Nachschwimmen
 * qualifiziert man sich nicht weiter (dsv8.md:3177).
 */
const QUALIFIKATIONSART_WERTE: readonly EnumValue[] = [
  { value: 'V', doc: 'Vorlauf' },
  { value: 'Z', doc: 'Zwischenlauf' },
  { value: 'F', doc: 'Finale' },
  { value: 'E', doc: 'Entscheidung' },
];

/** Geschlecht bei den geführten Personen (dsv8.md:3406). */
const GESCHLECHT_PERSON_WERTE: readonly EnumValue[] = [
  { value: 'M', doc: 'männlich' },
  { value: 'W', doc: 'weiblich' },
  { value: 'D', doc: 'divers', since: 8 },
];

/** Grund, aus dem ein Start nicht gewertet wird. */
const NICHTWERTUNG_WERTE: readonly EnumValue[] = [
  { value: 'DS', doc: 'disqualifiziert' },
  { value: 'NA', doc: 'nicht angetreten' },
  { value: 'AB', doc: 'abgemeldet' },
  { value: 'AU', doc: 'aufgegeben' },
  { value: 'ZU', doc: 'zurückgezogen' },
];

/** Erhöhtes oder nachträgliches Meldegeld. */
const MELDEGELD_WERTE: readonly EnumValue[] = [
  { value: 'E', doc: 'erhöhtes Meldegeld' },
  { value: 'F', doc: 'erhöhtes und nachträgliches Meldegeld' },
  { value: 'N', doc: 'nachträgliches Meldegeld' },
];

/** Vorzeichen einer Reaktions- oder Ablösezeit. */
const REAKTION_ART_WERTE: readonly EnumValue[] = [
  { value: '+', doc: 'Reaktion nach dem Startsignal' },
  { value: '-', doc: 'Reaktion vor dem Startsignal' },
];

/** FORMAT — Kennzeichnung von Listenart und Formatversion (dsv8.md:2680). */
export const FORMAT = element('FORMAT', [
  field('listart', 'ZK', {
    required: true,
    doc: 'Konstant Vereinsergebnisliste.',
    specRef: 'dsv8.md:2680',
  }),
  field('version', 'Zahl', {
    required: true,
    doc: 'Versionsnummer des DSV-Standards.',
    specRef: 'dsv8.md:2682',
  }),
]);

/** ERZEUGER — erzeugende Software und deren Hersteller (dsv8.md:2704). */
export const ERZEUGER = element('ERZEUGER', [
  field('software', 'ZK', {
    required: true,
    doc: 'Name der erzeugenden Software.',
    specRef: 'dsv8.md:2704',
  }),
  field('version', 'ZK', {
    required: true,
    doc: 'Versionskennung der Software.',
    specRef: 'dsv8.md:2708',
  }),
  field('kontakt', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse des Software-Herstellers.',
    specRef: 'dsv8.md:2710',
  }),
]);

/** VERANSTALTUNG — Eckdaten der Veranstaltung (dsv8.md:2738). */
export const VERANSTALTUNG = element('VERANSTALTUNG', [
  field('veranstaltungsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name der Veranstaltung.',
    specRef: 'dsv8.md:2738',
  }),
  field('veranstaltungsort', 'ZK', {
    required: true,
    doc: 'Ort der Veranstaltung.',
    specRef: 'dsv8.md:2743',
  }),
  field('bahnlaenge', 'ZK', {
    required: true,
    doc: 'Bahnlänge des Wettkampfbeckens.',
    specRef: 'dsv8.md:2745',
    values: BAHNLAENGE_WERTE,
  }),
  field('zeitmessung', 'ZK', {
    required: true,
    doc: 'Art der Zeitmessung.',
    specRef: 'dsv8.md:2749',
    values: ZEITMESSUNG_WERTE,
  }),
]);

/** VERANSTALTER — wer die Veranstaltung verantwortet (dsv8.md:2788). */
export const VERANSTALTER = element('VERANSTALTER', [
  field('nameDesVeranstalters', 'ZK', {
    required: true,
    doc: 'Name des Veranstalters.',
    specRef: 'dsv8.md:2788',
  }),
]);

/** AUSRICHTER — wer die Veranstaltung durchführt (dsv8.md:2813). */
export const AUSRICHTER = element('AUSRICHTER', [
  field('nameDesAusrichters', 'ZK', {
    required: true,
    doc: 'Name des Ausrichters.',
    specRef: 'dsv8.md:2813',
  }),
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname der Ansprechperson.',
    specRef: 'dsv8.md:2816',
  }),
  field('strasse', 'ZK', { doc: 'Strasse.', specRef: 'dsv8.md:2818' }),
  field('plz', 'ZK', { doc: 'Postleitzahl.', specRef: 'dsv8.md:2820' }),
  field('ort', 'ZK', { doc: 'Ort.', specRef: 'dsv8.md:2822' }),
  field('land', 'ZK', { doc: 'WA-Nationenkürzel, dreistellig.', specRef: 'dsv8.md:2824' }),
  field('telefon', 'ZK', { doc: 'Telefonnummer.', specRef: 'dsv8.md:2826' }),
  field('fax', 'ZK', { doc: 'Faxnummer.', specRef: 'dsv8.md:2828' }),
  field('email', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse.',
    specRef: 'dsv8.md:2830',
  }),
]);

/** ABSCHNITT — zeitliche Gliederung der Veranstaltung (dsv8.md:2896). */
export const ABSCHNITT = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts.',
    specRef: 'dsv8.md:2896',
    range: { min: 0, max: 99 },
  }),
  field('abschnittsdatum', 'Datum', {
    required: true,
    doc: 'Datum des Abschnitts.',
    specRef: 'dsv8.md:2900',
  }),
  field('anfangszeit', 'Uhrzeit', {
    required: true,
    doc: 'Beginn des Abschnitts.',
    specRef: 'dsv8.md:2902',
  }),
  field('relativeAngabe', 'Zeichen', {
    doc: 'Ob die Zeitangabe relativ zum Abschnittsbeginn zu lesen ist.',
    specRef: 'dsv8.md:2906',
    default: 'N',
    values: [
      { value: 'J', doc: 'relative Angabe' },
      { value: 'N', doc: 'echte Uhrzeit' },
    ],
  }),
]);

/**
 * KAMPFGERICHT — Besetzung des Kampfgerichts je Abschnitt (dsv8.md:2941).
 *
 * Der Wertevorrat der Position ist weiter als der Einsatzwunsch der
 * Vereinsmeldeliste: `WKH` und `ZBV` gehören hier dazu, dort nicht.
 */
export const KAMPFGERICHT = element('KAMPFGERICHT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts.',
    specRef: 'dsv8.md:2941',
    range: { min: 0, max: 99 },
  }),
  field('position', 'ZK', {
    required: true,
    doc: 'Position im Kampfgericht.',
    specRef: 'dsv8.md:2943',
    values: [
      { value: 'SCH', doc: 'Schiedsrichter*in' },
      { value: 'STA', doc: 'Starter*in' },
      { value: 'ZRO', doc: 'Zeitnehmer-Obmann/-frau' },
      { value: 'ZR', doc: 'Zeitnehmer*in' },
      { value: 'ZNO', doc: 'Zielrichter-Obmann/-frau' },
      { value: 'ZN', doc: 'Zielrichter*in' },
      { value: 'RZN', doc: 'Richter*in für Zielankunft' },
      { value: 'SR', doc: 'Schwimmrichter*in' },
      { value: 'WRO', doc: 'Wenderichter-Obmann/-frau' },
      { value: 'WR', doc: 'Wenderichter*in' },
      { value: 'AUS', doc: 'Auswerter*in' },
      { value: 'SP', doc: 'Sprecher*in' },
      { value: 'PKF', doc: 'Protokollkampfrichter*in' },
      { value: 'STO', doc: 'Startordner*in' },
      { value: 'WKH', doc: 'Wettkampfhelfer*in' },
      { value: 'ASCH', doc: 'Assistenz Schiedsrichter*in' },
      { value: 'SIB', doc: 'Sicherheitsbeauftragte*r' },
      { value: 'SAUF', doc: 'Schwimmaufsicht' },
      { value: 'VER', doc: 'Verpflegung' },
      { value: 'ZBV', doc: 'zur besonderen Verwendung' },
    ],
  }),
  field('nameKampfrichter', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:2993',
  }),
  field('vereinDesKampfrichters', 'ZK', {
    required: true,
    doc: 'Verein, für den die Person antritt.',
    specRef: 'dsv8.md:2996',
  }),
]);

/** WETTKAMPF — die geschwommenen Wettkämpfe (dsv8.md:3037). */
export const WETTKAMPF = element('WETTKAMPF', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes, maximal dreistellig.',
    specRef: 'dsv8.md:3037',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3039',
    values: WETTKAMPFART_WERTE,
  }),
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, in dem der Wettkampf stattfand.',
    specRef: 'dsv8.md:3069',
    range: { min: 0, max: 99 },
  }),
  field('anzahlStarter', 'Zahl', {
    doc: 'Anzahl der Staffelteilnehmer; für Einzeldisziplinen 1.',
    specRef: 'dsv8.md:3071',
    default: '1',
  }),
  field('einzelstrecke', 'Zahl', {
    required: true,
    doc: 'Strecke in Metern; 0 steht für sonstige Strecken.',
    specRef: 'dsv8.md:3073',
    range: { min: 0, max: 25000 },
  }),
  field('technik', 'Zeichen', {
    required: true,
    doc: 'Schwimmart.',
    specRef: 'dsv8.md:3087',
    values: TECHNIK_WERTE,
  }),
  field('ausuebung', 'ZK', {
    required: true,
    doc: 'Ausübung der Schwimmart.',
    specRef: 'dsv8.md:3102',
    values: [
      { value: 'GL', doc: 'Gleichgültig' },
      { value: 'BE', doc: 'Beine' },
      { value: 'AR', doc: 'Arme' },
      { value: 'ST', doc: 'Start' },
      { value: 'WE', doc: 'Wende' },
      { value: 'GB', doc: 'Gleitübung Beine' },
      { value: 'KB', doc: 'Kicks auf dem Bauch', since: 8 },
      { value: 'KR', doc: 'Kicks auf dem Rücken', since: 8 },
      { value: 'X', doc: 'beliebige Sonderform' },
    ],
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht der Startberechtigten.',
    specRef: 'dsv8.md:3125',
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers', since: 8 },
      { value: 'X', doc: 'gemischte Wettkämpfe' },
    ],
  }),
  field('zuordnungBestenliste', 'ZK', {
    required: true,
    doc: 'Zuordnung für Bestenlistenauswertungen.',
    specRef: 'dsv8.md:3133',
    values: ZUORDNUNG_BESTENLISTE_WERTE,
  }),
  field('qualifikationswettkampfnr', 'Zahl', {
    doc: 'Nummer des qualifizierenden Wettkampfes.',
    specRef: 'dsv8.md:3161',
    range: { min: 0, max: 999 },
  }),
  field('qualifikationswettkampfart', 'Zeichen', {
    doc: 'Art des qualifizierenden Wettkampfes.',
    specRef: 'dsv8.md:3177',
    values: QUALIFIKATIONSART_WERTE,
  }),
]);

/**
 * WERTUNG — die Wertungsklassen eines Wettkampfes (dsv8.md:3205).
 *
 * Zur Wettkampfart siehe `WETTKAMPFART_WERTE`: Die Wertetabelle dieser
 * Listenart nennt `A` und `N` nicht, ist damit aber nachweislich unvollständig
 * — sonst könnten Ergebnisse eines Aus- oder Nachschwimmens keine Wertung
 * haben, obwohl `wertungsId` dort Pflicht ist.
 */
export const WERTUNG = element('WERTUNG', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:3205',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3207',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Wertung innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3253',
  }),
  field('wertungsklasseTyp', 'ZK', {
    required: true,
    doc: 'Art der Wertungsklasse.',
    specRef: 'dsv8.md:3257',
    values: WERTUNGSKLASSE_WERTE,
  }),
  field('mindestJgAk', 'JGAK', {
    required: true,
    doc: 'Untere Grenze des Jahrgangs oder der Altersklasse.',
    specRef: 'dsv8.md:3263',
  }),
  field('maximalJgAk', 'JGAK', {
    doc: 'Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.',
    specRef: 'dsv8.md:3266',
  }),
  field('geschlecht', 'Zeichen', {
    doc: 'Geschlecht der gewerteten Startberechtigten.',
    specRef: 'dsv8.md:3273',
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers', since: 8 },
      { value: 'X', doc: 'gemischte Wertung' },
    ],
  }),
  field('wertungsname', 'ZK', {
    required: true,
    doc: 'Bezeichnung der Wertung.',
    specRef: 'dsv8.md:3289',
  }),
]);

/**
 * VEREIN — der Verein, dessen Ergebnisse die Datei enthält (dsv8.md:3311).
 *
 * Genau ein Vorkommen: Die Vereinsergebnisliste berichtet immer über einen
 * einzigen Verein. Ein Lastschrift-Attribut gibt es hier nicht, anders als in
 * der Vereinsmeldeliste.
 */
export const VEREIN = element('VEREIN', [
  field('vereinsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name des Vereins.',
    specRef: 'dsv8.md:3311',
  }),
  field('vereinskennzahl', 'Zahl', {
    required: true,
    doc: 'Kennzahl des Vereins.',
    specRef: 'dsv8.md:3313',
  }),
  field('landesschwimmverband', 'Zahl', {
    required: true,
    doc: 'Kennzahl des Landesschwimmverbandes.',
    specRef: 'dsv8.md:3319',
  }),
  field('nationenkuerzel', 'ZK', {
    required: true,
    doc: 'WA-Nationenkürzel, dreistellig.',
    specRef: 'dsv8.md:3346',
  }),
]);

/**
 * PERSON — die Personen des Vereins (dsv8.md:3376).
 *
 * Anders als PNMELDUNG der Vereinsmeldeliste führt dieses Element keinen
 * Verweis auf eine Trainermeldung; Trainer kommen in der Ergebnisliste nicht
 * vor.
 */
export const PERSON = element('PERSON', [
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:3376',
  }),
  field('dsvId', 'Zahl', {
    required: true,
    doc: 'DSV-Identifikationsnummer.',
    specRef: 'dsv8.md:3378',
  }),
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3385',
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht.',
    specRef: 'dsv8.md:3406',
    values: GESCHLECHT_PERSON_WERTE,
  }),
  field('jahrgang', 'Zahl', {
    required: true,
    doc: 'Geburtsjahrgang, vierstellig.',
    specRef: 'dsv8.md:3421',
  }),
  field('altersklasse', 'Zahl', {
    doc: 'Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.',
    specRef: 'dsv8.md:3423',
  }),
  field('nationalitaet1', 'ZK', {
    doc: 'Erste Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:3425',
  }),
  field('nationalitaet2', 'ZK', {
    doc: 'Zweite Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:3433',
  }),
  field('nationalitaet3', 'ZK', {
    doc: 'Dritte Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:3437',
  }),
]);

/** PERSONENERGEBNIS — Ergebnis einer Person in einem Wettkampf (dsv8.md:3480). */
export const PERSONENERGEBNIS = element('PERSONENERGEBNIS', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3480',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:3485',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3487',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Wertung innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3493',
  }),
  field('platz', 'Zahl', {
    required: true,
    doc: 'Erreichter Platz; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.',
    specRef: 'dsv8.md:3495',
  }),
  field('endzeit', 'Zeit', {
    required: true,
    doc: 'Geschwommene Endzeit.',
    specRef: 'dsv8.md:3497',
  }),
  field('grundDerNichtwertung', 'ZK', {
    doc: 'Grund, aus dem das Ergebnis nicht gewertet wird.',
    specRef: 'dsv8.md:3499',
    values: NICHTWERTUNG_WERTE,
  }),
  field('disqualifikationsbemerkung', 'ZK', {
    doc: 'Erläuterung zur Disqualifikation.',
    specRef: 'dsv8.md:3569',
  }),
  field('erhoehtesNachtraeglichesMeldegeld', 'Zeichen', {
    doc: 'Kennzeichen für erhöhtes oder nachträgliches Meldegeld.',
    specRef: 'dsv8.md:3579',
    values: MELDEGELD_WERTE,
  }),
]);

/** PNZWISCHENZEIT — Zwischenzeit einer Person (dsv8.md:3602). */
export const PNZWISCHENZEIT = element('PNZWISCHENZEIT', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3602',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:3607',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3611',
    values: WETTKAMPFART_WERTE,
  }),
  field('distanz', 'Zahl', {
    required: true,
    doc: 'Distanz in Metern, auf die sich die Zwischenzeit bezieht.',
    specRef: 'dsv8.md:3615',
  }),
  field('zwischenzeit', 'Zeit', {
    required: true,
    doc: 'Gemessene Zwischenzeit.',
    specRef: 'dsv8.md:3617',
  }),
]);

/**
 * PNREAKTION — Reaktionszeit einer Person am Start (dsv8.md:3663).
 *
 * Zu diesem Element führt das Kapitel keine Beispielzeile; die Zahl der
 * Attribute ist damit nicht gegenprüfbar.
 */
export const PNREAKTION = element('PNREAKTION', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3663',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:3668',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3672',
    values: WETTKAMPFART_WERTE,
  }),
  field('art', 'Zeichen', {
    doc: 'Vorzeichen der Reaktionszeit.',
    specRef: 'dsv8.md:3698',
    default: '+',
    values: REAKTION_ART_WERTE,
  }),
  field('reaktionszeit', 'Zeit', {
    required: true,
    doc: 'Gemessene Reaktionszeit.',
    specRef: 'dsv8.md:3712',
  }),
]);

/**
 * STAFFEL — die Staffeln des Vereins (dsv8.md:3736).
 *
 * Anders als STMELDUNG der Vereinsmeldeliste führt dieses Element keinen
 * Staffelnamen.
 */
export const STAFFEL = element('STAFFEL', [
  field('nummerDerMannschaft', 'Zahl', {
    required: true,
    doc: 'Nummer der Mannschaft innerhalb des Vereins.',
    specRef: 'dsv8.md:3736',
  }),
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3739',
  }),
  field('wertungsklasseTyp', 'ZK', {
    required: true,
    doc: 'Art der Wertungsklasse.',
    specRef: 'dsv8.md:3746',
    values: WERTUNGSKLASSE_WERTE,
  }),
  field('mindestJgAk', 'JGAK', {
    required: true,
    doc: 'Untere Grenze des Jahrgangs oder der Altersklasse.',
    specRef: 'dsv8.md:3752',
  }),
  field('maximalJgAk', 'JGAK', {
    doc: 'Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.',
    specRef: 'dsv8.md:3758',
  }),
]);

/**
 * STAFFELPERSON — Besetzung einer Staffel (dsv8.md:3848).
 *
 * Hier stehen zwölf Felder, weil die Staffelbesetzung die Person vollständig
 * wiederholt. Das gleichnamige Element der Vereinsmeldeliste kommt mit vier
 * aus und verweist nur.
 */
export const STAFFELPERSON = element('STAFFELPERSON', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3848',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:3853',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3857',
    values: WETTKAMPFART_WERTE,
  }),
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:3867',
  }),
  field('dsvId', 'Zahl', {
    required: true,
    doc: 'DSV-Identifikationsnummer.',
    specRef: 'dsv8.md:3869',
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:3872',
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht.',
    specRef: 'dsv8.md:3877',
    values: GESCHLECHT_PERSON_WERTE,
  }),
  field('jahrgang', 'Zahl', {
    required: true,
    doc: 'Geburtsjahrgang, vierstellig.',
    specRef: 'dsv8.md:3892',
  }),
  field('altersklasse', 'Zahl', {
    doc: 'Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.',
    specRef: 'dsv8.md:3894',
  }),
  field('nationalitaet1', 'ZK', {
    doc: 'Erste Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:3896',
  }),
  field('nationalitaet2', 'ZK', {
    doc: 'Zweite Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:3904',
  }),
  field('nationalitaet3', 'ZK', {
    doc: 'Dritte Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:3908',
  }),
]);

/**
 * STAFFELERGEBNIS — Ergebnis einer Staffel in einem Wettkampf (dsv8.md:3944).
 *
 * In der Wettkampfergebnisliste heisst dasselbe Element `STERGEBNIS`.
 */
export const STAFFELERGEBNIS = element('STAFFELERGEBNIS', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3944',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:3947',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:3949',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Wertung innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:3979',
  }),
  field('platz', 'Zahl', {
    required: true,
    doc: 'Erreichter Platz; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.',
    specRef: 'dsv8.md:3981',
  }),
  field('endzeit', 'Zeit', {
    required: true,
    doc: 'Geschwommene Endzeit.',
    specRef: 'dsv8.md:3983',
  }),
  field('grundDerNichtwertung', 'ZK', {
    doc: 'Grund, aus dem das Ergebnis nicht gewertet wird.',
    specRef: 'dsv8.md:3985',
    values: NICHTWERTUNG_WERTE,
  }),
  field('startnummerDisqualifiziert', 'Zahl', {
    doc: 'Startnummer der disqualifizierten Person; 0 bei allgemeinem Disqualifikationsgrund.',
    specRef: 'dsv8.md:4003',
  }),
  field('disqualifikationsbemerkung', 'ZK', {
    doc: 'Erläuterung zur Disqualifikation.',
    specRef: 'dsv8.md:4044',
  }),
  field('erhoehtesNachtraeglichesMeldegeld', 'Zeichen', {
    doc: 'Kennzeichen für erhöhtes oder nachträgliches Meldegeld.',
    specRef: 'dsv8.md:4054',
    values: MELDEGELD_WERTE,
  }),
]);

/** STZWISCHENZEIT — Zwischenzeit innerhalb einer Staffel (dsv8.md:4077). */
export const STZWISCHENZEIT = element('STZWISCHENZEIT', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:4077',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:4082',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:4086',
    values: WETTKAMPFART_WERTE,
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:4092',
  }),
  field('distanz', 'Zahl', {
    required: true,
    doc: 'Distanz in Metern, auf die sich die Zwischenzeit bezieht.',
    specRef: 'dsv8.md:4097',
  }),
  field('zwischenzeit', 'Zeit', {
    required: true,
    doc: 'Gemessene Zwischenzeit.',
    specRef: 'dsv8.md:4099',
  }),
]);

/**
 * STABLOESE — Ablösezeit einer Staffelperson (dsv8.md:4155).
 *
 * Die Beschreibung der Veranstaltungs-ID verweist auf ein Element
 * „STERGEBNIS" (dsv8.md:4175), das es in dieser Listenart nicht gibt. Gemeint
 * ist `STAFFEL`; der Verweis ist ein Copy-Paste-Rest aus dem Kapitel der
 * Wettkampfergebnisliste. Eine Beispielzeile führt das Kapitel zu diesem
 * Element nicht; die Zahl der Attribute ist damit nicht gegenprüfbar.
 */
export const STABLOESE = element('STABLOESE', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:4155',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:4160',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:4164',
    values: WETTKAMPFART_WERTE,
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:4196',
  }),
  field('art', 'Zeichen', {
    doc: 'Vorzeichen der Ablösezeit.',
    specRef: 'dsv8.md:4201',
    default: '+',
    values: REAKTION_ART_WERTE,
  }),
  field('reaktionszeit', 'Zeit', {
    required: true,
    doc: 'Gemessene Ablösezeit.',
    specRef: 'dsv8.md:4215',
  }),
]);

/** DATEIENDE — schliesst die Datei ab, ohne Doppelpunkt und ohne Attribute. */
export const DATEIENDE = element('DATEIENDE', [], { bare: true });

/** Alle Elemente der Vereinsergebnisliste mit ihren Kardinalitäten. */
export const VEREINSERGEBNISLISTE = listSchema('Vereinsergebnisliste', [
  occurrence(FORMAT, { min: 1, max: 1 }),
  occurrence(ERZEUGER, { min: 1, max: 1 }),
  occurrence(VERANSTALTUNG, { min: 1, max: 1 }),
  occurrence(VERANSTALTER, { min: 1, max: 1 }),
  occurrence(AUSRICHTER, { min: 1, max: 1 }),
  occurrence(ABSCHNITT, { min: 1, max: null }),
  occurrence(KAMPFGERICHT, { min: 0, max: null }),
  occurrence(WETTKAMPF, { min: 1, max: null }),
  occurrence(WERTUNG, { min: 1, max: null }),
  occurrence(VEREIN, { min: 1, max: 1 }),
  occurrence(PERSON, { min: 0, max: null }),
  occurrence(PERSONENERGEBNIS, { min: 0, max: null }),
  occurrence(PNZWISCHENZEIT, { min: 0, max: null }),
  occurrence(PNREAKTION, { min: 0, max: null }),
  occurrence(STAFFEL, { min: 0, max: null }),
  occurrence(STAFFELPERSON, { min: 0, max: null }),
  occurrence(STAFFELERGEBNIS, { min: 0, max: null }),
  occurrence(STZWISCHENZEIT, { min: 0, max: null }),
  occurrence(STABLOESE, { min: 0, max: null }),
  occurrence(DATEIENDE, { min: 1, max: 1 }),
]);
