// The king starts with the original growth, then the painted growth; each keeps its full cycle.
export const MUD_CYCLE=8000;
export function mudCycle(t){
 const phase=Math.max(0,t)%(MUD_CYCLE*2),local=phase%MUD_CYCLE;
 return {painted:phase>=MUD_CYCLE,t:local,fade:smooth(local/300)*(1-smooth((local-(MUD_CYCLE-400))/400))};
}
// Sparse planting leaves a clear opening in front of the king's feet.
// Tufts: x, depth, width, height, painted variant, delay, peak time (one eight-second loop).
export const MUD_TUFTS=[
 [-46,-.15,15,15,0,.03,.31],[-36,-.7,16,17,1,.07,.29],[-23,-.85,13,13,2,.02,.35],
 [-9,-.9,12,12,0,.1,.33],[14,-.85,15,14,2,.05,.4],[28,-.75,15,18,1,.12,.32],
 [43,-.3,15,16,2,.04,.36],[-51,.17,13,11,0,.09,.39],[-37,.26,13,12,2,.01,.28],
 [35,.19,13,12,0,.08,.35],[49,.36,14,10,2,.13,.4],[-44,.62,13,9,1,.06,.3],
 [-30,.81,11,7,0,.14,.36],[33,.76,11,7,2,.11,.31],[-17,-.3,11,9,1,.04,.38],
 [21,-.25,11,10,0,.1,.3],[-55,-.47,10,9,2,.15,.32]
];
// Each path has two cubic spans. Its coordinates are board units from the floor point.
export const MUD_VINES=[
 {front:false,start:.21,rise:.16,hold:.1,sink:.18,seed:1,path:[[-43,-3],[-50,-10],[-48,-28],[-39,-32],[-27,-37],[-23,-18],[-31,-8]]},
 {front:false,start:.35,rise:.19,hold:.08,sink:.16,seed:2,path:[[32,-11],[23,-16],[26,-25],[37,-24],[48,-23],[51,-10],[45,-3]]},
 {front:true,start:.45,rise:.13,hold:.07,sink:.15,seed:3,path:[[-44,10],[-50,1],[-45,-13],[-38,-11],[-30,-10],[-34,6],[-25,9]]}
];
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const phase=(u,lag)=>u<lag?-1:(u-lag)%1;
export function mudTuftLife(u,lag,peak){
 const p=phase(u,lag);if(p<0)return 0;
 return .13+.87*smooth(p/peak)*(1-smooth((p-.56)/.44));
}
export function mudVineLife(u,v){
 const p=phase(u,0)-v.start;
 return smooth(p/v.rise)*(1-smooth((p-v.rise-v.hold)/v.sink));
}
export function mudVinePoint(v,f){
 const second=f>.5,t=second?(f-.5)*2:f*2,ps=v.path.slice(second?3:0,second?7:4),q=1-t;
 return {x:q*q*q*ps[0][0]+3*q*q*t*ps[1][0]+3*q*t*t*ps[2][0]+t*t*t*ps[3][0],
  y:q*q*q*ps[0][1]+3*q*q*t*ps[1][1]+3*q*t*t*ps[2][1]+t*t*t*ps[3][1]};
}
