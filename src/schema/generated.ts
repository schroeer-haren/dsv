// Generiert von scripts/generate-types.ts — nicht von Hand ändern.

// Wettkampfdefinitionsliste

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
   * Nummer des Abschnitts, in dem der Wettkampf stattfindet, maximal zweistellig.
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
   * Nummer des Abschnitts, in dem der Wettkampf stattfindet, maximal zweistellig.
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
   * Nummer des Wettkampfes, maximal dreistellig.
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
   * Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.
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
   * Nummer des Wettkampfes, maximal dreistellig.
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
   * Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.
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
   * - `Meldegeldpauschale` — pauschaler Betrag; in DSV7 je Meldung, ab DSV8 je Verein
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
   * Nummer des Wettkampfes, maximal dreistellig; Pflicht bei Typ Wkmeldegeld.
   *
   * @see dsv8.md:1389
   */
  wettkampfnr?: string;
}

export interface MeldegeldV8 {
  /**
   * Art des Meldegeldes.
   *
   * - `Meldegeldpauschale` — pauschaler Betrag; in DSV7 je Meldung, ab DSV8 je Verein
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
   * Nummer des Wettkampfes, maximal dreistellig; Pflicht bei Typ Wkmeldegeld.
   *
   * @see dsv8.md:1389
   */
  wettkampfnr?: string;
}

export type DateiendeV7 = Record<string, never>;

export type DateiendeV8 = DateiendeV7;

// Wettkampfergebnisliste

export interface ErgebnisFormatV7 {
  /**
   * Konstant Wettkampfergebnisliste.
   *
   * @see dsv8.md:4330
   */
  listart: string;

  /**
   * Versionsnummer des DSV-Standards.
   *
   * @see dsv8.md:4332
   */
  version: string;
}

export type ErgebnisFormatV8 = ErgebnisFormatV7;

export interface ErgebnisErzeugerV7 {
  /**
   * Name der erzeugenden Software.
   *
   * @see dsv8.md:4354
   */
  software: string;

  /**
   * Versionskennung der Software.
   *
   * @see dsv8.md:4356
   */
  version: string;

  /**
   * E-Mail-Adresse des Software-Herstellers.
   *
   * @see dsv8.md:4358
   */
  kontakt: string;
}

export type ErgebnisErzeugerV8 = ErgebnisErzeugerV7;

export interface ErgebnisVeranstaltungV7 {
  /**
   * Name der Veranstaltung.
   *
   * @see dsv8.md:4388
   */
  veranstaltungsbezeichnung: string;

  /**
   * Ort der Veranstaltung.
   *
   * @see dsv8.md:4391
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
   * @see dsv8.md:4394
   */
  bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X';

  /**
   * Art der Zeitmessung.
   *
   * - `HANDZEIT` — Handzeit
   * - `AUTOMATISCH` — automatische Zeitmessung
   * - `HALBAUTOMATISCH` — halbautomatische Zeitmessung
   *
   * @see dsv8.md:4402
   */
  zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH';
}

export type ErgebnisVeranstaltungV8 = ErgebnisVeranstaltungV7;

export interface ErgebnisVeranstalterV7 {
  /**
   * Name des Veranstalters.
   *
   * @see dsv8.md:4440
   */
  nameDesVeranstalters: string;
}

export type ErgebnisVeranstalterV8 = ErgebnisVeranstalterV7;

export interface ErgebnisAusrichterV7 {
  /**
   * Name des Ausrichters.
   *
   * @see dsv8.md:4465
   */
  nameDesAusrichters: string;

  /**
   * Name und Vorname der Ansprechperson.
   *
   * @see dsv8.md:4468
   */
  name: string;

  /**
   * Strasse.
   *
   * @see dsv8.md:4470
   */
  strasse?: string;

  /**
   * Postleitzahl.
   *
   * @see dsv8.md:4472
   */
  plz?: string;

  /**
   * Ort.
   *
   * @see dsv8.md:4474
   */
  ort?: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:4476
   */
  land?: string;

  /**
   * Telefonnummer.
   *
   * @see dsv8.md:4478
   */
  telefon?: string;

  /**
   * Faxnummer.
   *
   * @see dsv8.md:4480
   */
  fax?: string;

  /**
   * E-Mail-Adresse.
   *
   * @see dsv8.md:4482
   */
  email: string;
}

export type ErgebnisAusrichterV8 = ErgebnisAusrichterV7;

export interface ErgebnisAbschnittV7 {
  /**
   * Nummer des Abschnitts, maximal zweistellig.
   *
   * @see dsv8.md:4547
   */
  abschnittsnr: string;

  /**
   * Datum, an dem der Abschnitt stattfindet.
   *
   * @see dsv8.md:4551
   */
  abschnittsdatum: string;

  /**
   * Uhrzeit, zu der der Abschnitt beginnt.
   *
   * @see dsv8.md:4556
   */
  anfangszeit: string;

  /**
   * J, wenn die Zeit relativ zum Ende des Vorabschnitts zu verstehen ist.
   *
   * - `J` — relative Angabe
   * - `N` — echte Uhrzeit
   *
   * @see dsv8.md:4560
   */
  relativeAngabe?: 'J' | 'N';
}

export type ErgebnisAbschnittV8 = ErgebnisAbschnittV7;

export interface ErgebnisKampfgerichtV7 {
  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:4595
   */
  abschnittsnr: string;

  /**
   * Funktion im Kampfgericht.
   *
   * - `SCH` — Schiedsrichter*in
   * - `STA` — Starter*in
   * - `ZRO` — Zielrichterobmann
   * - `ZR` — Zielrichter*in
   * - `ZNO` — Zeitnehmerobmann
   * - `ZN` — Zeitnehmer*in
   * - `RZN` — Reservezeitnehmer*in
   * - `SR` — Schwimmrichter*in
   * - `WRO` — Wenderichterobmann
   * - `WR` — Wenderichter*in
   * - `AUS` — Auswerter*in
   * - `SP` — Sprecher*in
   * - `PKF` — Protokollführer*in
   * - `STO` — Startordner*in
   * - `WKH` — Wettkampfhelfer*in
   * - `ASCH` — Assistenz-Schiedsrichter*in
   * - `SIB` — Sicherheitsbeauftragte*r
   * - `SAUF` — Streckenaufsicht
   * - `VER` — Ordner Versorgungsstelle
   * - `ZBV` — sonstige Kampfrichter
   * - `SPR` — Sprecher*in; die Werteliste der Spezifikation (dsv8.md:4611–4655) kennt nur SP, ihr eigenes Beispiel (dsv8.md:5852) und eine echte Datei schreiben aber SPR — beim Lesen Warnung, beim Schreiben unzulässig (laut Spezifikation nicht für diese Listenart vorgesehen, wird beim Lesen toleriert)
   *
   * @see dsv8.md:4597
   */
  position:
    | 'SCH'
    | 'STA'
    | 'ZRO'
    | 'ZR'
    | 'ZNO'
    | 'ZN'
    | 'RZN'
    | 'SR'
    | 'WRO'
    | 'WR'
    | 'AUS'
    | 'SP'
    | 'PKF'
    | 'STO'
    | 'WKH'
    | 'ASCH'
    | 'SIB'
    | 'SAUF'
    | 'VER'
    | 'ZBV'
    | 'SPR';

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:4661
   */
  nameKampfrichter: string;

  /**
   * Verein der Kampfrichterin oder des Kampfrichters.
   *
   * @see dsv8.md:4664
   */
  vereinDesKampfrichters: string;
}

