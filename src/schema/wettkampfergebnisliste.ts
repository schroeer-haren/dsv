/**
 * Schema der Wettkampfergebnisliste (dsv8.md:4330 ff.).
 *
 * Die Kopfelemente tragen dieselben Namen wie in der
 * Wettkampfdefinitionsliste, sind aber eigene Definitionen: ABSCHNITT führt
 * hier vier statt sechs Felder, die Wettkampfart kennt zwei Werte mehr, und
 * VEREIN darf mehrfach auftreten. Gemeinsam ist nur, was in
 * `shared-values.ts` steht.
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
 * Wertevorrat der Wettkampfart. In den Ergebnislisten gehören A und N regulär
 * dazu (dsv8.md:4691) — anders als in der Wettkampfdefinitionsliste, wo die
 * Spezifikation sie nicht vorsieht und sie nur toleriert werden.
 */
const WETTKAMPFART_WERTE: readonly EnumValue[] = [
  { value: 'V', doc: 'Vorlauf' },
  { value: 'Z', doc: 'Zwischenlauf' },
  { value: 'F', doc: 'Finale' },
  { value: 'E', doc: 'Entscheidung' },
  { value: 'A', doc: 'Ausschwimmen' },
  { value: 'N', doc: 'Nachschwimmen' },
];

/** FORMAT — Kennzeichnung von Listenart und Formatversion (dsv8.md:4330). */
export const FORMAT = element('FORMAT', [
  field('listart', 'ZK', {
    required: true,
    doc: 'Konstant Wettkampfergebnisliste.',
    specRef: 'dsv8.md:4330',
  }),
  field('version', 'Zahl', {
    required: true,
    doc: 'Versionsnummer des DSV-Standards.',
    specRef: 'dsv8.md:4332',
  }),
]);

/** ERZEUGER — erzeugende Software und deren Hersteller (dsv8.md:4354). */
export const ERZEUGER = element('ERZEUGER', [
  field('software', 'ZK', {
    required: true,
    doc: 'Name der erzeugenden Software.',
    specRef: 'dsv8.md:4354',
  }),
  field('version', 'ZK', {
    required: true,
    doc: 'Versionskennung der Software.',
    specRef: 'dsv8.md:4356',
  }),
  field('kontakt', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse des Software-Herstellers.',
    specRef: 'dsv8.md:4358',
  }),
]);

/** VERANSTALTUNG — Eckdaten der Veranstaltung (dsv8.md:4388). */
export const VERANSTALTUNG = element('VERANSTALTUNG', [
  field('veranstaltungsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name der Veranstaltung.',
    specRef: 'dsv8.md:4388',
  }),
  field('veranstaltungsort', 'ZK', {
    required: true,
    doc: 'Ort der Veranstaltung.',
    specRef: 'dsv8.md:4391',
  }),
  field('bahnlaenge', 'ZK', {
    required: true,
    doc: 'Bahnlänge des Wettkampfbeckens.',
    specRef: 'dsv8.md:4394',
    values: BAHNLAENGE_WERTE,
  }),
  field('zeitmessung', 'ZK', {
    required: true,
    doc: 'Art der Zeitmessung.',
    specRef: 'dsv8.md:4402',
    values: ZEITMESSUNG_WERTE,
  }),
]);

/** VERANSTALTER — der ausschreibende Verband oder Verein (dsv8.md:4440). */
export const VERANSTALTER = element('VERANSTALTER', [
  field('nameDesVeranstalters', 'ZK', {
    required: true,
    doc: 'Name des Veranstalters.',
    specRef: 'dsv8.md:4440',
  }),
]);

