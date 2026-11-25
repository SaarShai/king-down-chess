import { chromium } from 'playwright';
import { expect, it } from 'vitest';
import { releaseDriver, releaseRequestFailures } from './lib/release-browser.mjs';

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

it('reports a film network failure when Home opens', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const url = 'http://release-check.test/';
    const film = '/interface/reveal/wide.mp4';
    const bad = releaseRequestFailures(page);
    await page.route(`**${film}`, route => route.abort('connectionreset'));
    await page.route(url, route => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><video src="${film}"></video><button>Play a friend</button>`,
    }));

    await Promise.all([
      page.waitForEvent('requestfailed', request => request.url() === new URL(film, url).href),
      releaseDriver(page, url).openHome(),
    ]);
    expect(bad).toEqual([`net::ERR_CONNECTION_RESET ${film}`]);
  } finally {
    await browser.close();
  }
}, 15_000);