export type ErgebnisKampfgerichtV8 = ErgebnisKampfgerichtV7;

export interface ErgebnisWettkampfV7 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:4689
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:4691
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:4703
   */
  abschnittsnr: string;

  /**
   * Anzahl der Starter; bei Staffeln die Zahl der Teilnehmenden.
   *
   * @see dsv8.md:4705
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern, 1 bis 25000, oder 0 für sonstige.
   *
   * @see dsv8.md:4707
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
   * @see dsv8.md:4715
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
   * @see dsv8.md:4727
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'X';

  /**
   * Geschlecht der Teilnehmenden.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:4771
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
   * @see dsv8.md:4784
   */
  zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX';

  /**
   * Nummer des qualifizierenden Vor- oder Zwischenlaufs.
   *
   * @see dsv8.md:4788
   */
  qualifikationswettkampfnr?: string;

  /**
   * Art des qualifizierenden Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   *
   * @see dsv8.md:4826
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E';
}

export interface ErgebnisWettkampfV8 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:4689
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:4691
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:4703
   */
  abschnittsnr: string;

  /**
   * Anzahl der Starter; bei Staffeln die Zahl der Teilnehmenden.
   *
   * @see dsv8.md:4705
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern, 1 bis 25000, oder 0 für sonstige.
   *
   * @see dsv8.md:4707
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
   * @see dsv8.md:4715
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
   * @see dsv8.md:4727
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
   * @see dsv8.md:4771
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
   * @see dsv8.md:4784
   */
  zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX';

  /**
   * Nummer des qualifizierenden Vor- oder Zwischenlaufs.
   *
   * @see dsv8.md:4788
   */
  qualifikationswettkampfnr?: string;

  /**
   * Art des qualifizierenden Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   *
   * @see dsv8.md:4826
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E';
}

export interface ErgebnisWertungV7 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:4855
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:4857
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Veranstaltungsweit eindeutige Kennung der Wertung.
   *
   * @see dsv8.md:4873
   */
  wertungsId: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:4877
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.
   *
   * @see dsv8.md:4883
   */
  mindestJgAk: string;

  /**
   * Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.
   *
   * @see dsv8.md:4886
   */
  maximalJgAk?: string;

  /**
   * Geschlecht der Wertung; ohne Angabe gilt das Geschlecht des Wettkampfes.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `X` — mixed
   *
   * @see dsv8.md:4901
   */
  geschlecht?: 'M' | 'W' | 'X';

  /**
   * Textliche Bezeichnung der Wertung.
   *
   * @see dsv8.md:4907
   */
  wertungsname: string;
}

export interface ErgebnisWertungV8 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:4855
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:4857
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Veranstaltungsweit eindeutige Kennung der Wertung.
   *
   * @see dsv8.md:4873
   */
  wertungsId: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:4877
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Kleinster Jahrgang oder grösste Altersklasse; 0 für die offene Klasse.
   *
   * @see dsv8.md:4883
   */
  mindestJgAk: string;

  /**
   * Grösster Jahrgang oder kleinste Altersklasse; ohne Angabe gilt der Wert von mindestJgAk.
   *
   * @see dsv8.md:4886
   */
  maximalJgAk?: string;

  /**
   * Geschlecht der Wertung; ohne Angabe gilt das Geschlecht des Wettkampfes.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   * - `X` — mixed
   *
   * @see dsv8.md:4901
   */
  geschlecht?: 'M' | 'W' | 'D' | 'X';

  /**
   * Textliche Bezeichnung der Wertung.
   *
   * @see dsv8.md:4907
   */
  wertungsname: string;
}

export interface ErgebnisVereinV7 {
  /**
   * Name des Vereins.
   *
   * @see dsv8.md:4958
   */
  vereinsbezeichnung: string;

  /**
   * Vierstellige Vereinskennzahl; 0 bei nicht dem DSV angehörenden Vereinen.
   *
   * @see dsv8.md:4960
   */
  vereinskennzahl: string;

  /**
   * Kennzahl des Landesschwimmverbands; 0 bei ausländischen Vereinen, 99 bei Auswahlmannschaften.
   *
   * @see dsv8.md:4966
   */
  landesschwimmverband: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:4994
   */
  nationenkuerzel: string;
}

export type ErgebnisVereinV8 = ErgebnisVereinV7;

export interface ErgebnisPnergebnisV7 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5026
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5028
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Kennung der Wertung.
   *
   * @see dsv8.md:5044
   */
  wertungsId: string;

  /**
   * Erreichte Platzierung; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.
   *
   * @see dsv8.md:5046
   */
  platz: string;

  /**
   * Grund, warum das Ergebnis nicht gewertet wird.
   *
   * - `DS` — Disqualifikation
   * - `NA` — nicht am Start
   * - `AB` — vom Wettkampf abgemeldet
   * - `AU` — aufgegeben
   * - `ZU` — Zeitüberschreitung, nur bei Langstrecken
   *
   * @see dsv8.md:5052
   */
  grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU';

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:5056
   */
  name: string;

  /**
   * Sechsstellige DSV-ID; 0 wenn unbekannt.
   *
   * @see dsv8.md:5058
   */
  dsvId: string;

  /**
   * Veranstaltungsweit eindeutige Kennung der Person.
   *
   * @see dsv8.md:5064
   */
  veranstaltungsId: string;

  /**
   * Geschlecht der Person.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:5119
   */
  geschlecht: 'M' | 'W' | 'D';

  /**
   * Vierstelliger Jahrgang.
   *
   * @see dsv8.md:5122
   */
  jahrgang: string;

  /**
   * Altersklasse. Die Spezifikation liefert für dieses Feld keine Beschreibung; Datentyp und Pflichtangabe sind aus der Spaltenreihenfolge rekonstruiert. In den 72 echten Ergebnislisten ist es in 9982 von 95756 Zeilen gesetzt (51 der 72 Dateien).
   *
   * @see dsv8.md:5124
   */
  altersklasse?: string;

  /**
   * Name des Vereins.
   *
   * @see dsv8.md:5126
   */
  verein: string;

  /**
   * Vereinskennzahl; 0 bei nicht dem DSV angehörenden Vereinen.
   *
   * @see dsv8.md:5128
   */
  vereinskennzahl: string;

  /**
   * Erreichte Endzeit; bei Nichtwertung 00:00:00,00.
   *
   * @see dsv8.md:5130
   */
  endzeit: string;

  /**
   * Erläuterung zur Disqualifikation.
   *
   * @see dsv8.md:5132
   */
  disqualifikationsbemerkung?: string;

  /**
   * Kennzeichen zum erhöhten nachträglichen Meldegeld.
   *
   * - `E` — Norm erreicht
   * - `F` — erhöhtes Meldegeld fällig
   * - `N` — Norm nicht erreicht, aber nachgewiesen
   *
   * @see dsv8.md:5136
   */
  erhoehtesNachtraeglichesMeldegeld?: 'E' | 'F' | 'N';

  /**
   * WA-Nationenkürzel; leer wenn unbekannt.
   *
   * @see dsv8.md:5202
   */
  nationalitaet1?: string;

  /**
   * Zweite Staatsangehörigkeit.
   *
   * @see dsv8.md:5208
   */
  nationalitaet2?: string;

  /**
   * Dritte Staatsangehörigkeit.
   *
   * @see dsv8.md:5210
   */
  nationalitaet3?: string;
}

