export const clamp = n => Math.max(0, Math.min(1,n));
export const ease = n => {n=clamp(n);return n*n*(3-2*n);};
const hash = i => {const n=Math.sin(i*127.1+71)*43758.5453;return n-Math.floor(n);};
const mix = (a,b,t) => a+(b-a)*t;
const pulse = n => n>0&&n<1?Math.sin(n*Math.PI):0;
function noise(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y),u=ease(x-ix),v=ease(y-iy);
 return mix(mix(hash(ix+iy*157+seed),hash(ix+1+iy*157+seed),u),mix(hash(ix+(iy+1)*157+seed),hash(ix+1+(iy+1)*157+seed),u),v);
}
const fog = (x,y,cx,cy,rx,ry) => Math.exp(-2*((x-cx)**2/rx**2+(y-cy)**2/ry**2));

// Sample a light-density field, not a filled outline. Warped noise leaves holes through every layer.
function lightTexture(kind){
 const shelter=kind==='holy'||kind==='mercy',mercy=kind==='mercy';
 const w=shelter?220:100,h=shelter?212:116,canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;const c=canvas.getContext('2d'),seed=kind==='holy'?31:mercy?87:kind==='mimic'?123:167;
 for(let py=0;py<h;py+=2)for(let px=0;px<w;px+=2){
  const x=px-w/2,y=py-(shelter?180:h/2);
  const warp=noise(x*.035,y*.035,seed)*2-1,xx=x+warp*11,yy=y+(noise(x*.04,y*.025,seed+50)-.5)*16;
  let density;
  if(shelter){
   const sy=mercy?yy/.73:yy,height=clamp((-sy-10)/140),bend=Math.sin(height*3.7);
   density=fog(xx,sy,-36-bend*17,-78,21,79)+fog(xx,sy,37+bend*9,-69,20,66)*(mercy?.06:.78);
   density+=fog(xx,sy,-16,-133,31,21)*.88+fog(xx,sy,21,-120,26,19)*(mercy?.04:.7);
   density+=fog(xx,sy,-56,-45,16,26)*.3+fog(xx,sy,43,-17,23,12)*(mercy?.06:.3);
   density*=1-.9*fog(xx,sy,0,-64,26,61);
  }else{
   const curl=Math.sin(yy*.054+seed)*12;
   density=fog(xx,yy,curl,-4,kind==='mimic'?22:17,38)+fog(xx,yy,-curl+10,20,12,16)*.42;
  }
  const coarse=noise(xx*.065,yy*.059,seed+100),fine=noise(xx*.19,yy*.17,seed+300),grain=hash(px+py*227+seed);
  const breakup=ease((coarse*.72+fine*.28-.32)/.4);
  const filament=Math.exp(-(((noise(xx*.027+warp*.4,yy*.047,seed+500)-.53)/.045)**2));
  const alpha=Math.min(.7,Math.sqrt(density)*.7)*(breakup*.26+filament*.92)*(.92+grain*.08);
  if(alpha<.009)continue;
  const heat=clamp(density*.5+filament*.6+fine*.25),teal=kind==='control',ice=kind==='mimic';
  const colour=teal?[mix(66,192,heat),mix(172,244,heat),mix(163,230,heat)]:ice?[mix(185,248,heat),mix(202,248,heat),mix(199,237,heat)]:[255,mix(210,252,heat),mix(151,234,heat)];
  c.fillStyle=`rgba(${colour.map(Math.round).join(',')},${alpha})`;c.fillRect(px,py,2,2);
 }
 return canvas;
}
const holy=lightTexture('holy'),mercyLight=lightTexture('mercy'),control=lightTexture('control'),mimic=lightTexture('mimic'),warm=lightTexture('warm');
function mote(c,x,y,size,alpha,colour='#fff4cc'){
 if(alpha<=0)return;c.save();c.globalAlpha*=alpha;
 const g=c.createRadialGradient(x,y,0,x,y,size*2.5);g.addColorStop(0,colour);g.addColorStop(.18,colour+'bf');g.addColorStop(1,colour+'00');
 c.fillStyle=g;c.fillRect(x-size*2.5,y-size*2.5,size*5,size*5);c.restore();
}
function fragment(c,x,y,angle,size,texture,alpha){
 if(alpha<=0)return;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(texture,-size*.55,-size*.75,size*1.1,size*1.5);c.restore();
}
export function drawPaintedShelter(c,source,target,frame,mercy,pawn){
 const p=frame.reduced?1:clamp(frame.progress),formed=ease((p-.16)/.22);
 if(p<=0)return;
 const flare=frame.reduced?0:pulse((p-.12)/.45),openSide=Math.sign(pawn.x-target.x)||-1;
 const texture=mercy?mercyLight:holy;
 if(!frame.front){
  if(formed>0){
   c.save();c.translate(target.x,target.y);if(mercy)c.scale(openSide,1);
   c.scale(.8+formed*.2,.72+formed*.28);c.globalAlpha*=formed*(.86+flare*.14);c.drawImage(texture,-110,-180);c.restore();
  }
  // The source keeps a smaller, quiet remnant of the same light.
  c.save();c.translate(source.x,source.y-29);c.scale(.39,.47);c.globalAlpha*=ease(p/.12)*(.4+flare*.12);c.drawImage(holy,-110,-180);c.restore();
  return;
 }
 if(!frame.reduced){
  const gather=ease(p/.06)*(1-ease((p-.25)/.12));
  for(let i=0;i<3;i++){
   const v=ease((p-.045-i*.028)/.23),side=i%2?-1:1;
   fragment(c,source.x+(target.x-source.x)*v+side*Math.sin(v*Math.PI)*23,source.y-74+(target.y-source.y)*v-Math.sin(v*Math.PI)*25,-.5+v*.9,35+i*5,warm,gather*.85);
  }
  for(const side of [-1,1]){
   const curl=clamp((p-.23-(side+1)*.025)/.34),life=pulse(curl);
   fragment(c,target.x+side*(42-Math.sin(curl*Math.PI)*8),target.y-28-curl*(mercy?58:91),side*(-.4+curl*.9),46,warm,life*(mercy&&side===openSide?.06:.6));
  }
  for(let i=0;i<6;i++){
   const age=clamp((p-.27-hash(i)*.14)/.4),life=pulse(age),side=i%2?-1:1;
   const x=target.x+side*(30+hash(i+30)*28)+Math.sin(age*2.4+i)*7,y=target.y-29-hash(i+50)*(mercy?54:85)-age*19;
   mote(c,x,y,1.2+hash(i+70)*1.1,life*(mercy&&side===openSide?.06:.6));
  }
 }
 // This broken low light stays below the face, weapon and static rule label.
 c.save();c.translate(target.x,target.y+5);if(mercy)c.scale(openSide,1);c.scale(1,.16);c.globalAlpha*=formed*.28;c.drawImage(texture,-110,-100,220,106);c.restore();
}
export function drawPaintedBorrow(c,scene,id,e,layer){
 const t=e.t;if(t<=0||t>=1||layer==='under')return;
 const a=scene.foot(e.lender),b=scene.foot(e.move.from),d=scene.foot(e.move.to),u=clamp(e.travel),echo=id==='Mimic',texture=echo?mimic:control;
 const dx=d.x-b.x,dy=d.y-b.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,angle=Math.atan2(dy,dx)+Math.PI/2;
 const gathering=ease(t/.07)*(1-ease((t-.19)/.12));
 for(let i=0;i<3;i++){
  const v=ease((t-.025-i*.028)/.19);
  fragment(c,a.x+(b.x-a.x)*v+(i-1)*8,a.y-57+(b.y-a.y)*v-Math.sin(v*Math.PI)*(22+i*8),-.5+v*.8+i*.18,62+i*4,texture,gathering*(echo?.66:.9));
 }
 const hold=ease((t-.205)/.07)*(1-ease((t-.62)/.14));
 for(let i=0;i<3;i++){
  const trail=Math.max(0,u-(i+1)*(echo?.045:.025)),side=i%2?-1:1,spread=echo?36+i*4:29+i*3;
  const x=b.x+dx*trail+nx*side*spread,y=b.y+dy*trail-49+ny*side*spread;
  fragment(c,x,y,angle+side*(echo?.28:.12),80-i*8,texture,hold*(echo?.58-i*.1:.9-i*.17));
 }
 for(let i=0;i<5;i++){
  const age=clamp((t-.62-hash(i+10)*.07)/.23),life=pulse(age);
  mote(c,d.x+(hash(i+100)-.5)*63+Math.sin(age*2+i)*7,d.y-25-hash(i+120)*57-age*15,1.1+hash(i+130),life*(echo?.36:.5),echo?'#eff5ee':'#b5eee0');
 }
}
