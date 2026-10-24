// Builds the board atlases of the approved character clips (clips/README.md) from the owner-reviewed
// sample frames: the banked Knight lance tap and the Rook slam, crack and heal.
//   node docs/2d-first-pieces/clips/build.mjs [samples folder]
// The samples folder defaults to docs/specs/character-animation-samples/preview/assets of this checkout.
// Each generated frame keeps its own pixels. The script only places them: one scale and one translation for
// the whole clip (fitted from the rest drawing to the board's still sprite), a mirror where the board mirrors
// the art, and each frame's registration anchor from the sample manifest. The Charcoal frames are the Ivory
// frames through a colour map measured between the board's two painted armies.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const here=fileURLToPath(new URL('./',import.meta.url)),pieces=here+'../';
const samples=(process.argv[2]??pieces+'../specs/character-animation-samples/preview/assets').replace(/\/?$/,'/');
const SPRITE=1152,FACTOR=.36,COLS=8,MARGIN=6;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

// The board's still sprite for one army, as scene.mjs draws it (knight/motion.mjs drawKnight, rook/motion.mjs drawRook).
const BOARD={
 knight:{art:'knight/knight.png',place:side=>({cell:[side*768,0,768,1024],left:side?148:60,top:15,flop:false})},
 rook:{art:'rook/rook.png',place:side=>{const cell=[[0,0,780,1024],[780,0,756,1024]][side];return {cell,left:[995,943][side]-cell[2],top:0,flop:true};}},
};
const CLIPS={
 knight:{
  sheet:'knight-tap-frames-v2.png',manifest:'knight-tap-frames-v2.json',flop:false,
  // The banked sequence (knight-banked.json): lift, hold, drop, contact, recoil, settle, at 24 fps.
  fps:24,sequence:[0,1,2,3,4,5,6,7,8,8,6,3,0,1,2,1,0,0],
 },
 rook:{sheet:'rook-slam-hq.png',manifest:'rook-slam-hq.json',flop:true},
};

