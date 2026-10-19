import { expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { framePolicy, startHarness } from './plugin-ui-harness';

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
