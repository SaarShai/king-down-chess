// How a piece taken by a king dies, by the king who takes it (opt-in: scene.setLively({captures:true})).
//   frost   ice climbs up the piece from its feet, crystals grow round it, and it is pulled down into a frozen patch
//   flame   lava climbs up the piece (a crust with glowing seams, a white-hot edge, drips) and a bubbling
//           pool pulls it under, with sparks, heat and smoke
//   mud     the soil cracks and opens; thick thorny brown vines with leaves wind round the piece, tug, and
//           pull it down into the earth, which closes over it (colours: mud-palette.mjs)
//   shadow  a big crack opens across the square; bony arms reach out of it, take the piece by the body
//           and pull it down; the crack closes
//   spirit  the piece turns into a glowing silhouette of itself (white for the ivory king, black for the
//           charcoal one), squeezes to a point and bursts (fx-kings.mjs)
//   stratus a whirlwind lifts the piece off its square, spinning, and a gust throws it over the other
//           pieces and off the board past its edge, where it fades out (the blue curled gusts of his emblem;
//           near an edge back over the king, on the back rank along the band above the board)
// The king's own motion is blows.mjs KING_BLOW; these effects start at its strike. Times are ms on the blow's clock, after
// the strike; with a painted attack that clock fits `end` into the time after the painted contact, at least KING_DEATH_MS.
// Units are board units (the board is 960 wide).
import {clamp} from './painted-mesh.mjs';
import {LEAF_GRADIENT,VINE} from './mud-palette.mjs';
import {windArc,windStroke} from './wind-art.mjs';
import {bandRadius,bodySpan,flameTongues,frostDeath,funnel,funnelBody,funnelDust,heatLight,onBoardFloor,shadowDeath,spiritFlash,spiritMotes,spiritSquash} from './fx-kings.mjs';

export const DEATHS={
 frost:{climb:380,sink:[450,850],end:1000},
 flame:{climb:420,sink:[470,880],end:1000},
 mud:{climb:430,sink:[520,770],end:1000},
 shadow:{open:220,hands:[120,360],sink:[380,760],close:[760,960],end:980},
 spirit:{fill:260,implode:[380,640],flash:[600,900],end:900},
 // above: from this time (ms), or while this test of the death holds, the scene draws the piece over every
 // figure (it is in the air); what stays on the floor still draws in its own place (d.part 'back', then 'front').
 stratus:{gust:120,lift:[60,420],throw:[420,900],end:960,above:d=>throwAbove(d)},
};
export const THEMED=Object.keys(DEATHS);
const TAU=Math.PI*2;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const easeIn=t=>{t=clamp(t,0,1);return t*t*t;};
const span=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const frac=x=>x-Math.floor(x);
const rand=(i,j=0)=>{const x=Math.sin(i*127.1+j*311.7+.5)*43758.5453;return x-Math.floor(x);};
// A small canvas for soft glows (an eighth of the board).
let glowCanvas=null;

/**
 * Draws a dying piece. d: {theme, side (the king's army), t (ms since the strike), foot, top (y of its
 * highest point), shape (its outline: [{y, l, r}] rows, bottom first), hit (its middle), size and headroom (the board's), draw(ctx, {dy, q, wobble}) (draws the
 * piece into the effect layer, dy below its square, scaled by q about its middle), clear() (empties the
 * effect layer and returns its context), layer(clip) (puts the effect layer on the board; nothing shows
 * below y = clip)}.
 * out is the board context, at board units.
 */
export function drawDeath(out,d){
 const D=DEATHS[d.theme],t=d.t;
 if(t>=D.end)return;
 if(d.theme==='spirit')return implode(out,d);
 if(d.theme==='stratus')return throwOff(out,d);
 if(d.theme==='shadow')return shadowDeath(out,d,D);
 if(d.theme==='flame')return flameDeath(out,d);
 if(d.theme==='mud')return mudDeath(out,d);
 frostDeath(out,d,D);
}

