import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMISE_MS,makePlan,thornAt,victimAt} from './fx-queen.mjs';

const CONTACT=600,options={seed:42,origin:[300,250],secondaryOrigin:[290,270],target:[536,534],foot:[536,576],height:96,emissionMs:60,contactMs:CONTACT};
const stand={dx:0,dy:0};

test('thorns leave the palms and the first reaches the target on the contact beat',()=>{
 const plan=makePlan(options),out={},[first]=plan.thorns;
 assert.ok(thornAt(first,first.launchMs,stand,out));
 assert.ok(Math.hypot(out.x-options.origin[0],out.y-options.origin[1])<1,'starts on the far palm');
 assert.equal(first.hitMs,CONTACT);
 assert.ok(thornAt(first,CONTACT-.01,stand,out));
 assert.ok(Math.hypot(out.x-options.target[0],out.y-options.target[1])<1,'ends on the target');
 assert.equal(thornAt(first,CONTACT,stand,out),false,'buried from the hit on');
 for(const t of plan.thorns)assert.ok(t.hitMs>=CONTACT&&t.hitMs<CONTACT+DEMISE_MS/2,'each bites early in the death');
});

test('the victim stands until the contact, then falls away from the Queen and is gone by the end',()=>{
 const plan=makePlan(options),s={};
 assert.deepEqual(victimAt(plan,CONTACT-1,s),{dx:0,dy:0,theta:0,sx:1,sy:1,opacity:1});
 assert.equal(victimAt(plan,CONTACT+100,s).opacity,1,'no quick fade: pierced first');
 assert.ok(victimAt(plan,CONTACT+DEMISE_MS*.8,s).theta>.3,'topples to the side away from the Queen');
 assert.equal(victimAt(plan,CONTACT+DEMISE_MS,s).opacity,0);
 let last=null;
 for(let e=CONTACT;e<=CONTACT+DEMISE_MS;e+=8){const v=victimAt(plan,e,{});if(last)assert.ok(Math.hypot(v.dx-last.dx,v.dy-last.dy)<12,`no jump at ${e} ms`);last=v;}
});

test('a mirrored attack topples the other way',()=>{
 const plan=makePlan({...options,origin:[800,250],secondaryOrigin:[810,270]});
 assert.ok(victimAt(plan,CONTACT+DEMISE_MS*.8,{}).theta<-.3);
});

test('on the back rank the thorns bow less, so tip and stem stay inside the canvas',()=>{
 // A Queen on d8 takes on e8: palms near the top, a short shot, so the full bow climbs far above the board.
 const rank8={...options,origin:[400,20],secondaryOrigin:[392,34],target:[536,90],foot:[536,128],height:132},bounds=[0,-64,960,960],out={};
 const top=plan=>Math.min(...plan.thorns.flatMap(t=>{const ys=[];for(let e=t.launchMs;e<t.hitMs;e+=4)if(thornAt(t,e,stand,out))ys.push(out.y-Math.abs(Math.sin(out.angle))*t.length);return ys;}));
 assert.ok(top(makePlan(rank8))<bounds[1],'unbounded, a stem leaves the canvas');
 assert.ok(top(makePlan({...rank8,bounds}))>=bounds[1]);
 for(const p of makePlan({...rank8,bounds}).petals)assert.ok(p.y-p.vy**2/1040-p.size>=bounds[1],'petals turn below the top');
});
