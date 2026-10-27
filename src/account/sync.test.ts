import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { merge, readLocal, stamp, Sync, type Remote, type Row, type SavedGameAccess, type Section } from './sync';
import { savedGame } from '../screen/save';
import { gameTime, localAccess } from './local';

/** localStorage stand-in. */
const store = (init: Record<string, unknown> = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; }, m };
};
/** Simulate a player change with the same game-and-time write as the page. */
function change(st: ReturnType<typeof store>, value: object, seenAt = 0): void {
  let prior = null;
  try { prior = JSON.parse(st.getItem('kingdown.save') ?? 'null'); } catch { /* New game replaces unreadable data. */ }
  const gameAt = Math.max(Date.now(), gameTime(prior) + 1, seenAt + 1);
  st.setItem('kingdown.save', JSON.stringify({ ...value, gameAt }));
}
/** The database keeps jsonb with its keys in its own order: reverse them to be sure order never matters. */
const reorder = (v: unknown): unknown => Array.isArray(v) ? v.map(reorder)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, reorder(x)])) : v;
/** The player's user_data row, shared by every "device" in a test. */
const cloud = (row: Row | null = null, userId = 'player') => {
  const r = { row, pulls: 0, pushes: 0, fail: 0 } as { row: Row | null; pulls: number; pushes: number; fail: number };
  const remote: Remote = {
    userId,
    async pull() { r.pulls++; if (r.fail > 0) { r.fail--; throw new Error('offline'); } return r.row && reorder(r.row) as Row; },
    async push(part) {
      r.pushes++;
      if (r.fail > 0) { r.fail--; throw new Error('offline'); }
      // Like the database (0001_accounts.sql): a section is kept only when the one sent is newer.
      const next: Row = { ...r.row };
      for (const s of Object.keys(part) as Section[]) if (!next[s] || part[s]!.at > next[s]!.at) next[s] = reorder(part[s]) as Row[Section];
      r.row = next;
      return reorder(next) as Row;
    },
  };
  return Object.assign(r, { remote });
};
const save = (moves: string[], sound = true) => ({
  back: 'RNBQKBNR', fen: 'x', moves, white: 'human', black: 'ai', link: null, daily: null, resigned: null, rules: { a: 1, b: 2 },
  think: 800, skill: 'club', coords: true, sound, queen: false, pace: 'normal', threats: false, labels: true,
});
/** A settings stamp from a version that kept `think` in the settings. */
const oldSettings = (sound = true) => JSON.stringify(Object.fromEntries(Object.entries({ ...readLocal(store({ 'kingdown.save': save([], sound) })).settings as object, think: 800 })
  .sort(([a], [b]) => (a < b ? -1 : 1))));
const device = (s: Record<string, unknown>, c: ReturnType<typeof cloud>, access: SavedGameAccess = { blocked: () => false, accepts: () => true }) => {
  const st = store(s), applied: Section[][] = [];
  return { st, applied, sync: new Sync(st, c.remote, d => applied.push(d), access) };
};

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1_000_000); });
afterEach(() => { vi.useRealTimers(); });

