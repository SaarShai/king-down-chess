/** Named plugin checks own their temporary build, loopback servers and test identities. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { register } from 'tsx/esm/api';
import { testDatabase } from './plugin-db-config.mjs';
import { buildPluginServer } from './plugin-server-build.mjs';

const mode = process.argv[2];
assert(['oauth', 'fixture', 'http', 'privacy', 'preview'].includes(mode), 'Choose oauth, fixture, http, privacy or preview');
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (mode === 'oauth' || mode === 'http' || mode === 'privacy') testDatabase(connectionString);
const work = await mkdtemp(join(tmpdir(), 'kingdown-plugin-check-'));
const build = join(work, 'server');
const actors = [randomUUID(), randomUUID(), randomUUID()];
let child, harness, server, app, pool, cleaning, unregister;
function cleanup() {
  return cleaning ??= (async () => {
    const failures = [];
    for (const finish of [
      async () => { if (child && child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); } },
      () => harness?.close(),
      async () => { if (server) { server.closeAllConnections(); await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); } },
      () => app?.pool.end(),
      () => pool?.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [actors]),
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
    let endpoint, seedPosition, deleteMatch;
    if (mode === 'http' || mode === 'privacy') {
      pool = new pg.Pool({ connectionString, max: 1 });
      await pool.query('insert into auth.users(id) select unnest($1::uuid[])', [actors]);
      server = createServer((req, res) => { void app.handler(req, res).catch(() => { res.destroy(); }); });
      server.listen(0, '127.0.0.1'); await once(server, 'listening');
      const origin = `http://127.0.0.1:${server.address().port}`;
      const { configurePlugin } = await import(pathToFileURL(join(build, 'server.mjs')).href);
      app = await configurePlugin({ ...process.env, NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, KINGDOWN_INTERNAL_SECRET: randomUUID() }, { localDev: true });
      endpoint = new URL('/mcp', origin);
      const {createMatch} = await import(pathToFileURL(join(build,'runtime/index.mjs')).href);
      seedPosition = async (setup,black) => {
        const match=await createMatch(setup), id=randomUUID();
        // A started game at revision 0: solo with the actor as White, or a friend game with the actor as Black.
        try {
          const snapshot=await match.snapshot(), state=await match.exportSave();
          await pool.query(`insert into public.games(id,kind,speed,category,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,started_at)
            values($1,$2,'live','check','white',$3,$4,$5,'playing',$6,0,$7,$8,$9,now())`,[id,black?'friend':'solo',JSON.parse(state).engine,setup,snapshot.rules,snapshot.turn,state,snapshot,actors[black?1:0]]);
          await pool.query(`insert into public.game_players(game_id,seat,user_id,computer,action) values($1,0,$2,$3,$4),($1,1,$5,$6,$7)`,
            [id,actors[black?1:0],false,snapshot.turn===0?'ready':'waiting',black?actors[0]:null,!black,snapshot.turn===1?'ready':'waiting']);
          return id;
        } finally {await match.close();}
      };
      deleteMatch = async id => { await pool.query('delete from public.games g where id=$1 and exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($2::uuid[]))',[id,actors]); };

    }
    unregister = register();
    const { startHarness } = await import('./plugin-ui-harness.ts');
    // The fixture plays the built runtime: its games then carry the built page's engine, as on the hosted service.
    const engine = endpoint ? undefined : await import(pathToFileURL(join(build, 'runtime/index.mjs')).href);
    harness = await startHarness({ boardPath: join(build, 'board.html'), endpoint, actor: actors[0], friendActor: actors[1], laterFriendActor: actors[2], seedPosition, deleteMatch, engine });
  }
  if (mode === 'preview') {
    const items = process.argv[3] ? [process.argv[3]] : JSON.parse(readFileSync('docs/specs/gui-previews-2026-10-19/capture.json', 'utf8')).items;
    for (const entry of items) {
      const [item, phase = 'after'] = entry.split('-');
      child = spawn('bash', ['tools/test-lock.sh', process.execPath, 'docs/specs/gui-previews-2026-10-19/capture.mjs', build, item, phase], { stdio: 'inherit', env: process.env });
      const [previewCode] = await once(child, 'exit');
      assert.equal(previewCode, 0, 'Board preview checks pass');
    }
  }
  if (mode !== 'preview') {
  child = spawn(process.execPath, [mode === 'oauth' ? 'tools/plugin-oauth-check.mjs' : mode === 'privacy' ? 'tools/plugin-privacy-check.mjs' : 'tools/plugin-ui-check.mjs', build], {
    stdio: 'inherit', env: { ...process.env, ...(harness ? { PLAYABLE_URL: harness.url, PLUGIN_EXPECT_MODE: mode } : {}) },
  });
  const [code, signal] = await once(child, 'exit');
  assert.equal(code, 0, `Plugin ${mode} check failed${signal ? ` (${signal})` : ''}`);

  }
} finally { await cleanup(); }