/** AUSRICHTER — durchführender Verein samt Ansprechperson (dsv8.md:4465). */
export const AUSRICHTER = element('AUSRICHTER', [
  field('nameDesAusrichters', 'ZK', {
    required: true,
    doc: 'Name des Ausrichters.',
    specRef: 'dsv8.md:4465',
  }),
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname der Ansprechperson.',
    specRef: 'dsv8.md:4468',
  }),
  field('strasse', 'ZK', { doc: 'Strasse.', specRef: 'dsv8.md:4470' }),
  field('plz', 'ZK', { doc: 'Postleitzahl.', specRef: 'dsv8.md:4472' }),
  field('ort', 'ZK', { doc: 'Ort.', specRef: 'dsv8.md:4474' }),
  field('land', 'ZK', { doc: 'WA-Nationenkürzel, dreistellig.', specRef: 'dsv8.md:4476' }),
  field('telefon', 'ZK', { doc: 'Telefonnummer.', specRef: 'dsv8.md:4478' }),
  field('fax', 'ZK', { doc: 'Faxnummer.', specRef: 'dsv8.md:4480' }),
  field('email', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse.',
    specRef: 'dsv8.md:4482',
  }),
]);

/**
 * ABSCHNITT — zeitlicher Abschnitt der Veranstaltung (dsv8.md:4547).
 *
 * Nur vier Felder: Einlass und Kampfrichtersitzung gehören zur Ausschreibung
 * und stehen deshalb allein in der Wettkampfdefinitionsliste.
 */
export const ABSCHNITT = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, maximal zweistellig.',
    specRef: 'dsv8.md:4547',
    range: { min: 0, max: 99 },
  }),
  field('abschnittsdatum', 'Datum', {
    required: true,
    doc: 'Datum, an dem der Abschnitt stattfindet.',
    specRef: 'dsv8.md:4551',
  }),
  field('anfangszeit', 'Uhrzeit', {
    required: true,
    doc: 'Uhrzeit, zu der der Abschnitt beginnt.',
    specRef: 'dsv8.md:4556',
  }),
  field('relativeAngabe', 'Zeichen', {
    doc: 'J, wenn die Zeit relativ zum Ende des Vorabschnitts zu verstehen ist.',
    specRef: 'dsv8.md:4560',
    default: 'N',
    values: [
      { value: 'J', doc: 'relative Angabe' },
      { value: 'N', doc: 'echte Uhrzeit' },
    ],
  }),
]);

/** KAMPFGERICHT — Besetzung des Kampfgerichts je Abschnitt (dsv8.md:4595). */
export const KAMPFGERICHT = element('KAMPFGERICHT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts.',
    specRef: 'dsv8.md:4595',
    range: { min: 0, max: 99 },
  }),
  field('position', 'ZK', {
    required: true,
    doc: 'Funktion im Kampfgericht.',
    specRef: 'dsv8.md:4597',
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
      { value: 'WKH', doc: 'Wettkampfhelfer*in' },
      { value: 'ASCH', doc: 'Assistenz-Schiedsrichter*in' },
      { value: 'SIB', doc: 'Sicherheitsbeauftragte*r' },
      { value: 'SAUF', doc: 'Streckenaufsicht' },
      { value: 'VER', doc: 'Ordner Versorgungsstelle' },
      { value: 'ZBV', doc: 'sonstige Kampfrichter' },
      {
        value: 'SPR',
        doc:
          'Sprecher*in; die Werteliste der Spezifikation (dsv8.md:4611–4655) kennt nur SP, ' +
          'ihr eigenes Beispiel (dsv8.md:5852) und eine echte Datei schreiben aber SPR — ' +
          'beim Lesen Warnung, beim Schreiben unzulässig',
        tolerated: true,
      },
    ],
  }),
  field('nameKampfrichter', 'ZK', {
    required: true,
    doc: 'Name und Vorname.',
    specRef: 'dsv8.md:4661',
  }),
  field('vereinDesKampfrichters', 'ZK', {
    required: true,
    doc: 'Verein der Kampfrichterin oder des Kampfrichters.',
    specRef: 'dsv8.md:4664',
  }),
]);

