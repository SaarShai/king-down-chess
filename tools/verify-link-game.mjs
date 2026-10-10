// Previously: three cases, then the existing guarded link-send checks.
import assert from 'node:assert/strict';
import { assertHiddenDetail } from './previously-layout-check.mjs';
import { lanMoves, openMenu, closeMenu, seeAgain } from './app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const browser = await launch();
const base = env('PLAYABLE_URL');
const url = new URL('?army=RNBQKBNR&moves=e2-e4_e7-e5&look=painted', base).href;
async function open(motion = true) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: motion ? 'no-preference' : 'reduce' });
  await context.addInitScript(motion => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    if (!sessionStorage.getItem('link.seeded')) {
      sessionStorage.setItem('link.seeded', '1');
      localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false, pace: motion ? 'normal' : 'off' }));
    }
    // Observe real drawn motion, without replacing any app method.
    window.linkFrames = { runs: 0, before: false };
    let playing = false;
    function observe() {
      const view = window.view, on = !!view?.scene?.animating;
      if (on && !playing) window.linkFrames.runs++;
      if (on && view.pos.board[52] && !view.pos.board[36]) window.linkFrames.before = true;
      playing = on;
      requestAnimationFrame(observe);
    }
    requestAnimationFrame(observe);
  }, motion);
  const page = await context.newPage();
  trapErrors(page);
  page.on('dialog', d => d.accept());
  await page.goto(url);
  await page.waitForFunction(() => document.getElementById('context-text').textContent.includes('Previously'));
  await page.waitForFunction(() => window.view.pos.board[36] && !window.view.pos.board[52] && !window.view.scene.animating && document.getElementById('see-again').getAttribute('aria-disabled') === 'false');
  return { page, context };
}

