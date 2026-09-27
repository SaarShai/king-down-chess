// The painted board scene: art, poses, capture animations and effects drawn on one canvas.
// Shared by the board trial (prototype.mjs) and the game's painted look (src/render/PaintedView.ts).
// Rules helpers are passed in, so the scene never bundles its own copy of the engine.
import { clamp } from '../painted-mesh.mjs';
import * as archer from '../wrist-bow/aiming.mjs';
import * as pawn from '../lance/aiming.mjs';
import * as ogre from '../ogre/motion.mjs';
import * as knight from '../knight/motion.mjs';
import * as bishop from '../bishop/motion.mjs';
import * as rook from '../rook/motion.mjs';
import * as guard from '../guard/motion.mjs';
import * as court from '../court-motion.mjs';
import {chargeAt,CHARGE_CONTACT,swapAt} from './motion.mjs';
import {BLOW,blows,tiltAt,footAt,stopPoint} from './blows.mjs';
export const SIZE=960, PAD=32, TILE=112;
// One literal URL per image: bundlers resolve and copy each file (a template string would not).
const ART_FILES={king:new URL('../king/king.webp',import.meta.url).href,beast:new URL('../beast/beast.webp',import.meta.url).href,queen:new URL('../queen/queen.webp',import.meta.url).href,paladin:new URL('../paladin/paladin.webp',import.meta.url).href,maester:new URL('../maester/maester.webp',import.meta.url).href,pawn:new URL('../lance/pawn.webp',import.meta.url).href,archer:new URL('../wrist-bow/archer.webp',import.meta.url).href,ogre:new URL('../ogre/ogre.webp',import.meta.url).href,knight:new URL('../knight/knight.webp',import.meta.url).href,bishop:new URL('../bishop/bishop.webp',import.meta.url).href,rook:new URL('../rook/rook.webp',import.meta.url).href,guard:new URL('../guard/guard.webp',import.meta.url).href};
// Painted stone board inspired by the original King Down board's capital (board-art/README.md).
const BOARD_ART=new URL('../board-art/stone-board.webp',import.meta.url).href;
/**
 * pieces: {P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName,LETTERS?} from the rules engine.
 * closeup: optional {panel,title,ctx} for steep Archer shots; without it the Archer shoots on the board.
 * onStatus: narration hook for contact moments.
 * headroom: extra canvas pixels above the board for tall back-rank figures (canvas height = SIZE+headroom).
 * setDecorate(fn): fn(ctx, scene, 'under'|'over') draws markers below and above the figures.
 */
