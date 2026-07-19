/**
 * Erzeugt die synthetischen Fixtures in `test/fixtures/synth/`.
 *
 * Sie decken ab, wofür es in den 108 echten Dateien keine Belege gibt.
 *
 * Für die Wettkampfdefinitionsliste: das Element NACHWEIS, die DSV8-Neuheiten
 * LASTSCHRIFT und BANKVERBINDUNG.kontoinhaber, die neuen Aufzählungswerte,
 * sowie PFLICHTZEIT — das in echten Daten nur zweimal vorkommt und für das es
 * auch keine unabhängige Zweitimplementierung als Gegencheck gibt.
 *
 * Für die Wettkampfergebnisliste: das Element STABLOESE, das in keiner der 75
 * echten Ergebnislisten vorkommt, die dritte Staatsangehörigkeit, die real nie
 * gesetzt ist, und die Aufzählungswerte ohne empirischen Beleg.
 *
 * Für Vereinsmelde- und Vereinsergebnisliste: schlicht alles — zu beiden gibt
 * es keine einzige echte Datei. Je zwei Fixtures, ein volles und ein knappes,
 * setzen jedes Schemafeld einmal und lassen jedes optionale Feld einmal leer.
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

// ---------------------------------------------------------------------------
// Wettkampfergebnisliste
// ---------------------------------------------------------------------------

/**
 * Kopf, den jede Wettkampfergebnisliste braucht.
 *
 * ABSCHNITT führt hier nur vier Felder — Einlass und Kampfrichtersitzung
 * gehören zur Ausschreibung und stehen allein in der Definitionsliste.
 */
const ergebnisKopf = (version: 7 | 8, bahnlaenge = '25'): string[] => [
  '(* synthetische Fixture — von scripts/build-synth-fixtures.ts erzeugt *)',
  line('FORMAT', 'Wettkampfergebnisliste', String(version)),
  line('ERZEUGER', 'dsv-testdaten', '1.0', 'test@example.org'),
  line('VERANSTALTUNG', 'Synthetischer Wettkampf', 'Musterstadt', bahnlaenge, 'AUTOMATISCH'),
  line('VERANSTALTER', 'SV Musterstadt'),
  line(
    'AUSRICHTER',
    'SV Musterstadt',
    'Muster, Max',
    'Musterweg 1',
    '12345',
    'Musterstadt',
    'GER',
    '',
    '',
    'ausrichter@example.org',
  ),
];

/** Die beiden Vereine, auf die sich alle Ergebniszeilen beziehen. */
const vereine = [
  line('VEREIN', 'SV Musterstadt', '1234', '10', 'GER'),
  line('VEREIN', 'Auslandsverein', '0', '0', 'AUT'),
];

/**
 * STABLOESE kommt in keiner der 75 echten Ergebnislisten vor — die Definition
 * stützt sich allein auf die Spezifikation. Zusammen mit den übrigen
 * Staffelelementen, der dritten Staatsangehörigkeit und der Altersklasse, die
 * real ebenfalls kaum belegt sind.
 */
