import type { Checker } from '../move-text';
import type { PaintedScene } from './painted/scene.mjs';

type Brush = readonly [light: string, body: string];
const PAINT = {
  actor: ['#fff6cf', '#e9b44c'],
  move: ['#fffdf2', '#f3deb0'],
  enemy: ['#ffc9b8', '#c8382a'],
  friend: ['#d9eeea', '#2f6f73'],
  ice: ['#ffffff', '#8fd3f4'],
  holy: ['#fff6cf', '#ebcb80'],
  ember: ['#ffe0b8', '#b46635'],
  shadow: ['#eadde8', '#796378'],
} as const satisfies Record<string, Brush>;
// One umber keyline round every mark: 5.3:1 on light stone and 3.4:1 on dark stone, so no body colour has to carry it.
const KEYLINE = '#4e3815d9';
// Threat line: wax red. As for every mark, the umber keyline carries the 3:1 on dark stone (the body alone: 4.1:1 light, 2.3:1 dark).
const WAX = '#b8322a', WAX_LINE = .03;
export const PLAIN = {
  actor: PAINT.actor[1], move: PAINT.move[1], enemy: PAINT.enemy[1],
  friend: PAINT.friend[1], ice: PAINT.ice[1], holy: PAINT.holy[1],
  ember: PAINT.ember[1], shadow: PAINT.shadow[1], last: '#ecb040',
} as const;
const brushes = new Map<string, Brush>(Object.values(PAINT).map(brush => [brush[1], brush]));
export const lastMoveInk = (opacity: number) => PLAIN.last + Math.round(opacity * 255).toString(16).padStart(2, '0');

export interface PlainRing {
  square: number; color: string; width?: number; size?: number; dash?: number[];
  role: 'actor' | 'target' | 'focus' | 'landing' | 'trail' | 'state';
  frost?: true;
}
export interface PlainPath { squares: number[]; color: string; arc?: boolean; dash?: number[] }
export interface PlainMarks {
  shadows?: { square: number; opacity: number }[];
  check?: number;
  /** A line from each checking piece to the checked king. */
  threats?: readonly Checker[];
  checkProgress?: number;
  rings: PlainRing[];
  paths: PlainPath[];
  steps: { square: number; number: number }[];
}
type RingFrame = PlainRing & { sweep?: number; opacity?: number };
export const emptyMarks = (): PlainMarks => ({ rings: [], paths: [], steps: [] });

function pigment(ctx: CanvasRenderingContext2D, [light, body]: Brush, top: number, bottom: number): CanvasGradient {
  const ink = ctx.createLinearGradient(0, top, 0, bottom);
  ink.addColorStop(0, light);
  ink.addColorStop(.55, body);
  ink.addColorStop(1, body);
  return ink;
}

