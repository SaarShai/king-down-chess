/** One match's Node search state. Enforcement and save replay stay in its stored engine. */
import { parentPort } from 'node:worker_threads';
import { RULES, setRules } from '../rules/rules';
import { toLan } from '../rules/setup';
import { resetSearchState, search } from '../ai/search';
import { setDesignValue, setEvaluator } from '../ai/eval';
import { skillPlan } from '../ai/skill';
import type { RuntimeSearch } from './index';

setEvaluator('linear');
function choose(context: RuntimeSearch): string {
  setRules(context.rules);
  setDesignValue(RULES.design);
  const { level, maxTimeMs, maxDepth: depth } = context.options;
  let timeMs = maxTimeMs === undefined ? 250 : maxTimeMs;
  const maxDepth = depth === undefined ? (level ? undefined : 4) : depth;
  const plan = level && skillPlan(level, context.ply);
  if (plan) timeMs = Math.min(maxTimeMs ?? plan.timeMs, plan.timeMs);
  resetSearchState();
  const result = search(context.pos, { timeMs, maxDepth, temperature: plan ? plan.temperature : undefined, history: context.history });
  if (plan && plan.blunder > 0 && Math.random() < plan.blunder) return context.legal[Math.floor(Math.random() * context.legal.length)];
  if (!result.move) throw new Error('Search returned no move');
  return toLan(context.pos, result.move);
}
parentPort!.on('message', ({ id, op, input }) => {
  try {
    if (op !== 'search' || input?.kind !== 'runtime-search') throw new Error('Unknown search operation');
    parentPort!.postMessage({ id, value: choose(input) });
  } catch (e) { parentPort!.postMessage({ id, error: (e as Error).message }); }
});