/** WETTKAMPF — ein einzelner Wettkampf der Veranstaltung (dsv8.md:4689). */
export const WETTKAMPF = element('WETTKAMPF', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes, maximal dreistellig.',
    specRef: 'dsv8.md:4689',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:4691',
    values: WETTKAMPFART_WERTE,
  }),
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts.',
    specRef: 'dsv8.md:4703',
    range: { min: 0, max: 99 },
  }),
  field('anzahlStarter', 'Zahl', {
    doc: 'Anzahl der Starter; bei Staffeln die Zahl der Teilnehmenden.',
    specRef: 'dsv8.md:4705',
    default: '1',
  }),
  field('einzelstrecke', 'Zahl', {
    required: true,
    doc: 'Strecke in Metern, 1 bis 25000, oder 0 für sonstige.',
    specRef: 'dsv8.md:4707',
    range: { min: 0, max: 25000 },
  }),
  field('technik', 'Zeichen', {
    required: true,
    doc: 'Schwimmart.',
    specRef: 'dsv8.md:4715',
    values: TECHNIK_WERTE,
  }),
  field('ausuebung', 'ZK', {
    required: true,
    doc: 'Art der Ausübung.',
    specRef: 'dsv8.md:4727',
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
    doc: 'Geschlecht der Teilnehmenden.',
    specRef: 'dsv8.md:4771',
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
    specRef: 'dsv8.md:4784',
    values: ZUORDNUNG_BESTENLISTE_WERTE,
  }),
  field('qualifikationswettkampfnr', 'Zahl', {
    doc: 'Nummer des qualifizierenden Vor- oder Zwischenlaufs.',
    specRef: 'dsv8.md:4788',
    range: { min: 0, max: 999 },
  }),
  // Auffälligkeit: Die Spezifikation führt für dieses Feld (dsv8.md:4839–4845)
  // nur V, Z, F und E auf — ohne A und N, die das Feld `wettkampfart` desselben
  // Elements kennt. Der engere Vorrat ist übernommen, wie er dort steht.
  field('qualifikationswettkampfart', 'Zeichen', {
    doc: 'Art des qualifizierenden Wettkampfes.',
    specRef: 'dsv8.md:4826',
    values: [
      { value: 'V', doc: 'Vorlauf' },
      { value: 'Z', doc: 'Zwischenlauf' },
      { value: 'F', doc: 'Finale' },
      { value: 'E', doc: 'Entscheidung' },
    ],
  }),
]);

/** WERTUNG — eine Wertungsgruppe innerhalb eines Wettkampfes (dsv8.md:4855). */
export const WERTUNG = element('WERTUNG', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:4855',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:4857',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Veranstaltungsweit eindeutige Kennung der Wertung.',
    specRef: 'dsv8.md:4873',
  }),
  field('wertungsklasseTyp', 'ZK', {
    required: true,
    doc: 'Art der Wertungsklasse.',
    specRef: 'dsv8.md:4877',
    values: WERTUNGSKLASSE_WERTE,
  }),
  field('mindestJgAk', 'JGAK', {
    required: true,
    doc: 'Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.',
    specRef: 'dsv8.md:4883',
  }),
  // Wie in der Wettkampfdefinitionsliste: Der Unterlassungswert ist der Wert
  // von mindestJgAk, also kontextabhängig und kein statischer `default`.
  field('maximalJgAk', 'JGAK', {
    doc: 'Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.',
    specRef: 'dsv8.md:4886',
  }),
  field('geschlecht', 'Zeichen', {
    doc: 'Geschlecht der Wertung; ohne Angabe gilt das Geschlecht des Wettkampfes.',
    specRef: 'dsv8.md:4901',
    // Reihenfolge nach Kapitel 5.4 (dsv8.md:4940–4944), dem Kapitel, das diese
    // Datei beschreibt. Kapitel 5.1 führt dasselbe Feld als M, W, X, D auf
    // (dsv8.md:1228–1234); diese Reihenfolge steht in der
    // Wettkampfdefinitionsliste. Der Wertevorrat ist in beiden derselbe.
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers' },
      { value: 'X', doc: 'mixed' },
    ],
  }),
  field('wertungsname', 'ZK', {
    required: true,
    doc: 'Textliche Bezeichnung der Wertung.',
    specRef: 'dsv8.md:4907',
  }),
]);

