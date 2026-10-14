import { isStill, type Move, type Position } from '../rules/engine';

/** Follow identities through the same board writes as makeMove. Drops create new identities. */
export function advanceIdentities(ids: Int32Array, m: Move, create: (square: number) => number, reserve?: number): void {
  if (isStill(m)) return;
  for (const s of m.captures) ids[s] = -1;
  if (m.shove) { ids[m.shove.to] = ids[m.shove.from]; ids[m.shove.from] = -1; }
  if (m.pushes) {
    for (const p of m.pushes) { ids[p.to] = ids[p.from]; ids[p.from] = -1; }
  } else if (m.drop) {
    ids[m.to] = reserve ?? create(m.to);
    if (m.drop2 !== undefined) ids[m.drop2] = create(m.drop2);
  } else {
    const mover = ids[m.from], other = ids[m.to];
    ids[m.from] = m.swap ? other : -1;
    ids[m.to] = m.selfRemove ? -1 : mover;
  }
}

export function checkIdentities(ids: Int32Array, pos: Position): void {
  const seen = new Set<number>();
  for (let s = 0; s < 64; s++) {
    if (!!pos.board[s] !== (ids[s] >= 0)) throw new Error(`Lost piece identity on square ${s}`);
    if (ids[s] >= 0 && seen.has(ids[s])) throw new Error(`Duplicate piece identity on square ${s}`);
    if (ids[s] >= 0) seen.add(ids[s]);
  }
}
