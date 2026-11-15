// The daily job's time budget counts from the request start, through a slow cold start (PR 363 reviews).
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
vi.mock('./chatgpt-plugin.mjs', () => ({ CHATGPT_PLUGIN: false }));
vi.mock('./muse-connector.mjs', () => ({ MUSE_CONNECTOR: false, MUSE_PATHS: [] }));
vi.mock('./plugin-db-config.mjs', () => ({ pluginDatabaseConfig: () => ({}), testDatabase: () => {} }));
const state = vi.hoisted(() => ({ startupMs: 0, signals: [] as AbortSignal[], statements: [] as string[] }));
// A cold start that spends `startupMs` on its database check.
vi.mock('./plugin-db-check.mjs', () => ({ checkPluginDatabase: async () => { await new Promise(resolve => setTimeout(resolve, state.startupMs)); return []; } }));
vi.mock('@vercel/functions', () => ({ attachDatabasePool() {}, waitUntil() {} }));
// A mail service that answers only when the job stops it.
vi.mock('../src/online/mail.ts', () => ({
 deletionMail: (to: string) => ({ to, subject: 'test', text: 'test' }),
 resendSender: () => async (_mail: unknown, signal: AbortSignal) => { state.signals.push(signal); await new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('stopped')), { once: true })); },
}));
vi.mock('pg', () => {
 async function query(statement: string | { text: string }) {
  const text = typeof statement === 'string' ? statement : statement.text;
  state.statements.push(text);
  // The invitation cleanup takes 6 s (PR 363 review 3).
  if (text.includes('delete from public.game_invites')) await new Promise(resolve => setTimeout(resolve, 6000));
  if (text.includes('from public.account_deletions d')) return { rows: [{ user_id: '00000000-0000-4000-8000-000000000001' }] };
  if (text.includes('kingdown_jobs.deletion_email')) return { rows: [{ address: 'p@example.com' }] };
  if (text.includes('kingdown_jobs.delete_account')) return { rows: [{ done: true }] };
  return { rows: [], rowCount: 0 };
 }
 return { Pool: class { on() {} async end() {} query = query; async connect() { return { query, release() {} }; } } };
});
beforeEach(() => {
 vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(0);
 Object.assign(state, { signals: [], statements: [] });
 vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'info').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {});
 vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no network in this test'); }));
 for (const [key, value] of Object.entries({
  KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown.dev', SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime:fake@db.utqzovjmclfyojedmwok.supabase.co/postgres?sslmode=require',
  KINGDOWN_INTERNAL_SECRET: 'x'.repeat(32), RESEND_API_KEY: 're_test', KINGDOWN_MAIL_FROM: 'King Down <hello@kingdown.dev>',
 })) vi.stubEnv(key, value);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

/** Calls the deployed handler (a new process: a cold start) for the daily job. */
async function daily() {
 const { default: handler } = await import('./plugin-server.mjs');
 const req = { url: '/internal/daily', method: 'POST', headers: { host: 'kingdown.dev', 'x-kingdown-internal': 'x'.repeat(32) }, resume() {} } as unknown as IncomingMessage;
 const end = vi.fn(), res = { setHeader() {}, writeHead() {}, end, headersSent: false } as unknown as ServerResponse;
 return { work: handler(req, res), end };
}

it('answers the daily job 25 s after the request start, cold start included', async () => {
 state.startupMs = 6000;
 const { work, end } = await daily();
 await vi.advanceTimersByTimeAsync(24_999);
 expect(end).not.toHaveBeenCalled();
 expect(state.signals).toHaveLength(1);
 await vi.advanceTimersByTimeAsync(1);
 expect(end).toHaveBeenCalledTimes(1);
 await work;
 expect(Date.now()).toBe(25_000);
 expect(state.signals[0].aborted).toBe(true);
 expect(fetch).not.toHaveBeenCalled();
});

it('does no daily work when the cold start uses the whole budget', async () => {
 // PR 363 review 3: a 26 s cold start, then a 6 s invitation cleanup, answered at 32 s.
 state.startupMs = 26_000;
 const { work, end } = await daily();
 await vi.advanceTimersByTimeAsync(26_000);
 expect(end).toHaveBeenCalledTimes(1);
 await work;
 expect(Date.now()).toBe(26_000);
 expect(state.statements).toEqual([]);
 expect(state.signals).toEqual([]);
 expect(fetch).not.toHaveBeenCalled();
});