export type ErgebnisPnergebnisV8 = ErgebnisPnergebnisV7;

export interface ErgebnisPnzwischenzeitV7 {
  /**
   * Kennung der Person, definiert in PNERGEBNIS.
   *
   * @see dsv8.md:5245
   */
  veranstaltungsId: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5250
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5254
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Zurückgelegte Strecke in Metern.
   *
   * @see dsv8.md:5258
   */
  distanz: string;

  /**
   * Zwischenzeit bei dieser Distanz.
   *
   * @see dsv8.md:5260
   */
  zwischenzeit: string;
}

export type ErgebnisPnzwischenzeitV8 = ErgebnisPnzwischenzeitV7;

export interface ErgebnisPnreaktionV7 {
  /**
   * Kennung der Person, definiert in PNERGEBNIS.
   *
   * @see dsv8.md:5306
   */
  veranstaltungsId: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5311
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5315
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Vorzeichen der Reaktionszeit.
   *
   * - `+` — Start nach dem Startsignal
   * - `-` — Start vor dem Startsignal
   *
   * @see dsv8.md:5341
   */
  art?: '+' | '-';

  /**
   * Gemessene Reaktionszeit.
   *
   * @see dsv8.md:5355
   */
  reaktionszeit: string;
}

export type ErgebnisPnreaktionV8 = ErgebnisPnreaktionV7;

export interface ErgebnisStergebnisV7 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5377
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5379
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Kennung der Wertung.
   *
   * @see dsv8.md:5395
   */
  wertungsId: string;

  /**
   * Erreichte Platzierung; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.
   *
   * @see dsv8.md:5397
   */
  platz: string;

  /**
   * Grund, warum das Ergebnis nicht gewertet wird.
   *
   * - `DS` — Disqualifikation
   * - `NA` — nicht am Start
   * - `AB` — vom Wettkampf abgemeldet
   * - `AU` — aufgegeben
   * - `ZU` — Zeitüberschreitung, nur bei Langstrecken
   *
   * @see dsv8.md:5403
   */
  grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU';

  /**
   * Laufende Nummer der Mannschaft des Vereins.
   *
   * @see dsv8.md:5407
   */
  nummerDerMannschaft: string;

  /**
   * Veranstaltungsweit eindeutige Kennung der Staffel.
   *
   * @see dsv8.md:5411
   */
  veranstaltungsId: string;

  /**
   * Name des Vereins.
   *
   * @see dsv8.md:5414
   */
  verein: string;

  /**
   * Vereinskennzahl; 0 bei nicht dem DSV angehörenden Vereinen.
   *
   * @see dsv8.md:5416
   */
  vereinskennzahl: string;

  /**
   * Erreichte Endzeit; bei Nichtwertung 00:00:00,00.
   *
   * @see dsv8.md:5418
   */
  endzeit: string;

  /**
   * Startnummer der disqualifizierten Person innerhalb der Staffel.
   *
   * @see dsv8.md:5420
   */
  startnummerDisqualifiziert?: string;

  /**
   * Erläuterung zur Disqualifikation.
   *
   * @see dsv8.md:5435
   */
  disqualifikationsbemerkung?: string;

  /**
   * Kennzeichen zum erhöhten nachträglichen Meldegeld.
   *
   * - `E` — Norm erreicht
   * - `F` — erhöhtes Meldegeld fällig
   * - `N` — Norm nicht erreicht, aber nachgewiesen
   *
   * @see dsv8.md:5437
   */
  erhoehtesNachtraeglichesMeldegeld?: 'E' | 'F' | 'N';
}

export type ErgebnisStergebnisV8 = ErgebnisStergebnisV7;

export interface ErgebnisStaffelpersonV7 {
  /**
   * Kennung der Staffel, definiert in STERGEBNIS.
   *
   * @see dsv8.md:5576
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5581
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5585
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:5595
   */
  name: string;

  /**
   * Sechsstellige DSV-ID; 0 wenn unbekannt.
   *
   * @see dsv8.md:5597
   */
  dsvId: string;

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:5600
   */
  startnummer: string;

  /**
   * Geschlecht der Person.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:5605
   */
  geschlecht: 'M' | 'W' | 'D';

  /**
   * Vierstelliger Jahrgang.
   *
   * @see dsv8.md:5620
   */
  jahrgang: string;

  /**
   * Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.
   *
   * @see dsv8.md:5622
   */
  altersklasse?: string;

  /**
   * WA-Nationenkürzel.
   *
   * @see dsv8.md:5624
   */
  nationalitaet1?: string;

  /**
   * Zweite Staatsangehörigkeit.
   *
   * @see dsv8.md:5632
   */
  nationalitaet2?: string;

  /**
   * Dritte Staatsangehörigkeit.
   *
   * @see dsv8.md:5636
   */
  nationalitaet3?: string;
}

export type ErgebnisStaffelpersonV8 = ErgebnisStaffelpersonV7;

export interface ErgebnisStzwischenzeitV7 {
  /**
   * Kennung der Staffel.
   *
   * @see dsv8.md:5678
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5683
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5687
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:5693
   */
  startnummer: string;

  /**
   * Zurückgelegte Strecke in Metern.
   *
   * @see dsv8.md:5698
   */
  distanz: string;

  /**
   * Zwischenzeit bei dieser Distanz.
   *
   * @see dsv8.md:5700
   */
  zwischenzeit: string;
}

export type ErgebnisStzwischenzeitV8 = ErgebnisStzwischenzeitV7;

export interface ErgebnisStabloeseV7 {
  /**
   * Kennung der Staffel.
   *
   * @see dsv8.md:5751
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:5756
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:5760
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:5786
   */
  startnummer: string;

  /**
   * Vorzeichen der Ablösezeit.
   *
   * - `+` — positive Zeit
   * - `-` — negative Zeit
   *
   * @see dsv8.md:5798
   */
  art?: '+' | '-';

  /**
   * Gemessene Ablösezeit.
   *
   * @see dsv8.md:5812
   */
  reaktionszeit: string;
}

export type ErgebnisStabloeseV8 = ErgebnisStabloeseV7;

export type ErgebnisDateiendeV7 = Record<string, never>;

export type ErgebnisDateiendeV8 = ErgebnisDateiendeV7;

// Vereinsmeldeliste

export interface MeldungFormatV7 {
  /**
   * Konstant Vereinsmeldeliste.
   *
   * @see dsv8.md:1530
   */
  listart: string;

  /**
   * Versionsnummer des DSV-Standards.
   *
   * @see dsv8.md:1532
   */
  version: string;
}

export type MeldungFormatV8 = MeldungFormatV7;

export interface MeldungErzeugerV7 {
  /**
   * Name der erzeugenden Software.
   *
   * @see dsv8.md:1554
   */
  software: string;

  /**
   * Versionskennung der Software.
   *
   * @see dsv8.md:1556
   */
  version: string;

  /**
   * E-Mail-Adresse des Software-Herstellers.
   *
   * @see dsv8.md:1558
   */
  kontakt: string;
}

export type MeldungErzeugerV8 = MeldungErzeugerV7;

export interface MeldungVeranstaltungV7 {
  /**
   * Name der Veranstaltung.
   *
   * @see dsv8.md:1588
   */
  veranstaltungsbezeichnung: string;

  /**
   * Ort der Veranstaltung.
   *
   * @see dsv8.md:1591
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
   * @see dsv8.md:1594
   */
  bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X';

