import type { Save } from '../screen/save';
import { canWriteLocal, gameTime, localAccess, selectLocal } from './local';

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
  /** A later player change must follow even an unreadable cloud copy. */
  seen?(at: number): void;
  /** Rechecks the current local save, including changes made after boot. */
  blocked(): boolean;
  /** A partial copy may come down for recovery, but it must not go up. */
  accepts(value: unknown, partial?: boolean): boolean;
}
type Store = Pick<Storage, 'getItem' | 'setItem'>;
type AccountStore = Store & Pick<Storage, 'removeItem' | 'length' | 'key'>;
/** When each section last changed here, and its value then (to see the next change). */
type Stamps = Partial<Record<Section, { at: number; json: string }>> & { confirmed?: string; recovery?: number };

const SAVE = 'kingdown.save', LESSONS = 'kingdown.lessons', STAMPS = 'kingdown.sync';
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

/** A cloud copy this version can use: an object, and the saved game and lessons need their lists. */
function usable(s: Section, v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return s === 'saved_game' ? Array.isArray(o.moves) : s === 'lessons' ? Array.isArray(o.done) : true;
}

/** This device's copy of each section, or null when it has none. */
export function readLocal(store: Store): Record<Section, unknown> {
  return readSections(store.getItem(SAVE), store.getItem(LESSONS));
}

function readSections(rawSave: string | null, rawLessons: string | null): Record<Section, unknown> {
  const save = parse(rawSave);
  const ok = save && typeof save === 'object' && Array.isArray(save.moves);
  return { settings: ok ? pick(save, SETTINGS) : null, lessons: parse(rawLessons), saved_game: ok ? pick(save, GAME) : null };
}

function writeLocal(store: Store, s: Section, v: unknown, at = 0): void {
  if (s === 'lessons') return store.setItem(LESSONS, JSON.stringify(v));
  const save = parse(store.getItem(SAVE)) ?? {}, keys = s === 'settings' ? SETTINGS : GAME;
  for (const k of keys) delete save[k];
  if (s === 'saved_game') { delete save.recovery; save.gameAt = at; }
  store.setItem(SAVE, JSON.stringify({ ...save, ...pick(v as Record<string, unknown>, keys) }));
}

/**
 * The game and its time come from one read. The sync record never supplies the game's time.
 * Other sections get a time when they change, or 0 before the first sync. A dropped field is no change.
 */
