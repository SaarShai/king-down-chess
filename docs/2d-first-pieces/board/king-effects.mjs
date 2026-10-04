// The six kings' idle effects on the painted board (opt-in: scene.setLively({kings:true})).
//   flame   lava light flows through the cracks and seams of his armour (king-flame/lava-mask.webp, cut from the art)
//   frost   ice flakes drift down around and in front of him and fade out on his square's floor
//   stratus he hovers a few board units up and down; his shadow shrinks as he rises
//   mud     grass sprouts from the earth around his feet, sways, and sinks back
//   spirit  a soft holy light behind him and on his square brightens and dims
//   shadow  black skeletal hands reach up out of his square around his feet, clutch, and sink back
// The scene draws back() before a king's figure and front() after it, so a figure standing in front
// (a lower row) still covers both. Every effect repeats exactly after PERIOD[design] ms, so one
// period recorded loops without a seam. Units are board units (the board is 960 wide).
import {clamp} from '../painted-mesh.mjs';
import * as court from '../court-motion.mjs';

export const PERIOD={flame:4800,frost:6000,stratus:4000,mud:8000,spirit:4000,shadow:6400};
export const KING_EFFECTS=Object.keys(PERIOD);
const LAVA_MASK=new URL('../king-flame/lava-mask.webp',import.meta.url).href;
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
 const cache=new Map();
 let lavaMask=null,lavaLoading=false;
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
  if(!lavaMask){
   if(!lavaLoading){lavaLoading=true;const image=new Image();image.onload=()=>{lavaMask=image;cache.clear();onLoad();};image.src=LAVA_MASK;}
   return null;
  }
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
   const halo=layer(),h=halo.getContext('2d');h.drawImage(soften(gold,10),0,0);h.globalCompositeOperation='lighter';h.drawImage(soften(gold,4),0,0);
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
 // Tufts of blades round his feet: dark at the root, fresh green at the tip.
 const TUFTS=13,ROOT=['#2f4a17','#36531a','#3c5c1d'],TIP=['#8cc04a','#a2cc58','#b5d66a'];
 // 0 → 1 (sprout) → hold → 0 (sink back) over one period, each tuft a little apart.
 const grow=u=>u<.28?smooth(u/.28):u<.6?1:u<.86?1-smooth((u-.6)/.26):0;
 function grass(ctx,s,front){
  const u0=s.t/PERIOD.mud;
  for(let i=0;i<TUFTS;i++){
   const angle=TAU*(i+.15+rand(i,1)*.5)/TUFTS,depth=Math.sin(angle);if((depth>0)!==front)continue;
   const ring=.7+.3*rand(i,2),bx=s.ground.x+Math.cos(angle)*45*ring,by=s.ground.y-4+depth*14*ring;
   const g=grow(frac(u0-rand(i,4)*.14))*s.g*s.k;if(g<.02)continue;
   const out=Math.cos(angle)>0?1:-1,blades=3+Math.floor(rand(i,3)*3);
   for(let j=0;j<blades;j++){
    const f=blades>1?j/(blades-1)-.5:0,h=(9+12*rand(i,10+j))*(1-.35*Math.abs(f))*g;if(h<.6)continue;
    const x=bx+f*4,y=by+rand(i,20+j)*1.5,w=1.1+.7*rand(i,30+j);
    const tip=x+(f*9+out*2.5)*g+Math.sin(TAU*(u0*2+rand(i,5)+j*.13))*1.8,bend=f*4*g;
    const fill=ctx.createLinearGradient(x,y,tip,y-h);fill.addColorStop(0,ROOT[j%3]);fill.addColorStop(1,TIP[(i+j)%3]);
    ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w*.3+bend,y-h*.6,tip,y-h);ctx.quadraticCurveTo(x+w*.3+bend,y-h*.6,x+w,y);ctx.closePath();ctx.fill();
   }
  }
 }
 function earth(ctx,s){
  const u0=s.t/PERIOD.mud,k=s.k*s.g*(.55+.45*grow(frac(u0-.06)));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(66,44,20,.7)');g.addColorStop(.7,'rgba(66,44,20,.45)');g.addColorStop(1,'rgba(66,44,20,0)');
  ctx.save();ctx.globalAlpha=k;ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(54,17);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }

 // —— Spirit ——
 const breath=t=>(1-Math.cos(TAU*t/PERIOD.spirit))/2;
 function holyBack(ctx,s){
  const b=breath(s.t),sp=spiritLayers(s.side);
  ctx.save();ctx.globalCompositeOperation='lighter';
  // Light pooled on the square.
  const pool=ctx.createRadialGradient(0,0,0,0,0,1);pool.addColorStop(0,'rgba(255,236,170,.75)');pool.addColorStop(1,'rgba(255,236,170,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.18+.32*b);ctx.translate(s.ground.x,s.ground.y-3);ctx.scale(54,17);ctx.fillStyle=pool;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
  // A soft glow around the figure's own outline.
  if(sp)inFigure(ctx,s.pose,()=>{ctx.globalAlpha=s.k*(.3+.55*b);ctx.drawImage(sp.halo,0,0,1152,1152);});
  ctx.restore();
 }
 function holyFront(ctx,s){
  const sp=spiritLayers(s.side);if(!sp)return;
  inFigure(ctx,s.pose,()=>{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=s.k*(.05+.13*breath(s.t))*(s.side?1.6:1);ctx.drawImage(sp.gold,0,0,1152,1152);});
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
 function stroke(ctx,lines,colour,scale,dx=0,dy=0){
  ctx.strokeStyle=colour;
  for(const width of [...new Set(lines.map(l=>l[2]))]){
   ctx.lineWidth=width*scale;ctx.beginPath();
   for(const [p,q,w] of lines)if(w===width){ctx.moveTo(p[0]+dx,p[1]+dy);ctx.lineTo(q[0]+dx,q[1]+dy);}
   ctx.stroke();
  }
 }
 function hands(ctx,s,front){
  const u0=s.t/PERIOD.shadow;
  for(const [hx,depth,lean,size,phase] of HANDS){
   if((depth>0)!==front)continue;
   const u=frac(u0-phase),r=rise(u)*s.g*s.k;if(r<.01)continue;
   const x=s.ground.x+hx*s.facing,y=s.ground.y-4+depth*13,k=size*(.92+.08*depth),c=clutch(u),sway=.05*Math.sin(TAU*(u0*2+phase));
   // The hole it comes out of.
   ctx.save();ctx.globalAlpha=Math.min(1,r*2)*.85;ctx.fillStyle='#07060a';ctx.beginPath();ctx.ellipse(x,y,9*k,3*k,0,0,TAU);ctx.fill();ctx.restore();
   ctx.save();ctx.beginPath();ctx.rect(x-34,y-60,68,60);ctx.clip();
   ctx.translate(x,y+(1-r)*34*k);ctx.rotate((lean+sway)*s.facing*(r*.6+.4));ctx.scale(k*(hx*s.facing<0?-1:1),k);ctx.lineCap='round';ctx.lineJoin='round';
   const lines=bones(c);
   ctx.fillStyle='rgba(11,9,16,.55)';ctx.beginPath();PALM.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();
   stroke(ctx,lines,'#0b0910',1);
   ctx.fillStyle='#0b0910';for(const [p] of lines.slice(2)){ctx.beginPath();ctx.arc(p[0],p[1],1.15,0,TAU);ctx.fill();}
   stroke(ctx,lines,'rgba(176,170,180,.8)',.3,-.55,-.25);
   ctx.restore();
  }
 }
 function abyss(ctx,s){
  const u0=s.t/PERIOD.shadow;let up=0;for(const h of HANDS)up=Math.max(up,rise(frac(u0-h[4])));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(6,4,10,.7)');g.addColorStop(.65,'rgba(10,6,16,.4)');g.addColorStop(1,'rgba(10,6,16,0)');
  ctx.save();ctx.globalAlpha=s.k*s.g*(.5+.5*up);ctx.translate(s.ground.x,s.ground.y-4);ctx.scale(54,17);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
 }

 return {
  /** Whether a design has an effect; starts loading that effect's own art. */
  has(design){if(design==='flame')flameLayers(0);return design in PERIOD;},
  /** The pose the figure is drawn with (Stratus floats); s: {design, pose, t, k}. */
  pose(s){
   if(s.design!=='stratus')return s.pose;
   const p=s.pose,lift=hoverAt(s.t,s.k),ground=p.ground??p.foot;
   return {...p,ground,foot:{x:p.foot.x,y:p.foot.y-lift},lift:(p.lift??0)+lift,shadow:(p.shadow??1)*(1-.045*lift)};
  },
  /**
   * s: {design, side, pose (the figure as drawn), ground (floor point under the feet), facing, t (ms),
   *  k (0..1 the whole effect, it fades as he falls), g (0..1 effects on his square, they leave while he moves)}.
   */
  back(ctx,s){
   if(s.design==='frost'){rime(ctx,s);flakes(ctx,s,false);}
   else if(s.design==='stratus')downdraft(ctx,s);
   else if(s.design==='mud'){earth(ctx,s);grass(ctx,s,false);}
   else if(s.design==='spirit')holyBack(ctx,s);
   else if(s.design==='shadow'){abyss(ctx,s);hands(ctx,s,false);}
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
