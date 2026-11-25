import { expect, it } from 'vitest';
import type { ErrorCode } from '../src/match/protocol';
import { REFUSALS } from '../src/plugin/queue';
import { REFUSED } from '../src/muse/tools';
import { faultOf, type FaultKind } from '../src/interface/people/server';
import { OnlineError } from '../src/online/client';

/** Each service code, and what each form does with it: the ChatGPT widget outcome (src/plugin/queue.ts REFUSALS),
 *  the web fault kind (src/interface/people/server.ts KINDS) and the Muse sentence (src/muse/tools.ts REFUSED).
 *  A new ErrorCode fails typecheck here: add its row, then make each file agree. */
const FORMS: Record<ErrorCode, { widget: 'refused' | 'failed'; web: FaultKind; muse: boolean }> = {
  INVALID_INPUT: { widget: 'refused', web: 'refused', muse: true },
  NOT_FOUND: { widget: 'refused', web: 'gone', muse: true },
  FORBIDDEN: { widget: 'refused', web: 'refused', muse: true },
  WAITING: { widget: 'refused', web: 'refused', muse: false },
  NOT_ALLOWED: { widget: 'refused', web: 'refused', muse: true },
  STALE_REVISION: { widget: 'refused', web: 'stale', muse: true },
  INVALID_MOVE: { widget: 'refused', web: 'illegal', muse: true },
  WRONG_TURN: { widget: 'refused', web: 'stale', muse: true },
  MATCH_TERMINAL: { widget: 'refused', web: 'ended', muse: true },
  MATCH_LIMIT: { widget: 'refused', web: 'refused', muse: true },
  MATCH_INCOMPATIBLE: { widget: 'refused', web: 'refused', muse: true },
  MATCH_REMOVED: { widget: 'refused', web: 'gone', muse: false },
  COMMAND_CONFLICT: { widget: 'refused', web: 'refused', muse: true },
  INVITE_UNAVAILABLE: { widget: 'refused', web: 'refused', muse: false },
  UNAVAILABLE: { widget: 'failed', web: 'down', muse: true },
  HANDLE_TAKEN: { widget: 'failed', web: 'refused', muse: false },
  FRIEND_GAME_LIMIT: { widget: 'refused', web: 'refused', muse: false },
  FRIEND_INVITE_LIMIT: { widget: 'refused', web: 'refused', muse: false },
  OPEN_INVITE_LIMIT: { widget: 'refused', web: 'refused', muse: false },
  RATE_LIMITED: { widget: 'refused', web: 'refused', muse: true },
  UNAUTHENTICATED: { widget: 'failed', web: 'auth', muse: false },
  HANDLE_NEEDED: { widget: 'failed', web: 'refused', muse: false },
  RANKED_UNAVAILABLE: { widget: 'refused', web: 'refused', muse: false },
  BOARD_EXPIRED: { widget: 'failed', web: 'refused', muse: false },
};

it('each service code has a widget outcome, a web fault kind and a Muse sentence choice', () => {
  for (const [code, form] of Object.entries(FORMS) as [ErrorCode, (typeof FORMS)[ErrorCode]][]) {
    expect(REFUSALS.includes(code), `${code}: src/plugin/queue.ts REFUSALS must ${form.widget === 'refused' ? 'list' : 'not list'} it`).toBe(form.widget === 'refused');
    expect(faultOf(new OnlineError(code, 409, 'x')).kind, `${code}: src/interface/people/server.ts KINDS must give '${form.web}'${form.web === 'refused' ? ' (no entry)' : ''}`).toBe(form.web);
    expect(code in REFUSED, `${code}: src/muse/tools.ts REFUSED must ${form.muse ? 'have' : 'not have'} a sentence`).toBe(form.muse);
  }
  expect(Object.keys(REFUSED).filter(code => !(code in FORMS)), 'src/muse/tools.ts REFUSED has a code that is not an ErrorCode').toEqual([]);
});
