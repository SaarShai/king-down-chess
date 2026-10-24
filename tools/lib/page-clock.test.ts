// Unit test of pauseClock: it stops the page clock at the page's own now, in the page and in its frames.
import { expect, it } from 'vitest';
import type { Page } from 'playwright';
import { launch } from './checks.mjs';
import { pauseClock } from './page-clock.mjs';

const ticker = '<script>window.ticks = 0; setInterval(() => window.ticks++, 20);</script>';
const read = () => [(window as any).ticks, Date.now()];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function ticking(run: (page: Page) => Promise<void>) {
  const browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
  try {
    const page = await browser.newPage();
    // An hour ahead of this process's clock, as after the fastForward steps of a check.
    await page.clock.install({ time: Date.now() + 3_600_000 });
    await page.setContent(`${ticker}<iframe srcdoc="${ticker}"></iframe>`);
    await expect.poll(() => page.frames()[1].evaluate(() => (window as any).ticks)).toBeGreaterThan(2);
    await run(page);
  } finally { await browser.close(); }
}

it('stops the page and frame timers at the page now, and the clock runs on from there after resume', () => ticking(async page => {
  const frame = page.frames()[1];
  await pauseClock(page);
  const paused = await Promise.all([page, frame].map(target => target.evaluate(read)));
  await sleep(300);
  expect(await Promise.all([page, frame].map(target => target.evaluate(read)))).toEqual(paused);
  expect(paused[1][1]).toBe(paused[0][1]);
  await page.clock.resume();
  await expect.poll(() => page.evaluate(read)).toEqual([expect.toSatisfy((ticks: number) => ticks > paused[0][0]), expect.toSatisfy((now: number) => now > paused[0][1])]);
}), 30000);

it('pauses also when each clock command reaches the page 300 ms late, as on a slow runner', () => ticking(async page => {
  for (const name of ['setFixedTime', 'pauseAt', 'setSystemTime'] as const) {
    const command = page.clock[name].bind(page.clock);
    page.clock[name] = async (time: number | string | Date) => { await sleep(300); return command(time); };
  }
  await pauseClock(page);
  const paused = await page.evaluate(read);
  await sleep(300);
  expect(await page.evaluate(read)).toEqual(paused);
}), 30000);
