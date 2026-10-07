import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { MatchServiceError, type MatchService } from '../match/service';

const DEFAULT_SETUP = { backRank: 'RAGQKMSL', kings: 'Flame:Haste,Frost:Freeze' } as const;
export const BOARD_RESOURCE = 'ui://kingdown/board-v1.html';
/** Authentication belongs to the HTTP boundary; actorId is never accepted from tool input. */
type Service = Pick<MatchService, 'create' | 'get' | 'move' | 'computer' | 'invite' | 'join'> & { resume(actorId: string): Promise<Awaited<ReturnType<MatchService['get']>> | null> };
export function createPluginServer({ service, actorId, resourceHtml, publicOrigin }: { service: Service; actorId: string; resourceHtml: string; publicOrigin: string }): McpServer {
  const server = new McpServer({ name: 'kingdown', version: '1.0.0' });
  const origin = new URL(publicOrigin).origin;
  registerAppResource(server, 'King Down board', BOARD_RESOURCE, {}, async () => ({ contents: [{ uri: BOARD_RESOURCE, mimeType: RESOURCE_MIME_TYPE, text: resourceHtml, _meta: { ui: { domain: origin, csp: { resourceDomains: [], connectDomains: [] } } } }] }));
  const matchId = z.string().min(1).max(200);
  const command = { id: z.string().min(1).max(200), expectedRevision: z.number().int().nonnegative() };
  function register<T extends z.ZodRawShape>(name: string, description: string, shape: T, run: (args: z.infer<z.ZodObject<T>>) => Promise<unknown>, readOnly = false, launch = false, idempotent = true) {
    registerAppTool(server, name, { description, inputSchema: z.object(shape).strict(), annotations: { readOnlyHint: readOnly, destructiveHint: false, idempotentHint: idempotent, openWorldHint: false }, _meta: { ui: { resourceUri: BOARD_RESOURCE, visibility: launch ? ['model', 'app'] : ['app'] } } }, async (args: z.infer<z.ZodObject<T>>) => {
      try { const value = await run(args); return { content: [{ type: 'text' as const, text: 'King Down updated.' }], structuredContent: value as Record<string, unknown> }; }
      catch (error) { const known = error instanceof MatchServiceError; if (!known) console.error('King Down tool failed', { tool: name, code: 'INTERNAL_ERROR' }); return { isError: true, content: [{ type: 'text' as const, text: known ? error.message : 'Could not update the game. Retry or reload.' }], _meta: { code: known ? error.code : 'INTERNAL_ERROR' } }; }
    });
  }
  register('kingdown_open', 'Open a King Down board. Resume a known match or start a solo or friend game.', { matchId: matchId.optional(), mode: z.enum(['solo', 'friend']).default('solo') }, async args => args.matchId ? service.get(actorId, args.matchId) : await service.resume(actorId) ?? await service.create(actorId, DEFAULT_SETUP, args.mode), false, true, false);
  register('kingdown_create', 'Start a new game.', { mode: z.enum(['solo', 'friend']) }, args => service.create(actorId, DEFAULT_SETUP, args.mode), false, false, false);
  register('kingdown_resume', 'Resume your most recently updated game.', {}, async () => await service.resume(actorId) ?? await service.create(actorId, DEFAULT_SETUP, 'solo'), false, false, false);
  register('kingdown_get', 'Reload the authoritative board.', { matchId }, args => service.get(actorId, args.matchId), true);
  register('kingdown_move', 'Play one exact legal move; retry with the same command ID.', { matchId, ...command, lan: z.string().min(1).max(120) }, args => service.move(actorId, args.matchId, { id: args.id, expectedRevision: args.expectedRevision, lan: args.lan }));
  register('kingdown_computer', 'Ask the bounded computer opponent to play its turn.', { matchId, ...command }, args => service.computer(actorId, args.matchId, { id: args.id, expectedRevision: args.expectedRevision }));
  register('kingdown_invite', 'Create a friend invitation token.', { matchId }, args => service.invite(actorId, args.matchId), false, false, false);
  register('kingdown_join', 'Join a friend game with its invitation token.', { token: z.string().min(1).max(300) }, args => service.join(actorId, args.token));
  return server;
}
