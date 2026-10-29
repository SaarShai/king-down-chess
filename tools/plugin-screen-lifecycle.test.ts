import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness, waitForSourceApp } from './plugin-ui-harness';
import { DEFAULT_OPTIONS } from '../src/match/setup';
vi.setConfig({ testTimeout: 20_000, hookTimeout: 30_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-screen-lifecycle-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open() {
  const page = await browser.newPage(); page.setDefaultTimeout(4000); await page.goto(harness.url); await waitForSourceApp(page);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
  return page;
}
// The whole closed page (src/account-game/runtime.ts app.onClose): no private screen stays in the document.
const CLOSED = '<p role="status">This game panel is closed. Open King Down again to continue.</p>';
const state = (page: Page) => page.evaluate(() => (window as any).harnessWidgetState.privateContent);
/** The held screen shows until teardown. Teardown replaces the private page with the closed notice; the late reply
 * then starts no call, writes no widget state and draws nothing. */
async function stopHeld(page: Page, selector: string) {
  const frame = page.frameLocator('iframe');
  await frame.locator(`${selector}:not([hidden])`).waitFor();
  await page.evaluate(() => (window as any).harnessTeardown());
  const before = await page.evaluate(() => ({ calls: (window as any).harnessCalls.length, writes: (window as any).harnessWidgetStates.length }));
  const body = () => frame.locator('body').evaluate(element => element.innerHTML);
  expect(await body()).toBe(CLOSED);
  await page.evaluate(() => (window as any).releaseHeld());
  await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
  await frame.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  expect(await page.evaluate(() => ({ calls: (window as any).harnessCalls.length, writes: (window as any).harnessWidgetStates.length }))).toEqual(before);
  expect(await body()).toBe(CLOSED);
}
it('uses neutral copy for a pinned unavailable power when cards are off', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.route('**/fixture-tool', async route => {
      const response = await route.fetch(), result = await response.json(), view = result._meta?.view;
      if (view?.status === 'setup' && view.options?.kingPowers && !view.options.cards) {
        view.setup_admission = { kings: [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }], arrangement: true, bishopsOpposite: true, guardAdjacent: true };
        view.choices[view.seat].king = { king: 'Spirit', power: 'Mercy' };
      }
      await route.fulfill({ json: result });
    });
    await page.evaluate(async options => {
      const w = window as any, result = await w.harnessTool({ name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options } });
      if (result.isError) throw new Error(JSON.stringify(result.content));
      await w.harnessShow(result, true);
    }, { ...DEFAULT_OPTIONS, cards: false, arrangement: true, kingPowers: true });
    await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#seat-king:not(:disabled)').click();
    expect(await frame.locator('[data-power="HolyLight"]').isDisabled()).toBe(true);
    expect(await frame.locator('[data-power="Mercy"]').isEnabled()).toBe(true);
    expect(await frame.locator('.power-text.off').allTextContents()).toEqual(['Holy Light is not available in this game.']);
  } finally { await page.close(); }
});
it.each(['card:Haste', 'king', 'seat-king', 'seat-menu', 'seat-abort'])('preserves %s through SDK teardown and restores it on remount', async name => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    if (name.startsWith('seat-')) {
      await page.evaluate(async options => {
        const w = window as any, result = await w.harnessTool({ name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options } });
        if (result.isError) throw new Error(JSON.stringify(result.content));
        await w.harnessShow(result, true);
      }, { ...DEFAULT_OPTIONS, cards: false, arrangement: true, kingPowers: true });
      await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
      if (name === 'seat-king') await frame.locator('#seat-king:not(:disabled)').click();
      else { await frame.locator('#seat-menu:not(:disabled)').click(); if (name === 'seat-abort') await frame.locator('#seat-abort').click(); }
    } else {
      await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('play'));
      // Game options starts closed (F-113).
      const options = frame.locator('#setup-options');
      if (!await options.evaluate(e => (e as HTMLDetailsElement).open)) await options.locator('summary').click();
      if (name.startsWith('card:')) await frame.locator('#setup-toggle-cards').check();
      if (name === 'king') await frame.locator('#setup-toggle-kingPowers').check();
      await frame.locator(name.startsWith('card:') ? `#setup-card-${name.slice(5)}` : `#setup-${name}`).click();
    }
    const sheet = name.startsWith('seat-') && name !== 'seat-king' ? name : name === 'seat-king' ? 'king' : name;
    await expect.poll(async () => (await state(page)).sheet).toBe(sheet);
    await page.evaluate(() => (window as any).harnessTeardown());
    await expect.poll(async () => (await state(page)).sheet).toBe(sheet);
    expect(await frame.locator('#menu-sheet, #seat-menu-sheet').count()).toBe(0);
    await page.locator('#remount').click();
    await frame.locator(name.startsWith('seat-') && name !== 'seat-king' ? '#seat-menu-sheet' : '#menu-sheet').waitFor();
    await expect.poll(async () => (await state(page)).sheet).toBe(sheet);
    await frame.locator(name.startsWith('seat-') && name !== 'seat-king' ? '#seat-menu-close' : '#menu-close').click();
    await expect.poll(async () => (await state(page)).sheet).toBeUndefined();
    if (name.startsWith('card:')) expect(await frame.locator(`#setup-card-${name.slice(5)}`).evaluate(e=>e===document.activeElement)).toBe(true);
  } finally { await page.close(); }
});
it.each([false, true])('drops a held Profile reply after SDK teardown (failed %s)', async failed => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(failed => { const w = window as any; w.holdNext = 'kingdown_profile'; if (failed) w.dropNextReply = 'kingdown_profile'; }, failed);
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; app.client.state.sheet = 'badge:first_win'; app.navigate('profile'); });
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await stopHeld(page, '[data-screen="profile"]');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});
it('starts no Profile or games reads when Unblock replies after SDK teardown', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), user = randomUUID();
  try {
    await page.route('**/fixture-tool', async route => {
      const input = route.request().postDataJSON();
      if (input.name === 'kingdown_block') return route.fulfill({ json: { content: [], _meta: { blocked: false } } });
      if (input.name !== 'kingdown_profile') return route.continue();
      const response = await route.fetch(), result = await response.json();
      result._meta.blocks = [{ user_id: user, handle: 'blocked_peer' }];
      return route.fulfill({ json: result });
    });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-blocks button').click();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_block'; });
    await frame.locator('#board-sheet').getByRole('button', { name: 'Unblock player', exact: true }).click();
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await stopHeld(page, '[data-screen="profile"]');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});
it.each([false, true])('does not restart a changed Join preview after SDK teardown (failed %s)', async failed => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(failed => { const w = window as any; w.holdNext = 'kingdown_join'; if (failed) w.dropNextReply = 'kingdown_join'; }, failed);
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; app.memory.code = 'AAAAAA'; app.navigate('join'); });
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.code = 'BBBBBB'; });
    await stopHeld(page, '[data-screen="join"]');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});
// The badge sheet is parked with the Badges display (docs/PARKED.md).
it.each(['pieces', 'cards'])('clears the old %s sheet on a remount', async sheet => {
  const page = await open(), frame = page.frameLocator('iframe'), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate((_, sheet) => { const app = (window as any).harnessApp; app.client.state.sheet = sheet; app.client.save(); }, sheet);
    await expect.poll(async () => (await state(page)).sheet).toBe(sheet);
    await page.evaluate(() => (window as any).harnessTeardown());
    await page.locator('#remount').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await expect.poll(async () => (await state(page)).sheet).toBeUndefined();
    expect(await frame.locator('#menu-sheet').count()).toBe(0);
    expect(errors).toEqual([]);
  } finally { await page.close(); }
});
