import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser, type FrameLocator, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { watchMotion } from './plugin-motion-observer';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
// Each motion moment exists, ends, and under reduced motion shows its final state at once.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-motion-'));
  // Normal shared build: at most 601 ms in the M1 style test.
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
  harness = await startHarness({ boardPath: join(folder, 'board.html') }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open(reduced: boolean) {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(15_000);
  await page.goto(harness.url);
  await frame.locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
  await page.evaluate(async () => { const host = window as any; await host.harnessShow(await host.harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }), true); });
  return { page, frame };
}
const tapSquare = async (frame: FrameLocator, name: string) => {
  const box = (await frame.locator('#board canvas').boundingBox())!, s = box.width * 281 / 302 / 8;
  await frame.locator('#board canvas').click({ position: { x: box.width * 11 / 302 + (name.charCodeAt(0) - 97 + .5) * s, y: box.height * 30 / 322.1 + (8 - Number(name[1]) + .5) * s } });
};
async function newGame(frame: FrameLocator, toggles: [string, boolean][], start = true) {
  await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
  await frame.getByRole('radio', { name: 'White', exact: true }).locator('..').click();
  for (const [name, on] of toggles) { const box = frame.getByRole('checkbox', { name, exact: true }); if (await box.count()) await box.setChecked(on); }
  if (start) await frame.locator('#setup-start').click();
}
const only = (on: string[]) => ['Fairy pieces', 'Arrangement', 'Classic chess', 'King powers', 'Cards'].map(name => [name, on.includes(name)] as [string, boolean]);
async function mate(page: Page, frame: FrameLocator, paused = false) {
  const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/6K1/8/8/8/8/Q7 w - - 0 1')}`, harness.url).href)).json();
  await page.evaluate(r => (window as any).harnessShow(r), result);
  await frame.locator('#board[aria-busy="false"]').waitFor(); await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  await tapSquare(frame, 'a1');
  await tapSquare(frame, 'a8');
  const send = frame.locator('#end-turn[aria-disabled="false"]'); await send.waitFor();
  expect(await frame.locator('#over').evaluate(e => (e as HTMLDialogElement).open)).toBe(false);
  if (paused) {
    // Stop before the result arrives. Browser calls must not use the tap guard's time.
    await page.clock.setFixedTime(new Date()); await page.clock.pauseAt(await page.evaluate(() => Date.now()));
    await send.evaluate((b: HTMLButtonElement) => b.click());
    await expect.poll(async () => {
      if (await frame.locator('#over[open]').count()) return true;
      await page.clock.runFor(50); return false;
    }, { timeout: 15_000 }).toBe(true);
  } else await send.click();
}
it.each([false, true])('opens end actions during a live win (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await frame.locator('html').evaluate(() => {
      const state = (window as any).liveEnd = { opened: false, toppling: false, skip: false, actions: false, words: false, sentAt: 0, startedAt: 0, openedAfter: 0 };
      document.getElementById('end-turn')!.addEventListener('click', () => { state.sentAt = performance.now(); }, { once: true });
      new MutationObserver(() => {
        const over = document.querySelector<HTMLDialogElement>('#over')!;
        if (!state.startedAt && document.querySelector('#board[data-toppling]')) state.startedAt = performance.now();
        if (over.open && !state.opened) {
          state.openedAfter = performance.now() - (state.startedAt || state.sentAt);
          state.opened = true; state.toppling = !!document.querySelector('#board[data-toppling]');
          const actions = [...over.querySelectorAll('button')].filter(b => ['Play again', 'New game'].includes(b.textContent ?? ''));
          state.actions = actions.length === 2 && actions.every(b => getComputedStyle(b).visibility === 'visible' && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0);
          const skip = document.querySelector<HTMLElement>('#end-skip'); state.skip = !!skip && getComputedStyle(skip).visibility === 'visible' && skip.getBoundingClientRect().width > 0 && skip.getBoundingClientRect().height > 0;
        }
        const words = document.querySelector<HTMLElement>('#board .kd-words:not([hidden])');
        if (words && getComputedStyle(words).visibility === 'visible' && words.getBoundingClientRect().width > 0 && words.getBoundingClientRect().height > 0) state.words = true;
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'hidden', 'data-toppling'] });
    });
    await mate(page, frame);
    await frame.locator('#over.end-card[open]').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).liveEnd.openedAfter)).toBeLessThan(1500);
    expect(await frame.locator('#over').getByRole('button', { name: 'Play again', exact: true }).isVisible()).toBe(true);
    expect(await frame.locator('#over').getByRole('button', { name: 'New game', exact: true }).isVisible()).toBe(true);
    if (!reduced) {
      expect(await frame.locator('html').evaluate(() => (window as any).liveEnd)).toMatchObject({ opened: true, toppling: true, skip: true, actions: true });
      await expect.poll(() => frame.locator('html').evaluate(() => (window as any).liveEnd.words)).toBe(true);
    }
    await frame.locator('#board[data-toppling]').waitFor({ state: 'detached' });
    expect(await frame.locator('#end-skip').isVisible()).toBe(false);
  } finally { await page.close(); }
});
it('skips the end ceremony at 200 ms while game actions are guarded', async () => {
  const { page, frame } = await open(false);
  try {
    await page.clock.install();
    await mate(page, frame, true); await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' });
    await frame.locator('#over[open]').waitFor(); await page.clock.runFor(200);
    await frame.locator('#end-skip').evaluate((b: HTMLButtonElement) => b.click());
    expect(await frame.locator('#board .kd-words').count()).toBe(0);
    expect(await frame.locator('#over[open]').count()).toBe(1);
  } finally { await page.close(); }
});
it.each(['Play again', 'New game', 'See the board'])('uses %s at its allowed time after a live end opens', async action => {
  const { page, frame } = await open(false);
  try {
    await page.clock.install();
    await mate(page, frame, true); await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' });
    const old = await page.evaluate(() => (window as any).harnessView.game_id);
    await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('#over').getByRole('button', { name: action, exact: true }).isEnabled()).toBe(true);
    await page.clock.runFor(200);
    const press = () => frame.locator('#over').getByRole('button', { name: action, exact: true }).evaluate((b: HTMLButtonElement) => b.click());
    await press();
    if (action !== 'See the board') {
      expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_rematch').length)).toBe(0);
      expect(await frame.locator('#over[open]').count()).toBe(1);
      expect(await frame.locator('body').getAttribute('data-page')).toBe('end');
      expect(await frame.locator('#board[data-toppling]').count()).toBe(1);
      await page.clock.runFor(1000); await press();
    }
    await page.clock.resume(); await page.clock.setSystemTime(new Date());
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
    if (action === 'New game') await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    else if (action === 'Play again') await page.waitForFunction(old => (window as any).harnessView.game_id !== old, old);
    else {
      expect(await frame.locator('#over[open]').count()).toBe(0);
      await page.clock.runFor(1200);
      expect(await frame.locator('#over[open]').count()).toBe(0);
      await frame.locator('#end-result').click(); await frame.locator('#over[open]').waitFor();
    }
  } finally { await page.close(); }
});
it('keeps a live checkmate loss calm and leaves the last move on the board', async () => {
  const { page, frame } = await open(false);
  try {
    const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/6K1/8/8/8/8/Q7 w - - 0 1')}&black=1`, harness.url).href)).json();
    await page.evaluate(r => (window as any).harnessShow(r), result);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const reply = await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name: 'kingdown_move', arguments: { game_id: result._meta.view.game_id, command_id: crypto.randomUUID(), expected_revision: result._meta.view.revision, lan: 'Qa1-a8' } } })).json();
    expect(reply.isError).not.toBe(true);
    await page.evaluate(async () => { const h=window as any; await h.harnessShow(await h.harnessTool({ name:'kingdown_get', arguments:{board_id:h.harnessWidgetState.privateContent.board_id} })); });
    await frame.locator('#over-title').filter({ hasText: 'You lose' }).waitFor();
    expect(await frame.locator('#end-reason').textContent()).toBe('Casual · Your opponent gave checkmate.');
    expect(await frame.locator('#last-move').textContent()).toContain('a8');
    expect(await frame.locator('#board[data-toppling], #board .kd-words, #over.is-win').count()).toBe(0);
    expect(await animations(frame, '#over')).toBe(0);
    await frame.locator('#over').getByRole('button', { name: 'See the board', exact: true }).click();
    await frame.locator('#moves-line').click(); await frame.locator('#board-sheet[open]').waitFor();
    await page.waitForTimeout(3300);
    expect(await frame.locator('#board-sheet[open]').count()).toBe(1);
    const offer = await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name: 'kingdown_rematch', arguments: { game_id: result._meta.view.game_id, command_id: crypto.randomUUID(), expected_revision: reply._meta.view.revision, choice: 'offer' } } })).json();
    expect(offer.isError).not.toBe(true);
    await page.waitForFunction(() => (window as any).harnessView.rematch_offer === 0);
    expect(await frame.locator('#board-sheet[open]').count()).toBe(1);
  } finally { await page.close(); }
});
it.each([false, true])('gives a spent card a short gold pulse (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    // A random hand can have no legal card at the start. Keep a playable hand for the pulse check.
    await newGame(frame, only(['Cards']), false); await frame.locator('#setup-cards').click();
    await frame.locator('[name="card-mode"][value="Use all cards"]').locator('..').click();
    await frame.locator('[name="card-mode"][value="Pick four"]').locator('..').click();
    for (const card of ['Freeze', 'IceWall', 'MorphP', 'Vault']) await frame.locator(`.card-grid input[value="${card}"]`).check();
    await frame.locator('#setup-done').click(); await frame.locator('#setup-start').click();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    let index = -1;
    for (let i = 0; i < 4 && index < 0; i++) {
      await frame.locator(`#card-w-${i}`).click();
      const use = frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true });
      if (await use.count()) { await use.click(); index = i; } else await frame.locator('#board-sheet .sheet-head button[aria-label="Close"]').click();
    }
    expect(index).toBeGreaterThanOrEqual(0);
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move' }).click();
    // The pulse can start and end inside click(). Record it before the click.
    await frame.locator('body').evaluate((e, id) => { const w = window as any; w.spentPulse = '';
      new MutationObserver(() => { const c = document.getElementById(id); if (!w.spentPulse && c?.classList.contains('is-spending')) w.spentPulse = getComputedStyle(c.querySelector('.coin-paint')!).animationName; })
        .observe(e, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); }, `card-w-${index}`);
    await frame.locator('#board-sheet #choices button').first().click();
    const coin = frame.locator(`#card-w-${index}`);
    await coin.and(frame.locator('[data-state="used"]:not(.is-spending)')).waitFor({ timeout: reduced ? 1000 : 2000 });
    expect(await frame.locator('body').evaluate(() => (window as any).spentPulse)).toBe(reduced ? '' : 'card-spend');
    // G2 a: a spent card coin dims to 0.85, so its word keeps 4.5:1.
    // strips() rebuilds the coin row on a poll. A detached coin reads no style, so poll until an attached coin dims.
    await expect.poll(() => coin.evaluate(e => (e as HTMLElement).isConnected ? getComputedStyle(e.querySelector('.coin-paint')!).opacity : null), { timeout: 5000 }).toBe('0.85');
    expect(await coin.evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  } finally { await page.close(); }
});

