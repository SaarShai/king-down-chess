/** Check the site build in a local copy with a disposable PostgreSQL database.
 * Account routes serve the browser entry. The default API stays closed; local test keys enable dispatch probes. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer, request } from 'node:http';
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
const actor = randomUUID(), clientId = randomUUID(), secret = randomUUID() + randomUUID();
const server = createServer(); let app, savedAccountAccess;
const exists = path => stat(path).then(s => s, () => undefined);
try {
  // Keep the relative function links: they must resolve inside the copy.
  await cp(resolve(process.argv[2] || 'kingdown-deploy/.vercel/output'), tree, { recursive: true, verbatimSymlinks: true });
  const config = JSON.parse(await readFile(join(tree, 'config.json'), 'utf8'));
  assert.equal(config.version, 3);
  const fn = join(tree, 'functions/mcp.func');
  assert.equal(JSON.parse(await readFile(join(fn, '.vc-config.json'), 'utf8')).handler, 'server.mjs');
  for (const path of ['authorize', 'consent.mjs', 'internal', '.well-known/oauth-protected-resource', '.well-known/oauth-protected-resource/mcp']) assert.equal(await realpath(join(tree, `functions/${path}.func`)), await realpath(fn), `${path} is the one function`);
  assert.equal(await exists(join(tree, 'functions/api.func')), undefined, 'No website API function');
  const apiRule = { src: '^/api(?:/.*)?$', dest: '/mcp' };
  assert.deepEqual(config.routes.filter(route => new RegExp(route.src).test('/api/games')), [apiRule]);
  for (const path of ['/api', '/api/', '/api/games', '/api/me/games']) assert(new RegExp(apiRule.src).test(path), path);
  for (const path of ['/apix', '/apiary', '/play', '/unrelated-path']) assert(!new RegExp(apiRule.src).test(path), path);
  for (const path of (await readdir(join(tree, 'functions'), { recursive: true })).filter(path => path.endsWith('.func'))) {
    assert.equal(await realpath(join(tree, 'functions', path)), await realpath(fn), `${path} is the one function`);
  }
  const worker = await readFile(join(tree, 'static/sw.js'), 'utf8');
  const version = /^const VERSION = '([a-f0-9]{12})';$/m.exec(worker)?.[1];
  assert(version, 'The worker has a built content version');
  assert.match(worker, /^const POLICY = 'public-build-v1';$/m);
  const workerList = name => {
    const matches = [...worker.matchAll(new RegExp(`^const ${name} = (\\[.*\\]);$`, 'gm'))];
    assert.equal(matches.length, 1, `One ${name} list`);
    const list = JSON.parse(matches[0][1]);
    assert(Array.isArray(list) && list.length > 0, `${name} is set`);
    assert.equal(new Set(list).size, list.length, `${name} has no duplicate`);
    return list;
  };
  const allowlist = workerList('ALLOWLIST'), precache = workerList('PRECACHE');
  assert.deepEqual(allowlist.slice(0, 2), ['./', 'index.html']);
  assert.deepEqual(precache, allowlist.filter(file => file !== 'index.html'));
  for (const file of allowlist) {
    assert(typeof file === 'string' && (['./', 'index.html'].includes(file) || /^(?:assets\/(?:[\w-]+\/)*[\w-]+\.(?:js|css|wasm|webp|png|svg|woff2)|ui\/[\w/-]+\.(?:webp|png|svg)|fonts\/[\w-]+\.woff2|icons\/[\w-]+\.png|manifest\.webmanifest)$/.test(file)), `Public build file: ${file}`);
    assert((await exists(join(tree, 'static', file === './' ? 'index.html' : file)))?.isFile(), `Offline file exists: ${file}`);
  }
  const index = await readFile(join(tree, 'static/index.html'), 'utf8');
  const entryFiles = [...index.matchAll(/(?:src|href)="(?:\.\/|\/)(assets\/[^"?]+)"/g)].map(match => match[1]);
  assert(entryFiles.length > 0, 'The local page has a build entry');
  for (const file of entryFiles) assert(precache.includes(file), `The local entry is offline: ${file}`);
  const archive = (await readdir(ENGINES)).filter(file => file.endsWith('.mjs')).sort();
  assert.deepEqual((await readdir(join(fn, 'runtime/engines'))).sort(), archive);
  // Each archived fixture game continues on its own bundle in the compiled runtime.
  const { loadMatch } = await import(pathToFileURL(join(fn, 'runtime/index.mjs')).href);
  for (const file of archive) {
    const old = await loadMatch(await readFile(join(ENGINES, file.replace(/\.mjs$/, '.save.json')), 'utf8'));
    try { const { revision, legal } = await old.snapshot(); assert.equal((await old.apply({ id: 'vercel-check', expectedRevision: revision, lan: legal[0] })).revision, revision + 1); }
    finally { await old.close(); }
  }

  for (const id of [actor]) {
    await pool.query('insert into auth.users(id) values($1)', [id]);
    await pool.query('update public.profiles set handle=$2 where id=$1', [id, `vercel-${id.slice(0,8)}`]);
  }
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { configurePlugin } = await import(pathToFileURL(join(fn, 'server.mjs')).href);
  const webEnv = { NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_vercelcheck', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: clientId, KINGDOWN_INTERNAL_SECRET: secret };
  const pair = await generateKeyPair('ES256'), websiteKeys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'website', alg: 'ES256' }] });
  const sign = (claims = {}) => new SignJWT({ iss: `${webEnv.SUPABASE_URL}/auth/v1`, aud: 'authenticated', sub: actor, role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 300, ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'website' }).sign(pair.privateKey);
  const token = await sign();
  app = await configurePlugin(webEnv, { localDev: true });
  const served = new Set();
  server.on('request', async (req, res) => {
    try {
      const path = new URL(req.url, origin).pathname;
      const routes = config.routes?.filter(route => new RegExp(route.src).test(path)) ?? [];
      const dest = routes.find(route => route.dest)?.dest ?? path;
      // A `continue` route adds its headers and goes on to the next match.
      for (const route of routes) if (route.headers) for (const [name, value] of Object.entries(route.headers)) res.setHeader(name, value);
      const file = join(tree, 'static', dest.endsWith('/') ? `${dest}index.html` : dest);
      if (['GET', 'HEAD'].includes(req.method) && (await exists(file))?.isFile()) { served.add(`static ${path.startsWith('/plugin-art/') ? '/plugin-art/*' : path}`); res.end(req.method === 'HEAD' ? undefined : await readFile(file)); return; }
      // Vercel gives the function the original request path, also after a route.
      if (await exists(join(tree, 'functions', `${dest}.func`))) { served.add(`function ${path}`); await app.handler(req, res); return; }
      res.writeHead(404).end();
    } catch { if (!res.headersSent) res.writeHead(500); res.end(); }
  });

  const closedApi = [['GET', '/api/status'], ['POST', '/api/status'], ['GET', '/api'], ['GET', '/api/'], ['GET', '/api/me/games'], ['GET', `/api/games/${randomUUID()}?since=0`], ['GET', '/api/unknown'], ['POST', '/api/games'], ['POST', '/api/games/inert/commands'], ['OPTIONS', '/api/me/profile'], ['HEAD', '/api/me/games']];
  let queries = 0, connections = 0, closedCases = 0;
  const query = app.pool.query, connect = app.pool.connect;
  app.pool.query = function (...args) { queries++; return query.apply(this, args); };
  app.pool.connect = function (...args) { connections++; return connect.apply(this, args); };
  const assertClosure = async (response, method = 'GET') => {
    assert.equal(response.status, 404); assert.equal(response.headers.get('location'), null);
    assert.match(response.headers.get('content-type'), /^application\/json/);
    assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(method === 'HEAD' ? await response.text() : await response.json(), method === 'HEAD' ? '' : { code: 'NOT_FOUND', message: 'Not found' });
  };
  try {
    for (const [method, path] of closedApi) for (const headers of [{}, { Authorization: `Bearer ${token}`, 'X-Kingdown-Dev-Actor': actor }]) {
      await assertClosure(await fetch(origin + path, { method, headers, ...(!['GET', 'HEAD'].includes(method) && { body: '{broken' }), redirect: 'manual' }), method);
      closedCases++;
    }
    assert.equal(queries, 0); assert.equal(connections, 0);
  } finally { app.pool.query = query; app.pool.connect = connect; }

  for (const path of ['/', '/sw.js', '/privacy.html']) assert.equal((await fetch(origin + path)).status, 200, path);
  for (const path of ['/', '/sw.js']) {
    const head = await fetch(origin + path, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    assert.equal((await fetch(origin + path, { method: 'POST' })).status, 404);
  }
  assert((await (await fetch(origin)).text()).includes('<html'));
  const publicPaths = allowlist.map(file => new URL(file, origin + '/').pathname);
  for (const path of publicPaths) {
    const response = await fetch(origin + path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(join(tree, 'static', path === '/' ? 'index.html' : path)), path);
  }
  const challenge = '/.well-known/openai-apps-challenge';
  const challengeFile = join(tree, 'static', challenge);
  const hasChallenge = (await exists(challengeFile))?.isFile();
  if (hasChallenge) {
    const response = await fetch(origin + challenge, { redirect: 'manual' });
    assert.equal(response.status, 200, challenge);
    assert.match(response.headers.get('content-type') ?? '', /^text\/plain(?:\s*;|$)/i, challenge);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(challengeFile), challenge);
  }
  let requestId = 0;
  const tool = async (name, args) => {
    const response = await fetch(`${origin}/mcp`, { method: 'POST', headers: { 'X-Kingdown-Dev-Actor': actor, 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method: 'tools/call', params: { name, arguments: args } }) });
    assert.equal(response.status, 200); return JSON.parse(await response.text()).result;
  };
  // The board names each art file of the static tree, and Vercel serves it with long cache and CORS headers.
  const art = (await readdir(join(tree, 'static/plugin-art'))).sort();
  for (const type of ['webp', 'png', 'svg', 'woff2']) assert(art.some(file => file.endsWith(`.${type}`)), `The tree has ${type} art`);
  assert.deepEqual([...new Set((await readFile(join(fn, 'board.html'), 'utf8')).match(/(?<=https:\/\/kingdown-art\.invalid\/plugin-art\/)[\w-]+\.(?:webp|png|svg|woff2)/g))].sort(), art);
  for (const file of art) {
    const response = await fetch(`${origin}/plugin-art/${file}`);
    assert.equal(response.status, 200, file); assert.equal(response.headers.get('content-type'), { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2' }[file.split('.').at(-1)]); assert.equal(response.headers.get('access-control-allow-origin'), '*'); assert.match(response.headers.get('cache-control'), /max-age=31536000.*immutable/);
  }
  const open = await tool('kingdown_open', {}); assert(!open.isError);
  assert.equal(open.structuredContent.screen, 'home'); assert.equal(open._meta.view, undefined);
  let created = await tool('kingdown_create', { kind: 'solo' }); assert(!created.isError);
  if (created._meta.view.status === 'setup') {
    const v = created._meta.view;
    created = await tool('kingdown_choose', { game_id: v.game_id, command_id: 'vercel-ready', expected_revision: v.revision, ...v.choices[v.seat], ready: true });
    assert(!created.isError);
  }
  const { game_id, legal, revision } = created._meta.view;
  const moved = await tool('kingdown_move', { game_id, command_id: 'vercel-first', expected_revision: revision, lan: legal.find(lan => !lan.includes('!')) });
  assert(!moved.isError); assert.equal(moved._meta.view.revision, revision + 1);
  const authorize = await fetch(`${origin}/authorize?authorization_id=${randomUUID()}`);
  assert.equal(authorize.status, 200); assert.match(authorize.headers.get('content-type'), /^text\/html/);
  assert((await authorize.text()).includes(clientId)); assert.match(authorize.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const script = await fetch(`${origin}/consent.mjs`); assert.equal(script.status, 200); assert.match(script.headers.get('content-type'), /^text\/javascript/);
  for (const [path, status] of [['/internal/sweep', 403], ['/.well-known/oauth-protected-resource', 404], ['/.well-known/oauth-protected-resource/mcp', 404]]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, status, path); assert.match(response.headers.get('content-type'), /^application\/json/, `${path} reaches the function`);
  }

  for (const path of ['/api', '/api/games', '/api/me/games']) {
    await assertClosure(await fetch(origin + path));
    await assertClosure(await fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'random', speed: 'live', setup: { fen: '7k/8/8/8/8/8/8/K7 w - - 0 1' } }) }));
  }
  const accountPaths = ['/play', '/play/', '/play/profile', '/play/settings', '/g/test-id', '/j', '/j/'];
  for (const path of accountPaths) for (const query of ['', '?probe=1']) {
    const response = await fetch(origin + path + query, { redirect: 'manual' });
    assert.equal(response.status, 200, path + query);
    assert.equal(response.headers.get('location'), null, path + query);
    assert.equal(await response.text(), index, `${path + query} serves only the browser entry`);
    const head = await fetch(origin + path + query, { method: 'HEAD', redirect: 'manual' });
    assert.equal(head.status, 200, `HEAD ${path + query}`); assert.equal(await head.text(), '');
    assert.equal((await fetch(origin + path + query, { method: 'POST', redirect: 'manual' })).status, 404, `POST ${path + query}`);
  }
  const closedPaths = ['/play.html', '/j/inert-token', '/unrelated-path'];
  for (const path of [...closedPaths, '/api', '/api/games', '/api/me/games']) for (const query of ['', '?probe=1']) {
    const response = await fetch(origin + path + query, { redirect: 'manual' });
    assert.equal(response.status, 404, path + query);
    assert.equal(response.headers.get('location'), null, path + query);
    if (path.startsWith('/api')) await assertClosure(response);
  }

  // /internal runs a job only with the secret; the removed email job has no endpoint.
  const job = (path, key) => fetch(origin + path, { method: 'POST', headers: key ? { 'X-Kingdown-Internal': key } : {} });
  assert.equal((await job('/internal/tick')).status, 403); assert.equal((await job('/internal/tick', `${secret}x`)).status, 403);
  const tick = await job('/internal/tick', secret); assert.equal(tick.status, 200); assert.equal(typeof (await tick.json()).ended, 'number');
  const outbox = await job('/internal/outbox', secret); assert.equal(outbox.status, 404);
  assert.deepEqual(await outbox.json(), { code: 'NOT_FOUND', message: 'Not found' });
  const unknownJob = await job('/internal/unknown', secret); assert.equal(unknownJob.status, 404);
  assert.deepEqual([...served].sort(), [...new Set(['function /.well-known/oauth-protected-resource', 'function /.well-known/oauth-protected-resource/mcp', 'function /authorize', 'function /consent.mjs', 'function /internal/outbox', 'function /internal/sweep', 'function /internal/tick', 'function /internal/unknown', 'function /mcp', 'function /api/games', ...closedApi.map(([, path]) => `function ${new URL(path, origin).pathname}`), 'static /', 'static /plugin-art/*', 'static /privacy.html', 'static /sw.js', ...accountPaths.map(path => `static ${path}`), ...publicPaths.map(path => `static ${path}`), ...(hasChallenge ? [`static ${challenge}`] : [])])].sort(), 'Closed/default served paths');

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
  const currentUserRequests = [];
  app = await configurePlugin(webEnv, { localDev: true, websiteKeys, websiteCurrentUser: async (bearer, user) => {
    currentUserRequests.push([bearer, user]);
    throw new Error('The local provider probe refuses the current session');
  } });
  served.clear();
  let enabledCases = 0;
  const checkApi = response => {
    enabledCases++;
    assert.match(response.headers.get('content-type'), /^application\/json/);
    assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('location'), null);
    return response;
  };
  const api = (path, init) => fetch(origin + path, { redirect: 'manual', ...init }).then(checkApi);
  const signed = { Authorization: `Bearer ${token}` };
  // One compiled getter supplies both routes. SQL changes need no rebuild or handler restart.
  const originalQuery = app.pool.query;
  let switchQueries = 0;
  app.pool.query = function (...args) { if (String(args[0]).includes('from public.web_account_access')) switchQueries++; return originalQuery.apply(this, args); };
  const effects = [];
  try {
    const schema = await app.pool.query('select singleton, enabled from public.web_account_access where singleton=true');
    assert.deepEqual(schema.rows, [{ singleton: true, enabled: true }], 'Required web schema/grant probe');
    switchQueries = 0;
    for (const enabled of [false, true]) {
      const requestStart = performance.now(), held = await api('/api/status');
      const previous = await held.clone().json();
      assert.equal(previous.account_access, enabled ? 'closed' : 'open');
      const reads = switchQueries;
      assert.equal((await api('/api/me/profile', { headers: signed })).status, enabled ? 503 : 200);
      assert(switchQueries === reads || switchQueries === reads + 1 && performance.now() >= requestStart + previous.valid_for_ms, 'Status and private reads share the proof until its deadline');
      const changed = performance.now();
      await pool.query('update public.web_account_access set enabled=$1 where singleton=true', [enabled]);
      // Expire every proof admitted before the SQL change, including a refresh between requests.
      const deadline = performance.now() + 5000;
      await new Promise(done => setTimeout(done, Math.max(0, deadline - performance.now()) + 2));
      const beforeRefresh = switchQueries, refreshStart = performance.now();
      const direct = await api('/api/me/profile', { headers: signed });
      assert.equal(switchQueries, beforeRefresh + 1, 'An expired direct proof refreshes once');
      assert.equal(direct.status, enabled ? 200 : 503);
      const current = await api('/api/status'); assert.equal(current.status, 200);
      const next = await current.json(); assert.equal(next.account_access, enabled ? 'open' : 'closed');
      if (!enabled) {
        assert.deepEqual(next, { account_access: 'closed', valid_for_ms: 0 });
        assert.deepEqual(await held.json(), previous, 'The old open response can arrive after direct closure');
        assert(performance.now() >= requestStart + previous.valid_for_ms, 'A held open status cannot renew its lease');
      }
      assert(switchQueries === beforeRefresh + 1 || switchQueries === beforeRefresh + 2 && performance.now() >= refreshStart + 5000, 'Status shares the fresh direct proof until its deadline');
      effects.push({ enabled, observed_ms: Math.round(performance.now() - changed) });
    }
  } finally { app.pool.query = originalQuery; }
  const status = await api('/api/status'); assert.equal(status.status, 200); assert.equal(status.headers.get('referrer-policy'), 'no-referrer');
  const lease = await status.json(); assert.equal(lease.account_access, 'open');
  assert(Number.isInteger(lease.valid_for_ms) && lease.valid_for_ms > 0 && lease.valid_for_ms <= 5000);
  for (const [headers, status] of [[{}, 401], [{ 'X-Kingdown-Dev-Actor': actor }, 401], [{ Authorization: `Bearer ${await sign({ exp: Math.floor(Date.now() / 1000) - 60 })}` }, 401], [{ Authorization: `Bearer ${await sign({ aud: `${origin}/mcp`, client_id: clientId })}` }, 401], [signed, 200]]) {
    const response = await api('/api/me/profile', { headers });
    assert.equal(response.status, status);
    if (status === 401) { assert.equal(response.headers.get('www-authenticate'), 'Bearer'); assert.equal((await response.json()).code, 'UNAUTHENTICATED'); }
    else assert.equal((await response.json()).user_id, actor);
  }
  for (const headers of [{ Origin: 'https://foreign.example' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
    const response = await api('/api/me/profile', { headers: { ...signed, ...headers } });
    assert.equal(response.status, 403); assert.equal(response.headers.get('access-control-allow-origin'), null); assert.equal((await response.json()).code, 'FORBIDDEN');
  }
  const raw = (path, headers, chunks = []) => new Promise((done, reject) => {
    const req = request(origin + path, { method: chunks.length ? 'POST' : 'GET', headers }, res => {
      const body = []; res.on('data', part => body.push(part)); res.on('error', reject);
      res.on('end', () => done(new Response(Buffer.concat(body), { status: res.statusCode, headers: res.headers })));
    });
    req.on('error', reject); for (const chunk of chunks) req.write(chunk); req.end();
  }).then(checkApi);
  const foreignHost = await raw('/api/me/profile', { ...signed, Host: 'foreign.example' });
  assert.equal(foreignHost.status, 403); assert.equal(foreignHost.headers.get('access-control-allow-origin'), null); assert.equal((await foreignHost.json()).code, 'FORBIDDEN');
  const wrongMethod = await api('/api/me/games', { method: 'POST', headers: signed });
  assert.equal(wrongMethod.status, 405); assert.equal(wrongMethod.headers.get('allow'), 'GET'); assert.equal((await wrongMethod.json()).code, 'NOT_ALLOWED');
  for (const path of ['/api', '/api/', '/api/unknown?probe=1']) await assertClosure(await api(path));
  const fullResponse = await api(`/api/games/${game_id}`, { headers: signed }); assert.equal(fullResponse.status, 200); const full = await fullResponse.json();
  const sinceResponse = await api(`/api/games/${game_id}?since=0`, { headers: signed }); assert.equal(sinceResponse.status, 200); const since = await sinceResponse.json();
  assert.equal(full.game_id, game_id); assert(full.rules); assert.equal(since.game_id, game_id); assert.equal(since.rules, undefined); assert.equal(since.revision, full.revision); assert.deepEqual(since.last_commands.at(-1), moved._meta.view.last_commands.at(-1));
  const invalidSince = await api(`/api/games/${game_id}?since=-1`, { headers: signed });
  assert.equal(invalidSince.status, 400); assert.equal((await invalidSince.json()).code, 'INVALID_INPUT');
  const gameRows = () => pool.query('select to_jsonb(g) as game from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=$1) order by g.id', [actor]);
  const before = (await gameRows()).rows;
  const assertProviderRefusal = async response => {
    assert.equal(response.status, 503); assert.equal(response.headers.get('retry-after'), '5');
    assert.deepEqual(await response.json(), { code: 'UNAVAILABLE', message: 'Sign-in verification is temporarily unavailable. Retry.' });
  };
  const malformed = await api('/api/games', { method: 'POST', headers: { ...signed, 'Content-Type': 'application/json' }, body: '{broken' });
  await assertProviderRefusal(malformed);
  const large = 'x'.repeat(32 * 1024);
  for (const headers of [{ 'Content-Length': String(Buffer.byteLength(large)) }, { 'Transfer-Encoding': 'chunked' }]) {
    const response = await raw('/api/games', { ...signed, 'Content-Type': 'application/json', ...headers }, [large.slice(0, 8192), large.slice(8192)]);
    await assertProviderRefusal(response);
  }
  assert.deepEqual(currentUserRequests, [[token, actor], [token, actor], [token, actor]], 'Every signed write checks the current provider session before reading its body');
  assert.deepEqual((await gameRows()).rows, before, 'Provider-refused writes have no game effect');
  assert.deepEqual([...served].sort(), ['/api', '/api/', '/api/games', `/api/games/${game_id}`, '/api/me/games', '/api/me/profile', '/api/status', '/api/unknown'].map(path => `function ${path}`).sort(), 'Enabled/test served paths');
  console.log(`Same-switch compiled status/direct effects: ${JSON.stringify(effects)}`);
  console.log(`Site tree: worker ${version} / public-build-v1, ${precache.length} offline URLs, ${accountPaths.length} browser entry routes, ${closedPaths.length} closed legacy/unknown paths, ${art.length} board art files, MCP open and move, OAuth, ${closedCases} closed/default API probes with zero pool calls, off-switch closure, ${enabledCases} enabled/test API probes with 3 current-provider refusals, internal jobs and ${archive.length} archived engine(s) passed`);
} finally {
  try {
    if (savedAccountAccess !== undefined) {
      await pool.query('update public.web_account_access set enabled=$1 where singleton=true', [savedAccountAccess]);
      assert.equal((await pool.query('select enabled from public.web_account_access where singleton=true')).rows[0]?.enabled, savedAccountAccess, 'Restore account switch');
    }
  } finally {
    server.closeAllConnections(); await new Promise(done => server.close(done));
    await app?.pool.end();
    await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [[actor]]);
    await pool.query('delete from auth.users where id=any($1::uuid[])', [[actor]]); await pool.end();
    await rm(tree, { recursive: true, force: true });
  }
}
