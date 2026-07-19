/**
 * Schema der Vereinsmeldeliste (dsv8.md:1520 ff.).
 *
 * Die Definitionen stützen sich auf Kapitel 5.2 der Spezifikation,
 * gegengeprüft an den Beispielzeilen desselben Kapitels und an einer fremden
 * Ruby-Implementierung. Wo Tabelle und Beispiel einander widersprechen, steht
 * die Entscheidung am betroffenen Element.
 *
 * Anders als bei ihrer Entstehung gibt es für diese Listenart inzwischen echte
 * Dateien: 34 Vereinsmeldelisten in DSV7, alle von WebClub 1.76. Sie
 * bestätigen die Tabelle weitgehend — insbesondere die Feldzahlen samt der
 * `since: 8`-Markierungen — und haben eine Lücke aufgedeckt, siehe
 * `WETTKAMPFART_WERTE`. Der vollständige Befund steht in
 * `test/parse/parse-vereinsmeldeliste.test.ts`.
 *
 * Wie bei den anderen Listenarten sind die gleichnamigen Kopfelemente eigene
 * Definitionen: ABSCHNITT führt hier vier Felder, WETTKAMPF kennt keine
 * Zuordnung zur Bestenliste, und STAFFELPERSON hat vier statt zwölf Felder.
 * Gemeinsam ist nur, was in `shared-values.ts` steht.
 */

import { listSchema, occurrence } from './list-schema.js';
import {
  BAHNLAENGE_WERTE,
  TECHNIK_WERTE,
  WERTUNGSKLASSE_WERTE,
  ZEITMESSUNG_WERTE,
} from './shared-values.js';
import type { EnumValue } from './types.js';
import { element, field } from './types.js';

/**
 * Wertevorrat der Wettkampfart.
 *
 * Die Wertetabelle der Spezifikation nennt für dieses Feld nur `V` und `E`
 * (dsv8.md:1729). Die Beispielzeile desselben Kapitels verwendet aber `F`
 * (dsv8.md:2608), und das unmittelbar benachbarte Feld der qualifizierenden
 * Wettkampfart führt V, Z, F und E auf. Die Aufzählung ist damit nachweislich
 * unvollständig; hier stehen deshalb alle vier Werte. Die echten Dateien
 * bestätigen das: `E` und `F` kommen tausendfach vor.
 *
 * `A` und `N` sieht die Spezifikation nur in den Ergebnislisten vor
 * (dsv8.md:3058). Die Wettkampfdefinitionsliste toleriert sie trotzdem, weil
 * `N` dort in echten Ausschreibungen belegt ist. Für die Vereinsmeldeliste
 * liegt nun ein Beleg für `A` vor: `2026-06-28-Gera-SVHaren-Me.dsv7` meldet
 * einen Wettkampf mit Art `A`. Für `N` gibt es hier keinen Beleg — belegt ist
 * es nur in der Wettkampfdefinitionsliste, so wie `A` nur hier. Toleriert wird
 * deshalb beides der Symmetrie halber: beim Lesen angenommen, beim Schreiben
 * weiterhin unzulässig.
 */
const WETTKAMPFART_WERTE: readonly EnumValue[] = [
  { value: 'V', doc: 'Vorlauf' },
  { value: 'Z', doc: 'Zwischenlauf' },
  { value: 'F', doc: 'Finale' },
  { value: 'E', doc: 'Entscheidung' },
  { value: 'A', doc: 'Ausschwimmen', tolerated: true },
  { value: 'N', doc: 'Nachschwimmen', tolerated: true },
];

/**
 * Wettkampfart des qualifizierenden Laufs. Aus einem Aus- oder Nachschwimmen
 * qualifiziert man sich nicht weiter (dsv8.md:1815).
 *
 * Eigene Konstante, obwohl die vier Werte denen von `WETTKAMPFART_WERTE`
 * gleichen: Die dortige Tolerierung von A und N gilt ausdrücklich nur für die
 * Wettkampfart selbst. Teilte sich dieses Feld die Konstante, schlüge sie auf
 * ein Feld durch, für das die Spezifikation A und N in keiner Listenart führt
 * und für das es im gesamten Bestand echter Dateien keinen Beleg gibt.
 */
