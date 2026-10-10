import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { buildDataset, expectedGames, HISTORIC_RELEASE_FLAGS } from './dataset';
const roots: string[] = [];
async function fixture(queue = '') {
  const root = await mkdtemp(join(tmpdir(), 'balance-data-')); roots.push(root);
  await mkdir(join(root, 'docs')); await writeFile(join(root, 'docs/QUEUE.md'), queue);
  const out = join(root, 'sim/out'); await mkdir(out, { recursive: true });
  return { root, out };
}
const game = (gameId: number, result = 1, extra = {}) => ({ gameId, result, plies: 20, reason: 'checkmate', ...extra });
async function raw(out: string, id: string, games: unknown[], spec: Record<string, unknown> = {}, gzip = false) {
  await mkdir(out, { recursive: true });
  const text = games.map(x => JSON.stringify(x)).join('\n') + '\n';
  await writeFile(join(out, `${id}.jsonl${gzip ? '.gz' : ''}`), gzip ? gzipSync(text) : text);
  await writeFile(join(out, `${id}.summary.json`), JSON.stringify({ spec: { id, games: games.length, rules: {}, ai: { depth: 3 }, ...spec }, games: games.length }));
}
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
describe('all-history dataset', () => {
  it('counts exact copies and gzip backups once and retains every source', async () => {
    const { root, out } = await fixture();
    await raw(out, 'study', [game(0), game(1, 0)]);
    const copy = join(root, 'backup'); await raw(copy, 'study', [game(0), game(1, 0)], {}, true);
    await writeFile(join(out, 'note.bin'), 'unrecognized');
    const data = await buildDataset({ root, sources: [out, copy] });
    expect(data.measurements.filter(m => m.run === 'study' && m.measure === 'whiteScore')).toHaveLength(1);
    expect(data.measurements.find(m => m.run === 'study' && m.measure === 'whiteScore')).toMatchObject({ sample: 2, value: .5, context: { flags: {}, flagsKind: 'diff', commit: null } });
    expect(data.sources.find(s => s.source === 'backup/study.jsonl.gz')).toMatchObject({ status: 'duplicate', duplicates: 2, accepted: 0 });
    expect(data.sources.filter(s => s.kind !== 'missing')).toHaveLength(5);
    expect(data.sources.find(s => s.source.endsWith('note.bin'))?.status).toBe('unsupported');
    expect(await buildDataset({ root, sources: [out, copy] })).toEqual(data);
  });
  it('joins global shard IDs under the indexed run and deduplicates a merged copy', async () => {
    const { root, out } = await fixture();
    await raw(out, 'study', [game(0), game(1, 0)]);
    await writeFile(join(out, 'study.shard0of2.jsonl'), `${JSON.stringify(game(0))}\n`);
    await writeFile(join(out, 'study.shard1of2.jsonl'), `${JSON.stringify(game(1, 0))}\n`);
    const data = await buildDataset({ root, sources: [out] });
    const rows = data.measurements.filter(m => m.run === 'study' && m.measure === 'whiteScore');
    expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ sample: 2, value: .5, validity: 'valid' });
    expect(data.runs.some(r => r.run.includes('.shard'))).toBe(false);
    expect(data.sources.filter(s => s.source.includes('.shard')).map(s => s.duplicates)).toEqual([1, 1]);
  });
  it('adds only a single consistent QUEUE machine and keeps source machines', async () => {
    const queue = [
      '| known-raw | Kaggle, 12 notebooks | test | 1 | done |',
      '| known-raw | Kaggle, second source | test | 1 | done |',
      '| known-report | M1, after the deal | test | 2 | done |',
      '| known-mac | this Mac, 4 workers | test | 1 | done |',
      '| spec-first | Kaggle | test | 1 | done |',
      '| path-first | Kaggle | test | 1 | done |',
      '| mixed-host | M1 and Kaggle | test | 1 | done |',
      '| conflict-host | M1 | test | 1 | done |',
      '| conflict-host | Kaggle | test | 1 | done |',
      '| missing-host | M1 | test | 1 | done |',
      '| missing-host | after the current run | test | 1 | done |',
      '| column-only | manual host | compare Kaggle with M1 | 1 | done |',
    ].join('\n');
    const { root, out } = await fixture(queue);
    for (const id of ['known-raw', 'known-mac', 'mixed-host', 'conflict-host', 'missing-host', 'column-only']) await raw(out, id, [game(0)]);
    await raw(out, 'spec-first', [game(0)], { machine: 'Saved host' });
    await raw(join(out, 'm1'), 'path-first', [game(0)]);
    await writeFile(join(out, 'known-report.report.json'), JSON.stringify({ id: 'known-report', games: 2, overall: { score: .75, drawRate: .5, meanPlies: 20 } }));
    const data = await buildDataset({ root, sources: [out] });
    const machine = (run: string) => data.measurements.find(m => m.run === run)?.context.machine;
    expect(machine('known-raw')).toBe('Kaggle');
    expect(machine('known-report')).toBe('M1');
    expect(machine('known-mac')).toBe('Mac');
    expect(machine('spec-first')).toBe('Saved host');
    expect(machine('path-first')).toBe('M1');
    for (const id of ['mixed-host', 'conflict-host', 'missing-host', 'column-only']) expect(machine(id)).toBeNull();
  });
  it('keeps changed source stamps in separate contexts', async () => {
    const { root, out } = await fixture();
    await raw(out, 'study', [game(0, 1, { rules: { guardStep: 1 }, rulesKey: 'one', src: 'old' }), game(1, 0, { rules: { guardStep: 2 }, rulesKey: 'two', src: 'new' })]);
    const data = await buildDataset({ root, sources: [out] });
    const rows = data.measurements.filter(m => m.run === 'study' && m.measure === 'whiteScore');
    expect(rows).toHaveLength(2); expect(new Set(rows.map(m => m.context.sourceHash)).size).toBe(2);
    expect(rows.every(m => m.value === null && m.validity === 'incomplete')).toBe(true);
  });
  it('blocks malformed, conflicting, and torn raw records', async () => {
    const { root, out } = await fixture();
    await raw(out, 'conflict', [game(0), game(0, 0)]);
    await raw(out, 'torn', [game(0)]);
    await writeFile(join(out, 'torn.jsonl'), JSON.stringify(game(0)));
    await raw(out, 'bad', [game(0)]);
    await writeFile(join(out, 'bad.jsonl'), `${JSON.stringify(game(0))}\n{\n`);
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'conflict').every(m => m.validity === 'conflict' && m.value === null)).toBe(true);
    expect(data.measurements.filter(m => ['bad', 'torn'].includes(m.run)).every(m => m.validity === 'incomplete' && m.value === null)).toBe(true);
  });
  it('does not discard a repaired same-ID Death Touch run with its void archive', async () => {
    const { root, out } = await fixture();
    const spec = { rules: { ...HISTORIC_RELEASE_FLAGS } };
    await raw(join(out, 'void'), 'dt-r0', [game(0)], spec);
    await raw(out, 'dt-r0', [game(0)], spec);
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'dt-r0' && m.measure === 'whiteScore').map(m => m.validity).sort()).toEqual(['valid', 'void']);
  });
  it('requires the full queue target and all scheduled IDs to complete a pending run', async () => {
    const queue = '| deal-d4k | Kaggle | authorized | 4 | running |';
    const { root, out } = await fixture(queue);
    await raw(out, 'deal-d4k', [game(0), game(1)], { games: 2 });
    let data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'deal-d4k').every(m => m.validity === 'pending' && m.value === null)).toBe(true);
    await raw(out, 'deal-d4k', [game(0), game(1), game(2), game(4)], { games: 4 });
    data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'deal-d4k').every(m => m.validity === 'pending' && m.value === null)).toBe(true);
    await raw(out, 'deal-d4k', [game(0), game(1), game(2), game(3)], { games: 4 });
    data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'deal-d4k').every(m => m.validity === 'valid' && m.value !== null)).toBe(true);
  });
  it('excludes inherited unstamped Q6 but accepts stamped replacements with the same ID', async () => {
    const { root, out } = await fixture();
    await raw(out, 'nnue-g1', [game(0)]);
    await raw(join(out, 'repaired'), 'nnue-g1', [game(0, 1, { src: 'pinned-source', rulesKey: 'resolved', rules: { guardStep: 1 } })]);
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'nnue-g1' && m.measure === 'whiteScore').map(m => m.validity).sort()).toEqual(['valid', 'void']);
  });
  it('keeps first-move score in a mirror game rather than cancelling its sides', async () => {
    const { root, out } = await fixture();
    await raw(out, 'mirror', [game(0, 1, { white: 'cards6', black: 'cards6', uses: [2, 4] })]);
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.find(m => m.element === 'cards6' && m.measure === 'whiteScore')).toMatchObject({ sample: 1, value: 1 });
    expect(data.measurements.find(m => m.element === 'cards6' && m.measure === 'activity')).toMatchObject({ sample: 1, value: 3 });
  });
  it('keeps both tournament rule variants and the saved army and card settings', async () => {
    const { root, out } = await fixture();
    const spec = { id: 'variants', entrants: ['Haste~vtrim', 'Freeze~vquiet'], pairs: 1, mirror: false,
      variants: { trim: { hasteCaptures: false }, quiet: { freezeQuiet: true } },
      rules: {}, cardPool: ['Haste', 'Freeze'], pool: 'QORRBBNNAAGMMS', seed: 17, armies: 'perPair', depth: 3 };
    await writeFile(join(out, 'variants.tournament.json'), JSON.stringify(spec));
    await writeFile(join(out, 'variants.jsonl'), [game(0, 1, { white: 'Haste~vtrim', black: 'Freeze~vquiet' }), game(1, 0, { white: 'Freeze~vquiet', black: 'Haste~vtrim' })].map(x => JSON.stringify(x)).join('\n') + '\n');
    const data = await buildDataset({ root, sources: [out] });
    const row = data.measurements.find(m => m.run === 'variants' && m.element === 'Haste~vtrim' && m.measure === 'score');
    expect(row).toMatchObject({ validity: 'valid', sample: 2, context: { flags: { hasteCaptures: false, freezeQuiet: true }, flagsKind: 'diff', variantScope: 'matchup', settings: { seed: 17, armies: 'perPair', cardPool: ['Haste', 'Freeze'] } } });
  });
  it('attaches an army interval only to the same source context and population', async () => {
    const { root, out } = await fixture();
    const a = join(out, 'a'), b = join(out, 'b');
    const games = (src: string) => [game(0, 1, { white: 'Haste', black: 'none', src, rulesKey: 'resolved', rules: {} }), game(1, 0, { white: 'none', black: 'Haste', src, rulesKey: 'resolved', rules: {} })];
    await raw(a, 'powers', games('source-a')); await raw(b, 'powers', games('source-b'));
    await writeFile(join(b, 'powers.report.md'), '# Powers\n2 of 2 games, depth 3.\nRules: `{}`\n| power | score vs field | ±95% | ±95% armies | games |\n|---|---|---|---|---|\n| Haste | 100% | 0 | 20 | 2 |\n');
    const data = await buildDataset({ root, sources: [out] });
    const scores = data.measurements.filter(m => m.element === 'Haste' && m.measure === 'score');
    expect(scores).toHaveLength(2);
    expect(scores.find(m => m.context.sourceHash === 'source-a')?.error).toBe(0);
    expect(scores.find(m => m.context.sourceHash === 'source-b')?.error).toBe(.2);
  });
  it('gives mirror and field draw readings separate IDs', async () => {
    const { root, out } = await fixture();
    await raw(out, 'powers', [game(0, .5, { white: 'Haste', black: 'Haste' }), game(1, 1, { white: 'Haste', black: 'none' })]);
    const data = await buildDataset({ root, sources: [out] });
    const rows = data.measurements.filter(m => m.element === 'Haste' && m.measure === 'drawRate');
    expect(rows).toHaveLength(2); expect(new Set(rows.map(m => m.id)).size).toBe(2);
    expect(rows.map(m => m.context.population).sort()).toEqual(['field', 'mirror']);
  });
  it('keeps mixed depths unknown and mirror-only report sample counts exact', async () => {
    const { root, out } = await fixture();
    await writeFile(join(out, 'mixed.report.md'), '# Powers\nDepth 3/4, mixed report.\n## Implied values\n| piece | implied value (pawns) |\n|---|---|\n| A | 3.4 ± 0.2 |\n');
    await writeFile(join(out, 'mirror.tournament.json'), JSON.stringify({ id: 'mirror', entrants: ['none'], pairs: 10, mirror: true, mirrorOnly: true, rules: {}, depth: 3 }));
    await writeFile(join(out, 'mirror.report.md'), '# Powers\n10 of 10 games, depth 3.\n| entrant | White % | ±95% | pairs |\n|---|---|---|---|\n| none | 50 | 2 | 10 |\n');
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.find(m => m.run === 'mixed')).toMatchObject({ context: { depth: null, settings: { depths: [3, 4] } } });
    expect(data.measurements.find(m => m.run === 'mirror')).toMatchObject({ sample: 10 });
  });
  it('does not certify Death Touch from two release flags alone', async () => {
    const { root, out } = await fixture();
    await raw(out, 'dt-r0', [game(0)], { rules: { deathTouchReach: true, markFree: true } });
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.run === 'dt-r0').every(m => m.validity === 'unverified')).toBe(true);
  });
  it('keeps equal report values from different run IDs as separate evidence', async () => {
    const { root, out } = await fixture();
    const report = '# Piece values\nDepth 3, 200 games per arm.\n## Implied values\n| piece | implied value (pawns) |\n|---|---|\n| A | 3.4 ± 0.2 |\n';
    await writeFile(join(out, 'first.experiment.md'), report);
    await writeFile(join(out, 'second.experiment.md'), report);
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.filter(m => m.element === 'A').map(m => m.run).sort()).toEqual(['first', 'second']);
  });
  it('imports report bounds and measured scale without an invented error', async () => {
    const { root, out } = await fixture('| absent-run | M1 | test | 20 | done |');
    await writeFile(join(out, 'worth.experiment.md'), '# Piece values\nDepth 3, 200 games per arm.\nOne pawn = 64 ± 16 Elo\n## Implied values\n| piece | implied value (pawns) |\n|---|---|\n| A (archer) | < 1.70 |\n| G (guard) | 2.34 ± 0.42 |\n');
    const data = await buildDataset({ root, sources: [out] });
    expect(data.measurements.find(m => m.element === 'A')).toMatchObject({ measure: 'pawnWorth', value: 1.7, error: null, bound: 'lessThan', calibration: { eloPerPawn: 64, relativeError: .25 }, validity: 'unverified' });
    expect(data.runs.find(r => r.run === 'absent-run')?.status).toBe('missing');
    expect(data.sources.some(s => s.source === 'queue:absent-run')).toBe(true);
  });
  it('uses a stored army interval instead of counting a report as another sample', async () => {
    const { root, out } = await fixture();
    await raw(out, 'powers', [game(0, 1, { white: 'Haste', black: 'none', uses: [1, 0] }), game(1, 0, { white: 'none', black: 'Haste', uses: [0, 1] })]);
    await writeFile(join(out, 'powers.report.md'), '# Powers\n2 of 2 games, depth 3.\nRules: `{}`\n| power | score vs field | ±95% | ±95% armies | games |\n|---|---|---|---|---|\n| Haste | 100% | 0 | 20 | 2 |\n');
    const data = await buildDataset({ root, sources: [out] });
    const scores = data.measurements.filter(m => m.element === 'Haste' && m.measure === 'score');
    expect(scores).toHaveLength(1); expect(scores[0]).toMatchObject({ sample: 2, error: .2, errorKind: '95% armies interval from stored report' });
  });
});
describe('historic tournament completion targets', () => {
  it('counts mirror-only games once, standard mirrors twice and excludes clashing variants', () => {
    expect(expectedGames({ entrants: ['cards2', 'cards3', 'cards4', 'cards6', 'none'], pairs: 1500, mirror: true, mirrorOnly: true })).toBe(7500);
    expect(expectedGames({ entrants: ['cards6', 'none'], pairs: 7000, mirror: true, mirrorOnly: true })).toBe(14000);
    expect(expectedGames({ entrants: ['Haste', 'none'], pairs: 10, mirror: true })).toBe(60);
    expect(expectedGames({ entrants: ['Haste', 'Haste~vtrim', 'none'], pairs: 10, mirror: false, variants: { trim: { hasteCaptures: false } } })).toBe(40);
  });
});
