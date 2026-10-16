/** What the ChatGPT tools call (report part 03, section 4.5): the game service on the ChatGPT surface, a report, the
 * profile and the board selections. A board selection (`plugin_boards`) lets a remounted board find the game it shows,
 * also when the host replays an old tool result and drops the widget state. The actor is a verified user ID, never input. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { handleProblem, ICONS } from '../account/profile';
import { fail, GameService, id, parse } from '../match/service';
import type { PostgresMatchStore } from '../match/store';
import { AccountService } from '../online/accounts';
import { SettingsService } from './settings';
import { SafetyService } from '../online/safety';

export const handleSchema = z.strictObject({ handle: z.string().max(40).optional(), icon: z.enum(Object.keys(ICONS) as [keyof typeof ICONS, ...(keyof typeof ICONS)[]]).optional(), check: z.boolean().optional() });
const seated = 'exists(select from public.game_players where game_id=$3 and user_id=$2)';
export class PluginService {
  private games: GameService; private safety: SafetyService; private accounts: AccountService; private playerSettings: SettingsService;
  constructor(private store: PostgresMatchStore) { this.games = new GameService(store); this.safety = new SafetyService(store); this.accounts = new AccountService(store); this.playerSettings = new SettingsService(store.pool); }
  create(actor: string, input: unknown, commandId?: string) { return this.games.create(actor, input, commandId); }
  /** Read-only. */
  view(actor: string, gameId: string, since?: number) { return this.games.view(actor, gameId, since); }
  /** Records seat activity at most once each 30 seconds. */
  seen(actor: string, gameId: string) { return this.games.seen(actor, gameId); }
  /** Read-only. */
  inbox(actor: string) { return this.games.inbox(actor); }
  /** Read-only: finished games and the actor's record. */
  history(actor: string, before?: string, limit = 20) { return this.games.history(actor, before, limit); }
  record(actor: string) { return this.games.record(actor); }
  command(actor: string, gameId: string, input: unknown) { return this.games.command(actor, gameId, input, 'chatgpt'); }
  invite(actor: string, gameId: string) { return this.games.invite(actor, gameId); }
  join(actor: string, invitation: unknown) { return this.games.join(actor, invitation); }
  preview(actor: string, code: unknown) { return this.games.preview(actor, code); }
  lobby(actor: string) { return this.games.lobby(actor); }
  accept(actor: string, gameId: string) { return this.games.accept(actor, gameId); }
  find(actor: string, options: unknown, colour: unknown = 'white', commandId?: string, anyRules = false) { return this.games.find(actor, options, colour, commandId, anyRules); }
  cancel(actor: string, gameId: string) { return this.games.cancel(actor, gameId); }
  report(actor: string, input: unknown) { return this.safety.report(actor, input); }
  /** Read-only. The ID and the handle; never the email. */
  async profile(actor: string) { const { user_id, handle, icon } = await this.accounts.profile(actor); return { user_id, handle, icon }; }
  settings(actor: string, input: unknown = {}) { return this.playerSettings.settings(actor, input); }
  async handle(actor: string, input: unknown) {
    actor = id(actor); const { handle, icon, check } = parse(handleSchema, input);
    if (check) {
      if (handle === undefined || icon !== undefined) return fail('INVALID_INPUT', 400, 'Name one handle to check');
      const name = handle.trim().toLowerCase(), problem = handleProblem(name);
      if (problem) fail('INVALID_INPUT', 400, problem);
      const taken = (await this.store.pool.query('select exists(select from public.profiles where handle=$1 and id<>$2) or exists(select from public.reserved_handles where handle=$1) as taken', [name, actor])).rows[0].taken;
      if (taken) fail('HANDLE_TAKEN', 409, 'This handle is taken');
    } else {
      if (handle !== undefined) await this.accounts.setHandle(actor, { handle });
      if (icon !== undefined && (await this.profile(actor)).icon !== icon) await this.accounts.updateSettings(actor, { icon });
    }
    return this.profile(actor);
  }
  /** A new board for a game where the actor has a seat. */
  async openBoard(actor: string, gameId?: string): Promise<string> {
    const board = randomUUID();
    if (!gameId) { await this.store.pool.query('insert into public.plugin_boards(id,actor_id,match_id,game_selected) values($1,$2,null,false)', [board, id(actor)]); return board; }
    const result = await this.store.pool.query(`insert into public.plugin_boards(id,actor_id,match_id) select $1,$2,$3 where ${seated}`, [board, id(actor), id(gameId)]);
    return result.rowCount ? board : fail('FORBIDDEN', 403, 'You do not have a seat in this game');
  }
  /** Read-only: the game that the actor's board shows now. */
  async board(actor: string, boardId: string): Promise<string | null> {
    const row = (await this.store.pool.query('select match_id,game_selected from public.plugin_boards where id=$1 and actor_id=$2', [id(boardId), id(actor)])).rows[0] ?? fail('FORBIDDEN', 403, 'Board unavailable for this account');
    if (!row.game_selected) return null;
    return row.match_id ?? fail('MATCH_REMOVED', 404, 'This game was deleted. Start, resume or join another game.');
  }
  /** The actor's board shows another game where the actor has a seat. */
  async selectBoard(actor: string, boardId: string, gameId: string): Promise<void> {
    const result = await this.store.pool.query(`update public.plugin_boards set match_id=$3,game_selected=true where id=$1 and actor_id=$2 and ${seated}`, [id(boardId), id(actor), id(gameId)]);
    if (!result.rowCount) fail('FORBIDDEN', 403, 'Board unavailable for this account');
  }
}
