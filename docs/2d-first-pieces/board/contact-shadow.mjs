// Contact shadows on the painted board (scene.mjs draws them when the atmosphere is on): the numbers, apart from
// any canvas, so they can be tested. Distances are in board units; an outline grid has q px per unit.
//   core  a dark band under what touches the floor (soles, a hem, a tower base, a spear butt);
//   soft  a pool as wide as that contact, with the legs' short shadow cast down and to the right, away from the
//         board's warm top-left light;
//   oval  drawn each frame in its place as the figure leaves the floor, where it will land;
//   lying a pool under the body of a figure that tips over or lies on the floor.
import {clamp} from '../painted-mesh.mjs';

// Strengths are [light stone, dark wood]: a shadow takes the mix by how dark the floor under it is.
export const SHADE={q:1.5,shear:.6,cast:.26,rgb:[40,30,24],core:[.62,.94],soft:[.45,.7],air:[.6,.7],pool:.4};
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

/**
 * A figure's shadow fields from the alpha of its still sprite ({alpha, n}: n × n, drawn at q px per unit), facing f
 * (1 right, -1 left: the outline mirrors, the cast does not). spec: {anchor, scale} (the anchor stands on the floor).
 * Returns null for an empty sprite, else the contact measures and two fields (core, soft) of 0–1 values, W × H at
 * q px per unit, with the ground point at (OX, OY):
 *   tall  height above the soles; span, cx: width and centre of the contact; pd: the pool's centre below the soles;
 *   body  the body's half widths left and right of the anchor in the unmirrored sprite (where a lying figure's
 *         lower edge is).
 */
export function shadowField({alpha,n},spec,f,tile=112){
 // x across, mirrored for a figure facing left; d down the screen; h the height above the soles.
 const {q,shear,cast}=SHADE,s=spec.scale,ax=spec.anchor.x*s*q,ay=spec.anchor.y*s*q,X=x=>f*(x-ax)/q;
 let top=n;for(let i=0;i<alpha.length;i++)if(alpha[i]>24){top=Math.floor(i/n);break;}
 const tall=Math.max(20,(ay-top)/q),castTop=tall*.38,y0=Math.max(0,Math.floor(ay-castTop*q));
 // What touches the floor: each column's lowest solid point stands on it, further back the higher it is (a back
 // foot, the far side of a hem): fully within 4 units of the lowest sole, not at all past 10.
 const bottom=new Int16Array(n).fill(-1);
 for(let x=0;x<n;x++)for(let y=n-1;y>=0;y--)if(alpha[y*n+x]>=128){bottom[x]=y;break;}
 const sole=Math.max(...bottom);if(sole<0)return null;
 const touch=Float32Array.from(bottom,b=>b<0?0:1-ease((sole-b-4*q)/(6*q)));
 // How firmly each column stands there: its touch times how solid it is over its lowest 8 units (a foot, a hem or a
 // tower base fully; a blade slanting down to the floor, a pointed toe little).
 const firm=touch.map((t,x)=>{if(!t)return 0;let k=0;for(let y=Math.max(0,bottom[x]-8*q);y<=bottom[x];y++)k+=alpha[y*n+x]>=128;return t*k/(8*q+1);});
 // The pool spans the middle 94% of the contact, weighed by touch × firmness, so a spear butt, a cape's tip or a
 // sword does not pull it aside.
 let total=0,sum=0,first=-1,last=-1;for(let x=0;x<n;x++)total+=firm[x]*touch[x];
 for(let x=0;x<n;x++){sum+=firm[x]*touch[x];if(first<0&&sum>=total*.03)first=x;if(last<0&&sum>=total*.97)last=x;}
 const span=Math.abs(X(last)-X(first)),cx=(X(first)+X(last))/2;
 // The body's half widths: the median edges over the middle 60% of its height.
 const left=[],right=[];
 for(let y=Math.round(top+.2*(ay-top));y<=top+.8*(ay-top);y++){let l=-1,r=-1;for(let x=0;x<n;x++)if(alpha[y*n+x]>=128){if(l<0)l=x;r=x;}if(l>=0){left.push((ax-l)/q);right.push((r-ax)/q);}}
 const median=a=>a.length?a.sort((u,v)=>u-v)[a.length>>1]:tall*.15;
 // The pool: an ellipse a little wider than the contact (but off the next square's feet), as deep as a disc seen at
 // this angle, nudged away from the light, darkest under the body (each disc reaches a little past its axes: that
 // is its soft rim).
 const A0=Math.max(span/2+5,.16*tall+4),mid=cx+.75,pd=SHADE.pool,A=Math.min(A0*1.15,.4*tile),B=clamp(.3*A0,5,11)*1.15;
 // How far the short cast reaches.
 let x0=0,x1=0,reach=0;
 for(let y=y0;y<n;y++){const h=(ay-y)/q,dx=h<0?0:shear*cast*h,d=h<0?-h:cast*h;let l=-1,r=-1;
  for(let x=0;x<n;x++)if(alpha[y*n+x]>=10){if(l<0)l=x;r=x;}
  if(l<0)continue;
  const pl=Math.min(X(l),X(r))+dx,pr=Math.max(X(l),X(r))+dx;if(pl<x0)x0=pl;if(pr>x1)x1=pr;if(d>reach)reach=d;
 }
 // Floor grid at q px per unit: x across, d down the screen (0 at the ground point).
 const gx0=Math.min(x0,mid-A)-8,gx1=Math.max(x1,mid+A)+8,gd0=Math.min(-4,pd-B,(sole-ay)/q-13)-8,gd1=Math.max(reach,pd+B,(sole-ay)/q+4)+8;
 const OX=Math.ceil(-gx0*q),OY=Math.ceil(-gd0*q),W=OX+Math.ceil(gx1*q)+1,H=OY+Math.ceil(gd1*q)+1;
 const tight=new Float32Array(W*H),wide=new Float32Array(W*H),shade=new Float32Array(W*H);
 const put=(buf,x,d,v)=>{const X=Math.round(x*q)+OX,Y=Math.round(d*q)+OY;if(X>=0&&X<W&&Y>=0&&Y<H){const i=Y*W+X;if(v>buf[i])buf[i]=v;}};
 // The core: under each column that stands there a tight band from 2.2 units behind its lowest point to 2.2 in
 // front, and a wider, softer one to 3.5 in front at half strength.
 for(let x=0;x<n;x++){const t=firm[x];if(!t)continue;const d=(bottom[x]-ay)/q;
  for(let k=-2.2*q;k<=3.5*q;k++){if(k<=2.2*q)put(tight,X(x),d+k/q,t);put(wide,X(x),d+k/q,t);}
 }
 // The short cast: what is below the anchor lies where it is drawn; above it, the lower legs fall down and right.
 for(let y=y0;y<n;y++){const h=(ay-y)/q,fade=h<0?1:(1-h/castTop)**1.5;
  for(let x=0;x<n;x++){const v=alpha[y*n+x]/255;if(v<.04)continue;
   if(h<0)put(shade,X(x),-h,v);else put(shade,X(x)+shear*cast*h,cast*h,v*fade);
  }
 }
 blur(tight,W,H,q,q);blur(wide,W,H,2.4*q,2.4*q);blur(shade,W,H,2.4*q,1.4*q);
 const disc=(x,d)=>{const e=1-((x-mid)/A)**2-((d-pd)/B)**2;return e>0?e*Math.sqrt(e):0;};
 for(let Y=0;Y<H;Y++){const d=(Y-OY)/q;for(let X=0;X<W;X++){const i=Y*W+X;
  shade[i]=1-(1-Math.min(1,shade[i])*.55)*(1-disc((X-OX)/q,d)*.9);tight[i]=1-(1-Math.min(1,tight[i]))*(1-.5*Math.min(1,wide[i]));
 }}
 return {scale:s,tall,span,cx,pd,body:[median(left),median(right)],sole:(sole-ay)/q,W,H,OX,OY,core:tight,soft:shade};
}
// Gaussian blur in place (three box passes each way); sx, sy: standard deviations in px.
export function blur(buf,W,H,sx,sy){
 const tmp=new Float32Array(Math.max(W,H));
 const pass=(len,count,stride,step,r)=>{
  if(r<1)return;
  for(let line=0;line<count;line++){
   const o=line*stride;
   for(let p=0;p<3;p++){
    let sum=0;for(let i=0;i<len;i++)tmp[i]=buf[o+i*step];
    for(let i=0;i<=r&&i<len;i++)sum+=tmp[i];
    for(let i=0;i<len;i++){buf[o+i*step]=sum/(2*r+1);if(i+r+1<len)sum+=tmp[i+r+1];if(i-r>=0)sum-=tmp[i-r];}
   }
  }
 };
 const radius=sigma=>Math.round(Math.sqrt(sigma*sigma+.25)-.5);
 pass(W,H,W,1,radius(sx));pass(H,W,1,W,radius(sy));
}

