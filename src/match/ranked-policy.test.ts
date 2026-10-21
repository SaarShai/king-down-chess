import { describe, expect, it } from 'vitest';
import { createSchema } from './protocol';
import { DEFAULT_OPTIONS, RANKED_OPTIONS, setupAdmission } from './setup';

describe('first ranked admission', () => {
 it('accepts only the server ranked family and the existing always-on king choices', () => {
  expect(createSchema.safeParse({ kind: 'random', mode: 'ranked' }).success).toBe(true);
  expect(createSchema.safeParse({ kind: 'random', mode: 'ranked', options: { ...RANKED_OPTIONS, pool: [...RANKED_OPTIONS.pool].reverse() } }).success).toBe(true);
  const kings = setupAdmission(RANKED_OPTIONS);
  expect(kings.arrangement).toBe(false);
  expect(kings.kings.map(king => king.power).sort()).toEqual(['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March'].sort());
  for (const override of [{kind:'friend'}, {kind:'solo'}, {speed:'live'}, {days_per_move:1}, {colour:'white'}, {level:'club'}, {setup:{preset:'current'}},
   {options:DEFAULT_OPTIONS}, {options:{...RANKED_OPTIONS,arrangement:true}}, {options:{...RANKED_OPTIONS,pool:RANKED_OPTIONS.pool.slice(1)}},
   {options:{...RANKED_OPTIONS,cardPool:RANKED_OPTIONS.cardPool.slice(1)}}]) {
   expect(createSchema.safeParse({ kind:'random',mode:'ranked',...override }).success, JSON.stringify(override)).toBe(false);
  }
 });
});