const QUALIFIKATIONSART_WERTE: readonly EnumValue[] = [
  { value: 'V', doc: 'Vorlauf' },
  { value: 'Z', doc: 'Zwischenlauf' },
  { value: 'F', doc: 'Finale' },
  { value: 'E', doc: 'Entscheidung' },
];

/**
 * Geschlecht bei den gemeldeten Personen (dsv8.md:2206).
 *
 * Ohne `since`: `D` steht an PNMELDUNG schon in DSV7 (dsv7.md:2070). Neu ist
 * divers in dieser Listenart am WETTKAMPF sowie an den beiden Feldern, die es
 * in DSV7 überhaupt nicht gibt — `KARIMELDUNG.geschlecht` und
 * `TRAINER.geschlecht`.
 */
const GESCHLECHT_PERSON_WERTE: readonly EnumValue[] = [
  { value: 'M', doc: 'männlich' },
  { value: 'W', doc: 'weiblich' },
  { value: 'D', doc: 'divers' },
];

/** Startklassen einer Schwimmart, `AB` für ohne Startklasse. */
function startklassen(
  praefix: string,
  nummern: readonly number[],
  luecken: readonly number[] = [],
): readonly EnumValue[] {
  return [
    { value: 'AB', doc: 'ohne Startklasse' },
    ...nummern.map((n) => ({
      value: `${praefix}${String(n)}`,
      doc: `Startklasse ${praefix}${String(n)}`,
      ...(luecken.includes(n) ? { specGap: true } : {}),
    })),
  ];
}

/** FORMAT — Kennzeichnung von Listenart und Formatversion (dsv8.md:1530). */
export const FORMAT = element('FORMAT', [
  field('listart', 'ZK', {
    required: true,
    doc: 'Konstant Vereinsmeldeliste.',
    specRef: 'dsv8.md:1530',
  }),
  field('version', 'Zahl', {
    required: true,
    doc: 'Versionsnummer des DSV-Standards.',
    specRef: 'dsv8.md:1532',
  }),
]);

/** ERZEUGER — erzeugende Software und deren Hersteller (dsv8.md:1554). */
export const ERZEUGER = element('ERZEUGER', [
  field('software', 'ZK', {
    required: true,
    doc: 'Name der erzeugenden Software.',
    specRef: 'dsv8.md:1554',
  }),
  field('version', 'ZK', {
    required: true,
    doc: 'Versionskennung der Software.',
    specRef: 'dsv8.md:1556',
  }),
  field('kontakt', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse des Software-Herstellers.',
    specRef: 'dsv8.md:1558',
  }),
]);

/** VERANSTALTUNG — Eckdaten der Veranstaltung (dsv8.md:1588). */
export const VERANSTALTUNG = element('VERANSTALTUNG', [
  field('veranstaltungsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name der Veranstaltung.',
    specRef: 'dsv8.md:1588',
  }),
  field('veranstaltungsort', 'ZK', {
    required: true,
    doc: 'Ort der Veranstaltung.',
    specRef: 'dsv8.md:1591',
  }),
  field('bahnlaenge', 'ZK', {
    required: true,
    doc: 'Bahnlänge des Wettkampfbeckens.',
    specRef: 'dsv8.md:1594',
    values: BAHNLAENGE_WERTE,
  }),
  field('zeitmessung', 'ZK', {
    required: true,
    doc: 'Art der Zeitmessung.',
    specRef: 'dsv8.md:1602',
    values: ZEITMESSUNG_WERTE,
  }),
]);

/** ABSCHNITT — zeitliche Gliederung der Veranstaltung (dsv8.md:1641). */
export const ABSCHNITT = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts.',
    specRef: 'dsv8.md:1641',
    range: { min: 0, max: 99 },
  }),
  field('abschnittsdatum', 'Datum', {
    required: true,
    doc: 'Datum des Abschnitts.',
    specRef: 'dsv8.md:1645',
  }),
  field('anfangszeit', 'Uhrzeit', {
    required: true,
    doc: 'Beginn des Abschnitts.',
    specRef: 'dsv8.md:1650',
  }),
  field('relativeAngabe', 'Zeichen', {
    doc: 'Ob die Zeitangabe relativ zum Abschnittsbeginn zu lesen ist.',
    specRef: 'dsv8.md:1654',
    default: 'N',
    values: [
      { value: 'J', doc: 'relative Angabe' },
      { value: 'N', doc: 'echte Uhrzeit' },
    ],
  }),
]);

