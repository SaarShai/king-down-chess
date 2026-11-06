import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {strikeReach,strikeStance,crushPose,impalePose,thrownPose,bitePose,slashLine} from './fx-melee.mjs';
import {bankScale,figureHeight} from './character-runtime.mjs';

const manifest=JSON.parse(readFileSync(new URL('../../../public/character-runtime/manifest.json',import.meta.url),'utf8'));
const STRIKE={bishop:'slash',paladin:'hammer',rook:'pound',pawn:'pawn',knight:'knight',ogre:'ogre',beast:'chain'};
const STEP={N:[0,-1],NE:[1,-1],E:[1,0],SE:[1,1],S:[0,1],SW:[-1,1],W:[-1,0],NW:[-1,-1]};

test('every painted melee attack lands its weapon on the victim, from one square and from far, without passing it',()=>{
 const victimFoot={x:480,y:520},height=figureHeight('pawn');
 for(const bank of manifest.banks.filter(b=>b.kind==='attack'&&STRIKE[b.character])){
  const [dx,dy]=STEP[bank.facing],reach=strikeReach(bank,bankScale(bank));
  assert.ok(reach,`${bank.character} ${bank.id}: has a weapon point`);
  for(const squares of [1,3]){
   const from={x:victimFoot.x-dx*112*squares,y:victimFoot.y-dy*112*squares},{stance,point,dir}=strikeStance(STRIKE[bank.character],from,victimFoot,height,reach);
   assert.deepEqual(point,{x:stance.x+reach.x,y:stance.y+reach.y});
   assert.ok(Math.hypot(dir.x,dir.y)>.99);
   // Feet stay on the captor's side of the victim's ground point.
   assert.ok((victimFoot.x-stance.x)*dx+(victimFoot.y-stance.y)*dy>0,`${bank.character} ${bank.id} ${squares}: did not pass the victim`);
   // A straight arm reaches: only a facing that points at the viewer (the weapon rises above the feet) may fall short.
   const off=Math.hypot(point.x-victimFoot.x,point.y-(victimFoot.y-height*.55));
   if(dy<=0)assert.ok(off<110,`${bank.character} ${bank.id} ${squares}: weapon lands ${Math.round(off)} px from the body`);
  }
 }
});

test('each death starts on the figure as it stands and is gone by the end of its time',()=>{
 const pose={foot:{x:300,y:400},facing:1,scale:.1};
 const dir={x:1,y:0},deaths=[(s,l)=>crushPose(pose,s,l),(s,l)=>crushPose(pose,s,l,dir),(s,l)=>impalePose(pose,s,l,dir),(s,l)=>thrownPose(pose,s,l,dir),(s,l)=>bitePose(pose,s,l,{x:280,y:350},{x:300,y:340})];
 for(const death of deaths)for(const life of [240,430,540]){
  const first=death(0,life);
  assert.ok(Math.abs((first.pose.foot?.x??300)-300)<.01&&Math.abs((first.pose.foot?.y??400)-400)<.01,'no jump at the blow');
  assert.ok(Math.abs((first.pose.sx??1)-1)<.01&&Math.abs((first.pose.sy??1)-1)<.01&&!first.pose.rotation,'no change of shape at the blow');
  assert.equal(first.opacity,1);
  assert.equal(death(life,life).opacity,0,'gone at the end');
  // Each 16 ms step keeps the figure near where it was, so nothing pops.
  for(let ms=16;ms<=life;ms+=16){const a=death(ms-16,life).pose.foot??pose.foot,b=death(ms,life).pose.foot??pose.foot;assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<28,`jump at ${ms} ms`);}
 }
});

test('the slash falls forward across the figure in both directions',()=>{
 assert.ok(slashLine({x:1,y:0}).x>0&&slashLine({x:1,y:0}).y>0);
 assert.ok(slashLine({x:-1,y:0}).x<0&&slashLine({x:-1,y:0}).y>0);
});
