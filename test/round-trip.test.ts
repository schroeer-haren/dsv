import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDsv } from '../src/parse/parse-dsv.js';
import { writeDsv } from '../src/write/write-dsv.js';

const DIR = 'test/fixtures/real';
const files = readdirSync(DIR).filter((f) => /\.dsv[678]?$/i.test(f));

const read = (name: string): string => readFileSync(join(DIR, name), 'utf8');

/**
 * Fünf Fixtures deklarieren die ältere Formatversion 6. Sie werden hier
 * getrennt geführt: Ihre Zeilensyntax ist über alle Formatversionen identisch,
 * sie zerfallen also sauber in Records und gehen byte-identisch durch den
 * Round-Trip — abgelehnt werden sie trotzdem, auf jeder Ebene.
 */
const dsv6Files = files.filter((f) => parseDsv(read(f)).document.version === 6);
const dsv7Files = files.filter((f) => parseDsv(read(f)).document.version === 7);

describe('Round-Trip über echte Dateien', () => {
  it('findet den erwarteten Bestand', () => {
    expect(files).toHaveLength(142);
  });

  /**
   * `test/fixtures/real/` wird von `scripts/anonymize.ts` bei jedem Lauf
   * vollständig neu geschrieben. Festgehalten waren bisher nur Dateizahl und
   * Formatversionen — die Eigenschaften darunter könnten also still
   * verschwinden, ohne dass ein Test rot wird. Genau das ist einmal beinahe
   * passiert: Ein `.gitattributes`-Eintrag mit `text eol=crlf` hätte alle
   * LF-Dateien normalisiert und den LF-Pfad über Realdaten unbemerkt
   * abgeschaltet.
   */
  it('behält die Mischung aus CRLF und LF', () => {
    const endings = { crlf: 0, lf: 0, mixed: 0 };

    for (const name of files) {
      const text = read(name);
      const newlines = (text.match(/\n/g) ?? []).length;
      const carriageReturns = (text.match(/\r\n/g) ?? []).length;

      if (carriageReturns === newlines) endings.crlf++;
      else if (carriageReturns === 0) endings.lf++;
      else endings.mixed++;
    }

    expect(endings).toEqual({ crlf: 129, lf: 13, mixed: 0 });
  });

  /**
   * Die Erzeuger-Verteilung. Der Bestand ist stark EasyWk-lastig; gerade die
   * seltenen Erzeuger bringen die Formateigenheiten ein, an denen sich der
   * Parser bewährt (SPLASH schreibt `FORMAT:` ohne Leerzeichen, WebClub
   * kommentiert in eigenen Zeilen statt am Zeilenende). Fällt einer davon aus
   * dem Bestand, verliert die Suite eine Eigenheit, ohne dass es auffiele.
   */
  it('behält die Verteilung der erzeugenden Software', () => {
    const byErzeuger = new Map<string, number>();

    for (const name of files) {
      const record = parseDsv(read(name)).document.items.find(
        (item) => item.kind === 'element' && item.element === 'ERZEUGER',
      );
      const software = record?.kind === 'element' ? (record.fields[0] ?? '') : '(kein ERZEUGER)';
      byErzeuger.set(software, (byErzeuger.get(software) ?? 0) + 1);
    }

    expect(Object.fromEntries([...byErzeuger].sort())).toEqual({
      EasyWk: 91,
      'SPLASH Meet Manager 11': 9,
      Schwimmsoftware: 2,
      WebClub: 34,
      'cps-schwimm': 6,
    });
  });

  /**
   * Zwei in `CLAUDE.md` festgehaltene Eigenheiten echter Dateien, die bisher
   * nur implizit abgedeckt waren:
   *
   * - `FORMAT:` steht fast nie in Zeile 1 — davor steht ein Erzeuger-Kommentar.
   *   140 der 142 Dateien beginnen mit einem Kommentar. Verschwände das, liefe
   *   der Parser über Realdaten nie mehr gegen „FORMAT ist erstes *Element*,
   *   nicht erste Zeile".
   * - Nicht jeder Erzeuger schreibt ein Leerzeichen nach dem Doppelpunkt: 125
   *   Dateien tun es (EasyWk-Stil), 17 nicht (Splash-Stil). Beide Seiten müssen
   *   im Bestand bleiben, sonst deckt nur noch eine Variante den Trim ab.
   */
  it('behält Erzeuger-Kommentar vor FORMAT und beide Doppelpunkt-Stile', () => {
    const startsWithComment = files.filter(
      (name) => parseDsv(read(name)).document.items[0]?.kind === 'comment',
    );
    const withSpace = files.filter((name) => /^FORMAT: /m.test(read(name)));

    expect(startsWithComment).toHaveLength(140);
    expect(withSpace).toHaveLength(125);
    expect(files.length - withSpace.length).toBe(17);
  });

  /**
   * Der Bestand ist durchgehend UTF-8, kein CP1252 — 139 Dateien enthalten
   * Zeichen ausserhalb von ASCII (Umlaute in Namen, Vereinen, Orten). Würde
   * die Anonymisierung Namen auf ASCII reduzieren, verlöre die Suite den
   * Nachweis, dass Mehrbyte-Zeichen unbeschädigt durch Parser und Writer
   * gehen.
   */
  it('behält Nicht-ASCII-Zeichen in nahezu allen Dateien', () => {
    const nonAscii = files.filter((name) => [...read(name)].some((c) => c.codePointAt(0)! > 127));
    expect(nonAscii).toHaveLength(139);
  });

  it.each(files)('%s bleibt byte-identisch', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });

  it('teilt sich in 137 DSV7- und 5 DSV6-Dateien auf', () => {
    expect(dsv7Files).toHaveLength(137);
    expect(dsv6Files).toHaveLength(5);
  });

  it.each(dsv7Files)('%s wird ohne Fehler gelesen', (name) => {
    const errors = parseDsv(read(name)).diagnostics.filter(
      (d) => d.severity === 'error' || d.severity === 'fatal',
    );
    expect(errors).toEqual([]);
  });

  it.each(dsv6Files)('%s (DSV6) wird schon schema-frei abgelehnt', (name) => {
    const result = parseDsv(read(name));
    const found = result.diagnostics.find((d) => d.code === 'unsupported-format-version');

    expect(found?.severity).toBe('fatal');
    expect(result.ok).toBe(false);
  });

  it.each(dsv6Files)('%s (DSV6) wird trotz Ablehnung vollständig zerlegt', (name) => {
    // Das ist der Unterschied zur typisierten Ebene: `fatal` heisst hier „nicht
    // verwendbar", nicht „Abbruch". Die Zeilen bleiben zur Diagnose erhalten.
    const text = read(name);
    expect(parseDsv(text).document.items.length).toBeGreaterThan(0);
    expect(writeDsv(parseDsv(text).document)).toBe(text);
  });
});

