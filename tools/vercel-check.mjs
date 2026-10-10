/** Smoke test of the one-project tree (npm run build:vercel) against a disposable local PostgreSQL DB:
 *  a local server routes requests as Vercel does (config routes, then a static file, then a function
 *  path) and the copied function answers with local personas. Deploys nothing. */
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
const actor = randomUUID(), clientId = randomUUID();
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

  await pool.query('insert into auth.users(id) values($1)', [actor]);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { configurePlugin } = await import(pathToFileURL(join(fn, 'server.mjs')).href);
  app = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_vercelcheck', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: clientId }, { localDev: true });
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
  for (const path of ['/api', '/api/games', '/internal/sweep', '/.well-known/oauth-protected-resource/mcp']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path); assert.match(response.headers.get('content-type'), /^application\/json/, `${path} reaches the function`);
  }
  assert.deepEqual([...served].sort(), ['function /.well-known/oauth-protected-resource/mcp', 'function /api', 'function /api/games', 'function /authorize', 'function /consent.mjs', 'function /internal/sweep', 'function /mcp', 'static /', 'static /privacy.html', 'static /sw.js']);
  console.log(`One-project tree: static site, /mcp (open, move), /authorize, /consent.mjs, /api and /internal (404 until tickets 08 and 06) and ${archive.length} archived engine(s) passed`);
} finally {
  server.closeAllConnections(); await new Promise(done => server.close(done));
  await app?.pool.end();
  await pool.query('delete from auth.users where id=$1', [actor]); await pool.end();
  await rm(tree, { recursive: true, force: true });
}
