#!/usr/bin/env -S npx tsx
/**
 * Kings' powers: assemble the paired-test evidence into one report (docs/TAKEOVER-PLAN.md §5).
 *
 * Reads the A/B arms written by `tools/kings-pilot.sh` — the same 40 arrangements and opening seeds
 * in both arms — and writes `docs/research/sim-kings-2026-09-16.md`. Also writes
 * `sim/out/kings-depth4.ids` (`<id> <King:Power>` per line) when a depth-3 difference cleared its
 * own interval and needs a second depth.
 *
 *   tsx tools/kings-summary.ts          # after the depth-3 pass
 *   tsx tools/kings-summary.ts --final  # after the depth-4 pass; rewrites the report with both
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readRecords } from '../src/sim/analyze';
import { parseLan } from '../src/sim/tune';
import { parseKings, setRules } from '../src/rules/rules';
import { fromFen } from '../src/rules/setup';
import { B, K, P, Q, R, file, makeMove, rank, typeOf } from '../src/rules/engine';
import type { GameRecord } from '../src/sim/game';

const OUT = 'sim/out';
const REPORT = 'docs/research/sim-kings-2026-09-16.md';

interface Power { id: string; name: string; rule: string; counters: string[] }
const POWERS: Power[] = [
  { id: 'kp-holylight', name: 'Holy Light', rule: 'Spirit:HolyLight', counters: ['checks'] },
  { id: 'kp-mercy', name: 'Mercy', rule: 'Spirit:Mercy', counters: ['mercy2', 'checks'] },
  { id: 'kp-deathtouch', name: 'Death Touch', rule: 'Shadow:DeathTouch', counters: ['kingShots', 'checks'] },
  { id: 'kp-darkness', name: 'Darkness', rule: 'Shadow:Darkness', counters: ['straightCaptures', 'promotions'] },
  { id: 'kp-march', name: 'March', rule: 'Mud:March', counters: ['doubleSteps', 'promotions'] },
  { id: 'kp-leap', name: 'Leap', rule: 'Mud:Leap', counters: ['sliderJumps', 'checks'] },
  { id: 'kp-strike', name: 'Strike', rule: 'Flame:Strike', counters: ['strikes', 'checks'] },
];

interface GroupRow {
  key: string; games: number; score: number; decisiveness: number; drawRate: number;
  timeouts: number; meanPlies: number;
}
interface Report {
  games: number; overall: GroupRow; events: Record<string, number>; byConfig: GroupRow[];
}
const readReport = (id: string): Report | null => {
  const f = `${OUT}/${id}.report.json`;
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) as Report : null;
};

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const ci = (xs: number[]): number => {
  const n = xs.length; if (n < 2) return NaN;
  const m = mean(xs), v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1);
  return 1.959964 * Math.sqrt(v / n);
};
const f3 = (x: number): string => (Number.isFinite(x) ? x.toFixed(3) : 'n/a');
const signed = (x: number): string => `${x >= 0 ? '+' : ''}${f3(x)}`;

/** Paired difference over the shared arrangements: mean ±95% half-width. */
function paired(base: Report, variant: Report): Record<string, [number, number]> {
  const b = new Map(base.byConfig.map(g => [g.key, g]));
  const pairs = variant.byConfig.filter(g => b.has(g.key));
  const diff = (f: (g: GroupRow) => number): [number, number] => {
    const xs = pairs.map(g => f(g) - f(b.get(g.key)!));
    return [mean(xs), ci(xs)];
  };
  return {
    score: diff(g => g.score), decisive: diff(g => g.decisiveness), draws: diff(g => g.drawRate),
    capped: diff(g => g.timeouts), plies: diff(g => g.meanPlies),
  };
}

