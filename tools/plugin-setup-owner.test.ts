import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 15000, hookTimeout: 60000 });
let folder: string;
let browser: Browser, harness: Awaited<ReturnType<typeof startHarness>>;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-setup-owner-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath: process.env.KINGDOWN_SETUP_BASELINE || boardPath, sourcePage: !process.env.KINGDOWN_SETUP_BASELINE });
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open() {
  // A loaded verify runner took over 3 s for the first click after load (run 40262605705).
  const page = await browser.newPage({ viewport: {width:390,height:844} }); page.setDefaultTimeout(5000);
  await page.goto(harness.url); return page;
}
const sent = (page: import('playwright').Page, name: string) => page.evaluate(name => (window as any).harnessCalls.filter((call: any) => call.name === name).length, name);

it('F-117 loads no card painting until the Cards section shows, then tile thumbnails until a card opens', async () => {
  // New game builds every card tile at start; an eager painting would load all of them in each page.
  const page = await browser.newPage({ viewport: {width:390,height:844} }), frame = page.frameLocator('iframe'), cards: string[] = [];
  page.setDefaultTimeout(5000); page.on('request', r => { if (r.resourceType() === 'image' && /\/card(?:s|-thumbs)\/[^/?]+\.webp/.test(r.url())) cards.push(r.url()); });
  try {
    await page.goto(harness.url);
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate(() => new Promise(done => setTimeout(done, 500)));
    expect(cards).toEqual([]);
    await frame.locator('#setup-options summary').click(); await frame.locator('#setup-toggle-cards').check();
    await expect.poll(() => cards.length).toBeGreaterThan(0);
    // A tile is 264 CSS px wide at most, so it loads the small thumbnail; the full card loads the full painting.
    expect(cards.filter(url => !url.includes('/card-thumbs/'))).toEqual([]);
    await frame.locator('#setup-card-Haste').click(); await frame.locator('#menu-sheet .cf-art img').waitFor();
    await expect.poll(() => cards.some(url => url.includes('/cards/haste.webp'))).toBe(true);
  } finally { await page.close(); }
});
it('F-117 gives the widest card tile two thumbnail pixels for each CSS pixel', async () => {
  // From 640 to 899 px the 560 px New game box makes the widest tile; ChatGPT inline (760 px) is one of them.
  const page = await browser.newPage({ viewport: {width:760,height:900} }), frame = page.frameLocator('iframe'), img = frame.locator('#setup-card-Haste .cf-art img');
  page.setDefaultTimeout(5000);
  try {
    await page.goto(harness.url);
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#setup-options summary').click(); await frame.locator('#setup-toggle-cards').check();
    await img.scrollIntoViewIfNeeded(); await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
    const [css, pixels] = await img.evaluate((i: HTMLImageElement) => [i.getBoundingClientRect().width, i.naturalWidth]);
    expect(css).toBeGreaterThan(260);
    expect(pixels).toBeGreaterThanOrEqual(2 * css);
  } finally { await page.close(); }
});
it('F-109 puts Settings before Profile with one line per row', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    const rows = frame.locator('[data-screen="play"] > .new-game-body > button[data-nav]');
    expect(await rows.evaluateAll(rows => rows.map(row => [row.getAttribute('data-nav'), row.textContent?.trim(), row.querySelector('.line')]))).toEqual([
      ['settings', 'Settings›', null], ['profile', 'Profile›', null],
    ]);
    await rows.first().click(); await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('F-110 puts only White and Black below The game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('#setup-game-heading').evaluate(e => e.nextElementSibling?.id)).toBe('setup-colour');
    expect(await frame.locator('#setup-colour input').evaluateAll(inputs => inputs.map(i => (i as HTMLInputElement).value))).toEqual(['white', 'black']);
    expect(await frame.locator('#setup-colour').textContent()).not.toContain('You play');
  } finally { await page.close(); }
});
it('F-111 removes the kings-off panel and keeps King powers', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('#setup-kings-off').count()).toBe(0);
    await frame.locator('#setup-options summary').click();
    await frame.getByRole('checkbox', { name: 'King powers', exact: true }).check();
    expect(await frame.locator('#setup-your-king').isVisible()).toBe(true);
  } finally { await page.close(); }
});
it('F-112 uses a three-stop Level slider and the engine map', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor(); await frame.locator('#setup-options summary').click();
    const slider = frame.getByRole('slider', { name: 'Level', exact: true });
    expect(await slider.evaluate(e => [e.getAttribute('min'), e.getAttribute('max'), e.getAttribute('step')])).toEqual(['0','2','1']);
    expect((await slider.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await slider.focus(); await page.keyboard.press('Home');
    for (const [index, label] of [[0,'Casual'],[1,'Clever'],[2,'Club']] as const) {
      if (index) await page.keyboard.press('ArrowRight');
      expect(await slider.inputValue()).toBe(String(index)); expect(await slider.getAttribute('aria-valuetext')).toBe(label);
      expect(await frame.locator('#level-line').textContent()).not.toBe('');
    }
  } finally { await page.close(); }
});
it.each([[0,'beginner'],[1,'casual'],[2,'club']] as const)('F-112 sends stop %s as %s', async (position, engine) => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#setup-options summary').click();
    await frame.locator('#setup-level').fill(String(position));
    expect(await frame.locator('#setup-level').inputValue()).toBe(String(position));
    await frame.locator('#setup-start').click();
    // A loaded CI runner can take more than the 1 s poll default to send Create.
    await expect.poll(() => sent(page, 'kingdown_create'), { timeout: 5000 }).toBe(1);
    expect(await page.evaluate(() => (window as any).harnessCalls.find((c: any) => c.name === 'kingdown_create').arguments.level)).toBe(engine);
  } finally { await page.close(); }
});
it('F-113 closes the options by default and starts with the defaults', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('#setup-options').evaluate(e => (e as HTMLDetailsElement).open)).toBe(false);
    for (const name of ['Artificial','A friend','Random']) expect(await frame.getByRole('radio', {name,exact:true}).isVisible()).toBe(true);
    expect(await frame.locator('.new-game-panel #new-game-head').textContent()).toBe('New game');
    await frame.locator('#setup-options summary').click();
    await frame.getByRole('radio', {name:'A friend',exact:true}).locator('..').click();
    expect(await frame.locator('#setup-options').evaluate(e => (e as HTMLDetailsElement).open)).toBe(true);
    await frame.getByRole('radio', {name:'Artificial',exact:true}).locator('..').click();
    await frame.locator('#setup-options summary').click();
    const calls = await sent(page, 'kingdown_create');
    await frame.locator('#setup-start').click();
    await expect.poll(() => sent(page, 'kingdown_create'), { timeout: 5000 }).toBe(calls + 1);
    await frame.locator('[data-screen="seat"]:not([hidden]), [data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});

it.each([[1280, 'light'], [390, 'light'], [1280, 'dark'], [390, 'dark']] as const)('F-114 shows plain game type icons at %s pixels in %s device mode', async (width, colorScheme) => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width, height: 844 }); await page.emulateMedia({ colorScheme });
    await frame.locator('#home-games:not(:disabled)').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    const modes = frame.locator('#setup-body .modes');
    expect(await modes.locator('img').count()).toBe(0);
    for (const [value, name, symbol] of [['solo', 'Artificial', 'brain'], ['friend', 'A friend', 'smiling-pawn'], ['random', 'Random', 'die']]) {
      const radio = modes.getByRole('radio', { name, exact: true }), label = radio.locator('..');
      expect(await radio.inputValue()).toBe(value);
      expect(await label.locator('b').textContent()).toBe(name);
      expect(await label.locator('svg[aria-hidden="true"] use').getAttribute('href')).toBe(`#i-${symbol}`);
      expect(await frame.locator(`symbol#i-${symbol}`).getAttribute('viewBox')).toBe('0 0 24 24');
      const box = (await label.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48); expect(box.height).toBeGreaterThanOrEqual(48);
      await label.click(); expect(await radio.isChecked()).toBe(true);
    }
    await modes.getByRole('radio', { name: 'Artificial', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    expect(await modes.getByRole('radio', { name: 'A friend', exact: true }).isChecked()).toBe(true);
    expect(await modes.locator('label:has(input:focus-visible)').evaluate(e => getComputedStyle(e).outlineStyle)).toBe('solid');
  } finally { await page.close(); }
});
it('F-114 has the same game type symbols in both source sprites', async () => {
  const sprites = await Promise.all(['src/plugin/index.html', 'index.html'].map(path => readFile(path, 'utf8')));
  for (const name of ['brain', 'smiling-pawn', 'die']) {
    const symbols = sprites.map(html => html.match(new RegExp(`<symbol id="i-${name}"[^>]*>[\\s\\S]*?</symbol>`))?.[0]);
    expect(symbols[0]).toContain('viewBox="0 0 24 24"'); expect(symbols[1]).toBe(symbols[0]);
  }
  const local = sprites[1].match(/<fieldset class="modes"[\s\S]*?<\/fieldset>/)![0];
  expect(local).not.toContain('<img');
  expect(local).toContain('href="#i-brain"'); expect(local).toContain('href="#i-smiling-pawn"'); expect(local).toContain('href="#i-crown"');
});

