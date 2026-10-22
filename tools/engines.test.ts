// The engine archive (G2): each released worker bundle in engines/ reloads its fixture game and accepts a
// move; tools/engines-check.mjs finds the engines of unfinished games that have no bundle.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterEach, describe, expect, it } from 'vitest';
import { loadMatch, LocalMatch, type MatchSnapshot } from '../src/match/index';
import { checkRuntime, enginesInUse, missingEngines, summarizeEngines } from './engines-check.mjs';
import { testDatabase } from './plugin-db-config.mjs';
import { ENGINE_STAMP, ENGINES } from './plugin-runtime-build.mjs';
import { setupAdmission, DEFAULT_OPTIONS } from '../src/match/setup';
import { ARCHIVE_CAPABILITIES, CARD_CASES, CLASSIC_CASES, ORDINARY_CASES, PRE_ENGINE_RECOVERY_STATES, RECOVERY_RECEIPT } from './fixtures/engine-continuation';
import { inCheck, legalMoves, setRules, status, type Position } from '../src/rules/engine';
import { fromFen, toFen, toLan } from '../src/rules/setup';
import { applyLan, draftTurn, replayHistory, replayLans, sendActions, type BoardMove } from '../src/plugin/screens/board-model';
import type { View } from '../src/match/protocol';

const files = readdirSync(ENGINES);
const bundles = files.filter(file => file.endsWith('.mjs')).map(file => file.slice(0, -4));
const legacyBundles = ['2675a7e6e32d635615350089a490902f4842ae26a7866d7123c6d95b49c60c5b', 'a6f9ebec5f0f2d5ff0a7b24e726e196fd27821a5133176bcfda26b70de9b75cd'];
// A tsx run (the review seed, tools/plugin-db/seed-review.ts) stamps the source-tree hash of src/match/worker.ts.
// Each alias is the compiled bundle of that same source with the source stamp in place of its own.
const sourceAliases: Record<string, string> = { e668782a46ed3661312f39a8d246c19722686054317a4c9a35da31d726dabcb6: 'bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da' };
const fixture = (hex: string) => readFileSync(join(ENGINES, `${hex}.save.json`), 'utf8');
const matches: LocalMatch[] = [];
afterEach(async () => { await Promise.all(matches.splice(0).map(m => m.close())); setRules(); });

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
    const before = JSON.parse(await m.exportSave());
    const after = await m.apply({ id: 'archive-check', expectedRevision: revision, lan: legal[0] });
    expect(after.revision).toBe(revision + 1);
    const saved = await m.exportSave(), body = JSON.parse(saved);
    expect(body.engine).toBe(before.engine);
    expect(body.rules).toEqual(before.rules);
    const resumed = await loadMatch(saved); matches.push(resumed);
    expect(await resumed.snapshot()).toEqual(after);
    expect(await resumed.exportSave()).toBe(saved);
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
    expect(missingEngines(rows, ENGINES).map(row => row.engine)).toEqual([bundles[0], `sha256:${'0'.repeat(64)}`, '../etc/passwd', null]);
  });
});

const stamp = `sha256:${bundles[0]}`;
const alias = `sha256:${Object.keys(sourceAliases)[0]}`;
const save = (engine: unknown) => JSON.stringify({ ...JSON.parse(fixture(bundles[0])), engine });
const game = (engine: unknown = stamp, state: unknown = save(engine), status = 'playing') => ({ engine, state, status });
const reportFor = (rows: (ReturnType<typeof game> & { admission?: unknown })[]) => ({ tables: [summarizeEngines('games', rows)], engines: summarizeEngines('games', rows).engines });

