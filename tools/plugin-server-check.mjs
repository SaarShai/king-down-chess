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
  const ca = new X509Certificate(await readFile(resolve(artifact, 'supabase-ca.crt')));
  assert.equal(ca.fingerprint256.replaceAll(':', ''), '807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA');
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
  assert(!open.isError); const initial = open._meta.view;
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
  const restarted = await configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString }, { localDev: true });
  await app.pool.end(); app = restarted;
  assert.deepEqual((await tool(actors[0], 'kingdown_resume', {})).structuredContent, ai.structuredContent);
  const waiting = (await tool(actors[0], 'kingdown_create', { mode: 'friend', colour: 'white' })).structuredContent;
  const invite = (await tool(actors[0], 'kingdown_invite', { game_id: waiting.game_id })).structuredContent;
  assert.match(invite.link, new RegExp(`^${origin}/j/[A-Za-z0-9_-]{43}$`));
  const joined = (await tool(actors[1], 'kingdown_join', { invitation: invite.link })).structuredContent;
  assert.equal(joined.colour, 'black'); assert.equal(joined.status, 'playing');
  const recoveryBoard = (await tool(actors[1], 'kingdown_open', {game_id:waiting.game_id})).structuredContent;
  await pool.query('delete from public.games where id=$1',[waiting.game_id]);
  assert.equal((await tool(actors[1], 'kingdown_get', {game_id:waiting.game_id,board_id:recoveryBoard.board_id}))._meta.code, 'MATCH_REMOVED');
  const recovered = await tool(actors[1], 'kingdown_create', {mode:'solo',board_id:recoveryBoard.board_id});
  assert(!recovered.isError); assert.equal(recovered.structuredContent.board_id,recoveryBoard.board_id);
  assert.equal((await tool(actors[1], 'kingdown_get', {game_id:waiting.game_id,board_id:recoveryBoard.board_id})).structuredContent.game_id,recovered.structuredContent.game_id);
  assert.equal((await tool(actors[0], 'kingdown_create', {mode:'solo',board_id:recoveryBoard.board_id}))._meta.code,'FORBIDDEN');
  const tools = (await rpc(actors[0], 'tools/list', {})).result.tools;
  const uri = tools.find(tool => tool.name === 'kingdown_open')._meta.ui.resourceUri;
  assert.match(uri, /^ui:\/\/kingdown\/board-[a-f0-9]{64}\.html$/);
  const resource = await rpc(actors[0], 'resources/read', { uri });
  assert(resource.result.contents[0].text.includes('<html')); assert(resource.bytes < 1_000_000);
  // The page names each art file on this origin; a cross-origin page may read it into a canvas, and a new build gets new names.
  const art = [...new Set(resource.result.contents[0].text.match(new RegExp(`${origin}/plugin-art/[\\w-]+\\.(?:webp|png|svg|woff2)`, 'g')))];
  const counts = Object.fromEntries(['webp', 'png', 'svg', 'woff2'].map(type => [type, art.filter(file => file.endsWith(`.${type}`)).length]));
  assert(counts.webp >= 20); assert.equal(counts.png, 1); assert.equal(counts.svg, 24); assert.equal(counts.woff2, 4);
  for (const file of art) {
    const response = await fetch(file, { headers: { Origin: 'null' } });
    assert.equal(response.status, 200, file); assert.equal(response.headers.get('content-type'), { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2' }[file.split('.').at(-1)]); assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(response.headers.get('cache-control'), /max-age=31536000.*immutable/); assert((await response.arrayBuffer()).byteLength > 0);
  }
  assert.equal((await fetch(`${origin}/plugin-art/missing.webp`)).status, 404); assert.equal((await fetch(`${origin}/plugin-art/..%2fserver.mjs`)).status, 404);
  await assert.rejects(configurePlugin({ KINGDOWN_PLUGIN_ORIGIN: 'https://plugin.example', KINGDOWN_PLUGIN_DATABASE_URL: connectionString, SUPABASE_URL: 'https://project.supabase.co', KINGDOWN_PLUGIN_OAUTH_READY: '0' }), /Enable Supabase OAuth/);
  await assert.rejects(configurePlugin({ NODE_ENV: 'production', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString }, { localDev: true }), /Local personas/);
  console.log(`Compiled HTTP + real PostgreSQL: open, move, AI, retry, foreign seat rejection, service restart/resume, friend invitation link/join, board recovery, resource (${resource.bytes} JSON bytes), ${art.length} art files (${JSON.stringify(counts)}), and production auth gate passed`);
} finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  await app?.pool.end();
  await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [actors]);
  for (const actor of actors) await pool.query('delete from auth.users where id=$1', [actor]);
  await pool.end();
  await rm(artifact, { recursive: true, force: true });
}
