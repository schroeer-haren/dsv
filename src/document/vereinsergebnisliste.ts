import { createDiagnostic } from '../diagnostics/create.js';
import { VEREINSERGEBNISLISTE } from '../schema/vereinsergebnisliste.js';
import { createDefaultLookup } from './defaults.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { TypedRecord } from '../parse/parse-typed-list.js';
import type { Vereinsergebnisliste } from '../parse/parse-vereinsergebnisliste.js';
import type { Datum } from '../values/datum.js';
import { decodeDatum } from '../values/datum.js';
import { decodeUhrzeit } from '../values/uhrzeit.js';
import { decodeZeit } from '../values/zeit.js';

/**
 * Objektgraph einer Vereinsergebnisliste.
 *
 * Der Unterschied zur Wettkampfergebnisliste ist die Normalform. Dort ist
 * PNERGEBNIS ein denormalisierter Flachsatz, der Name, DSV-ID, Verein und
 * Jahrgang in jeder Zeile mitführt; die Personen-Entität musste erst aus diesen
 * Zeilen zusammengesetzt werden. Hier steht sie bereits getrennt da: PERSON
 * trägt Name, DSV-ID, Jahrgang und Nationalitäten (dsv8.md:2900),
 * PERSONENERGEBNIS nur noch die Veranstaltungs-ID plus Wettkampf, Wertung,
 * Platz und Zeit. Es gibt also nichts aufzulösen — die Projektion verknüpft
 * bloss.
 *
 * Was bleibt, ist die Wiederholung je Wertung: Ist ein Start in mehreren
 * Wertungen platziert, trägt die Datei je Wertung eine eigene
 * PERSONENERGEBNIS- beziehungsweise STAFFELERGEBNIS-Zeile. Alle beschreiben
 * denselben Schwimmvorgang, nur unterschiedlich gewertet. Ein `Start` fasst sie
 * zusammen, die Wertungen hängen als `Platzierung` daran. Bei Staffeln
 * wiederholt die Datei zusätzlich den Block aus STAFFELPERSON,
 * STZWISCHENZEIT und STABLOESE — ohne Deduplizierung bekäme eine Vierer-Staffel
 * acht Mitglieder. Die Identität ist wie in der Wettkampfergebnisliste die
 * Startnummer innerhalb der Staffel, bei Zwischenzeiten zusätzlich die Distanz
 * und bei Ablösezeiten die Art.
 *
 * Aus derselben Wiederholung folgt die Wahl der Endzeit. Ein Start kann in
 * einer Wertung gewertet und in einer anderen nicht gewertet sein; die nicht
 * gewertete Zeile trägt dann eine Platzhalterzeit (`00:00:00,00`) statt der
 * geschwommenen. Der Start übernimmt deshalb die Endzeit der ersten gewerteten
 * Zeile, nicht die der ersten Zeile überhaupt. Alles, was zur Nichtwertung
 * gehört — Grund, Bemerkung und bei Staffeln die Startnummer der oder des
 * Disqualifizierten — hängt an der `Platzierung`, weil es je Wertung
 * verschieden ausfallen kann, und nicht am Start.
 *
 * Die Identität einer Staffel ist auch hier nicht ihre Kennung allein: Dieselbe
 * Mannschaft startet in mehreren Wettkämpfen unter derselben
 * `veranstaltungsIdStaffel`. Erst das Tripel aus Kennung, Wettkampfnummer und
 * Wettkampfart bezeichnet einen Schwimmvorgang eindeutig — deshalb führen
 * STAFFELERGEBNIS und alle seine Kindelemente Nummer und Art mit. Die
 * STAFFEL-Entität selbst ist dagegen über ihre Kennung allein identifiziert;
 * sie beschreibt die Mannschaft, nicht deren Einsatz.
 *
 * VEREIN kommt genau einmal vor: Die ganze Datei betrifft einen Verein
 * (dsv8.md:2860). Er steht deshalb als Einzelwert am Wurzelobjekt, nicht als
 * Liste. Fehlt er, ist er `null` — die Projektion bricht nie ab, das Fehlen
 * meldet bereits die Kardinalitätsprüfung.
 *
 * Bewusste Festlegungen, wie bei den anderen Objektgraphen:
 *
 * - Nur einfache Objekte, keine Klassen. Beim Dual-Publish für ESM und CJS gibt
 *   es zwei Modulinstanzen; `instanceof` schlüge über diese Grenze fehl.
 * - Alle Bezüge werden sofort aufgelöst, nicht über Getter.
 * - Keine Rückverweise. Ein Zeiger vom Start auf seinen Wettkampf erzeugte
 *   einen Zyklus, an dem `JSON.stringify` wirft. Stattdessen stehen Index-Maps
 *   auf der obersten Ebene. Jeder `Start` hat genau einen Ort im Baum — unter
 *   seinem Wettkampf; `Person.starts` und `startByKey` verweisen auf dieselben
 *   Objekte, verdoppeln sie also nicht.
 * - Werte bleiben Zeichenketten, ausser Datum, Uhrzeit und Zeit.
 * - Zeigt ein Bezug ins Leere, entsteht eine `dangling-reference`-Warnung;
 *   widersprechen sich zwei Zeilen oder ist ein Schlüssel doppelt vergeben,
 *   gewinnt die erste Zeile und es entsteht `ambiguous-reference`.
 * - Nicht lesbare Zahlenfelder ergeben `NaN`, nicht `0`.
 */
