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
import {BLOW,KING_BLOW,blows,tiltAt,footAt,stopPoint} from './blows.mjs';
import {GAITS,GAIT_OF,idleAt} from './gait.mjs';
import {createKingEffects,phaseOffset} from './king-effects.mjs';
import {KING_FILES} from './king-sheets.mjs';
import {DEATHS,THEMED,drawDeath} from './king-captures.mjs';
import * as pawnIdle from '../lance/idle.mjs';
import {SHADE,shadowField,shadowWeights,fxFade} from './contact-shadow.mjs';
export const SIZE=960, PAD=32, TILE=112;
// One literal URL per image: bundlers resolve and copy each file (a template string would not).
const ART_FILES={beast:new URL('../beast/beast.webp',import.meta.url).href,queen:new URL('../queen/queen.webp',import.meta.url).href,paladin:new URL('../paladin/paladin.webp',import.meta.url).href,maester:new URL('../maester/maester.webp',import.meta.url).href,pawn:new URL('../lance/pawn.webp',import.meta.url).href,archer:new URL('../wrist-bow/archer.webp',import.meta.url).href,ogre:new URL('../ogre/ogre.webp',import.meta.url).href,knight:new URL('../knight/knight.webp',import.meta.url).href,bishop:new URL('../bishop/bishop.webp',import.meta.url).href,rook:new URL('../rook/rook.webp',import.meta.url).href,guard:new URL('../guard/guard.webp',import.meta.url).href};
// One sheet per king design (king-sheets.mjs); a side draws the king it plays (setKings).
// Painted stone board inspired by the original King Down board's capital (board-art/README.md).
const BOARD_ART=new URL('../board-art/stone-board.webp',import.meta.url).href;
/**
 * pieces: {P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName,LETTERS?} from the rules engine.
 * closeup: optional {panel,title,ctx} for steep Archer shots; without it the Archer shoots on the board.
 * onStatus: narration hook for contact moments.
 * headroom: extra canvas pixels above the board for tall back-rank figures (canvas height = SIZE+headroom).
 * setDecorate(fn): fn(ctx, scene, 'under') draws markers below the figures; fn(ctx, scene, 'over', row) is called
 * for each screen row 0–7 (top to bottom), after that row's figures and before the rows in front.
 * kings: [white, black] king designs (court.KING_DESIGNS); the trial and the trailer keep the Frost King.
 */
