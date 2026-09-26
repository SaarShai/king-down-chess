const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = t => t * t * (3 - 2 * t);

export const DURATION = 1180;
// Shared canvas coordinates after registration: the boot line is y≈1018.
export const ANCHOR = { x: 576, y: 1018 };
// Incoming action target: center torso. Hands, book and dagger stay intact.
export const HIT = { x: 576, y: 500 };

// A compact wind-up, forward book presentation, hold, and recovery. The return
// value is deliberately normalized so callers can choose the display scale.
export function actionAt(progress) {
  const t = clamp(progress);
  if (t <= 0 || t >= 1) return 0;
  if (t < 0.2) return -0.16 * smooth(t / 0.2);
  if (t < 0.5) return -0.16 + 1.16 * smooth((t - 0.2) / 0.3);
  if (t < 0.72) return 1;
  return 1 - smooth((t - 0.72) / 0.28);
}

// Both generated figures are a single painted pose. The source render reads
// left-facing, so the preview mirrors each cell into the canonical +x/right
// facing direction. The charcoal source cell is then shifted 95 px left of the
// ivory destination to share feet, scale and action pivot. Motion is a rigid
// translation/rotation;
// it never invents joints or stretches the hands, book or dagger.
export function drawBishop(canvas, image, side, extension = 0) {
  const ctx = canvas.getContext('2d');
  const sourceX = side ? 768 : 0;
  const destinationX = side ? 173 : 268;
  const amount = clamp(extension, -1, 1);
  const travel = amount * 22;
  const lift = Math.abs(amount) * 3;
  const rotation = amount * 0.018;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(travel, -lift);
  ctx.translate(ANCHOR.x, ANCHOR.y);
  ctx.rotate(rotation);
  ctx.translate(-ANCHOR.x, -ANCHOR.y);
  ctx.translate(destinationX + 768, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(image, sourceX, 0, 768, 1024, 0, 0, 768, 1024);
  ctx.restore();
}
