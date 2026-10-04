// How a piece taken by a king dies, by the king who takes it (opt-in: scene.setLively({captures:true})).
//   frost   ice climbs up the piece from its feet and pulls it down into a frozen patch
//   flame   lava climbs up the piece and pulls it down into a glowing pool
//   mud     vines wind up over the piece and pull it down into the earth
//   shadow  a big crack opens across the square and swallows the piece, then closes
//   spirit  the piece turns into a glowing silhouette of itself (white for the ivory king, black for the
//           charcoal one) and implodes in a flash
// Stratus (not chosen yet) keeps the old shatter. The king's own motion is blows.mjs KING_BLOW; these
// effects start at its strike. Times are ms after the strike, at Normal speed (Fast halves them).
// Units are board units (the board is 960 wide).
import {clamp} from '../painted-mesh.mjs';

export const DEATHS={
 frost:{climb:380,sink:[450,850],end:1000},
 flame:{climb:380,sink:[450,850],end:1000},
 mud:{climb:420,sink:[480,880],end:1000},
 shadow:{open:260,sink:[200,720],close:[720,940],end:960},
 spirit:{fill:260,implode:[380,640],flash:[600,900],end:900},
};
export const THEMED=Object.keys(DEATHS);
const TAU=Math.PI*2;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const easeIn=t=>{t=clamp(t,0,1);return t*t*t;};
const span=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const rand=(i,j=0)=>{const x=Math.sin(i*127.1+j*311.7+.5)*43758.5453;return x-Math.floor(x);};
// A small canvas for soft glows (an eighth of the board).
let glowCanvas=null;

/**
 * Draws a dying piece. d: {theme, side (the king's army), t (ms since the strike), foot, top (y of its
 * highest point), hit (its middle), size and headroom (the board's), draw(ctx, {dy, q, wobble}) (draws the
 * piece into the effect layer, dy below its square, scaled by q about its middle), clear() (empties the
 * effect layer and returns its context), layer(clip) (puts the effect layer on the board; nothing shows
 * below y = clip)}.
 * out is the board context, at board units.
 */
export function drawDeath(out,d){
 const D=DEATHS[d.theme],t=d.t;
 if(t>=D.end)return;
 if(d.theme==='spirit')return implode(out,d);
 if(d.theme==='shadow')return swallow(out,d);
 const climb=ease(t/D.climb),sink=easeIn(span(t,...D.sink)),height=d.foot.y-d.top,floor=d.foot.y+3;
 const fade=1-span(t,D.sink[1],D.end);
 // The floor it goes into, under the piece.
 if(d.theme==='frost')frozenPatch(out,d,climb*fade);
 else if(d.theme==='flame')lavaPool(out,d,climb*fade,t);
 else earthHole(out,d,climb*fade);
 if(t>=D.sink[1])return;
 const dy=sink*(height+12),c=d.clear();
 d.draw(c,{dy});
 // The material climbs to `level` (y in the layer), with a ragged top edge.
 const level=d.foot.y+dy-height*climb*1.08;
 c.save();c.globalCompositeOperation='source-atop';
 if(d.theme==='frost')iceCoat(c,d,level,dy);
 else if(d.theme==='flame')lavaCoat(c,d,level,dy,t);
 c.restore();
 if(d.theme==='mud')vines(c,d,climb,dy);
 else if(d.theme==='frost')iceShards(c,d,climb,dy);
 d.layer(floor);
 if(d.theme==='flame')embers(out,d,t);
}

function raggedTop(c,d,level,dy,amp,waves,seed){
 const x0=d.foot.x-70,x1=d.foot.x+70,n=14;
 c.beginPath();c.moveTo(x0,d.foot.y+dy+20);
 for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,j=(rand(seed,i)-.5)*amp+Math.sin(i/n*TAU*waves+seed)*amp*.6;c.lineTo(x,level+j);}
 c.lineTo(x1,d.foot.y+dy+20);c.closePath();
}

