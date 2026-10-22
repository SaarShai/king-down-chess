import { GameRules } from '../game-rules';
/**
 * The why-trace of the Proving Ground (docs/specs/workshop-proving-ground, ticket 04; the review
 * docs/research/rules-ui-2026-10-10/REVIEW.md, section 6, items 2 and 3): the rules that make, change or refuse each
 * mark. It runs movesOf again with each rule removed, and with a pair removed, and compares the squares. A removal
 * shows influence, not order: a rule that works only with another rule shows on both. Then the words of the Why tag
 * (ticket 05). Pure, so it runs in Node.
 */
import { BLACK, colorOf, file, parseSq, rank, sqName, type Move } from '../rules/engine';
import { clickPath } from '../marks-model';
import { DIR, canonical, likeSquares, type Ability, type Dir, type PieceDesign, type Rule, type Square } from './model';
import { START, holds, movesOf, type Refused, type TryState } from './moves';
import type { Kind, Scene, ScenePiece } from './scene';
import { cap } from './text';
import { LIKE, blockOf, choiceText, whenWords } from './vocab';

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
const list = (qs: string[], w = 'and'): string => (qs.length > 1 ? `${qs.slice(0, -1).join(', ')} ${w} ${qs.at(-1)}` : qs[0]);

/** The why-trace of design `d` for the piece on `from`. */
export function traceOf(d: D, board: Uint8Array, from: number, st: TryState = START, context: GameRules = new GameRules()): Trace {
  const rules = canonical(d).rules, label = (i: number): string => blockOf(rules[i].does.a).label;
  const run = (out: number[]) => {
    const refused: Refused[] = [], moves = movesOf({ ...d, rules: rules.filter((_, i) => !out.includes(i)) }, board, from, st, refused, context);
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

  // The painted square at the offset (mirrored for Black), else the painted line through the square, else those of the
  // piece that a "moves like" rule names, while its When holds (asleep, it makes no move: e4 of My Pawn on e2 is step 2).
  const dy = colorOf(board[from]) === BLACK ? -1 : 1, base: Trace['base'] = new Map(), like = rules.find(r => r.does.a === 'movesLike' && holds(r.when, board, from, st))?.does;
  for (let q = 0; q < 64; q++) {
    const x = file(q) - file(from), y = (rank(q) - rank(from)) * dy, k = Math.max(Math.abs(x), Math.abs(y));
    const under = (p: { squares: readonly Square[]; lines: readonly Dir[] }) => p.squares.find(s => s.x === x && s.y === y)?.mark ?? p.lines.find(l => DIR[l][0] * k === x && DIR[l][1] * k === y);
    const mark = k ? under(d) ?? (like?.a === 'movesLike' ? under(likeSquares(like.as)) : undefined) : undefined;
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
  sum?: { base: Kind | 'empty'; baseCond?: 'awake'; rail?: Dir; stamps: Ability['a'][]; result: Scene['marks'][number]['k']; cond?: 'asleep' | 'awake'; tags: Ability['a'][]; captions: string[] };
  /** The words of a square with no mark. */
  solo?: string;
  /** A note under the sum: a take where the piece stays, a chain's next takes and refused take, a swap or a push. */
  foot?: string;
}
/** The caption of a painted square or of the mark now (whyData's names, proving-ground.html:928). */
const SAY: Record<Kind | 'empty' | 'blocked' | 'blocked-move', string> = {
  move: 'move', take: 'takes', both: 'move or take', shot: 'shot: takes from here', moveshot: 'move or shot', blocked: 'refused', 'blocked-move': 'refused', empty: 'not painted',
};
/** The legend kind of a painted mark. */
export const KIND: Record<Square['mark'], Kind> = { move: 'move', take: 'take', both: 'both', shoot: 'shot', moveShoot: 'moveshot' };
/** A rule's caption under its stamp, in the words of the mockup's Why data (proving-ground.html:735-751): "passes own
 *  pieces", "removed after anything", "like a queen, on a center square"; for "steps 2", its When only (the base says "step 2"). */
function ruleWords(r: Rule): string {
  const d = r.does, when = whenWords(r.when);
  if (d.a === 'step2' && r.when.on !== 'always') return when;
  const w = d.a === 'linesPass' ? `passes ${d.over === 'own' ? 'own pieces' : 'any piece'}` : d.a === 'removedAfter' ? (d.what === 'any' ? 'removed after anything' : 'removed too')
    : d.a === 'movesLike' ? `like ${choiceText(LIKE, d.as)}` : d.a === 'becomes' ? 'becomes' : blockOf(d.a).short(r);
  return blockOf(d.a).event || r.when.on === 'always' ? w : `${w}, ${when}`;
}
const one = (k: string): string => `${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k}`;

/** The Why tag of square `q`: design `d` (its name for its own square), its scene, and its why-trace. */
export function whyWords(d: D & { name?: string }, sc: Scene, trace: Trace, q: string): Why {
  const rules = canonical(d).rules, at = (sq: string) => sc.pieces.find(p => p.sq === sq), occ = at(q), s = parseSq(q), me = sc.pieces.find(p => p.open);
  const foe = (sq: string): boolean => !!at(sq) && at(sq)!.side !== me?.side, from = me ? parseSq(me.sq) : s;
  const occupant = !occ ? 'Empty' : occ.open ? d.name || 'This piece' : `${occ.side === 'b' ? 'Black' : 'White'} ${occ.k}`;
  // The marks now: a mark of the paint diff that is gone (diffOf's '-') takes nothing.
  const marks = sc.marks.filter(x => x.diff !== '-');
  // The mark now; a square that only a chain reaches shows its hover-only take.
  const m = marks.find(x => x.sq === q && !x.on) ?? marks.find(x => x.sq === q && x.on);
  const fx = sc.effects.find(e => (e.k === 'swap' && e.b === q) || (e.k === 'push' && e.from === q));
  const moved = fx?.k === 'swap' ? `It may swap places with the ${occ!.k}.` : fx?.k === 'push' ? `It may push the ${occ!.k} to ${fx.to}.` : '';
  if (!m) return { occupant, piece: occ, count: 0, solo: occ?.open ? 'It stands here.' : occ && !foe(q) ? 'Its own piece.' : 'Out of reach.', ...moved && { foot: moved } };

  const base = trace.base.get(s), rail = base && base in DIR ? base as Dir : undefined, painted = base && !rail ? KIND[base as Square['mark']] : undefined;
  // The rules of the mark: the table rule that refuses it, then each rule of its `by` (the board stamps fewer, sceneOf).
  const table = m.k.startsWith('blocked') ? trace.refused.find(r => r.rule === undefined && r.sq === s && (r.caps.length ? sqName(r.caps[0]) : undefined) === m.on) : undefined;
  const imps: { a: Ability['a']; by?: number }[] = [...(table ? [{ a: 'cannotBeTaken' as const }] : []), ...(m.by ?? []).map(i => ({ a: rules[i].does.a, by: i }))];
  const changes = (sq: string, a: Ability['a']): boolean => !!trace.by.get(parseSq(sq))?.some(x => x.sign === '~' && rules[x.i].does.a === a);
  const tags = imps.flatMap(x => (x.by !== undefined && changes(q, x.a) ? [x.a] : []));
  const takes = (x: Scene['marks'][number]): boolean => !x.on && foe(x.sq) && ['take', 'both', 'shot', 'moveshot'].includes(x.k);
  // A take where the piece stays, beside the takes that remove it ("removed too"); on a chain's first take, its next takes.
  const stays = (x: Scene['marks'][number]): boolean => !changes(x.sq, 'removedAfter');
  const other = marks.find(x => takes(x) && stays(x));
  const next = marks.filter(x => x.on === q), takes2 = next.filter(x => x.k === 'take').map(x => x.sq);
  // The next takes by their order pip: the takes of one order are choices ("d6 or f6"), and each order follows the one before.
  const order: string[][] = [];
  for (const e of sc.effects) if (e.k === 'pip' && e.on === q && takes2.includes(e.sq)) (order[e.n] ??= []).push(e.sq);
  const then = order.filter(Boolean).map(l => list(l, 'or')).join(', then ');
  const kept = takes(m) && !takes2.length && rules.some(r => r.does.a === 'removedAfter')
    ? stays(m) ? `It takes ${one(occ!.k)} and stays.` : other ? `On ${other.sq} it takes ${one(at(other.sq)!.k)} and stays.` : '' : '';
  // A take that removes the piece at once stops the rule of a cracked knot (My Beast, removed after anything).
  const gone = rules.findIndex(r => r.does.a === 'removedAfter'), knot = tags.includes('removedAfter') ? trace.knots.find(k => k.type === 'cracked' && (k.a === gone || k.b === gone)) : undefined;
  const stopped = knot ? `It leaves at once, so ${blockOf(rules[knot.a === gone ? knot.b : knot.a].does.a).label} never fires.` : '';
  const foot = [kept, stopped, takes2.length ? `It takes ${q}, then ${then}.` : '', ...next.filter(x => x.k === 'blocked').map(x => `Never the ${at(x.sq)!.k} on ${x.sq}.`),
    ...takes2.filter(t => changes(t, 'removedAfter')).map(t => `After the ${at(t)!.k} on ${t}, it is removed too.`),
    m.on ? `It takes ${m.on} first.` : '', moved].filter(Boolean).join(' ');
  // The base: a painted step ("step"), a painted shot ("shot: 2 away"), a painted line, or the dashed step of "steps 2".
  const k = Math.max(Math.abs(file(s) - file(from)), Math.abs(rank(s) - rank(from))), step2 = !base && imps.some(x => x.a === 'step2');
  const baseWords = rail ? 'line' : step2 ? 'step 2' : painted?.includes('shot') ? `shot: ${k} away` : painted && k === 1 ? 'step' : SAY[painted ?? 'empty'];
  const now = m.cond === 'asleep' ? 'asleep here' : tags.includes('becomes') ? `${foe(q) ? 'takes' : 'moves'}, then becomes` : tags.includes('removedAfter') ? 'takes, then leaves'
    : takes2.length ? `then ${then}` : m.cond ? `${m.cond} here` : m.k === 'shot' ? `takes, stays on ${sqName(from)}` : SAY[m.k];
  return {
    occupant, piece: occ, count: 1 + imps.length,
    sum: {
      base: rail || step2 ? 'move' : painted ?? 'empty', ...step2 && { baseCond: 'awake' as const }, rail, stamps: imps.map(x => x.a), result: m.k, cond: m.cond, tags,
      captions: [baseWords, ...imps.map(x => (x.by === undefined ? table!.words.toLowerCase() : ruleWords(rules[x.by]))), now],
    },
    ...foot && { foot },
  };
}
