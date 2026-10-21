import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import sharp from 'sharp';
import { startHarness } from './plugin-ui-harness';
import { DEFAULT_OPTIONS } from '../src/match/setup';
import { randomUUID } from 'node:crypto';
import type { AccountNotice } from '../src/account/profile';
import type { HistoryEntry } from '../src/match/protocol';
import { BADGES } from '../src/match/badges';
import { LETTERS, NAMES, type PieceType } from '../src/rules/engine';
import { POOL_KINDS } from '../src/match/setup';
import { pieceGuide } from '../src/read';
import { GameRules } from '../src/game-rules';
import { cardText, powerOptions, ruleLine, webWords } from '../src/powers-ui';
import { DEFAULT_RULES, POWERS_BALANCED } from '../src/rules/rules';
import { DEAL_CARDS } from '../src/match/setup';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
const record = { totals: { played: 23, won: 12, drawn: 3, lost: 8 }, rating: { rating: 1500.4, rd: 350, volatility: 0.06, provisional: true }, badges: [] };
const history: HistoryEntry[] = Array.from({ length: 23 }, (_, i) => ({ rating_policy: 'legacy', game_id: randomUUID(), finished_at: new Date(Date.UTC(2026, 9, 10, 12 - i)).toISOString(), kind: 'friend', colour: i % 2 ? 'black' : 'white', result: ['won', 'drawn', 'lost'][i % 3] as HistoryEntry['result'], reason: 'resignation', opponent: { handle: i === 0 ? 'abcdefghijklmnopqrst' : i === 3 ? null : `player_${i}`, icon: 'spirit', computer: i === 1 || i === 4, deleted: i === 2, level: i === 1 ? 'club' : null }, features: { fairy: true, arrangement: true, classic: true, cards: true, powers: true, king: 'Spirit', power: 'Mercy' } }));
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
    expect(await frame.locator('#profile-history li').first().locator('small').textContent()).toBe('Legacy rated · Resignation');
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
// The badge dates show the player's own day: a fixed time zone keeps the expected dates the same on every machine.
async function open() {
  const page = await browser.newPage({ timezoneId: 'UTC' }); page.setDefaultTimeout(5000); await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
  return page;
}
const tool = async (page: Awaited<ReturnType<typeof open>>, name: string, args = {}) => (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name, arguments: args } })).json();
it('names game features and each history result for screen readers', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const games = waitingGames.map((entry, i) => ({ ...entry, options: i ? { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } : entry.options }));
    const entries = history.slice(0, 3).map((entry, i) => ({ ...entry, features: { ...entry.features, fairy: i === 0, arrangement: i === 0, classic: i === 1, cards: i === 0, powers: i === 0 } }));
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { games, history: entries, record } } });
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_games', {}); app.navigate('play'); });
    const featureNames = ['- img "Fairy pieces"\n- img "Arrangement"\n- img "Cards"\n- img "King powers"', '- img "Classic chess"', ''];
    for (const [i, game] of games.entries()) {
      const row = frame.locator(`#games-list [data-game-id="${game.game_id}"]`);
      expect(await row.locator('.feats').ariaSnapshot()).toBe(featureNames[i]);
      expect(await row.ariaSnapshot()).toContain(i ? 'Classic chess' : 'Fairy pieces Arrangement Cards King powers');
    }
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(3);
    for (const [i, game] of games.entries()) {
      expect(await frame.locator(`#profile-open [data-game-id="${game.game_id}"] .feats`).ariaSnapshot()).toBe(featureNames[i]);
    }
    for (const [i, entry] of entries.entries()) {
      const row = frame.locator(`#profile-history [data-game-id="${entry.game_id}"]`);
      expect(await row.locator('.feats').ariaSnapshot()).toBe(featureNames[i]);
      expect(await row.ariaSnapshot()).toContain(`- img "${entry.result}"`);
      const bounds = await row.evaluate(el => {
        const plain = el.cloneNode(true) as HTMLElement;
        plain.querySelectorAll('.feats > span').forEach(mark => mark.replaceWith(...mark.childNodes));
        el.after(plain);
        const measure = (row: Element) => {
          const base = row.getBoundingClientRect();
          return [row, ...row.querySelectorAll('.feats svg')].map(mark => { const box = mark.getBoundingClientRect(); return [box.x - base.x, box.y - base.y, box.width, box.height]; });
        };
        const result = { named: measure(el), plain: measure(plain) }; plain.remove(); return result;
      });
      expect(bounds.named).toEqual(bounds.plain);
    }
    expect(await frame.locator('#profile-history .res').allTextContents()).toEqual(['W', 'D', 'L']);
  } finally { await page.close(); }
});
const accountNotices: AccountNotice[] = Array.from({length:23},(_,i)=>({id:String(9007199254741015n-BigInt(i)),created_at:'2026-10-20T12:00:00Z',action_id:7,...(i%2 ? {kind:'appeal' as const,status:'upheld' as const,text:'Appeal decision.'} : {kind:'moderation' as const,action:'warning' as const,text:'<img src=x onerror=alert(1)> Reason.',ends_at:null})}));
it('shows dated safe account notices and pages independently of game history', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const supportUrl = process.env.VITE_KINGDOWN_STAGE === 'staging' ? 'https://kingdown-staging.vercel.app/support.html#appeals' : 'https://kingdown.dev/support.html#appeals';
  try {
    await page.request.post(new URL('/fixture-seed',harness.url).href,{data:{data:{notices:accountNotices,history,record}}});
    await frame.locator('html').evaluate(()=>(window as any).harnessApp.navigate('profile'));
    await expect.poll(()=>frame.locator('#profile-notices article').count()).toBe(20);
    expect(await frame.locator('#profile-notices article').first().textContent()).toContain('<img src=x onerror=alert(1)> Reason.');
    expect(await frame.locator('#profile-notices img').count()).toBe(0);
    expect(await frame.locator('#profile-notices time').first().textContent()).toBe('Oct 20, 2026');
    expect(await frame.locator('#profile-notices time').first().getAttribute('datetime')).toBe('2026-10-20T12:00:00Z');
    expect(await frame.locator('#profile-notices small').first().textContent()).toBe('Action #7');
    expect(await frame.locator('#profile-notices a').first().getAttribute('href')).toBe(supportUrl);
    const support = frame.locator('#profile-notices a').first();
    await support.focus(); await support.press('Enter');
    await expect.poll(()=>page.evaluate(()=>(window as any).harnessOpenLinks ?? [])).toEqual([{url:supportUrl}]);
    await page.evaluate(()=>{(window as any).denyOpenLinkNext=true;}); await support.click();
    await frame.locator('#profile-status').filter({hasText:`Open ${supportUrl} in your browser.`}).waitFor();
    expect(await page.evaluate(()=>(window as any).harnessOpenLinks)).toEqual([{url:supportUrl},{url:supportUrl}]);
    const first = await tool(page,'kingdown_profile');
    await frame.locator('#profile-notices-more').click();
    await expect.poll(()=>frame.locator('#profile-notices article').count()).toBe(23);
    expect(await frame.locator('#profile-notices-more').isVisible()).toBe(false);
    expect(await page.evaluate(()=>(window as any).harnessCalls.findLast((c:any)=>c.name==='kingdown_profile').arguments)).toEqual({notices_before:first._meta.next_notices_before});
    expect(await frame.locator('#profile-history li').count()).toBe(20);
  } finally {await page.close();}
});
it('shows empty notices and keeps a failed More cursor available for retry', async () => {
  const isolated = await startHarness({boardPath:join(folder,'board.html'),sourcePage:true});
  const page = await browser.newPage({timezoneId:'UTC'}); page.setDefaultTimeout(5000);
  try {
    await page.goto(isolated.url); const frame=page.frameLocator('iframe'); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(()=>(window as any).harnessSetContext({displayMode:'fullscreen'}));
    await frame.locator('html').evaluate(()=>(window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-notices-empty:not([hidden])').waitFor();
    await page.request.post(new URL('/fixture-seed',isolated.url).href,{data:{data:{notices:accountNotices}}});
    await frame.locator('html').evaluate(()=>(window as any).harnessApp.navigate('profile'));
    await expect.poll(()=>frame.locator('#profile-notices article').count()).toBe(20);
    await page.route('**/fixture-tool',async route=>{
      const input=route.request().postDataJSON();
      if(input.name==='kingdown_profile' && input.arguments.notices_before) return route.fulfill({json:{isError:true,content:[{type:'text',text:'Notice read failed.'}]}});
      await route.continue();
    });
    await frame.locator('#profile-notices-more').click();
    await frame.locator('#profile-status').filter({hasText:'Notice read failed.'}).waitFor();
    expect(await frame.locator('#profile-notices article').count()).toBe(20);
    await frame.locator('#profile-notices-more:not(:disabled)').waitFor(); await page.unroute('**/fixture-tool');
    await frame.locator('#profile-notices-more').click();
    await expect.poll(()=>frame.locator('#profile-notices article').count()).toBe(23);
    expect(await frame.locator('#profile-status').textContent()).toBe('');
  } finally {await page.close();await isolated.close();}
});
it('drops a held notice page after SDK teardown without changing DOM or saved state', async () => {
  const page=await open(),frame=page.frameLocator('iframe');
  try {
    await page.request.post(new URL('/fixture-seed',harness.url).href,{data:{data:{notices:accountNotices}}});
    await frame.locator('html').evaluate(()=>(window as any).harnessApp.navigate('profile'));
    await expect.poll(()=>frame.locator('#profile-notices article').count()).toBe(20);
    await page.evaluate(()=>{(window as any).holdNext='kingdown_profile';});
    await frame.locator('#profile-notices-more').click();
    await page.waitForFunction(()=>typeof(window as any).releaseHeld==='function');
    await page.evaluate(()=>(window as any).harnessTeardown());
    const before=await frame.locator('#profile-sheet').innerHTML(), saved=await page.evaluate(()=>(window as any).harnessWidgetStates.length);
    await page.evaluate(()=>(window as any).releaseHeld());
    await expect.poll(()=>frame.locator('html').evaluate(()=>(window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('#profile-sheet').innerHTML()).toBe(before);
    expect(await page.evaluate(()=>(window as any).harnessWidgetStates.length)).toBe(saved);
  } finally {await page.evaluate(()=>(window as any).releaseHeld?.()).catch(()=>{});await page.close();}
});
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
    const live = frame.locator('#profile-open button').first(), waiting = frame.locator('#profile-open button').last();
    expect(await live.locator('.when .turn-mark').textContent()).toBe('Turn');
    expect(await waiting.locator('.when .open-mark').textContent()).toBe('Open');
    expect(await live.locator('b').last().textContent()).toBe('Computer · Club');
    expect(await live.locator('small').first().textContent()).toBe('Move 1');
    expect(await waiting.locator('b').last().textContent()).toBe('Open game');
    expect(await waiting.locator('small').first().textContent()).toBe('Waiting for a friend');
    for (const row of [live, waiting]) {
      expect(await row.locator('small').first().evaluate(el => getComputedStyle(el).fontWeight)).toBe('400');
      expect(await row.locator('.pi').getAttribute('alt')).toBe('white king');
      expect(await row.locator('.portrait, .row-ico, i').count()).toBe(0);
      const bounds = await row.evaluate(el => ['.when', '.pi', '.grow'].map(selector => { const r = el.querySelector(selector)!.getBoundingClientRect(); return { left: r.left, right: r.right }; }));
      expect(bounds[0].right).toBeLessThanOrEqual(bounds[1].left);
      expect(bounds[1].right).toBeLessThanOrEqual(bounds[2].left);
    }
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
    expect(await frame.locator('#badge-detail').textContent()).toBe('Earned Oct 10, 2026');
    await frame.locator('#badge-close').click();
    await frame.locator('[data-badge="royal_collection"] button').click();
    expect(await frame.locator('#badge-detail').textContent()).toBe('Win with all six kings.');
    expect(await frame.locator('[data-badge="royal_collection"] button').getAttribute('aria-label')).toBe('Royal Collection. Win with all six kings.');
    await frame.locator('#badge-close').click();
    expect(await frame.locator('#over').isVisible()).toBe(false);
  } finally { await page.close(); }
});
it('lists every collection rule and hides shared unlocked status', async () => {
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
      expect(await frame.locator('#collection-items').innerText()).not.toContain('Unlocked');
      expect(await frame.locator('#collection-items').innerText()).not.toContain('STATUS');
      if (tab === 'Pieces') for (const letter of ['P', ...POOL_KINDS]) {
        const type = LETTERS.indexOf(letter) as PieceType, guide = pieceGuide(new GameRules(), type), card = frame.locator(`[data-piece="${NAMES[type]}"]`);
        expect(await card.locator('dt').allTextContents()).toEqual(['Moves', 'Takes', ...(guide.special ? ['Special'] : []), 'Status']);
        expect(await card.locator('dd').allTextContents()).toEqual([guide.moves, guide.captures, ...(guide.special ? [guide.special] : []), 'Unlocked']);
      }
      // One "Powers" label for each king (fault F15); the web's words on every rule line (fault F2).
      if (tab === 'Kings') for (const group of powerOptions({ ...DEFAULT_RULES, ...POWERS_BALANCED })) {
        const card = frame.locator(`[data-king="${group.king}"]`);
        expect(await card.locator('dt').allTextContents()).toEqual(['Powers', 'Status']);
        expect(await card.locator('dd').first().innerText()).toBe(group.options.map(option => `${option.label}: ${ruleLine(option.title)}`).join('\n'));
      }
      // The Collection's cards read as in a game with the default options: King powers off (fault F2).
      if (tab === 'Cards') for (const card of DEAL_CARDS) expect(await frame.locator(`#collection-items [data-card="${card}"] .cf-text small`).textContent()).toBe(ruleLine(cardText(card, DEFAULT_RULES)));
      if (tab === 'Powers') for (const [power, line] of Object.entries(data.powers)) expect(await frame.locator(`[data-power="${power}"] dd`).first().textContent()).toBe(webWords(balanced[power] ?? line));
    }
    const settingsReads = await page.evaluate(() => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_settings').length);
    await page.locator('#remount').click();
    await page.waitForFunction(reads => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_settings').length > reads, settingsReads);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.queue.mountJob()?.promise; });
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
    // A remount loads the whole page again; a CI runner needs more than the 1 s poll default.
    await expect.poll(() => frame.locator('#profile-rating b').textContent(), { timeout: 5000 }).toBe('1601');
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
it('keeps the bottom roller in view at the page end while More waits for the next page', async () => {
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
    // The scroll is part of the page scroll (fault F15): at the page end, its bottom roller shows.
    await frame.locator('#profile-sheet .new-game-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
    const bounds = await frame.locator('#profile-sheet .scroll').evaluate(el => ({ roller: el.getBoundingClientRect().bottom, body: el.closest('.new-game-body')!.getBoundingClientRect().bottom }));
    expect(bounds.roller).toBeLessThanOrEqual(bounds.body + 1);
    release!(); release = undefined;
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(23);
  } finally { release?.(); await page.close(); }
});

it('keeps a fresh profile read ahead of More and drops the old cursor reply', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  let releaseCursor: (() => void) | undefined, releaseFull: (() => void) | undefined, game_id: string | undefined;
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(20);
    await page.route('**/fixture-tool', async route => {
      const params = route.request().postDataJSON();
      if (params.name !== 'kingdown_profile') return route.continue();
      const response = await route.fetch();
      await new Promise<void>(resolve => { if (params.arguments.before) releaseCursor = resolve; else releaseFull = resolve; });
      await route.fulfill({ response });
    });
    await frame.locator('#profile-more').click();
    await expect.poll(() => !!releaseCursor).toBe(true);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('collection'));
    const fresh = { ...history[0], game_id: randomUUID(), finished_at: '2026-10-11T12:00:00Z', opponent: { ...history[0].opponent, handle: 'new_result' } };
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history: [fresh, ...history], record: { ...record, totals: { played: 24, won: 13, drawn: 3, lost: 8 } } } } });
    game_id = (await tool(page, 'kingdown_create', { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'white' }))._meta.view.game_id;
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => !!releaseFull).toBe(true);
    expect(await frame.locator('#profile-more').isVisible()).toBe(false);
    await frame.locator('#profile-more').evaluate(el => (el as HTMLButtonElement).click());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_profile' && c.arguments.before).length)).toBe(1);
    releaseFull!(); releaseFull = undefined;
    await expect.poll(() => frame.locator('#profile-history b').first().textContent()).toBe('new_result');
    expect(await frame.locator('#profile-totals b').allTextContents()).toEqual(['24', '13', '3', '8']);
    expect(await frame.locator(`#profile-open [data-game-id="${game_id}"]`).count()).toBe(1);
    const oldReply = page.waitForResponse(response => response.url().endsWith('/fixture-tool') && !!response.request().postDataJSON().arguments.before);
    releaseCursor!(); releaseCursor = undefined; await (await oldReply).finished();
    // A tool round trip lets the older profile reply reach the app before the row check.
    await frame.locator('html').evaluate(() => (window as any).harnessApp.client.call('kingdown_games'));
    expect(await frame.locator('#profile-history li').count()).toBe(20);
    expect(await frame.locator('#profile-history b').first().textContent()).toBe('new_result');
    expect(await frame.locator('#profile-more').isVisible()).toBe(true);
  } finally {
    releaseFull?.(); releaseCursor?.();
    if (game_id) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } });
    await page.close();
  }
});