describe('F1 account ownership', () => {
  it('review 7: keeps a second tab move after a failed upload and A, B, C, D, E, A', async () => {
    const a = cloud(null, 'A'), d = device({ 'kingdown.save': save(['e2-e4']) }, a);
    await d.sync.pull();
    const tab2 = { ...d.st }, get = d.st.getItem;
    let reads = 0;
    d.st.getItem = key => {
      const raw = get(key);
      // The second save read checks the cloud copy. The other tab writes after that read.
      if (key === 'kingdown.save' && ++reads === 2) change(tab2, save(['e2-e4', 'e7-e5']));
      return raw;
    };
    const push = vi.fn(async (_row: Row): Promise<Row> => { throw new Error('offline'); });
    a.remote.push = push;
    await d.sync.pull(); d.sync.stop();
    d.st.getItem = get;
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ saved_game: expect.objectContaining({ v: expect.objectContaining({ moves: ['e2-e4', 'e7-e5'] }) }) }));
    expect(a.row?.saved_game?.v).toMatchObject({ moves: ['e2-e4'] });
    for (const userId of ['B', 'C', 'D', 'E']) {
      const next = new Sync(d.st, cloud(null, userId).remote, () => {}, { blocked: () => false, accepts: () => true });
      await next.pull();
      change(d.st, save(['d2-d4']));
      next.changed(); await next.flush(); next.stop();
    }
    const returned = new Sync(d.st, a.remote, () => {}, { blocked: () => false, accepts: () => true });
    await returned.pull(); returned.stop();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['e2-e4', 'e7-e5'] });
  });

  it('review storage: limits confirmed copies and keeps copies with unknown status', async () => {
    const st = store({ 'kingdown.save': save(['e2-e4']) });
    for (let i = 0; i < 5; i++) st.setItem(`kingdown.local.old-${i}`, JSON.stringify([null, null, null]));
    for (const userId of ['A', 'B', 'C', 'D', 'E']) {
      const c = cloud(null, userId), sync = new Sync(st, c.remote, () => {}, { blocked: () => false, accepts: () => true });
      await sync.pull();
      change(st, save([userId === 'D' ? 'd2-d4' : 'e2-e4']));
      sync.changed(); await sync.flush(); sync.stop();
    }
    expect([...st.m.keys()].filter(key => key.startsWith('kingdown.local.')).length).toBeLessThanOrEqual(8);
    for (let i = 0; i < 5; i++) expect(st.getItem(`kingdown.local.old-${i}`)).toBe(JSON.stringify([null, null, null]));
    expect(st.getItem('kingdown.local.A')).toBeNull();
    expect(st.getItem('kingdown.local.B')).not.toBeNull();
    const d = new Sync(st, cloud(null, 'D').remote, () => {}, { blocked: () => false, accepts: () => true });
    await d.pull(); d.stop();
    expect(readLocal(st).saved_game).toMatchObject({ moves: ['d2-d4'] });
  });

  it.each(['signed out', 'failed sync', 'no receipt'])('review 5: keeps A through four accounts after %s', async state => {
    const a = cloud(null, 'A');
    const d = device({
      'kingdown.save': save(state === 'no receipt' ? ['e2-e4', 'e7-e5'] : ['e2-e4']),
      'kingdown.lessons': { done: state === 'no receipt' ? ['Archer', 'Guard'] : ['Archer'] },
    }, a);
    if (state === 'no receipt') a.remote.push = async () => null;
    await d.sync.pull();
    if (state === 'signed out') d.sync.stop();
    change(d.st, save(['e2-e4', 'e7-e5']));
    d.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Guard'] }));
    if (state === 'failed sync') {
      a.fail = 1; d.sync.changed(); await d.sync.flush();
    }
    d.sync.stop();
    for (const userId of ['B', 'C', 'D']) {
      const next = new Sync(d.st, cloud(null, userId).remote, () => {}, { blocked: () => false, accepts: () => true });
      await next.pull(); next.stop();
    }
    expect(a.row?.saved_game?.v).not.toMatchObject({ moves: ['e2-e4', 'e7-e5'] });
    const returned = new Sync(d.st, a.remote, () => {}, { blocked: () => false, accepts: () => true });
    await returned.pull(); returned.stop();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['e2-e4', 'e7-e5'] });
    expect(readLocal(d.st).lessons).toEqual({ done: ['Archer', 'Guard'] });
  });

  it('binds A before its first cloud read, even when A is offline', async () => {
    const a = cloud(null, 'A'), b = cloud(null, 'B');
    const d = device({ 'kingdown.save': save(['e2-e4']), 'kingdown.lessons': { done: ['Archer'] } }, a);
    a.fail = 1;
    await d.sync.pull(); d.sync.stop();
    const switched = new Sync(d.st, b.remote, () => {}, { blocked: () => false, accepts: () => true });
    await switched.pull(); switched.stop();
    expect(b.pushes).toBe(0);
    expect(readLocal(d.st).lessons).toBeNull();
    const returned = new Sync(d.st, a.remote, () => {}, { blocked: () => false, accepts: () => true });
    await returned.pull(); returned.stop();
    expect(a.row?.saved_game?.v).toMatchObject({ moves: ['e2-e4'] });
  });

  it.each([true, false])('keeps A out of B and restores A on return (B has data: %s)', async existing => {
    const a = cloud(null, 'A'), b = cloud(existing ? {
      saved_game: { at: 500, v: save(['d2-d4'], false) }, lessons: { at: 500, v: { done: ['Guard'] } },
    } : null, 'B');
    const d = device({ 'kingdown.save': save(['e2-e4']), 'kingdown.lessons': { done: ['Archer'] }, 'kingdown.sync': {} }, a);
    await d.sync.pull();
    d.sync.stop();
    // Sign-out keeps the game; play while signed out still belongs to A.
    change(d.st, save(['e2-e4', 'e7-e5']));
    stamp(d.st);
    const kept = ['kingdown.save', 'kingdown.lessons'].map(k => d.st.getItem(k));
    const times = stamp(d.st);
    const switched = new Sync(d.st, b.remote, () => {}, { blocked: () => false, accepts: () => true });
    await switched.pull();
    expect(b.row?.saved_game?.v ?? null).toEqual(existing ? save(['d2-d4'], false) : null);
    expect(readLocal(d.st).lessons).toEqual(existing ? { done: ['Guard'] } : null);
    expect(readLocal(d.st).saved_game).toEqual(existing ? readLocal(store({ 'kingdown.save': save(['d2-d4']) })).saved_game : null);
    switched.stop();
    const returned = new Sync(d.st, a.remote, () => {}, { blocked: () => false, accepts: () => true });
    await returned.pull();
    expect(['kingdown.save', 'kingdown.lessons'].map(k => d.st.getItem(k))).toEqual(kept);
    for (const section of ['settings', 'lessons', 'saved_game'] as const) expect(stamp(d.st)[section]).toEqual(times[section]);
    expect(a.row?.saved_game?.v).toMatchObject({ moves: ['e2-e4', 'e7-e5'] });
    returned.stop();
  });

  it('does not apply or send an old request after another account owns the local copy', async () => {
    const a = cloud(null, 'A'), b = cloud({ saved_game: { at: 500, v: save(['d2-d4']) } }, 'B');
    const d = device({ 'kingdown.save': save(['e2-e4']) }, a);
    await d.sync.pull();
    let resolve!: (row: Row) => void;
    a.remote.pull = () => new Promise(r => { resolve = r; });
    const pending = d.sync.pull();
    await Promise.resolve();
    const switched = new Sync(d.st, b.remote, () => {}, { blocked: () => false, accepts: () => true });
    await switched.pull();
    resolve({ saved_game: { at: 9_000_000, v: save(['a2-a3']) } });
    await pending;
    d.sync.changed(); await d.sync.flush();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['d2-d4'] });
    expect(a.row?.saved_game?.v).toMatchObject({ moves: ['e2-e4'] });
    d.sync.stop(); switched.stop();
  });

  it.each(['archive', 'restore'])('keeps A when storage fails during %s, then completes B after reload', async phase => {
    const a = cloud(null, 'A'), b = cloud({ saved_game: { at: 500, v: save(['d2-d4']) } }, 'B');
    const d = device({ 'kingdown.save': save(['e2-e4']), 'kingdown.lessons': { done: ['Archer'] } }, a);
    await d.sync.pull(); d.sync.stop();
    const kept = d.st.getItem('kingdown.save'), set = d.st.setItem, remove = d.st.removeItem;
    let fail = true;
    d.st.setItem = (key, value) => {
      if (fail && key === (phase === 'archive' ? 'kingdown.local.A' : 'kingdown.lessons')) { fail = false; throw new Error('quota'); }
      set(key, value);
    };
    d.st.removeItem = key => {
      if (fail && phase === 'restore' && key === 'kingdown.lessons') { fail = false; throw new Error('quota'); }
      remove(key);
    };
    const switched = new Sync(d.st, b.remote, () => {}, { blocked: () => false, accepts: () => true });
    await switched.pull(); switched.stop();
    expect(b.pushes).toBe(0);
    const reloaded = new Sync(d.st, b.remote, () => {}, { blocked: () => false, accepts: () => true });
    await reloaded.pull(); reloaded.stop();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['d2-d4'] });
    const returned = new Sync(d.st, a.remote, () => {}, { blocked: () => false, accepts: () => true });
    await returned.pull(); returned.stop();
    expect(d.st.getItem('kingdown.save')).toBe(kept);
    expect(readLocal(d.st).lessons).toEqual({ done: ['Archer'] });
  });
});

