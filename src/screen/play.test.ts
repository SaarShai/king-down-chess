import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectPlay } from './play';
import { connectSettings } from './settings';
import { defaultSetup } from '../new-game';
import type { Engine } from '../game';
import type { BoardView } from '../render/PaintedView';
import { connectTurnPress } from '../turn-controls';
import { gameJSON, readSave, writeSave, SAVE_KEY, type Save } from './save';
import { stamp, Sync, type Row } from '../account/sync';
import { toFen } from '../rules/setup';
import { POWERS_BALANCED, RULES_2017, parseKings, type Rules } from '../rules/engine';
import { refreshTable, renderTable } from '../ui/table';
import { progress, recordLesson } from '../lesson-shelf-ui';
import { LESSONS } from '../lessons';

vi.mock('../render/sfx', () => ({ setSound: vi.fn(), snd: {} }));
vi.mock('../ui/table', () => ({ readPiece: vi.fn(), refreshTable: vi.fn(), renderTable: vi.fn() }));
vi.mock('../ui/powers', () => ({ clearCoinRead: vi.fn(), initCoins: vi.fn(), refreshCoins: () => ({ armed: false }) }));
vi.mock('../move-moments', () => ({ connectMoveMoments: () => ({ cancel: vi.fn(), undo: vi.fn() }) }));
vi.mock('../game-end', () => ({ connectEndReview: vi.fn(), connectGameEnd: () => ({ reset: vi.fn(), refresh: vi.fn() }) }));
vi.mock('../turn-controls', () => ({ connectTurnPress: vi.fn(), renderTurnButton: vi.fn(), announceWaiting: vi.fn(), waitingRead: vi.fn() }));
vi.mock('../ui/previously', () => ({ connectPreviously: (_button: unknown, c: { game(): { pos: unknown } }) => ({ clear: vi.fn(), position: () => c.game().pos, state: vi.fn() }) }));
vi.mock('./moments', () => ({ soundsFor: () => ({ now: null, hit: null }), connectMoments: () => ({ clear: vi.fn(), start: vi.fn(), restore: vi.fn(), played: vi.fn(), say: vi.fn(), result: () => '', reviewNote: () => '', marked: () => [] }) }));
vi.mock('./links', () => ({ connectLinks: () => ({}) }));
vi.mock('../lesson-shelf', () => ({ lessonShelf: () => ({ next: null }) }));

