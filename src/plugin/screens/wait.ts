import { call, client, gameActionsBlocked, memory, navigate, pollUpdate, queue, routeView, start } from '../../account-game/runtime';
import { setupBusy } from './setup';
import type { Job } from '../queue';
import { art } from '../../account-game/art';
import type { PollTarget } from '../poll';
import { DEFAULT_OPTIONS, defaultChoice } from '../../match/setup';
import type { View } from '../../match/protocol';
import { $, onStop, portrait, showError } from './friend';
import { features } from '../../account-game/features';
import { UiMotion } from '../../ui/motion';
import { opponentFound } from '../../ui/object-motion';
let open: View | undefined, began = 0, timer: ReturnType<typeof setInterval> | undefined;
let stopped = false;
let watched: string | undefined, offering = false, switching = false, background = false;
const dismissed = new Set<string>();
let abortReceipt: View | undefined, recoverJoined: boolean | undefined;
let foundMotion: UiMotion | undefined;
const shown = new Set<string>();
export function waitScreen() {
  if (stopped || queue.closed()) return;
  const view = memory.view;
  if (view?.kind === 'random') {
    if (view.status !== 'waiting') { routeView(view); return; }
    if (open?.game_id !== view.game_id) began = Date.now() - Math.max(0, Date.parse(view.server_now) - Date.parse(view.created_at));
    open = view;
  }
  if (!open || open.status !== 'waiting') {
    $('wait-status').textContent = 'Open your waiting game from Your games.';
    const entry = memory.games.find(game => game.kind === 'random' && game.status === 'waiting');
    if (entry) { syncWatch(); void readOpen(entry.game_id); }
    return;
  }
  $('wait-status').textContent = '';
  $('wait-features').hidden = !open.options;
  $('wait-features').replaceChildren('Your game is open with these features: ', features(open.options));
  document.querySelectorAll<HTMLImageElement>('[data-screen="wait"] [data-art]').forEach(img => { img.src = art(img.dataset.art!); });
  $('wait-computer').onclick = () => void computer();
  $('wait-cancel').onclick = async () => {
    if (!open) return;
    const origin = queue.command('write', 'kingdown_cancel', {});
    const next = await call('kingdown_cancel', { game_id: open.game_id }, { route: false, origin });
    if (next) { open = undefined; stopWatch(); await call('kingdown_games', {}, { origin }); if (queue.current(origin)) navigate('lobby'); }
  };
  clearInterval(timer); timer = setInterval(tick, 1000); tick(); syncWatch();
}
function tick() {
  if (stopped || queue.closed() || client.state.screen !== 'wait' || !open) return;
  const seconds = Math.max(0, Math.floor((Date.now() - began) / 1000));
  $('page-title').textContent = 'Finding an opponent';
  $('wait-time').textContent = `Waiting ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.`;
  $('wait-computer').hidden = seconds < 25;
}
async function computer() {
  // A failed handoff Choose or Get keeps its solo game: its Retry or Try again finishes it, never a second Create.
  if (!open || offering || setupBusy() || gameActionsBlocked()) return; offering = true;
  try {
    const options = open.options ?? DEFAULT_OPTIONS;
    await start('solo', { options, colour: open.seat === 0 ? 'white' : 'black', level: memory.settings?.last_setup?.level ?? 'club' }, { route: false, then: finishComputer });
  } finally { offering = false; }
}
/** Create and its Retry use the same automatic setup and full read. */
export async function finishComputer(solo: View, origin: Job) {
  if (solo.status === 'setup' && solo.draw) {
    const options = solo.options ?? DEFAULT_OPTIONS;
    const choice = defaultChoice(options, { army: solo.draw, hand: solo.deal ?? [] }, solo.seat, Math.random, false);
    const args = { game_id: solo.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: solo.revision, ...choice, ready: true };
    await call('kingdown_choose', args, { retain: true, route: false, origin, then: finishHandoff });
  } else await finishHandoff(solo, origin);
}
/** The continuation of the handoff's Choose, also after Retry (design §5.2): read the game, then watch the human game. */
export async function finishHandoff(_next?: View, origin?: Job) {
  if (await call('kingdown_get', {}, { route: true, origin })) syncWatch();
}
async function readOpen(game: string) {
  if (queue.closed() || watched !== game) return;
  const job = queue.command('read', 'kingdown_get', { game_id: game }, { user: false });
  const current = () => queue.current(job) && watched === game;
  await queue.run(job, async () => {
    const result = await client.call('kingdown_get', { game_id: game }, { background: true });
    if (!current()) return;
    if (result.isError) { if (client.state.screen === 'wait') showError(new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' ')), $('wait-status')); return; }
    const next = result._meta?.view as View | undefined;
    if (!next || next.game_id !== game || !['wait','board'].includes(client.state.screen)) return;
    if (open?.game_id !== next.game_id) began = Date.now() - Math.max(0, Date.parse(next.server_now) - Date.parse(next.created_at));
    const joinedNow = open?.game_id === next.game_id && open.status === 'waiting';
    open = next;
    if (next.status === 'waiting') { if (client.state.screen === 'wait' && memory.view?.kind !== 'random') waitScreen(); return; }
    stopWatch();
    if (next.status === 'aborted' || next.status === 'finished') { if (client.state.screen === 'wait') navigate('lobby'); return; }
    recoverJoined = false;
    if (client.state.screen === 'wait') await call('kingdown_resume', { game_id: next.game_id }, { route: true, origin: job });
    else if (memory.view?.kind === 'solo' && memory.view.status === 'playing' && !dismissed.has(next.game_id)) found(next, joinedNow);
  });
}
function syncWatch() {
  if (stopped || queue.closed()) return;
  recoverJoined ??= client.state.screen === 'board';
  if (open && memory.view?.game_id === open.game_id) open = memory.view;
  const solo = memory.view?.kind === 'solo' && memory.view.status === 'playing';
  const active = solo && ['board','wait'].includes(client.state.screen);
  const joined = recoverJoined && solo ? memory.games.filter(game => game.kind === 'random' && game.status !== 'waiting' && Date.parse(game.created_at) <= Date.parse(memory.view!.created_at) && Date.parse(game.updated_at) >= Date.parse(memory.view!.created_at))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] : undefined;
  if (!joined && memory.view && memory.games.some(game => game.game_id === memory.view?.game_id)) recoverJoined = false;
  const entry = memory.games.find(game => game.kind === 'random' && game.status === 'waiting') ?? joined;
  const id = open?.status === 'waiting' ? open.game_id : entry?.game_id;
  if (!id || solo && id === memory.view?.game_id || dismissed.has(id)) { stopWatch(); return; }
  if (watched === id) {
    if (active && !background) { background = true; void readOpen(id); }
    else if (!active) background = false;
    return;
  }
  if (!active && client.state.screen !== 'wait') return;
  stopWatch(); watched = id; background = active; if (active) void readOpen(id);
  pollUpdate();
}
/**
 * The watch of a waiting human game, a target of the one poll (design §4). The wait clock runs on Play too; only a
 * computer board or the wait screen makes it read. It never selects that game.
 */
