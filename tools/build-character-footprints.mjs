/**
 * The soft pool's table: what touches the floor in each frame of a runtime package. The game cannot read a frame's
 * pixels while it plays (a readback stalls it), so this tool reads each frame's alpha once and writes footprints.json
 * beside the manifest. The manifest and the catalog stay as they are.
 *
 *   node tools/build-character-footprints.mjs [package folder, default public/character-runtime]
 *
 * tools/convert-character-runtime-webp.mjs runs it for each package it writes. Run it by hand after any other change to
 * a package's frames. A frame not in the table has its character's standing pool, so an import that forgets it still plays.
 *
 * Table: {schemaVersion, keyLength, frames: {first keyLength hex of sourceSha256: [span, cx, cy, tilt × 100, air]}}, in
 * bank pixels from the bank's pivot (see footprint in contact-shadow.mjs); trailing zeros are left out.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { footprint } from '../src/render/painted/contact-shadow.mjs';

const FIELDS = ['span', 'cx', 'cy', 'tilt', 'air'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = list => list.reduce((n, v) => n + v, 0) / list.length;
const pick = (fp, field) => fp[field];

/** A walk has few poses and they differ much. One stable pool for the bank (its widest half: the planted poses), and a gentle breath. */
export function walkFootprints(list, tall) {
  const out = list.map(fp => ({ ...fp }));
  const spans = list.map(fp => fp.span).sort((a, b) => b - a), span = mean(spans.slice(0, Math.max(1, spans.length >> 1)));
  const at = { cx: mean(list.map(fp => fp.cx)), cy: mean(list.map(fp => fp.cy)), tilt: mean(list.map(fp => fp.tilt)) };
  for (const fp of out) {
    fp.span = span + clamp(.25 * (fp.span - mean(spans)), -.08 * span, .08 * span);
    fp.cx = at.cx + clamp(.15 * (fp.cx - at.cx), -.02 * tall, .02 * tall);
    fp.cy = at.cy + clamp(.15 * (fp.cy - at.cy), -.01 * tall, .01 * tall);
    fp.tilt = at.tilt;
    fp.air = 0;
  }
  return out;
}
/** A turn goes straight from one facing's footprint to the next. The frames between take no measure of their own. */
export function turnFootprints(list, times) {
  const first = list[0], last = list.at(-1), end = times.at(-1) || 1;
  return list.map((_, i) => Object.fromEntries(FIELDS.map(field => [field, pick(first, field) + (pick(last, field) - pick(first, field)) * times[i] / end])));
}
/** Other banks follow their feet, without the jumps from pose to pose. In the air there is no contact: the pool waits between the last and next. */
export function followFootprints(list, times, tall, windowMs = 90) {
  const grounded = list.map(fp => fp.air < .06 * tall);
  const held = list.map((fp, i) => {
    if (grounded[i]) return fp;
    let a = i, b = i; while (a > 0 && !grounded[a]) a--; while (b < list.length - 1 && !grounded[b]) b++;
    const from = grounded[a] ? list[a] : list[b], to = grounded[b] ? list[b] : list[a], k = times[b] > times[a] ? (times[i] - times[a]) / (times[b] - times[a]) : 0;
    return { ...Object.fromEntries(FIELDS.map(field => [field, pick(from, field) + (pick(to, field) - pick(from, field)) * k])), air: fp.air };
  });
  return held.map((_, i) => {
    let sum = 0; const out = Object.fromEntries(FIELDS.map(field => [field, 0]));
    for (let j = 0; j < held.length; j++) { const w = 1 - Math.abs(times[j] - times[i]) / windowMs; if (w <= 0) continue; sum += w; for (const field of FIELDS) out[field] += w * held[j][field]; }
    for (const field of FIELDS) out[field] /= sum;
    return out;
  });
}

/** Read, smooth and write the table of the package in folder. Returns its size. The same frames give the same bytes. */
export async function writeFootprints(folder) {
  const manifest = JSON.parse(await readFile(resolve(folder, 'manifest.json'), 'utf8'));
  // Each frame once, in the geometry of a bank that holds it (a bank's attack frames are cropped about its canvas).
  const banks = manifest.banks.filter(b => b.pivot && b.canvasSize && b.registrationHeightPx), todo = new Map();
  for (const b of banks) for (const f of b.frames) if (!todo.has(f.sourceSha256)) todo.set(f.sourceSha256, [f.url, b]);
  const raw = new Map(), list = [...todo];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (list.length) {
      const [sha, [url, b]] = list.pop();
      const { data, info } = await sharp(resolve(folder, url)).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
      const dx = (b.canvasSize[0] - info.width) / 2, dy = (b.canvasSize[1] - info.height) / 2, fp = footprint(data, info.width, info.height, b.pivot[0] - dx, b.pivot[1] - dy, b.registrationHeightPx);
      if (fp) raw.set(sha, { ...fp, air: fp.air < .03 * b.registrationHeightPx ? 0 : fp.air });
    }
  }));
  // A frame several banks share is where they join: a turn's end, an idle's rest. It keeps its measure, so each bank
  // reaches the same value there. Then the banks whose frames are their own.
  const table = new Map();
  const seen = new Map(); for (const b of banks) for (const f of new Set(b.frames.map(f => f.sourceSha256))) seen.set(f, (seen.get(f) ?? 0) + 1);
  for (const [sha, n] of seen) if (n > 1 && raw.has(sha)) table.set(sha, raw.get(sha));
  const ranked = { turn: 0, idle: 1, move: 2, movement: 3, attack: 4 };
  for (const b of [...banks].sort((u, v) => (ranked[u.kind] ?? 9) - (ranked[v.kind] ?? 9))) {
    const frames = b.frames.filter(f => raw.has(f.sourceSha256)); if (!frames.length) continue;
    const prints = frames.map(f => raw.get(f.sourceSha256)), times = frames.map(f => f.timeMs ?? 0), tall = b.registrationHeightPx;
    const smooth = b.kind === 'move' ? walkFootprints(prints, tall) : b.kind === 'turn' ? turnFootprints(prints, times) : followFootprints(prints, times, tall);
    frames.forEach((f, i) => { if (!table.has(f.sourceSha256)) table.set(f.sourceSha256, smooth[i]); });
  }
  // The shortest key that tells the frames apart keeps the table small.
  const shas = [...table.keys()].sort();
  let keyLength = 6; for (;;) { if (new Set(shas.map(s => s.slice(0, keyLength))).size === shas.length) break; keyLength++; }
  const round = (fp, field) => Math.round(field === 'tilt' ? fp.tilt * 100 : fp[field]) || 0;
  const frames = {};
  for (const sha of shas) { const row = FIELDS.map(field => round(table.get(sha), field)); while (row.at(-1) === 0) row.pop(); frames[sha.slice(0, keyLength)] = row; }
  const text = JSON.stringify({ schemaVersion: 1, keyLength, frames }) + '\n';
  await writeFile(resolve(folder, 'footprints.json'), text);
  return { frames: shas.length, keyLength, bytes: Buffer.byteLength(text) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await writeFootprints(resolve(process.argv[2] ?? 'public/character-runtime'))));
}
