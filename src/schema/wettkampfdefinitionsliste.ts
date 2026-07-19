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

/** FORMAT — Kennzeichnung von Listenart und Formatversion (dsv8.md:361). */
export const FORMAT = element('FORMAT', [
  field('listart', 'ZK', {
    required: true,
    doc: 'Konstant Wettkampfdefinitionsliste.',
    specRef: 'dsv8.md:361',
  }),
  field('version', 'Zahl', {
    required: true,
    doc: 'Versionsnummer des DSV-Standards.',
    specRef: 'dsv8.md:363',
  }),
]);

/** ERZEUGER — erzeugende Software und deren Hersteller (dsv8.md:387). */
export const ERZEUGER = element('ERZEUGER', [
  field('software', 'ZK', {
    required: true,
    doc: 'Name der erzeugenden Software.',
    specRef: 'dsv8.md:387',
  }),
  field('version', 'ZK', {
    required: true,
    doc: 'Versionskennung der Software.',
    specRef: 'dsv8.md:389',
  }),
  field('kontakt', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse des Software-Herstellers.',
    specRef: 'dsv8.md:391',
  }),
]);

/** VERANSTALTUNG — Eckdaten der Veranstaltung (dsv8.md:421). */
export const VERANSTALTUNG = element('VERANSTALTUNG', [
  field('veranstaltungsbezeichnung', 'ZK', {
    required: true,
    doc: 'Name der Veranstaltung.',
    specRef: 'dsv8.md:421',
  }),
  field('veranstaltungsort', 'ZK', {
    required: true,
    doc: 'Ort der Veranstaltung.',
    specRef: 'dsv8.md:424',
  }),
  field('bahnlaenge', 'ZK', {
    required: true,
    doc: 'Bahnlänge des Wettkampfbeckens.',
    specRef: 'dsv8.md:427',
    values: BAHNLAENGE_WERTE,
  }),
  field('zeitmessung', 'ZK', {
    required: true,
    doc: 'Art der Zeitmessung.',
    specRef: 'dsv8.md:435',
    values: ZEITMESSUNG_WERTE,
  }),
]);

/** VERANSTALTUNGSORT — Anschrift der Schwimmhalle (dsv8.md:474). */
export const VERANSTALTUNGSORT = element('VERANSTALTUNGSORT', [
  field('nameSchwimmhalle', 'ZK', {
    required: true,
    doc: 'Name der Schwimmhalle.',
    specRef: 'dsv8.md:474',
  }),
  field('strasse', 'ZK', { doc: 'Strasse.', specRef: 'dsv8.md:477' }),
  field('plz', 'ZK', { doc: 'Postleitzahl.', specRef: 'dsv8.md:479' }),
  field('ort', 'ZK', { required: true, doc: 'Ort.', specRef: 'dsv8.md:481' }),
  field('land', 'ZK', {
    required: true,
    doc: 'WA-Nationenkürzel, dreistellig.',
    specRef: 'dsv8.md:483',
  }),
  field('telefon', 'ZK', { doc: 'Telefonnummer.', specRef: 'dsv8.md:485' }),
  field('fax', 'ZK', { doc: 'Faxnummer.', specRef: 'dsv8.md:487' }),
  field('email', 'ZK', { doc: 'E-Mail-Adresse.', specRef: 'dsv8.md:489' }),
]);

/** AUSSCHREIBUNGIMNETZ — Fundstelle der Ausschreibung im Netz (dsv8.md:555). */
export const AUSSCHREIBUNGIMNETZ = element('AUSSCHREIBUNGIMNETZ', [
  field('internetadresse', 'ZK', {
    doc: 'Internetadresse der Ausschreibung.',
    specRef: 'dsv8.md:555',
  }),
]);

/** VERANSTALTER — der ausschreibende Verband oder Verein (dsv8.md:572). */
export const VERANSTALTER = element('VERANSTALTER', [
  field('nameDesVeranstalters', 'ZK', {
    required: true,
    doc: 'Name des Veranstalters.',
    specRef: 'dsv8.md:572',
  }),
]);