const stored = new Map<string, string>();
const original: Save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', coords: true, resigned: null };
const request = { link: false, continues: false, urlRules: false, title: false, unreadable: false, notice: '' };
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks(); stored.clear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key), key: (i: number) => [...stored.keys()][i] ?? null, get length() { return stored.size; } });
  const nodes = new Map<string, object>(), node = () => ({ setAttribute: vi.fn(), appendChild: vi.fn(), close: vi.fn(), querySelector: () => null, style: {} });
  vi.stubGlobal('document', { hidden: false, documentElement: { dataset: { pace: 'off' } }, addEventListener: vi.fn(), removeEventListener: vi.fn(), querySelector: () => null, querySelectorAll: () => [], createElement: node, getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function page(rules: Partial<Rules> = {}, fen: string | null = null, realSettings = false) {
  const view = { setRules: vi.fn(), sync: vi.fn(), flip: vi.fn(), highlight: vi.fn(), setPreview: vi.fn(), setCoords: vi.fn(), setLabels: vi.fn(), animateMove: vi.fn().mockResolvedValue(undefined), skip: vi.fn() } as unknown as BoardView;
  const engine = { cancel: vi.fn(), think: vi.fn().mockResolvedValue({ move: null }) }, changed = vi.fn();
  const settings = { pace: () => 'off', threats: () => false, queen: () => true, settingsNow: () => ({ coords: true }), applySettings: vi.fn(), resetSettings: vi.fn(),
    sound: () => true, coords: () => true, labels: () => false, applyPace: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['settings'];
  // main.ts connects settings before it creates play. Keep the same start order here.
  const controls: ReturnType<typeof connectSettings> = realSettings ? connectSettings(view, { skill: () => play.skill(), setSkill: level => play.setSkill(level), save: () => play.saveSettings(), refresh: () => play.refresh() }) : settings;
  const play = connectPlay(view, { params: new URLSearchParams(), preset: undefined, rules, withPowers: () => ({}), fen,
    engine: engine as unknown as Engine, guide: { fill: vi.fn() }, settings: controls,
    home: { visible: false, close: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['home'],
    keys: () => ({ cursor: () => null, say: vi.fn(), focus: vi.fn() }), account: () => ({ changed }),
    setup: () => ({ ...defaultSetup(), mode: 'two' }), openNewGame: vi.fn(),
  });
  return { play, view, engine, changed, settings: controls };
}

it('review 1: starts local practice with the real settings before play', () => {
  const { play, settings } = page({}, null, true);
  expect(play.skill()).toBe('club');
  expect(settings.settingsNow().skill).toBe('club');
  play.setSkill('strong');
  settings.resetSettings();
  expect(play.skill()).toBe('club');
  play.game().play(play.game().legal[0]);
  play.save();
  expect(readSave().save?.moves).toHaveLength(1);
});

describe('review account boundaries', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const keys = [SAVE_KEY, 'kingdown.lessons', 'kingdown.sync'];
  const copy = (moves: string[]) => [JSON.stringify({ ...original, moves }), JSON.stringify({ done: ['Guard'] }), null];
  const access = { blocked: () => false, accepts: () => true };

  it('review 6: returns failure from both writers when another account owns the keys', () => {
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'A' }));
    page();
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'B' }));
    const before = [...stored];
    expect.soft(recordLesson('Guard')).toBe(false);
    expect.soft(writeSave(original)).toBe(false);
    expect([...stored]).toEqual(before);
  });

  it.each(['other account', 'storage error'])('review 6: keeps a failure notice for a blocked lesson record (%s)', async cause => {
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'A' }));
    const { play, view, changed } = page();
    play.startLesson(4);
    if (cause === 'other account') stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'B' }));
    else {
      const set = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key, value) => { if (key === 'kingdown.lessons') throw new Error('quota'); set(key, value); };
    }
    const before = [...stored], game = play.game();
    const move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
    view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
    await vi.advanceTimersByTimeAsync(0);
    const shown = () => vi.mocked(refreshTable).mock.lastCall![0];
    expect(shown().saveNotice).toContain(cause === 'other account' ? 'cannot save' : 'not saved');
    expect(shown().lessonDone).toBe(false);
    expect(play.moments.say).not.toHaveBeenCalledWith(expect.stringContaining('Well done'));
    play.commands.escape(); view.onSquareClick(move.to, false); play.refresh();
    expect(shown().saveNotice).toContain(cause === 'other account' ? 'cannot save' : 'not saved');
    if (cause === 'other account') expect(shown().saveNotice).toContain('Reload');
    expect([...stored]).toEqual(before);
    expect(changed).not.toHaveBeenCalled();
  });

  it('review 6: records a lesson before it shows success', async () => {
    const { play, view, changed } = page();
    play.startLesson(4);
    const game = play.game(), move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
    view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
    await vi.advanceTimersByTimeAsync(0);
    expect(progress().done).toContain('Guard');
    expect(play.moments.say).toHaveBeenCalledWith(expect.stringContaining('Well done'));
    expect(vi.mocked(refreshTable).mock.lastCall![0].lessonDone).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });

  it.each(['other account', 'storage error'])('review 6: keeps a failure notice when New game cannot save (%s)', cause => {
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'A' }));
    const { play, view, changed, engine } = page();
    if (cause === 'other account') stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'B' }));
    else {
      const set = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key, value) => { if (key === SAVE_KEY) throw new Error('quota'); set(key, value); };
    }
    stored.set(SAVE_KEY, JSON.stringify(original));
    const before = [...stored];
    play.newGame('RNBQKBNR', null, false, null, ['ai', 'human']);
    const failure = vi.mocked(refreshTable).mock.lastCall![0].saveNotice;
    expect(failure).toContain(cause === 'other account' ? 'cannot save' : 'not saved');
    if (cause === 'other account') expect(failure).toContain('Reload');
    expect(failure).not.toContain('Start a New game');
    play.commands.escape(); view.onSquareClick(12, false); play.refresh();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe(failure);
    expect([...stored]).toEqual(before);
    expect(changed).not.toHaveBeenCalled();
    if (cause === 'other account') expect(engine.think).not.toHaveBeenCalled();
    expect(play.save()).toBe(false);
  });

  it('review 2: selects B before a failed cloud read', async () => {
    const { play } = page();
    stored.set(SAVE_KEY, JSON.stringify(original)); play.restore(original, request);
    const a = new Sync(localStorage, { userId: 'A', pull: async () => null, push: async row => row }, play.fromAccount, play.savedGames);
    await a.pull(); a.stop();
    stored.set('kingdown.local.B', JSON.stringify(copy(['d2-d4'])));
    const pull = vi.fn(async () => {
      expect(play.game().history.map(h => h.lan)).toEqual(['d2-d4']);
      throw new Error('offline');
    });
    const b = new Sync(localStorage, { userId: 'B', pull, push: async row => row }, play.fromAccount, play.savedGames);
    await b.pull(); b.stop();
    expect(pull).toHaveBeenCalledOnce();
    expect(JSON.parse(stored.get('kingdown.sync-owner')!).userId).toBe('B');
    expect(play.game().history.map(h => h.lan)).toEqual(['d2-d4']);
    expect(progress().done).toEqual(['Guard']);
  });

  it.each(['archive', 'restore'])('review 2: blocks game and lesson writes after a failed %s', async phase => {
    const { play } = page();
    stored.set(SAVE_KEY, JSON.stringify(original)); play.restore(original, request);
    const a = new Sync(localStorage, { userId: 'A', pull: async () => null, push: async row => row }, play.fromAccount, play.savedGames);
    await a.pull(); a.stop();
    const set = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === (phase === 'archive' ? 'kingdown.local.A' : 'kingdown.sync-owner')) throw new Error('quota');
      set(key, value);
    };
    const pull = vi.fn(async () => null);
    const b = new Sync(localStorage, { userId: 'B', pull, push: async row => row }, play.fromAccount, play.savedGames);
    await b.pull(); b.stop();
    const before = keys.map(key => stored.get(key));
    play.game().play(play.game().legal[0]); play.save(); recordLesson('Ogre');
    expect(keys.map(key => stored.get(key))).toEqual(before);
    expect(pull).not.toHaveBeenCalled();
  });

  it('review 3: blocks a stale tab and loads B even when the shared owner is already B', async () => {
    const tab1 = localStorage, { play: first } = page();
    stored.set(SAVE_KEY, JSON.stringify(original)); first.restore(original, request);
    const a = new Sync(tab1, { userId: 'A', pull: async () => null, push: async row => row }, first.fromAccount, first.savedGames);
    await a.pull(); a.stop();
    // Each tab has its own Storage object and the same backing keys.
    const tab2 = { getItem: tab1.getItem, setItem: tab1.setItem, removeItem: tab1.removeItem, key: tab1.key, get length() { return tab1.length; } } as Storage;
    vi.stubGlobal('localStorage', tab2);
    const { play: second } = page(); second.restore(original, request);
    stored.set('kingdown.local.B', JSON.stringify(copy(['d2-d4'])));
    const pushes: unknown[] = [];
    let cloud: Row | null = null;
    const remote = { userId: 'B', pull: async () => cloud, push: async (row: Row) => { pushes.push(row); cloud = { ...cloud, ...row }; return cloud; } };
    vi.stubGlobal('localStorage', tab1);
    const b1 = new Sync(tab1, remote, first.fromAccount, first.savedGames);
    await b1.pull(); b1.stop();
    vi.stubGlobal('localStorage', tab2);
    const before = keys.map(key => stored.get(key));
    second.save(); recordLesson('Ogre');
    expect(keys.map(key => stored.get(key))).toEqual(before);
    const b2 = new Sync(tab2, remote, second.fromAccount, second.savedGames);
    await b2.pull();
    expect(second.game().history.map(h => h.lan)).toEqual(['d2-d4']);
    second.game().playLan(['d7-d5']); second.save(); b2.changed(); await b2.flush(); b2.stop();
    expect(readSave().save?.moves).toEqual(['d2-d4', 'd7-d5']);
    expect(pushes.at(-1)).toMatchObject({ saved_game: { v: { moves: ['d2-d4', 'd7-d5'] } } });
  });

  it.each(['move', 'settings'])('account finding 1: keeps A out of B when games match (%s first)', async firstWrite => {
    const aSave = { ...original, sound: false }, bSave = { ...original, sound: true };
    expect(gameJSON(aSave)).toBe(gameJSON(bSave));
    const tabA = localStorage;
    stored.set(SAVE_KEY, JSON.stringify(aSave));
    const first = page(); first.play.restore(aSave, request);
    vi.spyOn(first.settings, 'settingsNow').mockReturnValue({ ...first.settings.settingsNow(), sound: false });
    const a = new Sync(tabA, { userId: 'A', pull: async () => null, push: async row => row }, first.play.fromAccount, first.play.savedGames);
    await a.pull();
    const tabB = { getItem: tabA.getItem, setItem: tabA.setItem, removeItem: tabA.removeItem, key: tabA.key, get length() { return tabA.length; } } as Storage;
    vi.stubGlobal('localStorage', tabB);
    const second = page(); second.play.restore(aSave, request);
    stored.set('kingdown.local.B', JSON.stringify([JSON.stringify(bSave), null, null]));
    let cloud: Row = { settings: { at: 500, v: { coords: true, sound: true } }, saved_game: { at: 500, v: bSave } };
    const push = vi.fn(async (row: Row) => { cloud = { ...cloud, ...row }; return cloud; });
    const b = new Sync(tabB, { userId: 'B', pull: async () => cloud, push }, second.play.fromAccount, second.play.savedGames);
    await b.pull();
    vi.spyOn(second.settings, 'settingsNow').mockReturnValue({ ...second.settings.settingsNow(), sound: true });
    expect(second.settings.applySettings).toHaveBeenCalledWith(expect.objectContaining({ sound: true }));
    const before = keys.map(key => stored.get(key)), cloudBefore = JSON.stringify(cloud);
    for (const action of firstWrite === 'move' ? ['move', 'settings'] : ['settings', 'move']) {
      vi.stubGlobal('localStorage', tabA);
      if (action === 'move') {
        first.play.game().playLan(['Ng1-f3']);
        expect(first.play.save()).toBe(false);
      } else expect(first.play.saveSettings()).toBe(false);
      expect(keys.map(key => stored.get(key))).toEqual(before);
      expect(first.changed).not.toHaveBeenCalled();
      first.play.commands.escape(); first.play.refresh();
      expect(vi.mocked(refreshTable).mock.lastCall![0]).toMatchObject({ notice: '', saveNotice: 'This page cannot save your changes. Reload this page.' });
      a.changed(); await a.flush();
      vi.stubGlobal('localStorage', tabB);
      b.changed(); await b.flush();
      expect(keys.map(key => stored.get(key))).toEqual(before);
      expect(JSON.stringify(cloud)).toBe(cloudBefore);
    }
    push.mockClear();
    second.play.game().playLan(['d2-d4']);
    expect(second.play.save()).toBe(true);
    b.changed(); await b.flush();
    expect(readSave().save).toMatchObject({ moves: [...original.moves, 'd2-d4'], sound: true });
    expect(cloud).toMatchObject({ saved_game: { v: { moves: [...original.moves, 'd2-d4'] } }, settings: { v: { sound: true } } });
    expect(push).toHaveBeenCalledOnce();
    a.stop(); b.stop();
  });

  it('keeps a lesson failure after a settings write and clears it after a lesson retry', async () => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const { play, view } = page(); play.restore(original, request);
    const set = localStorage.setItem.bind(localStorage);
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'kingdown.lessons') throw new Error('quota');
      set(key, value);
    });
    const finish = async () => {
      play.startLesson(4);
      const game = play.game(), move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
      view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
      await vi.advanceTimersByTimeAsync(0);
    };
    await finish();
    expect(play.saveSettings()).toBe(true);
    expect(vi.mocked(refreshTable).mock.lastCall![0]).toMatchObject({ saveNotice: 'Changes not saved. Keep this tab open.', lessonDone: false });
    write.mockRestore();
    await finish();
    expect(progress().done).toContain('Guard');
    expect(vi.mocked(refreshTable).mock.lastCall![0]).toMatchObject({ saveNotice: '', lessonDone: true });
  });

  it('review 4: finishes a pending restore before the page loads and saves a new move', async () => {
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'B', restore: copy(['d2-d4']) }));
    stored.set(SAVE_KEY, JSON.stringify({ ...original, moves: ['d2-d4'] }));
    stored.set('kingdown.lessons', JSON.stringify({ done: ['Archer'] }));
    const { play } = page();
    const initial = readSave(); play.restore(initial.save, { ...request, unreadable: initial.unreadable });
    expect(progress().done).toEqual(['Guard']);
    play.game().playLan(['d7-d5']); play.save();
    const b = new Sync(localStorage, { userId: 'B', pull: async () => null, push: async row => row }, play.fromAccount, play.savedGames);
    await b.pull(); b.stop();
    expect(readSave().save?.moves).toEqual(['d2-d4', 'd7-d5']);
    const a = new Sync(localStorage, { userId: 'A', pull: async () => null, push: async row => row }, () => {}, access);
    await a.pull(); a.stop();
    expect(JSON.parse(JSON.parse(stored.get('kingdown.local.B')!)[0]).moves).toEqual(['d2-d4', 'd7-d5']);
  });

  it.each(['save', 'lessons'])('review 4: blocks a failed boot restore when %s loads first', async first => {
    const target = copy(['d2-d4']);
    target[2] = '{}';
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'B', restore: target }));
    stored.set(SAVE_KEY, JSON.stringify(original));
    const set = localStorage.setItem.bind(localStorage);
    let fail = true;
    localStorage.setItem = (key, value) => {
      if (fail && key === 'kingdown.sync') throw new Error('quota');
      set(key, value);
    };
    if (first === 'lessons') expect(progress()).toEqual({});
    expect(readSave()).toEqual({ save: null, unreadable: true });
    const before = keys.map(key => stored.get(key));
    writeSave(original); recordLesson('Ogre');
    expect(keys.map(key => stored.get(key))).toEqual(before);
    fail = false;
    const { play } = page();
    const b = new Sync(localStorage, { userId: 'B', pull: async () => null, push: async row => row }, play.fromAccount, play.savedGames);
    await b.pull(); b.stop();
    expect(play.game().history.map(h => h.lan)).toEqual(['d2-d4']);
    play.game().playLan(['d7-d5']); play.save();
    expect(readSave().save?.moves).toEqual(['d2-d4', 'd7-d5']);
  });
});

