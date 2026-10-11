import { expect, it } from 'vitest';
import { fixtureService } from './plugin-protocol-fixture';
import { DEFAULT_OPTIONS } from '../src/match/setup';

it('supports the screen tools, hidden setup choices, board selection and rematch in the fixture', async () => {
 const s = fixtureService();
 try {
  await s.handle('alice',{handle:'alice',icon:'rook'}); await s.handle('bob',{handle:'bob',icon:'knight'});
  const board = await s.openBoard('alice'); expect(await s.board('alice',board)).toBeNull();
  expect(await s.settings('alice')).toMatchObject({symbols_only:false,show_threats:false,last_setup:null});
  await s.settings('alice',{show_threats:true}); expect((await s.settings('alice')).show_threats).toBe(true);
  const open = await s.find('alice',DEFAULT_OPTIONS,'white'); expect(open.status).toBe('waiting');
  expect((await s.find('alice',DEFAULT_OPTIONS)).game_id).toBe(open.game_id);
  expect((await s.lobby('bob')).games[0].creator).toEqual({handle:'alice',icon:'rook'});
  const taken = await s.accept('bob',open.game_id); expect(taken.status).toBe('setup');
  const choice = {king:null,order:taken.draw!};
  const send = (actor:string, revision:number, action:unknown) => s.command(actor,open.game_id,{command_id:`${actor}-${revision}`,expected_revision:revision,action});
  await send('alice',1,{type:'choose',choice,ready:true});
  const hidden = await s.view('bob',open.game_id); expect(hidden.choices![0]).toBeNull(); expect(hidden.last_commands.at(-1)!.action.type).toBe('hidden');
  expect((await send('bob',2,{type:'choose',choice,ready:true})).status).toBe('playing');
  await s.selectBoard('alice',board,open.game_id);
  await send('alice',3,{type:'draw',choice:'offer'});
  expect((await send('bob',4,{type:'draw',choice:'accept'})).result!.reason).toBe('agreement');
  await send('alice',5,{type:'rematch',choice:'offer'});
  const rematch = await send('bob',6,{type:'rematch',choice:'accept'});
  expect(rematch.rematch_game_id).toBeTruthy(); expect(await s.board('alice',board)).toBe(open.game_id);
  expect((await s.view('alice',rematch.rematch_game_id!)).status).toBe('setup');
  const friend = await s.create('alice',{kind:'friend',options:{...DEFAULT_OPTIONS,arrangement:false}});
  const invite = await s.invite('alice',friend.game_id); expect((await s.preview('bob',invite.code)).creator.handle).toBe('alice');
  expect((await s.view('alice',friend.game_id)).opponent).toBeNull();
  expect((await s.join('bob',invite.code)).status).toBe('playing');
  const pending = await s.find('alice',DEFAULT_OPTIONS); expect((await s.cancel('alice',pending.game_id)).status).toBe('aborted');
 } finally {await s.close();}
});

it('reads one seeded record and history page and supports deadline claims', async () => {
 const s = fixtureService();
 try {
  await s.handle('alice',{handle:'alice'}); await s.handle('bob',{handle:'bob'});
  const options = {...DEFAULT_OPTIONS,arrangement:false};
  let current = await s.create('alice',{kind:'friend',colour:'white',options,level:'casual'});
  current = await s.join('bob',(await s.invite('alice',current.game_id)).code);
  for (const actor of ['alice','bob']) {const v = await s.view(actor,current.game_id); current = await s.command(actor,v.game_id,{command_id:actor,expected_revision:v.revision,action:{type:'turn',actions:[v.legal.find(l=>!l.includes('!'))!]}});}
  const record = {totals:{played:21,won:10,drawn:3,lost:8},rating:{rating:1540,rd:180,volatility:.06,provisional:true},badges:[{badge:'first_win' as const,earned_at:'2026-10-01T00:00:00.000Z'}]};
  const history = Array.from({length:21},(_,i)=>({game_id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,finished_at:'2026-10-01T00:00:00.000Z',kind:'friend' as const,colour:'white' as const,result:'won' as const,reason:'resignation' as const,opponent:{handle:'bob',icon:'knight',computer:false,deleted:false,level:null},features:{fairy:true,arrangement:false,classic:false,cards:false,powers:false,king:'Flame' as const,power:null}}));
  s.seed('alice',{history,record,games:await s.inbox('alice'),views:{[current.game_id]:{deadline_at:'2026-01-01T00:00:00.000Z'}}});
  expect(await s.record('alice')).toEqual(record);
  const page = await s.history('alice'); expect(page.games).toHaveLength(20); expect(page.next_before).toBeTruthy(); expect((await s.history('alice',page.next_before!)).games).toHaveLength(1);
  const result = await s.command('bob',current.game_id,{command_id:'claim',expected_revision:current.revision,action:{type:'claim',reason:'timeout'}});
  expect(result.result).toEqual({winner:1,reason:'timeout'});
 } finally {await s.close();}
});
