/** Opt-in end-to-end check of a built artifact against a disposable local PostgreSQL DB. */
import assert from 'node:assert/strict';
import { createHash, randomUUID, X509Certificate } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { checkRuntime, summarizeEngines } from './engines-check.mjs';
import { serveSite } from './web-online-check.mjs';
import { PARKED_PATHS } from './chatgpt-plugin.mjs';

/** A Vercel function's art lives in the enclosing output's static layer. */
async function staticLayer(directory) {
  if (!existsSync(join(directory, '.vc-config.json'))) return null;
  const root = resolve(directory, '../..');
  return { root, config: JSON.parse(await readFile(join(root, 'config.json'), 'utf8')) };
}

if (process.argv.length > 4) throw new Error('Usage: node tools/plugin-server-check.mjs [release function directory] [recovery function directory]');
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL to a disposable loopback PostgreSQL database');
const url = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('This check requires a disposable loopback database ending in _test');
const artifact = await mkdtemp(join(tmpdir(), 'kingdown-http-artifact-'));
let recoveryArtifact;
const pool = new pg.Pool({ connectionString });
const actors = [randomUUID(), randomUUID()], secret = randomUUID();
const server = createServer(); let app, site, savedAccountAccess, requestId = 0;
try {
  const source = resolve(process.argv[2] || 'plugin-server-dist');
  site = await staticLayer(source);
  await cp(source, artifact, { recursive: true });
  const ca = new X509Certificate(await readFile(resolve(artifact, 'supabase-ca.crt')));
  assert.equal(ca.fingerprint256.replaceAll(':', ''), '807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA');
  const { configurePlugin } = await import(pathToFileURL(resolve(artifact, 'server.mjs')).href);
  const identity = await pool.query('select current_database() as name,version() as version');
  assert(identity.rows[0].name.endsWith('_test')); assert(identity.rows[0].version.startsWith('PostgreSQL '));
  for (const actor of actors) await pool.query('insert into auth.users(id) values($1)', [actor]);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const webEnv = { NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, KINGDOWN_INTERNAL_SECRET: secret,
    SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: randomUUID() };
  const productionEnv = { KINGDOWN_PLUGIN_ORIGIN: 'https://kingdown.dev', KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require', SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co', KINGDOWN_PLUGIN_OAUTH_READY: '0' };
  const pair = await generateKeyPair('ES256'), websiteKeys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'website', alg: 'ES256' }] });
  const sign = (claims = {}) => new SignJWT({ iss: `${webEnv.SUPABASE_URL}/auth/v1`, aud: 'authenticated', sub: actors[0], role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 300, ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'website' }).sign(pair.privateKey);
  const token = await sign();
  let unsafeCases = 0, providerCalls = 0;
  const providerFetch = globalThis.fetch;
  globalThis.fetch = async () => { providerCalls++; throw new Error('Unexpected provider call'); };
  try {
    for (const [changes, localDev] of [
      // Pass the profile guard so this case reaches the website-key guard.
      [productionEnv, false], [{ NODE_ENV: 'production' }, true], [{ NODE_ENV: undefined }, true],
      [{ KINGDOWN_PLUGIN_ORIGIN: 'https://plugin.example' }, true],
      [{ KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://test@db.example/kingdown_test' }, true],
      [{ KINGDOWN_PLUGIN_DATABASE_URL: 'postgresql://test@127.0.0.1/kingdown' }, true],
      [{ KINGDOWN_PLUGIN_DATABASE_URL: `${connectionString}?application_name=test` }, true],
      [{ SUPABASE_URL: undefined }, true],
    ]) {
      await assert.rejects(configurePlugin({ ...webEnv, ...changes }, { localDev, websiteKeys }), /Website test keys require|disposable loopback database|no query or fragment/);
      unsafeCases++;
    }
  } finally { globalThis.fetch = providerFetch; }
  assert.equal(providerCalls, 0);
  app = await configurePlugin(webEnv, { localDev: true });
  server.on('request', (req, res) => {
    // Keep direct API closure checks; only deployed art is answered by the static layer.
    const result = site && new URL(req.url, origin).pathname.startsWith('/plugin-art/')
      ? serveSite({ ...site, handler: app.handler }, req, res) : app.handler(req, res);
    void result.catch(() => { res.statusCode = 500; res.end(); });
  });
  let queries = 0, connections = 0, closedCases = 0;
  const query = app.pool.query, connect = app.pool.connect;
  app.pool.query = function (...args) { queries++; return query.apply(this, args); };
  app.pool.connect = function (...args) { connections++; return connect.apply(this, args); };
  try {
    for (const [method, path] of [['GET', '/api/status'], ['POST', '/api/status'], ['GET', '/api'], ['GET', '/api/'], ['GET', '/api/me/games'], ['GET', `/api/games/${randomUUID()}?since=0`], ['GET', '/api/unknown'], ['POST', '/api/games'], ['POST', `/api/games/${randomUUID()}/commands`], ['OPTIONS', '/api/me/profile'], ['HEAD', '/api/me/games']]) {
      const response = await fetch(origin + path, { method, headers: { Authorization: `Bearer ${token}`, 'X-Kingdown-Dev-Actor': actors[0] }, ...(!['GET', 'HEAD'].includes(method) && { body: '{broken' }), redirect: 'manual' });
      assert.equal(response.status, 404, `${method} ${path}`); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.match(response.headers.get('content-type'), /^application\/json/); assert.equal(response.headers.get('location'), null);
      assert.deepEqual(method === 'HEAD' ? await response.text() : await response.json(), method === 'HEAD' ? '' : { code: 'NOT_FOUND', message: 'Not found' });
      closedCases++;
    }
    assert.equal(queries, 0); assert.equal(connections, 0);
  } finally { app.pool.query = query; app.pool.connect = connect; }
  if (!app.chatgpt) {
    // tools/chatgpt-plugin.mjs parks the ChatGPT plugin: the build has no widget, art or consent page, and each plugin
    // path answers 404. The website API keeps its sign-in, games and computer turns.
    for (const file of ['board.html', 'plugin-art', 'consent.html', 'consent.mjs']) assert(!existsSync(join(artifact, file)), `The parked build has no ${file}`);
    let parkedCases = 0;
    for (const path of [...PARKED_PATHS, '/plugin-art/scroll-0123abcd.webp', '/apix']) for (const method of ['GET', 'POST']) {
      const response = await fetch(origin + path, { method, headers: { 'X-Kingdown-Dev-Actor': actors[0], 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, ...(method === 'POST' && { body: '{}' }) });
      assert.equal(response.status, 404, `${method} ${path}`); assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { code: 'NOT_FOUND', message: 'Not found' }, `${method} ${path}`);
      parkedCases++;
    }
    await app.pool.end(); app = undefined;
    savedAccountAccess = (await pool.query('select enabled from public.web_account_access where singleton=true')).rows[0]?.enabled;
    assert.equal(typeof savedAccountAccess, 'boolean');
    await pool.query('update public.web_account_access set enabled=true where singleton=true');
    app = await configurePlugin(webEnv, { localDev: true, websiteKeys, websiteCurrentUser: async (bearer, user) => { assert.equal(bearer, token); assert.equal(user, actors[0]); } });
    const web = async (path, body, status = 200) => {
      const response = await fetch(origin + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) });
      const value = await response.json(); assert.equal(response.status, status, `${path}: ${JSON.stringify(value)}`); assert.equal(response.headers.get('cache-control'), 'no-store'); return value;
    };
    const lease = await web('/api/status');
    assert.equal(lease.account_access, 'open'); assert(Number.isInteger(lease.valid_for_ms) && lease.valid_for_ms > 0 && lease.valid_for_ms <= 5000);
    assert.equal((await web('/api/me/profile')).user_id, actors[0]);
    const options = { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false };
    const initial = (await web('/api/games', { kind: 'solo', options, colour: 'white', command_id: randomUUID() }, 201)).view;
    assert(initial.legal.length);
    const start = initial.revision;
    const moved = await web(`/api/games/${initial.game_id}/commands`, { command_id: 'http-first', expected_revision: start, action: { type: 'turn', actions: [initial.legal.find(lan => !lan.includes('!'))] } });
    assert.equal(moved.revision, start + 1);
    const ai = await web(`/api/games/${initial.game_id}/commands`, { command_id: 'http-ai', expected_revision: start + 1, action: { type: 'computer' } });
    assert.equal(ai.revision, start + 2);
    const since = await web(`/api/games/${initial.game_id}?since=${start}`);
    assert.equal(since.game_id, initial.game_id); assert.equal(since.rules, undefined); assert.equal(since.last_commands.length, 2);
    const persisted = await pool.query('select state as save,revision,(select count(*)::int from public.game_commands where game_id=$1) as commands from public.games where id=$1', [initial.game_id]);
    assert(persisted.rows[0].commands >= 2); assert.equal(persisted.rows[0].revision, start + 2); assert.match(JSON.parse(persisted.rows[0].save).engine, /^sha256:/);
    await assert.rejects(configurePlugin(productionEnv), /Enable Supabase OAuth/);
    console.log(`Compiled HTTP + real PostgreSQL (ChatGPT plugin parked): ${closedCases} default API closures with zero pool calls, ${unsafeCases} unsafe website-key refusals, ${parkedCases} parked plugin paths answer 404, website status, profile, solo game, move, computer turn and since read, and production auth gate passed`);
  } else {
  async function rpc(actor, method, params) {
    const response = await fetch(`${origin}/mcp`, { method: 'POST', headers: { 'X-Kingdown-Dev-Actor': actor, 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }) });
    assert.equal(response.status, 200); assert(!response.headers.has('mcp-session-id'));
    const text = await response.text(); return { result: JSON.parse(text).result, bytes: Buffer.byteLength(text) };
  }
  const tool = async (actor, name, args) => (await rpc(actor, 'tools/call', { name, arguments: args })).result;
  const open = await tool(actors[0], 'kingdown_open', {});
  assert(!open.isError); assert.equal(open.structuredContent.screen, 'home'); assert.equal(open._meta.view, undefined);
  const options = { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false };
  for (const [i, actor] of actors.entries()) assert(!(await tool(actor, 'kingdown_handle', {handle:`http${i}-${actor.slice(0,8)}`})).isError);
  const created = await tool(actors[0], 'kingdown_create', {kind:'solo',options,colour:'white',board_id:open._meta.board_id}); assert(!created.isError); const initial = created._meta.view;
  assert.equal(initial.revision, 0); assert(initial.legal.length); assert.equal(open.structuredContent.legal, undefined);
  const command = { game_id: initial.game_id, command_id: 'http-first', expected_revision: 0, lan: initial.legal.find(lan => !lan.includes('!')) };
  const moved = await tool(actors[0], 'kingdown_move', command); assert(!moved.isError); assert.equal(moved._meta.view.revision, 1);
  const computer = { game_id: initial.game_id, command_id: 'http-ai', expected_revision: 1 };
  const ai = await tool(actors[0], 'kingdown_computer', computer); assert(!ai.isError); assert.equal(ai._meta.view.revision, 2);
  assert.deepEqual((await tool(actors[0], 'kingdown_computer', computer)).structuredContent, ai.structuredContent);
  assert((await tool(actors[1], 'kingdown_get', { game_id: initial.game_id })).isError);
  const persisted = await pool.query('select state as save,revision,(select count(*)::int from public.game_commands where game_id=$1) as commands from public.games where id=$1', [initial.game_id]);
  assert.equal(persisted.rows[0].commands, 2); assert.equal(persisted.rows[0].revision, 2); assert.match(JSON.parse(persisted.rows[0].save).engine, /^sha256:/);
  // New pool/service/handler instances demonstrate reconnect without any in-memory authority.
  const restarted = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, KINGDOWN_INTERNAL_SECRET: secret }, { localDev: true });
  await app.pool.end(); app = restarted;
  assert.equal((await tool(actors[0], 'kingdown_resume', {board_id:open._meta.board_id}))._meta.view.fen, ai._meta.view.fen);
  const waiting = (await tool(actors[0], 'kingdown_create', { kind: 'friend', options, colour: 'white' })).structuredContent;
  const invite = (await tool(actors[0], 'kingdown_invite', { game_id: waiting.game_id })).structuredContent;
  assert.match(invite.code, /^[A-HJKMNP-Z2-9]{6}$/); assert.equal(invite.link,undefined);
  const joined = (await tool(actors[1], 'kingdown_join', { code: invite.code })).structuredContent;
  assert.equal(joined.colour, 'black'); assert.equal(joined.status, 'playing');
  const recoveryBoard = (await tool(actors[1], 'kingdown_open', {game_id:waiting.game_id}))._meta;
  await pool.query('delete from public.games where id=$1',[waiting.game_id]);
  assert.equal((await tool(actors[1], 'kingdown_get', {game_id:waiting.game_id,board_id:recoveryBoard.board_id}))._meta.code, 'MATCH_REMOVED');
  const recovered = await tool(actors[1], 'kingdown_create', {kind:'solo',options,board_id:recoveryBoard.board_id});
  assert(!recovered.isError); assert.equal(recovered._meta.board_id,recoveryBoard.board_id);
  assert.equal((await tool(actors[1], 'kingdown_get', {game_id:waiting.game_id,board_id:recoveryBoard.board_id})).structuredContent.game_id,recovered.structuredContent.game_id);
  assert.equal((await tool(actors[0], 'kingdown_create', {kind:'solo',options,board_id:recoveryBoard.board_id}))._meta.code,'FORBIDDEN');
  await app.pool.end(); app = undefined;
  savedAccountAccess = (await pool.query('select enabled from public.web_account_access where singleton=true')).rows[0]?.enabled;
  assert.equal(typeof savedAccountAccess, 'boolean');
  await pool.query('update public.web_account_access set enabled=false where singleton=true');
  app = await configurePlugin(webEnv, { localDev: true, websiteKeys });
  const off = await fetch(`${origin}/api/me/profile`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(off.status, 503); assert.match(off.headers.get('content-type'), /^application\/json/);
  assert.equal(off.headers.get('cache-control'), 'no-store'); assert.equal(off.headers.get('retry-after'), '5');
  assert.deepEqual(await off.json(), { code: 'UNAVAILABLE', message: 'Account play is temporarily unavailable. Try again or play on this device.' });
  const offStatus = await fetch(`${origin}/api/status`);
  assert.equal(offStatus.status, 200); assert.equal(offStatus.headers.get('cache-control'), 'no-store'); assert.equal(offStatus.headers.get('referrer-policy'), 'no-referrer');
  assert.deepEqual(await offStatus.json(), { account_access: 'closed', valid_for_ms: 0 });
  await app.pool.end(); app = undefined;
  await pool.query('update public.web_account_access set enabled=true where singleton=true');
  app = await configurePlugin(webEnv, { localDev: true, websiteKeys });
  for (const [headers, status] of [[{}, 401], [{ 'X-Kingdown-Dev-Actor': actors[0] }, 401], [{ Authorization: `Bearer ${await sign({ exp: Math.floor(Date.now() / 1000) - 60 })}` }, 401], [{ Authorization: `Bearer ${await sign({ aud: `${origin}/mcp`, client_id: randomUUID() })}` }, 401], [{ Authorization: `Bearer ${token}` }, 200]]) {
    const response = await fetch(`${origin}/api/me/profile`, { headers });
    assert.equal(response.status, status); assert.equal(response.headers.get('cache-control'), 'no-store');
    if (status === 401) { assert.equal(response.headers.get('www-authenticate'), 'Bearer'); assert.equal((await response.json()).code, 'UNAUTHENTICATED'); }
    else assert.equal((await response.json()).user_id, actors[0]);
  }
  const openStatus = await fetch(`${origin}/api/status`);
  assert.equal(openStatus.status, 200); const lease = await openStatus.json();
  assert.equal(lease.account_access, 'open'); assert(Number.isInteger(lease.valid_for_ms) && lease.valid_for_ms > 0 && lease.valid_for_ms <= 5000);
  const full = await (await fetch(`${origin}/api/games/${initial.game_id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const sinceResponse = await fetch(`${origin}/api/games/${initial.game_id}?since=0`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(sinceResponse.status, 200); const since = await sinceResponse.json();
  assert.equal(full.game_id, initial.game_id); assert(full.rules); assert.equal(since.game_id, full.game_id); assert.equal(since.rules, undefined); assert.equal(since.last_commands.length, 2);
  const invalidSince = await fetch(`${origin}/api/games/${initial.game_id}?since=-1`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(invalidSince.status, 400); assert.equal((await invalidSince.json()).code, 'INVALID_INPUT');
  for (const path of ['/apix', '/apiary']) {
    const response = await fetch(origin + path); assert.equal(response.status, 404); assert.deepEqual(await response.json(), { error: 'Not found' });
  }
  const tools = (await rpc(actors[0], 'tools/list', {})).result.tools;
  const uri = tools.find(tool => tool.name === 'kingdown_open')._meta.ui.resourceUri;
  assert.match(uri, /^ui:\/\/kingdown\/board-[a-f0-9]{64}\.html$/);
  const resource = await rpc(actors[0], 'resources/read', { uri });
  assert(resource.result.contents[0].text.includes('<html')); assert(resource.bytes < 1_000_000);
  // The page names each art file on this origin; a cross-origin page may read it into a canvas, and a new build gets new names.
  const art = [...new Set(resource.result.contents[0].text.match(new RegExp(`${origin}/plugin-art/[\\w-]+\\.(?:webp|png|svg|woff2)`, 'g')))];
  const counts = Object.fromEntries(['webp', 'png', 'svg', 'woff2'].map(type => [type, art.filter(file => file.endsWith(`.${type}`)).length]));
  for (const name of ['badge-architect.webp', 'badge-card-sharp.webp', 'badge-crowned.webp', 'badge-fairy-tale.webp', 'badge-first-win.webp', 'badge-friend-match.webp', 'badge-giant-slayer.webp', 'badge-purist.webp', 'badge-royal-collection.webp', 'badge-stranger-match.webp', 'scroll.webp']) assert(art.some(file => file.includes(`/${name.slice(0,-5)}-`)), `The page names ${name}`);
  // Two PNGs: the app icon and the Stratus cloud bank (PR #92's king floor).
  assert(counts.webp >= 20); assert.equal(counts.png, 2); assert(art.some(file => file.includes('/cloud-bank-')), 'The page names cloud-bank.png'); assert.equal(counts.svg, 24); assert.equal(counts.woff2, 4);
  // Ticket 12: each setup art file stays on the plugin origin.
  for (const name of ['archer-w','paladin-w','guard-w','maester-w','beast-w','ogre-w','rook-w','bishop-w','knight-w','queen-w','frost','flame','stratus','mud','spirit','shadow','shadow-b','freeze','icewall','sacrifice','march','leap','salvation','mimic','vault','skylift','back']) assert(art.some(file => file.includes(`/${name}-`)), `Setup names ${name}.webp`);
  // Ticket 14: the plain opponent portrait and the remembered king stay on the plugin origin.
  for (const name of ['spirit','shadow-b','mud']) assert(art.some(file => file.includes(`/${name}-`)), `Seat names ${name}.webp`);
  for (const file of art) {
    const response = await fetch(file, { headers: { Origin: 'null' } });
    assert.equal(response.status, 200, file); assert.equal(response.headers.get('content-type'), { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2' }[file.split('.').at(-1)]); assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(response.headers.get('cache-control'), /max-age=31536000.*immutable/); assert((await response.arrayBuffer()).byteLength > 0);
  }
  assert.equal((await fetch(`${origin}/plugin-art/missing.webp`)).status, 404); assert.equal((await fetch(`${origin}/plugin-art/..%2fserver.mjs`)).status, 404);
  await assert.rejects(configurePlugin(productionEnv), /Enable Supabase OAuth/);
  await assert.rejects(configurePlugin({ NODE_ENV: 'production', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, KINGDOWN_INTERNAL_SECRET: secret }, { localDev: true }), /Local personas/);
  if (process.argv[3]) {
    recoveryArtifact = await mkdtemp(join(tmpdir(), 'kingdown-recovery-artifact-'));
    await cp(resolve(process.argv[3]), recoveryArtifact, { recursive: true });
    const identity = async directory => Object.fromEntries(await Promise.all(['server.mjs', 'runtime/index.mjs', 'runtime/worker.mjs'].map(async file => [file, createHash('sha256').update(await readFile(join(directory, file))).digest('hex')])));
    const releaseIdentity = await identity(artifact), recoveryIdentity = await identity(recoveryArtifact);
    assert.notEqual(releaseIdentity['server.mjs'], recoveryIdentity['server.mjs'], 'Recovery needs distinct server bytes; source provenance requires separate build receipts');
    assert(tools.some(tool => tool.name === 'kingdown_preview'), 'The nominated release includes the stored-engine preview adapter');
    const { configurePlugin: configureRecovery } = await import(pathToFileURL(join(recoveryArtifact, 'server.mjs')).href);
    const recoverySite = await staticLayer(resolve(process.argv[3]));
    const restartRecovery = async () => {
      await app.pool.end(); app = undefined;
      app = await configureRecovery(webEnv, { localDev: true, websiteKeys });
      site = recoverySite;
    };
    const ok = async (actor, name, args) => {
      const result = await tool(actor, name, args);
      assert(!result.isError, `${name}: ${result._meta?.code ?? 'unknown error'}`);
      return result;
    };
    const get = async game_id => (await ok(actors[0], 'kingdown_get', { game_id }))._meta.view;
    const position = ({ game_id, revision, engine_fingerprint, status, turn, action, fen, in_check, legal, rules, history, last_commands, ready, choices, setup_admission }) =>
      ({ game_id, revision, engine_fingerprint, status, turn, action, fen, in_check, legal, rules, history, last_commands, ready, choices, setup_admission });
    const durable = async game_id => (await pool.query(`select g.*,
      (select count(*)::int from public.game_commands where game_id=g.id) as commands,
      (select jsonb_agg(to_jsonb(c) order by seq) from public.game_commands c where game_id=g.id) as command_rows,
      (select jsonb_agg(to_jsonb(p) order by seat) from public.game_players p where game_id=g.id) as players,
      (select jsonb_agg(to_jsonb(n) order by id) from public.notifications n where payload->>'game_id'=g.id::text) as notifications,
      (select jsonb_agg(to_jsonb(r) order by user_id) from public.player_ratings r where user_id in (select user_id from public.game_players where game_id=g.id)) as player_ratings,
      (select count(*)::int from public.rating_history where game_id=g.id) as ratings,
      (select count(*)::int from public.outbox where payload->>'game_id'=g.id::text) as events
      from public.games g where id=$1`, [game_id])).rows[0];
    const setup = (await ok(actors[0], 'kingdown_create', { kind: 'friend', options: { ...options, arrangement: true }, colour: 'white' }))._meta.view;
    const code = (await ok(actors[0], 'kingdown_invite', { game_id: setup.game_id })).structuredContent.code;
    const joined = (await ok(actors[1], 'kingdown_join', { code }))._meta.view;
    const ready = { game_id: setup.game_id, command_id: 'recovery-ready-white', expected_revision: joined.revision, king: null, order: setup.draw, ready: true };
    await ok(actors[0], 'kingdown_choose', ready);
    const pending = await durable(setup.game_id), pendingView = await get(setup.game_id);
    assert.equal(pending.status, 'setup'); assert.equal(pending.state, null); assert(pending.setup_admission);
    assert.deepEqual(pendingView.ready, [true, false]);
    const before = await durable(initial.game_id), beforeView = await get(initial.game_id);
    assert(beforeView.rules); assert(beforeView.history);
    const inventory = summarizeEngines('games', [before, pending].map(row => ({ engine: row.engine_fingerprint, state: row.state, status: row.status, admission: row.setup_admission })));
    const archives = [artifact, recoveryArtifact].map(directory => checkRuntime({ tables: [inventory], engines: inventory.engines }, join(directory, 'runtime/engines')));
    for (const report of archives) assert(report.ok, 'Both artifacts must retain every initialized and pending engine');
    assert.deepEqual(archives[0].bundles.map(({ engine, sha256 }) => ({ engine, sha256 })), archives[1].bundles.map(({ engine, sha256 }) => ({ engine, sha256 })), 'Referenced archive bytes must agree across artifacts');

    await restartRecovery();
    const recoveryTools = (await rpc(actors[0], 'tools/list', {})).result.tools;
    assert(recoveryTools.some(tool => tool.name === 'kingdown_preview'), 'Recovery retains the released stored-engine preview contract');
    assert.deepEqual(position(await get(initial.game_id)), position(beforeView));
    assert.deepEqual(position(await get(setup.game_id)), position(pendingView));
    const retry = await ok(actors[0], 'kingdown_computer', computer);
    assert.deepEqual(retry.structuredContent, ai.structuredContent);
    const conflict = await tool(actors[0], 'kingdown_computer', { ...computer, expected_revision: computer.expected_revision + 1 });
    assert(conflict.isError); assert.equal(conflict._meta.code, 'COMMAND_CONFLICT');
    assert.deepEqual(await durable(initial.game_id), before, 'Retry and conflict must preserve game, command, player, notification, rating and outbox records');
    await ok(actors[0], 'kingdown_choose', ready);
    assert.deepEqual(await durable(setup.game_id), pending, 'Accepted Ready receipt remains valid after recovery');
    const next = await ok(actors[0], 'kingdown_move', { game_id: initial.game_id, command_id: 'recovery-next', expected_revision: before.revision, actions: [beforeView.legal.find(lan => !lan.includes('!'))] });
    assert.equal(next._meta.view.revision, before.revision + 1);
    const afterHuman = await durable(initial.game_id), afterHumanView = await get(initial.game_id);
    assert.equal(afterHuman.commands, before.commands + 1); assert.equal(afterHuman.engine_fingerprint, before.engine_fingerprint);
    assert.equal(JSON.parse(afterHuman.state).engine, before.engine_fingerprint);
    assert.equal(afterHuman.ratings, before.ratings); assert.equal(afterHuman.events, before.events);
    const recoveryComputer = { game_id: initial.game_id, command_id: 'recovery-computer', expected_revision: afterHuman.revision };
    const computerTurn = await ok(actors[0], 'kingdown_computer', recoveryComputer);
    assert.equal(computerTurn._meta.view.revision, afterHuman.revision + 1);
    const continued = await durable(initial.game_id), computerView = await get(initial.game_id), receipt = continued.command_rows.at(-1);
    assert.equal(continued.commands, afterHuman.commands + 1); assert.equal(continued.engine_fingerprint, before.engine_fingerprint);
    assert.equal(JSON.parse(continued.state).engine, before.engine_fingerprint);
    assert.equal(receipt.command_id, recoveryComputer.command_id); assert.equal(receipt.kind, 'computer');
    assert.deepEqual(receipt.payload, { expected_revision: afterHuman.revision, action: { type: 'computer' } });
    assert(receipt.actions.length > 0); assert(afterHumanView.legal.length === 0);
    assert.deepEqual(computerView.history.actions, [...afterHumanView.history.actions, ...receipt.actions]);
    assert.deepEqual((await ok(actors[0], 'kingdown_computer', recoveryComputer)).structuredContent, computerTurn.structuredContent);
    const computerConflict = await tool(actors[0], 'kingdown_computer', { ...recoveryComputer, expected_revision: recoveryComputer.expected_revision + 1 });
    assert(computerConflict.isError); assert.equal(computerConflict._meta.code, 'COMMAND_CONFLICT');
    assert.deepEqual(await durable(initial.game_id), continued, 'Fresh computer receipt retry and conflict must preserve all scoped durable effects');
    const finishedSetup = await ok(actors[1], 'kingdown_choose', { game_id: setup.game_id, command_id: 'recovery-ready-black', expected_revision: pending.revision, king: null, order: setup.draw, ready: true });
    assert.equal(finishedSetup._meta.view.status, 'playing');
    const setupView = await get(setup.game_id);
    assert.equal(setupView.engine_fingerprint, pending.engine_fingerprint);
    await ok(actors[0], 'kingdown_move', { game_id: setup.game_id, command_id: 'recovery-setup-turn', expected_revision: setupView.revision, actions: [setupView.legal.find(lan => !lan.includes('!'))] });
    const completed = await durable(setup.game_id);
    assert.equal(completed.commands, pending.commands + 2); assert.equal(completed.revision, pending.revision + 2);
    assert.equal(completed.engine_fingerprint, pending.engine_fingerprint); assert.deepEqual(completed.setup_admission, pending.setup_admission);
    assert.equal(JSON.parse(completed.state).engine, pending.engine_fingerprint);
    const views = await Promise.all([initial.game_id, setup.game_id].map(get));
    await restartRecovery();
    for (const [i, row] of [continued, completed].entries()) {
      assert.deepEqual(position(await get(row.id)), position(views[i]), 'Fresh recovery service must reload the same full position');
      assert.deepEqual(await durable(row.id), row);
    }
    const { loadMatch } = await import(pathToFileURL(join(recoveryArtifact, 'runtime/index.mjs')).href);
    const sourceArchives = new URL('../engines/', import.meta.url), archiveComputerChecks = [];
    const fixtures = (await readdir(sourceArchives)).filter(file => /^[a-f0-9]{64}\.save\.json$/.test(file)).sort();
    assert(fixtures.length > 0);
    for (const file of fixtures) {
      const hex = file.slice(0, -'.save.json'.length), engine = `sha256:${hex}`;
      const fixture = await readFile(new URL(file, sourceArchives), 'utf8'), published = await readFile(new URL(`${hex}.mjs`, sourceArchives));
      assert.equal(JSON.parse(fixture).engine, engine);
      for (const directory of [artifact, recoveryArtifact]) assert.deepEqual(await readFile(join(directory, 'runtime/engines', `${hex}.mjs`)), published, 'Both artifacts must retain exact bytes for every supported fixture');
      const match = await loadMatch(fixture); let restored;
      try {
        const before = await match.snapshot(), saved = await match.exportSave();
        const lan = await match.chooseMove({ maxTimeMs: 50, maxDepth: 1 });
        assert.equal(typeof lan, 'string'); assert(before.legal.includes(lan), 'Archived computer choice must be a legal LAN');
        assert.equal(await match.exportSave(), saved, 'Choosing a move must not change an archived save');
        const played = await match.apply({ id: randomUUID(), expectedRevision: before.revision, lan });
        assert.equal(played.revision, before.revision + 1);
        const after = await match.exportSave(); assert.equal(JSON.parse(after).engine, engine); assert.equal(JSON.parse(after).commands.at(-1).lan, lan);
        restored = await loadMatch(after);
        assert.deepEqual(await restored.snapshot(), played, 'Copied recovery runtime must reload the archived computer turn');
        archiveComputerChecks.push({ engine, revision: played.revision });
      } finally { await match.close(); await restored?.close(); }
    }
    console.log('Recovery artifact continuation passed', JSON.stringify({ release: { directory: resolve(process.argv[2] || 'plugin-server-dist'), ...releaseIdentity }, recovery: { directory: resolve(process.argv[3]), ...recoveryIdentity }, engines: archives[0].bundles.map(({ engine, sha256 }) => ({ engine, sha256 })), acceptedRetry: true, changedPayloadConflict: true, recoveryComputerRevision: continued.revision, archiveComputerChecks, continuedRevision: continued.revision, completedSetupRevision: completed.revision }));
  }
  console.log(`Compiled HTTP + real PostgreSQL: ${closedCases} default API closures with zero pool calls, ${unsafeCases} unsafe website-key refusals, off-switch closure, isolated website identity and full/since reads, open, move, AI, retry, foreign seat rejection, service restart/resume, friend code/join, board recovery, resource (${resource.bytes} JSON bytes), ${art.length} art files (${JSON.stringify(counts)}), and production auth gate passed`);
  }
} finally {
  try {
    if (savedAccountAccess !== undefined) {
      await pool.query('update public.web_account_access set enabled=$1 where singleton=true', [savedAccountAccess]);
      assert.equal((await pool.query('select enabled from public.web_account_access where singleton=true')).rows[0]?.enabled, savedAccountAccess, 'Restore account switch');
    }
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await app?.pool.end();
    await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [actors]);
    for (const actor of actors) await pool.query('delete from auth.users where id=$1', [actor]);
    await pool.end();
    await rm(artifact, { recursive: true, force: true });
    if (recoveryArtifact) await rm(recoveryArtifact, { recursive: true, force: true });
  }
}