const animations = (frame: FrameLocator, selector: string) => frame.locator(selector).first().evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
it.each([false, true])('deals the four cards once at a live start (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    const deal = await watchMotion(page, '#game-table .card-coin.is-dealt');
    await newGame(frame, only(['Cards']));
    await frame.locator('#card-w-3').waitFor();
    expect((await deal()).count).toBe(reduced ? 0 : 8);
    await expect.poll(() => animations(frame, '#game-table'), { timeout: 1500 }).toBe(0);
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('#game-table .card-coin.is-dealt').count()).toBe(0);
    expect(await animations(frame, '#game-table')).toBe(0);
  } finally { await page.close(); }
});
it('deals a new card game after the empty hall remounts', async () => {
  const { page, frame } = await open(false);
  try {
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
    await frame.locator('#setup-start:not(:disabled)').waitFor();
    const deal = await watchMotion(page, '#game-table .card-coin.is-dealt');
    await newGame(frame, only(['Cards']));
    await frame.locator('#card-w-3').waitFor();
    expect((await deal()).count).toBe(8);
  } finally { await page.close(); }
});
it.each([false, true])('pulses the checked side once (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/8/8/8/8/8/R5K1 w - - 0 1')}&black=1`, harness.url).href)).json();
    await page.evaluate(r => (window as any).harnessShow(r), result); await frame.locator('#board[aria-busy="false"]').waitFor();
    const bob = async (name: string, args: object) => (await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name, arguments: args } })).json());
    const id = result.structuredContent.game_id, view = (await bob('kingdown_get', { game_id: id }))._meta.view;
    await bob('kingdown_move', { game_id: id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision, lan: 'Ra1-a8' });
    await frame.locator('#board-menu').click(); await frame.locator('#reload').click();
    await frame.locator('#status').filter({ hasText: 'Check!' }).waitFor();
    if (!reduced) await frame.locator('#strip-me .portrait.is-checked').waitFor({ state: 'attached', timeout: 500 });
    await expect.poll(() => animations(frame, '#strip-me .portrait'), { timeout: 1500 }).toBe(0);
  } finally { await page.close(); }
});
it.each([false, true])('opens the board after both Ready (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['Fairy pieces', 'Arrangement'])); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor(); await frame.locator('#seat-ready:not(:disabled)').waitFor();
    await frame.locator('#board').evaluate(e => { const animate = e.animate.bind(e); (window as any).boardOpening = []; e.animate = (...args) => { (window as any).boardOpening.push(args[1]); return animate(...args); }; });
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#board').evaluate(() => (window as any).boardOpening)).toEqual(reduced ? [] : [{ duration: 320, easing: 'cubic-bezier(.05,.7,.1,1)' }]);
    await expect.poll(() => animations(frame, '#board'), { timeout: 1000 }).toBe(0);
  } finally { await page.close(); }
});
it.each([false, true])('turns the chosen king over once (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['King powers']), false); await frame.locator('#setup-king').click();
    const other = frame.locator('#king-picker button.emblem[aria-pressed="false"]:not(:disabled)').first(), king = await other.getAttribute('data-king');
    const flip = await watchMotion(page, '#king-picker button.emblem.is-flip');
    await other.click();
    await frame.locator(`#king-picker button.emblem.is-flip[data-king="${king}"]`).waitFor();
    expect((await flip()).running).toBe(reduced ? 0 : 1);
    await expect.poll(() => animations(frame, '#king-picker button.emblem.is-flip'), { timeout: 1000 }).toBe(0);
  } finally { await page.close(); }
});
it('keeps Sound off until the player turns it on', async () => {
  const { page, frame } = await open(false);
  try {
    await frame.locator('#play-settings, [data-nav="settings"]').first().click();
    expect(await frame.locator('#sound-help').textContent()).toContain('Sound stays on this device.');
    const sound = frame.getByRole('checkbox', { name: 'Sound', exact: true });
    expect(await sound.isChecked()).toBe(false);
    await sound.check(); expect(await sound.isChecked()).toBe(true);
    expect(await frame.locator('html').evaluate(() => localStorage.getItem('kingdown-sound'))).toBe('on');
  } finally { await page.close(); }
});
