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

/** Edge labels (board units) stay inside the 32-unit frame, so they never cover a piece; under 8 CSS px they are not drawn.
 *  The 45-unit cap is the frame limit (16 inset + 0.35 em <= 32), so labels keep 12 CSS px on boards of 256 px or more. */
export function coordInk(width: number) {
  const size = Math.min(boardInk(width).coord, 45);
  return { size, inset: Math.min(Math.max(14, size / 2 + 4), 16), shown: size * width / 960 >= 8 };
}
