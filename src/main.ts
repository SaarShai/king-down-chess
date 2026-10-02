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
import { A, B, C, Color, G, K, L, LETTERS, M, Move, N, NAMES, O, P, PieceType, Position, Q, R, RULES as GAME_RULES, RULES_2017, RULES_2021, S, SPENT, T, V, colorOf, file as fileOf, findKing, isAttacked, kingLabel, KingChoice, PowerName, parseKings, pseudoMoves, rank as rankOf, setRules, sq as square, sqName, typeOf, type Rules } from './rules/engine';
import { CLASSIC_CHESS, fromFen, POOL, randomBackRank, toFen, toLan } from './rules/setup';
import { TRY_THESE } from './try-these';
import { LESSONS } from './lessons';
import { mulberry32 } from './sim/rng';

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
/** Threat markers and the keyboard cursor, drawn over the board (pointer events pass through). */
const marksLayer = document.createElement('div');
marksLayer.id = 'board-marks';
marksLayer.setAttribute('aria-hidden', 'true');
$('board').appendChild(marksLayer);
const sides: [Side, Side] = ['human', 'ai'];
let selected: number | null = null;
let pending: number[] = []; // beast chain squares clicked so far
let hovered: number | null = null;
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
/** Why the last tap did nothing ("That is Black's piece…"); shown in the help line until the next action. */
let notice = '';
/** The board is seen from Black's side (orient()). */
let flipped = false;
/** The keyboard cursor's square while the board has focus; null when it does not. */
let cursor: number | null = null;

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

/** Painted figures cut from the board's sheets (docs/visual-design/make-ui-art.py); none for the lab pieces. */
const ART: Partial<Record<PieceType, string>> = Object.fromEntries(
  ([P, N, B, R, Q, K, A, L, G, M, S, O] as PieceType[]).map(t => [t, NAMES[t]]));
const pieceArt = (t: PieceType, black = false): string | null =>
  ART[t] ? `${import.meta.env.BASE_URL}ui/pieces/${ART[t]}-${black ? 'b' : 'w'}.webp` : null;

