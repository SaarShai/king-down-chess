// Workshop cast check: every figure of the cast list through More of a new piece (NEW), both armies, the filter,
// Undo, save and reload, and share. Run it with `npm run check:browser workshop-cast`.
// It reads its server, channel and output folder from the shared check module (tools/lib/checks.mjs).
// Image paths are compared with imageIs, so the check passes on the dev server and on the preview server.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pressMenu, workshopCopyLink } from './app-ui.mjs';
import { assertNoErrors, env, imageIs, launch, shot, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const cast = JSON.parse(readFileSync(new URL('../docs/visual-design/workshop/cast.json', import.meta.url), 'utf8'));
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0]);
const fig = '.pg-figure img';
const sheet = '.pg-sheet[open]';
const art = (id, army) => `ui/workshop/${id}-${army}.webp`;
const charcoal = page => page.click(`${sheet} .pg-army label:has-text("Charcoal")`);

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
  await page.click('.slot[data-design]');
}

/** Opens the Look sheet: More in the look row on the desktop, Look in ⋯ on the phone. */
async function looks(page, phone) {
  if (phone) { await page.click('[data-act="more"]'); await page.click('.pg-morepop [data-act="looks"]'); }
  else await page.click('.pg-lookmore');
  await page.locator(sheet).waitFor();
}

/** NEW, a paint on c6 (a piece with no move has no Share, and the phone's ⋯ shows after the first change), then More: one choice per cast figure. */
async function newPieceScreen(page, width, phone) {
  await pressMenu(page, 'Workshop');
  await page.click('.newtile');
  await page.click('.sq[data-sq="c6"]');
  await looks(page, phone);
  assert.equal(await page.locator(`${sheet} .pg-fig`).count(), cast.length, 'one New piece choice per cast figure');
  await page.waitForLoadState('networkidle');
  await shot(page, `${width}-new-piece`);
}

/** A new design from a figure has only its paint (c6 and its mirror e6), no lines and no rules, and has that figure. */
async function blankDesign(page) {
  await page.click(`${sheet} [data-figure="owl-archivist"]`);
  const blank = await saved(page);
  assert.deepEqual([blank.squares.length, blank.lines, blank.rules], [2, [], []], 'a new design has only its paint, no lines and no rules');
  assert.equal(blank.look.figure, 'owl-archivist', 'a new design has the chosen figure');
}

/** After a reload, the saved design opens with its figure. */
async function reloadKeepsFigure(page) {
  await page.reload();
  await ready(page);
  await openFirstDesign(page);
  await imageIs(page, fig, art('owl-archivist', 'w'));
}

/** More holds the whole cast; each choice shows its figure and keeps the sheet open. */
async function galleryChoices(page, phone) {
  await looks(page, phone);
  assert.equal(await page.locator(`${sheet} [data-figure]`).count(), cast.length, 'one choice per cast figure');
  for (const f of cast) {
    await page.click(`${sheet} [data-figure="${f.id}"]`);
    await imageIs(page, fig, art(f.id, 'w'));
    assert.equal(await page.locator(sheet).count(), 1, `the sheet stays open after ${f.id}`);
  }
}

/** The filter hides figures; the second army and Undo (once the sheet is closed) change the picture. */
async function filterArmyUndo(page, phone) {
  await page.selectOption(`${sheet} [data-tag]`, 'Strong');
  assert.ok(await page.locator(`${sheet} [data-figure]`).count() < cast.length, 'the Strong filter hides figures');
  await page.click(`${sheet} [data-figure="clay-golem"]`);
  await charcoal(page);
  await imageIs(page, fig, art('clay-golem', 'b'));
  await page.keyboard.press('Escape');
  await page.locator('.pg-sheet').waitFor({ state: 'detached', timeout: 2000 });
  await page.keyboard.press('ControlOrMeta+z');
  await imageIs(page, fig, art('clay-golem', 'w'));
  await looks(page, phone);
  await charcoal(page);
  await page.selectOption(`${sheet} [data-tag]`, 'All');
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
  await page.locator(`${sheet} [data-figure]`).last().scrollIntoViewIfNeeded();
  await shot(page, `${width}-gallery`);
}

/** The Share card, the share link and the saved design keep the second army. */
async function shareReload(page, width, phone) {
  await page.keyboard.press('Escape');
  await page.locator('.pg-sheet').waitFor({ state: 'detached', timeout: 2000 });
  if (phone) { await page.click('[data-act="more"]'); await page.click('.pg-morepop [data-act="share"]'); }
  else await page.click('.pg-share');
  await page.locator(`${sheet} .pg-face`).waitFor();
  await imageIs(page, `${sheet} .pg-face .cart img`, art('clay-golem', 'b'));
  await workshopCopyLink(page).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(link);
  await page.waitForSelector(`${sheet} .pg-face`);
  await imageIs(page, `${sheet} .pg-face .cart img`, art('clay-golem', 'b'));
  await shot(page, `${width}-card`);
  await open(page, base);
  await openFirstDesign(page);
  await imageIs(page, fig, art('clay-golem', 'b'));
}

const browser = await launch();
try {
  for (const width of [390, 1280]) {
    const phone = width < 1000;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const errors = trapErrors(page);
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    await open(page, base);
    await newPieceScreen(page, width, phone);
    await blankDesign(page);
    await reloadKeepsFigure(page);
    await galleryChoices(page, phone);
    await filterArmyUndo(page, phone);
    await allArtLoads(page, width);
    await shareReload(page, width, phone);
    assertNoErrors(errors);
    console.log(`ok ${width}: all ${cast.length} choices, both armies, filters, undo, save/reload and share`);
    await ctx.close();
  }
  assertNoErrors();
} finally {
  await browser.close();
}
console.log(`Screens: ${env('PLAYABLE_OUT')}`);
