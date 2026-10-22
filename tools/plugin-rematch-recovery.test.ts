import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { startHarness, waitForSourceApp } from './plugin-ui-harness';

let folder: string, browser: Browser, harness: Awaited<ReturnType<typeof startHarness>>;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-rematch-recovery-'));
  const boardPath = join(folder, 'board.html');
  await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true });
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });

it.each([{ remount: false, permanent: false }, { remount: true, permanent: false }, { remount: false, permanent: true }])('keeps the result after a failed rematch load (remount $remount, permanent $permanent)', async ({ remount, permanent }) => {
  const page = await browser.newPage(), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(5000);
  try {
    await page.goto(harness.url); await waitForSourceApp(page);
    await frame.locator('#home-games:not(:disabled)').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    const tool = async (name: string, args: object) => {
      const result = await (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name, arguments: args } })).json();
      expect(result.isError).toBeFalsy(); return result;
    };
    const created = await tool('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
    const game = created._meta.view;
    const resigned = await tool('kingdown_resign', { game_id: game.game_id, command_id: crypto.randomUUID(), expected_revision: game.revision });
    const ended = resigned._meta.view;
    expect(ended).toMatchObject({ status: 'finished' });
    await page.evaluate(result => (window as any).harnessShow(result), await tool('kingdown_open', { game_id: ended.game_id }));
    await frame.locator('#over[open]').waitFor();
    await page.evaluate(permanent => { (window as any).rejectNextAction = { name: 'kingdown_resume', code: permanent ? 'MATCH_INCOMPATIBLE' : 'UNAVAILABLE', text: 'Rematch load failed' }; }, permanent);
    await frame.locator('html').evaluate(async (_, ended) => {
      await (window as any).harnessApp.call('kingdown_rematch', { game_id: ended.game_id, command_id: crypto.randomUUID(), expected_revision: ended.revision, choice: 'offer' }, true);
    }, ended);
    await frame.locator('#over #error').filter({ hasText: 'Rematch load failed' }).waitFor();
    expect(await frame.locator('#over #error').innerText()).toBe('Rematch load failed');
    const saved = await page.evaluate(() => ({ view: (window as any).harnessView, state: (window as any).harnessWidgetState }));
    expect(saved.view.game_id).toBe(ended.game_id);
    expect(saved.state.privateContent.screen).toBe('end');
    if (permanent) {
      expect(saved.state.privateContent.pending).toBeUndefined();
      expect(await frame.locator('#over #retry').isVisible()).toBe(false);
    } else {
      expect(saved.state.privateContent.pending.name).toBe('kingdown_resume');
      expect(saved.state.privateContent.pending.args.game_id).toBeUndefined();
    }
    const newGame = saved.view.rematch_game_id;
    expect(newGame).toBeTruthy();
    // A redraw must not retry the failed selection by itself.
    await frame.locator('html').evaluate(() => (window as any).harnessApp.store.sync());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_resume').length)).toBe(1);
    if (permanent) return;
    if (remount) {
      await page.locator('#remount').click(); await waitForSourceApp(page);
      await frame.locator('#over #retry:not(:disabled)').waitFor();
    }
    await frame.locator('#over #retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(newGame);
    const resumes = await page.evaluate(() => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_resume'));
    expect(resumes).toHaveLength(2);
    expect(resumes[1].arguments).toEqual(resumes[0].arguments);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_rematch').length)).toBe(1);
  } finally { await page.close(); }
}, 20_000);
