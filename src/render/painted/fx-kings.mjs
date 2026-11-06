// Stronger parts of the kings' capture deaths (king-captures.mjs holds the DEATHS times and the rest): shapes
// large enough to read at game size, with an ink edge like the painted figures, on light and dark squares.
// All tables are made once; a frame allocates no canvas. Units are board units (a tile is 112).
import {clamp} from './painted-mesh.mjs';
import {BONE,drawCrack,drawHand} from './skeleton-hands.mjs';

const TAU=Math.PI*2;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const easeIn=t=>{t=clamp(t,0,1);return t*t*t;};
const span=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const rand=(i,j=0)=>{const x=Math.sin(i*127.1+j*311.7+.5)*43758.5453;return x-Math.floor(x);};

// How far the victim really reaches on each side (a spear, a hammer, a wide skirt), from its outline.
export function bodySpan(d){
 let l=d.foot.x-18,r=d.foot.x+18;
 for(const row of d.shape??[]){if(row.l<l)l=row.l;if(row.r>r)r=row.r;}
 return {l,r};
}
// Its edges at height y, as king-captures reads them.
function edgesAt(d,y){
 let best=null;
 for(const row of d.shape??[])if(!best||Math.abs(row.y-y)<Math.abs(best.y-y))best=row;
 return best??{l:d.foot.x-18,r:d.foot.x+18};
}
// Floor marks stay on the board: at the a and h files nothing runs over the frame.
export function onBoardFloor(out,d,draw){
 const b=d.board;if(!b){draw();return;}
 out.save();out.beginPath();out.rect(b.left,-400,b.right-b.left,2000);out.clip();draw();out.restore();
}
// A soft round puff, made once per colour, for smoke, mist and glows.
const puffs=new Map();
function puff(colour){
 let p=puffs.get(colour);if(p)return p;
 p=document.createElement('canvas');p.width=p.height=64;const g=p.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 r.addColorStop(0,`rgba(${colour},1)`);r.addColorStop(.45,`rgba(${colour},.55)`);r.addColorStop(1,`rgba(${colour},0)`);
 g.fillStyle=r;g.fillRect(0,0,64,64);puffs.set(colour,p);return p;
}
function softDot(out,colour,x,y,rx,ry=rx,alpha=1){
 if(alpha<=.01||rx<=0)return;
 out.globalAlpha=alpha;out.drawImage(puff(colour),x-rx,y-ry,rx*2,ry*2);
}