describe('saved-game validation before cloud writes', () => {
  const supported = (moves: string[]) => ({ back: 'RNBQKBNR', fen: '', moves, white: 'human', black: 'human', resigned: null });
  const accepts = (value: unknown, partial = false): boolean => { try { const game = savedGame(value); return partial || game.history.length === (value as { moves: string[] }).moves.length; } catch { return false; } };

  it.each([
    { moves: 'future-format' }, 'unreadable',
  ])('keeps a valid local game and its stamp when a newer remote game is unreadable (%s)', async bad => {
    const c = cloud({ saved_game: { at: 9_000_000, v: bad } }), d = device({ 'kingdown.save': supported(['e2-e4']) }, c, { blocked: () => false, accepts });
    const before = stamp(d.st), raw = d.st.getItem('kingdown.save');
    await d.sync.pull();
    expect(d.st.getItem('kingdown.save')).toBe(raw);
    expect(stamp(d.st).saved_game).toEqual(before.saved_game);
    expect(d.applied).toEqual([]);
    expect(c.row?.saved_game).toEqual({ at: 9_000_000, v: bad });
    // The valid game remains playable; its next saved move supersedes the rejected future timestamp.
    change(d.st, supported(['e2-e4', 'e7-e5']), 9_000_000);
    d.sync.changed();
    await vi.advanceTimersByTimeAsync(2000);
    expect(c.row?.saved_game).toMatchObject({ at: 9_000_001, v: { moves: ['e2-e4', 'e7-e5'] } });
  });

  it('keeps unreadable raw local bytes through settings/game pulls and pushes until an explicit replacement', async () => {
    let blocked = true;
    const c = cloud({ settings: { at: 8_000_000, v: { sound: false } }, saved_game: { at: 9_000_000, v: supported(['e2-e4']) } });
    const d = device({}, c, { blocked: () => blocked, accepts });
    d.st.setItem('kingdown.save', '{saved raw data');
    await d.sync.pull();
    d.sync.changed(); await d.sync.flush();
    expect(d.st.getItem('kingdown.save')).toBe('{saved raw data');
    expect(d.applied).toEqual([]);
    expect(c.pushes).toBe(0);
    blocked = false;
    change(d.st, supported([]), 9_000_000);
    d.sync.changed(); await d.sync.flush();
    expect(c.row?.saved_game).toMatchObject({ at: 9_000_001, v: { moves: [] } });
  });

  it.each([100, 600])('takes a partial cloud copy only when it is newer than the local game (%s)', async at => {
    const partial = supported(['e2-e4', 'e7-e5', 'Qd1-d8']);
    const c = cloud({ saved_game: { at, v: partial } });
    const d = device({ 'kingdown.save': { ...supported(['d2-d4']), gameAt: 500 } }, c, { blocked: (): boolean => !accepts(readLocal(d.st).saved_game), accepts });
    const stamps = stamp(d.st);
    stamps.saved_game!.at = 500;
    d.st.setItem('kingdown.sync', JSON.stringify(stamps));
    await d.sync.pull();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: at > 500 ? partial.moves : ['d2-d4'] });
    expect(d.applied).toEqual(at > 500 ? [['saved_game']] : []);
    expect(c.row?.saved_game?.v).toMatchObject({ moves: at > 500 ? partial.moves : ['d2-d4'] });
    d.sync.stop();
  });

  it('still applies a newer supported remote game', async () => {
    const c = cloud({ saved_game: { at: 500, v: supported(['e2-e4', 'e7-e5']) } });
    const d = device({ 'kingdown.save': supported(['d2-d4']) }, c, { blocked: () => false, accepts });
    await d.sync.pull();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['e2-e4', 'e7-e5'] });
    expect(d.applied).toEqual([['saved_game']]);
  });

  it('never pushes an unreadable game that another local writer placed in storage', async () => {
    const c = cloud(), bad = supported(['e2-e4', 'bad']);
    const d = device({ 'kingdown.save': bad }, c, { blocked: () => false, accepts });
    await d.sync.pull();
    expect(c.row?.saved_game).toBeUndefined();
    expect(JSON.parse(d.st.getItem('kingdown.save')!)).toEqual(bad);
  });
});

