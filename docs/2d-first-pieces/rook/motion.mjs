export const DURATION = 1100;
export const SHIFT = 18;
// Local canvas coordinates for a centered 768 × 1024 source cell in a 1152 canvas.
export const ANCHOR = { x: 576, y: 978 };
// Incoming attacks resolve against the torso, rather than the leading fist.
export const HIT = { x: 576, y: 505 };

const smooth = t => t * t * (3 - 2 * t);
const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));

// A small anticipation, rigid planted ram, and recovery. The returned value is
// normalized to the authored shift, with a short negative anticipation.
export function actionAt(progress) {
  const t = clamp(progress);
  if (t <= 0 || t >= 1) return 0;
  if (t < .18) return -.14 * smooth(t / .18);
  if (t < .48) return -.14 + 1.14 * smooth((t - .18) / .30);
  if (t < .82) return 1;
  return 1 - smooth((t - .82) / .18);
}

export function poseAt(progress) {
  const extension = SHIFT * actionAt(progress);
  return poseFromExtension(extension);
}

export function poseFromExtension(extension = 0) {
  const dx = Number(extension) || 0;
  return { extension: dx, dx, dy: -dx * .10, rotation: -dx * .00028 };
}

export function transformPoint(point, extension = 0) {
  const { dx, dy, rotation } = poseFromExtension(extension);
  const c = Math.cos(rotation), s = Math.sin(rotation);
  const x = point.x - ANCHOR.x, y = point.y - ANCHOR.y;
  return { x: ANCHOR.x + dx + c * x - s * y, y: ANCHOR.y + dy + s * x + c * y };
}

// The archival sheet's three-quarter profile points left. Mirror the complete
// cell at draw time so every runtime use has a canonical +x/right-facing pose.
export function drawRook(canvas, image, side, extension = 0) {
  const ctx = canvas.getContext('2d');
  const { dx, dy, rotation } = poseFromExtension(extension);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(ANCHOR.x + dx, ANCHOR.y + dy);
  ctx.rotate(rotation);
  ctx.translate(-ANCHOR.x, -ANCHOR.y);
  ctx.translate(960, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(image, side * 768, 0, 768, 1024, 0, 0, 768, 1024);
  ctx.restore();
}
