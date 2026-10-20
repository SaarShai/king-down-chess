import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectPlay } from './play';
import { defaultSetup } from '../new-game';
import type { Engine } from '../game';
import type { BoardView } from '../render/PaintedView';
import { connectTurnPress } from '../turn-controls';
import { readSave, SAVE_KEY, type Save } from './save';
import { stamp, Sync } from '../account/sync';
import { toFen } from '../rules/setup';

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
  const nodes = new Map<string, object>(), node = () => ({ setAttribute: vi.fn(), appendChild: vi.fn(), close: vi.fn(), style: {} });
  vi.stubGlobal('document', { createElement: node, getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('ResizeObserver', class { observe() {} });
});
afterEach(() => { vi.unstubAllGlobals(); });

function page() {
  const view = { setRules: vi.fn(), sync: vi.fn(), flip: vi.fn(), highlight: vi.fn(), setPreview: vi.fn() } as unknown as BoardView;
  const engine = { cancel: vi.fn(), think: vi.fn().mockResolvedValue({ move: null }) }, changed = vi.fn();
  const settings = { pace: () => 'off', threats: () => false, queen: () => true, settingsNow: () => ({ coords: true }), applySettings: vi.fn() } as unknown as Parameters<typeof connectPlay>[1]['settings'];
  const play = connectPlay(view, { params: new URLSearchParams(), preset: undefined, rules: {}, withPowers: () => ({}), fen: null,
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
