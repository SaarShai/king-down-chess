/** Run the old read paths across migration 0022 release, rollback and restore. */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { GameService as OldService } from '../../tools/fixtures/invite-38f8aefa/service';
import { PostgresMatchStore as OldStore } from '../../tools/fixtures/invite-38f8aefa/store';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { DEFAULT_OPTIONS } from './setup';
import type { Invite, JoinPreview } from './protocol';

vi.setConfig({ testTimeout: 60_000 });
const guide = readFileSync(new URL('../../supabase/README.md', import.meta.url), 'utf8');
const cancelSQL = guide.match(/`(update public\.game_invites set expires_at=[^`]+)`/)![1];
const countSQL = guide.match(/`(select count\(\*\) from public\.games g[^`]+)`/)![1];
const secret = 'local-test-invitation-secret-32-characters';
function documentedOrder(transition: 'release' | 'rollback' | 'restore') {
 const section = transition === 'release' ? guide.split('6. After the last phase:')[1].split('\n7.')[0]
  : transition === 'restore' ? guide.split('To restore the new server:')[1].split('Resume daily jobs')[0]
  : guide.split('Before rollback,')[1].split('Open links keep the old behavior:')[0];
 const steps: [string, string][] = transition === 'rollback' ? [
  ['stop', 'Stop new requests to the new server.'], ['drain', 'Let all new-server requests finish.'],
  ['cancel', cancelSQL], ['clear', countSQL], ['enable', 'Enable old-server traffic.'],
 ] : [['stop', 'Stop incoming game requests.'], ['drain', 'Let all old-server requests finish.'], ['enable', 'Enable the new server.']];
 for (const [, text] of steps) expect(section).toContain(text);
 return steps.sort((a, b) => section.indexOf(a[1]) - section.indexOf(b[1])).map(([action]) => action);
}

function deferred<T = void>() {
 let resolve!: (value: T) => void;
 const promise = new Promise<T>(done => { resolve = done; });
 return { promise, resolve };
}
const result = <T>(promise: Promise<T>) => Promise.allSettled([promise]).then(([outcome]) => outcome);
type Read = PromiseSettledResult<JoinPreview>;
function noDetails(reads: Read[]) {
 for (const read of reads) {
  expect(read.status, 'An unrelated account must get no named-invitation details').toBe('rejected');
  expect(read).toMatchObject({ reason: { code: 'INVITE_UNAVAILABLE' } });
  const message = read.status === 'rejected' ? read.reason.message : '';
  expect(JSON.stringify({ read, message })).not.toMatch(/mira|rowan|creator|options|expires_at|game_id|recipient/);
 }
}

function exposed(reads: Read[]) {
 expect(reads).toContainEqual(expect.objectContaining({ status: 'fulfilled', value: expect.objectContaining({
  creator: expect.objectContaining({ handle: 'mira' }), options: DEFAULT_OPTIONS,
 }) }));
 expect(() => noDetails(reads)).toThrow('An unrelated account must get no named-invitation details');
}

// These hashes cover the whole prior files, after only the import paths are put back.
it.each([
 ['service', 'd18d78808f52364013fdb7c66a516d8ea813312e370a408281f16c26e40db965'],
 ['store', '5431d45c08e34534fac382c6c62d31e858dc780057019ed77bb41f055566a457'],
])('keeps the %s fixture from 38f8aefa', (name, hash) => {
 const source = readFileSync(new URL(`../../tools/fixtures/invite-38f8aefa/${name}.ts`, import.meta.url), 'utf8')
  .replaceAll("from '../../../src/match/", "from './").replaceAll("from '../../../src/", "from '../");
 expect(createHash('sha256').update(source).digest('hex')).toBe(hash);
});

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
suite('old-server reads across migration 0022', () => {
 let own: URL, admin: pg.Pool, oldPool: pg.Pool, newPool: pg.Pool;
 let old: OldService, current: GameService, store: PostgresMatchStore, users: string[];
 beforeAll(async () => {
  own = await ownTestDatabase(`invitetransition${randomUUID().replaceAll('-', '').slice(0, 12)}`);
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  oldPool = new pg.Pool({ connectionString: own.href, max: 1 });
  newPool = new pg.Pool({ connectionString: own.href, max: 1 });
  old = new OldService(new OldStore(oldPool), secret);
  store = new PostgresMatchStore(newPool);
  current = new GameService(store, secret);
 }, 120_000);
 beforeEach(async () => {
  await admin.query('delete from public.games');
  await admin.query('delete from auth.users');
  await admin.query('delete from public.reserved_handles');
  users = [randomUUID(), randomUUID(), randomUUID()];
  for (const [i, user] of users.entries()) {
   await admin.query('insert into auth.users(id) values($1)', [user]);
   await admin.query('update public.profiles set handle=$2 where id=$1', [user, ['mira', 'rowan', 'alex'][i]]);
  }
 });
 afterAll(async () => {
  if (admin) await Promise.all([admin, oldPool, newPool].map(pool => pool.end()));
  if (own) {
   const server = new URL(own.href); server.pathname = '/postgres';
   const client = new pg.Client({ connectionString: server.href });
   await client.connect();
   try { await client.query(`drop database ${own.pathname.slice(1)}`); }
   finally { await client.end(); }
  }
 });
 async function heldSend() {
  const game = await current.create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS });
  const entered = deferred<Invite>(), release = deferred();
  const transaction = store.transaction.bind(store);
  const spy = vi.spyOn(store, 'transaction').mockImplementationOnce(<T>(action: (client: pg.PoolClient) => Promise<T>) => transaction(async client => {
   const value = await action(client);
   entered.resolve(value as Invite);
   await release.promise;
   return value;
  }));
  const sent = result(current.invite(users[0], game.game_id, { recipient_id: users[1] }));
  // A failed send must fail this wait too, rather than leave the gate pending.
  try {
   const invite = await Promise.race([entered.promise, sent.then(outcome => {
    if (outcome.status === 'rejected') throw outcome.reason;
    return outcome.value;
   })]);
   expect((await admin.query('select from public.game_invites where game_id=$1', [game.game_id])).rowCount).toBe(0);
   return { invite, sent, release: () => release.resolve(), restore: () => spy.mockRestore() };
  } catch (error) { release.resolve(); await sent; spy.mockRestore(); throw error; }
 }
 const key = (invite: Invite, path: 'token' | 'code') => invite[path];
 async function cancelledReads(invites: Invite[], path: 'token' | 'code') {
  const reads: Read[] = [];
  for (const invite of invites) {
   reads.push(await result(old.preview(users[2], key(invite, path))));
   await expect(old.join(users[2], key(invite, path))).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
   noDetails([await result(current.preview(users[2], key(invite, path)))]);
  }
  return reads;
 }
 async function forward(path: 'token' | 'code', actions: string[]) {
  const send = await heldSend(), connection = await oldPool.connect();
  const pending = result(old.preview(users[2], key(send.invite, path)));
  let drained = false, stopped = false;
  try {
   await expect.poll(() => oldPool.waitingCount).toBe(1);
   for (const action of actions) {
    if (action === 'stop') stopped = true;
    if (action === 'drain') {
     expect(stopped).toBe(true);
     connection.release(); drained = true;
     await pending;
    }
    if (action === 'enable') {
     send.release();
     expect(await send.sent).toMatchObject({ status: 'fulfilled' });
     noDetails([await result(current.preview(users[2], key(send.invite, path)))]);
     // The intended recipient still has a usable invitation.
     expect(await current.preview(users[1], key(send.invite, path))).toMatchObject({ creator: { handle: 'mira' }, options: DEFAULT_OPTIONS });
    }
   }
   return [await pending];
  } finally {
   if (!drained) connection.release();
   send.release(); await send.sent; await pending; send.restore();
  }
 }
 async function rollback(path: 'token' | 'code', actions: string[]) {
  const existing = await current.create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS, recipient_id: users[1] }, randomUUID());
  const send = await heldSend();
  const reads: Read[] = [];
  let stopped = false;
  try {
   for (const action of actions) {
    if (action === 'stop') stopped = true;
    if (action === 'drain') expect(stopped).toBe(true);
    if (action === 'drain' || action === 'enable') {
     send.release();
     expect(await send.sent).toMatchObject({ status: 'fulfilled' });
    }
    if (action === 'cancel') await admin.query(cancelSQL);
    if (action === 'clear') {
     // The documented old minute sweep ends the cancelled waiting games as no_start.
     expect(await old.sweep()).toBe(2);
     expect(Number((await admin.query(countSQL)).rows[0].count)).toBe(0);
    }
    if (action === 'enable') {
     reads.push(await result(old.preview(users[2], key(send.invite, path))));
     reads.push(await result(old.preview(users[2], key(existing.invite!, path))));
    }
   }
   noDetails(await cancelledReads([send.invite, existing.invite!], path));
   expect((await admin.query('select from public.game_invites where used_by is not null')).rowCount).toBe(0);
   return reads;
  } finally { send.release(); await send.sent; send.restore(); }
 }
 for (const path of ['token', 'code'] as const) {
  for (const transition of ['release', 'restore'] as const) {
   it(`${transition}: no details through an old ${path} preview held across the change`, async () => {
    noDetails(await forward(path, documentedOrder(transition)));
   });
   it(`${transition}: the unsafe order exposes details through an old ${path} preview`, async () => {
    exposed(await forward(path, ['stop', 'enable', 'drain']));
   });
  }
  it(`rollback: no details through an old ${path} preview after a late send`, async () => {
   noDetails(await rollback(path, documentedOrder('rollback')));
  });
  it(`rollback: the unsafe order exposes a late send through an old ${path} preview`, async () => {
   exposed(await rollback(path, ['cancel', 'enable', 'stop', 'drain', 'cancel', 'clear']));
  });
 }
});
