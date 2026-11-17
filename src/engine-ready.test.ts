import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Engine, Game } from './game';
import { search, resetSearchState } from './ai/search';
import { setRules } from './rules/engine';
import { CLASSIC_CHESS, fromFen } from './rules/setup';

/** Stands in for a real Worker: it records what it was sent; the test sends its "ready" message or its error. */
class ReadyWorker extends EventTarget {
  static made: ReadyWorker[] = [];
  posted: unknown[] = [];
  terminated = false;
  onerror: ((event: Event) => void) | null = null;
  constructor() { super(); ReadyWorker.made.push(this); }
  postMessage(m: unknown): void { this.posted.push(m); }
  terminate(): void { this.terminated = true; }
  ready(): void { this.dispatchEvent(new MessageEvent('message', { data: { ready: true } })); }
  fail(): void { const event = new Event('error'); this.onerror?.(event); this.dispatchEvent(event); }
}

const withWorkers = async (fn: () => void | Promise<void>): Promise<void> => {
  const prev = (globalThis as Record<string, unknown>).Worker;
  (globalThis as Record<string, unknown>).Worker = ReadyWorker;
  ReadyWorker.made = [];
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try { await fn(); } finally { (globalThis as Record<string, unknown>).Worker = prev; vi.useRealTimers(); }
};

describe('Engine for the new page (decision 44)', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('the old engine (no option) still gives up the move time plus 2,500 ms after the request', () => withWorkers(() => {
    const engine = new Engine(), game = new Game(CLASSIC_CHESS);
    void engine.think(game, { timeMs: 800 });
    vi.advanceTimersByTime(800 + 2499);
    expect(ReadyWorker.made[0].terminated).toBe(false);
    vi.advanceTimersByTime(1);
    expect(ReadyWorker.made[0].terminated).toBe(true);
    expect((ReadyWorker.made[0].posted[0] as { opts: object }).opts).not.toHaveProperty('workClock');
  }));

  it('bounds a worker with no ready message from the request by the move time plus 8,000 ms', () => withWorkers(async () => {
    const engine = new Engine({ waitReady: true }), game = new Game(CLASSIC_CHESS);
    const answer = engine.think(game, { timeMs: 1 });
    const worker = ReadyWorker.made[0];
    vi.advanceTimersByTime(1 + 7999);
    expect(worker.terminated).toBe(false);
    vi.advanceTimersByTime(1); // no answer 8 s past the move time: the page thread searches
    expect(worker.terminated).toBe(true);
    expect((await answer).move).toBeTruthy();
  }));

  it('a late ready message does not extend the request deadline', () => withWorkers(async () => {
    const engine = new Engine({ waitReady: true }), game = new Game(CLASSIC_CHESS);
    const answer = engine.think(game, { timeMs: 1 });
    vi.advanceTimersByTime(7000); ReadyWorker.made[0].ready();
    vi.advanceTimersByTime(1001); expect(ReadyWorker.made[0].terminated).toBe(true);
    expect((await answer).move).toBeTruthy();
  }));

  it('starts the timer at the request when the worker was ready before it', () => withWorkers(() => {
    const engine = new Engine({ waitReady: true }), game = new Game(CLASSIC_CHESS);
    engine.prepare(game);
    ReadyWorker.made[0].ready();
    vi.advanceTimersByTime(30_000);
    void engine.think(game, { timeMs: 800 });
    vi.advanceTimersByTime(800 + 7999);
    expect(ReadyWorker.made[0].terminated).toBe(false);
    vi.advanceTimersByTime(1);
    expect(ReadyWorker.made[0].terminated).toBe(true);
  }));

  it('gives the search to the page thread at once when the worker fails before it is ready', () => withWorkers(async () => {
    const engine = new Engine({ waitReady: true }), game = new Game(CLASSIC_CHESS);
    const answer = engine.think(game, { timeMs: 1 });
    ReadyWorker.made[0].fail();
    expect(ReadyWorker.made[0].terminated).toBe(true);
    expect((await answer).move).toBeTruthy();
  }));

  it('prepare starts the worker of the game before its first search, and the search uses that worker', () => withWorkers(() => {
    const engine = new Engine({ waitReady: true }), game = new Game(CLASSIC_CHESS), next = new Game(CLASSIC_CHESS);
    engine.prepare(game);
    engine.prepare(game);
    expect(ReadyWorker.made).toHaveLength(1);
    expect(ReadyWorker.made[0].posted).toHaveLength(0);
    void engine.think(game, { timeMs: 800 });
    expect(ReadyWorker.made).toHaveLength(1);
    expect(ReadyWorker.made[0].posted).toHaveLength(1);
    engine.prepare(next); // another game: a new worker and search tables
    expect(ReadyWorker.made).toHaveLength(2);
    expect(ReadyWorker.made[0].terminated).toBe(true);
  }));

  it('sends workClock with each search when the option is on', () => withWorkers(() => {
    const engine = new Engine({ workClock: true }), game = new Game(CLASSIC_CHESS);
    void engine.think(game, { timeMs: 800 });
    expect((ReadyWorker.made[0].posted[0] as { opts: { workClock?: boolean } }).opts.workClock).toBe(true);
  }));

  it('does not report a worker that fails while the page unloads (WebKit on a reload); the old engine still reports it', () => withWorkers(() => {
    const page = new EventTarget(), reported: Event[] = [];
    vi.stubGlobal('window', page); vi.stubGlobal('addEventListener', page.addEventListener.bind(page));
    page.addEventListener('kingdown-worker-error', event => reported.push(event));
    const engine = new Engine({ waitReady: true }), old = new Engine();
    engine.prepare(new Game(CLASSIC_CHESS));
    ReadyWorker.made[0].fail();
    expect(reported).toHaveLength(1); // a worker that fails in play is reported
    engine.prepare(new Game(CLASSIC_CHESS));
    void old.think(new Game(CLASSIC_CHESS), { timeMs: 800 });
    page.dispatchEvent(new Event('beforeunload'));
    ReadyWorker.made[1].fail();
    expect(ReadyWorker.made[1].terminated).toBe(true);
    expect(reported).toHaveLength(1);
    ReadyWorker.made[2].fail();
    expect(reported).toHaveLength(2);
  }));
});