describe('local save recovery on the game page', () => {
  it.each([true, false])('F1 opens B without keeping A on the board (B has a game: %s)', async existing => {
    const { play } = page();
    stored.set(SAVE_KEY, JSON.stringify(original)); play.restore(original, request);
    const access = play.savedGames;
    const a = new Sync(localStorage, { userId: 'A', pull: async () => null, push: async row => row }, play.fromAccount, access);
    await a.pull(); a.stop();
    const moves = existing ? ['d2-d4'] : [];
    const b = new Sync(localStorage, { userId: 'B', pull: async () => existing ? {
      settings: { at: 500, v: { sound: false } }, saved_game: { at: 500, v: { ...original, moves } },
    } : null, push: async row => row }, play.fromAccount, access);
    await b.pull(); b.stop();
    expect(play.game().history.map(h => h.lan)).toEqual(moves);
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual(moves);
    expect(play.savedGames.blocked()).toBe(false);
    const returned = new Sync(localStorage, { userId: 'A', pull: async () => null, push: async row => row }, play.fromAccount, access);
    await returned.pull(); returned.stop();
    expect(play.game().history.map(h => h.lan)).toEqual(original.moves);
  });

  it.each([
    { ...original, moves: ['e2-e4', 'e7-e5', 'Qd1-d8'] },
    { ...original, back: '', fen: 'bad', moves: [] },
    { ...original, rules: { kings: null } } as unknown as Save,
  ])('keeps the current game and raw save when candidate replay fails', async save => {
    const { play, view, engine, changed } = page(), current = play.game(), before = toFen(current.pos), raw = JSON.stringify(save);
    stored.set(SAVE_KEY, raw);
    play.seat('ai', 'human');
    play.restore(save, request);
    play.save(); await play.maybeAi();
    view.onSquareClick(12, false);
    expect(play.game()).toBe(current);
    expect(toFen(current.pos)).toBe(before);
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(engine.think).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    expect(vi.mocked(connectTurnPress).mock.calls[0][2].blocked()).toBe(true);
    play.newGame('RNBQKBNR', null, false, null, ['ai', 'human']);
    await Promise.resolve();
    expect(play.savedGames.blocked()).toBe(false);
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual([]);
    expect(engine.think).toHaveBeenCalledOnce();
  });

  it('does not overwrite unreadable raw JSON during the normal boot save', async () => {
    const { play, engine } = page();
    stored.set(SAVE_KEY, '{raw save');
    play.seat('ai', 'human');
    play.restore(null, { ...request, unreadable: true });
    play.save(); await play.maybeAi();
    expect(stored.get(SAVE_KEY)).toBe('{raw save');
    expect(play.savedGames.blocked()).toBe(true);
    expect(engine.think).not.toHaveBeenCalled();
  });

  it('keeps a valid live game playable when only the incoming account game is broken', () => {
    const { play } = page();
    play.restore(original, request);
    const current = play.game();
    expect(play.savedGames.accepts({ ...original, moves: ['e2-e4', 'bad'] })).toBe(false);
    expect(play.game()).toBe(current);
    expect(play.savedGames.blocked()).toBe(false);
    current.play(current.legal[0]); play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toHaveLength(3);
  });

  it('permits fresh local practice when storage reads and writes are denied', async () => {
    const { play, engine } = page();
    vi.stubGlobal('localStorage', { getItem: () => { throw new DOMException('Denied', 'SecurityError'); }, setItem: () => { throw new DOMException('Denied', 'SecurityError'); } });
    const initial = readSave();
    play.seat('ai', 'human');
    play.restore(initial.save, { ...request, unreadable: initial.unreadable });
    play.save(); await play.maybeAi();
    expect(play.savedGames.blocked()).toBe(false);
    expect(engine.think).toHaveBeenCalledOnce();
  });

  it('checks another tab\'s raw data before a settings-only cloud pull overwrites the shared save key', async () => {
    const { play } = page();
    stored.set(SAVE_KEY, JSON.stringify(original));
    play.restore(original, request);
    const current = play.game();
    stamp(localStorage);
    const onApply = vi.fn(play.fromAccount), push = vi.fn(async () => null);
    const sync = new Sync(localStorage, { userId: 'player', pull: async () => ({ settings: { at: 9_000_000, v: { sound: false } } }), push }, onApply, play.savedGames);
    stored.set(SAVE_KEY, '{another tab raw data');
    await sync.pull();
    expect(stored.get(SAVE_KEY)).toBe('{another tab raw data');
    expect(onApply).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(play.game()).toBe(current);
    expect(play.savedGames.blocked()).toBe(true);
    play.newGame('RNBQKBNR');
    expect(play.savedGames.blocked()).toBe(false);
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual([]);
    sync.stop();
  });

  it('keeps another tab\'s malformed raw data when a normal settings save fires', () => {
    const { play } = page();
    stored.set(SAVE_KEY, JSON.stringify(original));
    play.restore(original, request);
    stored.set(SAVE_KEY, '{another tab raw data');
    play.save();
    expect(stored.get(SAVE_KEY)).toBe('{another tab raw data');
    expect(play.savedGames.blocked()).toBe(true);
  });
});

