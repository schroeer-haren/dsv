import { createDiagnostic } from '../diagnostics/create.js';
import { WETTKAMPFERGEBNISLISTE } from '../schema/wettkampfergebnisliste.js';
import { createDefaultLookup } from './defaults.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { TypedRecord } from '../parse/parse-typed-list.js';
import type { Wettkampfergebnisliste } from '../parse/parse-wettkampfergebnisliste.js';
import type { Datum } from '../values/datum.js';
import { decodeDatum } from '../values/datum.js';
import { decodeUhrzeit } from '../values/uhrzeit.js';
import { decodeZeit } from '../values/zeit.js';

/**
 * Objektgraph einer Wettkampfergebnisliste.
 *
 * Das Zielmodell ist ein anderes als das der Wettkampfdefinitionsliste, nicht
 * bloss ein zweiter Satz gleich benannter Typen. Der Unterschied steckt in
 * PNERGEBNIS: Die Datei kennt keine Personen-Entität, sondern einen
 * denormalisierten Flachsatz, der Name, DSV-ID, Verein, Jahrgang und Endzeit in
 * jeder Zeile mitführt — und dieselbe Person einmal je Wertung wiederholt
 * (dsv8.md:5019).
 *
 * Diese Wiederholung wird hier aufgelöst. Ein `ErgebnisStart` ist der Schwimmvorgang
 * einer Person in einem Wettkampf; die Wertungen, in denen dieser Start
 * platziert wurde, hängen als `ErgebnisPlatzierung` daran. Gemessen an den 48
 * fehlerfreien echten Dateien trägt das: In 6970 Fällen erscheint eine Person
 * mehrfach im selben Wettkampf, und in keinem einzigen weichen Name, DSV-ID,
 * Geschlecht, Jahrgang, Verein, Vereinskennzahl oder Endzeit voneinander ab.
 * Die Zeilen unterscheiden sich ausschliesslich in Wertung und Platz. Weicht
 * doch einmal etwas ab, gewinnt die erste Zeile und es entsteht ein
 * `ambiguous-reference`.
 *
 * Bewusst nicht durchgesetzt: die Umkehrung derselben Stelle. dsv8.md:5019
 * verlangt, dass "für jede definierte Wertung [...] jeweils die erreichte
 * Platzierung ausgegeben werden" muss — jede WERTUNG also mindestens einen
 * Ergebnissatz trägt. Gemessen an den 48 fehlerfreien echten Dateien bleiben
 * 7860 von 16989 Wertungen (46 %) ohne jeden Ergebnissatz, verteilt über 46
 * der 48 Dateien.
 *
 * Das ist kein Mangel der Dateien, sondern die Arbeitsweise der
 * Ausschreibung: Sie erzeugt das volle Kreuzprodukt aus Jahrgang und
 * Geschlecht, und die meisten dieser Klassen bekommen nie eine Meldung. Die
 * leere Wertung ist der Normalfall, nicht die Ausnahme. Eine Warnung, die
 * 7860 mal feuert und die niemand abstellen kann, wäre Lärm, der die echten
 * Befunde zudeckt — deshalb wird die Regel hier nicht geprüft. Die Lücke ist
 * bekannt und gewollt, nicht übersehen.
 *
 * Bewusste Festlegungen, wie beim anderen Objektgraph:
 *
 * - Nur einfache Objekte, keine Klassen. Beim Dual-Publish für ESM und CJS gibt
 *   es zwei Modulinstanzen; `instanceof` schlüge über diese Grenze fehl.
 * - Alle Bezüge werden sofort aufgelöst, nicht über Getter.
 * - Keine Rückverweise. Ein Zeiger vom Start auf seinen Wettkampf erzeugte
 *   einen Zyklus, an dem `JSON.stringify` wirft. Stattdessen stehen Index-Maps
 *   auf der obersten Ebene. Jeder `ErgebnisStart` hat genau einen Ort im Baum — unter
 *   seinem Wettkampf; `ErgebnisPerson.starts` und `startByKey` verweisen auf
 *   dieselben Objekte, verdoppeln sie also nicht.
 * - Werte bleiben Zeichenketten, ausser Datum, Uhrzeit und Zeit.
 */
export interface ErgebnisVeranstaltung {
  readonly bezeichnung: string;
  readonly ort: string;
  readonly bahnlaenge: string;
  readonly zeitmessung: string;
}

/** Ein an der Veranstaltung beteiligter Verein. */
export interface ErgebnisVerein {
  readonly bezeichnung: string;
  /** Vierstellige Kennzahl; `0` bei nicht dem DSV angehörenden Vereinen. */
  readonly kennzahl: number;
  readonly landesschwimmverband: string;
  readonly nationenkuerzel: string;
  readonly line: number;
}

/** Eine Besetzung im Kampfgericht eines Abschnitts. */
export interface ErgebnisKampfrichter {
  readonly position: string;
  readonly name: string;
  readonly verein: string;
  readonly line: number;
}

/** Eine Wertungsgruppe innerhalb eines Wettkampfes. */
export interface ErgebnisWertung {
  /** Veranstaltungsweit eindeutige Kennung aus `wertungsId`. */
  readonly id: number;
  readonly wertungsklasseTyp: string;
  readonly mindestJgAk: string;
  readonly maximalJgAk: string;
  readonly geschlecht: string;
  readonly name: string;
  readonly line: number;
}

/** Die Platzierung eines Starts in einer Wertung. */
export interface ErgebnisPlatzierung {
  readonly wertungsId: number;
  readonly platz: number;
  /** `DS`, `NA`, `AB`, `AU` oder `ZU`; leer, wenn das Ergebnis zählt. */
  readonly grundDerNichtwertung: string;
  readonly disqualifikationsbemerkung: string;
  readonly erhoehtesNachtraeglichesMeldegeld: string;
  readonly line: number;
}

