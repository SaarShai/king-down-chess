import { accountLock, browserLocks, type AccountStore, type LockManager } from './data';
import { sessionKey, type AccountSession } from './session';

/** The installed auth client is lockless. Its storage adapter shares this lock with bound removal. */
export function authStorage(storageKey: string, store: AccountStore, locks: LockManager | undefined = browserLocks()) {
  const locked = <T>(run: () => T) => accountLock(`lock:${storageKey}`, locks, run);
  const closedKey = `${storageKey}-closed-sessions`;
  const closed = (): string[] => JSON.parse(store.getItem(closedKey) ?? '[]');
  return {
    storage: {
      getItem: (key: string) => locked(() => store.getItem(key)),
      setItem: (key: string, value: string) => locked(() => {
        if (key === storageKey) {
          const saved = JSON.parse(value);
          if (closed().includes(sessionKey({ userId: saved.user?.id, accessToken: saved.access_token }))) return;
        }
        store.setItem(key, value);
      }),
      removeItem: (key: string) => locked(() => store.removeItem(key)),
    },
    remove: (expected: AccountSession, removed: () => void) => locked(() => {
      const saved = JSON.parse(store.getItem(storageKey) ?? 'null');
      if (!saved || saved.user?.id !== expected.userId || typeof saved.access_token !== 'string'
        || sessionKey({ userId: saved.user.id, accessToken: saved.access_token }) !== sessionKey(expected)) return null;
      store.setItem(closedKey, JSON.stringify([...new Set([...closed(), sessionKey(expected)])]));
      const flowKey = `${storageKey}-flows-code-verifier`;
      let flows: unknown;
      try { flows = JSON.parse(store.getItem(flowKey) ?? '[]'); } catch { /* An unreadable index has no usable flow IDs. */ }
      if (Array.isArray(flows)) for (const id of flows) {
        if (typeof id === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(id)) store.removeItem(`${storageKey}-flow-${id}-code-verifier`);
      }
      for (const key of [flowKey, storageKey, `${storageKey}-user`, `${storageKey}-code-verifier`]) store.removeItem(key);
      removed();
      return saved.access_token as string;
    }),
  };
}
