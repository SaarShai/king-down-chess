import { proposals, scenario, coverage, scanReplay, promote, digest, type DiscoveryDocument, type Obligation, type Provenance } from './discovery';
import { scanBatch } from './discovery-scan';
import type { Study } from './model';
import type { Fact } from './check';
export type DiscoveryRequest =
  | { type:'plan'; study:Study; scope:string[]; budget:number; documents:DiscoveryDocument[] }
  | { type:'scenario'; study:Study; obligation:Obligation }
  | { type:'scan'; batch:unknown; threshold:number }
  | { type:'study-scan'; study:Study; checks:Fact[]; threshold:number }
  | { type:'promote'; document:DiscoveryDocument; study:Study; checks:Fact[]; provenance:Provenance; basis:string; confirmed:boolean; obligation:string|null };
export async function discoveryService(request:DiscoveryRequest,engine:string,source:string):Promise<unknown> {
  switch(request.type) {
    case 'plan': { const set=await proposals(request.study,request.scope,request.budget); const rows=await coverage(request.study,set,request.documents);
      const priority=(id:string)=> {const state=rows.find(r=>r.obligation.id===id)!.state;return state==='failed'?0:state==='stale'?1:2;};
      set.obligations.sort((a,b)=>priority(a.id)-priority(b.id));
      set.selected=set.obligations.slice(0,request.budget).map(o=>o.id);set.omitted=set.obligations.slice(request.budget).map(o=>o.id);
      rows.sort((a,b)=>set.obligations.findIndex(o=>o.id===a.obligation.id)-set.obligations.findIndex(o=>o.id===b.obligation.id));
      return {set,rows}; }
    case 'scenario': return scenario(request.study,request.obligation);
    case 'scan': return scanBatch(request.batch,source,engine,request.threshold);
    case 'study-scan': return scanReplay(request.study,{kind:'study-replay',inputHash:await digest(request.study),source:request.study.engine,run:null,part:null,game:null,pair:null,spec:null,settings:{threshold:request.threshold}},engine,request.threshold,request.checks);
    case 'promote': return promote(request.document,request.study,request.checks,request.provenance,request.basis,request.confirmed,request.obligation);
  }
}
const host=self as unknown as {onmessage:(event:MessageEvent<DiscoveryRequest>)=>void;postMessage(value:unknown):void};
host.onmessage=async ({data})=> {
  try { host.postMessage({result:await discoveryService(data,__STUDY_SOURCE__,__SIM_SOURCE__)}); }
  catch(error) {host.postMessage({error:error instanceof Error?error.message:String(error)});}
};
