// A small painted mesh at the shoulder; the forearm, hand and bow rotate rigidly.
// All coordinates refer to the original 768 × 1024 army cell.
export const MIN_ANGLE = -22 * Math.PI / 180;
export const MAX_ANGLE = 30 * Math.PI / 180;
export const FIGURE_Y = 96;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const armyOffset = side => side ? -7 : 0;
export const pivot = side => ({ x: 393 + armyOffset(side), y: 226 });
export function rotate(point, angle, centre) {
  const x = point.x - centre.x, y = point.y - centre.y;
  return { x: centre.x + x * Math.cos(angle) - y * Math.sin(angle), y: centre.y + x * Math.sin(angle) + y * Math.cos(angle) };
}
export function muzzle(angle, side = 0) {
  const p = rotate({ x: 754 + armyOffset(side), y: 216 }, angle, pivot(side));
  return { x: p.x, y: p.y + FIGURE_Y };
}
export function targetPoint(angle, reach, side = 0) {
  const p = muzzle(angle, side);
  return { x: p.x + Math.cos(angle) * reach, y: p.y + Math.sin(angle) * reach };
}
export function aimAt(x, y, side = 0) {
  const p = pivot(side), dx = x - p.x, dy = y - FIGURE_Y - p.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  // The painted bolt axis is 10 px above the shoulder, not through its centre.
  return {
    angle: clamp(Math.atan2(dy, dx) + Math.asin(Math.min(1, 10 / distance)), MIN_ANGLE, MAX_ANGLE),
    reach: clamp(Math.sqrt(Math.max(0, distance * distance - 100)) - 361, 120, 330)
  };
}

const columns = [350, 365, 390, 415, 445, 480, 550, 768];
// The unmoving edge follows the hood, braid and bodice around the shoulder.
const rows = [[145, 415, 550], [185, 395, 480], [205, 368, 445], [235, 366, 445], [260, 386, 455], [280, 410, 500], [310, 430, 520]];
const points = rows.flatMap(([y, fixedEdge, rigidEdge]) => columns.map(x => ({ x, y, weight: clamp((x - fixedEdge) / (rigidEdge - fixedEdge), 0, 1) })));
const triangles = [];
for (let row = 0; row < rows.length - 1; row++) {
  for (let col = 0; col < columns.length - 1; col++) {
    const i = row * columns.length + col;
    triangles.push([i, i + 1, i + columns.length], [i + 1, i + columns.length + 1, i + columns.length]);
  }
}
export function shoulderMesh(angle, side = 0) {
  const offset = armyOffset(side), centre = pivot(side);
  const source = points.map(p => ({ x: p.x + offset, y: p.y }));
  const destination = points.map((p, i) => rotate(source[i], angle * p.weight, centre));
  return { source, destination, triangles };
}

function paintTriangle(ctx, image, source, destination, side) {
  const [s0, s1, s2] = source, [d0, d1, d2] = destination;
  const ux = s1.x - s0.x, uy = s1.y - s0.y, vx = s2.x - s0.x, vy = s2.y - s0.y;
  const det = ux * vy - uy * vx;
  const a = ((d1.x - d0.x) * vy - (d2.x - d0.x) * uy) / det;
  const b = ((d1.y - d0.y) * vy - (d2.y - d0.y) * uy) / det;
  const c = ((d2.x - d0.x) * ux - (d1.x - d0.x) * vx) / det;
  const d = ((d2.y - d0.y) * ux - (d1.y - d0.y) * vx) / det;
  ctx.save();
  // Subpixel overlap closes rasterization cracks between adjacent triangles.
  const centre = { x: (d0.x + d1.x + d2.x) / 3, y: (d0.y + d1.y + d2.y) / 3 };
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const p = destination[i], length = Math.hypot(p.x - centre.x, p.y - centre.y);
    const x = p.x + (p.x - centre.x) / length * .45, y = p.y + (p.y - centre.y) / length * .45;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, d0.x - a * s0.x - c * s0.y, d0.y - b * s0.x - d * s0.y);
  ctx.drawImage(image, side * 768, 0, 768, 1024, 0, 0, 768, 1024);
  ctx.restore();
}

export function drawArcher(canvas, image, side, angle) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.translate(0, FIGURE_Y);
  if (Math.abs(angle) < .00001) {
    ctx.drawImage(image, side * 768, 0, 768, 1024, 0, 0, 768, 1024);
  } else {
    const left = 350 + armyOffset(side);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 768, 1024); ctx.rect(left, 145, 768 - left, 165); ctx.clip('evenodd');
    ctx.drawImage(image, side * 768, 0, 768, 1024, 0, 0, 768, 1024); ctx.restore();
    const mesh = shoulderMesh(angle, side);
    for (const indices of mesh.triangles) paintTriangle(ctx, image, indices.map(i => mesh.source[i]), indices.map(i => mesh.destination[i]), side);
  }
  ctx.restore();
}
