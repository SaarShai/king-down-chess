import { App, type McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { setRules } from '../rules/engine';
import type { View } from '../match/protocol';
import { createClient, type WidgetHost, type Screen, type Pending } from './client';
import { art } from './art';
import { handleProblem, ICONS, type Icon } from '../account/profile';
import { boardScreen } from './screens/board';
import { setSettings } from './board-view';
import { runPoll } from './poll';
import { createRouter } from './router';
import { setupScreen } from './screens/setup';
import { friendScreen } from './screens/friend';
import { joinScreen } from './screens/join';
import { waitScreen } from './screens/wait';
import { lobbyScreen } from './screens/lobby';
import { seatScreen } from './screens/seat';
import { endScreen } from './screens/end';
import { profileScreen } from './screens/profile';
import { collectionScreen } from './screens/collection';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const extension = (window as Window & { openai?: WidgetHost }).openai;
const savedScreen = extension?.widgetState?.privateContent?.screen;
const app = new App({ name: 'King Down', version: '1.0.0' }, { availableDisplayModes: ['inline', 'fullscreen'] });
export const client = createClient(app, extension);
const state = client.state;
let hostGameId: string | undefined;
let awaitingInitialResult = true;
let connected = false, loadedGames = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined;
let busy = false, polling = false;
let poll: ReturnType<typeof runPoll> | undefined;
let pending = state.pending;
const drawBoard = boardScreen(call, () => busy || !!pending);
const router = createRouter((name, args, retain) => call(name, args, retain, false, false), navigate, show, () => !!pending);
export const { routeView, start } = router;
const screens = { setup: setupScreen, friend: friendScreen, join: joinScreen, wait: waitScreen, lobby: lobbyScreen, seat: seatScreen, end: endScreen, profile: profileScreen, collection: collectionScreen };
export const memory = { kind: 'solo' as 'solo' | 'friend' | 'random', code: '', get view() { return view; } };
function saveState() { state.pending = pending; client.save(); }
const buttons = () => document.querySelectorAll<HTMLButtonElement>('button');
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  if (pending?.args.game_id && pending.args.game_id !== next.game_id) { pending = undefined; $('retry').hidden = true; }
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (next.fen && rules?.game !== next.game_id) return;
  if (view?.game_id !== next.game_id) $('invitation').textContent = '';
  view = next;
  if (rules?.game === next.game_id) setRules(rules.value);
  drawBoard(next);
  void applySettings(); poll?.update();
  // The identifier is presentation state; every board reload still reads server authority.
  saveState();
  // Widget state also supplies model context; a second writer would replace it.
  if (!extension?.setWidgetState) void app.updateModelContext({ structuredContent: { revision: view.revision, status: view.status, your_turn: view.turn === view.seat } }).catch(() => {});
}
async function call(name: string, args: Record<string, unknown>, retain = false, quiet = false, route: boolean | undefined = undefined) {
  if (busy || (quiet && polling)) return;
  const before = view;
  let followup: Pending | undefined, received: View | undefined;
  if (quiet) polling = true;
  else { busy = true; buttons().forEach(b => b.disabled = true); $('error').textContent = ''; }
  if (retain) { pending = { name, args }; saveState(); }
  try {
    const result = await client.call(name, args);
    if (quiet && (busy || view !== before)) return;
    if (result.isError) {
      if (result._meta?.code === 'HANDLE_NEEDED') { pending = { name, args }; saveState(); navigate('handle'); return; }
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); if (retain) router.finishStart(); }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    const next = (result._meta as { view?: View } | undefined)?.view;
    if (quiet && next?.game_id === view?.game_id && next?.revision === view?.revision) return;
    show(next); received = next;
    if (name === 'kingdown_get' && next && !loadedGames) { loadedGames = true; void games(); }
    if (name === 'kingdown_handle') { followup = pending; navigate(followup ? 'play' : 'settings'); }
    const resumedStart = retain && next ? router.finishStart(next) : false;
    if (next && !resumedStart && (route ?? ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'].includes(name))) routeView(next);
    if (name === 'kingdown_invite') { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain || ['kingdown_create', 'kingdown_join', 'kingdown_resume'].includes(name)) pending = undefined;
    saveState(); $('retry').hidden = !pending;
  } catch (error) { if (quiet && (busy || view !== before)) return; $('error').textContent = error instanceof Error ? error.message : 'Could not update the game.'; $('retry').hidden = !pending; }
  finally { if (quiet) polling = false; else { busy = false; buttons().forEach(b => b.disabled = false); } }
  if (followup) void call(followup.name, followup.args, true);
  return received;
}
$('reload').onclick = () => { const gameId = view?.game_id ?? hostGameId; if (gameId) void call('kingdown_get', { game_id: gameId }); };
$('retry').onclick = () => { if (pending) void call(pending.name, pending.args, true); };
$('computer').onclick = () => { if (view) void call('kingdown_computer', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision }, true); };
$('invite').onclick = () => { if (view) void call('kingdown_invite', { game_id: view.game_id }); };
$('solo').onclick = () => { memory.kind = 'solo'; navigate('setup'); };
$('friend').onclick = () => { memory.kind = 'friend'; navigate('setup'); };
$('random').onclick = () => { memory.kind = 'random'; navigate('lobby'); };
$('resume').onclick = () => void call('kingdown_resume', {});
$('join-form').onsubmit = event => { event.preventDefault(); memory.code = $<HTMLInputElement>('token').value.trim(); navigate('join'); };
app.ontoolresult = result => {
  const value = result.structuredContent;
  if (!value || typeof value !== 'object') return;
  const initial = awaitingInitialResult;
  if (!initial || !state.board_id) state.board_id = 'board_id' in value && typeof value.board_id === 'string' ? value.board_id : undefined;
  awaitingInitialResult = false;
  if ('screen' in value && ['home', 'play', 'board', 'profile'].includes(String(value.screen)) && (!initial || !savedScreen)) navigate(value.screen as Screen);
  if (!('game_id' in value) && state.board_id && connected) void call('kingdown_get', {}, false, false, !savedScreen);
  if ('game_id' in value && typeof value.game_id === 'string') {
    hostGameId = value.game_id;
    if (!initial && !('screen' in value)) navigate('board');
    if (connected) void call('kingdown_get', { game_id: hostGameId }, false, false, !initial && !('screen' in value));
  }
};
app.onclose = () => { connected = false; poll?.stop(); router.finishStart(); };
app.onteardown = async () => { connected = false; poll?.stop(); router.finishStart(); saveState(); return {}; };
const connection = app.connect().then(() => {
  connected = true; $<HTMLButtonElement>('home-play').disabled = false; $<HTMLButtonElement>('home-games').disabled = false;
  const context = app.getHostContext(); hostContext(context);
  if (context?.displayMode === 'fullscreen' && state.screen === 'home' && !savedScreen) navigate('play');
  if (state.screen !== 'home') void fullscreen(state.screen);
  poll = runPoll(() => ['friend', 'wait', 'seat', 'board'].includes(state.screen) ? view : undefined, async () => {
    const game_id = view?.game_id ?? hostGameId;
    if (connected && !awaitingInitialResult && (game_id || state.board_id) && !busy && !pending) await call('kingdown_get', { ...(game_id ? { game_id } : {}), ...(view?.fen ? { since_revision: view.revision } : {}) }, false, true, !savedScreen || !!view && ['friend', 'wait', 'seat', 'board'].includes(state.screen));
  });
}).catch(error => { $('error').textContent = $('home-error').textContent = `Could not connect to the game: ${String(error)}`; });

