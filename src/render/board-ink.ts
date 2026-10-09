/** Web board ink in scene units; the canvas is 960 units wide. */
export function boardInk(width: number) {
  const scale = 960 / Math.max(1, width);
  return {
    coord: Math.max(13, 12 * scale),
    biteFont: Math.max(16, 12 * scale),
    biteRadius: Math.max(11, 9 * scale),
    causeCore: Math.max(2.2, 1.5 * scale),
    causeHalo: Math.max(5.5, 3.5 * scale),
  };
}
