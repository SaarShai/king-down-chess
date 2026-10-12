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
it('lists all pieces, kings, powers and cards with the game text and Unlocked', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('collection'));
    await expect.poll(() => frame.locator('#collection-items .piece-card').count()).toBe(11);
    expect(await frame.locator('#collection-items [data-piece="pawn"]').innerText()).toContain('Moves 1 square forward. Moves 2 from its start rank.');
    const data = JSON.parse((await readFile('docs/specs/chatgpt-mvp/sample/data.js', 'utf8')).replace(/^window.KD = /, '').replace(/;\s*$/, ''));
    // RULES.md makes the balanced readings official; the sample keeps the printed readings.
    const balanced: Record<string, string> = {
      Freeze: 'Freeze an enemy piece (not the king), then make your move: the frozen piece cannot move on its next turn.',
      IceWall: 'Wall one of your pieces (not the king), then make your move: the walled piece cannot be captured on the next turn.',
      Strike: 'Move any piece except a pawn or the king as if it were a queen, to an empty square.',
      Haste: 'Move one piece twice in one turn (the second move is optional); neither move captures.',
      March: 'Any pawn may step two squares from any rank.',
      HolyLight: 'Enemy pawns cannot take your king; your pieces beside, in front of or behind it cannot be taken.',
      Mercy: 'Your king steps 1–2 squares and jumps your pieces, but takes only a pawn or a guard; your pieces next to it cannot be taken except by pawns.',
      DeathTouch: 'Your king takes an enemy next to it, or two squares away straight forward or back over an empty square, without moving — it can only take this way.',
      Darkness: 'Your pawns may also step diagonally, and take only straight ahead; your king may also step two squares in a straight line, over an empty square.',
      Firewall: 'None of your pieces can be taken on your opponent’s next turn; then make your move.',
    };
    for (const [tab, count] of [['Pieces', 11], ['Kings', 6], ['Powers', 12], ['Cards', 21]] as const) {
      await frame.locator('#collection-tabs label').filter({ hasText: tab }).click();
      expect(await frame.locator('#collection-items > *').count()).toBe(count);
      expect(await frame.locator('#collection-items .unlocked').count()).toBe(count);
      if (tab === 'Cards') for (const [card, line] of Object.entries(data.cards)) expect(await frame.locator(`[data-card="${card}"] .cf-text small`).textContent()).toBe(balanced[card] ?? line);
      if (tab === 'Powers') for (const [power, line] of Object.entries(data.powers)) expect(await frame.locator(`[data-power="${power}"] dd`).first().textContent()).toBe(balanced[power] ?? line);
    }
    await page.locator('#remount').click();
    await frame.locator('[data-screen="collection"]:not([hidden])').waitFor();
    await expect.poll(() => frame.locator('#collection-items > *').count()).toBe(21);
    expect(await frame.getByRole('radio', { name: 'Cards', exact: true }).isChecked()).toBe(true);
  } finally { await page.close(); }
});
it('reads a fresh profile after a remount and removes the provisional mark', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { record } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-rating .q:not([hidden])').waitFor();
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_profile').length);
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { record: { ...record, totals: { played: 24, won: 13, drawn: 3, lost: 8 }, rating: { rating: 1600.6, rd: 90, volatility: .06, provisional: false } } } } });
    await page.locator('#remount').click();
    await expect.poll(() => frame.locator('#profile-rating b').textContent()).toBe('1601');
    expect(await frame.locator('#profile-rating .q').isVisible()).toBe(false);
    expect(await frame.locator('#profile-totals b').allTextContents()).toEqual(['24', '13', '3', '8']);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_profile').length)).toBe(reads + 1);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.screen)).toBe('profile');
    expect(await page.evaluate(() => Object.keys((window as any).harnessWidgetState.privateContent).sort())).toEqual(['board_id', 'pending', 'screen', 'sheet']);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.modelContent)).toEqual({});
  } finally { await page.close(); }
});
it('uses the private profile handle and offers the name screen when it is absent', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/fixture-tool', async route => {
      if (route.request().postDataJSON().name !== 'kingdown_profile') return route.continue();
      const response = await route.fetch(), result = await response.json(); result._meta.handle = null; result._meta.icon = null;
      await route.fulfill({ response, json: result });
    });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-name:not([hidden])').waitFor();
    expect(await frame.locator('#page-title').textContent()).toBe('Profile');
    const bounds = await frame.locator('#profile-sheet .scroll').evaluate(el => ({ roller: el.getBoundingClientRect().bottom, body: el.closest('.new-game-body')!.getBoundingClientRect().bottom }));
    expect(bounds.roller).toBeLessThanOrEqual(bounds.body + 1);
    await frame.locator('#profile-name').click();
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('keeps both rollers in view while More waits for the next page', async () => {
  const page = await open(), frame = page.frameLocator('iframe'); let release: (() => void) | undefined;
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(20);
    await page.route('**/fixture-tool', async route => {
      const params = route.request().postDataJSON();
      if (params.name === 'kingdown_profile' && params.arguments.before) await new Promise<void>(resolve => { release = resolve; });
      await route.continue();
    });
    await frame.locator('#profile-more').click();
    await expect.poll(() => !!release).toBe(true);
    const bounds = await frame.locator('#profile-sheet .scroll').evaluate(el => ({ roller: el.getBoundingClientRect().bottom, body: el.closest('.new-game-body')!.getBoundingClientRect().bottom }));
    expect(bounds.roller).toBeLessThanOrEqual(bounds.body + 1);
    release!(); release = undefined;
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(23);
  } finally { release?.(); await page.close(); }
});
