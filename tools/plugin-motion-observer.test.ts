// Unit test of watchMotionEnd: the page reads, on its own timeline, whether a pulse ends within its time.
import { expect, it } from 'vitest';
import type { Frame, Page } from 'playwright';
import { launch } from './lib/checks.mjs';
import { watchMotionEnd } from './plugin-motion-observer';

// A pseudo-element pulse, as the check pulse of the board strips (src/plugin/screens/board.css).
const widget = '<style>.pulse::after { content: ""; display: block; animation: pulse var(--length) both; } @keyframes pulse { from { opacity: 0; } }</style><div id="box"></div>';

async function pulse(length: string, start: (frame: Frame) => Promise<void>) {
  const browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
  try {
    const page: Page = await browser.newPage();
    await page.setContent(`<iframe srcdoc='${widget}'></iframe>`);
    const frame = page.frames()[1];
    await frame.waitForSelector('#box', { state: 'attached' });
    await frame.evaluate(length => document.documentElement.style.setProperty('--length', length), length);
    const end = await watchMotionEnd(page, '#box.pulse', '#box', 1500);
    await start(frame);
    return await end();
  } finally { await browser.close(); }
}
const add = (frame: Frame) => frame.evaluate(() => document.querySelector('#box')!.classList.add('pulse'));

it('reads a 600 ms pulse as ended 1.5 s on', async () => {
  expect(await pulse('600ms', add)).toEqual({ seen: 1, running: 0 });
}, 30000);

it('reads a stalled pulse (playbackRate 0) as running 1.5 s on', async () => {
  expect(await pulse('600ms', frame => frame.evaluate(() => {
    const box = document.querySelector('#box')!; box.classList.add('pulse');
    for (const animation of box.getAnimations({ subtree: true })) animation.playbackRate = 0;
  }))).toEqual({ seen: 1, running: 1 });
}, 30000);

it('reads a 2 s pulse as running 1.5 s on', async () => {
  expect(await pulse('2000ms', add)).toEqual({ seen: 1, running: 1 });
}, 30000);

it('reads a 600 ms pulse as ended when the page stalls 2 s after its start', async () => {
  expect(await pulse('600ms', frame => frame.evaluate(() => {
    document.querySelector('#box')!.classList.add('pulse');
    setTimeout(() => { const from = performance.now(); while (performance.now() - from < 2000); }, 100);
  }))).toEqual({ seen: 1, running: 0 });
}, 30000);
