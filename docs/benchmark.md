# Benchmark

Gemessen mit `scripts/benchmark.ts`. Das Skript läuft **nicht** im Testlauf mit:
Es gibt keinen Schwellwert, gegen den sich prüfen liesse, und ein Durchgang über
50 MB gehört nicht in jeden `npm test`.

```
npx tsx scripts/benchmark.ts            # 50 MB
node --expose-gc --import tsx scripts/benchmark.ts   # zusätzlich Speichermessung
npx tsx scripts/benchmark.ts 0.65       # Zielgrösse in MB übersteuern
```

Der Zweck ist ausdrücklich nur, die Zahlen zu **kennen** und festzuhalten. Es
gibt keinen Vergleichswert — keine zweite Implementierung, an der zu messen
wäre.

## Was gemessen wird

Eine synthetisch erzeugte, **gültige** Wettkampfdefinitionsliste. Gültigkeit ist
hier keine Kosmetik: Eine Datei mit Befunden misst den Fehlerpfad und das
Anlegen von Diagnostics statt der eigentlichen Arbeit. Beide Leseebenen melden
im Lauf `0 Diagnostics`.

Die Masse der Datei kommt aus WERTUNG-Records. Sie dürfen unbegrenzt oft
vorkommen und tragen mit `wertungsId` eine Kennung ohne Wertebereich, sind also
beliebig oft eindeutig zu vergeben. WETTKAMPF ist über `wettkampfnr` auf 999
begrenzt; mehr davon erzeugte lauter Befunde.

## Ergebnis bei 50 MB

50,0 MB, 1.074.144 Zeilen, Node 24.12.0 auf darwin/arm64, drei Läufe.

| Phase               |        Zeit |   Durchsatz | gehaltener Speicher |
| ------------------- | ----------: | ----------: | ------------------: |
| Schema-freies Lesen |   0,7–0,9 s |  54–74 MB/s |              508 MB |
| Typisiertes Lesen   |   1,6–4,2 s |  12–31 MB/s |              690 MB |
| Schreiben           | 0,06–0,60 s | 83–777 MB/s |               50 MB |
| Projektion          |   0,5–2,9 s | 17–102 MB/s |              148 MB |

RSS am Ende des Laufs: 1,0–1,7 GB.

## Ergebnis bei realistischer Grösse

Die grösste echte Datei im Bestand hat rund 14.000 Zeilen. Zum Vergleich
dieselbe Messung bei 0,7 MB und 15.225 Zeilen:

| Phase               |  Zeit | Durchsatz | gehaltener Speicher |
| ------------------- | ----: | --------: | ------------------: |
| Schema-freies Lesen | 10 ms |   62 MB/s |                7 MB |
| Typisiertes Lesen   | 46 ms |   14 MB/s |               10 MB |
| Schreiben           |  1 ms |  900 MB/s |                1 MB |
| Projektion          |  6 ms |  107 MB/s |                2 MB |

Alles zusammen bleibt unter 65 ms und unter 20 MB. Für den tatsächlichen
Anwendungsfall ist die Bibliothek damit unauffällig.

## Beobachtungen

Drei Dinge sind der Erwähnung wert. Keines davon ist ein Fehler, aber jedes
gehört gewusst.

**Der Speicher wächst um etwa das Zehnfache der Eingabe.** Das schema-freie
Dokument hält rund das 10-fache, die typisierte Ebene zusammen mit ihm rund das
14-fache. Das ist die unmittelbare Folge einer bewussten Entscheidung: Jedes
Item führt seinen Rohtext mit, damit byte-identisch zurückgeschrieben werden
kann, und die typisierte Ebene legt zusätzlich je Record ein Objekt mit den
Feldwerten unter ihren Schema-Namen an. Wer eine 50-MB-Datei liest, braucht
also über ein Gigabyte. Bei realistischen Dateien sind das 20 MB, und damit
belanglos.

**Die Zeiten schwanken bei 50 MB um den Faktor zwei bis drei**, während der
gehaltene Speicher über alle Läufe auf das MB stabil bleibt. Das
schema-freie Lesen bleibt mit 0,7–0,9 s ruhig; typisiertes Lesen und Projektion
schwanken stark. Das passt zum Speicherbild: Bei 1,5 GB RSS bestimmt der
Aufräumer die Laufzeit, nicht der Code. Bei realistischer Grösse verschwindet
die Schwankung.

**Schreiben ist um eine Grössenordnung schneller als Lesen.** Das ist zu
erwarten und bestätigt, dass der Writer den mitgeführten Rohtext zurückspielt,
statt die Zeilen zu rekonstruieren — er bestätigt im Lauf zugleich, dass das
Ergebnis byte-identisch ist.

Ein Streaming-Weg würde die Speicherfrage lösen und stünde einer künftigen
Version gut an. `collectItems` nimmt bereits ein `Iterable` entgegen, genau
dafür. Solange reale Dateien bei 14.000 Zeilen liegen, lohnt der Aufwand nicht.