  /**
   * Art der Zeitmessung.
   *
   * - `HANDZEIT` — Handzeit
   * - `AUTOMATISCH` — automatische Zeitmessung
   * - `HALBAUTOMATISCH` — halbautomatische Zeitmessung
   *
   * @see dsv8.md:1602
   */
  zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH';
}

export type MeldungVeranstaltungV8 = MeldungVeranstaltungV7;

export interface MeldungAbschnittV7 {
  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:1641
   */
  abschnittsnr: string;

  /**
   * Datum des Abschnitts.
   *
   * @see dsv8.md:1645
   */
  abschnittsdatum: string;

  /**
   * Beginn des Abschnitts.
   *
   * @see dsv8.md:1650
   */
  anfangszeit: string;

  /**
   * Ob die Zeitangabe relativ zum Abschnittsbeginn zu lesen ist.
   *
   * - `J` — relative Angabe
   * - `N` — echte Uhrzeit
   *
   * @see dsv8.md:1654
   */
  relativeAngabe?: 'J' | 'N';
}

export type MeldungAbschnittV8 = MeldungAbschnittV7;

export interface MeldungWettkampfV7 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:1693
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
   * @see dsv8.md:1695
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts, in dem der Wettkampf stattfindet.
   *
   * @see dsv8.md:1697
   */
  abschnittsnr: string;

  /**
   * Anzahl der Staffelteilnehmer; für Einzeldisziplinen 1.
   *
   * @see dsv8.md:1699
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern; 0 steht für sonstige Strecken.
   *
   * @see dsv8.md:1701
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
   * @see dsv8.md:1741
   */
  technik: 'F' | 'R' | 'B' | 'S' | 'L' | 'X';

  /**
   * Ausübung der Schwimmart.
   *
   * - `GL` — Gleichgültig
   * - `BE` — Beine
   * - `AR` — Arme
   * - `ST` — Start
   * - `WE` — Wende
   * - `GB` — Gleitübung Beine
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:1749
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'X';

  /**
   * Geschlecht der Startberechtigten.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:1779
   */
  geschlecht: 'M' | 'W' | 'X';

  /**
   * Nummer des qualifizierenden Wettkampfes.
   *
   * @see dsv8.md:1793
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
   * @see dsv8.md:1796
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';
}

export interface MeldungWettkampfV8 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:1693
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
   * @see dsv8.md:1695
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts, in dem der Wettkampf stattfindet.
   *
   * @see dsv8.md:1697
   */
  abschnittsnr: string;

  /**
   * Anzahl der Staffelteilnehmer; für Einzeldisziplinen 1.
   *
   * @see dsv8.md:1699
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern; 0 steht für sonstige Strecken.
   *
   * @see dsv8.md:1701
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
   * @see dsv8.md:1741
   */
  technik: 'F' | 'R' | 'B' | 'S' | 'L' | 'X';

  /**
   * Ausübung der Schwimmart.
   *
   * - `GL` — Gleichgültig
   * - `BE` — Beine
   * - `AR` — Arme
   * - `ST` — Start
   * - `WE` — Wende
   * - `GB` — Gleitübung Beine
   * - `KB` — Kicks auf dem Bauch
   * - `KR` — Kicks auf dem Rücken
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:1749
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR' | 'X';

  /**
   * Geschlecht der Startberechtigten.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:1779
   */
  geschlecht: 'M' | 'W' | 'D' | 'X';

  /**
   * Nummer des qualifizierenden Wettkampfes.
   *
   * @see dsv8.md:1793
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
   * @see dsv8.md:1796
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';
}

export interface MeldungVereinV7 {
  /**
   * Name des Vereins.
   *
   * @see dsv8.md:1838
   */
  vereinsbezeichnung: string;

  /**
   * Kennzahl des Vereins.
   *
   * @see dsv8.md:1840
   */
  vereinskennzahl: string;

  /**
   * Kennzahl des Landesschwimmverbandes.
   *
   * @see dsv8.md:1846
   */
  landesschwimmverband: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:1857
   */
  nationenkuerzel: string;
}

export interface MeldungVereinV8 {
  /**
   * Name des Vereins.
   *
   * @see dsv8.md:1838
   */
  vereinsbezeichnung: string;

  /**
   * Kennzahl des Vereins.
   *
   * @see dsv8.md:1840
   */
  vereinskennzahl: string;

  /**
   * Kennzahl des Landesschwimmverbandes.
   *
   * @see dsv8.md:1846
   */
  landesschwimmverband: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:1857
   */
  nationenkuerzel: string;

  /**
   * Ob das Meldegeld per Lastschrift eingezogen werden darf.
   *
   * - `J` — ja
   * - `N` — nein
   *
   * @see dsv8.md:1863
   */
  lastschrift?: 'J' | 'N';
}

export interface MeldungAnsprechpartnerV7 {
  /**
   * Name und Vorname der Ansprechperson.
   *
   * @see dsv8.md:1903
   */
  name: string;

  /**
   * Strasse.
   *
   * @see dsv8.md:1905
   */
  strasse?: string;

  /**
   * Postleitzahl.
   *
   * @see dsv8.md:1907
   */
  plz?: string;

  /**
   * Ort.
   *
   * @see dsv8.md:1909
   */
  ort?: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:1911
   */
  land?: string;

  /**
   * Telefonnummer.
   *
   * @see dsv8.md:1913
   */
  telefon?: string;

  /**
   * Faxnummer.
   *
   * @see dsv8.md:1915
   */
  fax?: string;

  /**
   * E-Mail-Adresse.
   *
   * @see dsv8.md:1917
   */
  email: string;
}

export type MeldungAnsprechpartnerV8 = MeldungAnsprechpartnerV7;

export interface MeldungKarimeldungV7 {
  /**
   * Laufende Nummer innerhalb dieser Meldung.
   *
   * @see dsv8.md:1977
   */
  nummerKampfrichter: string;

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:1980
   */
  name: string;

  /**
   * Gruppe, für die gemeldet wird.
   *
   * - `WKR` — Wettkampfrichter*in
   * - `AUS` — Auswerter*in
   * - `SCH` — Schiedsrichter*in
   * - `SPR` — Sprecher*in
   *
   * @see dsv8.md:1982
   */
  kampfrichtergruppe: 'WKR' | 'AUS' | 'SCH' | 'SPR';
}

export interface MeldungKarimeldungV8 {
  /**
   * Laufende Nummer innerhalb dieser Meldung.
   *
   * @see dsv8.md:1977
   */
  nummerKampfrichter: string;

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:1980
   */
  name: string;

  /**
   * Gruppe, für die gemeldet wird.
   *
   * - `WKR` — Wettkampfrichter*in
   * - `AUS` — Auswerter*in
   * - `SCH` — Schiedsrichter*in
   * - `SPR` — Sprecher*in
   *
   * @see dsv8.md:1982
   */
  kampfrichtergruppe: 'WKR' | 'AUS' | 'SCH' | 'SPR';

  /**
   * Geschlecht.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:2018
   */
  geschlecht?: 'M' | 'W' | 'D';
}

export interface MeldungKariabschnittV7 {
  /**
   * Nummer der Kampfrichtermeldung, auf die sich der Abschnitt bezieht.
   *
   * @see dsv8.md:2055
   */
  nummerKampfrichter: string;

  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:2060
   */
  abschnittsnummer: string;

