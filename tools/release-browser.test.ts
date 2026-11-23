import { chromium } from 'playwright';
import { expect, it } from 'vitest';
import { releaseDriver } from './lib/release-browser.mjs';

it.each([true, false])('opens Home only when its action is visible (action present: %s)', async showAction => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const url = 'http://release-check.test/';
    page.setDefaultTimeout(1_500);
    await page.route('**/poster.webp', () => {}); // Leave the image request pending.
    await page.route(url, route => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><img src="/poster.webp">${showAction ? '<button>Play a friend</button>' : ''}`,
    }));

    const opened = releaseDriver(page, url).openHome();
    if (showAction) await opened;
    else await expect(opened).rejects.toThrow(/locator.waitFor: Timeout 1500ms exceeded/);
    expect(await page.evaluate(() => document.readyState)).toBe('interactive');
  } finally {
    await browser.close();
  }
}, 15_000);
