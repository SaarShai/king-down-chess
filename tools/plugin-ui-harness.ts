import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import type { MatchSetup } from '../src/match';
import { fixtureService } from './plugin-protocol-fixture';
export async function startHarness({ boardPath = 'plugin-server-dist/board.html', endpoint, actor, friendActor, seedPosition, deleteMatch }: { boardPath?: string; endpoint?: URL; actor?: string; friendActor?: string; seedPosition?: (setup: MatchSetup, black: boolean) => Promise<string>; deleteMatch?: (id: string) => Promise<void> } = {}) {
  if (endpoint && (endpoint.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password)) throw new Error('The HTTP harness accepts only a loopback development endpoint');
  let buddy: Client | undefined;
  const client = new Client({ name: 'local-browser-host', version: '1' });
  const service = endpoint ? undefined : fixtureService();
  let server: ReturnType<typeof createPluginServer> | undefined;
  let resourceHtml: string;
  let vite: Awaited<ReturnType<typeof createServer>> | undefined;
  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    const results = await Promise.allSettled([vite?.close(), client.close(), buddy?.close(), server?.close(), service?.close()]);
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'Could not close the plugin harness');
  }
  try {
  if (endpoint) {
    if (!actor || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor)) throw new Error('Set PLUGIN_DEV_ACTOR to the disposable development actor UUID');
    if (friendActor) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(friendActor) || friendActor === actor) throw new Error('PLUGIN_FRIEND_ACTOR must be a different development actor UUID'); buddy = new Client({ name: 'local-browser-friend', version: '1' }); await buddy.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': friendActor }, redirect: 'error' } })); }
    await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': actor }, redirect: 'error' } }));
    const result = await client.readResource({ uri: 'ui://kingdown/board-v1.html' });
    const resource = result.contents.find(content => content.mimeType === 'text/html;profile=mcp-app' && 'text' in content);
    if (!resource || !('text' in resource)) throw new Error('The HTTP MCP server did not return the board HTML');
    resourceHtml = resource.text;
    console.log(`Read board resource through HTTP MCP: ${Buffer.byteLength(JSON.stringify(result))} JSON bytes`);
  } else {
    resourceHtml = await readFile(boardPath, 'utf8');
    server = createPluginServer({ service: service!, actorId: 'alice', resourceHtml, publicOrigin: 'https://kingdown.example' });
    const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(a); await client.connect(b);
  }
  vite = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0, strictPort: true }, plugins: [{ name: 'mcp-app-harness', configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (req.url === '/harness-mode') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ mode: endpoint ? 'http' : 'fixture', friend: !!buddy || !!service })); }
      else if (req.url === '/fixture-friend-join' && req.method === 'POST') { const chunks = []; for await (const chunk of req) chunks.push(chunk); const { token } = JSON.parse(Buffer.concat(chunks).toString()); const result = buddy ? await buddy.callTool({ name: 'kingdown_join', arguments: { token } }) : { structuredContent: await service!.join('bob', token), content: [] }; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result)); }
      else if (req.url === '/fixture-friend-move' && req.method === 'POST') { const chunks = []; for await (const chunk of req) chunks.push(chunk); const command = JSON.parse(Buffer.concat(chunks).toString()); const result = buddy ? await buddy.callTool({ name: 'kingdown_move', arguments: command }) : { structuredContent: await service!.move('bob', command.matchId, { id: command.id, expectedRevision: command.expectedRevision, lan: command.lan }), content: [] }; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result)); }
      else if (req.url === '/fixture-friend-invite' && req.method === 'POST') {
        const game = buddy ? (await buddy.callTool({ name: 'kingdown_create', arguments: { mode: 'friend' } })).structuredContent as { matchId: string } : await service!.create('bob', {}, 'friend');
        const result = buddy ? await buddy.callTool({ name: 'kingdown_invite', arguments: { matchId: game.matchId } }) : { structuredContent: await service!.invite('bob', game.matchId), content: [] };
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result));
      }
      else if (req.url?.startsWith('/fixture-position?') && req.method === 'POST') {
        const black = new URL(req.url,'http://localhost').searchParams.get('case') === 'freeze';
        const setup = black ? {fen:'7k/8/8/8/4P3/8/8/K7 b - - 0 1',kings:'none,Frost:Freeze'} : {fen:'7k/8/8/2p5/8/2A5/8/K7 w - - 0 1',kings:'none,none'};
        let matchId;
        if (seedPosition) matchId = await seedPosition(setup,black);
        else { const created = await service!.create(black?'bob':'alice',setup,black?'friend':'solo'); if (black) await service!.join('alice',created.matchId); matchId=created.matchId; }
        const result = await client.callTool({name:'kingdown_open',arguments:{matchId}});
        res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(result));
      }
      else if (req.url === '/fixture-delete-match' && req.method === 'POST') {
        const chunks=[]; for await (const chunk of req) chunks.push(chunk); const {matchId}=JSON.parse(Buffer.concat(chunks).toString());
        if (deleteMatch) await deleteMatch(matchId); else await service!.deleteMatch(matchId);
        res.end('{}');
      }
      else if (req.url === '/fixture-terminal' && service) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ content: [], structuredContent: await service.create('alice', { fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1' }, 'solo') })); }
      else if (req.url === '/board-resource') {
        res.setHeader('Content-Type', 'text/html');
        res.end(resourceHtml.replace('<head>', '<head><script>window.openai = parent.harnessWithoutWidgetState ? undefined : {widgetState: parent.harnessWidgetState, setWidgetState(state) {if (!parent.harnessDropWidgetWrites) parent.harnessWidgetState = structuredClone(state);}};</script>'));
      }
      else if (req.url === '/fixture-tool' && req.method === 'POST') {
        try { const chunks = []; for await (const chunk of req) chunks.push(chunk); const params = JSON.parse(Buffer.concat(chunks).toString()); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await client.callTool(params))); }
        catch (error) { res.statusCode = 500; res.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: String(error) }] })); }
      } else if (req.url?.split('?')[0] === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><link rel="icon" href="data:,"><button id="remount">Remount board</button><iframe title="King Down" style="display:block;width:100%;height:100vh;border:0"></iframe><script type="module" src="/tools/plugin-ui-host.ts"></script>'); }
      else next();
    });
  } }] });
  await vite.listen();
  return { url: vite.resolvedUrls!.local[0], close };
  } catch (error) { await close(); throw error; }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const harness = await startHarness({ boardPath: process.argv[2], endpoint: process.env.PLUGIN_MCP_URL ? new URL(process.env.PLUGIN_MCP_URL) : undefined, actor: process.env.PLUGIN_DEV_ACTOR, friendActor: process.env.PLUGIN_FRIEND_ACTOR });
  console.log(`Local SDK host: ${harness.url}`);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await harness.close(); process.exit(); });
}
