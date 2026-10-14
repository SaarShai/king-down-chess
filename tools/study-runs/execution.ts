import { appendFileSync, writeFileSync, readFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tsWorker } from '../../src/sim/ts-worker';
import { stampOf } from '../../src/sim/run';
import type { GameRecord } from '../../src/sim/game';
import { verifyBundle, sha256, type FrozenRunBundle } from './bundle';
import { canonicalMeasurementJSON } from '../../src/study/measurement-plan';
export interface ExecutedGame { index: number; bundleHash: string; partId: string; record: GameRecord & ReturnType<typeof stampOf> }
export async function executePart(bundle: FrozenRunBundle, partId: string, output: string, sourceRoot: string): Promise<void> {
  verifyBundle(bundle, sourceRoot);
  if (process.version !== bundle.nodeVersion) throw new Error('Runtime mismatch');
  const part = bundle.parts.find(p => p.id === partId); if (!part) throw new Error('Unknown part');
  mkdirSync(output, { recursive: true });
  const raw = join(output, 'games.jsonl');
  if (existsSync(raw)) throw new Error('Execution output already exists; resume is not supported');
  writeFileSync(raw, '');
  let cursor = 0, completedGames = 0, failed = false;
  const atomic = (name: string, value: unknown) => { const path = join(output, name); writeFileSync(`${path}.tmp`, JSON.stringify(value)); renameSync(`${path}.tmp`,path); };
  const status = (state: string, message = '') => atomic('status.json', { state, completedGames, message });
  const attest = () => atomic('attestation.json', { bundleHash: bundle.hash, partId, sourceManifestHash: sha256(canonicalMeasurementJSON(bundle.sourceManifest)), nodeVersion: process.version, gamesSha256: sha256(readFileSync(raw)) });
  const signal = () => { status('failed', 'Worker receives a stop signal'); attest(); process.exit(143); };
  process.once('SIGTERM',signal); process.once('SIGINT',signal);
  status('running');
  try {
    const results = await Promise.allSettled(Array.from({ length: Math.min(part.workers, part.jobIndexes.length) }, async () => {
      const worker = tsWorker(new URL('../../src/sim/study-game-worker.ts', import.meta.url));
      try {
        while (!failed && cursor < part.jobIndexes.length) {
          const index = part.jobIndexes[cursor++], game = bundle.prepared.jobs[index];
          const record = await new Promise<GameRecord>((resolve, reject) => {
            const error = (e: Error) => { cleanup(); reject(e); };
            const exit = (code: number) => { cleanup(); reject(new Error(`Worker exits: ${code}`)); };
            const message = (value: { record?: GameRecord; error?: string }) => { cleanup(); value.record ? resolve(value.record) : reject(new Error(value.error)); };
            const cleanup = () => { worker.off('message', message); worker.off('error', error); worker.off('exit', exit); };
            worker.once('message', message); worker.once('error', error); worker.once('exit', exit);
            worker.postMessage({ game, evaluation: bundle.prepared.evaluation });
          });
          appendFileSync(raw, JSON.stringify({ index, bundleHash: bundle.hash, partId, record: { ...record, ...stampOf(game.spec, bundle.source) } } satisfies ExecutedGame) + '\n');
          completedGames++; status('running');
        }
      } catch (error) { failed = true; throw error; } finally { await worker.terminate(); }
    }));
    const failure = results.find(r => r.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    verifyBundle(bundle, sourceRoot);
    status('complete');
  } catch (error) { status('failed', String(error)); throw error; }
  finally {
    process.off('SIGTERM',signal); process.off('SIGINT',signal); attest();
  }
}
