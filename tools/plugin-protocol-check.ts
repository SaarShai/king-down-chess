import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import { fixtureService } from './plugin-protocol-fixture';
import type { View } from '../src/match/protocol';
import { DEFAULT_OPTIONS } from '../src/match/setup';
import { POOL } from '../src/rules/setup';
// The tool table of report part 03, section 4.5: who may call each tool, then its read-only and destructive hints.
const TABLE: Record<string, [string, boolean, boolean]> = {
  kingdown_open: ['model,app', false, false], kingdown_create: ['model,app', false, false], kingdown_resume: ['app', false, false], kingdown_games: ['model,app', true, false],
  kingdown_lobby: ['app', true, false], kingdown_accept: ['app', false, false], kingdown_find: ['app', false, false], kingdown_cancel: ['app', false, true],
  kingdown_choose: ['app', false, false], kingdown_rematch: ['app', false, true], kingdown_handle: ['app', false, true], kingdown_settings: ['app', false, true],
  kingdown_get: ['app', true, false], kingdown_seen: ['app', false, false], kingdown_move: ['app', false, false], kingdown_computer: ['app', false, false], kingdown_say: ['app', false, true],
  kingdown_draw: ['model,app', false, true], kingdown_claim: ['app', false, true], kingdown_resign: ['model,app', false, true], kingdown_abort: ['model,app', false, true],
  kingdown_invite: ['model,app', false, true], kingdown_join: ['model,app', false, false], kingdown_report: ['app', false, true], kingdown_profile: ['model,app', true, false],
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
  for (const name of ['kingdown_join','kingdown_seen']) assert.equal(tools.find(tool=>tool.name===name)?.annotations?.idempotentHint,false);
  const boardResource = ui(tools.find(tool => tool.name === 'kingdown_open')!).resourceUri!;
  assert.match(boardResource, /^ui:\/\/kingdown\/board-[a-f0-9]{64}\.html$/);
  assert.deepEqual(tools.filter(tool => ui(tool).resourceUri).map(tool => tool.name), ['kingdown_open'], 'Only the render tool carries the board');
  assert.equal(tools.find(tool => tool.name === 'kingdown_profile')!._meta?.['openai/profile'], true);
  assert.equal((await client.readResource({ uri: boardResource })).contents[0].mimeType, 'text/html;profile=mcp-app');
  const home = await call('kingdown_open'); assert.equal(home.structuredContent.screen, 'home'); assert.equal(home._meta.view, undefined);
  // A refusal restores the engine, history and receipt state, also after a legal first action.
  for (const [setup, actions] of [
    [{kings:'Flame:Haste,none',fen:'7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'}, ['Ra1-a2!H','zzzz']],
    [{backRank:'RNBQKBNR'}, ['e2-e4','e7-e5']],
    [{fen:'7k/5Q2/6K1/8/8/8/8/8 w - - 0 1'}, ['Qf7-g7','Kh8-h7']],
  ] as const) {
    const before = await service.create('alice',{kind:'solo',colour:'white',setup});
    const input = {command_id:'refused-turn',expected_revision:before.revision,action:{type:'turn',actions}};
    await assert.rejects(service.command('alice',before.game_id,input),{code:'INVALID_MOVE'});
    const after = await service.view('alice',before.game_id);
    for (const field of ['revision','fen','turn','status','action','legal','history','last_commands'] as const) assert.deepEqual(after[field],before[field],`Refusal changes ${field}: ${actions}`);
    const corrected = await service.command('alice',before.game_id,{...input,action:{type:'turn',actions:[actions[0]]}});
    assert.equal(corrected.revision,before.revision+1,'A refused command leaves no receipt');
    await service.deleteMatch(before.game_id);
  }
  const haste = await service.create('alice',{kind:'solo',colour:'white',setup:{kings:'Flame:Haste,none',fen:'7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'}});
  const wholeTurn = {game_id:haste.game_id,command_id:'whole-turn',expected_revision:haste.revision,actions:['Ra1-a2!H','Ra2-a3']};
  const sent = await call('kingdown_move',wholeTurn);
  assert.equal(sent.isError,undefined); assert.equal(sent._meta.view.revision,haste.revision+1); assert.equal(sent._meta.view.turn,1);
  const retried = await call('kingdown_move',wholeTurn);
  assert.deepEqual(retried.structuredContent,sent.structuredContent);
  assert.equal(retried._meta.view.revision,sent._meta.view.revision); assert.equal(retried._meta.view.fen,sent._meta.view.fen);
  assert.equal((await call('kingdown_move',{...wholeTurn,actions:['Ra1-a2!H','--']}))._meta.code,'COMMAND_CONFLICT');
  await service.deleteMatch(haste.game_id);
  await call('kingdown_handle', { handle: 'alice', icon: 'rook' });
  const options = { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: false };
  const created = await call('kingdown_create', { kind: 'solo', options, colour: 'white', board_id: home._meta.board_id });
  assert.equal((await call('kingdown_get', { board_id: home._meta.board_id })).structuredContent.game_id, created.structuredContent.game_id);
  const opened = await call('kingdown_open', { game_id: created.structuredContent.game_id }), view = opened._meta.view as View;
  assert.equal(opened.content[0].text, 'Your move, move 1.'); assert.equal(opened.structuredContent.game_id, view.game_id); assert.match(opened._meta.board_id, /^[0-9a-f-]{36}$/);
  assert(!('board_id' in opened.structuredContent));
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
  assert.equal(next.structuredContent.game_id, view.game_id); assert.notEqual(next._meta.board_id, opened._meta.board_id);
  const friend = await call('kingdown_create', { kind: 'friend', options, colour: 'white', board_id: opened._meta.board_id });
  assert.equal(friend.structuredContent.status, 'waiting'); assert.equal(friend.structuredContent.speed, 'daily');
  assert.equal((await call('kingdown_get', { game_id: view.game_id, board_id: opened._meta.board_id })).structuredContent.game_id, friend.structuredContent.game_id);
  const invite = await call('kingdown_invite', { game_id: friend.structuredContent.game_id });
  assert.equal(invite.structuredContent.link, undefined); assert.match(invite.structuredContent.code, /^[A-HJKMNP-Z2-9]{6}$/);
  assert.equal((await call('kingdown_games')).structuredContent.games.length, 2);
  const resigned = await call('kingdown_resign', { game_id: view.game_id });
  assert.equal(resigned.structuredContent.result, 'Black wins · Resignation'); assert.equal(resigned.content[0].text, 'Game over: Black wins · Resignation.');
  assert.deepEqual((await call('kingdown_profile')).structuredContent, { id: 'alice', name: 'alice' });
  assert.equal((await call('kingdown_get', { game_id: view.game_id, actorId: 'mallory' })).isError, true);
  service.view = async () => { throw new Error('database password=never-share'); };
  const failed = await call('kingdown_get', { game_id: view.game_id });
  assert.equal(failed.isError, true); assert(!JSON.stringify(failed).includes('never-share'));
  console.log('PASS: 25 tools and their hints, whole-turn retry, refused-turn rollback, the board resource on kingdown_open only, the profile tool, board data in _meta only, empty home, explicit solo game, next game, real engine move, duplicate command, stale revision, since_revision, board selection, invitation code and expiry, inbox, model resign, actor injection rejection, sanitized internal errors');
} finally { await client.close(); await server.close(); await service.close(); }