/** Eine Zwischenzeit auf einer Teilstrecke. */
export interface ErgebnisZwischenzeit {
  readonly distanz: number;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly zeit: number | null;
  readonly line: number;
}

/** Eine Reaktionszeit beim Start. */
export interface ErgebnisReaktion {
  /** `+` für Start nach, `-` für Start vor dem Signal. */
  readonly art: string;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly zeit: number | null;
  readonly line: number;
}

/**
 * Der Schwimmvorgang einer Person in einem Wettkampf.
 *
 * Fasst die PNERGEBNIS-Zeilen zusammen, die dieselbe Person im selben Wettkampf
 * betreffen. Was den Schwimmvorgang beschreibt, steht hier einmal; was die
 * Wertung betrifft, steht in `platzierungen`.
 */
export interface ErgebnisStart {
  /** Veranstaltungsweit eindeutige Kennung der Person. */
  readonly veranstaltungsId: number;
  readonly wettkampfnr: number;
  readonly wettkampfart: string;
  readonly name: string;
  readonly dsvId: string;
  readonly geschlecht: string;
  readonly jahrgang: string;
  readonly altersklasse: string;
  readonly verein: string;
  readonly vereinskennzahl: number;
  /** Die bis zu drei Staatsangehörigkeiten, leere Angaben weggelassen. */
  readonly nationalitaeten: readonly string[];
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly endzeit: number | null;
  readonly platzierungen: readonly ErgebnisPlatzierung[];
  readonly zwischenzeiten: readonly ErgebnisZwischenzeit[];
  readonly reaktionen: readonly ErgebnisReaktion[];
  /** Zeilennummer der ersten zugrunde liegenden PNERGEBNIS-Zeile. */
  readonly line: number;
}

/** Eine Teilnehmerin oder ein Teilnehmer einer Staffel. */
export interface ErgebnisStaffelPerson {
  readonly name: string;
  readonly dsvId: string;
  readonly startnummer: number;
  readonly geschlecht: string;
  readonly jahrgang: string;
  readonly altersklasse: string;
  readonly nationalitaeten: readonly string[];
  readonly line: number;
}

/** Eine Zwischenzeit innerhalb einer Staffel. */
export interface ErgebnisStaffelZwischenzeit extends ErgebnisZwischenzeit {
  readonly startnummer: number;
}

/** Eine Ablösezeit innerhalb einer Staffel. */
export interface ErgebnisAbloese extends ErgebnisReaktion {
  readonly startnummer: number;
}

/** Das Ergebnis einer Staffel, aufgebaut wie ein `ErgebnisStart`. */
export interface ErgebnisStaffel {
  /** Veranstaltungsweit eindeutige Kennung der Staffel. */
  readonly veranstaltungsId: number;
  readonly wettkampfnr: number;
  readonly wettkampfart: string;
  readonly nummerDerMannschaft: string;
  readonly verein: string;
  readonly vereinskennzahl: number;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly endzeit: number | null;
  readonly startnummerDisqualifiziert: string;
  readonly platzierungen: readonly ErgebnisPlatzierung[];
  readonly personen: readonly ErgebnisStaffelPerson[];
  readonly zwischenzeiten: readonly ErgebnisStaffelZwischenzeit[];
  readonly abloesen: readonly ErgebnisAbloese[];
  readonly line: number;
}

/**
 * Ein einzelner Wettkampf.
 *
 * Identifiziert über das Paar aus `nummer` und `art`, nicht über die Nummer
 * allein: Dieselbe Nummer kommt als Vorlauf und als Entscheidung vor.
 */
export interface ErgebnisWettkampf {
  readonly nummer: number;
  readonly art: string;
  readonly abschnittsnr: number;
  readonly anzahlStarter: string;
  readonly einzelstrecke: number;
  readonly technik: string;
  readonly ausuebung: string;
  readonly geschlecht: string;
  readonly zuordnungBestenliste: string;
  readonly wertungen: readonly ErgebnisWertung[];
  readonly starts: readonly ErgebnisStart[];
  readonly staffeln: readonly ErgebnisStaffel[];
  /** Auflösung von qualifikationswettkampfnr/-art, `null` wenn nicht gesetzt. */
  readonly qualifikationAus: { readonly nummer: number; readonly art: string } | null;
  readonly line: number;
}

/** Ein Veranstaltungsabschnitt samt Kampfgericht und Wettkämpfen. */
export interface ErgebnisAbschnitt {
  readonly nummer: number;
  readonly datum: Datum | null;
  /** Minuten seit Mitternacht, `null` ohne oder bei ungültiger Angabe. */
  readonly anfangszeit: number | null;
  /** `J`, wenn die Zeit relativ zum Ende des Vorabschnitts gilt. */
  readonly relativeAngabe: string;
  readonly kampfrichter: readonly ErgebnisKampfrichter[];
  readonly wettkaempfe: readonly ErgebnisWettkampf[];
  readonly line: number;
}

/**
 * Eine Person mit allen ihren Starts.
 *
 * Der Name trägt das Präfix `Ergebnis` wie jeder Typ dieses Graphen: Dieselbe
 * Entität ist je Listenart anders modelliert. Die Vereinsergebnisliste und die
 * Vereinsmeldeliste kennen ein PERSON-Element und nennen ihren Typ deshalb
 * `VereinsergebnisPerson` beziehungsweise `MeldungPerson`; die
 * Wettkampfergebnisliste hat kein solches Element.
 *
 * Diese Entität steht so in keiner Datei — sie ist aus den PNERGEBNIS-Zeilen
 * zusammengesetzt. Angeboten wird sie, weil die Messung an den echten Daten sie
 * trägt: über 17634 Personen in 75 Dateien, davon 17043 in mehr als einer
 * Zeile, weicht keine einzige Angabe zu Name, DSV-ID, Geschlecht, Jahrgang,
 * Verein oder Vereinskennzahl voneinander ab. Widersprüche sind also möglich,
 * aber empirisch nicht belegt; tritt doch einer auf, gewinnt die erste Zeile und
 * es entsteht ein `ambiguous-reference`.
 */
