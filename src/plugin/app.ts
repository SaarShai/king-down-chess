import { App, type McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { PaintedView } from '../render/PaintedView';
import { fromFen, toLan } from '../rules/setup';
import { colorOf, findKing, inCheck, legalMoves, moveNumber, nameOf, typeOf, setRules, sqName, type Move, type Position } from '../rules/engine';
import { needsArming } from '../powers-ui';
import { checkersOf, describeMove, threatsIn } from '../move-text';
import { marksModel, railsOf } from '../marks-model';
import type { View } from '../match/protocol';
import { ending } from './ending';
import { createClient, type WidgetHost, type Screen, type Pending } from './client';
import { art, symbols } from './art';
import { handleProblem, ICONS, type Icon } from '../account/profile';
import { DEFAULT_OPTIONS } from '../match/setup';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Choice = { lan: string; move: Move };
const extension = (window as Window & { openai?: WidgetHost }).openai;
const savedScreen = extension?.widgetState?.privateContent?.screen;
const app = new App({ name: 'King Down', version: '1.0.0' }, {});
const client = createClient(app, extension), state = client.state;
let hostGameId: string | undefined;
let awaitingInitialResult = true;
const board = new PaintedView($('board'), { floor: null, webInk: true });
board.setPace('off');
let symbolImages: Promise<Map<string, HTMLImageElement>> | undefined;
let connected = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined, moves: Choice[] = [];
let pos: Position | undefined, selected: number | undefined, busy = false, polling = false;
let pending = state.pending;
function saveState() { state.pending = pending; client.save(); }
const buttons = () => document.querySelectorAll<HTMLButtonElement>('button');
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (rules?.game !== next.game_id) return;
  if (view?.game_id !== next.game_id) $('invitation').textContent = '';
  if (pending?.args.game_id && pending.args.game_id !== next.game_id) { pending = undefined; $('retry').hidden = true; }
  view = next;
  setRules(rules.value); pos = fromFen(view.fen);
  // The server's legal list decides; the local engine only gives each listed move its squares.
  const legal = new Set(view.legal), here = pos;
  moves = legal.size ? legalMoves(here).map(move => ({ lan: toLan(here, move), move })).filter(({ lan }) => legal.has(lan)) : [];
  board.sync(pos); board.flip(view.seat === 1); selected = undefined; highlight();
  $('status').textContent = view.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : view.result ? ending(view) : `${view.turn === 0 ? 'White' : 'Black'} to move${view.in_check ? ' · Check' : ''} · Move ${moveNumber(pos)} · You play ${view.seat === 0 ? 'White' : 'Black'}`;
  $('computer').hidden = view.kind !== 'solo' || view.status !== 'playing' || view.turn === view.seat;
  $('invite').hidden = view.kind !== 'friend' || view.status !== 'waiting';
  $('choices').replaceChildren(); $('move-hint').textContent = '';
  void applySettings();
  // The identifier is presentation state; every board reload still reads server authority.
  saveState();
  // Widget state also supplies model context; a second writer would replace it.
  if (!extension?.setWidgetState) void app.updateModelContext({ structuredContent: { revision: view.revision, status: view.status, your_turn: view.turn === view.seat } }).catch(() => {});
}
async function call(name: string, args: Record<string, unknown>, retain = false, background = false) {
  if (busy || (background && polling)) return;
  const before = view;
  let followup: Pending | undefined;
  if (background) polling = true;
  else { busy = true; buttons().forEach(b => b.disabled = true); $('error').textContent = ''; }
  if (retain) { pending = { name, args }; saveState(); }
  try {
    const result = await client.call(name, args);
    if (background && (busy || view !== before)) return;
    if (result.isError) {
      if (result._meta?.code === 'HANDLE_NEEDED') { pending = { name, args }; saveState(); navigate('handle'); return; }
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    const next = (result._meta as { view?: View } | undefined)?.view;
    if (background && next?.game_id === view?.game_id && next?.revision === view?.revision) return;
    show(next);
    if (name === 'kingdown_handle') { followup = pending; navigate(followup ? 'play' : 'settings'); }
    if (next && ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find'].includes(name)) navigate('board');
    if (name === 'kingdown_invite') { const { link, code } = result.structuredContent as { link: string; code: string }; $('invitation').textContent = `Share this link: ${link} · or the code ${code}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain || ['kingdown_create', 'kingdown_join', 'kingdown_resume'].includes(name)) pending = undefined;
    saveState(); $('retry').hidden = !pending;
  } catch (error) { if (background && (busy || view !== before)) return; $('error').textContent = error instanceof Error ? error.message : 'Could not update the game.'; $('retry').hidden = !pending; }
  finally { if (background) polling = false; else { busy = false; buttons().forEach(b => b.disabled = false); } }
  if (followup) void call(followup.name, followup.args, true);
}
function choose(lan: string) {
  if (!view || busy || pending) return;
  void call('kingdown_move', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision, lan }, true);
}
function select(square: number, submit = true) {
  if (!view || !pos || busy || pending || view.action !== 'ready') return;
  if (submit && selected === square) { selected = undefined; highlight(); choices([]); return; }
  const options = !submit || selected === undefined ? [] : moves.filter(({ move }) => move.from === selected && !needsArming(move) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
  const ordinary = options.filter(({ move }) => !move.power);
  if (ordinary.length === 1) return choose(ordinary[0].lan);
  if (options.length === 1) return choose(options[0].lan);
  if (options.length > 1) { choices(options); $('move-hint').textContent = 'Choose one of the moves below.'; $('move-hint').scrollIntoView({ block: 'nearest' }); return; }
  selected = square;
  const own = moves.filter(({ move }) => move.from === square);
  highlight();
  choices(own);
}
function choices(list: Choice[]) {
  $('move-hint').textContent = !list.length ? '' : list.every(({move}) => needsArming(move)) ? 'Choose a move below.' : 'Tap a marked square to move, or choose a move below.';
  $('choices').replaceChildren(...list.map(({ lan, move }) => { const button = document.createElement('button'); button.textContent = pos ? describeMove(pos, move) : lan; button.title = lan; button.onclick = () => choose(lan); return button; }));
}
board.onSquareClick = square => select(square); board.onDragSelect = square => select(square, false);
let cursor = 0;
$('board').tabIndex = 0;
$('board').onkeydown = event => {
  const delta = ({ ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,1], ArrowDown: [0,-1] } as Record<string, number[]>)[event.key];
  if (delta) { event.preventDefault(); const direction = view?.seat === 1 ? -1 : 1; cursor = Math.max(0, Math.min(7, (cursor % 8) + delta[0] * direction)) + 8 * Math.max(0, Math.min(7, Math.floor(cursor / 8) + delta[1] * direction)); board.setPreview(cursor); $('board').setAttribute('aria-label', `Chess board, ${sqName(cursor)}. Enter selects a square.`); }
  else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(cursor); }
};
$('reload').onclick = () => { const gameId = view?.game_id ?? hostGameId; if (gameId) void call('kingdown_get', { game_id: gameId }); };
$('retry').onclick = () => { if (pending) void call(pending.name, pending.args, true); };
$('computer').onclick = () => { if (view) void call('kingdown_computer', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision }, true); };
$('invite').onclick = () => { if (view) void call('kingdown_invite', { game_id: view.game_id }); };
$('solo').onclick = () => void call('kingdown_create', { kind: 'solo', colour: 'white', level: 'club', options: DEFAULT_OPTIONS });
$('friend').onclick = () => void call('kingdown_create', { kind: 'friend', colour: 'white', options: DEFAULT_OPTIONS });
$('random').onclick = () => void call('kingdown_find', { colour: 'white', options: DEFAULT_OPTIONS });
$('resume').onclick = () => void call('kingdown_resume', {});
$('join-form').onsubmit = event => { event.preventDefault(); void call('kingdown_join', { code: $<HTMLInputElement>('token').value.trim() }); };
void board.ready().then(() => $('board').setAttribute('aria-busy', 'false'));
board.onLoadError = () => { $('error').textContent = 'The board artwork could not load. Reload the board.'; };
app.ontoolresult = result => {
  const value = result.structuredContent;
  if (!value || typeof value !== 'object') return;
  const initial = awaitingInitialResult;
  if (!initial || !state.board_id) state.board_id = 'board_id' in value && typeof value.board_id === 'string' ? value.board_id : undefined;
  awaitingInitialResult = false;
  if ('screen' in value && ['home', 'play', 'board', 'profile'].includes(String(value.screen)) && (!initial || !savedScreen)) navigate(value.screen as Screen);
  if ('game_id' in value && typeof value.game_id === 'string') {
    hostGameId = value.game_id;
    if (!initial && !('screen' in value)) navigate('board');
    if (connected) void call('kingdown_get', { game_id: hostGameId });
  }
};
const refresh = setInterval(() => {
  if (connected && !document.hidden && !busy && !pending && view?.kind === 'friend' && view.action === 'waiting') void call('kingdown_get', { game_id: view.game_id, since_revision: view.revision }, false, true);
}, 3000);
app.onclose = () => { connected = false; clearInterval(refresh); };
const connection = app.connect().then(() => { connected = true; $<HTMLButtonElement>('home-play').disabled = false; $<HTMLButtonElement>('home-games').disabled = false; const context = app.getHostContext(); hostContext(context); if (context?.displayMode === 'fullscreen' && state.screen === 'home') navigate('play'); if (state.screen !== 'home') void fullscreen(state.screen); if (hostGameId) return call('kingdown_get', { game_id: hostGameId }); }).catch(error => { $('error').textContent = $('home-error').textContent = `Could not connect to the game: ${String(error)}`; });

function navigate(screen: Screen) {
  state.screen = screen;
  document.body.dataset.page = screen;
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach(el => { el.hidden = el.dataset.screen !== screen; });
  $('app-frame').hidden = screen === 'home';
  if (screen === 'handle') { const back = document.querySelector<HTMLButtonElement>('[data-screen="handle"] [data-back]')!; back.dataset.back = pending ? 'play' : 'settings'; back.textContent = pending ? '‹ Play' : '‹ Settings'; }
  client.save();
  if (screen === 'games') void games();
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
$('home-games').onclick = () => void fullscreen('games');
document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(button => { button.onclick = () => navigate(button.dataset.nav as Screen); });
document.querySelectorAll<HTMLButtonElement>('[data-back]').forEach(button => { button.onclick = () => navigate(button.dataset.back as Screen); });
app.onhostcontextchanged = () => hostContext(app.getHostContext());
navigate(state.screen);

function highlight() {
  if (!pos) return;
  const offered = selected === undefined ? [] : moves.filter(({ move }) => move.from === selected && !needsArming(move)).map(({ move }) => move);
  const marks = marksModel(offered);
  board.highlight({ ...marks, selected, rails: selected === undefined ? [] : railsOf(pos.board, selected, [...marks.moves, ...marks.captures], marks.captures), check: inCheck(pos) ? findKing(pos.board, pos.turn) : null, checkers: checkersOf(pos), threats: client.settings.show_threats ? threatsIn({ ...pos, turn: view?.seat ?? pos.turn }) : [] });
}
async function applySettings() {
  $<HTMLInputElement>('symbols-only').checked = client.settings.symbols_only;
  $<HTMLInputElement>('show-threats').checked = client.settings.show_threats;
  highlight();
  if (!client.settings.symbols_only) { board.setSymbols(); return; }
  try {
    symbolImages ??= Promise.all(Object.entries(symbols).flatMap(([path, urls]) => urls.map(async (src, side) => {
      const image = new Image(); image.crossOrigin = 'anonymous'; image.src = src; await image.decode(); return [`${path.split('/').at(-1)!.slice(0, -4)}-${side}`, image] as const;
    }))).then(entries => new Map(entries)).catch(error => { symbolImages = undefined; throw error; });
    const images = await symbolImages;
    if (client.settings.symbols_only) board.setSymbols(piece => images.get(`${nameOf(typeOf(piece))}-${colorOf(piece)}`)!);
  } catch { $('error').textContent = 'The board symbols could not load. Try again.'; }
}
for (const [id, key] of [['symbols-only', 'symbols_only'], ['show-threats', 'show_threats']] as const) {
  $<HTMLInputElement>(id).onchange = async () => { await client.call('kingdown_settings', { [key]: $<HTMLInputElement>(id).checked }); await applySettings(); };
}
