import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer, BOARD_RESOURCE } from '../src/plugin/server';
import { fixtureService } from './plugin-protocol-fixture';
import type { MatchView } from '../src/plugin/view';
const service = fixtureService();
const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
const client = new Client({ name: 'protocol-check', version: '1' });
const [a, b] = InMemoryTransport.createLinkedPair();
await server.connect(a); await client.connect(b);
try {
  const tools = (await client.listTools()).tools;
  assert.equal(tools.length, 8);
  for (const tool of tools) { assert.equal(tool.annotations?.destructiveHint, false); assert.equal(tool.annotations?.openWorldHint, false); assert.equal((tool._meta?.ui as any).resourceUri, BOARD_RESOURCE); }
  assert.deepEqual((tools.find(tool => tool.name === 'kingdown_move')!._meta?.ui as any).visibility, ['app']);
  const resource = await client.readResource({ uri: BOARD_RESOURCE });
  assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
  const opened = await client.callTool({ name: 'kingdown_open', arguments: {} });
  const view = opened.structuredContent as unknown as MatchView;
  const command = { matchId: view.matchId, id: 'one', expectedRevision: 0, lan: 'e2-e4' };
  const moved = await client.callTool({ name: 'kingdown_move', arguments: command });
  assert.equal((moved.structuredContent as any).snapshot.revision, 1);
  const replay = await client.callTool({ name: 'kingdown_move', arguments: command });
  assert.deepEqual(replay.structuredContent, moved.structuredContent);
  assert.equal((await client.callTool({ name: 'kingdown_get', arguments: { matchId: view.matchId, actorId: 'mallory' } })).isError, true);
  assert.equal((await client.callTool({ name: 'kingdown_move', arguments: { ...command, id: 'two' } })).isError, true);
  service.get = async () => { throw new Error('database password=never-share'); };
  const failed = await client.callTool({ name: 'kingdown_get', arguments: { matchId: view.matchId } });
  assert.equal(failed.isError, true); assert(!JSON.stringify(failed).includes('never-share'));
  console.log('PASS: SDK tools/resource, app visibility, real engine move, duplicate command, stale revision, actor injection rejection, sanitized internal errors');
} finally { await client.close(); await server.close(); await service.close(); }
