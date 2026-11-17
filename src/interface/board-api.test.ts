import { beforeEach, expect, it, vi, type Mock } from 'vitest';
import { GameRules } from '../game-rules';
/** The mock view's parts that the tests read. */
interface MockView { options: Record<string, unknown>; onSquareClick(square: number): void; sync: Mock; setSelected: Mock; highlight: Mock; setReducedMotion: Mock; setPace: Mock; setPlainMarks: Mock; dispose: Mock; animateMove: Mock; skip: Mock }
const mock = vi.hoisted(() => ({ view: null as unknown as MockView, end: () => {}, deferred: false }));
vi.mock('../render/sfx', () => ({ snd: Object.fromEntries(['move','capture','shot','shove','chain','swap','check'].map(k => [k, vi.fn()])) }));
vi.mock('../render/PaintedView', () => ({ PaintedView: class {
  onSquareClick = () => {}; onSkipAnimation = () => {}; canDrag = () => false; animating = false;
  constructor(_element: unknown, readonly options: Record<string, unknown>) { mock.view = this as unknown as MockView; }
  setPlainMarks = vi.fn(); setSelected = vi.fn(); sync = vi.fn(); highlight = vi.fn(); setFallen = vi.fn(); setRules = vi.fn();
  setReducedMotion = vi.fn(); setPace = vi.fn(); dispose = vi.fn(); ready = () => Promise.resolve();
  animateMove = vi.fn(() => mock.deferred ? new Promise<void>(r => { mock.end = r; }) : Promise.resolve());
  skip = vi.fn(() => mock.end());
  flip = vi.fn();
} }));
import { mountBoard } from './board-api';
/** The position of the last sync. */
const synced = () => mock.view.sync.mock.lastCall![0];
beforeEach(() => { mock.deferred = false; mock.end = () => {}; vi.stubGlobal('requestAnimationFrame', (fn: () => void) => queueMicrotask(fn)); });
const rules = new GameRules(), pos = () => rules.fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1');
const element = () => ({ replaceChildren: vi.fn() }) as unknown as HTMLElement;
it('plays a real move, keeps caller state detached, and resolves with the final board', async () => {
  const board = mountBoard(element()), p = pos(); board.setPosition(p, rules); p.board[8] = 0;
  await board.play({ from: 8, to: 16, captures: [] });
  expect(synced().board[16]).toBe(1);
  expect(p.board[16]).toBe(0);
});
it('settles a skipped action at its final position', async () => {
  const board = mountBoard(element()); board.setPosition(pos(), rules); mock.deferred = true;
  const playing = board.play({ from: 8, to: 16, captures: [] }); board.skip();
  expect((await playing).skipped).toBe(true); expect(synced().board[16]).toBe(1);
});
it('does not overwrite a new position when old playback ends', async () => {
  const board = mountBoard(element()); board.setPosition(pos(), rules); mock.deferred = true;
  const playing = board.play({ from: 8, to: 16, captures: [] }), next = pos(); next.board[9] = 1;
  board.setPosition(next); await playing;
  expect(synced().board[9]).toBe(1);
});
it('rejects concurrent playback and ignores square input while it plays', async () => {
  const tap = vi.fn(), board = mountBoard(element(), tap); board.setPosition(pos(), rules); mock.deferred = true;
  const playing = board.play({ from: 8, to: 16, captures: [] }); mock.view.onSquareClick(8);
  await expect(board.play({ from: 8, to: 16, captures: [] })).rejects.toThrow('already'); expect(tap).not.toHaveBeenCalled();
  board.skip(); await playing; mock.view.onSquareClick(16); expect(tap).toHaveBeenCalledWith(16);
});
it('sets and clears marks and says when the rules give them no drawing', () => {
  const board = mountBoard(element()); board.setPosition(pos(), rules);
  expect(board.showEffect('frozen', 8, 2)).toBe(false); expect(synced().marks[1]).toEqual({ sq: 8, left: 2, ward: false });
  board.clearEffect(); expect(synced().marks).toBeUndefined();
  expect(() => board.showEffect('frozen', 15)).toThrow();
  const frost = new GameRules({ kings: [{ king: 'Frost', power: 'IceWall' }, { king: 'Frost', power: 'Freeze' }] });
  board.setPosition(frost.fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1'), frost);
  expect(board.showEffect('frozen', 8)).toBe(true); expect(board.showEffect('protected', 8)).toBe(true);
});
it('shows a reserve drop without calling the scene on an empty square', async () => {
  const board = mountBoard(element()), before = pos(), after = pos(); after.board[9] = 1;
  board.setPosition(before, rules); await board.play({ from: 9, to: 9, captures: [], drop: 1 }, after);
  expect(mock.view.animateMove).not.toHaveBeenCalled(); expect(synced().board[9]).toBe(1);
});
it('builds the view with holdStills and lazySheets', () => {
  mountBoard(element(), undefined, { liveInput: true, quiet: true });
  expect(mock.view.options).toMatchObject({ holdStills: true, lazySheets: true, liveInput: true });
});
it('passes the selection to the view with no marks', () => {
  const board = mountBoard(element()); board.select(8, [16], []);
  expect(mock.view.setSelected).toHaveBeenCalledWith(8, [16], []); expect(mock.view.highlight).not.toHaveBeenCalled();
});
it('passes motion settings and disposes the view', () => {
  const el = element(), board = mountBoard(el); board.setMotion('fast', true);
  expect(mock.view.setReducedMotion).toHaveBeenCalledWith(true); expect(mock.view.setPace).toHaveBeenCalledWith('fast');
  board.dispose(); expect(mock.view.dispose).toHaveBeenCalledOnce(); expect(el.replaceChildren).toHaveBeenCalledOnce();
});

it('keeps a host frost mark until the host clears it', async () => {
  const board = mountBoard(element()); board.setPosition(pos(), rules); board.showEffect('frozen', 8);
  await board.play({ from: 0, to: 1, captures: [] });
  expect(synced().marks[1]).toEqual({ sq: 8, left: 1, ward: false });
  board.clearEffect(8); expect(synced().marks).toBeUndefined();
});

it('finishes live playback synchronously and applies the same square tap', async () => {
  const tap = vi.fn(), board = mountBoard(element(), tap, { liveInput: true });
  board.setPosition(pos(), rules); mock.deferred = true;
  const playing = board.play({ from: 8, to: 16, captures: [] });
  mock.view.onSquareClick(16);
  expect(tap).toHaveBeenCalledWith(16); expect(synced().board[16]).toBe(1);
  const next = pos(); next.board[9] = 1; board.setPosition(next); await playing;
  expect(synced().board[9]).toBe(1);
});

it('keeps the state effects when live playback skips', () => {
  const board = mountBoard(element(), undefined, { liveInput: true }); board.setPosition(pos(), rules);
  mock.view.skip.mockClear(); board.skip(); expect(mock.view.skip).toHaveBeenCalledWith({ keepStates: true });
});

it('Plain marks need the named option; the old default cannot draw them', () => {
  const marks = { rings: [], paths: [], steps: [] };
  mountBoard(element()).mark(marks); expect(mock.view.setPlainMarks).not.toHaveBeenCalled();
  const board = mountBoard(element(), undefined, { plainMarks: true }); board.mark(marks);
  expect(mock.view.options.plainMarks).toBe(true); expect(mock.view.setPlainMarks).toHaveBeenCalledWith(marks);
});
it.each([['normal', false, 900], ['fast', false, 450], ['off', false, 0], ['normal', true, 0]] as const)('Plain playback at %s, reduced %s, holds for %i ms', async (pace, reduced, duration) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  try {
    const board = mountBoard(element(), undefined, { plainMarks: true }); board.setPosition(pos(), rules); board.setMotion(pace, reduced);
    let done = false; const playing = board.play({ from: 8, to: 16, captures: [] }).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(Math.max(0, duration - 1));
    if (duration) expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await playing; expect(done).toBe(true);
  } finally { vi.useRealTimers(); }
});
it('skipping a Plain hold releases playback and a new position stays safe', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  try {
    const board = mountBoard(element(), undefined, { plainMarks: true }); board.setPosition(pos(), rules);
    const playing = board.play({ from: 8, to: 16, captures: [] }); await vi.advanceTimersByTimeAsync(50); board.skip();
    expect((await playing).skipped).toBe(true);
    const next = pos(); next.board[9] = 1; board.setPosition(next); expect(synced().board[9]).toBe(1);
  } finally { vi.useRealTimers(); }
});
it('flip forwards both orientations without a new position or new marks', () => {
  const board = mountBoard(element()), p = pos(); board.setPosition(p, rules); const syncs = mock.view.sync.mock.calls.length;
  board.flip(true); board.flip(false);
  const view = mock.view as unknown as { flip: Mock };
  expect(view.flip.mock.calls).toEqual([[true], [false]]);
  expect(mock.view.sync.mock.calls.length).toBe(syncs); expect(mock.view.setPlainMarks).not.toHaveBeenCalled();
});
it('passes the art error callback only when the caller names it', () => {
  mountBoard(element()); expect(mock.view.options.onArtError).toBeUndefined();
  const onArtError = vi.fn(); mountBoard(element(), undefined, { onArtError }); expect(mock.view.options.onArtError).toBe(onArtError);
});
