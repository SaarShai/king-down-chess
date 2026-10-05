import test from 'node:test';
import assert from 'node:assert/strict';
import {SHADE,shadowField,shadowWeights,fxFade} from './contact-shadow.mjs';

// A synthetic figure on an outline grid (q px per unit): a body on two legs, the soles on the anchor's row.
// raise: how many units the right foot is off the floor.
const spec={anchor:{x:600,y:1000},scale:.1},q=SHADE.q,n=Math.round(1152*spec.scale*q),ax=spec.anchor.x*spec.scale*q,ay=spec.anchor.y*spec.scale*q;
function figure(raise=0){
 const alpha=new Uint8Array(n*n),fill=(x0,x1,y0,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)alpha[y*n+x]=255;};
 fill(ax-10,ax+10,ay-130,ay-30);fill(ax-26,ax-10,ay-30,ay);fill(ax+10,ax+26,ay-30,ay-Math.round(raise*q));
 return {alpha,n};
}
// A field's value at x across, d down (units from the ground point); 0 off its grid.
const at=(field,buf,x,d)=>{const X=Math.round(x*q+field.OX),Y=Math.round(d*q+field.OY);return X>=0&&X<field.W&&Y>=0&&Y<field.H?buf[Y*field.W+X]:0;};
const centroid=(field,buf)=>{let m=0,sx=0;for(let Y=0;Y<field.H;Y++)for(let X=0;X<field.W;X++){const v=buf[Y*field.W+X];m+=v;sx+=v*(X-field.OX)/q;}return sx/m;};
const foot=12; // each leg's centre, units from the anchor (the legs reach 17.3 units out)

test('the core lies under each foot that stands on the floor, not between the legs',()=>{
 const f=shadowField(figure(),spec,1);
 assert.ok(at(f,f.core,-foot,0)>.8&&at(f,f.core,foot,0)>.8,'under both feet');
 assert.ok(at(f,f.core,0,0)<.5,'less between them');
 assert.ok(at(f,f.core,-foot,-12)<.05,'none up the legs');
 assert.ok(Math.abs(f.cx)<1&&f.span>30&&f.span<36,`the contact spans both feet (cx ${f.cx}, span ${f.span})`);
});
test('a back foot a little off the floor is planted; one well off it is not',()=>{
 const low=shadowField(figure(3),spec,1),high=shadowField(figure(12),spec,1);
 assert.ok(at(low,low.core,foot,-3)>.6,'3 units up: planted');
 assert.ok(Math.max(...[-4,-8,-12].map(d=>at(high,high.core,foot,d)))<.15,'12 units up: no contact under it');
});
test('a figure facing left mirrors its contact, but its cast still falls to the right, away from the light',()=>{
 const right=shadowField(figure(3),spec,1),left=shadowField(figure(3),spec,-1);
 assert.ok(Math.abs(at(right,right.core,foot,-3)-at(left,left.core,-foot,-3))<.02,'the raised foot mirrors');
 for(const f of [right,left])assert.ok(centroid(f,f.soft)>centroid(f,f.core)+.5,'the pool and cast lean right of the contact');
});
test('the pool stays off the next square',()=>{
 const f=shadowField(figure(),spec,1);
 for(const x of [-56,56])assert.ok(at(f,f.soft,x,f.pd)<.02,`nothing ${x} units across`);
});
test('the body half widths say where a lying figure has its lower edge',()=>{
 const f=shadowField(figure(),spec,1);
 assert.ok(Math.abs(f.body[0]-10/q)<1.5&&Math.abs(f.body[1]-10/q)<1.5,`${f.body}`);
});

const pose=(o={})=>({foot:{x:0,y:-(o.rise??0)},ground:{x:0,y:0},...o});
// The summed strength at the darkest point of a dark floor, as if the parts lay on one another.
const peak=w=>w.shown*(1-(1-SHADE.core[1]*w.core)*(1-SHADE.soft[1]*w.soft)*(1-SHADE.air[1]*w.oval));
test('a figure rising off the floor loses its contact first, and its shadow never darkens as it rises',()=>{
 let last=Infinity,lastCore=Infinity;
 for(let lift=0;lift<=90;lift+=.5){
  const w=shadowWeights(pose({lift,rise:lift}));
  assert.ok(w.core<=lastCore+1e-9,`core at ${lift}`);assert.ok(peak(w)<=last+1e-9,`at lift ${lift}: ${peak(w)} after ${last}`);
  last=peak(w);lastCore=w.core;
 }
 const top=shadowWeights(pose({lift:30,rise:30}));
 assert.ok(top.core<.001&&top.soft<.05&&top.oval>.3,'at a hop\'s top: an oval where it will land');
});
test('the idle breath and pose.shadow alone lift the shadow (a smaller shadow reads higher)',()=>{
 const rest=shadowWeights(pose()),breath=shadowWeights(pose({shadow:.9}));
 assert.equal(rest.core,1);assert.ok(breath.core<rest.core&&breath.oval>0);
});
test('hidden, lit and faded figures',()=>{
 assert.equal(shadowWeights(pose({shadow:.001})).shown,0,'pose.shadow near 0 hides it');
 assert.equal(shadowWeights(pose({lit:1})).shown,0,'a figure lighting its own floor');
 assert.ok(Math.abs(shadowWeights(pose({lit:.5}),.8).shown-.4)<1e-9);
});
test('a figure tipping over loses its contact, then its standing pool, and gets a pool under its body',()=>{
 const lean=shadowWeights(pose({rotation:.2})),tipped=shadowWeights(pose({rotation:-.5})),down=shadowWeights(pose({rotation:-1.5}));
 assert.equal(lean.core,1,'a lean into a blow stays planted');assert.equal(lean.lying,0);
 assert.equal(tipped.core,0,'the contact is gone by about 27°');
 assert.equal(down.soft,0);assert.equal(down.oval,0);assert.equal(down.lying,1,'lying: the pool under the body only');
 let last=-1;for(let r=0;r<=1.5;r+=.05){const w=shadowWeights(pose({rotation:r}));assert.ok(w.lying>=last);last=w.lying;}
});
test('an effect that takes a figure fades its shadow: a king\'s death within 180 ms of the strike',()=>{
 assert.equal(fxFade(null),1);assert.equal(fxFade({cut:{}}),1);
 assert.equal(fxFade({death:{t:0}}),1);assert.ok(Math.abs(fxFade({death:{t:90}})-.5)<1e-9);assert.equal(fxFade({death:{t:180}}),0);
 let last=2;for(let t=0;t<=300;t+=10){const k=fxFade({death:{t}});assert.ok(k<=last);last=k;}
 assert.equal(fxFade({frost:1,shatter:null}),1,'frozen, still standing');assert.equal(fxFade({frost:1,shatter:{t:.4}}),0);
 assert.equal(fxFade({scan:{},apart:{t:.3}}),1,'the lowest strip is still in place');assert.equal(fxFade({scan:{},apart:{t:1}}),0);
});
