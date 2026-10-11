import { afterEach, expect, it, vi } from 'vitest';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import type { MatchSetup, MatchSnapshot, ChooseMoveOptions } from './index';

// Each test starts a worker that loads the engine through tsx and runs real search; the strong cap test alone takes about 3 s
// on an idle Mac. A busy Mac (other test runs, browser checks) needs more: the 60 s limit of docs/lessons/agents-and-tools.md.
vi.setConfig({ testTimeout: 60_000 });
const workers: Worker[] = [];
afterEach(async () => { await Promise.all(workers.splice(0).map(w => w.terminate())); });

// Control only the worker's clock and random source. All engine and search code runs unchanged.
async function controlled(setup: MatchSetup, random = [0.99], step = 0) {
  const clock = new Int32Array(new SharedArrayBuffer(4));
  const worker = new Worker(`
    const { workerData } = require('node:worker_threads');
    const clock = new Int32Array(workerData.clock);
    performance.now = () => Atomics.add(clock, 0, workerData.step);
    let index = 0;
    Math.random = () => workerData.random[index++ % workerData.random.length];
    import('tsx/esm/api').then(({ register }) => {
      register();
      return import(workerData.entry);
    });
  `, { eval: true, workerData: { entry: new URL('./worker.ts', import.meta.url).href, clock: clock.buffer, step, random } });
  workers.push(worker);
  let id = 0;
  async function call<T>(op: string, input?: unknown): Promise<T> {
    const response = once(worker, 'message', { signal: AbortSignal.timeout(50_000) });
    worker.postMessage({ id: ++id, op, input });
    const [reply] = await response;
    if (reply.error) throw new Error(reply.error);
    return reply.value;
  }
  await call('create', setup);
  return {
    snapshot: () => call<MatchSnapshot>('snapshot'),
    chooseMove: (options: ChooseMoveOptions) => call<string>('chooseMove', options),
    apply: async (lan: string) => {
      const { revision } = await call<MatchSnapshot>('snapshot');
      return call<MatchSnapshot>('apply', { id: `level-${revision}`, expectedRevision: revision, lan });
    },
    elapsed: () => Atomics.load(clock, 0) - step,
  };
}

const levels = [
  { level: 'beginner', cap: 700, band: 200, chance: 0.1 },
  { level: 'casual', cap: 800, band: 80, chance: 0.04 },
  { level: 'club', cap: 800, band: 15, chance: 0 },
  { level: 'strong', cap: 2500, band: 15, chance: 0 },
] as const;
const timeSetup = { fen: 'ragklmso/8/8/8/8/8/8/RAGKLMSO w - - 0 1', kings: 'Spirit:Mercy,Shadow:Darkness', hand: ['Freeze', 'Strike', 'Burn', 'Rally'] } satisfies MatchSetup;

it.each(levels)('$level uses its $cap ms cap in the worker search', async ({ level, cap }) => {
  const m = await controlled(timeSetup, [0.99], 10);
  const before = await m.snapshot();
  expect(before.legal).toContain(await m.chooseMove({ level, maxTimeMs: 5000 }));
  expect(m.elapsed()).toBeGreaterThanOrEqual(cap);
  expect(m.elapsed()).toBeLessThanOrEqual(cap + 10);
  expect(await m.snapshot()).toEqual(before);
});

it.each(levels)('$level lets the caller shorten its time cap', async ({ level }) => {
  const m = await controlled(timeSetup, [0.99], 10);
  expect((await m.snapshot()).legal).toContain(await m.chooseMove({ level, maxTimeMs: 200 }));
  expect(m.elapsed()).toBeGreaterThanOrEqual(200);
  expect(m.elapsed()).toBeLessThanOrEqual(210);
});

it.each(levels)('$level samples its $band point opening score band', async ({ level }) => {
  // At depth 1, h1 loses 37 points and d3 loses 155: these distinguish 15, 80 and 200.
  for (const [random, expected] of [
    [0, { beginner: 'Kg1-h1', casual: 'Kg1-h1', club: 'Kg1-g2', strong: 'Kg1-g2' }],
    [0.85, { beginner: 'd2-d3', casual: 'd2-d4', club: 'd2-d4', strong: 'd2-d4' }],
  ] as const) {
    const m = await controlled({ fen: '7k/8/8/8/4p3/8/3P4/6K1 w - - 0 1' }, [random, 0.99]);
    expect(await m.chooseMove({ level, maxDepth: 1 })).toBe(expected[level]);
  }
});

it.each(['club', 'strong'] as const)('%s uses a zero score band after six played moves', async level => {
  const m = await controlled({ fen: '7k/8/8/8/4p3/8/3P4/6K1 w - - 0 1' }, [0.99]);
  // Both kings return to their first squares. The 15-point band would choose d2-d4.
  for (const lan of ['Kg1-h1', 'Kh8-g8', 'Kh1-h2', 'Kg8-g7', 'Kh2-g1', 'Kg7-h8']) await m.apply(lan);
  expect(await m.chooseMove({ level, maxDepth: 1 })).toBe('Kg1-f2');
});

it.each(levels)('$level applies its $chance random-move chance at the boundary', async ({ level, chance }) => {
  // Taking the queen is the only move within even the widest band. A blunder chooses legal[0].
  const setup = { fen: '7k/8/8/8/8/8/q7/R5K1 w - - 0 1' };
  const below = await controlled(setup, [0.99, Math.max(0, chance - 0.0001), 0]);
  const legal = (await below.snapshot()).legal;
  expect(legal[0]).not.toBe('Ra1xa2');
  expect(await below.chooseMove({ level, maxDepth: 1 })).toBe(chance ? legal[0] : 'Ra1xa2');
  const at = await controlled(setup, [0.99, chance, 0]);
  expect(await at.chooseMove({ level, maxDepth: 1 })).toBe('Ra1xa2');
});
