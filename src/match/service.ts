/** Authenticated server operations. Actor IDs come from verified identity, never tool input. */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createMatch, loadMatch, type MatchSetup, type MatchSnapshot, type MoveCommand } from './index';
import { MatchServiceError, PostgresMatchStore, seat, type StoredMatch, type MatchMode } from './store';
export { MatchServiceError } from './store';
export interface MatchView { matchId: string; playerColor: 0 | 1; mode: MatchMode; waiting: boolean; snapshot: MatchSnapshot }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validId(id: string): void { if (typeof id !== 'string' || !uuid.test(id)) throw new MatchServiceError('INVALID_INPUT',400,'Expected a UUID'); }
function view(row: StoredMatch, actor: string): MatchView { return { matchId: row.id, playerColor: seat(row,actor), mode: row.mode, waiting: row.mode === 'friend' && !row.black_id, snapshot: row.snapshot }; }
function hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }
function command(input: { id: string; expectedRevision: number; lan?: string }, computer: boolean): void {
 if (!input || typeof input.id !== 'string' || input.id.length < 1 || input.id.length > 200 || !Number.isInteger(input.expectedRevision) || input.expectedRevision < 0 || input.expectedRevision > 1000 || (!computer && (typeof input.lan !== 'string' || input.lan.length > 200))) throw new MatchServiceError('INVALID_INPUT',400,'Invalid command');
 const keys = Object.keys(input); if (keys.some(key => !['id','expectedRevision',...(computer ? [] : ['lan'])].includes(key))) throw new MatchServiceError('INVALID_INPUT',400,'Unexpected command field');
}
export class MatchService {
 constructor(private store: PostgresMatchStore) {}
 async create(actor: string, setup: MatchSetup = {}, mode: MatchMode = 'solo'): Promise<MatchView> {
  validId(actor); actor = actor.toLowerCase(); if (!['solo','friend'].includes(mode)) throw new MatchServiceError('INVALID_INPUT',400,'Invalid mode');
  let match;
  try { match = await createMatch(setup); const snapshot = await match.snapshot(); const row: StoredMatch = { id: randomUUID(),white_id: actor,black_id: null,mode,revision: snapshot.revision,save: await match.exportSave(),snapshot }; await this.store.create(row); return view(row,actor); }
  catch (error) { if (error instanceof MatchServiceError) throw error; if (!match) throw new MatchServiceError('INVALID_INPUT',400,(error as Error).message); throw error; }
  finally { await match?.close(); }
 }
 async get(actor: string, id: string): Promise<MatchView> { validId(actor); actor = actor.toLowerCase(); validId(id); return view(await this.store.read(id),actor); }
 async resume(actor: string): Promise<MatchView | null> { validId(actor); actor = actor.toLowerCase(); const row = await this.store.latest(actor); return row ? view(row,actor) : null; }
 move(actor: string, id: string, input: MoveCommand): Promise<MatchView> { return this.apply(actor,id,input,false); }
 computer(actor: string, id: string, input: { id: string; expectedRevision: number }): Promise<MatchView> { return this.apply(actor,id,input,true); }
 private async apply(actor: string, id: string, input: MoveCommand | { id: string; expectedRevision: number }, computer: boolean): Promise<MatchView> {
  validId(actor); actor = actor.toLowerCase(); validId(id); command(input,computer);
  const payload = computer ? { kind:'computer',expectedRevision:input.expectedRevision } : { kind:'move',expectedRevision:input.expectedRevision,lan:(input as MoveCommand).lan };
  const row = await this.store.read(id); const color = seat(row,actor);
  if (await this.store.dedupe(row,actor,input.id,payload)) return this.get(actor,id);
  if (row.revision !== input.expectedRevision) throw new MatchServiceError('STALE_REVISION',409,'Match changed; reload before choosing another move');
  if (row.snapshot.status !== 'playing') throw new MatchServiceError('MATCH_TERMINAL',409,'Match has ended');
  if (row.revision >= 1000) throw new MatchServiceError('MATCH_LIMIT',409,'Match history limit reached');
  if (row.mode === 'friend' && !row.black_id) throw new MatchServiceError('WAITING',409,'Waiting for the other player');
  if (computer ? row.mode !== 'solo' || color !== 0 || row.snapshot.turn !== 1 : row.snapshot.turn !== color) throw new MatchServiceError('WRONG_TURN',403,'This operation is not permitted on the current turn');
  const match = await loadMatch(row.save);
  try {
   const lan = computer ? await match.chooseMove({maxTimeMs:250,maxDepth:6}) : (input as MoveCommand).lan;
   let snapshot: MatchSnapshot;
   try { snapshot = await match.apply({id:hash(`${actor}:${input.id}`),expectedRevision:input.expectedRevision,lan}); }
   catch (error) { throw new MatchServiceError('INVALID_MOVE',400,(error as Error).message); }
   const candidate = { ...row,snapshot,revision:snapshot.revision,save:await match.exportSave() };
   return view(await this.store.commit(actor,input.id,payload,candidate),actor);
  } finally { await match.close(); }
 }
 async invite(actor: string, id: string): Promise<{ token: string; expiresAt: string }> {
  validId(actor); actor = actor.toLowerCase(); validId(id); const token = randomBytes(32).toString('base64url'); const expiresAt = new Date(Date.now()+24*60*60*1000).toISOString();
  await this.store.transaction(async client => {
   const row = await this.store.read(id,client,true);
   if (seat(row,actor) !== 0 || row.mode !== 'friend' || row.black_id) throw new MatchServiceError('FORBIDDEN',403,'Only the waiting creator can invite');
   await client.query('delete from public.plugin_match_invites where match_id=$1',[id]);
   await client.query('insert into public.plugin_match_invites(token_hash,match_id,expires_at) values($1,$2,$3)',[hash(token),id,expiresAt]);
  }); return {token,expiresAt};
 }
 async join(actor: string, token: string): Promise<MatchView> {
  validId(actor); actor = actor.toLowerCase(); if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new MatchServiceError('INVALID_INPUT',400,'Invalid invitation');
  return this.store.transaction(async client => {
   const found = await client.query('select match_id from public.plugin_match_invites where token_hash=$1',[hash(token)]);
   if (!found.rows[0]) throw new MatchServiceError('INVITE_UNAVAILABLE',404,'Invitation unavailable');
   const row = await this.store.read(found.rows[0].match_id,client,true);
   const result = await client.query('select * from public.plugin_match_invites where token_hash=$1 for update',[hash(token)]); const invite = result.rows[0];
   if (!invite) throw new MatchServiceError('INVITE_UNAVAILABLE',404,'Invitation unavailable');
   if (invite.joined_by === actor && row.black_id === actor) return view(row,actor);
   if (invite.joined_by || new Date(invite.expires_at).getTime() <= Date.now()) throw new MatchServiceError('INVITE_UNAVAILABLE',409,'Invitation expired or used');
   if (row.white_id === actor || row.black_id || row.mode !== 'friend') throw new MatchServiceError('FORBIDDEN',403,'This seat cannot be joined');
   await client.query('update public.plugin_matches set black_id=$2,updated_at=now() where id=$1',[row.id,actor]);
   await client.query('update public.plugin_match_invites set joined_by=$2 where token_hash=$1',[hash(token),actor]);
   return view({...row,black_id:actor},actor);
  });
 }
 async deleteAccountMatches(actor: string): Promise<void> { validId(actor); actor = actor.toLowerCase(); await this.store.deleteForActor(actor); }
}
