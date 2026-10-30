import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';
import { ghostScore, matteFringe, measureFrame, readFrame, registerFrame } from './anim/frames.mjs';
import { geometryFromManifest, edgeFor } from './anim/geometry.mjs';
import { midpointPlan, planTiming } from './anim/plan.mjs';
import { makeBank } from './anim/bank.mjs';
import { promote } from './anim/promote.mjs';
import { matchesRest } from './anim/movement.mjs';
import { runGates } from './anim/gates.mjs';

let dir = '';
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

it('fails a matte rim but passes a clean dark edge near the matte', () => {
  const makeFrame = (interior: number[], edge: number[]) => {
    const width = 48, height = 48, data = Buffer.alloc(width * height * 4);
    for (let y = 8; y < 40; y++) for (let x = 8; x < 40; x++) {
      const rim = x === 8 || x === 39 || y === 8 || y === 39;
      const p = (y * width + x) * 4;
      data.set([...(rim ? edge : interior), rim ? 128 : 255], p);
    }
    const image = { data, width, height }, measure = measureFrame(image);
    return { file: 'fixture', method: 'authored', sources: [], metadata: { channels: 4 }, measure,
      fringe: matteFringe(image, measure), ghost: ghostScore(image), sha256: 'a'.repeat(64), timeMs: 0 };
  };
  const halo = makeFrame([180, 160, 140], [44, 52, 46]);
  const dark = makeFrame([50, 60, 55], [50, 60, 55]);
  const haloCheck = (frame: typeof halo) => runGates({ bank: { pivot: [24, 39] }, frames: [frame, { ...frame, timeMs: 15 }],
    geometry: { pivot: [24, 39] }, plan: { frameCount: 2, durationMs: 15, frameMs: 15 } }).checks.find(check => check.name === 'matte-halo');
  expect(haloCheck(halo)?.ok).toBe(false);
  expect(halo.fringe.ratio).toBeGreaterThan(0.3);
  expect(haloCheck(dark)?.ok).toBe(true);
  expect(dark.fringe.ratio).toBe(0);
});

/** A 96x96 key with a 60 px tall blob whose lowest row is one pixel above the pivot. */
async function key(path: string, shift: number, colour: [number, number, number]) {
  const size = 96, data = Buffer.alloc(size * size * 4);
  for (let y = 20; y < 80; y++) for (let x = 30 + shift; x < 66 + shift; x++) {
    const offset = (y * size + x) * 4;
    data[offset] = colour[0]; data[offset + 1] = colour[1]; data[offset + 2] = colour[2]; data[offset + 3] = 255;
  }
  await sharp(data, { raw: { width: size, height: size, channels: 4 } }).png().toFile(path);
  return digest(await readFile(path));
}

async function fixture() {
  dir = await mkdtemp(join(tmpdir(), 'animation-bank-'));
  const keys = join(dir, 'keys');
  await mkdir(keys);
  const hashes: string[] = [];
  hashes.push(await key(join(keys, '000.png'), 0, [40, 90, 200]));
  hashes.push(await key(join(keys, '001.png'), 2, [60, 100, 210]));
  hashes.push(await key(join(keys, '002.png'), 4, [80, 110, 220]));
  const endpoints = Object.fromEntries(hashes.map((hash, index) => [hash, { bank: `fixture-${index}`, role: index === 0 ? 'first' : 'last', facing: index === 0 ? 'SE' : 'S' }]));
  const geometry = { character: 'pawn', army: 'white', canvas: [96, 96], pivot: [48, 80], bodyHeightPx: 60, boardScale: null, authority: { kind: 'fixture', path: join(dir, 'authority.json'), sha256: 'a'.repeat(64) }, endpoints };
  const geometryPath = join(dir, 'geometry.json');
  await writeFile(geometryPath, JSON.stringify(geometry));
  return { keys, geometry, geometryPath, hashes };
}

