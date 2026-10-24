import type { Page } from 'playwright';
import { randomUUID } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import type { MatchSetup } from '../src/match';
import { fixtureService, type FixtureEngine } from './plugin-protocol-fixture';
import { ART_HEADERS, artType } from './plugin-art-headers.mjs';
import { pluginSymbols } from './lib/plugin-symbols.mjs';
type UiMeta = { ui?: { csp?: { connectDomains?: string[]; resourceDomains?: string[]; frameDomains?: string[]; baseUriDomains?: string[] }; permissions?: Record<string, unknown> } };
/** The frame rules of a real host, from the resource's _meta.ui. The MCP Apps spec (2026-01-26, apps.mdx,
 * https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) says: "Host MUST
 * construct CSP headers based on declared domains", and "If ui.csp is omitted, Host MUST use" its restrictive default.
 * Its section "Content Security Policy Enforcement" builds each directive below from ui.csp. The Apps SDK reference
 * (developers.openai.com/apps-sdk/reference) names _meta.ui.csp as ChatGPT's "Preferred metadata surface for standard
 * widget CSP fields". The spec says that "The Host and the Sandbox MUST have different origins" and that the sandbox
 * "MUST have the following permissions: `allow-scripts`, `allow-same-origin`". This host adds allow-forms, because the
 * widget submits forms (the join code and the name). Each declared permission becomes an iframe `allow` feature, as
 * the spec permits ("clipboardWrite ... Maps to Permission Policy `clipboard-write` feature"). */