/**
 * WETTKAMPF — die ausgeschriebenen Wettkämpfe (dsv8.md:1693).
 *
 * Anders als in Wettkampfdefinitions- und Wettkampfergebnisliste führt dieses
 * Element keine Zuordnung zur Bestenliste; es hat genau zehn Felder.
 */
export const WETTKAMPF = element('WETTKAMPF', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes, maximal dreistellig.',
    specRef: 'dsv8.md:1693',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:1695',
    values: WETTKAMPFART_WERTE,
  }),
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, in dem der Wettkampf stattfindet.',
    specRef: 'dsv8.md:1697',
    range: { min: 0, max: 99 },
  }),
  field('anzahlStarter', 'Zahl', {
    doc: 'Anzahl der Staffelteilnehmer; für Einzeldisziplinen 1.',
    specRef: 'dsv8.md:1699',
    default: '1',
  }),
  field('einzelstrecke', 'Zahl', {
    required: true,
    doc: 'Strecke in Metern; 0 steht für sonstige Strecken.',
    specRef: 'dsv8.md:1701',
    range: { min: 0, max: 25000 },
  }),
  field('technik', 'Zeichen', {
    required: true,
    doc: 'Schwimmart.',
    specRef: 'dsv8.md:1741',
    values: TECHNIK_WERTE,
  }),
  field('ausuebung', 'ZK', {
    required: true,
    doc: 'Ausübung der Schwimmart.',
    specRef: 'dsv8.md:1749',
    values: [
      { value: 'GL', doc: 'ganze Lage' },
      { value: 'BE', doc: 'Beine' },
      { value: 'AR', doc: 'Arme' },
      { value: 'ST', doc: 'Start' },
      { value: 'WE', doc: 'Wende' },
      { value: 'GB', doc: 'Gleitübung' },
      { value: 'KB', doc: 'Kicks Bauchlage, nur bei Technik S', since: 8 },
      { value: 'KR', doc: 'Kicks Rückenlage, nur bei Technik S', since: 8 },
      { value: 'X', doc: 'beliebige Sonderform' },
    ],
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht der Startberechtigten.',
    specRef: 'dsv8.md:1779',
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers', since: 8 },
      { value: 'X', doc: 'gemischte Wettkämpfe' },
    ],
  }),
  field('qualifikationswettkampfnr', 'Zahl', {
    doc: 'Nummer des qualifizierenden Wettkampfes.',
    specRef: 'dsv8.md:1793',
    range: { min: 0, max: 999 },
  }),
  field('qualifikationswettkampfart', 'Zeichen', {
    doc: 'Art des qualifizierenden Wettkampfes.',
    specRef: 'dsv8.md:1796',
    values: QUALIFIKATIONSART_WERTE,
  }),
]);

/**
 * VEREIN — der meldende Verein (dsv8.md:1838).
 *
 * Das Änderungsverzeichnis kündigt für diese Listenart ein eigenes Element
 * `LASTSCHRIFT` an (dsv8.md:118). Kapitel 5.2 kennt aber nur das hier
 * geführte Attribut, und die Beispielzeile bestätigt fünf Felder. Wir folgen
 * Kapitel und Beispiel.
 */
export const VEREIN = element('VEREIN', [
  field('vereinsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name des Vereins.',
    specRef: 'dsv8.md:1838',
  }),
  field('vereinskennzahl', 'Zahl', {
    required: true,
    doc: 'Kennzahl des Vereins.',
    specRef: 'dsv8.md:1840',
  }),
  field('landesschwimmverband', 'Zahl', {
    required: true,
    doc: 'Kennzahl des Landesschwimmverbandes.',
    specRef: 'dsv8.md:1846',
  }),
  field('nationenkuerzel', 'ZK', {
    required: true,
    doc: 'WA-Nationenkürzel, dreistellig.',
    specRef: 'dsv8.md:1857',
  }),
  field('lastschrift', 'Zeichen', {
    since: 8,
    doc: 'Ob das Meldegeld per Lastschrift eingezogen werden darf.',
    specRef: 'dsv8.md:1863',
    default: 'N',
    values: [
      { value: 'J', doc: 'ja' },
      { value: 'N', doc: 'nein' },
    ],
  }),
]);

