// Shared affine texture drawing for the two painted aiming studies.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function rotate(point, angle, centre) {
  const x = point.x - centre.x, y = point.y - centre.y;
  return { x: centre.x + x * Math.cos(angle) - y * Math.sin(angle), y: centre.y + x * Math.sin(angle) + y * Math.cos(angle) };
}
export function paintTriangle(ctx, image, source, destination, cell) {
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
  const [sx, sy, width, height] = cell;
  ctx.drawImage(image, sx, sy, width, height, 0, 0, width, height);
  ctx.restore();
}

