import { contextLine, type ContextState } from '../context-line';
import { LESSONS } from '../lessons';
import { type Game, type Side } from '../game';
import { checkCause, describeMove } from '../move-text';
import { pieceIcon } from '../piece-icons';
import { type Color, type PieceType, type Rules, type Position, NAMES, colorOf, typeOf } from '../rules/engine';
import { readText } from '../read';
import type { SkillName } from '../ai/skill';
import { turnLine, type Mode, type Turn } from '../turn';
import type { CoinContext } from './powers';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const text = (id: string): string => $(id).textContent?.trim() ?? '';
let read = '', readNote = '', reading = false;
let thinkingAt = 0, thinkTimer: ReturnType<typeof setTimeout> | undefined;

export function readPiece(pos: Position, sq: number | null, inspecting: boolean): void {
  const code = sq == null ? 0 : pos.board[sq];
  const [line = '', states = ''] = sq == null ? [] : readText(pos, sq).split('\n');
  read = code ? `${colorOf(code) ? 'Black' : 'White'} ${NAMES[typeOf(code)]}.${states ? ` ${states}` : ''}` : '';
  readNote = line.split(' · ')[1] ?? '';
  reading = inspecting;
  const button = $('all-rules');
  button.hidden = !code;
  button.onclick = () => {
    $('rules-btn').click();
    const card = document.querySelector<HTMLElement>(`#rules [data-piece="${NAMES[typeOf(code)]}"]`);
    card?.setAttribute('tabindex', '-1');
    card?.focus();
    card?.scrollIntoView({ block: 'center' });
  };
}

export function initTable(back: () => void): void {
  const sheet = $<HTMLDialogElement>('sheet-moves');
  $('moves-line').onclick = () => { $('moves-line').setAttribute('aria-expanded', 'true'); sheet.showModal(); };
  sheet.addEventListener('close', () => $('moves-line').setAttribute('aria-expanded', 'false'));
  // Close before a row enters Review, so the board and Back to game are in view.
  $('moves').addEventListener('click', e => { if ((e.target as HTMLElement).closest('[data-ply]')) sheet.close(); }, true);
  $('back-to-game').onclick = back;
}

export interface TableState {
  game: Game; sides: readonly Side[]; skill: SkillName; rules: Rules;
  flipped: boolean; thinking: boolean; viewing: number | null; lesson: number | null; lessonDone: boolean;
  notice: string; armed: boolean; selected: number | null; pending: readonly number[];
  linkSide: Color | null; reviewNote: string;
  turn: Turn; mode: Mode;
  power?: CoinContext;
}

export function refreshTable(s: TableState): void {
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
    row.dataset.mark = row.textContent?.match(/\?*$/)?.[0] ?? '';
    if (!h.move.pass) row.insertAdjacentHTML('afterbegin', pieceIcon(typeOf(h.pos.board[h.move.from]) as PieceType, colorOf(h.pos.board[h.move.from])));
  });
  const status = text('status');
  const state: ContextState = {
    voice: s.sides.includes('ai') || s.linkSide != null ? 'you' : liveSide ? 'Black' : 'White',
    review: s.viewing != null ? `Review. ${s.power?.read || read || (s.viewing === 0 ? 'The start.' : `Move ${s.viewing}.`)}` : '',
    result: status && status !== 'thinking…' ? status : '', refusal: s.notice,
    armed: s.armed ? s.rules.kings[s.game.pos.turn]?.power : undefined, chain: !!s.pending.length, canStop: !$('stop-chain').hidden,
    read: s.power?.read || (reading || s.selected == null ? read : ''),
    readNote: s.power?.read ? s.power.note : s.viewing != null && !read ? s.reviewNote : readNote,
    armedLine: s.power?.armedLine, powerUse: s.power?.use,
    midWay: s.game.pos.haste !== undefined || !!s.game.pos.free,
    free: !!s.game.pos.free,
    selected: s.selected == null ? '' : read,
    waiting: s.turn.waits, check: s.game.inCheck, computer: s.sides[s.game.pos.turn] === 'ai',
    checkCause: s.game.inCheck && !s.turn.staged ? checkCause(s.game.pos, history.at(-1)?.move) : '',
    turnLine: turnLine(s.game, s.turn, s.mode),
    stagedEnd: s.turn.staged && s.game.status !== 'playing' ? s.game.status === 'checkmate' ? 'Checkmate.' : 'Draw.' : '',
    lesson: s.lesson == null ? '' : text('turn'), lessonNote: s.lesson == null ? '' : text('moment'),
    lessonLearned: s.lessonDone && s.lesson != null ? LESSONS[s.lesson].name : '',
    link: s.linkSide != null && s.game.pos.turn !== s.linkSide && !s.turn.waits ? "Wait for your friend's link." : '',
    asset: text('asset-status'),
  };
  $('all-rules').hidden ||= !!s.pending.length;
  const line = contextLine(state);
  $('context-text').replaceChildren(...[line.line, line.note].filter(Boolean).map(words => {
    const row = document.createElement('span');
    row.textContent = words;
    return row;
  }));
  $('context-text').dataset.rank = line.rank;
  $('back-to-game').hidden = s.viewing == null;
  $('power-use').hidden = !line.actions.includes('power-use');
  $('power-use').setAttribute('aria-disabled', String(!s.power?.use));
  $('power-cancel').hidden = !line.actions.includes('power-cancel');
  const resign = $<HTMLButtonElement>('resign');
  resign.setAttribute('aria-disabled', String(resign.disabled));
  resign.disabled = false;
}
