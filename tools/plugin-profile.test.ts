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
import { LETTERS, NAMES, type PieceType } from '../src/rules/engine';
import { POOL_KINDS } from '../src/match/setup';
import { pieceGuide } from '../src/read';
import { cardText, powerOptions, ruleLine, webWords } from '../src/powers-ui';
import { DEFAULT_RULES, POWERS_BALANCED } from '../src/rules/rules';
import { DEAL_CARDS } from '../src/match/setup';
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
    const live = frame.locator('#profile-open button').first(), waiting = frame.locator('#profile-open button').last();
    expect(await live.locator('.when .turn-mark').textContent()).toBe('Turn');
    expect(await waiting.locator('.when .open-mark').textContent()).toBe('Open');
    expect(await live.locator('b').last().textContent()).toBe('Computer · Club');
    expect(await live.locator('small').first().textContent()).toBe('Your turn · move 1');
    expect(await waiting.locator('b').last().textContent()).toBe('Open game');
    expect(await waiting.locator('small').first().textContent()).toBe('Waiting for an opponent');
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
      if (tab === 'Pieces') for (const letter of ['P', ...POOL_KINDS]) {
        const type = LETTERS.indexOf(letter) as PieceType, guide = pieceGuide(type), card = frame.locator(`[data-piece="${NAMES[type]}"]`);
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
      if (tab === 'Cards') for (const card of DEAL_CARDS) expect(await frame.locator(`[data-card="${card}"] .cf-text small`).textContent()).toBe(ruleLine(cardText(card, DEFAULT_RULES)));
      if (tab === 'Powers') for (const [power, line] of Object.entries(data.powers)) expect(await frame.locator(`[data-power="${power}"] dd`).first().textContent()).toBe(webWords(balanced[power] ?? line));
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
    expect(await frame.locator('#badge-detail').textContent()).toBe('Earned 10 Oct 2026');
    expect(await frame.locator('.scrim').count()).toBe(1);
    expect(await frame.locator('#badge-close').evaluate(el => el === document.activeElement)).toBe(true);
    await frame.locator('#badge-close').click();
    await expect.poll(() => frame.locator('.scrim').count()).toBe(0);
    expect(await frame.locator('#over').isVisible()).toBe(false);
    expect(await frame.locator('[data-badge="first_win"] button').evaluate(el => el === document.activeElement)).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.sheet)).toBeUndefined();
  } finally { release?.(); await page.close(); }
});

it('shortens a long name in the Profile title and keeps its full title text', async () => {
  const page=await open(), frame=page.frameLocator('iframe'), name='wwwwwwwwwwwwwwwwwwww';
  try {
    await page.setViewportSize({width:320,height:568});
    await frame.locator('html').evaluate(async (_,name)=>{
      const app=(window as any).harnessApp; await app.call('kingdown_handle',{handle:name,icon:'spirit'}); app.navigate('profile');
    },name);
    await frame.locator('#page-title').filter({hasText:name}).waitFor();
    expect(await frame.locator('#page-title').getAttribute('title')).toBe(name);
    expect(await frame.locator('#page-title').evaluate(e=>({overflow:getComputedStyle(e).overflow,ellipsis:getComputedStyle(e).textOverflow,space:getComputedStyle(e).whiteSpace}))).toEqual({overflow:'hidden',ellipsis:'ellipsis',space:'nowrap'});
  } finally {await page.close();}
});

it('gives games with the same opponent a colour and start time in both lists', async () => {
  const page=await open(),frame=page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 320, height: 568 });
    const entries=[0,1].map(n=>({game_id:`same-opponent-${n}`,kind:'friend',speed:'daily',status:'setup',seat:0,action:'ready',turn:0,revision:0,deadline_at:null,opponent:{handle:'same player',icon:null,computer:false,deleted:false,last_seen_ms:null},updated_at:'2026-10-15T12:00:00Z',created_at:`2026-10-15T12:0${n}:34Z`,options:null,move:null,open_until:null,level:'club'}));
    await page.request.post(new URL('/fixture-seed',harness.url).href,{data:{actor:'alice',data:{games:entries}}});
    await frame.locator('html').evaluate(async()=>{const app=(window as any).harnessApp; await app.call('kingdown_games',{}); app.navigate('play');});
    const rows=await frame.locator('#games-list [data-game-id^="same-opponent-"] .line').allTextContents();
    expect(rows).toHaveLength(2); expect(rows[0]).toContain('White'); expect(rows[0]).not.toBe(rows[1]);
    for (const row of rows) { expect(row).toMatch(/\d{1,2}:\d{2}/); expect(row).not.toMatch(/\d{1,2}:\d{2}:\d{2}/); }
    const lines = await frame.locator('#games-list [data-game-id^="same-opponent-"] .line').evaluateAll(elements => elements.flatMap(e => {
      const lines = new Map<number, string>(), walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) for (let i = 0; i < walker.currentNode.textContent!.length; i++) {
        const range = document.createRange(); range.setStart(walker.currentNode, i); range.setEnd(walker.currentNode, i + 1);
        const top = Math.round(range.getBoundingClientRect().top);
        lines.set(top, (lines.get(top) ?? '') + walker.currentNode.textContent![i]);
      }
      return [...lines.values()].map(line => line.trim());
    }));
    for (const line of lines) expect(line).not.toMatch(/·$/);
    await frame.locator('html').evaluate(()=>{(window as any).harnessApp.navigate('profile');});
    const first=frame.locator('#profile-open [data-game-id="same-opponent-0"] small').last(), second=frame.locator('#profile-open [data-game-id="same-opponent-1"] small').last();
    await first.waitFor(); expect(await first.textContent()).toContain('White'); expect(await first.textContent()).not.toBe(await second.textContent());
    for (const row of await frame.locator('#profile-open small').allTextContents()) expect(row).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
  } finally {await page.close();}
});