/**
 * VEREIN — ein an der Veranstaltung beteiligter Verein (dsv8.md:4958).
 *
 * Anders als in der Wettkampfdefinitionsliste steht das Element hier mehrfach:
 * Eine Ergebnisliste führt alle Vereine, deren Ergebnisse sie enthält.
 */
export const VEREIN = element('VEREIN', [
  field('vereinsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name des Vereins.',
    specRef: 'dsv8.md:4958',
  }),
  field('vereinskennzahl', 'Zahl', {
    required: true,
    doc: 'Vierstellige Vereinskennzahl; 0 bei nicht dem DSV angehörenden Vereinen.',
    specRef: 'dsv8.md:4960',
  }),
  field('landesschwimmverband', 'Zahl', {
    required: true,
    doc: 'Kennzahl des Landesschwimmverbands; 0 bei ausländischen Vereinen, 99 bei Auswahlmannschaften.',
    specRef: 'dsv8.md:4966',
  }),
  field('nationenkuerzel', 'ZK', {
    required: true,
    doc: 'WA-Nationenkürzel, dreistellig.',
    specRef: 'dsv8.md:4994',
  }),
]);

/** Grund, warum ein Ergebnis nicht gewertet wird (dsv8.md:5052, dsv8.md:5403). */
const NICHTWERTUNG_WERTE: readonly EnumValue[] = [
  { value: 'DS', doc: 'Disqualifikation' },
  { value: 'NA', doc: 'nicht am Start' },
  { value: 'AB', doc: 'vom Wettkampf abgemeldet' },
  { value: 'AU', doc: 'aufgegeben' },
  { value: 'ZU', doc: 'Zeitüberschreitung, nur bei Langstrecken' },
];

/** Kennzeichen zum erhöhten nachträglichen Meldegeld (dsv8.md:5136, dsv8.md:5437). */
const MELDEGELD_KENNZEICHEN_WERTE: readonly EnumValue[] = [
  { value: 'E', doc: 'Norm erreicht' },
  { value: 'F', doc: 'erhöhtes Meldegeld fällig' },
  { value: 'N', doc: 'Norm nicht erreicht, aber nachgewiesen' },
];

/**
 * Geschlecht einer einzelnen Person (dsv8.md:5119, dsv8.md:5605).
 *
 * Ohne X: Das steht in WETTKAMPF für gemischte Wettkämpfe und in WERTUNG für
 * eine gemischte Wertung, nie für eine Person.
 */
const PERSON_GESCHLECHT_WERTE: readonly EnumValue[] = [
  { value: 'M', doc: 'männlich' },
  { value: 'W', doc: 'weiblich' },
  { value: 'D', doc: 'divers' },
];