// —— Frost ——
function iceCoat(c,d,level,dy){
 raggedTop(c,d,level,dy,9,2,1);
 const g=c.createLinearGradient(0,level,0,d.foot.y+dy);g.addColorStop(0,'rgba(236,248,255,.92)');g.addColorStop(.35,'rgba(176,220,250,.85)');g.addColorStop(1,'rgba(120,180,230,.9)');
 c.fillStyle=g;c.fill();
 c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=1.6;c.stroke();
 // Facets: a few pale diagonal glints.
 c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();
 for(let i=0;i<6;i++){const x=d.foot.x-26+i*10,y=level+18+rand(i,5)*30;if(y>d.foot.y+dy)continue;c.moveTo(x,y);c.lineTo(x+7,y-9);}
 c.stroke();
}
// Shards growing out of the floor round its feet.
function iceShards(c,d,climb,dy){
 const k=ease(climb*1.4);if(k<=0)return;
 for(let i=0;i<9;i++){
  const x=d.foot.x+(i/8*2-1)*30+(rand(i,1)-.5)*6,y=d.foot.y+dy+2+rand(i,2)*3,h=(14+16*rand(i,3))*k,w=3+3*rand(i,4),lean=(x-d.foot.x)*.25;
  c.fillStyle=i%2?'rgba(206,236,255,.9)':'rgba(160,210,245,.88)';c.strokeStyle='rgba(60,110,160,.7)';c.lineWidth=.9;
  c.beginPath();c.moveTo(x-w,y);c.lineTo(x+lean,y-h);c.lineTo(x+w,y);c.closePath();c.fill();c.stroke();
 }
}
function frozenPatch(out,d,k){
 if(k<=.01)return;
 out.save();out.globalAlpha=k;out.translate(d.foot.x,d.foot.y-2);out.scale(48,14);
 const g=out.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(40,80,120,.9)');g.addColorStop(.55,'rgba(150,205,240,.85)');g.addColorStop(.8,'rgba(225,244,255,.7)');g.addColorStop(1,'rgba(225,244,255,0)');
 out.fillStyle=g;out.beginPath();out.arc(0,0,1,0,TAU);out.fill();out.restore();
}

// —— Flame ——
function lavaCoat(c,d,level,dy,t){
 raggedTop(c,d,level,dy,7,3+Math.sin(t/90),2);
 const g=c.createLinearGradient(0,level,0,d.foot.y+dy);g.addColorStop(0,'rgba(255,224,110,.95)');g.addColorStop(.25,'rgba(255,128,24,.95)');g.addColorStop(1,'rgba(140,28,8,.95)');
 c.fillStyle=g;c.fill();
 // Dark crust drifting down through the glow.
 c.fillStyle='rgba(50,16,8,.55)';
 for(let i=0;i<10;i++){const x=d.foot.x+(rand(i,7)*2-1)*30,y=level+12+((rand(i,8)*80+t*.05)%Math.max(10,d.foot.y+dy-level)),r=2+3*rand(i,9);c.beginPath();c.ellipse(x,y,r*1.6,r,0,0,TAU);c.fill();}
 c.strokeStyle='rgba(255,240,160,.95)';c.lineWidth=1.8;raggedTop(c,d,level,dy,7,3+Math.sin(t/90),2);c.stroke();
}
function lavaPool(out,d,k,t){
 if(k<=.01)return;
 out.save();out.globalAlpha=k;out.translate(d.foot.x,d.foot.y-2);out.scale(46,14);
 const g=out.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(255,236,140,1)');g.addColorStop(.4,'rgba(255,120,20,.95)');g.addColorStop(.8,'rgba(120,24,6,.85)');g.addColorStop(1,'rgba(60,12,4,0)');
 out.fillStyle=g;out.beginPath();out.arc(0,0,1,0,TAU);out.fill();
 out.globalCompositeOperation='lighter';out.globalAlpha=k*(.35+.15*Math.sin(t/70));out.scale(1.5,1.8);out.fillStyle='rgba(255,140,40,.6)';out.beginPath();out.arc(0,0,1,0,TAU);out.fill();
 out.restore();
}
function embers(out,d,t){
 out.save();out.globalCompositeOperation='lighter';
 for(let i=0;i<10;i++){
  const u=clamp((t-60*i)/600,0,1);if(u<=0||u>=1)continue;
  const x=d.foot.x+(rand(i,3)*2-1)*34+Math.sin(u*6+i)*4,y=d.foot.y-2-u*(50+40*rand(i,4));
  out.globalAlpha=(1-u)*.9;out.fillStyle=i%2?'#ffd27a':'#ff8a2a';out.beginPath();out.arc(x,y,1.3+rand(i,5),0,TAU);out.fill();
 }
 out.restore();
}