function fillPieceGuide(): void {
  const rows = $('rules-rows');
  rows.innerHTML = '';
  for (const t of guideTypes()) {
    const g = pieceGuide(t);
    const card = document.createElement('article');
    card.className = 'piece-card';
    card.dataset.piece = NAMES[t];
    const letter = LETTERS[t];
    const name = NAMES[t][0].toUpperCase() + NAMES[t].slice(1);
    const art = pieceArt(t);
    // The heading keeps "A Archer" as one text run: tools find a card by it.
    card.innerHTML = `<div class="pc-art">${art ? `<img src="${art}" alt="" loading="lazy" decoding="async">` : `<span class="pc-medallion" aria-hidden="true">${letter}</span>`}</div>`
      + `<div class="pc-body"><h3><span class="pc-letter" title="Its letter in the move list">${letter}</span> ${name}</h3><dl>`
      + `<dt>Moves</dt><dd>${g.moves}</dd><dt>Captures</dt><dd>${g.captures}</dd>${g.special ? `<dt>Special</dt><dd>${g.special}</dd>` : ''}</dl></div>`;
    rows.appendChild(card);
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
    'In the move list: - moves, x captures, * shoots without moving (archer), <> swaps (maester), > shoves (ogre; then where the shoved piece went), = promotes.';
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
  $('move-help').textContent = notice ? notice : viewing != null
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
  // Each move is a button to the board after it (data-ply = plies played by then).
  moves.innerHTML = game.history.map((h, i) => {
    const km = marked.find(k => k.ply === i), mark = !km ? '' : km.kind !== 'loss' || km.loss >= 500 ? '??' : '?';
    // A button per move, so the list is reachable by keyboard; aria-current marks the move on the board.
    const ply = `<button type="button" data-ply="${i + 1}"${viewing === i + 1 ? ' class="viewing" aria-current="true"' : ''}${km ? ` title="${km.text}"` : ''} aria-label="${i % 2 ? 'Black' : 'White'} ${h.lan}${km ? `, ${km.text}` : ''}">${i % 2 === 0 ? `<b>${h.lan}</b>` : h.lan}${mark}</button>`;
    return i % 2 === 0 ? `<li>${i / 2 + 1}. ${ply}` : ` ${ply}</li>`;
  }).join('');
  if (viewing == null) moves.scrollTop = moves.scrollHeight;
  else moves.querySelector('.viewing')?.scrollIntoView({ block: 'nearest' });
  // Captured pieces: a piece the mover removed counts for the mover; a paladin that removes itself is its own side's loss.
  const taken: [number[], number[]] = [[], []];
  for (const h of game.history) {
    const mover = colorOf(h.pos.board[h.move.from]);
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
  const progress = $('lesson-progress');
  progress.hidden = lesson == null;
  document.body.classList.toggle('in-lesson', lesson != null);
  if (lesson != null) {
    progress.innerHTML = LESSONS.map((l, i) => `<span class="${i < lesson! || (i === lesson && lessonDone) ? 'done' : i === lesson ? 'now' : ''}" title="${l.name}"></span>`).join('');
  }
  drawMarks();
}

/** Squares the side not to move attacks: the mover's pieces it can take, and the empty squares it covers. */
function threats(): { pieces: number[]; squares: number[] } {
  const pos = game.pos, them = (pos.turn ^ 1) as Color;
  const pieces = new Set<number>(), squares: number[] = [];
  // Read-only: the engine's own move generator, asked as if it were the other side's turn.
  for (const m of pseudoMoves({ ...pos, turn: them }, 'captures')) {
    for (const c of m.captures) if (pos.board[c] && colorOf(pos.board[c]) === pos.turn) pieces.add(c);
  }
  for (let s = 0; s < 64; s++) {
    const p = pos.board[s];
    if (!p) { if (isAttacked(pos.board, s, them)) squares.push(s); }
    else if (colorOf(p) === pos.turn && typeOf(p) === K && isAttacked(pos.board, s, them)) pieces.add(s);
  }
  return { pieces: [...pieces], squares };
}

let marksFrame = 0;
/** Threat markers (Settings → Show threats) and the keyboard cursor, placed with view.screenOf(). */
function drawMarks(): void {
  cancelAnimationFrame(marksFrame);
  const on = $<HTMLInputElement>('threats').checked && viewing == null && !busy && !finished() && myTurn();
  const t = on ? threats() : { pieces: [], squares: [] };
  if (!t.pieces.length && !t.squares.length && cursor == null) { marksLayer.innerHTML = ''; return; }
  const box = $('board').getBoundingClientRect(), items: string[] = [];
  const at = (s: number, cls: string): void => {
    const c = view.screenOf(s), n = view.screenOf(fileOf(s) < 7 ? s + 1 : s - 1);
    const w = Math.hypot(c.x - n.x, c.y - n.y);
    items.push(`<i class="${cls}" style="left:${(c.x - box.left - w / 2).toFixed(1)}px;top:${(c.y - box.top - w / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${w.toFixed(1)}px"></i>`);
  };
  for (const s of t.squares) at(s, 'mk-cover');
  for (const s of t.pieces) at(s, 'mk-threat');
  if (cursor != null) at(cursor, 'mk-cursor');
  marksLayer.innerHTML = items.join('');
  // The clay camera can orbit and tween; follow it while marks are on screen.
  if (look === 'clay') marksFrame = requestAnimationFrame(drawMarks);
}
new ResizeObserver(() => drawMarks()).observe($('board'));

/** One sentence for a screen reader: who moved what, and what it did. */
function describeMove(pre: Position, m: Move): string {
  const mover = pre.board[m.from], side = colorOf(mover) ? 'Black' : 'White', name = NAMES[typeOf(mover)];
  const the = (s: number): string => `${NAMES[typeOf(pre.board[s])]} on ${sqName(s)}`;
  let text = m.shove
    ? `${side} ${name} on ${sqName(m.from)} shoves the ${the(m.shove.from)} to ${sqName(m.shove.to)}${m.to !== m.from ? `, stepping to ${sqName(m.to)}` : ''}`
    : m.swap ? `${side} ${name} on ${sqName(m.from)} swaps places with the ${the(m.to)}`
    : m.to === m.from && m.captures.length ? `${side} ${name} on ${sqName(m.from)} takes the ${m.captures.map(the).join(' and the ')} without moving`
    : `${side} ${name} ${sqName(m.from)} to ${sqName(m.to)}${m.captures.length ? `, taking the ${m.captures.map(the).join(', then the ')}` : ''}`;
  if (m.promo) text += `, and becomes a ${NAMES[m.promo]}`;
  if (m.selfRemove) text += `; the ${name} leaves the board`;
  return `${text}.`;
}

/** Why a tap on `to` did not play a move for the piece on `from` (only exported engine functions). */
function whyNot(from: number, to: number): string {
  const pos = game.pos, mover = pos.board[from], name = NAMES[typeOf(mover)], target = pos.board[to];
  if (pseudoMoves(pos).some(m => m.from === from && clickPath(m)[0] === to)) {
    return game.inCheck ? `Your king is in check, and that ${name} move does not stop it.` : `Not allowed: that ${name} move would leave your king in check.`;
  }
  if (target && typeOf(target) === G && colorOf(target) !== pos.turn && typeOf(mover) !== K) return 'Not allowed: a guard can only be taken by a king.';
  const can = game.legal.some(m => m.from === from) ? ' The marked squares show where it can go.' : '';
  return `Not allowed: the ${name} cannot ${target ? `take the ${NAMES[typeOf(target)]} on` : 'reach'} ${sqName(to)}.${can}`;
}

/** The keyboard cursor's square and piece, for the screen reader. */
function sayCursor(): void {
  if (cursor == null) return;
  const p = game.pos.board[cursor];
  const what = p ? `${colorOf(p) ? 'black' : 'white'} ${NAMES[typeOf(p)]}` : 'empty';
  const target = selected != null && candidates().some(m => clickPath(m)[pending.length] === cursor);
  $('cursor-say').textContent = `${sqName(cursor)}, ${what}${cursor === selected ? ', selected' : target ? ', can go here' : ''}`;
}

async function commit(m: Move): Promise<void> {
  const g = gen;
  busy = true;
  hintSquares = [];
  const pre = game.pos;
  navGen++;
  if (viewing != null) { viewing = null; view.sync(pre); } // a review ends when a move is played
  game.play(m);
  notice = '';
  $('announce').textContent = describeMove(pre, m) + (game.inCheck && !finished() ? ' Check.' : '') + (finished() ? ` ${result()}.` : '');
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
  selected = null; pending = [];
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
      const art = pieceArt(m.promo as PieceType, game.pos.turn === 1);
      b.innerHTML = `${art ? `<img src="${art}" alt="" aria-hidden="true">` : ''}<span>${LETTERS[m.promo!]} ${NAMES[m.promo as PieceType]}</span>`;
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

/** Drag arm: select without the click toggle so a second onSquareClick can still play the move. */
view.onDragSelect = (sq) => {
  if (busy || viewing != null || finished() || !myTurn()) return;
  if (game.pos.board[sq] === 0 || colorOf(game.pos.board[sq]) !== game.pos.turn) return;
  hintSquares = [];
  notice = '';
  selected = sq;
  pending = [];
  refresh();
  $('panel').scrollTop = 0;
};

/** Show why a tap did nothing, in the help line (a live region). */
const refuse = (why: string): void => { notice = why; refresh(); };

view.onSquareClick = (sq, shift = false) => {
  if (busy) { if (thinking) refuse('The computer is thinking. Wait for its move.'); view.skip(); return; } // a tap during an animation skips it
  if (viewing != null) { void showPly(game.history.length, false); return; }
  if (finished()) return refuse(lesson != null ? '' : 'The game is over. Start a new game, or Undo to take back a move.');
  if (!myTurn()) {
    return refuse(lessonDone ? 'Lesson done. Choose the next lesson below.'
      : sides[game.pos.turn] === 'ai' ? "It is the computer's move." : '');
  }
  hintSquares = [];
  notice = '';
  const p = game.pos.board[sq], own = p !== 0 && colorOf(p) === game.pos.turn;
  const next = candidates().filter(m => clickPath(m)[pending.length] === sq);
  if (selected == null || next.length === 0) {
    const turn = game.pos.turn ? 'Black' : 'White';
    if (selected != null && !own && sq !== selected) notice = pending.length ? 'That square is not marked, so the capture chain was cancelled.' : whyNot(selected, sq);
    else if (selected == null && p && !own) notice = `That is ${turn === 'White' ? 'Black' : 'White'}'s ${NAMES[typeOf(p)]}. ${turn} to move: choose one of your own pieces.`;
    else if (selected == null && !p) notice = `Choose one of ${turn}'s pieces first.`;
    selected = own && sq !== selected ? sq : null;
    pending = [];
    if (selected != null && !game.legal.some(m => m.from === selected)) {
      notice = `This ${NAMES[typeOf(p)]} has no legal move${game.inCheck ? ': your king is in check, and it cannot help' : ' right now'}.`;
    }
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
  selected = null; pending = [];
  notice = '';
}

/** Look from Black's side whenever the human plays Black. */
const orient = (): void => {
  flipped = sides[0] === 'human' && sides[1] === 'human' && linkSide != null ? linkSide === 1 : sides[0] === 'ai' && sides[1] === 'human';
  view.flip(flipped);
};

function newGame(backRank?: string, fen?: string | null, rematch = false, dailyDate: string | null = null): void {
  $<HTMLDialogElement>('new-game').close(); // every army choice in the dialog starts here
  reset();
  if (!rematch) setRules({ ...preset, ...(kings ? { kings: parseKings(kings) } : {}) });
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
  if (sides[game.pos.turn] === 'ai' && sides.includes('human')) game.undo();
  restoreMoments();
  view.sync(game.pos);
  $('announce').textContent = `Move taken back. ${game.pos.turn ? 'Black' : 'White'} to move.`;
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
  dlg.dataset.fallen = loser == null ? 'none' : loser ? 'b' : 'w'; // the dialog's painted kings show it too
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
  for (const k of ['rules', 'kings']) { const v = params.get(k); if (v) url.searchParams.set(k, v); }
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
  const label = button.querySelector('.label') ?? button;
  label.textContent = 'Link copied. Paste it to your friend.';
  setTimeout(() => { label.textContent = 'Send the game link'; }, 2500);
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
interface Save { daily?: string | null; back: string; fen: string; moves: string[]; white: Side; black: Side; think: number; skill?: Skill; coords: boolean; resigned: Color | null; rules?: Rules; sound?: boolean; queen?: boolean; pace?: Pace; link?: Color | null; threats?: boolean }
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
      threats: $<HTMLInputElement>('threats').checked,
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
$('threats').onchange = () => { drawMarks(); save(); };
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
  if (e.key === 'Escape') { view.skip(); if (viewing != null) void showPly(game.history.length, false); selected = null; pending = []; refresh(); return; }
  // Menus swallow shortcuts; an open move choice does not (Z there undoes, and that is tested).
  if ((e.target as HTMLElement).closest('input,select,textarea') || document.querySelector('#new-game[open], #settings[open], #title-screen[open]')) return;
  if (e.key === 'r') view.resetView();
  if (e.key === 'z') undo();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    void showPly((viewing ?? game.history.length) + (e.key === 'ArrowLeft' ? -1 : 1));
  }
});

/* ---- keyboard play on the board ---- */
const boardEl = $('board');
const homeSquare = (): number => selected ?? square(4, game.pos.turn ? 6 : 1);
boardEl.addEventListener('focus', () => {
  if (!boardEl.matches(':focus-visible')) return; // a mouse or touch tap does not show the cursor
  cursor ??= homeSquare(); sayCursor(); drawMarks();
});
boardEl.addEventListener('blur', () => { cursor = null; drawMarks(); });
boardEl.addEventListener('keydown', e => {
  const step: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  const enter = e.key === 'Enter' || e.key === ' ';
  if (!(e.key in step) && !enter) return;
  e.preventDefault(); e.stopPropagation(); // ← → here move the cursor, not the review
  if (cursor == null) cursor = homeSquare();
  else if (enter) {
    view.onSquareClick(cursor, e.shiftKey);
    if (selected === cursor) {
      const to = [...new Set(candidates().map(m => clickPath(m)[pending.length]))].map(sqName);
      $('cursor-say').textContent = to.length ? `${sqName(cursor)} selected. It can go to ${to.join(', ')}.` : '';
    }
    drawMarks();
    return;
  } else {
    const [df, dr] = step[e.key], k = flipped ? -1 : 1, f = fileOf(cursor) + df * k, r = rankOf(cursor) + dr * k;
    if (f >= 0 && f < 8 && r >= 0 && r < 8) cursor = square(f, r);
  }
  sayCursor(); drawMarks();
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
  if (typeof saved.threats === 'boolean') $<HTMLInputElement>('threats').checked = saved.threats;
  if (saved.pace === 'normal' || saved.pace === 'fast' || saved.pace === 'off') pace.value = saved.pace;
  // Old saves with no skill field stay Strong so a resumed game does not suddenly get easier.
  $<HTMLSelectElement>('skill').value = isSkill(saved.skill) ? saved.skill : 'strong';
  if (typeof saved.coords === 'boolean') coords.checked = saved.coords;
  sides[0] = $<HTMLSelectElement>('white').value as Side;
  sides[1] = $<HTMLSelectElement>('black').value as Side;
}

/*
 * Title screen: once per browser tab, never over a game link or a `?fen=`/`?army=` URL. `?title=0`
 * skips it, and so does sessionStorage `kingdown.title-seen` (the browser tools set it).
 */
const TITLE_SEEN = 'kingdown.title-seen';
const titleSeen = (): boolean => { try { return sessionStorage.getItem(TITLE_SEEN) === '1'; } catch { return false; } };
const showTitle = !link && !params.has('fen') && !params.has('army') && params.get('title') !== '0' && !titleSeen();
type TitleChoice = 'continue' | 'play' | 'learn';
let titleChoice = 'continue' as TitleChoice;
const titleClosed = new Promise<void>(resolve => {
  if (!showTitle) return resolve();
  const dlg = $<HTMLDialogElement>('title-screen');
  const resumable = !!saved && saved.moves.length > 0;
  const firstVisit = !saved;
  $('title-continue').hidden = !resumable;
  if (resumable) $('title-continue').querySelector('.label')!.textContent = `Continue · move ${Math.floor(saved!.moves.length / 2) + 1}`;
  $('title-first').hidden = !firstVisit;
  // A first visit leads with the lessons; otherwise Play (or Continue) leads.
  $('title-learn').classList.toggle('primary', firstVisit);
  $('title-play').classList.toggle('primary', !firstVisit && !resumable);
  if (firstVisit) $('title-learn').parentElement!.prepend($('title-learn'));
  const pick = (c: TitleChoice) => () => { titleChoice = c; dlg.close(); };
  $('title-continue').onclick = pick('continue');
  $('title-play').onclick = pick('play');
  $('title-learn').onclick = pick('learn');
  dlg.addEventListener('close', () => {
    try { sessionStorage.setItem(TITLE_SEEN, '1'); } catch { /* private mode: it shows again next time */ }
    document.body.classList.remove('title-up');
    resolve();
  }, { once: true });
  document.body.classList.add('title-up');
  dlg.showModal();
  ($(firstVisit ? 'title-learn' : resumable ? 'title-continue' : 'title-play')).focus();
});

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
setSound($<HTMLInputElement>('sound').checked);
restoreMoments();
refresh();
if (!fen) save(); // pin the random back rank so a reload keeps this game (and keep an opened link's game)
await titleClosed; // the computer waits for the player, and no dialog opens over the title
if (titleChoice === 'learn') startLesson(0);
else {
  if (titleChoice === 'play') $<HTMLDialogElement>('new-game').showModal();
  else if (finished()) showOver();
  void maybeAi();
}
