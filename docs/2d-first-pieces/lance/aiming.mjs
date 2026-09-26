import { clamp, rotate, paintTriangle } from '../painted-mesh.mjs';
export const MIN_ANGLE = -20 * Math.PI / 180;
export const MAX_ANGLE = 24 * Math.PI / 180;
export const THRUST = 46;
export const FIGURE_Y = 28;
export const FIGURE_X = 38;
// The generated figures have a clear alpha gutter at x=762, not exactly x=768.
export const armies = [
  { cell: [0, 0, 762, 1024], pivot: { x: 392, y: 493 }, tip: { x: 761, y: 449 }, baseAngle: Math.atan2(-24, 200), dx: 0, dy: 0 },
  { cell: [762, 0, 774, 1024], pivot: { x: 342, y: 503 }, tip: { x: 734, y: 460 }, baseAngle: Math.atan2(-20, 200), dx: -50, dy: 10 }
];
const origin = side => ({ x: FIGURE_X - armies[side].dx, y: FIGURE_Y - armies[side].dy });
export function tipAt(angle, side = 0, extension = 0) {
  const army = armies[side], p = rotate(army.tip, angle - army.baseAngle, army.pivot);
  return { x: p.x + origin(side).x + extension * Math.cos(angle), y: p.y + origin(side).y + extension * Math.sin(angle) };
}
export function targetPoint(angle, side = 0) { return tipAt(angle, side, THRUST); }
export function aimAt(x, y, side = 0) {
  const army = armies[side], p = army.pivot;
  const neutralTip = rotate(army.tip, -army.baseAngle, p), offset = neutralTip.y - p.y;
  const dx = x - p.x - origin(side).x, dy = y - p.y - origin(side).y, r = Math.max(1, Math.hypot(dx, dy));
  return clamp(Math.atan2(dy, dx) - Math.asin(clamp(offset / r, -1, 1)), MIN_ANGLE, MAX_ANGLE);
}
// A brief wind-up, forward jab, contact, and controlled recovery.
const smooth = x => x * x * (3 - 2 * x);
export function thrustAt(progress) {
  if (progress <= 0 || progress >= 1) return 0;
  if (progress < .22) return -.16 * smooth(progress / .22);
  if (progress < .45) return -.16 + 1.16 * smooth((progress - .22) / .23);
  if (progress < .52) return 1;
  return 1 - smooth((progress - .52) / .48);
}

const columns = [332, 354, 375, 400, 434, 460, 535, 800];
// The pauldron/neck edge is fixed; the gauntlet, shaft and point are rigid.
const rows = [[415, 435, 535], [443, 415, 475], [468, 364, 434], [498, 350, 434], [530, 355, 445], [555, 393, 475], [580, 410, 495]];
const sourcePoints = rows.flatMap(([y, fixed, rigid]) => columns.map(x => ({ x, y, weight: clamp((x - fixed) / (rigid - fixed), 0, 1) })));
const triangles = [];
for (let row = 0; row < rows.length - 1; row++) for (let col = 0; col < columns.length - 1; col++) {
  const i = row * columns.length + col;
  triangles.push([i, i + 1, i + columns.length], [i + 1, i + columns.length + 1, i + columns.length]);
}
export function shoulderMesh(angle, side = 0) {
  const army = armies[side], source = sourcePoints.map(p => ({ x: p.x + army.dx, y: p.y + army.dy }));
  const destination = source.map((p, i) => rotate(p, (angle - army.baseAngle) * sourcePoints[i].weight, army.pivot));
  return { source, destination, triangles };
}
// Shift the upper body into the thrust; taper through the stance to planted boots.
export function weightShift(point, angle, extension) {
  const weight = clamp((805 - point.y) / 190, 0, 1);
  return { x: point.x + extension * Math.cos(angle) * weight, y: point.y + extension * Math.sin(angle) * weight };
}
const buffers = new WeakMap();
export function drawPawn(canvas, image, side, angle, extension = 0) {
  let buffer = buffers.get(canvas);
  if (!buffer) { buffer = document.createElement('canvas'); buffer.width = 960; buffer.height = 1024; buffers.set(canvas, buffer); }
  const army = armies[side], [sx, sy, width, height] = army.cell, left = 332 + army.dx, top = 415 + army.dy;
  const ctx = buffer.getContext('2d'); ctx.clearRect(0, 0, buffer.width, buffer.height);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.rect(left, top, width - left, 165); ctx.clip('evenodd');
  ctx.drawImage(image, sx, sy, width, height, 0, 0, width, height); ctx.restore();
  const out = canvas.getContext('2d'); out.clearRect(0, 0, canvas.width, canvas.height); out.save(); out.translate(origin(side).x, origin(side).y);
  if (Math.abs(extension) < .001) out.drawImage(buffer, 0, 0);
  else {
    const bands = [0, 615, 650, 720, 805, 1024];
    for (let i = 0; i < bands.length - 1; i++) {
      const p = [{ x: 0, y: bands[i] }, { x: 960, y: bands[i] }, { x: 0, y: bands[i + 1] }, { x: 960, y: bands[i + 1] }];
      for (const ids of [[0, 1, 2], [1, 3, 2]]) {
        const src = ids.map(i => p[i]); paintTriangle(out, buffer, src, src.map(p => weightShift(p, angle, extension)), [0, 0, 960, 1024]);
      }
    }
  }
  // Apply the thrust to the entire arm as one translation, even when its tip is low.
  // Warping the already-aimed lance by height would bend the shaft during a low jab.
  const mesh = shoulderMesh(angle, side);
  const moving = mesh.destination.map(p => ({ x: p.x + extension * Math.cos(angle), y: p.y + extension * Math.sin(angle) }));
  for (const ids of mesh.triangles) paintTriangle(out, image, ids.map(i => mesh.source[i]), ids.map(i => moving[i]), army.cell);
  out.restore();
}
