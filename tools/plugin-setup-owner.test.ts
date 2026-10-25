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
  const page = await browser.newPage({ viewport: {width:390,height:844} }); page.setDefaultTimeout(3000);
  await page.goto(harness.url); return page;
}
const sent = (page: import('playwright').Page, name: string) => page.evaluate(name => (window as any).harnessCalls.filter((call: any) => call.name === name).length, name);

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
    expect.soft(await frame.locator('#friend-help').textContent()).toContain('types the code in Menu.');
  } finally { await page.close(); }
});
