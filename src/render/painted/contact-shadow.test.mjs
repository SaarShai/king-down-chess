import test from 'node:test';
import assert from 'node:assert/strict';
import {SHADE,footprint,poolShape,poolAlpha,glidePool,shadowField,shadowWeights,fxFade} from './contact-shadow.mjs';
import {walkFootprints,turnFootprints,followFootprints} from '../../../tools/build-character-footprints.mjs';

// A synthetic figure in 600 × 600 pixels, the ground point at (300, 500), 300 pixels tall: a body on two legs.
const W=600,AX=300,AY=500,TALL=300;
function drawing(parts){
 const alpha=new Uint8Array(W*W);
 for(const [x0,x1,y0,y1] of parts)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)alpha[y*W+x]=255;
 return alpha;
}
const BODY=[AX-50,AX+50,AY-300,AY-100],legs=(gap=40,raise=0)=>[[AX-gap-30,AX-gap,AY-100,AY],[AX+gap,AX+gap+30,AY-100,AY-raise]];
const measure=parts=>footprint(drawing(parts),W,W,AX,AY,TALL);

test('the footprint spans the feet that stand on the floor, centred under them',()=>{
 const f=measure([BODY,...legs()]);
 assert.ok(Math.abs(f.cx)<4,`cx ${f.cx}`);assert.ok(f.span>120&&f.span<150,`span ${f.span}`);
 assert.ok(Math.abs(f.cy)<3,`cy ${f.cy}`);assert.ok(f.air<2);assert.ok(Math.abs(f.tilt)<.02);
});
test('a wide stance has a wider footprint than a narrow one',()=>{
 const wide=measure([BODY,...legs(70)]),narrow=measure([BODY,...legs(5)]);
 assert.ok(wide.span>narrow.span*1.4,`${wide.span} against ${narrow.span}`);
});
test('a spear butt, a thin blade and a tail do not pull the pool aside',()=>{
 const plain=measure([BODY,...legs()]);
 // A shaft a few pixels wide from the head down to below the soles.
 const spear=measure([BODY,...legs(),[AX+130,AX+136,AY-320,AY+6]]);
 assert.ok(Math.abs(spear.cx-plain.cx)<4,`spear: ${spear.cx}`);assert.ok(Math.abs(spear.cy-plain.cy)<3);
 // A long low tail along the floor to one side.
 const tail=measure([BODY,...legs(),[AX+70,AX+230,AY-14,AY-2]]);
 assert.ok(Math.abs(tail.cx-plain.cx)<.2*(plain.span),`tail: ${tail.cx}`);
 assert.ok(tail.span<1.2*plain.span,`tail: ${tail.span}`);
});
test('a back foot higher on the screen stays in the footprint and tilts it; a foot well off the floor does not count',()=>{
 const back=measure([BODY,...legs(40,24)]);
 assert.ok(back.span>110,`span ${back.span}`);assert.ok(back.tilt<-.02,`the right side higher: ${back.tilt}`);
 const high=measure([BODY,...legs(40,70)]);
 assert.ok(high.cx<0,'only the left foot stands');
});
test('baked height: the soles above the ground point are air',()=>{
 const f=footprint(drawing([[AX-50,AX+50,AY-300,AY-60]]),W,W,AX,AY,TALL);
 assert.ok(f.air>=58&&f.air<=62,`air ${f.air}`);
});
test('an empty drawing has no footprint',()=>assert.equal(footprint(new Uint8Array(W*W),W,W,AX,AY,TALL),null));

