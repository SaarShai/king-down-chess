// The six kings' idle effects on the painted board (opt-in: scene.setLively({kings:true})).
//   flame   lava light flows through the cracks and seams of his armour (king-flame/lava-mask.webp, cut from the art)
//   frost   ice flakes drift down around and in front of him and fade out on his square's floor
//   stratus he hovers over a cloud core while separate outer billows form, roll and fade
//   mud     original growth for eight seconds, then painted growth for eight seconds, with quiet soil joins
//   spirit  a holy glow round him, short rays behind his head and light on his square brighten and dim:
//           white and gold for the ivory king, warm black for the charcoal king
//   shadow  skeletal hands (black for the charcoal army, bone white for the ivory) reach up out of cracks
//           round his feet, clutch and sink back; his painted smoke drifts and curls upward
//           (king-shadow/smoke-mask.webp, cut from the art: the figure is drawn without it, the smoke moves)
// The scene draws back() before a king's figure and front() after it, so a figure standing in front
// (a lower row) still covers both. Every effect repeats exactly after PERIOD[design] ms, so one
// period recorded loops without a seam. Units are board units (the board is 960 wide).
import {clamp} from '../painted-mesh.mjs';
import * as court from '../court-motion.mjs';
import {drawCrack,crackLip} from './skeleton-hands.mjs';
import {shadowHandsAt,drawPaintedShadowHand} from './painted-shadow-hands.mjs';
import {GRASS_ROOT,GRASS_TIP,LEAF,VINE} from './mud-palette.mjs';
import {MUD_CYCLE,mudCycle,MUD_TUFTS,MUD_VINES,mudTuftLife,mudVineLife,mudVinePoint} from './mud-growth.mjs';

export const PERIOD={flame:4800,frost:6000,stratus:4000,mud:MUD_CYCLE*2,spirit:4000,shadow:6400};
export const KING_EFFECTS=Object.keys(PERIOD);
const LAVA_MASK=new URL('../king-flame/lava-mask.webp',import.meta.url).href;
const LAVA_GROUND=new URL('../king-flame/ground-fissures.webp',import.meta.url).href;
const MUD_PLANTS=new URL('../king-mud/ground-plants.webp',import.meta.url).href;
const CLOUD_BANK=new URL('../king-stratus/cloud-bank.png',import.meta.url).href;
const HAND_BANK=new URL('../king-shadow/hands/film-poses.webp',import.meta.url).href;
const SMOKE_MASK=new URL('../king-shadow/smoke-mask.webp',import.meta.url).href;
const TAU=Math.PI*2;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const frac=x=>x-Math.floor(x);
// Deterministic noise: the same flake, blade or hand every period.
const rand=(i,j=0)=>frac(Math.sin(i*127.1+j*311.7+.5)*43758.5453);
// A layer in a figure's sprite space at a quarter of its 1152 px canvas (enough for glow).
const L=288;
const layer=()=>{const c=document.createElement('canvas');c.width=c.height=L;return c;};

/**
 * Where a king's loop starts when his effect starts (ms): the two armies a little apart. Mud's loop must start
 * at its beginning (the grass comes up before the vines), so when both kings start together (together: a new
 * game or position) the charcoal king's simply starts 1.5 s later; after a move he starts at once.
 */
export function phaseOffset(design,side,together=true){return design==='mud'?(together?-side*1500:0):side*1777;}
/**
 * Two clocks. s.t starts again when he arrives on a square: what grows on his square (grass, vines, hands,
 * light on the floor) grows back from its beginning. s.now never restarts: what goes with his figure (his
 * lava, his falling flakes, his smoke, his hover) keeps its phase across a move, so nothing on him jumps.
 */
const figureClock=s=>s.now??s.t;
/** Stratus: how far he floats above his square (board units) at time t; k fades it. */
export function hoverAt(t,k=1){return k*(3+6*(1-Math.cos(TAU*t/PERIOD.stratus))/2);}