// —— Shared ——
// The victim's edges at height y (board units; from its outline, d.shape), shifted down by dy.
function edges(d,y,dy=0){
 const rows=d.shape;if(!rows?.length)return {l:d.foot.x-18,r:d.foot.x+18};
 const yy=y-dy;let best=rows[0];
 for(const row of rows)if(Math.abs(row.y-yy)<Math.abs(best.y-yy))best=row;
 return {l:best.l,r:best.r};
}
// A tileable crust texture: plates (Voronoi cells) with glowing seams between them. Made once.
let crustPattern=null;
function crust(ctx){
 if(crustPattern)return crustPattern;
 const n=128,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),img=g.createImageData(n,n),pts=[];
 for(let i=0;i<14;i++)pts.push([rand(i,90)*n,rand(i,91)*n]);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  let d1=1e9,d2=1e9;
  for(const [px,py] of pts)for(const ox of [-n,0,n])for(const oy of [-n,0,n]){const ex=x-px-ox,ey=y-py-oy,dd=ex*ex+ey*ey;if(dd<d1){d2=d1;d1=dd;}else if(dd<d2)d2=dd;}
  d1=Math.sqrt(d1);d2=Math.sqrt(d2);
  const seam=clamp(1-(d2-d1)/5,0,1),o=(y*n+x)*4,heat=seam**1.6;
  // Seams: hot yellow; plates: dark crust, a little lighter at their middles.
  img.data[o]=Math.round(60+195*heat);img.data[o+1]=Math.round(18+180*heat**1.4);img.data[o+2]=Math.round(10+70*heat**3);img.data[o+3]=Math.round(255*(.62+.38*heat)*(1-.35*clamp(d1/22,0,1)*(1-heat)));
 }
 g.putImageData(img,0,0);crustPattern=ctx.createPattern(c,'repeat');return crustPattern;
}
// Smooth tileable noise for hot spots in the lava (bright where high, clear where low). Made once.
let hotPattern=null;
function hot(ctx){
 if(hotPattern)return hotPattern;
 const n=96,cells=4,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),img=g.createImageData(n,n);
 const at=(x,y)=>rand(((y%cells+cells)%cells)*cells+((x%cells+cells)%cells),95),sm=t=>t*t*(3-2*t);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const fx=x/n*cells,fy=y/n*cells,ix=Math.floor(fx),iy=Math.floor(fy),tx=sm(fx-ix),ty=sm(fy-iy);
  const v=clamp(((at(ix,iy)*(1-tx)+at(ix+1,iy)*tx)*(1-ty)+(at(ix,iy+1)*(1-tx)+at(ix+1,iy+1)*tx)*ty-.35)/.65,0,1)**1.4,o=(y*n+x)*4;
  img.data[o]=255;img.data[o+1]=Math.round(120+120*v);img.data[o+2]=Math.round(30+60*v);img.data[o+3]=Math.round(255*v);
 }
 g.putImageData(img,0,0);hotPattern=ctx.createPattern(c,'repeat');return hotPattern;
}
// A ragged leading edge across the victim at `level`, with drips hanging down from it.
function edgePath(c,d,level,dy,t,{amp=5,drips=5,seed=2,bottom}){
 const b=bodySpan(d),x0=b.l-14,x1=b.r+14,n=Math.max(24,Math.round((x1-x0)/5)),pts=[];
 for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;pts.push([x,level+(rand(seed,i)-.5)*amp+Math.sin(i/n*TAU*2.5+t/160+seed)*amp*.5]);}
 c.beginPath();c.moveTo(x0,bottom);
 for(const [x,y] of pts)c.lineTo(x,y);
 c.lineTo(x1,bottom);c.closePath();
 // Drips: tongues of lava running down from the edge (they hang into the coat, so add them to the path).
 for(let i=0;i<drips;i++){
  const x=x0+20+(x1-x0-40)*rand(seed,40+i),l=6+10*rand(seed,50+i)+4*Math.sin(t/200+i),w=1.6+1.6*rand(seed,60+i),y=level-1;
  c.moveTo(x-w,y);c.quadraticCurveTo(x-w,y-l*.15,x,y-l*-.05);c.quadraticCurveTo(x+w,y-l*.15,x+w,y);
 }
 return pts;
}