// —— Frost ——
// Ivory king: pale blue ice. Charcoal king: the black ice of his own armour (the owner's pick for his art), with
// pale glints so it still reads on the dark squares.
export const ICE=[
 {top:'#f2fbff',mid:'#b4def8',deep:'#6aaede',ink:'rgba(26,62,100,.92)',glint:'rgba(255,255,255,.95)',hole:'24,52,84',mist:'226,244,255',patch:'176,222,250'},
 {top:'#9fb6ca',mid:'#46586c',deep:'#1c2632',ink:'rgba(5,8,13,.95)',glint:'rgba(216,234,248,.95)',hole:'6,9,14',mist:'38,50,64',patch:'52,70,90'},
];
// Crystals round the piece: u across its width, h a share of its height, w half-width, lean, delay of growth.
const CRYSTALS=[
 {u:-1.02,h:.62,w:11,lean:-.16,delay:.1},{u:1.04,h:.72,w:12,lean:.14,delay:.04},{u:-.62,h:.82,w:10,lean:-.08,delay:.22},{u:.58,h:.9,w:11,lean:.07,delay:.16},
 {u:-1.3,h:.34,w:9,lean:-.26,delay:0},{u:1.32,h:.38,w:9,lean:.26,delay:.02},{u:0,h:.7,w:9,lean:.02,delay:.3},
];
const FRONT_CRYSTALS=[
 {u:-.9,h:.3,w:10,lean:-.14,delay:.04},{u:-.42,h:.2,w:9,lean:-.06,delay:.12},{u:.1,h:.26,w:10,lean:.04,delay:0},{u:.56,h:.18,w:8,lean:.08,delay:.14},{u:.98,h:.32,w:10,lean:.15,delay:.06},
];
// One crystal: two flat faces and a ridge, with an ink edge; (x, y) is its foot.
function crystal(c,x,y,h,w,lean,ice){
 if(h<1)return;
 const tx=x+lean*h,ty=y-h,sh=h*.68,lx=x-w+lean*sh*.9,rx=x+w*.92+lean*sh*.9,ly=y-sh*.92,ry=y-sh;
 c.beginPath();c.moveTo(x-w*.72,y);c.lineTo(lx,ly);c.lineTo(tx,ty);c.lineTo(rx,ry);c.lineTo(x+w*.72,y);c.closePath();
 c.fillStyle=ice.mid;c.fill();
 c.strokeStyle=ice.ink;c.lineWidth=1.3;c.stroke();
 c.fillStyle=ice.top;c.beginPath();c.moveTo(x-w*.72,y);c.lineTo(lx,ly);c.lineTo(tx,ty);c.lineTo(x-w*.1+lean*sh*.5,y-sh*.7);c.closePath();c.fill();
 c.fillStyle=ice.deep;c.beginPath();c.moveTo(x+w*.72,y);c.lineTo(rx,ry);c.lineTo(tx,ty);c.lineTo(x+w*.3+lean*sh*.5,y-sh*.55);c.closePath();c.fill();
 c.strokeStyle=ice.glint;c.lineWidth=.9;c.beginPath();c.moveTo(tx,ty+2);c.lineTo(lx+w*.5,ly+h*.1);c.stroke();
}
function crystals(c,d,table,climb,dy,ice,height,half,cx){
 for(const s of table){
  const k=ease((climb-s.delay)/(1-s.delay));if(k<=0)continue;
  const h=s.h*Math.min(height,120)*k,w=s.w*Math.min(1,k*1.6);
  crystal(c,cx+s.u*half,d.foot.y+dy+1,h,w,s.lean,ice);
 }
}
// The front of the climbing ice: sharp teeth, not a wave. Leaves the path open along its top; closes below.
function iceFront(c,l,r,level,bottom,close){
 const step=15,n=Math.ceil((r-l)/step);
 c.beginPath();
 for(let i=0;i<=n;i++){const x=l+(r-l)*i/n,y=level+(i%2?11:-7)*(.6+.8*rand(i,7));i?c.lineTo(x,y):c.moveTo(x,y);}
 if(close){c.lineTo(r,bottom);c.lineTo(l,bottom);c.closePath();}
}
function frozenFloor(out,d,k,ice,rx){
 if(k<=.01)return;
 const x=d.foot.x,y=d.foot.y-1,ry=Math.max(13,rx*.3);
 out.save();
 softDot(out,ice.patch,x,y,rx*1.5,ry*1.55,k);
 softDot(out,ice.hole,x,y,rx*.95,ry*.95,k);
 out.globalAlpha=k*.85;out.strokeStyle=ice.glint;out.lineWidth=1;out.beginPath();
 for(let i=0;i<7;i++){const a=i/7*TAU+.3,r0=.6+.1*rand(i,33);out.moveTo(x+Math.cos(a)*rx*r0,y+Math.sin(a)*ry*r0);out.lineTo(x+Math.cos(a+.12)*rx*1.1,y+Math.sin(a+.12)*ry*1.1);}
 out.stroke();out.restore();
}
// Chips that break off as it is pulled under, and the cold mist that rolls off.
function iceChips(out,d,t,D,ice,half,height){
 const since=t-D.sink[0];if(since<=0)return;
 out.save();
 for(let i=0;i<10;i++){
  const u=since/(300+160*rand(i,41));if(u>=1)continue;
  const dir=i%2?1:-1,x=d.foot.x+dir*(half*.5+half*.7*rand(i,42)*u+26*u),y=Math.min(d.foot.y+6,d.foot.y-height*(.2+.45*rand(i,43))-40*u+150*u*u),s=3.5+4*rand(i,44);
  out.globalAlpha=1-u*u;out.fillStyle=i%3?ice.mid:ice.top;out.strokeStyle=ice.ink;out.lineWidth=.8;
  const a=u*6*dir+i;out.beginPath();out.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s);out.lineTo(x+Math.cos(a+2.2)*s*.7,y+Math.sin(a+2.2)*s*.7);out.lineTo(x+Math.cos(a+4.1)*s*.8,y+Math.sin(a+4.1)*s*.8);out.closePath();out.fill();out.stroke();
 }
 for(let i=0;i<6;i++){
  const u=(since-30*i)/520;if(u<=0||u>=1)continue;
  softDot(out,ice.mist,d.foot.x+(i-2.5)*11*(1+u),d.foot.y-8-22*u,13+13*u,8+8*u,.5*Math.sin(Math.PI*u));
 }
 out.restore();
}
export function frostDeath(out,d,D){
 const t=d.t,climb=ease(t/D.climb),sink=easeIn(span(t,...D.sink)),height=d.foot.y-d.top,floor=d.foot.y+3;
 const fade=1-span(t,D.sink[1],D.end),ice=ICE[d.side?1:0],s=bodySpan(d),half=clamp((s.r-s.l)/2,20,40),cx=clamp((s.l+s.r)/2,d.foot.x-14,d.foot.x+14),rx=half+14;
 frozenFloor(out,d,ease(t/180)*fade,ice,rx);
 iceChips(out,d,t,D,ice,half,height);
 if(t>=D.sink[1]){
  // What is left: the near shards, settling into the patch.
  out.save();out.globalAlpha=fade;crystals(out,d,FRONT_CRYSTALS.slice(0,5),1-.72*span(t,D.sink[1],D.end),0,ice,height*.5,half,cx);out.restore();
  return;
 }
 const dy=sink*(height+14),c=d.clear(),level=d.foot.y+dy-height*climb*1.12,bottom=d.foot.y+dy+30,l=s.l-14,r=s.r+14;
 d.draw(c,{dy});
 c.save();c.globalCompositeOperation='source-atop';
 c.save();iceFront(c,l,r,level,bottom,true);c.clip();
 // The ice keeps the figure's own light and shade, so it is frozen, not a flat blue shape.
 const g=c.createLinearGradient(0,level,0,d.foot.y+dy);g.addColorStop(0,ice.top);g.addColorStop(.3,ice.mid);g.addColorStop(1,ice.deep);
 c.fillStyle=g;c.fillRect(l,level-16,r-l,bottom-level+16);
 c.globalCompositeOperation='luminosity';c.globalAlpha=d.side?.34:.3;d.draw(c,{dy});
 c.globalCompositeOperation='source-atop';c.globalAlpha=.18;c.fillStyle=g;c.fillRect(l,level-16,r-l,bottom-level+16);
 // Wide flat facets across it, light and dark, large enough to see at game size.
 c.globalAlpha=.5;
 for(let i=0;i<8;i++){
  const x=l+(r-l)*(i+.2)/8,y=d.foot.y+dy-height*(.08+.78*rand(i,51)),w=11+9*rand(i,52),h=20+22*rand(i,53);
  c.fillStyle=i%2?ice.top:ice.deep;c.beginPath();c.moveTo(x-w,y);c.lineTo(x+w*.2,y-h);c.lineTo(x+w,y-h*.3);c.lineTo(x+w*.1,y+h*.3);c.closePath();c.fill();
 }
 c.restore();
 // A bright edge along the teeth, with a darker line behind it.
 iceFront(c,l,r,level,bottom,false);c.strokeStyle=ice.ink;c.lineWidth=3.2;c.stroke();c.strokeStyle=ice.glint;c.lineWidth=1.6;c.stroke();
 c.restore();
 // Behind the figure (drawn after, under what is already there), then in front of it.
 c.globalCompositeOperation='destination-over';crystals(c,d,CRYSTALS,climb,dy,ice,height,half,cx);
 c.globalCompositeOperation='source-over';crystals(c,d,FRONT_CRYSTALS,climb,dy,ice,height,half,cx);
 d.layer(floor);
 // Shards that stay on the floor in front of where it goes in, so the cut never shows as a straight line.
 out.save();out.globalAlpha=ease(t/120);
 for(let i=0;i<9;i++){
  const a=(.08+.84*i/8)*Math.PI,k=ease((climb-.04*(i%3))*1.5);if(k<=0)continue;
  crystal(out,d.foot.x+Math.cos(a)*rx*.86,d.foot.y+1+Math.sin(a)*Math.max(10,rx*.24),(i%3===1?7:10+13*rand(i,61))*k,(5+3*rand(i,62))*k,(i-4)*.05,ice);
 }
 out.restore();
}

