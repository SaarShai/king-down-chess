/** Opt-in (PLUGIN_TEST_DATABASE_URL): roles belong to the whole server, so role changes from two test databases on one
 * server wait for each other. */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ownTestDatabase } from './own-test-db';
import { withRoleLock } from './role-lock.mjs';

const url = process.env.PLUGIN_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite('the role lock (real PostgreSQL)', () => {
 let other: URL;
 const observer = new pg.Pool({ connectionString: url, max: 1 });
 beforeAll(async () => { other = await ownTestDatabase('rolelock'); }, 120_000);
 afterAll(async () => { await observer.end(); });

 it('makes a role change from a second test database wait for the first', async () => {
  const roles = [0, 1].map(() => `rolelock_test_${randomUUID().replaceAll('-', '')}`), events: string[] = [];
  const secondUrl = new URL(other.href), application = `rolelock_wait_${randomUUID()}`;
  secondUrl.searchParams.set('application_name', application);
  let started!: () => void, release!: () => void;
  const firstStarted = new Promise<void>(done => { started = done; });
  const firstHeld = new Promise<void>(done => { release = done; });
  const change = (database: string, role: string, name: string) => withRoleLock(database, async () => {
   events.push(`${name} start`);
   const pool = new pg.Pool({ connectionString: database, max: 1 });
   try {
    await pool.query(`create role ${role}`);
    if (name === 'first') { started(); await firstHeld; }
    await pool.query(`drop role ${role}`);
   }
   finally { await pool.end(); }
   events.push(`${name} end`);
  });
  const first = change(url!, roles[0], 'first');
  let second: Promise<void> | undefined;
  try {
   await Promise.race([firstStarted, first]);
   second = change(secondUrl.href, roles[1], 'second');
   await expect.poll(async () => (await observer.query(
    "select from pg_stat_activity where application_name=$1 and datname='postgres' and wait_event_type='Lock' and wait_event='advisory'",
    [application],
   )).rowCount, { timeout: 5_000 }).toBe(1);
   expect(events).toEqual(['first start']);
  } finally {
   release();
   await Promise.all([first, second]);
  }
  expect(events).toEqual(['first start', 'first end', 'second start', 'second end']);
 }, 30_000);

 it.each(['success', 'error'])('closes its client after %s and frees the lock', async outcome => {
  const named = new URL(url!), application = `rolelock_close_${randomUUID()}`;
  named.searchParams.set('application_name', application);
  const sessions = async () => (await observer.query('select from pg_stat_activity where application_name=$1', [application])).rowCount;
  const work = withRoleLock(named.href, async () => {
   expect(await sessions()).toBe(1);
   if (outcome === 'error') throw new Error('work failed');
   return 'done';
  });
  if (outcome === 'error') await expect(work).rejects.toThrow('work failed');
  else expect(await work).toBe('done');
  await expect.poll(sessions, { timeout: 5_000 }).toBe(0);
  expect(await withRoleLock(other.href, async () => 'done')).toBe('done');
 }, 30_000);
});