export interface ErgebnisPerson {
  readonly veranstaltungsId: number;
  readonly name: string;
  readonly dsvId: string;
  readonly geschlecht: string;
  readonly jahrgang: string;
  readonly verein: string;
  readonly vereinskennzahl: number;
  /** Dieselben Objekte, die auch unter ihrem Wettkampf hängen. */
  readonly starts: readonly ErgebnisStart[];
}

export interface Wettkampfergebnis {
  readonly veranstaltung: ErgebnisVeranstaltung;
  readonly abschnitte: readonly ErgebnisAbschnitt[];
  readonly vereine: readonly ErgebnisVerein[];
  /** Wettkämpfe, deren `abschnittsnr` auf keinen Abschnitt zeigt. */
  readonly wettkaempfeOhneAbschnitt: readonly ErgebnisWettkampf[];
  /** Schlüssel ist `${nummer}:${art}`. */
  readonly wettkampfByKey: ReadonlyMap<string, ErgebnisWettkampf>;
  readonly wertungById: ReadonlyMap<number, ErgebnisWertung>;
  readonly abschnittByNummer: ReadonlyMap<number, ErgebnisAbschnitt>;
  /** Ohne die Kennzahl 0: die kennzeichnet vereinslose Meldungen, sie ist kein Schlüssel. */
  readonly vereinByKennzahl: ReadonlyMap<number, ErgebnisVerein>;
  /** Schlüssel ist `${veranstaltungsId}:${wettkampfnr}:${wettkampfart}`. */
  readonly startByKey: ReadonlyMap<string, ErgebnisStart>;
  /**
   * Schlüssel ist `${veranstaltungsId}:${wettkampfnr}:${wettkampfart}`.
   *
   * Anders als `Vereinsergebnis.staffelById` zusammengesetzt: Eine
   * Wettkampfergebnisliste führt die Staffeln aller Vereine, dort ist die
   * `veranstaltungsId` einer Staffel nur je Wettkampf eindeutig.
   */
  readonly staffelByKey: ReadonlyMap<string, ErgebnisStaffel>;
  /** Schlüssel ist die `veranstaltungsId` der Person. */
  readonly personById: ReadonlyMap<number, ErgebnisPerson>;
}

export interface ErgebnisProjectionResult {
  readonly graph: Wettkampfergebnis;
  readonly diagnostics: readonly Diagnostic[];
}

const EMPTY_VERANSTALTUNG: ErgebnisVeranstaltung = {
  bezeichnung: '',
  ort: '',
  bahnlaenge: '',
  zeitmessung: '',
};

/** Feldwert eines Records; fehlende Felder ergeben die leere Zeichenkette. */
const unterlassungswert = createDefaultLookup(WETTKAMPFERGEBNISLISTE);

function value(record: TypedRecord, name: string): string {
  // Leer heisst: nicht angegeben. Dann gilt der Unterlassungswert der
  // Spezifikation, sofern das Feld einen führt — siehe `createDefaultLookup`.
  const raw = record.values[name]?.trim() ?? '';
  return raw === '' ? unterlassungswert(record.element, name) : raw;
}

/**
 * Liest ein Zahlenfeld. Nicht lesbare Angaben ergeben `NaN` statt eines
 * geratenen Wertes — `Number('')` wäre `0` und damit eine echte Nummer.
 */
function number(record: TypedRecord, name: string): number {
  const raw = value(record, name);
  if (raw === '' || !/^[+-]?\d+$/.test(raw)) return Number.NaN;
  return Number(raw);
}

/** Schlüssel eines Wettkampfes aus Nummer und Art. */
function wettkampfKey(nummer: number, art: string): string {
  return `${String(nummer)}:${art}`;
}

/** Schlüssel eines Starts aus Person und Wettkampf. */
function startKey(veranstaltungsId: number, nummer: number, art: string): string {
  return `${String(veranstaltungsId)}:${String(nummer)}:${art}`;
}

/** Ein Diagnostic auf der Zeile eines Records; Spalten kennt diese Ebene nicht. */
function at(line: number): {
  line: number;
} {
  return { line };
}

/** Die gesetzten Staatsangehörigkeiten eines Records, in ihrer Reihenfolge. */
function nationalitaeten(record: TypedRecord): string[] {
  return [
    value(record, 'nationalitaet1'),
    value(record, 'nationalitaet2'),
    value(record, 'nationalitaet3'),
  ].filter((n) => n !== '');
}

/** Die Platzierung, die eine PNERGEBNIS- oder STERGEBNIS-Zeile beschreibt. */
function platzierung(record: TypedRecord): ErgebnisPlatzierung {
  return {
    wertungsId: number(record, 'wertungsId'),
    platz: number(record, 'platz'),
    grundDerNichtwertung: value(record, 'grundDerNichtwertung'),
    disqualifikationsbemerkung: value(record, 'disqualifikationsbemerkung'),
    erhoehtesNachtraeglichesMeldegeld: value(record, 'erhoehtesNachtraeglichesMeldegeld'),
    line: record.line,
  };
}

