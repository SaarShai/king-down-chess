import { afterEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS as SYNCED } from '../account/sync';
import { gameJSON, readSave, savedGame, SAVE_KEY, SETTINGS, storedSettings, writeSave, type Save } from './save';
import { settingsOf } from './settings';
import { toFen } from '../rules/setup';
import { RULES_2017 } from '../rules/rules';
import { Game } from '../game';

const controls = { skill: 'club', coords: true, sound: false, queen: true, pace: 'fast', threats: false, labels: false } as const;

describe("the save's settings fields", () => {
  it('are the fields that account/sync.ts syncs as settings', () => {
    expect([...SETTINGS]).toEqual(SYNCED);
  });

  it('settingsNow writes each of them, in this order, and no other field', () => {
    expect(Object.keys(settingsOf(controls))).toEqual([...SETTINGS]);
  });

  it('copies the plain control values; Piece letters is written only when on', () => {
    expect(JSON.stringify(settingsOf(controls))).toBe('{"skill":"club","coords":true,"sound":false,"queen":true,"pace":"fast","threats":false}');
    expect(settingsOf({ ...controls, labels: true }).labels).toBe(true);
  });
});

/** localStorage stand-in. */
const storage = (fail = false) => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { if (fail) throw new Error('QuotaExceededError'); m.set(k, v); }, m };
};

describe('the autosave', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  const game: Save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', coords: true, resigned: null };

  it('writes the snapshot it gets under kingdown.save, and reads it back', () => {
    const s = storage();
    vi.stubGlobal('localStorage', s);
    expect(readSave()).toEqual({ save: null, unreadable: false });
    expect(writeSave(game)).toBe(true);
    expect(SAVE_KEY).toBe('kingdown.save');
    expect(s.m.get('kingdown.save')).toBe(JSON.stringify(game));
    expect(readSave()).toEqual({ save: game, unreadable: false });
  });

  it('distinguishes unreadable stored data from no save and leaves its raw bytes alone', () => {
    const s = storage();
    vi.stubGlobal('localStorage', s);
    s.m.set(SAVE_KEY, '{');
    expect(readSave()).toEqual({ save: null, unreadable: true, raw: '{' });
    expect(s.m.get(SAVE_KEY)).toBe('{');
    s.m.set(SAVE_KEY, JSON.stringify({ ...game, moves: 'e2-e4' }));
    expect(readSave()).toEqual({ save: null, unreadable: true, raw: JSON.stringify({ ...game, moves: 'e2-e4' }) });
    expect(s.m.get(SAVE_KEY)).toBe(JSON.stringify({ ...game, moves: 'e2-e4' }));
  });

  it('keeps the settings of stored data whose game cannot replay, and only those fields', () => {
    const s = storage();
    vi.stubGlobal('localStorage', s);
    expect(storedSettings()).toBeNull();
    s.m.set(SAVE_KEY, '{');
    expect(storedSettings()).toBeNull();
    s.m.set(SAVE_KEY, JSON.stringify({ moves: [], pace: 'off', sound: false }));
    expect(readSave()).toEqual({ save: null, unreadable: true, raw: JSON.stringify({ moves: [], pace: 'off', sound: false }) });
    expect(storedSettings()).toEqual({ pace: 'off', sound: false });
    expect(s.m.get(SAVE_KEY)).toBe(JSON.stringify({ moves: [], pace: 'off', sound: false }));
  });

  it('plays on without a save when the storage refuses it (private mode, a full quota)', () => {
    vi.stubGlobal('localStorage', storage(true));
    expect(writeSave(game)).toBe(false);
    expect(readSave()).toEqual({ save: null, unreadable: false });
  });

  it('does not treat a denied storage read as existing unreadable saved data', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new DOMException('Denied', 'SecurityError'); } });
    expect(readSave()).toEqual({ save: null, unreadable: false, failed: true });
  });
});

