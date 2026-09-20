#!/usr/bin/env -S npx tsx
/**
 * Jev interestingness evaluator for interactions — the rubric the owner asked for.
 *
 * Each candidate is described with the same explicit parameters (frequency, decisiveness association,
 * pieces involved, counterplay) and scored on a 0–3 rubric with anchored levels. Two controls anchor
 * the scale: a deliberately routine interaction and a deliberately dramatic one. If the controls do
 * not separate (routine above 1, highlight below 2), the run is discarded — an instrument that cannot
 * tell those apart says nothing about the rest.
 *
 *   tsx tools/jev-interest.ts
 *
 * Output: docs/research/jev-interest-2026-09-17.md. Scores are a model's reading of the *parameters*,
 * not measurements; the measured profile stays in docs/research/interactions-2026-09-17.md.
 */
import { writeFileSync } from 'node:fs';
import { ask, noul, score } from './jev';

const OUT = 'docs/research/jev-interest-2026-09-17.md';

interface Candidate {
  id: string; name: string; status: 'shipped' | 'lab' | 'proposed' | 'control';
  behaviour: string; frequency: string; decisive: string; pieces: string; counterplay: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: 'control_routine', name: 'CONTROL — a piece steps one square to an empty square', status: 'control',
    behaviour: 'Any single piece moves to an adjacent empty square without attacking anything.',
    frequency: 'every game, many times per game', decisive: 'decides nothing by itself',
    pieces: 'one', counterplay: 'blocking and occupying squares',
  },
  {
    id: 'control_highlight', name: 'CONTROL — a beast chain captures four pieces in one move', status: 'control',
    behaviour: 'A beast captures four adjacent enemies in a single move, ending deep in the enemy position.',
    frequency: 'about 0.8% of games', decisive: 'an immediate four-piece swing, often the game',
    pieces: 'two plus several victims', counterplay: 'keep pieces apart, block the chain square',
  },
  {
    id: 'archer_shot', name: 'Archer crossfire (shipped)', status: 'shipped',
    behaviour: 'The archer shoots an enemy without moving, through blockers, on diagonal neighbours or two squares orthogonally.',
    frequency: '2.3 per game; in 63% of games', decisive: 'games with shots are +4 decisive points',
    pieces: 'two', counterplay: 'stay off the eight rifle squares; approach from the blind spot',
  },
  {
    id: 'beast_chain', name: 'Beast chain (shipped)', status: 'shipped',
    behaviour: 'After a capture the beast keeps capturing from the square it landed on.',
    frequency: 'in 51% of games; chains of 4+ are rare', decisive: 'games with chains are +7 decisive points',
    pieces: 'two plus victims', counterplay: 'do not place pieces adjacent to a beast that can step away',
  },
  {
    id: 'paladin_sacrifice', name: 'Paladin one-for-one trade (shipped)', status: 'shipped',
    behaviour: 'The paladin jumps friends, captures along queen lines, and removes itself after capturing anything but a pawn.',
    frequency: 'in 42% of games', decisive: 'games with a sacrifice are +3 decisive points',
    pieces: 'two', counterplay: 'feed it a pawn; keep the best piece out of its lines',
  },
  {
    id: 'maester_swap', name: 'Maester swap (shipped)', status: 'shipped',
    behaviour: 'The maester trades places with an adjacent friend, or with its king across the home rank at any distance.',
    frequency: '6 per game; in 73% of games', decisive: 'games with swaps are 6 decisive points LOWER — a repositioning, not a fight',
    pieces: 'two', counterplay: 'the swap itself is not an attack; attack the squares it wants',
  },
  {
    id: 'promotion', name: 'Promotion (shipped)', status: 'shipped',
    behaviour: 'A pawn reaching the last rank becomes any non-king piece except a guard.',
    frequency: 'in 27% of games', decisive: 'games with a promotion are +30 decisive points',
    pieces: 'one', counterplay: 'blockade or capture the runner; the game\'s classic race',
  },
  {
    id: 'guard_wall', name: 'Guard wall (shipped)', status: 'shipped',
    behaviour: 'The immortal one-step guard captures nothing and can only be taken by a king.',
    frequency: 'in every game by construction', decisive: 'each guard adds 10–20 draw points',
    pieces: 'one', counterplay: 'go around it; shove it with the lab Ogre; only your king can remove it',
  },
  {
    id: 'templar_capital', name: 'Templar: queen moves while standing on a centre square (lab, measured)', status: 'lab',
    behaviour: 'A one-step piece becomes queen-class while standing on one of the four capital squares (d4 e4 d5 e5), and reverts when it leaves.',
    frequency: 'measured: only 4% of its moves are from a capital (8% with a 120cp location bonus) — the search will not camp on the square',
    decisive: 'measured against a knight control (2,000 paired games): decisive -5.4 +/- 2.7 points, draws +5, plies +8.6; with the bonus still -2.5 +/- 2.6. Odds value 2.15-2.39 pawns, below a knight',
    pieces: 'one plus whoever contests the centre', counterplay: 'attack or shove it off the square; the Ogre counters it directly',
  },
  {
    id: 'reaver_step', name: 'Reaver: a knight that steps away after a kill (lab, measured)', status: 'lab',
    behaviour: 'A knight that, after any capture, may step one square in any direction to an empty square as part of the same move, dodging the recapture.',
    frequency: 'measured: 11.2 moves per game, in 98% of games; 87% of its captures use the step',
    decisive: 'measured against a knight control (2,000 paired games): decisive share +12.3 +/- 2.4 points, games 17.8 plies shorter, balance +2.3 +/- 2.7 points (not significant); odds match prices it above 4.66 pawns against a knight of 2.96 — it is a large buff, not a sidegrade',
    pieces: 'two plus the victim', counterplay: 'cover the escape squares or attack the landing square in advance',
  },
  {
    id: 'reaver_ortho', name: 'Reaver, orthogonal escape only (lab variant, measured value)', status: 'lab',
    behaviour: 'As the Reaver, but the post-capture step may only use the four orthogonal directions.',
    frequency: 'measured: 75% of its captures use the step; roughly as active as the full reading',
    decisive: 'measured against a knight control (2,000 paired games): decisive share +7.1 +/- 2.5 points, draws 25.2% -> 18.1%, balance +1.1 +/- 2.7 (neutral); odds match prices it at 4.04 +/- 0.56 pawns (knight 2.96), converging',
    pieces: 'two plus the victim', counterplay: 'fewer escape squares to cover, so counterplay is easier than against the full reading',
  },
  {
    id: 'squire_drop', name: 'Squire: a piece placed from hand onto the home rank (proposed)', status: 'proposed',
    behaviour: 'A reserve piece: instead of moving, its owner places it on an empty home-rank square, and may do so to block a check.',
    frequency: 'once per game at most, when the owner chooses', decisive: 'a dropped defender can save a lost game, or a fresh attacker can start a winning attack',
    pieces: 'one', counterplay: 'the hole in the back rank from move one is the cost; attack before the drop is worth it',
  },
  {
    id: 'freeze', name: 'King power: Freeze (tier 2, unbuilt)', status: 'proposed',
    behaviour: 'The king freezes one enemy piece (never a king): it cannot move during the opponent\'s next turn.',
    frequency: 'a few uses per game if charged, every turn if always on', decisive: 'paralyses one defender at the key moment',
    pieces: 'two', counterplay: 'the frozen piece can still be defended by others; the freeze itself can be baited',
  },
  {
    id: 'ice_wall', name: 'King power: Ice Wall (tier 2, unbuilt)', status: 'proposed',
    behaviour: 'The king protects one friendly piece (never a king): it cannot be captured during the opponent\'s next turn.',
    frequency: 'a few uses per game if charged', decisive: 'saves a piece that the opponent has already committed to taking',
    pieces: 'two', counterplay: 'attack a second piece, or wait the wall out',
  },
  {
    id: 'strike', name: 'King power: Strike (tier 2, unbuilt)', status: 'proposed',
    behaviour: 'Instead of a normal move, any own piece except the king moves as if it were a queen, counting as the turn.',
    frequency: 'one surprise per game', decisive: 'reach from nowhere: a blocked rook or guard can suddenly act like a queen',
    pieces: 'one', counterplay: 'the piece is still capturable afterwards; the threat changes lines rather than material',
  },
  {
    id: 'flight', name: 'King power: Flight (tier 2, unbuilt)', status: 'proposed',
    behaviour: 'Instead of a normal move, one own piece except the king teleports to any empty square of the owner\'s half, counting as the turn.',
    frequency: 'one or two uses per game', decisive: 'relocates a slow guard or beast to the critical wing in one tempo',
    pieces: 'one', counterplay: 'the piece lands unanchored; punish it before it acts',
  },
  {
    id: 'sacrifice', name: 'King power: Sacrifice (tier 3, unbuilt — needs a reserve)', status: 'proposed',
    behaviour: 'Swap one of your pawns with one of your own previously captured pieces; counts as the turn.',
    frequency: 'once or twice per game', decisive: 'brings back a lost piece at the cost of a pawn and a tempo',
    pieces: 'two', counterplay: 'the reserve is public; keep captured pieces worth more than a pawn off the board',
  },
];

