export interface ControlBounds { accessible: boolean; text: string | null; rect: [number, number, number, number]; limit: number }
/** One control; `evaluateAll(controlBounds, true)` in a `.mjs` check gives a list. */
export function controlBounds(el: Element, scroll?: boolean): ControlBounds;