// —— Flame ——
// Tongues of fire out of the pool, in three flat colours; `front` picks those before the piece.
const TONGUES=[{u:-.95,h:.3,w:12,p:0,front:0},{u:.95,h:.36,w:12,p:1.3,front:0},{u:-.35,h:.46,w:15,p:2.1,front:0},{u:.4,h:.42,w:14,p:3.4,front:0},{u:-.6,h:.17,w:10,p:4.2,front:1},{u:.62,h:.2,w:10,p:.7,front:1}];
const TONGUE_COLOURS=[['#d44d10',1],['#f8911f',.72],['#ffdf7a',.42]];
// A licking flame: a wide round foot, a waist, and a tip that curls with the sway.
function tongue(out,x,y,h,w,sway){
 const tx=x+sway,ty=y-h;
 out.beginPath();out.moveTo(x-w,y);out.bezierCurveTo(x-w*1.25,y-h*.32,x-w*.1+sway*.2,y-h*.5,x-w*.25+sway*.8,y-h*.72);out.quadraticCurveTo(x-w*.1+sway*.9,y-h*.86,tx,ty);
 out.bezierCurveTo(x+w*.55+sway*.8,y-h*.78,x+w*.45+sway*.3,y-h*.5,x+w*.85,y-h*.3);out.quadraticCurveTo(x+w*1.2,y-h*.14,x+w,y);out.quadraticCurveTo(x,y+w*.4,x-w,y);out.closePath();
}
export function flameTongues(out,d,t,k,front,grow){
 if(k<=.01||grow<=.01)return;
 const s=bodySpan(d),half=clamp((s.r-s.l)/2,20,40),H=Math.min(d.foot.y-d.top,110);
 out.save();out.globalAlpha=k;
 for(const f of TONGUES){
  if(!!f.front!==front)continue;
  const flick=.8+.2*Math.sin(t/62+f.p*2)+.08*Math.sin(t/29+f.p),x=d.foot.x+f.u*half,y=d.foot.y-1+(front?6:-3),h=f.h*H*grow*flick,sway=Math.sin(t/90+f.p)*h*.22;
  if(h<3)continue;
  for(const [colour,scale] of TONGUE_COLOURS){out.fillStyle=colour;tongue(out,x,y,h*scale,f.w*scale*Math.min(1,grow*1.5),sway*scale);out.fill();}
 }
 out.restore();
}
// The body's warm light on the floor, in plain paint: 'lighter' washes out to white on a light square.
export function heatLight(out,d,k,height){
 softDot(out,'255,120,30',d.foot.x,d.foot.y-height*.28,height*.82,height*.72,k*.42);out.globalAlpha=1;
}