/** PNERGEBNIS — Einzelergebnis einer Person (dsv8.md:5026). */
export const PNERGEBNIS = element('PNERGEBNIS', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5026',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5028',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Wertung.',
    specRef: 'dsv8.md:5044',
  }),
  field('platz', 'Zahl', {
    required: true,
    doc: 'Erreichte Platzierung; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.',
    specRef: 'dsv8.md:5046',
  }),
  field('grundDerNichtwertung', 'ZK', {
    doc: 'Grund, warum das Ergebnis nicht gewertet wird.',
    specRef: 'dsv8.md:5052',
    values: NICHTWERTUNG_WERTE,
  }),
  field('name', 'ZK', { required: true, doc: 'Name und Vorname.', specRef: 'dsv8.md:5056' }),
  field('dsvId', 'Zahl', {
    required: true,
    doc: 'Sechsstellige DSV-ID; 0 wenn unbekannt.',
    specRef: 'dsv8.md:5058',
  }),
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Veranstaltungsweit eindeutige Kennung der Person.',
    specRef: 'dsv8.md:5064',
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht der Person.',
    specRef: 'dsv8.md:5119',
    values: PERSON_GESCHLECHT_WERTE,
  }),
  field('jahrgang', 'Zahl', {
    required: true,
    doc: 'Vierstelliger Jahrgang.',
    specRef: 'dsv8.md:5122',
  }),
  field('altersklasse', 'Zahl', {
    doc:
      'Altersklasse. Die Spezifikation liefert für dieses Feld keine Beschreibung; ' +
      'Datentyp und Pflichtangabe sind aus der Spaltenreihenfolge rekonstruiert. ' +
      'In den 72 echten Ergebnislisten ist es in 9982 von 95756 Zeilen gesetzt ' +
      '(51 der 72 Dateien).',
    specRef: 'dsv8.md:5124',
  }),
  field('verein', 'ZK', { required: true, doc: 'Name des Vereins.', specRef: 'dsv8.md:5126' }),
  field('vereinskennzahl', 'Zahl', {
    required: true,
    doc: 'Vereinskennzahl; 0 bei nicht dem DSV angehörenden Vereinen.',
    specRef: 'dsv8.md:5128',
  }),
  field('endzeit', 'Zeit', {
    required: true,
    doc: 'Erreichte Endzeit; bei Nichtwertung 00:00:00,00.',
    specRef: 'dsv8.md:5130',
  }),
  field('disqualifikationsbemerkung', 'ZK', {
    doc: 'Erläuterung zur Disqualifikation.',
    specRef: 'dsv8.md:5132',
  }),
  field('erhoehtesNachtraeglichesMeldegeld', 'Zeichen', {
    doc: 'Kennzeichen zum erhöhten nachträglichen Meldegeld.',
    specRef: 'dsv8.md:5136',
    values: MELDEGELD_KENNZEICHEN_WERTE,
  }),
  field('nationalitaet1', 'ZK', {
    doc: 'WA-Nationenkürzel; leer wenn unbekannt.',
    specRef: 'dsv8.md:5202',
  }),
  field('nationalitaet2', 'ZK', {
    doc: 'Zweite Staatsangehörigkeit.',
    specRef: 'dsv8.md:5208',
  }),
  field('nationalitaet3', 'ZK', {
    doc: 'Dritte Staatsangehörigkeit.',
    specRef: 'dsv8.md:5210',
  }),
]);

/** PNZWISCHENZEIT — Zwischenzeit einer Person (dsv8.md:5245). */
export const PNZWISCHENZEIT = element('PNZWISCHENZEIT', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person, definiert in PNERGEBNIS.',
    specRef: 'dsv8.md:5245',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5250',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5254',
    values: WETTKAMPFART_WERTE,
  }),
  field('distanz', 'Zahl', {
    required: true,
    doc: 'Zurückgelegte Strecke in Metern.',
    specRef: 'dsv8.md:5258',
  }),
  field('zwischenzeit', 'Zeit', {
    required: true,
    doc: 'Zwischenzeit bei dieser Distanz.',
    specRef: 'dsv8.md:5260',
  }),
]);

/** PNREAKTION — Reaktionszeit einer Person beim Start (dsv8.md:5306). */
export const PNREAKTION = element('PNREAKTION', [
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Person, definiert in PNERGEBNIS.',
    specRef: 'dsv8.md:5306',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5311',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5315',
    values: WETTKAMPFART_WERTE,
  }),
  field('art', 'Zeichen', {
    doc: 'Vorzeichen der Reaktionszeit.',
    specRef: 'dsv8.md:5341',
    default: '+',
    values: [
      { value: '+', doc: 'Start nach dem Startsignal' },
      { value: '-', doc: 'Start vor dem Startsignal' },
    ],
  }),
  field('reaktionszeit', 'Zeit', {
    required: true,
    doc: 'Gemessene Reaktionszeit.',
    specRef: 'dsv8.md:5355',
  }),
]);

