/** Base-piece conformance corpus, retained under the full native contract. */
import { LETTERS, inCheck, parseSq, piece, type Color } from '../src/rules/engine';
import { fromFen, toFen } from '../src/rules/setup';
const must = (ok: unknown, message: string): void => { if (!ok) throw new Error(message); };
function board(name: string, entries: Record<string, string>, turn: Color = 0, halfmove = 0): { name: string; fen: string } {
  const p = fromFen('8/8/8/8/8/8/8/8 w - - 0 1');
  p.turn = turn; p.halfmove = halfmove;
  for (const [s, l] of Object.entries(entries)) p.board[parseSq(s)] = piece(LETTERS.indexOf(l.toUpperCase()) as Parameters<typeof piece>[0], l === l.toUpperCase() ? 0 : 1);
  return { name, fen: toFen(p) };
}

type Fixture = { name: string; fen: string; moves?: string[] };
export function baseFixtures(): Fixture[] {
  const directed = [
    board('archer-white-blockers', { a1: 'K', h8: 'k', d4: 'A', d6: 'p', d5: 'P', f4: 'n', e4: 'P', b4: 'p', c4: 'p', d2: 'n', d3: 'p', b6: 'p', f6: 'p', b2: 'p', f2: 'p' }),
    board('archer-black-blockers', { a1: 'K', h8: 'k', e5: 'a', e3: 'P', e4: 'p', c5: 'N', d5: 'p', g5: 'P', f5: 'P', e7: 'N', e6: 'P', c3: 'P', g3: 'P', c7: 'P', g7: 'P' }, 1),
    { name: 'archer-pin', fen: '4r2k/8/8/8/4p3/8/4A3/4K3 w - - 0 1' },
    board('archer-check-evasion', { e1: 'K', h8: 'k', e2: 'r', c2: 'A', e3: 'P' }),
    board('beast-white-branches', { a1: 'K', h8: 'k', d4: 'S', e4: 'p', e5: 'p', d5: 'p', f5: 'n' }),
    board('beast-black-branches', { a1: 'K', h8: 'k', e5: 's', d5: 'P', d4: 'P', e4: 'P', c4: 'N' }, 1),
    board('beast-final-king-safety', { e1: 'K', h8: 'k', e8: 'r', e2: 'S', e3: 'p', f4: 'p', e5: 'p' }),
    board('beast-double-check-evasion', { e1: 'K', h8: 'k', b3: 'S', b4: 'b', e2: 'r', c4: 'p', d3: 'p' }),
    board('beast-long-chain', Object.fromEntries([['a1', 'K'], ['h8', 'k'], ['b2', 'S'], ...'c2 d2 e2 f2 g2 h3 h4 h5 g6 f6 e6 d6 c6 b6 a5 a4 a3'.split(' ').map(s => [s, 'p'])])),
    board('promotion', { e1: 'K', e8: 'k', a7: 'P', b8: 'r', h2: 'p' }),
    { name: 'mate', fen: '7k/6Q1/5K2/8/8/8/8/8 b - - 0 1' },
    { name: 'stalemate', fen: '7k/5Q2/5K2/8/8/8/8/8 b - - 0 1' },
    board('material-draw', { a1: 'K', h8: 'k', c3: 'N', f6: 'b' }),
    board('fifty-move-draw', { a1: 'K', h8: 'k', d4: 'A' }, 0, 100),
    board('beast-is-not-insufficient', { a1: 'K', h8: 'k', d4: 'S' }),
    board('two-minors-are-not-insufficient', { a1: 'K', h8: 'k', c3: 'N', d3: 'N' }),
    { ...board('promoted-archer-victim', { e1: 'K', h6: 'k', a7: 'P', c8: 'a' }), moves: ['a7a8q'] },
    { ...board('promoted-beast-victim', { e1: 'K', h6: 'k', a7: 'P', b8: 's', b7: 'N' }), moves: ['a7a8q'] },
    { ...board('promoted-mover', { e1: 'K', h6: 'k', a7: 'P' }), moves: ['a7a8q', 'h6h5'] },
    { ...board('ordinary-capture-archer-reply', { a1: 'K', h8: 'k', d4: 'R', e4: 'p', c4: 'a' }), moves: ['d4e4'] },
    board('guard-immunity', { a1: 'K', h8: 'k', d4: 'G', e5: 'p', c5: 'n', f4: 'a', d6: 's', d5: 'g', e4: 'R' }),
    board('king-takes-guard', { d3: 'K', h8: 'k', d4: 'g', f4: 'G' }),
    board('maester-white-swap', { e1: 'K', h8: 'k', a1: 'M', b1: 'G', d1: 'P', a2: 'N', b2: 'p' }, 0, 19),
    board('maester-black-swap', { a1: 'K', d8: 'k', h8: 'm', g8: 'g', e8: 'p', h7: 'n', g7: 'P' }, 1, 19),
    board('maester-swap-king-into-check', { e1: 'K', h8: 'k', a1: 'M', a8: 'r' }),
    board('maester-swap-king-out-of-check', { e1: 'K', h8: 'k', a1: 'M', e8: 'r', d1: 'P' }),
    board('paladin-white-jumps', { a1: 'K', h8: 'k', d4: 'L', d5: 'P', d7: 'p', f4: 'n', e4: 'N', b4: 'g', b6: 'r' }),
    board('paladin-black-jumps', { a1: 'K', h8: 'k', e5: 'l', e4: 'p', e2: 'P', c5: 'N', d5: 'n', g5: 'G', g3: 'R' }, 1),
    board('paladin-self-removal-pin', { e1: 'K', h8: 'k', e2: 'L', e8: 'r', f3: 'n', f2: 'p' }),
    board('ogre-white-push', { a1: 'K', h8: 'k', d4: 'O', e4: 'G', d5: 'p', c4: 'n', c3: 'P', d3: 'g', e5: 'n' }, 0, 37),
    board('ogre-black-push', { a1: 'K', h8: 'k', e5: 'o', d5: 'g', e4: 'P', f5: 'N', f6: 'p', e6: 'G' }, 1, 37),
    board('ogre-push-exposes-king', { e1: 'K', h8: 'k', d2: 'O', e2: 'G', e8: 'r' }),
    board('ogre-push-to-last-rank', { a1: 'K', h8: 'k', d6: 'O', d7: 'P' }, 0, 99),
    board('catapult-white-screens', { a1: 'K', h8: 'k', d4: 'C', d5: 'p', d7: 'r', e4: 'g', g4: 'n', c4: 'P', a4: 'r', d2: 'p', d1: 'G' }),
    board('catapult-black-screens', { a1: 'K', h8: 'k', e5: 'c', e4: 'P', e2: 'R', d5: 'G', b5: 'N', f5: 'p', h5: 'R', e7: 'P', e8: 'g' }, 1),
    board('catapult-screen-pin', { e1: 'K', h8: 'k', e2: 'C', e3: 'p', e8: 'r' }),
    board('reaver-white-step', { a1: 'K', h8: 'k', d4: 'V', e6: 'p', f5: 'g', c6: 'n', c3: 'P' }),
    board('reaver-black-step', { a1: 'K', h8: 'k', e5: 'v', d3: 'P', c4: 'G', f3: 'N', f6: 'p' }, 1),
    board('reaver-step-king-safety', { e1: 'K', h8: 'k', e2: 'V', f4: 'p', e8: 'r' }),
    board('templar-capital', { a1: 'K', h7: 'k', d4: 'T', d6: 'p', f4: 'g', c3: 'G' }),
    board('templar-off-capital', { a1: 'K', h8: 'k', c3: 'T', d4: 'p', b2: 'g' }),
    board('templar-black-capital', { a2: 'K', h8: 'k', e5: 't', e3: 'P', c5: 'G' }, 1),
    board('guard-paladin-material-draw', { a1: 'K', h8: 'k', c3: 'G', d4: 'L', f6: 'v' }),
    board('maester-is-not-insufficient', { a1: 'K', h8: 'k', d4: 'M' }),
    { ...board('promoted-swap', { e1: 'K', h6: 'k', a7: 'P', b8: 'M', c8: 'o' }), moves: ['a7a8q', 'h6h5'] },
    { ...board('promoted-push', { e1: 'K', h6: 'k', a7: 'P', a5: 'o' }), moves: ['a7a8q', 'h6h5', 'a8a6'] },
    { ...board('promoted-catapult-victim', { e1: 'K', h6: 'k', a7: 'P', a6: 'P', a5: 'c' }), moves: ['a7a8q'] },
    board('ogre-never-pushes-own-king', { c3: 'K', h8: 'k', d4: 'O', d5: 'g' })
  ];
  let seed = 72011;
  const rand = (n: number): number => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n; };
  const generated: { name: string; fen: string }[] = [];
  for (let attempt = 0; generated.length < 192 && attempt < 10000; attempt++) {
    const p = fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    p.turn = rand(2) as Color;
    const types = 'ASGML OCVTasgmlocvtPNBRQpnbrq'.replace(' ', ''), count = 8 + rand(12);
    for (let i = 0; i < count; i++) {
      const s = rand(64), l = types[rand(types.length)];
      if (p.board[s] || (l.toLowerCase() === 'p' && (s < 8 || s >= 56))) continue;
      p.board[s] = piece(LETTERS.indexOf(l.toUpperCase()) as Parameters<typeof piece>[0], l === l.toUpperCase() ? 0 : 1);
    }
    if (inCheck(p, (1 - p.turn) as Color)) continue; // The last mover cannot have left its king in check.
    generated.push({ name: `seeded-${generated.length}`, fen: toFen(p) });
  }
  must(generated.length === 192, 'Corpus generation failed');
  const dense = board('growable-chain', Object.fromEntries([['a1', 'K'], ['h8', 'k'], ['b2', 'S'], ...'c2 d2 e2 f2 c3 d3 e3 f3 c4 d4 e4 f4 d5'.split(' ').map(s => [s, 'p'])]));
  return [...directed, ...generated, dense];
}

