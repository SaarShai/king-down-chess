// Fault round 2, builder B (docs/specs/chatgpt-mvp/issues/25-fault-round-2b.md): the menus, lists and pages.
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { controlBounds } from './lib/plugin-control-bounds.mjs';
import type { HistoryEntry } from '../src/match/protocol';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'kingdown-menus-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
// The owner's ChatGPT iPhone: 393 × 852 with host insets 102/118.
const OWNER = { width: 393, height: 852, top: 102, bottom: 118 };
const TOKENS = ['12.5px', '14px', '15.5px', '16px', '18px', '23px', '30px', '40px'];
const fullscreen = (page: Page, top: number, bottom: number) => page.evaluate(([top, bottom]) => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'], safeAreaInsets: { top, bottom, left: 0, right: 0 } }), [top, bottom]);
async function open({ width, height, top, bottom } = OWNER, clock = false) {
  const page = await browser.newPage({ viewport: { width, height } }); page.setDefaultTimeout(5000);
  if (clock) await page.clock.install();
  await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await fullscreen(page, top, bottom);
  return page;
}
const go = (page: Page, screen: string) => page.frameLocator('iframe').locator('html').evaluate((_, screen) => (window as any).harnessApp.navigate(screen), screen);
const seedGames = (page: Page, games: unknown[]) => page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { games } } });
const readGames = (page: Page) => page.frameLocator('iframe').locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_games', {}); });
const entry = (n: number, action: string) => ({ game_id: `menus-${n}`, kind: 'friend', speed: 'daily', status: 'playing', seat: 0, action, turn: action === 'ready' ? 0 : 1, revision: 4, deadline_at: null, opponent: { handle: `rival_${n}`, icon: null, computer: false, deleted: false, last_seen_ms: null }, updated_at: '2026-10-15T12:00:00Z', created_at: '2026-10-15T12:00:00Z', options: null, move: 3, open_until: null, level: 'club' });

it('keeps the home kings in the card, equal New game margins, a 640 px Play list and token type sizes', async () => {
  const page = await open({ width: 360, height: 740, top: 0, bottom: 0 }), frame = page.frameLocator('iframe');
  try {
    // F21: the side kings stay inside the home card at 360 px.
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }));
    await go(page, 'home');
    const kings = await frame.locator('#home-card').evaluate(card => { const c = card.getBoundingClientRect(); return [...card.querySelectorAll('.title-kings img')].map(i => { const r = i.getBoundingClientRect(); return [r.left - c.left, c.right - r.right]; }); });
    for (const [left, right] of kings) { expect(left).toBeGreaterThanOrEqual(0); expect(right).toBeGreaterThanOrEqual(0); }
    // F22: New game has the same left and right margins.
    await page.setViewportSize({ width: OWNER.width, height: OWNER.height }); await fullscreen(page, OWNER.top, OWNER.bottom);
    await go(page, 'play');
    const margins = await frame.locator('#setup-body .modes').evaluate(el => { const r = el.getBoundingClientRect(), s = el.closest('.page-sheet')!.getBoundingClientRect(); return [r.left - s.left, s.right - r.right]; });
    expect(margins[1]).toBeCloseTo(margins[0], 0);
    // F23 and F25: on a wide screen the Play list stops at 640 px; Play uses only the token type sizes.
    await seedGames(page, [entry(1, 'ready')]); await readGames(page);
    for (const width of [OWNER.width, 820]) {
      await page.setViewportSize({ width, height: 1180 }); await go(page, 'play');
      for (const row of await frame.locator('[data-screen="play"] .menu-row:visible').all()) expect((await row.boundingBox())!.width).toBeLessThanOrEqual(640);
      const sizes = await frame.locator('[data-screen="play"]').evaluate(s => [...new Set([...s.querySelectorAll<HTMLElement>('*')].filter(e => e.offsetParent && (e.matches('input') || [...e.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim()))).map(e => getComputedStyle(e).fontSize))]);
      expect(sizes.filter(size => !TOKENS.includes(size)), `${width} px`).toEqual([]);
    }
  } finally { await page.close(); }
});

