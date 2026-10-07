/** Stateless, authenticated Streamable HTTP: one actor closure and transport per request. */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ACTOR_UUID, AuthenticationError, isLoopback, pluginOrigin, type PluginAuth } from './auth';
import { createPluginServer } from './server';

export const MAX_MCP_BODY = 128 * 1024;
export const MAX_ACTIVE_MCP = 4;
export interface PluginHttpOptions {
  service: Parameters<typeof createPluginServer>[0]['service'];
  resourceHtml: string;
  publicOrigin: string;
  auth?: PluginAuth;
  consent?: { html: string; script: string; supabaseOrigin: string };
  /** Explicit local process mode; never a production authentication fallback. */
  localDev?: boolean;
}
function respond(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
/** Pre-parse once so a JSON-RPC batch cannot fan out workers behind one admission slot. */
async function requestBody(req: IncomingMessage, res: ServerResponse): Promise<{ value: unknown } | undefined> {
  const tooLarge = () => { res.setHeader('Connection', 'close'); respond(res, 413, { error: 'Request body too large' }); req.resume(); };
  if (Number(req.headers['content-length']) > MAX_MCP_BODY) { tooLarge(); return; }
  const chunks: Buffer[] = []; let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length; if (bytes > MAX_MCP_BODY) { tooLarge(); return; }
    chunks.push(chunk);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (Array.isArray(value)) { respond(res, 400, { error: 'JSON-RPC batches are not supported' }); return; }
    return { value };
  } catch { respond(res, 400, { error: 'Malformed JSON' }); return; }
}
export function createPluginHandler(options: PluginHttpOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const origin = pluginOrigin(options.publicOrigin), expectedHost = new URL(origin).host;
  if (options.localDev) {
    if (process.env.NODE_ENV === 'production' || !isLoopback(new URL(origin).hostname) || options.auth) throw new Error('Local personas require an explicit loopback-only development process');
  } else if (!options.auth || options.auth.resource !== `${origin}/mcp`) throw new Error('Resource-bound OAuth configuration is required');
  const allowedOrigins = new Set([origin, 'https://chatgpt.com', 'https://chat.openai.com']);
  const metadataUrl = `${origin}/.well-known/oauth-protected-resource/mcp`;
  let active = 0;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.headers.host?.toLowerCase() !== expectedHost.toLowerCase() || (req.headers.origin !== undefined && !allowedOrigins.has(req.headers.origin))) { respond(res, 403, { error: 'Untrusted host or origin' }); return; }
    if (options.localDev && !isLoopback(req.socket.remoteAddress ?? '')) { respond(res, 403, { error: 'Local development requires a loopback peer' }); return; }
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate, MCP-Protocol-Version');
    }
    if (!req.url?.startsWith('/')) { respond(res, 400, { error: 'Malformed request target' }); return; }
    const path = new URL(req.url, origin).pathname;
    if ((path === '/authorize' || path === '/consent.mjs') && options.consent) {
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); respond(res, 405, { error: 'Method not allowed' }); return; }
      res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src ${options.consent.supabaseOrigin}; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Type', path === '/authorize' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8');
      res.end(path === '/authorize' ? options.consent.html : options.consent.script); return;
    }
    if (path === '/.well-known/oauth-protected-resource' || path === '/.well-known/oauth-protected-resource/mcp') {
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); respond(res, 405, { error: 'Method not allowed' }); return; }
      if (!options.auth) { respond(res, 404, { error: 'OAuth is unavailable in local persona mode' }); return; }
      respond(res, 200, options.auth.metadata); return;
    }
    if (path !== '/mcp') { respond(res, 404, { error: 'Not found' }); return; }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, MCP-Protocol-Version', 'Access-Control-Max-Age': '600' }); res.end(); return;
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); respond(res, 405, { error: 'Stateless MCP accepts POST requests' }); return; }
    if (active >= MAX_ACTIVE_MCP) { res.setHeader('Retry-After', '1'); respond(res, 503, { error: 'This server instance is busy; retry shortly' }); return; }
    active++;
    try {
      let actorId: string;
      try {
        if (options.localDev) {
          const actor = req.headers['x-kingdown-dev-actor'];
          if (typeof actor !== 'string' || !ACTOR_UUID.test(actor) || req.headers.authorization) throw new AuthenticationError();
          actorId = actor.toLowerCase();
        } else {
          const authorization = req.headers.authorization;
          const match = typeof authorization === 'string' && /^Bearer ([A-Za-z0-9._~-]+)$/i.exec(authorization);
          if (!match) throw new AuthenticationError();
          actorId = await options.auth!.verify(match[1]);
        }
      } catch {
        if (options.auth) res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${metadataUrl}", scope="openid"`);
        respond(res, 401, { error: 'Authentication required' }); return;
      }
      const body = await requestBody(req, res); if (!body || res.destroyed) return;
      const work = new Set<Promise<unknown>>();
      // Keep the admission slot until service work settles, even after the client disconnects.
      const service = new Proxy(options.service, { get(target, key) {
        const method = Reflect.get(target, key); if (typeof method !== 'function') return method;
        return (...args: unknown[]) => {
          const task = Promise.resolve().then(() => Reflect.apply(method, target, args)); work.add(task);
          void task.finally(() => work.delete(task)).catch(() => {}); return task;
        };
      } });
      const server = createPluginServer({ service, actorId, resourceHtml: options.resourceHtml, publicOrigin: origin });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: MAX_MCP_BODY });
      let closed = false;
      const close = async () => { if (!closed) { closed = true; await server.close(); } };
      let disconnected!: () => void;
      const responseClosed = new Promise<void>(resolve => { disconnected = resolve; });
      res.once('close', () => { disconnected(); void close().catch(() => {}); });
      try { await server.connect(transport); await Promise.race([transport.handleRequest(req, res, body.value), responseClosed]); }
      catch { if (!res.headersSent) respond(res, 500, { error: 'Request failed' }); else res.destroy(); }
      finally {
        try { await close(); } finally {
          // kingdown_open can call resume and then create; drain sequential follow-on work too.
          while (work.size) await Promise.allSettled([...work]);
        }
      }
    } finally { active--; }
  };
}
