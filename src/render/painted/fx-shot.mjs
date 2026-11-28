// The Archer's shot as a data-driven timeline: the charge, the arrow and its ribbon, the impact, the victim's
// hit-flash and the board's punch. The look is data (vfx/shot.mjs; a skin such as vfx/flame.mjs extends it), so a
// new spell, card or King skin is a data object and no code here changes. Every mark is a pure function of the
// attack's clock and a seed: a frame drawn twice, a pause or Fast change nothing, and at rest nothing draws.
import shot from './vfx/shot.mjs';
import flame from './vfx/flame.mjs';
import {clamp} from './painted-mesh.mjs';
/** The timelines by name. A skin names its base in `extends`. */
export const SKINS={shot,flame};
const BOARD=960,ARROW_LENGTH=71;
const mix=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-(1-clamp(t,0,1))**3;
const noise=(i,k)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
/** Objects merge; `tracks` merge by id (a known id changes that track, a new id adds one); other arrays replace. */
export function mergeTimeline(base,patch){
 const out={...base};
 for(const [key,value] of Object.entries(patch)){
  if(key==='extends')continue;
  const old=out[key];
  if(key==='tracks'&&Array.isArray(old)&&Array.isArray(value)){
   const tracks=old.map(t=>({...t}));
   for(const t of value){const i=tracks.findIndex(x=>x.id===t.id);if(i>=0)tracks[i]=mergeTimeline(tracks[i],t);else tracks.push(t);}
   out[key]=tracks;
  }else out[key]=plain(old)&&plain(value)?mergeTimeline(old,value):value;
 }
 return out;
}
/** The full timeline of a skin, its bases merged under it. */
export function resolveTimeline(name='shot',skins=SKINS,seen=[]){
 const data=skins[name];
 if(!data)throw new Error(`fx-shot: no timeline "${name}".`);
 if(seen.includes(name))throw new Error(`fx-shot: timeline "${name}" extends itself.`);
 const t=typeof data.extends==='string'?mergeTimeline(resolveTimeline(data.extends,skins,[...seen,name]),data):data;
 if(!Array.isArray(t.tracks))throw new Error(`fx-shot: timeline "${name}" has no tracks.`);
 return t;
}
const cache=new Map();
const timelineOf=name=>{let t=cache.get(name);if(!t){t=resolveTimeline(name);cache.set(name,t);}return t;};
/** The tracks that play. Reduced motion drops the board's punch and the bright hit-flash; the arrow stays readable. */
export function shotTracks(timeline,reduced=false){return reduced?timeline.tracks.filter(t=>t.type!=='punch'&&t.type!=='victim'):timeline.tracks;}
/** The plan's look: the resolved timeline of a skin (default the golden arrow). */
export function shotLook(name='shot'){return timelineOf(name);}
/** The struck figure's hit-flash, ms after the contact: {flash (0–1), colour}. 0 outside its track or with reduced motion. */
export function hitFlash(timeline,since,reduced=false){
 const t=reduced?null:timeline.tracks.find(x=>x.type==='victim');
 if(!t)return {flash:0,colour:null};
 const from=t.fromMs??0,to=t.toMs??140;
 if(since<from||since>to)return {flash:0,colour:t.colour??'#fff8e6'};
 return {flash:t.flash*(1-(since-from)/Math.max(1,to-from))**.7,colour:t.colour??'#fff8e6'};
}
/** The punch along the shot, ms after the contact, in board units: critically damped, peak at peakMs, exactly 0 at toMs. */
export function punchAt(timeline,since,dir,reduced=false){
 const t=reduced?null:timeline.tracks.find(x=>x.type==='punch');
 if(!t)return null;
 const from=t.fromMs??0,to=t.toMs??220,ms=since-from;
 if(ms<0||ms>=to-from)return null;
 const k=ms/t.peakMs,f=k*Math.exp(1-k)*(1-ms/(to-from));
 return {x:dir.x*t.px*f,y:dir.y*t.px*f};
}
// The punch is a CSS translate of the board canvas, never a redraw. A per-board timer puts it back to '' when frames stop.
const punchTimers=new WeakMap();
export function setPunch(board,offset){
 const k=(board.clientWidth||BOARD)/BOARD;
 const value=offset&&(Math.abs(offset.x)>.01||Math.abs(offset.y)>.01)?`${(offset.x*k).toFixed(2)}px ${(offset.y*k).toFixed(2)}px`:'';
 if(board.style.translate!==value)board.style.translate=value;
 const prev=punchTimers.get(board);
 if(prev){clearTimeout(prev);punchTimers.delete(board);}
 if(value)punchTimers.set(board,setTimeout(()=>{board.style.translate='';punchTimers.delete(board);},60));
}
/**
 * One frame of the shot's marks. rel: ms from the painted release; flightMs: release to contact. origin: the bow,
 * impact: the hit point, foot: the victim's feet, dir: the shot's unit direction. Marks go into `effects` (drawn over
 * the figures); the punch is set at once. The scene draws the victim's flash itself (hitFlash).
 */
