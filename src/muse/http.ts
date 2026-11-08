/** The Muse MCP endpoint: the plugin's HTTP guards in front of the v2 SDK handler, which serves both protocol eras. */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { pluginOrigin, type PluginAuth } from '../plugin/auth';
import { checkMode, createGate, MAX_MCP_BODY, methodNotAllowed, preflight, respond, serveConsent, tracked, trustedRequest, type Consent } from '../plugin/http';
import { createMuseServer, type MuseGames } from './tools';

export const MUSE_PATH = '/muse/mcp';
export const MUSE_METADATA_PATH = `/.well-known/oauth-protected-resource${MUSE_PATH}`;
// The portal's credential test calls from platform.muse.ai.
const MUSE_ORIGINS = ['https://muse.ai', 'https://platform.muse.ai'];
const CORS_HEADERS = 'Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name';
// Connection headers of the Node request; the web Request carries no body and no connection.
const HOP = new Set(['host', 'connection', 'keep-alive', 'content-length', 'transfer-encoding', 'upgrade', 'expect']);
interface Caller { actorId: string; games: MuseGames }

export function createMuseHandler(options: { games: MuseGames; publicOrigin: string; auth?: PluginAuth; localDev?: boolean; consent?: Consent }): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const origin = pluginOrigin(options.publicOrigin);
  checkMode(origin, origin + MUSE_PATH, options.auth, options.localDev);
  const allowedOrigins = new Set([origin, ...MUSE_ORIGINS]);
  // One SDK handler for the instance; the verified caller reaches the per-request server through authInfo.
  const mcp = createMcpHandler(ctx => {
    const { actorId, games } = ctx.authInfo!.extra as unknown as Caller;
    return createMuseServer({ games, actorId, publicOrigin: origin });
  }, { responseMode: 'json', maxRequestBodySize: MAX_MCP_BODY });
  const gate = createGate({ auth: options.auth, localDev: options.localDev, metadataUrl: origin + MUSE_METADATA_PATH }, async (req, res, actorId, body) => {
    // Keep the admission slot until game work settles, even after the client disconnects.
    const games = tracked(options.games), abort = new AbortController();
    res.once('close', () => abort.abort());
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) if (value !== undefined && !HOP.has(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    try {
      const caller: Caller = { actorId, games: games.value };
      const response = await mcp.fetch(new Request(origin + MUSE_PATH, { method: 'POST', headers, signal: abort.signal }),
        { parsedBody: body, authInfo: { token: '', clientId: '', scopes: [], extra: caller as unknown as Record<string, unknown> } });
      if (res.destroyed) return;
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) for await (const chunk of response.body) { if (res.destroyed) break; res.write(chunk); }
      res.end();
    } catch { if (!res.headersSent) respond(res, 500, { error: 'Request failed' }); else res.destroy(); }
    finally { await games.settled(); }
  });
  return async (req, res) => {
    if (!trustedRequest(req, res, origin, allowedOrigins, options.localDev)) return;
    const path = new URL(req.url!, origin).pathname;
    if ((path === '/authorize' || path === '/consent.mjs') && options.consent) { serveConsent(req, res, path, options.consent); return; }
    if (path === MUSE_METADATA_PATH) {
      if (req.method !== 'GET') { methodNotAllowed(res, 'GET'); return; }
      if (!options.auth) { respond(res, 404, { error: 'OAuth is unavailable in local persona mode' }); return; }
      respond(res, 200, options.auth.metadata); return;
    }
    if (path !== MUSE_PATH) { respond(res, 404, { error: 'Not found' }); return; }
    if (req.method === 'OPTIONS') { preflight(res, CORS_HEADERS); return; }
    if (req.method !== 'POST') { methodNotAllowed(res, 'POST, OPTIONS', 'Stateless MCP accepts POST requests'); return; }
    await gate(req, res);
  };
}
