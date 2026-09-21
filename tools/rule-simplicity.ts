#!/usr/bin/env -S npx tsx
/**
 * Rule simplicity screen: can a player remember and apply this rule during play?
 *
 * Owner corrections (2026-09-14, 2026-09-21): measured-best rules were rejected afterwards as "very
 * cumbersome, hard to remember and parse", and "all things being equal or near equal, do not change
 * rules or add rules". This screen scores the *wording only* on a 0-3 rubric, three runs, with the two
 * rejected rules as known-cumbersome controls and a one-step move as the known-simple control. If the
 * controls do not separate the run is discarded. A clause count is printed beside it as the
 * deterministic comparator. Nothing here adopts or rejects a rule; it adds a column to the table.
 *
 *   tsx tools/rule-simplicity.ts [rules.json]        (default: the sentences below)
 *   tsx tools/rule-simplicity.ts --selftest          (clause counter only, no request)
 *
 * Output: docs/research/rule-simplicity-<date>.md
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { MODEL, ask, score } from './jev';

const LEVELS = [
  'As simple as a chess rule: one shape or one condition',
  'One extra clause a player keeps in mind',
  'Needs a diagram to learn',
  'Needs a table or list to apply during play',
];
type Rule = { id: string; text: string; status: 'control_simple' | 'control_cumbersome' | 'shipped' | 'lab' | 'proposed' };
const DEFAULT: Rule[] = [
  { id: 'ctl_simple', status: 'control_simple', text: 'The archer steps one square in any direction.' },
  { id: 'ctl_beast7', status: 'control_cumbersome', text: "The beast's first capture may be on any of the seven neighbouring squares that are not straight ahead; straight ahead it may move but not capture." },
  { id: 'ctl_lifetime', status: 'control_cumbersome', text: 'The guard may capture one pawn per lifetime.' },
  { id: 'bishops', status: 'shipped', text: 'Bishops start on opposite colours.' },
  { id: 'archer_check', status: 'shipped', text: 'The archer may shoot the king, which gives check.' },
  { id: 'draws', status: 'shipped', text: 'Draws by threefold repetition, the fifty-move rule and insufficient material are on.' },
  { id: 'maester_swap', status: 'shipped', text: 'The maester may swap places with its king across the home rank; the swap is illegal if the king would be in check.' },
  { id: 'paladin', status: 'shipped', text: 'A paladin that captures anything except a pawn is removed from the board after the capture.' },
  { id: 'archer_shots', status: 'shipped', text: 'The archer shoots the four diagonal neighbours and, on each forward diagonal, the square two steps away.' },
  { id: 'beast_chain', status: 'shipped', text: 'The beast captures on any adjacent square and may keep capturing from the square it lands on.' },
  { id: 'one_guard', status: 'shipped', text: 'Each army has at most one guard.' },
  { id: 'promotion', status: 'shipped', text: 'Pawns promote to queen, rook, bishop or knight.' },
  { id: 'ogre', status: 'lab', text: 'The ogre may, instead of moving, shove one adjacent piece one square straight away from itself onto an empty square; kings cannot be shoved.' },
  { id: 'catapult', status: 'lab', text: 'The catapult captures by lobbing along a rank or file: the first piece in the line must be an enemy, and the catapult takes the first piece beyond it, at any distance, landing on that square.' },
  { id: 'squire', status: 'proposed', text: 'The squire begins in hand and may be placed on any empty home-rank square instead of moving, including to block a check.' },
  { id: 'reaver', status: 'lab', text: 'The reaver moves like a knight and, after a capture, may step one square orthogonally to an empty square as part of the same move.' },
];

/** Deterministic comparator: 1 + separators + exception words. */
export const clauseCount = (t: string): number =>
  1 + (t.match(/[;,:]/g) ?? []).length + (t.match(/\b(except|unless|only|not|instead|but|including|cannot|never)\b/gi) ?? []).length;

