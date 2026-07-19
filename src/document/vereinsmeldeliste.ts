import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { TypedRecord } from '../parse/parse-typed-list.js';
import type { Vereinsmeldeliste } from '../parse/parse-vereinsmeldeliste.js';
import type { Datum } from '../values/datum.js';
import { decodeDatum } from '../values/datum.js';
import { decodeUhrzeit } from '../values/uhrzeit.js';
import { decodeZeit } from '../values/zeit.js';

/**
 * Objektgraph einer Vereinsmeldeliste.
 *
 * Diese Listenart ist eine Meldung, kein Ergebnis: Sie sagt, wer antreten will,
 * nicht, wer wie schnell war. Entsprechend heissen die Entitäten `Meldung` statt
 * `Ergebnis`, und statt einer Endzeit trägt jeder Start eine Meldezeit.
 *
 * Ein Unterschied zu allen anderen Listenarten verlangt eine ausdrückliche
 * Regel: STARTPN und STARTST nennen den Wettkampf **nur über die Nummer, ohne
 * die Wettkampfart** (dsv8.md:2381, dsv8.md:2499), während WETTKAMPF über
 * Nummer UND Art identifiziert ist. Derselbe Lauf kann als Vorlauf, Zwischenlauf
 * und Finale unter derselben Nummer geführt sein — die Auflösung ist damit
 * potenziell mehrdeutig. Sie geschieht deshalb so:
 *
 * - Genau ein Wettkampf mit dieser Nummer: Er wird zugeordnet, und die
 *   aufgelöste Art steht als `wettkampfart` am Start.
 * - Mehrere Wettkämpfe mit dieser Nummer: `ambiguous-reference`. Wie überall im
 *   Projekt gewinnt der erste — der Start geht nicht verloren, aber die
 *   Zuordnung ist ausdrücklich als unsicher gemeldet.
 * - Kein Wettkampf mit dieser Nummer: `dangling-reference`. Der Start bleibt
 *   unter seiner Meldung, seine `wettkampfart` bleibt leer.
 *
 * Ebenso ausdrücklich behandelt: dsv8.md:2524 — „Reine Staffelschwimmer müssen
 * als PNMELDUNG ohne STARTPN angegeben werden." Eine Personenmeldung ohne
 * Einzelstart ist damit der vorgesehene Normalfall und keine Auffälligkeit; der
 * Objektgraph meldet dazu nichts. Ihre `starts` bleiben schlicht leer.
 *
 * Bewusste Festlegungen, wie bei den anderen Objektgraphen:
 *
 * - Nur einfache Objekte, keine Klassen. Beim Dual-Publish für ESM und CJS gibt
 *   es zwei Modulinstanzen; `instanceof` schlüge über diese Grenze fehl.
 * - Alle Bezüge werden sofort aufgelöst, nicht über Getter.
 * - Keine Rückverweise. Ein Zeiger vom Start auf seinen Wettkampf erzeugte
 *   einen Zyklus, an dem `JSON.stringify` wirft. Stattdessen stehen Index-Maps
 *   auf der obersten Ebene. Jeder Start hängt an genau zwei Stellen — unter
 *   seiner Meldung und unter seinem Wettkampf —, aber es ist dasselbe Objekt,
 *   nicht zwei Abschriften.
 * - Werte bleiben Zeichenketten, ausser Datum, Uhrzeit und Zeit.
 * - `dangling-reference` und `ambiguous-reference` sind Warnungen; die
 *   Projektion bricht nie ab.
 * - Nicht lesbare Zahlenfelder ergeben `NaN`, nicht `0`.
 */
export interface MeldungVeranstaltung {
  readonly bezeichnung: string;
  readonly ort: string;
  readonly bahnlaenge: string;
  readonly zeitmessung: string;
}

/** Der meldende Verein; die Datei betrifft genau einen. */
export interface MeldungVerein {
  readonly bezeichnung: string;
  /** Vierstellige Kennzahl; `0` bei nicht dem DSV angehörenden Vereinen. */
  readonly kennzahl: number;
  readonly landesschwimmverband: string;
  readonly nationenkuerzel: string;
  /** `J`, wenn das Meldegeld eingezogen werden darf. */
  readonly lastschrift: string;
  readonly line: number;
}

