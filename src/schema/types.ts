/** Skalare Datentypen des DSV-Standards (dsv8.md:249–300). */
export type ScalarType =
  'ZK' | 'Zahl' | 'Zeichen' | 'Zeit' | 'Datum' | 'Uhrzeit' | 'Betrag' | 'JGAK';

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
}

export function field(name: string, type: ScalarType, options: FieldOptions): FieldDef {
  return {
    name,
    type,
    required: options.required ?? false,
    ...(options.since === undefined ? {} : { since: options.since }),
    doc: options.doc,
    specRef: options.specRef,
  };
}

export function element(
  name: string,
  fields: readonly FieldDef[],
  options: { bare?: boolean } = {},
): ElementDef {
  return { name, bare: options.bare ?? false, fields };
}