describe('local saves from two tabs', () => {
  const shownNotice = () => vi.mocked(refreshTable).mock.lastCall![0].saveNotice;
  const load = (save: Save) => {
    stored.set(SAVE_KEY, JSON.stringify(save));
    const tab = page();
    tab.play.restore(save, request);
    return tab;
  };

  it.each([
    { ...original, moves: [...original.moves, 'Ng1-f3'] },
    { ...original, resigned: 0 as const },
    { ...original, staged: 1 },
  ])('keeps another tab\'s changed game and blocks the stale writer', newer => {
    const { play, changed } = load(original);
    const raw = JSON.stringify(newer);
    stored.set(SAVE_KEY, raw);
    play.game().playLan(['d2-d4']);
    play.save();
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(changed).not.toHaveBeenCalled();
    expect(play.savedGames.blocked()).toBe(true);
    expect(shownNotice()).toContain('another tab');
    play.commands.escape();
    expect(shownNotice()).toContain('another tab');
    expect(document.getElementById('announce')!.textContent).toContain('another tab');
    play.newGame('RNBQKBNR');
    expect(play.savedGames.blocked()).toBe(false);
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual([]);
  });

  it('keeps a game another tab saves after this tab starts with no save', () => {
    const { play } = page();
    play.restore(null, request);
    const raw = JSON.stringify(original);
    stored.set(SAVE_KEY, raw);
    play.save();
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(play.savedGames.blocked()).toBe(true);
  });

  it('changes only settings in another tab\'s newer save, then still detects the game conflict', () => {
    const { play } = load({ ...original, moves: ['e2-e4'] });
    const newer = { ...original, coords: false, staged: 1, daily: '2026-10-26', link: 1 as const, labels: true as const };
    stored.set(SAVE_KEY, JSON.stringify(newer));
    play.saveSettings();
    expect(JSON.parse(stored.get(SAVE_KEY)!)).toEqual({ ...newer, coords: true });
    expect(play.savedGames.blocked()).toBe(false);
    play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!)).toEqual({ ...newer, coords: true });
    expect(play.savedGames.blocked()).toBe(true);
  });

  it('accepts an account game as the next write baseline', () => {
    const { play } = load(original);
    const newer = { ...original, moves: [...original.moves, 'Ng1-f3'] };
    stored.set(SAVE_KEY, JSON.stringify(newer));
    play.save();
    expect(play.savedGames.blocked()).toBe(true);
    play.openSaved(newer);
    play.game().playLan(['Nb8-c6']); play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual([...newer.moves, 'Nb8-c6']);
    expect(play.savedGames.blocked()).toBe(false);
  });

  it('accepts an account restore on a FEN page and keeps the FEN board', () => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const fen = '7k/8/8/8/8/8/4P3/K7 w - - 0 1';
    const { play, changed } = page({}, fen);
    play.restore(original, request);
    const current = play.game(), before = toFen(current.pos);
    stored.set(SAVE_KEY, JSON.stringify({ ...original, moves: [...original.moves, 'Ng1-f3'] }));
    play.fromAccount(['saved_game']);
    expect(play.game()).toBe(current);
    expect(toFen(current.pos)).toBe(before);
    expect(current.history).toHaveLength(0);
    current.playLan(['e2-e4']); play.save();
    expect(readSave().save).toMatchObject({ fen, moves: ['e2-e4'] });
    expect(play.savedGames.blocked()).toBe(false);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('tracks its own writes and accepts settings changes without a game conflict', () => {
    const { play } = load(original);
    play.game().playLan(['Ng1-f3']); play.save();
    const saved = JSON.parse(stored.get(SAVE_KEY)!);
    stored.set(SAVE_KEY, JSON.stringify({ sound: false, ...saved, coords: false }));
    play.game().playLan(['Nb8-c6']); play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual([...original.moves, 'Ng1-f3', 'Nb8-c6']);
    expect(play.savedGames.blocked()).toBe(false);
  });
});

