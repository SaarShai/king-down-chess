import { App } from '@modelcontextprotocol/ext-apps';
import { PaintedView } from '../render/PaintedView';
import { fromFen } from '../rules/setup';
import { setRules, sqName, type Position } from '../rules/engine';
import { needsArming } from '../powers-ui';
import { describeMove } from '../move-text';
import type { MatchView } from '../match/service';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Pending = { name: string; args: Record<string, unknown> };
const extension = (window as Window & { openai?: { widgetState?: { matchId?: string; pending?: Pending }; setWidgetState?: (state: unknown) => void } }).openai;
const saved = extension?.widgetState;
let hostMatchId = saved?.matchId;
let boardId: string | undefined;
let awaitingInitialResult = true;
const app = new App({ name: 'King Down board', version: '1.0.0' }, {});
const board = new PaintedView($('board'));
board.setPace('off');
let connected = false;
let view: MatchView | undefined, pos: Position | undefined, selected: number | undefined, busy = false, polling = false;
let pending: Pending | undefined = saved?.pending;
function saveState() { extension?.setWidgetState?.({ matchId: view?.matchId ?? hostMatchId, revision: view?.snapshot.revision, pending }); }
const buttons = () => document.querySelectorAll<HTMLButtonElement>('button');
function show(value: unknown) {
  if (!value || typeof value !== 'object' || !('snapshot' in value)) return;
  const next = value as MatchView;
  if (view?.matchId !== next.matchId) $('invitation').textContent = '';
  if (pending && pending.args.matchId !== next.matchId) { pending = undefined; $('retry').hidden = true; }
  view = next;
  setRules(view.snapshot.rules); pos = fromFen(view.snapshot.fen);
  board.sync(pos); board.flip(view.playerColor === 1); selected = undefined; board.highlight({});
  $('status').textContent = view.waiting ? 'Waiting for your friend. Share an invitation.' : view.snapshot.status !== 'playing' ? ({ checkmate: `${view.snapshot.turn === 0 ? 'Black' : 'White'} wins · Checkmate`, stalemate: 'Draw · Stalemate', draw50: 'Draw · Fifty-move rule', drawRepetition: 'Draw · Repetition', drawMaterial: 'Draw · Insufficient material' } as Record<string, string>)[view.snapshot.status] : `${view.snapshot.turn === 0 ? 'White' : 'Black'} to move${view.snapshot.inCheck ? ' · Check' : ''} · Move ${view.snapshot.moveNumber} · You play ${view.playerColor === 0 ? 'White' : 'Black'}`;
  $('computer').hidden = view.mode !== 'solo' || view.snapshot.turn === view.playerColor || view.snapshot.status !== 'playing';
  $('invite').hidden = view.mode !== 'friend' || !view.waiting;
  $('choices').replaceChildren(); $('move-hint').textContent = '';
  // The identifier is presentation state; every board reload still reads server authority.
  saveState();
  // Widget state also supplies model context; a second writer would replace it.
  if (!extension?.setWidgetState) void app.updateModelContext({ structuredContent: { matchId: view.matchId, revision: view.snapshot.revision } }).catch(() => {});
}
async function call(name: string, args: Record<string, unknown>, retain = false, background = false) {
  if (busy || (background && polling)) return;
  const before = view;
  if (background) polling = true;
  else { busy = true; buttons().forEach(b => b.disabled = true); $('error').textContent = ''; }
  if (retain) { pending = { name, args }; saveState(); }
  try {
    const result = await app.callServerTool({ name, arguments: boardId && ['kingdown_get','kingdown_create','kingdown_join','kingdown_resume'].includes(name) ? {...args,boardId} : args });
    if (background && (busy || view !== before)) return;
    if (result.isError) {
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    const next = result.structuredContent as MatchView | undefined;
    if (background && next?.matchId === view?.matchId && next?.snapshot.revision === view?.snapshot.revision && next?.waiting === view?.waiting) return;
    show(next);
    if (name === 'kingdown_invite') { const invitation = result.structuredContent as { token: string }; $('invitation').textContent = `Share this invitation: ${invitation.token}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain || ['kingdown_create', 'kingdown_join', 'kingdown_resume'].includes(name)) pending = undefined;
    saveState(); $('retry').hidden = !pending;
  } catch (error) { if (background && (busy || view !== before)) return; $('error').textContent = error instanceof Error ? error.message : 'Could not update the game.'; $('retry').hidden = !pending; }
  finally { if (background) polling = false; else { busy = false; buttons().forEach(b => b.disabled = false); } }
}
function choose(lan: string) {
  if (!view || busy || pending) return;
  void call('kingdown_move', { matchId: view.matchId, id: crypto.randomUUID(), expectedRevision: view.snapshot.revision, lan }, true);
}
function select(square: number, submit = true) {
  if (!view || !pos || busy || pending || view.waiting || view.snapshot.turn !== view.playerColor || view.snapshot.status !== 'playing') return;
  if (submit && selected === square) { selected = undefined; board.highlight({}); choices([]); return; }
  const options = !submit || selected === undefined ? [] : view.snapshot.moves.filter(({ move }) => move.from === selected && !needsArming(move) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
  const ordinary = options.filter(({ move }) => !move.power);
  if (ordinary.length === 1) return choose(ordinary[0].lan);
  if (options.length === 1) return choose(options[0].lan);
  if (options.length > 1) { choices(options); $('move-hint').textContent = 'Choose one of the moves below.'; $('move-hint').scrollIntoView({ block: 'nearest' }); return; }
  selected = square;
  const moves = view.snapshot.moves.filter(({ move }) => move.from === square);
  const clickable = moves.filter(({move}) => !needsArming(move));
  board.highlight({ selected: square, moves: [...new Set(clickable.filter(({move}) => move.from !== move.to).map(({ move }) => move.to))], captures: [...new Set(clickable.flatMap(({ move }) => move.captures))] });
  choices(moves);
}
function choices(moves: MatchView['snapshot']['moves']) {
  $('move-hint').textContent = !moves.length ? '' : moves.every(({move}) => needsArming(move)) ? 'Choose a move below.' : 'Tap a marked square to move, or choose a move below.';
  $('choices').replaceChildren(...moves.map(({ lan }) => { const button = document.createElement('button'); button.textContent = pos ? describeMove(pos, moves.find(option => option.lan === lan)!.move) : lan; button.title = lan; button.onclick = () => choose(lan); return button; }));
}
board.onSquareClick = square => select(square); board.onDragSelect = square => select(square, false);
let cursor = 0;
$('board').tabIndex = 0;
$('board').onkeydown = event => {
  const delta = ({ ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,1], ArrowDown: [0,-1] } as Record<string, number[]>)[event.key];
  if (delta) { event.preventDefault(); const direction = view?.playerColor === 1 ? -1 : 1; cursor = Math.max(0, Math.min(7, (cursor % 8) + delta[0] * direction)) + 8 * Math.max(0, Math.min(7, Math.floor(cursor / 8) + delta[1] * direction)); board.setPreview(cursor); $('board').setAttribute('aria-label', `Chess board, ${sqName(cursor)}. Enter selects a square.`); }
  else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(cursor); }
};
$('reload').onclick = () => { const matchId = view?.matchId ?? hostMatchId; if (matchId) void call('kingdown_get', { matchId }); };
$('retry').onclick = () => { if (pending) void call(pending.name, pending.args, true); };
$('computer').onclick = () => { if (view) void call('kingdown_computer', { matchId: view.matchId, id: crypto.randomUUID(), expectedRevision: view.snapshot.revision }, true); };
$('invite').onclick = () => { if (view) void call('kingdown_invite', { matchId: view.matchId }); };
$('solo').onclick = () => void call('kingdown_create', { mode: 'solo' });
$('friend').onclick = () => void call('kingdown_create', { mode: 'friend' });
$('resume').onclick = () => void call('kingdown_resume', {});
$('join').onclick = () => void call('kingdown_join', { token: $<HTMLInputElement>('token').value.trim() });
board.onLoadError = () => { $('error').textContent = 'The board artwork could not load. Reload the board.'; };
app.ontoolresult = result => {
  const value = result.structuredContent;
  if (!value || typeof value !== 'object' || !('snapshot' in value) || !('matchId' in value) || typeof value.matchId !== 'string') return;
  // The first result is a replay; widget state can name a game selected since then.
  boardId = 'boardId' in value && typeof value.boardId === 'string' ? value.boardId : undefined;
  hostMatchId = awaitingInitialResult ? saved?.matchId ?? value.matchId : value.matchId;
  awaitingInitialResult = false;
  if (connected) void call('kingdown_get', { matchId: hostMatchId });
};
const refresh = setInterval(() => {
  if (connected && !document.hidden && !busy && !pending && view?.mode === 'friend' && view.snapshot.status === 'playing' && (view.waiting || view.snapshot.turn !== view.playerColor)) void call('kingdown_get', { matchId: view.matchId }, false, true);
}, 3000);
app.onclose = () => { connected = false; clearInterval(refresh); };
void app.connect().then(() => { connected = true; if (hostMatchId && !awaitingInitialResult) return call('kingdown_get', { matchId: hostMatchId }); }).catch(error => { $('error').textContent = `Could not connect to the game: ${String(error)}`; });
