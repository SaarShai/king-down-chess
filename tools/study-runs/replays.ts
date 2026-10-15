import { readFileSync, lstatSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { verifyBundle, sha256, type FrozenRunBundle } from './bundle';
import { canonicalMeasurementJSON as canonical } from '../../src/study/measurement-plan';
import { stampOf } from '../../src/sim/run';
import { startGame } from '../../src/sim/game';
import { createStudy, positionData, withRules } from '../../src/study/model';
import { studySource } from '../lib/study-source';
import { toFen } from '../../src/rules/setup';
import type { ExecutedGame } from './execution';
import type { ReplayBatch } from '../../src/study/discovery-scan';
function bytes(path: string, limit: number): Buffer {
  const stat=lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size>limit) throw new Error('Unsafe or oversized replay input.');
  return readFileSync(path);
}
/** Read collected files only. This path cannot dispatch, collect or poll a worker. */
export function exportReplays(directory: string): ReplayBatch {
  const bundle=JSON.parse(bytes(join(directory,'bundle.json'),16*1024*1024).toString()) as FrozenRunBundle;
  verifyBundle(bundle);
  const validation=JSON.parse(bytes(join(directory,'validation.json'),65536).toString());
  if (!['passed','incomplete'].includes(validation.state) || validation.bundleHash!==bundle.hash) throw new Error('This run has no valid local replay evidence.');
  if (bundle.games>200) throw new Error('This run exceeds the 200-game scan limit. Select a smaller local run.');
  const batch: ReplayBatch={schema:'kingdown-replays/1',run:bundle.id,bundle:bundle.hash,source:bundle.source,games:[]};
  const seen=new Set<number>(); let actions=0;
  for (const part of bundle.parts) {
    const root=join(directory,'parts',part.id);
    if (!existsSync(join(root,'games.jsonl')) && validation.state==='incomplete') continue;
    const raw=bytes(join(root,'games.jsonl'),32*1024*1024), hash=sha256(raw);
    const attestation=JSON.parse(bytes(join(root,'attestation.json'),65536).toString());
    if (!attestation.sourceVerified || attestation.bundleHash!==bundle.hash || attestation.partId!==part.id || attestation.gamesSha256!==hash || attestation.sourceManifestHash!==sha256(canonical(bundle.sourceManifest)) || attestation.nodeVersion!==bundle.nodeVersion) throw new Error('Replay attestation differs.');
    if (raw.length && raw[raw.length-1]!==10) throw new Error('Torn replay record.');
    for (const line of new TextDecoder('utf-8',{fatal:true}).decode(raw).split('\n').filter(Boolean)) {
      const row=JSON.parse(line) as ExecutedGame;
      if (row.bundleHash!==bundle.hash || row.partId!==part.id || !part.jobIndexes.includes(row.index) || seen.has(row.index)) throw new Error('Replay job differs.');
      seen.add(row.index);
      const {spec,job}=bundle.prepared.jobs[row.index], record=row.record, stamp=stampOf(spec,bundle.source);
      for (const key of Object.keys(stamp) as (keyof typeof stamp)[]) if (canonical(record[key])!==canonical(stamp[key])) throw new Error('Replay stamp differs.');
      for (const key of ['gameId','pairId','colourSwapped','configId','seed','backRankWhite','backRankBlack'] as const) if (record[key]!==job[key]) throw new Error('Replay schedule differs.');
      actions+=record.moves.length;
      if (actions>20000 || record.moves.length>1000 || record.plies!==record.moves.length) throw new Error('Replay action limit or count differs.');
      const start=withRules(stamp.rules,()=>positionData(startGame(job.backRankWhite,job.backRankBlack,job.fen).pos));
      if (toFen({...start,board:new Uint8Array(start.board)} as ReturnType<typeof startGame>['pos'])!==record.startFen) throw new Error('Replay start differs.');
      const study=createStudy({ id:`${bundle.id}:${part.id}:${record.gameId}`,version:1,parentVersion:null,title:`Game ${record.gameId} · ${record.reason}`,question:'Which observed interaction needs an expected check?',engine:studySource(),rules:stamp.rules,
        ...(stamp.rules.design ? {design:{code:stamp.rules.design.code!,version:1}} : {}),start,prefix:[],actions:record.moves.map(m=>m.lan),origin:'constructed' });
      batch.games.push({study,provenance:{kind:'run-replay',inputHash:hash,source:bundle.source,run:bundle.id,part:part.id,game:record.gameId,pair:record.pairId,spec:stamp.specKey,settings:JSON.parse(canonical({spec,reason:record.reason,result:record.result,bundle:bundle.hash,validation:validation.state,expectedGames:bundle.games}))}});
    }
  }
  if (!batch.games.length || batch.games.length!==validation.games) throw new Error('Replay count differs from validation.');
  return batch;
}
