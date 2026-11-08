import { errorText } from '../../account-game/types';
import { call, client, memory } from '../../account-game/runtime';
import type { View } from '../../match/protocol';
import { boardSheet, closeBoardSheet, sendBoardCommand } from './board';
import type { ReportCategory } from '../../account/profile';
import { boardActions, humanOpponent, REPORT_REASONS, reportArgs, reportReply } from './board-model';
const words = (value: string) => { const p = document.createElement('p'); p.textContent = value; return p; };
const button = (label: string, click: () => void, id?: string) => { const b = document.createElement('button'); b.textContent = label; b.onclick = click; if (id) b.id = id; return b; };
export function confirmBoardAction(title: string, detail: string, label: string, send: () => void, cancel = 'Keep playing') {
  const yes = button(label, () => { closeBoardSheet(); send(); });
  yes.className = 'game-action';
  const keep = button(cancel, closeBoardSheet); keep.className = 'primary';
  boardSheet(title, words(detail), yes, keep);
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
  const id = (name: string) => menu ? `menu-${name}` : name;
  if (view.status !== 'playing' && view.status !== 'setup' && view.status !== 'waiting') return [];
  const actions = boardActions(view, elapsed), result: HTMLButtonElement[] = [];
  if (view.status === 'playing') {
    if (menu) result.push(button('Resign', confirmResign, 'menu-resign'));
    if (view.kind !== 'solo') {
      if (menu && view.draw_offer === null && !hidden.has('kingdown_draw')) result.push(button('Offer draw', () => confirmDraw('offer'), 'menu-draw'));
      if (!menu && view.draw_offer !== null && view.draw_offer !== view.seat) result.push(button('Accept draw', () => confirmDraw('accept'), id('accept-draw')), button('Decline draw', () => confirmDraw('decline'), id('decline-draw')));
    }
  }
  if (menu && actions.abort && !hidden.has('kingdown_abort')) {
    const abort = button('Abort', () => confirmAbort(view), id('abort'));
    const note = document.createElement('small'); note.textContent = 'No result, until each side moves once.';
    abort.append(note); result.push(abort);
  }
  if (!menu && actions.claim && !hidden.has('kingdown_claim')) {
    const label = actions.claim === 'win' ? 'Claim the win' : 'End game';
    const b = button(label, () => confirmBoardAction(label + '?', actions.claim === 'win' ? 'Your opponent misses the move deadline. You win.' : 'Your opponent makes no first move. The game ends with no result.', label, () => void sendBoardCommand('kingdown_claim')), id('claim')); b.className='primary'; result.push(b);
  }
  for (const action of result) action.classList.add('game-action');
  return result;
}

/** Read the saved relation without delaying the Menu's other controls. */
export function playerBlockButton(view: View, close = () => {}): HTMLButtonElement[] {
  if (!humanOpponent(view)) return [];
  let blocked: boolean | undefined, reading = false;
  const row = button('Loading block setting…', () => {
    if (reading || memory.view?.game_id !== view.game_id) return;
    if (blocked === undefined) { void read(); return; }
    const next = !blocked, label = blocked ? 'Unblock player' : 'Block player';
    close();
    confirmBoardAction(`${label}?`, blocked ? 'Your block no longer stops Find or joins to open games. Follows stay off.' : `Find does not match you again. This player cannot join your open games. Their messages are hidden. Follows end both ways. ${['finished', 'aborted'].includes(view.status) ? '' : 'This game continues. '}You can unblock them in Profile.`, label, () => {
      if (memory.view?.game_id === view.game_id) void call('kingdown_block', { game_id: view.game_id, blocked: next });
    }, ['finished', 'aborted'].includes(view.status) ? 'Cancel' : 'Keep playing');
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

/** Report player (App Review 1.2): a reason, an optional note, and kingdown_report with the game id. */
export function playerReportButton(view: View, close = () => {}, id = 'menu-report-player'): HTMLButtonElement[] {
  if (!humanOpponent(view)) return [];
  return [button('Report player', () => {
    close();
    const form = document.createElement('form'); form.className = 'report-form';
    form.innerHTML = '<label>Reason<select required><option value="">Choose a reason</option></select></label><label>Note (optional)<textarea maxlength="1000" rows="3"></textarea></label><p role="alert"></p><div><button type="button">Cancel</button><button type="submit" class="primary">Send</button></div>';
    const reason = form.querySelector('select')!, note = form.querySelector('textarea')!, error = form.querySelector('p')!, [cancel, send] = form.querySelectorAll('button');
    for (const [value, label] of Object.entries(REPORT_REASONS)) reason.add(new Option(label, value));
    cancel.onclick = closeBoardSheet;
    // The board's own Escape handler runs only while the board screen is mounted; the seat screen opens this dialog too.
    const escape = (event: KeyboardEvent) => {
      if (!form.closest('dialog')?.open) return document.removeEventListener('keydown', escape);
      if (event.key === 'Escape') { event.preventDefault(); closeBoardSheet(); }
    };
    document.addEventListener('keydown', escape);
    form.onsubmit = async event => {
      event.preventDefault(); if (send.disabled) return;
      send.disabled = true; error.textContent = '';
      try {
        const sent = reportReply(await client.call('kingdown_report', reportArgs(view, reason.value as ReportCategory, note.value)));
        const done = button('Close', closeBoardSheet); done.className = 'primary';
        boardSheet('Report sent', words(sent), done);
      // shortcut: a report is not idempotent, so a Send after a timeout can store a second copy. The owner sees two reports.
      } catch (failure) { error.textContent = errorText(failure); }
      finally { send.disabled = false; }
    };
    boardSheet('Report player', form);
  }, id)];
}
