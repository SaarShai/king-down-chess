import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

it('exports repeat stone from the full source with two pixels per CSS pixel at 528 px', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-stone-'));
  try {
    const output = join(folder, 'stone.webp');
    execFileSync('python3', ['tools/export-stone-control.py', output]);
    const image = await readFile(output), meta = await sharp(image).metadata();
    expect(meta.width).toBeGreaterThanOrEqual(2 * 528);
    expect(Math.abs(meta.height! - meta.width! * 120 / 232)).toBeLessThan(0.5);
    expect(image).toEqual(await readFile('src/plugin/assets/stone-control.webp'));
  } finally { await rm(folder, { recursive: true, force: true }); }
});
