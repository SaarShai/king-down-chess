// The six kings' idle effects on the painted board (opt-in: scene.setLively({kings:true})).
//   flame   lava light flows through the cracks and seams of his armour (king-flame/lava-mask.webp, cut from the art)
//   frost   ice flakes drift down around and in front of him and fade out on his square's floor
//   stratus he hovers a few board units up and down; his shadow shrinks as he rises
//   mud     roots spread over his square and grass sprouts round his feet, sways, and both sink back
//   spirit  a holy light round him, rays behind him and light on his square brighten and dim
//   shadow  skeletal hands (black for the charcoal army, bone white for the ivory) reach up out of cracks
//           round his feet, clutch and sink back; his painted smoke drifts and curls upward
//           (king-shadow/smoke-mask.webp, cut from the art: the figure is drawn without it, the smoke moves)
// The scene draws back() before a king's figure and front() after it, so a figure standing in front
// (a lower row) still covers both. Every effect repeats exactly after PERIOD[design] ms, so one
// period recorded loops without a seam. Units are board units (the board is 960 wide).
import {clamp} from '../painted-mesh.mjs';
import * as court from '../court-motion.mjs';

export const PERIOD={flame:4800,frost:6000,stratus:4000,mud:8000,spirit:4000,shadow:6400};
export const KING_EFFECTS=Object.keys(PERIOD);
const LAVA_MASK=new URL('../king-flame/lava-mask.webp',import.meta.url).href;
const SMOKE_MASK=new URL('../king-shadow/smoke-mask.webp',import.meta.url).href;
const TAU=Math.PI*2;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const frac=x=>x-Math.floor(x);
// Deterministic noise: the same flake, blade or hand every period.
const rand=(i,j=0)=>frac(Math.sin(i*127.1+j*311.7+.5)*43758.5453);
// A layer in a figure's sprite space at a quarter of its 1152 px canvas (enough for glow).
const L=288;
const layer=()=>{const c=document.createElement('canvas');c.width=c.height=L;return c;};

/** Stratus: how far he floats above his square (board units) at time t; k fades it. */
export function hoverAt(t,k=1){return k*(3+6*(1-Math.cos(TAU*t/PERIOD.stratus))/2);}

