import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { join } from 'node:path';
import pg from 'pg';
import { machineLeaseStdio } from '../lib/lock.mjs';
import { testDatabase } from '../plugin-db-config.mjs';

export async function checkHttpParts(connectionString) {
  const connection = new pg.Client({ connectionString: testDatabase(connectionString) });
  const name = `kingdown_ci_${randomUUID().replaceAll('-', '')}_test`;
  const second = new URL(connectionString);
  second.pathname = `/${name}`;
  let created = false;
  try {
    await connection.connect();
    // Each part needs its own lobby and saved games.
    await connection.query(`create database "${name}"`);
    created = true;
    const results = await Promise.allSettled([['opening', connectionString], ['board', second.href]].map(async ([part, database]) => {
      const child = spawn(process.execPath, ['tools/plugin-browser-check.mjs', 'http'], {
        stdio: machineLeaseStdio(['inherit', 'inherit', 'inherit']),
        env: {
          ...process.env,
          KINGDOWN_PLUGIN_UI_PART: part,
          PLUGIN_TEST_DATABASE_URL: testDatabase(database),
          ...(process.env.PLAYABLE_OUT ? { PLAYABLE_OUT: join(process.env.PLAYABLE_OUT, part) } : {}),
        },
      });
      const [code, signal] = await once(child, 'exit');
      if (code !== 0) throw new Error(`Compiled HTTP widget ${part} failed (${signal ?? code})`);
    }));
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'Compiled HTTP widget check failed');
  } finally {
    try {
      if (created) await connection.query(`drop database "${name}"`);
    } finally {
      await connection.end();
    }
  }
}