it('plans a dyadic timing and a parent-first midpoint order', () => {
  const plan = planTiming({ durationMs: 120, frameMs: 15 }, 3);
  expect(plan).toMatchObject({ frameCount: 9, keyIndexes: [0, 4, 8], steps: 4, hold: false });
  expect(() => planTiming({ durationMs: 100, frameMs: 15 }, 3)).toThrow('multiple of frameMs');
  expect(() => planTiming({ durationMs: 90, frameMs: 15 }, 3)).toThrow('power-of-two');
  expect(() => planTiming({ durationMs: 105, frameMs: 15 }, 2)).toThrow('power-of-two');
  const midpoints = midpointPlan([0, 4, 8]);
  expect(midpoints.map(point => point.index)).toEqual([2, 1, 3, 6, 5, 7]);
  for (const point of midpoints) {
    expect(point.left).toBeLessThan(point.index);
    expect(point.right).toBeGreaterThan(point.index);
  }
  expect(edgeFor('turn', 'SE-S')).toEqual({ from: 'SE', to: 'S', facing: 'S' });
  expect(() => edgeFor('idle', 'SE-S')).toThrow('Only a turn');
});

it('reads locked geometry and endpoints from the runtime manifest', async () => {
  dir = await mkdtemp(join(tmpdir(), 'animation-geometry-'));
  const manifest = {
    schemaVersion: 1, sourceToRuntimeScale: 0.5,
    banks: [
      { id: 'white-idle', character: 'pawn', army: 'white', kind: 'idle', facing: 'SE', canvasSize: [48, 48], pivot: [24, 40], bodyHeightPx: 30, registrationHeightPx: 30, frames: [{ sourceSha256: 'b'.repeat(64) }, { sourceSha256: 'b'.repeat(64) }] },
      { id: 'white-turn-SE-S', character: 'pawn', army: 'white', kind: 'turn', from: 'SE', to: 'S', facing: 'S', canvasSize: [48, 48], pivot: [24, 40], bodyHeightPx: 30, registrationHeightPx: 30, frames: [{ sourceSha256: 'b'.repeat(64) }, { sourceSha256: 'c'.repeat(64) }] },
    ],
  };
  const path = join(dir, 'manifest.json');
  await writeFile(path, JSON.stringify(manifest));
  const geometry = await geometryFromManifest(path, 'pawn', 'white');
  expect(geometry.canvas).toEqual([96, 96]);
  expect(geometry.pivot).toEqual([48, 80]);
  expect(geometry.bodyHeightPx).toBe(60);
  expect(geometry.authority.sha256).toBe(digest(await readFile(path)));
  expect(geometry.endpoints['b'.repeat(64)]).toMatchObject({ bank: 'white-idle', facing: 'SE' });
  expect(geometry.endpoints['c'.repeat(64)]).toMatchObject({ bank: 'white-turn-SE-S', role: 'last', facing: 'S' });
  await expect(geometryFromManifest(path, 'rook', 'white')).rejects.toThrow('no bank');
});

it('keeps a locked key on every pixel and registers a smaller key to the pivot', async () => {
  const { geometryPath, keys } = await fixture();
  const geometry = JSON.parse(await readFile(geometryPath, 'utf8'));
  const locked = await readFrame(join(keys, '000.png'));
  const kept = await registerFrame(locked, geometry);
  expect(kept.transform.identity).toBe(true);
  expect(kept.frame.data.equals(locked.data)).toBe(true);
  const measured = measureFrame(locked);
  expect(measured.bottom).toBe(79);
  expect(Math.abs(measured.contentHeight - geometry.bodyHeightPx)).toBeLessThanOrEqual(2);

  const smallPath = join(dir, 'small.png');
  await sharp({ create: { width: 48, height: 48, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(join(keys, '000.png')).resize(48, 48, { kernel: 'nearest' }).toBuffer(), top: 0, left: 0 }]).png().toFile(smallPath);
  const scaled = await registerFrame(await readFrame(smallPath), geometry);
  expect(scaled.transform.identity).toBe(false);
  const after = measureFrame({ ...scaled.frame, width: 96, height: 96 });
  expect(Math.abs(after.bottom - geometry.pivot[1])).toBeLessThanOrEqual(1);
  expect(Math.abs(after.contentHeight - geometry.bodyHeightPx)).toBeLessThanOrEqual(2);
  expect(Math.abs(after.footCenterX - geometry.pivot[0])).toBeLessThanOrEqual(1);
});