// —— Flame ——
// How much of the piece's own light and shade shows through the lava: an ivory piece (taken by the
// charcoal king, side 1) is light, so less.
const s0=kingSide=>kingSide?.18:.4;
// Lava climbs up the piece (a crust of dark plates with glowing seams, flowing down, a white-hot edge
// with drips), a lava pool spreads and bubbles under it, sparks and smoke rise, and the pool pulls it under.
function flameDeath(out,d){
 const D=DEATHS.flame,t=d.t,climb=ease(t/D.climb),sink=easeIn(span(t,...D.sink)),height=d.foot.y-d.top;
 const open=ease(t/220),cool=span(t,D.sink[1]-40,D.end),fade=1-span(t,D.end-120,D.end);
 heatLight(out,d,open*(1-cool)*fade,height);
 lavaPool(out,d,open,cool,fade,t);
 flameTongues(out,d,t,open*(1-cool)*fade,false,ease(t/300)*(1-sink*.75));
 if(t<D.sink[1]){
  const dy=sink*(height+16),c=d.clear(),level=d.foot.y+dy-height*climb*1.1;
  d.draw(c,{dy});
  c.save();c.globalCompositeOperation='source-atop';
  const pts=edgePath(c,d,level,dy,t,{amp:6,drips:0,seed:2,bottom:d.foot.y+dy+30});
  c.save();c.clip();
  const b=bodySpan(d),x0=b.l-14,W=b.r-b.l+28,top=level-12,h=d.foot.y+dy-top+40;
  // Molten colours: a narrow white-hot band at the edge, orange, then deep red at the feet.
  const g=c.createLinearGradient(0,level,0,d.foot.y+dy);g.addColorStop(0,'#fff4c4');g.addColorStop(.05,'#ffc24c');g.addColorStop(.22,'#f2701e');g.addColorStop(.6,'#bd3410');g.addColorStop(1,'#5c1205');
  // The piece turns molten but keeps some of its own light and shade (so it keeps its form): the flat lava
  // colour, the piece again in luminosity mode (it paints only where the piece is), the lava again on top.
  c.fillStyle=g;c.fillRect(x0,top,W,h);
  c.globalCompositeOperation='luminosity';c.globalAlpha=s0(d.side);d.draw(c,{dy});
  c.globalCompositeOperation='source-atop';c.globalAlpha=.55;c.fillRect(x0,top,W,h);
  // A thin crust of dark plates with glowing seams that forms as it cools, flowing slowly down…
  c.globalCompositeOperation='source-atop';
  const p=crust(c);p.setTransform?.(new DOMMatrix().translate(d.foot.x*.3,(t*.03)%128+level*.2).scale(.22));
  c.globalAlpha=.6;c.fillStyle=p;c.fillRect(x0,level+12,W,h);c.fillRect(x0,level+30,W,h);
  // …and hot spots flowing down through it.
  const q=hot(c);q.setTransform?.(new DOMMatrix().translate(d.foot.x*.5,(t*.05)%96).scale(.8));
  c.globalAlpha=.55;c.fillStyle=q;c.fillRect(x0,level,W,h);
  // Drips of brighter lava running down from the edge.
  c.globalAlpha=1;c.lineCap='round';c.globalCompositeOperation='source-atop';
  for(let i=0;i<6;i++){
   const x=b.l+(b.r-b.l)*rand(i,40),run=(12+20*rand(i,41))*(.5+.5*Math.sin(t/260+i*1.3)**2),y=level+1;
   c.strokeStyle='rgba(255,150,40,.85)';c.lineWidth=3.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+.6,y+run);c.stroke();
   c.strokeStyle='rgba(255,240,170,.95)';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+.6,y+run*.85);c.stroke();
  }
  c.restore();
  // The white-hot edge.
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle='rgba(214,84,16,.8)';c.lineWidth=5;c.stroke();c.strokeStyle='rgba(255,246,196,.98)';c.lineWidth=2;c.stroke();
  c.restore();
  d.layer(d.foot.y+1);
  // Where it goes in: a molten ring and a lifted lip over the cut.
  const e=edges(d,d.foot.y-2),w=(e.r-e.l)/2+5,cx=(e.l+e.r)/2;
  out.save();out.globalAlpha=open*fade;
  const ring=out.createRadialGradient(cx,d.foot.y,0,cx,d.foot.y,w);ring.addColorStop(0,'rgba(255,214,110,.0)');ring.addColorStop(.7,'rgba(255,170,60,.85)');ring.addColorStop(1,'rgba(150,40,10,0)');
  out.fillStyle=ring;out.beginPath();out.ellipse(cx,d.foot.y,w,3.6+2*sink,0,0,Math.PI);out.fill();
  out.restore();
 }
 flameTongues(out,d,t,open*(1-cool)*fade,true,ease(t/240)*(1-sink*.75));
 bubbles(out,d,open*fade,t);
 sparks(out,d,t,fade);
 smoke(out,d,t,height,fade);
}
function lavaPool(out,d,open,cool,fade,t){
 if(open<=.01||fade<=0)return;
 const b=bodySpan(d),rx=clamp((b.r-b.l)/2+16,46,62)*open,ry=rx*.31,x=d.foot.x,y=d.foot.y-2;
 out.save();out.globalAlpha=fade;
 // A charred ring of stone round it.
 out.fillStyle='rgba(30,14,8,.75)';out.beginPath();out.ellipse(x,y,rx+5,ry+2.4,0,0,TAU);out.fill();
 out.beginPath();
 for(let i=0;i<=28;i++){const a=i/28*TAU,j=1+.08*Math.sin(a*5+1)+.05*Math.sin(a*9);out.lineTo(x+Math.cos(a)*rx*j,y+Math.sin(a)*ry*j);}
 out.closePath();out.save();out.clip();
 const g=out.createRadialGradient(x,y,0,x,y,rx);g.addColorStop(0,'#fff1a8');g.addColorStop(.35,'#ffa63a');g.addColorStop(.75,'#d8461a');g.addColorStop(1,'#6a1406');
 out.save();out.translate(x,y);out.scale(1,ry/rx);out.translate(-x,-y);out.fillStyle=g;out.fillRect(x-rx,y-rx,2*rx,2*rx);out.restore();
 // Crust plates drifting on it, closing up as it cools.
 const p=crust(out);p.setTransform?.(new DOMMatrix().translate(x+(t*.01)%128,y).scale(.26,.12));
 out.globalAlpha=fade*(.35+.55*cool);out.fillStyle=p;out.fillRect(x-rx,y-ry,2*rx,2*ry);
 const q=hot(out);q.setTransform?.(new DOMMatrix().translate(x+(t*.02)%96,y+(t*.01)%96).scale(.5,.2));
 out.globalCompositeOperation='lighter';out.globalAlpha=fade*(1-cool)*.5;out.fillStyle=q;out.fillRect(x-rx,y-ry,2*rx,2*ry);out.globalCompositeOperation='source-over';
 out.globalAlpha=fade*cool*.8;out.fillStyle='#2a0f07';out.fillRect(x-rx,y-ry,2*rx,2*ry);
 out.restore();
 // A hot rim.
 out.globalAlpha=fade*(1-cool)*.9;out.strokeStyle='rgba(255,190,90,.9)';out.lineWidth=1.2;out.beginPath();out.ellipse(x,y,rx*.98,ry*.98,0,Math.PI*1.05,Math.PI*1.95);out.stroke();
 out.restore();
}
function bubbles(out,d,k,t){
 if(k<=.01)return;
 out.save();
 for(let i=0;i<7;i++){
  const life=380+140*rand(i,20),start=60+i*95,u=(t-start)/life;if(u<0||u>1.25)continue;
  const x=d.foot.x+(rand(i,21)*2-1)*34,y=d.foot.y-2+(rand(i,22)*2-1)*8,r=1.4+2.6*rand(i,23);
  if(u<1){const s=r*ease(u/.8);out.globalAlpha=k;out.fillStyle='#ff9b34';out.beginPath();out.ellipse(x,y-s*.4,s,s*.75,0,0,TAU);out.fill();
   out.fillStyle='rgba(255,246,190,.9)';out.beginPath();out.arc(x-s*.35,y-s*.7,s*.32,0,TAU);out.fill();}
  else{const p=(u-1)/.25;out.globalAlpha=k*(1-p);out.strokeStyle='#ffd27a';out.lineWidth=.8;out.beginPath();out.ellipse(x,y,r*(1+2*p),r*.6*(1+2*p),0,0,TAU);out.stroke();
   out.fillStyle='#ffb24a';for(let j=0;j<3;j++){const a=-Math.PI/2+(j-1)*.8;out.beginPath();out.arc(x+Math.cos(a)*r*(1+3*p),y-r*2*p*(1.2-p)+Math.sin(a)*r*p,.7,0,TAU);out.fill();}}
 }
 out.restore();
}
function sparks(out,d,t,fade){
 // In plain paint: 'lighter' turns them white and lost on the cream squares.
 out.save();out.lineCap='round';
 for(let i=0;i<22;i++){
  const start=40*i+30*rand(i,3),u=clamp((t-start)/(520+300*rand(i,6)),0,1);if(u<=0||u>=1)continue;
  const x0=d.foot.x+(rand(i,3)*2-1)*40,rise=(70+90*rand(i,4))*u,x=x0+Math.sin(u*5+i)*6*u+(rand(i,7)-.5)*24*u,y=d.foot.y-3-rise;
  const flick=.7+.3*Math.sin(t/30+i*1.7);out.globalAlpha=Math.min(1,(1-u)*1.5)*fade*flick;
  const dx=-(rand(i,7)-.5)*4;
  out.strokeStyle='#c8430e';out.lineWidth=3.4+rand(i,5);out.beginPath();out.moveTo(x,y);out.lineTo(x+dx,y+7);out.stroke();
  out.strokeStyle=i%3?'#ffb13b':'#fff0a8';out.lineWidth=1.8+rand(i,5)*.8;out.beginPath();out.moveTo(x,y);out.lineTo(x+dx,y+6);out.stroke();
 }
 out.restore();
}
function smoke(out,d,t,height,fade){
 out.save();
 for(let i=0;i<7;i++){
  const u=clamp((t-120-90*i)/700,0,1);if(u<=0||u>=1)continue;
  const x=d.foot.x+(rand(i,30)*2-1)*20+Math.sin(u*4+i)*6,y=d.foot.y-height*.4-u*60;
  const r=6+12*u,g=out.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(58,48,42,.55)');g.addColorStop(1,'rgba(58,48,42,0)');
  out.globalAlpha=.6*Math.sin(Math.PI*u)*fade;out.fillStyle=g;out.beginPath();out.arc(x,y,r,0,TAU);out.fill();
 }
 out.restore();
}

