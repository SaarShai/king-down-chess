import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, RULES, setRules } from '../rules/rules';
import { fromFen } from '../rules/setup';
import { createStudy, parseStudy, positionData, type Study } from './model';
import { openStudy } from './session';
function fixture(): Study {
  return createStudy({ id: 'rook', version: 1, parentVersion: null, title: 'Rook', question: 'Can it move?', engine: 'test-source', rules: structuredClone(DEFAULT_RULES),
    start: positionData(fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1')), prefix: [], actions: [], origin: 'constructed' });
}
describe('saved study session', () => {
  it('replays legal actions and keeps exact counters across save and undo', () => {
    const study = fixture(); study.start.ply = 17; study.start.move = 4;
    const session = openStudy(study, 'test-source');
    const before = session.snapshot();
    session.play(before.legal.find(l => l === 'Rd4-d5')!);
    const saved = session.exportStudy();
    expect(openStudy(JSON.parse(JSON.stringify(saved)), 'test-source').snapshot()).toEqual(session.snapshot());
    expect(session.snapshot().position.ply).toBe(18);
    expect(session.undo()).toBe(true); expect(session.snapshot()).toEqual(before); expect(session.undo()).toBe(false);
  });
  it('keeps an extra action on the same turn and restores exact ply', () => {
    const s = fixture(); s.rules.hands = [['Haste'], []];
    const session = openStudy(s, 'test-source');
    const first = session.snapshot().legal.find(l => l === 'Rd4-d5!H');
    expect(first).toBeDefined(); session.play(first!);
    const current = session.snapshot();
    expect(current.position.turn).toBe(0); expect(current.position.ply).toBe(1);
    expect(openStudy(JSON.parse(JSON.stringify(session.exportStudy())), 'test-source').snapshot()).toEqual(current);
    session.play('--'); expect(session.snapshot().position.turn).toBe(1);
    expect(session.undo()).toBe(true); expect(session.snapshot()).toEqual(current);
  });
  it('keeps prefix history and does not undo past the scenario', () => {
    const s = fixture(); s.prefix = ['Rd4-d5'];
    const session = openStudy(s, 'test-source');
    expect(session.snapshot().history).toEqual(['Rd4-d5']); expect(session.undo()).toBe(false);
  });
  it('opens a constructed boundary after GrowthB or a held turn that gives check', () => {
    const s = fixture(); s.rules.hands = [['GrowthB'], []]; s.rules.piles = [['Freeze'], []];
    const growth = openStudy(s, 'test-source'); growth.play('!G+');
    const start = growth.snapshot().position;
    expect(start.free).toBe(true); expect(s.rules.markFree).toBe(false);
    expect(openStudy({ ...s, start }, 'test-source').snapshot().position).toEqual(start);
    s.rules.hands = [['Haste'], []]; s.rules.piles = [[], []];
    const haste = openStudy(s, 'test-source'); haste.play('Rd4-h4!H');
    const checked = haste.snapshot().position;
    expect(openStudy({ ...s, start: checked }, 'test-source').snapshot().position).toEqual(checked);
  });
  it('refuses a drawn card past the engine hand limit', () => {
    const s = fixture(); s.rules.hands = [Array(8).fill('Freeze'), []]; s.rules.piles = [['Haste'], []];
    s.start.drawn = [1, 0]; s.start.used = [255, 0];
    expect(() => openStudy(s, 'test-source')).toThrow('hand limit');
  });
  it('does not share nested state with input, snapshots, exports or another session', () => {
    const s = fixture(), one = openStudy(s, 'test-source'), two = openStudy(s, 'test-source');
    s.rules.hands = [['Freeze'], []]; s.start.board.fill(0);
    const exported = one.exportStudy(); exported.rules.hands = [['Haste'], []]; exported.start.board.fill(0);
    const snapshot = one.snapshot(); snapshot.position.board.fill(0); snapshot.legal.length = 0;
    expect(one.snapshot()).toEqual(two.snapshot());
  });
  it('refuses malformed, unsupported and illegal imports without changing rules or a live session', () => {
    const s = fixture(), live = openStudy(s, 'test-source'), before = live.snapshot();
    setRules({ archerChecks: false }); const rules = structuredClone(RULES);
    try {
      for (const bad of [{ ...s, extra: true }, { ...s, schema: 'kingdown-study/2' }, { ...s, version: 0 }, { ...s, actions: ['Rd4-e5'] }, { ...s, engine: 'other' }, { ...s, origin: 'game' }, { ...s, rules: { ...s.rules, hands: [['Freeze'], []], kings: [{ king: 'Flame', power: 'Haste' }, null] } }]) {
        expect(() => openStudy(bad, 'test-source')).toThrow(); expect(RULES).toEqual(rules);
      }
      expect(live.snapshot()).toEqual(before); expect(RULES).toEqual(rules);
    } finally { setRules(); }
  });
  it('rejects terminal actions and unknown position fields', () => {
    const s = fixture(); s.start.halfmove = 100;
    const session = openStudy(s, 'test-source'); expect(session.snapshot().legal).toEqual([]);
    expect(() => session.play('Rd4-d5')).toThrow('terminal');
    expect(() => parseStudy({ ...s, start: { ...s.start, mystery: 2 } })).toThrow();
  });
  it('keeps null tuple slots, spent pieces and all state through JSON', () => {
    const s = fixture(); s.start.board[27] = 41;
    Object.assign(s.start, { used: [1, 0], marks: [null, { sq: 27, left: 0, ward: true }], last: [null, 'Haste'], drawn: [0, 0], lost: Array(32).fill(0), waiting: [1, 0] });
    const saved = openStudy(s, 'test-source').exportStudy();
    expect(parseStudy(JSON.parse(JSON.stringify(saved))).start).toEqual(s.start);
  });
  it('keeps rook moves blocked and pinned for either color', () => {
    for (const fen of ['7k/8/8/8/3RP3/8/8/K7 w - - 0 1', 'k7/8/8/3rp3/8/8/8/7K b - - 0 1']) {
      const s = fixture(); s.start = positionData(fromFen(fen));
      const state = openStudy(s, 'test-source').snapshot();
      expect(state.legal.some(l => l.startsWith(fen.startsWith('7k') ? 'Rd4-f4' : 'Rd5-f5'))).toBe(false);
    }
    const s = fixture(); s.start = positionData(fromFen('k2r4/8/8/8/3R4/8/8/3K4 w - - 0 1'));
    expect(openStudy(s, 'test-source').snapshot().legal).not.toContain('Rd4-e4');
  });
});
