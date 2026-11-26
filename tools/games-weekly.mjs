/** The weekly count of games. Read-only.
 *  Command: tools/release/live.sh games (it loads the engine-check login; this file never prints the database address).
 *  It counts friend and random games of signed-in players, and connector games against the computer (kind "solo").
 *  It cannot count web and iOS games against the computer: they run on the device and leave no server row.
 *  Test-account games are in the count: no column marks a test account.
 *  Directly: KINGDOWN_ENGINES_DATABASE_URL=... node tools/games-weekly.mjs. The query is in supabase/ops/weekly-games.sql.
 *  A game deleted with its account, or a Muse game deleted after a disconnect, is not in the count. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { pluginDatabaseConfig } from './plugin-db-config.mjs';

const sql = readFileSync(new URL('../supabase/ops/weekly-games.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '');
/** The select of supabase/ops/weekly-games.sql, without its transaction lines. */
export const WEEKLY_GAMES_QUERY = /\bselect\b[^;]*/i.exec(sql)[0].trim();

const KINDS = { friend: 'friend', random: 'random', solo: 'computer (connector)' };

/** Read the rows in one read-only snapshot. The rollback runs also after a failed query. */
export async function weeklyGames(client) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try { return (await client.query(WEEKLY_GAMES_QUERY)).rows; }
  finally { await client.query('ROLLBACK'); }
}

/** A plain table: one line for each week and kind, then the total. */
export function formatWeeklyGames(rows) {
  if (!rows.length) return 'No game started in the last 12 weeks.';
  const line = (week, kind, started, finished) => `${week.padEnd(10)}  ${kind.padEnd(20)}  ${String(started).padStart(7)}  ${String(finished).padStart(8)}`;
  let started = 0, finished = 0;
  const body = rows.map(row => {
    started += Number(row.started); finished += Number(row.finished);
    return line(row.week_utc, KINDS[row.kind] ?? row.kind, Number(row.started), Number(row.finished));
  });
  return [line('week (UTC)', 'kind', 'started', 'finished'), ...body, line('total', '', started, finished)].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let client;
  try {
    // The URL stays in the environment. No output or error prints it.
    if (!process.env.KINGDOWN_ENGINES_DATABASE_URL) throw new Error();
    const db = new URL(process.env.KINGDOWN_ENGINES_DATABASE_URL);
    client = new pg.Client({ ...pluginDatabaseConfig(db, { localDev: ['localhost', '127.0.0.1', '[::1]'].includes(db.hostname) }), connectionTimeoutMillis: 10000 });
    await client.connect();
    console.log(formatWeeklyGames(await weeklyGames(client)));
  } catch {
    console.error('games-weekly: FAIL; cannot read the weekly count; check KINGDOWN_ENGINES_DATABASE_URL and the access to public.games');
    process.exitCode = 1;
  } finally { if (client) await client.end().catch(() => {}); }
}
