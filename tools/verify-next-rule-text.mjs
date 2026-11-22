// Rule text on the new page (rules-round page item 3): the New game power preview with Powers off shows the rules
// that the game uses, and the Guide entries of Death Touch, Freeze and Flight show the repaired lines at a phone
// and a desktop size, with no cut word and no sideways overflow. Unit tests hold the words; this check holds the page.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { releaseDriver } from './lib/release-browser.mjs';
const repo = fileURLToPath(new URL('../', import.meta.url));
const { outputFiles: [bundle] } = await build({
  stdin: { resolveDir: repo, contents: `export { POWERS_BALANCED, DEFAULT_RULES, BUILT } from './src/rules/engine.ts'; export { powerText, ruleLine } from './src/powers-ui.ts';` },
  bundle: true, platform: 'node', format: 'esm', write: false, loader: { '.svg': 'text', '.webp': 'text', '.png': 'text' },
});
const { POWERS_BALANCED, DEFAULT_RULES, BUILT, powerText, ruleLine } = await import('data:text/javascript;base64,' + Buffer.from(bundle.contents).toString('base64'));
const browser = await launch();
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href;
// Each word stays on one line, and nothing overflows sideways.
const whole = locator => locator.evaluate(node => {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode;
    for (const word of text.textContent.matchAll(/[^\s-]+/g)) {
      const range = document.createRange(); range.setStart(text, word.index); range.setEnd(text, word.index + word[0].length);
      if (new Set([...range.getClientRects()].filter(r => r.height && r.width).map(r => Math.round(r.top))).size > 1) return `split: ${word[0]}`;
    }
  }
  return node.scrollWidth <= node.clientWidth + 1 || `overflow: ${node.scrollWidth} > ${node.clientWidth}`;
});
async function open(width, height, type) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  await context.addInitScript(type => { localStorage.setItem('kingdown.solo-launch-seen', '1'); if (type) localStorage.setItem('kingdown.game-type', type); }, type);
  const page = await context.newPage(); trapErrors(page);
  return { page, context };
}
try {
  {
    // New game with Powers off: the power preview gives the line of the rules that a tap on a king turns on.
    const { page, context } = await open(390, 844, 'pieces');
    const driver = releaseDriver(page, NEXT);
    await driver.openHome(); await driver.openSoloSetup();
    await page.locator('.setup-feature-label', { hasText: 'Powers' }).click();
    const note = page.locator('dialog[open] .panel-note').last();
    await note.waitFor();
    const used = BUILT.map(id => ruleLine(powerText(id, { ...DEFAULT_RULES, ...POWERS_BALANCED })));
    assert.ok(used.includes(await note.innerText()), `the preview gives the rules of the game: ${await note.innerText()}`);
    assert.equal(await page.locator('dialog[open]').getByText('Select a king to turn Powers on.').count(), 1, 'Powers stay off');
    await note.scrollIntoViewIfNeeded(); await page.waitForTimeout(800); await shot(page, 'new-game-powers-off-390');
    await context.close();
  }
  for (const [width, height] of [[390, 844], [1280, 800]]) {
    const { page, context } = await open(width, height);
    for (const [name, line] of [['Death Touch', 'The reach can give check.'], ['Freeze', 'If the piece moves, the mark moves with it.'], ['Flight', 'Move any of your pieces except the king']]) {
      await page.goto(NEXT + '#guide');
      await page.locator('[data-section="Kings and powers"]').click();
      await page.locator('.guide-page button', { hasText: name }).first().click();
      const panel = page.locator('.learn-panel');
      await panel.waitFor();
      assert.match(await panel.innerText(), new RegExp(line), `${name}: the Guide gives the repaired line`);
      await page.waitForTimeout(300);
      assert.equal(await whole(panel), true, `${name} at ${width}: words stay whole and the panel fits`);
      await panel.locator('.learn-limits').scrollIntoViewIfNeeded();
      await shot(page, `guide-${name.toLowerCase().replace(' ', '-')}-${width}`);
    }
    await context.close();
  }
  assertNoErrors();
  console.log('ok next-rule-text: the Powers-off preview gives the rules of the game; Death Touch, Freeze and Flight Guide entries give the repaired lines with whole words at 390 and 1280');
} finally {
  await browser.close();
}