describe('Zerlegung echter Dateien', () => {
  it.each(files)('%s: kein Feld enthält ein Trennzeichen', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    // Nur bei einem Treffer assertieren: Ein expect je Feld ergäbe
    // hunderttausende Assertions und dominierte die Laufzeit der Suite.
    const offenders: string[] = [];

    for (const item of parseDsv(text).document.items) {
      if (item.kind !== 'element') continue;
      for (const f of item.fields) {
        if (f.includes(';') || f.includes('\n')) offenders.push(f);
      }
    }

    expect(offenders).toEqual([]);
  });

  it.each(files)('%s: gleichnamige Elemente haben gleich viele Felder', (name) => {
    const text = readFileSync(join(DIR, name), 'utf8');
    const counts = new Map<string, Set<number>>();

    for (const item of parseDsv(text).document.items) {
      if (item.kind !== 'element' || item.bare) continue;
      const seen = counts.get(item.element) ?? new Set<number>();
      seen.add(item.fields.length);
      counts.set(item.element, seen);
    }

    for (const [element, sizes] of counts) {
      expect(sizes.size, `${element} hat unterschiedliche Feldzahlen`).toBe(1);
    }
  });

  it('trennt Kommentare am Zeilenende in der erwarteten Grössenordnung ab', () => {
    let withComment = 0;
    for (const name of files) {
      const text = readFileSync(join(DIR, name), 'utf8');
      for (const item of parseDsv(text).document.items) {
        if (item.kind === 'element' && item.comment !== null) withComment++;
      }
    }
    // Exakter Wert statt unterer Schranke: Eine Schranke bemerkt nicht, wenn
    // zu gierig abgetrennt wird.
    //
    // Die Zahl ist mit den 34 Vereinsmeldelisten unverändert geblieben: Von
    // allen Erzeugern setzt allein EasyWk Kommentare ans Zeilenende. WebClub
    // kommentiert ausschliesslich in eigenen Zeilen (drei Kopfzeilen je Datei).
    expect(withComment).toBe(92_261);
  });
});
