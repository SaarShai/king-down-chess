import { errorText } from '../client';
import { call, client, memory } from '../app';
import type { View } from '../../match/protocol';
import { boardSheet, closeBoardSheet, sendBoardCommand } from './board';
import { boardActions } from './board-model';
const words = (value: string) => { const p = document.createElement('p'); p.textContent = value; return p; };
const button = (label: string, click: () => void, id?: string) => { const b = document.createElement('button'); b.textContent = label; b.onclick = click; if (id) b.id = id; return b; };
export function confirmBoardAction(title: string, detail: string, label: string, send: () => void, cancel = 'Keep playing') {
  const yes = button(label, () => { closeBoardSheet(); send(); }); yes.className = 'primary';
  boardSheet(title, words(detail), yes, button(cancel, closeBoardSheet));
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
export function actionButtons(view: View, elapsed: number, hidden: Set<string>, menu = false) {
  // The status row shows some of these too; the Menu's copies take their own ids.
  const id = (name: string) => menu ? `menu-${name}` : name;
  if (view.status !== 'playing' && view.status !== 'setup' && view.status !== 'waiting') return [];
  const actions = boardActions(view, elapsed), result: HTMLButtonElement[] = [];
  if (view.status === 'playing') {
    result.push(button('Resign', confirmResign, 'menu-resign'));
    if (view.kind !== 'solo') {
      if (view.draw_offer === null && !hidden.has('kingdown_draw')) result.push(button('Offer draw', () => confirmDraw('offer'), 'menu-draw'));
      else if (view.draw_offer !== null && view.draw_offer !== view.seat) result.push(button('Accept draw', () => confirmDraw('accept'), id('accept-draw')), button('Decline draw', () => confirmDraw('decline'), id('decline-draw')));
    }
  }
  if (actions.abort && !hidden.has('kingdown_abort')) result.push(button('Abort', () => confirmAbort(view), id('abort')));
  if (actions.claim && !hidden.has('kingdown_claim')) {
    const label = actions.claim === 'win' ? 'Claim the win' : 'End game';
    const b = button(label, () => confirmBoardAction(label + '?', actions.claim === 'win' ? 'Your opponent misses the move deadline. You win.' : 'Your opponent makes no first move. The game ends with no result.', label, () => void sendBoardCommand('kingdown_claim')), id('claim')); b.className='primary'; result.push(b);
  }
  return result;
}

/** Read the saved relation without delaying the Menu's other controls. */
export function playerBlockButton(view: View, close = () => {}): HTMLButtonElement[] {
  if (view.kind === 'solo' || !view.opponent || view.opponent.computer || view.opponent.deleted) return [];
  let blocked: boolean | undefined, reading = false;
  const row = button('Loading block setting…', () => {
    if (reading || memory.view?.game_id !== view.game_id) return;
    if (blocked === undefined) { void read(); return; }
    const next = !blocked, label = blocked ? 'Unblock player' : 'Block player';
    close();
    confirmBoardAction(`${label}?`, blocked ? 'This player can join your new games again. Follows stay off.' : 'You do not meet in new games. Their messages are hidden. Follows end both ways. This game continues. You can unblock them in this Menu.', label, () => {
      if (memory.view?.game_id === view.game_id) void call('kingdown_block', { game_id: view.game_id, blocked: next });
    });
  }, 'menu-block-player');
  async function read() {
    reading = true; row.disabled = true; row.setAttribute('aria-busy', 'true');
    try {
      const result = await client.call('kingdown_block', { game_id: view.game_id });
      if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      blocked = result._meta?.blocked === true;
      row.textContent = blocked ? 'Unblock player' : 'Block player';
    } catch (error) { row.textContent = 'Cannot read block setting. Retry'; row.title = errorText(error); }
    finally { reading = false; row.disabled = (document.getElementById('reload') as HTMLButtonElement).disabled; row.removeAttribute('aria-busy'); }
  }
  void read(); return [row];
}
