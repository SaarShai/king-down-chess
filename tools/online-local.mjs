/**
 * Manages the local online test stack (`npm run online:local`, `:stop`, `:reset`):
 * private PostgreSQL 17 cluster, test account seed, loopback Auth stand-in,
 * real API server, and local Vite dev page on loopback ports.
 */
import { execFileSync, spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { readLocalAccounts } from './online-local-auth.mjs';
import { testDatabase } from './plugin-db-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_DIR = join(ROOT, '.local-online');
const PG_DATA = join(BASE_DIR, 'pg');
const LOG_DIR = join(BASE_DIR, 'logs');
const PIDS_PATH = join(BASE_DIR, 'pids.json');
const PG_BIN = process.env.PG_BIN || '/opt/homebrew/bin';
const DB_NAME = 'local_online_test';
const PUBLISHABLE_KEY = 'sb_publishable_local_online_test';
const INTERNAL_SECRET = 'kingdown-local-online-internal-secret-01';

function pgTool(name) {
  const path = join(PG_BIN, name);
  if (!existsSync(path)) throw new Error(`Missing PostgreSQL tool at ${path}`);
  return path;
}

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function stopPid(pid) {
  if (!isAlive(pid)) return;
  try { process.kill(pid, 'SIGTERM'); } catch { return; }
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline && isAlive(pid)) await new Promise(r => setTimeout(r, 100));
  if (isAlive(pid)) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* exited */ }
  }
}

async function reservePorts(count) {
  const servers = [];
  const ports = [];
  try {
    for (let i = 0; i < count; i++) {
      const server = createServer();
      await new Promise((resolvePort, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolvePort);
      });
      servers.push(server);
      ports.push(server.address().port);
    }
  } finally {
    await Promise.all(servers.map(server => new Promise(done => server.close(done))));
  }
  return ports;
}

