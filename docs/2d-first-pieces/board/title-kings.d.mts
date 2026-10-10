// Types for title-kings.mjs (the title screen's kings with their resting effects).
export interface TitleKings { stop(): void; readonly frames: number; readonly running: boolean; readonly started: number; draw(time: number): void }
/** Starts the effects over root's `img[data-king]` images; enabled() is checked first. */
export function startTitleKings(root: Element, options?: { enabled?: () => boolean }): TitleKings;
/** A computed CSS filter, split into the brightness and the drop shadows in their CSS order. */
export function filterOf(css: string): { brightness: number; shadows: { color: string; x: number; y: number; blur: number }[] };