it('F-115 names the main menu in the heading, back controls and invite help', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect.soft(await frame.locator('[data-screen="play"] > .new-game-head h2').textContent()).toBe('Menu');
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click();
    expect.soft(await frame.locator('#page-back').textContent()).toBe('‹ Menu');
    for (const screen of ['seat', 'board']) expect.soft(await frame.locator(`[data-screen="${screen}"] .table-back`).getAttribute('aria-label')).toBe('Back to Menu');
    await frame.locator('#page-back').click();
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    await frame.locator('#friend-new').click(); await frame.locator('#friend-code span').first().waitFor();
    expect.soft(await frame.locator('#friend-help').textContent()).toContain('types the code in Menu.');
  } finally { await page.close(); }
});

async function sections() {
  const page = await open(), frame = page.frameLocator('iframe');
  await frame.locator('#home-games:not(:disabled)').click();
  await frame.locator('#setup-options summary').click();
  return { page, frame };
}
it('F-116 opens kinds inline and locks a seven-piece pool', async () => {
  const {page, frame} = await sections();
  try {
    expect(await frame.locator('#setup-pieces, #setup-cards').count()).toBe(0);
    await frame.locator('#setup-toggle-fairy').uncheck();
    await frame.locator('#fairy-heading').click({force:true});
    expect(await frame.locator('#fairy-body').isHidden()).toBe(true);
    await frame.locator('#setup-toggle-fairy').check();
    expect(await frame.locator('#fairy-heading').getAttribute('aria-expanded')).toBe('true');
    expect(await frame.locator('#fairy-body .pick-list input').count()).toBe(10);
    expect(await frame.locator('#fairy-body').innerText()).toContain('The king and the pawns are always in.');
    for (const box of await frame.locator('#fairy-body .pick-list input').all()) if (await box.isChecked() && await box.isEnabled()) await box.uncheck();
    expect(await frame.locator('#fairy-body .lock-note').isVisible()).toBe(true);
    expect(await frame.locator('#fairy-body input:checked:disabled').count()).toBeGreaterThan(0);
    await frame.locator('#fairy-heading').focus(); await page.keyboard.press('Enter');
    expect(await frame.locator('#fairy-body').isHidden()).toBe(true);
    await page.keyboard.press('Space');
    expect(await frame.locator('#fairy-body').isVisible()).toBe(true);
    await frame.locator('#setup-toggle-fairy').uncheck();
    expect(await frame.locator('#fairy-heading').getAttribute('aria-expanded')).toBe('false');
  } finally { await page.close(); }
});
it.each([['Player',true],['Random',false]] as const)('F-116 sends First rank sorting %s', async (label, value) => {
  const {page, frame} = await sections();
  try {
    await frame.locator('#setup-toggle-fairy').check();
    await frame.locator('#setup-sorting').getByRole('radio',{name:label,exact:true}).locator('..').click();
    await frame.locator('#setup-start').click();
    await expect.poll(()=>sent(page,'kingdown_create'),{timeout:5000}).toBe(1);
    expect(await page.evaluate(()=>(window as any).harnessCalls.find((c:any)=>c.name==='kingdown_create').arguments.options.arrangement)).toBe(value);
  } finally { await page.close(); }
});
it.each([1280,390,320])('F-117 shows all cards in a bounded box at %s pixels', async width => {
  const {page, frame} = await sections();
  try {
    await page.setViewportSize({width,height:width===320?568:844});
    await frame.locator('#setup-toggle-cards').check();
    const grid=frame.locator('#setup-card-pool');
    expect(await grid.locator('[data-card]').count()).toBe(21);
    expect(await grid.locator('small, .cf-cost').count()).toBe(0);
    expect(await grid.locator('.cf-art').count()).toBe(21);
    expect(await grid.locator('b').allTextContents()).toHaveLength(21);
    expect(await grid.evaluate(e=>({scroll:e.scrollHeight>e.clientHeight,contain:getComputedStyle(e).overscrollBehaviorY,overflow:getComputedStyle(e).overflowY}))).toEqual({scroll:true,contain:'contain',overflow:'auto'});
    expect(await frame.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    expect(await frame.locator('#setup-body').textContent()).not.toContain('These are examples');
    expect(await frame.locator('#setup-deal, #setup-deal-note, #setup-card-grid').count()).toBe(0);
    const box=grid.locator('input').first(); const bounds=(await box.locator('..').boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    await box.uncheck(); expect(await frame.locator('#menu-sheet').count()).toBe(0);
    expect(await grid.locator('.out').count()).toBe(1);
    const tile=grid.locator('[data-card="Haste"] button'); await tile.click();
    expect(await frame.locator('#menu-sheet small').textContent()).not.toBe('');
    expect(await frame.locator('#menu-sheet .cf-cost').textContent()).not.toBe('');
    await frame.locator('#menu-close').click();
    expect(await tile.evaluate(e=>e===document.activeElement)).toBe(true);
    await frame.locator('#setup-toggle-cards').uncheck();
    expect(await frame.locator('#cards-heading').getAttribute('aria-expanded')).toBe('false');
  } finally {await page.close();}
});
it('F-117 guards Create and applies both card pool limits inline', async () => {
  const {page, frame}=await sections();
  try {
    await frame.locator('#setup-toggle-cards').check();
    const cards=frame.locator('#cards-body');
    await cards.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
    await cards.locator('input[type="checkbox"]').nth(0).check();
    await cards.locator('input[type="checkbox"]').nth(1).check();
    expect(await frame.locator('#setup-card-status').innerText()).toBe('Pick 2 more cards.');
    await frame.locator('#cards-heading').click(); await frame.locator('#setup-options summary').click();
    await frame.locator('#setup-start').click();
    expect(await frame.locator('#setup-card-status').isVisible()).toBe(true);
    expect(await sent(page,'kingdown_create')).toBe(0);
    for(const i of [2,3]) await cards.locator('input[type="checkbox"]').nth(i).check();
    expect(await cards.locator('input[type="checkbox"]:not(:checked):disabled').count()).toBe(17);
    await cards.getByRole('radio',{name:'Use all cards',exact:true}).locator('..').click();
    const boxes=cards.locator('input[type="checkbox"]');
    for (let i=20;i>=4;i--) await boxes.nth(i).uncheck();
    expect(await cards.locator('input[type="checkbox"]:checked:disabled').count()).toBe(4);
    expect(await frame.locator('#setup-card-lock').isVisible()).toBe(true);
    await boxes.nth(4).check(); expect(await boxes.nth(0).isEnabled()).toBe(true);
    await cards.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
    await cards.getByRole('radio',{name:'Use all cards',exact:true}).locator('..').click();
    expect(await cards.locator('input[type="checkbox"]:checked').count()).toBe(5);
  } finally {await page.close();}
});
it('F-117 keeps Open games on New game with an incomplete Pick four pool', async () => {
  const {page, frame}=await sections();
  try {
    await frame.locator('#setup-body .modes').getByRole('radio',{name:'Random',exact:true}).locator('..').click();
    await frame.locator('#setup-toggle-cards').check();
    const cards=frame.locator('#cards-body');
    await cards.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
    for(const i of [0,1]) await cards.locator('input[type="checkbox"]').nth(i).check();
    await frame.locator('#cards-heading').click();
    await frame.locator('#play-open').click();
    expect(await frame.locator('[data-screen="lobby"]').isHidden()).toBe(true);
    expect(await frame.locator('#cards-body').isVisible()).toBe(true);
    await expect.poll(()=>frame.locator('#setup-start-status').textContent()).toBe('Pick 2 more cards.');
    expect(await sent(page,'kingdown_find')).toBe(0);
  } finally {await page.close();}
});
it('F-117 speaks the incomplete pool on each blocked Start and keeps focus', async () => {
  const {page, frame}=await sections();
  try {
    await frame.locator('#setup-toggle-cards').check();
    const cards=frame.locator('#cards-body'), live=frame.locator('#setup-start-status');
    await cards.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
    await cards.locator('input[type="checkbox"]').nth(0).check();
    expect(await live.getAttribute('role')).toBe('status');
    await live.evaluate(e=>{ (window as any).liveTexts=[]; new MutationObserver(()=>(window as any).liveTexts.push(e.textContent)).observe(e,{childList:true,characterData:true,subtree:true}); });
    for (const press of [1,2]) {
      await frame.locator('#setup-start').focus(); await page.keyboard.press('Enter');
      await expect.poll(()=>frame.locator('html').evaluate(()=>(window as any).liveTexts.filter((t:string)=>t==='Pick 3 more cards.').length)).toBe(press);
      expect(await frame.locator('#setup-start').evaluate(e=>e===document.activeElement)).toBe(true);
    }
    expect(await sent(page,'kingdown_create')).toBe(0);
  } finally {await page.close();}
});
it('F-117 clears the Start status when the pool fault changes or ends', async () => {
  const {page, frame}=await sections();
  try {
    await frame.locator('#setup-toggle-cards').check();
    const cards=frame.locator('#cards-body'), boxes=cards.locator('input[type="checkbox"]'), live=frame.locator('#setup-start-status');
    await cards.getByRole('radio',{name:'Pick four',exact:true}).locator('..').click();
    await boxes.nth(0).check();
    await live.evaluate(e=>{ (window as any).liveTexts=[]; new MutationObserver(()=>(window as any).liveTexts.push(e.textContent)).observe(e,{childList:true,characterData:true,subtree:true}); });
    await frame.locator('#setup-start').click();
    await expect.poll(()=>live.textContent()).toBe('Pick 3 more cards.');
    for (const i of [1,2,3]) await boxes.nth(i).check();
    expect(await live.textContent()).toBe('');
    await boxes.nth(3).uncheck();
    expect(await live.textContent()).toBe('');
    await frame.locator('#setup-start').click();
    await expect.poll(()=>live.textContent()).toBe('Pick 1 more card.');
    await frame.locator('#setup-toggle-cards').uncheck();
    expect(await live.textContent()).toBe('');
    // The card status speaks each pool change, so only the two blocked presses write words here.
    expect(await frame.locator('html').evaluate(()=>(window as any).liveTexts.filter(Boolean))).toEqual(['Pick 3 more cards.','Pick 1 more card.']);
    expect(await sent(page,'kingdown_create')).toBe(0);
  } finally {await page.close();}
});
