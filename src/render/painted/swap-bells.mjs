// The Maester's swap, a shell game: a brass gear ring turns under each figure, a riveted brass bell drops over it, a
// turquoise arc ties the two bells, the bells hop past each other and clank down on the other squares, then lift off
// the figures. The figures change squares only while the opaque bells hide them.
// Painted sprites from one small atlas (swap-bells-prompt.txt). Nothing here allocates per frame.
import {afterBoard} from './after-board.mjs';
const ATLAS_URL=new URL('../../../docs/2d-first-pieces/board/swap-bells.webp',import.meta.url).href;
const ATLAS={"bell":[0,0,250,319],"ring":[252,0,300,300],"cogs":[[0,581,48,48],[50,581,38,38],[90,581,30,30]],"bolts":[[0,321,720,89],[0,412,720,87],[0,501,720,78]],"puffs":[[814,501,90,75],[906,501,90,73],[554,0,90,91],[722,501,90,78]],"flare":[722,412,84,86]};
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);},span=(p,[a,b])=>clamp((p-a)/(b-a));
const TAU=Math.PI*2;
/** Timing in progress (0..1) of the whole swap. */
export const SWAP={ring:[0,.15],drop:[.05,.24],covered:.24,charge:[.26,.43],fly:[.4,.72],arrived:.74,lift:[.8,.97],ringOut:[.86,1]};
const FADE_OUT=.3,FADE_IN=[.5,.8];
const BELL={w:128,h:164,below:16,drop:230,lens:.44},RING=76,FLAT=.46,ARC=72,HOP=44,RISE=360;

/** Pure timing at progress p: which squares the figures stand on, and how opaque they are. `art` false: no bells, so each figure only fades out and back in. */
export function swapBellsAt(p,art=true){
 p=clamp(p);
 if(!art)return {arrived:p>=FADE_IN[0],opacity:p<FADE_IN[0]?1-smooth(p/FADE_OUT):smooth((p-FADE_IN[0])/(FADE_IN[1]-FADE_IN[0]))};
 return {arrived:p>=SWAP.arrived,opacity:p<SWAP.covered||p>=SWAP.lift[0]?1:0};
}
/** One bell at p: `first` is the bell that starts on `from`. out: ground x, y (the middle of its rim), up (above the ground), tilt, alpha, sx, sy. */
export function bellAt(p,from,to,first,out={}){
 const a=first?from:to,b=first?to:from,t=smooth(span(p,SWAP.fly)),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,bow=Math.sin(Math.PI*t);
 // The two bells run the same curve from opposite ends, so they pass on opposite sides of the line between the squares.
 out.x=a.x+dx*t-dy/length*ARC*bow;out.y=a.y+dy*t+dx/length*ARC*bow;
 const fall=span(p,SWAP.drop),rise=span(p,SWAP.lift);
 out.up=p<SWAP.covered?BELL.drop*(1-fall*fall):p>=SWAP.lift[0]?RISE*rise*rise:HOP*bow;
 out.tilt=.16*Math.sign(dx||(first?1:-1))*Math.sin(TAU*t);
 out.alpha=p<SWAP.covered?smooth(fall/.5):1-smooth((rise-.6)/.4);
 // A clank: the bell gives a little on the floor, and comes back.
 const clank=Math.max(ring(p-SWAP.covered),ring(p-SWAP.fly[1]));
 out.sx=1+.05*clank;out.sy=1-.07*clank;
 return out;
}
function ring(since){return since<0||since>.07?0:Math.sin(Math.PI*since/.07);}
/** How much of the gear ring shows at p, and how far it has turned. */
export function ringAt(p){
 const fly=span(p,SWAP.fly),gone=span(p,SWAP.ringOut);
 const grow=span(p,SWAP.ring),over=1+.12*Math.sin(Math.PI*grow);
 return {size:smooth(grow)*over*(1-.25*smooth(gone)),alpha:smooth(grow/.5)*(1-smooth(gone)),turn:1.5*p+2.4*smooth(fly)};
}

