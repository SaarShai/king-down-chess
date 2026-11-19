import { beforeEach, expect, it, vi, type Mock } from 'vitest';
import { GameRules } from '../game-rules';
import { parseKings } from '../rules/rules';
/** The mock view's parts that the tests read. */
interface MockView { options: Record<string, unknown>; onSquareClick(square: number): void; onSkipAnimation(): void; sync: Mock; setSelected: Mock; highlight: Mock; setReducedMotion: Mock; setPace: Mock; setPlainMarks: Mock; dispose: Mock; animateMove: Mock; skip: Mock }
const mock = vi.hoisted(() => ({ view: null as unknown as MockView, end: () => {}, start: () => {}, deferred: false, waiting: false, stop: vi.fn(), finish: vi.fn(), done: new Promise<void>(() => {}) }));
vi.mock('../render/sfx', async importOriginal => ({ ...await importOriginal<typeof import('../render/sfx')>(), snd: Object.fromEntries(['move','capture','shot','shove','chain','swap','check'].map(k => [k, vi.fn()])), playArmour: vi.fn(() => ({ cancel: mock.stop, finish: mock.finish, done: mock.done })), stopSelection: vi.fn() }));
vi.mock('../render/PaintedView', () => ({ PaintedView: class {
  onSquareClick = () => {}; onSkipAnimation = () => {}; canDrag = () => false; animating = false;
  constructor(_element: unknown, readonly options: Record<string, unknown>) { mock.view = this as unknown as MockView; }
  setPlainMarks = vi.fn(); setSelected = vi.fn(); sync = vi.fn(); highlight = vi.fn(); setFallen = vi.fn(); setRules = vi.fn();
  setReducedMotion = vi.fn(); setPace = vi.fn(); setSymbols = vi.fn(); dispose = vi.fn(); ready = () => Promise.resolve();
  animateMove = vi.fn((_pos, _move, _contact, _speed, onStart?: () => void) => {
    mock.start = () => onStart?.(); if (!mock.waiting) mock.start();
    return mock.deferred ? new Promise<void>(r => { mock.end = r; }) : Promise.resolve();
  });
  skip = vi.fn(() => mock.end());
  flip = vi.fn();
} }));
import { mountBoard } from './board-api';
import { playArmour, snd, stopSelection } from '../render/sfx';
/** The position of the last sync. */
const synced = () => mock.view.sync.mock.lastCall![0];
beforeEach(() => { vi.clearAllMocks(); mock.deferred = false; mock.waiting = false; mock.end = () => {}; mock.start = () => {}; vi.stubGlobal('requestAnimationFrame', (fn: () => void) => queueMicrotask(fn)); });
const rules = new GameRules(), pos = () => rules.fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1');
const element = () => ({ replaceChildren: vi.fn() }) as unknown as HTMLElement;
it('plays both Knight variations at launch and contact, and keeps capture sound', async () => {
  const board = mountBoard(element()), p = rules.fromFen('7k/8/8/8/8/2p5/8/KN6 w - - 0 1');
  board.setPosition(p, rules);
  await board.play({ from: 1, to: 18, captures: [18] });
  expect(playArmour).toHaveBeenNthCalledWith(1, 'knightLeapA');
  expect(playArmour).toHaveBeenNthCalledWith(2, 'knightLandA');
  expect(snd.capture).toHaveBeenCalledOnce(); expect(snd.move).not.toHaveBeenCalled();
  board.setPosition(p, rules); await board.play({ from: 1, to: 16, captures: [] });
  expect(playArmour).toHaveBeenNthCalledWith(3, 'knightLeapB');
  expect(playArmour).toHaveBeenNthCalledWith(4, 'knightLandB');
});
it('does not play Knight sounds on a pass or on a lab board', async () => {
  const p = rules.fromFen('7k/8/8/8/8/8/8/KN6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules);
  await board.play({ from: 1, to: 1, captures: [], pass: true }, p);
  const lab = mountBoard(element(), undefined, { armourSounds: false }); lab.setPosition(p, rules);
  await lab.play({ from: 1, to: 16, captures: [] });
  expect(playArmour).not.toHaveBeenCalled(); expect(snd.move).toHaveBeenCalled();
});
it('alternates Pawn walks, keeps capture sound, and skips passes and lab boards', async () => {
  const p = rules.fromFen('7k/8/8/8/8/1p6/P7/K7 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules);
  await board.play({ from: 8, to: 16, captures: [] });
  board.setPosition(p, rules); await board.play({ from: 8, to: 17, captures: [17] });
  expect(playArmour).toHaveBeenNthCalledWith(1, 'pawnWalkA');
  expect(playArmour).toHaveBeenNthCalledWith(2, 'pawnWalkB');
  expect(snd.move).not.toHaveBeenCalled(); expect(snd.capture).toHaveBeenCalledOnce();
  board.setPosition(p, rules); await board.play({ from: 8, to: 8, captures: [], pass: true }, p);
  const lab = mountBoard(element(), undefined, { armourSounds: false }); lab.setPosition(p, rules);
  await lab.play({ from: 8, to: 16, captures: [] });
  expect(playArmour).toHaveBeenCalledTimes(2);
});
it('plays the Bishop movement sound and keeps capture contact', async () => {
  const p = rules.fromFen('7k/8/8/8/8/2p5/8/KB6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules);
  await board.play({ from: 1, to: 18, captures: [18] });
  expect(playArmour).toHaveBeenCalledWith('bishopMove'); expect(snd.capture).toHaveBeenCalledOnce();
  board.setPosition(p, rules); await board.play({ from: 1, to: 1, captures: [], pass: true }, p);
  expect(playArmour).toHaveBeenCalledTimes(1);
});
it('stops the Bishop movement sound on skip', async () => {
  const p = rules.fromFen('7k/8/8/8/8/8/8/KB6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules); mock.deferred = true;
  const playing = board.play({ from: 1, to: 10, captures: [] });
  expect(playArmour).toHaveBeenCalledWith('bishopMove'); board.skip();
  expect(mock.stop).toHaveBeenCalled(); await playing;
});
it('lets the current Rook recording finish after the move, before the board hold', async () => {
  const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules); mock.deferred = true;
  const playing = board.play({ from: 1, to: 9, captures: [] });
  expect(playArmour).toHaveBeenCalledWith('rookMove', true); expect(mock.stop).not.toHaveBeenCalled();
  mock.end(); await playing; expect(mock.finish).toHaveBeenCalledOnce(); expect(mock.stop).not.toHaveBeenCalled(); expect(snd.move).not.toHaveBeenCalled();
});
it.each(['skip', 'position', 'motion', 'symbols', 'dispose', 'view-skip'] as const)('stops the Rook loop immediately on %s', async action => {
  const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules); mock.deferred = true;
  const playing = board.play({ from: 1, to: 9, captures: [] });
  if (action === 'skip') board.skip();
  if (action === 'position') board.setPosition(p, rules);
  if (action === 'motion') board.setMotion('off');
  if (action === 'symbols') board.setSymbols(() => ({} as HTMLImageElement));
  if (action === 'dispose') board.dispose();
  if (action === 'view-skip') mock.view.onSkipAnimation();
  expect(mock.stop).toHaveBeenCalled(); mock.end(); await playing;
});
it('stops a Rook loop when the page is hidden', async () => {
  let hide = () => {};
  const page = { hidden: false, addEventListener: (_: string, fn: () => void) => { hide = fn; }, removeEventListener: vi.fn() };
  vi.stubGlobal('document', page);
  try {
    const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
    const board = mountBoard(element()); board.setPosition(p, rules); mock.deferred = true;
    const playing = board.play({ from: 1, to: 9, captures: [] });
    page.hidden = true; hide(); expect(mock.stop).toHaveBeenCalled();
    mock.end(); await playing;
    vi.mocked(playArmour).mockClear(); board.setPosition(p, rules); mock.deferred = false;
    await board.play({ from: 1, to: 9, captures: [] }); expect(playArmour).not.toHaveBeenCalled();
    board.dispose(); expect(page.removeEventListener).toHaveBeenCalledWith('visibilitychange', hide);
  } finally { vi.unstubAllGlobals(); }
});
it('stops a no-motion sound on hide and dispose even after the move ends', async () => {
  let hide = () => {};
  const page = { hidden: false, addEventListener: (_: string, fn: () => void) => { hide = fn; }, removeEventListener: vi.fn() };
  vi.stubGlobal('document', page);
  try {
    const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
    const board = mountBoard(element()); board.setPosition(p, rules); board.setMotion('off');
    await board.play({ from: 1, to: 9, captures: [] }); expect(mock.stop).not.toHaveBeenCalled();
    page.hidden = true; hide(); expect(mock.stop).toHaveBeenCalledOnce();
    page.hidden = false; board.setPosition(p, rules); board.setSymbols(() => ({} as HTMLImageElement));
    await board.play({ from: 1, to: 9, captures: [] }); mock.stop.mockClear();
    board.dispose(); expect(mock.stop).toHaveBeenCalledOnce();
  } finally { vi.unstubAllGlobals(); }
});
it('plays the Rook sound once with motion off or symbols, and excludes the lab board', async () => {
  const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules); board.setMotion('off');
  await board.play({ from: 1, to: 9, captures: [] });
  board.setMotion('normal'); board.setPosition(p, rules); board.setSymbols(() => ({} as HTMLImageElement));
  await board.play({ from: 1, to: 9, captures: [] });
  const lab = mountBoard(element(), undefined, { armourSounds: false }); lab.setPosition(p, rules);
  await lab.play({ from: 1, to: 9, captures: [] });
  expect(playArmour).toHaveBeenCalledTimes(2); expect(playArmour).toHaveBeenCalledWith('rookMove');
  expect(snd.move).toHaveBeenCalledOnce();
});
it('waits for movement preparation and does not start a cancelled Rook sound', async () => {
  const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, rules); mock.deferred = true; mock.waiting = true;
  const playing = board.play({ from: 1, to: 9, captures: [] });
  expect(playArmour).not.toHaveBeenCalled(); mock.start();
  expect(playArmour).toHaveBeenCalledWith('rookMove', true); board.skip(); await playing;
  board.setPosition(p, rules); const cancelled = board.play({ from: 1, to: 9, captures: [] });
  board.skip(); mock.start(); await cancelled; expect(playArmour).toHaveBeenCalledTimes(1);
});
it.each([
  ['Flame:Haste', 'flameKingMove'], ['Frost:Freeze', 'frostKingMove'],
  ['Stratus:Flight', 'stratusKingMove'], ['Mud:March', 'mudKingMove'],
  ['Spirit:HolyLight', 'spiritKingMove'], ['Shadow:Darkness', 'shadowKingMove'],
] as const)('uses the moving king’s %s design for its sound', async (choice, sound) => {
  const context = new GameRules({ kings: parseKings(`${choice},none`) });
  const p = context.fromFen('7k/8/8/8/8/8/8/4K3 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, context);
  await board.play({ from: 4, to: 12, captures: [] }, p);
  expect(playArmour).toHaveBeenCalledWith(sound, true); expect(mock.finish).toHaveBeenCalledOnce();
});
it('uses each unpowered king’s visual design and the moving piece’s color', async () => {
  const context = new GameRules(), p = context.fromFen('7k/8/8/8/8/8/8/4K3 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, context);
  await board.play({ from: 4, to: 12, captures: [] }, p);
  board.setPosition(p, context); await board.play({ from: 63, to: 55, captures: [] }, p);
  expect(playArmour).toHaveBeenNthCalledWith(1, 'spiritKingMove', true);
  expect(playArmour).toHaveBeenNthCalledWith(2, 'shadowKingMove', true);
  const changed = new GameRules({ kings: parseKings('none,Frost:Freeze') });
  board.setPosition(p, changed); await board.play({ from: 63, to: 55, captures: [] }, p);
  expect(playArmour).toHaveBeenNthCalledWith(3, 'frostKingMove', true);
});
it('plays Maester travel with the swap sound and Guard/Ogre travel with the shove sound', async () => {
  const context = new GameRules();
  const maester = context.fromFen('7k/8/8/8/8/8/P7/KM6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(maester, context);
  await board.play({ from: 1, to: 8, captures: [], swap: true }, maester);
  expect(playArmour).toHaveBeenCalledWith('maesterMove', true); expect(snd.swap).toHaveBeenCalledOnce();
  const guard = context.fromFen('7k/8/8/8/8/8/p7/KG6 w - - 0 1');
  board.setPosition(guard, context); await board.play({ from: 1, to: 8, captures: [], shove: { from: 8, to: 16 } }, guard);
  expect(playArmour).toHaveBeenCalledWith('guardMove', true); expect(snd.shove).toHaveBeenCalledOnce();
  const ogre = context.fromFen('7k/8/8/8/8/8/p7/KO6 w - - 0 1');
  board.setPosition(ogre, context); await board.play({ from: 1, to: 8, captures: [], shove: { from: 8, to: 16 } }, ogre);
  expect(playArmour).toHaveBeenCalledWith('ogreMove', true); expect(snd.shove).toHaveBeenCalledTimes(2);
});
it('keeps the Strike launch with a moving Guard and excludes stationary powers', async () => {
  const context = new GameRules(), p = context.fromFen('7k/8/8/8/8/8/8/KG6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(p, context);
  await board.play({ from: 1, to: 9, captures: [], power: 'strike' }, p);
  expect(playArmour).toHaveBeenCalledWith('guardMove', true); expect(snd.shot).toHaveBeenCalledOnce();
  board.setPosition(p, context); await board.play({ from: 1, to: 1, captures: [], power: 'freeze' }, p);
  expect(playArmour).toHaveBeenCalledTimes(1);
});
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
it('fault 2: a skip in the board hold stops every character cue, an idle skip keeps the last take, and a stopped knight does not land', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  try {
    const p = rules.fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1');
    const board = mountBoard(element(), undefined, { plainMarks: true }); board.setPosition(p, rules);
    const held = board.play({ from: 1, to: 9, captures: [] }); await vi.advanceTimersByTimeAsync(50);
    expect(mock.finish).toHaveBeenCalledOnce(); expect(mock.stop).not.toHaveBeenCalled();
    board.skip(); expect(mock.stop).toHaveBeenCalledOnce(); expect(stopSelection).toHaveBeenCalledOnce(); await held;
    // End turn and the next move's start skip and set an idle board: the finished take plays to its end.
    board.setPosition(p, rules); const normal = board.play({ from: 1, to: 9, captures: [] });
    await vi.advanceTimersByTimeAsync(900); await normal; board.skip(); board.setPosition(p, rules);
    expect(mock.finish).toHaveBeenCalledTimes(2); expect(mock.stop).toHaveBeenCalledOnce(); expect(stopSelection).toHaveBeenCalledOnce();
  } finally { vi.useRealTimers(); }
  const knight = rules.fromFen('7k/8/8/8/8/8/8/KN6 w - - 0 1');
  const board = mountBoard(element()); board.setPosition(knight, rules); mock.deferred = true;
  const leaping = board.play({ from: 1, to: 18, captures: [] });
  board.setMotion('off'); expect(mock.stop).toHaveBeenCalledTimes(2); mock.end(); await leaping;
  expect(playArmour).toHaveBeenLastCalledWith('knightLeapA'); expect(playArmour).not.toHaveBeenCalledWith('knightLandA');
});

it('leaves the fallen king on the final board when the sequence is skipped', async () => {
  const board = mountBoard(element(), undefined, { liveInput: true });
  board.setPosition(pos(), rules);
  const fall = board.play({ kind: 'fall', square: 63 });
  const syncs = mock.view.sync.mock.calls.length;
  board.skip();
  await fall;
  expect(mock.view.sync).toHaveBeenCalledTimes(syncs);
});

it('announces a standing attacker after travel and never after a skip', async () => {
  const board = mountBoard(element(), undefined, { liveInput: true });
  board.setPosition(pos(), rules);
  const stood = vi.fn();
  mock.deferred = true;
  const first = board.play({ from: 8, to: 16, captures: [] }, undefined, stood);
  expect(stood).not.toHaveBeenCalled();
  mock.end();
  await first;
  expect(stood).toHaveBeenCalledOnce();
  const second = board.play({ from: 16, to: 24, captures: [] }, undefined, stood);
  board.skip();
  await second;
  expect(stood).toHaveBeenCalledOnce();
});
