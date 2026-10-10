import { contextLine, type ContextState } from '../context-line';
import { LESSONS } from '../lessons';
import { progress as lessonProgress } from '../lesson-shelf-ui';
import { type Game, type Side } from '../game';
import type { KeyMoment } from '../moment';
import { checkCause, describeMove, moveNumbers } from '../move-text';
import { pieceIcon } from '../piece-icons';
import { type Color, type PieceType, type Rules, type Position, A, C, L, M, NAMES, O, S, V, colorOf, typeOf } from '../rules/engine';
import { readText } from '../read';
import type { SkillName } from '../ai/skill';
import { turnLine, type Mode, type Turn } from '../turn';
import type { CoinContext } from './powers';
import type { PreviouslyState } from './previously';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const text = (id: string): string => $(id).textContent?.trim() ?? '';
let read = '', readNote = '', reading = false;
let thinkingAt = 0, thinkTimer: ReturnType<typeof setTimeout> | undefined;

export function readPiece(pos: Position, sq: number | null, inspecting: boolean): void {
  const code = sq == null ? 0 : pos.board[sq];
  const [line = '', states = ''] = sq == null ? [] : readText(pos, sq).split('\n');
  read = code ? `${colorOf(code) ? 'Black' : 'White'} ${NAMES[typeOf(code)]}.${states ? ` ${states}.` : ''}` : '';
  readNote = line.split(' · ')[1] ?? '';
  reading = inspecting;
  const button = $('all-rules');
  button.hidden = !code;
  button.onclick = () => openRules(`#rules-rows .piece-card[data-piece="${NAMES[typeOf(code)]}"]`);
}

function openRules(selector: string): void {
  $('rules-btn').click();
  const row = document.querySelector<HTMLElement>(selector);
  row?.setAttribute('tabindex', '-1');
  row?.focus({ preventScroll: true });
  const body = row?.closest<HTMLElement>('.lesson-guide-body');
  if (row && body) body.scrollTop += row.getBoundingClientRect().top - body.getBoundingClientRect().top
    - Math.max(4, (body.clientHeight - row.offsetHeight) / 2);
}

export function initTable(back: () => void): void {
  const sheet = $<HTMLDialogElement>('sheet-moves');
  $('moves-line').onclick = () => { $('moves-line').setAttribute('aria-expanded', 'true'); sheet.showModal(); };
  window.addEventListener('resize', fitPreviously);
  sheet.addEventListener('close', () => $('moves-line').setAttribute('aria-expanded', 'false'));
  // Close before a row enters Review, so the board and Back to game are in view.
  $('moves').addEventListener('click', e => { if ((e.target as HTMLElement).closest('[data-ply]')) sheet.close(); }, true);
  $('back-to-game').onclick = back;
}

/**
 * What refresh() (screen/play.ts) shows beside the board, as plain values that it reads from the turn
 * state. renderTable builds the text and the html from them, reads the snapshot at once and keeps no
 * part of it (`pending`, `sides` and `marked` are the live arrays, not copies).
 */
export interface TableSnapshot {
  /** The selected square, its piece type (0: none), and the chain squares clicked so far. */
  selected: number | null; selectedType: PieceType | 0; pending: readonly number[];
  /** The chain can stop on the last square clicked (Stop here). */
  canFinish: boolean;
  busy: boolean; thinking: boolean;
  /** Why the last tap did nothing; the help line shows it until the next action. */
  notice: string;
  /** Plies shown in review, or null for the live game; the review note of the moment shown. */
  viewing: number | null; reviewNote: string;
  /** The lesson on the board, whether its goal move was played, and the next lesson's name. */
  lesson: number | null; lessonDone: boolean; nextLesson: string | null;
  /** turn.ts `turnLine` for the turn in progress. */
  turnLine: string;
  /** The turn in progress: its side and its staged plies. */
  activeSide: Color; staged: number;
  /** The side to move is in check. */
  check: boolean;
  ended: boolean; finished: boolean; myTurn: boolean;
  /** The result line (empty while the game plays). */
  result: string;
  /** The army's back rank ('' for a custom start) and the FEN of the live position. */
  backRank: string; fen: string;
  /** The moves played: each one's text and the side that played it. */
  history: readonly { lan: string; turn: Color }[];
  /** The key moments marked in the move list. */
  marked: readonly (KeyMoment & { text: string })[];
  /** The piece codes that each side took, up to the move shown. */
  taken: readonly [readonly number[], readonly number[]];
  sides: readonly Side[]; linkSide: Color | null;
  undoOn: boolean;
  /** The side that Resign gives up now, or null while it is off. */
  resigner: Color | null;
}

