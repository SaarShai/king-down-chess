/** Compiled entry for both a standalone Node server and a Vercel Node function. */
import { randomUUID } from 'node:crypto';
import { diagnostic } from '../src/plugin/diagnostics.ts';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { createServer } from 'node:http';
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { pluginDatabaseConfig } from './plugin-db-config.mjs';
import { createTokenVerifier, isLoopback, pluginOrigin } from '../src/plugin/auth.ts';
import { consentConfig, renderConsent } from '../src/plugin/consent-config.ts';
import { createPluginHandler } from '../src/plugin/http.ts';
import { MatchService } from '../src/match/service.ts';
import { PostgresMatchStore } from '../src/match/store.ts';
import { createApiHandler, createInternalHandler, sessionVerifier } from '../src/api/http.ts';
import { AccountService } from '../src/online/accounts.ts';
import { SafetyService } from '../src/online/safety.ts';
import { resendSender } from '../src/online/mail.ts';

/** `sessionKeys` (a jose key set) lets a local check sign website sessions itself; never in production. */
export async function configurePlugin(env = process.env, { localDev = false, sessionKeys } = {}) {
  if (sessionKeys && !localDev) throw new Error('Test session keys require local development');
  const publicOrigin = pluginOrigin(env.KINGDOWN_PLUGIN_ORIGIN || (localDev ? 'http://127.0.0.1:3100' : ''));
  const connectionString = env.KINGDOWN_PLUGIN_DATABASE_URL;
  if (!connectionString) throw new Error('KINGDOWN_PLUGIN_DATABASE_URL is required');
  let db;
  try { db = new URL(connectionString); } catch { throw new Error('Expected a PostgreSQL connection URL'); }
  if (!['postgres:', 'postgresql:'].includes(db.protocol)) throw new Error('Expected a PostgreSQL connection URL');
  let auth, config, consent;

  if (localDev) {
    if (env.NODE_ENV === 'production' || !isLoopback(new URL(publicOrigin).hostname) || !isLoopback(db.hostname)) throw new Error('Local personas require loopback HTTP and a disposable loopback database');
  } else {
    if (new URL(publicOrigin).protocol !== 'https:') throw new Error('Production OAuth requires an HTTPS origin');
    if (env.KINGDOWN_PLUGIN_OAUTH_READY !== '1' || !env.SUPABASE_URL) throw new Error('Enable Supabase OAuth, consent/client registration and its resource audience hook before setting KINGDOWN_PLUGIN_OAUTH_READY=1');
    config = consentConfig(env);
    auth = createTokenVerifier({ supabaseUrl: env.SUPABASE_URL, publicOrigin, clientIds: config.clientIds, publishableKey: config.publishableKey });
    // RFC 8414 path insertion for an issuer containing /auth/v1; published by Supabase MCP docs.
    const discovery = new URL(`/.well-known/oauth-authorization-server/auth/v1`, auth.issuer);
    const response = await fetch(discovery, { signal: AbortSignal.timeout(5000), redirect: 'error' });
    if (!response.ok) throw new Error('Supabase OAuth discovery is unavailable; enable and verify the OAuth server before production');
    const metadata = await response.json();
    if (metadata.issuer !== auth.issuer || !Array.isArray(metadata.scopes_supported) || !metadata.scopes_supported.includes('openid')) throw new Error('Supabase OAuth discovery has an incompatible issuer or scopes');
  }
  // A local run serves the consent page too when it has the public Supabase settings.
  const page = config ?? (localDev && env.SUPABASE_URL ? consentConfig(env) : undefined);
  if (page) consent = { html: renderConsent(await readFile(new URL('./consent.html', import.meta.url), 'utf8'), page), script: await readFile(new URL('./consent.mjs', import.meta.url), 'utf8'), supabaseOrigin: page.supabaseUrl };
  const resourceHtml = await readFile(new URL('./board.html', import.meta.url), 'utf8');
  const pool = new Pool({ ...pluginDatabaseConfig(db, { localDev }), max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  pool.on('error', error => { console.error('King Down database connection failed', diagnostic(error)); });
  try { await checkPluginDatabase(pool, config, auth?.resource); }
  catch (error) { await pool.end(); throw error; }
  const store = new PostgresMatchStore(pool), service = new MatchService(store), games = service.games;
  const mcp = createPluginHandler({ consent, service, publicOrigin, resourceHtml, auth, localDev });
  // The website signs in with Supabase Auth; without SUPABASE_URL, /api answers 503.
  const api = createApiHandler({ games, accounts: new AccountService(store), safety: new SafetyService(store), publicOrigin, verify: env.SUPABASE_URL ? sessionVerifier(env.SUPABASE_URL, sessionKeys) : undefined });
  const internal = createInternalHandler({ games, publicOrigin, secret: env.KINGDOWN_INTERNAL_SECRET, sender: () => resendSender(env) });
  // One function serves every server path of kingdown.dev: the website API, the jobs, then MCP and its OAuth pages.
  const handler = async (req, res) => {
    const path = req.url?.startsWith('/') && URL.canParse(req.url, publicOrigin) ? new URL(req.url, publicOrigin).pathname : '';
    if (/^\/api(\/|$)/.test(path)) return api(req, res);
    if (/^\/internal(\/|$)/.test(path)) return internal(req, res);
    await mcp(req, res);
  };
  return { handler, pool, publicOrigin };
}
let configured;
/** The function adapter never enables local personas. */
export default async function handler(req, res) {
  try { configured ??= configurePlugin().catch(error => { configured = undefined; throw error; }); await (await configured).handler(req, res); }
  catch (error) { console.error('King Down startup failed', { requestId: randomUUID(), ...diagnostic(error) }); if (!res.headersSent) { res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: 'King Down server is not configured' })); } else res.destroy(); }
}
export async function startPluginServer({ localDev = false } = {}) {
  const app = await configurePlugin(process.env, { localDev });
  const url = new URL(app.publicOrigin), port = Number(process.env.PORT || url.port || (localDev ? 3100 : 3000));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port');
  if (localDev && port !== Number(url.port || (url.protocol === 'https:' ? 443 : 80))) throw new Error('Local port must match KINGDOWN_PLUGIN_ORIGIN');
  const server = createServer({ requestTimeout: 20000, headersTimeout: 10000 }, (req, res) => { void app.handler(req, res).catch(() => { if (!res.headersSent) { res.statusCode = 500; res.end('Request failed'); } else res.destroy(); }); });
  server.listen(port, localDev ? '127.0.0.1' : '0.0.0.0', () => console.log(`King Down MCP listening at ${app.publicOrigin}/mcp${localDev ? ' (loopback personas only)' : ''}`));
  const stop = () => { server.close(() => { void app.pool.end(); }); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  return server;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--local-dev')) throw new Error('Only --local-dev is supported');
  await startPluginServer({ localDev: args.includes('--local-dev') });
}
