import type { Save } from '../screen/save';

/**
 * Cloud save. The game keeps its data in localStorage as before; this splits it into sections that
 * sync one by one with the player's row in public.user_data. Each section carries the time it last
 * changed on the device that changed it ({at, v}). The newer copy wins; lesson names add up.
 */
export const SECTIONS = ['settings', 'lessons', 'saved_game'] as const;
export type Section = (typeof SECTIONS)[number];
export type Stamped = { at: number; v: unknown };
export type Row = Partial<Record<Section, Stamped | null>>;
/**
 * The player's user_data row. Both calls throw when the server cannot be reached. `push` answers with
 * the row as the database kept it: it keeps a section only when the one sent is newer (0001_accounts.sql).
 */
export interface Remote { userId: string; pull(): Promise<Row | null>; push(row: Row): Promise<Row | null> }
/** Supplied by the game page, so this storage/sync module does not import the engine. */
export interface SavedGameAccess {
  /** Rechecks the current local save, including changes made after boot. */
  blocked(): boolean;
  accepts(value: unknown): boolean;
}
type Store = Pick<Storage, 'getItem' | 'setItem'>;
type AccountStore = Store & Pick<Storage, 'removeItem'>;
/** When each section last changed here, and its value then (to see the next change). */
type Stamps = Partial<Record<Section, { at: number; json: string }>>;

const SAVE = 'kingdown.save', LESSONS = 'kingdown.lessons', STAMPS = 'kingdown.sync';
const OWNER = 'kingdown.sync-owner', COPIES = 'kingdown.local.';
const LOCAL_KEYS = [SAVE, LESSONS, STAMPS];
type LocalCopy = (string | null)[];
type Owner = { userId: string; restore?: LocalCopy };
/**
 * screen/save.ts `Save` fields: these are settings; the rest is the saved game. The look stays per device.
 * screen/save.ts SETTINGS is the same list (screen/save.test.ts); it is not imported, because an import
 * would put a shared chunk in the build.
 */
export const SETTINGS = ['skill', 'coords', 'sound', 'queen', 'pace', 'threats', 'labels'] satisfies (keyof Save)[];
const GAME = ['back', 'fen', 'moves', 'white', 'black', 'link', 'daily', 'resigned', 'rules', 'staged'] satisfies (keyof Save)[];

const parse = (raw: string | null): any => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const pick = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
/** A section's copy cut to the fields this version keeps, so a field it dropped (the old `think`) is no change. */
const own = (s: Section, v: unknown): unknown =>
  s === 'lessons' || !v || typeof v !== 'object' ? v : pick(v as Record<string, unknown>, s === 'settings' ? SETTINGS : GAME);
/** JSON with sorted keys: the database reorders the keys of what it keeps. */
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) =>
  x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);

/** Keep the old account's raw copy before loading the next one. A failed write can resume after reload. */
function selectAccount(store: AccountStore, userId: string): boolean {
  let owner: Owner | null = parse(store.getItem(OWNER));
  let switched = false;
  if (owner?.restore) {
    for (const [i, key] of LOCAL_KEYS.entries()) {
      const raw = owner.restore[i];
      if (raw == null) store.removeItem(key); else store.setItem(key, raw);
    }
    owner = { userId: owner.userId };
    store.setItem(OWNER, JSON.stringify(owner));
    switched = true;
  }
  if (owner?.userId === userId) return switched;
  if (owner) {
    stamp(store);
    store.setItem(COPIES + owner.userId, JSON.stringify(LOCAL_KEYS.map(key => store.getItem(key))));
    const restore: LocalCopy = parse(store.getItem(COPIES + userId)) ?? [null, null, null];
    // Record the target before separate key writes, so a quota failure cannot relabel the old bytes.
    store.setItem(OWNER, JSON.stringify({ userId, restore }));
    return selectAccount(store, userId);
  }
  store.setItem(OWNER, JSON.stringify({ userId })); // Only the first sign-in imports anonymous play.
  return false;
}

/** A cloud copy this version can use: an object, and the saved game and lessons need their lists. */
function usable(s: Section, v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return s === 'saved_game' ? Array.isArray(o.moves) : s === 'lessons' ? Array.isArray(o.done) : true;
}

/** This device's copy of each section, or null when it has none. */
export function readLocal(store: Store): Record<Section, unknown> {
  const save = parse(store.getItem(SAVE));
  const ok = save && typeof save === 'object' && Array.isArray(save.moves);
  return { settings: ok ? pick(save, SETTINGS) : null, lessons: parse(store.getItem(LESSONS)), saved_game: ok ? pick(save, GAME) : null };
}

