# Baugeschichte

Die Dateien in diesem Ordner sind **Prozessartefakte, keine Dokumentation.**
Sie halten fest, wie `@schroeer-haren/dsv` zwischen 0.1.0 und 1.0 entstanden
ist: die Zielsetzung, der Zuschnitt der Meilensteine, die Aufgabenlisten und
die Begründungen, aus denen heraus entschieden wurde.

**Nichts hier ist eine gültige Aussage über den heutigen Stand.** Mehrere der
beschriebenen Entwürfe wurden später revidiert — teils weil sich an echten
Dateien zeigte, dass sie nicht tragen, teils weil sich beim Bauen eine bessere
Lösung ergab. Wer wissen will, wie die Bibliothek heute aufgebaut ist, liest
[`../architecture.md`](../architecture.md); wer wissen will, was sie
exportiert, [`../public-api.md`](../public-api.md).

## Warum sie trotzdem im Repository bleiben

Der Wert dieser Texte liegt nicht in ihren Ergebnissen, sondern in ihren
Begründungen. Sie beantworten die Frage, die einem Architekturdokument
systematisch fehlt: **was verworfen wurde und warum.** Ohne sie steht in
`architecture.md` nur die Entscheidung, nicht die Alternative — und die
nächste Person, die dieselbe Alternative naheliegend findet, muss den Weg
noch einmal gehen. Ein Beispiel ist die reine Typinferenz über `as const` und
Mapped Types: technisch machbar, aber am JSDoc pro Feld gescheitert. Diese
Sackgasse zweimal zu betreten wäre teuer.

## Wie sie gekennzeichnet sind

Drei Massnahmen, weil jede eine andere Art von Leser erreicht:

1. **Der Ordnername** (`history/`) — erreicht, wer `docs/` durchblättert.
2. **Der Eintrag im Wegweiser** ([`../README.md`](../README.md)) — erreicht,
   wer die Dokumentation von vorne liest.
3. **Eine Vorbemerkung in jeder einzelnen Datei** — erreicht als Einziges auch
   den, der über eine Codesuche, einen Deep Link oder ein Lesezeichen mitten in
   einer Datei landet und den Ordner nie sieht. Das ist der wahrscheinlichste
   Weg, auf dem jemand diese Texte für gültig hält, und deshalb die einzige
   Massnahme, auf die nicht verzichtet werden kann.

Die Dateien werden nicht mehr geändert. Wo eine Aussage nicht mehr stimmt,
wird sie hier nicht berichtigt, sondern in `architecture.md` richtig
aufgeschrieben — eine nachträglich korrigierte Historie wäre keine mehr.

## Inhalt

| Datei                                                                                                  | Was darin steht                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| [`specs/2026-07-18-weg-zu-v1-design.md`](specs/2026-07-18-weg-zu-v1-design.md)                         | Die Zielsetzung für 1.0 und der Schnitt in Meilensteine: was v1 können muss und in welcher Reihenfolge.           |
| [`plans/2026-07-18-m0-m1-fundament.md`](plans/2026-07-18-m0-m1-fundament.md)                           | Typ-Spike (Codegen gegen Typinferenz) und das domänenfreie Fundament: `diagnostics`, `source`, `lexer`, `values`. |
| [`plans/2026-07-18-m2-wettkampfdefinitionsliste.md`](plans/2026-07-18-m2-wettkampfdefinitionsliste.md) | Die erste typisierte Listenart — der vertikale Durchstich durch alle Schichten.                                   |
| [`plans/2026-07-19-m3-wettkampfergebnisliste.md`](plans/2026-07-19-m3-wettkampfergebnisliste.md)       | Die zweite Listenart, als Probe darauf, ob die Architektur über eine hinaus trägt.                                |
| [`plans/2026-07-19-m4-vereinslisten.md`](plans/2026-07-19-m4-vereinslisten.md)                         | Die beiden Vereinslisten — und der Umgang damit, dass für eine davon keine echten Dateien existieren.             |
