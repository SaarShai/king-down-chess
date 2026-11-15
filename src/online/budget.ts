/**
 * The daily job's one time rule (PR 363 review). The deployed function stops at 30 s (tools/plugin-server-build.mjs,
 * maxDuration), so each step of the daily job starts only when the time left covers the step's bound, and the bound
 * holds: a step that does not fit throws OutOfTime, and it and the later steps wait for the next run.
 * A database step is one connection and one transaction: the connection wait, begin, SET LOCAL statement_timeout and
 * lock_timeout, the statements (node-postgres query_timeout) and the commit all end by the step's end. A step that runs
 * out of time before COMMIT rolls back, so the row it was for stays due. If the COMMIT reply is lost, the commit may have
 * happened: the job cannot know, and it sends no notice for that row (decision 106). Only the daily job uses this; other
 * routes keep their timeouts.
 */
import type { Pool, PoolClient, QueryConfig } from 'pg';
import { PostgresMatchStore } from '../match/store';

/** The bound of one database step. */
export const STEP_MS = 2_000;

/** The step does not fit in the time left: the job stops here and the rest stays due. */
export class OutOfTime extends Error { constructor() { super('No time is left for this daily step'); this.name = 'OutOfTime'; } }
/** A database step passed its bound. It fails like any database error, and the job goes on with the next step. */
export class StepTimeout extends Error { readonly code = 'ETIMEDOUT'; constructor() { super('The daily step timed out'); this.name = 'StepTimeout'; } }

export class Budget {
 /** Every step ends by `deadline` (ms since the epoch). */
 constructor(readonly deadline: number) {}
 /** The same budget less `ms`: the time kept for the later steps. */
 keep(ms: number): Budget { return new Budget(this.deadline - ms); }
 /** True when a step with this bound can start now. */
 fits(bound: number): boolean { return this.deadline - Date.now() >= bound; }
 /** Starts a step with this bound and returns its end, or throws OutOfTime. */
 step(bound: number): number { if (!this.fits(bound)) throw new OutOfTime(); return Date.now() + bound; }

 /** One database step: a connection from `pool`, one transaction, `action`, commit. */
 async transaction<T>(pool: Pool, action: (client: PoolClient) => Promise<T>, bound = STEP_MS): Promise<T> {
  const end = this.step(bound), raw = await within(pool.connect(), end, late => late.release());
  let lost = false;
  const call = async (text: string, values?: unknown[]) => {
   // After a failed call, nothing more goes on this connection: no statement and no commit, even if the action goes on.
   if (lost) throw new Error('The daily step lost its connection');
   const ms = Math.floor(end - Date.now());
   // No time to roll back: the release below drops the connection, and PostgreSQL rolls back.
   if (ms < 1) { lost = true; throw new OutOfTime(); }
   try { return await within(raw.query({ text, values, query_timeout: ms } as QueryConfig), end); }
   // The connection can be waiting for a reply: drop it.
   catch (error) { lost = true; throw error; }
  };
  try {
   await call('begin');
   const ms = Math.max(1, Math.floor(end - Date.now()));
   await call(`set local statement_timeout = ${ms}; set local lock_timeout = ${ms}`);
   const value = await action({ query: call } as unknown as PoolClient);
   await call('commit');
   return value;
  } catch (error) {
   if (!lost) await call('rollback').catch(() => {});
   throw error;
  } finally { raw.release(lost); }
 }

 /** A pool whose every query is one database step. */
 pool(pool: Pool): Pool {
  return { query: (text: string, values?: unknown[]) => this.transaction(pool, client => client.query(text, values)) } as unknown as Pool;
 }

 /** A game store whose every query and transaction is one database step (the daily job's game commands). */
 store(pool: Pool): PostgresMatchStore {
  const budget = this;
  return new class extends PostgresMatchStore {
   override transaction<T>(action: (client: PoolClient) => Promise<T>): Promise<T> { return budget.transaction(pool, action); }
  }(this.pool(pool));
 }
}

/** `work`, or a StepTimeout at `end`. A result that comes later goes to `late` (a connection goes back to the pool). */
async function within<T>(work: Promise<T>, end: number, late: (value: T) => void = () => {}): Promise<T> {
 let timer: ReturnType<typeof setTimeout> | undefined, over = false;
 try {
  return await Promise.race([work, new Promise<never>((_, reject) => {
   timer = setTimeout(() => { over = true; reject(new StepTimeout()); }, Math.max(0, end - Date.now()));
  })]);
 } finally {
  clearTimeout(timer);
  if (over) work.then(late, () => {});
 }
}