describe('stamp', () => {
  it('gives data that was here before syncing existed 0, and a later change the time it happened', () => {
    const st = store({ 'kingdown.save': save([]) });
    expect(stamp(st).saved_game?.at).toBe(0);
    vi.setSystemTime(2_000_000);
    expect(stamp(st).saved_game?.at).toBe(0); // unchanged
    change(st, save(['e2-e4']));
    const s = stamp(st);
    expect([s.saved_game?.at, s.settings?.at]).toEqual([2_000_000, 0]); // only the game changed
    st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer'] }));
    expect(stamp(st).lessons?.at).toBe(2_000_000); // a new section after the first stamp is a real change
  });
  it('a change to a copy from a device whose clock runs ahead is still newer than that copy', async () => {
    const c = cloud({ saved_game: { at: 9_000_000, v: save(['e2-e4']) } }), d = device({ 'kingdown.save': save([]) }, c);
    await d.sync.pull();
    change(d.st, save(['e2-e4', 'e7-e5']));
    d.sync.changed();
    await vi.advanceTimersByTimeAsync(2000);
    expect(c.row?.saved_game).toMatchObject({ at: 9_000_001, v: { moves: ['e2-e4', 'e7-e5'] } });
  });
  it('splits the save into settings and the saved game', () => {
    const l = readLocal(store({ 'kingdown.save': save(['e2-e4']) }));
    expect(Object.keys(l.settings as object).sort()).toEqual(['coords', 'labels', 'pace', 'queen', 'skill', 'sound', 'threats']);
    expect((l.saved_game as { moves: string[] }).moves).toEqual(['e2-e4']);
    expect(l.lessons).toBeNull();
  });
  it('a field this version dropped is no change: settings stamped with the old `think` keep their time', () => {
    const st = store({ 'kingdown.save': save([]), 'kingdown.sync': { settings: { at: 5, json: oldSettings() } } });
    vi.setSystemTime(2_000_000);
    expect(stamp(st).settings?.at).toBe(5);
    change(st, save([], false));
    expect(stamp(st).settings?.at).toBe(2_000_000); // a real change
  });
});

describe('merge', () => {
  const l = (at: number, v: unknown) => ({ at, json: JSON.stringify(v) });
  it('per section: the newer copy wins; a missing side takes the other', () => {
    expect(merge({ settings: l(5, {}), saved_game: l(9, { a: 1 }) }, { settings: { at: 7, v: { x: 1 } }, saved_game: { at: 8, v: { moves: [] } }, lessons: { at: 1, v: { done: [] } } }))
      .toEqual({ down: ['settings', 'lessons'], up: ['saved_game'] });
    expect(merge({ settings: l(0, {}) }, null)).toEqual({ down: [], up: ['settings'] });
  });
  it('copies of the same time are the same copy, except two copies from before syncing: the cloud wins', () => {
    expect(merge({ settings: l(0, { sound: true }) }, { settings: { at: 0, v: { sound: false } } })).toEqual({ down: ['settings'], up: [] });
    expect(merge({ settings: l(0, { coords: true, sound: false }) }, { settings: { at: 0, v: { sound: false, coords: true } } })).toEqual({ down: [], up: [] });
    expect(merge({ settings: l(0, { sound: true }) }, { settings: { at: 0, v: { sound: true, think: 800 } } })).toEqual({ down: [], up: [] }); // a dropped field
    expect(merge({ settings: l(3, { a: 1 }) }, { settings: { at: 3, v: { a: 1, new: 1 } } })).toEqual({ down: [], up: [] });
  });
  it('ignores a cloud section it cannot use', () => {
    expect(merge({}, { settings: { at: 9, v: 'junk' }, lessons: null })).toEqual({ down: [], up: [] });
    expect(merge({}, { saved_game: { at: 9, v: { fen: 'x' } }, lessons: { at: 9, v: { done: 'Archer' } } })).toEqual({ down: [], up: [] });
    expect(merge({}, { settings: { at: 9, v: [1] } })).toEqual({ down: [], up: [] });
  });
});