// —— Shadow ——
// Bony arms reach out of the crack and take the piece by the body. fx across its width, grip a share of its
// height, delay of the reach, front: drawn over the piece.
const ARMS=[
 {fx:-1,grip:.5,delay:0,size:1.1,front:0},{fx:1,grip:.58,delay:.12,size:1.15,front:0},
 {fx:-.72,grip:.26,delay:.2,size:1.25,front:1},{fx:.78,grip:.34,delay:.08,size:1.3,front:1},
];
// Where one arm's hand closes on the piece (before the pull): on its outline, at that height, not up in the air.
export function gripPoint(d,arm){
 const H=Math.min(d.foot.y-d.top,130),y=d.foot.y-H*arm.grip,e=edgesAt(d,y),c=(e.l+e.r)/2,w=Math.max(17,Math.min(40,(e.r-e.l)/2));
 return {x:c+arm.fx*w,y};
}
function boneArm(c,x0,y0,x1,y1,side,k){
 const bone=BONE[side],dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,g=1.8*k;
 const pass=(colour,w,off=0)=>{c.strokeStyle=colour;c.lineWidth=w;c.beginPath();
  for(const e of [-1,1]){const gap=g*(e>0?1:.85);c.moveTo(x0+nx*e*gap*1.5+off,y0+ny*e*gap*1.5);c.quadraticCurveTo(x0+dx*.5+nx*(e*gap+3*k)+off,y0+dy*.5+ny*(e*gap+3*k),x1+nx*e*gap*.6+off,y1+ny*e*gap*.6);}
  c.stroke();};
 c.save();c.lineCap='round';
 if(bone.outline)pass(bone.outline,1.9*k+1.5);
 pass(bone.body,1.9*k);
 pass(bone.edge,.6*k,side?-.5:.5);
 c.restore();
}
function shadowArm(c,d,arm,up,grip,dy,t,i){
 const k=arm.size*clamp((d.foot.y-d.top)/95,.82,1.22),p=gripPoint(d,arm),reach=ease((up-arm.delay)/(1-arm.delay));
 if(reach<=0)return;
 const baseX=d.foot.x+arm.fx*(Math.max(24,Math.abs(p.x-d.foot.x))+14),baseY=d.foot.y+14,shake=Math.sin(t/38+i*1.7)*1.4*grip;
 // The wrist runs from under the floor up to the grip and then holds on: it goes down with the piece.
 const wx=baseX+(p.x-baseX)*reach+shake,wy=baseY+(p.y-baseY)*reach+dy,lean=Math.atan2(wx-baseX,baseY-wy);
 c.save();c.beginPath();c.rect(d.foot.x-200,-400,400,d.foot.y+1+400);c.clip();
 boneArm(c,baseX,baseY,wx,wy,d.side?1:0,k);
 c.restore();
 // Fingers close toward the body (flip: they curl to -x).
 drawHand(c,wx,wy,{side:d.side?1:0,size:k,flip:p.x>d.hit.x,angle:lean+(p.x>d.hit.x?-.5:.5)*grip,rise:1,curl:.1+.9*grip,floor:d.foot.y+1,reach:400});
}
export function shadowDeath(out,d,D){
 const t=d.t,open=ease(t/D.open)*(1-ease(span(t,...D.close))),sink=easeIn(span(t,...D.sink)),height=d.foot.y-d.top,s=bodySpan(d),half=clamp((s.r-s.l)/2,24,56);
 onBoardFloor(out,d,()=>{if(open>.01)drawCrack(out,d.foot.x,d.foot.y-2,(half+24)*Math.min(1,open*1.3),(15+half*.12)*open,3,{points:12,branches:3,glow:'rgba(70,30,110,.35)'});});
 if(t<D.sink[1]){
  const c=d.clear(),dy=sink*(height+18),up=ease(span(t,D.hands[0],D.hands[1])),grip=ease(span(t,D.hands[1]-70,D.hands[1]+70));
  ARMS.forEach((arm,i)=>{if(!arm.front)shadowArm(c,d,arm,up,grip,dy,t,i);});
  d.draw(c,{dy,wobble:Math.sin(t/45)*2*grip*(1-sink)});
  // It darkens as it goes down.
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(8,4,14,${.72*sink+.1*grip})`;c.fillRect(d.foot.x-120,d.top-40,240,height+80);c.restore();
  ARMS.forEach((arm,i)=>{if(arm.front)shadowArm(c,d,arm,up,grip,dy,t,i);});
  d.layer(d.foot.y+2);
 }
 // Dark smoke rising out of the crack.
 out.save();
 for(let i=0;i<8;i++){
  const u=clamp((t-60*i)/560,0,1);if(u<=0||u>=1)continue;
  const x=d.foot.x+(rand(i,9)*2-1)*half*.8+Math.sin(u*5+i)*5,y=d.foot.y-5-u*(24+16*rand(i,10));
  softDot(out,i%3?'18,10,28':'46,22,74',x,y,7+7*u,5+5*u,Math.sin(Math.PI*u)*.6*open);
 }
 out.restore();
}

// —— Spirit ——
// The silhouette swells a little, then squeezes: narrow first, so it reads as a column pulled to one point.
export function spiritSquash(t,D){
 const before=ease(span(t,D.fill*.6,D.implode[0])),u=span(t,...D.implode);
 const swell=1+.07*before;
 return {x:swell*(1-easeIn(Math.min(1,u*1.35))*.96)*(u>=1?0:1),y:swell*(1-easeIn(u))};
}
const MOTES=Array.from({length:16},(_,i)=>({a:i/16*TAU+rand(i,70),r:58+46*rand(i,71),start:60+18*i,life:300+80*rand(i,72),s:2.4+2.6*rand(i,73),turn:(i%2?1:-1)*(.5+.5*rand(i,74))}));
export function spiritMotes(out,d,t){
 out.save();
 for(const m of MOTES){
  const u=(t-m.start)/m.life;if(u<=0||u>=1)continue;
  const f=easeIn(u)*.92+.08*u,r=m.r*(1-f),a=m.a+m.turn*f*1.6,x=d.hit.x+Math.cos(a)*r,y=d.hit.y+Math.sin(a)*r*.86;
  softDot(out,'240,176,70',x,y,m.s*3,m.s*3,.7);out.globalAlpha=1;out.fillStyle='#fffbea';out.beginPath();out.arc(x,y,m.s*.72,0,TAU);out.fill();
 }
 out.restore();
}
// Where it vanished. Ivory: a bloom, wide tapered rays and a soft ring (gold under white, so it reads on the
// cream squares too). Charcoal: all in warm black, nothing pale: a ring closes on the point, then smoke and rays.
export function spiritFlash(out,d,f,light){
 if(f<=0||f>=1)return;
 const x=d.hit.x,y=d.hit.y,fadeOut=1-f,grow=ease(f);
 out.save();
 if(light){
  // In plain paint for the cream squares, added light for the dark ones: a dimming plain bloom alone turns brown.
  softDot(out,'246,190,88',x,y,46+74*grow,46+74*grow,fadeOut**3);
  out.globalCompositeOperation='lighter';softDot(out,'150,104,40',x,y,46+74*grow,46+74*grow,fadeOut);out.globalCompositeOperation='source-over';
  // Short wide rays, gone before the bloom is.
  const rays=1-span(f,.1,.62);
  if(rays>0){
   out.translate(x,y);
   for(let i=0;i<8;i++){
    const a=i/8*TAU+.2,r0=6+16*grow,r1=(i%2?30:46)+(i%2?26:40)*grow,w=(i%2?6:8)*(1-.4*f),cs=Math.cos(a),sn=Math.sin(a);
    out.globalAlpha=rays;out.fillStyle=i%2?'#ffe9ab':'#f8c765';
    out.beginPath();out.moveTo(cs*r0-sn*w,sn*r0+cs*w);out.lineTo(cs*r1,sn*r1);out.lineTo(cs*r0+sn*w,sn*r0-cs*w);out.closePath();out.fill();
   }
   out.translate(-x,-y);
  }
  softGold(out,x,y,12+60*grow,7*fadeOut+3,fadeOut*.9);
  softDot(out,'255,252,236',x,y,42*(1-.3*f),42*(1-.3*f),fadeOut*fadeOut);
 }else{
  const close=ease(Math.min(1,f/.5)),blast=span(f,.42,1),eb=ease(blast);
  // The ring closing on the point, thick and soft.
  if(close<1)softRing(out,x,y,6+40*(1-close),9+7*(1-close),1-close*.4);
  if(blast>0){
   softDot(out,'18,15,12',x,y,14+60*eb,14+60*eb,(1-blast)*.95);
  }
 }
 out.restore();
}
function softGold(out,x,y,r,w,alpha){
 out.save();out.globalAlpha=alpha;
 const ring=out.createRadialGradient(x,y,Math.max(0,r-w),x,y,r+w);ring.addColorStop(0,'rgba(240,176,70,0)');ring.addColorStop(.5,'rgba(255,226,150,1)');ring.addColorStop(1,'rgba(240,176,70,0)');
 out.fillStyle=ring;out.beginPath();out.arc(x,y,r+w,0,TAU);out.fill();out.restore();
}
function softRing(out,x,y,r,w,alpha){
 out.save();out.globalAlpha=alpha;
 const ring=out.createRadialGradient(x,y,Math.max(0,r-w),x,y,r+w);ring.addColorStop(0,'rgba(18,15,12,0)');ring.addColorStop(.5,'rgba(18,15,12,.95)');ring.addColorStop(1,'rgba(18,15,12,0)');
 out.fillStyle=ring;out.beginPath();out.arc(x,y,r+w,0,TAU);out.fill();out.restore();
}

// —— Stratus ——
// A real funnel: it widens upward (rx grows with the band), with wide soft bands of his emblem's blue under a
// pale core; a darker line under them holds on the cream squares. front: the near halves.
const BANDS=6;
export function bandRadius(w,i){return w*(.62+.62*i/(BANDS-1));}
const FUNNEL_STROKES=[['rgba(52,92,136,.42)',7,1.2],['rgba(103,149,196,.9)',4,.5],['rgba(232,245,255,.95)',1.4,-.3]];
export function funnel(out,cx,foot,height,w,t,alpha,front,clear=null){
 if(alpha<=.01)return;
 out.save();out.lineCap='round';
 for(let i=0;i<BANDS;i++){
  const y=foot-height*(.04+.22*i),rx=bandRadius(w,i),ry=Math.max(5,rx*.27),a0=t/(105+i*5)*(i%2?1:-1)+i*1.3;
  for(const [colour,lw,dy] of FUNNEL_STROKES){
   out.globalAlpha=alpha*(.72+.28*(i/(BANDS-1)));out.strokeStyle=colour;out.lineWidth=lw*(.72+.42*i/(BANDS-1));
   for(let j=0;j<2;j++){
    const s0=a0+j*Math.PI,s1=s0+2.05,n=14;out.beginPath();let on=false;
    for(let m=0;m<=n;m++){const a=s0+(s1-s0)*m/n,near=Math.sin(a)>0,px=cx+Math.cos(a)*rx,py=y+Math.sin(a)*ry+dy;if(near!==front||clear&&(px-clear.x)*clear.side>0){on=false;continue;}on?out.lineTo(px,py):out.moveTo(px,py);on=true;}
    out.stroke();
   }
  }
 }
 out.restore();
}
// The body of the wind behind the piece and the dust it raises round its foot.
export function funnelBody(out,cx,foot,height,w,alpha){
 if(alpha<=.01)return;
 out.save();
 for(let i=0;i<4;i++)softDot(out,'176,210,240',cx,foot-height*(.14+.26*i),bandRadius(w,i*1.6)*1.28,height*.26,alpha*.42);
 out.restore();
}
export function funnelDust(out,x,y,t,w,alpha){
 if(alpha<=.01)return;
 out.save();
 for(let i=0;i<9;i++){
  const a=t/130*(i%2?1:-1)+i*.7,r=w*(.6+.5*rand(i,91)),px=x+Math.cos(a)*r,py=y-3+Math.sin(a)*r*.26-5*rand(i,92);
  softDot(out,i%3?'128,104,76':'92,74,54',px,py,8+5*rand(i,93),5+3*rand(i,94),alpha*.55);
  out.globalAlpha=alpha;out.fillStyle=i%2?'#6b5238':'#d5e6f4';out.beginPath();out.arc(px+4,py-6*rand(i,95),1.2+rand(i,96),0,TAU);out.fill();
 }
 out.restore();
}
