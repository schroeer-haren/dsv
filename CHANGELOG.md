# Changelog

## 0.4.0

Die beiden Vereinslisten sind jetzt typisiert — damit sind **alle vier
Listenarten** des DSV-Standards vollständig erschlossen. Wer bisher nur
Veranstalterdateien typisiert lesen konnte, bekommt nun dieselbe Ebene für die
Vereinsseite: die Meldung, die ein Verein abgibt, und das Protokoll, das er
zurückbekommt. Die schema-freie Ebene aus 0.1.0 sowie die beiden
Wettkampflisten aus 0.2.0 und 0.3.0 bleiben unverändert gültig.

### Enthalten

- `parseVereinsmeldeliste(text)`, `writeVereinsmeldeliste(records, options)` und
  `projectVereinsmeldeliste(liste)`. Alle 17 Elemente der Vereinsmeldeliste sind
  mit Feldnamen, Datentypen, Pflichtangaben, Aufzählungswerten und
  Kardinalitäten beschrieben. Der Objektgraph hängt Meldungen an ihre Person,
  Personen an ihren Trainer und Staffelbesetzungen an ihre Staffelmeldung; dazu
  Index-Maps über Wettkampf, Abschnitt, Meldung, Staffelmeldung, Kampfrichter
  und Trainer
- `parseVereinsergebnisliste(text)`, `writeVereinsergebnisliste(records, options)`
  und `projectVereinsergebnisliste(liste)`. Alle 20 Elemente der
  Vereinsergebnisliste sind beschrieben. Der Objektgraph verbindet Personen mit
  ihren Starts, Starts mit Platzierungen, Zwischenzeiten und Reaktionszeiten,
  Staffeln mit ihrer Besetzung und den Ablösezeiten
- Anders als die Wettkampfergebnisliste kennt die Vereinsergebnisliste `PERSON`
  als eigenes Element. Die Person muss deshalb nicht aus den Ergebniszeilen
  zusammengesetzt werden — sie steht in der Datei. Die Typnamen tragen darum je
  Listenart ein Präfix (`Vereinsergebnis…`, `Meldung…`): Dieselben Begriffe sind
  je Listenart anders modelliert
- Neue Regel: Bei gemischten Wettkämpfen (Geschlecht `X`) ist als Zuordnung zur
  Bestenliste `SW` anzugeben. Gemeldet als **Warnung**, nicht als Fehler — siehe
  unten
- Neue Regel: Die Wertungs-ID eines Ergebnisses muss auf eine Wertung des
  eigenen Wettkampfs zeigen. Ein Fremdbezug wird als `dangling-reference`
  gemeldet
- `SB10` wird als Startklasse für Brust jetzt akzeptiert. Der Werteliste der
  Spezifikation fehlt `SB10`, während `S10` und `SM10` bei den beiden anderen
  Startklassen stehen — eine Lücke der Vorlage, kein Verbot. Der Wert wird
  gelesen und geschrieben und erzeugt eine Diagnostic der Severity `info`

### Behoben

- Die elementübergreifenden Regeln hingen an festen Feldpositionen und an
  aufgezählten Elementnamen. In der Vereinsergebnisliste heissen dieselben
  Elemente anders (`PERSONENERGEBNIS`/`STAFFELERGEBNIS` statt
  `PNERGEBNIS`/`STERGEBNIS`) und die Felder liegen an anderer Stelle — die
  Regeln griffen dort **gar nicht**. Sie binden jetzt zur Laufzeit über
  Feldnamen an das Schema der jeweiligen Listenart. Dabei kam ein zweiter Fehler
  heraus: Die Regel zum Qualifikationswettkampf las Feldindex 9. Die
  Vereinsmeldeliste kennt kein Feld `zuordnungBestenliste`, dort steht an dieser
  Stelle die Qualifikationsart — die Regel prüfte also das falsche Feld
- `Wettkampfdefinitionsliste` und `Wettkampfergebnisliste` waren seit dem
  Zusammenlegen von Parser und Writer in 0.3.0 strukturgleich und damit
  wechselseitig zuweisbar: `projectWettkampfdefinitionsliste(ergebnisliste)`
  kam durch den Compiler. `TypedList` trägt jetzt einen Typparameter für die
  Listenart, getragen von einem optionalen Phantomfeld, das nie gesetzt wird und
  zur Laufzeit nicht existiert. Das Verhalten ändert sich dadurch nicht

