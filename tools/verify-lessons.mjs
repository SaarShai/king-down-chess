// W9: the shelf opens, a figure opens its lesson, and Learned follows the store.
import assert from 'node:assert/strict';
import { contextText, openPieceRules, pressMenu, startLesson, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, minTarget, noSidewaysScroll, trapErrors } from './lib/checks.mjs';

const browser = await launch();
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', pace: 'off', sound: false }));
      localStorage.removeItem('kingdown.lessons');
    });
    const page = await context.newPage(); trapErrors(page);
    await page.goto(env('PLAYABLE_URL'));
    await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    const saved = () => page.evaluate(() => localStorage.getItem('kingdown.save'));
    const board = () => page.evaluate(() => Array.from(window.view.pos.board));
    const before = await saved(), position = await board();
    const tap = async sq => {
      const p = await page.evaluate(s => window.view.screenOf(s), sq);
      if (width === 390) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    };
    await pressMenu(page, 'Guide');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.shelf-figure img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    assert.equal(await page.locator('#lesson-shelf').isVisible(), true, 'Guide opens on the shelf');
    assert.deepEqual(await page.locator('.shelf-name').allTextContents(), ['Archer', 'Beast', 'Maester', 'Ogre', 'Guard', 'Paladin']);
    assert.equal(await page.locator('#learn').innerText(), 'Learn the Archer');
    assert.equal(await page.locator('[data-piece="archer"] .shelf-status').innerText(), 'Next');
    assert.equal(await page.locator('[data-piece="paladin"] .shelf-status').innerText(), '');
    await minTarget(page, '.shelf-piece, #learn'); await noSidewaysScroll(page);
    assert.equal(await page.evaluate(() => {
      const safe = document.querySelector('.shelf-safe').getBoundingClientRect();
      const sheet = document.getElementById('rules').getBoundingClientRect();
      return safe.bottom <= sheet.bottom && safe.bottom <= innerHeight;
    }), true, 'the saved-game line stays in view');
    assert.equal(await page.evaluate(() => {
      const close = document.querySelector('.lesson-guide-head button'), box = close.getBoundingClientRect();
      const lead = document.getElementById('rules-lead').getBoundingClientRect();
      const body = document.querySelector('.lesson-guide-body').getBoundingClientRect();
      const safe = document.querySelector('.shelf-safe').getBoundingClientRect();
      const learn = document.getElementById('learn').getBoundingClientRect();
      return box.width === 44 && box.height === 44 && parseFloat(getComputedStyle(close).fontSize) === 24
        && lead.top + 20 < body.bottom && Math.abs((safe.left + safe.right - learn.left - learn.right) / 2) < 1;
    }), true, 'Guide shows Close, the first rule line and the centred save note');
    const guideHead = await page.locator('.lesson-guide-head').boundingBox();
    await page.locator('.lesson-guide-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
    assert.deepEqual(await page.locator('.lesson-guide-head').boundingBox(), guideHead, 'Guide head stays in place when rules scroll');
    await page.locator('.lesson-guide-body').evaluate(el => { el.scrollTop = 0; });
    console.log(`ok lessons ${width}: the shelf opens with six figures`);

    await page.locator('.shelf-piece[data-piece="beast"]').click();
    assert.match(await page.locator('#turn').textContent(), /Lesson 4 of 6: Beast/);
    assert.equal(await page.locator('#undo').isVisible(), false);
    assert.equal(await page.locator('#end-turn').isVisible(), false);
    assert.equal(await page.locator('#show-me').isVisible(), true);
    await page.click('#show-me');
    await page.waitForFunction(() => window.view.marks.hint.length > 0 && !document.getElementById('show-me').disabled);
    assert.deepEqual(await page.evaluate(() => window.view.marks.hint), [27, 35, 43]);
    await page.click('#return-game');
    assert.equal(await saved(), before, 'a figure lesson keeps the saved game');
    assert.deepEqual(await board(), position, 'Return restores the kept board');
    console.log(`ok lessons ${width}: a figure opens its lesson with Show me`);

    await page.evaluate(() => localStorage.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Beast', 'Maester', 'Ogre'], tricks: ['wall'] })));
    await pressMenu(page, 'Guide');
    assert.equal(await page.locator('[data-status="Learned"]').count(), 4);
    assert.equal(await page.locator('[data-piece="guard"] .shelf-status').innerText(), 'Next');
    assert.equal(await page.locator('#learn').innerText(), 'Learn the Guard');
    await page.click('#learn'); await tap(11); await tap(12);
    await waitForUi(page, ui => ui.lessonLearned === 'Guard');
    assert.equal(await contextText(page), 'Guard learned.');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.lessons'))), { done: ['Archer', 'Beast', 'Maester', 'Ogre', 'Guard'], tricks: ['wall'] });
    await pressMenu(page, 'Guide');
    assert.equal(await page.locator('[data-piece="guard"] .shelf-status').innerText(), '✓ Learned');
    assert.equal(await page.locator('#learn').innerText(), 'Learn the Paladin');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('kingdown.lessons')); p.done.push('Paladin'); localStorage.setItem('kingdown.lessons', JSON.stringify(p)); });
    await pressMenu(page, 'Guide');
    assert.equal(await page.locator('#learn').innerText(), 'Return to game');
    await page.click('#learn');
    assert.equal(await saved(), before, 'Play restores the kept game');
    assert.deepEqual(await board(), position);
    console.log(`ok lessons ${width}: Learned follows the store and keeps other fields`);
    await page.evaluate(() => localStorage.removeItem('kingdown.lessons'));
    await startLesson(page, 'Archer');
    await tap(27); await tap(45);
    await waitForUi(page, ui => ui.lessonLearned === 'Archer');
    assert.equal(await page.locator('#next-lesson').innerText(), 'Next lesson: Beast');
    await page.click('#next-lesson');
    assert.match(await page.locator('#turn').innerText(), /Beast/);
    await page.click('#return-game');
    assert.equal(await saved(), before, 'Next lesson keeps the saved game');
    console.log(`ok lessons ${width}: Archer leads to the shelf next lesson, Beast`);

    await tap(28); await openPieceRules(page);
    assert.equal(await page.evaluate(() => {
      const sheet = document.getElementById('rules').getBoundingClientRect();
      const head = document.querySelector('.lesson-guide-head').getBoundingClientRect();
      const focus = document.activeElement;
      return head.top >= sheet.top && head.bottom <= sheet.bottom && focus.matches('.piece-card')
        && getComputedStyle(focus).outlineStyle === 'solid';
    }), true, 'All rules keeps the full Guide head and outlines the card');
    await page.keyboard.press('Escape'); await pressMenu(page, 'Guide');
    assert.equal(await page.locator('.lesson-guide-body').evaluate(el => el.scrollTop), 0, 'Menu Guide returns to the shelf after All rules');
    await context.close();
  }
  assertNoErrors();
} finally { await browser.close(); }