describe('failed local autosaves', () => {
  const unsaved = 'Changes not saved. Keep this tab open.';
  const shown = () => vi.mocked(refreshTable).mock.lastCall![0];

  it('saves the next move after unreadable data and one quota failure', () => {
    const raw = '{raw save';
    stored.set(SAVE_KEY, raw);
    const { play, changed } = page();
    play.restore(null, { ...request, unreadable: true });
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    play.newGame('RNBQKBNR');
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    expect(changed).not.toHaveBeenCalled();
    play.game().playLan(['e2-e4']); play.save();
    expect(readSave().save).toMatchObject({ back: 'RNBQKBNR', moves: ['e2-e4'] });
    expect(play.savedGames.blocked()).toBe(false);
    expect(shown()).toMatchObject({ saveNotice: '' });
    expect(changed).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledTimes(2);
    stored.set(SAVE_KEY, raw);
    expect(play.savedGames.blocked()).toBe(true);
  });

  it.each(['save', 'account check'] as const)('blocks changed raw data after a quota failure through %s', check => {
    const raw = '{raw save', newer = '{another tab raw data';
    stored.set(SAVE_KEY, raw);
    const { play, changed } = page();
    play.restore(null, { ...request, unreadable: true });
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    play.newGame('RNBQKBNR');
    expect(stored.get(SAVE_KEY)).toBe(raw);
    stored.set(SAVE_KEY, newer);
    play.game().playLan(['e2-e4']);
    if (check === 'account check') expect(play.savedGames.blocked()).toBe(true);
    play.save();
    expect(stored.get(SAVE_KEY)).toBe(newer);
    expect(play.savedGames.blocked()).toBe(true);
    expect(changed).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledOnce();
  });

  it('keeps the same raw data open for a save after a quota failure', () => {
    const raw = '{raw save';
    stored.set(SAVE_KEY, raw);
    const { play } = page();
    play.restore(null, { ...request, unreadable: true });
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    play.newGame('RNBQKBNR');
    expect(play.savedGames.blocked()).toBe(false);
    play.game().playLan(['e2-e4']); play.save();
    expect(readSave().save?.moves).toEqual(['e2-e4']);
  });

  it('retries a new game after a stale-save conflict and one quota failure', () => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const { play, changed } = page();
    play.restore(original, request);
    const raw = JSON.stringify({ ...original, moves: [...original.moves, 'Ng1-f3'] });
    stored.set(SAVE_KEY, raw);
    play.game().playLan(['d2-d4']); play.save();
    expect(play.savedGames.blocked()).toBe(true);
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    play.newGame('RNBQKBNR');
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(play.savedGames.blocked()).toBe(false);
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    expect(changed).not.toHaveBeenCalled();
    play.game().playLan(['e2-e4']); play.save();
    expect(readSave().save).toMatchObject({ back: 'RNBQKBNR', moves: ['e2-e4'] });
    expect(play.savedGames.blocked()).toBe(false);
    expect(shown()).toMatchObject({ saveNotice: '' });
    expect(changed).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledTimes(2);
  });

  it.each(['QuotaExceededError', 'SecurityError'])('keeps a persistent notice after %s and saves all moves on retry', name => {
    const raw = JSON.stringify(original);
    stored.set(SAVE_KEY, raw);
    const { play, changed } = page();
    play.restore(original, request);
    play.refresh();
    let refused = true;
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (refused) throw new DOMException('Refused', name);
      stored.set(key, value);
    });
    play.game().playLan(['Ng1-f3']); play.save();
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    expect(document.getElementById('announce')!.textContent).toBe(unsaved);
    expect(changed).not.toHaveBeenCalled();
    expect(play.savedGames.blocked()).toBe(false);
    play.commands.escape(); play.refresh();
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    play.game().playLan(['Nb8-c6']); play.save();
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    refused = false;
    play.saveSettings();
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual(original.moves);
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    play.save();
    expect(readSave().save!.moves).toEqual([...original.moves, 'Ng1-f3', 'Nb8-c6']);
    expect(shown()).toMatchObject({ saveNotice: '' });
    expect(document.getElementById('announce')!.textContent).toBe('Changes saved.');
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('clears a settings-only failure when the settings save succeeds', () => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const { play } = page();
    play.restore(original, request);
    play.refresh();
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    play.saveSettings();
    expect(shown()).toMatchObject({ saveNotice: unsaved });
    write.mockRestore();
    play.saveSettings();
    expect(shown()).toMatchObject({ saveNotice: '' });
    expect(readSave().save!.moves).toEqual(original.moves);
  });
});

