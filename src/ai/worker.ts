import { Position } from '../rules/engine';
import { Rules, setRules } from '../rules/rules';
import { SearchOptions, search } from './search';

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
  ctx.postMessage({ id, ...search(pos, opts) });
};