schreibe('ergebnis-staffel.dsv7', [
  ...ergebnisKopf(7, '33'),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', 'N'),
  line('WETTKAMPF', '10', 'V', '1', '4', '100', 'F', 'GL', 'X', 'SW', '', ''),
  line('WETTKAMPF', '10', 'F', '1', '4', '100', 'F', 'GL', 'X', 'SW', '10', 'V'),
  line('WETTKAMPF', '10', 'Z', '1', '4', '100', 'F', 'GL', 'X', 'SW', '10', 'V'),
  line('WETTKAMPF', '10', 'A', '1', '4', '100', 'F', 'GL', 'X', 'SW', '', ''),
  line('WETTKAMPF', '10', 'N', '1', '4', '100', 'F', 'GL', 'X', 'SW', '', ''),
  line('WERTUNG', '10', 'V', '1', 'AK', '100', '', 'X', 'Staffel offen'),
  line('WERTUNG', '10', 'F', '2', 'AK', '100', '', 'X', 'Staffel Finale'),
  line('WERTUNG', '10', 'Z', '3', 'AK', '100', '', 'X', 'Staffel Zwischenlauf'),
  line('WERTUNG', '10', 'A', '4', 'AK', '100', '', 'X', 'Staffel Ausschwimmen'),
  line('WERTUNG', '10', 'N', '5', 'AK', '100', '', 'X', 'Staffel Nachschwimmen'),
  ...vereine,
  // Staffel im Vorlauf, mit allen vier Schwimmerinnen und Schwimmern.
  line(
    'STERGEBNIS',
    '10',
    'V',
    '1',
    '1',
    '',
    '1',
    '9001',
    'SV Musterstadt',
    '1234',
    '00:04:12,34',
    '',
    '',
    '',
  ),
  line(
    'STAFFELPERSON',
    '9001',
    '10',
    'V',
    'Erste, Anna',
    '100001',
    '1',
    'W',
    '2008',
    '20',
    'GER',
    'POL',
    'UKR',
  ),
  line(
    'STAFFELPERSON',
    '9001',
    '10',
    'V',
    'Zweite, Bea',
    '100002',
    '2',
    'W',
    '2009',
    '',
    'GER',
    '',
    '',
  ),
  line(
    'STAFFELPERSON',
    '9001',
    '10',
    'V',
    'Dritte, Cara',
    '100003',
    '3',
    'D',
    '2007',
    '25',
    '',
    '',
    '',
  ),
  line(
    'STAFFELPERSON',
    '9001',
    '10',
    'V',
    'Vierte, Dora',
    '100004',
    '4',
    'M',
    '2006',
    '',
    'AUT',
    'GER',
    'SUI',
  ),
  line('STZWISCHENZEIT', '9001', '10', 'V', '1', '50', '00:00:31,00'),
  line('STZWISCHENZEIT', '9001', '10', 'V', '2', '50', '00:01:02,50'),
  // STABLOESE: beide Vorzeichen und einmal ohne Angabe, damit der
  // Unterlassungswert `+` überhaupt zum Zuge kommt.
  line('STABLOESE', '9001', '10', 'V', '1', '+', '00:00:00,68'),
  line('STABLOESE', '9001', '10', 'V', '2', '-', '00:00:00,04'),
  line('STABLOESE', '9001', '10', 'V', '3', '', '00:00:00,21'),
  line('STABLOESE', '9001', '10', 'V', '4', '+', '00:00:00,33'),
  // Dieselbe Staffel im Finale, damit die Wettkampfart F an allen
  // Staffelelementen einmal vorkommt.
  line(
    'STERGEBNIS',
    '10',
    'F',
    '2',
    '1',
    '',
    '1',
    '9002',
    'SV Musterstadt',
    '1234',
    '00:04:08,10',
    '',
    '',
    'N',
  ),
  line(
    'STAFFELPERSON',
    '9002',
    '10',
    'F',
    'Erste, Anna',
    '100001',
    '1',
    'W',
    '2008',
    '',
    'GER',
    '',
    '',
  ),
  line('STZWISCHENZEIT', '9002', '10', 'F', '1', '50', '00:00:30,10'),
  line('STABLOESE', '9002', '10', 'F', '1', '', '00:00:00,55'),
  // Die übrigen Wettkampfarten je einmal an allen vier Staffelelementen: in
  // echten Dateien tragen diese nur E, hier kommen Z, A und N dazu.
  ...['Z', 'A', 'N'].flatMap((art, index) => {
    const id = String(9003 + index);
    const wertung = String(3 + index);
    return [
      line(
        'STERGEBNIS',
        '10',
        art,
        wertung,
        '1',
        '',
        '1',
        id,
        'Auslandsverein',
        '0',
        '00:04:20,00',
        '',
        '',
        '',
      ),
      line(
        'STAFFELPERSON',
        id,
        '10',
        art,
        'Erste, Anna',
        '100001',
        '1',
        'W',
        '2008',
        '',
        '',
        '',
        '',
      ),
      line('STZWISCHENZEIT', id, '10', art, '1', '50', '00:00:32,00'),
      line('STABLOESE', id, '10', art, '1', '+', '00:00:00,60'),
    ];
  }),
]);

/**
 * Die fünf Gründe der Nichtwertung, die Kennzeichen zum erhöhten
 * nachträglichen Meldegeld und die Startnummer der disqualifizierten Person.
 * Bei gesetztem Grund muss der Platz 0 sein (dsv8.md:5046).
 */
