import './style.css';
import { SkillName, skillPlan } from './ai/skill';
import { Engine, Game, Side, resigningSide } from './game';
import { setEvaluator } from './ai/eval';
import { positionKey, type SearchResult } from './ai/search';
import { PaintedView, type BoardView, type Pace } from './render/PaintedView';
import { keyMoments, momentKind, momentText, type KeyMoment } from './moment';
import { setSound, snd } from './render/sfx';
import { STYLES } from './render/styles';
import { A, B, C, Color, G, K, KINGS, L, LETTERS, M, Move, N, NAMES, O, P, PieceType, PLAIN_KINGS, Position, Q, R, POWERS_BALANCED, RULES as GAME_RULES, RULES_2017, RULES_2021, S, SPENT, T, V, colorOf, file as fileOf, findKing, moveNumber, PowerName, parseKings, pseudoMoves, rank as rankOf, setRules, sq as square, sqName, typeOf, type Rules } from './rules/engine';
import { CLASSIC_CHESS, fromFen, POOL, randomBackRank, toFen, toLan } from './rules/setup';
import { TRY_THESE } from './try-these';
import { LESSONS } from './lessons';
import { mulberry32 } from './sim/rng';
import { describeMove, moveNumbers, nextMoveNumber, threatsIn } from './move-text';
import { POWER_NAME, POWER_TAG, autoQueen, hintMoves, kingsParam, offered, powerText, powersRules, usesAllowed, usesLeft } from './powers-ui';
import { defaultSetup, isLevel, kingsOf, newGameDialog, newGameWarning, parseSetup, playersOf, setupOfGame, type Setup } from './new-game';
import { pieceIcon } from './piece-icons';
import { copyText } from './clipboard';
import './dialog-dismiss';

const params = new URLSearchParams(location.search);
/** `?rules=2017|2021` plays an older rule set. No parameter = the measured 2026 rules. */
const preset = { 2017: RULES_2017, 2021: RULES_2021 }[params.get('rules') ?? ''];
/**
 * `?kings=spirit:mercy,mud:march` — White first; one value gives both sides the same king
 * (docs/RULES.md §4). The default is **no powers**; the New game dialog picks each side's power.
 */
const kings = params.get('kings');
// Before the first Game: its constructor builds a position and asks for its status.
/** With any power in play, the balanced readings apply (an older `?rules=` preset still overrides them). */
const withPowers = (k: Rules['kings']): Partial<Rules> => (k[0] || k[1] ? POWERS_BALANCED : {});
if (preset || kings) {
  const k = kings ? parseKings(kings) : undefined;
  setRules({ ...(k ? withPowers(k) : {}), ...preset, ...(k ? { kings: k } : {}) });
}
/** "twice a game", "always on". */
const usesText = (p: PowerName, r: Rules = GAME_RULES): string => {
  const n = usesAllowed(p, r);
  return n === null || n === 0 ? 'always on' : n === 1 ? 'once a game' : n === 2 ? 'twice a game' : `${n} times a game`;
};

