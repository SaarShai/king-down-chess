const rgb = (hex: string) => [1, 3, 5, 7].map(i => parseInt(hex.slice(i, i + 2) || 'ff', 16));
const channel = (c: number) => (c /= 255) <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
const luminance = ([r, g, b]: number[]) => .2126 * channel(r) + .7152 * channel(g) + .0722 * channel(b);

/** WCAG contrast of an ink ('#rrggbb' or '#rrggbbaa') laid over an opaque ground, blended in 8 bits as a canvas does. */
export function contrast(ink: string, ground: string): number {
  const [r, g, b, a] = rgb(ink), base = rgb(ground);
  const ink8 = [r, g, b].map((c, i) => Math.round(c * a / 255 + base[i] * (1 - a / 255)));
  const [hi, lo] = [luminance(ink8), luminance(base)].sort((x, y) => y - x);
  return (hi + .05) / (lo + .05);
}
