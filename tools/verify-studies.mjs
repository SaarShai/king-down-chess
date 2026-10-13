// Real study actions, declared results, local versions and atomic imports at desktop and phone sizes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, insideViewport, launch, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';

const browser = await launch();
const panel = '.study-panel[open]';
const comparable = doc => { const copy = structuredClone(doc), s = studyOf(copy); delete s.id; delete s.version; delete s.parentVersion; return copy; };
const studyOf = doc => doc.schema === 'kingdown-test/1' ? doc.study : doc;
const state = p => p.locator('#study .study-state').textContent();
const saved = p => p.evaluate(() => localStorage.getItem('kingdown.studies'));
async function idle(p) { await p.waitForFunction(() => !document.querySelector('#study').hasAttribute('aria-busy')); }
async function closePanel(p) { await p.locator(`${panel} header button`).click(); }
async function more(p, act) {
  await p.click('#study > .study-strip [data-study="more"]');
  await p.click(`${panel} [data-study="${act}"]`);
}
async function openStudy(p) {
  await pressMenu(p, 'Workshop');
  await p.click('#workshop [data-act="more"]');
  await p.click('#workshop [data-act="studies"]');
  await p.waitForSelector('#study[data-ready="true"]');
  await idle(p);
}
async function exportDoc(p) {
  const download = p.waitForEvent('download');
  await more(p, 'export');
  const doc = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  await closePanel(p);
  return doc;
}
async function save(p, title) {
  await p.click('#study [data-study="save"]');
  await p.locator(`${panel} [name="title"]`).fill(title);
  await p.locator(`${panel} button[type="submit"]`).click();
  await idle(p);
}
async function importDoc(p, doc) {
  await p.locator('#study .study-import').setInputFiles({ name: 'study.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await idle(p);
}
async function square(p, file, rank, touch = false) {
  const b = await p.locator('#study .study-board canvas').boundingBox();
  const x = b.x + (32 + (file + .5) * 112) / 960 * b.width;
  const y = b.y + (64 + 32 + (7 - rank + .5) * 112) / 1024 * b.height;
  await (touch ? p.touchscreen.tap(x, y) : p.mouse.click(x, y));
  await idle(p);
}
async function runChecks(p) {
  await p.click('#study [data-study="test"]');
  await p.click(`${panel} [data-run]`);
  await idle(p);
}
try {
  for (const [width, height] of [[1440, 900], [390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 721 });
    await context.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    const p = await context.newPage(); trapErrors(p);
    await p.goto(env('PLAYABLE_URL'));
    await p.waitForFunction(() => window.view?.ready);
    await p.evaluate(() => window.view.ready());
    await p.waitForFunction(() => localStorage.getItem('kingdown.sync') !== null);
    const live = await p.evaluate(() => ({ board: JSON.stringify(window.view.pos), storage: Object.fromEntries(Object.entries(localStorage)) }));
    await openStudy(p);
    const tryBoard = await p.locator('#workshop .pg-board').innerHTML();
    assert.match(await state(p), /White to act.*0 recorded actions/, 'default control starts before all actions');
    await insideViewport(p, '#study .study-board canvas');
    await insideViewport(p, '#study .study-strip');
    await noSidewaysScroll(p);
    await shot(p, `studies-${width}x${height}`);
    const control = await exportDoc(p);
    assert.equal(control.checks.length, 6, 'default control keeps its six before-action assertions');
    assert.deepEqual(studyOf(control).actions, []);
    await runChecks(p);
    assert.match(await p.locator(panel).textContent(), /passed · 6 of 6 checks pass/, 'real declared assertions pass');
    await closePanel(p);
    if (width === 1440) {
      await p.locator('#study .study-board').focus();
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await idle(p);
    } else await square(p, 4, 3, true);
    assert.match(await state(p), /Black to act.*1 recorded actions/, 'keyboard or touch plays a full action');
    let played = await exportDoc(p);
    assert.deepEqual(studyOf(played).actions, ['Td4-e4']);
    await p.click('#study [data-study="undo"]'); await idle(p);
    assert.match(await state(p), /White to act.*0 recorded actions/, 'Undo restores turn and action history');
    await p.click('#study [data-study="actions"]');
    const actions = await p.locator(`${panel} [data-move]`).allTextContents();
    assert(actions.includes('Td4xf4') && actions.includes('Td4-e4'), 'all legal actions include capture and quiet movement');
    assert(!actions.includes('Td4-g4'), 'blocked action is absent');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^Td4xf4$/ }).click(); await idle(p);
    assert.deepEqual(studyOf(await exportDoc(p)).actions, ['Td4xf4'], 'chooser plays the complete capture');
    await p.click('#study [data-study="undo"]'); await idle(p);
    await save(p, `Saved control ${width}`);
    const box = JSON.parse(await saved(p));
    assert.equal(box.version, 1); assert.equal(box.documents.length, 1);
    assert.equal(studyOf(box.documents[0]).title, `Saved control ${width}`);
    await save(p, `Saved control ${width}`);
    assert.equal(JSON.parse(await saved(p)).documents.length, 1, 'unchanged Save does not add a version');
    await p.reload(); await p.waitForFunction(() => window.view?.ready); await openStudy(p);
    await more(p, 'open');
    await p.locator(`${panel} [data-open]`).filter({ hasText: `Saved · Saved control ${width} · version 1` }).click(); await idle(p);
    assert.match(await p.locator('.study-label').textContent(), new RegExp(`Saved control ${width} · saved`), 'saved version survives reload and opens');
    await p.click('#study [data-study="test"]');
    await p.locator(`${panel} [name="lan"]`).fill('Td4-e4');
    await p.locator(`${panel} [name="expected"]`).selectOption('no');
    await p.locator(`${panel} button[type="submit"]`).click(); await idle(p);
    await p.click(`${panel} [data-run]`); await idle(p);
    assert.match(await p.locator(panel).textContent(), /failed · 6 of 7 checks pass/, 'a false declaration yields a real failed result');
    await closePanel(p);
    await save(p, `Saved control ${width}`);
    assert.deepEqual(JSON.parse(await saved(p)).documents.filter(d => studyOf(d).id === studyOf(box.documents[0]).id).map(d => studyOf(d).version), [1, 2], 'edit saves a new version');
    const before = await exportDoc(p), beforeStore = await saved(p), beforeState = await state(p);
    const chooser = p.waitForEvent('filechooser');
    await more(p, 'import');
    await (await chooser).setFiles({ name: 'study.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) });
    await idle(p);
    assert.deepEqual(comparable(await exportDoc(p)), comparable(before), 'valid export imports without changed content');
    for (const corrupt of [ { ...before, schema: 'bad' }, (() => { const d = structuredClone(before); studyOf(d).engine = 'wrong-source'; return d; })(), (() => { const d = structuredClone(before); studyOf(d).actions = ['Td4-g4']; return d; })() ]) {
      await p.click('#study > .study-strip [data-study="more"]');
      await importDoc(p, corrupt);
      assert(await p.locator(`${panel} .study-panel-alert`).isVisible(), 'invalid import reveals its error inside the active panel');
      await closePanel(p);
      assert(await p.locator('#study > .study-alert').isVisible(), 'invalid import reports its error');
      assert.equal(await state(p), beforeState, 'invalid import leaves position intact');
      assert.equal(await saved(p), beforeStore, 'invalid import leaves saved versions intact');
      assert.deepEqual(comparable(await exportDoc(p)), comparable(before), 'invalid import leaves current document intact');
    }
    await p.evaluate(() => {
      const original = Storage.prototype.setItem;
      window.restoreStudyStorage = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function(key, value) { if (key === 'kingdown.studies') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, key, value); };
    });
    await save(p, 'Quota draft');
    assert.match(await p.locator('#study > .study-alert').textContent(), /not saved.*Export a copy/);
    await insideViewport(p, '#study > .study-alert');
    await shot(p, `studies-save-alert-${width}x${height}`);
    assert.equal(await saved(p), beforeStore, 'quota failure preserves the saved versions');
    assert.equal(studyOf(await exportDoc(p)).title, 'Quota draft', 'export still works after storage fails');
    await p.evaluate(() => window.restoreStudyStorage());
    await more(p, 'open');
    await p.locator(`${panel} [data-open]`).filter({ hasText: 'Example · rook-haste · version 1' }).click(); await idle(p);
    const haste = studyOf(await exportDoc(p)); haste.actions = [];
    await importDoc(p, haste);
    await p.click('#study [data-study="actions"]');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^Td4-d5!H$/ }).click(); await idle(p);
    assert.match(await state(p), /White to act.*1 recorded actions/, 'Haste keeps the same side after its complete action');
    await p.click('#study [data-study="actions"]');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^--$/ }).click(); await idle(p);
    assert.match(await state(p), /Black to act.*2 recorded actions/, 'Finish ends the held turn');
    assert.deepEqual(studyOf(await exportDoc(p)).actions, ['Td4-d5!H', '--']);
    const healthyStore = await saved(p);
    await p.evaluate(() => localStorage.setItem('kingdown.studies', '{bad'));
    await more(p, 'open');
    assert(await p.locator(`${panel} .study-panel-alert`).isVisible(), 'corrupt library reports its error inside the library');
    await closePanel(p);
    await p.evaluate(raw => localStorage.setItem('kingdown.studies', raw), healthyStore);
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('#study').getAttribute('open'), null, 'Escape closes only the study');
    assert.notEqual(await p.locator('#workshop').getAttribute('open'), null, 'Workshop remains open');
    assert.equal(await p.evaluate(() => document.activeElement?.classList.contains('pg-more')), true, 'focus returns to Workshop More');
    assert.equal(await p.evaluate(() => JSON.stringify(window.view.pos)), live.board, 'studies leave the live position intact');
    assert.equal(await p.locator('#workshop .pg-board').innerHTML(), tryBoard, 'studies leave the Workshop Try board intact');
    const now = await p.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => k !== 'kingdown.studies')));
    assert.deepEqual(now, Object.fromEntries(Object.entries(live.storage).filter(([k]) => k !== 'kingdown.studies')), 'studies do not change live game storage');
    await context.close();
  }
  assertNoErrors();
  console.log('studies: desktop, phone, actions, results, saved versions and atomic failures pass');
} finally { await browser.close(); }
