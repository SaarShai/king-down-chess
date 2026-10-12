import { call, client, memory, navigate } from '../app';
import { art } from '../art';
import { ending } from '../ending';
import { runPoll } from '../poll';
import { PLAIN_KINGS } from '../../rules/engine';
import { boardGame, boardLastMove, closeBoardSheet, sendBoardCommand } from './board';
import { rematchChoices } from './end-model';
import './end.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
let scrim: HTMLElement, poll: ReturnType<typeof runPoll> | undefined, observer: MutationObserver;
const read = new Set<string>(), resumed = new Set<string>();
let updating = false, stopped = false, opening = false;
const button = (label: string, click: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = click; return b; };
function closeEnd() {
  const error = document.querySelector('.page-error'); if (error) document.querySelector('.page-sheet')!.append(error);
  if ($('over').classList.contains('end-card')) { $<HTMLDialogElement>('over').close(); $('over').classList.remove('end-card'); }
  if (scrim) scrim.hidden = true;
  opening = false;
  poll?.stop(); poll = undefined;
}
export function updateEnd() {
  if (client.state.screen !== 'end') { closeEnd(); return; }
  endScreen(false);
  if (updating || $<HTMLButtonElement>('reload').disabled || client.state.pending) return;
  const view = boardGame(); if (!view) return;
  if (view.rematch_game_id && !resumed.has(view.rematch_game_id)) {
    const game = view.rematch_game_id; resumed.add(game); updating = true;
    void call('kingdown_resume', {game_id:game}).then(next => { if (!next) resumed.delete(game); }).finally(() => { updating = false; });
  } else if (!read.has(view.game_id)) {
    read.add(view.game_id);
    if (memory.view?.rules) return;
    updating = true;
    void call('kingdown_get', {}).finally(() => { updating = false; endScreen(); });
  }
}
export function endScreen(schedule = true) {
  const view = boardGame(); if (!view || client.state.screen !== 'end') return;
  const fresh=memory.view, opponent=fresh?.game_id===view.game_id?fresh.opponent:view.opponent, rematches=rematchChoices({...view,opponent});
  closeBoardSheet();
  const over = $<HTMLDialogElement>('over');
  const error = document.querySelector('.page-error')!; error.remove();
  if (!scrim) {
    scrim = document.createElement('div'); scrim.id = 'end-scrim'; scrim.className = 'scrim'; scrim.hidden=true; $('app-frame').insertBefore(scrim,over);
    observer = new MutationObserver(() => { if (client.state.screen === 'end') setTimeout(updateEnd,0); else closeEnd(); });
    observer.observe(document.body,{attributes:true,attributeFilter:['data-page']}); observer.observe($('reload'),{attributes:true,attributeFilter:['disabled']});
    window.addEventListener('message',event=>{ if(event.data?.method==='ui/resource-teardown') {stopped=true; closeEnd(); observer.disconnect();} });
  }
  $('end-table').append($('game-table')); $('table-bar').hidden = true;
  over.className = 'end-card'; over.setAttribute('aria-labelledby','over-title');
  over.innerHTML = '<div class="over-art" aria-hidden="true"></div><p class="over-words"></p><h2 id="over-title"></h2><p id="end-reason"></p><div class="end-facts"></div><form method="dialog"></form><p class="quiet-line"></p>';
  const kings = view.rules?.kings;
  for (const side of [0,1] as const) {
    const img = document.createElement('img'); img.className = 'over-king over-' + (side ? 'b':'w'); img.alt = '';
    img.src = art(`ui/kings/${(kings?.[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}${side ? '-b':''}.webp`); over.querySelector('.over-art')!.append(img);
  }
  const result = view.result;
  over.querySelector('.over-words')!.textContent = result?.reason === 'checkmate' ? 'King Down' : '';
  $('over-title').textContent = !result || ['abort','no_start'].includes(result.reason) ? ending(view) : result.winner === null ? 'Draw' : result.winner === view.seat ? 'You win' : 'You lose';
  $('end-reason').textContent = [ending(view).split(' · ').at(-1),boardLastMove()?.words].filter(Boolean).join('. ');
  const outcome = view.kind !== 'solo' && view.outcome;
  if (outcome) {
    const facts = over.querySelector('.end-facts')!;
    if (outcome.rating !== null) {
      const line = document.createElement('span'); line.textContent = 'Rating ';
      const rating = document.createElement('b'); rating.textContent = String(Math.round(outcome.rating)); line.append(rating);
      if (outcome.provisional) {const q=document.createElement('span'); q.className='q'; q.textContent='?'; line.append(q);}
      if (outcome.rating_before !== null) { const delta=Math.round(outcome.rating-outcome.rating_before), change=document.createElement('small'); change.textContent=' '+(delta>=0?'+':'')+delta; line.append(change); }
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
    const b = button(choice==='offer'?'Rematch':choice==='accept'?'Accept':'Decline',()=>void sendBoardCommand('kingdown_rematch',{choice}));
    if (choice!=='decline') b.className='primary'; form.append(b);
  }
  form.append(button('Your games',()=>{closeEnd(); navigate('profile');}));
  over.append(error);
  over.querySelector('.quiet-line')!.textContent = opponent?.deleted ? '' : view.rematch_offer === view.seat ? 'Rematch offered. Waiting for your opponent.' : view.rematch_offer != null ? 'Your opponent offers a rematch.' : rematches.length ? 'A rematch keeps the features and swaps the colours.' : '';
  if (over.open) scrim.hidden=false;
  else if (!opening) {
    opening=true; const game=view.game_id;
    const show=()=>{
      if (stopped || client.state.screen!=='end' || boardGame()?.game_id!==game) {opening=false; return;}
      if ($('board').dataset.animating==='true') {requestAnimationFrame(show); return;}
      requestAnimationFrame(()=>{opening=false; if(!stopped&&client.state.screen==='end'&&boardGame()?.game_id===game){if(!over.open) over.show(); scrim.hidden=false;}});
    };
    requestAnimationFrame(show);
  }
  poll ??= runPoll(()=>!stopped && client.state.screen==='end' && boardGame()?.kind!=='solo' && boardGame()?.rematch_offer != null ? {...boardGame()!,status:'playing',turn:(1-boardGame()!.seat) as 0|1} : undefined, async()=>{
    await Promise.resolve();
    if (stopped || client.state.screen!=='end' || boardGame()?.kind==='solo' || boardGame()?.rematch_offer == null) return;
    if (!client.state.pending && !$<HTMLButtonElement>('reload').disabled) await call('kingdown_get',{since_revision:boardGame()?.revision},false,true);
    updateEnd();
  }); poll.update();
  if (schedule) setTimeout(updateEnd,0);
}
