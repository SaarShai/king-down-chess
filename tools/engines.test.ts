// The engine archive (G2): each released worker bundle in engines/ reloads its fixture game and accepts a
// move; tools/engines-check.mjs finds the engines of unfinished games that have no bundle.
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterEach, describe, expect, it } from 'vitest';
import { loadMatch, type LocalMatch } from '../src/match/index';
import { checkRuntime, enginesInUse, missingEngines, summarizeEngines } from './engines-check.mjs';
import { ENGINE_STAMP, ENGINES } from './plugin-runtime-build.mjs';

const files = readdirSync(ENGINES);
const bundles = files.filter(file => file.endsWith('.mjs')).map(file => file.slice(0, -4));
const legacyBundles = ['2675a7e6e32d635615350089a490902f4842ae26a7866d7123c6d95b49c60c5b', 'a6f9ebec5f0f2d5ff0a7b24e726e196fd27821a5133176bcfda26b70de9b75cd'];
// A tsx run (the review seed, tools/plugin-db/seed-review.ts) stamps the source-tree hash of src/match/worker.ts.
// Each alias is the compiled bundle of that same source with the source stamp in place of its own.
const sourceAliases: Record<string, string> = { e668782a46ed3661312f39a8d246c19722686054317a4c9a35da31d726dabcb6: 'bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da' };
const fixture = (hex: string) => readFileSync(join(ENGINES, `${hex}.save.json`), 'utf8');
const matches: LocalMatch[] = [];
afterEach(async () => { await Promise.all(matches.splice(0).map(m => m.close())); });

describe('engine archive', () => {
  it('holds each bundle under its own fingerprint, with one fixture save each', () => {
    expect(bundles.length).toBeGreaterThan(0);
    expect(files.filter(file => file.endsWith('.save.json')).map(file => file.slice(0, -10)).sort()).toEqual([...bundles].sort());
    for (const hex of bundles) {
      const text = readFileSync(join(ENGINES, `${hex}.mjs`), 'utf8'), base = sourceAliases[hex];
      if (base) expect(text.replace(`sha256:${hex}`, `sha256:${base}`)).toBe(readFileSync(join(ENGINES, `${base}.mjs`), 'utf8'));
      // The build hashed the bundle while it held the stamp; a changed bundle no longer matches its name.
      else expect(createHash('sha256').update(text.replace(`sha256:${hex}`, ENGINE_STAMP)).digest('hex')).toBe(hex);
      expect(JSON.parse(fixture(hex)).engine).toBe(`sha256:${hex}`);
    }
  });
  it.each(bundles)('continues the fixture game of engine %s on its archived bundle', async hex => {
    const m = await loadMatch(fixture(hex)); matches.push(m);
    const { revision, legal } = await m.snapshot();
    expect(revision).toBe(JSON.parse(fixture(hex)).revision);
    expect((await m.apply({ id: 'archive-check', expectedRevision: revision, lan: legal[0] })).revision).toBe(revision + 1);
  });
  it.each(legacyBundles)('accepts a level at the built-in strength of old engine %s', async hex => {
    const m = await loadMatch(fixture(hex)); matches.push(m);
    const before = await m.snapshot(), save = await m.exportSave();
    const options = { maxTimeMs: 1000, maxDepth: 1 };
    const selected = await m.chooseMove(options);
    for (const level of ['beginner', 'casual', 'club', 'strong'] as const) {
      expect(await m.chooseMove({ ...options, level })).toBe(selected);
    }
    expect(before.legal).toContain(selected);
    expect(await m.snapshot()).toEqual(before);
    expect(await m.exportSave()).toBe(save);
    await expect(m.chooseMove({ level: 'master' } as any)).rejects.toThrow('Malformed level');
  });
  it.each(legacyBundles)('returns detached empty hands on every snapshot from old engine %s', async hex => {
    const m = await loadMatch(fixture(hex)); matches.push(m);
    const before = await m.snapshot();
    expect(before.rules.hands[0]).toEqual([]);
    expect(before.rules.hands[1]).toEqual([]);
    before.rules.hands[0].push('Haste');
    expect((await m.snapshot()).rules.hands).toEqual([[], []]);
    const after = await m.apply({ id: 'old-hands', expectedRevision: before.revision, lan: before.legal[0] });
    expect(after.rules.hands).toEqual([[], []]);
    expect((await m.apply({ id: 'old-hands', expectedRevision: before.revision, lan: before.legal[0] })).rules.hands).toEqual([[], []]);
    const resumed = await loadMatch(await m.exportSave()); matches.push(resumed);
    expect(await resumed.snapshot()).toEqual(after);
  });
  it('refuses a save whose engine has no bundle with MATCH_INCOMPATIBLE', async () => {
    const save = fixture(bundles[0]).replace(`sha256:${bundles[0]}`, `sha256:${'0'.repeat(64)}`);
    await expect(loadMatch(save)).rejects.toMatchObject({ code: 'MATCH_INCOMPATIBLE' });
  });
  it('names each engine in use that has no bundle', () => {
    const rows = [`sha256:${bundles[0]}`, bundles[0], `sha256:${'0'.repeat(64)}`, '../etc/passwd', null].map(engine => ({ engine, games: 1 }));
    expect(missingEngines(rows, ENGINES).map(row => row.engine)).toEqual([`sha256:${'0'.repeat(64)}`, '../etc/passwd', null]);
  });
});

