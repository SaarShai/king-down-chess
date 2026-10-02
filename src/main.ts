import './style.css';
import { SkillName, skillPlan } from './ai/skill';
import { Engine, Game, Side } from './game';
import { setEvaluator } from './ai/eval';
import { positionKey, type SearchResult } from './ai/search';
import { BoardRenderer } from './render/renderer';
import { PaintedView, type BoardView, type Pace } from './render/PaintedView';
import { keyMoments, momentKind, momentText, type KeyMoment } from './moment';
import { setSound, snd } from './render/sfx';
import { STYLES } from './render/styles';
import { loadModels } from './render/voxels';
import { A, B, C, Color, G, K, KINGS, L, LETTERS, M, Move, N, NAMES, O, P, PieceType, Position, Q, R, RULES as GAME_RULES, RULES_2017, RULES_2021, S, SPENT, T, V, colorOf, findKing, kingLabel, KingChoice, PowerName, parseKings, setRules, sqName, typeOf, type Rules } from './rules/engine';
import { CLASSIC_CHESS, fromFen, POOL, randomBackRank, toFen, toLan } from './rules/setup';
import { TRY_THESE } from './try-these';
import { LESSONS } from './lessons';
import { mulberry32 } from './sim/rng';
import { POWER_NAME, POWER_TAG, POWER_TEXT, fillPowerSelect, kingsParam, needsArming, readPowerSelect, usesAllowed, usesLeft } from './powers-ui';

const params = new URLSearchParams(location.search);
/** `?rules=2017|2021` plays an older rule set. No parameter = the measured 2026 rules. */
const preset = { 2017: RULES_2017, 2021: RULES_2021 }[params.get('rules') ?? ''];
/**
 * `?kings=spirit:mercy,mud:march` — White first; one value gives both sides the same king
 * (docs/RULES.md §4). The default is **no powers**; the New game dialog picks each side's power.
 */
const kings = params.get('kings');
// Before the first Game: its constructor builds a position and asks for its status.
if (preset || kings) setRules({ ...preset, ...(kings ? { kings: parseKings(kings) } : {}) });
/** "twice a game", "always on". */
const usesText = (p: PowerName): string => {
  const n = usesAllowed(p);
  return n === null || n === 0 ? 'always on' : n === 1 ? 'once a game' : n === 2 ? 'twice a game' : `${n} times a game`;
};

/** "Freeze, 2 left — as your move, freeze…" for side `c`, or "no power". */
const powerLabel = (c: Color): string => {
  const k = GAME_RULES.kings[c];
  if (!k) return 'no power';
  const left = usesLeft(game.pos, c);
  return `${POWER_NAME[k.power]}${left === null ? '' : `, ${left} left`} — ${POWER_TEXT[k.power]}`;
};

