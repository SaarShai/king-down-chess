import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_RULES, POWERS_BALANCED, setRules } from '../rules/rules';
import { legalMoves, makeMove, parseSq } from '../rules/engine';
import { fromFen, toFen } from '../rules/setup';
import { fullAction, fullActions, fullConfig, fullTurns, resolveFullAction, resolveFullTurn } from '../../tools/fairy-stockfish-full';
import { fullFixtures } from '../../tools/fairy-stockfish-full-check';
import { matchSpec } from '../../tools/fairy-stockfish-match';
afterEach(() => setRules(DEFAULT_RULES));
describe('full native King Down action contract', () => {
 it('freezes 192 unique games into disjoint side-swapped parts',()=>{const s=matchSpec();expect(s.jobs).toHaveLength(192);const ids=s.parts.flatMap(p=>p.ids);expect(new Set(ids).size).toBe(192);expect(ids.sort((a,b)=>a-b)).toEqual(s.jobs.map(j=>j.id));for(let i=0;i<s.jobs.length;i+=2){expect(s.jobs[i].fairyWhite).not.toBe(s.jobs[i+1].fairyWhite);expect(s.jobs[i].fen).toBe(s.jobs[i+1].fen);expect(s.jobs[i].rules).toEqual(s.jobs[i+1].rules);}});
 it('registers a valid explicit contract for every fixture',()=>{for(const f of fullFixtures())expect(()=>fullConfig(f.rules),f.name).not.toThrow();});
 it('retains remote victims, path collapse, swaps, shoves and self-removal', () => {
  for(const fen of ['4k3/8/3p4/8/3A4/8/8/4K3 w - - 0 1','4k3/8/8/3pp3/3Sp3/8/8/4K3 w - - 0 1','7k/8/8/8/8/8/8/M3K3 w - - 19 1','7k/8/8/3p4/3O4/8/8/K7 w - - 37 1','7k/8/3n4/8/3L4/8/8/K7 w - - 0 1']){
   const p=fromFen(fen);for(const m of legalMoves(p))expect(toFen(makeMove(p,m))).toBe(toFen(makeMove(p,resolveFullAction(p,fullAction(p,m)))));
  }
  const p=fromFen('4k3/8/8/3pp3/3Sp3/8/8/4K3 w - - 0 1');expect(legalMoves(p).length).toBeGreaterThan(fullActions(p).size);
  expect(()=>fullAction(p,{from:27,to:28,captures:[28,28]})).toThrow('victim');
  expect(()=>resolveFullAction(p,'@d6db:0:0:0')).toThrow('illegal');
 });
 it('spends the copied card slot, and keeps the borrowed card', () => {
  setRules({hands:[['MirrorB','Freeze'],[]]});const p=fromFen('7k/8/8/4p3/3N4/8/8/K7 w - - 0 1');
  const m=legalMoves(p).find(m=>m.via==='mirrorb')!,token=fullAction(p,m),next=makeMove(p,resolveFullAction(p,token));
  expect(next.used?.[0]).toBe(1);expect(next.marks?.[0]?.sq).toBe(parseSq('e5'));
  expect(fullActions(next).size).toBeGreaterThan(0);
 });
 it('compiles each held turn and refuses a missing or illegal follow-up', () => {
  setRules({...POWERS_BALANCED,hands:[['Haste','Freeze'],[]]});const p=fromFen('7k/8/8/4p3/3N4/8/8/K7 w - - 0 1');
  const m=legalMoves(p).find(m=>m.power==='freeze')!,token=fullAction(p,m),next=makeMove(p,m);
  expect(next.turn).toBe(p.turn);expect(()=>resolveFullTurn(p,token)).toThrow('omits');
  const continuations=[...fullTurns(p)].filter(([key])=>key.startsWith(token+','));expect(continuations.length).toBe(fullActions(next).size);
  for(const [key,end]of continuations)expect(toFen(resolveFullTurn(p,key).position)).toBe(toFen(end));
  expect(()=>resolveFullTurn(p,token+',@d6db:0:0:0')).toThrow('illegal');
 });
 it('ends a held turn at the first action when the draw clock reaches 100', () => {
  setRules({...POWERS_BALANCED,hands:[['Freeze'],[]]});const p=fromFen('7k/8/8/4p3/3N4/8/8/K7 w - - 99 1');
  const m=legalMoves(p).find(m=>m.power==='freeze')!,token=fullAction(p,m);
  expect(fullTurns(p).has(token)).toBe(true);expect(resolveFullTurn(p,token).moves).toHaveLength(1);
 });
 it('rejects unsupported rules, unlimited stateful powers and invalid effects', () => {
  expect(fullConfig()).toMatch(/^0 0 0 /);setRules({...POWERS_BALANCED});expect(fullConfig()).toMatch(/^1 0 0 /);
  setRules({freezeUses:0});expect(()=>fullConfig()).toThrow('limit');setRules({guardReserve:'any'});expect(()=>fullConfig()).toThrow('contract');
  setRules(DEFAULT_RULES);const p=fromFen('7k/8/8/8/3N4/8/8/K7 w - - 0 1');
  expect(()=>fullAction(p,{from:27,to:27,captures:[],pushes:[{from:28,to:45}]})).toThrow('quake');
 });
});