describe('F4 add-only lesson completion', () => {
  it('keeps both devices\' completions when a stale device sends the newer list', async () => {
    const c = cloud({ lessons: { at: 0, v: { done: ['Archer'] } } });
    const a = device({ 'kingdown.lessons': { done: ['Archer'] } }, c), b = device({ 'kingdown.lessons': { done: ['Archer'] } }, c);
    await a.sync.pull(); await b.sync.pull();
    vi.setSystemTime(3_000_000);
    a.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Guard'] }));
    a.sync.changed(); await a.sync.flush();
    vi.setSystemTime(4_000_000);
    b.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Ogre'] }));
    b.sync.changed(); await b.sync.flush();
    expect(c.row?.lessons?.v).toEqual({ done: ['Archer', 'Guard', 'Ogre'] });
    expect(readLocal(b.st).lessons).toEqual(c.row?.lessons?.v);
    a.sync.stop(); b.sync.stop();
  });

  it.each([1000, 2_000_000, 9_000_000])('unites names on a pull regardless of the cloud time (%s)', async at => {
    const c = cloud({ lessons: { at: 0, v: { done: ['Archer'] } } }), d = device({ 'kingdown.lessons': { done: ['Archer'] } }, c);
    await d.sync.pull();
    vi.setSystemTime(2_000_000);
    d.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Ogre'] }));
    d.sync.changed();
    c.row = { lessons: { at, v: { done: ['Archer', 'Guard'] } } };
    await d.sync.pull();
    expect(c.row.lessons?.v).toEqual({ done: ['Archer', 'Guard', 'Ogre'] });
    expect(c.row.lessons!.at).toBeGreaterThanOrEqual(at);
    expect(readLocal(d.st).lessons).toEqual(c.row.lessons?.v);
    d.sync.stop();
  });

  it('does not upload a stale list when the fresh read fails', async () => {
    const c = cloud(), d = device({ 'kingdown.lessons': { done: ['Archer'] } }, c);
    await d.sync.pull();
    d.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Ogre'] }));
    d.sync.changed();
    const pushes = c.pushes;
    c.remote.pull = vi.fn().mockRejectedValue(new Error('offline'));
    await d.sync.flush();
    expect(c.pushes).toBe(pushes);
    expect(c.remote.pull).toHaveBeenCalledOnce();
    expect(readLocal(d.st).lessons).toEqual({ done: ['Archer', 'Ogre'] });
    d.sync.stop();
  });

  it('keeps a completion made while the fresh cloud read is in flight', async () => {
    const c = cloud(), d = device({ 'kingdown.lessons': { done: ['Archer'] } }, c);
    await d.sync.pull();
    d.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Ogre'] }));
    d.sync.changed();
    let resolve: ((row: Row) => void) | undefined;
    c.remote.pull = () => new Promise(r => { resolve = r; });
    const pending = d.sync.flush();
    await Promise.resolve();
    expect(resolve).toBeTypeOf('function');
    d.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Ogre', 'Paladin'] }));
    d.sync.changed();
    resolve!({ lessons: { at: 1000, v: { done: ['Archer', 'Guard'] } } });
    await pending;
    expect(c.row?.lessons?.v).toEqual({ done: ['Archer', 'Guard', 'Ogre', 'Paladin'] });
    d.sync.stop();
  });

  it.each([true, false])('ignores a late fresh read after a switch or stop (switch: %s)', async switched => {
    const a = cloud(null, 'A'), b = cloud({ lessons: { at: 500, v: { done: ['Guard'] } } }, 'B');
    const d = device({ 'kingdown.lessons': { done: ['Archer'] } }, a);
    await d.sync.pull();
    d.st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Ogre'] }));
    d.sync.changed();
    let resolve!: (row: Row) => void;
    a.remote.pull = () => new Promise(r => { resolve = r; });
    const pending = d.sync.flush(), pushes = a.pushes;
    await Promise.resolve();
    const next = new Sync(d.st, b.remote, () => {}, { blocked: () => false, accepts: () => true });
    if (switched) await next.pull(); else d.sync.stop();
    resolve({ lessons: { at: 9_000_000, v: { done: ['Archer', 'Paladin'] } } });
    await pending;
    expect(a.pushes).toBe(pushes);
    expect(readLocal(d.st).lessons).toEqual({ done: switched ? ['Guard'] : ['Archer', 'Ogre'] });
    d.sync.stop(); next.stop();
  });
});

