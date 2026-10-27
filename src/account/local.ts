import type { Save } from '../screen/save';

/** The local keys move together. Each tab keeps the owner of the data that it loads. */
type LocalStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'>;
const LOCAL_KEYS = ['kingdown.save', 'kingdown.lessons', 'kingdown.sync'];
const OWNER = 'kingdown.sync-owner', COPIES = 'kingdown.local.';
type LocalCopy = (string | null)[];
type Owner = { userId: string; restore?: LocalCopy; accounts?: string[] };
type Access = { userId: string | null; blocked: boolean };
/** Read only the time stored with this game, never a separate sync record. */
export function gameTime(save: { gameAt?: unknown } | null | undefined): number {
  const at = save?.gameAt;
  return typeof at === 'number' && Number.isFinite(at) && at >= 0 ? at : 0;
}
/** screen/save.ts `Save` fields of the saved game; account/sync.ts sends them as one section. */
export const GAME = ['back', 'fen', 'moves', 'white', 'black', 'link', 'daily', 'resigned', 'rules', 'staged'] satisfies (keyof Save)[];
export const pick = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
/** JSON with sorted keys: the database reorders the keys of what it keeps. */
export const canon = (v: unknown): string => JSON.stringify(v, (_k, x) =>
  x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);

/**
 * Before the game time moved into the save, only the sync record kept it. Take that time once, when
 * the record holds this exact game, no recovery step and a time above 0. Else the time stays unknown.
 */
function upgradeGameTime(store: LocalStore): void {
  let save, record;
  try {
    save = JSON.parse(store.getItem(LOCAL_KEYS[0]) ?? 'null');
    record = JSON.parse(store.getItem(LOCAL_KEYS[2]) ?? 'null');
  } catch { return; } // Unreadable data keeps the time unknown; a failed write must close writers.
  if (!save || typeof save !== 'object' || !Array.isArray(save.moves) || 'gameAt' in save || 'recovery' in save) return;
  const old = record?.saved_game, at = gameTime({ gameAt: old?.at });
  if (!at || record.recovery !== undefined || canon(pick(save, GAME)) !== old.json) return;
  store.setItem(LOCAL_KEYS[0], JSON.stringify({ ...save, gameAt: at }));
}
const tabs = new WeakMap<LocalStore, Access>();
const ownerOf = (store: LocalStore): Owner | null => JSON.parse(store.getItem(OWNER) ?? 'null');

/** Only a cloud receipt for these exact bytes makes a copy safe to remove. */
function confirmed(raw: string): boolean {
  try {
    const copy: LocalCopy = JSON.parse(raw);
    return Array.isArray(copy) && copy.length === LOCAL_KEYS.length
      && JSON.parse(copy[2] ?? 'null')?.confirmed === JSON.stringify(copy.slice(0, 2));
  } catch { return false; }
}

/** Finish a pending key change before the page can read or write any of its data. */
function recover(store: LocalStore): Owner | null {
  let owner = ownerOf(store);
  if (owner?.restore) {
    for (const [i, key] of LOCAL_KEYS.entries()) {
      const raw = owner.restore[i];
      if (raw == null) store.removeItem(key); else store.setItem(key, raw);
    }
    owner = { userId: owner.userId, accounts: owner.accounts };
    store.setItem(OWNER, JSON.stringify(owner));
  }
  return owner;
}

/** Capture once per tab, before its game or lesson list loads. A failed restore or time write keeps writes closed. */
export function localAccess(store: LocalStore): Access {
  let access = tabs.get(store);
  if (!access) {
    access = { userId: null, blocked: true };
    tabs.set(store, access);
    try {
      access.userId = recover(store)?.userId ?? null;
      upgradeGameTime(store);
      access.blocked = false;
    } catch { /* Account selection retries the restore or time write. */ }
  }
  return access;
}

/** Check the shared owner on every write, including writes before an auth event reaches this tab. */
export function canWriteLocal(store: LocalStore): boolean {
  const access = localAccess(store);
  try {
    const owner = ownerOf(store);
    return !access.blocked && !owner?.restore && access.userId === (owner?.userId ?? null);
  } catch { return false; }
}

/** Select and upgrade local data before a page read or sync stamp. A failed selection keeps writers closed. */
export function selectLocal(store: LocalStore, userId: string, beforeArchive: () => void): boolean {
  const access = localAccess(store), shown = access.userId, blocked = access.blocked;
  access.blocked = true;
  const pending = !!ownerOf(store)?.restore;
  const owner = recover(store);
  if (owner && owner.userId !== userId) {
    upgradeGameTime(store); // Retry a failed startup time write before the archive stamp.
    beforeArchive();
    store.setItem(COPIES + owner.userId, JSON.stringify(LOCAL_KEYS.map(key => store.getItem(key))));
    // Unknown or changed copies stay. Only confirmed copies count toward the limit.
    const accounts = [userId, owner.userId, ...(owner.accounts ?? [])].filter((id, i, all) => all.indexOf(id) === i);
    for (let i = store.length - 1; i >= 0; i--) {
      const key = store.key(i);
      if (key?.startsWith(COPIES) && !accounts.includes(key.slice(COPIES.length))) accounts.push(key.slice(COPIES.length));
    }
    let count = 0;
    const keep = accounts.filter(id => {
      const raw = store.getItem(COPIES + id);
      if (raw === null) return id === userId;
      if (!confirmed(raw) || ++count <= 3) return true;
      store.removeItem(COPIES + id);
      return false;
    });
    const restore: LocalCopy = JSON.parse(store.getItem(COPIES + userId) ?? 'null') ?? [null, null, null];
    store.setItem(OWNER, JSON.stringify({ userId, restore, accounts: keep }));
    recover(store);
  } else if (!owner) {
    store.setItem(OWNER, JSON.stringify({ userId })); // Only the first account imports anonymous play.
  }
  upgradeGameTime(store);
  access.userId = userId;
  access.blocked = false;
  return pending || blocked || !!owner && shown !== userId;
}
