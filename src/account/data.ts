import { deletedAccountKey } from './local';
import { sessionKey, type AccountSession } from './session';

export type AccountStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type LockManager = { request<T>(name: string, run: () => Promise<T>): Promise<T> };
export const browserLocks = (): LockManager | undefined => {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  return locks && { request: (name, run) => locks.request(name, run) };
};
const pending = new Map<string, Promise<unknown>>();
/** Use the same name for receipts, drafts, page state and deletion in all tabs. */
export function accountLock<T>(name: string, locks: LockManager | undefined, run: () => T | Promise<T>): Promise<T> {
  if (locks) return locks.request(name, async () => run());
  const result = (pending.get(name) ?? Promise.resolve()).catch(() => {}).then(run);
  pending.set(name, result);
  void result.finally(() => { if (pending.get(name) === result) pending.delete(name); }).catch(() => {});
  return result;
}
type State = { generation: string | null; session: string | null; deleted: boolean };
export class AccountDataClosed extends Error { constructor() { super('The account data is deleted.'); } }

export function accountData(userId: string, storage: AccountStore, locks = browserLocks()) {
  const key = deletedAccountKey(userId), name = `kingdown.account-command.${userId}`;
  const locked = <T>(run: () => T | Promise<T>) => accountLock(name, locks, run);
  const read = (): State => {
    const raw = storage.getItem(key);
    return raw === null ? { generation: null, session: null, deleted: false } : JSON.parse(raw);
  };
  const opening = locked(read);
  void opening.catch(() => {});
  async function checked<T>(run: () => T | Promise<T>) {
    const captured = await opening;
    return locked(() => {
      const live = read();
      if (captured.deleted || live.deleted || captured.generation !== live.generation) throw new AccountDataClosed();
      return run();
    });
  }
  return {
    write: checked,
    /** Confirm auth under the account lock, before settings load. A page read cannot cancel deletion. */
    confirm: (current: () => Promise<AccountSession | null>) => locked(async () => {
      const session = await current();
      if (!session || session.userId !== userId) throw new AccountDataClosed();
      const state = read(), id = sessionKey(session);
      if (state.deleted && (!state.session || state.session === id)) throw new AccountDataClosed();
      if (state.session !== id) storage.setItem(key, JSON.stringify({ generation: crypto.randomUUID(), session: id, deleted: false }));
      return session;
    }),
    close: async (remove: () => void, current?: () => Promise<AccountSession | null>) => {
      const captured = await opening;
      return locked(async () => {
        const session = current ? await current() : null, state = read();
        if (current && !session) throw new AccountDataClosed();
        if (captured.deleted || state.deleted || captured.generation !== state.generation) throw new AccountDataClosed();
        storage.setItem(key, JSON.stringify({ ...state, session: session ? sessionKey(session) : state.session, deleted: true }));
        remove();
      });
    },
  };
}
export type AccountData = ReturnType<typeof accountData>;
