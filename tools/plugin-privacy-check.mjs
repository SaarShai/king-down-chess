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
  // Keep the iframe in place after the real SDK teardown, as a host can do during an account switch.
  await page.evaluate(() => window.harnessTeardown());
  await shot(page, 'after-host-teardown');
  assert.equal(await frame.locator('#app-frame').isVisible(), false, 'Host teardown must remove the old private game from view');
  assertNoErrors();
  console.log('PASS panel privacy: second HTTP actor refused private game; SDK teardown removes private content');
} finally { await browser.close(); }
