import { startCeremony } from './ceremony';
import { shouldPlayCeremony } from './ceremony-game';
import type { Game, Side } from './game';
import type { BoardView } from './render/PaintedView';
import { findKing, type Color, type Position } from './rules/engine';

/** The result opens after the board beats. A new game drops every old wait. */
export function connectGameEnd(view: BoardView, board: HTMLElement, dialog: HTMLDialogElement, tiles: HTMLElement, c: {
  game(): Game;
  sides(): readonly [Side, Side];
  linkSide(): Color | null;
  resigned(): Color | null;
  generation(): number;
  motion(): boolean;
  newGameSheet: HTMLDialogElement;
  turnButton: HTMLButtonElement;
  lock(value: boolean): void;
  refresh(): void;
  announce(ceremony: boolean): void;
  showPly(ply: number, replay: boolean): Promise<void>;
  rematch(): void;
}) {
  let seen: Position | null = null, control: ReturnType<typeof startCeremony> | null = null;
  let active = false, pending = false, run = 0, king: number | null = null;
  const onRematch = (e: MouseEvent): void => { e.stopImmediatePropagation(); c.rematch(); };
  const clearButton = (): void => {
    active = false;
    c.turnButton.removeEventListener('click', onRematch, true);
    c.turnButton.classList.remove('ceremony-rematch', 'primary');
  };
  const refresh = (): void => {
    if (!active) return;
    c.turnButton.textContent = 'Rematch';
    c.turnButton.setAttribute('aria-disabled', 'false');
    c.turnButton.classList.add('ceremony-rematch', 'primary');
  };
  const clear = (): void => { control?.cancel(); run++; pending = false; control = null; clearButton(); };
  const reset = (): void => { clear(); seen = null; tiles.replaceChildren(); };
  const dismiss = (): void => {
    if (!pending) return;
    clear(); view.sync(c.game().pos); view.setFallen(king, false);
    c.lock(false); c.refresh();
  };
  new MutationObserver(() => { if (c.newGameSheet.open) dismiss(); })
    .observe(c.newGameSheet, { attributes: true, attributeFilter: ['open'] });
  const open = (played: boolean, live: () => boolean): void => {
    if (!live()) return;
    const sheet = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (sheet) { sheet.addEventListener('close', () => open(played, live), { once: true }); return; }
    pending = false;
    c.lock(false); c.refresh(); c.announce(played);
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[value="rematch"]')!.focus({ preventScroll: true });
  };
  const show = async (): Promise<void> => {
    const game = c.game(), final = game.pos, generation = c.generation();
    if (seen === final || dialog.open) return;
    reset(); seen = final; pending = true;
    const id = run;
    const live = (): boolean => id === run && generation === c.generation() && game === c.game() && final === game.pos;
    const loser = c.resigned() ?? (game.status === 'checkmate' ? final.turn : null);
    const square = loser == null ? -1 : findKing(final.board, loser);
    king = square < 0 ? null : square;
    if (!shouldPlayCeremony(game.status, final.turn, c.sides(), c.linkSide(), c.resigned())) {
      view.setFallen(king, false);
      open(false, live); return;
    }
    c.lock(true); c.refresh();
    // Use the turn button's fixed slot; no control covers the fallen king.
    active = true;
    c.turnButton.addEventListener('click', onRematch, true);
    refresh(); c.turnButton.focus({ preventScroll: true });
    control = startCeremony({ view, board, moments: tiles, history: game.history, final, king, live, motion: c.motion(),
      showPly: ply => { dialog.close(); clear(); void c.showPly(ply, false); },
    });
    const done = await control.done;
    if (!done || !live()) return;
    clearButton();
    open(true, live);
  };
  return { show, clear, reset, refresh };
}

/** Key-moment search starts from Review, outside the result flow. */
export function connectEndReview(button: HTMLElement, result: HTMLDialogElement, moves: HTMLElement, search: () => Promise<void>): void {
  button.onclick = () => { result.close(); moves.click(); void search(); };
}
