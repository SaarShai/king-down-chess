// The deletion notice in runDeletions, on a fake pool. src/online/jobs.db.test.ts checks the same rules on PostgreSQL.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameService } from '../match/service';
import { runDeletions } from './jobs';
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
});