// —— Mud ——
// The soil cracks round its feet and opens; thick thorny vines with leaves come up and wind round it
// (behind and in front of it), tug once, and pull it down into the earth, which closes over it.
function vineSpecs(d){
 const out=[];
 for(let i=0;i<5;i++)out.push({a0:i/5*TAU+rand(i,1)*.6,turns:.8+.6*rand(i,2),dir:i%2?1:-1,width:5.4+1.6*rand(i,3),stagger:.12*rand(i,4),seed:i+1,reach:[1.04,.82,.96,.7,.9][i]});
 return out;
}
// Points along one vine (bottom first) at growth g; each {x, y, front, w, n (normal x)}.
function vinePath(d,v,g,dy,height){
 const raw=[],N=40,len=Math.max(0,g*v.reach);
 // The piece's half-width along its height, smoothed (a spear or a shield would make the vine jump out).
 const halfAt=[];for(let i=0;i<=N;i++){const e=edges(d,d.foot.y+2-i/N*height*1.02);halfAt.push([(e.l+e.r)/2,(e.r-e.l)/2]);}
 const sm=i=>{let c=0,h=0,n=0;for(let j=Math.max(0,i-4);j<=Math.min(N,i+4);j++){c+=halfAt[j][0];h+=halfAt[j][1];n++;}return [c/n,h/n];};
 for(let i=0;i<=N;i++){
  const f=i/N;if(f>len)break;
  // Not a perfect spiral: the turn speeds up and slows, and the vine stands off the body a little here and there.
  const [cx,hw]=sm(i),y=d.foot.y+2-f*height*1.02,r=hw+1.6+1.8*Math.sin(f*7+v.seed),th=v.a0+v.dir*(v.turns*TAU*f+.7*Math.sin(f*4+v.seed*2));
  raw.push({x:cx+Math.sin(th)*r,y:y+dy+Math.cos(th)*2.4,front:Math.cos(th)>0,w:v.width*(1-.5*f)});
 }
 // Rounded into a smooth curve (two passes of corner cutting), so no straight runs or sharp elbows.
 let pts=raw;
 for(let k=0;k<2&&pts.length>2;k++){
  const out=[pts[0]];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],mix=(u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,w:a.w+(b.w-a.w)*u,front:u<.5?a.front:b.front});out.push(mix(.25),mix(.75));}
  out.push(pts.at(-1));pts=out;
 }
 return pts;
}
function strokeVine(c,pts,front){
 // Runs of segments on one side (front or behind the piece), drawn as outline, body and highlight.
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const [colour,widen,dx,dy] of [[VINE.outline,2,0,0],[VINE.body,0,0,0],[VINE.lit,-.5,-.6,-.8]]){
  c.strokeStyle=colour;
  for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i];if(a.front!==front&&b.front!==front)continue;
   c.lineWidth=Math.max(.5,widen<0?b.w*-widen*.55:b.w+widen);c.beginPath();c.moveTo(a.x+dx,a.y+dy);c.lineTo(b.x+dx,b.y+dy);c.stroke();
  }
 }
 c.restore();
}
function vineDetails(c,pts,front,v){
 // Thorns on its outer side and leaves every few points, opening as the vine passes them.
 for(let i=2;i<pts.length-1;i++){
  const p=pts[i];if(p.front!==front)continue;
  const q=pts[i+1],a=Math.atan2(q.y-p.y,q.x-p.x),side=i%2?1:-1,nx=Math.cos(a+side*Math.PI/2),ny=Math.sin(a+side*Math.PI/2);
  if(i%9===3){
   // A thorn: a curved hook out of the stem's side, pale bone with an ink edge.
   const r=p.w*.5+.2,bx=p.x+nx*r,by=p.y+ny*r,tx=bx+nx*7+Math.cos(a)*2.6,ty=by+ny*7+Math.sin(a)*2.6;
   c.fillStyle=VINE.thorn;c.strokeStyle=VINE.outline;c.lineWidth=.9;c.beginPath();
   c.moveTo(bx-Math.cos(a)*2.6,by-Math.sin(a)*2.6);c.quadraticCurveTo(bx+nx*4-Math.cos(a)*.2,by+ny*4-Math.sin(a)*.2,tx,ty);c.lineTo(bx+Math.cos(a)*2.6,by+Math.sin(a)*2.6);c.closePath();c.fill();c.stroke();
  }
  if(i%13===5){
   const open=Math.min(1,(pts.length-1-i)/5);if(open<.05)continue;
   const la=a+side*(1+.3*rand(v.seed,i)),L=15*open*(.8+.4*rand(v.seed,i+9));
   c.save();c.translate(p.x+nx*p.w*.4,p.y+ny*p.w*.4);c.rotate(la);
   const g=c.createLinearGradient(0,0,L,0);g.addColorStop(0,LEAF_GRADIENT[0]);g.addColorStop(1,LEAF_GRADIENT[1]);
   c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(L*.3,-L*.42,L*.8,-L*.3,L,0);c.bezierCurveTo(L*.8,L*.3,L*.3,L*.42,0,0);c.fill();
   c.strokeStyle='rgba(43,38,33,.8)';c.lineWidth=.55;c.beginPath();c.moveTo(.6,0);c.lineTo(L*.9,0);c.stroke();
   c.strokeStyle='rgba(43,38,33,.8)';c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(L*.3,-L*.42,L*.8,-L*.3,L,0);c.bezierCurveTo(L*.8,L*.3,L*.3,L*.42,0,0);c.stroke();
   c.restore();
  }
 }
 // A tendril curling at the growing tip.
 const t=pts.at(-1),b=pts.at(-2);
 if(t&&b&&t.front===front){const a=Math.atan2(t.y-b.y,t.x-b.x);c.strokeStyle=VINE.tendril;c.lineWidth=1;c.beginPath();for(let k=0;k<=12;k++){const r=4*(1-k/14),th=a+v.dir*k*.55;const x=t.x+Math.cos(th)*r-Math.cos(a)*4,y=t.y+Math.sin(th)*r-Math.sin(a)*4;k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
}
function mudDeath(out,d){
 const D=DEATHS.mud,t=d.t,height=d.foot.y-d.top,grow=ease(t/D.climb);
 // A tug (down and back) when they have hold of it, then the pull.
 // (Ease in and out: it is fully under at the end of the sink, never a tip left showing in the hole.)
 const tug=Math.sin(Math.PI*span(t,D.climb,D.sink[0]))*4,pull=ease(span(t,...D.sink)),dy=tug+pull*(height+16);
 // The earth closes over it: the hole shuts after the sink, then the mound, its sprouts and the cracks settle away.
 const open=ease(t/260)*(1-ease(span(t,D.sink[1],D.sink[1]+120))),fade=1-ease(span(t,D.end-190,D.end));
 onBoardFloor(out,d,()=>soilCracks(out,d,ease(t/300)*fade));
 earthHole(out,d,open,fade);
 if(t<D.sink[1]){
  const c=d.clear(),vs=vineSpecs(d),paths=vs.map(v=>vinePath(d,v,clamp((grow-v.stagger)/(1-v.stagger),0,1),dy,height));
  vs.forEach((v,i)=>{strokeVine(c,paths[i],false);vineDetails(c,paths[i],false,v);});
  d.draw(c,{dy});
  vs.forEach((v,i)=>{strokeVine(c,paths[i],true);vineDetails(c,paths[i],true,v);});
  d.layer(d.foot.y+1);
  holeLip(out,d,open,fade);
 }
 clods(out,d,t,fade);
 if(t>=D.sink[1])mound(out,d,span(t,D.sink[1],D.sink[1]+160),fade);
}
function soilCracks(out,d,k){
 if(k<=.01)return;
 out.save();out.lineJoin='miter';
 for(let i=0;i<7;i++){
  // A jagged line out from the hole (sharp turns), drawn as a wedge: widest at the hole, to a point.
  let a=i/7*TAU+rand(i,70)*.6,x=d.foot.x+Math.cos(a)*18,y=d.foot.y-2+Math.sin(a)*6;const pts=[[x,y]],L=(30+22*rand(i,71))*k;
  for(let j=0;j<5;j++){a+=(j%2?1:-1)*(.5+.4*rand(i,72+j));x+=Math.cos(a)*L/5;y+=Math.sin(a)*L/5*.34;pts.push([x,y]);}
  const left=[],right=[];
  pts.forEach(([px,py],j)=>{const q=pts[Math.min(j+1,pts.length-1)],p0=pts[Math.max(j-1,0)],ang=Math.atan2(q[1]-p0[1],q[0]-p0[0]),w=(2.8*(1-j/(pts.length-1))+.2)*k;left.push([px+Math.cos(ang+Math.PI/2)*w,py+Math.sin(ang+Math.PI/2)*w*.6]);right.push([px-Math.cos(ang+Math.PI/2)*w,py-Math.sin(ang+Math.PI/2)*w*.6]);});
  // The far lip catches the light; the gap is dark.
  // (A thin lit lip on the far side only: on dark wood a wide pale one read as a twig.)
  out.fillStyle='rgba(226,206,168,.2)';out.beginPath();left.forEach(([px,py],j)=>j?out.lineTo(px,py-.7):out.moveTo(px,py-.7));for(let j=left.length-1;j>=0;j--)out.lineTo(left[j][0],left[j][1]+.2);out.closePath();out.fill();
  out.fillStyle='rgba(12,7,3,.95)';out.beginPath();left.forEach(([px,py],j)=>j?out.lineTo(px,py):out.moveTo(px,py));for(let j=right.length-1;j>=0;j--)out.lineTo(...right[j]);out.closePath();out.fill();
 }
 out.restore();
}
function earthHole(out,d,open,fade){
 if(open<=.01)return;
 const e=edges(d,d.foot.y-2),rx=Math.max(32,(e.r-e.l)/2+14)*open,ry=rx*.32,x=d.foot.x,y=d.foot.y-1;
 out.save();out.globalAlpha=fade;
 const g=out.createRadialGradient(x,y,0,x,y,rx);g.addColorStop(0,'#0d0803');g.addColorStop(.7,'#2a1a0a');g.addColorStop(1,'#4a3218');
 out.translate(x,y);out.scale(1,ry/rx);out.translate(-x,-y);out.fillStyle=g;out.beginPath();
 for(let i=0;i<=24;i++){const a=i/24*TAU,j=1+.07*Math.sin(a*6+2);out.lineTo(x+Math.cos(a)*rx*j,y+Math.sin(a)*rx*j);}
 out.fill();out.restore();
}
function holeLip(out,d,open,fade){
 if(open<=.01)return;
 const e=edges(d,d.foot.y-2),rx=Math.max(32,(e.r-e.l)/2+14)*open,ry=rx*.32,x=d.foot.x,y=d.foot.y-1;
 out.save();out.globalAlpha=fade;out.lineCap='round';
 // The near rim of earth over the line where the piece goes in: a soft heaped bank, uneven, lit on top.
 out.beginPath();
 for(let i=0;i<=20;i++){const a=(.04+.92*i/20)*Math.PI,j=1+.06*Math.sin(i*1.7+1);out.lineTo(x+Math.cos(a)*rx*j,y+Math.sin(a)*ry*j-1.6);}
 for(let i=20;i>=0;i--){const a=(.04+.92*i/20)*Math.PI,j=1+.05*Math.sin(i*2.3);out.lineTo(x+Math.cos(a)*rx*j,y+Math.sin(a)*ry*j+1.8);}
 out.closePath();
 const g=out.createLinearGradient(0,y+ry-3,0,y+ry+3);g.addColorStop(0,'#7a5a34');g.addColorStop(1,'#4a3016');
 out.fillStyle=g;out.fill();
 out.strokeStyle='rgba(150,118,76,.6)';out.lineWidth=.9;out.beginPath();out.ellipse(x,y-1.6,rx*.98,ry*.98,0,.1*Math.PI,.9*Math.PI);out.stroke();
 out.restore();
}
function clods(out,d,t,fade){
 out.save();
 for(let i=0;i<10;i++){
  const start=(i<5?40:560)+25*i,u=clamp((t-start)/360,0,1);if(u<=0||u>=1)continue;
  const a=(rand(i,60)*2-1)*1.2,v=22+18*rand(i,61),x=d.foot.x+Math.sin(a)*v*u*1.9,y=d.foot.y-3-v*2.2*u+v*2.4*u*u;
  out.globalAlpha=fade*(1-u*u);out.fillStyle=i%2?'#5b3f1f':'#3e2a14';out.beginPath();out.ellipse(x,y,2.6+2*rand(i,62),1.9+1.4*rand(i,63),u*3,0,TAU);out.fill();
 }
 out.restore();
}
function mound(out,d,u,fade){
 out.save();out.globalAlpha=fade;
 const x=d.foot.x,y=d.foot.y-2,rx=26*(1-.3*u),ry=6;
 // (u: 0 → 1 as the sprouts come up.)
 const g=out.createRadialGradient(x,y-2,0,x,y,rx);g.addColorStop(0,'#6a4824');g.addColorStop(.7,'#4a3016');g.addColorStop(1,'rgba(74,48,22,0)');
 out.fillStyle=g;out.beginPath();out.ellipse(x,y,rx,ry,0,0,TAU);out.fill();
 // Three sprouts come up out of the fresh earth: a stem and two leaves each, with an ink edge.
 const up=ease(u);if(up<.12){out.restore();return;}
 for(const [dx,h,lean] of [[-9,14,-.25],[1,19,.05],[10,13,.3]]){
  const tx=x+dx+lean*h*up,ty=y-2-h*up;
  out.strokeStyle=VINE.outline;out.lineWidth=2.6;out.lineCap='round';out.beginPath();out.moveTo(x+dx,y-1);out.quadraticCurveTo(x+dx,ty+h*.3,tx,ty);out.stroke();
  out.strokeStyle=LEAF_GRADIENT[1];out.lineWidth=1.4;out.beginPath();out.moveTo(x+dx,y-1);out.quadraticCurveTo(x+dx,ty+h*.3,tx,ty);out.stroke();
  for(const side of [-1,1]){out.save();out.translate(tx,ty);out.rotate(-Math.PI/2+side*.9+lean);out.scale(up,up);
   out.fillStyle=LEAF_GRADIENT[1];out.strokeStyle='rgba(43,38,33,.85)';out.lineWidth=.6;out.beginPath();out.moveTo(0,0);out.quadraticCurveTo(5,-4.4,11,0);out.quadraticCurveTo(5,4.4,0,0);out.fill();out.stroke();out.restore();}
 }
 out.restore();
}

// —— Stratus ——
// A painted wind ribbon (wind-art.mjs) along an arc from (x, y) at `angle`, `len` long, bending by `bend`;
// shown from tail to head (0..1 each), its tips on the part that shows.
function gust(out,x,y,angle,len,bend,head,tail,alpha,i){
 if(alpha<=.01||head<=tail)return;
 const c=Math.cos(angle),s=Math.sin(angle),at=u=>{const f=tail+(head-tail)*u,b=bend*len*f*f*.5;return {x:x+c*len*f-s*b,y:y+s*len*f+c*b};};
 windStroke(out,at,11*Math.min(1,(head-tail)*len/45),alpha,i);
}
// Where the thrown piece is at d.t. Three ways off the board:
//   side  away from the king, over the board and past its edge, in an arc over the pieces in its way;
//   over  near an edge (less than 2.5 squares of room): the whirlwind first lifts it above the king's head,
//         then it is thrown the other way, over him, staying above his head until it is past him;
//   top   on the back rank (no room above for an arc): away from the king and up into the band above the
//         board, shrinking as it goes, over the heads of the pieces on the rank, and off past the far corner.
// It gets smaller as it goes (flying off, away from us) and fades out before the canvas edge.
function throwPath(d){
 const D=DEATHS.stratus,t=d.t,height=d.foot.y-d.top,headroom=d.headroom??64;
 const lift=ease(span(t,...D.lift)),fly=span(t,...D.throw),run0=fly*(.35+.65*fly);let q=1-.5*ease(fly);
 const board=d.board??{left:32,right:(d.size??960)-32},king=d.king??{x:d.foot.x-(d.away||1)*58,top:d.foot.y-140,l:d.foot.x-(d.away||1)*58-30,r:d.foot.x-(d.away||1)*58+30};
 let half=16;for(const row of d.shape??[])half=Math.max(half,(row.r-row.l)/2);
 let away=d.away||1;const room=side=>side>0?board.right-d.foot.x:d.foot.x-board.left;
 const mode=d.top+headroom<150?'top':room(away)<280?'over':'side';
 if(mode==='over')away=-away;
 const edge=(away>0?board.right:board.left)+away*26,dist=Math.abs(edge-d.foot.x);let run=(edge-d.foot.x)*run0;
 let up=0,corner=false;
 // The highest it may go at size qq: its top 6 units under the canvas's top.
 const band=qq=>-headroom+6-(d.hit.y+(d.top-d.hit.y)*qq);
 const liftH=mode==='over'?Math.max(34,d.foot.y-king.top+14):34;
 if(mode==='top'||(mode==='over'&&d.foot.y<300)){
  // In the band above the board: it shrinks to two fifths and rises quickly to the band (on the back rank,
  // or from the next rank back over the king), over the heads of the back rank, then flies along it.
  // It is up in the band before it moves along it much, so it clears the heads of the pieces next to it.
  q=1-.6*ease(Math.min(1,fly*2));
  const base=-liftH*lift,e=ease(Math.min(1,fly*3.2)),f=clamp((fly-.2)/.8,0,1);
  up=Math.max(band(q),base+(band(q)-base)*e);run=(edge-d.foot.x)*f*(.35+.65*f);
  // A short corner throw fades by its flight (it has only a square to go sideways); a long one by the edge.
  corner=dist<200;
 }else{
  // over: up above the king's head (with room for his crown) and kept there until it is past him.
  const peak=mode==='over'?Math.max(0,Math.min(40,d.top-liftH+headroom-30)):Math.max(30,Math.min(115,d.top+headroom-12-34));
  up=Math.max(band(q),-liftH*lift-peak*Math.sin(Math.PI*Math.min(1,fly*1.1)));
 }
 // It fades over the last 80 units of its way, past the board's edge (a short corner throw by its flight).
 const opacity=corner?1-ease(span(fly,.72,1)):1-ease(clamp((Math.abs(run)-(dist-80))/80,0,1));
 const spin=away*(.25*lift*Math.sin(t/60)*(1-fly)+2.2*fly*fly);
 const cx=d.hit.x+run,cy=d.hit.y+up,footY=d.hit.y+(d.foot.y-d.hit.y)*q+up,topY=d.hit.y+(d.top-d.hit.y)*q+up;
 return {mode,away,lift,fly,run,up,q,spin,opacity,half,height,king,cx,cy,footY,topY,px:d.foot.x+run};
}
// The piece goes over the other figures once it is clear of the king: beside him with a gap, or above his head.
// (Its turning reach is counted: half its width or height, whichever is more.)
// Bounds use the same unmirrored frame, pivot and scale as the painted king.
export function kingBodyBounds(shape,body,foot,scale=1){
 const k=body.scale*scale,w=body.image.naturalWidth||body.image.width,h=body.image.naturalHeight||body.image.height;
 return {x:foot.x,foot:foot.y,top:foot.y+(shape.top*h/shape.n-body.pivot[1])*k,l:foot.x+(shape.l*w/shape.n-body.pivot[0])*k,r:foot.x+((shape.r+1)*w/shape.n-body.pivot[0])*k};
}
export function throwAbove(d){
 const P=throwPath(d),k=P.king,reach=Math.max(P.half,P.height*.5)*P.q+4;
 if(P.fly<=0&&P.lift<.05)return false;
 return P.cx+reach<k.l||P.cx-reach>k.r||P.footY<k.top-4;
}
// d.part: 'back' (drawn in the piece's own place), 'front' (over every figure), or neither (all at once).
// d.above: the piece itself is over every figure now (throwAbove); before that it draws with the back part.
// The near halves of the rings always draw with the front part, so they never jump in front of a neighbour.
function throwOff(out,d){
 const D=DEATHS.stratus,t=d.t,back=d.part!=='front',front=d.part!=='back',P=throwPath(d);
 const pieceHere=d.part===undefined||(d.part==='back')!==!!d.above;
 const {away,lift,fly,run,up,q,spin,opacity,half,height,king,cx,cy,footY,px}=P,airborne=-up;
 const whirlK=ease(t/D.gust)*(1-.55*ease(span(t,D.throw[0],D.throw[1])))*opacity,wr=(Math.min(half,46)+12)*q;
 // The rings' near halves stop short of the king, wherever he is from the piece now.
 const kingSide=Math.sign(king.x-cx)||-away,clear={x:kingSide>0?Math.max(cx,king.l):Math.min(cx,king.r),side:kingSide};
 const nearKing=footY>king.top-4;
 if(back){
  // The floor: his downdraft's broken rings where it stood.
  const floorK=1-span(t,D.throw[0],D.throw[0]+260);
  funnelDust(out,d.foot.x,d.foot.y,t,bandRadius(Math.min(half,46)+12,2),ease(t/D.gust)*floorK);
  for(let i=0;i<2;i++){const p=clamp((t-i*140)/520,0,1),rx=10+40*ease(p),a=(1-p)*floorK*.85;if(p<=0||p>=1)continue;
   for(let j=0;j<3;j++){const a0=(i?-1:1)*(.6+1.6*p)+j*TAU/3;windArc(out,d.foot.x,d.foot.y-3,rx,rx*.3,a0,a0+1.2,8,a,i*3+j);}
  }
  // Its shadow on the board while it is in the air: dark enough for the dark wood, smaller the higher it is.
  if(t<D.end&&opacity>.01){
   const k=clamp(1-airborne/220,.45,1),r=half*1.3*q*(.6+.4*k);
   const g=out.createRadialGradient(px,d.foot.y-2,0,px,d.foot.y-2,r);g.addColorStop(0,'rgba(14,9,4,.7)');g.addColorStop(.6,'rgba(14,9,4,.35)');g.addColorStop(1,'rgba(14,9,4,0)');
   out.save();out.globalAlpha=opacity*k;out.translate(px,d.foot.y-2);out.scale(1,.3);out.translate(-px,-(d.foot.y-2));out.fillStyle=g;out.beginPath();out.arc(px,d.foot.y-2,r,0,TAU);out.fill();out.restore();
  }
  // The back halves of the whirlwind's rings stay behind whoever stands in front.
  funnelBody(out,cx,footY,height*1.05*q,wr,whirlK);
  funnel(out,cx,footY,height*1.05*q,wr,t,whirlK,false);
 }
 if(pieceHere){
  // The gust that throws it: curled streaks from just behind it, racing ahead the way it goes, again and
  // again while it flies, drawn behind the piece so it stays readable, and never over the king.
  if(fly>0){
   out.save();out.beginPath();out.rect(-200,-400,(d.size??960)+400,(d.size??960)+800);out.rect(king.l-4,king.top-8,king.r-king.l+8,king.foot-king.top+12);out.clip('evenodd');
   for(let i=0;i<4;i++){
    const ph=frac(fly*2.4+i*.27),yy=cy+(i-1.5)*height*.26*q,len=(52+24*rand(i,40))*q+20,x0=cx-away*(Math.min(half,22)*q+6);
    const head=clamp(ph*1.7,0,1),tail=clamp(ph*1.7-.7,0,1),dir=away>0?-.08+.16*rand(i,42):Math.PI+.08-.16*rand(i,42);
    const gx=x0,gy=yy;
    gust(out,gx,gy,dir,len,(rand(i,43)-.5)*.5,head,tail,.9*opacity*ease(fly*6),i);
   }
   out.restore();
  }
  if(t<D.end&&opacity>.01){const c=d.clear();d.draw(c,{dx:run,dy:up,q,spin});c.globalCompositeOperation='destination-in';c.globalAlpha=opacity;c.fillStyle='#000';c.fillRect(-100,-200,d.size+200,d.size+400);c.globalCompositeOperation='source-over';c.globalAlpha=1;d.layer(Infinity);}
 }
 // The front halves of the rings, thinning as it flies so the piece shows through.
 if(front)funnel(out,cx,footY,height*1.05*q,wr,t,whirlK*(1-.6*fly),true,nearKing?clear:null);
}

// —— Spirit ——
function implode(out,d){
 const D=DEATHS.spirit,t=d.t,fill=ease(t/D.fill),u=span(t,...D.implode),squash=spiritSquash(t,D),light=!d.side;
 // The charcoal king's: warm black (the palette's), with a dark soft glow round it, nothing pale.
 const colour=light?'255,250,236':'18,15,12',glow=light?'255,226,150':'18,15,12';
 if(t<D.implode[1]){
  const c=d.clear(),h=d.hit;
  c.save();c.translate(h.x,h.y);c.scale(squash.x,squash.y);c.translate(-h.x,-h.y);d.draw(c);c.restore();
  // A trace of its own form stays until it is pulled in.
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(${colour},${fill*(.96+.04*u)})`;c.fillRect(d.hit.x-120,d.top-60,240,d.foot.y-d.top+120);c.restore();
  // A soft glow from a small copy of the silhouette, added round it.
  const n=d.size/8;glowCanvas??=document.createElement('canvas');if(glowCanvas.width!==n){glowCanvas.width=n;glowCanvas.height=Math.round(n*(d.size+d.headroom)/d.size);}
  const g=glowCanvas.getContext('2d');g.clearRect(0,0,glowCanvas.width,glowCanvas.height);g.drawImage(c.canvas,0,0,glowCanvas.width,glowCanvas.height);
  g.globalCompositeOperation='source-in';g.fillStyle=`rgb(${glow})`;g.fillRect(0,0,glowCanvas.width,glowCanvas.height);g.globalCompositeOperation='source-over';
  out.save();out.globalCompositeOperation=light?'lighter':'source-over';out.globalAlpha=fill*(light?.9:.55)*(.6+.4*(1-u));
  // The layer covers the board and its headroom; drawn again a little larger about the piece's middle.
  for(const s of [1,1.12])out.drawImage(glowCanvas,d.hit.x-d.hit.x*s,d.hit.y-(d.hit.y+d.headroom)*s,d.size*s,(d.size+d.headroom)*s);
  out.restore();
  d.layer(Infinity);
 }
 if(light)spiritMotes(out,d,t);
 spiritFlash(out,d,span(t,...D.flash),light);
}
