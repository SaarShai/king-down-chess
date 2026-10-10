import { afterEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS as SYNCED } from '../account/sync';
import { readSave, SAVE_KEY, SETTINGS, writeSave, type Save } from './save';
import { settingsOf } from './settings';

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
    expect(readSave()).toBeNull();
    writeSave(game);
    expect(SAVE_KEY).toBe('kingdown.save');
    expect(s.m.get('kingdown.save')).toBe(JSON.stringify(game));
    expect(readSave()).toEqual(game);
  });

  it('reads no save from bad JSON or a save with no move list', () => {
    const s = storage();
    vi.stubGlobal('localStorage', s);
    s.m.set(SAVE_KEY, '{');
    expect(readSave()).toBeNull();
    s.m.set(SAVE_KEY, JSON.stringify({ ...game, moves: 'e2-e4' }));
    expect(readSave()).toBeNull();
  });

  it('plays on without a save when the storage refuses it (private mode, a full quota)', () => {
    vi.stubGlobal('localStorage', storage(true));
    expect(() => writeSave(game)).not.toThrow();
    expect(readSave()).toBeNull();
  });
});
