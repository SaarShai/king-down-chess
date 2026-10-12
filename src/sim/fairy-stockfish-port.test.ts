import { afterEach, describe, expect, it } from 'vitest';
import { PORT_RULES, portAction, portMoves, resolvePortAction } from '../../tools/fairy-stockfish-port';
import { legalMoves, makeMove, parseSq } from '../rules/engine';
import { fromFen, toFen } from '../rules/setup';
import { DEFAULT_RULES, setRules } from '../rules/rules';

afterEach(() => setRules(DEFAULT_RULES));
describe('fixed base-piece action bridge', () => {
  it('retains a stationary Archer and its remote victim', () => {
    setRules(PORT_RULES);
    const p = fromFen('4k3/8/3p4/8/3A4/8/8/4K3 w - - 0 1');
    const m = legalMoves(p).find(m => m.from === m.to)!;
    expect(portAction(p, m)).toBe('d4d4~80000000000');
    expect(toFen(makeMove(p, resolvePortAction(p, portAction(p, m))))).toBe('4k3/8/8/8/3A4/8/8/4K3 b - - 0 1');
    expect(() => resolvePortAction(p, 'd4d6')).toThrow('illegal');
  });
  it('collapses only identical effects and keeps a playable path', () => {
    setRules(PORT_RULES);
    const p = fromFen('4k3/8/8/3pp3/3Sp3/8/8/4K3 w - - 0 1');
    const raw = legalMoves(p), effects = portMoves(p);
    expect(raw.length).toBeGreaterThan(effects.size);
    for (const m of raw) expect(toFen(makeMove(p, m))).toBe(toFen(makeMove(p, resolvePortAction(p, portAction(p, m)))));
    expect(() => portAction(p, { from: parseSq('d4'), to: parseSq('e4'), captures: [parseSq('e4'), parseSq('e4')] })).toThrow('victim');
    expect(() => portAction(p, { from: parseSq('d4'), to: parseSq('e4'), captures: [], power: 'flight' })).toThrow('subset');
    setRules({ ...PORT_RULES, archerShots: 'classic' });
    expect(() => portMoves(p)).toThrow('subset');
  });
  it('keeps swaps and shoves distinct from captures', () => {
    setRules(PORT_RULES);
    const swap = fromFen('7k/8/8/8/8/8/8/M3K3 w - - 19 1');
    const m = resolvePortAction(swap, 'a1e1^');
    expect(m.swap).toBe(true);
    expect(toFen(makeMove(swap, m))).toBe('7k/8/8/8/8/8/8/K3M3 b - - 20 1');
    const shove = fromFen('7k/8/8/3p4/3O4/8/8/K7 w - - 37 1');
    const push = resolvePortAction(shove, 'd4d5>d6');
    expect(push.shove).toEqual({ from: parseSq('d5'), to: parseSq('d6') });
    // Match the frozen implementation: an Ogre shove does not reset this clock.
    expect(toFen(makeMove(shove, push))).toBe('7k/8/3p4/3O4/8/8/8/K7 b - - 38 1');
  });
  it('retains self-removal and the Reaver landing after a remote capture', () => {
    setRules(PORT_RULES);
    const paladin = fromFen('7k/8/3n4/8/3L4/8/8/K7 w - - 0 1');
    const death = [...portMoves(paladin)].find(([, m]) => m.selfRemove)!;
    expect(death[0]).toBe('d4d6!80000000000');
    expect(toFen(makeMove(paladin, resolvePortAction(paladin, death[0])))).toBe('7k/8/8/8/8/8/8/K7 b - - 0 1');
    const reaver = fromFen('7k/8/4p3/8/3V4/8/8/K7 w - - 0 1');
    const retreat = resolvePortAction(reaver, 'd4e5~100000000000');
    expect(retreat.captures).toEqual([parseSq('e6')]);
    expect(toFen(makeMove(reaver, retreat))).toBe('7k/8/8/4V3/8/8/8/K7 b - - 0 1');
  });
});
