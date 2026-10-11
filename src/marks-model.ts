import { B, BLACK, C, CAPITAL, L, Q, R, RULES, T, colorOf, typeOf, type Move } from './rules/engine';
import { DIR, patternOf, step, type Dir } from './rules/design';

/** Move marks from the offered moves; the caller owns the selection. */
export function marksModel(moves: readonly Move[], bites: readonly number[] = []) {
  const marks = {
    moves: [] as number[], captures: [] as number[], shots: [] as number[],
    swaps: [] as number[], shoves: [] as number[],
    shoveTo: [] as { from: number; to: number }[], bites: [...bites],
  };
  const add = (list: number[], sq: number) => { if (!list.includes(sq)) list.push(sq); };
  for (const m of moves) {
    if (!bites.every((sq, i) => clickPath(m)[i] === sq)) continue;
    if (m.shove) {
      add(marks.shoves, m.shove.from);
      if (!marks.shoveTo.some(s => s.from === m.shove!.from && s.to === m.shove!.to)) marks.shoveTo.push(m.shove);
    } else if (m.swap) add(marks.swaps, m.to);
    else if (m.captures.length) {
      const next = m.captures[bites.length];
      if (next !== undefined) {
        add(marks.captures, next);
        if (m.to === m.from) add(marks.shots, next);
      } else {
        const landing = clickPath(m)[bites.length];
        if (landing !== undefined) add(marks.moves, landing);
      }
    } else if (clickPath(m)[bites.length] !== undefined) add(marks.moves, m.to);
  }
  marks.shoveTo = marks.shoveTo.filter(s => !marks.moves.includes(s.to));
  return marks;
}

/** A landing names one shove; a step on that square takes priority. */
export function landingMoves(moves: readonly Move[], sq: number): Move[] {
  if (moves.some(m => !m.shove && m.to === sq)) return [];
  const shoves = moves.filter(m => m.shove?.to === sq);
  return shoves.length === 1 ? shoves : [];
}

/** Squares that identify a move, in tap order. */
export const clickPath = (m: Move): number[] => (m.shove
  ? [m.shove.from] // click the neighbour to shove, under both `repel` (to === from) and `push`
  // A mark, a sacrifice and a Haste pass change no square: the square itself is the click.
  : m.pass || m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice' ? [m.to]
  : m.to === m.from ? [m.captures[0]]
  : m.captures.length > 1 ? m.captures
  // Reaver: click the victim, then the landing square (`Vb1xc3-d3`).
  : m.captures.length === 1 && m.to !== m.captures[0] ? [m.captures[0], m.to]
  : [m.to]);

const ORTHO: Dir[] = ['n', 'e', 's', 'w'], DIAG: Dir[] = ['ne', 'se', 'sw', 'nw'];
/** The lines of the piece on `from`: a slider's, the paladin's and the catapult's, a design's (`RULES.design`), the Templar's on a capital. */
function linesOf(board: Uint8Array, from: number): Dir[] {
  const t = typeOf(board[from]);
  if (t === T && RULES.design) return [...patternOf(RULES.design, board, from).lines];
  return t === B ? DIAG : t === R || t === C ? ORTHO : t === Q || t === L || (t === T && CAPITAL.includes(from)) ? [...ORTHO, ...DIAG] : [];
}

/**
 * The rails that join the marked squares of each line of the piece on `from` (move-legend ticket 03), with the
 * Workshop's line ends (src/workshop/scene.ts layer()): `to` is the line's last square. `arrow`: the line runs to the
 * board edge; `stop`: a piece stops it (`to` is that piece's square); `x`: it ends in a take, or a rule cuts it short.
 * A line passes over a piece when the square past it is marked (the paladin). A line with no marked square has no rail.
 */
export function railsOf(board: Uint8Array, from: number, marked: readonly number[], captures: readonly number[]): { to: number; end: 'x' | 'stop' | 'arrow' }[] {
  const dy = colorOf(board[from]) === BLACK ? -1 : 1, out: { to: number; end: 'x' | 'stop' | 'arrow' }[] = [];
  for (const l of linesOf(board, from)) {
    const [x, y] = DIR[l], ray: number[] = [];
    for (let s = step(from, x, y * dy); s >= 0; s = step(s, x, y * dy)) ray.push(s);
    let far = -1;
    for (let i = 0; i < ray.length; i++) {
      if (marked.includes(ray[i])) far = i;
      else if (!board[ray[i]] || !marked.includes(ray[i + 1])) break;
    }
    if (far < 0) continue;
    const next = ray[far + 1];
    out.push(captures.includes(ray[far]) ? { to: ray[far], end: 'x' } : next === undefined ? { to: ray[far], end: 'arrow' }
      : board[next] ? { to: next, end: 'stop' } : { to: ray[far], end: 'x' });
  }
  return out;
}