it('makes a candidate bank through the gates with a stub in-betweener', async () => {
  const { keys, geometryPath, geometry } = await fixture();
  const stub = join(dir, 'stub.mjs');
  await writeFile(stub, `import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const base = dirname(process.argv[2]);
for (const frame of plan.frames) { const out = resolve(base, frame.output); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, readFileSync(resolve(base, frame.left))); }
writeFileSync(resolve(base, 'report.json'), JSON.stringify({ frames: plan.frames.length }));
`);
  const output = join(dir, 'out');
  const result = await makeBank({ character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, geometry: geometryPath, output, infer: `node ${stub}`, timing: { durationMs: 60, frameMs: 15 }, preview: false });
  expect(result.gates).toBe('pass');
  expect(result.frames).toBe(5);
  const bank = JSON.parse(await readFile(result.candidate, 'utf8'));
  expect(bank).toMatchObject({ id: 'white-turn-SE-S', status: 'candidate', kind: 'turn', from: 'SE', to: 'S', facing: 'S', durationMs: 60, canvasSize: [96, 96], pivot: [48, 80] });
  expect(bank.frames.map((frame: any) => frame.method)).toEqual(['authored', 'rife', 'authored', 'rife', 'authored']);
  const gates = JSON.parse(await readFile(join(output, 'gates.json'), 'utf8'));
  expect(gates.status).toBe('pass');
  expect(gates.checks.map((check: any) => check.name)).toEqual(['rgba', 'exterior', 'matte-halo', 'ghost', 'geometry', 'endpoints', 'timing', 'provenance']);
  const provenance = JSON.parse(await readFile(join(output, 'provenance.json'), 'utf8'));
  expect(provenance.frames[1].sources).toEqual([bank.frames[0].sha256, bank.frames[2].sha256]);

  const broken = await makeBank({ character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, geometryRecord: { ...geometry, endpoints: {} }, output: join(dir, 'broken'), infer: `node ${stub}`, timing: { durationMs: 60, frameMs: 15 }, preview: false }).catch(error => error);
  expect(broken.message).toContain('Gates failed');
  expect(broken.gates.failing.join(' ')).toContain('endpoints');
});

it('screens ghost limbs and holds the nearest clean frame with its hash', async () => {
  const { keys, geometryPath } = await fixture();
  const source = await readFrame(join(keys, '000.png'));
  for (let y = 30; y < 50; y++) for (let x = 5; x < 15; x++) source.data[(y * 96 + x) * 4 + 3] = 128;
  const blob = join(dir, 'blob.png');
  await sharp(source.data, { raw: { width: 96, height: 96, channels: 4 } }).png().toFile(blob);
  const stub = join(dir, 'ghost-stub.mjs');
  await writeFile(stub, `import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8')), base = dirname(process.argv[2]);
for (const frame of plan.frames) { const out = resolve(base, frame.output); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, readFileSync(frame.output.endsWith('001.png') ? ${JSON.stringify(blob)} : resolve(base, frame.left))); }
writeFileSync(resolve(base, 'report.json'), '{}');`);
  const options = { character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, geometry: geometryPath, infer: `node ${stub}`, timing: { durationMs: 60, frameMs: 15 }, preview: false };
  const plain = await makeBank({ ...options, output: join(dir, 'plain') }).catch(error => error);
  expect(plain.gates.checks.find((check: any) => check.name === 'ghost')).toMatchObject({ ok: false, metrics: { worst: 'frames/001.png' } });
  const result = await makeBank({ ...options, output: join(dir, 'hold'), ghostRepair: 'hold' });
  expect(result.gates).toBe('pass');
  const bank = JSON.parse(await readFile(result.candidate, 'utf8'));
  expect(bank.frames[1]).toMatchObject({ method: 'hold', sha256: bank.frames[0].sha256, sources: [bank.frames[0].sha256] });
  const report = JSON.parse(await readFile(join(dir, 'hold', 'gates.json'), 'utf8'));
  expect(report.checks.find((check: any) => check.name === 'ghost').ok).toBe(true);
});