/**
 * Nimmt eine Platzierung in einen Start auf und meldet eine zweite Platzierung
 * derselben Wertung.
 *
 * dsv8.md:5019 — "Für jede definierte Wertung muss hier jeweils die erreichte
 * Platzierung ausgegeben werden": je Wertung genau eine. Eine Wertung gehört zu
 * genau einem Wettkampf, und ein Start nimmt an ihr genau einmal teil — zwei
 * Ergebnisse desselben Starts mit derselben Wertung widersprechen einander,
 * ohne dass die Datei sagt, welches gilt.
 *
 * Nachgemessen am gesammelten Bestand: In allen 194 660 Ergebniszeilen der
 * echten Ergebnislisten kommt der Fall kein einziges Mal vor. Die Regel schlägt
 * also auf keiner gültigen Datei an.
 *
 * Die erste Platzierung gewinnt — wie überall sonst in der Projektion, wo die
 * Datei sich widerspricht.
 */
function nimmPlatzierung<T extends { readonly wertungsId: number }>(
  ziel: T[],
  neu: T,
  element: string,
  key: string,
  line: number,
  diagnostics: Diagnostic[],
): void {
  if (ziel.some((p) => p.wertungsId === neu.wertungsId)) {
    diagnostics.push(
      createDiagnostic(
        'ambiguous-reference',
        'warning',
        `${element} for ${key} repeats Wertung ${String(neu.wertungsId)}; the first placement wins`,
        { ...at(line), data: { element, key, wertungsId: neu.wertungsId } },
      ),
    );
    return;
  }
  ziel.push(neu);
}

/** Zwischenstand eines Wettkampfes, dessen Kinderlisten noch wachsen. */
interface WettkampfBuilder {
  readonly wertungen: ErgebnisWertung[];
  readonly starts: ErgebnisStart[];
  readonly staffeln: ErgebnisStaffel[];
  readonly wettkampf: ErgebnisWettkampf;
}

/** Zwischenstand eines Starts, dessen Kinderlisten noch wachsen. */
interface StartBuilder {
  readonly platzierungen: ErgebnisPlatzierung[];
  readonly zwischenzeiten: ErgebnisZwischenzeit[];
  readonly reaktionen: ErgebnisReaktion[];
  readonly start: ErgebnisStart;
  /** Die Felder, die den Schwimmvorgang beschreiben, zur Widerspruchsprüfung. */
  readonly signatur: string;
}

/** Zwischenstand einer Staffel, deren Kinderlisten noch wachsen. */
interface StaffelBuilder {
  readonly platzierungen: ErgebnisPlatzierung[];
  readonly personen: ErgebnisStaffelPerson[];
  readonly zwischenzeiten: ErgebnisStaffelZwischenzeit[];
  readonly abloesen: ErgebnisAbloese[];
  readonly staffel: ErgebnisStaffel;
  readonly signatur: string;
  /**
   * Die bereits übernommenen Kindzeilen, je Element nach ihrer fachlichen
   * Identität.
   *
   * Ist eine Staffel in mehreren Wertungen platziert, trägt die Datei je
   * Wertung eine eigene STERGEBNIS-Zeile — und wiederholt dahinter den
   * kompletten Block aus STAFFELPERSON, STZWISCHENZEIT und STABLOESE. Alle
   * Wiederholungen beschreiben denselben Schwimmvorgang, nur unterschiedlich
   * gewertet; ohne Deduplizierung bekäme eine Vierer-Staffel acht Mitglieder.
   *
   * Die Identität ist die Startnummer: dsv8.md:5670 beschreibt sie als
   * "Startnummer des Schwimmers innerhalb der Staffel", sie benennt also die
   * Position in der Staffel und ist damit je Staffel eindeutig. Zwischenzeiten
   * unterscheiden sich zusätzlich nach Distanz, Ablösezeiten nach Art — eine
   * Startnummer hat mehrere Zwischenzeiten, aber je Distanz nur eine.
   */
  readonly gesehen: {
    readonly personen: Set<number>;
    readonly zwischenzeiten: Set<string>;
    readonly abloesen: Set<string>;
  };
}

/**
 * Baut aus einer gelesenen Wettkampfergebnisliste einen Objektgraph mit
 * aufgelösten Bezügen.
 *
 * Die Projektion bricht nie ab: Zeigt ein Bezug ins Leere oder widersprechen
 * sich zwei Zeilen, entsteht eine Warnung, und der Graph wird — bei
 * Widersprüchen gewinnt die erste Zeile — so vollständig wie möglich aufgebaut.
 * Ein Wettkampf ohne auffindbaren Abschnitt landet in
 * `wettkaempfeOhneAbschnitt` statt verloren zu gehen.
 */
