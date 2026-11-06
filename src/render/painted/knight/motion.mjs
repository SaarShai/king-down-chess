import { clamp, paintTriangle } from '../painted-mesh.mjs';
export const DURATION = 1350;
export const TAKEOFF = .28;
export const LANDING = .82;
export const ANCHOR = { x: 580, y: 994 };
export const HIT = { x: 573, y: 443 };
const ease = t => {t=clamp(t,0,1);return t*t*(3-2*t);};
export const LEGS = [
 {hip:{x:486,y:612},knee:{x:427,y:749},ankle:{x:400,y:889},bend:-1},
 {hip:{x:552,y:620},knee:{x:574,y:745},ankle:{x:586,y:882},bend:1}
];
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Two fixed-length projected leg segments. Ankles stay planted as the hips lower.
export function legAt(leg,amount) {
 const hip={x:leg.hip.x,y:leg.hip.y+48*clamp(amount,0,1)},ankle=leg.ankle;
 const upper=length(leg.hip,leg.knee),lower=length(leg.knee,ankle),distance=length(hip,ankle);
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),out=Math.sqrt(Math.max(0,upper*upper-along*along));
 const dx=(ankle.x-hip.x)/distance,dy=(ankle.y-hip.y)/distance;
 return {hip,knee:{x:hip.x+dx*along+leg.bend*dy*out,y:hip.y+dy*along-leg.bend*dx*out},ankle};
}
// Keep the complete spear and its gripping hand still. The shoulder follows the torso.
// The authored drawing supports a shallow crouch, not arbitrary leg poses.
export function crouchPoint(point,amount) {
 amount=clamp(amount,0,1);
 if(!amount||point.x<=365||point.y>=900)return {...point};
 const bodyWeight=ease((point.x-365)/100);
 if(point.y<=610)return {x:point.x,y:point.y+48*amount*bodyWeight};
 const blend=ease((point.x-480)/65),deltas=LEGS.map(leg=>{
  const pose=legAt(leg,amount);
  if(point.y<leg.knee.y){const u=clamp((point.y-leg.hip.y)/(leg.knee.y-leg.hip.y),0,1);return {x:(pose.knee.x-leg.knee.x)*u,y:48*amount*(1-u)+(pose.knee.y-leg.knee.y)*u};}
  const u=clamp((point.y-leg.knee.y)/(leg.ankle.y-leg.knee.y),0,1);return {x:(pose.knee.x-leg.knee.x)*(1-u),y:(pose.knee.y-leg.knee.y)*(1-u)};
 });
 return {x:point.x+(deltas[0].x*(1-blend)+deltas[1].x*blend)*bodyWeight,y:point.y+(deltas[0].y*(1-blend)+deltas[1].y*blend)*bodyWeight};
}
export function leapAt(progress) {
 const t=clamp(progress,0,1);
 if(t<TAKEOFF)return {travel:0,lift:0,rotation:0,crouch:t<.19?ease(t/.19):1-ease((t-.19)/.09)};
 if(t<LANDING){const u=(t-TAKEOFF)/(LANDING-TAKEOFF);return {travel:ease(u),lift:4*u*(1-u),rotation:.045*Math.sin(2*Math.PI*u),crouch:0};}
 const settle=(t-LANDING)/(1-LANDING);
 return {travel:1,lift:0,rotation:0,crouch:.52*Math.sin(Math.PI*settle)};
}
export const COLUMNS=[0,290,365,385,410,440,480,510,545,580,620,680,768];
export const ROWS=[0,300,420,530,610,660,700,745,790,840,882,900,985,1024];
export function drawKnight(canvas,image,side,crouch=0) {
 const ctx=canvas.getContext('2d'),offset=side?88:0,cell=[side*768,0,768,1024];
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(side?148:60,15);
 if(crouch<.0001)ctx.drawImage(image,...cell,0,0,768,1024);
 else for(let row=0;row<ROWS.length-1;row++)for(let col=0;col<COLUMNS.length-1;col++){
  const corners=[{x:COLUMNS[col],y:ROWS[row]},{x:COLUMNS[col+1],y:ROWS[row]},{x:COLUMNS[col],y:ROWS[row+1]},{x:COLUMNS[col+1],y:ROWS[row+1]}];
  for(const indices of [[0,1,2],[1,3,2]]){
   const source=indices.map(i=>({...corners[i],x:corners[i].x-offset}));
   const target=indices.map(i=>{const p=crouchPoint(corners[i],crouch);return {x:p.x-offset,y:p.y};});
   paintTriangle(ctx,image,source,target,cell);
  }
 }
 ctx.restore();
}
