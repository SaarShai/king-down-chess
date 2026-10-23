import { describe, expect, it } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED } from '../../rules/rules';
import { boardStates, StateEffects } from './states';
import { fixtures, at } from '../../../docs/specs/effects-animation/preview/signals/fixtures';

const quiet = (value: number) => expect(value).toBe(-Infinity);
describe('real state lifecycle', () => {
  it.each(['freeze', 'ward', 'firewall'] as const)('%s loads quietly, starts once, clears and stays quiet on rewind/replay', id => {
    const f = fixtures[id], s = new StateEffects();
    s.sync(f.rules, f.after, 0, true);
    s.frames.forEach(frame => quiet(frame.since));
    s.sync(f.rules, f.before, 1, true);
    s.sync(f.rules, f.after, 2, true);
    s.frames.forEach(frame => quiet(frame.since));
    const fresh = new StateEffects();
    fresh.sync(f.rules, f.before, 0, true);
    fresh.sync(f.rules, f.after, 10, true);
    expect(fresh.frames.every(frame => frame.since === 10)).toBe(true);
    fresh.sync(f.rules, structuredClone(f.after), 1000, true);
    expect(fresh.frames.every(frame => frame.since === 10)).toBe(true);
    fresh.settle();
    fresh.frames.forEach(frame => quiet(frame.since));
    // Firewall has a free own move before the opponent expires it.
    if (id === 'firewall') {
      const move = f.rules.legalMoves(f.after).find(m => f.rules.toLan(f.after, m) === 'Ra2-d2')!;
      const moved = f.rules.makeMove(f.after, move);
      fresh.sync(f.rules, moved, 1100, true);
      expect(fresh.frames.some(frame => frame.sq === at('d2'))).toBe(true);
      expect(fresh.frames.some(frame => frame.sq === at('a2'))).toBe(false);
      fresh.frames.forEach(frame => quiet(frame.since));
    }
    fresh.sync(f.rules, f.expired!, 1200, true);
    expect(fresh.frames.length).toBeGreaterThan(0);
    expect(fresh.frames.every(frame => frame.clear === 1200 && frame.turns === 0)).toBe(true);
    expect(fresh.materialProgress(fresh.frames[0], 1200, true)).toBe(.72);
    expect(fresh.remaining(2600)).toBe(0);
    expect(fresh.frames).toEqual([]);
    fresh.sync(f.rules, f.after, 3000, true);
    fresh.frames.forEach(frame => quiet(frame.since));
  });

  it('uses the existing Fast setting for bounded state and indication onsets', () => {
    const f = fixtures.freeze, s = new StateEffects();
    s.sync(f.rules, f.before, 0, true); s.sync(f.rules, f.after, 1, true);
    s.signal('swap', '0:1', 1, true);
    s.rate = 2;
    expect(s.materialProgress(s.frames[0], 1009, true)).toBe(.42);
    expect(s.progress('swap', 1201, true)).toBe(.5);
    expect(s.remaining(1801)).toBe(0);
  });

  it('allows new effects in a rematch that keeps its rules context', () => {
    const f = fixtures.freeze, s = new StateEffects();
    s.sync(f.rules, f.before, 0, true); s.sync(f.rules, f.after, 1, true);
    const before = structuredClone(f.before), after = f.rules.makeMove(before, f.move!);
    s.sync(f.rules, before, 100, true); s.sync(f.rules, after, 110, true);
    expect(s.frames[0].since).toBe(110);
    s.sync(f.rules, before, 200, true); s.sync(f.rules, after, 210, true);
    expect(s.frames[0].since).toBe(-Infinity);
  });

  it('never clears a stale volume over an empty, replaced or differently marked square', () => {
    const f = fixtures.freeze, s = new StateEffects();
    s.sync(f.rules, f.after, 0, true);
    const next = structuredClone(f.expired!); next.board[at('d5')] = 0;
    s.sync(f.rules, next, 10, true);
    expect(s.frames).toEqual([]);
  });

  it.each([false, true])('Off/reduced state advances have no onset or expiry work (%s)', initial => {
    const f = fixtures.freeze, s = new StateEffects();
    s.sync(f.rules, initial ? f.after : f.before, 0, false);
    s.sync(f.rules, f.after, 10, false);
    expect(s.remaining(10)).toBe(0);
    expect(s.materialProgress(s.frames[0], 20, false)).toBe(.42);
    s.sync(f.rules, f.expired!, 100, false);
    expect(s.frames).toEqual([]);
  });

  it('settles hidden/skip work and dispose removes all state and signal work', () => {
    const f = fixtures.freeze, s = new StateEffects();
    s.sync(f.rules, f.before, 0, true); s.sync(f.rules, f.after, 1, true);
    s.signal('swap', '1:2', 1, true);
    expect(s.remaining(1)).toBeGreaterThan(0);
    s.settle(); expect(s.remaining(10)).toBe(0); expect(s.progress('swap', 10, true)).toBe(1);
    s.dispose(); expect(s.frames).toEqual([]); expect(s.remaining(10)).toBe(0);
  });
});