// —— Mud ——
function vines(c,d,climb,dy){
 const height=(d.foot.y-d.top)*climb*1.05,base=d.foot.y+dy;if(height<1)return;
 c.save();c.lineCap='round';c.lineJoin='round';
 for(let v=0;v<5;v++){
  const x0=d.foot.x+(v/4*2-1)*24,phase=rand(v,1)*TAU,amp=14+8*rand(v,2),turns=1.6+rand(v,3),pts=[];
  for(let i=0;i<=24;i++){const f=i/24,y=base-f*height;pts.push([x0+(d.foot.x-x0)*f*.7+Math.sin(phase+f*TAU*turns)*amp*(1-.35*f),y]);}
  for(const [colour,width] of [['#22380f',4.2],['#3f6a1c',2.8],['#6f9d36',1.1]]){
   c.strokeStyle=colour;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  }
  c.fillStyle='#5a8d2a';
  for(let i=3;i<pts.length;i+=4){const [x,y]=pts[i],s=i%8?1:-1;c.save();c.translate(x,y);c.rotate(s*.8+phase);c.beginPath();c.ellipse(4*s,0,4.2,2,0,0,TAU);c.fill();c.restore();}
 }
 c.restore();
}
function earthHole(out,d,k){
 if(k<=.01)return;
 out.save();out.globalAlpha=k;out.translate(d.foot.x,d.foot.y-2);out.scale(44,13);
 const g=out.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(20,12,4,.95)');g.addColorStop(.6,'rgba(52,34,14,.9)');g.addColorStop(.85,'rgba(96,66,34,.7)');g.addColorStop(1,'rgba(96,66,34,0)');
 out.fillStyle=g;out.beginPath();out.arc(0,0,1,0,TAU);out.fill();out.restore();
 // Crumbs of soil thrown up round the rim.
 out.save();out.globalAlpha=k;out.fillStyle='#5b3f1f';
 for(let i=0;i<10;i++){const a=i/10*TAU,x=d.foot.x+Math.cos(a)*44*(.9+.2*rand(i,1)),y=d.foot.y-2+Math.sin(a)*13;out.beginPath();out.arc(x,y,1.4+1.2*rand(i,2),0,TAU);out.fill();}
 out.restore();
}

