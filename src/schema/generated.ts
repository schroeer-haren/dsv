// Generiert von scripts/generate-types.ts — nicht von Hand ändern.

export interface FormatV7 {
  /**
   * Konstant Wettkampfdefinitionsliste.
   *
   * @see dsv8.md:361
   */
  listart: string;

  /**
   * Versionsnummer des DSV-Standards.
   *
   * @see dsv8.md:363
   */
  version: string;
}

export type FormatV8 = FormatV7;

export interface ErzeugerV7 {
  /**
   * Name der erzeugenden Software.
   *
   * @see dsv8.md:387
   */
  software: string;

  /**
   * Versionskennung der Software.
   *
   * @see dsv8.md:389
   */
  version: string;

  /**
   * E-Mail-Adresse des Software-Herstellers.
   *
   * @see dsv8.md:391
   */
  kontakt: string;
}

export type ErzeugerV8 = ErzeugerV7;

export interface VeranstaltungV7 {
  /**
   * Name der Veranstaltung.
   *
   * @see dsv8.md:421
   */
  veranstaltungsbezeichnung: string;

  /**
   * Ort der Veranstaltung.
   *
   * @see dsv8.md:424
   */
  veranstaltungsort: string;

  /**
   * Bahnlänge des Wettkampfbeckens.
   *
   * - `16` — 16⅔ m
   * - `20` — 20 m
   * - `25` — 25 m
   * - `33` — 33⅓ m
   * - `50` — 50 m
   * - `FW` — Freiwasser
   * - `X` — sonstige Bahnlänge
   *
   * @see dsv8.md:427
   */
  bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X';

  /**
   * Art der Zeitmessung.
   *
   * - `HANDZEIT` — Handzeit
   * - `AUTOMATISCH` — automatische Zeitmessung
   * - `HALBAUTOMATISCH` — halbautomatische Zeitmessung
   *
   * @see dsv8.md:435
   */
  zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH';
}

export type VeranstaltungV8 = VeranstaltungV7;

export interface VeranstaltungsortV7 {
  /**
   * Name der Schwimmhalle.
   *
   * @see dsv8.md:474
   */
  nameSchwimmhalle: string;

  /**
   * Strasse.
   *
   * @see dsv8.md:477
   */
  strasse?: string;

  /**
   * Postleitzahl.
   *
   * @see dsv8.md:479
   */
  plz?: string;

  /**
   * Ort.
   *
   * @see dsv8.md:481
   */
  ort: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:483
   */
  land: string;

  /**
   * Telefonnummer.
   *
   * @see dsv8.md:485
   */
  telefon?: string;

  /**
   * Faxnummer.
   *
   * @see dsv8.md:487
   */
  fax?: string;

  /**
   * E-Mail-Adresse.
   *
   * @see dsv8.md:489
   */
  email?: string;
}

export type VeranstaltungsortV8 = VeranstaltungsortV7;

export interface AusschreibungimnetzV7 {
  /**
   * Internetadresse der Ausschreibung.
   *
   * @see dsv8.md:555
   */
  internetadresse?: string;
}

export type AusschreibungimnetzV8 = AusschreibungimnetzV7;

export interface VeranstalterV7 {
  /**
   * Name des Veranstalters.
   *
   * @see dsv8.md:572
   */
  nameDesVeranstalters: string;
}

export type VeranstalterV8 = VeranstalterV7;

export interface AusrichterV7 {
  /**
   * Name des Ausrichters.
   *
   * @see dsv8.md:591
   */
  nameDesAusrichters: string;

  /**
   * Name und Vorname der Ansprechperson.
   *
   * @see dsv8.md:594
   */
  name: string;

  /**
   * Strasse.
   *
   * @see dsv8.md:596
   */
  strasse?: string;

  /**
   * Postleitzahl.
   *
   * @see dsv8.md:598
   */
  plz?: string;

  /**
   * Ort.
   *
   * @see dsv8.md:600
   */
  ort?: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:602
   */
  land?: string;

  /**
   * Telefonnummer.
   *
   * @see dsv8.md:604
   */
  telefon?: string;

  /**
   * Faxnummer.
   *
   * @see dsv8.md:606
   */
  fax?: string;

  /**
   * E-Mail-Adresse.
   *
   * @see dsv8.md:608
   */
  email: string;
}

