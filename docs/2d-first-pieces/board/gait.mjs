// Quiet-move gaits and the selected-piece idle for the painted scene (opt-in: scene.setLively).
// Every figure is one painted image, so a gait only moves, squashes and tilts that image about
// its feet. A gait is data: `at(u, squares)` takes the move's progress u (0..1) and returns
//   travel  0..1 along the move (feet on the ground line between the two squares),
//   lift    px above the ground (the shadow stays on the ground and shrinks),
//   sx, sy  squash and stretch about the feet,
//   tilt    radians, + leans toward the direction of travel,
//   shadow  shadow scale (1 = at rest).
// New move kinds (for example the kings' powers) add an entry to GAITS and name it in GAIT_OF,
// or play it directly with scene.play(move, {gait: 'name'}).
import {clamp} from '../painted-mesh.mjs';
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const smoother=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
const span=(u,a,b)=>clamp((u-a)/(b-a),0,1);
// A damped wobble that starts and ends at 0: first a dip (+), then a smaller rebound (-).
const settle=k=>k<=0||k>=1?0:Math.exp(-3*k)*Math.sin(2*Math.PI*k);
const blend=(a,b,t)=>a+(b-a)*t;
const rest={travel:0,lift:0,sx:1,sy:1,tilt:0,shadow:1};
export function paintedPace(squares,cycle,stride){
 const natural=squares*cycle/stride,budget=Math.min(2000,600+250*(squares-1)),rate=Math.min(2,Math.max(1,natural/budget));
 const duration=natural/2>budget?Math.min(natural/2,2800):natural/rate,skate=natural/(rate*duration);
 return skate<=1.2?{duration,rate,skate}:null;
}
// Painted walk body travel. A constant speed slides the body during each held pose, so the planted foot
// slips. Mix the linear path with the path held at the start of the pose on screen. The last pose on
// screen travels on the linear path, so the walk's last frame meets the target square and the next bank.
export const BODY_TRAVEL_MIX=.5;
export function paintedTravel(t,duration,rate,frames,cycle,mix=BODY_TRAVEL_MIX){
 const u=clamp(duration>0?t/duration:1,0,1);
 if(u>=1)return 1;
 const natural=rate*duration;
 if(!(natural>0))return u;
 // The pose clock runs from 0 to natural over the move; it repeats every cycle. The held body
 // position is the linear position at the start of the pose on screen. It never moves back,
 // even when the clock passes a cycle boundary.
 const period=cycle>0?cycle:natural,clock=u*natural,pose=Math.floor(clock/period)*period,within=clock-pose;
 let offset=0,next=period;
 for(const frame of frames??[]){
  if(frame.timeMs<=within&&frame.timeMs>=offset)offset=frame.timeMs;
  else if(frame.timeMs>within&&frame.timeMs<next)next=frame.timeMs;
 }
 // A held last pose leaves the body short, and the endpoint frame (the turn or rest bank) snaps it on.
 if(pose+next>=natural)return u;
 return (1-mix)*u+mix*clamp((pose+offset)/natural,0,1);
}

// One-steppers (King, Guard, Maester, Ogre, Beast, Archer): a small dip, two quick footfalls
// with a forward lean, then the weight settles with a little squash.
function walk(u,squares=1){
 if(u<.14){const d=smooth(u/.14);return {...rest,sy:1-.035*d,sx:1+.02*d,tilt:-.025*d};}
 if(u<.78){
  const k=span(u,.14,.78),bob=Math.abs(Math.sin(Math.PI*2*Math.max(1,squares)*k)),lean=Math.sin(Math.PI*k),r=1-smooth(k*4);
  return {travel:smoother(k),lift:5*bob,sx:1-.01*bob+.02*r,sy:1+.022*bob-.035*r,tilt:.08*lean-.025*r,shadow:1-.06*bob};
 }
 const s=settle(span(u,.78,1));return {...rest,travel:1,sy:1-.07*s,sx:1+.04*s,tilt:-.03*s};
}
// Sliders (Rook, Bishop, Queen): lean back, glide low over the stone leaning into the run, and
// lean back against the stop before settling upright.
function glide(u){
 if(u<.16){const d=smooth(u/.16);return {...rest,tilt:-.035*d,sy:1-.02*d};}
 if(u<.8){
  const k=span(u,.16,.8),lean=Math.sin(Math.PI*k),r=1-smooth(k*5);
  return {travel:smoother(k),lift:3*lean,sx:1,sy:1+.012*lean-.02*r,tilt:.11*lean-.035*r,shadow:1-.05*lean};
 }
 const s=settle(span(u,.8,1));return {...rest,travel:1,tilt:-.09*s,sy:1-.04*s,sx:1+.02*s};
}
// Pawns: crouch, hop (higher for two squares), land with a squash and spring upright.
function hop(u,squares=1){
 const h=squares>1?30:22;
 if(u<.2){const d=smooth(u/.2);return {...rest,sy:1-.1*d,sx:1+.06*d,tilt:-.02*d};}
 if(u<.74){
  const k=span(u,.2,.74),air=4*k*(1-k),up=smooth(k/.12),down=smooth((1-k)/.12);
  // Stretched leaving and meeting the ground, round at the top; blended out of the crouch.
  let sy=1+.06*(1-air),sx=1-.035*(1-air);
  sy=blend(1,blend(.9,sy,up),down);sx=blend(1,blend(1.06,sx,up),down);
  return {travel:smooth(k),lift:h*air,sy,sx,tilt:.05*Math.sin(Math.PI*k)-.02*(1-up),shadow:1-.25*air};
 }
 if(u<.84){const d=Math.sin(Math.PI*span(u,.74,.84));return {...rest,travel:1,sy:1-.1*d,sx:1+.06*d};}
 const s=settle(span(u,.84,1));return {...rest,travel:1,sy:1-.05*s,sx:1+.025*s};
}
export const GAITS={
 walk:{duration:()=>440,at:walk},
 glide:{duration:squares=>Math.min(480,350+28*squares),at:glide},
 hop:{duration:()=>420,at:hop},
 paintedWalk:{at:u=>({...rest,travel:clamp(u,0,1)})},
};
// Figures by art name. Knight (leap) and Paladin (charge) keep their own quiet moves.
export const GAIT_OF={king:'walk',guard:'walk',maester:'walk',ogre:'walk',beast:'walk',archer:'walk',rook:'glide',bishop:'glide',queen:'glide',pawn:'hop'};

// Selected figure: a slow breath (stretch up, slim a touch) with a small shadow pulse. Fades in
// over 300 ms so the selection never pops.
export const IDLE={period:2400,fadeIn:300};
export function idleAt(ms){
 const k=smooth(ms/IDLE.fadeIn),s=(1-Math.cos(2*Math.PI*ms/IDLE.period))/2;
 return {sx:1-.012*s*k,sy:1+.024*s*k,lift:1.5*s*k,shadow:1-.1*s*k};
}
