// The Queen's thorns: a volley from her palms that reads at game size, and a death to fit. Thorns fan out, dart in,
// bury in the victim and stay there; bramble lashes bind it; it topples and comes apart in rose petals.
// Painted sprites from one small atlas; a plan made once per attack, so a frame allocates next to nothing.
const ATLAS_URL=new URL('../queen/thorn-fx.webp',import.meta.url).href;
const ATLAS={thorn:{rect:[0,0,226,77],tipX:222.7,axisY:46.4,buryX:120},vines:[[228,0,306,41],[0,79,306,45],[308,79,306,45],[0,126,306,40]],petals:[[308,126,48,45],[358,126,48,39],[408,126,39,48],[449,126,40,48],[491,126,48,38],[541,126,48,42],[591,126,48,43],[0,176,48,37]],trail:[50,176,120,20],spark:[172,176,64,64]};
export const DEMISE_MS=620;
export const PER_PALM=4;
const VOLLEY_MS=150;
const HIT_STAGGER=20,BIND=[{at:90,f:.28,tilt:.14,v:0},{at:140,f:.52,tilt:-.18,v:1},{at:190,f:.74,tilt:.12,v:2}],BIND_MS=130,FALL_AT=320,FALL_MS=280,GONE_AT=610,FADE_AT=400;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const random=seed=>{let v=seed>>>0;return()=>{v=(v+0x6d2b79f5)>>>0;let t=Math.imul(v^(v>>>15),v|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};

// Where a thorn's tip is at q of its way from start to end, on its bow.
function along(t,q,dx,dy,out){
 const ex=t.ex+dx*q,ey=t.ey+dy*q,mx=ex-t.sx,my=ey-t.sy,d=Math.hypot(mx,my)||1,bow=Math.sin(Math.PI*q**.72)*t.bend;
 out.x=t.sx+mx*q-my/d*bow;out.y=t.sy+my*q+mx/d*bow;return out;
}
/** The attack's fixed numbers. o: origin, secondaryOrigin, originAt, target, foot, height, seed, emissionMs, contactMs. */
export function makePlan(o){
 const rng=random(o.seed),palms=o.secondaryOrigin?2:1,contact=o.contactMs,n=palms===2?PER_PALM:PER_PALM*2,H=o.height,thorns=[];
 const away=Math.sign(o.foot[0]-o.origin[0])||(o.seed&1?1:-1);
 for(let i=0;i<n;i++)for(let palm=0;palm<palms;palm++){
  const order=thorns.length,launchMs=i/(n-1)*Math.max(o.emissionMs,VOLLEY_MS)+palm*17+(i?rng()*6:0);
  let start=palm?o.secondaryOrigin:o.origin;
  if(o.originAt){const p=o.originAt(launchMs,palm);if(p)start=p;}
  const first=order===0,lx=first?o.target[0]-o.foot[0]:(rng()-.5)*.44*H,ly=first?o.target[1]-o.foot[1]:-(.24+rng()*.42)*H;
  const ex=o.foot[0]+lx,ey=o.foot[1]+ly,distance=Math.hypot(ex-start[0],ey-start[1]),fan=i/(n-1)*2-1+(palm?.18:-.18);
  const t={palm,launchMs,hitMs:contact+order*HIT_STAGGER,sx:start[0],sy:start[1],ex,ey,lx,ly,bend:fan*(Math.min(distance*.16,44)+Math.max(0,300-distance)*.3)+(rng()-.5)*10,exponent:1.15+rng()*.3+Math.max(0,300-distance)/300,length:68+rng()*18,angle:0};
  const a=along(t,.98,0,0,{x:0,y:0});t.angle=Math.atan2(ey-a.y,ex-a.x);
  thorns.push(t);
 }
 const plan={contact,away,H,thorns,foot:o.foot,duration:contact+DEMISE_MS,W:clamp(H*.86,76,116),mean:[0,0],petals:[],puffs:[]};
 for(const t of thorns){plan.mean[0]+=Math.cos(t.angle)/thorns.length;plan.mean[1]+=Math.sin(t.angle)/thorns.length;}
 const s={};
 for(let i=0;i<14;i++){
  const at=FALL_AT+rng()*150,life=Math.min(DEMISE_MS-at,170+rng()*130);victimAt(plan,contact+at,s);
  const lx=(rng()-.5)*.6*H,ly=-(.1+rng()*.8)*H,[wx,wy]=bodyPoint(s,plan.foot,lx,ly);
  plan.petals.push({at,life,x:wx,y:wy,vx:(rng()-.5)*260+away*70,vy:-60-rng()*200,spin:(rng()-.5)*14,angle:rng()*6.3,size:10+rng()*8,v:Math.floor(rng()*8),flutter:9+rng()*10});
 }
 // Two or three petals thrown from each palm with the first thorns.
 for(const t of thorns)if(plan.puffs.length<4&&t.launchMs<VOLLEY_MS*.5)plan.puffs.push({at:t.launchMs,life:260+rng()*120,x:t.sx,y:t.sy,vx:Math.cos(t.angle)*60+(rng()-.5)*90,vy:Math.sin(t.angle)*60-60-rng()*60,spin:(rng()-.5)*12,angle:rng()*6.3,size:9+rng()*5,v:Math.floor(rng()*8),flutter:10+rng()*8});
 return plan;
}
// How the victim stands at elapsed ms from the release: shifted, tightened, turned and faded. Fills and returns out.
export function victimAt(plan,elapsed,out){
 const t=elapsed-plan.contact;
 out.dx=0;out.dy=0;out.theta=0;out.sx=1;out.sy=1;out.opacity=1;
 if(t<0)return out;
 const recoil=8*smooth(t/170),[mx,my]=plan.mean;out.dx=mx*recoil;out.dy=my*recoil*.5;
 for(const h of plan.thorns){const since=elapsed-h.hitMs;if(since<0)break;if(since<260){const k=5*Math.exp(-since/60);out.dx+=Math.cos(h.angle)*k;out.dy+=Math.sin(h.angle)*k*.5;}}
 if(t>120&&t<FALL_AT+40)out.dx+=Math.sin(t*.085)*2.4*smooth((t-120)/60)*(1-smooth((t-FALL_AT)/40));
 const tight=smooth((t-210)/90);out.sx=1-.13*tight;out.sy=1-.05*tight;
 const fall=clamp((t-FALL_AT)/FALL_MS);out.theta=1.25*fall*fall*plan.away;out.dx+=plan.away*16*fall*fall;
 out.opacity=1-smooth((t-FADE_AT)/(GONE_AT-FADE_AT));
 return out;
}
// A point on the victim's body (from its foot) on screen, in the order drawPiece draws a painted body.
function bodyPoint(s,foot,lx,ly){
 const c=Math.cos(s.theta),n=Math.sin(s.theta);
 return [foot[0]+s.dx+s.sx*(c*lx-n*ly),foot[1]+s.dy+s.sy*(n*lx+c*ly)];
}
/** Fills out with a flying thorn's tip and heading; false before launch and after its hit. */
export function thornAt(t,elapsed,s,out){
 if(elapsed<t.launchMs||elapsed>=t.hitMs)return false;
 const u=(elapsed-t.launchMs)/(t.hitMs-t.launchMs),q=u**t.exponent;
 along(t,q,s.dx,s.dy,out);const x=out.x,y=out.y;
 along(t,Math.min(1,q+.03),s.dx,s.dy,out);const hx=out.x-x,hy=out.y-y;
 out.angle=hx||hy?Math.atan2(hy,hx):t.angle;out.x=x;out.y=y;out.u=u;out.k=.35+.65*smooth(u*3);out.alpha=smooth((elapsed-t.launchMs)/30);
 return true;
}
export function createQueenThorns({onLoad=()=>{}}={}){
 let atlas=null,loading=false,plan=null,planKey='';
 const load=()=>{if(loading)return;loading=true;const image=Object.assign(new Image(),{crossOrigin:'anonymous'});image.src=ATLAS_URL;image.decode().then(()=>{atlas=image;onLoad();},()=>{loading=false;});};
 const planFor=o=>{const key=`${o.seed}:${o.origin}:${o.target}:${o.foot}:${o.height}`;if(key!==planKey){plan=makePlan(o);planKey=key;}return plan;};
 const state={},fly={x:0,y:0};
 const sprite=(ctx,r,x,y,w,h)=>ctx.drawImage(atlas,r[0],r[1],r[2],r[3],x,y,w,h);
 const petal=(ctx,p,t,base)=>{
  const since=t-p.at;if(since<0||since>=p.life)return;
  const τ=since/1000,r=ATLAS.petals[p.v],q=since/p.life;
  ctx.save();ctx.translate(p.x+p.vx*τ,p.y+p.vy*τ+260*τ*τ);ctx.rotate(p.angle+p.spin*τ);ctx.scale(1,.45+.55*Math.abs(Math.cos(p.flutter*τ)));ctx.globalAlpha=base*(1-smooth((q-.65)/.35));
  sprite(ctx,r,-p.size/2,-p.size/2,p.size,p.size*r[3]/r[2]);ctx.restore();
 };
 const draw=(ctx,o)=>{
  if(!atlas||!(o.elapsedMs>=0)||o.elapsedMs>=o.contactMs+DEMISE_MS)return;
  const e=o.elapsedMs,pl=planFor(o),s=victimAt(pl,e,state),base=ctx.globalAlpha,T=ATLAS.thorn;
  ctx.save();
  for(const p of pl.puffs)petal(ctx,p,e,base);
  const t=e-pl.contact;
  if(t>=0){
   // Bramble lashes and buried thorns ride on the body as it turns.
   const body=base*Math.min(1,s.opacity*1.25);
   ctx.save();ctx.translate(pl.foot[0]+s.dx,pl.foot[1]+s.dy);ctx.scale(s.sx,s.sy);ctx.rotate(s.theta);
   for(const b of BIND){
    const k=clamp((t-b.at)/BIND_MS);if(k<=0)continue;
    const r=ATLAS.vines[b.v],w=pl.W,h=w*r[3]/r[2]*1.5,flip=b.v%2?-1:1,seen=1-(1-k)*(1-k);
    ctx.save();ctx.translate(0,-b.f*pl.H);ctx.rotate(b.tilt*pl.away);ctx.scale(flip,1);ctx.globalAlpha=body;
    ctx.drawImage(atlas,r[0],r[1],r[2]*seen,r[3],-w/2,-h/2,w*seen,h);ctx.restore();
   }
   for(const h of pl.thorns){
    const since=e-h.hitMs;if(since<0)continue;
    const p=smooth(since/36),w=T.tipX-(T.tipX-T.buryX)*p,q=h.length/T.tipX,r=T.rect;
    ctx.save();ctx.translate(h.lx,h.ly);ctx.rotate(h.angle);ctx.scale(q,q);ctx.globalAlpha=body;
    ctx.drawImage(atlas,r[0],r[1],w,r[3],-w,-T.axisY,w,r[3]);ctx.restore();
   }
   ctx.restore();
  }
  for(const h of pl.thorns){
   if(!thornAt(h,e,s,fly))continue;
   const q=h.length/T.tipX*fly.k,r=T.rect,tr=ATLAS.trail,tail=(12+44*fly.u)*fly.alpha;
   ctx.save();ctx.translate(fly.x,fly.y);ctx.rotate(fly.angle);ctx.globalAlpha=base*fly.alpha;
   sprite(ctx,tr,-h.length*fly.k-tail+12,-6*fly.k,tail,12*fly.k);
   ctx.scale(q,q);ctx.drawImage(atlas,r[0],r[1],r[2],r[3],-T.tipX,-T.axisY,r[2],r[3]);ctx.restore();
  }
  // A spark at each palm as a thorn leaves it, and at each bite.
  for(const h of pl.thorns){
   const left=e-h.launchMs,bit=e-h.hitMs;
   if(left>=0&&left<70){const k=left/70,z=18+12*k;ctx.globalAlpha=base*(1-k);sprite(ctx,ATLAS.spark,h.sx-z/2,h.sy-z/2,z,z);}
   if(bit>=0&&bit<90){const k=bit/90,z=20+22*Math.sqrt(k),[x,y]=bodyPoint(s,pl.foot,h.lx,h.ly);ctx.globalAlpha=base*(1-k*k);sprite(ctx,ATLAS.spark,x-z/2,y-z/2,z,z);}
  }
  if(t>=0)for(const p of pl.petals)petal(ctx,p,t,base);
  ctx.restore();
 };
 return {
  // In place of the package's player: its contact stays, its time grows by the death.
  effect(source){
   load();
   const contactMs=source.contactMs,withContact=o=>{o.contactMs=contactMs;return o;};
   return {...source,player:{durationMs:contactMs+DEMISE_MS,
    // Before the figures draw: the victim's pose for this frame.
    pose(o){const s=victimAt(planFor(withContact(o)),o.elapsedMs,state),v=o.victim;if(!v)return;v.pose={...v.pose,foot:{x:v.pose.foot.x+s.dx,y:v.pose.foot.y+s.dy},rotation:s.theta*v.pose.facing,sx:s.sx,sy:s.sy};v.opacity=s.opacity;},
    draw(ctx,o){draw(ctx,withContact(o));}}};
  },
 };
}
