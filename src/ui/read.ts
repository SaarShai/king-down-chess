/** I reads a square while the board has focus. */
export function connectReadKey(board: HTMLElement, cursor: () => number | null, read: (sq: number) => void): void {
  board.addEventListener('keydown', e => {
    if (e.key.toLowerCase() !== 'i' || document.activeElement !== board || document.querySelector('dialog[open]')) return;
    const sq = cursor();
    if (sq == null) return;
    e.preventDefault(); e.stopPropagation();
    read(sq);
  });
}
