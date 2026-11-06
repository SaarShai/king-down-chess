import { drawFreeze } from './materials';

// A thaw has three beats over one approved material. The held ice cracks, whole. Then it breaks into pieces of the same
// painted ice that fall from the top down and burst on the ground. The base sags into a puddle, which dries. The pieces
// use the held image, so the first frame matches the held frame. Everything is cut once; a frame only moves sprites.
export const FREEZE_RELEASE_MS = 1100;
const CRACK_END = .22, CRACK_FADE = .1, SHED_START = .22, SHED_SPAN = .4, MELT_START = .52;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
const hash = (n: number) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
const SCALE = 2, W = 200, H = 220, X = 100, Y = 165;
const COLS = [-78, -44, -12, 20, 50, 78], ROWS = { back: [-118, -84, -52, -20], front: [-62, -28, 8] };
const CRACK_PARTS = 9;
type Point = [number, number];
const ORIGINS: Record<'back' | 'front', Point[]> = { back: [[-16, -74], [22, -44]], front: [[-14, -22], [24, -34]] };
interface Piece { canvas: HTMLCanvasElement; x: number; y: number; w: number; h: number; cx: number; cy: number; release: number; fall: number; ground: number; drift: number; spin: number; id: number }
interface Crack { a: Point; b: Point; start: number }
interface Face { sprite: HTMLCanvasElement; base: Piece; pieces: Piece[]; cracks: Crack[] }

function outline(ctx: CanvasRenderingContext2D, points: readonly Point[], close = true) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (close) ctx.closePath();
}
/** The same dark edge and pale core as the approved cracks, with more body so a new fracture reads at game size. */
function strokeCrack(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#215a80a8'; ctx.lineWidth = 4.2; ctx.stroke();
  ctx.strokeStyle = '#f2ffff'; ctx.lineWidth = 1.7; ctx.stroke();
}

