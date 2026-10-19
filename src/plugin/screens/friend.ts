import { call, client, memory, navigate, renderGameRows, routeView } from '../app';
import { art } from '../art';
import { formatDate } from '../games-list';
import { featureNames, friendInvites as codes, inviteText, ruleNames, sendInvite } from '../invite';
import { ICONS, type Icon } from '../../account/profile';
import type { Options } from '../../match/setup';
import type { View } from '../../match/protocol';
import './lobby.css';
import { errorText } from '../client';
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
export const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export { featureNames };
/** After Cancel: drop the game's code and go to Play. A retried Cancel runs it as its continuation. */
export function finishCancel(next: View) { codes.delete(next.game_id); navigate('play'); return Promise.resolve(); }
export function features(options: Options | null | undefined, words = false) {
  const span = document.createElement('span'); span.className = 'feats';
  if (words) { span.classList.add('words'); span.textContent = ruleNames(options); return span; }
  for (const [field, name, label] of featureNames) if (options?.[field]) { const mark = document.createElement('span'); mark.title = label; mark.setAttribute('role', 'img'); mark.setAttribute('aria-label', label); mark.innerHTML = icon(name); span.append(mark); }
  return span;
}
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
const attempted = new Set<string>();
let making = false;
export function friendScreen() {
  const view = memory.view;
  $('page-title').textContent = 'Your game code';
  if (view?.kind === 'friend' && view.status !== 'waiting') { routeView(view); return; }
  if (!view || view.kind !== 'friend' || view.status !== 'waiting') {
    $('friend-status').textContent = 'Open your friend game from Your games.'; return;
  }
  $('friend-status').textContent = '';
  const invite = codes.get(view.game_id), tiles = $('friend-code');
  tiles.replaceChildren(...[...invite?.code ?? ''].map(c => { const span = document.createElement('span'); span.textContent = c; return span; }));
  tiles.setAttribute('aria-label', invite ? [...invite.code].join(' ') : ''); tiles.hidden = !invite;
  $('friend-actions').hidden = !invite; $('friend-new').hidden = !!invite;
  $('friend-copy-status').textContent = '';
  $('friend-help').textContent = invite ? `Your friend says “Join King Down game ${invite.code}” in ChatGPT, or types the code in Play. They need the King Down connection.` : 'The saved game has no code on this page. A new code ends the old code.';
  $('friend-game').replaceChildren(row('Waiting for your friend', 'clock', [invite ? `Ends ${formatDate(invite.expires_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.` : 'Make a new code to share this game.']));
  $('friend-game').querySelector('.line')!.id = 'friend-expiry';
  if (view.options) $('friend-game').append(row('Features', 'fairy', [features(view.options), `You play ${view.seat === 0 ? 'White' : 'Black'}.`]));
  $('friend-share').onclick = () => { if (invite) void sendInvite(inviteText(invite.code, view.options), $('friend-copy-status')); };
  $('friend-copy').onclick = () => { if (invite) void sendInvite(inviteText(invite.code, view.options), $('friend-copy-status'), false); };
  $('friend-new').onclick = () => void makeCode(view);
  $('friend-cancel').onclick = async () => { const next = await call('kingdown_abort', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision }, true, false, false); if (next) finishCancel(next); };
  // Create routes before the inbox read. A remount reads the inbox first and never renews the invite.
  if (!invite && !attempted.has(view.game_id) && !memory.games.some(game => game.game_id === view.game_id)) void makeCode(view);
}
async function makeCode(view: View) {
  if (making) return; making = true; attempted.add(view.game_id); $('friend-new').setAttribute('disabled', '');
  try {
    const result = await client.call('kingdown_invite', { game_id: view.game_id });
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    codes.set(view.game_id, result.structuredContent as { code: string; expires_at: string });
    renderGameRows();
    if (client.state.screen === 'friend' && memory.view?.game_id === view.game_id) friendScreen();
  } catch (error) { showError(error, $('friend-status')); }
  finally { making = false; $('friend-new').removeAttribute('disabled'); }
}
// These screens own no App instance. Stop their runners on the host teardown and page close. A pagehide with
// persisted: true puts the page in the back-forward cache: its timers freeze, and the page can come back with them.
const stops = new Set<() => void>();
export function onStop(stop: () => void) { stops.add(stop); return () => stops.delete(stop); }
function stopAll() { for (const stop of stops) stop(); stops.clear(); }
addEventListener('pagehide', event => { if (!event.persisted) stopAll(); });
addEventListener('message', event => { if (event.source === parent && event.data?.method === 'ui/resource-teardown') stopAll(); });
