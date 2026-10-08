import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { merge, readLocal, stamp, Sync, type Remote, type Row, type Section } from './sync';

/** localStorage stand-in. */
const store = (init: Record<string, unknown> = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, JSON.stringify(v)]));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};
/** The database keeps jsonb with its keys in its own order: reverse them to be sure order never matters. */
const reorder = (v: unknown): unknown => Array.isArray(v) ? v.map(reorder)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, reorder(x)])) : v;
/** The player's user_data row, shared by every "device" in a test. */
const cloud = (row: Row | null = null) => {
  const r = { row, pulls: 0, pushes: 0, fail: 0 } as { row: Row | null; pulls: number; pushes: number; fail: number };
  const remote: Remote = {
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
const device = (s: Record<string, unknown>, c: ReturnType<typeof cloud>) => {
  const st = store(s), applied: Section[][] = [];
  return { st, applied, sync: new Sync(st, c.remote, d => applied.push(d)) };
};

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1_000_000); });
afterEach(() => { vi.useRealTimers(); });

describe('stamp', () => {
  it('gives data that was here before syncing existed 0, and a later change the time it happened', () => {
    const st = store({ 'kingdown.save': save([]) });
    expect(stamp(st).saved_game?.at).toBe(0);
    vi.setSystemTime(2_000_000);
    expect(stamp(st).saved_game?.at).toBe(0); // unchanged
    st.setItem('kingdown.save', JSON.stringify(save(['e2-e4'])));
    const s = stamp(st);
    expect([s.saved_game?.at, s.settings?.at]).toEqual([2_000_000, 0]); // only the game changed
    st.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer'] }));
    expect(stamp(st).lessons?.at).toBe(2_000_000); // a new section after the first stamp is a real change
  });
  it('a change to a copy from a device whose clock runs ahead is still newer than that copy', async () => {
    const c = cloud({ saved_game: { at: 9_000_000, v: save(['e2-e4']) } }), d = device({ 'kingdown.save': save([]) }, c);
    await d.sync.pull();
    d.st.setItem('kingdown.save', JSON.stringify(save(['e2-e4', 'e7-e5'])));
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
    st.setItem('kingdown.save', JSON.stringify(save([], false)));
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
    b.st.setItem('kingdown.save', JSON.stringify(save(['e2-e4', 'e7-e5'])));
    b.sync.changed();
    await vi.advanceTimersByTimeAsync(2000);
    expect(c.row?.saved_game).toMatchObject({ at: 2_000_000, v: { moves: ['e2-e4', 'e7-e5'] } });
    await a.sync.pull();
    expect(a.applied).toEqual([['saved_game']]);
    expect((readLocal(a.st).saved_game as { moves: string[] }).moves).toEqual(['e2-e4', 'e7-e5']);
  });

  it('takes the newer copy per section, and keeps the rest of the save as it was', async () => {
    const c = cloud({ settings: { at: 5_000_000, v: { ...readLocal(store({ 'kingdown.save': save([], false) })).settings as object } }, saved_game: { at: 500, v: save(['a2-a3']) } });
    const d = device({ 'kingdown.save': save(['e2-e4']), 'kingdown.sync': {} }, c);
    vi.setSystemTime(3_000_000);
    stamp(d.st); // both sections first seen after syncing began: stamped 3,000,000
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
      d.st.setItem('kingdown.save', JSON.stringify(save(Array(i).fill('e2-e4'))));
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
    a.st.setItem('kingdown.save', JSON.stringify(save(['e2-e4', 'a7-a6'])));
    c.fail = 1;
    a.sync.changed();
    await vi.advanceTimersByTimeAsync(2000); // A is offline: its write fails and waits 5 s
    vi.setSystemTime(2_000_000);
    b.st.setItem('kingdown.save', JSON.stringify(save(['e2-e4', 'e7-e5'])));
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
    d.st.setItem('kingdown.save', JSON.stringify(save(['e2-e4'])));
    d.sync.changed();
    await vi.advanceTimersByTimeAsync(10_000);
    expect((c.row?.saved_game?.v as { moves: string[] }).moves).toEqual([]);
  });
});
