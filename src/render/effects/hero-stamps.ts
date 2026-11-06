// Sprites for the hero cards. Each set paints once on first use; the effects only move and fade the copies.
const TAU = Math.PI * 2;
const DENSITY = 2; // Canvas pixels per scene pixel, so a stamp stays sharp on a phone.
export const rand = (i: number, seed = 0) => { const n = Math.sin(i * 127.1 + seed * 311.7 + .5) * 43758.5453; return n - Math.floor(n); };

export interface Stamp { image: HTMLCanvasElement; w: number; h: number; ax: number; ay: number }
function paint(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, ax = w / 2, ay = h / 2): Stamp {
  const image = document.createElement('canvas'); image.width = w * DENSITY; image.height = h * DENSITY;
  const g = image.getContext('2d')!; g.scale(DENSITY, DENSITY); draw(g);
  return { image, w, h, ax, ay };
}
/** Scale 1 draws the stamp at its painted scene size. (x, y) is the stamp's anchor. */
export function stamp(ctx: CanvasRenderingContext2D, s: Stamp, x: number, y: number, scale = 1, angle = 0, alpha = 1, squash = 1) {
  if (alpha <= 0 || scale <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, alpha); ctx.translate(x, y); if (squash !== 1) ctx.scale(1, squash); if (angle) ctx.rotate(angle); ctx.scale(scale, scale);
  ctx.drawImage(s.image, -s.ax, -s.ay, s.w, s.h); ctx.restore();
}

function lobe(g: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, clear: string, solid = .62) {
  const f = g.createRadialGradient(x, y, 0, x, y, r);
  f.addColorStop(0, colour); f.addColorStop(solid, colour); f.addColorStop(1, clear);
  g.fillStyle = f; g.fillRect(x - r, y - r, r * 2, r * 2);
}
/** A lumpy ball with volume: a dark underside, a body, and a lit crown toward the upper left. */
function puff(size: number, seed: number, layers: { colour: string; clear: string; count: number; spread: number; r: number; lift: number; solid?: number }[]) {
  return paint(size, size, g => {
    const c = size / 2, R = size / 2;
    layers.forEach((layer, l) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = rand(i, seed + l * 7) * TAU, reach = Math.sqrt(rand(i, seed + l * 7 + 1)) * layer.spread * R;
        lobe(g, c + Math.cos(angle) * reach - layer.lift * R * .6, c + Math.sin(angle) * reach - layer.lift * R, (layer.r + rand(i, seed + l * 7 + 2) * .12) * R, layer.colour, layer.clear, layer.solid);
      }
    });
  });
}
function glow(size: number, stops: [number, string][]) {
  return paint(size, size, g => {
    const f = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [at, colour] of stops) f.addColorStop(at, colour);
    g.fillStyle = f; g.fillRect(0, 0, size, size);
  });
}

function rock(seed: number, light: string, body: string, dark: string) {
  return paint(40, 40, g => {
    const n = 7, xs: number[] = [], ys: number[] = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(i, seed) * .35, r = 11 + rand(i, seed + 1) * 7; xs.push(20 + Math.cos(a) * r); ys.push(20 + Math.sin(a) * r * .86); }
    const loop = () => { g.beginPath(); xs.forEach((x, i) => i ? g.lineTo(x, ys[i]) : g.moveTo(x, ys[i])); g.closePath(); };
    loop(); g.fillStyle = dark; g.fill(); g.lineJoin = 'round'; g.lineWidth = 2; g.strokeStyle = '#1b110a'; g.stroke();
    g.save(); loop(); g.clip();
    g.fillStyle = body; g.beginPath(); g.moveTo(0, 32); g.lineTo(26, 25); g.lineTo(40, 13); g.lineTo(40, 0); g.lineTo(0, 0); g.fill();
    g.fillStyle = light; g.beginPath(); g.moveTo(0, 21); g.lineTo(19, 16); g.lineTo(27, 0); g.lineTo(0, 0); g.fill();
    g.restore();
  });
}
export interface QuakeStamps { rocks: Stamp[]; dust: Stamp[]; soft: Stamp }
let quakeSet: QuakeStamps | undefined;
export const quakeStamps = () => quakeSet ??= {
  rocks: [rock(2, '#d8c29c', '#9c8567', '#54432f'), rock(8, '#8c735a', '#5f4b39', '#2e2117'), rock(14, '#ece0c4', '#bda986', '#6d5a42'), rock(20, '#7a644f', '#4c3b2d', '#241a12'), rock(26, '#c6ad88', '#857052', '#463725')],
  dust: [9, 21, 33].map(seed => puff(120, seed, [
    { colour: '#7d6a50b0', clear: '#7d6a5000', count: 16, spread: .46, r: .44, lift: 0, solid: .2 },
    { colour: '#927e62b0', clear: '#927e6200', count: 12, spread: .36, r: .38, lift: .04, solid: .2 },
    { colour: '#a8957ab0', clear: '#a8957a00', count: 6, spread: .24, r: .3, lift: .1, solid: .1 },
  ])),
  soft: glow(40, [[0, '#120a05aa'], [.6, '#120a0566'], [1, '#120a0500']]),
};

function shard(seed: number) {
  return paint(40, 40, g => {
    const long = 15 + rand(0, seed) * 4, wide = 5 + rand(1, seed) * 3, skew = (rand(2, seed) - .5) * 5;
    g.translate(20, 20);
    g.beginPath(); g.moveTo(0, -long); g.lineTo(wide, skew); g.lineTo(0, long * .8); g.lineTo(-wide, skew); g.closePath();
    g.fillStyle = '#2f83c4'; g.lineWidth = 2; g.strokeStyle = '#2470ad'; g.lineJoin = 'round'; g.stroke(); g.fill();
    g.beginPath(); g.moveTo(0, -long); g.lineTo(-wide, skew); g.lineTo(0, long * .8); g.closePath(); g.fillStyle = '#f2feff'; g.fill();
    g.beginPath(); g.moveTo(0, -long); g.lineTo(wide, skew); g.lineTo(0, long * .8); g.closePath(); g.fillStyle = '#8ad3f4'; g.fill();
  });
}
export interface FrostStamps { shards: Stamp[]; mist: Stamp[]; cold: Stamp; pool: Stamp }
let frostSet: FrostStamps | undefined;
export const frostStamps = () => frostSet ??= {
  shards: [4, 10, 16, 22].map(shard),
  mist: [6, 18, 30].map(seed => puff(110, seed, [
    { colour: '#74bde6a8', clear: '#74bde600', count: 14, spread: .5, r: .4, lift: -.02, solid: .12 },
    { colour: '#b5e4f8b0', clear: '#b5e4f800', count: 10, spread: .38, r: .34, lift: .04, solid: .12 },
    { colour: '#f3fdffb8', clear: '#f3fdff00', count: 6, spread: .26, r: .26, lift: .1, solid: .08 },
  ])),
  cold: glow(160, [[0, '#ffffff'], [.22, '#e2fbfff0'], [.5, '#8bdcfaa8'], [.78, '#3fa6ea40'], [1, '#3fa6ea00']]),
  pool: glow(160, [[0, '#d9f7ffd8'], [.5, '#7fd0f4a0'], [.8, '#2f8fd850'], [1, '#2f8fd800']]),
};
