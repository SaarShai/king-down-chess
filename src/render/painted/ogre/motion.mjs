import { clamp, paintTriangle } from '../painted-mesh.mjs';
export const PUSH = 65;
export const ORIGIN = { x: 100, y: 20 };
export const ANCHOR = { x: 450, y: 936 };
export const HIT = { x: 510, y: 490 };
const smooth = t => t * t * (3 - 2 * t);
// Both palms, wrists, elbows and shoulders translate together, without changing proportions.
// The weight shift tapers through the legs to completely fixed toes and heels.
export function shift(point, extension) {
  const weight = smooth(clamp((875 - point.y) / 245, 0, 1));
  return { x: point.x + extension * weight, y: point.y - extension * .10 * weight };
}
export function pushAt(t) {
  if (t <= 0 || t >= 1) return 0;
  if (t < .22) return -.17 * smooth(t / .22);
  if (t < .48) return -.17 + 1.17 * smooth((t - .22) / .26);
  if (t < .84) return 1;
  return 1 - smooth((t - .84) / .16);
}
export function palmAt(side = 0, extension = 0) {
  const p = shift({ x: side ? 746 : 748, y: 410 }, extension);
  return { x: p.x + ORIGIN.x, y: p.y + ORIGIN.y };
}
const bands = [0, 630, 680, 730, 780, 830, 875, 1024];
export function drawOgre(canvas, image, side, extension = 0) {
  const ctx = canvas.getContext('2d'), cell = [side * 768, 0, 768, 1024];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.translate(ORIGIN.x, ORIGIN.y);
  if (Math.abs(extension) < .001) ctx.drawImage(image, ...cell, 0, 0, 768, 1024);
  else for (let i = 0; i < bands.length - 1; i++) {
    const corners = [{x:0,y:bands[i]}, {x:768,y:bands[i]}, {x:0,y:bands[i+1]}, {x:768,y:bands[i+1]}];
    for (const indices of [[0,1,2],[1,3,2]]) {
      const source = indices.map(n => corners[n]);
      paintTriangle(ctx, image, source, source.map(p => shift(p, extension)), cell);
    }
  }
  ctx.restore();
}
