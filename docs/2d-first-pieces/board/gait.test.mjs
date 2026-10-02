import test from 'node:test';
import assert from 'node:assert/strict';
import { GAITS, GAIT_OF, IDLE, idleAt } from './gait.mjs';

const REST = { travel: 0, lift: 0, sx: 1, sy: 1, tilt: 0, shadow: 1 };
const near = (actual, expected) => { for (const k of Object.keys(expected)) assert.ok(Math.abs(actual[k] - expected[k]) < 1e-9, `${k}: ${actual[k]} vs ${expected[k]}`); };
for (const [name, gait] of Object.entries(GAITS)) {
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
test('every gait named by a figure exists', () => {
  for (const g of Object.values(GAIT_OF)) assert.ok(GAITS[g], g);
});
test('idle fades in and stays subtle', () => {
  near(idleAt(0), { sx: 1, sy: 1, lift: 0, shadow: 1 });
  for (let ms = 0; ms < 3 * IDLE.period; ms += 37) { const v = idleAt(ms); assert.ok(v.sy <= 1.03 && v.sx >= .98 && v.lift <= 2 && v.shadow >= .89); }
});
