// The soft pool on the painted board (scene.mjs draws it when the atmosphere is on): the numbers, apart from any
// canvas, so they can be tested. Every length scales with the figure: a footprint and its height come in one unit, and
// only the square (tile) caps a pool, which keeps it off the next square's feet.
//   footprint  what really touches the floor in one drawing, measured once (tools/build-character-footprints.mjs for
//              the frames of a bank, shadowField for a still sprite);
//   poolShape  the soft oval of that footprint;
//   glidePool  the drawn pool follows its target over about 70 ms, so a new frame, facing or bank never pops;
//   weights    how much pool shows as a figure rises, tips over or lies on the floor.
import {clamp} from './painted-mesh.mjs';

// Strengths are [light stone, dark wood]: a shadow takes the mix by how dark the floor under it is.
export const SHADE={q:1.5,rgb:[40,30,24],pool:[.5,.72],slide:[.094,.104]};
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const median=a=>a.sort((u,v)=>u-v)[a.length>>1];

/**
 * What touches the floor in one drawing. alpha: w × h, 0–255; (ax, ay): the ground point; tall: the figure's height in
 * the same pixels. Returns null for an empty drawing, else, in those pixels from the ground point:
 *   span, cx  width and centre of the contact;
 *   cy        how far below the ground point the contact lies (negative: above it);
 *   tilt      the slope of the line of feet, in radians (positive: the right side lower);
 *   air       how far the soles are above the ground point (a baked leap);
 *   left, right  the lower body's half widths from the ground point (median edges; thin parts do not count).
 */
export function footprint(alpha,w,h,ax,ay,tall){
 // Each column's lowest solid point. The sole: the lowest level that more than a thin part reaches, so a spear
 // butt or a sword point lower than the feet does not set it.
 const bottom=new Int32Array(w).fill(-1);
 for(let x=0;x<w;x++)for(let y=h-1;y>=0;y--)if(alpha[y*w+x]>=128){bottom[x]=y;break;}
 const solid=[...bottom].filter(b=>b>=0).sort((u,v)=>v-u);if(!solid.length)return null;
 const sole=solid[Math.min(solid.length-1,Math.floor(tall*.05))];
 // The lower body: median edges over the lowest 40% of the figure. A run thinner than a limb (a spear shaft) does not
 // make an edge, and a part that only some rows have (a tail, a hem's tip, smoke) does not move the median.
 const lefts=[],rights=[],limb=Math.max(2,tall*.035);
 for(let y=Math.max(0,Math.round(sole-.4*tall));y<=Math.min(h-1,sole);y++){
  let l=-1,r=-1,run=0;
  for(let x=0;x<w;x++){if(alpha[y*w+x]>=128){if(++run>=limb){if(l<0)l=x-run+1;r=x;}}else run=0;}
  if(l>=0){lefts.push(l);rights.push(r);}
 }
 const l=lefts.length?median(lefts):ax-.15*tall,r=rights.length?median(rights):ax+.15*tall,wide=Math.max(r-l,1),middle=(l+r)/2;
 // Each column's weight: its touch (fully within tall/24 of the sole, not at all past tall/7: further back the higher
 // it is, a back foot, the far side of a hem) times how solid it is over its lowest tall/15 (a foot, a hem or a tower
 // base fully; a blade slanting down to the floor, a pointed toe little).
 const weight=new Float32Array(w),near=tall/24,far=tall/7,run=tall/15;let total=0;
 for(let x=0;x<w;x++){
  const b=bottom[x];if(b<0)continue;
  const touch=1-ease((sole-b-near)/(far-near));if(!touch)continue;
  const y0=Math.max(0,Math.round(b-run));let k=0;for(let y=y0;y<=b;y++)k+=alpha[y*w+x]>=128;
  const firm=k/(b-y0+1);weight[x]=touch*firm*firm;total+=weight[x];
 }
 // A run of columns thinner than a limb stands on nothing: a spear butt, a sword's point.
 for(let x=0;x<=w;x++){
  if(x<w&&weight[x])continue;
  let a=x;while(a>0&&weight[a-1])a--;
  if(x-a<limb)for(let i=a;i<x;i++){total-=weight[i];weight[i]=0;}
 }
 if(total<=0)return null;
 // The middle 94% of that weight, its mean height and its slope.
 let sum=0,first=-1,last=-1,mx=0,my=0;
 for(let x=0;x<w;x++){const v=weight[x];if(!v)continue;sum+=v;if(first<0&&sum>=total*.03)first=x;if(last<0&&sum>=total*.97)last=x;mx+=v*x;my+=v*bottom[x];}
 mx/=total;my/=total;
 let cov=0,vary=0;for(let x=0;x<w;x++){const v=weight[x];if(v){cov+=v*(x-mx)*(bottom[x]-my);vary+=v*(x-mx)*(x-mx);}}
 const contact=last-first,narrow=clamp(contact/(.3*tall),0,1),tilt=vary?clamp(.8*Math.atan(cov/vary)*narrow,-.2,.2):0;
 // The lower body keeps it honest: no narrower than most of that body (a back foot the sole did not reach), no wider
 // (a tail on the floor), and the centre stays under the body.
 const span=clamp(contact,.6*wide,1.05*wide),cx=clamp((first+last)/2,middle-.18*wide,middle+.18*wide);
 return {span,cx:cx-ax,cy:my-ay,tilt,air:Math.max(0,ay-sole),left:ax-l,right:r-ax};
}
/**
 * The soft oval of a footprint: a little wider than the contact, as deep as a disc seen at this angle, nudged away from
 * the board's warm top-left light. fp and tall in one unit, tile in the same.
 */