export function navigate(screen: Screen) {
  state.screen = screen;
  document.body.dataset.page = screen;
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach(el => { el.hidden = el.dataset.screen !== screen; });
  $('app-frame').hidden = screen === 'home';
  $('page-head').hidden = screen === 'home' || screen === 'play';
  $('page-back').textContent = screen === 'handle' && !pending ? '‹ Settings' : screen === 'collection' ? '‹ Profile' : '‹ Play';
  $('page-title').textContent = ({ setup: 'New game', friend: 'A friend', join: 'Join a game', wait: 'Looking for an opponent', lobby: 'Open games', seat: 'Set up your side', end: 'Game over', profile: 'Profile', collection: 'Collection', settings: 'Settings', handle: 'Pick a name and a picture' } as Partial<Record<Screen,string>>)[screen] ?? '';
  if (screen in screens) screens[screen as keyof typeof screens]();
  client.save(); poll?.update();
  if (screen === 'settings') void applySettings();
}
async function fullscreen(screen: Screen) {
  const before = state.screen;
  try {
    await connection;
    const result = await app.requestDisplayMode({ mode: 'fullscreen' });
    if (result.mode !== 'fullscreen') throw new Error('Open the app with the host’s expand control.');
    if (state.screen === before) navigate(screen);
  } catch (error) { $('error').textContent = $('home-error').textContent = String(error); }
}
function hostContext(context: McpUiHostContext | undefined) {
  if (!context) return;
  document.body.dataset.theme = context.theme ?? 'light';
  document.body.dataset.touch = String(context.deviceCapabilities?.touch ?? false);
  for (const edge of ['top', 'right', 'bottom', 'left'] as const) document.documentElement.style.setProperty(`--safe-${edge}`, `${context.safeAreaInsets?.[edge] ?? 0}px`);
}
async function games() {
  $('games-status').textContent = 'Loading games…';
  try {
    const result = await client.call('kingdown_games');
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    const entries = (result.structuredContent as { games?: { game_id: string; your_turn?: boolean }[] } | undefined)?.games ?? [];
    $('games-status').textContent = entries.length ? `${entries.length} active games.` : 'No active games.';
    $('games-list').replaceChildren(...entries.map(entry => { const button = document.createElement('button'); button.className = 'menu-row'; button.dataset.gameId = entry.game_id; button.textContent = entry.your_turn ? 'Your turn' : 'Waiting'; button.onclick = () => void call('kingdown_open', { screen: 'board', game_id: entry.game_id }); return button; }));
  } catch (error) { $('games-status').textContent = String(error); }
}
let picture: Icon = 'spirit';
document.querySelectorAll<HTMLImageElement>('[data-art]').forEach(img => { img.src = art(img.dataset.art!); });
$('presets').replaceChildren(...Object.entries(ICONS).map(([key, path]) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'preset'; button.setAttribute('aria-label', key); button.setAttribute('aria-pressed', String(key === picture));
  const portrait = document.createElement('span'); portrait.className = 'portrait'; const image = document.createElement('img'); image.src = art(path); image.alt = ''; portrait.append(image); button.append(portrait);
  button.onclick = () => { picture = key as Icon; $('presets').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); }; return button;
}));
$('handle-form').onsubmit = event => { event.preventDefault(); const input = $<HTMLInputElement>('handle'), handle = input.value.trim().toLowerCase(); input.setCustomValidity(handleProblem(handle) ?? ''); if (input.reportValidity()) void call('kingdown_handle', { handle, icon: picture }); };
$<HTMLInputElement>('handle').oninput = () => $<HTMLInputElement>('handle').setCustomValidity('');
$('home-play').onclick = () => void fullscreen('play');
$('home-games').onclick = () => void fullscreen('profile');
document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(button => { button.onclick = () => navigate(button.dataset.nav as Screen); });
$('page-back').onclick = () => navigate(state.screen === 'handle' && !pending ? 'settings' : state.screen === 'collection' ? 'profile' : 'play');
app.onhostcontextchanged = () => hostContext(app.getHostContext());
navigate(state.screen);

async function applySettings() {
  $<HTMLInputElement>('symbols-only').checked = client.settings.symbols_only;
  $<HTMLInputElement>('show-threats').checked = client.settings.show_threats;
  await setSettings(client.settings);
}
for (const [id, key] of [['symbols-only', 'symbols_only'], ['show-threats', 'show_threats']] as const) {
  $<HTMLInputElement>(id).onchange = async () => { await client.call('kingdown_settings', { [key]: $<HTMLInputElement>(id).checked }); await applySettings(); };
}
