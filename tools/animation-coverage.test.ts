import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const script = fileURLToPath(new URL('./animation-coverage.py', import.meta.url));

it('counts distinct cases and documented sheets without promoting drafts or package membership', () => {
  const dir = mkdtempSync(join(tmpdir(), 'movement-coverage-'));
  try {
    const entries: object[] = [];
    const add = (id: string, army: string, direction: string, status: string, sheet?: string) => {
      const raw = JSON.stringify({ status, frames: sheet ? [{ sourceSheetSha256: sheet }] : [] });
      writeFileSync(join(dir, id), raw);
      entries.push({ character: 'pawn', army, direction, status, kind: 'movement-study', manifest: id,
        sha256: createHash('sha256').update(raw).digest('hex') });
    };
    add('a', 'white', 'SE', 'draft', 'sheet-a');
    add('b', 'white', 'SE', 'draft', 'sheet-a');
    add('c', 'black', 'SE', 'draft', 'sheet-a');
    add('missing', 'white', 'N', 'missing');
    add('pending', 'white', 'NE', 'awaiting-human-playback-review');
    const catalog = join(dir, 'catalog.json'), runtime = join(dir, 'runtime.json');
    writeFileSync(catalog, JSON.stringify({ entries }));
    writeFileSync(runtime, JSON.stringify({ banks: [] }));
    const run = () => spawnSync('python3', ['-B', script, catalog, runtime], { encoding: 'utf8' });
    let result = run();
    expect(result.status, result.stderr).toBe(0);
    let report = JSON.parse(result.stdout);
    expect(report.requiredCases).toBe(272);
    expect(report.recordsByStatus).toEqual({ 'awaiting-human-playback-review': 1, draft: 3, missing: 1 });
    expect(report.casesByStatus).toEqual({ 'awaiting-human-playback-review': 1, draft: 2, missing: 1 });
    expect(report.duplicateCases).toEqual({ 'pawn:white:SE': ['draft', 'draft'] });
    expect(report.absentCases).not.toContain('pawn:white:N');
    expect(report.absentCases).toContain('pawn:black:N');
    expect(report.selectedFrameSourceSheetHashes).toBe(1);
    expect(report.recordsWithSelectedFrameSourceSheetHash).toBe(3);
    expect(report.authoredPoseSets).toBeNull();
    expect(report.provenReusableMovementClips).toBe(0);
    expect(report.coveredGameCases).toBe(0);

    writeFileSync(runtime, JSON.stringify({ banks: [{ kind: 'movement' }] }));
    report = JSON.parse(run().stdout);
    expect(report.readyMovementRecords).toBe(0);
    expect(report.packagedMovementRecords).toBe(1);
    expect(report.provenReusableMovementClips).toBeNull();
    expect(report.coveredGameCases).toBeNull();

    writeFileSync(runtime, JSON.stringify({ banks: [] }));
    add('ready', 'black', 'N', 'ready', 'sheet-b');
    writeFileSync(catalog, JSON.stringify({ entries }));
    report = JSON.parse(run().stdout);
    expect(report.casesByStatus.ready).toBe(1);
    expect(report.packagedMovementRecords).toBe(0);
    expect(report.provenReusableMovementClips).toBeNull();
    expect(report.coveredGameCases).toBeNull();

    writeFileSync(runtime, JSON.stringify({ banks: [{ kind: 'movement' }] }));
    report = JSON.parse(run().stdout);
    expect(report.provenReusableMovementClips).toBeNull();
    expect(report.coveredGameCases).toBeNull();

    writeFileSync(join(dir, 'ready'), '{}');
    result = run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('bank hash mismatch');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
