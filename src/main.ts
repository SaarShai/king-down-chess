import './style.css';
import { SkillName, skillPlan } from './ai/skill';
import { Engine, Game, Side } from './game';
import { setEvaluator } from './ai/eval';
import { positionKey } from './ai/search';
import { BoardRenderer } from './render/renderer';
import { PaintedView, type BoardView } from './render/PaintedView';
import { momentKind, momentText } from './moment';
import { setSound, snd } from './render/sfx';
import { STYLES } from './render/styles';
import { loadModels } from './render/voxels';
import { A, B, C, Color, G, K, L, LETTERS, M, Move, N, NAMES, O, P, PieceType, Q, R, RULES as GAME_RULES, RULES_2017, RULES_2021, S, SPENT, T, V, colorOf, findKing, kingLabel, KingChoice, PowerName, parseKings, setRules, sqName, typeOf, type Rules } from './rules/engine';
import { CLASSIC_CHESS, fromFen, POOL, randomBackRank, toFen } from './rules/setup';
import { TRY_THESE } from './try-these';

const params = new URLSearchParams(location.search);
/** `?rules=2017|2021` plays an older rule set. No parameter = the measured 2026 rules. */
const preset = { 2017: RULES_2017, 2021: RULES_2021 }[params.get('rules') ?? ''];
/**
 * `?kings=spirit:mercy,mud:march` — White first; one value gives both sides the same king
 * (docs/RULES.md §4, docs/KINGS-POWERS-PLAN.md §3.2). The default is **no powers** (decision 21):
 * nothing ships un-measured, and there is no picker until a run has priced them.
 */
const kings = params.get('kings');
// Before the first Game: its constructor builds a position and asks for its status.
if (preset || kings) setRules({ ...preset, ...(kings ? { kings: parseKings(kings) } : {}) });
/** One line per power, for the info card. The six built powers only; tier 2–3 cannot be selected. */
const POWER_TEXT: Partial<Record<PowerName, string>> = {
  HolyLight: 'enemy pawns cannot take this king, and it cannot take pawns',
  Strike: 'once per game, move any piece except the king as if it were a queen',
  Mercy: 'the king steps 1–2, jumps friends and takes only a guard',
  DeathTouch: 'the king takes an adjacent enemy without moving — it can only take this way',
  Darkness: 'pawns step diagonally and take straight ahead, with no double step',
  March: 'pawns step two squares from any rank',
  Leap: 'rooks, bishops and the queen pass over their own pawns',
};
const powerLabel = (k: KingChoice | null): string => (k
  ? `${k.king}:${k.power} — ${POWER_TEXT[k.power] ?? 'a lab power'}`
  : 'plain king');

