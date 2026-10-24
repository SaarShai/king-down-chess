import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer, request, type Server } from 'node:http';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiHandler, createInternalHandler, type ApiOptions } from '../api/http';
import { AuthenticationError } from '../plugin/auth';
import { MatchServiceError, GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { cleanup } from '../online/jobs';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';
import { errorFingerprint, MAX_ERROR_BODY, errorMessage, type ClientErrorReport } from './data';
import { createErrorWriter, errorAdmission, recordServerError } from './server';

it('limits a function instance without an address key', () => {
 vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-01Z'));
 try {
  const admit = errorAdmission();
  for (let i = 0; i < 60; i++) expect(admit()).toBe(true);
  expect(admit()).toBe(false); vi.advanceTimersByTime(60_000); expect(admit()).toBe(true);
 } finally { vi.useRealTimers(); }
});

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
suite('first-party fault HTTP and database writes', () => {
 let own: URL, admin: pg.Pool, runtime: pg.Pool, server: Server, origin: string, options: ApiOptions;
 let handler: ReturnType<typeof createApiHandler>;
 const role = `errors_test_${randomUUID().replaceAll('-', '')}`, build = 'a'.repeat(40);
 const profile = vi.fn(async (): Promise<unknown> => { throw Object.assign(new TypeError('Server person@example.com token=private'), { stack: 'TypeError: Server person@example.com token=private\n    at f (/var/task/server.mjs:12:8)' }); });
 const assets = new Set(['/assets/app-test.js']);
 const pending: Promise<unknown>[] = [];
 const settle = async () => { await Promise.all(pending.splice(0)); };
 const report = (message = 'Board failed'): ClientErrorReport => {
  const frames = ['/assets/app-test.js:2:4'];
  return { kind: 'error', name: 'Error', message, frames, route: '/g/:game', build, browser: 'Safari 18', size: 'phone', fingerprint: errorFingerprint('Error', errorMessage(message), frames[0]) };
 };
 const rows = async () => { await settle(); return (await admin.query('select * from public.client_errors order by id')).rows; };
 const post = (body: unknown = report(), site: string | null = origin) => fetch(origin + '/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(site !== null && { Origin: site }) }, body: typeof body === 'string' ? body : JSON.stringify(body) });
 beforeAll(async () => {
  own = await ownTestDatabase('errors'); admin = new pg.Pool({ connectionString: own.href, max: 1 });
  const password = randomUUID(), awaitableGrants = await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, () => admin.query((awaitableGrants).replaceAll('kingdown_plugin_runtime', role) + `\nalter role ${role} password '${password}'`));
  const url = new URL(own.href); url.username = role; url.password = password;
  runtime = new pg.Pool({ connectionString: url.href, max: 2 });
  server = createServer((req, res) => { void handler(req, res); }); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
 }, 60_000);

 beforeEach(async () => {
  await settle();
  vi.stubGlobal(Symbol.for('@vercel/request-context'), { get: () => ({ waitUntil: (work: Promise<unknown>) => { pending.push(work); } }) });
  await admin.query('truncate public.client_errors'); profile.mockClear();
  options = { games: {} as ApiOptions['games'], accounts: { profile } as unknown as ApiOptions['accounts'], safety: {} as ApiOptions['safety'], publicOrigin: origin,
   operations: new Set(['GET /api/me/profile']), verify: async () => randomUUID(), webAccountAccess: async () => ({ enabled: true, expiresAt: performance.now() + 5000 }), recordError: createErrorWriter(runtime, assets), errorAssets: assets, build };
  handler = createApiHandler(options);
 });
 afterAll(async () => {
  server?.closeAllConnections(); if (server) await new Promise<void>(done => server.close(() => done()));
  await settle(); vi.unstubAllGlobals();
  await runtime?.end();
  if (admin) { await admin.query('truncate public.client_errors'); await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`)); await admin.end(); }
 });
 it('accepts a report without an account, even with account routes closed', async () => {
  handler = createApiHandler({ ...options, operations: new Set(), verify: undefined });
  const response = await post(); expect(response.status).toBe(204); expect(await response.text()).toBe('');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  expect(await rows()).toMatchObject([{ count: '1', frames: ['/assets/app-test.js:2:4'], routes: ['/g/:game'], browsers: ['Safari 18'] }]);
 });
 it('drops a wrong or absent origin, wrong shape, bad JSON and oversized body', async () => {
  for (const site of ['https://wrong.example', 'null', null]) expect((await post(report(), site)).status).toBe(204);
  for (const body of [{ ...report(), account_id: randomUUID() }, { ...report(), kind: 'server' }, { ...report(), frames: ['https://kingdown.dev/assets/app.js:1:2'] }, { ...report(), route: '/g/private-id' }, { ...report(), browser: 'private raw user agent' }, { ...report(), fingerprint: '0'.repeat(16) }, '{broken', 'x'.repeat(MAX_ERROR_BODY + 1)]) expect((await post(body)).status).toBe(204);
  expect(await rows()).toEqual([]);
  const status = await new Promise<number>((done, fail) => {
   const req = request(origin + '/api/client-errors', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' } }, res => { res.resume(); res.on('end', () => done(res.statusCode!)); });
   req.on('error', fail); req.write('x'.repeat(3000)); req.end('x'.repeat(2000));
  });
  expect(status).toBe(204); expect(await rows()).toEqual([]);
 });
 it('scrubs at the server boundary and adds counts in the same hour', async () => {
  const first = report('Fault person@example.com');
  expect((await post(first)).status).toBe(204);
  expect((await post({ ...first, browser: 'Chrome 131', route: '/play' })).status).toBe(204);
  expect(await rows()).toMatchObject([{ count: '2', message: 'Unlisted message', routes: ['/g/:game', '/play'], browsers: ['Chrome 131', 'Safari 18'] }]);
  await admin.query("update public.client_errors set hour=hour-interval '1 hour'"); await post(first);
  expect(await rows()).toHaveLength(2);
  await post({ ...first, build: 'b'.repeat(40) }); expect(await rows()).toHaveLength(3);
 });
 it('deletes a 31-day-old row, keeps current rows, and runs daily cleanup without a new fault', async () => {
  await post(); await admin.query("update public.client_errors set first_seen=now()-interval '31 days',last_seen=now()-interval '31 days'");
  await post(report('Different fault')); expect(await rows()).toHaveLength(1);
  expect((await runtime.query('delete from public.client_errors')).rowCount).toBe(0);
  await admin.query("update public.client_errors set first_seen=now()-interval '31 days',last_seen=now()-interval '31 days'");
  await cleanup(new GameService(new PostgresMatchStore(runtime))); expect(await rows()).toEqual([]);
 });
 it('keeps a failed insert out of both the 204 and the server fault response', async () => {
  await admin.query('alter table public.client_errors add constraint error_test_refuse check (false)');
  try {
   expect((await post()).status).toBe(204);
   const response = await fetch(origin + '/api/me/profile', { headers: { Authorization: 'Bearer test' } });
   expect(response.status).toBe(500); expect(await response.json()).toEqual({ code: 'UNAVAILABLE', message: 'Request failed. Retry.' });
   expect(await rows()).toEqual([]);
  } finally { await admin.query('alter table public.client_errors drop constraint error_test_refuse'); }
 });
 it('records only an unexpected server fault, with no request or actor data', async () => {
  const response = await fetch(origin + '/api/me/profile?token=private', { headers: { Authorization: 'Bearer test' } });
  expect(response.status).toBe(500);
  expect(await rows()).toMatchObject([{ kind: 'server', name: 'TypeError', message: 'Unlisted message', frames: ['server.mjs:12:8'], routes: ['/api/me/profile'], browsers: [], size_classes: [] }]);
  for (const error of [new MatchServiceError('FORBIDDEN', 403, 'Expected refusal'), new AuthenticationError()]) {
   profile.mockRejectedValueOnce(error); await fetch(origin + '/api/me/profile', { headers: { Authorization: 'Bearer test' } });
  }
  expect(await rows()).toHaveLength(1);
 });
 it('has RLS and no browser grant or policy, and can run the migration again', async () => {
  const migration = await readFile(new URL('../../supabase/migrations/0019_client_errors.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, async () => { await admin.query(migration); await admin.query(migration); });
  expect((await admin.query("select relrowsecurity from pg_class where oid='public.client_errors'::regclass")).rows[0].relrowsecurity).toBe(true);
  for (const browser of ['anon', 'authenticated']) {
   const result = await admin.query("select has_table_privilege($1,'public.client_errors','SELECT,INSERT,UPDATE,DELETE') as allowed", [browser]);
   expect(result.rows[0].allowed).toBe(false);
  }
  expect((await admin.query("select roles from pg_policies where tablename='client_errors'")).rows.every(row => !row.roles.includes('anon') && !row.roles.includes('authenticated'))).toBe(true);
 });
 it('drops the 61st report in one function instance', async () => {
  for (let i = 0; i < 61; i++) expect((await post()).status).toBe(204);
  expect(await rows()).toMatchObject([{ count: '60' }]);
 });
 it('adds four concurrent function writes without a lost count', async () => {
  const pools = Array.from({ length: 4 }, () => new pg.Pool({ connectionString: runtime.options.connectionString, max: 1 }));
  try {
   await Promise.all(pools.map(pool => createErrorWriter(pool, assets)(report())));
   expect(await rows()).toMatchObject([{ count: '4' }]);
  } finally { await Promise.all(pools.map(pool => pool.end())); }
 });
 it('caps route and browser sets at twenty values', async () => {
  const words = ['play', 'profile', 'settings', 'g', 'j', 'api', 'games', 'me', 'status', 'client-errors', 'seen', 'commands', 'preview', 'invite', 'invites', 'redeem', 'lobby', 'find', 'accept', 'cancel', 'handle', 'deletion', 'notifications', 'relations', 'reports'];
  for (const [i, word] of words.entries()) await options.recordError!({ ...report(), route: `/api/${word}`, browser: `Chrome ${100 + i}` });
  const stored = await rows(); expect(stored).toHaveLength(1);
  expect(stored[0].count).toBe('25'); expect(stored[0].routes).toHaveLength(20); expect(stored[0].browsers).toHaveLength(20);
 });
 it('stores only approved forms for every private-text probe, including an Auth error', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const auth = createClient('http://127.0.0.1:1', 'test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async () => new Response(JSON.stringify({ msg: 'Player message: Meet me at the station' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) } });
  const { error } = await auth.auth.signInWithPassword({ email: 'test@example.com', password: 'test' });
  expect(error).toBeTruthy();
  const cases = ['bad FEN t7/8/8/8/8/8/8/K6X w - - 0 1', 'Player message: Meet me at the station', 'account 123456789',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.4 Safari/605.1.15',
   'GET /assets/app.js?room=private-room#private-fragment failed', error!.message];
  for (const raw of cases) {
   await admin.query('truncate public.client_errors');
   await post(report(raw));
   expect(await rows()).toMatchObject([{ message: raw.startsWith('bad FEN ') ? 'bad FEN [value]' : 'Unlisted message' }]);
   await admin.query('truncate public.client_errors');
   await recordServerError(options.recordError, new Error(raw), '/api/me/profile', build);
   expect(await rows()).toMatchObject([{ kind: 'server', message: raw.startsWith('bad FEN ') ? 'bad FEN [value]' : 'Unlisted message' }]);
  }
 });
 it.each(['account123456789', 'K6X', 'MeetMeAtTheStation', 'd137864c-e174-4f38-9277-6bdd0a4289dc', 'person@example.com', 'e2e4'])('removes private engine names from sent bodies and stored rows: %s', async value => {
  vi.resetModules();
  const target = new EventTarget(), sent: Blob[] = [];
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', { origin: 'https://kingdown.dev', pathname: '/play' });
  vi.stubGlobal('navigator', { userAgent: 'Chrome/130.0', sendBeacon: (_: string, body: Blob) => { sent.push(body); return true; } });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  try {
   const { installErrorRecorder } = await import('./browser'); installErrorRecorder();
   let fault: Error;
   try { const input = undefined as unknown as Record<string, unknown>; input[value]; } catch (error) { fault = error as Error; }
   fault!.stack = `TypeError: ${fault!.message}\n at f (https://kingdown.dev/assets/app-test.js:2:4)`;
   target.dispatchEvent(Object.assign(new Event('error'), { error: fault! }));
   expect(sent).toHaveLength(1);
   const body = await sent[0].text(), input = JSON.parse(body);
   const message = ['person@example.com', 'd137864c-e174-4f38-9277-6bdd0a4289dc'].includes(value) ? 'Unlisted message' : 'Cannot read properties of [value] (reading [value])';
   const fingerprint = errorFingerprint('TypeError', message, '/assets/app-test.js:2:4');
   expect(body).not.toContain(value);
   expect(input).toMatchObject({ message, fingerprint });
   expect((await post(input)).status).toBe(204);
   let stored = await rows();
   expect(stored).toMatchObject([{ message, fingerprint, count: '1' }]);
   expect(JSON.stringify(stored)).not.toContain(value);
   // The server also checks raw messages from clients that omit the browser check.
   expect((await post({ ...input, message: fault!.message })).status).toBe(204);
   stored = await rows();
   expect(stored).toMatchObject([{ message, fingerprint, count: '2' }]);
   expect(JSON.stringify(stored)).not.toContain(value);
   await admin.query('truncate public.client_errors');
   fault!.stack = `TypeError: ${fault!.message}\n    at f (/var/task/server.mjs:2:4)`;
   await recordServerError(options.recordError, fault!, '/api/me/profile', build);
   stored = await rows();
   expect(stored).toMatchObject([{ kind: 'server', message }]);
   expect(JSON.stringify(stored)).not.toContain(value);
  } finally { vi.unstubAllGlobals(); }
 });
 it('drops unknown browser assets and removes false server frames from the message', async () => {
  const unknown = '/assets/d137864c-e174-4f38-9277-6bdd0a4289dc.js:1:2';
  const input = report(); input.frames = [unknown]; input.fingerprint = errorFingerprint(input.name, errorMessage(input.message), unknown);
  await post(input); expect(await rows()).toEqual([]);
  input.frames.push('/assets/app-test.js:2:4'); await post(input);
  expect(await rows()).toMatchObject([{ frames: ['/assets/app-test.js:2:4'] }]);
  const message = 'Unexpected input\nsrc/api/d137864c-e174-4f38-9277-6bdd0a4289dc.ts:1:2\n    at f (/task/src/api/d137864c-e174-4f38-9277-6bdd0a4289dc.ts:1:2)';
  const error = new Error(message); error.stack = `Error: ${message}\n    at f (/task/server.mjs:10:20)`;
  await recordServerError(options.recordError, error, '/api/me/profile', build);
  expect((await rows()).find(row => row.kind === 'server')?.frames).toEqual(['server.mjs:10:20']);
 });
 it('stops blocked SQL, holds write slots, drops pool waits and sends the fault response first', async () => {
  const lock = new pg.Client({ connectionString: own.href }); await lock.connect();
  const blocked = async () => (await admin.query("select pid from pg_stat_activity where datname=current_database() and usename=$1 and wait_event_type='Lock'", [role])).rows;
  await lock.query('begin'); await lock.query('lock table public.client_errors in access exclusive mode');
  try {
   const start = performance.now();
   const first = options.recordError!(report()), second = options.recordError!(report());
   await vi.waitFor(async () => expect(await blocked()).toHaveLength(2));
   const dropStart = performance.now(); await options.recordError!(report());
   expect(performance.now() - dropStart).toBeLessThan(100);
   const responseStart = performance.now();
   const response = await fetch(origin + '/api/me/profile', { headers: { Authorization: 'Bearer test' } });
   expect(response.status).toBe(500); await response.text();
   expect(performance.now() - responseStart).toBeLessThan(350);
   await Promise.all([first, second]); await settle();
   expect(performance.now() - start).toBeLessThan(1500);
   expect(await blocked()).toHaveLength(0);
   expect(runtime.totalCount).toBe(2); expect(runtime.idleCount).toBe(2);
   for (let round = 0; round < 2; round++) {
    await Promise.all([options.recordError!(report()), options.recordError!(report())]);
    expect(await blocked()).toHaveLength(0);
   }
   // A new writer must also drop when other API work owns both pool clients.
   const a = await runtime.connect(), b = await runtime.connect();
   try {
    const now = performance.now(); await createErrorWriter(runtime, assets)(report());
    expect(performance.now() - now).toBeLessThan(100); expect(runtime.waitingCount).toBe(0);
   } finally { a.release(); b.release(); }
  } finally { await lock.query('rollback'); await lock.end(); }
  await post(); expect(await rows()).toHaveLength(1);
 });
 it('returns a fault before its own blocked recorder completes and registers the lifetime work', async () => {
  const lock = new pg.Client({ connectionString: own.href }); await lock.connect();
  await lock.query('begin'); await lock.query('lock table public.client_errors in access exclusive mode');
  try {
   const release = vi.fn();
   handler = createApiHandler({ ...options, operations: new Set(['PATCH /api/me/profile']), accounts: { updateSettings: profile } as unknown as ApiOptions['accounts'], admit: () => release, currentUser: async () => {} });
   const start = performance.now(); const response = await fetch(origin + '/api/me/profile', { method: 'PATCH', headers: { Authorization: 'Bearer test' } });
   await response.text(); expect(response.status).toBe(500); expect(performance.now() - start).toBeLessThan(350);
   expect(pending).toHaveLength(1); expect(release).toHaveBeenCalledOnce();
   await vi.waitFor(async () => expect((await admin.query("select pid from pg_stat_activity where datname=current_database() and usename=$1 and wait_event_type='Lock'", [role])).rowCount).toBe(1));
   await settle(); expect(performance.now() - start).toBeGreaterThanOrEqual(450);
   expect((await admin.query("select pid from pg_stat_activity where datname=current_database() and usename=$1 and wait_event_type='Lock'", [role])).rowCount).toBe(0);
  } finally { await lock.query('rollback'); await lock.end(); }
 });
 it('runs capped retention batches and skips a locked expired row', async () => {
  await post();
  await admin.query(`insert into public.client_errors(fingerprint,build,hour,kind,name,message,frames,routes,browsers,size_classes,first_seen,last_seen)
   select lpad(to_hex(n),16,'0'),$1,now(),'error','Error','Unlisted message','{}','{}','{}','{}',now()-interval '31 days',now()-interval '31 days' from generate_series(1,351) n`, [build]);
  const lock = new pg.Client({ connectionString: own.href }); await lock.connect(); await lock.query('begin');
  await lock.query('select id from public.client_errors where fingerprint=$1 for update', ['0000000000000001']);
  await admin.query(`create table public.error_cleanup_batches(n integer);
   create function public.error_cleanup_batch() returns trigger language plpgsql security definer set search_path='' as $$
    begin insert into public.error_cleanup_batches select count(*) from removed_rows; return null; end $$;
   create trigger error_cleanup_batch after delete on public.client_errors referencing old table as removed_rows for each statement execute function public.error_cleanup_batch()`);
  try {
   await post(); expect(await rows()).toHaveLength(252);
   expect((await admin.query('select n from public.error_cleanup_batches')).rows.map(row => row.n)).toEqual([100]);
   await admin.query('truncate public.error_cleanup_batches');
   await cleanup(new GameService(new PostgresMatchStore(runtime)));
   expect((await rows()).filter(row => new Date(row.last_seen).getTime() < Date.now() - 30*86400000)).toHaveLength(1);
   expect(await rows()).toHaveLength(2);
   expect((await admin.query('select n from public.error_cleanup_batches')).rows.map(row => row.n)).toEqual([100, 100, 50]);
  } finally {
   await lock.query('rollback'); await lock.end();
   await admin.query('drop trigger error_cleanup_batch on public.client_errors; drop function public.error_cleanup_batch(); drop table public.error_cleanup_batches');
  }
  await cleanup(new GameService(new PostgresMatchStore(runtime))); expect(await rows()).toHaveLength(1);
 });
 it.each(['missing', 'locked'])('keeps API and daily account work active when fault cleanup is %s', async mode => {
  const actor = randomUUID();
  await admin.query('insert into auth.users(id,email) values($1,$2)', [actor, actor + '@example.com']);
  await admin.query("insert into public.account_deletions(user_id,run_after) values($1,now()-interval '1 day')", [actor]);
  const lock = new pg.Client({ connectionString: own.href }); await lock.connect();
  if (mode === 'missing') await admin.query('alter table public.client_errors rename to hidden_client_errors');
  else { await lock.query('begin'); await lock.query('lock table public.client_errors in access exclusive mode'); }
  try {
   expect((await post()).status).toBe(204);
   expect((await fetch(origin + '/api/me/profile', { headers: { Authorization: 'Bearer test' } })).status).toBe(500);
   await settle();
   const internal = createInternalHandler({ games: new GameService(new PostgresMatchStore(runtime)), publicOrigin: origin, secret: 'x'.repeat(32) });
   handler = internal;
   const response = await fetch(origin + '/internal/daily', { method: 'POST', headers: { 'x-kingdown-internal': 'x'.repeat(32) } });
   expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ deleted: 1, reports: 0 });
   expect((await admin.query('select id from auth.users where id=$1', [actor])).rowCount).toBe(0);
  } finally {
   await lock.query('rollback'); await lock.end();
   if (mode === 'missing') await admin.query('alter table public.hidden_client_errors rename to client_errors');
   await admin.query('delete from public.account_deletions where user_id=$1', [actor]);
   await admin.query('delete from auth.users where id=$1', [actor]);
  }
 });

});
