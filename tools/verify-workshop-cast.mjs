// Workshop cast check: every figure of the cast list in the New piece screen, the gallery, both armies,
// the filter, Undo, save and reload, share and Try it. Run it with `npm run check:browser workshop-cast`.
// It reads its server, channel and output folder from the shared check module (tools/lib/checks.mjs).
// Image paths are compared with imageIs, so the check passes on the dev server and on the preview server.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pressMenu, workshopCopyLink } from './app-ui.mjs';
import { assertNoErrors, env, imageIs, launch, shot, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const cast = JSON.parse(readFileSync(new URL('../docs/visual-design/workshop/cast.json', import.meta.url), 'utf8'));
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0]);
const fig = '.ws-piece-card .ws-fig';
const art = (id, army) => `ui/workshop/${id}-${army}.webp`;
const armyTwo = page => page.locator('.ws-army label').filter({ has: page.locator('input[value="1"]') });

/** Waits until the game view is ready. */
async function ready(page) {
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
}

/** Opens the game at `url` and waits until the view is ready. */
async function open(page, url) {
  await page.goto(url);
  await ready(page);
}

/** Opens the Workshop and its first saved design. */
async function openFirstDesign(page) {
  await pressMenu(page, 'Workshop');
  await page.click('.ws-tile');
}

/** New piece: one choice per cast figure, and no preset, Mix or Surprise control. */
async function newPieceScreen(page, width) {
  await pressMenu(page, 'Workshop');
  await page.click('[data-door="piece"]');
  assert.equal(await page.locator('[data-new-figure]').count(), cast.length, 'one New piece choice per cast figure');
  assert.equal(await page.locator('[data-key], .ws-mix, .ws-surprise').count(), 0, 'no preset, Mix or Surprise in New piece');
  await page.waitForLoadState('networkidle');
  await shot(page, `${width}-new-piece`);
}

/** A new design from a figure is blank, has that figure and its name. */
async function blankDesign(page) {
  await page.click('[data-new-figure="owl-archivist"]');
  const blank = await saved(page);
  assert.deepEqual([blank.squares, blank.lines, blank.rules], [[], [], []], 'a new design has no squares, lines or rules');
  assert.equal(blank.look.figure, 'owl-archivist', 'a new design has the chosen figure');
  assert.equal(blank.name, 'Owl Archivist', 'a new design has the figure name');
}

/** After a reload, the saved design opens with its figure. */
async function reloadKeepsFigure(page) {
  await page.reload();
  await ready(page);
  await openFirstDesign(page);
  await imageIs(page, fig, art('owl-archivist', 'w'));
}

/** The gallery holds the whole cast; each choice shows its figure and keeps the gallery open. */
async function galleryChoices(page) {
  await page.click('.ws-board[data-action="move"] .ws-cell[data-x="1"][data-y="2"]');
  await page.click('.ws-eye');
  await page.click('.ws-gallery summary');
  assert.equal(await page.locator('.ws-gallery [data-figure]').count(), cast.length, 'one gallery choice per cast figure');
  for (const f of cast) {
    await page.click(`.ws-gallery [data-figure="${f.id}"]`);
    await imageIs(page, fig, art(f.id, 'w'));
    assert.equal(await page.locator('.ws-gallery').evaluate(e => e.open), true, `the gallery stays open after ${f.id}`);
  }
}

/** The filter hides figures; the second army and Undo change the picture. */
async function filterArmyUndo(page) {
  await page.selectOption('.ws-figure-filter select', 'Strong');
  assert.ok(await page.locator('.ws-gallery [data-figure]:visible').count() < cast.length, 'the Strong filter hides figures');
  await page.click('.ws-gallery [data-figure="clay-golem"]');
  await armyTwo(page).click();
  await imageIs(page, fig, art('clay-golem', 'b'));
  await page.click('.ws-undo');
  await imageIs(page, fig, art('clay-golem', 'w'));
  await armyTwo(page).click();
  await page.selectOption('.ws-figure-filter select', 'All');
}

/** Both army files of every cast figure load, also the figures outside the visible scroll area. */
async function allArtLoads(page, width) {
  const files = cast.flatMap(f => [art(f.id, 'w'), art(f.id, 'b')]);
  const loaded = await page.evaluate(paths => Promise.all(paths.map(path => new Promise(resolve => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth > 0);
    im.onerror = () => resolve(false);
    im.src = new URL(path, document.baseURI).href;
  }))), files);
  assert.deepEqual(files.filter((_, i) => !loaded[i]), [], 'every army file of the cast loads');
  await page.locator('.ws-gallery summary').scrollIntoViewIfNeeded();
  await shot(page, `${width}-gallery`);
}

/** Try it shows the figure of the first army; the share link and the saved design keep the second army. */
async function shareTryReload(page, width) {
  await page.click('.ws-eye');
  await page.click('.ws-share');
  await workshopCopyLink(page).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.click('.ws-try');
  await page.waitForSelector('.tb-me');
  await imageIs(page, '.tb-me', art('clay-golem', 'w'));
  await page.waitForLoadState('networkidle');
  await shot(page, `${width}-try`);
  await page.goto(link);
  await page.waitForSelector('.ws-piece-card');
  await imageIs(page, fig, art('clay-golem', 'b'));
  await shot(page, `${width}-card`);
  await open(page, base);
  await openFirstDesign(page);
  await imageIs(page, fig, art('clay-golem', 'b'));
}

const browser = await launch();
try {
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const errors = trapErrors(page);
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    await open(page, base);
    await newPieceScreen(page, width);
    await blankDesign(page);
    await reloadKeepsFigure(page);
    await galleryChoices(page);
    await filterArmyUndo(page);
    await allArtLoads(page, width);
    await shareTryReload(page, width);
    assertNoErrors(errors);
    console.log(`ok ${width}: all ${cast.length} choices, both armies, filters, undo, save/reload, share and Try it`);
    await ctx.close();
  }
  assertNoErrors();
} finally {
  await browser.close();
}
console.log(`Screens: ${env('PLAYABLE_OUT')}`);
