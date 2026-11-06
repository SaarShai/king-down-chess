import { paintChar, paintEmber, paintFlame } from './fire-art';
import { materialState, type MaterialFrame } from '../../../docs/2d-first-pieces/board/ice-material.mjs';
export { materialState, drawFreeze, drawIceWall, type MaterialFrame } from '../../../docs/2d-first-pieces/board/ice-material.mjs';
const hash = (n: number) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

/** Painted flames from the fire atlas stand round a clear pocket: tall behind and on the flanks, low in front, so the figure stays readable. */
const BACK: readonly (readonly [number, number, number])[] = [[-60, -5, 1], [-41, -15, .9], [-19, -22, .74], [6, -23, .76], [29, -17, .9], [55, -7, 1]];
const FRONT: typeof BACK = [[-64, 4, .82], [-40, 15, .42], [39, 15, .4], [63, 5, .84]];
export function drawFirewall(ctx: CanvasRenderingContext2D, frame: MaterialFrame & { clock?: number }) {
  const {grow,melt,life}=materialState(frame.progress);if(life<=0)return;
  const seed=frame.seed??0, clock=frame.clock??performance.now(), rise=grow*(1-melt*.94);
  ctx.save();ctx.translate(frame.x,frame.y);
  if(!frame.front){
    const glow=ctx.createRadialGradient(0,0,16,0,0,73);
    glow.addColorStop(0,'#ffb52a00');glow.addColorStop(.63,'#ff7a1659');glow.addColorStop(1,'#e9370000');
    ctx.save();ctx.scale(1,.36);ctx.globalAlpha=life;ctx.fillStyle=glow;ctx.fillRect(-75,-75,150,150);ctx.restore();
    paintChar(ctx,0,2,132,seed,life*.55);
  }
  // Each flame has its own place in the loop, so the ring never flickers in step.
  (frame.front?FRONT:BACK).forEach(([x,y,size],i)=>{
    const height=112*size*(.8+hash(i+seed)*.2)*rise;
    paintFlame(ctx,x,y,height*.66,height,clock+i*137,seed+i,Math.min(1,life*1.6));
  });
  if(!frame.front)for(let i=0;i<6;i++){
    const age=(clock*.0007+hash(i+seed*3))%1,side=i%2?-1:1;
    const x=side*(42+hash(i+seed)*19)+Math.sin(age*7+i)*5,y=-10-age*(78+hash(i+7)*28);
    paintEmber(ctx,x,y,5+hash(i)*3,age*6+i,i,Math.sin(age*Math.PI)*(melt>.3?Math.sqrt(1-melt):life));
  }
  ctx.restore();
}
