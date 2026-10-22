import { afterEach, expect, it, vi } from 'vitest';
import { Worker } from 'node:worker_threads';
import { LocalMatch, createMatch, type RuntimeSearch, type MatchSetup } from './index';

type Message = { id: number; op: string; input: RuntimeSearch };
type Internals = { worker: Worker; searchWorker?: Worker; call<T>(op: string, input?: unknown): Promise<T> };
const inner = (m: LocalMatch) => m as unknown as Internals;
const matches: LocalMatch[] = [];
const setup = { fen: '7k/8/8/8/8/8/8/R5K1 w - - 0 1' };
const options = { maxDepth: 1, maxTimeMs: 1000 };
afterEach(async () => { vi.useRealTimers(); vi.restoreAllMocks(); await Promise.all(matches.splice(0).map(m => m.close())); });
async function create(warm = false, input: MatchSetup = setup) {
  const m = await createMatch(input); matches.push(m);
  if (warm) await m.chooseMove(options);
  return m;
}
function hold(m: LocalMatch) {
  const worker = inner(m).searchWorker!;
  let sent!: (message: Message) => void;
  const captured = new Promise<Message>(resolve => { sent = resolve; });
  vi.spyOn(worker, 'postMessage').mockImplementation(message => { sent(message); });
  return { worker, captured };
}

it('starts one search worker lazily per match and preserves engine state between searches', async () => {
  const a = await create(), b = await create();
  expect(inner(a).searchWorker).toBeUndefined();
  expect(inner(b).searchWorker).toBeUndefined();
  const before = await a.snapshot(), saved = await a.exportSave();
  expect(before.legal).toContain(await a.chooseMove(options));
  const helper = inner(a).searchWorker!;
  expect(helper).toBeInstanceOf(Worker);
  expect(inner(b).searchWorker).toBeUndefined();
  await a.chooseMove(options);
  expect(inner(a).searchWorker).toBe(helper);
  expect(await a.snapshot()).toEqual(before);
  expect(await a.exportSave()).toBe(saved);
  await b.chooseMove(options);
  expect(inner(b).searchWorker).not.toBe(helper);
  await a.close();
  expect(helper.threadId).toBe(-1);
  expect((await b.snapshot()).legal).toContain(await b.chooseMove(options));
});

it('keeps interleaved presets on their own helper rules and search state', async () => {
  const fen = '7k/8/8/2p5/8/2A5/8/4K3 w - - 0 1';
  const a = await create(false, { fen, preset: 'current' }), b = await create(false, { fen, preset: '2017' });
  const beforeA = await a.snapshot(), beforeB = await b.snapshot();
  expect(beforeA.legal).not.toEqual(beforeB.legal);
  const first = await a.chooseMove(options);
  expect(beforeA.legal).toContain(first);
  expect(beforeB.legal).toContain(await b.chooseMove(options));
  expect(await a.chooseMove(options)).toBe(first);
  expect(await a.snapshot()).toEqual(beforeA);
  expect(await b.snapshot()).toEqual(beforeB);
});

it('keeps a released LAN-only archive on its original search path', async () => {
  const m = new LocalMatch(new URL('../../engines/2675a7e6e32d635615350089a490902f4842ae26a7866d7123c6d95b49c60c5b.mjs', import.meta.url));
  matches.push(m); await m.initialize({});
  const before = await m.snapshot(), saved = await m.exportSave();
  expect(before.legal).toContain(await m.chooseMove(options));
  expect(inner(m).searchWorker).toBeUndefined();
  expect(await m.snapshot()).toEqual(before);
  expect(await m.exportSave()).toBe(saved);
});

it('rejects a search result after the stored engine advances during the search', async () => {
  const m = await create(true), before = await m.snapshot(), held = hold(m);
  const selected = m.chooseMove(options), rejected = expect(selected).rejects.toThrow('Stale search revision');
  const message = await held.captured;
  await m.apply({ id: 'concurrent', expectedRevision: before.revision, lan: before.legal[0] });
  held.worker.emit('message', { id: message.id, value: message.input.legal[0] });
  await rejected;
  expect((await m.snapshot()).revision).toBe(before.revision + 1);
});

it('rejects an illegal helper answer without changing authoritative state', async () => {
  const m = await create(true), before = await m.exportSave(), held = hold(m);
  const selected = m.chooseMove(options), rejected = expect(selected).rejects.toThrow('illegal or ambiguous');
  const message = await held.captured;
  held.worker.emit('message', { id: message.id, value: 'not-a-legal-LAN' });
  await rejected;
  expect(await m.exportSave()).toBe(before);
});

it('ignores a reply delivered by the wrong worker even when its pending ID matches', async () => {
  const m = await create(true), held = hold(m);
  let answered = false;
  const selected = m.chooseMove(options).then(lan => { answered = true; return lan; });
  const message = await held.captured, lan = message.input.legal[0];
  inner(m).worker.emit('message', { id: message.id, value: lan });
  await Promise.resolve();
  expect(answered).toBe(false);
  held.worker.emit('message', { id: message.id, value: lan });
  expect(await selected).toBe(lan);
});

it.each([
  { kind: 'unknown' }, { engine: 'caller-version' }, { revision: -1 }, { ply: 1001 },
  { pos: { board: new Uint8Array(63), turn: 0, ply: 0, halfmove: 0 } },
  { rules: {} }, { history: [1] }, { legal: ['x'.repeat(1025)] }, { options: { maxTimeMs: 5001 } }, { extra: true },
])('rejects malformed tagged contexts without starting a helper: %j', async patch => {
  const m = await create(), state = inner(m), context = await state.call<RuntimeSearch>('chooseMove', options);
  vi.spyOn(state.worker, 'postMessage').mockImplementation(message => {
    state.worker.emit('message', { id: message.id, value: { ...context, ...patch } });
  });
  await expect(m.chooseMove(options)).rejects.toThrow('Malformed runtime search context');
  expect(state.searchWorker).toBeUndefined();
});

it('terminates both workers and rejects pending search on close', async () => {
  const m = await create(true), held = hold(m);
  const selected = m.chooseMove(options), rejected = expect(selected).rejects.toThrow('closed');
  await held.captured;
  await m.close(); await rejected;
  expect(held.worker.threadId).toBe(-1);
  expect(inner(m).worker.threadId).toBe(-1);
  await expect(m.chooseMove(options)).rejects.toThrow('closed');
});

it('closes the match when its search worker exits unexpectedly', async () => {
  const m = await create(true), held = hold(m);
  const selected = m.chooseMove(options), rejected = expect(selected).rejects.toThrow('Search worker exited');
  await held.captured;
  await held.worker.terminate(); await rejected;
  await expect(m.snapshot()).rejects.toThrow('closed');
});

it('uses one total deadline across context and helper requests', async () => {
  const m = await create(true), state = inner(m), context = await state.call<RuntimeSearch>('chooseMove', options), held = hold(m);
  let sent!: (id: number) => void;
  const requested = new Promise<number>(resolve => { sent = resolve; });
  vi.spyOn(state.worker, 'postMessage').mockImplementation(message => { sent(message.id); });
  const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const selected = m.chooseMove(options), rejected = expect(selected).rejects.toThrow('timed out');
  const id = await requested;
  vi.advanceTimersByTime(5000); clock.mockReturnValue(6000);
  state.worker.emit('message', { id, value: context });
  await held.captured;
  vi.advanceTimersByTime(9999);
  expect(held.worker.threadId).not.toBe(-1);
  vi.advanceTimersByTime(1);
  await rejected;
  await expect(m.snapshot()).rejects.toThrow('closed');
});
