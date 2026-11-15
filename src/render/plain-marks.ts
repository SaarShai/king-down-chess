import type { PaintedScene } from './painted/scene.mjs';

export const PLAIN = { actor: '#fffaf0', move: '#fff3d6', enemy: '#ff9b7c', friend: '#bfe8dc', ice: '#c9f1f6', holy: '#ffe39a', ember: '#ffb36b', shadow: '#d3c6ea', last: '#f3e3b4' } as const;
export interface PlainRing { square: number; color: string; width?: number; size?: number; dash?: number[]; role: 'actor' | 'target' | 'focus' | 'landing' | 'trail' | 'state' }
export interface PlainPath { squares: number[]; color: string; arc?: boolean; dash?: number[] }
export interface PlainMarks { rings: PlainRing[]; paths: PlainPath[]; steps: { square: number; number: number }[] }
export const emptyMarks = (): PlainMarks => ({ rings: [], paths: [], steps: [] });

/** All geometry uses one square. The scene supplies orientation and canvas scale. */
export function drawPlainMarks(ctx: CanvasRenderingContext2D, scene: Pick<PaintedScene, 'PAD' | 'TILE' | 'cell'>, marks: PlainMarks): void {
  const s = scene.TILE, w = s * .027;
  const point = (sq: number, down = .29) => { const c = scene.cell(sq); return [scene.PAD + (c.col + .5) * s, scene.PAD + (c.row + .5 + down) * s]; };
  const stroke = (color: string, width: number, dash: number[], shape: () => void) => {
    ctx.setLineDash(dash.map(n => n * s / 75));
    for (const [ink, line] of [['#16231ecc', width + s * .035], [color, width]] as const) { ctx.beginPath(); shape(); ctx.strokeStyle = ink; ctx.lineWidth = line; ctx.stroke(); }
  };
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const p of marks.paths) {
    if (p.squares.length < 2) continue;
    const points = p.squares.map(sq => point(sq, .27)), a = points[0], b = points.at(-1)!;
    const control = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - .64 * s];
    stroke(p.color, .8 * w, p.dash ?? [], () => {
      ctx.moveTo(a[0], a[1]);
      if (p.arc) ctx.quadraticCurveTo(control[0], control[1], b[0], b[1]);
      else points.slice(1).forEach(q => ctx.lineTo(q[0], q[1]));
    });
    const prev = p.arc ? control : points.at(-2)!, angle = Math.atan2(b[1] - prev[1], b[0] - prev[0]), length = w + .12 * s;
    stroke(p.color, .8 * w, [], () => { ctx.moveTo(b[0] - Math.cos(angle - .5) * length, b[1] - Math.sin(angle - .5) * length); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(angle + .5) * length, b[1] - Math.sin(angle + .5) * length); });
  }
  for (const r of marks.rings) {
    const [x, y] = point(r.square), k = r.size ?? 1;
    stroke(r.color, w * (r.width ?? .9), r.dash ?? [], () => ctx.ellipse(x, y, .4 * s * k, .18 * s * k, 0, 0, Math.PI * 2));
  }
  ctx.setLineDash([]);
  for (const step of marks.steps) {
    const [x, y] = point(step.square, -.32), left = x + .32 * s;
    ctx.beginPath(); ctx.arc(left, y, .11 * s, 0, Math.PI * 2); ctx.fillStyle = PLAIN.move; ctx.fill(); ctx.strokeStyle = '#16231e'; ctx.lineWidth = .02 * s; ctx.stroke();
    ctx.fillStyle = '#16231e'; ctx.font = `700 ${s * 12 / 75}px Avenir Next,Avenir,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(step.number), left, y);
  }
  ctx.restore();
}
