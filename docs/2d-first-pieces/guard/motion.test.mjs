import test from 'node:test';
import assert from 'node:assert/strict';
import { actionAt } from './motion.mjs';

test('Guard brace is finite, bounded, planted and returns to rest', () => {
  let peak = 0;
  let minimum = 0;
  for (let i = 0; i <= 1152; i++) {
    const amount = actionAt(i / 1152);
    assert.ok(Number.isFinite(amount));
    assert.ok(amount >= -0.14 - 1e-9 && amount <= 1 + 1e-9);
    peak = Math.max(peak, amount);
    minimum = Math.min(minimum, amount);
  }
  assert.equal(actionAt(0), 0);
  assert.equal(actionAt(1), 0);
  assert.equal(actionAt(0.5), 1);
  assert.ok(peak === 1 && minimum < 0);
  console.log('1,153 brace samples: bounded preparation, rigid +x brace, hold and recovery.');
});