function buildFace(front: boolean, seed: number): Face {
  const sprite = document.createElement('canvas'); sprite.width = W * SCALE; sprite.height = H * SCALE;
  const paint = sprite.getContext('2d')!;
  paint.scale(SCALE, SCALE);
  drawFreeze(paint, { x: X, y: Y, front, progress: .42, seed });
  const alpha = paint.getImageData(0, 0, sprite.width, sprite.height).data;
  const solid = (x: number, y: number) => alpha[(Math.round((y + Y) * SCALE) * sprite.width + Math.round((x + X) * SCALE)) * 4 + 3] > 50;
  const rows = front ? ROWS.front : ROWS.back, last = rows.length - 1;
  const at = (c: number, r: number): Point => {
    const k = c * 7 + r * 31 + seed * 13 + (front ? 101 : 0);
    return [COLS[c] + (c % (COLS.length - 1) ? (hash(k) - .5) * 19 : 0), rows[r] + (r ? (hash(k + 3) - .5) * 19 : 0)];
  };
  const edges: [Point, Point][] = [], polygons: Point[][] = [];
  for (let r = 0; r < last; r++) for (let c = 0; c < COLS.length - 1; c++) {
    const a = at(c, r), b = at(c + 1, r), d = at(c + 1, r + 1), e = at(c, r + 1), k = c * 11 + r * 47 + seed;
    if (hash(k) < .5) polygons.push([a, b, d, e]);
    else if (hash(k + 1) < .5) { polygons.push([a, b, d], [a, d, e]); edges.push([a, d]); }
    else { polygons.push([a, b, e], [b, d, e]); edges.push([b, e]); }
    if (c) edges.push([a, e]);
    edges.push([e, d]);
    if (r) edges.push([a, b]);
  }
  const groundLine = COLS.map((_, c) => at(c, last));
  const cut = (polygon: Point[], id: number, base = false): Piece | undefined => {
    const cx = polygon.reduce((s, p) => s + p[0], 0) / polygon.length, cy = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
    if (!base && !polygon.some(([x, y]) => solid(cx + (x - cx) * .6, cy + (y - cy) * .6)) && !solid(cx, cy)) return;
    const xs = polygon.map(p => p[0]), ys = polygon.map(p => p[1]);
    const x = Math.floor(Math.min(...xs)) - 3, y = Math.floor(Math.min(...ys)) - 3, w = Math.ceil(Math.max(...xs)) + 3 - x, h = Math.ceil(Math.max(...ys)) + 3 - y;
    const canvas = document.createElement('canvas'); canvas.width = w * SCALE; canvas.height = h * SCALE;
    const g = canvas.getContext('2d')!;
    g.scale(SCALE, SCALE); g.translate(-x, -y);
    g.drawImage(sprite, -X, -Y, W, H);
    // One pixel of growth closes the hairline seam between neighbours; the baked crack covers the overlap.
    g.globalCompositeOperation = 'destination-in';
    outline(g, polygon.map(([px, py]) => { const d = Math.hypot(px - cx, py - cy) || 1; return [px + (px - cx) / d, py + (py - cy) / d] as Point; }));
    g.fill();
    g.globalCompositeOperation = 'source-atop'; g.lineJoin = 'bevel';
    outline(g, polygon, !base); strokeCrack(g);
    // Higher ice lets go first and has further to fall.
    const height = clamp((cy + 118) / 124), ground = 10 + hash(id + 2) * 17;
    return { canvas, x, y, w, h, cx, cy, id, ground, release: SHED_START + height * SHED_SPAN * .72 + hash(id) * SHED_SPAN * .28, fall: .13 + .2 * Math.sqrt(clamp((ground - cy) / 140)),
      drift: (Math.sign(cx) || 1) * (5 + hash(id + 4) * 15), spin: (hash(id + 7) - .5) * 2.2 };
  };
  const pieces = polygons.flatMap((polygon, i) => cut(polygon, i * 3 + seed + (front ? 500 : 0)) ?? []);
  const base = cut([...groundLine, [X, H - Y], [-X, H - Y]], 9, true)!;
  // Each fracture runs outward from the nearest strike point; only its part on the ice shows.
  const origins = front ? ORIGINS.front : ORIGINS.back, cracks: Crack[] = [];
  const dist = (p: Point) => Math.min(...origins.map(o => Math.hypot(p[0] - o[0], p[1] - o[1])));
  for (const [a, b] of [...edges, ...groundLine.slice(1).map((p, i) => [groundLine[i], p] as [Point, Point])]) {
    for (let i = 0; i < CRACK_PARTS; i++) {
      const lerp = (u: number): Point => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      const p = lerp(i / CRACK_PARTS), q = lerp((i + 1) / CRACK_PARTS), mid = lerp((i + .5) / CRACK_PARTS);
      if (!solid(mid[0], mid[1])) continue;
      const near = dist(p) <= dist(q);
      cracks.push({ a: near ? p : q, b: near ? q : p, start: Math.min(1, dist(mid) / 92) });
    }
  }
  return { sprite, base, pieces, cracks };
}

const faces = new Map<string, Face>();
function faceOf(seed: number, front: boolean): Face {
  const key = `${seed}:${front}`;
  let face = faces.get(key);
  if (!face) {
    if (faces.size >= 8) faces.delete(faces.keys().next().value!);
    faces.set(key, face = buildFace(front, seed));
  }
  return face;
}

