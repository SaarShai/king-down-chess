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
import { applyLocks, createStore, isStart, isStartStep, locks, messageLine } from './state';
import { createQueue, EMPTY, REFUSALS, resultCode, resultText, type Job, type JobOptions, type Kind, type Outcome } from './queue';
import { draftFromGame, finishStart, playNow, setupBusy, setupScreen, setupStarting, setupSync } from './screens/setup';
import { readSetup } from './screens/setup-model';
import { finishCancel, friendScreen } from './screens/friend';
import { joinScreen, joinSync } from './screens/join';
import { finishComputer, finishHandoff, waitPoll, waitScreen, waitSync } from './screens/wait';
import { lobbyPoll, lobbyScreen, lobbySync } from './screens/lobby';
import { finishSeat, seatScreen, seatSync } from './screens/seat';
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
let handleBack: Screen = state.pending?.screen ?? 'settings';
// The one command lane and the one epoch gate (design §1.2 and §2, ticket 19 S3).
export const queue = createQueue();
// The pre-mount window counts as mounting too, so every control stays off until the first mount ends (design §3.3).
const mounting = () => queue.mounting() || awaitingInitialResult;
// The refused move's rollback read is part of its own job, so it never waits for the lane that job holds (design §2).
let rollingBack = false;
// One state slot: the notice, the scoped locks and the message line (design §1 and §3).
export const store = createStore({
  page: () => ({ screen: state.screen, pending: state.pending, view, connected, mounting: mounting(), writing: queue.writing(), settings: !!memory.settings, handle_back: handleBack, settings_back: state.settings_back }),
  call,
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
const router = createRouter(call, navigate, next => {
  if (!show(next)) return false;
  if (next.status === 'aborted' && next.kind === 'solo' && next.result?.reason === 'abort') { draftFromGame(next); newGameFirst = true; }
  return true;
});
export const { routeView, start } = router;
const screens = { play: setupScreen, friend: friendScreen, join: joinScreen, wait: waitScreen, lobby: lobbyScreen, seat: seatScreen, end: endScreen, profile: profileScreen, collection: collectionScreen };
export const memory = { kind: 'solo' as 'solo' | 'friend' | 'random', code: '', blockNotice: '', settings: undefined as PlayerSettings | undefined, me: undefined as { handle: string | null; icon: Icon | null } | undefined, games: [] as InboxEntry[], preview: undefined as JoinPreview | undefined, joinError: undefined as { code: string; message: string } | undefined, get view() { return view; } };
/** A command's error stays on the screen where the command started, so its Retry shows there, also after the player leaves. */
function failPending(message: string, command = state.pending!, origin?: Job) {
  command.error = message; command.error_screen = command.screen ?? state.screen; client.save();
  if ((!origin || queue.current(origin)) && state.screen === 'home' && command.screen === 'play') navigate('play');
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
  for (const id of ['setup-start', 'hall-play', 'games-start', 'wait-computer']) $<HTMLButtonElement>(id).disabled = lock.start || setupStarting();
  $<HTMLInputElement>('join-code').disabled = lock.blocked;
  $<HTMLInputElement>('handle').disabled = lock.blocked;
  homeActions();
  for (const [id] of TOGGLES) $<HTMLInputElement>(id).disabled = lock.blocked || !memory.settings;
  onlineChoices().forEach(input => { input.disabled = lock.blocked || !memory.settings; });
}
/** A reply can reach its caller before the full read supplies the rules for drawing. */
function acceptsView(next: View | undefined, job?: Job): next is View {
  if (!next || job && !queue.current(job) && next.game_id !== view?.game_id) return false;
  if (next.game_id === view?.game_id && next.revision < view.revision) return false;
  return true;
}
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined, job?: Job) {
  if (!acceptsView(next, job)) return false;
  const before = view;
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (next.fen && rules?.game !== next.game_id) return false;
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
  client.save();
  // Widget state also supplies model context; a second writer would replace it.
  if (!extension?.setWidgetState) void app.updateModelContext({ structuredContent: { status: view.status, your_turn: view.turn === view.seat } }).catch(() => {});
  return true;
}
/** Resolve the saved command's game before its send and refusal use the input. */
function resend(command: Pending): Record<string, unknown> {
  if (isStart(command)) return command.args;
  const game = typeof command.args.game_id === 'string' ? command.args.game_id
    : command.game_tag && view?.game_id.startsWith(command.game_tag) ? view.game_id : undefined;
  if (!game) throw new Error(CANNOT_CONNECT);
  return { ...command.args, game_id: game };
}
/**
 * The continuation of a resent command (design §5.2): the step that its first caller would have run after it. A start
 * or a setup step finishes the start, a Seat command finishes Seat, the computer handoff keeps its Create and
 * Choose steps, and a friend Cancel goes to Play. Each other command routes as its reply says. It replaces the waiting start and the Retry capture listeners.
 */
function continuation(command: Pending): ((next: View, origin: Job) => Promise<unknown>) | undefined {
  if (command.screen === 'wait' && command.name === 'kingdown_create') return finishComputer;
  if (isStartStep(command)) return (next, origin) => finishStart(next, origin, command.king ?? null, { screen: command.screen, quick: !!command.quick });
  if (command.screen === 'seat') return finishSeat;
  if (command.screen === 'wait' && command.name === 'kingdown_choose') return finishHandoff;
  if (command.screen === 'friend' && command.name === 'kingdown_abort') return finishCancel;
}
/** The tools that change no game and no account: they run as reads, beside the lane (design §2). */
export const READ_TOOLS = ['kingdown_get', 'kingdown_games', 'kingdown_lobby', 'kingdown_profile'];
/** The screens a poll reply may route between; a poll never leaves a screen the player opened (design §1.2, R3b). */
const POLL_SCREENS: Screen[] = ['friend', 'wait', 'seat', 'board'];

/** One queue job for one call: a write takes the lane, a read runs beside it (design §2). */
export function send(name: string, args: Record<string, unknown>, options: JobOptions = {}): Promise<Outcome> {
  if (queue.closed() || options.origin && !queue.current(options.origin)) return Promise.resolve({ status: 'superseded' });
  // One poll reads at a time, as the single `polling` flag did on owner-decisions.
  if (options.quiet && polling) return Promise.resolve({ status: 'superseded' });
  const kind: Kind = options.quiet || READ_TOOLS.includes(name) ? 'read' : 'write';
  // A read of the page board waits for an idle lane, so it never reads through a write in flight (design §2, R6).
  // The refused move's rollback read is part of that move's own job, so it runs at once.
  const board = kind === 'read' && name === 'kingdown_get' && args.game_id === undefined && args.board_id === undefined && !!state.board_id && !rollingBack;
  // A resend runs its continuation after the lane is free, and only while its job is current; the continuation routes.
  const then = options.then ?? (options.retry && options.retain && state.pending ? continuation(state.pending) : undefined);
  const job = queue.command(kind, name, args, { ...options, board, ...(rollingBack && { user: false }), ...(then && { route: false }) });
  const started = queue.run(job, current => perform(current, name, args));
  // A write locks the page at once, so the board shows its own locked words ("Sending…") while the send waits.
  if (!options.quiet && kind === 'write') store.dispatch({ type: options.retain ? 'command' : 'change' });
  return started.then(async outcome => {
    if (!options.quiet && !queue.closed()) store.dispatch({ type: 'change' });
    if (!queue.current(job)) return { status: 'superseded' };
    if (then && outcome.status === 'done' && outcome.view && queue.current(job)) await then(outcome.view as View, job);
    return outcome;
  });
}
// `user` is true when a user command starts the call. A programmatic write (the computer move) is not a user command,
// so its refusal never becomes the page's one notice (design §1.2 and §2).
export async function call(name: string, args: Record<string, unknown>, retain: boolean | JobOptions = false, quiet = false, route: boolean | undefined = undefined, retry = false, signal?: AbortSignal, user = true) {
  const options = typeof retain === 'boolean' ? { retain, quiet, route, retry, signal, user } : retain;
  const outcome = await send(name, args, options);
  if (options.origin && !queue.current(options.origin)) return;
  return outcome.status === 'done' || outcome.status === 'refused' ? outcome.view as View | undefined : undefined;
}
/** The body of one job (design §1.2 and §2). Its epoch gate stops each write when a newer job is current. */
async function perform(job: Job, initialName: string, initialArgs: Record<string, unknown>): Promise<Outcome> {
  let name = initialName, args = initialArgs;
  let retain = job.options.retain ?? false, route = job.options.route, retry = job.options.retry ?? false;
  const quiet = job.options.quiet ?? false, user = job.options.user ?? true, signal = job.options.signal;
  const before = view;
  const game = typeof args.game_id === 'string' ? args.game_id : name === 'kingdown_get' ? view?.game_id : undefined;
  const commandScreen = job.options.screen ?? (state.screen === 'home' && ['kingdown_create', 'kingdown_find'].includes(name) ? 'play' : state.screen);
  // A read and a detachable write give way to a newer epoch, and a teardown stops every job. A sticky write keeps its
  // own state.pending and refusal while its epoch stays current.
  const late = () => queue.closed() || (job.sticky ? !!signal?.aborted : !queue.current(job) || (quiet && view !== before) || !!signal?.aborted);
  /** The state.pending this job set (or reused) in its retain branch, so a late reply settles only its own (design §1.2). */
  let own: Pending | undefined;
  /**
   * An older retained step settles its own state.pending: a success and a refusal clear it, and a failure keeps its
   * error for Retry. It never routes, selects a board, writes the screen or runs a continuation.
   */
  function settleLate(result?: ToolResult, message?: string) {
    if (queue.closed() || job.sticky || !own || state.pending !== own) return;
    const failure = message ?? (result?.isError && !REFUSALS.includes(resultCode(result)) ? resultText(result) : undefined);
    if (failure) { own.error = failure; own.error_screen = own.screen ?? state.screen; client.save(); }
    else { state.pending = undefined; client.save(); }
    // A detachable write settles at the detach, so the caller's own render is already done: the older write renders
    // the state.pending change it owns here, else a cleared state.pending leaves the page locked (design §1.2 rule 1).
    store.sync();
  }
  let followup: Pending | undefined, received: View | undefined, refused: { text: string; code: string; game?: string } | undefined;
  if (quiet) polling = true;
  const body = async (): Promise<Outcome> => {
    try {
      if (retain) {
        if (state.pending?.name !== name || state.pending.args !== args) state.pending = { name, args, ...(game && { game_tag: game.slice(0, 8) }), screen: commandScreen, ...(job.options.quick && { quick: true }), ...(job.options.king !== undefined && { king: job.options.king }) };
        own = state.pending;
        state.pending.error = undefined; state.pending.error_screen = undefined; client.save();
      }
      const transport = { signal, ...(job.options.mount && { limit: false }) };
      // A failed mount keeps the start until Settings can supply the saved choice.
      if (own && isStartStep(own)) {
        if (!memory.settings) {
          const settings = await client.call('kingdown_settings', {}, transport);
          if (late()) { settleLate(undefined, CANNOT_CONNECT); return { status: 'superseded' }; }
          if (settings.isError) throw new Error(resultText(settings));
          remember(settings, job);
        }
        if (own.king === undefined) { own.king = readSetup(memory.settings?.last_setup).king; client.save(); }
      }
      // Retry sends the same command again, from its receipt (design §5.3), with no clock compare.
      if (retry && state.pending) args = resend(state.pending);
      let result = await client.call(name, args, transport);
      if (late()) { settleLate(result); return { status: 'superseded' }; }
      // A current selection reply selects the page's board; an older one leaves it (the epoch gate, design §1.2).
      const selected = result._meta?.board_id;
      if (!quiet && queue.current(job) && SELECTION_TOOLS.includes(name) && typeof selected === 'string') state.board_id = selected;
      const read = (result._meta as { view?: View } | undefined)?.view;
      if (name === 'kingdown_get' && read?.fen && !read.rules && rules?.game !== read.game_id) {
        result = await client.call('kingdown_get', {}, transport);
        if (late()) { settleLate(result); return { status: 'superseded' }; }
      }
      if (result.isError) {
        const text = resultText(result), code = resultCode(result);
        if (code === 'HANDLE_NEEDED') {
          // A retained command keeps state.pending with its error (design §2); a selection keeps its own continuation.
          if (own && state.pending === own) failPending(text, own, job);
          if (queue.current(job)) navigate('handle');
          return { status: 'failed', code, text };
        }
        if (REFUSALS.includes(code)) {
          // A read never changes `state.pending`: a poll reply belongs to the read path below (design §4).
          if (own && state.pending === own) { state.pending = undefined; client.save(); }
          // A command's refusal becomes the one notice; a read (Get or the poll) is never a refusal (design §3.2 and §4).
          if (!quiet && name !== 'kingdown_get') refused = { text, code, ...(typeof args.game_id === 'string' && { game: args.game_id }) };
        }
        throw new Error(text);
      }
      remember(result, job);
      // A good read clears the stale board, its error and Try again together.
      const next = (result._meta as { view?: View } | undefined)?.view;
      const goodRead = name === 'kingdown_get' || !!next, outage = goodRead && store.page().notice?.kind === 'read';
      if (quiet && next && next.game_id === view?.game_id && next.revision === view?.revision) {
        view = { ...view, opponent: next.opponent, rematch_allowed: next.rematch_allowed, server_now: next.server_now }; if (outage) drawBoard(view); store.dispatch({ type: 'good-read', game: next.game_id }); if (state.screen === 'seat') seatScreen(); poll?.update(); return { status: 'done', result, view };
      }
      if (acceptsView(next, job)) received = next;
      const shown = show(received, job);
      if (!next && name === 'kingdown_get') store.dispatch({ type: 'good-read', game });
      if (name === 'kingdown_block' && shown) { memory.blockNotice = resultText(result); $('context-note').textContent = memory.blockNotice; }
      if (name === 'kingdown_get' && !quiet) { await games(job); if (late()) { settleLate(result); return { status: 'superseded' }; } }
      // Save sends the waiting command again at once, so its old error and Retry go now.
      if (name === 'kingdown_handle' && queue.current(job)) { followup = state.pending; if (followup) followup.error = followup.error_screen = undefined; if (queue.current(job)) navigate(followup?.screen ?? handleBack); }
      // An older job never routes. A poll reply routes only between the game screens of the shown game (design §1.2).
      if (shown && received && queue.current(job) && (route ?? SELECTION_TOOLS.includes(name)) && (!quiet || POLL_SCREENS.includes(state.screen))) routeView(received);
      if (name === 'kingdown_invite' && queue.current(job)) { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
      // A reload preserves the command receipt; retry still uses its original ID.
      if (retain) state.pending = undefined;
      client.save();
      return { status: 'done', result, ...(received && { view: received }) };
    } catch (error) {
      const message = errorText(error);
      if (late()) { settleLate(undefined, message); return { status: 'superseded' }; }
      // A refusal shows only for a user command; a programmatic write (the computer move) stays silent, as before S2.
      // Join shows its own sentence for a refused code on the join screen, so its refusal is never the page notice.
      if (refused) { if (user && name !== 'kingdown_join') store.dispatch({ type: 'refusal', text: refused.text, code: refused.code, ...(refused.game && { game: refused.game }) }); }
      // A poll timeout is silent; the third one in a row sets the read notice.
      else if (quiet && message === CANNOT_CONNECT) store.dispatch({ type: 'failed-poll', text: message, ...(view?.game_id && { game: view.game_id }) });
      else if (own && state.pending === own) { failPending(message, own, job); store.dispatch({ type: 'change' }); }
      // Three failed polls in a row (or one failed foreground read) mark the board stale: "Not current", the lock and Try again.
      else if (name === 'kingdown_get' && state.board_id) store.dispatch({ type: 'failed-read', text: message, ...(view?.game_id && { game: view.game_id }) });
      else if (queue.current(job) && state.screen === commandScreen) store.dispatch({ type: 'error', text: message });
      return refused ? { status: 'refused', code: refused.code, text: refused.text, result: EMPTY } : { status: 'failed', text: message };
    } finally { if (quiet) polling = false; }
  };
  const outcome = await body();
  if (name === 'kingdown_move' && received && received.kind !== 'solo') void games(job).then(current => { if (current && queue.current(job) && view) drawBoard(view); });
  // The rollback read is part of this job: it runs at once (not behind the lane it holds) and only while the job is
  // current, so a newer mount owns the page (design §2). The refusal code reaches the board: INVALID_MOVE drops a
  // draft turn, and the other codes re-read while the redraw keeps or drops it (W7 ticket 04).
  if (retain && name === 'kingdown_move' && !received && !state.pending && queue.current(job) && before?.game_id === view?.game_id) { rollingBack = true; try { await rollbackBoardMove(refused?.code); } finally { rollingBack = false; } }
  if (followup) void call(followup.name, followup.args, { retain: true, retry: true, origin: job });
  return outcome;
}
$('reload').onclick = () => { if (state.board_id) void call('kingdown_get', {}); };
// One Retry handler runs the shown action (design §3.2): it connects, reads, or sends the same command.
$('retry').onclick = () => {
  const action = messageLine(store.page()).action;
  if (action === 'connect') location.reload();
  else if (action === 'try-again') { if (state.board_id) void call('kingdown_get', {}, false, false, true); }
  // Retry sends the state.pending command again; its continuation finishes what the command started (design §5.2 and §5.3).
  else if (state.pending) void call(state.pending.name, state.pending.args, true, false, undefined, true);
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
function remember(result: ToolResult, job?: Job) {
  if (result._meta?.settings) memory.settings = result._meta.settings as PlayerSettings;
  if (result._meta?.me) {
    const me = result._meta.me as NonNullable<typeof memory.me>, before = memory.me; memory.me = me;
    if (me.handle !== before?.handle || me.icon !== before?.icon) renderIdentity();
  }
  if (job && !queue.current(job)) return;
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
      remember(home); client.save(); return;
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
    // A saved game follows its status. Keep its state.pending command on its screen unless the game ends.
    const savedGame = !!(initial && savedScreen && GAME_SCREENS.includes(queuedAtStart ?? savedScreen));
    const route = initial && savedScreen ? savedGame && !state.pending : value?.screen === undefined || value.screen === 'board';
    const readBoard = state.board_id && (typeof value?.game_id === 'string' || initial && savedScreen);
    // The board read waits for an idle lane, so it never reads through a write in flight (design §2, R6).
    if (readBoard) {
      const next = await call('kingdown_get', {}, { route, origin: job, mount: true, user: false });
      if (stale()) return;
      if (savedGame && !route && next && (next.status === 'finished' || next.status === 'aborted')) routeView(next);
    } else if (!result._meta?.view) {
      view = undefined;
      // A game return screen needs a view; a chat result with no route leaves the hall as its return screen.
      if (resume && GAME_SCREENS.includes(resume)) navigate('play');
    }
    if (!readBoard) await games(job);
    if (stale()) return;
    client.save();
  } catch (error) {
    if (!stale()) {
      if (!memory.settings && state.pending && isStartStep(state.pending) && !queue.inflight()) failPending(errorText(error), state.pending, job);
      else store.dispatch({ type: 'error', text: errorText(error) });
    }
  }
  finally {
    // A stale mount leaves the page to the newer mount, which still reads or has finished.
    if (!stale()) {
      // A command still in flight on this page (a chat result came during it) gets its own reply: its body has not
      // ended, so this mount does not resend it (design §5.3). A write that holds no lane can still be in flight.
      const resend = !!state.pending && !state.pending.error && !queue.inflight();
      if (resend && !connected) failPending(CANNOT_CONNECT);
      if (state.screen in screens) screens[state.screen as keyof typeof screens]();
      poll?.update();
      // A state.pending command with no error was in flight at the teardown: send it once, with no text (W6 a). Its
      // continuation finishes the step; the text and Retry show only if this send fails.
      if (resend && connected && state.pending) void call(state.pending.name, state.pending.args, true, false, undefined, true);
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
    const board = state.board_id, game = view?.game_id, epoch = queue.epoch();
    const next = await call('kingdown_get', { ...(view?.fen ? { since_revision: view.revision } : {}) }, false, true, !savedScreen || !!view && POLL_SCREENS.includes(state.screen));
    if (!next || queue.closed() || queue.epoch() !== epoch || state.board_id !== board || view?.game_id !== game || !POLL_SCREENS.includes(state.screen)) return;
    // kingdown_get is read-only; this write lets the opponent see the player online.
    if (view && Date.now() - seenAt >= 30_000) { seenAt = Date.now(); void client.call('kingdown_seen', { game_id: view.game_id }).catch(() => {}); }
  } };
}
export const pollUpdate = () => poll?.update();
app.onclose = () => { connected = false; poll?.stop(); stopHandleCheck(); queue.close(); };
app.onteardown = async () => { connected = false; poll?.stop(); stopHandleCheck(); client.save(); queue.close(); return {}; };
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
/** `queued` is the screen that waits behind the home card; it is set before the page syncs, so its memory stays. */
export function navigate(screen: Screen, queued?: Screen) {
  if (screen !== 'home' && displayMode === 'inline' && canFullscreen()) {
    resume = state.queued = screen; if (asking) target = screen; client.save(); return;
  }
  unqueue();
  resume = queued; if (queued) state.queued = queued;
  if (screen === 'home' && !mounting()) openHallOnExpand = false;
  // Home goes to the name screen only by Resume, and the name screen then keeps the Back screen from before the collapse.
  if (screen === 'handle' && !['handle','home'].includes(state.screen)) handleBack = state.screen === 'settings' ? 'settings' : state.pending?.screen ?? state.screen;
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
  if (screen === 'handle') scheduleHandleCheck(); else stopHandleCheck();
}
function hostContext(context: McpUiHostContext | undefined) {
  if (!context) return;
  document.body.dataset.theme = context.theme ?? 'light';
  document.body.dataset.touch = String(context.deviceCapabilities?.touch ?? false);
  for (const edge of ['top', 'right', 'bottom', 'left'] as const) document.documentElement.style.setProperty(`--safe-${edge}`, `${Math.max(0, context.safeAreaInsets?.[edge] ?? 0)}px`);
  if (context.displayMode === 'inline' && displayMode === 'fullscreen' && state.screen !== 'home' && canFullscreen()) {
    const screen = state.screen;
    displayMode = 'inline'; navigate('home', screen); collapsed = true; store.sync();
  }
  const showHall = context.displayMode === 'fullscreen' && openHallOnExpand;
  if (context.displayMode) displayMode = context.displayMode;
  if (displayMode === 'fullscreen') openHallOnExpand = false;
  if (displayMode === 'fullscreen' && resume && !asking) { const screen = resume; resume = undefined; collapsed = false; navigate(screen); }
  else if (showHall && state.screen === 'home' && !asking) navigate('play');
}
let listRead = 0;
/** Only the newest list read in the current epoch can write its result. */
async function games(origin?: Job) {
  if (queue.closed() || origin && !queue.current(origin)) return false;
  const job = queue.command('read', 'kingdown_games', {}, { user: false, origin });
  const read = ++listRead, current = () => read === listRead && queue.current(job);
  $('games-status').textContent = 'Loading games…';
  const outcome = await queue.run(job, async () => {
    try {
      const result = await client.call('kingdown_games', {}, { ...(origin?.options.mount && { limit: false }) });
      if (!current()) return { status: 'superseded' };
      if (result.isError) throw new Error(resultText(result));
      renderGames((result._meta?.games as InboxEntry[] | undefined) ?? []);
      return { status: 'done', result };
    } catch (error) {
      if (!current()) return { status: 'superseded' };
      const text = errorText(error); $('games-status').textContent = text;
      return { status: 'failed', text };
    }
  });
  return outcome.status === 'done' && current();
}
let picture: Icon = 'spirit';
document.querySelectorAll<HTMLImageElement>('[data-art]').forEach(img => { img.src = art(img.dataset.art!); });
$('presets').replaceChildren(...Object.entries(ICONS).map(([key, path]) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'preset'; button.setAttribute('aria-label', key); button.setAttribute('aria-pressed', String(key === picture));
  const portrait = document.createElement('span'); portrait.className = 'portrait'; const image = document.createElement('img'); image.src = art(path); image.alt = ''; portrait.append(image); button.append(portrait);
  button.onclick = () => { picture = key as Icon; $('presets').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); }; return button;
}));
let handleCheck = 0, handleTimer: ReturnType<typeof setTimeout> | undefined;
function stopHandleCheck() { clearTimeout(handleTimer); handleCheck++; }
function renderIdentity() {
  if (!memory.me) return;
  $('me-handle').textContent = memory.me.handle ?? 'Choose a name';
  $<HTMLImageElement>('me-picture').src = art(ICONS[memory.me.icon ?? 'spirit']);
  $<HTMLInputElement>('handle').value = memory.me.handle ?? ''; picture = memory.me.icon ?? 'spirit';
  $('presets').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute('aria-label') === picture)));
  if (state.screen === 'handle') scheduleHandleCheck();
}
function scheduleHandleCheck() {
  if (queue.closed()) return;
  clearTimeout(handleTimer); const check = ++handleCheck, input = $<HTMLInputElement>('handle'), handle = input.value.trim().toLowerCase();
  input.setCustomValidity(''); $('handle-free').hidden = true; $('handle-check-error').textContent = '';
  if (!handle) return;
  handleTimer = setTimeout(async () => {
    if (queue.closed() || check !== handleCheck) return;
    try {
      const result = await client.call('kingdown_handle', { handle, check: true });
      if (queue.closed() || check !== handleCheck) return;
      if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
      $('handle-free').hidden = (result.structuredContent as { available?: boolean } | undefined)?.available !== true;
    } catch (error) { if (!queue.closed() && check === handleCheck) $('handle-check-error').textContent = errorText(error); }
  }, 250);
}
$('handle-form').onsubmit = event => {
  event.preventDefault(); stopHandleCheck();
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
  const origin = queue.command('write', 'kingdown_settings', change);
  const focused = document.activeElement as HTMLElement | null;
  let moved = false;
  const changedFocus = () => { moved = true; };
  document.addEventListener('focusin', changedFocus);
  document.addEventListener('pointerdown', changedFocus);
  try {
    await send('kingdown_settings', change, { origin });
    if (!queue.current(origin)) return;
    await applySettings();
    if (queue.current(origin) && !moved && state.screen === 'settings' && document.activeElement === document.body) focused?.focus({ preventScroll: true });
  } finally {
    document.removeEventListener('focusin', changedFocus);
    document.removeEventListener('pointerdown', changedFocus);
  }
}
for (const [id, key] of TOGGLES) $<HTMLInputElement>(id).onchange = () => void saveSetting({ [key]: $<HTMLInputElement>(id).checked });
onlineChoices().forEach(input => { input.onchange = () => void saveSetting({ online_visible_to: input.value }); });
