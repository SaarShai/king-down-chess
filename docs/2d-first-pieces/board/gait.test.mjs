import test from 'node:test';
import assert from 'node:assert/strict';
import { GAITS, GAIT_OF, IDLE, idleAt, paintedPace, paintedTravel } from './gait.mjs';

const REST = { travel: 0, lift: 0, sx: 1, sy: 1, tilt: 0, shadow: 1 };
const near = (actual, expected) => { for (const k of Object.keys(expected)) assert.ok(Math.abs(actual[k] - expected[k]) < 1e-9, `${k}: ${actual[k]} vs ${expected[k]}`); };
for (const [name, gait] of Object.entries(GAITS).filter(([name]) => name !== 'paintedWalk')) {
  test(`${name}: starts and ends at rest, under 500 ms, no jumps`, () => {
    for (const squares of [1, 2, 7]) {
      assert.ok(gait.duration(squares) <= 500, `${squares} squares: ${gait.duration(squares)} ms`);
      near(gait.at(0, squares), REST);
      near(gait.at(1, squares), { ...REST, travel: 1 });
      let prev = gait.at(0, squares);
      for (let i = 1; i <= 1000; i++) {
        const v = gait.at(i / 1000, squares);
        assert.ok(v.travel >= prev.travel - 1e-9, 'feet never step back');
        assert.ok(Math.abs(v.sy - prev.sy) < .02 && Math.abs(v.tilt - prev.tilt) < .02 && Math.abs(v.lift - prev.lift) < 1, `smooth at ${i / 1000}`);
        assert.ok(v.sy > .85 && v.sy < 1.12 && Math.abs(v.tilt) < .15 && v.lift >= 0 && v.lift <= 32, 'subtle');
        prev = v;
      }
    }
  });
}
test('painted walk uses the pace budget and the two-times cap', () => {
 const gait=GAITS.paintedWalk;
 for(const [squares,duration] of [[1,600],[2,850],[7,2240]]){
  assert.equal(paintedPace(squares,640,1).duration,duration);
  let previous=0;
  for(let i=0;i<=1000;i++){
   const v=gait.at(i/1000,squares,duration);
   near(v,{...REST,travel:i/1000});assert.ok(v.travel>=previous);previous=v.travel;
  }
  near(gait.at(0,squares,duration),REST);near(gait.at(1,squares,duration),{...REST,travel:1});
 }
 assert.equal(paintedPace(1,640,.8).duration,600);
 assert.equal(paintedPace(7,640,1).rate,2);
 assert.equal(paintedPace(7,640,.2),null);
});
test('painted travel holds each pose and lands before the turn', () => {
 const cases=[
  ['pawn N',1,640,.682,160],['guard N',1,640,.92,160],
  ['ogre E',1,640,1.41,160],['queen N',1,640,1.05,160],
  ['pawn W',1,640,.39,160],['ogre NE',Math.SQRT2,720,1.76,180],
 ];
 for(const [name,squares,cycle,stride,hold] of cases)for(const distance of [squares,squares*2,squares*7]){
  const pace=paintedPace(distance,cycle,stride);if(!pace)continue;
  const {duration,rate}=pace,frames=[0,hold,hold*2,hold*3].map(timeMs=>({timeMs}));
  const at=t=>paintedTravel(t,duration,rate,frames,cycle);
  assert.equal(at(0),0,`${name}: start`);assert.equal(at(duration),1,`${name}: end`);
  let previous=0,previousPose=-1;
  for(let t=0;t<duration;t++){
   const value=at(t),pose=Math.floor(t*rate/hold);
   assert.ok(value>=previous-1e-12&&value<=1,`${name}: forward at ${t}`);
   if(pose===previousPose)assert.ok(Math.abs(value-previous)<1e-12,`${name}: held at ${t}`);
   previous=value;previousPose=pose;
  }
  // Sample the last displayed pose, including an exact pose-clock boundary at the move end.
  for(const frameMs of [0.001,1]){
   const lastTime=Math.floor((duration-.001)/frameMs)*frameMs;
   assert.ok((1-at(lastTime))*distance*112<=3,`${name}: end gap at ${frameMs} ms`);
  }
 }
 const frames=[0,160,320,480].map(timeMs=>({timeMs}));
 for(const [t,want] of [[0,0],[159,0],[160,1/3],[319,1/3],[320,2/3],[480,1],[639,1],[640,1]]){
  assert.equal(paintedTravel(t,640,1,frames,640),want,`pose boundary ${t}`);
 }
 // A second cycle continues forward, and its final pose already holds at the target.
 assert.equal(paintedTravel(330,640,2,frames,640),4/7);
 assert.equal(paintedTravel(639,640,2,frames,640),1);
});
test('every gait named by a figure exists', () => {
  for (const g of Object.values(GAIT_OF)) assert.ok(GAITS[g], g);
});
test('idle fades in and stays subtle', () => {
  near(idleAt(0), { sx: 1, sy: 1, lift: 0, shadow: 1 });
  for (let ms = 0; ms < 3 * IDLE.period; ms += 37) { const v = idleAt(ms); assert.ok(v.sy <= 1.03 && v.sx >= .98 && v.lift <= 2 && v.shadow >= .89); }
});
