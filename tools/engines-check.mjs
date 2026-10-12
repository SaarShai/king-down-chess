/** Fail when an unfinished game uses an engine that the archive lacks (G2). Read-only.
 *  KINGDOWN_ENGINES_DATABASE_URL=... node tools/engines-check.mjs [engines folder, default engines/] */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { pluginDatabaseConfig } from './plugin-db-config.mjs';

/** Each engine fingerprint of unfinished games, with its game count. The names are unqualified, so a
 *  test can point search_path at temporary tables; the `games` table of the multiplayer schema wins. */
export async function enginesInUse(client) {
  const { rows: [{ games }] } = await client.query("select to_regclass('games') is not null as games");
  return (await client.query(games
    ? "select engine_fingerprint as engine, count(*)::int as games from games where status not in ('finished','aborted','annulled') and not (status in ('waiting','setup') and engine_fingerprint is null) group by 1 order by 1"
    : "select save::jsonb->>'engine' as engine, count(*)::int as games from plugin_matches where snapshot->>'status' = 'playing' group by 1 order by 1")).rows;
}
/** The rows whose engine has no `<hex>.mjs` bundle in `dir`. */
export function missingEngines(rows, dir) {
  return rows.filter(({ engine }) => {
    const hex = /^(?:sha256:)?([a-f0-9]{64})$/.exec(engine ?? '')?.[1];
    return !hex || !existsSync(resolve(dir, `${hex}.mjs`));
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) throw new Error('Usage: node tools/engines-check.mjs [engines folder]');
  const dir = resolve(process.argv[2] ?? fileURLToPath(new URL('../engines/', import.meta.url)));
  // The URL comes from the environment, so its password never shows in a process list.
  if (!process.env.KINGDOWN_ENGINES_DATABASE_URL) throw new Error('Set KINGDOWN_ENGINES_DATABASE_URL to the database of the live games');
  const db = new URL(process.env.KINGDOWN_ENGINES_DATABASE_URL);
  const client = new pg.Client({ ...pluginDatabaseConfig(db, { localDev: ['localhost', '127.0.0.1', '[::1]'].includes(db.hostname) }), connectionTimeoutMillis: 10000 });
  await client.connect();
  let rows;
  try { await client.query('begin read only'); rows = await enginesInUse(client); }
  finally { await client.query('rollback').catch(() => {}); await client.end(); }
  const missing = missingEngines(rows, dir);
  for (const row of rows) console.log(`${missing.includes(row) ? 'MISSING ' : 'archived'} ${row.engine} (${row.games} unfinished)`);
  if (missing.length) { console.error(`engines-check: ${missing.length} engine(s) in use have no bundle in ${dir}`); process.exitCode = 1; }
  else console.log(`engines-check: every engine in use (${rows.length}) has its bundle`);
}