export function createScene({canvas,pieces,closeup=null,onStatus=()=>{},headroom=0,kings:initialKings=['frost','frost']}) {
 const {P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName}=pieces;
 const ctx=canvas.getContext('2d');
 const FALL=650, CHAIN_STEP=560, SPIN={duration:1400,travel:[250,780],contact:780,release:1150};
 const ART={[K]:'king',[S]:'beast',[Q]:'queen',[L]:'paladin',[M]:'maester',[P]:'pawn',[A]:'archer',[O]:'ogre',[N]:'knight',[B]:'bishop',[R]:'rook',[G]:'guard'};
 const art=Object.fromEntries(Object.keys(ART).filter(type=>+type!==K).map(type=>[type,new Image()]));
 // King sheets load on demand: the two in play before the scene is ready, others when a side picks them.
 const kingArt={}, drawnKings=[null,null];
 let kings=[...initialKings];
 function kingImage(design){
  let entry=kingArt[design];
  if(!entry){
   const image=new Image();
   entry=kingArt[design]={image:null,loaded:new Promise((resolve,reject)=>{image.onload=()=>{entry.image=image;wake();resolve();};image.onerror=reject;})};
   image.src=KING_FILES[design];
  }
  return entry;
 }
 const boardArt=new Image();
 const specs={ [P]:{anchor:{x:330,y:870},hit:{x:327,y:556},pivot:{x:430,y:521},scale:.132,min:pawn.MIN_ANGLE,max:pawn.MAX_ANGLE}, [A]:{anchor:{x:382,y:1066},hit:{x:344,y:424},scale:.1166,min:archer.MIN_ANGLE,max:archer.MAX_ANGLE} };
specs[O]={anchor:ogre.ANCHOR,hit:ogre.HIT,scale:.155};
specs[N]={anchor:knight.ANCHOR,hit:knight.HIT,scale:.125};
const newMotions={ [B]:bishop,[R]:rook,[G]:guard };
// Owner 2026-10-04: the Guard and the Archer 10% larger on the board (.12 → .132, .106 → .1166).
for(const [type,scale] of [[B,.13],[R,.155],[G,.132]])specs[type]={anchor:newMotions[type].ANCHOR,hit:newMotions[type].HIT,scale};
const courtNames={[Q]:'queen',[L]:'paladin',[M]:'maester',[K]:'king',[S]:'beast'};
for(const [type,name] of Object.entries(courtNames)){
 specs[type]={anchor:court.ANCHOR,hit:court.HIT,scale:court.figures[name].scale};
 newMotions[type]={DURATION:court.figures[name].duration,actionAt:court.actionAt};
}
 const FALLBACK={anchor:{x:576,y:1018},hit:{x:576,y:640},scale:.1};
 // Lab pieces without painted art: a token that slides in, no body motion.
 for(let type=1;type<16;type++){if(!specs[type])specs[type]=FALLBACK;newMotions[type]??={DURATION:900,actionAt:()=>0};}
 const idle=new Map(), work=new Map();
 let position={board:new Uint8Array(64)}, selected=null, aimSquare=null, animation=null, aimAngle=0, aimFacing=1;
 let fallen=null, res=1, frame=0, previousTime=0, ready=false, flipped=false, coords=true, coordSize=13, labels=false, reducedMotion=false, decorate=null;
 // Opt-in liveliness (setLively): quiet-move gaits, the selected figure's idle, the board's frame and light,
 // and each king's own idle effect (king-effects.mjs). All off by default, so the trial and the trailer draw exactly as before.
 const lively={moves:false,idle:false,atmosphere:false,kings:false,captures:false,pawns:false};
 const kingFx=createKingEffects({sheet:design=>kingArt[design]?.image??null,onLoad:()=>wake()});
 // Square → when a king's effect started there (what stands on his square grows back after a move).
 // drawnBefore: how many kings' effects the frame before drew (none: they all start together now).
 let kingSince=new Map(),nextSince=new Map(),frames=0,fxDrawn=[],drawnBefore=0,pawnsAtRest=0,pawnsActing=0;
 let selectedAt=0, idleTimer=0, framePattern=null, awakeUntil=0;
 const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 const cell=s=>({col:flipped?7-(s&7):s&7,row:flipped?s>>3:7-(s>>3)});
 const foot=s=>{const c=cell(s);return {x:PAD+(c.col+.5)*TILE,y:PAD+(c.row+.5)*TILE+40};};
 const sideFacing=value=>colorOf(value)?-1:1;
 // A victim thrown up keeps its contact shadow on the floor (pose.ground). (Atmosphere off, its old oval rises with it
 // as it always did: the trial and the trailer draw as before.)
 const onFloor=point=>lively.atmosphere?{ground:point}:{};
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
// sheet: a king's sheet drawn in place of his own (an effect's: the Shadow King without his smoke).
// rest: a resting pawn's action (lance/idle.mjs), drawn from his still sprite.
function sprite(value,angle=0,extension=0,sheet=null,rest=null) {
 const type=typeOf(value),side=colorOf(value),design=type===K?kings[side]:null,key=spriteKey(value,sheet);
 if(!ART[type])return token(value);
 const image=design?sheet??kingImage(design).image:art[type];
 if(design&&!image)return blank;
 if(design)drawnKings[side]=design;
 const staticPose=Math.abs(angle)<.00001&&Math.abs(extension)<.0001;
 if(rest&&staticPose&&type===P){
  const still=sprite(value);let canvas=work.get('pawn-rest');
  if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=1152;work.set('pawn-rest',canvas);}
  pawnIdle.drawIdle(canvas,still,rest);return canvas;
 }
 let canvas=staticPose?idle.get(key):work.get(type);
 if(canvas&&staticPose)return canvas;
 if(!canvas){canvas=document.createElement('canvas');canvas.width=1152;canvas.height=1152;(staticPose?idle:work).set(staticPose?key:type,canvas);}
 if(type===L&&angle)court.drawPaladinSwing(canvas,art[type],side,angle);else if(type===S&&angle)court.drawBeastBite(canvas,art[type],side,angle);else if(type===B&&angle)bishop.drawSlash(canvas,art[type],side,angle);else if(design)court.drawCourt(canvas,image,`king-${design}`,side,extension);else if(courtNames[type])court.drawCourt(canvas,art[type],courtNames[type],side,extension);else if(type===A)archer.drawArcher(canvas,art[type],side,angle);else if(type===O)ogre.drawOgre(canvas,art[type],side,extension);else if(type===N)knight.drawKnight(canvas,art[type],side,extension);else if(type===B)bishop.drawBishop(canvas,art[type],side,extension);else if(type===R&&angle)rook.drawRookPound(canvas,art[type],side,angle);else if(type===R)rook.drawRook(canvas,art[type],side,extension);else if(type===G)guard.drawGuard(canvas,art[type],side,extension);else pawn.drawPawn(canvas,art[type],side,angle,extension);
 return canvas;
}
// Covers the headroom too, so an effect never crops a back-rank figure's head. Sized by setResolution().
// Drawn for a king whose sheet is still loading: nothing, and nothing cached.
const blank=document.createElement('canvas');blank.width=blank.height=1;
const fxCanvas=document.createElement('canvas');fxCanvas.width=SIZE;fxCanvas.height=SIZE+headroom;
// fx: {cut} splits along a slash; {frost, shatter} ices the figure then breaks it into wedges;
// {scan, apart} tints it with a moving scan line, then takes it apart in horizontal strips.
// shadow: false when its contact shadow is already on the floor (render() draws them all before any figure, those
// of figures with an effect too, fading as the effect takes them: fxFade).
function drawPiece(out,value,pose,opacity=1,extension=0,fx=null,shadow=true) {
 if(opacity<=0)return;
 if(fx?.death){
  // A king's capture (king-captures.mjs): the victim is drawn into the effect layer as the death needs.
  const c=fxCanvas.getContext('2d'),h=fx.death.hit;
  drawDeath(out,{...fx.death,size:SIZE,headroom,
   clear(){c.setTransform(res,0,0,res,0,headroom*res);c.globalCompositeOperation='source-over';c.globalAlpha=1;c.clearRect(0,-headroom,SIZE,SIZE+headroom);return c;},
   // dx, dy: moved; q: scaled about its middle; spin: turned about its middle (radians, clockwise on screen).
   draw(g,{dx=0,dy=0,q=1,wobble=0,spin=0}={}){
    const fx=(pose.foot.x-h.x)*q,fy=(pose.foot.y-h.y)*q,c=Math.cos(spin),sn=Math.sin(spin);
    drawPiece(g,value,{...pose,foot:{x:h.x+dx+wobble+fx*c-fy*sn,y:h.y+dy+fx*sn+fy*c},sx:(pose.sx??1)*q,sy:(pose.sy??1)*q,rotation:(pose.rotation??0)+spin*pose.facing,shadow:.001},1,extension,null,false);
   },
   layer(clip){out.save();out.globalAlpha=opacity;if(clip!==Infinity){out.beginPath();out.rect(0,-headroom,SIZE,clip+headroom);out.clip();}if(res===1)out.drawImage(fxCanvas,0,-headroom);else out.drawImage(fxCanvas,0,-headroom,SIZE,SIZE+headroom);out.restore();},
  });
  return;
 }
 if(fx&&(fx.frost||fx.shatter||fx.scan||fx.apart)){
  const c=fxCanvas.getContext('2d');c.setTransform(res,0,0,res,0,headroom*res);c.clearRect(0,-headroom,SIZE,SIZE+headroom);drawPiece(c,value,pose,1,extension,null,false);
  c.globalCompositeOperation='source-atop';
  if(fx.frost){c.fillStyle=`rgba(196,230,255,${.72*fx.frost})`;c.fillRect(0,-headroom,SIZE,SIZE+headroom);}
  if(fx.scan){c.fillStyle=`rgba(64,224,208,${.42*fx.scan.tint})`;c.fillRect(0,-headroom,SIZE,SIZE+headroom);if(fx.scan.y!=null){c.fillStyle='rgba(228,255,250,.95)';c.fillRect(0,fx.scan.y-2.5,SIZE,5);}}
  c.globalCompositeOperation='source-over';
  const layer=()=>res===1?out.drawImage(fxCanvas,0,-headroom):out.drawImage(fxCanvas,0,-headroom,SIZE,SIZE+headroom);
  if(fx.apart){
   // Strips come loose from the top down, sliding apart alternately and dropping.
   const {top,bottom,t}=fx.apart,n=8,h=(bottom-top)/n;
   for(let i=0;i<n;i++){
    const u=clamp((t-i*.06)/.55,0,1),y0=i?top+i*h:-headroom,y1=i<n-1?top+(i+1)*h:SIZE;
    out.save();out.globalAlpha=opacity*(1-u);out.translate((i%2?1:-1)*24*ease(u),30*u*u);
    out.beginPath();out.rect(0,y0,SIZE,y1-y0);out.clip();layer();out.restore();
   }
   return;
  }
  if(!fx.shatter){out.save();out.globalAlpha=opacity;layer();out.restore();return;}
  const {point,t}=fx.shatter,k=ease(t),n=9;
  for(let i=0;i<n;i++){
   const a0=i/n*Math.PI*2+.3,a1=(i+1)/n*Math.PI*2+.3,mid=(a0+a1)/2,far=400;
   out.save();out.globalAlpha=opacity*(1-t);
   out.translate(Math.cos(mid)*48*k,Math.sin(mid)*34*k+70*t*t);
   out.translate(point.x,point.y);out.rotate((i%2?1:-1)*.7*k);out.translate(-point.x,-point.y);
   out.beginPath();out.moveTo(point.x,point.y);out.lineTo(point.x+Math.cos(a0)*far,point.y+Math.sin(a0)*far);out.lineTo(point.x+Math.cos(a1)*far,point.y+Math.sin(a1)*far);out.closePath();out.clip();
   layer();out.restore();
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
   drawPiece(out,value,pose,opacity,extension,null,false);out.restore();
  }
  return;
 }
 const spec=specs[typeOf(value)],ground=pose.ground??pose.foot;
 out.save();out.globalAlpha=opacity;
 // (the charcoal army's pale rim fades out at the soles, where it meets the contact shadow; base: board units to
 // device px, before the figure's own frame)
 const fade=lively.atmosphere&&colorOf(value)&&out!==closeup?.ctx,base=fade?out.getTransform():null;
 if(lively.atmosphere){if(shadow)contactShadow(out,value,pose,opacity);}
 else{const k=clamp(1-(pose.lift??0)/TILE*.4,.6,1)*(pose.shadow??1);out.fillStyle='#343a2229';out.beginPath();out.ellipse(ground.x,ground.y-2,210*pose.scale*k,36*pose.scale*k,0,0,Math.PI*2);out.fill();}
 out.translate(pose.foot.x,pose.foot.y);out.scale(pose.scale*pose.facing*(pose.sx??1),pose.scale*(pose.sy??1));out.rotate(pose.rotation??0);
 // A soft contrasting rim keeps each army readable on the painted board's light and dark zones.
 // (pose.rim: an effect may thin it, as the charcoal Spirit's black aura does.)
 const image=sprite(value,pose.angle,extension,pose.sheet,pose.rest),rim=colorOf(value)?`rgba(250,246,232,${.85*(pose.rim??1)})`:'rgba(28,24,16,.8)';
 if(fade&&image!==blank){
  const key=spriteKey(value,pose.sheet);
  if(!pose.rotation&&image===idle.get(key)){out.globalAlpha=opacity*(pose.rim??1);out.drawImage(stillRim(key,image,spec),-spec.anchor.x,-spec.anchor.y,1152,1152);out.globalAlpha=opacity;}
  else{const soles=pose.foot.y+(pose.rotation?lowerEdge(value,pose)*shadowWeights(pose).lying:0);fadedRim(out,image,spec.anchor,rim,5*res,base.b*pose.foot.x+base.d*soles+base.f,Math.sqrt(Math.abs(base.a*base.d-base.b*base.c)));}
  out.drawImage(image,-spec.anchor.x,-spec.anchor.y);
 }
 else{out.shadowColor=rim;out.shadowBlur=5*res;out.drawImage(image,-spec.anchor.x,-spec.anchor.y);} // shadows ignore the transform
 out.restore();
}
// Contact shadows (atmosphere on; contact-shadow.mjs has the parts and their strengths), made once per still sprite
// from its own outline and drawn with multiply, so the shade keeps the floor's own colour (dark wood gets a deeper
// one than light stone, or it would not read).
// Outlines by sprite key; stamps by sprite key and the side the figure faces (the light stays top left).
const outlines=new Map(),stamps=new Map(),EMPTY={empty:true};
// The key of a figure's still sprite: type:side[:design][:effect] (sprite() caches it under this key).
function spriteKey(value,sheet=null){
 const type=typeOf(value),side=colorOf(value),design=type===K?kings[side]:null;
 return design?`${type}:${side}:${design}${sheet?':effect':''}`:`${type}:${side}`;
}
// A figure's stamps, or null while they are not built. Missing ones are built when the browser is idle (within half
// a second), so the first frame does not wait for them; until then the figure has a plain pool (fallbackShape), and
// the stamps fade in over it. Both facings of a figure are built together, so a figure turning round never lacks
// its shadow, and the stamps of one build appear together.
const queued=new Map(),built=new Map();let idleBuild=0;
const requestBuild=()=>globalThis.requestIdleCallback?requestIdleCallback(buildQueued,{timeout:500}):setTimeout(buildQueued,0);
function shadowStamps(value,sheet,f){
 const key=spriteKey(value,sheet),set=stamps.get(`${key}:${f}`);if(set)return set;
 if(!queued.has(key)){queued.set(key,[value,sheet]);idleBuild||=requestBuild();}
 return null;
}
// Reads the floor's darkness and every queued outline in one go, then builds stamps while the idle time lasts (and
// goes on in the next), and shows them all when every queued figure has its own.
function buildQueued(deadline){
 idleBuild=0;readFloor();readOutlines([...queued.values()]);
 for(const [key,[value,sheet]] of queued){
  if(built.has(key))continue;
  // (Not drawable yet, as a king whose sheet is loading: asked for again when it is drawn.)
  const outline=outlines.get(key);if(!outline){queued.delete(key);continue;}
  if(built.size&&deadline?.timeRemaining()<=0){idleBuild=requestBuild();return;}
  const since={t:null},spec=specs[typeOf(value)];
  built.set(key,[1,-1].map(f=>{const set=buildStamps(outline,spec,f);return set?{...set,since}:EMPTY;}));
 }
 for(const [key,[right,left]] of built){stamps.set(`${key}:1`,right);stamps.set(`${key}:-1`,left);queued.delete(key);}
 if(built.size){built.clear();wake();}
}
// The alpha of still sprites not read yet, at q px per board unit: [[value, sheet]]. All of them are read back in
// one go: each readback waits for the GPU, and one per figure would stall.
function readOutlines(figures){
 const todo=new Map();let x=0,y=0,row=0;
 for(const [value,sheet] of figures){
  const key=spriteKey(value,sheet);if(outlines.has(key)||todo.has(key))continue;
  const canvas=sprite(value,0,0,sheet??null);if(canvas===blank)continue;
  const n=Math.round(1152*specs[typeOf(value)].scale*SHADE.q);if(x&&x+n>2048){x=0;y+=row;row=0;}
  todo.set(key,{canvas,n,x,y});x+=n;row=Math.max(row,n);
 }
 if(!todo.size)return;
 const items=[...todo.values()],atlas=document.createElement('canvas');atlas.width=Math.max(...items.map(i=>i.x+i.n));atlas.height=y+row;
 const g=atlas.getContext('2d');for(const i of items)g.drawImage(i.canvas,i.x,i.y,i.n,i.n);
 const data=g.getImageData(0,0,atlas.width,atlas.height).data;
 for(const [key,{n,x,y}] of todo){
  const alpha=new Uint8Array(n*n);
  for(let r=0;r<n;r++){const o=((y+r)*atlas.width+x)*4+3;for(let c=0;c<n;c++)alpha[r*n+c]=data[o+c*4];}
  outlines.set(key,{alpha,n});
 }
}
// The stamps of one facing: the fields as canvases, x, y, w, h in board units round the ground point (at spec.scale).
function buildStamps(outline,spec,f){
 const field=shadowField(outline,spec,f,TILE);if(!field)return null;
 const {W,H,OX,OY}=field,q=SHADE.q;
 const stamp=buf=>{
  // Cropped to what is not empty.
  let x0=W,y0=H,x1=-1,y1=-1;
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++)if(buf[Y*W+X]>.004){if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;}
  if(x1<0)return null;
  const w=x1-x0+1,h=y1-y0+1,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const cx=canvas.getContext('2d'),img=cx.createImageData(w,h),[r,g,b]=SHADE.rgb;
  for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++){const i=(Y*w+X)*4;img.data[i]=r;img.data[i+1]=g;img.data[i+2]=b;img.data[i+3]=Math.round(255*Math.min(1,buf[(Y+y0)*W+X+x0]));}
  cx.putImageData(img,0,0);
  return {canvas,x:(x0-OX)/q,y:(y0-OY)/q,w:w/q,h:h/q};
 };
 const {scale,tall,span,cx,pd,body}=field;
 return {scale,tall,span,cx,pd,body,core:stamp(field.core),soft:stamp(field.soft)};
}
// A figure's measures before its stamps are built, from its scale alone (a typical figure's: a stand-in for a moment).
const fallbackShape=spec=>({scale:spec.scale,tall:900*spec.scale,span:330*spec.scale,cx:0,pd:SHADE.pool,body:[220*spec.scale,220*spec.scale]});
// How dark the painted floor is at a point: 0 on the light stone, 1 on the dark wood. Read from the board art once
// (96 x 96, calibrated by the mean of the light and the dark square centres), so it follows a flipped board; it is
// read with the outlines, in idle time (its CPU copy of the art costs a first frame about 10 ms). Until then: the
// square's colour on screen (dark where column + row is odd).
const FLOOR=96;let floorMap=null;
function readFloor(){
 const n=FLOOR;if(floorMap||!boardArt.naturalWidth)return;
 // (Art that cannot be read, as a cross-origin image without CORS, counts as light stone.)
 try{
  const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(boardArt,0,0,n,n);
  const d=g.getImageData(0,0,n,n).data,L=i=>.3*d[i*4]+.59*d[i*4+1]+.11*d[i*4+2],mean=[0,0];
  for(let col=0;col<8;col++)for(let row=0;row<8;row++)mean[(col+row)%2]+=L(Math.floor((row+.5)*n/8)*n+Math.floor((col+.5)*n/8))/32;
  floorMap=Float32Array.from({length:n*n},(_,i)=>clamp((mean[0]-L(i))/(mean[0]-mean[1]||1),0,1));
 }catch{floorMap=new Float32Array(n*n);}
}
function groundDark(p){
 const n=FLOOR;
 if(!floorMap){const col=Math.floor((p.x-PAD)/TILE),row=Math.floor((p.y-PAD)/TILE);return boardArt.naturalWidth&&col>=0&&col<8&&row>=0&&row<8?(col+row)%2:0;}
 let u=(p.x-PAD)/(8*TILE)*n-.5,v=(p.y-PAD)/(8*TILE)*n-.5;
 if(flipped){u=n-1-u;v=n-1-v;}
 u=clamp(u,0,n-1.001);v=clamp(v,0,n-1.001);const i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j,at=(x,y)=>floorMap[y*n+x];
 return (at(i,j)*(1-fu)+at(i+1,j)*fu)*(1-fv)+(at(i,j+1)*(1-fu)+at(i+1,j+1)*fu)*fv;
}
// A soft oval of shade at x, y (rx, ry): a plateau that softens (0..1) as the figure rises.
function shadeOval(out,x,y,rx,ry,alpha,soft){
 if(alpha<=.004)return;
 out.save();out.globalAlpha=alpha;out.translate(x,y);out.scale(rx,ry);
 const g=out.createRadialGradient(0,0,0,0,0,1),rgb=SHADE.rgb.join(',');
 for(const [at,rest,lifted] of [[0,1,1],[.5,.92,.72],[.8,.45,.3],[1,0,0]])g.addColorStop(at,`rgba(${rgb},${rest+(lifted-rest)*soft})`);
 out.fillStyle=g;out.beginPath();out.arc(0,0,1,0,Math.PI*2);out.fill();out.restore();
}
// The frame being drawn (render() sets it): a new set of stamps fades in from the first frame that draws it.
let frameTime=0;
// The figure's contact shadow on the floor (pose.ground, or under its feet); shadowWeights says how much of each part
// shows. In the air the pool slides a little away from the light and hands over to an oval; a figure that tips
// over or lies on the floor has a pool under its body, along its lower edge.
function contactShadow(out,value,pose,opacity) {
 const w=shadowWeights(pose,opacity);if(w.shown<=.004)return;
 const type=typeOf(value),design=type===K?kings[colorOf(value)]:null;
 if(design&&!pose.sheet&&!kingArt[design]?.image)return; // (the figure is not drawn yet either)
 const ground=pose.ground??pose.foot,sx=pose.sx??1,sy=pose.sy??1,set=shadowStamps(value,pose.sheet,pose.facing*sx<0?-1:1);
 if(set?.empty)return;
 const fade=set?clamp((frameTime-(set.since.t??=frameTime))/160,0,1):0,shape=set??fallbackShape(specs[type]);
 const dk=out===closeup?.ctx?0:groundDark(ground),pick=([light,dark])=>light+(dark-light)*dk;
 // A squash widens the shadow; a figure that shrinks (a victim) shrinks it.
 const k=pose.scale/shape.scale,m=Math.max(Math.abs(sx),sy),wide=k*m,deep=k*Math.min(1,m),shrink=1-.3*(1-Math.exp(-w.air/30));
 out.save();out.globalCompositeOperation='multiply';
 out.translate(ground.x+SHADE.shear*SHADE.cast*w.h*.6,ground.y+SHADE.cast*w.h*.4);
 if(fade>0)for(const [stamp,alpha] of [[set.soft,pick(SHADE.soft)*w.soft],[set.core,pick(SHADE.core)*w.core]]){
  if(!stamp||alpha*w.shown*fade<=.004)continue;
  out.globalAlpha=alpha*w.shown*fade;out.drawImage(stamp.canvas,stamp.x*wide*shrink,stamp.y*deep*shrink,stamp.w*wide*shrink,stamp.h*deep*shrink);
 }
 // Until the stamps come: a plain pool where theirs will be.
 if(fade<1){const {span,tall,pd}=fallbackShape(specs[type]),A=Math.max(span/2+5,.16*tall+4)*1.15;shadeOval(out,.75*wide*shrink,pd*deep*shrink,A*wide*shrink,clamp(.3*A,5.75,12.6)*deep*shrink,.85*pick(SHADE.soft)*Math.max(w.soft,w.core)*w.shown*(1-fade),.6);}
 const {span,cx,pd,tall}=shape,rx=Math.max(8,span/2+3);
 shadeOval(out,cx*wide,pd*deep,rx*wide*(1-.3*w.air/(w.air+30)),clamp(.3*rx,4.5,8)*deep*(1-.3*w.air/(w.air+30)),pick(SHADE.air)*w.oval*w.shown,w.plateau);
 if(w.lying){
  const sn=Math.sin(pose.rotation);
  shadeOval(out,pose.foot.x-ground.x+pose.facing*sx*sn*tall/2*k,pose.foot.y-ground.y+lowerEdge(value,pose,shape)-1.5*k,(Math.abs(sn)*tall/2+6)*k,5*k,pick(SHADE.soft)*w.lying*w.shown,.3);
 }
 out.restore();
}
// How far below its foot point a tipped figure's lower edge is (board units; shape: its stamps, or fallbackShape).
function lowerEdge(value,pose,shape=null){
 const r=pose.rotation??0;if(!r)return 0;
 shape??=stamps.get(`${spriteKey(value,pose.sheet)}:${pose.facing*(pose.sx??1)<0?-1:1}`)??fallbackShape(specs[typeOf(value)]);
 if(!shape.body)shape=fallbackShape(specs[typeOf(value)]);
 return (Math.sin(r)<0?shape.body[0]:shape.body[1])*Math.abs(Math.sin(r))*(pose.sy??1)*pose.scale/shape.scale;
}
// The charcoal army's pale readability rim fades out from 5.5 to 1.5 units above its soles (and along a lying
// figure's lower edge), so the contact shadow meets the hem and the soles instead of a light ring. The rim alone is
// a shadow: the sprite lands off the canvas and the shadow offset brings its blur back.
// stillRim: a still sprite's, made once in its own frame at a quarter of its size, blurred as the board's shadowBlur
// (5 device px at 1 px per unit) blurs it at the board's scale; drawn with the sprite. No shadowBlur each frame.
const rims=new Map();
function stillRim(key,image,spec){
 let rim=rims.get(key);if(rim)return rim;
 const n=288,k=n/1152;rim=document.createElement('canvas');rim.width=rim.height=n;const g=rim.getContext('2d');
 g.shadowColor='rgba(250,246,232,.85)';g.shadowBlur=5*k/spec.scale;g.shadowOffsetX=-2*n;g.drawImage(image,2*n,0,n,n);g.shadowColor='transparent';
 fadeBelow(g,(spec.anchor.y-5.5/spec.scale)*k,4/spec.scale*k,n,n);
 rims.set(key,rim);return rim;
}
// fadedRim: a sprite drawn fresh each frame (a strike, an aim, a resting pawn's action) or tipped over: its rim is
// drawn into a layer and faded there, then laid on the canvas (the caller draws the figure over it).
// out: in the sprite's own frame; solesY: device y of the soles; unit: device px per board unit.
const rimLayer=document.createElement('canvas'),rimCtx=rimLayer.getContext('2d');
function fadedRim(out,image,anchor,colour,blurPx,solesY,unit){
 const m=out.getTransform(),pad=Math.ceil(2*blurPx)+2,W=out.canvas.width,H=out.canvas.height;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const [u,v] of [[-anchor.x,-anchor.y],[image.width-anchor.x,-anchor.y],[-anchor.x,image.height-anchor.y],[image.width-anchor.x,image.height-anchor.y]]){
  const x=m.a*u+m.c*v+m.e,y=m.b*u+m.d*v+m.f;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
 }
 x0=Math.max(0,Math.floor(x0)-pad);y0=Math.max(0,Math.floor(y0)-pad);x1=Math.min(W,Math.ceil(x1)+pad);y1=Math.min(H,Math.ceil(y1)+pad);
 const w=x1-x0,h=y1-y0;if(w<=0||h<=0)return;
 if(rimLayer.width<w||rimLayer.height<h){rimLayer.width=Math.max(rimLayer.width,w);rimLayer.height=Math.max(rimLayer.height,h);}
 const g=rimCtx,off=rimLayer.width+pad;
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
 g.setTransform(m.a,m.b,m.c,m.d,m.e-x0+off,m.f-y0);g.shadowColor=colour;g.shadowBlur=blurPx;g.shadowOffsetX=-off;
 g.drawImage(image,-anchor.x,-anchor.y);g.shadowColor='transparent';g.shadowOffsetX=0;
 fadeBelow(g,solesY-y0-5.5*unit,4*unit,w,h);
 out.save();out.setTransform(1,0,0,1,0,0);out.drawImage(rimLayer,0,0,w,h,x0,y0,w,h);out.restore();
}
// Erases a layer below device y top+fall, fading in from top.
function fadeBelow(g,top,fall,w,h){
 const ramp=g.createLinearGradient(0,top,0,top+fall);ramp.addColorStop(0,'rgba(0,0,0,0)');ramp.addColorStop(1,'#000');
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-out';g.fillStyle=ramp;g.fillRect(0,Math.max(0,top),w,h);g.globalCompositeOperation='source-over';
}
function bolt(out,start,end,t,scale=1) {
 if(t<0||t>1)return;
 const p=mix(start,end,t),tail=mix(start,end,Math.max(0,t-.35)),angle=Math.atan2(end.y-start.y,end.x-start.x);
 // A pale trail keeps the small arrow visible on dark squares.
 streak(out,[tail,mix(tail,p,.5),p],2.2*scale,'#fff8e6');
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
// Turquoise scanning fan from the Maester's lens to a line across the victim.
function scanBeam(out,lens,centre,width,alpha) {
 if(alpha<=0)return;
 const l={x:centre.x-width/2,y:centre.y},r={x:centre.x+width/2,y:centre.y};
 out.save();out.globalAlpha=alpha;out.lineCap='round';
 out.fillStyle='rgba(90,240,222,.22)';out.beginPath();out.moveTo(lens.x,lens.y);out.lineTo(l.x,l.y);out.lineTo(r.x,r.y);out.closePath();out.fill();
 out.strokeStyle='rgba(150,255,238,.75)';out.lineWidth=1.4;out.beginPath();out.moveTo(l.x,l.y);out.lineTo(lens.x,lens.y);out.lineTo(r.x,r.y);out.stroke();
 out.strokeStyle='rgba(235,255,252,.95)';out.lineWidth=2.2;out.beginPath();out.moveTo(l.x,l.y);out.lineTo(r.x,r.y);out.stroke();
 out.restore();
}
function lensGlow(out,lens,k) {
 if(k<=0)return;
 out.save();out.globalAlpha=k;out.fillStyle='rgba(120,245,230,.35)';out.beginPath();out.arc(lens.x,lens.y,4+5*k,0,Math.PI*2);out.fill();
 out.fillStyle='rgba(225,255,250,.95)';out.beginPath();out.arc(lens.x,lens.y,2.5,0,Math.PI*2);out.fill();out.restore();
}
// Small brass and steel gears spilling out of a dismantled piece.
function gears(out,point,t) {
 if(t<0||t>1)return;
 out.save();out.globalAlpha=1-t*t;out.lineWidth=1;out.strokeStyle='#4a3a1c';
 for(let i=0;i<7;i++){
  const a=-Math.PI/2+(i-3)*.42,v=60+14*(i%3),r=i%2?4.5:6.5;
  out.save();out.translate(point.x+Math.cos(a)*v*t,point.y+Math.sin(a)*v*t+140*t*t);out.rotate((i%2?1:-1)*t*6);
  out.fillStyle=i%3?'#b8913f':'#9aa3a0';out.beginPath();
  for(let k=0;k<16;k++){const rr=k%2?r:r*1.35,aa=k/16*Math.PI*2;out.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);}
  out.closePath();out.fill();out.stroke();out.fillStyle='#3a2f1a';out.beginPath();out.arc(0,0,r*.35,0,Math.PI*2);out.fill();out.restore();
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
   if(lively.atmosphere)drawFrame();
   ctx.save();if(flipped){ctx.translate(PAD+4*TILE,PAD+4*TILE);ctx.rotate(Math.PI);ctx.translate(-PAD-4*TILE,-PAD-4*TILE);}
   ctx.drawImage(boardArt,PAD,PAD,8*TILE,8*TILE);ctx.restore();
   if(lively.atmosphere)drawLight();
   ctx.strokeStyle='#3a3528';ctx.lineWidth=3;ctx.strokeRect(PAD-1.5,PAD-1.5,8*TILE+3,8*TILE+3);ctx.lineWidth=1;
  }else for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   ctx.fillStyle=(row+col)%2?'#89977b':'#e9e6d5';ctx.fillRect(PAD+col*TILE,PAD+row*TILE,TILE,TILE);
   ctx.strokeStyle='#656e4d14';ctx.strokeRect(PAD+col*TILE+.5,PAD+row*TILE+.5,TILE-1,TILE-1);
  }
  decorate?.(ctx,api,'under');
  if(selected!==null){const c=cell(selected);ctx.strokeStyle='#6b7954';ctx.lineWidth=3;ctx.strokeRect(PAD+c.col*TILE+1.5,PAD+c.row*TILE+1.5,TILE-3,TILE-3);ctx.lineWidth=1;}
  if(coords){ctx.fillStyle=lively.atmosphere&&boardArt.naturalWidth?'#e4d8bb':'#6d765d';ctx.font=`${coordSize}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
   for(let i=0;i<8;i++){ctx.fillText('abcdefgh'[flipped?7-i:i],PAD+(i+.5)*TILE,SIZE-14);ctx.fillText(String(flipped?i+1:8-i),15,PAD+(i+.5)*TILE);}}
 }
 // A slate frame cut from the board's own dark stone, lit from the top left like the board.
 function drawFrame() {
  const o=PAD-26,w=8*TILE+52,b=PAD+8*TILE;
  if(!framePattern){
   // A mirrored 2×2 crop from inside one dark tile tiles without seams.
   const n=boardArt.naturalWidth/8,crop=n*.6,c=document.createElement('canvas');c.width=c.height=288;const g=c.getContext('2d');
   for(const [mx,my] of [[0,0],[1,0],[0,1],[1,1]]){g.save();g.translate(mx*288,my*288);g.scale(mx?-1:1,my?-1:1);g.drawImage(boardArt,n+n*.2,n*.2,crop,crop,mx?0:0,0,144,144);g.restore();}
   framePattern=ctx.createPattern(c,'repeat');framePattern.setTransform?.(new DOMMatrix().scale(.5));
  }
  ctx.save();
  ctx.shadowColor='rgba(46,32,14,.38)';ctx.shadowBlur=16*res;ctx.shadowOffsetY=5*res;
  ctx.fillStyle='#3b352c';ctx.beginPath();ctx.roundRect(o,o,w,w,7);ctx.fill();
  ctx.shadowColor='transparent';ctx.fillStyle=framePattern;ctx.fill();
  // Warm cast, then a bevel: lit top and left faces, shaded bottom and right.
  ctx.fillStyle='rgba(120,84,40,.16)';ctx.fill();
  const lit=ctx.createLinearGradient(o,o,o+w,o+w);lit.addColorStop(0,'rgba(255,238,205,.2)');lit.addColorStop(.5,'rgba(255,238,205,0)');lit.addColorStop(.5,'rgba(16,10,4,0)');lit.addColorStop(1,'rgba(16,10,4,.28)');
  ctx.fillStyle=lit;ctx.fill();
  ctx.strokeStyle='rgba(236,224,196,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(o+1.5,o+1.5,w-3,w-3,6);ctx.stroke();
  ctx.strokeStyle='rgba(20,14,6,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(o+.5,o+.5,w-1,w-1,7);ctx.stroke();
  // The board sits a step below the frame: a fine lit lip around the opening.
  ctx.strokeStyle='rgba(236,224,196,.35)';ctx.lineWidth=1.5;ctx.strokeRect(PAD-5,PAD-5,b-PAD+10,b-PAD+10);
  ctx.restore();
 }
 // Warm light from the top left with a soft fall-off to the far corners, and the frame's shade on the stone.
 function drawLight() {
  const b=8*TILE,cx=PAD+b/2;
  ctx.save();ctx.beginPath();ctx.rect(PAD,PAD,b,b);ctx.clip();
  ctx.globalCompositeOperation='soft-light';
  const warm=ctx.createRadialGradient(PAD+b*.3,PAD+b*.22,0,PAD+b*.3,PAD+b*.22,b*.95);warm.addColorStop(0,'rgba(255,190,110,.55)');warm.addColorStop(1,'rgba(255,190,110,0)');
  ctx.fillStyle=warm;ctx.fillRect(PAD,PAD,b,b);
  ctx.globalCompositeOperation='multiply';
  const fall=ctx.createRadialGradient(cx-b*.08,cx-b*.1,b*.38,cx,cx,b*.78);fall.addColorStop(0,'rgba(120,90,60,0)');fall.addColorStop(1,'rgba(120,90,60,.2)');
  ctx.fillStyle=fall;ctx.fillRect(PAD,PAD,b,b);
  ctx.globalCompositeOperation='source-over';
  for(const [x0,y0,x1,y1] of [[PAD,PAD,PAD,PAD+12],[PAD,PAD,PAD+12,PAD]]){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(24,16,6,.32)');g.addColorStop(1,'rgba(24,16,6,0)');ctx.fillStyle=g;ctx.fillRect(PAD,PAD,y1>y0?b:12,y1>y0?12:b);}
  ctx.restore();
 }
 // A figure's outline on `square`, from its still sprite (read once per piece): its highest painted y and,
 // every 8 sprite px of height, its left and right edge (board units), bottom row first.
 const shapes=new Map();
 function shapeOf(value,square){
  const spec=specs[typeOf(value)],pose=poseFor(value,square),n=144;
  if(!shapes.has(value)){
   const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sprite(value),0,0,n,n);
   const data=g.getImageData(0,0,n,n).data,rows=[];let top=n;
   for(let y=n-1;y>=0;y--){let l=-1,r=-1;for(let x=0;x<n;x++)if(data[(y*n+x)*4+3]>24){if(l<0)l=x;r=x;}if(l>=0){rows.push([y,l,r]);top=y;}}
   shapes.set(value,{top,rows});
  }
  const {top,rows}=shapes.get(value),k=1152/n,X=x=>pose.foot.x+(x*k-spec.anchor.x)*pose.scale*pose.facing,Y=y=>pose.foot.y+(y*k-spec.anchor.y)*pose.scale;
  return {top:Y(top),rows:rows.map(([y,l,r])=>{const a=X(l),b=X(r+1);return {y:Y(y),l:Math.min(a,b),r:Math.max(a,b)};})};
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
 // A king's effect this frame, or null. k fades the whole effect as he falls; g fades what stands on his
 // square while he moves (it grows back on the new square).
 function kingEffect(sq,unit,time){
  const side=colorOf(unit.value),design=kings[side];
  if(!lively.kings||reducedMotion||unit.fx||!kingFx.has(design))return null;
  let k=unit.opacity;
  if(fallen?.sq===sq)k*=1-ease((time-fallen.start)/FALL);
  if(k<=.001)return null;
  // (A finished move counts until the next position comes: its last frame shows him on his new square.)
  const a=animation,moving=!!a&&(a.move.from===sq||(a.move.swap&&a.move.to===sq));
  // When his effect started on this square (and its loop's offset); kept while he moves off it, so nothing
  // jumps. A different piece on the square starts afresh. The two armies' loops are set apart only when no
  // king's effect was drawn the frame before (a new game or position): after a move only the mover restarts.
  const old=kingSince.get(sq),entry=old?.value===unit.value?old:{since:time,value:unit.value,offset:phaseOffset(design,side,drawnBefore===0)};
  nextSince.set(sq,entry);const since=entry.since;
  // While he moves, what stands on his square fades from where it was (it may still have been growing in).
  const grown=t=>ease((t-since)/900),g=moving?grown(a.start)*(1-ease((time-a.start)/(200*a.speed))):grown(time);
  // Each effect's loop starts again when he arrives on a square (so Mud's grass comes before his vines).
  // now: a clock that never restarts (Stratus's hover keeps its phase across a move). board: where the
  // squares are on the canvas (on screen a square is dark when its column + row is odd, a1 at either side's
  // corner) and how wide the dark stone frame round them is (none on the plain board) — an effect may follow
  // the colour of what is drawn under it.
  const s={design,side,pose:unit.pose,t:time-since+entry.offset,now:time+side*1777,k,opacity:unit.opacity,g,facing:unit.pose.facing,
   board:{x:PAD,y:PAD,tile:TILE,frame:lively.atmosphere&&boardArt.naturalWidth?26:0}};
  s.pose=kingFx.pose(s);s.ground=s.pose.ground??s.pose.foot;
  return s;
 }
 function render(time=performance.now()) {
 frames++;frameTime=time;drawnBefore=fxDrawn.length;fxDrawn=[];nextSince=new Map();
 const a0=animation,since=a0?.shakeAt!=null?(time-a0.start)/a0.speed-a0.shakeAt:-1,shake=since>=0&&since<240?7*(1-since/240):0;
 ctx.save();ctx.translate(0,headroom);if(shake)ctx.translate(Math.sin(since*.09)*shake,Math.cos(since*.13)*shake*.6);
 boardBackground();
 const poses=new Map();
 for(let sq=0;sq<64;sq++)if(position.board[sq])poses.set(sq,{value:position.board[sq],pose:poseFor(position.board[sq],sq),opacity:1,extension:0});
 if(selected!==null&&poses.has(selected))Object.assign(poses.get(selected).pose,{angle:aimAngle,facing:aimFacing});
 if(idling()){const p=poses.get(selected).pose,i=idleAt(time-selectedAt);Object.assign(p,{ground:p.foot,foot:{x:p.foot.x,y:p.foot.y-i.lift},sx:i.sx,sy:i.sy,shadow:i.shadow});}
 // King Down: the beaten king topples backwards onto the board.
 if(fallen&&poses.has(fallen.sq)){const u=poses.get(fallen.sq);u.pose={...u.pose,rotation:-1.5*ease((time-fallen.start)/FALL)};}
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
   // Beast: lunge until the jaws meet the victim, clamp shut, shake, then step onto that square;
   // a chain repeats from each captured square in turn, as the rules move him.
   const n=a.move.captures.length,step=Math.min(n-1,Math.floor(t/CHAIN_STEP)),k=clamp((t-step*CHAIN_STEP)/CHAIN_STEP,0,1);
   const sq=a.move.captures[step],start=step?foot(a.move.captures[step-1]):a.from.foot,land=foot(sq),v=poses.get(sq);
   const facing=Math.sign(land.x-start.x)||(step?actor.pose.facing:a.from.facing);
   const target=v?world(specs[typeOf(v.value)].hit,v.pose,typeOf(v.value)):land;
   const mouth=world(court.beastMouth(colorOf(a.value)),{...a.from,facing,foot:start},S),near={x:target.x-facing*26,y:target.y-6},bite={x:start.x+near.x-mouth.x,y:start.y+near.y-mouth.y};
   let at=bite,jaw=court.BEAST_CLOSED;
   if(k<.3){at=mix(start,bite,ease(k/.3));jaw=.1*ease(k/.3);}
   else if(k<.38)jaw=.1+(court.BEAST_CLOSED-.1)*ease((k-.3)/.08);
   else if(k<.62)at={x:bite.x+Math.sin((k-.38)*90)*3,y:bite.y};
   else{at=mix(bite,land,ease((k-.62)/.38));jaw=court.BEAST_CLOSED*(1-ease((k-.62)/.38));}
   if(t>=n*CHAIN_STEP){at=land;jaw=0;}
   actor.pose={...a.from,facing,foot:at,angle:jaw};
   a.move.captures.forEach((c,i)=>{const w=poses.get(c);if(!w)return;const since=t-(i+.36)*CHAIN_STEP;if(since<0)return;
    const e=clamp(since/180,0,1);w.pose={...w.pose,foot:{x:w.pose.foot.x+Math.sin(since*.09)*5*(1-e),y:w.pose.foot.y},sx:1-.25*e,sy:1-.2*e};w.opacity=1-clamp((since-60)/160,0,1);
    const hit=world(specs[typeOf(w.value)].hit,poses.get(c).pose,typeOf(w.value));effects.push(()=>impact(ctx,hit,since/280,1.5));});
  }
  else if(a.type==='pound'){
   const P=rook.POUND,foot=t<P.approach?mix(a.from.foot,a.stop,ease(t/P.approach)):t<P.settle?a.stop:mix(a.stop,a.to.foot,ease((t-P.settle)/(P.duration-P.settle)));
   actor.pose={...a.pose,foot,angle:rook.poundAngle(t)};
   const baseAt=world(rook.towerBase(colorOf(a.value),0),{...a.pose,foot:a.stop},R);
   rook.SLAMS.forEach((slam,i)=>{const since=t-slam;if(since>=0)effects.push(()=>smash(ctx,{x:baseAt.x,y:baseAt.y-2},since/(i?420:320)));});
   if(victim){
    const first=t-rook.SLAMS[0],second=t-rook.SLAMS[1];
    if(first>=0&&second<0)victim.pose={...victim.pose,...onFloor(victim.pose.foot),foot:{x:victim.pose.foot.x,y:victim.pose.foot.y-16*Math.sin(Math.PI*clamp(first/220,0,1))}};
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
    const x=victim.pose.foot.x+(a.stop.x-victim.pose.foot.x)*.3*k;
    victim.pose={...victim.pose,sx:(Math.abs(turnV)<.2?.2*Math.sign(turnV||1):turnV)*(1-.5*k),sy:1-.5*k,...onFloor({x,y:victim.pose.foot.y}),foot:{x,y:victim.pose.foot.y-46*k}};
    victim.opacity=1-clamp((t-S.contact-150)/300,0,1);}
  }
  else if(a.type==='blow'){
   const spec=blows[a.blow],T=a.timing,since=t-T.strike;
   actor.pose={...a.pose,foot:footAt(t,a.from.foot,a.stop,a.to.foot,T),rotation:tiltAt(t,spec.tilt,T)};
   if(victim&&since>=0){
    // king: where the capturing king stands now (his outline from his square, moved with him).
    const kingNow=()=>{const kf=actor.pose.foot,ks=a.kingShape,kdy=kf.y-a.from.foot.y,kdx=kf.x-a.from.foot.x;
     return {x:kf.x,foot:kf.y,top:ks.top+kdy,l:Math.min(...ks.rows.map(r=>r.l))+kdx,r:Math.max(...ks.rows.map(r=>r.r))+kdx};};
    if(a.theme){const king=kingNow();victim.fx={death:{theme:a.theme,side:colorOf(a.value),t:since,foot:a.victimFoot,top:a.victimShape.top,shape:a.victimShape.rows,hit:a.target,away:a.away,king,board:{left:PAD,right:PAD+8*TILE}}};if(since>=DEATHS[a.theme].end)victim.opacity=0;}
    else if(spec.effect==='smash'){const k=ease(since/110);victim.pose={...victim.pose,sx:1+.28*k,sy:1-.5*k};victim.opacity=1-clamp((since-60)/260,0,1);effects.push(()=>smash(ctx,a.victimFoot,since/420));}
    else if(spec.effect==='topple'){const k=ease(since/380);victim.pose={...victim.pose,rotation:1.45*k*a.away*victim.pose.facing,foot:{x:victim.pose.foot.x+a.away*12*k,y:victim.pose.foot.y}};victim.opacity=1-clamp((since-220)/300,0,1);effects.push(()=>impact(ctx,a.target,since/320,1.6));}
    else victim.fx={frost:clamp(since/160,0,1),shatter:since>200?{point:a.target,t:clamp((since-200)/420,0,1)}:null};
   }
  }
  else if(a.type==='beam'){
   // Maester: scan the victim from his square, take it apart, then step in.
   const s=court.BEAM,height=a.victimFoot.y-a.target.y,off=court.scanOffset(t),scanY=a.target.y+off*height*(off<0?1:.85);
   actor.extension=court.actionAt(t/a.duration);
   actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease((t-s.walk[0])/(s.walk[1]-s.walk[0])))};
   const lens=world(court.maesterLens(colorOf(a.value),actor.extension),actor.pose,M),reach=ease((t-s.on)/s.reach),fade=1-clamp((t-s.off[0])/(s.off[1]-s.off[0]),0,1);
   effects.push(()=>{lensGlow(ctx,lens,Math.min(ease(t/s.on),fade));if(t>=s.on)scanBeam(ctx,lens,mix(lens,{x:a.target.x,y:scanY},reach),62*reach,fade);});
   if(victim&&t>=s.scan[0]){
    const apart=(t-s.apart[0])/(s.apart[1]-s.apart[0]);
    victim.fx={scan:{tint:clamp((t-s.scan[0])/200,0,1),y:t<s.scan[1]?scanY:null},apart:apart>=0?{top:a.victimFoot.y-height*2.3,bottom:a.victimFoot.y+12,t:clamp(apart,0,1)}:null};
    if(apart>=1)victim.opacity=0;
   }
   effects.push(()=>gears(ctx,a.target,(t-s.apart[0])/700));
  }
  else if(a.type==='move')actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease(t/420))};
  else if(a.type==='gait'){
   // Quiet move with character (gait.mjs): feet travel along the ground line; lift, squash and lean on top.
   const m=GAITS[a.gait].at(t/a.duration,a.squares),ground=mix(a.from.foot,a.to.foot,m.travel);
   actor.pose={...a.from,ground,lift:m.lift,foot:{x:ground.x,y:ground.y-m.lift},sx:m.sx,sy:m.sy,rotation:m.tilt*a.lean,shadow:m.shadow};
  }
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
   if(victim&&a.closeup)victim.opacity=1-clamp((t-440)/180,0,1);
   else if(victim&&t>=440){
    // Struck: the victim is knocked back and topples away from the Archer, then fades.
    const k=ease((t-440)/380);victim.pose={...victim.pose,rotation:1.3*k*a.away*victim.pose.facing,foot:{x:victim.pose.foot.x+a.away*10*k,y:victim.pose.foot.y}};
    victim.opacity=1-clamp((t-640)/320,0,1);
   }
   if(!a.closeup){shot={start:world(archer.muzzle(a.pose.angle,colorOf(a.value)),a.pose,A),end:a.target,t:(t-180)/260,scale:1.8};hit={point:a.target,t:(t-440)/300,scale:1.6};}
   else actor.pose={...a.from,angle:0};
  }
  if(a.closeup)drawEncounter(a,t);else if(closeup)closeup.panel.hidden=true;
  const impactTime=a.type==='pound'?rook.SLAMS[1]:a.type==='spin'?SPIN.contact:a.type==='blow'?a.timing.strike:a.type==='chain'?CHAIN_STEP*.36:a.type==='slash'?bishop.CONTACT_MS:a.type==='hammer'?court.SMASH.chop[1]:a.type==='pawn'?910:a.type==='ogre'?780:a.type==='knight'?a.duration*knight.LANDING:a.type==='paladin'?a.duration*CHARGE_CONTACT:a.type==='advance'?a.duration*.5:a.type==='beam'?court.BEAM.apart[0]:440;
  if(a.type==='knight'&&t>=a.duration*.35&&!a.airborne){a.airborne=true;onStatus('Airborne. Clearing the intervening pieces…');}
  if(a.type!=='move'&&a.type!=='gait'&&a.type!=='swap'&&t>=impactTime&&!a.contacted){a.contacted=true;a.onContact?.();onStatus(a.move.selfRemove?'The Paladin and his target are removed together.':a.type==='beam'?'Measured. Taking it apart…':a.type==='knight'||(a.type==='paladin'&&!victim)?'Landed. Settling into stance…':'Hit. Recovering…');}
 }
 // Resting pawns (lance/idle.mjs): any pawn that is not selected, moving, struck or aiming.
 pawnsAtRest=0;pawnsActing=0;
 if(lively.pawns&&!reducedMotion)for(const [sq,u] of poses){
  if(typeOf(u.value)!==P||sq===selected||u.fx||u.extension||u.pose.angle||animation&&!animation.done&&animation.move.from===sq)continue;
  pawnsAtRest++;const rest=pawnIdle.idleAt(sq*2+colorOf(u.value)+1,time);
  if(rest){u.pose={...u.pose,rest};pawnsActing++;}
 }
 const ordered=[...poses].sort((a,b)=>a[1].pose.foot.y-b[1].pose.foot.y);
 if(animation){const i=ordered.findIndex(([sq])=>sq===animation.move.from);ordered.push(...ordered.splice(i,1));}
 // 'over' markers are drawn one screen row at a time, after that row's figures: a marker sits on its
 // own square's figure, and a tall figure standing in front of it (a lower row) covers it.
 let overRow=0;
 const over=last=>{for(;overRow<=last;overRow++)decorate?.(ctx,api,'over',overRow);};
 // A piece thrown into the air (a king's capture whose death has an `above` time) is drawn in two parts once
 // it leaves the ground: what stays on the floor in its own place ('back'), the piece itself over every figure ('front').
 const late=[];
 // Each figure's final pose first (a king's effect may change his: Stratus floats, Shadow has his own sheet, the
 // ivory Spirit lights his floor), then every contact shadow on the floor before any figure: a shadow drawn after
 // a figure would darken it. A figure with its own effect (unit.fx) has its shadow fade as the effect takes it.
 const kingFxOf=new Map();
 for(const [sq,unit] of ordered)if(typeOf(unit.value)===K){const fx=kingEffect(sq,unit,time);if(fx)kingFxOf.set(sq,fx);}
 if(lively.atmosphere)for(const [sq,unit] of ordered){const fade=fxFade(unit.fx);if(fade>0)contactShadow(ctx,unit.value,kingFxOf.get(sq)?.pose??unit.pose,unit.opacity*fade);}
 for(const [sq,unit] of ordered){
  if(!animation)over(Math.floor((unit.pose.foot.y-40-PAD)/TILE)-1);
  const fx=kingFxOf.get(sq);
  if(fx){kingFx.back(ctx,fx);fxDrawn.push(fx.design);}
  // (above: a time, or a test of the death's own state: the piece is clear of the king or over his head.)
  const death=unit.fx?.death,above=death&&DEATHS[death.theme].above;
  if(above!=null&&death.t>=0){
   // Drawn in two parts from the strike on: its own place, and over every figure ('above': the piece too).
   const up=typeof above==='function'?above({...death,size:SIZE,headroom}):death.t>=above,d2={...death,above:up};
   drawPiece(ctx,unit.value,unit.pose,unit.opacity,unit.extension,{death:{...d2,part:'back'}});
   late.push(()=>drawPiece(ctx,unit.value,unit.pose,unit.opacity,unit.extension,{death:{...d2,part:'front'}}));
  }else drawPiece(ctx,unit.value,fx?.pose??unit.pose,unit.opacity,unit.extension,unit.fx,false);
  if(fx)kingFx.front(ctx,fx);
 }
 for(const draw of late)draw();
 kingSince=nextSince;
 for(const effect of effects)effect();
 if(shot)bolt(ctx,shot.start,shot.end,shot.t,shot.scale);
 if(hit)impact(ctx,hit.point,hit.t,hit.scale);
 over(7);
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
  if((a&&!a.done)||(wanted&&aimAngle!==wanted.angle)||(fallen&&time-fallen.start<FALL)||time<awakeUntil)wake();
  else{previousTime=0;if(idling()||fxDrawn.length||pawnsAtRest){clearTimeout(idleTimer);idleTimer=setTimeout(wake,33);}} // the idle breath, the kings' effects and resting pawns need only ~30 frames a second
 }
 function idling(){return lively.idle&&!reducedMotion&&!animation&&selected!==null&&!!position.board[selected]&&fallen?.sq!==selected;}
 function drawLabels() {
  ctx.save();ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let sq=0;sq<64;sq++){const v=position.board[sq];if(!v||animation)continue;const p=foot(sq),x=p.x+TILE*.36,y=p.y-TILE*.12;
   ctx.fillStyle=colorOf(v)?'#2f3331':'#f4efe0';ctx.strokeStyle=colorOf(v)?'#c9cdc8':'#4b4a3c';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.fillStyle=ctx.strokeStyle;ctx.fillText(pieces.LETTERS?.[typeOf(v)]??'',x,y+1);}
  ctx.restore();
 }
 function wake(){if(ready&&!frame)frame=requestAnimationFrame(tick);}
 // A move is over: a king's effect on the square he moved from starts again from nothing if he is there next
 // (he stayed, as with Death Touch, or came back); its fade-out during the move stays seamless.
 function endMove(){
  if(animation){if(!animation.done)animation.resolve(false);kingSince.delete(animation.move.from);if(animation.move.swap)kingSince.delete(animation.move.to);}
  animation=null;
 }
 function plan(move,speed,gait=null) {
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
 else if(!victim){
  const dx=to.foot.x-from.foot.x,dy=to.foot.y-from.foot.y;from.facing=dx?Math.sign(dx):sideFacing(value);
  gait=gait??(lively.moves?GAIT_OF[ART[typeOf(value)]]:null);
  if(GAITS[gait]){
   const squares=Math.max(Math.abs((move.to&7)-(move.from&7)),Math.abs((move.to>>3)-(move.from>>3)));
   // Lean fully into a sideways move, less when walking up or down the board.
   Object.assign(base,{type:'gait',gait,squares,duration:GAITS[gait].duration(squares),lean:.35+.65*Math.abs(dx)/(Math.hypot(dx,dy)||1)});
  }else{base.type='move';base.duration=420;}
 }
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
   base.type='chain';base.duration=move.captures.length*CHAIN_STEP+120;from.facing=pose.facing;
  }else if(typeOf(value)===R){
   // Stand so the tower base lands just short of the victim's feet.
   const victimFoot=foot(victimSquare),away=Math.sign(victimFoot.x-from.foot.x)||sideFacing(value),stand={...pose,facing:away};
   const base0=world(rook.towerBase(colorOf(value),0),stand,R);
   Object.assign(base,{type:'pound',duration:rook.POUND.duration,victimFoot,pose:stand,stop:{x:victimFoot.x-(base0.x-stand.foot.x)-away*16,y:victimFoot.y+2}});
  }else if(typeOf(value)===Q){
   const victimFoot=foot(victimSquare),away=Math.sign(victimFoot.x-from.foot.x)||sideFacing(value);
   Object.assign(base,{type:'spin',duration:SPIN.duration,victimFoot,stop:stopPoint(from.foot,victimFoot,78,sideFacing(value)),away});
  }else if([K].includes(typeOf(value))){
   // With themed captures (setLively captures) the victim dies the capturing king's way (king-captures.mjs);
   // Death Touch (the king stays on his square, to === from) strikes from where he stands.
   const name={[K]:'king'}[typeOf(value)],victimFoot=foot(victimSquare),design=kings[colorOf(value)];
   const theme=lively.captures&&THEMED.includes(design)?design:null,timing=theme?KING_BLOW:BLOW,touch=theme&&move.to===move.from;
   Object.assign(base,{type:'blow',blow:name,theme,timing,duration:timing.duration,victimFoot,victimShape:theme?shapeOf(victim,victimSquare):null,kingShape:theme?shapeOf(value,move.from):null,stop:touch?from.foot:stopPoint(from.foot,victimFoot,blows[name].gap,sideFacing(value)),away:Math.sign(victimFoot.x-from.foot.x)||sideFacing(value),shakeAt:name==='rook'?BLOW.strike:null});from.facing=pose.facing;
  }else if(typeOf(value)===M){
   Object.assign(base,{type:'beam',duration:court.BEAM.duration,victimFoot:foot(victimSquare)});from.facing=pose.facing;
  }else if(!ART[typeOf(value)]){base.type='advance';base.duration=newMotions[typeOf(value)].DURATION;from.facing=pose.facing;}else{base.type='archer';base.duration=1000;base.closeup=pose.outside&&!!closeup;base.away=Math.sign(target.x-from.foot.x)||sideFacing(value);}
 }
 return {base,verb:base.type==='move'||base.type==='gait'?'Moving…':base.type==='swap'?'Trading places…':base.type==='pound'?'Pounding the ground…':base.type==='spin'?'Spinning up a whirlwind…':base.type==='blow'?(base.theme&&base.theme!=='frost'?'Striking…':blows[base.blow].verb):base.type==='chain'?(move.captures.length>1?`Starting a ${move.captures.length}-bite chain…`:'Lunging to bite…'):base.type==='slash'?'Drawing the dagger…':base.type==='hammer'?(move.selfRemove?'Raising the hammer. This capture will remove both pieces…':'Raising the hammer…'):base.type==='paladin'?(move.selfRemove?'Charging. This capture will remove both pieces…':'Preparing the Paladin’s charge…'):base.type==='advance'?'Advancing to capture…':base.type==='beam'?'Sighting through the goggles…':base.type==='knight'?'Preparing to leap…':base.type==='ogre'?'Bracing for contact…':base.closeup?'Taking aim · attack close-up.':'Taking aim…'};
 }
 const api={
  SIZE,PAD,TILE,headroom,
  get animating(){return !!animation&&!animation.done;},
  /** What is playing: a gait name for a quiet move with character, else the animation kind ('move' for the plain slide); null when idle. */
  get playing(){return animation&&!animation.done?animation.gait??animation.type:null;},
  get position(){return position;},
  foot,cell,
  /** Board square under a point in canvas pixels, or null. */
  squareAt(x,y){y-=headroom;const col=Math.floor((x-PAD)/TILE),row=Math.floor((y-PAD)/TILE);if(col<0||col>7||row<0||row>7)return null;return flipped?row*8+(7-col):(7-row)*8+col;},
  // Resolves once the figures and the board are drawable; a missing board falls back to plain squares.
  load(){const board=new Promise(resolve=>{boardArt.onload=boardArt.onerror=resolve;boardArt.src=BOARD_ART;});return Promise.all([board,...kings.map(design=>kingImage(design).loaded),...Object.entries(art).map(([type,image])=>new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=ART_FILES[ART[type]];}))]).then(()=>{ready=true;wake();});},
  /** New position: ends any finished or running animation. */
  setPosition(next){endMove();position=next;aimAngle=0;wake();},
  setSelected(sq){if(sq!==selected){selected=sq;selectedAt=performance.now();aimAngle=0;aimFacing=sq===null||!position.board[sq]?1:sideFacing(position.board[sq]);}wake();},
  setAim(sq){aimSquare=sq;wake();},
  // (The contact shadows are kept: no sprite depends on the side shown.)
  setFlipped(on){flipped=on;idle.clear();wake();},
  /** [white, black] king designs ('frost' … 'shadow'): each side's king figure. */
  setKings(next){if(next[0]===kings[0]&&next[1]===kings[1])return;kings=[...next];for(const design of kings){kingImage(design).loaded.catch(()=>{});if(lively.kings)kingFx.has(design);}wake();},
  get kings(){return [...kings];},
  /** The king design each side's figure was last drawn with (null: not yet drawn). */
  get drawnKings(){return [...drawnKings];},
  /** size: letter height in board units (default 13); a small board on a phone needs more. */
  setCoords(on,size=13){coords=on;coordSize=size;wake();},
  setLabels(on){labels=on;wake();},
  setReducedMotion(on){reducedMotion=on;},
  /** Lay the king on `sq` down (null: nobody); animate=false shows it already fallen. */
  setFallen(sq,animate=true){fallen=sq==null?null:{sq,start:animate?performance.now():-Infinity};wake();},
  /** Backing pixels per board unit (1 = 960 px wide), so the board stays sharp on high-density screens. */
  setResolution(k){if(k===res)return;res=k;canvas.width=fxCanvas.width=Math.round(SIZE*k);canvas.height=fxCanvas.height=Math.round((SIZE+headroom)*k);ctx.setTransform(k,0,0,k,0,0);wake();},
  /**
   * Opt in to quiet-move gaits (moves), the selected figure's idle breath (idle), the stone frame, contact shadows
   * and warm light (atmosphere), the kings' idle effects (kings), each king's own death for what he takes
   * (captures) and the resting pawns' small actions (pawns).
   */
  setLively(options){Object.assign(lively,options);if(lively.kings)for(const design of kings)kingFx.has(design);wake();},
  /** The king designs whose effects the last frame drew (for checks). */
  get effects(){return [...fxDrawn];},
  /** Resting pawns in the last frame, and how many of them were acting (for checks). */
  get pawns(){return {resting:pawnsAtRest,acting:pawnsActing};},
  /** Frames drawn so far (for checks). */
  get frames(){return frames;},
  setDecorate(fn){decorate=fn;wake();},
  redraw(){wake();},
  /** Draw every frame for the next `ms` (a decoration's own short animation, such as markers appearing). */
  keepAwake(ms){awakeUntil=Math.max(awakeUntil,performance.now()+ms);wake();},
  /** A see-through copy of a figure standing on `square` (a move preview); for setDecorate. */
  ghost(out,value,square,opacity=.4){if(ready&&value)drawPiece(out,value,poseFor(value,square),opacity);},
  /** Animate a move on the current position. Resolves true at the final frame, false if cancelled. */
  play(move,{speed=1,onContact=null,gait=null}={}){
   if(animation&&!animation.done)animation.resolve(false);
   const {base,verb}=plan(move,speed,gait);
   return new Promise(resolve=>{animation={...base,resolve,onContact};onStatus(verb);wake();});
  },
  cancel(){endMove();if(closeup)closeup.panel.hidden=true;aimAngle=0;wake();},
 };
 return api;
}