### Zu beachten: die Typunterscheidung ist strenger

Die Wiederherstellung der Typunterscheidung ist **nur auf Typebene** sichtbar —
zur Laufzeit ändert sich nichts, und `src/index.ts` ist gegenüber 0.3.0 rein
additiv. Für TypeScript-Nutzer gibt es aber zwei sichtbare Effekte:

- Code, der eine Ergebnisliste an eine Definitionslisten-Funktion übergab,
  kompiliert nicht mehr. Das war schon in 0.3.0 falsch und lieferte einen
  Objektgraph aus fehlgedeuteten Feldern; der Compiler hat es nur nicht bemerkt.
- Wer eine Liste mit dem seit 0.3.0 öffentlichen Typ `TypedList` **ohne**
  Typargument annotiert und dann an eine listenartspezifische Funktion
  weiterreicht, bekommt jetzt ebenfalls einen Fehler. Das trifft auch Code, der
  vorher korrekt war. Abhilfe: den passenden Alias verwenden
  (`Wettkampfergebnisliste`) oder das Typargument angeben
  (`TypedList<'Wettkampfergebnisliste'>`).

Streng nach SemVer ist der zweite Punkt ein Breaking Change auf Quellcode-Ebene.
Er wird hier trotzdem in einem Minor-Release ausgeliefert: Das Paket steht in
`0.x`, wo die öffentliche Schnittstelle laut SemVer ausdrücklich noch nicht
stabilisiert ist, die Laufzeit ist nicht betroffen, ein Build bricht sofort und
sichtbar statt still falsche Ergebnisse zu liefern, und die Behebung ist eine
Textänderung an der Typannotation.

### Was echte Dateien auslösen

- **Gemischte Wettkämpfe.** Von den 244 Wettkämpfen mit Geschlecht `X` in den
  echten Dateien halten sich nur 170 an die Vorgabe `SW`. Die übrigen 74 tragen
  `KG` (33×, kindgerechte Wettkämpfe) oder `MS` (41×, Masters) — beides fachlich
  sinnvolle Zuordnungen, die die Regel der Spezifikation so nicht vorsieht. Als
  Fehler gemeldet wiese die Bibliothek Protokolle zurück, die real im Umlauf
  sind. Deshalb ist es eine Warnung.
- **Wertungs-ID.** Umgekehrt bei der zweiten neuen Regel: Alle 97.330 Ergebnisse
  der 72 echten Wettkampfergebnislisten zeigen auf eine Wertung ihres eigenen
  Wettkampfs — kein einziger Verstoss. Eine Regel, die an so vielen echten
  Datensätzen ausnahmslos gilt, darf ein Fehler sein.

Beide Zahlen erklären, warum auch weitgehend fehlerfreie Dateien Befunde
erzeugen: Die Warnung zur Bestenliste feuert bei knapp einem Drittel der
gemischten Wettkämpfe, und das ist kein Mangel der Dateien, sondern eine Regel
der Spezifikation, an die sich die Praxis nicht hält.

### Geprüft

1358 Tests. Der byte-identische Round-Trip aus 0.1.0 gilt unverändert über alle
echten Wettkampfdateien.

## 0.3.0

Die Wettkampfergebnisliste ist jetzt vollständig typisiert. Damit ist die
interessanteste Listenart erschlossen: Wer bisher Ergebnisse aus nummerierten
Feldern zusammensuchen musste, bekommt nun benannte Felder, geprüfte Werte und
einen Objektgraph, in dem Starts, Platzierungen, Zwischenzeiten und Staffeln
bereits zusammenhängen. Die schema-freie Ebene aus 0.1.0 und die
Wettkampfdefinitionsliste aus 0.2.0 bleiben unverändert gültig.

### Enthalten

- `parseWettkampfergebnisliste(text)` liefert typisierte Records: Feldwerte
  stehen unter ihrem Schema-Namen statt unter einem Index
- `writeWettkampfergebnisliste(records, options)` schreibt aus typisierten
  Records kanonisch zurück und validiert dabei streng — wie bei der
  Definitionsliste verhindert hier, was beim Lesen nur eine Warnung war, das
  Schreiben