test('the pool scales with the figure, with no fixed height in it',()=>{
 const fp=measure([BODY,...legs()]),a=poolShape(fp,TALL),b=poolShape({span:fp.span*.5,cx:fp.cx*.5,cy:fp.cy*.5,tilt:fp.tilt},TALL*.5);
 for(const key of ['x','y','rx','ry'])assert.ok(Math.abs(a[key]-2*b[key])<1e-9,key);
 // A bigger figure: the same footprint in board units, 10% larger.
 const tall=120,k=tall/TALL,small=poolShape({span:fp.span*k,cx:0,cy:0},tall,300),big=poolShape({span:fp.span*k*1.1,cx:0,cy:0},tall*1.1,300);
 assert.ok(Math.abs(big.rx/small.rx-1.1)<1e-9&&Math.abs(big.ry/small.ry-1.1)<1e-9);
});
test('the pool stays off the next square',()=>{
 const p=poolShape({span:400,cx:0,cy:0},136,112);
 assert.ok(p.rx<=.5*112&&p.ry<=.13*112,`${p.rx} ${p.ry}`);
});
test('a wide figure still shows how much wider it stands one way than another',()=>{
 const narrow=poolShape({span:70,cx:0,cy:0},136,112),wide=poolShape({span:100,cx:0,cy:0},136,112);
 assert.ok(wide.rx>narrow.rx+1,`${wide.rx} against ${narrow.rx}`);assert.ok(wide.ry>narrow.ry);
});
test('the stamp is full in the middle, soft to its rim, and empty past it',()=>{
 assert.equal(poolAlpha(0,0),1);assert.equal(poolAlpha(1,0),0);assert.equal(poolAlpha(.8,.8),0);
 let last=2;for(let u=0;u<=1;u+=.05){const v=poolAlpha(u,0);assert.ok(v<=last);last=v;}
 assert.ok(poolAlpha(.7,0)>.5&&poolAlpha(.7,0)<.7,'no hard band');
});

const shape=(x,rx)=>({x,y:0,rx,ry:rx/3,tilt:0});
test('the drawn pool glides to a new footprint with no pop, and arrives',()=>{
 const state={...shape(0,30)},target=shape(10,50);let last=state.rx;
 for(let t=0;t<40;t++){glidePool(state,target,16);assert.ok(state.rx-last<=(50-last)*.3+.05,`a step of ${state.rx-last}`);last=state.rx;}
 assert.ok(state.settled&&state.rx===50&&state.x===10);
});
test('a long gap lands on the footprint at once',()=>{
 const state={...shape(0,30)};glidePool(state,shape(10,50),1000);assert.equal(state.rx,50);assert.ok(state.settled);
});
const row=(span,cx=0,cy=0,tilt=0,air=0)=>({span,cx,cy,tilt,air});
test('a walk: one stable pool that breathes, whatever its four poses do',()=>{
 const poses=[row(130,-5,-4),row(44,-17,-3),row(115,-9,-3),row(62,-4,-3)],out=walkFootprints(poses,240);
 const spans=out.map(f=>f.span),range=Math.max(...spans)-Math.min(...spans),mid=spans.reduce((n,v)=>n+v)/4;
 assert.ok(mid>100,`the planted width sets it: ${mid}`);assert.ok(range<.17*mid&&range>0,`breath ${range}`);
 const xs=out.map(f=>f.cx);assert.ok(Math.max(...xs)-Math.min(...xs)<.04*240,'the centre stays');
});
test('a turn goes straight from one facing to the next',()=>{
 const out=turnFootprints([row(100,0),row(10,90),row(300,-90),row(200,10)],[0,40,80,120]);
 assert.equal(out[0].span,100);assert.equal(out[3].span,200);
 assert.ok(Math.abs(out[1].span-100/3-100)<1e-9&&Math.abs(out[2].cx-20/3)<1e-9);
});
test('in a leap the pool waits on the floor between take-off and landing, and the height stays',()=>{
 const out=followFootprints([row(100,0),row(100,0),row(30,-70,-60,0,70),row(100,20),row(100,20)],[0,100,200,300,400],300);
 assert.ok(out[2].span>80,`span ${out[2].span}`);assert.ok(out[2].cx>-5,`cx ${out[2].cx}`);assert.ok(out[2].air>40);
});

