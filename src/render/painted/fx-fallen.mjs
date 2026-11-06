// A king's demise: the fall (a collapse from the feet up, then a slam and a small rebound) and what his end sets
// off (dust, then his own theme dying with him). Pure timing first, so it can be tested; drawing after.
//   0–110 ms  he rocks back from the blow;  110–440  he falls, faster and faster;  440–510  the slam travels from
//   his feet to his head;  to 650  rebound and rest;  to 1100  the dust and his theme's aftermath clear.
// The game timing is the scene's: from DEMISE on nothing here draws. He ends as his painted lying figure (drawLying):
// it takes his place at SWAP, behind the thick dust of the slam (veilAt). Until that art has loaded he stays the plain
// rotated figure (fallPose). Times are in demise ms (the scene divides by the playback speed).
import {clamp} from './painted-mesh.mjs';

export const FALL=650,DEMISE=1100,IMPACT=440,SWAP=IMPACT+90;
const ROCK=110,LAG=70,SETTLE=FALL-LAG,TAU=Math.PI*2,HEIGHT=124;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const frac=x=>x-Math.floor(x);
const rand=(i,j=0)=>frac(Math.sin(i*127.1+j*311.7+.5)*43758.5453);

/** How far over he is at this point of the body, 0 upright to 1 lying; a little below 0 as he rocks back. */
export function fallFraction(ms){
 if(ms<=0)return 0;
 if(ms<ROCK)return -.05*smooth(ms/ROCK);
 if(ms<IMPACT)return -.05+1.05*((ms-ROCK)/(IMPACT-ROCK))**2.1;
 if(ms<IMPACT+80)return 1-.07*Math.sin(Math.PI*(ms-IMPACT)/80);
 if(ms<SETTLE)return 1-.015*Math.sin(Math.PI*(ms-IMPACT-80)/(SETTLE-IMPACT-80));
 return 1;
}
/** His pose at this time: the lying pose exactly from FALL on, with `fall` (drawn in strips: drawFall) before it. */
export function fallPose(pose,rotation,ms){
 if(ms>=FALL)return {...pose,rotation};
 return {...pose,rotation:rotation*fallFraction(ms-LAG/2),fall:{rotation,ms}};
}
/** His own effects hold through the fall and die as he lands: 1 to 0, gone by FALL. */
export const effectsLeft=ms=>1-smooth((ms-IMPACT+160)/(FALL-IMPACT+80));

/** A figure that dies with his target (the Paladin): over t from `at` to `end` he falls, then fades as the dust clears. */
export function selfRemovalAt(t,at,end){const ms=(t-at)/(end-at)*DEMISE;return {ms,fall:Math.min(ms,FALL-1),opacity:1-smooth((ms-FALL)/(DEMISE-FALL-100))};}

const STRIP=8,OVERLAP=1.5,BELOW=40,WIDE=180;
// The knees give as he starts to go, and the body is its full length again before he lands.
const sag=ms=>1-.1*Math.sin(Math.PI*clamp((ms-40)/(IMPACT-40),0,1))**2;
// His feet slip the other way as he goes, and come back by the time he rests.
const slip=ms=>7*Math.sin(Math.PI*clamp(ms/SETTLE,0,1))**2;
/**
 * Draws a figure already standing upright at `foot` on `source` (board units to source px: unit, offsetY) as a chain
 * of strips, each turned about the top of the one below: the feet go first and the head follows, so the body bends
 * as it falls and is straight again before it rests. With no bend this is the figure rotated about its feet.
 */
export function drawFall(out,source,{foot,facing,rotation,ms,unit,offsetY}){
 const dir=Math.sign(facing*rotation)||1,stretch=sag(ms);
 let x=foot.x-dir*slip(ms),y=foot.y;
 for(let h=0;h<HEIGHT+56;h+=STRIP){
  const angle=facing*rotation*fallFraction(ms-LAG*Math.min(1,h/HEIGHT));
  const below=h?0:BELOW,tall=STRIP+OVERLAP+below;
  out.save();out.translate(x,y);out.rotate(angle);out.scale(1,stretch);
  out.drawImage(source,(foot.x-WIDE)*unit,(foot.y-h-STRIP-OVERLAP+offsetY)*unit,2*WIDE*unit,tall*unit,-WIDE,-STRIP-OVERLAP,2*WIDE,tall);
  out.restore();
  x+=Math.sin(angle)*STRIP*stretch;y-=Math.cos(angle)*STRIP*stretch;
 }
}

