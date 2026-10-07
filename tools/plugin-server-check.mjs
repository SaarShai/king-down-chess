/** Opt-in end-to-end check of a built artifact against a disposable local PostgreSQL DB. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL to a disposable loopback PostgreSQL database');
const url = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('This check requires a disposable loopback database ending in _test');
const artifact = await mkdtemp(join(tmpdir(), 'kingdown-http-artifact-'));
const pool = new pg.Pool({ connectionString });
const actors = [randomUUID(), randomUUID()];
const server = createServer(); let app, requestId = 0;
try {
  await cp(resolve(process.argv[2] || 'plugin-server-dist'), artifact, { recursive: true });
  const { configurePlugin } = await import(pathToFileURL(resolve(artifact, 'server.mjs')).href);
  const identity = await pool.query('select current_database() as name,version() as version');
  assert(identity.rows[0].name.endsWith('_test')); assert(identity.rows[0].version.startsWith('PostgreSQL '));
  for (const actor of actors) await pool.query('insert into auth.users(id) values($1)', [actor]);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  app = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString }, { localDev: true });
  server.on('request', (req, res) => { void app.handler(req, res).catch(() => { res.statusCode = 500; res.end(); }); });
  async function rpc(actor, method, params) {
    const response = await fetch(`${origin}/mcp`, { method: 'POST', headers: { 'X-Kingdown-Dev-Actor': actor, 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }) });
    assert.equal(response.status, 200); assert(!response.headers.has('mcp-session-id'));
    const text = await response.text(); return { result: JSON.parse(text).result, bytes: Buffer.byteLength(text) };
  }
  const tool = async (actor, name, args) => (await rpc(actor, 'tools/call', { name, arguments: args })).result;
  const open = await tool(actors[0], 'kingdown_open', {});
  assert(!open.isError); const initial = open.structuredContent;
  assert.equal(initial.snapshot.revision, 0); assert(initial.snapshot.legal.length);
  const command = { matchId: initial.matchId, id: 'http-first', expectedRevision: 0, lan: initial.snapshot.legal.find(lan => !lan.includes('!')) };
  const moved = await tool(actors[0], 'kingdown_move', command); assert(!moved.isError); assert.equal(moved.structuredContent.snapshot.revision, 1);
  const computer = { matchId: initial.matchId, id: 'http-ai', expectedRevision: 1 };
  const ai = await tool(actors[0], 'kingdown_computer', computer); assert(!ai.isError); assert.equal(ai.structuredContent.snapshot.revision, 2);
  assert.deepEqual((await tool(actors[0], 'kingdown_computer', computer)).structuredContent, ai.structuredContent);
  assert((await tool(actors[1], 'kingdown_get', { matchId: initial.matchId })).isError);
  const persisted = await pool.query('select save,revision,(select count(*)::int from public.plugin_match_commands where match_id=$1) as commands from public.plugin_matches where id=$1', [initial.matchId]);
  assert.equal(persisted.rows[0].commands, 2); assert.equal(persisted.rows[0].revision, 2); assert.match(JSON.parse(persisted.rows[0].save).engine, /^sha256:/);
  // New pool/service/handler instances demonstrate reconnect without any in-memory authority.
  const restarted = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString }, { localDev: true });
  await app.pool.end(); app = restarted;
  assert.deepEqual((await tool(actors[0], 'kingdown_resume', {})).structuredContent, ai.structuredContent);
  const waiting = (await tool(actors[0], 'kingdown_create', { mode: 'friend' })).structuredContent;
  const invite = (await tool(actors[0], 'kingdown_invite', { matchId: waiting.matchId })).structuredContent;
  const joined = (await tool(actors[1], 'kingdown_join', { token: invite.token })).structuredContent;
  assert.equal(joined.playerColor, 1); assert.equal(joined.waiting, false);
  const resource = await rpc(actors[0], 'resources/read', { uri: 'ui://kingdown/board-v1.html' });
  assert(resource.result.contents[0].text.includes('<html')); assert(resource.bytes < 4_400_000);
  await assert.rejects(configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: 'https://plugin.example', KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', KINGDOWN_PLUGIN_OAUTH_READY: '0' }), /Enable Supabase OAuth/);
  await assert.rejects(configurePlugin({ NODE_ENV: 'production', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString }, { localDev: true }), /Local personas/);
  console.log(`Compiled HTTP + real PostgreSQL: open, move, AI, retry, foreign seat rejection, service restart/resume, friend invitation/join, resource (${resource.bytes} JSON bytes), and production auth gate passed`);
} finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  await app?.pool.end();
  for (const actor of actors) await pool.query('delete from auth.users where id=$1', [actor]);
  await pool.end();
  await rm(artifact, { recursive: true, force: true });
}
