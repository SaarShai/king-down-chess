// Stage "readingb" (launch decisions 33 and 34): the layout classes of the game screen.
// Inputs: the viewport after the safe areas and the game type. The game state is not an input, so a select,
// a staged step or a reply never moves the board. All values are CSS px.
export type Setup = 'pieces' | 'powers' | 'cards';
export type Form = 'tall' | 'compact' | 'wide';
export interface GameLayout {
  /** Stack: one column (opponent strip, reader, board, resources, finish row). Rail: the board at the left, the rest at the right. */
  kind: 'stack' | 'rail';
  /** The reader type: tall phone, compact (one pinned header), or wide (larger type, two resource rows). */
  form: Form;
  W: number; H: number;
  board: number; head: number; gap: number;
  /** Stack: the width of the column. Rail: the width of the rail. */
  col: number;
  opp: number; reader: number; own: number; fin: number;
  /** Rail: the top and the height of the rail. */
  railTop: number; railH: number;
  /** 0: pieces only. 1: the power and the cards in one row (option c2). 2: the power above the cards (option c1). */
  ownRows: 0 | 1 | 2;
  /** The column or rail is under 352 px: the opponent controls use less width. */
  narrow: boolean;
  boardX: number; boardY: number;
}
/** The space above the board for the figures of the back rank (the earlier layout's own rule). */
export const clearance = (board: number) => Math.ceil(.03 * board) + 1;
/** The largest board in steps of 8 px that is `limit` wide or less and fits `room` with its clearance. */
function fit(room: number, limit: number) {
  let board = Math.floor(Math.min(limit, room) / 8) * 8;
  while (board > 8 && board + clearance(board) > room) board -= 8;
  return Math.max(8, board);
}
/** Each form's row heights from the design: opponent strip, the reader's least height, one resource row, finish row. */
const ROWS = { tall: { opp: 56, reader: 283, own: 56, fin: 60 }, compact: { opp: 44, reader: 134, own: 46, fin: 52 }, wide: { opp: 56, reader: 0, own: 0, fin: 64 } };
/** One resource row needs 352 px for 14 px card names (80 px power, four 64 px cards, four 4 px gaps). */
export const ONE_ROW = 352;

export function gameLayout(W: number, H: number, setup: Setup): GameLayout {
  W = Math.max(0, W); H = Math.max(0, H);
  if (W < H * 1.2) {
    const form: Form = H >= 760 ? 'tall' : 'compact', rows = ROWS[form];
    // A column under 352 px (the soft case) cannot hold one resource row: the power goes above the cards and the board gives way.
    const narrow = W - 8 < ONE_ROW, cardRows = narrow ? 2 : 1;
    // The board keeps its size in every game type; Pieces only gives the resource rows to the reader and puts the board lower.
    const board = fit(H - rows.opp - rows.reader - cardRows * rows.own - rows.fin, W - 8), head = clearance(board);
    const ownRows = setup === 'pieces' ? 0 : setup === 'powers' ? 1 : cardRows, own = ownRows * rows.own, col = Math.max(board, Math.min(W - 8, ONE_ROW));
    return { kind: 'stack', form, W, H, board, head, gap: 0, col, opp: rows.opp, own, fin: rows.fin, reader: H - rows.opp - own - rows.fin - head - board,
      railTop: 0, railH: 0, ownRows, narrow, boardX: (W - board) / 2, boardY: H - rows.fin - own - board };
  }
  // Rail. The board takes the height less the margins, and leaves 320 px for the rail; the rail can give way to 280 px so that
  // the squares stay 44 px. The board stops at 960 px and the group is centred.
  const side = H < 600, gap = side ? 16 : 32, edge = 8;
  const margin = side ? 2 : Math.min(37.5, Math.max(4, (H - 600) / 8));
  const board = fit(H - 2 * margin, Math.min(960, Math.max(W - 320 - gap - edge, Math.min(8 * 44, W - 280 - gap - edge))));
  const head = clearance(board), rail = Math.min(440, W - board - gap - edge);
  const form: Form = side ? 'compact' : rail >= 400 && H >= 700 ? 'wide' : 'tall', narrow = rail < ONE_ROW;
  const ownRows = setup === 'pieces' ? 0 : setup === 'powers' ? 1 : form === 'wide' || narrow ? 2 : 1;
  // Wide: 8 + power 48 + 8 + cards 136 + 8. The other forms: one or two rows of the phone height.
  const own = form === 'wide' ? [0, 64, 208][ownRows] : ownRows * ROWS[form].own, { opp, fin } = ROWS[form];
  // The rail has the height of the board and its clearance; it grows to the whole height when the reader needs more.
  const railH = Math.max(head + board, Math.min(H - 2 * margin, opp + own + fin + ROWS[form === 'compact' ? 'compact' : 'tall'].reader));
  const left = (W - (board + gap + rail)) / 2;
  return { kind: 'rail', form, W, H, board, head, gap, col: rail, opp, own, fin, reader: railH - opp - own - fin, railTop: (H - railH) / 2, railH, ownRows, narrow, boardX: left, boardY: (H - head - board) / 2 + head };
}
