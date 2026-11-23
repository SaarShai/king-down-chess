import type { CastFamily } from '../cast';
import { reducedMotion, setPaintHook, tween } from './clock';
import { ease } from './curves';
import type { BurstOptions, EdgeOptions, Effect, Point, SealOptions, ShakeOptions, StreakOptions, StrikeOptions } from './index';

type Draw = (ctx: CanvasRenderingContext2D, progress: number) => void;
const painters = new Set<(ctx: CanvasRenderingContext2D) => void>();
const brass = { light: '#fff6cf', body: '#e8b85a', edge: '#a87935' };
let canvas: HTMLCanvasElement | undefined;
let context: CanvasRenderingContext2D | null;
let dirty = false;

function paint(): void {
  if (!canvas || !context || (!painters.size && !dirty)) return;
  // A native dialog sits above every canvas attached to the page body.
  const host = document.querySelector('dialog:modal') ?? document.body;
  if (canvas.parentElement !== host) host.append(canvas);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(window.innerWidth * ratio), height = Math.round(window.innerHeight * ratio);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width / ratio, height / ratio);
  for (const draw of painters) {
    context.save();
    context.lineCap = context.lineJoin = 'round';
    draw(context);
    context.restore();
  }
  dirty = painters.size > 0;
}

function drawFor(ms: number, draw: Draw, done?: () => void): Effect {
  if (reducedMotion() || ms <= 0) return tween(0, () => {}, { done });
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'daylight-fx';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000';
    context = canvas.getContext('2d');
    setPaintHook(paint);
  }
  let progress = 0;
  const layer = (ctx: CanvasRenderingContext2D) => draw(ctx, progress);
  if (context) painters.add(layer);
  const remove = () => {
    painters.delete(layer);
    if (!painters.size) paint();
  };
  const effect = tween(ms, (_, raw) => { progress = raw; }, { done: () => { remove(); done?.(); } });
  return { cancel() { effect.cancel(); remove(); }, finish: effect.finish };
}

function pagePoint(point: Point): () => Point {
  const x = point.x + window.scrollX, y = point.y + window.scrollY;
  return () => ({ x: x - window.scrollX, y: y - window.scrollY });
}

export function streak(from: Point, to: Point, {
  ms = 360, width = 5, bend = .25, curve = ease.io3, onArrive,
}: StreakOptions = {}): Effect {
  if (reducedMotion() || ms <= 0) return drawFor(0, () => {}, onArrive);
  const origin = pagePoint(from);
  const dx = to.x - from.x, dy = to.y - from.y;
  return drawFor(ms, (ctx, progress) => {
    const { x, y } = origin();
    const head = curve(progress), tail = curve(Math.max(0, progress - .28));
    const fade = Math.min(1, (1 - progress) * 12);
    const point = (t: number) => {
      const arc = 2 * t * (1 - t) * bend;
      return { x: x + dx * t - dy * arc, y: y + dy * t + dx * arc };
    };
    const tip = point(head);
    const trace = (color: string, size: number) => {
      ctx.strokeStyle = color;
      let last = point(tail);
      for (let i = 1; i <= 12; i++) {
        const next = point(tail + (head - tail) * i / 12);
        ctx.lineWidth = size * (.1 + .9 * i / 12) * fade;
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(next.x, next.y); ctx.stroke();
        last = next;
      }
    };
    ctx.globalAlpha = fade;
    trace(brass.edge, width + 2);
    trace(brass.body, width);
    trace(brass.light, width * .4);
    ctx.fillStyle = brass.light;
    ctx.beginPath(); ctx.arc(tip.x, tip.y, width * .45, 0, Math.PI * 2); ctx.fill();
  }, onArrive);
}

