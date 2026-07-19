import { readFileSync, readdirSync } from 'node:fs';
import { parseWettkampfergebnisliste } from './src/parse/parse-wettkampfergebnisliste.js';
import { parseVereinsergebnisliste } from './src/parse/parse-vereinsergebnisliste.js';

const specs = [
  { el: 'PNERGEBNIS', key: ['veranstaltungsId', 'wettkampfnr', 'wettkampfart'] },
  { el: 'STERGEBNIS', key: ['veranstaltungsId', 'wettkampfnr', 'wettkampfart'] },
  { el: 'PERSONENERGEBNIS', key: ['veranstaltungsId', 'wettkampfnr', 'wettkampfart'] },
  { el: 'STAFFELERGEBNIS', key: ['veranstaltungsIdStaffel', 'wettkampfnr', 'wettkampfart'] },
];
let total = 0, dup = 0; const hits = new Set<string>();
for (const dir of ['test/fixtures/real', 'spec/samples']) {
  let files: string[] = [];
  try { files = readdirSync(dir); } catch { continue; }
  for (const f of files) {
    let text: string;
    try { text = readFileSync(`${dir}/${f}`, 'utf8'); } catch { continue; }
    const head = /FORMAT:\s*(\w+)/i.exec(text)?.[1]?.toLowerCase();
    let doc;
    try {
      if (head === 'wettkampfergebnisliste') doc = parseWettkampfergebnisliste(text).document;
      else if (head === 'vereinsergebnisliste') doc = parseVereinsergebnisliste(text).document;
      else continue;
    } catch { continue; }
    const seen = new Map<string, Set<string>>();
    for (const r of doc.records as any[]) {
      const s = specs.find((x) => x.el === r.element);
      if (!s) continue;
      const k = `${r.element}|${s.key.map((n) => r.values[n] ?? '').join(';')}`;
      const w = r.values['wertungsId'] ?? '';
      total++;
      const set = seen.get(k) ?? new Set();
      if (set.has(w)) { dup++; hits.add(`${dir}/${f}`); }
      set.add(w); seen.set(k, set);
    }
  }
}
console.log(`total=${total} dup=${dup}`); console.log([...hits].slice(0,10));
