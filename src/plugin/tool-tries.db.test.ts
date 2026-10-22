import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { PostgresMatchStore } from '../match/store';
import { PluginService, TOOL_LIMITS } from './service';

const url = process.env.PLUGIN_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

/** The live tool limit (PluginService.toolTry) over two pools, one connection each, so two calls can race for one row. */
suite('ChatGPT and website tool limits on PostgreSQL', () => {
 let pools: pg.Pool[], services: PluginService[];
 const toolTry = (i: number, actor: string, tool: keyof typeof TOOL_LIMITS) => services[i].toolTry(actor, tool);
 const users: string[] = [];
 async function user() {
  const actor = randomUUID(); users.push(actor);
  await pools[0].query('insert into auth.users(id) values($1)', [actor]);
  return actor;
 }
 const rows = async (actor: string, tool: string) => (await pools[1].query('select tries,window_start from public.plugin_tool_tries where user_id=$1 and tool=$2', [actor, tool])).rows;
 beforeAll(async () => {
  const own = await ownTestDatabase('tooltries');
  pools = [0, 1].map(() => new pg.Pool({ connectionString: own.href, max: 1 }));
  services = pools.map(pool => new PluginService(new PostgresMatchStore(pool)));
 }, 120000);
 afterAll(async () => {
  if (!pools) return;
  try { await pools[0].query('delete from auth.users where id=any($1::uuid[])', [users]); }
  finally { await Promise.all(pools.map(pool => pool.end())); }
 });

 const LIMITS = [
  ['kingdown_computer', 120, 60, 'Too many computer turns. Wait one minute, then try again.'],
  ['kingdown_create', 60, 60, 'Too many new games. Wait one minute, then try again.'],
  ['kingdown_open', 60, 60, 'Too many new boards. Wait one minute, then try again.'],
  ['kingdown_report', 30, 3600, 'Too many reports. Wait one hour, then try again.'],
 ] as const;
 it('covers every live tool limit', () => {
  expect(Object.fromEntries(LIMITS.map(([tool, count, seconds, message]) => [tool, { count, seconds, message }]))).toEqual(TOOL_LIMITS);
 });

 it.each(LIMITS)('keeps the %s limit, isolates each actor and tool, saturates and resets its window', async (tool, count, seconds, message) => {
  const actor = await user(), other = await user();
  await toolTry(0, actor.toUpperCase(), tool);
  const start = await rows(actor, tool);
  expect(start).toEqual([{ tries: 1, window_start: expect.any(Date) }]);
  await toolTry(1, actor, tool);
  expect(await rows(actor, tool)).toEqual([{ ...start[0], tries: 2 }]);
  await pools[0].query('update public.plugin_tool_tries set tries=$3 where user_id=$1 and tool=$2', [actor, tool, count - 1]);
  await toolTry(1, actor, tool);
  expect(await rows(actor, tool)).toEqual([{ ...start[0], tries: count }]);
  for (let i = 0; i < 2; i++) {
   await expect(toolTry(i, actor, tool)).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429, message });
   expect(await rows(actor, tool)).toEqual([{ ...start[0], tries: count + 1 }]);
  }
  await toolTry(0, other, tool);
  expect(await rows(other, tool)).toEqual([{ tries: 1, window_start: expect.any(Date) }]);
  const otherTool = tool === 'kingdown_open' ? 'kingdown_create' : 'kingdown_open';
  await toolTry(0, actor, otherTool);
  expect(await rows(actor, otherTool)).toEqual([{ tries: 1, window_start: expect.any(Date) }]);
  expect(await rows(actor, tool)).toEqual([{ ...start[0], tries: count + 1 }]);
  await pools[0].query("update public.plugin_tool_tries set window_start=now()-$3*interval '1 second' where user_id=$1 and tool=$2", [actor, tool, seconds / 2]);
  await expect(toolTry(1, actor, tool)).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  await pools[0].query("update public.plugin_tool_tries set window_start=now()-$3*interval '1 second' where user_id=$1 and tool=$2", [actor, tool, seconds + 1]);
  await toolTry(1, actor, tool);
  const reset = await rows(actor, tool);
  expect(reset).toEqual([{ tries: 1, window_start: expect.any(Date) }]);
  expect(reset[0].window_start.getTime()).toBeGreaterThan(start[0].window_start.getTime());
 });

 it('admits one concurrent attempt at the last budget slot across two pools', async () => {
  const actor = await user();
  await pools[0].query("insert into public.plugin_tool_tries(user_id,tool,tries) values($1,'kingdown_create',59)", [actor]);
  const pids = await Promise.all(pools.map(async pool => (await pool.query('select pg_backend_pid() as pid')).rows[0].pid));
  const lock = new pg.Client({ connectionString: pools[0].options.connectionString });
  await lock.connect();
  let pending: Promise<PromiseSettledResult<void>[]> | undefined;
  try {
   await lock.query('begin');
   await lock.query("select from public.plugin_tool_tries where user_id=$1 and tool='kingdown_create' for update", [actor]);
   pending = Promise.allSettled(services.map(service => service.toolTry(actor, 'kingdown_create')));
   await expect.poll(async () => (await lock.query(
    'select count(distinct pid)::int as n from pg_locks where pid=any($1::int[]) and not granted', [pids],
   )).rows[0].n, { timeout: 5000 }).toBe(2);
  } finally {
   try { await lock.query('rollback'); }
   finally { await lock.end(); await pending; }
  }
  const results = await pending;
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(result => result.status === 'rejected')).toMatchObject([{ reason: { code: 'RATE_LIMITED', status: 429 } }]);
  expect(await rows(actor, 'kingdown_create')).toEqual([{ tries: 61, window_start: expect.any(Date) }]);
 }, 10000);

 it('keeps the charge after a later service refusal', async () => {
  const actor = await user();
  await toolTry(0, actor, 'kingdown_computer');
  const charged = await rows(actor, 'kingdown_computer');
  await expect(services[0].command(actor, randomUUID(), { command_id: randomUUID(), expected_revision: 0, action: { type: 'computer' } })).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  expect(await rows(actor, 'kingdown_computer')).toEqual(charged);
  expect(charged[0].tries).toBe(1);
 });

 it('refuses a malformed actor before it writes a counter', async () => {
  await expect(toolTry(0, 'not-a-user', 'kingdown_create')).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 });
 });
});
