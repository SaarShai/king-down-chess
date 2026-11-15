// The deletion notice and the daily time rule (budget.ts), on a fake pool. src/online/jobs.db.test.ts checks the same rules on PostgreSQL.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pool, PoolClient } from 'pg';
import type { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { Budget, OutOfTime, STEP_MS } from './budget';
import { cleanup, DAILY_BUDGET_MS, NOTICE_RESERVE_MS, runDeletions } from './jobs';
import { deletionMail, type Mail } from './mail';

type Statement = { text: string; values?: unknown[] };
/**
 * A fake pg pool. Each daily step connects, then sends begin, SET LOCAL, its statements and commit as query configs.
 * `answer` gets each statement. `committed` keeps the statements of the transactions that committed; `released` keeps
 * the argument of each release (true: the connection is dropped).
 */
function db(answer: (text: string, values: any[]) => unknown) {
 const sql: Statement[] = [], committed: Statement[] = [], released: boolean[] = [];
 const connect = vi.fn(async () => {
  let open: Statement[] = [];
  return {
   query: async (statement: Statement & { query_timeout?: number }) => {
    sql.push(statement);
    const { text, values } = statement;
    if (text === 'commit') { committed.push(...open); open = []; }
    else if (text === 'rollback') open = [];
    else if (text !== 'begin' && !text.startsWith('set local')) { open.push({ text, values }); return answer(text, values ?? []); }
    return { rows: [], rowCount: 0 };
   },
   release: (lost: boolean) => { released.push(lost); },
  };
 });
 // The pool's own query, outside the daily steps: the daily job must not use it.
 const query = vi.fn(async (text: string, values?: unknown[]) => { sql.push({ text, values }); return answer(text, values ?? []); });
 return { pool: { connect, query }, sql, committed, released, texts: () => sql.map(s => s.text) };
}
/** A game service on the fake pool; `command` stands for the game command (the daily job's copy of the service is the same fake). */
function service(pool: object, command = vi.fn(async (_actor: string, _game: string, _input: unknown) => {})) {
 const games = { store: { pool }, command, withStore: vi.fn((_store: PostgresMatchStore) => games) };
 return games as unknown as GameService;
}
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const users = Array.from({ length: 50 }, (_, n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`);

const user = '11111111-1111-4111-8111-111111111111';
function fake({ address = 'p@example.com' as string | null, done = true, helper = true } = {}) {
 const fakeDb = db(text => {
  if (text.includes('from public.account_deletions d')) return { rows: [{ user_id: user }] };
  if (text.includes('from public.game_players p')) return { rows: [] };
  if (text.includes('kingdown_jobs.deletion_email')) {
   if (!helper) throw Object.assign(new Error('function kingdown_jobs.deletion_email(unknown) does not exist'), { code: '42883' });
   return { rows: [{ address }] };
  }
  if (text.includes('kingdown_jobs.delete_account')) return { rows: [{ done }] };
  throw new Error(`unexpected query: ${text}`);
 });
 return { games: service(fakeDb.pool), sql: fakeDb.texts };
}
const error = vi.spyOn(console, 'error').mockImplementation(() => {});
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
afterEach(() => { error.mockClear(); warn.mockClear(); vi.useRealTimers(); });

describe('deletion notice', () => {
 it('reads no address and sends nothing when mail is not configured', async () => {
  const { games, sql } = fake();
  expect(await runDeletions(games)).toBe(1);
  expect(sql().some(text => text.includes('deletion_email'))).toBe(false);
 });

 it('reads the address before the account goes and sends one email after the deletion, with a key for the account', async () => {
  const { games, sql } = fake(), sent: Mail[] = [];
  expect(await runDeletions(games, async mail => { sent.push(mail); })).toBe(1);
  expect(sql().findIndex(text => text.includes('deletion_email'))).toBeLessThan(sql().findIndex(text => text.includes('delete_account')));
  expect(sent).toEqual([{ ...deletionMail('p@example.com'), key: `kingdown-deletion-${user}` }]);
 });

 it('sends nothing when the deletion does not happen or the account has no address', async () => {
  for (const options of [{ done: false }, { address: null }]) {
   const { games } = fake(options), send = vi.fn(async () => {});
   expect(await runDeletions(games, send)).toBe(options.done === false ? 0 : 1);
   expect(send).not.toHaveBeenCalled();
  }
 });

 it('deletes the account when the notice fails, and logs no address', async () => {
  for (const options of [{ helper: false }, {}]) {
   const { games } = fake(options);
   expect(await runDeletions(games, async () => { throw new Error('Resend refused the email (500)'); })).toBe(1);
   expect(error.mock.calls).toEqual([['King Down deletion notice failed', { name: 'Error', code: options.helper === false ? '42883' : 'UNKNOWN' }]]);
   expect(JSON.stringify(error.mock.calls)).not.toContain('p@example.com');
   error.mockClear();
  }
 });

 it('deletes all 50 due accounts before the first email, and stops slow failing emails at the deadline', async () => {
  vi.useFakeTimers();
  let deleted = 0;
  const fakeDb = db(text => {
   if (text.includes('from public.account_deletions d')) return { rows: users.map(user_id => ({ user_id })) };
   if (text.includes('from public.game_players p')) return { rows: [] };
   if (text.includes('kingdown_jobs.deletion_email')) return { rows: [{ address: 'p@example.com' }] };
   if (text.includes('kingdown_jobs.delete_account')) { deleted++; return { rows: [{ done: true }] }; }
   throw new Error(`unexpected query: ${text}`);
  });
  // Each send fails after 10 s and ignores the stop signal: the worst mail service.
  const send = vi.fn((_mail: Mail, _signal?: AbortSignal) => new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)));
  let result: number | undefined;
  const work = runDeletions(service(fakeDb.pool), send).then(count => { result = count; });
  for (let n = 0; n < 100_000 && !send.mock.calls.length; n++) await Promise.resolve();
  expect(deleted).toBe(50);
  expect(send).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(DAILY_BUDGET_MS - 1);
  expect(result).toBeUndefined();
  await vi.advanceTimersByTimeAsync(1);
  await work;
  expect(result).toBe(50);
  // 0 s, 10 s, 20 s; the third is stopped at 25 s, inside the 30 s function limit.
  expect(send.mock.calls.map(([mail]) => mail.key)).toEqual(users.slice(0, 3).map(user => `kingdown-deletion-${user}`));
  expect(send.mock.calls[2][1]!.aborted).toBe(true);
  const failed = ['King Down deletion notice failed', { name: 'Error', code: 'UNKNOWN' }];
  expect(error.mock.calls).toEqual([failed, failed, ['King Down deletion notices not sent', { count: 48 }]]);
  expect(JSON.stringify(error.mock.calls)).not.toContain('p@example.com');
 });
});

describe('daily time rule', () => {
 beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0); });

 /** Due accounts, each with `gameCount` active games. The game command takes `commandMs`, the deletion call `deleteMs`. */
 function slow({ commandMs = 0, deleteMs = 0, gameCount = 1, accounts = users } = {}) {
  const fakeDb = db(async (text, values) => {
   const gone = new Set(fakeDb.committed.filter(s => s.text.includes('delete_account')).map(s => s.values![0]));
   if (text.includes('from public.account_deletions d')) return { rows: accounts.filter(user => !gone.has(user)).map(user_id => ({ user_id })) };
   if (text.includes('from public.game_players p')) return { rows: Array.from({ length: gameCount }, (_, n) => ({ id: `game-${n}-${values[0]}`, status: 'active', revision: 3 })) };
   if (text.includes('kingdown_jobs.deletion_email')) return { rows: [{ address: 'p@example.com' }] };
   if (text.includes('kingdown_jobs.delete_account')) { await pause(deleteMs); return { rows: [{ done: true }] }; }
   throw new Error(`unexpected query: ${text}`);
  });
  const command = vi.fn(async (_actor: string, _game: string, _input: unknown) => { await pause(commandMs); });
  const gone = () => new Set(fakeDb.committed.filter(s => s.text.includes('delete_account')).map(s => s.values![0]));
  return { ...fakeDb, games: service(fakeDb.pool, command), command, gone };
 }
 /** Runs `work` on the fake clock and returns its result and the time it ended. */
 async function timed<T>(work: Promise<T>, ms = 40_000) {
  let end: number | undefined;
  const done = work.then(value => { end = Date.now(); return value; });
  await vi.advanceTimersByTimeAsync(ms);
  return { value: await done, end };
 }

 it('gives each database step its own transaction with SET LOCAL limits and a query_timeout, none longer than the step', async () => {
  const { pool, sql, released } = db(() => ({ rows: [], rowCount: 1 }));
  vi.setSystemTime(1000);
  await new Budget(10_000).pool(pool as unknown as Pool).query('select 1');
  expect(sql.map(s => s.text)).toEqual(['begin', `set local statement_timeout = ${STEP_MS}; set local lock_timeout = ${STEP_MS}`, 'select 1', 'commit']);
  expect(sql.map(s => (s as { query_timeout?: number }).query_timeout)).toEqual([STEP_MS, STEP_MS, STEP_MS, STEP_MS]);
  expect(released).toEqual([false]);
  // With less time left than the bound, the step does not start: no connection.
  vi.setSystemTime(10_000 - STEP_MS + 1);
  await expect(new Budget(10_000).pool(pool as unknown as Pool).query('select 1')).rejects.toBeInstanceOf(OutOfTime);
  expect(pool.connect).toHaveBeenCalledOnce();
 });

 it('rolls back a step whose action fails, and drops the connection of a step whose call fails', async () => {
  const { pool, texts, released } = db(text => { if (text === 'select fail') throw Object.assign(new Error('fail'), { code: '57014' }); return { rows: [] }; });
  const budget = new Budget(Infinity);
  await expect(budget.transaction(pool as unknown as Pool, async () => { throw new Error('the game refused'); })).rejects.toThrow('the game refused');
  await expect(budget.transaction(pool as unknown as Pool, async client => client.query('select fail'))).rejects.toMatchObject({ code: '57014' });
  // An action that catches the failure and goes on sends nothing more: no commit on that connection.
  await expect(budget.transaction(pool as unknown as Pool, async client => { await client.query('select fail').catch(() => {}); await client.query('select 1'); })).rejects.toThrow('lost its connection');
  expect(texts().filter(text => ['commit', 'rollback'].includes(text))).toEqual(['rollback']);
  expect(texts().filter(text => text === 'select 1')).toEqual([]);
  expect(released).toEqual([false, true, true]);
 });

 it('bounds the connection wait, and gives a late connection back to the pool', async () => {
  const client = { query: vi.fn(), release: vi.fn() };
  const pool = { connect: vi.fn(() => new Promise(resolve => setTimeout(() => resolve(client), 3000))) };
  const { value, end } = await timed(new Budget(Infinity).pool(pool as unknown as Pool).query('select 1').catch(e => e), 3000);
  expect(value).toMatchObject({ code: 'ETIMEDOUT' });
  expect(end).toBe(STEP_MS);
  expect(client.query).not.toHaveBeenCalled();
  expect(client.release).toHaveBeenCalledOnce();
 });

 it("bounds the game store's queries and transactions the same way (the daily job's game commands)", async () => {
  const { pool, texts } = db(async text => { if (text === 'select slow') await pause(10_000); return { rows: [] }; });
  const store = new Budget(Infinity).store(pool as unknown as Pool);
  const { value, end } = await timed(store.transaction(async (client: PoolClient) => client.query('select slow')).catch(e => e), 10_000);
  expect(value).toMatchObject({ code: 'ETIMEDOUT' });
  expect(end).toBe(STEP_MS);
  await store.pool.query('select 2');
  expect(texts()).toEqual(['begin', `set local statement_timeout = ${STEP_MS}; set local lock_timeout = ${STEP_MS}`, 'select slow',
   'begin', `set local statement_timeout = ${STEP_MS}; set local lock_timeout = ${STEP_MS}`, 'select 2', 'commit']);
 });

 it('stops starting deletions with time left for the emails, and the accounts it does not reach stay due', async () => {
  // 1.5 s for each account: a 0.5 s resign, then a 1 s deletion call.
  const { games, command, gone } = slow({ commandMs: 500, deleteMs: 1000 }), sent: Mail[] = [];
  const { value, end } = await timed(runDeletions(games, async mail => { sent.push(mail); }));
  // Accounts start at 0 s, 1.5 s, ... 12 s; at 13.5 s a step needs 2 s and 10 s are kept for the emails: 11.5 s are left.
  expect(DAILY_BUDGET_MS - NOTICE_RESERVE_MS).toBe(15_000);
  expect([value, end]).toEqual([9, 13_500]);
  expect(command).toHaveBeenCalledTimes(9);
  expect(command.mock.calls[0][2]).toMatchObject({ expected_revision: 3, action: { type: 'resign' } });
  expect(sent).toHaveLength(9);
  expect(warn.mock.calls).toEqual([['King Down deletions left for the next run', { count: 41 }]]);
  expect(vi.getTimerCount()).toBe(0);
  // The next run takes the next accounts.
  expect((await timed(runDeletions(games, async () => {}))).value).toBe(9);
  expect(gone().size).toBe(18);
 });

 it('starts no email after the deadline, even when the stop timer has not fired', async () => {
  // The first account goes. The clock then jumps 12 s while the next account's address is read (a stalled process):
  // that step cannot commit in its time, and the deadline passes with no timer run.
  const send = vi.fn(async () => {});
  let reads = 0;
  const fakeDb = db(text => {
   if (text.includes('from public.account_deletions d')) return { rows: users.map(user_id => ({ user_id })) };
   if (text.includes('from public.game_players p')) return { rows: [] };
   if (text.includes('kingdown_jobs.deletion_email') && ++reads === 2) vi.setSystemTime(Date.now() + 12_000);
   if (text.includes('kingdown_jobs.deletion_email')) return { rows: [{ address: 'p@example.com' }] };
   return { rows: [{ done: true }] };
  });
  expect(await runDeletions(service(fakeDb.pool), send, Date.now() + NOTICE_RESERVE_MS + STEP_MS)).toBe(1);
  expect(send).not.toHaveBeenCalled();
  expect(error.mock.calls).toEqual([['King Down deletion notices not sent', { count: 1 }]]);
  expect(warn.mock.calls).toEqual([['King Down deletions left for the next run', { count: 49 }]]);
 });

 it('bounds one slow deletion call: the step times out, rolls back, the account stays due, and the next run deletes it', async () => {
  const slowRun = slow({ deleteMs: 16_000, accounts: users.slice(0, 1) }), send = vi.fn(async () => {});
  const { value, end } = await timed(runDeletions(slowRun.games, send));
  expect([value, end]).toEqual([0, STEP_MS]);
  expect(slowRun.gone().size).toBe(0);
  expect(slowRun.released.at(-1)).toBe(true);
  expect(send).not.toHaveBeenCalled();
  expect(error.mock.calls).toEqual([['King Down deletion failed', { name: 'Error', code: 'ETIMEDOUT' }]]);
  const next = slow({ accounts: users.slice(0, 1) });
  expect((await timed(runDeletions(next.games, send))).value).toBe(1);
  // From PR 363 review 3: a deletion that would start at 15 s with the deadline at 25 s does not start (10 s are kept for the email).
  vi.setSystemTime(15_000);
  const late = slow({ deleteMs: 16_000, accounts: users.slice(0, 1) });
  expect(await timed(runDeletions(late.games, send, 25_000))).toEqual({ value: 0, end: 15_000 });
  expect(late.texts()).toEqual([]);
 });

 it('stops the game commands of one account with many games, and the account stays due', async () => {
  // From PR 363 review 3: eight active games; each game command takes 4 s.
  const { games, command, texts, gone } = slow({ commandMs: 4000, gameCount: 8, accounts: users.slice(0, 1) }), send = vi.fn(async () => {});
  const { value, end } = await timed(runDeletions(games, send));
  // Commands start at 0, 4, 8 and 12 s; at 16 s a step needs 2 s and 10 s are kept: 9 s are left.
  expect([value, end]).toEqual([0, 16_000]);
  expect(command).toHaveBeenCalledTimes(4);
  expect(texts().some(text => text.includes('delete_account'))).toBe(false);
  expect(gone().size).toBe(0);
  expect(send).not.toHaveBeenCalled();
  expect(warn.mock.calls).toEqual([['King Down deletions left for the next run', { count: 1 }]]);
  // The real commands run on a store whose transactions are daily steps.
  const { withStore } = games as unknown as { withStore: ReturnType<typeof vi.fn> };
  expect(withStore).toHaveBeenCalledOnce();
  expect(withStore.mock.calls[0][0]).toBeInstanceOf(PostgresMatchStore);
  expect(withStore.mock.calls[0][0].transaction).not.toBe(PostgresMatchStore.prototype.transaction);
 });

 it('does no daily work after the deadline: no cleanup statement and no due-account read', async () => {
  const { games, pool } = slow({ accounts: users.slice(0, 1) });
  vi.setSystemTime(26_000);
  expect(await cleanup(games, new Date(), 25_000)).toEqual({ invites: 0, outbox: 0, boards: 0, reports: 0 });
  expect(await runDeletions(games, async () => {}, 25_000)).toBe(0);
  expect(await runDeletions(games, undefined, 25_000)).toBe(0);
  expect(pool.connect).not.toHaveBeenCalled();
  expect(pool.query).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  expect(warn.mock.calls).toEqual([['King Down cleanup left for the next run'], ['King Down deletions left for the next run'], ['King Down deletions left for the next run']]);
 });

 it('bounds one slow cleanup statement, logs it, and runs the other cleanup steps', async () => {
  // From PR 363 review 3: the invitation delete takes 31 s.
  const { pool, texts, released } = db(async text => { if (text.includes('delete from public.game_invites')) await pause(31_000); return { rows: [], rowCount: 0 }; });
  const { end } = await timed(cleanup(service(pool), new Date(), DAILY_BUDGET_MS));
  expect(end).toBe(STEP_MS);
  expect(released[0]).toBe(true);
  expect(error.mock.calls).toEqual([['King Down cleanup failed', { step: 'invites', name: 'Error', code: 'ETIMEDOUT' }]]);
  for (const table of ['public.outbox', 'public.plugin_boards', 'public.reports', 'public.client_errors']) expect(texts().some(text => text.includes(`delete from ${table}`))).toBe(true);
 });

 it('bounds a fault-cleanup batch whose reply does not come', async () => {
  // From PR 363 review 3: the database reply to a batch comes after 31 s.
  const { pool, sql, released } = db(async text => { if (text.includes('delete from public.client_errors')) await pause(31_000); return { rows: [], rowCount: 0 }; });
  const { end } = await timed(cleanup(service(pool), new Date(), DAILY_BUDGET_MS));
  expect(end).toBe(500);
  expect(released.at(-1)).toBe(true);
  expect(sql.find(s => s.text.startsWith('set local statement_timeout = 500;'))).toBeDefined();
 });

 it('stops the fault cleanup with 15 s left for the deletions and the emails', async () => {
  let batches = 0;
  // Each fault-cleanup batch takes 0.25 s and always finds 100 more rows.
  const { pool, released } = db(async text => {
   if (!text.includes('delete from public.client_errors')) return { rows: [], rowCount: 0 };
   batches++; await pause(250); return { rows: [], rowCount: 100 };
  });
  const { end } = await timed(cleanup(service(pool), new Date(), DAILY_BUDGET_MS));
  // Batches start at 0 s to 9.5 s; at 9.75 s a 0.5 s batch does not fit before 15 s are left.
  expect([batches, end]).toEqual([39, 9750]);
  expect(released.every(lost => !lost)).toBe(true);
  expect(warn.mock.calls).toEqual([['King Down cleanup left for the next run']]);
 });
});