schreibe('ergebnis-nichtwertung.dsv7', [
  ...ergebnisKopf(7, 'X'),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', ''),
  line('WETTKAMPF', '1', 'V', '1', '1', '100', 'F', 'GL', 'W', 'SW', '', ''),
  line('WETTKAMPF', '20', 'E', '1', '4', '200', 'L', 'GL', 'X', 'SW', '', ''),
  line('WERTUNG', '1', 'V', '1', 'JG', '0', '9999', 'W', 'Offene Wertung'),
  line('WERTUNG', '20', 'E', '2', 'AK', '100', '', 'X', 'Staffelwertung'),
  ...vereine,
  // Ein gewertetes Ergebnis als Gegenprobe, danach je ein Grund.
  line(
    'PNERGEBNIS',
    '1',
    'V',
    '1',
    '1',
    '',
    'Muster, Mia',
    '100010',
    '1',
    'W',
    '2005',
    '',
    'SV Musterstadt',
    '1234',
    '00:01:02,11',
    '',
    'E',
    'GER',
    '',
    '',
  ),
  line(
    'PNERGEBNIS',
    '1',
    'V',
    '1',
    '0',
    'DS',
    'Muster, Nina',
    '100011',
    '2',
    'W',
    '2005',
    '',
    'SV Musterstadt',
    '1234',
    '00:00:00,00',
    'Wende nicht regelgerecht',
    'F',
    'GER',
    'POL',
    'UKR',
  ),
  line(
    'PNERGEBNIS',
    '1',
    'V',
    '1',
    '0',
    'NA',
    'Muster, Olga',
    '100012',
    '3',
    'W',
    '2004',
    '',
    'SV Musterstadt',
    '1234',
    '00:00:00,00',
    '',
    'N',
    '',
    '',
    '',
  ),
  line(
    'PNERGEBNIS',
    '1',
    'V',
    '1',
    '0',
    'AB',
    'Muster, Pia',
    '100013',
    '4',
    'W',
    '2004',
    '',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    'AUT',
    '',
    '',
  ),
  line(
    'PNERGEBNIS',
    '1',
    'V',
    '1',
    '0',
    'AU',
    'Muster, Rita',
    '100014',
    '5',
    'D',
    '2003',
    '30',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    '',
    '',
    '',
  ),
  line(
    'PNERGEBNIS',
    '1',
    'V',
    '1',
    '0',
    'ZU',
    'Muster, Sina',
    '100015',
    '6',
    'W',
    '2003',
    '',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    '',
    '',
    '',
  ),
  line('PNZWISCHENZEIT', '1', '1', 'V', '50', '00:00:30,05'),
  line('PNREAKTION', '1', '1', 'V', '+', '00:00:00,71'),
  line('PNREAKTION', '2', '1', 'V', '-', '00:00:00,09'),
  line('PNREAKTION', '3', '1', 'V', '', '00:00:00,64'),
  // Staffeln mit denselben Gründen; STERGEBNIS trägt zusätzlich die
  // Startnummer der disqualifizierten Person.
  line(
    'STERGEBNIS',
    '20',
    'E',
    '2',
    '1',
    '',
    '1',
    '9010',
    'SV Musterstadt',
    '1234',
    '00:08:30,00',
    '',
    '',
    'E',
  ),
  line(
    'STERGEBNIS',
    '20',
    'E',
    '2',
    '0',
    'DS',
    '2',
    '9011',
    'SV Musterstadt',
    '1234',
    '00:00:00,00',
    '4',
    'Frühstart Ablösung',
    'F',
  ),
  line(
    'STERGEBNIS',
    '20',
    'E',
    '2',
    '0',
    'NA',
    '3',
    '9012',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    '',
  ),
  line(
    'STERGEBNIS',
    '20',
    'E',
    '2',
    '0',
    'AB',
    '4',
    '9013',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    '',
  ),
  line(
    'STERGEBNIS',
    '20',
    'E',
    '2',
    '0',
    'AU',
    '5',
    '9014',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    '',
  ),
  line(
    'STERGEBNIS',
    '20',
    'E',
    '2',
    '0',
    'ZU',
    '6',
    '9015',
    'Auslandsverein',
    '0',
    '00:00:00,00',
    '',
    '',
    '',
  ),
  line(
    'STAFFELPERSON',
    '9010',
    '20',
    'E',
    'Muster, Tina',
    '100016',
    '1',
    'W',
    '2002',
    '',
    '',
    '',
    '',
  ),
]);

/**
 * Alle Positionen des Kampfgerichts, auch die vier, die real nicht vorkommen
 * (ASCH, SIB, SAUF, VER), sowie die Bahnlängen und Ausübungen ohne Beleg.
 */
