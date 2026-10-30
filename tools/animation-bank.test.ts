import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';
import { measureFrame, readFrame, registerFrame } from './anim/frames.mjs';
import { geometryFromManifest, edgeFor } from './anim/geometry.mjs';
import { midpointPlan, planTiming } from './anim/plan.mjs';
import { makeBank } from './anim/bank.mjs';
import { promote } from './anim/promote.mjs';

let dir = '';
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

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
  expect(gates.checks.map((check: any) => check.name)).toEqual(['rgba', 'exterior', 'matte-halo', 'geometry', 'endpoints', 'timing', 'provenance']);
  const provenance = JSON.parse(await readFile(join(output, 'provenance.json'), 'utf8'));
  expect(provenance.frames[1].sources).toEqual([bank.frames[0].sha256, bank.frames[2].sha256]);

  const broken = await makeBank({ character: 'pawn', army: 'white', kind: 'turn', facing: 'SE-S', keys, geometryRecord: { ...geometry, endpoints: {} }, output: join(dir, 'broken'), infer: `node ${stub}`, timing: { durationMs: 60, frameMs: 15 }, preview: false }).catch(error => error);
  expect(broken.message).toContain('Gates failed');
  expect(broken.gates.failing.join(' ')).toContain('endpoints');
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
