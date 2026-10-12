import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS } from './setup';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { createMatch, loadMatch, MatchError, type LocalMatch } from './index';
vi.mock('./index', async original => ({...await original<typeof import('./index')>(), createMatch: vi.fn(), loadMatch: vi.fn()}));
const actor='11111111-1111-4111-8111-111111111111', id='22222222-2222-4222-8222-222222222222';
const load=vi.fn(), receipt=vi.fn(), transaction=vi.fn(), apply=vi.fn(), close=vi.fn(), exportSave=vi.fn();
const service=new GameService({load,receipt,transaction,pool:{}} as unknown as PostgresMatchStore);
const seat=(n: 0 | 1, user_id: string | null) => ({seat:n,user_id,computer:!user_id,turns_played:0,draw_offers:0,said:[]});
const move=(lan: string, command_id='retry') => service.command(actor,id,{command_id,expected_revision:0,action:{type:'turn',actions:[lan]}});
beforeEach(() => {
 vi.resetAllMocks();
 load.mockResolvedValue({id,kind:'solo',status:'playing',turn:0,revision:0,deadline_at:null,draw_offer:null,state:'saved',snapshot:{turn:0,status:'playing',revision:0},players:[seat(0,actor),seat(1,null)]});
 receipt.mockResolvedValue(false);
 vi.mocked(loadMatch).mockResolvedValue({apply,close,exportSave} as unknown as LocalMatch);
});
describe('game service failure boundaries', () => {
 it('refuses a custom position in a game against a person', async () => {
  for (const kind of ['random', 'friend'])
   await expect(service.create(actor,{kind,setup:{fen:'7k/8/8/8/8/8/8/K7 w - - 0 1'}})).rejects.toMatchObject({code:'INVALID_INPUT',status:400});
 });
 it('refuses live speed in a game against a person', async () => {
  for (const kind of ['random', 'friend'])
   await expect(service.create(actor,{kind,speed:'live',options:DEFAULT_OPTIONS})).rejects.toMatchObject({code:'INVALID_INPUT',status:400});
 });
 it('keeps worker faults retryable and hides their private details', async () => {
  for (const error of [new Error('Match worker timed out /private/path'),new Error('Match worker exited (1)'),new MatchError('unexpected private data')]) {
   apply.mockRejectedValueOnce(error);
   await expect(move('e2-e4')).rejects.toMatchObject({code:'UNAVAILABLE',status:503,message:'The game worker is unavailable. Retry.'});
  }
  expect(transaction).not.toHaveBeenCalled(); expect(close).toHaveBeenCalledTimes(3);
 });
 it('keeps engine move rejection definitive and writes nothing', async () => {
  apply.mockRejectedValueOnce(new MatchError('Illegal or ambiguous move'));
  await expect(move('bad')).rejects.toMatchObject({code:'INVALID_MOVE',status:400});
  expect(transaction).not.toHaveBeenCalled();
 });
 it('refuses a second action once the turn has passed, before any write', async () => {
  apply.mockResolvedValueOnce({turn:1,status:'playing',revision:1});
  await expect(service.command(actor,id,{command_id:'two',expected_revision:0,action:{type:'turn',actions:['e2-e4','e4-e5']}})).rejects.toMatchObject({code:'INVALID_MOVE'});
  expect(apply).toHaveBeenCalledTimes(1); expect(transaction).not.toHaveBeenCalled();
 });
 it('separates invalid setup from worker startup failure', async () => {
  vi.mocked(createMatch).mockRejectedValueOnce(new MatchError('Malformed FEN'));
  await expect(service.create(actor,{kind:'solo'})).rejects.toMatchObject({code:'INVALID_INPUT',message:'Invalid game setup'});
  vi.mocked(createMatch).mockRejectedValueOnce(new Error('private worker path'));
  await expect(service.create(actor,{kind:'solo'})).rejects.toMatchObject({code:'UNAVAILABLE',message:'The game worker is unavailable. Retry.'});
 });
 it('rejects malformed commands and options before any database work', async () => {
  for (const value of ['bad\u0000','bad\n','bad\u007f']) {
   await expect(move(value)).rejects.toMatchObject({code:'INVALID_INPUT'});
   await expect(move('e2-e4',value)).rejects.toMatchObject({code:'INVALID_INPUT'});
  }
  for (const action of [{type:'turn',actions:[]},{type:'say',preset:'free text'},{type:'draw',choice:'maybe'},{type:'resign',extra:1},{type:'pass'}])
   await expect(service.command(actor,id,{command_id:'x',expected_revision:0,action})).rejects.toMatchObject({code:'INVALID_INPUT'});
  await expect(service.command(actor,id,{command_id:'x',expected_revision:0,action:{type:'resign'},actor_id:actor})).rejects.toMatchObject({code:'INVALID_INPUT'});
  await expect(service.command('mallory',id,{command_id:'x',expected_revision:0,action:{type:'resign'}})).rejects.toMatchObject({code:'INVALID_INPUT'});
  for (const options of [{kind:'solo',speed:'daily'},{kind:'friend',speed:'live',days_per_move:3},{kind:'friend',days_per_move:2},{kind:'open'}])
   await expect(service.create(actor,options)).rejects.toMatchObject({code:'INVALID_INPUT'});
  expect(load).not.toHaveBeenCalled(); expect(createMatch).not.toHaveBeenCalled();
 });
});
