// The engine archive (G2): each released worker bundle in engines/ reloads its fixture game and accepts a
// move; tools/engines-check.mjs finds the engines of unfinished games that have no bundle.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { afterEach, describe, expect, it } from 'vitest';
import { loadMatch, type LocalMatch } from '../src/match/index';
import { enginesInUse, missingEngines } from './engines-check.mjs';
import { ENGINE_STAMP, ENGINES } from './plugin-runtime-build.mjs';

const files = readdirSync(ENGINES);
const bundles = files.filter(file => file.endsWith('.mjs')).map(file => file.slice(0, -4));
const fixture = (hex: string) => readFileSync(join(ENGINES, `${hex}.save.json`), 'utf8');
const matches: LocalMatch[] = [];
afterEach(async () => { await Promise.all(matches.splice(0).map(m => m.close())); });

describe('engine archive', () => {
  it('holds each bundle under its own fingerprint, with one fixture save each', () => {
    expect(bundles.length).toBeGreaterThan(0);
    expect(files.filter(file => file.endsWith('.save.json')).map(file => file.slice(0, -10)).sort()).toEqual([...bundles].sort());
    for (const hex of bundles) {
      const text = readFileSync(join(ENGINES, `${hex}.mjs`), 'utf8');
      // The build hashed the bundle while it held the stamp; a changed bundle no longer matches its name.
      expect(createHash('sha256').update(text.replace(`sha256:${hex}`, ENGINE_STAMP)).digest('hex')).toBe(hex);
      expect(JSON.parse(fixture(hex)).engine).toBe(`sha256:${hex}`);
    }
  });
  it.each(bundles)('continues the fixture game of engine %s on its archived bundle', async hex => {
    const m = await loadMatch(fixture(hex)); matches.push(m);
    const { revision, legal } = await m.snapshot();
    expect(revision).toBe(JSON.parse(fixture(hex)).revision);
    expect((await m.apply({ id: 'archive-check', expectedRevision: revision, lan: legal[0] })).revision).toBe(revision + 1);
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

const url = process.env.PLUGIN_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Database tests require a disposable loopback database ending in _test');
}
(url ? describe : describe.skip)('engines in use (PostgreSQL)', () => {
  it('reads unfinished games from games, or from plugin_matches before the games table exists', async () => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      // Temporary tables only: search_path holds nothing but this session's own schema.
      await client.query("begin; set local search_path = pg_temp; create temp table plugin_matches(save text, snapshot jsonb) on commit drop");
      const save = (engine: string) => JSON.stringify({ schema: 'kingdown-local-match/1', engine });
      await client.query("insert into plugin_matches values ($1,'{\"status\":\"playing\"}'),($1,'{\"status\":\"playing\"}'),($2,'{\"status\":\"playing\"}'),($3,'{\"status\":\"checkmate\"}')", [save('sha256:a'), save('sha256:b'), save('sha256:c')]);
      expect(await enginesInUse(client)).toEqual([{ engine: 'sha256:a', games: 2 }, { engine: 'sha256:b', games: 1 }]);
      await client.query('create temp table games(engine_fingerprint text, status text) on commit drop');
      await client.query("insert into games values ('sha256:d','playing'),('sha256:e','waiting'),('sha256:f','finished'),('sha256:g','aborted'),('sha256:h','annulled')");
      expect(await enginesInUse(client)).toEqual([{ engine: 'sha256:d', games: 1 }, { engine: 'sha256:e', games: 1 }]);
    } finally { await client.query('rollback').catch(() => {}); await client.end(); }
  });
});
