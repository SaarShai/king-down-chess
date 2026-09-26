export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export function poseAt(t){t=clamp(t,0,1);return {draw:t<.48?smooth(t/.48):t<.60?1:t<.68?1-smooth((t-.60)/.08):0,lift:t<.18?smooth(t/.18):t<.73?1:1-smooth((t-.73)/.27),recoil:t>=.6&&t<.85?Math.sin((t-.6)/.25*Math.PI)*Math.exp(-(t-.6)*8):0,flight:clamp((t-.62)/.2,0,1),phase:t===0?'Ready':t<.18?'Raise':t<.48?'Draw':t<.60?'Hold':t<.68?'Release':t<.82?'Flight':'Recover'};}
export function elbow(a,b,l1,l2,sign=1){const dx=b.x-a.x,dy=b.y-a.y,d=clamp(Math.hypot(dx,dy),.001,l1+l2-.001);const angle=Math.atan2(dy,dx)+sign*Math.acos(clamp((d*d+l1*l1-l2*l2)/(2*d*l1),-1,1));return {x:a.x+Math.cos(angle)*l1,y:a.y+Math.sin(angle)*l1};}
