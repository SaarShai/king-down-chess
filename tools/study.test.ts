import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, truncateSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { MAX_STUDY_BYTES, readStudyFile, saveStudyFile, runStudy } from './study';
import { studySource } from './lib/study-source';
import { openStudy } from '../src/study/session';

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
