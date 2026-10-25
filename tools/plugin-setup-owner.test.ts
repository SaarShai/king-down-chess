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
    await frame.locator('#home-games:not(:disabled)').click();
    await frame.locator('#setup-options summary').click();
    await frame.locator('#setup-level').fill(String(position));
    await frame.locator('#setup-start').click();
    await expect.poll(() => sent(page, 'kingdown_create')).toBe(1);
    expect(await page.evaluate(() => (window as any).harnessCalls.find((c: any) => c.name === 'kingdown_create').arguments.level)).toBe(engine);
  } finally { await page.close(); }
});
it('F-113 closes the options by default and starts with the defaults', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games:not(:disabled)').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('#setup-options').evaluate(e => (e as HTMLDetailsElement).open)).toBe(false);
    for (const name of ['Computer','A friend','A random player']) expect(await frame.getByRole('radio', {name,exact:true}).isVisible()).toBe(true);
    expect(await frame.locator('.new-game-panel #new-game-head').textContent()).toBe('New game');
    await frame.locator('#setup-options summary').click();
    await frame.getByRole('radio', {name:'A friend',exact:true}).locator('..').click();
    expect(await frame.locator('#setup-options').evaluate(e => (e as HTMLDetailsElement).open)).toBe(true);
    await frame.getByRole('radio', {name:'Computer',exact:true}).locator('..').click();
    await frame.locator('#setup-options summary').click();
    const calls = await sent(page, 'kingdown_create');
    await frame.locator('#setup-start').click();
    await expect.poll(() => sent(page, 'kingdown_create')).toBe(calls + 1);
    await frame.locator('[data-screen="seat"]:not([hidden]), [data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
