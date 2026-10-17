import { expect, it, vi } from 'vitest';
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
  expect(Date.parse(invite.expires_at)-Date.now()).toBeGreaterThan(6*86_400_000); expect(Date.parse(invite.expires_at)-Date.now()).toBeLessThanOrEqual(7*86_400_000);
  expect((await s.view('alice',friend.game_id)).opponent).toBeNull();
  expect((await s.join('bob',invite.code)).status).toBe('playing');
  await s.block('alice',{game_id:friend.game_id},true);
  const blocks = await s.blocks('alice'); expect(blocks).toHaveLength(1);
  expect(blocks[0].user_id).toMatch(/^[0-9a-f-]{36}$/);
  await s.block('alice',{user_id:blocks[0].user_id},false); expect(await s.blocks('alice')).toEqual([]);

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

it('keeps seeded end data and rules out of since polls', async () => {
 const s = fixtureService();
 try {
  const game = await s.create('alice',{kind:'solo',options:{...DEFAULT_OPTIONS,arrangement:false}});
  await s.command('alice',game.game_id,{command_id:'end',expected_revision:0,action:{type:'resign'}});
  const outcome = {rating_before:null,rating:null,provisional:false,badges:[{badge:'first_win' as const,earned_at:'2026-10-11T00:00:00.000Z'}]};
  s.seed('alice',{views:{[game.game_id]:{outcome,rules:game.rules}}});
  const full = await s.view('alice',game.game_id); expect(full.outcome).toEqual(outcome); expect(full.rules).toBeDefined();
  const poll = await s.view('alice',game.game_id,1);
  expect(poll).not.toHaveProperty('outcome'); expect(poll).not.toHaveProperty('rules'); expect(poll.opponent).not.toHaveProperty('rating');
 } finally {await s.close();}
});

