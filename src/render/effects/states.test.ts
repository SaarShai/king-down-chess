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

  it.each(['freeze', 'ward', 'firewall'] as const)('%s keeps entry, hold and expiry across fresh equivalent rules', id => {
    const f = fixtures[id], s = new StateEffects();
    const rules = () => new GameRules(f.rules.rules);
    s.sync(rules(), f.before, 0, true);
    s.sync(rules(), f.after, 10, true);
    expect(s.forward).toBe(true);
    expect(s.frames.length).toBeGreaterThan(0);
    expect(s.frames.every(frame => frame.since === 10 && frame.clear == null)).toBe(true);
    expect(s.materialProgress(s.frames[0], 10, true)).toBe(0);

    const frames = s.frames;
    s.signal('check', 'e1', 10, true);
    s.sync(rules(), structuredClone(f.after), 100, true);
    expect(s.frames).toBe(frames);
    expect(s.progress('check', 100, true)).toBeLessThan(1);
    expect(s.materialProgress(s.frames[0], 2100, true)).toBe(.42);
    if (id === 'firewall') {
      const move = f.rules.legalMoves(f.after).find(m => f.rules.toLan(f.after, m) === 'Ra2-d2')!;
      s.sync(rules(), f.rules.makeMove(f.after, move), 2200, true);
      expect(s.frames.some(frame => frame.sq === at('d2'))).toBe(true);
      expect(s.frames.some(frame => frame.sq === at('a2'))).toBe(false);
      expect(s.frames.every(frame => frame.since === 10 && frame.clear == null)).toBe(true);
    }

    s.sync(rules(), f.expired!, 2300, true);
    expect(s.forward).toBe(true);
    expect(s.frames.length).toBeGreaterThan(0);
    expect(s.frames.every(frame => frame.clear === 2300 && frame.turns === 0)).toBe(true);
    expect(s.materialProgress(s.frames[0], 2300, true)).toBe(.72);
    expect(s.remaining(3700)).toBe(0);
    expect(s.frames).toEqual([]);
  });

  it('keeps seen positions quiet across fresh rules, but permits a new rematch and resets on dispose', () => {
    const f = fixtures.freeze, s = new StateEffects();
    const rules = () => new GameRules(f.rules.rules);
    s.sync(f.rules, f.before, 0, true); s.sync(f.rules, f.after, 10, true);
    const copy = structuredClone(f.after);
    s.sync(rules(), copy, 20, true);
    for (const after of [f.after, copy]) {
      s.sync(rules(), f.before, 100, true); s.sync(rules(), after, 110, true);
      expect(s.forward).toBe(false);
      s.frames.forEach(frame => quiet(frame.since));
    }
    const before = structuredClone(f.before), after = f.rules.makeMove(before, f.move!);
    s.sync(rules(), before, 200, true); s.sync(rules(), after, 210, true);
    expect(s.frames[0].since).toBe(210);
    s.dispose();
    s.sync(rules(), f.after, 300, true);
    expect(s.forward).toBe(false);
    s.frames.forEach(frame => quiet(frame.since));
    s.dispose();
    s.sync(rules(), f.before, 400, true); s.sync(rules(), f.after, 410, true);
    expect(s.frames[0].since).toBe(410);
  });

  it.each(['hold', 'expiry'])('a real rule change resets %s quietly even when the position still fits the prior game', phase => {
    const f = fixtures.freeze, s = new StateEffects();
    s.sync(f.rules, f.before, 0, true); s.sync(f.rules, f.after, 10, true);
    s.signal('check', 'e1', 10, true);
    const changed = new GameRules({ ...f.rules.rules, markFree: !f.rules.rules.markFree });
    s.sync(changed, phase === 'hold' ? f.after : f.expired!, 100, true);
    expect(s.forward).toBe(false);
    expect(s.remaining(100)).toBe(0);
    expect(s.progress('check', 100, true)).toBe(1);
    if (phase === 'hold') {
      expect(s.frames.length).toBeGreaterThan(0);
      s.frames.forEach(frame => quiet(frame.since));
    } else expect(s.frames).toEqual([]);
  });

  it('compares rule data with reordered outer and nested fields', () => {
    const f = fixtures.holyLight, s = new StateEffects();
    const first = new GameRules({ ...f.rules.rules, fromMove: { Freeze: 2, IceWall: 3 } });
    const reordered = new GameRules({ ...Object.fromEntries(Object.entries(first.rules).reverse()),
      kings: [{ power: 'HolyLight', king: 'Spirit' }, null], fromMove: { IceWall: 3, Freeze: 2 } });
    expect(reordered.rules).toEqual(first.rules);
    expect(JSON.stringify(reordered.rules)).not.toBe(JSON.stringify(first.rules));
    s.sync(first, f.before, 0, true); s.sync(reordered, f.after, 10, true);
    expect(s.forward).toBe(true);
    expect(s.frames).toContainEqual(expect.objectContaining({ kind: 'holy-light', since: 10 }));
  });

  it.each(['freeze', 'ward', 'firewall'] as const)('%s card material stays settled when its rules wrapper changes', id => {
    const f = fixtures[id], s = new StateEffects();
    s.sync(f.rules, f.before, 0, true); s.sync(f.rules, f.after, 10, true);
    s.settleMark(f.before.turn);
    s.sync(new GameRules(f.rules.rules), f.after, 20, true);
    expect(s.forward).toBe(true);
    expect(s.frames.length).toBeGreaterThan(0);
    s.frames.forEach(frame => quiet(frame.since));
    expect(s.remaining(20)).toBe(0);
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
  it('gives an immune Guard no shield state and keeps its capture rule', () => {
    const f = fixtures.guard;
    expect(f.rules.rules.guardImmune).toBe(true);
    expect(boardStates(f.rules, f.after)).toEqual([]);
    const moves = f.rules.legalMoves(f.after);
    expect(moves.some(m => m.captures.includes(at('d4')) && m.from === at('d8'))).toBe(false);
    expect(moves.some(m => m.captures.includes(at('d4')) && m.from === at('e5'))).toBe(true);
    const disabled = new GameRules({ guardImmune: false });
    expect(boardStates(disabled, f.after)).toEqual([]);
    expect(disabled.legalMoves(f.after).some(m => m.captures.includes(at('d4')) && m.from === at('d8'))).toBe(true);
  });

  it.each(['ward', 'firewall', 'freeze'] as const)('keeps temporary %s on an immune Guard', kind => {
    const f = fixtures.guard, pos = structuredClone(f.after), sq = at('d4');
    const rules = new GameRules({ ...f.rules.rules, hands: [['Freeze', 'IceWall', 'Firewall'], ['Freeze', 'IceWall', 'Firewall']] });
    pos.marks = kind === 'freeze' ? [undefined, { sq, left: 1 }] : [{ sq, ward: true, all: kind === 'firewall', left: 1 }, undefined];
    const states = boardStates(rules, pos).filter(state => state.sq === sq);
    expect(states).toEqual([expect.objectContaining({ kind, sq, turns: 1 })]);
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
    expect(states.filter(s => s.sq === at('d3')).map(s => [s.kind, s.exception])).toEqual([['mercy', undefined]]);
    expect(f.rules.legalMoves(pos).some(m => m.captures.includes(at('d3')))).toBe(false);
    const noImmunity = new GameRules({ ...f.rules.rules, guardImmune: false });
    expect(boardStates(noImmunity, pos).find(s => s.sq === at('d3'))?.exception).toBe('pawn');
  });

  it('keeps two mark slots, left zero and wrong-side marks separate', () => {
    const f = fixtures.freeze, rules = new GameRules({ hands: [['Freeze', 'IceWall'], ['Freeze', 'IceWall']] });
    const pos = structuredClone(f.after); pos.marks = [{ sq: at('d5') }, { sq: at('e1') }];
    expect(boardStates(rules, pos).filter(s => s.kind === 'freeze')).toHaveLength(2);
    pos.marks = [{ sq: at('d5'), left: 0 }, { sq: at('e1'), ward: true }];
    expect(boardStates(rules, pos)).toEqual([]);
  });
});
