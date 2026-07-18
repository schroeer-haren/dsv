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
    values: [
      { value: '16', doc: '16⅔ m' },
      { value: '20', doc: '20 m' },
      { value: '25', doc: '25 m' },
      { value: '33', doc: '33⅓ m' },
      { value: '50', doc: '50 m' },
      { value: 'FW', doc: 'Freiwasser' },
      { value: 'X', doc: 'sonstige Bahnlänge' },
    ],
  }),
  field('zeitmessung', 'ZK', {
    required: true,
    doc: 'Art der Zeitmessung.',
    specRef: 'dsv8.md:435',
    values: [
      { value: 'HANDZEIT', doc: 'Handzeit' },
      { value: 'AUTOMATISCH', doc: 'automatische Zeitmessung' },
      { value: 'HALBAUTOMATISCH', doc: 'halbautomatische Zeitmessung' },
    ],
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