export function framePolicy(meta: UiMeta = {}) {
  const csp = meta.ui?.csp, sandbox = 'allow-scripts allow-same-origin allow-forms';
  const features = { camera: 'camera', microphone: 'microphone', geolocation: 'geolocation', clipboardWrite: 'clipboard-write' };
  const allow = Object.entries(features).filter(([key]) => key in (meta.ui?.permissions ?? {})).map(([, feature]) => feature).join('; ');
  if (!csp) return { sandbox, allow, csp: "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'none'" };
  const resources = (csp.resourceDomains ?? []).join(' '), or = (domains: string[] | undefined, fallback: string) => domains?.length ? domains.join(' ') : fallback;
  return { sandbox, allow, csp: [
    "default-src 'none'", `script-src 'self' 'unsafe-inline' ${resources}`, `style-src 'self' 'unsafe-inline' ${resources}`,
    `connect-src 'self' ${(csp.connectDomains ?? []).join(' ')}`, `img-src 'self' data: ${resources}`, `font-src 'self' ${resources}`,
    `media-src 'self' data: ${resources}`, `frame-src ${or(csp.frameDomains, "'none'")}`, "object-src 'none'", `base-uri ${or(csp.baseUriDomains, "'self'")}`,
  ].map(directive => directive.trim()).join('; ') };
}
// The widget page's window.openai. The page is on another origin, so the boot delay and the widget state come from the
// host page by postMessage before the app code runs, and each write goes back the same way. ChatGPT also keeps the
// state outside the frame: "Widget state belongs to one rendered UI instance" (developers.openai.com/apps-sdk/build/state-management).
const FRAME_SHIM = `<script>addEventListener('message', event => { if (event.source === parent && event.data?.harness === 'fence') parent.postMessage(event.data, '*'); });
// Playwright's WebKit keeps each removed widget page, and its canvas buffers, until the host page navigates (ticket 45).
// A board page holds 126 MB of them. On the CI runner, which has no GPU, each board remount kept about 700 MB, and
// WebKit killed the page at 8192 MB; with the buffers dropped, about 125 MB (ticket 77, item 24). The host removes a
// frame only for good, so its page drops them as it goes; a pagehide into the back-forward cache (persisted) keeps a
// live page and its canvases.
// On that runner WebKit draws an accelerated 2D canvas with software GL (Mesa llvmpipe), which took about 2.5 of the
// 4 CPUs, and plugin-ui passed its time limit. PLAYABLE_CPU_CANVAS=1, set by the WebKit CI jobs, asks for CPU canvases
// (willReadFrequently); plugin-ui then took 809 s, near the 750 s of Chromium (ticket 77, item 27).
(() => {
  const canvases = [], seen = new WeakSet();
  for (const type of [HTMLCanvasElement, self.OffscreenCanvas].filter(Boolean)) {
    const getContext = type.prototype.getContext;
    type.prototype.getContext = function (...args) {${process.env.PLAYABLE_CPU_CANVAS === '1' ? " if (args[0] === '2d') args[1] = { ...args[1], willReadFrequently: true };" : ''} if (!seen.has(this)) { seen.add(this); canvases.push(new WeakRef(this)); } return getContext.apply(this, args); };
  }
  addEventListener('pagehide', event => { if (event.persisted) return; for (const ref of canvases) { const canvas = ref.deref(); try { if (canvas) canvas.width = canvas.height = 0; } catch {} } });
})();
window.harnessBoot = new Promise(resolve => {
  addEventListener('message', function boot(event) {
    const data = event.data;
    if (event.source !== parent || data?.harness !== 'boot') return;
    removeEventListener('message', boot);
    if (data.openai) window.openai = { widgetState: data.widgetState, setWidgetState(state) { parent.postMessage({ harness: 'widget-state', state }, '*'); } };
    // A check's clock step runs this timer inside a DevTools call, which may evaluate strings in spite of the CSP. The
    // widget code starts in a task of its own, as on a real page load, so zod's eval probe meets the CSP.
    setTimeout(() => { const channel = new MessageChannel(); channel.port1.onmessage = resolve; channel.port2.postMessage(0); }, data.bootDelay);
    parent.postMessage({ harness: 'booted' }, '*');
  });
  parent.postMessage({ harness: 'boot' }, '*');
});</script>`;
/** The page as a host gets it: through the resource the open tool names, with the art origin set by the server. */
async function board(client: Client) {
  const tools = (await client.listTools()).tools;
  const uri = (tools.find(tool => tool.name === 'kingdown_open')?._meta?.ui as {resourceUri?: string})?.resourceUri;
  if (!uri) throw new Error('The MCP server did not advertise the board resource');
  const result = await client.readResource({ uri });
  const resource = result.contents.find(content => content.mimeType === 'text/html;profile=mcp-app' && 'text' in content);
  if (!resource || !('text' in resource)) throw new Error('The MCP server did not return the board HTML');
  console.log(`Read board resource through MCP: ${Buffer.byteLength(JSON.stringify(result))} JSON bytes`);
  return { html: resource.text, meta: (resource._meta ?? {}) as UiMeta };
}
export async function startHarness({ boardPath = 'plugin-server-dist/board.html', endpoint, actor, friendActor, laterFriendActor, seedPosition, deleteMatch, sourcePage = false, pageEngine, engine }: { engine?: FixtureEngine; pageEngine?: string; sourcePage?: boolean; boardPath?: string; endpoint?: URL; actor?: string; friendActor?: string; laterFriendActor?: string; seedPosition?: (setup: MatchSetup, black: boolean) => Promise<string>; deleteMatch?: (id: string) => Promise<void> } = {}) {
  if (endpoint && (endpoint.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password)) throw new Error('The HTTP harness accepts only a loopback development endpoint');
  let buddy: Client | undefined, laterBuddy: Client | undefined;
  const client = new Client({ name: 'local-browser-host', version: '1' });
  const service = endpoint ? undefined : fixtureService(engine);
  let server: ReturnType<typeof createPluginServer> | undefined, buddyServer: ReturnType<typeof createPluginServer> | undefined, laterBuddyServer: ReturnType<typeof createPluginServer> | undefined;
  let resource: Awaited<ReturnType<typeof board>>;
  let vite: Awaited<ReturnType<typeof createServer>> | undefined;
  // The widget's own origin: a second loopback port with the same routes as Vite, as ChatGPT serves a widget from its sandbox origin.
  const frameServer = createHttpServer((req, res) => vite!.middlewares(req, res));
  frameServer.on('upgrade', (req, socket, head) => vite!.httpServer!.emit('upgrade', req, socket, head));
  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    frameServer.closeAllConnections();
    const results = await Promise.allSettled([new Promise<void>(resolve => frameServer.close(() => resolve())), vite?.close(), client.close(), buddy?.close(), laterBuddy?.close(), server?.close(), buddyServer?.close(), laterBuddyServer?.close(), service?.close()]);
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'Could not close the plugin harness');
  }
  try {
  if (endpoint) {
    if (!actor || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor)) throw new Error('Set PLUGIN_DEV_ACTOR to the disposable development actor UUID');
    if (friendActor) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(friendActor) || friendActor === actor) throw new Error('PLUGIN_FRIEND_ACTOR must be a different development actor UUID'); buddy = new Client({ name: 'local-browser-friend', version: '1' }); await buddy.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': friendActor }, redirect: 'error' } })); }
    if (laterFriendActor) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(laterFriendActor) || [actor,friendActor].includes(laterFriendActor)) throw new Error('The later friend needs a separate development actor UUID');
      laterBuddy = new Client({ name: 'local-browser-later-friend', version: '1' }); await laterBuddy.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': laterFriendActor }, redirect: 'error' } }));
    }
    await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': actor }, redirect: 'error' } }));
    resource = await board(client);
  }
  frameServer.listen(0, '127.0.0.1'); await new Promise(resolve => frameServer.once('listening', resolve));
  const frameHost = `127.0.0.1:${(frameServer.address() as AddressInfo).port}`;
  const body = async (req: AsyncIterable<Buffer>) => { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString()); };
  vite = await createServer({ define: sourcePage && pageEngine ? { __KINGDOWN_PAGE_ENGINE__: JSON.stringify(pageEngine) } : {}, configFile: false, logLevel: 'error', cacheDir: resolve(dirname(boardPath), '.harness-cache'), optimizeDeps: { include: ['@modelcontextprotocol/ext-apps/app-bridge'] }, server: { host: '127.0.0.1', port: 0, strictPort: true }, plugins: [pluginSymbols(), { name: 'mcp-app-harness', configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      // The frame origin serves the widget page and the files it loads; the host page and its routes stay on the host origin.
      const path = req.url?.split('?')[0] ?? '';
      if (req.headers.host === frameHost ? path === '/' || /^\/(fixture-|harness-)/.test(path) : path === '/board-resource') { res.statusCode = 404; res.end(); }
      else if (req.url === '/harness-mode') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ mode: endpoint ? 'http' : 'fixture', friend: !!buddy })); }
      else if (req.url === '/fixture-seed' && service && req.method === 'POST') { const {actor='alice',data} = await body(req); if (!['alice','bob'].includes(actor)) { res.statusCode = 400; res.end('{}'); return; } service.seed(actor,data); res.setHeader('Content-Type','application/json'); res.end('{}'); }
      else if (req.url === '/fixture-friend-tool' && req.method === 'POST') { const {fresh,...params} = await body(req); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await (fresh ? laterBuddy : buddy)!.callTool(params))); }
      else if (req.url?.startsWith('/fixture-position?') && req.method === 'POST') {
        const params = new URL(req.url,'http://localhost').searchParams, scenario = params.get('case'), fen = params.get('fen'), black = fen ? params.get('black') === '1' : scenario === 'freeze' || scenario === 'threats-black';
        // The art gallery: every piece type of both colours on the kings' ranks ('gallery'), or only the kings and two pawns
        // on other squares ('apart'), with one of three king pairs, so the six kings show in three games.
        const kings = ['Spirit:Mercy,Shadow:Darkness', 'Frost:Freeze,Flame:Haste', 'Stratus:Flight,Mud:March'][Number(params.get('kings') ?? 0)];
        // `fen` (with `black=1` for a game as Black against bob) sets any classic position, for motion checks.
        const setup = fen ? {fen,kings:'none,none'} : scenario === 'swap' ? {fen:'7k/8/8/8/2RM4/8/8/K7 w - - 0 1',kings:'none,none'} : scenario === 'threats-black' ? {fen:'7k/4p3/8/4R3/8/8/8/K7 w - - 0 1',kings:'none,none'} : black ? {fen:'7k/8/8/8/4P3/8/8/K7 b - - 0 1',kings:'none,Frost:Freeze'}
          : scenario === 'threats' ? {fen:'7k/8/8/8/4r3/8/4P3/K7 w - - 0 1',kings:'none,none'}
          : scenario === 'haste' ? {backRank:'RAGQKMSO',kings:'Flame:Haste,Frost:Freeze'}
          : scenario === 'gallery' ? {fen:'rnbqkalg/msoppppp/8/8/8/8/MSOPPPPP/RNBQKALG w - - 0 1',kings}
          : scenario === 'apart' ? {fen:'8/8/8/k4p2/2P4K/8/8/8 w - - 0 1',kings}
          : {fen:'7k/8/8/2p5/8/2A5/8/K7 w - - 0 1',kings:'none,none'};
        if (scenario === 'skylift') Object.assign(setup, { hand: ['SkyLift'] });
        let matchId;
        if (seedPosition) matchId = await seedPosition(setup,black);
        else matchId = await service!.seedPosition(setup,black);
        const result = await client.callTool({name:'kingdown_open',arguments:{game_id:matchId}});
        res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(result));
      }
      else if (req.url === '/fixture-delete-match' && req.method === 'POST') {
        const {game_id}=await body(req);
        if (deleteMatch) await deleteMatch(game_id); else await service!.deleteMatch(game_id);
        res.end('{}');
      }
      else if (req.url === '/fixture-terminal' && service) { const view = await service.create('alice', { kind: 'solo', colour: 'white', setup: { fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1' } }); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ content: [], structuredContent: { game_id: view.game_id }, _meta: { view } })); }
      else if (!endpoint && req.url?.startsWith('/plugin-art/') && artType(req.url.slice(12))) {
        const file = await readFile(resolve(dirname(boardPath), req.url!.slice(1))).catch(() => undefined);
        if (!file) { res.statusCode = 404; res.end(); } else { res.writeHead(200, { 'Content-Type': artType(req.url!.slice(12)), ...ART_HEADERS }); res.end(file); }
      }
      else if (req.url === '/board-resource') {
        res.setHeader('Content-Type', 'text/html'); res.setHeader('Content-Security-Policy', framePolicy(resource.meta).csp);
        // Raw source HTML needs Vite's dev environment before app imports read configured defines.
        const html = sourcePage ? (await readFile('src/plugin/index.html', 'utf8')).replace('<script type="module" src="./app.ts"></script>', '<script type="module">await import("/@vite/env"); window.harnessApp = await import("/src/plugin/app.ts");</script>') : resource.html;
        res.end(html.replace('<script type="module">', '<script type="module">await window.harnessBoot;').replace('<head>', `<head>${FRAME_SHIM}`));
      }
      else if (req.url === '/fixture-tool' && req.method === 'POST') {
        try { const params = await body(req); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await client.callTool(params))); }
        catch (error) { res.statusCode = 500; res.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: String(error) }] })); }
      } else if (req.url?.split('?')[0] === '/') {
        const { sandbox, allow } = framePolicy(resource.meta);
        res.setHeader('Content-Type', 'text/html'); res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0}#remount{height:24px}iframe{height:calc(100dvh - 24px)!important}</style><button id="remount">Remount board</button><iframe title="King Down" sandbox="${sandbox}" allow="${allow}" data-src="http://${frameHost}/board-resource" style="display:block;width:100%;height:100vh;border:0"></iframe><script type="module" src="/tools/plugin-ui-host.ts"></script>`);
      }
      else next();
    });
  } }] });
  await vite.listen();
  // Playwright's page.request keeps its sockets open with no idle limit. A server that closes an idle socket after 5 s can
  // close it as the next fixture call starts on it ("socket hang up", CI run 39163839294). vite.close() ends each socket.
  vite.httpServer!.keepAliveTimeout = 0;
  const url = vite.resolvedUrls!.local[0];
  if (!endpoint) {
    // The fixture server's public origin is this host, which serves the board art as the plugin origin does.
    const html = await readFile(boardPath, 'utf8'), publicOrigin = new URL(url).origin;
    server = createPluginServer({ service: service!, actorId: 'alice', resourceHtml: html, publicOrigin });
    const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(a); await client.connect(b);
    // The friend plays through the same tools as in HTTP mode.
    buddyServer = createPluginServer({ service: service!, actorId: 'bob', resourceHtml: html, publicOrigin }); buddy = new Client({ name: 'local-browser-friend', version: '1' });
    const [c, d] = InMemoryTransport.createLinkedPair(); await buddyServer.connect(c); await buddy.connect(d);
    laterBuddyServer = createPluginServer({ service: service!, actorId: 'bob-later', resourceHtml: html, publicOrigin }); laterBuddy = new Client({ name: 'local-browser-later-friend', version: '1' });
    const [e, f] = InMemoryTransport.createLinkedPair(); await laterBuddyServer.connect(e); await laterBuddy.connect(f);
    resource = await board(client);
  }
  const tag = randomUUID().slice(0,8);
  for (const [i, persona] of [client,buddy,laterBuddy].entries()) if (persona) { const result = await persona.callTool({name:'kingdown_handle',arguments:{handle:`host${i}-${tag}`}}); if (result.isError) throw new Error('The harness cannot set its disposable handles'); }
  return { url, close };
  } catch (error) { await close(); throw error; }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const harness = await startHarness({ boardPath: process.argv[2], endpoint: process.env.PLUGIN_MCP_URL ? new URL(process.env.PLUGIN_MCP_URL) : undefined, actor: process.env.PLUGIN_DEV_ACTOR, friendActor: process.env.PLUGIN_FRIEND_ACTOR });
  console.log(`Local SDK host: ${harness.url}`);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await harness.close(); process.exit(); });
}

/** Source module exports must exist before tests call them; an enabled control can precede the import's completion. */
export async function waitForSourceApp(page: Page): Promise<void> {
  await page.frameLocator('iframe').locator('html').evaluate("async () => { await window.harnessBoot; window.harnessApp = await import('/src/plugin/app.ts'); }");
}
