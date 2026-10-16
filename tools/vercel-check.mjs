/** Check the site build in a local copy with a disposable PostgreSQL database.
 * The MVP serves MCP, OAuth and internal jobs. It exposes no website API. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { cp, mkdtemp, readdir, readFile, realpath, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { ENGINES } from './plugin-runtime-build.mjs';

const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL to a disposable loopback PostgreSQL database');
const url = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('This check requires a disposable loopback database ending in _test');
const tree = await mkdtemp(join(tmpdir(), 'kingdown-vercel-'));
const pool = new pg.Pool({ connectionString });
const actor = randomUUID(), clientId = randomUUID(), secret = randomUUID() + randomUUID();
const server = createServer(); let app;
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
  assert(!config.routes.some(route => new RegExp(route.src).test('/api/games')), 'No website API route');
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
  app = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_vercelcheck', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: clientId, KINGDOWN_INTERNAL_SECRET: secret }, { localDev: true });
  const served = new Set();
  server.on('request', async (req, res) => {
    try {
      const path = new URL(req.url, origin).pathname;
      const routes = config.routes?.filter(route => new RegExp(route.src).test(path)) ?? [];
      const dest = routes.find(route => route.dest)?.dest ?? path;
      // A `continue` route adds its headers and goes on to the next match.
      for (const route of routes) if (route.headers) for (const [name, value] of Object.entries(route.headers)) res.setHeader(name, value);
      const file = join(tree, 'static', dest.endsWith('/') ? `${dest}index.html` : dest);
      if ((await exists(file))?.isFile()) { served.add(`static ${path.startsWith('/plugin-art/') ? '/plugin-art/*' : path}`); res.end(await readFile(file)); return; }
      // Vercel gives the function the original request path, also after a route.
      if (await exists(join(tree, 'functions', `${dest}.func`))) { served.add(`function ${path}`); await app.handler(req, res); return; }
      res.writeHead(404).end();
    } catch { if (!res.headersSent) res.writeHead(500); res.end(); }
  });

  for (const path of ['/', '/sw.js', '/privacy.html']) assert.equal((await fetch(origin + path)).status, 200, path);
  assert((await (await fetch(origin)).text()).includes('<html'));
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
  for (const [path, status] of [['/internal/sweep', 403], ['/.well-known/oauth-protected-resource/mcp', 404]]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, status, path); assert.match(response.headers.get('content-type'), /^application\/json/, `${path} reaches the function`);
  }

  for (const path of ['/api', '/api/games', '/api/me/games']) {
    assert.equal((await fetch(origin + path)).status, 404, path);
    assert.equal((await fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'random', speed: 'live', setup: { fen: '7k/8/8/8/8/8/8/K7 w - - 0 1' } }) })).status, 404, path);
  }

  // /internal runs a job only with the secret; email stays off without its settings.
  const job = (path, key) => fetch(origin + path, { method: 'POST', headers: key ? { 'X-Kingdown-Internal': key } : {} });
  assert.equal((await job('/internal/tick')).status, 403); assert.equal((await job('/internal/tick', `${secret}x`)).status, 403);
  const tick = await job('/internal/tick', secret); assert.equal(tick.status, 200); assert.equal(typeof (await tick.json()).ended, 'number');
  assert.equal((await job('/internal/outbox', secret)).status, 503);
  assert.deepEqual([...served].sort(), ['function /.well-known/oauth-protected-resource/mcp', 'function /authorize', 'function /consent.mjs', 'function /internal/outbox', 'function /internal/sweep', 'function /internal/tick', 'function /mcp', 'static /', 'static /plugin-art/*', 'static /privacy.html', 'static /sw.js', ...(hasChallenge ? [`static ${challenge}`] : [])].sort());
  console.log(`Site tree: ${art.length} board art files, MCP open and move, OAuth, API refusal, internal jobs and ${archive.length} archived engine(s) passed`);
} finally {
  server.closeAllConnections(); await new Promise(done => server.close(done));
  await app?.pool.end();
  await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [[actor]]);
  await pool.query('delete from auth.users where id=any($1::uuid[])', [[actor]]); await pool.end();
  await rm(tree, { recursive: true, force: true });
}