function writeLocal(store: Store, s: Section, v: unknown): void {
  if (s === 'lessons') return store.setItem(LESSONS, JSON.stringify(v));
  const save = parse(store.getItem(SAVE)) ?? {}, keys = s === 'settings' ? SETTINGS : GAME;
  for (const k of keys) delete save[k];
  store.setItem(SAVE, JSON.stringify({ ...save, ...pick(v as Record<string, unknown>, keys) }));
}

/**
 * Notes the time of each section's change since the last call. A change is always newer than the
 * copy it changed, even when another device's clock runs ahead. Data that was here before the first
 * call ever gets 0, older than any cloud copy: the first device signed in sets the account's copy.
 * A copy that differs only by a field this version dropped is the same copy: it keeps its time.
 */
export function stamp(store: Store, now = Date.now()): Stamps {
  const raw = store.getItem(STAMPS), stamps: Stamps = parse(raw) ?? {}, local = readLocal(store);
  let changed = false;
  for (const s of SECTIONS) {
    if (local[s] == null) continue;
    const json = canon(local[s]), was = stamps[s];
    if (was?.json === json) continue;
    stamps[s] = { at: was && canon(own(s, parse(was.json))) === json ? was.at : raw == null ? 0 : Math.max(now, (was?.at ?? -1) + 1), json };
    changed = true;
  }
  if (changed) store.setItem(STAMPS, JSON.stringify(stamps));
  return stamps;
}

/**
 * Per section: down when the cloud copy is newer, up when this device's is newer or the cloud has
 * none. Copies of the same time are the same copy, except data from before syncing (time 0) on two
 * devices: the cloud's wins, so both agree. Different lesson lists merge at any time.
 */
export function merge(local: Stamps, cloud: Row | null): { up: Section[]; down: Section[] } {
  const up: Section[] = [], down: Section[] = [];
  for (const s of SECTIONS) {
    const l = local[s], c = cloud?.[s];
    if (c && typeof c.at === 'number' && usable(s, c.v) && (!l || c.at > l.at || ((s === 'lessons' || c.at === 0 && l.at === 0) && canon(own(s, c.v)) !== l.json))) down.push(s);
    else if (l && (!c || l.at > c.at)) up.push(s);
  }
  return { up, down };
}

/** One player's sync. Never throws and never waits on play: a failure retries quietly later. */
export class Sync {
  private cloudAt: Partial<Record<Section, number>> = {};
  private pulled = false;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private retryMs = 0;
  private queue: Promise<void> = Promise.resolve();
  private rejectedGame: { at: number; local: string } | undefined;
  private selected = false;

  constructor(private store: AccountStore, private remote: Remote, private onApply: (down: Section[], switched?: boolean) => void, private savedGame: SavedGameAccess, private delayMs = 2000) {}

  private ownsLocal(): boolean {
    const owner: Owner | null = parse(this.store.getItem(OWNER));
    return owner?.userId === this.remote.userId && !owner.restore;
  }

  /** Takes newer cloud sections, unites lesson names, then sends local changes. */
  pull(): Promise<void> {
    return this.run(async () => {
      if (this.stopped || this.selected && !this.ownsLocal()) return;
      // An offline first sign-in still owns its local play before the cloud can answer.
      if (this.store.getItem(OWNER) === null) selectAccount(this.store, this.remote.userId);
      const owner = this.store.getItem(OWNER);
      const row = await this.remote.pull();
      if (this.stopped || owner !== this.store.getItem(OWNER)) return;
      const switched = this.selected ? false : selectAccount(this.store, this.remote.userId);
      if (switched) this.onApply([...SECTIONS], true);
      this.selected = true;
      this.take(row);
      this.pulled = true;
      await this.send();
    });
  }

  /** A local change: stamped now, sent after a quiet moment, so a burst of moves is one write. */
  changed(): void {
    if (this.stopped || !this.selected || !this.ownsLocal()) return;
    const stamps = stamp(this.store), local = readLocal(this.store).saved_game;
    // An explicit replacement or a new local move can supersede a rejected copy, even with a future clock.
    if (!this.savedGame.blocked() && this.rejectedGame && local != null && canon(local) !== this.rejectedGame.local && stamps.saved_game) {
      stamps.saved_game.at = Math.max(stamps.saved_game.at, this.rejectedGame.at + 1);
      this.store.setItem(STAMPS, JSON.stringify(stamps));
      this.rejectedGame = undefined;
    }
    this.later(this.delayMs);
  }