/**
 * Most writes of refresh() outside the board (not the info card or End turn, which read the turn core).
 * refresh() calls it once; refreshTable runs later in the same refresh() and reads some of it back.
 */
export function renderTable(s: TableSnapshot): void {
  const { selected, selectedType, pending, canFinish, busy, thinking, notice, viewing, lesson, lessonDone, taken, sides, linkSide } = s;
  $('selection-actions').hidden = selected == null || busy;
  $('stop-chain').hidden = !canFinish;
  $('stop-chain').textContent = selectedType === S ? `Stop here (${pending.length} bite${pending.length === 1 ? '' : 's'})` : 'Stop here';
  const help: Partial<Record<PieceType, string>> = {
    [O]: 'Tap a neighbour to take or shove.',
    [A]: 'Tap a marked enemy to shoot without moving, or a marked empty square to move.',
    [M]: 'Tap your own piece to swap places.',
    [S]: pending.length ? 'Tap the next bite, or stop here.' : 'Tap a marked enemy to start a chain.',
    [L]: 'Jump over your own pieces like a queen.',
    [C]: 'Tap a marked enemy beyond a screen to lob, or an empty square to move.',
    [V]: pending.length ? 'Tap a marked landing, or stop here.' : 'Tap an enemy, then a marked landing.',
  };
  $('move-help').textContent = notice ? notice : viewing != null
    ? s.reviewNote || `Tap the board to return to the game.${matchMedia('(hover: hover)').matches ? ' ← → step through the moves.' : ''}`
    : lesson == null && s.turnLine
      ? s.turnLine
      : selected == null || busy ? ''
      : help[selectedType as PieceType] ?? 'Tap a marked square to move or take.';
  const turn = s.activeSide ? 'Black' : 'White';
  // In review the header names the move shown, as the list numbers it ("after 5… a5-a4").
  const shown = viewing == null ? '' : viewing === 0 ? 'the start'
    : `after ${Math.ceil(viewing / 2)}${viewing % 2 ? '.' : '…'} ${s.history[viewing - 1].lan}`;
  $('turn').textContent = viewing != null ? `Reviewing ${shown}`
    : lesson != null ? `Lesson ${lesson + 1} of ${LESSONS.length}: ${LESSONS[lesson].name}`
    : s.ended ? '' : `${turn} to move${s.check ? ' — CHECK' : ''}`;
  $('status').textContent = viewing != null ? '' : s.ended ? s.result : thinking ? 'thinking…' : '';
  $('setup').textContent = s.backRank || 'custom';
  $('setup').title = s.fen;
  const moves = $('moves');
  // Each move is a button to the board after it (data-ply = plies played by then). A line is White's
  // turn and Black's; a Haste turn is two plies by one side, so turns follow the side that moved.
  const numbers = moveNumbers(s.history.map(h => h.turn));
  let html = '';
  s.history.forEach((h, i) => {
    const km = s.marked.find(k => k.ply === i), mark = !km ? '' : km.kind !== 'loss' || km.loss >= 500 ? '??' : '?';
    const white = h.turn === 0;
    // A button per move, so the list is reachable by keyboard; aria-current marks the move on the board.
    const ply = `<button type="button" data-ply="${i + 1}"${viewing === i + 1 ? ' class="viewing" aria-current="true"' : ''}${km ? ` title="${km.text}"` : ''} aria-label="${white ? 'White' : 'Black'} ${h.lan}${km ? `, ${km.text}` : ''}">${white ? `<b>${h.lan}</b>` : h.lan}${mark}</button>`;
    html += i === 0 || numbers[i] !== numbers[i - 1] ? `${i ? '</li>' : ''}<li>${numbers[i]}${white ? '.' : '…'} ${ply}` : ` ${ply}`;
  });
  moves.innerHTML = html + (html ? '</li>' : '');
  if (viewing == null) moves.scrollTop = moves.scrollHeight;
  else moves.querySelector('.viewing')?.scrollIntoView({ block: 'nearest' });
  // Grouped icons in each piece's own colours (a paladin that removed itself is on its own side's line).
  // A screen reader and a pointer get the names: "pawn ×2, beast". A lab piece has no icon, only its name.
  const names = (codes: readonly number[]): string => {
    const count = new Map<number, number>(); // key: type * 2 + colour
    for (const p of codes) { const k = typeOf(p) * 2 + colorOf(p); count.set(k, (count.get(k) ?? 0) + 1); }
    return [...count].sort(([a], [b]) => a - b).map(([k, n]) => {
      const t = (k >> 1) as PieceType, icon = pieceIcon(t, (k & 1) as Color), name = `${NAMES[t]}${n > 1 ? ` ×${n}` : ''}`;
      return icon ? `<span class="took" title="${name}">${icon}${n > 1 ? `<span aria-hidden="true">×${n}</span>` : ''}<span class="sr-only">${name}</span></span>` : `<span class="took">${name}</span>`;
    }).join('<span class="sr-only">, </span>');
  };
  $('took-w').innerHTML = names(taken[0]);
  $('took-b').innerHTML = names(taken[1]);
  $('undo').hidden = lesson != null;
  $('undo').setAttribute('aria-disabled', String(!s.undoOn));
  $<HTMLButtonElement>('resign').disabled = s.resigner == null;
  $<HTMLButtonElement>('copy').disabled = s.history.length === 0;
  $('share').hidden = sides[0] !== 'human' || sides[1] !== 'human' || s.history.length === 0 || lesson != null || linkSide != null || s.staged > 0;
  $('next-lesson').hidden = lesson == null || !lessonDone;
  $('return-game').hidden = lesson == null;
  $('next-lesson').querySelector('.label')!.textContent = s.nextLesson != null ? `Next lesson: ${s.nextLesson}` : 'Start a game';
  $('show-me').hidden = lesson == null || lessonDone;
  $('show-me').setAttribute('aria-disabled', String(s.finished || busy || viewing != null || !s.myTurn));
}

