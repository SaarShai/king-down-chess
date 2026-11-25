/**
 * The position key claims 52 bits: a 32-bit `lo` and a 20-bit `hi` (src/rules/position-key.ts).
 * The claim holds only when `hi` is not a function of `lo`. xorshift is linear over GF(2), so a `hi`
 * taken from the `lo` stream adds no bits (2026-10-03: keys carried 32 bits, not 52). This test
 * takes every exported Z_*_LO / Z_*_HI table pair and asks for rank 52 over GF(2).
 */
import { describe, expect, it } from 'vitest';
import * as keys from '../src/rules/position-key';

type Table = Int32Array | number;
const tables = keys as unknown as Record<string, Table>;

/** The [lo, hi] values of each key, from each exported table pair. */
function keyPairs(): { pairs: [number, number][]; names: string[]; unpaired: string[] } {
  const pairs: [number, number][] = [], names: string[] = [], unpaired: string[] = [];
  for (const name of Object.keys(tables).filter(n => /^Z(_.+)?_LO$/.test(n))) {
    const partner = name.replace(/_LO$/, '_HI');
    const lo = tables[name], hi = tables[partner];
    if (hi === undefined) { unpaired.push(name); continue; }
    names.push(name);
    const los = typeof lo === 'number' ? [lo] : [...lo], his = typeof hi === 'number' ? [hi] : [...hi];
    if (los.length !== his.length) { unpaired.push(name); continue; }
    los.forEach((l, i) => pairs.push([l >>> 0, his[i] >>> 0]));
  }
  for (const name of Object.keys(tables).filter(n => /^Z(_.+)?_HI$/.test(n))) {
    if (!(name.replace(/_HI$/, '_LO') in tables)) unpaired.push(name);
  }
  return { pairs, names, unpaired };
}

/** Rank over GF(2) of the 52-bit vectors hi(20) . lo(32). */
function rank(pairs: [number, number][]): number {
  const basis = new Map<number, bigint>(); // leading bit -> vector
  for (const [lo, hi] of pairs) {
    let v = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    while (v) {
      const top = v.toString(2).length - 1;
      const b = basis.get(top);
      if (b === undefined) { basis.set(top, v); break; }
      v ^= b;
    }
    if (basis.size === 52) break;
  }
  return basis.size;
}

describe('position key width', () => {
  it('every Z_*_LO table has a Z_*_HI partner of the same length', () => {
    const { unpaired, names } = keyPairs();
    expect(names.length).toBeGreaterThan(10);
    expect(unpaired, 'a key table without its other half in src/rules/position-key.ts: export both, drawn with next() and nextHi()').toEqual([]);
  });

  it('the keys carry 52 independent bits', () => {
    const { pairs } = keyPairs();
    const r = rank(pairs);
    expect(r, `position key carries ${r} bits, not 52: draw the hi half from its own generator (nextHi in src/rules/position-key.ts), not from the lo stream`).toBe(52);
  });
});
