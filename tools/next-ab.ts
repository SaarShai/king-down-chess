#!/usr/bin/env -S npx tsx
/**
 * Which pending lever gets the next paired A/B? Deterministic rank first: unmeasured levers need a
 * 200-game pilot; then |point| / half-width (signal per interval), depth-4-unconfirmed before
 * confirmed. `--jev` adds a model Choice beside it, labelled opinion: it routes compute, it is not
 * evidence, and the owner still launches by name (docs/QUEUE.md).
 *
 *   tsx tools/next-ab.ts [levers.json] [--jev]      (default docs/research/pending-levers.json)
 */
import { readFileSync } from 'node:fs';
import { MODEL, ask, choice, conf, prob } from './jev';

type Lever = { id: string; lever: string; point: number | null; half: number | null; metric: string; depth4_confirmed: boolean; note: string };
const file = process.argv.slice(2).find(a => !a.startsWith('--')) ?? 'docs/research/pending-levers.json';
const L: Lever[] = JSON.parse(readFileSync(file, 'utf8'));
const key = (l: Lever) => l.point === null || l.half === null ? Infinity : Math.abs(l.point) / l.half;
const ranked = [...L].sort((a, b) => (key(b) - key(a)) || Number(a.depth4_confirmed) - Number(b.depth4_confirmed));
console.log('rank | lever | signal/interval | depth4 | note');
for (const [i, l] of ranked.entries()) console.log(`${i + 1} | ${l.id} | ${key(l) === Infinity ? 'unmeasured → pilot' : key(l).toFixed(2)} | ${l.depth4_confirmed ? 'confirmed' : 'open'} | ${l.note}`);

if (process.argv.includes('--jev')) {
  const opts = Object.fromEntries(L.map(l => [l.id, `${l.lever}: ${l.point === null ? 'unmeasured' : `${l.point} ± ${l.half} ${l.metric}`}; depth-4 ${l.depth4_confirmed ? 'confirmed' : 'open'}; ${l.note}`]));
  const a = await ask({ task: 'King Down chess balance lab: pick the single pending lever most worth the next 1,600-game paired A/B, judging only from the measured effects, their uncertainty and whether depth 4 is still open. Machine time is the constraint.', levers: opts },
    { next: { type: 'choice', instructions: 'Which lever most deserves the next paired A/B?', criteria: { ...opts, none: 'No lever stands out' } } });
  const ps = Object.keys(opts).concat('none').map(k => `${k} ${prob(a.next, k).toFixed(2)}`).join(', ');
  console.log(`\nJev opinion (model ${MODEL}, no controls, not evidence): ${choice(a.next)} at confidence ${conf(a.next).toFixed(2)} — p = ${ps}`);
}
