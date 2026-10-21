import { call, client, memory, navigate, routeView, send, start } from '../../account-game/runtime';
import { switches } from '../../match/setup';
import type { InboxEntry, Lobby, RatingPolicy, View } from '../../match/protocol';
import type { PollTarget } from '../poll';
import type { Page } from '../../account-game/state';
import { ANY_RULES, currentSetup } from './setup';
import { $, onStop, portrait, row, showError } from './friend';
import { policyLabel, RANKED_RULES } from '../../account-game/rating-policy';
import { createArguments } from './setup-model';
import { featureNames, features, icon } from '../../account-game/features';
let finding = false, accepting = false, afterHandle: { game: string; policy: RatingPolicy } | undefined;
let request = 0, stopped = false;
const current = (reading: number) => !stopped && reading === request && client.state.screen === 'lobby';
// The list uses the runner's visible 15-second schedule, with no board position.
const listClock = { kind: 'random', status: 'playing', speed: 'live', seat: 0, turn: 0, opponent: null, last_commands: [], server_now: '' } as unknown as View;
export function lobbyScreen() {
  $('lobby-list').replaceChildren(); $('lobby-empty').hidden = true; $('lobby-status').textContent = 'Loading open games…';
  if (afterHandle && memory.me?.handle) { const { game, policy } = afterHandle; afterHandle = undefined; void acceptGame(game, policy); return; }
  const setup = { ...currentSetup(), kind: 'random' as const }, ranked = setup.mode === 'ranked', policy: RatingPolicy = ranked ? 'ranked-v1' : 'casual';
  $('find-features').replaceChildren(`${policyLabel(policy)} · `, features(setup.options), ...(ranked ? [` · ${RANKED_RULES}`] : []));
  $('find-any-row').hidden = ranked;
  $('find-any-line').textContent = ANY_RULES;
  $('find-opponent').onclick = async () => {
    if (finding || accepting) return; finding = true;
    try {
      // Reuse only your own policy and matching switches; Any rules stays within Casual.
      const options = setup.options, anyRules = !ranked && $<HTMLInputElement>('find-any-rules').checked;
      const own = [memory.view, ...memory.games].find(game => game?.kind === 'random' && game.status === 'waiting' && game.rating_policy === policy && (anyRules || !!game.options && switches(game.options) === switches(options)))?.game_id;
      if (own) { const next = await call('kingdown_resume', { game_id: own }, false, false, false); if (next) routeView(next); }
      else await start('random', { ...createArguments(setup), ...(anyRules && { any_rules: true }) });
    } finally { finding = false; }
  };
  $('lobby-key').innerHTML = featureNames.map(([, name, label]) => `${icon(name)} ${label}`).join(' · ');
  void readLobby();
}
async function readLobby() {
  if (stopped || client.state.screen !== 'lobby') return;
  const reading = ++request;
  try {
    const [list, inbox] = await Promise.all([client.call('kingdown_lobby'), client.call('kingdown_games')]);
    if (!current(reading)) return;
    if (list.isError) throw new Error(list.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    if (!inbox.isError) memory.games = inbox._meta?.games as InboxEntry[] ?? [];
    const lobby = list._meta?.lobby as Lobby & { server_now: string };
    $('lobby-online').hidden = (lobby.active_count ?? 0) < 10;
    $('lobby-online').textContent = `${lobby.active_count ?? 0} players online`;
    const games = lobby.games.filter(game => currentSetup().mode === 'ranked' ? game.rating_policy === 'ranked-v1' : game.rating_policy !== 'ranked-v1');
    $('lobby-list').replaceChildren(...games.map(game => {
      const minutes = Math.max(0, Math.floor((Date.parse(lobby.server_now) - Date.parse(game.created_at)) / 60000));
      const entry = row(game.creator.handle, portrait(game.creator.icon), [policyLabel(game.rating_policy), '·', features(game.options), minutes === 0 ? '· just opened' : `· open ${minutes} min`], 'button'); entry.classList.add('game-row');
      const accept = document.createElement('span'); accept.className = 'accept'; accept.textContent = 'Accept';
      entry.onclick = () => void acceptGame(game.game_id, game.rating_policy);
      entry.append(accept); return entry;
    }));
    $('lobby-status').textContent = ''; $('lobby-empty').hidden = !!games.length;
  } catch (error) { if (current(reading)) showError(error, $('lobby-status')); }
}
async function acceptGame(game: string, policy: RatingPolicy) {
  if (accepting || finding) return; accepting = true;
  try {
    // An accept is a selection: it goes on the queue, so a newer chat result detaches it (design §1.2).
    const outcome = await send('kingdown_accept', { game_id: game, rating_policy: policy });
    if (outcome.status === 'superseded') return;
    if (outcome.status !== 'done') {
      const code = outcome.status === 'refused' ? outcome.code : outcome.code ?? '';
      if (code === 'HANDLE_NEEDED') { afterHandle = { game, policy }; navigate('handle'); return; }
      if (['NOT_ALLOWED','FORBIDDEN'].includes(code)) { await readLobby(); $('lobby-status').textContent = 'Someone else took this game'; return; }
      throw new Error(outcome.text);
    }
    const next = outcome.view as View | undefined; if (next) routeView(next);
  } catch (error) { showError(error, $('lobby-status')); }
  finally { accepting = false; }
}
/** The lobby's target of the one poll: the list on its 15-second clock (design §4). */
export const lobbyPoll = (): PollTarget => ({ view: listClock, read: readLobby });
// A collapse keeps the lobby or name screen on the queue behind the home card, so Accept stays for its Resume.
export function lobbySync(page: Page) {
  if (page.screen !== 'lobby') ++request;
  if (![page.screen, client.state.queued].some(screen => screen === 'lobby' || screen === 'handle')) afterHandle = undefined;
}
const back = () => { if (client.state.screen === 'handle') afterHandle = undefined; };
$('page-back').addEventListener('click', back, true);
onStop(() => { stopped = true; ++request; $('page-back').removeEventListener('click', back, true); });
