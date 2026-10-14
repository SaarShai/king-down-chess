import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, truncateSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { MAX_STUDY_BYTES, readStudyFile, saveStudyFile, runStudy } from './study';
import { studySource } from './lib/study-source';
import { openStudy } from '../src/study/session';
import { exampleStudies } from '../src/study/examples';
import { parseResearch, researchStatus } from '../src/study/evidence';
import { studyOf } from '../src/study/browser-service';
import { unknownContext } from '../src/balance/measurements';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, writeFileSync: vi.fn(actual.writeFileSync) };
});

const dirs: string[] = [];
function temp(): string { const dir = mkdtempSync(resolve(tmpdir(), 'study-test-')); dirs.push(dir); return dir; }
afterEach(() => { vi.restoreAllMocks(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
describe('study file boundary', () => {
  it('refuses oversized input before JSON parse', () => {
    const path = resolve(temp(), 'large.json');
    writeFileSync(path, '{'); truncateSync(path, MAX_STUDY_BYTES + 1);
    expect(() => readStudyFile(path)).toThrow('exceeds 1 MiB');
  });
  it('never overwrites an existing output', () => {
    const path = resolve(temp(), 'saved.json');
    writeFileSync(path, 'keep');
    expect(() => saveStudyFile(path, { replacement: true })).toThrow();
    expect(readFileSync(path, 'utf8')).toBe('keep');
    expect(readdirSync(resolve(path, '..'))).toEqual(['saved.json']);
  });
  it('does not publish a partial file when a write fails', async () => {
    const dir = temp(), path = resolve(dir, 'failed.json');
    const { writeFileSync: write } = await vi.importActual<typeof import('node:fs')>('node:fs');
    vi.mocked(fs.writeFileSync).mockImplementationOnce((target) => { write(target, '{partial'); throw new Error('Disk full'); });
    expect(() => saveStudyFile(path, { result: 'complete' })).toThrow('Disk full');
    expect(readdirSync(dir)).toEqual([]);
    saveStudyFile(path, { result: 'complete' });
    expect(readStudyFile(path)).toEqual({ result: 'complete' });
  });
  it('reports malformed commands as failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(runStudy(['play', 'file.json', 'a1a2'])).toBe(1);
    expect(runStudy(['inspect', 'file.json', '--out', 'other.json'])).toBe(1);
  });
});
it('fingerprints local dependencies but ignores tests and examples', () => {
  const root = temp();
  for (const dir of ['src/rules', 'src/ai', 'src/workshop', 'src/study']) mkdirSync(resolve(root, dir), { recursive: true });
  for (const file of ['src/rules/rules.ts', 'src/ai/eval.ts', 'src/game.ts', 'src/workshop/model.ts', 'src/study/model.ts', 'src/study/session.ts', 'src/study/check.ts', 'package-lock.json']) writeFileSync(resolve(root, file), '');
  writeFileSync(resolve(root, 'src/workshop/model.ts'), "import { value } from './value';");
  writeFileSync(resolve(root, 'src/workshop/value.ts'), 'export const value = 1;');
  const first = studySource(root);
  writeFileSync(resolve(root, 'src/rules/rules.test.ts'), 'test change');
  writeFileSync(resolve(root, 'src/study/examples.ts'), 'example change');
  expect(studySource(root)).toBe(first);
  writeFileSync(resolve(root, 'src/workshop/value.ts'), 'export const value = 2;');
  expect(studySource(root)).not.toBe(first);
});

it('keeps test checks safe and saves each study change to a new version', () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const dir = temp(), examples = resolve(dir, 'examples');
  expect(runStudy(['examples', '--out', examples])).toBe(0);
  const input = resolve(examples, readdirSync(examples)[0]);
  const wrapper = readStudyFile(input) as { study: { version: number; actions: string[] } };
  const plain = resolve(dir, 'plain.json'), next = resolve(dir, 'next.json'), undone = resolve(dir, 'undone.json');
  expect(runStudy(['undo', input, '--out', next])).toBe(1);
  expect(runStudy(['extract', input, '--out', plain])).toBe(0);
  const study = readStudyFile(plain);
  const session = openStudy(study, studySource());
  const move = session.snapshot().legal[0];
  expect(move).toBeTruthy();
  expect(runStudy(['play', plain, move, '--out', next])).toBe(0);
  expect(readStudyFile(next)).toMatchObject({ version: wrapper.study.version + 1, parentVersion: wrapper.study.version });
  expect(runStudy(['undo', next, '--out', undone])).toBe(0);
  expect(readStudyFile(undone)).toMatchObject({ version: wrapper.study.version + 2, parentVersion: wrapper.study.version + 1, actions: wrapper.study.actions });
  expect(readStudyFile(input)).toEqual(wrapper);
});

it('prepares a plan, previews jobs and links exact exported evidence without launching games', () => {
  vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {});
  const dir = temp(), input = resolve(dir, 'study.json'), request = resolve(dir, 'request.json'), plan = resolve(dir, 'plan.json');
  const jobs = resolve(dir, 'jobs.json'), dataset = resolve(dir, 'measurements.json'), linked = resolve(dir, 'linked.json');
  saveStudyFile(input, exampleStudies(studySource())[0]);
  saveStudyFile(request, { recipe: 'activity', start: 'population', seed: 10, pairs: 2, depth: 1, pool: 'TTTTTTT' });
  expect(runStudy(['plan', input, request, '--out', plan])).toBe(0);
  expect(researchStatus(parseResearch(readStudyFile(plan))).plan).toBe('current');
  expect(runStudy(['preview', plan, '--out', jobs])).toBe(0);
  expect((readStudyFile(jobs) as { jobs: unknown[] }).jobs).toHaveLength(4);
  const row = { id: 'historic', run: 'old-run', element: 'R', version: null, context: unknownContext(), measure: 'pawnWorth', value: 5,
    error: null, errorKind: null, sample: 10, sampleUnit: 'pairs', unit: 'pawns', validity: 'incomplete', reasons: ['One part is missing'], sources: ['report.md'], method: 'Paired estimate' };
  saveStudyFile(dataset, { schemaVersion: 1, measurements: [row] });
  expect(runStudy(['evidence', plan, dataset, '--run', 'absent', '--out', linked])).toBe(1);
  expect(runStudy(['evidence', plan, dataset, '--run', 'old-run', '--element', 'R', '--out', linked])).toBe(0);
  const saved = parseResearch(readStudyFile(linked));
  expect(saved.evidence[0].measurements).toEqual([row]);
  expect(saved.evidence[0].source.sha256).toBe(createHash('sha256').update(readFileSync(dataset)).digest('hex'));
  expect(runStudy(['check', linked])).toBe(0);
  expect(runStudy(['evidence', linked, dataset, '--run', 'old-run', '--out', resolve(dir, 'duplicate.json')])).toBe(1);
  const resaved = structuredClone(saved); resaved.document = { ...exampleStudies(studySource())[0], study: { ...exampleStudies(studySource())[0].study, version: 2, parentVersion: 1 } };
  saveStudyFile(resolve(dir, 'resaved.json'), resaved);
  expect(runStudy(['preview', resolve(dir, 'resaved.json'), '--out', resolve(dir, 'resaved-jobs.json')])).toBe(0);
  expect(JSON.parse(readFileSync(resolve(dir, 'resaved-jobs.json'), 'utf8')).fingerprint).toBe(saved.plan!.fingerprint);
  const stale = structuredClone(resaved); studyOf(stale).question += ' changed';
  saveStudyFile(resolve(dir, 'stale.json'), stale);
  expect(runStudy(['preview', resolve(dir, 'stale.json'), '--out', resolve(dir, 'stale-jobs.json')])).toBe(1);
  for (const field of ['seed', 'games', 'context'] as const) {
    const changed = structuredClone(saved);
    if (field === 'seed') changed.plan!.definition.request.seed++;
    else if (field === 'games') changed.plan!.games++;
    else changed.plan!.contexts[0].specKey = 'wrong';
    const bad = resolve(dir, `bad-${field}.json`); saveStudyFile(bad, changed);
    expect(runStudy(['preview', bad, '--out', resolve(dir, `bad-${field}-jobs.json`)])).toBe(1);
  }
});