export function edgeLight(element: Element, { ms = 420, width = 2.4, reverse = false }: EdgeOptions = {}): Effect {
  return drawFor(ms, (ctx, progress) => {
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const corner = getComputedStyle(element).borderTopLeftRadius;
    const radius = Math.min((parseFloat(corner) || 0) * (corner.endsWith('%') ? box.width / 100 : 1), box.width / 2, box.height / 2);
    const perimeter = 2 * (box.width + box.height) + (2 * Math.PI - 8) * radius;
    const segment = Math.max(.01, perimeter * .22 * Math.sin(progress * Math.PI));
    ctx.setLineDash([segment, perimeter - segment]);
    ctx.lineDashOffset = -(progress * (reverse ? -1 : 1) + .62) * perimeter;
    ctx.beginPath(); ctx.roundRect(box.left, box.top, box.width, box.height, radius);
    ctx.strokeStyle = brass.edge; ctx.lineWidth = width + 2; ctx.stroke();
    ctx.strokeStyle = brass.light; ctx.lineWidth = width; ctx.stroke();
  });
}

export function burst(kind: 'sparks' | 'dust', point: Point, {
  ms = kind === 'dust' ? 350 : 420, count = kind === 'dust' ? 4 : 10, rise = kind === 'dust' ? 8 : 70,
}: BurstOptions = {}): Effect {
  if (reducedMotion() || ms <= 0) return drawFor(0, () => {});
  const origin = pagePoint(point);
  const particles = Array.from({ length: count }, (_, i) => ({
    dx: (2 * (i + .5) / count - 1) * (kind === 'dust' ? 26 : 65) * (.65 + Math.random() * .5),
    up: rise * (.45 + Math.random() * .55),
    size: .75 + Math.random() * .5,
  }));
  return drawFor(ms, (ctx, progress) => {
    const { x, y } = origin();
    const travel = ease.out3(progress);
    for (const [i, particle] of particles.entries()) {
      const px = x + particle.dx * travel;
      const py = y - particle.up * (kind === 'dust' ? travel : 2.5 * progress - 2 * progress ** 2);
      ctx.globalAlpha = 1 - progress;
      ctx.beginPath();
      if (kind === 'dust') {
        const radius = particle.size * (3 + 7 * travel);
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
        gradient.addColorStop(0, i % 2 ? '#f6f0e0aa' : '#68615266');
        gradient.addColorStop(1, '#68615200');
        ctx.fillStyle = gradient;
        ctx.ellipse(px, py, radius, radius / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.moveTo(px, py);
        ctx.lineTo(px + particle.dx * .08, py + particle.size * 6);
        ctx.strokeStyle = brass.edge; ctx.lineWidth = particle.size * 2.4; ctx.stroke();
        ctx.strokeStyle = brass.light; ctx.lineWidth = particle.size * 1.1; ctx.stroke();
      }
    }
  });
}

export const BEAT_MS = 260;
const unit = (n: number) => Math.min(1, Math.max(0, n));
/** The capture beat at a time on the effect clock. The scene's contact hold stops that clock, so the hold shows beatAt(0). */
export function beatAt(ms: number) {
  return { rim: unit(1 - ms / 70), head: ease.out3(unit(ms / 75)), tail: ease.in2(unit((ms - 50) / 160)), chips: unit((ms - 20) / (BEAT_MS - 20)) };
}
// Limestone chips: direction from the strike (rad), reach and size (tiles), spin (turns over the beat).
const CHIPS = [[-.5, .5, 1, .5], [-.15, .62, .75, -.7], [.2, .45, .9, .8], [.55, .38, .6, -.5]] as const;
const CHIP = [[0, 1], [1.3, .7], [2.4, .9], [3.6, .6], [4.9, .8]] as const;

/**
 * A capture on the struck tile (viewport box): a rim light on the figure, a dry-brush slash along the strike
 * and stone chips. A ranged capture has no slash. `height` is the figure's height in CSS pixels.
 */
export function strike(tile: { left: number; top: number; width: number; height: number }, { from, height = tile.width, ranged = false }: StrikeOptions = {}): Effect {
  if (reducedMotion()) return drawFor(0, () => {});
  const s = tile.width, foot = pagePoint({ x: tile.left + s / 2, y: tile.top + tile.height * .79 });
  const dx = from ? tile.left + s / 2 - from.x : 1, dy = from ? tile.top + tile.height * .79 - from.y : 0, l = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / l, y: dy / l };
  // A brush cut crosses the figure: tilt it 40 degrees off the strike, and light its upper side.
  const a = Math.atan2(dir.y, dir.x) - .7, u = { x: Math.cos(a), y: Math.sin(a) };
  const n = -u.x <= 0 ? { x: u.y, y: -u.x } : { x: -u.y, y: u.x };
  const { innerWidth, innerHeight } = window;
  return drawFor(BEAT_MS, (ctx, progress) => {
    // A turned phone or a resized window moves the board: the beat stops at once.
    if (window.innerWidth !== innerWidth || window.innerHeight !== innerHeight) return;
    const { rim, head, tail, chips } = beatAt(progress * BEAT_MS), { x, y } = foot(), body = { x, y: y - .5 * height };
    if (rim > 0) {
      // The rim lights the figure's flank on the attacker's side (the left one for a strike straight up or down).
      const rx = Math.min(.3 * s, .28 * height), ry = .46 * height, facing = dir.x > .2 ? Math.PI : dir.x < -.2 ? 0 : Math.PI;
      ctx.globalAlpha = rim; ctx.shadowColor = '#ffdf85'; ctx.shadowBlur = .12 * s;
      for (const [color, width] of [['#ffdf85aa', .05 * s], ['#fff8e1', .018 * s]] as const) {
        ctx.beginPath(); ctx.ellipse(body.x, body.y, rx, ry, 0, facing - .9, facing + .9);
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    if (!ranged && head > tail) {
      const length = 1.2 * s, belly = .13 * s, c = body;
      const along = (q: number, off: number) => {
        const t = tail + (head - tail) * q, bend = .08 * s * Math.sin(Math.PI * t) + off;
        ctx.lineTo(c.x + u.x * (t - .5) * length + n.x * bend, c.y + u.y * (t - .5) * length + n.y * bend);
      };
      const half = (q: number) => belly / 2 * Math.sin(Math.PI * q) ** .7;
      const edge = (side: number, from = 0, to = 1) => {
        for (let i = 0; i <= 20; i++) { const q = from + (to - from) * i / 20; along(q, side * half(q)); }
      };
      ctx.beginPath(); edge(1); for (let i = 20; i >= 0; i--) along(i / 20, -half(i / 20)); ctx.closePath();
      ctx.fillStyle = '#433022eb'; ctx.fill();
      // Two bristle splits run out of the tail.
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = Math.max(.8, .012 * s);
      for (const side of [.3, -.25]) { ctx.beginPath(); edge(side, .04, .55); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      // A dry gold edge on the lit side, broken in two places.
      const lit = (length * (head - tail));
      ctx.setLineDash([lit * .34, lit * .07, lit * .3, lit * .06, lit]);
      ctx.beginPath(); edge(.85); ctx.strokeStyle = '#ffdf85'; ctx.lineWidth = Math.max(1, .018 * s); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (chips > 0) {
      const travel = ease.out3(chips), origin = { x: body.x, y: y - .25 * height };
      ctx.globalAlpha = unit((1 - chips) / .4); ctx.lineWidth = Math.max(1, .016 * s); ctx.strokeStyle = '#4e3815';
      for (const [turn, reach, size, spin] of CHIPS) {
        const way = Math.atan2(dir.y, dir.x) + turn, r = size * .065 * s;
        ctx.save();
        ctx.translate(origin.x + Math.cos(way) * reach * s * travel, origin.y + Math.sin(way) * reach * s * travel + .25 * s * chips ** 2);
        ctx.rotate(spin * 2 * Math.PI * chips);
        ctx.beginPath(); for (const [angle, k] of CHIP) ctx.lineTo(Math.cos(angle) * r * k, Math.sin(angle) * r * k); ctx.closePath();
        ctx.fillStyle = '#cdbf9c'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); for (const [angle, k] of CHIP.slice(0, 3)) ctx.lineTo(Math.cos(angle) * r * k, Math.sin(angle) * r * k); ctx.closePath();
        ctx.fillStyle = '#fffaf0'; ctx.fill();
        ctx.restore();
      }
    }
  });
}

export const SEAL_MS = 420;
/** The commit seal at a time after the End turn tap: the stamp lands, a brass line runs to the turn text, a rule sweeps under it. */
export function sealAt(ms: number) {
  return { land: ease.in2(unit(ms / 100)), ring: unit((ms - 100) / 140), head: ease.io3(unit((ms - 100) / 130)), tail: ease.io3(unit((ms - 150) / 120)),
    rule: ease.out3(unit((ms - 230) / 100)), fade: unit((SEAL_MS - ms) / 100) };
}
// A crown in a 24 x 26 box, the win mark of the result seal.
const CROWN = [[4, 8], [8, 12], [12, 5], [16, 12], [20, 8], [18, 19], [6, 19]] as const;

/**
 * The own End turn as one moment: a wax seal lands on the plate, a brass line carries it to the first turn text
 * that shows (`text()`), and a rule sweeps under that text. The elements and their boxes are read on each frame.
 */
export function seal(plate: Element, text: () => Element[], { onArrive }: SealOptions = {}): Effect {
  if (reducedMotion()) return drawFor(0, () => {}, onArrive);
  let arrived = false;
  return drawFor(SEAL_MS, (ctx, progress) => {
    const { land, ring, head, tail, rule, fade } = sealAt(progress * SEAL_MS), box = plate.getBoundingClientRect();
    if (!box.width) return;
    const r = Math.min(16, box.height * .3), cx = box.right - box.height * .62, cy = box.top + box.height / 2;
    const line = text().map(node => node.getBoundingClientRect()).find(b => b.width && b.height);
    if (head === 1 && !arrived) { arrived = true; onArrive?.(); }
    ctx.globalAlpha = fade;
    if (line && head > tail) {
      // The line leaves the top of the seal and ends where the rule starts.
      const to = { x: line.left, y: line.bottom + 3 }, dx = to.x - cx, dy = to.y - (cy - r);
      const point = (t: number) => ({ x: cx + dx * t - dy * .12 * t * (1 - t), y: cy - r + dy * t + dx * .12 * t * (1 - t) });
      for (const [color, width] of [[brass.edge, 4], [brass.body, 2.6], [brass.light, 1]] as const) {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width;
        for (let i = 0; i <= 12; i++) { const p = point(tail + (head - tail) * i / 12); ctx.lineTo(p.x, p.y); }
        ctx.stroke();
      }
    }
    if (line && rule > 0) {
      for (const [color, width] of [[brass.edge, 3], [brass.light, 1]] as const) {
        ctx.beginPath(); ctx.moveTo(line.left, line.bottom + 3); ctx.lineTo(line.left + line.width * rule, line.bottom + 3);
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      }
    }
    if (ring > 0 && ring < 1) {
      // The wax spreads a faint ring as the stamp lands.
      ctx.globalAlpha = fade * .45 * (1 - ring);
      ctx.beginPath(); ctx.arc(cx, cy, r * (1 + .6 * ring), 0, 2 * Math.PI); ctx.strokeStyle = '#9b3324'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // The stamp drops from 1.6 times its size and lands at 100 ms.
    const k = r * (1.6 - .6 * land);
    ctx.globalAlpha = fade * unit(land * 1.6);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, e = k * (1 + .07 * Math.sin(i * 2.7)); ctx.lineTo(cx + Math.cos(a) * e, cy + Math.sin(a) * e); }
    ctx.closePath(); ctx.fillStyle = '#9b3324'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, k * .74, 0, 2 * Math.PI); ctx.strokeStyle = '#6e2116'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath();
    for (const [x, y] of CROWN) ctx.lineTo(cx + (x - 12) * k / 18, cy + (y - 13) * k / 18);
    ctx.closePath(); ctx.strokeStyle = '#f6e7c8'; ctx.lineWidth = 1.4; ctx.stroke();
  });
}

export const CLOSE_MS = 480;
/** The checkmate beat at a time after the hold starts: the wax ring closes on the king, a brass glint leaves it, all fades. */
export function closeAt(ms: number) {
  return { close: ease.in2(unit(ms / 160)), glint: unit((ms - 160) / 200), fade: unit((CLOSE_MS - ms) / 180) };
}

/** Checkmate: a wax-red ring closes round the mated king's foot on its tile (viewport box) and a brass glint leaves it. */
export function closeIn(tile: { left: number; top: number; width: number; height: number }): Effect {
  if (reducedMotion()) return drawFor(0, () => {});
  const s = tile.width, foot = pagePoint({ x: tile.left + s / 2, y: tile.top + tile.height * .79 });
  const { innerWidth, innerHeight } = window;
  return drawFor(CLOSE_MS, (ctx, progress) => {
    if (window.innerWidth !== innerWidth || window.innerHeight !== innerHeight) return;
    const { close, glint, fade } = closeAt(progress * CLOSE_MS), { x, y } = foot();
    const ring = (k: number, color: string, width: number) => {
      ctx.beginPath(); ctx.ellipse(x, y, .44 * s * k, .19 * s * k, 0, 0, 2 * Math.PI); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    };
    // The ring drops from 1.8 times the king's ring and lands at 160 ms, like the stamp of the result seal.
    ctx.globalAlpha = fade * unit(close * 2);
    ring(1.8 - .8 * close, '#4e3815', .075 * s); ring(1.8 - .8 * close, '#9b3324', .045 * s);
    if (glint > 0 && glint < 1) { ctx.globalAlpha = fade * (1 - glint); ring(1 + .35 * ease.out3(glint), '#ffdf85', .022 * s); }
  });
}

export const CAST_MS = 440;
/** The cast beat at a time after the card lands: its form arrives by 160 ms, a glint runs from 140 to 340 ms, all fades by the end. */
export function castAt(ms: number) {
  return { arrive: ease.out3(unit(ms / 160)), glint: unit((ms - 140) / 200), fade: unit((CAST_MS - ms) / 160) };
}
type Box = { left: number; top: number; width: number; height: number };
const UMBER = '#4e3815', GILT = '#ffdf85', VELLUM = '#f6ecd0';
const footOf = (b: Box): Point => ({ x: b.left + b.width / 2, y: b.top + b.height * .79 });
// A hammered brass stud in the umber keyline of the board marks, so it reads on light and dark stone.
function stud(ctx: CanvasRenderingContext2D, { x, y }: Point, r: number): void {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = brass.body; ctx.fill();
  ctx.strokeStyle = UMBER; ctx.lineWidth = Math.max(1, r * .35); ctx.stroke();
  ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .35, 0, 2 * Math.PI); ctx.fillStyle = brass.light; ctx.fill();
}
function star(ctx: CanvasRenderingContext2D, { x, y }: Point, r: number): void {
  if (r <= 0) return;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, k = i % 2 ? r * .22 : r; ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); }
  ctx.closePath(); ctx.fillStyle = brass.light; ctx.fill(); ctx.strokeStyle = UMBER; ctx.lineWidth = 1; ctx.stroke();
}
// A line of studs from a to b (bent like a streak) that lights from head to tail.
function studs(ctx: CanvasRenderingContext2D, a: Point, b: Point, bend: number, head: number, tail: number, r: number): void {
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.max(3, Math.min(9, Math.round(Math.hypot(dx, dy) / (5 * r))));
  for (let i = 0; i <= n; i++) {
    const t = i / n, arc = 2 * t * (1 - t) * bend;
    if (t <= head && t >= tail) stud(ctx, { x: a.x + dx * t - dy * arc, y: a.y + dy * t + dx * arc }, r);
  }
}
// The limestone crack of a quake: rays with fixed bends (direction in turns, reach in tiles).
const RAYS = [[.02, .95], [.19, .7], [.33, .9], [.5, .8], [.66, .95], [.83, .75]] as const;
type CastDraw = (ctx: CanvasRenderingContext2D, boxes: Box[], at: ReturnType<typeof castAt>, ms: number) => void;
const CAST_DRAW: Record<CastFamily, CastDraw> = {
  // Shift: brass studs run from the start square to the landing square; a brass star glints there.
  shift(ctx, [a, b], { arrive, glint }, ms) {
    const s = b.width;
    studs(ctx, footOf(a), footOf(b), 0, arrive, ease.in2(unit((ms - 100) / 220)), .05 * s);
    star(ctx, { x: b.left + .78 * s, y: b.top + .22 * s }, .26 * s * Math.sin(Math.PI * glint));
  },
  // Trade: two lines of studs cross between the two squares, one each way; both squares glint.
  trade(ctx, [a, b], { arrive, glint }, ms) {
    const s = a.width, tail = ease.in2(unit((ms - 100) / 220));
    studs(ctx, footOf(a), footOf(b), .18, arrive, tail, .05 * s);
    studs(ctx, footOf(b), footOf(a), .18, arrive, tail, .05 * s);
    for (const t of [a, b]) star(ctx, { x: t.left + .78 * s, y: t.top + .22 * s }, .22 * s * Math.sin(Math.PI * glint));
  },
  // Ward: a hammered brass ring with eight rivets closes on the square, and a glint runs round it.
  ward(ctx, [t], { arrive, glint }) {
    const s = t.width, x = t.left + s / 2, y = t.top + t.height / 2, r = s * (.9 - .38 * arrive);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.strokeStyle = UMBER; ctx.lineWidth = .06 * s; ctx.stroke(); ctx.strokeStyle = brass.body; ctx.lineWidth = .035 * s; ctx.stroke();
    for (let i = 0; i < 8; i++) stud(ctx, { x: x + Math.cos(i * Math.PI / 4) * r, y: y + Math.sin(i * Math.PI / 4) * r }, .035 * s);
    if (glint > 0 && glint < 1) {
      const a = -Math.PI / 2 + 2 * Math.PI * ease.io3(glint);
      ctx.beginPath(); ctx.arc(x, y, r, a - .8, a); ctx.strokeStyle = brass.light; ctx.lineWidth = .02 * s; ctx.stroke();
    }
  },
  // Change: gilt vellum flecks rise from the piece's foot round a fading gilt ground ring.
  change(ctx, boxes, { arrive }, ms) {
    const rise = ease.out3(unit(ms / (CAST_MS - 40)));
    for (const t of boxes) {
      const s = t.width, { x, y } = footOf(t);
      ctx.save(); ctx.globalAlpha *= 1 - .7 * arrive;
      ctx.beginPath(); ctx.ellipse(x, y, .45 * s * (.4 + .6 * arrive), .19 * s * (.4 + .6 * arrive), 0, 0, 2 * Math.PI);
      ctx.strokeStyle = UMBER; ctx.lineWidth = .06 * s; ctx.stroke(); ctx.strokeStyle = GILT; ctx.lineWidth = .035 * s; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 10; i++) {
        const side = (i / 9 - .5) * .8 * s, up = (.25 + .9 * ((i * 7) % 10) / 10) * s * rise, r = .075 * s * (1 - .45 * rise);
        const px = x + side * (.6 + .4 * rise), py = y - up;
        ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py); ctx.closePath();
        ctx.fillStyle = i % 2 ? VELLUM : GILT; ctx.fill(); ctx.strokeStyle = UMBER; ctx.lineWidth = .8; ctx.stroke();
      }
    }
  },
  // Quake: a limestone crack opens from the chosen square, and stone chips fall from each pushed piece.
  quake(ctx, [c, ...pushed], { arrive }, ms) {
    const s = c.width, x = c.left + s / 2, y = c.top + c.height / 2;
    for (const [turn, reach] of RAYS) {
      const a = turn * 2 * Math.PI, l = reach * s * arrive;
      const path = [[0, 0], [.35, .12], [.7, -.1], [1, .05]].map(([t, j]) => ({ x: x + Math.cos(a) * l * t - Math.sin(a) * j * s * .3, y: y + Math.sin(a) * l * t + Math.cos(a) * j * s * .3 }));
      for (const [color, width, off] of [[UMBER, .03 * s, 0], ['#fffaf0', .012 * s, 1]] as const) {
        ctx.beginPath(); for (const p of path) ctx.lineTo(p.x + off, p.y + off); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      }
    }
    const fall = unit((ms - 60) / 300);
    if (fall > 0) for (const t of pushed) {
      const { x: px, y: py } = footOf(t), way = Math.atan2(py - y, px - x);
      for (const [turn, reach, size, spin] of CHIPS.slice(0, 3)) {
        const r = size * .06 * s, k = ease.out3(fall);
        ctx.save(); ctx.translate(px + Math.cos(way + turn) * reach * s * .6 * k, py - .3 * s + Math.sin(way + turn) * reach * s * .3 * k + .3 * s * fall ** 2);
        ctx.rotate(spin * 2 * Math.PI * fall);
        ctx.beginPath(); for (const [angle, m] of CHIP) ctx.lineTo(Math.cos(angle) * r * m, Math.sin(angle) * r * m); ctx.closePath();
        ctx.fillStyle = '#cdbf9c'; ctx.fill(); ctx.strokeStyle = UMBER; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      }
    }
  },
  // Rule: no square changes, so a gilt lozenge pops at the start of the turn text and glints.
  rule(ctx, [t], { arrive, glint }) {
    const x = t.left - 10, y = t.top + t.height / 2, r = 6 * ease.back(arrive);
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .7, y); ctx.closePath();
    ctx.fillStyle = GILT; ctx.fill(); ctx.strokeStyle = UMBER; ctx.lineWidth = 1.2; ctx.stroke();
    star(ctx, { x: x + 4, y: y - 5 }, 7 * Math.sin(Math.PI * glint));
  },
};

