// U04 experiment only. No production caller can use this candidate scope.
import { afterEach, describe, expect, it } from 'vitest';
import type { Worker } from 'node:worker_threads';
import { writeFileSync } from 'node:fs';
import { Game } from '../src/game';
import { DEFAULT_RULES, POWERS_BALANCED, RULES, RULES_2017, parseKings, setRules, type Rules } from '../src/rules/rules';
import { legalMoves } from '../src/rules/engine';
import { fromFen, startPosition, toFen, toLan } from '../src/rules/setup';
import { positionKey, resetSearchState, searchLegal } from '../src/ai/search';
import { setDesignValue, VALUES } from '../src/ai/eval';
import { draftTurn, applyLan } from '../src/plugin/screens/board-model';
import { withRules } from '../src/workshop/powers';
import { PRESETS, specOf } from '../src/workshop/model';
import { tsWorker } from '../src/sim/ts-worker';
import { CARD_CASES, ORDINARY_CASES } from './fixtures/engine-continuation';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const definition = (over: Partial<Rules> = {}): Rules => freeze(structuredClone({ ...DEFAULT_RULES, ...over }));

// A private scope must surround every helper and must never accept a product callback.
function scoped<T>(rules: Rules, fn: () => T): T {
  if (fn.constructor.name === 'AsyncFunction') throw new Error('Synchronous scope only');
  const previous = structuredClone(RULES);
  try {
    setRules(rules);
    setDesignValue(rules.design);
    const result = fn();
    if (result && typeof (result as { then?: unknown }).then === 'function') throw new Error('Synchronous scope only');
    return result;
  } finally {
    Object.assign(RULES, previous);
    setDesignValue(previous.design);
  }
}

function owned(rules: Rules, fen: string) {
  const config = definition(rules);
  const game = scoped(config, () => { const g = new Game(); g.load(fromFen(fen)); return g; });
  return {
    config,
    view: () => scoped(config, () => ({ fen: toFen(game.pos), status: game.status, check: game.inCheck,
      legal: game.legal.map(m => toLan(game.pos, m)).sort(), draft: draftTurn([], game.pos, 'link', game.pos.turn),
      searchLegal: searchLegal(game.pos).map(m => toLan(game.pos, m)).sort(), key: positionKey(game.pos) })),
    play: (lan: string) => scoped(config, () => game.playLan([lan])),
    undo: () => scoped(config, () => game.undo()),
    preview: (lan: string) => scoped(config, () => applyLan(game.pos, lan, config)),
    setup: () => scoped(config, () => toFen(startPosition('RNBQKBNR'))),
  };
}

const workers: Worker[] = [];
afterEach(async () => {
  await Promise.all(workers.splice(0).map(w => w.terminate()));
  setRules(structuredClone(DEFAULT_RULES)); setDesignValue(null); resetSearchState();
});