/** "Freeze, 2 left — as your move, freeze…" for side `c`, or "no power". */
const powerLabel = (c: Color): string => {
  const k = GAME_RULES.kings[c];
  if (!k) return 'no power';
  const left = usesLeft(shownPos(), c);
  return `${POWER_NAME[k.power]}${left === null ? '' : `, ${left} left`} — ${powerText(k.power)}`;
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
// Clay (three.js) is a separate chunk, fetched only for that look; painted needs none of it.
// The painted board stands on the page's parchment floor: the scene draws no floor of its own.
const view: BoardView = look === 'clay' ? await (await import('./render/clay')).createClayView($('board')) : new PaintedView($('board'), { floor: null });
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
/** The computer's level in this game (New game sets it). */
let skill: SkillName = 'club';
/** The next game's setup: the last one started from New game (remembered across visits). */
let setup: Setup = defaultSetup();
let selected: number | null = null;
let pending: number[] = []; // beast chain squares clicked so far
let hovered: number | null = null;
/** A piece that a tap (or Enter) chose to read: an enemy piece, or any piece while the player cannot move. Its card shows while no piece is selected or under the pointer. */
let inspected: number | null = null;
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
/** Squares lit by Hint. Cleared by a move, another selection, the power button and Esc. */
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
/** The position on the board: in review the move shown, else the live game. The readouts read it. */
const shownPos = (): Position => (viewing == null ? game.pos : game.history[viewing].pos);
/** Bumped by every review step, so a superseded step's animation does not sync the board. */
let navGen = 0;
/** A review step is replaying a move; `busy` is set too, so the board treats it as an animation. */
let replaying = false;
/** The finished game's key moments, marked in the move list; cleared when the game changes. */
let marked: (KeyMoment & { text: string })[] = [];
/** Replaces the review help line while a key moment is on the board. */
let reviewNote = '';
/** Why the last tap did nothing ("Not allowed: the rook cannot reach b2."); shown in the help line until the next action. */
let notice = '';
/** The board is seen from Black's side (orient()). */
let flipped = false;
/** The keyboard cursor's square while the board has focus; null when it does not. */
let cursor: number | null = null;

/** The game is over: mate, a draw, or somebody resigned. Blocks input and the AI. */
const finished = (): boolean => resigned != null || game.status !== 'playing';
/** This device may move now: a person's turn, and in a link game only its own side. */
const myTurn = (): boolean => sides[game.pos.turn] === 'human' && (linkSide == null || game.pos.turn === linkSide) && !lessonDone;
/** The side Resign gives up now (`resigningSide`), or null while it is off: the game is over, a lesson, or the computer thinks. */
const resigner = (): Color | null => (finished() || lesson != null || thinking ? null : resigningSide(sides, game.pos.turn, linkSide));

/** Player-facing columns for one piece under the live `GAME_RULES` (and `POOL`). */
type GuideRow = { moves: string; captures: string; special: string };

const ARCHER_SHOT_TEXT: Record<string, string> = {
  classic: 'Shoots without moving: an enemy diagonally adjacent, or exactly 2 squares away orthogonally, through blockers.',
  plusDiag2: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus any enemy exactly 2 squares away diagonally, through blockers.',
  ring2: 'Shoots without moving: any enemy on a diagonally adjacent square or anywhere on the ring 2 squares away, through blockers.',
  forward3: 'Shoots without moving: an enemy on either forward diagonal, or the square exactly 2 ahead, through blockers.',
  plusDiagFwd2: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus either forward diagonal at distance 2, through blockers.',
  plusDiagFwd2Clear: 'Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2, through blockers) plus either forward diagonal at distance 2, over an empty square.',
  fwd2NoBack: 'Shoots without moving: an enemy diagonally adjacent, exactly 2 squares ahead or to the side, or either forward diagonal at distance 2, through blockers.',
  fwd2NoSide: 'Shoots without moving: an enemy diagonally adjacent, exactly 2 squares ahead or behind, or either forward diagonal at distance 2, through blockers.',
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
  ([P, N, B, R, Q, A, L, G, M, S, O] as PieceType[]).map(t => [t, NAMES[t]]));
/** A side's king as the board draws him: the king it plays (Spirit and Shadow without powers), in its army's colour. */
const kingArt = (c: Color): string =>
  `${import.meta.env.BASE_URL}ui/kings/${(GAME_RULES.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase()}${c ? '-b' : ''}.webp`;
const pieceArt = (t: PieceType, black = false): string | null =>
  t === K ? kingArt(black ? 1 : 0)
    : ART[t] ? `${import.meta.env.BASE_URL}ui/pieces/${ART[t]}-${black ? 'b' : 'w'}.webp` : null;

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
    // The heading shows the piece's icon before its name (tools find a card by data-piece); a lab piece has
    // no icon and shows its letter, as its art does.
    const icon = pieceIcon(t);
    card.innerHTML = `<div class="pc-art">${art ? `<img src="${art}" alt="" loading="lazy" decoding="async">` : `<span class="pc-medallion" aria-hidden="true">${letter}</span>`}</div>`
      + `<div class="pc-body"><h3>${icon || `<span class="pc-letter" title="Its letter in the move list">${letter}</span>`} ${name}</h3><dl>`
      + `<dt>Moves</dt><dd>${g.moves}</dd><dt>Captures</dt><dd>${g.captures}</dd>${g.special ? `<dt>Special</dt><dd>${g.special}</dd>` : ''}</dl></div>`;
    rows.appendChild(card);
  }
  const promo = GAME_RULES.promotionSet === 'anyNonKing'
    ? 'A pawn promotes to any piece but a king.'
    : GAME_RULES.promotionSet === 'anyNonKingNoGuard'
      ? 'A pawn promotes to any piece but a king or a guard.'
      : 'A pawn promotes to a queen, rook, bishop, or knight.';
  $('rules-lead').textContent =
    `Mate the king. Both sides share one random back rank, drawn from the pool. No castling or en passant. ${promo}`;
  $('rules-notation').textContent =
    // The move list keeps the letters (LAN), so the Guide names them here, once.
    `In the move list a move starts with its piece's letter (none for a pawn): ${([N, B, R, Q, K, A, L, G, M, S, O] as PieceType[]).map(t => `${LETTERS[t]} ${NAMES[t]}`).join(', ')}. `
    + 'Then - moves, x captures, * shoots without moving (archer), <> swaps (maester), > shoves (ogre; then where the shoved piece went), = promotes. '
    + 'Kings\' powers: ! Strike, !H Haste (-- ends a Haste turn early), ~ Flight, !F: Freeze, !W: Ice Wall, !S: Sacrifice, !M March, !L Leap.';
  // The twelve powers as a game with powers plays them: this game's rules when a king has a power,
  // else the official readings, which an older `?rules=` preset overrides (as the New game picker shows them).
  const pr: Rules = GAME_RULES.kings[0] || GAME_RULES.kings[1] ? GAME_RULES : powersRules(preset);
  $('powers-list').innerHTML = (Object.entries(KINGS) as [string, readonly PowerName[]][]).map(([king, powers]) =>
    `<li><b>${king} king</b>: ${powers.map(p => `<b>${POWER_NAME[p]}</b> (${usesText(p, pr)}) — ${powerText(p, pr)}`).join('; ')}.</li>`).join('');
  // Each piece once, as its icon and how many the pool holds ("×2"); its name for a pointer and a screen reader.
  const pool = [...new Set(POOL)].map(ch => {
    const t = LETTERS.indexOf(ch) as PieceType, n = POOL.split(ch).length - 1, icon = pieceIcon(t);
    const name = `${NAMES[t]}${n > 1 ? ` ×${n}` : ''}`;
    return icon ? `<span class="pool-piece" title="${name}">${icon}${n > 1 ? `<span aria-hidden="true">×${n}</span>` : ''}<span class="sr-only">${name}</span></span>` : `<span class="pool-piece">${name}</span>`;
  }).join('<span class="sr-only">, </span>');
  $('rules-letters').innerHTML =
    `The random draw pool is ${pool}. Seven pieces join the king; two drawn bishops start on opposite colours. Custom setup and a pasted position can place other pieces.`;
}

/** A piece's rules in one line, for its card and the screen reader. */
const pieceText = (t: PieceType): string => {
  const g = pieceGuide(t);
  return [g.moves, g.captures, g.special].filter(Boolean).join(' ');
};

