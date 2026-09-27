import test from 'node:test';
import assert from 'node:assert/strict';
import { slashAngle, SLASH, CONTACT_MS } from '../bishop/motion.mjs';
import { smashAngle, SMASH, bendPoint } from '../court-motion.mjs';

const continuous = (f, end, limit) => { for (let ms = 1; ms <= end; ms++) assert.ok(Math.abs(f(ms) - f(ms - 1)) < limit, `jump at ${ms} ms`); };

test('bishop slash winds up, crosses contact during the strike and returns to rest', () => {
  assert.equal(slashAngle(0), 0); assert.equal(slashAngle(SLASH.duration), 0);
  assert.ok(slashAngle(SLASH.wind[1] - 1) < 0);
  assert.ok(CONTACT_MS > SLASH.strike[0] && CONTACT_MS < SLASH.strike[1]);
  continuous(slashAngle, SLASH.duration, .04);
});

test('paladin smash lifts, chops and keeps hammer, gauntlets and pommel rigid', () => {
  assert.equal(smashAngle(0), 0); assert.equal(smashAngle(SMASH.recover), 0);
  assert.ok(smashAngle(SMASH.lift[1] - 1) < 0 && smashAngle(SMASH.chop[1]) > .4);
  continuous(smashAngle, SMASH.duration, .02);
  // Hammer head corners, handle, pommel and both gauntlets keep their distances.
  const held = [[510, 290], [640, 255], [720, 380], [715, 520], [630, 565], [80, 600], [160, 615], [200, 420], [480, 500]].map(([x, y]) => ({ x, y }));
  const moved = held.map(p => bendPoint(p, SMASH.down));
  for (let i = 1; i < held.length; i++) {
    const before = Math.hypot(held[i].x - held[0].x, held[i].y - held[0].y), after = Math.hypot(moved[i].x - moved[0].x, moved[i].y - moved[0].y);
    assert.ok(Math.abs(before - after) < .5, `point ${i} stretched by ${after - before}`);
  }
});