export interface VereinsergebnisVeranstaltung {
  readonly bezeichnung: string;
  readonly ort: string;
  readonly bahnlaenge: string;
  readonly zeitmessung: string;
}

/** Der Verein, dessen Ergebnisse die Datei enthält. */
export interface VereinsergebnisVerein {
  readonly bezeichnung: string;
  /** Vierstellige Kennzahl; `0` bei nicht dem DSV angehörenden Vereinen. */
  readonly kennzahl: number;
  readonly landesschwimmverband: string;
  readonly nationenkuerzel: string;
  readonly line: number;
}

/** Eine Besetzung im Kampfgericht eines Abschnitts. */
export interface VereinsergebnisKampfrichter {
  readonly position: string;
  readonly name: string;
  readonly verein: string;
  readonly line: number;
}

/** Eine Wertungsgruppe innerhalb eines Wettkampfes. */
export interface VereinsergebnisWertung {
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
export interface VereinsergebnisPlatzierung {
  readonly wertungsId: number;
  readonly platz: number;
  /** `DS`, `NA`, `AB`, `AU` oder `ZU`; leer, wenn das Ergebnis zählt. */
  readonly grundDerNichtwertung: string;
  readonly disqualifikationsbemerkung: string;
  readonly erhoehtesNachtraeglichesMeldegeld: string;
  readonly line: number;
}

/**
 * Die Platzierung einer Staffel in einer Wertung.
 *
 * `startnummerDisqualifiziert` steht hier und nicht am Start: Das Feld benennt,
 * wer die Disqualifikation verursacht hat, und gehört damit zur Nichtwertung —
 * die je Wertung verschieden ausfallen kann.
 */
export interface VereinsergebnisStaffelPlatzierung extends VereinsergebnisPlatzierung {
  readonly startnummerDisqualifiziert: string;
}

/** Eine Zwischenzeit auf einer Teilstrecke. */
export interface VereinsergebnisZwischenzeit {
  readonly distanz: number;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly zeit: number | null;
  readonly line: number;
}

/** Eine Reaktionszeit beim Start. */
export interface VereinsergebnisReaktion {
  /** `+` für Start nach, `-` für Start vor dem Signal. */
  readonly art: string;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly zeit: number | null;
  readonly line: number;
}

/**
 * Der Schwimmvorgang einer Person in einem Wettkampf.
 *
 * Fasst die PERSONENERGEBNIS-Zeilen zusammen, die dieselbe Person im selben
 * Wettkampf betreffen. Die Person selbst steht nicht hier, sondern als
 * `VereinsergebnisPerson` unter ihrer Veranstaltungs-ID.
 */
export interface VereinsergebnisStart {
  /** Veranstaltungsweit eindeutige Kennung der Person. */
  readonly veranstaltungsId: number;
  readonly wettkampfnr: number;
  readonly wettkampfart: string;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly endzeit: number | null;
  readonly platzierungen: readonly VereinsergebnisPlatzierung[];
  readonly zwischenzeiten: readonly VereinsergebnisZwischenzeit[];
  readonly reaktionen: readonly VereinsergebnisReaktion[];
  /** Zeilennummer der ersten zugrunde liegenden PERSONENERGEBNIS-Zeile. */
  readonly line: number;
}

/** Eine gemeldete Person mit allen ihren Starts. */
export interface VereinsergebnisPerson {
  readonly veranstaltungsId: number;
  readonly name: string;
  readonly dsvId: string;
  readonly geschlecht: string;
  readonly jahrgang: string;
  readonly altersklasse: string;
  /** Die bis zu drei Staatsangehörigkeiten, leere Angaben weggelassen. */
  readonly nationalitaeten: readonly string[];
  /** Dieselben Objekte, die auch unter ihrem Wettkampf hängen. */
  readonly starts: readonly VereinsergebnisStart[];
  readonly line: number;
}

/** Eine Teilnehmerin oder ein Teilnehmer einer Staffel. */
export interface VereinsergebnisStaffelPerson {
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
export interface VereinsergebnisStaffelZwischenzeit extends VereinsergebnisZwischenzeit {
  readonly startnummer: number;
}

/** Eine Ablösezeit innerhalb einer Staffel. */
export interface VereinsergebnisAbloese extends VereinsergebnisReaktion {
  readonly startnummer: number;
}

/**
 * Die Besetzung einer Staffel in einem Wettkampf.
 *
 * STAFFELPERSON und STZWISCHENZEIT führen laut dsv8.md:3814-3815 und
 * :4117-4118 die „Kennung für die Staffel [...] definiert in STAFFEL" — sie
 * hängen also an der Staffel, nicht am Ergebnis. Da STAFFELERGEBNIS
 * „Vorkommen 0 - N" hat (dsv8.md:3936) und fehlen darf, wäre die Besetzung
 * sonst unerreichbar. Nummer und Art des Wettkampfes gehören dazu, weil
 * dieselbe Mannschaft in mehreren Wettkämpfen unter derselben Kennung startet.
 */
export interface VereinsergebnisStaffelBesetzung {
  readonly wettkampfnr: number;
  readonly wettkampfart: string;
  readonly personen: readonly VereinsergebnisStaffelPerson[];
  readonly zwischenzeiten: readonly VereinsergebnisStaffelZwischenzeit[];
}

/** Der Schwimmvorgang einer Staffel in einem Wettkampf. */
export interface VereinsergebnisStaffelStart {
  /** Veranstaltungsweit eindeutige Kennung der Staffel. */
  readonly veranstaltungsId: number;
  readonly wettkampfnr: number;
  readonly wettkampfart: string;
  /** Hundertstelsekunden, `null` bei ungültiger Angabe. */
  readonly endzeit: number | null;
  readonly platzierungen: readonly VereinsergebnisStaffelPlatzierung[];
  readonly personen: readonly VereinsergebnisStaffelPerson[];
  readonly zwischenzeiten: readonly VereinsergebnisStaffelZwischenzeit[];
  readonly abloesen: readonly VereinsergebnisAbloese[];
  /** Zeilennummer der ersten zugrunde liegenden STAFFELERGEBNIS-Zeile. */
  readonly line: number;
}

/** Eine gemeldete Mannschaft mit allen ihren Starts. */
export interface VereinsergebnisStaffel {
  /** Veranstaltungsweit eindeutige Kennung aus `veranstaltungsIdStaffel`. */
  readonly veranstaltungsId: number;
  readonly nummerDerMannschaft: string;
  readonly wertungsklasseTyp: string;
  readonly mindestJgAk: string;
  readonly maximalJgAk: string;
  /** Dieselben Objekte, die auch unter ihrem Wettkampf hängen. */
  readonly starts: readonly VereinsergebnisStaffelStart[];
  /**
   * Die Besetzung je Wettkampf — auch dann gefüllt, wenn die Datei zu diesem
   * Wettkampf gar kein STAFFELERGEBNIS führt.
   */
  readonly besetzungen: readonly VereinsergebnisStaffelBesetzung[];
  readonly line: number;
}

/**
 * Ein einzelner Wettkampf.
 *
 * Identifiziert über das Paar aus `nummer` und `art`, nicht über die Nummer
 * allein: Dieselbe Nummer kommt als Vorlauf und als Entscheidung vor.
 */
export interface VereinsergebnisWettkampf {
  readonly nummer: number;
  readonly art: string;
  readonly abschnittsnr: number;
  readonly anzahlStarter: string;
  readonly einzelstrecke: number;
  readonly technik: string;
  readonly ausuebung: string;
  readonly geschlecht: string;
  readonly zuordnungBestenliste: string;
  readonly wertungen: readonly VereinsergebnisWertung[];
  readonly starts: readonly VereinsergebnisStart[];
  readonly staffelStarts: readonly VereinsergebnisStaffelStart[];
  /** Auflösung von qualifikationswettkampfnr/-art, `null` wenn nicht gesetzt. */
  readonly qualifikationAus: { readonly nummer: number; readonly art: string } | null;
  readonly line: number;
}

/** Ein Veranstaltungsabschnitt samt Kampfgericht und Wettkämpfen. */
export interface VereinsergebnisAbschnitt {
  readonly nummer: number;
  readonly datum: Datum | null;
  /** Minuten seit Mitternacht, `null` ohne oder bei ungültiger Angabe. */
  readonly anfangszeit: number | null;
  /** `J`, wenn die Zeit relativ zum Ende des Vorabschnitts gilt. */
  readonly relativeAngabe: string;
  readonly kampfrichter: readonly VereinsergebnisKampfrichter[];
  readonly wettkaempfe: readonly VereinsergebnisWettkampf[];
  readonly line: number;
}

export interface Vereinsergebnis {
  readonly veranstaltung: VereinsergebnisVeranstaltung;
  /** Der eine Verein der Datei; `null`, wenn sie keinen führt. */
  readonly verein: VereinsergebnisVerein | null;
  readonly abschnitte: readonly VereinsergebnisAbschnitt[];
  /** Wettkämpfe, deren `abschnittsnr` auf keinen Abschnitt zeigt. */
  readonly wettkaempfeOhneAbschnitt: readonly VereinsergebnisWettkampf[];
  readonly personen: readonly VereinsergebnisPerson[];
  readonly staffeln: readonly VereinsergebnisStaffel[];
  /** Schlüssel ist `${nummer}:${art}`. */
  readonly wettkampfByKey: ReadonlyMap<string, VereinsergebnisWettkampf>;
  readonly wertungById: ReadonlyMap<number, VereinsergebnisWertung>;
  readonly abschnittByNummer: ReadonlyMap<number, VereinsergebnisAbschnitt>;
  /** Schlüssel ist die `veranstaltungsId` der Person. */
  readonly personById: ReadonlyMap<number, VereinsergebnisPerson>;
  /** Schlüssel ist die `veranstaltungsId` der Staffel. */
  readonly staffelById: ReadonlyMap<number, VereinsergebnisStaffel>;
  /** Schlüssel ist `${veranstaltungsId}:${wettkampfnr}:${wettkampfart}`. */
  readonly startByKey: ReadonlyMap<string, VereinsergebnisStart>;
  /** Schlüssel ist `${veranstaltungsIdStaffel}:${wettkampfnr}:${wettkampfart}`. */
  readonly staffelStartByKey: ReadonlyMap<string, VereinsergebnisStaffelStart>;
}

export interface VereinsergebnisProjectionResult {
  readonly graph: Vereinsergebnis;
  readonly diagnostics: readonly Diagnostic[];
}

const EMPTY_VERANSTALTUNG: VereinsergebnisVeranstaltung = {
  bezeichnung: '',
  ort: '',
  bahnlaenge: '',
  zeitmessung: '',
};

/** Feldwert eines Records; fehlende Felder ergeben die leere Zeichenkette. */
const unterlassungswert = createDefaultLookup(VEREINSERGEBNISLISTE);

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

/** Schlüssel eines Starts aus Person oder Staffel und Wettkampf. */
function startKey(id: number, nummer: number, art: string): string {
  return `${String(id)}:${String(nummer)}:${art}`;
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

/**
 * Sammelt die Platzierungen eines Starts und meldet eine zweite Platzierung
 * derselben Wertung.
 *
 * dsv8.md:3471 — "Für jede definierte Wertung muss hier jeweils die erreichte
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
function sammlePlatzierungen<T extends { readonly wertungsId: number; readonly line: number }>(
  zeilen: readonly TypedRecord[],
  bauen: (record: TypedRecord) => T,
  element: string,
  key: string,
  diagnostics: Diagnostic[],
): T[] {
  const platzierungen: T[] = [];
  for (const zeile of zeilen) {
    const neu = bauen(zeile);
    if (platzierungen.some((p) => p.wertungsId === neu.wertungsId)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `${element} for ${key} repeats Wertung ${String(neu.wertungsId)}; the first placement wins`,
          { ...at(neu.line), data: { element, key, wertungsId: neu.wertungsId } },
        ),
      );
      continue;
    }
    platzierungen.push(neu);
  }
  return platzierungen;
}

/** Die Platzierung, die eine Ergebniszeile beschreibt. */
function platzierung(record: TypedRecord): VereinsergebnisPlatzierung {
  return {
    wertungsId: number(record, 'wertungsId'),
    platz: number(record, 'platz'),
    grundDerNichtwertung: value(record, 'grundDerNichtwertung'),
    disqualifikationsbemerkung: value(record, 'disqualifikationsbemerkung'),
    erhoehtesNachtraeglichesMeldegeld: value(record, 'erhoehtesNachtraeglichesMeldegeld'),
    line: record.line,
  };
}

/** Die Platzierung einer Staffel, um die Angaben zur Disqualifikation ergänzt. */
function staffelPlatzierung(record: TypedRecord): VereinsergebnisStaffelPlatzierung {
  return {
    ...platzierung(record),
    startnummerDisqualifiziert: value(record, 'startnummerDisqualifiziert'),
  };
}

/**
 * Die Endzeit eines Starts, gelesen aus seinen Ergebniszeilen.
 *
 * Nicht einfach die erste Zeile: Ist ein Start in einer Wertung gewertet und in
 * einer anderen nicht, trägt die nicht gewertete Zeile eine Platzhalterzeit
 * (`00:00:00,00`) statt der geschwommenen. Welche Zeile zuerst kommt, ist
 * beliebig. Massgeblich ist deshalb die erste gewertete Zeile; gibt es keine,
 * bleibt es bei der ersten überhaupt.
 */
function endzeitVon(records: readonly TypedRecord[]): TypedRecord | undefined {
  return records.find((r) => value(r, 'grundDerNichtwertung') === '') ?? records[0];
}

/** Zwischenstand eines Wettkampfes, dessen Kinderlisten noch wachsen. */
interface WettkampfBuilder {
  readonly wertungen: VereinsergebnisWertung[];
  readonly starts: VereinsergebnisStart[];
  readonly staffelStarts: VereinsergebnisStaffelStart[];
  readonly wettkampf: VereinsergebnisWettkampf;
}

/** Zwischenstand eines Starts, dessen Kinderlisten noch wachsen. */
interface StartBuilder {
  readonly platzierungen: VereinsergebnisPlatzierung[];
  readonly zwischenzeiten: VereinsergebnisZwischenzeit[];
  readonly reaktionen: VereinsergebnisReaktion[];
  readonly start: VereinsergebnisStart;
}

/** Zwischenstand eines Staffelstarts, dessen Kinderlisten noch wachsen. */
interface StaffelStartBuilder {
  readonly platzierungen: VereinsergebnisStaffelPlatzierung[];
  readonly abloesen: VereinsergebnisAbloese[];
  readonly start: VereinsergebnisStaffelStart;
  /**
   * Die bereits übernommenen Kindzeilen, je Element nach ihrer fachlichen
   * Identität — siehe die Anmerkung zur Wiederholung je Wertung oben.
   */
  readonly gesehen: {
    readonly abloesen: Set<string>;
  };
}

/** Zwischenstand einer Staffelbesetzung, deren Kinderlisten noch wachsen. */
interface BesetzungBuilder {
  readonly personen: VereinsergebnisStaffelPerson[];
  readonly zwischenzeiten: VereinsergebnisStaffelZwischenzeit[];
  readonly besetzung: VereinsergebnisStaffelBesetzung;
  /** Zeile der ersten Kindzeile — der Anker für Befunde ohne STAFFELERGEBNIS. */
  readonly line: number;
  readonly gesehen: {
    readonly personen: Set<number>;
    readonly zwischenzeiten: Set<string>;
  };
}

/**
 * Baut aus einer gelesenen Vereinsergebnisliste einen Objektgraph mit
 * aufgelösten Bezügen.
 *
 * Die Projektion bricht nie ab: Zeigt ein Bezug ins Leere oder widersprechen
 * sich zwei Zeilen, entsteht eine Warnung, und der Graph wird — bei
 * Widersprüchen gewinnt die erste Zeile — so vollständig wie möglich aufgebaut.
 * Ein Wettkampf ohne auffindbaren Abschnitt landet in
 * `wettkaempfeOhneAbschnitt` statt verloren zu gehen.
 */
export function projectVereinsergebnisliste(
  liste: Vereinsergebnisliste,
): VereinsergebnisProjectionResult {
  const diagnostics: Diagnostic[] = [];
  const records = liste.records;

  const veranstaltung = projectVeranstaltung(records);

  // --- Verein --------------------------------------------------------------
  // VEREIN kommt genau einmal vor; kommt er doch mehrfach, gewinnt die erste
  // Zeile. Das Zuviel meldet bereits die Kardinalitätsprüfung — hier bliebe nur
  // die Frage, welcher Verein gilt.
  const vereinRecord = records.find((r) => r.element === 'VEREIN');
  const verein: VereinsergebnisVerein | null =
    vereinRecord === undefined
      ? null
      : {
          bezeichnung: value(vereinRecord, 'vereinsbezeichnung'),
          kennzahl: number(vereinRecord, 'vereinskennzahl'),
          landesschwimmverband: value(vereinRecord, 'landesschwimmverband'),
          nationenkuerzel: value(vereinRecord, 'nationenkuerzel'),
          line: vereinRecord.line,
        };

  // --- Abschnitte ----------------------------------------------------------
  const abschnitte: VereinsergebnisAbschnitt[] = [];
  const abschnittWettkaempfe = new Map<VereinsergebnisAbschnitt, VereinsergebnisWettkampf[]>();
  const abschnittKampfrichter = new Map<number, VereinsergebnisKampfrichter[]>();
  const abschnittByNummer = new Map<number, VereinsergebnisAbschnitt>();

  for (const record of records) {
    if (record.element !== 'ABSCHNITT') continue;

    const wettkaempfe: VereinsergebnisWettkampf[] = [];
    const kampfrichter: VereinsergebnisKampfrichter[] = [];
    const nummer = number(record, 'abschnittsnr');
    const abschnitt: VereinsergebnisAbschnitt = {
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
    const kampfrichter: VereinsergebnisKampfrichter = {
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
  const wettkaempfeOhneAbschnitt: VereinsergebnisWettkampf[] = [];

  for (const record of records) {
    if (record.element !== 'WETTKAMPF') continue;

    const nummer = number(record, 'wettkampfnr');
    const art = value(record, 'wettkampfart');
    const abschnittsnr = number(record, 'abschnittsnr');

    const qualNummer = number(record, 'qualifikationswettkampfnr');
    const qualArt = value(record, 'qualifikationswettkampfart');
    const qualifikationAus =
      Number.isFinite(qualNummer) || qualArt !== '' ? { nummer: qualNummer, art: qualArt } : null;

    const wertungen: VereinsergebnisWertung[] = [];
    const starts: VereinsergebnisStart[] = [];
    const staffelStarts: VereinsergebnisStaffelStart[] = [];
    const wettkampf: VereinsergebnisWettkampf = {
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
      staffelStarts,
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
      builders.set(key, { wertungen, starts, staffelStarts, wettkampf });
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
  const wertungById = new Map<number, VereinsergebnisWertung>();
  /** Der Wettkampf, zu dem eine Wertung gehört, als `wettkampfKey`. */
  const wettkampfByWertungsId = new Map<number, string>();

  for (const record of records) {
    if (record.element !== 'WERTUNG') continue;

    const id = number(record, 'wertungsId');
    const wertung: VereinsergebnisWertung = {
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

  /**
   * Meldet eine Platzierung, deren Wertung es nicht gibt oder die zu einem
   * anderen Wettkampf gehört.
   *
   * Die Wertungs-ID ist zwar veranstaltungsweit eindeutig (dsv8.md:3253), aber
   * jede Wertung nennt selbst einen Wettkampf. Ein Ergebnis darf deshalb nur
   * auf eine Wertung seines eigenen Wettkampfs zeigen — die Spezifikation
   * verlangt bei PERSONENERGEBNIS ausdrücklich, „für jede definierte Wertung"
   * die erreichte Platzierung auszugeben (dsv8.md:3459).
   *
   * An den echten Dateien gemessen: Alle 97 330 Ergebnisse der 72
   * Wettkampfergebnislisten in `test/fixtures/real` zeigen auf eine Wertung
   * ihres eigenen Wettkampfs — kein einziger Verstoss.
   */
  function pruefeWertung(record: TypedRecord, id: number): void {
    const wertungsId = number(record, 'wertungsId');
    if (!wertungById.has(wertungsId)) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} for ${String(id)} refers to unknown WERTUNG ${value(record, 'wertungsId')}`,
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

  // --- Personen ------------------------------------------------------------
  const personen: VereinsergebnisPerson[] = [];
  const personById = new Map<number, VereinsergebnisPerson>();
  const personStarts = new Map<number, VereinsergebnisStart[]>();

  for (const record of records) {
    if (record.element !== 'PERSON') continue;

    const veranstaltungsId = number(record, 'veranstaltungsId');
    const starts: VereinsergebnisStart[] = [];
    const person: VereinsergebnisPerson = {
      veranstaltungsId,
      name: value(record, 'name'),
      dsvId: value(record, 'dsvId'),
      geschlecht: value(record, 'geschlecht'),
      jahrgang: value(record, 'jahrgang'),
      altersklasse: value(record, 'altersklasse'),
      nationalitaeten: nationalitaeten(record),
      starts,
      line: record.line,
    };
    personen.push(person);

    if (personById.has(veranstaltungsId)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate PERSON id ${String(veranstaltungsId)}; the first one wins`,
          { ...at(record.line), data: { element: 'PERSON', veranstaltungsId } },
        ),
      );
    } else if (Number.isFinite(veranstaltungsId)) {
      personById.set(veranstaltungsId, person);
      personStarts.set(veranstaltungsId, starts);
    }
  }

  // --- Einzelergebnisse ----------------------------------------------------
  // Zuerst gruppieren, dann bauen: Welche der je Wertung wiederholten Zeilen
  // die geschwommene Endzeit trägt, steht erst fest, wenn alle vorliegen.
  const ergebnisZeilen = new Map<string, TypedRecord[]>();

  for (const record of records) {
    if (record.element !== 'PERSONENERGEBNIS') continue;

    const key = startKey(
      number(record, 'veranstaltungsId'),
      number(record, 'wettkampfnr'),
      value(record, 'wettkampfart'),
    );
    const bucket = ergebnisZeilen.get(key);
    if (bucket === undefined) ergebnisZeilen.set(key, [record]);
    else bucket.push(record);
  }

  const startBuilders = new Map<string, StartBuilder>();

  for (const [key, zeilen] of ergebnisZeilen) {
    const erste = zeilen[0];
    if (erste === undefined) continue;

    const veranstaltungsId = number(erste, 'veranstaltungsId');
    const nummer = number(erste, 'wettkampfnr');
    const art = value(erste, 'wettkampfart');

    const platzierungen = sammlePlatzierungen(
      zeilen,
      platzierung,
      'PERSONENERGEBNIS',
      key,
      diagnostics,
    );
    const zwischenzeiten: VereinsergebnisZwischenzeit[] = [];
    const reaktionen: VereinsergebnisReaktion[] = [];
    const start: VereinsergebnisStart = {
      veranstaltungsId,
      wettkampfnr: nummer,
      wettkampfart: art,
      endzeit: decodeZeit(value(endzeitVon(zeilen) ?? erste, 'endzeit')),
      platzierungen,
      zwischenzeiten,
      reaktionen,
      line: erste.line,
    };

    startBuilders.set(key, { platzierungen, zwischenzeiten, reaktionen, start });
    for (const zeile of zeilen) pruefeWertung(zeile, veranstaltungsId);

    const person = personStarts.get(veranstaltungsId);
    if (person === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `PERSONENERGEBNIS for ${key} refers to unknown PERSON ${value(erste, 'veranstaltungsId')}`,
          { ...at(erste.line), data: { element: 'PERSONENERGEBNIS', key, veranstaltungsId } },
        ),
      );
    } else {
      person.push(start);
    }

    const builder = builders.get(wettkampfKey(nummer, art));
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `PERSONENERGEBNIS for ${key} refers to unknown WETTKAMPF ${wettkampfKey(nummer, art)}`,
          { ...at(erste.line), data: { element: 'PERSONENERGEBNIS', key } },
        ),
      );
      continue;
    }
    builder.starts.push(start);
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
          `${record.element} refers to unknown PERSONENERGEBNIS ${key}`,
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

  // --- Staffeln ------------------------------------------------------------
  const staffeln: VereinsergebnisStaffel[] = [];
  const staffelById = new Map<number, VereinsergebnisStaffel>();
  const staffelStarts = new Map<number, VereinsergebnisStaffelStart[]>();
  const staffelBesetzungen = new Map<number, VereinsergebnisStaffelBesetzung[]>();

  for (const record of records) {
    if (record.element !== 'STAFFEL') continue;

    const veranstaltungsId = number(record, 'veranstaltungsIdStaffel');
    const starts: VereinsergebnisStaffelStart[] = [];
    const besetzungen: VereinsergebnisStaffelBesetzung[] = [];
    const staffel: VereinsergebnisStaffel = {
      veranstaltungsId,
      nummerDerMannschaft: value(record, 'nummerDerMannschaft'),
      wertungsklasseTyp: value(record, 'wertungsklasseTyp'),
      mindestJgAk: value(record, 'mindestJgAk'),
      maximalJgAk: value(record, 'maximalJgAk'),
      starts,
      besetzungen,
      line: record.line,
    };
    staffeln.push(staffel);

    if (staffelById.has(veranstaltungsId)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate STAFFEL id ${String(veranstaltungsId)}; the first one wins`,
          {
            ...at(record.line),
            data: { element: 'STAFFEL', veranstaltungsIdStaffel: veranstaltungsId },
          },
        ),
      );
    } else if (Number.isFinite(veranstaltungsId)) {
      staffelById.set(veranstaltungsId, staffel);
      staffelStarts.set(veranstaltungsId, starts);
      staffelBesetzungen.set(veranstaltungsId, besetzungen);
    }
  }

  // --- Besetzungen ---------------------------------------------------------
  // STAFFELPERSON und STZWISCHENZEIT verweisen laut dsv8.md:3814-3815 und
  // :4117-4118 auf die in STAFFEL definierte Kennung, nicht auf das Ergebnis.
  // Die Besetzung wird deshalb an der Staffel geführt und liegt vor, bevor die
  // Ergebniszeilen sie sich borgen — STAFFELERGEBNIS darf ganz fehlen
  // (dsv8.md:3936, "Vorkommen 0 - N").
  const besetzungBuilders = new Map<string, BesetzungBuilder>();

  /** Liefert die Besetzung zum Schlüssel und legt sie beim ersten Mal an. */
  function besetzungFor(
    key: string,
    veranstaltungsId: number,
    wettkampfnr: number,
    wettkampfart: string,
    line: number,
  ): BesetzungBuilder {
    const vorhanden = besetzungBuilders.get(key);
    if (vorhanden !== undefined) return vorhanden;

    const personen: VereinsergebnisStaffelPerson[] = [];
    const zwischenzeiten: VereinsergebnisStaffelZwischenzeit[] = [];
    const builder: BesetzungBuilder = {
      personen,
      zwischenzeiten,
      besetzung: { wettkampfnr, wettkampfart, personen, zwischenzeiten },
      line,
      gesehen: { personen: new Set(), zwischenzeiten: new Set() },
    };
    besetzungBuilders.set(key, builder);
    staffelBesetzungen.get(veranstaltungsId)?.push(builder.besetzung);
    return builder;
  }

  for (const record of records) {
    if (record.element !== 'STAFFELPERSON' && record.element !== 'STZWISCHENZEIT') continue;

    const veranstaltungsId = number(record, 'veranstaltungsIdStaffel');
    const wettkampfnr = number(record, 'wettkampfnr');
    const wettkampfart = value(record, 'wettkampfart');

    if (!staffelById.has(veranstaltungsId)) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} refers to unknown STAFFEL ${value(record, 'veranstaltungsIdStaffel')}`,
          {
            ...at(record.line),
            data: { element: record.element, veranstaltungsIdStaffel: veranstaltungsId },
          },
        ),
      );
      continue;
    }