it('says 1 game, shows Your turn once, and gives the name page, code fields and figures their fixes', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    // F18 and F16.
    await seedGames(page, []); await readGames(page);
    expect(await frame.locator('#home-line').isHidden()).toBe(true);
    await seedGames(page, [entry(1, 'ready'), entry(2, 'waiting')]); await readGames(page);
    expect(await frame.locator('#home-line').textContent()).toBe('Your move in 1 game.');
    await go(page, 'play');
    expect((await frame.locator('[data-game-id="menus-1"]').textContent())!.match(/Your turn/g)).toHaveLength(1);
    expect(await frame.locator('[data-game-id="menus-1"] .turn-mark').textContent()).toBe('Your turn');
    // F17: both code fields turn autocorrect off and show the placeholder in the secondary ink (#5b5045).
    for (const id of ['token', 'join-code']) {
      expect(await frame.locator(`#${id}`).getAttribute('autocorrect')).toBe('off');
      expect(await frame.locator(`#${id}`).evaluate(el => getComputedStyle(el, '::placeholder').color)).toBe('rgb(91, 80, 69)');
    }
    // F20: lining figures in the page text.
    expect(await frame.locator('#home-line').evaluate(el => getComputedStyle(el).fontVariantNumeric)).toBe('lining-nums');
    // F6: the name page keeps "Each name is unique." only, with no name filled in for a player with none.
    await page.route('**/fixture-tool', async route => {
      if (route.request().postDataJSON().name !== 'kingdown_settings') return route.continue();
      const response = await route.fetch(), result = await response.json(); result._meta.me = { handle: null, icon: null };
      await route.fulfill({ response, json: result });
    });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_settings', {}); });
    await go(page, 'handle');
    expect(await frame.locator('[data-screen="handle"] .quiet-line').last().textContent()).toBe('Each name is unique.');
    expect(await frame.locator('#handle').inputValue()).toBe('');
    // The host's safe-area insets count from 0 up.
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'], safeAreaInsets: { top: -20, bottom: 118, left: -4, right: 0 } }));
    expect(await frame.locator('html').evaluate(el => ['top', 'left', 'bottom'].map(edge => el.style.getPropertyValue(`--safe-${edge}`)))).toEqual(['0px', '0px', '118px']);
  } finally { await page.close(); }
});

it('opens New game at the top', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await go(page, 'play');
    await frame.locator('#new-game .new-game-body').evaluate(el => { el.scrollTop = 300; });
    expect(await frame.locator('#new-game .new-game-body').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await go(page, 'settings'); await go(page, 'play');
    expect(await frame.locator('#new-game .new-game-body').evaluate(el => el.scrollTop)).toBe(0);
  } finally { await page.close(); }
});

it('keeps every game row within reach after a saved Play mount', async () => {
  const page = await open({ width: 390, height: 844, top: 24, bottom: 120 }), frame = page.frameLocator('iframe');
  const savedGames = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.games);
  try {
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.start('solo', {}); app.navigate('play'); });
    await seedGames(page, Array.from({ length: 50 }, (_, n) => entry(n, 'ready')));
    await page.evaluate(() => { (window as any).holdNextGet = true; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeldGet);
    expect(await frame.locator('#reload').isDisabled()).toBe(true);
    await page.evaluate(() => (window as any).releaseHeldGet());
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('#games-list [data-game-id^="menus-"]').count()).toBe(50);
    for (const row of await frame.locator('#games-list button').all()) {
      await row.scrollIntoViewIfNeeded();
      expect((await row.evaluate(controlBounds)).accessible).toBe(true);
    }
  } finally { await page.evaluate(() => (window as any).releaseHeldGet?.()); await seedGames(page, savedGames); await page.close(); }
});

it('locks Name until settings finish on a saved screen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const current = `mount_${randomUUID().slice(0, 8)}`, draft = `draft_${randomUUID().slice(0, 8)}`;
  try {
    await frame.locator('html').evaluate(async (_, handle) => { const app = (window as any).harnessApp; await app.call('kingdown_handle', { handle, icon: 'spirit' }); app.navigate('handle'); }, current);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_settings'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    expect(await frame.locator('#handle').isDisabled()).toBe(true);
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#handle:not(:disabled)').waitFor();
    expect(await frame.locator('#handle').inputValue()).toBe(current);
    await frame.locator('#handle').fill(draft);
    await frame.locator('#handle-free:not([hidden])').waitFor();
    expect(await frame.locator('#handle').inputValue()).toBe(draft);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('scrolls the Profile scroll with the page, with its bottom roller at the page end', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const history: HistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({ game_id: randomUUID(), finished_at: new Date(Date.UTC(2026, 9, 10, 12 - i)).toISOString(), kind: 'friend', colour: 'white', result: 'won', reason: 'resignation', opponent: { handle: `player_${i}`, icon: 'spirit', computer: false, deleted: false, level: null }, features: { fairy: true, arrangement: true, classic: false, cards: false, powers: false, king: null, power: null } }));
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history } } });
    await go(page, 'profile');
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(20);
    expect(await frame.locator('#profile-sheet .registry').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    const end = await frame.locator('#profile-sheet .new-game-body').evaluate(body => { body.scrollTop = body.scrollHeight; const scroll = body.querySelector('.scroll')!.getBoundingClientRect(), view = body.getBoundingClientRect(); return { roller: scroll.bottom, view: view.bottom, top: view.top }; });
    expect(end.roller).toBeLessThanOrEqual(end.view + 1);
    expect(end.roller - 64).toBeGreaterThanOrEqual(end.top);
  } finally { await page.close(); }
});