/** AUSRICHTER — durchführender Verein samt Ansprechperson (dsv8.md:591). */
export const AUSRICHTER = element('AUSRICHTER', [
  field('nameDesAusrichters', 'ZK', {
    required: true,
    doc: 'Name des Ausrichters.',
    specRef: 'dsv8.md:591',
  }),
  field('name', 'ZK', {
    required: true,
    doc: 'Name und Vorname der Ansprechperson.',
    specRef: 'dsv8.md:594',
  }),
  field('strasse', 'ZK', { doc: 'Strasse.', specRef: 'dsv8.md:596' }),
  field('plz', 'ZK', { doc: 'Postleitzahl.', specRef: 'dsv8.md:598' }),
  field('ort', 'ZK', { doc: 'Ort.', specRef: 'dsv8.md:600' }),
  field('land', 'ZK', { doc: 'WA-Nationenkürzel, dreistellig.', specRef: 'dsv8.md:602' }),
  field('telefon', 'ZK', { doc: 'Telefonnummer.', specRef: 'dsv8.md:604' }),
  field('fax', 'ZK', { doc: 'Faxnummer.', specRef: 'dsv8.md:606' }),
  field('email', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse.',
    specRef: 'dsv8.md:608',
  }),
]);

/** MELDEADRESSE — Anschrift für die Meldungen (dsv8.md:674). */
export const MELDEADRESSE = element('MELDEADRESSE', [
  field('name', 'ZK', {
    required: true,
    doc: 'Name der Meldeadresse.',
    specRef: 'dsv8.md:674',
  }),
  field('strasse', 'ZK', { doc: 'Strasse.', specRef: 'dsv8.md:676' }),
  field('plz', 'ZK', { doc: 'Postleitzahl.', specRef: 'dsv8.md:678' }),
  field('ort', 'ZK', { doc: 'Ort.', specRef: 'dsv8.md:680' }),
  field('land', 'ZK', { doc: 'WA-Nationenkürzel, dreistellig.', specRef: 'dsv8.md:682' }),
  field('telefon', 'ZK', { doc: 'Telefonnummer.', specRef: 'dsv8.md:684' }),
  field('fax', 'ZK', { doc: 'Faxnummer.', specRef: 'dsv8.md:686' }),
  field('email', 'ZK', {
    required: true,
    doc: 'E-Mail-Adresse.',
    specRef: 'dsv8.md:688',
  }),
]);

/** MELDESCHLUSS — Ende der Meldefrist (dsv8.md:748). */
export const MELDESCHLUSS = element('MELDESCHLUSS', [
  field('datum', 'Datum', {
    required: true,
    doc: 'Datum des Meldeschlusses.',
    specRef: 'dsv8.md:748',
  }),
  field('uhrzeit', 'Uhrzeit', {
    required: true,
    doc: 'Uhrzeit des Meldeschlusses.',
    specRef: 'dsv8.md:750',
  }),
]);

/** BANKVERBINDUNG — Konto für die Meldegelder (dsv8.md:778). */
export const BANKVERBINDUNG = element('BANKVERBINDUNG', [
  field('nameDerBank', 'ZK', { doc: 'Name der Bank.', specRef: 'dsv8.md:778' }),
  field('iban', 'ZK', {
    required: true,
    doc: 'IBAN für die Überweisung der Meldegelder.',
    specRef: 'dsv8.md:781',
  }),
  field('bic', 'ZK', { doc: 'BIC.', specRef: 'dsv8.md:783' }),
  field('kontoinhaber', 'ZK', {
    required: true,
    since: 8,
    doc: 'Name des Kontoinhabers.',
    specRef: 'dsv8.md:791',
  }),
]);

/** LASTSCHRIFT — erst ab DSV8; Veranstaltung zieht die Meldegelder ein (dsv8.md:813). */
export const LASTSCHRIFT = element(
  'LASTSCHRIFT',
  [
    field('hinweis', 'Zeichen', {
      doc: 'Veranstaltung arbeitet ausschliesslich mit Lastschriftverfahren.',
      specRef: 'dsv8.md:813',
      default: 'N',
      values: [
        { value: 'J', doc: 'ja' },
        { value: 'N', doc: 'nein' },
      ],
    }),
  ],
  { since: 8 },
);

/** BESONDERES — freier Hinweistext zur Veranstaltung (dsv8.md:843). */
export const BESONDERES = element('BESONDERES', [
  field('anmerkungen', 'ZK', {
    required: true,
    doc: 'Besondere Anmerkungen zur Veranstaltung.',
    specRef: 'dsv8.md:843',
  }),
]);

