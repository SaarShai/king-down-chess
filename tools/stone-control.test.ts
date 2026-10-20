import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const ASSET = 'src/plugin/assets/stone-control.webp';
// The export needs numpy and Pillow, which the CI runners do not install. Normal import: 120 ms on the M1.
const canExport = (() => { try { execFileSync('python3', ['-c', 'import numpy, PIL'], { timeout: 4000 }); return true; } catch { return false; } })();

it('ships stone with two pixels per CSS pixel at the widest 528 px control', async () => {
  const meta = await sharp(ASSET).metadata();
  expect(meta.width).toBeGreaterThanOrEqual(2 * 528);
  expect(Math.abs(meta.height! - meta.width! * 120 / 232)).toBeLessThan(0.5);
});

it.skipIf(!canExport)('matches a fresh export from the full source', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-stone-'));
  try {
    const output = join(folder, 'stone.webp');
    // Normal export: at most 506 ms for this whole file on the M1.
    execFileSync('python3', ['tools/export-stone-control.py', output], { timeout: 4000 });
    const [a, b] = await Promise.all([output, ASSET].map(p => sharp(p).raw().toBuffer()));
    expect(a.length).toBe(b.length);
    // Lossy encoders of other libwebp versions differ by a few levels, never by a different picture.
    let sum = 0; for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    expect(sum / a.length).toBeLessThan(1);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
