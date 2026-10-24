// Unit test of watchMotionEnd: the page reads, at a frame 1.5 s after a pulse starts, whether the pulse still runs.
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
  expect(await pulse('600ms', add)).toEqual({ seen: 1, found: 1, running: 0 });
}, 30000);

it('reads a stopped pulse (playbackRate 0) as running 1.5 s on', async () => {
  expect(await pulse('600ms', frame => frame.evaluate(() => {
    const box = document.querySelector('#box')!; box.classList.add('pulse');
    for (const animation of box.getAnimations({ subtree: true })) animation.playbackRate = 0;
  }))).toEqual({ seen: 1, found: 1, running: 1 });
}, 30000);

it('reads a 2 s pulse as running 1.5 s on', async () => {
  expect(await pulse('2000ms', add)).toEqual({ seen: 1, found: 1, running: 1 });
}, 30000);

it('reads a stopped pulse as running when its element leaves the scope', async () => {
  expect(await pulse('600ms', frame => frame.evaluate(() => {
    const box = document.querySelector('#box')!; box.classList.add('pulse');
    for (const animation of box.getAnimations({ subtree: true })) animation.playbackRate = 0;
    setTimeout(() => { box.id = 'gone'; }, 100);
  }))).toEqual({ seen: 1, found: 0, running: 1 });
}, 30000);

it('reads a pulse as ended when the next render replaces its element', async () => {
  expect(await pulse('600ms', frame => frame.evaluate(() => {
    const box = document.querySelector('#box')!; box.classList.add('pulse');
    setTimeout(() => box.replaceWith(Object.assign(document.createElement('div'), { id: 'box' })), 100);
  }))).toEqual({ seen: 1, found: 1, running: 0 });
}, 30000);

// A stall of 2 s moves the frames, not the pulse's own progress, so the read comes at a frame that shows the pulse
// ended. The stall comes 100 ms after the class (after the start), right after it in the same task (before the first
// frame), or before it after a style or layout read (the timeline then holds the time of the frame before the stall).
it.each(['after the start', 'before the first frame', 'after a style read, before the class', 'after a layout read, before the class'])('reads a 600 ms pulse as ended with a page stall %s', async stall => {
  expect(await pulse('600ms', frame => frame.evaluate(stall => {
    const box = document.querySelector<HTMLElement>('#box')!, wait = () => { const from = performance.now(); while (performance.now() - from < 2000); };
    if (stall.includes('style')) { void getComputedStyle(box).opacity; wait(); }
    if (stall.includes('layout')) { void box.getBoundingClientRect(); wait(); }
    box.classList.add('pulse');
    if (stall === 'before the first frame') wait();
    if (stall === 'after the start') setTimeout(wait, 100);
  }, stall))).toEqual({ seen: 1, found: 1, running: 0 });
}, 30000);

it('gives null when no match came', async () => {
  expect(await pulse('600ms', async () => {})).toBeNull();
}, 30000);
