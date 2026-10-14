import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { unknownContext } from '../balance/measurements';
import { exampleStudies } from './examples';
import { createResultImporter, MAX_RESULT_BYTES, planMeasurements, verifyMeasurementPlan } from './measurement-service';

function row(id = 'first', run = 'run') {
  return { id, run, element: 'R', version: null, context: { ...unknownContext(), settings: { complete: { values: [1, 2, 3] } } }, measure: 'pawnWorth',
    value: 5.3, error: .4, errorKind: '95%', sample: 20, sampleUnit: 'arrangements', unit: 'pawns', validity: 'unverified',
    reasons: ['Keep original status'], sources: ['report.md'], method: 'Paired worth', interval: { low: 4.9, high: 5.7, kind: '95%' } };
}
function file(rows: unknown[] = [row()]) { return new Blob([JSON.stringify({ schemaVersion: 1, measurements: rows })]); }
describe('local result file service', () => {
  it('hashes original bytes and keeps full selected metadata', async () => {
    const service = createResultImporter(), text = '  ' + JSON.stringify({ schemaVersion: 1, measurements: [row()] }) + '\n';
    const cat = await service.open(new Blob([text]), 'local.json');
    expect(cat.source).toEqual({ path: 'local.json', sha256: createHash('sha256').update(text).digest('hex') });
    expect(cat).toMatchObject({ total: 1, runCount: 1, runs: [{ run: 'run', count: 1 }] });
    const selected = service.select(cat.token, ['first']);
    expect(selected.measurements).toEqual([row()]);
    expect(selected).toMatchObject({ source: cat.source, approval: 'not-reviewed', verification: 'measurement-export' });
    selected.measurements[0].context.settings = null;
    expect(service.rows(cat.token, { run: 'run' }).rows).toEqual([row()]);
    const bundle = await service.open(new Blob([JSON.stringify(selected)]), 'bundle.json');
    expect(bundle.source.path).toBe('bundle.json');
    expect(bundle.source.sha256).not.toBe(cat.source.sha256);
  });
  it('bounds runs and rows, filters elements, and handles prototype names', async () => {
    const service = createResultImporter(), rows = Array.from({ length: 205 }, (_, i) => row(String(i), '__proto__'));
    rows.push({ ...row('constructor', 'constructor'), element: 'N' });
    const cat = await service.open(file(rows));
    expect(service.rows(cat.token, { run: '__proto__' }).rows).toHaveLength(100);
    expect(service.rows(cat.token, { run: '__proto__', offset: 200 })).toMatchObject({ total: 205, rows: rows.slice(200, 205) });
    expect(service.rows(cat.token, { run: 'constructor', element: 'R' }).total).toBe(0);
    expect(service.select(cat.token, ['constructor']).measurements[0].id).toBe('constructor');
    for (const query of [{ limit: 101 }, { offset: -1 }, { limit: 1.5 }]) expect(() => service.runs(cat.token, query)).toThrow();
    const many = await service.open(file(Array.from({ length: 201 }, (_, i) => row(String(i), String(i)))));
    expect(many.runs).toHaveLength(100);
    expect(service.runs(many.token, { offset: 200 }).runs).toEqual([{ run: '200', count: 1 }]);
  });
  it('rejects malformed files and duplicate IDs atomically', async () => {
    const service = createResultImporter(), cat = await service.open(file());
    for (const bad of [new Blob(['{']), file([row(), row()]), file([{ ...row(), unexpected: true }]), new Blob(['{"schemaVersion":2,"measurements":[]}']), new Blob([new Uint8Array([255])])]) {
      await expect(service.open(bad)).rejects.toThrow();
      expect(service.select(cat.token, ['first']).measurements).toEqual([row()]);
    }
    await expect(service.open({ size: MAX_RESULT_BYTES + 1 } as Blob)).rejects.toThrow('64 MiB');
    class Oversize extends Blob { override get size() { return MAX_RESULT_BYTES + 1; } override arrayBuffer(): Promise<ArrayBuffer> { throw new Error('Must not read'); } }
    await expect(service.open(new Oversize())).rejects.toThrow('64 MiB');
    expect(() => service.select(cat.token, ['first', 'first'])).toThrow('Duplicate');
    expect(() => service.select(cat.token, ['missing'])).toThrow('does not exist');
    expect(() => service.select(cat.token, [])).toThrow('1 to 500');
    expect(() => service.select(cat.token, Array(501).fill('first'))).toThrow('1 to 500');
  });
  it('selects 500 rows from a larger file and checks row names', async () => {
    const service = createResultImporter(), cat = await service.open(file(Array.from({ length: 601 }, (_, i) => row(String(i)))));
    expect(service.select(cat.token, Array.from({ length: 500 }, (_, i) => String(i))).measurements).toHaveLength(500);
    for (const bad of [{ ...row(), id: 3 }, { ...row(), run: null }, { ...row(), id: '' }]) await expect(service.open(file([bad]))).rejects.toThrow();
    expect(service.select(cat.token, ['0']).measurements).toHaveLength(1);
  });
  it('rejects stale tokens and clears a pending open', async () => {
    const service = createResultImporter(), first = await service.open(file());
    const second = await service.open(file([row('next')]));
    expect(() => service.select(first.token, ['first'])).toThrow('changed');
    service.clear(); expect(() => service.rows(second.token, { run: 'run' })).toThrow('closed');
    const older = service.open(file([row('older')])), newer = service.open(file([row('newer')]));
    await expect(older).rejects.toThrow('replaced or cleared');
    const newest = await newer; expect(service.select(newest.token, ['newer']).measurements[0].id).toBe('newer');
    const opening = service.open(file()); service.clear();
    await expect(opening).rejects.toThrow('replaced or cleared');
  });
});
describe('worker plan service', () => {
  it('returns compact plans and verifies all saved fields', async () => {
    const input = exampleStudies('source')[0];
    const result = await planMeasurements(input, { recipe: 'activity', start: 'population', seed: 12, pairs: 2, depth: 1, pool: 'TTTTTTT' }, 'source');
    expect(result.plan.games).toBe(4); expect(result.preview.missingResults).toBe(4);
    expect('jobs' in result).toBe(false);
    expect(await verifyMeasurementPlan(result.plan, 'source')).toEqual(result);
    for (const change of [{ source: 'other' }, { games: 100 }, { limits: [] }, { fingerprint: 'a'.repeat(64) }, { definition: { ...result.plan.definition, request: { ...result.plan.definition.request, seed: 99 } } }, { contexts: [{ ...result.plan.contexts[0], pool: 'NNNNNNN' }] }]) {
      await expect(verifyMeasurementPlan({ ...result.plan, ...change }, 'source')).rejects.toThrow('changed');
    }
    await expect(verifyMeasurementPlan(result.plan, 'new-source')).rejects.toThrow('changed');
  });
});
