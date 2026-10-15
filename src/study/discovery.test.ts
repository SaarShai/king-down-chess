import { describe, it, expect } from 'vitest';
import { exampleStudies } from './examples';
import { proposals, scenario, newDiscovery, promote, coverage, digest, parseDiscovery, scanReplay, type Provenance } from './discovery';
import { checkStudy } from './check';
import { loadDiscoveries, loadStudies, saveDiscoveryDocument, saveStudyDocument } from './store';
import { parseReplayBatch, scanBatch } from './discovery-scan';
const engine='test-engine', parent=()=>exampleStudies(engine)[0].study;
const scope=['piece:R','rule:blockers','card:Haste','power:Frost:Freeze'];
function storage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};}
async function fixture(){
  const study=parent(),set=await proposals(study,scope),obligation=set.obligations.find(o=>o.template==='extra-action')!,test=scenario(study,obligation),doc=await newDiscovery(study,set);
  const provenance:Provenance={kind:'scenario',inputHash:await digest(test),source:engine,run:null,part:null,game:null,pair:null,spec:null,settings:{template:'extra-action'},action:2,actor:0};
  return {study,set,obligation,test,doc,provenance};
}
describe('interaction discovery',()=>{
  it('enumerates stable pairs, ownership and order without hiding unsupported cells',async()=>{
    const a=await proposals(parent(),scope,2),b=await proposals(parent(),[...scope].reverse(),24);
    expect(a.selected).toEqual(b.selected.slice(0,2));expect(a.obligations).toEqual(b.obligations);
    expect(a.selected.length+a.omitted.length).toBe(a.obligations.length);
    expect(a.obligations.some(o=>!o.template)).toBe(true);
    await expect(proposals(parent(),['piece:R','piece:R'])).rejects.toThrow(/distinct/);
    await expect(proposals(parent(),['piece:R','missing'])).rejects.toThrow(/Unknown/);
    await expect(proposals(parent(),scope,0)).rejects.toThrow(/budget/);
    const kings=await proposals(parent(),['power:Frost:Freeze','power:Flame:Strike']);
    expect(kings.exclusions).toHaveLength(1);
  });
  it('runs three authored positive and negative fixture families and rejects altered rules',async()=>{
    const set=await proposals(parent(),scope),templates=set.obligations.filter(o=>o.template);
    expect(new Set(templates.map(o=>o.template)).size).toBe(3);
    for(const cell of templates){const test=scenario(parent(),cell);expect(checkStudy(test,engine).status).toBe('passed');expect(test.checks.some(f=>f.kind==='legal'&&!f.expected)).toBe(true);}
    const changed=parent();changed.rules.markTurns=2;
    expect(()=>scenario(changed,templates[0])).toThrow(/changed rule/);
  });
  it('keeps a designer-declared failure visible, binds source, and preserves full histories',async()=>{
    const f=await fixture(),checks=structuredClone(f.test.checks);checks.find(c=>c.id==='same-side')!.expected=1;
    const next=await promote(f.doc,f.test.study,checks,f.provenance,'Design decision: turn must pass',true,f.obligation.id);
    expect(checkStudy(next.entries[0].test,engine).status).toBe('failed');
    expect(next.entries[0].test.study.actions).toEqual(f.test.study.actions);
    expect((await coverage(f.study,f.set,[next])).find(r=>r.obligation.id===f.obligation.id)?.state).toBe('failed');
    const updated={...f.study,engine:'new-source'},fresh=await proposals(updated,scope);
    expect((await coverage(updated,fresh,[next])).some(r=>r.state==='stale')).toBe(true);
    await expect(promote(f.doc,f.test.study,checks,f.provenance,'',true,null)).rejects.toThrow(/basis/);
    await expect(promote(f.doc,f.test.study,checks,f.provenance,'Rule',false,null)).rejects.toThrow(/confirm/);
  });
  it('saves both halves atomically, detects edits, survives reload and exports, and repeats idempotently',async()=>{
    const f=await fixture(),s=storage();saveStudyDocument(f.study,s);
    const next=await promote(f.doc,f.test.study,f.test.checks,f.provenance,'Authored test',true,f.obligation.id);
    const before=s.getItem('kingdown.studies');
    await expect(saveDiscoveryDocument(next,{getItem:s.getItem,setItem(){throw new Error('Quota');}})).rejects.toThrow('Quota');
    expect(s.getItem('kingdown.studies')).toBe(before);
    await saveDiscoveryDocument(next,s);
    expect(loadStudies(s).documents).toHaveLength(2);
    expect(await loadDiscoveries(s)).toEqual([next]);
    const repeated=await promote(next,f.test.study,f.test.checks,f.provenance,'Authored test',true,f.obligation.id);
    expect(repeated.entries).toHaveLength(1);
    await saveDiscoveryDocument(JSON.parse(JSON.stringify(repeated)),s);
    expect(loadStudies(s).documents).toHaveLength(2);
    const corrupt=structuredClone(next);corrupt.entries[0].test.study.actions[0]='illegal';
    await expect(parseDiscovery(corrupt)).rejects.toThrow(/binding/);
    await expect(parseDiscovery({...next,unexpected:true})).rejects.toThrow();
    expect(saveStudyDocument({...f.study,version:2,parentVersion:1},s).ok).toBe(true);
    expect(await loadDiscoveries(s)).toEqual([next]);
  });
  it('scans actual actors, keeps extra-action histories, and rejects an illegal negative control',async()=>{
    const study=exampleStudies(engine)[1].study;
    const source={kind:'study-replay' as const,inputHash:await digest(study),source:engine,run:null,part:null,game:null,pair:null,spec:null,settings:{threshold:1}};
    const candidates=await scanReplay(study,source,engine,1);
    expect(candidates.some(c=>c.signals.some(s=>s.includes('Extra action')))).toBe(true);
    expect(candidates.every(c=>c.provenance.actor===0)).toBe(true);
    expect(candidates[0].study.start).toEqual(study.start);
    expect(candidates[0].study.actions).toEqual(study.actions.slice(0,candidates[0].provenance.action));
    await expect(scanReplay({...study,actions:['Qa1-a8']},source,engine)).rejects.toThrow(/Illegal/);
    await expect(scanReplay(study,source,'wrong')).rejects.toThrow(/source/);
    const other={...study,prefix:[study.actions[0]],actions:[study.actions[1]]};
    const more=await scanReplay(other,{...source,inputHash:await digest(other)},engine,1);
    expect(more.map(c=>c.id)).not.toEqual(candidates.map(c=>c.id));
  });
  it('bounds a full batch before scanning and refuses mismatched provenance',async()=>{
    const study=exampleStudies(engine)[1].study;
    const batch={schema:'kingdown-replays/1' as const,run:'run',bundle:'a'.repeat(64),source:'simulation',games:[{study,provenance:{kind:'run-replay' as const,inputHash:'b'.repeat(64),source:'simulation',run:'run',part:'m1',game:1,pair:1,spec:'spec',settings:{reason:'plyCap'}}}]};
    expect((await scanBatch(batch,'simulation',engine,1)).length).toBeGreaterThan(0);
    expect(()=>parseReplayBatch(batch,'other')).toThrow(/source/);
    expect(()=>parseReplayBatch({...batch,games:Array(201).fill(batch.games[0])},'simulation')).toThrow();
    expect(()=>parseReplayBatch({...batch,games:[batch.games[0],batch.games[0]]},'simulation')).toThrow(/Duplicate/);
    await expect(scanBatch(batch,'simulation',engine,0)).rejects.toThrow(/threshold/);
  });
});

it('does not turn an unrelated assertion into interaction coverage',async()=>{
  const f=await fixture();
  const irrelevant=[{id:'unrelated',label:'Ply counter at start',after:0,kind:'state' as const,field:'ply' as const,expected:0}];
  const saved=await promote(f.doc,f.test.study,irrelevant,f.provenance,'A counter alone is not an interaction check',true,f.obligation.id);
  expect((await coverage(f.study,f.set,[saved])).find(r=>r.obligation.id===f.obligation.id)?.state).toBe('blocked');
});
it('preserves exact scope bindings and refuses a missing parent before import',async()=>{
  const f=await fixture(),s=storage();
  await expect(saveDiscoveryDocument(f.doc,s)).rejects.toThrow(/parent/);
  saveStudyDocument(f.study,s);
  const before=s.getItem('kingdown.studies');
  await expect(saveDiscoveryDocument({...f.doc,context:'f'.repeat(64)},s)).rejects.toThrow(/binding/);
  expect(s.getItem('kingdown.studies')).toBe(before);
});
