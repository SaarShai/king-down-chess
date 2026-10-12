import { describe, expect, it } from 'vitest';
import { toUci, sameMoves } from '../../tools/fairy-stockfish-smoke';
import { Q, parseSq } from '../rules/engine';

describe('shared-rule UCI bridge', () => {
  it('keeps promotion and ordinary capture semantics', () => {
    expect(toUci({ from: parseSq('e7'), to: parseSq('f8'), captures: [parseSq('f8')], promo: Q })).toBe('e7f8q');
    sameMoves(['b1c3', 'e2e4'], ['e2e4', 'b1c3']);
  });
  it('rejects lost actions and unequal legal sets', () => {
    expect(() => toUci({ from: 27, to: 27, captures: [43] })).toThrow();
    expect(() => toUci({ from: 27, to: 29, captures: [28, 29] })).toThrow();
    expect(() => toUci({ from: 27, to: 28, captures: [], swap: true })).toThrow();
    expect(() => toUci({ from: 27, to: 28, captures: [], power: 'flight' })).toThrow();
    expect(() => sameMoves(['e2e4'], [])).toThrow();
    expect(() => sameMoves(['e2e4'], ['e2e4', 'e2e4'])).toThrow();
  });
});