/** All geometry uses one square. The scene supplies orientation and canvas scale. */
export function drawPlainMarks(ctx: CanvasRenderingContext2D, scene: Pick<PaintedScene, 'PAD' | 'TILE' | 'cell'>,
  marks: Omit<PlainMarks, 'rings'> & { rings: RingFrame[] }, pixel = 1, routeOpacity = 1): void {
  const s = scene.TILE, key = Math.max(2.4 * pixel, .03 * s);
  const box = (sq: number) => {
    const { col, row } = scene.cell(sq);
    return [scene.PAD + col * s, scene.PAD + row * s] as const;
  };
  const point = (sq: number, down: number) => {
    const [x, y] = box(sq);
    return [x + .5 * s, y + down * s] as const;
  };
  const stroke = (brush: Brush, width: number, top: number, bottom: number, dash: number[], shape: () => void) => {
    ctx.setLineDash(dash.map(n => n * s / 75));
    ctx.beginPath(); shape(); ctx.strokeStyle = KEYLINE; ctx.lineWidth = width + key; ctx.stroke();
    ctx.beginPath(); shape(); ctx.strokeStyle = pigment(ctx, brush, top, bottom); ctx.lineWidth = width; ctx.stroke();
  };

  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const { square, opacity } of marks.shadows ?? []) {
    const [x, y] = box(square);
    ctx.fillStyle = lastMoveInk(opacity);
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = s * .06;
    ctx.fillRect(x + s * .05, y + s * .05, s * .9, s * .9);
  }
  if (marks.check != null) {
    const [x, y] = box(marks.check);
    ctx.save();
    if (marks.checkProgress != null) {
      const scale = 1 + .25 * (1 - marks.checkProgress);
      ctx.globalAlpha *= marks.checkProgress;
      ctx.translate(x + s / 2, y + s / 2); ctx.scale(scale, scale); ctx.translate(-x - s / 2, -y - s / 2);
    }
    ctx.fillStyle = '#c8382a38'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = s * .06;
    ctx.beginPath(); ctx.roundRect(x + s * .05, y + s * .05, s * .9, s * .9, s * .063); ctx.fill();
    ctx.shadowBlur = 0;
    for (const bottom of [false, true]) {
      const cornerY = y + s * (bottom ? .91 : .09), armY = y + s * (bottom ? .71 : .29);
      const corners = () => {
        for (const right of [false, true]) {
          const cornerX = x + s * (right ? .91 : .09), armX = x + s * (right ? .71 : .29);
          ctx.moveTo(cornerX, armY); ctx.lineTo(cornerX, cornerY); ctx.lineTo(armX, cornerY);
        }
      };
      stroke(PAINT.enemy, s * (bottom ? .046 : .0193), y + .08 * s, y + .92 * s, [], corners);
      if (bottom) {
        ctx.save(); ctx.translate(0, -.008 * s);
        ctx.beginPath(); corners(); ctx.strokeStyle = PAINT.enemy[0] + 'd1'; ctx.lineWidth = .009 * s; ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  // Threat lines: wax red from each checking piece to the edge of the king's square; a jump or a lob bends.
  const drawn = marks.checkProgress ?? 1;
  for (const threat of drawn > 0 ? marks.threats ?? [] : []) {
    const a = point(threat.sq, .77), k = point(threat.king, .77), [bx, by] = box(threat.king);
    const dx = k[0] - a[0], dy = k[1] - a[1], up = dy > 0 || !dy && dx > 0 ? -1 : 1;
    const c = [a[0] + dx / 2 + up * .25 * dy, a[1] + dy / 2 - up * .25 * dx], n = threat.path === 'arc' ? 16 : 1;
    const line = Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      return n === 1 ? [a[0] + dx * t, a[1] + dy * t] : [(1 - t) ** 2 * a[0] + 2 * t * (1 - t) * c[0] + t * t * k[0], (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t * t * k[1]];
    });
    const inside = ([x, y]: number[]) => x >= bx + .05 * s && x <= bx + .95 * s && y >= by + .05 * s && y <= by + .95 * s;
    const end = line.findIndex(inside), [p, q] = [line[end - 1], line[end]];
    // Where the last segment enters the king's square (its check tile).
    const enter = (i: 0 | 1, d = q[i] - p[i]) => d ? ((d > 0 ? (i ? by : bx) + .05 * s : (i ? by : bx) + .95 * s) - p[i]) / d : -Infinity;
    const t = Math.max(0, enter(0), enter(1));
    line.splice(end, Infinity, [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    // The draw-in: the line grows from the attacker to the king.
    let left = drawn * line.slice(1).reduce((sum, r, i) => sum + Math.hypot(r[0] - line[i][0], r[1] - line[i][1]), 0) || 0;
    const shown = [line[0]];
    for (let i = 1; i < line.length && left > 0; i++) {
      const [r0, r1] = [line[i - 1], line[i]], part = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]), f = Math.min(1, left / part);
      shown.push([r0[0] + (r1[0] - r0[0]) * f, r0[1] + (r1[1] - r0[1]) * f]); left -= part;
    }
    for (const [ink, width] of [[KEYLINE, WAX_LINE * s + key], [WAX, WAX_LINE * s]] as const) {
      ctx.beginPath(); shown.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.strokeStyle = ink; ctx.lineWidth = width; ctx.stroke();
    }
    // A wax bead at the foot of the checking piece.
    ctx.beginPath(); ctx.arc(a[0], a[1], .05 * s, 0, 2 * Math.PI); ctx.fillStyle = WAX; ctx.fill();
    ctx.strokeStyle = KEYLINE; ctx.lineWidth = key / 2; ctx.stroke();
  }

  ctx.save();
  ctx.globalAlpha *= routeOpacity;
  for (const path of marks.paths) {
    if (path.squares.length < 2) continue;
    const points = path.squares.map(sq => point(sq, .77)), a = points[0], b = points.at(-1)!;
    const control = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - .64 * s];
    const top = Math.min(...points.map(q => q[1]), path.arc ? control[1] : Infinity) - .03 * s;
    const bottom = Math.max(...points.map(q => q[1])) + .03 * s;
    const brush = brushes.get(path.color) ?? PAINT.move, width = .027 * .8 * s;
    stroke(brush, width, top, bottom, path.dash ?? [], () => {
      ctx.moveTo(...a);
      if (path.arc) ctx.quadraticCurveTo(control[0], control[1], ...b);
      else points.slice(1).forEach(q => ctx.lineTo(...q));
    });
    const prev = path.arc ? control : points.at(-2)!;
    const angle = Math.atan2(b[1] - prev[1], b[0] - prev[0]), length = .147 * s;
    stroke(brush, width, b[1] - length, b[1] + length, [], () => {
      ctx.moveTo(b[0] - Math.cos(angle - .5) * length, b[1] - Math.sin(angle - .5) * length);
      ctx.lineTo(...b);
      ctx.lineTo(b[0] - Math.cos(angle + .5) * length, b[1] - Math.sin(angle + .5) * length);
    });
  }
  ctx.restore();

  for (const ring of marks.rings) {
    const sweep = ring.sweep ?? 1, opacity = ring.opacity ?? 1;
    if (sweep <= 0 || opacity <= 0) continue;
    const brush = brushes.get(ring.color) ?? PAINT.move;
    const k = ring.size ?? 1, rx = .4 * s * k, ry = .18 * s * k;
    const [x, y] = point(ring.square, .79);
    const width = s * (ring.color === PLAIN.ice && ring.role === 'focus' ? .062 : k < 1 ? .036 : .046);
    ctx.save(); ctx.globalAlpha *= opacity;
    if (ring.frost) {
      drawFrostTarget(ctx, ...box(ring.square), s, sweep);
      ctx.restore();
      continue;
    }
    if (k < 1 && ring.color === PLAIN.move) {
      ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      pool.addColorStop(0, `rgba(255,214,120,${.5 * sweep})`);
      pool.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = pool;
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
    }
    const start = Math.PI * (.5 - sweep), end = Math.PI * (.5 + sweep);
    const slices = Math.ceil(64 * sweep);
    for (const edge of [true, false]) {
      const extra = edge ? key : 0;
      ctx.save();
      ctx.beginPath();
      for (const side of [1, -1]) {
        for (let i = 0; i <= slices; i++) {
          const a = side === 1 ? start + (end - start) * i / slices : end - (end - start) * i / slices;
          const height = Math.sin(a), half = side * (width * (.71 + .29 * height) + extra) / 2;
          ctx.lineTo(x + Math.cos(a) * (rx + half), y + height * (ry + .7 * half));
        }
      }
      ctx.closePath();
      const ink = edge ? KEYLINE : pigment(ctx, brush, y - ry, y + ry);
      if (ring.dash?.length) {
        ctx.clip(); ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, start, end);
        // Flat ends: a round cap of the wide keyline fills the dash gap (a dashed ring looks solid).
        ctx.setLineDash(ring.dash.map(n => n * s / 75)); ctx.lineCap = 'butt';
        ctx.strokeStyle = ink; ctx.lineWidth = width + extra; ctx.stroke();
      } else { ctx.fillStyle = ink; ctx.fill(); }
      ctx.restore();
    }
    if (!ring.dash?.length) {
      // A crisp light edge inside the keyline, along the inner side of the ring.
      const line = Math.max(pixel, .01 * s);
      ctx.beginPath();
      for (let i = 0; i <= slices; i++) {
        const a = start + (end - start) * i / slices, height = Math.sin(a), half = (line - width * (.71 + .29 * height)) / 2;
        ctx.lineTo(x + Math.cos(a) * (rx + half), y + height * (ry + .7 * half));
      }
      ctx.strokeStyle = brush[0]; ctx.lineWidth = line; ctx.stroke();
      if (sweep === 1) {
        ctx.beginPath(); ctx.ellipse(x, y - width * .12, rx, ry, 0, Math.PI / 6, Math.PI * 5 / 6);
        ctx.strokeStyle = brush[0] + 'd1'; ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha *= routeOpacity;
  for (const step of marks.steps) {
    const [x, y] = point(step.square, .18), left = x + .32 * s, r = .11 * s;
    const circle = () => ctx.arc(left, y, r, 0, Math.PI * 2);
    ctx.beginPath(); circle(); ctx.fillStyle = PAINT.move[0]; ctx.fill();
    stroke(PAINT.move, .02 * s, y - r, y + r, [], circle);
    ctx.fillStyle = '#2a2622';
    ctx.font = `700 ${Math.max(12 * pixel, s * 12 / 75)}px Avenir Next,Avenir,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(step.number), left, y);
  }
  ctx.restore();
}

function drawFrostTarget(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, sweep: number): void {
  ctx.globalAlpha *= sweep;
  ctx.fillStyle = '#7fb7d957'; ctx.fillRect(x, y, s, s);
  const edge = s / 46.75;
  ctx.strokeStyle = '#7fb7d9b3'; ctx.lineWidth = edge;
  ctx.strokeRect(x + edge / 2, y + edge / 2, s - edge, s - edge);
  ctx.strokeStyle = KEYLINE;
  ctx.strokeRect(x + edge * 1.5, y + edge * 1.5, s - 3 * edge, s - 3 * edge);
  ctx.translate(x + 3 * edge + .13 * s, y + 3 * edge + .13 * s);
  ctx.rotate((sweep - 1) * 2 * Math.PI / 9);
  const r = .104 * s * (.5 + .5 * sweep);
  ctx.beginPath();
  for (let spoke = 0; spoke < 6; spoke++) {
    const a = spoke * Math.PI / 3 - Math.PI / 2;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    ctx.moveTo(0, 0); ctx.lineTo(dx, dy);
    if (spoke % 3 === 0) {
      ctx.moveTo(dx * .75 - dy * .25, dy * .75 + dx * .25);
      ctx.lineTo(dx, dy);
      ctx.lineTo(dx * .75 + dy * .25, dy * .75 - dx * .25);
    }
  }
  ctx.strokeStyle = '#fbf8f0f2'; ctx.lineWidth = .055 * s; ctx.stroke();
  ctx.strokeStyle = '#3f86b3'; ctx.lineWidth = .0234 * s; ctx.stroke();
}