function showInfo(sq: number | null): void {
  const code = sq == null ? 0 : shownPos().board[sq];
  const t = code ? typeOf(code) : 0;
  const blurb = t ? pieceText(t) : '';
  $('info').innerHTML = (code
    ? `<b>${pieceIcon(typeOf(code), colorOf(code))} ${colorOf(code) ? 'Black' : 'White'} ${NAMES[t]}</b><br>${blurb}`
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
    && offered(m, tag));
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
  const shoves = cands.filter(m => m.shove).map(m => m.shove!.from);
  // Armed Freeze / Ice Wall / Sacrifice name a piece: a power target, not a capture.
  const named = [...new Set(markTargets().map(m => m.to))];
  const step = (m: Move): number | undefined => clickPath(m)[pending.length];
  const powers = [...new Set([...cands.filter(m => m.power && !m.pass).map(step).filter((s): s is number => s != null), ...named])];
  // The Archer shoots without moving: its target gets a sight rather than a strike.
  const shots = [...new Set(cands.filter(m => m.to === m.from && m.captures.length && step(m) === m.captures[0]).map(m => m.captures[0]))];
  const last = (viewing == null ? game.history.at(-1) : game.history[viewing - 1])?.move;
  view.highlight({
    selected,
    moves: next.filter(sq => !game.pos.board[sq]),
    captures: next.filter(sq => game.pos.board[sq] !== 0 && !swaps.includes(sq) && !shoves.includes(sq) && !named.includes(sq)),
    swaps,
    shoves,
    shots,
    powers,
    // Owner (2026-10-04): the square the piece left is not marked; where it went (or what it hit) is.
    last: !last ? [] : last.shove ? [last.shove.from, last.shove.to] : last.to === last.from ? [...last.captures] : [last.to],
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
  // Each move is a button to the board after it (data-ply = plies played by then). A line is White's
  // turn and Black's; a Haste turn is two plies by one side, so turns follow the side that moved.
  const numbers = moveNumbers(game.history.map(h => h.pos.turn));
  let html = '';
  game.history.forEach((h, i) => {
    const km = marked.find(k => k.ply === i), mark = !km ? '' : km.kind !== 'loss' || km.loss >= 500 ? '??' : '?';
    const white = h.pos.turn === 0;
    // A button per move, so the list is reachable by keyboard; aria-current marks the move on the board.
    const ply = `<button type="button" data-ply="${i + 1}"${viewing === i + 1 ? ' class="viewing" aria-current="true"' : ''}${km ? ` title="${km.text}"` : ''} aria-label="${white ? 'White' : 'Black'} ${h.lan}${km ? `, ${km.text}` : ''}">${white ? `<b>${h.lan}</b>` : h.lan}${mark}</button>`;
    html += i === 0 || numbers[i] !== numbers[i - 1] ? `${i ? '</li>' : ''}<li>${numbers[i]}${white ? '.' : '…'} ${ply}` : ` ${ply}`;
  });
  moves.innerHTML = html + (html ? '</li>' : '');
  if (viewing == null) moves.scrollTop = moves.scrollHeight;
  else moves.querySelector('.viewing')?.scrollIntoView({ block: 'nearest' });
  // Captured pieces: a piece the mover removed counts for the mover; a paladin that removes itself is its own side's loss.
  const taken: [number[], number[]] = [[], []];
  for (const h of game.history.slice(0, viewing ?? game.history.length)) { // in review, the moves up to the one shown
    const mover = h.pos.turn; // not the piece on `from`: a Freeze names an enemy square
    for (const c of h.move.captures) taken[mover].push(h.pos.board[c]);
    if (h.move.selfRemove) taken[1 - mover].push(h.pos.board[h.move.from]);
  }
  // Grouped icons in each piece's own colours (a paladin that removed itself is on its own side's line).
  // A screen reader and a pointer get the names: "pawn ×2, beast". A lab piece has no icon, only its name.
  const names = (codes: number[]): string => {
    const count = new Map<number, number>(); // key: type * 2 + colour
    for (const p of codes) { const k = typeOf(p) * 2 + colorOf(p); count.set(k, (count.get(k) ?? 0) + 1); }
    return [...count].sort(([a], [b]) => a - b).map(([k, n]) => {
      const t = (k >> 1) as PieceType, icon = pieceIcon(t, (k & 1) as Color), name = `${NAMES[t]}${n > 1 ? ` ×${n}` : ''}`;
      return icon ? `<span class="took" title="${name}">${icon}${n > 1 ? `<span aria-hidden="true">×${n}</span>` : ''}<span class="sr-only">${name}</span></span>` : `<span class="took">${name}</span>`;
    }).join('<span class="sr-only">, </span>');
  };
  $('took-w').innerHTML = names(taken[0]);
  $('took-b').innerHTML = names(taken[1]);
  showInfo(selected ?? hovered ?? inspected);
  $<HTMLButtonElement>('undo').disabled = game.history.length === 0;
  $<HTMLButtonElement>('resign').disabled = resigner() == null;
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
    // Each lesson as the icon of the piece it teaches (a lesson is named after its piece).
    const taught = (name: string) => NAMES.indexOf(name.toLowerCase() as typeof NAMES[number]) as PieceType;
    progress.innerHTML = LESSONS.map((l, i) => `<span class="${i < lesson! || (i === lesson && lessonDone) ? 'done' : i === lesson ? 'now' : ''}" title="${l.name}">${pieceIcon(taught(l.name))}</span>`).join('');
  }
  refreshPowers();
  drawMarks();
}

/** The power bar: arm the side to move's power, end a Haste turn, or read an always-on power. */
function refreshPowers(): void {
  const c = game.pos.turn, k = GAME_RULES.kings[c];
  const live = !!k && viewing == null && !finished() && lesson == null;
  const tag = k ? POWER_TAG[k.power] : undefined;
  const left = usesLeft(game.pos, c);
  const spendable = !!tag && tag !== 'march' && tag !== 'leap';
  const midTurn = game.pos.haste !== undefined || !!game.pos.free; // a Haste or a free mark awaits its next move
  const from = k ? GAME_RULES.fromMove[k.power] : undefined, early = from !== undefined && moveNumber(game.pos) < from; // `Rules.fromMove`
  const usable = live && myTurn() && spendable && left !== 0 && !midTurn && game.legal.some(m => m.power === tag);
  if (!usable) armed = false; // not when only busy: the power stays armed through Hint's search
  const canUse = usable && !busy;
  $('powers').hidden = !live;
  const btn = $<HTMLButtonElement>('power-btn');
  btn.hidden = !spendable;
  btn.disabled = !canUse;
  btn.textContent = !k ? '' : armed ? `Cancel ${POWER_NAME[k.power]}` : `Use ${POWER_NAME[k.power]}${early ? ` (from move ${from})` : left === null ? '' : ` (${left} left)`}`;
  btn.classList.toggle('armed', armed);
  $('end-haste').hidden = !(live && myTurn() && !busy && midTurn);
  $('power-status').textContent = !k ? '' : armed
    ? (tag === 'freeze' ? 'Tap an enemy piece to freeze it for one turn.'
      : tag === 'ward' ? 'Tap one of your pieces to wall it for one turn.'
      : tag === 'sacrifice' ? 'Tap one of your pawns to bring back a lost piece there.'
      : tag === 'haste' ? 'Move a piece; it may then move again.'
      : `Choose a piece, then a marked square (${POWER_NAME[k.power]}).`)
    : game.pos.haste !== undefined && myTurn() ? 'Haste: move the same piece again, or end the turn.'
    : game.pos.free && myTurn() ? 'Now make your move, or end the turn.'
    : ''; // the info card already says what each king's power does
}

let marksFrame = 0;
/** Threat markers (Settings → Show threats) and the keyboard cursor, placed with view.screenOf(). */
function drawMarks(): void {
  cancelAnimationFrame(marksFrame);
  view.setPreview?.(cursor);
  const on = $<HTMLInputElement>('threats').checked && viewing == null && !busy && !finished() && myTurn();
  const t = on ? threatsIn(game.pos) : { pieces: [], squares: [] };
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

/** Why a tap on `to` did not play a move for the piece on `from` (only exported engine functions). */
function whyNot(from: number, to: number): string {
  const pos = game.pos, mover = pos.board[from], name = NAMES[typeOf(mover)], target = pos.board[to];
  // Only the moves a click can reach (candidates()): an unarmed power move is not "a move into check".
  const tag = armedTag();
  if (pseudoMoves(pos).some(m => m.from === from && offered(m, tag) && clickPath(m)[0] === to)) {
    return game.inCheck ? `Your king is in check, and that ${name} move does not stop it.` : `Not allowed: that ${name} move would leave your king in check.`;
  }
  if (target && typeOf(target) === G && colorOf(target) !== pos.turn && typeOf(mover) !== K) return 'Not allowed: a guard can only be taken by a king.';
  const can = game.legal.some(m => m.from === from && offered(m, tag)) ? ' The marked squares show where it can go.' : '';
  return `Not allowed: the ${name} cannot ${target ? `take the ${NAMES[typeOf(target)]} on` : 'reach'} ${sqName(to)}.${can}`;
}

/** The keyboard cursor's square and piece, for the screen reader. */
function sayCursor(): void {
  if (cursor == null) return;
  const p = shownPos().board[cursor];
  const what = p ? `${colorOf(p) ? 'black' : 'white'} ${NAMES[typeOf(p)]}` : 'empty';
  const target = selected != null && candidates().some(m => clickPath(m)[pending.length] === cursor);
  const card = cursor === inspected ? `. ${pieceText(typeOf(p))}` : ''; // a piece chosen with Enter to read: its card
  $('cursor-say').textContent = `${sqName(cursor)}, ${what}${cursor === selected ? ', selected' : target ? ', can go here' : card}`;
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
  selected = null; pending = []; armed = false; inspected = null;
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
  if (l.goal(pre, m)) { lessonDone = true; said = `Well done. ${l.done}`; noteLesson(l.name); }
  else { game.undo(); view.sync(game.pos); said = `Not quite. ${l.task}`; }
  $('moment').textContent = said;
  refresh();
}

/** Lessons done, by name, in localStorage `kingdown.lessons` (the account keeps a copy; nothing shows it yet). */
function noteLesson(name: string): void {
  try {
    const done: string[] = JSON.parse(localStorage.getItem('kingdown.lessons') ?? '{}').done ?? [];
    if (!done.includes(name)) localStorage.setItem('kingdown.lessons', JSON.stringify({ done: [...done, name] }));
  } catch { /* private mode */ }
  account?.changed();
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

/** The Workshop (docs/WORKSHOP.md): its own chunk, loaded on the first tap. It opens over its caller, which stays open. */
let workshop: Promise<ReturnType<typeof import('./workshop/dialog')['workshopDialog']>> | undefined;
function openWorkshop(code?: string): void {
  workshop ??= import('./workshop/dialog').then(m => m.workshopDialog());
  workshop.then(w => (code ? w.openDesign(code) : w.open()), () => {
    workshop = undefined;
    alert('The Workshop could not load. Check the connection and try again.');
  });
}
$('title-workshop').onclick = () => openWorkshop();
$('workshop-btn').onclick = () => openWorkshop();
$('return-game').onclick = () => {
  if (!lessonReturn) return;
  const s = cloudGame ? readSave() : null;
  if (s) return openSaved(s);
  reset();
  ({ game, resigned, linkSide } = lessonReturn);
  [sides[0], sides[1]] = lessonReturn.sides;
  setRules(lessonReturn.rules);
  lessonReturn = null;
  lesson = null; lessonDone = false;
  restoreMoments();
  view.sync(game.pos);
  orient();
  refresh();
  save();
  if (finished()) showOver(); else void maybeAi();
};
$('next-lesson').onclick = () => {
  if (lesson != null && lesson + 1 < LESSONS.length) startLesson(lesson + 1);
  else openNewGame();
};

/** `?think=<ms>`: a shorter thinking time for the browser checks, under each level's cap (ai/skill.ts). */
const thinkMs = Number(params.get('think')) || undefined;

async function maybeAi(): Promise<void> {
  if (busy || finished() || sides[game.pos.turn] !== 'ai') return;
  busy = thinking = true;
  refresh();
  const g = gen;
  const plan = skillPlan(skill, game.history.length, thinkMs);
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
      b.innerHTML = `${art ? `<img src="${art}" alt="" aria-hidden="true">` : ''}<span>${pieceIcon(m.promo as PieceType, game.pos.turn)} ${NAMES[m.promo as PieceType]}</span>`;
      b.onclick = () => done(m);
      box.appendChild(b);
    }
    $('cancel-promo').onclick = () => done(null);
    dlg.oncancel = e => { e.preventDefault(); done(null); };
    dlg.showModal();
  });
}