it('updates a badge sheet in place when More returns and clears its scrim on Close', async () => {
  const page = await open(), frame = page.frameLocator('iframe'); let release: (() => void) | undefined;
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(20);
    await page.route('**/fixture-tool', async route => {
      const params = route.request().postDataJSON();
      if (params.name !== 'kingdown_profile' || !params.arguments.before) return route.continue();
      await new Promise<void>(resolve => { release = resolve; }); await route.continue();
    });
    await frame.locator('#profile-more').click(); await expect.poll(() => !!release).toBe(true);
    await frame.locator('[data-badge="first_win"] button').click();
    await frame.getByRole('dialog', { name: 'First Win', exact: true }).waitFor();
    expect(await frame.locator('#badge-detail').textContent()).toBe('Win a game.');
    await frame.locator('#badge-close').focus();
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record: { ...record, badges: [{ badge: 'first_win', earned_at: '2026-10-10T12:00:00Z' }] } } } });
    release!(); release = undefined;
    await expect.poll(() => frame.locator('#profile-history li').count()).toBe(23);
    expect(await frame.locator('#badge-detail').textContent()).toBe('Earned Oct 10, 2026');
    expect(await frame.locator('.scrim').count()).toBe(1);
    expect(await frame.locator('#badge-close').evaluate(el => el === document.activeElement)).toBe(true);
    await frame.locator('#badge-close').click();
    await expect.poll(() => frame.locator('.scrim').count()).toBe(0);
    expect(await frame.locator('#over').isVisible()).toBe(false);
    expect(await frame.locator('[data-badge="first_win"] button').evaluate(el => el === document.activeElement)).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.sheet)).toBeUndefined();
  } finally { release?.(); await page.close(); }
});

