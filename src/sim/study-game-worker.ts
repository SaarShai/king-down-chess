import { parentPort } from 'node:worker_threads';
import { playGame } from './game';
import { setEvalParams } from '../ai/eval';
import type { PlannedGame } from '../study/measurement-preview';
parentPort!.on('message', ({ game, evaluation }: { game: PlannedGame; evaluation: Parameters<typeof setEvalParams>[0] }) => {
  try { setEvalParams(evaluation); parentPort!.postMessage({ record: playGame(game.spec, game.job) }); }
  catch (error) { parentPort!.postMessage({ error: String(error) }); }
});
