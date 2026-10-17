import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { shot } from './checks.mjs';

// Ticket 37: measure the built page through the host, with real card and power coins.
export async function checkOwnerPicks(page, frame, saved, idleBoard, boardBox) {
  const viewport = page.viewportSize(), faults = [];
  const check = (ok, message, detail) => { if (!ok) faults.push(`${message}: ${JSON.stringify(detail)}`); };
  const show = async view => {
    await page.evaluate(view => {
      window.harnessNextView = view;
      return window.harnessShow({ content: [], structuredContent: { screen: 'board', game_id: view.game_id }, _meta: { board_id: window.harnessWidgetState.privateContent.board_id, view } });
    }, view);
    await idleBoard(); await boardBox();
  };
  await frame.locator('html').evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
  await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: true }, safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } }));
  for (const powers of [false, true]) {
    const kings = powers ? [{ king: 'Mud', power: 'March' }, { king: 'Shadow', power: 'Darkness' }] : saved._meta.view.rules.kings;
    const view = { ...saved._meta.view, game_id: randomUUID(), kind: 'friend', opponent: { handle: 'friend_player1', computer: false }, rules: { ...saved._meta.view.rules, kings }, kings };
    await show(view);
    for (const [width, height] of [[402, 714], [412, 790], [440, 760]]) {
      await page.setViewportSize({ width, height }); await boardBox();
      await frame.locator('html').evaluate(() => document.fonts.ready);
      for (const side of ['them', 'me']) {
        const fit = await frame.locator(`#strip-${side}`).evaluate(strip => {
          const name = strip.querySelector('.player-name b'), row = strip.querySelector('.player-name').getBoundingClientRect();
          const coins = [...strip.querySelectorAll('.coin')].map(coin => coin.getBoundingClientRect());
          return { name: name.textContent, scroll: name.scrollWidth, client: name.clientWidth, secondRow: coins.every(coin => coin.top >= row.bottom), coins: coins.length };
        });
        check(fit.scroll <= fit.client && fit.secondRow && fit.coins === (powers ? 5 : 4), `K1 ${side}, ${width}px, powers ${powers}`, fit);
      }
      const fit = await frame.locator('#table-bar').evaluate(bar => {
        const b = bar.getBoundingClientRect(), f = document.querySelector('.frame').getBoundingClientRect();
        return b.top >= f.top && b.bottom <= f.bottom + 1 && b.left >= f.left && b.right <= f.right;
      });
      check(fit, `K1 bar fits at ${width}px, powers ${powers}`, fit);
      await shot(page, `k1-${width}-powers-${powers}`);
    }
  }
  await show(saved._meta.view);
  await page.evaluate(() => window.harnessSetContext({ displayMode: 'inline' }));
  await frame.locator('#home-card').waitFor();
  for (const [width, height] of [[390, 844], [402, 714], [440, 760], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const fit = await frame.locator('#home-play').evaluate(button => {
      const span = button.querySelector('span'), detail = span.querySelector('small');
      const first = document.createRange(); first.selectNodeContents(span.firstChild);
      const title = first.getBoundingClientRect(), sub = detail?.getBoundingClientRect();
      const b = button.getBoundingClientRect(), other = document.querySelector('#home-games').getBoundingClientRect();
      return { title: span.firstChild.textContent, detail: detail?.textContent, full: span.scrollWidth <= span.clientWidth && span.scrollHeight <= span.clientHeight && (!detail || detail.scrollWidth <= detail.clientWidth), twoLines: !!sub && sub.top >= title.bottom, height: b.height, beside: Math.abs(b.top - other.top) < 1, column: other.top >= b.bottom };
    });
    check(fit.title === 'Resume' && fit.detail === 'Computer · Your move' && fit.full && fit.twoLines && fit.height >= 48 && (width < 340 ? fit.column : fit.beside), `K2 Resume at ${width}px`, fit);
    check(await frame.getByRole('button', { name: /^Resume\s+Computer · Your move$/ }).count() === 1, `K2 one accessible name at ${width}px`, fit);
    await shot(page, `k2-resume-${width}`);
  }
  await page.setViewportSize(viewport);
  await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen' }));
  await frame.locator('html').evaluate(() => { delete document.hidden; });
  await show(saved._meta.view);
  assert.deepEqual(faults, [], 'Ticket 37: player names and Resume text fit');
  console.log('PASS: K1 card rows at 402/412/440 px, with and without powers; K2 Resume at 390/402/440 px and the 320 px column');
}