async function rgba(input){const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,width:info.width,height:info.height};}
async function still(name,side){
 const {art,place}=BOARD[name],{cell,left,top,flop}=place(side);
 let part=sharp(pieces+art).extract({left:cell[0],top:cell[1],width:cell[2],height:cell[3]});
 if(flop)part=part.flop();
 const input=await part.png().toBuffer();
 return rgba(await sharp({create:{width:SPRITE,height:SPRITE,channels:4,background:'#0000'}}).composite([{input,left,top}]).png().toBuffer());
}
function bounds(img,min=128){
 let x0=1e9,y0=1e9,x1=-1,y1=-1;
 for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++)if(img.data[(y*img.width+x)*4+3]>=min){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 return {x0,y0,x1,y1};
}
// The mean alpha difference in sprite space between the still and frame `img` placed by (s, tx, ty):
// sprite x = tx + s·(±(u − ax)), y = ty + s·(v − ay); (ax, ay) is the frame's anchor in its sheet.
function misfit(target,img,rect,anchor,flop,s,tx,ty,step){
 let sum=0,n=0;
 for(let y=0;y<SPRITE;y+=step)for(let x=0;x<SPRITE;x+=step){
  const qx=(x-tx)/s*(flop?-1:1),u=Math.round(anchor[0]+qx),v=Math.round(anchor[1]+(y-ty)/s);
  const a=u>=rect[0]&&u<rect[0]+rect[2]&&v>=rect[1]&&v<rect[1]+rect[3]?img.data[(v*img.width+u)*4+3]:0;
  const b=target.data[(y*SPRITE+x)*4+3];
  if(a||b){sum+=Math.abs(a-b);n++;}
 }
 return sum/n/255;
}
function fit(target,img,frame,flop){
 const t=bounds(target);
 // A first guess from heights and soles, then a coarse-to-fine search over scale and shift.
 let best={s:0,tx:0,ty:0,e:Infinity};
 const crop={data:img.data,width:img.width,height:img.height};
 let f0={x0:1e9,y0:1e9,x1:-1,y1:-1};
 for(let v=frame.rect[1];v<frame.rect[1]+frame.rect[3];v++)for(let u=frame.rect[0];u<frame.rect[0]+frame.rect[2];u++)if(img.data[(v*img.width+u)*4+3]>=128){f0.x0=Math.min(f0.x0,u);f0.x1=Math.max(f0.x1,u);f0.y0=Math.min(f0.y0,v);f0.y1=Math.max(f0.y1,v);}
 const s0=(t.y1-t.y0)/(f0.y1-f0.y0),ty0=t.y1-s0*(f0.y1-frame.anchor[1]);
 const cx=(f0.x0+f0.x1)/2-frame.anchor[0],tx0=(t.x0+t.x1)/2-s0*(flop?-cx:cx);
 best={s:s0,tx:tx0,ty:ty0,e:misfit(target,crop,frame.rect,frame.anchor,flop,s0,tx0,ty0,4)};
 for(const [ds,dt,step] of [[.01,8,6],[.003,3,3],[.001,1,2]]){
  const c={...best};
  for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++)for(let k=-4;k<=4;k++){
   const s=c.s*(1+i*ds),tx=c.tx+j*dt,ty=c.ty+k*dt,e=misfit(target,crop,frame.rect,frame.anchor,flop,s,tx,ty,step);
   if(e<best.e)best={s,tx,ty,e};
  }
  best.e=misfit(target,crop,frame.rect,frame.anchor,flop,best.s,best.tx,best.ty,2);
 }
 return best;
}
// Ivory → Charcoal colour map: the mean Charcoal colour of each 16-level Ivory colour bin, over pixels where both
// stills are opaque. Empty bins take their nearest filled bin. Applied with trilinear interpolation.
const BIN=16,N=256/BIN;
// Where the Charcoal still stands against the Ivory one in sprite space: charcoal(x + dx, y + dy) ≈ ivory(x, y).
function shiftOf(ivory,charcoal){
 let best={dx:0,dy:0,e:Infinity};
 for(let dy=-20;dy<=20;dy++)for(let dx=-40;dx<=40;dx++){
  let sum=0;
  for(let y=24;y<SPRITE-24;y+=3)for(let x=48;x<SPRITE-48;x+=3)sum+=Math.abs(ivory.data[(y*SPRITE+x)*4+3]-charcoal.data[((y+dy)*SPRITE+x+dx)*4+3]);
  if(sum<best.e)best={dx,dy,e:sum};
 }
 return best;
}
function colourMap(ivory,charcoal,{dx,dy}){
 const sum=new Float64Array(N*N*N*3),count=new Uint32Array(N*N*N);
 for(let y=Math.max(0,-dy);y<SPRITE-Math.max(0,dy);y++)for(let x=Math.max(0,-dx);x<SPRITE-Math.max(0,dx);x++){
  const i=(y*SPRITE+x)*4,j=((y+dy)*SPRITE+x+dx)*4;
  if(ivory.data[i+3]<250||charcoal.data[j+3]<250)continue;
  const b=(ivory.data[i]>>4)*N*N+(ivory.data[i+1]>>4)*N+(ivory.data[i+2]>>4);
  count[b]++;for(let c=0;c<3;c++)sum[b*3+c]+=charcoal.data[j+c];
 }
 const filled=[];for(let b=0;b<count.length;b++)if(count[b]>=4)filled.push(b);
 const lut=new Float32Array(N*N*N*3),rgb=b=>[Math.floor(b/N/N),Math.floor(b/N)%N,b%N];
 for(let b=0;b<count.length;b++){
  let src=b;
  if(count[b]<4){const p=rgb(b);let d=Infinity;for(const f of filled){const q=rgb(f),e=(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2;if(e<d){d=e;src=f;}}}
  for(let c=0;c<3;c++)lut[b*3+c]=sum[src*3+c]/count[src];
 }
 return lut;
}
function mapColour(lut,r,g,b,out,o){
 const f=[r/BIN-.5,g/BIN-.5,b/BIN-.5].map(v=>Math.max(0,Math.min(N-1.001,v))),i=f.map(Math.floor),w=f.map((v,k)=>v-i[k]);
 for(let c=0;c<3;c++){
  let v=0;
  for(let dr=0;dr<2;dr++)for(let dg=0;dg<2;dg++)for(let db=0;db<2;db++){
   const k=(dr?w[0]:1-w[0])*(dg?w[1]:1-w[1])*(db?w[2]:1-w[2]);
   v+=k*lut[(((i[0]+dr)*N+(i[1]+dg))*N+(i[2]+db))*3+c];
  }
  out[o+c]=Math.round(v);
 }
}
function recolour(img,lut){
 const out=Buffer.from(img.data);
 for(let i=0;i<out.length;i+=4)if(out[i+3])mapColour(lut,img.data[i],img.data[i+1],img.data[i+2],out,i);
 return {...img,data:out};
}
// How far the colour map's Charcoal is from the painted Charcoal (mean absolute channel error over opaque pixels).
function colourError(a,b){let sum=0,n=0;for(let i=0;i<a.data.length;i+=4)if(a.data[i+3]>250&&b.data[i+3]>250){for(let c=0;c<3;c++)sum+=Math.abs(a.data[i+c]-b.data[i+c]);n+=3;}return sum/n;}

const out={},report={};
for(const [name,clip] of Object.entries(CLIPS)){
 const manifest=JSON.parse(await fs.readFile(samples+clip.manifest)),sheetBytes=await fs.readFile(samples+clip.sheet);
 const sheet=await rgba(sheetBytes),frames=manifest.frames,sequence=clip.sequence??manifest.sequence,fps=clip.fps??manifest.fps;
 const stills=[await still(name,0),await still(name,1)];
 const placed=fit(stills[0],sheet,frames[0],clip.flop);
 const shift=shiftOf(stills[0],stills[1]),lut=colourMap(stills[0],stills[1],shift);
 // Each frame in sprite space: its sheet rectangle scaled by s about its anchor, mirrored if the board mirrors it.
 const boxes=frames.map(f=>{
  const xs=[f.rect[0],f.rect[0]+f.rect[2]].map(u=>placed.tx+placed.s*(clip.flop?-1:1)*(u-f.anchor[0]));
  return {x0:Math.min(...xs),x1:Math.max(...xs),y0:placed.ty+placed.s*(f.rect[1]-f.anchor[1]),y1:placed.ty+placed.s*(f.rect[1]+f.rect[3]-f.anchor[1])};
 });
 // The atlas cell covers the painted part of every frame (alpha ≥ 8), the same box for all.
 const painted=frames.map(f=>{
  let x0=1e9,y0=1e9,x1=-1,y1=-1;
  for(let v=f.rect[1];v<f.rect[1]+f.rect[3];v++)for(let u=f.rect[0];u<f.rect[0]+f.rect[2];u++)if(sheet.data[(v*sheet.width+u)*4+3]>=8){x0=Math.min(x0,u);x1=Math.max(x1,u);y0=Math.min(y0,v);y1=Math.max(y1,v);}
  const xs=[x0,x1+1].map(u=>placed.tx+placed.s*(clip.flop?-1:1)*(u-f.anchor[0]));
  return {x0:Math.min(...xs),x1:Math.max(...xs),y0:placed.ty+placed.s*(y0-f.anchor[1]),y1:placed.ty+placed.s*(y1+1-f.anchor[1])};
 });
 // (and the same box for the Charcoal frames, which stand where the Charcoal still stands: shift)
 const lo=Math.min(0,shift.dx),hi=Math.max(0,shift.dx),up=Math.min(0,shift.dy),down=Math.max(0,shift.dy);
 const box={x:Math.floor(Math.min(...painted.map(b=>b.x0)))+lo-MARGIN,y:Math.floor(Math.min(...painted.map(b=>b.y0)))+up-MARGIN};
 box.w=Math.ceil(Math.max(...painted.map(b=>b.x1)))+hi+MARGIN-box.x;box.h=Math.ceil(Math.max(...painted.map(b=>b.y1)))+down+MARGIN-box.y;
 const cw=Math.round(box.w*FACTOR),ch=Math.round(box.h*FACTOR),rows=Math.ceil(frames.length/COLS);
 const layers=[],cells=[];
 for(let side=0;side<2;side++)for(const [i,f] of frames.entries()){
  const k=placed.s*FACTOR,w=Math.round(f.rect[2]*k),h=Math.round(f.rect[3]*k);
  let part=sharp(sheetBytes).extract({left:f.rect[0],top:f.rect[1],width:f.rect[2],height:f.rect[3]}).resize(w,h,{kernel:'lanczos3'});
  if(clip.flop)part=part.flop();
  let img=await rgba(await part.png().toBuffer());
  if(side)img=recolour(img,lut);
  const col=i%COLS,row=side*rows+Math.floor(i/COLS),b=boxes[i];
  // Where the frame's rectangle lands in its cell, then cropped to the cell.
  const left=Math.round((b.x0+side*shift.dx-box.x)*FACTOR),top=Math.round((b.y0+side*shift.dy-box.y)*FACTOR);
  const sx=Math.max(0,-left),sy=Math.max(0,-top),dx=Math.max(0,left),dy=Math.max(0,top);
  const tile=await sharp(img.data,{raw:{width:img.width,height:img.height,channels:4}}).extract({left:sx,top:sy,width:Math.min(img.width-sx,cw-dx),height:Math.min(img.height-sy,ch-dy)}).png().toBuffer();
  const cellImg=await sharp({create:{width:cw,height:ch,channels:4,background:'#0000'}}).composite([{input:tile,left:dx,top:dy}]).png().toBuffer();
  layers.push({input:cellImg,left:col*cw,top:row*ch});
  if(!side)cells.push([col*cw,Math.floor(i/COLS)*ch]);
 }
 const file=`${name}/${name==='knight'?'tap':'slam'}.webp`;
 const atlas=await sharp({create:{width:COLS*cw,height:2*rows*ch,channels:4,background:'#0000'}}).composite(layers).webp({quality:88,alphaQuality:100,effort:6}).toBuffer();
 await fs.writeFile(pieces+file,atlas);
 const charcoalRest=recolour(stills[0],lut),shifted={...stills[1],data:Buffer.alloc(stills[1].data.length)};
 for(let y=0;y<SPRITE;y++)for(let x=0;x<SPRITE;x++){const u=x+shift.dx,v=y+shift.dy;if(u>=0&&v>=0&&u<SPRITE&&v<SPRITE)stills[1].data.copy(shifted.data,(y*SPRITE+x)*4,(v*SPRITE+u)*4,(v*SPRITE+u)*4+4);}
 out[name]={fps,sequence,factor:FACTOR,box,cell:[cw,ch],rows,cells};
 report[name]={source:{sheet:clip.sheet,manifest:clip.manifest,sheetSha256:sha(sheetBytes)},drawings:frames.length,ticks:sequence.length,ms:Math.round(sequence.length/fps*1000),
  fit:{scale:+placed.s.toFixed(4),tx:+placed.tx.toFixed(1),ty:+placed.ty.toFixed(1),restAlphaMisfit:+placed.e.toFixed(4)},
  charcoalShift:[shift.dx,shift.dy],charcoalColourError:+colourError(charcoalRest,shifted).toFixed(2),atlas:{file,bytes:atlas.length,width:COLS*cw,height:2*rows*ch,sha256:sha(atlas)}};
 assert.equal(sequence[0],sequence.at(-1),`${name}: the clip ends on the drawing it starts with`);
}
const header='// Generated by clips/build.mjs from the owner-reviewed sample frames. Do not edit by hand.\n';
await fs.writeFile(here+'frames.mjs',header+`export const FRAMES=${JSON.stringify(out)};\n`);
await fs.writeFile(here+'provenance.json',JSON.stringify(report,null,1)+'\n');
console.log(JSON.stringify(report,null,1));
