import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectPlay } from './play';
import { defaultSetup } from '../new-game';
import type { Engine } from '../game';
import type { BoardView } from '../render/PaintedView';
import { connectTurnPress } from '../turn-controls';
import { readSave, SAVE_KEY, type Save } from './save';
import { stamp, Sync } from '../account/sync';
import { toFen } from '../rules/setup';
import { POWERS_BALANCED, RULES_2017, parseKings, type Rules } from '../rules/engine';
import { refreshTable, renderTable } from '../ui/table';

vi.mock('../render/sfx', () => ({ setSound: vi.fn(), snd: {} }));
vi.mock('../ui/table', () => ({ readPiece: vi.fn(), refreshTable: vi.fn(), renderTable: vi.fn() }));
vi.mock('../ui/powers', () => ({ clearCoinRead: vi.fn(), initCoins: vi.fn(), refreshCoins: () => ({ armed: false }) }));
vi.mock('../move-moments', () => ({ connectMoveMoments: () => ({ cancel: vi.fn(), undo: vi.fn() }) }));
vi.mock('../game-end', () => ({ connectEndReview: vi.fn(), connectGameEnd: () => ({ reset: vi.fn(), refresh: vi.fn() }) }));
vi.mock('../turn-controls', () => ({ connectTurnPress: vi.fn(), renderTurnButton: vi.fn(), announceWaiting: vi.fn(), waitingRead: vi.fn() }));
vi.mock('../ui/previously', () => ({ connectPreviously: (_button: unknown, c: { game(): { pos: unknown } }) => ({ clear: vi.fn(), position: () => c.game().pos, state: vi.fn() }) }));
vi.mock('./moments', () => ({ soundsFor: vi.fn(), connectMoments: () => ({ clear: vi.fn(), start: vi.fn(), restore: vi.fn(), say: vi.fn(), result: () => '', reviewNote: () => '', marked: () => [] }) }));
vi.mock('./links', () => ({ connectLinks: () => ({}) }));
vi.mock('../lesson-shelf', () => ({ lessonShelf: () => ({ next: null }) }));

const stored = new Map<string, string>();
const original: Save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', coords: true, resigned: null };
const request = { link: false, continues: false, urlRules: false, title: false, unreadable: false, notice: '' };
beforeEach(() => {
  vi.clearAllMocks(); stored.clear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) });
  const nodes = new Map<string, object>(), node = () => ({ setAttribute: vi.fn(), appendChild: vi.fn(), close: vi.fn(), querySelector: () => null, style: {} });
  vi.stubGlobal('document', { hidden: false, documentElement: { dataset: { pace: 'off' } }, addEventListener: vi.fn(), removeEventListener: vi.fn(), querySelector: () => null, querySelectorAll: () => [], createElement: node, getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} });
});
afterEach(() => { vi.unstubAllGlobals(); });

function page(rules: Partial<Rules> = {}) {
  const view = { setRules: vi.fn(), sync: vi.fn(), flip: vi.fn(), highlight: vi.fn(), setPreview: vi.fn(), skip: vi.fn() } as unknown as BoardView;
  const engine = { cancel: vi.fn(), think: vi.fn().mockResolvedValue({ move: null }) }, changed = vi.fn();
  const settings = { pace: () => 'off', threats: () => false, queen: () => true, settingsNow: () => ({ coords: true }), applySettings: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['settings'];
  const play = connectPlay(view, { params: new URLSearchParams(), preset: undefined, rules, withPowers: () => ({}), fen: null,
    engine: engine as unknown as Engine, guide: { fill: vi.fn() }, settings,
    home: { visible: false, close: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['home'],
    keys: () => ({ cursor: () => null, say: vi.fn(), focus: vi.fn() }), account: () => ({ changed }),
    setup: () => ({ ...defaultSetup(), mode: 'two' }), openNewGame: vi.fn(),
  });
  return { play, view, engine, changed };
}

describe('local save recovery on the game page', () => {
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
    const sync = new Sync(localStorage, { pull: async () => ({ settings: { at: 9_000_000, v: { sound: false } } }), push }, onApply, play.savedGames);
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
  const shownNotice = () => vi.mocked(refreshTable).mock.lastCall![0].notice;
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
