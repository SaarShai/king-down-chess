import { describe, expect, it } from 'vitest';
import { createMatch, loadMatch, type LocalMatch } from '../../src/match';
import { DEAL_CARDS, POOL_KINDS } from '../../src/match/setup';
import { KINGS } from '../../src/rules/rules';
import { SHARED_MECHANICS, assertMechanicExpected } from './shared-mechanics';

it('covers the actual released rosters once, with unique fixture IDs and explicit complete turns', () => {
  const items = (family: string) => SHARED_MECHANICS.filter(row => row.family === family).map(row => row.item).sort();
  expect(items('fairy')).toEqual(POOL_KINDS.filter(kind => !'QRBN'.includes(kind)).sort());
  expect(items('card')).toEqual([...DEAL_CARDS].sort());
  expect(items('power')).toEqual(Object.values(KINGS).flat().sort());
  expect(new Set(SHARED_MECHANICS.map(row => row.id)).size).toBe(SHARED_MECHANICS.length);
  for (const row of SHARED_MECHANICS) {
    expect(row.actions.length, row.id).toBeGreaterThan(0);
    expect(row.expected.board, row.id).toBeDefined();
    expect(row.expected.turn, row.id).toBeDefined();
    expect(row.turns?.flat() ?? row.actions, row.id).toEqual(row.actions);
    expect(row.setup.fen?.split(' ')[1], row.id).toBe('w');
  }
});

describe('shared mechanics through real matches and saved continuation', () => {
  it.each(SHARED_MECHANICS)('$id', async row => {
    let match: LocalMatch | undefined;
    try {
      match = await createMatch(row.setup);
      let snapshot = await match.snapshot(), after = 0;
      expect(snapshot.turn).toBe(0);
      for (const turn of row.turns ?? [row.actions]) {
        const actor = snapshot.turn;
        for (const [index, lan] of turn.entries()) {
          expect(snapshot.legal, `${row.id}: ${lan}`).toContain(lan);
          snapshot = await match.apply({ id: `${row.id}-${after}`, expectedRevision: snapshot.revision, lan });
          after++;
          for (const checkpoint of row.checkpoints ?? []) if (checkpoint.after === after) assertMechanicExpected(snapshot, checkpoint.expected, `${row.id} after ${after}`);
          if (index < turn.length - 1) expect(snapshot.turn, `${row.id}: incomplete turn`).toBe(actor);
          else if (snapshot.status === 'playing') expect(snapshot.turn, `${row.id}: complete turn`).not.toBe(actor);
          // Reload also between actions: a pending second move or free mark must survive.
          const restored = await loadMatch(await match.exportSave());
          await match.close(); match = restored;
          expect(await match.snapshot()).toEqual(snapshot);
        }
      }
      expect(snapshot.history).toEqual(row.actions);
      expect(snapshot.revision).toBe(row.actions.length);
      assertMechanicExpected(snapshot, row.expected, row.id);
    } finally { await match?.close(); }
  }, 15_000);
});
