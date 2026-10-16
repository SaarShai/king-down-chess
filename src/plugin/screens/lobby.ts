import { call, client, memory, navigate, routeView, start } from '../app';
import { DEFAULT_OPTIONS } from '../../match/setup';
import type { InboxEntry, Lobby, View } from '../../match/protocol';
import { runPoll } from '../poll';
import { ANY_RULES } from './setup';
import { $, featureNames, features, icon, onStop, portrait, row, showError } from './friend';
let poll: ReturnType<typeof runPoll> | undefined, finding = false, accepting = false, afterHandle: string | undefined;
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
      const own = memory.view?.kind === 'random' && memory.view.status === 'waiting' ? memory.view.game_id : memory.games.find(game => game.kind === 'random' && game.status === 'waiting')?.game_id;
      if (own) { const next = await call('kingdown_resume', { game_id: own }, false, false, false); if (next) routeView(next); }
      else await start('random', { options: setup?.options ?? DEFAULT_OPTIONS, colour: setup?.colour ?? 'white', ...($<HTMLInputElement>('find-any-rules').checked && { any_rules: true }) });
    } finally { finding = false; }
  };
  $('lobby-key').innerHTML = featureNames.map(([, name, label]) => `${icon(name)} ${label}`).join(' · ');
  if (!poll) poll = runPoll(() => client.state.screen === 'lobby' ? listClock : undefined, readLobby);
  else void readLobby();
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
    $('lobby-status').textContent = '';
  } catch (error) { if (client.state.screen === 'lobby') showError(error, $('lobby-status')); }
}
async function acceptGame(game: string) {
  if (accepting || finding) return; accepting = true;
  try {
    const result = await client.call('kingdown_accept', { game_id: game });
    if (result.isError) {
      if (result._meta?.code === 'HANDLE_NEEDED') { afterHandle = game; navigate('handle'); return; }
      if (['NOT_ALLOWED','FORBIDDEN'].includes(String(result._meta?.code))) { await readLobby(); $('lobby-status').textContent = 'Someone else took this game'; return; }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    const next = result._meta?.view as View | undefined; if (next) routeView(next);
  } catch (error) { showError(error, $('lobby-status')); }
  finally { accepting = false; }
}
function stop() { poll?.stop(); poll = undefined; }
const observer = new MutationObserver(() => { if (client.state.screen !== 'lobby') stop(); if (!['lobby','handle'].includes(client.state.screen)) afterHandle = undefined; });
observer.observe(document.body, { attributes: true, attributeFilter: ['data-page'] });
const back = () => { if (client.state.screen === 'handle') afterHandle = undefined; };
$('page-back').addEventListener('click', back, true);
onStop(() => { stop(); observer.disconnect(); $('page-back').removeEventListener('click', back, true); });
