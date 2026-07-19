# Dokumentation

Wegweiser durch `docs/`. Der Einstieg für Anwender ist die
[README im Wurzelverzeichnis](../README.md); hier steht, was darüber
hinausgeht.

## Welches Dokument beantwortet welche Frage

| Dokument                                         | Beantwortet                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [`beispiele.md`](beispiele.md)                   | „Wie mache ich X?" — lauffähiger Code je Listenart und Anwendungsfall, mit tatsächlicher Ausgabe. |
| [`public-api.md`](public-api.md)                 | „Was gibt es, und was tut es?" — jeder Export mit einer Zeile Beschreibung.                       |
| [`public-api-surface.md`](public-api-surface.md) | „Woraus besteht dieser Typ?" — jedes Feld jedes exportierten Typs.                                |
| [`architecture.md`](architecture.md)             | „Warum ist das so gebaut?" — Schichten, Entscheidungen und ihre Begründungen.                     |
| [`benchmark.md`](benchmark.md)                   | „Wie schnell ist das, und wie viel Speicher braucht es?"                                          |
| [`history/`](history/README.md)                  | „Wie ist das entstanden, und was wurde verworfen?" — **kein gültiger Ist-Stand.**                 |

## Was generiert ist und nicht von Hand geändert werden darf

**[`public-api-surface.md`](public-api-surface.md) ist generiert.** Sie
entsteht aus `scripts/api-surface.ts` und wird mit `npm run api-surface` neu
erzeugt. Änderungen von Hand gehen beim nächsten Lauf verloren, und
`npm run api-surface:check` schlägt in CI fehl, sobald die Datei nicht mehr zum
Quellstand passt. Wer sie ändern will, ändert die Typen in `src/`.

Alle übrigen Dateien in `docs/` werden von Hand gepflegt. Zwei davon sind
zusätzlich abgesichert:

- **[`public-api.md`](public-api.md)** wird von `test/public-api.test.ts` gegen
  die tatsächlichen Exporte aus `src/index.ts` geprüft — ein neuer Export ohne
  Eintrag lässt den Testlauf scheitern.
- **[`beispiele.md`](beispiele.md)** enthält ausschließlich Ausgaben, die gegen
  den gebauten `dist/`-Stand ausgeführt wurden. Wer ein Beispiel ändert, führt
  es aus und trägt ein, was tatsächlich herauskommt — nichts anderes.

## `history/` ist Baugeschichte, keine Dokumentation

[`history/`](history/README.md) enthält die Spezifikations- und Planungstexte
aus der Entwicklung vor 1.0. Sie halten fest, **warum** entschieden wurde, wie
entschieden wurde — auch dort, wo die Entscheidung später revidiert wurde. Als
Aussage über den heutigen Stand sind sie **nicht** gültig; jede Datei trägt
dazu eine Vorbemerkung. Verbindlich ist `architecture.md`.
