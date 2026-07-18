/** Skalare Datentypen des DSV-Standards (dsv8.md:249–300). */
export type ScalarType =
  'ZK' | 'Zahl' | 'Zeichen' | 'Zeit' | 'Datum' | 'Uhrzeit' | 'Betrag' | 'JGAK';

/** Ein einzelner erlaubter Wert eines Feldes mit fester Werteliste. */
export interface EnumValue {
  readonly value: string;
  /** Bedeutung des Wertes, wird als JSDoc übernommen. */
  readonly doc: string;
  /** Gesetzt, wenn der Wert erst ab dieser Formatversion erlaubt ist. */
  readonly since?: 8;
}

export interface FieldDef {
  readonly name: string;
  readonly type: ScalarType;
  readonly required: boolean;
  /** Gesetzt, wenn das Feld erst ab dieser Formatversion existiert. */
  readonly since?: 8;
  /** Wird als JSDoc in die generierten Typen übernommen. */
  readonly doc: string;
  /** Fundstelle in der Spezifikation, z. B. `dsv8.md:904`. */
  readonly specRef: string;
  /** Erlaubte Werte, falls das Feld eine feste Werteliste hat. */
  readonly values?: readonly EnumValue[];
  /** Unterlassungswert, der gilt, wenn das Feld nicht angegeben ist. */
  readonly default?: string;
  /** `true`, wenn die Werteliste ohne Rücksicht auf Gross-/Kleinschreibung geprüft wird. */
  readonly caseInsensitive: boolean;
}

export interface ElementDef {
  readonly name: string;
  /** Element ohne Doppelpunkt und ohne Attribute — nur `DATEIENDE`. */
  readonly bare: boolean;
  readonly fields: readonly FieldDef[];
}

interface FieldOptions {
  readonly required?: boolean;
  readonly since?: 8;
  readonly doc: string;
  readonly specRef: string;
  readonly values?: readonly EnumValue[];
  readonly default?: string;
  readonly caseInsensitive?: boolean;
}

export function field(name: string, type: ScalarType, options: FieldOptions): FieldDef {
  return {
    name,
    type,
    required: options.required ?? false,
    ...(options.since === undefined ? {} : { since: options.since }),
    doc: options.doc,
    specRef: options.specRef,
    ...(options.values === undefined ? {} : { values: options.values }),
    ...(options.default === undefined ? {} : { default: options.default }),
    caseInsensitive: options.caseInsensitive ?? false,
  };
}

export function element(
  name: string,
  fields: readonly FieldDef[],
  options: { bare?: boolean } = {},
): ElementDef {
  return { name, bare: options.bare ?? false, fields };
}
