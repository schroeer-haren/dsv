# Changelog

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
- Das DSV-Portal schreibt in Ausschreibungen die Wettkampfart `N` für
  Nachschwimmen, obwohl die Spezifikation `A` und `N` nur in Ergebnislisten
  vorsieht. Solche Werte sind im Schema ausdrücklich als toleriert markiert:
  beim Lesen gibt es eine Warnung, beim Schreiben sind sie unzulässig.
- 22 von 67 Zwischenläufen und Finals nennen keine
  Qualifikationswettkampfnummer, obwohl die Spezifikation sie verlangt. Weil das
  in der Praxis verbreitet ist, gibt es eine Warnung statt eines Fehlers.
- Zwei Dateien enthalten Verweise, bei denen die Wettkampfnummer stimmt, die
  Wettkampfart aber nicht — genau die Fehlerklasse, die eine Auflösung über die
  Nummer allein verschluckt hätte.

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
