// The Shadow King's skeletal hands and floor cracks, shared by his resting effect (king-effects.mjs) and
// his capture (king-captures.mjs). Board units (the board is 960 wide); a hand is about 32 units tall.
const TAU=Math.PI*2;
const rand=(i,j=0)=>{const x=Math.sin(i*127.1+j*311.7+.5)*43758.5453;return x-Math.floor(x);};

// Bones of one hand, in hand space: the base on the floor at 0,0, up is -y, the palm turned to +x.
// curl: 0 open … 1 clutched.
function bones(curl){
 // Radius and ulna: apart at the elbow (below the floor), close at the wrist, with the wrist's knob.
 const lines=[[[-2.6,6],[-1.5,-14.8],2.4],[[2.6,6],[1.4,-15.2],2.4],[[-1.9,-15.6],[1.9,-16],2.8]];
 const knuckles=[[-4.8,-24],[-1.6,-25.6],[1.6,-25.2],[4.4,-23.4]],spread=[-.38,-.13,.1,.34],length=[[5,3.6,2.8],[5.7,4,3],[5.4,3.8,2.9],[4.3,3.1,2.4]];
 for(let f=0;f<4;f++){
  lines.push([[(f-1.5)*1.4,-17.5],knuckles[f],1.8]);
  let p=knuckles[f],a=-Math.PI/2+spread[f]*(1.25-curl*.6);
  for(let j=0;j<3;j++){a+=curl*[.6,.85,.75][j];const q=[p[0]+Math.cos(a)*length[f][j],p[1]+Math.sin(a)*length[f][j]];lines.push([p,q,1.85-j*.2]);p=q;}
 }
 let p=[-2.8,-18],a=-Math.PI/2-1.05+curl*.3;const base=[-6.8,-21.4];
 lines.push([p,base,1.8]);p=base;
 for(let j=0;j<2;j++){a+=curl*.7;const q=[p[0]+Math.cos(a)*[4,3.1][j],p[1]+Math.sin(a)*[4,3.1][j]];lines.push([p,q,1.5]);p=q;}
 return lines;
}
const PALM=[[-3.2,-16.6],[3,-16.8],[4.6,-23.2],[1.6,-25],[-1.6,-25.4],[-4.9,-23.6]];
// Bone colours per army: bone white with a dark outline (ivory, side 0), black with a pale edge (charcoal).
const BONE=[
 {outline:'rgba(52,42,30,.92)',body:'#ede6d4',edge:'rgba(150,134,108,.85)',palm:'rgba(236,229,212,.4)'},
 {outline:null,body:'#0b0910',edge:'rgba(176,170,180,.8)',palm:'rgba(11,9,16,.55)'},
];
function stroke(ctx,lines,colour,scale,dx=0,dy=0,add=0){
 ctx.strokeStyle=colour;
 for(const width of [...new Set(lines.map(l=>l[2]))]){
  ctx.lineWidth=width*scale+add;ctx.beginPath();
  for(const [p,q,w] of lines)if(w===width){ctx.moveTo(p[0]+dx,p[1]+dy);ctx.lineTo(q[0]+dx,q[1]+dy);}
  ctx.stroke();
 }
}
/**
 * One hand coming up out of the floor at x, y. h: {side (army colours), size, flip (palm to -x),
 * angle (radians, + leans right), rise (0 under the floor … 1 out), curl (0 open … 1 clutched),
 * floor (y below which nothing shows; default y), reach (units above the floor it may show; default 60)}.
 */
export function drawHand(ctx,x,y,h){
 const k=h.size??1,r=h.rise??1,bone=BONE[h.side??1],floor=h.floor??y;
 if(r<=.01)return;
 ctx.save();ctx.beginPath();ctx.rect(x-40*k,floor-(h.reach??60)*k,80*k,(h.reach??60)*k);ctx.clip();
 ctx.translate(x,y+(1-r)*34*k);ctx.rotate(h.angle??0);ctx.scale(k*(h.flip?-1:1),k);ctx.lineCap='round';ctx.lineJoin='round';
 const lines=bones(h.curl??.1),joints=lines.slice(2).map(l=>l[0]);
 ctx.fillStyle=bone.palm;ctx.beginPath();PALM.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();
 if(bone.outline){stroke(ctx,lines,bone.outline,1,0,0,1.1);ctx.fillStyle=bone.outline;for(const p of joints){ctx.beginPath();ctx.arc(p[0],p[1],1.7,0,TAU);ctx.fill();}}
 stroke(ctx,lines,bone.body,1);
 ctx.fillStyle=bone.body;for(const p of joints){ctx.beginPath();ctx.arc(p[0],p[1],1.15,0,TAU);ctx.fill();}
 stroke(ctx,lines,bone.edge,.3,h.side?-.55:.5,h.side?-.25:.25);
 ctx.restore();
}
/**
 * A jagged crack in the floor stone along x from x-w to x+w, opened h: dark inside, a lit lip on its far
 * edge, and hairline cracks running off its ends. Returns its outline's top edge points (for clipping).
 */
export function drawCrack(ctx,x,y,w,h,seed,{points=7,branches=3,glow=null}={}){
 if(h<.05)return;
 const n=points,top=[],bottom=[];
 for(let i=0;i<=n;i++){const u=i/n*2-1,open=(1-u*u)**.7;top.push([x+u*w+(rand(seed,i)-.5)*2.2*w/10,y-h*open*(.7+.6*rand(seed,i+10))]);bottom.push([x+u*w+(rand(seed,i+20)-.5)*2.2*w/10,y+h*open*(.5+.5*rand(seed,i+30))]);}
 if(glow){ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,y,w+6,h+5,0,0,TAU);ctx.fill();}
 ctx.fillStyle='#050407';ctx.beginPath();top.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));for(let i=n;i>=0;i--)ctx.lineTo(...bottom[i]);ctx.closePath();ctx.fill();
 ctx.lineWidth=.9+w/60;ctx.strokeStyle='rgba(226,214,190,.45)';ctx.beginPath();top.forEach(([px,py],i)=>i?ctx.lineTo(px,py-.6):ctx.moveTo(px,py-.6));ctx.stroke();
 ctx.lineWidth=.7+w/80;ctx.strokeStyle='rgba(8,6,10,.75)';ctx.beginPath();
 for(let b=0;b<branches;b++)for(const e of [-1,1]){
  let px=x+e*w*(1-.3*b/branches),py=y+(b?(rand(seed,60+b)-.5)*h*2:0),a=(e>0?0:Math.PI)+(b?(rand(seed,70+b+e)-.5)*1.6:0);ctx.moveTo(px,py);
  for(let i=0;i<3;i++){const l=(2.5+2*rand(seed,40+i+e+b*5))*Math.max(1,w/14);px+=Math.cos(a)*l;py+=Math.sin(a)*l*.5+(rand(seed,50+i+e)-.5)*2;a+=(rand(seed,80+i+b)-.5)*.8;ctx.lineTo(px,py);}
 }
 ctx.stroke();
 return top;
}
