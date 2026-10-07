// The section numbers (§) in this file cite revision 3 of the Workshop doc:
// docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
import { describe, expect, it } from 'vitest';
import { BLACK, K, WHITE, genPiece, piece, sq, type Move, type PieceType } from '../rules/engine';
import { PRESETS } from './model';
import { BODY_TYPE, movesOf } from './moves';

const key = (m: Move): string => [m.from, m.to, m.captures.join('.'), m.swap ? 's' : '', m.shove ? `${m.shove.from}>${m.shove.to}` : '', m.selfRemove ? 'x' : '', m.promo ?? ''].join(',');
const keys = (ms: Move[]): string[] => ms.map(key).sort();
const engine = (b: Uint8Array, from: number): Move[] => { const out: Move[] = []; genPiece(b, from, 'all', out); return out; };
// Mulberry32: the same 500 boards every run.
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
const TYPES: PieceType[] = [1, 1, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];

describe('presets equal the engine (§8.4.1)', () => {
  it('each preset expands to genPiece on d4 of an empty board', () => {
    for (const p of PRESETS) {
      const t = BODY_TYPE[p.body as keyof typeof BODY_TYPE], b = new Uint8Array(64), d4 = sq(3, 3);
      b[d4] = piece(t, WHITE);
      expect(keys(movesOf(p, b, d4)), p.key).toEqual(keys(engine(b, d4)));
    }
  });

  it('movesOf equals genPiece on 500 random boards for every pool piece', () => {
    const r = rng(7);
    for (let i = 0; i < 500; i++) {
      const b = new Uint8Array(64), free = [...Array(64).keys()], take = () => free.splice(Math.floor(r() * free.length), 1)[0];
      b[take()] = piece(K, WHITE); b[take()] = piece(K, BLACK);
      for (let n = 4 + Math.floor(r() * 14); n > 0; n--) b[take()] = piece(TYPES[Math.floor(r() * TYPES.length)], r() < 0.5 ? WHITE : BLACK);
      for (const p of PRESETS) {
        const c = r() < 0.5 ? WHITE : BLACK, at = take();
        b[at] = piece(BODY_TYPE[p.body as keyof typeof BODY_TYPE], c);
        let want = engine(b, at);
        // The Workshop's Maester never swaps with a king (§4.2 H1; its preset note: no long swap).
        if (p.key === 'maester') want = want.filter(m => !m.swap || (b[m.to] & 15) !== K);
        expect(keys(movesOf(p, b, at)), `${p.key} on board ${i}`).toEqual(keys(want));
        b[at] = 0; free.push(at);
      }
    }
  });
});

describe('Try it moves', () => {
  it('a rook that takes again may cross the square it left', () => {
    const b = new Uint8Array(64), d4 = sq(3, 3), d6 = sq(3, 5), d2 = sq(3, 1);
    b[d4] = piece(4, WHITE); b[d6] = b[d2] = piece(1, BLACK);
    const rook = { ...PRESETS.find(p => p.key === 'rook')!, rules: [{ when: { on: 'takes' as const }, does: { a: 'chain' as const } }] };
    expect(movesOf(rook, b, d4).some(m => m.captures.join() === [d6, d2].join())).toBe(true);
  });
});
