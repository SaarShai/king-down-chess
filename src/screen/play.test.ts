import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectPlay } from './play';
import { connectSettings } from './settings';
import { defaultSetup } from '../new-game';
import { Game, type Engine } from '../game';
import type { BoardView } from '../render/PaintedView';
import { connectTurnPress } from '../turn-controls';
import { gameJSON, readSave, writeSave, SAVE_KEY, type Save } from './save';
import { stamp, Sync, type Row } from '../account/sync';
import { changed as accountChanged } from '../account/account';
import { toFen } from '../rules/setup';
import { POWERS_BALANCED, RULES_2017, parseKings, type Rules } from '../rules/engine';
import { refreshTable, renderTable } from '../ui/table';
import { progress, recordLesson } from '../lesson-shelf-ui';
import { LESSONS } from '../lessons';
import { setSound } from '../render/sfx';

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
  const nodes = new Map<string, object>(), node = () => ({ setAttribute: vi.fn(), appendChild: vi.fn(), close: vi.fn(), focus: vi.fn(), querySelector: () => null, style: {} });
  vi.stubGlobal('document', { hidden: false, documentElement: { dataset: { pace: 'off' } }, addEventListener: vi.fn(), removeEventListener: vi.fn(), querySelector: () => null, querySelectorAll: () => [], createElement: node, getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function page(rules: Partial<Rules> = {}, fen: string | null = null, realSettings = false, accountReady = true) {
  const view = { setRules: vi.fn(), sync: vi.fn(), flip: vi.fn(), highlight: vi.fn(), setPreview: vi.fn(), setCoords: vi.fn(), setLabels: vi.fn(), setPace: vi.fn(), animateMove: vi.fn().mockResolvedValue(undefined), skip: vi.fn() } as unknown as BoardView;
  const engine = { cancel: vi.fn(), think: vi.fn().mockResolvedValue({ move: null }) }, changed = vi.fn();
  const settings = { pace: () => 'off', threats: () => false, queen: () => true, settingsNow: () => ({ coords: true }), applySettings: vi.fn(), resetSettings: vi.fn(),
    sound: () => true, coords: () => true, labels: () => false, applyPace: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['settings'];
  // main.ts connects settings before it creates play. Keep the same start order here.
  const controls: ReturnType<typeof connectSettings> = realSettings ? connectSettings(view, { skill: () => play.skill(), setSkill: level => play.setSkill(level), save: () => play.saveSettings(), refresh: () => play.refresh() }) : settings;
  const play = connectPlay(view, { params: new URLSearchParams(), preset: undefined, rules, withPowers: () => ({}), fen,
    engine: engine as unknown as Engine, guide: { fill: vi.fn() }, settings: controls,
    home: { visible: false, close: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['home'],
    keys: () => ({ cursor: () => null, say: vi.fn(), focus: vi.fn() }), account: () => accountReady ? ({ changed }) : null,
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

  it.each([false, true])('applies B settings to sound and the board when B has a saved game: %s', async hasSave => {
    const sound = document.getElementById('sound') as HTMLInputElement;
    const coords = document.getElementById('coords') as HTMLInputElement;
    const pace = document.getElementById('pace') as HTMLSelectElement;
    sound.checked = coords.checked = true;
    (document.getElementById('queen') as HTMLInputElement).checked = true;
    for (const id of ['threats', 'labels']) (document.getElementById(id) as HTMLInputElement).checked = false;
    pace.value = 'off';
    const empty = { ...original, moves: [], sound: true, pace: 'off' as const };
    stored.set(SAVE_KEY, JSON.stringify(empty));
    stored.set('kingdown.sync-owner', JSON.stringify({ userId: 'A' }));
    const { play, view } = page({}, null, true);
    play.restore(empty, request);
    sound.checked = coords.checked = false;
    sound.onchange!.call(sound, {} as Event);
    coords.onchange!.call(coords, {} as Event);
    pace.value = 'normal'; pace.onchange!.call(pace, {} as Event);
    expect(setSound).toHaveBeenLastCalledWith(false);
    expect(view.setCoords).toHaveBeenLastCalledWith(false);
    expect(view.setPace).toHaveBeenLastCalledWith('normal');
    if (hasSave) stored.set('kingdown.local.B', JSON.stringify([JSON.stringify(empty), null, null]));
    const b = new Sync(localStorage, { userId: 'B', pull: async () => null, push: async row => row }, play.fromAccount, play.savedGames);
    await b.pull(); b.stop();
    expect(JSON.parse(stored.get('kingdown.sync-owner')!).userId).toBe('B');
    expect(readSave().save).toMatchObject({ sound: true, coords: true, pace: 'off' });
    expect(sound.checked).toBe(true);
    expect(coords.checked).toBe(true);
    expect(pace.value).toBe('off');
    expect.soft(setSound).toHaveBeenLastCalledWith(true);
    expect.soft(view.setCoords).toHaveBeenLastCalledWith(true);
    expect.soft(view.setPace).toHaveBeenLastCalledWith('off');
    expect(document.documentElement.dataset.pace).toBe('off');
  });

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

  it('review 8: clears the game failure notice after storage recovers', () => {
    const { play, changed } = page(), set = localStorage.setItem.bind(localStorage);
    play.game().playLan(['e2-e4']);
    localStorage.setItem = (key, value) => { if (key === SAVE_KEY) throw new Error('quota'); set(key, value); };
    expect(play.save()).toBe(false);
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe('Changes not saved. Keep this tab open.');
    expect(changed).not.toHaveBeenCalled();
    localStorage.setItem = set;
    expect(play.save()).toBe(true);
    expect(readSave().save?.moves).toEqual(['e2-e4']);
    expect(changed).toHaveBeenCalledOnce();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe('');
    play.refresh();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe('');
    play.commands.escape(); play.refresh();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe('');
  });

  it('review 8: clears the lesson failure notice after a successful retry', async () => {
    const { play, view, changed } = page(), set = localStorage.setItem.bind(localStorage);
    const complete = async () => {
      const game = play.game(), move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
      view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
      await vi.advanceTimersByTimeAsync(0);
    };
    play.startLesson(4);
    localStorage.setItem = (key, value) => { if (key === 'kingdown.lessons') throw new Error('quota'); set(key, value); };
    await complete();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe('Changes not saved. Keep this tab open.');
    expect(vi.mocked(refreshTable).mock.lastCall![0].lessonDone).toBe(false);
    expect(changed).not.toHaveBeenCalled();
    localStorage.setItem = set;
    play.startLesson(4);
    await complete();
    expect(progress().done).toContain('Guard');
    expect(vi.mocked(refreshTable).mock.lastCall![0].lessonDone).toBe(true);
    expect(play.moments.say).toHaveBeenCalledWith(expect.stringContaining('Well done'));
    expect(changed).toHaveBeenCalledOnce();
    play.refresh();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe('');
  });

  it.each(['game', 'lesson'])('review 8: keeps the %s failure after the other write succeeds', async failed => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const { play, view } = page(), set = localStorage.setItem.bind(localStorage);
    const complete = async () => {
      play.startLesson(4);
      const game = play.game(), move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
      view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
      await vi.advanceTimersByTimeAsync(0);
    };
    const keyToFail = failed === 'game' ? SAVE_KEY : 'kingdown.lessons';
    localStorage.setItem = (key, value) => { if (key === keyToFail) throw new Error('quota'); set(key, value); };
    if (failed === 'game') expect(play.save()).toBe(false); else await complete();
    const failure = vi.mocked(refreshTable).mock.lastCall![0].saveNotice;
    expect(failure).toBe('Changes not saved. Keep this tab open.');
    localStorage.setItem = set;
    if (failed === 'game') await complete(); else expect(play.save()).toBe(true);
    play.refresh();
    expect(vi.mocked(refreshTable).mock.lastCall![0].saveNotice).toBe(failure);
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

describe('new local game validation', () => {
  it.each(['army', 'position', 'rematch'])('keeps the live game, turn and dialog after an invalid %s', kind => {
    const { play, view, engine, changed } = page();
    play.restore({ ...original, moves: [...original.moves, 'Ng1-f3'], staged: 1 }, request);
    play.seat('human', 'ai'); play.setSkill('strong'); play.save();
    const current = play.game(), before = toFen(current.pos), raw = stored.get(SAVE_KEY);
    const turn = vi.mocked(connectTurnPress).mock.calls[0][2].turn();
    const dialog = document.getElementById('new-game') as HTMLDialogElement;
    Object.assign(dialog, { open: true }); vi.mocked(dialog.close).mockClear();
    vi.mocked(view.sync).mockClear(); engine.cancel.mockClear(); changed.mockClear();
    expect(() => kind === 'position' ? play.newGame(undefined, 'bad') : play.newGame('ABC', null, kind === 'rematch')).toThrow();
    expect(play.game()).toBe(current);
    expect(toFen(current.pos)).toBe(before);
    expect(current.history.map(h => h.lan)).toEqual([...original.moves, 'Ng1-f3']);
    expect(vi.mocked(connectTurnPress).mock.calls[0][2].turn()).toEqual(turn);
    expect(play.sides()).toEqual(['human', 'ai']); expect(play.skill()).toBe('strong');
    expect(dialog.open).toBe(true); expect(dialog.close).not.toHaveBeenCalled();
    expect(view.sync).not.toHaveBeenCalled(); expect(engine.cancel).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled(); expect(stored.get(SAVE_KEY)).toBe(raw);
  });

  it('replaces the game and resets the turn after a valid custom army', () => {
    const { play } = page();
    play.restore({ ...original, moves: [...original.moves, 'Ng1-f3'], staged: 1 }, request);
    const current = play.game(), dialog = document.getElementById('new-game') as HTMLDialogElement;
    play.newGame('RNBQKBNR');
    expect(play.game()).not.toBe(current); expect(play.game().backRank).toBe('RNBQKBNR');
    expect(play.game().history).toEqual([]); expect(dialog.close).toHaveBeenCalledOnce();
    expect(vi.mocked(connectTurnPress).mock.calls[0][2].turn()).toMatchObject({ staged: 0, activeSide: 0 });
    expect(JSON.parse(stored.get(SAVE_KEY)!).moves).toEqual([]);
  });

  it('keeps the daily army and rematch rules, level and player swap', () => {
    const { play } = page();
    play.newGame(undefined, null, false, '2026-10-26');
    const daily = play.game().backRank;
    play.newGame(undefined, null, false, '2026-10-26');
    expect(play.game().backRank).toBe(daily);
    const rules = { ...play.game().rules, ...POWERS_BALANCED, kings: parseKings('flame:haste,none') };
    play.openSaved({ ...original, rules }); play.seat('human', 'ai'); play.setSkill('strong');
    const current = play.game(), before = { ...current.rules };
    play.rematch();
    expect(play.game().rules).toEqual(before);
    expect(play.game().backRank).toBe(original.back); expect(play.game().history).toEqual([]);
    expect(play.sides()).toEqual(['ai', 'human']); expect(play.skill()).toBe('strong');
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

  it('starts local practice when the browser denies the storage accessor', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('Denied', 'SecurityError'); } });
    const { play } = page();
    play.save();
    expect(play.savedGames.blocked()).toBe(false);
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

  it('saves the game with a settings change when no game is saved yet', () => {
    const fen = '4k3/8/8/3r4/8/8/3N4/4K3 w - - 0 1';
    const { play } = page({}, fen);
    play.restore(null, request);
    expect(play.saveSettings()).toBe(true);
    expect(readSave().save).toMatchObject({ fen, moves: [], coords: true });
    expect(play.savedGames.blocked()).toBe(false);
  });

  it('keeps another tab\'s game when a settings change follows an empty load', () => {
    const { play } = page({}, '4k3/8/8/3r4/8/8/3N4/4K3 w - - 0 1');
    play.restore(null, request);
    stored.set(SAVE_KEY, JSON.stringify(original));
    expect(play.saveSettings()).toBe(true);
    expect(readSave().save!.moves).toEqual(original.moves);
  });

  it('keeps another tab\'s game when the settings read fails once', () => {
    const { play } = page({}, '4k3/8/8/3r4/8/8/3N4/4K3 w - - 0 1');
    play.restore(null, request);
    const raw = JSON.stringify(original);
    stored.set(SAVE_KEY, raw);
    const get = localStorage.getItem.bind(localStorage);
    let fail = true;
    vi.spyOn(localStorage, 'getItem').mockImplementation(key => {
      if (key === SAVE_KEY && fail) { fail = false; throw new DOMException('Busy', 'UnknownError'); }
      return get(key);
    });
    expect(play.saveSettings()).toBe(false);
    expect(stored.get(SAVE_KEY)).toBe(raw);
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

  it('keeps the Guard warning after Maester saves and clears it after Guard saves', async () => {
    const { play, view, changed } = page();
    const finish = async (index: number) => {
      play.startLesson(index);
      const game = play.game(), move = game.legal.find(m => LESSONS[index].goal(game.pos, m))!;
      view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
      await vi.advanceTimersByTimeAsync(0);
    };
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'kingdown.lessons') throw new DOMException('Full', 'QuotaExceededError');
      stored.set(key, value);
    });
    await finish(4);
    expect(progress().done ?? []).not.toContain('Guard');
    expect(shown()).toMatchObject({ lessonDone: false, saveNotice: unsaved });
    expect(changed).not.toHaveBeenCalled();
    write.mockRestore();
    await finish(2);
    expect(progress().done).toEqual(['Maester']);
    expect(shown()).toMatchObject({ lessonDone: true, saveNotice: unsaved });
    expect(changed).toHaveBeenCalledOnce();
    play.commands.escape(); play.refresh();
    expect(shown().saveNotice).toBe(unsaved);
    await finish(4);
    expect(progress().done).toEqual(['Maester', 'Guard']);
    expect(shown()).toMatchObject({ lessonDone: true, saveNotice: '' });
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it.each(['game', 'lesson'] as const)('round 4: keeps both failures when %s fails first', async first => {
    const empty = { ...original, moves: [] };
    stored.set(SAVE_KEY, JSON.stringify(empty));
    const { play, view, changed } = page();
    play.restore(empty, request);
    const refused = new Set([SAVE_KEY, 'kingdown.lessons']);
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (refused.has(key)) throw new DOMException('Full', 'QuotaExceededError');
      stored.set(key, value);
    });
    const finishLesson = async () => {
      play.startLesson(4);
      const game = play.game(), move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
      view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
      await vi.advanceTimersByTimeAsync(0);
    };
    const returnToGame = () => {
      const button = document.getElementById('return-game')!;
      button.onclick!.call(button, {} as PointerEvent);
    };
    if (first === 'lesson') { await finishLesson(); returnToGame(); }
    view.onSquareClick(12, false); view.onSquareClick(28, false);
    await vi.advanceTimersByTimeAsync(0);
    if (first === 'game') await finishLesson();
    expect(readSave().save?.moves).toEqual([]);
    expect(progress().done ?? []).not.toContain('Guard');
    expect(shown().saveNotice).toBe(unsaved);
    expect(changed).not.toHaveBeenCalled();

    if (first === 'game') {
      refused.delete('kingdown.lessons');
      await finishLesson();
      expect(progress().done).toContain('Guard');
      expect(shown().lessonDone).toBe(true);
      expect(readSave().save?.moves).toEqual([]);
    } else {
      refused.delete(SAVE_KEY);
      expect(play.save()).toBe(true);
      expect(readSave().save?.moves).toEqual(['e2-e4']);
      expect(progress().done ?? []).not.toContain('Guard');
    }
    play.commands.escape(); play.refresh();
    expect(shown().saveNotice).toBe(unsaved);
    expect(changed).toHaveBeenCalledOnce();

    refused.clear();
    if (first === 'game') returnToGame(); else await finishLesson();
    expect(readSave().save?.moves).toEqual(['e2-e4']);
    expect(progress().done).toContain('Guard');
    expect(shown().saveNotice).toBe('');
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it.each(['game', 'lesson', 'both'] as const)('round 4: Sound keeps each failure until its data saves (%s)', async failed => {
    const empty = { ...original, moves: [], sound: true };
    stored.set(SAVE_KEY, JSON.stringify(empty));
    const { play, view, settings, changed } = page({}, null, true);
    settings.applySettings(empty); play.restore(empty, request);
    const failedKeys = new Set(failed === 'both' ? [SAVE_KEY, 'kingdown.lessons'] : [failed === 'game' ? SAVE_KEY : 'kingdown.lessons']);
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (failedKeys.has(key)) throw new DOMException('Full', 'QuotaExceededError');
      stored.set(key, value);
    });
    if (failed !== 'lesson') {
      view.onSquareClick(12, false); view.onSquareClick(28, false);
      await vi.advanceTimersByTimeAsync(0);
    }
    play.startLesson(4);
    if (failed !== 'game') {
      const game = play.game(), move = game.legal.find(m => LESSONS[4].goal(game.pos, m))!;
      view.onSquareClick(move.from, false); view.onSquareClick(move.to, false);
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(shown().saveNotice).toBe(unsaved);
    expect(changed).not.toHaveBeenCalled();
    const sound = document.getElementById('sound') as HTMLInputElement;
    sound.checked = false;
    sound.onchange!.call(sound, {} as Event);
    play.refresh();
    expect(shown().saveNotice).toBe(unsaved);
    write.mockRestore();
    sound.checked = true;
    sound.onchange!.call(sound, {} as Event);
    play.refresh();
    expect(readSave().save?.sound).toBe(true);
    expect(readSave().save?.moves).toEqual(failed === 'lesson' ? [] : ['e2-e4']);
    expect(shown().saveNotice).toBe(failed === 'game' ? '' : unsaved);
    expect(progress().done ?? []).not.toContain('Guard');
    expect(play.game().backRank).not.toBe(empty.back);
    if (failed !== 'lesson') {
      const saved = readSave();
      const reloaded = page({}, null, true);
      reloaded.play.restore(saved.save, { ...request, unreadable: saved.unreadable });
      expect(reloaded.play.game().history.map(h => h.lan)).toEqual(['e2-e4']);
    }
  });

  it.each(['tab', 'account'] as const)('round 4: Sound keeps the newer %s game and the pending game notice', async source => {
    const empty = { ...original, moves: [], sound: true };
    stored.set(SAVE_KEY, JSON.stringify(empty));
    const { play, view, settings } = page({}, null, true);
    settings.applySettings(empty); play.restore(empty, request);
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    view.onSquareClick(12, false); view.onSquareClick(28, false);
    await vi.advanceTimersByTimeAsync(0);
    expect(shown().saveNotice).toBe(unsaved);
    play.startLesson(4);
    stored.set(SAVE_KEY, JSON.stringify(original));
    if (source === 'account') play.fromAccount(['saved_game']);
    const sound = document.getElementById('sound') as HTMLInputElement;
    sound.checked = false;
    sound.onchange!.call(sound, {} as Event);
    play.refresh();
    expect(readSave().save).toMatchObject({ ...original, sound: false });
    expect(shown().saveNotice).toBe(unsaved);
  });

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

  it.each(['save', 'account check'] as const)('asks for a reload through %s when storage access is denied after a quota failure', check => {
    stored.set(SAVE_KEY, '{raw save');
    const { play } = page();
    play.restore(null, { ...request, unreadable: true });
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    play.newGame('RNBQKBNR');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('Denied', 'SecurityError'); } });
    if (check === 'save') expect(play.save()).toBe(false);
    expect(play.savedGames.blocked()).toBe(true);
    expect(shown()).toMatchObject({ saveNotice: 'This page cannot save your changes. Reload this page.' });
  });

  it.each(['save', 'account check'] as const)('asks for a reload through %s when storage access is denied after the saved data is read', check => {
    const { play } = page();
    stored.set(SAVE_KEY, '{raw save');
    const store = localStorage;
    let reads = 0;
    // readSave() reads the accessor three times; the next read is denied.
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { if (++reads > 3) throw new DOMException('Denied', 'SecurityError'); return store; } });
    expect(check === 'save' ? play.save() : !play.savedGames.blocked()).toBe(false);
    expect(shown()).toMatchObject({ saveNotice: 'This page cannot save your changes. Reload this page.' });
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
    expect(readSave().save!.moves).toEqual([...original.moves, 'Ng1-f3', 'Nb8-c6']);
    expect(shown()).toMatchObject({ saveNotice: '' });
    expect(document.getElementById('announce')!.textContent).toBe('Changes saved.');
    expect(changed).toHaveBeenCalledOnce();
    play.game().playLan(['Bf1-c4']);
    expect(play.save()).toBe(true);
    expect(readSave().save!.moves).toEqual([...original.moves, 'Ng1-f3', 'Nb8-c6', 'Bf1-c4']);
    expect(shown().saveNotice).toBe('');
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


describe('partial save recovery', () => {
  const partial: Save = { ...original, moves: [...original.moves, 'Qd1-d8'], resigned: 0, staged: 1 };
  const shown = () => vi.mocked(refreshTable).mock.lastCall![0];
  const accept = () => {
    const button = document.getElementById('recover-save') as HTMLButtonElement;
    expect(button.hidden).toBe(false);
    expect(button.disabled).not.toBe(true);
    button.onclick!.call(button, { detail: 0 } as PointerEvent);
  };
  const boot = (save = partial) => {
    const raw = JSON.stringify(save);
    stored.set(SAVE_KEY, raw);
    const p = page(), read = readSave();
    p.play.seat(save.white, save.black);
    p.play.restore(read.save, { ...request, unreadable: read.unreadable });
    p.play.refresh();
    return { ...p, raw };
  };

  it('offers two legal actions, blocks play, and keeps the full source until acceptance', async () => {
    const { play, view, engine, changed, raw } = boot();
    const line = 'Rules changed. Loaded 2 of 3 actions. The next action is not legal.';
    expect(play.game().history.map(h => h.lan)).toEqual(original.moves);
    expect(shown().saveNotice).toBe(line);
    expect(document.getElementById('announce')!.textContent).toBe(line);
    expect(play.savedGames.blocked()).toBe(true);
    expect(play.save()).toBe(false); expect(play.saveSettings()).toBe(false);
    play.seat('ai', 'human'); await play.maybeAi();
    view.onSquareClick(6, false); view.onSquareClick(21, false);
    expect(engine.think).not.toHaveBeenCalled(); expect(changed).not.toHaveBeenCalled();
    expect(stored.get(SAVE_KEY)).toBe(raw);
    play.seat('human', 'human');
    accept();
    expect(play.savedGames.blocked()).toBe(false);
    expect(play.ended()).toBe(false);
    expect(readSave().save).toMatchObject({ moves: original.moves, resigned: null });
    expect(readSave().save?.staged).toBeUndefined();
    expect(document.getElementById('recover-save')!.hidden).toBe(true);
    expect(changed).toHaveBeenCalledWith();
    expect(document.getElementById('board')!.focus).toHaveBeenCalledWith({ preventScroll: true });
    view.onSquareClick(6, false); view.onSquareClick(21, false);
    await vi.advanceTimersByTimeAsync(0);
    expect(readSave().save?.moves).toEqual([...original.moves, 'Ng1-f3']);
  });

  it('offers the start when the first action is illegal and permits New game', () => {
    const { play } = boot({ ...partial, moves: ['Qd1-d8'] });
    expect(shown().saveNotice).toContain('Loaded 0 of 1 actions.');
    expect(play.game().history).toEqual([]);
    play.newGame('RNBQKBNR');
    expect(play.savedGames.blocked()).toBe(false);
    expect(document.getElementById('recover-save')!.hidden).toBe(true);
    expect(readSave().save?.moves).toEqual([]);
  });

  it('keeps a legal pass after a partial Haste turn and drops the stale staged count', () => {
    const rules = { ...new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: parseKings('flame:haste,none') }).rules };
    const { play } = boot({ ...partial, back: '', fen: '7k/p7/8/8/8/8/8/R5K1 w - - 0 1', rules, moves: ['Ra1-a4!H', 'bad'] });
    expect(shown().saveNotice).toContain('Loaded 1 of 2 actions.');
    accept();
    expect(play.game().history.map(h => h.lan)).toEqual(['Ra1-a4!H', '--']);
    expect(readSave().save?.staged).toBeUndefined();
    expect(play.game().pos.turn).toBe(1);
  });

  it('keeps the offer and full source when acceptance cannot save, then retries', () => {
    const { play, raw, changed } = boot();
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new Error('quota'); });
    accept();
    expect(stored.get(SAVE_KEY)).toBe(raw);
    expect(play.savedGames.blocked()).toBe(true);
    expect(changed).not.toHaveBeenCalled();
    expect(shown().saveNotice).toContain('Changes not saved.');
    write.mockRestore();
    accept();
    expect(play.savedGames.blocked()).toBe(false);
    expect(readSave().save?.moves).toEqual(original.moves);
  });

  it('keeps a newer local game when the player accepts an old offer', () => {
    const { play, changed } = boot();
    const newer = JSON.stringify({ ...original, moves: ['d2-d4'] });
    stored.set(SAVE_KEY, newer);
    accept();
    expect(stored.get(SAVE_KEY)).toBe(newer);
    expect(changed).not.toHaveBeenCalled();
    expect(play.savedGames.blocked()).toBe(true);
    expect(document.getElementById('recover-save')!.hidden).toBe(true);
    expect(shown().saveNotice).toContain('another tab');
  });

  it('offers a newer partial cloud copy and leaves both full sources intact', async () => {
    const { play } = boot(original);
    const row: Row = { saved_game: { at: 500, v: partial } }, push = vi.fn(async () => row);
    const sync = new Sync(localStorage, { userId: 'player', pull: async () => row, push }, play.fromAccount, play.savedGames);
    await sync.pull();
    expect(play.game().history.map(h => h.lan)).toEqual(original.moves);
    expect(shown().saveNotice).toContain('Loaded 2 of 3 actions.');
    expect(readSave().save?.moves).toEqual(partial.moves);
    expect(row.saved_game?.v).toEqual(partial);
    expect(push).not.toHaveBeenCalled();
    sync.stop();
  });

  it.each([false, true])('keeps a newer cloud game when recovery is accepted (seen during offer: %s)', async seen => {
    const { play, changed } = boot(original);
    let row: Row = { saved_game: { at: 500, v: partial } };
    const push = vi.fn(async (sent: Row) => {
      if (sent.saved_game && sent.saved_game.at > row.saved_game!.at) row = sent;
      return row;
    });
    const sync = new Sync(localStorage, { userId: 'player', pull: async () => row, push }, play.fromAccount, play.savedGames);
    changed.mockImplementation((...args) => Reflect.apply(sync.changed, sync, args));
    await sync.pull();
    const newer = { ...original, moves: ['d2-d4'] };
    row = { saved_game: { at: 600, v: newer } };
    if (seen) await sync.pull();
    accept(); await sync.flush();
    expect(row.saved_game).toEqual({ at: 600, v: newer });
    expect(readSave().save?.moves).toEqual(newer.moves);
    expect(play.game().history.map(h => h.lan)).toEqual(newer.moves);
    expect(push.mock.calls.every(([sent]) => !sent.saved_game)).toBe(true);
    sync.stop();
  });

  it.each([501, 600])('keeps a cloud change during recovery upload (%s)', async at => {
    const { play, changed } = boot(original);
    let row: Row = { settings: { at: 500, v: { coords: true } }, saved_game: { at: 500, v: partial } };
    const newer = { ...original, moves: ['d2-d4'] };
    const sync = new Sync(localStorage, {
      userId: 'player', pull: async () => row,
      push: async sent => {
        row.saved_game = { at, v: newer };
        if (sent.saved_game && sent.saved_game.at > at) row.saved_game = sent.saved_game;
        return row;
      },
    }, play.fromAccount, play.savedGames);
    changed.mockImplementation((...args) => Reflect.apply(sync.changed, sync, args));
    await sync.pull();
    accept(); await sync.flush();
    expect(row.saved_game).toEqual({ at, v: newer });
    expect(readSave().save?.moves).toEqual(newer.moves);
    expect(play.game().history.map(h => h.lan)).toEqual(newer.moves);
    sync.stop();
  });


  it('keeps a newer local game that arrives during the recovery cloud read', async () => {
    const { play, changed } = boot(original);
    let finish!: (row: Row) => void;
    let reads = 0;
    const source: Row = { saved_game: { at: 500, v: partial } };
    const sync = new Sync(localStorage, {
      userId: 'player', pull: async () => ++reads === 1 ? source : new Promise<Row>(resolve => { finish = resolve; }),
      push: async sent => sent,
    }, play.fromAccount, play.savedGames);
    changed.mockImplementation((...args) => Reflect.apply(sync.changed, sync, args));
    await sync.pull(); accept();
    const sent = sync.flush();
    await vi.advanceTimersByTimeAsync(0);
    const newer = { ...original, moves: ['d2-d4'] };
    stored.set(SAVE_KEY, JSON.stringify(newer));
    stamp(localStorage);
    finish({ saved_game: { at: 600, v: { ...original, moves: ['c2-c4'] } } });
    await sent;
    expect(readSave().save?.moves).toEqual(newer.moves);
    sync.stop();
  });

  it('keeps a newer cloud copy with the same time after a reload', async () => {
    const { play, changed } = boot(original);
    let row: Row = { saved_game: { at: 500, v: partial } };
    const remote = { userId: 'player', pull: async () => row, push: async (sent: Row) => sent };
    const first = new Sync(localStorage, remote, play.fromAccount, play.savedGames);
    changed.mockImplementation((...args) => Reflect.apply(first.changed, first, args));
    await first.pull(); accept(); first.stop();
    const newer = { ...original, moves: ['d2-d4'] };
    row = { saved_game: { at: 501, v: newer } };
    const next = new Sync(localStorage, remote, play.fromAccount, play.savedGames);
    await next.pull();
    expect(readSave().save?.moves).toEqual(newer.moves);
    expect(play.game().history.map(h => h.lan)).toEqual(newer.moves);
    next.stop();
  });

});


describe('review recovery faults', () => {
  const partial: Save = { ...original, moves: [...original.moves, 'Qd1-d8'], resigned: 0, staged: 1 };
  const newer: Save = { ...original, moves: ['d2-d4'] };
  const clickAccept = () => {
    const button = document.getElementById('recover-save') as HTMLButtonElement;
    expect(button.hidden).toBe(false);
    button.onclick!.call(button, { detail: 0 } as PointerEvent);
  };
  function bootRecovery(accountReady = true) {
    stored.set(SAVE_KEY, JSON.stringify(partial));
    const p = page({}, null, false, accountReady), read = readSave();
    p.play.seat(partial.white, partial.black);
    p.play.restore(read.save, { ...request, unreadable: read.unreadable });
    p.play.refresh();
    const stamps = stamp(localStorage, 500);
    stamps.saved_game!.at = 500;
    localStorage.setItem('kingdown.sync', JSON.stringify(stamps));
    return p;
  }
  function cloud() {
    let row: Row = { saved_game: { at: 600, v: newer } };
    return {
      get row() { return row; },
      remote: {
        userId: 'player', pull: async () => row,
        push: async (sent: Row) => {
          for (const section of ['settings', 'lessons', 'saved_game'] as const) {
            if (sent[section] && (!row[section] || sent[section]!.at > row[section]!.at)) row[section] = sent[section];
          }
          return row;
        },
      },
    };
  }

  it('P1: a failed recovery stamp must not replace a newer cloud game after reload', async () => {
    vi.setSystemTime(1_000_000);
    const { play, changed } = bootRecovery();
    changed.mockImplementation(accountChanged);
    const set = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === 'kingdown.sync') throw new Error('quota');
      set(key, value);
    };
    clickAccept();
    expect(readSave().save?.moves).toEqual(original.moves);
    expect(JSON.parse(stored.get('kingdown.sync')!).saved_game.at).toBe(500);
    localStorage.setItem = set;
    // main.ts calls account.changed() once on load, with no recovery argument.
    accountChanged();
    const c = cloud();
    const sync = new Sync(localStorage, c.remote, play.fromAccount, play.savedGames);
    await sync.pull(); sync.stop();
    expect((c.row.saved_game?.v as Save).moves).toEqual(newer.moves);
  });

  it('P1: acceptance before the account module loads must not replace a newer cloud game', async () => {
    vi.setSystemTime(1_000_000);
    const { play, changed } = bootRecovery(false);
    // The actual page account getter is null until the dynamic import completes.
    clickAccept();
    expect(changed).not.toHaveBeenCalled();
    accountChanged();
    const c = cloud();
    const sync = new Sync(localStorage, c.remote, play.fromAccount, play.savedGames);
    await sync.pull(); sync.stop();
    expect((c.row.saved_game?.v as Save).moves).toEqual(newer.moves);
  });

  it('control: a failed second save read keeps the full source', () => {
    const { play } = bootRecovery();
    const get = localStorage.getItem.bind(localStorage);
    let reads = 0;
    localStorage.getItem = key => {
      if (key === SAVE_KEY && ++reads === 2) throw new Error('read blocked');
      return get(key);
    };
    clickAccept();
    localStorage.getItem = get;
    expect(readSave().save?.moves).toEqual(partial.moves);
    expect(play.savedGames.blocked()).toBe(true);
  });


  it('P2: an identical upload reply must not cancel a move in progress', async () => {
    const { play, view, changed } = bootRecovery();
    let row: Row = { saved_game: { at: 500, v: partial } };
    let reply!: () => void;
    const remote = {
      userId: 'player', pull: async () => row,
      push: async (sent: Row) => {
        row = { ...row, ...sent };
        return new Promise<Row>(resolve => { reply = () => resolve(row); });
      },
    };
    const sync = new Sync(localStorage, remote, play.fromAccount, play.savedGames);
    changed.mockImplementation((...args) => Reflect.apply(sync.changed, sync, args));
    await sync.pull(); clickAccept();
    const upload = sync.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(reply).toBeTypeOf('function');
    let finish!: () => void;
    vi.mocked(view.animateMove).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    view.onSquareClick(6, false); view.onSquareClick(21, false);
    expect(play.game().history.map(h => h.lan)).toEqual([...original.moves, 'Ng1-f3']);
    reply(); await upload;
    finish(); await vi.advanceTimersByTimeAsync(0);
    sync.stop();
    expect(play.game().history.map(h => h.lan)).toEqual([...original.moves, 'Ng1-f3']);
  });

  it('P2: a partial cloud save must give a recovery path on a FEN page', async () => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const { play } = page({}, '7k/8/8/8/8/8/8/K6R w - - 0 1');
    play.restore(original, request); play.refresh();
    const row: Row = { saved_game: { at: 500, v: partial } };
    const sync = new Sync(localStorage, { userId: 'player', pull: async () => row, push: async () => row }, play.fromAccount, play.savedGames);
    await sync.pull(); sync.stop();
    expect(play.savedGames.blocked() && document.getElementById('recover-save')!.hidden).toBe(false);
  });


  it('control: a stored recovery stamp keeps the newer cloud game', async () => {
    vi.setSystemTime(1_000_000);
    const { play, changed } = bootRecovery();
    changed.mockImplementation(accountChanged);
    clickAccept();
    accountChanged();
    const c = cloud();
    const sync = new Sync(localStorage, c.remote, play.fromAccount, play.savedGames);
    await sync.pull(); sync.stop();
    expect((c.row.saved_game?.v as Save).moves).toEqual(newer.moves);
  });


  it('control: partial cloud recovery leaves a lesson and saves the recovered match', async () => {
    stored.set(SAVE_KEY, JSON.stringify(original));
    const { play, changed } = page();
    play.restore(original, request);
    play.startLesson(4);
    expect(vi.mocked(refreshTable).mock.lastCall![0].lesson).toBe(4);
    const row: Row = { saved_game: { at: 500, v: partial } };
    const sync = new Sync(localStorage, { userId: 'player', pull: async () => row, push: async sent => sent }, play.fromAccount, play.savedGames);
    changed.mockImplementation((...args) => Reflect.apply(sync.changed, sync, args));
    await sync.pull();
    expect(vi.mocked(refreshTable).mock.lastCall![0].lesson).toBe(null);
    expect(readSave().save?.moves).toEqual(partial.moves);
    clickAccept(); sync.stop();
    expect(readSave().save?.moves).toEqual(original.moves);
    expect(play.game().history.map(h=>h.lan)).toEqual(original.moves);
  });
});


it.each([1, 2])('keeps focus and the source after recovery read failure %s', readNumber => {
  const partial = { ...original, moves: [...original.moves, 'bad'] };
  stored.set(SAVE_KEY, JSON.stringify(partial));
  const { play } = page();
  play.restore(partial, request); play.refresh();
  const get = localStorage.getItem.bind(localStorage);
  let reads = 0;
  localStorage.getItem = key => {
    if (key === SAVE_KEY && ++reads === readNumber) throw new Error('read blocked');
    return get(key);
  };
  const button = document.getElementById('recover-save') as HTMLButtonElement;
  button.onclick!.call(button, { detail: 0 } as PointerEvent);
  localStorage.getItem = get;
  expect(readSave().save?.moves).toEqual(partial.moves);
  const target = document.getElementById(button.hidden ? 'menu-btn' : 'recover-save')!;
  expect(target.focus).toHaveBeenCalled();
  expect(play.savedGames.blocked()).toBe(true);
});