it('wraps a long name in the Profile title and keeps its full title text', async () => {
  const page=await open(), frame=page.frameLocator('iframe'), name='wwwwwwwwwwwwwwwwwwww';
  try {
    await page.setViewportSize({width:320,height:568});
    await frame.locator('html').evaluate(async (_,name)=>{
      const app=(window as any).harnessApp; await app.call('kingdown_handle',{handle:name,icon:'spirit'}); app.navigate('profile');
    },name);
    await frame.locator('#page-title').filter({hasText:name}).waitFor();
    expect(await frame.locator('#page-title').getAttribute('title')).toBe(name);
    expect(await frame.locator('#page-title').evaluate(e=>({cut:e.scrollWidth>e.clientWidth,ellipsis:getComputedStyle(e).textOverflow}))).toEqual({cut:false,ellipsis:'clip'});
  } finally {await page.close();}
});

it('gives games with the same opponent a colour and start time in both lists', async () => {
  const page=await open(),frame=page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 320, height: 568 });
    const entries=[0,1].map(n=>({rating_policy:'casual',game_id:`same-opponent-${n}`,kind:'friend',speed:'daily',status:'setup',seat:0,action:'ready',turn:0,revision:0,deadline_at:null,opponent:{handle:'same player',icon:null,computer:false,deleted:false,last_seen_ms:null},updated_at:'2026-10-15T12:00:00Z',created_at:`2026-10-15T12:0${n}:34Z`,options:null,move:null,open_until:null,level:'club'}));
    const wrap={...entries[0],game_id:'wrap-0',status:'playing',move:12,created_at:'2026-05-15T12:00:00Z',options:{fairy:true,arrangement:true,cards:true,kingPowers:true}};
    await page.request.post(new URL('/fixture-seed',harness.url).href,{data:{actor:'alice',data:{games:[...entries,wrap]}}});
    await frame.locator('html').evaluate(async()=>{const app=(window as any).harnessApp; await app.call('kingdown_games',{}); app.navigate('play');});
    const rows=await frame.locator('#games-list [data-game-id^="same-opponent-"] .line').allTextContents();
    expect(rows).toHaveLength(2); expect(rows[0]).toContain('White'); expect(rows[0]).not.toBe(rows[1]);
    for (const row of rows) { expect(row).toMatch(/\d{1,2}:\d{2}/); expect(row).not.toMatch(/\d{1,2}:\d{2}:\d{2}/); }
    // A '·' never ends a wrapped line: it stays with the next part (a long friend game wraps three times at 320 px).
    const lineEnds = (selector: string) => frame.locator(selector).evaluateAll(elements => elements.flatMap(e => {
      const lines = new Map<number, string>(), walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) for (let i = 0; i < walker.currentNode.textContent!.length; i++) {
        const range = document.createRange(); range.setStart(walker.currentNode, i); range.setEnd(walker.currentNode, i + 1);
        const top = Math.round(range.getBoundingClientRect().top);
        lines.set(top, (lines.get(top) ?? '') + walker.currentNode.textContent![i]);
      }
      return [...lines.values()].map(line => line.trim());
    }));
    for (const line of await lineEnds('#games-list [data-game-id^="same-opponent-"] .line, #games-list [data-game-id="wrap-0"] .line')) expect(line).not.toMatch(/·$/);
    await frame.locator('html').evaluate(()=>{(window as any).harnessApp.navigate('profile');});
    const first=frame.locator('#profile-open [data-game-id="same-opponent-0"] small').last(), second=frame.locator('#profile-open [data-game-id="same-opponent-1"] small').last();
    await first.waitFor(); expect(await first.textContent()).toContain('White'); expect(await first.textContent()).not.toBe(await second.textContent());
    for (const row of await frame.locator('#profile-open small').allTextContents()) expect(row).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
    for (const line of await lineEnds('#profile-open small')) expect(line).not.toMatch(/·$/);
  } finally {await page.close();}
});

