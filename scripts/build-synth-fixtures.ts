/**
 * Erzeugt die synthetischen Fixtures in `test/fixtures/synth/`.
 *
 * Sie decken ab, wofür es in den 108 echten Dateien keine Belege gibt:
 * das Element NACHWEIS, die DSV8-Neuheiten LASTSCHRIFT und
 * BANKVERBINDUNG.kontoinhaber, die neuen Aufzählungswerte, sowie
 * PFLICHTZEIT — das in echten Daten nur zweimal vorkommt und für das es
 * auch keine unabhängige Zweitimplementierung als Gegencheck gibt.
 *
 *     npx tsx scripts/build-synth-fixtures.ts
 */

import { writeFileSync } from 'node:fs';

const CRLF = '\r\n';
const line = (el: string, ...fields: string[]): string =>
  fields.length === 0 ? el : `${el}:${fields.join(';')};`;

/** Kopf, den jede Wettkampfdefinitionsliste braucht. */
const kopf = (version: 7 | 8): string[] => [
  '(* synthetische Fixture — von scripts/build-synth-fixtures.ts erzeugt *)',
  line('FORMAT', 'Wettkampfdefinitionsliste', String(version)),
  line('ERZEUGER', 'dsv-testdaten', '1.0', 'test@example.org'),
  line('VERANSTALTUNG', 'Synthetischer Wettkampf', 'Musterstadt', '25', 'AUTOMATISCH'),
  line('VERANSTALTUNGSORT', 'Hallenbad', 'Musterweg 1', '12345', 'Musterstadt', 'GER', '', '', ''),
  line('AUSSCHREIBUNGIMNETZ', 'https://example.org/ausschreibung'),
  line('VERANSTALTER', 'SV Musterstadt'),
  line(
    'AUSRICHTER',
    'SV Musterstadt',
    'Muster, Max',
    '',
    '',
    '',
    '',
    '',
    '',
    'ausrichter@example.org',
  ),
  line('MELDEADRESSE', 'Muster, Max', '', '', '', '', '', '', 'meldung@example.org'),
  line('MELDESCHLUSS', '01.03.2026', '18:00'),
];

const rumpf = [
  line('ABSCHNITT', '1', '15.03.2026', '08:00', '08:30', '09:00', 'N'),
  line('WETTKAMPF', '1', 'V', '1', '', '100', 'F', 'GL', 'W', 'SW', '', ''),
  line('WERTUNG', '1', 'V', '1', 'JG', '0', '9999', '', 'Offene Wertung'),
  line('MELDEGELD', 'Meldegeldpauschale', '10,00', ''),
];

const schreibe = (name: string, zeilen: string[]): void => {
  writeFileSync(`test/fixtures/synth/${name}`, [...zeilen, 'DATEIENDE', ''].join(CRLF));
  console.log(`${name}: ${zeilen.length + 1} Zeilen`);
};

// NACHWEIS kommt in keiner der 33 echten Dateien vor.
schreibe('nachweis.dsv7', [
  ...kopf(7),
  line('NACHWEIS', '01.01.2025', '31.12.2025', 'AL'),
  ...rumpf,
]);

// LASTSCHRIFT und kontoinhaber gibt es erst ab DSV8.
schreibe('lastschrift-dsv8.dsv8', [...kopf(8), line('LASTSCHRIFT', 'J'), ...rumpf]);

schreibe('bankverbindung-dsv8.dsv8', [
  ...kopf(8),
  line(
    'BANKVERBINDUNG',
    'Sparkasse Musterstadt',
    'DE02120300000000202051',
    'BYLADEM1001',
    'SV Musterstadt',
  ),
  ...rumpf,
]);

schreibe('bankverbindung-dsv7.dsv7', [
  ...kopf(7),
  line('BANKVERBINDUNG', 'Sparkasse Musterstadt', 'DE02120300000000202051', 'BYLADEM1001'),
  ...rumpf,
]);

// PFLICHTZEIT: nur 2 Vorkommen in echten Daten, kein externer Gegencheck.
schreibe('pflichtzeit.dsv7', [
  ...kopf(7),
  ...rumpf,
  line('PFLICHTZEIT', '1', 'V', 'JG', '0', '1990', '00:00:55,00', ''),
  line('PFLICHTZEIT', '1', 'V', 'AK', '20', '25', '00:01:05,00', 'M'),
  line('PFLICHTZEIT', '1', 'V', 'AK', '20', '25', '00:01:15,00', 'W'),
  line('PFLICHTZEIT', '1', 'V', 'AK', '20', '25', '00:01:10,00', 'D'),
]);

// Neue Enum-Werte aus DSV8.
schreibe('dsv8-neue-werte.dsv8', [
  ...kopf(8),
  line('ABSCHNITT', '1', '15.03.2026', '', '', '09:00', 'J'),
  line('WETTKAMPF', '1', 'V', '1', '', '50', 'S', 'KB', 'D', 'SW', '', ''),
  line('WETTKAMPF', '2', 'E', '1', '4', '100', 'S', 'KR', 'X', 'MS', '1', 'V'),
  line('WERTUNG', '1', 'V', '1', 'AK', '100+', '', 'D', 'Masters-Staffel'),
  line('MELDEGELD', 'Teilnehmermeldegeld', '5,00', ''),
  line('MELDEGELD', 'Abschnittspauschale', '15,00', ''),
  line('MELDEGELD', 'Wkmeldegeld', '3,00', '1'),
]);
