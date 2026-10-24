import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';

export const SIGNAL_DURATION_MS = 4800;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };

function stroke(ctx: CanvasRenderingContext2D, color: string, width = 3) {
  ctx.strokeStyle = '#fcf6e6dd'; ctx.lineWidth = width + 3; ctx.stroke(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
export function ring(ctx: CanvasRenderingContext2D, scene: PaintedScene, sq: number, color: string, strength = 1, growth = 1) {
  const f = scene.foot(sq); ctx.save(); ctx.globalAlpha = strength; ctx.beginPath(); ctx.ellipse(f.x, f.y - 2, 44 * growth, 15 * growth, 0, 0, Math.PI * 2); stroke(ctx, color, 3); ctx.restore();
}
export function link(ctx: CanvasRenderingContext2D, scene: PaintedScene, from: number, to: number, color: string, arc = false, portion = 1, dashed = false) {
  const a = scene.foot(from), b = scene.foot(to), lift = arc ? -90 : -8;
  const control = { x: (a.x + b.x) / 2 + (arc && a.x === b.x ? 92 : 0), y: Math.min(a.y, b.y) + lift };
  const point = (t: number) => ({ x: (1-t)**2*a.x+2*(1-t)*t*control.x+t*t*b.x, y: (1-t)**2*(a.y-18)+2*(1-t)*t*control.y+t*t*(b.y-18) });
  ctx.save(); ctx.lineCap = 'round'; if (dashed) ctx.setLineDash([10, 8]); ctx.beginPath();
  for (let i = 0; i <= 50; i++) { const p = point(i / 50 * clamp(portion)); if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
  stroke(ctx, color, 3.2); ctx.setLineDash([]);
  const end = point(clamp(portion)), prior = point(Math.max(0, portion - .02)), angle = Math.atan2(end.y-prior.y, end.x-prior.x);
  if (portion > .05) { ctx.translate(end.x, end.y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12,-7); ctx.lineTo(-12,7); ctx.closePath(); ctx.fillStyle=color; ctx.fill(); }
  ctx.restore();
}
export function pips(ctx: CanvasRenderingContext2D, scene: PaintedScene, width: number, sq: number, color: string, count: number, shield = false, exception?: 'king'|'pawn') {
  const p = scene.foot(sq); ctx.save();
  const scale = Math.min(1.7, Math.max(1, 650 / Math.max(1, width)));
  ctx.translate(p.x, p.y + 8); ctx.scale(scale, scale); ctx.translate(-p.x, -p.y - 8);
  ctx.fillStyle = '#fcf6e8'; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(p.x-(exception?28:23), p.y+7, exception?56:46, exception?28:24, 10); ctx.fill(); ctx.stroke();
  if (shield) { ctx.beginPath(); ctx.moveTo(p.x-14,p.y+12); ctx.lineTo(p.x-4,p.y+12); ctx.lineTo(p.x-4,p.y+20); ctx.lineTo(p.x-9,p.y+25); ctx.lineTo(p.x-14,p.y+20); ctx.closePath(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(p.x-14,p.y+13); ctx.lineTo(p.x-4,p.y+23); ctx.moveTo(p.x-4,p.y+13); ctx.lineTo(p.x-14,p.y+23); ctx.stroke(); }
  if(exception) {
    // The exception must read as clearly as the shield at phone size.
    ctx.save();ctx.translate(p.x+9,p.y+20);ctx.scale(1.45,1.45);ctx.translate(-p.x-8,-p.y-18);
    ctx.fillStyle='#96351f';ctx.beginPath();
    if(exception==='king') { ctx.moveTo(p.x+1,p.y+15);ctx.lineTo(p.x+4,p.y+18);ctx.lineTo(p.x+8,p.y+12);ctx.lineTo(p.x+12,p.y+18);ctx.lineTo(p.x+15,p.y+15);ctx.lineTo(p.x+13,p.y+23);ctx.lineTo(p.x+3,p.y+23);ctx.closePath();ctx.fill(); }
    else { ctx.arc(p.x+8,p.y+14.5,3.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(p.x+6,p.y+18);ctx.lineTo(p.x+3,p.y+24);ctx.lineTo(p.x+13,p.y+24);ctx.lineTo(p.x+10,p.y+18);ctx.closePath();ctx.fill(); }
    ctx.restore();
  }
  for (let i=0;i<count;i++) { ctx.beginPath(); ctx.arc(p.x+8+i*7,p.y+19,3.3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); } ctx.restore();
}
export function checkImpact(ctx: CanvasRenderingContext2D, scene: PaintedScene, sq: number, progress: number, reduced: boolean) {
  const f=scene.foot(sq), t=clamp((progress-.025)/.32), burst=reduced?0:Math.sin(t*Math.PI), hold=smooth(progress/.14);
  ctx.save();ctx.translate(f.x,f.y);
  // A brief local danger plume sits behind the king, then leaves the quiet ground mark.
  if(burst>0) {
    const glow=ctx.createRadialGradient(0,-67,9,0,-67,139);
    glow.addColorStop(0,'#ffbc6b8c');glow.addColorStop(.34,'#b52b208c');glow.addColorStop(.7,'#7b182a4d');glow.addColorStop(1,'#7b182a00');
    ctx.globalAlpha=burst;ctx.fillStyle=glow;ctx.fillRect(-140,-207,280,280);
    for(let i=0;i<10;i++) {
      const side=i%2?1:-1, root=side*(30+(i%5)*8), height=80+(i%4)*25, tip=root+side*(18+t*30);
      ctx.beginPath();ctx.moveTo(root-13,-5);ctx.bezierCurveTo(root-side*29,-height*.4,tip+side*30,-height*.7,tip,-height);ctx.bezierCurveTo(tip-side*20,-height*.55,root+side*25,-height*.25,root+13,-5);ctx.closePath();
      const flame=ctx.createLinearGradient(root,0,tip,-height);flame.addColorStop(0,'#a61b1ccc');flame.addColorStop(.5,i%3?'#c94e28bd':'#f5b26fbd');flame.addColorStop(1,'#c94e2800');ctx.fillStyle=flame;ctx.fill();
    }
    ctx.beginPath();ctx.ellipse(0,0,42+t*105,16+t*30,0,0,Math.PI*2);ctx.strokeStyle='#8e201ee0';ctx.lineWidth=10*(1-t)+2;ctx.stroke();ctx.strokeStyle='#ffd5a4';ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<22;i++) {
      const angle=i*2.399, radius=(54+(i%5)*19)*( .35+t*.8), x=Math.cos(angle)*radius, y=-30-Math.abs(Math.sin(angle))*radius*1.15-t*15;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(angle)*9,y+7);ctx.strokeStyle=i%3?'#f7ae64':'#8e2923';ctx.lineWidth=2+(i%3);ctx.stroke();
    }
  }
  ctx.restore();ring(ctx,scene,sq,'#b84d25',hold);
}
