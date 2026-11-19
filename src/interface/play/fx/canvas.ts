import { reducedMotion, setPaintHook, tween } from './clock';
import { ease } from './curves';
import type { BurstOptions, EdgeOptions, Effect, Point, ShakeOptions, StreakOptions } from './index';

type Draw = (ctx: CanvasRenderingContext2D, progress: number) => void;
const painters = new Set<(ctx: CanvasRenderingContext2D) => void>();
const brass = { light: '#fff6cf', body: '#e8b85a', edge: '#a87935' };
let canvas: HTMLCanvasElement | undefined;
let context: CanvasRenderingContext2D | null;
let dirty = false;

function paint(): void {
  if (!canvas || !context || (!painters.size && !dirty)) return;
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
    document.body.append(canvas);
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