it('shows each card and power with the same rules and words on the Cards sheet, the king sheet and the Collection', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await go(page, 'play');
    await frame.locator('#cards-row').click();
    await frame.locator('#setup-cards').click();
    const sheet = Object.fromEntries(await frame.locator('#menu-sheet .card-face').evaluateAll(faces => faces.map(f => [f.querySelector('input')!.value, f.querySelector('small')!.textContent])));
    await frame.locator('#menu-close').click();
    await frame.locator('#kingPowers-row').click();
    await frame.locator('#setup-king').click();
    const power = await frame.locator('#menu-sheet .power-text').first().textContent();
    await frame.locator('#menu-close').click();
    await go(page, 'collection');
    await frame.locator('#collection-tabs label').filter({ hasText: 'Cards' }).click();
    const collection = Object.fromEntries(await frame.locator('#collection-items .card-face').evaluateAll(faces => faces.map(f => [(f as HTMLElement).dataset.card, f.querySelector('small')!.textContent])));
    expect(collection).toEqual(sheet);
    for (const line of Object.values(collection)) { expect(line).toMatch(/^[A-Z].*\.$/); expect(line).not.toMatch(/captur/); }
    await frame.locator('#collection-tabs label').filter({ hasText: 'Kings' }).click();
    expect((await frame.locator('#collection-items [data-king] dd').allInnerTexts()).join('\n')).toContain(power!.slice(power!.indexOf(': ') + 2).replace(' Always on.', ''));
  } finally { await page.close(); }
});

// Q6 b: on a 197 px (200% zoom) screen the four Collection names stay whole and inside their labels, at a smaller size.
it('keeps the Collection tab names whole and inside their labels at 197 px', async () => {
  const page = await open({ width: 197, height: 426, top: 0, bottom: 0 }), frame = page.frameLocator('iframe');
  try {
    await go(page, 'collection'); await frame.locator('#collection-tabs').waitFor();
    const tabs = await frame.locator('#collection-tabs label').evaluateAll(labels => labels.map(label => {
      const box = label.getBoundingClientRect(), span = label.querySelector('span')!, words = span.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(span);
      return { name: span.textContent, left: Math.round(words.left - box.left), right: Math.round(box.right - words.right), lines: range.getClientRects().length, size: getComputedStyle(span).fontSize };
    }));
    for (const tab of tabs) {
      expect(tab.left, `${tab.name} left`).toBeGreaterThanOrEqual(2);
      expect(tab.right, `${tab.name} right`).toBeGreaterThanOrEqual(2);
      expect(tab.lines, `${tab.name} lines`).toBe(1);
    }
    expect(tabs.map(tab => tab.size)).toEqual(['12.5px', '12.5px', '12.5px', '12.5px']);
  } finally { await page.close(); }
});

// F5 and the owner's item W3 b: Start is busy at once, says 'Starting…' after 1 s, and frees ‹ Play at 5 s.
it('shows a busy Start at once, Starting… after 1 s and a safe way back at 5 s, with one Create', async () => {
  const page = await open(OWNER, true), frame = page.frameLocator('iframe');
  try {
    await go(page, 'play');
    await frame.locator('.mode').filter({ hasText: 'A friend' }).click();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    const start = frame.locator('#setup-start');
    await start.click();
    // Read at once, in one step: a quick start shows no words.
    expect(await start.evaluate((button: HTMLButtonElement) => [button.disabled, button.getAttribute('aria-busy'), button.textContent])).toEqual([true, 'true', 'Start game']);
    await expect.poll(() => page.evaluate(() => typeof (window as any).releaseHeld)).toBe('function');
    await page.clock.fastForward(1_000);
    await expect.poll(() => start.textContent()).toBe('Starting…');
    expect(await frame.locator('#page-back').isDisabled()).toBe(true);
    await page.clock.fastForward(4_000);
    // Play has no ‹ Play: its Settings row is the way out that the 5 s wait frees.
    await frame.locator('[data-screen="play"] [data-nav="settings"]:not(:disabled)').waitFor();
    expect(await start.textContent()).toBe('Starting…');
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click();
    await frame.locator('#page-back:not(:disabled)').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('#setup-start').isDisabled()).toBe(true);
    await page.clock.fastForward(5_001);
    await page.evaluate(() => (window as any).releaseHeld());
    // The 10-second limit rejects the late reply. Retry finds the same game.
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(1);
    await go(page, 'play');
    expect(await frame.locator('#setup-start').textContent()).toBe('Start game');
  } finally { await page.close(); }
});

