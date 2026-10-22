/** Web board ink in scene units; the canvas is 960 units wide. */
export function boardInk(width: number) {
  const scale = 960 / Math.max(1, width);
  return {
    coord: Math.max(13, 12 * scale),
    biteFont: Math.max(16, 14 * scale),
    biteRadius: Math.max(11, 6.5 * scale),
    biteInset: 1 * scale,
    checkRing: Math.max(3, 1.5 * scale),
    causeCore: Math.max(2.2, 1.5 * scale),
    causeHalo: Math.max(5.5, 3.5 * scale),
  };
}

/** Edge labels (board units) draw under the pieces (scene.mjs), so they never cover one; under 8 CSS px they are not drawn.
 *  The 45-unit cap keeps 12 CSS px on boards of 256 px or more. It fits the 0.35 em model of the M10 test; the measured
 *  capitals rise about 0.48 em above the middle line, so the file letters reach about 6 units into rank 1 (4 at 40). */
export function coordInk(width: number) {
  const size = Math.min(boardInk(width).coord, 45);
  return { size, inset: Math.min(Math.max(14, size / 2 + 4), 16), shown: size * width / 960 >= 8 };
}
