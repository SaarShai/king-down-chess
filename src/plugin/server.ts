import { createHash, randomUUID } from 'node:crypto';
import { diagnostic } from './diagnostics';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { MatchServiceError } from '../match/service';
import { MAX_REVISION, PRESETS, type Action, type View } from '../match/protocol';
import { DEFAULT_OPTIONS } from '../match/setup';
import { choiceSchema, optionsSchema } from '../match/setup-schema';
import { REPORT_CATEGORIES } from '../account/profile';
import { settingsSchema } from './settings';
import { ending } from './ending';
import { handleSchema } from './service';
import type { PluginService } from './service';

/** The plugin build writes this origin before each art file (tools/plugin-ui-build.mjs); the server swaps in its own. */
export const ART_ORIGIN = 'https://kingdown-art.invalid';
/** Authentication belongs to the HTTP boundary; actorId is never accepted from tool input. */
type Service = Pick<PluginService, keyof PluginService>;
type Reply = { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; _meta?: Record<string, unknown> };
/** Who may call a tool (MCP Apps visibility) and its hints, which ChatGPT's review requires on every tool (report part 03, section 4.5). */
interface Hints { visibility: ('model' | 'app')[]; readOnly?: boolean; destructive?: boolean; idempotent?: boolean; meta?: Record<string, unknown>; output?: z.ZodRawShape }
const text = (value: string) => [{ type: 'text' as const, text: value }];
let page = { source: '', origin: '', html: '', uri: '' };
/** The page with its art origin, and its URI. Hosts cache resources by URI, so a changed board must not reuse old
 *  controls. The HTTP handler makes a server for each request: the swap and the hash run once for each page and origin. */
