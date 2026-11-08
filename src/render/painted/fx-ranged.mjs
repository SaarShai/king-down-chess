// The ranged captures on the board: the Maester's ray and the Archer's arrow, and how each victim dies.
// Every value is a pure function of the attack's clock, so a rewind, Fast (the caller scales the clock) and a
// flipped board need nothing here. Sprites and masks are made once; a frame allocates no canvas.
import {clamp} from './painted-mesh.mjs';
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const span=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const mix=(a,b,t)=>a+(b-a)*t;
const noise=(i,k)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
// Maester, in ms from the painted release: the ray reaches the victim at `reach`, scans it down and back up while
// the body holds the release frame for `holdMs` more, then the victim comes apart into light from the top down.
export const RAY={holdMs:240,beamMs:340,reach:30,scan:[40,200,340],dissolve:[320,650],end:720};
// Archer, in ms from the arrow's contact: struck, staggers, falls, lies, gone. The arrow fades before the action ends.
export const SHOT={flightMs:220,flash:70,jolt:70,stagger:200,land:430,rest:490,fade:[470,620],arrowEnd:560,end:620};
const ARROW_SCALE=3,ARROW_FAT=1.8,FLASH_SCALE=8,RAY_SCALE=2.1;
/** The ranged kinds. rangedFrame draws their shot also while the painted effect still loads (player null). */
export const RANGED=['maester','archer'];
/** The added beats of a ranged attack: how long the body holds, where the action ends and how long the effect draws. */
export function rangedPlan(kind,attack,release){
 if(kind==='maester')return {kind,hold:{at:release,ms:RAY.holdMs},end:attack.durationMs+RAY.holdMs,effectMs:RAY.beamMs};
 if(kind==='archer')return {kind,hold:null,end:Math.max(attack.durationMs,release+SHOT.flightMs+SHOT.end),effectMs:SHOT.flightMs+SHOT.arrowEnd};
 return null;
}
/** The attack bank's clock with the hold in it: frozen at `at` for `ms`, then late by `ms`. */
export const heldClock=(t,hold)=>!hold||t<=hold.at?t:t<=hold.at+hold.ms?hold.at:t-hold.ms;
/** The struck figure's motion, ms after the arrow lands. away: the side it falls to. dir: the arrow's unit direction. */
export function struckAt(since,away,dir){
 if(since<0)return {dx:0,dy:0,tilt:0,opacity:1,flash:0};
 const jolt=smooth(since/SHOT.jolt),step=smooth(span(since,SHOT.jolt,SHOT.stagger)),fall=span(since,SHOT.stagger,SHOT.land),bounce=Math.sin(span(since,SHOT.land,SHOT.rest)*Math.PI);
 const back=11*jolt+7*step+12*fall;
 const wobble=.2*jolt-.13*step+.05*Math.sin(step*Math.PI);
 return {dx:dir.x*back+away*5*fall,dy:dir.y*back*.45,tilt:away*(wobble+(1.5-.07)*fall*fall-.09*bounce),opacity:1-span(since,...SHOT.fade),flash:(1-span(since,0,SHOT.flash))*.6};
}
/** The Maester's victim, ms after the release: scan line height, tint, how far the dissolve has come (0–1). */
export function scanAt(rel){
 const [a,b,c]=RAY.scan,y=rel<a?0:rel<b?smooth(span(rel,a,b)):1-smooth(span(rel,b,c));
 return {y,tint:.42*smooth(span(rel,RAY.reach,180))+.48*span(rel,RAY.dissolve[0],RAY.dissolve[1]),front:span(rel,RAY.dissolve[0],RAY.dissolve[1]),power:smooth(rel/RAY.reach)*(1-span(rel,RAY.beamMs-40,RAY.beamMs))};
}
// Soft round sprites, made once per page: a light mote and a puff of dust.
let glow=null,gold=null,dust=null,cone=null,masks=null;
function sprite(stops){
 const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d'),r=g.createRadialGradient(24,24,0,24,24,24);
 for(const [at,colour] of stops)r.addColorStop(at,colour);g.fillStyle=r;g.fillRect(0,0,48,48);return c;
}
const glowSprite=()=>glow??=sprite([[0,'rgba(255,255,255,1)'],[.22,'rgba(205,255,248,.95)'],[.5,'rgba(32,205,196,.55)'],[1,'rgba(0,140,150,0)']]);
const goldSprite=()=>gold??=sprite([[0,'rgba(255,255,240,1)'],[.25,'rgba(255,224,120,.9)'],[.55,'rgba(232,160,32,.45)'],[1,'rgba(180,100,0,0)']]);
const dustSprite=()=>dust??=sprite([[0,'rgba(128,112,84,.8)'],[.55,'rgba(128,112,84,.45)'],[1,'rgba(128,112,84,0)']]);
// The fan of the ray, soft: stacked wedges from the apex (left) to the base (right).
function coneSprite(){
 if(cone)return cone;
 cone=document.createElement('canvas');cone.width=128;cone.height=64;const g=cone.getContext('2d');
 for(let i=0;i<10;i++){const k=1-i/10;g.fillStyle=i<5?'rgba(0,128,138,.1)':'rgba(120,250,236,.13)';g.beginPath();g.moveTo(0,32);g.lineTo(128,32-32*k);g.lineTo(128,32+32*k);g.closePath();g.fill();}
 return cone;
}
// Five tiled masks of growing density, for the torn edge of the dissolve: round holes, each mask keeps the last one's.
function dissolveMasks(ctx){
 if(masks)return masks;
 masks=[];
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#000';
 for(let level=0,i=0;level<5;level++){
  for(;i<(level+1)*(level+1)*30;i++){g.beginPath();g.arc(noise(i,8)*128,noise(i,9)*128,2+noise(i,10)*3.4,0,Math.PI*2);g.fill();}
  const copy=document.createElement('canvas');copy.width=copy.height=128;copy.getContext('2d').drawImage(c,0,0);masks.push(ctx.createPattern(copy,'repeat'));
 }
 return masks;
}
function line(ctx,x0,y0,x1,y1,width,colour){ctx.lineWidth=width;ctx.strokeStyle=colour;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
function bloom(ctx,image,x,y,radius,alpha,squash=1){if(alpha<=0||radius<=0)return;const a=ctx.globalAlpha;ctx.globalAlpha=a*alpha;ctx.drawImage(image,x-radius,y-radius*squash,radius*2,radius*2*squash);ctx.globalAlpha=a;}
function taper(ctx,x0,y0,x1,y1,from,to,colour){
 const len=Math.hypot(x1-x0,y1-y0)||1,nx=-(y1-y0)/len,ny=(x1-x0)/len;
 ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(x0+nx*from,y0+ny*from);ctx.lineTo(x1+nx*to,y1+ny*to);ctx.lineTo(x1-nx*to,y1-ny*to);ctx.lineTo(x0-nx*from,y0-ny*from);ctx.closePath();ctx.fill();
}
// The ray from the lens to the line it scans across the victim: a soft fan, a dark edge so it reads on pale stone,
// the painted shaft and flare (player: the published beam; absent in the fallback), a white core and a soft scan bar.
function drawRay(ctx,{rel,lens,box,player,scale,seed}){
 const s=scanAt(rel),p=s.power;if(p<=0)return;
 const y=mix(box.top+6,box.foot-4,s.y),reach=smooth(rel/RAY.reach),x=mix(lens.x,box.x,reach),end=mix(lens.y,y,reach);
 const half=Math.min(40,(box.r-box.l)/2+6)*reach,flicker=.85+.15*Math.sin(rel*.09+seed),length=Math.hypot(x-lens.x,end-lens.y);
 ctx.save();ctx.globalAlpha*=p;
 ctx.save();ctx.translate(lens.x,lens.y);ctx.rotate(Math.atan2(end-lens.y,x-lens.x));ctx.scale(length/128,half/32);ctx.drawImage(coneSprite(),0,-32);ctx.restore();
 taper(ctx,lens.x,lens.y,x,end,4.5,3,'rgba(0,92,104,.5)');
 if(player&&rel<RAY.beamMs){const phase=rel<30?rel:rel<RAY.beamMs-30?50:100-(RAY.beamMs-rel);player.draw(ctx,{elapsedMs:phase,origin:[lens.x,lens.y],target:[x,end],scale:scale*RAY_SCALE});}
 taper(ctx,lens.x,lens.y,x,end,2.4*flicker,1.2,'rgba(240,255,252,.95)');
 if(reach>=1)bloom(ctx,glowSprite(),x,end,half+10,1,.13);
 bloom(ctx,glowSprite(),lens.x,lens.y,player?15:20,1);
 ctx.restore();
}
// What the victim gives off while it dissolves: motes of light that rise from where the front has passed, and a
// glow on the floor. Motes born by height, so they follow the front.
const MOTES=46;
function drawMotes(ctx,{rel,box,seed}){
 const [from,to]=RAY.dissolve;if(rel<from||rel>=RAY.end)return;
 const image=glowSprite(),height=box.foot-box.top;
 bloom(ctx,image,box.x,box.foot-2,Math.max(34,(box.r-box.l)*.62),.7*Math.sin(span(rel,from,RAY.end)*Math.PI),.3);
 for(let i=0;i<MOTES;i++){
  const h=noise(i,1+seed),born=from+h*(to-from)*.96,life=Math.min(170+noise(i,2)*210,RAY.end-born),age=(rel-born)/life;
  if(age<0||age>=1)continue;
  const x=mix(box.l,box.r,noise(i,3)),y=box.top+h*height,rise=(26+noise(i,4)*52)*(1-(1-age)*(1-age));
  bloom(ctx,image,x+Math.sin(age*5+i)*5,y-rise,(3.6+noise(i,5)*5.2)*(1-age*.5),(age<.2?age/.2:1)*(1-age*age));
 }
}
/** The victim while it is scanned and dissolves, into the effect layer. d: {rel, box, clear, draw, layer}. */
export function drawDissolve(d){
 const {rel,box}=d,s=scanAt(rel);if(s.front>=1&&rel>=RAY.dissolve[1]+40)return;
 const c=d.clear(),height=box.foot-box.top,left=box.l-24,wide=box.r-box.l+48,top=box.top-24,tall=height+48;
 d.draw(c,{dx:Math.sin(rel*.11)*1.3*smooth(span(rel,RAY.reach,120))});
 c.save();c.globalCompositeOperation='source-atop';
 c.fillStyle=`rgba(${Math.round(mix(52,214,s.front))},${Math.round(mix(224,255,s.front))},${Math.round(mix(214,250,s.front))},${s.tint})`;c.fillRect(left,top,wide,tall);
 if(rel<RAY.scan[2]){const y=mix(box.top+6,box.foot-4,s.y);for(let i=0;i<3;i++){c.fillStyle='rgba(235,255,252,.34)';c.fillRect(left,y-2-i*3,wide,4+i*6);}}
 const band=26,front=mix(box.top-band,box.foot+band+4,s.front);
 if(s.front>0){
  // The edge burns white and thins to the body's tint below it; the torn part above it is all light.
  for(let i=0;i<7;i++){c.fillStyle=`rgba(244,255,252,${.92*(1-i/7)*(1-i/7)})`;c.fillRect(left,front-band+i*(band+22)/7,wide,(band+22)/7+.5);}
  const m=dissolveMasks(c);c.globalCompositeOperation='destination-out';c.fillStyle='#000';
  if(front-band>top)c.fillRect(left,top,wide,front-band-top);
  for(let i=0;i<5;i++){c.fillStyle=m[4-i];c.fillRect(left,front-band+i*band/5,wide,band/5+.5);}
 }
 c.restore();
 d.layer(left,top,wide,tall);
}
/** The struck figure's hit frames: the figure, lit white, into the effect layer. */
export function drawFlash(d){
 const box=d.box,c=d.clear(),left=box.l-40,top=box.top-40,wide=box.r-box.l+80,tall=box.foot-box.top+70;
 d.draw(c);
 c.save();c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(255,246,214,${d.flash})`;c.fillRect(left,top,wide,tall);c.restore();
 d.layer(left,top,wide,tall);
}
// The trail stops behind the head, so the arrow itself reads in front of it.
function drawTrail(ctx,start,dir,u,length,arrow){
 const reach=length*u-arrow*.55;if(reach<=0)return;
 const tail=Math.max(0,reach-Math.min(130,length*.6)),nx=-dir.y,ny=dir.x,X=d=>start.x+dir.x*d,Y=d=>start.y+dir.y*d;
 const wedge=(w,colour)=>{ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(X(tail),Y(tail));ctx.lineTo(X(reach)+nx*w,Y(reach)+ny*w);ctx.lineTo(X(reach)-nx*w,Y(reach)-ny*w);ctx.closePath();ctx.fill();};
 wedge(3.6,'rgba(96,56,8,.38)');wedge(2.4,'rgba(255,200,72,.8)');wedge(1,'rgba(255,252,226,.95)');
}
// The published arrow at a point, thicker across than along, so its head and fletching read at game size.
function drawArrow(ctx,player,tip,dir,scale,res){
 ctx.save();ctx.translate(tip.x,tip.y);ctx.rotate(Math.atan2(dir.y,dir.x));ctx.scale(1,ARROW_FAT);
 ctx.shadowColor='rgba(60,30,0,.8)';ctx.shadowBlur=2.5*res;
 player.draw(ctx,{elapsedMs:SHOT.flightMs-.01,origin:[-100,0],target:[0,0],scale,seed:0});
 ctx.restore();
}
function drawSparks(ctx,point,dir,since,seed){
 const t=since/170;if(t<0||t>=1)return;
 ctx.save();ctx.lineCap='round';ctx.globalAlpha*=1-t*t;
 const angle=Math.atan2(dir.y,dir.x)+Math.PI;
 for(let i=0;i<8;i++){
  const a=angle+(noise(i,seed)-.5)*2.5,far=(14+noise(i,seed+1)*30)*Math.sqrt(t),near=far*.45,cx=Math.cos(a),sy=Math.sin(a);
  line(ctx,point.x+cx*near,point.y+sy*near,point.x+cx*far,point.y+sy*far,2.4,'rgba(112,64,8,.6)');
  line(ctx,point.x+cx*near,point.y+sy*near,point.x+cx*far,point.y+sy*far,1.3,'rgba(255,232,150,1)');
 }
 ctx.restore();
}
function drawDust(ctx,foot,away,since){
 const t=span(since,SHOT.land-30,SHOT.end);if(t<=0||t>=1)return;
 const image=dustSprite();
 for(let i=0;i<6;i++){const k=(i+.5)/6,x=foot.x+away*(14+k*92+t*12*(k-.3)),y=foot.y-2-t*(7+i*2);bloom(ctx,image,x,y,9+t*17,(1-t)*(1-t)*.85,.7);}
}
/** The lodged arrow: its head inside the body, turned with the fallen figure. */
function drawLodged(ctx,player,point,dir,scale,alpha,res){
 const angle=Math.atan2(dir.y,dir.x);
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(point.x,point.y);ctx.rotate(angle);ctx.beginPath();ctx.rect(-240,-60,240,120);ctx.clip();ctx.rotate(-angle);ctx.translate(-point.x,-point.y);
 drawArrow(ctx,player,{x:point.x+dir.x*9,y:point.y+dir.y*9},dir,scale,res);
 ctx.restore();
}
/**
 * One frame of a ranged attack. plan: rangedPlan. elapsed, release: the action's clock. origin, target: board points.
 * victim: the scene's unit (pose, opacity, fx are set here). box(): the victim's drawn bounds {x,foot,top,l,r}, read
 * when drawn, since its frame is chosen after this. scale: the published effect's own. effects: drawn over the figures.
 */
export function rangedFrame(ctx,{plan,elapsed,release,origin,target,victim,box,player,scale,seed,effects,res=1}){
 const rel=elapsed-release;
 if(plan.kind==='maester'){
  if(!victim)return;
  if(rel>=RAY.reach){victim.fx={ranged:{rel,kind:'ray',shadow:1-span(rel,RAY.dissolve[0],RAY.dissolve[1])}};if(rel>=RAY.dissolve[1]+40)victim.opacity=0;}
  if(rel>-40&&rel<0)effects.push(()=>{ctx.save();bloom(ctx,glowSprite(),origin.x,origin.y,5+10*span(rel,-40,0),span(rel,-40,0));ctx.restore();});
  if(rel>=0&&rel<RAY.beamMs)effects.push(()=>drawRay(ctx,{rel,lens:origin,box:box(),player,scale,seed}));
  if(rel>=RAY.dissolve[0])effects.push(()=>drawMotes(ctx,{rel,box:box(),seed:seed%7}));
  return;
 }
 // The arrow flies at the chest: the hit point of a figure is at its hips.
 const ground=victim?.pose.foot.y??target.y,aim={x:target.x,y:target.y-(ground-target.y)*.4};
 const dx=aim.x-origin.x,dy=aim.y-origin.y,length=Math.hypot(dx,dy)||1,dir={x:dx/length,y:dy/length},arrow=71*scale*ARROW_SCALE;
 const since=rel-SHOT.flightMs,away=Math.sign(Math.abs(dx)>1?dx:0)||(victim?.pose.facing??1);
 if(victim&&since>=0){
  const m=struckAt(since,away,dir),base=victim.pose;
  victim.pose={...base,ground:base.ground??base.foot,foot:{x:base.foot.x+m.dx,y:base.foot.y+m.dy},rotation:m.tilt*base.facing};
  victim.opacity=m.opacity;victim.fx={ranged:{kind:'shot',flash:m.flash,shadow:1}};
  const c=Math.cos(m.tilt),s=Math.sin(m.tilt),fx=aim.x-base.foot.x,fy=aim.y-base.foot.y,point={x:base.foot.x+m.dx+fx*c-fy*s,y:base.foot.y+m.dy+fx*s+fy*c},shot={x:dir.x*c-dir.y*s,y:dir.x*s+dir.y*c};
  effects.push(()=>{
   drawDust(ctx,base.foot,away,since);
   if(player&&since<SHOT.arrowEnd)drawLodged(ctx,player,point,shot,scale*ARROW_SCALE,1-span(since,SHOT.fade[0],SHOT.arrowEnd),res);
   if(since<120)bloom(ctx,goldSprite(),aim.x,aim.y,30*(.6+since/200),1-since/120);
   drawSparks(ctx,aim,dir,since,seed%5);
   if(player&&since<100)player.draw(ctx,{elapsedMs:SHOT.flightMs+since,origin:[origin.x,origin.y],target:[aim.x,aim.y],scale:scale*FLASH_SCALE,seed});
  });
 }
 if(rel>=0&&rel<SHOT.flightMs)effects.push(()=>{
  const u=rel/SHOT.flightMs;drawTrail(ctx,origin,dir,u,length,arrow);
  if(rel<40)bloom(ctx,goldSprite(),origin.x,origin.y,16,1-rel/40);
  if(player)drawArrow(ctx,player,{x:origin.x+dx*u,y:origin.y+dy*u},dir,scale*ARROW_SCALE,res);
 });
}
