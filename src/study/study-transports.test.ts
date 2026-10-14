import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createTransports } from '../../tools/study-runs/transports';
import type { DispatchInput } from '../../tools/study-runs/transport-types';
const temps:string[]=[];
afterEach(async()=>{await Promise.all(temps.splice(0).map(p=>rm(p,{recursive:true,force:true})));});
async function fixture():Promise<DispatchInput>{const directory=await mkdtemp(join(tmpdir(),'kd-transport-'));temps.push(directory);const sourceArchive=join(directory,'source.tar.gz'),bundlePath=join(directory,'bundle.json');await writeFile(sourceArchive,'frozen source');await writeFile(bundlePath,'{}');return {runId:'run-one',bundleHash:'a'.repeat(64),partId:'part-one',machine:'m1',workers:8,directory,sourceArchive,bundlePath,nodeVersion:'26.0.0',limitSeconds:28800};}
describe('study transport boundaries',()=>{
  it('checks all identity facts and availability before each mutation',async()=>{
    const calls:string[]=[];const input=await fixture();const {m1}=createTransports('/not-read',async(command,args)=>{expect(command).toBe('ssh');calls.push(args.at(-1)!);return '';});
    await m1.preflight(input);const receipt=await m1.launch(input);expect(receipt.remoteId).toContain('run-one-part-one');
    for(const call of calls){expect(call).toContain('id -un');expect(call).toContain('MacBook-Pro-2');expect(call).toContain('MacBookPro18,2');expect(call).toContain('SHA256:e2GtnqVZpq4rDNvFsAayCsdu1iSqkFoX8CJCkxazwcM');}
    expect(calls[0]).toContain('AC Power');expect(calls.at(-1)).toContain('nohup python3');
  });
  it('stops on identity failure before a mutation',async()=>{
    const calls:string[]=[];const input=await fixture();const {m1}=createTransports('/not-read',async(_command,args)=>{calls.push(args.at(-1)!);throw new Error('identity mismatch');});
    await expect(m1.launch(input)).rejects.toThrow();expect(calls).toHaveLength(1);expect(calls[0]).not.toContain('cat >');
  });
  it('rejects unsafe identities and keeps failed checks unknown',async()=>{
    const input=await fixture();let calls=0;const {m1}=createTransports('/not-read',async()=>{calls++;throw new Error('offline');});
    await expect(m1.preflight({...input,runId:'../other'})).rejects.toThrow('identity');expect(calls).toBe(0);
    expect((await m1.status(input,null)).state).toBe('unknown');
  });
  it('does not match its own availability command',()=>{
    expect(execFileSync('sh',['-c','! pgrep -f "[k]d-study-availability-test-never-running" >/dev/null'],{encoding:'utf8'})).toBe('');
  });
  it('checks Python supervisor, capacity and decoded backup proof with fakes',()=>{
    expect(execFileSync('python3',['tools/study-runs/transport_checks.py'],{encoding:'utf8'})).toContain('PASS');
  });
});
