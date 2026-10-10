import type { Game } from '../game';
import { clickPath } from '../marks-model';
import { NAMES, colorOf, file as fileOf, rank as rankOf, sq as square, sqName, typeOf, type Move, type Position } from '../rules/engine';
import { pieceText } from '../ui/guide';
import { connectReadKey } from '../ui/read';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/**
 * The keys: the page keys (Esc, r, z, ← →) and the keyboard cursor on the board (arrows, Enter or Space,
 * i to read). The keys own the cursor square and send commands; `drawMarks` (main.ts) draws the cursor.
 */
export function connectKeys(board: HTMLElement, c: {
  game(): Game;
  /** The position on the board (in review, the move shown). */
  shownPos(): Position;
  selected(): number | null;
  pending(): readonly number[];
  inspected(): number | null;
  candidates(): Move[];
  flipped(): boolean;
  /** No page key acts (the home screen is up). */
  blocked(): boolean;
  click(sq: number, shift: boolean): void;
  /** `i`: read the piece on the cursor. */
  read(sq: number): void;
  drawMarks(): void;
  escape(): void;
  resetView(): void;
  undo(): void;
  /** ← →: one move back or forward in the review. */
  step(by: -1 | 1): void;
}) {
  /** The keyboard cursor's square while the board has focus; null when it does not. */
  let cursor: number | null = null;
  addEventListener('keydown', e => {
    // No game key acts under a dialog: there Esc only closes the dialog (the Workshop's Esc closes its top sheet,
    // else an open choices panel, else the Workshop).
    if (c.blocked() || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') { c.escape(); return; }
    // Nor in a field that takes typing.
    const field = e.target as HTMLElement;
    if (field.closest('input,select,textarea') || field.isContentEditable) return;
    if (e.key === 'r') c.resetView();
    if (e.key === 'z') c.undo();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      c.step(e.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  /* ---- keyboard play on the board ---- */
  const homeSquare = (): number => c.selected() ?? square(4, c.game().pos.turn ? 6 : 1);
  /** The keyboard cursor's square and piece, for the screen reader. */
  function sayCursor(): void {
    if (cursor == null) return;
    const p = c.shownPos().board[cursor];
    const what = p ? `${colorOf(p) ? 'black' : 'white'} ${NAMES[typeOf(p)]}` : 'empty';
    const selected = c.selected(), target = selected != null && c.candidates().some(m => clickPath(m)[c.pending().length] === cursor);
    const card = cursor === c.inspected() ? `. ${pieceText(typeOf(p))}` : ''; // a piece chosen with Enter to read: its card
    $('cursor-say').textContent = `${sqName(cursor)}, ${what}${cursor === selected ? ', selected' : target ? ', can go here' : card}`;
  }
  connectReadKey(board, () => cursor, c.read);
  board.addEventListener('focus', () => {
    if (!board.matches(':focus-visible')) return; // a mouse or touch tap does not show the cursor
    cursor ??= homeSquare(); sayCursor(); c.drawMarks();
  });
  board.addEventListener('blur', () => { cursor = null; c.drawMarks(); });
  board.addEventListener('keydown', e => {
    const step: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const enter = e.key === 'Enter' || e.key === ' ';
    if (!(e.key in step) && !enter) return;
    // A mouse or touch tap focuses the board without the cursor: ← → then still step through the review.
    if (cursor == null && !enter) return;
    e.preventDefault(); e.stopPropagation(); // with the cursor on, ← → move it instead of the review
    if (cursor == null) cursor = homeSquare();
    else if (enter) {
      c.click(cursor, e.shiftKey);
      if (c.selected() === cursor) {
        const to = [...new Set(c.candidates().map(m => clickPath(m)[c.pending().length]))].map(sqName);
        $('cursor-say').textContent = to.length ? `${sqName(cursor)} selected. It can go to ${to.join(', ')}.` : '';
      } else if (c.inspected() === cursor) sayCursor(); // a piece to read: its card, said as a tap shows it
      c.drawMarks();
      return;
    } else {
      const [df, dr] = step[e.key], k = c.flipped() ? -1 : 1, f = fileOf(cursor) + df * k, r = rankOf(cursor) + dr * k;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) cursor = square(f, r);
    }
    sayCursor(); c.drawMarks();
  });
  return {
    cursor: (): number | null => cursor,
    say: sayCursor,
    /** The board takes the focus (End turn): from the keyboard, the cursor starts on the home square. */
    focus(keyboard: boolean): void { cursor = keyboard ? homeSquare() : null; sayCursor(); c.drawMarks(); },
  };
}