schreibe('ergebnis-kampfgericht.dsv7', [
  ...ergebnisKopf(7, 'FW'),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', 'N'),
  line('ABSCHNITT', '2', '15.03.2026', '01:30', 'J'),
  ...[
    'SCH',
    'STA',
    'ZRO',
    'ZR',
    'ZNO',
    'ZN',
    'RZN',
    'SR',
    'WRO',
    'WR',
    'AUS',
    'SP',
    'PKF',
    'STO',
    'WKH',
    'ASCH',
    'SIB',
    'SAUF',
    'VER',
    'ZBV',
  ].map((position, index) =>
    line('KAMPFGERICHT', '1', position, `Richter, Nr${String(index + 1)}`, 'SV Musterstadt'),
  ),
  line('KAMPFGERICHT', '2', 'SCH', 'Richter, Zweit', 'Auslandsverein'),
  line('WETTKAMPF', '1', 'V', '1', '1', '5000', 'F', 'AR', 'M', 'EW', '', ''),
  // Der Vorrat der qualifizierenden Wettkampfart kennt nur V, Z, F und E —
  // hier je einmal V, Z und F als Bezug.
  line('WETTKAMPF', '2', 'A', '1', '1', '0', 'X', 'ST', 'M', 'PA', '5', 'F'),
  line('WETTKAMPF', '3', 'N', '2', '1', '25', 'R', 'WE', 'W', 'XX', '', ''),
  line('WETTKAMPF', '4', 'Z', '2', '1', '50', 'B', 'GB', 'W', 'KG', '1', 'V'),
  line('WETTKAMPF', '5', 'F', '2', '1', '50', 'B', 'GL', 'W', 'KG', '4', 'Z'),
  line('WERTUNG', '1', 'V', '1', 'JG', '0', '', 'M', 'Freiwasser'),
  line('WERTUNG', '2', 'A', '2', 'JG', '0', '', 'M', 'Ausschwimmen'),
  line('WERTUNG', '3', 'N', '3', 'JG', '0', '', 'W', 'Nachschwimmen'),
  line('WERTUNG', '4', 'Z', '4', 'JG', '0', '', 'W', 'Zwischenlauf'),
  line('WERTUNG', '5', 'F', '5', 'JG', '0', '', 'W', 'Finale'),
  ...vereine,
  // Die Wettkampfarten A und N, die es nur in der Ergebnisliste gibt.
  line(
    'PNERGEBNIS',
    '2',
    'A',
    '2',
    '1',
    '',
    'Muster, Udo',
    '100020',
    '1',
    'M',
    '2000',
    '',
    'SV Musterstadt',
    '1234',
    '00:00:41,00',
    '',
    '',
    'GER',
    '',
    '',
  ),
  line(
    'PNERGEBNIS',
    '3',
    'N',
    '3',
    '1',
    '',
    'Muster, Vera',
    '100021',
    '2',
    'W',
    '2001',
    '',
    'SV Musterstadt',
    '1234',
    '00:00:19,00',
    '',
    '',
    'GER',
    '',
    '',
  ),
  line(
    'PNERGEBNIS',
    '4',
    'Z',
    '4',
    '1',
    '',
    'Muster, Wera',
    '100022',
    '3',
    'W',
    '2001',
    '',
    'SV Musterstadt',
    '1234',
    '00:00:38,00',
    '',
    '',
    'GER',
    '',
    '',
  ),
  line('PNZWISCHENZEIT', '1', '2', 'A', '25', '00:00:20,00'),
  line('PNZWISCHENZEIT', '2', '3', 'N', '12', '00:00:09,00'),
  line('PNZWISCHENZEIT', '3', '4', 'Z', '25', '00:00:18,00'),
  line('PNREAKTION', '1', '2', 'A', '+', '00:00:00,70'),
  line('PNREAKTION', '2', '3', 'N', '+', '00:00:00,66'),
  line('PNREAKTION', '3', '4', 'Z', '+', '00:00:00,69'),
]);

/**
 * DSV8-Fassung. Diese Listenart ist in DSV8 strukturell mit DSV7 identisch —
 * kein Element und kein Feld kommt hinzu. Die Datei zeigt genau das: dieselben
 * Zeilen, nur mit `FORMAT:...;8;`. Zusätzlich das Geschlecht D, das die
 * Spezifikation für WETTKAMPF erst ab DSV8 vorsieht.
 */
schreibe('ergebnis-dsv8.dsv8', [
  ...ergebnisKopf(8, '16'),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', 'N'),
  line('WETTKAMPF', '1', 'E', '1', '1', '100', 'L', 'GL', 'D', 'MS', '', ''),
  // KB und KR gibt es erst ab DSV8 und nur zur Technik S.
  line('WETTKAMPF', '2', 'E', '1', '1', '50', 'S', 'KB', 'D', 'MS', '', ''),
  line('WETTKAMPF', '3', 'E', '1', '1', '50', 'S', 'KR', 'D', 'MS', '', ''),
  line('WERTUNG', '1', 'E', '1', 'AK', '20', '25', 'D', 'Masters divers'),
  line('WERTUNG', '2', 'E', '2', 'AK', '20', '25', 'D', 'Masters Kicks Bauch'),
  line('WERTUNG', '3', 'E', '3', 'AK', '20', '25', 'D', 'Masters Kicks Rücken'),
  ...vereine,
  line(
    'PNERGEBNIS',
    '1',
    'E',
    '1',
    '1',
    '',
    'Muster, Alex',
    '100030',
    '1',
    'D',
    '1999',
    '25',
    'SV Musterstadt',
    '1234',
    '00:01:04,00',
    '',
    '',
    'GER',
    'AUT',
    'SUI',
  ),
  line('PNZWISCHENZEIT', '1', '1', 'E', '50', '00:00:31,00'),
  line('PNREAKTION', '1', '1', 'E', '+', '00:00:00,72'),
  line(
    'STERGEBNIS',
    '1',
    'E',
    '1',
    '2',
    '',
    '1',
    '9020',
    'Auslandsverein',
    '0',
    '00:01:10,00',
    '',
    '',
    '',
  ),
  line(
    'STAFFELPERSON',
    '9020',
    '1',
    'E',
    'Muster, Bine',
    '100031',
    '1',
    'D',
    '1998',
    '25',
    'AUT',
    'GER',
    'SUI',
  ),
  line('STZWISCHENZEIT', '9020', '1', 'E', '1', '50', '00:00:35,00'),
  line('STABLOESE', '9020', '1', 'E', '1', '+', '00:00:00,50'),
]);

