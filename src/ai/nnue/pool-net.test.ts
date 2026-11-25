/**
 * Each piece type that a random army can field must reach the shipped net.
 *
 * `evalBoard` plays the linear evaluation on a board with a type the loaded net has no inputs
 * for. A new letter in a pool therefore turns the net off, with no error, on every game whose army
 * holds that piece (2026-10-02: the Ogre joined `POOL` and the net was off on about half of the
 * browser games for a week). This test takes its cases from the real pools.
 */
import { describe, expect, it } from 'vitest';
import { BLACK, Color, K, LETTERS, PieceType, WHITE, piece } from '../../rules/engine';
import { POOL, POOL_2BEASTS, POOL_NO_PALADIN } from '../../rules/setup';
import { evalBoard, evaluateBoard, setEvaluator } from '../eval';
import { netKind, netLoaded } from './net';

const POOLS = { POOL, POOL_NO_PALADIN, POOL_2BEASTS };

/** Squares between the two kings (a1, h8), on ranks 2 to 7. */
const SQUARES = Array.from({ length: 48 }, (_, i) => 8 + i);

describe('the random-army pools and the shipped net', () => {
  it('the browser evaluator has a residual net to load', () => {
    expect(netLoaded, 'src/ai/nnue/weights.ts holds no net, so the browser games play linear').toBe(true);
    expect(netKind()).toBe('residual');
  });

  const letters = [...new Set(Object.values(POOLS).join(''))];
  it.each(letters)('pool piece %s reaches the net', letter => {
    const type = LETTERS.indexOf(letter) as PieceType;
    const pools = Object.entries(POOLS).filter(([, pool]) => pool.includes(letter)).map(([name]) => name).join(', ');
    expect(type, `pool letter ${letter} is not a piece type in LETTERS (src/rules/engine.ts)`).toBeGreaterThan(0);
    setEvaluator('residual'); // as src/ai/worker.ts and src/game.ts do
    try {
      let reads = 0;
      for (const c of [WHITE, BLACK] as Color[]) for (const s of SQUARES) {
        const board = new Uint8Array(64);
        board[0] = piece(K, WHITE);
        board[63] = piece(K, BLACK);
        board[s] = piece(type, c);
        if (evalBoard(board, WHITE) !== evaluateBoard(board, WHITE)) reads++;
      }
      // A trained residual can be exactly 0 on one square; on all 96 it means the net is off.
      expect(reads, `pool piece ${letter} (type ${type}, in ${pools}) falls back to the linear evaluation: `
        + 'retrain the net with inputs for it, or add an input block in src/ai/nnue/net.ts and its type in hasNetTypes (src/ai/eval.ts)').toBeGreaterThan(0);
    } finally {
      setEvaluator('linear');
    }
  });
});
