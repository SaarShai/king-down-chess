import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { answerCheckHost, env, noRunningAnimations, noSidewaysScroll } from '../../../tools/lib/checks.mjs';
import { pressMenu } from '../../../tools/app-ui.mjs';

const browser = await chromium.launch({ headless: true });
const results = [], errors = [], external = [];
await mkdir(env('PLAYABLE_OUT'), { recursive: true });
const capture = async (page, name) => { await settled(page); const { width, height } = page.viewportSize(); await page.screenshot({ path: `${env('PLAYABLE_OUT')}/${width}x${height}-${name}.png` }); };
const ready = async page => {
  await page.waitForFunction(() => !!window.view?.ready);
  await page.evaluate(async () => { await window.view.ready(); await document.fonts.ready; });
};
const settled = page => page.evaluate(async () => {
  await Promise.all(document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished.catch(() => {})));
  await Promise.all([...document.images].filter(i => i.checkVisibility() && i.getAttribute('src')).map(i => i.decode()));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
});
const rect = (page, selector) => page.locator(selector).boundingBox();
const fit = async (page, selector, height) => { const r = await rect(page, selector); assert.ok(r && r.y >= 0 && r.y + r.height <= height + 1, selector); return r; };
const tap = async (page, square) => { const p = await page.evaluate(s => window.view.screenOf(s), square); await page.mouse.click(p.x, p.y); await settled(page); };
const enlarge = page => page.evaluate(() => {
  const values = [...document.querySelectorAll('#game-table, #game-table *')].map(e => [e, getComputedStyle(e).fontSize]);
  for (const [e, size] of values) e.style.fontSize = `${2 * parseFloat(size)}px`;
});
const largeText = async (page, check) => {
  await page.evaluate(() => {
    window.originalFonts = [...document.querySelectorAll('body, body *')].map(e => [e, e.style.fontSize, getComputedStyle(e).fontSize]);
    for (const [e, , size] of window.originalFonts) e.style.fontSize = `${2 * parseFloat(size)}px`;
  });
  await settled(page);
  try { await check(); } finally {
    await page.evaluate(() => { for (const [e, size] of window.originalFonts) e.style.fontSize = size; delete window.originalFonts; });
    await settled(page);
  }
};
const textFits = async (page, selector) => {
  const faults = await page.locator(selector).evaluateAll(elements => elements.filter(e => e.checkVisibility()).flatMap(e => {
    const range = new Range(); range.selectNodeContents(e);
    const box = e.getBoundingClientRect(), text = range.getBoundingClientRect();
    return text.left < box.left - 1 || text.right > box.right + 1 ? [e.textContent] : [];
  }));
  assert.deepEqual(faults, [], `${selector}: text stays inside its box`);
};
const target24 = async (page, selector) => {
  await page.locator(selector).scrollIntoViewIfNeeded();
  assert.ok(await page.locator(selector).evaluate(e => {
    const r = e.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
    return [-11.5, 11.5].every(dy => e.contains(document.elementFromPoint(x, y + dy)));
  }), `${selector}: the hit area is at least 24 px high`);
};
const fixture = 'fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR%20w%20-%20-%200%201&players=human,human&title=0';
try {
  for (const [width, height] of [[320,568],[375,812],[852,393],[768,1024],[1280,800]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const u = new URL(route.request().url());
      if (['data:', 'blob:'].includes(u.protocol) || ['localhost','127.0.0.1'].includes(u.hostname)) return route.continue();
      external.push(u.origin); return route.abort();
    });
    await answerCheckHost(context);
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(env('PLAYABLE_URL')); await ready(page); await settled(page);
    const names = await page.locator('.title-lineup li').evaluateAll(items => items.map(item => {
      const text = item.querySelector('span'), box = text.getBoundingClientRect();
      return { size: parseFloat(getComputedStyle(text).fontSize), left: box.left, right: box.right, top: box.top };
    }));
    assert.ok(names.every(n => n.size >= 11 && n.left >= -1 && n.right <= width + 1), 'Title names stay on screen at 11 px');
    assert.ok(names.slice(1).every((n, i) => Math.abs(n.top - names[i].top) >= 4 || n.left >= names[i].right - .5), 'Title names stay clear of each other');
    await capture(page, 'title');
    await largeText(page, async () => { await textFits(page, '.title-lineup li > span'); await capture(page, 'title-large'); });
    await page.locator('#title-start').click(); await ready(page); await settled(page);
    assert.equal(await page.locator('#context-text').innerText(), 'Your move.\nTap a piece to read.');
    assert.equal(await page.locator('#first-lesson, #title-learn, #title-workshop, #workshop-btn, #extra-row, #share').count(), 0, 'Parked entry points stay absent');
    await capture(page, 'first-board');
    await pressMenu(page, 'New game');
    assert.equal(await page.locator('#mode-two, #two-powers').count(), 0);
    assert.equal(await page.locator('#design-row, #design-line').count(), 0, 'Bring a design stays parked');
    assert.deepEqual(await page.locator('input[name=army]').evaluateAll(inputs => inputs.map(e => e.value)), ['random', 'classic']);
    assert.equal(await page.getByRole('group', { name: 'Who you play', exact: true }).count(), 1);
    assert.equal(await page.getByRole('link', { name: 'A friend Online', exact: true }).count(), 1);
    await page.getByRole('radio', { name: 'No powers', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('radio', { name: "Kings' powers", exact: true }).isChecked(), true);
    assert.equal(await page.locator('#mode-powers').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('label:has(#mode-powers)').evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
    await noRunningAnimations(page, '#new-game');
    await noSidewaysScroll(page);
    assert.match(await page.locator('#new-game-summary').innerText(), /Random army\nWhite: Holy Light.\nBlack: Death Touch./);
    await fit(page, '#new-game-summary', height); await fit(page, '#start-game', height);
    assert.equal(await page.locator('#new-game-friend').getAttribute('href'), '/play/friend');
    await capture(page, 'new-game');
    await page.locator('#start-game').click(); await ready(page);
    assert.ok(!(await page.locator('#context-text').innerText()).includes('Tap a piece to read.'));
    await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page); await settled(page);
    const labels = await page.locator('#board canvas').evaluate(canvas => {
      const ctx = canvas.getContext('2d'), scale = canvas.width / 960;
      return Array.from({ length: 8 }, (_, i) => [[15, 64 + 32 + (i + .5) * 112], [32 + (i + .5) * 112, 64 + 944]])
        .flat().map(([x, y]) => {
          const data = ctx.getImageData(Math.round((x - 10) * scale), Math.round((y - 7) * scale), Math.round(20 * scale), Math.round(14 * scale)).data;
          let ink = 0, parchment = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 43 && data[i + 1] === 38 && data[i + 2] === 33) ink++;
            if (data[i] === 243 && data[i + 1] === 234 && data[i + 2] === 215) parchment++;
          }
          return { ink, parchment };
        });
    });
    assert.ok(labels.every(label => label.ink > 0 && label.parchment > 10), 'All 16 coordinates use dark ink on plain parchment');
    await capture(page, 'coordinates');
    await pressMenu(page, 'Guide'); await settled(page);
    assert.equal(await page.locator('.lesson-shelf, #lesson-progress, #next-lesson').count(), 0, 'The lesson shelf stays parked');
    assert.equal(await page.locator('.pc-art').first().evaluate(e => getComputedStyle(e).height), width < 600 ? '100px' : '128px', 'Guide figures keep their full size');
    await capture(page, 'guide');
    if ([852,1280].includes(width)) {
      const lengths = await page.locator('#rules-notation').evaluate(e => {
        const lines = {}, text = e.firstChild;
        for (let i = 0; i < text.length; i++) { const r = new Range(); r.setStart(text,i); r.setEnd(text,i+1); const y = r.getBoundingClientRect().y; lines[y] = (lines[y] ?? 0) + 1; }
        return Object.values(lines);
      });
      assert.ok(Math.max(...lengths) <= 80, `Notation line: ${Math.max(...lengths)}`);
      results.push({ size: `${width}x${height}`, notation: Math.max(...lengths) });
    }
    await largeText(page, async () => { await textFits(page, '.piece-card h3'); await capture(page, 'guide-large'); });
    await page.keyboard.press('Escape');
    if (width === 320) {
      await pressMenu(page, 'Settings'); await settled(page);
      const title = await rect(page, '#menu-title'), close = await rect(page, '#menu-close');
      assert.ok(title.x + title.width <= close.x - 7, 'Board help keeps a gap');
      assert.equal(await page.getByRole('button', { name: 'Back to Menu', exact: true }).count(), 1);
      assert.equal(await page.locator('#menu-back .back-label').isVisible(), false);
      await capture(page, 'board-help');
      await page.locator('#menu-back').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#menu-title').innerText(), 'Menu');
      await page.locator('#menu-close').click();
    }
    if (width < 400 || width === 852) {
      await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page); await tap(page, 52);
      const spacing = await page.locator('#context-text > span + span').evaluate(e => parseFloat(getComputedStyle(e).lineHeight));
      assert.ok(spacing >= 19.5); await fit(page, '#context-line', height);
      await capture(page, 'piece-text');
    }
    if (width < 400) {
      await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page);
      await tap(page,12); await tap(page,28); await enlarge(page); await settled(page);
      const moves = await rect(page, '#moves-line'), words = await rect(page, '#last-move'), bar = await fit(page, '#table-bar', height);
      assert.ok(moves.height > 48 && words.y + words.height <= moves.y + moves.height && moves.y + moves.height <= bar.y + 1);
      await capture(page, 'moves-large');
      results.push({ size: `${width}x${height}`, enlargedMovesHeight: moves.height });
    }
    if (width === 375) {
      const friend = await context.newPage();
      await friend.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(friend);
      await pressMenu(friend, 'New game');
      await friend.getByRole('link', { name: 'A friend Online', exact: true }).focus();
      await friend.keyboard.press('Enter');
      await friend.waitForURL('**/play/friend');
      await friend.locator('.account-entry').waitFor({ state: 'visible' });
      assert.equal(await friend.locator('#new-game').count(), 0, 'A friend leaves local setup');
      await friend.close();
    }
    await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page);
    await pressMenu(page, 'Settings');
    await largeText(page, async () => {
      await textFits(page, '#menu-title');
      const title = await rect(page, '#menu-title'), close = await rect(page, '#menu-close');
      assert.ok(title.x + title.width <= close.x, 'Board help stays clear of Close');
      await capture(page, 'board-help-large');
    });
    await page.locator('#menu-close').click();
    if (width === 852) {
      await tap(page, 52);
      const rowsFit = async () => {
        const line = await rect(page, '.context-scroll'), moves = await rect(page, '#moves-line'), bar = await fit(page, '#table-bar', height);
        assert.ok(line.y + line.height <= moves.y + 1 && moves.y + moves.height <= bar.y + 1, 'Text, Moves, and actions stay apart');
        for (const button of await page.locator('#table-bar > button:visible').all()) {
          const r = await button.boundingBox();
          assert.ok(r.y >= bar.y - 1 && r.y + r.height <= height, 'Each action stays inside the bar');
        }
      };
      await largeText(page, async () => { await rowsFit(); await capture(page, 'piece-text-large'); });
    }
    await page.goto(`${env('PLAYABLE_URL')}play/friend`);
    await page.locator('.account-entry a').waitFor();
    await page.waitForFunction(() => !document.querySelector('.account-entry')?.textContent.includes('Loading'));
    await settled(page);
    await target24(page, '.account-entry a');
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  await writeFile(`${env('PLAYABLE_OUT')}/measurements.json`, JSON.stringify(results, null, 2));
  console.log('All kept UI fixes and parked entry checks pass.', JSON.stringify(results));
} finally { await browser.close(); }
