// deal-d1, each card: pairs whose six-card hand holds it against pairs whose hand does not (White score, draws). `npx tsx tools/deal-cards.ts`
import { readFileSync, readdirSync } from 'node:fs';
import { handFor } from '../src/sim/tournament.ts';
const dir = 'sim/out';
const spec = JSON.parse(readFileSync(`${dir}/deal-d1.tournament.json`, 'utf8'));
const t = spec.spec ?? spec;
const recs = readdirSync(dir).filter(f => /^deal-d1\.shard\d+of25\.jsonl$/.test(f))
  .flatMap(f => readFileSync(`${dir}/${f}`, 'utf8').trim().split('\n').map(l => JSON.parse(l)));
const by = new Map<string, any>();
for (const r of recs) { const k = `${r.backRank}|${r.seed}`; const p = by.get(k) ?? {}; p[r.white] = r; by.set(k, p); }
const rows: { hand: string[]; dw: number; dd: number; w: number; d: number; plies: number }[] = [];
for (const p of by.values()) {
  const c = p.cards6, n = p.none; if (!c || !n) continue;
  rows.push({ hand: handFor(t, 'cards6', c.seed), dw: c.result - n.result, dd: (c.result === 0.5 ? 1 : 0) - (n.result === 0.5 ? 1 : 0), w: c.result, d: c.result === 0.5 ? 1 : 0, plies: c.plies });
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const varr = (xs: number[]) => { const m = mean(xs); return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1); };
const diff = (a: number[], b: number[]) => [mean(a) - mean(b), 1.96 * Math.sqrt(varr(a) / a.length + varr(b) / b.length)];
const cards = [...new Set(rows.flatMap(r => r.hand))].sort();
console.log(`pairs ${rows.length}; check a hand: ${rows[0].hand.join(',')}`);
console.log('| card | hands | White % with | Δ White (with − without) | ±95% | draws % with | Δ draws | ±95% |');
console.log('|---|---|---|---|---|---|---|---|');
const out = cards.map(card => {
  const yes = rows.filter(r => r.hand.includes(card)), no = rows.filter(r => !r.hand.includes(card));
  const [w, ww] = diff(yes.map(r => r.w), no.map(r => r.w)), [d, dw] = diff(yes.map(r => r.d), no.map(r => r.d));
  return { card, n: yes.length, wy: mean(yes.map(r => r.w)), w, ww, dy: mean(yes.map(r => r.d)), d, dw };
}).sort((a, b) => b.w - a.w);
const f = (x: number) => `${x >= 0 ? '+' : ''}${(100 * x).toFixed(1)}`;
for (const o of out) console.log(`| ${o.card} | ${o.n} | ${(100 * o.wy).toFixed(1)} | ${f(o.w)} | ${(100 * o.ww).toFixed(1)} | ${(100 * o.dy).toFixed(1)} | ${f(o.d)} | ${(100 * o.dw).toFixed(1)} |`);
