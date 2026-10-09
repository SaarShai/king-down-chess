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
    if (!bites.every((sq, i) => m.captures[i] === sq)) continue;
    if (m.shove) {
      add(marks.shoves, m.shove.from);
      if (!marks.shoveTo.some(s => s.from === m.shove!.from && s.to === m.shove!.to)) marks.shoveTo.push(m.shove);
    } else if (m.swap) add(marks.swaps, m.to);
    else if (m.captures.length) {
      const next = m.captures[bites.length];
      if (next !== undefined) {
        add(marks.captures, next);
        if (m.to === m.from) add(marks.shots, next);
      }
    } else add(marks.moves, m.to);
  }
  marks.shoveTo = marks.shoveTo.filter(s => !marks.moves.includes(s.to));
  return marks;
}