/** STERGEBNIS — Ergebnis einer Staffel (dsv8.md:5377). */
export const STERGEBNIS = element('STERGEBNIS', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5377',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5379',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Kennung der Wertung.',
    specRef: 'dsv8.md:5395',
  }),
  field('platz', 'Zahl', {
    required: true,
    doc: 'Erreichte Platzierung; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.',
    specRef: 'dsv8.md:5397',
  }),
  field('grundDerNichtwertung', 'ZK', {
    doc: 'Grund, warum das Ergebnis nicht gewertet wird.',
    specRef: 'dsv8.md:5403',
    values: NICHTWERTUNG_WERTE,
  }),
  field('nummerDerMannschaft', 'Zahl', {
    required: true,
    doc: 'Laufende Nummer der Mannschaft des Vereins.',
    specRef: 'dsv8.md:5407',
  }),
  field('veranstaltungsId', 'Zahl', {
    required: true,
    doc: 'Veranstaltungsweit eindeutige Kennung der Staffel.',
    specRef: 'dsv8.md:5411',
  }),
  field('verein', 'ZK', { required: true, doc: 'Name des Vereins.', specRef: 'dsv8.md:5414' }),
  field('vereinskennzahl', 'Zahl', {
    required: true,
    doc: 'Vereinskennzahl; 0 bei nicht dem DSV angehörenden Vereinen.',
    specRef: 'dsv8.md:5416',
  }),
  field('endzeit', 'Zeit', {
    required: true,
    doc: 'Erreichte Endzeit; bei Nichtwertung 00:00:00,00.',
    specRef: 'dsv8.md:5418',
  }),
  field('startnummerDisqualifiziert', 'Zahl', {
    doc: 'Startnummer der disqualifizierten Person innerhalb der Staffel.',
    specRef: 'dsv8.md:5420',
  }),
  field('disqualifikationsbemerkung', 'ZK', {
    doc: 'Erläuterung zur Disqualifikation.',
    specRef: 'dsv8.md:5435',
  }),
  field('erhoehtesNachtraeglichesMeldegeld', 'Zeichen', {
    doc: 'Kennzeichen zum erhöhten nachträglichen Meldegeld.',
    specRef: 'dsv8.md:5437',
    values: MELDEGELD_KENNZEICHEN_WERTE,
  }),
]);

/** STAFFELPERSON — eine Teilnehmerin oder ein Teilnehmer einer Staffel (dsv8.md:5576). */
export const STAFFELPERSON = element('STAFFELPERSON', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel, definiert in STERGEBNIS.',
    specRef: 'dsv8.md:5576',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5581',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5585',
    values: WETTKAMPFART_WERTE,
  }),
  field('name', 'ZK', { required: true, doc: 'Name und Vorname.', specRef: 'dsv8.md:5595' }),
  field('dsvId', 'Zahl', {
    required: true,
    doc: 'Sechsstellige DSV-ID; 0 wenn unbekannt.',
    specRef: 'dsv8.md:5597',
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:5600',
  }),
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht der Person.',
    specRef: 'dsv8.md:5605',
    values: PERSON_GESCHLECHT_WERTE,
  }),
  field('jahrgang', 'Zahl', {
    required: true,
    doc: 'Vierstelliger Jahrgang.',
    specRef: 'dsv8.md:5620',
  }),
  field('altersklasse', 'Zahl', {
    doc:
      'Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der ' +
      'Spaltenreihenfolge rekonstruiert.',
    specRef: 'dsv8.md:5622',
  }),
  field('nationalitaet1', 'ZK', { doc: 'WA-Nationenkürzel.', specRef: 'dsv8.md:5624' }),
  field('nationalitaet2', 'ZK', {
    doc: 'Zweite Staatsangehörigkeit.',
    specRef: 'dsv8.md:5632',
  }),
  field('nationalitaet3', 'ZK', {
    doc: 'Dritte Staatsangehörigkeit.',
    specRef: 'dsv8.md:5636',
  }),
]);

