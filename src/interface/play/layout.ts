// The viewport and setup set the board position. A turn never changes it.
export type Setup = 'pieces' | 'powers' | 'cards' | 'both';
export type Form = 'tall' | 'compact' | 'wide';
export interface GameLayout {
  kind: 'stack' | 'rail';
  form: Form;
  W: number; H: number;
  board: number; gap: number; col: number;
  opp: number; reader: number; own: number; fin: number;
  railTop: number; railH: number;
  boardX: number; boardY: number;
  readerY: number; handY: number; actionY: number;
}

export function gameLayout(W: number, H: number, _setup: Setup): GameLayout {
  if (W < H * 1.25) {
    const compact = H < 760, form = compact ? 'compact' : 'tall';
    const scale = compact ? 1 : Math.min(1.2, Math.max(1, Math.min(W / 390, H / 844)));
    const opp = compact ? 48 : 60, reader = compact ? 60 : 76, fin = compact ? 48 : 56;
    const own = Math.round(compact ? 90 : 110 * scale);
    const top = compact ? 2 : 6, bottom = compact ? 6 : 16;
    const toBoard = compact ? 17 : 20, toReader = compact ? 6 : 12;
    const toHand = compact ? 3 : 18, toActions = compact ? 8 : 14;
    const fixed = top + opp + toBoard + toReader + reader + toHand + own + toActions + fin + bottom;
    const edge = compact && W <= 375 ? 8 : 16;
    const board = Math.max(8, Math.min(W - edge, 640, H - fixed));
    const spare = Math.max(0, H - fixed - board);
    const railTop = top + Math.round(spare / 2), boardY = railTop + opp + toBoard;
    const actionY = H - bottom - fin;
    const col = Math.min(W - 24, Math.max(0, board - 16));
    return { kind: 'stack', form, W, H, board, col, gap: 0, opp, reader, own, fin, railTop, railH: H,
      boardX: (W - board) / 2, boardY, readerY: boardY + board + toReader + Math.floor(spare / 2),
      handY: actionY - toActions - own, actionY };
  }
  const compact = H < 640;
  const opp = compact ? 48 : 60, reader = compact ? 60 : 76, own = compact ? 90 : 124, fin = compact ? 48 : 56;
  const gap = compact ? 22 : 56;
  const board = Math.max(8, Math.min(704, H - (compact ? 16 : 112), W - gap - (compact ? 256 : 370)));
  const col = Math.min(380, W - board - gap - 32);
  const free = W - board - gap - col, boardX = Math.max(16, Math.round(free / 2));
  const boardY = compact ? Math.max(12, Math.floor((H - board) / 2)) : (H - board) / 2;
  const readerY = compact ? boardY + opp + 10 : boardY + opp + 26;
  // Wide: one group from the board top. The History row (reading-b.css: 32 px after the reader, 48 px high), the hand 18 px
  // later, the tray 16 px below the hand; spare space stays below. A board too short for the group keeps the bottom places.
  const bottomHand = boardY + board - fin - (compact ? 10 : 18) - own;
  const handY = compact ? bottomHand : Math.min(bottomHand, readerY + reader + 32 + 48 + 18);
  const actionY = compact ? boardY + board - fin : Math.min(boardY + board - fin, handY + own + 16);
  return { kind: 'rail', form: compact ? 'compact' : 'wide', W, H, board, col, gap, opp, reader, own, fin,
    railTop: boardY, railH: board, boardX, boardY, readerY, handY, actionY };
}

/** A panel's top and height in the game box: below its control when 220 px fit above the floor, else above it. */
export function panelBox(floor: number, top: number, bottom: number) {
  const below = floor - bottom >= 220, at = below ? Math.max(4, bottom) : Math.max(4, top - 380);
  return { top: at, height: Math.max(88, (below ? floor - 8 : top) - at) };
}
