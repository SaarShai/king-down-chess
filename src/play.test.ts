import { afterEach, beforeEach, expect, it } from 'vitest';
import { legalMoves, setRules } from './rules/engine';
import { fromFen, startPosition, toLan } from './rules/setup';
import { skillPlan } from './ai/skill';
import { momentText } from './moment';
import { TRY_THESE } from './try-these';

beforeEach(() => setRules()); afterEach(() => setRules());
it('skills retain the chosen budget and opening policy without claiming ratings', () => {
  expect(skillPlan('club', 2000, 10)).toMatchObject({ timeMs: 800, temperature: 0, blunder: 0 });
  expect(skillPlan('strong', 2000, 10)).toMatchObject({ timeMs: 2000, temperature: 0, blunder: 0 });
  expect(skillPlan('club', 800, 0)).toEqual(skillPlan('strong', 800, 0));
  for (const level of ['beginner', 'casual'] as const) {
    const plan = skillPlan(level, 200, 10);
    expect(plan.timeMs).toBeLessThanOrEqual(200);
    expect(plan.temperature).toBeGreaterThan(0);
    expect(plan.blunder).toBeGreaterThan(0);
  }
});
it.each([
  ['7k/8/8/2p5/8/2A5/8/4K3 w - - 0 1', 'Ac3*c5', 'archer'],
  ['8/8/4p3/8/4k3/8/4C3/7K w - - 0 1', 'Ce2*e6', 'catapult'],
  ['7k/8/8/8/8/8/8/MN5K w - - 0 1', 'Ma1<>b1', 'maester'],
  ['k7/8/8/8/8/8/3L2n1/K7 w - - 0 1', 'Ld2xg2', 'paladin'],
])('previews do not consume first-time captions: %s', (fen, lan, name) => {
  const pos = fromFen(fen), move = legalMoves(pos).find(m => toLan(pos, m) === lan)!;
  const seen = new Set<string>();
  const preview = momentText(pos, move, seen, true);
  expect(preview).toBeTruthy(); expect(seen.size).toBe(0);
  expect(momentText(pos, move, seen)).toContain(name);
  expect(momentText(pos, move, seen)).toBeNull();
  expect(momentText(pos, move, seen, true)).toBe(preview);
});
it('practice rows are valid and label their experimental piece', () => {
  for (const row of TRY_THESE) {
    expect(startPosition(row.code).board.filter(Boolean)).toHaveLength(32);
    if (row.code.includes('C')) expect(row.watch).toContain('Catapult lab');
  }
});
