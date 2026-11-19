import { K, N, P, colorOf, parseSq, piece, typeOf, type Color, type PieceType } from '../../../rules/engine';
import { diagramFor } from '../learning-diagrams';
import { pieces } from '../texts';
import type { HelpSubject } from './content';

export function figure(type: PieceType, side: Color, king = side ? 'shadow' : 'spirit'): HTMLImageElement {
  const image = document.createElement('img');
  image.src = `/ui/pieces/${type === K ? `king-${king}` : pieces[type].name.toLowerCase()}-${side ? 'b' : 'w'}.webp`;
  image.alt = '';
  return image;
}

export function helpDiagram(subject: HelpSubject, side: Color): HTMLElement {
  const example = subject.kind === 'turn' ? { kind: 'piece', type: P } as const
    : subject.kind === 'frozen' ? { kind: 'piece' as const, type: subject.type } : subject;
  const diagram = diagramFor(example, side);
  const board = document.createElement('div');
  board.className = 'daylight-help-diagram';
  board.setAttribute('role', 'img');
  board.setAttribute('aria-label', diagram.text);
  let position = diagram.frames[0].before;
  let moves = diagram.frames.map(frame => frame.move);
  const knight = example.kind === 'piece' && example.type === N;
  if (knight) {
    // Center the knight so the diagram can show all eight destinations.
    const square = (name: string) => parseSq(name) ^ (side ? 56 : 0);
    const enemy = side ? 0 : 1;
    const setup = new Uint8Array(64);
    const actor = square('c3');
    setup[actor] = piece(N, side);
    setup[square('b3')] = piece(P, side);
    setup[square('d5')] = piece(P, enemy);
    setup[square('h1')] = piece(K, side);
    setup[square('h8')] = piece(K, enemy);
    position = { ...position, board: setup };
    moves = diagram.rules.legalMoves(position).filter(move => move.from === actor);
  }
  const from = new Set<number>(), to = new Set<number>(), captures = new Set<number>();
  const marked = new Set(diagram.marks);
  for (const move of moves) {
    if (!move) continue;
    from.add(move.from);
    if (move.from !== move.to) to.add(move.to);
    if (move.shove) to.add(move.shove.to);
    for (const push of move.pushes ?? []) to.add(push.to);
    for (const square of move.captures) captures.add(square);
    if (move.promo || move.drop) marked.add(move.to);
  }
  for (let row = 4; row >= 0; row--) for (let file = 0; file < 5; file++) {
    const rank = row + diagram.crop;
    const square = file + 8 * (side ? 7 - rank : rank);
    const cell = document.createElement('span');
    if ((file + row) % 2 === 0) cell.className = 'daylight-help-dark';
    const code = position.board[square];
    if (from.has(square)) cell.dataset.mark = 'actor';
    if (to.has(square)) cell.dataset.mark = 'target';
    if (marked.has(square)) cell.dataset.mark = 'effect';
    if (captures.has(square)) cell.dataset.mark = 'capture';
    if (subject.kind === 'frozen' && from.has(square)) cell.dataset.mark = 'frost';
    if (code) {
      const owner = colorOf(code);
      const king = diagram.rules.rules.kings[owner]?.king.toLowerCase();
      const image = figure(typeOf(code), owner, king);
      if (knight && typeOf(code) === P) {
        image.src = '/ui/icons/pawn.svg';
        image.className = 'daylight-help-pawn-symbol';
        image.dataset.side = String(owner);
      }
      cell.append(image);
    }
    board.append(cell);
  }
  return board;
}

export function diagramLegend(board: HTMLElement): HTMLElement {
  const legend = document.createElement('div');
  legend.className = 'daylight-help-legend';
  legend.setAttribute('aria-hidden', 'true');
  for (const [mark, label] of [['target', 'Move'], ['capture', 'Capture']]) {
    if (!board.querySelector(`[data-mark="${mark}"]`)) continue;
    const key = document.createElement('span');
    key.dataset.mark = mark;
    key.textContent = label;
    legend.append(key);
  }
  return legend;
}