async function choose(moves: Move[]): Promise<void> {
  const queen = $<HTMLInputElement>('queen').checked ? autoQueen(moves) : undefined;
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
      b.innerHTML = `${pieceIcon(x.promo as PieceType, game.pos.turn)} ${NAMES[x.promo as PieceType]}`;
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

$('power-btn').onclick = () => { armed = !armed; selected = null; pending = []; hintSquares = []; refresh(); };
$('end-haste').onclick = () => {
  const pass = game.legal.find(m => m.pass);
  if (pass && myTurn() && !busy) void commit(pass);
};

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

/** Show why a tap on `sq` did nothing, in the help line (a live region). A piece on `sq` shows its card. */
const refuse = (why: string, sq: number): void => { inspected = game.pos.board[sq] ? sq : null; notice = why; refresh(); };

view.onSquareClick = (sq, shift = false) => {
  if (busy) { if (thinking) refuse('The computer is thinking. Wait for its move.', sq); view.skip(); return; } // a tap during an animation skips it
  if (viewing != null) { void showPly(game.history.length, false); return; }
  if (finished()) return refuse(lesson != null ? '' : 'The game is over. Start a new game, or Undo to take back a move.', sq);
  if (!myTurn()) {
    return refuse(lessonDone ? 'Lesson done. Choose the next lesson below.'
      : sides[game.pos.turn] === 'ai' ? "It is the computer's move." : '', sq);
  }
  hintSquares = [];
  notice = '';
  inspected = null;
  const targets = markTargets();
  if (targets.length) { // armed Freeze / Ice Wall / Sacrifice: tap the piece itself
    const here = targets.filter(m => m.to === sq);
    if (here.length) void choosePower(here);
    else { armed = false; refresh(); }
    return;
  }
  const p = game.pos.board[sq], own = p !== 0 && colorOf(p) === game.pos.turn;
  const next = candidates().filter(m => clickPath(m)[pending.length] === sq);
  if (selected == null || next.length === 0) {
    const turn = game.pos.turn ? 'Black' : 'White';
    if (selected != null && !own && sq !== selected) notice = pending.length ? 'That square is not marked, so the capture chain was cancelled.' : whyNot(selected, sq);
    else if (selected == null && !p) notice = `Choose one of ${turn}'s pieces first.`;
    if (p && !own) inspected = sq; // an enemy piece that is no target: its card; with a piece selected, the help line still says why
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
  showInfo(selected ?? hovered ?? inspected);
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
  const tag = armedTag(), l = lesson == null ? null : LESSONS[lesson], pos = game.pos;
  const rootMoves = hintMoves(game.legal, tag, l ? m => l.goal(pos, m) : undefined, $<HTMLInputElement>('queen').checked);
  if (!rootMoves.length) { notice = 'Hint finds no move to play now.'; return refresh(); }
  busy = true;
  refresh();
  const g = gen;
  const res = await engine.think(pos, { timeMs: 400, maxDepth: 3, history: game.history.map(h => positionKey(h.pos)), rootMoves });
  if (g !== gen) return;
  busy = false;
  // Esc during the search disarms the power, and the board then refuses the move found for it.
  if (res.move && armedTag() === tag) {
    if (res.move.pass) notice = 'Hint: end the turn.';
    else { selected = null; pending = []; hintSquares = [res.move.from, ...clickPath(res.move)]; } // the first hinted tap selects the piece
  }
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
  selected = null; pending = []; hintSquares = []; reviewNote = ''; inspected = null;
  refresh();
  sayCursor(); // the keyboard cursor reads the board now shown
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
  selected = null; pending = []; armed = false; inspected = null;
  notice = '';
}

/** Look from Black's side whenever the human plays Black. */
const orient = (): void => {
  flipped = sides[0] === 'human' && sides[1] === 'human' && linkSide != null ? linkSide === 1 : sides[0] === 'ai' && sides[1] === 'human';
  view.flip(flipped);
};

/**
 * A game from `setup` (New game's last Start), or a rematch of this one with the sides swapped.
 * `players` overrides who plays (Ogre practice is for two people).
 */
function newGame(backRank?: string, fen?: string | null, rematch = false, dailyDate: string | null = null, players?: [Side, Side]): void {
  $<HTMLDialogElement>('new-game').close(); // every army choice in the dialog starts here
  reset();
  if (!rematch) {
    const k = kingsOf(setup);
    setRules({ ...withPowers(k), ...preset, kings: k });
    skill = setup.level;
  }
  resigned = null;
  linkSide = null;
  lesson = null; lessonDone = false;
  lessonReturn = null;
  cloudGame = false;
  daily = dailyDate;
  seenMoments.clear();
  said = '';
  $('moment').textContent = '';
  [sides[0], sides[1]] = players ?? (rematch ? [sides[1], sides[0]] : playersOf(setup));
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
  while (game.history.length && ((sides[game.pos.turn] === 'ai' && sides.includes('human')) || game.pos.haste !== undefined || game.pos.free)) game.undo();
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

/** Moves played so far, counted as the move list numbers them (a Haste turn is one move). */
const movesPlayed = (): number => moveNumbers(game.history.map(h => h.pos.turn)).at(-1) ?? 0;

function showOver(): void {
  const n = movesPlayed();
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
  dlg.querySelector<HTMLImageElement>('.over-w')!.src = kingArt(0); // the kings that played, as on the board
  dlg.querySelector<HTMLImageElement>('.over-b')!.src = kingArt(1);
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
    newGame(game.backRank || undefined, game.backRank ? null : toFen(game.history[0]?.pos ?? game.pos), true);
  }
};

$('undo').onclick = undo;
$('resign').onclick = () => {
  const side = resigner();
  if (side == null || !confirm(`Resign as ${side ? 'Black' : 'White'}?`)) return;
  reset();
  resigned = side;
  refresh();
  save();
  showOver();
};
$('copy').onclick = () => {
  const text = game.history.map((h, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${h.lan}` : h.lan)).join(' ');
  void copyAndSay($('copy'), text, 'Moves copied');
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
  await copyAndSay(button, url, 'Link copied. Paste it to your friend.');
};

/** Copies `text`, then says on `button` (its label) for 2.5 s what happened: `done` only after the copy succeeds. */
async function copyAndSay(button: HTMLElement, text: string, done: string): Promise<void> {
  const label = button.querySelector<HTMLElement>('.label') ?? button, idle = label.dataset.idle ??= label.textContent ?? '';
  label.textContent = await copyText(text) ? done : 'Could not copy';
  setTimeout(() => { label.textContent = idle; }, 2500);
}

/* ---- autosave ---- */
/**
 * account/sync.ts splits these fields into settings and the saved game: name a new one there too. Write
 * a new setting only when it is not at its default. Then an old save keeps its JSON. If not, the first
 * save after an update counts as a settings change, and it wins over newer settings in the account.
 */
interface Save { daily?: string | null; back: string; fen: string; moves: string[]; white: Side; black: Side; skill?: SkillName; coords: boolean; resigned: Color | null; rules?: Rules; sound?: boolean; queen?: boolean; pace?: Pace; link?: Color | null; threats?: boolean; labels?: true }
const SAVE_KEY = 'kingdown.save';
/** Settings → Account and the cloud save, loaded after the board is drawn (null until then, or offline). */
let account: typeof import('./account/account') | null = null;
/** A newer saved game came from the account during a lesson: Return to game opens it. */
let cloudGame = false;

/** The save's settings fields (account/sync.ts SETTINGS). */
const settingsNow = () => ({
  skill,
  coords: coords.checked,
  sound: $<HTMLInputElement>('sound').checked,
  queen: $<HTMLInputElement>('queen').checked,
  pace: pace.value as Pace,
  threats: $<HTMLInputElement>('threats').checked,
  labels: labels.checked || undefined, // a new setting: written only when on
});

function save(): void {
  // A lesson never replaces the saved game: it changes only the settings in the save.
  const kept = lesson == null ? null : readSave();
  if (lesson != null && !kept) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(kept ? { ...kept, ...settingsNow() } : {
      back: game.backRank,
      fen: toFen(game.history[0]?.pos ?? game.pos), // the position the game started from
      moves: game.history.map(h => h.lan),
      white: sides[0], black: sides[1],
      ...settingsNow(),
      link: linkSide,
      daily,
      resigned,
      // The rules the game is playing, so opening the save without its URL replays the same game
      // (`?rules=2017`, `?kings=…`; docs/TAKEOVER-PLAN.md §2).
      rules: { ...GAME_RULES },
    } satisfies Save));
  } catch { /* private mode or a full quota: play on without a save */ }
  account?.changed();
}

/** A save's settings onto the controls (at start-up, or newer ones from the account). */
function applySettings(s: Save): void {
  if (typeof s.sound === 'boolean') $<HTMLInputElement>('sound').checked = s.sound;
  if (typeof s.queen === 'boolean') $<HTMLInputElement>('queen').checked = s.queen;
  if (typeof s.threats === 'boolean') $<HTMLInputElement>('threats').checked = s.threats;
  if (s.pace === 'normal' || s.pace === 'fast' || s.pace === 'off') pace.value = s.pace;
  // Old saves with no skill field stay Strong so a resumed game does not suddenly get easier.
  skill = isLevel(s.skill) ? s.skill : 'strong';
  if (typeof s.coords === 'boolean') coords.checked = s.coords;
  labels.checked = s.labels === true; // no field: off (an old save, or the account's settings with the letters off)
}

/** A save's rules, army and moves onto `game`; a save it cannot read starts a new game. */
function replay(s: Save): void {
  try {
    if (s.rules) setRules(s.rules); // before playLan: the moves must replay under their own rules
    if (s.back) game.newGame(s.back); else game.load(fromFen(s.fen));
    game.playLan(s.moves);
    resigned = s.resigned ?? null;
  } catch { game.newGame(); } // a save from an older format: start fresh
}

/** Sections the account had newer than this device; account/sync.ts already wrote them to the save. */
function fromAccount(down: string[]): void {
  const s = readSave();
  if (!s) return;
  if (down.includes('settings')) {
    applySettings(s);
    setSound($<HTMLInputElement>('sound').checked); applyPace(); view.setCoords(coords.checked); view.setLabels(labels.checked);
    refresh();
  }
  if (down.includes('saved_game')) { if (lesson != null) cloudGame = true; else if (!fen) openSaved(s); }
}

function labelContinue(): void {
  if (!game.history.length) return;
  $('title-continue').querySelector('.label')!.textContent = `Continue · move ${nextMoveNumber(game.history.map(h => h.pos.turn), game.pos.turn)}`;
}

/** The account's saved game replaces the one on the board (but not a position opened by `?fen=`). */
function openSaved(s: Save): void {
  reset();
  $<HTMLDialogElement>('over').close();
  cloudGame = false;
  lesson = null; lessonDone = false; lessonReturn = null;
  if (isSide(s.white)) sides[0] = s.white;
  if (isSide(s.black)) sides[1] = s.black;
  linkSide = s.link === 0 || s.link === 1 ? s.link : null;
  daily = typeof s.daily === 'string' ? s.daily : null;
  resigned = null;
  replay(s);
  restoreMoments();
  said = 'Loaded your newer saved game from your account.';
  $('moment').textContent = said;
  view.sync(game.pos);
  orient();
  fillPieceGuide();
  refresh();
  // Over the title or New game the computer waits, as at start-up; the title offers this game.
  if ($<HTMLDialogElement>('title-screen').open) { $('title-continue').hidden = !game.history.length; labelContinue(); }
  else if (!$<HTMLDialogElement>('new-game').open) void maybeAi();
}

function readSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? (JSON.parse(raw) as Save) : null;
    return s && Array.isArray(s.moves) ? s : null;
  } catch { return null; }
}

/* ---- New game ---- */
const SETUP_KEY = 'kingdown.new-game';
const loadSetup = (): Setup | null => { try { return parseSetup(JSON.parse(localStorage.getItem(SETUP_KEY) ?? 'null')); } catch { return null; } };
/** Today's army: the same random army for every player on a given local date. */
const today = (): string => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const OGRE_PRACTICE = '7k/8/6o1/8/2OP4/8/8/K7 w - - 0 1';
for (const row of TRY_THESE) {
  const option = document.createElement('option');
  option.value = row.code;
  option.textContent = `${row.code}${row.code.includes('C') ? ' — Catapult lab' : ''}`;
  option.title = row.watch;
  $('army-examples').appendChild(option);
}
/** Start game: the dialog's setup becomes the next game's, and its army starts. */
const dialog = newGameDialog(s => {
  let back: string | undefined;
  if (s.army === 'custom') {
    back = prompt(`Back rank (8 letters, one K; current draw pool ${POOL}):`, game.backRank)?.toUpperCase().trim();
    if (!back) return; // the dialog stays open
    if (back.split('S').length > 2) { alert('One Beast per army.'); return; } // owner, 2026-10-04
  }
  setup = s;
  try { localStorage.setItem(SETUP_KEY, JSON.stringify(s)); } catch { /* private mode: the choices last this visit */ }
  if (s.army === 'daily') { const d = today(); newGame(randomBackRank(mulberry32(+d.replace(/-/g, ''))), null, false, d); }
  else if (s.army === 'classic') newGame(CLASSIC_CHESS);
  else if (s.army === 'ogre') newGame(undefined, OGRE_PRACTICE, false, null, ['human', 'human']);
  else if (back) { try { newGame(back); } catch (e) { alert((e as Error).message); } }
  else if (s.army !== 'random') {
    newGame(s.army);
    const example = TRY_THESE.find(row => row.code === s.army);
    if (example) { said = example.watch; $('moment').textContent = said; }
  } else newGame(randomBackRank());
}, preset);
const openNewGame = (): void => dialog.open(setup, newGameWarning({
  moves: (lessonReturn?.game ?? game).history.length, move: moveNumber((lessonReturn?.game ?? game).pos),
  ended: (lessonReturn ? lessonReturn.resigned : resigned) != null || (lessonReturn?.game ?? game).status !== 'playing',
}));

$('new-game-btn').onclick = openNewGame;
$('settings-btn').onclick = () => $<HTMLDialogElement>('settings').showModal();
$('rules-btn').onclick = () => {
  fillPieceGuide();
  $<HTMLDialogElement>('rules').showModal();
};
$('share-result').onclick = () => {
  const n = movesPlayed(), people = sides.filter(s => s === 'human').length;
  const me = sides.indexOf('human') as Color, winner = resigned != null ? 1 - resigned : game.status === 'checkmate' ? 1 - game.pos.turn : -1;
  const outcome = people !== 1 ? result().toLowerCase() : winner < 0 ? 'drew' : winner === me ? 'won' : 'lost';
  const vs = people === 1 ? ` against the ${skill} computer` : '';
  const text = `King Down daily ${daily} (${game.backRank}): ${outcome} in ${n} move${n === 1 ? '' : 's'}${vs}. ${location.origin}${location.pathname}`;
  void copyAndSay($('share-result'), text, 'Result copied');
};
$('sound').onchange = () => { setSound($<HTMLInputElement>('sound').checked); save(); };
$('queen').onchange = save;
$('threats').onchange = () => { drawMarks(); save(); };
const pace = $<HTMLSelectElement>('pace');
// No saved choice: the system's reduced-motion setting picks Off.
if (matchMedia('(prefers-reduced-motion: reduce)').matches) pace.value = 'off';
/** The board's animation speed; Off also stills the New game picker's motion art (power-motion.css), as reduced motion does. */
function applyPace(): void {
  view.setPace(pace.value as Pace);
  document.documentElement.dataset.pace = pace.value;
}
pace.onchange = () => { applyPace(); save(); };
const labels = $<HTMLInputElement>('labels');
labels.onchange = () => { view.setLabels(labels.checked); save(); };
const coords = $<HTMLInputElement>('coords');
coords.onchange = () => { view.setCoords(coords.checked); save(); };
$('reset-view').onclick = () => view.resetView();
addEventListener('keydown', e => {
  // No game key acts under a dialog: there Esc only closes the dialog (the Workshop's Esc closes its top sheet,
  // else an open choices panel, else the Workshop).
  if (document.querySelector('dialog[open]')) return;
  if (e.key === 'Escape') { view.skip(); if (viewing != null) void showPly(game.history.length, false); selected = null; pending = []; armed = false; hintSquares = []; refresh(); return; }
  // Nor in a field that takes typing.
  const field = e.target as HTMLElement;
  if (field.closest('input,select,textarea') || field.isContentEditable) return;
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
  // A mouse or touch tap focuses the board without the cursor: ← → then still step through the review.
  if (cursor == null && !enter) return;
  e.preventDefault(); e.stopPropagation(); // with the cursor on, ← → move it instead of the review
  if (cursor == null) cursor = homeSquare();
  else if (enter) {
    view.onSquareClick(cursor, e.shiftKey);
    if (selected === cursor) {
      const to = [...new Set(candidates().map(m => clickPath(m)[pending.length]))].map(sqName);
      $('cursor-say').textContent = to.length ? `${sqName(cursor)} selected. It can go to ${to.join(', ')}.` : '';
    } else if (inspected === cursor) sayCursor(); // a piece to read: its card, said as a tap shows it
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
const isSide = (v: unknown): v is Side => v === 'human' || v === 'ai';
if (saved) {
  if (isSide(saved.white)) sides[0] = saved.white;
  if (isSide(saved.black)) sides[1] = saved.black;
  applySettings(saved);
}
setup = loadSetup() ?? (saved ? setupOfGame(sides, saved.rules?.kings ?? [null, null], skill) : defaultSetup());
/** `?players=human,ai` (White, then Black): who plays the game this page opens. For the lab and the browser checks. */
const urlPlayers = params.get('players')?.split(',');
if (urlPlayers?.length === 2 && urlPlayers.every(isSide)) [sides[0], sides[1]] = urlPlayers;

/*
 * Title screen: once per browser tab, never over a game link or a `?fen=`/`?army=` URL. `?title=0`
 * skips it, and so does sessionStorage `kingdown.title-seen` (the browser tools set it).
 */
const TITLE_SEEN = 'kingdown.title-seen';
const titleSeen = (): boolean => { try { return sessionStorage.getItem(TITLE_SEEN) === '1'; } catch { return false; } };
const showTitle = !link && !params.has('fen') && !params.has('army') && !params.has('design') && params.get('title') !== '0' && !titleSeen();
type TitleChoice = 'continue' | 'play' | 'learn';
let titleChoice = 'continue' as TitleChoice;
const titleClosed = new Promise<void>(resolve => {
  if (!showTitle) return resolve();
  const dlg = $<HTMLDialogElement>('title-screen');
  const resumable = !!saved && saved.moves.length > 0;
  const firstVisit = !saved;
  $('title-continue').hidden = !resumable;
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
  document.documentElement.dataset.pace = pace.value; // before it opens: Animations Off skips the entrance (style.css)
  dlg.showModal();
  // The six kings' resting effects: loaded after the title is up, so its first paint never waits; none
  // with Animations Off or reduced motion (the module checks reduced motion itself).
  if (pace.value !== 'off') void import('../docs/2d-first-pieces/board/title-kings.mjs').then(({ startTitleKings }) => {
    if (!dlg.open) return;
    const kings = startTitleKings(dlg.querySelector('.title-kings')!, { enabled: () => pace.value !== 'off' && !document.querySelector('#workshop[open]') });
    (window as unknown as { titleKings?: unknown }).titleKings = kings; // for the browser checks
    dlg.addEventListener('close', () => kings.stop(), { once: true });
  }).catch(() => { /* offline before it was cached: the still kings stay */ });
  ($(firstVisit ? 'title-learn' : resumable ? 'title-continue' : 'title-play')).focus();
});

// The playable game has one art direction; study controls stay in the study.
view.applyStyle(STYLES.clay);
if (params.get('labels') === '1') labels.checked = true; // `?labels=1` turns the letters on over the saved choice
view.setLabels(labels.checked);
view.setCoords(coords.checked);
applyPace();
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
  } else replay(saved);
}
// The title's Continue names the move the restored game is on (set before the first paint; a
// Haste turn is two plies by one side, so the number comes from the replayed game, not the save).
if (showTitle) labelContinue();
orient();
view.sync(game.pos);
await view.ready();
if ($('asset-status').textContent === 'Loading pieces…') $('asset-status').textContent = '';
fillPieceGuide(); // after every setRules path (URL preset / save restore)
setSound($<HTMLInputElement>('sound').checked);
restoreMoments();
refresh();
if (!fen) save(); // pin the random back rank so a reload keeps this game (and keep an opened link's game)
void import('./account/account').then(m => { account = m; m.changed(); m.startAccount(fromAccount); })
  .catch(() => { /* offline on a first visit: play on without an account */ });
const designLink = params.get('design');
if (designLink) {
  const url = new URL(location.href);
  url.searchParams.delete('design');
  history.replaceState(null, '', url); // a reload then shows the game
  openWorkshop(designLink);
}
await titleClosed; // the computer waits for the player, and no dialog opens over the title
if (titleChoice === 'learn') startLesson(0);
else {
  if (titleChoice === 'play') {
    // The saved game's computer waits behind the dialog: it may move only once New game is closed
    // (a started game runs its own computer; maybeAi() does nothing while one is already thinking).
    $('new-game').addEventListener('close', () => void maybeAi(), { once: true });
    openNewGame();
  }
  else {
    if (finished()) showOver();
    void maybeAi();
  }
}
