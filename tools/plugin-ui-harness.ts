import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import type { MatchSetup } from '../src/match';
import { fixtureService } from './plugin-protocol-fixture';
import { ART_HEADERS } from './plugin-art-headers.mjs';
/** The page as a host gets it: through the resource the open tool names, with the art origin set by the server. */
async function board(client: Client) {
  const tools = (await client.listTools()).tools;
  const uri = (tools.find(tool => tool.name === 'kingdown_open')?._meta?.ui as {resourceUri?: string})?.resourceUri;
  if (!uri) throw new Error('The MCP server did not advertise the board resource');
  const result = await client.readResource({ uri });
  const resource = result.contents.find(content => content.mimeType === 'text/html;profile=mcp-app' && 'text' in content);
  if (!resource || !('text' in resource)) throw new Error('The MCP server did not return the board HTML');
  console.log(`Read board resource through MCP: ${Buffer.byteLength(JSON.stringify(result))} JSON bytes`);
  return resource.text;
}
export async function startHarness({ boardPath = 'plugin-server-dist/board.html', endpoint, actor, friendActor, seedPosition, deleteMatch }: { boardPath?: string; endpoint?: URL; actor?: string; friendActor?: string; seedPosition?: (setup: MatchSetup, black: boolean) => Promise<string>; deleteMatch?: (id: string) => Promise<void> } = {}) {
  if (endpoint && (endpoint.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password)) throw new Error('The HTTP harness accepts only a loopback development endpoint');
  let buddy: Client | undefined;
  const client = new Client({ name: 'local-browser-host', version: '1' });
  const service = endpoint ? undefined : fixtureService();
  let server: ReturnType<typeof createPluginServer> | undefined, buddyServer: ReturnType<typeof createPluginServer> | undefined;
  let resourceHtml: string;
  let vite: Awaited<ReturnType<typeof createServer>> | undefined;
  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    const results = await Promise.allSettled([vite?.close(), client.close(), buddy?.close(), server?.close(), buddyServer?.close(), service?.close()]);
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'Could not close the plugin harness');
  }
  try {
  if (endpoint) {
    if (!actor || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor)) throw new Error('Set PLUGIN_DEV_ACTOR to the disposable development actor UUID');
    if (friendActor) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(friendActor) || friendActor === actor) throw new Error('PLUGIN_FRIEND_ACTOR must be a different development actor UUID'); buddy = new Client({ name: 'local-browser-friend', version: '1' }); await buddy.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': friendActor }, redirect: 'error' } })); }
    await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': actor }, redirect: 'error' } }));
    resourceHtml = await board(client);
  }
  const body = async (req: AsyncIterable<Buffer>) => { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString()); };
  vite = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0, strictPort: true }, plugins: [{ name: 'mcp-app-harness', configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (req.url === '/harness-mode') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ mode: endpoint ? 'http' : 'fixture', friend: !!buddy })); }
      else if (req.url === '/fixture-friend-join' && req.method === 'POST') { const { invitation } = await body(req); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await buddy!.callTool({ name: 'kingdown_join', arguments: { invitation } }))); }
      else if (req.url === '/fixture-friend-move' && req.method === 'POST') { const command = await body(req); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await buddy!.callTool({ name: 'kingdown_move', arguments: command }))); }
      else if (req.url === '/fixture-friend-invite' && req.method === 'POST') {
        const game = (await buddy!.callTool({ name: 'kingdown_create', arguments: { mode: 'friend', colour: 'white' } })).structuredContent as { game_id: string };
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await buddy!.callTool({ name: 'kingdown_invite', arguments: { game_id: game.game_id } })));
      }
      else if (req.url?.startsWith('/fixture-position?') && req.method === 'POST') {
        const black = new URL(req.url,'http://localhost').searchParams.get('case') === 'freeze';
        const setup = black ? {fen:'7k/8/8/8/4P3/8/8/K7 b - - 0 1',kings:'none,Frost:Freeze'} : {fen:'7k/8/8/2p5/8/2A5/8/K7 w - - 0 1',kings:'none,none'};
        let matchId;
        if (seedPosition) matchId = await seedPosition(setup,black);
        else { const created = await service!.create(black?'bob':'alice',{kind:black?'friend':'solo',colour:'white',setup}); if (black) await service!.join('alice',(await service!.invite('bob',created.game_id)).token); matchId=created.game_id; }
        const result = await client.callTool({name:'kingdown_open',arguments:{game_id:matchId}});
        res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(result));
      }
      else if (req.url === '/fixture-delete-match' && req.method === 'POST') {
        const {game_id}=await body(req);
        if (deleteMatch) await deleteMatch(game_id); else await service!.deleteMatch(game_id);
        res.end('{}');
      }
      else if (req.url === '/fixture-terminal' && service) { const view = await service.create('alice', { kind: 'solo', colour: 'white', setup: { fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1' } }); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ content: [], structuredContent: { game_id: view.game_id }, _meta: { view } })); }
      else if (!endpoint && /^\/plugin-art\/[\w-]+\.webp$/.test(req.url ?? '')) {
        const file = await readFile(resolve(dirname(boardPath), req.url!.slice(1))).catch(() => undefined);
        if (!file) { res.statusCode = 404; res.end(); } else { res.writeHead(200, { 'Content-Type': 'image/webp', ...ART_HEADERS }); res.end(file); }
      }
      else if (req.url === '/board-resource') {
        res.setHeader('Content-Type', 'text/html');
        res.end(resourceHtml.replace('<head>', '<head><script>window.openai = parent.harnessWithoutWidgetState ? undefined : {widgetState: parent.harnessWidgetState, setWidgetState(state) {if (!parent.harnessDropWidgetWrites) parent.harnessWidgetState = structuredClone(state);}};</script>'));
      }
      else if (req.url === '/fixture-tool' && req.method === 'POST') {
        try { const params = await body(req); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await client.callTool(params))); }
        catch (error) { res.statusCode = 500; res.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: String(error) }] })); }
      } else if (req.url?.split('?')[0] === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><link rel="icon" href="data:,"><button id="remount">Remount board</button><iframe title="King Down" style="display:block;width:100%;height:100vh;border:0"></iframe><script type="module" src="/tools/plugin-ui-host.ts"></script>'); }
      else next();
    });
  } }] });
  await vite.listen();
  const url = vite.resolvedUrls!.local[0];
  if (!endpoint) {
    // The fixture server's public origin is this host, which serves the board art as the plugin origin does.
    const html = await readFile(boardPath, 'utf8'), publicOrigin = new URL(url).origin;
    server = createPluginServer({ service: service!, actorId: 'alice', resourceHtml: html, publicOrigin });
    const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(a); await client.connect(b);
    // The friend plays through the same tools as in HTTP mode.
    buddyServer = createPluginServer({ service: service!, actorId: 'bob', resourceHtml: html, publicOrigin }); buddy = new Client({ name: 'local-browser-friend', version: '1' });
    const [c, d] = InMemoryTransport.createLinkedPair(); await buddyServer.connect(c); await buddy.connect(d);
    resourceHtml = await board(client);
  }
  return { url, close };
  } catch (error) { await close(); throw error; }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const harness = await startHarness({ boardPath: process.argv[2], endpoint: process.env.PLUGIN_MCP_URL ? new URL(process.env.PLUGIN_MCP_URL) : undefined, actor: process.env.PLUGIN_DEV_ACTOR, friendActor: process.env.PLUGIN_FRIEND_ACTOR });
  console.log(`Local SDK host: ${harness.url}`);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await harness.close(); process.exit(); });
}
