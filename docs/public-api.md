# Öffentliche API

Die verbindliche Liste dessen, was `@schroeer-haren/dsv` exportiert. Mit 1.0
wird diese Oberfläche eingefroren: Was hier steht, bleibt; was nicht hier
steht, ist kein Teil des Vertrags und darf sich jederzeit ändern.

`test/public-api.test.ts` vergleicht diese Liste mit den tatsächlichen
Exporten aus `src/index.ts` und schlägt bei jeder Abweichung fehl — auch bei
einer geänderten Art. Ein neuer Export ist deshalb immer eine bewusste
Ergänzung dieser Datei.

Diese Datei führt die Exporte und beschreibt, **was** jeder von ihnen tut; sie
wird von Hand gepflegt. Woraus die exportierten Typen bestehen — jedes Feld mit
seinem Typ — steht in der generierten
[`public-api-surface.md`](./public-api-surface.md). Auch die ist eingefroren:
Ein umbenanntes Feld ändert keinen Exportnamen und bliebe hier unsichtbar, ist
aber genauso ein Breaking Change. Neu erzeugt wird sie mit
`npm run api-surface`.

Die Benennung folgt einer Konvention: **englische Verben**
(`parse`, `write`, `project`) und **DSV-Fachbegriffe in Originalschreibweise**
(`Wettkampfdefinitionsliste`, `Vereinsmeldeliste`, `DefinitionAbschnitt`).

Für den Objektgraph gilt zusätzlich: **Jeder Typ trägt das Präfix seiner
Listenart** – `Definition…`, `Ergebnis…`, `Meldung…`, `Vereinsergebnis…`. Nur
die vier Wurzeltypen `Wettkampfdefinition`, `Wettkampfergebnis`,
`Vereinsmeldung` und `Vereinsergebnis` tragen keines: Sie _sind_ die Listenart,
ein Präfix wäre eine Verdopplung.

## Lesen