describe('Sync with a fake server', () => {
  it('an empty account gets everything this device has', async () => {
    const c = cloud(), d = device({ 'kingdown.save': save(['e2-e4']), 'kingdown.lessons': { done: ['Guard'] } }, c);
    await d.sync.pull();
    expect(c.row?.saved_game).toMatchObject({ at: 0, v: { moves: ['e2-e4'] } });
    expect(c.row?.settings).toMatchObject({ v: { sound: true } });
    expect(c.row?.lessons).toEqual({ at: 0, v: { done: ['Guard'] } });
    expect(d.applied).toEqual([]);
  });

  it('the first device signed in sets the account copy; the next adopts it, then sends its own changes', async () => {
    const c = cloud(), a = device({ 'kingdown.save': save(['e2-e4']) }, c), b = device({ 'kingdown.save': save(['d2-d4'], false) }, c);
    await a.sync.pull();
    await b.sync.pull();
    expect(b.applied).toEqual([['settings', 'saved_game']]);
    expect(readLocal(b.st)).toEqual(readLocal(a.st));
    expect(c.pushes).toBe(1);
    // B plays on: its game is newer now and goes up after the quiet moment; A takes it on its next pull.
    vi.setSystemTime(2_000_000);
    change(b.st, save(['e2-e4', 'e7-e5']));
    b.sync.changed();
    await vi.advanceTimersByTimeAsync(2000);
    expect(c.row?.saved_game).toMatchObject({ at: 2_000_000, v: { moves: ['e2-e4', 'e7-e5'] } });
    await a.sync.pull();
    expect(a.applied).toEqual([['saved_game']]);
    expect((readLocal(a.st).saved_game as { moves: string[] }).moves).toEqual(['e2-e4', 'e7-e5']);
  });

  it('takes the newer copy per section, and keeps the rest of the save as it was', async () => {
    const c = cloud({ settings: { at: 5_000_000, v: { ...readLocal(store({ 'kingdown.save': save([], false) })).settings as object } }, saved_game: { at: 500, v: save(['a2-a3']) } });
    const d = device({ 'kingdown.save': { ...save(['e2-e4']), gameAt: 3_000_000 }, 'kingdown.sync': {} }, c);
    vi.setSystemTime(3_000_000);
    stamp(d.st); // Settings are first seen now; the game already has its time.
    await d.sync.pull();
    expect(d.applied).toEqual([['settings']]);
    const local = readLocal(d.st) as { settings: { sound: boolean }; saved_game: { moves: string[] } };
    expect([local.settings.sound, local.saved_game.moves]).toEqual([false, ['e2-e4']]);
    expect(c.row?.saved_game).toMatchObject({ at: 3_000_000, v: { moves: ['e2-e4'] } });
    expect(c.row?.settings).toMatchObject({ at: 5_000_000 });
    // The applied settings are now this device's copy: nothing goes back up, and a pull finds nothing new.
    const pushes = c.pushes;
    d.sync.changed();
    await vi.advanceTimersByTimeAsync(2000);
    await d.sync.pull();
    expect(c.pushes).toBe(pushes);
    expect(d.applied).toEqual([['settings']]);
  });

  it('settings stamped by a version that kept `think` stay as old as they were: a newer cloud copy comes down', async () => {
    const newer = { ...readLocal(store({ 'kingdown.save': save([]) })).settings as object, sound: false };
    const c = cloud({ settings: { at: 2000, v: newer } });
    const d = device({ 'kingdown.save': save([]), 'kingdown.sync': { settings: { at: 1000, json: oldSettings() } } }, c);
    d.sync.changed(); // main.ts at start-up
    await d.sync.pull();
    expect(d.applied).toEqual([['settings']]);
    expect(readLocal(d.st).settings).toMatchObject({ sound: false });
    expect(c.row?.settings).toMatchObject({ at: 2000, v: { sound: false } });
  });

  it('a cloud copy with a field this version does not know comes down once, not on every pull', async () => {
    const c = cloud({ saved_game: { at: 7, v: { ...save(['e2-e4']), clock: 30 } } }), d = device({ 'kingdown.save': save([]) }, c);
    await d.sync.pull();
    await d.sync.pull();
    expect(d.applied).toEqual([['saved_game']]);
    expect(c.row?.saved_game).toMatchObject({ at: 7, v: { clock: 30 } });
  });

  it('a burst of changes is one write, two seconds after the last', async () => {
    const c = cloud(), d = device({ 'kingdown.save': save([]) }, c);
    await d.sync.pull();
    const pushes = c.pushes;
    for (let i = 1; i <= 5; i++) {
      vi.setSystemTime(1_000_000 + i * 300);
      change(d.st, save(Array(i).fill('e2-e4')));
      d.sync.changed();
      await vi.advanceTimersByTimeAsync(300);
    }
    expect(c.pushes).toBe(pushes);
    await vi.advanceTimersByTimeAsync(2000);
    expect(c.pushes).toBe(pushes + 1);
    expect((c.row?.saved_game?.v as { moves: string[] }).moves).toHaveLength(5);
  });

  it('a failure never throws and retries quietly, waiting longer each time', async () => {
    const c = cloud(), d = device({ 'kingdown.save': save(['e2-e4']) }, c);
    c.fail = 2;
    await expect(d.sync.pull()).resolves.toBeUndefined();
    expect(c.row).toBeNull();
    await vi.advanceTimersByTimeAsync(5000); // second try fails too
    expect(c.pulls).toBe(2);
    await vi.advanceTimersByTimeAsync(9000);
    expect(c.pulls).toBe(2); // next wait is 10 s
    await vi.advanceTimersByTimeAsync(1000);
    expect(c.pulls).toBe(3);
    expect(c.row?.saved_game).toMatchObject({ v: { moves: ['e2-e4'] } });
  });

  it('a device that was offline cannot replace a newer copy another device sent meanwhile: it takes that copy', async () => {
    const c = cloud(), a = device({ 'kingdown.save': save(['e2-e4']) }, c), b = device({ 'kingdown.save': save(['e2-e4']) }, c);
    await a.sync.pull();
    await b.sync.pull();
    vi.setSystemTime(1_500_000);
    change(a.st, save(['e2-e4', 'a7-a6']));
    c.fail = 1;
    a.sync.changed();
    await vi.advanceTimersByTimeAsync(2000); // A is offline: its write fails and waits 5 s
    vi.setSystemTime(2_000_000);
    change(b.st, save(['e2-e4', 'e7-e5']));
    b.sync.changed();
    await vi.advanceTimersByTimeAsync(2000); // B, online, sends its later game
    expect(c.row?.saved_game).toMatchObject({ at: 2_000_000, v: { moves: ['e2-e4', 'e7-e5'] } });
    await vi.advanceTimersByTimeAsync(3000); // A is back: its older game does not replace B's, and B's comes down to A
    expect(c.row?.saved_game).toMatchObject({ at: 2_000_000, v: { moves: ['e2-e4', 'e7-e5'] } });
    expect(a.applied).toEqual([['saved_game']]);
    expect((readLocal(a.st).saved_game as { moves: string[] }).moves).toEqual(['e2-e4', 'e7-e5']);
  });

  it('lessons done on two devices add up', async () => {
    const c = cloud();
    const a = device({ 'kingdown.save': save([]), 'kingdown.lessons': { done: ['Archer'] } }, c);
    const b = device({ 'kingdown.save': save([]), 'kingdown.lessons': { done: ['Guard'] } }, c);
    await a.sync.pull();
    await b.sync.pull(); // the account had Archer: B takes it, keeps Guard, and sends both
    expect(readLocal(b.st).lessons).toEqual({ done: ['Archer', 'Guard'] });
    expect(c.row?.lessons?.v).toEqual({ done: ['Archer', 'Guard'] });
    await a.sync.pull();
    expect(readLocal(a.st).lessons).toEqual({ done: ['Archer', 'Guard'] });
    vi.setSystemTime(2_000_000);
    await vi.advanceTimersByTimeAsync(5000);
    const pushes = c.pushes;
    await a.sync.pull();
    await b.sync.pull();
    expect(c.pushes).toBe(pushes); // settled: nothing more goes up
  });

  it('stops for good after sign-out', async () => {
    const c = cloud(), d = device({ 'kingdown.save': save([]) }, c);
    await d.sync.pull();
    d.sync.stop();
    change(d.st, save(['e2-e4']));
    d.sync.changed();
    await vi.advanceTimersByTimeAsync(10_000);
    expect((c.row?.saved_game?.v as { moves: string[] }).moves).toEqual([]);
  });
});


