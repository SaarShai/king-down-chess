// Sky Lift on the new page (src/interface/play/turn.ts, rules-round page item 1): with the card armed, a tap on
// either piece of a legal pair selects it and marks its partner, and the second tap stages the one engine action.
// Mouse at 1280x800 and touch at 390x844, both tap orders, and Mirror played as Sky Lift. Unit tests cannot tap.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { releaseDriver, text } from './lib/release-browser.mjs';
const repo = fileURLToPath(new URL('../', import.meta.url));
const { outputFiles: [bundle] } = await build({ stdin: { resolveDir: repo, contents: `export { POWERS_BALANCED } from './src/rules/rules.ts';` }, bundle: true, platform: 'node', format: 'esm', write: false });
const { POWERS_BALANCED } = await import('data:text/javascript;base64,' + Buffer.from(bundle.contents).toString('base64'));
const browser = await launch();
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href;
const hand = ['SkyLift', 'MirrorB', 'Rally', 'March'];
// A game with cards after 1. e4 e5: the person moves. Knight b1 and Bishop c1 are a Sky Lift pair (the engine lists it from b1).
const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', coords: true, link: null, daily: null, resigned: null, rules: { ...POWERS_BALANCED, kings: [null, null], hands: [hand, hand] } };
const B1 = 1, C1 = 2;
async function open(touch) {
  const context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 800 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
  await context.addInitScript(save => {
    localStorage.setItem('kingdown.solo-launch-seen', '1');
    if (!sessionStorage.getItem('seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(save)); sessionStorage.setItem('seeded', '1'); }
  }, save);
  const page = await context.newPage(); trapErrors(page);
  const driver = releaseDriver(page, NEXT);
  await driver.openHome(); await driver.continueGame();
  await page.waitForFunction(ready => document.body.dataset.page === 'game' && document.querySelector('.play-state')?.textContent === ready, text.ready);
  return { page, context };
}
const tapAt = async (page, touch, locator) => {
  const box = await locator.boundingBox();
  if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
const cell = (page, square) => page.locator(`.play-square[data-square="${square}"]`);
const lastSaved = page => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('kingdown.save')); return { moves: s.moves, staged: s.staged ?? 0 }; });
try {
  for (const touch of [true, false]) {
    const { page, context } = await open(touch);
    const staged = [];
    for (const card of ['Sky Lift', 'Mirror']) for (const [first, second] of [[B1, C1], [C1, B1]]) {
      const label = `${touch ? 'touch' : 'mouse'} ${card} ${first === B1 ? 'b1' : 'c1'} first`;
      await tapAt(page, touch, page.locator('.play-hand .play-card', { hasText: card.split(' ')[0] }));
      await tapAt(page, touch, cell(page, first));
      if (touch && card === 'Sky Lift' && first === C1) await shot(page, 'skylift-c1-first-390');
      assert.match(await cell(page, second).getAttribute('aria-description') ?? '', /Possible result:/, `${label}: the partner is a marked target`);
      await tapAt(page, touch, cell(page, second));
      const now = await lastSaved(page);
      assert.equal(now.staged, 1, `${label}: the second tap stages one action`);
      staged.push(now.moves.at(-1));
      await page.getByRole('button', { name: text.undo, exact: true }).click();
      assert.equal((await lastSaved(page)).staged, 0, `${label}: Undo removes the step`);
    }
    assert.equal(staged[0], staged[1], 'Sky Lift: both tap orders store one action');
    assert.equal(staged[2], staged[3], 'Mirror as Sky Lift: both tap orders store one action');
    await context.close();
  }
  assertNoErrors();
  console.log('ok next-skylift: either piece first selects the pair, marks the partner and stages one stored action; mouse and touch; Sky Lift and Mirror');
} finally {
  await browser.close();
}