it('keeps ‹ Play free after a slow settings save, while Create still waits', async () => {
  const page = await open(OWNER, true), frame = page.frameLocator('iframe');
  try {
    await go(page, 'play');
    await frame.locator('.mode').filter({ hasText: 'A friend' }).click();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_settings'; });
    await frame.locator('#setup-start').click();
    await expect.poll(() => page.evaluate(() => typeof (window as any).releaseHeld)).toBe('function');
    await page.clock.fastForward(5_000);
    await frame.locator('[data-screen="play"] [data-nav="settings"]:not(:disabled)').waitFor();
    await page.evaluate(() => { const host = window as any, release = host.releaseHeld; host.releaseHeld = undefined; host.holdNext = 'kingdown_create'; release(); });
    await expect.poll(() => page.evaluate(() => typeof (window as any).releaseHeld)).toBe('function');
    await page.clock.fastForward(1_001);
    await expect.poll(() => frame.locator('#setup-start').textContent()).toBe('Starting…');
    expect(await frame.locator('#page-back').isDisabled()).toBe(false);
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await frame.locator('#page-back').getAttribute('data-free')).toBeNull();
  } finally { await page.close(); }
});

it('records seat activity from the poll at most once each 30 seconds', async () => {
  const page = await open(OWNER, true), frame = page.frameLocator('iframe');
  const count = (name: string) => page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name);
  try {
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; app.navigate('play'); await app.start('friend', { colour: 'white' }); });
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    await page.clock.fastForward(6_000);
    await expect.poll(() => count('kingdown_seen')).toBe(1);
    const gets = await count('kingdown_get');
    await page.clock.fastForward(20_000);
    await expect.poll(() => count('kingdown_get')).toBeGreaterThan(gets);
    expect(await count('kingdown_seen')).toBe(1);
    await page.clock.fastForward(15_000);
    await expect.poll(() => count('kingdown_seen')).toBe(2);
  } finally { await page.close(); }
});

it('shows the opponent\'s moves and the mate without Reload (F4, the J12 steps f3, e5, g4, Qh4)', async () => {
  const page = await open(OWNER, true), frame = page.frameLocator('iframe');
  const tool = async (path: string, name: string, args: Record<string, unknown>) => (await page.request.post(new URL(path, harness.url).href, { data: { name, arguments: args } })).json();
  const view = () => frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view);
  const move = (lan: string) => frame.locator('html').evaluate(async (_, lan) => { const app = (window as any).harnessApp, v = app.memory.view; await app.call('kingdown_move', { game_id: v.game_id, command_id: crypto.randomUUID(), expected_revision: v.revision, lan }, true); }, lan);
  try {
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; app.navigate('play'); await app.start('friend', { colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } }); });
    const game_id = (await view()).game_id, { structuredContent: { code } } = await tool('/fixture-tool', 'kingdown_invite', { game_id });
    expect((await tool('/fixture-friend-tool', 'kingdown_join', { code })).isError).toBeFalsy();
    await page.clock.fastForward(16_000);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    for (const [white, black] of [['f2-f3', 'e7-e5'], ['g2-g4', 'Qd8-h4']]) {
      await move(white);
      const before = await view();
      const reply = await tool('/fixture-friend-tool', 'kingdown_move', { game_id, command_id: randomUUID(), expected_revision: before.revision, lan: black });
      expect(reply.isError, JSON.stringify(reply.content)).toBeFalsy();
      // A daily game with no recent sign of the opponent reads every 30 s (poll.ts); no Reload is needed.
      await page.clock.fastForward(31_000);
      await expect.poll(async () => (await view()).revision).toBeGreaterThan(before.revision);
    }
    expect((await view()).status).toBe('finished');
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get' && c.arguments.since_revision === undefined).length)).toBeLessThanOrEqual(2);
  } finally { await page.close(); }
});