// ---------------------------------------------------------------------------
// Vereinsmeldeliste
// ---------------------------------------------------------------------------

/**
 * Für diese Listenart gibt es keine einzige echte Datei. Dieses Fixture ist
 * damit der einzige Beleg dafür, dass Schema, Leser und Schreiber
 * zusammenpassen — es führt jedes der 17 Elemente mindestens einmal, dazu die
 * DSV8-Neuheiten (`VEREIN.lastschrift`, Geschlecht `D` bei KARIMELDUNG,
 * TRAINER und PNMELDUNG, die Ausübungen `KB` und `KR`) und alle vier
 * Wettkampfarten — auch `Z` und `F`, die die Wertetabelle der Spezifikation
 * nicht nennt, ihre eigene Beispielzeile aber verwendet.
 */
schreibe('vereinsmeldung.dsv8', [
  line('FORMAT', 'Vereinsmeldeliste', '8'),
  line('ERZEUGER', 'dsv-testdaten', '1.0', 'test@example.org'),
  line('VERANSTALTUNG', 'Synthetischer Wettkampf', 'Musterstadt', '50', 'AUTOMATISCH'),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', 'N'),
  line('ABSCHNITT', '2', '15.03.2026', '01:30', 'J'),
  // Alle vier Wettkampfarten, beide Kicks und alle Geschlechter.
  line('WETTKAMPF', '1', 'V', '1', '1', '100', 'F', 'GL', 'W', '', ''),
  line('WETTKAMPF', '2', 'Z', '1', '1', '50', 'R', 'BE', 'M', '1', 'V'),
  line('WETTKAMPF', '3', 'F', '2', '1', '50', 'S', 'KB', 'D', '2', 'Z'),
  line('WETTKAMPF', '4', 'E', '2', '4', '25000', 'S', 'KR', 'X', '3', 'F'),
  line('WETTKAMPF', '5', 'E', '2', '1', '0', 'X', 'AR', 'W', '', ''),
  line('VEREIN', 'SV Musterstadt', '1234', '10', 'GER', 'J'),
  line(
    'ANSPRECHPARTNER',
    'Muster, Max',
    'Musterweg 1',
    '12345',
    'Musterstadt',
    'GER',
    '0123 456789',
    '0123 456780',
    'meldung@example.org',
  ),
  // Alle vier Kampfrichtergruppen und alle drei Geschlechter.
  line('KARIMELDUNG', '1', 'Richter, Rita', 'SCH', 'W'),
  line('KARIMELDUNG', '2', 'Richter, Rolf', 'WKR', 'M'),
  line('KARIMELDUNG', '3', 'Richter, Robin', 'AUS', 'D'),
  line('KARIMELDUNG', '4', 'Richter, Rosa', 'SPR', ''),
  // Alle 18 Einsatzwünsche, dazu einmal ohne Angabe.
  ...[
    'SCH',
    'STA',
    'ZRO',
    'ZR',
    'ZNO',
    'ZN',
    'RZN',
    'SR',
    'WRO',
    'WR',
    'AUS',
    'SP',
    'PKF',
    'STO',
    'ASCH',
    'SIB',
    'SAUF',
    'VER',
    '',
  ].map((wunsch, index) =>
    line('KARIABSCHNITT', String((index % 4) + 1), String((index % 2) + 1), wunsch),
  ),
  line('TRAINER', '1', 'Trainer, Tina', 'W'),
  line('TRAINER', '2', 'Trainer, Tom', 'M'),
  line('TRAINER', '3', 'Trainer, Toni', 'D'),
  line('TRAINER', '4', 'Trainer, Tabea', ''),
  line('PNMELDUNG', 'Muster, Mia', '100010', '1', 'W', '2008', '20', '1', 'GER', 'POL', 'UKR'),
  line('PNMELDUNG', 'Muster, Mo', '100011', '2', 'M', '2007', '', '', '', '', ''),
  line('PNMELDUNG', 'Muster, Alex', '100012', '3', 'D', '2006', '25', '3', 'AUT', '', ''),
  // HANDICAP: die Startklassen ohne Angabe (AB) und je eine hohe Klasse.
  line('HANDICAP', '1', 'DBS-4711', 'IPC-4711', 'S10', 'SB9', 'SM10', 'Regel 12'),
  line('HANDICAP', '2', '', '', 'AB', 'AB', 'AB', ''),
  line('HANDICAP', '3', '', '', 'S14', 'SB14', 'SM14', ''),
  line('STARTPN', '1', '1', '00:01:02,11'),
  line('STARTPN', '2', '2', ''),
  line('STARTPN', '3', '3', '00:00:31,45'),
  // STMELDUNG: Jahrgangs- und Altersklassenwertung, mit und ohne obere Grenze.
  line('STMELDUNG', '1', '9001', 'JG', '2008', '2010', 'Staffel A'),
  line('STMELDUNG', '2', '9002', 'AK', '100', '', ''),
  line('STARTST', '9001', '4', '00:04:12,34'),
  line('STARTST', '9002', '4', ''),
  line('STAFFELPERSON', '9001', '4', '1', '1'),
  line('STAFFELPERSON', '9001', '4', '2', '2'),
  line('STAFFELPERSON', '9001', '4', '3', '3'),
  line('STAFFELPERSON', '9002', '4', '1', '1'),
]);

