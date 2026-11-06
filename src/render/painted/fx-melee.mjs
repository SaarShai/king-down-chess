// Melee strikes on the painted board: where a captor stands so its painted weapon reaches the victim at the
// painted contact frame, what each blow draws, and how each victim dies (cut in two, crushed, run through, thrown, bitten).
// All times are milliseconds since the contact frame, so Fast (the scene halves the clock) scales them too.
// Everything is drawn from fixed tables on the scene's own canvas: no canvas and no large array per frame.
import {clamp} from './painted-mesh.mjs';

const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const easeOut=t=>{t=clamp(t,0,1);return 1-(1-t)*(1-t);};
const unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l};};

// Measured on the Pawn's contact frames (feet to spear tip, bank pixels): only his banks have no targetPoint.
const PAWN_TIP={N:[-10,-234],NE:[139,-203],E:[192,-105],SE:[181,-17],S:[20,10],SW:[-138,-46],W:[-195,-110],NW:[-174,-217]};
/** Feet to the weapon at the painted contact frame, in board px. */
export function strikeReach(bank,scale){
 const p=bank.targetPoint,tip=p?[p[0]-bank.pivot[0],p[1]-bank.pivot[1]]:PAWN_TIP[bank.facing];
 return tip?{x:tip[0]*scale,y:tip[1]*scale}:null;
}

// depth: how far inside the victim's outline the weapon lands; low: a hammer lands on the lower part, its own feet too.
// Other weapons land on the body, so a blow from below the victim does not stop at its feet.
const STRIKES={
 slash:{w:20,depth:8,gap:26},
 hammer:{w:7,depth:0,gap:18,low:.5},
 pound:{w:20,depth:8,gap:24},
 pawn:{w:20,depth:6,gap:30},
 knight:{w:20,depth:6,gap:26},
 ogre:{w:20,depth:6,gap:30},
 chain:{w:20,depth:6,gap:28},
};
const FAR_BACK=72;
/**
 * Where the captor stands at the contact frame, and where its weapon meets the victim.
 * from: its feet now; victimFoot, height: the victim on the board; reach: strikeReach; bounds: {minX,maxX} for its feet.
 * It keeps as near to its own line as the weapon allows: it does not pass the victim, and a long weapon steps back at most FAR_BACK.
 */
export function strikeStance(kind,from,victimFoot,height,reach,{minX=-Infinity,maxX=Infinity}={}){
 const s=STRIKES[kind],d=unit(victimFoot.x-from.x,victimFoot.y-from.y),dist=Math.hypot(victimFoot.x-from.x,victimFoot.y-from.y);
 const top=victimFoot.y-height*(s.low??1)+s.depth,bottom=victimFoot.y-(s.low?2:height*.35),left=victimFoot.x-s.w+s.depth,right=victimFoot.x+s.w-s.depth;
 const point={x:clamp(from.x+reach.x,left,right),y:clamp(from.y+reach.y,top,bottom)};
 let x=point.x-reach.x,y=point.y-reach.y;
 const along=(x-from.x)*d.x+(y-from.y)*d.y,limit=clamp(along,-FAR_BACK,Math.max(0,dist-s.gap));
 x+=d.x*(limit-along);y+=d.y*(limit-along);
 const stance={x:clamp(x,minX,maxX),y};
 return {stance,point:{x:stance.x+reach.x,y:stance.y+reach.y},dir:d};
}

// ---- What a blow does to the victim: pose changes on its own figure. since: ms from contact; life: ms until it must be gone. ----