  /**
   * Gewünschte Position im Kampfgericht.
   *
   * - `SCH` — Schiedsrichter*in
   * - `STA` — Starter*in
   * - `ZRO` — Zeitnehmer-Obmann/-frau
   * - `ZR` — Zeitnehmer*in
   * - `ZNO` — Zielrichter-Obmann/-frau
   * - `ZN` — Zielrichter*in
   * - `RZN` — Richter*in für Zielankunft
   * - `SR` — Schwimmrichter*in
   * - `WRO` — Wenderichter-Obmann/-frau
   * - `WR` — Wenderichter*in
   * - `AUS` — Auswerter*in
   * - `SP` — Sprecher*in
   * - `PKF` — Protokollkampfrichter*in
   * - `STO` — Startordner*in
   * - `ASCH` — Assistenz Schiedsrichter*in
   * - `SIB` — Sicherheitsbeauftragte*r
   * - `SAUF` — Schwimmaufsicht
   * - `VER` — Verpflegung
   *
   * @see dsv8.md:2062
   */
  einsatzwunsch?:
    | 'SCH'
    | 'STA'
    | 'ZRO'
    | 'ZR'
    | 'ZNO'
    | 'ZN'
    | 'RZN'
    | 'SR'
    | 'WRO'
    | 'WR'
    | 'AUS'
    | 'SP'
    | 'PKF'
    | 'STO'
    | 'ASCH'
    | 'SIB'
    | 'SAUF'
    | 'VER';
}

export type MeldungKariabschnittV8 = MeldungKariabschnittV7;

export interface MeldungTrainerV7 {
  /**
   * Laufende Nummer innerhalb dieser Meldung.
   *
   * @see dsv8.md:2127
   */
  nummerTrainer: string;

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:2131
   */
  name: string;
}

export interface MeldungTrainerV8 {
  /**
   * Laufende Nummer innerhalb dieser Meldung.
   *
   * @see dsv8.md:2127
   */
  nummerTrainer: string;

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:2131
   */
  name: string;

  /**
   * Geschlecht.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:2145
   */
  geschlecht?: 'M' | 'W' | 'D';
}

export interface MeldungPnmeldungV7 {
  /**
   * Name und Vorname.
   *
   * @see dsv8.md:2176
   */
  name: string;

  /**
   * DSV-Identifikationsnummer.
   *
   * @see dsv8.md:2178
   */
  dsvId: string;

  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2185
   */
  veranstaltungsId: string;

  /**
   * Geschlecht.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:2206
   */
  geschlecht: 'M' | 'W' | 'D';

  /**
   * Geburtsjahrgang, vierstellig.
   *
   * @see dsv8.md:2221
   */
  jahrgang: string;

  /**
   * Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.
   *
   * @see dsv8.md:2223
   */
  altersklasse?: string;

  /**
   * Nummer der zugeordneten Trainermeldung.
   *
   * @see dsv8.md:2225
   */
  nummerTrainer?: string;

  /**
   * Erste Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:2233
   */
  nationalitaet1?: string;

  /**
   * Zweite Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:2237
   */
  nationalitaet2?: string;

  /**
   * Dritte Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:2241
   */
  nationalitaet3?: string;
}

export type MeldungPnmeldungV8 = MeldungPnmeldungV7;

export interface MeldungHandicapV7 {
  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2285
   */
  veranstaltungsId: string;

  /**
   * Identifikationsnummer beim Deutschen Behindertensportverband.
   *
   * @see dsv8.md:2290
   */
  dbsId?: string;

  /**
   * Identifikationsnummer beim International Paralympic Committee.
   *
   * @see dsv8.md:2292
   */
  ipcId?: string;

  /**
   * Startklasse für Freistil, Rücken und Schmetterling.
   *
   * - `AB` — ohne Startklasse
   * - `S1` — Startklasse S1
   * - `S2` — Startklasse S2
   * - `S3` — Startklasse S3
   * - `S4` — Startklasse S4
   * - `S5` — Startklasse S5
   * - `S6` — Startklasse S6
   * - `S7` — Startklasse S7
   * - `S8` — Startklasse S8
   * - `S9` — Startklasse S9
   * - `S10` — Startklasse S10
   * - `S11` — Startklasse S11
   * - `S12` — Startklasse S12
   * - `S13` — Startklasse S13
   * - `S14` — Startklasse S14
   *
   * @see dsv8.md:2294
   */
  startklasse:
    | 'AB'
    | 'S1'
    | 'S2'
    | 'S3'
    | 'S4'
    | 'S5'
    | 'S6'
    | 'S7'
    | 'S8'
    | 'S9'
    | 'S10'
    | 'S11'
    | 'S12'
    | 'S13'
    | 'S14';

  /**
   * Startklasse für Brust.
   *
   * - `AB` — ohne Startklasse
   * - `SB1` — Startklasse SB1
   * - `SB2` — Startklasse SB2
   * - `SB3` — Startklasse SB3
   * - `SB4` — Startklasse SB4
   * - `SB5` — Startklasse SB5
   * - `SB6` — Startklasse SB6
   * - `SB7` — Startklasse SB7
   * - `SB8` — Startklasse SB8
   * - `SB9` — Startklasse SB9
   * - `SB10` — Startklasse SB10
   * - `SB11` — Startklasse SB11
   * - `SB12` — Startklasse SB12
   * - `SB13` — Startklasse SB13
   * - `SB14` — Startklasse SB14
   *
   * @see dsv8.md:2302
   */
  startklasseBrust:
    | 'AB'
    | 'SB1'
    | 'SB2'
    | 'SB3'
    | 'SB4'
    | 'SB5'
    | 'SB6'
    | 'SB7'
    | 'SB8'
    | 'SB9'
    | 'SB10'
    | 'SB11'
    | 'SB12'
    | 'SB13'
    | 'SB14';

  /**
   * Startklasse für Lagen.
   *
   * - `AB` — ohne Startklasse
   * - `SM1` — Startklasse SM1
   * - `SM2` — Startklasse SM2
   * - `SM3` — Startklasse SM3
   * - `SM4` — Startklasse SM4
   * - `SM5` — Startklasse SM5
   * - `SM6` — Startklasse SM6
   * - `SM7` — Startklasse SM7
   * - `SM8` — Startklasse SM8
   * - `SM9` — Startklasse SM9
   * - `SM10` — Startklasse SM10
   * - `SM11` — Startklasse SM11
   * - `SM12` — Startklasse SM12
   * - `SM13` — Startklasse SM13
   * - `SM14` — Startklasse SM14
   *
   * @see dsv8.md:2306
   */
  startklasseLagen:
    | 'AB'
    | 'SM1'
    | 'SM2'
    | 'SM3'
    | 'SM4'
    | 'SM5'
    | 'SM6'
    | 'SM7'
    | 'SM8'
    | 'SM9'
    | 'SM10'
    | 'SM11'
    | 'SM12'
    | 'SM13'
    | 'SM14';

  /**
   * Ausnahmeregelungen der Startklassifizierung.
   *
   * @see dsv8.md:2355
   */
  exceptions?: string;
}

export type MeldungHandicapV8 = MeldungHandicapV7;

export interface MeldungStartpnV7 {
  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2376
   */
  veranstaltungsId: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:2381
   */
  wettkampfnummer: string;

  /**
   * Gemeldete Zeit.
   *
   * @see dsv8.md:2383
   */
  meldezeit?: string;
}

export type MeldungStartpnV8 = MeldungStartpnV7;

