import { cursorText } from '../../cursor-text';
import { railsOf, marksModel } from '../../marks-model';
import { checkCause, checkersOf, describeMove, threatsIn, shortMove } from '../../move-text';
import { pieceTitle, reachOf, readText, teachNote } from '../../read';
import { GameRules } from '../../game-rules';
import { needsServerPreview } from '../../account-game/engine-identity';
import { toFen } from '../../rules/setup';
import { colorOf, findKing, K, moveNumber, NAMES, LETTERS, piece, PLAIN_KINGS, T, typeOf, type Color, type Move, type Position, type PowerName } from '../../rules/engine';
import { cardName, cardText, coinState, coinWords, needsArming, offered, POWER_TAG, powerText, ruleLine } from '../../powers-ui';
import { LESSONS } from '../../lessons';
import { momentKind } from '../../moment';
import { boardFoot } from '../../screen/board-foot';
import { soundsFor } from '../../screen/moments';
import { contextLine } from '../../context-line';
import { waitNotice } from '../../turn';
import type { DraftPosition, DraftPreview, PlayerRecord, View } from '../../match/protocol';
import { ending } from '../ending';
import { board, disposeBoard, highlight } from '../board-view';
import { art, symbols } from '../../account-game/art';
import { cardSymbol } from '../../card-symbol';
import { cardArt } from '../card-face';
import { cardDiagram } from '../../card-diagram';
import { pieceIcon } from '../../piece-icons';
import { snd } from '../../render/sfx';
import '../../ceremony.css';
import { client, memory, navigate, queue, routeView, send } from '../../account-game/runtime';
import { locks, noticeShows, pendingHere, staleRead, type Page, type Store } from '../../account-game/state';
import { nextGame } from '../../account-game/next-game';
import { actionButtons, playerBlockButton } from './board-actions';
import { guardEndTaps, updateEnd } from './end';
import { applyLan, boardActions, cardCoins, cardUseReason, committedPreview, draftChoices, draftLans, draftTurn, previewSteps, replayHistory, replayLans, restoreDraft, sendActions, stripLine, timeLeft, type BoardMove } from './board-model';
import { policyLabel, policyDetail } from '../../account-game/rating-policy';
import './board.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Choice = { lan: string; move: Move };
let view: View | undefined, pos: Position | undefined;
let gameRules = new GameRules();
export const boardGame = () => view;
export let rollbackBoardMove: (code?: string) => Promise<void>;
let history: BoardMove[] = [], lastMove: BoardMove | undefined;
export const boardLastMove = () => lastMove;
export let skipBoardCeremony = () => {};
let command: (name: string, args: Record<string, unknown>) => Promise<View | undefined>;
export const sendBoardCommand = (name: string, args: Record<string, unknown> = {}) => command(name, args);
const portraitPath = (side: Color) => `ui/kings/${(gameRules.rules.kings[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}${side ? '-b' : ''}.webp`;
let sheet: HTMLDialogElement, scrim: HTMLDivElement, sheetFocus: HTMLElement | undefined;
let refreshCardSheet: (() => void) | undefined;
let stopPlacingChoice = () => {};
export function closeBoardSheet() {
  refreshCardSheet = undefined;
  if (!sheet) return;
  stopPlacingChoice(); stopPlacingChoice = () => {};
  for (const id of ['choices', 'reload', 'computer', 'invite', 'invitation']) $('board-park').append($(id));
  const restore = sheet.open && sheet.contains(document.activeElement);
  if (sheet.open) document.querySelector<HTMLElement>('.page-sheet')!.inert = false;
  sheet.close(); scrim.hidden = true;
  $('moves-line').setAttribute('aria-expanded', String(!$('recent-moves').hidden));
  const focus = sheetFocus?.id ? document.getElementById(sheetFocus.id) : sheetFocus;
  if (restore) (focus?.isConnected ? focus : $('board')).focus({preventScroll:true}); client.state.sheet = undefined; client.save();
}
export function boardSheet(title: string, ...nodes: HTMLElement[]) {
  if (!sheet) {
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.hidden = true;
    sheet = document.createElement('dialog'); sheet.id = 'board-sheet'; sheet.setAttribute('aria-labelledby', 'board-sheet-title'); sheet.className = 'over-sheet'; sheet.setAttribute('aria-modal', 'true');
    $('app-frame').append(scrim, sheet); scrim.onclick = closeBoardSheet;
    sheet.onkeydown = event => {
      if (event.key === 'Tab') {
        const buttons = [...sheet.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, [tabindex="0"]')].filter(el => el.getClientRects().length), i = buttons.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && i <= 0 || !event.shiftKey && i === buttons.length - 1) { event.preventDefault(); buttons[event.shiftKey ? buttons.length - 1 : 0]?.focus({preventScroll:true}); }
      }
    };
  }
  const opener = sheet.contains(document.activeElement) ? sheetFocus : document.activeElement as HTMLElement;
  closeBoardSheet(); sheetFocus = opener;
  sheet.classList.remove('board-menu', 'move-choice');
  sheet.removeAttribute('style'); scrim.classList.remove('move-choice-scrim');
  sheet.innerHTML = '<header class="sheet-head"><h2 id="board-sheet-title"></h2><button aria-label="Close">×</button></header><div class="sheet-body"></div>';
  sheet.querySelector('h2')!.textContent = title; sheet.querySelector('button')!.onclick = closeBoardSheet;
  sheet.querySelector('.sheet-body')!.append(...nodes); scrim.hidden = false; document.querySelector<HTMLElement>('.page-sheet')!.inert = true; sheet.show(); sheet.querySelector('button')!.focus({preventScroll:true});
  if (nodes.includes($('choices'))) {
    const board = $('board'), frame = $('app-frame');
    sheet.classList.add('move-choice'); scrim.classList.add('move-choice-scrim');
    board.classList.add('choosing-move');
    const place = () => {
      const room = frame.getBoundingClientRect();
      board.style.maxHeight = `${Math.max(0, room.bottom - board.getBoundingClientRect().top - sheet.getBoundingClientRect().height - 24)}px`;
      const box = board.getBoundingClientRect();
      Object.assign(sheet.style, boardFoot({left:box.left - room.left, bottom:box.bottom - room.top, width:box.width}, sheet.getBoundingClientRect(), room));
    };
    place();
    const observer = new ResizeObserver(place); observer.observe(board); observer.observe(sheet); observer.observe(frame);
    stopPlacingChoice = () => { observer.disconnect(); board.classList.remove('choosing-move'); board.style.maxHeight = ''; };
  }
  client.state.sheet = 'board-sheet'; client.save();
}
const text = (words: string) => { const p = document.createElement('p'); p.textContent = words; return p; };
const button = (words: string, click: () => void) => { const b = document.createElement('button'); b.textContent = words; b.onclick = click; return b; };
export function boardScreen(store: Store) {
  let generation = 0, animating = false, rush = false, steps: BoardMove[] = [];
  let shownNextGame: string | undefined;
  let serverDraft: DraftPreview | undefined, previewing = false, previewAbort: AbortController | undefined;
  const remote = () => needsServerPreview(view?.engine_fingerprint);
  const previewPosition = (): DraftPosition | undefined => remote() ? serverDraft?.positions.at(-1) ?? { fen: view?.fen ?? '', status: 'playing', turn: pos?.turn ?? view!.turn, in_check: view!.in_check, moves: [] } : undefined;
  const marksLayer = document.createElement('div');
  marksLayer.id = 'board-marks'; marksLayer.setAttribute('aria-hidden', 'true'); $('board').append(marksLayer);
  const call = store.call;
  // The game lock covers a write, a mount, a command that belongs here and a stale board.
  const networkBlocked = () => locks(store.page()).game;
  const stale = () => staleRead(store.page());
  // Send-turn 03 A3: "Sending…" only while a write is in flight; a failed command waits for Retry with the normal words.
  const sending = () => { const page = store.page(); return page.writing || (pendingHere(page) && !page.pending!.error); };
  const blocked = () => networkBlocked() || animating || previewing || remote() && view?.action === 'ready' && !serverDraft;
  const mode = () => view!.kind === 'solo' ? 'computer' : 'link';
  const nextReadyGame = () => view?.status === 'playing' && view.kind !== 'solo' && view.turn !== view.seat ? nextGame(memory.games, view.game_id)?.game_id : undefined;
  // A reload restores a draft only in the same account, complete game, revision, rules and engine implementation.
  const saveDraft = () => { client.state.draft = view?.engine_fingerprint && steps.length ? { game_tag: view.game_id.slice(0, 8), fen: view.fen, lans: steps.map(step => step.lan), scope: { account: client.accountId, game: view.game_id, revision: view.revision, rules: JSON.stringify(view.rules), engine: view.engine_fingerprint } } : undefined; client.save(); };
  const dropDraft = () => { if (client.state.draft) { client.state.draft = undefined; client.save(); } };
  const turn = () => draftTurn(steps, pos!, mode(), view!.seat, gameRules, previewPosition());
  const canPlay = () => !!view && !!pos && !blocked() && view.action === 'ready' && view.status === 'playing' && !turn().waits;
  board.canDrag = () => client.state.screen === 'seat' || canPlay() && pos!.turn === view!.seat;
  const canRead = () => !animating;
  let armed: PowerName | undefined, armedCard: number | undefined;
  let selected: number | undefined, inspected: number | undefined, moves: Choice[] = [], cursor = 0, cursorShown = false, cursorTargets: number[] = [];
  function sayCursor() {
    if (!pos) return;
    const label = cursorShown ? cursorText(gameRules, pos, cursor, selected, cursorTargets.includes(cursor)) : '';
    $('board').setAttribute('aria-label', label ? `Chess board, ${label}. Enter selects a square.` : 'Chess board'); $('cursor-say').textContent = label;
  }
  function drawCursor() {
    marksLayer.replaceChildren();
    if (!cursorShown) return;
    const box = $('board').getBoundingClientRect(), at = board.screenOf(cursor), next = board.screenOf(cursor % 8 < 7 ? cursor + 1 : cursor - 1);
    const width = Math.hypot(at.x - next.x, at.y - next.y), mark = document.createElement('i');
    mark.className = 'mk-cursor';
    Object.assign(mark.style, { left: `${at.x - box.left - width / 2}px`, top: `${at.y - box.top - width / 2}px`, width: `${width}px`, height: `${width}px` });
    marksLayer.append(mark);
  }
  const cursorObserver = new ResizeObserver(drawCursor); cursorObserver.observe($('board'));
  // G3 a: a shove or swap onto your own piece needs a second tap.
  let held: Choice | undefined;
  const heldSquare = (move: Move) => move.shove?.from ?? move.to;
  const ownTarget = (move: Move, square: number) => !!pos!.board[square] && colorOf(pos!.board[square]) === view!.seat && (move.shove?.from === square || !!move.swap && move.to === square);
  // Keep the preview only while its piece stays selected and the move stays legal and offered.
  const holding = () => { const now = held && moves.find(c => c.lan === held!.lan); return now && selected === now.move.from && canPlay() && reachable(now.move) ? now : undefined; };
  let computerCalls = 0, computerRunning = false, thinking = false, tornDown = false, thinkingTimer: ReturnType<typeof setTimeout> | undefined;
  let ownRating: PlayerRecord['rating'] | undefined, profileRead = false;
  let readAt = Date.now(), deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  // The topple plays only when the end arrives live, not on a reload.
  let toppling = false;
  let stopCeremony = () => {};
  skipBoardCeremony = () => { toppling = false; stopCeremony(); };
  board.onSkipAnimation = () => { rush = true; skipBoardCeremony(); };
  // Each card coin's last spent state, and when a live use spent it (for the gold pulse).
  const cardSpent = new Map<string, boolean>(), spentAt = new Map<string, number>();
  // Q3 b: the board's height on the last render with no draw reply. A draw offer pins the board to it.
  let boardRoom = 0;
  // When the four cards dealt (a live game start), and when a check last began.
  let dealtAt = -Infinity, dealing = false, opening = false, checkAt = -Infinity, checked: number | null = null;
  // strips() rebuilds the coins; a negative delay keeps a running moment in its place.
  const moment = (el: HTMLElement, name: string, start: number, ms: number) => { const age = performance.now() - start; if (age >= ms) return false; el.classList.add(name); el.style.setProperty('--age', `${-age}ms`); return true; };
  // Sound is off unless the player turns it on in Settings (render/sfx.ts).
  const hitSound = (step: BoardMove, token: number) => {
    const sounds = soundsFor(momentKind(step.pre, step.move), step.move);
    if (sounds.now) snd[sounds.now]();
    let struck = false;
    return () => { if (struck || token !== generation) return; struck = true; if (sounds.hit) snd[sounds.hit](); };
  };
  const refused = new Set<string>(), taught = new Map<string, number>();
  const active = () => ['board', 'end'].includes(client.state.screen);

  command = async (name, args) => {
    if (!view || networkBlocked()) return;
    const game = view.game_id;
    // A draw reply can arrive on our turn, before the next poll.
    if (view.draw_offer !== null && view.kind !== 'solo') {
      const fresh = await call('kingdown_get', {});
      if (!fresh || fresh.game_id !== game) return;
    }
    const outcome = await send(name, {game_id:game, command_id:crypto.randomUUID().replaceAll('-', ''), expected_revision:view.revision, ...args}, { retain: true });
    const next = outcome.status === 'done' || outcome.status === 'refused' ? outcome.view as View | undefined : undefined;
    if (!next && !client.state.pending && view?.game_id === game) {
      // A NOT_ALLOWED refusal of Abort or a draw offer hides that button for this game; a stale revision does not, because
      // the read below can show the action is still open. The notice text never comes from the DOM.
      const notice = store.refusal();
      if (notice && notice.game === game && notice.code === 'NOT_ALLOWED' && (name === 'kingdown_abort' || name === 'kingdown_draw' && args.choice === 'offer')) refused.add(name);
      // A newer chat result or user command owns the page: its own read routes, and a re-read here would stop it (design §2).
      if (outcome.status === 'superseded') return;
      await call('kingdown_get', {}); refresh();
    }
    return next;
  };
  const tag = () => armed ? POWER_TAG[armed] ?? null : null;
  const cardChoices = () => armedCard === undefined || !pos || !view ? [] : moves.filter(c => cardCoins(pos!,view!.seat,gameRules.rules.hands[view!.seat],moves.map(c=>c.move))[armedCard!].moves.includes(c.move));
  const reachable = (move: Move) => armedCard !== undefined ? cardChoices().some(c=>c.move===move) : gameRules.rules.hands[view!.seat].length ? !move.power : offered(move,tag());
  const named = () => armedCard !== undefined ? cardChoices().filter(({move}) => !move.pass && (move.from === move.to || move.drop !== undefined)) : moves.filter(({move}) => ['freeze','ward','sacrifice'].includes(move.power ?? '') && move.power === tag());
  async function computer() {
    if (tornDown || !view || client.state.screen !== 'board' || document.hidden || blocked() || computerRunning || computerCalls >= 4 || view.kind !== 'solo' || view.status !== 'playing' || view.turn === view.seat || $<HTMLDialogElement>('over').open) return;
    const game = view.game_id; computerRunning = true;
    if (computerCalls++ === 0) thinkingTimer = setTimeout(() => { if (view?.game_id === game && view.turn !== view.seat) { thinking = true; strips(); } }, 1000);
    const origin = queue.command('write', 'kingdown_computer', {}, { user: false });
    const outcome = await send('kingdown_computer', {game_id:game, command_id:crypto.randomUUID().replaceAll('-', ''), expected_revision:view.revision}, { retain: true, user: false, origin });
    if (outcome.status === 'superseded') { computerRunning = false; clearTimeout(thinkingTimer); thinking = false; return; }
    const next = outcome.status === 'done' || outcome.status === 'refused' ? outcome.view : undefined;
    if (!next && !client.state.pending && view?.game_id === game) await send('kingdown_get', {}, { origin, user: false });
    computerRunning = false;
    if (!view || view.game_id !== game || view.turn === view.seat || view.status !== 'playing' || client.state.pending?.error) { clearTimeout(thinkingTimer); thinking = false; }
    if (view?.game_id === game) { strips(); void computer(); }
  }
  const scheduleComputer = () => { if (!tornDown) setTimeout(() => void computer(), 0); };
  const events = new AbortController(), signal = events.signal;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleComputer(); }, { signal });
  function moveLine() {
    if (!pos) return;
    const nodes: HTMLElement[] = [];
    if (lastMove) {
      const code = lastMove.move.drop === undefined ? lastMove.pre.board[lastMove.move.from] : piece(lastMove.move.drop,lastMove.pre.turn), icon = pieceIcon(typeOf(code), colorOf(code)), name = /ui\/icons\/([a-z]+)\.svg/.exec(icon)?.[1];
      if (name) { const image = document.createElement('img'); image.className = 'pi'; image.alt = ''; image.src = symbols[`../../public/ui/icons/${name}.svg`][colorOf(code)]; nodes.push(image); }
    }
    const words = document.createElement('span'); words.textContent = lastMove?.words ?? `Move ${moveNumber(pos)}.`; nodes.push(words); $('last-move').replaceChildren(...nodes);
    $('recent-moves').replaceChildren(...moveRows());
    if (movesOpen()) {
      const body = sheet.querySelector('.sheet-body')!, scroll = body.scrollTop;
      body.replaceChildren(...moveRows());
      body.scrollTop = scroll;
    }
    fitMoves();
    $('short-move-words').textContent = lastMove ? shortMove(lastMove.pre, lastMove.move, type => gameRules.nameOf(type)) : `Move ${moveNumber(pos)}.`;
  }
  const remainingTime = () => view?.deadline_at ? Date.parse(view.deadline_at) - Date.parse(view.server_now) - (Date.now() - readAt) : 0;
  function updateTime() {
    $('move-time-left').textContent = view ? timeLeft(view, Date.now() - readAt) : '';
    clearTimeout(deadlineTimer);
    const remaining = remainingTime();
    if (!tornDown && view?.status === 'playing' && remaining > 0) deadlineTimer = setTimeout(() => remainingTime() > 0 ? updateTime() : refresh(), Math.min(60000, remaining + 1));
  }
  function choose(lan: string) {
    if (!canPlay()) return;
    if (remote()) { void requestPreview([...steps.map(step => step.lan), lan], true); return; }
    const step = applyLan(pos!, lan, view!.rules!, moves.map(choice => choice.lan));
    if (!step) return;
    stageMove(step);
  }
  function stageMove(step: BoardMove) {
    const keyboard = document.activeElement === $('board') || !!sheet?.contains(document.activeElement);
    closeBoardSheet(); armed = undefined; armedCard = undefined; selected = inspected = held = undefined; choices([]);
    const token = ++generation; steps.push(step); lastMove = step; pos = step.pos; animating = true;
    board.skip(); board.setLifted(null); moveLine(); refresh(); saveDraft();
    if (step.move.drop !== undefined) board.sync(step.pos);
    const hit = hitSound(step, token);
    void (step.move.drop === undefined ? board.animateMove(step.pre, step.move, hit) : Promise.resolve()).then(() => {
      if (token !== generation) return;
      hit(); if (previewPosition()?.in_check ?? gameRules.inCheck(step.pos)) snd.check();
    }).finally(() => {
      if (token !== generation) return;
      board.sync(step.pos); animating = false; refresh();
      if (keyboard) $(turn().waits ? 'end-turn' : 'board').focus({preventScroll:true});
    });
  }
  function restorePreview() {
    if (!view?.rules || !remote()) return;
    const saved = client.state.draft, lans = draftLans(view, saved, view.rules, client.accountId);
    if (saved && !lans) dropDraft();
    if (serverDraft || previewing || view.action !== 'ready' || view.status !== 'playing') return;
    void requestPreview(lans ?? [], false, true);
  }
  async function requestPreview(actions: string[], animate = false, restoring = false) {
    if (tornDown || queue.closed() || !active() || !view || view.action !== 'ready' || view.status !== 'playing') return;
    if (!view.engine_fingerprint) { store.dispatch({ type: 'failed-read', game: view.game_id, text: 'This game implementation is unavailable. Select Try again.' }); return; }
    previewAbort?.abort();
    const controller = previewAbort = new AbortController(), token = ++generation, base = view, account = client.accountId;
    if (animating) { board.skip(); animating = false; board.sync(pos!); }
    previewing = true; refresh();
    const current = () => !tornDown && !queue.closed() && active() && token === generation && account === client.accountId && view?.game_id === base.game_id && view.revision === base.revision && view.engine_fingerprint === base.engine_fingerprint;
    try {
      const result = await client.call('kingdown_preview', { game_id: base.game_id, expected_revision: base.revision, engine_fingerprint: base.engine_fingerprint, actions }, { background: true, signal: controller.signal });
      if (!current()) return;
      if (result.isError) {
        if (restoring && result._meta?.code === 'INVALID_MOVE') { dropDraft(); previewing = false; void requestPreview([]); return; }
        throw new Error('Could not preview this turn. Select Try again.');
      }
      const preview = result._meta?.draft as DraftPreview | undefined;
      const staged = preview && JSON.stringify(preview.actions) === JSON.stringify(actions) ? previewSteps(base, preview, gameRules) : undefined;
      if (!staged) throw new Error('Could not preview this turn. Select Try again.');
      serverDraft = preview; previewing = false;
      if (animate && staged.length) { steps = staged.slice(0, -1); stageMove(staged.at(-1)!); }
      else {
        steps = staged; lastMove = staged.at(-1) ?? history.at(-1); pos = gameRules.fromFen(preview!.positions.at(-1)!.fen);
        board.sync(pos); moveLine(); refresh(); saveDraft();
      }
    } catch {
      if (current() && !controller.signal.aborted) store.dispatch({ type: 'failed-read', game: base.game_id, text: 'Could not preview this turn. Select Try again.' });
    } finally {
      if (previewAbort === controller) { previewAbort = undefined; previewing = false; if (!tornDown && active()) refresh(); }
    }
  }
  function undo() {
    if (blocked() || !steps.length || sheet?.open) return;
    if (serverDraft) serverDraft = { ...serverDraft, actions: serverDraft.actions.slice(0, -1), positions: serverDraft.positions.slice(0, -1) };
    const step = steps.pop()!; ++generation; board.skip(); pos = step.pre; lastMove = steps.at(-1) ?? history.at(-1);
    armed = undefined; armedCard = undefined; selected = inspected = held = undefined; choices([]);
    board.sync(pos); refresh(); saveDraft();
  }
  $('undo').onclick = undo;
  $('end-turn').onclick = () => {
    if (!view || !pos || blocked() || sheet?.open || view.action !== 'ready' || view.status !== 'playing' || !turn().ready) return;
    const actions = sendActions(steps, pos, view.seat, gameRules, previewPosition());
    $('board').focus({preventScroll:true});
    void call('kingdown_move', {game_id:view.game_id, command_id:crypto.randomUUID().replaceAll('-', ''), expected_revision:view.revision, actions}, true);
  };
  $('table-bar').onkeydown = event => { if (event.key.toLowerCase() === 'z' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); undo(); } };
  rollbackBoardMove = async (code?: string) => {
    if (!view) return;
    ++generation; board.skip(); animating = false;
    // W7 ticket 04: INVALID_MOVE drops the draft; the other codes re-read, and the redraw rule keeps or drops it.
    if (code === 'INVALID_MOVE') { steps = []; dropDraft(); }
    lastMove = steps.length ? steps.at(-1) : history.at(-1);
    pos = steps.length ? steps.at(-1)!.pos : gameRules.fromFen(view.fen); board.sync(pos); moveLine(); refresh();
    await call('kingdown_get', {}); refresh();
  };
  function choices(list: Choice[]) {
    $('move-hint').textContent = !list.length ? '' : list.every(({move}) => needsArming(move)) ? 'Choose a move below.' : 'Select a marked square to move, or choose a move below.';
    $('choices').replaceChildren(...list.map(({lan, move}) => { const b = button(describeMove(gameRules, pos!, move), () => choose(lan)); b.title = lan; return b; }));
  }
  $('app-frame').addEventListener('keydown', event => {
    if (event.key !== 'Escape' || client.state.screen !== 'board' && !sheet?.contains(event.target as Node)) return;
    event.preventDefault();
    if (animating) { cursorShown = false; drawCursor(); rush = true; board.skip(); if (sheet?.open) closeBoardSheet(); return; }
    cursorShown = false; armed = undefined; armedCard = undefined; selected = held = undefined; choices([]); refresh(); closeBoardSheet();
  }, { signal });
  function select(square: number, submit = true) {
    if (!view || !pos || !canRead()) return;
    // A second target tap plays the move. Any other tap ends the preview and only selects or reads.
    const hold = holding(); held = undefined;
    if (hold && submit && heldSquare(hold.move) === square) return choose(hold.lan);
    const targets = !hold && submit && canPlay() ? named().filter(({move}) => move.to === square || move.from === square) : [];
    if (targets.length === 1) return choose(targets[0].lan);
    if (targets.length > 1) { choices(targets); boardSheet('Choose a move', $('choices')); return; }
    if (submit && selected === square) { selected = inspected = undefined; choices([]); refresh(); return; }
    const options = hold || !submit || selected === undefined || !canPlay() ? [] : moves.filter(({move}) => move.from === selected && reachable(move) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
    const ordinary = options.filter(({move}) => !move.power), one = ordinary.length === 1 ? ordinary[0] : options.length === 1 ? options[0] : undefined;
    if (one && ownTarget(one.move, square)) { held = one; inspected = undefined; refresh(); return; }
    if (one) return choose(one.lan);
    if (options.length > 1) { choices(options); boardSheet('Choose a move', $('choices')); return; }
    if (!pos.board[square]) { selected = inspected = undefined; choices(named()); }
    else if (canPlay() && (colorOf(pos.board[square]) === view.seat || armedCard !== undefined && cardChoices().some(c=>c.move.from===square))) { selected = square; inspected = undefined; choices(moves.filter(({move}) => move.from === square && (armed || armedCard !== undefined || gameRules.rules.hands[view!.seat].length ? reachable(move) : true))); }
    else { inspected = square; }
    refresh();
  }
  function mountTable() {
    const screen = document.querySelector('[data-screen="board"]')!, table = $('game-table');
    // Moving an existing child resets its screen's scroll in WebKit.
    if (table.parentElement !== screen) screen.prepend(table);
    $('table-bar').hidden = false;
  }
  function bindBoard() {
    mountTable();
    if ($('board').parentElement !== $('game-table')) $('game-table').prepend($('board'));
    board.onSquareClick = square => { if (animating) { rush = true; board.skip(); return; } select(square); };
    board.onDragSelect = square => { if (animating) { rush = true; board.skip(); return; } select(square, false); };
    $('board').tabIndex = 0;
    $('board').onblur = () => { cursorShown = false; const hold = holding(); board.setPreview(hold ? heldSquare(hold.move) : null); drawCursor(); sayCursor(); };
    $('board').onkeydown = event => {
      // The cursor moves while play waits. Enter reads a square when motion stops.
      const delta = ({ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,1], ArrowDown:[0,-1]} as Record<string,number[]>)[event.key];
      if (delta) { event.preventDefault(); const d = view?.seat === 1 ? -1 : 1; cursor = Math.max(0, Math.min(7, cursor % 8 + delta[0] * d)) + 8 * Math.max(0, Math.min(7, Math.floor(cursor / 8) + delta[1] * d)); cursorShown = true; board.setPreview(cursor); drawCursor(); sayCursor(); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cursorShown = true; select(cursor); }
      else if (event.key.toLowerCase() === 'z' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); undo(); }
    };
  }
  function coinRead(side: Color, index?: number) {
    if (!view || !pos || !canRead()) return;
    if (index !== undefined) {
      const card = gameRules.rules.hands[side][index];
      const window = document.createElement('div'); window.className = 'cf-art'; window.innerHTML = cardArt(card);
      const nodes: HTMLElement[] = [window, text(ruleLine(cardText(card, gameRules.rules)))], diagram = cardDiagram(card);
      if (diagram) { const picture = document.createElement('div'); picture.className = 'card-diagram'; picture.innerHTML = diagram; nodes.push(picture); }
      let action: HTMLElement;
      const update = () => {
        const coin = cardCoins(pos!,side,gameRules.rules.hands[side],moves.map(c=>c.move))[index];
        const reason = cardUseReason(coin, side, view!, pos!, canPlay(), store.page());
        if (action?.textContent === (reason || 'Use')) return;
        const next = reason ? text(reason) : button('Use', () => {
          if (!canPlay()) return;
          armed = undefined; armedCard = index; selected = inspected = held = undefined; closeBoardSheet(); choices(cardChoices()); refresh();
        });
        if (reason) next.className = 'card-reason';
        const focused = action === document.activeElement;
        action?.replaceWith(next); action = next;
        if (focused) sheet.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.focus({preventScroll:true});
      };
      update(); nodes.push(action!);
      boardSheet(cardName(card), ...nodes);
      refreshCardSheet = update;
    } else {
      const coin = coinState(pos, side, gameRules.rules, [], side === view.seat && !!armed, moves.map(c => c.move), canPlay() ? view.seat : null);
      if (!coin) return;
      const nodes: HTMLElement[] = [text(coinWords(coin, pos)), text(ruleLine(powerText(coin.power, gameRules.rules)))];
      if (canPlay() && side === view.seat && ['ready','armed'].includes(coin.state) && POWER_TAG[coin.power]) nodes.push(button('Use', () => {
        if (!canPlay()) return;
        armed = coin.power; selected = inspected = held = undefined; closeBoardSheet(); choices(named()); refresh();
      }));
      boardSheet(coin.king + ' King', ...nodes);
    }
  }
  function strips() {
    if (tornDown || !view || !pos) return;
    // The deal starts when the board shows, not when the view arrives.
    if (dealing && client.state.screen === 'board') { dealing = false; dealtAt = performance.now(); }
    if (opening && client.state.screen === 'board') { opening = false; $('board').animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.05,.7,.1,1)' }); }
    const focused = document.activeElement?.closest('#strip-me, #strip-them') ? document.activeElement.id : '';
    for (const side of [0,1] as const) {
      const mine = side === view.seat, strip = $(mine ? 'strip-me' : 'strip-them');
      strip.classList.toggle('is-turn', view.status === 'playing' && view.turn === side);
      strip.innerHTML = '<div class="coin-row"><span class="portrait"><img alt=""></span></div><span class="player-name"><b></b><small></small></span>';
      strip.querySelector('img')!.src = art(portraitPath(side));
      if (checked !== null && pos.turn === side) moment(strip.querySelector<HTMLElement>('.portrait')!, 'is-checked', checkAt, 600);
      strip.querySelector('b')!.textContent = mine ? memory.me?.handle ?? 'You' : view.opponent?.computer ? 'Computer' : view.opponent?.deleted ? 'Deleted player' : view.opponent?.handle ?? 'Opponent';
      strip.querySelector('b')!.title = strip.querySelector('b')!.textContent;
      strip.querySelector('small')!.textContent = stripLine(side, mine ? ownRating : view.opponent?.rating, !mine && view.opponent?.computer ? view.level : undefined) + (!mine && thinking ? ' · thinking…' : '');
      const row = strip.querySelector('.coin-row')!, coin = coinState(pos, side, gameRules.rules, [], mine && !!armed, mine ? moves.map(c => c.move) : undefined, canPlay() ? view.seat : null);
      if (coin) {
        const b = button('', () => coinRead(side)); b.className = 'coin'; b.id = `power-${side ? 'b' : 'w'}`; b.dataset.state = coin.state; if (coin.state !== 'always') b.setAttribute('aria-pressed', String(coin.state === 'armed')); b.setAttribute('aria-label', (mine ? 'Your ' : "Opponent's ") + coinWords(coin, pos).replace(' · ', ', '));
        const paint = document.createElement('span'); paint.className = 'coin-paint'; b.append(paint);
        const image = document.createElement('img'); image.src = art(`ui/emblems/${coin.king.toLowerCase()}.webp`); image.alt = ''; paint.append(image);
        if (coin.total !== null && coin.total > 0) { const n = document.createElement('span'); n.className = 'notches'; n.setAttribute('aria-hidden','true'); for (let i=0;i<coin.total;i++) { const notch = document.createElement('span'); notch.className = 'notch' + (i < coin.spent ? ' is-spent' : ''); n.append(notch); } paint.append(n); }
        row.append(b);
      }
      for (const [index, card] of cardCoins(pos, side, gameRules.rules.hands[side], []).entries()) {
        const b = button('', () => coinRead(side, index)), image = document.createElement('img'), face = art(`ui/cards/${card.card.toLowerCase()}.webp`);
        const key = `${view.game_id}:${side}:${index}`;
        if (card.spent && cardSpent.get(key) === false && !matchMedia('(prefers-reduced-motion: reduce)').matches) { spentAt.set(key, performance.now()); setTimeout(strips, 300); }
        cardSpent.set(key, card.spent);
        b.className = 'coin card-coin'; b.id = `card-${side ? 'b' : 'w'}-${index}`;
        const spending = card.spent && moment(b, 'is-spending', spentAt.get(key) ?? -Infinity, 300);
        b.dataset.state = mine && armedCard === index && !card.spent ? 'armed' : card.spent && !spending ? 'used' : 'always';
        if (mine && !card.spent) b.setAttribute('aria-pressed', String(armedCard === index));
        if (!spending) { b.style.setProperty('--i', String(index)); moment(b, 'is-dealt', dealtAt, 560); } b.setAttribute('aria-label', (mine ? 'Your ' : "Opponent's ") + cardName(card.card) + (card.spent ? ', spent' : ''));
        const paint = document.createElement('span'); paint.className = 'coin-paint'; b.append(paint);
        if (face) { image.src = face; image.alt = ''; paint.append(image); }
        else paint.innerHTML = cardSymbol(card.card);
        row.append(b);
      }
    }
    if (focused) document.getElementById(focused)?.focus({preventScroll:true});
  }
  function turnControls(draft?: ReturnType<typeof draftTurn>) {
    if (!view || !pos) return;
    draft ??= turn();
    const open = blocked() || !!sheet?.open || client.state.screen !== 'board';
    const ready = !open && view.action === 'ready' && view.status === 'playing' && draft.ready;
    $('undo').setAttribute('aria-disabled', String(open || !steps.length));
    const end = $('end-turn'), label = mode() === 'computer' ? 'End turn' : 'Send your turn';
    end.setAttribute('aria-disabled', String(!ready)); end.setAttribute('aria-label', label); end.title = label; end.classList.toggle('primary', ready);
  }
  function refresh() {
    if (tornDown || !view || !pos) return;
    moves = draftChoices(view, pos, steps, gameRules, previewPosition());
    refreshCardSheet?.();
    const draft = turn();
    turnControls(draft);
    $('board').dataset.animating = String(animating);
    if (stale()) { armed = undefined; armedCard = undefined; selected = inspected = held = undefined; choices([]); }
    moveLine();
    updateTime();
    const check = (previewPosition()?.in_check ?? gameRules.inCheck(pos)) ? findKing(pos.board, pos.turn) : null;
    if (check !== checked) { checked = check; if (check !== null && board.motion()) checkAt = performance.now(); }
    // Show only the previewed move's marks.
    const hold = holding(), cands = hold ? [hold.move] : selected === undefined ? [] : moves.filter(({move}) => move.from === selected && reachable(move)).map(c => c.move), marks = marksModel(cands);
    // An armed power or target card has no selected piece; its marked squares are targets too.
    cursorTargets = [...marks.moves, ...marks.captures, ...marks.swaps, ...marks.shoves, ...named().map(c => c.move.to)];
    sayCursor();
    // Mark every step of the last turn (Haste, free marks); a pass step has no square.
    let start = history.length;
    if (lastMove && history.at(-1) === lastMove) while (start > 0 && history[start - 1].pre.turn === lastMove.pre.turn) start--;
    const trailSteps = steps.length ? steps : start < history.length ? history.slice(start) : lastMove ? [lastMove] : [];
    const trail = trailSteps.flatMap(({move: last}) => last.pass ? [] : [...(last.drop === undefined ? [last.from] : []), last.to, ...last.captures, ...(last.shove ? [last.shove.from, last.shove.to] : [])]);
    const users = selected === undefined ? cardChoices().filter(c => !c.move.pass && c.move.drop === undefined).map(c => c.move.from) : [];
    highlight({ ...marks, selected, last: [...new Set(trail)], read: inspected === undefined ? undefined : reachOf(gameRules, pos, inspected), powers: [...new Set([...cands.filter(m => m.power && !m.pass).map(m => m.to), ...named().map(c => c.move.to), ...users])], rails: selected === undefined ? [] : railsOf(gameRules.rules.design, pos.board, selected, [...marks.moves, ...marks.captures], marks.captures), check: (previewPosition()?.in_check ?? gameRules.inCheck(pos)) ? findKing(pos.board, pos.turn) : null, checkers: checkersOf(gameRules, pos), threats: view.status === 'playing' && !animating ? threatsIn(gameRules, {...pos, turn:view.seat}) : [] });
    const square = inspected ?? selected, code = square === undefined ? 0 : pos.board[square];
    const [line = '', states = ''] = square === undefined ? [] : readText(gameRules, pos, square).split('\n');
    const words = code ? `${pieceTitle(gameRules, code)}${states ? ' ' + states + '.' : ''}` : '';
    const available = boardActions(view,Date.now()-readAt), opponent = view.opponent?.handle ?? 'Your opponent';
    const deadline = available.claim === 'end' ? 'The first-turn deadline passes.' : available.claim ? view.days_per_move ? `${opponent} has not moved for ${view.days_per_move} day${view.days_per_move===1?'':'s'}.` : `${opponent} misses the move deadline.` : '';
    // Option A: Beginner notes; each enemy fairy action kind shows once a game, at the history length it first shows.
    const beginner = view.level === 'beginner', teach = beginner && lastMove && lastMove.pre.turn !== view.seat ? teachNote(lastMove.pre, lastMove.move, gameRules.rules) : undefined;
    const fresh = teach && (taught.get(teach[0]) ?? history.length) === history.length;
    const first = beginner && pos.ply < 2 && pos.board.some(c => c && typeOf(c) > K) ? 'New pieces in this game. Select any piece to read its rule.' : '';
    const lesson = beginner && code ? LESSONS.find(lesson => lesson.name.toLowerCase() === gameRules.nameOf(typeOf(code)))?.done : undefined;
    // Only a refusal shows in the board's words area; a read or an error keeps to the message line.
    // W7 ticket 04, T6: a press refused with STALE_REVISION or WRONG_TURN keeps the draft and says what to do next.
    const refusalNotice = store.refusal(), shown = refusalNotice && noticeShows(store.page(), refusalNotice);
    const t6 = shown && steps.length && ['STALE_REVISION', 'WRONG_TURN'].includes(refusalNotice!.code ?? '')
      ? (mode() === 'computer' ? 'The game changed. Check it, then tap End turn.' : 'The game changed. Check it, then tap Send your turn.') : '';
    const refusal = t6 || (shown ? refusalNotice!.text : '');
    const context = contextLine({voice:'you', teach:(fresh ? teach[1] : '') || first, result:view.result ? ending(view) : '', refusal, link:deadline, read:inspected === undefined ? '' : words, selected:words, readNote:lesson ?? line.split(' · ')[1] ?? '', check:view.in_check && view.turn === view.seat, checkCause:checkCause(gameRules, pos, lastMove?.move, 'link', view.seat), computer:view.turn !== view.seat, midWay:view.turn === view.seat && draft.midWay && !draft.waits, stagedEnd:draft.waits && (previewPosition()?.status ?? gameRules.status(pos)) !== 'playing' ? draft.line : '', waiting:draft.waits, free:!!pos.free, turnLine:draft.line, armed, armedLine:armed ? coinWords(coinState(pos,view.seat,gameRules.rules,[],true)!,pos) : ''});
    if (sending() && ['mid-way','waiting','staged-end'].includes(context.rank)) Object.assign(context, {rank:'sending', line:'Sending…', note:''});
    if (inspected !== undefined && draft.waits && !networkBlocked() && view.draw_offer == null && !['result','refusal','link'].includes(context.rank)) context.note = waitNotice(mode(), view.seat);
    if (context.rank==='link' && deadline) context.note=available.claim==='end'?'You may end the game with no result.':'You may claim the win.';
    // G1 a: put the target words first so a short screen keeps the next action in view.
    if (armedCard !== undefined && !['result','refusal','link'].includes(context.rank)) {
      const card = gameRules.rules.hands[view.seat][armedCard], squares = named().length && named().length === cardChoices().filter(c => !c.move.pass).length;
      Object.assign(context, {rank:'armed', line:`${cardName(card)}.`, note:`${squares ? 'Select a marked square.' : 'Choose a marked piece, then a marked square.'} ${ruleLine(cardText(card, gameRules.rules))}`});
    } else if (armed && context.rank === 'armed') Object.assign(context, {note:`${context.note} ${ruleLine(powerText(armed, gameRules.rules))}`});
    // Keep the armed row size while the preview asks for a second tap and names the result.
    if (hold && !['result','refusal','link'].includes(context.rank)) Object.assign(context, {rank:context.rank === 'armed' ? 'armed' : 'held', line:`Select again to ${hold.move.shove ? 'shove' : 'swap'}.`, note:describeMove(gameRules, pos, hold.move)});
    if (view.draw_offer != null && (t6 || !['result','refusal','link'].includes(context.rank))) context.note = [context.note, view.draw_offer === view.seat ? 'Draw offered. Waiting for your opponent.' : 'Your opponent offers a draw.'].filter(Boolean).join(' ');
    if (stale()) Object.assign(context, {rank:'link', line:'Not current', note:''});
    $('status').textContent = context.rank === 'refusal' ? t6 : context.line;
    $('context-note').textContent = ['armed','held'].includes(context.rank) ? [context.note, memory.blockNotice].filter(Boolean).join(' ') : memory.blockNotice || context.note;
    if (fresh && $('context-note').textContent?.includes(teach[1])) taught.set(teach[0], history.length);
    $('context-text').dataset.rank = context.rank;
    $('context-text').tabIndex = context.rank === 'armed' ? 0 : -1;
    const actions: HTMLButtonElement[] = [];
    const drawReply = !view.result && view.draw_offer != null && view.draw_offer !== view.seat && view.kind !== 'solo';
    const unarmed = !armed && armedCard === undefined;
    const all = $<HTMLButtonElement>('all-rules');
    all.hidden = !unarmed || square === undefined || !code;
    if (!all.hidden) {
      const type = typeOf(code);
      const face = art(type === K ? portraitPath(colorOf(code)) : `ui/pieces/${NAMES[type]}-${colorOf(code) ? 'b' : 'w'}.webp`);
      all.innerHTML = `<span class="portrait" aria-hidden="true">${face ? `<img id="piece-info-art" alt="" src="${face}">` : ''}</span>`;
      if (!face) all.firstElementChild!.textContent = (type === T && gameRules.playedDesign()?.letter) || LETTERS[type];
      all.onclick = () => boardSheet('All rules', text(lesson ? `${lesson}\n\n${readText(gameRules, pos!, square!)}` : readText(gameRules, pos!, square!)));
    }
    if ((!drawReply || unarmed) && selected !== undefined && moves.some(({move}) => move.from === selected && !move.pass && needsArming(move))) actions.push(button('Choose a move', () => boardSheet('Choose a move', $('choices'))));
    if (!unarmed) actions.push(button('Cancel', () => { armed = undefined; armedCard = undefined; held = undefined; choices([]); refresh(); }));
    const gameActions = actionButtons(view,Date.now()-readAt,refused);
    if (!view.result) actions.push(...gameActions);
    // Spec J3: after your move in a game the opponent answers later, go on to the next game that waits for you.
    const next = shownNextGame = nextReadyGame();
    if (next) { const b = button('Next game ›', () => void call('kingdown_resume', { game_id: next })); b.id = 'next-game'; actions.push(b); }
    for (const action of actions) action.disabled = networkBlocked() && action.textContent !== 'All rules';
    $('context-actions').replaceChildren(...actions); strips();
    // Q3 b: a draw offer keeps the board's size. Pin the board to its last size with no reply, and the
    // screen scrolls to the replies (app.css). A fresh mount with an offer keeps the phone floor.
    const table = $('game-table');
    if (drawReply) { table.dataset.replies = ''; if (boardRoom) table.style.setProperty('--board-floor', `${boardRoom}px`); }
    else { delete table.dataset.replies; table.style.removeProperty('--board-floor'); boardRoom = $('board').getBoundingClientRect().height || boardRoom; }
    board.setLifted(selected ?? null); board.setPreview(hold ? heldSquare(hold.move) : cursorShown ? cursor : null); drawCursor();
    // Never lay the king down on the position before the final move.
    const fallen = !animating && view.result?.reason === 'checkmate' && view.result.winner !== null ? findKing(pos.board,(1-view.result.winner) as Color) : null;
    const win = view.result?.winner === view.seat;
    if (!$('board').dataset.toppling) board.setFallen(fallen, toppling && win && fallen !== null);
    if (toppling && win && fallen !== null && board.motion()) kingDown(fallen);
    if (fallen !== null) toppling = false;
  }
  // Keep the short web ceremony. Skip and See the board work at once.
  function kingDown(fallen: number) {
    const words = document.createElement('div'); words.className = 'kd-words is-in'; words.textContent = 'King Down'; words.hidden = true; words.setAttribute('aria-hidden', 'true');
    $('board').append(words); $('board').dataset.toppling = 'true';
    const show = setTimeout(() => { words.hidden = false; }, 650), done = setTimeout(skip, 1130);
    function skip() { clearTimeout(show); clearTimeout(done); words.remove(); delete $('board').dataset.toppling; board.setFallen(fallen, false); stopCeremony = () => {}; }
    stopCeremony = skip;
  }
  $('reload').addEventListener('click', closeBoardSheet, { signal });
  $('board-menu').onclick = () => {
    const chooseMove = button('Choose a move', () => {
      if (canPlay() && selected === undefined && !armed && armedCard === undefined) choices(moves.filter(({move}) => !move.pass && reachable(move)));
      boardSheet('Choose a move', $('choices'));
    }); chooseMove.className = 'game-action';
    const actions = [chooseMove, ...view ? [...actionButtons(view, Date.now() - readAt, refused, true), ...playerBlockButton(view)] : []];
    for (const action of actions) action.disabled = networkBlocked();
    const policy = view && button(`${policyLabel(view.rating_policy, view.kind)} game`, () => boardSheet(policyLabel(view!.rating_policy, view!.kind), text(policyDetail(view!.rating_policy, view!.kind))));
    boardSheet('Menu', button('Moves', showMoves), ...actions, button('Settings', () => { closeBoardSheet(); navigate('settings'); }), $('reload'), $('invite'), $('invitation'));
    if (policy) { policy.id = 'game-policy'; sheet.querySelector('.sheet-head')!.insertBefore(policy, sheet.querySelector('[aria-label="Close"]')); }
    sheet.classList.add('board-menu');
  };
  function moveRows() { return history.map(step => text(`Move ${moveNumber(step.pre)}. ${step.words}`)); }
  function movesOpen() { return !!sheet?.open && sheet.querySelector('h2')?.textContent === 'Moves'; }
  function showMoves() { boardSheet('Moves', ...moveRows()); $('moves-line').setAttribute('aria-expanded', 'true'); }
  let movesChoice: boolean | undefined;
  let bandFits = false;
  const recentMoves = $('recent-moves');
  function fitMoves() {
    const band = $('moves-band').getBoundingClientRect(), line = $('moves-line').getBoundingClientRect();
    bandFits = matchMedia('(max-width: 899px) and (orientation: portrait)').matches && line.height > 0 && band.height >= 108;
    const open = active() && bandFits && (movesChoice ?? history.length > 0);
    recentMoves.hidden = !open;
    $('moves-line').setAttribute('aria-expanded', String(open || movesOpen()));
    if (open) recentMoves.scrollTop = recentMoves.scrollHeight;
  }
  const movesObserver = new ResizeObserver(fitMoves); movesObserver.observe($('moves-band'));
  $('moves-line').onclick = () => {
    if (!bandFits) { showMoves(); return; }
    movesChoice = !!recentMoves.hidden;
    fitMoves();
  };
  bindBoard();
  // The store replaces the #reload, data-page and #error observers; a sync also schedules the computer and updates End.
  // The board redraws on a screen change, or when its game, board data, lock or refusal changes. An equal-revision poll
  // reply changes only opponent and server_now, so the key holds and the coin row (and its focus) stay (design §3.4).
  const key = (p: Page) => { const l = locks(p); return [p.screen, p.view?.game_id, p.view?.revision, p.view?.status, p.view?.fen, l.game, l.blocked, staleRead(p), p.notice?.kind === 'refusal' ? p.notice.text : ''].join('|'); };
  const unsubscribe = store.subscribe((page, before) => { if (active()) { if (key(page) !== key(before)) refresh(); if (page.screen !== before.screen) restorePreview(); } else { movesChoice = undefined; fitMoves(); skipBoardCeremony(); } scheduleComputer(); if (client.state.screen === 'end') updateEnd(); });
  const resultObserver = new MutationObserver(() => { if (active()) refresh(); else skipBoardCeremony(); scheduleComputer(); if (client.state.screen === 'end') updateEnd(); });
  resultObserver.observe($('over'), {attributes:true, attributeFilter:['open']});
  const sheetObserver = new MutationObserver(() => turnControls());
  sheetObserver.observe($('app-frame'), {attributes:true, attributeFilter:['open'], subtree:true});
  const draw = (next: View, restoring = false) => {
    if (tornDown) return;
    if (view?.game_id === next.game_id && next.revision < view.revision) return;
    const before = view, same = view?.game_id === next.game_id, previousDraft = serverDraft;
    if (!same || next.status !== 'finished') skipBoardCeremony();
    if (same && before?.status === 'playing' && next.status === 'finished') { toppling = true; guardEndTaps(next.game_id); }
    // A live game start: the cards deal once, and after the seat both Ready open the board.
    const started = !restoring && next.status === 'playing' && next.history?.actions.length === 0 && (!same || before?.status === 'setup') && board.motion();
    if (started && next.options?.cards) dealing = true;
    if (started && (next.options?.arrangement || next.options?.kingPowers)) opening = true;
    const unchanged = same && before?.revision === next.revision && before.fen === next.fen && before.status === next.status && before.engine_fingerprint === next.engine_fingerprint;
    view = {...next, rules:next.rules ?? (same ? view?.rules : undefined), outcome:next.outcome ?? (same ? view?.outcome : undefined), opponent:next.opponent && {...next.opponent, rating:next.rules ? next.opponent.rating : next.opponent.rating ?? (same ? view?.opponent?.rating : undefined)}};
    if (['finished','aborted'].includes(next.status)) setTimeout(()=>{
      if (tornDown || !active() || view?.game_id !== next.game_id) return;
      if (client.state.screen === 'board') {
        if (next.kind === 'solo' && next.result?.reason === 'abort') routeView(next);
        else navigate('end');
      }
      updateEnd();
    },0);
    readAt = Date.now(); clearTimeout(deadlineTimer);
    if (view.rules) { gameRules = new GameRules(view.rules); board.setRules(gameRules); }
    if (unchanged) {
      // A poll still replaces private data above. Keep an open choice and its focus unless
      // the visible opponent or available actions changed; notice changes refresh via the store.
      if (pos && (JSON.stringify(before.opponent) !== JSON.stringify(view.opponent) || before.rematch_allowed !== view.rematch_allowed || before.abort_open !== view.abort_open || before.draw_offer !== view.draw_offer || before.action !== view.action || before.deadline_at !== view.deadline_at || shownNextGame !== nextReadyGame())) refresh();
      else if (pos) updateTime();
      restorePreview();
      scheduleComputer(); return;
    }
    previewAbort?.abort(); previewAbort = undefined; previewing = false; serverDraft = undefined;
    const token = ++generation; board.skip(); animating = false; $('board').dataset.animating='false';
    if (!same) { movesChoice = undefined; history = []; lastMove = undefined; steps = []; computerCalls = 0; clearTimeout(thinkingTimer); thinking = false; refused.clear(); taught.clear(); }
    if (next.turn === next.seat || next.status !== 'playing') { computerCalls = 0; clearTimeout(thinkingTimer); thinking = false; }
    const local = steps; steps = []; if (local.length) lastMove = history.at(-1);
    armed = undefined; armedCard = undefined; selected = inspected = held = undefined;
    const keepMoves = same && next.status === 'playing' && movesOpen();
    if (!keepMoves && !(same && next.status === 'finished' && client.state.screen === 'end' && !$<HTMLDialogElement>('over').open)) closeBoardSheet();
    choices([]);
    mountTable();
    $('game-table').dataset.empty = String(!next.fen || next.status === 'setup');
    if (!next.fen || next.status === 'setup') { dropDraft(); $('all-rules').hidden = true; pos = undefined; $('strip-me').replaceChildren(); $('strip-them').replaceChildren(); $('context-actions').replaceChildren(); $('context-note').textContent = ''; $('last-move').textContent = ''; $('short-move-words').textContent = ''; $('move-time-left').textContent = ''; $('status').textContent = next.result ? ending(next) : next.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : 'Choose your king and arrangement.'; $('computer').hidden = true; $('invite').hidden = next.kind !== 'friend' || next.status !== 'waiting'; return; }
    pos = gameRules.fromFen(next.fen);
    const replayed = before && same ? replayLans(before, next, view.rules!) : undefined;
    const restored = replayHistory(next, view.rules!);
    const verified = before && same && previousDraft ? committedPreview(before, next, previousDraft, gameRules) : undefined;
    if (restored) { history = restored; lastMove = restored.at(-1); }
    else if (replayed) { history.push(...replayed); if (replayed.length) lastMove = replayed.at(-1); }
    else if (verified) { history.push(...verified); lastMove = verified.at(-1); }
    else if (same && before?.revision !== next.revision) {
      if (local.length && toFen(local.at(-1)!.pos) === next.fen) { history.push(...local); lastMove = local.at(-1); } else lastMove = undefined;
    }
    // Restore only a draft of this authoritative base and a legal replay.
    const savedDraft = client.state.draft, draftRules = view.rules;
    if (savedDraft && draftRules && !remote()) {
      const draftSteps = restoreDraft(view, savedDraft, draftRules, client.accountId);
      if (draftSteps?.length) {
        steps = draftSteps; lastMove = draftSteps.at(-1)!; pos = draftSteps.at(-1)!.pos;
        if (savedDraft.scope?.revision !== view.revision) saveDraft();
      }
      else dropDraft();
    }
    moves = draftChoices(view, pos, steps, gameRules, previewPosition());
    bindBoard(); board.flip(next.seat === 1); moveLine();
    const replay = replayed?.filter((step, index) => !step.move.pass && !(local[index] && toFen(local[index].pos) === toFen(step.pos))) ?? [];
    const authoritative = pos;
    if (replay.length) {
      animating = true; rush = false;
      void (async () => {
        for (const step of replay) {
          if (token !== generation) return;
          const hit = hitSound(step, token);
          if (!rush && step.move.drop === undefined) await board.animateMove(step.pre, step.move, hit);
          if (token !== generation) return;
          board.sync(step.pos); hit(); if (previewPosition()?.in_check ?? gameRules.inCheck(step.pos)) snd.check();
        }
        if (token === generation) { board.sync(authoritative); animating = false; refresh(); scheduleComputer(); }
      })();
    } else board.sync(pos);
    $('computer').hidden = true; $('invite').hidden = true;
    refresh(); scheduleComputer();
    restorePreview();
    if (!profileRead) { profileRead = true; void client.call('kingdown_profile', {}, {background:true}).then(result => { if (tornDown || queue.closed()) return; ownRating = (result._meta?.record as PlayerRecord | undefined)?.rating; if (active()) strips(); }).catch(() => {}); }
  };
  return Object.assign(draw, { dispose() {
    if (tornDown) return;
    tornDown = true; ++generation; previewAbort?.abort(); previewAbort = undefined;
    skipBoardCeremony(); stopPlacingChoice(); refreshCardSheet = undefined;
    clearTimeout(thinkingTimer); clearTimeout(deadlineTimer);
    events.abort(); unsubscribe(); cursorObserver.disconnect(); movesObserver.disconnect(); resultObserver.disconnect(); sheetObserver.disconnect();
    disposeBoard(); view = undefined; pos = undefined; history = []; lastMove = undefined; steps = [];
  } });
}
