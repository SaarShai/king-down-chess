import type { PaintedScene } from './painted/scene.mjs';

type Brush = readonly [light: string, body: string, deep: string];
const PAINT = {
  actor: ['#fff6cf', '#e9b44c', '#7a5318'],
  move: ['#fffdf2', '#f3deb0', '#7d6a45'],
  enemy: ['#ffc9b8', '#c8382a', '#5e130d'],
  friend: ['#d9eeea', '#2f6f73', '#17494d'],
  ice: ['#ffffff', '#8fd3f4', '#2b6591'],
  holy: ['#fff6cf', '#ebcb80', '#7a5318'],
  ember: ['#ffe0b8', '#b46635', '#683412'],
  shadow: ['#eadde8', '#796378', '#3e2d3e'],
} as const satisfies Record<string, Brush>;
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
  const s = scene.TILE;
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
    ctx.save();
    ctx.translate(0, .014 * s);
    ctx.beginPath(); shape(); ctx.strokeStyle = brush[2] + '8c'; ctx.lineWidth = width + .016 * s; ctx.stroke();
    ctx.restore();
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
  }
  ctx.shadowBlur = 0;

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
      const drop = edge ? .014 * s : 0, extra = edge ? .016 * s : 0;
      ctx.save();
      ctx.beginPath();
      for (const side of [1, -1]) {
        for (let i = 0; i <= slices; i++) {
          const a = side === 1 ? start + (end - start) * i / slices : end - (end - start) * i / slices;
          const height = Math.sin(a), half = side * (width * (.71 + .29 * height) + extra) / 2;
          ctx.lineTo(x + Math.cos(a) * (rx + half), y + drop + height * (ry + .7 * half));
        }
      }
      ctx.closePath();
      const ink = edge ? brush[2] + '8c' : pigment(ctx, brush, y - ry, y + ry);
      if (ring.dash?.length) {
        ctx.clip(); ctx.beginPath();
        ctx.ellipse(x, y + drop, rx, ry, 0, start, end);
        ctx.setLineDash(ring.dash.map(n => n * s / 75));
        ctx.strokeStyle = ink; ctx.lineWidth = width + extra; ctx.stroke();
      } else { ctx.fillStyle = ink; ctx.fill(); }
      ctx.restore();
    }
    if (sweep === 1 && !ring.dash?.length) {
      ctx.beginPath(); ctx.ellipse(x, y - width * .12, rx, ry, 0, Math.PI / 6, Math.PI * 5 / 6);
      ctx.strokeStyle = brush[0] + 'd1'; ctx.lineWidth = Math.max(pixel, .01 * s); ctx.stroke();
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
