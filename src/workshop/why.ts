/**
 * The why-trace of the Proving Ground (docs/specs/workshop-proving-ground, ticket 04; the review
 * docs/research/rules-ui-2026-10-10/REVIEW.md, section 6, items 2 and 3): the rules that make, change or refuse each
 * mark. It runs movesOf again with each rule removed, and with a pair removed, and compares the squares. A removal
 * shows influence, not order: a rule that works only with another rule shows on both. Pure, so it runs in Node.
 */
import { BLACK, colorOf, file, rank, sqName, type Move } from '../rules/engine';
import { clickPath } from '../marks-model';
import { DIR, canonical, type Dir, type PieceDesign, type Square } from './model';
import { START, movesOf, type Refused, type TryState } from './moves';
import { cap } from './text';
import { blockOf } from './vocab';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
/** `+` the rule adds the mark, `-` it refuses or removes the mark, `~` it changes the mark (for example "removed too"). */
export type Sign = '+' | '-' | '~';
/** Two rules that meet: gold when a square needs both; cracked when one stops the other. `a` < `b`. */
export interface Knot { a: number; b: number; type: 'gold' | 'cracked'; words: string }
export interface Trace {
  /** Each square that a rule changes, with the rules by their index in canonical(d).rules (the seal sockets I, II, III). */
  by: Map<number, { i: number; sign: Sign }[]>;
  /** The painted square or the painted line under each square of the reach. */
  base: Map<number, Square['mark'] | Dir>;
  /** The refused targets, with the rule (its index) or the table rule, and the words for the square's label. */
  refused: (Refused & { rule?: number; words: string })[];
  knots: Knot[];
}

/** Each square's signature in one run: what the moves do there, each with its whole click path (so a rule that adds or
 *  removes one path to a square changes that square), and what is refused there, with the chain's takes before it. */
function signatures(moves: readonly Move[], refused: readonly Refused[]): Map<number, string> {
  const at = new Map<number, Set<string>>();
  const add = (q: number, f: string): void => { at.set(q, (at.get(q) ?? new Set()).add(f)); };
  for (const m of moves) {
    const p = clickPath(m), kind = m.shove ? 'push' : m.swap ? 'swap' : !m.captures.length ? 'move' : m.to === m.from ? 'shot' : 'take';
    p.forEach((q, k) => add(q, `${kind} ${p.join('-')}${k < p.length - 1 ? '' : `${m.selfRemove ? ' removed' : ''}${m.promo ? ' promo' : ''}`}`));
  }
  for (const r of refused) add(r.sq, `refused ${r.why} ${r.caps.join('-')}`);
  return new Map([...at].map(([q, f]) => [q, [...f].sort().join()]));
}
/** The squares whose signatures differ. */
const changed = (x: Map<number, string>, y: Map<number, string>): number[] => [...new Set([...x.keys(), ...y.keys()])].filter(q => x.get(q) !== y.get(q));
const marked = (sig?: string): boolean => !!sig?.split(',').some(f => !f.startsWith('refused'));
const list = (qs: string[]): string => (qs.length > 1 ? `${qs.slice(0, -1).join(', ')} and ${qs.at(-1)}` : qs[0]);

/** The why-trace of design `d` for the piece on `from`. */
export function traceOf(d: D, board: Uint8Array, from: number, st: TryState = START): Trace {
  const rules = canonical(d).rules, label = (i: number): string => blockOf(rules[i].does.a).label;
  const run = (out: number[]) => {
    const refused: Refused[] = [], moves = movesOf({ ...d, rules: rules.filter((_, i) => !out.includes(i)) }, board, from, st, refused);
    return { sig: signatures(moves, refused), refused };
  };
  const all = run([]), without = rules.map((_, i) => run([i]).sig);
  const by: Trace['by'] = new Map();
  without.forEach((sig, i) => {
    for (const q of changed(all.sig, sig)) {
      const now = all.sig.get(q), then = sig.get(q);
      by.set(q, [...by.get(q) ?? [], { i, sign: !then ? '+' : !marked(now) && marked(then) ? '-' : '~' }]);
    }
  });

  const knots: Knot[] = [];
  for (let a = 0; a < rules.length; a++) {
    for (let b = a + 1; b < rules.length; b++) {
      const shared = [...by].filter(([, l]) => l.some(x => x.i === a) && l.some(x => x.i === b)).map(([q]) => sqName(q));
      if (shared.length) { knots.push({ a, b, type: 'gold', words: `Both shape ${list(shared)}.` }); continue; }
      // Cracked: one rule changes nothing while the other is in, and changes a square when the other goes.
      const both = run([a, b]).sig;
      const stops = [[a, b], [b, a]].find(([x, y]) => !changed(all.sig, without[x]).length && changed(without[y], both).length);
      if (stops) knots.push({ a, b, type: 'cracked', words: `${label(stops[1])} stops ${label(stops[0])}.` });
    }
  }

  // The painted square at the offset (mirrored for Black), else the painted line through the square.
  const dy = colorOf(board[from]) === BLACK ? -1 : 1, base: Trace['base'] = new Map();
  for (let q = 0; q < 64; q++) {
    const x = file(q) - file(from), y = (rank(q) - rank(from)) * dy, k = Math.max(Math.abs(x), Math.abs(y));
    const mark = k ? d.squares.find(s => s.x === x && s.y === y)?.mark ?? d.lines.find(l => DIR[l][0] * k === x && DIR[l][1] * k === y) : undefined;
    if (mark) base.set(q, mark);
  }

  const seen = new Set<string>(), refused: Trace['refused'] = [];
  for (const r of all.refused) {
    const key = `${r.why} ${r.caps.join('-')} ${r.sq}`, i = rules.findIndex(x => x.does.a === r.why);
    if (seen.has(key)) continue;
    seen.add(key);
    const words = r.why === 'guardImmune' ? 'Only a king takes a guard' : r.why === 'cannotTake' ? cap(blockOf(r.why).short(rules[i])) : `${label(i)}: not a king`;
    refused.push(i < 0 ? { ...r, words } : { ...r, rule: i, words });
  }
  return { by, base, refused, knots };
}
