import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Browser, FrameLocator, Locator, Page } from 'playwright';
import { launch } from './lib/checks.mjs';
import { startHarness } from './plugin-ui-harness';
import { watchMotion, watchMotionEnd } from './plugin-motion-observer';
import { settled } from './lib/plugin-settled.mjs';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
// Each motion moment exists, ends, and under reduced motion shows its final state at once.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-motion-'));
  // Normal shared build: at most 601 ms in the M1 style test.
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
  harness = await startHarness({ boardPath: join(folder, 'board.html') }); browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
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
it('keeps source symbols intact beside protection badges', async () => {
  const { page, frame } = await open(false);
  try {
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click();
    await frame.locator('#symbols-only').check();
    const names: Record<string, string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
    const sources = Object.fromEntries(await Promise.all(Object.values(names).map(async name => [name, await readFile(`public/ui/icons/${name}.svg`, 'utf8')])));
    for (const kings of [0, 1, 2]) {
      const result = await (await page.request.post(new URL(`/fixture-position?case=gallery&kings=${kings}`, harness.url).href)).json();
      await page.evaluate(r => (window as any).harnessShow(r), result);
      await frame.locator('#board[aria-busy="false"]').waitFor();
      const errors = await frame.locator('#board canvas').evaluate(async (canvas, { names, sources }) => {
        const c = canvas as HTMLCanvasElement, expected = document.createElement('canvas'), images = new Map<string, HTMLImageElement>();
        expected.width = c.width; expected.height = c.height;
        for (const [name, source] of Object.entries(sources)) for (const side of [0, 1]) {
          const style = side ? 'color:#2b2621;--pi-disc:#4a4850;--pi-ring:#6e6a74;--pi-glyph:#f3ead7' : 'color:#2b2621;--pi-disc:#fffcf4';
          const image = new Image(); image.src = 'data:image/svg+xml,' + encodeURIComponent(source.replace('<svg ', `<svg style="${style}" `));
          await image.decode(); images.set(`${name}-${side}`, image);
        }
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const g = expected.getContext('2d')!, scale = c.width / 960;
        const squares = ([[0, 'RNBQKALG'], [1, 'MSOPPPPP'], [6, 'msoppppp'], [7, 'rnbqkalg']] as const).flatMap(([rank, row]) => [...row].map((letter, file) => ({ rank, file, piece: names[letter.toUpperCase()] })));
        for (const { rank, file, piece } of squares) g.drawImage(images.get(`${piece}-${rank >= 6 ? 1 : 0}`)!, (32 + file * 112 + 14) * scale, (96 + (7 - rank) * 112 + 14) * scale, 84 * scale, 84 * scale);
        const want = g.getImageData(0, 0, c.width, c.height).data, got = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        return squares.map(({ rank, file, piece }) => {
          let sum = 0, n = 0;
          for (let y = Math.ceil((96 + (7 - rank) * 112 + 14) * scale); y < (96 + (7 - rank) * 112 + 98) * scale; y++) for (let x = Math.ceil((32 + file * 112 + 14) * scale); x < (32 + file * 112 + 98) * scale; x++) {
            const i = (y * c.width + x) * 4; if (want[i + 3] < 254) continue;
            for (let channel = 0; channel < 3; channel++) { sum += Math.abs(got[i + channel] - want[i + channel]); n++; }
          }
          return { square: 'abcdefgh'[file] + (rank + 1), piece, error: sum / n };
        }).filter(item => !Number.isFinite(item.error) || item.error > 3);
      }, { names, sources });
      expect(errors, `King pair ${kings}: every source symbol remains intact`).toEqual([]);
    }
  } finally {
    // Pages share the fixture account's saved settings.
    try { await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_settings', arguments: { symbols_only: false } })); }
    finally { await page.close(); }
  }
});
// Record native motion at onset. A browser call can miss a short effect after it ends.
type RecordedMotion = { id: string; frames: Keyframe[]; options: KeyframeAnimationOptions; onset: number; paint?: { filter: string; clip: string } };
async function recordMotion(page: Page, frame: FrameLocator, selectors: string[]) {
  const install = (selectors: string[]) => {
    const events = (window as any).uiMotion = [];
    const animate = Element.prototype.animate;
    const time = Object.getOwnPropertyDescriptor(Animation.prototype, 'currentTime')!;
    Element.prototype.animate = function(frames, options) {
      const animation = animate.call(this, frames, options);
      const event = { id: this.id || this.closest('.card-coin')?.id || this.closest('.player-strip')?.id || '', selectors: selectors.filter(s => this.matches(s)), frames, options, onset: 0, paint: this.matches('.coin-paint') ? { filter: getComputedStyle(this).filter, clip: getComputedStyle(this.parentElement!).overflow } : undefined };
      if (!event.selectors.length) return animation;
      events.push(event);
      // Read the seek before a same-task rebuild can cancel this animation.
      Object.defineProperty(animation, 'currentTime', {
        get: () => time.get!.call(animation),
        set: value => { time.set!.call(animation, value); event.onset = performance.now() - Number(value); },
      });
      return animation;
    };
  };
  await page.addInitScript(install, selectors);
  await page.frames().find(f => f.parentFrame() === page.mainFrame())!.evaluate(install, selectors);
  return (selector: string) => frame.locator('html').evaluate((_, selector) => ((window as any).uiMotion as (RecordedMotion & { selectors: string[] })[])
    .filter(e => e.selectors.includes(selector)).map(({ id, frames, options, onset, paint }) => ({ id, frames, options, onset, paint })), selector);
}
function expectDeal(events: RecordedMotion[], reduced = false) {
  expect([...new Set(events.map(e => e.id))].sort()).toEqual(reduced ? [] : ['b', 'w'].flatMap(side => [0, 1, 2, 3].map(i => `card-${side}-${i}`)));
  for (const event of events) {
    const index = Number(event.id.at(-1));
    expect(event).toMatchObject({
      frames: [{ opacity: 0, transform: `translateY(16px) rotate(${(index - 1.5) * 9}deg) scale(.9)` }, { opacity: 1, transform: 'translateY(0) rotate(0) scale(1)' }],
      options: { duration: 250, delay: 75 + index * 65, fill: 'both', easing: 'cubic-bezier(.333333,1,.666667,1)' },
    });
  }
  // Rebuilt rows seek to the same deal. A refresh must not start a second deal.
  if (events.length) expect(Math.max(...events.map(e => e.onset)) - Math.min(...events.map(e => e.onset))).toBeLessThan(15);
}
async function mate(page: Page, frame: FrameLocator, paused = false) {
  const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/6K1/8/8/8/8/Q7 w - - 0 1')}`, harness.url).href)).json();
  await page.evaluate(r => (window as any).harnessShow(r), result);
  await frame.locator('#board[aria-busy="false"]').waitFor(); await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  // The remote move preview can finish after the artwork and turn words.
  await settled(page, frame);
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
it.each([false, true])('turn highlight choices fill after a held preview (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    for (const iteration of [1, 2, 3]) {
      const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/8/8/8/3R4/8/K7 w - - 0 1')}`, harness.url).href)).json();
      await page.evaluate(r => { const h = window as any; h.releaseHeld = undefined; h.holdNext = 'kingdown_preview'; return h.harnessShow(r); }, result);
      await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
      await settled(page, frame);
      await frame.locator('#board-menu').click();
      await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
      expect(await frame.locator('#choices button').count(), `Iteration ${iteration}: preview is held`).toBe(0);
      await page.evaluate(() => (window as any).releaseHeld());
      await settled(page, frame);
      expect(await frame.locator('#board-sheet[open] #choices button[title="Rd3-d4"]').count(), `Iteration ${iteration}: preview has arrived`).toBe(1);
      await frame.locator('#choices button[title="Rd3-d4"]').click();
      await frame.locator('#end-turn[aria-disabled="false"]').waitFor();
      await settled(page, frame);
    }
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});
it.each([false, true])('hands over the turn highlight and confirms only successful sends (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    const motion = await recordMotion(page, frame, ['.ui-send-check']);
    for (const failed of [false, false, true]) {
      const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/8/8/8/3R4/8/K7 w - - 0 1')}`, harness.url).href)).json();
      await page.evaluate(r => (window as any).harnessShow(r), result);
      await frame.locator('#board[aria-busy="false"]').waitFor();
      await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
      await settled(page, frame);
      expect(await frame.locator('.player-strip.is-turn').getAttribute('id')).toBe('strip-me');
      await frame.locator('#board-menu').click();
      await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
      await frame.locator('#choices button[title="Rd3-d4"]').click();
      const send = frame.locator('#end-turn[aria-disabled="false"]'); await send.waitFor();
      // The shown position has advanced, but this is still the sender's unsent turn.
      expect(await frame.locator('.player-strip.is-turn').getAttribute('id')).toBe('strip-me');
      if (failed) await page.evaluate(() => { (window as any).failNextAction = true; });
      // Keep the handoff in view until its checks end.
      else await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_computer'; });
      await send.click();
      if (failed) await frame.locator('#retry').waitFor({ state: 'visible' });
      else await page.waitForFunction(() => typeof (window as any).releaseBefore === 'function');
      expect(await frame.locator('.player-strip.is-turn').getAttribute('id')).toBe(failed ? 'strip-me' : 'strip-them');
      await expect.poll(() => frame.locator('.ui-send-check').count(), { timeout: 1500 }).toBe(0);
      // Invisible handoff tokens must not extend the scroll area after a viewport change.
      await expect.poll(() => frame.locator('.ui-turn-token').count(), { timeout: 1500 }).toBe(0);
      if (!failed) { await page.evaluate(() => (window as any).releaseBefore()); await settled(page, frame); }
    }
    expect(await motion('.ui-send-check')).toHaveLength(reduced ? 0 : 2);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()).catch(() => {}); await page.close(); }
});
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
it.each([false, true])('settles a live checkmate loss quietly and keeps the last move (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/6K1/8/8/8/8/Q7 w - - 0 1')}&black=1`, harness.url).href)).json();
    await page.evaluate(r => (window as any).harnessShow(r), result);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const motion = await recordMotion(page, frame, ['#over .over-king', '#over-title', '#end-reason', '#over *']);
    const reply = await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name: 'kingdown_move', arguments: { game_id: result._meta.view.game_id, command_id: crypto.randomUUID(), expected_revision: result._meta.view.revision, lan: 'Qa1-a8' } } })).json();
    expect(reply.isError).not.toBe(true);
    await page.evaluate(async () => { const h=window as any; await h.harnessShow(await h.harnessTool({ name:'kingdown_get', arguments:{board_id:h.harnessWidgetState.privateContent.board_id} })); });
    await frame.locator('#over-title').filter({ hasText: 'You lose' }).waitFor();
    expect(await frame.locator('#end-reason').textContent()).toBe('Casual · Your opponent gave checkmate.');
    expect(await frame.locator('#last-move').textContent()).toContain('a8');
    expect(await frame.locator('#board[data-toppling], #board .kd-words, #over.is-win').count()).toBe(0);
    const kings = await motion('#over .over-king');
    expect(kings).toHaveLength(reduced ? 0 : 2);
    for (const king of kings) expect(king).toMatchObject({ frames: [{ opacity: 0, translate: '0 -12px' }, { opacity: 1, translate: '0 0' }], options: { duration: 350, delay: 100 } });
    expect(await motion('#over-title')).toMatchObject(reduced ? [] : [{ frames: [{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], options: { duration: 350, delay: 325 } }]);
    expect(await motion('#end-reason')).toMatchObject(reduced ? [] : [{ frames: [{ opacity: 0, translate: '0 0px' }, { opacity: 1, translate: '0 0' }], options: { duration: 250, delay: 425 } }]);
    await expect.poll(() => animations(frame, '#over'), { timeout: 1500 }).toBe(0);
    const resultMotion = await motion('#over *');
    await settled(page, frame);
    await frame.locator('#over').getByRole('button', { name: 'See the board', exact: true }).click();
    await frame.locator('#end-result').click(); await frame.locator('#over[open]').waitFor();
    expect(await motion('#over *')).toEqual(resultMotion);
    expect(await animations(frame, '#over')).toBe(0);
    await settled(page, frame);
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
it.each([false, true])('presses a spent card into grey once (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    // A random hand can have no legal card at the start. Keep a playable hand for the press check.
    // Freeze and Firewall have their own local release (the next test).
    await pickFour(frame, ['IceWall', 'Strike', 'MorphP', 'Vault']);
    await frame.locator('#setup-done').click(); await frame.locator('#setup-start').click();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await settled(page, frame);
    let index = -1;
    for (let i = 0; i < 4 && index < 0; i++) {
      await frame.locator(`#card-w-${i}`).click();
      const use = frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true });
      if (await use.count()) { await use.click(); index = i; } else await frame.locator('#board-sheet .sheet-head button[aria-label="Close"]').click();
    }
    expect(index).toBeGreaterThanOrEqual(0);
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move' }).click();
    const coin = frame.locator(`#card-w-${index}`);
    const targetSize = () => coin.evaluate(e => {
      if (!e.isConnected) return null;
      const box = e.getBoundingClientRect();
      return [box.width, box.height].map(value => Math.round(value * 100) / 100);
    });
    let targetBefore: number[] | null = null;
    await expect.poll(async () => targetBefore = await targetSize()).not.toBeNull();
    const motion = await recordMotion(page, frame, ['#game-table .card-coin[data-state="used"] > .coin-paint']);
    await frame.locator('#board-sheet #choices button').first().click();
    await coin.and(frame.locator('[data-state="used"]')).waitFor();
    const press = await motion('#game-table .card-coin[data-state="used"] > .coin-paint');
    if (reduced) expect(press).toEqual([]);
    else {
      expect(press.length).toBeGreaterThan(0);
      expect(Math.max(...press.map(e => e.onset)) - Math.min(...press.map(e => e.onset))).toBeLessThan(15);
      expect([...new Set(press.map(e => e.id))]).toEqual([`card-w-${index}`]);
    }
    for (const event of press) expect(event).toMatchObject({ frames: [{ transform: 'translateY(-4px) scale(1)' }, { transform: 'translateY(0) scale(.96)' }], options: { duration: 200, delay: 0 }, paint: { filter: 'grayscale(1)', clip: 'visible' } });
    await expect.poll(() => animations(frame, `#card-w-${index}`), { timeout: 1000 }).toBe(0);
    // G2 a: a spent card coin dims to 0.85, so its word keeps 4.5:1.
    // strips() rebuilds the coin row on a poll. A detached coin reads no style, so poll until an attached coin dims.
    await expect.poll(() => coin.evaluate(e => e.isConnected ? { opacity: getComputedStyle(e).opacity, paintOpacity: getComputedStyle(e.querySelector('.coin-paint')!).opacity, transform: getComputedStyle(e).transform, paintTransform: getComputedStyle(e.querySelector('.coin-paint')!).transform, filter: getComputedStyle(e.querySelector('.coin-paint')!).filter } : null), { timeout: 5000 }).toEqual({ opacity: '1', paintOpacity: '0.85', transform: 'none', paintTransform: 'matrix(0.96, 0, 0, 0.96, 0, 0)', filter: 'grayscale(1)' });
    await expect.poll(targetSize).toEqual(targetBefore);
    await settled(page, frame);
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet .sheet-head button[aria-label="Close"]').click();
    expect(await motion('#game-table .card-coin[data-state="used"] > .coin-paint')).toEqual(press);
  } finally { await page.close(); }
});