let pool: HTMLCanvasElement | undefined;
function puddle() {
  if (pool) return pool;
  pool = document.createElement('canvas'); pool.width = 160 * SCALE; pool.height = 56 * SCALE;
  const g = pool.getContext('2d')!;
  g.scale(SCALE, SCALE); g.translate(80, 28);
  // Darker water with a pale sheen reads on both square colours. Uneven lobes keep it from looking like a plate.
  g.fillStyle = '#3a8bb09c';
  for (const [x, y, rx, ry] of [[-6, 0, 50, 15], [-34, 3, 25, 11], [30, -3, 28, 11], [12, 7, 26, 8], [-50, -4, 9, 4], [56, 5, 8, 4]]) {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#8fd8ea8c';
  for (const [x, y, rx, ry] of [[-14, -3, 26, 6], [22, 1, 15, 4]]) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
  g.lineCap = 'round'; g.strokeStyle = '#f0feffd0'; g.lineWidth = 2.4;
  g.beginPath(); g.ellipse(-8, -2, 42, 11, 0, Math.PI * 1.1, Math.PI * 1.5); g.stroke();
  return pool;
}

function drawPiece(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, piece: Piece, t: number) {
  const age = (t - piece.release) / piece.fall;
  if (age >= 1.3) return;
  const fall = clamp(age) ** 1.7, landed = clamp((age - 1) / .3);
  // A piece shows at full strength until it lands; then it breaks and is gone.
  const x = foot.x + piece.cx + piece.drift * fall, y = foot.y + piece.cy + (piece.ground - piece.cy) * fall;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(piece.spin * fall);
  const squash = 1 - landed * .6;
  ctx.scale(1 + landed * .25, squash);
  ctx.globalAlpha = 1 - landed;
  ctx.drawImage(piece.canvas, piece.x - piece.cx, piece.y - piece.cy, piece.w, piece.h);
  ctx.restore();
  if (age <= .92) return;
  // Chips from the landing: filled body, not thin specks.
  const life = clamp((age - .92) / .75);
  if (life >= 1) return;
  ctx.save();
  ctx.fillStyle = '#e4fbff'; ctx.globalAlpha = 1 - life * life;
  for (let i = 0; i < 3; i++) {
    const side = (i - 1) + (hash(piece.id + i) - .5), r = 1.8 + hash(piece.id + i + 9) * 2;
    const cx = x + side * life * (13 + hash(piece.id + i + 5) * 9), cy = y - Math.sin(life * Math.PI) * (8 + hash(piece.id + i + 3) * 8) + life * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.2); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r * .9); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** One face of a thaw at `t` 0..1. It needs no figure, so it also finishes on a square that its piece has left. */
export function drawFreezeRelease(ctx: CanvasRenderingContext2D, foot: { x: number; y: number }, front: boolean, t: number, seed: number): void {
  if (t >= 1) return;
  const face = faceOf(seed, front);
  if (!front) {
    const size = smooth((t - .3) / .35), dry = smooth((t - .74) / .26), scale = (.45 + size * .55) * (1 - dry * .22);
    if (size > 0 && dry < 1) {
      ctx.save(); ctx.globalAlpha = size * (1 - dry);
      ctx.drawImage(puddle(), foot.x - 80 * scale, foot.y + 6 - 28 * scale, 160 * scale, 56 * scale);
      ctx.restore();
    }
  }
  const cracksOver = () => {
    const reach = t / CRACK_END, fade = 1 - smooth((t - CRACK_END) / CRACK_FADE);
    if (fade <= 0) return;
    ctx.save(); ctx.globalAlpha *= fade; ctx.translate(foot.x, foot.y); ctx.beginPath();
    for (const crack of face.cracks) {
      const part = clamp((reach - crack.start * .72) / .28);
      if (part <= 0) continue;
      ctx.moveTo(crack.a[0], crack.a[1]); ctx.lineTo(crack.a[0] + (crack.b[0] - crack.a[0]) * part, crack.a[1] + (crack.b[1] - crack.a[1]) * part);
    }
    strokeCrack(ctx);
    ctx.restore();
  };
  if (t < CRACK_END) {
    ctx.drawImage(face.sprite, foot.x - X, foot.y - Y, W, H);
    cracksOver();
    return;
  }
  // The base sags and thins into the puddle.
  const melt = smooth((t - MELT_START) / (.98 - MELT_START)), base = face.base;
  if (melt < 1) {
    ctx.save(); ctx.globalAlpha = 1 - melt;
    ctx.translate(foot.x, foot.y + 14); ctx.scale(1 + melt * .1, 1 - melt * .72);
    ctx.drawImage(base.canvas, base.x, base.y - 14, base.w, base.h);
    ctx.restore();
  }
  for (const piece of face.pieces) drawPiece(ctx, foot, piece, t);
  // Neighbours cover part of each baked crack, so the full lines fade out over the first pieces.
  cracksOver();
}
