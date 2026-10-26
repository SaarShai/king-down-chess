// FILM synthesizes the RGBA frames between the five painted keys; one frame draws each hand.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const HANDS=[
 {x:-33,depth:-.55,lean:-.18,size:1.04,start:.04,duration:.35},
 {x:33,depth:.35,lean:.18,size:.98,start:.46,duration:.29},
 {x:-18,depth:.9,lean:-.1,size:.91,start:.83,duration:.27},
];

/** Three unequal lives, with pauses and at most two hands out at once. */
export function shadowHandsAt(t,period){
 const out=[],clock=((t%period)+period)%period;
 for(const [i,h] of HANDS.entries()){
  const elapsed=(clock-h.start*period+period)%period;if(elapsed>=h.duration*period)continue;
  const u=elapsed/(h.duration*period);
  const rise=smooth((u-.06)/.24)*(1-smooth((u-.68)/.28));
  const open=smooth(u/.06)*(1-smooth((u-.94)/.06));
  const frame=shadowHandFrame(u);
  out.push({...h,i,u,rise,open,frame});
 }
 return out;
}

// Sixteen FILM intervals per gap, with all keys registered to the same wrist in a 192 px cell.
const CELL=192,COLS=8,ROWS=9,PIVOT={x:96,y:176};
const KEYS=[.12,.34,.50,.65,.85];
export function shadowHandFrame(u){
 if(u<=KEYS[0])return 0;
 for(let i=0;i<KEYS.length-1;i++)if(u<KEYS[i+1])return i*16+Math.round(16*smooth((u-KEYS[i])/(KEYS[i+1]-KEYS[i])));
 return 64;
}

/** Draw one complete painted hand, clipped by the near edge of its floor crevice. */
export function drawPaintedShadowHand(ctx,image,x,y,h){
 if(h.rise<=.01||h.alpha<=.001)return;
 const sx=(h.frame%COLS)*CELL,sy=(h.side*ROWS+Math.floor(h.frame/COLS))*CELL,k=.2625*h.size;
 ctx.save();ctx.globalAlpha*=h.alpha;
 ctx.beginPath();ctx.moveTo(x-60,y-72);ctx.lineTo(x+60,y-72);
 ctx.lineTo(x+60,h.lip.at(-1)[1]);
 for(let i=h.lip.length-1;i>=0;i--)ctx.lineTo(...h.lip[i]);
 ctx.lineTo(x-60,h.lip[0][1]);ctx.closePath();ctx.clip();
 ctx.translate(x,y+(1-h.rise)*43*h.size);ctx.rotate(h.angle);ctx.scale(h.flip?-1:1,1);
 ctx.drawImage(image,sx,sy,CELL,CELL,-PIVOT.x*k,-PIVOT.y*k,CELL*k,CELL*k);
 ctx.restore();
 ctx.save();ctx.globalAlpha*=h.alpha;
 ctx.strokeStyle='rgba(13,10,15,.9)';ctx.lineWidth=2*h.size;ctx.lineJoin='round';
 ctx.beginPath();h.lip.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();ctx.restore();
}