- `projectWettkampfergebnisliste(liste)` baut einen Objektgraph: Abschnitte mit
  Kampfgericht und Wettkämpfen, Wettkämpfe mit ihren Wertungen, Starts und
  Staffeln, Starts mit ihren Platzierungen, Zwischenzeiten und Reaktionszeiten.
  Dazu Index-Maps über Wettkampf, Wertung, Abschnitt, Verein, Start, Staffel und
  Schwimmer
- Alle 18 Elemente der Wettkampfergebnisliste sind mit Feldnamen, Datentypen,
  Pflichtangaben, Aufzählungswerten und Kardinalitäten beschrieben
- Die Entität `Schwimmer` steht so in keiner Datei: Die Ergebnisliste kennt nur
  einen denormalisierten Flachsatz, der dieselbe Person je Wertung wiederholt.
  Der Objektgraph fasst diese Zeilen zu einem `Start` je Person und Wettkampf
  zusammen; die Wertungen hängen als `Platzierung` daran
- Neue Querregel: Ist ein Grund der Nichtwertung gesetzt, muss der Platz 0 sein
- Neue Warnung `incomplete-relay` für Staffeln, die einige, aber nicht alle
  Teilnehmenden nennen
- Parser und Writer arbeiten intern listenartunabhängig (`parseTypedList`,
  `writeTypedList`); beide Listenarten sind nur noch dünne Wrapper darüber. Neu
  öffentlich ist der Typ `TypedList`

### Behoben

- Der Objektgraph verdoppelte die Mitglieder einer Staffel, wenn diese in
  mehreren Wertungen platziert war: Eine Viererstaffel erschien mit acht
  Personen, Zwischenzeiten entsprechend doppelt. In den echten Dateien betraf
  das 72 Staffeln und 57 mit doppelten Zwischenzeiten; nach dem Fix bleibt keine
  einzige übrig

### Was echte Dateien auslösen

Diese Befunde stammen aus 72 echten Wettkampfergebnislisten und erklären, warum
auch weitgehend fehlerfreie Dateien Befunde erzeugen:

- Alle 72 Dateien werden ohne einen einzigen `fatal`-Befund gelesen. 48 von
  ihnen validieren ganz ohne Fehler; die übrigen 24 haben ausschliesslich leere
  Pflichtfelder (`missing-required-field`, 49 Fälle) — ein echter Mangel der
  Dateien, kein Formatdialekt. Mit Abstand am häufigsten fehlt der Verein des
  Kampfrichters: 35 der 49 Fälle, verteilt auf 15 Dateien. Der Rest verteilt
  sich auf das Nationenkürzel des Vereins (7 Fälle in 6 Dateien) und einzelne
  Angaben zu Ausrichter und Veranstalter.
- Die Regel „bei Nichtwertung Platz 0" halten die echten Dateien ausnahmslos
  ein: 10.865 Zeilen tragen einen Grund der Nichtwertung, keine einzige weicht
  ab. Deshalb ist der Verstoss ein Fehler und keine Warnung.
- 46 Prozent aller Wertungen tragen keinen einzigen Ergebnissatz — 7860 von
  16.989 in den 48 fehlerfreien Dateien. Die Spezifikation verlangt für jede
  definierte Wertung eine Platzierung, doch das ist die Arbeitsweise der
  Ausschreibung: Sie erzeugt das volle Kreuzprodukt aus Jahrgang und
  Geschlecht, und die meisten dieser Klassen bekommen nie eine Meldung. Die
  leere Wertung ist der Normalfall. Eine Warnung, die 7860 mal feuert und die
  niemand abstellen kann, wäre Lärm — deshalb wird die Regel **bewusst nicht**
  geprüft.
- Die Identität einer Staffel ist das Tripel aus Veranstaltungs-ID,
  Wettkampfnummer und Wettkampfart, nicht die ID allein: In den 48 fehlerfreien
  Dateien starten 152 Staffelkennungen in mehr als einem Wettkampf. Eine
  Auflösung über die ID allein hätte diese Mannschaften miteinander vermengt.
- Die Vereinskennzahl `0` kennzeichnet Vereine ausserhalb des DSV. Sie ist kein
  Schlüssel und bleibt deshalb aus `vereinByKennzahl` heraus.

### Geprüft

