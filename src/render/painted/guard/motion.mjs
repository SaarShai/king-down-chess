import { clamp, paintTriangle } from '../painted-mesh.mjs';

export const DURATION = 1050;
// All coordinates are in the study's 1152 px local canvas.
export const ANCHOR = { x: 576, y: 1024 };
// Incoming board contacts use the torso centre, not the forward brace marker.
export const HIT = { x: 576, y: 540 };

const smooth = t => t * t * (3 - 2 * t);

// A small preparation, rigid brace toward +x, hold, then release. The artwork
// keeps upper armour and gauntlets rigid while boots remain fixed.
export function actionAt(progress) {
  const t = clamp(progress, 0, 1);
  if (t === 0 || t === 1) return 0;
  if (t < 0.18) return -0.14 * smooth(t / 0.18);
  if (t < 0.5) return -0.14 + 1.14 * smooth((t - 0.18) / 0.32);
  if (t < 0.82) return 1;
  return 1 - smooth((t - 0.82) / 0.18);
}

const bands = [0, 620, 730, 760, 790, 820, 850, 980, 1024];
export const upperBodyShift = (point, extension) => {
  const weight = smooth(clamp((850 - point.y) / 120, 0, 1));
  return { x: point.x + extension * weight, y: point.y - extension * 0.08 * weight };
};

export function drawGuard(canvas, image, side, extension = 0) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / 1152, canvas.height / 1152);
  const offsetX = (canvas.width - 1152 * scale) / 2;
  const offsetY = (canvas.height - 1152 * scale) / 2;
  const brace = clamp(extension, -0.14, 1);
  ctx.save();
  ctx.translate(offsetX + scale * 192, offsetY + scale * 64);
  ctx.scale(scale, scale);
  const sourceCell = [side * 768, 0, 768, 1024];
  if (Math.abs(brace) < 0.001) ctx.drawImage(image, ...sourceCell, 0, 0, 768, 1024);
  else for (let i = 0; i < bands.length - 1; i++) {
    const corners = [{ x: 0, y: bands[i] }, { x: 768, y: bands[i] }, { x: 0, y: bands[i + 1] }, { x: 768, y: bands[i + 1] }];
    for (const indices of [[0, 1, 2], [1, 3, 2]]) {
      const source = indices.map(index => corners[index]);
      const destination = source.map(point => upperBodyShift(point, brace * 15));
      paintTriangle(ctx, image, source, destination, sourceCell);
    }
  }
  ctx.restore();
}
