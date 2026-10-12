import { expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHarness } from './plugin-ui-harness';

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
