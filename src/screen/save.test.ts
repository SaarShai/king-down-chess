import { afterEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS as SYNCED } from '../account/sync';
import { readSave, savedGame, SAVE_KEY, SETTINGS, writeSave, type Save } from './save';
import { settingsOf } from './settings';
import { toFen } from '../rules/setup';
import { RULES_2017 } from '../rules/rules';

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
    writeSave(game);
    expect(SAVE_KEY).toBe('kingdown.save');
    expect(s.m.get('kingdown.save')).toBe(JSON.stringify(game));
    expect(readSave()).toEqual({ save: game, unreadable: false });
  });

  it('distinguishes unreadable stored data from no save and leaves its raw bytes alone', () => {
    const s = storage();
    vi.stubGlobal('localStorage', s);
    s.m.set(SAVE_KEY, '{');
    expect(readSave()).toEqual({ save: null, unreadable: true });
    expect(s.m.get(SAVE_KEY)).toBe('{');
    s.m.set(SAVE_KEY, JSON.stringify({ ...game, moves: 'e2-e4' }));
    expect(readSave()).toEqual({ save: null, unreadable: true });
    expect(s.m.get(SAVE_KEY)).toBe(JSON.stringify({ ...game, moves: 'e2-e4' }));
  });

  it('plays on without a save when the storage refuses it (private mode, a full quota)', () => {
    vi.stubGlobal('localStorage', storage(true));
    expect(() => writeSave(game)).not.toThrow();
    expect(readSave()).toEqual({ save: null, unreadable: false });
  });

  it('does not treat a denied storage read as existing unreadable saved data', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new DOMException('Denied', 'SecurityError'); } });
    expect(readSave()).toEqual({ save: null, unreadable: false });
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
    { ...base, moves: ['e2-e4', 'e7-e5', 'Qd1-d8'] },
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