export function waitPoll(): PollTarget | undefined {
  const id = watched;
  return !stopped && !queue.closed() && id ? { view: open?.game_id === id ? open : 'waiting for a join', read: async () => {
    if (memory.view?.kind === 'solo' && memory.view.status === 'playing' && ['board','wait'].includes(client.state.screen)) await readOpen(id);
  } } : undefined;
}
function found(human: View, live: boolean) {
  if (stopped || queue.closed()) return;
  const over = $<HTMLDialogElement>('over');
  // An open dialog stays: a later watch read does not rebuild Switch now (or its error) while the player answers.
  if (over.open) return;
  over.className = 'found'; over.setAttribute('aria-labelledby', 'found-title');
  over.innerHTML = '<div class="over-art"></div><h2 id="found-title">Opponent found</h2><p></p><form method="dialog"><button id="found-switch" class="primary" type="button">Switch now</button><button id="found-later" type="button">Not now</button></form><p id="found-error" role="alert"></p>';
  over.querySelector('.over-art')!.append(portrait(human.opponent?.icon, true));
  const name = document.createElement('b'); name.textContent = human.opponent?.handle ?? (human.kind === 'friend' ? 'Your friend' : 'Your opponent');
  over.querySelector('p')!.append(name, ' joined your open game. Switch now? The computer game then ends with no result.');
  $('found-later').onclick = () => { dismissed.add(human.game_id); over.close(); void call('kingdown_games', {}); };
  $('found-switch').onclick = async () => {
    if (switching) return;
    const origin = queue.command('write', 'kingdown_abort', {});
    switching = true; $<HTMLButtonElement>('found-switch').disabled = true;
    try {
      const solo = memory.view;
      if (solo?.kind === 'solo' && solo.status === 'playing' && abortReceipt?.game_id !== solo.game_id) {
        const result = await client.call('kingdown_abort', { game_id: solo.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: solo.revision });
        if (!queue.current(origin)) return;
        if (result.isError && result._meta?.code !== 'NOT_ALLOWED') throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
        if (!result.isError) abortReceipt = result._meta?.view as View;
      }
      const next = await call('kingdown_resume', { game_id: human.game_id }, { route: false, origin });
      if (!queue.current(origin)) return;
      if (next) { over.close(); routeView(next); await call('kingdown_games', {}, { origin }); }
      else showError(new Error($('error').textContent ?? 'Could not open the game.'), $('found-error'));
    } catch (error) { if (!stopped && queue.current(origin)) showError(error, $('found-error')); }
    finally { switching = false; if (!stopped && !queue.closed()) { const button = $<HTMLButtonElement>('found-switch'); if (button) button.disabled = false; } }
  };
  if (!over.open) over.showModal();
  foundMotion ??= new UiMotion(() => !stopped && client.state.screen === 'board' && over.open && over.classList.contains('found') && !memory.settings?.symbols_only, () => 'fast');
  over.addEventListener('close', () => foundMotion?.cancel(), { once: true });
  const at = live && !shown.has(human.game_id) ? performance.now() : -Infinity;
  shown.add(human.game_id); opponentFound(foundMotion, over, at);
}
function stopWatch() { watched = undefined; background = false; }
export function waitSync() {
  if (stopped || queue.closed()) return;
  if (client.state.screen !== 'wait') { clearInterval(timer); timer = undefined; }
  if (client.state.screen !== 'board' || memory.settings?.symbols_only) foundMotion?.cancel();
  syncWatch();
}
// The games list changes outside the store: its rows can name a new waiting game.
const observer = new MutationObserver(waitSync);
observer.observe($('games-list'), { childList: true });
onStop(() => { stopped = true; clearInterval(timer); timer = undefined; stopWatch(); observer.disconnect(); foundMotion?.dispose(); open = undefined; abortReceipt = undefined; dismissed.clear(); shown.clear(); });
