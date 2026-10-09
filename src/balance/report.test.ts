import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';
import { buildFramework } from './report';
import { readWorkbook } from './workbook';
import type { BalanceDataset } from './dataset';

it('builds the real source report without mixing versions or treating a blank design as measured', () => {
  const output = mkdtempSync(join(tmpdir(), 'balance-report-'));
  try {
    const dataset: BalanceDataset = { schemaVersion: 1, measurements: [], sources: [], runs: [], warnings: [] };
    const workbook = readWorkbook('docs/status/king-down-status-2026-10-09.xlsx', 'docs/status/king-down-status-2026-10-09.xlsx');
    buildFramework(process.cwd(), dataset, workbook, output);
    const status = JSON.parse(readFileSync(join(output, 'status.json'), 'utf8'));
    expect(status.newDesigns).toHaveLength(2);
    expect(status.newDesigns.every((d: { value: unknown; specified: number }) => d.value === null && d.specified === 0)).toBe(true);
    expect(status.models).toHaveLength(2);
    expect(status.models.every((m: { anchors: unknown[]; example: { value: number } }) => m.anchors.length === 5 && m.example.value > 0 && m.example.value < 1)).toBe(true);
    expect(status.statuses.find((s: Record<string, string>) => s.element === 'Archer' && s.criterion === 'piece-captures' && s.version.includes('far2'))).toMatchObject({ evidenceStatus: 'fail', status: 'no-data' });
    expect(status.statuses.find((s: Record<string, string>) => s.element === 'Archer' && s.criterion === 'piece-game')).toMatchObject({ evidenceStatus: 'fail' });
    expect(status.statuses.some((s: Record<string, string>) => s.element === 'MorphP' && s.criterion === 'card-worth')).toBe(true);
    expect(dataset.measurements.find(m => m.id === 'evidence:cards-d1-Rally-worth')).toMatchObject({ sample: 600, sampleUnit: 'games', calibration: { relativeError: 0.25 } });
    expect(readFileSync(join(output, 'FRAMEWORK.md'), 'utf8')).toContain('owner-prompt');
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
