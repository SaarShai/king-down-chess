/** Server-only PostgreSQL authority; never import into a browser bundle. */
import type { Pool, PoolClient } from 'pg';
import type { MatchSnapshot } from './index';
export type MatchMode = 'solo' | 'friend';
export interface StoredMatch { id: string; white_id: string; black_id: string | null; mode: MatchMode; revision: number; save: string; snapshot: MatchSnapshot }
export class MatchServiceError extends Error {
 constructor(public code: string, public status: number, message: string) { super(message); this.name = 'MatchServiceError'; }
}
export function seat(row: StoredMatch, actor: string): 0 | 1 {
 if (row.white_id === actor) return 0;
 if (row.black_id === actor) return 1;
 throw new MatchServiceError('FORBIDDEN', 403, 'You do not have a seat in this match');
}
export class PostgresMatchStore {
 constructor(readonly pool: Pool) {}
 async transaction<T>(action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await this.pool.connect();
  try { await client.query('begin'); const value = await action(client); await client.query('commit'); return value; }
  catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
 }
 async read(id: string, client: Pool | PoolClient = this.pool, lock = false): Promise<StoredMatch> {
  const result = await client.query<StoredMatch>(`select * from public.plugin_matches where id=$1${lock ? ' for update' : ''}`, [id]);
  if (!result.rows[0]) throw new MatchServiceError('NOT_FOUND', 404, 'Match not found');
  return result.rows[0];
 }
 async create(row: StoredMatch): Promise<void> {
  await this.pool.query('insert into public.plugin_matches(id,white_id,black_id,mode,revision,save,snapshot) values($1,$2,$3,$4,$5,$6,$7)', [row.id,row.white_id,row.black_id,row.mode,row.revision,row.save,row.snapshot]);
 }
 async dedupe(row: StoredMatch, actor: string, id: string, payload: object, client: Pool | PoolClient = this.pool): Promise<boolean> {
  const result = await client.query('select payload=$4::jsonb as same from public.plugin_match_commands where match_id=$1 and actor_id=$2 and command_id=$3', [row.id,actor,id,JSON.stringify(payload)]);
  if (!result.rows.length) return false;
  if (!result.rows[0].same) throw new MatchServiceError('COMMAND_CONFLICT',409,'Command ID was used with different input');
  return true;
 }
 async commit(actor: string, id: string, payload: { expectedRevision: number }, candidate: StoredMatch): Promise<StoredMatch> {
  return this.transaction(async client => {
   const current = await this.read(candidate.id,client,true); seat(current,actor);
   if (await this.dedupe(current,actor,id,payload,client)) return current;
   if (current.revision !== payload.expectedRevision) throw new MatchServiceError('STALE_REVISION',409,'Match changed; reload before choosing another move');
   await client.query('insert into public.plugin_match_commands(match_id,actor_id,command_id,payload) values($1,$2,$3,$4)',[current.id,actor,id,payload]);
   await client.query('update public.plugin_matches set revision=$2,save=$3,snapshot=$4,updated_at=now() where id=$1',[current.id,candidate.revision,candidate.save,candidate.snapshot]);
   return { ...current, revision: candidate.revision, save: candidate.save, snapshot: candidate.snapshot };
  });
 }
 async deleteForActor(actor: string): Promise<void> { await this.pool.query('delete from public.plugin_matches where white_id=$1 or black_id=$1',[actor]); }
}
