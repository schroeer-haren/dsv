import { readFileSync } from 'node:fs';
import { parseWettkampfergebnisliste } from './src/parse/parse-wettkampfergebnisliste.js';
const f='test/fixtures/real/b-potsdam-2025-lm-protokoll.dsv7';
const doc = parseWettkampfergebnisliste(readFileSync(f,'utf8')).document;
const seen = new Map<string, any[]>(); let n=0;
for (const r of doc.records as any[]) {
  if (r.element!=='PNERGEBNIS' && r.element!=='STERGEBNIS') continue;
  const idf = r.element==='PNERGEBNIS'?'veranstaltungsId':'veranstaltungsIdStaffel';
  const k=`${r.element}|${r.values[idf]};${r.values['wettkampfnr']};${r.values['wettkampfart']}|${r.values['wertungsId']}`;
  const a=seen.get(k)??[]; a.push(r); seen.set(k,a);
}
for (const [k,a] of seen) if (a.length>1 && n++<4) { console.log('KEY',k); for(const r of a) console.log('  L'+r.line, JSON.stringify(r.values)); }