export function drawShot(ctx,{timeline,rel,flightMs,origin,impact,foot,dir,player,scale,seed,effects,res=1,reduced=false}){
 const anchors={arrow:origin,impact,palm:origin,foot};
 // Smaller boards (the phone) get thicker strokes and larger marks.
 const cssPerUnit=(ctx.canvas.clientWidth||BOARD)/BOARD,boost=Math.min(1.6,Math.max(1,(1/cssPerUnit)**(timeline.phoneBoost??0)));
 const minW=(timeline.minCssPx??1.2)/cssPerUnit,W=w=>Math.max(w*boost,minW);
 const arrowScale=scale*(timeline.arrow?.scale??3);
 for(const track of shotTracks(timeline,reduced)){
  const start=track.beat==='contact'?flightMs:0,from=track.fromMs??0,to=track.toMs==='flight'?flightMs:track.toMs??Infinity,t=rel-start;
  if(t<from||t>to)continue;
  const u=(t-from)/Math.max(1,to-from);
  switch(track.type){
   case 'sprite':{
    if(track.sprite==='bolt'){
     if(t>=flightMs)break;
     const a0=anchors[track.anchor],end=anchors[track.to??'impact'],at=ms=>({x:a0.x+(end.x-a0.x)*ms/flightMs,y:a0.y+(end.y-a0.y)*ms/flightMs});
     const sprite=boltSprite(player,arrowScale,timeline.arrow?.fat??1.8,timeline.arrow?.rim??null,track.tint??null,res),trail=track.trail??{copies:0,stepMs:0,alpha:[]};
     effects.push(()=>{
      for(let k=trail.copies;k>=1;k--){const ms=t-k*trail.stepMs;if(ms>=0)drawSprite(ctx,sprite,at(ms),dir,trail.alpha[k-1]??.2);}
      drawSprite(ctx,sprite,at(t),dir,1);
     });
    }else{
     const p=anchors[track.anchor],image=softSprite(track.colour??'#fff'),size=(track.size??20)*boost,alpha=curve(track.alpha??[[0,1],[1,0]],u);
     if(alpha>0)effects.push(()=>{ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(image,p.x-size/2,p.y-size/2,size,size);ctx.restore();});
    }
    break;
   }
   case 'particle':{const p=anchors[track.anchor];effects.push(()=>particles(ctx,track,p,dir,t-from,seed,to-from,boost,minW));break;}
   case 'star':{const p=anchors[track.anchor];effects.push(()=>star(ctx,track,p,t,u,boost));break;}
   case 'ribbon':{const a0=anchors[track.anchor],end=anchors[track.to];effects.push(()=>ribbon(ctx,track,a0,end,dir,t,flightMs,arrowScale*ARROW_LENGTH,W,seed));break;}
   case 'arc':{const p=anchors[track.anchor];effects.push(()=>arc(ctx,track,p,dir,u,W,boost));break;}
   case 'ring':{const p=anchors[track.anchor];effects.push(()=>ring(ctx,track,p,dir,u,W,boost));break;}
   case 'wedge':{const p=anchors[track.anchor];effects.push(()=>wedge(ctx,track,p,dir,u,boost,seed));break;}
   default:break;
  }
 }
 setPunch(ctx.canvas,punchAt(timeline,rel-flightMs,dir,reduced));
}
function curve(points,u){
 if(u<=points[0][0])return points[0][1];
 for(let i=1;i<points.length;i++)if(u<=points[i][0]){const [a,va]=points[i-1],[b,vb]=points[i];return mix(va,vb,(u-a)/(b-a||1));}
 return points.at(-1)[1];
}
// ---------- The marks ----------
/** The charge glint: a turning four-point star with a dark edge, so it reads on pale stone. */
function star(ctx,s,p,t,u,boost){
 const grow=u<.8?easeOut(u/.8):1-easeOut((u-.8)/.2)*.85,r=mix(s.size[0],s.size[1],grow)*boost,alpha=u<.85?1:1-(u-.85)/.15;
 if(r<=.5||alpha<=0)return;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(p.x,p.y);ctx.rotate(t*s.spin);
 const halo=ctx.createRadialGradient(0,0,0,0,0,r*.9);halo.addColorStop(0,s.colours.core);halo.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=halo;ctx.globalAlpha*=.55;ctx.beginPath();ctx.arc(0,0,r*.9,0,Math.PI*2);ctx.fill();ctx.globalAlpha/=.55;
 const shape=k=>{ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,l=i%2?r*.22*k:r*k*(i%4?.6:1);ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l);}ctx.closePath();};
 ctx.lineJoin='round';ctx.fillStyle=s.colours.edge;shape(1.18);ctx.fill();
 ctx.fillStyle=s.colours.core;shape(1);ctx.fill();
 ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,r*.16,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
