import {expect,test,afterEach} from 'vitest';
import {cardRepairSpec,CARD_REPAIR_APPROVAL} from './fairy-stockfish-card-spec';
import {DEFAULT_RULES,setRules} from '../src/rules/rules';
afterEach(()=>setRules(DEFAULT_RULES));
test('card repair pairs both colours and both opponents with one frozen deal per army',()=>{
 const s=cardRepairSpec('a'.repeat(64));expect(s.jobs).toHaveLength(96);expect(s.seed).toBe(184211);expect(s.approval).toBe(CARD_REPAIR_APPROVAL);
 expect(s.parts[0].ids).toEqual([0,1,2,3]);expect(s.parts.flatMap(p=>p.ids).sort((a,b)=>a-b)).toEqual(s.jobs.map(j=>j.id));
 for(let i=0;i<96;i+=4){const group=s.jobs.slice(i,i+4);expect(new Set(group.map(j=>j.fen)).size).toBe(1);expect(new Set(group.map(j=>JSON.stringify(j.rules))).size).toBe(1);expect(group.map(j=>[j.fairyWhite,j.opponent??'current'])).toEqual([[true,'current'],[true,'native-baseline'],[false,'current'],[false,'native-baseline']]);}
 expect(()=>cardRepairSpec('')).toThrow('Baseline patch');
});