/** NACHWEIS — Zeitraum und Bahnlänge für den Pflichtzeitennachweis (dsv8.md:861). */
export const NACHWEIS = element('NACHWEIS', [
  field('nachweisVon', 'Datum', {
    required: true,
    doc: 'Ab wann Zeiten für den Pflichtzeitennachweis gelten.',
    specRef: 'dsv8.md:861',
  }),
  field('nachweisBis', 'Datum', {
    doc: 'Bis wann Zeiten für den Pflichtzeitennachweis gelten.',
    specRef: 'dsv8.md:863',
  }),
  // Eigener Wertevorrat — nicht der der VERANSTALTUNG (dsv8.md:427).
  field('bahnlaenge', 'ZK', {
    required: true,
    doc: 'Auf welcher Bahnlänge Zeiten berücksichtigt werden.',
    specRef: 'dsv8.md:865',
    values: [
      { value: '25', doc: 'nur 25-m-Bahn' },
      { value: '50', doc: 'nur 50-m-Bahn' },
      { value: 'FW', doc: 'Freiwasser' },
      { value: 'AL', doc: 'alle Bahnlängen' },
    ],
  }),
]);

/** ABSCHNITT — zeitlicher Abschnitt der Veranstaltung (dsv8.md:904). */
export const ABSCHNITT = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, maximal zweistellig.',
    specRef: 'dsv8.md:904',
    range: { min: 0, max: 99 },
  }),
  field('abschnittsdatum', 'Datum', {
    required: true,
    doc: 'Datum, an dem der Abschnitt stattfindet.',
    specRef: 'dsv8.md:918',
  }),
  field('einlass', 'Uhrzeit', { doc: 'Uhrzeit des Einlasses.', specRef: 'dsv8.md:922' }),
  field('kampfrichtersitzung', 'Uhrzeit', {
    doc: 'Uhrzeit der Kampfrichtersitzung.',
    specRef: 'dsv8.md:926',
  }),
  field('anfangszeit', 'Uhrzeit', {
    required: true,
    doc: 'Uhrzeit, zu der der Abschnitt beginnt.',
    specRef: 'dsv8.md:928',
  }),
  field('relativeAngabe', 'Zeichen', {
    doc: 'J, wenn die Zeiten relativ zum Ende des Vorabschnitts zu verstehen sind.',
    specRef: 'dsv8.md:932',
    default: 'N',
    values: [
      { value: 'J', doc: 'relative Angabe' },
      { value: 'N', doc: 'echte Uhrzeit' },
    ],
  }),
]);

/** Wertevorrat der Wettkampfart, in WETTKAMPF, WERTUNG und PFLICHTZEIT gleich. */
const WETTKAMPFART_WERTE: readonly EnumValue[] = [
  { value: 'V', doc: 'Vorlauf' },
  { value: 'Z', doc: 'Zwischenlauf' },
  { value: 'F', doc: 'Finale' },
  { value: 'E', doc: 'Entscheidung' },
  // Die Spezifikation sieht A und N nur in den Ergebnislisten vor
  // (dsv8.md:4726). In echten Ausschreibungen kommt N trotzdem vor — belegt
  // in dsvportal-13062024-Wk.dsv7, wo drei Wettkämpfe mit Art N als
  // „Nachschwimmen" kommentiert sind. Für A gibt es in den echten
  // Ausschreibungen keinen Beleg; toleriert wird es der Symmetrie halber.
  // Toleriert beim Lesen, beim Schreiben weiterhin unzulässig.
  // Den Vorbehalt trägt `tolerated`; die generierten Typen schreiben ihn aus.
  { value: 'A', doc: 'Ausschwimmen', tolerated: true },
  { value: 'N', doc: 'Nachschwimmen', tolerated: true },
];

