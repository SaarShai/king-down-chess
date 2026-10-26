import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const out = process.argv[2];
assert.ok(out, 'Pass the external evidence directory.');
await mkdir(out, { recursive: true });
const origin = 'http://127.0.0.1:5303';
const url = `${origin}/docs/specs/effects-animation/preview/comparisons/information/`;
const browser = await chromium.launch({ headless: true });
const errors = [], failedRequests = [], measurements = [];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
await ctx.addInitScript(() => {
  window.storageWrites = [];
  for (const name of ['setItem', 'removeItem', 'clear']) Storage.prototype[name] = function (...args) {
    window.storageWrites.push([name, ...args]); throw new Error('The comparison must not write storage.');
  };
});
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', r => failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
page.on('response', r => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`); });
const state = () => page.evaluate(() => window.comparisonStudy.getState());
const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const capture = name => page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
const stable = s => ({ sample: s.sample, selected: s.selected, board: s.board, marks: s.marks, turn: s.turn, staged: s.staged, coords: s.coords, pace: s.pace });
const inspectBaseline = p => p.evaluate(() => {
  const box = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; };
  const text = document.getElementById('context-text');
  return { text: text.innerText, context: box('context-text'), actions: box('context-actions'), endTurn: box('end-turn'), board: box('board'), font: getComputedStyle(text).font, clamp: getComputedStyle(text).webkitLineClamp, scrollHeight: text.scrollHeight, clientHeight: text.clientHeight };
});
try {
  await page.goto(url);
  await page.waitForFunction(() => window.comparisonStudy?.ready);
  await frame();
  const current = await inspectBaseline(page);
  assert.equal(current.clamp, '2');
  assert.ok(current.scrollHeight > current.clientHeight, 'Current retains the nested-span clamp overflow.');
  assert.ok(current.endTurn.y - current.context.y > 450, 'Current keeps the real status-to-button separation.');

  // Render the production game in the same position. Read-only storage stubs keep it isolated.
  const sourceContext = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
  await sourceContext.addInitScript(() => {
    const fen = 'rmnqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RMAQKBNR w - - 0 1';
    Storage.prototype.getItem = function (key) {
      if (key === 'kingdown.title-seen') return '1';
      if (key === 'kingdown.save') return JSON.stringify({ back:'', fen, moves:[], white:'human', black:'human', coords:true, resigned:null, pace:'off', sound:false, threats:false });
      return null;
    };
    Storage.prototype.setItem = function () {};
    Storage.prototype.removeItem = function () {};
  });
  const source = await sourceContext.newPage();
  await source.goto(`${origin}/?fen=${encodeURIComponent('rmnqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RMAQKBNR w - - 0 1')}`);
  await source.waitForFunction(() => window.view);
  await source.evaluate(async () => { await window.view.ready(); await document.fonts.ready; });
  const point = await source.evaluate(() => window.view.screenOf(12));
  await source.mouse.click(point.x, point.y);
  await source.waitForFunction(() => document.getElementById('context-text').textContent.includes('White pawn.'));
  const production = await inspectBaseline(source);
  assert.deepEqual(current, production, 'Current matches the real game text, type, clamp and layout.');
  await source.screenshot({ path: `${out}/source-game-desktop.png` });
  await writeFile(`${out}/baseline.json`, JSON.stringify({ current, production, statusToEndTurnTop: current.endTurn.y - current.context.y }, null, 2));
  await sourceContext.close();

  for (const viewport of [{ width:1280, height:720 }, { width:390, height:844 }]) {
    await page.setViewportSize(viewport);
    for (const sample of ['pawn','archer','frozen','mercy','staged']) {
      await page.selectOption('#sample', sample);
      await page.evaluate(() => window.comparisonStudy.setVariant('current'));
      await frame();
      const before = await state();
      const boardBefore = await page.locator('#board canvas').evaluate(c => c.toDataURL());
      if (sample === 'pawn' || sample === 'staged') await capture(`current-${sample}-${viewport.width}`);
      await page.getByRole('button', { name:'Proposed', exact:true }).click();
      await frame();
      const proposed = await state();
      assert.deepEqual(stable(proposed), stable(before), 'Variant toggle preserves board, selection, turn and settings.');
      if (viewport.width === 1280) assert.ok(await page.locator('#board canvas').evaluate(c => c.toDataURL()) === boardBefore, 'Both desktop variants show the exact same painted board.');
      assert.equal(proposed.layout.documentWidth, viewport.width);
      const visibility = await page.evaluate(() => ['piece-name','piece-rules','piece-state','piece-movement','piece-special','turn-instruction','end-turn'].flatMap(id => {
        const e = document.getElementById(id);
        if (!e.getClientRects().length) return [];
        const r = e.getBoundingClientRect(), style = getComputedStyle(e);
        return [{ id, x:r.x, right:r.right, top:r.top, bottom:r.bottom, scroll:e.scrollHeight, client:e.clientHeight, clamp:style.webkitLineClamp, overflow:style.overflow }];
      }));
      for (const item of visibility) {
        assert.ok(item.x >= 0 && item.right <= viewport.width + 1, `${sample}: ${item.id} stays within the viewport.`);
        assert.ok(item.scroll <= item.client + 1, `${sample}: ${item.id} does not clip its text.`);
      }
      if (sample === 'pawn') assert.match(proposed.completeRuleText, /Moves 2 from its start rank\./);
      if (sample === 'archer') assert.match(proposed.completeRuleText, /The shot goes over pieces\..*Never takes by moving/);
      if (sample === 'frozen') assert.match(proposed.stateText, /^Frozen: it cannot move this turn\.$/);
      if (sample === 'mercy') assert.match(proposed.stateText, /Only a pawn can take beside Mercy\./);
      if (sample === 'staged') {
        assert.match(proposed.turnText, /White's turn is ready\. Select End turn\./);
        assert.equal(await page.locator('#end-turn').getAttribute('aria-disabled'), 'false');
        const { instruction:i, endTurn:e } = proposed.layout;
        assert.ok(i.right < e.x && i.bottom >= e.y && i.y <= e.bottom, 'Ready instruction sits beside End turn.');
      } else {
        const opener = page.locator('#piece-rules');
        await opener.focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('#rules').evaluate(d => d.open), true);
        const target = sample === 'mercy' ? '[data-power="Mercy"]' : `[data-piece="${sample === 'frozen' ? 'knight' : sample}"]`;
        assert.equal(await page.locator(`#rule-content ${target}`).evaluate(e => e === document.activeElement), true, 'All rules focuses the correct rule.');
        if (sample === 'mercy') assert.match(await page.locator('#rule-content [data-power="Mercy"]').innerText(), /except by pawns/);
        await page.keyboard.press('Escape');
        assert.equal(await opener.evaluate(e => e === document.activeElement), true, 'Escape returns focus to the actual opener.');
        await opener.click(); await page.locator('#rules-close').click();
        assert.equal(await opener.evaluate(e => e === document.activeElement), true, 'Close returns focus to the actual opener.');
      }
      await page.evaluate(() => scrollTo(0, 0));
      await capture(`proposed-${sample}-${viewport.width}`);
      await page.getByRole('button', { name:'Current', exact:true }).click();
      assert.deepEqual(stable(await state()), stable(before));
      if (sample !== 'staged') {
        await page.locator('#all-rules').click(); await page.keyboard.press('Escape');
        assert.equal(await page.locator('#all-rules').evaluate(e => e === document.activeElement), true);
      }
      measurements.push({ viewport, sample, overflow: proposed.layout.documentWidth - viewport.width, state: proposed, visibility });
    }
  }

  // Real mechanics, independent from the text shown by the harness.
  const mechanics = await page.evaluate(async () => {
    const { GameRules } = await import('/src/game-rules.ts');
    const { POWERS_BALANCED } = await import('/src/rules/rules.ts');
    const freeze = new GameRules({ hands:[['Freeze'],['Freeze']], markFree:false });
    const p = freeze.fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1');
    const frozen = freeze.makeMove(p, freeze.legalMoves(p).find(m => freeze.toLan(p,m) === '!F:d5'));
    const mercy = new GameRules({ ...POWERS_BALANCED, kings:[{king:'Spirit',power:'Mercy'},null] });
    const before = mercy.fromFen('3r3k/8/8/8/2p5/3N4/8/4K3 w - - 0 1');
    const sheltered = mercy.makeMove(before, mercy.legalMoves(before).find(m => mercy.toLan(before,m) === 'Ke1-e2'));
    return { frozenMoves: freeze.legalMoves(frozen).filter(m=>m.from===35).length, mercy: mercy.legalMoves(sheltered).map(m=>mercy.toLan(sheltered,m)) };
  });
  assert.equal(mechanics.frozenMoves, 0);
  assert.ok(!mechanics.mercy.includes('Rd8xd3') && mechanics.mercy.includes('c4xd3'));

  await page.evaluate(() => { window.comparisonStudy.setSample('pawn'); window.comparisonStudy.setVariant('proposed'); });
  await page.locator('#menu-btn').click();
  await page.getByLabel('Coordinates', { exact:true }).uncheck();
  await page.locator('#utility form button').click();
  await page.evaluate(() => window.comparisonStudy.setVariant('current'));
  assert.equal((await state()).coords, false, 'A settings change survives the variant toggle.');
  await page.evaluate(() => { window.comparisonStudy.setSample('staged'); window.comparisonStudy.setVariant('proposed'); });
  await page.locator('#end-turn').click();
  assert.equal((await state()).staged, false, 'End turn clears the staged turn in memory.');
  await page.evaluate(() => window.comparisonStudy.setSample('staged'));
  await page.locator('#undo').click();
  assert.equal((await state()).selected, 'e2');
  assert.equal((await state()).staged, false);
  await page.evaluate(() => { window.comparisonStudy.setSample('pawn'); window.comparisonStudy.setVariant('current'); });
  await page.getByRole('button', {name:'Proposed', exact:true}).focus(); await page.keyboard.press('Space');
  assert.equal((await state()).variant, 'proposed', 'Space activates the variant control.');
  await page.locator('#sample').focus(); await page.keyboard.press('a'); await page.keyboard.press('Tab');
  assert.equal((await state()).sample, 'archer', 'The native sample selector works from the keyboard.');
  await page.evaluate(() => window.comparisonStudy.setSample('pawn'));
  await page.locator('#board').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
  assert.equal((await state()).selected, 'd2', 'The real board supports keyboard piece selection.');
  await page.evaluate(() => window.comparisonStudy.setSample('mercy'));
  await page.locator('#board').focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  assert.match((await state()).completeRuleText, /your king steps 1–2 squares/);
  await page.locator('#piece-rules').click();
  assert.equal(await page.locator('#rule-content [data-power="Mercy"]').evaluate(e => e === document.activeElement), true);
  await page.keyboard.press('Escape');
  await page.locator('#board').focus(); await page.keyboard.press('ArrowLeft');
  for (let i=0;i<6;i++) await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  assert.equal((await state()).selected, 'd8');
  await page.locator('#piece-rules').click();
  assert.equal(await page.locator('#rule-content [data-piece="rook"]').evaluate(e => e === document.activeElement), true, 'A different piece opens its own rule.');
  await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(() => window.storageWrites), []);
  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);
  await writeFile(`${out}/verification.json`, JSON.stringify({ passed:true, url, viewports:2, scenarios:5, measurements, mechanics, storageWrites:[], consoleErrors:errors, failedRequests }, null, 2));
  console.log('PASS: source baseline equality; 10 scenario/viewport pairs; exact board preservation; full text; zero overflow; correct rules and focus return; real Frozen/Mercy mechanics; in-memory controls; zero storage writes, console errors or failed requests.');
} finally {
  await browser.close();
}
