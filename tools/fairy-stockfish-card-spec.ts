/** Frozen card-only repair comparison against both unchanged opponents. */
import {matchSpec,type MatchSpec} from './fairy-stockfish-match';
export const CARD_REPAIR_APPROVAL="go ahead. analyze the card-game losses, build the held-out test set, and fix the confirmed search or evaluation issues. verify the improvements against both AIs. only check runs at expected completion times, and don't merge yet.";
export function cardRepairSpec(baselinePatchSha256:string):MatchSpec{
 if(!/^[a-f0-9]{64}$/.test(baselinePatchSha256))throw Error('Baseline patch hash required');
 const spec=matchSpec(false,1000,184211);
 const jobs=spec.jobs.filter(j=>j.stratum==='cards-balanced').flatMap(j=>[undefined,'native-baseline' as const].map(opponent=>({...j,opponent,stratum:opponent?'cards-native-baseline':'cards-current'}))).map((j,id)=>({...j,id}));
 return {...spec,id:'fairy-card-repair-20261012',approval:CARD_REPAIR_APPROVAL,baselinePatchSha256,jobs,parts:[{name:'pilot',ids:jobs.slice(0,4).map(j=>j.id)},...Array.from({length:5},(_,i)=>({name:'wave'+i,ids:jobs.slice(4).filter(j=>Math.floor((j.id-4)/4)%5===i).map(j=>j.id)}))]};
}