function readPostmasterPid(dataDir = PG_DATA) {
  const path = join(dataDir, 'postmaster.pid');
  if (!existsSync(path)) return null;
  const line = readFileSync(path, 'utf8').split('\n')[0]?.trim();
  const pid = Number(line);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function stopPostgres(dataDir = PG_DATA, knownPid = null) {
  const pid = knownPid ?? readPostmasterPid(dataDir);
  if (existsSync(join(dataDir, 'postmaster.pid'))) {
    try {
      execFileSync(pgTool('pg_ctl'), ['-D', dataDir, 'stop', '-m', 'fast'], { stdio: 'pipe' });
      return;
    } catch { /* fall through to exact PID check */ }
  }
  if (pid && isAlive(pid)) return stopPid(pid);
}

function spawnDaemon(cmd, args, env, logFile) {
  const fd = openSync(logFile, 'a');
  try {
    const child = spawn(cmd, args, { cwd: ROOT, env, detached: true, stdio: ['ignore', fd, fd] });
    child.unref();
    return child;
  } finally {
    closeSync(fd);
  }
}

function probeHttp(url, headers = {}) {
  const target = new URL(url);
  return new Promise((resolveProbe, rejectProbe) => {
    const req = httpRequest({
      hostname: target.hostname,
      port: Number(target.port || 80),
      path: target.pathname + target.search,
      method: 'GET',
      headers,
      timeout: 2000,
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolveProbe({ status: res.statusCode ?? 0, body }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', rejectProbe);
    req.end();
  });
}

async function waitForHttp(url, { pid, logFile, check, headers = {}, timeoutMs = 15000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    if (pid && !isAlive(pid)) {
      const tail = logFile && existsSync(logFile) ? readFileSync(logFile, 'utf8').split('\n').slice(-20).join('\n') : '';
      throw new Error(`Process ${pid} exited before ${url} was ready.${tail ? `\n${tail}` : ''}`);
    }
    try {
      const res = await probeHttp(url, headers);
      if (!check || await check(res)) return;
      lastError = new Error(`Unexpected status ${res.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  const tail = logFile && existsSync(logFile) ? readFileSync(logFile, 'utf8').split('\n').slice(-20).join('\n') : '';
  throw new Error(`Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}${tail ? `\n${tail}` : ''}`);
}

async function seedDatabase(dbUrl) {
  testDatabase(dbUrl);
  const accounts = readLocalAccounts();
  const pool = new pg.Pool({ connectionString: dbUrl, max: 2, ssl: false });
  try {
    await pool.query(
      `insert into public.web_account_access (singleton, enabled)
       values (true, true)
       on conflict (singleton) do update set enabled = true`,
    );
    for (const account of accounts) {
      await pool.query(
        `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, banned_until)
         values ($1, $2, $3::jsonb, $4::jsonb, null)
         on conflict (id) do update
           set email = excluded.email,
               raw_user_meta_data = excluded.raw_user_meta_data,
               raw_app_meta_data = excluded.raw_app_meta_data,
               banned_until = null`,
        [account.id, account.email, JSON.stringify(account.raw_user_meta_data ?? {}), JSON.stringify({ provider: account.provider, providers: [account.provider] })],
      );
      await pool.query(
        `insert into public.profiles (id, handle)
         values ($1, $2)
         on conflict (id) do update set handle = excluded.handle`,
        [account.id, account.handle],
      );
    }
  } finally {
    await pool.end();
  }
  return accounts;
}

export async function stopLocalStack() {
  let state = null;
  if (existsSync(PIDS_PATH)) {
    try { state = JSON.parse(readFileSync(PIDS_PATH, 'utf8')); } catch { state = null; }
  }
  if (state) {
    await stopPid(state.pagePid);
    await stopPid(state.apiPid);
    await stopPid(state.authPid);
    await stopPostgres(state.pgData || PG_DATA, state.pgPid);
    rmSync(PIDS_PATH, { force: true });
    console.log('Local online stack stopped.');
    return;
  }
  const pgPid = readPostmasterPid(PG_DATA);
  if (pgPid && isAlive(pgPid)) {
    await stopPostgres(PG_DATA, pgPid);
    console.log('Stopped PostgreSQL cluster.');
    return;
  }
  console.log('Local online stack is not running.');
}

export async function resetLocalStack() {
  await stopLocalStack();
  for (const dir of [PG_DATA, LOG_DIR]) rmSync(dir, { recursive: true, force: true });
  rmSync(PIDS_PATH, { force: true });
  console.log('Local online data removed.');
}

export async function startLocalStack() {
  if (existsSync(PIDS_PATH)) {
    let prev = null;
    try { prev = JSON.parse(readFileSync(PIDS_PATH, 'utf8')); } catch { /* discard corrupt state */ }
    if (prev && [prev.pagePid, prev.apiPid, prev.authPid, prev.pgPid].some(isAlive)) {
      throw new Error(`Local online stack is already running at ${prev.pageUrl}/next.html. Run "npm run online:local:stop" first.`);
    }
    rmSync(PIDS_PATH, { force: true });
  }

  mkdirSync(BASE_DIR, { recursive: true });
  mkdirSync(LOG_DIR, { recursive: true });

  const [pgPort, authPort, apiPort, pagePort] = await reservePorts(4);
  const authUrl = `http://127.0.0.1:${authPort}`;
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const pageUrl = `http://127.0.0.1:${pagePort}`;
  const adminDbUrl = `postgresql://postgres@127.0.0.1:${pgPort}/postgres`;
  const dbUrl = `postgresql://postgres@127.0.0.1:${pgPort}/${DB_NAME}`;
  testDatabase(dbUrl);

  const startedPids = [];
  let pgStarted = false;

  try {
    const childEnv = { ...process.env };
    delete childEnv.VITE_KINGDOWN_STAGE;
    const pgEnv = { ...childEnv, LC_ALL: 'C', LANG: 'C' };
    if (!existsSync(join(PG_DATA, 'PG_VERSION'))) {
      execFileSync(pgTool('initdb'), ['-D', PG_DATA, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--locale=C'], { env: pgEnv, stdio: 'pipe' });
    }
    writeFileSync(
      join(PG_DATA, 'postgresql.auto.conf'),
      `listen_addresses = '127.0.0.1'\nport = ${pgPort}\nunix_socket_directories = ''\n`,
    );
    try {
      execFileSync(pgTool('pg_ctl'), [
        '-D', PG_DATA,
        '-l', join(LOG_DIR, 'pg.log'),
        'start',
      ], { env: pgEnv, stdio: 'pipe' });
    } catch (error) {
      const log = join(LOG_DIR, 'pg.log');
      const tail = existsSync(log) ? readFileSync(log, 'utf8').split('\n').slice(-20).join('\n') : '';
      throw new Error(`pg_ctl start failed: ${error instanceof Error ? error.message : String(error)}${tail ? `\n${tail}` : ''}`);
    }
    pgStarted = true;
    const pgPid = readPostmasterPid(PG_DATA);

    const adminPool = new pg.Pool({ connectionString: adminDbUrl, max: 1, ssl: false });
    try {
      const exists = await adminPool.query('select 1 from pg_database where datname = $1', [DB_NAME]);
      if (exists.rowCount === 0) await adminPool.query(`create database ${DB_NAME}`);
    } finally {
      await adminPool.end();
    }

    execFileSync(process.execPath, [join(ROOT, 'tools/plugin-db/bootstrap-test.mjs')], {
      cwd: ROOT,
      env: { ...childEnv, PLUGIN_TEST_DATABASE_URL: dbUrl },
      stdio: 'pipe',
    });

    const accounts = await seedDatabase(dbUrl);

    const authChild = spawnDaemon(
      process.execPath,
      [join(ROOT, 'tools/online-local-auth.mjs')],
      {
        ...childEnv,
        NODE_ENV: 'development',
        PLUGIN_TEST_DATABASE_URL: dbUrl,
        LOCAL_AUTH_ORIGIN: authUrl,
        KINGDOWN_PLUGIN_ORIGIN: pageUrl,
      },
      join(LOG_DIR, 'auth.log'),
    );
    startedPids.push(authChild.pid);
    await waitForHttp(`${authUrl}/auth/v1/settings`, { pid: authChild.pid, logFile: join(LOG_DIR, 'auth.log'), check: res => res.status === 200 });

    const apiChild = spawnDaemon(
      process.execPath,
      ['--import', 'tsx', join(ROOT, 'tools/plugin-server.mjs'), '--local-dev'],
      {
        ...childEnv,
        NODE_ENV: 'development',
        PORT: String(apiPort),
        KINGDOWN_LOCAL_ONLINE: '1',
        KINGDOWN_PLUGIN_ORIGIN: pageUrl,
        KINGDOWN_PLUGIN_DATABASE_URL: dbUrl,
        SUPABASE_URL: authUrl,
        SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
        KINGDOWN_INTERNAL_SECRET: INTERNAL_SECRET,
      },
      join(LOG_DIR, 'api.log'),
    );
    startedPids.push(apiChild.pid);
    await waitForHttp(`${apiUrl}/api/status`, {
      pid: apiChild.pid,
      logFile: join(LOG_DIR, 'api.log'),
      headers: { Host: `127.0.0.1:${pagePort}` },
      check: res => res.status === 200 && JSON.parse(res.body).account_access === 'open',
    });

    const viteBin = join(ROOT, 'node_modules/vite/bin/vite.js');
    const pageChild = spawnDaemon(
      process.execPath,
      [viteBin, '--host', '127.0.0.1', '--port', String(pagePort), '--strictPort'],
      {
        ...childEnv,
        NODE_ENV: 'development',
        PORT: String(pagePort),
        KINGDOWN_LOCAL_ONLINE: '1',
        KINGDOWN_LOCAL_API_ORIGIN: apiUrl,
        VITE_SUPABASE_URL: authUrl,
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
      },
      join(LOG_DIR, 'page.log'),
    );
    startedPids.push(pageChild.pid);
    await waitForHttp(`${pageUrl}/next.html`, { pid: pageChild.pid, logFile: join(LOG_DIR, 'page.log'), check: res => res.status === 200 });
    await waitForHttp(`${pageUrl}/api/status`, {
      pid: pageChild.pid,
      logFile: join(LOG_DIR, 'page.log'),
      check: res => res.status === 200 && JSON.parse(res.body).account_access === 'open',
    });

    const state = {
      pgPid,
      pgPort,
      pgData: PG_DATA,
      authPid: authChild.pid,
      authPort,
      authUrl,
      apiPid: apiChild.pid,
      apiPort,
      apiUrl,
      pagePid: pageChild.pid,
      pagePort,
      pageUrl,
      dbUrl,
    };
    writeFileSync(PIDS_PATH, JSON.stringify(state, null, 2) + '\n');

    console.log('Local online stack ready:');
    console.log(`  page: ${pageUrl}/next.html`);
    console.log(`  api:  ${apiUrl} (proxied at /api)`);
    console.log(`  auth: ${authUrl}/auth/v1`);
    console.log(`  db:   ${DB_NAME} on 127.0.0.1:${pgPort}`);
    console.log('Seeded accounts:');
    for (const account of accounts) {
      console.log(`  ${account.handle} (${account.provider}): ${pageUrl}/next.html?as=${account.handle}`);
    }
    return state;
  } catch (error) {
    for (const pid of startedPids.reverse()) await stopPid(pid);
    if (pgStarted) await stopPostgres(PG_DATA, readPostmasterPid(PG_DATA));
    rmSync(PIDS_PATH, { force: true });
    throw error;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const command = process.argv[2] || 'start';
  if (command === 'start') await startLocalStack();
  else if (command === 'stop') await stopLocalStack();
  else if (command === 'reset') await resetLocalStack();
  else throw new Error(`Unknown command: ${command}`);
}
