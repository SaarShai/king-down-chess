import { App, type McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { PlayerSettings } from './settings';
import { setRules } from '../rules/engine';
import { nextGame } from './next-game';
import { gameTitle, gamesList, waitingLine } from './games-list';
import type { InboxEntry, JoinPreview, View } from '../match/protocol';
import { CANNOT_CONNECT, createClient, errorText, knownScreen, SELECTION_TOOLS, type WidgetHost, type Screen, type Pending } from './client';
import { art } from './art';
import { handleProblem, ICONS, type Icon } from '../account/profile';
import { boardScreen, rollbackBoardMove } from './screens/board';
import { setSettings } from './board-view';
import { setSound, snd } from '../render/sfx';
import { runPoll } from './poll';
import { createRouter } from './router';
import { applyLocks, createStore, locks, messageLine } from './state';
import { draftFromGame, playNow, quickStart, setupBusy, setupScreen, setupStarting, setupSync } from './screens/setup';
import { friendScreen } from './screens/friend';
import { joinScreen } from './screens/join';
import { waitScreen } from './screens/wait';
import { lobbyScreen } from './screens/lobby';
import { seatScreen, seatSync } from './screens/seat';
import { endSync, endScreen } from './screens/end';
import { profileScreen } from './screens/profile';
import { collectionScreen } from './screens/collection';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const extension = (window as Window & { openai?: WidgetHost }).openai;
const savedScreen = knownScreen(extension?.widgetState?.privateContent?.screen);
const app = new App({ name: 'King Down', version: '1.0.0' }, { availableDisplayModes: ['inline', 'fullscreen'] });
export const client = createClient(app, extension);
const state = client.state;
const queuedAtStart = state.queued;
let awaitingInitialResult = true;
let connected = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined;
let busy = false, polling = false, mountReading = true, restoringMount = false, gamesDirty = false, newGameFirst = false;
// Ends when the command in flight (busy) ends; call skips a read while busy.
let commandDone = Promise.resolve(), endCommand = () => {};
let poll: ReturnType<typeof runPoll> | undefined, seenAt = 0;
let pending = state.pending;
let handleBack: Screen = pending?.screen ?? 'settings';
// One state slot: the notice, the scoped locks and the message line (design §1 and §3).
export const store = createStore({
  page: () => ({ screen: state.screen, pending, view, connected, mounting: mountReading, writing: busy, settings: !!memory.settings, handle_back: handleBack, settings_back: state.settings_back }),
  call: (name, args, retain, quiet, route, retry, signal, user) => call(name, args, retain, quiet, route, retry, signal, user),
});
// A stale board (a failed read: "Not current") locks its game actions until a read succeeds.
export const gameActionsBlocked = () => locks(store.page()).game;
const drawBoard = boardScreen(store);
// Subscribers replace the #error, #reload, #status, #retry and #seat-ready observers.
store.subscribe(page => setupSync(page));
store.subscribe(page => seatSync(page));
store.subscribe(page => endSync(page));
store.subscribe(() => actions());
const router = createRouter((name, args, retain) => call(name, args, retain, false, false), navigate, next => {
  show(next);
  if (next.status === 'aborted' && next.kind === 'solo' && next.result?.reason === 'abort') { draftFromGame(next); newGameFirst = true; }
}, () => !!pending);
export const { routeView, start } = router;
const screens = { play: setupScreen, friend: friendScreen, join: joinScreen, wait: waitScreen, lobby: lobbyScreen, seat: seatScreen, end: endScreen, profile: profileScreen, collection: collectionScreen };
export const memory = { kind: 'solo' as 'solo' | 'friend' | 'random', code: '', settings: undefined as PlayerSettings | undefined, me: undefined as { handle: string | null; icon: Icon | null } | undefined, games: [] as InboxEntry[], preview: undefined as JoinPreview | undefined, joinError: undefined as { code: string; message: string } | undefined, get view() { return view; } };
function saveState() { state.pending = pending; client.save(); }
/** A command's error stays on the screen where the command started, so its Retry shows there, also after the player leaves. */
function failPending(message: string) {
  pending!.error = message; pending!.error_screen = pending!.screen ?? state.screen; saveState();
  if (state.screen === 'home' && pending!.screen === 'play') navigate('play');
}
const TOGGLES = [['symbols-only', 'symbols_only'], ['show-threats', 'show_threats'], ['show-online', 'show_online']] as const;
function turnLine(count: number) {
  $('home-line').hidden = count === 0;
  $('home-line').textContent = `Your move in ${count} game${count === 1 ? '' : 's'}.`;
}
export function actions() {
  // The one lock pass of render() runs first; then the app's own controls.
  applyLocks(store.page());
  const lock = locks(store.page());
  $<HTMLButtonElement>('home-play').disabled = $<HTMLButtonElement>('home-games').disabled = lock.blocked || !memory.settings;
  for (const id of ['setup-start', 'hall-play', 'games-start']) $<HTMLButtonElement>(id).disabled = lock.start || setupStarting();
  $<HTMLInputElement>('join-code').disabled = lock.blocked;
  $<HTMLInputElement>('handle').disabled = lock.blocked;
  homeActions();
  for (const [id] of TOGGLES) $<HTMLInputElement>(id).disabled = lock.blocked || !memory.settings;
}
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  const before = view;
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (next.fen && rules?.game !== next.game_id) return;
  if (view?.game_id !== next.game_id || view.revision !== next.revision || view.status !== next.status || view.action !== next.action) gamesDirty = true;
  if (view?.game_id !== next.game_id) $('invitation').textContent = '';
  view = next;
  if (rules?.game === next.game_id) setRules(rules.value);
  drawBoard(next, mountReading && restoringMount);
  // A view of another game clears a refusal or a read of the game it leaves; a good read clears this game's read notice.
  if (before?.game_id !== next.game_id) store.dispatch({ type: 'view', game: next.game_id });
  store.dispatch({ type: 'good-read', game: next.game_id });
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
  // A failed start has no game_tag, so the read is the start's own game only if it is not the game the page already shows.
  const fresh = completed && completed.game_id !== view?.game_id ? completed : undefined;
  // started_at is device time and created_at is server time. The device clock only measures the time since the start;
  // the read's server_now puts the start on the server clock, so a device clock ahead of the server cannot hide the new game.
  const startedOnServer = fresh && command.started_at !== undefined ? Date.parse(fresh.server_now) - (Date.now() - command.started_at) : NaN;
  if (['kingdown_create', 'kingdown_find'].includes(command.name) && command.started_at !== undefined && fresh && (!command.game_tag || !fresh.game_id.startsWith(command.game_tag)) && (command.name === 'kingdown_find' || Date.parse(fresh.created_at) >= startedOnServer)) return read;
  if (!mountRead) {
    if (command.game_tag && !['kingdown_create', 'kingdown_find'].includes(command.name)) {
      if (!completed?.game_id.startsWith(command.game_tag)) { pending = undefined; if (completed) routeView(completed); return read; }
      command.args.game_id = completed.game_id;
    }
    return client.call(command.name, command.args);
  }
}
// `user` is true when a user command starts the call. A programmatic write (the computer move) is not a user command,
// so its refusal never becomes the page's one notice (design §1.2 and §2).
export async function call(name: string, args: Record<string, unknown>, retain = false, quiet = false, route: boolean | undefined = undefined, retry = false, signal?: AbortSignal, user = true) {
  if (busy || (quiet && polling)) return;
  const before = view;
  const commandScreen = state.screen === 'home' && (quickStart() || ['kingdown_create', 'kingdown_find'].includes(name)) ? 'play' : state.screen;
  // A poll gives way to a command or a newer view; a mount's read gives way to a newer chat result (signal).
  const late = () => quiet && (busy || view !== before) || !!signal?.aborted;
  let followup: Pending | undefined, received: View | undefined, refused: { text: string; code: string; game?: string } | undefined;
  if (quiet) polling = true;
  else { busy = true; commandDone = new Promise(resolve => { endCommand = resolve; }); store.dispatch({ type: retain ? 'command' : 'change' }); }
  if (retain) {
    if (pending?.name !== name || pending.args !== args) pending = { name, args, ...(typeof args.game_id === 'string' && { game_tag: args.game_id.slice(0, 8) }), started_at: Date.now(), screen: commandScreen, ...(quickStart() && { quick: true }) };
    pending.error = undefined; pending.error_screen = undefined; saveState();
  }
  try {
    let result: ToolResult | undefined;
    if (retry && pending) result = await resendPending(pending);
    result ??= await client.call(name, args, { signal });
    if (mountReading && name === 'kingdown_get' && pending && ['kingdown_create', 'kingdown_find'].includes(pending.name)) {
      const recovered = await resendPending(pending, result);
      if (recovered) { name = pending.name; retain = true; route = undefined; result = recovered; }
    }
    if (late()) return;
    // A chat result that chose another board while this selection ran is newer: its board and screen stay.
    const selected = result._meta?.board_id;
    if (!quiet && SELECTION_TOOLS.includes(name) && typeof selected === 'string' && selected !== state.board_id) { if (retain) { pending = undefined; saveState(); router.finishStart(); } return; }
    const read = (result._meta as { view?: View } | undefined)?.view;
    if (name === 'kingdown_get' && read?.fen && !read.rules && rules?.game !== read.game_id) {
      result = await client.call('kingdown_get', {}, { signal });
      if (late()) return;
    }
    if (result.isError) {
      const text = result.content.filter(c => c.type === 'text').map(c => c.text).join(' ');
      // The command waits for a name. Save sends it again; Back shows the server's reason and Retry on the start screen.
      if (result._meta?.code === 'HANDLE_NEEDED') { pending ??= { name, args, ...(typeof args.game_id === 'string' && { game_tag: args.game_id.slice(0, 8) }), started_at: Date.now(), screen: commandScreen }; failPending(text); navigate('handle'); return; }
      // A refusal that the same send cannot change ends the command, so it does not lock Start, the board or the poll.
      // RATE_LIMITED: a Find on your own open game after its last start receipt (src/match/service.ts START_RECEIPTS).
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'NOT_ALLOWED', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE', 'RATE_LIMITED'];
      if (definitive.includes(String(result._meta?.code))) {
        // A read never changes `pending`: a poll reply belongs to the read path below (design §4).
        if (!quiet) { pending = undefined; saveState(); if (retain) router.finishStart(); }
        // A command's refusal becomes the one notice; a read (Get or the poll) is never a refusal (design §3.2 and §4).
        if (!quiet && name !== 'kingdown_get') refused = { text, code: String(result._meta?.code), ...(typeof args.game_id === 'string' && { game: args.game_id }) };
      }
      throw new Error(text);
    }
    remember(result);
    // A good read clears the stale board, its error and Try again together.
    const next = (result._meta as { view?: View } | undefined)?.view;
    const goodRead = name === 'kingdown_get' || !!next, outage = goodRead && store.page().notice?.kind === 'read';
    if (quiet && next && next.game_id === view?.game_id && next.revision === view?.revision) {
      view = { ...view, opponent: next.opponent, server_now: next.server_now }; if (outage) drawBoard(view); store.dispatch({ type: 'good-read', game: next.game_id }); if (state.screen === 'seat') seatScreen(); poll?.update(); return;
    }
    show(next); received = next;
    if (name === 'kingdown_get' && !quiet) { await games(signal); if (late()) return; }
    // Save sends the waiting command again at once, so its old error and Retry go now.
    if (name === 'kingdown_handle') { followup = pending; if (followup) followup.error = followup.error_screen = undefined; navigate(followup?.screen ?? handleBack); }
    const resumedStart = retain && next ? router.finishStart(next) : false;
    if (next && !resumedStart && (route ?? SELECTION_TOOLS.includes(name))) routeView(next);
    if (name === 'kingdown_invite') { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain) pending = undefined;
    saveState();
  } catch (error) { const message = error instanceof Error ? error.message : 'Could not update the game.';
    if (late()) return;
    // A refusal shows only for a user command; a programmatic write (the computer move) stays silent, as before S2.
    if (refused) { if (user) store.dispatch({ type: 'refusal', text: refused.text, code: refused.code, ...(refused.game && { game: refused.game }) }); }
    // A poll timeout is silent; the third one in a row sets the read notice.
    else if (quiet && message === CANNOT_CONNECT) store.dispatch({ type: 'failed-poll', text: message, ...(view?.game_id && { game: view.game_id }) });
    else if (retain && pending) { failPending(message); store.dispatch({ type: 'change' }); }
    // Three failed polls in a row (or one failed foreground read) mark the board stale: "Not current", the lock and Try again.
    else if (name === 'kingdown_get' && state.board_id) store.dispatch({ type: 'failed-read', text: message, ...(view?.game_id && { game: view.game_id }) });
    else store.dispatch({ type: 'error', text: message });
  }
  finally { if (quiet) polling = false; else { busy = false; endCommand(); store.dispatch({ type: 'change' }); } }
  if (name === 'kingdown_move' && received && received.kind !== 'solo') void games().then(() => { if (view) drawBoard(view); });
  if (retain && name === 'kingdown_move' && !received && !pending && before?.game_id === view?.game_id) await rollbackBoardMove();
  if (followup) void call(followup.name, followup.args, true, false, undefined, true);
  return received;
}
$('reload').onclick = () => { if (state.board_id) void call('kingdown_get', {}); };
// One Retry handler runs the shown action (design §3.2): it connects, reads, or sends the same command.
$('retry').onclick = () => {
  const action = messageLine(store.page()).action;
  if (action === 'connect') location.reload();
  else if (action === 'try-again') { if (state.board_id) void call('kingdown_get', {}, false, false, true); }
  // The mount's quiet resend reaches this button with no line of its own (the resend moves into the queue at S5).
  else if (pending) void call(pending.name, pending.args, true, false, undefined, true);
};
$('computer').onclick = () => { if (view) void call('kingdown_computer', { game_id: view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision }, true); };
$('invite').onclick = () => { if (view) void call('kingdown_invite', { game_id: view.game_id }); };
type ToolResult = Awaited<ReturnType<typeof client.call>>;
function renderGames(entries: InboxEntry[]) {
  memory.games = entries; gamesDirty = false;
  $('games-status').textContent = ''; $('games-empty').hidden = !!entries.length;
  turnLine(entries.filter(entry => entry.action === 'ready').length);
  renderGameRows();
}
export function renderGameRows() {
  gamesList($('games-list'), memory.games, (name, args) => call(name, args, false, false, false), routeView);
  actions(); scrollNewGame();
}
function remember(result: ToolResult) {
  if (result._meta?.settings) memory.settings = result._meta.settings as PlayerSettings;
  if (result._meta?.me) {
    const me = result._meta.me as NonNullable<typeof memory.me>, before = memory.me; memory.me = me;
    if (me.handle !== before?.handle || me.icon !== before?.icon) renderIdentity();
  }
  if (Array.isArray(result._meta?.games)) renderGames(result._meta.games as InboxEntry[]);
  const value = result.structuredContent as Record<string, unknown> | undefined;
  if (value && typeof value.your_turn_count === 'number') turnLine(value.your_turn_count);
}
// A newer chat result aborts the calls of an older mount, so only the newest reads and routes, and it does not wait for the older one.
let mountAbort: AbortController | undefined;
app.ontoolresult = result => {
  const initial = awaitingInitialResult; awaitingInitialResult = false;
  mountAbort?.abort(); mountAbort = new AbortController();
  void mountResult(result, initial, mountAbort.signal);
};
async function mountResult(result: ToolResult, initial: boolean, signal: AbortSignal) {
  mountReading = true; restoringMount = initial && !!savedScreen; store.sync();
  const stale = () => signal.aborted;
  try {
    await connection;
    if (stale()) return;
    const value = result.structuredContent as Record<string, unknown> | undefined, board = result._meta?.board_id;
    if (!initial || !state.board_id) state.board_id = typeof board === 'string' ? board : typeof value?.game_id === 'string' ? state.board_id : undefined;
    remember(result);
    if (initial || !memory.settings || !memory.me) {
      const settings = await client.call('kingdown_settings', {}, { limit: false, signal });
      if (stale()) return;
      if (settings.isError) throw new Error(settings.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(settings); await applySettings();
    }
    if (stale()) return;
    if (result.isError) {
      memory.preview = undefined;
      memory.joinError = { code: String(result._meta?.code ?? ''), message: result.content.filter(c => c.type === 'text').map(c => c.text).join(' ') };
      view = undefined; navigate('join');
      const home = await client.call('kingdown_open', {}, { limit: false, signal });
      if (stale()) return;
      if (home.isError) throw new Error(home.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(home); saveState(); return;
    }
    if (!initial && value?.screen === 'home') openHallOnExpand = false;
    if (value?.screen === 'join') { memory.preview = result._meta?.preview as JoinPreview | undefined; memory.code = memory.preview?.code ?? ''; memory.joinError = undefined; }
    if (value && ['home', 'play', 'board', 'profile', 'join'].includes(String(value.screen)) && (!initial || !savedScreen)) navigate(value.screen === 'home' && initial && !savedScreen && displayMode === 'fullscreen' ? 'play' : value.screen as Screen);
    // A game with no board gets its own new board, so mounts never race on one server board; only a current mount takes it.
    if (typeof value?.game_id === 'string' && !board && (!initial || !state.board_id)) {
      const selected = await client.call('kingdown_open', { game_id: value.game_id }, { limit: false, background: true, signal });
      if (stale()) return;
      if (selected.isError) throw new Error(selected.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      state.board_id = selected._meta?.board_id as string | undefined; remember(selected);
    }
    // A saved game follows its status. Keep its pending command on its screen unless the game ends.
    const savedGame = !!(initial && savedScreen && GAME_SCREENS.includes(queuedAtStart ?? savedScreen));
    const route = initial && savedScreen ? savedGame && !pending : value?.screen === undefined || value.screen === 'board';
    const readBoard = state.board_id && (typeof value?.game_id === 'string' || initial && savedScreen);
    // A command in flight would skip this read, even for the same game. Wait, then read and route by the game status.
    if (readBoard) while (busy) await commandDone;
    if (stale()) return;
    if (readBoard) {
      const next = await call('kingdown_get', {}, false, false, route, false, signal);
      if (!stale() && savedGame && !route && next && (next.status === 'finished' || next.status === 'aborted')) routeView(next);
    } else if (!result._meta?.view) view = undefined;
    if (!readBoard) await games(signal);
    if (stale()) return;
    saveState();
  } catch (error) { if (!stale()) store.dispatch({ type: 'error', text: errorText(error) }); }
  finally {
    // A stale mount leaves the page to the newer mount, which still reads or has finished.
    if (!stale()) {
      mountReading = false;
      // A command that was in flight when the host remounted the widget has no reply here. The page selects Retry for the
      // player: Retry reads first, then sends the same command ID, and each screen keeps its own Retry steps (New game
      // finishes a start). The error and Retry show only if that send fails (owner item W6 a). A start that waits for a
      // name keeps its error and is not sent (R4C-3). A command still in flight on this page (a chat result came during
      // it) gets its own reply.
      const resend = !!pending && !pending.error && !busy;
      if (resend && !connected) failPending(CANNOT_CONNECT);
      store.sync();
      if (state.screen in screens) screens[state.screen as keyof typeof screens]();
      poll?.update();
      // A pending command with no error was in flight at the teardown: send it once, with no text (W6 a). The queue
      // owns this resend at S5; here it sends the same command directly, because a silent send leaves Retry hidden.
      if (resend && connected && pending) void call(pending.name, pending.args, true, false, undefined, true);
    }
  }
}
app.onclose = () => { connected = false; poll?.stop(); router.finishStart(); };
app.onteardown = async () => { connected = false; poll?.stop(); router.finishStart(); saveState(); return {}; };
const connection = app.connect().then(() => {
  connected = true; store.dispatch({ type: 'connected' });
  const context = app.getHostContext(); hostContext(context);
  // A saved route waits behind the home card while the host stays inline.
  if (queuedAtStart && state.screen === 'home') navigate(queuedAtStart);
  if (state.screen !== 'home' && displayMode === 'inline') { const screen = state.screen; if (canFullscreen()) navigate('home'); navigate(screen); }
  poll = runPoll(() => ['friend', 'wait', 'seat', 'board'].includes(state.screen) ? view : undefined, async () => {
    if (!connected || awaitingInitialResult || mountReading || !state.board_id || busy) return;
    await call('kingdown_get', { ...(view?.fen ? { since_revision: view.revision } : {}) }, false, true, !savedScreen || !!view && ['friend', 'wait', 'seat', 'board'].includes(state.screen));
    // kingdown_get is read-only; this write lets the opponent see the player online.
    if (view && Date.now() - seenAt >= 30_000) { seenAt = Date.now(); void client.call('kingdown_seen', { game_id: view.game_id }).catch(() => {}); }
  });
}).catch(error => { store.dispatch({ type: 'connect', text: `Could not connect to the game: ${errorText(error)}` }); });

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
// Inline routes wait behind the home card. Only a button requests fullscreen.
const GAME_SCREENS: Screen[] = ['seat', 'board', 'wait', 'friend', 'end'];
let displayMode: string = 'inline', asking = false, collapsed = false, resume: Screen | undefined, target: Screen | undefined, gamesFirst = false, openHallOnExpand = !savedScreen;
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
  } catch (error) { const next = target; unqueue(); if (state.screen !== 'home') navigate('home'); if (next && next !== 'home') resume = state.queued = next; client.save(); store.dispatch({ type: 'error', text: errorText(error) }); }
  finally { asking = false; }
}
export function showNewGame() { newGameFirst = true; navigate('play'); }
function scrollNewGame() {
  if (!newGameFirst || state.screen !== 'play' || gamesDirty || mountReading) return;
  const heading = $('new-game-head'), body = heading.closest<HTMLElement>('.new-game-body')!;
  body.scrollTop += heading.getBoundingClientRect().top - body.getBoundingClientRect().top;
  newGameFirst = false;
}
export function navigate(screen: Screen) {
  if (screen !== 'home' && displayMode === 'inline' && canFullscreen()) {
    resume = state.queued = screen; if (asking) target = screen; client.save(); return;
  }
  unqueue();
  resume = undefined;
  if (screen === 'home' && !mountReading) openHallOnExpand = false;
  if (screen === 'handle' && state.screen !== 'handle') handleBack = state.screen === 'settings' ? 'settings' : pending?.screen ?? state.screen;
  if (screen === 'settings' && !['settings','handle'].includes(state.screen)) {
    if (['board','seat'].includes(state.screen)) state.settings_back = state.screen; else delete state.settings_back;
  }
  if (screen !== 'play') newGameFirst = false;
  state.screen = screen;
  // render() writes the view switch and the message line; here only the page's enter hooks run. The page's own
  // observers (wait, lobby, join) follow the route, so this write keeps their trigger on a navigation.
  document.body.dataset.page = screen;
  store.dispatch({ type: 'navigate' });
  $('page-title').removeAttribute('title');
  // New game opens at its top (F12); other pages keep their place when the player comes back.
  if (screen === 'play') document.querySelectorAll<HTMLElement>('[data-screen="play"] .new-game-body').forEach(el => { el.scrollTop = 0; });
  if (!mountReading && screen in screens) screens[screen as keyof typeof screens]();
  client.save(); poll?.update();
  if (['home', 'play'].includes(screen) && !mountReading) {
    if (gamesDirty) void games(); else if (screen === 'play') renderGameRows();
  }
  if (screen === 'play') scrollNewGame();
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
    const screen = state.screen;
    displayMode = 'inline'; navigate('home'); resume = state.queued = screen; client.save(); collapsed = true; store.sync();
  }
  const showHall = context.displayMode === 'fullscreen' && openHallOnExpand;
  if (context.displayMode) displayMode = context.displayMode;
  if (displayMode === 'fullscreen') openHallOnExpand = false;
  if (displayMode === 'fullscreen' && resume && !asking) { const screen = resume; resume = undefined; collapsed = false; navigate(screen); }
  else if (showHall && state.screen === 'home' && !asking) navigate('play');
}
/** A mount passes its signal: a newer chat result aborts the list call (the SDK rejects it), and the newer list stays. */
async function games(signal?: AbortSignal) {
  $('games-status').textContent = 'Loading games…';
  try {
    const result = await client.call('kingdown_games', {}, { signal });
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    const entries = (result._meta as { games?: InboxEntry[] } | undefined)?.games ?? [];
    renderGames(entries);
  } catch (error) { if (!signal?.aborted) $('games-status').textContent = errorText(error); }
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
/** Resume names the shown game while it is open (also before the games list has it), else a ready person first; Your games opens the list. */
const homeGame = () => resume && resume !== 'play' ? GAME_SCREENS.includes(resume) ? view && ['waiting', 'setup', 'playing'].includes(view.status) ? view : memory.games.find(entry => entry.game_id === view?.game_id) : undefined : nextGame(memory.games);
function homeActions() {
  const game = homeGame(), back = !!resume && resume !== 'play' || !!game;
  const turn = game?.status === 'playing' ? game.action === 'ready' ? ' · Your move' : ' · Their turn' : '';
  $<HTMLButtonElement>('home-play').disabled ||= !back && setupBusy();
  const label = (id: string, symbol: string, text: string) => { const html = `<svg class="icon" aria-hidden="true"><use href="#i-${symbol}"/></svg><span>${text}</span>`; if ($(id).innerHTML !== html) { $(id).innerHTML = html; $(id).querySelector('span')!.textContent = text; } };
  label('home-play', back ? 'continue' : 'play', back ? game ? `Resume · ${game.status === 'waiting' ? waitingLine(game) : game.opponent?.computer ? 'Computer' : gameTitle(game)}${turn}` : 'Resume' : 'Play now');
  label('home-games', 'guide', memory.games.length ? `Your games (${memory.games.length})` : 'Choose a game');
}
// Spec J2, D2: Play now asks for fullscreen on the tap and opens the board when the game exists.
function homePlayNow() { collapsed = false; resume = undefined; void fullscreen('home'); playNow(); }
$('home-play').onclick = () => {
  const game = homeGame();
  if (resume && resume !== 'play') { const next = resume; collapsed = false; resume = undefined; void fullscreen(next); }
  else if (game) { collapsed = false; void fullscreen('home'); void call('kingdown_resume', { game_id: game.game_id }); }
  else homePlayNow();
};
$('home-games').onclick = () => { collapsed = false; resume = undefined; gamesFirst = true; void fullscreen('play'); };
$('hall-play').onclick = $('games-start').onclick = () => playNow();
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
  for (const [id, key] of TOGGLES) $<HTMLInputElement>(id).checked = memory.settings[key];
  await setSettings(memory.settings);
}
for (const [id, key] of TOGGLES) {
  $<HTMLInputElement>(id).onchange = async () => {
    for (const [other] of TOGGLES) $<HTMLInputElement>(other).disabled = true;
    try {
      const result = await client.call('kingdown_settings', { [key]: $<HTMLInputElement>(id).checked });
      if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      remember(result);
    } catch (error) { store.dispatch({ type: 'error', text: errorText(error) }); }
    await applySettings();
  };
}
