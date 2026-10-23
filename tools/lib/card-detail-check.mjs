import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'vite';
import { shot, STEP } from './checks.mjs';
import { settled } from './plugin-settled.mjs';

async function visibleDiagram(diagram) {
  await diagram.scrollIntoViewIfNeeded();
  assert(await diagram.isVisible(), 'The detail shows its move diagram');
  const box = await diagram.boundingBox();
  assert(box.width >= 200 && box.height >= 120, 'The move diagram has room to read');
  assert(await diagram.evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth
      && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.card-diagram') === el;
  }), 'The move diagram fits the view and has no cover');
}

export async function checkCardDetails(browser, base, engine) {
  assert.match(engine, /^sha256:[a-f0-9]{64}$/, 'Card detail samples require the built runtime identity');
  const { fromFen, toLan } = await import('../../src/rules/setup.ts');
  const { legalMoves, RULES, setRules } = await import('../../src/rules/engine.ts');
  const web = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: true }, logLevel: 'error' });
  try {
    await web.listen();
    for (const [width, height] of [[390, 844], [1280, 800]]) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: theme, isMobile: width === 390, hasTouch: width === 390 });
      try {
        const page = await context.newPage(); page.setDefaultTimeout(10_000 * STEP);
        await page.goto(web.resolvedUrls.local[0] + '?title=0&players=human,human');
        await page.waitForFunction(() => !!document.getElementById('menu-btn')?.onclick);
        await page.locator('#menu-btn').click(); await page.locator('[data-go="extra"]').click();
        await page.locator('#workshop-btn').click(); await page.locator('#pg-tab-cards').click();
        if (!await page.locator('[data-lab="Strike"]').count()) await page.locator('[data-act="cardsall"]').click();
        for (const card of ['Strike', 'Haste', 'Flight']) {
          await page.locator(`[data-lab="${card}"]`).click();
          await visibleDiagram(page.locator(`.pg-plinth > .card-diagram:has(.pm-${card})`));
          await shot(page, `repair-A5-workshop-${card}-${width}x${height}-${theme}`);
        }
        if (!await page.locator('[data-lab="SpawnK"]').count()) await page.locator('[data-act="cardsall"]').click();
        await page.locator('[data-lab="SpawnK"]').click();
        const spawn = page.locator('.pg-plinth [data-card-picture="SpawnK"]');
        assert.equal(await spawn.locator('[data-piece="king"]').count(), 1);
        assert.equal(await spawn.locator('[data-piece="pawn"]').count(), 1);
        await shot(page, `repair-A33-workshop-SpawnK-${width}x${height}-${theme}`);
        // The solo board polls every 5 s (src/plugin/poll.ts), and a good read clears a failed one, so the failed-read
        // check below stops the page clock. Install it before the page sets any timer.
        if (width === 390 && theme === 'light') await page.clock.install();
        await page.goto(base);
        const frame = page.frameLocator('iframe');
        await frame.locator('#home-play:not(:disabled)').waitFor();
        await page.addStyleTag({ content: '#remount{display:none}iframe{height:100dvh!important}' });
        await page.evaluate(theme => window.harnessSetContext({ theme, displayMode: 'fullscreen' }), theme);
        setRules({ hands: [['Strike', 'Haste', 'Flight', 'Control'], []] });
        const fen = '7k/6p1/8/8/8/8/P7/1NR1K3 w - - 0 1', pos = fromFen(fen);
        let view = { game_id: randomUUID(), engine_fingerprint: engine, revision: 0, created_at: '2026-10-19T00:00:00Z', abort_open: false, seat: 0, kind: 'solo', speed: 'daily', days_per_move: 3, status: 'playing', turn: 0, action: 'ready', fen, in_check: false, legal: legalMoves(pos).map(move => toLan(pos, move)), last_commands: [], opponent: null, draw_offer: null, deadline_at: null, server_now: '2026-10-19T00:00:00Z', rules: structuredClone(RULES) };
        const result = () => ({ content: [], structuredContent: { screen: 'board', game_id: view.game_id }, _meta: { view, board_id: 'card-detail-check' } });
        let failPoll = false;
        await page.route('**/fixture-tool', async route => {
          const { name } = route.request().postDataJSON();
          if (name === 'kingdown_get' && failPoll) await route.abort('failed');
          else if (name === 'kingdown_get') await route.fulfill({ json: result() });
          else if (name === 'kingdown_draw') { view = { ...view, draw_offer: 0 }; await route.fulfill({ json: result() }); }
          else await route.continue();
        });
        await page.evaluate(result => window.harnessShow(result, true), result());
        await frame.locator('#board[aria-busy="false"]').waitFor(); await settled(page, frame);
        for (const [index, card] of ['Strike', 'Haste', 'Flight', 'Control'].entries()) {
          await frame.locator(`#card-w-${index}`).click();
          if (card !== 'Control') await visibleDiagram(frame.locator(`#board-sheet .card-diagram:has(.pm-${card})`));
          else {
            assert.equal(await frame.locator('#board-sheet [data-piece="knight"]').count(), 1);
            assert.equal(await frame.locator('#board-sheet [data-piece="rook"]').count(), 1);
          }
          await shot(page, `repair-${card === 'Control' ? 'A33' : 'A5'}-board-${card}-${width}x${height}-${theme}`);
          await frame.locator('#board-sheet [aria-label="Close"]').click();
        }
        if (width === 390 && theme === 'light') {
          const sheet = frame.locator('#board-sheet'), retry = frame.locator('#retry');
          const readCard = async reason => {
            await frame.locator('#card-w-1').click();
            assert.equal(await sheet.locator('.card-reason').innerText(), reason);
            assert.equal(await sheet.getByRole('button', { name: 'Use', exact: true }).count(), 0);
          };
          const usable = async () => {
            await frame.locator('#card-w-1').click();
            assert(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible(), `Haste is usable after recovery: ${await sheet.innerText()}`);
            assert.equal(await sheet.locator('.card-reason').count(), 0);
            await sheet.locator('[aria-label="Close"]').click();
          };
          // Stop the page clock until Try again ends, so no poll read clears the failed read first. Pause ahead of now: the
          // page clock can pass a nearer time before the command reaches it. The wait ends a read that the jump starts.
          await page.clock.pauseAt(Date.now() + 2000);
          await page.waitForFunction(() => window.harnessWidgets.every(widget => !widget.inflight));
          await page.evaluate(() => { window.rejectNextGet = true; });
          await frame.locator('#board-menu').click(); await frame.locator('#reload').click();
          await retry.filter({ hasText: 'Try again' }).waitFor();
          await readCard('Close this sheet and select Try again.');
          await shot(page, 'repair-A35-failed-read');
          await sheet.locator('[aria-label="Close"]').click(); await retry.click();
          await retry.waitFor({ state: 'hidden' }); await usable();
          await page.clock.resume();
          view = { ...view, game_id: randomUUID(), kind: 'friend' };
          await page.evaluate(result => window.harnessShow(result, true), result());
          await frame.locator('#board[aria-busy="false"]').waitFor(); await settled(page, frame);
          await frame.locator('#board-menu').click(); await frame.locator('#menu-draw').click();
          // failNextAction fails the next tool call, a board read too (tools/plugin-ui-host.ts callTool). Stop the page clock
          // until the command ends, so no poll read takes the failure (ticket 77, item 20). Pause ahead of the page's own
          // now: the fastForward steps below move the page clock ahead of this process's clock.
          await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
          await page.waitForFunction(() => window.harnessWidgets.every(widget => !widget.inflight));
          await page.evaluate(() => { window.holdBeforeNext = 'kingdown_draw'; window.failNextAction = true; });
          // Fail before the server receives the draw offer.
          await sheet.getByRole('button', { name: 'Offer draw', exact: true }).click();
          await retry.filter({ hasText: 'Retry' }).waitFor();
          await readCard('Close this sheet and select Retry.');
          await shot(page, 'repair-A35-failed-command');
          await sheet.locator('[aria-label="Close"]').click();
          await retry.click();
          await page.waitForFunction(() => !!window.releaseBefore);
          assert(await frame.locator('#card-w-1').isDisabled(), 'A command in flight keeps the card coin off');
          await page.evaluate(() => window.releaseBefore());
          await retry.waitFor({ state: 'hidden' }); await usable();
          await page.clock.resume();
          // A draw offer sets the friend game's poll delay to three seconds.
          await frame.locator('#card-w-1').click();
          await sheet.evaluate(el => { window.openCardFace = el.querySelector('.cf-art'); });
          const gets = () => page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);
          failPoll = true;
          for (let i = 0; i < 3; i++) {
            const before = await gets();
            await page.clock.fastForward(3000);
            await page.waitForFunction(before => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > before && window.harnessWidgets.every(widget => !widget.inflight), before);
            if (i < 2) assert(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible());
          }
          assert.equal(await sheet.locator('.card-reason').innerText(), 'Close this sheet and select Try again.');
          assert.equal(await sheet.getByRole('button', { name: 'Use', exact: true }).count(), 0);
          await shot(page, 'repair-A35-open-sheet-failed-polls');
          failPoll = false;
          const before = await gets();
          await page.clock.fastForward(3000);
          await page.waitForFunction(before => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > before && window.harnessWidgets.every(widget => !widget.inflight), before);
          await sheet.getByRole('button', { name: 'Use', exact: true }).waitFor();
          assert(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible());
          assert.equal(await sheet.locator('.card-reason').count(), 0);
          assert(await sheet.evaluate(el => el.open && el.querySelector('.cf-art') === window.openCardFace), 'The same card sheet stays open through failure and recovery');
          await shot(page, 'repair-A35-open-sheet-recovered');
          await sheet.locator('[aria-label="Close"]').click();
          await frame.locator('#board').focus();
          for (const key of ['ArrowRight', 'ArrowRight', 'Enter', 'ArrowUp', 'Enter']) await page.keyboard.press(key);
          await frame.locator('#board[data-animating="false"]').waitFor();
          // The three-second poll must not take the one-use failure before End turn sends (ticket 77, item 20).
          await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
          await page.waitForFunction(() => window.harnessWidgets.every(widget => !widget.inflight));
          await page.evaluate(() => { window.failNextAction = true; });
          await frame.locator('#end-turn').click();
          await retry.filter({ hasText: 'Retry' }).waitFor();
          await readCard('Close this sheet and select Retry.');
          await shot(page, 'repair-A35-failed-turn-send');
          await page.clock.resume();
          console.log('Card recovery: failed read, failed command, failed turn send, action in flight and an open sheet through failed polls and same-revision recovery pass');
        }
      } finally { await context.close(); }
    }
    console.log('Card details: three diagrams in Workshop and board, phone and desktop, light and dark pass');
  } finally { setRules(); await web.close(); }
}
