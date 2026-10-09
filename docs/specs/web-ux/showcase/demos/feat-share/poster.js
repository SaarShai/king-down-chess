// Draws the real board art to a canvas: the 4:5 poster and the link picture of a shared move.
// The figures use the kit's own placement (figureArt), so the canvas matches the board on screen.
import { figureArt } from '../../kit/board.js';
import { emblemArt } from '../../kit/icons.js';

const ASSETS = new URL('../../assets/', import.meta.url).href;
const FOOT = 96 / 112, GROUND = 92 / 112, FRAME = 26 / 112;
const cache = new Map();
export function loadImg(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((ok, no) => {
      const i = new Image();
      i.decoding = 'async';
      i.onload = () => ok(i);
      i.onerror = () => no(new Error(`image did not load: ${src}`));
      i.src = src;
    }));
  }
  return cache.get(src);
}
export async function fontsReady() {
  await Promise.all([
    document.fonts.load('700 60px Cinzel'), document.fonts.load('400 30px "Alegreya Sans"'), document.fonts.load('700 30px "Alegreya Sans"'),
  ]).catch(() => {});
}

const idx = sq => (sq.charCodeAt(1) - 49) * 8 + (sq.charCodeAt(0) - 97);
/** Column and row (0 = top) of a square, with Black at the bottom when flipped. */
function colRow(sq, flipped) {
  const i = idx(sq), f = i & 7, r = i >> 3;
  return flipped ? { col: 7 - f, row: r } : { col: f, row: 7 - r };
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/**
 * Draw a board at (x, y): the slate frame, the stone, the figures back to front, optional trail and marks.
 * opts: { cells (KD.board), flipped, s (square px), fallen (square of a fallen king), trail: [sq...],
 *         numbered: true (number the trail's stops), lift: sq (the figure that acts) }
 */
export async function drawBoard(g, x, y, opts) {
  const { cells, flipped = false, s, fallen = null, trail = null, numbered = false } = opts;
  const fw = FRAME * s, B = 8 * s;
  const stone = await loadImg(`${ASSETS}stone-board-hd.webp`);
  const figs = cells.filter(Boolean);
  const imgs = await Promise.all(figs.map(c => loadImg(figureArt(c).src)));

  // the slate frame
  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = s * 0.4; g.shadowOffsetY = s * 0.08;
  roundRect(g, x - fw, y - fw, B + 2 * fw, B + 2 * fw, s * 0.07);
  g.fillStyle = '#3b352c'; g.fill();
  g.restore();
  g.save();
  roundRect(g, x - fw, y - fw, B + 2 * fw, B + 2 * fw, s * 0.07);
  const sheen = g.createLinearGradient(x - fw, y - fw, x + B + fw, y + B + fw);
  sheen.addColorStop(0, 'rgba(255,238,205,.18)'); sheen.addColorStop(0.5, 'rgba(255,238,205,0)'); sheen.addColorStop(1, 'rgba(16,10,4,.3)');
  g.fillStyle = sheen; g.fill();
  g.strokeStyle = 'rgba(236,224,196,.45)'; g.lineWidth = Math.max(1, s * 0.015); g.stroke();
  g.restore();

  // the stone (turned with the board, as the kit does)
  g.save();
  if (flipped) { g.translate(x + B, y + B); g.rotate(Math.PI); g.drawImage(stone, 0, 0, B, B); }
  else g.drawImage(stone, x, y, B, B);
  g.restore();
  // warm light from the top left, a soft vignette
  g.save();
  const light = g.createRadialGradient(x + B * 0.3, y + B * 0.22, 0, x + B * 0.3, y + B * 0.22, B * 0.95);
  light.addColorStop(0, 'rgba(255,200,130,.16)'); light.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = light; g.fillRect(x, y, B, B);
  const vig = g.createRadialGradient(x + B * 0.45, y + B * 0.42, B * 0.3, x + B * 0.45, y + B * 0.42, B * 0.75);
  vig.addColorStop(0, 'rgba(60,40,20,0)'); vig.addColorStop(1, 'rgba(60,40,20,.22)');
  g.fillStyle = vig; g.fillRect(x, y, B, B);
  g.restore();

  // the trail: a faint ink line through the move's squares, at ground level
  const centre = sq => { const { col, row } = colRow(sq, flipped); return [x + (col + 0.5) * s, y + (row + GROUND) * s - s * 0.22]; };
  if (trail && trail.length > 1) {
    const pts = trail.map(centre);
    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(24,14,6,.55)'; g.lineWidth = s * 0.11;
    g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
    g.strokeStyle = 'rgba(255,214,128,.9)'; g.lineWidth = s * 0.05; g.setLineDash([s * 0.12, s * 0.09]);
    g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
    g.setLineDash([]);
    const [sx, sy] = pts[0];
    g.fillStyle = 'rgba(255,214,128,.95)'; g.strokeStyle = 'rgba(24,14,6,.7)'; g.lineWidth = s * 0.03;
    g.beginPath(); g.arc(sx, sy, s * 0.07, 0, Math.PI * 2); g.fill(); g.stroke();
    g.restore();
  }

  // the figures, back rows first; the fallen king last, so that no figure hides the hero of the picture
  const order = figs.map((c, i) => ({ c, img: imgs[i], ...colRow(c.sq, flipped) }))
    .sort((a, b) => (a.c.sq === fallen) - (b.c.sq === fallen) || a.row - b.row || a.col - b.col);
  for (const { c, img, col, row } of order) {
    const box = figureArt(c).box;
    if (!box) continue;
    const sx0 = x + col * s, sy0 = y + row * s;
    const w = box.width * s, h = box.height * s, left = sx0 + box.left * s, top = sy0 + box.top * s;
    const down = fallen && c.sq === fallen;
    // the kit's fallen king: rotate 78 degrees about (50 %, 90 %), moved 18 % and 6 % of its box
    const ox = w * 0.5, oy = h * 0.9, px = left + ox + w * 0.18, py = top + oy + h * 0.06, turn = (78 * Math.PI) / 180;
    // the ground shadow
    g.save();
    const gx = sx0 + s * 0.5, gy = sy0 + FOOT * s;
    const sh = g.createRadialGradient(gx, gy, 0, gx, gy, s * 0.29);
    sh.addColorStop(0, 'rgba(28,20,8,.42)'); sh.addColorStop(0.6, 'rgba(28,20,8,.18)'); sh.addColorStop(1, 'rgba(28,20,8,0)');
    g.fillStyle = sh; g.translate(gx, gy); g.scale(1, 0.24); g.translate(-gx, -gy);
    g.beginPath(); g.arc(gx, gy, s * 0.29, 0, Math.PI * 2); g.fill();
    g.restore();

    g.save();
    if (down) {
      g.translate(px, py);
      g.rotate(turn);
      if (box.mirror) g.scale(-1, 1);
      g.filter = 'grayscale(.25) brightness(.9)';
      // a faint gold light around the fallen king: on a light or a dark square, the eye finds it first
      g.shadowColor = 'rgba(255,214,128,1)'; g.shadowBlur = s * 0.12;
      g.drawImage(img, -ox, -oy, w, h);
      g.drawImage(img, -ox, -oy, w, h); // twice: the light grows a little stronger, the figure does not change
    } else {
      g.translate(left + w / 2, top);
      if (box.mirror) g.scale(-1, 1);
      g.drawImage(img, -w / 2, 0, w, h);
    }
    g.restore();
  }

  // numbered stops (a chain's bites), over the figures
  if (trail && numbered) {
    g.save();
    g.font = `700 ${Math.round(s * 0.3)}px "Alegreya Sans", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    trail.slice(1).forEach((sq, i) => {
      const { col, row } = colRow(sq, flipped);
      const cx = x + (col + 0.74) * s, cy = y + (row + 0.26) * s, r = s * 0.24;
      g.fillStyle = '#842c21'; g.strokeStyle = '#fbf7ee'; g.lineWidth = s * 0.03;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#fbf7ee'; g.fillText(String(i + 1), cx, cy + s * 0.01);
    });
    g.restore();
  }
}

function spaced(g, text, cx, y, track) {
  // Cinzel with letter spacing, centred on cx
  const chars = [...text];
  const widths = chars.map(ch => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
  let px = cx - total / 2;
  g.textAlign = 'left';
  chars.forEach((ch, i) => { g.fillText(ch, px, y); px += widths[i] + track; });
}

function night(g, W, H) {
  g.fillStyle = '#221d18'; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.5, H * 0.18, 0, W * 0.5, H * 0.18, H * 0.75);
  glow.addColorStop(0, 'rgba(201,154,62,.16)'); glow.addColorStop(1, 'rgba(201,154,62,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
}

/**
 * The 4:5 poster (1080 x 1350): the final position on the stone board, the last move as a faint ink trail,
 * the fallen king, both emblems, the date, the result and the link back to the game.
 * p: { cells, flipped, fallen, trail, dateLine, result, sub, link, mine, theirs }
 */
export async function drawPoster(canvas, p) {
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  await fontsReady();
  const g = canvas.getContext('2d');
  night(g, W, H);
  // the title
  g.fillStyle = '#e9c071';
  g.font = '700 50px Cinzel, Georgia, serif'; g.textBaseline = 'alphabetic';
  spaced(g, 'KING DOWN', W / 2, 100, 9);
  g.fillStyle = '#d6c9ad'; g.font = '400 34px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText(p.dateLine, W / 2, 150);
  // the board
  const s = 104, B = 8 * s, bx = (W - B) / 2, by = 216;
  await drawBoard(g, bx, by, { cells: p.cells, flipped: p.flipped, s, fallen: p.fallen, trail: p.trail });
  // the two kings' emblems and the result
  const [mine, theirs] = await Promise.all([loadImg(emblemArt(p.mine)), loadImg(emblemArt(p.theirs))]);
  const ey = by + B + FRAME * s + 36, es = 132;
  g.drawImage(mine, 92, ey + 8, es, es);
  g.save(); g.globalAlpha = 0.5; g.filter = 'grayscale(.6)'; g.drawImage(theirs, W - 92 - es, ey + 8, es, es); g.restore();
  g.fillStyle = '#f3ead7'; g.font = '700 64px Cinzel, Georgia, serif'; g.textAlign = 'center';
  spaced(g, p.result, W / 2, ey + 66, 3);
  g.fillStyle = '#d6c9ad'; g.font = '400 32px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText(p.sub, W / 2, ey + 112);
  // the way back to the game, for a picture that travels alone
  g.fillStyle = '#e9c071'; g.font = '700 30px "Alegreya Sans", sans-serif';
  g.fillText(p.link, W / 2, ey + 158);
}

/**
 * The link picture of a shared move (1.91:1, 1200 x 628): the board before the move with the move's
 * trail and numbered stops, and the acting figure large at the right with one big word. The quote is in
 * the card under the picture, so the picture holds no small text.
 * m: { cells, flipped, trail, figure: cell, big: text }
 */
export async function drawMoment(canvas, m) {
  const W = 1200, H = 628;
  canvas.width = W; canvas.height = H;
  await fontsReady();
  const g = canvas.getContext('2d');
  night(g, W, H);
  // Crop the board to the squares of the move, one square of room around them (at most 6 x 5 squares).
  const cr = m.trail.map(sq => colRow(sq, m.flipped));
  const span = (lo, hi, max) => { lo = Math.max(0, lo - 1); hi = Math.min(7, hi + 1); while (hi - lo + 1 > max) (hi - lo) % 2 ? hi-- : lo++; while (hi - lo + 1 < max) hi < 7 ? hi++ : lo--; return [lo, hi]; };
  const [c0, c1] = span(Math.min(...cr.map(p => p.col)), Math.max(...cr.map(p => p.col)), 6);
  const [r0, r1] = span(Math.min(...cr.map(p => p.row)), Math.max(...cr.map(p => p.row)), 5);
  const s = 104, vx = 40, vy = (H - (r1 - r0 + 1) * s) / 2, vw = (c1 - c0 + 1) * s, vh = (r1 - r0 + 1) * s;
  g.save();
  roundRect(g, vx, vy, vw, vh, 14); g.clip();
  await drawBoard(g, vx - c0 * s, vy - r0 * s, { cells: m.cells, flipped: m.flipped, s, trail: m.trail, numbered: m.numbered });
  g.restore();
  g.save(); roundRect(g, vx, vy, vw, vh, 14); g.strokeStyle = 'rgba(233,192,113,.55)'; g.lineWidth = 3; g.stroke(); g.restore();
  // the acting figure, large, on the right
  const art = figureArt(m.figure), img = await loadImg(art.src);
  const fh = 350, fw = fh * (art.box.width / art.box.height), fx = 940 - fw / 2, fy = 64;
  g.save();
  const gx = fx + fw / 2, gy = fy + fh - 8;
  const sh = g.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.45);
  sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.translate(gx, gy); g.scale(1, 0.22); g.translate(-gx, -gy);
  g.beginPath(); g.arc(gx, gy, fw * 0.45, 0, Math.PI * 2); g.fill();
  g.restore();
  g.save(); g.translate(fx + fw / 2, fy); if (art.box.mirror) g.scale(-1, 1); g.drawImage(img, -fw / 2, 0, fw, fh); g.restore();
  g.fillStyle = '#e9c071'; g.font = '700 76px Cinzel, Georgia, serif';
  spaced(g, m.big, 940, 520, 4);
}