/**
 * Knappe Gegenprobe zur vollen Meldung.
 *
 * `ANSPRECHPARTNER` und `VEREIN` stehen genau einmal je Datei; ihre optionalen
 * Felder lassen sich in ein und derselben Datei deshalb nicht zugleich gesetzt
 * und leer zeigen. Dieses Fixture setzt nur die Pflichtfelder und schliesst
 * damit die Abdeckungslücke, die `vereinsmeldung.dsv8` offenlassen muss.
 */
schreibe('vereinsmeldung-knapp.dsv8', [
  line('FORMAT', 'Vereinsmeldeliste', '8'),
  line('ERZEUGER', 'dsv-testdaten', '1.0', 'test@example.org'),
  line('VERANSTALTUNG', 'Knappe Meldung', 'Musterstadt', '20', 'HANDZEIT'),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', ''),
  line('WETTKAMPF', '1', 'V', '1', '', '100', 'F', 'GL', 'W', '', ''),
  line('VEREIN', 'SV Nachbarort', '4321', '11', 'GER', ''),
  line('ANSPRECHPARTNER', 'Muster, Mia', '', '', '', '', '', '', 'meldung@example.org'),
]);

// ---------------------------------------------------------------------------
// Vereinsergebnisliste
// ---------------------------------------------------------------------------

/** Die zwanzig Positionen des Kampfgerichts (dsv8.md:2943). */
const POSITIONEN = [
  'SCH',
  'STA',
  'ZRO',
  'ZR',
  'ZNO',
  'ZN',
  'RZN',
  'SR',
  'WRO',
  'WR',
  'AUS',
  'SP',
  'PKF',
  'STO',
  'WKH',
  'ASCH',
  'SIB',
  'SAUF',
  'VER',
  'ZBV',
];

/**
 * Auch für die Vereinsergebnisliste gibt es keine einzige echte Datei. Dieses
 * Fixture führt jedes der 20 Elemente mindestens einmal und setzt jedes
 * optionale Feld einmal gefüllt und einmal leer — es ist damit der einzige
 * Beleg dafür, dass Schema, Leser und Schreiber zusammenpassen.
 *
 * Zwei Feinheiten der Listenart sind hier absichtlich sichtbar: `WERTUNG`
 * kennt die Wettkampfarten `A` und `N` nicht, `WETTKAMPF` und alle
 * Ergebniselemente dagegen schon; und das Staffelergebnis heisst hier
 * `STAFFELERGEBNIS`, nicht `STERGEBNIS`.
 */