/**
 * A card's finale where it changed the board: one beat for each card family (`CAST_FAMILY`), read at the given tiles
 * (rule: at the first turn text that shows). The boxes are read on each frame; a tile with no box ends the drawing.
 */
export function castIn(family: CastFamily, tiles: Element[], text: () => Element[]): Effect {
  if (reducedMotion()) return drawFor(0, () => {});
  return drawFor(CAST_MS, (ctx, progress) => {
    const boxes = family === 'rule' ? text().map(node => node.getBoundingClientRect()).filter(b => b.width && b.height).slice(0, 1)
      : tiles.map(node => node.getBoundingClientRect());
    // No box: the game screen has gone. A modal dialog (Menu) holds the effect layer: the beat does not cover it.
    if (!boxes.length || boxes.some(b => !b.width) || document.querySelector('dialog:modal')) return;
    const at = castAt(progress * CAST_MS);
    ctx.globalAlpha = at.fade;
    CAST_DRAW[family](ctx, boxes, at, progress * CAST_MS);
  });
}

const shakes = new WeakMap<HTMLElement, Effect>();

export function shake(element: HTMLElement, { ms = 220, amplitude = 3 }: ShakeOptions = {}): Effect {
  shakes.get(element)?.finish();
  if (reducedMotion() || ms <= 0 || amplitude <= 0) return tween(0, () => {});
  const base = element.style.translate;
  const restore = () => { element.style.translate = base; shakes.delete(element); };
  const motion = tween(ms, (_, progress) => {
    if (progress < 1) element.style.translate = `${amplitude * (1 - progress) ** 2 * Math.cos(progress * ms * .034)}px`;
  }, { done: restore });
  const effect = { cancel() { motion.cancel(); if (shakes.get(element) === effect) restore(); }, finish: motion.finish };
  shakes.set(element, effect);
  return effect;
}
