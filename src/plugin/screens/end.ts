import { call, client, memory, pollUpdate, routeView, showNewGame, store } from '../app';
import { art } from '../art';
import { ending, endReason } from '../ending';
import type { PollTarget } from '../poll';
import { PLAIN_KINGS } from '../../rules/engine';
import { pendingHere, staleRead, type Page } from '../state';
import { boardGame, closeBoardSheet, sendBoardCommand } from './board';
import { playerBlockButton } from './board-actions';
import { rematchChoices } from './end-model';
import { draftFromGame } from './setup';
import './end.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const readFailed = () => staleRead(store.page());
let scrim: HTMLElement;
const read = new Set<string>(), resumed = new Set<string>();
let updating = false, stopped = false, opening = false;
let blockKey = '', blockButtons: HTMLButtonElement[] = [];
let endGame: string | undefined, looking = false;
let guardedGame: string | undefined, tapReadyAt = 0;
// Ignore a late board tap. Skip and See the board stay active.
export function guardEndTaps(game: string) { guardedGame = game; tapReadyAt = Infinity; }
let queuedRematch: { game: string; choice: 'offer' | 'accept' | 'decline' } | undefined;
const button = (label: string, click: () => void) => { const b = document.createElement('button'); b.textContent = label; b.setAttribute('data-free',''); b.onclick = click; return b; };
function closeEnd() {
  blockKey = ''; blockButtons = [];
  const error = document.querySelector('.page-error'); if (error) document.querySelector('.page-sheet')!.append(error);
  if ($('over').classList.contains('end-card')) { $<HTMLDialogElement>('over').close(); $('over').classList.remove('end-card'); }
  if (scrim) scrim.hidden = true;
  looking = false; queuedRematch = undefined; $('end-result').hidden = true;
  opening = false;
}
function pollView() {
  const view = memory.view;
  if (!stopped && client.state.screen === 'end' && view?.status === 'finished' && view.kind !== 'solo' && !view.rematch_game_id && view.opponent && !view.opponent.deleted) return {...view,status:'playing' as const,turn:(1-view.seat) as 0|1};
}
// The store's subscriber replaces the data-page and #reload observers: the end screen follows its screen and its lock.
// The card is rebuilt on a change of either only, as the two observers did.
let endKey: string | undefined;
export function endSync(page: Page) {
  const key = `${page.screen}:${$<HTMLButtonElement>('reload').disabled}:${staleRead(page)}`;
  if (key === endKey) return;
  endKey = key;
  // Hand the table to the end screen in the same pass as the screen switch. The board then never sits in a
  // hidden box, so #board keeps its box and the canvas does not redraw at a new size. The end card overlays it.
  if (page.screen === 'end') { $('end-table').append($('game-table')); setTimeout(updateEnd, 0); }
  else if (scrim) closeEnd();
}
/** The rematch watch: the one poll reads the finished human game until a rematch or a reply comes (design §4). */
export function endPoll(): PollTarget | undefined {
  const view = pollView();
  return view && { view, read: async () => { await call('kingdown_get', { since_revision: boardGame()?.revision }, false, true); updateEnd(); } };
}
export function updateEnd() {
  if (client.state.screen !== 'end') { closeEnd(); return; }
  endScreen(false);
  if (client.state.screen !== 'end' || updating || $<HTMLButtonElement>('reload').disabled) return;
  const view = boardGame(); if (!view) return;
  // A rematch tap waits only for a pending command of this game: a start or another game's command keeps its error elsewhere.
  if (queuedRematch && !pendingHere(store.page())) {
    const queued = queuedRematch; queuedRematch = undefined;
    if (queued.game === view.game_id && rematchChoices(view).includes(queued.choice)) { void sendBoardCommand('kingdown_rematch',{choice:queued.choice}); return; }
  }
  if (client.state.pending) return;
  if (view.rematch_game_id && !resumed.has(view.rematch_game_id)) {
    const game = view.rematch_game_id, ended = view.game_id; resumed.add(game); updating = true;
    void call('kingdown_resume', {game_id:game}, false, false, false).then(next => {
      if (!next) resumed.delete(game);
      else if (client.state.screen === 'end' && endGame === ended) routeView(next);
    }).finally(() => { updating = false; });
  } else if (!read.has(view.game_id)) {
    if (memory.view?.rules) { read.add(view.game_id); return; }
    updating = true;
    void call('kingdown_get', {}, true).then(next => { if (next) read.add(view.game_id); }).finally(() => { updating = false; endScreen(); });
  }
}
export function endScreen(schedule = true) {
  const view = boardGame(); if (!view || client.state.screen !== 'end') return;
  if (!['finished','aborted'].includes(view.status)) { closeEnd(); routeView(view); return; }
  if (endGame !== view.game_id) { endGame = view.game_id; looking = false; if (guardedGame !== endGame) tapReadyAt = 0; }
  const fresh=memory.view, opponent=fresh?.game_id===view.game_id?fresh.opponent:view.opponent, rematchAllowed=fresh?.game_id===view.game_id?fresh.rematch_allowed:view.rematch_allowed, rematches=rematchChoices({...view,opponent,rematch_allowed:rematchAllowed});
  if (document.querySelector('#board-sheet[open]') && document.querySelector('#over.end-card[open]')) return;
  if (!looking) closeBoardSheet();
  const over = $<HTMLDialogElement>('over');
  const error = document.querySelector('.page-error')!; error.remove();
  if (!scrim) {
    scrim = document.createElement('div'); scrim.id = 'end-scrim'; scrim.className = 'scrim'; scrim.hidden=true; $('app-frame').insertBefore(scrim,over);
    window.addEventListener('message',event=>{ if(event.data?.method==='ui/resource-teardown') {stopped=true; closeEnd();} });
  }
  $('end-table').append($('game-table'));
  const win = view.result?.reason === 'checkmate' && view.result.winner === view.seat;
  over.className = 'end-card' + (win ? ' is-win' : ''); over.setAttribute('aria-labelledby','over-title');
  over.innerHTML = '<div class="over-art" aria-hidden="true"></div><p class="over-words"></p><h2 id="over-title"></h2><p id="end-reason"></p><div class="end-facts"></div><form method="dialog"></form><p class="quiet-line"></p><p id="end-block-status" role="status"></p>';
  const kings = view.rules?.kings;
  for (const side of [0,1] as const) {
    const img = document.createElement('img'); img.className = 'over-king over-' + (side ? 'b':'w'); img.alt = '';
    img.src = art(`ui/kings/${(kings?.[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}${side ? '-b':''}.webp`); over.querySelector('.over-art')!.append(img);
  }
  const result = view.result;
  over.querySelector('.over-words')!.textContent = win ? 'King Down' : '';
  $('over-title').textContent = !result || ['abort','no_start'].includes(result.reason) ? ending(view) : result.winner === null ? 'Draw' : result.winner === view.seat ? 'You win' : 'You lose';
  $('end-reason').textContent = endReason(view);
  const outcome = view.kind !== 'solo' && view.outcome;
  if (outcome) {
    const facts = over.querySelector('.end-facts')!;
    if (outcome.rating !== null) {
      const line = document.createElement('span'); line.textContent = outcome.provisional ? '' : 'Rating ';
      const rating = document.createElement('b'); rating.textContent = outcome.provisional ? 'New player' : String(Math.round(outcome.rating)); line.append(rating);
      if (!outcome.provisional && outcome.rating_before !== null) { const delta=Math.round(outcome.rating-outcome.rating_before), change=document.createElement('small'); change.textContent=' '+(delta>=0?'+':'')+delta; line.append(change); }
      facts.append(line);
    }
    const badge = outcome.badges[0]?.badge;
    if (badge) {
      const item=document.createElement('span'); item.className='new-badge'; const img=document.createElement('img'); img.src=art(`assets/badge-${badge.replaceAll('_','-')}.webp`); img.alt='';
      const label=document.createElement('span'); label.innerHTML='<b>New badge</b><small></small>'; label.querySelector('small')!.textContent=badge.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '); item.append(img,label); facts.append(item);
    }
  }
  const form = over.querySelector('form')!; form.onsubmit=event=>event.preventDefault();
  for (const choice of rematches) {
    const b = button(choice==='offer'?view.kind==='solo'?'Play again':'Rematch':choice==='accept'?'Accept':'Decline',()=>{
      if (performance.now() < tapReadyAt) return;
      queuedRematch ??= {game:view.game_id,choice}; updateEnd();
    });
    // C4 c: the choice stays active while the result data loads (data-free, queued); a stale board locks it.
    b.className = 'game-action'; b.disabled = !!queuedRematch || readFailed();
    if (choice!=='decline') b.classList.add('primary'); form.append(b);
  }
  const nextBlockKey = JSON.stringify([view.game_id, opponent?.deleted, rematchAllowed, memory.blockNotice]);
  if (blockKey !== nextBlockKey) {
    blockKey = nextBlockKey; blockButtons = playerBlockButton({...view,opponent});
    blockButtons.forEach(button => { button.id = 'end-block-player'; });
  }
  form.append(...blockButtons);
  $('end-block-status').textContent = memory.blockNotice;
  form.append(button('New game',()=>{if (performance.now() < tapReadyAt) return; draftFromGame(view); closeEnd(); showNewGame();}));
  const see = button('See the board',()=>{looking=true; document.querySelector('.page-sheet')!.append(error); over.close(); scrim.hidden=true; $('end-result').hidden=false; $('end-result').focus();}); form.append(see);
  $('end-result').onclick = () => { looking=false; $('end-result').hidden=true; endScreen(); };
  (looking ? document.querySelector('.page-sheet')! : over).append(error);
  over.querySelector('.quiet-line')!.textContent = opponent?.deleted || rematchAllowed === false ? '' : view.rematch_offer === view.seat ? 'Rematch offered. Waiting for your opponent.' : view.rematch_offer != null ? 'Your opponent offers a rematch.' : rematches.length ? view.kind==='solo' ? 'Play again with the same rules and colour.' : 'A rematch keeps the features and swaps the colours.' : '';
  if (over.open) scrim.hidden=false;
  else if (!opening && !looking) {
    opening=true; const game=view.game_id;
    const show=()=>{
      if (stopped || client.state.screen!=='end' || boardGame()?.game_id!==game) {opening=false; return;}
      opening=false; if(!looking){if(!over.open) { over.show(); if (tapReadyAt === Infinity) tapReadyAt = performance.now() + 1000; } scrim.hidden=false;}
    };
    requestAnimationFrame(show);
  }
  pollUpdate();
  if (schedule) setTimeout(updateEnd,0);
}
