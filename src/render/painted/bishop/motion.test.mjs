import test from 'node:test';
import assert from 'node:assert/strict';
import { actionAt, ANCHOR, DURATION, HIT } from './motion.mjs';

test('Bishop action is bounded, staged, and returns to neutral', () => {
  assert.equal(DURATION, 1180);
  assert.deepEqual(ANCHOR, { x: 576, y: 1018 });
  assert.deepEqual(HIT, { x: 576, y: 500 });
  assert.equal(actionAt(-1), 0);
  assert.equal(actionAt(0), 0);
  assert.equal(actionAt(1), 0);

  let peak = -Infinity;
  let peakAt = 0;
  let previous = actionAt(0.2);
  for (let i = 0; i <= 1000; i++) {
    const t = i / 1000;
    const value = actionAt(t);
    assert.ok(value >= -0.160001 && value <= 1.000001, `out of range at ${t}: ${value}`);
    if (value > peak) { peak = value; peakAt = t; }
    if (t > 0.2 && t <= 0.5) assert.ok(value + 1e-9 >= previous, `wind-up fell at ${t}`);
    if (t >= 0.72) assert.ok(value <= previous + 1e-9, `recovery rose at ${t}`);
    previous = value;
  }
  assert.ok(peak > 0.99 && peakAt >= 0.49 && peakAt <= 0.73);
  assert.ok(actionAt(0.1) < 0);
  assert.equal(actionAt(0.6), 1);
  assert.ok(actionAt(0.9) < 0.5);
});