/** Die für die Meldung verantwortliche Person. */
export interface MeldungAnsprechpartner {
  readonly name: string;
  readonly strasse: string;
  readonly plz: string;
  readonly ort: string;
  readonly land: string;
  readonly telefon: string;
  readonly fax: string;
  readonly email: string;
  readonly line: number;
}

/** Ein gemeldeter Trainer. */
export interface MeldungTrainer {
  readonly nummer: number;
  readonly name: string;
  readonly geschlecht: string;
  readonly line: number;
}

/** Der Einsatzwunsch eines Kampfrichters in einem Abschnitt. */
export interface MeldungKampfrichterEinsatz {
  readonly nummerKampfrichter: number;
  readonly abschnittsnummer: number;
  readonly einsatzwunsch: string;
  readonly line: number;
}

/** Ein gemeldeter Kampfrichter samt seinen Einsatzwünschen. */
export interface MeldungKampfrichter {
  readonly nummer: number;
  readonly name: string;
  readonly kampfrichtergruppe: string;
  readonly geschlecht: string;
  /** Dieselben Objekte, die auch unter ihrem Abschnitt hängen. */
  readonly einsaetze: readonly MeldungKampfrichterEinsatz[];
  readonly line: number;
}

/** Die Handicap-Angaben einer Personenmeldung. */
export interface MeldungHandicap {
  readonly dbsId: string;
  readonly ipcId: string;
  readonly startklasse: string;
  readonly startklasseBrust: string;
  readonly startklasseLagen: string;
  readonly exceptions: string;
  readonly line: number;
}

/**
 * Der gemeldete Start einer Person oder Staffel in einem Wettkampf.
 *
 * `wettkampfart` ist nicht abgeschrieben, sondern aufgelöst: Die Datei nennt
 * nur die Nummer. Bleibt sie leer, war die Nummer keinem Wettkampf zuzuordnen.
 */
export interface MeldungStart {
  readonly wettkampfnr: number;
  readonly wettkampfart: string;
  /** Hundertstelsekunden, `null` ohne oder bei ungültiger Angabe. */
  readonly meldezeit: number | null;
  readonly line: number;
}

/** Ein Mitglied einer gemeldeten Staffel. */
export interface MeldungStaffelPerson {
  /** Veranstaltungs-ID der Person; verweist auf eine `MeldungPerson`. */
  readonly veranstaltungsId: number;
  readonly wettkampfnr: number;
  readonly startnummer: number;
  readonly line: number;
}

/** Eine gemeldete Person. */
export interface MeldungPerson {
  readonly veranstaltungsId: number;
  readonly name: string;
  readonly dsvId: string;
  readonly geschlecht: string;
  readonly jahrgang: string;
  readonly altersklasse: string;
  /** Aufgelöst über `nummerTrainer`; `null`, wenn keiner genannt ist. */
  readonly trainer: MeldungTrainer | null;
  readonly nationalitaeten: readonly string[];
  readonly handicap: MeldungHandicap | null;
  /**
   * Die gemeldeten Einzelstarts. Leer bei reinen Staffelschwimmern — das ist
   * der vorgesehene Normalfall (dsv8.md:2524), kein Mangel.
   */
  readonly starts: readonly MeldungStart[];
  readonly line: number;
}

/** Eine gemeldete Staffel. */
export interface MeldungStaffel {
  /** Veranstaltungsweit eindeutige Kennung aus `veranstaltungsIdStaffel`. */
  readonly veranstaltungsId: number;
  readonly nummerDerMannschaft: string;
  readonly wertungsklasseTyp: string;
  readonly mindestJgAk: string;
  readonly maximalJgAk: string;
  readonly name: string;
  readonly starts: readonly MeldungStart[];
  readonly personen: readonly MeldungStaffelPerson[];
  readonly line: number;
}

