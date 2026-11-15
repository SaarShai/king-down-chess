import { accountLock, browserLocks, type AccountStore, type LockManager } from './data';
import { sessionKey, type AccountSession } from './session';

/** The installed auth client is lockless. Its storage adapter shares this lock with bound removal. */
export function authStorage(storageKey: string, store: AccountStore & Pick<Storage, 'length' | 'key'>, locks: LockManager | undefined = browserLocks()) {
  const locked = <T>(run: () => T) => accountLock(`lock:${storageKey}`, locks, run);
  const closedKey = `${storageKey}-closed-sessions`;
  const closed = (): { session: string; expires: number }[] => JSON.parse(store.getItem(closedKey) ?? '[]');
  return {
    storage: {
      getItem: (key: string) => locked(() => store.getItem(key)),
      setItem: (key: string, value: string) => locked(() => {
        if (key === storageKey) {
          const saved = JSON.parse(value);
          if (closed().some(entry => entry.expires > Date.now()
            && entry.session === sessionKey({ userId: saved.user?.id, accessToken: saved.access_token }))) return;
        }
        store.setItem(key, value);
      }),
      removeItem: (key: string) => locked(() => store.removeItem(key)),
    },
    remove: (expected: AccountSession, removed: () => void) => locked(() => {
      const saved = JSON.parse(store.getItem(storageKey) ?? 'null');
      if (!saved || saved.user?.id !== expected.userId || typeof saved.access_token !== 'string'
        || sessionKey({ userId: saved.user.id, accessToken: saved.access_token }) !== sessionKey(expected)) return null;
      for (let i = store.length - 1; i >= 0; i--) {
        const key = store.key(i);
        if (key?.startsWith(`${storageKey}-flow-`) && key.endsWith('-code-verifier')) store.removeItem(key);
      }
      for (const key of [storageKey, `${storageKey}-flows-code-verifier`, `${storageKey}-user`, `${storageKey}-code-verifier`]) store.removeItem(key);
      try {
        const now = Date.now();
        store.setItem(closedKey, JSON.stringify([
          ...closed().filter(entry => entry.expires > now),
          { session: sessionKey(expected), expires: now + 24 * 60 * 60 * 1000 },
        ]));
      } catch { /* Keep credentials removed and revoke even if the guard cannot fit. */ }
      removed();
      return saved.access_token as string;
    }),
  };
}
