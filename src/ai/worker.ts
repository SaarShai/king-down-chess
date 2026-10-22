import { Position } from '../rules/engine';
import { Rules, setRules } from '../rules/rules';
import { setDesignValue, setEvaluator } from './eval';
import { SearchOptions, search } from './search';

// The adopted Q6 residual net (src/ai/nnue/weights.ts). The worker builds its own module graph,
// so it must set this itself; Engine.think (src/game.ts) does the same for the inline fallback.
setEvaluator('residual');

/**
 * Engine keeps this module graph for one game lifetime, including each action of a held turn.
 * A new game or cancellation replaces the worker and its search tables. Rules ride on every
 * request so replacement workers use the same game definition as the board.
 */
const ctx = self as unknown as Worker;
ctx.onmessage = (e: MessageEvent<{ id: number; pos: Position; opts: SearchOptions; rules: Rules }>) => {
  const { id, pos, opts, rules } = e.data;
  setRules(rules);
  setDesignValue(rules.design);
  ctx.postMessage({ id, ...search(pos, opts) });
};