describe('the worker and the new page (decision 44)', () => {
  it('the worker sends its "ready" message when its code has loaded, before any search', async () => {
    vi.resetModules();
    const posted: unknown[] = [];
    vi.stubGlobal('self', { postMessage: (message: unknown) => posted.push(message), onmessage: null });
    try { await import('./ai/worker'); } finally { vi.unstubAllGlobals(); }
    expect(posted).toEqual([{ ready: true }]);
  });

  it('the engine of the new page waits for "ready" and reads the clock after long move lists', () => {
    expect(readFileSync('src/interface/play/main.ts', 'utf8')).toMatch(/new Engine\(\{ waitReady: true, workClock: true \}\)/);
  });

  it('the new page starts the engine worker when the board shows', () => {
    expect(readFileSync('src/interface/play/main.ts', 'utf8')).toMatch(/board\.ready\(\)[^]*\bengine\.prepare\(game\)/);
  });
});

describe('search option workClock (decision 44)', () => {
  // A beast next to the full back two ranks: 64,710 chain captures in one move list.
  const crowded = 'rnbqkbnr/pppppppp/S7/8/8/8/8/4K3 w - - 0 1';
  // The clock says "past the deadline" at each read after the start.
  const lateClock = () => { let reads = 0; return vi.spyOn(performance, 'now').mockImplementation(() => (reads++ === 0 ? 0 : 1e9)); };
  afterEach(() => { vi.restoreAllMocks(); setRules(); });

  it('reads the clock at the next node after a long move list', () => {
    setRules();
    resetSearchState();
    lateClock();
    const result = search(fromFen(crowded), { timeMs: 800, workClock: true });
    expect(result.nodes).toBeLessThan(128);
  });

  it('without the option, reads the clock each 128 nodes only (the old page and the tools)', () => {
    setRules();
    resetSearchState();
    lateClock();
    const result = search(fromFen(crowded), { timeMs: 800 });
    expect(result.nodes).toBe(128);
  });
});