async function pickFour(frame: FrameLocator, cards: string[]) {
  await newGame(frame, only(['Cards']), false); await frame.locator('#setup-cards').click();
  await frame.locator('[name="card-mode"][value="Use all cards"]').locator('..').click();
  await frame.locator('[name="card-mode"][value="Pick four"]').locator('..').click();
  for (const card of cards) await frame.locator(`.card-grid input[value="${card}"]`).check();
}
const spentStyle = (coin: Locator) => coin.evaluate(e => e.isConnected ? { opacity: getComputedStyle(e).opacity, filter: getComputedStyle(e).filter, paintOpacity: getComputedStyle(e.querySelector('.coin-paint')!).opacity, paintTransform: getComputedStyle(e.querySelector('.coin-paint')!).transform, paintFilter: getComputedStyle(e.querySelector('.coin-paint')!).filter } : null);
it.each([false, true])('releases Freeze at its card and rests in the same spent style (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await pickFour(frame, ['Freeze', 'IceWall', 'MorphP', 'Vault']);
    await frame.locator('#setup-done').click(); await frame.locator('#setup-start').click();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    const coin = frame.locator('#game-table .card-coin[aria-label^="Your Freeze"]'), id = await coin.getAttribute('id');
    await coin.click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move' }).click();
    const motion = await recordMotion(page, frame, ['#game-table .card-coin[data-state="used"]', '#game-table .card-coin[data-state="used"] > .coin-paint', '.ui-cast-release']);
    const layer = frame.locator(`.ui-cast-release[data-coin="${id}"]`);
    await frame.locator('#board-sheet #choices button').first().click();
    const spent = frame.locator(`#${id}[data-state="used"]`);
    await spent.waitFor();
    const glow = await motion('#game-table .card-coin[data-state="used"] > .coin-paint'), grey = await motion('#game-table .card-coin[data-state="used"]');
    if (reduced) {
      expect([glow, grey, await layer.count()]).toEqual([[], [], 0]);
    } else {
      // The card face gathers its material and brightens for 125 ms, then drains into the spent style. Nothing crosses the
      // board. A coin row rebuild resumes the same beat on the new face; the coin itself does not animate.
      expect([...new Set(glow.map(e => e.id))]).toEqual([id]); expect(grey).toEqual([]);
      expect(Math.max(...glow.map(e => e.onset)) - Math.min(...glow.map(e => e.onset))).toBeLessThan(15);
      expect(glow[0]).toMatchObject({ options: { duration: 250, easing: 'linear' } });
      expect(glow[0].frames.map(f => f.filter)).toEqual(['grayscale(0) brightness(1)', 'grayscale(0) brightness(1.14)', 'grayscale(.26) brightness(1.2)', 'grayscale(.74) brightness(1.14)']);
      expect(glow[0].frames.at(-1)!.offset).toBe(.75);
      expect((await motion('.ui-cast-release')).length).toBe(1);
      await expect.poll(() => layer.count(), { timeout: 2000 }).toBe(0);
    }
    // The static spent style: the face greys and dims; the coin keeps no filter of its own.
    await expect.poll(() => spentStyle(spent), { timeout: 5000 }).toEqual({ opacity: '1', filter: 'none', paintOpacity: '0.85', paintTransform: 'matrix(0.96, 0, 0, 0.96, 0, 0)', paintFilter: 'grayscale(1)' });
    await expect.poll(() => animations(frame, `#${id}`), { timeout: 1000 }).toBe(0);
    expect(await frame.locator('#game-table .card-coin[data-state="used"]').count()).toBe(1);
  } finally { await page.close(); }
});

