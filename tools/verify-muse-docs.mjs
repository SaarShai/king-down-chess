import assert from 'node:assert/strict';
import { assertNoErrors, env, launch, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';

const browser = await launch();
try {
  const page = await browser.newPage();
  const errors = trapErrors(page);
  for (const [name, width] of [['desktop', 1440], ['mobile', 390]]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(new URL('/muse-connector.html', env('PLAYABLE_URL')).href);
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), 'Muse tool documentation · King Down');
    assert.equal(await page.locator('h3').count(), 6);
    assert.equal(await page.locator('script, iframe, img').count(), 0);
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null);
    await noSidewaysScroll(page);
    const summary = await page.locator('table').first().innerText();
    assert.match(summary, /kingdown_new_game\s+New game\s+Write/);
    assert.match(summary, /60 calls in 60 seconds/);
    assert.match(summary, /120 calls in 60 seconds/);
    assert.equal(await page.locator('table').first().locator('tbody td:first-child code').evaluateAll(names => names.every(el => el.getClientRects().length === 1)), true, 'Tool names stay on one line');
    await page.locator('.table-scroll').first().focus();
    assert.equal(await page.locator('.table-scroll').first().evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, `${name}-top`);
    await shot(page, name, { fullPage: true });
    await page.getByRole('heading', { name: 'Disconnect and delete data' }).scrollIntoViewIfNeeded();
    assert.equal(await page.getByRole('link', { name: 'hello@kingdown.dev', exact: true }).count(), 1);
    await shot(page, `${name}-deletion`);
  }
  assertNoErrors(errors);
  console.log('Muse docs: six tools, limits, desktop and mobile layout, no scripts and no worker control pass.');
} finally { await browser.close(); }