export type AusrichterV8 = AusrichterV7;

export interface MeldeadresseV7 {
  /**
   * Name der Meldeadresse.
   *
   * @see dsv8.md:674
   */
  name: string;

  /**
   * Strasse.
   *
   * @see dsv8.md:676
   */
  strasse?: string;

  /**
   * Postleitzahl.
   *
   * @see dsv8.md:678
   */
  plz?: string;

  /**
   * Ort.
   *
   * @see dsv8.md:680
   */
  ort?: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:682
   */
  land?: string;

  /**
   * Telefonnummer.
   *
   * @see dsv8.md:684
   */
  telefon?: string;

  /**
   * Faxnummer.
   *
   * @see dsv8.md:686
   */
  fax?: string;

  /**
   * E-Mail-Adresse.
   *
   * @see dsv8.md:688
   */
  email: string;
}

export type MeldeadresseV8 = MeldeadresseV7;

export interface MeldeschlussV7 {
  /**
   * Datum des Meldeschlusses.
   *
   * @see dsv8.md:748
   */
  datum: string;

  /**
   * Uhrzeit des Meldeschlusses.
   *
   * @see dsv8.md:750
   */
  uhrzeit: string;
}

export type MeldeschlussV8 = MeldeschlussV7;

export interface BankverbindungV7 {
  /**
   * Name der Bank.
   *
   * @see dsv8.md:778
   */
  nameDerBank?: string;

  /**
   * IBAN für die Überweisung der Meldegelder.
   *
   * @see dsv8.md:781
   */
  iban: string;

  /**
   * BIC.
   *
   * @see dsv8.md:783
   */
  bic?: string;
}

export interface BankverbindungV8 {
  /**
   * Name der Bank.
   *
   * @see dsv8.md:778
   */
  nameDerBank?: string;

  /**
   * IBAN für die Überweisung der Meldegelder.
   *
   * @see dsv8.md:781
   */
  iban: string;

  /**
   * BIC.
   *
   * @see dsv8.md:783
   */
  bic?: string;

  /**
   * Name des Kontoinhabers.
   *
   * @see dsv8.md:791
   */
  kontoinhaber: string;
}

export interface LastschriftV7 {
  /**
   * Veranstaltung arbeitet ausschliesslich mit Lastschriftverfahren.
   *
   * - `J` — ja
   * - `N` — nein
   *
   * @see dsv8.md:813
   */
  hinweis?: 'J' | 'N';
}

export type LastschriftV8 = LastschriftV7;

export interface BesonderesV7 {
  /**
   * Besondere Anmerkungen zur Veranstaltung.
   *
   * @see dsv8.md:843
   */
  anmerkungen: string;
}

export type BesonderesV8 = BesonderesV7;

export interface NachweisV7 {
  /**
   * Ab wann Zeiten für den Pflichtzeitennachweis gelten.
   *
   * @see dsv8.md:861
   */
  nachweisVon: string;

  /**
   * Bis wann Zeiten für den Pflichtzeitennachweis gelten.
   *
   * @see dsv8.md:863
   */
  nachweisBis?: string;

  /**
   * Auf welcher Bahnlänge Zeiten berücksichtigt werden.
   *
   * - `25` — nur 25-m-Bahn
   * - `50` — nur 50-m-Bahn
   * - `FW` — Freiwasser
   * - `AL` — alle Bahnlängen
   *
   * @see dsv8.md:865
   */
  bahnlaenge: '25' | '50' | 'FW' | 'AL';
}

export type NachweisV8 = NachweisV7;

export interface AbschnittV7 {
  /**
   * Nummer des Abschnitts, maximal zweistellig.
   *
   * @see dsv8.md:904
   */
  abschnittsnr: string;

  /**
   * Datum, an dem der Abschnitt stattfindet.
   *
   * @see dsv8.md:918
   */
  abschnittsdatum: string;

  /**
   * Uhrzeit des Einlasses.
   *
   * @see dsv8.md:922
   */
  einlass?: string;

  /**
   * Uhrzeit der Kampfrichtersitzung.
   *
   * @see dsv8.md:926
   */
  kampfrichtersitzung?: string;

  /**
   * Uhrzeit, zu der der Abschnitt beginnt.
   *
   * @see dsv8.md:928
   */
  anfangszeit: string;