schreibe('vereinsergebnis.dsv8', [
  line('FORMAT', 'Vereinsergebnisliste', '8'),
  line('ERZEUGER', 'dsv-testdaten', '1.0', 'test@example.org'),
  line('VERANSTALTUNG', 'Synthetischer Wettkampf', 'Musterstadt', '50', 'AUTOMATISCH'),
  line('VERANSTALTER', 'Schwimmverband Musterland'),
  line(
    'AUSRICHTER',
    'SV Musterstadt',
    'Muster, Max',
    'Musterweg 1',
    '12345',
    'Musterstadt',
    'GER',
    '0123 456789',
    '0123 456780',
    'ausrichter@example.org',
  ),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', 'N'),
  line('ABSCHNITT', '2', '15.03.2026', '01:30', 'J'),
  line('ABSCHNITT', '3', '16.03.2026', '09:00', ''),
  // Alle zwanzig Positionen, darunter die in der Vereinsmeldeliste fehlenden
  // WKH und ZBV.
  ...POSITIONEN.map((position, index) =>
    line(
      'KAMPFGERICHT',
      String((index % 3) + 1),
      position,
      `Richter, R${String(index + 1)}`,
      'SV Musterstadt',
    ),
  ),
  // Alle sechs Wettkampfarten, alle Techniken, Ausübungen, Geschlechter und
  // Zuordnungen zur Bestenliste. Kicks nur als Schmetterling (dsv8.md:1070).
  line('WETTKAMPF', '1', 'V', '1', '', '100', 'F', 'GL', 'W', 'SW', '', ''),
  line('WETTKAMPF', '2', 'Z', '1', '1', '50', 'R', 'BE', 'M', 'MS', '1', 'V'),
  line('WETTKAMPF', '3', 'F', '2', '1', '50', 'B', 'AR', 'D', 'KG', '2', 'Z'),
  // Gemischt (X) verlangt die Standard-Bestenliste SW (dsv8.md:3159); EW steht
  // deshalb an Wettkampf 7, sonst bliebe der Wert unbelegt.
  line('WETTKAMPF', '4', 'E', '2', '4', '400', 'L', 'ST', 'X', 'SW', '3', 'F'),
  line('WETTKAMPF', '5', 'A', '3', '1', '200', 'S', 'WE', 'W', 'PA', '4', 'E'),
  line('WETTKAMPF', '6', 'N', '3', '1', '0', 'X', 'GB', 'M', 'XX', '', ''),
  line('WETTKAMPF', '7', 'V', '1', '1', '25000', 'S', 'KB', 'W', 'EW', '', ''),
  line('WETTKAMPF', '8', 'V', '1', '1', '100', 'S', 'KR', 'M', 'SW', '', ''),
  // Beide Wertungsklassen, obere Grenze und Geschlecht je gesetzt und leer.
  line('WERTUNG', '1', 'V', '1', 'JG', '0', '9999', '', 'Offene Wertung'),
  line('WERTUNG', '2', 'Z', '2', 'JG', '2008', '', 'W', 'Jahrgang 2008'),
  line('WERTUNG', '3', 'F', '3', 'AK', '100', '120', 'M', 'Masters 100 bis 120'),
  line('WERTUNG', '4', 'E', '4', 'AK', '100', '', 'D', 'Masters 100'),
  line('WERTUNG', '7', 'V', '5', 'JG', '0', '9999', 'X', 'Gemischte Wertung'),
  // Aus- und Nachschwimmen brauchen eine eigene Wertung: Ein Ergebnis darf nur
  // auf eine Wertung seines eigenen Wettkampfs zeigen, und `wertungsId` ist
  // Pflicht. Die Wertetabelle der WERTUNG führt A und N nicht auf
  // (dsv8.md:3197) — siehe die Begründung am Wertevorrat des Schemas.
  line('WERTUNG', '5', 'A', '6', 'AK', '0', '9999', 'W', 'Ausschwimmen'),
  line('WERTUNG', '6', 'N', '7', 'JG', '0', '9999', 'M', 'Nachschwimmen'),
  line('VEREIN', 'SV Musterstadt', '1234', '10', 'GER'),
  // Alle drei Geschlechter; Altersklasse und Nationalitäten gesetzt und leer.
  line('PERSON', 'Muster, Mia', '100010', '1', 'W', '2008', '20', 'GER', 'POL', 'UKR'),
  line('PERSON', 'Muster, Mo', '100011', '2', 'M', '2007', '', '', '', ''),
  line('PERSON', 'Muster, Alex', '100012', '3', 'D', '2006', '25', 'AUT', '', ''),
  // Alle sechs Wettkampfarten, alle fünf Gründe der Nichtwertung und alle drei
  // Meldegeldkennzeichen. Ohne Wertung steht der Platz auf 0 (dsv8.md:3495).
  line('PERSONENERGEBNIS', '1', '1', 'V', '1', '1', '00:01:02,11', '', '', ''),
  line('PERSONENERGEBNIS', '1', '2', 'Z', '2', '0', '00:00:31,45', 'DS', 'Wende', 'E'),
  line('PERSONENERGEBNIS', '2', '3', 'F', '3', '0', '00:00:00,00', 'NA', '', 'F'),
  line('PERSONENERGEBNIS', '2', '4', 'E', '4', '0', '00:00:00,00', 'AB', '', 'N'),
  line('PERSONENERGEBNIS', '3', '5', 'A', '6', '0', '00:00:00,00', 'AU', '', ''),
  line('PERSONENERGEBNIS', '3', '6', 'N', '7', '0', '00:00:00,00', 'ZU', '', ''),
  line('PNZWISCHENZEIT', '1', '1', 'V', '50', '00:00:29,03'),
  line('PNZWISCHENZEIT', '2', '3', 'F', '25', '00:00:14,88'),
  // Vorzeichen der Reaktionszeit gesetzt und leer.
  line('PNREAKTION', '1', '1', 'V', '+', '00:00:00,72'),
  line('PNREAKTION', '2', '3', 'F', '-', '00:00:00,04'),
  line('PNREAKTION', '3', '5', 'A', '', '00:00:00,68'),
  // Jahrgangs- und Altersklassenstaffel, obere Grenze gesetzt und leer.
  line('STAFFEL', '1', '9001', 'JG', '2008', '2010'),
  line('STAFFEL', '2', '9002', 'AK', '100', ''),
  line(
    'STAFFELPERSON',
    '9001',
    '4',
    'E',
    'Muster, Mia',
    '100010',
    '1',
    'W',
    '2008',
    '20',
    'GER',
    'POL',
    'UKR',
  ),
  line('STAFFELPERSON', '9001', '4', 'E', 'Muster, Mo', '100011', '2', 'M', '2007', '', '', '', ''),
  line(
    'STAFFELPERSON',
    '9001',
    '4',
    'E',
    'Muster, Alex',
    '100012',
    '3',
    'D',
    '2006',
    '25',
    'AUT',
    '',
    '',
  ),
  line(
    'STAFFELPERSON',
    '9002',
    '6',
    'N',
    'Muster, Mo',
    '100011',
    '1',
    'M',
    '2007',
    '',
    'GER',
    '',
    '',
  ),
  // Startnummer der disqualifizierten Person gesetzt, 0 für den allgemeinen
  // Grund, und leer.
  line('STAFFELERGEBNIS', '9001', '4', 'E', '4', '2', '00:04:30,84', '', '', '', ''),
  line('STAFFELERGEBNIS', '9001', '4', 'E', '4', '0', '00:00:00,00', 'DS', '3', 'Wechsel', 'E'),
  line('STAFFELERGEBNIS', '9002', '6', 'N', '7', '0', '00:00:00,00', 'ZU', '0', '', ''),
  line('STZWISCHENZEIT', '9001', '4', 'E', '1', '100', '00:01:03,61'),
  line('STZWISCHENZEIT', '9001', '4', 'E', '2', '200', '00:02:10,02'),
  // STABLOESE hat im Kapitel keine Beispielzeile; die Feldfolge stammt allein
  // aus der Tabelle.
  line('STABLOESE', '9001', '4', 'E', '2', '+', '00:00:00,32'),
  line('STABLOESE', '9001', '4', 'E', '3', '-', '00:00:00,04'),
  line('STABLOESE', '9001', '4', 'E', '4', '', '00:00:00,51'),
]);