| Name                             | Art      | Beschreibung                                                                                                                                                                             |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseDsv`                       | function | Liest beliebigen DSV-Text schema-frei in ein `DsvDocument` aus Records, Kommentaren und Leerzeilen; meldet eine nicht unterstützte Formatversion als `fatal`, zerlegt sie aber trotzdem. |
| `parseDsvOrThrow`                | function | Wie `parseDsv`, wirft aber bei einer Diagnostic der Stufe `fatal` einen `DsvParseError`, statt sie zurückzugeben.                                                                        |
| `parseWettkampfdefinitionsliste` | function | Liest eine Wettkampfdefinitionsliste typisiert und prüft sie gegen das Schema.                                                                                                           |
| `parseWettkampfergebnisliste`    | function | Liest eine Wettkampfergebnisliste typisiert und prüft sie gegen das Schema.                                                                                                              |
| `parseVereinsmeldeliste`         | function | Liest eine Vereinsmeldeliste typisiert und prüft sie gegen das Schema.                                                                                                                   |
| `parseVereinsergebnisliste`      | function | Liest eine Vereinsergebnisliste typisiert und prüft sie gegen das Schema.                                                                                                                |
| `DsvParseError`                  | class    | Fehler, den `parseDsvOrThrow` bei einer `fatal`-Diagnostic wirft; trägt die Diagnostics mit.                                                                                             |

## Projizieren

| Name                               | Art      | Beschreibung                                                                            |
| ---------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `projectWettkampfdefinitionsliste` | function | Formt die flache Recordliste einer Wettkampfdefinitionsliste in ihren Objektgraphen um. |
| `projectWettkampfergebnisliste`    | function | Formt die flache Recordliste einer Wettkampfergebnisliste in ihren Objektgraphen um.    |
| `projectVereinsmeldeliste`         | function | Formt die flache Recordliste einer Vereinsmeldeliste in ihren Objektgraphen um.         |
| `projectVereinsergebnisliste`      | function | Formt die flache Recordliste einer Vereinsergebnisliste in ihren Objektgraphen um.      |

## Schreiben

| Name                             | Art      | Beschreibung                                                                                |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `writeDsv`                       | function | Schreibt ein `DsvDocument` byte-identisch zurück in Text.                                   |
| `writeWettkampfdefinitionsliste` | function | Schreibt eine typisierte Wettkampfdefinitionsliste als DSV-Text.                            |
| `writeWettkampfergebnisliste`    | function | Schreibt eine typisierte Wettkampfergebnisliste als DSV-Text.                               |
| `writeVereinsmeldeliste`         | function | Schreibt eine typisierte Vereinsmeldeliste als DSV-Text.                                    |
| `writeVereinsergebnisliste`      | function | Schreibt eine typisierte Vereinsergebnisliste als DSV-Text.                                 |
| `DsvWriteError`                  | class    | Fehler beim Schreiben, wenn die Daten das Schema verletzen und keine gültige Datei ergäben. |
| `WriteOptions`                   | type     | Einstellungen des Schreibens, etwa Zeilenende und BOM.                                      |

## Schema-freie Ebene

| Name          | Art  | Beschreibung                                                                               |
| ------------- | ---- | ------------------------------------------------------------------------------------------ |
| `DsvDocument` | type | Eine vollständig zerlegte DSV-Datei: Listenart, Formatversion, Items und BOM-Kennzeichen.  |
| `DsvItem`     | type | Ein Element eines `DsvDocument`: `DsvRecord`, `DsvComment` oder `DsvBlank`.                |
| `DsvRecord`   | type | Eine Datenzeile mit Elementname und Rohfeldern, samt Originalzeile für die Byte-Identität. |
| `DsvComment`  | type | Eine Kommentarzeile, unverändert erhalten.                                                 |
| `DsvBlank`    | type | Eine Leerzeile, unverändert erhalten.                                                      |
| `ParseResult` | type | Ergebnis eines Lesevorgangs: der Wert, die Diagnostics und das `ok`-Kennzeichen.           |

## Typisierte Ebene

| Name                        | Art  | Beschreibung                                                                         |
| --------------------------- | ---- | ------------------------------------------------------------------------------------ |
| `TypedRecord`               | type | Ein Record, dessen Feldwerte unter ihren Schema-Feldnamen erreichbar sind.           |
| `TypedList`                 | type | Eine typisierte Liste aus `TypedRecord`s, im Typsystem nach Listenart unterschieden. |
| `Wettkampfdefinitionsliste` | type | Die typisierte Recordliste einer Wettkampfdefinitionsliste.                          |
| `Wettkampfergebnisliste`    | type | Die typisierte Recordliste einer Wettkampfergebnisliste.                             |
| `Vereinsmeldeliste`         | type | Die typisierte Recordliste einer Vereinsmeldeliste.                                  |
| `Vereinsergebnisliste`      | type | Die typisierte Recordliste einer Vereinsergebnisliste.                               |
| `FormatVersion`             | type | Formatversion des DSV-Standards, gegen die geprüft wird: `7` oder `8`.               |

## Diagnostics

| Name             | Art  | Beschreibung                                                                           |
| ---------------- | ---- | -------------------------------------------------------------------------------------- |
| `Diagnostic`     | type | Ein einzelner Befund mit Code, Severity, Quellzeile und Meldung.                         |
| `DiagnosticCode` | type | Die feste Menge der Befundkennungen, etwa `wrong-list-type` oder `dangling-reference`. |
| `Severity`       | type | Stufe eines Befunds: `fatal`, `error`, `warning` oder `info`.                          |

## Werte

Der Objektgraph führt Datumsangaben als `Datum`, Zeiten als Hundertstelsekunden
und Uhrzeiten als Minuten seit Mitternacht. Diese Codecs sind dieselben, die die
Bibliothek intern benutzt — wer einen Wert anzeigen oder zurückschreiben will,
trifft die Formatierungsregel damit exakt, statt sie nachzubauen.

| Name            | Art      | Beschreibung                                                                       |
| --------------- | -------- | ---------------------------------------------------------------------------------- |
| `Datum`         | type     | Ein Datum als Tripel aus Tag, Monat und Jahr, ohne Zeitzone.                       |
| `decodeDatum`   | function | Liest ein Datum aus `TT.MM.JJJJ`, oder `null` bei ungültiger Angabe.               |
| `encodeDatum`   | function | Schreibt ein `Datum` als `TT.MM.JJJJ` mit führenden Nullen.                        |
| `decodeZeit`    | function | Liest eine Schwimmzeit aus `HH:MM:SS,hh` als Hundertstel, oder `null`.             |
| `encodeZeit`    | function | Schreibt Hundertstel als `HH:MM:SS,hh` mit führenden Nullen und Komma als Trenner. |
| `isZeroZeit`    | function | `true` für den Unterlassungswert `00:00:00,00`, also „keine Zeit angegeben".       |
| `decodeUhrzeit` | function | Liest eine Uhrzeit aus `HH:MM` als Minuten seit Mitternacht, oder `null`.          |
| `encodeUhrzeit` | function | Schreibt Minuten seit Mitternacht als `HH:MM` im 24-Stunden-Format.                |

## Objektgraph der Wettkampfdefinitionsliste

| Name                         | Art  | Beschreibung                                                              |
| ---------------------------- | ---- | ------------------------------------------------------------------------- |
| `DefinitionProjectionResult` | type | Ergebnis der Projektion einer Wettkampfdefinitionsliste, mit Diagnostics. |
| `Wettkampfdefinition`        | type | Wurzel des Objektgraphen einer Wettkampfdefinitionsliste.                 |
| `DefinitionVeranstaltung`    | type | Die Veranstaltung mit Ort, Bahnlänge und Zeitmessung.                     |
| `DefinitionAbschnitt`        | type | Ein Abschnitt der Veranstaltung mit seinen Zeitangaben.                   |
| `DefinitionWettkampf`        | type | Ein ausgeschriebener Wettkampf mit Strecke, Technik und Altersklasse.     |
| `DefinitionWertung`          | type | Eine Wertungsgruppe eines Wettkampfs.                                     |
| `DefinitionPflichtzeit`      | type | Eine geforderte Pflichtzeit zu einem Wettkampf.                           |

## Objektgraph der Wettkampfergebnisliste

| Name                          | Art  | Beschreibung                                                                             |
| ----------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| `ErgebnisProjectionResult`    | type | Ergebnis der Projektion einer Wettkampfergebnisliste, mit Diagnostics.                   |
| `Wettkampfergebnis`           | type | Wurzel des Objektgraphen einer Wettkampfergebnisliste.                                   |
| `ErgebnisVeranstaltung`       | type | Die Veranstaltung der Ergebnisliste.                                                     |
| `ErgebnisAbschnitt`           | type | Ein Abschnitt der Ergebnisliste; führt vier Felder statt der sechs der Definitionsliste. |
| `ErgebnisWettkampf`           | type | Ein Wettkampf der Ergebnisliste.                                                         |
| `ErgebnisWertung`             | type | Eine Wertungsgruppe der Ergebnisliste.                                                   |
| `ErgebnisVerein`              | type | Ein teilnehmender Verein.                                                                |
| `ErgebnisPerson`              | type | Eine Person mit Jahrgang und Verein, aus den Ergebniszeilen aggregiert.                  |
| `ErgebnisStart`               | type | Ein Einzelstart mit seinem Ergebnis.                                                     |
| `ErgebnisZwischenzeit`        | type | Eine Zwischenzeit innerhalb eines Einzelstarts.                                          |
| `ErgebnisReaktion`            | type | Die Reaktionszeit am Start.                                                              |
| `ErgebnisPlatzierung`         | type | Die Platzierung eines Starts in einer Wertung.                                           |
| `ErgebnisStaffel`             | type | Eine Staffel mit ihrem Ergebnis.                                                         |
| `ErgebnisStaffelPerson`       | type | Ein Startabschnitt einer Staffel, besetzt mit einer Person.                              |
| `ErgebnisStaffelZwischenzeit` | type | Eine Zwischenzeit innerhalb eines Staffelabschnitts.                                     |
| `ErgebnisAbloese`             | type | Die Ablösezeit an einem Staffelwechsel.                                                  |
| `ErgebnisKampfrichter`        | type | Ein eingesetzter Kampfrichter.                                                           |

## Objektgraph der Vereinsmeldeliste

| Name                         | Art  | Beschreibung                                                      |
| ---------------------------- | ---- | ----------------------------------------------------------------- |
| `MeldungProjectionResult`    | type | Ergebnis der Projektion einer Vereinsmeldeliste, mit Diagnostics. |
| `Vereinsmeldung`             | type | Wurzel des Objektgraphen einer Vereinsmeldeliste.                 |
| `MeldungVeranstaltung`       | type | Die Veranstaltung, auf die sich die Meldung bezieht.              |
| `MeldungAbschnitt`           | type | Ein Abschnitt der Veranstaltung in der Meldung.                   |
| `MeldungVerein`              | type | Der meldende Verein.                                              |
| `MeldungAnsprechpartner`     | type | Der Ansprechpartner des meldenden Vereins.                        |
| `MeldungPerson`              | type | Eine gemeldete Person.                                            |
| `MeldungHandicap`            | type | Die Handicap-Angaben einer gemeldeten Person.                     |
| `MeldungWettkampf`           | type | Ein Wettkampf, auf den gemeldet wird.                             |
| `MeldungStart`               | type | Eine Einzelmeldung auf einen Wettkampf.                           |
| `MeldungStaffel`             | type | Eine Staffelmeldung.                                              |
| `MeldungStaffelPerson`       | type | Eine in einer Staffelmeldung benannte Person.                     |
| `MeldungTrainer`             | type | Ein gemeldeter Trainer.                                           |
| `MeldungKampfrichter`        | type | Ein gemeldeter Kampfrichter.                                      |
| `MeldungKampfrichterEinsatz` | type | Der Abschnitt, für den ein Kampfrichter gemeldet ist.             |

## Objektgraph der Vereinsergebnisliste

| Name                                 | Art  | Beschreibung                                                                       |
| ------------------------------------ | ---- | ---------------------------------------------------------------------------------- |
| `VereinsergebnisProjectionResult`    | type | Ergebnis der Projektion einer Vereinsergebnisliste, mit Diagnostics.               |
| `Vereinsergebnis`                    | type | Wurzel des Objektgraphen einer Vereinsergebnisliste.                               |
| `VereinsergebnisVeranstaltung`       | type | Die Veranstaltung der Vereinsergebnisliste.                                        |
| `VereinsergebnisAbschnitt`           | type | Ein Abschnitt der Veranstaltung.                                                   |
| `VereinsergebnisVerein`              | type | Der Verein, dessen Ergebnisse die Liste führt.                                     |
| `VereinsergebnisPerson`              | type | Eine Person des Vereins; eigene Entität, anders als in der Wettkampfergebnisliste. |
| `VereinsergebnisWettkampf`           | type | Ein Wettkampf der Vereinsergebnisliste.                                            |
| `VereinsergebnisWertung`             | type | Eine Wertungsgruppe der Vereinsergebnisliste.                                      |
| `VereinsergebnisStart`               | type | Ein Einzelstart mit seinem Ergebnis.                                               |
| `VereinsergebnisZwischenzeit`        | type | Eine Zwischenzeit innerhalb eines Einzelstarts.                                    |
| `VereinsergebnisReaktion`            | type | Die Reaktionszeit am Start.                                                        |
| `VereinsergebnisPlatzierung`         | type | Die Platzierung eines Einzelstarts in einer Wertung.                               |
| `VereinsergebnisStaffel`             | type | Eine Staffel des Vereins.                                                          |
| `VereinsergebnisStaffelStart`        | type | Der Start einer Staffel mit seinem Ergebnis.                                       |
| `VereinsergebnisStaffelPerson`       | type | Ein Startabschnitt einer Staffel, besetzt mit einer Person.                        |
| `VereinsergebnisStaffelZwischenzeit` | type | Eine Zwischenzeit innerhalb eines Staffelabschnitts.                               |
| `VereinsergebnisStaffelPlatzierung`  | type | Die Platzierung einer Staffel in einer Wertung.                                    |
| `VereinsergebnisAbloese`             | type | Die Ablösezeit an einem Staffelwechsel.                                            |
| `VereinsergebnisKampfrichter`        | type | Ein vom Verein gestellter Kampfrichter.                                            |

## Generierte Elementtypen

Erzeugt von `scripts/generate-types.ts` aus den Schema-Definitionen, je
Element und Formatversion einer. Sie tragen die Feldbedeutungen und die
Fundstelle in der Spezifikation als Doc-Kommentar und sind vor allem beim
Aufbau eigener Records nützlich.

| Name                                | Art  | Beschreibung                                                                                |
| ----------------------------------- | ---- | ------------------------------------------------------------------------------------------- |
| `FormatV7`                          | type | Felder des Elements `FORMAT` der Wettkampfdefinitionsliste in Formatversion 7.              |
| `FormatV8`                          | type | Felder des Elements `FORMAT` der Wettkampfdefinitionsliste in Formatversion 8.              |
| `ErzeugerV7`                        | type | Felder des Elements `ERZEUGER` der Wettkampfdefinitionsliste in Formatversion 7.            |
| `ErzeugerV8`                        | type | Felder des Elements `ERZEUGER` der Wettkampfdefinitionsliste in Formatversion 8.            |
| `VeranstaltungV7`                   | type | Felder des Elements `VERANSTALTUNG` der Wettkampfdefinitionsliste in Formatversion 7.       |
| `VeranstaltungV8`                   | type | Felder des Elements `VERANSTALTUNG` der Wettkampfdefinitionsliste in Formatversion 8.       |
| `VeranstaltungsortV7`               | type | Felder des Elements `VERANSTALTUNGSORT` der Wettkampfdefinitionsliste in Formatversion 7.   |
| `VeranstaltungsortV8`               | type | Felder des Elements `VERANSTALTUNGSORT` der Wettkampfdefinitionsliste in Formatversion 8.   |
| `AusschreibungimnetzV7`             | type | Felder des Elements `AUSSCHREIBUNGIMNETZ` der Wettkampfdefinitionsliste in Formatversion 7. |
| `AusschreibungimnetzV8`             | type | Felder des Elements `AUSSCHREIBUNGIMNETZ` der Wettkampfdefinitionsliste in Formatversion 8. |
| `VeranstalterV7`                    | type | Felder des Elements `VERANSTALTER` der Wettkampfdefinitionsliste in Formatversion 7.        |
| `VeranstalterV8`                    | type | Felder des Elements `VERANSTALTER` der Wettkampfdefinitionsliste in Formatversion 8.        |
| `AusrichterV7`                      | type | Felder des Elements `AUSRICHTER` der Wettkampfdefinitionsliste in Formatversion 7.          |
| `AusrichterV8`                      | type | Felder des Elements `AUSRICHTER` der Wettkampfdefinitionsliste in Formatversion 8.          |
| `MeldeadresseV7`                    | type | Felder des Elements `MELDEADRESSE` der Wettkampfdefinitionsliste in Formatversion 7.        |
| `MeldeadresseV8`                    | type | Felder des Elements `MELDEADRESSE` der Wettkampfdefinitionsliste in Formatversion 8.        |
| `MeldeschlussV7`                    | type | Felder des Elements `MELDESCHLUSS` der Wettkampfdefinitionsliste in Formatversion 7.        |
| `MeldeschlussV8`                    | type | Felder des Elements `MELDESCHLUSS` der Wettkampfdefinitionsliste in Formatversion 8.        |
| `BankverbindungV7`                  | type | Felder des Elements `BANKVERBINDUNG` der Wettkampfdefinitionsliste in Formatversion 7.      |
| `BankverbindungV8`                  | type | Felder des Elements `BANKVERBINDUNG` der Wettkampfdefinitionsliste in Formatversion 8.      |
| `LastschriftV7`                     | type | Felder des Elements `LASTSCHRIFT` der Wettkampfdefinitionsliste in Formatversion 7.         |
| `LastschriftV8`                     | type | Felder des Elements `LASTSCHRIFT` der Wettkampfdefinitionsliste in Formatversion 8.         |
| `BesonderesV7`                      | type | Felder des Elements `BESONDERES` der Wettkampfdefinitionsliste in Formatversion 7.          |
| `BesonderesV8`                      | type | Felder des Elements `BESONDERES` der Wettkampfdefinitionsliste in Formatversion 8.          |
| `NachweisV7`                        | type | Felder des Elements `NACHWEIS` der Wettkampfdefinitionsliste in Formatversion 7.            |
| `NachweisV8`                        | type | Felder des Elements `NACHWEIS` der Wettkampfdefinitionsliste in Formatversion 8.            |
| `AbschnittV7`                       | type | Felder des Elements `ABSCHNITT` der Wettkampfdefinitionsliste in Formatversion 7.           |
| `AbschnittV8`                       | type | Felder des Elements `ABSCHNITT` der Wettkampfdefinitionsliste in Formatversion 8.           |
| `WettkampfV7`                       | type | Felder des Elements `WETTKAMPF` der Wettkampfdefinitionsliste in Formatversion 7.           |
| `WettkampfV8`                       | type | Felder des Elements `WETTKAMPF` der Wettkampfdefinitionsliste in Formatversion 8.           |
| `WertungV7`                         | type | Felder des Elements `WERTUNG` der Wettkampfdefinitionsliste in Formatversion 7.             |
| `WertungV8`                         | type | Felder des Elements `WERTUNG` der Wettkampfdefinitionsliste in Formatversion 8.             |
| `PflichtzeitV7`                     | type | Felder des Elements `PFLICHTZEIT` der Wettkampfdefinitionsliste in Formatversion 7.         |
| `PflichtzeitV8`                     | type | Felder des Elements `PFLICHTZEIT` der Wettkampfdefinitionsliste in Formatversion 8.         |
| `MeldegeldV7`                       | type | Felder des Elements `MELDEGELD` der Wettkampfdefinitionsliste in Formatversion 7.           |
| `MeldegeldV8`                       | type | Felder des Elements `MELDEGELD` der Wettkampfdefinitionsliste in Formatversion 8.           |
| `DateiendeV7`                       | type | Felder des Elements `DATEIENDE` der Wettkampfdefinitionsliste in Formatversion 7.           |
| `DateiendeV8`                       | type | Felder des Elements `DATEIENDE` der Wettkampfdefinitionsliste in Formatversion 8.           |
| `ErgebnisFormatV7`                  | type | Felder des Elements `FORMAT` der Wettkampfergebnisliste in Formatversion 7.                 |
| `ErgebnisFormatV8`                  | type | Felder des Elements `FORMAT` der Wettkampfergebnisliste in Formatversion 8.                 |
| `ErgebnisErzeugerV7`                | type | Felder des Elements `ERZEUGER` der Wettkampfergebnisliste in Formatversion 7.               |
| `ErgebnisErzeugerV8`                | type | Felder des Elements `ERZEUGER` der Wettkampfergebnisliste in Formatversion 8.               |
| `ErgebnisVeranstaltungV7`           | type | Felder des Elements `VERANSTALTUNG` der Wettkampfergebnisliste in Formatversion 7.          |
| `ErgebnisVeranstaltungV8`           | type | Felder des Elements `VERANSTALTUNG` der Wettkampfergebnisliste in Formatversion 8.          |
| `ErgebnisVeranstalterV7`            | type | Felder des Elements `VERANSTALTER` der Wettkampfergebnisliste in Formatversion 7.           |
| `ErgebnisVeranstalterV8`            | type | Felder des Elements `VERANSTALTER` der Wettkampfergebnisliste in Formatversion 8.           |
| `ErgebnisAusrichterV7`              | type | Felder des Elements `AUSRICHTER` der Wettkampfergebnisliste in Formatversion 7.             |
| `ErgebnisAusrichterV8`              | type | Felder des Elements `AUSRICHTER` der Wettkampfergebnisliste in Formatversion 8.             |
| `ErgebnisAbschnittV7`               | type | Felder des Elements `ABSCHNITT` der Wettkampfergebnisliste in Formatversion 7.              |
| `ErgebnisAbschnittV8`               | type | Felder des Elements `ABSCHNITT` der Wettkampfergebnisliste in Formatversion 8.              |
| `ErgebnisKampfgerichtV7`            | type | Felder des Elements `KAMPFGERICHT` der Wettkampfergebnisliste in Formatversion 7.           |
| `ErgebnisKampfgerichtV8`            | type | Felder des Elements `KAMPFGERICHT` der Wettkampfergebnisliste in Formatversion 8.           |
| `ErgebnisWettkampfV7`               | type | Felder des Elements `WETTKAMPF` der Wettkampfergebnisliste in Formatversion 7.              |
| `ErgebnisWettkampfV8`               | type | Felder des Elements `WETTKAMPF` der Wettkampfergebnisliste in Formatversion 8.              |
| `ErgebnisWertungV7`                 | type | Felder des Elements `WERTUNG` der Wettkampfergebnisliste in Formatversion 7.                |
| `ErgebnisWertungV8`                 | type | Felder des Elements `WERTUNG` der Wettkampfergebnisliste in Formatversion 8.                |
| `ErgebnisVereinV7`                  | type | Felder des Elements `VEREIN` der Wettkampfergebnisliste in Formatversion 7.                 |
| `ErgebnisVereinV8`                  | type | Felder des Elements `VEREIN` der Wettkampfergebnisliste in Formatversion 8.                 |
| `ErgebnisPnergebnisV7`              | type | Felder des Elements `PNERGEBNIS` der Wettkampfergebnisliste in Formatversion 7.             |
| `ErgebnisPnergebnisV8`              | type | Felder des Elements `PNERGEBNIS` der Wettkampfergebnisliste in Formatversion 8.             |
| `ErgebnisPnzwischenzeitV7`          | type | Felder des Elements `PNZWISCHENZEIT` der Wettkampfergebnisliste in Formatversion 7.         |
| `ErgebnisPnzwischenzeitV8`          | type | Felder des Elements `PNZWISCHENZEIT` der Wettkampfergebnisliste in Formatversion 8.         |
| `ErgebnisPnreaktionV7`              | type | Felder des Elements `PNREAKTION` der Wettkampfergebnisliste in Formatversion 7.             |
| `ErgebnisPnreaktionV8`              | type | Felder des Elements `PNREAKTION` der Wettkampfergebnisliste in Formatversion 8.             |
| `ErgebnisStergebnisV7`              | type | Felder des Elements `STERGEBNIS` der Wettkampfergebnisliste in Formatversion 7.             |
| `ErgebnisStergebnisV8`              | type | Felder des Elements `STERGEBNIS` der Wettkampfergebnisliste in Formatversion 8.             |
| `ErgebnisStaffelpersonV7`           | type | Felder des Elements `STAFFELPERSON` der Wettkampfergebnisliste in Formatversion 7.          |
| `ErgebnisStaffelpersonV8`           | type | Felder des Elements `STAFFELPERSON` der Wettkampfergebnisliste in Formatversion 8.          |
| `ErgebnisStzwischenzeitV7`          | type | Felder des Elements `STZWISCHENZEIT` der Wettkampfergebnisliste in Formatversion 7.         |
| `ErgebnisStzwischenzeitV8`          | type | Felder des Elements `STZWISCHENZEIT` der Wettkampfergebnisliste in Formatversion 8.         |
| `ErgebnisStabloeseV7`               | type | Felder des Elements `STABLOESE` der Wettkampfergebnisliste in Formatversion 7.              |
| `ErgebnisStabloeseV8`               | type | Felder des Elements `STABLOESE` der Wettkampfergebnisliste in Formatversion 8.              |
| `ErgebnisDateiendeV7`               | type | Felder des Elements `DATEIENDE` der Wettkampfergebnisliste in Formatversion 7.              |
| `ErgebnisDateiendeV8`               | type | Felder des Elements `DATEIENDE` der Wettkampfergebnisliste in Formatversion 8.              |
| `MeldungFormatV7`                   | type | Felder des Elements `FORMAT` der Vereinsmeldeliste in Formatversion 7.                      |
| `MeldungFormatV8`                   | type | Felder des Elements `FORMAT` der Vereinsmeldeliste in Formatversion 8.                      |
| `MeldungErzeugerV7`                 | type | Felder des Elements `ERZEUGER` der Vereinsmeldeliste in Formatversion 7.                    |
| `MeldungErzeugerV8`                 | type | Felder des Elements `ERZEUGER` der Vereinsmeldeliste in Formatversion 8.                    |
| `MeldungVeranstaltungV7`            | type | Felder des Elements `VERANSTALTUNG` der Vereinsmeldeliste in Formatversion 7.               |
| `MeldungVeranstaltungV8`            | type | Felder des Elements `VERANSTALTUNG` der Vereinsmeldeliste in Formatversion 8.               |
| `MeldungAbschnittV7`                | type | Felder des Elements `ABSCHNITT` der Vereinsmeldeliste in Formatversion 7.                   |
| `MeldungAbschnittV8`                | type | Felder des Elements `ABSCHNITT` der Vereinsmeldeliste in Formatversion 8.                   |
| `MeldungWettkampfV7`                | type | Felder des Elements `WETTKAMPF` der Vereinsmeldeliste in Formatversion 7.                   |
| `MeldungWettkampfV8`                | type | Felder des Elements `WETTKAMPF` der Vereinsmeldeliste in Formatversion 8.                   |
| `MeldungVereinV7`                   | type | Felder des Elements `VEREIN` der Vereinsmeldeliste in Formatversion 7.                      |
| `MeldungVereinV8`                   | type | Felder des Elements `VEREIN` der Vereinsmeldeliste in Formatversion 8.                      |
| `MeldungAnsprechpartnerV7`          | type | Felder des Elements `ANSPRECHPARTNER` der Vereinsmeldeliste in Formatversion 7.             |
| `MeldungAnsprechpartnerV8`          | type | Felder des Elements `ANSPRECHPARTNER` der Vereinsmeldeliste in Formatversion 8.             |
| `MeldungKarimeldungV7`              | type | Felder des Elements `KARIMELDUNG` der Vereinsmeldeliste in Formatversion 7.                 |
| `MeldungKarimeldungV8`              | type | Felder des Elements `KARIMELDUNG` der Vereinsmeldeliste in Formatversion 8.                 |
| `MeldungKariabschnittV7`            | type | Felder des Elements `KARIABSCHNITT` der Vereinsmeldeliste in Formatversion 7.               |
| `MeldungKariabschnittV8`            | type | Felder des Elements `KARIABSCHNITT` der Vereinsmeldeliste in Formatversion 8.               |
| `MeldungTrainerV7`                  | type | Felder des Elements `TRAINER` der Vereinsmeldeliste in Formatversion 7.                     |
| `MeldungTrainerV8`                  | type | Felder des Elements `TRAINER` der Vereinsmeldeliste in Formatversion 8.                     |
| `MeldungPnmeldungV7`                | type | Felder des Elements `PNMELDUNG` der Vereinsmeldeliste in Formatversion 7.                   |
| `MeldungPnmeldungV8`                | type | Felder des Elements `PNMELDUNG` der Vereinsmeldeliste in Formatversion 8.                   |
| `MeldungHandicapV7`                 | type | Felder des Elements `HANDICAP` der Vereinsmeldeliste in Formatversion 7.                    |
| `MeldungHandicapV8`                 | type | Felder des Elements `HANDICAP` der Vereinsmeldeliste in Formatversion 8.                    |
| `MeldungStartpnV7`                  | type | Felder des Elements `STARTPN` der Vereinsmeldeliste in Formatversion 7.                     |
| `MeldungStartpnV8`                  | type | Felder des Elements `STARTPN` der Vereinsmeldeliste in Formatversion 8.                     |
| `MeldungStmeldungV7`                | type | Felder des Elements `STMELDUNG` der Vereinsmeldeliste in Formatversion 7.                   |
| `MeldungStmeldungV8`                | type | Felder des Elements `STMELDUNG` der Vereinsmeldeliste in Formatversion 8.                   |
| `MeldungStartstV7`                  | type | Felder des Elements `STARTST` der Vereinsmeldeliste in Formatversion 7.                     |
| `MeldungStartstV8`                  | type | Felder des Elements `STARTST` der Vereinsmeldeliste in Formatversion 8.                     |
| `MeldungStaffelpersonV7`            | type | Felder des Elements `STAFFELPERSON` der Vereinsmeldeliste in Formatversion 7.               |
| `MeldungStaffelpersonV8`            | type | Felder des Elements `STAFFELPERSON` der Vereinsmeldeliste in Formatversion 8.               |
| `MeldungDateiendeV7`                | type | Felder des Elements `DATEIENDE` der Vereinsmeldeliste in Formatversion 7.                   |
| `MeldungDateiendeV8`                | type | Felder des Elements `DATEIENDE` der Vereinsmeldeliste in Formatversion 8.                   |
| `VereinsergebnisFormatV7`           | type | Felder des Elements `FORMAT` der Vereinsergebnisliste in Formatversion 7.                   |
| `VereinsergebnisFormatV8`           | type | Felder des Elements `FORMAT` der Vereinsergebnisliste in Formatversion 8.                   |
| `VereinsergebnisErzeugerV7`         | type | Felder des Elements `ERZEUGER` der Vereinsergebnisliste in Formatversion 7.                 |
| `VereinsergebnisErzeugerV8`         | type | Felder des Elements `ERZEUGER` der Vereinsergebnisliste in Formatversion 8.                 |
| `VereinsergebnisVeranstaltungV7`    | type | Felder des Elements `VERANSTALTUNG` der Vereinsergebnisliste in Formatversion 7.            |
| `VereinsergebnisVeranstaltungV8`    | type | Felder des Elements `VERANSTALTUNG` der Vereinsergebnisliste in Formatversion 8.            |
| `VereinsergebnisVeranstalterV7`     | type | Felder des Elements `VERANSTALTER` der Vereinsergebnisliste in Formatversion 7.             |
| `VereinsergebnisVeranstalterV8`     | type | Felder des Elements `VERANSTALTER` der Vereinsergebnisliste in Formatversion 8.             |
| `VereinsergebnisAusrichterV7`       | type | Felder des Elements `AUSRICHTER` der Vereinsergebnisliste in Formatversion 7.               |
| `VereinsergebnisAusrichterV8`       | type | Felder des Elements `AUSRICHTER` der Vereinsergebnisliste in Formatversion 8.               |
| `VereinsergebnisAbschnittV7`        | type | Felder des Elements `ABSCHNITT` der Vereinsergebnisliste in Formatversion 7.                |
| `VereinsergebnisAbschnittV8`        | type | Felder des Elements `ABSCHNITT` der Vereinsergebnisliste in Formatversion 8.                |
| `VereinsergebnisKampfgerichtV7`     | type | Felder des Elements `KAMPFGERICHT` der Vereinsergebnisliste in Formatversion 7.             |
| `VereinsergebnisKampfgerichtV8`     | type | Felder des Elements `KAMPFGERICHT` der Vereinsergebnisliste in Formatversion 8.             |
| `VereinsergebnisWettkampfV7`        | type | Felder des Elements `WETTKAMPF` der Vereinsergebnisliste in Formatversion 7.                |
| `VereinsergebnisWettkampfV8`        | type | Felder des Elements `WETTKAMPF` der Vereinsergebnisliste in Formatversion 8.                |
| `VereinsergebnisWertungV7`          | type | Felder des Elements `WERTUNG` der Vereinsergebnisliste in Formatversion 7.                  |
| `VereinsergebnisWertungV8`          | type | Felder des Elements `WERTUNG` der Vereinsergebnisliste in Formatversion 8.                  |
| `VereinsergebnisVereinV7`           | type | Felder des Elements `VEREIN` der Vereinsergebnisliste in Formatversion 7.                   |
| `VereinsergebnisVereinV8`           | type | Felder des Elements `VEREIN` der Vereinsergebnisliste in Formatversion 8.                   |
| `VereinsergebnisPersonV7`           | type | Felder des Elements `PERSON` der Vereinsergebnisliste in Formatversion 7.                   |
| `VereinsergebnisPersonV8`           | type | Felder des Elements `PERSON` der Vereinsergebnisliste in Formatversion 8.                   |
| `VereinsergebnisPersonenergebnisV7` | type | Felder des Elements `PERSONENERGEBNIS` der Vereinsergebnisliste in Formatversion 7.         |
| `VereinsergebnisPersonenergebnisV8` | type | Felder des Elements `PERSONENERGEBNIS` der Vereinsergebnisliste in Formatversion 8.         |
| `VereinsergebnisPnzwischenzeitV7`   | type | Felder des Elements `PNZWISCHENZEIT` der Vereinsergebnisliste in Formatversion 7.           |
| `VereinsergebnisPnzwischenzeitV8`   | type | Felder des Elements `PNZWISCHENZEIT` der Vereinsergebnisliste in Formatversion 8.           |
| `VereinsergebnisPnreaktionV7`       | type | Felder des Elements `PNREAKTION` der Vereinsergebnisliste in Formatversion 7.               |
| `VereinsergebnisPnreaktionV8`       | type | Felder des Elements `PNREAKTION` der Vereinsergebnisliste in Formatversion 8.               |
| `VereinsergebnisStaffelV7`          | type | Felder des Elements `STAFFEL` der Vereinsergebnisliste in Formatversion 7.                  |
| `VereinsergebnisStaffelV8`          | type | Felder des Elements `STAFFEL` der Vereinsergebnisliste in Formatversion 8.                  |
| `VereinsergebnisStaffelpersonV7`    | type | Felder des Elements `STAFFELPERSON` der Vereinsergebnisliste in Formatversion 7.            |
| `VereinsergebnisStaffelpersonV8`    | type | Felder des Elements `STAFFELPERSON` der Vereinsergebnisliste in Formatversion 8.            |
| `VereinsergebnisStaffelergebnisV7`  | type | Felder des Elements `STAFFELERGEBNIS` der Vereinsergebnisliste in Formatversion 7.          |
| `VereinsergebnisStaffelergebnisV8`  | type | Felder des Elements `STAFFELERGEBNIS` der Vereinsergebnisliste in Formatversion 8.          |
| `VereinsergebnisStzwischenzeitV7`   | type | Felder des Elements `STZWISCHENZEIT` der Vereinsergebnisliste in Formatversion 7.           |
| `VereinsergebnisStzwischenzeitV8`   | type | Felder des Elements `STZWISCHENZEIT` der Vereinsergebnisliste in Formatversion 8.           |
| `VereinsergebnisStabloeseV7`        | type | Felder des Elements `STABLOESE` der Vereinsergebnisliste in Formatversion 7.                |
| `VereinsergebnisStabloeseV8`        | type | Felder des Elements `STABLOESE` der Vereinsergebnisliste in Formatversion 8.                |
| `VereinsergebnisDateiendeV7`        | type | Felder des Elements `DATEIENDE` der Vereinsergebnisliste in Formatversion 7.                |
| `VereinsergebnisDateiendeV8`        | type | Felder des Elements `DATEIENDE` der Vereinsergebnisliste in Formatversion 8.                |
