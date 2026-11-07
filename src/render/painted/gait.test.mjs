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
test('painted travel mixes the linear path with the pose step', () => {
 const frames=[0,160,320,480].map(timeMs=>({timeMs}));
 const at=(t,mix)=>paintedTravel(t,640,1,frames,640,mix);
 assert.equal(at(0,.5),0);
 assert.equal(at(640,.5),1);
 for(const t of [0,10,159,160,300,479,639])assert.ok(Math.abs(at(t,0)-t/640)<1e-12,`s=0 at ${t}`);
 assert.equal(at(100,1),0);
 assert.equal(at(159,1),0);
 // The held path reaches the square when the last pose on screen (480 ms) starts.
 for(const [t,start] of [[160,160],[319,160],[480,480],[639,480]])assert.ok(Math.abs(at(t,1)-start/480)<1e-12,`s=1 at ${t}`);
 // Two pose cycles in one move: the step carries on from the first cycle to the second; the last pose starts at 1120.
 const two=(t,mix)=>paintedTravel(t,640,2,frames,640,mix);
 assert.ok(Math.abs(two(100,1)-160/1120)<1e-12);
 assert.ok(Math.abs(two(330,1)-640/1120)<1e-12);
 assert.equal(two(639,1),1);
 let previous=0;
 for(const move of [at,two]){
  let held=0;previous=0;  for(let t=0;t<=640;t+=2){
   const u=move(t,.5),step=move(t,1);
   assert.ok(u>=previous-1e-12,`monotonic at ${t}`);
   assert.ok(step>=held-1e-12,`step monotonic at ${t}`);
   const linear=move(t,0);assert.ok(u>=Math.min(step,linear)-1e-12&&u<=Math.max(step,linear)+1e-12,`between at ${t}`);
   previous=u;held=step;
  }
 }
 for(const [t,start] of [[50,0],[200,160],[500,480],[630,480]])assert.ok(Math.abs(at(t,1)-start/480)<1e-12,`hold at ${t}`);
});
test('painted travel ends on the square without a snap, for any pose count', () => {
 for(const count of [4,6,8,16])for(const [duration,rate,cycle] of [[600,1,640],[909,1,800],[678,1,720],[480,1,640],[2240,2,640]]){
  const frames=[...Array(count)].map((_,i)=>({timeMs:i*cycle/count}));
  // On the last 60 fps frame of the walk only the linear half of the path is still short.
  const frame=1000/60,last=paintedTravel(duration-frame,duration,rate,frames,cycle);
  assert.ok(1-last<=.5*frame/duration+1e-12,`${count} poses, ${duration} ms: ${last}`);
 }
 // One pose for the whole walk: the body moves on the linear path.
 assert.equal(paintedTravel(50,100,1,[{timeMs:0},{timeMs:320}],640),.5);
});
test('every gait named by a figure exists', () => {
  for (const g of Object.values(GAIT_OF)) assert.ok(GAITS[g], g);
});
test('idle fades in and stays subtle', () => {
  near(idleAt(0), { sx: 1, sy: 1, lift: 0, shadow: 1 });
  for (let ms = 0; ms < 3 * IDLE.period; ms += 37) { const v = idleAt(ms); assert.ok(v.sy <= 1.03 && v.sx >= .98 && v.lift <= 2 && v.shadow >= .89); }
});
