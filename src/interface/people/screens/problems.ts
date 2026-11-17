/**
 * The line that a people screen shows for a failed call. No DOM. Server answers come through `faultOf`
 * (`server.ts`); sign-in answers have the fields of the sign-in service (`status`, `code`).
 */
import { personText, recoveryText, signInText } from './copy';
import { faultOf, type Fault } from '../server';

/** The server's limit of games with one person (`checkPair` in `src/match/service.ts`). */
export const PAIR_LIMIT = 5;
/** The count of a game limit: the server says it in its text (`INVITE_NOTICES.gameLimit`); the client drops the details. */
export function limitCount(fault: Fault): number {
  const count = /^You have (\d+) games with /.exec(fault.message)?.[1];
  return count ? Number(count) : PAIR_LIMIT;
}

/** Lost connection or no answer: the same lines on each people screen (people spec section 5, account spec S11). */
export function serviceLine(fault: Fault): string | undefined {
  if (fault.kind === 'offline') return recoveryText.offline;
  if (fault.kind === 'unknown' || fault.kind === 'down') return recoveryText.service;
}

/** A refused "Send a link" or "Invite" in the Play a person sheet. `name` is the invited player (none for a link). */
export function inviteProblem(error: unknown, name: string | null, online = true): string {
  const fault = faultOf(error, online), line = serviceLine(fault);
  if (line) return line;
  switch (fault.code) {
    case 'OPEN_INVITE_LIMIT': return personText.openLimit;
    case 'RATE_LIMITED': return personText.tooMany;
    case 'NOT_FOUND': return personText.none;
  }
  if (name) switch (fault.code) {
    case 'FRIEND_INVITE_LIMIT': return personText.inviteLimit(name);
    case 'FRIEND_GAME_LIMIT': return personText.gameLimit(limitCount(fault), name);
    case 'FORBIDDEN': return personText.closed(name);
  }
  return recoveryText.service;
}

/** A failed email code step (S2), as the old form says it (`src/account/email-code.ts`). */
export function emailProblem(error: unknown, sending: boolean): string {
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  if (code === 'user_banned') return signInText.suspended;
  if (status === 429) return signInText.tooMany;
  if (typeof status !== 'number' || status < 400) return signInText.noReach;
  if (status >= 500) return signInText.serviceFault;
  return sending ? signInText.badAddress : signInText.badCode;
}
