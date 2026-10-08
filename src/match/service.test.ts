import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchService } from './service';
import { PostgresMatchStore } from './store';
import { createMatch, loadMatch, MatchError, type LocalMatch } from './index';
vi.mock('./index', async original => ({...await original<typeof import('./index')>(), createMatch: vi.fn(), loadMatch: vi.fn()}));
const actor='11111111-1111-4111-8111-111111111111', id='22222222-2222-4222-8222-222222222222';
const read=vi.fn(), dedupe=vi.fn(), commit=vi.fn(), apply=vi.fn(), close=vi.fn();
const service=new MatchService({read,dedupe,commit} as unknown as PostgresMatchStore);
beforeEach(() => { vi.resetAllMocks(); read.mockResolvedValue({id,white_id:actor,black_id:null,mode:'solo',revision:0,snapshot:{turn:0,status:'playing'},save:'saved'}); dedupe.mockResolvedValue(false); vi.mocked(loadMatch).mockResolvedValue({apply,close} as unknown as LocalMatch); });
describe('service failure boundaries', () => {
 it('keeps worker faults retryable and hides their private details', async () => {
  for (const error of [new Error('Match worker timed out /private/path'),new Error('Match worker exited (1)'),new MatchError('unexpected private data')]) {
   apply.mockRejectedValueOnce(error);
   await expect(service.move(actor,id,{id:'retry',expectedRevision:0,lan:'e2-e4'})).rejects.toMatchObject({code:'UNAVAILABLE',status:503,message:'The game worker is unavailable. Retry.'});
  }
  expect(commit).not.toHaveBeenCalled(); expect(close).toHaveBeenCalledTimes(3);
 });
 it('keeps engine move rejection definitive', async () => {
  apply.mockRejectedValueOnce(new MatchError('Illegal or ambiguous move'));
  await expect(service.move(actor,id,{id:'bad',expectedRevision:0,lan:'bad'})).rejects.toMatchObject({code:'INVALID_MOVE',status:400});
 });
 it('separates invalid setup from worker startup failure', async () => {
  vi.mocked(createMatch).mockRejectedValueOnce(new MatchError('Malformed FEN'));
  await expect(service.create(actor)).rejects.toMatchObject({code:'INVALID_INPUT',message:'Invalid game setup'});
  vi.mocked(createMatch).mockRejectedValueOnce(new Error('private worker path'));
  await expect(service.create(actor)).rejects.toMatchObject({code:'UNAVAILABLE',message:'The game worker is unavailable. Retry.'});
 });
 it('rejects control characters before any database work', async () => {
  for (const value of ['bad\u0000','bad\n','bad\u007f']) for (const field of ['id','lan']) {
   await expect(service.move(actor,id,{id:'command',lan:'e2-e4',expectedRevision:0,[field]:value})).rejects.toMatchObject({code:'INVALID_INPUT'});
  }
  expect(read).not.toHaveBeenCalled();
 });
});