1153 Tests. Die Befunde oben sind an den 72 echten Wettkampfergebnislisten
nachgerechnet; der byte-identische Round-Trip aus 0.1.0 gilt unverändert über
alle 108 echten Wettkampfdateien.

### Breaking

Keine. Alle Exporte aus 0.2.0 bestehen unverändert fort; `src/index.ts` ist
gegenüber `v0.2.0` reiner Zuwachs. Drei Punkte, die bei sehr strenger Auslegung
auffallen können:

- `Wettkampfdefinitionsliste` war ein eigenes `interface` und ist jetzt ein
  Alias auf den gemeinsamen Typ `TypedList`. Die Gestalt ist Feld für Feld
  dieselbe (`listenart`, `version`, `records`, `document`), Zuweisungen und
  `extends` funktionieren unverändert. Sichtbar wird der Unterschied nur an zwei
  Stellen: Ein `declare module`-Merge auf das frühere Interface geht nicht mehr,
  und Definitions- und Ergebnisliste sind nun wechselseitig zuweisbar — ein
  Versehen wie `projectWettkampfdefinitionsliste(ergebnisliste)` fängt der
  Compiler nicht mehr ab, sondern erst die Auswertung zur Laufzeit.
- `TypedRecord` wird jetzt aus `parse-typed-list.js` exportiert. Über den
  Paket-Einstiegspunkt ändert sich nichts, und der frühere Pfad re-exportiert
  den Typ weiterhin.
- `DiagnosticCode` hat die Variante `incomplete-relay` bekommen. Wer über den
  Typ erschöpfend `switch`t, muss den neuen Fall abdecken.

## 0.2.0

Die Wettkampfdefinitionsliste ist jetzt vollständig typisiert. Wer bisher nur
Records mit nummerierten Feldern in der Hand hatte, bekommt nun benannte Felder,
geprüfte Werte und einen Objektgraph mit aufgelösten Bezügen. Die schema-freie
Ebene aus 0.1.0 bleibt unverändert gültig und weiterhin für alle vier
Listenarten zuständig.

### Enthalten

- `parseWettkampfdefinitionsliste(text)` liefert typisierte Records: Feldwerte
  stehen unter ihrem Schema-Namen statt unter einem Index
- `writeWettkampfdefinitionsliste(records, options)` schreibt aus typisierten
  Records kanonisch zurück und validiert dabei streng — was beim Lesen nur eine
  Warnung war, verhindert hier das Schreiben
- `projectWettkampfdefinitionsliste(liste)` baut einen Objektgraph: Abschnitte
  mit ihren Wettkämpfen, Wettkämpfe mit ihren Wertungen und Pflichtzeiten, dazu
  Index-Maps über Wettkampf, Wertung und Abschnitt. Datum, Uhrzeit und Zeit sind
  dekodiert, alle übrigen Werte bleiben Zeichenketten
- Alle 19 Elemente der Wettkampfdefinitionsliste sind mit Feldnamen, Datentypen,
  Pflichtangaben, Aufzählungswerten und Kardinalitäten beschrieben
- Validiert werden Feldanzahl, Pflichtfelder, Werttypen, Aufzählungswerte,
  Zahlenbereiche, Kardinalitäten und elementübergreifende Regeln
- Versionsabhängigkeit: einzelne Felder, ganze Elemente und einzelne
  Aufzählungswerte können erst ab DSV8 gelten. Eine DSV7-Datei mit DSV8-Inhalten
  wird beanstandet
- DSV6 wird bereits auf Schema-Ebene mit `fatal` abgelehnt
- Aufzählungsfelder erscheinen in den generierten Typen als
  String-Literal-Union statt als `string`, ebenfalls versionsabhängig
- Ein Wettkampf wird über das Paar aus Nummer und Art identifiziert, nicht über
  die Nummer allein — dieselbe Nummer kommt regelmässig als Vorlauf und als
  Entscheidung vor

### Behoben

- Datumsangaben werden gegen den Kalender geprüft: der 31. Februar wird
  abgelehnt, nicht mehr stillschweigend übernommen

### Was echte Dateien auslösen

Diese Befunde stammen aus 31 echten Wettkampfdefinitionslisten und erklären,
warum auch fehlerfreie Dateien Warnungen erzeugen können:

