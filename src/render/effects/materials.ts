import { fireTexture } from './fire';
import { materialState, type MaterialFrame } from '../../../docs/2d-first-pieces/board/ice-material.mjs';
export { materialState, drawFreeze, drawIceWall, type MaterialFrame } from '../../../docs/2d-first-pieces/board/ice-material.mjs';
const hash = (n: number) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

/** A living fire curtain surrounds a clear pocket. The lower front keeps the figure readable. */
export function drawFirewall(ctx: CanvasRenderingContext2D, frame: MaterialFrame) {
  const {grow,melt,life}=materialState(frame.progress);if(life<=0)return;
  const seed=frame.seed??0, time=frame.progress*19;
  ctx.save();ctx.translate(frame.x,frame.y);
  if(!frame.front){
    const glow=ctx.createRadialGradient(0,0,16,0,0,73);
    glow.addColorStop(0,'#ffb52a00');glow.addColorStop(.63,'#ff7a1659');glow.addColorStop(1,'#e9370000');
    ctx.save();ctx.scale(1,.36);ctx.globalAlpha=life;ctx.fillStyle=glow;ctx.fillRect(-75,-75,150,150);ctx.restore();
  }
  const image=fireTexture(frame.progress,seed,frame.front,grow,melt);
  // A faint light bloom sits under the detailed fire rather than blurring its silhouette.
  ctx.globalAlpha=.23;ctx.filter='blur(5px)';ctx.drawImage(image,-72,-126);ctx.filter='none';
  ctx.globalAlpha=1;ctx.drawImage(image,-72,-126);
  if(!frame.front)for(let i=0;i<7;i++){
    const age=(time*.19+hash(i+seed*3))%1,side=i%2?-1:1;
    const x=side*(42+hash(i+seed)*19)+Math.sin(age*7+i)*5,y=-10-age*(78+hash(i+7)*28);
    ctx.globalAlpha=Math.sin(age*Math.PI)*(melt>.3?Math.sqrt(1-melt):life)*.85;
    ctx.strokeStyle=i%3?'#ffac37':'#ffed9f';ctx.lineWidth=1.2+hash(i)*.8;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(age*9+i)*1.3,y+2.5);ctx.stroke();
  }
  ctx.restore();
}