/** ANSPRECHPARTNER — Meldeadresse des Vereins (dsv8.md:1903). */
export const ANSPRECHPARTNER = element('ANSPRECHPARTNER', [
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname der Ansprechperson.',
    specRef: 'dsv8.md:1903',
  }),
  field('strasse', 'ZK', { doc: 'Strasse.', specRef: 'dsv8.md:1905' }),
  field('plz', 'ZK', { doc: 'Postleitzahl.', specRef: 'dsv8.md:1907' }),
  field('ort', 'ZK', { doc: 'Ort.', specRef: 'dsv8.md:1909' }),
  field('land', 'ZK', { doc: 'WA-Nationenkürzel, dreistellig.', specRef: 'dsv8.md:1911' }),
  field('telefon', 'ZK', { doc: 'Telefonnummer.', specRef: 'dsv8.md:1913' }),
  field('fax', 'ZK', { doc: 'Faxnummer.', specRef: 'dsv8.md:1915' }),
  field('email', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse.',
    specRef: 'dsv8.md:1917',
  }),
]);

/** KARIMELDUNG — gemeldete Kampfrichterinnen und Kampfrichter (dsv8.md:1977). */
export const KARIMELDUNG = element('KARIMELDUNG', [
  field('nummerKampfrichter', 'Zahl', {
    required: true,
    doc: 'Laufende Nummer innerhalb dieser Meldung.',
    specRef: 'dsv8.md:1977',
  }),
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:1980',
  }),
  field('kampfrichtergruppe', 'ZK', {
    required: true,
    doc: 'Gruppe, für die gemeldet wird.',
    specRef: 'dsv8.md:1982',
    values: [
      { value: 'WKR', doc: 'Wettkampfrichter*in' },
      { value: 'AUS', doc: 'Auswerter*in' },
      { value: 'SCH', doc: 'Schiedsrichter*in' },
      { value: 'SPR', doc: 'Sprecher*in' },
    ],
  }),
  field('geschlecht', 'Zeichen', {
    since: 8,
    doc: 'Geschlecht.',
    specRef: 'dsv8.md:2018',
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers' },
    ],
  }),
]);

/**
 * KARIABSCHNITT — Einsatzwunsch je Abschnitt (dsv8.md:2055).
 *
 * Der Wertevorrat des Einsatzwunsches ist enger als der des Kampfgerichts in
 * den Ergebnislisten: `WKH` und `ZBV` gehören hier nicht dazu.
 */
export const KARIABSCHNITT = element('KARIABSCHNITT', [
  field('nummerKampfrichter', 'Zahl', {
    required: true,
    doc: 'Nummer der Kampfrichtermeldung, auf die sich der Abschnitt bezieht.',
    specRef: 'dsv8.md:2055',
  }),
  field('abschnittsnummer', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts.',
    specRef: 'dsv8.md:2060',
    range: { min: 0, max: 99 },
  }),
  field('einsatzwunsch', 'ZK', {
    doc: 'Gewünschte Position im Kampfgericht.',
    specRef: 'dsv8.md:2062',
    values: [
      { value: 'SCH', doc: 'Schiedsrichter*in' },
      { value: 'STA', doc: 'Starter*in' },
      { value: 'ZRO', doc: 'Zielrichterobmann' },
      { value: 'ZR', doc: 'Zielrichter*in' },
      { value: 'ZNO', doc: 'Zeitnehmerobmann' },
      { value: 'ZN', doc: 'Zeitnehmer*in' },
      { value: 'RZN', doc: 'Reservezeitnehmer*in' },
      { value: 'SR', doc: 'Schwimmrichter*in' },
      { value: 'WRO', doc: 'Wenderichterobmann' },
      { value: 'WR', doc: 'Wenderichter*in' },
      { value: 'AUS', doc: 'Auswerter*in' },
      { value: 'SP', doc: 'Sprecher*in' },
      { value: 'PKF', doc: 'Protokollführer*in' },
      { value: 'STO', doc: 'Startordner*in' },
      { value: 'ASCH', doc: 'Assistenz-Schiedsrichter*in' },
      { value: 'SIB', doc: 'Sicherheitsbeauftragte*r' },
      { value: 'SAUF', doc: 'Streckenaufsicht' },
      { value: 'VER', doc: 'Ordner Versorgungsstelle' },
    ],
  }),
]);

