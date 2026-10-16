/** The review account seed (approval D8 a) gives the data that test cases P3, P4 and P5 need. */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
import { seedReview } from './seed-review';

const url = process.env.PLUGIN_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite('the review account seed', () => {
 let pool: pg.Pool; const users: string[] = [], tag = randomUUID().slice(0, 8);
 const account = async (name: string) => { const id = randomUUID(); users.push(id); await pool.query('insert into auth.users(id,email) values($1,$2)', [id, `${name}-${tag}@example.test`]); return `${name}-${tag}@example.test`; };
 beforeAll(() => { pool = new pg.Pool({ connectionString: url, max: 2 }); });
 afterAll(async () => {
  if (!pool) return;
  await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await pool.query('delete from auth.users where id=any($1)', [users]);
  await pool.end();
 });

 it('makes one won friend game with a rating and badges, then one computer game on the review account\'s move', async () => {
  const [review, opponent] = [await account('Review'), await account('friend')];
  const handles = { review: `rv-${tag}`, opponent: `rf-${tag}` };
  const seeded = await seedReview(pool, ` ${review.toUpperCase()} `, opponent, handles);
  expect(seeded.record.totals).toEqual({ played: 1, won: 1, drawn: 0, lost: 0 });
  expect(seeded.record.rating.rating).toBeGreaterThan(1500);
  expect(seeded.record.badges.map(b => b.badge).sort()).toEqual(['first_win', 'friend_match', 'purist']);
  const games = new GameService(new PostgresMatchStore(pool));
  expect(await games.view(seeded.review, seeded.finished)).toMatchObject({ status: 'finished', kind: 'friend' });
  expect(await games.view(seeded.review, seeded.active)).toMatchObject({ status: 'playing', kind: 'solo', level: 'beginner', seat: 0, turn: 0 });
  expect((await games.inbox(seeded.review)).filter(game => game.action === 'ready').map(game => game.game_id)).toEqual([seeded.active]);
  expect((await pool.query('select handle from public.profiles where id=$1', [seeded.review])).rows[0].handle).toBe(handles.review);
  // A second run, or an address with no account, changes nothing.
  await expect(seedReview(pool, review, opponent, handles)).rejects.toThrow('has games already');
  await expect(seedReview(pool, `nobody-${tag}@example.test`, opponent, handles)).rejects.toThrow('No account');
  await expect(seedReview(pool, opponent, opponent, handles)).rejects.toThrow('two accounts');
 });
});