const LEVELS = [
  'Routine: frequent and mostly mechanical; games would barely change without it',
  'Texture: adds variety but rarely changes a plan',
  'Plan-worthy: players will look for it and play around it',
  'Highlight: rare or dramatic; players will remember and talk about it',
];

const questions: Record<string, unknown> = {};
for (const c of CANDIDATES) {
  questions[`interest_${c.id}`] = {
    type: 'score',
    instructions: `How interesting is this interaction for players, judging only from the parameters given? ${c.name}. ${c.behaviour} Frequency: ${c.frequency}. Effect: ${c.decisive}. Pieces involved: ${c.pieces}. Counterplay: ${c.counterplay}.`,
    criteria: LEVELS,
  };
  questions[`counterplay_${c.id}`] = {
    type: 'noul',
    instructions: `Does this interaction give the opponent a clear, satisfying way to answer it in play? ${c.name}. ${c.behaviour} Counterplay: ${c.counterplay}.`,
    criteria: { true: 'A clear answer exists and is worth playing around', false: 'The answer is weak, obscure or absent' },
  };
}

const state = {
  task: 'King Down chess: score how interesting each interaction is for players. The parameters are measured (shipped items) or design estimates (proposed items). Interesting means it creates decisions and stories without being routine or unfair.',
  rubric: LEVELS,
  note: 'Judgments are about player experience, not balance. A frequent interaction can still be interesting; a rare one can still be routine.',
};

