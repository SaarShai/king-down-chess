/** Real compiled panel and HTTP service, with disposable loopback identities. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';

const origin = env('PLAYABLE_URL'), browser = await launch();
try {
  const page = await browser.newPage(); trapErrors(page);
  const frame = page.frameLocator('iframe');
  await page.goto(origin);
  await frame.locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen' }));
  const created = await page.evaluate(command_id => window.harnessTool({ name: 'kingdown_create', arguments: {
    command_id, kind: 'solo', colour: 'white', level: 'beginner',
    options: { fairy: false, pool: [], classic: true, arrangement: false, cards: false, cardPool: [], kingPowers: false },
  } }), randomUUID());
  assert(!created.isError);
  const game = created._meta.view.game_id;
  await page.evaluate(result => window.harnessShow(result), created);
  await frame.locator('#board-menu:not(:disabled)').waitFor();
  const refused = await (await page.request.post(new URL('/fixture-friend-tool', origin).href, {
    data: { name: 'kingdown_open', arguments: { game_id: game } },
  })).json();
  assert(refused.isError, 'The second HTTP actor cannot open the first private game');
  assert.equal(refused._meta?.view, undefined);
  assert.equal(refused._meta?.code, 'FORBIDDEN');
  // Hold a successful private read until after the host closes the panel.
  await page.evaluate(() => { window.holdNext = 'kingdown_get'; });
  const late = page.evaluate(() => window.harnessShow({ content: [], structuredContent: { screen: 'board', game_id: window.harnessMatchId } }));
  await page.waitForFunction(() => typeof window.releaseHeld === 'function');
  // Keep the iframe in place after the real SDK teardown, as a host can do during an account switch.
  await page.evaluate(() => window.harnessTeardown());
  assert.equal(await frame.locator('#app-frame').isVisible(), false, 'Host teardown must remove the old private game from view');
  const closed = 'This game panel is closed. Open King Down again to continue.';
  assert.equal(await frame.locator('body').innerText(), closed);
  assert.equal(await frame.locator('canvas, [data-screen], input, dialog').count(), 0, 'No private board, page, draft input or sheet remains in the document');
  await page.evaluate(() => window.releaseHeld()); await late;
  await page.waitForFunction(() => window.harnessInflight === 0);
  await page.evaluate(result => window.harnessShow(result), created);
  await page.evaluate(() => window.harnessSetContext({ displayMode: 'inline' }));
  await page.evaluate(() => window.harnessTeardown());
  assert.equal(await frame.locator('body').innerText(), closed, 'A late private reply cannot restore the old panel');
  await shot(page, 'after-host-teardown');
  assertNoErrors();
  console.log('PASS panel privacy: second HTTP actor refused private game; SDK teardown removes private content');
} finally { await browser.close(); }
