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

// Ground pound: the stone forearm (the tower below the elbow) lifts forward and
// slams down twice. A small mesh bends at the elbow so the tower never tears;
// everything above ELBOW_TOP stays put. Ivory cell coordinates; the charcoal
// figure sits 58 px further left in its cell.
import {paintTriangle,rotate} from '../painted-mesh.mjs';
const POUND_SHIFT=[0,-58];
export const ELBOW={x:205,y:450};
const COLUMNS=[52,120,190,250,282],ROWS=[380,420,460,500,560,640,720,800,880,975],ELBOW_TOP=400,ELBOW_FULL=500;
export const POUND={duration:1500,approach:350,thumps:[[350,620],[620,900]],lift:.42,settle:1250};
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Each thump: slow lift, fast slam; returns the forearm angle (radians).
export function poundAngle(ms){
 for(const [a,b] of POUND.thumps)if(ms>a&&ms<b){const t=(ms-a)/(b-a);return t<.7?POUND.lift*ease(t/.7):POUND.lift*(1-((t-.7)/.3)**2);}
 return 0;
}
export const SLAMS=POUND.thumps.map(([,b])=>b);
const weight=y=>ease((y-ELBOW_TOP)/(ELBOW_FULL-ELBOW_TOP));
export function forearmPoint(point,angle,side=0){
 const s=POUND_SHIFT[side],p={x:point.x+s,y:point.y},c={x:ELBOW.x+s,y:ELBOW.y};
 return rotate(p,angle*weight(point.y),c);
}
export function drawRookPound(canvas,image,side,angle){
 const ctx=canvas.getContext('2d'),cell=CELLS[side],s=POUND_SHIFT[side];
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();
 ctx.translate(mirrorOrigin[side],0);ctx.scale(-1,1);
 const left=COLUMNS[0]+s,right=COLUMNS.at(-1)+s,top=ROWS[0],bottom=ROWS.at(-1);
 ctx.save();ctx.beginPath();ctx.rect(0,0,cell[2],cell[3]);ctx.rect(left,top,right-left,bottom-top);ctx.clip('evenodd');
 ctx.drawImage(image,...cell,0,0,cell[2],cell[3]);ctx.restore();
 const pts=ROWS.flatMap(y=>COLUMNS.map(x=>({x:x+s,y})));
 const moved=ROWS.flatMap(y=>COLUMNS.map(x=>forearmPoint({x,y},angle,side)));
 const n=COLUMNS.length;
 for(let r=0;r<ROWS.length-1;r++)for(let c=0;c<n-1;c++){const i=r*n+c;
  for(const tri of [[i,i+1,i+n],[i+1,i+n+1,i+n]])paintTriangle(ctx,image,tri.map(j=>pts[j]),tri.map(j=>moved[j]),cell);}
 ctx.restore();
}
// Canvas point (in drawRookPound's sprite canvas) of the tower's striking base.
export function towerBase(side,angle){const p=forearmPoint({x:130,y:960},angle,side);return {x:mirrorOrigin[side]-p.x,y:p.y};}
