// The title screen's six kings with their resting effects (king-effects.mjs), live.
// The title shows each king as an <img data-king="<design>"> (the ivory half of his sheet, cut to its
// painted area: docs/visual-design/make-ui-art.py). Once an image has risen into place, a canvas over it
// draws the same figure from the king's sheet, with his effect fading in, and the image is hidden; so the
// layout never changes and the title's first paint never waits. stop() puts the images back.
// The images' CSS filter is kept: brightness on the canvas, and the drop shadows (the rim, then the cast shadow)
// drawn under the figure in their CSS order.
import * as court from '../court-motion.mjs';
import {createKingEffects} from './king-effects.mjs';
import {KING_FILES} from './king-sheets.mjs';

const SCALE=court.figures.king.scale,A=court.ANCHOR;
// The canvas round each king, in board units from his feet (the effects reach about this far).
const REACH={left:66,right:66,up:190,down:24};
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

/** The painted area of the ivory half of a sheet, as make-ui-art.py cuts it: [x0, y0, x1, y1]. */
function ivoryBox(image){
 const w=image.naturalWidth,h=image.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
 // The split: the empty column nearest the middle, in the middle third.
 const mid3=g.getImageData(Math.floor(w/3),0,Math.floor(w/3),h).data,mw=Math.floor(w/3);
 let mid=Math.floor(w/2),best=Infinity;
 for(let x=0;x<mw;x++){let empty=true;for(let y=0;y<h&&empty;y++)if(mid3[(y*mw+x)*4+3])empty=false;if(empty&&Math.abs(x+mw-w/2)<best){best=Math.abs(x+mw-w/2);mid=x+mw;}}
 const data=g.getImageData(0,0,mid,h).data;let x0=mid,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<mid;x++)if(data[(y*mid+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return [x0,y0,x1+1,y1+1];
}
/** A computed CSS filter, split into the brightness (for the canvas) and the drop shadows in their order (drawn). */
export function filterOf(css){
 const b=/brightness\(([\d.]+)\)/.exec(css);
 const shadows=[...css.matchAll(/drop-shadow\((rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\)/g)].map(d=>({color:d[1],x:+d[2],y:+d[3],blur:+d[4]}));
 return {brightness:b?+b[1]:1,shadows};
}

/**
 * Starts the effects over root's king images. options.enabled(): checked before starting (Animations;
 * reduced motion is checked here). Returns {stop(), frames, running, started, draw(t)} (frames: drawn so far,
 * started: kings showing their effect, for checks).
 */
export function startTitleKings(root,{enabled=()=>true}={}){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const sheets={},fx=createKingEffects({sheet:design=>sheets[design]??null,onLoad:()=>{}});
 const kings=[...root.querySelectorAll('img[data-king]')].map(img=>({img,design:img.dataset.king,mirror:/scaleX\(-1\)|matrix\(-1/.test(getComputedStyle(img).transform)}));
 const sprites=new Map();
 let running=true,timer=0,frame=0,frames=0,started=0;
 // draw(t): every started king at time t now (for recordings with their own clock).
 const state={stop,get frames(){return frames;},get running(){return running;},get started(){return started;},get kings(){return kings;},draw(t){for(const k of kings)if(k.canvas&&k.since!=null)draw(k,t);}};
 if(!enabled()||motion.matches||!kings.length){running=false;return state;}
 const sprite=(design,image)=>{
  let c=sprites.get(image);
  if(!c){c=document.createElement('canvas');c.width=c.height=1152;court.drawCourt(c,image,`king-${design}`,0,0);sprites.set(image,c);}
  return c;
 };
 // Where each figure stands, in the image's own layout box (transforms and the rise animation aside).
 function place(k){
  const {img,design}=k,spec=court.kings[design],[ox,oy]=spec.origins[0],fit=spec.fit??1,[x0,y0,,y1]=k.box;
  // No room for the image (a phone held in landscape): an empty canvas, which draw() skips, until there is.
  if(!img.offsetHeight){k.canvas.width=k.canvas.height=0;return;}
  const s=img.offsetHeight/(y1-y0),u=s/(fit*SCALE),dpr=Math.min(2,devicePixelRatio||1);
  const fx=k.mirror?img.offsetLeft+img.offsetWidth+x0*s+s*(ox-A.x):img.offsetLeft-x0*s-s*(ox-A.x),fy=img.offsetTop-y0*s-s*(oy-A.y);
  const foot={x:fx/u,y:fy/u};
  // Board units round his feet, widened to hold the whole image.
  const bx0=Math.min(foot.x-REACH.left,img.offsetLeft/u),bx1=Math.max(foot.x+REACH.right,(img.offsetLeft+img.offsetWidth)/u);
  const by0=Math.min(foot.y-REACH.up,img.offsetTop/u),by1=Math.max(foot.y+REACH.down,(img.offsetTop+img.offsetHeight)/u);
  Object.assign(k,{u,dpr,foot,bx0,by0});
  // The room to the nearest neighbour's figure (the near edge of his image, from the fixed layout; CSS px →
  // this king's board units): Shadow's hands reach about 41 × spread + 14 units, so they stop short of it.
  const i=kings.indexOf(k),fx0=foot.x*u,near=[kings[i-1],kings[i+1]].filter(Boolean).map(n=>(n===kings[i-1]?fx0-(n.img.offsetLeft+n.img.offsetWidth):n.img.offsetLeft-fx0)/u);
  if(near.length)k.spread=Math.max(.15,Math.min(.6,(Math.min(...near)-18)/41));
  const c=k.canvas;
  c.style.left=`${bx0*u}px`;c.style.top=`${by0*u}px`;c.style.width=`${(bx1-bx0)*u}px`;c.style.height=`${(by1-by0)*u}px`;
  // A canvas is cleared when its size is set, so set it only when it changes, and draw him again at once.
  const w=Math.ceil((bx1-bx0)*u*dpr),h=Math.ceil((by1-by0)*u*dpr);
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;if(k.shown)draw(k,performance.now());}
 }
 function draw(k,t){
  const {canvas:c,u,dpr,design}=k,g=c.getContext('2d'),image=sheets[design];
  if(!c.width||!c.height)return; // (drawing a 0 × 0 layer would throw)
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);
  g.setTransform(dpr*u,0,0,dpr*u,-k.bx0*dpr*u,-k.by0*dpr*u);
  const kk=ease((t-k.since)/900),facing=k.mirror?-1:1;
  // The loop starts when his effect does (Mud's grass before his vines); spread keeps Shadow's hands and
  // Frost's flakes in the room between him and his neighbours.
  const s={design,side:0,pose:{foot:k.foot,scale:SCALE,facing,angle:0},t:t-k.since+k.offset,k:kk,opacity:1,g:1,facing,spread:k.spread??.5};
  s.pose=fx.pose(s);s.ground=s.pose.ground??s.pose.foot;
  k.lift=(s.pose.foot.y-k.foot.y)*u; // CSS px his figure is drawn above its image (Stratus hovers)
  // The effects are drawn on a layer of their own with the neighbouring kings' figures cut out of it, so an
  // effect never covers a neighbour (his own figure keeps its overlap, as the images have).
  const layer=effects(k),l=layer.getContext('2d');
  const put=()=>{cutNeighbours(k,l);g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(layer,0,0);g.restore();};
  l.setTransform(1,0,0,1,0,0);l.clearRect(0,0,layer.width,layer.height);l.setTransform(g.getTransform());fx.back(l,s);put();
  // The figure, with one pass for each drop shadow, as CSS draws them: each shadow falls from the figure and the
  // shadows before it. The passes before the last draw on the effect layer (free until the front effects) and,
  // from a third shadow on, a second scratch layer.
  const shadows=k.filter.shadows.length?k.filter.shadows:[null];let src=null;
  shadows.forEach((d,i)=>{
   const to=i===shadows.length-1?g:i%2?scratch(k):l;
   to.save();
   if(to!==g){to.setTransform(1,0,0,1,0,0);to.clearRect(0,0,c.width,c.height);}
   if(d){to.shadowColor=d.color;to.shadowOffsetX=d.x*dpr;to.shadowOffsetY=d.y*dpr;to.shadowBlur=d.blur*dpr;}
   if(src){to.setTransform(1,0,0,1,0,0);to.drawImage(src,0,0);}
   else{to.setTransform(g.getTransform());to.translate(s.pose.foot.x,s.pose.foot.y);to.scale(SCALE*facing*(s.pose.sx??1),SCALE*(s.pose.sy??1));to.drawImage(sprite(design,s.pose.sheet??image),-A.x,-A.y);}
   to.restore();src=to.canvas;
  });
  l.setTransform(1,0,0,1,0,0);l.clearRect(0,0,layer.width,layer.height);l.setTransform(g.getTransform());fx.front(l,s);put();
 }
 // A second scratch layer the size of a king's canvas (a third drop shadow needs it).
 function scratch(k){
  const c=k.canvas,a=k.scratch??=document.createElement('canvas');
  if(a.width!==c.width||a.height!==c.height){a.width=c.width;a.height=c.height;}
  return a.getContext('2d');
 }
 // A king's effect layer, the size of his canvas.
 function effects(k){
  const c=k.canvas;let l=k.layer;
  if(!l){l=k.layer=document.createElement('canvas');}
  if(l.width!==c.width||l.height!==c.height){l.width=c.width;l.height=c.height;}
  return l;
 }
 // Cuts the neighbouring kings' figures (their images, where they stand) out of a king's effect layer.
 function cutNeighbours(k,l){
  const i=kings.indexOf(k);
  l.save();l.setTransform(k.dpr,0,0,k.dpr,-k.bx0*k.u*k.dpr,-k.by0*k.u*k.dpr);l.globalCompositeOperation='destination-out';
  for(const n of [kings[i-1],kings[i+1]]){
   // (An image that failed to load has nothing to cut, and drawing it would throw.)
   if(!n||!n.img.complete||!n.img.naturalWidth)continue;const im=n.img,x=im.offsetLeft,y=im.offsetTop,w=im.offsetWidth,h=im.offsetHeight;
   // (Where he is drawn now: Stratus hovers above his image.)
   const dy=n.lift??0;
   if(n.mirror){l.save();l.translate(x+w,y+dy);l.scale(-1,1);l.drawImage(im,0,0,w,h);l.restore();}else l.drawImage(im,x,y+dy,w,h);
  }
  l.restore();
 }
 function tick(time){
  frame=0;if(!running)return;
  // Scheduled even if a draw throws, so one bad frame never stops the loop for good.
  try{
   for(const k of kings)if(k.canvas&&k.since!=null){draw(k,time);if(!k.shown){k.shown=true;k.canvas.style.visibility='visible';k.img.style.visibility='hidden';}}
   frames++;
  }finally{schedule();}
 }
 function schedule(){if(!running||document.hidden||frame)return;clearTimeout(timer);timer=setTimeout(()=>{frame=requestAnimationFrame(tick);},33);}
 const onVisible=()=>{if(!document.hidden)schedule();};
 const onMotion=()=>{if(motion.matches)stop();};
 const resize=new ResizeObserver(()=>{for(const k of kings)if(k.canvas)place(k);});
 document.addEventListener('visibilitychange',onVisible);
 motion.addEventListener('change',onMotion);
 // Each king starts when his sheet has loaded and his image has finished rising.
 kings.forEach((k,i)=>{
  const image=new Image();image.decoding='async';
  const sheet=new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=KING_FILES[k.design];});
  fx.has(k.design);
  Promise.all([sheet,k.img.decode?.().catch(()=>{}),...(k.img.getAnimations?.()??[]).map(a=>a.finished.catch(()=>{}))]).then(()=>{
   if(!running)return;
   sheets[k.design]=image;fx.has(k.design);
   k.box=ivoryBox(image);k.filter=filterOf(getComputedStyle(k.img).filter);k.offset=i*1371;
   const c=k.canvas=document.createElement('canvas');c.setAttribute('aria-hidden','true');
   const z=getComputedStyle(k.img).zIndex;
   Object.assign(c.style,{position:'absolute',pointerEvents:'none',visibility:'hidden',zIndex:z==='auto'?'auto':z,filter:k.filter.brightness!==1?`brightness(${k.filter.brightness})`:''});
   // Right after its own image, so the canvases stack in the arc's order whatever order the sheets load in.
   k.img.after(c);for(const n of kings)if(n.canvas)place(n);resize.observe(root);
   k.since=performance.now();started++;
   schedule();
  }).catch(()=>{});
 });
 function stop(){
  if(!running&&!kings.some(k=>k.canvas))return;
  running=false;clearTimeout(timer);if(frame)cancelAnimationFrame(frame);frame=0;
  resize.disconnect();document.removeEventListener('visibilitychange',onVisible);motion.removeEventListener('change',onMotion);
  for(const k of kings){k.img.style.visibility='';k.canvas?.remove();k.canvas=null;}
 }
 return state;
}