export function createScene({canvas,pieces,closeup=null,onStatus=()=>{},headroom=0}) {
 const {P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName}=pieces;
 const ctx=canvas.getContext('2d');
 const CHAIN_STEP=560, SPIN={duration:1400,travel:[250,780],contact:780,release:1150};
 const ART={[K]:'king',[S]:'beast',[Q]:'queen',[L]:'paladin',[M]:'maester',[P]:'pawn',[A]:'archer',[O]:'ogre',[N]:'knight',[B]:'bishop',[R]:'rook',[G]:'guard'};
 const art=Object.fromEntries(Object.keys(ART).map(type=>[type,new Image()]));
 const boardArt=new Image();
 const specs={ [P]:{anchor:{x:330,y:870},hit:{x:327,y:556},pivot:{x:430,y:521},scale:.132,min:pawn.MIN_ANGLE,max:pawn.MAX_ANGLE}, [A]:{anchor:{x:382,y:1066},hit:{x:344,y:424},scale:.106,min:archer.MIN_ANGLE,max:archer.MAX_ANGLE} };
specs[O]={anchor:ogre.ANCHOR,hit:ogre.HIT,scale:.155};
specs[N]={anchor:knight.ANCHOR,hit:knight.HIT,scale:.125};
const newMotions={ [B]:bishop,[R]:rook,[G]:guard };
for(const [type,scale] of [[B,.13],[R,.155],[G,.12]])specs[type]={anchor:newMotions[type].ANCHOR,hit:newMotions[type].HIT,scale};
const courtNames={[Q]:'queen',[L]:'paladin',[M]:'maester',[K]:'king',[S]:'beast'};
for(const [type,name] of Object.entries(courtNames)){
 specs[type]={anchor:court.ANCHOR,hit:court.HIT,scale:court.figures[name].scale};
 newMotions[type]={DURATION:court.figures[name].duration,actionAt:court.actionAt};
}
 const FALLBACK={anchor:{x:576,y:1018},hit:{x:576,y:640},scale:.1};
 for(let type=1;type<16;type++)if(!specs[type])specs[type]=FALLBACK;
 const idle=new Map(), work=new Map();
 let position={board:new Uint8Array(64)}, selected=null, aimSquare=null, animation=null, aimAngle=0, aimFacing=1;
 let frame=0, previousTime=0, ready=false, flipped=false, coords=true, labels=false, reducedMotion=false, decorate=null;
 const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 const cell=s=>({col:flipped?7-(s&7):s&7,row:flipped?s>>3:7-(s>>3)});
 const foot=s=>{const c=cell(s);return {x:PAD+(c.col+.5)*TILE,y:PAD+(c.row+.5)*TILE+40};};
 const sideFacing=value=>colorOf(value)?-1:1;
 const poseFor=(value,square)=>({foot:foot(square),scale:specs[typeOf(value)].scale,facing:sideFacing(value),angle:0});
 // Pieces without painted art (lab pieces) draw as a lettered token.
 function token(value) {
  const key=`token:${value}`;let canvas=idle.get(key);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=canvas.height=1152;const c=canvas.getContext('2d'),dark=colorOf(value);
  c.fillStyle=dark?'#34383a':'#efe9d8';c.strokeStyle=dark?'#c9cdc8':'#4b4a3c';c.lineWidth=24;c.beginPath();c.arc(576,700,260,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle=c.strokeStyle;c.font='bold 300px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText(pieces.LETTERS?.[typeOf(value)]??'?',576,712);
  idle.set(key,canvas);return canvas;
 }
 function world(point,pose,type) { const a=specs[type].anchor; return {x:pose.foot.x+(point.x-a.x)*pose.scale*pose.facing,y:pose.foot.y+(point.y-a.y)*pose.scale}; }
function local(point,pose,type) { const a=specs[type].anchor; return {x:a.x+(point.x-pose.foot.x)/pose.scale/pose.facing,y:a.y+(point.y-pose.foot.y)/pose.scale}; }
function tip(type,side,angle,extension=0) { return type===A?archer.muzzle(angle,side):pawn.tipAt(angle,side,extension); }
function aimed(value,pose,target) {
 const type=typeOf(value), side=colorOf(value), spec=specs[type];
 pose={...pose,facing:Math.abs(target.x-pose.foot.x)>1?Math.sign(target.x-pose.foot.x):pose.facing};
 if(type!==P&&type!==A)return pose;
 const p=local(target,pose,type), pivot=type===A?{x:archer.pivot(side).x,y:archer.pivot(side).y+archer.FIGURE_Y}:spec.pivot;
 const zero=tip(type,side,0), dx=p.x-pivot.x,dy=p.y-pivot.y;
 const raw=Math.atan2(dy,dx)-Math.asin(clamp((zero.y-pivot.y)/Math.max(1,Math.hypot(dx,dy)),-1,1));
 return {...pose,angle:clamp(raw,spec.min,spec.max),outside:raw<spec.min-.01||raw>spec.max+.01};
}
function sprite(value,angle=0,extension=0) {
 const type=typeOf(value),side=colorOf(value),key=`${type}:${side}`;
 if(!ART[type])return token(value);
 const staticPose=Math.abs(angle)<.00001&&Math.abs(extension)<.0001;
 let canvas=staticPose?idle.get(key):work.get(type);
 if(canvas&&staticPose)return canvas;
 if(!canvas){canvas=document.createElement('canvas');canvas.width=1152;canvas.height=1152;(staticPose?idle:work).set(staticPose?key:type,canvas);}
 if(type===L&&angle)court.drawPaladinSwing(canvas,art[type],side,angle);else if(type===B&&angle)bishop.drawSlash(canvas,art[type],side,angle);else if(courtNames[type])court.drawCourt(canvas,art[type],courtNames[type],side,extension);else if(type===A)archer.drawArcher(canvas,art[type],side,angle);else if(type===O)ogre.drawOgre(canvas,art[type],side,extension);else if(type===N)knight.drawKnight(canvas,art[type],side,extension);else if(type===B)bishop.drawBishop(canvas,art[type],side,extension);else if(type===R&&angle)rook.drawRookPound(canvas,art[type],side,angle);else if(type===R)rook.drawRook(canvas,art[type],side,extension);else if(type===G)guard.drawGuard(canvas,art[type],side,extension);else pawn.drawPawn(canvas,art[type],side,angle,extension);
 return canvas;
}
const fxCanvas=document.createElement('canvas');fxCanvas.width=SIZE;fxCanvas.height=SIZE;
// fx: {cut} splits along a slash; {frost, shatter} ices the figure then breaks it into wedges.
function drawPiece(out,value,pose,opacity=1,extension=0,fx=null) {
 if(opacity<=0)return;
 if(fx&&(fx.frost||fx.shatter)){
  const c=fxCanvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,SIZE,SIZE);drawPiece(c,value,pose,1,extension);
  if(fx.frost){c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(196,230,255,${.72*fx.frost})`;c.fillRect(0,0,SIZE,SIZE);c.globalCompositeOperation='source-over';}
  if(!fx.shatter){out.save();out.globalAlpha=opacity;out.drawImage(fxCanvas,0,0);out.restore();return;}
  const {point,t}=fx.shatter,k=ease(t),n=9;
  for(let i=0;i<n;i++){
   const a0=i/n*Math.PI*2+.3,a1=(i+1)/n*Math.PI*2+.3,mid=(a0+a1)/2,far=400;
   out.save();out.globalAlpha=opacity*(1-t);
   out.translate(Math.cos(mid)*48*k,Math.sin(mid)*34*k+70*t*t);
   out.translate(point.x,point.y);out.rotate((i%2?1:-1)*.7*k);out.translate(-point.x,-point.y);
   out.beginPath();out.moveTo(point.x,point.y);out.lineTo(point.x+Math.cos(a0)*far,point.y+Math.sin(a0)*far);out.lineTo(point.x+Math.cos(a1)*far,point.y+Math.sin(a1)*far);out.closePath();out.clip();
   out.drawImage(fxCanvas,0,0);out.restore();
  }
  return;
 }
 const cut=fx?.cut;
 if(cut){
  // Two halves split along the slash: the upper one slides down the cut.
  const n={x:-cut.dir.y,y:cut.dir.x},far=2000,p=cut.point,k=ease(cut.t);
  for(const s of [-1,1]){
   const upper=n.y*s<0;
   out.save();out.beginPath();out.moveTo(p.x-cut.dir.x*far,p.y-cut.dir.y*far);out.lineTo(p.x+cut.dir.x*far,p.y+cut.dir.y*far);
   out.lineTo(p.x+cut.dir.x*far+n.x*far*s,p.y+cut.dir.y*far+n.y*far*s);out.lineTo(p.x-cut.dir.x*far+n.x*far*s,p.y-cut.dir.y*far+n.y*far*s);out.closePath();out.clip();
   out.translate(n.x*s*5*k+(upper?cut.dir.x*16*k:0),n.y*s*5*k+(upper?cut.dir.y*16*k:0));
   drawPiece(out,value,pose,opacity,extension);out.restore();
  }
  return;
 }
 const spec=specs[typeOf(value)],ground=pose.ground??pose.foot,shadowScale=clamp(1-(pose.lift??0)/TILE*.4,.6,1);
 out.save();out.globalAlpha=opacity;out.fillStyle='#343a2229';out.beginPath();out.ellipse(ground.x,ground.y-2,210*pose.scale*shadowScale,36*pose.scale*shadowScale,0,0,Math.PI*2);out.fill();
 out.translate(pose.foot.x,pose.foot.y);out.scale(pose.scale*pose.facing*(pose.sx??1),pose.scale*(pose.sy??1));out.rotate(pose.rotation??0);
 // A soft contrasting rim keeps each army readable on the painted board's light and dark zones.
 out.shadowColor=colorOf(value)?'rgba(250,246,232,.85)':'rgba(28,24,16,.8)';out.shadowBlur=5;
 out.drawImage(sprite(value,pose.angle,extension),-spec.anchor.x,-spec.anchor.y);out.restore();
}
function bolt(out,start,end,t,scale=1) {
 if(t<0||t>1)return;
 const p=mix(start,end,t),angle=Math.atan2(end.y-start.y,end.x-start.x);
 out.save();out.translate(p.x,p.y);out.rotate(angle);out.lineWidth=2.4*scale;out.strokeStyle='#6e4e2d';out.beginPath();out.moveTo(-19*scale,0);out.lineTo(0,0);out.stroke();
 out.fillStyle='#a1a9a3';out.beginPath();out.moveTo(4*scale,0);out.lineTo(-5*scale,-3.5*scale);out.lineTo(-5*scale,3.5*scale);out.closePath();out.fill();out.restore();
}
function impact(out,point,t,scale=1) {
 if(t<0||t>1)return;
 out.save();out.globalAlpha=(1-t)*.85;out.strokeStyle='#c18d4f';out.lineWidth=2*scale;out.beginPath();out.arc(point.x,point.y,(5+t*17)*scale,0,Math.PI*2);out.stroke();out.restore();
}
function streak(out,points,width,colour) {
 out.save();out.lineCap='round';out.strokeStyle=colour;
 for(let i=1;i<points.length;i++){const k=i/(points.length-1);out.globalAlpha=.85*k;out.lineWidth=width*k;out.beginPath();out.moveTo(points[i-1].x,points[i-1].y);out.lineTo(points[i].x,points[i].y);out.stroke();}
 out.restore();
}
function slashFlash(out,cut) {
 if(cut.t<0||cut.t>.6)return;
 const k=cut.t/.6,l=46;out.save();out.globalAlpha=1-k;out.strokeStyle='#fffbef';out.lineWidth=3*(1-k)+.5;out.beginPath();
 out.moveTo(cut.point.x-cut.dir.x*l,cut.point.y-cut.dir.y*l);out.lineTo(cut.point.x+cut.dir.x*l,cut.point.y+cut.dir.y*l);out.stroke();out.restore();
}
function smash(out,point,t) {
 if(t<0||t>1)return;
 const k=ease(t);out.save();
 out.globalAlpha=(1-t)*.9;out.strokeStyle='#c9b58c';out.lineWidth=3*(1-t)+1;out.beginPath();out.ellipse(point.x,point.y,12+62*k,(12+62*k)*.32,0,0,Math.PI*2);out.stroke();
 out.strokeStyle='#3d3a2e';out.lineWidth=1.6;out.globalAlpha=1-t;
 for(let i=0;i<6;i++){const a=i*1.047+.4,l=34*Math.min(1,t*5);out.beginPath();out.moveTo(point.x,point.y);out.lineTo(point.x+Math.cos(a)*l*.55+4,point.y+Math.sin(a)*l*.2-2);out.lineTo(point.x+Math.cos(a)*l,point.y+Math.sin(a)*l*.34);out.stroke();}
 out.fillStyle='#b9ad91';
 for(let i=0;i<9;i++){const a=i*.698+.2,r=10+52*k;out.globalAlpha=.55*(1-t);out.beginPath();out.arc(point.x+Math.cos(a)*r,point.y+Math.sin(a)*r*.32-18*k,5+9*k,0,Math.PI*2);out.fill();}
 out.restore();
}
// Two rows of bone teeth snapping shut on the victim.
function jaws(out,p,t) {
 if(t<0||t>1)return;
 const close=ease(Math.min(1,t/.35)),gap=3+30*(1-close),w=58,n=6;out.save();out.globalAlpha=t>.6?1-(t-.6)/.4:1;
 out.fillStyle='#f3ead3';out.strokeStyle='#3b3226';out.lineWidth=1.3;out.lineJoin='round';
 for(const dir of [-1,1])for(let i=0;i<n;i++){
  const x0=p.x-w/2+i*w/n,x1=x0+w/n,xm=(x0+x1)/2,u=(xm-p.x)/(w/2),base=p.y+dir*(gap+10*u*u);
  out.beginPath();out.moveTo(x0,base);out.lineTo(x1,base);out.lineTo(xm,base-dir*(17-5*u*u));out.closePath();out.fill();out.stroke();
 }
 out.restore();
}
// Teeth shoot out of the Beast's mouth to the victim, snap shut, and retract.
function teeth(out,mouth,target,ms,span) {
 if(ms<0||ms>span)return;
 const t=ms/span,reach=t<.35?ease(t/.35):t<.6?1:1-ease((t-.6)/.4),close=t<.35?0:ease(Math.min(1,(t-.35)/.1));
 const p=mix(mouth,target,reach),scale=.45+.55*reach,gap=(3+26*(1-close))*scale,w=54*scale,n=6;
 out.save();out.globalAlpha=t>.85?1-(t-.85)/.15:1;out.strokeStyle='#5a1c1c';out.lineWidth=3*scale;out.globalAlpha*=.8;
 out.beginPath();out.moveTo(mouth.x,mouth.y);out.lineTo(p.x,p.y);out.stroke();out.globalAlpha/=.8;
 out.fillStyle='#f3ead3';out.strokeStyle='#3b3226';out.lineWidth=1.3;out.lineJoin='round';
 for(const dir of [-1,1])for(let i=0;i<n;i++){
  const x0=p.x-w/2+i*w/n,x1=x0+w/n,xm=(x0+x1)/2,u=(xm-p.x)/(w/2),base=p.y+dir*(gap+10*scale*u*u);
  out.beginPath();out.moveTo(x0,base);out.lineTo(x1,base);out.lineTo(xm,base-dir*(17-5*u*u)*scale);out.closePath();out.fill();out.stroke();
 }
 out.restore();
}
// A funnel of wind arcs around the spinning Queen.
function vortex(out,foot,phase,strength) {
 if(strength<=0)return;
 out.save();out.lineCap='round';
 for(let i=0;i<7;i++){
  const h=i/6,y=foot.y-8-h*112,rx=14+h*34,ry=rx*.28,start=phase*1.6+i*.9;
  out.globalAlpha=strength*(.25+.45*(1-h*.5));out.strokeStyle=i%2?'#e9e2cc':'#b9c7c9';out.lineWidth=2.2+1.4*(1-h);
  out.beginPath();out.ellipse(foot.x+Math.sin(phase+h*3)*4,y,rx,ry,0,start,start+Math.PI*1.25);out.stroke();
 }
 out.restore();
}
 function boardBackground() {
  ctx.clearRect(0,-headroom,SIZE,SIZE+headroom);ctx.fillStyle='#e6e1cf';ctx.fillRect(0,-headroom,SIZE,SIZE+headroom);
  if(boardArt.complete&&boardArt.naturalWidth){
   // The painted board turns with the viewer, like the physical board.
   ctx.save();if(flipped){ctx.translate(PAD+4*TILE,PAD+4*TILE);ctx.rotate(Math.PI);ctx.translate(-PAD-4*TILE,-PAD-4*TILE);}
   ctx.drawImage(boardArt,PAD,PAD,8*TILE,8*TILE);ctx.restore();
   ctx.strokeStyle='#3a3528';ctx.lineWidth=3;ctx.strokeRect(PAD-1.5,PAD-1.5,8*TILE+3,8*TILE+3);ctx.lineWidth=1;
  }else for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   ctx.fillStyle=(row+col)%2?'#89977b':'#e9e6d5';ctx.fillRect(PAD+col*TILE,PAD+row*TILE,TILE,TILE);
   ctx.strokeStyle='#656e4d14';ctx.strokeRect(PAD+col*TILE+.5,PAD+row*TILE+.5,TILE-1,TILE-1);
  }
  decorate?.(ctx,api,'under');
  if(selected!==null){const c=cell(selected);ctx.strokeStyle='#6b7954';ctx.lineWidth=3;ctx.strokeRect(PAD+c.col*TILE+1.5,PAD+c.row*TILE+1.5,TILE-3,TILE-3);ctx.lineWidth=1;}
  if(coords){ctx.fillStyle='#6d765d';ctx.font='13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
   for(let i=0;i<8;i++){ctx.fillText('abcdefgh'[flipped?7-i:i],PAD+(i+.5)*TILE,SIZE-14);ctx.fillText(String(flipped?i+1:8-i),15,PAD+(i+.5)*TILE);}}
 }
 function selectionTarget() {
  if(aimSquare===null)return null;
  const value=position.board[aimSquare];
  return value?world(specs[typeOf(value)].hit,poseFor(value,aimSquare),typeOf(value)):foot(aimSquare);
 }
 function desiredPose() {
  if(selected===null||!position.board[selected])return null;
  const value=position.board[selected],pose=poseFor(value,selected),target=selectionTarget();
  return target?aimed(value,pose,target):pose;
 }
 function render(time=performance.now()) {
 const a0=animation,since=a0?.shakeAt!=null?(time-a0.start)/a0.speed-a0.shakeAt:-1,shake=since>=0&&since<240?7*(1-since/240):0;
 ctx.save();ctx.translate(0,headroom);if(shake)ctx.translate(Math.sin(since*.09)*shake,Math.cos(since*.13)*shake*.6);
 boardBackground();
 const poses=new Map();
 for(let sq=0;sq<64;sq++)if(position.board[sq])poses.set(sq,{value:position.board[sq],pose:poseFor(position.board[sq],sq),opacity:1,extension:0});
 if(selected!==null&&poses.has(selected))Object.assign(poses.get(selected).pose,{angle:aimAngle,facing:aimFacing});
 let shot=null,hit=null;const effects=[];
 if(animation){
  const a=animation,t=clamp((time-a.start)/a.speed,0,a.duration),actor=poses.get(a.move.from),victim=poses.get(a.move.swap?a.move.to:a.move.shove?.from??a.move.captures[0]);
  if(a.type==='slash'){
   const s=bishop.SLASH,tipWorld=ms=>world(bishop.tipAt(bishop.slashAngle(ms),colorOf(a.value)),{...a.pose,foot:a.approach},B);
   const foot=t<s.approach?mix(a.from.foot,a.approach,ease(t/s.approach)):t<s.hold?a.approach:mix(a.approach,a.to.foot,ease((t-s.hold)/(s.duration-s.hold)));
   actor.pose={...a.pose,foot,angle:bishop.slashAngle(t)};
   const trail=[];for(let ms=Math.max(s.strike[0],t-110);ms<=Math.min(t,s.strike[1]+50);ms+=6)trail.push(tipWorld(ms));
   if(trail.length>1)effects.push(()=>streak(ctx,trail,8,'#f7f6ee'));
   if(victim&&t>=bishop.CONTACT_MS){
    const p0=tipWorld(bishop.CONTACT_MS-6),p1=tipWorld(bishop.CONTACT_MS+6),len=Math.hypot(p1.x-p0.x,p1.y-p0.y)||1,sign=p1.y>=p0.y?1:-1;
    const cut={point:a.target,dir:{x:(p1.x-p0.x)/len*sign,y:(p1.y-p0.y)/len*sign},t:(t-bishop.CONTACT_MS)/340};victim.fx={cut};
    victim.opacity=1-clamp((t-bishop.CONTACT_MS-140)/260,0,1);
    effects.push(()=>slashFlash(ctx,cut));
   }
  }
  else if(a.type==='hammer'){
   const s=court.SMASH,chopped=t-s.chop[1];
   let foot=a.approach,ground,lift=0;
   if(t<s.charge){const f=clamp(t/s.charge,0,1);ground=mix(a.from.foot,a.approach,ease(f));lift=Math.min(TILE*.42,Math.max(0,ground.y-150))*4*f*(1-f);foot={x:ground.x,y:ground.y-lift};}
   else if(t>=s.hold&&!a.move.selfRemove)foot=mix(a.approach,a.to.foot,ease((t-s.hold)/(s.recover-s.hold)));
   actor.pose={...a.pose,foot,ground:ground??foot,lift,angle:court.smashAngle(t)};
   if(a.move.selfRemove)actor.opacity=1-clamp((t-s.hold)/(s.recover-s.hold),0,1);
   const face=ms=>world(court.hammerFace(colorOf(a.value),court.smashAngle(ms)),{...a.pose,foot:a.approach},L);
   const trail=[];for(let ms=Math.max(s.chop[0],t-120);ms<=Math.min(t,s.chop[1]+30);ms+=6)trail.push(face(ms));
   if(trail.length>1)effects.push(()=>streak(ctx,trail,10,'#f2e6c8'));
   if(victim&&chopped>=0){const k=ease(chopped/110);victim.pose={...victim.pose,sx:1+.28*k,sy:1-.5*k};victim.opacity=1-clamp((chopped-60)/260,0,1);}
   effects.push(()=>smash(ctx,a.victimFoot,chopped/420));
  }
  else if(a.type==='chain'){
   // Stop beside each victim and bite; after the last bite step onto its square.
   const bites=a.stops.length*CHAIN_STEP,last=a.stops.at(-1);
   if(t<bites){
    const step=Math.floor(t/CHAIN_STEP),local=t-step*CHAIN_STEP,start=step?a.stops[step-1]:a.from.foot,end=a.stops[step],victimFoot=foot(a.move.captures[step]);
    actor.pose={...a.from,facing:Math.sign(victimFoot.x-end.x)||actor.pose.facing,foot:mix(start,end,ease(local/(CHAIN_STEP*.45)))};actor.extension=court.actionAt(clamp(local/CHAIN_STEP,0,1));
   }else actor.pose={...a.from,facing:Math.sign(a.end.x-last.x)||actor.pose.facing,foot:mix(last,a.end,ease((t-bites)/200))};
   a.move.captures.forEach((sq,i)=>{const v=poses.get(sq);if(!v)return;const bite=i*CHAIN_STEP+CHAIN_STEP*.45+CHAIN_STEP*.55*.45;v.opacity=1-clamp((t-bite)/160,0,1);const target=world(specs[typeOf(v.value)].hit,v.pose,typeOf(v.value)),stand={...a.from,foot:a.stops[i],facing:Math.sign(foot(sq).x-a.stops[i].x)||a.from.facing};const mouth=world(court.beastMouth(colorOf(a.value)),stand,S);effects.push(()=>teeth(ctx,mouth,target,t-(i*CHAIN_STEP+CHAIN_STEP*.45),CHAIN_STEP*.55));if(t>=bite){const k=ease((t-bite)/120);v.pose={...v.pose,sx:1-.18*k,sy:1-.12*k};}});
  }
  else if(a.type==='pound'){
   const P=rook.POUND,foot=t<P.approach?mix(a.from.foot,a.stop,ease(t/P.approach)):t<P.settle?a.stop:mix(a.stop,a.to.foot,ease((t-P.settle)/(P.duration-P.settle)));
   actor.pose={...a.pose,foot,angle:rook.poundAngle(t)};
   const baseAt=world(rook.towerBase(colorOf(a.value),0),{...a.pose,foot:a.stop},R);
   rook.SLAMS.forEach((slam,i)=>{const since=t-slam;if(since>=0)effects.push(()=>smash(ctx,{x:baseAt.x,y:baseAt.y-2},since/(i?420:320)));});
   if(victim){
    const first=t-rook.SLAMS[0],second=t-rook.SLAMS[1];
    if(first>=0&&second<0)victim.pose={...victim.pose,foot:{x:victim.pose.foot.x,y:victim.pose.foot.y-16*Math.sin(Math.PI*clamp(first/220,0,1))}};
    if(second>=0){const k=ease(second/110);victim.pose={...victim.pose,sx:1+.28*k,sy:1-.5*k};victim.opacity=1-clamp((second-60)/260,0,1);}
   }
  }
  else if(a.type==='spin'){
   const S=SPIN,[t0,t1]=S.travel,spinRate=t<S.release?clamp(t/250,0,1):1-clamp((t-S.release)/(a.duration-S.release),0,1);
   const phase=t*.024*Math.max(spinRate,.001);
   const foot=t<t0?a.from.foot:t<t1?mix(a.from.foot,a.stop,ease((t-t0)/(t1-t0))):t<S.release?a.stop:mix(a.stop,a.to.foot,ease((t-S.release)/(a.duration-S.release)));
   const turn=Math.cos(phase);actor.pose={...a.from,foot,sx:spinRate>.02?(Math.abs(turn)<.2?.2*Math.sign(turn||1):turn):1};
   const strength=Math.min(1,t/250)*(t<S.release?1:1-clamp((t-S.release)/220,0,1));
   effects.push(()=>vortex(ctx,foot,phase,strength));
   if(victim&&t>=S.contact){const k=clamp((t-S.contact)/420,0,1),turnV=Math.cos((t-S.contact)*.03);
    victim.pose={...victim.pose,sx:(Math.abs(turnV)<.2?.2*Math.sign(turnV||1):turnV)*(1-.5*k),sy:1-.5*k,foot:{x:victim.pose.foot.x+(a.stop.x-victim.pose.foot.x)*.3*k,y:victim.pose.foot.y-46*k}};
    victim.opacity=1-clamp((t-S.contact-150)/300,0,1);}
  }
  else if(a.type==='blow'){
   const spec=blows[a.blow],since=t-BLOW.strike;
   actor.pose={...a.pose,foot:footAt(t,a.from.foot,a.stop,a.to.foot),rotation:tiltAt(t,spec.tilt)};
   if(victim&&since>=0){
    if(spec.effect==='smash'){const k=ease(since/110);victim.pose={...victim.pose,sx:1+.28*k,sy:1-.5*k};victim.opacity=1-clamp((since-60)/260,0,1);effects.push(()=>smash(ctx,a.victimFoot,since/420));}
    else if(spec.effect==='topple'){const k=ease(since/380);victim.pose={...victim.pose,rotation:1.45*k*a.away*victim.pose.facing,foot:{x:victim.pose.foot.x+a.away*12*k,y:victim.pose.foot.y}};victim.opacity=1-clamp((since-220)/300,0,1);effects.push(()=>impact(ctx,a.target,since/320,1.6));}
    else victim.fx={frost:clamp(since/160,0,1),shatter:since>200?{point:a.target,t:clamp((since-200)/420,0,1)}:null};
   }
  }
  else if(a.type==='move')actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease(t/420))};
  else if(a.type==='swap'){
   const motion=swapAt(t/a.duration,a.from.foot,a.to.foot);
   actor.pose={...a.from,foot:motion.actor};actor.extension=court.actionAt(t/a.duration);
   victim.pose={...a.partner,foot:motion.partner};
  }
  else if(a.type==='paladin'){
   const motion=chargeAt(t/a.duration),ground=mix(a.from.foot,a.to.foot,motion.travel);
   const lift=Math.min(TILE*.42,Math.max(0,ground.y-150))*motion.lift;
   actor.pose={...a.from,ground,lift,foot:{x:ground.x,y:ground.y-lift}};actor.extension=court.actionAt(t/a.duration);
   if(victim){victim.opacity=1-clamp((t/a.duration-CHARGE_CONTACT)/.18,0,1);hit={point:a.target,t:(t/a.duration-CHARGE_CONTACT)/.22};}
   if(a.move.selfRemove)actor.opacity=1-clamp((t/a.duration-.8)/.2,0,1);
  }
  else if(a.type==='advance'){
   actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease(t/(a.duration*.65)))};
   actor.extension=newMotions[typeOf(a.value)].actionAt(t/a.duration);
   if(victim)victim.opacity=1-clamp((t-a.duration*.5)/180,0,1);
   hit={point:a.target,t:(t-a.duration*.5)/240};
  }
  else if(a.type==='knight'){
   const motion=knight.leapAt(t/a.duration),ground=mix(a.from.foot,a.to.foot,motion.travel);
   // Keep the complete spear visible when jumping along the board's top edge.
   const lift=Math.min(TILE*.7,Math.max(0,ground.y-specs[N].scale*1000-12))*motion.lift;
   actor.pose={...a.from,ground,lift,foot:{x:ground.x,y:ground.y-lift},rotation:motion.rotation};
   actor.extension=motion.crouch;
   const landing=a.duration*knight.LANDING;
   if(victim)victim.opacity=1-clamp((t-landing)/120,0,1);
   hit={point:a.to.foot,t:(t-landing)/180};
  }
  else if(a.type==='ogre'){
   const drive=ease((t-780)/360),travel=a.move.shove?{x:(a.pushedTo.foot.x-a.victimPose.foot.x)*drive,y:(a.pushedTo.foot.y-a.victimPose.foot.y)*drive}:{x:0,y:0};
   if(t<300)actor.pose={...a.pose,foot:mix(a.from.foot,a.approach,ease(t/300))};
   else if(t<1300){actor.pose={...a.pose,foot:{x:a.approach.x+travel.x,y:a.approach.y+travel.y}};actor.extension=ogre.PUSH*ogre.pushAt((t-300)/1000);}
   else actor.pose={...a.pose,foot:mix({x:a.approach.x+travel.x,y:a.approach.y+travel.y},a.to.foot,ease((t-1300)/300))};
   if(victim){if(a.move.shove)victim.pose={...a.victimPose,foot:mix(a.victimPose.foot,a.pushedTo.foot,drive)};else victim.opacity=1-clamp((t-780)/180,0,1);}
   hit={point:{x:a.target.x+travel.x,y:a.target.y+travel.y},t:(t-780)/260};
  }
  else if(a.type==='pawn'){
   if(t<280)actor.pose={...a.from,angle:a.pose.angle*ease(t/280),facing:a.pose.facing};
   else if(t<550)actor.pose={...a.pose,foot:mix(a.from.foot,a.approach,ease((t-280)/270))};
   else if(t<1350){actor.pose={...a.pose,foot:a.approach};actor.extension=pawn.THRUST*pawn.thrustAt((t-550)/800);}
   else actor.pose={...a.pose,foot:mix(a.approach,a.to.foot,ease((t-1350)/280)),angle:a.pose.angle*(1-ease((t-1350)/280))};
   if(victim)victim.opacity=1-clamp((t-910)/180,0,1);
   hit={point:a.target,t:(t-910)/260};
  }else{
   actor.pose={...a.pose,angle:a.pose.angle*ease(t/160)};
   if(t>180&&t<500)actor.pose.angle-=Math.sin(clamp((t-180)/320,0,1)*Math.PI)*1.8*Math.PI/180;
   if(victim)victim.opacity=1-clamp((t-440)/180,0,1);
   if(!a.closeup){shot={start:world(archer.muzzle(a.pose.angle,colorOf(a.value)),a.pose,A),end:a.target,t:(t-180)/260};hit={point:a.target,t:(t-440)/260};}
   else actor.pose={...a.from,angle:0};
  }
  if(a.closeup)drawEncounter(a,t);else if(closeup)closeup.panel.hidden=true;
  const impactTime=a.type==='pound'?rook.SLAMS[1]:a.type==='spin'?SPIN.contact:a.type==='blow'?BLOW.strike:a.type==='chain'?CHAIN_STEP*.5:a.type==='slash'?bishop.CONTACT_MS:a.type==='hammer'?court.SMASH.chop[1]:a.type==='pawn'?910:a.type==='ogre'?780:a.type==='knight'?a.duration*knight.LANDING:a.type==='paladin'?a.duration*CHARGE_CONTACT:a.type==='advance'?a.duration*.5:440;
  if(a.type==='knight'&&t>=a.duration*.35&&!a.airborne){a.airborne=true;onStatus('Airborne. Clearing the intervening pieces…');}
  if(a.type!=='move'&&a.type!=='swap'&&t>=impactTime&&!a.contacted){a.contacted=true;onStatus(a.move.selfRemove?'The Paladin and his target are removed together.':a.type==='knight'||(a.type==='paladin'&&!victim)?'Landed. Settling into stance…':'Hit. Recovering…');}
 }
 const ordered=[...poses].sort((a,b)=>a[1].pose.foot.y-b[1].pose.foot.y);
 if(animation){const i=ordered.findIndex(([sq])=>sq===animation.move.from);ordered.push(...ordered.splice(i,1));}
 for(const [,unit] of ordered)drawPiece(ctx,unit.value,unit.pose,unit.opacity,unit.extension,unit.fx);
 for(const effect of effects)effect();
 if(shot)bolt(ctx,shot.start,shot.end,shot.t);
 if(hit)impact(ctx,hit.point,hit.t);
 decorate?.(ctx,api,'over');
 ctx.restore();
}
function drawEncounter(a,t) {
 closeup.panel.hidden=false;closeup.title.textContent=`${['Ivory','Charcoal'][colorOf(a.value)]} Archer · ${sqName(a.move.from)} → ${sqName(a.move.captures[0])}`;
 const detail=closeup.ctx;detail.clearRect(0,0,900,480);
 const victimPose={foot:{x:665,y:445},scale:specs[typeOf(a.victim)].scale*3,facing:-1,angle:0};
 const target=world(specs[typeOf(a.victim)].hit,victimPose,typeOf(a.victim));
 const actor=aimed(a.value,{foot:{x:205,y:445},scale:.34,facing:1,angle:0},target);
 const angle=actor.angle*ease(t/160)-(t>180&&t<500?Math.sin((t-180)/320*Math.PI)*.025:0);
 drawPiece(detail,a.victim,victimPose,1-clamp((t-440)/180,0,1));
 drawPiece(detail,a.value,{...actor,angle});
 bolt(detail,world(archer.muzzle(actor.angle,colorOf(a.value)),actor,A),target,(t-180)/260,1.5);
 impact(detail,target,(t-440)/260,1.5);
}
 function tick(time) {
  frame=0;const dt=previousTime?Math.min((time-previousTime)/1000,.05):1/60;previousTime=time;
  const wanted=animation?null:desiredPose();
  if(wanted){aimFacing=wanted.facing;aimAngle+=(wanted.angle-aimAngle)*(reducedMotion?1:1-Math.exp(-14*dt));if(Math.abs(wanted.angle-aimAngle)<.0001)aimAngle=wanted.angle;}
  const a=animation;
  if(a&&!a.done&&(time-a.start)>=a.duration*a.speed){a.done=true;a.resolve(true);}
  render(time);
  if(labels)drawLabels();
  if((a&&!a.done)||(wanted&&aimAngle!==wanted.angle))wake();else previousTime=0;
 }
 function drawLabels() {
  ctx.save();ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let sq=0;sq<64;sq++){const v=position.board[sq];if(!v||animation)continue;const p=foot(sq),x=p.x+TILE*.36,y=p.y-TILE*.12;
   ctx.fillStyle=colorOf(v)?'#2f3331':'#f4efe0';ctx.strokeStyle=colorOf(v)?'#c9cdc8':'#4b4a3c';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.fillStyle=ctx.strokeStyle;ctx.fillText(pieces.LETTERS?.[typeOf(v)]??'',x,y+1);}
  ctx.restore();
 }
 function wake(){if(ready&&!frame)frame=requestAnimationFrame(tick);}
 function plan(move,speed) {
 const value=position.board[move.from],from=poseFor(value,move.from),to=poseFor(value,move.to),victimSquare=move.swap?move.to:move.shove?.from??move.captures[0],victim=position.board[victimSquare];
 const base={move,value,from,to,victim,start:performance.now(),speed,contacted:false};
 if(move.swap){base.type='swap';base.duration=1100;base.partner=poseFor(victim,move.to);}
 else if(typeOf(value)===N){base.type='knight';base.duration=knight.DURATION;from.facing=Math.sign(to.foot.x-from.foot.x);}
 else if(typeOf(value)===L&&victim){
  const target=world(specs[typeOf(victim)].hit,poseFor(victim,victimSquare),typeOf(victim)),dx=target.x-from.foot.x;
  const pose={...from,facing:Math.abs(dx)>1?Math.sign(dx):sideFacing(value)},contact=world(court.hammerFace(colorOf(value),court.SMASH.down),pose,L);
  Object.assign(base,{type:'hammer',duration:court.SMASH.duration,shakeAt:court.SMASH.chop[1],target,pose,victimFoot:foot(victimSquare),approach:{x:pose.foot.x+target.x-pose.facing*12-contact.x,y:pose.foot.y+target.y-contact.y}});
 }
 else if(typeOf(value)===L){base.type='paladin';base.duration=court.figures.paladin.duration;from.facing=Math.sign(to.foot.x-from.foot.x)||sideFacing(value);if(victim)base.target=world(specs[typeOf(victim)].hit,poseFor(victim,victimSquare),typeOf(victim));}
 else if(!victim){base.type='move';base.duration=420;const dx=to.foot.x-from.foot.x;from.facing=dx?Math.sign(dx):sideFacing(value);}
 else{
  const target=world(specs[typeOf(victim)].hit,poseFor(victim,victimSquare),typeOf(victim));
  const pose=aimed(value,from,target);Object.assign(base,{target,pose});
  if(typeOf(value)===O){
   base.type='ogre';base.duration=1600;
   const contact=world(ogre.palmAt(colorOf(value),ogre.PUSH),pose,O);
   base.approach={x:pose.foot.x+target.x-contact.x,y:pose.foot.y+target.y-contact.y};
   base.victimPose=poseFor(victim,victimSquare);
   if(move.shove)base.pushedTo=poseFor(victim,move.shove.to);
  }else if(typeOf(value)===P){
   base.type='pawn';base.duration=1630;
   const contact=world(pawn.tipAt(pose.angle,colorOf(value),pawn.THRUST),pose,P);
   base.approach={x:pose.foot.x+target.x-contact.x,y:pose.foot.y+target.y-contact.y};
  }else if(typeOf(value)===B){
   base.type='slash';base.duration=bishop.SLASH.duration;
   const contact=world(bishop.tipAt(bishop.SLASH.contact,colorOf(value)),pose,B);
   // Strike the near edge of the victim so the two figures overlap less.
   base.approach={x:pose.foot.x+target.x-pose.facing*12-contact.x,y:pose.foot.y+target.y-contact.y};
  }else if(typeOf(value)===S){
   // Beast chain: bite each victim in order, finishing on the last one.
   base.type='chain';base.stops=move.captures.reduce((list,sq)=>[...list,stopPoint(list.at(-1)??from.foot,foot(sq),54,sideFacing(value))],[]);base.end=foot(move.to);base.duration=move.captures.length*CHAIN_STEP+200;from.facing=pose.facing;
  }else if(typeOf(value)===R){
   // Stand so the tower base lands just short of the victim's feet.
   const victimFoot=foot(victimSquare),away=Math.sign(victimFoot.x-from.foot.x)||sideFacing(value),stand={...pose,facing:away};
   const base0=world(rook.towerBase(colorOf(value),0),stand,R);
   Object.assign(base,{type:'pound',duration:rook.POUND.duration,victimFoot,pose:stand,stop:{x:victimFoot.x-(base0.x-stand.foot.x)-away*16,y:victimFoot.y+2}});
  }else if(typeOf(value)===Q){
   const victimFoot=foot(victimSquare),away=Math.sign(victimFoot.x-from.foot.x)||sideFacing(value);
   Object.assign(base,{type:'spin',duration:SPIN.duration,victimFoot,stop:stopPoint(from.foot,victimFoot,78,sideFacing(value)),away});
  }else if([K].includes(typeOf(value))){
   const name={[K]:'king'}[typeOf(value)],victimFoot=foot(victimSquare);
   Object.assign(base,{type:'blow',blow:name,duration:BLOW.duration,victimFoot,stop:stopPoint(from.foot,victimFoot,blows[name].gap,sideFacing(value)),away:Math.sign(victimFoot.x-from.foot.x)||sideFacing(value),shakeAt:name==='rook'?BLOW.strike:null});from.facing=pose.facing;
  }else if(M===typeOf(value)||!ART[typeOf(value)]){base.type='advance';base.duration=newMotions[typeOf(value)].DURATION;from.facing=pose.facing;}else{base.type='archer';base.duration=820;base.closeup=pose.outside&&!!closeup;}
 }
 return {base,verb:base.type==='move'?'Moving…':base.type==='swap'?'Trading places…':base.type==='pound'?'Pounding the ground…':base.type==='spin'?'Spinning up a whirlwind…':base.type==='blow'?blows[base.blow].verb:base.type==='chain'?(move.captures.length>1?`Starting a ${move.captures.length}-bite chain…`:'Lunging to bite…'):base.type==='slash'?'Drawing the dagger…':base.type==='hammer'?(move.selfRemove?'Raising the hammer. This capture will remove both pieces…':'Raising the hammer…'):base.type==='paladin'?(move.selfRemove?'Charging. This capture will remove both pieces…':'Preparing the Paladin’s charge…'):base.type==='advance'?'Advancing to capture…':base.type==='knight'?'Preparing to leap…':base.type==='ogre'?'Bracing for contact…':base.closeup?'Taking aim · attack close-up.':'Taking aim…'};
 }
 const api={
  SIZE,PAD,TILE,headroom,
  get animating(){return !!animation&&!animation.done;},
  get position(){return position;},
  foot,cell,
  /** Board square under a point in canvas pixels, or null. */
  squareAt(x,y){y-=headroom;const col=Math.floor((x-PAD)/TILE),row=Math.floor((y-PAD)/TILE);if(col<0||col>7||row<0||row>7)return null;return flipped?row*8+(7-col):(7-row)*8+col;},
  load(){boardArt.onload=()=>wake();boardArt.src=BOARD_ART;return Promise.all(Object.entries(ART).map(([type,name])=>new Promise((resolve,reject)=>{art[type].onload=resolve;art[type].onerror=reject;art[type].src=ART_FILES[name];}))).then(()=>{ready=true;wake();});},
  /** New position: ends any finished or running animation. */
  setPosition(next){if(animation&&!animation.done)animation.resolve(false);animation=null;position=next;aimAngle=0;wake();},
  setSelected(sq){if(sq!==selected){selected=sq;aimAngle=0;aimFacing=sq===null||!position.board[sq]?1:sideFacing(position.board[sq]);}wake();},
  setAim(sq){aimSquare=sq;wake();},
  setFlipped(on){flipped=on;idle.clear();wake();},
  setCoords(on){coords=on;wake();},
  setLabels(on){labels=on;wake();},
  setReducedMotion(on){reducedMotion=on;},
  setDecorate(fn){decorate=fn;wake();},
  redraw(){wake();},
  /** Animate a move on the current position. Resolves true at the final frame, false if cancelled. */
  play(move,{speed=1}={}){
   if(animation&&!animation.done)animation.resolve(false);
   const {base,verb}=plan(move,speed);
   return new Promise(resolve=>{animation={...base,resolve};onStatus(verb);wake();});
  },
  cancel(){if(animation&&!animation.done)animation.resolve(false);animation=null;if(closeup)closeup.panel.hidden=true;aimAngle=0;wake();},
 };
 return api;
}