// One image per king: the ivory army's figure above, the charcoal's below, head left. One literal URL per image, as
// bundlers need (king-sheets.mjs). A cell is at twice the board's size, with his foot point at FOOT_X, FOOT_Y.
export const FALLEN_FILES={frost:new URL('../../../docs/2d-first-pieces/king-frost/fallen.webp',import.meta.url).href,flame:new URL('../../../docs/2d-first-pieces/king-flame/fallen.webp',import.meta.url).href,stratus:new URL('../../../docs/2d-first-pieces/king-stratus/fallen.webp',import.meta.url).href,mud:new URL('../../../docs/2d-first-pieces/king-mud/fallen.webp',import.meta.url).href,spirit:new URL('../../../docs/2d-first-pieces/king-spirit/fallen.webp',import.meta.url).href,shadow:new URL('../../../docs/2d-first-pieces/king-shadow/fallen.webp',import.meta.url).href};
const CELL_W=360,CELL_H=240,FOOT_X=340,FOOT_Y=120;
/** Draws his painted lying figure: feet on `foot`, body toward `dir` (-1 left, as painted; 1 right, mirrored). */
export function drawLying(out,image,{foot,dir,side}){
 out.save();out.translate(foot.x,foot.y);out.scale(dir>0?-.5:.5,.5);
 out.drawImage(image,0,side*CELL_H,CELL_W,CELL_H,-FOOT_X,-FOOT_Y,CELL_W,CELL_H);
 out.restore();
}
/**
 * How thick one puff of the slam's veil is, 0 to 1: it comes in along the body from the slam, and stays whole round
 * SWAP, so the swap of figures never shows. p: its place along the body, 0 feet to 1 head; r: 0..1, each its own.
 */
export const veilAt=(ms,p=0,r=0)=>smooth((ms-IMPACT-30*p)/40)*(1-smooth((ms-SWAP-30-120*r)/(120+60*r)));
/**
 * The veil's puffs, back to front: a low mound along the body, not a block. Each lobe's lit top covers the shaded
 * underside of the row behind it, so it has volume, and the outline is bumpy and tapers at both ends. The solid
 * middles of the puffs (SOLID of their size, by painted cell) cover every king's lying figure. along: board px from his feet toward
 * his head. y: board px from his foot point, down. p: 0 feet to 1 head. r: 0 at the edge of the mound (goes first).
 */
export const SOLID=[.297,.296,.234,.243];
export const veilPuffs=()=>{
 const puffs=[];
 for(const [row,y,lift,shift] of [[0,-19,-9,0],[1,3,-3,14],[2,30,3,0]])for(let i=0;i<7;i++){
  const p=(i+shift/28)/6.5,seed=row*7+i,bow=Math.sin(Math.PI*p),edge=row===1?bow:bow*.45;
  puffs.push({along:-6+170*p+(rand(seed,121)-.5)*5,y:y+lift*bow+(rand(seed,123)-.5)*3,size:80*(.94+.2*rand(seed,124)),p,r:clamp(edge*.75+.25*rand(seed,120),0,1),i:seed});
 }
 return puffs;
};
const VEIL=veilPuffs();

// Dust colours by theme: [on light stone, on dark wood]. A puff takes the one that reads on the floor under it.
const DUST={
 flame:['#4d3a2f','#8d7562'],frost:['#9cc8ea','#e6f4ff'],stratus:['#e4e9ef','#ffffff'],
 mud:['#6b4d2e','#a98a60'],spirit:['#c9a24e','#ffe9ae'],shadow:['#2a2230','#6d6078'],
};
const PLAIN=['#7a6650','#c9b89a'],SPIRIT_DARK=['#2b2621','#6a6058'],PUFFS=new URL('../../../docs/2d-first-pieces/board/fallen-puffs.webp',import.meta.url).href,PUFF=192;

