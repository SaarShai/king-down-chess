import { clamp } from '../painted-mesh.mjs';
export const DURATION = 1100;
export const LANDING = .8;
export const ANCHOR = { x: 580, y: 994 };
export const HIT = { x: 573, y: 443 };
const ease = t => t*t*(3-2*t);
// Travel and elevation are separate: the shadow follows the board plane throughout the leap.
// One coherent painted pose tilts in the air; hands, helmet and spear never distort.
export function leapAt(progress) {
 const t=clamp(progress,0,1);
 if(t<.15)return {travel:0,lift:0,rotation:-.035*Math.sin(Math.PI*t/.15)};
 if(t<LANDING){const u=(t-.15)/(LANDING-.15);return {travel:ease(u),lift:4*u*(1-u),rotation:.045*Math.sin(2*Math.PI*u)};}
 const settle=(t-LANDING)/(1-LANDING);
 return {travel:1,lift:.035*Math.sin(Math.PI*settle),rotation:-.015*Math.sin(Math.PI*settle)};
}
export function drawKnight(canvas,image,side) {
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(image,side*768,0,768,1024,side?148:60,15,768,1024);
}
