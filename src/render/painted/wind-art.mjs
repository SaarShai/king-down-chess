// Painted wind ribbons from one sheet (wind-bands.webp, prompt in wind-bands-prompt.txt): four long ribbons of
// ivory and blue air, tapered at both ends. A ribbon bends along any path in thin upright strips, so its lit edge
// stays on top all the way round a whirl. Until the sheet has loaded, nothing draws.
const RIBBONS=[[38,2,436,44],[47,50,418,44],[41,98,430,44],[18,146,476,44]];
export const RIBBON_COUNT=RIBBONS.length;
const STRIPS=22,MAX_TILT=1.2;
// How far a tint moves the painted ivory and blue toward its own colour; the light and shade stay.
const TINTS={lilac:['#9a7fc8',.62]};

let sheet=null;
if(typeof Image!=='undefined'){const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{sheet=image;};image.src=new URL('./wind-bands.webp',import.meta.url).href;}
const tinted=new Map();
function art(tint){
 if(!sheet||!tint)return sheet;
 let c=tinted.get(tint);if(c)return c;
 c=document.createElement('canvas');c.width=sheet.naturalWidth;c.height=sheet.naturalHeight;
 const g=c.getContext('2d'),[colour,amount]=TINTS[tint];
 g.drawImage(sheet,0,0);g.globalCompositeOperation='color';g.globalAlpha=amount;g.fillStyle=colour;g.fillRect(0,0,c.width,c.height);
 g.globalAlpha=1;g.globalCompositeOperation='destination-in';g.drawImage(sheet,0,0);
 tinted.set(tint,c);return c;
}

/**
 * Ribbon `i` along the path at(u) = {x, y} for u from 0 to 1, `thick` board units tall. The painted tips sit at
 * u = 0 and u = 1. keep(u, x, y): optional; a strip it refuses is not drawn (a near or far half, a clear side).
 * fade(u): optional share of `alpha` for each strip.
 */
export function windStroke(ctx,at,thick,alpha,i,{tint=null,keep=null,fade=null}={}){
 const image=art(tint);
 if(!image||alpha<=.01||thick<=.5)return;
 const [sx,sy,sw,sh]=RIBBONS[(i%RIBBON_COUNT+RIBBON_COUNT)%RIBBON_COUNT],piece=sw/STRIPS;
 const base=ctx.globalAlpha;
 let p=at(0);
 for(let k=0;k<STRIPS;k++){
  const q=at((k+1)/STRIPS),dx=q.x-p.x,dy=q.y-p.y,u=(k+.5)/STRIPS,x=(p.x+q.x)/2,y=(p.y+q.y)/2;p=q;
  const shown=fade?fade(u):1;
  if(Math.abs(dx)<.05||shown<=.01||keep&&!keep(u,x,y))continue;
  ctx.globalAlpha=base*Math.min(1,alpha)*shown;
  // Upright strips: a strip that runs right to left is mirrored, never turned over.
  const tilt=Math.max(-MAX_TILT,Math.min(MAX_TILT,Math.atan(dy/dx))),w=Math.hypot(dx,dy)+.7;
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);if(dx<0)ctx.scale(-1,1);
  ctx.drawImage(image,sx+piece*k,sy,piece,sh,-w/2,-thick/2,w,thick);
  ctx.restore();
 }
 ctx.globalAlpha=base;
}
/**
 * Ribbon `i` round the ellipse (cx, cy, rx, ry) from angle a0 to a1 (y down, so sin > 0 is the near half). It thins
 * out at the left and right of the ellipse, where it turns away round the back.
 */
export function windArc(ctx,cx,cy,rx,ry,a0,a1,thick,alpha,i,{tint=null,keep=null}={}){
 const angle=u=>a0+(a1-a0)*u;
 windStroke(ctx,u=>({x:cx+Math.cos(angle(u))*rx,y:cy+Math.sin(angle(u))*ry}),thick,alpha,i,{tint,keep:keep&&((u,x,y)=>keep(angle(u),x,y)),fade:u=>Math.min(1,Math.abs(Math.sin(angle(u)))*2.6)});
}
