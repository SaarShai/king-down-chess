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
import { consentConfig, renderConsent, websiteConfig } from '../src/plugin/consent-config.ts';
import { GameService } from '../src/match/service.ts';
import { PluginService } from '../src/plugin/service.ts';
import { PostgresMatchStore } from '../src/match/store.ts';
import { createApiHandler, createInternalHandler, sessionVerifier } from '../src/api/http.ts';
import { resendSender } from '../src/online/mail.ts';
import { createWebAccountAccess } from '../src/api/account-access.ts';
import { AccountService } from '../src/online/accounts.ts';
import { SafetyService } from '../src/online/safety.ts';
import { ART_HEADERS, artType } from './plugin-art-headers.mjs';
import { stagingConfig } from './staging-config.mjs';
import { createAdmission } from '../src/api/admission.ts';
import { createErrorWriter } from '../src/diagnostics/server.ts';
import { createCurrentUserCheck } from '../src/api/current-user.ts';
import { CHATGPT_PLUGIN } from './chatgpt-plugin.mjs';
import { soloLaunch } from './solo-launch.mjs';
import { MUSE_CONNECTOR, MUSE_PATHS } from './muse-connector.mjs';

// A build sets KINGDOWN_CHATGPT (tools/plugin-server-build.mjs); the source follows the switch in tools/chatgpt-plugin.mjs.
const BUILT_CHATGPT = import.meta.env?.KINGDOWN_CHATGPT;
const CHATGPT_DEFAULT = typeof BUILT_CHATGPT === 'boolean' ? BUILT_CHATGPT : CHATGPT_PLUGIN;
// KINGDOWN_MUSE works the same way for the Muse connector (tools/muse-connector.mjs).
const BUILT_MUSE = import.meta.env?.KINGDOWN_MUSE;
const MUSE_DEFAULT = typeof BUILT_MUSE === 'boolean' ? BUILT_MUSE : MUSE_CONNECTOR;

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
  'GET /api/friends',
  'POST /api/invites/:id/decline',
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

/** `chatgpt: false` (the parked default) serves no MCP, OAuth metadata, consent page or board art: each answers 404.
 *  It also needs no Supabase OAuth server, OAuth client or KINGDOWN_PLUGIN_OAUTH_READY: the website API needs only
 *  SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. `muse` (default: tools/muse-connector.mjs) serves the Muse connector
 *  with the same OAuth setup and its own resource, /muse/mcp. Both can be on: each listed OAuth client maps to the
 *  resource of one connector (kingdown_oauth.client_resources). */
