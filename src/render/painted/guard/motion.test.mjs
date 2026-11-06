import test from 'node:test';
import assert from 'node:assert/strict';
import { actionAt,upperBodyShift } from './motion.mjs';

test('Guard brace is finite, bounded, planted and returns to rest', () => {
  let peak = 0;
  let minimum = 0;
  for (let i = 0; i <= 1152; i++) {
    const amount = actionAt(i / 1152);
    assert.ok(Number.isFinite(amount));
    assert.ok(amount >= -0.14 - 1e-9 && amount <= 1 + 1e-9);
    for(const p of [{x:250,y:880},{x:560,y:952},{x:400,y:980}])assert.deepEqual(upperBodyShift(p,amount*15),p);
    const hand=upperBodyShift({x:640,y:710},amount*15),shoulder=upperBodyShift({x:620,y:400},amount*15);
    assert.ok(Math.abs((hand.x-shoulder.x)-20)<1e-9);assert.ok(Math.abs((hand.y-shoulder.y)-310)<1e-9);
    peak = Math.max(peak, amount);
    minimum = Math.min(minimum, amount);
  }
  assert.equal(actionAt(0), 0);
  assert.equal(actionAt(1), 0);
  assert.equal(actionAt(0.5), 1);
  assert.ok(peak === 1 && minimum < 0);
  console.log('1,153 brace samples: bounded preparation, rigid +x brace, hold and recovery.');
});
