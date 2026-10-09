import { coinState, coinWords, POWER_TAG, type PowerCoin } from '../powers-ui';
import { moveNumber, type Color, type Move, type Position, type Rules } from '../rules/engine';
import { coinRow } from './coin';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
let reading: Color | null = null, lastPos: Position | null = null;
let armedOn = false, canUse = false, activeSide: Color = 0;
export const clearCoinRead = (): void => { reading = null; };

export function initCoins(arm: (value: boolean) => void): void {
  $('game-table').addEventListener('click', e => {
    const coin = (e.target as HTMLElement).closest<HTMLElement>('.coin');
    if (!coin) return;
    reading = coin.id === 'power-w' ? 0 : 1;
    arm(false);
  });
  $('power-use').onclick = e => {
    if (!canUse) return;
    arm(true);
    if (e.detail === 0) $('board').focus();
  };
  $('power-cancel').onclick = () => {
    clearCoinRead(); arm(false);
    $(`power-${activeSide ? 'b' : 'w'}`)?.focus();
  };
}

export interface CoinContext { read: string; note: string; armedLine: string; use: boolean }
interface CoinsState {
  pos: Position; history: readonly { pos: Position; move: Move }[]; rules: Rules;
  legal?: readonly Move[]; activeSide: Color; armed: boolean;
  canPlay: boolean; busy: boolean; flipped: boolean; lesson: number | null; selection: boolean;
}

/** Bind the row to each portrait and read only the position on the board. */
export function refreshCoins(s: CoinsState): { armed: boolean; context: CoinContext } {
  if (s.pos !== lastPos || s.selection) clearCoinRead();
  lastPos = s.pos; activeSide = s.activeSide;
  const coins = ([0, 1] as const).map(c => s.lesson == null ? coinState(s.pos, c, s.rules, s.history, s.armed && c === activeSide, s.legal, s.canPlay ? activeSide : null) : null);
  const active = coins[activeSide], tag = active && POWER_TAG[active.power];
  const eligible = !!active && !!tag && tag !== 'march' && tag !== 'leap'
    && (active.state === 'ready' || active.state === 'armed') && s.canPlay;
  armedOn = s.armed && eligible;
  canUse = reading === activeSide && eligible && !s.busy;
  const focus = document.activeElement?.id;
  for (const c of [0, 1] as const) {
    const strip = $(c === (s.flipped ? 1 : 0) ? 'strip-me' : 'strip-them');
    const old = strip.querySelector('.coin-row');
    const row = coinRow(strip.querySelector<HTMLElement>('.portrait')!, c, coins[c], s.pos);
    if (old) old.replaceWith(row); else strip.prepend(row);
  }
  if (focus === 'power-w' || focus === 'power-b') $(focus)?.focus({ preventScroll: true });
  const coin = reading == null ? null : coins[reading];
  const note = !coin || coin.state === 'always' || coin.state === 'used' ? ''
    : moveNumber(s.pos) < coin.fromMove ? ''
    : s.pos.turn !== reading || !s.canPlay ? 'Not your turn.'
    : s.pos.free || s.pos.haste !== undefined ? 'Make your move.'
    : coin.state === 'no-target' ? noTarget(coin) : '';
  return { armed: armedOn, context: {
    read: coin ? coinWords(coin, s.pos) : '', note,
    armedLine: armedOn && active ? coinWords(active, s.pos) : '', use: canUse && !armedOn,
  } };
}

function noTarget(coin: PowerCoin): string {
  switch (coin.power) {
    case 'Freeze': return 'No piece to freeze now.';
    case 'IceWall': return 'No piece to wall now.';
    case 'Sacrifice': return 'No pawn can return a piece.';
    default: return 'No legal power move now.';
  }
}
