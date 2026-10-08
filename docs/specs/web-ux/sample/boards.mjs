// The sample's board images: the real painted board of the running game, two images per state.
// node docs/specs/web-ux/sample/boards.mjs [app-url] [raw-dir]
//   app-url  a dev server of this checkout (default http://127.0.0.1:5191/: npx vite --port 5191 --strictPort)
//   raw-dir  a folder outside the repo for the full-size PNGs (optional)
// Each image is the canvas (960 scene units wide) less the top CROP units of its 64-unit headroom: 960 x 988
// units. The tallest figures on the top rank still keep their heads. A square is 112 units, so the page and
// capture.mjs size the board by the image width: a square is width * 112 / 960.
// <state>.webp is a board 700 px wide or more (desktop, laptop, tablet). <state>-small.webp is the board a
// phone shows (390 px wide): there the game draws larger markers and coordinates (PaintedView's `mark`).
// Two marks are the proposal of decision W11 B, drawn on the ground layer under the figures: a stronger
// last-move wash, and in the idle state the faint trail from the start square (a still frame of the
// 1.2 s fade). Everything else is the game's own drawing.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const app = process.argv[2] ?? 'http://127.0.0.1:5191/';
const raw = process.argv[3];
const CROP = 36;
// The game's own layout sizes its canvas: 960 CSS px in the first viewport, 390 CSS px in the second.
const VARIANTS = [
  { suffix: '', viewport: { width: 1300, height: 1100 }, deviceScaleFactor: 2, width: 1440 },
  { suffix: '-small', viewport: { width: 800, height: 488 }, deviceScaleFactor: 3, width: 1170 },
];
const out = new URL('./boards/', import.meta.url);
mkdirSync(out, { recursive: true });
if (raw) mkdirSync(raw, { recursive: true });

// You play White against the computer (Casual). The idle, selected and review states share one game.
const GAME = ['e2-e4', 'e7-e5', 'Nb1-c3', 'Nb8-c6', 'd2-d3', 'Bf8-c5', 'Ac1-d2', 'd7-d6', 'Ad2-e3', 'Qd8-h4'];
const POWERS = ['d2-d4', 'd7-d5', 'Nb1-c3', 'Nb8-c6', 'e2-e4', 'd5xe4', 'Nc3xe4', 'e7-e5'];
const save = (back, moves) => ({ back, fen: '', moves, white: 'human', black: 'ai', skill: 'casual', sound: false, coords: true, pace: 'normal', resigned: null });
const STATES = {
  idle: { save: save('ONAQKBSM', GAME), trail: ['d8', 'h4'] },
  selected: { save: save('ONAQKBSM', GAME), select: 'e3' },
  review: { save: save('ONAQKBSM', GAME), ply: 6 },
  powers: { save: save('RNAQKGOM', POWERS), query: '?kings=frost:freeze,shadow:deathtouch' },
};
const square = name => (name.charCodeAt(1) - 49) * 8 + name.charCodeAt(0) - 97;

const browser = await chromium.launch({ channel: process.env.PLAYABLE_BROWSER ?? 'chrome' });
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
  if (s.select) {
    const p = await page.evaluate(sq => window.view.screenOf(sq), square(s.select));
    await page.mouse.click(p.x, p.y);
    await page.mouse.move(2, 2); // off the board: no preview figure
  }
  if (s.ply) await page.click(`#moves [data-ply="${s.ply}"]`);
  await page.waitForTimeout(1500);
  const png = await page.evaluate(async ({ trail, width, crop }) => {
    const view = window.view, scene = view.scene;
    scene.setDecorate((ctx, api, layer, row) => {
      if (layer === 'under') {
        const { PAD, TILE } = api, box = sq => { const c = api.cell(sq); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
        ctx.save();
        // W11: the stronger still mark on the square the piece reached.
        for (const sq of view.marks.last ?? []) {
          const b = box(sq);
          ctx.fillStyle = 'rgba(214, 160, 52, 0.42)'; ctx.fillRect(b.x, b.y, TILE, TILE);
          ctx.strokeStyle = 'rgba(122, 87, 18, 0.75)'; ctx.lineWidth = 4; ctx.strokeRect(b.x + 2, b.y + 2, TILE - 4, TILE - 4);
        }
        // W11 B: the faint ground trail from the start square, as it shows just after the move.
        if (trail) {
          const [from, to] = trail, a = api.foot(from), b = api.foot(to), s0 = box(from);
          const ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang), ny = Math.cos(ang), w0 = TILE * 0.05, w1 = TILE * 0.2;
          ctx.fillStyle = 'rgba(214, 160, 52, 0.2)'; ctx.fillRect(s0.x, s0.y, TILE, TILE);
          ctx.filter = 'blur(5px)';
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, 'rgba(240, 196, 92, 0)'); g.addColorStop(0.5, 'rgba(240, 196, 92, 0.22)'); g.addColorStop(1, 'rgba(240, 196, 92, 0.45)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(a.x + nx * w0, a.y + ny * w0); ctx.lineTo(b.x + nx * w1, b.y + ny * w1);
          ctx.lineTo(b.x - nx * w1, b.y - ny * w1); ctx.lineTo(a.x - nx * w0, a.y - ny * w0);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      view.drawMarks(ctx, api, layer, row);
    });
    scene.redraw();
    await new Promise(r => setTimeout(r, 400));
    const src = view.canvas, out = document.createElement('canvas'), top = crop * src.width / 960;
    out.width = width; out.height = Math.round(width * (src.height - top) / src.width);
    const g = out.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, top, src.width, src.height - top, 0, 0, out.width, out.height);
    return { full: src.toDataURL('image/png'), webp: out.toDataURL('image/webp', 0.84) };
  }, { trail: s.trail?.map(square), width: v.width, crop: CROP });
  const bytes = url => Buffer.from(url.split(',')[1], 'base64'), file = `${name}${v.suffix}`;
  writeFileSync(new URL(`${file}.webp`, out), bytes(png.webp));
  if (raw) writeFileSync(`${raw}/${file}.png`, bytes(png.full));
  console.log(`${file}.webp ${(bytes(png.webp).length / 1024).toFixed(0)} KB`);
  await context.close();
}
await browser.close();
