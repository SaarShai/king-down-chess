import { App, type McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { PlayerSettings } from './settings';
import { setRules } from '../rules/engine';
import { gamesList } from './games-list';
import type { InboxEntry, JoinPreview, View } from '../match/protocol';
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
let awaitingInitialResult = true;
let connected = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined;
let busy = false, polling = false, mountReading = true;
let poll: ReturnType<typeof runPoll> | undefined;
let pending = state.pending;
let handleBack: Screen = pending?.screen ?? 'settings';
const drawBoard = boardScreen(call, () => busy || mountReading || !!pending);
const router = createRouter((name, args, retain) => call(name, args, retain, false, false), navigate, show, () => !!pending);
export const { routeView, start } = router;
const screens = { setup: setupScreen, friend: friendScreen, join: joinScreen, wait: waitScreen, lobby: lobbyScreen, seat: seatScreen, end: endScreen, profile: profileScreen, collection: collectionScreen };
export const memory = { kind: 'solo' as 'solo' | 'friend' | 'random', code: '', settings: undefined as PlayerSettings | undefined, me: undefined as { handle: string | null; icon: Icon | null } | undefined, games: [] as InboxEntry[], preview: undefined as JoinPreview | undefined, joinError: undefined as { code: string; message: string } | undefined, get view() { return view; } };
function saveState() { state.pending = pending; client.save(); }
function retryState() {
  const message = pending?.error_screen === state.screen ? pending.error : undefined;
  $('retry').hidden = !message;
  $('error').textContent = message ?? '';
}
const buttons = () => document.querySelectorAll<HTMLButtonElement>('button');
function actions() {
  const blocked = busy || mountReading || !connected;
  buttons().forEach(button => { button.disabled = blocked; });
  $<HTMLButtonElement>('home-play').disabled = $<HTMLButtonElement>('home-games').disabled = blocked || !memory.settings;
  $<HTMLInputElement>('symbols-only').disabled = $<HTMLInputElement>('show-threats').disabled = blocked || !memory.settings;
}
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  if (pending?.game_tag && !['kingdown_create', 'kingdown_find'].includes(pending.name) && !next.game_id.startsWith(pending.game_tag)) { pending = undefined; $('retry').hidden = true; }
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
async function resendPending(command: Pending, mountRead?: ToolResult) {
  const read = mountRead ?? await client.call('kingdown_get');
  if (read.isError) throw new Error(read.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
  const completed = read._meta?.view as View | undefined;
  if (['kingdown_create', 'kingdown_find'].includes(command.name) && command.started_at !== undefined && completed && (!command.game_tag || !completed.game_id.startsWith(command.game_tag)) && (command.name === 'kingdown_find' || Date.parse(completed.created_at) >= command.started_at)) return read;
  if (!mountRead) {
    if (command.game_tag && !['kingdown_create', 'kingdown_find'].includes(command.name)) {
      if (!completed?.game_id.startsWith(command.game_tag)) { pending = undefined; if (completed) routeView(completed); return read; }
      command.args.game_id = completed.game_id;
    }
    return client.call(command.name, command.args);
  }
}
export async function call(name: string, args: Record<string, unknown>, retain = false, quiet = false, route: boolean | undefined = undefined, retry = false) {
  if (busy || (quiet && polling)) return;
  const before = view;
  let followup: Pending | undefined, received: View | undefined;
  if (quiet) polling = true;
  else { busy = true; actions(); $('error').textContent = ''; }
  if (retain) {
    if (pending?.name !== name || pending.args !== args) pending = { name, args, game_tag: typeof args.game_id === 'string' ? args.game_id.slice(0, 8) : view?.game_id.slice(0, 8), started_at: Date.now(), screen: state.screen };
    pending.error = undefined; pending.error_screen = undefined; saveState();
  }
  try {
    let result: ToolResult | undefined;
    if (retry && pending) result = await resendPending(pending);
    result ??= await client.call(name, args);
    if (mountReading && name === 'kingdown_get' && pending && ['kingdown_create', 'kingdown_find'].includes(pending.name)) {
      const recovered = await resendPending(pending, result);
      if (recovered) { name = pending.name; retain = true; route = undefined; result = recovered; }
    }
    if (quiet && (busy || view !== before)) return;
    const read = (result._meta as { view?: View } | undefined)?.view;
    if (name === 'kingdown_get' && read?.fen && !read.rules && rules?.game !== read.game_id) {
      result = await client.call('kingdown_get');
      if (quiet && (busy || view !== before)) return;
    }
    if (result.isError) {
      if (result._meta?.code === 'HANDLE_NEEDED') { pending ??= { name, args, game_tag: typeof args.game_id === 'string' ? args.game_id.slice(0, 8) : view?.game_id.slice(0, 8), started_at: Date.now(), screen: state.screen }; pending.error = undefined; pending.error_screen = undefined; saveState(); navigate('handle'); return; }
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); if (retain) router.finishStart(); }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    remember(result);
    const next = (result._meta as { view?: View } | undefined)?.view;
    if (quiet && next && next.game_id === view?.game_id && next.revision === view?.revision) {
      view = { ...view, opponent: next.opponent, server_now: next.server_now }; poll?.update(); return;
    }
    show(next); received = next;
    if (name === 'kingdown_get' && !quiet) await games();
    if (name === 'kingdown_handle') { followup = pending; navigate(followup?.screen ?? handleBack); }
    const resumedStart = retain && next ? router.finishStart(next) : false;
    if (next && !resumedStart && (route ?? ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'].includes(name))) routeView(next);
    if (name === 'kingdown_invite') { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain) pending = undefined;
    saveState(); retryState();
  } catch (error) { if (quiet && (busy || view !== before)) return; const message = error instanceof Error ? error.message : 'Could not update the game.';
    if (retain && pending) { pending.error = message; pending.error_screen = state.screen; saveState(); }
    $('error').textContent = message; $('retry').hidden = !pending?.error || pending.error_screen !== state.screen; }
  finally { if (quiet) polling = false; else { busy = false; actions(); } }
  if (followup) void call(followup.name, followup.args, true, false, undefined, true);
  return received;
}
$('reload').onclick = () => { if (state.board_id) void call('kingdown_get', {}); };
$('retry').onclick = () => { if (pending) void call(pending.name, pending.args, true, false, undefined, true); };
$('computer').onclick = () => { if (view) void call('kingdown_computer', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision }, true); };
$('invite').onclick = () => { if (view) void call('kingdown_invite', { game_id: view.game_id }); };
$('solo').onclick = () => { memory.kind = 'solo'; navigate('setup'); };
$('friend').onclick = () => { memory.kind = 'friend'; navigate('setup'); };
$('random').onclick = () => { memory.kind = 'random'; navigate('lobby'); };
$('join-form').onsubmit = event => { event.preventDefault(); memory.code = $<HTMLInputElement>('token').value.trim(); navigate('join'); };
type ToolResult = Awaited<ReturnType<typeof client.call>>;
function renderGames(entries: InboxEntry[]) {
  memory.games = entries;
  $('games-status').textContent = entries.length ? '' : 'No active games.';
  $('home-line').textContent = `Your move in ${entries.filter(entry => entry.action === 'ready').length} games.`;
  gamesList($('games-list'), entries, (name, args) => call(name, args, false, false, false), routeView); actions();
}
function remember(result: ToolResult) {
  if (result._meta?.settings) memory.settings = result._meta.settings as PlayerSettings;
  if (result._meta?.me) {
    const me = result._meta.me as NonNullable<typeof memory.me>, before = memory.me; memory.me = me;
    if (me.handle !== before?.handle || me.icon !== before?.icon) renderIdentity();
  }
  if (Array.isArray(result._meta?.games)) renderGames(result._meta.games as InboxEntry[]);
  const value = result.structuredContent as Record<string, unknown> | undefined;
  if (value && typeof value.your_turn_count === 'number') $('home-line').textContent = `Your move in ${value.your_turn_count} games.`;
}
app.ontoolresult = result => {
  const initial = awaitingInitialResult; awaitingInitialResult = false;
  void mountResult(result, initial);
};
async function mountResult(result: ToolResult, initial: boolean) {
  mountReading = true; actions();
  try {
    await connection;
    const value = result.structuredContent as Record<string, unknown> | undefined;
    if (!initial || !state.board_id) state.board_id = typeof value?.board_id === 'string' ? value.board_id : typeof value?.game_id === 'string' ? state.board_id : undefined;
    remember(result);
    if (initial) {
      const settings = await client.call('kingdown_settings');
      if (settings.isError) throw new Error(settings.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(settings); await applySettings();
    }
    if (result.isError) {
      memory.preview = undefined;
      memory.joinError = { code: String(result._meta?.code ?? ''), message: result.content.filter(c => c.type === 'text').map(c => c.text).join(' ') };
      view = undefined; navigate('join');
      const home = await client.call('kingdown_open');
      if (home.isError) throw new Error(home.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(home); saveState(); return;
    }
    if (value?.screen === 'join') { memory.preview = result._meta?.preview as JoinPreview | undefined; memory.code = memory.preview?.code ?? ''; memory.joinError = undefined; }
    if (value && ['home', 'play', 'board', 'profile', 'join'].includes(String(value.screen)) && (!initial || !savedScreen)) navigate(value.screen as Screen);
    if (typeof value?.game_id === 'string' && !value.board_id && (!initial || !state.board_id)) {
      const selected = await client.call(state.board_id ? 'kingdown_resume' : 'kingdown_open', { game_id: value.game_id });
      if (selected.isError) throw new Error(selected.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(selected);
    }
    const route = value?.screen === undefined && (!initial || !savedScreen);
    const readBoard = state.board_id && (typeof value?.game_id === 'string' || initial && savedScreen);
    if (readBoard) await call('kingdown_get', {}, false, false, route);
    else if (!result._meta?.view) view = undefined;
    if (!readBoard) await games();
    saveState();
  } catch (error) { $('error').textContent = $('home-error').textContent = String(error); }
  finally {
    mountReading = false; if (pending?.error) retryState();
    if (state.screen in screens) screens[state.screen as keyof typeof screens]();
    poll?.update();
    actions();
  }
}
app.onclose = () => { connected = false; poll?.stop(); router.finishStart(); };
app.onteardown = async () => { connected = false; poll?.stop(); router.finishStart(); saveState(); return {}; };
const connection = app.connect().then(() => {
  connected = true;
  const context = app.getHostContext(); hostContext(context);
  if (context?.displayMode === 'fullscreen' && state.screen === 'home' && !savedScreen) navigate('play');
  if (state.screen !== 'home') void fullscreen(state.screen);
  poll = runPoll(() => ['friend', 'wait', 'seat', 'board'].includes(state.screen) ? view : undefined, async () => {
    if (connected && !awaitingInitialResult && !mountReading && state.board_id && !busy && !pending) await call('kingdown_get', { ...(view?.fen ? { since_revision: view.revision } : {}) }, false, true, !savedScreen || !!view && ['friend', 'wait', 'seat', 'board'].includes(state.screen));
  });
}).catch(error => { $('error').textContent = $('home-error').textContent = `Could not connect to the game: ${String(error)}`; });

export function navigate(screen: Screen) {
  if (screen === 'handle' && state.screen !== 'handle') handleBack = state.screen === 'settings' ? 'settings' : pending?.screen ?? state.screen;
  state.screen = screen; retryState();
  document.body.dataset.page = screen;
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach(el => { el.hidden = el.dataset.screen !== screen; });
  $('app-frame').hidden = screen === 'home';
  $('page-head').hidden = screen === 'home' || screen === 'play';
  $('page-back').textContent = screen === 'handle' && handleBack === 'settings' ? '‹ Settings' : screen === 'collection' ? '‹ Profile' : '‹ Play';
  $('page-title').textContent = ({ setup: 'New game', friend: 'A friend', join: 'Join a game', wait: 'Looking for an opponent', lobby: 'Open games', seat: 'Set up your side', end: 'Game over', profile: 'Profile', collection: 'Collection', settings: 'Settings', handle: 'Pick a name and a picture' } as Partial<Record<Screen,string>>)[screen] ?? '';
  if (!mountReading && screen in screens) screens[screen as keyof typeof screens]();
  client.save(); actions(); poll?.update();
  if (screen === 'settings') void applySettings();
  if (screen === 'handle') scheduleHandleCheck(); else { clearTimeout(handleTimer); handleCheck++; }
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
    const entries = (result._meta as { games?: InboxEntry[] } | undefined)?.games ?? [];
    renderGames(entries);
  } catch (error) { $('games-status').textContent = String(error); }
}
let picture: Icon = 'spirit';
document.querySelectorAll<HTMLImageElement>('[data-art]').forEach(img => { img.src = art(img.dataset.art!); });
$('presets').replaceChildren(...Object.entries(ICONS).map(([key, path]) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'preset'; button.setAttribute('aria-label', key); button.setAttribute('aria-pressed', String(key === picture));
  const portrait = document.createElement('span'); portrait.className = 'portrait'; const image = document.createElement('img'); image.src = art(path); image.alt = ''; portrait.append(image); button.append(portrait);
  button.onclick = () => { picture = key as Icon; $('presets').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); }; return button;
}));
let handleCheck = 0, handleTimer: ReturnType<typeof setTimeout> | undefined;
function renderIdentity() {
  if (!memory.me) return;
  $('me-handle').textContent = memory.me.handle ?? 'Choose a name';
  $<HTMLImageElement>('me-picture').src = art(ICONS[memory.me.icon ?? 'spirit']);
  $<HTMLInputElement>('handle').value = memory.me.handle ?? ''; picture = memory.me.icon ?? 'spirit';
  $('presets').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute('aria-label') === picture)));
  if (state.screen === 'handle') scheduleHandleCheck();
}
function scheduleHandleCheck() {
  clearTimeout(handleTimer); const check = ++handleCheck, input = $<HTMLInputElement>('handle'), handle = input.value.trim().toLowerCase();
  input.setCustomValidity(''); $('handle-free').hidden = true; $('handle-check-error').textContent = '';
  if (!handle) return;
  handleTimer = setTimeout(async () => {
    try {
      const result = await client.call('kingdown_handle', { handle, check: true });
      if (check !== handleCheck) return;
      if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      $('handle-free').hidden = (result.structuredContent as { available?: boolean } | undefined)?.available !== true;
    } catch (error) { if (check === handleCheck) $('handle-check-error').textContent = String(error); }
  }, 250);
}
$('handle-form').onsubmit = event => {
  event.preventDefault(); clearTimeout(handleTimer); handleCheck++;
  const input = $<HTMLInputElement>('handle'), handle = input.value.trim().toLowerCase(); input.setCustomValidity(handleProblem(handle) ?? '');
  if (input.reportValidity()) void call('kingdown_handle', { handle, icon: picture });
};
$<HTMLInputElement>('handle').oninput = scheduleHandleCheck;
$('home-play').onclick = () => void fullscreen('play');
$('home-games').onclick = () => void fullscreen('profile');
document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(button => { button.onclick = () => navigate(button.dataset.nav as Screen); });
$('page-back').onclick = () => navigate(state.screen === 'handle' ? handleBack : state.screen === 'collection' ? 'profile' : 'play');
app.onhostcontextchanged = () => hostContext(app.getHostContext());
navigate(state.screen);

async function applySettings() {
  if (!memory.settings) return;
  actions();
  $<HTMLInputElement>('symbols-only').checked = memory.settings.symbols_only;
  $<HTMLInputElement>('show-threats').checked = memory.settings.show_threats;
  await setSettings(memory.settings);
}
for (const [id, key] of [['symbols-only', 'symbols_only'], ['show-threats', 'show_threats']] as const) {
  $<HTMLInputElement>(id).onchange = async () => {
    $<HTMLInputElement>('symbols-only').disabled = $<HTMLInputElement>('show-threats').disabled = true;
    try {
      const result = await client.call('kingdown_settings', { [key]: $<HTMLInputElement>(id).checked });
      if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(result);
    } catch (error) { $('error').textContent = String(error); }
    await applySettings();
  };
}
