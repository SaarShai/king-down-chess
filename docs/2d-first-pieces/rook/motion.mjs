export const DURATION=1100;
export const ANCHOR={x:576,y:964};
export const HIT={x:576,y:505};
export const PIVOT={x:928,y:964};
export const MAX_ROCK=.025;
const smooth=t=>t*t*(3-2*t),clamp=t=>Math.max(-.14,Math.min(1,t));
// The generated gutter lies at x=780, not the requested x=768. Keep the
// original PNG intact and register complete source windows at the same scale.
export const CELLS=[[0,0,780,1024],[780,0,756,1024]];
const mirrorOrigin=[995,943];
export function actionAt(progress){
 const t=Math.max(0,Math.min(1,progress));
 if(t<=0||t>=1)return 0;
 if(t<.18)return -.14*smooth(t/.18);
 if(t<.48)return -.14+1.14*smooth((t-.18)/.30);
 if(t<.82)return 1;
 return 1-smooth((t-.82)/.18);
}
// Rock onto the leading stone contact. The entire fist/tower stays rigid;
// the rear foot lifts slightly instead of pretending all feet are planted.
export function transformPoint(point,extension=0){
 const angle=MAX_ROCK*clamp(extension),c=Math.cos(angle),s=Math.sin(angle),x=point.x-PIVOT.x,y=point.y-PIVOT.y;
 return {x:PIVOT.x+c*x-s*y,y:PIVOT.y+s*x+c*y};
}
export function drawRook(canvas,image,side,extension=0){
 const ctx=canvas.getContext('2d'),cell=CELLS[side];
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();
 ctx.translate(PIVOT.x,PIVOT.y);ctx.rotate(MAX_ROCK*clamp(extension));ctx.translate(-PIVOT.x,-PIVOT.y);
 ctx.translate(mirrorOrigin[side],0);ctx.scale(-1,1);
 ctx.drawImage(image,...cell,0,0,cell[2],cell[3]);ctx.restore();
}
