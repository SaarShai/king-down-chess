import { features, icon } from '../../account-game/features';
import { call, client, memory, navigate, renderGameRows, routeView, queue, send, showNewGame } from '../../account-game/runtime';
import { art } from '../../account-game/art';
import { formatDate } from '../../account-game/games-list';
import { friendInvites as codes, inviteLink, sendInvite } from '../invite';
import { ICONS, type Icon } from '../../account/profile';
import type { View } from '../../match/protocol';
import './lobby.css';
import { errorText } from '../../account-game/types';
import { UiMotion } from '../../ui/motion';
import { inviteCopied } from '../../ui/object-motion';
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
/** After Cancel: drop the game's invite and go to Play. A retried Cancel runs it as its continuation. */
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
  return ({ NOT_FOUND: 'This invite link opens no game. Ask your friend for a new link.', FORBIDDEN: 'You cannot join this game.', INVALID_INPUT: 'This invite link is not complete. Ask your friend to send it again.', RATE_LIMITED: /code/i.test(fallback) ? 'Too many invite tries. Wait one hour.' : fallback } as Record<string, string>)[code] ?? fallback;
}
export function showError(error: unknown, target = $('error')) { target.textContent = errorText(error); }
let making = false;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
let copyMotion: UiMotion | undefined;
let copyEvent = 0;
export function friendScreen() {
  if (stopped || queue.closed()) return;
  copyEvent++; copyMotion?.cancel();
  clearTimeout(expiryTimer);
  const view = memory.view;
  $('page-title').textContent = 'Invite a friend';
  if (view?.kind === 'friend' && view.status !== 'waiting') { routeView(view); return; }
  if (!view || view.kind !== 'friend' || view.status !== 'waiting') {
    $('friend-status').textContent = 'Open your friend game from Your games.'; return;
  }
  $('friend-status').textContent = '';
  const saved = codes.get(view.game_id), expired = !!saved && !(Date.parse(saved.expires_at) > Date.now());
  // Code tiles are parked (docs/PARKED.md): the page shows and sends the invite link, which holds the code.
  const invite = saved && !saved.replaced && !expired ? saved : undefined, link = $('friend-link');
  const words = document.createElement('span'); words.textContent = invite ? inviteLink(invite) : '';
  link.replaceChildren(words); link.hidden = !invite;
  $('friend-actions').hidden = !invite; $('friend-new').hidden = !!invite;
  $('friend-new').textContent = expired ? 'New game' : 'Make a new link';
  $('friend-copy-status').textContent = '';
  $('friend-help').textContent = invite ? 'Your friend opens the link and signs in to join.' : expired ? 'This invite link has expired. Start a new game to invite your friend.' : saved?.replaced ? 'This invite link was replaced on another page. Make a new link to invite your friend.' : 'The saved game has no invite link on this page. A new link ends the old link.';
  $('friend-game').replaceChildren(row(expired ? 'Invitation expired' : 'Waiting for your friend', 'clock', [invite ? `Ends ${formatDate(invite.expires_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.` : expired ? 'Start a new game to invite your friend.' : 'Make a new link to share this game.']));
  $('friend-game').querySelector('.line')!.id = 'friend-expiry';
  if (view.options) $('friend-game').append(row('Features', 'fairy', [features(view.options), `You play ${view.seat === 0 ? 'White' : 'Black'}.`]));
  const copy = async (share: boolean) => {
    if (!invite) return;
    copyMotion?.dispose();
    copyMotion = new UiMotion(() => !stopped && client.state.screen === 'friend' && !memory.settings?.symbols_only, () => 'fast');
    const event = ++copyEvent;
    const result = await sendInvite(invite, view.options, $('friend-copy-status'), share);
    if (result === 'copied' && event === copyEvent && !stopped && !queue.closed() && client.state.screen === 'friend' && memory.view?.game_id === view.game_id && codes.get(view.game_id) === invite && !invite.replaced && Date.parse(invite.expires_at) > Date.now()) inviteCopied(copyMotion, link, $('friend-copy-status'), performance.now());
  };
  $('friend-share').onclick = () => void copy(true);
  $('friend-copy').onclick = () => void copy(false);
  $('friend-new').onclick = () => expired ? showNewGame() : void makeCode(view);
  $('friend-cancel').onclick = async () => { const next = await call('kingdown_abort', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision }, true, false, false); if (next) finishCancel(next); };
  if (saved && !expired) expiryTimer = setTimeout(() => {
    if (stopped || queue.closed()) return;
    renderGameRows();
    if (client.state.screen === 'friend' && memory.view?.game_id === view.game_id) friendScreen();
  }, Date.parse(saved.expires_at) - Date.now());
}
async function makeCode(view: View) {
  if (stopped || queue.closed() || making) return; making = true; $('friend-new').setAttribute('disabled', '');
  try {
    const outcome = await send('kingdown_invite', { game_id: view.game_id }, { route: false });
    if (stopped || queue.closed()) return;
    if (outcome.status === 'superseded') return;
    if (outcome.status === 'refused' && outcome.code === 'INVITE_UNAVAILABLE')
      codes.set(view.game_id, { code: '', expires_at: new Date(0).toISOString() });
    else if (outcome.status === 'done') codes.set(view.game_id, outcome.result.structuredContent as NonNullable<ReturnType<typeof codes.get>>);
    else throw new Error(outcome.text);
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
onStop(() => { clearTimeout(expiryTimer); copyMotion?.dispose(); });
