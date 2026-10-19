/** Place a choice below the board, or at its foot when the viewport has no room below it. */
export function boardFoot(board: Pick<DOMRect, 'left' | 'bottom' | 'width'>, choice: Pick<DOMRect, 'width' | 'height'>, viewport: { width: number; height: number }) {
  return {
    left: `${Math.max(12, Math.min(board.left + (board.width - choice.width) / 2, viewport.width - choice.width - 12))}px`,
    top: `${Math.max(12, Math.min(board.bottom + 12, viewport.height - choice.height - 12))}px`,
  };
}