try {
  const first = await open();
  const { page } = first;
  assert.equal(await page.locator('#previously-before').textContent(), 'You: Pawn e2 to e4.');
  assert.ok((await page.locator('#context-text').textContent()).includes('Pawn e7 to e5.'));
  assert.equal(await page.locator('#context-text > span').first().innerText(), 'Previously: their pawn moved to e5.');
  assert.equal(await page.locator('#last-move').isHidden(), true, 'Moves does not repeat the friend turn');
  assert.deepEqual(await page.evaluate(() => window.linkFrames), { runs: 1, before: true });
  await openMenu(page); await closeMenu(page);
  assert.equal(await page.evaluate(() => window.linkFrames.runs), 1, 'a refresh does not replay');
  await page.reload();
  await page.waitForFunction(() => window.view?.pos?.board[36] && document.getElementById('asset-status').textContent === '');
  assert.equal(await page.evaluate(() => window.linkFrames.runs), 0, 'a reload does not replay');
  await first.context.close();
  const still = await open(false);
  assert.ok((await still.page.locator('#context-text').textContent()).includes('Pawn e7 to e5.'));
  assert.equal(await still.page.locator('#see-again').isHidden(), true);
  assert.equal(await still.page.evaluate(() => window.linkFrames.runs), 0);
  await still.context.close();
  console.log('ok Previously plays once; reload and Motion Off do not replay');

  const long = await open(false);
  await long.page.setViewportSize({ width: 320, height: 568 });
  await long.page.goto(new URL(`?${new URLSearchParams({ fen: '7k/8/8/8/8/8/8/R5K1 b - - 0 1', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1-a5!H_Ra5-e5' })}`, base).href);
  await long.page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously');
  assert.equal(await long.page.locator('#context-text > span').first().innerText(), 'Previously: their rook moved to e5.');
  assert.equal(await long.page.locator('#context-text > span').nth(1).innerText(), 'Rook a1 to a5 with Haste, then to e5.');
  assert.ok(await long.page.locator('#context-text').evaluate(el => {
    const area = document.getElementById('context-line').getBoundingClientRect();
    return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1
      && [...el.children].filter(row => row.checkVisibility()).every(row => {
        const range = document.createRange(); range.selectNodeContents(row);
        return [...range.getClientRects()].every(r => r.top >= area.top && r.bottom <= area.bottom);
      });
  }), 'the whole friend turn fits at 320x568 with no scroll or cut glyphs');
  await long.page.goto(new URL(`?${new URLSearchParams({ fen: '7k/8/8/r3r3/8/8/8/R5K1 b - - 0 1', rules: '2017', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1xa5!H_Ra5xe5' })}`, base).href);
  await long.page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously');
  assert.equal(await long.page.locator('#context-text > span').first().innerText(), 'Previously: their rook took 2 pieces.');
  assert.ok(await long.page.locator('#context-text').evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.getBoundingClientRect().bottom <= document.getElementById('moves-line').getBoundingClientRect().top), 'Haste takes are not cut at 320x568');
  for (const [width, height] of [[320, 568], [390, 844]]) {
    await long.page.setViewportSize({ width, height });
    await long.page.goto(new URL(`?${new URLSearchParams({ fen: '7k/6p1/5p2/3pp3/2nS4/8/8/K7 b - - 0 1', moves: 'Kh8-h7_Sd4xc4xd5xe5xf6' })}`, base).href);
    await long.page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously');
    assert.equal(await long.page.locator('#context-text > span').first().innerText(), 'Previously: their beast took 4 pieces.');
    assert.ok(await long.page.locator('#context-text').evaluate(el => {
      const box = el.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(el.firstElementChild);
      return el.scrollHeight <= el.clientHeight + 1 && box.bottom <= document.getElementById('moves-line').getBoundingClientRect().top
        && [...range.getClientRects()].every(r => r.top >= box.top && r.bottom <= box.bottom)
        && parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize) >= 1.2;
    }), 'a long turn keeps whole summary lines above Moves');
  }
  await long.context.close();

  const longMotion = await open();
  await longMotion.page.setViewportSize({ width: 320, height: 568 });
  await longMotion.page.goto(new URL(`?${new URLSearchParams({ fen: '7k/8/8/r3r3/8/8/8/R5K1 b - - 0 1', rules: '2017', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1xa5!H_Ra5xe5' })}`, base).href);
  await longMotion.page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously' && !window.view.scene.animating && document.getElementById('see-again').getAttribute('aria-disabled') === 'false');
  assert.equal(await longMotion.page.locator('#see-again').isVisible(), true, 'See again stays available beside a full Haste turn');
  assert.ok(await longMotion.page.locator('#context-text').evaluate(el => {
    const box = el.getBoundingClientRect(), area = document.getElementById('context-line').getBoundingClientRect();
    return el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1 && box.top >= area.top && box.bottom <= area.bottom;
  }), 'the long Previously turn and See again fit together at 320x568');
  await longMotion.page.goto(new URL(`?${new URLSearchParams({ fen: 'k7/6pp/5pp1/3pp1pp/2nS3p/8/8/K7 b - - 0 1', rules: '2017', kings: 'flame:haste,none', moves: 'Ka8-a7_Sd4xc4xd5xe5xf6!H_Sf6xg7xh7xg6xh5xg5xh4' })}`, base).href);
  await longMotion.page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously' && !window.view.scene.animating && document.getElementById('see-again').getAttribute('aria-disabled') === 'false');
  assert.equal(await longMotion.page.locator('#context-text > span').first().innerText(), 'Previously: their beast took 10 pieces.');
  await assertHiddenDetail(longMotion.page);
  await longMotion.context.close();

  const again = await open();
  await seeAgain(again.page);
  await again.page.evaluate(() => document.getElementById('see-again').click());
  assert.equal(await again.page.getAttribute('#end-turn', 'aria-disabled'), 'true');
  await again.page.waitForFunction(() => window.linkFrames.runs === 2 && !window.view.scene.animating && document.getElementById('see-again').getAttribute('aria-disabled') === 'false');
  assert.deepEqual(await lanMoves(again.page), ['e2-e4', 'e7-e5']);
  assert.equal(await again.page.evaluate(() => window.view.pos.board[36] > 0 && !window.view.pos.board[52]), true);
  await again.context.close();
  console.log('ok See again plays the same turn once');

  const undo = await open();
  await undo.page.locator('#undo').dispatchEvent('click');
  assert.equal(await undo.page.getAttribute('#undo', 'aria-disabled'), 'true');
  assert.deepEqual(await lanMoves(undo.page), ['e2-e4', 'e7-e5']);
  for (const sq of [11, 19]) {
    const p = await undo.page.evaluate(sq => window.view.screenOf(sq), sq);
    await undo.page.mouse.click(p.x, p.y);
  }
  await undo.page.waitForFunction(() => !window.view.scene.animating && document.getElementById('undo').getAttribute('aria-disabled') === 'false');
  await undo.page.locator('#undo').click();
  assert.deepEqual(await lanMoves(undo.page), ['e2-e4', 'e7-e5']);
  await undo.page.locator('#undo').dispatchEvent('click');
  assert.deepEqual(await lanMoves(undo.page), ['e2-e4', 'e7-e5']);
  await undo.context.close();
  console.log('ok Undo takes only your staged ply');
  assertNoErrors();
} finally { await browser.close(); }

await import('./verify-turn.mjs');