/**
 * How much of each part shows (0–1, before the floor's own strength), from the pose fields the shadow reads:
 * ground (the floor point), foot, lift and shadow (< 1: higher), rotation, and lit (this figure lights its own
 * floor, 0–1: the ivory Spirit's glow). opacity: the figure's, times any fade of its own (fxFade).
 *   shown  of all of it; core, soft, oval, lying: of each part; plateau: how soft the oval is (0 flat, 1 soft);
 *   h, air: how high the figure is, and that made higher still by pose.shadow (a smaller shadow).
 * As a figure rises, the contact goes first, then the pool hands over to the oval, which grows lighter and softer
 * with height: the shadow never gets darker as it rises. As one tips over, the contact goes by about 27°, the
 * standing pool by 44°, and the pool under the body grows as it nears the floor.
 */
export function shadowWeights(pose,opacity=1){
 const ground=pose.ground??pose.foot,s=clamp(pose.shadow??1,0,1);
 // (pose.shadow near 0 hides it: atmosphere off, a king's capture draws its victim's old oval with .001.)
 const shown=opacity*(1-(pose.lit??0))*clamp((s-.02)/.3,0,1);
 const h=Math.max(pose.lift??0,ground.y-pose.foot.y,0),air=h+10*(1-s),up=1-Math.exp(-air/8);
 const r=Math.abs(pose.rotation??0),stand=clamp((Math.cos(r)-.72)/.26,0,1);
 return {shown,h,air,
  core:Math.exp(-air/4)*clamp(1-(r-.22)/.25,0,1),
  soft:(1-up)*stand,
  oval:up*(1-.45*clamp(air/45,0,1))*stand,
  plateau:clamp(air/24,0,1),
  lying:clamp((Math.sin(Math.min(r,Math.PI/2))-.25)/.7,0,1)};
}
/** A figure's own effect (unit.fx in scene.mjs) fades its shadow as the effect takes the figure off the floor: 0–1. */
export function fxFade(fx){
 if(!fx)return 1;
 // A king's death (king-captures.mjs): gone over 180 ms from the strike, while the effect is still small.
 if(fx.death)return 1-ease(fx.death.t/180);
 // Ice that shatters: the wedges fly apart; strips that come apart: the lowest strip goes last.
 if(fx.shatter)return 1-ease(fx.shatter.t/.4);
 if(fx.apart)return 1-ease((fx.apart.t-.42)/.55);
 return 1;
}