/** TRAINER — gemeldete Trainerinnen und Trainer (dsv8.md:2127). */
export const TRAINER = element('TRAINER', [
  field('nummerTrainer', 'Zahl', {
    required: true,
    doc: 'Laufende Nummer innerhalb dieser Meldung.',
    specRef: 'dsv8.md:2127',
  }),
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:2131',
  }),
  field('geschlecht', 'Zeichen', {
    since: 8,
    doc: 'Geschlecht.',
    specRef: 'dsv8.md:2145',
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers' },
    ],
  }),
]);

/** PNMELDUNG — gemeldete Personen (dsv8.md:2176). */
export const PNMELDUNG = element('PNMELDUNG', [
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:2176',
  }),
  field('dsvId', 'Zahl', {
    required: true,
    doc: 'DSV-Identifikationsnummer.',
    specRef: 'dsv8.md:2178',
  }),
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2185',
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht.',
    specRef: 'dsv8.md:2206',
    values: GESCHLECHT_PERSON_WERTE,
  }),
  field('jahrgang', 'Zahl', {
    required: true,
    doc: 'Geburtsjahrgang, vierstellig.',
    specRef: 'dsv8.md:2221',
  }),
  field('altersklasse', 'Zahl', {
    doc: 'Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.',
    specRef: 'dsv8.md:2223',
  }),
  field('nummerTrainer', 'Zahl', {
    doc: 'Nummer der zugeordneten Trainermeldung.',
    specRef: 'dsv8.md:2225',
  }),
  field('nationalitaet1', 'ZK', {
    doc: 'Erste Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:2233',
  }),
  field('nationalitaet2', 'ZK', {
    doc: 'Zweite Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:2237',
  }),
  field('nationalitaet3', 'ZK', {
    doc: 'Dritte Staatsangehörigkeit, WA-Nationenkürzel.',
    specRef: 'dsv8.md:2241',
  }),
]);

/**
 * HANDICAP — Startklassen einer Para-Schwimmerin oder eines Para-Schwimmers
 * (dsv8.md:2285).
 *
 * Zwei Vorbehalte: Der Werteliste der Bruststartklasse fehlt `SB10`, während
 * `S10` und `SM10` bei den beiden anderen Feldern vorhanden sind — mit hoher
 * Wahrscheinlichkeit eine Lücke der Vorlage, kein Verbot. Der Wert ist deshalb
 * als `specGap` aufgenommen: gelesen und geschrieben wird er, beim Lesen
 * entsteht eine `info`-Diagnostic. Ausserdem gibt es zu diesem Element keine
 * Beispielzeile; die Zahl der Attribute ist damit nicht gegenprüfbar.
 */
export const HANDICAP = element('HANDICAP', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2285',
  }),
  field('dbsId', 'ZK', {
    doc: 'Identifikationsnummer beim Deutschen Behindertensportverband.',
    specRef: 'dsv8.md:2290',
  }),
  field('ipcId', 'ZK', {
    doc: 'Identifikationsnummer beim International Paralympic Committee.',
    specRef: 'dsv8.md:2292',
  }),
  field('startklasse', 'ZK', {
    required: true,
    doc: 'Startklasse für Freistil, Rücken und Schmetterling.',
    specRef: 'dsv8.md:2294',
    values: startklassen('S', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
  }),
  field('startklasseBrust', 'ZK', {
    required: true,
    doc: 'Startklasse für Brust.',
    specRef: 'dsv8.md:2302',
    // SB10 fehlt in der Spezifikation, während S10 und SM10 bei den beiden
    // anderen Startklassen stehen — eine Lücke der Vorlage, kein Verbot. Es
    // wird gelesen und geschrieben, mit einer `info`-Diagnostic.
    values: startklassen('SB', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [10]),
  }),
  field('startklasseLagen', 'ZK', {
    required: true,
    doc: 'Startklasse für Lagen.',
    specRef: 'dsv8.md:2306',
    values: startklassen('SM', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
  }),
  field('exceptions', 'ZK', {
    doc: 'Ausnahmeregelungen der Startklassifizierung.',
    specRef: 'dsv8.md:2355',
  }),
]);

