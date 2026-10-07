import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import { fixtureService } from './plugin-protocol-fixture';
const endpoint = process.env.PLUGIN_MCP_URL ? new URL(process.env.PLUGIN_MCP_URL) : undefined;
if (endpoint && (endpoint.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password)) throw new Error('The HTTP harness accepts only a loopback development endpoint');
let buddy: Client | undefined;
const client = new Client({ name: 'local-browser-host', version: '1' });
const service = endpoint ? undefined : fixtureService();
let server: ReturnType<typeof createPluginServer> | undefined;
let resourceHtml: string;
if (endpoint) {
  const actor = process.env.PLUGIN_DEV_ACTOR;
  if (!actor || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor)) throw new Error('Set PLUGIN_DEV_ACTOR to the disposable development actor UUID');
  const friendActor = process.env.PLUGIN_FRIEND_ACTOR;
  if (friendActor) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(friendActor) || friendActor === actor) throw new Error('PLUGIN_FRIEND_ACTOR must be a different development actor UUID'); buddy = new Client({ name: 'local-browser-friend', version: '1' }); await buddy.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': friendActor }, redirect: 'error' } })); }
  await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { 'X-Kingdown-Dev-Actor': actor }, redirect: 'error' } }));
  const result = await client.readResource({ uri: 'ui://kingdown/board-v1.html' });
  const resource = result.contents.find(content => content.mimeType === 'text/html;profile=mcp-app' && 'text' in content);
  if (!resource || !('text' in resource)) throw new Error('The HTTP MCP server did not return the board HTML');
  resourceHtml = resource.text;
  console.log(`Read board resource through HTTP MCP: ${Buffer.byteLength(JSON.stringify(result))} JSON bytes`);
} else {
  resourceHtml = await readFile(process.argv[2] || '/tmp/kingdown-plugin-ui-built/board.html', 'utf8');
  server = createPluginServer({ service: service!, actorId: 'alice', resourceHtml, publicOrigin: 'https://kingdown.example' });
  const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(a); await client.connect(b);
}
const vite = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 5296, strictPort: true }, plugins: [{ name: 'mcp-app-harness', configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url === '/harness-mode') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ mode: endpoint ? 'http' : 'fixture', friend: !!buddy || !!service })); }
    else if (req.url === '/fixture-friend-join' && req.method === 'POST') { const chunks = []; for await (const chunk of req) chunks.push(chunk); const { token } = JSON.parse(Buffer.concat(chunks).toString()); const result = buddy ? await buddy.callTool({ name: 'kingdown_join', arguments: { token } }) : { structuredContent: await service!.join('bob', token), content: [] }; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result)); }
    else if (req.url === '/fixture-friend-move' && req.method === 'POST') { const chunks = []; for await (const chunk of req) chunks.push(chunk); const command = JSON.parse(Buffer.concat(chunks).toString()); const result = buddy ? await buddy.callTool({ name: 'kingdown_move', arguments: command }) : { structuredContent: await service!.move('bob', command.matchId, { id: command.id, expectedRevision: command.expectedRevision, lan: command.lan }), content: [] }; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result)); }
    else if (req.url === '/fixture-terminal' && service) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ content: [], structuredContent: await service.create('alice', { fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1' }, 'solo') })); }
    else if (req.url === '/board-resource') { res.setHeader('Content-Type', 'text/html'); res.end(resourceHtml); }
    else if (req.url === '/fixture-tool' && req.method === 'POST') {
      try { const chunks = []; for await (const chunk of req) chunks.push(chunk); const params = JSON.parse(Buffer.concat(chunks).toString()); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await client.callTool(params))); }
      catch (error) { res.statusCode = 500; res.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: String(error) }] })); }
    } else if (req.url?.split('?')[0] === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><button id="remount">Remount board</button><iframe title="King Down" style="display:block;width:100%;height:100vh;border:0"></iframe><script type="module" src="/tools/plugin-ui-host.ts"></script>'); }
    else next();
  });
} }] });
await vite.listen(); console.log('Local SDK host: http://127.0.0.1:5296');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, async () => { await vite.close(); await client.close(); await buddy?.close(); await server?.close(); await service?.close(); process.exit(); });
