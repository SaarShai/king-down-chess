/** Opt-in (PLUGIN_TEST_DATABASE_URL): roles belong to the whole server, so role changes from two test databases on one
 * server wait for each other. */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { beforeAll, describe, expect, it } from 'vitest';
import { ownTestDatabase } from './own-test-db';
import { withRoleLock } from './role-lock.mjs';

const url = process.env.PLUGIN_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
const pause = (ms: number) => new Promise(done => setTimeout(done, ms));

suite('the role lock (real PostgreSQL)', () => {
 let other: URL;
 beforeAll(async () => { other = await ownTestDatabase('rolelock'); }, 120_000);

 it('makes a role change from a second test database wait for the first', async () => {
  const roles = [0, 1].map(() => `rolelock_test_${randomUUID().replaceAll('-', '')}`), events: string[] = [];
  let started!: () => void;
  const firstStarted = new Promise<void>(done => { started = done; });
  const change = (database: string, role: string, name: string) => withRoleLock(database, async () => {
   events.push(`${name} start`);
   if (name === 'first') started();
   const pool = new pg.Pool({ connectionString: database, max: 1 });
   try { await pool.query(`create role ${role}`); await pause(300); await pool.query(`drop role ${role}`); }
   finally { await pool.end(); }
   events.push(`${name} end`);
  });
  const first = change(url!, roles[0], 'first');
  await Promise.race([firstStarted, first]);
  await Promise.all([first, change(other.href, roles[1], 'second')]);
  expect(events).toEqual(['first start', 'first end', 'second start', 'second end']);
 }, 30_000);

 it('frees the lock when the work fails and returns what the work returns', async () => {
  await expect(withRoleLock(url!, async () => { throw new Error('work failed'); })).rejects.toThrow('work failed');
  expect(await withRoleLock(other.href, async () => 'done')).toBe('done');
 }, 30_000);
});