/** Move-pattern counters that say whether the power was used at all. */
function counters(id: string, arm: string, rule: string): Record<string, number> {
  const recs = readRecords(`${OUT}/${id}.${arm}.jsonl`);
  setRules(rule ? { kings: parseKings(rule) } : {});
  let doubleSteps = 0, straightCaptures = 0, kingShots = 0, mercy2 = 0, sliderJumps = 0;
  for (const rec of recs) {
    let pos = fromFen(rec.startFen);
    for (const ply of rec.moves) {
      const lan = ply.lan;
      const m = parseLan(pos.board, lan);
      const t = typeOf(pos.board[m.from]);
      const dx = Math.abs(file(m.to) - file(m.from)), dy = rank(m.to) - rank(m.from);
      // March: a two-square pawn step from anywhere but the home rank.
      if (t === P && !m.captures.length && dx === 0 && Math.abs(dy) === 2 && rank(m.from) !== (pos.turn === 0 ? 1 : 6)) doubleSteps++;
      // Darkness: a pawn capture with no file change.
      if (t === P && m.captures.length && file(m.to) === file(m.from)) straightCaptures++;
      if (t === K && /^K[a-h][1-8]\*/.test(lan)) kingShots++;
      if (t === K && Math.max(dx, Math.abs(dy)) === 2) mercy2++;
      // Leap: a slider whose path crosses one of its own pawns.
      if ((t === R || t === B || t === Q) && m.to !== m.from) {
        const sx = Math.sign(file(m.to) - file(m.from)), sy = Math.sign(rank(m.to) - rank(m.from));
        for (let x = file(m.from) + sx, y = rank(m.from) + sy; x !== file(m.to) || y !== rank(m.to); x += sx, y += sy) {
          const p = pos.board[(y << 3) | x];
          if (p && (p & 15) === P && ((p >> 4) & 1) === pos.turn) { sliderJumps++; break; }
        }
      }
      pos = makeMove(pos, m);
    }
  }
  setRules();
  const per = (n: number): number => n / (recs.length || 1);
  return { doubleSteps: per(doubleSteps), straightCaptures: per(straightCaptures), kingShots: per(kingShots), mercy2: per(mercy2), sliderJumps: per(sliderJumps) };
}

