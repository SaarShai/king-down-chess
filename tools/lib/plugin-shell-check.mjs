import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { env, shot } from './checks.mjs';

// Keep the same samples for the stone and disabled-label render proofs.
export async function checkShell(browser, base) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: 'light' });
  const frame = page.frameLocator('iframe');
  let gameId;
  page.setDefaultTimeout(10_000);
  try {
    await page.goto(base);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await frame.locator('html').evaluate(() => document.fonts.ready);
    await frame.locator('[data-art]').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const grain = await frame.locator('#home-card button').evaluateAll(async buttons => {
      const image = new Image();
      image.src = getComputedStyle(buttons.find(button => !button.classList.contains('primary')), '::before').backgroundImage.match(/url\("?([^"\)]+)"?\)/)[1];
      await image.decode();
      return { pixels: image.naturalWidth, css: Math.max(384, ...buttons.map(button => button.getBoundingClientRect().width)) };
    });
    assert(grain.pixels >= 2 * grain.css, `Stone has two device pixels per CSS pixel: ${JSON.stringify(grain)}`);
    await shot(page, 'plugin-home-card-1280x800-light');
    await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: true } }));
    const created = await page.evaluate(() => window.harnessTool({ name: 'kingdown_create', arguments: {
      kind: 'solo', colour: 'white', options: { fairy: false, pool: ['R', 'B', 'N', 'Q'], classic: true, arrangement: false, cards: false, cardPool: [], kingPowers: false }
    } }));
    assert(!created.isError, JSON.stringify(created));
    gameId = created._meta.view.game_id;
    await page.evaluate(result => window.harnessShow(result), created);
    await page.setViewportSize({ width: 390, height: 844 });
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    await frame.locator('#board-menu:not(:disabled)').waitFor();
    await frame.locator('html').evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
    const bar = frame.locator('#table-bar');
    const colours = await bar.evaluate(bar => Object.fromEntries([...bar.querySelectorAll('button, svg, .line')].map(e => [e.id || `${e.closest('button').id}-${e.tagName}`, getComputedStyle(e).color])));
    const off = 'rgb(77, 69, 60)', soft = 'rgba(91, 80, 69, 0.75)';
    for (const id of ['undo', 'end-turn']) {
      assert.equal(await frame.locator(`#${id}`).getAttribute('aria-disabled'), 'true');
      assert.equal(colours[id], off, `${id} uses the recorded disabled label`);
      assert.equal(colours[`${id}-svg`], off, `${id} icon follows its label`);
    }
    assert.equal(await frame.locator('#end-turn svg').evaluate(e => getComputedStyle(e).fill), off, 'Sword fill follows currentColor');
    assert.equal(colours['board-menu'], 'rgb(43, 38, 33)', 'Enabled Menu keeps dark ink');
    const row = frame.locator('[data-screen="play"] [data-nav="profile"]');
    await row.evaluate(e => { e.disabled = true; });
    assert.equal(await row.locator('.line').evaluate(e => getComputedStyle(e).color), soft, 'Nested line text follows a native disabled button');
    assert.equal(await row.evaluate(e => {
      const span = document.createElement('span'); span.style.color = 'var(--fg-soft)'; e.append(span);
      const colour = getComputedStyle(span).color; span.remove(); return colour;
    }), soft, 'The soft foreground token follows a native disabled button');
    await row.evaluate(e => { e.disabled = false; });
    await writeFile(join(env('PLAYABLE_OUT'), 'plugin-shell-colours.json'), JSON.stringify(colours, null, 2) + '\n');
    await shot(page, 'plugin-board-bar-390x844-light', { clip: await bar.boundingBox() });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => {
      const view = { ...window.harnessView, game_id: crypto.randomUUID(), revision: 100, status: 'finished', action: 'done', result: { winner: 0, reason: 'checkmate' }, legal: [] };
      window.harnessNextView = view;
      return window.harnessShow({ content: [], structuredContent: { game_id: view.game_id }, _meta: { board_id: window.harnessWidgetState.privateContent.board_id, view } });
    });
    await frame.locator('#over.end-card[open]').waitFor();
    await frame.locator('#over').evaluate(async e => { await Promise.all(e.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))); });
    for (const [kind, label] of [['stone', 'New game'], ['red', 'Play again']]) {
      const button = frame.getByRole('button', { name: label, exact: true });
      const buffer = await button.screenshot(), meta = await sharp(buffer).metadata();
      await sharp(buffer).resize(meta.width * 4, meta.height * 4, { kernel: 'nearest' }).png()
        .toFile(join(env('PLAYABLE_OUT'), `plugin-${kind}-button-400pct-1280x800-light.png`));
    }
    console.log(`Shell render proof: ${JSON.stringify(colours)}`);
  } finally {
    if (gameId) assert((await page.request.post(new URL('/fixture-delete-match', base).href, { data: { game_id: gameId } })).ok());
    await page.close();
  }
}
