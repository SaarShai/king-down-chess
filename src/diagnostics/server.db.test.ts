import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer, request, type Server } from 'node:http';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiHandler, type ApiOptions } from '../api/http';
import { AuthenticationError } from '../plugin/auth';
import { MatchServiceError, GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { cleanup } from '../online/jobs';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';
import { errorFingerprint, MAX_ERROR_BODY, scrub, type ClientErrorReport } from './data';
import { createErrorWriter, errorAdmission } from './server';

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
 const profile = vi.fn(async (): Promise<unknown> => { throw Object.assign(new TypeError('Server person@example.com token=private'), { stack: 'TypeError: fault\n at f (/var/task/server.mjs:12:8)' }); });
 const report = (message = 'Board failed'): ClientErrorReport => {
  const frames = ['/assets/app-test.js:2:4'];
  return { kind: 'error', name: 'Error', message, frames, route: '/g/:game', build, browser: 'Safari 18', size: 'phone', fingerprint: errorFingerprint('Error', scrub(message), frames[0]) };
 };
 const rows = async () => (await admin.query('select * from public.client_errors order by id')).rows;
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
  await admin.query('truncate public.client_errors'); profile.mockClear();
  options = { games: {} as ApiOptions['games'], accounts: { profile } as unknown as ApiOptions['accounts'], safety: {} as ApiOptions['safety'], publicOrigin: origin,
   operations: new Set(['GET /api/me/profile']), verify: async () => randomUUID(), webAccountAccess: async () => ({ enabled: true, expiresAt: performance.now() + 5000 }), recordError: createErrorWriter(runtime), build };
  handler = createApiHandler(options);
 });
 afterAll(async () => {
  server?.closeAllConnections(); if (server) await new Promise<void>(done => server.close(() => done()));
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
  expect(await rows()).toMatchObject([{ count: '2', message: 'Fault [redacted]', routes: ['/g/:game', '/play'], browsers: ['Chrome 131', 'Safari 18'] }]);
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
  expect(await rows()).toMatchObject([{ kind: 'server', name: 'TypeError', message: 'Server [redacted] [redacted]', frames: ['server.mjs:12:8'], routes: ['/api/me/profile'], browsers: [], size_classes: [] }]);
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
});
