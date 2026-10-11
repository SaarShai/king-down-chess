import { Position } from '../rules/engine';
import { Rules, setRules } from '../rules/rules';
import { PAWN_V, setEvaluator, setPieceValues } from './eval';
import { worthOf } from '../workshop/judge';
import { SearchOptions, search } from './search';

// The adopted Q6 residual net (src/ai/nnue/weights.ts). The worker builds its own module graph,
// so it must set this itself; the page (main.ts) does the same for the inline fallback.
setEvaluator('residual');

/**
 * The rule snapshot rides on every message, not once at spawn: `Engine.cancel()` terminates the
 * worker and starts a new one, so anything the worker learned at spawn is gone with it. The search
 * reads the module-level rule object, so a variant game (`?rules=2017`, `?kings=…`) must apply the
 * snapshot before it searches — otherwise the AI plays the default game and disagrees with the
 * board (docs/TAKEOVER-PLAN.md §2).
 */
const ctx = self as unknown as Worker;
ctx.onmessage = (e: MessageEvent<{ id: number; pos: Position; opts: SearchOptions; rules: Rules }>) => {
  const { id, pos, opts, rules } = e.data;
  setRules(rules);
  // A design in the slot `T` (ticket 16) is worth what the Workshop's judge says; no design restores the shipped values.
  setPieceValues(rules.design ? { T: Math.round(worthOf(rules.design) * PAWN_V) } : undefined);
  ctx.postMessage({ id, ...search(pos, opts) });
};
