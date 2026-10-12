import { fromFen, toLan } from '../../rules/setup';
import { findKing, inCheck, legalMoves, moveNumber, sqName, type Move, type Position } from '../../rules/engine';
import { needsArming } from '../../powers-ui';
import { checkersOf, describeMove, threatsIn } from '../../move-text';
import { marksModel, railsOf } from '../../marks-model';
import type { View } from '../../match/protocol';
import { ending } from '../ending';
import { board, highlight } from '../board-view';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Choice = { lan: string; move: Move };

export function boardScreen(call: (name: string, args: Record<string, unknown>, retain?: boolean) => Promise<unknown>, blocked: () => boolean) {
  let view: View | undefined, pos: Position | undefined, selected: number | undefined, moves: Choice[] = [];
  function choose(lan: string) {
    if (!view || blocked()) return;
    void call('kingdown_move', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision, lan }, true);
  }
  function select(square: number, submit = true) {
    if (!view || !pos || blocked() || view.action !== 'ready') return;
    if (submit && selected === square) { selected = undefined; mark(); choices([]); return; }
    const options = !submit || selected === undefined ? [] : moves.filter(({ move }) => move.from === selected && !needsArming(move) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
    const ordinary = options.filter(({ move }) => !move.power);
    if (ordinary.length === 1) return choose(ordinary[0].lan);
    if (options.length === 1) return choose(options[0].lan);
    if (options.length > 1) { choices(options); $('move-hint').textContent = 'Choose one of the moves below.'; $('move-hint').scrollIntoView({ block: 'nearest' }); return; }
    selected = square;
    const own = moves.filter(({ move }) => move.from === square);
    mark();
    choices(own);
  }
  function choices(list: Choice[]) {
    $('move-hint').textContent = !list.length ? '' : list.every(({move}) => needsArming(move)) ? 'Choose a move below.' : 'Tap a marked square to move, or choose a move below.';
    $('choices').replaceChildren(...list.map(({ lan, move }) => { const button = document.createElement('button'); button.textContent = pos ? describeMove(pos, move) : lan; button.title = lan; button.onclick = () => choose(lan); return button; }));
  }
  board.onSquareClick = square => select(square); board.onDragSelect = square => select(square, false);
  let cursor = 0;
  $('board').tabIndex = 0;
  $('board').onkeydown = event => {
    const delta = ({ ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,1], ArrowDown: [0,-1] } as Record<string, number[]>)[event.key];
    if (delta) { event.preventDefault(); const direction = view?.seat === 1 ? -1 : 1; cursor = Math.max(0, Math.min(7, (cursor % 8) + delta[0] * direction)) + 8 * Math.max(0, Math.min(7, Math.floor(cursor / 8) + delta[1] * direction)); board.setPreview(cursor); $('board').setAttribute('aria-label', `Chess board, ${sqName(cursor)}. Enter selects a square.`); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(cursor); }
  };
  function mark() {
    if (!pos) return;
    const offered = selected === undefined ? [] : moves.filter(({ move }) => move.from === selected && !needsArming(move)).map(({ move }) => move);
    const marks = marksModel(offered);
    highlight({ ...marks, selected, rails: selected === undefined ? [] : railsOf(pos.board, selected, [...marks.moves, ...marks.captures], marks.captures), check: inCheck(pos) ? findKing(pos.board, pos.turn) : null, checkers: checkersOf(pos), threats: threatsIn({ ...pos, turn: view?.seat ?? pos.turn }) });
  }
  return (next: View) => {
    view = next;
    if (!next.fen) { pos = undefined; moves = []; selected = undefined; $('status').textContent = next.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : next.result ? ending(next) : 'Choose your king and arrangement.'; $('invite').hidden = next.kind !== 'friend' || next.status !== 'waiting'; $('computer').hidden = true; choices([]); return; }
    pos = fromFen(next.fen);
    // The server's legal list decides; the local engine only gives each listed move its squares.
    const legal = new Set(view.legal), here = pos;
    moves = legal.size ? legalMoves(here).map(move => ({ lan: toLan(here, move), move })).filter(({ lan }) => legal.has(lan)) : [];
    board.sync(pos); board.flip(view.seat === 1); selected = undefined; mark();
    $('status').textContent = view.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : view.result ? ending(view) : `${view.turn === 0 ? 'White' : 'Black'} to move${view.in_check ? ' · Check' : ''} · Move ${moveNumber(pos)} · You play ${view.seat === 0 ? 'White' : 'Black'}`;
    $('computer').hidden = view.kind !== 'solo' || view.status !== 'playing' || view.turn === view.seat;
    $('invite').hidden = view.kind !== 'friend' || view.status !== 'waiting';
    $('choices').replaceChildren(); $('move-hint').textContent = '';
  };
}