export interface TableState {
  game: Game; sides: readonly Side[]; skill: SkillName; rules: Rules;
  flipped: boolean; thinking: boolean; viewing: number | null; lesson: number | null; lessonDone: boolean;
  notice: string; armed: boolean; selected: number | null; pending: readonly number[];
  linkSide: Color | null; reviewNote: string;
  turn: Turn; mode: Mode;
  power?: CoinContext;
  previously?: PreviouslyState | null;
}

export function refreshTable(s: TableState): void {
  const progress = $('lesson-progress');
  progress.hidden = s.lesson == null;
  document.body.classList.toggle('in-lesson', s.lesson != null);
  if (s.lesson != null) progress.innerHTML = LESSONS.map((lesson, i) => {
    const state = i === s.lesson && !s.lessonDone ? 'current' : lessonProgress().done?.includes(lesson.name) || (i === s.lesson && s.lessonDone) ? 'done' : 'next';
    const piece = NAMES.indexOf(lesson.name.toLowerCase() as typeof NAMES[number]) as PieceType;
    return `<span class="${state === 'current' ? 'now' : state}" role="img" aria-label="Lesson ${i + 1} of ${LESSONS.length} ${state}" title="${lesson.name}">${pieceIcon(piece)}</span>`;
  }).join('');
  const me = (s.flipped ? 1 : 0) as Color;
  const liveSide = s.turn.activeSide;
  const now = s.thinking ? performance.now() : 0;
  if (now && !thinkingAt) {
    thinkingAt = now;
    thinkTimer = setTimeout(() => {
      if (thinkingAt) $(`strip-${liveSide === me ? 'me' : 'them'}`).querySelector('small')!.textContent = 'thinking…';
    }, 1000);
  } else if (!now) { thinkingAt = 0; clearTimeout(thinkTimer); }
  for (const [id, c] of [['strip-me', me], ['strip-them', (1 - me) as Color]] as const) {
    const strip = $(id), king = s.rules.kings[c]?.king.toLowerCase() ?? (c ? 'shadow' : 'spirit');
    const img = strip.querySelector('img')!;
    img.src = `${import.meta.env.BASE_URL}ui/kings/${king}${c ? '-b' : ''}.webp`;
    const name = s.sides[c] === 'ai' ? 'Computer' : s.linkSide != null ? c === s.linkSide ? 'You' : 'Your friend'
      : s.sides.includes('ai') ? 'You' : c ? 'Black' : 'White';
    strip.querySelector('b')!.textContent = name;
    strip.querySelector('small')!.textContent = s.thinking && liveSide === c && performance.now() - thinkingAt >= 1000
      ? 'thinking…' : s.sides[c] === 'ai' ? s.skill[0].toUpperCase() + s.skill.slice(1) : '';
    strip.classList.toggle('is-turn', liveSide === c && (!text('status') || text('status') === 'thinking…'));
  }
  const history = s.game.history, shown = s.viewing == null ? history.at(-1) : history[s.viewing - 1];
  const story = shown ? describeMove(shown.pos, shown.move, true) : 'No moves yet.';
  const icon = shown && !shown.move.pass ? pieceIcon(typeOf(shown.pos.board[shown.move.from]) as PieceType, colorOf(shown.pos.board[shown.move.from])) : '';
  $('last-move').innerHTML = `${icon}<span></span>`;
  $('last-move').querySelector('span')!.textContent = story;
  $('moves').querySelectorAll<HTMLElement>('[data-ply]').forEach(row => {
    const h = history[Number(row.dataset.ply) - 1];
    row.dataset.lan = h.lan;
    row.setAttribute('aria-label', `${describeMove(h.pos, h.move, true)}${row.title ? ` ${row.title}` : ''}`);
    row.dataset.mark = row.textContent?.match(/\?*$/)?.[0] ?? '';
    if (!h.move.pass) row.insertAdjacentHTML('afterbegin', pieceIcon(typeOf(h.pos.board[h.move.from]) as PieceType, colorOf(h.pos.board[h.move.from])));
  });
  const status = text('status');
  const state: ContextState = {
    voice: s.sides.includes('ai') || s.linkSide != null ? 'you' : liveSide ? 'Black' : 'White',
    review: s.viewing != null && !s.previously?.playing ? `Review. ${s.power?.read || read || (s.viewing === 0 ? 'The start.' : `Move ${moveNumbers(history.map(h => h.pos.turn))[s.viewing - 1]}, ${shown!.pos.turn ? 'Black' : 'White'}.`)}` : '',
    result: status && status !== 'thinking…' ? status : '', refusal: s.notice,
    armed: s.armed ? s.rules.kings[s.game.pos.turn]?.power : undefined, chain: !!s.pending.length, canStop: !$('stop-chain').hidden,
    read: s.power?.read || (reading || s.selected == null ? read : ''),
    readNote: s.power?.read ? s.power.note : s.viewing != null && !read ? s.reviewNote : readNote,
    armedLine: s.power?.armedLine, powerUse: s.power?.use,
    midWay: s.game.pos.haste !== undefined || !!s.game.pos.free,
    free: !!s.game.pos.free,
    selected: s.selected == null ? '' : read,
    waiting: s.turn.waits, check: s.game.inCheck, computer: s.sides[s.game.pos.turn] === 'ai',
    checkCause: s.game.inCheck && !s.turn.staged ? checkCause(s.game.pos, history.at(-1)?.move, s.mode, s.linkSide ?? (s.sides[0] === 'ai' ? 1 : 0)) : '',
    turnLine: turnLine(s.game, s.turn, s.mode),
    stagedEnd: s.turn.staged && s.game.status !== 'playing' ? s.game.status === 'checkmate' ? 'Checkmate.' : 'Draw.' : '',
    lesson: s.lesson == null ? '' : text('turn'), lessonNote: s.lesson == null ? '' : text('moment'),
    lessonLearned: s.lessonDone && s.lesson != null ? LESSONS[s.lesson].name : '',
    link: s.linkSide != null && s.game.pos.turn !== s.linkSide && !s.turn.waits ? "Wait for your friend's link." : '',
    asset: text('asset-status'),
    previously: s.previously?.line, previouslyDetail: s.previously?.detail, previouslyBefore: s.previously?.before ?? '', seeAgain: s.previously?.seeAgain,
  };
  if (s.power?.power && !s.armed) {
    $('all-rules').hidden = false;
    $('all-rules').onclick = () => openRules(`#powers-list [data-power="${s.power!.power}"]`);
  }
  $('all-rules').hidden ||= !!s.pending.length || s.armed;
  const line = contextLine(state);
  $('context-text').replaceChildren(...[line.line, line.note, line.before ?? ''].filter(Boolean).map((words, i) => {
    const row = document.createElement('span');
    if (words === line.before) row.id = 'previously-before';
    row.textContent = words;
    return row;
  }));
  $('context-text').dataset.rank = line.rank;
  $('last-move').hidden = line.rank === 'previously';
  const again = $('see-again');
  again.hidden = !line.actions.includes('see-again');
  again.setAttribute('aria-disabled', String(!!s.previously?.playing));
  $('back-to-game').hidden = s.viewing == null;
  $('power-use').hidden = !line.actions.includes('power-use');
  $('power-use').setAttribute('aria-disabled', String(!s.power?.use));
  $('power-cancel').hidden = !line.actions.includes('power-cancel');
  const resign = $<HTMLButtonElement>('resign');
  resign.setAttribute('aria-disabled', String(resign.disabled));
  resign.disabled = false;
  fitPreviously();
}

/** Keep whole summary lines; replay and Moves retain the full turn. */
function fitPreviously(): void {
  const text = $('context-text');
  if (text.dataset.rank !== 'previously') return;
  const rows = [...text.children] as HTMLElement[];
  rows.forEach(row => { row.hidden = false; });
  const style = getComputedStyle($('context-line'));
  const height = parseFloat(style.getPropertyValue('--context-height')) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 1;
  for (const row of rows.slice(1).reverse()) {
    if (text.scrollHeight <= height + 1) break;
    row.hidden = true;
  }
}