  /**
   * J, wenn die Zeiten relativ zum Ende des Vorabschnitts zu verstehen sind.
   *
   * - `J` — relative Angabe
   * - `N` — echte Uhrzeit
   *
   * @see dsv8.md:932
   */
  relativeAngabe?: 'J' | 'N';
}

export type AbschnittV8 = AbschnittV7;

export interface WettkampfV7 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:979
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   * - `N` — Nachschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:981
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts, in dem der Wettkampf stattfindet.
   *
   * @see dsv8.md:997
   */
  abschnittsnr: string;

  /**
   * Anzahl der Starter; bei Staffeln die Zahl der Teilnehmenden.
   *
   * @see dsv8.md:999
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern, 1 bis 25000, oder 0 für sonstige.
   *
   * @see dsv8.md:1001
   */
  einzelstrecke: string;

  /**
   * Schwimmart.
   *
   * - `F` — Freistil
   * - `R` — Rücken
   * - `B` — Brust
   * - `S` — Schmetterling
   * - `L` — Lagen
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:1029
   */
  technik: 'F' | 'R' | 'B' | 'S' | 'L' | 'X';

  /**
   * Art der Ausübung.
   *
   * - `GL` — ganze Lage
   * - `BE` — Beine
   * - `AR` — Arme
   * - `ST` — Start
   * - `WE` — Wende
   * - `GB` — Gleitübung
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:1037
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'X';

  /**
   * Geschlecht der Teilnehmenden.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:1062
   */
  geschlecht: 'M' | 'W' | 'X';

  /**
   * Zuordnung für Bestenlistenauswertungen.
   *
   * - `SW` — Schwimmen für Jugend und offene Klasse
   * - `EW` — vereinfachter Wettkampf
   * - `PA` — Wettkämpfe für Para-Schwimmer
   * - `MS` — Schwimmen der Masters
   * - `KG` — reiner kindgerechter Wettkampf
   * - `XX` — Andere
   *
   * @see dsv8.md:1075
   */
  zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX';

  /**
   * Nummer des qualifizierenden Vor- oder Zwischenlaufs.
   *
   * @see dsv8.md:1081
   */
  qualifikationswettkampfnr?: string;

  /**
   * Art des qualifizierenden Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   * - `N` — Nachschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:1119
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';
}

export interface WettkampfV8 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:979
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   * - `N` — Nachschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:981
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts, in dem der Wettkampf stattfindet.
   *
   * @see dsv8.md:997
   */
  abschnittsnr: string;

  /**
   * Anzahl der Starter; bei Staffeln die Zahl der Teilnehmenden.
   *
   * @see dsv8.md:999
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern, 1 bis 25000, oder 0 für sonstige.
   *
   * @see dsv8.md:1001
   */
  einzelstrecke: string;

  /**
   * Schwimmart.
   *
   * - `F` — Freistil
   * - `R` — Rücken
   * - `B` — Brust
   * - `S` — Schmetterling
   * - `L` — Lagen
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:1029
   */
  technik: 'F' | 'R' | 'B' | 'S' | 'L' | 'X';

  /**
   * Art der Ausübung.
   *
   * - `GL` — ganze Lage
   * - `BE` — Beine
   * - `AR` — Arme
   * - `ST` — Start
   * - `WE` — Wende
   * - `GB` — Gleitübung
   * - `KB` — Kicks Bauchlage, nur bei Technik S
   * - `KR` — Kicks Rückenlage, nur bei Technik S
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:1037
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR' | 'X';

  /**
   * Geschlecht der Teilnehmenden.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:1062
   */
  geschlecht: 'M' | 'W' | 'D' | 'X';

  /**
   * Zuordnung für Bestenlistenauswertungen.
   *
   * - `SW` — Schwimmen für Jugend und offene Klasse
   * - `EW` — vereinfachter Wettkampf
   * - `PA` — Wettkämpfe für Para-Schwimmer
   * - `MS` — Schwimmen der Masters
   * - `KG` — reiner kindgerechter Wettkampf
   * - `XX` — Andere
   *
   * @see dsv8.md:1075
   */
  zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX';

  /**
   * Nummer des qualifizierenden Vor- oder Zwischenlaufs.
   *
   * @see dsv8.md:1081
   */
  qualifikationswettkampfnr?: string;

  /**
   * Art des qualifizierenden Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   * - `N` — Nachschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:1119
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';
}

export interface WertungV7 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:1151
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   * - `N` — Nachschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:1153
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Veranstaltungsweit eindeutige Kennung der Wertung.
   *
   * @see dsv8.md:1161
   */
  wertungsId: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:1165
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.
   *
   * @see dsv8.md:1171
   */
  mindestJgAk: string;

  /**
   * Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Mindestwert.
   *
   * @see dsv8.md:1174
   */
  maximalJgAk?: string;

  /**
   * Geschlecht der Wertung; ohne Angabe gilt das Geschlecht des Wettkampfes.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `X` — mixed
   * - `D` — divers
   *
   * @see dsv8.md:1220
   */
  geschlecht?: 'M' | 'W' | 'X' | 'D';

  /**
   * Textliche Bezeichnung der Wertung.
   *
   * @see dsv8.md:1236
   */
  wertungsname: string;
}

