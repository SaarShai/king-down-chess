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
import { runPoll, type PollTarget } from './poll';
import { createRouter } from './router';
import { applyLocks, createStore, locks, messageLine } from './state';
import { createQueue, EMPTY, REFUSALS, resultCode, resultText, type Job, type JobOptions, type Kind, type Outcome } from './queue';
import { draftFromGame, playNow, quickStart, setupBusy, setupScreen, setupStarting, setupSync } from './screens/setup';
import { friendScreen } from './screens/friend';
import { joinScreen, joinSync } from './screens/join';
import { waitPoll, waitScreen, waitSync } from './screens/wait';
import { lobbyPoll, lobbyScreen, lobbySync } from './screens/lobby';
import { seatScreen, seatSync } from './screens/seat';
import { endPoll, endSync, endScreen } from './screens/end';
import { profileScreen } from './screens/profile';
import { collectionScreen } from './screens/collection';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
// WebKit does not focus a button on a pointer click. Focus it before its handler runs, so a sheet returns focus to its opener.
window.addEventListener('click', event => {
  const button = event.isTrusted && (event.target as Element | null)?.closest?.('button');
  if (button && document.activeElement !== button) button.focus({ preventScroll: true });
}, true);
const extension = (window as Window & { openai?: WidgetHost }).openai;
const savedScreen = knownScreen(extension?.widgetState?.privateContent?.screen);
const app = new App({ name: 'King Down', version: '1.0.0' }, { availableDisplayModes: ['inline', 'fullscreen'] });
export const client = createClient(app, extension);
const state = client.state;
const queuedAtStart = state.queued;
let awaitingInitialResult = true;
let connected = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined;
let polling = false, gamesDirty = false, newGameFirst = false;
let poll: ReturnType<typeof runPoll> | undefined, seenAt = 0;
let pending = state.pending;
let handleBack: Screen = pending?.screen ?? 'settings';
// The one command lane and the one epoch gate (design §1.2 and §2, ticket 19 S3).
export const queue = createQueue();
// The pre-mount window counts as mounting too, so every control stays off until the first mount ends (design §3.3).
const mounting = () => queue.mounting() || awaitingInitialResult;
// The refused move's rollback read is part of its own job, so it never waits for the lane that job holds (design §2).
let rollingBack = false;
// One state slot: the notice, the scoped locks and the message line (design §1 and §3).
export const store = createStore({
  page: () => ({ screen: state.screen, pending, view, connected, mounting: mounting(), writing: queue.writing(), settings: !!memory.settings, handle_back: handleBack, settings_back: state.settings_back }),
  call: (name, args, retain, quiet, route, retry, signal, user) => call(name, args, retain, quiet, route, retry, signal, user),
});
// A stale board (a failed read: "Not current") locks its game actions until a read succeeds.
export const gameActionsBlocked = () => locks(store.page()).game;
const drawBoard = boardScreen(store);
// Subscribers replace the #error, #reload, #status, #retry and #seat-ready observers.
store.subscribe(page => setupSync(page));
store.subscribe(page => seatSync(page));
store.subscribe(page => endSync(page));
store.subscribe(page => { lobbySync(page); joinSync(page); waitSync(); });
store.subscribe(() => actions());
const router = createRouter((name, args, retain) => call(name, args, retain, false, false), navigate, next => {
  show(next);
  if (next.status === 'aborted' && next.kind === 'solo' && next.result?.reason === 'abort') { draftFromGame(next); newGameFirst = true; }
}, () => !!pending);
export const { routeView, start } = router;
const screens = { play: setupScreen, friend: friendScreen, join: joinScreen, wait: waitScreen, lobby: lobbyScreen, seat: seatScreen, end: endScreen, profile: profileScreen, collection: collectionScreen };
export const memory = { kind: 'solo' as 'solo' | 'friend' | 'random', code: '', blockNotice: '', settings: undefined as PlayerSettings | undefined, me: undefined as { handle: string | null; icon: Icon | null } | undefined, games: [] as InboxEntry[], preview: undefined as JoinPreview | undefined, joinError: undefined as { code: string; message: string } | undefined, get view() { return view; } };
function saveState() { state.pending = pending; client.save(); }
/** A command's error stays on the screen where the command started, so its Retry shows there, also after the player leaves. */
function failPending(message: string) {
  pending!.error = message; pending!.error_screen = pending!.screen ?? state.screen; saveState();
  if (state.screen === 'home' && pending!.screen === 'play') navigate('play');
}
const TOGGLES = [['symbols-only', 'symbols_only'], ['show-threats', 'show_threats']] as const;
const onlineChoices = () => document.querySelectorAll<HTMLInputElement>('#online-visibility input');
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
  onlineChoices().forEach(input => { input.disabled = lock.blocked || !memory.settings; });
}
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  const before = view;
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (next.fen && rules?.game !== next.game_id) return;
  if (view?.game_id !== next.game_id || view.revision !== next.revision || view.status !== next.status || view.action !== next.action) gamesDirty = true;
  if (view?.game_id !== next.game_id || view.revision !== next.revision) memory.blockNotice = '';
  if (view?.game_id !== next.game_id) $('invitation').textContent = '';
  view = next;
  if (rules?.game === next.game_id) setRules(rules.value);
  // The mount job restores a saved screen only on the first mount (design §2, step 2).
  drawBoard(next, mounting() && queue.mountJob()?.options.initial === true && !!savedScreen);
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
/** The tools that change no game and no account: they run as reads, beside the lane (design §2). */
export const READ_TOOLS = ['kingdown_get', 'kingdown_games', 'kingdown_lobby', 'kingdown_profile'];
/** The screens a poll reply may route between; a poll never leaves a screen the player opened (design §1.2, R3b). */
const POLL_SCREENS: Screen[] = ['friend', 'wait', 'seat', 'board'];

