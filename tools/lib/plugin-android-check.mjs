import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hitSizes } from './plugin-hit-sizes.mjs';
import { shot } from './checks.mjs';

// Ticket 36: measure the built page with the host's touch and fullscreen context.
export async function checkAndroidFixes(browser, base) {
  const page = await browser.newPage({ viewport: { width: 412, height: 790 }, hasTouch: true });
  const frame = page.frameLocator('iframe'), faults = [];
  let gameId;
  page.setDefaultTimeout(10_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const check = (ok, message, detail) => { if (!ok) faults.push(`${message}: ${JSON.stringify(detail)}`); };
  try {
    await page.goto(base);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: true } }));
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    // These public view samples have no service game. A poll must not replace them.
    await frame.locator('html').evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
    const created = await page.evaluate(() => window.harnessTool({ name: 'kingdown_create', arguments: {
      kind: 'solo', colour: 'white', options: { fairy: true, pool: ['R','B','N','Q'], arrangement: false, classic: false,
        cards: true, cardPool: ['EarthQuake','SkyLift','MorphP','Freeze'], kingPowers: true }
    } }));
    assert(!created.isError, JSON.stringify(created));
    gameId = created._meta.view.game_id;
    await page.evaluate(result => window.harnessShow(result), created);
    await frame.locator('#seat-ready').click();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    const original = await page.evaluate(() => window.harnessView);
    async function viewport(width, height, top, bottom, left = 0) {
      await page.setViewportSize({ width, height });
      await page.evaluate(safe => window.harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: true }, safeAreaInsets: safe }), { top, bottom, left, right: 0 });
    }
    async function show(extra = {}) {
      const view = { ...original, game_id: randomUUID(), revision: 100, status: 'playing', action: 'ready', ...extra };
      await page.evaluate(view => {
        window.harnessNextView = view;
        return window.harnessShow({ content: [], structuredContent: { game_id: view.game_id }, _meta: { board_id: window.harnessWidgetState.privateContent.board_id, view } });
      }, view);
      await frame.locator('#board[aria-busy="false"]').waitFor();
      await frame.locator('html').evaluate(() => document.fonts.ready);
      await frame.locator('#game-table').evaluate(async e => {
        await Promise.all(e.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
    }
    // K1 adds a coin row at 393–440 px. Keep the bar cost at no more than 4 px from that layout.
    for (const [width, height, top, bottom, oldBoard] of [[412,790,54,24,311], [393,852,102,118,304], [320,568,63,84,113], [1280,800,0,0,536]]) {
      await viewport(width, height, top, bottom);
      await show();
      for (const armed of [false, true]) {
        if (armed) {
          const index = original.rules.hands[0].indexOf('EarthQuake');
          assert(index >= 0);
          await frame.locator(`#card-w-${index}`).click();
          await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
          await frame.locator('#context-actions').getByRole('button', { name: 'Cancel', exact: true }).waitFor();
        }
        const state = `F9 ${width}x${height} board-cards${armed ? '-armed' : ''}`;
        const sizes = (await frame.locator('#game-table').evaluate(hitSizes)).filter(c => ['undo','end-turn','board-menu','moves-line'].includes(c.name));
        check(sizes.length === (width === 320 ? 3 : 4) && sizes.every(c => c.width >= 48 && c.height >= 48), state, sizes);
        const boxes = await frame.locator('#table-bar').evaluate(e => ({
          heights: [...e.querySelectorAll('button')].map(b => b.getBoundingClientRect().height),
          bottom: e.getBoundingClientRect().bottom, frameBottom: document.querySelector('.frame').getBoundingClientRect().bottom,
          board: document.querySelector('#board canvas').getBoundingClientRect().width
        }));
        check(boxes.board >= oldBoard - (width < height ? 4 : 0) && boxes.board <= oldBoard, `${state} board loses at most 4 px`, boxes);
        check(boxes.bottom <= boxes.frameBottom + 1, `${state} bar inside frame`, boxes);
        if (width < height) check(boxes.heights.every(h => h === 44), `${state} button art stays 44 px`, boxes);
        console.log(`${state}: ${JSON.stringify({ sizes, ...boxes })}`);
      }
    }
    for (const [width, height, top, bottom, left] of [[870,280,0,24,54], [740,360,0,24,54], [844,390,0,24,54], [197,426,51,59,0], [320,568,63,84,0], [393,852,102,118,0], [1280,800,0,0,0]]) {
      await viewport(width, height, top, bottom, left);
      for (const winner of [0, 1]) {
        const state = `T-B ${width}x${height} ${winner === 0 ? 'win' : 'loss'}`;
        await show({ status: 'finished', action: 'done', result: { winner, reason: 'checkmate' }, legal: [], rematch_offer: null });
        const card = frame.locator('#over.end-card[open]'); await card.waitFor();
        await card.evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished.catch(() => {}))); });
        // Do not reset scrollTop: this must measure the first view after focus.
        const first = await card.evaluate(e => {
          const card = e.getBoundingClientRect(), frame = document.querySelector('.frame').getBoundingClientRect();
          const inside = node => { const r = node.getBoundingClientRect(); return r.top >= card.top && r.bottom <= card.bottom && r.left >= card.left && r.right <= card.right && r.top >= frame.top && r.bottom <= frame.bottom && r.left >= frame.left && r.right <= frame.right; };
          return { scrollTop: e.scrollTop, title: inside(e.querySelector('#over-title')), result: inside(e.querySelector('#end-reason')), play: inside(e.querySelector('form button')) };
        });
        if (width === 870) await shot(page, `ticket36-end-${winner === 0 ? 'win' : 'loss'}-${width}x${height}`);
        // The 197 px card keeps the separate cut-action design of ticket 32.
        if (width > height) check(first.scrollTop === 0 && first.title && first.result && first.play, `${state} first view`, first);
        for (const name of ['Play again','New game','See the board']) {
          const button = card.getByRole('button', { name, exact: true });
          await button.scrollIntoViewIfNeeded();
          const reachable = await button.evaluate(e => {
            const r = e.getBoundingClientRect(), card = e.closest('dialog').getBoundingClientRect(), frame = document.querySelector('.frame').getBoundingClientRect();
            return r.top >= card.top && r.bottom <= card.bottom && r.left >= card.left && r.right <= card.right && r.top >= frame.top && r.bottom <= frame.bottom && r.left >= frame.left && r.right <= frame.right && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          });
          check(reachable, `${state} ${name} reachable`, reachable);
        }
        console.log(`${state}: ${JSON.stringify(first)}`);
        await card.getByRole('button', { name: 'See the board', exact: true }).click();
      }
    }
    assert.deepEqual(faults, [], 'Ticket 36 browser checks');
    console.log('PASS: ticket 36 F9 bar targets and T-B end cards');
  } catch (error) {
    console.error('Ticket 36 state:', await frame.locator('body').evaluate(e => ({ screen: e.dataset.page, status: document.querySelector('#status').textContent, sheet: document.querySelector('#board-sheet').textContent })));
    throw error;
  } finally {
    if (gameId) assert((await page.request.post(new URL('/fixture-delete-match', base).href, { data: { game_id: gameId } })).ok());
    await page.close();
  }
}
