# Changelog

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