/** One line for the info card, so a game with kings' powers says on screen which are live. */
const kingsInfo = (): string => {
  const [w, b] = GAME_RULES.kings;
  if (!w && !b) return '';
  return `<div>White's king: ${powerLabel(0)}</div><div>Black's king: ${powerLabel(1)}</div>`;
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

// The adopted Q6 residual net: stronger play at the same time budget, validated before adoption.
setEvaluator('residual');
let game = new Game();
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
/** The player to move has armed their king's power: the next click spends it. */
let armed = false;
let resigned: Color | null = null;
let busy = false;
/** The computer is searching (not animating), so the header can say so. */
let thinking = false;
/** The in-flight token. reset() bumps it; every await in commit/maybeAi/choose drops out if it changed. */
let gen = 0;
/** Closes an open promotion picker (resolving it with null). Set only while one is on screen. */
let closePromo: (() => void) | null = null;
let closeMoveChoice: (() => void) | null = null;
/** Squares lit by Hint. Cleared when the player moves or selects something else. */
let hintSquares: number[] = [];
const seenMoments = new Set<string>();
/** The date (YYYY-MM-DD) when this game is that day's army, for the shareable result. */
let daily: string | null = null;
/** The lesson on the board (index into LESSONS), and whether its goal move was played. */
let lesson: number | null = null;
let lessonDone = false;
/** Keep the actual game, including repetition history, while a separate game runs the lessons. */
let lessonReturn: { game: Game; sides: [Side, Side]; rules: Rules; resigned: Color | null; linkSide: Color | null } | null = null;
/** In a game played by link, the side this device plays (the side to move when the link opened). */
let linkSide: Color | null = null;
/** Plies shown on the board while reviewing earlier moves; null = the live game. */
let viewing: number | null = null;
/** Bumped by every review step, so a superseded step's animation does not sync the board. */
let navGen = 0;
/** A review step is replaying a move; `busy` is set too, so the board treats it as an animation. */
let replaying = false;
/** The finished game's key moments, marked in the move list; cleared when the game changes. */
let marked: (KeyMoment & { text: string })[] = [];
/** Replaces the review help line while a key moment is on the board. */
let reviewNote = '';

/** The game is over: mate, a draw, or somebody resigned. Blocks input and the AI. */
const finished = (): boolean => resigned != null || game.status !== 'playing';
/** This device may move now: a person's turn, and in a link game only its own side. */
const myTurn = (): boolean => sides[game.pos.turn] === 'human' && (linkSide == null || game.pos.turn === linkSide) && !lessonDone;

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
    // data-label names the column when a phone stacks the cells (style.css).
    tr.innerHTML = `<td>${letter} ${name}</td><td data-label="Moves">${g.moves}</td><td data-label="Captures">${g.captures}</td><td data-label="Special">${g.special}</td>`;
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
  $('rules-notation').textContent =
    'In the move list: - moves, x captures, * shoots without moving (archer), <> swaps (maester), > shoves (ogre; then where the shoved piece went), = promotes. '
    + 'Kings\' powers: ! Strike, !H Haste (-- ends a Haste turn early), ~ Flight, !F: Freeze, !W: Ice Wall, !S: Sacrifice, !M March, !L Leap.';
  // The twelve powers, with the use counts the rules set today.
  $('powers-list').innerHTML = (Object.entries(KINGS) as [string, readonly PowerName[]][]).map(([king, powers]) =>
    `<li><b>${king} king</b>: ${powers.map(p => `<b>${POWER_NAME[p]}</b> (${usesText(p)}) — ${POWER_TEXT[p]}`).join('; ')}.</li>`).join('');
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
  // A mark, a sacrifice and a Haste pass change no square: the square itself is the click.
  : m.pass || m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice' ? [m.to]
  : m.to === m.from ? [m.captures[0]]
  : m.captures.length > 1 ? m.captures
  // Reaver: click the victim, then the landing square (`Vb1xc3-d3`).
  : m.captures.length === 1 && m.to !== m.captures[0] ? [m.captures[0], m.to]
  : [m.to]);
/** The side to move's power tag while it is armed, else null. */
const armedTag = (): string | null => {
  const power = GAME_RULES.kings[game.pos.turn]?.power;
  return armed && power ? POWER_TAG[power] ?? null : null;
};
/**
 * The selected piece's moves that match the clicks so far. A power that shares squares with
 * ordinary moves is offered only while armed, and then only its own moves (`needsArming`).
 */
const candidates = (): Move[] => {
  if (selected == null) return [];
  const tag = armedTag();
  return game.legal.filter(m => m.from === selected && pending.every((sq, i) => clickPath(m)[i] === sq)
    && (tag ? m.power === tag : !needsArming(m)));
};
/** Armed Freeze, Ice Wall or Sacrifice: their moves name a piece, not a destination. */
const markTargets = (): Move[] => {
  const tag = armedTag();
  return tag === 'freeze' || tag === 'ward' || tag === 'sacrifice' ? game.legal.filter(m => m.power === tag) : [];
};

