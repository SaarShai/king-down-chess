/** Check the engines of unfinished games against the exact runtime bundles. Read-only.
 *  KINGDOWN_ENGINES_DATABASE_URL=... node tools/engines-check.mjs [--production] [engines folder, default engines/]
 *  --production refuses a database that is not the production project (the publish gate). Without it a local test database works. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { pluginDatabaseConfig } from './plugin-db-config.mjs';
import { productionDatabase } from './staging-config.mjs';

const engineHex = engine => typeof engine === 'string' && /^sha256:([a-f0-9]{64})$/.exec(engine)?.[1];
const engineRows = counts => [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([engine, games]) => ({ engine, games }));

/** Count bad states without putting saves or game identifiers in the report. */
export function summarizeEngines(table, rows) {
  const counts = new Map();
  const report = { table, present: true, unfinished: rows.length, emptySetup: 0, pendingSetup: 0, initialized: 0, malformedState: 0, malformedEngine: 0, agreement: 0, mismatch: 0 };
  for (const row of rows) {
    if (table === 'games' && ['waiting', 'setup'].includes(row.status) && row.state === null && row.engine === null) {
      report.emptySetup++;
      continue;
    }
    if (table === 'games' && ['waiting', 'setup'].includes(row.status) && row.state === null && engineHex(row.engine) &&
      row.admission && Array.isArray(row.admission.kings) && ['arrangement', 'bishopsOpposite', 'guardAdjacent'].every(key => typeof row.admission[key] === 'boolean')) {
      report.pendingSetup++;
      counts.set(row.engine, (counts.get(row.engine) ?? 0) + 1);
      continue;
    }
    report.initialized++;
    let state;
    try {
      state = JSON.parse(row.state);
      if (!state || typeof state !== 'object' || Array.isArray(state) || state.schema !== 'kingdown-local-match/1') throw new Error();
      if (['engine', 'setup', 'initialFen', 'rules', 'revision', 'commands'].some(key => !Object.hasOwn(state, key))
        || !Number.isInteger(state.revision) || state.revision < 0 || !Array.isArray(state.commands) || state.commands.length !== state.revision) throw new Error();
    } catch { report.malformedState++; }
    const engine = state?.engine;
    if (!engineHex(engine) || (table === 'games' && !engineHex(row.engine))) report.malformedEngine++;
    if (table === 'games') {
      if (engineHex(engine) && engineHex(row.engine) && engine === row.engine) report.agreement++;
      else report.mismatch++;
    }
    for (const stamp of new Set([engine, ...(table === 'games' ? [row.engine] : [])])) {
      if (engineHex(stamp)) counts.set(stamp, (counts.get(stamp) ?? 0) + 1);
    }
  }
  return { ...report, engines: engineRows(counts) };
}

/** Read each existing table in one snapshot. A failed table read stops the report. */
export async function enginesInUse(client) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    const { rows: [identity] } = await client.query('select current_database() as database, current_schema() as schema, transaction_timestamp() as time');
    const tables = [];
    for (const table of ['games', 'plugin_matches']) {
      const { rows: [relation] } = await client.query('select n.nspname as schema from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.oid = to_regclass($1)', [table]);
      if (!relation) { tables.push({ table, present: false }); continue; }
      let rows;
      try {
        ({ rows } = await client.query(table === 'games'
          ? "select engine_fingerprint as engine, state, status, setup_admission as admission from games where status not in ('finished','aborted','annulled')"
          : "select save as state from plugin_matches where snapshot->>'status' = 'playing'"));
      } catch (error) { throw new Error(`Cannot read ${table} (SQLSTATE ${error.code ?? 'unknown'})`); }
      tables.push({ ...summarizeEngines(table, rows), schema: relation.schema, loaded: table === 'games' || !tables[0].present });
    }
    // Migration 0006 ended the old plugin games: once games exists, no build loads plugin_matches.
    // Their stamps stay in that table's report; only the loaded table's stamps need bundles.
    const counts = new Map();
    for (const table of tables) if (table.loaded) for (const { engine, games } of table.engines) counts.set(engine, (counts.get(engine) ?? 0) + games);
    return { ...identity, time: new Date(identity.time).toISOString(), tables, engines: engineRows(counts) };
  } finally { await client.query('ROLLBACK'); }
}

/** The rows whose engine has no `<hex>.mjs` bundle in `dir`. */
export function missingEngines(rows, dir) {
  return rows.filter(({ engine }) => !engineHex(engine) || !existsSync(resolve(dir, `${engineHex(engine)}.mjs`)));
}

/** Hash the bytes that the supplied runtime loads, including source-stamp aliases. */
export function checkRuntime(report, dir) {
  const runtimeFolder = realpathSync(dir);
  const missing = missingEngines(report.engines, runtimeFolder);
  const bundles = report.engines.map(row => ({ ...row, file: engineHex(row.engine) ? `${engineHex(row.engine)}.mjs` : null,
    sha256: missing.includes(row) ? null : createHash('sha256').update(readFileSync(resolve(runtimeFolder, `${engineHex(row.engine)}.mjs`))).digest('hex') }));
  const ok = report.tables.some(table => table.present) && !missing.length &&
    report.tables.every(table => !table.present || !(table.emptySetup || table.malformedState || table.malformedEngine || table.mismatch));
  return { ...report, runtimeFolder, bundles, missingEngines: missing.length, ok };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let client;
  try {
    const args = process.argv.slice(2);
    const production = args[0] === '--production';
    if (production) args.shift();
    if (args.length > 1) throw new Error('Usage: node tools/engines-check.mjs [--production] [engines folder]');
    const dir = resolve(args[0] ?? fileURLToPath(new URL('../engines/', import.meta.url)));
    // The URL stays in the environment. No report or error prints it.
    if (!process.env.KINGDOWN_ENGINES_DATABASE_URL) throw new Error('Set KINGDOWN_ENGINES_DATABASE_URL to the database of the live games');
    const db = new URL(process.env.KINGDOWN_ENGINES_DATABASE_URL);
    if (production) {
      try { productionDatabase(db, process.env); } catch (error) { console.error(`engines-check: FAIL; ${error.message}; refused before any connection`); process.exit(2); }
    }
    client = new pg.Client({ ...pluginDatabaseConfig(db, { localDev: ['localhost', '127.0.0.1', '[::1]'].includes(db.hostname) }), connectionTimeoutMillis: 10000 });
    await client.connect();
    const report = checkRuntime(await enginesInUse(client), dir);
    console.log(JSON.stringify(report, null, 2));
    console.log(`engines-check: ${report.ok ? 'pass' : 'FAIL'}; ${report.engines.length} engine(s) in use, ${report.missingEngines} missing bundle(s)`);
    if (!report.ok) process.exitCode = 1;
  } catch {
    console.error('engines-check: FAIL; cannot complete the read-only database and runtime report; check the setting, table access and runtime files');
    process.exitCode = 1;
  } finally { if (client) await client.end(); }
}
