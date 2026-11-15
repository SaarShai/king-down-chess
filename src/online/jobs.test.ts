// The deletion notice in runDeletions, on a fake pool. src/online/jobs.db.test.ts checks the same rules on PostgreSQL.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameService } from '../match/service';
import { cleanup, DAILY_BUDGET_MS, NOTICE_RESERVE_MS, runDeletions } from './jobs';
import { deletionMail, type Mail } from './mail';

const user = '11111111-1111-4111-8111-111111111111';
function fake({ address = 'p@example.com' as string | null, done = true, helper = true } = {}) {
 const sql: string[] = [];
 const query = vi.fn(async (text: string) => {
  sql.push(text);
  if (text.includes('from public.account_deletions d')) return { rows: [{ user_id: user }] };
  if (text.includes('from public.game_players p')) return { rows: [] };
  if (text.includes('kingdown_jobs.deletion_email')) {
   if (!helper) throw Object.assign(new Error('function kingdown_jobs.deletion_email(unknown) does not exist'), { code: '42883' });
   return { rows: [{ address }] };
  }
  if (text.includes('kingdown_jobs.delete_account')) return { rows: [{ done }] };
  throw new Error(`unexpected query: ${text}`);
 });
 return { games: { store: { pool: { query } } } as unknown as GameService, sql };
}
const error = vi.spyOn(console, 'error').mockImplementation(() => {});
afterEach(() => error.mockClear());