describe('engine report', () => {
  it.each([
    ['a save with only a schema and engine', { schema: 'kingdown-local-match/1', engine: stamp }],
    ...['engine', 'setup', 'initialFen', 'rules', 'revision', 'commands'].map(key => {
      const state = JSON.parse(save(stamp)); delete state[key]; return [`a save without ${key}`, state];
    }),
    ...[-1, 0.5, '0'].map(revision => [`revision ${JSON.stringify(revision)}`, { ...JSON.parse(save(stamp)), revision }]),
    ...[null, {}, []].map(commands => [`commands ${JSON.stringify(commands)}`, { ...JSON.parse(save(stamp)), revision: 1, commands }]),
  ])('refuses %s', (_label, state) => {
    const report = checkRuntime(reportFor([game(stamp, JSON.stringify(state))]), ENGINES);
    expect(report.tables[0].malformedState).toBe(1); expect(report.ok).toBe(false);
  });

  it('refuses unstamped pending states until their baseline is explicitly mapped', () => {
    const report = checkRuntime(reportFor(PRE_ENGINE_RECOVERY_STATES), ENGINES);
    expect(report.ok).toBe(false);
    expect(report.tables[0]).toMatchObject({ unfinished: 2, emptySetup: 2, initialized: 0, malformedEngine: 0 });
    expect(report.engines).toEqual([]);
  });

  it('retains the required archive for a drawn setup before a position exists', () => {
    const report = checkRuntime(reportFor([{ ...game(stamp, null, 'setup'), admission: setupAdmission(DEFAULT_OPTIONS) }]), ENGINES);
    expect(report.ok).toBe(true);
    expect(report.tables[0]).toMatchObject({ pendingSetup: 1, initialized: 0, emptySetup: 0, malformedState: 0 });
    expect(report.engines).toEqual([{ engine: stamp, games: 1 }]);
    expect(checkRuntime({ ...report, engines: [{ engine: `sha256:${'f'.repeat(64)}`, games: 1 }] }, ENGINES).ok).toBe(false);
  });

  it.each(['save', 'column', 'both'])('rejects a bare hash in the initialized %s', field => {
    const report = checkRuntime(reportFor([game(field === 'save' ? stamp : bundles[0], save(field === 'column' ? stamp : bundles[0]))]), ENGINES);
    expect(report.ok).toBe(false);
    expect(report.tables[0]).toMatchObject({ malformedEngine: 1, agreement: 0, mismatch: 1 });
    expect(report.engines.every(row => row.engine.startsWith('sha256:'))).toBe(true);
  });

  it('records release and recovery folders and exact bytes separately', () => {
    const root = mkdtempSync(join(tmpdir(), 'engine-pair-report-'));
    try {
      const release = join(root, 'release'), recovery = join(root, 'recovery');
      for (const dir of [release, recovery]) {
        mkdirSync(dir);
        for (const hex of bundles) copyFileSync(join(ENGINES, `${hex}.mjs`), join(dir, `${hex}.mjs`));
      }
      const input = reportFor(ARCHIVE_CAPABILITIES.map(({ hex }) => game(`sha256:${hex}`)));
      const a = checkRuntime(input, release), b = checkRuntime(input, recovery);
      expect(a.ok && b.ok).toBe(true);
      expect(a.runtimeFolder).not.toBe(b.runtimeFolder);
      expect(a.bundles).toEqual(b.bundles);
      expect(a.bundles).toHaveLength(5);
      writeFileSync(join(recovery, `${bundles[0]}.mjs`), 'corrupt runtime bytes');
      expect(checkRuntime(input, recovery).bundles).not.toEqual(a.bundles);
      rmSync(join(recovery, `${bundles[0]}.mjs`));
      expect(checkRuntime(input, recovery)).toMatchObject({ ok: false, missingEngines: 1 });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('fails on unreadable runtime files and absent runtime folders', () => {
    const dir = mkdtempSync(join(tmpdir(), 'engine-file-error-'));
    try {
      mkdirSync(join(dir, `${bundles[0]}.mjs`));
      expect(() => checkRuntime(reportFor([game()]), dir)).toThrow();
      expect(() => checkRuntime(reportFor([game()]), join(dir, 'absent'))).toThrow();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it.each([undefined, 'postgresql://user:private-url@db.example/live?sslmode=disable'])('fails the CLI with a missing or invalid setting without printing it (%s)', setting => {
    const run = spawnSync(process.execPath, ['tools/engines-check.mjs'], { encoding: 'utf8',
      env: setting ? { KINGDOWN_ENGINES_DATABASE_URL: setting } : {} });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('cannot complete the read-only database and runtime report');
    expect(run.stderr).not.toMatch(/private-url|db\.example/);
    expect(run.stdout).toBe('');
  });

  it('redacts a query failure and exits nonzero', () => {
    const run = spawnSync(process.execPath, ['--import', './tools/fixtures/engine-report-query-error.mjs', 'tools/engines-check.mjs'], {
      encoding: 'utf8', env: { KINGDOWN_ENGINES_DATABASE_URL: 'postgresql://user:private-url@127.0.0.1/kingdown_test' },
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('cannot complete the read-only database and runtime report');
    expect(run.stderr).not.toMatch(/private-query-marker|private-url/);
    expect(run.stdout).toBe('');
  });

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

  it.each([null, undefined, '', bundles[0], `sha256:${bundles[0].toUpperCase()}`, `sha256:${bundles[0].slice(0, 8)}`, 'sha256:bad', '../etc/passwd', 1])('counts missing or malformed initialized stamp %s', engine => {
    const report = checkRuntime(reportFor([game(stamp, save(engine))]), ENGINES);
    expect(report.ok).toBe(false);
    expect(report.tables[0]).toMatchObject({ malformedEngine: 1, mismatch: 1 });
  });
});

const url = process.env.PLUGIN_TEST_DATABASE_URL;
if (url) {
  testDatabase(url);
}
(url ? describe : describe.skip)('engines in use (PostgreSQL)', () => {
  async function withTables(tables: string[], check: (client: pg.Client) => Promise<void>) {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      // This session sees only its own temporary tables.
      await client.query('set search_path = pg_temp');
      if (tables.includes('games')) await client.query('create temp table games(engine_fingerprint text, state text, status text, setup_admission jsonb)');
      if (tables.includes('plugin_matches')) await client.query('create temp table plugin_matches(save text, snapshot jsonb)');
      await check(client);
    } finally { await client.end(); }
  }

  it.each([['games'], ['plugin_matches'], ['games', 'plugin_matches']])('reads all present tables: %j', async (...tables) => {
    await withTables(tables, async client => {
      if (tables.includes('games')) await client.query("insert into games(engine_fingerprint,state,status) values ($1,$2,'playing'),($1,$2,'waiting'),($1,null,'setup')", [stamp, save(stamp)]);
      if (tables.includes('games')) await client.query("update games set setup_admission=$1 where state is null", [setupAdmission(DEFAULT_OPTIONS)]);
      if (tables.includes('plugin_matches')) await client.query(`insert into plugin_matches values ($1,'{"status":"playing"}'),($1,'{"status":"playing"}'),($2,'{"status":"checkmate"}')`, [save(alias), 'bad finished save']);
      const report = await enginesInUse(client);
      expect(report.database).toBe(new URL(url!).pathname.slice(1));
      expect(report.time).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
      expect(report.tables.map(row => [row.table, row.present])).toEqual(['games', 'plugin_matches'].map(table => [table, tables.includes(table)]));
      if (tables.includes('games')) expect(report.tables[0]).toMatchObject({ unfinished: 3, emptySetup: 0, pendingSetup: 1, initialized: 2, agreement: 2, mismatch: 0, malformedState: 0, malformedEngine: 0 });
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

  it('reports unmapped pending rows and malformed initialized state separately', async () => {
    await withTables(['games'], async client => {
      await client.query("insert into games(engine_fingerprint,state,status) values (null,null,'waiting'),(null,null,'setup'),(null,$1,'setup'),($2,null,'waiting'),(null,null,'playing'),($2,$1,'playing')", [save(stamp), stamp]);
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.tables[0]).toMatchObject({ unfinished: 6, emptySetup: 2, initialized: 4, malformedState: 2, malformedEngine: 3, agreement: 1, mismatch: 3 });
      expect(report.ok).toBe(false);
    });
  });

  it('counts save and column disagreement and retains both full stamps', async () => {
    await withTables(['games'], async client => {
      await client.query("insert into games(engine_fingerprint,state,status) values ($1,$2,'playing')", [stamp, save(alias)]);
      const report = checkRuntime(await enginesInUse(client), ENGINES);
      expect(report.tables[0]).toMatchObject({ agreement: 0, mismatch: 1, malformedEngine: 0 });
      expect(report.engines.map(row => row.engine).sort()).toEqual([stamp, alias].sort());
      expect(report.ok).toBe(false);
    });
  });

  it('excludes finished, aborted and annulled games and finished plugin matches', async () => {
    await withTables(['games', 'plugin_matches'], async client => {
      await client.query("insert into games(engine_fingerprint,state,status) values (null,'bad','finished'),(null,'bad','aborted'),(null,'bad','annulled')");
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

function comparePosition(snapshot: MatchSnapshot, pos: Position) {
  setRules(snapshot.rules);
  expect(toFen(pos)).toBe(snapshot.fen);
  expect(pos.turn).toBe(snapshot.turn);
  expect(pos.ply).toBe(snapshot.ply);
  expect(inCheck(pos)).toBe(snapshot.inCheck);
  // The worker keeps repetition history. A local draft has no committed result.
  expect(status(pos)).toBe(snapshot.status === 'drawRepetition' ? 'playing' : snapshot.status);
  const legal = snapshot.status === 'playing' ? legalMoves(pos).map(move => toLan(pos, move)) : [];
  expect(legal.sort()).toEqual([...snapshot.legal].sort());
}
function historyView(snapshot: MatchSnapshot, initialFen: string): View {
  return { game_id: 'archive-test', revision: snapshot.revision, fen: snapshot.fen,
    created_at: '2026-10-19T00:00:00Z', abort_open: false, seat: snapshot.turn,
    kind: 'friend', speed: 'daily', days_per_move: 3, status: snapshot.status === 'playing' ? 'playing' : 'finished',
    turn: snapshot.turn, action: snapshot.status === 'playing' ? 'ready' : 'done', in_check: snapshot.inCheck,
    legal: snapshot.legal, opponent: null, draw_offer: null, deadline_at: null, server_now: '2026-10-19T00:00:00Z',
    history: { initial_fen: initialFen, actions: snapshot.history }, last_commands: [] };
}

describe.each(ARCHIVE_CAPABILITIES)('archive candidate $hex', capability => {
  const { hex } = capability;
  const cases = [...ORDINARY_CASES, ...(capability.classic ? CLASSIC_CASES : []), ...(capability.cards ? CARD_CASES : [])];
  it.each(cases)('compares each prefix, history and reload: $name', async test => {
    const match = new LocalMatch(pathToFileURL(join(ENGINES, `${hex}.mjs`))); matches.push(match);
    await match.initialize(test.setup);
    const original = JSON.parse(await match.exportSave()), start = await match.snapshot();
    expect(original.engine).toBe(`sha256:${hex}`);
    if (test.setup.hand) expect(start.rules.hands).toEqual([test.setup.hand, test.setup.hand]);
    setRules(start.rules);
    let pos = fromFen(start.fen), steps: BoardMove[] = [], seat = start.turn;
    comparePosition(start, pos);
    for (const [index, lan] of test.actions.entries()) {
      const before = await match.snapshot();
      setRules(before.rules);
      const step = applyLan(pos, lan, before.rules, before.legal);
      expect(step, lan).toBeDefined();
      steps.push(step!); pos = step!.pos;
      const next = await match.apply({ id: `archive-${index}`, expectedRevision: before.revision, lan });
      comparePosition(next, pos);
      expect(next.rules).toEqual(start.rules);
      const view = historyView(next, start.fen);
      setRules(start.rules);
      const history = replayHistory(view, start.rules)!;
      expect(history.map(step => toFen(step.pos))).toEqual(JSON.parse(await match.exportSave()).commands.map((command: { fen: string }) => command.fen));
      const incremental = replayLans(historyView(before, start.fen), { ...view, last_commands: [{ seq: next.revision, seat: before.turn, at: '2026-10-19T00:00:00Z', action: { type: 'turn', actions: [lan] } }] }, start.rules)!;
      expect(incremental.map(step => toFen(step.pos))).toEqual([next.fen]);
      if (test.followups && index === 0) {
        const saved = await match.exportSave();
        for (const followup of next.legal) {
          const branch = await loadMatch(saved);
          try {
            setRules(next.rules);
            const follow = applyLan(pos, followup, next.rules)!;
            expect(follow, followup).toBeDefined();
            comparePosition(await branch.apply({ id: 'followup', expectedRevision: next.revision, lan: followup }), follow.pos);
          } finally { await branch.close(); }
        }
      }
      if (test.automaticPass && index === 0) expect(sendActions(steps, pos, seat)).toEqual(test.actions);
      if (next.turn !== seat || next.status !== 'playing') {
        expect(draftTurn(steps, pos, 'link', seat).waits).toBe(true);
        expect(sendActions(steps, pos, seat)).toEqual(steps.map(step => step.lan));
        steps = []; seat = next.turn;
      }
    }
    const final = await match.snapshot(), saved = await match.exportSave(), body = JSON.parse(saved);
    expect(body.engine).toBe(original.engine);
    expect(JSON.stringify(body.rules)).toBe(JSON.stringify(original.rules));
    if (test.status) expect(final.status).toBe(test.status);
    if (test.name === 'full history') expect(final.history.length).toBeGreaterThan(10);
    const resumed = await loadMatch(saved); matches.push(resumed);
    expect(await resumed.snapshot()).toEqual(final);
    expect(await resumed.exportSave()).toBe(saved);
    const last = body.commands.at(-1);
    expect(await resumed.apply({ id: last.id, expectedRevision: last.expectedRevision, lan: last.lan })).toEqual(final);
    expect(await resumed.exportSave()).toBe(saved);
    if (test.status) await expect(resumed.apply({ id: 'after-end', expectedRevision: final.revision, lan: 'e2-e4' })).rejects.toThrow('terminal');
  }, 20000);

  if (!capability.classic) {
    it.each([{ classic: true }, { hand: ['Haste'] }])('records refused old setup features: %j', async setup => {
      const match = new LocalMatch(pathToFileURL(join(ENGINES, `${hex}.mjs`))); matches.push(match);
      await expect(match.initialize(setup)).rejects.toThrow('Malformed');
    });
  }
  it('keeps an unknown receipt safe across recovery and rejects changed input', async () => {
    const match = new LocalMatch(pathToFileURL(join(ENGINES, `${hex}.mjs`))); matches.push(match);
    await match.initialize({});
    const committed = await match.apply(RECOVERY_RECEIPT), saved = await match.exportSave();
    const recovery = await loadMatch(saved); matches.push(recovery);
    expect(await recovery.apply(RECOVERY_RECEIPT)).toEqual(committed);
    expect(await recovery.exportSave()).toBe(saved);
    await expect(recovery.apply({ ...RECOVERY_RECEIPT, lan: 'd2-d4' })).rejects.toThrow('conflict');
    expect(await recovery.exportSave()).toBe(saved);
  });
});
