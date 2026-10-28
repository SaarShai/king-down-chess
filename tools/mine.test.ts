import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { GameRecord } from '../src/sim/game';
import { leadMetrics as analyserLead } from '../src/sim/analyze';
import { emptyEvents } from '../src/sim/replay';
import { CP_SCALE, DECISION_CP } from '../src/sim/weights';
import { BLACK, WHITE } from '../src/rules/engine';
import { leadMetrics as mineLead } from './mine';

vi.setConfig({ testTimeout: 60_000 });

it('uses the shared lead metric function', () => {
  expect(mineLead).toBe(analyserLead);
});

it('loads the mine when record storage is unavailable', async () => {
  vi.resetModules();
  vi.doMock('../src/sim/spec', () => { throw new Error('Record storage is unavailable'); });
  try { await expect(import('./mine')).resolves.toBeDefined(); }
  finally { vi.doUnmock('../src/sim/spec'); vi.resetModules(); }
});

function hasteRecord(): GameRecord {
  const side = { moves: { R: 1 }, captures: { R: 1 }, taken: {}, survived: { R: 2 }, start: { R: 2 } };
  return {
    result: 1, plies: 3, backRankWhite: 'RNBQKBNR', backRankBlack: 'RNBQKBNR',
    events: emptyEvents(), stats: [side, side],
    moves: [
      { lan: 'e2-e3', by: WHITE, cp: 0, gap: 0, legal: 20, ms: 1 },
      { lan: 'Ra1xa7', by: WHITE, cp: CP_SCALE * Math.log(3), gap: DECISION_CP * Math.log(3), legal: 20, ms: 1 },
      { lan: 'Rh8xh2', by: BLACK, cp: CP_SCALE * Math.log(2), gap: DECISION_CP * Math.log(7), legal: 20, ms: 1 },
    ],
  } as unknown as GameRecord;
}

describe.each([['analyser', analyserLead], ['mine', mineLead]] as const)('%s: recorded Haste players', (_name, metrics) => {
  const rules = [{}, { secondPlayerDoubleFirstTurn: true }];

  it.each(rules)('assigns decision costs to the recorded player under %j', rule => {
    // Gaps give costs log2(2), log2(4/3), log2(8/7). White takes the first two.
    const m = metrics(hasteRecord(), rule);
    const white = 1 + Math.log2(4 / 3), black = Math.log2(8 / 7);
    expect(m.decisionCost[WHITE]).toBeCloseTo(white, 12);
    expect(m.decisionCost[BLACK]).toBeCloseTo(black, 12);
    expect(m.decisionAsymmetry).toBeCloseTo(black - white, 12);
  });

  it.each(rules)('assigns favourable score changes to the recorded player under %j', rule => {
    // Leads are 0, 1/2, 1/3. White gains 1/2; Black gains 1/6. The maximum is 1/2.
    expect(metrics(hasteRecord(), rule).killerMove).toBeCloseTo(1 / 2, 12);
  });

  it('keeps the recorded player when an opening action has no score', () => {
    const rec = hasteRecord();
    delete rec.moves[0].cp;
    expect(metrics(rec).killerMove).toBeCloseTo(1 / 6, 12);
    expect(metrics(rec).decisionCost[WHITE]).toBeCloseTo(1 + Math.log2(4 / 3), 12);
  });
});

it('uses the recorded player in the mine Haste capture map', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kingdown-mine-haste-'));
  try {
    writeFileSync(join(dir, 'haste.jsonl'), `${JSON.stringify(hasteRecord())}\n`);
    const output = execFileSync(process.execPath,
      ['--import', 'tsx', 'tools/mine.ts', '--runs', 'haste', '--min', '1', '--section', '2'],
      { encoding: 'utf8', env: { ...process.env, KING_DOWN_RESULTS_DIR: dir }, timeout: 45_000 });
    const heat = output.split('## 2e.')[1].split('\n');
    const row = (rank: number) => heat.find(line => line.startsWith(`${rank} `))?.trim().split(/\s+/);
    // Both captures land on rank 7 from the capturing player's view: White a7, Black h2.
    expect(row(7)).toEqual(['7', '1', '0', '0', '0', '0', '0', '0', '1']);
    expect(row(2)).toEqual(['2', '0', '0', '0', '0', '0', '0', '0', '0']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