/** One line for the info card, so a `?kings=` game says on screen which powers are live. */
const kingsInfo = (): string => {
  const [w, b] = GAME_RULES.kings;
  if (!w && !b) return '';
  const same = w && b && w.king === b.king && w.power === b.power;
  return same
    ? `<div>Kings — both ${powerLabel(w)}</div>`
    : `<div>Kings — White ${powerLabel(w)} · Black ${powerLabel(b)}</div>`;
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

// The adopted Q6 residual net: stronger play at the same time budget, validated before adoption.
setEvaluator('residual');
const game = new Game();
const engine = new Engine();
/** `?look=painted|clay`, else the saved choice. Painted 2D is the default (owner, 2026-09-27). */
const LOOK_KEY = 'kingdown.look';
const look = params.get('look') ?? (() => { try { return localStorage.getItem(LOOK_KEY); } catch { return null; } })() ?? 'painted';
const view: BoardView = look === 'clay' ? new BoardRenderer($('board')) : new PaintedView($('board'));
$<HTMLSelectElement>('look').value = look === 'clay' ? 'clay' : 'painted';
$<HTMLSelectElement>('look').onchange = () => {
  try { localStorage.setItem(LOOK_KEY, $<HTMLSelectElement>('look').value); } catch { /* private mode: the URL still switches */ }
  const url = new URL(location.href);
  url.searchParams.set('look', $<HTMLSelectElement>('look').value);
  location.href = url.href;
};
$('reset-view').hidden = look !== 'clay';
view.onLoadError = () => { $('asset-status').textContent = 'A piece model could not load. Reload this page to retry.'; };
(window as unknown as Record<string, unknown>).view = view; // tools/styleboard2.mjs aims its crops with view.screenOf()
const sides: [Side, Side] = ['human', 'ai'];
let selected: number | null = null;
let pending: number[] = []; // beast chain squares clicked so far
let hovered: number | null = null;
let resigned: Color | null = null;
let busy = false;
/** The in-flight token. reset() bumps it; every await in commit/maybeAi/choose drops out if it changed. */
let gen = 0;
/** Closes an open promotion picker (resolving it with null). Set only while one is on screen. */
let closePromo: (() => void) | null = null;
let closeMoveChoice: (() => void) | null = null;
/** Squares lit by Hint. Cleared when the player moves or selects something else. */
let hintSquares: number[] = [];
const seenMoments = new Set<string>();

/** The game is over: mate, a draw, or somebody resigned. Blocks input and the AI. */
const finished = (): boolean => resigned != null || game.status !== 'playing';

/** Player-facing columns for one piece under the live `GAME_RULES` (and `POOL`). */
type GuideRow = { moves: string; captures: string; special: string };

const ARCHER_SHOT_TEXT: Record<string, string> = {
  classic: 'Shoots without moving: an enemy diagonally adjacent, or exactly 2 squares away orthogonally, through blockers.',
  plusDiag2: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus any enemy exactly 2 squares away diagonally, through blockers.',
  ring2: 'Shoots without moving: any enemy on a diagonally adjacent square or anywhere on the ring 2 squares away, through blockers.',
  forward3: 'Shoots without moving: an enemy on either forward diagonal, or the square exactly 2 ahead, through blockers.',
  plusDiagFwd2: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus either forward diagonal at distance 2, through blockers.',
};

/** Chess pieces always; fairies in POOL or the fixed set A L G M S O. */
function guideTypes(): PieceType[] {
  const always = new Set<PieceType>([P, N, B, R, Q, K, A, L, G, M, S, O]);
  for (const ch of POOL) {
    const t = LETTERS.indexOf(ch) as PieceType;
    if (t > 0) always.add(t);
  }
  for (const p of game.pos.board) if (p) always.add(typeOf(p));
  return [...always].sort((a, b) => a - b);
}

/** One guide for both the dialog table and the hover card — reads live rules and POOL. */
function pieceGuide(t: PieceType): GuideRow {
  const r = GAME_RULES;
  switch (t) {
    case P:
      return {
        moves: 'Moves 1 square forward, 2 from its start rank.',
        captures: 'Takes 1 square diagonally forward.',
        special: 'Promotes on the last rank.',
      };
    case N:
      return { moves: 'Moves in an L (2 + 1) over any piece.', captures: 'Takes by moving onto the enemy.', special: '' };
    case B:
      return { moves: 'Moves any distance diagonally.', captures: 'Takes by moving onto the enemy.', special: '' };
    case R:
      return { moves: 'Moves any distance orthogonally.', captures: 'Takes by moving onto the enemy.', special: '' };
    case Q:
      return { moves: 'Moves any distance in a straight line.', captures: 'Takes by moving onto the enemy.', special: '' };
    case K:
      return {
        moves: 'Moves 1 square in any direction.',
        captures: 'Takes by moving onto the enemy.',
        special: 'Only a king can take a guard.',
      };
    case A: {
      const step = r.archerMove === 'ortho' ? 'Moves 1 square orthogonally.'
        : r.archerMove === 'fwdBack' ? 'Moves 1 square ahead or back.'
        : 'Moves 1 square in any direction.';
      return {
        moves: step,
        captures: ARCHER_SHOT_TEXT[r.archerShots] ?? ARCHER_SHOT_TEXT.classic,
        special: 'Never captures by moving onto a piece. ' + (r.archerChecks ? 'Gives check the same way it shoots.' : 'Cannot capture a king or give check.'),
      };
    }
    case L: {
      const die = r.paladinKamikaze === 'always' ? 'Removed after capturing anything.'
        : r.paladinKamikaze === 'never' ? 'Survives its own captures.'
        : 'Removed after capturing anything but a pawn.';
      const check = r.paladinChecks
        ? 'May capture a king (gives check).'
        : 'Cannot capture a king (never gives check).';
      const promo = r.promotionSet === 'anyNonKing' || r.promotionSet === 'anyNonKingNoGuard';
      const draw = POOL.includes('L')
        ? 'In the random draw.'
        : promo
          ? 'Not in the random draw. Custom setup, FEN, and promotion can still use it.'
          : 'Not in the random draw. Custom setup and FEN can still place it. A pawn does not promote to it.';
      return {
        moves: 'Moves like a queen, jumping own pieces.',
        captures: 'Takes by moving onto the enemy.',
        special: `${check} ${die} ${draw}`,
      };
    }
    case G:
      return {
        moves: 'Moves 1 square in any direction, empty squares only.',
        captures: 'Cannot capture.',
        special: 'Immortal wall: cannot be captured, except by a king.',
      };
    case M: {
      const long = r.maesterLongSwap
        ? ' Maester + own king both on their home rank: swap at any distance.'
        : '';
      const any = r.maesterSwapAny ? ' Swaps with any friendly piece anywhere.' : '';
      return {
        moves: 'Moves 1 square in any direction.',
        captures: 'Takes an adjacent enemy.',
        special: `Onto an own piece = swap places.${long}${any}`,
      };
    }
    case S: {
      const step = r.beastMove === 'forward' ? 'Moves 1 square straight ahead, empty only.'
        : r.beastMove === 'diagFwdBack' ? 'Moves on the four diagonals, empty only.'
        : 'Moves 1 square in any direction, empty squares only.';
      let take: string;
      if (r.beastCapture === 'diagForward') take = 'Takes on either forward diagonal.';
      else if (r.beastCapture === 'diagonal') take = 'Takes on any of the four diagonals.';
      else take = r.beastCaptureForward
        ? 'Takes on any adjacent square.'
        : 'Takes on any adjacent square but straight ahead.';
      return {
        moves: step,
        captures: take,
        special: r.beastChains ? 'May keep capturing from each new square (never a king as a continuation). Click victims in order; "Finish chain" ends early.' : 'One capture per turn.',
      };
    }
    case O: {
      const shove = r.ogreMode === 'push'
        ? 'Push: the ogre steps into the square the neighbour left.'
        : 'Repel: the neighbour moves away and the ogre stays.';
      return {
        moves: 'Moves 1 square in any direction.',
        captures: 'Takes by moving onto the enemy (a guard excepted).',
        special: `Instead it may shove an adjacent piece 1 square away. Tap the neighbour; choose Capture or Push when both are legal. Shift-click is a push shortcut. ${shove} Kings are never shoved. Guards can be shoved. A shove is not a capture.`,
      };
    }
    case C:
      return {
        moves: 'Moves like a rook and never takes by moving.',
        captures: 'Lobs along a rank or file over one enemy screen and takes the first piece beyond it.',
        special: '',
      };
    case V:
      return {
        moves: 'Moves like a knight. After a capture it may step one square onto an empty square as part of the same move.',
        captures: 'Takes like a knight; the step after never captures.',
        special: 'Click the victim, then the landing square.',
      };
    case T:
      return {
        moves: 'Moves 1 square in any direction; on a capital square (d4 e4 d5 e5) it moves and captures like a queen.',
        captures: 'Takes by moving onto the enemy.',
        special: '',
      };
    default:
      return { moves: '', captures: '', special: '' };
  }
}

function fillPieceGuide(): void {
  const rows = $('rules-rows');
  rows.innerHTML = '';
  for (const t of guideTypes()) {
    const g = pieceGuide(t);
    const tr = document.createElement('tr');
    const letter = LETTERS[t];
    const name = NAMES[t][0].toUpperCase() + NAMES[t].slice(1);
    tr.innerHTML = `<td>${letter} ${name}</td><td>${g.moves}</td><td>${g.captures}</td><td>${g.special}</td>`;
    rows.appendChild(tr);
  }
  const poolLetters = POOL.split('').join(' ');
  const promo = GAME_RULES.promotionSet === 'anyNonKing'
    ? 'A pawn promotes to any piece but a king.'
    : GAME_RULES.promotionSet === 'anyNonKingNoGuard'
      ? 'A pawn promotes to any piece but a king or a guard.'
      : 'A pawn promotes to a queen, rook, bishop, or knight.';
  $('rules-lead').textContent =
    `Mate the king. Both sides share one random back rank, drawn from the pool. No castling or en passant. ${promo}`;
  $('rules-letters').textContent =
    `The random draw pool is ${poolLetters}. Seven pieces join the king; two drawn bishops start on opposite colours. Custom setup and a pasted position can place other pieces.`;
}

function showInfo(sq: number | null): void {
  const code = sq == null ? 0 : game.pos.board[sq];
  const t = code ? typeOf(code) : 0;
  const g = t ? pieceGuide(t) : null;
  const blurb = g ? [g.moves, g.captures, g.special].filter(Boolean).join(' ') : '';
  $('info').innerHTML = (code
    ? `<b>${colorOf(code) ? 'Black' : 'White'} ${NAMES[t]}</b><br>${blurb}`
      // Lab only (docs/RULES.md §6.9): the shipped guard never captures, so it can never be spent.
      + (code & SPENT ? ' <b>This guard has used its capture.</b>' : '')
    : '') + kingsInfo();
}

/** Squares the user clicks to identify a move: a shove target, chain victims, shot target, or the destination. */
const clickPath = (m: Move): number[] => (m.shove
  ? [m.shove.from] // click the neighbour to shove, under both `repel` (to === from) and `push`
  : m.to === m.from ? [m.captures[0]]
  : m.captures.length > 1 ? m.captures
  // Reaver: click the victim, then the landing square (`Vb1xc3-d3`).
  : m.captures.length === 1 && m.to !== m.captures[0] ? [m.captures[0], m.to]
  : [m.to]);
const candidates = (): Move[] =>
  selected == null ? [] : game.legal.filter(m => m.from === selected && pending.every((sq, i) => clickPath(m)[i] === sq));

function refresh(): void {
  const cands = candidates();
  const next = cands.map(m => clickPath(m)[pending.length]).filter((s): s is number => s != null);
  const swaps = cands.filter(m => m.swap).map(m => m.to);
  const shoves = cands.filter(m => m.shove).map(m => m.shove!.from);
  const last = game.history.at(-1)?.move;
  view.highlight({
    selected,
    moves: next.filter(sq => !game.pos.board[sq]),
    captures: next.filter(sq => game.pos.board[sq] !== 0 && !swaps.includes(sq) && !shoves.includes(sq)),
    swaps,
    shoves,
    last: last ? [last.from, ...(last.shove ? [last.shove.from, last.shove.to] : last.to === last.from ? last.captures : [last.to])] : [],
    hint: hintSquares,
    check: game.inCheck ? findKing(game.pos.board, game.pos.turn) : null,
  });
  const canFinish = pending.length > 0 && cands.some(m => clickPath(m).length === pending.length);
  const selectedType = selected == null ? 0 : typeOf(game.pos.board[selected]);
  $('selection-actions').hidden = selected == null || busy;
  $('stop-chain').hidden = !canFinish;
  $('stop-chain').textContent = selectedType === S ? `Finish chain (${pending.length} capture${pending.length === 1 ? '' : 's'})` : 'Finish capture here';
  const help: Partial<Record<PieceType, string>> = {
    [O]: 'Tap a neighbour to push or capture. When both are legal, you can choose.',
    [A]: 'Tap a marked enemy to shoot without moving, or a marked empty square to move.',
    [M]: 'Tap a marked friendly piece to swap places, or another marked square to move or capture.',
    [S]: pending.length ? 'Choose the next marked victim, or finish the chain below. Nothing moves until you finish.' : 'Tap a marked enemy to start a capture chain, or an empty square to move.',
    [L]: 'Jump over friends along queen lines. Capturing a non-pawn also removes your Paladin.',
    [C]: 'Tap a marked enemy beyond a screen to lob, or an empty square to move.',
    [V]: pending.length ? 'Choose a marked landing square, or finish the capture here.' : 'Tap a marked enemy to capture, then choose where to land.',
  };
  $('move-help').textContent = selected == null || busy ? '' : help[selectedType as PieceType] ?? 'Tap a marked square to move or capture.';
  const turn = game.pos.turn ? 'Black' : 'White';
  $('turn').textContent = finished() ? '' : `${turn} to move${game.inCheck ? ' — CHECK' : ''}`;
  $('status').textContent = resigned != null ? result() : {
    playing: busy && sides[game.pos.turn] === 'ai' ? 'thinking…' : '',
    checkmate: result(),
    stalemate: 'Stalemate — draw',
    draw50: 'Draw — 50-move rule',
    drawRepetition: 'Draw — threefold repetition',
    drawMaterial: 'Draw — insufficient material',
  }[game.status];
  $('setup').textContent = game.backRank || 'custom';
  $('setup').title = toFen(game.pos);
  const moves = $('moves');
  moves.innerHTML = game.history.map((h, i) => (i % 2 === 0 ? `<li>${i / 2 + 1}. <b>${h.lan}</b>` : ` ${h.lan}</li>`)).join('');
  moves.scrollTop = moves.scrollHeight;
  // Captured pieces: a piece the mover removed counts for the mover; a paladin that removes itself is its own side's loss.
  const taken: [number[], number[]] = [[], []];
  for (const h of game.history) {
    const mover = colorOf(h.pos.board[h.move.from]);
    for (const c of h.move.captures) taken[mover].push(h.pos.board[c]);
    if (h.move.selfRemove) taken[1 - mover].push(h.pos.board[h.move.from]);
  }
  const letters = (codes: number[]): string => codes
    .map(p => `<span title="${colorOf(p) ? 'black' : 'white'} ${NAMES[typeOf(p)]}">${colorOf(p) ? LETTERS[typeOf(p)].toLowerCase() : LETTERS[typeOf(p)]}</span>`)
    .join('');
  $('took-w').innerHTML = letters(taken[0]);
  $('took-b').innerHTML = letters(taken[1]);
  showInfo(selected ?? hovered);
  $<HTMLButtonElement>('undo').disabled = game.history.length === 0;
  $<HTMLButtonElement>('resign').disabled = finished();
  $<HTMLButtonElement>('copy').disabled = game.history.length === 0;
  $<HTMLButtonElement>('hint').disabled = finished() || busy || sides[game.pos.turn] !== 'human';
}

async function commit(m: Move): Promise<void> {
  const g = gen;
  busy = true;
  hintSquares = [];
  const pre = game.pos;
  game.play(m);
  const line = momentText(pre, m, seenMoments);
  if (line) { said = line; $('moment').textContent = line; }
  const kind = momentKind(pre, m);
  if (kind === 'shove' || kind === 'shoveGuard') snd.shove();
  else if (kind === 'shot' || kind === 'deathTouch' || kind === 'strikeCapture' || kind === 'lob' || kind === 'strike') snd.shot();
  else if (kind === 'chain' || kind === 'reaver') snd.chain();
  else if (kind === 'swap' || kind === 'swapKing') snd.swap();
  else if (m.captures.length || m.selfRemove) snd.capture();
  else snd.move();
  if (game.inCheck) snd.check();
  selected = null; pending = [];
  refresh();
  await view.animateMove(pre, m);
  // New game / Undo / Resign landed inside the animation: that game is gone. Returning here is what
  // keeps a second maybeAi() loop from starting and replaying this move onto the new position.
  if (g !== gen) return;
  view.sync(game.pos);
  busy = false;
  refresh();
  save();
  if (finished()) showOver(); else void maybeAi();
}

type Skill = SkillName;
const SKILL_NAMES: readonly Skill[] = ['beginner', 'casual', 'club', 'strong'];
const isSkill = (v: unknown): v is Skill => typeof v === 'string' && (SKILL_NAMES as readonly string[]).includes(v);

async function maybeAi(): Promise<void> {
  if (busy || finished() || sides[game.pos.turn] !== 'ai') return;
  busy = true;
  refresh();
  const g = gen;
  const skill = $<HTMLSelectElement>('skill').value;
  const plan = skillPlan(isSkill(skill) ? skill : 'club', +$<HTMLInputElement>('think').value, game.history.length);
  const res = await engine.think(game.pos, { timeMs: plan.timeMs, temperature: plan.temperature, history: game.history.map(h => positionKey(h.pos)) });
  if (g !== gen) return;
  const choices = game.legal;
  const blunder = plan.blunder > 0 && choices.length > 0 && Math.random() < plan.blunder
    ? choices[Math.floor(Math.random() * choices.length)]
    : null;
  busy = false;
  const move = blunder ?? res.move;
  if (move) await commit(move);
}

/** Resolves with the chosen move, or null when reset() closed the picker. */
function pickPromotion(options: Move[]): Promise<Move | null> {
  const box = $('promo');
  box.innerHTML = '';
  box.hidden = false;
  return new Promise(resolve => {
    const done = (m: Move | null): void => { box.hidden = true; closePromo = null; resolve(m); };
    closePromo = () => done(null);
    for (const m of options) {
      const b = document.createElement('button');
      b.textContent = `${LETTERS[m.promo!]} ${NAMES[m.promo as PieceType]}`;
      b.onclick = () => done(m);
      box.appendChild(b);
    }
  });
}

async function choose(moves: Move[]): Promise<void> {
  const queen = $<HTMLInputElement>('queen').checked
    && moves.every(m => m.promo)
    && moves.every(m => m.promo === Q || m.promo === R || m.promo === B || m.promo === N)
    ? moves.find(m => m.promo === Q)
    : undefined;
  if (queen) return commit(queen);
  if (moves.length === 1 || !moves.every(m => m.promo)) return commit(moves[0]);
  busy = true; // the picker is modal: without this the board stays live and a second move slips in
  refresh();
  const m = await pickPromotion(moves);
  if (!m) return; // reset() closed it; reset() also cleared busy
  busy = false;
  return commit(m);
}

/** Only genuinely ambiguous targets need a choice; native dialog supplies focus and touch access. */
async function choosePushOrCapture(capture: Move, push: Move): Promise<void> {
  const generation = gen;
  busy = true;
  refresh();
  const dlg = $<HTMLDialogElement>('move-choice');
  const target = sqName(push.shove!.from), destination = sqName(push.shove!.to);
  $('move-choice-detail').textContent = `Capture removes the enemy on ${target}. Push moves it to ${destination}${push.to === push.from ? ' and leaves your Ogre in place' : ` and moves your Ogre to ${target}`}.`;
  $('choose-capture').textContent = `Capture on ${target}`;
  $('choose-push').textContent = `Push to ${destination}`;
  const move = await new Promise<Move | null>(resolve => {
    const done = (m: Move | null): void => { closeMoveChoice = null; dlg.close(); resolve(m); };
    closeMoveChoice = () => done(null);
    $('choose-capture').onclick = () => done(capture);
    $('choose-push').onclick = () => done(push);
    $('cancel-choice').onclick = () => done(null);
    dlg.oncancel = e => { e.preventDefault(); done(null); };
    dlg.showModal();
  });
  if (generation !== gen) return;
  busy = false;
  if (move) await commit(move);
  else { selected = null; pending = []; refresh(); }
}

/** Drag arm: select without the click toggle so a second onSquareClick can still play the move. */
view.onDragSelect = (sq) => {
  if (busy || finished() || sides[game.pos.turn] !== 'human') return;
  if (game.pos.board[sq] === 0 || colorOf(game.pos.board[sq]) !== game.pos.turn) return;
  hintSquares = [];
  selected = sq;
  pending = [];
  refresh();
  $('panel').scrollTop = 0;
};

view.onSquareClick = (sq, shift = false) => {
  if (busy || finished() || sides[game.pos.turn] !== 'human') return;
  hintSquares = [];
  const own = game.pos.board[sq] !== 0 && colorOf(game.pos.board[sq]) === game.pos.turn;
  const next = candidates().filter(m => clickPath(m)[pending.length] === sq);
  if (selected == null || next.length === 0) {
    selected = own && sq !== selected ? sq : null;
    pending = [];
    refresh();
    if (selected != null) $('panel').scrollTop = 0;
    return;
  }
  const complete = next.filter(m => clickPath(m).length === pending.length + 1);
  if (complete.length && complete.length === next.length) {
    const push = complete.find(m => m.shove);
    const capture = complete.find(m => !m.shove);
    if (push && capture) {
      if (shift) void choose([push]);
      else void choosePushOrCapture(capture, push);
      return;
    }
    void choose(complete);
    return;
  }
  pending.push(sq); // a finish button commits the shorter capture
  refresh();
  $('panel').scrollTop = 0;
};
let said = '';
view.onSquareHover = sq => {
  hovered = sq;
  $('hover').textContent = sq == null ? '' : sqName(sq);
  showInfo(selected ?? hovered);
  const next = sq == null ? [] : candidates().filter(m => clickPath(m)[pending.length] === sq);
  const ready = next.filter(m => clickPath(m).length === pending.length + 1);
  const preview = ready.length === 1 ? momentText(game.pos, ready[0], seenMoments, true) : null;
  $('moment').textContent = preview ?? said;
};

function restoreMoments(): void {
  seenMoments.clear();
  said = '';
  for (const h of game.history) said = momentText(h.pos, h.move, seenMoments) ?? said;
  $('moment').textContent = said;
}

$('cancel-selection').onclick = () => { selected = null; pending = []; refresh(); };

$('stop-chain').onclick = () => { const m = candidates().find(m => clickPath(m).length === pending.length); if (m) void commit(m); };

$('hint').onclick = async () => {
  if (busy || finished() || sides[game.pos.turn] !== 'human') return;
  busy = true;
  refresh();
  const g = gen;
  const res = await engine.think(game.pos, { timeMs: 400, maxDepth: 3, history: game.history.map(h => positionKey(h.pos)) });
  if (g !== gen) return;
  busy = false;
  hintSquares = res.move ? [res.move.from, ...clickPath(res.move)] : [];
  refresh();
};

/** Stop any AI search in flight and drop the per-game UI state. */
function reset(): void {
  gen++;
  hintSquares = [];
  engine.cancel();
  closeMoveChoice?.();
  closePromo?.(); // drop an open promotion picker instead of leaving its promise hanging
  busy = false;
  selected = null; pending = [];
}

/** Look from Black's side whenever the human plays Black. */
const orient = (): void => view.flip(sides[0] === 'ai' && sides[1] === 'human');

function newGame(backRank?: string, fen?: string | null, rematch = false): void {
  reset();
  if (!rematch) setRules({ ...preset, ...(kings ? { kings: parseKings(kings) } : {}) });
  resigned = null;
  seenMoments.clear();
  said = '';
  $('moment').textContent = '';
  sides[0] = $<HTMLSelectElement>('white').value as Side;
  sides[1] = $<HTMLSelectElement>('black').value as Side;
  if (fen) game.load(fromFen(fen)); else game.newGame(backRank);
  view.sync(game.pos);
  orient();
  refresh();
  save();
  void maybeAi();
}

/** Take back one ply, or two against the computer so it is the human's turn again. */
function undo(): void {
  if (!game.history.length) return;
  reset();
  resigned = null;
  game.undo();
  if (sides[game.pos.turn] === 'ai' && sides.includes('human')) game.undo();
  restoreMoments();
  view.sync(game.pos);
  refresh();
  save();
  void maybeAi(); // no-op on a human's turn; restarts the computer if we ran out of plies to take back
}

function result(): string {
  if (resigned != null) return `${resigned ? 'Black' : 'White'} resigns — ${resigned ? 'White' : 'Black'} wins`;
  return {
    playing: '',
    checkmate: `${game.pos.turn ? 'White' : 'Black'} wins ${findKing(game.pos.board, game.pos.turn) < 0 ? 'by king capture' : 'by checkmate'}`,
    stalemate: 'Draw by stalemate',
    draw50: 'Draw by the 50-move rule',
    drawRepetition: 'Draw by repetition',
    drawMaterial: 'Draw by insufficient material',
  }[game.status];
}

function showOver(): void {
  const n = Math.ceil(game.history.length / 2);
  const dlg = $<HTMLDialogElement>('over');
  $('over-title').textContent = result();
  const last = game.history.at(-1)?.lan;
  // Ending reason wins over a prior moment caption (`said`); last-move text stays above.
  const why =
    (game.status === 'checkmate' ? (findKing(game.pos.board, game.pos.turn) < 0 ? 'The king was captured.' : 'The king is in check and no legal move escapes it.') : '')
    || (game.status === 'stalemate' ? 'No legal move, and the king is not in check.' : '')
    || (game.status === 'draw50' ? 'Fifty moves with no capture and no pawn move.' : '')
    || (game.status === 'drawRepetition' ? 'The same position came up three times.' : '')
    || (game.status === 'drawMaterial' ? 'Neither side has enough material to mate.' : '')
    || (resigned != null ? 'That side gave up.' : '')
    || said;
  $('over-detail').textContent = [last ? `Last move ${last}.` : '', why, `${n} move${n === 1 ? '' : 's'} · setup ${game.backRank || 'custom'}`].filter(Boolean).join(' ');
  dlg.returnValue = ''; // Esc leaves the last button's value behind, which would re-fire it
  dlg.showModal();
}

$<HTMLDialogElement>('over').onclose = () => {
  const v = $<HTMLDialogElement>('over').returnValue;
  if (v === 'new') newGame(randomBackRank());
  else if (v === 'rematch') {
    const [w, b] = [$<HTMLSelectElement>('white'), $<HTMLSelectElement>('black')];
    [w.value, b.value] = [b.value, w.value];
    newGame(game.backRank || undefined, game.backRank ? null : toFen(game.history[0]?.pos ?? game.pos), true);
  }
};

$('undo').onclick = undo;
$('resign').onclick = () => {
  if (finished()) return;
  if (!confirm(`Resign as ${game.pos.turn ? 'Black' : 'White'}?`)) return;
  reset();
  resigned = game.pos.turn;
  refresh();
  save();
  showOver();
};
$('copy').onclick = () => {
  const text = game.history.map((h, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${h.lan}` : h.lan)).join(' ');
  navigator.clipboard?.writeText(text).catch(() => copyFallback(text)) ?? copyFallback(text);
};

/** No clipboard API (or permission denied): a throwaway textarea + execCommand still works everywhere. */
function copyFallback(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* nothing else to try */ }
  ta.remove();
}

/* ---- autosave ---- */
interface Save { back: string; fen: string; moves: string[]; white: Side; black: Side; think: number; skill?: Skill; coords: boolean; resigned: Color | null; rules?: Rules; sound?: boolean; queen?: boolean }
const SAVE_KEY = 'kingdown.save';

function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      back: game.backRank,
      fen: toFen(game.history[0]?.pos ?? game.pos), // the position the game started from
      moves: game.history.map(h => h.lan),
      white: sides[0], black: sides[1],
      think: +$<HTMLInputElement>('think').value,
      skill: $<HTMLSelectElement>('skill').value as Skill,
      coords: coords.checked,
      sound: $<HTMLInputElement>('sound').checked,
      queen: $<HTMLInputElement>('queen').checked,
      resigned,
      // The rules the game is playing, so opening the save without its URL replays the same game
      // (`?rules=2017`, `?kings=…`; docs/TAKEOVER-PLAN.md §2).
      rules: { ...GAME_RULES },
    } satisfies Save));
  } catch { /* private mode or a full quota: play on without a save */ }
}

function readSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? (JSON.parse(raw) as Save) : null;
    return s && Array.isArray(s.moves) ? s : null;
  } catch { return null; }
}

$('rules-btn').onclick = () => {
  fillPieceGuide();
  $<HTMLDialogElement>('rules').showModal();
};
$('new-random').onclick = () => newGame(randomBackRank());
$('new-classic').onclick = () => newGame(CLASSIC_CHESS);
$('new-setup').onclick = () => {
  const v = prompt(`Back rank (8 letters, one K; current draw pool ${POOL}):`, game.backRank)?.toUpperCase().trim();
  if (!v) return;
  try { newGame(v); } catch (e) { alert((e as Error).message); }
};
for (const row of TRY_THESE) {
  const option = document.createElement('option');
  option.value = row.code;
  option.textContent = `${row.code}${row.code.includes('C') ? ' — Catapult lab' : ''}`;
  option.title = row.watch;
  $('setup-example').appendChild(option);
}
$('setup-example').onchange = e => {
  const select = e.target as HTMLSelectElement;
  if (!select.value) return;
  if (select.value === 'ogre') {
    $<HTMLSelectElement>('white').value = $<HTMLSelectElement>('black').value = 'human';
    newGame(undefined, '7k/8/6o1/8/2OP4/8/8/K7 w - - 0 1');
  } else {
    newGame(select.value);
    const example = TRY_THESE.find(row => row.code === select.value);
    if (example) { said = example.watch; $('moment').textContent = said; }
  }
  select.value = '';
};
$('white').onchange = $('black').onchange = () => { reset(); view.sync(game.pos); sides[0] = $<HTMLSelectElement>('white').value as Side; sides[1] = $<HTMLSelectElement>('black').value as Side; orient(); refresh(); save(); void maybeAi(); };
$('think').onchange = $('skill').onchange = save;
$('sound').onchange = () => { setSound($<HTMLInputElement>('sound').checked); save(); };
$('queen').onchange = save;
const labels = $<HTMLInputElement>('labels');
labels.checked = params.get('labels') === '1';
labels.onchange = () => view.setLabels(labels.checked);
view.setLabels(labels.checked);
const coords = $<HTMLInputElement>('coords');
coords.onchange = () => { view.setCoords(coords.checked); save(); };
$('reset-view').onclick = () => view.resetView();
addEventListener('keydown', e => {
  if (e.key === 'Escape') { selected = null; pending = []; refresh(); return; }
  if ((e.target as HTMLElement).closest('input,select,textarea')) return;
  if (e.key === 'r') view.resetView();
  if (e.key === 'z') undo();
});

/** `?fen=` wins over the autosave; restore player settings before loading the game. */
const saved = params.has('fen') ? null : readSave();
if (saved) {
  if (saved.white) $<HTMLSelectElement>('white').value = saved.white;
  if (saved.black) $<HTMLSelectElement>('black').value = saved.black;
  if (saved.think) $<HTMLInputElement>('think').value = String(saved.think);
  if (typeof saved.sound === 'boolean') $<HTMLInputElement>('sound').checked = saved.sound;
  if (typeof saved.queen === 'boolean') $<HTMLInputElement>('queen').checked = saved.queen;
  // Old saves with no skill field stay Strong so a resumed game does not suddenly get easier.
  $<HTMLSelectElement>('skill').value = isSkill(saved.skill) ? saved.skill : 'strong';
  if (typeof saved.coords === 'boolean') coords.checked = saved.coords;
  sides[0] = $<HTMLSelectElement>('white').value as Side;
  sides[1] = $<HTMLSelectElement>('black').value as Side;
}

await loadModels();
// The playable game has one art direction; study controls stay in the study.
view.applyStyle(STYLES.clay);
view.setCoords(coords.checked);
const fen = params.get('fen');
if (fen) { try { game.load(fromFen(fen)); } catch (e) { alert(`Bad fen: ${(e as Error).message}`); } }
else if (saved) {
  const savedRules = saved.rules;
  const urlRules = preset || kings;
  const rulesDiffer = !!urlRules && !!savedRules && JSON.stringify(savedRules) !== JSON.stringify({ ...GAME_RULES });
  if (rulesDiffer) {
    // The URL names a rule set and the autosave played a different one. Replaying the moves would
    // reinterpret them, so keep the URL's fresh game and let the next save overwrite the old one.
    console.warn('kingdown: the autosave played different rules than the URL asks for; starting fresh');
  } else try {
    if (savedRules) setRules(savedRules); // before playLan: the moves must replay under their own rules
    if (saved.back) game.newGame(saved.back); else game.load(fromFen(saved.fen));
    game.playLan(saved.moves);
    resigned = saved.resigned ?? null;
  } catch { game.newGame(); } // a save from an older format: start fresh
}
orient();
view.sync(game.pos);
await view.ready();
if ($('asset-status').textContent === 'Loading pieces…') $('asset-status').textContent = '';
fillPieceGuide(); // after every setRules path (URL preset / save restore)
setSound($<HTMLInputElement>('sound').checked);
restoreMoments();
refresh();
if (!fen) save(); // pin the random back rank so a reload keeps this game
if (finished()) showOver(); else void maybeAi();
