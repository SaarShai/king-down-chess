import type { View } from '../../match/protocol';
import { boardSheet, closeBoardSheet, sendBoardCommand } from './board';
import { boardActions } from './board-model';
const words = (value: string) => { const p = document.createElement('p'); p.textContent = value; return p; };
const button = (label: string, click: () => void, id?: string) => { const b = document.createElement('button'); b.textContent = label; b.onclick = click; if (id) b.id = id; return b; };
export function confirmBoardAction(title: string, detail: string, label: string, send: () => void) {
  const yes = button(label, () => { closeBoardSheet(); send(); }); yes.className = 'primary';
  boardSheet(title, words(detail), yes, button('Keep playing', closeBoardSheet));
}
export function confirmAbort(view: View, send = () => void sendBoardCommand('kingdown_abort')) {
  if (!view.abort_open) return;
  confirmBoardAction('Abort this game?', 'The game ends with no result.', 'Abort', send);
}
export function confirmResign() { confirmBoardAction('Lay your king down?', 'Your opponent wins this game.', 'Resign', () => void sendBoardCommand('kingdown_resign')); }
export function confirmDraw(choice: 'offer' | 'accept' | 'decline') {
  const title = choice === 'offer' ? 'Offer a draw?' : choice === 'accept' ? 'Accept the draw?' : 'Decline the draw?';
  confirmBoardAction(title, choice === 'accept' ? 'The game ends in a draw.' : choice === 'decline' ? 'The game continues.' : 'Your opponent can accept or decline.', choice === 'offer' ? 'Offer draw' : choice === 'accept' ? 'Accept' : 'Decline', () => void sendBoardCommand('kingdown_draw', {choice}));
}
export function actionButtons(view: View, elapsed: number, hidden: Set<string>) {
  if (view.status !== 'playing' && view.status !== 'setup' && view.status !== 'waiting') return [];
  const actions = boardActions(view, elapsed), result: HTMLButtonElement[] = [];
  if (view.status === 'playing') {
    result.push(button('Resign', confirmResign, 'menu-resign'));
    if (view.kind !== 'solo') {
      if (view.draw_offer === null && !hidden.has('kingdown_draw')) result.push(button('Offer draw', () => confirmDraw('offer'), 'menu-draw'));
      else if (view.draw_offer !== null && view.draw_offer !== view.seat) result.push(button('Accept draw', () => confirmDraw('accept'), 'accept-draw'), button('Decline draw', () => confirmDraw('decline'), 'decline-draw'));
    }
  }
  if (actions.abort && !hidden.has('kingdown_abort')) result.push(button('Abort', () => confirmAbort(view), 'abort'));
  if (actions.claim && !hidden.has('kingdown_claim')) {
    const label = actions.claim === 'win' ? 'Claim the win' : 'End game';
    const b = button(label, () => confirmBoardAction(label + '?', actions.claim === 'win' ? 'Your opponent misses the move deadline. You win.' : 'Your opponent makes no first move. The game ends with no result.', label, () => void sendBoardCommand('kingdown_claim')), 'claim'); b.className='primary'; result.push(b);
  }
  return result;
}