/** STZWISCHENZEIT — Zwischenzeit innerhalb einer Staffel (dsv8.md:5678). */
export const STZWISCHENZEIT = element('STZWISCHENZEIT', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel.',
    specRef: 'dsv8.md:5678',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5683',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5687',
    values: WETTKAMPFART_WERTE,
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:5693',
  }),
  field('distanz', 'Zahl', {
    required: true,
    doc: 'Zurückgelegte Strecke in Metern.',
    specRef: 'dsv8.md:5698',
  }),
  field('zwischenzeit', 'Zeit', {
    required: true,
    doc: 'Zwischenzeit bei dieser Distanz.',
    specRef: 'dsv8.md:5700',
  }),
]);

/**
 * STABLOESE — Ablösezeit einer Staffelperson (dsv8.md:5751).
 *
 * Dieses Element kommt in keiner der 72 untersuchten echten Ergebnislisten vor. Die
 * Definition stützt sich allein auf die Spezifikation; es gibt keine
 * empirische Bestätigung von Feldfolge und Wertevorrat.
 */
export const STABLOESE = element('STABLOESE', [
  field('veranstaltungsIdStaffel', 'Zahl', {
    required: true,
    doc: 'Kennung der Staffel.',
    specRef: 'dsv8.md:5751',
  }),
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes.',
    specRef: 'dsv8.md:5756',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:5760',
    values: WETTKAMPFART_WERTE,
  }),
  field('startnummer', 'Zahl', {
    required: true,
    doc: 'Startnummer innerhalb der Staffel.',
    specRef: 'dsv8.md:5786',
  }),
  field('art', 'Zeichen', {
    doc: 'Vorzeichen der Ablösezeit.',
    specRef: 'dsv8.md:5798',
    default: '+',
    values: [
      { value: '+', doc: 'positive Zeit' },
      { value: '-', doc: 'negative Zeit' },
    ],
  }),
  field('reaktionszeit', 'Zeit', {
    required: true,
    doc: 'Gemessene Ablösezeit.',
    specRef: 'dsv8.md:5812',
  }),
]);

/** DATEIENDE — schliesst die Datei ab, ohne Doppelpunkt und ohne Attribute. */
export const DATEIENDE = element('DATEIENDE', [], { bare: true });

/** Alle Elemente der Wettkampfergebnisliste mit ihren Kardinalitäten. */
export const WETTKAMPFERGEBNISLISTE = listSchema('Wettkampfergebnisliste', [
  occurrence(FORMAT, { min: 1, max: 1 }),
  occurrence(ERZEUGER, { min: 1, max: 1 }),
  occurrence(VERANSTALTUNG, { min: 1, max: 1 }),
  occurrence(VERANSTALTER, { min: 1, max: 1 }),
  occurrence(AUSRICHTER, { min: 1, max: 1 }),
  occurrence(ABSCHNITT, { min: 1, max: null }),
  occurrence(KAMPFGERICHT, { min: 0, max: null }),
  occurrence(WETTKAMPF, { min: 1, max: null }),
  occurrence(WERTUNG, { min: 1, max: null }),
  occurrence(VEREIN, { min: 1, max: null }),
  occurrence(PNERGEBNIS, { min: 0, max: null }),
  occurrence(PNZWISCHENZEIT, { min: 0, max: null }),
  occurrence(PNREAKTION, { min: 0, max: null }),
  occurrence(STERGEBNIS, { min: 0, max: null }),
  occurrence(STAFFELPERSON, { min: 0, max: null }),
  occurrence(STZWISCHENZEIT, { min: 0, max: null }),
  occurrence(STABLOESE, { min: 0, max: null }),
  occurrence(DATEIENDE, { min: 1, max: 1 }),
]);
