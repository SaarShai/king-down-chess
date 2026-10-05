// The resting Pawn on the painted board (opt-in: scene.setLively({pawns:true})): now and then a pawn
// shakes his spear, moves his helmet a little, or hitches up his shield. Each pawn has its own random
// timetable (seeded by its square and army), so they seldom act together. One painted image per army:
// each action warps one part of the pawn's still sprite on a small mesh whose edge stays put, so the
// rest of the figure does not move. Coordinates are the scene's 1152 px pawn sprite (both armies line up
// there: lance/aiming.mjs places each army's figure at the same point).
import {clamp,rotate,paintTriangle} from '../painted-mesh.mjs';

const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
// An integer hash (neighbouring squares get unrelated timetables), 0..1.
const rand=(i,j=0)=>{let h=Math.imul(i+1,0x9e3779b1)^Math.imul(j+7,0x85ebca77);h=Math.imul(h^h>>>15,0x2c1b3c6d);h=Math.imul(h^h>>>12,0x297a2d39);return ((h^h>>>15)>>>0)/4294967296;};
const DEG=Math.PI/180;
// An ellipse weight: 1 inside (r < .8), 0 beyond 1.15.
const inside=(p,c,rx,ry)=>1-smooth((Math.hypot((p.x-c.x)/rx,(p.y-c.y)/ry)-.8)/.35);
export const ACTIONS={
 // The forearm, hand and spear turn about the shoulder in a quick shake.
 spear:{duration:900,box:[400,390,850,590],grid:[6,3],pivot:{x:430,y:521},
  weight:p=>smooth((p.x-440)/40)*smooth((590-p.y)/36)*smooth((p.y-390)/36),
  at:u=>({angle:3.2*DEG*Math.sin(2*Math.PI*2.5*u)*Math.sin(Math.PI*u),dx:0,dy:0})},
 // The helmet tilts one way, then the other, about the neck, lifting a touch.
 head:{duration:1500,box:[150,170,485,545],grid:[5,5],pivot:{x:315,y:505},
  weight:p=>inside(p,{x:315,y:352},135,150),
  at:u=>({angle:3.6*DEG*Math.sin(2*Math.PI*u)*Math.sin(Math.PI*u)**.5,dx:0,dy:-3*Math.sin(Math.PI*u)})},
 // The shield is hitched up and tipped, then settles back with a small bounce.
 shield:{duration:1200,box:[60,425,305,780],grid:[4,5],pivot:{x:253,y:588},
  weight:p=>inside(p,{x:180,y:601},90,140),
  at:u=>{const up=u<.25?smooth(u/.25):u<.55?1:1-smooth((u-.55)/.35),bounce=u>.85?Math.sin((u-.85)/.15*Math.PI)*.18:0;return {angle:-3*DEG*up,dx:0,dy:-15*(up-bounce)};}},
};
const NAMES=Object.keys(ACTIONS);
// A pawn's timetable: in each 3.2 s slot it acts with chance .45; the pattern repeats every 12.8 s.
export const SLOT=3200,SLOTS=4,LOOP=SLOT*SLOTS;
/** The action a pawn plays at time t (ms), or null: {name, u (0..1 through it)}. seed: per pawn. */
export function idleAt(seed,t){
 const n=Math.floor(t/SLOT),k=((n%SLOTS)+SLOTS)%SLOTS;
 if(rand(seed,k)>=.45)return null;
 const name=NAMES[Math.floor(rand(seed,k+10)*NAMES.length)],a=ACTIONS[name],start=n*SLOT+rand(seed,k+20)*(SLOT-a.duration);
 const u=(t-start)/a.duration;
 return u>0&&u<1?{name,u}:null;
}
// Grid points of an action's box: source and warped positions.
function mesh(a,m){
 const [x0,y0,x1,y1]=a.box,[nx,ny]=a.grid,src=[],dst=[];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const p={x:x0+(x1-x0)*i/nx,y:y0+(y1-y0)*j/ny},w=i&&j&&i<nx&&j<ny?a.weight(p):0,r=rotate(p,m.angle*w,a.pivot);
  src.push(p);dst.push({x:p.x+(r.x-p.x)+m.dx*w,y:p.y+(r.y-p.y)+m.dy*w});
 }
 return {src,dst};
}
/** Draws the still sprite `still` into `canvas` (1152 px) with the action applied. */
export function drawIdle(canvas,still,{name,u}){
 const a=ACTIONS[name],ctx=canvas.getContext('2d'),[x0,y0,x1,y1]=a.box,[nx]=a.grid,{src,dst}=mesh(a,a.at(u));
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.save();ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.rect(x0,y0,x1-x0,y1-y0);ctx.clip('evenodd');ctx.drawImage(still,0,0);ctx.restore();
 const cell=[0,0,still.width,still.height],at=(i,j)=>j*(nx+1)+i;
 for(let j=0;j<a.grid[1];j++)for(let i=0;i<nx;i++){
  for(const tri of [[at(i,j),at(i+1,j),at(i,j+1)],[at(i+1,j),at(i+1,j+1),at(i,j+1)]])paintTriangle(ctx,still,tri.map(k=>src[k]),tri.map(k=>dst[k]),cell);
 }
}