export function projectWettkampfergebnisliste(
  liste: Wettkampfergebnisliste,
): ErgebnisProjectionResult {
  const diagnostics: Diagnostic[] = [];
  const records = liste.records;

  const veranstaltung = projectVeranstaltung(records);

  // --- Vereine -------------------------------------------------------------
  const vereine: ErgebnisVerein[] = [];
  const vereinByKennzahl = new Map<number, ErgebnisVerein>();

  for (const record of records) {
    if (record.element !== 'VEREIN') continue;

    const kennzahl = number(record, 'vereinskennzahl');
    const verein: ErgebnisVerein = {
      bezeichnung: value(record, 'vereinsbezeichnung'),
      kennzahl,
      landesschwimmverband: value(record, 'landesschwimmverband'),
      nationenkuerzel: value(record, 'nationenkuerzel'),
      line: record.line,
    };
    vereine.push(verein);

    // Die Kennzahl 0 ist kein Schlüssel, sondern das Kennzeichen für nicht dem
    // DSV angehörende Vereine. Mehrere Vereine tragen sie zu Recht — sie zu
    // indizieren erzeugte nur Warnungen ohne Aussage.
    if (kennzahl === 0 || !Number.isFinite(kennzahl)) continue;

    if (vereinByKennzahl.has(kennzahl)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate VEREIN number ${String(kennzahl)}; the first one wins`,
          { ...at(record.line), data: { element: 'VEREIN', vereinskennzahl: kennzahl } },
        ),
      );
    } else {
      vereinByKennzahl.set(kennzahl, verein);
    }
  }

  // --- Abschnitte ----------------------------------------------------------
  const abschnitte: ErgebnisAbschnitt[] = [];
  const abschnittWettkaempfe = new Map<ErgebnisAbschnitt, ErgebnisWettkampf[]>();
  const abschnittKampfrichter = new Map<number, ErgebnisKampfrichter[]>();
  const abschnittByNummer = new Map<number, ErgebnisAbschnitt>();

  for (const record of records) {
    if (record.element !== 'ABSCHNITT') continue;

    const wettkaempfe: ErgebnisWettkampf[] = [];
    const kampfrichter: ErgebnisKampfrichter[] = [];
    const nummer = number(record, 'abschnittsnr');
    const abschnitt: ErgebnisAbschnitt = {
      nummer,
      datum: decodeDatum(value(record, 'abschnittsdatum')),
      anfangszeit: decodeUhrzeit(value(record, 'anfangszeit')),
      relativeAngabe: value(record, 'relativeAngabe'),
      kampfrichter,
      wettkaempfe,
      line: record.line,
    };

    abschnitte.push(abschnitt);
    abschnittWettkaempfe.set(abschnitt, wettkaempfe);

    if (abschnittByNummer.has(nummer)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate ABSCHNITT number ${String(nummer)}; the first one wins`,
          { ...at(record.line), data: { element: 'ABSCHNITT', abschnittsnr: nummer } },
        ),
      );
    } else if (Number.isFinite(nummer)) {
      abschnittByNummer.set(nummer, abschnitt);
      abschnittKampfrichter.set(nummer, kampfrichter);
    }
  }

  for (const record of records) {
    if (record.element !== 'KAMPFGERICHT') continue;

    const abschnittsnr = number(record, 'abschnittsnr');
    const kampfrichter: ErgebnisKampfrichter = {
      position: value(record, 'position'),
      name: value(record, 'nameKampfrichter'),
      verein: value(record, 'vereinDesKampfrichters'),
      line: record.line,
    };

    const ziel = abschnittKampfrichter.get(abschnittsnr);
    if (ziel === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `KAMPFGERICHT refers to unknown ABSCHNITT ${value(record, 'abschnittsnr')}`,
          { ...at(record.line), data: { element: 'KAMPFGERICHT', abschnittsnr } },
        ),
      );
      continue;
    }
    ziel.push(kampfrichter);
  }

  // --- Wettkämpfe ----------------------------------------------------------
  const builders = new Map<string, WettkampfBuilder>();
  const wettkaempfeOhneAbschnitt: ErgebnisWettkampf[] = [];

  for (const record of records) {
    if (record.element !== 'WETTKAMPF') continue;

    const nummer = number(record, 'wettkampfnr');
    const art = value(record, 'wettkampfart');
    const abschnittsnr = number(record, 'abschnittsnr');

    const qualNummer = number(record, 'qualifikationswettkampfnr');
    const qualArt = value(record, 'qualifikationswettkampfart');
    const qualifikationAus =
      Number.isFinite(qualNummer) || qualArt !== '' ? { nummer: qualNummer, art: qualArt } : null;

    const wertungen: ErgebnisWertung[] = [];
    const starts: ErgebnisStart[] = [];
    const staffeln: ErgebnisStaffel[] = [];
    const wettkampf: ErgebnisWettkampf = {
      nummer,
      art,
      abschnittsnr,
      anzahlStarter: value(record, 'anzahlStarter'),
      einzelstrecke: number(record, 'einzelstrecke'),
      technik: value(record, 'technik'),
      ausuebung: value(record, 'ausuebung'),
      geschlecht: value(record, 'geschlecht'),
      zuordnungBestenliste: value(record, 'zuordnungBestenliste'),
      wertungen,
      starts,
      staffeln,
      qualifikationAus,
      line: record.line,
    };

    const key = wettkampfKey(nummer, art);
    if (builders.has(key)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate WETTKAMPF ${key}; the first one wins`,
          { ...at(record.line), data: { element: 'WETTKAMPF', key } },
        ),
      );
    } else {
      builders.set(key, { wertungen, starts, staffeln, wettkampf });
    }

    const abschnitt = abschnittByNummer.get(abschnittsnr);
    if (abschnitt === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `WETTKAMPF ${key} refers to unknown ABSCHNITT ${value(record, 'abschnittsnr')}`,
          { ...at(record.line), data: { element: 'WETTKAMPF', key, abschnittsnr } },
        ),
      );
      wettkaempfeOhneAbschnitt.push(wettkampf);
    } else {
      abschnittWettkaempfe.get(abschnitt)?.push(wettkampf);
    }
  }

  // Qualifikationsbezüge erst prüfen, wenn alle Wettkämpfe bekannt sind — ein
  // Vorlauf darf in der Datei hinter seiner Entscheidung stehen.
  for (const record of records) {
    if (record.element !== 'WETTKAMPF') continue;

    const qualNummer = number(record, 'qualifikationswettkampfnr');
    const qualArt = value(record, 'qualifikationswettkampfart');
    if (!Number.isFinite(qualNummer) && qualArt === '') continue;

    const qualKey = wettkampfKey(qualNummer, qualArt);
    if (builders.has(qualKey)) continue;

    diagnostics.push(
      createDiagnostic(
        'dangling-reference',
        'warning',
        `WETTKAMPF ${wettkampfKey(number(record, 'wettkampfnr'), value(record, 'wettkampfart'))} refers to unknown qualifying WETTKAMPF ${qualKey}`,
        {
          ...at(record.line),
          data: { element: 'WETTKAMPF', reference: 'qualifikation', wettkampf: qualKey },
        },
      ),
    );
  }

  // --- Wertungen -----------------------------------------------------------
  const wertungById = new Map<number, ErgebnisWertung>();
  /** Der Wettkampf, zu dem eine Wertung gehört, als `wettkampfKey`. */
  const wettkampfByWertungsId = new Map<number, string>();

  for (const record of records) {
    if (record.element !== 'WERTUNG') continue;

    const id = number(record, 'wertungsId');
    const wertung: ErgebnisWertung = {
      id,
      wertungsklasseTyp: value(record, 'wertungsklasseTyp'),
      mindestJgAk: value(record, 'mindestJgAk'),
      maximalJgAk: value(record, 'maximalJgAk'),
      geschlecht: value(record, 'geschlecht'),
      name: value(record, 'wertungsname'),
      line: record.line,
    };

    if (wertungById.has(id)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate WERTUNG id ${String(id)}; the first one wins`,
          { ...at(record.line), data: { element: 'WERTUNG', wertungsId: id } },
        ),
      );
    } else if (Number.isFinite(id)) {
      wertungById.set(id, wertung);
    }

    const key = wettkampfKey(number(record, 'wettkampfnr'), value(record, 'wettkampfart'));
    if (!wettkampfByWertungsId.has(id)) wettkampfByWertungsId.set(id, key);
    const builder = builders.get(key);
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `WERTUNG ${String(id)} refers to unknown WETTKAMPF ${key}`,
          { ...at(record.line), data: { element: 'WERTUNG', wertungsId: id, wettkampf: key } },
        ),
      );
      continue;
    }

    builder.wertungen.push(wertung);
  }

  // --- Einzelergebnisse ----------------------------------------------------
  const startBuilders = new Map<string, StartBuilder>();

  for (const record of records) {
    if (record.element !== 'PNERGEBNIS') continue;

    const veranstaltungsId = number(record, 'veranstaltungsId');
    const nummer = number(record, 'wettkampfnr');
    const art = value(record, 'wettkampfart');
    const key = startKey(veranstaltungsId, nummer, art);

    // Die Felder, die den Schwimmvorgang beschreiben — sie müssen über alle
    // Zeilen derselben Person im selben Wettkampf übereinstimmen.
    const signatur = [
      value(record, 'name'),
      value(record, 'dsvId'),
      value(record, 'geschlecht'),
      value(record, 'jahrgang'),
      value(record, 'verein'),
      value(record, 'vereinskennzahl'),
      value(record, 'endzeit'),
    ].join('|');

    const vorhanden = startBuilders.get(key);
    if (vorhanden !== undefined) {
      if (vorhanden.signatur !== signatur) {
        diagnostics.push(
          createDiagnostic(
            'ambiguous-reference',
            'warning',
            `PNERGEBNIS for ${key} contradicts an earlier line; the first one wins`,
            { ...at(record.line), data: { element: 'PNERGEBNIS', key } },
          ),
        );
      }
      nimmPlatzierung(
        vorhanden.platzierungen,
        platzierung(record),
        'PNERGEBNIS',
        key,
        record.line,
        diagnostics,
      );
      pruefeWertung(record, veranstaltungsId);
      continue;
    }

    const platzierungen: ErgebnisPlatzierung[] = [platzierung(record)];
    const zwischenzeiten: ErgebnisZwischenzeit[] = [];
    const reaktionen: ErgebnisReaktion[] = [];
    const start: ErgebnisStart = {
      veranstaltungsId,
      wettkampfnr: nummer,
      wettkampfart: art,
      name: value(record, 'name'),
      dsvId: value(record, 'dsvId'),
      geschlecht: value(record, 'geschlecht'),
      jahrgang: value(record, 'jahrgang'),
      altersklasse: value(record, 'altersklasse'),
      verein: value(record, 'verein'),
      vereinskennzahl: number(record, 'vereinskennzahl'),
      nationalitaeten: nationalitaeten(record),
      endzeit: decodeZeit(value(record, 'endzeit')),
      platzierungen,
      zwischenzeiten,
      reaktionen,
      line: record.line,
    };

    startBuilders.set(key, { platzierungen, zwischenzeiten, reaktionen, start, signatur });
    pruefeWertung(record, veranstaltungsId);

    const builder = builders.get(wettkampfKey(nummer, art));
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `PNERGEBNIS for ${key} refers to unknown WETTKAMPF ${wettkampfKey(nummer, art)}`,
          { ...at(record.line), data: { element: 'PNERGEBNIS', key } },
        ),
      );
      continue;
    }
    builder.starts.push(start);
  }

  /**
   * Meldet eine Platzierung, deren Wertung es nicht gibt oder die zu einem
   * anderen Wettkampf gehört.
   *
   * Die Wertungs-ID ist veranstaltungsweit eindeutig (dsv8.md:4873), aber jede
   * Wertung nennt selbst einen Wettkampf; ein Ergebnis darf deshalb nur auf
   * eine Wertung seines eigenen Wettkampfs zeigen.
   *
   * An den echten Dateien gemessen: Alle 97 330 Ergebnisse der 72
   * Wettkampfergebnislisten in `test/fixtures/real` halten sich daran.
   */
  function pruefeWertung(record: TypedRecord, veranstaltungsId: number): void {
    const wertungsId = number(record, 'wertungsId');
    if (!wertungById.has(wertungsId)) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} for ${String(veranstaltungsId)} refers to unknown WERTUNG ${value(record, 'wertungsId')}`,
          { ...at(record.line), data: { element: record.element, wertungsId } },
        ),
      );
      return;
    }

    const eigener = wettkampfKey(number(record, 'wettkampfnr'), value(record, 'wettkampfart'));
    const derWertung = wettkampfByWertungsId.get(wertungsId);
    if (derWertung === undefined || derWertung === eigener) return;

    diagnostics.push(
      createDiagnostic(
        'dangling-reference',
        'warning',
        `${record.element} for ${eigener} refers to WERTUNG ${String(wertungsId)} of WETTKAMPF ${derWertung}`,
        {
          ...at(record.line),
          data: {
            element: record.element,
            wertungsId,
            wettkampf: eigener,
            wertungWettkampf: derWertung,
          },
        },
      ),
    );
  }

  for (const record of records) {
    if (record.element !== 'PNZWISCHENZEIT' && record.element !== 'PNREAKTION') continue;

    const key = startKey(
      number(record, 'veranstaltungsId'),
      number(record, 'wettkampfnr'),
      value(record, 'wettkampfart'),
    );
    const builder = startBuilders.get(key);

    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} refers to unknown PNERGEBNIS ${key}`,
          { ...at(record.line), data: { element: record.element, key } },
        ),
      );
      continue;
    }

    if (record.element === 'PNZWISCHENZEIT') {
      builder.zwischenzeiten.push({
        distanz: number(record, 'distanz'),
        zeit: decodeZeit(value(record, 'zwischenzeit')),
        line: record.line,
      });
    } else {
      builder.reaktionen.push({
        art: value(record, 'art'),
        zeit: decodeZeit(value(record, 'reaktionszeit')),
        line: record.line,
      });
    }
  }

  // --- Staffelergebnisse ---------------------------------------------------
  const staffelBuilders = new Map<string, StaffelBuilder>();

  for (const record of records) {
    if (record.element !== 'STERGEBNIS') continue;

    const veranstaltungsId = number(record, 'veranstaltungsId');
    const nummer = number(record, 'wettkampfnr');
    const art = value(record, 'wettkampfart');
    const key = startKey(veranstaltungsId, nummer, art);

    const signatur = [
      value(record, 'nummerDerMannschaft'),
      value(record, 'verein'),
      value(record, 'vereinskennzahl'),
      value(record, 'endzeit'),
    ].join('|');

    const vorhanden = staffelBuilders.get(key);
    if (vorhanden !== undefined) {
      if (vorhanden.signatur !== signatur) {
        diagnostics.push(
          createDiagnostic(
            'ambiguous-reference',
            'warning',
            `STERGEBNIS for ${key} contradicts an earlier line; the first one wins`,
            { ...at(record.line), data: { element: 'STERGEBNIS', key } },
          ),
        );
      }
      nimmPlatzierung(
        vorhanden.platzierungen,
        platzierung(record),
        'STERGEBNIS',
        key,
        record.line,
        diagnostics,
      );
      pruefeWertung(record, veranstaltungsId);
      continue;
    }

    const platzierungen: ErgebnisPlatzierung[] = [platzierung(record)];
    const personen: ErgebnisStaffelPerson[] = [];
    const zwischenzeiten: ErgebnisStaffelZwischenzeit[] = [];
    const abloesen: ErgebnisAbloese[] = [];
    const staffel: ErgebnisStaffel = {
      veranstaltungsId,
      wettkampfnr: nummer,
      wettkampfart: art,
      nummerDerMannschaft: value(record, 'nummerDerMannschaft'),
      verein: value(record, 'verein'),
      vereinskennzahl: number(record, 'vereinskennzahl'),
      endzeit: decodeZeit(value(record, 'endzeit')),
      startnummerDisqualifiziert: value(record, 'startnummerDisqualifiziert'),
      platzierungen,
      personen,
      zwischenzeiten,
      abloesen,
      line: record.line,
    };

    staffelBuilders.set(key, {
      platzierungen,
      personen,
      zwischenzeiten,
      abloesen,
      staffel,
      signatur,
      gesehen: { personen: new Set(), zwischenzeiten: new Set(), abloesen: new Set() },
    });
    pruefeWertung(record, veranstaltungsId);

    const builder = builders.get(wettkampfKey(nummer, art));
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STERGEBNIS for ${key} refers to unknown WETTKAMPF ${wettkampfKey(nummer, art)}`,
          { ...at(record.line), data: { element: 'STERGEBNIS', key } },
        ),
      );
      continue;
    }
    builder.staffeln.push(staffel);
  }

  for (const record of records) {
    if (
      record.element !== 'STAFFELPERSON' &&
      record.element !== 'STZWISCHENZEIT' &&
      record.element !== 'STABLOESE'
    ) {
      continue;
    }

    // Die Kennung der Staffel allein genügt nicht: Dieselbe Mannschaft startet
    // in mehreren Wettkämpfen unter derselben Kennung. Erst zusammen mit
    // Nummer und Art des Wettkampfes ist sie eindeutig — alle drei Elemente
    // führen diese Felder deshalb mit.
    const key = startKey(
      number(record, 'veranstaltungsIdStaffel'),
      number(record, 'wettkampfnr'),
      value(record, 'wettkampfart'),
    );
    const builder = staffelBuilders.get(key);

    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} refers to unknown STERGEBNIS ${key}`,
          { ...at(record.line), data: { element: record.element, key } },
        ),
      );
      continue;
    }

    const startnummer = number(record, 'startnummer');

    if (record.element === 'STAFFELPERSON') {
      if (builder.gesehen.personen.has(startnummer)) continue;
      builder.gesehen.personen.add(startnummer);
      builder.personen.push({
        name: value(record, 'name'),
        dsvId: value(record, 'dsvId'),
        startnummer: number(record, 'startnummer'),
        geschlecht: value(record, 'geschlecht'),
        jahrgang: value(record, 'jahrgang'),
        altersklasse: value(record, 'altersklasse'),
        nationalitaeten: nationalitaeten(record),
        line: record.line,
      });
    } else if (record.element === 'STZWISCHENZEIT') {
      const distanz = number(record, 'distanz');
      const identitaet = `${String(startnummer)}:${String(distanz)}`;
      if (builder.gesehen.zwischenzeiten.has(identitaet)) continue;
      builder.gesehen.zwischenzeiten.add(identitaet);
      builder.zwischenzeiten.push({
        startnummer,
        distanz,
        zeit: decodeZeit(value(record, 'zwischenzeit')),
        line: record.line,
      });
    } else {
      const art = value(record, 'art');
      const identitaet = `${String(startnummer)}:${art}`;
      if (builder.gesehen.abloesen.has(identitaet)) continue;
      builder.gesehen.abloesen.add(identitaet);
      builder.abloesen.push({
        startnummer,
        art,
        zeit: decodeZeit(value(record, 'reaktionszeit')),
        line: record.line,
      });
    }
  }

  // dsv8.md:5531 — "Falls nicht alle Staffelteilnehmer angegeben sind, ist die
  // Ausgabe der Staffelpersonen zu unterdrücken." Die Regel kennt also genau
  // zwei erlaubte Zustände: alle Teilnehmer oder keinen. Eine Staffel, die
  // einige nennt, lässt offen, ob der Rest fehlt oder gar nicht mitschwamm.
  //
  // Gezählt werden verschiedene Startnummern, nicht Zeilen: Sonst schlüge die
  // Prüfung durch die je Wertung wiederholten Personenblöcke in die falsche
  // Richtung aus und hielte eine halbe Staffel für vollständig.
  for (const [key, builder] of staffelBuilders) {
    const genannt = builder.gesehen.personen.size;
    if (genannt === 0) continue;

    const staffel = builder.staffel;
    const wettkampf = builders.get(wettkampfKey(staffel.wettkampfnr, staffel.wettkampfart));
    const erwartet = Number(wettkampf?.wettkampf.anzahlStarter);
    if (!Number.isFinite(erwartet) || erwartet <= 0 || genannt >= erwartet) continue;

    diagnostics.push(
      createDiagnostic(
        'incomplete-relay',
        'warning',
        `STERGEBNIS ${key} names ${String(genannt)} of ${String(erwartet)} relay members; either all or none are expected`,
        {
          ...at(staffel.line),
          // `element` benennt überall in dieser Projektion das Element, auf das
          // `line` zeigt — hier also STERGEBNIS, nicht die STAFFELPERSON, aus
          // deren Kapitel die Regel stammt. Der Befund gilt der Staffel als
          // Ganzes; eine einzelne Personenzeile ist nicht die schuldige.
          data: { element: 'STERGEBNIS', key, genannt, erwartet },
        },
      ),
    );
  }

  // --- Person -----------------------------------------------------------
  const personById = new Map<number, ErgebnisPerson>();
  const schwimmerStarts = new Map<number, ErgebnisStart[]>();

  for (const { start } of startBuilders.values()) {
    const vorhanden = personById.get(start.veranstaltungsId);
    if (vorhanden === undefined) {
      const starts: ErgebnisStart[] = [start];
      schwimmerStarts.set(start.veranstaltungsId, starts);
      personById.set(start.veranstaltungsId, {
        veranstaltungsId: start.veranstaltungsId,
        name: start.name,
        dsvId: start.dsvId,
        geschlecht: start.geschlecht,
        jahrgang: start.jahrgang,
        verein: start.verein,
        vereinskennzahl: start.vereinskennzahl,
        starts,
      });
      continue;
    }

    if (
      vorhanden.name !== start.name ||
      vorhanden.dsvId !== start.dsvId ||
      vorhanden.geschlecht !== start.geschlecht ||
      vorhanden.jahrgang !== start.jahrgang ||
      vorhanden.verein !== start.verein ||
      vorhanden.vereinskennzahl !== start.vereinskennzahl
    ) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `PNERGEBNIS for person ${String(start.veranstaltungsId)} contradicts an earlier start; the first one wins`,
          {
            ...at(start.line),
            data: { element: 'PNERGEBNIS', veranstaltungsId: start.veranstaltungsId },
          },
        ),
      );
    }

    schwimmerStarts.get(start.veranstaltungsId)?.push(start);
  }

  const wettkampfByKey = new Map<string, ErgebnisWettkampf>();
  for (const [key, builder] of builders) wettkampfByKey.set(key, builder.wettkampf);

  const startByKey = new Map<string, ErgebnisStart>();
  for (const [key, builder] of startBuilders) startByKey.set(key, builder.start);

  const staffelByKey = new Map<string, ErgebnisStaffel>();
  for (const [key, builder] of staffelBuilders) staffelByKey.set(key, builder.staffel);

  return {
    graph: {
      veranstaltung,
      abschnitte,
      vereine,
      wettkaempfeOhneAbschnitt,
      wettkampfByKey,
      wertungById,
      abschnittByNummer,
      vereinByKennzahl,
      startByKey,
      staffelByKey,
      personById,
    },
    diagnostics,
  };
}

/** Die Eckdaten der Veranstaltung; ohne VERANSTALTUNG-Record leere Werte. */
function projectVeranstaltung(records: readonly TypedRecord[]): ErgebnisVeranstaltung {
  const record = records.find((r) => r.element === 'VERANSTALTUNG');
  if (record === undefined) return EMPTY_VERANSTALTUNG;

  return {
    bezeichnung: value(record, 'veranstaltungsbezeichnung'),
    ort: value(record, 'veranstaltungsort'),
    bahnlaenge: value(record, 'bahnlaenge'),
    zeitmessung: value(record, 'zeitmessung'),
  };
}