/**
 * Ein einzelner Wettkampf.
 *
 * Identifiziert über das Paar aus `nummer` und `art` — die Starts der Meldung
 * nennen dagegen nur die Nummer, siehe die Anmerkung am Modulkopf.
 */
export interface MeldungWettkampf {
  readonly nummer: number;
  readonly art: string;
  readonly abschnittsnr: number;
  readonly anzahlStarter: string;
  readonly einzelstrecke: number;
  readonly technik: string;
  readonly ausuebung: string;
  readonly geschlecht: string;
  /** Dieselben Objekte, die auch unter ihrer Meldung hängen. */
  readonly starts: readonly MeldungStart[];
  readonly staffelStarts: readonly MeldungStart[];
  /** Auflösung von qualifikationswettkampfnr/-art, `null` wenn nicht gesetzt. */
  readonly qualifikationAus: { readonly nummer: number; readonly art: string } | null;
  readonly line: number;
}

/** Ein Veranstaltungsabschnitt samt Wettkämpfen und Kampfrichterwünschen. */
export interface MeldungAbschnitt {
  readonly nummer: number;
  readonly datum: Datum | null;
  /** Minuten seit Mitternacht, `null` ohne oder bei ungültiger Angabe. */
  readonly anfangszeit: number | null;
  /** `J`, wenn die Zeit relativ zum Ende des Vorabschnitts gilt. */
  readonly relativeAngabe: string;
  readonly wettkaempfe: readonly MeldungWettkampf[];
  /** Dieselben Objekte, die auch unter ihrem Kampfrichter hängen. */
  readonly kampfrichterEinsaetze: readonly MeldungKampfrichterEinsatz[];
  readonly line: number;
}

export interface Vereinsmeldung {
  readonly veranstaltung: MeldungVeranstaltung;
  /** Der eine Verein der Datei; `null`, wenn sie keinen führt. */
  readonly verein: MeldungVerein | null;
  readonly ansprechpartner: MeldungAnsprechpartner | null;
  readonly abschnitte: readonly MeldungAbschnitt[];
  /** Wettkämpfe, deren `abschnittsnr` auf keinen Abschnitt zeigt. */
  readonly wettkaempfeOhneAbschnitt: readonly MeldungWettkampf[];
  readonly meldungen: readonly MeldungPerson[];
  readonly staffelmeldungen: readonly MeldungStaffel[];
  readonly kampfrichter: readonly MeldungKampfrichter[];
  readonly trainer: readonly MeldungTrainer[];
  /** Schlüssel ist `${nummer}:${art}`. */
  readonly wettkampfByKey: ReadonlyMap<string, MeldungWettkampf>;
  readonly abschnittByNummer: ReadonlyMap<number, MeldungAbschnitt>;
  /** Schlüssel ist die `veranstaltungsId` der Person. */
  readonly personById: ReadonlyMap<number, MeldungPerson>;
  /** Schlüssel ist die `veranstaltungsId` der Staffel. */
  readonly staffelById: ReadonlyMap<number, MeldungStaffel>;
  readonly kampfrichterByNummer: ReadonlyMap<number, MeldungKampfrichter>;
  readonly trainerByNummer: ReadonlyMap<number, MeldungTrainer>;
}

export interface MeldungProjectionResult {
  readonly graph: Vereinsmeldung;
  readonly diagnostics: readonly Diagnostic[];
}

const EMPTY_VERANSTALTUNG: MeldungVeranstaltung = {
  bezeichnung: '',
  ort: '',
  bahnlaenge: '',
  zeitmessung: '',
};