export interface MeldungStmeldungV7 {
  /**
   * Nummer der Mannschaft innerhalb des Vereins.
   *
   * @see dsv8.md:2410
   */
  nummerDerMannschaft: string;

  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2413
   */
  veranstaltungsIdStaffel: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:2420
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Untere Grenze des Jahrgangs oder der Altersklasse.
   *
   * @see dsv8.md:2426
   */
  mindestJgAk: string;

  /**
   * Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.
   *
   * @see dsv8.md:2458
   */
  maximalJgAk?: string;

  /**
   * Bezeichnung der Staffel.
   *
   * @see dsv8.md:2470
   */
  nameDerStaffel?: string;
}

export type MeldungStmeldungV8 = MeldungStmeldungV7;

export interface MeldungStartstV7 {
  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2494
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:2499
   */
  wettkampfnummer: string;

  /**
   * Gemeldete Zeit.
   *
   * @see dsv8.md:2501
   */
  meldezeit?: string;
}

export type MeldungStartstV8 = MeldungStartstV7;

export interface MeldungStaffelpersonV7 {
  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2533
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:2538
   */
  wettkampfnummer: string;

  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:2544
   */
  veranstaltungsId: string;

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:2547
   */
  startnummer: string;
}

export type MeldungStaffelpersonV8 = MeldungStaffelpersonV7;

export type MeldungDateiendeV7 = Record<string, never>;

export type MeldungDateiendeV8 = MeldungDateiendeV7;

// Vereinsergebnisliste

export interface VereinsergebnisFormatV7 {
  /**
   * Konstant Vereinsergebnisliste.
   *
   * @see dsv8.md:2680
   */
  listart: string;

  /**
   * Versionsnummer des DSV-Standards.
   *
   * @see dsv8.md:2682
   */
  version: string;
}

export type VereinsergebnisFormatV8 = VereinsergebnisFormatV7;

export interface VereinsergebnisErzeugerV7 {
  /**
   * Name der erzeugenden Software.
   *
   * @see dsv8.md:2704
   */
  software: string;

  /**
   * Versionskennung der Software.
   *
   * @see dsv8.md:2708
   */
  version: string;

  /**
   * E-Mail-Adresse des Software-Herstellers.
   *
   * @see dsv8.md:2710
   */
  kontakt: string;
}

export type VereinsergebnisErzeugerV8 = VereinsergebnisErzeugerV7;

export interface VereinsergebnisVeranstaltungV7 {
  /**
   * Name der Veranstaltung.
   *
   * @see dsv8.md:2738
   */
  veranstaltungsbezeichnung: string;

  /**
   * Ort der Veranstaltung.
   *
   * @see dsv8.md:2743
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
   * @see dsv8.md:2745
   */
  bahnlaenge: '16' | '20' | '25' | '33' | '50' | 'FW' | 'X';

  /**
   * Art der Zeitmessung.
   *
   * - `HANDZEIT` — Handzeit
   * - `AUTOMATISCH` — automatische Zeitmessung
   * - `HALBAUTOMATISCH` — halbautomatische Zeitmessung
   *
   * @see dsv8.md:2749
   */
  zeitmessung: 'HANDZEIT' | 'AUTOMATISCH' | 'HALBAUTOMATISCH';
}

export type VereinsergebnisVeranstaltungV8 = VereinsergebnisVeranstaltungV7;

export interface VereinsergebnisVeranstalterV7 {
  /**
   * Name des Veranstalters.
   *
   * @see dsv8.md:2788
   */
  nameDesVeranstalters: string;
}

export type VereinsergebnisVeranstalterV8 = VereinsergebnisVeranstalterV7;

export interface VereinsergebnisAusrichterV7 {
  /**
   * Name des Ausrichters.
   *
   * @see dsv8.md:2813
   */
  nameDesAusrichters: string;

  /**
   * Name und Vorname der Ansprechperson.
   *
   * @see dsv8.md:2816
   */
  name: string;

  /**
   * Strasse.
   *
   * @see dsv8.md:2818
   */
  strasse?: string;

  /**
   * Postleitzahl.
   *
   * @see dsv8.md:2820
   */
  plz?: string;

  /**
   * Ort.
   *
   * @see dsv8.md:2822
   */
  ort?: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:2824
   */
  land?: string;

  /**
   * Telefonnummer.
   *
   * @see dsv8.md:2826
   */
  telefon?: string;

  /**
   * Faxnummer.
   *
   * @see dsv8.md:2828
   */
  fax?: string;

  /**
   * E-Mail-Adresse.
   *
   * @see dsv8.md:2830
   */
  email: string;
}

export type VereinsergebnisAusrichterV8 = VereinsergebnisAusrichterV7;

export interface VereinsergebnisAbschnittV7 {
  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:2896
   */
  abschnittsnr: string;

  /**
   * Datum des Abschnitts.
   *
   * @see dsv8.md:2900
   */
  abschnittsdatum: string;

  /**
   * Beginn des Abschnitts.
   *
   * @see dsv8.md:2902
   */
  anfangszeit: string;

  /**
   * Ob die Zeitangabe relativ zum Abschnittsbeginn zu lesen ist.
   *
   * - `J` — relative Angabe
   * - `N` — echte Uhrzeit
   *
   * @see dsv8.md:2906
   */
  relativeAngabe?: 'J' | 'N';
}

export type VereinsergebnisAbschnittV8 = VereinsergebnisAbschnittV7;

export interface VereinsergebnisKampfgerichtV7 {
  /**
   * Nummer des Abschnitts.
   *
   * @see dsv8.md:2941
   */
  abschnittsnr: string;

  /**
   * Position im Kampfgericht.
   *
   * - `SCH` — Schiedsrichter*in
   * - `STA` — Starter*in
   * - `ZRO` — Zeitnehmer-Obmann/-frau
   * - `ZR` — Zeitnehmer*in
   * - `ZNO` — Zielrichter-Obmann/-frau
   * - `ZN` — Zielrichter*in
   * - `RZN` — Richter*in für Zielankunft
   * - `SR` — Schwimmrichter*in
   * - `WRO` — Wenderichter-Obmann/-frau
   * - `WR` — Wenderichter*in
   * - `AUS` — Auswerter*in
   * - `SP` — Sprecher*in
   * - `PKF` — Protokollkampfrichter*in
   * - `STO` — Startordner*in
   * - `WKH` — Wettkampfhelfer*in
   * - `ASCH` — Assistenz Schiedsrichter*in
   * - `SIB` — Sicherheitsbeauftragte*r
   * - `SAUF` — Schwimmaufsicht
   * - `VER` — Verpflegung
   * - `ZBV` — zur besonderen Verwendung
   *
   * @see dsv8.md:2943
   */
  position:
    | 'SCH'
    | 'STA'
    | 'ZRO'
    | 'ZR'
    | 'ZNO'
    | 'ZN'
    | 'RZN'
    | 'SR'
    | 'WRO'
    | 'WR'
    | 'AUS'
    | 'SP'
    | 'PKF'
    | 'STO'
    | 'WKH'
    | 'ASCH'
    | 'SIB'
    | 'SAUF'
    | 'VER'
    | 'ZBV';

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:2993
   */
  nameKampfrichter: string;

  /**
   * Verein, für den die Person antritt.
   *
   * @see dsv8.md:2996
   */
  vereinDesKampfrichters: string;
}

export type VereinsergebnisKampfgerichtV8 = VereinsergebnisKampfgerichtV7;

