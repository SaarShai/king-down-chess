import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { DEFAULT_OPTIONS } from '../src/match/setup';
import { randomUUID } from 'node:crypto';
import type { HistoryEntry } from '../src/match/protocol';
import { BADGES } from '../src/match/badges';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
const record = { totals: { played: 23, won: 12, drawn: 3, lost: 8 }, rating: { rating: 1500.4, rd: 350, volatility: 0.06, provisional: true }, badges: [] };
const history: HistoryEntry[] = Array.from({ length: 23 }, (_, i) => ({ game_id: randomUUID(), finished_at: new Date(Date.UTC(2026, 9, 10, 12 - i)).toISOString(), kind: 'friend', colour: i % 2 ? 'black' : 'white', result: ['won', 'drawn', 'lost'][i % 3] as HistoryEntry['result'], reason: 'resignation', opponent: { handle: i === 0 ? 'abcdefghijklmnopqrst' : i === 3 ? null : `player_${i}`, icon: 'spirit', computer: i === 1 || i === 4, deleted: i === 2, level: i === 1 ? 'club' : null }, features: { fairy: true, arrangement: true, classic: true, cards: true, powers: true, king: 'Spirit', power: 'Mercy' } }));
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-profile-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
it('shows finished details and adds the second page with the unchanged cursor', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(20);
    expect(await frame.locator('#profile-history li').first().locator('b').textContent()).toBe('abcdefghijklmnopqrst');
    expect(await frame.locator('#profile-history li').first().locator('.res').textContent()).toBe('W');
    expect(await frame.locator('#profile-history li').first().locator('small').textContent()).toBe('Resignation');
    expect(await frame.locator('#profile-history li').first().locator('.feats use').count()).toBe(5);
    const first = await tool(page, 'kingdown_profile');
    await frame.locator('#profile-more').click();
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(23);
    expect(await frame.locator('#profile-more').isVisible()).toBe(false);
    expect(await page.evaluate(() => (window as any).harnessCalls.findLast((c: any) => c.name === 'kingdown_profile').arguments)).toEqual({ before: first._meta.next_before });
    const ids = await frame.locator('#profile-history li').evaluateAll(els => els.map(el => (el as HTMLElement).dataset.gameId));
    expect(new Set(ids).size).toBe(23);
    expect(await frame.locator('#profile-history b').allTextContents()).toEqual(expect.arrayContaining(['Computer · Club', 'Deleted player', 'A player', 'Computer']));
  } finally { await page.close(); }
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open() {
  const page = await browser.newPage(); page.setDefaultTimeout(5000); await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  return page;
}
const tool = async (page: Awaited<ReturnType<typeof open>>, name: string, args = {}) => (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name, arguments: args } })).json();
it('reads the profile name, picture, rounded rating and totals from the server', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { record } } });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp; await app.client.call('kingdown_handle', { handle: 'profile_reader', icon: 'beast' }); app.navigate('profile');
    });
    await expect.poll(() => frame.locator('#page-title').textContent()).toBe('profile_reader');
    expect(await frame.locator('#profile-rating b').textContent()).toBe('1500');
    expect(await frame.locator('#profile-rating .q').isVisible()).toBe(true);
    expect(await frame.locator('#profile-totals b').allTextContents()).toEqual(['23', '12', '3', '8']);
    expect(await frame.locator('#profile-picture').getAttribute('src')).toContain('beast-w.webp');
  } finally { await page.close(); }
});
it('puts open games first with your turn first and resumes the tapped game', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), ids: string[] = [];
  try {
    for (const kind of ['solo', 'friend']) {
      const result = await tool(page, 'kingdown_create', { kind, options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'white' });
      expect(result.isError).toBeFalsy(); ids.push(result._meta.view.game_id);
    }
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-open button').count()).toBe(2);
    expect(await frame.locator('#profile-open button').evaluateAll(els => els.map(el => (el as HTMLElement).dataset.gameId))).toEqual(ids);
    expect(await frame.locator('#profile-open button').first().locator('.turn-mark').textContent()).toBe('Your turn');
    await frame.locator('#profile-open button').first().click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(ids[0]);
  } finally {
    for (const game_id of ids) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } });
    await page.close();
  }
});
it('shows all ten badges and opens the earned date or goal on a tap', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const badges = Object.keys(BADGES).slice(0, 6).map(badge => ({ badge, earned_at: '2026-10-10T12:00:00Z' }));
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { record: { ...record, badges } } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-badges .badge').count()).toBe(10);
    expect(await frame.locator('#profile-badges .badge.no').count()).toBe(4);
    await frame.locator('[data-badge="first_win"] button').click();
    await frame.getByRole('dialog', { name: 'First Win', exact: true }).waitFor();
    expect(await frame.locator('#badge-detail').textContent()).toBe('Earned 10 Oct 2026');
    await frame.locator('#badge-close').click();
    await frame.locator('[data-badge="royal_collection"] button').click();
    expect(await frame.locator('#badge-detail').textContent()).toBe('Win with all six kings.');
    expect(await frame.locator('[data-badge="royal_collection"] button').getAttribute('aria-label')).toBe('Royal Collection. Win with all six kings.');
    await frame.locator('#badge-close').click();
    expect(await frame.locator('#over').isVisible()).toBe(false);
  } finally { await page.close(); }
});