/** WETTKAMPF — ein einzelner Wettkampf der Veranstaltung (dsv8.md:979). */
export const WETTKAMPF = element('WETTKAMPF', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes, maximal dreistellig.',
    specRef: 'dsv8.md:979',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:981',
    values: WETTKAMPFART_WERTE,
  }),
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, in dem der Wettkampf stattfindet, maximal zweistellig.',
    specRef: 'dsv8.md:997',
    range: { min: 0, max: 99 },
  }),
  field('anzahlStarter', 'Zahl', {
    doc: 'Anzahl der Starter; bei Staffeln die Zahl der Teilnehmenden.',
    specRef: 'dsv8.md:999',
    default: '1',
  }),
  field('einzelstrecke', 'Zahl', {
    required: true,
    doc: 'Strecke in Metern, 1 bis 25000, oder 0 für sonstige.',
    specRef: 'dsv8.md:1001',
    range: { min: 0, max: 25000 },
  }),
  field('technik', 'Zeichen', {
    required: true,
    doc: 'Schwimmart.',
    specRef: 'dsv8.md:1029',
    values: TECHNIK_WERTE,
  }),
  field('ausuebung', 'ZK', {
    required: true,
    doc: 'Art der Ausübung.',
    specRef: 'dsv8.md:1037',
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
  // Eigener Wertevorrat — WERTUNG und PFLICHTZEIT weichen ab (dsv8.md:1220, dsv8.md:1323).
  field('geschlecht', 'Zeichen', {
    required: true,
    doc: 'Geschlecht der Teilnehmenden.',
    specRef: 'dsv8.md:1062',
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
    specRef: 'dsv8.md:1075',
    values: ZUORDNUNG_BESTENLISTE_WERTE,
  }),
  field('qualifikationswettkampfnr', 'Zahl', {
    doc: 'Nummer des qualifizierenden Vor- oder Zwischenlaufs.',
    specRef: 'dsv8.md:1081',
    range: { min: 0, max: 999 },
  }),
  field('qualifikationswettkampfart', 'Zeichen', {
    doc: 'Art des qualifizierenden Wettkampfes.',
    specRef: 'dsv8.md:1119',
    values: WETTKAMPFART_WERTE,
  }),
]);

/** WERTUNG — eine Wertungsgruppe innerhalb eines Wettkampfes (dsv8.md:1151). */
export const WERTUNG = element('WERTUNG', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes, maximal dreistellig.',
    specRef: 'dsv8.md:1151',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:1153',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsId', 'Zahl', {
    required: true,
    doc: 'Veranstaltungsweit eindeutige Kennung der Wertung.',
    specRef: 'dsv8.md:1161',
  }),
  field('wertungsklasseTyp', 'ZK', {
    required: true,
    doc: 'Art der Wertungsklasse.',
    specRef: 'dsv8.md:1165',
    values: WERTUNGSKLASSE_WERTE,
  }),
  field('mindestJgAk', 'JGAK', {
    required: true,
    doc: 'Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.',
    specRef: 'dsv8.md:1171',
  }),
  // Der Unterlassungswert ist der Wert von mindestJgAk (dsv8.md:1214) und damit
  // kontextabhängig — er wird bewusst nicht als statischer `default` modelliert,
  // denn ein fester Wert wäre in jedem konkreten Record falsch.
  field('maximalJgAk', 'JGAK', {
    doc: 'Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.',
    specRef: 'dsv8.md:1174',
  }),
  // Eigener Wertevorrat — andere Reihenfolge als bei WETTKAMPF (dsv8.md:1062).
  field('geschlecht', 'Zeichen', {
    doc: 'Geschlecht der Wertung; ohne Angabe gilt das Geschlecht des Wettkampfes.',
    specRef: 'dsv8.md:1220',
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
    specRef: 'dsv8.md:1236',
  }),
]);

/** PFLICHTZEIT — zu erfüllende Zeit je Wertungsklasse (dsv8.md:1258). */
export const PFLICHTZEIT = element('PFLICHTZEIT', [
  field('wettkampfnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Wettkampfes, maximal dreistellig.',
    specRef: 'dsv8.md:1258',
    range: { min: 0, max: 999 },
  }),
  field('wettkampfart', 'Zeichen', {
    required: true,
    doc: 'Art des Wettkampfes.',
    specRef: 'dsv8.md:1260',
    values: WETTKAMPFART_WERTE,
  }),
  field('wertungsklasseTyp', 'ZK', {
    required: true,
    doc: 'Art der Wertungsklasse.',
    specRef: 'dsv8.md:1281',
    values: WERTUNGSKLASSE_WERTE,
  }),
  field('mindestJgAk', 'JGAK', {
    required: true,
    doc: 'Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.',
    specRef: 'dsv8.md:1287',
  }),
  // Wie bei WERTUNG: Unterlassungswert ist der Wert von mindestJgAk
  // (dsv8.md:1312), also kontextabhängig und kein statischer `default`.
  field('maximalJgAk', 'JGAK', {
    doc: 'Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.',
    specRef: 'dsv8.md:1290',
  }),
  field('pflichtzeit', 'Zeit', {
    required: true,
    doc: 'Zu erfüllende Pflichtzeit.',
    specRef: 'dsv8.md:1321',
  }),
  // Eigener Wertevorrat — ohne X, da eine Pflichtzeit stets geschlechtsbezogen gilt.
  field('geschlecht', 'Zeichen', {
    doc: 'Geschlecht, für das die Pflichtzeit gilt.',
    specRef: 'dsv8.md:1323',
    values: [
      { value: 'M', doc: 'männlich' },
      { value: 'W', doc: 'weiblich' },
      { value: 'D', doc: 'divers' },
    ],
  }),
]);