/** Flattened under the blow, a small rebound, then it spreads on the floor. */
export function crushPose(pose,since,life,dir=null){
 const down=ease(since/70),back=Math.sin(Math.PI*clamp((since-70)/110,0,1)),last=ease((since-180)/(life*.5)),push=dir?easeOut(since/120):0;
 const x=dir?pose.foot.x+dir.x*22*push:pose.foot.x,y=dir?pose.foot.y+dir.y*10*push:pose.foot.y;
 return {pose:{...pose,foot:{x,y},ground:{x,y},rotation:dir?.2*push*(dir.x>=0?1:-1)*pose.facing*(1-down*.7):pose.rotation,sx:1+.3*down+.07*back+.16*last,sy:1-.68*down+.14*back-.1*last},opacity:1-clamp((since-life*.55)/(life*.44),0,1)};
}
/** Run through: driven back along the thrust, then it falls over away from the captor. */
export function impalePose(pose,since,life,dir){
 const push=easeOut(since/80),fall=clamp((since-16)/(life*.62),0,1),side=dir.x>=0?1:-1;
 return {pose:{...pose,ground:{x:pose.foot.x+dir.x*20*push,y:pose.foot.y+dir.y*12*push},foot:{x:pose.foot.x+dir.x*20*push,y:pose.foot.y+dir.y*12*push},rotation:1.42*Math.pow(fall,1.6)*side*pose.facing},opacity:1-clamp((since-life*.6)/(life*.39),0,1)};
}
/** Thrown: it leaves the square along the punch on a low arc, turning over. */
export function thrownPose(pose,since,life,dir,{minX=-Infinity,maxX=Infinity}={}){
 const k=clamp(since/life,0,1),go=easeOut(k),side=dir.x>=0?1:-1,x=clamp(pose.foot.x+dir.x*118*go,minX,maxX),y=pose.foot.y+dir.y*78*go,q=1-.22*k;
 return {pose:{...pose,ground:{x,y},foot:{x,y:y-58*Math.sin(Math.PI*Math.min(1,k*1.05))},rotation:3.4*k*side*pose.facing,sx:q,sy:q,shadow:1-.6*Math.sin(Math.PI*k)},opacity:1-clamp((k-.62)/.37,0,1)};
}
/** Bitten: yanked to the jaws, shaken from side to side, then it is gone into them. */
export function bitePose(pose,since,life,mouth,hit){
 const pull=easeOut(since/70),sh=1-clamp(since/(life*.7),0,1),wag=Math.sin(since*.06)*sh,gone=ease((since-life*.42)/(life*.55)),q=1-.5*gone;
 return {pose:{...pose,ground:pose.ground??pose.foot,foot:{x:pose.foot.x+(mouth.x-hit.x)*.55*pull+wag*11,y:pose.foot.y+(mouth.y-hit.y)*.55*pull-6*gone},rotation:wag*.3*pose.facing,sx:q,sy:q},opacity:1-clamp((since-life*.55)/(life*.42),0,1)};
}

// ---- The cut: two halves of the figure, split along the slash. ----

/** The line of the slash: down and forward across the figure. */
export const slashLine=dir=>unit((dir.x>=0?1:-1)*.62,1);
/** drawHalf draws the whole figure; the clip keeps one side of the line. */
export function drawCut(out,{point:p,dir,since,life},drawHalf){
 const n={x:-dir.y,y:dir.x},far=2000,fall=clamp((since-30)/(life*.75),0,1),slide=fall*fall;
 for(const s of [-1,1]){
  const upper=n.y*s<0,tilt=(upper?.42:-.1)*slide*(dir.x>=0?1:-1);
  out.save();
  out.translate(n.x*s*(2+5*easeOut(since/90))+(upper?dir.x*36*slide:0),n.y*s*(2+5*easeOut(since/90))+(upper?dir.y*36*slide:7*slide));
  out.translate(p.x,p.y);out.rotate(tilt);out.translate(-p.x,-p.y);
  out.beginPath();out.moveTo(p.x-dir.x*far,p.y-dir.y*far);out.lineTo(p.x+dir.x*far,p.y+dir.y*far);
  out.lineTo(p.x+dir.x*far+n.x*far*s,p.y+dir.y*far+n.y*far*s);out.lineTo(p.x-dir.x*far+n.x*far*s,p.y-dir.y*far+n.y*far*s);out.closePath();out.clip();
  drawHalf();out.restore();
 }
}
/** The stroke of the blade: a pale crescent that sweeps through the point, with a dark edge so it reads on light stone. */
export function drawSlashArc(out,point,dir,since){
 const age=since+70;if(age<0||age>190)return;
 const n={x:-dir.y,y:dir.x},bow=dir.x>=0?-10:10,L=44,head=easeOut(age/80),tail=ease((age-60)/130),steps=10;
 const at=(u,w)=>{const v=u*2-1,b=bow*(1-v*v)+w;return [point.x+dir.x*L*v+n.x*b,point.y+dir.y*L*v+n.y*b];};
 for(const [edge,colour,alpha] of [[2.2,'#1d1a14',.55],[0,'#fffdf2',1]]){
  out.save();out.globalAlpha=alpha*(1-tail*tail);out.fillStyle=colour;out.beginPath();
  for(let i=0;i<=steps;i++){const u=tail+(head-tail)*i/steps,w=6.5*Math.sin(Math.PI*i/steps)+edge,[x,y]=at(u,w);i?out.lineTo(x,y):out.moveTo(x,y);}
  for(let i=steps;i>=0;i--){const u=tail+(head-tail)*i/steps,w=-1.5*Math.sin(Math.PI*i/steps)-edge,[x,y]=at(u,w);out.lineTo(x,y);}
  out.closePath();out.fill();out.restore();
 }
 // A bright line where the blade went in.
 if(age>60&&age<170){out.save();out.globalAlpha=1-(age-60)/110;out.strokeStyle='#fff6c8';out.lineWidth=3;out.lineCap='round';out.beginPath();out.moveTo(point.x-dir.x*30,point.y-dir.y*30);out.lineTo(point.x+dir.x*30,point.y+dir.y*30);out.stroke();out.restore();}
}

