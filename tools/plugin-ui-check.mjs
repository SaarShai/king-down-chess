import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:5296');
  const frame = page.frameLocator('iframe');
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  async function clickSquare(file, rank) {
    const box = await frame.locator('canvas').boundingBox(); assert(box);
    await page.mouse.click(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await clickSquare(4, 1);
  assert(await frame.locator('#choices button').count() > 0);
  await clickSquare(4, 3);
  assert(await frame.locator('#choices button').count() > 1, 'Haste and ordinary moves must stay distinct');
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await frame.locator('#choices button[title="e2-e4"]').click();
  await frame.locator('#retry').waitFor();
  await frame.locator('#reload').click();
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert(await frame.locator('#retry').isVisible(), 'Reload must preserve the pending command');
  await frame.locator('#retry').click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  const commands = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_move'));
  assert.equal(commands.length, 2); assert.deepEqual(commands[0].arguments, commands[1].arguments);
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  await frame.locator('#computer').click();
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  const id = await page.evaluate(() => window.harnessMatchId);
  await page.locator('#remount').click();
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessMatchId), id);
  await frame.locator('#expand').click();
  await frame.locator('#expand').filter({ hasText: 'Inline' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  assert.equal(await frame.locator('body').evaluate(el => el.scrollWidth > window.innerWidth), false);
  const canvas = await frame.locator('canvas').boundingBox(); assert(canvas && canvas.width > 250 && canvas.width <= 390);
  await page.screenshot({ path: '/tmp/kingdown-plugin-ui-mobile.png' });
  await page.goto('http://127.0.0.1:5296/?terminal=1');
  await frame.locator('#status').filter({ hasText: 'Checkmate' }).waitFor();
  assert.equal(await frame.locator('#computer').isVisible(), false);
  assert.equal(await frame.locator('#choices button').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: SDK AppBridge initialization, painted board move, iframe remount/resume, Haste ambiguity, lost-reply same-ID retry, bounded computer move, terminal board, display mode, 390px layout, no page errors');
} finally { await browser.close(); }