/** One queue job for one call: a write takes the lane, a read runs beside it (design §2). */
export function send(name: string, args: Record<string, unknown>, options: JobOptions = {}): Promise<Outcome> {
  // One poll reads at a time, as the single `polling` flag did on owner-decisions.
  if (options.quiet && polling) return Promise.resolve({ status: 'superseded' });
  const kind: Kind = options.quiet || READ_TOOLS.includes(name) ? 'read' : 'write';
  // A read of the page board waits for an idle lane, so it never reads through a write in flight (design §2, R6).
  // The refused move's rollback read is part of that move's own job, so it runs at once.
  const board = kind === 'read' && name === 'kingdown_get' && args.game_id === undefined && args.board_id === undefined && !!state.board_id && !rollingBack;
  const job = queue.command(kind, name, args, { ...options, board });
  const started = queue.run(job, current => perform(current, name, args));
  // A write locks the page at once, so the board shows its own locked words ("Sending…") while the send waits.
  if (!options.quiet && kind === 'write') store.dispatch({ type: options.retain ? 'command' : 'change' });
  return started.then(outcome => { if (!options.quiet) store.dispatch({ type: 'change' }); return outcome; });
}
// `user` is true when a user command starts the call. A programmatic write (the computer move) is not a user command,
// so its refusal never becomes the page's one notice (design §1.2 and §2).
export async function call(name: string, args: Record<string, unknown>, retain = false, quiet = false, route: boolean | undefined = undefined, retry = false, signal?: AbortSignal, user = true) {
  const outcome = await send(name, args, { retain, quiet, route, retry, signal, user });
  return outcome.status === 'done' || outcome.status === 'refused' ? outcome.view as View | undefined : undefined;
}
/** The body of one job (design §1.2 and §2). Its epoch gate stops each write when a newer job is current. */
async function perform(job: Job, initialName: string, initialArgs: Record<string, unknown>): Promise<Outcome> {
  let name = initialName, args = initialArgs;
  let retain = job.options.retain ?? false, route = job.options.route, retry = job.options.retry ?? false;
  const quiet = job.options.quiet ?? false, user = job.options.user ?? true, signal = job.options.signal;
  const before = view;
  const commandScreen = state.screen === 'home' && (quickStart() || ['kingdown_create', 'kingdown_find'].includes(name)) ? 'play' : state.screen;
  // A read and a detachable write give way to a newer epoch, and a teardown stops every job. A sticky write keeps its
  // own pending and refusal while its epoch stays current.
  const late = () => queue.closed() || (job.sticky ? !!signal?.aborted : !queue.current(job) || (quiet && view !== before) || !!signal?.aborted);
  /** The pending this job set (or reused) in its retain branch, so a late reply settles only its own (design §1.2). */
  let own: Pending | undefined;
  /**
   * An older write settles its own pending (design §1.2): a success and a refusal clear it, and a failure keeps its
   * error for Retry. It never routes, selects a board, writes the screen or runs a continuation.
   */
  function settleLate(result?: ToolResult, message?: string) {
    if (job.kind !== 'write' || job.sticky || !own || pending !== own) return;
    const failure = message ?? (result?.isError && !REFUSALS.includes(resultCode(result)) ? resultText(result) : undefined);
    if (failure) { own.error = failure; own.error_screen = own.screen ?? state.screen; saveState(); return; }
    pending = undefined; saveState();
  }
  let followup: Pending | undefined, received: View | undefined, refused: { text: string; code: string; game?: string } | undefined;
  if (quiet) polling = true;
  const body = async (): Promise<Outcome> => {
    try {
      if (retain) {
        if (pending?.name !== name || pending.args !== args) pending = { name, args, ...(typeof args.game_id === 'string' && { game_tag: args.game_id.slice(0, 8) }), started_at: Date.now(), screen: commandScreen, ...(quickStart() && { quick: true }) };
        own = pending;
        pending.error = undefined; pending.error_screen = undefined; saveState();
      }
      let result: ToolResult | undefined;
      if (retry && pending) result = await resendPending(pending);
      result ??= await client.call(name, args, { signal, limit: !(name === 'kingdown_get' && mounting()) });
      // A mount's read of a game with a pending start recovers that start, as on owner-decisions (design §5.2).
      if (mounting() && name === 'kingdown_get' && pending && ['kingdown_create', 'kingdown_find'].includes(pending.name)) {
        const recovered = await resendPending(pending, result);
        if (recovered) { name = pending.name; retain = true; route = undefined; result = recovered; }
      }
      if (late()) { settleLate(result); return { status: 'superseded' }; }
      // A current selection reply selects the page's board; an older one leaves it (the epoch gate, design §1.2).
      const selected = result._meta?.board_id;
      if (!quiet && queue.current(job) && SELECTION_TOOLS.includes(name) && typeof selected === 'string') state.board_id = selected;
      const read = (result._meta as { view?: View } | undefined)?.view;
      if (name === 'kingdown_get' && read?.fen && !read.rules && rules?.game !== read.game_id) {
        result = await client.call('kingdown_get', {}, { signal, limit: !mounting() });
        if (late()) return { status: 'superseded' };
      }
      if (result.isError) {
        const text = resultText(result), code = resultCode(result);
        if (code === 'HANDLE_NEEDED') {
          // A retained command keeps pending with its error (design §2); a selection keeps its own continuation.
          if (retain) { pending ??= { name, args, ...(typeof args.game_id === 'string' && { game_tag: args.game_id.slice(0, 8) }), started_at: Date.now(), screen: commandScreen }; failPending(text); }
          if (queue.current(job)) navigate('handle');
          return { status: 'failed', code, text };
        }
        if (REFUSALS.includes(code)) {
          // A read never changes `pending`: a poll reply belongs to the read path below (design §4).
          if (!quiet) { pending = undefined; saveState(); if (retain) router.finishStart(); }
          // A command's refusal becomes the one notice; a read (Get or the poll) is never a refusal (design §3.2 and §4).
          if (!quiet && name !== 'kingdown_get') refused = { text, code, ...(typeof args.game_id === 'string' && { game: args.game_id }) };
        }
        throw new Error(text);
      }
      remember(result);
      // A good read clears the stale board, its error and Try again together.
      const next = (result._meta as { view?: View } | undefined)?.view;
      const goodRead = name === 'kingdown_get' || !!next, outage = goodRead && store.page().notice?.kind === 'read';
      if (quiet && next && next.game_id === view?.game_id && next.revision === view?.revision) {
        view = { ...view, opponent: next.opponent, rematch_allowed: next.rematch_allowed, server_now: next.server_now }; if (outage) drawBoard(view); store.dispatch({ type: 'good-read', game: next.game_id }); if (state.screen === 'seat') seatScreen(); poll?.update(); return { status: 'done', result, view };
      }
      show(next); received = next;
      if (name === 'kingdown_block') { memory.blockNotice = resultText(result); $('context-note').textContent = memory.blockNotice; }
      if (name === 'kingdown_get' && !quiet) { await games(() => queue.current(job)); if (late()) return { status: 'superseded' }; }
      // Save sends the waiting command again at once, so its old error and Retry go now.
      if (name === 'kingdown_handle') { followup = pending; if (followup) followup.error = followup.error_screen = undefined; if (queue.current(job)) navigate(followup?.screen ?? handleBack); }
      const resumedStart = retain && next ? router.finishStart(next) : false;
      // An older job never routes. A poll reply routes only between the game screens of the shown game (design §1.2).
      if (next && !resumedStart && queue.current(job) && (route ?? SELECTION_TOOLS.includes(name)) && (!quiet || POLL_SCREENS.includes(state.screen))) routeView(next);
      if (name === 'kingdown_invite' && queue.current(job)) { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
      // A reload preserves the command receipt; retry still uses its original ID.
      if (retain) pending = undefined;
      saveState();
      return { status: 'done', result, ...(received && { view: received }) };
    } catch (error) {
      const message = errorText(error);
      if (late()) { settleLate(undefined, message); return { status: 'superseded' }; }
      // A refusal shows only for a user command; a programmatic write (the computer move) stays silent, as before S2.
      if (refused) { if (user) store.dispatch({ type: 'refusal', text: refused.text, code: refused.code, ...(refused.game && { game: refused.game }) }); }
      // A poll timeout is silent; the third one in a row sets the read notice.
      else if (quiet && message === CANNOT_CONNECT) store.dispatch({ type: 'failed-poll', text: message, ...(view?.game_id && { game: view.game_id }) });
      else if (retain && pending) { failPending(message); store.dispatch({ type: 'change' }); }
      // Three failed polls in a row (or one failed foreground read) mark the board stale: "Not current", the lock and Try again.
      else if (name === 'kingdown_get' && state.board_id) store.dispatch({ type: 'failed-read', text: message, ...(view?.game_id && { game: view.game_id }) });
      else store.dispatch({ type: 'error', text: message });
      return refused ? { status: 'refused', code: refused.code, text: refused.text, result: EMPTY } : { status: 'failed', text: message };
    } finally { if (quiet) polling = false; }
  };
  const outcome = await body();
  if (name === 'kingdown_move' && received && received.kind !== 'solo') void games().then(() => { if (view) drawBoard(view); });
  // The rollback read is part of this job: it runs at once (not behind the lane it holds) and only while the job is
  // current, so a newer mount owns the page (design §2).
  if (retain && name === 'kingdown_move' && !received && !pending && queue.current(job) && before?.game_id === view?.game_id) { rollingBack = true; try { await rollbackBoardMove(); } finally { rollingBack = false; } }
  if (followup) void call(followup.name, followup.args, true, false, undefined, true);
  return outcome;
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
// A newer chat result makes a new epoch; the queue detaches the older reads and the older detachable writes, so only
// the newest mount reads and routes, and it does not wait for an older one (design §1.2 and §2).
app.ontoolresult = result => {
  const initial = awaitingInitialResult; awaitingInitialResult = false;
  const job = queue.chatResult(initial);
  // The lock shows at once: `mounting` is true from here, so every control stays off until the mount ends, also while
  // the mount waits for a selection or a settings read (design §2 and §3.3).
  store.sync();
  // render() unlocks the controls after the job settles: `mounting` stays true through the body (design §2).
  void queue.run(job, () => mountBody(job, result)).then(outcome => { if (outcome.status !== 'superseded') store.sync(); });
};
async function mountBody(job: Job, result: ToolResult) {
  const initial = job.options.initial === true;
  // A newer chat result detaches this job; every write below stops at the next wait.
  const stale = () => !queue.current(job);
  try {
    await connection;
    if (stale()) return;
    const value = result.structuredContent as Record<string, unknown> | undefined, board = result._meta?.board_id;
    if (!initial || !state.board_id) state.board_id = typeof board === 'string' ? board : typeof value?.game_id === 'string' ? state.board_id : undefined;
    remember(result);
    if (initial || !memory.settings || !memory.me) {
      const settings = await client.call('kingdown_settings', {}, { limit: false });
      if (stale()) return;
      if (settings.isError) throw new Error(resultText(settings));
      remember(settings); await applySettings();
    }
    if (stale()) return;
    if (result.isError) {
      memory.preview = undefined;
      memory.joinError = { code: resultCode(result), message: resultText(result) };
      view = undefined; navigate('join');
      const home = await client.call('kingdown_open', {}, { limit: false });
      if (stale()) return;
      if (home.isError) throw new Error(resultText(home));
      // The empty Open gives this board its own board; the mount keeps it (design §1.2, the mount selects the board).
      state.board_id = (home._meta?.board_id as string | undefined) ?? state.board_id;
      remember(home); saveState(); return;
    }
    if (!initial && value?.screen === 'home') openHallOnExpand = false;
    if (value?.screen === 'join') { memory.preview = result._meta?.preview as JoinPreview | undefined; memory.code = memory.preview?.code ?? ''; memory.joinError = undefined; }
    if (value && ['home', 'play', 'board', 'profile', 'join'].includes(String(value.screen)) && (!initial || !savedScreen)) navigate(value.screen === 'home' && initial && !savedScreen && displayMode === 'fullscreen' ? 'play' : value.screen as Screen);
    // A game with no board gets its own new board, so mounts never race on one server board; only a current mount takes it.
    if (typeof value?.game_id === 'string' && !board && (!initial || !state.board_id)) {
      const selected = await client.call('kingdown_open', { game_id: value.game_id }, { limit: false, background: true });
      if (stale()) return;
      if (selected.isError) throw new Error(resultText(selected));
      state.board_id = selected._meta?.board_id as string | undefined; remember(selected);
    }
    // A saved game follows its status. Keep its pending command on its screen unless the game ends.
    const savedGame = !!(initial && savedScreen && GAME_SCREENS.includes(queuedAtStart ?? savedScreen));
    const route = initial && savedScreen ? savedGame && !pending : value?.screen === undefined || value.screen === 'board';
    const readBoard = state.board_id && (typeof value?.game_id === 'string' || initial && savedScreen);
    // The board read waits for an idle lane, so it never reads through a write in flight (design §2, R6).
    if (readBoard) {
      const next = await call('kingdown_get', {}, false, false, route, false);
      if (stale()) return;
      if (savedGame && !route && next && (next.status === 'finished' || next.status === 'aborted')) routeView(next);
    } else if (!result._meta?.view) {
      view = undefined;
      // A game return screen needs a view; a chat result with no route leaves the hall as its return screen.
      if (resume && GAME_SCREENS.includes(resume)) navigate('play');
    }
    if (!readBoard) await games(() => queue.current(job));
    if (stale()) return;
    saveState();
  } catch (error) { if (!stale()) store.dispatch({ type: 'error', text: errorText(error) }); }
  finally {
    // A stale mount leaves the page to the newer mount, which still reads or has finished.
    if (!stale()) {
      // A command that was in flight when the host remounted the widget has no reply here. The page selects Retry for the
      // player: Retry reads first, then sends the same command ID, and each screen keeps its own Retry steps (New game
      // finishes a start). The error and Retry show only if that send fails (owner item W6 a). A start that waits for a
      // name keeps its error and is not sent (R4C-3). A command still in flight on this page (a chat result came during
      // it) gets its own reply.
      // A command still in flight on this page (a chat result came during it) gets its own reply: its body has not
      // ended, so this mount does not resend it (design §5.3). A write that holds no lane can still be in flight.
      const resend = !!pending && !pending.error && !queue.inflight();
      if (resend && !connected) failPending(CANNOT_CONNECT);
      if (state.screen in screens) screens[state.screen as keyof typeof screens]();
      poll?.update();
      // A pending command with no error was in flight at the teardown: send it once, with no text (W6 a). The queue
      // owns this resend at S5; here it sends the same command directly, because a silent send leaves Retry hidden.
      if (resend && connected && pending) void call(pending.name, pending.args, true, false, undefined, true);
    }
  }
}
/**
 * The one poll's target (design §4): the page board on a human game screen, the rematch watch on End, the list on the
 * lobby, else the watch of a waiting human game during a solo game.
 */
function pollTarget(): PollTarget | undefined {
  if (state.screen === 'end') return endPoll();
  if (state.screen === 'lobby') return lobbyPoll();
  if (!['friend', 'wait', 'seat', 'board'].includes(state.screen)) return waitPoll();
  return (view?.kind === 'solo' && waitPoll()) || { view, read: async () => {
    if (!state.board_id) return;
    await call('kingdown_get', { ...(view?.fen ? { since_revision: view.revision } : {}) }, false, true, !savedScreen || !!view && ['friend', 'wait', 'seat', 'board'].includes(state.screen));
    // kingdown_get is read-only; this write lets the opponent see the player online.
    if (view && Date.now() - seenAt >= 30_000) { seenAt = Date.now(); void client.call('kingdown_seen', { game_id: view.game_id }).catch(() => {}); }
  } };
}
export const pollUpdate = () => poll?.update();
app.onclose = () => { connected = false; poll?.stop(); router.finishStart(); queue.close(); };
app.onteardown = async () => { connected = false; poll?.stop(); router.finishStart(); saveState(); queue.close(); return {}; };
const connection = app.connect().then(() => {
  connected = true; store.dispatch({ type: 'connected' });
  const context = app.getHostContext(); hostContext(context);
  // A saved route waits behind the home card while the host stays inline.
  if (queuedAtStart && state.screen === 'home') navigate(queuedAtStart);
  if (state.screen !== 'home' && displayMode === 'inline') { const screen = state.screen; if (canFullscreen()) navigate('home'); navigate(screen); }
  poll = runPoll(pollTarget, () => connected && !awaitingInitialResult && !mounting() && !queue.closed() && !queue.writing());
}).catch(error => { store.dispatch({ type: 'connect', text: `Could not connect to the game: ${errorText(error)}` }); });

// Inline routes wait behind the home card. Only a button requests fullscreen.
const GAME_SCREENS: Screen[] = ['seat', 'board', 'wait', 'friend', 'end'];
let displayMode: string = 'inline', asking = false, collapsed = false, resume: Screen | undefined, target: Screen | undefined, gamesFirst = false, openHallOnExpand = !savedScreen;
const canFullscreen = () => app.getHostContext()?.availableDisplayModes?.includes('fullscreen') ?? true;
/** The widget state keeps the waiting screen only while it waits. */
function unqueue() { target = undefined; delete state.queued; }
/** Asks for fullscreen, then shows the last screen asked for (the home card stays until the host answers). A refusal gives back the screen that Play returns to. */
async function fullscreen(screen: Screen, back?: Screen) {
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
  if (!newGameFirst || state.screen !== 'play' || gamesDirty || mounting()) return;
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
  if (screen === 'home' && !mounting()) openHallOnExpand = false;
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
  if (!mounting() && screen in screens) screens[screen as keyof typeof screens]();
  client.save(); poll?.update();
  if (['home', 'play'].includes(screen) && !mounting()) {
    if (gamesDirty) void games(); else if (screen === 'play') renderGameRows();
  }
  if (screen === 'play') scrollNewGame();
  if (screen === 'play' && gamesFirst) { gamesFirst = false; $('games-list').closest<HTMLElement>('.new-game-body')!.scrollTop = 0; }
  if (screen === 'settings') void applySettings();
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
/** A mount passes its gate: a newer chat result detaches the old mount, so its late list writes nothing (design §1.2). */
async function games(gate?: () => boolean) {
  $('games-status').textContent = 'Loading games…';
  try {
    const result = await client.call('kingdown_games');
    if (gate && !gate()) return;
    if (result.isError) throw new Error(resultText(result));
    const entries = (result._meta as { games?: InboxEntry[] } | undefined)?.games ?? [];
    renderGames(entries);
  } catch (error) { if (!gate || gate()) $('games-status').textContent = errorText(error); }
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
  const label = (id: string, symbol: string, text: string, detail = '') => {
    const span = document.createElement('span'); span.textContent = text;
    if (detail) { const small = document.createElement('small'); small.textContent = detail; span.append(' ', small); }
    const html = `<svg class="icon" aria-hidden="true"><use href="#i-${symbol}"/></svg>${span.outerHTML}`;
    if ($(id).innerHTML !== html) $(id).innerHTML = html;
  };
  label('home-play', back ? 'continue' : 'play', back ? 'Resume' : 'Play now', back && game ? `${game.status === 'waiting' ? waitingLine(game) : game.opponent?.computer ? 'Computer' : gameTitle(game)}${turn}` : '');
  label('home-games', 'guide', memory.games.length ? `Your games (${memory.games.length})` : 'Choose a game');
}
// Spec J2, D2: Play now asks for fullscreen on the tap and opens the board when the game exists.
function homePlayNow() { collapsed = false; resume = undefined; void fullscreen('home'); playNow(); }
$('home-play').onclick = () => {
  const game = homeGame();
  if (resume && resume !== 'play') { const next = resume; collapsed = false; resume = undefined; void fullscreen(next); }
  else if (game) { collapsed = false; void fullscreen('home'); void call(state.board_id ? 'kingdown_resume' : 'kingdown_open', { game_id: game.game_id }); }
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
  onlineChoices().forEach(input => { input.checked = input.value === memory.settings!.online_visible_to; });
  await setSettings(memory.settings);
}
async function saveSetting(change: Record<string, unknown>) {
  const focused = document.activeElement as HTMLElement | null;
  let moved = false;
  const changedFocus = () => { moved = true; };
  document.addEventListener('focusin', changedFocus);
  document.addEventListener('pointerdown', changedFocus);
  for (const [id] of TOGGLES) $<HTMLInputElement>(id).disabled = true;
  onlineChoices().forEach(input => { input.disabled = true; });
  try {
    const result = await client.call('kingdown_settings', change);
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    remember(result);
  } catch (error) { store.dispatch({ type: 'error', text: errorText(error) }); }
  await applySettings();
  document.removeEventListener('focusin', changedFocus);
  document.removeEventListener('pointerdown', changedFocus);
  if (!moved && state.screen === 'settings' && document.activeElement === document.body) focused?.focus({ preventScroll: true });
}
for (const [id, key] of TOGGLES) $<HTMLInputElement>(id).onchange = () => void saveSetting({ [key]: $<HTMLInputElement>(id).checked });
onlineChoices().forEach(input => { input.onchange = () => void saveSetting({ online_visible_to: input.value }); });