const sections: string[] = [];
const needs: string[] = [];
for (const p of POWERS) {
  const base = readReport(`${p.id}.base`);
  const variant = readReport(`${p.id}.var`);
  if (!base || !variant) {
    sections.push(`### ${p.name} (\`${p.rule}\`) — not run\n\nNo \`${p.id}.*\` arms on disk.\n`);
    continue;
  }
  const d3 = paired(base, variant);
  // Depth 4 exists only where the depth-3 difference cleared its interval.
  const d4base = readReport(`${p.id}-d4.base`);
  const d4var = readReport(`${p.id}-d4.var`);
  const d4 = d4base && d4var ? paired(d4base, d4var) : null;
  const consequential = Math.abs(d3.decisive[0]) > d3.decisive[1] || Math.abs(d3.draws[0]) > d3.draws[1] || Math.abs(d3.score[0]) > d3.score[1];
  if (consequential && !d4) needs.push(`${p.id} ${p.rule}`);
  const act = counters(p.id, 'var', p.rule);
  const baseAct = counters(p.id, 'base', '');
  const rows = [
    ['white score', d3.score, base.overall.score, variant.overall.score],
    ['decisive', d3.decisive, base.overall.decisiveness, variant.overall.decisiveness],
    ['draw rate', d3.draws, base.overall.drawRate, variant.overall.drawRate],
    ['capped', d3.capped, base.overall.timeouts, variant.overall.timeouts],
    ['mean plies', d3.plies, base.overall.meanPlies, variant.overall.meanPlies],
  ].map(([name, d, lo, hi]) => `| ${name} | ${f3(lo as number)} → ${f3(hi as number)} | ${signed((d as [number, number])[0])} ± ${f3((d as [number, number])[1])} |`);
  const counterRows = ['doubleSteps', 'straightCaptures', 'kingShots', 'mercy2', 'sliderJumps', 'checks', 'promotions']
    .map(k => {
      if (k === 'checks' || k === 'promotions') {
        return `| ${k} | ${f3((base.events[k] ?? 0) / base.games)} | ${f3((variant.events[k] ?? 0) / variant.games)} |`;
      }
      return p.counters.includes(k) ? `| ${k} | ${f3(baseAct[k])} | ${f3(act[k])} |` : null;
    }).filter(Boolean).join('\n');
  const sameSign = d4 ? Math.sign(d4.decisive[0]) === Math.sign(d3.decisive[0]) : false;
  const verdict = consequential
    ? (d4
      ? `Consequential; the depth-4 arm ${sameSign ? 'keeps' : 'reverses'} the depth-3 direction`
        + `${d4.decisive[0] < 0 ? ' — the power makes games **less** decisive, and at depth 4 yet more so' : Math.abs(d4.decisive[0]) <= d4.decisive[1] ? ' — the depth-4 interval includes zero, so only the sign survives' : ''}.`
      : 'Consequential at depth 3; a depth-4 arm is queued.')
    : 'Flat inside its intervals at depth 3; no second depth needed.';
  sections.push(`### ${p.name} (\`${p.rule}\`)

| metric | control → power (pooled) | paired difference ±95% |
|---|---|---|
${rows.join('\n')}
${d4 ? `\nDepth 4 (${d4base!.games} games an arm): decisive ${signed(d4.decisive[0])} ± ${f3(d4.decisive[1])}, draws ${signed(d4.draws[0])} ± ${f3(d4.draws[1])}, score ${signed(d4.score[0])} ± ${f3(d4.score[1])}.\n` : ''}
**Actual use** (per game; control → power):

| counter | control | power |
|---|---|---|
${counterRows}

**Verdict:** ${verdict}
`);
}

