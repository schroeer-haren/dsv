/**
 * Schema der Wettkampfergebnisliste (dsv8.md:4330 ff.).
 *
 * Die Kopfelemente tragen dieselben Namen wie in der
 * Wettkampfdefinitionsliste, sind aber eigene Definitionen: ABSCHNITT führt
 * hier vier statt sechs Felder, die Wettkampfart kennt zwei Werte mehr, und
 * VEREIN darf mehrfach auftreten. Gemeinsam ist nur, was in
 * `shared-values.ts` steht.
 */

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
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'X', doc: 'mixed' },
      { value: 'D', doc: 'divers' },
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
