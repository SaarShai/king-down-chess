import { afterAll, beforeAll, expect, it } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';
import { pluginSymbols } from './lib/plugin-symbols.mjs';
let server: Awaited<ReturnType<typeof createServer>>, browser: Browser;
beforeAll(async () => {
  server = await createServer({ configFile: false, envFile: false, logLevel: 'error', plugins: [pluginSymbols()], server: { host: '127.0.0.1', port: 0, strictPort: true } });
  await server.listen(); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await server?.close(); });
async function open(title = false) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(5000);
  await page.goto(server.resolvedUrls!.local[0] + (title ? '' : '?title=0&players=human,ai&army=RNBQKBNR'));
  await page.waitForFunction(() => (window as any).view?.ready);
  await page.evaluate(() => (window as any).view.ready());
  return page;
}
async function menu(page: Page) { await page.locator('#menu-btn').click(); }
it('centres the same twelve figures on a phone title screen', async () => {
  const page = await open(true);
  try {
    await page.locator('#title-screen[open]').waitFor();
    expect(await page.locator('.title-lineup li').count()).toBe(12);
    const space = await page.evaluate(() => ({ top: document.querySelector('.title-stage')!.getBoundingClientRect().top, bottom: innerHeight - document.querySelector('.title-copy')!.getBoundingClientRect().bottom }));
    expect(Math.abs(space.top - space.bottom)).toBeLessThan(2);
  } finally { await page.close(); }
});

it('makes Keep playing the main web resign action', async () => {
  const page = await open();
  try {
    await menu(page); await page.locator('#resign').click();
    expect(await page.locator('[data-menu-page="resign"] .primary').innerText()).toBe('Keep playing');
  } finally { await page.close(); }
});
