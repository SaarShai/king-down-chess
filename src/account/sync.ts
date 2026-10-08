/**
 * Cloud save. The game keeps its data in localStorage as before; this splits it into sections that
 * sync one by one with the player's row in public.user_data. Each section carries the time it last
 * changed on the device that changed it ({at, v}), and the newer copy wins.
 */
export const SECTIONS = ['settings', 'lessons', 'saved_game'] as const;
export type Section = (typeof SECTIONS)[number];
export type Stamped = { at: number; v: unknown };
export type Row = Partial<Record<Section, Stamped | null>>;
/**
 * The player's user_data row. Both calls throw when the server cannot be reached. `push` answers with
 * the row as the database kept it: it keeps a section only when the one sent is newer (0001_accounts.sql).
 */
export interface Remote { pull(): Promise<Row | null>; push(row: Row): Promise<Row | null> }
type Store = Pick<Storage, 'getItem' | 'setItem'>;
/** When each section last changed here, and its value then (to see the next change). */
type Stamps = Partial<Record<Section, { at: number; json: string }>>;

const SAVE = 'kingdown.save', LESSONS = 'kingdown.lessons', STAMPS = 'kingdown.sync';
/** main.ts `Save` fields: these are settings; the rest is the saved game. The look stays per device. */
const SETTINGS = ['skill', 'coords', 'sound', 'queen', 'pace', 'threats'];
const GAME = ['back', 'fen', 'moves', 'white', 'black', 'link', 'daily', 'resigned', 'rules'];

const parse = (raw: string | null): any => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const pick = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
/** A section's copy cut to the fields this version keeps, so a field it dropped (the old `think`) is no change. */
const own = (s: Section, v: unknown): unknown =>
  s === 'lessons' || !v || typeof v !== 'object' ? v : pick(v as Record<string, unknown>, s === 'settings' ? SETTINGS : GAME);
/** JSON with sorted keys: the database reorders the keys of what it keeps. */
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) =>
  x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);

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
 * devices: the cloud's wins, so both agree.
 */
export function merge(local: Stamps, cloud: Row | null): { up: Section[]; down: Section[] } {
  const up: Section[] = [], down: Section[] = [];
  for (const s of SECTIONS) {
    const l = local[s], c = cloud?.[s];
    if (c && typeof c.at === 'number' && usable(s, c.v) && (!l || c.at > l.at || (c.at === 0 && l.at === 0 && canon(own(s, c.v)) !== l.json))) down.push(s);
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

  constructor(private store: Store, private remote: Remote, private onApply: (down: Section[]) => void, private delayMs = 2000) {}

  /** Takes each section the cloud has newer, then sends each this device has newer. */
  pull(): Promise<void> {
    return this.run(async () => {
      const row = await this.remote.pull();
      if (this.stopped) return;
      this.take(row);
      this.pulled = true;
      await this.send();
    });
  }

  /** A local change: stamped now, sent after a quiet moment, so a burst of moves is one write. */
  changed(): void {
    if (this.stopped) return;
    stamp(this.store);
    this.later(this.delayMs);
  }

  /** Sends now (the page is being hidden, the connection is back). */
  flush(): Promise<void> {
    clearTimeout(this.timer);
    return this.pulled ? this.run(() => this.send()) : this.pull();
  }

  stop(): void { this.stopped = true; clearTimeout(this.timer); }

  private async send(): Promise<void> {
    const stamps = stamp(this.store), local = readLocal(this.store), row: Row = {};
    for (const s of SECTIONS) {
      const l = stamps[s];
      if (l && local[s] != null && l.at > (this.cloudAt[s] ?? -1)) row[s] = { at: l.at, v: local[s] };
    }
    if (this.stopped || !Object.keys(row).length) return;
    const kept = await this.remote.push(row);
    if (this.stopped) return;
    if (kept) this.take(kept); // another device sent a newer copy meanwhile: it comes down now
    else for (const s of SECTIONS) if (row[s]) this.cloudAt[s] = row[s]!.at;
  }

  /** Writes here each section the cloud has newer, and notes the cloud's times. */
  private take(row: Row | null): void {
    const stamps = stamp(this.store), { down } = merge(stamps, row);
    this.cloudAt = {};
    for (const s of SECTIONS) if (typeof row?.[s]?.at === 'number') this.cloudAt[s] = row[s]!.at;
    for (const s of down) {
      const { at, v } = row![s]!;
      if (s === 'lessons') {
        // Lessons done only add up: keep the ones done only here. Then this copy differs from the
        // cloud's, so it counts as a new change and goes up.
        const cloud = v as { done: unknown[] }, mine = (readLocal(this.store).lessons as { done?: unknown } | null)?.done;
        const more = Array.isArray(mine) ? mine.filter(x => !cloud.done.includes(x)) : [];
        writeLocal(this.store, s, more.length ? { ...cloud, done: [...cloud.done, ...more] } : cloud);
        if (more.length) this.later(this.delayMs);
      } else writeLocal(this.store, s, v);
      stamps[s] = { at, json: canon(s === 'lessons' ? v : readLocal(this.store)[s]) };
    }
    if (down.length) { this.store.setItem(STAMPS, JSON.stringify(stamps)); this.onApply(down); }
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
