import { z } from 'zod';
import { parseStudy, type Study } from './model';
import { scanReplay, type Provenance, type Candidate } from './discovery';
export interface ReplayBatch { schema:'kingdown-replays/1'; run:string; bundle:string; source:string; games:{study:Study;provenance:Omit<Provenance,'action'|'actor'>}[] }
const text=z.string().min(1).max(2000), hash=z.string().regex(/^[a-f0-9]{64}$/);
const schema=z.strictObject({schema:z.literal('kingdown-replays/1'),run:text,bundle:hash,source:text,games:z.array(z.strictObject({study:z.unknown(),provenance:z.strictObject({kind:z.literal('run-replay'),inputHash:hash,source:text,run:text,part:text,game:z.number().int().nonnegative(),pair:z.number().int().nonnegative(),spec:text,settings:z.json()})})).min(1).max(200)});
export function parseReplayBatch(input:unknown, source:string): ReplayBatch {
  if(new TextEncoder().encode(JSON.stringify(input)).length>32*1024*1024) throw new Error('Replay input exceeds 32 MiB.');
  const batch=schema.parse(input);
  if(batch.source!==source) throw new Error('Replay simulation source differs.');
  const games=batch.games.map(g=>({...g,study:parseStudy(g.study)}));
  if(games.reduce((n,g)=>n+g.study.actions.length+g.study.prefix.length,0)>20000) throw new Error('Scan exceeds 20,000 actions.');
  if(new Set(games.map(g=>`${g.provenance.part}:${g.provenance.game}`)).size!==games.length) throw new Error('Duplicate replay game.');
  for(const game of games) if(game.provenance.source!==batch.source || game.provenance.run!==batch.run || game.provenance.kind!=='run-replay') throw new Error('Replay provenance differs.');
  return {...batch,games};
}
export async function scanBatch(input:unknown, source:string, engine:string, threshold:number):Promise<Candidate[]> {
  if(!Number.isInteger(threshold)||threshold<1||threshold>10000) throw new Error('Choose a legal-action threshold from 1 to 10,000.');
  const batch=parseReplayBatch(input,source), candidates:Candidate[]=[];
  for(const game of batch.games) candidates.push(...await scanReplay(game.study,game.provenance,engine,threshold));
  return candidates;
}