describe('recovery confirmation', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1_000_000); });
  afterEach(() => vi.useRealTimers());

  it('uses the recovery time in the saved game when the sync record is stale', () => {
    const st = store({ 'kingdown.save': save(['e2-e4', 'bad']) });
    const before = stamp(st);
    before.saved_game!.at = 500;
    st.setItem('kingdown.sync', JSON.stringify(before));
    st.setItem('kingdown.save', JSON.stringify({ ...save(['e2-e4']), gameAt: 500, recovery: 500 }));
    expect(stamp(st).saved_game?.at).toBe(501);
    st.setItem('kingdown.save', JSON.stringify({ ...save(['e2-e4'], false), gameAt: 500, recovery: 500 }));
    expect(stamp(st).saved_game?.at).toBe(501);
    expect(readLocal(st).saved_game).not.toHaveProperty('recovery');
    expect(readLocal(st).saved_game).not.toHaveProperty('gameAt');
    change(st, save(['e2-e4', 'e7-e5']));
    expect(stamp(st).saved_game?.at).toBe(1_000_000);
    expect(stamp(st).recovery).toBeUndefined();
  });

  it('keeps the local time and does not apply an equal recovery reply', async () => {
    const c = cloud({ saved_game: { at: 500, v: save(['e2-e4', 'bad']) } });
    const d = device({}, c);
    await d.sync.pull();
    d.applied.length = 0;
    d.st.setItem('kingdown.save', JSON.stringify({ ...save(['e2-e4']), gameAt: 500, recovery: 500 }));
    d.sync.changed();
    await d.sync.flush();
    expect(stamp(d.st).saved_game?.at).toBe(501);
    expect(d.applied).toEqual([]);
    expect(stamp(d.st).recovery).toBeUndefined();
    d.sync.stop();
  });
});


describe('round 2 recovery retry', () => {
  it('keeps the source time after a failed upload and takes newer cloud data after reload', async () => {
    const c = cloud({ saved_game: { at: 500, v: save(['e2-e4', 'bad']) } });
    const d = device({}, c);
    await d.sync.pull();
    d.st.setItem('kingdown.save', JSON.stringify({ ...save(['e2-e4']), gameAt: 500, recovery: 500 }));
    const push = c.remote.push;
    c.remote.push = async () => { throw new Error('offline'); };
    d.sync.changed(); await d.sync.flush(); d.sync.stop();
    expect(JSON.parse(d.st.getItem('kingdown.save')!).recovery).toBe(500);
    expect(c.row?.saved_game?.v).toMatchObject({ moves: ['e2-e4', 'bad'] });
    c.row = { saved_game: { at: 600, v: save(['d2-d4']) } };
    c.remote.push = push;
    const next = new Sync(d.st, c.remote, () => {}, { blocked: () => false, accepts: () => true });
    await next.pull(); next.stop();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['d2-d4'] });
  });

  it('keeps a safe retry after sign-out during the recovery upload', async () => {
    const c = cloud({ saved_game: { at: 500, v: save(['e2-e4', 'bad']) } });
    const d = device({}, c);
    await d.sync.pull();
    d.st.setItem('kingdown.save', JSON.stringify({ ...save(['e2-e4']), gameAt: 500, recovery: 500 }));
    const push = c.remote.push;
    let reply!: () => void;
    c.remote.push = async sent => {
      const row = await push(sent);
      return new Promise<Row | null>(resolve => { reply = () => resolve(row); });
    };
    d.sync.changed(); const sending = d.sync.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(reply).toBeTypeOf('function');
    d.sync.stop(); reply(); await sending;
    expect(JSON.parse(d.st.getItem('kingdown.save')!)).toMatchObject({ moves: ['e2-e4'], gameAt: 500, recovery: 500 });
    c.remote.push = push;
    const next = new Sync(d.st, c.remote, () => {}, { blocked: () => false, accepts: () => true });
    await next.pull(); next.stop();
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['e2-e4'] });
    expect(JSON.parse(d.st.getItem('kingdown.save')!)).not.toHaveProperty('recovery');
  });
});