    // Die Kennung der Staffel allein genügt nicht: Dieselbe Mannschaft startet
    // in mehreren Wettkämpfen unter derselben Kennung. Erst zusammen mit
    // Nummer und Art des Wettkampfes ist sie eindeutig — alle drei Elemente
    // führen diese Felder deshalb mit.
    const key = startKey(veranstaltungsId, wettkampfnr, wettkampfart);
    const builder = besetzungFor(key, veranstaltungsId, wettkampfnr, wettkampfart, record.line);
    const startnummer = number(record, 'startnummer');

    if (record.element === 'STAFFELPERSON') {
      if (builder.gesehen.personen.has(startnummer)) continue;
      builder.gesehen.personen.add(startnummer);
      builder.personen.push({
        name: value(record, 'name'),
        dsvId: value(record, 'dsvId'),
        startnummer,
        geschlecht: value(record, 'geschlecht'),
        jahrgang: value(record, 'jahrgang'),
        altersklasse: value(record, 'altersklasse'),
        nationalitaeten: nationalitaeten(record),
        line: record.line,
      });
    } else {
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
    }
  }

  // --- Staffelergebnisse ---------------------------------------------------
  const staffelZeilen = new Map<string, TypedRecord[]>();

  for (const record of records) {
    if (record.element !== 'STAFFELERGEBNIS') continue;

    const key = startKey(
      number(record, 'veranstaltungsIdStaffel'),
      number(record, 'wettkampfnr'),
      value(record, 'wettkampfart'),
    );
    const bucket = staffelZeilen.get(key);
    if (bucket === undefined) staffelZeilen.set(key, [record]);
    else bucket.push(record);
  }

