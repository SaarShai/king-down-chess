import {clamp,paintTriangle,rotate} from './painted-mesh.mjs';

export const ANCHOR={x:576,y:1018};
export const HIT={x:576,y:540};
export const figures={
 queen:{duration:1250,origins:[[103,23],[215,20]],mirror:false,bands:[0,520,600,680,760,840,925,1024],shift:{x:18,y:7},fixed:925,rigid:520,scale:.12},
 paladin:{duration:1450,origins:[[224,108],[224,108]],mirror:false,bands:[0,640,670,700,730,760,780,1024],shift:{x:28,y:4},fixed:780,rigid:640,scale:.14},
 maester:{duration:1100,origins:[[268,56],[165,54]],mirror:true,scale:.105},
 // King and Beast: one rigid pose each; the whole figure leans about the feet.
 king:{duration:1100,origins:[[138,16],[228,16]],mirror:false,scale:.122},
 beast:{duration:1000,origins:[[154,54],[149,54]],mirror:false,scale:.15}
};
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function actionAt(progress){
 const t=clamp(progress,0,1);
 if(t===0||t===1)return 0;
 if(t<.18)return -.12*smooth(t/.18);
 if(t<.5)return -.12+1.12*smooth((t-.18)/.32);
 if(t<.72)return 1;
 return 1-smooth((t-.72)/.28);
}
// The complete head, arms, hands and equipment move together. Only cloth or
// the short leg transition bends; actual soles/hem stay fixed.
export function deformPoint(name,point,amount){
 const spec=figures[name],weight=smooth((spec.fixed-point.y)/(spec.fixed-spec.rigid));
 return {x:point.x+spec.shift.x*amount*weight,y:point.y+spec.shift.y*amount*weight};
}
export function registeredPoint(name,side,point,amount=0){
 const spec=figures[name],[x,y]=spec.origins[side];
 const p=!figures[name].bands?point:deformPoint(name,point,amount);
 const registered={x:x+(spec.mirror?768-p.x:p.x),y:y+p.y};
 return !figures[name].bands?rotate(registered,-amount*.022,ANCHOR):registered;
}
export function drawCourt(canvas,image,name,side,extension=0){
 const ctx=canvas.getContext('2d'),spec=figures[name],amount=clamp(extension,-.12,1);
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();
 if(!spec.bands){ctx.translate(ANCHOR.x,ANCHOR.y);ctx.rotate(-amount*.022);ctx.translate(-ANCHOR.x,-ANCHOR.y);}
 const [x,y]=spec.origins[side];ctx.translate(x+(spec.mirror?768:0),y);if(spec.mirror)ctx.scale(-1,1);
 const cell=[side*768,0,768,1024];
 if(!spec.bands||Math.abs(amount)<.0001)ctx.drawImage(image,...cell,0,0,768,1024);
 else for(let i=0;i<spec.bands.length-1;i++){
  const corners=[{x:0,y:spec.bands[i]},{x:768,y:spec.bands[i]},{x:0,y:spec.bands[i+1]},{x:768,y:spec.bands[i+1]}];
  for(const indices of [[0,1,2],[1,3,2]]){const source=indices.map(j=>corners[j]);paintTriangle(ctx,image,source,source.map(p=>deformPoint(name,p,amount)),cell);}
 }
 ctx.restore();
}
// Paladin hammer chop: the rigid torso, arms and hammer pivot at the hips while
// boots stay planted. Everything held (hammer, pommel, gauntlets) sits above
// HIP_RIGID, so only the lower tabard and knees between HIP_RIGID and HIP_FIXED bend.
export const HIP={x:330,y:640}, HAMMER_FACE={x:716,y:500};
const HIP_RIGID=620,HIP_FIXED=800,HIP_ROWS=[0,620,650,680,710,740,770,800,1024];
export const SMASH={duration:1550,charge:480,lift:[480,760],chop:[760,880],hold:1150,recover:1450,back:-.2,down:.42,settle:.38};
export function smashAngle(ms){
 const s=SMASH;
 if(ms<=s.lift[0]||ms>=s.recover)return 0;
 if(ms<s.lift[1])return s.back*smooth((ms-s.lift[0])/(s.lift[1]-s.lift[0]));
 if(ms<s.chop[1]){const t=(ms-s.chop[0])/(s.chop[1]-s.chop[0]);return ms<s.chop[0]?s.back:s.back+(s.down-s.back)*t*t;}
 if(ms<s.hold)return s.down+(s.settle-s.down)*smooth((ms-s.chop[1])/(s.hold-s.chop[1]));
 return s.settle*(1-smooth((ms-s.hold)/(s.recover-s.hold)));
}
const hipWeight=y=>smooth((HIP_FIXED-y)/(HIP_FIXED-HIP_RIGID));
export function bendPoint(point,angle){return rotate(point,angle*hipWeight(point.y),HIP);}
export function hammerFace(side,angle){const [x,y]=figures.paladin.origins[side],p=bendPoint(HAMMER_FACE,angle);return {x:x+p.x,y:y+p.y};}
export function drawPaladinSwing(canvas,image,side,angle){
 const ctx=canvas.getContext('2d'),[x,y]=figures.paladin.origins[side],cell=[side*768,0,768,1024];
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(x,y);
 for(let i=0;i<HIP_ROWS.length-1;i++){
  const c=[{x:0,y:HIP_ROWS[i]},{x:768,y:HIP_ROWS[i]},{x:0,y:HIP_ROWS[i+1]},{x:768,y:HIP_ROWS[i+1]}];
  for(const idx of [[0,1,2],[1,3,2]]){const s=idx.map(j=>c[j]);paintTriangle(ctx,image,s,s.map(p=>bendPoint(p,angle)),cell);}
 }
 ctx.restore();
}
// Maester goggle beam: the lens lights, a scanning fan reaches the victim and sweeps it up and down,
// the victim comes apart in strips, then the Maester steps onto the square.
export const BEAM={duration:1500,on:280,reach:160,scan:[440,840],apart:[840,1300],off:[840,1000],walk:[1100,1500]};
// -1..1 sweep of the scan line about the victim's middle; 0 outside the scan, so it joins smoothly.
export function scanOffset(ms){const [a,b]=BEAM.scan;return ms<=a||ms>=b?0:Math.sin((ms-a)/(b-a)*Math.PI*2);}
// Front (round) lens of the goggles in each army's art cell.
const MAESTER_LENS=[{x:222,y:288},{x:120,y:288}];
export function maesterLens(side,amount=0){return registeredPoint('maester',side,MAESTER_LENS[side],amount);}
// Beast bite: the lower jaw (steel plate and teeth) is cut from the art and turns about the mouth corner.
// Negative angles close the mouth. A darkened copy of the jaw stays behind as throat shadow in the gap.
const BEAST_JAW=[[480,397],[517,402],[522,445],[565,462],[610,480],[680,515],[682,535],[650,575],[615,604],[550,575],[480,530],[462,500],[464,450]];
export const BEAST_HINGE={x:474,y:412}, BEAST_CLOSED=-0.3;
export function drawBeastBite(canvas,image,side,angle){
 const ctx=canvas.getContext('2d'),[x,y]=figures.beast.origins[side],cell=[side*768,0,768,1024];
 const jaw=()=>{ctx.beginPath();BEAST_JAW.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();};
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(x,y);
 ctx.save();jaw();ctx.rect(768,0,-768,1024);ctx.clip('evenodd');ctx.drawImage(image,...cell,0,0,768,1024);ctx.restore();
 ctx.save();jaw();ctx.clip();ctx.filter='brightness(.28) saturate(.6)';ctx.drawImage(image,...cell,0,0,768,1024);ctx.restore();
 ctx.save();ctx.translate(BEAST_HINGE.x,BEAST_HINGE.y);ctx.rotate(angle);ctx.translate(-BEAST_HINGE.x,-BEAST_HINGE.y);jaw();ctx.clip();ctx.drawImage(image,...cell,0,0,768,1024);ctx.restore();
 ctx.restore();
}
// Centre of the Beast's open mouth in sprite-canvas coordinates.
export function beastMouth(side){const [x,y]=figures.beast.origins[side];return {x:x+[600,597][side],y:y+430};}