describe('one game record', () => {
  it.each([undefined, null, -1, '500', Infinity])('treats an absent or invalid game time as unknown (%s)', async gameAt => {
    const c = cloud({ saved_game: { at: 0, v: save(['d2-d4']) } });
    const d = device({ 'kingdown.save': { ...save(['e2-e4']), gameAt, recovery: 500 }, 'kingdown.sync': { saved_game: { at: 9_000_000, json: '{}' } } }, c);
    await d.sync.pull(); d.sync.stop();
    expect(c.row?.saved_game).toMatchObject({ at: 0, v: { moves: ['d2-d4'] } });
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['d2-d4'] });
  });

  it('sends the time and game from the same read if another tab writes between reads', async () => {
    const c = cloud({ saved_game: { at: 600, v: save(['c2-c4']) } });
    const d = device({ 'kingdown.save': { ...save(['c2-c4']), gameAt: 600 } }, c);
    await d.sync.pull();
    const get = d.st.getItem;
    d.st.setItem('kingdown.save', JSON.stringify({ ...save(['d2-d4']), gameAt: 700 }));
    let reads = 0;
    d.st.getItem = key => {
      const raw = get(key);
      if (key === 'kingdown.save' && ++reads === 3) {
        d.st.setItem(key, JSON.stringify({ ...save(['e2-e4']), gameAt: 500 }));
      }
      return raw;
    };
    await d.sync.flush(); d.sync.stop();
    expect(c.row?.saved_game).not.toMatchObject({ at: 700, v: { moves: ['e2-e4'] } });
  });
});

describe('one-time game time upgrade', () => {
  /** A save and record as the build before the game time moved into the save wrote them. */
  const old = (at: unknown, json = stamp(store({ 'kingdown.save': save(['e2-e4']) })).saved_game!.json, extra = {}) =>
    ({ 'kingdown.save': save(['e2-e4']), 'kingdown.sync': { saved_game: { at, json }, ...extra } });
  const time = (st: ReturnType<typeof store>) => JSON.parse(st.getItem('kingdown.save')!).gameAt;

  it('takes the old record time when it holds this game, and keeps the game against an older cloud game', async () => {
    const c = cloud({ saved_game: { at: 600, v: save(['d2-d4']) } });
    const d = device(old(900), c);
    await d.sync.pull(); d.sync.stop();
    expect(time(d.st)).toBe(900);
    expect(readLocal(d.st).saved_game).toMatchObject({ moves: ['e2-e4'] });
    expect(c.row?.saved_game).toMatchObject({ at: 900, v: { moves: ['e2-e4'] } });
  });

  it.each<[string, Record<string, unknown>]>([
    ['another game', old(900, '{"moves":["d2-d4"]}')],
    ['no record', { 'kingdown.save': save(['e2-e4']) }],
    ['a recovery step', old(900, undefined, { recovery: 500 })],
    ...[0, -1, '900', null, undefined].map((at): [string, Record<string, unknown>] => [`time ${at}`, old(at)]),
  ])('keeps the time unknown with %s', (_name, data) => {
    const st = store(data), before = st.getItem('kingdown.save');
    localAccess(st);
    expect(st.getItem('kingdown.save')).toBe(before);
    expect(gameTime(JSON.parse(before!))).toBe(0);
  });

  it('writes nothing in a tab that may not write', () => {
    const st = store(old(900));
    st.setItem('kingdown.sync-owner', '{');
    const before = st.getItem('kingdown.save');
    expect(localAccess(st).blocked).toBe(true);
    expect(st.getItem('kingdown.save')).toBe(before);
  });

  it('changes nothing on a second load', () => {
    const st = store(old(900));
    localAccess(st);
    const after = st.getItem('kingdown.save');
    expect(time(st)).toBe(900);
    st.setItem('kingdown.sync', JSON.stringify({ saved_game: { at: 2_000, json: stamp(store({ 'kingdown.save': save(['e2-e4']) })).saved_game!.json } }));
    const again = store(Object.fromEntries([...st.m].map(([k, v]) => [k, JSON.parse(v)])));
    localAccess(again);
    expect(again.getItem('kingdown.save')).toBe(after);
  });
});
