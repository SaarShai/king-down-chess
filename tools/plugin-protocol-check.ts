import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import { fixtureService } from './plugin-protocol-fixture';
import type { View } from '../src/match/protocol';
import { POOL } from '../src/rules/setup';
// The tool table of report part 03, section 4.5: who may call each tool, then its read-only and destructive hints.
const TABLE: Record<string, [string, boolean, boolean]> = {
  kingdown_open: ['model,app', false, false], kingdown_create: ['model,app', false, false], kingdown_resume: ['app', false, false], kingdown_games: ['model', true, false],
  kingdown_get: ['app', true, false], kingdown_move: ['app', false, false], kingdown_computer: ['app', false, false], kingdown_say: ['app', false, false],
  kingdown_draw: ['app', false, true], kingdown_claim: ['app', false, true], kingdown_resign: ['model,app', false, true], kingdown_abort: ['model,app', false, true],
  kingdown_invite: ['model,app', false, false], kingdown_join: ['model,app', false, false], kingdown_report: ['model,app', false, false], kingdown_profile: ['model', true, false],
};
const service = fixtureService();
const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
const client = new Client({ name: 'protocol-check', version: '1' });
const [a, b] = InMemoryTransport.createLinkedPair();
await server.connect(a); await client.connect(b);
const call = async (name: string, args: Record<string, unknown> = {}) => await client.callTool({ name, arguments: args }) as { isError?: boolean; content: { text: string }[]; structuredContent?: any; _meta?: any };
try {
  const tools = (await client.listTools()).tools, ui = (tool: typeof tools[number]) => tool._meta?.ui as { resourceUri?: string; visibility: string[] };
  console.log(`${'tool'.padEnd(18)} ${'visible to'.padEnd(10)} read-only  destructive  idempotent  open-world`);
  for (const tool of tools) console.log(`${tool.name.padEnd(18)} ${ui(tool).visibility.join(',').padEnd(10)} ${String(tool.annotations?.readOnlyHint).padEnd(10)} ${String(tool.annotations?.destructiveHint).padEnd(12)} ${String(tool.annotations?.idempotentHint).padEnd(11)} ${tool.annotations?.openWorldHint}`);
  assert.deepEqual(Object.fromEntries(tools.map(tool => [tool.name, [ui(tool).visibility.join(','), tool.annotations?.readOnlyHint, tool.annotations?.destructiveHint]])), TABLE);
  for (const tool of tools) { for (const hint of ['readOnlyHint', 'destructiveHint', 'idempotentHint'] as const) assert.equal(typeof tool.annotations?.[hint], 'boolean', `${tool.name} ${hint}`); assert.equal(tool.annotations?.openWorldHint, false); }
  const boardResource = ui(tools.find(tool => tool.name === 'kingdown_open')!).resourceUri!;
  assert.match(boardResource, /^ui:\/\/kingdown\/board-[a-f0-9]{64}\.html$/);
  assert.deepEqual(tools.filter(tool => ui(tool).resourceUri).map(tool => tool.name), ['kingdown_open'], 'Only the render tool carries the board');
  assert.equal(tools.find(tool => tool.name === 'kingdown_profile')!._meta?.['openai/profile'], true);
  assert.equal((await client.readResource({ uri: boardResource })).contents[0].mimeType, 'text/html;profile=mcp-app');
  // The first open starts a solo game. The board reads the view in _meta; the model reads a summary with no position.
  const opened = await call('kingdown_open'), view = opened._meta.view as View;
  assert.equal(opened.content[0].text, 'Your move, move 1.'); assert.equal(opened.structuredContent.game_id, view.game_id); assert.match(opened.structuredContent.board_id, /^[0-9a-f-]{36}$/);
  assert(!JSON.stringify([opened.content, opened.structuredContent]).includes(view.fen.split(' ')[0]) && !('legal' in opened.structuredContent));
  const army = view.fen.split(' ')[0].split('/').at(-1)!;
  assert.equal([...army].filter(piece => piece === 'K').length, 1);
  const available = POOL.split('');
  for (const piece of army.replace('K', '')) { const index = available.indexOf(piece); assert(index >= 0, `${piece} is outside the current army pool`); available.splice(index, 1); }
  const command = { game_id: view.game_id, command_id: 'one', expected_revision: 0, lan: 'e2-e4' };
  const moved = await call('kingdown_move', command);
  assert.equal(moved._meta.view.revision, 1); assert.equal(moved._meta.view.rules, undefined);
  assert.deepEqual((await call('kingdown_move', command)).structuredContent, moved.structuredContent);
  assert.equal((await call('kingdown_move', { ...command, command_id: 'two' }))._meta.code, 'STALE_REVISION');
  assert.equal((await call('kingdown_get', { game_id: view.game_id, since_revision: 1 }))._meta.view.rules, undefined);
  // "next" reopens the one active game on a new board.
  const next = await call('kingdown_open', { game_id: 'next' });
  assert.equal(next.structuredContent.game_id, view.game_id); assert.notEqual(next.structuredContent.board_id, opened.structuredContent.board_id);
  const friend = await call('kingdown_create', { mode: 'friend', colour: 'white', board_id: opened.structuredContent.board_id });
  assert.equal(friend.structuredContent.status, 'waiting'); assert.equal(friend.structuredContent.speed, 'daily');
  assert.equal((await call('kingdown_get', { game_id: view.game_id, board_id: opened.structuredContent.board_id })).structuredContent.game_id, friend.structuredContent.game_id);
  const invite = await call('kingdown_invite', { game_id: friend.structuredContent.game_id });
  assert.match(invite.structuredContent.link, /^https:\/\/kingdown\.example\/j\/[A-Za-z0-9_-]{43}$/); assert.match(invite.structuredContent.code, /^[A-HJKMNP-Z2-9]{6}$/);
  assert.equal((await call('kingdown_games')).structuredContent.games.length, 2);
  const resigned = await call('kingdown_resign', { game_id: view.game_id });
  assert.equal(resigned.structuredContent.result, 'Black wins · Resignation'); assert.equal(resigned.content[0].text, 'Game over: Black wins · Resignation.');
  assert.deepEqual((await call('kingdown_profile')).structuredContent, { id: 'alice' });
  assert.equal((await call('kingdown_get', { game_id: view.game_id, actorId: 'mallory' })).isError, true);
  service.view = async () => { throw new Error('database password=never-share'); };
  const failed = await call('kingdown_get', { game_id: view.game_id });
  assert.equal(failed.isError, true); assert(!JSON.stringify(failed).includes('never-share'));
  console.log('PASS: the tool table and its hints, the board resource on kingdown_open only, the profile tool, board data in _meta only, new solo game, next game, real engine move, duplicate command, stale revision, since_revision, board selection, invitation link and code, inbox, model resign, actor injection rejection, sanitized internal errors');
} finally { await client.close(); await server.close(); await service.close(); }