describe('deletion notice', () => {
 it('reads no address and sends nothing when mail is not configured', async () => {
  const { games, sql } = fake();
  expect(await runDeletions(games)).toBe(1);
  expect(sql.some(text => text.includes('deletion_email'))).toBe(false);
 });

 it('reads the address before the account goes and sends one email after the deletion, with a key for the account', async () => {
  const { games, sql } = fake(), sent: Mail[] = [];
  expect(await runDeletions(games, async mail => { sent.push(mail); })).toBe(1);
  expect(sql.findIndex(text => text.includes('deletion_email'))).toBeLessThan(sql.findIndex(text => text.includes('delete_account')));
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
  try {
   const users = Array.from({ length: 50 }, (_, n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
   let deleted = 0;
   const query = vi.fn(async (text: string) => {
    if (text.includes('from public.account_deletions d')) return { rows: users.map(user_id => ({ user_id })) };
    if (text.includes('from public.game_players p')) return { rows: [] };
    if (text.includes('kingdown_jobs.deletion_email')) return { rows: [{ address: 'p@example.com' }] };
    if (text.includes('kingdown_jobs.delete_account')) { deleted++; return { rows: [{ done: true }] }; }
    throw new Error(`unexpected query: ${text}`);
   });
   const games = { store: { pool: { query } } } as unknown as GameService;
   // Each send fails after 10 s and ignores the stop signal: the worst mail service.
   const send = vi.fn((_mail: Mail, _signal?: AbortSignal) => new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)));
   let result: number | undefined;
   const work = runDeletions(games, send).then(count => { result = count; });
   for (let n = 0; n < 10_000 && !send.mock.calls.length; n++) await Promise.resolve();
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
  } finally { vi.useRealTimers(); }
 });

 /** 50 due accounts, each with one active game; the game command and the deletion call take `commandMs` and `deleteMs`. */
 function slow(commandMs: number, deleteMs: number) {
  const users = Array.from({ length: 50 }, (_, n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`), gone = new Set<string>();
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const query = vi.fn(async (text: string, values?: string[]) => {
   if (text.includes('from public.account_deletions d')) return { rows: users.filter(user => !gone.has(user)).map(user_id => ({ user_id })) };
   if (text.includes('from public.game_players p')) return { rows: gone.has(values![0]) ? [] : [{ id: `game-${values![0]}`, status: 'active', revision: 3 }] };
   if (text.includes('kingdown_jobs.deletion_email')) return { rows: [{ address: 'p@example.com' }] };
   if (text.includes('kingdown_jobs.delete_account')) { await pause(deleteMs); gone.add(values![0]); return { rows: [{ done: true }] }; }
   throw new Error(`unexpected query: ${text}`);
  });
  const command = vi.fn(async (_actor: string, _game: string, _input: unknown) => { await pause(commandMs); });
  return { games: { store: { pool: { query } }, command } as unknown as GameService, command, gone };
 }

 it('stops starting deletions with time left for the emails, and the accounts it does not reach stay due', async () => {
  vi.useFakeTimers();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
   // 1.5 s for each account: a 0.5 s resign, then a 1 s deletion call.
   const { games, command, gone } = slow(500, 1000), sent: Mail[] = [];
   let result: number | undefined;
   const work = runDeletions(games, async mail => { sent.push(mail); }).then(count => { result = count; });
   await vi.advanceTimersByTimeAsync(16_499);
   expect(result).toBeUndefined();
   await vi.advanceTimersByTimeAsync(1);
   expect(result).toBe(11);
   await work;
   // Accounts start at 0 s, 1.5 s, ... 15 s (10 s left, the reserve); the 12th would start at 16.5 s with 8.5 s left.
   expect(DAILY_BUDGET_MS - NOTICE_RESERVE_MS).toBe(15_000);
   expect(result).toBe(11);
   expect(command).toHaveBeenCalledTimes(11);
   expect(command.mock.calls[0][2]).toMatchObject({ expected_revision: 3, action: { type: 'resign' } });
   expect(sent).toHaveLength(11);
   expect(warn.mock.calls).toEqual([['King Down deletions left for the next run', { count: 39 }]]);
   expect(vi.getTimerCount()).toBe(0);
   // The next run takes the next accounts.
   const next = runDeletions(games, async () => {});
   await vi.advanceTimersByTimeAsync(16_500);
   expect(await next).toBe(11);
   expect(gone.size).toBe(22);
  } finally { vi.useRealTimers(); warn.mockRestore(); }
 });

 it('starts no email after the deadline, even when the stop timer has not fired', async () => {
  vi.useFakeTimers();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
   // One account: the deletion starts with exactly the reserve left, and its 12 s call ends 2 s after the deadline.
   const { games } = slow(0, 12_000), send = vi.fn(async () => {});
   const work = runDeletions(games, send, Date.now() + NOTICE_RESERVE_MS);
   await vi.advanceTimersByTimeAsync(12_000);
   expect(await work).toBe(1);
   expect(send).not.toHaveBeenCalled();
   expect(error.mock.calls).toEqual([['King Down deletion notices not sent', { count: 1 }]]);
   expect(warn.mock.calls).toEqual([['King Down deletions left for the next run', { count: 49 }]]);
  } finally { vi.useRealTimers(); warn.mockRestore(); }
 });

 it('stops the fault cleanup with 15 s left for the deletions and the emails', async () => {
  vi.useFakeTimers();
  try {
   let batches = 0;
   // Each fault-cleanup batch takes 1 s and always finds 100 more rows.
   const client = { release: vi.fn(), query: vi.fn(async (text: string) => {
    if (!text.includes('delete from public.client_errors')) return { rows: [], rowCount: 0 };
    batches++; await new Promise(resolve => setTimeout(resolve, 1000)); return { rows: [], rowCount: 100 };
   }) };
   const pool = { query: vi.fn(async () => ({ rows: [], rowCount: 0 })), connect: vi.fn(async () => client) };
   const games = { store: { pool } } as unknown as GameService;
   let done = false;
   const work = cleanup(games, new Date(), Date.now() + DAILY_BUDGET_MS).then(() => { done = true; });
   await vi.advanceTimersByTimeAsync(11_000);
   expect(done).toBe(true);
   await work;
   // Batches start at 0 s to 10 s (15 s left); none starts at 11 s.
   expect(batches).toBe(11);
   expect(client.release).toHaveBeenCalledOnce();
  } finally { vi.useRealTimers(); }
 });
});