describe('saved game candidates', () => {
  const base = { back: 'RNBQKBNR', fen: '', white: 'human', black: 'human', coords: true, resigned: null } as const;
  it.each([
    ['army without stored rules', { ...base, moves: ['e2-e4', 'c7-c5', 'Ng1-f3', 'd7-d6'] }],
    ['stored older rules', { ...base, rules: RULES_2017, moves: ['e2-e4', 'e7-e5'] }],
    ['fairy FEN and history', { ...base, back: '', fen: '3r3k/8/2p3p1/5p2/A3S3/8/8/K2L4 w - - 0 1', moves: ['Ld1xd8', 'Kh8-h7', 'Aa4*c6', 'Kh7-h8', 'Se4xf5xg6'] }],
  ])('continues and reloads a supported legacy %s', (_name, save) => {
    const game = savedGame(save);
    expect(game.history.map(h => h.lan)).toEqual(save.moves);
    expect(game.status).toBe('playing');
    const next = game.legal[0], lan = game.context.toLan(game.pos, next);
    game.play(next);
    const continued = { ...save, moves: [...save.moves, lan] }, reloaded = savedGame(continued);
    expect(toFen(reloaded.pos)).toBe(toFen(game.pos));
    expect(reloaded.status).toBe(game.status);
    expect(reloaded.legal).toEqual(game.legal);
    expect(reloaded.history.map(h => h.lan)).toEqual(continued.moves);
    expect(reloaded.rules).toEqual(game.rules);
  });

  it.each([
    { ...base, back: 'bad', moves: [] },
    { ...base, back: '', fen: 'bad', moves: [] },
    { ...base, rules: { kings: null }, moves: [] },
    { ...base, rules: 'new-format', moves: [] },
    { ...base, moves: [null] },
  ])('refuses an unreadable candidate without changing its source or another game ($back)', save => {
    const current = savedGame({ ...base, moves: ['d2-d4'] }), before = toFen(current.pos), raw = JSON.stringify(save);
    expect(() => savedGame(save)).toThrow();
    expect(JSON.stringify(save)).toBe(raw);
    expect(toFen(current.pos)).toBe(before);
    expect(current.history.map(h => h.lan)).toEqual(['d2-d4']);
  });

  it.each([0, 2])('keeps the full source and returns its %s legal actions', count => {
    const save = { ...base, moves: [...['e2-e4', 'e7-e5'].slice(0, count), 'Qd1-d8', 'Nb8-c6'] };
    const raw = JSON.stringify(save), s = storage();
    vi.stubGlobal('localStorage', s);
    s.m.set(SAVE_KEY, raw);
    try {
      expect(savedGame(save).history.map(h => h.lan)).toEqual(save.moves.slice(0, count));
      expect(readSave()).toMatchObject({ save, unreadable: false, partial: true, raw });
      expect(s.m.get(SAVE_KEY)).toBe(raw);
    } finally { vi.unstubAllGlobals(); }
  });

  it.each([
    ['drawRepetition', { back: base.back, fen: '', moves: ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8', 'Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8'] }, 'e2-e4'],
    ['draw50', { back: '', fen: '7k/p7/8/8/8/8/8/KR6 w - - 99 1', moves: ['Rb1-b2'] }, 'a7-a6'],
  ])('keeps the valid part and full source after %s', (status, prefix, extra) => {
    const valid = { ...base, ...prefix, rules: { classicChess: true } };
    const ended = savedGame(valid);
    expect(ended.status).toBe(status);
    expect(ended.history.map(h => h.lan)).toEqual(prefix.moves);
    const save = { ...valid, moves: [...prefix.moves, extra] };
    const raw = JSON.stringify(save), s = storage();
    vi.stubGlobal('localStorage', s);
    s.m.set(SAVE_KEY, raw);
    try {
      const recovered = savedGame(save);
      expect(recovered.status).toBe(status);
      expect(recovered.history.map(h => h.lan)).toEqual(prefix.moves);
      expect(toFen(recovered.pos)).toBe(toFen(ended.pos));
      expect(readSave()).toEqual({ save, unreadable: false, partial: true, raw });
      expect(s.m.get(SAVE_KEY)).toBe(raw);
      expect(JSON.stringify(save)).toBe(raw);
    } finally { vi.unstubAllGlobals(); }
  });

  it.each([
    ['Freeze', '4k3/8/8/3n4/3O4/8/8/4K3 w - - 0 1', ['!F:d5', 'Od4>d5-d6', 'Nd6-f7']],
    ['IceWall', '2r1k3/8/8/8/3N4/8/8/4K3 w - - 0 1', ['!W:d4', 'Nd4-c6', 'Rc8xc6']],
  ] as const)('keeps two actions when a moved piece keeps its %s mark', (power, fen, moves) => {
    const rules = { ...new Game('RNBQKBNR', { markFree: true, kings: [{ king: 'Frost', power }, null] }).rules };
    const game = savedGame({ ...base, back: '', fen, moves: [...moves], rules });
    expect(game.history.map(h => h.lan)).toEqual(moves.slice(0, 2));
    expect(game.legal.map(m => game.context.toLan(game.pos, m))).not.toContain(moves[2]);
  });

  it('continues the historical spent-Strike FEN without restoring the spent use', () => {
    const save = { ...base, back: '', fen: '7k/8/8/8/8/8/8/K6R w - - 0 1 w', moves: [], rules: { kings: [{ king: 'Flame', power: 'Strike' }, null] } };
    const game = savedGame(save);
    expect(game.pos.used).toEqual([1, 0]);
    const move = game.legal[0], lan = game.context.toLan(game.pos, move);
    game.play(move);
    const reloaded = savedGame({ ...save, moves: [lan] });
    expect(toFen(reloaded.pos)).toBe(toFen(game.pos));
    expect(reloaded.pos.used).toEqual([1, 0]);
  });
});


describe('atomic game time', () => {
  afterEach(() => vi.unstubAllGlobals());
  const game: Save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', coords: true, resigned: null, gameAt: 500 };

  it('writes the game and time once without reading the sync record', () => {
    const s = storage(), set = vi.fn(s.setItem), get = s.getItem;
    vi.stubGlobal('localStorage', { ...s, setItem: set, getItem: (key: string) => {
      if (key === 'kingdown.sync') throw new Error('sync read denied');
      return get(key);
    } });
    expect(writeSave(game)).toBe(true);
    expect(set.mock.calls).toEqual([[SAVE_KEY, JSON.stringify(game)]]);
    expect(readSave().save).toEqual(game);
  });

  it('keeps both the old game and its time if the one write fails', () => {
    const s = storage(true);
    s.m.set(SAVE_KEY, JSON.stringify(game));
    vi.stubGlobal('localStorage', s);
    expect(writeSave({ ...game, moves: ['d2-d4'], gameAt: 600 })).toBe(false);
    expect(readSave().save).toEqual(game);
  });

  it('does not count game time or recovery status as a player change', () => {
    expect(gameJSON(game)).toBe(gameJSON({ ...game, gameAt: 600, recovery: 500 }));
  });
});
