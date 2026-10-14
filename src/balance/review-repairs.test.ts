import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {checkCampaignRows,checkedRaw} from './campaign';
import {auditDesign} from './design';
import {currentCheck} from './report';
import {DEFAULT_RULES} from '../rules/rules';
import {unknownContext} from './measurements';
import {matchesTarget} from './context';

it('refuses altered raw bytes and incomplete or mismatched provenance schedules',()=>{
 const dir=mkdtempSync(join(tmpdir(),'campaign-check-'));
 try {
  const p=join(dir,'raw.jsonl'),r={gameId:0,pairId:0,seed:8,result:1,plies:10,rulesKey:'full'};
  const bytes=JSON.stringify(r)+'\n';writeFileSync(p,bytes);const digest=createHash('sha256').update(bytes).digest('hex');
  expect(checkedRaw(p,digest)).toEqual([r]);
  checkCampaignRows([r],[{gameId:0,pairId:0,seed:8}],{rulesKey:'full'});
  expect(()=>checkCampaignRows([r], [{gameId:0,seed:9}])).toThrow('seed');
  expect(()=>checkCampaignRows([], [{gameId:0}])).toThrow('incomplete');
  expect(()=>checkCampaignRows([r,r], [{gameId:0}])).toThrow('duplicate');
  expect(()=>checkCampaignRows([r],[{gameId:0}],{rulesKey:'other'})).toThrow('stamp');
  writeFileSync(p,bytes+'\n');expect(()=>checkedRaw(p,digest)).toThrow('raw hash');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
it('detects pool and price drift',()=>{
 const input={matrixDoc:readFileSync('docs/MATRIX.md','utf8'),rulesDoc:readFileSync('docs/RULES.md','utf8'),rulesSource:readFileSync('src/rules/rules.ts','utf8')};
 expect(auditDesign({...input,pool:'QORRBBNNAAGMMS'}).some(f=>f.code==='POOL_DRIFT')).toBe(true);
 expect(auditDesign({...input,prices:{1:100}}).some(f=>f.code==='PRICE_DRIFT')).toBe(true);
});
it('keeps classic odds distinct and rejects a queue commit or changed depth',()=>{
 const c={...unknownContext(),flags:{...DEFAULT_RULES},flagsKind:'full' as const,sourceHash:'source',specKey:'spec',pool:'pool',depth:3,settings:{kind:'classic-odds'},variantScope:'none' as const};
 const t={sourceHash:'source',specKey:'spec',pool:'pool',flags:{...DEFAULT_RULES},depth:3,mode:'classic-odds' as const,reason:'checked',priceReview:'checked'};
 expect(matchesTarget(c,[t])).toBe(true);expect(matchesTarget(c,[{...t,mode:'ordinary'}])).toBe(false);
 expect(matchesTarget({...c,commitSource:'queue'},[t])).toBe(false);expect(matchesTarget({...c,depth:4},[t])).toBe(false);
});
it('does not accept game-level report intervals for a decision',()=>{
 const c={...unknownContext(),flags:{...DEFAULT_RULES},flagsKind:'full' as const,sourceHash:'s',specKey:'k',pool:'p',settings:{entrants:['none']},variantScope:'none' as const};
 const t={sourceHash:'s',specKey:'k',pool:'p',flags:{...DEFAULT_RULES},mode:'ordinary' as const,reason:'checked',priceReview:'checked'};
 const m={id:'x',run:'x',element:'Archer',version:'x',context:c,measure:'activity' as const,criterion:'piece-moves',value:1,error:.1,errorKind:'95% normal interval over games as stored in report',sample:20,sampleUnit:'games' as const,unit:'ratio',validity:'valid' as const,reasons:[],sources:[],method:'report'};
 expect(currentCheck([m],[t],'Archer',{id:'piece-moves',scope:'piece',target:{min:.5,max:1.5},status:'adopted',sourceIds:[],approvalSourceIds:null,notes:null}).status).toBe('no-data');
});

it('imports a complete raw worth campaign through the report with its calibrated envelope',async()=>{
 const {mkdirSync,copyFileSync}=await import('node:fs');
 const {buildJobs,loadSpec}=await import('../sim/spec');
 const {valueSpecs}=await import('../sim/experiments');
 const {stampOf}=await import('../sim/run');
 const {importCampaign}=await import('./campaign');
 const {buildFramework}=await import('./report');
 const {readWorkbook}=await import('./workbook');
 const root=mkdtempSync(join(tmpdir(),'campaign-e2e-')),dir=join(root,'campaign'),out=join(root,'m1/kd-balance-20261009');
 const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
 try{
  mkdirSync(join(dir,'analysis-source'),{recursive:true});mkdirSync(out,{recursive:true});mkdirSync(join(root,'docs/balance'),{recursive:true});mkdirSync(join(root,'src/rules'),{recursive:true});mkdirSync(join(root,'out'));
  for(const f of ['docs/MATRIX.md','docs/RULES.md','src/rules/rules.ts','docs/balance/evidence.json'])copyFileSync(f,join(root,f));
  const id='worth-fixture',args=['--id',id,'--games','100','--seed','8','--depth','3'];
  const arms=valueSpecs(loadSpec(args),'N','O').map(spec=>({spec,jobs:buildJobs(spec),stamp:stampOf(spec)}));
  const checks=[];
  for(const a of arms){
   const pawn=a.spec.id.endsWith('.pawn');
   const rows=a.jobs.map(j=>{const score=j.pairId%10<(pawn?2:5)?1:0;const {fen,...job}=j;return {...job,...(fen?{startFen:fen}:{}),...a.stamp,result:j.colourSwapped?1-score:score,plies:20,reason:'checkmate',moves:[]};});
   const bytes=rows.map(r=>JSON.stringify(r)+'\n').join('');writeFileSync(join(out,a.spec.id+'.jsonl'),bytes);checks.push({id:a.spec.id,sha256:hash(bytes)});
  }
  const count=arms.reduce((n,a)=>n+a.jobs.length,0),archive='fixture source bytes';writeFileSync(join(dir,'source.tar'),archive);writeFileSync(join(dir,'analysis-source/fixture.txt'),archive);
  writeFileSync(join(dir,'campaign.json'),JSON.stringify({commit:'fixture',sourceArchiveSha256:hash(archive),files:{'fixture.txt':hash(archive)},runs:[{id,kind:'m1',expectedGames:count,args}]}));
  writeFileSync(join(dir,id+'.provenance.json'),JSON.stringify({commit:'fixture',src:arms[0].stamp.src,sourceArchiveSha256:hash(archive),command:args,pool:'QOLRRBBNNAAGMMS',arms}));
  writeFileSync(join(dir,'worth-counts-stamps-check.json'),JSON.stringify({arms:checks}));writeFileSync(join(out,id+'.status.json'),JSON.stringify({state:'finished',exitCode:0,commit:'fixture'}));
  const d={schemaVersion:1 as const,measurements:[] as import('./measurements').Measurement[],sources:[],runs:[],warnings:[]};importCampaign(dir,d);
  expect(d.measurements).toHaveLength(1);const m=d.measurements[0];expect(m.interval?.kind).toContain('not a joint confidence');expect(m.context.settings?.kind).toBe('classic-odds');
  const target={sourceHash:m.context.sourceHash,specKey:m.context.specKey,pool:m.context.pool,flags:m.context.flags,mode:'classic-odds',depth:3,reason:'fixture source checked',priceReview:'fixture reference'};
  writeFileSync(join(root,'docs/balance/target-contexts.json'),JSON.stringify({contexts:[target]}));
  buildFramework(root,d,readWorkbook('docs/status/king-down-status-2026-10-09.xlsx','docs/status/king-down-status-2026-10-09.xlsx'),join(root,'out'));
  const status=JSON.parse(readFileSync(join(root,'out/status.json'),'utf8'));expect(status.statuses.find((s:any)=>s.element==='Ogre'&&s.criterion==='piece-worth').evidence).toContain(m.id);
  const raw=join(out,arms[0].spec.id+'.jsonl');writeFileSync(raw,readFileSync(raw,'utf8')+'\n');expect(()=>importCampaign(dir,d)).toThrow('raw hash');
 }finally{rmSync(root,{recursive:true,force:true});}
});

it('rejects a stale workbook hash and altered exported cells',async()=>{
 const {execFileSync}=await import('node:child_process');const dir=mkdtempSync(join(tmpdir(),'balance-workbook-'));
 try {
  const original=JSON.parse(readFileSync('docs/balance/workbook.json','utf8')),p=join(dir,'workbook.json');
  for(const edited of [{...original,sha256:'0'.repeat(64)},{...original,sheets:[]}]){
   writeFileSync(p,JSON.stringify(edited));
   try {execFileSync(process.execPath,['--import','tsx','tools/check-balance.ts','--workbook',p],{stdio:'pipe'});throw new Error('Unexpected valid workbook');} catch(e:any) {expect(e.stdout.toString()).toMatch(/WORKBOOK_(HASH|EXPORT)_MISMATCH/);}
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});

it('requires dealt-card provenance for a derived card target',()=>{
 const flags={...DEFAULT_RULES},c={...unknownContext(),flags,flagsKind:'full' as const,stampSource:'derived' as const,sourceHash:'s',specKey:'k',pool:'p',depth:3,settings:{entrants:['cards4','none'],cardPool:['March','Salvation'],effectiveRulesHash:'hands'},variantScope:'none' as const};
 const target={sourceHash:'s',specKey:'k',pool:'p',flags,mode:'cards' as const,depth:3,cardPool:['March','Salvation'],effectiveRulesHash:'hands',reason:'fixture',priceReview:'fixture'};
 expect(matchesTarget(c,[target])).toBe(true);
 expect(matchesTarget(c,[{...target,effectiveRulesHash:undefined}])).toBe(false);
 expect(matchesTarget(c,[{...target,cardPool:['March']}])).toBe(false);
});
