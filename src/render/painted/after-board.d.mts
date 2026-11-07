// Types for after-board.mjs.
/** Runs fn now when the board is ready already, else when it becomes ready. */
export function afterBoard(fn: () => void): void;
/** Opens the gate and runs the waiting loads. A second call does nothing. */
export function boardReady(): void;