/** STARTPN — Meldung einer Person zu einem Wettkampf (dsv8.md:2376). */
export const STARTPN = element('STARTPN', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2376',
  }),
  field('wettkampfnummer', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:2381',
    range: { min: 0, max: 999 },
  }),
  field('meldezeit', 'Zeit', {
    doc: 'Gemeldete Zeit.',
    specRef: 'dsv8.md:2383',
    default: '00:00:00,00',
  }),
]);

/** STMELDUNG — gemeldete Staffeln (dsv8.md:2410). */
export const STMELDUNG = element('STMELDUNG', [
  field('nummerDerMannschaft', 'Zahl', {
    required: true,
    doc: 'Nummer der Mannschaft innerhalb des Vereins.',
    specRef: 'dsv8.md:2410',
  }),
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2413',
  }),
  field('wertungsklasseTyp', 'ZK', {
    required: true,
    doc: 'Art der Wertungsklasse.',
    specRef: 'dsv8.md:2420',
    values: WERTUNGSKLASSE_WERTE,
  }),
  field('mindestJgAk', 'JGAK', {
    required: true,
    doc: 'Untere Grenze des Jahrgangs oder der Altersklasse.',
    specRef: 'dsv8.md:2426',
  }),
  field('maximalJgAk', 'JGAK', {
    doc: 'Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.',
    specRef: 'dsv8.md:2458',
  }),
  field('nameDerStaffel', 'ZK', {
    doc: 'Bezeichnung der Staffel.',
    specRef: 'dsv8.md:2470',
  }),
]);

/** STARTST — Meldung einer Staffel zu einem Wettkampf (dsv8.md:2494). */
export const STARTST = element('STARTST', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2494',
  }),
  field('wettkampfnummer', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:2499',
    range: { min: 0, max: 999 },
  }),
  field('meldezeit', 'Zeit', {
    doc: 'Gemeldete Zeit.',
    specRef: 'dsv8.md:2501',
    default: '00:00:00,00',
  }),
]);

/**
 * STAFFELPERSON — Besetzung einer gemeldeten Staffel (dsv8.md:2533).
 *
 * Hier genügen vier Felder: Name, Jahrgang und Nationalität stehen bereits in
 * der zugehörigen PNMELDUNG und werden über die Veranstaltungs-ID verknüpft.
 * In der Vereinsergebnisliste führt das gleichnamige Element dagegen zwölf.
 */
export const STAFFELPERSON = element('STAFFELPERSON', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2533',
  }),
  field('wettkampfnummer', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:2538',
    range: { min: 0, max: 999 },
  }),
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person innerhalb dieser Veranstaltung.',
    specRef: 'dsv8.md:2544',
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:2547',
  }),
]);

/** DATEIENDE — schliesst die Datei ab, ohne Doppelpunkt und ohne Attribute. */
export const DATEIENDE = element('DATEIENDE', [], { bare: true });

/** Alle Elemente der Vereinsmeldeliste mit ihren Kardinalitäten. */
export const VEREINSMELDELISTE = listSchema('Vereinsmeldeliste', [
  occurrence(FORMAT, { min: 1, max: 1 }),
  occurrence(ERZEUGER, { min: 1, max: 1 }),
  occurrence(VERANSTALTUNG, { min: 1, max: 1 }),
  occurrence(ABSCHNITT, { min: 1, max: null }),
  occurrence(WETTKAMPF, { min: 1, max: null }),
  occurrence(VEREIN, { min: 1, max: 1 }),
  occurrence(ANSPRECHPARTNER, { min: 1, max: 1 }),
  occurrence(KARIMELDUNG, { min: 0, max: null }),
  occurrence(KARIABSCHNITT, { min: 0, max: null }),
  occurrence(TRAINER, { min: 0, max: null }),
  occurrence(PNMELDUNG, { min: 0, max: null }),
  occurrence(HANDICAP, { min: 0, max: null }),
  occurrence(STARTPN, { min: 0, max: null }),
  occurrence(STMELDUNG, { min: 0, max: null }),
  occurrence(STARTST, { min: 0, max: null }),
  occurrence(STAFFELPERSON, { min: 0, max: null }),
  occurrence(DATEIENDE, { min: 1, max: 1 }),
]);
