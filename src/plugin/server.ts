import { createHash, randomUUID } from 'node:crypto';
import { diagnostic } from './diagnostics';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { MatchServiceError } from '../match/service';
import { PRESETS, type Action, type View } from '../match/protocol';
import { REPORT_CATEGORIES } from '../account/profile';
import { ending } from './ending';
import type { PluginService } from './service';

/** The plugin build writes this origin before each art file (tools/plugin-ui-build.mjs); the server swaps in its own. */
export const ART_ORIGIN = 'https://kingdown-art.invalid';
const DEFAULT_SETUP = { backRank: 'RAGQKMSO', kings: 'Flame:Haste,Frost:Freeze' } as const;
/** Authentication belongs to the HTTP boundary; actorId is never accepted from tool input. */
type Service = Pick<PluginService, keyof PluginService>;
type Reply = { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; _meta?: Record<string, unknown> };
/** Who may call a tool (MCP Apps visibility) and its hints, which ChatGPT's review requires on every tool (report part 03, section 4.5). */
interface Hints { visibility: ('model' | 'app')[]; readOnly?: boolean; destructive?: boolean; idempotent?: boolean; meta?: Record<string, unknown>; output?: z.ZodRawShape }
const text = (value: string) => [{ type: 'text' as const, text: value }];
export function createPluginServer({ service, actorId, resourceHtml, publicOrigin }: { service: Service; actorId: string; resourceHtml: string; publicOrigin: string }): McpServer {
  const server = new McpServer({ name: 'kingdown', version: '1.0.0' });
  const origin = new URL(publicOrigin).origin;
  resourceHtml = resourceHtml.replaceAll(ART_ORIGIN, origin);
  // Hosts cache resources by URI; a changed board must not reuse old controls.
  const boardResource = `ui://kingdown/board-${createHash('sha256').update(resourceHtml).digest('hex')}.html`;
  registerAppResource(server, 'King Down board', boardResource, {}, async () => ({ contents: [{ uri: boardResource, mimeType: RESOURCE_MIME_TYPE, text: resourceHtml, _meta: { ui: { domain: origin, csp: { resourceDomains: [origin], connectDomains: [] } }, 'openai/widgetCSP': { resource_domains: [origin], connect_domains: [] } } }] }));
  const gameId = z.string().min(1).max(200);
  const boardId = z.string().uuid().optional();
  const command = { game_id: gameId, command_id: z.string().min(1).max(200), expected_revision: z.number().int().min(0).max(1000) };
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
  function reply(view: View, board?: string): Reply {
    const move = Number(view.fen.split(' ')[5]), result = ending(view);
    // A draw offer from either side; the model can answer the opponent's with kingdown_draw.
    const offer = view.draw_offer === null ? null : view.draw_offer === view.seat ? 'yours' : 'opponent';
    return {
      content: text(view.status === 'waiting' ? 'Waiting for the other player to join.' : result ? `Game over: ${result}.`
        : `${view.action === 'ready' ? 'Your move' : 'The other side moves'}, move ${move}.${offer === 'opponent' ? ' The other side offers a draw.' : ''}`),
      structuredContent: { game_id: view.game_id, ...(board && { board_id: board }), kind: view.kind, speed: view.speed, days_per_move: view.days_per_move, status: view.status,
        colour: view.seat === 0 ? 'white' : 'black', your_turn: view.action === 'ready', move, deadline_at: view.deadline_at, draw_offer: offer, ...(result && { result }) },
      _meta: { view },
    };
  }
  /** A board that switches games keeps its ID, so a remount finds the new game. A board whose game was deleted may pick another; another player's board may not. */
  async function select(board: string | undefined, action: () => Promise<View>): Promise<Reply> {
    if (board) await service.board(actorId, board).catch(error => { if (!(error instanceof MatchServiceError) || error.code !== 'MATCH_REMOVED') throw error; });
    const view = await action();
    if (board) await service.selectBoard(actorId, board, view.game_id);
    return reply(view, board);
  }
  /** The most urgent game (your turn first, then the nearest deadline), or a new solo game. */
  async function next(): Promise<View> {
    const urgent = (await service.inbox(actorId))[0];
    return urgent ? service.view(actorId, urgent.game_id) : service.create(actorId, { kind: 'solo', colour: 'white', setup: DEFAULT_SETUP });
  }
  const play = async (args: { game_id: string; command_id: string; expected_revision: number }, action: Action) => reply(await service.command(actorId, args.game_id, { command_id: args.command_id, expected_revision: args.expected_revision, action }));
  // ponytail: a model call has no command ID, so a host retry after a lost reply gets MATCH_TERMINAL, not the first reply.
  const decide = async (args: { game_id: string; command_id?: string; expected_revision?: number }, action: Action) =>
    play({ game_id: args.game_id, command_id: args.command_id ?? randomUUID(), expected_revision: args.expected_revision ?? (await service.view(actorId, args.game_id)).revision }, action);
  const optional = { game_id: gameId, command_id: command.command_id.optional(), expected_revision: command.expected_revision.optional() };

  register('kingdown_open', 'Use this when the player wants to play or see King Down. Shows the board. game_id opens that game; "next" or no game_id opens the most urgent game (your turn first), or starts a solo game when there is none.',
    { game_id: gameId.optional() }, { visibility: ['model', 'app'], idempotent: false }, async args => {
      const view = !args.game_id || args.game_id === 'next' ? await next() : await service.view(actorId, args.game_id);
      return reply(view, await service.openBoard(actorId, view.game_id));
    });
  register('kingdown_create', 'Use this when the player wants a new King Down game: solo against the computer, or with a friend. A friend game is Daily (days per move) unless speed is live. Then show it with kingdown_open; for a friend game, make an invitation with kingdown_invite.',
    { mode: z.enum(['solo', 'friend']), speed: z.enum(['daily', 'live']).optional(), days_per_move: z.union([z.literal(1), z.literal(3), z.literal(7)]).optional(), colour: z.enum(['white', 'black', 'random']).optional(), board_id: boardId },
    { visibility: ['model', 'app'], idempotent: false }, ({ mode, board_id, ...options }) => select(board_id, () => service.create(actorId, { kind: mode, ...options, setup: DEFAULT_SETUP })));
  register('kingdown_resume', 'Show your most urgent game on this board.', { board_id: boardId }, { visibility: ['app'], idempotent: false }, args => select(args.board_id, next));
  register('kingdown_games', 'Use this when the player asks about their King Down games, or "is it my turn?". Lists the active games, your turn first, then the nearest deadline. Open one with kingdown_open.',
    {}, { visibility: ['model'], readOnly: true }, async () => {
      const games = (await service.inbox(actorId)).map(({ opponent, seat, turn: _turn, ...entry }) => ({ ...entry, colour: seat === 0 ? 'white' : 'black', your_turn: entry.action === 'ready',
        opponent: !opponent ? 'none yet' : opponent.computer ? 'computer' : opponent.deleted ? 'deleted player' : 'player' }));
      const ready = games.filter(game => game.your_turn).length;
      return { content: text(games.length ? `${games.length} active game${games.length === 1 ? '' : 's'}; your turn in ${ready}.` : 'No active games. Start one with kingdown_create.'), structuredContent: { games } };
    });
  register('kingdown_get', 'Reload the authoritative board. With since_revision, only the commands after that revision. Writes nothing.',
    { game_id: gameId, since_revision: z.number().int().min(0).max(1000).optional(), board_id: boardId }, { visibility: ['app'], readOnly: true }, async args => {
      const id = args.board_id ? await service.board(actorId, args.board_id) : args.game_id;
      // The board may show another game since it last read: then a full view.
      return reply(await service.view(actorId, id, id === args.game_id ? args.since_revision : undefined), args.board_id);
    });
  register('kingdown_move', 'Play one exact legal move; retry with the same command ID.', { ...command, lan: z.string().min(1).max(120) }, { visibility: ['app'] }, ({ lan, ...args }) => play(args, { type: 'turn', actions: [lan] }));
  register('kingdown_computer', 'Ask the computer opponent to play its turn.', command, { visibility: ['app'] }, args => play(args, { type: 'computer' }));
  register('kingdown_say', 'Send one preset message to the opponent; each preset goes once in each game.', { ...command, preset: z.enum(PRESETS) }, { visibility: ['app'] }, ({ preset, ...args }) => play(args, { type: 'say', preset }));
  register('kingdown_draw', 'Use this when the player wants to offer a draw in a King Down game, or to accept or decline the other side’s offer (draw_offer "opponent"). Accept ends the game.',
    { ...optional, choice: z.enum(['offer', 'accept', 'decline']) }, { visibility: ['model', 'app'], destructive: true }, ({ choice, ...args }) => decide(args, { type: 'draw', choice }));
  register('kingdown_claim', 'Claim the game when the opponent missed the Daily deadline.', command, { visibility: ['app'], destructive: true }, args => play(args, { type: 'claim', reason: 'timeout' }));
  register('kingdown_resign', 'Use this when the player wants to resign a King Down game. The opponent wins.', optional, { visibility: ['model', 'app'], destructive: true }, args => decide(args, { type: 'resign' }));
  register('kingdown_abort', 'Use this when the player wants to cancel a King Down game before each side has played a turn. Nobody wins.', optional, { visibility: ['model', 'app'], destructive: true }, args => decide(args, { type: 'abort' }));
  register('kingdown_invite', 'Use this when the player wants to invite a friend to their waiting friend game. Gives a link and a short code; a new invitation ends the old one.',
    { game_id: gameId }, { visibility: ['model', 'app'], idempotent: false }, async args => {
      const { token, code, expires_at } = await service.invite(actorId, args.game_id), link = `${origin}/j/${token}`;
      return { content: text(`Send your friend this link: ${link} — or the code ${code}. It works until ${expires_at}.`), structuredContent: { game_id: args.game_id, link, code, expires_at } };
    });
  register('kingdown_join', 'Use this when the player has a King Down invitation: a link, its token, or a 6-character code. Then show the game with kingdown_open.',
    { invitation: z.string().min(1).max(300), board_id: boardId }, { visibility: ['model', 'app'] },
    args => select(args.board_id, () => service.join(actorId, /\/j\/([A-Za-z0-9_-]+)/.exec(args.invitation)?.[1] ?? args.invitation)));
  register('kingdown_report', 'Use this when the player wants to report the opponent in a King Down game: the player, their handle, or a preset message (name it). The King Down team reviews each report.',
    { game_id: gameId, target: z.enum(['player', 'handle', 'message']), category: z.enum(REPORT_CATEGORIES), intimate_image: z.boolean().optional(), preset: z.enum(PRESETS).optional(), note: z.string().max(1000).optional() },
    { visibility: ['model', 'app'], idempotent: false }, async args => {
      const { id, created_at } = await service.report(actorId, args);
      return { content: text('Report sent. The King Down team reviews it.'), structuredContent: { id, created_at } };
    });
  // ChatGPT tells connected accounts apart by this ID; an invalid reply can stop the account from connecting.
  register('kingdown_profile', 'The signed-in King Down account: its ID and handle.', {}, { visibility: ['model'], readOnly: true, meta: { 'openai/profile': true }, output: { id: z.string(), name: z.string().optional() } }, async () => {
    const { user_id, handle } = await service.profile(actorId);
    return { content: text(handle ? `Signed in to King Down as ${handle}.` : 'Signed in to King Down; no handle yet.'), structuredContent: { id: user_id, ...(handle && { name: handle }) } };
  });
  return server;
}
