// Test-only worker: keep the same search module graph alive across messages, as the browser does.
import { parentPort } from 'node:worker_threads';
import { setRules, type Rules } from '../../src/rules/rules';
import { fromFen, toLan } from '../../src/rules/setup';
import { positionKey, resetSearchState, search } from '../../src/ai/search';
import { setDesignValue, setEvaluator } from '../../src/ai/eval';

setEvaluator('residual');
parentPort!.on('message', ({ rules, fen, reset }: { rules: Rules; fen: string; reset: boolean }) => {
  setRules(rules);
  setDesignValue(rules.design);
  if (reset) resetSearchState();
  const pos = fromFen(fen), start = performance.now();
  const result = search(pos, { maxDepth: 3 });
  parentPort!.postMessage({ ...result, move: result.move && toLan(pos, result.move), key: positionKey(pos), ms: performance.now() - start });
});