/** sheet(design): the loaded king sheet image or null. onLoad: called when an effect's own art arrives. */
export function createKingEffects({sheet,onLoad=()=>{}}){
 const cache=new Map(),assets=new Map();
 // An effect's own art: null until it has loaded (then the layers built from it are rebuilt).
 function asset(url){
  let entry=assets.get(url);
  if(!entry){entry={image:null};assets.set(url,entry);const image=new Image();image.onload=()=>{entry.image=image;cache.clear();onLoad();};image.src=url;}
  return entry.image;
 }
 // The figure's silhouette at layer size, registered like the scene's sprite.
 function silhouette(design,side){
  const image=sheet(design);if(!image)return null;
  const big=document.createElement('canvas');big.width=big.height=1152;court.drawCourt(big,image,`king-${design}`,side,0);
  const c=layer(),g=c.getContext('2d');g.drawImage(big,0,0,L,L);return c;
 }
 // A soft copy of a layer: drawn down to 1/`step` and back up (no canvas filter needed).
 function soften(source,step){
  const n=Math.max(4,Math.round(L/step)),small=document.createElement('canvas');small.width=small.height=n;
  const s=small.getContext('2d');s.imageSmoothingQuality='high';s.drawImage(source,0,0,n,n);
  const c=layer(),g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(small,0,0,L,L);return c;
 }
 function cached(key,make){if(!cache.has(key)){const v=make();if(!v)return null;cache.set(key,v);}return cache.get(key);}
 // Flame: the crack mask with a bloom, kept inside the figure; and the two flowing noise fields.
 function flameLayers(side){
  const lavaMask=asset(LAVA_MASK);if(!lavaMask)return null;
  return cached(`flame:${side}`,()=>{
   const figure=silhouette('flame',side);if(!figure)return null;
   const big=document.createElement('canvas');big.width=big.height=1152;court.drawCourt(big,lavaMask,'king-flame',side,0);
   const mask=layer(),g=mask.getContext('2d');g.drawImage(big,0,0,L,L);
   const glow=document.createElement('canvas');glow.width=glow.height=L/6;
   return {mask,figure,work:layer(),glow};
  });
 }
 const noise=[];
 function lavaNoise(){
  if(noise.length)return noise;
  for(const [cells,seed] of [[4,1],[6,2]]){
   const size=96,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),img=g.createImageData(size,size);
   const at=(x,y)=>rand(seed*101+((y%cells+cells)%cells)*cells+((x%cells+cells)%cells),seed);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const fx=x/size*cells,fy=y/size*cells,ix=Math.floor(fx),iy=Math.floor(fy),tx=smooth(fx-ix),ty=smooth(fy-iy);
    const n=(at(ix,iy)*(1-tx)+at(ix+1,iy)*tx)*(1-ty)+(at(ix,iy+1)*(1-tx)+at(ix+1,iy+1)*tx)*ty;
    const v=clamp((n-.3)/.7,0,1)**1.5,o=(y*size+x)*4;
    img.data[o]=255;img.data[o+1]=72+128*v;img.data[o+2]=10+40*v*v;img.data[o+3]=255*v;
   }
   g.putImageData(img,0,0);noise.push(g.createPattern(c,'repeat'));
  }
  return noise;
 }
 function spiritLayers(side){
  return cached(`spirit:${side}`,()=>{
   const figure=silhouette('spirit',side);if(!figure)return null;
   const gold=layer(),g=gold.getContext('2d');g.drawImage(figure,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ffe7a6';g.fillRect(0,0,L,L);
   // A wide soft halo, a closer glow and a bright rim, added together.
   const halo=layer(),h=halo.getContext('2d');h.globalCompositeOperation='lighter';
   for(const [step,alpha] of [[26,1],[12,.9],[5,.8]]){h.globalAlpha=alpha;h.drawImage(soften(gold,step),0,0);}
   return {halo,gold};
  });
 }
 // Draws `image` (a layer) over the figure, with the scene's own figure transform (drawPiece).
 function inFigure(ctx,pose,draw){
  ctx.save();ctx.translate(pose.foot.x,pose.foot.y);ctx.scale(pose.scale*pose.facing*(pose.sx??1),pose.scale*(pose.sy??1));ctx.rotate(pose.rotation??0);
  ctx.translate(-court.ANCHOR.x,-court.ANCHOR.y);draw();ctx.restore();
 }

 // —— Flame ——
 function lava(ctx,s){
  const f=flameLayers(s.side);if(!f)return;
  const [a,b]=lavaNoise(),u=frac(s.t/PERIOD.flame),g=f.work.getContext('2d');
  g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,L,L);
  // A dim ember glow, then two fields of brighter lava flowing down and across through the cracks.
  g.fillStyle='rgba(226,70,12,.34)';g.fillRect(0,0,L,L);
  g.globalCompositeOperation='lighter';
  for(const [pattern,dx,dy] of [[a,0,2],[b,-1,1]]){g.save();g.translate(dx*96*u,dy*96*u);g.fillStyle=pattern;g.fillRect(-dx*96*u,-dy*96*u,L,L);g.restore();}
  g.globalCompositeOperation='destination-in';g.drawImage(f.mask,0,0);
  // The same light, much softer, glows out of the cracks (kept inside the figure).
  const glow=f.glow.getContext('2d'),n=f.glow.width;glow.globalCompositeOperation='source-over';glow.clearRect(0,0,n,n);glow.drawImage(f.work,0,0,n,n);
  glow.globalCompositeOperation='destination-in';glow.drawImage(f.figure,0,0,n,n);
  const pulse=.8+.2*Math.sin(TAU*u*2);
  inFigure(ctx,s.pose,()=>{
   ctx.globalAlpha=s.k*.9;ctx.drawImage(f.work,0,0,1152,1152);
   // Added light reads on the charcoal army; on the ivory it would turn the cream lime, so less there.
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=s.k*pulse*(s.side?.5:.18);ctx.drawImage(f.work,0,0,1152,1152);
   ctx.globalAlpha=s.k*pulse*(s.side?.55:.35);ctx.drawImage(f.glow,0,0,1152,1152);
  });
 }

 // —— Frost ——
 // Every third flake is a soft speck; the others are six-armed crystals, the largest with side twigs.
 const FLAKES=15;
 function crystal(ctx,r,twigs){
  ctx.beginPath();
  for(let k=0;k<6;k++){
   const c=Math.cos(k*Math.PI/3),d=Math.sin(k*Math.PI/3);ctx.moveTo(0,0);ctx.lineTo(c*r,d*r);
   if(twigs){const m=.55*r,t=.32*r;for(const e of [-1,1]){const a=k*Math.PI/3+e*.9;ctx.moveTo(c*m,d*m);ctx.lineTo(c*m+Math.cos(a)*t,d*m+Math.sin(a)*t);}}
  }
 }
 function flakes(ctx,s,front){
  const top=s.pose.foot.y-170,u0=s.t/PERIOD.frost;
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<FLAKES;i++){
   const z=rand(i,3)*2-1;if((z>0)!==front)continue;
   const u=frac(u0+i/FLAKES+rand(i,1)*.05),start=top+rand(i,4)*50,floor=s.ground.y-5+z*11,y=start+(floor-start)*u;
   const x=s.ground.x+(rand(i,2)*2-1)*46+Math.sin(TAU*(u*2+rand(i,5)))*5;
   const melt=smooth((u-.82)/.18),twinkle=.8+.2*Math.sin(TAU*(u*5+rand(i,9)));
   const a=s.k*smooth(u/.1)*(1-melt)*twinkle;if(a<=.01)continue;
   ctx.globalAlpha=a;ctx.save();ctx.translate(x,y);
   if(i%3===0){
    const r=1.3+.9*rand(i,6);ctx.fillStyle='rgba(70,118,165,.55)';ctx.beginPath();ctx.arc(0,0,r+.7,0,TAU);ctx.fill();
    ctx.fillStyle='#f6fcff';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
   }else{
    const r=(2.6+2.2*rand(i,6))*(1-.4*melt);ctx.rotate(TAU*u*(rand(i,7)<.5?1:-1)*.5+rand(i,8)*3);
    crystal(ctx,r,r>3.8);
    ctx.strokeStyle='rgba(58,104,150,.7)';ctx.lineWidth=1.8;ctx.stroke();
    ctx.strokeStyle='#f6fcff';ctx.lineWidth=.85;ctx.stroke();
   }
   ctx.restore();
  }
  ctx.restore();
 }
 // A thin rime on the floor where the flakes land, with a few glints.
 function rime(ctx,s){
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(222,242,255,.75)');g.addColorStop(.6,'rgba(214,236,252,.45)');g.addColorStop(1,'rgba(214,236,252,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*.6;ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(50,15);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.fillStyle='#ffffff';
  for(let i=0;i<7;i++){const a=s.k*s.g*Math.max(0,Math.sin(TAU*(s.t/PERIOD.frost*3+rand(i,11))))**3;if(a<.02)continue;
   const x=s.ground.x+(rand(i,12)*2-1)*40,y=s.ground.y-4+(rand(i,13)*2-1)*10;ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(x-2.4,y);ctx.lineTo(x,y-.6);ctx.lineTo(x+2.4,y);ctx.lineTo(x,y+.6);ctx.closePath();ctx.moveTo(x,y-2.4);ctx.lineTo(x+.6,y);ctx.lineTo(x,y+2.4);ctx.lineTo(x-.6,y);ctx.closePath();ctx.fill();}
  ctx.restore();
 }

 // —— Stratus ——
 // Rings of downdraft spread over the floor under his feet, two per rise and fall.
 // Broken arcs, like wind, that turn as they spread.
 function downdraft(ctx,s){
  ctx.save();ctx.lineWidth=1.2;ctx.lineCap='round';
  for(let i=0;i<2;i++){
   const p=frac(s.t/PERIOD.stratus*2+i/2),rx=12+36*smooth(p),a=s.k*s.g*.5*Math.sin(Math.PI*p);if(a<.02)continue;
   const turn=(i?-1:1)*(.6+1.2*p);
   for(const [colour,dy,alpha] of [['rgba(92,112,128,.8)',1,.5],['rgba(240,247,252,.95)',0,1]]){
    ctx.globalAlpha=a*alpha;ctx.strokeStyle=colour;
    for(let k=0;k<3;k++){const a0=turn+k*TAU/3;ctx.beginPath();ctx.ellipse(s.ground.x,s.ground.y-3+dy,rx,rx*.3,0,a0,a0+1.3);ctx.stroke();}
   }
  }
  ctx.restore();
 }

 // —— Mud ——
 // A full patch of tufts round his feet (an inner and an outer ring), dark at the root, fresh at the tip.
 const TUFTS=34,ROOT=['#2f4a17','#36531a','#3c5c1d'],TIP=['#8cc04a','#a2cc58','#b5d66a'];
 // 0 → 1 (sprout) → hold → 0 (sink back) over one period, each tuft a little apart.
 const grow=u=>u<.28?smooth(u/.28):u<.6?1:u<.86?1-smooth((u-.6)/.26):0;
 // Blade fills in blade space (root at 0, tip at -1), made once per canvas.
 const bladeFills=new WeakMap();
 function fills(ctx){
  let f=bladeFills.get(ctx);
  if(!f){f=[];for(const r of ROOT)for(const t of TIP){const g=ctx.createLinearGradient(0,0,0,-1);g.addColorStop(0,r);g.addColorStop(1,t);f.push(g);}bladeFills.set(ctx,f);}
  return f;
 }
 function grass(ctx,s,front){
  const u0=s.t/PERIOD.mud,f=fills(ctx),m=ctx.getTransform();
  for(let i=0;i<TUFTS;i++){
   const inner=i%2,angle=TAU*(i+.5*inner+rand(i,1)*.6)/TUFTS,depth=Math.sin(angle);if((depth>0)!==front)continue;
   const ring=inner?.38+.3*rand(i,2):.7+.3*rand(i,2),bx=s.ground.x+Math.cos(angle)*48*ring,by=s.ground.y-4+depth*15*ring;
   const g=grow(frac(u0-rand(i,4)*.14))*s.g*s.k;if(g<.02)continue;
   const out=Math.cos(angle)>0?1:-1,blades=4+Math.floor(rand(i,3)*4);
   for(let j=0;j<blades;j++){
    const q=j/(blades-1)-.5,h=(8+12*rand(i,10+j))*(1-.35*Math.abs(q))*(inner?.85:1)*g;if(h<.6)continue;
    const x=bx+q*5,y=by+rand(i,20+j)*1.5,w=1+.7*rand(i,30+j);
    const tip=(q*10+out*2.5)*g+Math.sin(TAU*(u0*2+rand(i,5)+j*.13))*1.8,bend=q*4*g;
    // Blade space: x in board units from the root, y from 0 (root) to -1 (tip).
    ctx.setTransform(m);ctx.translate(x,y);ctx.scale(1,h);
    ctx.fillStyle=f[(j%3)*3+(i+j)%3];ctx.beginPath();ctx.moveTo(-w,0);ctx.quadraticCurveTo(-w*.3+bend,-.6,tip,-1);ctx.quadraticCurveTo(w*.3+bend,-.6,w,0);ctx.closePath();ctx.fill();
   }
  }
  ctx.setTransform(m);
 }
 function earth(ctx,s){
  const u0=s.t/PERIOD.mud,k=s.k*s.g*(.55+.45*grow(frac(u0-.06)));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(66,44,20,.7)');g.addColorStop(.7,'rgba(66,44,20,.45)');g.addColorStop(1,'rgba(66,44,20,0)');
  ctx.save();ctx.globalAlpha=k;ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(56,18);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }
 // Roots: thin branching lines over the square from under his feet, as segments [x0,y0,x1,y1,t0,t1,width]
 // (board units from the floor point; t: when along the growth the segment starts and ends; a width class,
// so each class is one stroke).
 // The square reaches 56 to each side, 96 behind his feet and 16 in front.
 const ROOTS=(()=>{
  const out=[],inside=(x,y)=>Math.abs(x)<52&&y>-90&&y<12;
  function grow(x,y,a,length,t0,span,width,seed,depth){
   const steps=Math.round(length/5);let t=t0;
   for(let i=0;i<steps;i++){
    a+=(rand(seed,i)-.5)*.5;const nx=x+Math.cos(a)*5,ny=y+Math.sin(a)*5*.8;if(!inside(nx,ny))break;
    const t1=t+span/steps,w=width*(1-.6*i/steps);out.push([x,y,nx,ny,t,t1,w>1.35?0:w>.95?1:2]);
    if(depth<2&&i>=1&&rand(seed,i+50)<.32)grow(nx,ny,a+(rand(seed,i+70)<.5?-1:1)*(.55+.4*rand(seed,i+90)),length*.42,t1,span*.4,width*.6,seed*7+i,depth+1);
    x=nx;y=ny;t=t1;
   }
  }
  for(let i=0;i<9;i++){const a=TAU*(i+.3*rand(i,60))/9;grow(Math.cos(a)*7,Math.sin(a)*3,a,34+22*rand(i,61),0,.75,1.7,i+1,0);}
  return out;
 })();
 function roots(ctx,s){
  const u0=s.t/PERIOD.mud,g=grow(frac(u0+.03))*s.g*s.k;if(g<.02)return;
  ctx.save();ctx.lineCap='round';ctx.translate(s.ground.x,s.ground.y-4);
  for(const [colour,extra] of [['rgba(146,110,62,.5)',1.3],['#3a2412',0]]){
   ctx.strokeStyle=colour;
   for(const [cls,width] of [1.7,1.2,.8].entries()){
    ctx.lineWidth=width+extra;ctx.beginPath();
    for(const [x0,y0,x1,y1,t0,t1,c] of ROOTS){
     if(t0>=g||c!==cls)continue;
     const f=Math.min(1,(g-t0)/(t1-t0));ctx.moveTo(x0,y0);ctx.lineTo(x0+(x1-x0)*f,y0+(y1-y0)*f);
    }
    ctx.stroke();
   }
  }
  ctx.restore();
 }

 // —— Spirit ——
 // A slow breath from dim to a white-gold peak (no flicker: one smooth cosine).
 const breath=t=>(1-Math.cos(TAU*t/PERIOD.spirit))/2;
 const RAYS=11;
 function holyBack(ctx,s){
  const b=breath(s.t),sp=spiritLayers(s.side),c={x:s.pose.foot.x,y:s.pose.foot.y-84*(s.pose.sy??1)};
  ctx.save();ctx.globalCompositeOperation='lighter';
  // Light pooled on the square.
  const pool=ctx.createRadialGradient(0,0,0,0,0,1);pool.addColorStop(0,'rgba(255,238,178,.9)');pool.addColorStop(.55,'rgba(255,232,160,.45)');pool.addColorStop(1,'rgba(255,232,160,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.3+.6*b);ctx.translate(s.ground.x,s.ground.y-3);ctx.scale(58,20);ctx.fillStyle=pool;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
  // Soft rays fanning out behind him, swaying a little.
  const rays=ctx.createRadialGradient(c.x,c.y,6,c.x,c.y,78);rays.addColorStop(0,'rgba(255,244,200,.75)');rays.addColorStop(.45,'rgba(255,236,170,.32)');rays.addColorStop(1,'rgba(255,236,170,0)');
  const sway=.1*Math.sin(TAU*s.t/PERIOD.spirit);
  ctx.globalAlpha=s.k*(.2+.65*b);ctx.fillStyle=rays;ctx.beginPath();
  for(let i=0;i<RAYS;i++){
   const a=-Math.PI/2+(i-(RAYS-1)/2)*.29+sway*(i%2?1:-1),w=.05+.03*rand(i,40),l=58+20*rand(i,41);
   ctx.moveTo(c.x,c.y);ctx.lineTo(c.x+Math.cos(a-w)*l,c.y+Math.sin(a-w)*l);ctx.lineTo(c.x+Math.cos(a+w)*l,c.y+Math.sin(a+w)*l);ctx.closePath();
  }
  ctx.fill();
  // The glow round his outline.
  if(sp)inFigure(ctx,s.pose,()=>{ctx.globalAlpha=s.k*(.4+.6*b);ctx.drawImage(sp.halo,0,0,1152,1152);if(b>.5){ctx.globalAlpha=s.k*(b-.5)*1.2;ctx.drawImage(sp.halo,0,0,1152,1152);}});
  ctx.restore();
 }
 function holyFront(ctx,s){
  const sp=spiritLayers(s.side);if(!sp)return;
  inFigure(ctx,s.pose,()=>{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=s.k*(s.side?.1+.42*breath(s.t):.05+.25*breath(s.t));ctx.drawImage(sp.gold,0,0,1152,1152);});
 }

 // —— Shadow ——
 // Base points on the floor around his feet (x, depth: + in front), lean, size, phase.
 const HANDS=[[-34,-.6,-.34,1,0],[32,-.75,.3,.95,.47],[-41,.5,-.3,1.15,.24],[39,.4,.36,1.1,.7],[-12,.95,-.12,.95,.86]];
 // Rise 0..1, then the fingers close (0 open .. 1 clutched) at the top, and the hand sinks back.
 const rise=u=>u<.24?1-(1-smooth(u/.24))**2:u<.56?1:u<.8?1-smooth((u-.56)/.24):0;
 const clutch=u=>u<.2?.1:u<.5?.1+.85*smooth((u-.2)/.3):.95;
 // Bones of one hand, in hand space: the base on the floor at 0,0, up is -y, the palm turned to +x.
 function bones(curl){
  // Radius and ulna: apart at the elbow (below the floor), close at the wrist, with the wrist's knob.
  const lines=[[[-2.6,6],[-1.5,-14.8],2.4],[[2.6,6],[1.4,-15.2],2.4],[[-1.9,-15.6],[1.9,-16],2.8]];
  const knuckles=[[-4.8,-24],[-1.6,-25.6],[1.6,-25.2],[4.4,-23.4]],spread=[-.38,-.13,.1,.34],length=[[5,3.6,2.8],[5.7,4,3],[5.4,3.8,2.9],[4.3,3.1,2.4]];
  for(let f=0;f<4;f++){
   lines.push([[(f-1.5)*1.4,-17.5],knuckles[f],1.8]);
   let p=knuckles[f],a=-Math.PI/2+spread[f]*(1.25-curl*.6);
   for(let j=0;j<3;j++){a+=curl*[.6,.85,.75][j];const q=[p[0]+Math.cos(a)*length[f][j],p[1]+Math.sin(a)*length[f][j]];lines.push([p,q,1.85-j*.2]);p=q;}
  }
  let p=[-2.8,-18],a=-Math.PI/2-1.05+curl*.3;const base=[-6.8,-21.4];
  lines.push([p,base,1.8]);p=base;
  for(let j=0;j<2;j++){a+=curl*.7;const q=[p[0]+Math.cos(a)*[4,3.1][j],p[1]+Math.sin(a)*[4,3.1][j]];lines.push([p,q,1.5]);p=q;}
  return lines;
 }
 const PALM=[[-3.2,-16.6],[3,-16.8],[4.6,-23.2],[1.6,-25],[-1.6,-25.4],[-4.9,-23.6]];
 // Bone colours per army: black bones with a pale edge (charcoal), bone white with a dark outline (ivory).
 const BONE=[
  {outline:'rgba(52,42,30,.92)',body:'#ede6d4',edge:'rgba(150,134,108,.85)',palm:'rgba(236,229,212,.4)'},
  {outline:null,body:'#0b0910',edge:'rgba(176,170,180,.8)',palm:'rgba(11,9,16,.55)'},
 ];
 function stroke(ctx,lines,colour,scale,dx=0,dy=0,add=0){
  ctx.strokeStyle=colour;
  for(const width of [...new Set(lines.map(l=>l[2]))]){
   ctx.lineWidth=width*scale+add;ctx.beginPath();
   for(const [p,q,w] of lines)if(w===width){ctx.moveTo(p[0]+dx,p[1]+dy);ctx.lineTo(q[0]+dx,q[1]+dy);}
   ctx.stroke();
  }
 }
 // A jagged crack in the floor stone, along x from -1 to 1 (scaled by w, opened by h): dark inside,
 // a lit lip on its far edge, and hairline cracks running off its ends.
 function crack(ctx,x,y,w,h,seed){
  if(h<.05)return;
  const n=7,top=[],bottom=[];
  for(let i=0;i<=n;i++){const u=i/n*2-1,open=(1-u*u)**.7;top.push([x+u*w+(rand(seed,i)-.5)*2.2,y-h*open*(.7+.6*rand(seed,i+10))]);bottom.push([x+u*w+(rand(seed,i+20)-.5)*2.2,y+h*open*(.5+.5*rand(seed,i+30))]);}
  ctx.fillStyle='#050407';ctx.beginPath();top.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));for(let i=n;i>=0;i--)ctx.lineTo(...bottom[i]);ctx.closePath();ctx.fill();
  ctx.lineWidth=.9;ctx.strokeStyle='rgba(226,214,190,.45)';ctx.beginPath();top.forEach(([px,py],i)=>i?ctx.lineTo(px,py-.6):ctx.moveTo(px,py-.6));ctx.stroke();
  ctx.lineWidth=.7;ctx.strokeStyle='rgba(8,6,10,.75)';ctx.beginPath();
  for(const e of [-1,1]){let px=x+e*w,py=y;ctx.moveTo(px,py);for(let i=0;i<3;i++){px+=e*(2.5+2*rand(seed,40+i+e));py+=(rand(seed,50+i+e)-.5)*3;ctx.lineTo(px,py);}}
  ctx.stroke();
 }
 function hands(ctx,s,front){
  const u0=s.t/PERIOD.shadow,bone=BONE[s.side];
  for(const [i,[hx,depth,lean,size,phase]] of HANDS.entries()){
   if((depth>0)!==front)continue;
   const u=frac(u0-phase),r=rise(u)*s.g*s.k;if(r<.01)continue;
   const x=s.ground.x+hx*s.facing,y=s.ground.y-4+depth*13,k=size*(.92+.08*depth),c=clutch(u),sway=.05*Math.sin(TAU*(u0*2+phase));
   crack(ctx,x,y,10.5*k,Math.min(1,r*1.6)*2.9*k,i+1);
   ctx.save();ctx.beginPath();ctx.rect(x-34,y-60,68,60);ctx.clip();
   ctx.translate(x,y+(1-r)*34*k);ctx.rotate((lean+sway)*s.facing*(r*.6+.4));ctx.scale(k*(hx*s.facing<0?-1:1),k);ctx.lineCap='round';ctx.lineJoin='round';
   const lines=bones(c),joints=lines.slice(2).map(l=>l[0]);
   ctx.fillStyle=bone.palm;ctx.beginPath();PALM.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();
   if(bone.outline){stroke(ctx,lines,bone.outline,1,0,0,1.1);ctx.fillStyle=bone.outline;for(const p of joints){ctx.beginPath();ctx.arc(p[0],p[1],1.7,0,TAU);ctx.fill();}}
   stroke(ctx,lines,bone.body,1);
   ctx.fillStyle=bone.body;for(const p of joints){ctx.beginPath();ctx.arc(p[0],p[1],1.15,0,TAU);ctx.fill();}
   stroke(ctx,lines,bone.edge,.3,s.side?-.55:.5,s.side?-.25:.25);
   ctx.restore();
  }
 }
 function abyss(ctx,s){
  const u0=s.t/PERIOD.shadow;let up=0;for(const h of HANDS)up=Math.max(up,rise(frac(u0-h[4])));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(6,4,10,.6)');g.addColorStop(.65,'rgba(10,6,16,.32)');g.addColorStop(1,'rgba(10,6,16,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.45+.4*up);ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(54,17);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }
 // Smoke: the sheet split by the smoke mask into the figure (the scene draws it) and the smoke, here at
 // half the sprite's size. Two copies drift upward half a period apart and cross-fade (they add up to
 // the painted smoke when they meet it), and a wave runs up through both, so the wisps curl as they rise.
 const SMOKE=576,STRIP=12;
 function shadowLayers(side){
  const mask=asset(SMOKE_MASK),image=sheet('shadow');if(!mask||!image)return null;
  return cached(`shadow:${side}`,()=>{
   const split=keep=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const g=c.getContext('2d');g.drawImage(image,0,0);g.globalCompositeOperation=keep?'destination-in':'destination-out';g.drawImage(mask,0,0);return c;};
   const body=cached('shadow:body',()=>split(false)),big=document.createElement('canvas');big.width=big.height=1152;court.drawCourt(big,split(true),'king-shadow',side,0);
   const smoke=document.createElement('canvas');smoke.width=smoke.height=SMOKE;smoke.getContext('2d').drawImage(big,0,0,SMOKE,SMOKE);
   const work=document.createElement('canvas');work.width=work.height=SMOKE;
   return {body,smoke,work};
  });
 }
 function smoke(ctx,s){
  const l=shadowLayers(s.side);if(!l)return;
  const g=l.work.getContext('2d'),motion=s.k/(s.opacity||1),u0=s.t/PERIOD.shadow;
  g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,SMOKE,SMOKE);g.globalCompositeOperation='lighter';
  for(let phase=0;phase<2;phase++){
   const u=frac(u0*2+phase/2),w=1-Math.abs(2*u-1),rise=-44*(u-.5)*motion;if(w<.003)continue;
   g.globalAlpha=w;
   for(let y=0;y<SMOKE;y+=STRIP){
    const dx=motion*(5*Math.sin(TAU*(y/150+u0*2+phase*.37))+3*Math.sin(TAU*(y/70-u0*4)));
    g.drawImage(l.smoke,0,y,SMOKE,STRIP,dx,y+rise,SMOKE,STRIP);
   }
  }
  inFigure(ctx,s.pose,()=>{ctx.globalAlpha=s.opacity??1;ctx.drawImage(l.work,0,0,1152,1152);});
 }

 return {
  /** Whether a design has an effect; starts loading that effect's own art. */
  has(design){if(design==='flame')flameLayers(0);if(design==='shadow')shadowLayers(0);return design in PERIOD;},
  /** The pose the figure is drawn with (Stratus floats; Shadow is drawn without his painted smoke, which moves). */
  pose(s){
   if(s.design==='shadow'){const l=shadowLayers(s.side);return l?{...s.pose,sheet:l.body}:s.pose;}
   if(s.design!=='stratus')return s.pose;
   const p=s.pose,lift=hoverAt(s.t,s.k),ground=p.ground??p.foot;
   return {...p,ground,foot:{x:p.foot.x,y:p.foot.y-lift},lift:(p.lift??0)+lift,shadow:(p.shadow??1)*(1-.045*lift)};
  },
  /**
   * s: {design, side, pose (the figure as drawn), ground (floor point under the feet), facing, t (ms),
   *  k (0..1 the whole effect: his opacity, and it fades as he falls), opacity (his opacity alone),
   *  g (0..1 effects on his square, they leave while he moves)}.
   */
  back(ctx,s){
   if(s.design==='frost'){rime(ctx,s);flakes(ctx,s,false);}
   else if(s.design==='stratus')downdraft(ctx,s);
   else if(s.design==='mud'){earth(ctx,s);roots(ctx,s);grass(ctx,s,false);}
   else if(s.design==='spirit')holyBack(ctx,s);
   else if(s.design==='shadow'){abyss(ctx,s);hands(ctx,s,false);smoke(ctx,s);}
  },
  front(ctx,s){
   if(s.design==='flame')lava(ctx,s);
   else if(s.design==='frost')flakes(ctx,s,true);
   else if(s.design==='mud')grass(ctx,s,true);
   else if(s.design==='spirit')holyFront(ctx,s);
   else if(s.design==='shadow')hands(ctx,s,true);
  },
 };
}
