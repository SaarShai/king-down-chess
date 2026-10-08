import { App } from '@modelcontextprotocol/ext-apps';
import { PaintedView } from '../render/PaintedView';
import { fromFen } from '../rules/setup';
import { setRules, sqName, type Position } from '../rules/engine';
import { describeMove } from '../move-text';
import type { MatchView } from './view';
import './app.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Pending = { name: string; args: Record<string, unknown> };
const extension = (window as Window & { openai?: { widgetState?: { matchId?: string; pending?: Pending }; setWidgetState?: (state: unknown) => void } }).openai;
const saved = extension?.widgetState;
let hostMatchId = saved?.matchId;
let awaitingInitialResult = true;
const app = new App({ name: 'King Down board', version: '1.0.0' }, {});
const board = new PaintedView($('board'));
board.setPace('off');
let connected = false;
let view: MatchView | undefined, pos: Position | undefined, selected: number | undefined, busy = false;
let pending: Pending | undefined = saved?.pending;
function saveState() { extension?.setWidgetState?.({ matchId: view?.matchId ?? hostMatchId, pending }); }
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
  $('choices').replaceChildren();
  // The identifier is presentation state; every board reload still reads server authority.
  saveState();
  void app.updateModelContext({ structuredContent: { matchId: view.matchId, revision: view.snapshot.revision } }).catch(() => {});
}
async function call(name: string, args: Record<string, unknown>, retain = false) {
  if (busy) return;
  busy = true; buttons().forEach(b => b.disabled = true); $('error').textContent = '';
  if (retain) { pending = { name, args }; saveState(); }
  try {
    const result = await app.callServerTool({ name, arguments: args });
    if (result.isError) {
      const definitive = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE'];
      if (definitive.includes(String(result._meta?.code))) { pending = undefined; saveState(); }
      throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    }
    show(result.structuredContent);
    if (name === 'kingdown_invite') { const invitation = result.structuredContent as { token: string }; $('invitation').textContent = `Share this invitation: ${invitation.token}`; }
    // A reload preserves the command receipt; retry still uses its original ID.
    if (retain || ['kingdown_create', 'kingdown_join', 'kingdown_resume'].includes(name)) pending = undefined;
    saveState(); $('retry').hidden = !pending;
  } catch (error) { $('error').textContent = error instanceof Error ? error.message : 'Could not update the game.'; $('retry').hidden = !pending; }
  finally { busy = false; buttons().forEach(b => b.disabled = false); }
}
function choose(lan: string) {
  if (!view || busy || pending) return;
  void call('kingdown_move', { matchId: view.matchId, id: crypto.randomUUID(), expectedRevision: view.snapshot.revision, lan }, true);
}
function select(square: number) {
  if (!view || !pos || busy || pending || view.waiting || view.snapshot.turn !== view.playerColor || view.snapshot.status !== 'playing') return;
  const options = selected === undefined ? [] : view.snapshot.moves.filter(({ move }) => move.from === selected && (move.to === square || move.captures.includes(square) || move.shove?.from === square));
  if (options.length === 1) return choose(options[0].lan);
  if (options.length > 1) return choices(options);
  selected = square;
  const moves = view.snapshot.moves.filter(({ move }) => move.from === square);
  board.highlight({ selected: square, moves: [...new Set(moves.map(({ move }) => move.to))], captures: [...new Set(moves.flatMap(({ move }) => move.captures))] });
  choices(moves);
}
function choices(moves: MatchView['snapshot']['moves']) {
  $('choices').replaceChildren(...moves.map(({ lan }) => { const button = document.createElement('button'); button.textContent = pos ? describeMove(pos, moves.find(option => option.lan === lan)!.move) : lan; button.title = lan; button.onclick = () => choose(lan); return button; }));
}
board.onSquareClick = select; board.onDragSelect = select;
let cursor = 0;
$('board').tabIndex = 0;
$('board').onkeydown = event => {
  const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: 8, ArrowDown: -8 } as Record<string, number>)[event.key];
  if (delta) { event.preventDefault(); cursor = Math.max(0, Math.min(63, cursor + delta * (view?.playerColor === 1 ? -1 : 1))); board.setPreview(cursor); $('board').setAttribute('aria-label', `Chess board, ${sqName(cursor)}. Enter selects a square.`); }
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
$('expand').onclick = async () => { try { const mode = app.getHostContext()?.displayMode === 'fullscreen' ? 'inline' : 'fullscreen'; await app.requestDisplayMode({ mode }); } catch (error) { $('error').textContent = String(error); } };
board.onLoadError = () => { $('error').textContent = 'The board artwork could not load. Reload the board.'; };
app.ontoolresult = result => {
  const value = result.structuredContent;
  if (!value || typeof value !== 'object' || !('snapshot' in value) || !('matchId' in value) || typeof value.matchId !== 'string') return;
  // The first result is a replay; widget state can name a game selected since then.
  hostMatchId = awaitingInitialResult ? saved?.matchId ?? value.matchId : value.matchId;
  awaitingInitialResult = false;
  if (connected) void call('kingdown_get', { matchId: hostMatchId });
};
app.onhostcontextchanged = context => { $('expand').textContent = context.displayMode === 'fullscreen' ? 'Inline' : 'Fullscreen'; };
const refresh = setInterval(() => {
  if (connected && !document.hidden && !busy && !pending && view?.mode === 'friend' && view.snapshot.status === 'playing' && (view.waiting || view.snapshot.turn !== view.playerColor)) void call('kingdown_get', { matchId: view.matchId });
}, 3000);
app.onclose = () => { connected = false; clearInterval(refresh); };
void app.connect().then(() => { connected = true; if (hostMatchId) return call('kingdown_get', { matchId: hostMatchId }); }).catch(error => { $('error').textContent = `Could not connect to the game: ${String(error)}`; });