export type WertungV8 = WertungV7;

export interface PflichtzeitV7 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:1258
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   * - `N` — Nachschwimmen (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:1260
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:1281
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.
   *
   * @see dsv8.md:1287
   */
  mindestJgAk: string;

  /**
   * Grösster Jahrgang oder kleinste Altersklasse.
   *
   * @see dsv8.md:1290
   */
  maximalJgAk?: string;

  /**
   * Zu erfüllende Pflichtzeit.
   *
   * @see dsv8.md:1321
   */
  pflichtzeit: string;

  /**
   * Geschlecht, für das die Pflichtzeit gilt.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:1323
   */
  geschlecht?: 'M' | 'W' | 'D';
}

export type PflichtzeitV8 = PflichtzeitV7;

export interface MeldegeldV7 {
  /**
   * Art des Meldegeldes.
   *
   * - `Meldegeldpauschale` — pauschal je Verein
   * - `Einzelmeldegeld` — je Einzelwettkampf
   * - `Staffelmeldegeld` — je Staffelwettkampf
   * - `Wkmeldegeld` — je einzelnem Wettkampf, hat Vorrang
   * - `Mannschaftmeldegeld` — für Mannschaftswettkämpfe
   *
   * @see dsv8.md:1360
   */
  meldegeldTyp:
    | 'Meldegeldpauschale'
    | 'Einzelmeldegeld'
    | 'Staffelmeldegeld'
    | 'Wkmeldegeld'
    | 'Mannschaftmeldegeld';

  /**
   * Betrag des Meldegeldes.
   *
   * @see dsv8.md:1382
   */
  betrag: string;

  /**
   * Nummer des Wettkampfes; Pflicht bei Typ Wkmeldegeld.
   *
   * @see dsv8.md:1389
   */
  wettkampfnr?: string;
}

export interface MeldegeldV8 {
  /**
   * Art des Meldegeldes.
   *
   * - `Meldegeldpauschale` — pauschal je Verein
   * - `Einzelmeldegeld` — je Einzelwettkampf
   * - `Staffelmeldegeld` — je Staffelwettkampf
   * - `Wkmeldegeld` — je einzelnem Wettkampf, hat Vorrang
   * - `Mannschaftmeldegeld` — für Mannschaftswettkämpfe
   * - `Teilnehmermeldegeld` — pauschal je Teilnehmer mit Einzelmeldung
   * - `Abschnittspauschale` — pauschal je Verein und gemeldetem Abschnitt
   *
   * @see dsv8.md:1360
   */
  meldegeldTyp:
    | 'Meldegeldpauschale'
    | 'Einzelmeldegeld'
    | 'Staffelmeldegeld'
    | 'Wkmeldegeld'
    | 'Mannschaftmeldegeld'
    | 'Teilnehmermeldegeld'
    | 'Abschnittspauschale';

  /**
   * Betrag des Meldegeldes.
   *
   * @see dsv8.md:1382
   */
  betrag: string;

  /**
   * Nummer des Wettkampfes; Pflicht bei Typ Wkmeldegeld.
   *
   * @see dsv8.md:1389
   */
  wettkampfnr?: string;
}

export type DateiendeV7 = Record<string, never>;

export type DateiendeV8 = DateiendeV7;
