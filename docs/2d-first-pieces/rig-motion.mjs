export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export function poseAt(t){t=clamp(t,0,1);return {draw:t<.48?smooth(t/.48):t<.60?1:t<.68?1-smooth((t-.60)/.08):0,lift:t<.18?smooth(t/.18):t<.73?1:1-smooth((t-.73)/.27),recoil:t>=.6&&t<.85?Math.sin((t-.6)/.25*Math.PI)*Math.exp(-(t-.6)*8):0,flight:clamp((t-.62)/.2,0,1),phase:t===0?'Ready':t<.18?'Raise':t<.48?'Draw':t<.60?'Hold':t<.68?'Release':t<.82?'Flight':'Recover'};}
export function elbow(a,b,l1,l2,sign=1){const dx=b.x-a.x,dy=b.y-a.y,d=clamp(Math.hypot(dx,dy),.001,l1+l2-.001);const angle=Math.atan2(dy,dx)+sign*Math.acos(clamp((d*d+l1*l1-l2*l2)/(2*d*l1),-1,1));return {x:a.x+Math.cos(angle)*l1,y:a.y+Math.sin(angle)*l1};}

// Screen-space projections: the drawing elbow turns behind the shoulder as the string is pulled.
export function armsAt(p,aim){
  const c=Math.cos(aim),s=Math.sin(aim),recoil=p.recoil*8;
  const bs={x:404-recoil,y:315},ds={x:293-recoil,y:317};
  const x=66+p.lift*154,y=150-p.lift*160;
  const hand={x:bs.x+c*x-s*y,y:bs.y+s*x+c*y};
  const bw={x:hand.x-c*24,y:hand.y-s*24};
  const be=elbow(bs,bw,108,94);
  const nock=-95-p.draw*115;
  const stringHand={x:hand.x+c*nock,y:hand.y+s*nock};
  const dw={x:stringHand.x-c*24,y:stringHand.y-s*24};
  const ex=90*p.lift-128*p.draw,ey=93-65*p.lift-36*p.draw+60*Math.sin(Math.PI*p.draw);
  const de={x:ds.x+c*ex-s*ey,y:ds.y+s*ex+c*ey};
  return {bs,ds,hand,bw,be,nock,stringHand,dw,de};
}