describe('U04 rule ownership experiment', () => {
  it('pins the present Game interleaving hazard without changing production behavior', () => {
    const fen = '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1';
    setRules();
    const a = new Game(); a.load(fromFen(fen));
    const current = a.legal.map(m => toLan(a.pos, m));
    setRules(RULES_2017);
    const b = new Game(); b.load(fromFen(fen));
    expect(b.legal.map(m => toLan(b.pos, m))).not.toEqual(current);
    expect(a.legal.map(m => toLan(a.pos, m))).toEqual(current); // cached under the first rules
    expect(legalMoves(a.pos).map(m => toLan(a.pos, m))).not.toEqual(current);
    expect(a.playLan(['Ac3-b2'])).toBe(1); // cached move still accepted by Game
    a.undo(); // invalidates the cache under the second game's rules
    expect(a.legal.map(m => toLan(a.pos, m))).not.toEqual(current);
  });

  it('pins shallow Workshop aliasing, while validation and callback throws restore fields', () => {
    setRules(structuredClone(DEFAULT_RULES));
    const before = structuredClone(RULES);
    expect(() => withRules({ hands: [['Haste'], []], kings: [{ king: 'Flame', power: 'Haste' }, null] }, () => 0)).toThrow('hand');
    expect(RULES).toEqual(before);
    expect(() => withRules({ freezeUses: 5 }, () => { throw new Error('callback'); })).toThrow('callback');
    expect(RULES).toEqual(before);
    withRules({ hands: RULES.hands }, () => (RULES.hands[0] as string[]).push('Haste'));
    expect(RULES.hands[0]).toEqual(['Haste']);
  });

  it('uses deep immutable definitions and restores after nested scopes and both exception paths', () => {
    const input: Partial<Rules> = { hands: [['Freeze'], []], fromMove: { Freeze: 3 } };
    const a = definition(input), b = definition({ freezeUses: 5, design: specOf(PRESETS.find(p => p.key === 'rook')!) });
    (input.hands![0] as string[]).push('Haste');
    expect(a.hands[0]).toEqual(['Freeze']);
    expect(() => (a.fromMove as { Freeze: number }).Freeze = 1).toThrow();
    const before = structuredClone(RULES), values = { ...VALUES };
    scoped(a, () => {
      expect(RULES.hands[0]).toEqual(['Freeze']);
      expect(() => scoped(b, () => { expect(VALUES).not.toEqual(values); throw new Error('nested'); })).toThrow('nested');
      expect(RULES).toEqual(a);
      expect(VALUES).toEqual(values);
      expect(() => scoped(definition({ hands: [['Haste'], []], kings: [{ king: 'Flame', power: 'Haste' }, null] }), () => 0)).toThrow('hand');
      expect(RULES).toEqual(a);
    });
    expect(RULES).toEqual(before);
    expect(VALUES).toEqual(values);
  });

  it('rejects async functions before entry and returned thenables before the scope returns', () => {
    let called = false;
    expect(() => scoped(definition(), async () => { called = true; })).toThrow('Synchronous');
    expect(called).toBe(false);
    const before = structuredClone(RULES);
    expect(() => scoped(definition({ freezeUses: 6 }), () => Promise.resolve())).toThrow('Synchronous');
    expect(RULES).toEqual(before);
    // A private caller boundary is still required: arbitrary callbacks can schedule a later task.
  });

  it.each([...ORDINARY_CASES, ...CARD_CASES])('alternates and independently replays existing corpus: $name', row => {
    const config = definition({ ...(row.setup.kings ? POWERS_BALANCED : {}), kings: row.setup.kings ? parseKings(row.setup.kings) : [null, null],
      hands: [row.setup.hand ?? [], row.setup.hand ?? []] });
    const fen = row.setup.fen ?? scoped(config, () => toFen(startPosition('RNBQKBNR')));
    const a = owned(config, fen), replay = owned(config, fen);
    const b = owned(definition(RULES_2017), '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1');
    for (const lan of row.actions) {
      const before = a.view();
      expect(a.preview(lan)).toBeDefined();
      expect(a.view()).toEqual(before);
      b.view(); b.setup();
      expect(a.play(lan)).toBe(1);
      expect(replay.play(lan)).toBe(1);
      expect(a.view()).toEqual(replay.view());
      const continued = a.view();
      expect(a.undo()).toBe(true);
      expect(a.view()).toEqual(before);
      expect(a.play(lan)).toBe(1);
      expect(a.view()).toEqual(continued);
    }
    if (row.status) expect(a.view().status).toBe(row.status);
  });
});

interface Probe { move: string | null; score: number; depth: number; nodes: number; key: number; ms: number }
function worker() { const w = tsWorker(new URL('./fixtures/rule-isolation-worker.ts', import.meta.url)); workers.push(w); return w; }
function probe(w: Worker, rules: Rules, fen: string, reset: boolean): Promise<Probe> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('Search probe timeout')); }, 10000);
    const cleanup = () => { clearTimeout(timer); w.off('message', done); w.off('error', failed); };
    const done = (result: Probe) => { cleanup(); resolve(result); };
    const failed = (error: Error) => { cleanup(); reject(error); };
    w.once('message', done); w.once('error', failed); w.postMessage({ rules, fen, reset });
  });
}

it.each([
  ['archer tactics', '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1'],
  ['full fairy army', toFen(startPosition('RALSKMOG'))],
])('compares fixed-depth alternating searches with fresh workers: %s', async (name, fen) => {
  const configs = [definition(), definition(RULES_2017)];
  const fresh: Probe[] = [];
  for (const config of configs) { const w = worker(); fresh.push(await probe(w, config, fen, false)); await w.terminate(); }
  // The same position has the same table key under incompatible rules.
  expect(fresh[0].key).toBe(fresh[1].key);
  const w = worker(), warm: Probe[] = [], switched: Probe[] = [];
  for (const index of [0, 1, 0, 1]) warm.push(await probe(w, configs[index], fen, false));
  for (const index of [0, 1, 0, 1]) switched.push(await probe(w, configs[index], fen, true));
  const stable = ({ ms: _ms, ...result }: Probe) => result;
  expect(switched.map(stable)).toEqual([fresh[0], fresh[1], fresh[0], fresh[1]].map(stable));
  if (name === 'full fairy army') {
    expect({ move: warm[1].move, score: warm[1].score }).not.toEqual({ move: fresh[1].move, score: fresh[1].score });
    expect(warm[1].nodes).toBeLessThan(fresh[1].nodes);
  }
  // Warm state inside one game is deliberate. Do not make a browser-turn reset the fix.
  const same = await probe(w, configs[1], fen, false);
  expect(same.move).toBe(fresh[1].move);
  const report = { name, runtime: process.version, budget: { maxDepth: 3, timeMs: null }, fresh, warm, switched, same };
  if (process.env.KINGDOWN_ISOLATION_REPORT) writeFileSync(`${process.env.KINGDOWN_ISOLATION_REPORT}.${name.replaceAll(' ', '-')}.json`, JSON.stringify(report, null, 2));
}, 30000);
