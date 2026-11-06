#!/usr/bin/env node
// node tools/card-motion/frames.mjs <base-url> <card> [...]: renders one loop of each card from the live preview page, for an agent to look at.
// Writes in ~/kd-runs/card-motion/<card>/: strip.png (6 phases at sheet size), small.png (coin and tile at real size, x1, on six phases),
// heat.png (what moves, brightest = most), loop.gif (sheet, tile and coin), and prints the seam and motion numbers.
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const [base, ...cards] = process.argv.slice(2);
const FRAMES = 40, browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const card of cards) {
  const run = join(homedir(), 'kd-runs/card-motion', card), raw = join(run, 'raw');
  rmSync(raw, { recursive: true, force: true }); mkdirSync(raw, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 620, height: 300 }, deviceScaleFactor: 2 });
  const errors = []; page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); }); page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${base}/docs/specs/effects-animation/preview/card-motion/index.html?card=${card}&phase=0`);
  await page.waitForFunction(() => window.cardMotion);
  await page.waitForTimeout(600);
  const row = page.locator(`[data-card-row="${card}"] .row`);
  for (let i = 0; i <= FRAMES; i++) {
    await page.evaluate(p => { window.cardMotion.seek(p); return new Promise(r => requestAnimationFrame(r)); }, i / FRAMES);
    await row.screenshot({ path: join(raw, `${String(i).padStart(3, '0')}.png`) });
  }
  const f = i => join(raw, `${String(i).padStart(3, '0')}.png`);
  const compare = (a, b) => spawnSync('magick', ['compare', '-metric', 'MAE', a, b, 'null:'], { encoding: 'utf8' }).stderr.trim();
  console.log(card, 'seam (frame 0 vs frame 40):', compare(f(0), f(FRAMES)), '| neighbours 0-1:', compare(f(0), f(1)), '| across 0-20:', compare(f(0), f(20)), '| errors:', errors.length ? errors.join('; ') : 'none');
  execFileSync('magick', ['(', f(0), f(7), '+append', ')', '(', f(14), f(20), '+append', ')', '(', f(27), f(34), '+append', ')', '-append', join(run, 'strip.png')]);
  execFileSync('magick', [...Array.from({ length: FRAMES }, (_, i) => f(i)), '-evaluate-sequence', 'max', join(raw, 'max.png')]);
  execFileSync('magick', [...Array.from({ length: FRAMES }, (_, i) => f(i)), '-evaluate-sequence', 'min', join(raw, 'min.png')]);
  execFileSync('magick', [join(raw, 'max.png'), join(raw, 'min.png'), '-compose', 'difference', '-composite', '-colorspace', 'gray', '-auto-level', join(run, 'heat.png')]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '5', '-i', join(raw, '%03d.png'), '-frames:v', String(FRAMES), '-vf', 'split[a][b];[a]palettegen=max_colors=200[p];[b][p]paletteuse=dither=none', '-loop', '0', join(run, 'loop.gif')]);
  await page.close();
}
await browser.close();