export function createDemise({onLoad=()=>{}}={}){
 let art=null;const tints=new Map();
 function prepare(){
  if(art)return;art=Object.assign(new Image(),{crossOrigin:'anonymous'});
  art.onload=()=>{tints.clear();onLoad();};art.src=PUFFS;
 }
 // A painted cloud lobe in one colour, keeping its light and shade; made once.
 function puff(colour){
  let c=tints.get(colour);
  if(!c&&art?.naturalWidth){
   c=document.createElement('canvas');c.width=PUFF*4;c.height=PUFF;const g=c.getContext('2d');
   g.drawImage(art,0,0);g.globalCompositeOperation='multiply';g.fillStyle=colour;g.fillRect(0,0,PUFF*4,PUFF);
   g.globalCompositeOperation='destination-in';g.drawImage(art,0,0);tints.set(colour,c);
  }
  return c??null;
 }
 function drawPuff(ctx,colours,dark,i,x,y,size,alpha){
  if(alpha<=.01)return;
  const c=puff(colours[dark>.5?1:0]);if(!c)return;
  ctx.globalAlpha=alpha;ctx.drawImage(c,(i&3)*PUFF,0,PUFF,PUFF,x-size/2,y-size*.62,size,size);
 }
 // Dust ends by shrinking as it thins; a long fade at full size reads as a smear on the floor.
 const thin=age=>1-.4*smooth((age-.45)/.55);
 // A puff of dust: age 0..1 from when the body hits there.
 function bodyDust(ctx,s,colours,{n=10,life=500,size=36,grow=.9,rise=40,spread=.05,strength=.8,seed=0}={}){
  const tau=s.ms-IMPACT;
  for(let i=0;i<n;i++){
   const p=i/(n-1),age=(tau-LAG*p-40*rand(i,seed+1))/(life*(.75+.5*rand(i,seed+2)));if(age<=0||age>=1)continue;
   const out=1-(1-age)**2,x=s.foot.x+s.dir*s.tall*(.04+.96*p)+(rand(i,seed+3)-.5)*14+(rand(i,seed+4)-.5)*spread*life*out;
   const y=s.foot.y+3+(rand(i,seed+5)-.5)*10-rise*(.35+.65*rand(i,seed+6))*out;
   drawPuff(ctx,colours,s.dark(x,y),i+seed,x,y,size*(.65+.5*rand(i,seed+7))*(1+grow*out)*thin(age),strength*smooth(age/.1)*(1-smooth((age-.45)/.55)));
  }
 }
 // Thick dust over all of him, the rotated figure and the painted one, on either floor. Each puff swells in as the
 // slam reaches it, and goes by shrinking as it drifts up, so it never ends as a see-through sheet.
 function veil(ctx,s,colours){
  const dark=s.dark(s.foot.x+s.dir*s.tall*.45,s.foot.y);
  for(const {along,y,size,p,r,i} of VEIL){
   const alpha=veilAt(s.ms,p,r);if(alpha<=.01)continue;
   const going=s.ms>SWAP,out=smooth((s.ms-SWAP)/340),swell=going?.62+.38*alpha:.6+.4*alpha;
   drawPuff(ctx,colours,dark,i,s.foot.x+s.dir*along+(rand(i,122)-.5)*44*out,s.foot.y+y-(14+22*(1-r))*out,size*swell*(1+.16*out),alpha);
  }
 }
 // A low ring of dust running out across the floor from the slam.
 function floorRing(ctx,s,colours,{n=14,reach=130,life=560,size=26,strength=.75,seed=20}={}){
  const tau=s.ms-IMPACT,cx=s.foot.x+s.dir*s.tall*.45,cy=s.foot.y+2;
  for(let i=0;i<n;i++){
   const age=(tau-30*rand(i,seed+1))/life;if(age<=0||age>=1)continue;
   const a=TAU*(i+.6*rand(i,seed+2))/n,out=1-(1-age)**2.4,r=s.tall*.28+(s.tall*.3+reach*(.75+.25*rand(i,seed+3)))*out;
   const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.36;
   drawPuff(ctx,colours,s.dark(x,y),i,x,y,size*(.7+.6*rand(i,seed+4))*(1+.7*out)*thin(age),strength*smooth(age/.08)*(1-smooth((age-.4)/.6)));
  }
 }
 // A small tumbling chip thrown up from along his body, landing on the floor.
 function chips(ctx,s,n,seed,draw){
  const tau=s.ms-IMPACT;
  for(let i=0;i<n;i++){
   const p=rand(i,seed),age=tau-LAG*p;if(age<=0)continue;
   const vx=(rand(i,seed+1)-.5)*.3,vy=-(.24+.3*rand(i,seed+2)),g=.0032,floor=s.foot.y+6+10*(rand(i,seed+3)-.5),x0=s.foot.x+s.dir*s.tall*p;
   // It flies until it reaches the floor, and lies there as the dust clears.
   const t=Math.min(age,(-vy+Math.sqrt(vy*vy+2*g*(floor-s.foot.y)))/g),y=s.foot.y+vy*t+g*t*t/2;
   const x=x0+vx*t,alpha=1-smooth((s.ms-(DEMISE-240))/220);if(alpha<=.01)continue;
   ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(t*(rand(i,seed+4)-.5)*.022);draw(i,3.2+5.4*rand(i,seed+5),s.dark(x,y));ctx.restore();
  }
 }
 function shard(ctx){return (i,r,dark)=>{
  const w=.34+.2*rand(i,61);ctx.beginPath();ctx.moveTo(0,-r*1.5);ctx.lineTo(r*w*1.3,-r*.1);ctx.lineTo(r*w*.6,r*.9);ctx.lineTo(-r*w,r*.45);ctx.lineTo(-r*w*.9,-r*.5);ctx.closePath();
  ctx.fillStyle=dark>.5?'#e8f6ff':'#c9e6fb';ctx.fill();ctx.strokeStyle='#2c6595';ctx.lineWidth=1.1;ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(0,-r*1.2);ctx.lineTo(r*w*.5,-r*.2);ctx.lineTo(-r*w*.2,-r*.1);ctx.closePath();ctx.fill();
 };}
 function clod(ctx){return (i,r,dark)=>{
  ctx.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU,q=r*(.68+.38*rand(i,k+70));k?ctx.lineTo(Math.cos(a)*q,Math.sin(a)*q*.84):ctx.moveTo(Math.cos(a)*q,Math.sin(a)*q*.84);}ctx.closePath();
  ctx.fillStyle=i%3?'#5a3c20':'#6f4d2a';ctx.fill();ctx.strokeStyle=dark>.5?'#b1926a':'#2e1d0e';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='#8f6a3e';ctx.beginPath();ctx.ellipse(-r*.22,-r*.26,r*.32,r*.2,-.4,0,TAU);ctx.fill();
 };}
 function leaf(ctx){return (i,r)=>{
  ctx.fillStyle=['#4e7a35','#6b9440','#3e6a30'][i%3];ctx.beginPath();ctx.moveTo(-r,0);ctx.bezierCurveTo(-r*.3,-r*.7,r*.5,-r*.6,r,0);ctx.bezierCurveTo(r*.5,r*.6,-r*.3,r*.7,-r,0);ctx.fill();
  ctx.strokeStyle='#26401c';ctx.lineWidth=.8;ctx.stroke();
 };}
 // Motes rising from along his body; each a bright core in a darker ring, so it reads on either floor.
 function motes(ctx,s,n,seed,core,ring,{from=IMPACT-10,life=620,rise=150,size=2.2}={}){
  for(let i=0;i<n;i++){
   const age=(s.ms-from-200*rand(i,seed))/(life*(.7+.45*rand(i,seed+1)));if(age<=0||age>=1)continue;
   const p=rand(i,seed+2),x=s.foot.x+s.dir*s.tall*p+Math.sin(TAU*(age*1.5+rand(i,seed+3)))*7+(rand(i,seed+4)-.5)*16;
   const y=s.foot.y-4-rise*(.45+.55*rand(i,seed+5))*(1-(1-age)**1.6),r=size*(.6+.8*rand(i,seed+6));
   ctx.globalAlpha=smooth(age/.12)*(1-smooth((age-.55)/.45));
   // (flecks, drawn long the way they rise; not circles)
   ctx.fillStyle=ring;ctx.beginPath();ctx.ellipse(x,y,r+.7,r*1.7+.7,0,0,TAU);ctx.fill();
   ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(x,y,r*.7,r*1.5,0,0,TAU);ctx.fill();
  }
 }
 // A soft oval on his floor; alpha and shape only (one gradient, in unit space).
 function patch(ctx,x,y,rx,ry,stops,alpha){
  if(alpha<=.01)return;
  const g=ctx.createRadialGradient(0,0,0,0,0,1);for(const [at,colour] of stops)g.addColorStop(at,colour);
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(rx,ry);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }
 const hold=(ms,start,end)=>smooth((ms-start)/80)*(1-smooth((ms-end+260)/260));

 return {
  prepare,
  /** Whether the dust can be drawn yet (the veil must be there before a swap may go behind it). */
  get ready(){return !!art?.naturalWidth;},
  /** Before any figure: the board dims round him, and his theme marks the floor where he lands. */
  floor(ctx,s){
   const {ms,foot}=s,cx=foot.x+s.dir*s.tall*.45,dim=.36*smooth(ms/IMPACT)*(1-smooth((ms-IMPACT-120)/(DEMISE-IMPACT-120)));
   if(dim>.005){
    const g=ctx.createRadialGradient(cx,foot.y-30,70,cx,foot.y-30,560);g.addColorStop(0,'rgba(20,13,8,0)');g.addColorStop(.35,'rgba(20,13,8,.62)');g.addColorStop(1,'rgba(20,13,8,1)');
    ctx.save();ctx.globalAlpha=dim;ctx.fillStyle=g;ctx.fillRect(s.board.x,s.board.y,s.board.size,s.board.size);ctx.restore();
   }
   const k=hold(ms,IMPACT,DEMISE),y=foot.y+2,rx=s.tall*.72;
   if(s.design==='flame')patch(ctx,cx,y,rx,26,[[0,'rgba(255,170,50,.95)'],[.3,'rgba(214,74,14,.75)'],[.62,'rgba(46,22,12,.6)'],[1,'rgba(30,18,12,0)']],k*(1-.55*smooth((ms-IMPACT)/420)));
   else if(s.design==='frost')patch(ctx,cx,y,rx,28,[[0,'rgba(232,247,255,.95)'],[.6,'rgba(176,220,250,.7)'],[1,'rgba(150,205,245,0)']],k);
   else if(s.design==='mud')patch(ctx,cx,y,rx,24,[[0,'rgba(58,38,18,.9)'],[.65,'rgba(66,44,20,.62)'],[1,'rgba(66,44,20,0)']],k);
   else if(s.design==='shadow')patch(ctx,cx,y,rx*1.1,28,[[0,'rgba(6,4,10,.95)'],[.6,'rgba(10,6,16,.7)'],[1,'rgba(10,6,16,0)']],k);
   else if(s.design==='spirit')patch(ctx,cx,y,rx,24,s.side?[[0,'rgba(18,15,12,.9)'],[.6,'rgba(34,29,24,.55)'],[1,'rgba(34,29,24,0)']]:[[0,'rgba(255,240,186,.95)'],[.6,'rgba(255,224,140,.55)'],[1,'rgba(255,224,140,0)']],k);
  },
  /** Over every figure: dust, then his theme dying. Nothing before the fall reaches the floor except heat and motes. */
  over(ctx,s){
   const dust=s.design==='spirit'&&s.side?SPIRIT_DARK:DUST[s.design]??PLAIN;
   ctx.save();
   if(s.design==='stratus'){
    // What held him up gives way: his cloud rolls out along the floor from under him.
    bodyDust(ctx,s,dust,{n:7,size:40,grow:.8,rise:14,spread:.14,life:560,strength:.72});
    floorRing(ctx,s,dust,{n:14,size:34,reach:128,life:640,strength:.85});
   }else{
    bodyDust(ctx,s,dust,s.design==='shadow'?{n:10,size:44,rise:84,life:560,strength:.8}:s.design==='flame'?{n:9,size:38,rise:80,life:560,strength:.72}:undefined);
    floorRing(ctx,s,dust);
   }
   // Over the running dust, so it comes out from behind the veil as the veil breaks up.
   if(s.veil)veil(ctx,s,dust);
   if(s.design==='flame'){
    bodyDust(ctx,s,['#ff8a2a','#ffa640'],{n:7,size:34,grow:.5,rise:30,life:260,strength:.85,seed:40});
    motes(ctx,s,18,50,'#ffd27a','#8a2406',{rise:170});
   }
   else if(s.design==='frost')chips(ctx,s,14,60,shard(ctx));
   else if(s.design==='mud'){chips(ctx,s,12,80,clod(ctx));chips(ctx,s,5,90,leaf(ctx));}
   else if(s.design==='spirit'){
    if(s.soul)s.soul(ctx);
    motes(ctx,s,18,100,s.side?'#17130f':'#fff4c8',s.side?'#7b7064':'#a97b1e',{rise:190,life:680});
   }
   else if(s.design==='shadow')motes(ctx,s,14,110,s.side?'#0d0a12':'#efe7d2',s.side?'#7a6d86':'#3a3128',{rise:150,size:2.2});
   ctx.restore();
  },
 };
}
