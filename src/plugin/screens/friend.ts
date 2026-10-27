import { features, icon } from '../../account-game/features';
import { call, client, memory, navigate, renderGameRows, routeView, queue, send } from '../../account-game/runtime';
import { art } from '../../account-game/art';
import { formatDate } from '../../account-game/games-list';
import { friendInvites as codes, sendInvite } from '../invite';
import { ICONS, type Icon } from '../../account/profile';
import type { View } from '../../match/protocol';
import './lobby.css';
import { errorText } from '../../account-game/types';
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
/** After Cancel: drop the game's code and go to Play. A retried Cancel runs it as its continuation. */
export function finishCancel(next: View) { codes.delete(next.game_id); navigate('play'); return Promise.resolve(); }
export function portrait(key: Icon | null | undefined, big = false) {
  const span = document.createElement('span'); span.className = `portrait${big ? ' big' : ''}`;
  key = key && Object.hasOwn(ICONS, key) ? key : 'spirit';
  const img = document.createElement('img'); img.src = art(ICONS[key]); img.alt = ''; span.append(img);
  return span;
}
export function row(title: string, lead: HTMLElement | string, line: (string | Node)[], tag: 'div' | 'button' = 'div') {
  const el = document.createElement(tag); el.className = 'menu-row has-lead';
  const head = document.createElement('span'); head.className = 'row-title'; head.textContent = title;
  const sub = document.createElement('span'); sub.className = 'line'; sub.append(...line);
  if (typeof lead === 'string') { const span = document.createElement('span'); span.className = 'row-ico'; span.innerHTML = icon(lead); el.append(span); } else el.append(lead);
  el.append(head, sub); return el;
}
export function toolError(code: string, fallback: string) {
  return ({ INVITE_UNAVAILABLE: /expired|used/i.test(fallback) ? 'This code has expired or was used. Ask your friend for a new code.' : 'No game has this code. Check the code with your friend.', NOT_FOUND: 'No game has this code. Check the code with your friend.', FORBIDDEN: 'You cannot join this game.', INVALID_INPUT: 'Check the code: 6 letters and digits.', RATE_LIMITED: /code/i.test(fallback) ? 'Too many code tries. Wait one hour.' : fallback } as Record<string, string>)[code] ?? fallback;
}
export function showError(error: unknown, target = $('error')) { target.textContent = errorText(error); }
let making = false;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
export function friendScreen() {
  if (stopped || queue.closed()) return;
  clearTimeout(expiryTimer);
  const view = memory.view;
  $('page-title').textContent = 'Your game code';
  if (view?.kind === 'friend' && view.status !== 'waiting') { routeView(view); return; }
  if (!view || view.kind !== 'friend' || view.status !== 'waiting') {
    $('friend-status').textContent = 'Open your friend game from Your games.'; return;
  }
  $('friend-status').textContent = '';
  const saved = codes.get(view.game_id), invite = saved && !saved.replaced && Date.parse(saved.expires_at) > Date.now() ? saved : undefined, tiles = $('friend-code');
  tiles.replaceChildren(...[...invite?.code ?? ''].map(c => { const span = document.createElement('span'); span.textContent = c; return span; }));
  tiles.setAttribute('aria-label', invite ? [...invite.code].join(' ') : ''); tiles.hidden = !invite;
  $('friend-actions').hidden = !invite; $('friend-new').hidden = !!invite;
  $('friend-copy-status').textContent = '';
  $('friend-help').textContent = invite ? `Your friend says “Join King Down game ${invite.code}” in ChatGPT, or types the code in Menu. They need the King Down connection.` : saved?.replaced ? 'This code was replaced on another page. Make a new code to invite your friend.' : saved ? 'This code has expired. Make a new code to invite your friend.' : 'The saved game has no code on this page. A new code ends the old code.';
  $('friend-game').replaceChildren(row('Waiting for your friend', 'clock', [invite ? `Ends ${formatDate(invite.expires_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.` : 'Make a new code to share this game.']));
  $('friend-game').querySelector('.line')!.id = 'friend-expiry';
  if (view.options) $('friend-game').append(row('Features', 'fairy', [features(view.options), `You play ${view.seat === 0 ? 'White' : 'Black'}.`]));
  $('friend-share').onclick = () => { if (invite) void sendInvite(invite, view.options, $('friend-copy-status')); };
  $('friend-copy').onclick = () => { if (invite) void sendInvite(invite, view.options, $('friend-copy-status'), false); };
  $('friend-new').onclick = () => void makeCode(view);
  $('friend-cancel').onclick = async () => { const next = await call('kingdown_abort', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision }, true, false, false); if (next) finishCancel(next); };
  if (invite) expiryTimer = setTimeout(() => {
    if (stopped || queue.closed()) return;
    renderGameRows();
    if (client.state.screen === 'friend' && memory.view?.game_id === view.game_id) friendScreen();
  }, Date.parse(invite.expires_at) - Date.now());
}
async function makeCode(view: View) {
  if (stopped || queue.closed() || making) return; making = true; $('friend-new').setAttribute('disabled', '');
  try {
    const outcome = await send('kingdown_invite', { game_id: view.game_id }, { route: false });
    if (stopped || queue.closed()) return;
    if (outcome.status === 'superseded') return;
    if (outcome.status !== 'done') throw new Error(outcome.text);
    codes.set(view.game_id, outcome.result.structuredContent as NonNullable<ReturnType<typeof codes.get>>);
    renderGameRows();
    if (client.state.screen === 'friend' && memory.view?.game_id === view.game_id) friendScreen();
  } catch (error) { if (!stopped && !queue.closed()) showError(error, $('friend-status')); }
  finally { making = false; if (!stopped && !queue.closed()) $('friend-new').removeAttribute('disabled'); }
}
// These screens own no App instance. Stop their runners on the host teardown and page close. A pagehide with
// persisted: true puts the page in the back-forward cache: its timers freeze, and the page can come back with them.
let stopped = false;
const stops = new Set<() => void>(), events = new AbortController();
export function onStop(stop: () => void) { stops.add(stop); return () => stops.delete(stop); }
export function stopAll() { stopped = true; events.abort(); for (const stop of stops) stop(); stops.clear(); }
addEventListener('pagehide', event => { if (!event.persisted) stopAll(); }, { signal: events.signal });
addEventListener('message', event => { if (event.source === parent && event.data?.method === 'ui/resource-teardown') stopAll(); }, { signal: events.signal });
onStop(() => clearTimeout(expiryTimer));