/**
 * Knappe Gegenprobe: `AUSRICHTER` steht genau einmal je Datei, seine sechs
 * optionalen Adressfelder lassen sich in `vereinsergebnis.dsv8` deshalb nur
 * gefüllt zeigen. Hier stehen sie leer.
 */
schreibe('vereinsergebnis-knapp.dsv8', [
  line('FORMAT', 'Vereinsergebnisliste', '8'),
  line('ERZEUGER', 'dsv-testdaten', '1.0', 'test@example.org'),
  line('VERANSTALTUNG', 'Knappes Protokoll', 'Musterstadt', '16', 'HALBAUTOMATISCH'),
  line('VERANSTALTER', 'Schwimmverband Musterland'),
  line(
    'AUSRICHTER',
    'SV Nachbarort',
    'Muster, Mia',
    '',
    '',
    '',
    '',
    '',
    '',
    'ausrichter@example.org',
  ),
  line('ABSCHNITT', '1', '15.03.2026', '09:00', 'N'),
  line('WETTKAMPF', '1', 'V', '1', '1', '100', 'F', 'GL', 'W', 'SW', '', ''),
  line('WERTUNG', '1', 'V', '1', 'JG', '0', '9999', '', 'Offene Wertung'),
  line('VEREIN', 'SV Nachbarort', '4321', '11', 'GER'),
]);
