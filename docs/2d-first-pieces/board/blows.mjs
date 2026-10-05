// Capture "blows" for pieces whose art is one rigid pose: approach, wind up,
// tilt into the victim about the feet, apply a victim effect, recover, step in.
import {clamp} from '../painted-mesh.mjs';
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const BLOW={approach:400,wind:560,strike:660,hold:900,duration:1150};
// A king's capture with his own death for the victim (king-captures.mjs): the same strike, then he waits
// for it to go under before he steps in.
export const KING_BLOW={...BLOW,hold:1420,duration:1660};
// gap: how far short of the victim's feet the attacker stops (px on the 960 board).
export const blows={
 rook:{tilt:.2,gap:62,effect:'smash',verb:'Swinging the tower…'},
 queen:{tilt:.07,gap:70,effect:'topple',verb:'Commanding…'},
 king:{tilt:.1,gap:58,effect:'shatter',verb:'Raising the ice blade…'},
};
export function tiltAt(ms,tilt,b=BLOW){
 if(ms<=b.approach||ms>=b.duration)return 0;
 if(ms<b.wind)return -.35*tilt*smooth((ms-b.approach)/(b.wind-b.approach));
 if(ms<b.strike){const t=(ms-b.wind)/(b.strike-b.wind);return -.35*tilt+1.35*tilt*t*t;}
 if(ms<b.hold)return tilt;
 return tilt*(1-smooth((ms-b.hold)/(b.duration-b.hold)));
}
// Where the attacker's feet are: approach stop, hold, then into the square.
export function footAt(ms,from,stop,to,b=BLOW){
 const mix=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});
 if(ms<b.approach)return mix(from,stop,smooth(ms/b.approach));
 if(ms<b.hold)return stop;
 return mix(stop,to,smooth((ms-b.hold)/(b.duration-b.hold)));
}
// Stand beside the victim, on the side the attacker comes from, so neither
// figure hides the other; straight file moves use the army's facing side.
export function stopPoint(from,victim,gap,side=1){
 const away=Math.sign(victim.x-from.x)||side;
 return {x:victim.x-away*gap,y:victim.y+2};
}
