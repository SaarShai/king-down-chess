// WCAG 2.2 contrast of the palette in src/style.css: every text colour against the surfaces it is used on.
// node docs/visual-design/contrast.mjs  → prints a table and writes contrast.json; exits 1 below the bar.
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8');
const token = name => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!m) throw new Error(`no token --${name}`);
  return m[1];
};
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [text, surface, where it appears, minimum]: 4.5 for text, 3 for large text (≥ 24 px, or 18.7 px bold) and UI parts.
const T = 4.5, LARGE = 3, UI = 3;
const pairs = [
  ['ink', 'parchment', 'body text on the panel', T],
  ['ink', 'vellum', 'body text in dialogs, cards, move list', T],
  ['ink', 'parchment-deep', 'move list stripes, hovered move', T],
  ['ink-soft', 'parchment', 'secondary text (notes, captured labels)', T],
  ['ink-soft', 'vellum', 'secondary text in dialogs', T],
  ['ink-soft', 'parchment-deep', 'move numbers on the list stripes', T],
  ['ink-soft', 'stone-100', 'disabled button labels', T],
  ['gold-ink', 'vellum', 'card labels (MOVES, CAPTURES)', T],
  ['gold-ink', 'parchment', 'card labels on the card gradient end', T],
  ['vellum', 'accent', 'primary button labels', T],
  ['vellum', 'accent-deep', 'primary button pressed edge', T],
  ['vellum', 'stone-700', 'piece-letter badges', T],
  ['vellum', 'ink', 'the move shown in review', T],
  ['danger', 'parchment', 'turn line in check', T],
  ['on-night', 'night', 'title tagline and buttons on the title', T],
  ['on-night-soft', 'night', 'title tagline', T],
  ['focus', 'parchment', 'focus ring on the panel', UI],
  ['focus', 'vellum', 'focus ring in dialogs', UI],
  ['stone-700', 'parchment', 'button and field borders', UI],
  ['stone-500', 'vellum', 'move list border, quiet buttons', UI],
  ['accent', 'vellum', 'checked boxes, slider thumb', UI],
];
const extra = [
  ['#e9c071', token('night'), '"Down" in the wordmark (large)', LARGE],
  [token('ink'), '#fff6dc', 'help line', T],
  ['#8cc0ff', token('night'), 'focus ring on the title screen', UI],
  [token('ink'), '#efe4cc', 'button label at the bottom of its gradient', T],
  [token('ink'), '#e6e1cf', 'board surround (coordinates are drawn by the scene)', T],
];
const rows = [
  ...pairs.map(([a, b, where, min]) => ({ text: `--${a} ${token(a)}`, surface: `--${b} ${token(b)}`, where, ratio: ratio(token(a), token(b)), min })),
  ...extra.map(([a, b, where, min]) => ({ text: a, surface: b, where, ratio: ratio(a, b), min })),
];
let fail = 0;
for (const r of rows) {
  const pass = r.ratio >= r.min;
  if (!pass) fail++;
  console.log(`${pass ? 'pass' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(5)}:1 (needs ${r.min})  ${r.text} on ${r.surface}  — ${r.where}`);
  r.ratio = +r.ratio.toFixed(2); r.pass = pass;
}
writeFileSync(new URL('./contrast.json', import.meta.url), JSON.stringify(rows, null, 2) + '\n');
console.log(fail ? `${fail} below the bar` : `all ${rows.length} pairs meet WCAG AA`);
process.exit(fail ? 1 : 0);