export function stamp(store: Store, now = Date.now()): Stamps {
  const raw = store.getItem(STAMPS), stamps: Stamps = parse(raw) ?? {}, rawSave = store.getItem(SAVE);
  const save = parse(rawSave), local = readSections(rawSave, store.getItem(LESSONS));
  const recovery = save?.recovery !== undefined ? gameTime(save) : undefined;
  let changed = false;
  delete stamps.saved_game;
  delete stamps.recovery;
  for (const s of SECTIONS) {
    if (local[s] == null) continue;
    const json = canon(local[s]), was = stamps[s];
    if (s === 'saved_game') {
      // The one-step recovery proposal is not a new local clock time.
      stamps[s] = { at: gameTime(save) + (recovery !== undefined && recovery > 0 ? 1 : 0), json };
      if (recovery !== undefined) stamps.recovery = recovery;
    } else if (was?.json !== json) {
      stamps[s] = { at: was && canon(own(s, parse(was.json))) === json ? was.at : raw == null ? 0 : Math.max(now, (was?.at ?? -1) + 1), json };
      changed = true;
    }
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
  private selected = false;

  constructor(private store: AccountStore, private remote: Remote, private onApply: (down: Section[], switched?: boolean) => void, private savedGame: SavedGameAccess, private delayMs = 2000) {}

  private ownsLocal(): boolean {
    return canWriteLocal(this.store) && localAccess(this.store).userId === this.remote.userId;
  }

  /** Takes newer cloud sections, unites lesson names, then sends local changes. */
  pull(): Promise<void> {
    return this.run(async () => {
      if (this.stopped || this.selected && !this.ownsLocal()) return;
      if (!this.selected) {
        const switched = selectLocal(this.store, this.remote.userId, () => { stamp(this.store); });
        try { if (switched) this.onApply([...SECTIONS], true); }
        catch (error) { localAccess(this.store).blocked = true; throw error; }
        this.selected = true;
      }
      const row = await this.remote.pull();
      if (this.stopped || !this.ownsLocal()) return;
      this.take(row);
      this.pulled = true;
      await this.send();
    });
  }

  /** Send local changes after a quiet moment, so a burst of moves is one cloud write. */
  changed(): void {
    if (this.stopped || !this.selected || !this.ownsLocal()) return;
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
    if (this.stopped || !this.ownsLocal()) return;
    if (stamp(this.store).recovery !== undefined) {
      const latest = await this.remote.pull();
      if (this.stopped || !this.ownsLocal()) return;
      this.take(latest);
    }
    const lessons = stamp(this.store).lessons;
    if (lessons && lessons.at > (this.cloudAt.lessons ?? -1)) {
      // shortcut: writes can race after this read, use a server union when simultaneous writes must keep all names.
      const latest = await this.remote.pull();
      if (this.stopped || !this.ownsLocal()) return;
      this.take(latest);
    }
    const stamps = stamp(this.store), row: Row = {};
    for (const s of SECTIONS) {
      if (s !== 'lessons' && this.savedGame.blocked()) continue;
      const l = stamps[s];
      if (l && l.at > (this.cloudAt[s] ?? -1)) {
        const value = parse(l.json);
        if (s === 'saved_game' && !this.savedGame.accepts(value)) continue;
        row[s] = { at: l.at, v: value };
      }
    }
    if (this.stopped || !Object.keys(row).length) return;
    const kept = await this.remote.push(row);
    if (this.stopped || !this.ownsLocal()) return;
    if (kept) this.take(kept); // another device sent a newer copy meanwhile: it comes down now
    else {
      for (const s of SECTIONS) if (row[s]) this.cloudAt[s] = row[s]!.at;
    }
  }

  /** Writes here each section the cloud has newer, and notes the cloud's times. */
  private take(row: Row | null): void {
    const stamps = stamp(this.store);
    const at = row?.saved_game?.at;
    if (typeof at === 'number' && Number.isFinite(at)) this.savedGame.seen?.(at);
    if (stamps.recovery !== undefined && row?.saved_game && (row.saved_game.at > stamps.recovery || stamps.recovery === 0)) {
      if (stamps.saved_game && canon(own('saved_game', row.saved_game.v)) === stamps.saved_game.json) {
        // The upload is confirmed. Keep the live game and any move still in motion.
        writeLocal(this.store, 'saved_game', row.saved_game.v, Math.max(stamps.saved_game.at, row.saved_game.at));
        stamps.saved_game.at = Math.max(stamps.saved_game.at, row.saved_game.at);
        delete stamps.recovery;
        this.store.setItem(STAMPS, JSON.stringify(stamps));
      } else if (stamps.saved_game) {
        // On a recovery tie, a different server copy wins, also after a reload.
        stamps.saved_game.at = stamps.recovery;
      }
    }
    const { down } = merge(stamps, row);
    this.cloudAt = {};
    for (const s of SECTIONS) if (typeof row?.[s]?.at === 'number') this.cloudAt[s] = row[s]!.at;
    const remoteGame = row?.saved_game;
    if (remoteGame && typeof remoteGame.at === 'number' && remoteGame.at > (stamps.saved_game?.at ?? -1) && !usable('saved_game', remoteGame.v)) {
      if (!this.savedGame.blocked()) this.savedGame.accepts(remoteGame.v);
    }
    const applied: Section[] = [];
    for (const s of down) {
      const { at, v } = row![s]!;
      if (s === 'saved_game' && (this.savedGame.blocked() || !this.savedGame.accepts(v, true))) {
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
      } else writeLocal(this.store, s, v, at);
      stamps[s] = { at: s === 'lessons' ? Math.max(at, stamps[s]?.at ?? at) : at, json: canon(s === 'lessons' ? v : readLocal(this.store)[s]) };
      applied.push(s);
    }
    if (applied.length) { this.onApply(applied); this.store.setItem(STAMPS, JSON.stringify(stamps)); }
    if (!this.ownsLocal()) return;
    const rawSave = this.store.getItem(SAVE), rawLessons = this.store.getItem(LESSONS);
    const local = readSections(rawSave, rawLessons);
    // A successful request alone is not a receipt. Each stored section must match the cloud.
    if (rawSave !== null && local.saved_game === null || rawLessons !== null && local.lessons === null) return;
    if (SECTIONS.every(s => local[s] === null || usable(s, row?.[s]?.v) && canon(local[s]) === canon(own(s, row![s]!.v)))) {
      const current = stamp(this.store);
      current.confirmed = JSON.stringify([rawSave, rawLessons]);
      this.store.setItem(STAMPS, JSON.stringify(current));
    }
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
