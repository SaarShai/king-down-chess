import { expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { framePolicy, startHarness } from './plugin-ui-harness';
import { launch, trapErrors } from './lib/checks.mjs';

it('frees the old widget message events after a remount', async () => {
 const folder = await mkdtemp(join(tmpdir(), 'kingdown-harness-retention-'));
 const boardPath = join(folder, 'board.html');
 // The real boot shim sends the message that the SDK logs. No board is needed.
 await writeFile(boardPath, '<html><head></head><body>fixture</body></html>');
 const harness = await startHarness({boardPath});
 const browser = await launch({headless:true, channel:process.env.PLAYABLE_BROWSER || 'chromium'});
 try {
  const page = await browser.newPage(), errors = trapErrors(page);
  await page.addInitScript(() => {
   if (window !== top) return;
   (window as any).bootEvents = [];
   addEventListener('message', event => {
    if (event.data?.harness === 'boot') (window as any).bootEvents.push(new WeakRef(event));
   });
  });
  await page.goto(harness.url);
  await page.waitForFunction(() => (window as any).harnessBoots === 1);
  await page.evaluate(() => console.error('Harness error before remount'));
  await page.locator('#remount').click();
  await page.waitForFunction(() => (window as any).harnessBoots === 2);
  await expect.poll(async () => {
   await page.requestGC();
   return page.evaluate(() => (window as any).bootEvents[0].deref() === undefined);
  }, {timeout:5000}).toBe(true);
  expect(errors).toContain('console.error: Harness error before remount');
 } finally { await browser.close(); await harness.close(); await rm(folder, {recursive:true,force:true}); }
}, 30000);

it('lets screen checks seed one record and call any friend tool', async () => {
 const folder = await mkdtemp(join(tmpdir(),'kingdown-harness-test-')), boardPath = join(folder,'board.html');
 await writeFile(boardPath,'<html><head></head><body>fixture</body></html>');
 const harness = await startHarness({boardPath});
 try {
  const record = {totals:{played:4,won:2,drawn:1,lost:1},rating:{rating:1540,rd:180,volatility:.06,provisional:true},badges:[{badge:'first_win',earned_at:'2026-10-01T00:00:00.000Z'}]};
  const seed = await fetch(new URL('/fixture-seed',harness.url),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({actor:'alice',data:{record}})});
  expect(seed.status).toBe(200);
  const call = async (path:string,name:string,args={},fresh=false) => (await fetch(new URL(path,harness.url),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,arguments:args,fresh})})).json();
  expect((await call('/fixture-tool','kingdown_profile'))._meta.record).toEqual(record);
  expect((await call('/fixture-friend-tool','kingdown_profile'))._meta.handle).toMatch(/^host1-/);
  expect((await call('/fixture-friend-tool','kingdown_profile',{},true))._meta.handle).toMatch(/^host2-/);
 } finally {await harness.close();await rm(folder,{recursive:true,force:true});}
},15000);

it('builds the frame CSP, sandbox and allow list from the resource metadata as the MCP Apps spec does', () => {
 const declared = framePolicy({ui:{csp:{resourceDomains:['https://art.example'],connectDomains:['https://api.example']},permissions:{clipboardWrite:{},camera:{}}}});
 expect(declared.csp).toBe("default-src 'none'; script-src 'self' 'unsafe-inline' https://art.example; style-src 'self' 'unsafe-inline' https://art.example; connect-src 'self' https://api.example; img-src 'self' data: https://art.example; font-src 'self' https://art.example; media-src 'self' data: https://art.example; frame-src 'none'; object-src 'none'; base-uri 'self'");
 expect(declared.allow).toBe('camera; clipboard-write');
 expect(declared.sandbox).toBe('allow-scripts allow-same-origin allow-forms');
 expect(framePolicy({ui:{csp:{frameDomains:['https://frame.example'],baseUriDomains:['https://base.example']}}}).csp).toContain("frame-src https://frame.example; object-src 'none'; base-uri https://base.example");
 // With no ui.csp, the spec's restrictive default applies: no network at all.
 expect(framePolicy({}).csp).toBe("default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'none'");
 expect(framePolicy({}).allow).toBe('');
});
