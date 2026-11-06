import {clamp} from '../painted-mesh.mjs';
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const CHARGE_CONTACT=.68;
export function chargeAt(progress){
 const t=clamp(progress,0,1),flight=clamp((t-.2)/(CHARGE_CONTACT-.2),0,1);
 return {travel:smooth(flight),lift:4*flight*(1-flight)};
}
// Separate curves keep both swapping figures visible at the midpoint.
export function swapAt(progress,from,to){
 const t=smooth(progress),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
 const arc=Math.sin(Math.PI*t)*32,offset={x:-dy/length*arc,y:dx/length*arc};
 return {actor:{x:from.x+dx*t+offset.x,y:from.y+dy*t+offset.y},partner:{x:to.x-dx*t-offset.x,y:to.y-dy*t-offset.y}};
}
