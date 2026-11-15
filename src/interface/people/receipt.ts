/**
 * The durable command receipt of the people controller, with the M12 fix (runs/audit/code-audit.md M12; the spec,
 * docs/specs/people-controller). The key and the shape are the old page's (`src/online/runtime.ts`
 * `createWebTransport`), so each page can send the other's saved command again with the same ID. The old rule stays:
 * one saved command for each account, written before the send. The fix is in the controller: a read with a higher
 * revision settles the receipt, and the player can discard it after two failed checks.
 */
import type { Action } from '../../match/protocol';

export const receiptKey = (userId: string) => `kingdown.account-command.${userId}`;
/** The old page's receipt: its tool name and its arguments. */
export interface Receipt { name: string; args: { game_id: string; command_id: string; expected_revision: number } & Record<string, unknown> }

/** The old page's tool name for each command (`commandAction` in `src/online/runtime.ts`). */
const NAMES: Partial<Record<Action['type'], string>> = {
  turn: 'kingdown_move', choose: 'kingdown_choose', draw: 'kingdown_draw', rematch: 'kingdown_rematch',
  resign: 'kingdown_resign', abort: 'kingdown_abort', claim: 'kingdown_claim', say: 'kingdown_say', computer: 'kingdown_computer',
};

export function receiptOf(gameId: string, expected: number, action: Action, commandId: string): Receipt {
  const name = NAMES[action.type];
  if (!name) throw new Error(`No receipt for the command ${action.type}`);
  const { type: _, ...fields } = action as Action & Record<string, unknown>;
  return { name, args: { game_id: gameId, command_id: commandId, expected_revision: expected, ...fields } };
}

/** The command of a receipt, as the old page sends it; undefined for a receipt that is not a game command. */
export function actionOf(receipt: Receipt): Action | undefined {
  const a = receipt.args;
  switch (receipt.name) {
    case 'kingdown_move': return { type: 'turn', actions: (a.actions ?? [a.lan]) as string[] };
    case 'kingdown_choose': return { type: 'choose', choice: { king: a.king, order: a.order }, ready: a.ready } as Action;
    case 'kingdown_draw': return { type: 'draw', choice: a.choice } as Action;
    case 'kingdown_rematch': return { type: 'rematch', choice: a.choice } as Action;
    case 'kingdown_resign': return { type: 'resign' };
    case 'kingdown_abort': return { type: 'abort' };
    case 'kingdown_claim': return { type: 'claim', reason: 'timeout' };
    case 'kingdown_say': return { type: 'say', preset: a.preset } as Action;
    case 'kingdown_computer': return { type: 'computer' };
  }
}

export type LockManager = { request<T>(name: string, run: () => Promise<T>): Promise<T> };
/** The account lock across tabs (Web Locks); with no lock manager, this tab only. */
export const browserLocks = (): LockManager | undefined => {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  return locks && { request: (name, run) => locks.request(name, run) };
};
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Another saved command waits. It must settle before a new command starts. */
export class ReceiptBusy extends Error { constructor() { super('Retry the saved command before you start another command.'); this.name = 'ReceiptBusy'; } }

export function receiptStore(userId: string, storage: Store, locks: LockManager | undefined = browserLocks()) {
  const key = receiptKey(userId);
  let unreadable: string | null = null;
  const locked = <T>(run: () => T) => locks ? locks.request(key, async () => run()) : Promise.resolve().then(run);
  /** The saved receipt; 'unreadable' when the stored bytes are not a receipt. */
  function read(): Receipt | 'unreadable' | undefined {
    const raw = storage.getItem(key);
    if (!raw) return;
    try {
      const value = JSON.parse(raw) as Receipt;
      if (value && typeof value.name === 'string' && value.args && typeof value.args.command_id === 'string') return value;
    } catch { /* unreadable below */ }
    unreadable = raw;
    return 'unreadable';
  }
  return {
    read,
    /** Write the receipt before the send. The same receipt again is a retry. */
    hold: (receipt: Receipt) => locked(() => {
      const text = JSON.stringify(receipt), raw = storage.getItem(key);
      if (raw && raw !== text) throw new ReceiptBusy();
      storage.setItem(key, text);
    }),
    /** Remove only this receipt, or the unreadable bytes that read() found. */
    drop: (receipt?: Receipt) => locked(() => {
      if (storage.getItem(key) === (receipt ? JSON.stringify(receipt) : unreadable)) storage.removeItem(key);
    }),
  };
}
export type ReceiptStore = ReturnType<typeof receiptStore>;