function refresh(): void {
  const cands = candidates();
  const next = cands.map(m => clickPath(m)[pending.length]).filter((s): s is number => s != null);
  const swaps = cands.filter(m => m.swap).map(m => m.to);
  // Armed Freeze / Ice Wall / Sacrifice light their targets in the shove colour (a power, not a capture).
  const shoves = [...cands.filter(m => m.shove).map(m => m.shove!.from), ...new Set(markTargets().map(m => m.to))];
  const last = (viewing == null ? game.history.at(-1) : game.history[viewing - 1])?.move;
  view.highlight({
    selected,
    moves: next.filter(sq => !game.pos.board[sq]),
    captures: next.filter(sq => game.pos.board[sq] !== 0 && !swaps.includes(sq) && !shoves.includes(sq)),
    swaps,
    shoves,
    last: last ? [last.from, ...(last.shove ? [last.shove.from, last.shove.to] : last.to === last.from ? last.captures : [last.to])] : [],
    hint: hintSquares,
    check: game.inCheck && viewing == null ? findKing(game.pos.board, game.pos.turn) : null,
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
  $('move-help').textContent = viewing != null
    ? reviewNote || `Tap the board to return to the game.${matchMedia('(hover: hover)').matches ? ' ← → step through the moves.' : ''}`
    : selected == null || busy
      ? (linkSide != null && game.pos.turn !== linkSide && !finished() ? 'Your move is played. Send the game link so your friend can answer.' : '')
      : help[selectedType as PieceType] ?? 'Tap a marked square to move or capture.';
  const turn = game.pos.turn ? 'Black' : 'White';
  // In review the header names the move shown, as the list numbers it ("after 5… a5-a4").
  const shown = viewing == null ? '' : viewing === 0 ? 'the start'
    : `after ${Math.ceil(viewing / 2)}${viewing % 2 ? '.' : '…'} ${game.history[viewing - 1].lan}`;
  $('turn').textContent = viewing != null ? `Reviewing ${shown}`
    : lesson != null ? `Lesson ${lesson + 1} of ${LESSONS.length}: ${LESSONS[lesson].name}`
    : finished() ? '' : `${turn} to move${game.inCheck ? ' — CHECK' : ''}`;
  $('status').textContent = viewing != null ? '' : resigned != null ? result() : {
    playing: thinking ? 'thinking…' : '',
    checkmate: result(),
    stalemate: 'Stalemate — draw',
    draw50: 'Draw — 50-move rule',
    drawRepetition: 'Draw — threefold repetition',
    drawMaterial: 'Draw — insufficient material',
  }[game.status];
  $('setup').textContent = game.backRank || 'custom';
  $('setup').title = toFen(game.pos);
  const moves = $('moves');
  // Each move is a button to the board after it (data-ply = plies played by then). A line is White's
  // turn and Black's; a Haste turn is two plies by one side, so turns follow the side that moved.
  let line = 0, html = '', open = false;
  game.history.forEach((h, i) => {
    const km = marked.find(k => k.ply === i), mark = !km ? '' : km.kind !== 'loss' || km.loss >= 500 ? '??' : '?';
    const white = h.pos.turn === 0;
    const ply = `<span data-ply="${i + 1}"${viewing === i + 1 ? ' class="viewing"' : ''}${km ? ` title="${km.text}"` : ''}>${white ? `<b>${h.lan}</b>` : h.lan}${mark}</span>`;
    const sameTurn = i > 0 && game.history[i - 1].pos.turn === h.pos.turn;
    if (white && !sameTurn) { html += `${open ? '</li>' : ''}<li>${++line}. `; open = true; }
    else if (!open) { html += `<li>${++line}… `; open = true; }
    html += `${sameTurn || !white ? ' ' : ''}${ply}`;
  });
  moves.innerHTML = html + (open ? '</li>' : '');
  if (viewing == null) moves.scrollTop = moves.scrollHeight;
  else moves.querySelector('.viewing')?.scrollIntoView({ block: 'nearest' });
  // Captured pieces: a piece the mover removed counts for the mover; a paladin that removes itself is its own side's loss.
  const taken: [number[], number[]] = [[], []];
  for (const h of game.history) {
    const mover = h.pos.turn; // not the piece on `from`: a Freeze names an enemy square
    for (const c of h.move.captures) taken[mover].push(h.pos.board[c]);
    if (h.move.selfRemove) taken[1 - mover].push(h.pos.board[h.move.from]);
  }
  // Grouped names ("pawn ×2, beast"): letters alone mean little for the King Down pieces.
  const names = (codes: number[]): string => {
    const count = new Map<PieceType, number>();
    for (const p of codes) count.set(typeOf(p), (count.get(typeOf(p)) ?? 0) + 1);
    return [...count].sort(([a], [b]) => a - b).map(([t, n]) => `<span>${NAMES[t]}${n > 1 ? ` ×${n}` : ''}</span>`).join(', ');
  };
  $('took-w').innerHTML = names(taken[0]);
  $('took-b').innerHTML = names(taken[1]);
  showInfo(selected ?? hovered);
  $<HTMLButtonElement>('undo').disabled = game.history.length === 0;
  $<HTMLButtonElement>('resign').disabled = finished() || lesson != null;
  $<HTMLButtonElement>('copy').disabled = game.history.length === 0;
  $('share').hidden = sides[0] !== 'human' || sides[1] !== 'human' || game.history.length === 0 || lesson != null;
  $('next-lesson').hidden = lesson == null || !lessonDone;
  $('return-game').hidden = lesson == null;
  $('next-lesson').textContent = lesson != null && lesson + 1 < LESSONS.length ? `Next lesson: ${LESSONS[lesson + 1].name}` : 'Start a game';
  $<HTMLButtonElement>('hint').disabled = finished() || busy || viewing != null || !myTurn();
  refreshPowers();
}

/** The power bar: arm the side to move's power, end a Haste turn, or read an always-on power. */
function refreshPowers(): void {
  const c = game.pos.turn, k = GAME_RULES.kings[c];
  const live = !!k && viewing == null && !finished() && lesson == null;
  const tag = k ? POWER_TAG[k.power] : undefined;
  const left = usesLeft(game.pos, c);
  const spendable = !!tag && tag !== 'march' && tag !== 'leap';
  const canUse = live && myTurn() && !busy && spendable && left !== 0 && game.pos.haste === undefined
    && game.legal.some(m => m.power === tag);
  if (!canUse) armed = false;
  $('powers').hidden = !live;
  const btn = $<HTMLButtonElement>('power-btn');
  btn.hidden = !spendable;
  btn.disabled = !canUse;
  btn.textContent = !k ? '' : armed ? `Cancel ${POWER_NAME[k.power]}` : `Use ${POWER_NAME[k.power]}${left === null ? '' : ` (${left} left)`}`;
  btn.classList.toggle('armed', armed);
  $('end-haste').hidden = !(live && myTurn() && !busy && game.pos.haste !== undefined);
  $('power-status').textContent = !k ? '' : armed
    ? (tag === 'freeze' ? 'Tap an enemy piece to freeze it for one turn.'
      : tag === 'ward' ? 'Tap one of your pieces to wall it for one turn.'
      : tag === 'sacrifice' ? 'Tap one of your pawns to bring back a lost piece there.'
      : tag === 'haste' ? 'Move a piece; it may then move again.'
      : `Choose a piece, then a marked square (${POWER_NAME[k.power]}).`)
    : game.pos.haste !== undefined && myTurn() ? 'Haste: move the same piece again, or end the turn.'
    : ''; // the info card already says what each king's power does
}

async function commit(m: Move): Promise<void> {
  const g = gen;
  busy = true;
  hintSquares = [];
  const pre = game.pos;
  navGen++;
  if (viewing != null) { viewing = null; view.sync(pre); } // a review ends when a move is played
  game.play(m);
  const line = momentText(pre, m, seenMoments);
  if (line) { said = line; $('moment').textContent = line; }
  const kind = momentKind(pre, m);
  // Launch sounds play now; the hit sounds when the board shows the contact.
  const hit = kind === 'shove' || kind === 'shoveGuard' ? snd.shove
    : kind === 'chain' || kind === 'reaver' ? snd.chain
    : m.captures.length || m.selfRemove ? snd.capture : null;
  if (kind === 'shot' || kind === 'deathTouch' || kind === 'strikeCapture' || kind === 'lob' || kind === 'strike') snd.shot();
  else if (kind === 'swap' || kind === 'swapKing') snd.swap();
  else if (!hit) snd.move();
  if (game.inCheck) snd.check();
  selected = null; pending = []; armed = false;
  refresh();
  let struck = false;
  const strike = (): void => { if (!struck && g === gen) { struck = true; hit?.(); } };
  await view.animateMove(pre, m, strike);
  // New game / Undo / Resign landed inside the animation: that game is gone. Returning here is what
  // keeps a second maybeAi() loop from starting and replaying this move onto the new position.
  if (g !== gen) return;
  strike(); // no animation (reduced motion) or no contact reported: sound the hit now
  view.sync(game.pos);
  busy = false;
  if (lesson != null) return lessonResult(pre, m);
  // After a Haste's first move the same piece is ready for its second.
  if (game.pos.haste !== undefined && myTurn()) selected = game.pos.haste;
  refresh();
  save();
  if (finished()) showOver(); else void maybeAi();
}

/** A lesson move: the goal ends the lesson; any other move is taken back with the task again. */
function lessonResult(pre: Position, m: Move): void {
  const l = LESSONS[lesson!];
  if (l.goal(pre, m)) { lessonDone = true; said = `Well done. ${l.done}`; }
  else { game.undo(); view.sync(game.pos); said = `Not quite. ${l.task}`; }
  $('moment').textContent = said;
  refresh();
}

/** A lesson: its position, both sides moved from this device, and nothing saved (the autosave keeps the real game). */
function startLesson(i: number): void {
  $<HTMLDialogElement>('rules').close();
  if (lesson == null) {
    lessonReturn = { game, sides: [...sides], rules: { ...GAME_RULES }, resigned, linkSide };
  }
  reset();
  setRules(); // these lessons teach today's rules, even when the match uses an older preset
  game = new Game();
  resigned = null; linkSide = null;
  lesson = i; lessonDone = false;
  sides[0] = sides[1] = 'human';
  game.load(fromFen(LESSONS[i].fen));
  seenMoments.clear();
  said = LESSONS[i].task; $('moment').textContent = said;
  view.sync(game.pos);
  orient();
  refresh();
}

$('learn').onclick = () => startLesson(0);
$('return-game').onclick = () => {
  if (!lessonReturn) return;
  reset();
  ({ game, resigned, linkSide } = lessonReturn);
  [sides[0], sides[1]] = lessonReturn.sides;
  setRules(lessonReturn.rules);
  lessonReturn = null;
  lesson = null; lessonDone = false;
  $<HTMLSelectElement>('white').value = sides[0];
  $<HTMLSelectElement>('black').value = sides[1];
  restoreMoments();
  view.sync(game.pos);
  orient();
  refresh();
  save();
  if (finished()) showOver(); else void maybeAi();
};
$('next-lesson').onclick = () => {
  if (lesson != null && lesson + 1 < LESSONS.length) startLesson(lesson + 1);
  else $<HTMLDialogElement>('new-game').showModal();
};

type Skill = SkillName;
const SKILL_NAMES: readonly Skill[] = ['beginner', 'casual', 'club', 'strong'];
const isSkill = (v: unknown): v is Skill => typeof v === 'string' && (SKILL_NAMES as readonly string[]).includes(v);

async function maybeAi(): Promise<void> {
  if (busy || finished() || sides[game.pos.turn] !== 'ai') return;
  busy = thinking = true;
  refresh();
  const g = gen;
  const skill = $<HTMLSelectElement>('skill').value;
  const plan = skillPlan(isSkill(skill) ? skill : 'club', +$<HTMLInputElement>('think').value, game.history.length);
  const res = await engine.think(game.pos, { timeMs: plan.timeMs, temperature: plan.temperature, history: game.history.map(h => positionKey(h.pos)) });
  if (g !== gen) return;
  thinking = false;
  const choices = game.legal;
  const blunder = plan.blunder > 0 && choices.length > 0 && Math.random() < plan.blunder
    ? choices[Math.floor(Math.random() * choices.length)]
    : null;
  busy = false;
  const move = blunder ?? res.move;
  if (move) await commit(move);
}

/** A modal beside the board, so a phone player sees it. Resolves with the choice, or null on Cancel/Escape or reset(). */
function pickPromotion(options: Move[]): Promise<Move | null> {
  const dlg = $<HTMLDialogElement>('promo'), box = $('promo-choices');
  $('promo-title').textContent = `Promote the pawn on ${sqName(options[0].to)}`;
  box.innerHTML = '';
  return new Promise(resolve => {
    const done = (m: Move | null): void => { closePromo = null; dlg.close(); resolve(m); };
    closePromo = () => done(null);
    for (const m of options) {
      const b = document.createElement('button');
      b.textContent = `${LETTERS[m.promo!]} ${NAMES[m.promo as PieceType]}`;
      b.onclick = () => done(m);
      box.appendChild(b);
    }
    $('cancel-promo').onclick = () => done(null);
    dlg.oncancel = e => { e.preventDefault(); done(null); };
    dlg.showModal();
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
  const generation = gen;
  busy = true; // the picker is modal: without this the board stays live and a second move slips in
  refresh();
  const m = await pickPromotion(moves);
  if (generation !== gen) return; // reset() closed it and cleared busy
  busy = false;
  if (m) return commit(m);
  selected = null; pending = []; refresh(); // cancelled: the pawn stays, nothing selected
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

/** A mark is one move; a sacrifice asks which lost piece comes back (the promotion picker's look). */
async function choosePower(moves: Move[]): Promise<void> {
  if (moves.length === 1) return commit(moves[0]);
  const generation = gen;
  busy = true;
  refresh();
  const dlg = $<HTMLDialogElement>('promo'), box = $('promo-choices');
  $('promo-title').textContent = `Sacrifice the pawn on ${sqName(moves[0].from)}: which piece returns?`;
  box.innerHTML = '';
  const m = await new Promise<Move | null>(resolve => {
    const done = (x: Move | null): void => { closePromo = null; dlg.close(); resolve(x); };
    closePromo = () => done(null);
    for (const x of moves) {
      const b = document.createElement('button');
      b.textContent = `${LETTERS[x.promo!]} ${NAMES[x.promo as PieceType]}`;
      b.onclick = () => done(x);
      box.appendChild(b);
    }
    $('cancel-promo').onclick = () => done(null);
    dlg.oncancel = e => { e.preventDefault(); done(null); };
    dlg.showModal();
  });
  if (generation !== gen) return;
  busy = false;
  if (m) return commit(m);
  armed = false; refresh();
}

$('power-btn').onclick = () => { armed = !armed; selected = null; pending = []; refresh(); };
$('end-haste').onclick = () => {
  const pass = game.legal.find(m => m.pass);
  if (pass && myTurn() && !busy) void commit(pass);
};

/** Drag arm: select without the click toggle so a second onSquareClick can still play the move. */
view.onDragSelect = (sq) => {
  if (busy || viewing != null || finished() || !myTurn()) return;
  if (game.pos.board[sq] === 0 || colorOf(game.pos.board[sq]) !== game.pos.turn) return;
  hintSquares = [];
  selected = sq;
  pending = [];
  refresh();
  $('panel').scrollTop = 0;
};

view.onSquareClick = (sq, shift = false) => {
  if (busy) { view.skip(); return; } // a tap during an animation skips it
  if (viewing != null) { void showPly(game.history.length, false); return; }
  if (finished() || !myTurn()) return;
  hintSquares = [];
  const targets = markTargets();
  if (targets.length) { // armed Freeze / Ice Wall / Sacrifice: tap the piece itself
    const here = targets.filter(m => m.to === sq);
    if (here.length) void choosePower(here);
    else { armed = false; refresh(); }
    return;
  }
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
  if (busy || finished() || !myTurn()) return;
  busy = true;
  refresh();
  const g = gen;
  const res = await engine.think(game.pos, { timeMs: 400, maxDepth: 3, history: game.history.map(h => positionKey(h.pos)) });
  if (g !== gen) return;
  busy = false;
  hintSquares = res.move ? [res.move.from, ...clickPath(res.move)] : [];
  refresh();
};

/**
 * Review: show the board after `n` plies. One step forward replays that move's animation unless
 * `replay` is false; n = the game's length returns to the live game. Not while a move or the computer is in progress.
 */
async function showPly(n: number, replay = true): Promise<void> {
  const len = game.history.length, from = viewing ?? len;
  n = Math.max(0, Math.min(len, n));
  if ((busy && !replaying) || n === from) return;
  const at = (k: number) => (k === len ? game.pos : game.history[k].pos);
  const g = ++navGen;
  view.skip(); // a step during a replay ends it; its continuation sees the new navGen
  busy = replaying = false;
  viewing = n === len ? null : n;
  selected = null; pending = []; hintSquares = []; reviewNote = '';
  refresh();
  if (replay && n === from + 1) {
    view.sync(at(from));
    busy = replaying = true; // the board is locked like any move animation; a tap skips it
    await view.animateMove(at(from), game.history[from].move);
    if (g !== navGen) return;
    busy = replaying = false;
  }
  view.sync(at(n));
  refresh();
}

$('moves').onclick = e => {
  const ply = (e.target as HTMLElement).closest<HTMLElement>('[data-ply]');
  if (ply) void showPly(+ply.dataset.ply!);
};

/** Stop any AI search in flight and drop the per-game UI state. */
function reset(): void {
  gen++;
  navGen++;
  replaying = thinking = false;
  marked = [];
  if (viewing != null) { viewing = null; view.sync(game.pos); }
  hintSquares = [];
  engine.cancel();
  closeMoveChoice?.();
  closePromo?.(); // drop an open promotion picker instead of leaving its promise hanging
  busy = false;
  selected = null; pending = []; armed = false;
}

/** Look from Black's side whenever the human plays Black. */
const orient = (): void => view.flip(sides[0] === 'human' && sides[1] === 'human' && linkSide != null
  ? linkSide === 1
  : sides[0] === 'ai' && sides[1] === 'human');

function newGame(backRank?: string, fen?: string | null, rematch = false, dailyDate: string | null = null): void {
  $<HTMLDialogElement>('new-game').close(); // every army choice in the dialog starts here
  reset();
  if (!rematch) setRules({ ...preset, kings: [readPowerSelect($('power-white')), readPowerSelect($('power-black'))] });
  resigned = null;
  linkSide = null;
  lesson = null; lessonDone = false;
  lessonReturn = null;
  daily = dailyDate;
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
  lessonDone = false;
  game.undo();
  // Back to a person's turn, and never into the middle of a Haste turn: take that turn back whole.
  while (game.history.length && ((sides[game.pos.turn] === 'ai' && sides.includes('human')) || game.pos.haste !== undefined)) game.undo();
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
  // King Down: the mated or resigning side's king topples (none after a draw or a king capture).
  const loser = resigned ?? (game.status === 'checkmate' ? game.pos.turn : null), king = loser == null ? -1 : findKing(game.pos.board, loser);
  view.setFallen(king >= 0 ? king : null);
  $('share-result').hidden = daily == null;
  $('share-result').textContent = "Copy today's result";
  dlg.showModal();
  void listMoments();
}

/**
 * Key moments: score every position of the finished game, then list the moves that gave away
 * the most (moment.ts `keyMoments`). A moment opens the review before that move, the better one marked.
 */
async function listMoments(): Promise<void> {
  const g = gen, box = $('over-moments'), dlg = $<HTMLDialogElement>('over');
  box.innerHTML = '<small>Finding the key moments…</small>';
  marked = [];
  const keys = game.history.map(h => positionKey(h.pos));
  const results: SearchResult[] = [], before: number[] = [], after: number[] = [];
  for (let k = 0; k < game.history.length; k++) {
    const h = game.history[k], next = game.history[k + 1]?.pos ?? game.pos;
    const best = await engine.think(h.pos, { timeMs: 200, maxDepth: 3, history: keys.slice(0, k) });
    if (g !== gen) return; // the game changed (New game, Rematch, Undo): its search was cancelled
    // The played move, one ply shallower: the same horizon as the root's view of it.
    const reply = await engine.think(next, { timeMs: 200, maxDepth: 2, history: keys.slice(0, k + 1) });
    if (g !== gen) return;
    const same = best.move != null && toLan(h.pos, best.move) === h.lan;
    results.push(best); before.push(best.score); after.push(same ? -best.score : reply.score);
  }
  const found = keyMoments(before, after);
  box.innerHTML = found.length ? '<h3>Key moments</h3>' : '<small>No move gave away 2 pawns or more.</small>';
  for (const km of found) {
    const h = game.history[km.ply], better = results[km.ply].move;
    const what = km.kind === 'missedMate' ? 'missed a forced mate'
      : km.kind === 'allowedMate' ? 'allowed a forced mate'
      : `gave away about ${Math.round(km.loss / 100)} pawns`;
    const text = `${Math.floor(km.ply / 2) + 1}${km.ply % 2 ? '…' : '.'} ${h.lan}: ${h.pos.turn ? 'Black' : 'White'} ${what}.${better ? ` Better: ${toLan(h.pos, better)}.` : ''}`;
    marked.push({ ...km, text });
    const b = document.createElement('button');
    b.textContent = text;
    b.onclick = async () => {
      dlg.close();
      await showPly(km.ply, false);
      reviewNote = `${text}${better ? ' The better move is marked.' : ''}`;
      hintSquares = better ? [better.from, ...clickPath(better)] : [];
      refresh();
    };
    box.appendChild(b);
  }
  refresh(); // marks the moments in the move list
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
  if (finished() || lesson != null) return;
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

/** This page's URL without a game link's parameters. */
function gameLinkless(): string {
  const url = new URL(location.href);
  for (const k of ['army', 'fen', 'moves']) url.searchParams.delete(k);
  return url.href;
}

/** A link that holds this whole game, for a friend to open and answer on their device (no server). */
function gameLink(): string {
  const url = new URL(location.pathname, location.origin);
  const rules = params.get('rules');
  if (rules) url.searchParams.set('rules', rules);
  const k = kingsParam(GAME_RULES.kings);
  if (k) url.searchParams.set('kings', k);
  if (game.backRank) url.searchParams.set('army', game.backRank);
  else url.searchParams.set('fen', toFen(game.history[0]?.pos ?? game.pos));
  url.searchParams.set('moves', game.history.map(h => h.lan).join('_')); // '_' needs no escaping in a URL
  return url.href;
}

$('share').onclick = async () => {
  const url = gameLink(), button = $('share');
  // A phone opens its share sheet (chat apps); elsewhere the link goes to the clipboard.
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: 'King Down Chess', text: `King Down Chess: ${game.pos.turn ? 'Black' : 'White'} to move`, url }); return; }
    catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  navigator.clipboard?.writeText(url).catch(() => copyFallback(url)) ?? copyFallback(url);
  button.textContent = 'Link copied. Paste it to your friend.';
  setTimeout(() => { button.textContent = 'Send the game link'; }, 2500);
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
interface Save { daily?: string | null; back: string; fen: string; moves: string[]; white: Side; black: Side; think: number; skill?: Skill; coords: boolean; resigned: Color | null; rules?: Rules; sound?: boolean; queen?: boolean; pace?: Pace; link?: Color | null }
const SAVE_KEY = 'kingdown.save';

function save(): void {
  if (lesson != null) return; // a lesson never replaces the saved game
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
      pace: pace.value as Pace,
      link: linkSide,
      daily,
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

$('new-game-btn').onclick = () => $<HTMLDialogElement>('new-game').showModal();
$('settings-btn').onclick = () => $<HTMLDialogElement>('settings').showModal();
$('rules-btn').onclick = () => {
  fillPieceGuide();
  $<HTMLDialogElement>('rules').showModal();
};
$('new-random').onclick = () => newGame(randomBackRank());
/** Today's army: the same random army for every player on a given local date. */
const today = (): string => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
$('new-daily').onclick = () => { const d = today(); newGame(randomBackRank(mulberry32(+d.replace(/-/g, ''))), null, false, d); };
$('share-result').onclick = () => {
  const n = Math.ceil(game.history.length / 2), people = sides.filter(s => s === 'human').length;
  const me = sides.indexOf('human') as Color, winner = resigned != null ? 1 - resigned : game.status === 'checkmate' ? 1 - game.pos.turn : -1;
  const outcome = people !== 1 ? result().toLowerCase() : winner < 0 ? 'drew' : winner === me ? 'won' : 'lost';
  const vs = people === 1 ? ` against the ${$<HTMLSelectElement>('skill').value} computer` : '';
  const text = `King Down daily ${daily} (${game.backRank}): ${outcome} in ${n} move${n === 1 ? '' : 's'}${vs}. ${location.origin}${location.pathname}`;
  navigator.clipboard?.writeText(text).catch(() => copyFallback(text)) ?? copyFallback(text);
  $('share-result').textContent = 'Result copied';
};
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
$('white').onchange = $('black').onchange = () => {
  if (lesson != null) return; // configure the next game without turning the lesson into the saved match
  reset(); view.sync(game.pos);
  sides[0] = $<HTMLSelectElement>('white').value as Side;
  sides[1] = $<HTMLSelectElement>('black').value as Side;
  orient(); refresh(); save(); void maybeAi();
};
$('think').onchange = $('skill').onchange = save;
$('sound').onchange = () => { setSound($<HTMLInputElement>('sound').checked); save(); };
$('queen').onchange = save;
const pace = $<HTMLSelectElement>('pace');
// No saved choice: the system's reduced-motion setting picks Off.
if (matchMedia('(prefers-reduced-motion: reduce)').matches) pace.value = 'off';
pace.onchange = () => { view.setPace(pace.value as Pace); save(); };
const labels = $<HTMLInputElement>('labels');
labels.checked = params.get('labels') === '1';
labels.onchange = () => view.setLabels(labels.checked);
view.setLabels(labels.checked);
const coords = $<HTMLInputElement>('coords');
coords.onchange = () => { view.setCoords(coords.checked); save(); };
$('reset-view').onclick = () => view.resetView();
addEventListener('keydown', e => {
  if (e.key === 'Escape') { view.skip(); if (viewing != null) void showPly(game.history.length, false); selected = null; pending = []; armed = false; refresh(); return; }
  // Menus swallow shortcuts; an open move choice does not (Z there undoes, and that is tested).
  if ((e.target as HTMLElement).closest('input,select,textarea') || document.querySelector('#new-game[open], #settings[open]')) return;
  if (e.key === 'r') view.resetView();
  if (e.key === 'z') undo();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    void showPly((viewing ?? game.history.length) + (e.key === 'ArrowLeft' ? -1 : 1));
  }
});

/**
 * `?army=` or `?fen=`, with `&moves=`: a game sent by a friend (`gameLink`). It keeps this device's
 * settings, and replaces the autosave after a confirm, unless it continues the saved game.
 */
const linkMoves = params.get('moves');
const link = linkMoves != null && (params.has('army') || params.has('fen'));
/** A plain `?fen=` wins over the autosave; restore player settings before loading the game. */
const saved = params.has('fen') && !link ? null : readSave();
if (saved) {
  if (saved.white) $<HTMLSelectElement>('white').value = saved.white;
  if (saved.black) $<HTMLSelectElement>('black').value = saved.black;
  if (saved.think) $<HTMLInputElement>('think').value = String(saved.think);
  if (typeof saved.sound === 'boolean') $<HTMLInputElement>('sound').checked = saved.sound;
  if (typeof saved.queen === 'boolean') $<HTMLInputElement>('queen').checked = saved.queen;
  if (saved.pace === 'normal' || saved.pace === 'fast' || saved.pace === 'off') pace.value = saved.pace;
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
view.setPace(pace.value as Pace);
const fen = link ? null : params.get('fen');
const lans = linkMoves?.split('_').filter(Boolean) ?? [];
const continues = !!saved && (params.get('army') ? saved.back === params.get('army') : !saved.back && saved.fen === params.get('fen'))
  && saved.moves.every((m, i) => lans[i] === m);
const openLink = link && (!saved?.moves.length || continues || confirm('Open the game from this link? It replaces your current game.'));
if (link) history.replaceState(null, '', gameLinkless()); // a reload then resumes the autosave
if (openLink) {
  try {
    const army = params.get('army');
    if (army) game.newGame(army); else game.load(fromFen(params.get('fen')!));
    if (game.playLan(lans) < lans.length) alert('Part of this game link could not be read; the game stops before that move.');
  } catch (e) { alert(`This game link could not be read: ${(e as Error).message}`); game.newGame(); }
  $<HTMLSelectElement>('white').value = $<HTMLSelectElement>('black').value = 'human';
  sides[0] = sides[1] = 'human';
  linkSide = game.pos.turn;
}
else if (fen) { try { game.load(fromFen(fen)); } catch (e) { alert(`Bad fen: ${(e as Error).message}`); } }
else if (saved) {
  if (saved.link === 0 || saved.link === 1) linkSide = saved.link;
  if (typeof saved.daily === 'string') daily = saved.daily;
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
fillPowerSelect($('power-white'), GAME_RULES.kings[0]); // the next game starts with this game's powers
fillPowerSelect($('power-black'), GAME_RULES.kings[1]);
setSound($<HTMLInputElement>('sound').checked);
restoreMoments();
refresh();
if (!fen) save(); // pin the random back rank so a reload keeps this game (and keep an opened link's game)
if (finished()) showOver(); else void maybeAi();