  /** Sends now (the page is being hidden, the connection is back). */
  flush(): Promise<void> {
    clearTimeout(this.timer);
    return this.pulled ? this.run(() => this.send()) : this.pull();
  }

  stop(): void { this.stopped = true; clearTimeout(this.timer); }

  private async send(): Promise<void> {
    if (this.stopped || !this.ownsLocal()) return;
    const lessons = stamp(this.store).lessons;
    if (lessons && lessons.at > (this.cloudAt.lessons ?? -1)) {
      // shortcut: writes can race after this read, use a server union when simultaneous writes must keep all names.
      const latest = await this.remote.pull();
      if (this.stopped || !this.ownsLocal()) return;
      this.take(latest);
    }
    const stamps = stamp(this.store), local = readLocal(this.store), row: Row = {};
    for (const s of SECTIONS) {
      if (s !== 'lessons' && this.savedGame.blocked()) continue;
      const l = stamps[s];
      if (l && local[s] != null && l.at > (this.cloudAt[s] ?? -1)) {
        if (s === 'saved_game' && !this.savedGame.accepts(local[s])) continue;
        row[s] = { at: l.at, v: local[s] };
      }
    }
    if (this.stopped || !Object.keys(row).length) return;
    const kept = await this.remote.push(row);
    if (this.stopped || !this.ownsLocal()) return;
    if (kept) this.take(kept); // another device sent a newer copy meanwhile: it comes down now
    else for (const s of SECTIONS) if (row[s]) this.cloudAt[s] = row[s]!.at;
  }

  /** Writes here each section the cloud has newer, and notes the cloud's times. */
  private take(row: Row | null): void {
    const stamps = stamp(this.store), { down } = merge(stamps, row);
    this.cloudAt = {};
    for (const s of SECTIONS) if (typeof row?.[s]?.at === 'number') this.cloudAt[s] = row[s]!.at;
    const remoteGame = row?.saved_game;
    if (remoteGame && typeof remoteGame.at === 'number' && remoteGame.at > (stamps.saved_game?.at ?? -1) && !usable('saved_game', remoteGame.v)) {
      if (!this.savedGame.blocked()) this.savedGame.accepts(remoteGame.v);
      this.rejectGame(remoteGame.at);
    }
    const applied: Section[] = [];
    for (const s of down) {
      const { at, v } = row![s]!;
      if (s === 'saved_game' && (this.savedGame.blocked() || !this.savedGame.accepts(v))) {
        this.rejectGame(at);
        continue;
      }
      if (s === 'settings' && this.savedGame.blocked()) continue;
      if (s === 'lessons') {
        // Lessons done only add up: keep the ones done only here. Then this copy differs from the
        // cloud's, so it counts as a new change and goes up.
        const cloud = v as { done: unknown[] }, mine = (readLocal(this.store).lessons as { done?: unknown } | null)?.done;
        const more = Array.isArray(mine) ? mine.filter(x => !cloud.done.includes(x)) : [];
        writeLocal(this.store, s, more.length ? { ...cloud, done: [...cloud.done, ...more] } : cloud);
        if (more.length) this.later(this.delayMs);
      } else writeLocal(this.store, s, v);
      stamps[s] = { at: s === 'lessons' ? Math.max(at, stamps[s]?.at ?? at) : at, json: canon(s === 'lessons' ? v : readLocal(this.store)[s]) };
      if (s === 'saved_game') this.rejectedGame = undefined;
      applied.push(s);
    }
    if (applied.length) { this.store.setItem(STAMPS, JSON.stringify(stamps)); this.onApply(applied); }
  }

  private rejectGame(at: number): void {
    this.rejectedGame = { at: Math.max(at, this.rejectedGame?.at ?? at), local: canon(readLocal(this.store).saved_game) };
  }

  private later(ms: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), ms);
  }

  /** One request at a time; a failure waits 5 s, then twice as long each time, up to 5 min. */
  private run(op: () => Promise<void>): Promise<void> {
    return this.queue = this.queue.then(op).then(() => { this.retryMs = 0; }, () => {
      if (this.stopped) return;
      this.retryMs = Math.min(this.retryMs ? this.retryMs * 2 : 5000, 300000);
      this.later(this.retryMs);
    });
  }
}
