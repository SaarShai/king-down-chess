import type { Move, Position } from '../../rules/engine';

export interface HistoryLine { key: string; line: string }
export interface HistoryGroup { key: string; title: string; lines: HistoryLine[] }
/** Staged steps precede completed turns. Each turn and its steps read newest first. */
export function historyGroups(history: readonly { pos: Position; move: Move }[], staged: readonly string[], say: (before: Position, move: Move) => string, title: (turn: number, side: number) => string, stagedTitle: string): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  let side = -1, turn = 0;
  history.forEach((entry, index) => {
    if (entry.pos.turn !== side) { side = entry.pos.turn; turn++; groups.push({ key: `t${turn}`, title: title(turn, side), lines: [] }); }
    const line = say(entry.pos, entry.move);
    if (line) groups.at(-1)!.lines.unshift({ key: `h${index}`, line });
  });
  const out = groups.filter(group => group.lines.length).reverse();
  if (staged.length) out.unshift({ key: 'draft', title: stagedTitle, lines: staged.map((line, index) => ({ key: `d${index}`, line })).reverse() });
  return out;
}
/** Undo removes the last staged step, including one capture in a chain. */
export const removedHistoryLine = (before: readonly HistoryGroup[], after: readonly HistoryGroup[]) => before.flatMap(group => group.lines).find(line => !after.some(group => group.lines.some(next => next.key === line.key)));

/** The closed scroll keeps the newest two records, across turn boundaries. */
export const historyPreview = (groups: readonly HistoryGroup[], erased?: HistoryLine): HistoryLine[] =>
  [...(erased ? [erased] : []), ...groups.flatMap(group => group.lines)].slice(0, 2);

/** One watch for each open game: the line that came last and its age. The lines of the first draw are old. */
export function newLine() {
  let last: number | undefined, key = '', since = 0;
  return (groups: readonly HistoryGroup[], now: number) => {
    const newest = groups[0]?.lines[0]?.key ?? '', at = newest ? +newest.slice(1) : -1;
    if (last !== undefined && at !== last) { key = at > last ? newest : ''; since = now; }
    last = at;
    return { key, age: now - since };
  };
}