// ---- Effects at the point of impact. Two tones each, so they read on light and on dark squares. ----

const CHIP=[[-1,-.5],[1.1,-.8],[.2,.9]];
function chip(out,x,y,r,turn){
 out.save();out.translate(x,y);out.rotate(turn);out.beginPath();
 for(let i=0;i<3;i++){const px=CHIP[i][0]*r,py=CHIP[i][1]*r;i?out.lineTo(px,py):out.moveTo(px,py);}
 out.closePath();out.fill();out.restore();
}
/** Bits of the victim's own colour, thrown out and falling. tint: 0 ivory, 1 charcoal. */
export function drawChips(out,point,since,tint,{n=6,speed=1,dir=null}={}){
 const t=since/520;if(t<0||t>1)return;
 out.save();out.globalAlpha=1-t*t*t;
 for(let i=0;i<n;i++){
  const a=-Math.PI/2+(i/(n-1||1)-.5)*2.5+(dir?Math.atan2(dir.y,dir.x)*.2:0),v=(58+26*((i*7)%5)/4)*speed,k=since/1000;
  out.fillStyle=i%2?(tint?'#26272b':'#8f7f60'):(tint?'#6c7078':'#f4ebd6');
  chip(out,point.x+Math.cos(a)*v*k*1.7,point.y+Math.sin(a)*v*k*1.7+230*k*k,3+((i*5)%3)*1.1,i*1.3+k*(i%2?9:-9));
 }
 out.restore();
}
// One soft clump of dust, painted once on a small canvas and scaled per puff.
let puffArt=null;
function puffSprite(){
 if(puffArt)return puffArt;
 puffArt=document.createElement('canvas');puffArt.width=puffArt.height=64;
 const g=puffArt.getContext('2d');
 for(const [x,y,r,tone] of [[32,38,22,'141,120,88'],[20,40,14,'141,120,88'],[45,41,13,'141,120,88'],[31,30,20,'222,205,168'],[20,33,12,'222,205,168'],[44,33,12,'222,205,168'],[27,24,10,'243,233,206']]){
  const f=g.createRadialGradient(x,y,r*.25,x,y,r);f.addColorStop(0,`rgba(${tone},.9)`);f.addColorStop(1,`rgba(${tone},0)`);g.fillStyle=f;g.fillRect(0,0,64,64);
 }
 return puffArt;
}
/** Dust that rolls out along the floor from the point. */
export function drawDust(out,point,since,{size=1,n=7,ms=460}={}){
 const t=since/ms;if(t<0||t>1)return;
 const k=easeOut(t),art=puffSprite();out.save();
 for(let i=0;i<n;i++){
  const a=(i+.5)/n*Math.PI*2+.4,r=(6+56*k)*size*(.8+.2*(i%3)/2),d=(16+30*k)*size*(.8+.2*(i%2));
  out.globalAlpha=.92*(1-t)*(1-t*.5);
  out.drawImage(art,point.x+Math.cos(a)*r-d,point.y+Math.sin(a)*r*.34-16*k*size*(i%2)-d*1.1,d*2,d*2);
 }
 out.restore();
}
const CRACKS=[[.3,1,.55,-.2],[1.25,.72,.4,.28],[2.3,.9,.6,.2],[3.5,.8,.45,-.26],[4.4,.66,.5,.22],[5.45,.95,.5,-.2]];
/** The floor breaks under a heavy blow: dark tapered cracks, a thick ring, dust and stones. */
export function drawCrush(out,point,since,tint,size=1){
 if(since<0||since>560)return;
 const t=since/560,grow=easeOut(since/70);
 out.save();out.globalAlpha=1-ease((t-.45)/.55);out.fillStyle='#231d14';
 for(const [a,len,bend,kink] of CRACKS){
  const L=46*size*len*grow,cx=Math.cos(a),sy=Math.sin(a),px=-sy,py=cx;
  out.beginPath();out.moveTo(point.x-px*3.2,point.y-py*1.1);
  out.lineTo(point.x+cx*L*bend+px*L*kink*.3-px*1.4,point.y+(sy*L*bend+py*L*kink*.3)*.36-py*.5);
  out.lineTo(point.x+cx*L,point.y+sy*L*.36);
  out.lineTo(point.x+cx*L*bend+px*L*kink*.3+px*1.4,point.y+(sy*L*bend+py*L*kink*.3)*.36+py*.5);
  out.lineTo(point.x+px*3.2,point.y+py*1.1);out.closePath();out.fill();
 }
 out.restore();
 const ring=easeOut(since/180);
 if(since<180){out.save();out.globalAlpha=(1-since/180)*.8;for(const [w,c] of [[7,'#3d3220'],[3.5,'#f1e6c8']]){out.lineWidth=w*(1-ring)+1;out.strokeStyle=c;out.beginPath();out.ellipse(point.x,point.y,(14+66*ring)*size,(14+66*ring)*size*.34,0,0,Math.PI*2);out.stroke();}out.restore();}
 drawDust(out,point,since,{size:size*.92,n:8,ms:520});
 drawChips(out,{x:point.x,y:point.y-8},since,tint,{n:6,speed:1.1});
}
const STAR=[1,.42,.8,.4,1.15,.44,.72,.38,.95,.42,.78,.4,1.08,.44,.7,.4];
/** A hit: a quick pop of a jagged star with a hot middle and a dark edge. */
export function drawBurst(out,point,since,{size=1,dir=null,hot='#f6c766'}={}){
 const ms=150,t=since/ms;if(t<0||t>1)return;
 const r=(8+15*easeOut(since/50))*size*(1-.3*t);
 out.save();out.translate(point.x,point.y);if(dir)out.rotate(Math.atan2(dir.y,dir.x));
 out.globalAlpha=1-t*t;
 for(const [k,colour] of [[1.22,'#2a2016'],[1,hot],[.5,'#fffbe6']]){
  out.fillStyle=colour;out.beginPath();
  for(let i=0;i<STAR.length;i++){const a=i/STAR.length*Math.PI*2,rr=r*STAR[i]*k;i?out.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):out.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  out.closePath();out.fill();
 }
 out.restore();
}
const BITE=[1,.86,1.04,.84,1,.88,1.06,.85,1,.88,1.03,.85,1.05,.86];
/** The figure with a toothed bite out of it. hole: {x,y,r} in board px. */
export function drawBitten(out,hole,drawFigure){
 out.save();out.beginPath();out.rect(-200,-400,2000,2000);
 for(let i=0;i<BITE.length;i++){const a=i/BITE.length*Math.PI*2,r=hole.r*BITE[i],x=hole.x+Math.cos(a)*r,y=hole.y+Math.sin(a)*r;i?out.lineTo(x,y):out.moveTo(x,y);}
 out.closePath();out.clip('evenodd');drawFigure();out.restore();
}
/** Where the jaws meet: a short pop and bits of the victim. */
export function drawBiteHit(out,point,since,tint,dir){
 drawBurst(out,point,since,{size:.62,hot:'#f0a860'});
 drawChips(out,point,since,tint,{n:6,speed:1.05,dir});
}