export async function configurePlugin(env = process.env, { localDev = false, serverless = false, websiteKeys, websiteCurrentUser, chatgpt = CHATGPT_DEFAULT, muse = MUSE_DEFAULT } = {}) {
  // A parked build has no MCP handler code (see the import below), so it cannot serve the plugin.
  if (chatgpt && import.meta.env?.KINGDOWN_CHATGPT === false) throw new Error('This build parks the ChatGPT plugin; build it with chatgpt: true to serve the plugin');
  if (muse && import.meta.env?.KINGDOWN_MUSE === false) throw new Error('This build parks the Muse connector; build it with muse: true to serve it');
  // A constant false in a parked build, so that the build drops each Muse branch.
  let serveMuse = import.meta.env?.KINGDOWN_MUSE !== false && muse;
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
  let auth, museAuth, config, consent, page;
  const build = typeof __KINGDOWN_BUILD__ === 'string' ? __KINGDOWN_BUILD__ : 'dev';
  const connectorFault = error => { console.error('King Down connector startup failed', { build, ...diagnostic(error) }); chatgpt = false; serveMuse = false; config = undefined; };
  let connectorFailed = false;

  const localOnline = localDev && env.KINGDOWN_LOCAL_ONLINE === '1';
  if (localDev) {
    if (env.NODE_ENV === 'production' || !isLoopback(new URL(publicOrigin).hostname) || !isLoopback(db.hostname)) throw new Error('Local personas require loopback HTTP and a disposable loopback database');
    if (localOnline) {
      if (!env.SUPABASE_URL || !isLoopback(new URL(env.SUPABASE_URL).hostname)) throw new Error('Local online mode requires a loopback SUPABASE_URL');
      testDatabase(connectionString);
      chatgpt = false; serveMuse = false;
    }
  } else {
    if (new URL(publicOrigin).protocol !== 'https:') throw new Error('Production OAuth requires an HTTPS origin');
    // Website settings are independent of OAuth readiness and discovery.
    page = websiteConfig(env);
    if (chatgpt || serveMuse) try {
      if (env.KINGDOWN_PLUGIN_OAUTH_READY !== '1') throw new Error('Enable Supabase OAuth before serving a connector');
      config = consentConfig(env);
      const issuer = `${config.supabaseUrl}/auth/v1`;
      const discovery = new URL('/.well-known/oauth-authorization-server/auth/v1', issuer);
      const response = await fetch(discovery, { signal: AbortSignal.timeout(5000), redirect: 'error' });
      if (!response.ok) throw new Error('Supabase OAuth discovery is unavailable');
      const metadata = await response.json();
      if (metadata.issuer !== issuer || !Array.isArray(metadata.scopes_supported) || !metadata.scopes_supported.includes('openid')) throw new Error('Supabase OAuth discovery has an incompatible issuer or scopes');
    } catch (error) { connectorFault(error); connectorFailed = env.KINGDOWN_PLUGIN_OAUTH_READY === '1'; }
  }
  // Local personas need no OAuth: `config` stays unset, so no client check or token verifier runs. A local run serves
  // the consent page too when it has the public Supabase settings.
  if (localDev && env.SUPABASE_URL) {
    page = websiteConfig(env, { localLoopback: localOnline });
    if (chatgpt || serveMuse) try { page = consentConfig(env); } catch (error) { connectorFault(error); }
  }
  let resourceHtml;

  const pool = new Pool({ ...pluginDatabaseConfig(db, { localDev, serverless }), max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  if (serverless) attachDatabasePool(pool);
  pool.on('error', error => { console.error('King Down database connection failed', diagnostic(error)); });
  // Each served connector has its own resource. Each listed client must map to one of them, and each connector then
  // accepts a token only when its aud is that resource and its client maps to it.
  const resources = [...chatgpt ? [`${publicOrigin}/mcp`] : [], ...serveMuse ? [`${publicOrigin}/muse/mcp`] : []];
  let clients;
  try { clients = await checkPluginDatabase(pool, config, resources) ?? []; }
  catch (error) {
    if (!config) { await pool.end(); throw error; }
    // A schema or database fault still stops the API. Only the OAuth check can degrade.
    try { await checkPluginDatabase(pool); } catch (databaseError) { await pool.end(); throw databaseError; }
    connectorFault(error); clients = [];
  }
  if (config) try {
    const verifier = resourcePath => {
      const clientIds = clients.filter(row => row.resource === `${publicOrigin}${resourcePath}`).map(row => row.client_id);
      // Not a start fault: the other connector and the website still serve. The consent page refuses the request.
      if (!clientIds.length) console.warn(`King Down serves ${resourcePath} without an OAuth client; list its client in KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`);
      return createTokenVerifier({ supabaseUrl: env.SUPABASE_URL, publicOrigin, clientIds, publishableKey: config.publishableKey, resourcePath });
    };
    if (chatgpt) auth = verifier('/mcp');
    if (serveMuse) museAuth = verifier('/muse/mcp');
  } catch (error) { connectorFault(error); }
  const store = new PostgresMatchStore(pool), secret = env.KINGDOWN_INTERNAL_SECRET ?? '', games = new GameService(store, secret);
  const service = new PluginService(store, secret);
  try {
    if (page && (chatgpt || serveMuse)) consent = { html: renderConsent(await readFile(new URL('./consent.html', import.meta.url), 'utf8'), { ...config, ...page, museClientIds: museAuth ? clients.filter(row => row.resource === museAuth.resource).map(row => row.client_id) : [] }), script: await readFile(new URL('./consent.mjs', import.meta.url), 'utf8'), supabaseOrigin: page.supabaseUrl };
  } catch (error) { connectorFault(error); }
  let mcp, museHandler;
  if (import.meta.env?.KINGDOWN_CHATGPT !== false && chatgpt) try {
    resourceHtml = await readFile(new URL('./board.html', import.meta.url), 'utf8');
    mcp = (await import('../src/plugin/http.ts')).createPluginHandler({ consent, service, publicOrigin, resourceHtml, auth, localDev });
  } catch (error) { chatgpt = false; console.error('King Down ChatGPT startup failed', { build, ...diagnostic(error) }); }
  if (import.meta.env?.KINGDOWN_MUSE !== false && serveMuse) try {
    museHandler = (await import('../src/muse/http.ts')).createMuseHandler({ publicOrigin, auth: museAuth, localDev, consent, games: {
      create: (actor, input, commandId) => games.create(actor, input, commandId, 'muse'),
      command: (actor, gameId, input) => games.command(actor, gameId, input, 'muse'),
      view: (actor, gameId, since) => games.view(actor, gameId, since),
      inbox: actor => games.inbox(actor),
      previewDraft: (actor, gameId, input) => games.previewDraft(actor, gameId, input),
      toolTry: (actor, tool) => service.toolTry(actor, tool),
    } });
  } catch (error) { serveMuse = false; console.error('King Down Muse startup failed', { build, ...diagnostic(error) }); }
  // The deletion notice needs both mail settings (tools/deploy-plugin-env.mjs sets both or neither).
  const internal = createInternalHandler({ games, publicOrigin, secret: env.KINGDOWN_INTERNAL_SECRET, send: env.RESEND_API_KEY && env.KINGDOWN_MAIL_FROM ? resendSender(env) : undefined });
  const localSolo = typeof __KINGDOWN_SOLO_LAUNCH__ === 'boolean' ? __KINGDOWN_SOLO_LAUNCH__ : soloLaunch(env.KINGDOWN_SOLO_LAUNCH);
  const api = createApiHandler({ games, accounts: new AccountService(store), safety: new SafetyService(store), players: service, publicOrigin,
    ...(import.meta.env?.KINGDOWN_ERROR_RECORDER !== false && { recordError: createErrorWriter(pool, typeof __KINGDOWN_BUILD__ === 'string' ? __KINGDOWN_BUILD__ : ''), build: typeof __KINGDOWN_BUILD__ === 'string' ? __KINGDOWN_BUILD__ : '' }),
    localSolo, admit: createAdmission(),
    currentUser: websiteCurrentUser ?? (page ? createCurrentUserCheck({ supabaseUrl: page.supabaseUrl, publishableKey: page.publishableKey }, fetch, { localLoopback: localOnline }) : undefined),
    webAccountAccess: createWebAccountAccess(pool),
    verify: env.SUPABASE_URL ? sessionVerifier(env.SUPABASE_URL, websiteKeys, { localLoopback: localOnline }) : undefined, operations: localDev && websiteKeys === undefined && !localOnline ? WEB_OPERATIONS : ENABLED_WEB_OPERATIONS });
  const handler = async (req, res) => {
    const path = req.url?.startsWith('/') && URL.canParse(req.url, publicOrigin) ? new URL(req.url, publicOrigin).pathname : '';
    if (/^\/internal(\/|$)/.test(path)) return internal(req, res);
    if (/^\/api(?:\/|$)/.test(path)) return api(req, res);
    if (museHandler && (MUSE_PATHS.includes(path) || path === '/authorize' || path === '/consent.mjs')) return museHandler(req, res);
    // A connector that failed at startup is unavailable, not absent: the function adapter retries its setup.
    if (!mcp) return connectorFailed ? res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': '30' }).end(JSON.stringify({ code: 'UNAVAILABLE', message: 'Try again soon' })) : parked(res);
    if (path.startsWith('/plugin-art/')) return art(path.slice(12), res);
    await mcp(req, res);
  };
  console.info('King Down release', { build, chatgpt, muse: serveMuse });
  return { handler, pool, publicOrigin, chatgpt, muse: serveMuse, localSolo, localOnline, connectorFailed };
}
/** The parked ChatGPT surface (tools/chatgpt-plugin.mjs): every path outside /api and /internal. */
function parked(res) {
  res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(JSON.stringify({ code: 'NOT_FOUND', message: 'Not found' }));
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
  try { configured ??= configurePlugin(process.env, { serverless: true }).then(app => {
      // A provider fault at startup must not park the connector for the life of the process: set up again after 30 s.
      // shortcut: the earlier pool stays open for its requests in flight; close it if provider faults become frequent.
      if (app.connectorFailed) setTimeout(() => { configured = undefined; }, 30000).unref();
      return app;
    }).catch(error => { configured = undefined; throw error; }); await (await configured).handler(req, res); }
  catch (error) { console.error('King Down startup failed', { build: typeof __KINGDOWN_BUILD__ === 'string' ? __KINGDOWN_BUILD__ : 'dev', requestId: randomUUID(), ...diagnostic(error) }); if (!res.headersSent) { res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: 'King Down server is not configured' })); } else res.destroy(); }
}
export async function startPluginServer({ localDev = false } = {}) {
  const app = await configurePlugin(process.env, { localDev });
  const url = new URL(app.publicOrigin), port = Number(process.env.PORT || url.port || (localDev ? 3100 : 3000));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port');
  if (localDev && !app.localOnline && port !== Number(url.port || (url.protocol === 'https:' ? 443 : 80))) throw new Error('Local port must match KINGDOWN_PLUGIN_ORIGIN');
  const server = createServer({ requestTimeout: 20000, headersTimeout: 10000 }, (req, res) => { void app.handler(req, res).catch(() => { if (!res.headersSent) { res.statusCode = 500; res.end('Request failed'); } else res.destroy(); }); });
  server.listen(port, localDev ? '127.0.0.1' : '0.0.0.0', () => console.log(`King Down server listening at ${app.publicOrigin}${app.chatgpt ? '/mcp' : ' (ChatGPT plugin parked)'}${app.muse ? ' and /muse/mcp' : ''}${localDev ? ' (loopback personas only)' : ''}`));
  const stop = () => { server.close(() => { void app.pool.end(); }); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  return server;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--local-dev')) throw new Error('Only --local-dev is supported');
  await startPluginServer({ localDev: args.includes('--local-dev') });
}