const stamp = `sha256:${bundles[0]}`;
const alias = `sha256:${Object.keys(sourceAliases)[0]}`;
const save = (engine: unknown) => JSON.stringify({ schema: 'kingdown-local-match/1', engine });
const game = (engine: unknown = stamp, state: unknown = save(engine), status = 'playing') => ({ engine, state, status });
const reportFor = (rows: ReturnType<typeof game>[]) => ({ tables: [summarizeEngines('games', rows)], engines: summarizeEngines('games', rows).engines });

describe('engine report', () => {
  it('reports the exact runtime folder and the hashes of its bundle bytes', () => {
    const report = checkRuntime(reportFor([game(stamp), game(alias)]), ENGINES);
    expect(report.ok).toBe(true);
    expect(report.runtimeFolder).toBe(realpathSync(ENGINES));
    for (const bundle of report.bundles) {
      expect(bundle.sha256).toBe(createHash('sha256').update(readFileSync(join(ENGINES, bundle.file!))).digest('hex'));
    }
    expect(report.bundles.map(row => row.engine).sort()).toEqual([stamp, alias].sort());
  });

  it('hashes the supplied bytes rather than trusting the stamp in the file name', () => {
    const dir = mkdtempSync(join(tmpdir(), 'engine-report-'));
    try {
      writeFileSync(join(dir, `${bundles[0]}.mjs`), 'runtime bytes');
      expect(checkRuntime(reportFor([game()]), dir).bundles[0].sha256).toBe(createHash('sha256').update('runtime bytes').digest('hex'));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('fails if a legacy bundle or alias is absent from the supplied runtime', () => {
    const dir = mkdtempSync(join(tmpdir(), 'engine-report-'));
    try {
      const rows = [game(`sha256:${legacyBundles[0]}`), game(alias)];
      const report = checkRuntime(reportFor(rows), dir);
      expect(report.ok).toBe(false);
      expect(report.missingEngines).toBe(2);
      expect(report.bundles.every(bundle => bundle.sha256 === null)).toBe(true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it.each([null, '{', 'null', '[]', '"private-save-marker"', '{"schema":"wrong"}'])('counts malformed state %s and fails without exposing it', state => {
    const report = checkRuntime(reportFor([game(stamp, state)]), ENGINES);
    expect(report.ok).toBe(false);
    expect(report.tables[0]).toMatchObject({ unfinished: 1, initialized: 1, malformedState: 1, agreement: 0, mismatch: 1 });
    expect(JSON.stringify(report)).not.toContain('private-save-marker');
  });

  it.each([null, undefined, '', 'sha256:bad', '../etc/passwd', 1])('counts missing or malformed initialized stamp %s', engine => {
    const report = checkRuntime(reportFor([game(stamp, save(engine))]), ENGINES);
    expect(report.ok).toBe(false);
    expect(report.tables[0]).toMatchObject({ malformedEngine: 1, mismatch: 1 });
  });
});

const url = process.env.PLUGIN_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Database tests require a disposable loopback database ending in _test');
}
(url ? describe : describe.skip)('engines in use (PostgreSQL)', () => {
  async function withTables(tables: string[], check: (client: pg.Client) => Promise<void>) {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      // This session sees only its own temporary tables.
      await client.query('set search_path = pg_temp');
      if (tables.includes('games')) await client.query('create temp table games(engine_fingerprint text, state text, status text)');
      if (tables.includes('plugin_matches')) await client.query('create temp table plugin_matches(save text, snapshot jsonb)');
      await check(client);
    } finally { await client.end(); }
  }

  it.each([['games'], ['plugin_matches'], ['games', 'plugin_matches']])('reads all present tables: %j', async (...tables) => {
    await withTables(tables, async client => {
      if (tables.includes('games')) await client.query("insert into games values ($1,$2,'playing'),($1,$2,'waiting'),(null,null,'setup')", [stamp, save(stamp)]);
      if (tables.includes('plugin_matches')) await client.query(`insert into plugin_matches values ($1,'{"status":"playing"}'),($1,'{"status":"playing"}'),($2,'{"status":"checkmate"}')`, [save(alias), 'bad finished save']);
      const report = await enginesInUse(client);
      expect(report.database).toBe(new URL(url!).pathname.slice(1));
      expect(report.time).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
      expect(report.tables.map(row => [row.table, row.present])).toEqual(['games', 'plugin_matches'].map(table => [table, tables.includes(table)]));
      if (tables.includes('games')) expect(report.tables[0]).toMatchObject({ unfinished: 3, emptySetup: 1, initialized: 2, agreement: 2, mismatch: 0, malformedState: 0, malformedEngine: 0 });
      if (tables.includes('plugin_matches')) expect(report.tables[1]).toMatchObject({ unfinished: 2, initialized: 2, engines: [{ engine: alias, games: 2 }] });
      expect(checkRuntime(report, ENGINES).ok).toBe(true);
      expect(report.engines).toHaveLength(tables.length);
    });
  });

  it('fails when neither table exists', async () => {
    await withTables([], async client => {
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.tables).toEqual([{ table: 'games', present: false }, { table: 'plugin_matches', present: false }]);
      expect(report.ok).toBe(false);
    });
  });

  it('accepts explicit zero counts only after it reads present tables', async () => {
    await withTables(['games', 'plugin_matches'], async client => {
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.ok).toBe(true);
      expect(report.tables.every(row => row.present && row.unfinished === 0 && row.initialized === 0 && row.emptySetup === 0 && row.malformedState === 0 && row.malformedEngine === 0 && row.mismatch === 0)).toBe(true);
    });
  });

  it('accepts only null state and null column as empty waiting or setup', async () => {
    await withTables(['games'], async client => {
      await client.query("insert into games values (null,null,'waiting'),(null,null,'setup'),(null,$1,'setup'),($2,null,'waiting'),(null,null,'playing'),($2,$1,'playing')", [save(stamp), stamp]);
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.tables[0]).toMatchObject({ unfinished: 6, emptySetup: 2, initialized: 4, malformedState: 2, malformedEngine: 3, agreement: 1, mismatch: 3 });
      expect(report.ok).toBe(false);
    });
  });

  it('counts save and column disagreement and retains both full stamps', async () => {
    await withTables(['games'], async client => {
      await client.query("insert into games values ($1,$2,'playing')", [stamp, save(alias)]);
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.tables[0]).toMatchObject({ agreement: 0, mismatch: 1, malformedEngine: 0 });
      expect(report.engines.map(row => row.engine).sort()).toEqual([stamp, alias].sort());
      expect(report.ok).toBe(false);
    });
  });

  it('excludes finished, aborted and annulled games and finished plugin matches', async () => {
    await withTables(['games', 'plugin_matches'], async client => {
      await client.query("insert into games values (null,'bad','finished'),(null,'bad','aborted'),(null,'bad','annulled')");
      await client.query(`insert into plugin_matches values ('bad','{"status":"checkmate"}'),('bad','{"status":"stalemate"}')`);
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.ok).toBe(true);
      expect(report.tables.map(row => row.unfinished)).toEqual([0, 0]);
    });
  });

  it('fails on malformed plugin saves and stamps even when games exists', async () => {
    await withTables(['games', 'plugin_matches'], async client => {
      for (const state of ['bad', save(null), save('bad')]) await client.query(`insert into plugin_matches values ($1,'{"status":"playing"}')`, [state]);
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.tables[1]).toMatchObject({ unfinished: 3, initialized: 3, malformedState: 1, malformedEngine: 3 });
      expect(report.ok).toBe(false);
    });
  });

  it('uses one repeatable-read read-only transaction for every read', async () => {
    await withTables(['games', 'plugin_matches'], async client => {
      const commands: string[] = [];
      const reader = { query: async (sql: string, values?: unknown[]) => {
        commands.push(sql);
        const result = await client.query(sql, values);
        if (sql.startsWith('BEGIN')) {
          const { rows: [settings] } = await client.query("select current_setting('transaction_isolation') as isolation, current_setting('transaction_read_only') as readonly");
          expect(settings).toEqual({ isolation: 'repeatable read', readonly: 'on' });
        }
        return result;
      } };
      await enginesInUse(reader);
      expect(commands[0]).toBe('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      expect(commands.at(-1)).toBe('ROLLBACK');
      expect(commands.filter(sql => sql.startsWith('BEGIN'))).toHaveLength(1);
      expect(commands.slice(1, -1).every(sql => sql.startsWith('select '))).toBe(true);
    });
  });

  it('fails and rolls back when a present table cannot be read', async () => {
    await withTables(['games'], async client => {
      await client.query('alter table games drop column state');
      await expect(enginesInUse(client)).rejects.toThrow('Cannot read games');
      expect((await client.query('select 1 as ready')).rows[0].ready).toBe(1);
    });
  });
});