export function poolShape(fp,tall,tile=Infinity){
 // Past a third of the square, width and depth grow more and more slowly: a wide figure stays off the next square, and
 // still shows how much wider it stands facing one way than another.
 const A=Math.max(fp.span/2+.04*tall,.19*tall),raw=1.3*A,knee=.34*tile,room=.16*tile;
 const rx=raw<=knee?raw:knee+room*(1-Math.exp(-(raw-knee)/room));
 return {x:fp.cx+.006*tall,y:fp.cy+.03*tall,rx,ry:.32*Math.min(rx,knee)+.13*Math.max(0,rx-knee),tilt:fp.tilt??0};
}
/** The shared stamp of every pool: alpha 0–1 at (u, v) in -1..1, full inside, soft to its rim. */
export const poolAlpha=(u,v)=>{const e=1-u*u-v*v;return e>0?Math.min(1,e*1.25):0;};

const GLIDE_MS=70;
/**
 * A drawn pool follows its target: state {x, y, rx, ry, tilt} moves in place toward target over dt ms and comes back.
 * A long gap (the board slept, a hidden tab) lands on the target. state.settled says when there is no more to do.
 */
export function glidePool(state,target,dt){
 const k=dt>400?1:1-Math.exp(-Math.max(0,dt)/GLIDE_MS);let settled=true;
 for(const key of ['x','y','rx','ry','tilt']){
  const left=(target[key]-state[key])*(1-k),still=Math.abs(left)<(key==='tilt'?.002:.05);
  state[key]=still?target[key]:target[key]-left;if(!still)settled=false;
 }
 state.settled=settled;return state;
}
/**
 * A figure's footprint from the alpha of its still sprite ({alpha, n}: n × n, drawn at q px per unit), facing f (1 right,
 * -1 left: the outline mirrors). spec: {anchor, scale} (the anchor stands on the floor). Null for an empty sprite, else
 * in board units at spec.scale: scale, tall (height above the anchor), span, cx, cy, tilt, air, and body: the half
 * widths left and right of the anchor in the unmirrored sprite (where a lying figure's lower edge is).
 */
export function shadowField({alpha,n},spec,f){
 const q=SHADE.q,s=spec.scale,ax=spec.anchor.x*s*q,ay=spec.anchor.y*s*q;
 let top=n;for(let i=0;i<alpha.length;i++)if(alpha[i]>24){top=Math.floor(i/n);break;}
 const tall=Math.max(20,(ay-top)/q),fp=footprint(alpha,n,n,ax,ay,tall*q);if(!fp)return null;
 return {scale:s,tall,span:fp.span/q,cx:f*fp.cx/q,cy:fp.cy/q,tilt:f*fp.tilt,air:fp.air/q,body:[fp.left/q,fp.right/q]};
}

/**
 * How much pool shows (0–1, before the floor's own strength), from the pose fields the shadow reads: ground (the floor
 * point), foot, lift and shadow (< 1: higher), rotation, and lit (this figure lights its own floor, 0–1: the ivory
 * Spirit's glow). opacity: the figure's, times any fade of its own (fxFade). baked: how high the drawing itself has
 * the figure (a leap's frames), in board units.
 *   shown  of all of it; pool: of the standing pool; lying: of the pool under the body;
 *   size   the standing pool's size as the figure rises;
 *   h, air: how high the figure is, and that made higher still by pose.shadow (a smaller shadow).
 * As a figure rises, its pool lies where it will land, a smaller oval that grows lighter with height: it never gets
 * darker as it rises. As one tips over, the standing pool goes by about 44°, and the pool under the body grows as it
 * nears the floor.
 */
export function shadowWeights(pose,opacity=1,baked=0){
 const ground=pose.ground??pose.foot,s=clamp(pose.shadow??1,0,1);
 // (pose.shadow near 0 hides it: atmosphere off, a king's capture draws its victim's old oval with .001.)
 const shown=opacity*(1-(pose.lit??0))*clamp((s-.02)/.3,0,1);
 const h=Math.max(pose.lift??0,ground.y-pose.foot.y,baked,0),air=h+10*(1-s),up=1-Math.exp(-air/8);
 const r=Math.abs(pose.rotation??0),stand=clamp((Math.cos(r)-.72)/.26,0,1);
 return {shown,h,air,
  pool:(1-.35*up-.2*clamp(air/45,0,1))*stand,
  size:1-.3*air/(air+30),
  lying:clamp((Math.sin(Math.min(r,Math.PI/2))-.25)/.7,0,1)};
}
/** A figure's own effect (unit.fx in scene.mjs) fades its shadow as the effect takes the figure off the floor: 0–1. */
export function fxFade(fx){
 if(!fx)return 1;
 // A king's death (king-captures.mjs): gone over 180 ms from the strike, while the effect is still small.
 if(fx.death)return 1-ease(fx.death.t/180);
 // Ice that shatters: the wedges fly apart. A ranged victim (fx-ranged.mjs) sets its own.
 if(fx.shatter)return 1-ease(fx.shatter.t/.4);
 if(fx.ranged)return fx.ranged.shadow;
 return 1;
}
