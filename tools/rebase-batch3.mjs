/**
 * Re-base the batch-3 specs onto the v0.6 defaults and the tuned design values.
 *
 * `tools/mine.ts --specs` wrote `sim/specs/batch3/*.json` from the *untuned* measured values
 * (sim-results §14: A/G/S all pinned at the 1.70 band floor). The Texel fit re-priced every piece
 * (`docs/research/sim-tuning-2026-09-13.md` §6), so three of the batch's hypotheses no longer hold
 * their armies at a constant value. This script rewrites only those arms, plus the rule arms, and
 * leaves the other 20 specs exactly as mine.ts wrote them.
 *
 *   node tools/rebase-batch3.mjs            # rewrite, print what changed
 *
 * `place` and `rng32` are a line-for-line port of `tools/mine.ts` (same rank lists for the same
 * seed); they are copied rather than imported so this file stays a plain .mjs with no tsx.
 */
import { writeFileSync, readFileSync } from 'node:fs';

const DIR = 'sim/specs/batch3';

/** Tuned design values in pawns (sim-tuning §6; G is still a bound, so it is a ceiling). */
export const VALUE = { K: 0, Q: 9.1, R: 4.7, B: 3.1, N: 3.0, P: 1.0, A: 3.4, L: 2.2, G: 1.5, M: 2.2, S: 2.7 };
const value = a => [...a].reduce((s, c) => s + VALUE[c], 0);

function rng32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` distinct arrangements of one army (7 letters + K); two bishops on opposite colours. */
function place(army, n, seed, ok = () => true) {
  const r = rng32(seed);
  const letters = [...(army + 'K')];
  const out = new Set();
  for (let guard = 0; out.size < n && guard < 400000; guard++) {
    const a = [...letters];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const s = a.join('');
    const b = [...s].flatMap((c, i) => (c === 'B' ? [i] : []));
    if (b.length === 2 && (b[0] + b[1]) % 2 === 0) continue;
    if (ok(s)) out.add(s);
  }
  if (out.size < n) throw new Error(`only ${out.size}/${n} ranks for "${army}"`);
  return [...out].sort();
}

const N = 20, G = 100;
const arm = (id, army, seed, note, games = G) => ({
  id, games: N * games, seed, ai: { depth: 3 }, commonSeeds: true,
  backRanks: place(army, N, seed), note: `${note} — army ${army}, ${value(army).toFixed(1)} pawns (tuned values)`,
});

const specs = [
  // 1. Iso-value ladder, one letter per step: B->A, N->S, N->S, B->A. The anchor QRRBBNN = 30.7 is
  //    the only all-standard army. A (3.4) and S (2.7) now straddle B (3.1) and N (3.0), so the
  //    ladder reaches fairy 4 at exactly the anchor — under the old values it stopped at 3.
  arm('b3-val-f0', 'QRRBBNN', 301, 'fairy 0, the only all-standard army'),
  arm('b3-val-f1', 'QRRBNNA', 302, 'fairy 1, B->A'),
  arm('b3-val-f2', 'QRRBNAS', 303, 'fairy 2, N->S'),
  arm('b3-val-f3', 'QRRBASS', 304, 'fairy 3, N->S'),
  arm('b3-val-f4', 'QRRAASS', 305, 'fairy 4, B->A — the ceiling the old values said was 3'),

  // 2. The mirror image: fairy multiset held at A,A,M and the four standards stepped down.
  //    Nothing in a 7-piece army can drop 9 pawns and keep the queen, so the bottom arm loses it.
  arm('b3-iso-v32', 'QRRBAAM', 311, 'fairy 3, top of the value ladder'),
  arm('b3-iso-v27', 'QBBNAAM', 312, 'fairy 3, middle'),
  arm('b3-iso-v22', 'BBNNAAM', 313, 'fairy 3, bottom (no queen: unavoidable at this value)'),

  // 3. Guard count at fixed fairy count. A->G costs 1.9 pawns now, so each guard is paid for with
  //    a knight->rook upgrade; the arm therefore reads "guard + rook" against "archer + knight".
  arm('b3-guard0', 'QBNNAAM', 321, 'guards 0, fairy 3'),
  arm('b3-guard1', 'QRBNAGM', 322, 'guards 1, fairy 3 (A->G paid with N->R)'),
  arm('b3-guard2', 'QRRBGGM', 323, 'guards 2, fairy 3 — H10 predicts +10 draw points 0->2'),

  // 13. L and M both price at 2.2, so L,L <-> M,M is the one exactly value-neutral pair swap the
  //     tuned table offers. The old knight control is 0.8 pawns off and cannot be matched.
  arm('b3-paladin2', 'QRRBBLL', 411, 'two paladins'),
  arm('b3-paladin0', 'QRRBBMM', 412, 'two maesters, the exact value-neutral control'),
];

for (const s of specs) {
  writeFileSync(`${DIR}/${s.id}.json`, JSON.stringify(s, null, 2) + '\n');
  console.log(`${s.id.padEnd(14)} ${s.note}`);
}

// 7. The rule arms already run today's defaults; name all five v0.6 toggles so the summary passes
//    the tuner's `v06Runs()` test and the run is reusable as training data.
for (const id of ['b3-rule-base', 'b3-rule-noArcherCheck', 'b3-rule-noGuardImmune', 'b3-rule-noLongSwap']) {
  const f = `${DIR}/${id}.json`;
  const s = JSON.parse(readFileSync(f, 'utf8'));
  s.rules = { archerMove: 'any', beastMove: 'any', guardCaptures: 'pawns', guardStep: 2, guardCaptureLimit: 1, ...s.rules };
  writeFileSync(f, JSON.stringify(s, null, 2) + '\n');
  console.log(`${id.padEnd(14)} rules ${JSON.stringify(s.rules)}`);
}