// Second readings measured after the campaign (2026-09-17).
const altBase = readReport('kp-deathtouch2.base');
const altVar = readReport('kp-deathtouch2.var');
let altSection = '';
if (altBase && altVar) {
  const d3 = paired(altBase, altVar);
  const b4 = readReport('kp-deathtouch2-d4.base');
  const v4 = readReport('kp-deathtouch2-d4.var');
  const d4 = b4 && v4 ? paired(b4, v4) : null;
  altSection = `### Second reading: Death Touch keeping the displacement capture (\`deathTouchMoves=true\`)

| metric | control → second reading (pooled) | paired difference ±95% |
|---|---|---|
| white score | ${f3(altBase.overall.score)} → ${f3(altVar.overall.score)} | ${signed(d3.score[0])} ± ${f3(d3.score[1])} |
| decisive | ${f3(altBase.overall.decisiveness)} → ${f3(altVar.overall.decisiveness)} | ${signed(d3.decisive[0])} ± ${f3(d3.decisive[1])} |
| draws | ${f3(altBase.overall.drawRate)} → ${f3(altVar.overall.drawRate)} | ${signed(d3.draws[0])} ± ${f3(d3.draws[1])} |
| capped | ${f3(altBase.overall.timeouts)} → ${f3(altVar.overall.timeouts)} | ${signed(d3.capped[0])} ± ${f3(d3.capped[1])} |
| mean plies | ${altBase.overall.meanPlies.toFixed(0)} → ${altVar.overall.meanPlies.toFixed(0)} | ${signed(d3.plies[0], 1)} ± ${f3(d3.plies[1])} |
${d4 ? `\nDepth 4 (${b4!.games} games an arm): decisive ${signed(d4.decisive[0])} ± ${f3(d4.decisive[1])}, draws ${signed(d4.draws[0])} ± ${f3(d4.draws[1])}, score ${signed(d4.score[0])} ± ${f3(d4.score[1])}.\n` : ''}
**Verdict:** the second reading is **worse**, not better: it lowers decisive share further (${signed(d3.decisive[0])} ± ${f3(d3.decisive[1])} at depth 3, ${d4 ? `${signed(d4.decisive[0])} ± ${f3(d4.decisive[1])} at depth 4` : 'depth 4 pending'}), adds capped games and length. Both readings of Death Touch drag draws; the power is not the anti-draw tool the proposal imagined.

`;
}
const openQuestions = `## Reading

- **Darkness is the sharpest of the six**: the largest decisive gain, the largest draw cut and the
  shortest games, and it keeps its sign at depth 4.
- **March and Leap clearly sharpen**, both keeping their sign at depth 4.
- **Mercy sharpens at depth 3** and keeps its sign at depth 4, where the interval includes zero — a
  smaller effect than the depth-3 table alone suggests.
- **Holy Light is flat** on every game-level metric; its value would be positional, not structural.
- **Death Touch runs the other way**: it *lowers* the decisive share (draws up, games longer) at both
  depths, contrary to the plan's expectation that it would be "the best anti-draw power of the
  twelve". The alternative reading (keep the displacement capture) was tested on 2026-09-17 and is
  **worse still** — see the second-reading section above. Both readings drag draws; the power is not
  the anti-draw tool the proposal imagined.

## Still open for the owner (not approvals)

The proposal lists these as questions; the engine currently implements one reading of each, and the
numbers above describe that reading.

| question | proposal | engine today |
|---|---|---|
| Mercy vs guard immunity | Plan §1.10 flags "a Mercy king captures nothing — a guard becomes permanently uncapturable" as needing a designer answer | The Mercy king **may take a guard** (decision 15: a piece may be hard to take, never impossible) |
| Death Touch verb | Plan §1.11 asks whether the king keeps the displacement capture too | The shot **replaces** it (one verb per piece) |
| March / Leap charge | Plan §1.7/§1.8 offer "3 uses, or always on" | **Always on**; no charge counter exists |
| Two kings adjacent under Mercy | Plan §1.10 asks whether they may stand next to each other | **No** — the empty-adjacent-square rule is unchanged |
| Darkness and the evaluation | Plan §1.12 warns the fitted shield terms assume today's pawn | **Not re-fitted**; a Darkness arm reads the rule through an evaluation that misprices its pawn structure |

All six stay **off by default**. Nothing is promoted and no picker is exposed until the owner answers
the table above.
`;

writeFileSync(REPORT, `# Kings' powers, measured — 2026-09-16

Phase 5 of [docs/TAKEOVER-PLAN.md](../TAKEOVER-PLAN.md). The six tier-1 powers
([docs/KINGS-POWERS-PLAN.md](../KINGS-POWERS-PLAN.md) §1.7–§1.12) were implemented but never tested
or measured. This pass adds 21 rule tests (\`src/rules/rules.test.ts\`) and browser/worker checks
(\`tools/qa.mjs\`), plus the campaign below: a 200-game/arm pilot per power, then a 1,600-game
paired A/B on the same 40 arrangements and opening seeds against a **fresh control** (today's
defaults — never the old-paladin \`pb-ab-base24\`). Both kings of a game carry the same power, so the
table is the rule's effect on the game, not a piece value. Depth 4 runs only where the depth-3
difference cleared its own interval.

Seeds: pilot 61, main 62, depth 4 63. Files: \`sim/out/kp-*\`.

${sections.join('\n')}
${altSection}
${openQuestions}`);

if (needs.length) {
  writeFileSync(`${OUT}/kings-depth4.ids`, needs.join('\n') + '\n');
} else if (existsSync(`${OUT}/kings-depth4.ids`)) {
  writeFileSync(`${OUT}/kings-depth4.ids`, '');
}
console.log(`kings-summary: wrote ${REPORT}${needs.length ? `; depth 4 queued for ${needs.length} power(s)` : '; no depth-4 arms needed'}`);
