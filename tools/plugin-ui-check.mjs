import assert from 'node:assert/strict';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL');
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, hasTouch: true });
trapErrors(page);
try {
  await page.goto(base);
  const capabilities = await (await page.request.get(new URL('/harness-mode', base).href)).json();
  const mode = capabilities.mode;
  if (process.env.PLUGIN_EXPECT_MODE) assert.equal(mode, process.env.PLUGIN_EXPECT_MODE, 'Connected to the expected harness backend');
  const frame = page.frameLocator('iframe');
  await frame.locator('#status').filter({ hasText: /to move|Waiting|wins|Draw/ }).waitFor();
  await frame.locator('summary').click();
  await frame.locator('#solo').click();
  await frame.locator('#solo:not(:disabled)').waitFor();
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  async function clickSquare(file, rank) {
    const box = await frame.locator('canvas').boundingBox(); assert(box);
    await page.mouse.click(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await clickSquare(4, 1);
  assert(await frame.locator('#choices button').count() > 0);
  assert(await frame.locator('#choices button').count() > 1, 'Haste and ordinary moves must stay distinct');
  for (const code of ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'COMMAND_CONFLICT', 'MATCH_INCOMPATIBLE']) {
    await page.evaluate(code => { window.rejectNextMove = code; }, code);
    await frame.locator('#choices button[title="e2-e4"]').click();
    await frame.locator('#reload:not(:disabled)').waitFor();
    assert.equal(await frame.locator('#retry').isVisible(), false, `${code} must release the pending command`);
  }
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await frame.locator('#choices button[title="e2-e4"]').click();
  await frame.locator('#retry').waitFor();
  await page.locator('#remount').click();
  await frame.locator('#retry').waitFor();
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 1, 'Remount must restore the selected game and its pending command');
  await frame.locator('#reload').click();
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert(await frame.locator('#retry').isVisible(), 'Reload must preserve the pending command');
  await frame.locator('#retry').click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  const commands = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_move').slice(-2));
  assert.equal(commands.length, 2); assert.deepEqual(commands[0].arguments, commands[1].arguments);
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 1, 'Lost reply and retry commit exactly once');
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  for (let action = 0; action < 4 && await frame.locator('#computer').isVisible(); action++) {
    await frame.locator('#computer').click();
    await frame.locator('#reload:not(:disabled)').waitFor();
  }
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  const id = await page.evaluate(() => window.harnessMatchId);
  const snapshot = await page.evaluate(() => window.harnessView.snapshot);
  assert(snapshot.revision >= 2 && snapshot.revision <= 5);
  const readsBeforeRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeRemount);
  await frame.locator('#status').filter({ hasText: `Move ${snapshot.moveNumber}` }).waitFor();
  await frame.locator('#reload:not(:disabled)').waitFor();
  assert.equal(await page.evaluate(() => window.harnessMatchId), id);
  assert.deepEqual(await page.evaluate(() => ({ revision: window.harnessView.snapshot.revision, fen: window.harnessView.snapshot.fen })), { revision: snapshot.revision, fen: snapshot.fen });
  assert.equal(await page.evaluate(() => window.harnessCalls.at(-1).name), 'kingdown_get', 'A replayed initial result must fetch the saved game');
  await page.evaluate(() => { window.rejectNextGet = true; });
  await page.locator('#remount').click();
  await frame.locator('#error').filter({ hasText: 'Harness saved-game read failed' }).waitFor();
  assert.equal(await frame.locator('#choices button').count(), 0, 'A failed saved-game read must not expose stale moves');
  assert(!/to move/.test(await frame.locator('#status').innerText()), 'A failed read must not show the replayed position');
  await frame.locator('#reload').click();
  await frame.locator('#status').filter({ hasText: `Move ${snapshot.moveNumber}` }).waitFor();
  await frame.locator('#reload:not(:disabled)').waitFor();
  assert.equal(await frame.getByRole('button', { name: 'Fullscreen', exact: true }).count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  assert.equal(await frame.locator('body').evaluate(el => el.scrollWidth > window.innerWidth), false);
  const canvas = await frame.locator('canvas').boundingBox(); assert(canvas && canvas.width > 250 && canvas.width <= 390);
  await frame.locator('summary').click();
  await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  async function tapSquare(file, rank) {
    const box = await frame.locator('canvas').boundingBox(); assert(box);
    await page.touchscreen.tap(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await tapSquare(4, 1);
  assert.equal(await frame.locator('#move-hint').innerText(), 'Tap a marked square to move, or choose a move below.');
  await tapSquare(4, 3);
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 1, 'Touch destination commits the ordinary move once');
  await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  await tapSquare(4, 1);
  await frame.locator('#choices button').filter({ hasText: 'e2 to e4, with Haste' }).tap();
  await frame.locator('#reload:not(:disabled)').waitFor();
  assert.match(await frame.locator('#status').innerText(), /White to move/, 'Explicit Haste keeps the extra move');
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 1);
  await tapSquare(4, 3); await tapSquare(4, 3);
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 1, 'Second tap must not pass Haste');
  assert.equal(await frame.locator('#choices button').count(),0,'Second tap deselects');
  async function dragOwnSquare(file,rank,black=false) {
    const box=await frame.locator('canvas').boundingBox(); assert(box);
    const x=box.x+(32+((black?7-file:file)+.5)*112)*box.width/960;
    const y=box.y+(96+((black?rank:7-rank)+.5)*112)*box.width/960;
    await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x+10,y); await page.mouse.up();
  }
  await tapSquare(4,3); await dragOwnSquare(4,3);
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision),1,'Drag start must not pass Haste');
  await tapSquare(4, 3); await tapSquare(4, 4);
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 2, 'Touch finishes the explicit Haste action');
  await frame.locator('summary').click();
  await shot(page, 'mobile');
  for (const scenario of ['archer','freeze']) {
    const seeded=await (await page.request.post(new URL(`/fixture-position?case=${scenario}`,base).href)).json(); assert(!seeded.isError);
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
    await page.evaluate(result=>window.harnessShow(result),seeded);
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,reads);
    await frame.locator('#reload:not(:disabled)').waitFor();
    const black=scenario==='freeze';
    async function tap(file,rank) { const box=await frame.locator('canvas').boundingBox(); await page.touchscreen.tap(box.x+(32+((black?7-file:file)+.5)*112)*box.width/960,box.y+(96+((black?rank:7-rank)+.5)*112)*box.width/960); }
    const file=black?4:2, rank=black?3:2;
    await tap(file,rank); await tap(file,rank);
    assert.equal(await frame.locator('#choices button').count(),0,`${scenario}: second tap deselects without submitting`);
    assert.equal(await page.evaluate(()=>window.harnessView.snapshot.revision),0);
    await tap(file,rank);
    if (!black) { await dragOwnSquare(file,rank); assert.equal(await page.evaluate(()=>window.harnessView.snapshot.revision),0,'Drag must not shoot'); await tap(2,2); await tap(2,4); }
    else { await frame.locator('#choices button').filter({hasText:/freeze/i}).click(); }
    await page.waitForFunction(()=>window.harnessView.snapshot.revision===1);
    await frame.locator('#reload:not(:disabled)').waitFor();
    await frame.locator('#board').focus();
    for (let i=0;i<9;i++) await page.keyboard.press('ArrowRight');
    assert.match(await frame.locator('#board').getAttribute('aria-label'),black?/a[1-8]/:/h[1-8]/);
    for (let i=0;i<9;i++) await page.keyboard.press('ArrowUp');
    assert.match(await frame.locator('#board').getAttribute('aria-label'),black?/a1/:/h8/);
  }
  await frame.locator('summary').click();
  await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  const deleted=await page.evaluate(()=>window.harnessView);
  await page.request.post(new URL('/fixture-delete-match',base).href,{data:{matchId:deleted.matchId}});
  await frame.locator('#reload').click(); await frame.locator('#error').filter({hasText:'deleted'}).waitFor();
  await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  const replacement=await page.evaluate(()=>window.harnessView.matchId); assert.notEqual(replacement,deleted.matchId);
  const recoveryReads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,recoveryReads);
  await frame.locator('#status').filter({hasText:'White to move'}).waitFor();
  assert.equal(await page.evaluate(()=>window.harnessView.matchId),replacement,'Deleted-game recovery survives immediate remount');
  if (capabilities.friend) {
    await frame.locator('summary').click();
    await frame.locator('#friend').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
    await page.evaluate(() => { window.holdNextGet = true; });
    await page.waitForFunction(() => typeof window.releaseHeldGet === 'function');
    assert(await frame.locator('#solo').isEnabled(), 'Background polling must not disable game controls');
    await frame.locator('#solo').click();
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
    await frame.locator('#reload:not(:disabled)').waitFor();
    await page.evaluate(() => { window.releaseHeldGet(); });
    await page.waitForFunction(() => window.heldGetReturned);
    await frame.locator('#status').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.match(await frame.locator('#status').innerText(), /White to move/, 'An old friend read must not replace the newly selected solo game');
    await frame.locator('#friend').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
    await frame.locator('#invite').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    const token = (await frame.locator('#invitation').innerText()).replace('Share this invitation: ', '');
    const joined = await (await page.request.post(new URL('/fixture-friend-join', base).href, { data: { token } })).json();
    assert(!joined.isError);
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
    await clickSquare(4, 1); await clickSquare(4, 3);
    await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
    const friend = await page.evaluate(() => window.harnessView);
    const replied = await (await page.request.post(new URL('/fixture-friend-move', base).href, { data: { matchId: friend.matchId, id: 'friend-reply', expectedRevision: friend.snapshot.revision, lan: 'e7-e5' } })).json();
    assert(!replied.isError);
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.snapshot.revision), 2);
    await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    assert.equal(await frame.locator('#invitation').innerText(), '');
    const invitation = await (await page.request.post(new URL('/fixture-friend-invite', base).href)).json();
    assert(!invitation.isError);
    await page.evaluate(() => { window.harnessDropWidgetWrites = true; });
    await frame.locator('#token').fill(invitation.structuredContent.token); await frame.locator('#join').click();
    await frame.locator('#status').filter({ hasText: 'You play Black' }).waitFor({ timeout: 5000 });
    const joinedView = await page.evaluate(() => window.harnessView);
    const readsBeforeJoinRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);

    await page.locator('#remount').click();
    await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeJoinRemount);
    await frame.locator('#status').filter({ hasText: 'You play Black' }).waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessMatchId), joinedView.matchId, 'Remount must keep the joined game instead of the original solo game');
    await page.evaluate(() => { window.harnessDropWidgetWrites = false; });
    await frame.locator('summary').click();
    await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  }
  // A host notification can switch games independently of a pending submission.
  await clickSquare(4, 1);
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await frame.locator('#choices button[title="e2-e4"]').click(); await frame.locator('#retry').waitFor();
  const switched = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_create', arguments: { mode: 'solo' } } })).json();
  await page.evaluate(async result => { await window.harnessShow(result); }, switched);
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  await clickSquare(4, 1); assert(await frame.locator('#choices button').count() > 0);
  await page.evaluate(() => { window.harnessWithoutWidgetState = true; window.harnessWidgetState = undefined; });
  await page.locator('#remount').click();
  await page.waitForFunction(() => window.harnessWidgetState?.modelContent?.matchId === window.harnessMatchId);
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.modelContent.revision), 0, 'Hosts without widget state still receive standard model context');
  if (mode === 'fixture') {
  await page.goto(new URL('/?terminal=1', base).href);
  await frame.locator('#status').filter({ hasText: 'Checkmate' }).waitFor();
  assert.equal(await frame.locator('#computer').isVisible(), false);
  assert.equal(await frame.locator('#choices button').count(), 0);
  }
  assertNoErrors();
  console.log(`Harness mode: ${mode}`);
  console.log(`PASS: SDK AppBridge initialization, painted board move, iframe remount with identical FEN/revision, Haste ambiguity, lost-reply same-ID retry committed once, bounded computer turn, definitive rejection recovery, match switch recovery, ${capabilities.friend ? 'friend join/reply polling, ' : ''}no fullscreen control, 390px touch moves, no page errors${mode === 'fixture' ? ', terminal fixture' : ', real HTTP MCP and PostgreSQL'}`);
} finally { await browser.close(); }
