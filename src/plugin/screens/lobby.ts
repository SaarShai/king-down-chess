import { call, client, memory, navigate, routeView, send, start } from '../app';
import { DEFAULT_OPTIONS, switches } from '../../match/setup';
import type { InboxEntry, Lobby, View } from '../../match/protocol';
import type { PollTarget } from '../poll';
import type { Page } from '../state';
import { ANY_RULES } from './setup';
import { $, featureNames, features, icon, onStop, portrait, row, showError } from './friend';
let finding = false, accepting = false, afterHandle: string | undefined;
// The list uses the runner's visible 15-second schedule, with no board position.
const listClock = { kind: 'random', status: 'playing', speed: 'live', seat: 0, turn: 0, opponent: null, last_commands: [], server_now: '' } as unknown as View;
export function lobbyScreen() {
  if (afterHandle && memory.me?.handle) { const game = afterHandle; afterHandle = undefined; void acceptGame(game); return; }
  const setup = memory.settings?.last_setup;
  $('find-features').replaceChildren(features(setup?.options ?? DEFAULT_OPTIONS));
  $('find-any-line').textContent = ANY_RULES;
  $('find-opponent').onclick = async () => {
    if (finding || accepting) return; finding = true;
    try {
      // Your own open game comes back with no new Find only when Find would take it: the same five switches, or Any rules (D1 a).
      const options = setup?.options ?? DEFAULT_OPTIONS, anyRules = $<HTMLInputElement>('find-any-rules').checked;
      const own = [memory.view, ...memory.games].find(game => game?.kind === 'random' && game.status === 'waiting' && (anyRules || !!game.options && switches(game.options) === switches(options)))?.game_id;
      if (own) { const next = await call('kingdown_resume', { game_id: own }, false, false, false); if (next) routeView(next); }
      else await start('random', { options, colour: setup?.colour ?? 'white', ...(anyRules && { any_rules: true }) });
    } finally { finding = false; }
  };
  $('lobby-key').innerHTML = featureNames.map(([, name, label]) => `${icon(name)} ${label}`).join(' · ');
  void readLobby();
}
async function readLobby() {
  try {
    const [list, inbox] = await Promise.all([client.call('kingdown_lobby'), client.call('kingdown_games')]);
    if (client.state.screen !== 'lobby') return;
    if (list.isError) throw new Error(list.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    if (!inbox.isError) memory.games = inbox._meta?.games as InboxEntry[] ?? [];
    const lobby = list._meta?.lobby as Lobby & { server_now: string };
    $('lobby-online').hidden = (lobby.active_count ?? 0) < 10;
    $('lobby-online').textContent = `${lobby.active_count ?? 0} players online`;
    $('lobby-list').replaceChildren(...lobby.games.map(game => {
      const minutes = Math.max(0, Math.floor((Date.parse(lobby.server_now) - Date.parse(game.created_at)) / 60000));
      const entry = row(game.creator.handle, portrait(game.creator.icon), [features(game.options), minutes === 0 ? '· just opened' : `· open ${minutes} min`], 'button'); entry.classList.add('game-row');
      const accept = document.createElement('span'); accept.className = 'accept'; accept.textContent = 'Accept';
      entry.onclick = () => void acceptGame(game.game_id);
      entry.append(accept); return entry;
    }));
    $('lobby-status').textContent = ''; $('lobby-empty').hidden = !!lobby.games.length;
  } catch (error) { if (client.state.screen === 'lobby') showError(error, $('lobby-status')); }
}
async function acceptGame(game: string) {
  if (accepting || finding) return; accepting = true;
  try {
    // An accept is a selection: it goes on the queue, so a newer chat result detaches it (design §1.2).
    const outcome = await send('kingdown_accept', { game_id: game });
    if (outcome.status === 'superseded') return;
    if (outcome.status !== 'done') {
      const code = outcome.status === 'refused' ? outcome.code : outcome.code ?? '';
      if (code === 'HANDLE_NEEDED') { afterHandle = game; navigate('handle'); return; }
      if (['NOT_ALLOWED','FORBIDDEN'].includes(code)) { await readLobby(); $('lobby-status').textContent = 'Someone else took this game'; return; }
      throw new Error(outcome.text);
    }
    const next = outcome.view as View | undefined; if (next) routeView(next);
  } catch (error) { showError(error, $('lobby-status')); }
  finally { accepting = false; }
}
/** The lobby's target of the one poll: the list on its 15-second clock (design §4). */
export const lobbyPoll = (): PollTarget => ({ view: listClock, read: readLobby });
export function lobbySync(page: Page) { if (!['lobby','handle'].includes(page.screen)) afterHandle = undefined; }
const back = () => { if (client.state.screen === 'handle') afterHandle = undefined; };
$('page-back').addEventListener('click', back, true);
onStop(() => { $('page-back').removeEventListener('click', back, true); });