// Fault round 4 (device matrix M1, M3, M7, M8, M9, M13).
const waitingGames = (['friend', 'random'] as const).map(kind => ({ rating_policy: 'legacy', game_id: `waiting-${kind}`, kind, speed: 'daily', status: 'waiting', seat: 0, action: 'waiting', turn: 0, revision: 0, deadline_at: null, opponent: null, updated_at: '2026-10-15T16:32:00Z', created_at: '2026-10-15T16:32:00Z', options: { ...DEFAULT_OPTIONS, fairy: true, cards: true, kingPowers: true }, move: null, open_until: null, level: 'club' }));
const bigRecord = { ...record, totals: { played: 1234, won: 700, drawn: 34, lost: 500 } };
async function openAt(width: number, height: number, locale = 'en-US', timezoneId = 'UTC') {
  const context = await browser.newContext({ viewport: { width, height }, locale, timezoneId }), page = await context.newPage(); page.setDefaultTimeout(5000);
  await page.goto(harness.url); await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
  await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record: bigRecord, games: waitingGames } } });
  return { page, frame: page.frameLocator('iframe'), close: () => context.close() };
}
it('keeps 4-digit totals apart and Profile rows readable at 320 × 568', async () => {
  const { frame, close } = await openAt(320, 568);
  try {
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-history li').first().waitFor(); await frame.locator('#profile-open button').first().waitFor();
    const layout = await frame.locator('#profile-sheet').evaluate(sheet => {
      const textBox = (e: Element) => { const range = document.createRange(); range.selectNodeContents(e); return range.getBoundingClientRect(); };
      const hits = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const totals = [...sheet.querySelectorAll('#profile-totals b')].map(textBox), gaps = totals.slice(1).map((box, i) => box.left - totals[i].right);
      const rows = [...sheet.querySelectorAll('#profile-history li, #profile-open button')].map(row => {
        const name = row.querySelector('.grow b') as HTMLElement, feats = row.querySelector('.feats')!.getBoundingClientRect();
        return { overlap: [...row.querySelectorAll('.grow small')].some(s => hits(textBox(s), feats)), name: name.getBoundingClientRect().width, cut: name.textContent!.length <= 9 && name.scrollWidth > name.clientWidth };
      });
      return { gaps, rows };
    });
    for (const gap of layout.gaps) expect(gap).toBeGreaterThanOrEqual(4);
    for (const row of layout.rows) { expect(row.overlap).toBe(false); expect(row.cut).toBe(false); expect(row.name).toBeGreaterThanOrEqual(60); }
    // AM or PM never stands alone on a line.
    const lines = await frame.locator('#profile-open small').evaluateAll(elements => elements.flatMap(e => {
      const tops = new Map<number, string>(), walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) for (let i = 0; i < walker.currentNode.textContent!.length; i++) {
        const range = document.createRange(); range.setStart(walker.currentNode, i); range.setEnd(walker.currentNode, i + 1);
        const top = Math.round(range.getBoundingClientRect().top); tops.set(top, (tops.get(top) ?? '') + walker.currentNode.textContent![i]);
      }
      return [...tops.values()].map(line => line.trim());
    }));
    expect(lines.filter(line => /^[AP]M$/.test(line))).toEqual([]);
    expect(await frame.locator('#profile-open [data-game-id="waiting-friend"]').textContent()).toContain('4:32\u00a0PM');
    expect(await frame.locator('#profile-open [data-game-id="waiting-friend"] small').first().textContent()).toBe('Waiting for a friend');
    expect(await frame.locator('#profile-open [data-game-id="waiting-random"] small').first().textContent()).toBe('Waiting for an opponent');
    // The darkest parchment behind the result mark (QA sample): the green W needs 4.5:1.
    const contrast = await frame.locator('#profile-history .res-w').first().evaluate(e => {
      const lum = (rgb: number[]) => { const [r, g, b] = rgb.map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      return (lum([229, 214, 188]) + 0.05) / (lum(getComputedStyle(e).color.match(/\d+/g)!.slice(0, 3).map(Number)) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  } finally { await close(); }
});
// One column (600 to 899 px) puts the W column on the darker right edge of the parchment (M13, iPad portrait).
// The shadow under each roller grew with the list, so More put the first and last rows on it (M13 after More).
const longHistory: HistoryEntry[] = Array.from({ length: 120 }, (_, i) => ({ ...history[0], game_id: randomUUID(), finished_at: new Date(Date.UTC(2026, 9, 10, 12) - i * 3_600_000).toISOString() }));
it.each([[768, 1024], [820, 600], [899, 900]])('keeps each W mark and date of 120 games at 4.5:1 on the real parchment at %i × %i', async (width, height) => {
  const { page, frame, close } = await openAt(width, height);
  const lum = ([r, g, b]: number[]) => { const [lr, lg, lb] = [r, g, b].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb; };
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history: longHistory, record: bigRecord, games: waitingGames } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-history li').first().waitFor(); await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
    for (let shown = 20; shown < 120; shown += 20) { await frame.locator('#profile-more').click(); await frame.locator(`#profile-history li:nth-child(${shown + 1})`).waitFor(); }
    const inkOf = async (selector: string) => lum(await frame.locator(`#profile-history ${selector}`).first().evaluate(e => getComputedStyle(e).color.match(/\d+/g)!.slice(0, 3).map(Number)));
    const marks = ['.res-w', '.when'], inks = [await inkOf('.res-w'), await inkOf('.when')], ratios: number[][] = [[], []];
    // The parchment under each mark and date: the median pixel of its box with the ink hidden, one screenshot for each screen of rows.
    await frame.locator('#profile-history').evaluate(list => list.querySelectorAll<HTMLElement>('.res, .when').forEach(e => { e.style.color = 'transparent'; }));
    const origin = await page.locator('iframe').evaluate(f => { const r = f.getBoundingClientRect(); return { x: r.left + f.clientLeft, y: r.top + f.clientTop }; });
    while (ratios[0].length < 120) {
      const boxes = await frame.locator('#profile-history').evaluate((list, { from, marks }) => {
        const rows = [...list.children].slice(from); rows[0].scrollIntoView({ block: 'start' });
        const shown = (e: Element) => { const r = e.getBoundingClientRect(); return [[r.left + 1, r.top + 1], [r.right - 1, r.bottom - 1]].every(([x, y]) => document.elementFromPoint(x, y) === e); };
        const out: number[][][] = [];
        for (const row of rows) { const own = marks.map(m => row.querySelector(m)!); if (!own.every(shown)) break; out.push(own.map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); })); }
        return out;
      }, { from: ratios[0].length, marks });
      expect(boxes.length).toBeGreaterThan(0);
      // Capture only the region that contains the sampled marks and dates.
      const rects = boxes.flat();
      const x = Math.floor(origin.x + Math.min(...rects.map(box => box[0]))), y = Math.floor(origin.y + Math.min(...rects.map(box => box[1])));
      const clip = { x, y, width: Math.ceil(origin.x + Math.max(...rects.map(box => box[2]))) - x, height: Math.ceil(origin.y + Math.max(...rects.map(box => box[3]))) - y };
      const { data, info } = await sharp(await page.screenshot({ clip })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      for (const row of boxes) row.forEach(([left, top, right, bottom], k) => {
        const paper: number[] = [];
        for (let y = top + origin.y; y < bottom + origin.y; y++) for (let x = left + origin.x; x < right + origin.x; x++) { const p = ((y - clip.y) * info.width + x - clip.x) * 3; paper.push(lum([data[p], data[p + 1], data[p + 2]])); }
        ratios[k].push((paper.sort((a, b) => a - b)[paper.length >> 1] + 0.05) / (inks[k] + 0.05));
      });
    }
    expect(ratios.map(r => r.length)).toEqual([120, 120]);
    marks.forEach((mark, k) => expect(Math.min(...ratios[k]), mark).toBeGreaterThanOrEqual(4.5));
  } finally { await close(); }
});
it.each(['de-DE', 'ja-JP', 'en-US'])('uses one English date style in Play, Profile and friend codes under %s', async locale => {
  const { frame, close } = await openAt(393, 852, locale);
  try {
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_games', {}); app.navigate('play'); });
    expect(await frame.locator('#games-list [data-game-id="waiting-friend"] .line').textContent()).toContain('Oct 15, 4:32 PM');
    expect(await frame.locator('#games-list [data-game-id="waiting-friend"] .row-title').textContent()).toBe('Waiting for a friend');
    expect(await frame.locator('#games-list [data-game-id="waiting-random"] .row-title').textContent()).toBe('Waiting for an opponent');
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-history li').first().waitFor();
    expect(await frame.locator('#profile-history .when').first().textContent()).toBe('Oct 10');
    await frame.locator('html').evaluate(async (_, options) => { const app = (window as any).harnessApp; app.navigate('play'); await app.start('friend', { options, colour: 'white' }); }, DEFAULT_OPTIONS);
    await frame.locator('.game-code span').first().waitFor();
    expect(await frame.locator('#friend-expiry').textContent()).toMatch(/^Ends [A-Z][a-z]{2} \d{1,2}, \d{1,2}:\d{2}\u00a0[AP]M\.$/);
  } finally { await close(); }
});
it('dates Profile history and badges by the device clock, as its open games do', async () => {
  const { page, frame, close } = await openAt(393, 852, 'en-US', 'Pacific/Kiritimati');
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { history, record: { ...bigRecord, badges: [{ badge: 'first_win', earned_at: '2026-10-10T12:00:00Z' }] }, games: waitingGames } } });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-history li').first().waitFor(); await frame.locator('#profile-open button').first().waitFor();
    // UTC+14: 12:00 UTC on 10 October is 02:00 on 11 October on the device.
    expect(await frame.locator('#profile-history .when').first().textContent()).toBe('Oct 11');
    expect(await frame.locator('[data-badge="first_win"] time').textContent()).toBe('Oct 11, 2026');
    expect(await frame.locator('#profile-open [data-game-id="waiting-friend"]').textContent()).toContain('Oct 16, 6:32\u00a0AM');
  } finally { await close(); }
});
it('reflows Profile at 200% zoom (197 CSS px) with no sideways scroll', async () => {
  const { frame, close } = await openAt(197, 426);
  try {
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-history li').first().waitFor();
    const wide = await frame.locator('#profile-sheet').evaluate(sheet => [sheet, ...sheet.querySelectorAll('.new-game-body, .registry, .totals, li, #profile-open button')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className || e.tagName));
    expect(wide).toEqual([]);
    const outside = await frame.locator('.registry').evaluate(registry => { const r = registry.getBoundingClientRect(); return [...registry.querySelectorAll('b, small, .res, .feats, .when')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.left < r.left - 1 || b.right > r.right + 1); }).length; });
    expect(outside).toBe(0);
    // Each badge name stays under its own badge (M1: five 30 px columns ran the names into each other).
    const spill = await frame.locator('#profile-badges').evaluate(root => [...root.querySelectorAll<HTMLElement>('.badge')].filter(figure => {
      const box = figure.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(figure.querySelector('figcaption')!); const ink = range.getBoundingClientRect();
      return ink.left < box.left - 1 || ink.right > box.right + 1 || figure.querySelector('button')!.getBoundingClientRect().width < 44;
    }).map(figure => figure.dataset.badge));
    expect(spill).toEqual([]);
  } finally { await close(); }
});

