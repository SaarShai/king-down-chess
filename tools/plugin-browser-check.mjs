/** Named plugin checks own their temporary build, loopback servers and test identities. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { register } from 'tsx/esm/api';
import { buildPluginServer } from './plugin-server-build.mjs';

const mode = process.argv[2];
assert(['oauth', 'fixture', 'http'].includes(mode), 'Choose oauth, fixture or http');
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (mode !== 'fixture') {
  assert(connectionString, 'Set PLUGIN_TEST_DATABASE_URL to a disposable loopback database');
  const db = new URL(connectionString);
  assert(['postgres:', 'postgresql:'].includes(db.protocol) && ['127.0.0.1', 'localhost', '[::1]'].includes(db.hostname) && db.pathname.endsWith('_test'), 'Plugin checks require a disposable loopback database ending in _test');
}
const work = await mkdtemp(join(tmpdir(), 'kingdown-plugin-check-'));
const build = join(work, 'server');
const actors = [randomUUID(), randomUUID()];
let child, harness, server, app, pool, cleaning, unregister;
function cleanup() {
  return cleaning ??= (async () => {
    const failures = [];
    for (const finish of [
      async () => { if (child && child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); } },
      () => harness?.close(),
      async () => { if (server) { server.closeAllConnections(); await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); } },
      () => app?.pool.end(),
      () => pool?.query('delete from auth.users where id=any($1::uuid[])', [actors]),
      () => pool?.end(),
      () => unregister?.(),
      () => rm(work, { recursive: true, force: true }),
    ]) { try { await finish(); } catch (error) { failures.push(error); } }
    if (failures.length) throw new AggregateError(failures, 'Plugin check cleanup failed');
  })();
}
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.once(signal, () => { void cleanup().finally(() => process.exit(code)); });
}
try {
  await buildPluginServer(build);
  // Vite sets NODE_ENV during the build; the servers below are local test processes.
  process.env.NODE_ENV = 'test';
  if (mode !== 'oauth') {
    let endpoint;
    if (mode === 'http') {
      pool = new pg.Pool({ connectionString, max: 1 });
      await pool.query('insert into auth.users(id) select unnest($1::uuid[])', [actors]);
      server = createServer((req, res) => { void app.handler(req, res).catch(() => { res.destroy(); }); });
      server.listen(0, '127.0.0.1'); await once(server, 'listening');
      const origin = `http://127.0.0.1:${server.address().port}`;
      const { configurePlugin } = await import(pathToFileURL(join(build, 'server.mjs')).href);
      app = await configurePlugin({ ...process.env, NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString }, { localDev: true });
      endpoint = new URL('/mcp', origin);
    }
    unregister = register();
    const { startHarness } = await import('./plugin-ui-harness.ts');
    harness = await startHarness({ boardPath: join(build, 'board.html'), endpoint, actor: actors[0], friendActor: actors[1] });
  }
  child = spawn(process.execPath, [mode === 'oauth' ? 'tools/plugin-oauth-check.mjs' : 'tools/plugin-ui-check.mjs', build], {
    stdio: 'inherit', env: { ...process.env, ...(harness ? { PLAYABLE_URL: harness.url, PLUGIN_EXPECT_MODE: mode } : {}) },
  });
  const [code, signal] = await once(child, 'exit');
  assert.equal(code, 0, `Plugin ${mode} check failed${signal ? ` (${signal})` : ''}`);
} finally { await cleanup(); }
