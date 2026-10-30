import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { metadata, validateArchives } from './kaggle/kaggle.mjs';

describe('private Kaggle animation run', () => {
  it('sets the private GPU and input sources', () => {
    const m = metadata('example', 0, 2);
    expect(m.is_private).toBe(true);
    expect(m.enable_gpu).toBe(true);
    expect(m.enable_internet).toBe(false);
    expect(m.dataset_sources).toEqual(['example/kd-anim-movement-keys-20261030']);
    expect(m.model_sources).toEqual(['google/film/tensorFlow2/film/1']);
    expect(() => metadata('example', 2, 2)).toThrow();
  });

  it('rejects a pull that misses a results archive', () => {
    expect(() => validateArchives({ exit: 0, entries: 33 }, ['results-00.tar'])).toThrow();
    expect(() => validateArchives({ exit: 0, entries: 33 }, ['results-00.tar', 'results-01.tar'])).not.toThrow();
  });
});

describe('movement score summary', () => {
  it('counts lower scores and rejects incomplete runs', () => {
    const root = mkdtempSync(join(tmpdir(), 'kd-anim-summary-'));
    try {
      const part = join(root, 'part-0');
      mkdirSync(part);
      writeFileSync(join(part, 'status.json'), JSON.stringify({ exit: 0, part: 0, parts: 1, totalEntries: 1, seconds: 60 }));
      writeFileSync(join(part, 'scores.json'), JSON.stringify([{ entry: { character: 'pawn', army: 'white', direction: 'N' }, folder: 'one', gaps: [{ gap: 0, scores: { rife: [0.1, 0.1, 0.1], film: [0.2, 0.2, 0.2] } }] }]));
      const script = join(process.cwd(), 'tools/anim/kaggle/summary.py');
      execFileSync('python3', [script, root]);
      expect(readFileSync(join(root, 'summary.md'), 'utf8')).toContain('RIFE scores lower on 1 gaps; FILM scores lower on 0');
      writeFileSync(join(part, 'status.json'), JSON.stringify({ exit: 0, part: 0, parts: 2, totalEntries: 1, seconds: 60 }));
      expect(() => execFileSync('python3', [script, root], { stdio: 'pipe' })).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
