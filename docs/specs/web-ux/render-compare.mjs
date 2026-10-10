// Compares the renders of two capture runs (capture.mjs) pixel by pixel, for a proof of no visible change
// (after-redesign spec, §4.4).
//   node docs/specs/web-ux/render-compare.mjs <folder A> <folder B> [threshold]
// It pairs each PNG under A with the PNG of the same relative path under B (one sample folder, or a parent
// with one folder for each sample) and counts the pixels whose red, green or blue value differs by more than
// the threshold (default 16 of 255). It prints each pair with such pixels and a summary, and exits 1 when a
// pair differs or a PNG has no partner.
// Two renders of one build are not the same pixel for pixel: a phone render (device scale 2) carries a dither
// pattern of about 140,000 pixels that differ by 1, and a state with motion (a haste chain, a replay) can
// catch another frame. The threshold removes the dither. For the motion states, render the same build twice
// (A against A2): a pair that differs there is unstable, and its A against B result proves nothing.
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const [a, b, limit = '16'] = process.argv.slice(2);
if (!a || !b) { console.error('usage: node docs/specs/web-ux/render-compare.mjs <folder A> <folder B> [threshold]'); process.exit(2); }
const threshold = Number(limit);

/** Every PNG under a folder, as paths relative to it. */
function pngs(root, dir = root) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? pngs(root, path) : name.endsWith('.png') ? [relative(root, path)] : [];
  }).sort();
}

const raw = path => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const left = pngs(a), right = new Set(pngs(b));
let pairs = 0, differ = 0, missing = 0;
for (const name of left) {
  if (!right.has(name)) { console.log(`MISSING ${name}: not in ${b}`); missing++; continue; }
  right.delete(name);
  const [x, y] = await Promise.all([raw(join(a, name)), raw(join(b, name))]);
  pairs++;
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
    console.log(`SIZE ${name}: ${x.info.width}x${x.info.height} against ${y.info.width}x${y.info.height}`);
    differ++;
    continue;
  }
  let strong = 0, any = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    const d = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]));
    if (d) any++;
    if (d > threshold) strong++;
  }
  if (strong) { console.log(`DIFF ${name}: ${strong} pixels differ by more than ${threshold} (${any} differ at all) of ${x.info.width * x.info.height}`); differ++; }
}
for (const name of right) { console.log(`MISSING ${name}: not in ${a}`); missing++; }
console.log(`render-compare: ${pairs} pairs, ${differ} differ, ${missing} with no partner; threshold ${threshold}`);
process.exit(differ || missing ? 1 : 0);
