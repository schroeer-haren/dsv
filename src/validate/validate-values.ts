import { createDiagnostic } from '../diagnostics/create.js';
import type { Diagnostic } from '../diagnostics/types.js';
import type { DsvRecord } from '../document/types.js';
import type { ElementDef, EnumValue, FieldDef, ScalarType } from '../schema/types.js';
import { decodeDatum } from '../values/datum.js';
import { decodeUhrzeit } from '../values/uhrzeit.js';
import { decodeZeit } from '../values/zeit.js';
import type { FormatVersion } from './format-version.js';
import { fieldsForVersion, isBlank } from './validate-fields.js';

const ZAHL = /^\d+$/;

/**
 * Obergrenze des Typs `Zahl`: „Numerischer Wert ohne Vorzeichen und
 * Dezimalzeichen (positiver Integer, 32 Bit)" (dsv8.md:265 = dsv7.md:231).
 *
 * „Ohne Vorzeichen" ist wörtlich genommen, die Grenze also 2³²−1 und nicht
 * 2³¹−1. Die Spezifikation lässt offen, welche der beiden sie meint; die
 * engere zu wählen hiesse, eine Beschränkung zu erfinden, die dort nicht
 * steht. Praktisch macht es keinen Unterschied: Der grösste Zahlenwert in den
 * 142 gesammelten echten Dateien ist 44.150.000, keine überschreitet auch nur
 * die engere Grenze.
 *
 * Führende Nullen bleiben zulässig — 5738 Felder echter Dateien haben sie
 * (`01067`, `0000`, `09`). Geprüft wird der Zahlenwert, nicht die Schreibweise.
 */
const ZAHL_MAX = 4_294_967_295;
/** Betrag mit genau zwei Nachkommastellen, z. B. `10,00` (dsv8.md:283). */
const BETRAG = /^\d+,\d{2}$/;
/**
 * Jahrgang, Altersklassenbuchstabe oder Masters-Angabe mit Pluszeichen
 * (dsv8.md:287-296).
 *
 * Die Spezifikation nennt „vierstellige Zahl, wenn Jahrgang", die Buchstaben
 * `A,B,C,D,E,J`, für Masters-Einzelwettkämpfe „20,25,30,40 usw." und für
 * Masters-Staffeln „80+,100+,120+ usw.". `\d{1,4}` ist damit weiter als der
 * Wortlaut. Das ist geprüft und Absicht:
 *
 * - **Einstellig** kommt real vor: 2084 Felder der 142 gesammelten Dateien,
 *   ausnahmslos `0`. Es bezeichnet die fehlende untere Schranke einer offenen
 *   Wertung (`WERTUNG:…;JG;0;9999;`). Eine Verengung auf zwei Stellen würde
 *   diese Dateien beschädigen — die Toleranz ist gegen die Realität richtig.
 * - **Dreistellig** kommt real nicht vor, bleibt aber zulässig: Die
 *   Masters-Einzelklassen sind mit „usw." offen aufgezählt, und
 *   Masters-Schwimmen kennt Altersklassen jenseits von 99. Das auszuschliessen
 *   hiesse eine Grenze zu erfinden, die die Spezifikation nicht zieht.
 *
 * Zurückgewiesen wird weiterhin, was unter keiner Lesart passt: `X`, `12345`,
 * einstelliges Plus (`8+`) und fünfstelliges Plus.
 */
const JGAK = /^(?:\d{1,4}|[ABCDEJ]|\d{2,3}\+)$/;

/** Prüft einen Wert gegen seinen skalaren Datentyp. */
function matchesType(value: string, type: ScalarType): boolean {
  switch (type) {
    case 'ZK':
      return true;
    case 'Zeichen':
      return [...value].length === 1;
    case 'Zahl':
      return ZAHL.test(value) && Number(value) <= ZAHL_MAX;
    case 'Datum':
      return decodeDatum(value) !== null;
    case 'Uhrzeit':
      return decodeUhrzeit(value) !== null;
    case 'Zeit':
      return decodeZeit(value) !== null;
    case 'Betrag':
      return BETRAG.test(value);
    case 'JGAK':
      return JGAK.test(value);
  }
}

/**
 * Sucht den passenden Aufzählungswert. Liefert `undefined`, wenn der Wert in
 * dieser Formatversion nicht zulässig ist.
 */
