// The six kings' idle effects on the painted board (opt-in: scene.setLively({kings:true})).
//   flame   lava light flows through the cracks and seams of his armour (king-flame/lava-mask.webp, cut from the art)
//   frost   ice flakes drift down around and in front of him and fade out on his square's floor
//   stratus he hovers a few board units up and down; his shadow shrinks as he rises
//   mud     a thick patch of grass sprouts round his feet and leafy vines rise from the earth, arch over and
//           root again; grass and vines sway and sink back
//   spirit  a holy glow round him, short rays behind his head and light on his square brighten and dim
//   shadow  skeletal hands (black for the charcoal army, bone white for the ivory) reach up out of cracks
//           round his feet, clutch and sink back; his painted smoke drifts and curls upward
//           (king-shadow/smoke-mask.webp, cut from the art: the figure is drawn without it, the smoke moves)
// The scene draws back() before a king's figure and front() after it, so a figure standing in front
// (a lower row) still covers both. Every effect repeats exactly after PERIOD[design] ms, so one
// period recorded loops without a seam. Units are board units (the board is 960 wide).
import {clamp} from '../painted-mesh.mjs';
import * as court from '../court-motion.mjs';
import {drawHand,drawCrack} from './skeleton-hands.mjs';

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
 // Spirit: his gold silhouette, a close rim and a wide halo, on layers with room round the sprite (PADL
 // sprite px each side), so no glow is ever cut at the sprite's edge. The silhouette and the rim are at half
 // the sprite's resolution (sharp enough for the title screen's large kings), the wide halo at a quarter.
 // Blurred with the canvas filter where there is one (fast), else in script (three box passes, about the
 // same Gaussian).
 const PADL=160,SPAN=1152+2*PADL;
 const canFilter=typeof document!=='undefined'&&typeof document.createElement('canvas').getContext('2d')?.filter==='string';
 function blurAlpha(c,radius){
  if(canFilter){const o=document.createElement('canvas');o.width=c.width;o.height=c.height;const x=o.getContext('2d');x.filter=`blur(${radius}px)`;x.drawImage(c,0,0);return o;}
  const g=c.getContext('2d'),w=c.width,h=c.height,img=g.getImageData(0,0,w,h),a=new Float32Array(w*h),b=new Float32Array(w*h);
  for(let i=0;i<w*h;i++)a[i]=img.data[i*4+3];
  const pass=(src,dst,n,stride,count,step)=>{for(let line=0;line<count;line++){const o=line*step;let sum=0;
   for(let i=-radius;i<=radius;i++)sum+=src[o+Math.min(n-1,Math.max(0,i))*stride];
   for(let i=0;i<n;i++){dst[o+i*stride]=sum/(2*radius+1);sum+=src[o+Math.min(n-1,i+radius+1)*stride]-src[o+Math.max(0,i-radius)*stride];}}};
  for(let k=0;k<3;k++){pass(a,b,w,1,h,w);pass(b,a,h,w,w,1);}
  for(let i=0;i<w*h;i++)img.data[i*4+3]=a[i];
  g.putImageData(img,0,0);return c;
 }
 // The silhouette of `big` (a 1152 px sprite) in one colour, at 1/step of the sprite's resolution, padded.
 function tinted(big,step,colour){
  const n=Math.round(SPAN/step),c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
  g.drawImage(big,PADL/step,PADL/step,1152/step,1152/step);g.globalCompositeOperation='source-in';g.fillStyle=colour;g.fillRect(0,0,n,n);return c;
 }
 function spiritLayers(side){
  return cached(`spirit:${side}`,()=>{
   const image=sheet('spirit');if(!image)return null;
   const big=document.createElement('canvas');big.width=big.height=1152;court.drawCourt(big,image,'king-spirit',side,0);
   return {gold:tinted(big,2,'#ffe7a6'),rim:blurAlpha(tinted(big,2,'#fff2cf'),5),halo:blurAlpha(tinted(big,4,'#ffe2a0'),10)};
  });
 }
 // Soft rays fanning up from his crown, drawn once and blurred (no hard edges): board units ×4,
 // 80 × 44 units round the point they fan from (40, 42).
 let rayLayer=null;
 function rays(){
  if(rayLayer)return rayLayer;
  const k=4,c=document.createElement('canvas');c.width=80*k;c.height=44*k;const g=c.getContext('2d');
  const o={x:40*k,y:42*k},fill=g.createRadialGradient(o.x,o.y,3*k,o.x,o.y,38*k);fill.addColorStop(0,'rgba(255,246,206,1)');fill.addColorStop(.45,'rgba(255,236,170,.45)');fill.addColorStop(1,'rgba(255,236,170,0)');
  g.fillStyle=fill;g.beginPath();
  for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.25,w=.055+.03*rand(i,40),l=(27+9*rand(i,41))*k;g.moveTo(o.x,o.y);g.lineTo(o.x+Math.cos(a-w)*l,o.y+Math.sin(a-w)*l);g.lineTo(o.x+Math.cos(a+w)*l,o.y+Math.sin(a+w)*l);g.closePath();}
  g.fill();
  return rayLayer=blurAlpha(c,7);
 }
 // A Spirit layer over the figure (padded layer → sprite px).
 function inSpirit(ctx,s,image){inFigure(ctx,s.pose,()=>ctx.drawImage(image,-PADL,-PADL,SPAN,SPAN));}
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
 const TUFTS=52,ROOT=['#2f4a17','#36531a','#3c5c1d'],TIP=['#8cc04a','#a2cc58','#b5d66a'];
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
   const ringNo=i%3,angle=TAU*(i+.37*ringNo+rand(i,1)*.6)/TUFTS,depth=Math.sin(angle);if((depth>0)!==front)continue;
   const ring=[.32,.6,.86][ringNo]+.14*rand(i,2),bx=s.ground.x+Math.cos(angle)*50*ring,by=s.ground.y-4+depth*16*ring;
   const g=grow(frac(u0-rand(i,4)*.14))*s.g*s.k;if(g<.02)continue;
   const out=Math.cos(angle)>0?1:-1,blades=5+Math.floor(rand(i,3)*5),inner=ringNo===0;
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
 // Vines: each rises out of the earth at one point, arches over and roots again at another, growing along its
 // length and then drawing back, with leaves opening along it. [x0, depth0, x1, depth1, height, phase, seed]
 // (board units from his floor point; depth + in front of him).
 const VINES=[[-46,-.3,-20,-.85,30,0,1],[18,-.9,46,-.25,27,.12,2],[-48,.25,-26,.85,24,.06,3],[22,.85,48,.3,25,.18,4],[-12,.98,12,.95,17,.24,5],[-30,-.98,6,-.95,22,.3,6]];
 const N=26;
 // A vine's centre line: an arch between its two feet, leaning and kinked a little, so no two look alike.
 function vinePoint(v,f,s,sway){
  const [x0,d0,x1,d1,h,,seed]=v,x=x0+(x1-x0)*f,d=d0+(d1-d0)*f,lean=(rand(seed,7)-.5)*.5;
  const lift=Math.sin(Math.PI*f)**.75*h*(1+lean*(f-.5)),wob=Math.sin(TAU*f*1.5+seed)*2.2*Math.sin(Math.PI*f);
  return {x:s.ground.x+(x+wob+sway*Math.sin(Math.PI*f))*s.facing,y:s.ground.y-4+d*15-lift};
 }
 const LEAF=['#4f8a2a','#62a034','#3f7424'];
 // An ivy-like leaf of length l along +x: two lobes, a point, a pale midrib.
 function leaf(ctx,l,colour){
  ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(0,0);
  ctx.bezierCurveTo(l*.15,-l*.55,l*.7,-l*.55,l,0);ctx.bezierCurveTo(l*.7,l*.55,l*.15,l*.55,0,0);ctx.fill();
  ctx.strokeStyle='rgba(24,46,10,.8)';ctx.lineWidth=.55;ctx.stroke();
  ctx.strokeStyle='rgba(190,220,140,.55)';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(.8,0);ctx.lineTo(l*.85,0);ctx.stroke();
 }
 function vines(ctx,s,front){
  const u0=s.t/PERIOD.mud;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const v of VINES){
   const [, d0,, d1,, phase,seed]=v;if(((d0+d1)/2>0)!==front)continue;
   const g=grow(frac(u0-phase))*s.g*s.k;if(g<.02)continue;
   const n=Math.max(2,Math.round(N*g)),sway=Math.sin(TAU*(u0*2+seed*.17))*1.4,pts=[];
   for(let i=0;i<=n;i++)pts.push(vinePoint(v,i/N,s,sway));
   // Stem: thick at the root, thin at the growing tip (outline, body, a lit edge).
   for(const [colour,scale,dy] of [['#1c300d',1.45,0],['#3d6a1e',1,0],['#8cc055',.32,-.5]]){
    ctx.strokeStyle=colour;
    for(let i=1;i<pts.length;i++){const w=(1.1+2.4*(1-i/N))*scale;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(pts[i-1].x,pts[i-1].y+dy);ctx.lineTo(pts[i].x,pts[i].y+dy);ctx.stroke();}
   }
   // Leaves open behind the growing tip, on alternate sides, each a little different.
   for(let i=3;i<pts.length-1;i+=3){
    const p=pts[i],q=pts[i+1],side=(i/3)%2?1:-1,a=Math.atan2(q.y-p.y,q.x-p.x)+side*(.8+.5*rand(seed,i)),open=Math.min(1,(pts.length-1-i)/4)*g;if(open<.05)continue;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.scale(open,open);leaf(ctx,4.5+2.5*rand(seed,i+20),LEAF[(seed+i)%3]);ctx.restore();
   }
   // A curled tendril at the growing tip.
   if(g<.98){const t=pts.at(-1),b=pts.at(-2),a=Math.atan2(t.y-b.y,t.x-b.x);ctx.strokeStyle='#5e9431';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<=12;k++){const r=3.4*(1-k/14),th=a+k*.55*side0(seed);const x=t.x+Math.cos(th)*r-Math.cos(a)*3.4,y=t.y+Math.sin(th)*r-Math.sin(a)*3.4;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
   // The earth each end comes out of.
   ctx.fillStyle='rgba(58,38,18,.85)';for(const e of [pts[0],...(g>.97?[vinePoint(v,1,s,sway)]:[])]){ctx.beginPath();ctx.ellipse(e.x,e.y+.6,4.2,1.7,0,0,TAU);ctx.fill();}
  }
  ctx.restore();
 }
 const side0=seed=>seed%2?1:-1;

 // —— Spirit ——
 // A slow breath from dim to a white-gold peak (no flicker: one smooth cosine).
 const breath=t=>(1-Math.cos(TAU*t/PERIOD.spirit))/2;
 function holyBack(ctx,s){
  const b=breath(s.t),sp=spiritLayers(s.side),sy=s.pose.sy??1,head={x:s.pose.foot.x,y:s.pose.foot.y-118*sy};
  ctx.save();ctx.globalCompositeOperation='lighter';
  // Light pooled on his square.
  const pool=ctx.createRadialGradient(0,0,0,0,0,1);pool.addColorStop(0,'rgba(255,238,178,.85)');pool.addColorStop(.55,'rgba(255,232,160,.4)');pool.addColorStop(1,'rgba(255,232,160,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.28+.55*b);ctx.translate(s.ground.x,s.ground.y-3);ctx.scale(48,16);ctx.fillStyle=pool;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
  // Short soft rays behind his crown, in a narrow fan that turns a little (about 36 units: not over the next square).
  ctx.save();ctx.globalAlpha=s.k*(.18+.55*b);ctx.translate(head.x,head.y);ctx.rotate(.05*Math.sin(TAU*s.t/PERIOD.spirit/2));ctx.drawImage(rays(),-40,-42,80,44);ctx.restore();
  // The glow round his outline: the wide halo, and the close rim brightening towards the peak.
  if(sp){ctx.globalAlpha=s.k*(.4+.5*b);inSpirit(ctx,s,sp.halo);ctx.globalAlpha=s.k*(.3+.7*b);inSpirit(ctx,s,sp.rim);}
  ctx.restore();
 }
 function holyFront(ctx,s){
  const sp=spiritLayers(s.side);if(!sp)return;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=s.k*(s.side?.1+.42*breath(s.t):.05+.25*breath(s.t));inSpirit(ctx,s,sp.gold);ctx.restore();
 }

 // —— Shadow ——
 // Base points on the floor around his feet (x, depth: + in front), lean, size, phase.
 const HANDS=[[-34,-.6,-.34,1,0],[32,-.75,.3,.95,.47],[-41,.5,-.3,1.15,.24],[39,.4,.36,1.1,.7],[-12,.95,-.12,.95,.86]];
 // Rise 0..1, then the fingers close (0 open .. 1 clutched) at the top, and the hand sinks back.
 const rise=u=>u<.24?1-(1-smooth(u/.24))**2:u<.56?1:u<.8?1-smooth((u-.56)/.24):0;
 const clutch=u=>u<.2?.1:u<.5?.1+.85*smooth((u-.2)/.3):.95;
 function hands(ctx,s,front){
  const u0=s.t/PERIOD.shadow;
  for(const [i,[hx,depth,lean,size,phase]] of HANDS.entries()){
   if((depth>0)!==front)continue;
   const u=frac(u0-phase),r=rise(u)*s.g*s.k;if(r<.01)continue;
   const x=s.ground.x+hx*s.facing,y=s.ground.y-4+depth*13,k=size*(.92+.08*depth),sway=.05*Math.sin(TAU*(u0*2+phase));
   drawCrack(ctx,x,y,10.5*k,Math.min(1,r*1.6)*2.9*k,i+1);
   drawHand(ctx,x,y,{side:s.side,size:k,flip:hx*s.facing<0,angle:(lean+sway)*s.facing*(r*.6+.4),rise:r,curl:clutch(u)});
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
   else if(s.design==='mud'){earth(ctx,s);grass(ctx,s,false);vines(ctx,s,false);}
   else if(s.design==='spirit')holyBack(ctx,s);
   else if(s.design==='shadow'){abyss(ctx,s);hands(ctx,s,false);smoke(ctx,s);}
  },
  front(ctx,s){
   if(s.design==='flame')lava(ctx,s);
   else if(s.design==='frost')flakes(ctx,s,true);
   else if(s.design==='mud'){grass(ctx,s,true);vines(ctx,s,true);}
   else if(s.design==='spirit')holyFront(ctx,s);
   else if(s.design==='shadow')hands(ctx,s,true);
  },
 };
}
