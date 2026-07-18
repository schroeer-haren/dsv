export type LineEnding = '\r\n' | '\n' | '';

export interface SourceLine {
  /** Zeileninhalt ohne Zeilenende. */
  readonly content: string;
  /** Das tatsächliche Zeilenende; `''` bei fehlendem Abschluss der letzten Zeile. */
  readonly eol: LineEnding;
  /** 1-basiert. */
  readonly number: number;
}

export interface SourceText {
  /** Eingabe ohne BOM. */
  readonly text: string;
  readonly hasBom: boolean;
  readonly lines: readonly SourceLine[];
}

const BOM = '\uFEFF';

export function createSourceText(input: string): SourceText {
  const hasBom = input.startsWith(BOM);
  const text = hasBom ? input.slice(BOM.length) : input;

  const lines: SourceLine[] = [];
  let index = 0;
  let number = 1;

  while (index < text.length) {
    const next = text.indexOf('\n', index);

    if (next === -1) {
      lines.push({ content: text.slice(index), eol: '', number });
      break;
    }

    const hasCr = next > index && text[next - 1] === '\r';
    lines.push({
      content: text.slice(index, hasCr ? next - 1 : next),
      eol: hasCr ? '\r\n' : '\n',
      number,
    });

    index = next + 1;
    number++;
  }

  return { text, hasBom, lines };
}
