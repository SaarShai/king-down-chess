// The Maester's swap: each figure lifts into an opaque orb of arcane light at its own square, the two orbs trade places
// on an arc, and each opens to show the figure. The figures change squares only while their orbs hide them.
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const SWAP={covered:.25,fly:[.31,.71],open:.77};
const COVER=1,FLY=.56,CHEST=66,LIFT=16,RADIUS=136;
// The two orbs run the same curve from opposite ends, so they pass on opposite sides of the line between the squares.
const path=(u,from,to,out)=>{
 const t=smooth(u),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1,arc=Math.sin(Math.PI*t)*(26+.16*length);
 out.x=from.x+dx*t-dy/length*arc;out.y=from.y+dy*t+dx/length*arc-CHEST-Math.sin(Math.PI*t)*22;return out;
};
const flight=p=>clamp((p-SWAP.fly[0])/(SWAP.fly[1]-SWAP.fly[0]));
/** Pure timing at progress p (0..1): which squares the figures stand on, whether they show, their lift, and each orb's size and opacity. */
export function swapOrbsAt(p){
 p=clamp(p);
 const shown=p<SWAP.covered||p>=SWAP.open,arrived=p>=SWAP.open;
 const gather=smooth(p/SWAP.covered),shrink=smooth((p-SWAP.covered)/(SWAP.fly[0]+.02-SWAP.covered)),grow=smooth((p-(SWAP.fly[1]-.03))/(SWAP.open-SWAP.fly[1]+.03));
 const size=p<SWAP.fly[0]+.02?COVER*(.22+.78*gather)*(1-(1-FLY)*shrink):FLY+(COVER-FLY)*grow;
 const alpha=smooth(p/.12)*(1-smooth((p-(SWAP.open+.02))/(1-SWAP.open-.04)));
 const lift=LIFT*(arrived?1-smooth((p-SWAP.open)/(1-SWAP.open)):smooth(p/SWAP.covered));
 return {shown,arrived,lift,size,alpha,travel:flight(p)};
}

let sprites;
function ball(n,stops){const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),r=g.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);for(const [at,colour] of stops)r.addColorStop(at,colour);g.fillStyle=r;g.fillRect(0,0,n,n);return c;}
function load(){
 return sprites??={
  // Opaque to 62% of its radius, with a saturated rim that reads on both square colours.
  orb:ball(256,[[0,'#ffffff'],[.34,'#fbf6ff'],[.54,'#d9c2ff'],[.62,'#a982ff'],[.74,'rgba(106,62,226,.82)'],[.88,'rgba(82,44,196,.3)'],[1,'rgba(70,36,176,0)']]),
  trail:ball(128,[[0,'rgba(226,210,255,.95)'],[.45,'rgba(156,114,255,.8)'],[.8,'rgba(92,52,210,.3)'],[1,'rgba(70,36,176,0)']]),
  spark:ball(32,[[0,'#ffffff'],[.35,'#dcc8ff'],[.7,'rgba(132,92,246,.85)'],[1,'rgba(92,52,210,0)']]),
 };
}
const TRAIL=[.05,.1,.15,.21,.27,.33];
const point={x:0,y:0},at={x:0,y:0};
function sparks(ctx,foot,u,seed){
 if(u<=0||u>=1)return;
 const s=load().spark,fly=1-(1-u)*(1-u);
 for(let i=0;i<7;i++){
  const a=seed+i*.9,d=52+(26+((i*37)%40))*fly,size=(11-(i%3)*2)*smooth(u/.1)*(1-.4*u);
  ctx.globalAlpha=1-smooth((u-.55)/.45);
  ctx.drawImage(s,foot.x+Math.cos(a)*d-size,foot.y-CHEST+Math.sin(a)*d*.8+70*u*u-size,size*2,size*2);
 }
}
/** The orbs and their trails, over the figures. */
export function drawSwapOrbs(ctx,p,from,to){
 if(p>=1)return;
 const s=swapOrbsAt(p),{orb,trail}=load();
 ctx.save();
 for(const first of [true,false]){
  const a=first?from:to,b=first?to:from;
  if(s.travel>0&&s.travel<1)for(let i=TRAIL.length-1;i>=0;i--){
   path(Math.max(0,s.travel-TRAIL[i]),a,b,point);
   const k=1-(i+1)/(TRAIL.length+1),r=66*(.34+.66*k);
   ctx.globalAlpha=k*.85*smooth(s.travel/.08)*smooth((1-s.travel)/.08+.2);
   ctx.drawImage(trail,point.x-r,point.y-r,r*2,r*2);
  }
  // A burst of motes, thrown off behind the orb as each figure is covered and as each opens.
  sparks(ctx,a,(p-SWAP.covered+.08)/.3,first?.3:1.9);
  sparks(ctx,b,(p-SWAP.open)/(1-SWAP.open),first?2.6:.8);
  path(s.travel,a,b,at);
  const r=RADIUS*s.size;
  ctx.globalAlpha=s.alpha;ctx.drawImage(orb,at.x-r,at.y-r,r*2,r*2);
 }
 ctx.restore();
}
/** The pool of light on each square, on the floor under the figures. */
export function drawSwapPools(ctx,p,from,to){
 const near=Math.max(smooth(p/.2)*(1-smooth((p-.34)/.14)),smooth((p-.6)/.16)*(1-smooth((p-.82)/.18)));
 if(near<=0)return;
 const {trail}=load();
 ctx.save();ctx.globalAlpha=near;
 for(const f of [from,to])ctx.drawImage(trail,f.x-92,f.y-30,184,66);
 ctx.restore();
}
