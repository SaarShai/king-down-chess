import { A, B, C, G, K, L, M, N, O, P, Q, R, S, T, V } from '../rules/engine';

/**
 * The shipped material values (centipawns) by piece type, for page code that must not load the
 * evaluation: `src/ai/eval.ts` brings the net weights, about 100 KB gzip on the first page.
 *
 * A copy of the constants in `src/ai/eval.ts`, which stay the source (`npm run tune:apply`
 * rewrites them there). `piece-values.test.ts` fails when the two differ. Unlike `VALUES` in
 * eval.ts, this record never changes at run time: the balance lab and a design's worth do not reach it.
 */
export const SHIPPED_VALUES: Readonly<Record<number, number>> = Object.freeze({
  [P]: 100, [N]: 316, [B]: 322, [R]: 449, [Q]: 933, [K]: 0,
  [A]: 339, [L]: 408, [G]: 96, [M]: 318, [S]: 434,
  [O]: 318, [C]: 400, [V]: 400, [T]: 350,
});