let atlas=null,shadow=null,asked=false;
function preload(){
 if(asked||typeof Image==='undefined')return;
 asked=true;
 const image=Object.assign(new Image(),{crossOrigin:'anonymous'});image.onload=()=>{atlas=image;};image.onerror=()=>{asked=false;};image.src=ATLAS_URL;
}
afterBoard(preload);
/** True once the bells can be drawn. The scene asks once per swap, so a swap never changes look half way. */
export function swapArtReady(){preload();return atlas!==null;}
function bellShadow(){
 if(shadow)return shadow;
 const c=document.createElement('canvas');c.width=c.height=128;
 const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
 r.addColorStop(0,'rgba(36,26,18,.75)');r.addColorStop(.62,'rgba(36,26,18,.55)');r.addColorStop(1,'rgba(36,26,18,0)');
 g.fillStyle=r;g.fillRect(0,0,128,128);
 return shadow=c;
}
const sprite=(ctx,[x,y,w,h],cx,cy,dw,dh)=>ctx.drawImage(atlas,x,y,w,h,cx-dw/2,cy-dh/2,dw,dh);
const bell={},behind={},other={};

/** On the floor, under the figures: the two turning gear rings and the bells' shadows. */
export function drawSwapFloor(ctx,p,from,to){
 if(!atlas||p>=1)return;
 const r=ringAt(p);
 ctx.save();
 for(const f of [from,to]){
  ctx.globalAlpha=r.alpha;
  ctx.save();ctx.translate(f.x,f.y);ctx.scale(1,FLAT);ctx.rotate(r.turn*(f===from?1:-1));
  const d=RING*2*r.size;sprite(ctx,ATLAS.ring,0,0,d,d);
  ctx.restore();
 }
 for(const first of [true,false]){
  const b=bellAt(p,from,to,first,bell),near=1-clamp(b.up/BELL.drop);
  ctx.globalAlpha=b.alpha*near*near*.7;
  const w=(BELL.w+26)*(.55+.45*near);
  ctx.drawImage(bellShadow(),b.x-w/2+6,b.y-w*.24+2,w,w*.48);
 }
 ctx.restore();
}
// A burst of dust round the rim, cogs and sparks thrown clear, u from 0 to 1 after a clank.
function clankBurst(ctx,foot,u,seed){
 if(u<=0||u>=1)return;
 const fly=1-(1-u)*(1-u),fade=1-smooth((u-.35)/.65);
 for(let i=0;i<6;i++){
  const a=seed+i*TAU/6,x=foot.x+Math.cos(a)*(BELL.w*.46+30*fly),y=foot.y+BELL.below+Math.sin(a)*(7+12*fly)-6*fly,size=(26+((i*29)%12))*(.55+.7*fly);
  ctx.globalAlpha=smooth(u/.1)*fade*.95;
  sprite(ctx,ATLAS.puffs[i%ATLAS.puffs.length],x,y,size,size);
 }
 for(let i=0;i<4;i++){
  const left=i%2?1:-1,x=foot.x+left*(BELL.w*.4+(46+i*14)*fly),y=foot.y-10-(70+i*22)*u+150*u*u,size=i<2?22:15,[cx,cy,cw,ch]=ATLAS.cogs[i%ATLAS.cogs.length];
  ctx.globalAlpha=smooth(u/.08)*(1-smooth((u-.6)/.4));
  ctx.save();ctx.translate(x,y);ctx.rotate(left*(5+i)*u+seed);ctx.drawImage(atlas,cx,cy,cw,ch,-size/2,-size/2,size,size);ctx.restore();
 }
}
function drawBolt(ctx,p,a,b,headroom){
 const u=span(p,SWAP.charge);if(u<=0||u>=1||!atlas)return;
 const ax=a.x,ay=a.y-a.up-BELL.h+BELL.below+4,bx=b.x,by=b.y-b.up-BELL.h+BELL.below+4,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy)||1;
 // It runs out from the Maester's bell to the partner's, then fades. Between two painted bolts it crossfades.
 const reach=smooth(u/.25),fade=1-smooth((u-.72)/.28),beat=p*38,index=Math.floor(beat)%ATLAS.bolts.length,mix=beat-Math.floor(beat),next=(index+1)%ATLAS.bolts.length;
 // Over a wide gap one arch stands above the bells. One bell behind the other: an arch bows out at each side of them.
 const stacked=Math.abs(dy)>Math.abs(dx)*1.5,h=stacked?100:Math.max(24,Math.min(84,44+length*.06,ay+headroom));
 ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(dy,dx));
 if(dx<0)ctx.scale(1,-1);
 drawArch(ctx,index,1-mix,reach,fade,length,h);drawArch(ctx,next,mix,reach,fade,length,h);
 if(stacked){ctx.scale(1,-1);drawArch(ctx,next,1-mix,reach,fade,length,h);drawArch(ctx,(next+1)%ATLAS.bolts.length,mix,reach,fade,length,h);}
 ctx.restore();
}
function drawArch(ctx,i,k,reach,fade,length,h){
 const [x,y,w,hh]=ATLAS.bolts[i];
 ctx.globalAlpha=k*fade;
 ctx.drawImage(atlas,x,y,w*reach,hh,0,-h,length*reach,h);
}
function drawBell(ctx,b,lit){
 const [x,y,w,h]=ATLAS.bell;
 ctx.save();
 ctx.translate(b.x,b.y+BELL.below-b.up);ctx.rotate(b.tilt);ctx.scale(b.sx,b.sy);
 ctx.globalAlpha=b.alpha;
 ctx.drawImage(atlas,x,y,w,h,-BELL.w/2,-BELL.h,BELL.w,BELL.h);
 if(lit>0){ctx.globalAlpha=b.alpha*lit;const d=18+16*lit;sprite(ctx,ATLAS.flare,0,-BELL.h*BELL.lens,d,d);}
 ctx.restore();
}
/** Steam behind a bell in flight. */
function drawSteam(ctx,p,from,to,first){
 const u=span(p,SWAP.fly);if(u<=0||u>=1)return;
 for(let i=4;i>=1;i--){
  const back=SWAP.fly[0]+(u-i*.07)*(SWAP.fly[1]-SWAP.fly[0]);if(back<SWAP.fly[0])continue;
  const b=bellAt(back,from,to,first,other),size=30+i*11;
  ctx.globalAlpha=(1-i/5)*.7*smooth(u/.12)*smooth((1-u)/.2);
  sprite(ctx,ATLAS.puffs[(i+(first?1:0))%ATLAS.puffs.length],b.x,b.y-b.up+BELL.below-6,size,size);
 }
}
const lensAt=p=>Math.max(smooth(span(p,SWAP.charge)/.2)*(1-.55*smooth(span(p,SWAP.fly))),smooth((p-SWAP.fly[1])/.02))*(1-smooth(span(p,[SWAP.fly[1]+.03,SWAP.lift[0]+.04])));
/** Over the figures: the bells, the arc that ties them, and what each clank throws. headroom: canvas above the board, which the arc stays under. */
export function drawSwapBells(ctx,p,from,to,headroom=0){
 if(!atlas||p>=1)return;
 const first=bellAt(p,from,to,true,behind),second=bellAt(p,from,to,false,bell);
 ctx.save();
 drawSteam(ctx,p,from,to,true);drawSteam(ctx,p,from,to,false);
 const lit=p>=SWAP.covered?lensAt(p):0;
 // The lower bell is the nearer one. They trade order only as they pass side by side.
 if(first.y<=second.y){drawBell(ctx,first,lit);drawBell(ctx,second,lit);}else{drawBell(ctx,second,lit);drawBell(ctx,first,lit);}
 drawBolt(ctx,p,first,second,headroom);
 for(const f of [from,to]){
  clankBurst(ctx,f,(p-SWAP.covered+.005)/.2,f===from?.3:1.1);
  clankBurst(ctx,f,(p-SWAP.fly[1]+.005)/.2,f===from?1.9:.7);
 }
 ctx.restore();
}
