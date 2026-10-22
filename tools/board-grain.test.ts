import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { expect, it } from 'vitest';
import sharp from 'sharp';

const master = 'docs/2d-first-pieces/board-art/stone-board.png';
const copies = [
  [master, 1024, 1_478_995],
  ['docs/2d-first-pieces/board-art/stone-board.webp', 1024, 112_300],
  ['public/ui/stone-board.webp', 640, 29_566],
] as const;
// The source export needs numpy and Pillow, as does the stone-control export.
const canExport = (() => { try { execFileSync('python3', ['-c', 'import numpy, PIL'], { stdio: 'pipe', timeout: 4000 }); return true; } catch { console.info('Skip source export: Python numpy and Pillow are not available. Shipped asset checks still run.'); return false; } })();
const python = (code: string) => JSON.parse(execFileSync('python3', ['-c', `
import runpy, json, numpy as np
from PIL import Image
art = runpy.run_path('docs/2d-first-pieces/board-art/compose-board.py')
${code}
`], { encoding: 'utf8' }));

it.skipIf(!canExport)('cuts full-size RGB grain contrast by exactly 25% and keeps each channel mean', () => {
  const result = python(`
# Whole-number means keep summation round-off out of the exact gain check.
pixels = (np.indices((330, 330))[1][..., None] % 10
          * np.array([12, 16, 20]) + np.array([35, 40, 45]))
filtered = art['grain_pixels'](pixels)
flat = np.full((330, 330, 3), [219, 203, 171])
print(json.dumps({
  'gain': (filtered.std(axis=(0, 1)) / pixels.std(axis=(0, 1))).tolist(),
  'meanChange': (filtered.mean(axis=(0, 1)) - pixels.mean(axis=(0, 1))).tolist(),
  'flatChange': float(np.max(np.abs(art['grain_pixels'](flat) - flat)))
}))`);
  for (const gain of result.gain) expect(gain).toBeCloseTo(0.75, 10);
  for (const change of result.meanChange) expect(Math.abs(change)).toBeLessThan(1e-10);
  expect(result.flatChange).toBe(0);
});

it.skipIf(!canExport)('keeps all 64 tile colours, grid, and full-resolution export', () => {
  const result = python(`
before = np.asarray(art['compose_board'](1), dtype=float)
after = np.asarray(Image.open('${master}').convert('RGB'), dtype=float)
fresh = np.asarray(art['compose_board'](), dtype=float)
gains, changes = [], []
for row in range(8):
    for col in range(8):
        # Exclude the grout, outline and 7 px bevel from the grain measurement.
        region = np.s_[row*128+12:row*128+116, col*128+12:col*128+116]
        a, b = before[region], after[region]
        gains.extend((b.std(axis=(0, 1)) / a.std(axis=(0, 1))).tolist())
        changes.extend(np.abs(b.mean(axis=(0, 1)) - a.mean(axis=(0, 1))).tolist())
grid = np.indices((1024, 1024))
grout = (grid[0] % 128 < 2) | (grid[0] % 128 >= 126) | (grid[1] % 128 < 2) | (grid[1] % 128 >= 126)
print(json.dumps({
  'gain': [min(gains), max(gains)], 'maxMeanChange': max(changes),
  'groutChange': float(np.max(np.abs(after[grout] - before[grout]))),
  'freshError': float(np.abs(after - fresh).mean())
}))`);
  // One final 8-bit rounding changes the measured ratio by at most 0.6 percentage points.
  expect(result.gain[0]).toBeGreaterThan(0.744);
  expect(result.gain[1]).toBeLessThan(0.756);
  expect(result.maxMeanChange).toBeLessThan(1);
  expect(result.groutChange).toBe(0);
  expect(result.freshError).toBeLessThan(0.1);
});

it.each(copies)('keeps dimensions, file budget, decoded tile colours, and grain contrast in %s', async (path, width, budget) => {
  const original = await sharp(master).raw().toBuffer();
  const metadata = await sharp(path).metadata();
  expect([metadata.width, metadata.height]).toEqual([width, width]);
  expect(statSync(path).size).toBeLessThanOrEqual(budget);
  const data = await sharp(path).resize(1024, 1024).raw().toBuffer();
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    for (let channel = 0; channel < 3; channel++) {
      let sourceSum = 0, decodedSum = 0, sourceSquares = 0, decodedSquares = 0;
      for (let y = row * 128 + 12; y < row * 128 + 116; y++) {
        for (let x = col * 128 + 12; x < col * 128 + 116; x++) {
          const at = (y * 1024 + x) * 3 + channel;
          sourceSum += original[at];
          decodedSum += data[at];
          sourceSquares += original[at] ** 2;
          decodedSquares += data[at] ** 2;
        }
      }
      const count = 104 * 104;
      expect(Math.abs((decodedSum - sourceSum) / count), `${path} tile ${row},${col} channel ${channel}`).toBeLessThan(1);
      const sourceVariance = sourceSquares / count - (sourceSum / count) ** 2;
      const decodedVariance = decodedSquares / count - (decodedSum / count) ** 2;
      const gain = Math.sqrt(decodedVariance / sourceVariance);
      // WebP compression and the 640 px resize can remove contrast. Allow at most 10% gain.
      expect(gain, `${path} tile ${row},${col} channel ${channel} grain`).toBeGreaterThan(0.6);
      expect(gain, `${path} tile ${row},${col} channel ${channel} grain`).toBeLessThan(1.1);
    }
  }
});
