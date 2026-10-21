import { call, send, client, memory, pollUpdate, routeView, showNewGame, store, queue } from '../../account-game/runtime';
import type { View } from '../../match/protocol';
import { art } from '../../account-game/art';
import { ending, endReason } from '../ending';
import { pollSince, type PollTarget } from '../poll';
import { PLAIN_KINGS } from '../../rules/engine';
import { pendingHere, staleRead, type Page } from '../../account-game/state';
import { boardGame, closeBoardSheet, sendBoardCommand, skipBoardCeremony } from './board';
import { playerBlockButton } from './board-actions';
import { rematchChoices } from './end-model';
import { draftFromGame } from './setup';
import { onStop } from './friend';
import { policyLabel } from '../../account-game/rating-policy';
import './end.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const readFailed = () => staleRead(store.page());
let scrim: HTMLElement;
let observer: MutationObserver | undefined, showFrame = 0;
let updateTimer: ReturnType<typeof setTimeout> | undefined;
const read = new Set<string>(), resumed = new Set<string>();
let updating = false, stopped = false, opening = false;
let blockKey = '', blockButtons: HTMLButtonElement[] = [];
let contentKey: string | undefined;
let endGame: string | undefined, looking = false;
let guardedGame: string | undefined, tapReadyAt = 0;
// Ignore a late board tap. Skip and See the board stay active.
export function guardEndTaps(game: string) { guardedGame = game; tapReadyAt = Infinity; }
let queuedRematch: { game: string; choice: 'offer' | 'accept' | 'decline' } | undefined;
const button = (label: string, click: () => void) => { const b = document.createElement('button'); b.textContent = label; b.setAttribute('data-free',''); b.onclick = click; return b; };
function closeEnd() {
  contentKey = undefined;
  blockKey = ''; blockButtons = [];
  const error = document.querySelector('.page-error'); if (error) document.querySelector('.page-sheet')!.append(error);
  if ($('over').classList.contains('end-card')) { $<HTMLDialogElement>('over').close(); $('over').classList.remove('end-card'); }
  if (scrim) scrim.hidden = true;
  skipBoardCeremony(); looking = false; queuedRematch = undefined; $('end-result').hidden = true;
  opening = false;
}
function pollView() {
  const view = memory.view;
  if (!stopped && !queue.closed() && client.state.screen === 'end' && view?.status === 'finished' && !view.rematch_game_id && view.opponent && !view.opponent.deleted) return {...view,status:'playing' as const,turn:(1-view.seat) as 0|1};
}
// The store's subscriber replaces the data-page and #reload observers: the end screen follows its screen and its lock.
// A screen or lock change can require a result update without a new game view.
let endKey: string | undefined;
export function endSync(page: Page) {
  if (stopped || queue.closed()) return;
  const key = `${page.screen}:${$<HTMLButtonElement>('reload').disabled}:${staleRead(page)}`;
  if (key === endKey) return;
  endKey = key;
  // Hand the table to the end screen in the same pass as the screen switch. The board then never sits in a
  // hidden box, so #board keeps its box and the canvas does not redraw at a new size. The end card overlays it.
  if (page.screen === 'end') { $('end-table').append($('game-table')); clearTimeout(updateTimer); updateTimer = setTimeout(updateEnd, 0); }
  else if (scrim) closeEnd();
}
/** The rematch watch: the one poll reads the finished game until a rematch or a reply comes (design §4). */
export function endPoll(): PollTarget | undefined {
  const view = pollView();
  return view && { view, read: async () => { await call('kingdown_get', { since_revision: pollSince(view) }, false, true); updateEnd(); } };
}
export function updateEnd() {
  if (stopped || queue.closed()) return;
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
    void send('kingdown_resume', {game_id:game}, { retain: true, route: false }).then(outcome => {
      if (stopped || queue.closed()) return;
      if (outcome.status === 'superseded') resumed.delete(game);
      const next = outcome.status === 'done' ? outcome.view as View | undefined : undefined;
      if (next && client.state.screen === 'end' && endGame === ended) routeView(next);
    }).finally(() => { updating = false; });
  } else if (!read.has(view.game_id)) {
    if (memory.view?.rules) { read.add(view.game_id); return; }
    updating = true;
    void call('kingdown_get', {}, true).then(next => { if (next) read.add(view.game_id); }).finally(() => { updating = false; endScreen(); });
  }
}
export function endScreen(schedule = true) {
  if (stopped || queue.closed()) return;
  const view = boardGame(); if (!view || client.state.screen !== 'end') return;
  if (!['finished','aborted'].includes(view.status)) { closeEnd(); routeView(view); return; }
  if (endGame !== view.game_id) { endGame = view.game_id; looking = false; if (guardedGame !== endGame) tapReadyAt = 0; }
  const fresh=memory.view, opponent=fresh?.game_id===view.game_id?fresh.opponent:view.opponent, rematchAllowed=fresh?.game_id===view.game_id?fresh.rematch_allowed:view.rematch_allowed, rematches=rematchChoices({...view,opponent,rematch_allowed:rematchAllowed});
  if (document.querySelector('#board-sheet[open]') && document.querySelector('#over.end-card[open]')) return;
  const over = $<HTMLDialogElement>('over');
  // The page lock pass resets data-free buttons; keep the result's stricter read/queue lock.
  for (const b of over.querySelectorAll<HTMLButtonElement>('button.game-action')) b.disabled = !!queuedRematch || readFailed();
  const nextContentKey = JSON.stringify([view.game_id, view.seat, view.kind, view.rating_policy, view.result,
    ending(view), view.rules?.kings, view.outcome, rematches, view.rematch_offer,
    opponent?.computer, opponent?.deleted, rematchAllowed, memory.blockNotice]);
  // Poll times and presence do not change the result. Keep its controls, focus and board inspection mounted.
  if (contentKey === nextContentKey && (over.open || looking)) return;
  contentKey = nextContentKey;
  if (!looking) closeBoardSheet();
  const error = document.querySelector('.page-error')!; error.remove();
  if (!scrim) {
    scrim = document.createElement('div'); scrim.id = 'end-scrim'; scrim.className = 'scrim'; scrim.hidden=true; $('app-frame').insertBefore(scrim,over);
    observer = new MutationObserver(() => { if (stopped || queue.closed()) return; const skip = document.getElementById('end-skip'); if (skip) skip.hidden = !$('board').dataset.toppling; });
    observer.observe($('board'),{attributes:true,attributeFilter:['data-toppling']});
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
  $('end-reason').textContent = [policyLabel(view.rating_policy, view.kind), endReason(view)].filter(Boolean).join(' · ');
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
      skipBoardCeremony(); queuedRematch ??= {game:view.game_id,choice}; updateEnd();
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
  form.append(button('New game',()=>{if (performance.now() < tapReadyAt) return; const current=boardGame(); if (!current) return; draftFromGame(current); closeEnd(); showNewGame();}));
  const see = button('See the board',()=>{skipBoardCeremony(); looking=true; document.querySelector('.page-sheet')!.append(error); over.close(); scrim.hidden=true; $('end-result').hidden=false; $('end-result').focus();}); form.append(see);
  const skip = button('Skip',()=>{skipBoardCeremony(); see.focus();}); skip.id='end-skip'; skip.hidden=!$('board').dataset.toppling; form.append(skip);
  $('end-result').onclick = () => { looking=false; $('end-result').hidden=true; endScreen(); };
  (looking ? document.querySelector('.page-sheet')! : over).append(error);
  over.querySelector('.quiet-line')!.textContent = opponent?.deleted || rematchAllowed === false ? '' : view.rematch_offer === view.seat ? 'Rematch offered. Waiting for your opponent.' : view.rematch_offer != null ? 'Your opponent offers a rematch.' : rematches.length ? view.kind==='solo' ? 'Play again with the same rules and colour.' : 'A rematch is Casual. It keeps the features and swaps the colours. Return to Ranked to find another ranked opponent.' : '';
  if (over.open) scrim.hidden=false;
  else if (!opening && !looking) {
    opening=true; const game=view.game_id;
    const show=()=>{
      if (stopped || queue.closed() || client.state.screen!=='end' || boardGame()?.game_id!==game) {opening=false; return;}
      opening=false; if(!looking){if(!over.open) { over.show(); if (tapReadyAt === Infinity) tapReadyAt = performance.now() + 1000; } scrim.hidden=false;}
    };
    showFrame = requestAnimationFrame(show);
  }
  pollUpdate();
  if (schedule) { clearTimeout(updateTimer); updateTimer = setTimeout(updateEnd,0); }
}

onStop(() => { stopped = true; clearTimeout(updateTimer); cancelAnimationFrame(showFrame); observer?.disconnect(); if (scrim) closeEnd(); read.clear(); resumed.clear(); });