// Three runs, majority + median (the self-consistency pattern that made the rule review stable);
// a candidate's rank is only trusted when the runs agree on its band.
const RUNS = 3;
const S: Record<string, number[]> = Object.fromEntries(CANDIDATES.map(c => [c.id, []]));
const N: Record<string, number[]> = Object.fromEntries(CANDIDATES.map(c => [c.id, []]));
let ctlBad = '';
for (let r = 0; r < RUNS; r++) {
  const answers = await ask(state, questions);
  const cr = score(answers.interest_control_routine), ch = score(answers.interest_control_highlight);
  if (!(cr <= 1) || !(ch >= 2)) { ctlBad = `run ${r + 1}: routine ${cr.toFixed(2)} (want <= 1), highlight ${ch.toFixed(2)} (want >= 2)`; break; }
  for (const c of CANDIDATES) { S[c.id].push(score(answers[`interest_${c.id}`])); N[c.id].push(noul(answers[`counterplay_${c.id}`])); }
}
if (ctlBad) {
  console.error(`jev-interest: CONTROL FAILED — ${ctlBad}. Instrument invalid; discarding the run.`);
  process.exit(2);
}
const med = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const spread = (xs: number[]): number => Math.max(...xs) - Math.min(...xs);
console.log(`jev-interest: controls ok in all ${RUNS} runs (routine ${S.control_routine.map(v => v.toFixed(2)).join('/')}, highlight ${S.control_highlight.map(v => v.toFixed(2)).join('/')})`);

const rows = CANDIDATES.filter(c => c.status !== 'control')
  .map(c => ({ c, s: med(S[c.id]), n: med(N[c.id]), sd: spread(S[c.id]) }))
  .sort((a, b) => b.s - a.s || b.n - a.n);

const md = `# Jev interestingness evaluation of interactions — 2026-09-17

Each interaction was described with the same parameters (behaviour, frequency, decisiveness effect,
pieces involved, counterplay) and scored on a 0–3 rubric, **three times**; the table shows the median
and the run-to-run spread. Controls anchoring the scale: a routine one-square step vs a four-capture
beast chain, checked in every run (routine ${S.control_routine.map(v => v.toFixed(2)).join('/')}, highlight ${S.control_highlight.map(v => v.toFixed(2)).join('/')}). The scores are a model's reading of the parameters, not measurements; the measured
profile is \`docs/research/interactions-2026-09-17.md\`. A spread above 0.5 means the item sits on a
rubric boundary — treat its rank as tentative.

| interaction | status | interest 0–3 (median) | spread | counterplay exists |
|---|---|---|---|---|
${rows.map(r => `| ${r.c.name} | ${r.c.status} | ${r.s.toFixed(2)} | ${r.sd.toFixed(2)} | ${r.n.toFixed(2)} |`).join('\n')}

## Build-order read

The unbuilt items above the shipped median are the strongest candidates to implement next. The
instruments do not replace the design rules in \`PIECES-PROPOSED.md\` (capturable, one sentence, reach
earned) — they only rank which of the already-designed options a player would feel most.
`;
writeFileSync(OUT, md);
console.log(`jev-interest: wrote ${OUT}`);