describe('a save without rules on the game page', () => {
  const frost: Partial<Rules> = { ...POWERS_BALANCED, kings: parseKings('frost:freeze,none') };
  const shownNotice = () => vi.mocked(refreshTable).mock.lastCall![0].notice;

  it('replays under the default rules, which are the rules that save() writes for a default game', () => {
    const { play } = page();
    play.save();
    const written = JSON.parse(stored.get(SAVE_KEY)!).rules;
    stored.clear();
    // The URL names the default rules: the save replays, so its rules compare equal to the defaults.
    play.restore(original, { ...request, urlRules: true });
    expect(play.game().history.map(h => h.lan)).toEqual(original.moves);
    play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!).rules).toEqual(written);
  });

  it('replays when the URL names no rules', () => {
    const { play } = page();
    play.restore(original, request);
    expect(play.game().history.map(h => h.lan)).toEqual(original.moves);
    expect(play.savedGames.blocked()).toBe(false);
  });

  it('keeps the fresh game and its king power when the URL names kings', () => {
    const { play } = page(frost);
    stored.set(SAVE_KEY, JSON.stringify(original));
    play.restore(original, { ...request, urlRules: true });
    expect(play.game().history).toHaveLength(0);
    expect(play.game().rules.kings[0]?.power).toBe('Freeze');
    expect(play.savedGames.blocked()).toBe(false);
    play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!).rules.kings[0].power).toBe('Freeze');
  });

  it('keeps the fresh ?rules=2017 game with no recovery notice for a save that 2017 cannot replay', () => {
    const { play } = page({ ...RULES_2017 });
    const save: Save = { ...original, back: '', fen: '4k3/8/8/8/8/8/8/2A1K3 w - - 0 1', moves: ['Ac1-d2'] };
    stored.set(SAVE_KEY, JSON.stringify(save));
    play.restore(save, { ...request, urlRules: true });
    play.refresh();
    expect(shownNotice()).toBe('');
    expect(play.savedGames.blocked()).toBe(false);
    expect(play.game().history).toHaveLength(0);
    expect(JSON.stringify(play.game().rules)).toBe(JSON.stringify(page({ ...RULES_2017 }).play.game().rules));
  });
});

