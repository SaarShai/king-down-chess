/** What the ChatGPT tools call (report part 03, section 4.5): the game service on the ChatGPT surface, a report, the
 * profile and the board selections. A board selection (`plugin_boards`) lets a remounted board find the game it shows,
 * also when the host replays an old tool result and drops the widget state. The actor is a verified user ID, never input. */
import { randomUUID } from 'node:crypto';
import { fail, GameService, id } from '../match/service';
import type { PostgresMatchStore } from '../match/store';
import { AccountService } from '../online/accounts';
import { SafetyService } from '../online/safety';

const seated = 'exists(select from public.game_players where game_id=$3 and user_id=$2)';
export class PluginService {
  private games: GameService; private safety: SafetyService; private accounts: AccountService;
  constructor(private store: PostgresMatchStore) { this.games = new GameService(store); this.safety = new SafetyService(store); this.accounts = new AccountService(store); }
  create(actor: string, input: unknown) { return this.games.create(actor, input); }
  /** Read-only. */
  view(actor: string, gameId: string, since?: number) { return this.games.view(actor, gameId, since); }
  /** Read-only. */
  inbox(actor: string) { return this.games.inbox(actor); }
  command(actor: string, gameId: string, input: unknown) { return this.games.command(actor, gameId, input, 'chatgpt'); }
  invite(actor: string, gameId: string) { return this.games.invite(actor, gameId); }
  join(actor: string, invitation: unknown) { return this.games.join(actor, invitation); }
  lobby(actor: string) { return this.games.lobby(actor); }
  accept(actor: string, gameId: string) { return this.games.accept(actor, gameId); }
  find(actor: string, options: unknown, colour: unknown = 'white') { return this.games.find(actor, options, colour); }
  cancel(actor: string, gameId: string) { return this.games.cancel(actor, gameId); }
  report(actor: string, input: unknown) { return this.safety.report(actor, input); }
  /** Read-only. The ID and the handle; never the email. */
  async profile(actor: string): Promise<{ user_id: string; handle: string | null }> { const { user_id, handle } = await this.accounts.profile(actor); return { user_id, handle }; }
  /** A new board for a game where the actor has a seat. */
  async openBoard(actor: string, gameId: string): Promise<string> {
    const board = randomUUID();
    const result = await this.store.pool.query(`insert into public.plugin_boards(id,actor_id,match_id) select $1,$2,$3 where ${seated}`, [board, id(actor), id(gameId)]);
    return result.rowCount ? board : fail('FORBIDDEN', 403, 'You do not have a seat in this game');
  }
  /** Read-only: the game that the actor's board shows now. */
  async board(actor: string, boardId: string): Promise<string> {
    const row = (await this.store.pool.query('select match_id from public.plugin_boards where id=$1 and actor_id=$2', [id(boardId), id(actor)])).rows[0] ?? fail('FORBIDDEN', 403, 'Board unavailable for this account');
    return row.match_id ?? fail('MATCH_REMOVED', 404, 'This game was deleted. Start, resume or join another game.');
  }
  /** The actor's board shows another game where the actor has a seat. */
  async selectBoard(actor: string, boardId: string, gameId: string): Promise<void> {
    const result = await this.store.pool.query(`update public.plugin_boards set match_id=$3 where id=$1 and actor_id=$2 and ${seated}`, [id(boardId), id(actor), id(gameId)]);
    if (!result.rowCount) fail('FORBIDDEN', 403, 'Board unavailable for this account');
  }
}
