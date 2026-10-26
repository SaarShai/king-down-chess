import type { PaintedScene } from '../../../../../2d-first-pieces/board/scene.mjs';
import { drawMarks, type MarkState } from '../../../../../../src/render/marks';

export function proposed(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', state: MarkState, row?: number) {
  const m = state.marks, t = scene.TILE, px = state.px;
  const box = (sq: number) => { const c = scene.cell(sq); return { x: scene.PAD + c.col * t, y: scene.PAD + c.row * t }; };
  const sameRow = (sq: number) => row == null || row === scene.cell(sq).row;
  const stroke = (ink: string, width = 2) => { ctx.strokeStyle = '#fff9e8';ctx.lineWidth = (width + 2) * px;ctx.stroke();ctx.strokeStyle = ink;ctx.lineWidth = width * px;ctx.stroke(); };
  // Retain the production shapes for special actions and threats.
  drawMarks(ctx, scene, layer, { ...state, marks: { ...m, selected: null, moves: [], captures: [], rails: [], hint: [], last: [] } }, row);
  ctx.save();ctx.lineCap = 'round';ctx.lineJoin = 'round';
  if (layer === 'under') {
    for (const [i, sq] of (m.last ?? []).entries()) {
      const b = box(sq), y = b.y + t - 10 * px;
      ctx.beginPath();ctx.moveTo(b.x + 10 * px,y);ctx.lineTo(b.x + t - 10 * px,y);ctx.setLineDash(i ? [] : [4 * px,3 * px]);stroke('#675b48',2);ctx.setLineDash([]);
      if (i) {ctx.beginPath();ctx.moveTo(b.x+t-17*px,y-5*px);ctx.lineTo(b.x+t-10*px,y);ctx.lineTo(b.x+t-17*px,y+5*px);stroke('#675b48',2);}
    }
    if (m.selected != null) {
      const b = box(m.selected), inset = 4 * px, len = 13 * px;
      ctx.fillStyle = '#e9bd4a40';ctx.fillRect(b.x+inset,b.y+inset,t-2*inset,t-2*inset);
      ctx.beginPath();
      for (const dx of [0,1]) for (const dy of [0,1]) { const x = b.x+(dx?t-inset:inset), y=b.y+(dy?t-inset:inset);ctx.moveTo(x+(dx?-len:len),y);ctx.lineTo(x,y);ctx.lineTo(x,y+(dy?-len:len)); }
      stroke('#67400f',2.5);
    }
    for (const sq of m.moves ?? []) {
      if (m.captures?.includes(sq)) continue;
      const b=box(sq);ctx.beginPath();ctx.arc(b.x+t/2,b.y+t/2,4.5*px,0,Math.PI*2);ctx.fillStyle='#365540';ctx.fill();stroke('#365540',1);
    }
    for (const sq of m.captures ?? []) {
      const b=box(sq);ctx.beginPath();ctx.roundRect(b.x+5*px,b.y+5*px,t-10*px,t-10*px,9*px);stroke('#8b3424',2);
    }
  } else {
    for (const sq of m.captures ?? []) {
      if (!sameRow(sq)) continue;
      const b=box(sq), x=b.x+9*px,y=b.y+t-10*px;
      ctx.beginPath();ctx.arc(x,y,6*px,0,Math.PI*2);ctx.fillStyle='#fff9e8';ctx.fill();stroke('#8b3424',1.8);
      if (m.shots?.includes(sq)) {ctx.beginPath();ctx.moveTo(x-5*px,y+5*px);ctx.lineTo(x+5*px,y-5*px);stroke('#8b3424',1.5);}
    }
    for (const sq of m.hint ?? []) {
      if (!sameRow(sq)) continue;
      const b=box(sq),x=b.x+t-10*px,y=b.y+t-11*px,r=5*px;
      ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fillStyle='#fff9e8';ctx.fill();stroke('#79531b',1.8);
    }
  }
  ctx.restore();
}
