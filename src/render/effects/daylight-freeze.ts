import type { PaintedScene } from '../painted/scene.mjs';

/** The square and badge of a frozen piece. The scene colours the figure itself. */
export function drawDaylightFreeze(ctx: CanvasRenderingContext2D, scene: PaintedScene, squares: ReadonlySet<number>, front: boolean, width: number): void {
  const { PAD, TILE, SIZE } = scene, px = SIZE / Math.max(1, width);
  ctx.save();
  for (const square of squares) {
    const { col, row } = scene.cell(square), x = PAD + col * TILE, y = PAD + row * TILE;
    if (!front) {
      ctx.fillStyle = '#7fb7d924'; ctx.fillRect(x, y, TILE, TILE);
      const inset = 1.5 * px;
      ctx.strokeStyle = '#7fb7d9'; ctx.lineWidth = inset;
      ctx.strokeRect(x + inset, y + inset, TILE - 2 * inset, TILE - 2 * inset);
      continue;
    }
    const radius = .17 * TILE, cx = x + TILE - 2 * px - radius, cy = y + 2 * px + radius;
    for (const [r, color] of [[radius + 1.75 * px, '#2a262259'], [radius + px, '#fbf8f0'], [radius, '#7fb7d9']] as const) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
    }
    const arm = radius * .6, fork = arm / 4;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI / 3, dx = Math.sin(angle) * arm, dy = Math.cos(angle) * arm;
      ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy);
    }
    for (const side of [-1, 1]) {
      ctx.moveTo(cx - fork, cy + side * (arm - fork));
      ctx.lineTo(cx, cy + side * arm);
      ctx.lineTo(cx + fork, cy + side * (arm - fork));
    }
    ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = arm * .225; ctx.lineCap = 'round'; ctx.stroke();
  }
  ctx.restore();
}
