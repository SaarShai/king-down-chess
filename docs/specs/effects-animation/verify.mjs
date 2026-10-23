// A focused browser check for the review pages. The game build is checked by the standard runner.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, insideViewport, shot, env } from '../../../tools/lib/checks.mjs';

const root = resolve('.');
const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false } });
await server.listen();
const origin = server.resolvedUrls.local[0];
const base = `${origin}docs/specs/effects-animation/preview/`;
const browser = await launch();
const report = { groups: [], checks: [], errors: [] };
const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const frames = [0, .18, .45, .7, 1];
const cardProof = [];
try {
  for (const group of ['signals', 'cards', 'gui']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = trapErrors(page);
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
    await page.goto(`${base}${group}/index.html`);
    await page.waitForFunction(() => window.effectsStudy?.ready === true);
    const samples = await page.evaluate(() => window.effectsStudy.samples);
    assert.equal(samples.length, ({ signals: 12, cards: 21, gui: 23 })[group], `${group}: sample coverage`);
    assert.equal(new Set(samples.map(s => s.id)).size, samples.length, `${group}: unique IDs`);
    if (group === 'signals') assert.deepEqual(samples.map(s => s.id).sort(), ['freeze', 'archer', 'ward', 'firewall', 'guard', 'holy-light', 'mercy', 'ghost', 'swap', 'shove', 'check', 'hint'].sort(), 'preserve the active signal set');
    if (group === 'gui') for (const id of ['victory', 'timer', 'army', 'turn', 'check', 'defeat', 'draw', 'abort', 'cards', 'power', 'promotion', 'confirm', 'failure', 'history', 'dialog', 'button', 'connection', 'lesson']) assert(samples.some(sample => sample.id === id), `preserve approved GUI ${id}`);
    for (const sample of samples) {
      await page.evaluate(id => window.effectsStudy.select(id), sample.id);
      for (const progress of frames) {
        await page.evaluate(p => window.effectsStudy.seek(p), progress);
        const state = await page.evaluate(() => window.effectsStudy.getState());
        assert.equal(state.id, sample.id);
        assert.equal(state.playing, false, `${group}/${sample.id}: seek pauses`);
        assert(Math.abs(state.progress - progress) < .002, `${group}/${sample.id}: seek matches`);
      }
      if (group === 'cards') {
        const state = await page.evaluate(() => window.effectsStudy.getState());
        for (const [sq, expected] of Object.entries(sample.expected.board ?? {})) {
          const n = sq.charCodeAt(0) - 97 + (Number(sq[1]) - 1) * 8;
          const code = state.board[n], letter = ' PNBRQKALGMSOCVT'[code & 15];
          const actual = code ? code & 16 ? letter.toLowerCase() : letter : null;
          assert.equal(actual, expected, `${sample.id} final board ${sq}`);
        }
      }
      if (group === 'cards') {
        const images = [];
        for (const progress of [.45, .69]) {
          await page.evaluate(p => window.effectsStudy.seek(p), progress / sample.actions.length);
          images.push((await page.locator('#board').screenshot()).toString('base64'));
        }
        cardProof.push({ id: sample.id, name: sample.name, images });
      }
      await noSidewaysScroll(page);
    }
    const hero = group === 'cards' ? 'Burn' : group === 'signals' ? 'freeze' : 'victory';
    await page.evaluate(id => { window.effectsStudy.select(id); window.effectsStudy.seek(.45); }, hero);
    await shot(page, `${group}-desktop`, { fullPage: true });
    if (group !== 'gui') { await insideViewport(page, '#board'); await insideViewport(page, '#replay'); }
    const stateBefore = await page.evaluate(() => window.effectsStudy.getState());
    await page.locator('#replay').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.effectsStudy.getState().progress > .08 && window.effectsStudy.getState().playing);
    await page.locator('#play').focus();
    await page.keyboard.press('Enter');
    const paused = await page.evaluate(() => window.effectsStudy.getState());
    assert.equal(paused.playing, false);
    await page.waitForTimeout(180);
    assert.equal((await page.evaluate(() => window.effectsStudy.getState())).progress, paused.progress, `${group}: pause freezes clock`);
    if (group !== 'gui') {
      await page.locator('#flip').click();
      assert.equal((await page.evaluate(() => window.effectsStudy.getState())).flipped, !stateBefore.flipped);
      await shot(page, `${group}-flipped`, { fullPage: true });
      await page.locator('#flip').click();
    }
    for (const width of [643, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.effectsStudy.seek(.45));
      await noSidewaysScroll(page);
      if (group !== 'gui') await insideViewport(page, '#replay');
      await page.locator('#replay').scrollIntoViewIfNeeded();
      await shot(page, `${group}-${width}`, { fullPage: true });
    }
    const reduce = page.locator(group === 'gui' ? '#reduce' : '#reduced');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(selector => document.querySelector(selector).checked && window.effectsStudy.getState().playing === false, group === 'gui' ? '#reduce' : '#reduced');
    assert(await reduce.isChecked(), `${group}: system reduced motion updates control`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(selector => !document.querySelector(selector).checked, group === 'gui' ? '#reduce' : '#reduced');
    await reduce.check();
    assert.equal((await page.evaluate(() => window.effectsStudy.getState())).playing, false, `${group}: reduced is still`);
    const still = await page.evaluate(() => window.effectsStudy.getState().progress);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.effectsStudy.getState().progress), still);
    await shot(page, `${group}-reduced`, { fullPage: true });
    assertNoErrors(errors);
    report.groups.push({ group, samples: samples.length, frameChecks: samples.length * frames.length });
    if (group === 'gui') {
      await reduce.uncheck();
      for (const sample of samples.slice(18)) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.evaluate(id => { window.effectsStudy.select(id); window.effectsStudy.seek(.5); }, sample.id);
        await shot(page, `gui-${sample.id}`, { fullPage: true });
      }
    }
    if (group === 'signals') {
      await reduce.uncheck();
      await page.setViewportSize({ width: 1280, height: 800 });
      for (const id of ['firewall', 'archer', 'guard', 'holy-light', 'mercy', 'swap']) {
        await page.evaluate(id => { window.effectsStudy.select(id); window.effectsStudy.seek(.36); }, id);
        await shot(page, `signals-${id}`, { fullPage: true });
      }
    }
    await reduce.uncheck();
    await page.evaluate(() => { window.effectsStudy.seek(0); document.querySelector('#replay').click(); });
    await page.waitForFunction(() => window.effectsStudy.getState().playing);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.evaluate(() => window.effectsStudy.getState().playing), false, `${group}: hidden event stops clock`);
    await page.close();
  }
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  for (const group of ['signals', 'cards', 'gui']) {
    const page = await touchContext.newPage(), errors = trapErrors(page);
    await page.goto(`${base}${group}/index.html`);
    await page.waitForFunction(() => window.effectsStudy?.ready);
    await page.evaluate(() => window.effectsStudy.seek(0));
    await page.locator('#replay').tap();
    await page.waitForFunction(() => window.effectsStudy.getState().playing);
    await page.locator('#play').tap();
    assert.equal(await page.evaluate(() => window.effectsStudy.getState().playing), false, `${group}: touch pause`);
    assertNoErrors(errors);
    await page.close();
  }
  await touchContext.close();
  for (const [group, ids] of Object.entries({ heroes: ['Burn', 'Freeze', 'EarthQuake'], movement: ['Strike', 'FireStarter', 'Haste', 'Rally', 'March', 'Flight', 'Leap', 'Vault', 'SkyLift'], spells: ['Sacrifice', 'Salvation', 'MorphP', 'Control', 'Mimic', 'Curse', 'IceWall', 'Firewall', 'MirrorB'] })) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.setContent(`<html><body style="margin:0;padding:16px;background:#f3ead7;color:#332d25;font:18px Georgia"><h1>${group} · action / contact</h1><main style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${ids.map(id => { const sample = cardProof.find(s => s.id === id); return `<section><h2 style="font-size:21px;margin:8px">${sample.name}</h2><div style="display:flex">${sample.images.map(data => `<img style="width:50%;height:auto" src="data:image/png;base64,${data}">`).join('')}</div></section>`; }).join('')}</main></body></html>`);
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    await shot(page, `${group}-comparison`, { fullPage: true });
    await page.close();
  }
  for (const id of ['Burn', 'Freeze', 'EarthQuake']) {
    const context = await browser.newContext({ viewport: { width: 1100, height: 820 }, recordVideo: { dir: out, size: { width: 1100, height: 820 } } });
    const page = await context.newPage();
    await page.goto(`${base}cards/index.html?sample=${id}`);
    await page.waitForFunction(() => window.effectsStudy?.ready);
    await page.evaluate(id => { window.effectsStudy.select(id); window.effectsStudy.seek(.69); }, id);
    await shot(page, `${id.toLowerCase()}-contact`, { fullPage: true });
    await page.locator('#replay').click();
    await page.waitForFunction(() => window.effectsStudy.getState().progress === 1 && !window.effectsStudy.getState().playing);
    await page.waitForTimeout(300);
    const video = page.video();
    await context.close();
    renameSync(await video.path(), join(out, `${id.toLowerCase()}-motion.webm`));
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = trapErrors(page);
  await page.goto(base);
  await page.waitForFunction(() => document.querySelectorAll('[data-group]:disabled').length === 0);
  assert.equal(await page.locator('[data-group="combat"]').count(), 0, 'Combat stays out of the workshop');
  await page.locator('#inventory-open').click();
  assert(await page.locator('#inventory').isVisible());
  await noSidewaysScroll(page);
  await page.locator('#inventory-close').click();
  await page.getByRole('button', { name: 'Card effects', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#study').src.includes('/cards/'));
  await page.waitForFunction(() => document.querySelector('#study').contentWindow.effectsStudy?.ready);
  await shot(page, 'workshop-phone', { fullPage: true });
  assertNoErrors(errors);
  report.checks.push('all selectors and five exact frames per study', 'legal final card board', 'keyboard replay and pause', 'touch replay and pause', 'simulated visibility-change pause', 'board flip', '643px and 390px overflow', 'reduced motion still state', 'inventory and collection navigation');
  await page.close();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? String(error));
  throw error;
} finally {
  writeFileSync(join(out, 'effects-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  await server.close();
}