it('shows collection status again when an entry is locked', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('collection'));
    await frame.locator('#collection-items .piece-card').first().waitFor();
    expect(await frame.locator('#collection-items').innerText()).not.toContain('Unlocked');
    await frame.locator('html').evaluate('(async () => { const { syncCollectionStatus } = await import("/src/plugin/screens/collection.ts"); const list = document.getElementById("collection-items"); const mark = list.querySelector(".unlocked"); mark.className = "locked"; mark.textContent = "Locked"; syncCollectionStatus(list); })()');
    expect(await frame.locator('#collection-items').innerText()).toContain('Locked');
    expect(await frame.locator('#collection-items').innerText()).toContain('Unlocked');
    expect(await frame.locator('#collection-items').innerText()).toContain('STATUS');
    await frame.locator('html').evaluate('(async () => { const { syncCollectionStatus } = await import("/src/plugin/screens/collection.ts"); const list = document.getElementById("collection-items"); const mark = list.querySelector(".locked"); mark.className = "unlocked"; mark.textContent = "Unlocked"; syncCollectionStatus(list); })()');
    expect(await frame.locator('#collection-items').innerText()).not.toContain('Unlocked');
    expect(await frame.locator('#collection-items').innerText()).not.toContain('STATUS');
  } finally { await page.close(); }
});