function boardPage(source: string, origin: string): { html: string; uri: string } {
  if (page.source !== source || page.origin !== origin) {
    const html = source.replaceAll(ART_ORIGIN, origin);
    page = { source, origin, html, uri: `ui://kingdown/board-${createHash('sha256').update(html).digest('hex')}.html` };
  }
  return page;
}
export function createPluginServer({ service, actorId, resourceHtml, publicOrigin }: { service: Service; actorId: string; resourceHtml: string; publicOrigin: string }): McpServer {
  const server = new McpServer({ name: 'kingdown', version: '1.0.0' });
  const origin = new URL(publicOrigin).origin;
  const { html, uri: boardResource } = boardPage(resourceHtml, origin);
  registerAppResource(server, 'King Down board', boardResource, {}, async () => ({ contents: [{ uri: boardResource, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: { ui: { domain: origin, csp: { resourceDomains: [origin], connectDomains: [] } }, 'openai/widgetCSP': { resource_domains: [origin], connect_domains: [] } } }] }));
  const gameId = z.string().uuid();
  const boardId = z.string().uuid().optional();
  const command = { game_id: gameId, command_id: z.string().min(1).max(200), expected_revision: z.number().int().min(0).max(MAX_REVISION) };
  function register<T extends z.ZodRawShape>(name: string, description: string, shape: T, { visibility, readOnly = false, destructive = false, idempotent = true, meta, output }: Hints, run: (args: z.infer<z.ZodObject<T>>) => Promise<Reply>) {
    // Only kingdown_open carries the board: a template on every tool makes ChatGPT redraw the board too often.
    registerAppTool(server, name, { description, inputSchema: z.object(shape).strict(), ...(output && { outputSchema: z.object(output).strict() }), annotations: { readOnlyHint: readOnly, destructiveHint: destructive, idempotentHint: idempotent, openWorldHint: false },
      _meta: { ...meta, ui: { ...(name === 'kingdown_open' && { resourceUri: boardResource }), visibility } } }, async (args: z.infer<z.ZodObject<T>>) => {
      try { return await run(args); }
      catch (error) { const known = error instanceof MatchServiceError; if (!known || error.status >= 500) console.error('King Down tool failed', { tool: name, requestId: randomUUID(), ...diagnostic(error) }); return { isError: true, content: text(known ? error.message : 'Could not update the game. Retry or reload.'), _meta: { code: known ? error.code : 'INTERNAL_ERROR' } }; }
    });
  }
  /** The position, the legal moves, the opponent's handle and presets go in `_meta`, which only the board reads.
   * The model gets a short summary with no position and no opponent text (part 03, section 4.5; part 01, section 6.6). */
  async function reply(view: View, board?: string): Promise<Reply> {
    const { handle, icon } = await service.profile(actorId);
    const move = view.fen ? Number(view.fen.split(' ')[5]) : undefined, result = ending(view);
    // A draw offer from either side; the model can answer the opponent's with kingdown_draw.
    const offer = view.draw_offer === null ? null : view.draw_offer === view.seat ? 'yours' : 'opponent';
    return {
      content: text(view.status === 'waiting' ? 'Waiting for the other player to join.' : view.status === 'setup' ? view.ready?.[view.seat] ? 'Waiting for the other player to choose.' : 'Choose your king and arrangement.' : result ? `Game over: ${result}${result.endsWith('.') ? '' : '.'}`
        : `${view.action === 'ready' ? 'Your move' : 'The other side moves'}, move ${move}.${offer === 'opponent' ? ' The other side offers a draw.' : ''}`),
      structuredContent: { screen: 'board', game_id: view.game_id, ...(board && { board_id: board }), kind: view.kind, speed: view.speed, days_per_move: view.days_per_move, status: view.status,
        colour: view.seat === 0 ? 'white' : 'black', your_turn: view.action === 'ready', ...(move !== undefined && { move }), deadline_at: view.deadline_at, draw_offer: offer, ...(result && { result }) },
      _meta: { view, me: { handle, icon } },
    };
  }
  /** A board that switches games keeps its ID, so a remount finds the new game. A board whose game was deleted may pick another; another player's board may not. */
  async function select(board: string | undefined, action: () => Promise<View>): Promise<Reply> {
    if (board) await service.board(actorId, board).catch(error => { if (!(error instanceof MatchServiceError) || error.code !== 'MATCH_REMOVED') throw error; });
    const view = await action();
    if (board) await service.selectBoard(actorId, board, view.game_id);
    return reply(view, board);
  }
  const home = async (board?: string): Promise<Reply> => { const { handle, icon } = await service.profile(actorId); return { content: text('King Down. Start a game from Play.'), structuredContent: { screen: 'home', ...(board && { board_id: board }), your_turn_count: 0 }, _meta: { me: { handle, icon } } }; };
  /** The most urgent game, or home when no game is open. */
  async function next(): Promise<View | null> {
    const urgent = (await service.inbox(actorId))[0];
    return urgent ? service.view(actorId, urgent.game_id) : null;
  }
  const play = async (args: { game_id: string; command_id: string; expected_revision: number }, action: Action) => reply(await service.command(actorId, args.game_id, { command_id: args.command_id, expected_revision: args.expected_revision, action }));
  // ponytail: a model call has no command ID, so a host retry after a lost reply gets MATCH_TERMINAL, not the first reply.
  const decide = async (args: { game_id: string; command_id?: string; expected_revision?: number }, action: Action) =>
    play({ game_id: args.game_id, command_id: args.command_id ?? randomUUID(), expected_revision: args.expected_revision ?? (await service.view(actorId, args.game_id)).revision }, action);
  const optional = { game_id: gameId, command_id: command.command_id.optional(), expected_revision: command.expected_revision.optional() };

  register('kingdown_open', 'Use this when the player says "play King Down", wants to open a game, says "join King Down game K7QX2M", or says "show my King Down profile". Use code to preview a join; use screen "profile" for the profile page. Opens home with no new game; game_id or "next" selects a game.',
    { screen: z.enum(['home', 'play', 'board', 'profile']).optional(), game_id: z.union([gameId, z.literal('next')]).optional(), code: z.string().min(1).max(300).optional() }, { visibility: ['model', 'app'], idempotent: false }, async args => {
      const preview = args.code ? await service.preview(actorId, args.code) : undefined;
      const view = preview ? null : args.game_id === 'next' ? await next() : args.game_id ? await service.view(actorId, args.game_id) : null;
      const board = await service.openBoard(actorId, view?.game_id);
      const games = await service.inbox(actorId), count = games.filter(game => game.action === 'ready').length;
      const result = view ? await reply(view, board) : await home(board);
      result.structuredContent = { ...result.structuredContent, screen: preview ? 'join' : args.screen ?? (view ? 'board' : 'home'), your_turn_count: count };
      if (!view) result.content = text(`Your move in ${count} games.`);
      const settings = await service.settings(actorId);
      result._meta = { ...result._meta, games, settings, ...(preview && { preview }) };
      if (preview) result.content = text('Review the game features before you join.');
      return result;
    });
  register('kingdown_create', 'Use this when the player wants a new King Down game against the computer, a friend or a random player. Choose the features, colour and computer level.',
    { kind: z.enum(['solo', 'friend', 'random']), options: optionsSchema.optional(), colour: z.enum(['white', 'black', 'random']).optional(), level: z.enum(['beginner', 'casual', 'club', 'strong']).optional(), board_id: boardId },
    { visibility: ['model', 'app'], idempotent: false }, ({ board_id, ...input }) => select(board_id, async () => service.create(actorId, { ...input, options: input.options ?? (await service.settings(actorId)).last_setup?.options ?? DEFAULT_OPTIONS })));
  register('kingdown_resume', 'Show a selected game, or your most urgent game, on this board.', { board_id: z.string().uuid(), game_id: gameId.optional() }, { visibility: ['app'], idempotent: false }, async args => {
    if (args.game_id) return select(args.board_id, () => service.view(actorId, args.game_id!));
    await service.board(actorId, args.board_id).catch(error => { if (!(error instanceof MatchServiceError) || error.code !== 'MATCH_REMOVED') throw error; });
    const view = await next();
    if (!view) return home(args.board_id);
    await service.selectBoard(actorId, args.board_id, view.game_id);
    return reply(view, args.board_id);
  });
  register('kingdown_games', 'Use this when the player asks about their King Down games, or "is it my turn?". Lists the active games, your turn first, then the nearest deadline. Open one with kingdown_open.',
    {}, { visibility: ['model', 'app'], readOnly: true }, async () => {
      const rows = await service.inbox(actorId), games = rows.map(entry => ({ game_id: entry.game_id, kind: entry.kind, speed: entry.speed, status: entry.status,
        revision: entry.revision, deadline_at: entry.deadline_at, colour: entry.seat === 0 ? 'white' : 'black', your_turn: entry.action === 'ready',
        opponent: !entry.opponent ? 'none yet' : entry.opponent.computer ? 'computer' : entry.opponent.deleted ? 'deleted player' : 'player' }));
      const ready = games.filter(game => game.your_turn).length;
      return { content: text(games.length ? `${games.length} active game${games.length === 1 ? '' : 's'}; your turn in ${ready}.` : 'No active games. Start one with kingdown_create.'), structuredContent: { games }, _meta: { games: rows } };
    });
  register('kingdown_get', 'Reload the authoritative board. With since_revision, only the commands after that revision. Writes nothing.',
    { game_id: gameId.optional(), since_revision: z.number().int().min(0).max(MAX_REVISION).optional(), board_id: boardId }, { visibility: ['app'], readOnly: true }, async args => {
      const id = args.board_id ? await service.board(actorId, args.board_id) : args.game_id;
      if (!id && args.board_id) return home(args.board_id);
      if (!id) throw new MatchServiceError('INVALID_INPUT', 400, 'Name a game or a board');
      // The board may show another game since it last read: then a full view.
      return reply(await service.view(actorId, id, id === args.game_id ? args.since_revision : undefined), args.board_id);
    });
  register('kingdown_lobby', 'List open games, oldest first.', {}, { visibility: ['app'], readOnly: true }, async () => {
    const lobby = await service.lobby(actorId);
    return { content: text(`${lobby.games.length} open games.`), structuredContent: { count: lobby.games.length }, _meta: { lobby: { ...lobby, server_now: new Date().toISOString() } } };
  });
  register('kingdown_accept', 'Take the open seat in a random game.', { game_id: gameId, board_id: boardId }, { visibility: ['app'] }, args => select(args.board_id, () => service.accept(actorId, args.game_id)));
  register('kingdown_find', 'Take the oldest open game, or open your own.', { options: optionsSchema, colour: z.enum(['white', 'black', 'random']).optional(), board_id: boardId }, { visibility: ['app'], idempotent: false }, args => select(args.board_id, () => service.find(actorId, args.options, args.colour)));
  register('kingdown_cancel', 'Cancel your waiting random game with no result.', { game_id: gameId }, { visibility: ['app'], destructive: true }, async args => reply(await service.cancel(actorId, args.game_id)));
  register('kingdown_choose', 'Choose your king and back-rank order, then mark your seat Ready.', { ...command, king: choiceSchema.shape.king, order: choiceSchema.shape.order, ready: z.boolean() }, { visibility: ['app'] }, ({ king, order, ready, ...args }) => play(args, { type: 'choose', choice: { king, order }, ready }));
  register('kingdown_rematch', 'Offer, accept or decline a rematch. The reply stays on this game; resume the rematch to move the board.', { ...command, choice: z.enum(['offer', 'accept', 'decline']) }, { visibility: ['app'] }, ({ choice, ...args }) => play(args, { type: 'rematch', choice }));
  register('kingdown_move', 'Play one exact legal move; retry with the same command ID.', { ...command, lan: z.string().min(1).max(120) }, { visibility: ['app'] }, ({ lan, ...args }) => play(args, { type: 'turn', actions: [lan] }));
  register('kingdown_computer', 'Ask the computer opponent to play its turn.', command, { visibility: ['app'] }, args => play(args, { type: 'computer' }));
  register('kingdown_say', 'Send one preset message to the opponent; each preset goes once in each game.', { ...command, preset: z.enum(PRESETS) }, { visibility: ['app'] }, ({ preset, ...args }) => play(args, { type: 'say', preset }));
  register('kingdown_draw', 'Use this when the player wants to offer a draw in a King Down game, or to accept or decline the other side’s offer (draw_offer "opponent"). Accept ends the game.',
    { ...optional, choice: z.enum(['offer', 'accept', 'decline']) }, { visibility: ['model', 'app'], destructive: true }, ({ choice, ...args }) => decide(args, { type: 'draw', choice }));
  register('kingdown_claim', 'Claim the game when the opponent missed the Daily deadline.', command, { visibility: ['app'], destructive: true }, args => play(args, { type: 'claim', reason: 'timeout' }));
  register('kingdown_resign', 'Use this when the player wants to resign a King Down game. The opponent wins.', optional, { visibility: ['model', 'app'], destructive: true }, args => decide(args, { type: 'resign' }));
  register('kingdown_abort', 'Use this when the player wants to cancel a King Down game before each side has played a turn. Nobody wins.', optional, { visibility: ['model', 'app'], destructive: true }, args => decide(args, { type: 'abort' }));
  register('kingdown_invite', 'Use this when the player wants to invite a friend to their waiting friend game. Gives a short code; a new invitation ends the old one.',
    { game_id: gameId }, { visibility: ['model', 'app'], idempotent: false }, async args => {
      const { code, expires_at } = await service.invite(actorId, args.game_id);
      return { content: text(`Send your friend the code ${code}. It works until ${expires_at}.`), structuredContent: { code, expires_at } };
    });
  register('kingdown_join', 'Use this when the player has a King Down invitation: a 6-character code. Then show the game with kingdown_open.',
    { code: z.string().min(1).max(300), preview: z.boolean().optional(), board_id: boardId }, { visibility: ['model', 'app'] },
    async args => args.preview ? { content: text('Review the game features before you join.'), structuredContent: { screen: 'join', ...(args.board_id && { board_id: args.board_id }) }, _meta: { preview: await service.preview(actorId, args.code) } } : select(args.board_id, () => service.join(actorId, args.code)));
  register('kingdown_report', 'Use this when the player wants to report the opponent in a King Down game: the player, their handle, or a preset message (name it). The King Down team reviews each report.',
    { game_id: gameId, target: z.enum(['player', 'handle', 'message']), category: z.enum(REPORT_CATEGORIES), intimate_image: z.boolean().optional(), preset: z.enum(PRESETS).optional(), note: z.string().max(MAX_REVISION).optional() },
    { visibility: ['model', 'app'], idempotent: false }, async args => {
      const { id, created_at } = await service.report(actorId, args);
      return { content: text('Report sent. The King Down team reviews it.'), structuredContent: { id, created_at } };
    });
  register('kingdown_handle', 'Pick a handle and a preset picture, or check that a handle is free without a write.', handleSchema.shape, { visibility: ['app'] }, async args => {
    const { handle, icon } = await service.handle(actorId, args);
    return { content: text(args.check ? 'This handle is free.' : 'Your name and picture are ready.'), ...(args.check && { structuredContent: { available: true } }), _meta: { me: { handle, icon } } };
  });
  register('kingdown_settings', 'Read or change your board settings and last setup choices.', settingsSchema.shape, { visibility: ['app'] }, async args => {
    const [settings, { handle, icon }] = await Promise.all([service.settings(actorId, args), service.profile(actorId)]);
    return { content: text('Your settings are ready.'), _meta: { settings, me: { handle, icon } } };
  });
  // ChatGPT tells connected accounts apart by this ID; an invalid reply can stop the account from connecting.
  register('kingdown_profile', 'Use this when the player asks for their King Down rating, totals or badges in text. For "show my King Down profile", open kingdown_open with screen "profile".', { before: z.string().max(100).optional() }, { visibility: ['model', 'app'], readOnly: true, meta: { 'openai/profile': true }, output: { id: z.string(), name: z.string().optional() } }, async args => {
    const [{ user_id, handle, icon }, record, history] = await Promise.all([service.profile(actorId), service.record(actorId), service.history(actorId, args.before)]);
    const { played, won, drawn, lost } = record.totals;
    return { content: text(`Rating ${Math.round(record.rating.rating)}${record.rating.provisional ? '?' : ''}; ${played} played, ${won} won, ${drawn} drawn, ${lost} lost; ${record.badges.length} badges.`), structuredContent: { id: user_id, ...(handle && { name: handle }) }, _meta: { handle, icon, record, history: history.games, next_before: history.next_before } };
  });
  return server;
}
