import { accountLock, browserLocks, type AccountStore, type LockManager } from './data';
import { sessionKey, type AccountSession } from './session';

/** The installed auth client is lockless. Its storage adapter shares this lock with bound removal. */
export function authStorage(storageKey: string, store: AccountStore, locks: LockManager | undefined = browserLocks()) {
  const locked = <T>(run: () => T) => accountLock(`lock:${storageKey}`, locks, run);
  return {
    storage: {
      getItem: (key: string) => locked(() => store.getItem(key)),
      setItem: (key: string, value: string) => locked(() => store.setItem(key, value)),
      removeItem: (key: string) => locked(() => store.removeItem(key)),
    },
    remove: (expected: AccountSession, removed: () => void) => locked(() => {
      const saved = JSON.parse(store.getItem(storageKey) ?? 'null');
      if (!saved || saved.user?.id !== expected.userId || typeof saved.access_token !== 'string'
        || sessionKey({ userId: saved.user.id, accessToken: saved.access_token }) !== sessionKey(expected)) return false;
      for (const key of [storageKey, `${storageKey}-user`, `${storageKey}-code-verifier`]) store.removeItem(key);
      removed();
      return true;
    }),
  };
}
