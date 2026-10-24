import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';

// Three short material studies. All points are scene pixels; no board or figure transform is applied.
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const rand = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };
const mix = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const body = (foot: Point) => ({ x: foot.x, y: foot.y - 72 });
function bloom(ctx: CanvasRenderingContext2D, p: Point, radius: number, colour: string[], opacity = 1, stretch = 1) {
  if (opacity <= 0 || radius <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.scale(1, stretch);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  g.addColorStop(0, colour[0]); g.addColorStop(.25, colour[1]); g.addColorStop(.65, colour[2]); g.addColorStop(1, colour[3]);
  ctx.fillStyle = g; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
}
const FIRE = ['#fff3b8ec', '#ffc051a8', '#e84b194d', '#c4270000'];
const ICE = ['#f3ffffed', '#b6f5ffc2', '#4fbbf96b', '#4fbbf900'];
const DUST = ['#bba78866', '#ad917451', '#78634d2a', '#78634d00'];
const SMOKE = ['#51433065', '#66513a45', '#8b71562a', '#8b715600'];
function fleck(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, colour: string, opacity: number) {
  if (opacity <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size, -size * .25); ctx.lineTo(-size * .2, -size); ctx.lineTo(size, -size * .3); ctx.lineTo(size * .5, size * .7); ctx.lineTo(-size * .7, size); ctx.closePath(); ctx.fillStyle = colour; ctx.fill(); ctx.restore();
}
function hotStroke(ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, colour: string, opacity: number) {
  ctx.save(); ctx.globalAlpha *= opacity; ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
}
// Filled, uneven tongues, with no stroked contour or icon geometry.
function tongue(ctx: CanvasRenderingContext2D, root: Point, tip: Point, width: number, opacity: number, cold = false) {
  ctx.save(); ctx.globalAlpha *= opacity;
  const dx = tip.x - root.x, dy = tip.y - root.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  ctx.beginPath(); ctx.moveTo(root.x - nx * width, root.y - ny * width);
  ctx.bezierCurveTo(root.x + dx * .3 - nx * width * 1.4, root.y + dy * .3 - ny * width * 1.4, tip.x - dx * .35 + nx * width * .5, tip.y - dy * .35 + ny * width * .5, tip.x, tip.y);
  ctx.bezierCurveTo(tip.x - dx * .5 - nx * width * .15, tip.y - dy * .5 - ny * width * .15, root.x + dx * .4 + nx * width, root.y + dy * .4 + ny * width, root.x + nx * width, root.y + ny * width); ctx.closePath();
  const g = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  if (cold) { g.addColorStop(0, '#3d9ddd80'); g.addColorStop(.35, '#d1f8ffe6'); g.addColorStop(.72, '#efffffcc'); g.addColorStop(1, '#d1f8ff00'); }
  else { g.addColorStop(0, '#b52a0ba0'); g.addColorStop(.24, '#f77e1de8'); g.addColorStop(.6, '#ffdd7cec'); g.addColorStop(.85, '#fff3bedb'); g.addColorStop(1, '#f7711200'); }
  ctx.fillStyle = g; ctx.fill(); ctx.restore();
}
function source(ctx: CanvasRenderingContext2D, p: Point, t: number, cold = false) {
  const build = ease(t / .22), fade = 1 - ease((t - .22) / .15), amount = build * fade;
  if (amount <= 0) return;
  bloom(ctx, p, 74 + build * 20, cold ? ICE : FIRE, amount * .5, 1.15);
  for (let i = 0; i < 17; i++) {
    const angle = i * 2.399 + t * 8, radius = (85 - build * 57) * (.55 + rand(i, 1) * .65);
    const root = { x: p.x + Math.cos(angle) * radius, y: p.y + Math.sin(angle) * radius * .65 };
    const tip = { x: root.x - Math.sin(angle) * (16 + build * 22), y: root.y + Math.cos(angle) * 12 - 12 };
    tongue(ctx, root, tip, 2 + rand(i, 5) * 3, amount * .65, cold);
  }
}
function trail(ctx: CanvasRenderingContext2D, a: Point, b: Point, u: number, t: number, cold = false) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const current = mix(a, b, u), width = cold ? 25 : 37;
  // A short, ragged luminous wake follows the moving front rather than drawing the route.
  for (let i = 0; i < 24; i++) {
    const age = i / 24, back = Math.max(0, u - age * .23), base = mix(a, b, back);
    const wobble = Math.sin(age * 13 + t * 21) * width * age * .6;
    const at = { x: base.x + nx * wobble, y: base.y + ny * wobble };
    bloom(ctx, at, (12 + width * (1 - age)) * (1 - age * .4), cold ? ICE : FIRE, (1 - age) * .13);
    if (i % 3 === 0) tongue(ctx, at, { x: at.x - dx / len * 38 - nx * wobble, y: at.y - dy / len * 38 - ny * wobble }, 5 + (1 - age) * 11, .7 * (1 - age), cold);
  }
  bloom(ctx, current, cold ? 34 : 43, cold ? ICE : FIRE, .65);
  for (let i = 0; i < 32; i++) {
    const life = (t * 2.7 + rand(i, 4)) % 1, back = Math.max(0, u - life * .24), base = mix(a, b, back), off = (rand(i, 6) - .5) * width * 3 * life;
    const x = base.x + nx * off, y = base.y + ny * off + life * life * 22;
    const alpha = Math.sin(life * Math.PI) * .85;
    if (cold) fleck(ctx, x, y, 1.2 + rand(i, 9) * 3, i + life * 4, i % 3 ? '#d4f7ff' : '#7ed5f0', alpha);
    else hotStroke(ctx, { x, y }, { x: x - dx / len * 7, y: y - dy / len * 7 - 3 }, 1 + rand(i, 8) * 2, i % 3 ? '#ffd56c' : '#fff3bd', alpha);
  }
}
function impact(ctx: CanvasRenderingContext2D, p: Point, t: number, cold = false) {
  if (t <= 0 || t >= 1) return;
  const burst = Math.sin(Math.min(1, t * 3) * Math.PI), spread = 1 - (1 - t) ** 3;
  bloom(ctx, p, 75 + spread * 65, cold ? ICE : FIRE, Math.max(0, burst) * .65, .85);
  for (let i = 0; i < 32; i++) {
    const angle = rand(i, 11) * TAU, radius = (30 + rand(i, 12) * 95) * spread;
    const at = { x: p.x + Math.cos(angle) * radius, y: p.y + Math.sin(angle) * radius * .7 - 27 * Math.sin(t * Math.PI) + t * t * 35 };
    const alpha = (1 - t) * (.5 + rand(i, 14) * .5);
    if (i < 10) bloom(ctx, at, 13 + t * 32, cold ? ['#d3f4ff6b', '#b2e8f85c', '#68b5dc28', '#68b5dc00'] : SMOKE, alpha * .55);
    if (cold) fleck(ctx, at.x, at.y, 2 + rand(i, 15) * 6 * (1 - t), i + t * 4, i % 2 ? '#dbfaff' : '#69b9e0', alpha);
    else {
      const prior = { x: at.x - Math.cos(angle) * (10 + 9 * (1 - t)), y: at.y - Math.sin(angle) * 8 };
      hotStroke(ctx, prior, at, 1.5 + rand(i, 17) * 2, i % 4 ? '#f8b743' : '#ffefb9', alpha);
      if (i < 8 && t < .35) tongue(ctx, p, at, 9 * (1 - t * 2), .75 * (1 - t), false);
    }
  }
}
function flameImpact(ctx: CanvasRenderingContext2D, p: Point, t: number, direction: Point) {
  if (t <= 0 || t >= 1) return;
  const onset = ease(t / .075), plume = onset * (1 - ease((t - .32) / .5));
  const spread = ease(Math.min(1, t * 2.7)), drift = Math.atan2(direction.y, direction.x);
  // Dark rolling edges give the hot centre contrast against the warm board.
  for (let i = 0; i < 11; i++) {
    const angle = drift + (rand(i, 60) - .5) * 5.5, r = (58 + rand(i, 61) * 85) * spread;
    const at = { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .75 - t * 27 };
    bloom(ctx, at, 25 + rand(i, 62) * 25 + t * 27, ['#332920b5', '#54433196', '#6b543d56', '#6b543d00'], onset * (1 - t) * .83);
  }
  // Unequal flame tongues form a local torn plume, biased along the incoming blow.
  for (let i = 0; i < 17; i++) {
    const angle = drift + (rand(i, 64) - .5) * 5.2, reach = (78 + rand(i, 65) * 100) * (.55 + spread * .45);
    const root = { x: p.x + (rand(i, 66) - .5) * 54, y: p.y + (rand(i, 67) - .5) * 39 };
    const tip = { x: p.x + Math.cos(angle) * reach, y: p.y + Math.sin(angle) * reach * .85 - rand(i, 68) * 19 };
    tongue(ctx, root, tip, 14 + rand(i, 69) * 16, plume * (.7 + rand(i, 70) * .3));
  }
  bloom(ctx, p, 86 + spread * 35, ['#fff6c8ff', '#ffd35edb', '#f6581680', '#d9370000'], plume * .8);
  for (let i = 0; i < 51; i++) {
    const angle = rand(i, 71) * TAU, reach = (55 + rand(i, 72) * 155) * (1 - (1 - t) ** 2.5);
    const at = { x: p.x + Math.cos(angle) * reach, y: p.y + Math.sin(angle) * reach * .8 + t * t * 54 - Math.sin(t * Math.PI) * 24 };
    const alpha = onset * (1 - t) * (.6 + rand(i, 73) * .4);
    if (i < 9) fleck(ctx, at.x, at.y, 3 + rand(i, 74) * 5, angle + t * 6, '#4d3626', alpha);
    else hotStroke(ctx, { x: at.x - Math.cos(angle) * (13 + rand(i, 75) * 10), y: at.y - Math.sin(angle) * 12 }, at, 1.8 + rand(i, 76) * 2.3, i % 3 ? '#ffcf57' : '#fff4b9', alpha);
  }
}
export const HEROES = new Set(['Burn', 'Freeze', 'EarthQuake']);
export function drawHero(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  const { t, travel: u, move } = event, from = scene.foot(move.from), to = scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to);
  if (t <= 0 || t >= 1) return;
  if (id === 'Burn') {
    const a = body(from), b = body(to);
    if (layer === 'under') {
      bloom(ctx, from, 76, FIRE, ease(t / .2) * (1 - ease((t - .24) / .18)) * .45, .35);
      if (t >= .62) bloom(ctx, to, 90, FIRE, (1 - ease((t - .62) / .35)) * .45, .38);
    } else {
      source(ctx, a, t);
      if (t > .22 && t < .62) trail(ctx, a, b, u, t);
      if (t >= .62) flameImpact(ctx, b, (t - .62) / .38, { x: b.x - a.x, y: b.y - a.y });
    }
  } else if (id === 'Freeze') {
    const king = [...event.before.board].findIndex(p => p && (p & 15) === 6 && (p >> 4) === event.before.turn);
    const a = body(scene.foot(king >= 0 ? king : move.from)), b = body(to);
    if (layer === 'under') {
      if (t > .53) for (let i = 0; i < 12; i++) {
        const v = clamp((t - .53) / .35), angle = i * 2.399, r = ease(v) * (30 + rand(i, 34) * 48);
        bloom(ctx, { x: to.x + Math.cos(angle) * r, y: to.y + Math.sin(angle) * r * .35 }, 15 + v * 20, ICE, Math.sin(v * Math.PI) * .12, .5);
      }
    } else {
      source(ctx, a, t, true);
      if (t > .22 && t < .62) {
        const v = ease((t - .22) / .4), mid = mix(a, b, v);
        mid.x += Math.sin(v * Math.PI) * 26;
        mid.y -= Math.sin(v * Math.PI) * 43;
        trail(ctx, a, mid, 1, t, true);
      }
      if (t >= .6) impact(ctx, b, (t - .6) / .4, true);
    }
  } else if (id === 'EarthQuake') {
    const open = ease((t - .1) / .34), fade = 1 - ease((t - .72) / .28), center = { x: from.x, y: from.y - 32 };
    if (layer === 'under') {
      // Branches tear locally into the stone. Warm seams sit within the broken dark edge.
      for (let i = 0; i < 9; i++) {
        const angle = i / 9 * TAU + rand(i, 31) * .4, length = (75 + rand(i, 32) * 100) * open;
        ctx.save(); ctx.globalAlpha = fade; ctx.beginPath(); ctx.moveTo(center.x, center.y);
        for (let j = 1; j < 6; j++) { const r = length * j / 5, turn = angle + (rand(i * 6 + j, 33) - .5) * .35; ctx.lineTo(center.x + Math.cos(turn) * r, center.y + Math.sin(turn) * r * .7); }
        ctx.strokeStyle = '#453021'; ctx.lineWidth = 4 + open * 3; ctx.lineJoin = 'bevel'; ctx.stroke(); ctx.strokeStyle = '#d8ad69'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
      }
      const wave = clamp((t - .2) / .55);
      for (let i = 0; i < 46; i++) {
        const angle = i / 46 * TAU, radius = (18 + wave * 227) * (.93 + rand(i, 35) * .12);
        const at = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * .7 };
        bloom(ctx, at, 18 + wave * 19, DUST, Math.sin(wave * Math.PI) * .65, .65);
      }
    } else {
      const throwT = clamp((t - .2) / .7);
      for (let i = 0; i < 30; i++) {
        const angle = rand(i, 38) * TAU, speed = 45 + rand(i, 39) * 135, flight = Math.sin(throwT * Math.PI);
        const x = center.x + Math.cos(angle) * speed * throwT;
        const y = center.y + Math.sin(angle) * speed * throwT * .65 - flight * (20 + rand(i, 40) * 57);
        fleck(ctx, x, y, 2 + rand(i, 41) * 6, angle + throwT * 4, i % 3 ? '#79634d' : '#c3a783', Math.sin(throwT * Math.PI) * fade);
      }
      for (const push of move.pushes ?? []) {
        const a = scene.foot(push.from), b = scene.foot(push.to), p = mix(a, b, u);
        if (t > .22 && t < .66) for (let i = 0; i < 9; i++) bloom(ctx, { x: p.x + (rand(i, 47) - .5) * 65, y: p.y - 5 - rand(i, 48) * 28 }, 17 + rand(i, 49) * 17, DUST, .35, .6);
        if (t > .62) { const h = clamp((t - .62) / .38); for (let i = 0; i < 9; i++) { const angle = i * 2.399, r = ease(h) * (25 + rand(i, 42) * 35); bloom(ctx, { x: b.x + Math.cos(angle) * r, y: b.y + Math.sin(angle) * r * .35 - 15 * Math.sin(h * Math.PI) }, 13 + h * 17, DUST, (1 - h) * .5); } }
      }
    }
  }
}