it('allows soft art present in authored frames and measures the exact radius', () => {
  const width = 32, height = 32, data = Buffer.alloc(width * height * 4);
  for (let y = 10; y < 20; y++) for (let x = 10; x < 20; x++) data[(y * width + x) * 4 + 3] = 255;
  data[(10 * width + 7) * 4 + 3] = 128; // exactly 3 px from the core
  data[(10 * width + 6) * 4 + 3] = 128;
  const image = { data, width, height }, score = ghostScore(image);
  expect(score).toBe(0.01);
  const measure = measureFrame(image), frame = { file: 'soft', method: 'authored', sources: [], metadata: { channels: 4 }, measure,
    fringe: matteFringe(image, measure), ghost: score, sha256: 'a'.repeat(64), timeMs: 0 };
  const result = runGates({ bank: { pivot: [16, 19] }, frames: [frame, { ...frame, method: 'rife', timeMs: 15 }, { ...frame, timeMs: 30 }],
    geometry: { pivot: [16, 19] }, plan: { frameCount: 3, durationMs: 30, frameMs: 15 } });
  expect(result.checks.find(check => check.name === 'ghost').ok).toBe(true);
});

it('keeps the shipped movement rest at its pivot and scale on a padded canvas', async () => {
  const { keys, geometry, hashes } = await fixture();
  for (const [name, shift] of [['000.png', 0], ['001.png', 2]] as const) {
    const frame = await readFrame(join(keys, name));
    for (let y = 20; y < 36; y++) for (let x = 30 + shift; x < 66 + shift; x++) {
      const p = (y * frame.width + x) * 4;
      frame.data[p] = ((x - shift) * 17 + y * 3) % 200 + 30;
      frame.data[p + 1] = ((x - shift) * 5 + y * 11) % 200 + 30;
      frame.data[p + 2] = ((x - shift) * 7 + y * 13) % 200 + 30;
    }
    await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } }).png().toFile(join(keys, name));
  }
  hashes[0] = digest(await readFile(join(keys, '000.png')));
  await writeFile(join(keys, '002.png'), await readFile(join(keys, '000.png')));
  const pose = await readFrame(join(keys, '001.png'));
  pose.data[(40 * pose.width) * 4] = 200;
  pose.data[(40 * pose.width) * 4 + 3] = 255;
  await sharp(pose.data, { raw: { width: pose.width, height: pose.height, channels: 4 } }).png().toFile(join(keys, '001.png'));
  const manifest = join(dir, 'runtime.json');
  const runtime = { sourceToRuntimeScale: 0.5, banks: [{ id: 'turn', character: 'pawn', army: 'white', kind: 'turn', from: 'SE', to: 'S', canvasSize: [48, 48], pivot: [24, 40], registrationHeightPx: 35, boardScale: null, frames: [{ sourceSha256: hashes[0] }, { sourceSha256: hashes[2] }] }] };
  await writeFile(manifest, JSON.stringify(runtime));
  const authority = { kind: 'runtime-manifest', path: manifest, sha256: digest(await readFile(manifest)) };
  const output = join(dir, 'movement');
  const options = { character: 'pawn', army: 'white', kind: 'movement', facing: 'SE', keys, geometryRecord: { ...geometry, bodyHeightPx: 85, authority }, output, preview: false };
  const result = await makeBank(options);
  expect(result.gates).toBe('pass');
  const bank = JSON.parse(await readFile(result.candidate, 'utf8'));
  const rest = await readFrame(join(keys, '000.png'));
  const first = await readFrame(join(output, bank.frames[0].url));
  const last = await readFrame(join(output, bank.frames.at(-1).url));
  const placed = measureFrame(await readFrame(join(output, bank.frames[1].url)));
  expect(bank.frameMs).toBe(120);
  expect(bank.durationMs).toBe(240);
  expect(bank.frames.every((frame: any) => frame.method === 'authored')).toBe(true);
  expect(bank.provenance.keys[1].transform.matchScore).toBe(1);
  await expect(makeBank({ ...options, timing: { durationMs: 60, frameMs: 15 }, output: join(dir, 'interpolated') })).rejects.toThrow('authored keys only');
  const offset = [bank.pivot[0] - 48, bank.pivot[1] - 80];
  expect(bank.bodyHeightPx).toBe(70);
  expect(bank.canvasSize[0]).toBeGreaterThan(96);
  expect(offset.every((n: number) => n % 2 === 0)).toBe(true);
  expect(placed.borderOpaque).toBe(0);
  expect(placed.contentWidth).toBeLessThan(65);
  expect(placed.contentHeight).toBe(60);
  expect(bank.direction).toBe('SE');
  expect(matchesRest(first, rest, offset)).toBe(true);
  expect(matchesRest(last, rest, offset)).toBe(true);
  first.data[((offset[1] + 20) * first.width + offset[0] + 30) * 4] ^= 1;
  expect(matchesRest(first, rest, offset)).toBe(false);
  await expect(makeBank({ ...options, facing: 'N', output: join(dir, 'wrong-facing') })).rejects.toThrow('not a shipped N endpoint');
  await writeFile(join(keys, '001.png'), await readFile(join(keys, '000.png')));
  runtime.banks[0].pivot = [30, 40];
  await writeFile(manifest, JSON.stringify(runtime));
  const changedAuthority = { ...authority, sha256: digest(await readFile(manifest)) };
  const identical = await makeBank({ ...options, geometryRecord: { ...geometry, pivot: [60, 80], bodyHeightPx: 70, authority: changedAuthority }, output: join(dir, 'identical') });
  const identicalBank = JSON.parse(await readFile(identical.candidate, 'utf8'));
  const middle = await readFrame(join(dir, 'identical', identicalBank.frames[1].url));
  const firstIdentical = await readFrame(join(dir, 'identical', identicalBank.frames[0].url));
  expect(middle.data.equals(firstIdentical.data)).toBe(true);
  expect(measureFrame(middle).footCenterX).toBe(measureFrame(firstIdentical).footCenterX);

  const gateFrame = { file: 'key', method: 'authored', sources: [hashes[0]], restMatch: false, metadata: { channels: 4 }, measure: { borderOpaque: 0, alphaMin: 0, alphaMax: 255, bottom: 100, footCenterX: 110 }, fringe: { ratio: 0 }, ghost: 0, sha256: hashes[0], timeMs: 0 };
  const gateReport = runGates({ bank: { pivot: [50, 100] }, frames: [gateFrame, { ...gateFrame, timeMs: 15 }], geometry, movement: { pivot: [50, 100], baseline: 100, footCenterX: 100, rest: { sha256: hashes[0] }, endpoint: {} }, plan: { frameCount: 2, durationMs: 15, frameMs: 15 } });
  expect(gateReport.checks.find((check: any) => check.name === 'geometry').ok).toBe(false);
  await expect(promote(identical.candidate, { manifest, catalog: join(dir, 'unused'), dryRun: true })).resolves.toMatchObject({ dryRun: true });
  const gatesPath = join(dir, 'identical', 'gates.json');
  const gates = JSON.parse(await readFile(gatesPath, 'utf8'));
  for (const checks of [gates.checks.filter((c: any) => c.name !== 'steadiness'), gates.checks.map((c: any) => c.name === 'steadiness' ? { ...c, ok: false } : c), gates.checks.map((c: any) => c.name === 'steadiness' ? { ...c, metrics: { maxHeadJumpPx: 0, headScaleSpread: 0 } } : c)]) {
    await writeFile(gatesPath, JSON.stringify({ ...gates, checks }));
    await expect(promote(identical.candidate, { manifest, catalog: join(dir, 'unused'), dryRun: true })).rejects.toThrow('Gate steadiness did not pass');
  }
  await writeFile(gatesPath, JSON.stringify(gates));
  identicalBank.pivot[0] += 2;
  await writeFile(identical.candidate, JSON.stringify(identicalBank));
  await expect(promote(identical.candidate, { manifest, catalog: join(dir, 'unused'), dryRun: true })).rejects.toThrow('facing-rest transform changed');
  await writeFile(manifest, JSON.stringify({ ...runtime, extra: true }));
  await expect(promote(identical.candidate, { manifest, catalog: join(dir, 'unused'), dryRun: true })).rejects.toThrow('runtime manifest changed');


});

