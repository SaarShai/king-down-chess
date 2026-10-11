/** Detached shard entry. The caller freezes the spec and owns machine scheduling. */
import { readFileSync, writeFileSync, mkdirSync, createWriteStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { isMainThread, parentPort, workerData, type Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { comboSchedule, comboGameSpec, comboReport, digest, type ComboSpec, type ComboJob, type ComboRecord } from './combinations';
import { tsWorker } from './ts-worker';
import { playGame } from './game';
import { sourceId } from './identity';
import { traceActions } from './action-trace';

if(!isMainThread){
  const s=workerData as ComboSpec;
  parentPort!.on('message',(job:ComboJob)=>{
    const spec=comboGameSpec(s,job),record={...playGame(spec,job),rules:spec.rules};
    parentPort!.postMessage({job,source:s.source,specHash:digest(s),record,trace:traceActions(record,spec.rules as ComboSpec['rules'])});
  });
}
export async function runPart(s:ComboSpec,blocks:number[],part:string,workers:number,outDir='sim/out'){
  if(!/^[a-z0-9-]+$/.test(part)||!Number.isInteger(workers)||workers<1||workers>8||!blocks.length||new Set(blocks).size!==blocks.length||blocks.some(b=>!Number.isInteger(b)||b<0||b>=s.blocks))throw new Error('Invalid shard or workers');
  if(sourceId()!==s.source)throw new Error('Source differs from frozen spec');
  const jobs=comboSchedule(s).filter(j=>blocks.includes(j.block));
  mkdirSync(outDir,{recursive:true});const stem=`${outDir}/${s.id}.${part}`;
  if(existsSync(`${stem}.jsonl`)||existsSync(`${stem}.status.json`))throw new Error('Part already exists; do not repeat it');
  writeFileSync(`${stem}.spec.json`,JSON.stringify(s,null,2)+'\n',{flag:'wx'});
  const out=createWriteStream(`${stem}.jsonl`,{flags:'wx'}),start=Date.now(),pool:Worker[]=[],retired=new Set<Worker>();let next=0,done=0,exit=1;
  const status={id:s.id,part,blocks,source:s.source,specHash:digest(s),approval:s.approval,workers,expected:jobs.length,startedAt:new Date(start).toISOString()};
  writeFileSync(`${stem}.launch.json`,JSON.stringify(status,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(status));
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    await new Promise<void>((ok,fail)=>{
      out.on('error',fail);
      timer=setTimeout(()=>fail(new Error('Eight-hour compute limit')),8*60*60*1000);
      for(let i=0;i<Math.min(workers,jobs.length);i++){
        const w=tsWorker(new URL(import.meta.url),{workerData:s});pool.push(w);
        w.on('error',fail);w.on('exit',code=>{if(!retired.has(w))fail(new Error(`Worker stopped: ${code}`));});
        w.on('message',(row:ComboRecord)=>{out.write(JSON.stringify(row)+'\n');done++;if(done%20===0)console.log(`${done}/${jobs.length} games; ${Math.round((Date.now()-start)/1000)} seconds`);
          if(next<jobs.length)w.postMessage(jobs[next++]);else{retired.add(w);void w.terminate();if(done===jobs.length)ok();}
        });
        w.postMessage(jobs[next++]);
      }
    });exit=0;
  }finally{
    if(timer)clearTimeout(timer);for(const w of pool){retired.add(w);void w.terminate();}
    await new Promise<void>(r=>out.end(r));
    writeFileSync(`${stem}.status.json`,JSON.stringify({...status,exit,games:done,seconds:(Date.now()-start)/1000,finishedAt:new Date().toISOString()},null,2)+'\n');
  }
}
if(isMainThread&&process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [cmd,specFile,...args]=process.argv.slice(2);const s=JSON.parse(readFileSync(specFile,'utf8')) as ComboSpec;
  if(cmd==='run'){
    const opts:Record<string,string>={};for(let i=0;i<args.length;i+=2){if(!['--blocks','--part','--workers','--out'].includes(args[i])||!args[i+1])throw new Error('Invalid option');opts[args[i]]=args[i+1];}
    await runPart(s,(opts['--blocks']??'').split(',').map(Number),opts['--part'],Number(opts['--workers']),opts['--out']);
  }else if(cmd==='report'){
    const rows=args.flatMap(f=>readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l) as ComboRecord));
    console.log(JSON.stringify(comboReport(s,rows),null,2));
  }else throw new Error('Use run or report');
}