export interface VereinsergebnisWettkampfV7 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:3037
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3039
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts, in dem der Wettkampf stattfand.
   *
   * @see dsv8.md:3069
   */
  abschnittsnr: string;

  /**
   * Anzahl der Staffelteilnehmer; für Einzeldisziplinen 1.
   *
   * @see dsv8.md:3071
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern; 0 steht für sonstige Strecken.
   *
   * @see dsv8.md:3073
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
   * @see dsv8.md:3087
   */
  technik: 'F' | 'R' | 'B' | 'S' | 'L' | 'X';

  /**
   * Ausübung der Schwimmart.
   *
   * - `GL` — Gleichgültig
   * - `BE` — Beine
   * - `AR` — Arme
   * - `ST` — Start
   * - `WE` — Wende
   * - `GB` — Gleitübung Beine
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:3102
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'X';

  /**
   * Geschlecht der Startberechtigten.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:3125
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
   * @see dsv8.md:3133
   */
  zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX';

  /**
   * Nummer des qualifizierenden Wettkampfes.
   *
   * @see dsv8.md:3161
   */
  qualifikationswettkampfnr?: string;

  /**
   * Art des qualifizierenden Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   *
   * @see dsv8.md:3177
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E';
}

export interface VereinsergebnisWettkampfV8 {
  /**
   * Nummer des Wettkampfes, maximal dreistellig.
   *
   * @see dsv8.md:3037
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3039
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Nummer des Abschnitts, in dem der Wettkampf stattfand.
   *
   * @see dsv8.md:3069
   */
  abschnittsnr: string;

  /**
   * Anzahl der Staffelteilnehmer; für Einzeldisziplinen 1.
   *
   * @see dsv8.md:3071
   */
  anzahlStarter?: string;

  /**
   * Strecke in Metern; 0 steht für sonstige Strecken.
   *
   * @see dsv8.md:3073
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
   * @see dsv8.md:3087
   */
  technik: 'F' | 'R' | 'B' | 'S' | 'L' | 'X';

  /**
   * Ausübung der Schwimmart.
   *
   * - `GL` — Gleichgültig
   * - `BE` — Beine
   * - `AR` — Arme
   * - `ST` — Start
   * - `WE` — Wende
   * - `GB` — Gleitübung Beine
   * - `KB` — Kicks auf dem Bauch
   * - `KR` — Kicks auf dem Rücken
   * - `X` — beliebige Sonderform
   *
   * @see dsv8.md:3102
   */
  ausuebung: 'GL' | 'BE' | 'AR' | 'ST' | 'WE' | 'GB' | 'KB' | 'KR' | 'X';

  /**
   * Geschlecht der Startberechtigten.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   * - `X` — gemischte Wettkämpfe
   *
   * @see dsv8.md:3125
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
   * @see dsv8.md:3133
   */
  zuordnungBestenliste: 'SW' | 'EW' | 'PA' | 'MS' | 'KG' | 'XX';

  /**
   * Nummer des qualifizierenden Wettkampfes.
   *
   * @see dsv8.md:3161
   */
  qualifikationswettkampfnr?: string;

  /**
   * Art des qualifizierenden Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   *
   * @see dsv8.md:3177
   */
  qualifikationswettkampfart?: 'V' | 'Z' | 'F' | 'E';
}

export interface VereinsergebnisWertungV7 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3205
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3207
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Kennung der Wertung innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3253
   */
  wertungsId: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:3257
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Untere Grenze des Jahrgangs oder der Altersklasse.
   *
   * @see dsv8.md:3263
   */
  mindestJgAk: string;

  /**
   * Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.
   *
   * @see dsv8.md:3266
   */
  maximalJgAk?: string;

  /**
   * Geschlecht der gewerteten Startberechtigten.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `X` — gemischte Wertung
   *
   * @see dsv8.md:3273
   */
  geschlecht?: 'M' | 'W' | 'X';

  /**
   * Bezeichnung der Wertung.
   *
   * @see dsv8.md:3289
   */
  wertungsname: string;
}

export interface VereinsergebnisWertungV8 {
  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3205
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3207
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Kennung der Wertung innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3253
   */
  wertungsId: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:3257
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Untere Grenze des Jahrgangs oder der Altersklasse.
   *
   * @see dsv8.md:3263
   */
  mindestJgAk: string;

  /**
   * Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.
   *
   * @see dsv8.md:3266
   */
  maximalJgAk?: string;

  /**
   * Geschlecht der gewerteten Startberechtigten.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   * - `X` — gemischte Wertung
   *
   * @see dsv8.md:3273
   */
  geschlecht?: 'M' | 'W' | 'D' | 'X';

  /**
   * Bezeichnung der Wertung.
   *
   * @see dsv8.md:3289
   */
  wertungsname: string;
}

export interface VereinsergebnisVereinV7 {
  /**
   * Name des Vereins.
   *
   * @see dsv8.md:3311
   */
  vereinsbezeichnung: string;

  /**
   * Kennzahl des Vereins.
   *
   * @see dsv8.md:3313
   */
  vereinskennzahl: string;

  /**
   * Kennzahl des Landesschwimmverbandes.
   *
   * @see dsv8.md:3319
   */
  landesschwimmverband: string;

  /**
   * WA-Nationenkürzel, dreistellig.
   *
   * @see dsv8.md:3346
   */
  nationenkuerzel: string;
}

export type VereinsergebnisVereinV8 = VereinsergebnisVereinV7;

export interface VereinsergebnisPersonV7 {
  /**
   * Name und Vorname.
   *
   * @see dsv8.md:3376
   */
  name: string;

  /**
   * DSV-Identifikationsnummer.
   *
   * @see dsv8.md:3378
   */
  dsvId: string;

  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3385
   */
  veranstaltungsId: string;

  /**
   * Geschlecht.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:3406
   */
  geschlecht: 'M' | 'W' | 'D';

  /**
   * Geburtsjahrgang, vierstellig.
   *
   * @see dsv8.md:3421
   */
  jahrgang: string;

  /**
   * Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.
   *
   * @see dsv8.md:3423
   */
  altersklasse?: string;

  /**
   * Erste Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:3425
   */
  nationalitaet1?: string;

  /**
   * Zweite Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:3433
   */
  nationalitaet2?: string;

  /**
   * Dritte Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:3437
   */
  nationalitaet3?: string;
}

export type VereinsergebnisPersonV8 = VereinsergebnisPersonV7;

export interface VereinsergebnisPersonenergebnisV7 {
  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3480
   */
  veranstaltungsId: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3485
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3487
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Kennung der Wertung innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3493
   */
  wertungsId: string;

  /**
   * Erreichter Platz; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.
   *
   * @see dsv8.md:3495
   */
  platz: string;

  /**
   * Geschwommene Endzeit.
   *
   * @see dsv8.md:3497
   */
  endzeit: string;

  /**
   * Grund, aus dem das Ergebnis nicht gewertet wird.
   *
   * - `DS` — disqualifiziert
   * - `NA` — nicht angetreten
   * - `AB` — abgemeldet
   * - `AU` — aufgegeben
   * - `ZU` — zurückgezogen
   *
   * @see dsv8.md:3499
   */
  grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU';

  /**
   * Erläuterung zur Disqualifikation.
   *
   * @see dsv8.md:3569
   */
  disqualifikationsbemerkung?: string;

  /**
   * Kennzeichen für erhöhtes oder nachträgliches Meldegeld.
   *
   * - `E` — erhöhtes Meldegeld
   * - `F` — erhöhtes und nachträgliches Meldegeld
   * - `N` — nachträgliches Meldegeld
   *
   * @see dsv8.md:3579
   */
  erhoehtesNachtraeglichesMeldegeld?: 'E' | 'F' | 'N';
}

