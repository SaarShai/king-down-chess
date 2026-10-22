/**
 * Test-only sample data for the review account (approval D8 a; docs/submission/test-cases.md "Before submission"):
 * one finished friend game that the review account won (a rating, and the First Win, Friend Match and Purist
 * badges), one active friend game with the opponent to move, and one Classic beginner computer game
 * where it is the review account's move.
 * The owner makes both accounts first (docs/submission/checklist.md, owner step 2). This script reads no password.
 * The owner's test account gets the same data against the same opponent, with its own handle (KINGDOWN_REVIEW_HANDLE),
 * so that the owner's test runs leave the review account as the seed left it.
 *
 *   PLUGIN_DATABASE_URL=… KINGDOWN_REVIEW_EMAIL=… KINGDOWN_REVIEW_OPPONENT_EMAIL=… [KINGDOWN_REVIEW_HANDLE=…] npm run plugin:db:seed-review
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { DEFAULT_OPTIONS } from '../../src/match/setup';
import { GameService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
import { AccountService } from '../../src/online/accounts';
import { testDatabase } from '../plugin-db-config.mjs';

const CLASSIC = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };

export async function seedReview(pool: pg.Pool, reviewEmail: string, opponentEmail: string, handles = { review: 'review-player', opponent: 'review-friend' }) {
 testDatabase(pool.options.connectionString);
 // The seed uses its one invite code at once, so a secret of its own works and the live secret stays on the server.
 const store = new PostgresMatchStore(pool), games = new GameService(store, randomBytes(32).toString('hex')), accounts = new AccountService(store);
 const account = async (email: string): Promise<string> => {
  const id = (await pool.query('select id from auth.users where lower(email)=lower($1)', [email.trim()])).rows[0]?.id;
  if (!id) throw new Error(`No account has the address ${email}. Make it first.`);
  return id;
 };
 const [review, opponent] = [await account(reviewEmail), await account(opponentEmail)];
 if (review === opponent) throw new Error('The review account and its opponent must be two accounts');
 // Two runs would make a second set of games and change the counts in the test cases.
 if ((await pool.query('select from public.game_players where user_id=$1 limit 1', [review])).rowCount) throw new Error('The review account has games already. Use a new account.');
 for (const [user, handle] of [[review, handles.review], [opponent, handles.opponent]] as const)
  if (!(await accounts.profile(user)).handle) await accounts.setHandle(user, { handle });
 const turn = async (actor: string, gameId: string) => {
  const view = await games.view(actor, gameId);
  return games.command(actor, gameId, { command_id: randomUUID(), expected_revision: view.revision, action: { type: 'turn', actions: [view.legal[0]] } });
 };
 const friend = await games.create(review, { kind: 'friend', options: CLASSIC, colour: 'white' });
 await games.join(opponent, (await games.invite(review, friend.game_id)).code);
 await turn(review, friend.game_id); await turn(opponent, friend.game_id);
 const ended = await games.view(opponent, friend.game_id);
 await games.command(opponent, friend.game_id, { command_id: randomUUID(), expected_revision: ended.revision, action: { type: 'resign' } });
 const activeFriend = await games.create(review, { kind: 'friend', options: CLASSIC, colour: 'white' });
 await games.join(opponent, (await games.invite(review, activeFriend.game_id)).code);
 await turn(review, activeFriend.game_id);
 const solo = await games.create(review, { kind: 'solo', options: CLASSIC, colour: 'white', level: 'beginner' });
 return { review, finished: friend.game_id, active: solo.game_id, activeFriend: activeFriend.game_id, record: await games.record(review) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const { PLUGIN_DATABASE_URL: connectionString, KINGDOWN_REVIEW_EMAIL: reviewEmail, KINGDOWN_REVIEW_OPPONENT_EMAIL: opponentEmail, KINGDOWN_REVIEW_HANDLE: handle = 'review-player' } = process.env;
 if (!connectionString || !reviewEmail || !opponentEmail) throw new Error('Set PLUGIN_DATABASE_URL, KINGDOWN_REVIEW_EMAIL and KINGDOWN_REVIEW_OPPONENT_EMAIL');
 testDatabase(connectionString);
 const pool = new pg.Pool({ connectionString, max: 1 });
 try {
  const { finished, active, activeFriend, record } = await seedReview(pool, reviewEmail, opponentEmail, { review: handle, opponent: 'review-friend' });
  const { played, won, drawn, lost } = record.totals;
  console.log(`Review account seeded: finished game ${finished}, active computer game ${active}, active friend game ${activeFriend}; rating ${Math.round(record.rating.rating)}${record.rating.provisional ? '?' : ''}; ${played} played, ${won} won, ${drawn} drawn, ${lost} lost; ${record.badges.length} badges.`);
 } finally { await pool.end(); }
}
