import { App, type McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { PlayerSettings } from './settings';
import { setRules } from '../rules/engine';
import { gameTitle, gamesList, nextGame } from './games-list';
import type { InboxEntry, JoinPreview, View } from '../match/protocol';
import { CANNOT_CONNECT, createClient, errorText, type WidgetHost, type Screen, type Pending } from './client';
import { art } from './art';
import { handleProblem, ICONS, type Icon } from '../account/profile';
import { boardScreen, rollbackBoardMove } from './screens/board';
import { setSettings } from './board-view';
import { setSound, snd } from '../render/sfx';
import { runPoll } from './poll';
import { createRouter } from './router';
import { playNow, setupBusy, setupScreen } from './screens/setup';
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
const queuedAtStart = state.queued;
let awaitingInitialResult = true;
let connected = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined;
let readError = false;
let busy = false, polling = false, mountReading = true, gamesDirty = false;
// Ends when the command in flight (busy) ends; call skips a read while busy.
let commandDone = Promise.resolve(), endCommand = () => {};
let poll: ReturnType<typeof runPoll> | undefined, seenAt = 0, pollFailures = 0;
let pending = state.pending;
let handleBack: Screen = pending?.screen ?? 'settings';
const drawBoard = boardScreen(call, () => busy || mountReading || !!pending);
const router = createRouter((name, args, retain) => call(name, args, retain, false, false), navigate, show, () => !!pending);
export const { routeView, start } = router;
const screens = { play: setupScreen, friend: friendScreen, join: joinScreen, wait: waitScreen, lobby: lobbyScreen, seat: seatScreen, end: endScreen, profile: profileScreen, collection: collectionScreen };
export const memory = { kind: 'solo' as 'solo' | 'friend' | 'random', code: '', settings: undefined as PlayerSettings | undefined, me: undefined as { handle: string | null; icon: Icon | null } | undefined, games: [] as InboxEntry[], preview: undefined as JoinPreview | undefined, joinError: undefined as { code: string; message: string } | undefined, get view() { return view; } };
function saveState() { state.pending = pending; client.save(); }
/** A command's error stays on the screen where the command started, so its Retry shows there, also after the player leaves. */
function failPending(message: string) {
  pending!.error = message; pending!.error_screen = pending!.screen ?? state.screen; saveState();
  if (state.screen === 'home' && pending!.screen === 'play' && ['kingdown_create', 'kingdown_find'].includes(pending!.name)) navigate('play');
}
// A pending command locks Start, the board, the seat and the poll, so these screens also show its error and Retry.
const LOCKED: Screen[] = ['play', 'seat', 'board', 'wait', 'friend', 'end'];
function retryState() {
  const message = pending?.error_screen === state.screen || LOCKED.includes(state.screen) ? pending?.error : undefined;
  $('retry').hidden = !message && !readError;
  $('retry').textContent = readError && !pending ? 'Try again' : 'Retry';
  $('error').textContent = message ?? '';
}
const turnLine = (count: number) => count === 0 ? 'No games need your move.' : `Your move in ${count} game${count === 1 ? '' : 's'}.`;
const buttons = () => document.querySelectorAll<HTMLButtonElement>('button');
function actions() {
  const blocked = busy || mountReading || !connected;
  // A slow start marks ‹ Play data-free (setup.ts): it stays a way out while later calls run.
  buttons().forEach(button => { button.disabled = (blocked && !button.hasAttribute('data-free')) || button.matches('#king-picker [aria-disabled="true"]'); });
  $<HTMLButtonElement>('home-play').disabled = $<HTMLButtonElement>('home-games').disabled = blocked || !memory.settings;
  $<HTMLButtonElement>('setup-start').disabled ||= setupBusy();
  homeActions();
  $<HTMLInputElement>('symbols-only').disabled = $<HTMLInputElement>('show-threats').disabled = blocked || !memory.settings;
}
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  if (pending?.game_tag && !['kingdown_create', 'kingdown_find'].includes(pending.name) && !next.game_id.startsWith(pending.game_tag)) { pending = undefined; $('retry').hidden = true; }
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (next.fen && rules?.game !== next.game_id) return;
  if (view?.game_id !== next.game_id || view.revision !== next.revision || view.status !== next.status || view.action !== next.action) gamesDirty = true;
  if (view?.game_id !== next.game_id) $('invitation').textContent = '';
  view = next;
  if (rules?.game === next.game_id) setRules(rules.value);
  drawBoard(next);
  void applySettings(); poll?.update();
  // The identifier is presentation state; every board reload still reads server authority.
  saveState();
  // Widget state also supplies model context; a second writer would replace it.
  if (!extension?.setWidgetState) void app.updateModelContext({ structuredContent: { status: view.status, your_turn: view.turn === view.seat } }).catch(() => {});
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
  const commandScreen = state.screen === 'home' && ['kingdown_create', 'kingdown_find'].includes(name) ? 'play' : state.screen;
  let followup: Pending | undefined, received: View | undefined;
  if (quiet) polling = true;
  else { busy = true; commandDone = new Promise(resolve => { endCommand = resolve; }); actions(); $('error').textContent = ''; }
  if (retain) {
    if (pending?.name !== name || pending.args !== args) pending = { name, args, game_tag: typeof args.game_id === 'string' ? args.game_id.slice(0, 8) : view?.game_id.slice(0, 8), started_at: Date.now(), screen: commandScreen };
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
      const text = result.content.filter(c => c.type === 'text').map(c => c.text).join(' ');
      // The command waits for a name. Save sends it again; Back shows the server's reason and Retry on the start screen.
      if (result._meta?.code === 'HANDLE_NEEDED') { pending ??= { name, args, game_tag: typeof args.game_id === 'string' ? args.game_id.slice(0, 8) : view?.game_id.slice(0, 8), started_at: Date.now(), screen: commandScreen }; failPending(text); navigate('handle'); return; }
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'NOT_ALLOWED', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); if (retain) router.finishStart(); }
      throw new Error(text);
    }
    remember(result);
    // A good read ends an outage (three failed polls or a failed read): its sentence and Try again go together.
    const outage = pollFailures >= 3 || name === 'kingdown_get' && readError; pollFailures = 0;
    if (name === 'kingdown_get') readError = false;
    const next = (result._meta as { view?: View } | undefined)?.view;
    if (quiet && next && next.game_id === view?.game_id && next.revision === view?.revision) {
      view = { ...view, opponent: next.opponent, server_now: next.server_now }; if (state.screen === 'seat') seatScreen(); poll?.update(); if (outage) retryState(); return;
    }
    show(next); received = next;
    if (name === 'kingdown_get' && !quiet) await games();
    // Save sends the waiting command again at once, so its old error and Retry go now.
    if (name === 'kingdown_handle') { followup = pending; if (followup) followup.error = followup.error_screen = undefined; navigate(followup?.screen ?? handleBack); }
    const resumedStart = retain && next ? router.finishStart(next) : false;
    if (next && !resumedStart && (route ?? ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'].includes(name))) routeView(next);
    if (name === 'kingdown_invite') { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain) pending = undefined;
    saveState(); retryState();
  } catch (error) { const message = error instanceof Error ? error.message : 'Could not update the game.';
    if (quiet && (busy || view !== before)) return;
    // One slow poll is no outage, so a quiet read that cannot connect says nothing. A run of three shows the sentence
    // with no Retry: the next poll tries again, and a good read clears it.
    if (quiet && message === CANNOT_CONNECT) { if (++pollFailures >= 3) $('error').textContent = message; return; }
    if (retain && pending) failPending(message);
    if (!quiet && name === 'kingdown_get' && state.board_id) readError = true;
    retryState(); if (!retain || !pending) $('error').textContent = message; }
  finally { if (quiet) polling = false; else { busy = false; endCommand(); actions(); } }
  if (retain && name === 'kingdown_move' && !received && !pending && before?.game_id === view?.game_id) await rollbackBoardMove();
  if (followup) void call(followup.name, followup.args, true, false, undefined, true);
  return received;
}
$('reload').onclick = () => { if (state.board_id) void call('kingdown_get', {}); };
$('retry').onclick = () => { if (pending) void call(pending.name, pending.args, true, false, undefined, true); else if (readError) void call('kingdown_get', {}, false, false, true); };
$('computer').onclick = () => { if (view) void call('kingdown_computer', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision }, true); };
$('invite').onclick = () => { if (view) void call('kingdown_invite', { game_id: view.game_id }); };
type ToolResult = Awaited<ReturnType<typeof client.call>>;
function renderGames(entries: InboxEntry[]) {
  memory.games = entries; gamesDirty = false;
  // The hall lists your games first, only when you have some.
  $('games-status').textContent = ''; $('games-head').hidden = !entries.length;
  $('home-line').textContent = turnLine(entries.filter(entry => entry.action === 'ready').length);
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
  if (value && typeof value.your_turn_count === 'number') $('home-line').textContent = turnLine(value.your_turn_count);
}
// Chat results mount one at a time, and a newer result stops an older mount at its next wait. So only the newest
// result reads and routes, and each board selection (kingdown_resume) reaches the server in order.
let mounts = Promise.resolve(), mountCount = 0;
app.ontoolresult = result => {
  const initial = awaitingInitialResult; awaitingInitialResult = false;
  const count = ++mountCount;
  const mount = () => mountResult(result, initial, () => count !== mountCount);
  mounts = mounts.then(mount, mount);
};
async function mountResult(result: ToolResult, initial: boolean, stale: () => boolean) {
  mountReading = true; actions();
  const shown = view?.game_id;
  try {
    await connection;
    const value = result.structuredContent as Record<string, unknown> | undefined, board = result._meta?.board_id;
    if (!initial || !state.board_id) state.board_id = typeof board === 'string' ? board : typeof value?.game_id === 'string' ? state.board_id : undefined;
    remember(result);
    if (initial) {
      const settings = await client.call('kingdown_settings', {}, { limit: false });
      if (settings.isError) throw new Error(settings.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(settings); await applySettings();
    }
    if (stale()) return;
    if (result.isError) {
      memory.preview = undefined;
      memory.joinError = { code: String(result._meta?.code ?? ''), message: result.content.filter(c => c.type === 'text').map(c => c.text).join(' ') };
      view = undefined; navigate('join');
      const home = await client.call('kingdown_open', {}, { limit: false });
      if (home.isError) throw new Error(home.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(home); saveState(); return;
    }
    if (value?.screen === 'join') { memory.preview = result._meta?.preview as JoinPreview | undefined; memory.code = memory.preview?.code ?? ''; memory.joinError = undefined; }
    if (value && ['home', 'play', 'board', 'profile', 'join'].includes(String(value.screen)) && (!initial || !savedScreen)) navigate(value.screen as Screen);
    if (typeof value?.game_id === 'string' && !board && (!initial || !state.board_id)) {
      const selected = await client.call(state.board_id ? 'kingdown_resume' : 'kingdown_open', { game_id: value.game_id }, { limit: false });
      if (stale()) return;
      if (selected.isError) throw new Error(selected.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(selected);
    }
    // The server names the board for every game; the read routes by the game status (a game in setup opens the seat).
    const route = (value?.screen === undefined || value.screen === 'board') && (!initial || !savedScreen);
    const readBoard = state.board_id && (typeof value?.game_id === 'string' || initial && savedScreen);
    // A command in flight for the game shown before would skip this read, and its reply would keep the old game on the screen.
    // A result for another game waits for that command, so its own read shows last.
    if (readBoard && typeof value?.game_id === 'string' && value.game_id !== shown) while (busy) await commandDone;
    if (stale()) return;
    if (readBoard) await call('kingdown_get', {}, false, false, route);
    else if (!result._meta?.view) view = undefined;
    if (!readBoard) await games();
    saveState();
  } catch (error) { $('error').textContent = $('home-error').textContent = errorText(error); }
  finally {
    mountReading = false;
    // A command that was in flight when the host remounted the widget has no reply here; Retry reads, then resends its ID.
    // A command still in flight on this page (a chat result came during it) gets its own reply.
    if (pending && !pending.error && !busy) failPending(CANNOT_CONNECT);
    if (pending?.error) retryState();
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
  // A screen that waited for fullscreen when the host remounted the widget opens now, or asks again inline.
  if (queuedAtStart && state.screen === 'home') { if (displayMode === 'inline' && canFullscreen()) void fullscreen(queuedAtStart); else navigate(queuedAtStart); }
  if (context?.displayMode === 'fullscreen' && state.screen === 'home' && !savedScreen) navigate('play');
  if (state.screen !== 'home') { const screen = state.screen; if (displayMode === 'inline' && canFullscreen()) navigate('home'); void fullscreen(screen); }
  poll = runPoll(() => ['friend', 'wait', 'seat', 'board'].includes(state.screen) ? view : undefined, async () => {
    if (!connected || awaitingInitialResult || mountReading || !state.board_id || busy || pending) return;
    await call('kingdown_get', { ...(view?.fen ? { since_revision: view.revision } : {}) }, false, true, !savedScreen || !!view && ['friend', 'wait', 'seat', 'board'].includes(state.screen));
    // kingdown_get is read-only; this write lets the opponent see the player online.
    if (view && Date.now() - seenAt >= 30_000) { seenAt = Date.now(); void client.call('kingdown_seen', { game_id: view.game_id }).catch(() => {}); }
  });
}).catch(error => { $('error').textContent = $('home-error').textContent = `Could not connect to the game: ${errorText(error)}`; });

// Ticket 21: the ChatGPT iOS app showed a 45 px board that no test browser shows. Settings keeps the sizes of the last
// seat or board screen; a long press on its title shows them, so a screenshot from the device names the cause.
// Remove when ticket 21 closes.
const sentSizes: string[] = [], sendSize = app.sendSizeChanged.bind(app);
app.sendSizeChanged = params => { sentSizes.push(`${params.width}x${params.height}`); sentSizes.splice(0, sentSizes.length - 3); return sendSize(params); };
function measureLayout() {
  const box = (selector: string) => { const el = [...document.querySelectorAll<HTMLElement>(selector)].find(e => e.offsetParent || e.id === 'app-frame'); if (!el) return '-'; const r = el.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}`; };
  const probe = (height: string) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;visibility:hidden;width:1px;height:${height}`; document.body.append(d); const h = Math.round(d.getBoundingClientRect().height); d.remove(); return h; };
  const context = app.getHostContext(), line = $('layout-check');
  line.textContent = `Display check: ${state.screen} · window ${innerWidth}x${innerHeight} · vv ${Math.round(visualViewport?.width ?? 0)}x${Math.round(visualViewport?.height ?? 0)} · vh ${probe('100vh')} dvh ${probe('100dvh')} · frame ${box('#app-frame')} · section ${box(`[data-screen="${state.screen}"]`)} · table ${box('#game-table, [data-seat-id="game-table"]')} · board ${box('#board')} · canvas ${box('#board canvas')} · safe ${JSON.stringify(context?.safeAreaInsets ?? {})} · ${context?.displayMode} ${JSON.stringify(context?.containerDimensions ?? {})} · sent ${sentSizes.join(' ')}`;
}
let press: ReturnType<typeof setTimeout> | undefined;
$('page-title').onpointerdown = () => { clearTimeout(press); if (state.screen === 'settings') press = setTimeout(() => { $('layout-check').hidden = false; }, 600); };
$('page-title').onpointerup = $('page-title').onpointerleave = $('page-title').onpointercancel = () => clearTimeout(press);
// Spec Q25: inline, the widget shows only the home card; each other screen shows in fullscreen. A screen that opens
// while inline (a chat tool call, a route) waits behind the home card until the host grants fullscreen. When the
// player leaves fullscreen, the home card comes back with its own height; a late route or tool result waits for Play,
// which returns to the game screen.
const GAME_SCREENS: Screen[] = ['seat', 'board', 'wait', 'friend', 'end'];
let displayMode: string | undefined, asking = false, collapsed = false, resume: Screen | undefined, target: Screen | undefined, gamesFirst = false;
const canFullscreen = () => app.getHostContext()?.availableDisplayModes?.includes('fullscreen') ?? true;
/** The widget state keeps the waiting screen only while it waits. */
function unqueue() { target = undefined; delete state.queued; }
/** Asks for fullscreen, then shows the last screen asked for (the home card stays until the host answers). */
async function fullscreen(screen: Screen) {
  target = state.queued = screen; client.save();
  if (asking) return;
  asking = true;
  try {
    await connection;
    const result = await app.requestDisplayMode({ mode: 'fullscreen' });
    if (result.mode !== 'fullscreen') throw new Error('Open the app with the host’s expand control.');
    displayMode = 'fullscreen';
    const next = target; unqueue();
    if (next && !collapsed) navigate(next); else client.save();
  } catch (error) { unqueue(); client.save(); if (state.screen !== 'home') navigate('home'); $('error').textContent = $('home-error').textContent = errorText(error); }
  finally { asking = false; }
}
/** Opens the Play hall at its top, where Your games are. */
export function showGames() { gamesFirst = true; navigate('play'); }
export function navigate(screen: Screen) {
  if (screen !== 'home' && displayMode === 'inline' && canFullscreen()) {
    if (collapsed) { if (GAME_SCREENS.includes(screen)) resume = screen; return; }
    void fullscreen(screen); return;
  }
  unqueue();
  if (screen === 'handle' && state.screen !== 'handle') handleBack = state.screen === 'settings' ? 'settings' : pending?.screen ?? state.screen;
  if (screen === 'settings' && !['settings','handle'].includes(state.screen)) {
    if (['board','seat'].includes(state.screen)) state.settings_back = state.screen; else delete state.settings_back;
  }
  state.screen = screen; retryState();
  $('page-title').removeAttribute('title');
  document.body.dataset.page = screen;
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach(el => { el.hidden = el.dataset.screen !== screen; });
  // New game opens at its top (F12); other pages keep their place when the player comes back.
  if (screen === 'play') document.querySelectorAll<HTMLElement>('[data-screen="play"] .new-game-body').forEach(el => { el.scrollTop = 0; });
  $('app-frame').hidden = screen === 'home';
  $('page-head').hidden = screen === 'home' || screen === 'play';
  $('page-back').textContent = screen === 'handle' && handleBack === 'settings' ? '‹ Settings' : screen === 'collection' ? '‹ Profile' : screen === 'settings' && ['board','seat'].includes(state.settings_back ?? '') ? '‹ Game' : '‹ Play';
  $('page-title').textContent = ({ friend: 'A friend', join: 'Join a game', wait: 'Looking for an opponent', lobby: 'Open games', seat: 'Set up your side', end: 'Game over', profile: 'Profile', collection: 'Collection', settings: 'Settings', handle: 'Pick a name and a picture' } as Partial<Record<Screen,string>>)[screen] ?? '';
  if (!mountReading && screen in screens) screens[screen as keyof typeof screens]();
  client.save(); actions(); poll?.update();
  if (screen === 'play' && !mountReading) {
    if (gamesDirty) void games(); else renderGames(memory.games);
  }
  if (screen === 'play' && gamesFirst) { gamesFirst = false; $('games-list').closest<HTMLElement>('.new-game-body')!.scrollTop = 0; }
  if (screen === 'settings') void applySettings();
  if (screen === 'seat' || screen === 'board') setTimeout(() => { if (state.screen === screen) measureLayout(); }, 1500);
  if (screen === 'handle') scheduleHandleCheck(); else { clearTimeout(handleTimer); handleCheck++; }
}
function hostContext(context: McpUiHostContext | undefined) {
  if (!context) return;
  document.body.dataset.theme = context.theme ?? 'light';
  document.body.dataset.touch = String(context.deviceCapabilities?.touch ?? false);
  for (const edge of ['top', 'right', 'bottom', 'left'] as const) document.documentElement.style.setProperty(`--safe-${edge}`, `${Math.max(0, context.safeAreaInsets?.[edge] ?? 0)}px`);
  if (context.displayMode === 'inline' && displayMode === 'fullscreen' && state.screen !== 'home' && canFullscreen()) {
    resume = GAME_SCREENS.includes(state.screen) ? state.screen : undefined;
    displayMode = 'inline'; navigate('home'); collapsed = true;
  }
  if (context.displayMode) displayMode = context.displayMode;
}
async function games() {
  $('games-status').textContent = 'Loading games…';
  try {
    const result = await client.call('kingdown_games');
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    const entries = (result._meta as { games?: InboxEntry[] } | undefined)?.games ?? [];
    renderGames(entries);
  } catch (error) { $('games-status').textContent = errorText(error); }
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
    } catch (error) { if (check === handleCheck) $('handle-check-error').textContent = errorText(error); }
  }, 250);
}
$('handle-form').onsubmit = event => {
  event.preventDefault(); clearTimeout(handleTimer); handleCheck++;
  const input = $<HTMLInputElement>('handle'), handle = input.value.trim().toLowerCase(); input.setCustomValidity(handleProblem(handle) ?? '');
  if (input.reportValidity()) void call('kingdown_handle', { handle, icon: picture });
};
$<HTMLInputElement>('handle').oninput = scheduleHandleCheck;
/** Spec J3: while a game waits for you, the main action resumes it by name and Play now moves to second place. */
const homeGame = () => resume ? memory.games.find(entry => entry.game_id === view?.game_id) : nextGame(memory.games);
function homeActions() {
  const game = homeGame(), back = !!resume || !!game;
  const label = (id: string, symbol: string, text: string) => { const html = `<svg class="icon" aria-hidden="true"><use href="#i-${symbol}"/></svg><span>${text}</span>`; if ($(id).innerHTML !== html) { $(id).innerHTML = html; $(id).querySelector('span')!.textContent = text; } };
  label('home-play', back ? 'continue' : 'play', back ? game ? `Resume · ${game.opponent?.computer ? 'Computer' : gameTitle(game)}` : 'Resume' : 'Play now');
  label('home-games', back ? 'play' : 'guide', back ? 'Play now' : 'Choose a game');
}
// Spec J2, D2: Play now asks for fullscreen on the tap and opens the board when the game exists.
function homePlayNow() { collapsed = false; resume = undefined; void fullscreen('home'); playNow(); }
$('home-play').onclick = () => {
  const game = homeGame();
  if (resume) { const next = resume; collapsed = false; resume = undefined; void fullscreen(next); }
  else if (game) { collapsed = false; void fullscreen('home'); void call('kingdown_resume', { game_id: game.game_id }); }
  else homePlayNow();
};
$('home-games').onclick = () => { if (resume || homeGame()) return homePlayNow(); collapsed = false; gamesFirst = true; void fullscreen('play'); };
document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(button => { button.onclick = () => navigate(button.dataset.nav as Screen); });
$('page-back').onclick = () => navigate(state.screen === 'handle' ? handleBack : state.screen === 'collection' ? 'profile' : state.screen === 'settings' ? state.settings_back ?? 'play' : 'play');
app.onhostcontextchanged = () => hostContext(app.getHostContext());
navigate(state.screen);

// Sound is per device and off by default. The tap that turns it on unlocks audio with one knock.
const soundOn = () => { try { return localStorage.getItem('kingdown-sound') === 'on'; } catch { return false; } };
setSound(soundOn()); $<HTMLInputElement>('sound').checked = soundOn();
$<HTMLInputElement>('sound').onchange = event => {
  const on = (event.target as HTMLInputElement).checked; setSound(on);
  try { localStorage.setItem('kingdown-sound', on ? 'on' : 'off'); } catch { /* a sandboxed frame may refuse storage; the switch still works for this visit */ }
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession; if (session) session.type = 'ambient';
  if (on) snd.move();
};
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
    } catch (error) { $('error').textContent = errorText(error); }
    await applySettings();
  };
}