/** Feldwert eines Records; fehlende Felder ergeben die leere Zeichenkette. */
function value(record: TypedRecord, name: string): string {
  return record.values[name]?.trim() ?? '';
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

/** Ein Diagnostic auf der Zeile eines Records; Spalten kennt diese Ebene nicht. */
function at(line: number): {
  start: { line: number; column: number };
  end: { line: number; column: number };
} {
  return { start: { line, column: 1 }, end: { line, column: 1 } };
}

/** Die gesetzten Staatsangehörigkeiten eines Records, in ihrer Reihenfolge. */
function nationalitaeten(record: TypedRecord): string[] {
  return [
    value(record, 'nationalitaet1'),
    value(record, 'nationalitaet2'),
    value(record, 'nationalitaet3'),
  ].filter((n) => n !== '');
}

/** Zwischenstand eines Wettkampfes, dessen Kinderlisten noch wachsen. */
interface WettkampfBuilder {
  readonly starts: MeldungStart[];
  readonly staffelStarts: MeldungStart[];
  readonly wettkampf: MeldungWettkampf;
}

/** Zwischenstand einer Personenmeldung, deren Kinderlisten noch wachsen. */
interface PersonBuilder {
  readonly starts: MeldungStart[];
  readonly person: { -readonly [K in keyof MeldungPerson]: MeldungPerson[K] };
}

/** Zwischenstand einer Staffelmeldung, deren Kinderlisten noch wachsen. */
interface StaffelBuilder {
  readonly starts: MeldungStart[];
  readonly personen: MeldungStaffelPerson[];
  readonly staffel: MeldungStaffel;
}

/**
 * Baut aus einer gelesenen Vereinsmeldeliste einen Objektgraph mit aufgelösten
 * Bezügen.
 *
 * Die Projektion bricht nie ab: Zeigt ein Bezug ins Leere oder ist er
 * mehrdeutig, entsteht eine Warnung, und der Graph wird — bei Mehrdeutigkeit
 * gewinnt der erste Treffer — so vollständig wie möglich aufgebaut.
 */
export function projectVereinsmeldeliste(liste: Vereinsmeldeliste): MeldungProjectionResult {
  const diagnostics: Diagnostic[] = [];
  const records = liste.records;

  const veranstaltung = projectVeranstaltung(records);

  // --- Verein und Ansprechpartner ------------------------------------------
  const vereinRecord = records.find((r) => r.element === 'VEREIN');
  const verein: MeldungVerein | null =
    vereinRecord === undefined
      ? null
      : {
          bezeichnung: value(vereinRecord, 'vereinsbezeichnung'),
          kennzahl: number(vereinRecord, 'vereinskennzahl'),
          landesschwimmverband: value(vereinRecord, 'landesschwimmverband'),
          nationenkuerzel: value(vereinRecord, 'nationenkuerzel'),
          lastschrift: value(vereinRecord, 'lastschrift'),
          line: vereinRecord.line,
        };

  const partnerRecord = records.find((r) => r.element === 'ANSPRECHPARTNER');
  const ansprechpartner: MeldungAnsprechpartner | null =
    partnerRecord === undefined
      ? null
      : {
          name: value(partnerRecord, 'name'),
          strasse: value(partnerRecord, 'strasse'),
          plz: value(partnerRecord, 'plz'),
          ort: value(partnerRecord, 'ort'),
          land: value(partnerRecord, 'land'),
          telefon: value(partnerRecord, 'telefon'),
          fax: value(partnerRecord, 'fax'),
          email: value(partnerRecord, 'email'),
          line: partnerRecord.line,
        };

  // --- Abschnitte ----------------------------------------------------------
  const abschnitte: MeldungAbschnitt[] = [];
  const abschnittWettkaempfe = new Map<number, MeldungWettkampf[]>();
  const abschnittEinsaetze = new Map<number, MeldungKampfrichterEinsatz[]>();
  const abschnittByNummer = new Map<number, MeldungAbschnitt>();

  for (const record of records) {
    if (record.element !== 'ABSCHNITT') continue;

    const wettkaempfe: MeldungWettkampf[] = [];
    const kampfrichterEinsaetze: MeldungKampfrichterEinsatz[] = [];
    const nummer = number(record, 'abschnittsnr');
    const abschnitt: MeldungAbschnitt = {
      nummer,
      datum: decodeDatum(value(record, 'abschnittsdatum')),
      anfangszeit: decodeUhrzeit(value(record, 'anfangszeit')),
      relativeAngabe: value(record, 'relativeAngabe'),
      wettkaempfe,
      kampfrichterEinsaetze,
      line: record.line,
    };
    abschnitte.push(abschnitt);

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
      abschnittWettkaempfe.set(nummer, wettkaempfe);
      abschnittEinsaetze.set(nummer, kampfrichterEinsaetze);
    }
  }

  // --- Wettkämpfe ----------------------------------------------------------
  const builders = new Map<string, WettkampfBuilder>();
  const wettkaempfeOhneAbschnitt: MeldungWettkampf[] = [];
  /** Alle Wettkämpfe je Nummer, für die Auflösung der Starts ohne Art. */
  const buildersByNummer = new Map<number, WettkampfBuilder[]>();

  for (const record of records) {
    if (record.element !== 'WETTKAMPF') continue;

    const nummer = number(record, 'wettkampfnr');
    const art = value(record, 'wettkampfart');
    const abschnittsnr = number(record, 'abschnittsnr');

    const qualNummer = number(record, 'qualifikationswettkampfnr');
    const qualArt = value(record, 'qualifikationswettkampfart');
    const qualifikationAus =
      Number.isFinite(qualNummer) || qualArt !== '' ? { nummer: qualNummer, art: qualArt } : null;

    const starts: MeldungStart[] = [];
    const staffelStarts: MeldungStart[] = [];
    const wettkampf: MeldungWettkampf = {
      nummer,
      art,
      abschnittsnr,
      anzahlStarter: value(record, 'anzahlStarter'),
      einzelstrecke: number(record, 'einzelstrecke'),
      technik: value(record, 'technik'),
      ausuebung: value(record, 'ausuebung'),
      geschlecht: value(record, 'geschlecht'),
      starts,
      staffelStarts,
      qualifikationAus,
      line: record.line,
    };

    const builder: WettkampfBuilder = { starts, staffelStarts, wettkampf };
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
      builders.set(key, builder);
      const gleicheNummer = buildersByNummer.get(nummer);
      if (gleicheNummer === undefined) buildersByNummer.set(nummer, [builder]);
      else gleicheNummer.push(builder);
    }

    const ziel = abschnittWettkaempfe.get(abschnittsnr);
    if (ziel === undefined) {
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
      ziel.push(wettkampf);
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

  /**
   * Löst die Wettkampfnummer eines Starts auf — siehe die Regel am Modulkopf.
   * Gibt den Wettkampf zurück, unter dem der Start hängen soll, oder
   * `undefined`, wenn es keinen mit dieser Nummer gibt.
   */
  function findeWettkampf(record: TypedRecord, nummer: number): WettkampfBuilder | undefined {
    const treffer = buildersByNummer.get(nummer) ?? [];
    const erster = treffer[0];

    if (erster === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `${record.element} refers to unknown WETTKAMPF number ${value(record, 'wettkampfnummer')}`,
          { ...at(record.line), data: { element: record.element, wettkampfnr: nummer } },
        ),
      );
      return undefined;
    }

    if (treffer.length > 1) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `${record.element} names WETTKAMPF number ${String(nummer)} without a wettkampfart, and ${String(treffer.length)} competitions share it; the first one wins`,
          {
            ...at(record.line),
            data: {
              element: record.element,
              wettkampfnr: nummer,
              arten: treffer.map((t) => t.wettkampf.art),
            },
          },
        ),
      );
    }

    return erster;
  }

  // --- Trainer -------------------------------------------------------------
  const trainer: MeldungTrainer[] = [];
  const trainerByNummer = new Map<number, MeldungTrainer>();

  for (const record of records) {
    if (record.element !== 'TRAINER') continue;

    const nummer = number(record, 'nummerTrainer');
    const eintrag: MeldungTrainer = {
      nummer,
      name: value(record, 'name'),
      geschlecht: value(record, 'geschlecht'),
      line: record.line,
    };
    trainer.push(eintrag);

    if (trainerByNummer.has(nummer)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate TRAINER number ${String(nummer)}; the first one wins`,
          { ...at(record.line), data: { element: 'TRAINER', nummerTrainer: nummer } },
        ),
      );
    } else if (Number.isFinite(nummer)) {
      trainerByNummer.set(nummer, eintrag);
    }
  }

  // --- Kampfrichter --------------------------------------------------------
  const kampfrichter: MeldungKampfrichter[] = [];
  const kampfrichterByNummer = new Map<number, MeldungKampfrichter>();
  const kampfrichterEinsaetze = new Map<number, MeldungKampfrichterEinsatz[]>();

  for (const record of records) {
    if (record.element !== 'KARIMELDUNG') continue;

    const nummer = number(record, 'nummerKampfrichter');
    const einsaetze: MeldungKampfrichterEinsatz[] = [];
    const eintrag: MeldungKampfrichter = {
      nummer,
      name: value(record, 'name'),
      kampfrichtergruppe: value(record, 'kampfrichtergruppe'),
      geschlecht: value(record, 'geschlecht'),
      einsaetze,
      line: record.line,
    };
    kampfrichter.push(eintrag);

    if (kampfrichterByNummer.has(nummer)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate KARIMELDUNG number ${String(nummer)}; the first one wins`,
          { ...at(record.line), data: { element: 'KARIMELDUNG', nummerKampfrichter: nummer } },
        ),
      );
    } else if (Number.isFinite(nummer)) {
      kampfrichterByNummer.set(nummer, eintrag);
      kampfrichterEinsaetze.set(nummer, einsaetze);
    }
  }

  for (const record of records) {
    if (record.element !== 'KARIABSCHNITT') continue;

    const nummerKampfrichter = number(record, 'nummerKampfrichter');
    const abschnittsnummer = number(record, 'abschnittsnummer');
    const einsatz: MeldungKampfrichterEinsatz = {
      nummerKampfrichter,
      abschnittsnummer,
      einsatzwunsch: value(record, 'einsatzwunsch'),
      line: record.line,
    };

    const beimKampfrichter = kampfrichterEinsaetze.get(nummerKampfrichter);
    if (beimKampfrichter === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `KARIABSCHNITT refers to unknown KARIMELDUNG ${value(record, 'nummerKampfrichter')}`,
          { ...at(record.line), data: { element: 'KARIABSCHNITT', nummerKampfrichter } },
        ),
      );
    } else {
      beimKampfrichter.push(einsatz);
    }

    const imAbschnitt = abschnittEinsaetze.get(abschnittsnummer);
    if (imAbschnitt === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `KARIABSCHNITT refers to unknown ABSCHNITT ${value(record, 'abschnittsnummer')}`,
          { ...at(record.line), data: { element: 'KARIABSCHNITT', abschnittsnummer } },
        ),
      );
    } else {
      imAbschnitt.push(einsatz);
    }
  }

  // --- Personenmeldungen ---------------------------------------------------
  const meldungen: MeldungPerson[] = [];
  const personById = new Map<number, MeldungPerson>();
  const personBuilders = new Map<number, PersonBuilder>();

  for (const record of records) {
    if (record.element !== 'PNMELDUNG') continue;

    const veranstaltungsId = number(record, 'veranstaltungsId');
    const nummerTrainer = number(record, 'nummerTrainer');
    let zugeordneterTrainer: MeldungTrainer | null = null;

    if (Number.isFinite(nummerTrainer)) {
      zugeordneterTrainer = trainerByNummer.get(nummerTrainer) ?? null;
      if (zugeordneterTrainer === null) {
        diagnostics.push(
          createDiagnostic(
            'dangling-reference',
            'warning',
            `PNMELDUNG refers to unknown TRAINER ${value(record, 'nummerTrainer')}`,
            { ...at(record.line), data: { element: 'PNMELDUNG', nummerTrainer } },
          ),
        );
      }
    }

    const starts: MeldungStart[] = [];
    const person = {
      veranstaltungsId,
      name: value(record, 'name'),
      dsvId: value(record, 'dsvId'),
      geschlecht: value(record, 'geschlecht'),
      jahrgang: value(record, 'jahrgang'),
      altersklasse: value(record, 'altersklasse'),
      trainer: zugeordneterTrainer,
      nationalitaeten: nationalitaeten(record),
      handicap: null as MeldungHandicap | null,
      starts,
      line: record.line,
    };
    meldungen.push(person);

    if (personById.has(veranstaltungsId)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate PNMELDUNG id ${String(veranstaltungsId)}; the first one wins`,
          { ...at(record.line), data: { element: 'PNMELDUNG', veranstaltungsId } },
        ),
      );
    } else if (Number.isFinite(veranstaltungsId)) {
      personById.set(veranstaltungsId, person);
      personBuilders.set(veranstaltungsId, { starts, person });
    }
  }

  for (const record of records) {
    if (record.element !== 'HANDICAP') continue;

    const veranstaltungsId = number(record, 'veranstaltungsId');
    const builder = personBuilders.get(veranstaltungsId);

    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `HANDICAP refers to unknown PNMELDUNG ${value(record, 'veranstaltungsId')}`,
          { ...at(record.line), data: { element: 'HANDICAP', veranstaltungsId } },
        ),
      );
      continue;
    }

    if (builder.person.handicap !== null) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate HANDICAP for PNMELDUNG ${String(veranstaltungsId)}; the first one wins`,
          { ...at(record.line), data: { element: 'HANDICAP', veranstaltungsId } },
        ),
      );
      continue;
    }

    builder.person.handicap = {
      dbsId: value(record, 'dbsId'),
      ipcId: value(record, 'ipcId'),
      startklasse: value(record, 'startklasse'),
      startklasseBrust: value(record, 'startklasseBrust'),
      startklasseLagen: value(record, 'startklasseLagen'),
      exceptions: value(record, 'exceptions'),
      line: record.line,
    };
  }

  for (const record of records) {
    if (record.element !== 'STARTPN') continue;

    const veranstaltungsId = number(record, 'veranstaltungsId');
    const nummer = number(record, 'wettkampfnummer');
    const wettkampf = findeWettkampf(record, nummer);
    const start: MeldungStart = {
      wettkampfnr: nummer,
      wettkampfart: wettkampf?.wettkampf.art ?? '',
      meldezeit: decodeZeit(value(record, 'meldezeit')),
      line: record.line,
    };

    const builder = personBuilders.get(veranstaltungsId);
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STARTPN refers to unknown PNMELDUNG ${value(record, 'veranstaltungsId')}`,
          { ...at(record.line), data: { element: 'STARTPN', veranstaltungsId } },
        ),
      );
    } else {
      builder.starts.push(start);
    }

    wettkampf?.starts.push(start);
  }

  // --- Staffelmeldungen ----------------------------------------------------
  const staffelmeldungen: MeldungStaffel[] = [];
  const staffelById = new Map<number, MeldungStaffel>();
  const staffelBuilders = new Map<number, StaffelBuilder>();

  for (const record of records) {
    if (record.element !== 'STMELDUNG') continue;

    const veranstaltungsId = number(record, 'veranstaltungsIdStaffel');
    const starts: MeldungStart[] = [];
    const personen: MeldungStaffelPerson[] = [];
    const staffel: MeldungStaffel = {
      veranstaltungsId,
      nummerDerMannschaft: value(record, 'nummerDerMannschaft'),
      wertungsklasseTyp: value(record, 'wertungsklasseTyp'),
      mindestJgAk: value(record, 'mindestJgAk'),
      maximalJgAk: value(record, 'maximalJgAk'),
      name: value(record, 'nameDerStaffel'),
      starts,
      personen,
      line: record.line,
    };
    staffelmeldungen.push(staffel);

    if (staffelById.has(veranstaltungsId)) {
      diagnostics.push(
        createDiagnostic(
          'ambiguous-reference',
          'warning',
          `Duplicate STMELDUNG id ${String(veranstaltungsId)}; the first one wins`,
          {
            ...at(record.line),
            data: { element: 'STMELDUNG', veranstaltungsIdStaffel: veranstaltungsId },
          },
        ),
      );
    } else if (Number.isFinite(veranstaltungsId)) {
      staffelById.set(veranstaltungsId, staffel);
      staffelBuilders.set(veranstaltungsId, { starts, personen, staffel });
    }
  }

  for (const record of records) {
    if (record.element !== 'STARTST') continue;

    const veranstaltungsId = number(record, 'veranstaltungsIdStaffel');
    const nummer = number(record, 'wettkampfnummer');
    const wettkampf = findeWettkampf(record, nummer);
    const start: MeldungStart = {
      wettkampfnr: nummer,
      wettkampfart: wettkampf?.wettkampf.art ?? '',
      meldezeit: decodeZeit(value(record, 'meldezeit')),
      line: record.line,
    };

    const builder = staffelBuilders.get(veranstaltungsId);
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STARTST refers to unknown STMELDUNG ${value(record, 'veranstaltungsIdStaffel')}`,
          {
            ...at(record.line),
            data: { element: 'STARTST', veranstaltungsIdStaffel: veranstaltungsId },
          },
        ),
      );
    } else {
      builder.starts.push(start);
    }

    wettkampf?.staffelStarts.push(start);
  }

  for (const record of records) {
    if (record.element !== 'STAFFELPERSON') continue;

    const veranstaltungsIdStaffel = number(record, 'veranstaltungsIdStaffel');
    const veranstaltungsId = number(record, 'veranstaltungsId');
    const eintrag: MeldungStaffelPerson = {
      veranstaltungsId,
      wettkampfnr: number(record, 'wettkampfnummer'),
      startnummer: number(record, 'startnummer'),
      line: record.line,
    };

    // Die Staffelperson hängt an zwei Bezügen: an ihrer Staffel und an ihrer
    // Personenmeldung. Fehlt einer, wird er einzeln gemeldet — der andere
    // bleibt davon unberührt.
    const builder = staffelBuilders.get(veranstaltungsIdStaffel);
    if (builder === undefined) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STAFFELPERSON refers to unknown STMELDUNG ${value(record, 'veranstaltungsIdStaffel')}`,
          {
            ...at(record.line),
            data: { element: 'STAFFELPERSON', veranstaltungsIdStaffel },
          },
        ),
      );
    } else {
      builder.personen.push(eintrag);
    }

    if (!personBuilders.has(veranstaltungsId)) {
      diagnostics.push(
        createDiagnostic(
          'dangling-reference',
          'warning',
          `STAFFELPERSON refers to unknown PNMELDUNG ${value(record, 'veranstaltungsId')}`,
          { ...at(record.line), data: { element: 'STAFFELPERSON', veranstaltungsId } },
        ),
      );
    }
  }

  const wettkampfByKey = new Map<string, MeldungWettkampf>();
  for (const [key, builder] of builders) wettkampfByKey.set(key, builder.wettkampf);

  return {
    graph: {
      veranstaltung,
      verein,
      ansprechpartner,
      abschnitte,
      wettkaempfeOhneAbschnitt,
      meldungen,
      staffelmeldungen,
      kampfrichter,
      trainer,
      wettkampfByKey,
      abschnittByNummer,
      personById,
      staffelById,
      kampfrichterByNummer,
      trainerByNummer,
    },
    diagnostics,
  };
}

/** Die Eckdaten der Veranstaltung; ohne VERANSTALTUNG-Record leere Werte. */
function projectVeranstaltung(records: readonly TypedRecord[]): MeldungVeranstaltung {
  const record = records.find((r) => r.element === 'VERANSTALTUNG');
  if (record === undefined) return EMPTY_VERANSTALTUNG;

  return {
    bezeichnung: value(record, 'veranstaltungsbezeichnung'),
    ort: value(record, 'veranstaltungsort'),
    bahnlaenge: value(record, 'bahnlaenge'),
    zeitmessung: value(record, 'zeitmessung'),
  };
}
