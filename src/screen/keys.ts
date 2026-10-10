import type { Game } from '../game';
import { clickPath } from '../marks-model';
import { NAMES, colorOf, file as fileOf, rank as rankOf, sq as square, sqName, typeOf, type Move, type Position } from '../rules/engine';
import { pieceText } from '../ui/guide';
import { connectReadKey } from '../ui/read';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** What the keys read from the turn core (screen/play.ts) at call time. */
export interface KeysPlay {
  game(): Game;
  /** The position on the board (in review, the move shown). */
  shownPos(): Position;
  selected(): number | null;
  pending(): readonly number[];
  inspected(): number | null;
  candidates(): Move[];
  flipped(): boolean;
  /** Draws the threat marks and the keyboard cursor. */
  drawMarks(): void;
}

/** The commands that the keys send, and `blocked`: no page key acts now (the home screen is up). */
export interface KeyCommands {
  blocked(): boolean;
  click(sq: number, shift: boolean): void;
  /** `i`: read the piece on the cursor. */
  read(sq: number): void;
  escape(): void;
  resetView(): void;
  undo(): void;
  /** ← →: one move back or forward in the review. */
  step(by: -1 | 1): void;
}

/**
 * The keys: the page keys (Esc, r, z, ← →) and the keyboard cursor on the board (arrows, Enter or Space,
 * i to read). The keys own the cursor square and send commands; `drawMarks` (screen/play.ts) draws the cursor.
 */
export function connectKeys(board: HTMLElement, play: KeysPlay, commands: KeyCommands) {
  /** The keyboard cursor's square while the board has focus; null when it does not. */
  let cursor: number | null = null;
  addEventListener('keydown', e => {
    // No game key acts under a dialog: there Esc only closes the dialog (the Workshop's Esc closes its top sheet,
    // else an open choices panel, else the Workshop).
    if (commands.blocked() || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') { commands.escape(); return; }
    // Nor in a field that takes typing.
    const field = e.target as HTMLElement;
    if (field.closest('input,select,textarea') || field.isContentEditable) return;
    if (e.key === 'r') commands.resetView();
    if (e.key === 'z') commands.undo();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      commands.step(e.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  /* ---- keyboard play on the board ---- */
  const homeSquare = (): number => play.selected() ?? square(4, play.game().pos.turn ? 6 : 1);
  /** The keyboard cursor's square and piece, for the screen reader. */
  function sayCursor(): void {
    if (cursor == null) return;
    const p = play.shownPos().board[cursor];
    const what = p ? `${colorOf(p) ? 'black' : 'white'} ${NAMES[typeOf(p)]}` : 'empty';
    const selected = play.selected(), target = selected != null && play.candidates().some(m => clickPath(m)[play.pending().length] === cursor);
    const card = cursor === play.inspected() ? `. ${pieceText(typeOf(p))}` : ''; // a piece chosen with Enter to read: its card
    $('cursor-say').textContent = `${sqName(cursor)}, ${what}${cursor === selected ? ', selected' : target ? ', can go here' : card}`;
  }
  connectReadKey(board, () => cursor, commands.read);
  board.addEventListener('focus', () => {
    if (!board.matches(':focus-visible')) return; // a mouse or touch tap does not show the cursor
    cursor ??= homeSquare(); sayCursor(); play.drawMarks();
  });
  board.addEventListener('blur', () => { cursor = null; play.drawMarks(); });
  board.addEventListener('keydown', e => {
    const step: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const enter = e.key === 'Enter' || e.key === ' ';
    if (!(e.key in step) && !enter) return;
    // A mouse or touch tap focuses the board without the cursor: ← → then still step through the review.
    if (cursor == null && !enter) return;
    e.preventDefault(); e.stopPropagation(); // with the cursor on, ← → move it instead of the review
    if (cursor == null) cursor = homeSquare();
    else if (enter) {
      commands.click(cursor, e.shiftKey);
      if (play.selected() === cursor) {
        const to = [...new Set(play.candidates().map(m => clickPath(m)[play.pending().length]))].map(sqName);
        $('cursor-say').textContent = to.length ? `${sqName(cursor)} selected. It can go to ${to.join(', ')}.` : '';
      } else if (play.inspected() === cursor) sayCursor(); // a piece to read: its card, said as a tap shows it
      play.drawMarks();
      return;
    } else {
      const [df, dr] = step[e.key], k = play.flipped() ? -1 : 1, f = fileOf(cursor) + df * k, r = rankOf(cursor) + dr * k;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) cursor = square(f, r);
    }
    sayCursor(); play.drawMarks();
  });
  return {
    cursor: (): number | null => cursor,
    say: sayCursor,
    /** The board takes the focus (End turn): from the keyboard, the cursor starts on the home square. */
    focus(keyboard: boolean): void { cursor = keyboard ? homeSquare() : null; sayCursor(); play.drawMarks(); },
  };
}