describe('a reload of a staged turn', () => {
  const shown = () => vi.mocked(renderTable).mock.lastCall![0];
  const stage = (play: ReturnType<typeof page>['play'], lan: string) => {
    const g = play.game();
    g.play(g.legal.find(m => g.context.toLan(g.pos, m) === lan)!);
    play.save();
    return JSON.parse(stored.get(SAVE_KEY)!) as Save;
  };

  it('keeps the staged ply staged: Undo stays on, the computer waits, and the next save keeps the count', async () => {
    const first = page();
    first.play.seat('human', 'ai');
    first.play.restore(original, request);
    const saved = stage(first.play, 'Ng1-f3');
    expect(saved.staged).toBe(1);
    const { play, engine } = page();
    play.seat('human', 'ai');
    play.restore(saved, request);
    play.refresh();
    expect(play.game().history.map(h => h.lan)).toEqual([...original.moves, 'Ng1-f3']);
    expect([shown().staged, shown().undoOn, shown().activeSide]).toEqual([1, true, 0]);
    await play.maybeAi();
    expect(engine.think).not.toHaveBeenCalled();
    play.save();
    expect(JSON.parse(stored.get(SAVE_KEY)!).staged).toBe(1);
  });

  it('writes no count when nothing is staged, and a save without one hands every ply over', () => {
    const { play } = page();
    play.restore(original, request);
    play.save();
    expect('staged' in JSON.parse(stored.get(SAVE_KEY)!)).toBe(false);
    play.refresh();
    expect([shown().staged, shown().undoOn]).toEqual([0, false]);
  });

  it('keeps a staged Haste first move mid-way: the restore plays no pass', () => {
    const haste: Partial<Rules> = { ...POWERS_BALANCED, kings: parseKings('flame:haste,none') };
    const first = page(haste);
    first.play.restore({ ...original, back: '', fen: '7k/p7/8/8/8/8/8/R5K1 w - - 0 1', moves: [], rules: { ...first.play.game().rules } }, request);
    const saved = stage(first.play, 'Ra1-a4!H');
    expect([saved.moves, saved.staged]).toEqual([['Ra1-a4!H'], 1]);
    const { play } = page(haste);
    play.restore(saved, request);
    play.refresh();
    expect(play.game().history.map(h => h.lan)).toEqual(['Ra1-a4!H']);
    expect([shown().staged, shown().undoOn]).toEqual([1, true]);
  });

  it("opens an account save with that save's staged count", () => {
    const { play } = page();
    play.restore(original, request);
    play.openSaved({ ...original, moves: [...original.moves, 'Ng1-f3'], staged: 1 });
    expect([shown().staged, shown().undoOn]).toEqual([1, true]);
    play.openSaved(original);
    expect([shown().staged, shown().undoOn]).toEqual([0, false]);
  });

  it('hands over an old mid-Haste save whose count is too large, also after its pass', () => {
    const haste: Partial<Rules> = { ...POWERS_BALANCED, kings: parseKings('flame:haste,none') };
    const rules = { ...page(haste).play.game().rules };
    const save: Save = { ...original, back: '', fen: '7k/p7/8/8/8/8/8/R5K1 w - - 0 1', moves: ['Ra1-a4!H'], rules, staged: 2 };
    const restored = page(haste);
    restored.play.restore(save, request);
    restored.play.refresh();
    expect(restored.play.game().history.map(h => h.lan)).toEqual(['Ra1-a4!H', '--']);
    expect([shown().staged, shown().undoOn]).toEqual([0, false]);
    const opened = page(haste);
    opened.play.restore({ ...save, moves: [], staged: undefined }, request);
    opened.play.openSaved(save);
    expect(opened.play.game().history.map(h => h.lan)).toEqual(['Ra1-a4!H', '--']);
    expect([shown().staged, shown().undoOn]).toEqual([0, false]);
  });
});