test('a still sprite: the footprint in board units, mirrored for a figure facing left',()=>{
 const spec={anchor:{x:600,y:1000},scale:.1},q=SHADE.q,n=Math.round(1152*spec.scale*q),ax=spec.anchor.x*spec.scale*q,ay=spec.anchor.y*spec.scale*q,alpha=new Uint8Array(n*n);
 const fill=(x0,x1,y0,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)alpha[y*n+x]=255;};
 fill(ax-10,ax+10,ay-130,ay-30);fill(ax-40,ax-14,ay-30,ay);fill(ax+6,ax+32,ay-30,ay);
 const right=shadowField({alpha,n},spec,1),left=shadowField({alpha,n},spec,-1);
 assert.ok(right.cx<-1,`${right.cx}`);assert.ok(Math.abs(left.cx+right.cx)<1e-9);assert.equal(left.span,right.span);
 assert.ok(right.span>30&&right.span<50,`${right.span}`);
 assert.ok(right.body[0]>right.body[1],'its lower body reaches further to the left');assert.deepEqual(left.body,right.body);
});
test('an empty sprite has no footprint',()=>{
 assert.equal(shadowField({alpha:new Uint8Array(100),n:10},{anchor:{x:0,y:0},scale:.1},1),null);
});

const pose=(o={})=>({foot:{x:0,y:-(o.rise??0)},ground:{x:0,y:0},...o});
const peak=w=>w.shown*SHADE.pool[1]*w.pool;
test('a figure rising off the floor keeps its oval, smaller and lighter: it never darkens as it rises',()=>{
 let last=Infinity,lastSize=Infinity;
 for(let lift=0;lift<=90;lift+=.5){
  const w=shadowWeights(pose({lift,rise:lift}));
  assert.ok(peak(w)<=last+1e-9,`at lift ${lift}: ${peak(w)} after ${last}`);assert.ok(w.size<=lastSize+1e-9);
  last=peak(w);lastSize=w.size;
 }
 const top=shadowWeights(pose({lift:30,rise:30}));
 assert.ok(top.pool>.4&&top.pool<.65,`at a hop's top: ${top.pool}`);
});
test('height baked in a frame lifts the shadow the same way',()=>{
 const baked=shadowWeights(pose(),1,30),lifted=shadowWeights(pose({lift:30,rise:30}));
 assert.equal(baked.pool,lifted.pool);assert.equal(baked.size,lifted.size);
});
test('standing on the floor: the whole pool at full size',()=>{
 const rest=shadowWeights(pose());assert.equal(rest.pool,1);assert.equal(rest.size,1);assert.equal(rest.lying,0);
 const breath=shadowWeights(pose({shadow:.9}));assert.ok(breath.pool<rest.pool&&breath.size<rest.size,'pose.shadow alone lifts it');
});
test('hidden, lit and faded figures',()=>{
 assert.equal(shadowWeights(pose({shadow:.001})).shown,0,'pose.shadow near 0 hides it');
 assert.equal(shadowWeights(pose({lit:1})).shown,0,'a figure lighting its own floor');
 assert.ok(Math.abs(shadowWeights(pose({lit:.5}),.8).shown-.4)<1e-9);
});
test('a figure tipping over loses its standing pool and gets a pool under its body',()=>{
 const lean=shadowWeights(pose({rotation:.2})),down=shadowWeights(pose({rotation:-1.5}));
 assert.equal(lean.pool,1,'a lean into a blow stays planted');assert.equal(lean.lying,0);
 assert.equal(down.pool,0);assert.equal(down.lying,1,'lying: the pool under the body only');
 let last=-1;for(let r=0;r<=1.5;r+=.05){const w=shadowWeights(pose({rotation:r}));assert.ok(w.lying>=last);last=w.lying;}
});
test('an effect that takes a figure fades its shadow: a king\'s death within 180 ms of the strike',()=>{
 assert.equal(fxFade(null),1);assert.equal(fxFade({cut:{}}),1);
 assert.equal(fxFade({death:{t:0}}),1);assert.ok(Math.abs(fxFade({death:{t:90}})-.5)<1e-9);assert.equal(fxFade({death:{t:180}}),0);
 let last=2;for(let t=0;t<=300;t+=10){const k=fxFade({death:{t}});assert.ok(k<=last);last=k;}
 assert.equal(fxFade({frost:1,shatter:null}),1,'frozen, still standing');assert.equal(fxFade({frost:1,shatter:{t:.4}}),0);
 assert.equal(fxFade({ranged:{shadow:.4}}),.4,'a ranged victim sets its own');
});