  const staffelStartBuilders = new Map<string, StaffelStartBuilder>();

  for (const [key, zeilen] of staffelZeilen) {
    const erste = zeilen[0];
    if (erste === undefined) continue;

    const veranstaltungsId = number(erste, 'veranstaltungsIdStaffel');
    const nummer = number(erste, 'wettkampfnr');
    const art = value(erste, 'wettkampfart');

    const platzierungen = sammlePlatzierungen(
      zeilen,
      staffelPlatzierung,
      'STAFFELERGEBNIS',
      key,
      diagnostics,
    );
    // Der Start borgt sich die Listen der Besetzung — dieselben Objekte, nicht
    // Kopien, damit beide Wege denselben Stand zeigen.
    const besetzung = besetzungFor(key, veranstaltungsId, nummer, art, erste.line);
    const personenDerStaffel = besetzung.personen;
    const zwischenzeiten = besetzung.zwischenzeiten;
    const abloesen: VereinsergebnisAbloese[] = [];
    const start: VereinsergebnisStaffelStart = {
      veranstaltungsId,
      wettkampfnr: nummer,
      wettkampfart: art,
      endzeit: decodeZeit(value(endzeitVon(zeilen) ?? erste, 'endzeit')),
      platzierungen,
      personen: personenDerStaffel,
      zwischenzeiten,
      abloesen,
      line: erste.line,
    };

    staffelStartBuilders.set(key, {
      platzierungen,
      abloesen,
      start,
      gesehen: { abloesen: new Set() },
    });
    for (const zeile of zeilen) pruefeWertung(zeile, veranstaltungsId);

    const staffel = staffelStarts.get(veranstaltungsId);
    if (staffel === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STAFFELERGEBNIS for ${key} refers to unknown STAFFEL ${value(erste, 'veranstaltungsIdStaffel')}`,
          {
            ...at(erste.line),
            data: { element: 'STAFFELERGEBNIS', key, veranstaltungsIdStaffel: veranstaltungsId },
          },
        ),
      );
    } else {
      staffel.push(start);
    }

    const builder = builders.get(wettkampfKey(nummer, art));
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STAFFELERGEBNIS for ${key} refers to unknown WETTKAMPF ${wettkampfKey(nummer, art)}`,
          { ...at(erste.line), data: { element: 'STAFFELERGEBNIS', key } },
        ),
      );
      continue;
    }
    builder.staffelStarts.push(start);
  }

  // STABLOESE bleibt bewusst am STAFFELERGEBNIS verankert. Die Spec nennt für
  // dieses eine Element in Kapitel 5.3 als Anker "STERGEBNIS"
  // (dsv8.md:4174-4175) — ein Element, das es in der Vereinsergebnisliste gar
  // nicht gibt. Welches Element gemeint ist, lässt sich daraus nicht ableiten;
  // solange die Absicht unklar ist, wird nicht geraten.
  for (const record of records) {
    if (record.element !== 'STABLOESE') continue;

    const key = startKey(
      number(record, 'veranstaltungsIdStaffel'),
      number(record, 'wettkampfnr'),
      value(record, 'wettkampfart'),
    );
    const builder = staffelStartBuilders.get(key);

    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} refers to unknown STAFFELERGEBNIS ${key}`,
          { ...at(record.line), data: { element: record.element, key } },
        ),
      );
      continue;
    }

    const startnummer = number(record, 'startnummer');

    {
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

  // dsv8.md:3805 — "Falls nicht alle Staffelteilnehmer angegeben sind, ist die
  // Ausgabe der Staffelpersonen zu unterdrücken." Die Regel steht wortgleich im
  // eigenen Kapitel der Vereinsergebnisliste, nicht nur bei der
  // Wettkampfergebnisliste (dsv8.md:5531): Sie kennt genau zwei erlaubte
  // Zustände, alle Teilnehmer oder keinen. Eine Staffel, die einige nennt,
  // lässt offen, ob der Rest fehlt oder gar nicht mitschwamm.
  //
  // Gezählt werden verschiedene Startnummern, nicht Zeilen: Sonst schlüge die
  // Prüfung durch die je Wertung wiederholten Personenblöcke in die falsche
  // Richtung aus und hielte eine halbe Staffel für vollständig.
  for (const [key, builder] of besetzungBuilders) {
    const genannt = builder.gesehen.personen.size;
    if (genannt === 0) continue;

    const besetzung = builder.besetzung;
    const wettkampf = builders.get(wettkampfKey(besetzung.wettkampfnr, besetzung.wettkampfart));
    const erwartet = Number(wettkampf?.wettkampf.anzahlStarter);
    if (!Number.isFinite(erwartet) || erwartet <= 0 || genannt >= erwartet) continue;

    // `element` benennt überall in dieser Projektion das Element, auf das
    // `line` zeigt. Liegt ein STAFFELERGEBNIS vor, ist das dessen Zeile — der
    // Befund gilt der Staffel als Ganzes, eine einzelne Personenzeile ist
    // nicht die schuldige. Fehlt es (dsv8.md:3936, "Vorkommen 0 - N"), bleibt
    // nur die erste Kindzeile als Anker.
    const start = staffelStartBuilders.get(key)?.start;
    const element = start === undefined ? 'STAFFELPERSON' : 'STAFFELERGEBNIS';

    diagnostics.push(
      createDiagnostic(
        'incomplete-relay',
        'warning',
        `${element} ${key} names ${String(genannt)} of ${String(erwartet)} relay members; either all or none are expected`,
        {
          ...at(start?.line ?? builder.line),
          data: { element, key, genannt, erwartet },
        },
      ),
    );
  }

  const wettkampfByKey = new Map<string, VereinsergebnisWettkampf>();
  for (const [key, builder] of builders) wettkampfByKey.set(key, builder.wettkampf);

  const startByKey = new Map<string, VereinsergebnisStart>();
  for (const [key, builder] of startBuilders) startByKey.set(key, builder.start);

  const staffelStartByKey = new Map<string, VereinsergebnisStaffelStart>();
  for (const [key, builder] of staffelStartBuilders) staffelStartByKey.set(key, builder.start);

  return {
    graph: {
      veranstaltung,
      verein,
      abschnitte,
      wettkaempfeOhneAbschnitt,
      personen,
      staffeln,
      wettkampfByKey,
      wertungById,
      abschnittByNummer,
      personById,
      staffelById,
      startByKey,
      staffelStartByKey,
    },
    diagnostics,
  };
}

/** Die Eckdaten der Veranstaltung; ohne VERANSTALTUNG-Record leere Werte. */
function projectVeranstaltung(records: readonly TypedRecord[]): VereinsergebnisVeranstaltung {
  const record = records.find((r) => r.element === 'VERANSTALTUNG');
  if (record === undefined) return EMPTY_VERANSTALTUNG;

  return {
    bezeichnung: value(record, 'veranstaltungsbezeichnung'),
    ort: value(record, 'veranstaltungsort'),
    bahnlaenge: value(record, 'bahnlaenge'),
    zeitmessung: value(record, 'zeitmessung'),
  };
}
