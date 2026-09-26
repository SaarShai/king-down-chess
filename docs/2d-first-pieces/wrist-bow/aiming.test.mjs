import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MIN_ANGLE, MAX_ANGLE, FIGURE_Y, armyOffset, aimAt, muzzle, targetPoint, shoulderMesh } from './aiming.mjs';

const area = ([a, b, c]) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('aim arc stays connected, keeps the hand rigid and sends the bolt to its target', () => {
  let poses = 0, minimumAreaRatio = Infinity;
  for (const side of [0, 1]) {
    // Include the extra 1.8° recoil beyond the upper aiming limit.
    for (let sample = 0; sample < 470; sample++) {
      const lower = MIN_ANGLE - 1.8 * Math.PI / 180;
      const angle = lower + (MAX_ANGLE - lower) * sample / 469;
      const mesh = shoulderMesh(angle, side);
      for (const triangle of mesh.triangles) {
        const before = triangle.map(i => mesh.source[i]), after = triangle.map(i => mesh.destination[i]);
        const ratio = area(after) / area(before);
        assert.ok(ratio > .1, 'no collapsed or reversed shoulder triangles');
        minimumAreaRatio = Math.min(minimumAreaRatio, ratio);
        if (before.every(p => p.x >= 550 + armyOffset(side))) {
          for (let i = 0; i < 3; i++) assert.ok(Math.abs(distance(before[i], before[(i + 1) % 3]) - distance(after[i], after[(i + 1) % 3])) < 1e-8, 'hand and weapon keep their shape');
        }
      }
      for (let i = 0; i < mesh.source.length; i++) {
        if (mesh.source[i].x <= 350) assert.deepEqual(mesh.destination[i], mesh.source[i], 'body edge stays anchored');
      }
      if (angle >= MIN_ANGLE) for (const reach of [120, 225, 330]) {
        const start = muzzle(angle, side), target = targetPoint(angle, reach, side);
        const aim = aimAt(target.x, target.y, side);
        assert.ok(Math.abs(aim.angle - angle) < 1e-8 && Math.abs(aim.reach - reach) < 1e-8, 'pointer point and bow axis agree');
        assert.ok(Math.abs(distance(start, target) - reach) < 1e-8, 'bolt travel ends at target');
        assert.ok(target.x > start.x && target.x < 1120 && target.y > 32 && target.y < 1100, 'target stays inside the preview');
      }
      poses++;
    }
    const neutral = muzzle(0, side);
    assert.equal(neutral.y, 216 + FIGURE_Y, 'neutral muzzle stays on the illustrated bolt');
    assert.equal(aimAt(1100, -1000, side).angle, MIN_ANGLE);
    assert.equal(aimAt(1100, 2000, side).angle, MAX_ANGLE);
  }
  console.log(`${poses} poses checked; smallest triangle area ratio ${minimumAreaRatio.toFixed(3)}`);
});
