/** Place the choice below the board. The caller reserves its height before placement. */
export function boardFoot(board: Pick<DOMRect, 'left' | 'bottom' | 'width'>, choice: Pick<DOMRect, 'width' | 'height'>, viewport: { width: number; height: number }) {
  return {
    left: `${Math.max(12, Math.min(board.left + (board.width - choice.width) / 2, viewport.width - choice.width - 12))}px`,
    top: `${board.bottom + 12}px`,
  };
}
