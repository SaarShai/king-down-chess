import { A, G, K, L, P, S, colorOf, findKing, typeOf, type Color, type Move, type Position } from '../../rules/engine';
import type { GameRules } from '../../game-rules';
import { boardStates } from '../../render/effects/states';
import { PLAIN as C, emptyMarks, type PlainMarks, type PlainRing } from '../../render/plain-marks';
import { targetOf } from './turn';

export interface MarkAction { before: Position; move: Move }
const ring = (marks: PlainMarks, pos: Position, square: number, color: string, role: PlainRing['role'], width = .9, dash?: number[]) => marks.rings.push({ square, color, role, width, size: pos.board[square] ? 1.12 : .78, ...(dash && { dash }) });
const path = (marks: PlainMarks, squares: number[], color: string, arc = false) => { if (new Set(squares).size > 1) marks.paths.push({ squares, color, ...(arc && { arc, dash: [2, 7] }) }); };
function color(rules: GameRules, pos: Position, m: Move, target: number): string {
  if (m.power === 'freeze' || m.power === 'ward' || m.power === 'firewall') return C.ice;
  if (m.drop === G) return C.holy;
  if (m.power === 'burn' || m.power === 'firestarter') return C.ember;
  const enemy = pos.board[target] && colorOf(pos.board[target]) !== pos.turn;
  if (enemy && (typeOf(pos.board[m.from]) === K && m.from === m.to || typeOf(pos.board[m.from]) === P && rules.rules.kings[pos.turn]?.power === 'Darkness')) return C.shadow;
  return m.swap ? C.friend : enemy ? C.enemy : C.move;
}


/** Legal actions supply every target. Focus supplies only one route, never a new game choice. */
export function previewMarks(rules: GameRules, pos: Position, moves: readonly Move[], focus?: number, bites: readonly number[] = [], selected?: number): PlainMarks {
  const out = emptyMarks();
  if (!moves.length) {
    if (selected != null && pos.board[selected] && typeOf(pos.board[selected]) !== G) ring(out, pos, selected, C.actor, 'actor', 1.1);
    return out;
  }
  const target = (m: Move) => typeOf(pos.board[m.from]) === S && m.captures.length ? m.captures[bites.length] : targetOf(m);
  const focused = moves.filter(m => target(m) === focus), route = (focused.length ? focused : moves).reduce((a, b) => b.captures.length > a.captures.length ? b : a);
  const t = target(route), actor = bites.at(-1) ?? route.from, c = color(rules, pos, route, t);
  const direct = route.from === route.to && !route.captures.length;
  for (const square of new Set(moves.map(target).filter(sq => sq !== undefined))) {
    const m = moves.find(m => target(m) === square)!;
    ring(out, pos, square, color(rules, pos, m, square), square === t ? 'focus' : 'target', square === t ? 1.25 : .9);
    if (m.power === 'freeze') out.rings.at(-1)!.frost = true;
  }
  if (!direct && typeOf(pos.board[actor]) !== G) ring(out, pos, actor, C.actor, 'actor', 1.1);
  if (route.shove) {
    path(out, [route.shove.from, route.shove.to], C.enemy); ring(out, pos, route.shove.to, C.enemy, 'landing', .9, [5, 5]);
  } else if (route.swap) { path(out, [actor, t], C.friend); path(out, [t, actor], C.friend); }
  else if (typeOf(pos.board[route.from]) === S && route.captures.length) {
    const rest = route.captures.slice(bites.length); path(out, [actor, ...rest], C.enemy);
    rest.slice(1).forEach(sq => ring(out, pos, sq, C.enemy, 'target', .9, [5, 5]));
  } else if (!direct) {
    const haste = route.power === 'haste' || pos.haste !== undefined && pos.rage !== 3;
    let second: Move | undefined;
    if (route.power === 'haste') { const next = rules.makeMove(pos, route); second = rules.legalMoves(next).find(m => !m.pass && m.from === route.to); }
    path(out, [actor, t, ...(second ? [second.to] : [])], c, typeOf(pos.board[route.from]) === L || typeOf(pos.board[route.from]) === A && route.from === route.to);
    if (haste) { out.steps.push({ square: t, number: route.power === 'haste' ? 1 : 2 }); if (second) { ring(out, pos, second.to, C.move, 'target', .9, [5, 5]); out.steps.push({ square: second.to, number: 2 }); } }
  }
  return out;
}

/** Before the piece choice, mark the pieces the armed action can use. */
export function actorMarks(pos: Position, moves: readonly Move[], focus?: number): PlainMarks {
  const out = emptyMarks();
  for (const square of new Set(moves.map(m => m.from))) ring(out, pos, square, moves.some(m => m.from === square && m.power === 'burn') ? C.ember : C.move, square === focus ? 'focus' : 'target', square === focus ? 1.25 : .9);
  return out;
}

/** Past actions leave soft brass below the figures. The final target is strongest. */
export function resultMarks(_pos: Position, actions: readonly MarkAction[]): PlainMarks {
  const out = emptyMarks(), squares = new Set<number>();
  let final: number[] = [];
  for (const { before, move: m } of actions) {
    if (m.pass) continue;
    const changed = [m.from, m.to, ...m.captures, ...(m.shove ? [m.shove.from, m.shove.to] : []), ...(m.castle ? [m.castle.from, m.castle.to] : []), ...(m.pushes ?? []).flatMap(p => [p.from, p.to])];
    if (m.power === 'firewall') before.board.forEach((code, sq) => { if (code && colorOf(code) === before.turn) changed.push(sq); });
    for (const square of changed) squares.add(square);
    final = m.power === 'firewall' ? changed : m.pushes?.length ? m.pushes.map(p => p.to) : [m.shove?.to ?? targetOf(m)];
  }
  if (squares.size) out.shadows = [...squares].map(square => ({ square, opacity: final.includes(square) ? .24 : .12 }));
  return out;
}

/** The last square of a side's king in the history: after a king capture, the square where it was taken. */
export function kingSquare(history: readonly { pos: Position }[], side: Color): number {
  for (let i = history.length - 1; i >= 0; i--) { const king = findKing(history[i].pos.board, side); if (king >= 0) return king; }
  return -1;
}

/** Current state supplies lasting marks. These end only when the engine ends the state. */
export function stateMarks(rules: GameRules, pos: Position): PlainMarks {
  const out = emptyMarks();
  const king = rules.inCheck(pos) ? findKing(pos.board, pos.turn) : -1;
  if (king >= 0) out.check = king;
  for (const state of boardStates(rules, pos)) ring(out, pos, state.sq, state.kind === 'holy-light' || state.kind === 'mercy' ? C.holy : C.ice, 'state', state.kind === 'holy-light' ? 1.1 : 1.25);
  return out;
}
export function mergeMarks(...marks: PlainMarks[]): PlainMarks {
  const rings = marks.flatMap(m => m.rings);
  const check = marks.find(m => m.check != null)?.check;
  const shadows = marks.flatMap(m => m.shadows ?? []);
  // The selected mark stays over a protection ring on the same square.
  return {
    rings: [...rings.filter(r => r.role !== 'actor'), ...rings.filter(r => r.role === 'actor')],
    paths: marks.flatMap(m => m.paths), steps: marks.flatMap(m => m.steps),
    ...(shadows.length > 0 && { shadows }), ...(check != null && { check }),
  };
}
