// The sample's board images: the real painted board of the running game, two images per state, and the
// trail strip of decision W11 B.
// node docs/specs/web-ux/sample/boards.mjs [app-url] [raw-dir]
//   app-url  a dev server of this checkout (default http://127.0.0.1:5191/: npx vite --port 5191 --strictPort)
//   raw-dir  a folder outside the repo for the full-size PNGs (optional)
// Each image is the canvas (960 scene units wide) less the top CROP units of its 64-unit headroom: 960 x 988
// units. The tallest figures on the top rank still keep their heads. A square is 112 units, so the page and
// capture.mjs size the board by the image width: a square is width * 112 / 960. The frame is 948 units wide.
// <state>.webp is a board 700 px wide or more (desktop, laptop, tablet). <state>-small.webp is the board a
// phone shows (390 px wide): there the game draws larger markers and coordinates (PaintedView's `mark`).
// Three things are the proposal, not the game of today, and are drawn on the ground layer under the figures:
// - W11: a stronger last-move wash, cut to the tile's own shape so the marble shows through; after an
//   archer's shot it also marks the archer's square.
// - W11 B: the faint trail from the start square, which fades in 1.2 s. The state images show the board at
//   rest (no trail). trail.webp shows four frames of the idle move: 0.1, 0.5 and 0.9 s, and at rest.
// - The canvas cuts the shadow of the board frame at its edge; the image fades that shadow into the floor.
// Everything else is the game's own drawing.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const app = process.argv[2] ?? 'http://127.0.0.1:5191/';
const raw = process.argv[3];
const CROP = 36, HEADROOM = 64;
// The game's own layout sizes its canvas: 960 CSS px in the first viewport, 390 CSS px in the second.
const VARIANTS = [
  { suffix: '', viewport: { width: 1300, height: 1100 }, deviceScaleFactor: 2, width: 1440 },
  { suffix: '-small', viewport: { width: 800, height: 488 }, deviceScaleFactor: 3, width: 1170 },
];
const out = new URL('./boards/', import.meta.url);
mkdirSync(out, { recursive: true });
if (raw) mkdirSync(raw, { recursive: true });

// You play White against the computer (Casual). The engine played this game (depth 4, from the sample's
// first 10 plies). It shows the new pieces at work: two archer shots and a maester swap.
const GAME = ['e2-e4', 'e7-e5', 'Nb1-c3', 'Nb8-c6', 'd2-d3', 'Bf8-c5', 'Ac1-d2', 'd7-d6', 'Ad2-e3', 'Qd8-h4',
  'Ae3*c5', 'Qh4-h6', 'Qd1-d2', 'Ke8-f8', 'Ae3*e5', 'Ac8-b8', 'Ae3-f4', 'Qh6-g6', 'h2-h3', 'Mh8<>g7',
  'Af4-g4', 'Qg6-h6', 'Ag4-g5', 'Qh6-e6'];
const POWERS = ['d2-d4', 'd7-d5', 'Nb1-c3', 'Nb8-c6', 'e2-e4', 'd5xe4', 'Nc3xe4', 'e7-e5'];
const save = (back, moves) => ({ back, fen: '', moves, white: 'human', black: 'ai', skill: 'casual', sound: false, coords: true, pace: 'normal', resigned: null });
const KINGS = '?kings=frost:freeze,shadow:deathtouch';
const STATES = {
  idle: { save: save('ONAQKBSM', GAME), trail: ['h6', 'e6'] },
  // The engine's hint at depth 2, 3 and 4: the archer on g5 shoots the maester on g7. Hint selects the piece;
  // the pointer on g7 shows that target the way the game previews a move.
  hint: { save: save('ONAQKBSM', GAME), select: 'g5', point: 'g7' },
  selected: { save: save('ONAQKBSM', GAME), select: 'h1' },
  review: { save: save('ONAQKBSM', GAME), ply: 11, also: ['e3'] },
  powers: { save: save('RNAQKGOM', POWERS), query: KINGS },
  armed: { save: save('RNAQKGOM', POWERS), query: KINGS, click: '#power-btn' },
};
const square = name => (name.charCodeAt(1) - 49) * 8 + name.charCodeAt(0) - 97;

