// Temporary ticket 55 probe. Compare one variable at a time; keep the shared package link unchanged.
import { beforeAll, afterAll, it, expect } from 'vitest';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHarness } from './plugin-ui-harness';
import { launch, trapErrors } from './lib/checks.mjs';

let folder: string, minimal: Awaited<ReturnType<typeof startHarness>>, built: Awaited<ReturnType<typeof startHarness>>;
beforeAll(async () => {
 folder = await mkdtemp(join(tmpdir(), 'kingdown-retention-'));
 await writeFile(join(folder, 'minimal.html'), '<html><head></head><body>fixture</body></html>');
 execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', join(folder, 'built')], {stdio:'pipe'});
 minimal = await startHarness({boardPath:join(folder, 'minimal.html')});
 built = await startHarness({boardPath:join(folder, 'built/board.html')});
}, 30000);
afterAll(async () => { await minimal?.close(); await built?.close(); await rm(folder, {recursive:true,force:true}); });
const rss = () => execFileSync('ps', ['-eo', 'rss=,comm='], {encoding:'utf8'}).split('\n').reduce((total, row) => {
 const match = row.match(/^\s*(\d+)\s+(.+)$/);
 return total + (match && /WebProcess/.test(match[2]) ? Number(match[1]) / 1024 : 0);
}, 0);

it.each([
 ['minimal', false, false, false, false, false], ['minimal', true, false, false, false, false],
 ['built', false, false, false, false, false], ['built', true, false, false, false, false],
 ['built', true, true, false, false, false], ['built', true, false, true, false, false],
 ['built', true, false, false, true, false], ['built', true, false, false, false, true],
] as const)('retention: %s clock=%s ports=%s teardown=%s dispose=%s preClear=%s', async (kind, clock, closePorts, teardown, dispose, preClear) => {
 const name = `${kind}-clock-${clock}-close-${closePorts}-teardown-${teardown}-dispose-${dispose}-preClear-${preClear}`;
 const handles: Map<any, Error> = (globalThis as any).leakedJSHandles;
 expect(typeof handles?.get).toBe('function'); handles.clear();
 const browser = await launch({headless:true, channel:'webkit'});
 try {
  const page = await browser.newPage(), errors = trapErrors(page);
  if (dispose) page.on('console', message => { for (const arg of message.args()) void arg.dispose().catch(() => {}); });
  await page.addInitScript(() => {
   if (window !== top) (window as any).widgetBallast = new Uint8Array(96 * 1024 * 1024).fill(1);
   else (window as any).oldFrames = [];
  });
  if (clock) await page.clock.install();
  if (closePorts) await page.route('**/board-resource', async route => {
   const response = await route.fetch(), body = await response.text();
   expect(body).toContain('channel.port1.onmessage = resolve');
   await route.fulfill({response, body:body.replace('channel.port1.onmessage = resolve', 'channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve(); }')});
  });
  await page.goto((kind === 'minimal' ? minimal : built).url);
  const ready = async (n: number) => {
   await page.waitForFunction(n => (window as any).harnessBoots === n, n);
   if (kind === 'built') {
    await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
    await page.frameLocator('iframe').locator('#board[aria-busy="false"]').waitFor({state:'attached'});
   } else await page.frameLocator('iframe').locator('body').evaluate(async () => { await (window as any).harnessBoot; });
  };
  await ready(1); const before = rss();
  for (let n = 2; n <= 7; n++) {
   await page.frameLocator('iframe').locator('body').evaluate(body => {
    const button = document.createElement('button'); button.id = 'probe-click'; button.textContent = 'probe';
    button.style.cssText = 'position:fixed;left:0;top:0;width:48px;height:48px;z-index:2147483647'; body.append(button);
   });
   await page.frameLocator('iframe').locator('#probe-click').click();
   await page.evaluate(() => (window as any).oldFrames.push(new WeakRef(document.querySelector('iframe')!)));
   if (teardown) await page.evaluate(() => (window as any).harnessTeardown());
   if (preClear) await page.evaluate(() => { console.clear(); (document.querySelector('#remount') as HTMLButtonElement).click(); });
   else await page.locator('#remount').click();
   await ready(n);
  }
  const beforeGC = rss(); await page.requestGC(); await page.requestGC();
  const afterGC = rss(), oldFrames = await page.evaluate(() => (window as any).oldFrames.map((ref: WeakRef<Element>) => !!ref.deref()));
  console.log('[retention]', JSON.stringify({name, before, beforeGC, afterGC, oldFrames,
   hitHandles:[...handles.values()].filter(e => e.stack?.includes('_checkFrameIsHitTarget')).length}));
  const body = await page.locator('body').elementHandle();
  const serverHandle = [...handles.keys()].find(h => h._context?.delegate?._session);
  expect(serverHandle).toBeTruthy();
  const heap = await serverHandle._context.delegate._session.send('Heap.snapshot');
  await mkdir('/tmp/kingdown-check-runs', {recursive:true});
  await writeFile(`/tmp/kingdown-check-runs/${name}-heap.json`, JSON.stringify(heap));
  await body!.dispose();
  expect(await page.evaluate(() => (window as any).harnessBoots)).toBe(7);
  expect(errors).toEqual([]);
  if (kind === 'minimal' && !clock) {
   await page.reload(); await ready(1); await page.requestGC(); await page.requestGC();
   console.log('[retention-reload]', JSON.stringify({name, afterReload:rss()}));
   const current = await page.locator('body').elementHandle();
   const currentServer = [...handles.keys()].find(h => h._context?.delegate?._session);
   expect(currentServer).toBeTruthy();
   const afterReload = await currentServer._context.delegate._session.send('Heap.snapshot');
   await writeFile(`/tmp/kingdown-check-runs/${name}-reload-heap.json`, JSON.stringify(afterReload));
   await current!.dispose();
   expect(await page.evaluate(() => (window as any).harnessBoots)).toBe(1);
   expect(errors).toEqual([]);
  }
 } finally { await browser.close(); }
}, 30000);
