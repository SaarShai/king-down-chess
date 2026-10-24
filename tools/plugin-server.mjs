/** Compiled entry for both a standalone Node server and a Vercel Node function. */
import { randomUUID } from 'node:crypto';
import { diagnostic } from '../src/plugin/diagnostics.ts';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { createServer } from 'node:http';
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { pluginDatabaseConfig, testDatabase } from './plugin-db-config.mjs';
import { createTokenVerifier, isLoopback, pluginOrigin } from '../src/plugin/auth.ts';
import { consentConfig, renderConsent } from '../src/plugin/consent-config.ts';
import { createPluginHandler } from '../src/plugin/http.ts';
import { GameService } from '../src/match/service.ts';
import { PluginService } from '../src/plugin/service.ts';
import { PostgresMatchStore } from '../src/match/store.ts';
import { createApiHandler, createInternalHandler, sessionVerifier } from '../src/api/http.ts';
import { createWebAccountAccess } from '../src/api/account-access.ts';
import { AccountService } from '../src/online/accounts.ts';
import { SafetyService } from '../src/online/safety.ts';
import { ART_HEADERS, artType } from './plugin-art-headers.mjs';
import { stagingConfig } from './staging-config.mjs';
import { createAdmission } from '../src/api/admission.ts';
import { createErrorWriter } from '../src/diagnostics/server.ts';
import { createCurrentUserCheck } from '../src/api/current-user.ts';

// A deployed server (staging or production) serves the website account API. The 0016 web_account_access
// switch (enabled=false by default) keeps every operation closed until the owner opens it. A local run
// without website test keys keeps the API closed.
const WEB_OPERATIONS = new Set();
export const ENABLED_WEB_OPERATIONS = new Set([
  'GET /api/status',
  'POST /api/games',
  'GET /api/games/:id',
  'POST /api/games/:id/seen',
  'POST /api/games/:id/commands',
 'POST /api/games/:id/preview',
  'POST /api/games/:id/invite',
  'POST /api/invites/redeem',
  'GET /api/me/games',
  'GET /api/me/profile',
  'PATCH /api/me/profile',
  'POST /api/me/handle',
  'POST /api/me/deletion',
  'DELETE /api/me/deletion',
  'GET /api/me/notifications',
  'PUT /api/me/notifications',
  'GET /api/relations',
  'POST /api/relations',
  'DELETE /api/relations',
  'POST /api/reports',
  'POST /api/invites/preview',
  'GET /api/lobby',
  'POST /api/games/find',
  'POST /api/games/:id/accept',
  'POST /api/games/:id/cancel',
  'GET /api/me/settings',
  'PATCH /api/me/settings',
  'GET /api/me/record',
  'GET /api/blocks',
  'POST /api/blocks',
]);

export async function configurePlugin(env = process.env, { localDev = false, serverless = false, websiteKeys, websiteCurrentUser } = {}) {
  const publicOrigin = pluginOrigin(env.KINGDOWN_PLUGIN_ORIGIN || (localDev ? 'http://127.0.0.1:3100' : ''));
  const connectionString = env.KINGDOWN_PLUGIN_DATABASE_URL;
  if (!connectionString) throw new Error('KINGDOWN_PLUGIN_DATABASE_URL is required');
  let db;
  try { db = new URL(connectionString); } catch { throw new Error('Expected a PostgreSQL connection URL'); }
  if (!['postgres:', 'postgresql:'].includes(db.protocol)) throw new Error('Expected a PostgreSQL connection URL');
  const staging = stagingConfig(env, { publicOrigin, database: db, localDev });
  if (staging && localDev) throw new Error('Staging cannot enable local personas');
  if (websiteCurrentUser !== undefined && (websiteKeys === undefined || typeof websiteCurrentUser !== 'function')) throw new Error('Website current-user test hook requires website test keys');
  if (websiteKeys !== undefined) {
    if (localDev !== true || env.NODE_ENV !== 'test' || !isLoopback(new URL(publicOrigin).hostname) || !env.SUPABASE_URL || typeof websiteKeys !== 'function') throw new Error('Website test keys require local development, NODE_ENV=test, a loopback origin and SUPABASE_URL');
    testDatabase(connectionString);
  }
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
  const pool = new Pool({ ...pluginDatabaseConfig(db, { localDev, serverless }), max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  if (serverless) attachDatabasePool(pool);
  pool.on('error', error => { console.error('King Down database connection failed', diagnostic(error)); });
  try { await checkPluginDatabase(pool, config, auth?.resource); }
  catch (error) { await pool.end(); throw error; }
  const store = new PostgresMatchStore(pool), secret = env.KINGDOWN_INTERNAL_SECRET ?? '', games = new GameService(store, secret);
  const service = new PluginService(store, secret);
  const mcp = createPluginHandler({ consent, service, publicOrigin, resourceHtml, auth, localDev });
  const internal = createInternalHandler({ games, publicOrigin, secret: env.KINGDOWN_INTERNAL_SECRET });
  const api = createApiHandler({ games, accounts: new AccountService(store), safety: new SafetyService(store), players: service, publicOrigin,
    ...(import.meta.env?.KINGDOWN_ERROR_RECORDER !== false && { recordError: createErrorWriter(pool), build: typeof __KINGDOWN_BUILD__ === 'string' ? __KINGDOWN_BUILD__ : '' }),
    admit: createAdmission(),
    currentUser: websiteCurrentUser ?? (page ? createCurrentUserCheck({ supabaseUrl: page.supabaseUrl, publishableKey: page.publishableKey }) : undefined),
    webAccountAccess: createWebAccountAccess(pool),
    verify: env.SUPABASE_URL ? sessionVerifier(env.SUPABASE_URL, websiteKeys) : undefined, operations: localDev && websiteKeys === undefined ? WEB_OPERATIONS : ENABLED_WEB_OPERATIONS });
  const handler = async (req, res) => {
    const path = req.url?.startsWith('/') && URL.canParse(req.url, publicOrigin) ? new URL(req.url, publicOrigin).pathname : '';
    if (/^\/internal(\/|$)/.test(path)) return internal(req, res);
    if (path.startsWith('/plugin-art/')) return art(path.slice(12), res);
    if (/^\/api(?:\/|$)/.test(path)) return api(req, res);
    await mcp(req, res);
  };
  return { handler, pool, publicOrigin };
}
const ART = new URL('./plugin-art/', import.meta.url);
/** The standalone server's board art; on Vercel the static layer answers first (tools/plugin-server-build.mjs). */
async function art(name, res) {
  const type = artType(name), file = type ? await readFile(new URL(name, ART)).catch(() => undefined) : undefined;
  if (!file) { res.writeHead(404, { 'Cache-Control': 'no-store' }).end(); return; }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': file.length, ...ART_HEADERS }).end(file);
}
let configured;
/** The function adapter never enables local personas. */
export default async function handler(req, res) {
  try { configured ??= configurePlugin(process.env, { serverless: true }).catch(error => { configured = undefined; throw error; }); await (await configured).handler(req, res); }
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