/** MELDEGELD — ein Meldegeldposten der Veranstaltung (dsv8.md:1360). */
export const MELDEGELD = element('MELDEGELD', [
  field('meldegeldTyp', 'ZK', {
    required: true,
    caseInsensitive: true,
    doc: 'Art des Meldegeldes.',
    specRef: 'dsv8.md:1360',
    // `Meldegeldpauschale` bedeutet in beiden Fassungen nicht dasselbe: DSV7
    // erhebt den Betrag „pro Meldung“ (dsv7.md:1317), DSV8 „pro Verein“
    // (dsv8.md:1403). Der Wert selbst, sein Datentyp und seine Stellung im
    // Element bleiben gleich — die Änderung betrifft allein, wie der Betrag
    // zu verrechnen ist. Eine Bibliothek, die Dateien liest und schreibt,
    // rechnet nicht ab; sie kann den Unterschied deshalb nur festhalten, nicht
    // prüfen. Wer Meldegelder summiert, muss die Formatversion der Datei
    // heranziehen.
    values: [
      {
        value: 'Meldegeldpauschale',
        doc: 'pauschaler Betrag; in DSV7 je Meldung, ab DSV8 je Verein',
      },
      { value: 'Einzelmeldegeld', doc: 'je Einzelwettkampf' },
      { value: 'Staffelmeldegeld', doc: 'je Staffelwettkampf' },
      { value: 'Wkmeldegeld', doc: 'je einzelnem Wettkampf, hat Vorrang' },
      { value: 'Mannschaftmeldegeld', doc: 'für Mannschaftswettkämpfe' },
      {
        value: 'Teilnehmermeldegeld',
        doc: 'pauschal je Teilnehmer mit Einzelmeldung',
        since: 8,
      },
      {
        value: 'Abschnittspauschale',
        doc: 'pauschal je Verein und gemeldetem Abschnitt',
        since: 8,
      },
    ],
  }),
  field('betrag', 'Betrag', {
    required: true,
    doc: 'Betrag des Meldegeldes.',
    specRef: 'dsv8.md:1382',
  }),
  field('wettkampfnr', 'Zahl', {
    doc: 'Nummer des Wettkampfes, maximal dreistellig; Pflicht bei Typ Wkmeldegeld.',
    specRef: 'dsv8.md:1389',
    range: { min: 0, max: 999 },
  }),
]);

/** DATEIENDE — schliesst die Datei ab, ohne Doppelpunkt und ohne Attribute. */
export const DATEIENDE = element('DATEIENDE', [], { bare: true });

/** Alle Elemente der Wettkampfdefinitionsliste mit ihren Kardinalitäten. */
export const WETTKAMPFDEFINITIONSLISTE = listSchema('Wettkampfdefinitionsliste', [
  occurrence(FORMAT, { min: 1, max: 1 }),
  occurrence(ERZEUGER, { min: 1, max: 1 }),
  occurrence(VERANSTALTUNG, { min: 1, max: 1 }),
  occurrence(VERANSTALTUNGSORT, { min: 1, max: 1 }),
  occurrence(AUSSCHREIBUNGIMNETZ, { min: 1, max: 1 }),
  occurrence(VERANSTALTER, { min: 1, max: 1 }),
  occurrence(AUSRICHTER, { min: 1, max: 1 }),
  occurrence(MELDEADRESSE, { min: 1, max: 1 }),
  occurrence(MELDESCHLUSS, { min: 1, max: 1 }),
  occurrence(BANKVERBINDUNG, { min: 0, max: 1 }),
  occurrence(LASTSCHRIFT, { min: 0, max: 1 }),
  occurrence(BESONDERES, { min: 0, max: 1 }),
  occurrence(NACHWEIS, { min: 0, max: 1 }),
  occurrence(ABSCHNITT, { min: 1, max: null }),
  occurrence(WETTKAMPF, { min: 1, max: null }),
  occurrence(WERTUNG, { min: 1, max: null }),
  occurrence(PFLICHTZEIT, { min: 0, max: null }),
  occurrence(MELDEGELD, { min: 1, max: null }),
  occurrence(DATEIENDE, { min: 1, max: 1 }),
]);
