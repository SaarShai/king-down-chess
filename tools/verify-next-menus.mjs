// The menus and sides repair. Run through check:browser next-menus, or with PLAYABLE_URL and PLAYABLE_OUT.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const browser = await launch(), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const sizes = (process.env.MENUS_SIZES || '360x640,375x667,390x844,430x932,667x375,844x390,932x430,768x1024,820x1180,1024x768,1180x820,1366x1024,1280x720,1440x900,1920x1080,2560x1440,320x568').split(',');
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href, MAIN = '.play-home .kd-button[data-kind="main"]';
const results = [];
const ready = page => page.waitForFunction(() => { const g = document.querySelector('.play-game'); return g?.style.visibility !== 'hidden' && g?.dataset.state === 'ready' && !document.querySelector('.play-home, .play-versus'); });
const saved = page => page.evaluate(() => localStorage.getItem('kingdown.save'));
const order = page => page.locator('[data-setting]').evaluateAll(nodes => nodes.map(n => n.dataset.setting));
const shot = async (page, name) => {
  await page.waitForTimeout(650); // Capture the settled page, after the sheet and dialog departure.
  return page.screenshot({ path: join(out, `${page.viewportSize().width}x${page.viewportSize().height}-${name}.png`) });
};
// Each rendered line, from actual character rectangles. A ch value alone does not set the character count.
const lines = (page, selector) => page.locator(selector).evaluateAll(nodes => nodes.flatMap(node => {
  const rows = new Map(), walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const text = walker.currentNode; for (let i = 0; i < text.length; i++) {
    const range = document.createRange(); range.setStart(text, i); range.setEnd(text, i + 1);
    const r = range.getBoundingClientRect(); if (!r.height) continue;
    const y = Math.round(r.top); rows.set(y, (rows.get(y) || '') + text.textContent[i]);
  } }
  return [...rows.values()].map(line => line.trim().length);
}));
const unbroken = (page, selector) => page.locator(selector).evaluateAll(nodes => nodes.every(node => {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const text = walker.currentNode; for (const match of text.textContent.matchAll(/\S+/g)) {
    const range = document.createRange(); range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length);
    if (new Set([...range.getClientRects()].map(r => Math.round(r.top))).size > 1) return false;
  } } return true;
}));
const cases = {
  async code_fault(page, context, check) {
    const pattern = /\/assets\/board-api-[\w-]+\.js$/;
    await context.route(pattern, r => r.abort());
    await page.goto(NEXT); await page.locator(MAIN).click();
    await page.waitForFunction(() => document.querySelector('body > .kd-sr')?.textContent.includes('The board cannot load.'));
    check(await page.locator('.home-load-fault').isVisible(), 'the board-code fault has a visible line');
    check(await page.locator('.home-load-fault').textContent().catch(() => '') === 'The board cannot load. Reload the page.', 'the visible line names the safe step');
    check(await saved(page) === null, 'the failed load writes no game');
    await shot(page, 'code-fault');
    await context.unroute(pattern); await page.locator(MAIN).click(); await ready(page);
    check(await page.locator('.home-load-fault').count() === 0, 'a new press clears the fault and opens the game');
  },
  async font_fault(page, context, check) {
    await context.route('**/fonts/alegreya-sans-bold-latin.woff2', r => r.abort());
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    await page.waitForTimeout(250);
    check(await page.locator('#boot-fault').count() === 0, 'a failed font does not show a page-code fault');
  },
  async home_art(page, context, check) {
    await context.route('**/ui/pieces/*.webp', r => r.abort());
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    await page.waitForTimeout(250);
    check(await page.locator('.home-army img').evaluateAll(imgs => imgs.every(img => img.hidden)), 'failed home figures hide the broken picture');
    check(await page.locator('.home-army .army-fallback').evaluateAll(nodes => nodes.length > 0 && nodes.every(n => !n.hidden && n.textContent)), 'each failed figure keeps a visible name');
    // Use a long real piece name even when the random army does not deal it.
    await page.locator('.home-army .army-fallback').first().evaluate(n => { n.textContent = 'Maester'; });
    check(await unbroken(page, '.home-army .army-fallback'), 'fallback piece names keep whole words');
    await shot(page, 'home-art');
  },
  async panel(page, context, check, size) {
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    const before = await saved(page), choices = await page.locator('.home-summary p').innerText();
    await page.locator('.home-summary button').click();
    await page.getByRole('radio', { name: 'Random', exact: true }).scrollIntoViewIfNeeded();
    check(await unbroken(page, '.side-choice [role="radio"]'), 'side labels keep each word on one line');
    const [w, h] = size.split('x').map(Number), panel = await page.locator('dialog[open]').boundingBox();
    check(w < 600 || panel.height <= h * .9 + 1, 'a wide panel uses at most 90 percent of the height');
    await shot(page, 'panel');
    await page.getByRole('radio', { name: 'Dark', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.waitForFunction(() => !history.state?.layer);
    check(await saved(page) === before && await page.locator('.home-summary p').innerText() === choices, 'Close keeps the save and choices');
    await shot(page, 'panel-closed');
  },
  async you(page, context, check) {
    await page.goto(`${NEXT}#you`); await page.waitForSelector('.you-page');
    check((await order(page)).join(',') === 'pieces,hand,coords,sound,motion', 'settings keep one order');
    check(await unbroken(page, '[data-setting="motion"] [role="radio"]'), 'Motion speed keeps each word on one line');
    check(await page.locator('[role="switch"]').evaluateAll(nodes => nodes.every(n => !n.hasAttribute('aria-describedby') && n.querySelectorAll('.kd-switch-copy > span').length === 0)), 'an empty switch description creates no empty note');
    const sound = page.getByRole('switch', { name: 'Sound', exact: true }); await sound.click();
    check(await sound.getAttribute('aria-checked') === 'true' && await sound.locator('.kd-switch-state').innerText() === 'On', 'the switch state word follows its value');
    check(await page.evaluate(() => {
      const scan = (rules, hover = false) => [...rules].every(rule => {
        const guarded = hover || rule.conditionText?.includes('(hover: hover)');
        if (rule.selectorText?.includes(':hover') && !hover) return false;
        return !rule.cssRules || scan(rule.cssRules, guarded);
      });
      return [...document.styleSheets].every(sheet => scan(sheet.cssRules));
    }), 'hover rules require a hover pointer');
    await shot(page, 'you');
  },
  async guide(page, context, check, size) {
    const w = Number(size.split('x')[0]);
    await page.goto(`${NEXT}#guide`); await page.waitForSelector('.guide-page'); await page.evaluate(() => document.fonts.ready);
    const width = await page.locator('.guide-page').evaluate(n => { const cs = getComputedStyle(n); return n.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); });
    check(width <= (w >= 900 ? 1120 : 640), 'the Guide content stays within its width class');
    await page.locator('[data-section="How a turn works"]').click(); await page.waitForTimeout(800);
    check(Math.max(...await lines(page, '.turn-steps p')) <= 70, 'turn text has at most 70 characters per line');
    await page.getByRole('button', { name: 'Back to Guide', exact: true }).click();
    await page.locator('[data-section="Pieces"]').click();
    await page.locator('.guide-row', { hasText: 'Knight' }).click();
    if (w >= 900) {
      check(await page.locator('nav.entry-list[aria-label="Pieces"]').count() === 1, 'the named entry list is navigation');
      check(await page.locator('.entry-list h2').count() === 0, 'the entry list has no heading before the page title');
    }
    await page.getByRole('button', { name: 'Back to Pieces', exact: true }).click();
    await page.waitForTimeout(800);
    check(await page.locator('.guide-row', { hasText: 'Knight' }).evaluate(n => { const r = n.getBoundingClientRect(); return document.activeElement === n && r.top >= 0 && r.bottom <= innerHeight - (innerWidth < 900 ? 56 : 0); }), 'Back restores the Knight row and its focus in view');
    await shot(page, 'guide-back');
    await page.getByRole('button', { name: 'Back to Guide', exact: true }).click();
    await page.locator('[data-section="Cards"]').click(); await page.locator('.guide-card').first().click(); await page.waitForTimeout(800);
    const measure = Math.max(...await lines(page, '.learn-rule, .learn-limits, .learn-against'));
    check(measure <= 70, `entry text has at most 70 characters per line (${measure})`);
    await shot(page, 'guide-entry');
  },
  async menu(page, context, check, size) {
    await page.goto(NEXT); await page.locator(MAIN).click(); await ready(page);
    const before = await saved(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    check((await order(page)).join(',') === 'pieces,hand,coords,sound,motion', 'settings keep one order');
    check(await page.locator('.menu-note').evaluate(n => parseFloat(getComputedStyle(n).fontSize) >= 14), 'the save note is at least 14 px');
    check(await page.locator('.menu-settings').evaluate(n => n.clientHeight >= 44), 'at least one whole setting row fits');
    check(await unbroken(page, '.menu-settings [role="radio"]'), 'Menu labels keep each word on one line');
    const [w, h] = size.split('x').map(Number), landscape = w > h;
    await page.evaluate(landscape => {
      for (const [edge, value] of Object.entries(landscape ? { top: 0, left: 59, right: 59, bottom: 21 } : { top: 59, right: 0, left: 0, bottom: 34 })) document.documentElement.style.setProperty(`--safe-${edge}`, `${value}px`);
      window.dispatchEvent(new Event('resize'));
    }, landscape);
    const rect = await page.locator('.play-game').boundingBox();
    check(rect.x >= (landscape ? 59 : 0) && rect.y >= (landscape ? 0 : 59) && rect.x + rect.width <= w - (landscape ? 59 : 0) + 1 && rect.y + rect.height <= h - (landscape ? 21 : 34) + 1, 'the game and Menu use the safe-area variables');
    await page.waitForTimeout(200); await shot(page, 'safe-menu');
    await page.getByRole('button', { name: 'Back to home', exact: true }).click(); await page.waitForSelector('.play-home');
    check(await saved(page) === before, 'an immediate Menu exit keeps the save');
    await page.locator(MAIN).click(); await ready(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Resign', exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).click();
    await page.waitForSelector('.play-result', { state: 'attached' });
    check(await page.locator('.play-result-actions .kd-button').evaluateAll(nodes => nodes.every(n => !getComputedStyle(n).textDecorationLine.includes('underline'))), 'result controls have no underline');
  },
  async rematch_art(page, context, check) {
    // Rematch must request a king still that the first game does not use.
    await context.addInitScript(() => localStorage.setItem('kingdown.setup', 'powers'));
    await page.goto(NEXT); await page.locator(MAIN).click(); await ready(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Resign', exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).click();
    await page.waitForSelector('.play-result', { state: 'attached' });
    await page.evaluate(() => {
      const used = JSON.parse(localStorage.getItem('kingdown.save')).rules.kings.map(k => k.king);
      const index = ['Frost', 'Flame', 'Stratus', 'Mud'].findIndex(king => !used.includes(king));
      Math.random = () => (index + .1) / 6;
    });
    let failed = 0; await context.route('**/ui/pieces/*.webp', r => { failed++; return r.abort(); });
    // The base result layout has no height at 667x375. This case tests the retained board callback only.
    const rematch = page.locator('.play-result-actions button').first();
    if (await rematch.isVisible()) await rematch.click(); else await rematch.evaluate(n => n.click());
    await page.waitForFunction(() => document.querySelector('.play-game')?.dataset.fault === 'art', null, { timeout: 4000 }).catch(() => {});
    check(failed > 0, 'the rematch asks for a new still');
    check(await page.locator('.play-fault').isVisible(), 'an art fault after Rematch shows Try again');
    await shot(page, 'rematch-art');
  },
};
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.MENUS_CASES && !process.env.MENUS_CASES.split(',').includes(name)) continue;
    const [width, height] = size.split('x').map(Number), context = await browser.newContext({ viewport: { width, height }, reducedMotion: name === 'guide' ? 'no-preference' : 'reduce' });
    const page = await context.newPage(), failures = [], errors = [];
    page.setDefaultTimeout(12000);
    const trapped = trapErrors(page);
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    const check = (ok, label) => { if (!ok) failures.push(label); };
    try { await run(page, context, check, size); } catch (e) { failures.push(String(e)); }
    // Only these fault cases deliberately abort requests. A page exception is never expected.
    if (!['code_fault', 'font_fault', 'home_art', 'rematch_art'].includes(name)) {
      try { assertNoErrors(trapped); } catch (e) { failures.push(String(e)); }
      check(errors.length === 0, `no console error: ${errors.join('; ')}`);
    } else check(!errors.some(e => !/Failed to load resource|Load failed|net::ERR_FAILED/.test(e)), `only blocked requests fail: ${errors.join('; ')}`);
    const result = { size, name, failures, errors }; results.push(result);
    console.log(`${failures.length ? 'FAIL' : 'PASS'} ${size} ${name} ${failures.join(' | ')}`);
    await context.close();
  }
} finally { await browser.close(); writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2)); }
process.exitCode = results.some(r => r.failures.length) ? 1 : 0;