// —— Shadow ——
// A jagged chasm across the square, `open` 0..1.
function chasm(out,d,open,seed=3){
 if(open<=.01)return;
 const n=12,w=50*Math.min(1,open*1.3),h=15*open,top=[],bottom=[];
 for(let i=0;i<=n;i++){const u=i/n*2-1,o=(1-u*u)**.6;top.push([d.foot.x+u*w+(rand(seed,i)-.5)*5,d.foot.y-2-h*o*(.6+.7*rand(seed,i+20))]);bottom.push([d.foot.x+u*w+(rand(seed,i+40)-.5)*5,d.foot.y-2+h*o*(.35+.5*rand(seed,i+60))]);}
 out.save();
 out.fillStyle='rgba(70,30,110,.35)';out.beginPath();out.ellipse(d.foot.x,d.foot.y-2,w+6,h+5,0,0,TAU);out.fill();
 out.fillStyle='#040306';out.beginPath();top.forEach(([x,y],i)=>i?out.lineTo(x,y):out.moveTo(x,y));for(let i=n;i>=0;i--)out.lineTo(...bottom[i]);out.closePath();out.fill();
 out.strokeStyle='rgba(226,214,190,.55)';out.lineWidth=1.2;out.beginPath();top.forEach(([x,y],i)=>i?out.lineTo(x,y-.8):out.moveTo(x,y-.8));out.stroke();
 // Cracks running off across the stone.
 out.strokeStyle='rgba(6,4,10,.85)';out.lineWidth=1;out.beginPath();
 for(let k=0;k<6;k++){let x=d.foot.x+(k%2?1:-1)*w*(.4+.12*k),y=d.foot.y-2,a=(k%2?0:Math.PI)+(rand(seed,k+80)-.5)*1.4;out.moveTo(x,y);for(let i=0;i<3;i++){x+=Math.cos(a)*7*open;y+=Math.sin(a)*4*open;a+=(rand(seed,k*3+i)-.5);out.lineTo(x,y);}}
 out.stroke();out.restore();
}
function swallow(out,d){
 const D=DEATHS.shadow,t=d.t,open=ease(t/D.open)*(1-ease(span(t,...D.close))),sink=easeIn(span(t,...D.sink));
 chasm(out,d,open);
 if(t>=D.sink[1])return;
 const height=d.foot.y-d.top,c=d.clear();
 d.draw(c,{dy:sink*(height+14),wobble:Math.sin(t/45)*2*(1-sink)});
 // It darkens as it goes down.
 c.save();c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(8,4,14,${.75*sink})`;c.fillRect(d.foot.x-90,d.top-40,180,height+80);c.restore();
 d.layer(d.foot.y+2);
 // Dark wisps rising out of the crack.
 out.save();
 for(let i=0;i<6;i++){const u=clamp((t-80*i)/520,0,1);if(u<=0||u>=1)continue;const x=d.foot.x+(rand(i,9)*2-1)*36,y=d.foot.y-4-u*44;out.globalAlpha=(1-u)*.5*open;out.fillStyle='#120a1c';out.beginPath();out.ellipse(x+Math.sin(u*5+i)*5,y,5+6*u,3+4*u,0,0,TAU);out.fill();}
 out.restore();
}

// —— Spirit ——
function implode(out,d){
 const D=DEATHS.spirit,t=d.t,fill=ease(t/D.fill),q=1-easeIn(span(t,...D.implode)),light=!d.side;
 const colour=light?'255,250,236':'10,8,14',glow=light?'255,226,150':'190,170,255';
 if(t<D.implode[1]){
  const c=d.clear();d.draw(c,{q});
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(${colour},${fill})`;c.fillRect(d.hit.x-120,d.top-60,240,d.foot.y-d.top+120);c.restore();
  // A soft glow from a small copy of the silhouette, added round it.
  const n=d.size/8;glowCanvas??=document.createElement('canvas');if(glowCanvas.width!==n){glowCanvas.width=n;glowCanvas.height=Math.round(n*(d.size+d.headroom)/d.size);}
  const g=glowCanvas.getContext('2d');g.clearRect(0,0,glowCanvas.width,glowCanvas.height);g.drawImage(c.canvas,0,0,glowCanvas.width,glowCanvas.height);
  g.globalCompositeOperation='source-in';g.fillStyle=`rgb(${glow})`;g.fillRect(0,0,glowCanvas.width,glowCanvas.height);g.globalCompositeOperation='source-over';
  out.save();out.globalCompositeOperation='lighter';out.globalAlpha=fill*(light?.9:.75)*(.6+.4*q);
  // The layer covers the board and its headroom; drawn again a little larger about the piece's middle.
  for(const s of [1,1.12])out.drawImage(glowCanvas,d.hit.x-d.hit.x*s,d.hit.y-(d.hit.y+d.headroom)*s,d.size*s,(d.size+d.headroom)*s);
  out.restore();
  d.layer(Infinity);
 }
 // The flash where it vanished: a ring and short rays.
 const f=span(t,...D.flash);if(f<=0||f>=1)return;
 out.save();out.globalCompositeOperation=light?'lighter':'source-over';out.translate(d.hit.x,d.hit.y);
 out.globalAlpha=1-f;out.strokeStyle=light?'rgba(255,240,190,.95)':'rgba(30,20,50,.9)';out.lineWidth=2.4*(1-f)+.6;
 out.beginPath();out.arc(0,0,6+30*ease(f),0,TAU);out.stroke();
 out.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+.2,r0=4+14*f,r1=10+34*ease(f);out.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);out.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);}out.stroke();
 if(!light){out.globalCompositeOperation='lighter';out.globalAlpha=(1-f)*.6;out.strokeStyle='rgba(200,180,255,.7)';out.lineWidth=1;out.beginPath();out.arc(0,0,7+30*ease(f),0,TAU);out.stroke();}
 out.restore();
}