const animations = (frame: FrameLocator, selector: string) => frame.locator(selector).first().evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
it.each([false, true])('deals the four cards once at a live start (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    const motion = await recordMotion(page, frame, ['#game-table .card-coin']);
    await newGame(frame, only(['Cards']));
    await frame.locator('#card-w-3').waitFor();
    expectDeal(await motion('#game-table .card-coin'), reduced);
    await expect.poll(() => animations(frame, '#game-table'), { timeout: 1500 }).toBe(0);
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('#game-table .card-coin').count()).toBe(8);
    expect(await motion('#game-table .card-coin')).toEqual([]);
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
    const motion = await recordMotion(page, frame, ['#game-table .card-coin']);
    await newGame(frame, only(['Cards']));
    await frame.locator('#card-w-3').waitFor();
    expectDeal(await motion('#game-table .card-coin'));
    await expect.poll(() => animations(frame, '#game-table'), { timeout: 1500 }).toBe(0);
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
    // The checked portrait keeps a still frame (is-checked); its pulse is the frame's one animation (src/ui/motion.ts
    // checkFrame). A loaded runner can pass the pulse before a locator reads it (CI run 39965072628), so a recorder notes it as it comes.
    const pulse = await watchMotion(page, '#strip-me .portrait.is-checked');
    const pulseEnd = await watchMotionEnd(page, '#strip-me .portrait.is-checked', '#strip-me .portrait', 1500);
    await frame.locator('#board-menu').click(); await frame.locator('#reload').click();
    await frame.locator('#status').filter({ hasText: 'Check!' }).waitFor();
    const seen = await pulse();
    expect(seen.count).toBe(1);
    if (reduced) expect(seen.running).toBe(0); else expect(seen.running).toBeGreaterThan(0);
    // It runs once: 1.5 s after the pulse starts, the portrait is there and no animation of it or of the pulse runs. The
    // page reads it at that frame (watchMotionEnd); a poll from here can spend the 1.5 s in one slow read.
    if (reduced) expect(await animations(frame, '#strip-me .portrait')).toBe(0);
    else expect(await pulseEnd()).toEqual({ seen: expect.toSatisfy((seen: number) => seen > 0), found: expect.toSatisfy((found: number) => found > 0), running: 0 });
  } finally { await page.close(); }
});
it.each([false, true])('opens the board after both Ready (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['Fairy pieces', 'Arrangement'])); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor(); await frame.locator('#seat-ready:not(:disabled)').waitFor();
    const motion = await recordMotion(page, frame, ['#game-table .portrait', '#board canvas', '#board', '#game-table *']);
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const portraits = await motion('#game-table .portrait');
    expect([...new Set(portraits.map(e => e.id))].sort()).toEqual(reduced ? [] : ['strip-me', 'strip-them']);
    for (const portrait of portraits) expect(portrait).toMatchObject({ frames: [{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }], options: { duration: 300, delay: 125 } });
    const board = await motion('#board canvas');
    if (reduced) expect(board).toEqual([]);
    else {
      expect(board.length).toBeGreaterThan(0);
      expect(Math.max(...[...portraits, ...board].map(e => e.onset)) - Math.min(...[...portraits, ...board].map(e => e.onset))).toBeLessThan(15);
    }
    for (const event of board) expect(event).toMatchObject({ frames: [{ opacity: 0, translate: '0 0px' }, { opacity: 1, translate: '0 0' }], options: { duration: 225, delay: 425 } });
    expect(await motion('#board')).toEqual([]);
    await expect.poll(() => animations(frame, '#game-table'), { timeout: 2000 }).toBe(0);
    const opening = await motion('#game-table *');
    await frame.locator('#board-menu').click(); await frame.locator('#reload').click();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    expect(await motion('#game-table *')).toEqual(opening);
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
