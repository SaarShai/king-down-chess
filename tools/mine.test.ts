import { describe, expect, it } from 'vitest';
import type { GameRecord } from '../src/sim/game';
import { leadMetrics as analyserLead } from '../src/sim/analyze';
import { leadMetrics as mineLead } from './mine';

// `tools/mine.ts` keeps its own copy of `leadMetrics` (see its header). This test pins the copy to the
// analyser: same fixed records, same rules, every field equal.
const CPS = [undefined, undefined, 20, -40, 90, 150, -30, -220, 310, 40, -120, 480, 600, -90, 700, 900];
const GAPS = [undefined, undefined, 5, 30, 0, 12, 80, 3, 45, 9, 0, 200, 15, 60, 2, 25];

function record(result: GameRecord['result'], rules?: GameRecord['rules']): GameRecord {
  const moves = CPS.map((cp, i) => ({
    lan: 'a1a2', legal: 20, ms: 1,
    ...(cp === undefined ? {} : { cp }),
    ...(GAPS[i] === undefined ? {} : { gap: GAPS[i] }),
  }));
  return { moves, result, plies: moves.length, ...(rules ? { rules } : {}) } as unknown as GameRecord;
}

const CASES: [string, GameRecord][] = [
  ['default rules, white wins', record(1)],
  ['default rules, black wins', record(0)],
  ['default rules, draw', record(0.5)],
  ['double first turn, white wins', record(1, { secondPlayerDoubleFirstTurn: true })],
  ['double first turn, black wins', record(0, { secondPlayerDoubleFirstTurn: true })],
  ['one eval only (short record)', { ...record(1), moves: record(1).moves.slice(0, 3) }],
];

describe('mine leadMetrics parity with the analyser', () => {
  it.each(CASES)('%s', (_name, rec) => {
    const a = analyserLead(rec), m = mineLead(rec);
    expect(Object.keys(m).sort()).toEqual(Object.keys(a).sort());
    expect(m).toEqual(a);
  });

  it('an explicit rules argument gives equal results too', () => {
    const rec = record(1);
    for (const rules of [{}, { secondPlayerDoubleFirstTurn: true }]) {
      expect(mineLead(rec, rules)).toEqual(analyserLead(rec, rules));
    }
  });

  it('the fixture exercises decision cost and the rule changes it', () => {
    const plain = analyserLead(record(1)), dbl = analyserLead(record(1), { secondPlayerDoubleFirstTurn: true });
    expect(plain.decisionCost[0]).toBeGreaterThan(0);
    expect(plain.decisionCost[1]).toBeGreaterThan(0);
    expect(dbl.decisionCost).not.toEqual(plain.decisionCost);
    expect(dbl.killerMove).not.toBe(plain.killerMove);
  });
});