/** A ground material's bounded, seamless reveal. */
export function groundLife(t,period){const p=frac(Math.max(0,t)/period);return smooth(p/.28)*(1-smooth((p-.62)/.38));}
// Each billow uses a different painted lobe, start, lifetime and path. The core never dissolves.
const CLOUD_BILLOWS=[
 {crop:[.02,.28,.36,.68],phase:.04,life:.61,side:-1,start:19,travel:18,y:-3,rise:5,w:56},
 {crop:[.70,.24,.29,.73],phase:.31,life:.53,side:1,start:20,travel:18,y:0,rise:4,w:50},
 {crop:[.24,.14,.34,.82],phase:.57,life:.69,side:-1,start:4,travel:17,y:-5,rise:6,w:46},
 {crop:[.42,.07,.35,.90],phase:.79,life:.57,side:1,start:7,travel:18,y:2,rise:4,w:53}
];
/** Floor-clock positions; every reset occurs while that billow is fully transparent. */
export function stratusCloudAt(t){
 const p=frac(t/PERIOD.stratus);
 return {core:{x:.7*Math.sin(TAU*p),y:-2-.6*Math.cos(TAU*p),w:92},billows:CLOUD_BILLOWS.map(b=>{
  const u=frac(p-b.phase),v=clamp(u/b.life,0,1),roll=smooth(v);
  return {alpha:smooth(v/.25)*(1-smooth((v-.48)/.52))*.86,
   x:b.side*(b.start+b.travel*roll),y:b.y-b.rise*Math.sin(Math.PI*v),
   angle:b.side*(-.09+.18*roll),w:b.w};
 })};
}
export function createKingEffects({sheet,onLoad=()=>{}}){
 const cache=new Map(),assets=new Map();
 // An effect's own art: null until it has loaded (then the layers built from it are rebuilt).
 function asset(url){
  let entry=assets.get(url);
  if(!entry){entry={image:null};assets.set(url,entry);const image=Object.assign(new Image(),{crossOrigin:'anonymous'});image.onload=()=>{entry.image=image;cache.clear();onLoad();};image.src=url;}
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
 // Turn frames already contain orange cracks. Use their colour and alpha as the mask.
 const turnFlame=new WeakMap();
 function flameFor(s){
  if(!s.bodyBounds)return flameLayers(s.side);
  const image=s.pose.bank.image;let f=turnFlame.get(image);if(f)return f;
  const figure=layer(),g=figure.getContext('2d');g.drawImage(image,0,0,L,L);
  const mask=layer(),m=mask.getContext('2d'),pixels=g.getImageData(0,0,L,L);
  for(let i=0;i<pixels.data.length;i+=4){
   const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],a=pixels.data[i+3];
   pixels.data[i+3]=a*clamp((r-g-35)/45,0,1)*clamp((g-b-25)/35,0,1);
  }
  m.putImageData(pixels,0,0);
  const glow=document.createElement('canvas');glow.width=glow.height=L/6;
  f={mask,figure,work:layer(),glow};turnFlame.set(image,f);return f;
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
 // grow: widen the silhouette by this many layer px first (drawn round a circle), so a glow can reach out
 // from the body with full strength before it softens.
 function tinted(big,step,colour,grow=0){
  const n=Math.round(SPAN/step),c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
  const at=(dx,dy)=>g.drawImage(big,PADL/step+dx,PADL/step+dy,1152/step,1152/step);
  at(0,0);if(grow)for(let i=0;i<12;i++)at(Math.cos(i*Math.PI/6)*grow,Math.sin(i*Math.PI/6)*grow);
  g.globalCompositeOperation='source-in';g.fillStyle=colour;g.fillRect(0,0,n,n);return c;
 }
 function spiritLayers(side){
  return cached(`spirit:${side}`,()=>{
   const image=sheet('spirit');if(!image)return null;
   const big=document.createElement('canvas');big.width=big.height=1152;court.drawCourt(big,image,'king-spirit',side,0);
   // The ivory king glows white and gold. The charcoal king glows black, in the palette's warm blacks
   // (--night #221d18, --ink #2b2621, and the title's #120f0c): an aura widened out from his body, so it
   // darkens even dark wood round him, and a close rim; no pale part at all.
   if(!side)return {gold:tinted(big,2,'#ffe7a6'),rim:blurAlpha(tinted(big,2,'#fff2cf'),5),halo:blurAlpha(tinted(big,4,'#ffe2a0'),10)};
   // inner: a tight dense band round his outline, strongest on a dark square, where the wide halo hardly shows.
   return {gold:tinted(big,2,'#2b2621'),rim:blurAlpha(tinted(big,2,'#120f0c',4),5),halo:blurAlpha(tinted(big,4,'#120f0c',5),9),inner:blurAlpha(tinted(big,2,'#0c0a08',8),4)};
  });
 }
 // Turn frames have their own pivot and silhouette; derive their glow from that frame.
 const turnSpirit=new WeakMap();
 function spiritFor(s){
  if(!s.bodyBounds)return spiritLayers(s.side);
  const image=s.pose.bank.image;let sides=turnSpirit.get(image);if(!sides){sides=[];turnSpirit.set(image,sides);}
  if(!sides[s.side]){
   const dark=!!s.side;
   sides[s.side]={gold:tinted(image,8,dark?'#2b2621':'#ffe7a6'),rim:blurAlpha(tinted(image,8,dark?'#120f0c':'#fff2cf',dark?1:0),2),halo:blurAlpha(tinted(image,8,dark?'#120f0c':'#ffe2a0',dark?1:0),4),...(dark?{inner:blurAlpha(tinted(image,8,'#0c0a08',2),2)}:{})};
  }
  return sides[s.side];
 }
 // Soft rays fanning up from his crown, drawn once and blurred (no hard edges): board units ×4,
 // 80 × 44 units round the point they fan from (40, 42).
 let rayLayer=null,darkRays=null;
 // The charcoal king's rays: the same soft fan as the ivory king's, a little broader, in warm black.
 function raysDark(){
  if(darkRays)return darkRays;
  const k=4,c=document.createElement('canvas');c.width=80*k;c.height=44*k;const g=c.getContext('2d');
  const o={x:40*k,y:42*k},fill=g.createRadialGradient(o.x,o.y,2*k,o.x,o.y,36*k);fill.addColorStop(0,'rgba(18,15,12,1)');fill.addColorStop(.5,'rgba(18,15,12,.7)');fill.addColorStop(1,'rgba(18,15,12,0)');
  g.fillStyle=fill;g.beginPath();
  for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.25,w=.055+.025*rand(i,40),l=(27+9*rand(i,41))*k;g.moveTo(o.x,o.y);g.lineTo(o.x+Math.cos(a-w)*l,o.y+Math.sin(a-w)*l);g.lineTo(o.x+Math.cos(a+w)*l,o.y+Math.sin(a+w)*l);g.closePath();}
  g.fill();
  return darkRays=blurAlpha(c,5);
 }
 function rays(){
  if(rayLayer)return rayLayer;
  const k=4,c=document.createElement('canvas');c.width=80*k;c.height=44*k;const g=c.getContext('2d');
  const o={x:40*k,y:42*k},fill=g.createRadialGradient(o.x,o.y,3*k,o.x,o.y,38*k);fill.addColorStop(0,'rgba(255,246,206,1)');fill.addColorStop(.45,'rgba(255,236,170,.45)');fill.addColorStop(1,'rgba(255,236,170,0)');
  g.fillStyle=fill;g.beginPath();
  for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.25,w=.055+.03*rand(i,40),l=(27+9*rand(i,41))*k;g.moveTo(o.x,o.y);g.lineTo(o.x+Math.cos(a-w)*l,o.y+Math.sin(a-w)*l);g.lineTo(o.x+Math.cos(a+w)*l,o.y+Math.sin(a+w)*l);g.closePath();}
  g.fill();
  return rayLayer=blurAlpha(c,7);
 }
 // Clips to the dark squares round a king's square (dark) or to everything else; with no cell (the title),
 // dark draws everywhere and the other pass nothing.
 // Clips to what is dark under him (dark) or to everything else: the board's 32 dark squares and the dark
 // stone frame round them; the cream page outside the frame and the light squares are light. The pattern is
 // the board's own, wherever he stands, so nothing changes as he moves. With no board (the title), dark draws
 // everywhere and the other pass nothing.
 function clipSquares(ctx,board,dark){
  ctx.beginPath();
  if(!board){if(!dark)ctx.rect(0,0,0,0);else ctx.rect(-1e4,-1e4,2e4,2e4);ctx.clip();return;}
  const {x,y,tile,frame}=board,size=8*tile;
  if(!dark)ctx.rect(-1e4,-1e4,2e4,2e4);
  // The frame: the ring between the board and its outer edge (evenodd: the board's own area is cut out).
  if(frame){ctx.rect(x-frame,y-frame,size+2*frame,size+2*frame);ctx.rect(x,y,size,size);}
  for(let row=0;row<8;row++)for(let col=0;col<8;col++)if((col+row)%2===1)ctx.rect(x+col*tile,y+row*tile,tile,tile);
  ctx.clip('evenodd');
 }
 // A Spirit layer over the figure (padded layer → sprite px).
 function inSpirit(ctx,s,image){
  if(!s.bodyBounds){inFigure(ctx,s.pose,()=>ctx.drawImage(image,-PADL,-PADL,SPAN,SPAN));return;}
  const b=s.pose.bank,k=b.scale*s.bodyScale,w=b.image.naturalWidth||b.image.width,h=b.image.naturalHeight||b.image.height;
  ctx.save();ctx.translate(s.pose.foot.x,s.pose.foot.y);ctx.scale(k*(s.pose.sx??1),k*(s.pose.sy??1));ctx.rotate((s.pose.rotation??0)*s.pose.facing);ctx.translate(-b.pivot[0],-b.pivot[1]);ctx.drawImage(image,-PADL*w/1152,-PADL*h/1152,SPAN*w/1152,SPAN*h/1152);ctx.restore();
 }
 // Draws `image` (a layer) over the figure, with the scene's own figure transform (drawPiece).
 function inFigure(ctx,pose,draw){
  ctx.save();ctx.translate(pose.foot.x,pose.foot.y);ctx.scale(pose.scale*pose.facing*(pose.sx??1),pose.scale*(pose.sy??1));ctx.rotate(pose.rotation??0);
  ctx.translate(-court.ANCHOR.x,-court.ANCHOR.y);draw();ctx.restore();
 }

 // —— Flame ——
 function lava(ctx,s){
  const f=flameFor(s);if(!f)return;
  const [a,b]=lavaNoise(),u=frac(figureClock(s)/PERIOD.flame),g=f.work.getContext('2d');
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
  const draw=()=>{
   const w=s.bodyBounds?(s.pose.bank.image.naturalWidth||s.pose.bank.image.width):1152,h=s.bodyBounds?(s.pose.bank.image.naturalHeight||s.pose.bank.image.height):1152;
   ctx.globalAlpha=s.k*.9;ctx.drawImage(f.work,0,0,w,h);
   // Added light reads on the charcoal army; on the ivory it would turn the cream lime, so less there.
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=s.k*pulse*(s.side?.5:.18);ctx.drawImage(f.work,0,0,w,h);
   ctx.globalAlpha=s.k*pulse*(s.side?.55:.35);ctx.drawImage(f.glow,0,0,w,h);
  };
  if(s.bodyBounds){const b=s.pose.bank;ctx.save();ctx.translate(s.pose.foot.x,s.pose.foot.y);ctx.scale(b.scale*s.bodyScale,b.scale*s.bodyScale);ctx.translate(-b.pivot[0],-b.pivot[1]);draw();ctx.restore();}
  else inFigure(ctx,s.pose,draw);
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
  const top=s.pose.foot.y-170,u0=figureClock(s)/PERIOD.frost;
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<FLAKES;i++){
   const z=rand(i,3)*2-1;if((z>0)!==front)continue;
   const u=frac(u0+i/FLAKES+rand(i,1)*.05),start=top+rand(i,4)*50,floor=s.ground.y-5+z*11,y=start+(floor-start)*u;
   const x=s.ground.x+(rand(i,2)*2-1)*46*Math.min(1,(s.spread??1)*1.6)+Math.sin(TAU*(u*2+rand(i,5)))*5;
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
 // Ground paintings retain their brush texture; only their reveal and material light move.
 function groundPainting(url){
  const image=asset(url);if(!image)return null;
  return cached(`ground:${url}`,()=>{
   const make=()=>{const c=document.createElement('canvas');c.width=384;c.height=160;return c;};
   const base=make(),work=make(),light=make(),mask=make(),g=base.getContext('2d');
   g.drawImage(image,0,0,384,160);
   // Select the painted hot channels once. Moving light cannot wash over the stone faces.
    const pixels=g.getImageData(0,0,384,160);
    for(let i=0;i<pixels.data.length;i+=4){
     const [r,green,b]=pixels.data.slice(i,i+3);
     pixels.data[i+3]*=clamp((r-green-35)/75,0,1)*clamp((green-b-25)/65,0,1)*clamp((r-145)/70,0,1);
     pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;
    }
    mask.getContext('2d').putImageData(pixels,0,0);
   return {base,work,light,mask};
  });
 }
 function paintedGround(ctx,s,url){
  const art=groundPainting(url);if(!art)return;
  const p=frac(s.t/PERIOD[s.design]),grow=smooth(p/.32),close=smooth((p-.64)/.36),life=grow*(1-close);
  if(life<.002)return;
  const g=art.work.getContext('2d'),l=art.light.getContext('2d');g.clearRect(0,0,384,160);g.drawImage(art.base,0,0);
  l.clearRect(0,0,384,160);
  l.save();l.translate(p*96,p*32);l.fillStyle=lavaNoise()[0];l.fillRect(-p*96,-p*32,384,160);l.restore();
  l.globalCompositeOperation='destination-in';l.drawImage(art.mask,0,0);l.globalCompositeOperation='source-over';
  g.globalCompositeOperation='screen';g.globalAlpha=.38;g.drawImage(art.light,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  // The fixed painting emerges from the feet, instead of scaling separate geometric pieces.
  const radius=8+life*290,reveal=g.createRadialGradient(192,85,radius*.63,192,85,radius);
  reveal.addColorStop(0,'#000');reveal.addColorStop(1,'#0000');
  g.globalCompositeOperation='destination-in';g.fillStyle=reveal;g.fillRect(0,0,384,160);g.globalCompositeOperation='source-over';
  // Keep the rock painting registered at fixed proportions through the closing phase.
  const w=117,h=47;
  ctx.save();ctx.globalAlpha=s.k*s.g*Math.min(1,life*5);
  ctx.drawImage(art.work,s.ground.x-w/2,s.ground.y-h*.58,w,h);ctx.restore();
 }
 function cloudLayers(){
  const image=asset(CLOUD_BANK);if(!image)return null;
  return cached('stratus:billows',()=>({image,billows:CLOUD_BILLOWS.map(({crop:[x,y,w,h]})=>{
   const c=document.createElement('canvas');c.width=256;c.height=Math.round(256*image.height*h/(image.width*w));
   const g=c.getContext('2d');g.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,c.width,c.height);
   // Feather only the crop edges; the source painting keeps its filled, rounded cloud forms.
   g.globalCompositeOperation='destination-in';g.translate(c.width/2,c.height*.54);g.scale(c.width*.59,c.height*.65);
   const mask=g.createRadialGradient(0,0,.56,0,0,1);mask.addColorStop(0,'#000');mask.addColorStop(1,'#0000');
   g.fillStyle=mask;g.fillRect(-1,-1,2,2);return c;
  })}));
 }
 // Fixed-size painted core with independently rolling outer lobes, all below the figure.
 function clouds(ctx,s){
  const art=cloudLayers();if(!art)return;
  const {core,billows}=stratusCloudAt(s.t),fade=s.k*s.g;
  ctx.save();ctx.translate(s.ground.x,s.ground.y+5);
  for(let i=0;i<billows.length;i++){
   if(i===2){const h=core.w*art.image.height/art.image.width;ctx.globalAlpha=fade;ctx.drawImage(art.image,core.x-core.w/2,core.y-h,core.w,h);}
   const b=billows[i],image=art.billows[i];if(b.alpha<.002)continue;
   const h=b.w*image.height/image.width;
   ctx.save();ctx.globalAlpha=fade*b.alpha;ctx.translate(b.x,b.y-h/2);ctx.rotate(b.angle);
   ctx.drawImage(image,-b.w/2,-h/2,b.w,h);ctx.restore();
  }
  ctx.restore();
 }

 // The owner selected the painted branching fissures (Lava A).
 function lavaFloor(ctx,s){paintedGround(ctx,s,LAVA_GROUND);}

 // —— Mud ——
 // Original Mud: keep the release drawing and its eight-second timing.
 // A full patch of tufts round his feet (an inner and an outer ring), dark at the root, fresh at the tip.
 const TUFTS=52,ROOT=GRASS_ROOT,TIP=GRASS_TIP;
 // Each tuft, a little apart from the others: sprouts to full height, holds, and sinks back to a short
 // stubble (it never goes quite bare), then grows again from there; one period.
 const grow=u=>u<.24?.12+.88*smooth(u/.24):u<.66?1:1-.88*smooth((u-.66)/.34);
 // A tuft or vine `lag` behind the loop: nothing until its first start, then its own place in the loop.
 const after=(u0,lag)=>u0-lag<0?-1:frac(u0-lag);
 const grownAt=(u0,lag)=>{const u=after(u0,lag);return u<0?0:grow(u);};
 // Blade fills in blade space (root at 0, tip at -1), made once per canvas.
 const bladeFills=new WeakMap();
 function fills(ctx){
  let f=bladeFills.get(ctx);
  if(!f){f=[];for(const r of ROOT)for(const t of TIP){const g=ctx.createLinearGradient(0,0,0,-1);g.addColorStop(0,r);g.addColorStop(1,t);f.push(g);}bladeFills.set(ctx,f);}
  return f;
 }
 function originalGrass(ctx,s,front){
  const u0=Math.max(0,s.t)/MUD_CYCLE,f=fills(ctx),m=ctx.getTransform();
  for(let i=0;i<TUFTS;i++){
   const ringNo=i%3,angle=TAU*(i+.37*ringNo+rand(i,1)*.6)/TUFTS,depth=Math.sin(angle);if((depth>0)!==front)continue;
   const ring=[.32,.6,.86][ringNo]+.14*rand(i,2),bx=s.ground.x+Math.cos(angle)*50*ring,by=s.ground.y-4+depth*16*ring;
   const g=grownAt(u0,rand(i,4)*.14)*s.g*s.k;if(g<.02)continue;
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
 function originalEarth(ctx,s){
  const u0=Math.max(0,s.t)/MUD_CYCLE,k=s.k*s.g*(.55+.45*grownAt(u0,.06));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(66,44,20,.7)');g.addColorStop(.7,'rgba(66,44,20,.45)');g.addColorStop(1,'rgba(66,44,20,0)');
  ctx.save();ctx.globalAlpha=k;ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(56,18);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }
 // Vines: each rises out of the earth at one point, arches over and roots again at another, growing along its
 // length and then drawing back, with leaves opening along it. [x0, depth0, x1, depth1, height, phase, seed]
 // (board units from his floor point; depth + in front of him).
 const VINES=[[-46,-.3,-20,-.85,30,0,1],[18,-.9,46,-.25,27,.03,2],[-48,.25,-26,.85,24,.015,3],[22,.85,48,.3,25,.045,4],[-12,.98,12,.95,17,.06,5],[-30,-.98,6,-.95,22,.05,6]];
 // A vine grows out of the ground along its length once the grass is well up (the grass: grow() with up
 // to .14 of lag), holds, then draws back into the ground the way it came (its tip goes back down into the
 // first hole), and is gone while the grass still stands (by .72 with a vine's lag of at most .06; the grass
 // only starts to sink at .66 and goes down to a stubble). Returns its length 0..1.
 const vineGrow=u=>u<.26?0:u<.42?smooth((u-.26)/.16):u<.54?1:u<.66?1-smooth((u-.54)/.12):0;
 const N=26;
 // A vine's centre line: an arch between its two feet, leaning and kinked a little, so no two look alike.
 function vinePoint(v,f,s,sway){
  const [x0,d0,x1,d1,h,,seed]=v,x=x0+(x1-x0)*f,d=d0+(d1-d0)*f,lean=(rand(seed,7)-.5)*.5;
  const lift=Math.sin(Math.PI*f)**.75*h*(1+lean*(f-.5)),wob=Math.sin(TAU*f*1.5+seed)*2.2*Math.sin(Math.PI*f);
  return {x:s.ground.x+(x+wob+sway*Math.sin(Math.PI*f))*s.facing,y:s.ground.y-4+d*15-lift};
 }
 // An ivy-like leaf of length l along +x: two lobes, a point, a pale midrib.
 function leaf(ctx,l,colour){
  ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(0,0);
  ctx.bezierCurveTo(l*.15,-l*.55,l*.7,-l*.55,l,0);ctx.bezierCurveTo(l*.7,l*.55,l*.15,l*.55,0,0);ctx.fill();
  ctx.strokeStyle='rgba(43,38,33,.75)';ctx.lineWidth=.55;ctx.stroke();
  ctx.strokeStyle='rgba(214,206,160,.5)';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(.8,0);ctx.lineTo(l*.85,0);ctx.stroke();
 }
 function originalVines(ctx,s,front){
  const u0=Math.max(0,s.t)/MUD_CYCLE;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const v of VINES){
   const [, d0,, d1,, phase,seed]=v;if(((d0+d1)/2>0)!==front)continue;
   const vu=after(u0,phase),len=vu<0?0:vineGrow(vu),g=len*s.g*s.k;if(g<.02)continue;
   const n=Math.max(2,Math.round(N*g)),sway=Math.sin(TAU*(u0*2+seed*.17))*1.4,pts=[];
   for(let i=0;i<=n;i++)pts.push(vinePoint(v,i/N,s,sway));
   // Stem: thick at the root, and tapering to a fine shoot over the last few points before the tip.
   const width=i=>(1+2.2*(1-i/N))*(.22+.78*Math.min(1,(n-i)/7));
   for(const [colour,scale,dy] of [[VINE.outline,1.45,0],[VINE.body,1,0],[VINE.lit,.32,-.5]]){
    ctx.strokeStyle=colour;
    for(let i=1;i<pts.length;i++){ctx.lineWidth=width(i)*scale+(scale>1?.3:0);ctx.beginPath();ctx.moveTo(pts[i-1].x,pts[i-1].y+dy);ctx.lineTo(pts[i].x,pts[i].y+dy);ctx.stroke();}
   }
   // Leaves open just behind the growing tip, on alternate sides, each a little different.
   for(let i=3;i<pts.length-1;i+=4){
    const p=pts[i],q=pts[i+1],side=(i/4)%2?1:-1,a=Math.atan2(q.y-p.y,q.x-p.x)+side*(.8+.5*rand(seed,i)),open=Math.min(1,(pts.length-1-i)/2);if(open<.05)continue;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.scale(open,open);leaf(ctx,3.4+1.6*rand(seed,i+20),LEAF[(seed+i)%3]);ctx.restore();
   }
   // The shoot's tip while it grows or draws back: a curled green tendril and a bud of two small leaves.
   if(g<.98){
    const t=pts.at(-1),b=pts.at(-2),a=Math.atan2(t.y-b.y,t.x-b.x);
    ctx.strokeStyle=LEAF[0];ctx.lineWidth=.9;ctx.beginPath();for(let k=0;k<=12;k++){const r=3.4*(1-k/14),th=a+k*.55*side0(seed);const x=t.x+Math.cos(th)*r-Math.cos(a)*3.4,y=t.y+Math.sin(th)*r-Math.sin(a)*3.4;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    for(const side of [-1,1]){ctx.save();ctx.translate(t.x,t.y);ctx.rotate(a+side*.55);leaf(ctx,3.2,LEAF[1]);ctx.restore();}
   }
   // The earth each end comes out of.
   ctx.fillStyle='rgba(58,38,18,.85)';for(const e of [pts[0],...(g>.97?[vinePoint(v,1,s,sway)]:[])]){ctx.beginPath();ctx.ellipse(e.x,e.y+.6,4.2,1.7,0,0,TAU);ctx.fill();}
  }
  ctx.restore();
 }
 const side0=seed=>seed%2?1:-1;

 // Painted clumps stay at their soil roots as each one grows and folds back to a low bed.
 function grass(ctx,s,front){
  const art=asset(MUD_PLANTS);if(!art)return;
  const u=Math.max(0,s.t)/MUD_CYCLE,fade=s.g*s.k,cell=art.naturalWidth/3;if(fade<.002)return;
  ctx.save();ctx.globalAlpha=fade;
  for(const [x,d,w,h,variant,lag,peak]of MUD_TUFTS){
   if((d>0)!==front)continue;
   const life=mudTuftLife(u,lag,peak)*s.g;if(life<.02)continue;
   ctx.save();ctx.translate(s.ground.x+x*s.facing,s.ground.y-4+d*15);
   ctx.transform(s.facing,0,Math.sin(TAU*(u+lag))*life*.07,1,0,0);
   ctx.drawImage(art,variant*cell,0,cell,cell,-w*.5,-h*life,w,h*life*1.12);ctx.restore();
  }
  ctx.restore();
 }
 function earth(ctx,s){
  const k=s.k*s.g;if(k<.002)return;
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(66,49,28,.32)');g.addColorStop(.65,'rgba(66,49,28,.21)');g.addColorStop(1,'rgba(66,49,28,0)');
  ctx.save();ctx.globalAlpha=k;ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(56,17);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }
 // The vine's painted leaves unfold along +x from the petiole, after the shoot has passed them.
 function mudLeaf(ctx,art,l,variant){
  const cell=art.naturalWidth/3;ctx.save();ctx.rotate(Math.PI/2);ctx.drawImage(art,variant*cell,cell,cell,cell,-l*.5,-l*.9,l,l);ctx.restore();
 }
 function vines(ctx,s,front){
  const art=asset(MUD_PLANTS);if(!art)return;
  const u=Math.max(0,s.t)/MUD_CYCLE,fade=s.g*s.k;if(fade<.002)return;
  const N=56;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=fade;
  for(const v of MUD_VINES){
   if(v.front!==front)continue;
   const len=mudVineLife(u,v)*s.g;if(len<.008)continue;
   const sway=Math.sin(TAU*(u*2+v.seed*.17))*.8;
   const point=f=>{const p=mudVinePoint(v,f);return{x:s.ground.x+(p.x+sway*Math.sin(Math.PI*f))*s.facing,y:s.ground.y-4+p.y};};
   const n=Math.ceil(N*len),pts=Array.from({length:n+1},(_,i)=>point(Math.min(len,i/N)));
   // A soft earth-brown core, a broken lit edge and small bark marks avoid an ink-outlined arch.
   for(let i=1;i<pts.length;i++){
    const p=pts[i-1],q=pts[i],f=i/N,width=(2.4-1.35*f)*(.2+.8*Math.min(1,(len-f+.07)/.1));
    ctx.strokeStyle=VINE.body;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
    ctx.strokeStyle=i%4===0?VINE.outline:VINE.lit;ctx.globalAlpha=fade*(i%4===0?.24:.48);ctx.lineWidth=width*.29;
    ctx.beginPath();ctx.moveTo(p.x-.25,p.y-.3);ctx.lineTo(q.x-.25,q.y-.3);ctx.stroke();ctx.globalAlpha=fade;
   }
   for(let i=6;i<N-4;i+=8){
    const f=i/N,open=smooth((len-f)/.13);if(open<.015)continue;
    const p=point(f),q=point(f+.01),side=(Math.floor(i/8)+v.seed)%2?1:-1;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(q.y-p.y,q.x-p.x)+side*(.72+.4*rand(v.seed,i)));
    ctx.scale(open,.15+.85*open);mudLeaf(ctx,art,5.4+1.8*rand(v.seed,i+20),(i+v.seed)%3);ctx.restore();
   }
   if(len<.98){
    const t=pts.at(-1),b=pts.at(-2),a=Math.atan2(t.y-b.y,t.x-b.x);
    ctx.strokeStyle=VINE.body;ctx.lineWidth=.65;ctx.beginPath();
    for(let i=0;i<=9;i++){const r=2.3*(1-i/11),th=a+i*.55*(v.seed%2?1:-1),x=t.x+Math.cos(th)*r-Math.cos(a)*2.3,y=t.y+Math.sin(th)*r-Math.sin(a)*2.3;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
   }
   ctx.fillStyle='rgba(58,41,24,.52)';
   for(const f of [0,...(len>.98?[1]:[])]){const p=point(f);ctx.beginPath();ctx.ellipse(p.x,p.y+.7,2.7,1.1,0,0,TAU);ctx.fill();}
  }
  ctx.restore();
 }

 // Only one growth cycle draws. The boundary fade lets its stubble and soil settle before the handoff.
 function mud(ctx,s,front){
  const cycle=mudCycle(s.t),state={...s,t:cycle.t,k:s.k*cycle.fade};
  if(cycle.painted){if(!front)earth(ctx,state);grass(ctx,state,front);vines(ctx,state,front);}
  else{if(!front)originalEarth(ctx,state);originalGrass(ctx,state,front);originalVines(ctx,state,front);}
 }

 // —— Spirit ——
 // A slow breath from dim to a white-gold peak (no flicker: one smooth cosine).
 const breath=t=>(1-Math.cos(TAU*t/PERIOD.spirit))/2;
 function holyBack(ctx,s){
  // His crown, following the figure's lean (a strike tilts him about his feet): the figure is drawn
  // scale(facing) then rotate(rotation), so on screen he turns by rotation × facing (measured: the fan's
  // anchor stays on the drawn crown through the capture, both armies; tools: drawImage transforms).
  // His glow goes with his figure: it breathes on the clock that never restarts and stays on him through a
  // move. Only the light (or shadow) pooled on his square fades as he leaves it and grows back where he arrives.
  const tt=figureClock(s),b=breath(tt),sp=spiritFor(s),r=s.pose.rotation??0,lean=r*s.pose.facing;
  const head={x:s.pose.foot.x+118*(s.pose.sx??1)*Math.sin(lean),y:s.pose.foot.y-118*(s.pose.sy??1)*Math.cos(r)},turn=.05*Math.sin(TAU*tt/PERIOD.spirit)+lean; // (one sway a breath, so a recorded breath loops)
  ctx.save();
  if(s.side===1){
   // The charcoal king: black only, drawn over the board (no added light). Never fully gone at the dim point.
   const pool=ctx.createRadialGradient(0,0,0,0,0,1);pool.addColorStop(0,'rgba(18,15,12,.9)');pool.addColorStop(.6,'rgba(34,29,24,.55)');pool.addColorStop(1,'rgba(34,29,24,0)');
   ctx.save();ctx.globalAlpha=s.k*s.g*(.3+.7*b);ctx.translate(s.ground.x,s.ground.y-3);ctx.scale(52,18);ctx.fillStyle=pool;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
   // It breathes as the ivory glow does, from faint to deep; the halo reaches about as far as the ivory one.
   ctx.save();ctx.globalAlpha=s.k*(.35+.65*b);ctx.translate(head.x,head.y);ctx.rotate(turn);ctx.drawImage(raysDark(),-40,-42,80,44);ctx.restore();
   // The aura: where what is drawn under it is dark (dark squares, the stone frame) the black needs more
   // strength than over light stone or the cream page, so each layer is drawn twice, clipped to each (his head
   // and shoulders stand over the next rank's square, or over the frame and the page on the back rank).
   if(sp)for(const dark of [true,false]){
    ctx.save();clipSquares(ctx,s.board,dark);const k=s.k;
    ctx.globalAlpha=k*(dark?.4+.6*b:.2+.4*b);inSpirit(ctx,s,sp.halo);
    ctx.globalAlpha=k*(dark?.45+.55*b:.25+.4*b);inSpirit(ctx,s,sp.rim);
    ctx.globalAlpha=k*(dark?.25+.75*b:.06+.2*b);inSpirit(ctx,s,sp.inner);
    ctx.restore();
   }
   ctx.restore();return;
  }
  ctx.globalCompositeOperation='lighter';
  // Light pooled on his square.
  const pool=ctx.createRadialGradient(0,0,0,0,0,1);pool.addColorStop(0,'rgba(255,238,178,.85)');pool.addColorStop(.55,'rgba(255,232,160,.4)');pool.addColorStop(1,'rgba(255,232,160,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.28+.55*b);ctx.translate(s.ground.x,s.ground.y-3);ctx.scale(48,16);ctx.fillStyle=pool;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
  // Short soft rays behind his crown, in a narrow fan that turns a little (about 36 units: not over the next square).
  ctx.save();ctx.globalAlpha=s.k*(.18+.55*b);ctx.translate(head.x,head.y);ctx.rotate(turn);ctx.drawImage(rays(),-40,-42,80,44);ctx.restore();
  // The glow round his outline: the wide halo, and the close rim brightening towards the peak.
  if(sp){ctx.globalAlpha=s.k*(.4+.5*b);inSpirit(ctx,s,sp.halo);ctx.globalAlpha=s.k*(.3+.7*b);inSpirit(ctx,s,sp.rim);}
  ctx.restore();
 }
 function holyFront(ctx,s){
  const sp=spiritFor(s);if(!sp)return;
  // A sheen on the figure: gold for the ivory king; for the charcoal king a light shade (multiplied), so he
  // looks wrapped in darkness but keeps his own modelling.
  ctx.save();ctx.globalCompositeOperation=s.side?'multiply':'lighter';ctx.globalAlpha=s.k*(s.side?.03+.07*breath(figureClock(s)):.05+.25*breath(figureClock(s)));inSpirit(ctx,s,sp.gold);ctx.restore();
 }

 // —— Shadow ——
 // FILM frames carry the painted hand through its poses; the wrist stays in its floor crevice.
 function handsNow(s){
  const sp=s.spread??1;
  return shadowHandsAt(s.t,PERIOD.shadow).map(h=>{
   const x=s.ground.x+h.x*s.facing*sp,y=s.ground.y-4+h.depth*13,k=h.size*(.92+.08*h.depth);
   return {...h,x,y,k,r:h.rise*s.g*s.k,open:h.open*s.g*s.k,front:h.depth>0,w:12*k,
    hand:{side:s.side,frame:h.frame,size:k,flip:h.x*s.facing<0,angle:h.lean*s.facing*Math.min(1,sp*1.6),alpha:s.g*s.k}};
  }).filter(h=>h.open>.01);
 }
 // Cracks are drawn with the floor (before the figure), so none is ever drawn over him.
 function cracks(ctx,s){for(const h of handsNow(s)){
  const shade=ctx.createRadialGradient(h.x,h.y,1,h.x,h.y,20*h.k);
  shade.addColorStop(0,'rgba(7,5,10,.62)');shade.addColorStop(1,'rgba(7,5,10,0)');
  ctx.save();ctx.globalAlpha=h.open;ctx.fillStyle=shade;ctx.beginPath();ctx.ellipse(h.x,h.y,20*h.k,6*h.k,0,0,TAU);ctx.fill();ctx.restore();
  drawCrack(ctx,h.x,h.y,h.w,h.open*3.2*h.k,h.i+1,{branches:2});
 }}
 function hands(ctx,s,front){
  const bank=asset(HAND_BANK);if(!bank)return;
  for(const h of handsNow(s)){
   if(h.front!==front||h.r<.01)continue;
   const lip=crackLip(h.x,h.y,h.w,h.open*3.2*h.k,h.i+1);
   drawPaintedShadowHand(ctx,bank,h.x,h.y,{...h.hand,rise:h.r,lip});
  }
 }
 function abyss(ctx,s){
  const up=Math.max(0,...shadowHandsAt(s.t,PERIOD.shadow).map(h=>h.rise));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(6,4,10,.6)');g.addColorStop(.65,'rgba(10,6,16,.32)');g.addColorStop(1,'rgba(10,6,16,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.35+.4*up);ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(49,15);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
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
  const g=l.work.getContext('2d'),motion=s.k/(s.opacity||1),u0=figureClock(s)/PERIOD.shadow;
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
  has(design){if(design==='mud')asset(MUD_PLANTS);if(design==='flame')asset(LAVA_GROUND);if(design==='stratus')asset(CLOUD_BANK);if(design==='flame')flameLayers(0);if(design==='shadow'){shadowLayers(0);asset(HAND_BANK);}return design in PERIOD;},
  /** The pose the figure is drawn with (Stratus floats; Shadow is drawn without his painted smoke, which moves). */
  pose(s){
   if(s.design==='shadow'){const l=shadowLayers(s.side);return l?{...s.pose,sheet:l.body}:s.pose;}
   // The charcoal Spirit: his black aura takes the place of the army's pale readability rim.
   if(s.design==='spirit'&&s.side===1)return {...s.pose,rim:1-.85*s.k};
   // lit: this figure lights its own floor, 0–1 (the scene fades his contact shadow by it): the ivory Spirit.
   if(s.design==='spirit')return {...s.pose,lit:.65*s.k};
   if(s.design!=='stratus')return s.pose;
   const p=s.pose,lift=hoverAt(figureClock(s),s.k),ground=p.ground??p.foot;
   return {...p,ground,foot:{x:p.foot.x,y:p.foot.y-lift},lift:(p.lift??0)+lift,shadow:(p.shadow??1)*(1-.045*lift)};
  },
  /**
   * s: {design, side, pose (the figure as drawn), ground (floor point under the feet), facing, t (ms),
   *  k (0..1 the whole effect: his opacity, and it fades as he falls), opacity (his opacity alone),
   *  g (0..1 effects on his square, they leave while he moves), spread (optional: how far Shadow's hands
   *  reach round his feet, 1 on the board)}.
   */
  back(ctx,s){
   if(s.design==='flame')lavaFloor(ctx,s);
   else if(s.design==='frost')flakes(ctx,s,false);
   else if(s.design==='stratus')clouds(ctx,s);
   else if(s.design==='mud')mud(ctx,s,false);
   else if(s.design==='spirit')holyBack(ctx,s);
   else if(s.design==='shadow'){abyss(ctx,s);cracks(ctx,s);hands(ctx,s,false);if(!s.bodyBounds)smoke(ctx,s);}
  },
  front(ctx,s){
   if(s.design==='flame')lava(ctx,s);
   else if(s.design==='frost')flakes(ctx,s,true);
   else if(s.design==='mud')mud(ctx,s,true);
   else if(s.design==='spirit')holyFront(ctx,s);
   else if(s.design==='shadow')hands(ctx,s,true);
  },
 };
}
