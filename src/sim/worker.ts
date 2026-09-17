/** One worker = one core playing games serially. Run under tsx (see package.json "sim"). */
import { parentPort, workerData } from 'node:worker_threads';
import { playGame } from './game';
import { Job, RunSpec } from './spec';

const spec = workerData as RunSpec;
parentPort!.on('message', (job: Job) => parentPort!.postMessage(playGame(spec, job)));
