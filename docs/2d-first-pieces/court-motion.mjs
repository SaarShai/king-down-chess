import {clamp,paintTriangle,rotate} from './painted-mesh.mjs';

export const ANCHOR={x:576,y:1018};
export const HIT={x:576,y:540};
export const figures={
 queen:{duration:1250,origins:[[103,23],[215,20]],mirror:false,bands:[0,520,600,680,760,840,925,1024],shift:{x:18,y:7},fixed:925,rigid:520,scale:.12},
 paladin:{duration:1450,origins:[[224,108],[224,108]],mirror:false,bands:[0,640,670,700,730,760,780,1024],shift:{x:28,y:4},fixed:780,rigid:640,scale:.14},
 maester:{duration:1100,origins:[[268,56],[165,54]],mirror:true,scale:.105}
};
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function actionAt(progress){
 const t=clamp(progress,0,1);
 if(t===0||t===1)return 0;
 if(t<.18)return -.12*smooth(t/.18);
 if(t<.5)return -.12+1.12*smooth((t-.18)/.32);
 if(t<.72)return 1;
 return 1-smooth((t-.72)/.28);
}
// The complete head, arms, hands and equipment move together. Only cloth or
// the short leg transition bends; actual soles/hem stay fixed.
export function deformPoint(name,point,amount){
 const spec=figures[name],weight=smooth((spec.fixed-point.y)/(spec.fixed-spec.rigid));
 return {x:point.x+spec.shift.x*amount*weight,y:point.y+spec.shift.y*amount*weight};
}
export function registeredPoint(name,side,point,amount=0){
 const spec=figures[name],[x,y]=spec.origins[side];
 const p=name==='maester'?point:deformPoint(name,point,amount);
 const registered={x:x+(spec.mirror?768-p.x:p.x),y:y+p.y};
 return name==='maester'?rotate(registered,-amount*.022,ANCHOR):registered;
}
export function drawCourt(canvas,image,name,side,extension=0){
 const ctx=canvas.getContext('2d'),spec=figures[name],amount=clamp(extension,-.12,1);
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();
 if(name==='maester'){ctx.translate(ANCHOR.x,ANCHOR.y);ctx.rotate(-amount*.022);ctx.translate(-ANCHOR.x,-ANCHOR.y);}
 const [x,y]=spec.origins[side];ctx.translate(x+(spec.mirror?768:0),y);if(spec.mirror)ctx.scale(-1,1);
 const cell=[side*768,0,768,1024];
 if(name==='maester'||Math.abs(amount)<.0001)ctx.drawImage(image,...cell,0,0,768,1024);
 else for(let i=0;i<spec.bands.length-1;i++){
  const corners=[{x:0,y:spec.bands[i]},{x:768,y:spec.bands[i]},{x:0,y:spec.bands[i+1]},{x:768,y:spec.bands[i+1]}];
  for(const indices of [[0,1,2],[1,3,2]]){const source=indices.map(j=>corners[j]);paintTriangle(ctx,image,source,source.map(p=>deformPoint(name,p,amount)),cell);}
 }
 ctx.restore();
}
