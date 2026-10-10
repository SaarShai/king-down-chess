/** Smoke test of the one-project tree (npm run build:vercel) against a disposable local PostgreSQL DB:
 *  a local server routes requests as Vercel does (config routes, then a static file, then a function
 *  path) and the copied function answers: /mcp with local personas, /api with website sessions signed
 *  by a local key set, /internal with the secret. A website player and a ChatGPT player finish a Daily
 *  game in one database. Deploys nothing and sends no email. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { cp, mkdtemp, readdir, readFile, realpath, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { ENGINES } from './plugin-runtime-build.mjs';

const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL to a disposable loopback PostgreSQL database');
const url = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('This check requires a disposable loopback database ending in _test');
const tree = await mkdtemp(join(tmpdir(), 'kingdown-vercel-'));
const pool = new pg.Pool({ connectionString });
const actor = randomUUID(), web = randomUUID(), web2 = randomUUID(), clientId = randomUUID(), secret = randomUUID() + randomUUID();
const server = createServer(); let app;
const exists = path => stat(path).then(s => s, () => undefined);
try {
  // Keep the relative function links: they must resolve inside the copy.
  await cp(resolve(process.argv[2] || 'kingdown-deploy/.vercel/output'), tree, { recursive: true, verbatimSymlinks: true });
  const config = JSON.parse(await readFile(join(tree, 'config.json'), 'utf8'));
  assert.equal(config.version, 3);
  const fn = join(tree, 'functions/mcp.func');
  assert.equal(JSON.parse(await readFile(join(fn, '.vc-config.json'), 'utf8')).handler, 'server.mjs');
  for (const path of ['authorize', 'consent.mjs', 'api', 'internal', '.well-known/oauth-protected-resource', '.well-known/oauth-protected-resource/mcp']) assert.equal(await realpath(join(tree, `functions/${path}.func`)), await realpath(fn), `${path} is the one function`);
  const archive = (await readdir(ENGINES)).filter(file => file.endsWith('.mjs')).sort();
  assert.deepEqual((await readdir(join(fn, 'runtime/engines'))).sort(), archive);
  // Each archived fixture game continues on its own bundle in the compiled runtime.
  const { loadMatch } = await import(pathToFileURL(join(fn, 'runtime/index.mjs')).href);
  for (const file of archive) {
    const old = await loadMatch(await readFile(join(ENGINES, file.replace(/\.mjs$/, '.save.json')), 'utf8'));
    try { const { revision, legal } = await old.snapshot(); assert.equal((await old.apply({ id: 'vercel-check', expectedRevision: revision, lan: legal[0] })).revision, revision + 1); }
    finally { await old.close(); }
  }

  for (const id of [actor, web, web2]) await pool.query('insert into auth.users(id) values($1)', [id]);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { configurePlugin } = await import(pathToFileURL(join(fn, 'server.mjs')).href);
  // Website sessions as Supabase signs them, from a local key set; one claim changes in each refused token.
  const pair = await generateKeyPair('ES256'), sessionKeys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'local', alg: 'ES256' }] });
  const session = (claims = {}) => { const now = Math.floor(Date.now() / 1000); return new SignJWT({ iss: 'https://project.supabase.co/auth/v1', aud: 'authenticated', sub: web, role: 'authenticated', is_anonymous: false, iat: now, exp: now + 600, ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'local' }).sign(pair.privateKey); };
  app = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_vercelcheck', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: clientId, KINGDOWN_INTERNAL_SECRET: secret }, { localDev: true, sessionKeys });
  const served = new Set();
  server.on('request', async (req, res) => {
    try {
      const path = new URL(req.url, origin).pathname;
      const dest = config.routes?.find(route => new RegExp(route.src).test(path))?.dest ?? path;
      const file = join(tree, 'static', dest.endsWith('/') ? `${dest}index.html` : dest);
      if ((await exists(file))?.isFile()) { served.add(`static ${path}`); res.end(await readFile(file)); return; }
      // Vercel gives the function the original request path, also after a route.
      if (await exists(join(tree, 'functions', `${dest}.func`))) { served.add(`function ${path}`); await app.handler(req, res); return; }
      res.writeHead(404).end();
    } catch { if (!res.headersSent) res.writeHead(500); res.end(); }
  });

  for (const path of ['/', '/sw.js', '/privacy.html']) assert.equal((await fetch(origin + path)).status, 200, path);
  assert((await (await fetch(origin)).text()).includes('<html'));
  let requestId = 0;
  const tool = async (name, args) => {
    const response = await fetch(`${origin}/mcp`, { method: 'POST', headers: { 'X-Kingdown-Dev-Actor': actor, 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method: 'tools/call', params: { name, arguments: args } }) });
    assert.equal(response.status, 200); return JSON.parse(await response.text()).result;
  };
  const open = await tool('kingdown_open', {}); assert(!open.isError);
  const { game_id, legal } = open._meta.view;
  const moved = await tool('kingdown_move', { game_id, command_id: 'vercel-first', expected_revision: 0, lan: legal.find(lan => !lan.includes('!')) });
  assert(!moved.isError); assert.equal(moved._meta.view.revision, 1);
  const authorize = await fetch(`${origin}/authorize?authorization_id=${randomUUID()}`);
  assert.equal(authorize.status, 200); assert.match(authorize.headers.get('content-type'), /^text\/html/);
  assert((await authorize.text()).includes(clientId)); assert.match(authorize.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const script = await fetch(`${origin}/consent.mjs`); assert.equal(script.status, 200); assert.match(script.headers.get('content-type'), /^text\/javascript/);
  for (const [path, status] of [['/api', 404], ['/api/games', 405], ['/internal/sweep', 403], ['/.well-known/oauth-protected-resource/mcp', 404]]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, status, path); assert.match(response.headers.get('content-type'), /^application\/json/, `${path} reaches the function`);
  }

  // /api takes a website session only: not none, not another audience, not an MCP (OAuth) token, not a guest.
  const api = async (path, { token, method = 'GET', body } = {}) => {
    const response = await fetch(origin + path, { method, headers: { ...(token && { Authorization: `Bearer ${token}` }), 'Content-Type': 'application/json' }, ...(body && { body: JSON.stringify(body) }) });
    assert.equal(response.headers.get('cache-control'), 'no-store', path); assert.equal(response.headers.get('access-control-allow-origin'), null, path);
    return { status: response.status, value: response.status === 204 ? undefined : await response.json() };
  };
  for (const token of [undefined, await session({ aud: `${origin}/mcp` }), await session({ client_id: clientId }), await session({ is_anonymous: true })]) assert.equal((await api('/api/me/games', { token })).status, 401);
  const token = await session(), token2 = await session({ sub: web2 });
  assert.deepEqual(await api('/api/me/games', { token }), { status: 200, value: [] });
  const plain = legal => legal.find(lan => !lan.includes('!'));

  // Two website players finish a Daily friend game: an invitation by short code, a move each, a resignation.
  const friendly = await api('/api/games', { token, method: 'POST', body: { kind: 'friend', colour: 'white' } });
  const friendId = friendly.value.view.game_id;
  assert.equal((await api('/api/invites/redeem', { token: token2, method: 'POST', body: { code: friendly.value.invite.code } })).value.seat, 1);
  for (const [who, revision] of [[token, 1], [token2, 2]]) {
    const legal = (await api(`/api/games/${friendId}`, { token: who })).value.legal;
    assert.equal((await api(`/api/games/${friendId}/commands`, { token: who, method: 'POST', body: { command_id: `friendly-${revision}`, expected_revision: revision, action: { type: 'turn', actions: [plain(legal)] } } })).value.revision, revision + 1);
  }
  const over = await api(`/api/games/${friendId}/commands`, { token: token2, method: 'POST', body: { command_id: 'friendly-end', expected_revision: 3, action: { type: 'resign' } } });
  assert.deepEqual(over.value.view.result, { winner: 0, reason: 'resignation' });

  // Crossplay: a website player (White) and a ChatGPT player (Black) finish a Daily game in one database.
  const made = await api('/api/games', { token, method: 'POST', body: { kind: 'friend', speed: 'daily', colour: 'white' } });
  assert.equal(made.status, 201); assert.equal(made.value.invite.url, `${origin}/j/${made.value.invite.token}`);
  const gameId = made.value.view.game_id;
  const joined = await tool('kingdown_join', { token: made.value.invite.token });
  assert(!joined.isError); assert.equal(joined.structuredContent.matchId, gameId); assert.equal(joined.structuredContent.playerColor, 1);
  let view = (await api(`/api/games/${gameId}`, { token })).value;
  const turn = { command_id: 'crossplay-1', expected_revision: view.revision, action: { type: 'turn', actions: [plain(view.legal)] } };
  const first = await api(`/api/games/${gameId}/commands`, { token, method: 'POST', body: turn });
  assert.equal(first.value.type, 'ack'); assert.equal(first.value.revision, 2);
  assert.deepEqual((await api(`/api/games/${gameId}/commands`, { token, method: 'POST', body: turn })).value.revision, 2); // a retry applies once
  const black = await tool('kingdown_get', { matchId: gameId });
  const reply = await tool('kingdown_move', { matchId: gameId, id: 'crossplay-2', expectedRevision: 2, lan: plain(black.structuredContent.snapshot.legal) });
  assert(!reply.isError); assert.equal(reply.structuredContent.snapshot.revision, 3);
  view = (await api(`/api/games/${gameId}?since=2`, { token })).value;
  assert.deepEqual(view.last_commands.map(command => [command.seq, command.seat]), [[3, 1]]);
  const resigned = await api(`/api/games/${gameId}/commands`, { token, method: 'POST', body: { command_id: 'crossplay-3', expected_revision: 3, action: { type: 'resign' } } });
  assert.deepEqual([resigned.value.view.status, resigned.value.view.result], ['finished', { winner: 1, reason: 'resignation' }]);
  assert.equal((await tool('kingdown_move', { matchId: gameId, id: 'crossplay-4', expectedRevision: 4, lan: plain(black.structuredContent.snapshot.legal) }))._meta.code, 'MATCH_TERMINAL');
  assert.deepEqual((await pool.query('select surface from public.game_commands where game_id=$1 and command_id is not null order by seq', [gameId])).rows.map(row => row.surface), ['web', 'chatgpt', 'web']);

  // /internal runs a job only with the secret; email stays off without its settings.
  const job = (path, key) => fetch(origin + path, { method: 'POST', headers: key ? { 'X-Kingdown-Internal': key } : {} });
  assert.equal((await job('/internal/tick')).status, 403); assert.equal((await job('/internal/tick', `${secret}x`)).status, 403);
  const tick = await job('/internal/tick', secret); assert.equal(tick.status, 200); assert.equal(typeof (await tick.json()).ended, 'number');
  assert.equal((await job('/internal/outbox', secret)).status, 503);
  assert.deepEqual([...served].sort(), ['function /.well-known/oauth-protected-resource/mcp', 'function /api', 'function /api/games', `function /api/games/${friendId}`, `function /api/games/${friendId}/commands`, `function /api/games/${gameId}`, `function /api/games/${gameId}/commands`, 'function /api/invites/redeem', 'function /api/me/games', 'function /authorize', 'function /consent.mjs', 'function /internal/outbox', 'function /internal/sweep', 'function /internal/tick', 'function /mcp', 'static /', 'static /privacy.html', 'static /sw.js'].sort());
  console.log(`One-project tree: static site, /mcp (open, move), /authorize, /consent.mjs, /api (session tokens only; Daily games between two website players and between a website and a ChatGPT player, with a retry), /internal (secret only) and ${archive.length} archived engine(s) passed`);
} finally {
  server.closeAllConnections(); await new Promise(done => server.close(done));
  await app?.pool.end();
  await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [[actor, web, web2]]);
  await pool.query('delete from auth.users where id=any($1::uuid[])', [[actor, web, web2]]); await pool.end();
  await rm(tree, { recursive: true, force: true });
}
