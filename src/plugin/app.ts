import { App } from '@modelcontextprotocol/ext-apps';
import { PaintedView } from '../render/PaintedView';
import { fromFen, toLan } from '../rules/setup';
import { legalMoves, moveNumber, setRules, sqName, type Move, type Position } from '../rules/engine';
import { needsArming } from '../powers-ui';
import { describeMove } from '../move-text';
import type { View } from '../match/protocol';
import { DEFAULT_OPTIONS } from '../match/setup';
import { ending } from './ending';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Pending = { name: string; args: Record<string, unknown> };
type Choice = { lan: string; move: Move };
const extension = (window as Window & { openai?: { widgetState?: { game_id?: string; pending?: Pending }; setWidgetState?: (state: unknown) => void } }).openai;
const saved = extension?.widgetState;
let hostGameId = saved?.game_id;
let boardId: string | undefined;
let awaitingInitialResult = true;
const app = new App({ name: 'King Down board', version: '1.0.0' }, {});
const board = new PaintedView($('board'));
board.setPace('off');
let connected = false;
let view: View | undefined, rules: { game: string; value: NonNullable<View['rules']> } | undefined, moves: Choice[] = [];
let pos: Position | undefined, selected: number | undefined, busy = false, polling = false;
let pending: Pending | undefined = saved?.pending;
function saveState() { extension?.setWidgetState?.({ game_id: view?.game_id ?? hostGameId, revision: view?.revision, pending }); }
const buttons = () => document.querySelectorAll<HTMLButtonElement>('button');
/** Draws one seat's view (the tool result's `_meta`, which the model never sees). */
function show(next: View | undefined) {
  if (!next) return;
  if (pending && pending.args.game_id !== next.game_id) { pending = undefined; $('retry').hidden = true; }
  if (!next.fen) { view = next; pos = undefined; moves = []; $('status').textContent = next.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : next.result ? ending(next) : 'Choose your king and arrangement.'; $('invite').hidden = next.kind !== 'friend' || next.status !== 'waiting'; $('computer').hidden = true; $('choices').replaceChildren(); saveState(); return; }
  if (next.rules) rules = { game: next.game_id, value: next.rules };
  // A full read carries the rules; a reply without them is for a game this board no longer shows.
  if (rules?.game !== next.game_id) return;
  if (view?.game_id !== next.game_id) $('invitation').textContent = '';
  view = next;
  setRules(rules.value); pos = fromFen(view.fen);
  // The server's legal list decides; the local engine only gives each listed move its squares.
  const legal = new Set(view.legal), here = pos;
  moves = legal.size ? legalMoves(here).map(move => ({ lan: toLan(here, move), move })).filter(({ lan }) => legal.has(lan)) : [];
  board.sync(pos); board.flip(view.seat === 1); selected = undefined; board.highlight({});
  $('status').textContent = view.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : view.result ? ending(view) : `${view.turn === 0 ? 'White' : 'Black'} to move${view.in_check ? ' · Check' : ''} · Move ${moveNumber(pos)} · You play ${view.seat === 0 ? 'White' : 'Black'}`;
  $('computer').hidden = view.kind !== 'solo' || view.status !== 'playing' || view.turn === view.seat;
  $('invite').hidden = view.kind !== 'friend' || view.status !== 'waiting';
  $('choices').replaceChildren(); $('move-hint').textContent = '';
  // The identifier is presentation state; every board reload still reads server authority.
  saveState();
  // Widget state also supplies model context; a second writer would replace it.
  if (!extension?.setWidgetState) void app.updateModelContext({ structuredContent: { game_id: view.game_id, revision: view.revision } }).catch(() => {});
}
async function call(name: string, args: Record<string, unknown>, retain = false, background = false) {
  if (busy || (background && polling)) return;
  const before = view;
  if (background) polling = true;
  else { busy = true; buttons().forEach(b => b.disabled = true); $('error').textContent = ''; }
  if (retain) { pending = { name, args }; saveState(); }
  try {
    const result = await app.callServerTool({ name, arguments: boardId && ['kingdown_get','kingdown_create','kingdown_join','kingdown_resume'].includes(name) ? {...args,board_id: boardId} : args });
    if (background && (busy || view !== before)) return;
    if (result.isError) {
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    const next = (result._meta as { view?: View } | undefined)?.view;
    if (background && next?.game_id === view?.game_id && next?.revision === view?.revision) return;
    show(next);
    if (name === 'kingdown_invite') { const { code } = result.structuredContent as { code: string }; $('invitation').textContent = `Share this code: ${code}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain || ['kingdown_create', 'kingdown_join', 'kingdown_resume'].includes(name)) pending = undefined;
    saveState(); $('retry').hidden = !pending;
  } catch (error) { if (background && (busy || view !== before)) return; $('error').textContent = error instanceof Error ? error.message : 'Could not update the game.'; $('retry').hidden = !pending; }
  finally { if (background) polling = false; else { busy = false; buttons().forEach(b => b.disabled = false); } }
}
function choose(lan: string) {
  if (!view || busy || pending) return;
  void call('kingdown_move', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision, lan }, true);
}
function select(square: number, submit = true) {
  if (!view || !pos || busy || pending || view.action !== 'ready') return;
  if (submit && selected === square) { selected = undefined; board.highlight({}); choices([]); return; }
  const options = !submit || selected === undefined ? [] : moves.filter(({ move }) => move.from === selected && !needsArming(move) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
  const ordinary = options.filter(({ move }) => !move.power);
  if (ordinary.length === 1) return choose(ordinary[0].lan);
  if (options.length === 1) return choose(options[0].lan);
  if (options.length > 1) { choices(options); $('move-hint').textContent = 'Choose one of the moves below.'; $('move-hint').scrollIntoView({ block: 'nearest' }); return; }
  selected = square;
  const own = moves.filter(({ move }) => move.from === square);
  const clickable = own.filter(({move}) => !needsArming(move));
  board.highlight({ selected: square, moves: [...new Set(clickable.filter(({move}) => move.from !== move.to).map(({ move }) => move.to))], captures: [...new Set(clickable.flatMap(({ move }) => move.captures))] });
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
// The board has no colour choice yet: its creator plays White, as before.
$('solo').onclick = () => void call('kingdown_create', { kind: 'solo', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: false } });
$('friend').onclick = () => void call('kingdown_create', { kind: 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: false } });
$('resume').onclick = () => void call('kingdown_resume', {});
$('join').onclick = () => void call('kingdown_join', { code: $<HTMLInputElement>('token').value.trim() });
board.onLoadError = () => { $('error').textContent = 'The board artwork could not load. Reload the board.'; };
app.ontoolresult = result => {
  const value = result.structuredContent;
  if (!value || typeof value !== 'object') return;
  if ('board_id' in value && typeof value.board_id === 'string' && !('game_id' in value)) { boardId = value.board_id; awaitingInitialResult = false; $('status').textContent = 'King Down. Start a game from Play.'; if (connected) void call('kingdown_get', {}); return; }
  if (!('game_id' in value) || typeof value.game_id !== 'string') return;
  // The first result is a replay; widget state can name a game selected since then.
  boardId = 'board_id' in value && typeof value.board_id === 'string' ? value.board_id : undefined;
  hostGameId = awaitingInitialResult ? saved?.game_id ?? value.game_id : value.game_id;
  awaitingInitialResult = false;
  if (connected) void call('kingdown_get', { game_id: hostGameId });
};
const refresh = setInterval(() => {
  if (connected && !document.hidden && !busy && !pending && view?.kind === 'friend' && view.action === 'waiting') void call('kingdown_get', { game_id: view.game_id, ...(view.fen && { since_revision: view.revision }) }, false, true);
}, 3000);
app.onclose = () => { connected = false; clearInterval(refresh); };
void app.connect().then(() => { connected = true; if (!awaitingInitialResult && (hostGameId || boardId)) return call('kingdown_get', hostGameId ? { game_id: hostGameId } : {}); }).catch(error => { $('error').textContent = `Could not connect to the game: ${String(error)}`; });