it('fits shifted walking poses and removes a detached speck', async () => {
  dir = await mkdtemp(join(tmpdir(), 'walk-fit-'));
  const width = 128, height = 128;
  const make = async (path: string, shift: number, foot: number, speck = false) => {
    const data = Buffer.alloc(width * height * 4);
    for (let y = 24; y < 104; y++) for (let x = 48 + shift; x < 80 + shift; x++) {
      const p = (y * width + x) * 4;
      data.set([((x - shift) * 17 + y * 3) % 220 + 20, ((x - shift) * 5 + y * 11) % 220 + 20, ((x - shift) * 7 + y * 13) % 220 + 20, 255], p);
    }
    for (let y = 92; y < 104; y++) for (let x = 48 + shift + foot; x < 56 + shift + foot; x++) data.set([90, 80, 70, 255], (y * width + x) * 4);
    if (speck) {
      data.set([100, 100, 100, 255], (40 * width + 8) * 4);
      data.set([100, 100, 100, 4], (50 * width + 8) * 4);
    }
    await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(path);
  };
  const paths = [0, 1, 2, 3].map(i => join(dir, `${i}.png`));
  await make(paths[0], 0, 0); await make(paths[1], 0, -10); await make(paths[2], 10, 12, true); await make(paths[3], 0, 0);
  const beforeRest = await readFile(paths[0]);
  const fit = spawnSync(process.env.KINGDOWN_ANIM_PYTHON ?? 'python3', ['tools/anim/steady.py', JSON.stringify({ paths, baseline: 103, restIndexes: [0, 3] })], { encoding: 'utf8' });
  expect(fit.status, fit.stderr).toBe(0);
  const { transforms, restHeadX } = JSON.parse(fit.stdout);
  expect(transforms).toHaveLength(2);
  expect(Math.abs(transforms[0].measuredHeadX - restHeadX)).toBeLessThan(5);
  expect(transforms[1].matchScore).toBeGreaterThan(0.5);
  expect(Math.abs(transforms[1].measuredHeadX - transforms[0].measuredHeadX)).toBeLessThan(5);
  expect(measureFrame(await readFrame(paths[2])).bottom).toBe(103);
  expect((await readFrame(paths[2])).data[(40 * width + 8) * 4 + 3]).toBe(0);
  expect(await readFile(paths[0])).toEqual(beforeRest);
});