export type VereinsergebnisPersonenergebnisV8 = VereinsergebnisPersonenergebnisV7;

export interface VereinsergebnisPnzwischenzeitV7 {
  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3602
   */
  veranstaltungsId: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3607
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3611
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Distanz in Metern, auf die sich die Zwischenzeit bezieht.
   *
   * @see dsv8.md:3615
   */
  distanz: string;

  /**
   * Gemessene Zwischenzeit.
   *
   * @see dsv8.md:3617
   */
  zwischenzeit: string;
}

export type VereinsergebnisPnzwischenzeitV8 = VereinsergebnisPnzwischenzeitV7;

export interface VereinsergebnisPnreaktionV7 {
  /**
   * Kennung der Person innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3663
   */
  veranstaltungsId: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3668
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3672
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Vorzeichen der Reaktionszeit.
   *
   * - `+` — Reaktion nach dem Startsignal
   * - `-` — Reaktion vor dem Startsignal
   *
   * @see dsv8.md:3698
   */
  art?: '+' | '-';

  /**
   * Gemessene Reaktionszeit.
   *
   * @see dsv8.md:3712
   */
  reaktionszeit: string;
}

export type VereinsergebnisPnreaktionV8 = VereinsergebnisPnreaktionV7;

export interface VereinsergebnisStaffelV7 {
  /**
   * Nummer der Mannschaft innerhalb des Vereins.
   *
   * @see dsv8.md:3736
   */
  nummerDerMannschaft: string;

  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3739
   */
  veranstaltungsIdStaffel: string;

  /**
   * Art der Wertungsklasse.
   *
   * - `JG` — Jahrgang
   * - `AK` — Altersklasse
   *
   * @see dsv8.md:3746
   */
  wertungsklasseTyp: 'JG' | 'AK';

  /**
   * Untere Grenze des Jahrgangs oder der Altersklasse.
   *
   * @see dsv8.md:3752
   */
  mindestJgAk: string;

  /**
   * Obere Grenze; ohne Angabe gilt der Wert von mindestJgAk.
   *
   * @see dsv8.md:3758
   */
  maximalJgAk?: string;
}

export type VereinsergebnisStaffelV8 = VereinsergebnisStaffelV7;

export interface VereinsergebnisStaffelpersonV7 {
  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3848
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3853
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3857
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Name und Vorname.
   *
   * @see dsv8.md:3867
   */
  name: string;

  /**
   * DSV-Identifikationsnummer.
   *
   * @see dsv8.md:3869
   */
  dsvId: string;

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:3872
   */
  startnummer: string;

  /**
   * Geschlecht.
   *
   * - `M` — männlich
   * - `W` — weiblich
   * - `D` — divers
   *
   * @see dsv8.md:3877
   */
  geschlecht: 'M' | 'W' | 'D';

  /**
   * Geburtsjahrgang, vierstellig.
   *
   * @see dsv8.md:3892
   */
  jahrgang: string;

  /**
   * Altersklasse. Die Spezifikation liefert keine Beschreibung; aus der Spaltenreihenfolge rekonstruiert.
   *
   * @see dsv8.md:3894
   */
  altersklasse?: string;

  /**
   * Erste Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:3896
   */
  nationalitaet1?: string;

  /**
   * Zweite Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:3904
   */
  nationalitaet2?: string;

  /**
   * Dritte Staatsangehörigkeit, WA-Nationenkürzel.
   *
   * @see dsv8.md:3908
   */
  nationalitaet3?: string;
}

export type VereinsergebnisStaffelpersonV8 = VereinsergebnisStaffelpersonV7;

export interface VereinsergebnisStaffelergebnisV7 {
  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3944
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:3947
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:3949
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Kennung der Wertung innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:3979
   */
  wertungsId: string;

  /**
   * Erreichter Platz; bei gesetztem Grund der Nichtwertung muss hier 0 stehen.
   *
   * @see dsv8.md:3981
   */
  platz: string;

  /**
   * Geschwommene Endzeit.
   *
   * @see dsv8.md:3983
   */
  endzeit: string;

  /**
   * Grund, aus dem das Ergebnis nicht gewertet wird.
   *
   * - `DS` — disqualifiziert
   * - `NA` — nicht angetreten
   * - `AB` — abgemeldet
   * - `AU` — aufgegeben
   * - `ZU` — zurückgezogen
   *
   * @see dsv8.md:3985
   */
  grundDerNichtwertung?: 'DS' | 'NA' | 'AB' | 'AU' | 'ZU';

  /**
   * Startnummer der disqualifizierten Person; 0 bei allgemeinem Disqualifikationsgrund.
   *
   * @see dsv8.md:4003
   */
  startnummerDisqualifiziert?: string;

  /**
   * Erläuterung zur Disqualifikation.
   *
   * @see dsv8.md:4044
   */
  disqualifikationsbemerkung?: string;

  /**
   * Kennzeichen für erhöhtes oder nachträgliches Meldegeld.
   *
   * - `E` — erhöhtes Meldegeld
   * - `F` — erhöhtes und nachträgliches Meldegeld
   * - `N` — nachträgliches Meldegeld
   *
   * @see dsv8.md:4054
   */
  erhoehtesNachtraeglichesMeldegeld?: 'E' | 'F' | 'N';
}

export type VereinsergebnisStaffelergebnisV8 = VereinsergebnisStaffelergebnisV7;

export interface VereinsergebnisStzwischenzeitV7 {
  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:4077
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:4082
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:4086
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:4092
   */
  startnummer: string;

  /**
   * Distanz in Metern, auf die sich die Zwischenzeit bezieht.
   *
   * @see dsv8.md:4097
   */
  distanz: string;

  /**
   * Gemessene Zwischenzeit.
   *
   * @see dsv8.md:4099
   */
  zwischenzeit: string;
}

export type VereinsergebnisStzwischenzeitV8 = VereinsergebnisStzwischenzeitV7;

export interface VereinsergebnisStabloeseV7 {
  /**
   * Kennung der Staffel innerhalb dieser Veranstaltung.
   *
   * @see dsv8.md:4155
   */
  veranstaltungsIdStaffel: string;

  /**
   * Nummer des Wettkampfes.
   *
   * @see dsv8.md:4160
   */
  wettkampfnr: string;

  /**
   * Art des Wettkampfes.
   *
   * - `V` — Vorlauf
   * - `Z` — Zwischenlauf
   * - `F` — Finale
   * - `E` — Entscheidung
   * - `A` — Ausschwimmen
   * - `N` — Nachschwimmen
   *
   * @see dsv8.md:4164
   */
  wettkampfart: 'V' | 'Z' | 'F' | 'E' | 'A' | 'N';

  /**
   * Startnummer innerhalb der Staffel.
   *
   * @see dsv8.md:4196
   */
  startnummer: string;

  /**
   * Vorzeichen der Ablösezeit.
   *
   * - `+` — Reaktion nach dem Startsignal
   * - `-` — Reaktion vor dem Startsignal
   *
   * @see dsv8.md:4201
   */
  art?: '+' | '-';

  /**
   * Gemessene Ablösezeit.
   *
   * @see dsv8.md:4215
   */
  reaktionszeit: string;
}

export type VereinsergebnisStabloeseV8 = VereinsergebnisStabloeseV7;

export type VereinsergebnisDateiendeV7 = Record<string, never>;

export type VereinsergebnisDateiendeV8 = VereinsergebnisDateiendeV7;
