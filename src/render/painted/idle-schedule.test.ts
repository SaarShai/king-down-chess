import { expect, it } from 'vitest';
import { idleSchedule } from './idle-schedule.mjs';
it('limits both armies and the selected figure to three shared idle slots', () => {
  const schedule = idleSchedule(() => 0), pieces = new Map(Array.from({length:32},(_,sq)=>[sq,sq%2?17:1]));
  schedule.update(0,pieces,()=>1000);
  const first=schedule.update(4000,pieces,()=>1000);expect(first.size).toBe(3);
  for(let t=4000;t<30000;t+=100) expect(schedule.update(t,pieces,()=>1000).size).toBeLessThanOrEqual(3);
  expect(schedule.update(30001,pieces,()=>1000,false).size).toBe(0);
});
it('pauses between clips and drops removed or moved pieces at once', () => {
  const schedule=idleSchedule(()=>0), pieces=new Map([[1,1],[2,17]]);
  schedule.update(0,pieces,()=>800);expect([...schedule.update(4000,pieces,()=>800).keys()]).toEqual([1,2]);
  expect(schedule.update(4800,pieces,()=>800).size).toBe(0);
  expect(schedule.update(8800,pieces,()=>800).size).toBe(2);
  pieces.delete(1);pieces.set(2,2);expect(schedule.update(8801,pieces,()=>800).size).toBe(0);
});