describe('protection comes from the current game context', () => {
  it('keeps Guard immunity and the king exception only when the rule enables it', () => {
    const f = fixtures.guard;
    expect(boardStates(f.rules, f.after)).toContainEqual(expect.objectContaining({ kind: 'guard', sq: at('d4'), exception: 'king' }));
    const disabled = new GameRules({ guardImmune: false });
    expect(boardStates(disabled, f.after)).toEqual([]);
    expect(disabled.legalMoves(f.after).some(m => m.captures.includes(at('d4')) && m.from === at('d8'))).toBe(true);
  });

  it('keeps Holy Light orthogonal shelter and Mercy pawn captures exact', () => {
    const h = fixtures.holyLight, m = fixtures.mercy;
    expect(boardStates(h.rules, h.after)).toContainEqual(expect.objectContaining({ kind: 'holy-light', sq: at('e3'), source: at('e2'), exception: undefined }));
    expect(boardStates(m.rules, m.after)).toContainEqual(expect.objectContaining({ kind: 'mercy', sq: at('d3'), source: at('e2'), exception: 'pawn' }));
    expect(m.rules.legalMoves(m.after).some(move => m.rules.toLan(m.after, move) === 'c4xd3')).toBe(true);
    const noShelter = new GameRules({ ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null], holyLightShelter: false });
    expect(boardStates(noShelter, h.after)).toEqual([]);
    const diagonal = structuredClone(h.after); diagonal.board[at('d3')] = diagonal.board[at('e3')]; diagonal.board[at('e3')] = 0;
    expect(boardStates(h.rules, diagonal)).toEqual([]);
    const pawnOnly = new GameRules({ ...m.rules.rules, mercyAuraPawns: true });
    expect(boardStates(pawnOnly, m.after)).toEqual([]);
  });

  it('removes exceptions that a second protection blocks', () => {
    const f = fixtures.mercy, pos = structuredClone(f.after);
    pos.board[at('d3')] = fixtures.guard.after.board[at('d4')];
    const states = boardStates(f.rules, pos);
    expect(states.filter(s => s.sq === at('d3')).map(s => [s.kind, s.exception])).toEqual([['guard', undefined], ['mercy', undefined]]);
    expect(f.rules.legalMoves(pos).some(m => m.captures.includes(at('d3')))).toBe(false);
  });

  it('keeps two mark slots, left zero and wrong-side marks separate', () => {
    const f = fixtures.freeze, rules = new GameRules({ hands: [['Freeze', 'IceWall'], ['Freeze', 'IceWall']] });
    const pos = structuredClone(f.after); pos.marks = [{ sq: at('d5') }, { sq: at('e1') }];
    expect(boardStates(rules, pos).filter(s => s.kind === 'freeze')).toHaveLength(2);
    pos.marks = [{ sq: at('d5'), left: 0 }, { sq: at('e1'), ward: true }];
    expect(boardStates(rules, pos)).toEqual([]);
  });
});