function findEnumValue(
  value: string,
  def: FieldDef,
  version: FormatVersion,
): EnumValue | undefined {
  return def.values?.find((v) => {
    if (v.since !== undefined && v.since > version) return false;
    return def.caseInsensitive ? v.value.toLowerCase() === value.toLowerCase() : v.value === value;
  });
}

function invalidValue(
  code: 'invalid-value' | 'invalid-enum-value',
  message: string,
  def: FieldDef,
  value: string,
  at: { line: number },
): Diagnostic {
  return createDiagnostic(code, 'error', message, {
    ...at,
    data: { field: def.name, value },
  });
}

/**
 * Prüft Werttypen, Zahlenbereiche und Aufzählungswerte eines Records.
 *
 * Leere Werte werden übersprungen: Ob ein Pflichtfeld gesetzt sein muss, hat
 * bereits `validateFields` entschieden.
 */
export function validateValues(
  record: DsvRecord,
  def: ElementDef,
  version: FormatVersion,
): Diagnostic[] {
  const at = {
    line: record.line,
  };

  const diagnostics: Diagnostic[] = [];

  for (const [index, fieldDef] of fieldsForVersion(def, version).entries()) {
    const value = record.fields[index];
    if (value === undefined || isBlank(value)) continue;

    if (!matchesType(value, fieldDef.type)) {
      diagnostics.push(
        invalidValue(
          'invalid-value',
          `${def.name}.${fieldDef.name}: "${value}" is not a valid ${fieldDef.type}`,
          fieldDef,
          value,
          at,
        ),
      );
      continue;
    }

    const range = fieldDef.range;
    if (range !== undefined) {
      const numeric = Number(value);
      if (numeric < range.min || numeric > range.max) {
        diagnostics.push(
          invalidValue(
            'invalid-value',
            `${def.name}.${fieldDef.name}: ${value} is outside ${String(range.min)}..${String(range.max)}`,
            fieldDef,
            value,
            at,
          ),
        );
        continue;
      }
    }

    if (fieldDef.values !== undefined) {
      const match = findEnumValue(value, fieldDef, version);

      if (match === undefined) {
        diagnostics.push(
          invalidValue(
            'invalid-enum-value',
            `${def.name}.${fieldDef.name}: "${value}" is not an allowed value in DSV${String(version)}`,
            fieldDef,
            value,
            at,
          ),
        );
      } else if (match.specGap === true) {
        // Lücke der Spezifikation, kein Verbot: Der Wert wird gelesen und
        // geschrieben, die Toleranz bleibt aber sichtbar.
        diagnostics.push(
          createDiagnostic(
            'invalid-enum-value',
            'info',
            `${def.name}.${fieldDef.name}: "${value}" is missing from the specification's list, accepted as a gap`,
            { ...at, data: { field: fieldDef.name, value, specGap: true } },
          ),
        );
      } else if (fieldDef.caseInsensitive && match.value !== value) {
        // Der Wert steht in der Werteliste, nur anders geschrieben.
        //
        // `caseInsensitive` allein wuerde die Abweichung stillschweigend
        // legalisieren: kein Befund beim Lesen, und weil der Writer nur bei
        // `tolerated` sperrt, duerfte er die fremde Schreibweise auch selbst
        // erzeugen. Das Haus verfaehrt sonst anders — was real vorkommt, wird
        // beim Lesen geduldet und beim Schreiben verweigert. Genau das gilt
        // hier: gemeldet als Warnung, beim Schreiben unzulaessig.
        diagnostics.push(
          createDiagnostic(
            'invalid-enum-value',
            'warning',
            `${def.name}.${fieldDef.name}: "${value}" differs from the specified spelling "${match.value}"`,
            { ...at, data: { field: fieldDef.name, value, expected: match.value, tolerated: true } },
          ),
        );
      } else if (match.tolerated === true) {
        // Im Format bekannt, für diese Listenart aber nicht vorgesehen. Als
        // Fehler gemeldet wiese die Bibliothek Dateien zurück, die der DSV
        // selbst ausliefert.
        diagnostics.push(
          createDiagnostic(
            'invalid-enum-value',
            'warning',
            `${def.name}.${fieldDef.name}: "${value}" is not specified for this list type`,
            { ...at, data: { field: fieldDef.name, value, tolerated: true } },
          ),
        );
      }
    }
  }

  return diagnostics;
}
