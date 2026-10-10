/**
 * The why-trace of the Proving Ground (docs/specs/workshop-proving-ground, ticket 04; the review
 * docs/research/rules-ui-2026-10-10/REVIEW.md, section 6, items 2 and 3): the rules that make, change or refuse each
 * mark. It runs movesOf again with each rule removed, and with a pair removed, and compares the squares. A removal
 * shows influence, not order: a rule that works only with another rule shows on both. Then the words of the Why tag
 * (ticket 05). Pure, so it runs in Node.
 */
import { BLACK, colorOf, file, parseSq, rank, sqName, type Move } from '../rules/engine';
import { clickPath } from '../marks-model';
import { DIR, canonical, type Ability, type Dir, type PieceDesign, type Rule, type Square } from './model';
import { START, movesOf, type Refused, type TryState } from './moves';
import type { Kind, Scene, ScenePiece } from './scene';
import { brief, cap } from './text';
import { blockOf, choiceText, whenWords } from './vocab';

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

/** The Why tag of one square (renderWhy and whyData, proving-ground.html:912-936, :1330-1364). */
export interface Why {
  /** The occupant: "Black knight", "Empty", or the open piece's name; `piece` gives its icon. */
  occupant: string; piece?: ScenePiece;
  /** The parts that make the mark (the count ring): its base and each rule; 0 for a square with no mark. */
  count: number;
  /** The sum (whySum, marks.js:909): the base (the painted square, a painted line, or 'empty'), + the stamp of each rule,
   *  = the mark now with the stamps of the rules that change it (`tags`); a caption under each part. */
  sum?: { base: Kind | 'empty'; rail?: Dir; stamps: Ability['a'][]; result: Scene['marks'][number]['k']; cond?: 'asleep' | 'awake'; tags: Ability['a'][]; captions: string[] };
  /** The words of a square with no mark. */
  solo?: string;
  /** A note under the sum: a take where the piece stays, a chain's next takes and refused take, a swap or a push. */
  foot?: string;
}
/** The caption of a painted square or of the mark now (whyData's names, proving-ground.html:928). */
const SAY: Record<Kind | 'empty' | 'blocked' | 'blocked-move', string> = {
  move: 'move', take: 'takes', both: 'move or take', shot: 'shot: takes from here', moveshot: 'move or shot', blocked: 'refused', 'blocked-move': 'refused', empty: 'not painted',
};
const KIND: Record<Square['mark'], Kind> = { move: 'move', take: 'take', both: 'both', shoot: 'shot', moveShoot: 'moveshot' };
/** A rule's caption: the seal's label with its pill's words in place of "…", then a state rule's When ("moves like a queen, on a center square"). */
function ruleWords(r: Rule): string {
  const b = blockOf(r.does.a), v = b.pill && brief(choiceText(b.pill.choices, (r.does as unknown as Record<string, string>)[b.pill.key]));
  const w = b.label.toLowerCase().replace('…', ` ${v}`);
  return b.event || r.when.on === 'always' ? w : `${w}, ${whenWords(r.when)}`;
}
const one = (k: string): string => `${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k}`;

/** The Why tag of square `q`: design `d` (its name for its own square), its scene, and its why-trace. */
export function whyWords(d: D & { name?: string }, sc: Scene, trace: Trace, q: string): Why {
  const rules = canonical(d).rules, at = (sq: string) => sc.pieces.find(p => p.sq === sq), occ = at(q), s = parseSq(q);
  const foe = (sq: string): boolean => !!at(sq) && at(sq)!.side !== sc.pieces.find(p => p.open)?.side;
  const occupant = !occ ? 'Empty' : occ.open ? d.name || 'This piece' : `${occ.side === 'b' ? 'Black' : 'White'} ${occ.k}`;
  // The marks now: a mark of the paint diff that is gone (diffOf's '-') takes nothing.
  const marks = sc.marks.filter(x => x.diff !== '-');
  // The mark now; a square that only a chain reaches shows its hover-only take.
  const m = marks.find(x => x.sq === q && !x.on) ?? marks.find(x => x.sq === q && x.on);
  const fx = sc.effects.find(e => (e.k === 'swap' && e.b === q) || (e.k === 'push' && e.from === q));
  const moved = fx?.k === 'swap' ? `It may swap places with the ${occ!.k}.` : fx?.k === 'push' ? `It may push the ${occ!.k} to ${fx.to}.` : '';
  if (!m) return { occupant, piece: occ, count: 0, solo: occ?.open ? 'It stands here.' : occ && !foe(q) ? 'Its own piece.' : 'Out of reach.', ...moved && { foot: moved } };

  const base = trace.base.get(s), rail = base && base in DIR ? base as Dir : undefined;
  const imps = sc.impressions.find(i => i.sq === q && i.on === m.on)?.list ?? [];
  const table = trace.refused.find(r => r.rule === undefined && r.sq === s)?.words.toLowerCase() ?? '';
  const changes = (sq: string, a: Ability['a']): boolean => !!trace.by.get(parseSq(sq))?.some(x => x.sign === '~' && rules[x.i].does.a === a);
  const tags = imps.flatMap(x => (x.by !== undefined && changes(q, x.a) ? [x.a] : []));
  const takes = (x: Scene['marks'][number]): boolean => !x.on && foe(x.sq) && ['take', 'both', 'shot', 'moveshot'].includes(x.k);
  // A take where the piece stays, beside the takes that remove it ("removed too") or a shot; a chain's next takes on its first take.
  const stays = (x: Scene['marks'][number]): boolean => !changes(x.sq, 'removedAfter');
  const other = marks.find(x => takes(x) && stays(x));
  const kept = takes(m) && (m.k.includes('shot') || rules.some(r => r.does.a === 'removedAfter'))
    ? stays(m) ? `It takes ${one(occ!.k)} and stays.` : other ? `On ${other.sq} it takes ${one(at(other.sq)!.k)} and stays.` : '' : '';
  const next = marks.filter(x => x.on === q), takes2 = next.filter(x => x.k === 'take').map(x => x.sq);
  const foot = [kept, takes2.length ? `Then it may take ${list(takes2)}.` : '', ...next.filter(x => x.k === 'blocked').map(x => `Never the ${at(x.sq)!.k} on ${x.sq}.`),
    m.on ? `It takes ${m.on} first.` : '', moved].filter(Boolean).join(' ');
  return {
    occupant, piece: occ, count: 1 + imps.length,
    sum: {
      base: rail ? 'move' : base ? KIND[base as Square['mark']] : 'empty', rail, stamps: imps.map(x => x.a), result: m.k, cond: m.cond, tags,
      captions: [rail ? 'line' : SAY[base ? KIND[base as Square['mark']] : 'empty'], ...imps.map(x => (x.by === undefined ? table : ruleWords(rules[x.by]))),
        m.cond ? `${m.cond} here` : tags.includes('removedAfter') ? 'takes, then leaves' : takes2.length ? `then ${list(takes2)}` : SAY[m.k]],
    },
    ...foot && { foot },
  };
}
