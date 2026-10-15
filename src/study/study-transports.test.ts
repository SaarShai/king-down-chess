import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createTransports } from '../../tools/study-runs/transports';
import type { DispatchInput } from '../../tools/study-runs/transport-types';
const temps:string[]=[];
afterEach(async()=>{await Promise.all(temps.splice(0).map(p=>rm(p,{recursive:true,force:true})));});
async function fixture():Promise<DispatchInput>{const directory=await mkdtemp(join(tmpdir(),'kd-transport-'));temps.push(directory);const sourceArchive=join(directory,'source.tar.gz'),bundlePath=join(directory,'bundle.json');await writeFile(sourceArchive,'frozen source');await writeFile(bundlePath,JSON.stringify({hash:'a'.repeat(64),id:'run-one',nodeVersion:'26.0.0',parts:[{id:'part-one',machine:'m1',workers:8}],sourceArchiveSha256:createHash('sha256').update('frozen source').digest('hex')}));return {runId:'run-one',bundleHash:'a'.repeat(64),partId:'part-one',machine:'m1',workers:8,directory,sourceArchive,bundlePath,nodeVersion:'26.0.0',limitSeconds:28800};}
describe('study transport boundaries',()=>{
  it('keeps large frozen inputs out of notebook source',async()=>{
    const input=await fixture();input.machine='kaggle';input.workers=4;
    const archive=Buffer.alloc(2_000_000,123);await writeFile(input.sourceArchive,archive);
    const bundle=JSON.parse(await readFile(input.bundlePath,'utf8'));bundle.parts[0].machine='kaggle';bundle.parts[0].workers=4;
    bundle.sourceArchiveSha256=createHash('sha256').update(archive).digest('hex');await writeFile(input.bundlePath,JSON.stringify(bundle));
    await mkdir(join(input.directory,'.secrets'));await writeFile(join(input.directory,'.secrets/kaggle_api_token'),'fixture');
    const {kaggle}=createTransports(input.directory,async(_command,_args,options)=>{
      const call=JSON.parse(options!.input!);
      if(call.action==='launch')expect(call.datasetName).toBe('kd-input-'+createHash('sha256').update(input.bundleHash+'|'+input.partId).digest('hex').slice(0,32));
      if(call.action==='status'||call.action==='collect')expect(call.folder).toBe(join(input.directory,'kaggle-part-one'));
      return JSON.stringify({remoteId:'test/run-one',state:'complete'});
    });
    await kaggle.preflight(input);await kaggle.launch(input);
    expect((await kaggle.status(input,null)).state).toBe('complete');
    await kaggle.collect(input,null,join(input.directory,'collected'));
    const folder=join(input.directory,'kaggle-part-one');
    expect((await readFile(join(folder,'run.py'))).length).toBeLessThan(1_000_000);
    expect(await readFile(join(folder,'payload/source.bin'))).toEqual(archive);
    expect(await readFile(join(folder,'payload/bundle.bin'))).toEqual(await readFile(input.bundlePath));
    expect(await readFile(join(folder,'run.py'),'utf8')).toContain(bundle.sourceArchiveSha256);
  });
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
  it('checks real work without matching its own availability command',async()=>{
    let command='';const {m1}=createTransports('/not-read',async(_command,args)=>{command=args.at(-1)!;return '';});
    await m1.preflight(await fixture());
    const pattern=command.match(/! pgrep -f "([^"]+)"/);expect(pattern).not.toBeNull();
    const matcher=new RegExp(pattern![1]);expect(matcher.test(command)).toBe(false);
    for(const actual of ['node src/sim/study-runner.ts','node src/sim/tournament.ts','Adobe Illustrator','Adobe Photoshop','ollama runner'])expect(matcher.test(actual)).toBe(true);
  });
  it('checks Python supervisor, capacity and decoded backup proof with fakes',()=>{
    expect(execFileSync('python3',['tools/study-runs/transport_checks.py'],{encoding:'utf8'})).toContain('PASS');
  });
});