- 27 der 31 Dateien validieren ohne einen einzigen Fehler. Die übrigen vier
  haben ein leeres Pflichtfeld `BESONDERES.anmerkungen` — ein echter Mangel der
  Dateien, kein Formatdialekt, und deshalb ein Fehler.
- Eine Ausschreibung schreibt die Wettkampfart `N` für Nachschwimmen, obwohl die
  Spezifikation `A` und `N` nur in Ergebnislisten vorsieht. Solche Werte sind im
  Schema ausdrücklich als toleriert markiert: beim Lesen gibt es eine Warnung,
  beim Schreiben sind sie unzulässig. <sup>[1]</sup>

- 22 von 67 Zwischenläufen und Finals nennen keine
  Qualifikationswettkampfnummer, obwohl die Spezifikation sie verlangt. Weil das
  in der Praxis verbreitet ist, gibt es eine Warnung statt eines Fehlers.
- Zwei Dateien enthalten Verweise, bei denen die Wettkampfnummer stimmt, die
  Wettkampfart aber nicht — genau die Fehlerklasse, die eine Auflösung über die
  Nummer allein verschluckt hätte.

#### Richtigstellung

<sup>[1]</sup> Dieser Punkt schrieb ursprünglich die Wettkampfart `N` „dem
DSV-Portal" zu. Das war falsch und wurde nachträglich korrigiert. Die Datei
`dsvportal-13062024-Wk.dsv7` trägt das Präfix nur, weil sie von dort
heruntergeladen wurde; ihr `ERZEUGER`-Element weist **EasyWk 5.25** als
schreibende Software aus. Über welche Software das DSV-Portal Dateien ausgibt,
lässt der Bestand nicht erkennen.

Ausserdem war die Formulierung zu breit: Von den geprüften echten Dateien
schreibt genau eine Ausschreibung ein `N` (dreimal), und `A` kommt gar nicht in
einer Ausschreibung vor, sondern einmal in einer Ergebnisliste. Die Toleranz im
Schema bleibt davon unberührt, nur die Begründung war es nicht.

### Geprüft

893 Tests. Die Befunde oben sind an den 31 echten Wettkampfdefinitionslisten
nachgerechnet; der byte-identische Round-Trip aus 0.1.0 gilt unverändert über
alle 108 echten Wettkampfdateien.

### Breaking

Keine. Alle Exporte aus 0.1.0 — `parseDsv`, `parseDsvOrThrow`, `DsvParseError`,
`writeDsv` samt zugehörigen Typen — bestehen unverändert fort; ihre Signaturen
und die Gestalt von `DsvDocument` sind gleich geblieben. Zwei Punkte, die bei
sehr strenger Auslegung auffallen können:

- `DiagnosticCode` hat neue Varianten bekommen. Wer über den Typ erschöpfend
  `switch`t, muss die neuen Fälle abdecken.
- `parseDsv` meldet neu `element-order-violation` als Warnung, wenn `DATEIENDE`
  nicht das letzte Element ist. Dateien, die bisher ohne Diagnostics durchliefen,
  können dadurch eine Warnung erzeugen; `ok` bleibt davon unberührt.

## 0.1.0

Erste nutzbare Fassung. Liest DSV-Dateien aller vier Listenarten zeilenweise in
Records und schreibt sie byte-identisch zurück — einschliesslich BOM,
Zeilenenden, Kommentaren und Leerzeichen um Werte.

Noch ohne Schema-Validierung und ohne typisierte Listenarten; beides folgt ab
0.2.0.

### Enthalten

- `parseDsv(text)` liefert Dokument, Diagnostics und `ok`
- `parseDsvOrThrow(text)` wirft stattdessen einen `DsvParseError`
- `writeDsv(document)` schreibt ein unverändertes Dokument byte-identisch zurück
- Diagnostics mit Code, Severity und 1-basierter Position statt Ausnahmen beim
  Lesen

### Geprüft

Der Round-Trip ist über 108 echte, anonymisierte Wettkampfdateien byte-identisch.
Ein Mutationsdurchlauf über 33 eingebaute Fehler wird vollständig von der
Testsuite gefangen.

### Breaking

Die Platzhalter `parseLine`, `formatLine`, `DSV_FORMATS`, `FIELD_SEPARATOR` und
der Typ `DsvFormat` sind entfallen.
