// Types for title-kings.mjs (the title screen's kings with their resting effects).
export interface TitleKings { stop(): void; readonly frames: number; readonly running: boolean; readonly started: number; draw(time: number): void }
/** Starts the effects over root's `img[data-king]` images; enabled() is checked first. */
export function startTitleKings(root: Element, options?: { enabled?: () => boolean }): TitleKings;