it('returns the completed fixture join on retry, also after the code expires', async () => {
 const s = fixtureService(); vi.useFakeTimers({toFake:['Date']});
 try {
  for (const actor of ['alice','bob','cara']) await s.handle(actor,{handle:actor});
  for (const options of [DEFAULT_OPTIONS,{...DEFAULT_OPTIONS,arrangement:false}]) {
   const game = await s.create('alice',{kind:'friend',options}), invite = await s.invite('alice',game.game_id);
   const joined = await s.join('bob',invite.code);
   expect(await s.join('bob',invite.code)).toMatchObject({game_id:game.game_id,status:joined.status,revision:joined.revision,seat:joined.seat});
   vi.setSystemTime(Date.now()+8*86_400_000);
   expect(await s.join('bob',invite.code)).toMatchObject({game_id:game.game_id,revision:joined.revision});
   await expect(s.join('cara',invite.code)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
  }
 } finally {vi.useRealTimers();await s.close();}
});

it('allows Switch now only for an earlier own search joined after solo play starts', async () => {
 vi.useFakeTimers({toFake:['Date']});
 try {
  for (const scenario of ['joined after','no search','joined before','opened after','other creator','ended search']) {
   const s = fixtureService();
   try {
    await s.handle('alice',{handle:'alice'}); await s.handle('bob',{handle:'bob'});
    let open;
    if (!['no search','opened after'].includes(scenario)) {
     open = await s.create(scenario === 'other creator' ? 'bob' : 'alice',{kind:'random',options:DEFAULT_OPTIONS});
     if (scenario === 'joined before') { vi.setSystemTime(Date.now()+1000); await s.accept('bob',open.game_id); }
    }
    vi.setSystemTime(Date.now()+1000);
    let solo = await s.create('alice',{kind:'solo',options:{...DEFAULT_OPTIONS,fairy:false,arrangement:false}});
    solo = await s.command('alice',solo.game_id,{command_id:'move',expected_revision:0,action:{type:'turn',actions:[solo.legal[0]]}});
    solo = await s.command('alice',solo.game_id,{command_id:'computer',expected_revision:solo.revision,action:{type:'computer'}});
    expect(solo.abort_open).toBe(false);
    vi.setSystemTime(Date.now()+1000);
    if (scenario === 'opened after') open = await s.create('alice',{kind:'random',options:DEFAULT_OPTIONS});
    if (open && scenario !== 'joined before') await s.accept(scenario === 'other creator' ? 'alice' : 'bob',open.game_id);
    if (scenario === 'ended search') await s.command('alice',open!.game_id,{command_id:'cancel',expected_revision:1,action:{type:'abort'}});
    const read = await s.view('alice',solo.game_id), abort = {command_id:'switch',expected_revision:solo.revision,action:{type:'abort'}};
    expect(read.abort_open).toBe(scenario === 'joined after');
    if (scenario === 'joined after') expect((await s.command('alice',solo.game_id,abort)).result).toEqual({winner:null,reason:'abort'});
    else await expect(s.command('alice',solo.game_id,abort)).rejects.toMatchObject({code:'NOT_ALLOWED'});
   } finally {await s.close();}
  }
 } finally {vi.useRealTimers();}
},20000);

it.each(['Ready','Abort'])('keeps one three-day setup deadline through each Choose and clears it on %s', async ending => {
 const s = fixtureService(); vi.useFakeTimers({toFake:['Date']}); vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'));
 try {
  await s.handle('alice',{handle:'alice'}); await s.handle('bob',{handle:'bob'});
  const game = await s.create('alice',{kind:'friend',options:DEFAULT_OPTIONS});
  const joined = await s.join('bob',(await s.invite('alice',game.game_id)).code), deadline = '2026-10-14T12:00:00.000Z';
  expect(joined.setup_deadline_at).toBe(deadline);
  const choice = {king:null,order:joined.draw!};
  for (const [i,actor] of ['alice','bob'].entries()) {
   vi.setSystemTime(Date.now()+86_400_000);
   const changed = await s.command(actor,game.game_id,{command_id:actor,expected_revision:1+i,action:{type:'choose',choice,ready:false}});
   expect(changed.setup_deadline_at).toBe(deadline); expect((await s.view(actor,game.game_id,changed.revision)).setup_deadline_at).toBe(deadline);
  }
  if (ending === 'Ready') {
   await s.command('alice',game.game_id,{command_id:'ready-a',expected_revision:3,action:{type:'choose',choice,ready:true}});
   expect((await s.command('bob',game.game_id,{command_id:'ready-b',expected_revision:4,action:{type:'choose',choice,ready:true}})).setup_deadline_at).toBeNull();
  } else {
   const aborted = await s.command('alice',game.game_id,{command_id:'abort',expected_revision:3,action:{type:'abort'}});
   expect(aborted).toMatchObject({status:'aborted',setup_deadline_at:null,deadline_at:null,result:{winner:null,reason:'abort'}});
   expect((await s.view('bob',game.game_id)).setup_deadline_at).toBeNull();
  }
 } finally {vi.useRealTimers();await s.close();}
});

it('keeps the database start receipt in the fixture: other input with a used start ID is COMMAND_CONFLICT (RV7-1)', async () => {
 const s = fixtureService();
 try {
  for (const actor of ['alice','bob']) await s.handle(actor,{handle:actor});
  const open = await s.find('alice',DEFAULT_OPTIONS,'white');
  expect((await s.find('bob',DEFAULT_OPTIONS,'white','b1')).game_id).toBe(open.game_id);
  expect((await s.find('bob',DEFAULT_OPTIONS,'white','b1')).game_id).toBe(open.game_id);
  await expect(s.find('bob',DEFAULT_OPTIONS,'black','b1')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
  await expect(s.create('bob',{kind:'solo',options:DEFAULT_OPTIONS},'b1')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
 } finally { await s.close(); }
});

it('takes only an open game with the same five switches in the fixture, or any game with any rules (D1 a)', async () => {
 const s = fixtureService();
 try {
  for (const actor of ['alice','bob','carol']) await s.handle(actor,{handle:actor});
  const open = await s.find('alice',{...DEFAULT_OPTIONS,kingPowers:true},'white');
  expect((await s.find('bob',DEFAULT_OPTIONS,'white','b1')).game_id).not.toBe(open.game_id);
  expect((await s.find('carol',DEFAULT_OPTIONS,'white','c1',true)).game_id).toBe(open.game_id);
  await expect(s.find('carol',DEFAULT_OPTIONS,'white','c1')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
 } finally { await s.close(); }
});
