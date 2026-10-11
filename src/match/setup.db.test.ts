/** Ticket 06: real game service calls on a separate disposable database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
const command = (expected_revision: number, action: object, command_id = randomUUID()) => ({ command_id, expected_revision, action });
suite('game setup through PostgreSQL', () => {
 let admin: pg.Pool, runtime: pg.Pool, service: GameService, own: URL, role: string;
 const users: string[] = [];
 let a: string, b: string;
 beforeAll(async () => {
  own = await ownTestDatabase('setup');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  role = `setup_${randomUUID().replaceAll('-', '')}`;
  const password = randomUUID(), grants = await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, () => admin.query(`${grants.replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  const login = new URL(own.href); login.username = role; login.password = password;
  runtime = new pg.Pool({ connectionString: login.href, max: 2 }); service = new GameService(new PostgresMatchStore(runtime));
  a = randomUUID(); b = randomUUID(); users.push(a, b);
  for (const id of users) await admin.query('insert into auth.users(id) values($1)', [id]);
 }, 120_000);
 afterAll(async () => {
  if (!admin) return;
  await admin.query('delete from public.games where created_by=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await runtime?.end();
  await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
  await admin.end();
 });
 it('adds repeatable setup columns and grants without changing a saved game', async () => {
  const game = await service.create(a, { kind: 'solo', colour: 'white' });
  const migration = await readFile(new URL('../../supabase/migrations/0010_game_setup.sql', import.meta.url), 'utf8');
  await admin.query(migration); await admin.query(migration);
  expect((await runtime.query('select options,draw,deal,level,setup_deadline_at,rematch_offer,rematch_game_id from public.games where id=$1', [game.game_id])).rows[0])
   .toEqual({ options: null, draw: null, deal: null, level: 'club', setup_deadline_at: null, rematch_offer: null, rematch_game_id: null });
  expect((await runtime.query('select choice,ready from public.game_players where game_id=$1 order by seat', [game.game_id])).rows).toEqual([{ choice: null, ready: false }, { choice: null, ready: false }]);
  expect(await service.command(a, game.game_id, command(0, { type: 'turn', actions: [game.legal[0]] }))).toMatchObject({ status: 'playing', revision: 1, turn: 1 });
 }, 30_000);
});
