/** Opt-in end-to-end check of a built artifact against a disposable local PostgreSQL DB. */
import assert from 'node:assert/strict';
import { randomUUID, X509Certificate } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';

const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL to a disposable loopback PostgreSQL database');
const url = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('This check requires a disposable loopback database ending in _test');
const artifact = await mkdtemp(join(tmpdir(), 'kingdown-http-artifact-'));
const pool = new pg.Pool({ connectionString });
const actors = [randomUUID(), randomUUID()], secret = randomUUID();
const server = createServer(); let app, savedAccountAccess, requestId = 0;
try {
  await cp(resolve(process.argv[2] || 'plugin-server-dist'), artifact, { recursive: true });
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
  const pair = await generateKeyPair('ES256'), websiteKeys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'website', alg: 'ES256' }] });
  const sign = (claims = {}) => new SignJWT({ iss: `${webEnv.SUPABASE_URL}/auth/v1`, aud: 'authenticated', sub: actors[0], role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 300, ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'website' }).sign(pair.privateKey);
  const token = await sign();
  let unsafeCases = 0, providerCalls = 0;
  const providerFetch = globalThis.fetch;
  globalThis.fetch = async () => { providerCalls++; throw new Error('Unexpected provider call'); };
  try {
    for (const [changes, localDev] of [
      [{}, false], [{ NODE_ENV: 'production' }, true], [{ NODE_ENV: undefined }, true],
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
  server.on('request', (req, res) => { void app.handler(req, res).catch(() => { res.statusCode = 500; res.end(); }); });
  let queries = 0, connections = 0, closedCases = 0;
  const query = app.pool.query, connect = app.pool.connect;
  app.pool.query = function (...args) { queries++; return query.apply(this, args); };
  app.pool.connect = function (...args) { connections++; return connect.apply(this, args); };
  try {
    for (const [method, path] of [['GET', '/api'], ['GET', '/api/'], ['GET', '/api/me/games'], ['GET', `/api/games/${randomUUID()}?since=0`], ['GET', '/api/unknown'], ['POST', '/api/games'], ['POST', `/api/games/${randomUUID()}/commands`], ['OPTIONS', '/api/me/profile'], ['HEAD', '/api/me/games']]) {
      const response = await fetch(origin + path, { method, headers: { Authorization: `Bearer ${token}`, 'X-Kingdown-Dev-Actor': actors[0] }, ...(!['GET', 'HEAD'].includes(method) && { body: '{broken' }), redirect: 'manual' });
      assert.equal(response.status, 404, `${method} ${path}`); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.match(response.headers.get('content-type'), /^application\/json/); assert.equal(response.headers.get('location'), null);
      assert.deepEqual(method === 'HEAD' ? await response.text() : await response.json(), method === 'HEAD' ? '' : { code: 'NOT_FOUND', message: 'Not found' });
      closedCases++;
    }
    assert.equal(queries, 0); assert.equal(connections, 0);
  } finally { app.pool.query = query; app.pool.connect = connect; }
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
  await app.pool.end(); app = undefined;
  await pool.query('update public.web_account_access set enabled=true where singleton=true');
  app = await configurePlugin(webEnv, { localDev: true, websiteKeys });
  for (const [headers, status] of [[{}, 401], [{ 'X-Kingdown-Dev-Actor': actors[0] }, 401], [{ Authorization: `Bearer ${await sign({ exp: Math.floor(Date.now() / 1000) - 60 })}` }, 401], [{ Authorization: `Bearer ${await sign({ aud: `${origin}/mcp`, client_id: randomUUID() })}` }, 401], [{ Authorization: `Bearer ${token}` }, 200]]) {
    const response = await fetch(`${origin}/api/me/profile`, { headers });
    assert.equal(response.status, status); assert.equal(response.headers.get('cache-control'), 'no-store');
    if (status === 401) { assert.equal(response.headers.get('www-authenticate'), 'Bearer'); assert.equal((await response.json()).code, 'UNAUTHENTICATED'); }
    else assert.equal((await response.json()).user_id, actors[0]);
  }
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
  assert(counts.webp >= 20); assert.equal(counts.png, 1); assert.equal(counts.svg, 24); assert.equal(counts.woff2, 4);
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
  await assert.rejects(configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: 'https://plugin.example', KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', KINGDOWN_PLUGIN_OAUTH_READY: '0' }), /Enable Supabase OAuth/);
  await assert.rejects(configurePlugin({ NODE_ENV: 'production', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, KINGDOWN_INTERNAL_SECRET: secret }, { localDev: true }), /Local personas/);
  console.log(`Compiled HTTP + real PostgreSQL: ${closedCases} default API closures with zero pool calls, ${unsafeCases} unsafe website-key refusals, off-switch closure, isolated website identity and full/since reads, open, move, AI, retry, foreign seat rejection, service restart/resume, friend code/join, board recovery, resource (${resource.bytes} JSON bytes), ${art.length} art files (${JSON.stringify(counts)}), and production auth gate passed`);
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
  }
}
