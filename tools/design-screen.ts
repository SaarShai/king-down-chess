#!/usr/bin/env -S npx tsx
/**
 * Design-rule screen for proposed pieces: rules 2-5 of docs/PIECES-PROPOSED.md (a sharp job, reach
 * earned, one sentence, a new kind of move), judged from the rule text before anything is built.
 * Rules 1 (capturable) and 6 (empty MATRIX cell) are code/lookup and are not asked.
 *
 * Controls in every run: the Reaver's orthogonal reading (known to pass rules 4 and 5) and "the guard
 * may capture one pawn per lifetime" (known to fail rule 4 and rule 2). Three runs, median.
 * The output table has an empty "owner" column: the screen orders the build queue and collects
 * labels; it does not accept or reject a piece. Rule 3 is partly a measurement (firing rate) — run a
 * 200-game pilot before trusting a "satisfies" on it.
 *
 *   tsx tools/design-screen.ts            → docs/research/design-screen-<date>.md
 */
import { writeFileSync } from 'node:fs';
import { MODEL, ask, prob } from './jev';

const RULES: Record<string, string> = {
  r2_sharp_job: 'A sharp job: the piece exists to break something (a pawn shield, a blockade, a second line), not to hold something.',
  r3_reach_earned: 'Reach must be earned: long reach that works from move one hands the first mover the edge; reach behind a condition (a screen, a zone, a capture first) arrives later and more evenly.',
  r4_one_sentence: 'One sentence to state: the rule is not fiddly (no per-lifetime counters, no special cases a player must track).',
  r5_new_move: 'A new kind of move: it moves differently from the shipped fairy pieces, four of which step one square.',
};
type Piece = { id: string; name: string; status: 'control_pass' | 'control_fail' | 'proposed' | 'lab'; text: string };
const PIECES: Piece[] = [
  { id: 'ctl_reaver', name: 'CONTROL Reaver (orthogonal step)', status: 'control_pass', text: 'Moves and captures like a knight. After a capture it may step one square orthogonally onto an empty square as part of the same move; the step never captures.' },
  { id: 'ctl_lifetime', name: 'CONTROL guard one capture per lifetime', status: 'control_fail', text: 'The guard steps one square and cannot be captured; once per game it may capture one pawn.' },
  { id: 'catapult', name: 'Catapult', status: 'lab', text: 'Moves like a rook through empty squares and never captures by moving. It captures by lobbing along a rank or file: the first piece in the line must be an enemy, and it takes the first piece beyond that screen, at any distance, landing on that square.' },
  { id: 'squire', name: 'Squire', status: 'proposed', text: 'Begins in hand; its home-rank square is empty at the start. Instead of moving, its owner may place it on any empty square of their home rank, even to block a check. Once placed it moves and captures one square in any direction.' },
  { id: 'ogre', name: 'Ogre', status: 'lab', text: 'Moves and captures one square in any direction. Instead of moving, it may shove one adjacent piece, friend or enemy but never a king, one square straight away from itself onto an empty square.' },
  { id: 'templar', name: 'Templar', status: 'lab', text: 'Moves and captures one square in any direction. While it stands on one of the four capital squares it moves and captures like a queen.' },
  { id: 'strike', name: 'King power: Strike', status: 'proposed', text: 'Once per game the king may capture an enemy on any square a queen could reach from it, without moving.' },
  { id: 'flight', name: 'King power: Flight', status: 'proposed', text: 'Once per game the king may move like a knight.' },
];
const CHOICES = { satisfies: 'The text clearly satisfies the rule', arguable: 'It depends on how the rule is read', fails: 'The text clearly breaks the rule' };

const questions: Record<string, unknown> = {};
for (const p of PIECES) for (const [rid, rule] of Object.entries(RULES)) questions[`${rid}__${p.id}`] = {
  type: 'choice',
  instructions: `Judging only from the piece text, does this piece satisfy the design rule? Rule: ${rule} Piece: ${p.text}`,
  criteria: CHOICES,
};
const state = { task: 'King Down chess. Screen proposed pieces against the design rules that past measurement taught. Judge the text only; measurements come later.', rules: RULES };

const RUNS = 3;
const P: Record<string, Record<string, number>[]> = {}; // key -> per-run probability maps
for (let r = 0; r < RUNS; r++) {
  const a = await ask(state, questions);
  const pass4 = prob(a.r4_one_sentence__ctl_reaver, 'satisfies'), pass5 = prob(a.r5_new_move__ctl_reaver, 'satisfies');
  const fail4 = prob(a.r4_one_sentence__ctl_lifetime, 'fails'), fail2 = prob(a.r2_sharp_job__ctl_lifetime, 'fails');
  if (!(pass4 >= 0.5 && pass5 >= 0.5 && fail4 >= 0.5)) {
    console.error(`design-screen: CONTROL FAILED run ${r + 1}: reaver r4 ${pass4.toFixed(2)} r5 ${pass5.toFixed(2)} (want >= 0.5), lifetime r4 fails ${fail4.toFixed(2)} (want >= 0.5), r2 fails ${fail2.toFixed(2)}. Discarding.`);
    process.exit(2);
  }
  for (const k of Object.keys(questions)) (P[k] ??= []).push({ satisfies: prob(a[k], 'satisfies'), arguable: prob(a[k], 'arguable'), fails: prob(a[k], 'fails') });
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const verdict = (k: string): string => {
  const m = Object.fromEntries(['satisfies', 'arguable', 'fails'].map(c => [c, med(P[k].map(x => x[c]))]));
  const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
  return top[1] < 0.6 || top[0] === 'arguable' ? `ask (${top[0]} ${top[1].toFixed(2)})` : `${top[0]} ${top[1].toFixed(2)}`;
};
const date = new Date().toISOString().slice(0, 10);
const md = `# Design-rule screen — ${date}

Model ${MODEL}, ${RUNS} runs, median probability; controls passed in every run. "ask" = top answer below 0.6 or "arguable": the owner decides with the rule quoted. Rules 1 and 6 are code and lookup. Rule 3 is partly a firing-rate measurement: pilot 200 games before trusting "satisfies".
Fill the **owner** column (per rule: s / a / f) to turn this into labels; the screen is not evidence and does not reject anything.

| piece | status | r2 sharp job | r3 reach earned | r4 one sentence | r5 new move | owner |
|---|---|---|---|---|---|---|
${PIECES.map(p => `| ${p.name} | ${p.status} | ${Object.keys(RULES).map(r => verdict(`${r}__${p.id}`)).join(' | ')} |  |`).join('\n')}
`;
const out = `docs/research/design-screen-${date}.md`;
writeFileSync(out, md);
console.log(`design-screen: controls ok; wrote ${out}`);