it('matches the standing head even when a prop shifts its alpha band', () => {
  const script = `import json, tempfile, os, numpy as np
from tools.anim.steady import save, load, fit
rng = np.random.default_rng(5)
a = np.zeros((128, 128, 4), dtype=np.float32)
a[24:104, 48:80, :3] = rng.uniform(.2, 1, (80, 32, 3))
a[24:104, 48:80, 3] = 1
rest = a.copy(); rest[30:42, 8:48, :] = [1, .1, .1, 1]
with tempfile.TemporaryDirectory() as d:
    paths = [os.path.join(d, str(i) + '.png') for i in range(3)]
    for path, image in zip(paths, [rest, a, rest]): save(path, image)
    result = fit(paths, 103, [0, 2])
    print(json.dumps(result['transforms'][0]['dx']))`;
  const result = spawnSync(process.env.KINGDOWN_ANIM_PYTHON ?? 'python3', ['-c', script], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(Math.abs(JSON.parse(result.stdout))).toBeLessThan(4);
});

it('clears colour where saved alpha is zero', () => {
  const script = `import json, tempfile, os, cv2, numpy as np
from tools.anim.steady import save
image = np.ones((2, 2, 4), dtype=np.float32)
image[0, 0, 3] = 0.001
with tempfile.TemporaryDirectory() as d:
    path = os.path.join(d, 'a.png'); save(path, image)
    print(json.dumps(cv2.imread(path, cv2.IMREAD_UNCHANGED)[0, 0].tolist()))`;
  const result = spawnSync(process.env.KINGDOWN_ANIM_PYTHON ?? 'python3', ['-c', script], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual([0, 0, 0, 0]);
});

it('removes alpha islands by size', () => {
  const script = `import json, numpy as np
from tools.anim.steady import despeckle
image = np.zeros((40, 40, 4), dtype=np.float32)
image[10:30, 10:30, 3] = 1
image[3, 3, 3] = 4 / 255
clean, count = despeckle(image)
print(json.dumps([count, float(clean[3, 3, 3]), float(clean[15, 15, 3])]))`;
  const result = spawnSync(process.env.KINGDOWN_ANIM_PYTHON ?? 'python3', ['-c', script], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual([1, 0, 1]);
});

it('gates walking head jumps and scale spread without pinning walking feet', () => {
  const frame = (x: number, scale: number, source: string, timeMs: number) => ({ file: `frame-${timeMs}`, method: 'authored', sources: [source], restMatch: source === 'rest', metadata: { channels: 4 }, measure: { borderOpaque: 0, alphaMin: 0, alphaMax: 255, bottom: 100, footCenterX: 300 }, fringe: { ratio: 0 }, ghost: 0, sha256: 'a'.repeat(64), timeMs, transform: { measuredHeadX: x, measuredHeadScale: scale } });
  const rest = frame(100, 1, 'rest', 0), first = frame(100, 1, 'walk', 120), next = frame(110, 1.03, 'walk', 240), end = frame(100, 1, 'rest', 360);
  const check = (frames: any[]) => runGates({ bank: { pivot: [50, 100] }, frames, geometry: { pivot: [50, 100] }, movement: { pivot: [50, 100], baseline: 100, rest: { sha256: 'rest' }, endpoint: {} }, plan: { frameCount: 4, durationMs: 360, frameMs: 120 } });
  expect(check([rest, first, next, end]).checks.find(c => c.name === 'geometry')?.ok).toBe(true);
  expect(check([rest, first, next, end]).checks.find(c => c.name === 'steadiness')?.ok).toBe(true);
  expect(check([rest, { ...first, sources: ['rest'], restMatch: true }, next, end]).checks.find(c => c.name === 'steadiness')?.ok).toBe(true);
  expect(check([rest, first, { ...next, transform: { measuredHeadX: 121, measuredHeadScale: 1 } }, end]).checks.find(c => c.name === 'steadiness')?.ok).toBe(false);
  expect(check([rest, first, { ...next, transform: { measuredHeadX: 100, measuredHeadScale: 1.2 } }, end]).checks.find(c => c.name === 'steadiness')?.ok).toBe(false);
  const steady = (frames: any[]) => check(frames).checks.find(c => c.name === 'steadiness')!;
  expect(steady([{ ...rest, transform: { measuredHeadX: 79 } }, first, next, end]).ok).toBe(false);
  expect(steady([rest, first, next, { ...end, transform: { measuredHeadX: 131 } }]).ok).toBe(false);
  const mid = frame(110, 1, 'walk', 240), far = frame(121, 1, 'walk', 360);
  expect(steady([rest, first, mid, far, { ...end, transform: { measuredHeadX: 121 } }]).ok).toBe(false);
  expect(steady([rest, { ...first, transform: {} }, next, end]).ok).toBe(false);
  expect(steady([rest, first, { ...next, transform: { measuredHeadX: 110, measuredHeadScale: 0 } }, end]).ok).toBe(false);
  expect(steady([{ ...rest, transform: {} }, first, next, end]).ok).toBe(false);
});

it('promotes a green candidate into the frozen catalog under its lock', async () => {
  const { keys, geometryPath, geometry } = await fixture();
  const stub = join(dir, 'stub.mjs');
  await writeFile(stub, `import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const base = dirname(process.argv[2]);
for (const frame of plan.frames) { const out = resolve(base, frame.output); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, readFileSync(resolve(base, frame.left))); }
writeFileSync(resolve(base, 'report.json'), JSON.stringify({ frames: plan.frames.length }));
`);
  const candidate = (await makeBank({ character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, geometry: geometryPath, output: join(dir, 'out'), infer: `node ${stub}`, timing: { durationMs: 60, frameMs: 15 }, preview: false })).candidate;

  const catalog = join(dir, 'catalog');
  await mkdir(join(catalog, 'banks'), { recursive: true });
  const idle = { id: 'white-idle', army: 'white', kind: 'idle', canvasSize: [96, 96], pivot: [48, 80], bodyHeightPx: 60, status: 'ready', durationMs: 15, frames: [{ url: '../assets/x.png', sha256: 'd'.repeat(64), timeMs: 0 }] };
  const idleBytes = Buffer.from(`${JSON.stringify(idle)}\n`);
  await writeFile(join(catalog, 'banks', 'idle.json'), idleBytes);
  await writeFile(join(catalog, 'manifest.json'), JSON.stringify({ schemaVersion: 1, purpose: 'fixture', reports: [], entries: [{ character: 'pawn', army: 'white', kind: 'idle', id: 'white-idle', status: 'ready', manifest: 'banks/idle.json', sha256: digest(idleBytes) }] }));

  const gatesPath = join(dirname(candidate), 'gates.json');
  const gates = JSON.parse(await readFile(gatesPath, 'utf8'));
  await writeFile(gatesPath, JSON.stringify({ ...gates, checks: gates.checks.filter((check: any) => check.name !== 'ghost') }));
  await expect(promote(candidate, { catalog })).rejects.toThrow('Gate ghost did not pass');
  await writeFile(gatesPath, JSON.stringify(gates));

  const promoted = await promote(candidate, { catalog });
  expect(promoted.entry).toMatchObject({ id: 'white-turn-SE-S', status: 'ready', manifest: expect.stringMatching(/^banks\/[a-f0-9]{64}\.json$/) });
  const manifest = JSON.parse(await readFile(join(catalog, 'manifest.json'), 'utf8'));
  expect(manifest.entries).toHaveLength(2);
  const published = JSON.parse(await readFile(join(catalog, promoted.entry.manifest), 'utf8'));
  expect(published.status).toBe('ready');
  expect(published.frames[0].url).toBe(`../assets/${published.frames[0].sha256}.png`);
  expect(existsSync(join(catalog, 'assets', `${published.frames[0].sha256}.png`))).toBe(true);
  const again = await promote(candidate, { catalog });
  expect(again.bankSha256).toBe(promoted.bankSha256);
  expect(JSON.parse(await readFile(join(catalog, 'manifest.json'), 'utf8')).entries).toHaveLength(2);

  const failing = await makeBank({ character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, geometryRecord: { ...geometry, bodyHeightPx: 80 }, output: join(dir, 'bad'), infer: `node ${stub}`, timing: { durationMs: 60, frameMs: 15 }, preview: false }).catch(error => error);
  await expect(promote(join(dir, 'bad'), { catalog })).rejects.toThrow('Gates did not pass');
  expect(failing.gates.status).toBe('fail');
});

it('runs a queued job through dispatch with the real bank command', async () => {
  const { keys, geometryPath } = await fixture();
  const stub = join(dir, 'stub.mjs');
  await writeFile(stub, `import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const base = dirname(process.argv[2]);
for (const frame of plan.frames) { const out = resolve(base, frame.output); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, readFileSync(resolve(base, frame.left))); }
writeFileSync(resolve(base, 'report.json'), JSON.stringify({ frames: plan.frames.length }));
`);
  const queue = join(dir, 'queue.json'), output = join(dir, 'dispatch-out'), timing = join(dir, 'timing.json');
  await writeFile(timing, JSON.stringify({ durationMs: 60, frameMs: 15 }));
  const job = { character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, output, timing };
  await writeFile(join(dir, 'job.json'), JSON.stringify(job));
  const env = { ...process.env, KINGDOWN_BANK_GEOMETRY: geometryPath, KINGDOWN_BANK_INFER: `node ${stub}`, KINGDOWN_BANK_PREVIEW: 'off', KINGDOWN_ANIM_MIN_FREE_GIB: '0' };
  const added = spawnSync(process.execPath, ['tools/anim/queue.mjs', 'add', '--queue', queue, '--job', join(dir, 'job.json')], { env, encoding: 'utf8' });
  expect(added.status).toBe(0);
  const run = spawnSync(process.execPath, ['tools/anim/dispatch.mjs', '--queue', queue, '--slots', '1'], { env, encoding: 'utf8' });
  expect(run.status, run.stderr).toBe(0);
  const jobs = JSON.parse(await readFile(queue, 'utf8'));
  expect(jobs[0].status).toBe('candidate');
  expect(existsSync(join(dirname(jobs[0].candidate), 'gates.json'))).toBe(true);
  expect(JSON.parse(await readFile(join(dirname(jobs[0].candidate), 'gates.json'), 'utf8')).status).toBe('pass');
});