/** The ribbon: a tapered brush stroke from the tail to just behind the arrowhead, with thin painted strands. */
function ribbon(ctx,s,a0,end,dir,t,flight,arrow,W,seed){
 const total=Math.hypot(end.x-a0.x,end.y-a0.y),u=Math.min(1,t/flight),fade=t>flight?Math.min(1,(t-flight)/s.fadeMs):0;
 const head=Math.max(0,total*u-arrow*.45*(1-fade)),run=Math.min(s.maxLength,head),tail=head-run+run*easeOut(fade);
 if(head-tail<2)return;
 const nx=-dir.y,ny=dir.x,X=d=>a0.x+dir.x*d,Y=d=>a0.y+dir.y*d;
 const shape=(wHead,wTail,colour,alpha)=>{
  const steps=10;ctx.fillStyle=colour;ctx.globalAlpha=alpha*(1-fade);ctx.beginPath();
  for(let i=0;i<=steps;i++){const k=i/steps,d=mix(tail,head,k),w=mix(wTail,wHead,k*k)*(.85+.15*Math.sin(k*9+seed));ctx.lineTo(X(d)+nx*w,Y(d)+ny*w);}
  for(let i=steps;i>=0;i--){const k=i/steps,d=mix(tail,head,k),w=mix(wTail,wHead,k*k)*(.85+.15*Math.sin(k*7+seed+2));ctx.lineTo(X(d)-nx*w,Y(d)-ny*w);}
  ctx.closePath();ctx.fill();
 };
 ctx.save();
 const w=W(s.width),tw=W(s.tailWidth);
 shape(w+W(1.6),tw*.6,s.colours.edge,.55);shape(w,tw*.5,s.colours.mid,.95);shape(w*.42,.2,s.colours.core,1);
 // Strands: thin wavy hairs either side, shorter than the body, so the stroke reads as painted.
 ctx.lineCap='round';
 for(let i=0;i<s.strands;i++){
  const side=i%2?1:-1,off=side*w*(.9+.5*noise(i,3)),from=mix(tail,head,.15+.35*noise(i,5)),to=head-w*1.5;
  if(to<=from)continue;
  ctx.strokeStyle=i%2?s.colours.mid:s.colours.core;ctx.lineWidth=W(1.1);ctx.globalAlpha=.8*(1-fade);ctx.beginPath();
  for(let k=0;k<=8;k++){const d=mix(from,to,k/8),wob=Math.sin(k*1.3+i*2+t*.03)*s.wobble*(1-k/8)+off*(k/8*.6+.4);ctx.lineTo(X(d)+nx*wob,Y(d)+ny*wob);}
  ctx.stroke();
 }
 ctx.restore();
}
/** The release smear: a crescent of motion at the bow, open toward the shot. */
function arc(ctx,s,p,dir,u,W,boost){
 const r=mix(s.radius[0],s.radius[1],easeOut(u))*boost,a=Math.atan2(dir.y,dir.x),alpha=(1-u)**1.3;
 if(alpha<=0)return;
 const c={x:p.x-dir.x*r*.55,y:p.y-dir.y*r*.55};
 ctx.save();ctx.lineCap='round';ctx.globalAlpha*=alpha;
 for(const [colour,extra] of [[s.colours.edge,W(1.6)],[s.colours.core,0]]){
  ctx.strokeStyle=colour;
  for(let i=0;i<4;i++){const k=1-i/4;ctx.lineWidth=W(s.width)*k*(1-u*.6)+extra;ctx.beginPath();ctx.arc(c.x,c.y,r,a-s.sweep/2*k,a+s.sweep/2*k);ctx.stroke();}
 }
 ctx.restore();
}
/** The impact shockwave: an ellipse squashed along the shot, a dark stroke under a light one, thinning as it grows. */
function ring(ctx,s,p,dir,u,W,boost){
 const r=mix(s.radius[0],s.radius[1],easeOut(u))*boost,alpha=(1-u)**1.2,width=W(s.width)*(1-u*.7);
 if(alpha<=0)return;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(dir.y,dir.x));
 ctx.beginPath();ctx.ellipse(0,0,r*s.squash,r,0,0,Math.PI*2);
 ctx.strokeStyle=s.colours.edge;ctx.lineWidth=width+W(1.6);ctx.stroke();
 ctx.strokeStyle=s.colours.core;ctx.lineWidth=width;ctx.stroke();
 ctx.restore();
}
/** The directional impact flash: a fan of sharp spikes from the hit point, with a dark edge. */
function wedge(ctx,s,p,dir,u,boost,seed){
 const base=Math.atan2(dir.y,dir.x)+(s.aim==='against'?Math.PI:0),grow=easeOut(u/.35),alpha=u<.35?1:1-(u-.35)/.65;
 if(alpha<=0)return;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(p.x,p.y);ctx.lineJoin='round';
 const n=7;
 for(const [colour,k] of [[s.colours.edge,1.15],[s.colours.core,1]]){
  ctx.fillStyle=colour;
  for(let i=0;i<n;i++){
   const a=base+(i/(n-1)-.5)*s.spread,l=s.length*boost*grow*k*(i===(n-1)/2?1:.45+.4*noise(i,seed+7)),w=4.6*boost*k*(1-u*.5);
   ctx.beginPath();ctx.moveTo(Math.cos(a+Math.PI/2)*w,Math.sin(a+Math.PI/2)*w);ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l);ctx.lineTo(Math.cos(a-Math.PI/2)*w,Math.sin(a-Math.PI/2)*w);ctx.closePath();ctx.fill();
  }
  ctx.beginPath();ctx.arc(0,0,6*boost*k*(1-u*.6),0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
/** Seeded particles: each one a pure function of the time since its beat. `gather`: they fly in to the anchor. */
function particles(ctx,p,at,dir,t,seed,span,boost,minW){
 const base=p.aim==='against'?Math.atan2(-dir.y,-dir.x):p.aim==='along'?Math.atan2(dir.y,dir.x):p.aim==='up'?-Math.PI/2:0;
 const spread=p.aim==='around'||p.aim==='gather'?Math.PI*2:p.spread;
 ctx.save();ctx.lineCap='round';
 for(let i=0;i<p.count;i++){
  const life=mix(p.lifeMs[0],p.lifeMs[1],noise(i,seed+1)),born=p.aim==='gather'&&Number.isFinite(span)?noise(i,seed+6)*Math.max(0,span-life):0,age=(t-born)/life;
  if(age<0||age>=1)continue;
  const angle=base+(noise(i,seed+2)-.5)*spread,speed=mix(p.speed[0],p.speed[1],noise(i,seed+3)),cx=Math.cos(angle),cy=Math.sin(angle);
  let x,y,vx,vy;
  if(p.aim==='gather'){const r=speed*life*boost*(1-easeOut(age)),sw=angle+age*1.4;x=at.x+Math.cos(sw)*r;y=at.y+Math.sin(sw)*r;vx=-Math.cos(sw);vy=-Math.sin(sw);}
  else{const tt=t-born,travel=speed*tt*(1-.5*age)*boost;x=at.x+cx*travel;y=at.y+cy*travel+.5*p.gravity*tt*tt;vx=cx*speed;vy=cy*speed+p.gravity*tt;}
  const size=Math.max(mix(p.size[0],p.size[1],noise(i,seed+4))*(1-.5*age)*boost,minW),colour=p.colours[i%p.colours.length];
  ctx.globalAlpha=p.aim==='gather'?Math.min(1,age*4):(1-age)**1.3;
  const n=Math.hypot(vx,vy)||1,back=p.shape==='streak'?Math.min(18,speed*45)*boost*(1-age):0;
  const path=()=>{ctx.beginPath();if(back>0){ctx.moveTo(x-vx/n*back,y-vy/n*back);ctx.lineTo(x,y);}else{ctx.moveTo(x,y);ctx.lineTo(x+.01,y);}};
  if(p.outline){ctx.strokeStyle=p.outline;ctx.lineWidth=size*2+1.6*boost;path();ctx.stroke();}
  ctx.strokeStyle=colour;ctx.lineWidth=size*2;path();ctx.stroke();
 }
 ctx.restore();
}
// ---------- Sprites, made once ----------
const sprites=new Map();
/** The arrow as a sprite: the published arrow drawn once, tip at the right, with a bright rim and a dark contact edge. */
function boltSprite(player,s,fat,rim,tint,res){
 const length=ARROW_LENGTH*s,R=Math.max(2,res),pad=10,width=length*1.35+2*pad,height=52;
 const key=`${player?'p':'d'}|${s.toFixed(3)}|${fat}|${rim}|${tint?.colour??''}|${tint?.amount??0}|${R}`;
 let image=sprites.get(key);
 if(!image){
  const canvas=()=>{const c=document.createElement('canvas');c.width=Math.ceil(width*R);c.height=Math.ceil(height*R);return c;};
  image=canvas();const g=image.getContext('2d'),shape=canvas(),sg=shape.getContext('2d');
  sg.scale(R,R);sg.translate(width-pad,height/2);
  if(player){sg.save();sg.scale(1,fat);player.draw(sg,{elapsedMs:219.99,origin:[-100,0],target:[0,0],scale:s,seed:0});sg.restore();}
  else{sg.strokeStyle='#5a3a16';sg.lineWidth=2.2;sg.beginPath();sg.moveTo(-length,0);sg.lineTo(-6,0);sg.stroke();sg.fillStyle='#d9d2bf';sg.beginPath();sg.moveTo(0,0);sg.lineTo(-10,-4.5);sg.lineTo(-10,4.5);sg.closePath();sg.fill();}
  if(rim){
   const m=canvas(),mg=m.getContext('2d');mg.drawImage(shape,0,0);
   if(tint){mg.globalCompositeOperation='source-atop';mg.globalAlpha=tint.amount;mg.fillStyle=tint.colour;mg.fillRect(0,0,m.width,m.height);}
   const r=canvas(),rg=r.getContext('2d');
   for(const [ox,oy] of [[-2,0],[2,0],[0,-2],[0,2],[-1.5,-1.5],[1.5,1.5],[-1.5,1.5],[1.5,-1.5]])rg.drawImage(shape,ox*R*.6,oy*R*.6);
   rg.globalCompositeOperation='source-in';rg.fillStyle=rim;rg.fillRect(0,0,r.width,r.height);
   g.shadowColor='rgba(50,24,0,.85)';g.shadowBlur=2.5*R;g.drawImage(r,0,0);g.shadowBlur=0;g.drawImage(m,0,0);
  }else{
   g.shadowColor='rgba(60,30,0,.8)';g.shadowBlur=2.5*R;g.drawImage(shape,0,0);
   if(tint){g.globalCompositeOperation='source-atop';g.globalAlpha=tint.amount;g.fillStyle=tint.colour;g.fillRect(0,0,image.width,image.height);}
  }
  sprites.set(key,image);
 }
 return {image,length:width,tipX:width-pad,height};
}
function drawSprite(ctx,sprite,tip,dir,alpha){
 if(alpha<=0)return;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(tip.x,tip.y);ctx.rotate(Math.atan2(dir.y,dir.x));
 ctx.drawImage(sprite.image,-sprite.tipX,-sprite.height/2,sprite.length,sprite.height);
 ctx.restore();
}
/** The colour with alpha 0, so a gradient fades in its own hue (not through grey). */
function transparent(colour){
 const c=document.createElement('canvas').getContext('2d');c.fillStyle=colour;const hex=c.fillStyle;
 if(hex.startsWith('#')){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},0)`;}
 return hex.replace(/rgba?\(([^,]+),([^,]+),([^,)]+).*$/,'rgba($1,$2,$3,0)');
}
function softSprite(colour){
 const key=`soft|${colour}`;let c=sprites.get(key);if(c)return c;
 c=document.createElement('canvas');c.width=c.height=64;
 const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 r.addColorStop(0,'#ffffff');r.addColorStop(.3,colour);r.addColorStop(1,transparent(colour));
 g.fillStyle=r;g.beginPath();g.arc(32,32,32,0,Math.PI*2);g.fill();
 sprites.set(key,c);return c;
}
