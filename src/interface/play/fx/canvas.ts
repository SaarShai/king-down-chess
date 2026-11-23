import { reducedMotion, setPaintHook, tween } from './clock';
import { ease } from './curves';
import type { BurstOptions, EdgeOptions, Effect, Point, ShakeOptions, StreakOptions, StrikeOptions } from './index';

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
