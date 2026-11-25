// A private PostgreSQL cluster on the loopback address, for local test stacks. tools/online-local.mjs keeps one in the
// checkout; tools/check.mjs starts a throwaway one for the checks that need the test database.
// PG_BIN names the folder of the PostgreSQL programs (default /opt/homebrew/bin).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

export const PG_BIN = process.env.PG_BIN || '/opt/homebrew/bin';

export function pgTool(name) {
  const path = join(PG_BIN, name);
  if (!existsSync(path)) throw new Error(`Missing PostgreSQL tool at ${path}`);
  return path;
}

export function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

export async function stopPid(pid) {
  if (!isAlive(pid)) return;
  try { process.kill(pid, 'SIGTERM'); } catch { return; }
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline && isAlive(pid)) await new Promise(r => setTimeout(r, 100));
  if (isAlive(pid)) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* exited */ }
  }
}

export async function reservePorts(count) {
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

export function readPostmasterPid(dataDir) {
  const path = join(dataDir, 'postmaster.pid');
  if (!existsSync(path)) return null;
  const line = readFileSync(path, 'utf8').split('\n')[0]?.trim();
  const pid = Number(line);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

/** Stops the cluster with pg_ctl. When that fails, it stops the known PID (SIGTERM at once, SIGKILL after 3 s). */
export function stopPostgres(dataDir, knownPid = null) {
  const pid = knownPid ?? readPostmasterPid(dataDir);
  if (existsSync(join(dataDir, 'postmaster.pid'))) {
    try {
      execFileSync(pgTool('pg_ctl'), ['-D', dataDir, 'stop', '-m', 'fast'], { stdio: 'pipe' });
      return;
    } catch { /* fall through to exact PID check */ }
  }
  if (pid && isAlive(pid)) return stopPid(pid);
}

/** Makes a cluster in `dataDir` when it has none (user postgres, trust access), lets it listen only on 127.0.0.1:`port`
 *  with no socket file, and starts it with its log in `logFile`. Returns the server PID. */
export function startPostgres(dataDir, port, logFile, env = process.env) {
  const pgEnv = { ...env, LC_ALL: 'C', LANG: 'C' };
  if (!existsSync(join(dataDir, 'PG_VERSION'))) {
    execFileSync(pgTool('initdb'), ['-D', dataDir, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--locale=C'], { env: pgEnv, stdio: 'pipe' });
  }
  writeFileSync(join(dataDir, 'postgresql.auto.conf'), `listen_addresses = '127.0.0.1'\nport = ${port}\nunix_socket_directories = ''\n`);
  try {
    execFileSync(pgTool('pg_ctl'), ['-D', dataDir, '-l', logFile, 'start'], { env: pgEnv, stdio: 'pipe' });
  } catch (error) {
    const tail = existsSync(logFile) ? readFileSync(logFile, 'utf8').split('\n').slice(-20).join('\n') : '';
    throw new Error(`pg_ctl start failed: ${error instanceof Error ? error.message : String(error)}${tail ? `\n${tail}` : ''}`);
  }
  return readPostmasterPid(dataDir);
}
