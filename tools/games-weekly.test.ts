// The weekly count of games (tools/games-weekly.mjs, supabase/ops/weekly-games.sql). It only reads, and it shows
// no account or game identifier.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { formatWeeklyGames, WEEKLY_GAMES_QUERY, weeklyGames } from './games-weekly.mjs';

const file = readFileSync('supabase/ops/weekly-games.sql', 'utf8');
const code = (sql: string) => sql.replace(/--.*$/gm, '');

it('runs the query of the SQL file in a read-only transaction that ends with a rollback', () => {
  const statements = code(file).split(';').map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
  expect(statements).toEqual(['begin transaction isolation level repeatable read read only', WEEKLY_GAMES_QUERY.replace(/\s+/g, ' ').trim(), 'rollback']);
});

it('only reads and selects no identifier', () => {
  for (const sql of [code(file), WEEKLY_GAMES_QUERY]) {
    expect(sql).not.toMatch(/\b(insert|update|delete|merge|truncate|drop|alter|create|grant|revoke|copy|call|do)\b/i);
    expect(sql).not.toMatch(/\b(id|user_id|game_id|created_by|handle|email|state|snapshot|moves)\b/i);
  }
  expect(WEEKLY_GAMES_QUERY).toMatch(/from public\.games\b/);
  expect(WEEKLY_GAMES_QUERY).not.toMatch(/\bjoin\b/i);
  // Whole UTC weeks: the window starts at a Monday, 11 weeks before the current week.
  expect(WEEKLY_GAMES_QUERY).toContain("date_trunc('week', now() at time zone 'UTC') - interval '11 weeks'");
});

it('opens a read-only transaction first and rolls back last, also when the query fails', async () => {
  const calls: string[] = [];
  const client = (fail: boolean) => ({ query: async (sql: string) => {
    calls.push(sql);
    if (sql === WEEKLY_GAMES_QUERY && fail) throw new Error('private-query-marker');
    return { rows: [{ week_utc: '2026-11-23', kind: 'friend', started: 2, finished: 1 }] };
  } });
  expect(await weeklyGames(client(false))).toEqual([{ week_utc: '2026-11-23', kind: 'friend', started: 2, finished: 1 }]);
  expect(calls).toEqual(['BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY', WEEKLY_GAMES_QUERY, 'ROLLBACK']);
  calls.length = 0;
  await expect(weeklyGames(client(true))).rejects.toThrow();
  expect(calls).toEqual(['BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY', WEEKLY_GAMES_QUERY, 'ROLLBACK']);
});

it('formats fixed rows as a table with a total, and names the kind of each row', () => {
  const output = formatWeeklyGames([
    { week_utc: '2026-11-23', kind: 'friend', started: 3, finished: 1 },
    { week_utc: '2026-11-23', kind: 'solo', started: 12, finished: 10 },
    { week_utc: '2026-11-16', kind: 'random', started: '4', finished: '4' },
  ]);
  expect(output.split('\n')).toEqual([
    'week (UTC)  kind                  started  finished',
    '2026-11-23  friend                      3         1',
    '2026-11-23  computer (connector)       12        10',
    '2026-11-16  random                      4         4',
    'total                                  19        15',
  ]);
  expect(formatWeeklyGames([])).toBe('No game started in the last 12 weeks.');
});

it('fails the CLI with a missing or bad setting and does not print it', () => {
  for (const env of [{}, { KINGDOWN_ENGINES_DATABASE_URL: 'postgresql://user:private-url@127.0.0.1/kingdown_test' }]) {
    const run = spawnSync(process.execPath, ['--import', './tools/fixtures/engine-report-query-error.mjs', 'tools/games-weekly.mjs'], { encoding: 'utf8', env, timeout: 20000 });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('games-weekly: FAIL');
    expect(run.stderr).not.toMatch(/private-query-marker|private-url|127\.0\.0\.1/);
    expect(run.stdout).toBe('');
  }
});

it('runs from tools/release/live.sh as the games mode, with the engine-check login', () => {
  const live = readFileSync('tools/release/live.sh', 'utf8');
  expect(live).toMatch(/^case "\$mode" in check\|engines\|games\|publish\) ;;/m);
  expect(live).toMatch(/^\s+engine_url; cd "\$repo"; node tools\/games-weekly\.mjs/m);
});
