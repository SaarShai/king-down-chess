import type { Move } from './rules/engine';

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