/** In the page: the decorate hook that draws the proposal's marks, then the game's own (less its flat wash). */
function decorate({ also, trail, t }) {
  const view = window.view;
  view.scene.setDecorate((ctx, api, layer, row) => {
    if (layer === 'under') {
      const { PAD, TILE } = api, box = sq => { const c = api.cell(sq); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
      // The tile's painted shape: inset by the grout, with cut corners.
      const tile = (b, inset, cut) => {
        const x0 = b.x + inset, y0 = b.y + inset, x1 = b.x + TILE - inset, y1 = b.y + TILE - inset;
        ctx.beginPath();
        ctx.moveTo(x0 + cut, y0); ctx.lineTo(x1 - cut, y0); ctx.lineTo(x1, y0 + cut); ctx.lineTo(x1, y1 - cut);
        ctx.lineTo(x1 - cut, y1); ctx.lineTo(x0 + cut, y1); ctx.lineTo(x0, y1 - cut); ctx.lineTo(x0, y0 + cut);
        ctx.closePath();
      };
      ctx.save();
      // W11: the stronger still mark. Multiply keeps the marble's grain; screen lifts the stone, the dark more.
      for (const sq of [...(view.marks.last ?? []), ...(also ?? [])]) {
        const b = box(sq), c = api.cell(sq), dark = (c.row + c.col) % 2 === 1;
        tile(b, 3.5, 7);
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(240, 192, 96, ${dark ? 0.4 : 0.62})`; ctx.fill();
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(226, 170, 64, ${dark ? 0.46 : 0.3})`; ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        tile(b, 4.5, 6.5); ctx.strokeStyle = 'rgba(122, 87, 18, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
      }
      // W11 B: the ground trail from the start square, t seconds after the move. It fades from its tail.
      if (trail && t < 1.2) {
        const [from, to] = trail, a = api.foot(from), b = api.foot(to), end = box(to), k = t / 1.2;
        const dx = b.x - a.x, dy = b.y - a.y, half = TILE / 2, cx = end.x + half, cy = end.y + half;
        // Stop at the edge of the target tile.
        const stop = Math.min(dx ? Math.max(0, (Math.abs(cx - a.x) - half) / Math.abs(dx)) : 1, dy ? Math.max(0, (Math.abs(cy - a.y) - half) / Math.abs(dy)) : 1);
        const p = s => ({ x: a.x + dx * s, y: a.y + dy * s }), tail = p(stop * 0.7 * k), head = p(stop);
        const len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, w0 = TILE * 0.04, w1 = TILE * 0.12, alpha = 0.38 * (1 - k * k);
        ctx.filter = 'blur(4px)';
        ctx.beginPath();
        ctx.moveTo(tail.x + nx * w0, tail.y + ny * w0); ctx.lineTo(head.x + nx * w1, head.y + ny * w1);
        ctx.lineTo(head.x - nx * w1, head.y - ny * w1); ctx.lineTo(tail.x - nx * w0, tail.y - ny * w0);
        ctx.closePath();
        // As the wash: multiply shows on the light stone, screen on the dark.
        for (const [mode, rgb] of [['multiply', '232, 160, 48'], ['screen', '226, 168, 58']]) {
          const g = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
          g.addColorStop(0, `rgba(${rgb}, ${alpha * 0.4})`); g.addColorStop(1, `rgba(${rgb}, ${alpha})`);
          ctx.globalCompositeOperation = mode; ctx.fillStyle = g; ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }
    const last = view.marks.last;
    view.marks.last = [];
    try { view.drawMarks(ctx, api, layer, row); } finally { view.marks.last = last; }
  });
  view.scene.redraw();
}

/** In the page: the canvas less its top CROP units, at `width` px, with the frame's cut shadow faded into the floor. */
function board({ width, crop }) {
  const src = window.view.canvas, k = src.width / 960, top = crop * k, out = document.createElement('canvas');
  out.width = width; out.height = Math.round(width * (src.height - top) / src.width);
  const g = out.getContext('2d'), u = width / 960, edge = 6 * u;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, top, src.width, src.height - top, 0, 0, out.width, out.height);
  const fade = (x0, y0, x1, y1, rect) => {
    const f = g.createLinearGradient(x0, y0, x1, y1);
    f.addColorStop(0, 'rgba(230, 225, 207, 0)'); f.addColorStop(1, 'rgb(230, 225, 207)');
    g.fillStyle = f; g.fillRect(...rect);
  };
  fade(edge, 0, 0, 0, [0, 0, edge, out.height]);
  fade(out.width - edge, 0, out.width, 0, [out.width - edge, 0, edge, out.height]);
  fade(0, out.height - edge, 0, out.height, [0, out.height - edge, out.width, edge]);
  return { full: src.toDataURL('image/png'), webp: out.toDataURL('image/webp', 0.84) };
}

const browser = await chromium.launch({ channel: process.env.PLAYABLE_BROWSER ?? 'chrome' });
const bytes = url => Buffer.from(url.split(',')[1], 'base64');
for (const [name, s] of Object.entries(STATES)) for (const v of VARIANTS) {
  const context = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor });
  await context.addInitScript(game => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    localStorage.setItem('kingdown.save', JSON.stringify(game));
  }, s.save);
  const page = await context.newPage();
  await page.goto(app + (s.query ?? ''));
  await page.waitForFunction(() => window.view?.ready, null, { timeout: 30000 });
  await page.evaluate(() => window.view.ready());
  await page.waitForTimeout(1500);
  const at = async sq => page.evaluate(n => window.view.screenOf(n), square(sq));
  if (s.click) await page.click(s.click);
  if (s.select) { const p = await at(s.select); await page.mouse.click(p.x, p.y); }
  if (s.point) { await page.waitForTimeout(800); const p = await at(s.point); await page.mouse.move(p.x, p.y); }
  else if (s.select || s.click) await page.mouse.move(2, 2); // off the board: no preview figure
  if (s.ply) await page.click(`#moves [data-ply="${s.ply}"]`);
  await page.waitForTimeout(1500);
  await page.evaluate(decorate, { also: s.also?.map(square) });
  await page.waitForTimeout(400);
  const png = await page.evaluate(board, { width: v.width, crop: CROP });
  const file = `${name}${v.suffix}`;
  writeFileSync(new URL(`${file}.webp`, out), bytes(png.webp));
  if (raw) writeFileSync(`${raw}/${file}.png`, bytes(png.full));
  console.log(`${file}.webp ${(bytes(png.webp).length / 1024).toFixed(0)} KB`);
  // W11 B: four frames of the idle move, side by side (the large board only).
  if (s.trail && !v.suffix) {
    const frames = [];
    for (const t of [0.1, 0.5, 0.9, 1.2]) {
      await page.evaluate(decorate, { trail: s.trail.map(square), t });
      await page.waitForTimeout(400);
      frames.push(await page.evaluate(board, { width: v.width, crop: 0 }));
    }
    const strip = await page.evaluate(async ({ frames, headroom }) => {
      // Files d to h, ranks 7 to 5, with the heads of the rank-7 figures, from the full canvas (scene units * k).
      const first = new Image(); first.src = frames[0].full; await first.decode();
      const k = first.width / 960, x = (32 + 3 * 112 - 12) * k, y = (headroom + 32 + 112 - 56) * k, w = (5 * 112 + 24) * k, h = (3 * 112 + 64) * k;
      const cell = 440, gap = 24, ch = Math.round(cell * h / w), c = document.createElement('canvas');
      c.width = 4 * cell + 3 * gap; c.height = ch;
      const g = c.getContext('2d');
      g.fillStyle = 'rgb(230, 225, 207)'; g.fillRect(0, 0, c.width, c.height);
      for (const [i, f] of frames.entries()) {
        const img = new Image(); img.src = f.full; await img.decode();
        g.drawImage(img, x, y, w, h, i * (cell + gap), 0, cell, ch);
      }
      return c.toDataURL('image/webp', 0.84);
    }, { frames, headroom: HEADROOM });
    writeFileSync(new URL('trail.webp', out), bytes(strip));
    console.log(`trail.webp ${(bytes(strip).length / 1024).toFixed(0)} KB`);
  }
  await context.close();
}
await browser.close();
