import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import { fixtureService } from './plugin-protocol-fixture';
const service = fixtureService();
const resourceHtml = await readFile(process.argv[2] || '/tmp/kingdown-plugin-ui-built/board.html', 'utf8');
const server = createPluginServer({ service, actorId: 'alice', resourceHtml, publicOrigin: 'https://kingdown.example' });
const client = new Client({ name: 'local-browser-host', version: '1' });
const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(a); await client.connect(b);
const vite = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 5296, strictPort: true }, plugins: [{ name: 'mcp-app-harness', configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url === '/fixture-terminal') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ content: [], structuredContent: await service.create('alice', { fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1' }, 'solo') })); }
    else if (req.url === '/board-resource') { res.setHeader('Content-Type', 'text/html'); res.end(resourceHtml); }
    else if (req.url === '/fixture-tool' && req.method === 'POST') {
      try { const chunks = []; for await (const chunk of req) chunks.push(chunk); const params = JSON.parse(Buffer.concat(chunks).toString()); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await client.callTool(params))); }
      catch (error) { res.statusCode = 500; res.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: String(error) }] })); }
    } else if (req.url?.split('?')[0] === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><button id="remount">Remount board</button><iframe title="King Down" style="display:block;width:100%;height:100vh;border:0"></iframe><script type="module" src="/tools/plugin-ui-host.ts"></script>'); }
    else next();
  });
} }] });
await vite.listen(); console.log('Local SDK host: http://127.0.0.1:5296');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, async () => { await vite.close(); await client.close(); await server.close(); await service.close(); process.exit(); });
