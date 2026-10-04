// Lessons must never replace the live match, including its rules and link-side restriction.
// PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-lesson-return.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { setUpGame, startGame } from './new-game-ui.mjs';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out = process.env.PLAYABLE_OUT || 'docs/painted-game';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
try {
  for (const look of ['painted', 'clay']) for (const phone of [false, true]) {
    const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: phone });
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
    page.on('pageerror', e => errors.push(e.message));
    const url = new URL(base);
    url.search = new URLSearchParams({ look, rules: '2021', army: 'RNBQKBNR', moves: 'e2-e4_e7-e5' });
    await page.goto(url.href);
    await page.waitForFunction(() => window.view);
    await page.evaluate(() => window.view.ready());
    await page.click('#settings-btn'); await page.selectOption('#pace', 'off'); await page.keyboard.press('Escape');
    const saved = () => page.evaluate(() => localStorage.getItem('kingdown.save'));
    const board = () => page.evaluate(() => Array.from((window.view.pos ?? window.view.lastPos).board));
    const before = await saved(), position = await board();
    const tap = async sq => {
      const p = await page.evaluate(sq => window.view.screenOf(sq), sq);
      if (phone) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    };
    await page.click('#rules-btn'); await page.click('#learn');
    // This used to abandon the lesson and save its tiny board over the match.
    await setUpGame(page, { mode: 'computer', level: 'strong' }); await page.keyboard.press('Escape');
    assert.equal(await saved(), before, 'choosing a future opponent in a lesson preserves the saved match');
    assert.match(await page.textContent('#turn'), /Lesson 1 of 6/);
    if (look === 'painted') {
      // Under 2021 rules the straight Beast bites are impossible and the Paladin removes itself.
      // Lessons must use the current rules, then restore the match's older rules on return.
      const steps = [[27, 36], [11, 12], [27, 28], [27, 35, 43], [27, 35], [3, 43]];
      for (const [i, squares] of steps.entries()) {
        for (const sq of squares) await tap(sq);
        if (await page.evaluate(() => document.getElementById('move-choice').open)) await page.click('#choose-push');
        await page.waitForFunction(() => document.getElementById('moment').textContent.startsWith('Well done.'));
        if (i < steps.length - 1) await page.click('#next-lesson');
      }
      assert.equal((await board())[43], 8, 'the Paladin survives the lesson pawn capture');
      await page.locator('#return-game').scrollIntoViewIfNeeded();
      const bounds = await page.locator('#return-game').boundingBox();
      assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= page.viewportSize().height);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      await page.screenshot({ path: `${out}/lesson-return-${phone ? 'phone' : 'desktop'}.png` });
    }
    await page.click('#return-game');
    assert.equal(await saved(), before, 'return restores moves, rules, players and link side');
    assert.deepEqual(await board(), position, 'the original board is restored');
    assert.equal(await page.isVisible('#return-game'), false);
    const back = JSON.parse(await saved());
    assert.deepEqual([back.white, back.black], ['human', 'human'], 'the original players are restored');
    assert.equal(await page.textContent('#turn'), 'White to move');
    // Returning midway through a lesson works too; choosing an army explicitly ends the lessons.
    await page.click('#rules-btn'); await page.click('#learn'); await page.click('#return-game');
    assert.equal(await saved(), before);
    if (look === 'painted') {
      for (const sq of [11, 19]) await tap(sq); // this device plays White
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length === 3);
      const sent = await saved(), sentBoard = await board();
      for (const sq of [51, 43]) await tap(sq); // Black belongs to the friend
      assert.equal(await saved(), sent, 'return preserves the friend-side input lock');
      assert.deepEqual(await board(), sentBoard);
    }
    await page.click('#rules-btn'); await page.click('#learn');
    await startGame(page, { army: 'classic' });
    assert.equal(await page.isVisible('#return-game'), false);
    const fresh = JSON.parse(await saved());
    assert.equal(fresh.back, 'RNBQKBNR');
    assert.deepEqual(fresh.moves, []);
    assert.equal(fresh.rules.paladinKamikaze, 'always', 'a new game restores the URL preset');
    console.log(`ok ${look} ${phone ? 'phone' : 'desktop'}: lesson save protection, return, rules, new game`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
