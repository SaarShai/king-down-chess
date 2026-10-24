import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';

// Local spell material. The caller owns the figures, board state and persistent wards.
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
const hash = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };
const mix = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const body = (p: Point) => ({ x: p.x, y: p.y - 69 });
const life = (t: number, start: number, end: number) => Math.sin(clamp((t - start) / (end - start)) * Math.PI);
const GOLD = ['#fff5cced', '#ffe39ab3', '#e5a9444d', '#d5943000'];
const ROSE = ['#ffdfefe6', '#e99bc49c', '#a4469148', '#84337400'];
const LILAC = ['#f5e6ffe8', '#cbb3f8ad', '#9461c44d', '#7c3dae00'];
const TEAL = ['#e9fff9eb', '#89dfd1ad', '#379e9a4d', '#247c7e00'];
const ICE = ['#f6ffffed', '#b6eeffb0', '#6bbbd950', '#4c99bd00'];
const FIRE = ['#fff2bcdf', '#ffcb6d9c', '#e86a2c52', '#c4421700'];
const INK = ['#382e46ae', '#51405e8a', '#70557a42', '#765a8200'];

function bloom(ctx: CanvasRenderingContext2D, p: Point, radius: number, colours: string[], opacity: number, flat = 1) {
  if (opacity <= 0 || radius <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.scale(1, flat);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  [0, .24, .65, 1].forEach((stop, i) => gradient.addColorStop(stop, colours[i]));
  ctx.fillStyle = gradient; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
}
function mote(ctx: CanvasRenderingContext2D, p: Point, size: number, colour: string, opacity: number, angle = 0, stretch = 1.7) {
  if (opacity <= 0 || size <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.fillStyle = colour;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, size, size * stretch, angle, 0, TAU); ctx.fill(); ctx.restore();
}
function petal(ctx: CanvasRenderingContext2D, p: Point, size: number, angle: number, colour: string, opacity: number) {
  if (opacity <= 0 || size <= 0) return;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size, 0); ctx.bezierCurveTo(-size * .4, -size * .8, size * .7, -size * .55, size, 0);
  ctx.bezierCurveTo(size * .5, size * .2, -size * .3, size * .75, -size, 0);
  ctx.fillStyle = colour; ctx.fill(); ctx.restore();
}
// Filled, tapered curls give the mist a torn edge without a stroked route.
function wisp(ctx: CanvasRenderingContext2D, root: Point, tip: Point, width: number, bend: number, colours: string[], opacity: number) {
  if (opacity <= 0) return;
  const dx = tip.x - root.x, dy = tip.y - root.y, length = Math.hypot(dx, dy) || 1, nx = -dy / length, ny = dx / length;
  ctx.save(); ctx.globalAlpha *= opacity;
  ctx.beginPath(); ctx.moveTo(root.x - nx * width, root.y - ny * width);
  ctx.bezierCurveTo(root.x + dx * .2 + nx * bend, root.y + dy * .2 + ny * bend, tip.x - dx * .42 + nx * (bend + width), tip.y - dy * .42 + ny * (bend + width), tip.x, tip.y);
  ctx.bezierCurveTo(tip.x - dx * .3 + nx * bend, tip.y - dy * .3 + ny * bend, root.x + dx * .3 + nx * (bend - width), root.y + dy * .3 + ny * (bend - width), root.x + nx * width, root.y + ny * width);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  gradient.addColorStop(0, colours[3]); gradient.addColorStop(.25, colours[2]); gradient.addColorStop(.53, colours[1]); gradient.addColorStop(.74, colours[0]); gradient.addColorStop(.88, colours[1]); gradient.addColorStop(1, colours[3]);
  ctx.fillStyle = gradient; ctx.fill(); ctx.restore();
}
function ground(ctx: CanvasRenderingContext2D, p: Point, t: number, colours: string[], seed: number, spread = 1) {
  const amount = life(t, .03, .96);
  bloom(ctx, p, 83 * spread, colours, amount * .43, .32);
  for (let i = 0; i < 17; i++) {
    const angle = i * 2.399, radius = (18 + hash(i, seed) * 47) * spread;
    const at = { x: p.x + Math.cos(angle + t * .55) * radius, y: p.y + Math.sin(angle + t * .55) * radius * .29 };
    petal(ctx, at, 1.5 + hash(i, seed + 1) * 3, angle + t, colours[i % 2], amount * .4);
  }
}
function spray(ctx: CanvasRenderingContext2D, p: Point, t: number, colours: string[], seed: number, count = 30, reach = 100, falling = false) {
  if (t <= 0 || t >= 1) return;
  const expand = 1 - (1 - t) ** 2, opacity = (1 - t) * ease(t / .09);
  for (let i = 0; i < count; i++) {
    const angle = hash(i, seed) * TAU, distance = (18 + hash(i, seed + 1) * reach) * expand;
    const at = { x: p.x + Math.cos(angle) * distance, y: p.y + Math.sin(angle) * distance * .6 - Math.sin(t * Math.PI) * 28 + (falling ? t * t * 80 : 0) };
    petal(ctx, at, 2 + hash(i, seed + 2) * 5, angle + t * (i % 2 ? 5 : -4), colours[i % 2], opacity * (.4 + hash(i, seed + 3) * .6));
  }
}
function kingFoot(scene: PaintedScene, event: CardFrame) {
  const sq = event.before.board.findIndex(p => !!p && (p & 15) === 6 && (p >> 4) === event.before.turn);
  return scene.foot(sq >= 0 ? sq : event.move.from);
}
function exchange(ctx: CanvasRenderingContext2D, p: Point, id: string, t: number, layer: CardLayer) {
  const sacrifice = id === 'Sacrifice', salvation = id === 'Salvation', colours = sacrifice ? ROSE : salvation ? GOLD : LILAC;
  if (layer === 'under') { ground(ctx, p, t, colours, 12); return; }
  const active = life(t, .08, .87), rise = ease((t - .12) / .54);
  if (sacrifice) {
    // The departing rose essence rises; warm fragments settle with the returned queen.
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? -1 : 1, x = side * (15 + hash(i, 4) * 33), h = (90 + hash(i, 6) * 90) * rise;
      wisp(ctx, { x: p.x + x, y: p.y - 14 }, { x: p.x + x * .3 + Math.sin(t * 10 + i) * 22, y: p.y - h }, 10 + hash(i, 7) * 13, side * 32, ROSE, active * .72);
    }
    for (let i = 0; i < 38; i++) {
      const v = clamp((t - hash(i, 10) * .3) / .65), angle = i * 2.399 + v * 3;
      const at = { x: p.x + Math.cos(angle) * (21 + v * 30), y: p.y - 13 - v * (125 + hash(i, 11) * 65) };
      petal(ctx, at, 2 + hash(i, 12) * 4, angle, ROSE[i % 2], Math.sin(v * Math.PI) * .8);
    }
    spray(ctx, { x: p.x, y: p.y - 78 }, (t - .54) / .46, GOLD, 33, 32, 75, true);
  } else if (salvation) {
    bloom(ctx, { x: p.x, y: p.y - 49 }, 74, GOLD, active * .3, 1.25);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? -1 : 1, x = side * (26 + i * 4);
      wisp(ctx, { x: p.x + x, y: p.y + 4 }, { x: p.x + x * .45, y: p.y - (105 + hash(i, 13) * 46) * rise }, 9, side * 18, GOLD, active * .6);
    }
    for (let i = 0; i < 49; i++) {
      const v = clamp((t - hash(i, 14) * .25) / .63), angle = i * 2.399 + v * 2.6, r = (20 + hash(i, 15) * 50) * (1 - v * .5);
      const at = { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * 12 - v * (85 + hash(i, 16) * 83) };
      petal(ctx, at, 2 + hash(i, 17) * 5, angle - v * 3, i % 3 ? '#ffe6a5' : '#fff7dc', Math.sin(v * Math.PI) * .85);
    }
    spray(ctx, { x: p.x, y: p.y - 77 }, (t - .57) / .43, GOLD, 20, 22, 64, true);
  } else {
    // Short overlapping curls make a moving silk-like cocoon; no figure is deformed.
    bloom(ctx, { x: p.x, y: p.y - 66 }, 76, LILAC, active * .3);
    for (let i = 0; i < 20; i++) {
      const angle = i * 2.399 + t * 12, height = 22 + (i % 5) * 21, radius = 36 + Math.sin(t * Math.PI) * 20;
      const root = { x: p.x + Math.cos(angle) * radius, y: p.y - height + Math.sin(angle) * 15 };
      const tip = { x: p.x + Math.cos(angle + .9) * radius, y: p.y - height + Math.sin(angle + .9) * 15 - 12 };
      wisp(ctx, root, tip, 7 + hash(i, 21) * 6, 8, i % 4 ? LILAC : TEAL, active * (.35 + .35 * Math.sin(angle) ** 2));
    }
    spray(ctx, { x: p.x, y: p.y - 62 }, (t - .54) / .46, LILAC, 24, 38, 100);
  }
}
function borrow(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  const { t, travel, move } = event, from = scene.foot(move.from), to = scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), current = mix(from, to, travel), mimic = id === 'Mimic';
  const lender = body(scene.foot(event.lender ?? move.from)), receiver = body(from), colours = mimic ? ICE : TEAL;
  if (layer === 'under') {
    ground(ctx, t < .22 ? from : current, t, colours, mimic ? 41 : 42, .8);
    if (t < .3 && event.lender !== undefined) bloom(ctx, scene.foot(event.lender), 64, colours, life(t, .01, .3) * .35, .32);
    return;
  }
  const take = ease((t - .02) / .2), gathering = life(t, .01, .27);
  for (let i = 0; i < 26; i++) {
    const v = clamp(take - hash(i, 31) * .19), at = mix(lender, receiver, v);
    at.x += Math.sin(v * Math.PI) * (hash(i, 32) - .5) * 39;
    at.y -= Math.sin(v * Math.PI) * (29 + hash(i, 33) * 38);
    if (mimic) {
      petal(ctx, at, 5 + hash(i, 34) * 6, i + t * 4, '#d6eee6', gathering * .9);
      mote(ctx, { x: at.x + 9, y: at.y - 5 }, 2.3, '#fff3d3', gathering * .85);
    } else {
      bloom(ctx, at, 16 + hash(i, 35) * 14, TEAL, gathering * .24);
      mote(ctx, at, 2.5 + hash(i, 36) * 2, '#b1f7e6', gathering * .9, -v);
    }
  }
  if (t > .22 && t < .67) {
    const amount = ease((t - .22) / .05) * (1 - ease((t - .58) / .09));
    bloom(ctx, body(current), 58, colours, amount * .22, 1.1);
    for (let i = 0; i < 20; i++) {
      const age = hash(i, 37), at = mix(from, to, Math.max(0, travel - age * .13));
      at.x += (hash(i, 38) - .5) * (30 + age * 38); at.y -= 21 + hash(i, 39) * 79;
      if (mimic) petal(ctx, at, 5 + age * 8, i + t * 4, i % 2 ? '#b9ded7' : '#efe8bf', amount * (1 - age) * .9);
      else wisp(ctx, at, { x: at.x + Math.sin(i + t * 11) * 19, y: at.y - 38 - age * 22 }, 9, 16, TEAL, amount * (1 - age) * .8);
    }
  }
  if (t >= .62) spray(ctx, body(to), (t - .62) / .38, colours, 40, mimic ? 16 : 38, mimic ? 50 : 100);
}
function curse(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  const { t, travel, move } = event, p = mix(scene.foot(move.from), scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), travel), amount = life(t, .015, .97);
  if (layer === 'under') {
    bloom(ctx, p, 80, INK, amount * .8, .3);
    for (let i = 0; i < 8; i++) {
      const angle = i * 2.399 + t * 3, r = 19 + hash(i, 50) * 38;
      bloom(ctx, { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .3 }, 24, INK, amount * .25, .4);
    }
    return;
  }
  for (let i = 0; i < 17; i++) {
    const angle = i * 2.399 + t * 4, side = Math.cos(angle), rise = (t * 1.3 + hash(i, 51)) % 1;
    const at = { x: p.x + side * (29 + rise * 27), y: p.y - 6 - rise * 112 };
    bloom(ctx, at, 18 + rise * 12, INK, amount * Math.sin(rise * Math.PI) * .48);
    wisp(ctx, { x: at.x, y: at.y + 17 }, { x: at.x - side * 18, y: at.y - 35 }, 8, side * 24, LILAC, amount * .38);
  }
  for (let i = 0; i < 30; i++) {
    const rise = (t * .9 + hash(i, 53)) % 1, angle = i * 2.399 + t * 5;
    const at = { x: p.x + Math.cos(angle) * (36 + rise * 20), y: p.y - rise * 110 + Math.sin(angle) * 8 };
    petal(ctx, at, 1.7 + hash(i, 54) * 2.5, angle, i % 4 ? '#56405f' : '#c59bd7', amount * Math.sin(rise * Math.PI) * .8);
  }
}
function iceWall(ctx: CanvasRenderingContext2D, p: Point, t: number, layer: CardLayer) {
  if (layer === 'under') {
    ground(ctx, p, t, ICE, 61, 1.15);
    for (let i = 0; i < 10; i++) {
      const angle = i * 2.399, r = 72 * (1 - ease(t / .6)) + 25;
      bloom(ctx, { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * .3 }, 24, ICE, life(t, .05, .8) * .24, .45);
    }
    return;
  }
  const amount = life(t, .06, .94);
  for (let i = 0; i < 32; i++) {
    const v = clamp((t - hash(i, 62) * .2) / .65), angle = i * 2.399 + v * .7, radius = 58 + Math.sin(v * Math.PI) * 20;
    const at = { x: p.x + Math.cos(angle) * radius, y: p.y + Math.sin(angle) * 18 - Math.sin(v * Math.PI) * (45 + hash(i, 63) * 85) };
    petal(ctx, at, 2 + hash(i, 64) * 4, angle + v * 3, i % 2 ? '#e3fbff' : '#91cce1', Math.sin(v * Math.PI) * .8);
    if (i < 7) wisp(ctx, { x: at.x, y: at.y + 22 }, { x: at.x + Math.sin(angle) * 21, y: at.y - 25 }, 9, 13, ICE, amount * .36);
  }
}
function firewall(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  const { t, move, travel } = event;
  const squares = event.index === 0 ? [...event.before.board.keys()].filter(sq => event.before.board[sq] && (event.before.board[sq] >> 4) === event.before.turn) : [move.from];
  for (const sq of squares) {
    const p = event.index === 0 ? scene.foot(sq) : mix(scene.foot(move.from), scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), travel);
    const onset = ease((t - .05 - hash(sq, 70) * .08) / .23), fade = 1 - ease((t - .55) / .45), amount = onset * fade;
    if (layer === 'under') { bloom(ctx, p, 81, FIRE, amount * .46, .35); continue; }
    // Only the outer edge throws embers. The shared material supplies the protective flames.
    for (let i = 0; i < 14; i++) {
      const rise = clamp((t - hash(i, sq) * .18) / .8), side = i % 2 ? -1 : 1;
      const at = { x: p.x + side * (44 + hash(i, 72) * 22) + Math.sin(rise * 7 + i) * 5, y: p.y + 4 - rise * (51 + hash(i, 73) * 78) };
      mote(ctx, at, 1.3 + hash(i, 74) * 1.8, i % 3 ? '#ffc353' : '#fff2ae', amount * Math.sin(rise * Math.PI), side * .2, 2);
    }
  }
}
function glass(ctx: CanvasRenderingContext2D, p: Point, size: number, angle: number, opacity: number) {
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(p.x, p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-size * .75, -size * .65); ctx.lineTo(size * .3, -size); ctx.lineTo(size * .7, size * .7); ctx.lineTo(-size * .35, size); ctx.closePath();
  const gradient = ctx.createLinearGradient(-size, 0, size, 0);
  gradient.addColorStop(0, '#9989c953'); gradient.addColorStop(.34, '#f2ffffbc'); gradient.addColorStop(.48, '#b8e6f42e'); gradient.addColorStop(.8, '#b1a6eb9c'); gradient.addColorStop(1, '#fff2ffbd');
  ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-size * .75, -size * .65); ctx.lineTo(size * .3, -size); ctx.lineTo(-size * .1, size * .55); ctx.closePath(); ctx.fillStyle = '#f5ffff8c'; ctx.fill(); ctx.restore();
}
function mirror(ctx: CanvasRenderingContext2D, scene: PaintedScene, event: CardFrame, layer: CardLayer) {
  if (event.index > 0) return;
  const { t, move } = event, foot = kingFoot(scene, event), from = body(foot), target = body(scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to));
  if (layer === 'under') {
    if (t < .45) ground(ctx, foot, t * 2, LILAC, 81, .85);
    if (t > .56) bloom(ctx, scene.foot(move.from === move.to && move.captures.length ? move.captures.at(-1)! : move.to), 86, ICE, life(t, .56, 1) * .35, .32);
    return;
  }
  const open = life(t, .02, .58);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.399 + t * 1.5, radius = 36 + hash(i, 80) * 25;
    glass(ctx, { x: from.x + Math.cos(angle) * radius, y: from.y - 14 + Math.sin(angle) * radius * .8 }, 10 + hash(i, 81) * 13, angle * .3 + t, open * .82);
  }
  if (t > .2 && t < .65) {
    const u = ease((t - .2) / .42), amount = ease((t - .2) / .045) * (1 - ease((t - .6) / .05));
    for (const side of [-1, 1]) for (let i = 0; i < 21; i++) {
      const age = i / 21, v = clamp(u - age * .16), at = mix(from, target, v);
      at.x += side * Math.sin(v * Math.PI) * 29 + Math.sin(i * 2.4 + t * 20) * age * 6;
      at.y -= Math.sin(v * Math.PI) * (52 + side * 9);
      bloom(ctx, at, 11 + (1 - age) * 9, side < 0 ? LILAC : ICE, amount * (1 - age) * .22);
      if (i % 3 === 0) petal(ctx, at, 2 + (1 - age) * 3, i + t * 5, side < 0 ? '#d8c8fa' : '#d7f7ff', amount * (1 - age) * .9);
    }
  }
  if (t > .6) spray(ctx, target, (t - .6) / .4, ICE, 83, 40, 91);
}

export const SPELL_IDS = new Set(['Sacrifice', 'Salvation', 'MorphP', 'Control', 'Mimic', 'Curse', 'IceWall', 'Firewall', 'MirrorB']);
export const SPELL_DURATIONS: Record<string, number> = { Sacrifice: 1850, Salvation: 1800, MorphP: 1750, Control: 1700, Mimic: 1700, Curse: 1700, IceWall: 1800, Firewall: 2600, MirrorB: 2600 };
export function drawSpell(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  if (event.t <= 0 || event.t >= 1 || !SPELL_IDS.has(id)) return;
  if (['Sacrifice', 'Salvation', 'MorphP'].includes(id)) exchange(ctx, scene.foot(event.move.to), id, event.t, layer);
  else if (id === 'Control' || id === 'Mimic') borrow(ctx, scene, id, event, layer);
  else if (id === 'Curse') curse(ctx, scene, event, layer);
  else if (id === 'IceWall') iceWall(ctx, scene.foot(event.move.to), event.t, layer);
  else if (id === 'Firewall') firewall(ctx, scene, event, layer);
  else if (id === 'MirrorB') mirror(ctx, scene, event, layer);
}
