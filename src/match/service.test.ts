import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS } from './setup';
import { GameService, MatchServiceError, startKey, TURN_DAYS, UNFINISHED } from './service';
import { PostgresMatchStore } from './store';
import { createMatch, loadMatch, MatchError, type LocalMatch } from './index';
vi.mock('./index', async original => ({...await original<typeof import('./index')>(), createMatch: vi.fn(), loadMatch: vi.fn()}));
vi.mock('./results', async original => ({...await original<typeof import('./results')>(), recordResult: vi.fn()}));
const actor='11111111-1111-4111-8111-111111111111', id='22222222-2222-4222-8222-222222222222';
const load=vi.fn(), seen=vi.fn(), receipt=vi.fn(), transaction=vi.fn(), apply=vi.fn(), close=vi.fn(), exportSave=vi.fn();
const service=new GameService({load,seen,receipt,transaction,pool:{}} as unknown as PostgresMatchStore);
const seat=(n: 0 | 1, user_id: string | null) => ({seat:n,user_id,computer:!user_id,turns_played:0,draw_offers:0,said:[]});
const move=(lan: string, command_id='retry') => service.command(actor,id,{command_id,expected_revision:0,action:{type:'turn',actions:[lan]}});
beforeEach(() => {
 vi.resetAllMocks();
 load.mockResolvedValue({id,kind:'solo',status:'playing',turn:0,revision:0,deadline_at:null,draw_offer:null,state:'saved',snapshot:{turn:0,status:'playing',revision:0},players:[seat(0,actor),seat(1,null)]});
 receipt.mockResolvedValue(false);
 vi.mocked(loadMatch).mockResolvedValue({apply,close,exportSave} as unknown as LocalMatch);
});
describe('game service failure boundaries', () => {
 it('checks draft authority, revision, implementation and prefix bounds before opening a worker', async () => {
  const engine = 'sha256:' + 'a'.repeat(64), game = { id, kind:'solo', status:'playing', turn:0, revision:0, engine_fingerprint:engine, state:JSON.stringify({engine}), snapshot:{turn:0,status:'playing',revision:0}, players:[seat(0,actor),seat(1,null)] };
  const input = {expected_revision:0,engine_fingerprint:engine,actions:[]};
  for (const [change, code] of [[{players:[seat(0,id),seat(1,null)]},'FORBIDDEN'],[{revision:1},'STALE_REVISION'],[{engine_fingerprint:'sha256:'+'b'.repeat(64)},'MATCH_INCOMPATIBLE'],[{state:JSON.stringify({engine:'other'})},'MATCH_INCOMPATIBLE'],[{status:'finished'},'NOT_ALLOWED'],[{turn:1},'WRONG_TURN']] as const) {
   load.mockResolvedValueOnce({...game,...change});
   await expect(service.previewDraft(actor,id,input)).rejects.toMatchObject({code});
  }
  for (const invalid of [{...input,actions:Array(5).fill('e2-e4')},{...input,actions:['bad\n']},{...input,engine_fingerprint:'unknown'},{...input,actor_id:actor},{...input,expected_revision:-1}]) await expect(service.previewDraft(actor,id,invalid)).rejects.toMatchObject({code:'INVALID_INPUT'});
  expect(loadMatch).not.toHaveBeenCalled(); expect(transaction).not.toHaveBeenCalled(); expect(seen).not.toHaveBeenCalled(); expect(receipt).not.toHaveBeenCalled();
 });
 it('closes a draft worker on success, illegal moves, handover and worker failure, without writing', async () => {
  const engine = 'sha256:'+'a'.repeat(64), initial = {turn:0,status:'playing',revision:0,fen:'base',inCheck:false,moves:[]};
  load.mockResolvedValue({id,status:'playing',turn:0,revision:0,engine_fingerprint:engine,state:JSON.stringify({engine}),snapshot:initial,players:[seat(0,actor),seat(1,null)]});
  const snapshot = vi.fn().mockResolvedValue(initial);
  vi.mocked(loadMatch).mockResolvedValue({apply,close,exportSave,snapshot} as unknown as LocalMatch);
  const preview = (actions:string[]) => service.previewDraft(actor,id,{expected_revision:0,engine_fingerprint:engine,actions});
  expect((await preview([])).positions).toHaveLength(1);
  apply.mockRejectedValueOnce(new MatchError('Illegal or ambiguous move'));
  await expect(preview(['bad'])).rejects.toMatchObject({code:'INVALID_MOVE'});
  apply.mockResolvedValueOnce({...initial,turn:1,revision:1});
  await expect(preview(['e2-e4','e4-e5'])).rejects.toMatchObject({code:'INVALID_MOVE'});
  snapshot.mockRejectedValueOnce(new Error('private worker path'));
  await expect(preview([])).rejects.toMatchObject({code:'UNAVAILABLE',message:'The game worker is unavailable. Retry.'});
  expect(close).toHaveBeenCalledTimes(4); expect(exportSave).not.toHaveBeenCalled(); expect(transaction).not.toHaveBeenCalled(); expect(seen).not.toHaveBeenCalled(); expect(receipt).not.toHaveBeenCalled();
 });
 it('checks normalized game and actor IDs and seat authority before activity', async () => {
  const user = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', game = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  load.mockResolvedValueOnce({ players: [seat(0, user), seat(1, null)] });
  await service.seen(user.toUpperCase(), game.toUpperCase());
  expect(load).toHaveBeenLastCalledWith(game); expect(seen).toHaveBeenCalledExactlyOnceWith(game, user);
  seen.mockClear();
  await expect(service.seen(user, id)).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  load.mockRejectedValueOnce(new MatchServiceError('NOT_FOUND', 404, 'Game not found'));
  await expect(service.seen(actor, id)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  expect(seen).not.toHaveBeenCalled();
  load.mockClear();
  for (const [who, which] of [['bad', id], [actor, 'bad']]) await expect(service.seen(who, which)).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 });
  expect(load).not.toHaveBeenCalled(); expect(seen).not.toHaveBeenCalled();
 });
 it('projects the fixed engine identity on all reads and loads the save only for full history', async () => {
  // The store selects the engine save only when asked, as its SQL does.
  const reads = {load:vi.fn(), seen:vi.fn(), commands:vi.fn().mockResolvedValue([]), pool:{}};
  const game = {id,engine_fingerprint:'engine-v1',kind:'solo',status:'playing',turn:0,revision:2,created_at:new Date(0),deadline_at:null,draw_offer:null,
   snapshot:{fen:'fen',inCheck:false,legal:[],history:['e2-e4','e7-e5'],rules:{kings:[],hands:[]}},
   players:[{...seat(0,actor),last_seen_ms:0},{...seat(1,null),last_seen_ms:null}]};
  reads.load.mockImplementation(async (_id: string, options?: {state?: boolean}) => ({...game, ...options?.state && {state:JSON.stringify({initialFen:'start'})}}));
  const views = new GameService(reads as unknown as PostgresMatchStore);
  const full = await views.view(actor,id), incremental = await views.view(actor,id,1);
  expect(full.history).toEqual({initial_fen:'start',actions:['e2-e4','e7-e5']});
  expect(incremental.history).toBeUndefined();
  expect(full.engine_fingerprint).toBe('engine-v1'); expect(incremental.engine_fingerprint).toBe('engine-v1');
  expect(reads.load.mock.calls.map(call => call[1])).toEqual([{state:true},{state:false}]);
  reads.load.mockResolvedValueOnce({ ...game, status:'setup', snapshot:null, engine_fingerprint:null });
  expect((await views.view(actor,id)).engine_fingerprint).toBeNull();
 });
 it('refuses a custom position in a game against a person', async () => {
  for (const kind of ['random', 'friend'])
   await expect(service.create(actor,{kind,setup:{fen:'7k/8/8/8/8/8/8/K7 w - - 0 1'}})).rejects.toMatchObject({code:'INVALID_INPUT',status:400});
 });
 it('refuses a speed or days choice in every game: the server sets the turn time (F-031)', async () => {
  for (const kind of ['solo', 'random', 'friend'])
   for (const choice of [{speed:'live'},{speed:'daily'},{days_per_move:1},{days_per_move:3},{days_per_move:7}])
    await expect(service.create(actor,{kind,options:DEFAULT_OPTIONS,...choice})).rejects.toMatchObject({code:'INVALID_INPUT',status:400});
  expect(TURN_DAYS).toBe(3);
  for (const kind of ['random', 'friend'] as const) expect(startKey({kind})).toMatchObject({speed:'daily',days_per_move:TURN_DAYS});
  expect(startKey({kind:'solo'})).toMatchObject({speed:'live',days_per_move:null});
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
 it('refuses a player turn that leaves the same side to move, before any write (W7 ticket 06)', async () => {
  apply.mockResolvedValueOnce({turn:0,status:'playing',revision:1});
  await expect(move('Ra1-a2!H')).rejects.toMatchObject({code:'INVALID_MOVE',status:400,message:UNFINISHED});
  expect(transaction).not.toHaveBeenCalled(); expect(exportSave).not.toHaveBeenCalled(); expect(close).toHaveBeenCalledOnce();
  // A turn that passes the move or ends the game goes on to the write.
  for (const [index,after] of [{turn:1,status:'playing',revision:1},{turn:0,status:'checkmate',revision:1}].entries()) {
   apply.mockResolvedValueOnce(after);
   await move('e2-e4',`whole-${index}`);
  }
  expect(transaction).toHaveBeenCalledTimes(2);
 });
 it('keeps the computer to one action for each call, also when its turn goes on', async () => {
  const chooseMove = vi.fn().mockResolvedValue('Ra8-a7!H');
  vi.mocked(loadMatch).mockResolvedValueOnce({apply,close,exportSave,chooseMove} as unknown as LocalMatch);
  load.mockResolvedValue({id,kind:'solo',status:'playing',turn:1,revision:1,deadline_at:null,draw_offer:null,state:'saved',snapshot:{turn:1,status:'playing',revision:1},players:[seat(0,actor),seat(1,null)]});
  apply.mockResolvedValueOnce({turn:1,status:'playing',revision:2});
  await service.command(actor,id,{command_id:'computer',expected_revision:1,action:{type:'computer'}});
  expect(chooseMove).toHaveBeenCalledOnce(); expect(apply).toHaveBeenCalledOnce(); expect(transaction).toHaveBeenCalledOnce();
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
 it.each([
  ['options with cards', {kind:'solo',options:{...DEFAULT_OPTIONS,cards:true}}, 'POWERS_BALANCED'],
  ['options with no cards and no powers', {kind:'solo',options:DEFAULT_OPTIONS}, null],
 ])('records the balanced readings for %s as the worker plays it (decision 188)', async (_name, input, readings) => {
  const games: { readings: string | null }[] = [], insert = vi.fn(async (game: { readings: string | null }) => { games.push(game); throw new Error('stop'); });
  const writer = new GameService({transaction:(write: (client: object) => unknown) => write({}),lockAccounts:vi.fn(),insert,pool:{}} as unknown as PostgresMatchStore);
  vi.mocked(createMatch).mockResolvedValue({close,exportSave:async () => JSON.stringify({engine:'sha256:'+'a'.repeat(64)})} as unknown as LocalMatch);
  await expect(writer.create(actor,input)).rejects.toThrow('stop');
  expect(games[0].readings).toBe(readings);
 });
 it('records the balanced readings for a setup hand with no options, as an internal rematch makes it (decision 188)', async () => {
  vi.mocked(createMatch).mockResolvedValue({close,snapshot:async () => ({turn:0,rules:{kings:[null,null],hands:[['Freeze'],['Freeze']]}}),exportSave:async () => JSON.stringify({engine:'sha256:'+'a'.repeat(64)})} as unknown as LocalMatch);
  const game = await (new GameService({} as PostgresMatchStore) as unknown as { newGame(actor: string, input: object): Promise<{ readings: string | null }> }).newGame(actor, {kind:'solo',setup:{hand:['Freeze']}});
  expect(game.readings).toBe('POWERS_BALANCED');
 });
 it('ends the game as a draw when the engine history has no room for a whole turn (server audit F5)', async () => {
  const save = vi.fn(), writer = new GameService({load,seen,receipt,transaction:(write: (client: object) => unknown) => write({}),save,commands:vi.fn().mockResolvedValue([]),pool:{}} as unknown as PostgresMatchStore);
  load.mockResolvedValue({id,kind:'solo',status:'playing',turn:0,revision:0,deadline_at:null,draw_offer:null,state:'saved',setup:{},created_at:new Date(),snapshot:{turn:0,status:'playing',revision:995},players:[seat(0,actor),seat(1,null)]});
  // The engine refuses an action at 1000, so a turn of four actions fits from 996 but not from 997.
  for (const revision of [996, 997]) apply.mockResolvedValueOnce({turn:1,status:'playing',history:[],rules:{kings:[null,null],hands:[[],[]]},revision});
  for (const command_id of ['fits', 'fills']) await writer.command(actor,id,{command_id,expected_revision:0,action:{type:'turn',actions:['e2-e4']}});
  expect(save.mock.calls.map(call => call[2].status)).toEqual(['playing','finished']);
  expect(save.mock.calls[1][2]).toMatchObject({result:'draw',end_reason:'history',deadline_at:null});
 });
 it.each([['Haste', ['Ra4-a3!H', 'Ra3-h3']], ['a free mark', ['!F:d5', 'Ra4-a3']]])('finishes a computer turn with %s before the history draw (server audit F5)', async (_name, lans) => {
  // Each call plays one action: the first leaves the turn with the computer, at the service limit (999) and at the engine limit (996).
  for (const [revision, engine] of [[999, 10], [10, 996]]) {
   const save = vi.fn(), chooseMove = vi.fn(), writer = new GameService({load,seen,receipt,transaction:(write: (client: object) => unknown) => write({}),save,commands:vi.fn().mockResolvedValue([]),pool:{}} as unknown as PostgresMatchStore);
   vi.mocked(loadMatch).mockResolvedValue({apply,close,exportSave,chooseMove} as unknown as LocalMatch);
   for (const [index, lan] of lans.entries()) {
    load.mockResolvedValue({id,kind:'solo',status:'playing',turn:1,revision:revision + index,deadline_at:null,draw_offer:null,state:'saved',setup:{},created_at:new Date(),snapshot:{turn:1,status:'playing',revision:engine + index},players:[seat(0,actor),seat(1,null)]});
    chooseMove.mockResolvedValueOnce(lan);
    apply.mockResolvedValueOnce({turn:1 - index,status:'playing',history:[],rules:{kings:[null,null],hands:[[],[]]},revision:engine + index + 1});
    await writer.command(actor,id,{command_id:`${revision}-${index}`,expected_revision:revision + index,action:{type:'computer'}});
   }
   expect(save.mock.calls.map(call => [call[2].status, call[2].turn])).toEqual([['playing',1],['finished',0]]);
   expect(save.mock.calls[1][2]).toMatchObject({result:'draw',end_reason:'history'});
  }
 });
 it('draws an older save when the computer fills the engine history in the middle of its turn (server audit F5)', async () => {
  // Saved before the reserve: 999 engine actions. The Haste first move takes the last one, so the turn cannot finish.
  const save = vi.fn(), chooseMove = vi.fn().mockResolvedValue('Ra4-a3!H'), writer = new GameService({load,seen,receipt,transaction:(write: (client: object) => unknown) => write({}),save,commands:vi.fn().mockResolvedValue([]),pool:{}} as unknown as PostgresMatchStore);
  vi.mocked(loadMatch).mockResolvedValue({apply,close,exportSave,chooseMove} as unknown as LocalMatch);
  load.mockResolvedValue({id,kind:'solo',status:'playing',turn:1,revision:998,deadline_at:null,draw_offer:null,state:'saved',setup:{},created_at:new Date(),snapshot:{turn:1,status:'playing',revision:999},players:[seat(0,actor),seat(1,null)]});
  apply.mockResolvedValueOnce({turn:1,status:'playing',history:[],rules:{kings:[null,null],hands:[[],[]]},revision:1000});
  await writer.command(actor,id,{command_id:'last',expected_revision:998,action:{type:'computer'}});
  expect(save.mock.calls[0][2]).toMatchObject({status:'finished',result:'draw',end_reason:'history'});
 });
 it('projects opponent and invitation avatars only from the privacy-checked helper', async () => {
  const peer = '33333333-3333-4333-8333-333333333333', pic = 'https://avatars.githubusercontent.com/u/99';
  const queries: { sql: string; params: unknown[] }[] = [];
  const pool = { query: vi.fn(async (sql: string, params: unknown[]) => {
   queries.push({ sql, params });
   if (sql.includes('from public.game_players me')) return { rows: [{ game_id: id, rating_policy: 'casual', kind: 'friend', speed: 'daily', status: 'playing', seat: 0, action: 'ready', turn: 0, revision: 1, deadline_at: null, updated_at: new Date(0), options: DEFAULT_OPTIONS, level: 'club', created_at: new Date(0), move: 1, invite_id: null, open_until: null, op_user: peer, op_computer: false, op_seen: null, op_handle: 'dana', op_icon: 'frost', op_avatar: pic }] };
   if (sql.includes('from public.game_invites i join public.games')) return { rows: [{ invite_id: 'a'.repeat(64), game_id: id, revision: 0, recipient_id: peer, direction: 'outgoing', state: 'open', expires_at: new Date(1000), options: DEFAULT_OPTIONS, user_id: peer, handle: 'dana', icon: 'frost', avatar: pic, cursor_at: '2026-11-14T00:00:00.000000Z' }] };
   if (sql.includes('kingdown_jobs.user_avatar($1, $2) as avatar')) return { rows: [{ unblocked: true, presets: true, online: false, avatar: pic }] };
   if (sql.includes('kingdown_jobs.user_avatar($1,$2) as url')) return { rows: [{ url: pic }] };
   if (sql.includes('expires_at<=statement_timestamp() as expired')) return { rows: [{ expired: false }] };
   if (sql.includes('from public.game_invites where token_hash=$1')) return { rows: [{ token_hash: 'b'.repeat(64), game_id: id, seat: 0, created_by: peer, recipient_id: actor, state: 'open', expires_at: new Date(Date.now() + 60_000) }] };
   if (sql.includes('select exists(select from public.profiles')) return { rows: [{ allowed: true }] };
   if (sql.includes('from public.game_invites i join public.games g on g.id=i.game_id')) return { rows: [] };
   if (sql.includes('select handle from public.profiles')) return { rows: [{ handle: 'alex' }] };
   if (sql.includes('from public.profiles p where')) return { rows: [{ user_id: peer, handle: 'dana', icon: 'frost', source: 'follow' }] };
   if (sql.includes('from public.games g')) return { rows: [{ game_id: id, rating_policy: 'casual', options: DEFAULT_OPTIONS, seat: 0, handle: 'dana', icon: 'frost', created_at: new Date(0) }] };
   return { rows: [{ n: 0, rating: 1500, provisional: true }] };
  }) };
  const store = new PostgresMatchStore(pool as never);
  const friendGame = { id, rating_policy: 'casual', kind: 'friend', speed: 'daily', days_per_move: 3, category: '', readings: null, colour_rule: 'random', setup_admission: null, options: DEFAULT_OPTIONS, draw: null, deal: null, level: 'club', setup_deadline_at: null, rematch_offer: null, rematch_game_id: null, engine_fingerprint: 'engine-v1', setup: {}, rules: null, status: 'playing', result: null, end_reason: null, turn: 0, revision: 1, draw_offer: null, state: null, snapshot: { fen: 'fen', inCheck: false, legal: [], history: [], rules: { kings: [], hands: [] } }, deadline_at: null, deadline_kind: null, moves: null, created_by: actor, created_at: new Date(0), started_at: new Date(0), finished_at: null, updated_at: new Date(0), players: [{ ...seat(0, actor), handle: 'alex', handle_at_start: 'alex', last_seen_ms: 0 }, { ...seat(1, peer), handle: 'dana', icon: 'frost', handle_at_start: 'dana', last_seen_ms: null }] };
  store.load = vi.fn().mockResolvedValue(friendGame) as never;
  store.commands = vi.fn().mockResolvedValue([]) as never;
  store.hasJoined = vi.fn().mockResolvedValue(true) as never;
  const views = new GameService(store);
  expect((await views.inbox(actor))[0].opponent?.avatar).toBe(pic);
  expect((await views.invitations(actor)).invitations[0].player?.avatar).toBe(pic);
  expect((await views.view(actor, id)).opponent?.avatar).toBe(pic);
  store.load = vi.fn().mockResolvedValue({ ...friendGame, status: 'waiting' }) as never;
  expect((await views.preview(actor, { invite_id: 'b'.repeat(64) })).creator.avatar).toBe(pic);
  expect(queries.find(q => q.sql.includes('user_avatar($1,op.user_id)'))?.params).toEqual([actor]);
  // Friends lookup and open lobby keep no picture query or avatar field.
  const friends = await store.friends(actor), lobby = await store.lobby(actor);
  expect(friends.friends[0]).not.toHaveProperty('avatar');
  expect(lobby[0].creator).not.toHaveProperty('avatar');
  expect(queries.filter(q => q.sql.includes('from public.profiles p where') || q.sql.includes('from public.games g')).every(q => !q.sql.includes('user_avatar'))).toBe(true);
 });
 it('enforces the SQL privacy, metadata and email sign-in rules in migration 0025', () => {
  const sql = readFileSync('supabase/migrations/0025_opponent_avatar.sql', 'utf8');
  expect(sql).toContain('kingdown_jobs.user_avatar(viewer uuid, subject uuid)');
  expect(sql).toContain('security definer');
  expect(sql).toContain('public.game_players');
  expect(sql).toContain('public.game_invites');
  expect(sql).toContain("r.kind = 'block'");
  expect(sql).toContain("coalesce(app ->> 'provider', '') = 'email'");
  expect(sql).toContain("'avatar_url'");
  expect(sql).toContain("'picture'");
  expect(sql).toContain("url ~ '^https://'");
  expect(sql).toContain('revoke all on function kingdown_jobs.user_avatar(uuid, uuid) from public, anon, authenticated');
 });
});