if (process.argv.includes('--selftest')) {
  const c = Object.fromEntries(DEFAULT.map(r => [r.id, clauseCount(r.text)]));
  // The counter separates the long control but not 'one pawn per lifetime' (1 clause, yet rejected):
  // that state-tracking case is exactly what the wording count misses and the model screen is for.
  if (!(c.ctl_simple < c.ctl_beast7)) throw new Error(`clauseCount does not separate controls: ${JSON.stringify(c)}`);
  console.log('rule-simplicity selftest ok', c);
  process.exit(0);
}

const file = process.argv[2];
const RULES: Rule[] = file ? JSON.parse(readFileSync(file, 'utf8')) : DEFAULT;
const questions: Record<string, unknown> = {};
for (const r of RULES) questions[`simp_${r.id}`] = {
  type: 'score',
  instructions: `Judging only from the wording, how hard is this rule for a player to remember and apply during play, compared with an ordinary chess rule? Rule: "${r.text}"`,
  criteria: LEVELS,
};
const state = { task: 'King Down chess (a chess variant with fairy pieces). Rate each rule sentence for how hard it is to remember and apply during play. Judge the wording only, not whether the rule is good for the game.', rubric: LEVELS };

const RUNS = 3;
const S: Record<string, number[]> = Object.fromEntries(RULES.map(r => [r.id, []]));
for (let i = 0; i < RUNS; i++) {
  const a = await ask(state, questions);
  const simple = score(a.simp_ctl_simple), b7 = score(a.simp_ctl_beast7), lt = score(a.simp_ctl_lifetime);
  // Gate set after the first live run (2026-09-21): the model puts both owner-rejected rules at about
  // level 1 ('one extra clause') and the simple control near 0, so level 1 is already what the owner
  // rejects. Separation required: simple <= 0.5, cumbersome >= 1.0.
  if (!(simple <= 0.5 && b7 >= 1.0 && lt >= 1.0)) {
    console.error(`rule-simplicity: CONTROL FAILED run ${i + 1}: simple ${simple.toFixed(2)} (want <= 0.5), beast7 ${b7.toFixed(2)}, lifetime ${lt.toFixed(2)} (want >= 1.0). Discarding.`);
    process.exit(2);
  }
  for (const r of RULES) S[r.id].push(score(a[`simp_${r.id}`]));
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
const date = new Date().toISOString().slice(0, 10);
const rows = RULES.map(r => ({ r, s: med(S[r.id]), sd: spread(S[r.id]), c: clauseCount(r.text) })).sort((a, b) => b.s - a.s);
const md = `# Rule simplicity screen — ${date}

Model ${MODEL}, ${RUNS} runs, controls in every run (simple ${S.ctl_simple.map(v => v.toFixed(2)).join('/')}, beast-7 ${S.ctl_beast7.map(v => v.toFixed(2)).join('/')}, lifetime ${S.ctl_lifetime.map(v => v.toFixed(2)).join('/')}).
Score 0-3: ${LEVELS.map((l, i) => `${i} = ${l.toLowerCase()}`).join('; ')}. Clauses = deterministic count (separators + exception words).
This rates wording only. It is not a measurement and does not adopt or reject anything. Calibration 2026-09-21: the controls separate (0.05 vs about 1.0-1.3), but several shipped rules score above the 'one capture per lifetime' control, so the screen does not yet tell an owner-rejected rule from an accepted one. Advisory column only until the owner labels these sentences.

| rule | status | simplicity (median) | spread | clauses | text |
|---|---|---|---|---|---|
${rows.map(x => `| ${x.r.id} | ${x.r.status} | ${x.s.toFixed(2)} | ${x.sd.toFixed(2)} | ${x.c} | ${x.r.text} |`).join('\n')}
`;
const out = `docs/research/rule-simplicity-${date}.md`;
writeFileSync(out, md);
console.log(`rule-simplicity: controls ok; wrote ${out}`);
