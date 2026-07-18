import { element, field } from './types.js';

/** ABSCHNITT der Wettkampfdefinitionsliste — 6 Attribute (dsv8.md:894). */
export const ABSCHNITT_WKDEF = element('ABSCHNITT', [
  field('abschnittsnr', 'Zahl', {
    required: true,
    doc: 'Nummer des Abschnitts, maximal zweistellig.',
    specRef: 'dsv8.md:904',
  }),
  field('abschnittsdatum', 'Datum', {
    required: true,
    doc: 'Datum, an dem der Abschnitt stattfindet.',
    specRef: 'dsv8.md:918',
  }),
  field('einlass', 'Uhrzeit', {
    doc: 'Uhrzeit des Einlasses.',
    specRef: 'dsv8.md:922',
  }),
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
    doc: 'J, wenn die Anfangszeit relativ zum Ende des Vorabschnitts zu verstehen ist. Unterlassungswert N.',
    specRef: 'dsv8.md:932',
  }),
]);

/** ABSCHNITT der übrigen Listenarten — 4 Attribute (dsv8.md:2886). */
export const ABSCHNITT_ERGEBNIS = element('ABSCHNITT', [
  ABSCHNITT_WKDEF.fields[0]!,
  ABSCHNITT_WKDEF.fields[1]!,
  ABSCHNITT_WKDEF.fields[4]!,
  ABSCHNITT_WKDEF.fields[5]!,
]);
