import { afterEach, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { REPORT_CATEGORIES } from '../account/profile';
import { DEFAULT_OPTIONS } from '../match/setup';
import { createArguments, readSetup } from './screens/setup-model';
import { ART_ORIGIN, createPluginServer } from './server';
import { MatchServiceError } from '../match/service';
afterEach(() => { vi.unstubAllEnvs(); });

it.each([
 { name: 'automatic revision', expected: undefined, code: 'STALE_REVISION', always: false, calls: 2, error: false },
 { name: 'explicit revision', expected: 1, code: 'STALE_REVISION', always: false, calls: 1, error: true },
 { name: 'definitive refusal', expected: undefined, code: 'NOT_ALLOWED', always: false, calls: 1, error: true },
 { name: 'second race', expected: undefined, code: 'STALE_REVISION', always: true, calls: 2, error: true },
] as const)('handles Abort with $name when the computer moves during the read', async test => {
 const game_id = '00000000-0000-4000-8000-000000000001';
 const commands: { command_id: string; expected_revision: number }[] = [];
 let reads = 0;
 const service = {
  view: async () => ({ revision: ++reads }),
  command: async (_actor: string, _game: string, command: { command_id: string; expected_revision: number }) => {
   commands.push(command);
   if (commands.length === 1 || test.always) throw new MatchServiceError(test.code, 409, 'The game changed.');
   return { game_id, status: 'aborted', seat: 0, action: 'done', fen: null, draw_offer: null, result: { winner: null, reason: 'abort' } };
  },
  profile: async () => ({ handle: null, icon: null }),
 } as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
 const client = new Client({ name: 'abort-race-host', version: '1' }), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const result = await client.callTool({ name: 'kingdown_abort', arguments: { game_id, ...(test.expected !== undefined && { expected_revision: test.expected }) } });
  expect(!!result.isError).toBe(test.error);
  expect(commands.map(command => command.expected_revision)).toEqual(test.calls === 2 ? [1,2] : [1]);
  expect(new Set(commands.map(command => command.command_id)).size).toBe(1);
  expect(commands[0].command_id).toEqual(expect.any(String));
 } finally { await client.close(); await server.close(); }
});

it('accepts exactly one move input form and keeps the whole-turn tool contract', async () => {
 const game_id = '00000000-0000-4000-8000-000000000001';
 const command = vi.fn(async () => ({game_id,seat:0,status:'playing',action:'waiting',fen:'',draw_offer:null}));
 const service = {command,profile:async()=>({handle:null,icon:null})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'turn-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const args = {game_id,command_id:'turn',expected_revision:0};
  const call = (input:Record<string,unknown>) => client.callTool({name:'kingdown_move',arguments:{...args,...input}});
  for (const input of [{actions:['e2-e4']},{actions:['Ra1-a2!H','Ra2-a3']},{actions:['a','b','c']},{actions:['a','b','c','d']},{lan:'e2-e4'},{lan:'x'.repeat(120)}]) {
   expect((await call(input)).isError).not.toBe(true);
   expect(command.mock.lastCall).toEqual(['alice',game_id,{command_id:'turn',expected_revision:0,action:{type:'turn',actions:input.actions ?? [input.lan]}}]);
  }
  command.mockClear();
  for (const input of [{lan:'e2-e4',actions:['e2-e4']},{},{actions:[]},{actions:['a','b','c','d','e']},{actions:['']},{actions:['x'.repeat(121)]},{actions:[1]},{actions:'e2-e4'},{actions:null},{lan:''},{lan:'x'.repeat(121)}]) {
   expect(await call(input)).toMatchObject({isError:true,_meta:{code:'INVALID_INPUT'}});
  }
  expect(command).not.toHaveBeenCalled();
  const tool = (await client.listTools()).tools.find(tool=>tool.name==='kingdown_move')!;
  expect(tool.description).toBe("Play the player's whole turn: one to four exact legal moves, in order, all or nothing. Retry with the same command ID and the same input.");
  expect(tool._meta?.ui).toEqual({visibility:['app']});
  expect(tool.annotations).toEqual({readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false});
  expect(tool.inputSchema.required).toEqual(['game_id','command_id','expected_revision']);
  expect(tool.inputSchema.properties?.actions).toMatchObject({type:'array',minItems:1,maxItems:4,items:{type:'string',minLength:1,maxLength:120}});
 } finally {await client.close(); await server.close();}
});

it('loads changed board HTML through a resource cache while reusing identical builds across actors', async () => {
 const cache = new Map<string,string>();
 async function render(resourceHtml: string, actorId = 'alice') {
  const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId,resourceHtml,publicOrigin:'https://kingdown.example'});
  const client = new Client({name:'cached-host',version:'1'});
  const [a,b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  try {
   const tools = (await client.listTools()).tools;
   const uri = (tools.find(tool=>tool.name==='kingdown_open')!._meta?.ui as {resourceUri:string}).resourceUri;
   // Only the render tool carries the board, so other tool results do not redraw it.
   expect(tools.filter(tool => (tool._meta?.ui as {resourceUri?:string}).resourceUri).map(tool => tool.name)).toEqual(['kingdown_open']);
   if (!cache.has(uri)) {
    const resource = (await client.readResource({uri})).contents[0];
    expect(resource.uri).toBe(uri); if (!('text' in resource)) throw new Error('Expected board HTML');
    cache.set(uri,resource.text);
   }
   return {uri,html:cache.get(uri)};
  } finally {await client.close(); await server.close();}
 }
 const before = await render('<html>old controls</html>');
 expect(await render('<html>old controls</html>','bob')).toEqual(before);
 expect(cache.size).toBe(1);
 expect((await render('<html>repaired controls</html>')).html).toBe('<html>repaired controls</html>');
 expect(cache.size).toBe(2);
});

it('points the board art at the plugin origin and allows that origin in both CSP forms', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:`<img src="${ART_ORIGIN}/plugin-art/rook-1a2b.webp">`,publicOrigin:'https://kingdown.example/mcp'});
 const client = new Client({name:'csp-host',version:'1'});
 const [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const uri = ((await client.listTools()).tools.find(tool=>tool.name==='kingdown_open')!._meta?.ui as {resourceUri:string}).resourceUri;
  const resource = (await client.readResource({uri})).contents[0];
  expect('text' in resource && resource.text).toBe('<img src="https://kingdown.example/plugin-art/rook-1a2b.webp">');
  expect(resource._meta).toMatchObject({ui:{domain:'https://kingdown.example',csp:{resourceDomains:['https://kingdown.example'],connectDomains:[]}},'openai/widgetCSP':{resource_domains:['https://kingdown.example'],connect_domains:[]}});
 } finally {await client.close(); await server.close();}
});

it('offers inline and fullscreen display, empty thread and global entrypoints, and clipboard permission', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'entrypoint-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools, open = tools.find(tool => tool.name === 'kingdown_open')!;
  expect(open._meta?.['openai/ui']).toEqual({entrypoints:[{type:'thread'},{type:'global'}]});
  for (const tool of tools.filter(tool => (tool._meta?.ui as {visibility:string[]}).visibility.includes('model'))) expect(tool.description).toMatch(/^Use this when/);
  const uri = (open._meta?.ui as {resourceUri:string}).resourceUri;
  const resource = (await client.readResource({uri})).contents[0];
  expect(resource._meta).toMatchObject({ui:{permissions:{clipboardWrite:{}}},'openai/ui':{availableDisplayModes:['inline','fullscreen'],preferredDisplayMode:'fullscreen'}});
 } finally {await client.close(); await server.close();}
});

it('returns a safe field name for schema errors without echoing input', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'invalid-input-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const game_id = '00000000-0000-4000-8000-000000000001';
  const tools = (await client.listTools()).tools;
  expect(tools.find(t=>t.name === 'kingdown_create')!.inputSchema.properties!.kind).toMatchObject({enum:['solo','friend','random']});
  expect(tools.find(t=>t.name === 'kingdown_create')!.inputSchema.properties!.options).toMatchObject({type:'object',properties:{fairy:{type:'boolean'}}});
  expect(tools.find(t=>t.name === 'kingdown_get')!.inputSchema.properties!.since_revision).toMatchObject({maximum:1100});
  // RV5-3: the model sees command_id, so it must know that the field is for the board.
  expect(tools.find(t=>t.name === 'kingdown_create')!.inputSchema.properties!.command_id).toMatchObject({description:expect.stringContaining('leave it out')});
  for (const [name,args,field] of [
   ['kingdown_create',{kind:'solo',options:{...DEFAULT_OPTIONS,pool:[]}},'options. Keep at least 7 pieces in the pool'], ['kingdown_handle',{icon:'photo'},'icon'],
   ['kingdown_get',{game_id,since_revision:1101},'since_revision'], ['kingdown_get',{game_id,actorId:'private-value'},undefined], ['kingdown_move',{game_id,command_id:'bad',expected_revision:1101,lan:'e2-e4'},'expected_revision'],
  ] as const) expect(await client.callTool({name,arguments:args})).toEqual({isError:true,content:[{type:'text',text:field ? `Invalid input: check ${field}.` : 'Invalid input: check the tool fields.'}],_meta:{code:'INVALID_INPUT'}});
  expect((await client.callTool({name:'kingdown_create',arguments:{kind:'solo',options:{...DEFAULT_OPTIONS,classic:true,fairy:true}}})).content).toEqual([{type:'text',text:'Invalid input: check options. Classic needs Fairy pieces off.'}]);
 } finally {await client.close(); await server.close();}
});

it('bounds report notes at 1000 characters apart from game revisions', async () => {
 const service = {toolTry:async()=>{},report:async()=>({id:1,created_at:'2026-10-11T00:00:00.000Z'})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'report-bound-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const args = {game_id:'00000000-0000-4000-8000-000000000001',target:'player',category:REPORT_CATEGORIES[0]};
  const report = await client.callTool({name:'kingdown_report',arguments:{...args,note:'x'.repeat(1000)}});
  expect(report.isError).not.toBe(true); expect(report.structuredContent).toBeUndefined();
  expect(report._meta).toEqual({id:1,created_at:'2026-10-11T00:00:00.000Z'});
  expect(await client.callTool({name:'kingdown_report',arguments:{...args,note:'x'.repeat(1001)}})).toEqual({isError:true,content:[{type:'text',text:'Invalid input: check note.'}],_meta:{code:'INVALID_INPUT'}});
  const tools = (await client.listTools()).tools;
  expect(tools.find(t=>t.name === 'kingdown_report')!._meta?.ui).toMatchObject({visibility:['app']});
  expect(tools.find(t=>t.name === 'kingdown_report')!.inputSchema.properties!.note).toMatchObject({maxLength:1000});
  expect(tools.find(t=>t.name === 'kingdown_move')!.inputSchema.properties!.expected_revision).toMatchObject({maximum:1100});
 } finally {await client.close();await server.close();}
});

it('serves the current board page for a board URI from an earlier build', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:'<html>current board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'stale-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const current = ((await client.listTools()).tools.find(tool=>tool.name==='kingdown_open')!._meta?.ui as {resourceUri:string}).resourceUri;
  const old = `ui://kingdown/board-${'0'.repeat(64)}.html`;
  expect(old).not.toBe(current);
  const resource = (await client.readResource({uri:old})).contents[0];
  expect(resource).toMatchObject({uri:old,mimeType:'text/html;profile=mcp-app',text:'<html>current board</html>'});
  expect((await client.listResources()).resources.map(r=>r.uri)).toEqual([current]);
 } finally {await client.close(); await server.close();}
});

it('reads the board without a write, and records seat activity only through kingdown_seen', async () => {
 const game_id = '00000000-0000-4000-8000-000000000001', seen: string[] = [];
 const service = {view:async()=>({game_id,seat:0,status:'waiting',action:'waiting',fen:null}),profile:async()=>({handle:null,icon:null}),seen:async(_:string,id:string)=>{seen.push(id);}} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'seen-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools;
  expect(tools.find(t=>t.name === 'kingdown_get')!.annotations).toMatchObject({readOnlyHint:true});
  expect(tools.find(t=>t.name === 'kingdown_get')!.description).not.toMatch(/record/i);
  expect(tools.find(t=>t.name === 'kingdown_seen')).toMatchObject({annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false},_meta:{ui:{visibility:['app']}}});
  expect((await client.callTool({name:'kingdown_get',arguments:{game_id}})).isError).toBeFalsy();
  expect(seen).toEqual([]);
  expect((await client.callTool({name:'kingdown_seen',arguments:{game_id}})).isError).toBeFalsy();
  expect(seen).toEqual([game_id]);
 } finally {await client.close(); await server.close();}
});

it('says "1 game" for one game on the home summary, and gives the record on the profile screen', async () => {
 const service = {toolTry:async()=>{},openBoard:async()=>'00000000-0000-4000-8000-000000000002',inbox:async()=>[{action:'ready'}],profile:async()=>({handle:null,icon:null}),settings:async()=>({}),record:async()=>({rating:{rating:1617.4,provisional:true},totals:{played:2,won:1,drawn:0,lost:1},badges:[{},{},{}]}),view:async()=>({game_id:'00000000-0000-4000-8000-000000000001',status:'active',kind:'solo',speed:'daily',days_per_move:3,seat:0,action:'ready',fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',deadline_at:null,draw_offer:null})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'count-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  for (const args of [{}, {screen:'board'}]) {
   const result = await client.callTool({name:'kingdown_open',arguments:args});
   expect(result.content).toEqual([{type:'text',text:'Your move in 1 game.'}]);
   expect(result.structuredContent).toEqual({screen:'home',your_turn_count:1});
   expect(result._meta).toMatchObject({board_id:'00000000-0000-4000-8000-000000000002'});
  }
  // P4 (2026-10-19): the model can answer a rating question with the profile screen; the reply must carry the record.
  const profile = await client.callTool({name:'kingdown_open',arguments:{screen:'profile'}});
  expect(profile.content).toEqual([{type:'text',text:'Rating 1617?; 2 played, 1 won, 0 drawn, 1 lost; 3 badges.'}]);
  expect(profile.structuredContent).toEqual({screen:'profile',your_turn_count:1});
  // A game ID carried into a profile request still gets the record, not the board line.
  const withGame = await client.callTool({name:'kingdown_open',arguments:{screen:'profile',game_id:'00000000-0000-4000-8000-000000000001'}});
  expect(withGame.content).toEqual(profile.content);
  expect(withGame.structuredContent).toMatchObject({screen:'profile'});
 }
 finally {await client.close(); await server.close();}
});

it('sets an open-world hint on each tool, including both ways to join a random game', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'open-world-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools;
  expect(tools.filter(tool => tool.annotations?.openWorldHint).map(tool => tool.name).sort()).toEqual(['kingdown_accept','kingdown_block','kingdown_create','kingdown_find','kingdown_handle','kingdown_invite','kingdown_join','kingdown_say']);
  for (const tool of tools) expect(typeof tool.annotations?.openWorldHint, tool.name).toBe('boolean');
 } finally {await client.close(); await server.close();}
});

it('advertises the irreversible writes and repeat effects for review', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'hints-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools;
  for (const name of ['accept','find','join','invite','say','rematch','handle','settings','report','block']) expect(tools.find(t=>t.name===`kingdown_${name}`)?.annotations?.destructiveHint, name).toBe(true);
  for (const name of ['join','seen']) expect(tools.find(t=>t.name===`kingdown_${name}`)?.annotations?.idempotentHint, name).toBe(false);
  expect(tools.find(t=>t.name==='kingdown_open')?.description).toContain('board record');
  expect(tools.find(t=>t.name==='kingdown_create')?.description).toContain('last setup');
  expect(tools.find(t=>t.name==='kingdown_join')?.description).toContain('hourly limit');
 } finally {await client.close(); await server.close();}
});

it('uses singular and plural words for badge and lobby counts', async () => {
 let count = 0;
 const service = {notices:async()=>({notices:[],next_notices_before:null}),blocks:async()=>[],profile:async()=>({user_id:'alice'}),record:async()=>({rating:{rating:1500,provisional:true},totals:{played:0,won:0,drawn:0,lost:0},badges:Array(count).fill({})}),history:async()=>({games:[],next_before:null}),lobby:async()=>({games:Array(count).fill({})})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'plural-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  for (count of [0,1,2]) {
   expect((await client.callTool({name:'kingdown_profile',arguments:{}})).content).toEqual([{type:'text',text:`Rating 1500?; 0 played, 0 won, 0 drawn, 0 lost; ${count} badge${count===1?'':'s'}.`}]);
   expect((await client.callTool({name:'kingdown_lobby',arguments:{}})).content).toEqual([{type:'text',text:`${count} open game${count===1?'':'s'}.`}]);
  }
 } finally {await client.close(); await server.close();}
});

it('sends any rules from Create and Find to matchmaking, and says that the colour applies only to a new table (D1 a)', async () => {
 const view = {game_id:'00000000-0000-4000-8000-000000000001',status:'waiting',kind:'random',speed:'daily',days_per_move:3,seat:0,action:'waiting',fen:'',deadline_at:null,draw_offer:null};
 const find = vi.fn().mockResolvedValue(view), service = {toolTry:async()=>{},find,profile:async () => ({handle:'ann',icon:null})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'any-rules-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools, create = tools.find(t=>t.name === 'kingdown_create')!;
  expect(create.description).toContain('the colour applies only to a new table');
  for (const name of ['kingdown_create','kingdown_find']) expect(tools.find(t=>t.name === name)!.inputSchema.properties!.any_rules).toMatchObject({type:'boolean'});
  await client.callTool({name:'kingdown_create',arguments:{kind:'random',options:DEFAULT_OPTIONS,any_rules:true,command_id:'c1'}});
  await client.callTool({name:'kingdown_find',arguments:{options:DEFAULT_OPTIONS,colour:'black'}});
  expect(find.mock.calls).toEqual([['alice',DEFAULT_OPTIONS,undefined,'c1',true,undefined],['alice',DEFAULT_OPTIONS,'black',undefined,undefined,undefined]]);
 } finally {await client.close(); await server.close();}
});

it('keeps Ranked creation independent of saved Casual setup and carries deliberate acceptance through MCP', async () => {
 vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging'); // Ranked is offered only in staging (ticket 67).
 const game_id='00000000-0000-4000-8000-000000000001';
 const view={game_id,status:'waiting',rating_policy:'ranked-v1',seat:0,action:'waiting',fen:'private position',legal:['private move']};
 const find=vi.fn().mockResolvedValue(view), accept=vi.fn().mockResolvedValue(view), settings=vi.fn();
 const service={toolTry:async()=>{},find,accept,settings,profile:async()=>({handle:'ann',icon:null})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server=createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client=new Client({name:'ranked-host',version:'1'}),[a,b]=InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const created=await client.callTool({name:'kingdown_create',arguments:{kind:'random',mode:'ranked',command_id:'ranked-once'}});
  expect(created.isError).not.toBe(true); expect(settings).not.toHaveBeenCalled();
  expect(find).toHaveBeenCalledExactlyOnceWith('alice',undefined,undefined,'ranked-once',undefined,'ranked');
  const setup=createArguments(readSetup({kind:'random',mode:'ranked'}));
  expect((await client.callTool({name:'kingdown_find',arguments:{...setup,command_id:'ranked-ui'}})).isError).not.toBe(true);
  expect(find).toHaveBeenLastCalledWith('alice',setup.options,'random','ranked-ui',undefined,'ranked');
  expect(created.structuredContent).toMatchObject({game_id,rating_policy:'ranked-v1'});
  expect(created.structuredContent).not.toHaveProperty('fen'); expect(created.structuredContent).not.toHaveProperty('legal');
  expect((await client.callTool({name:'kingdown_accept',arguments:{game_id,rating_policy:'ranked-v1'}})).isError).not.toBe(true);
  expect(accept).toHaveBeenCalledExactlyOnceWith('alice',game_id,'ranked-v1');
  accept.mockClear();
  expect((await client.callTool({name:'kingdown_accept',arguments:{game_id,rating_policy:'ranked'}})).isError).toBe(true);
  expect(accept).not.toHaveBeenCalled();
 } finally {await client.close();await server.close();}
});


it.each(['kingdown_open', 'kingdown_resume'])('%s prefers a ready person to a computer', async name => {
 const computer = '00000000-0000-4000-8000-000000000001', person = '00000000-0000-4000-8000-000000000002', board_id = '00000000-0000-4000-8000-000000000003';
 const entry = (game_id: string, computer: boolean) => ({game_id,status:'playing',action:'ready',opponent:{computer}});
 const service = {toolTry:async()=>{},inbox:async()=>[entry(computer,true),entry(person,false)],view:async(_:string,game_id:string)=>({game_id,seat:0,status:'playing',action:'ready',fen:null,draw_offer:null}),profile:async()=>({handle:null,icon:null}),settings:async()=>({}),openBoard:async()=>board_id,board:async()=>computer,selectBoard:async()=>{}} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'next-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const result = await client.callTool({name,arguments:name === 'kingdown_open' ? {game_id:'next'} : {board_id}});
  expect(result.isError).toBeFalsy();
  expect(result.structuredContent).toMatchObject({game_id:person});
 } finally {await client.close(); await server.close();}
});


it('keeps the engine implementation in the authorized view and out of model summaries', async () => {
 const game_id = '00000000-0000-4000-8000-000000000001';
 const view = { game_id, engine_fingerprint:'engine-v1', kind:'friend', seat:0, status:'playing', action:'ready', fen:'private position', legal:['private move'], draw_offer:null, opponent:{handle:'private opponent'} };
 const service = {view:async()=>view,profile:async()=>({handle:null,icon:null})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'identity-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const result = await client.callTool({name:'kingdown_get',arguments:{game_id}});
  expect(result.isError).toBeFalsy(); expect(result._meta?.view).toEqual(view);
  const model = JSON.stringify({content:result.content,structuredContent:result.structuredContent});
  for (const privateValue of ['engine_fingerprint','engine-v1','private position','private move','private opponent']) expect(model).not.toContain(privateValue);
 } finally {await client.close(); await server.close();}
});

it('keeps stored-engine draft previews app-only and private, without selecting or writing a board', async () => {
 const game_id = '00000000-0000-4000-8000-000000000001', engine_fingerprint = 'sha256:' + 'a'.repeat(64);
 const draft = {game_id,revision:3,engine_fingerprint,actions:['Ra1-a4!H'],positions:[{fen:'private draft',status:'playing',turn:0,in_check:false,moves:[{lan:'private move',move:{from:0,to:24}}]}]};
 const previewDraft = vi.fn(async()=>draft), command = vi.fn(), seen = vi.fn(), selectBoard = vi.fn();
 const service = {previewDraft,command,seen,selectBoard} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'draft-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const input = {expected_revision:3,engine_fingerprint,actions:['Ra1-a4!H']};
  const result = await client.callTool({name:'kingdown_preview',arguments:{game_id,...input}});
  expect(result).toMatchObject({_meta:{draft}});
  expect(previewDraft).toHaveBeenCalledExactlyOnceWith('alice',game_id,input);
  expect(JSON.stringify({content:result.content,structuredContent:result.structuredContent})).not.toMatch(/private|sha256|Ra1|game_id|positions/);
  const tool = (await client.listTools()).tools.find(tool=>tool.name==='kingdown_preview')!;
  expect(tool._meta?.ui).toEqual({visibility:['app']});
  expect(tool.annotations).toMatchObject({readOnlyHint:true,idempotentHint:true});
  expect(tool.inputSchema.properties?.actions).toMatchObject({type:'array',maxItems:4});
  for (const extra of [{actor_id:'mallory'},{board_id:game_id},{actions:Array(5).fill('e2-e4')},{engine_fingerprint:'unknown'}]) expect(await client.callTool({name:'kingdown_preview',arguments:{game_id,...input,...extra}})).toMatchObject({isError:true,_meta:{code:'INVALID_INPUT'}});
  expect(previewDraft).toHaveBeenCalledOnce(); expect(command).not.toHaveBeenCalled(); expect(seen).not.toHaveBeenCalled(); expect(selectBoard).not.toHaveBeenCalled();
 } finally {await client.close();await server.close();}
});

it('F-115 names Menu when a board has no game to resume', async () => {
 const board_id = '00000000-0000-4000-8000-000000000003';
 const service = { toolTry: async () => {}, board: async () => null, inbox: async () => [], profile: async () => ({ handle: null, icon: null }) } as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
 const client = new Client({ name: 'empty-board-host', version: '1' }), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const result = await client.callTool({ name: 'kingdown_resume', arguments: { board_id } });
  expect(result.content).toEqual([{ type: 'text', text: 'King Down. Start a game from Menu.' }]);
 } finally { await client.close(); await server.close(); }
});


it('exposes named invitation tool fields, private rows and safe limit errors', async () => {
 const invite_id = 'a'.repeat(64), game_id = '00000000-0000-4000-8000-000000000001';
 const service = {
  toolTry: vi.fn(), profile: async () => ({ handle: null, icon: null }), inbox: async () => [],
  invitations: vi.fn(async () => ({ invitations: [{ invite_id, game_id, direction: 'incoming', state: 'open', recipient_id: game_id, player: { handle: '<private>' }, options: null, expires_at: 'soon' }], next_before: null })),
  friends: vi.fn(async () => ({ friends: [], next_after: null })), declineInvite: vi.fn(async () => ({ invite_id, state: 'declined' })),
  join: vi.fn(async () => { throw new MatchServiceError('FRIEND_GAME_LIMIT', 409, 'You have 5 games with rowan. Finish one to accept this invitation.', { count: 5, handle: 'rowan' }); }),
 } as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
 const client = new Client({ name: 'friend-host', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools;
  for (const name of ['kingdown_create', 'kingdown_invite']) expect(tools.find(t => t.name === name)!.inputSchema.properties).toHaveProperty('recipient_id');
  expect(tools.find(t => t.name === 'kingdown_friends')!._meta?.ui).toMatchObject({ visibility: ['app'] });
  expect(tools.find(t => t.name === 'kingdown_decline_invite')!.annotations).toMatchObject({ destructiveHint: true });
  const rows = await client.callTool({ name: 'kingdown_games', arguments: {} });
  expect(rows.structuredContent).toMatchObject({ invitations: [{ invite_id }], next_before: null });
  expect(JSON.stringify(rows.structuredContent)).not.toContain('<private>');
  expect(rows._meta).toMatchObject({ invitations: [{ player: { handle: '<private>' } }] });
  const refused = await client.callTool({ name: 'kingdown_join', arguments: { invite_id } });
  expect(refused).toMatchObject({ isError: true, _meta: { code: 'FRIEND_GAME_LIMIT', count: 5, handle: 'rowan' } });
  expect(await client.callTool({ name: 'kingdown_join', arguments: { invite_id, code: 'ABCDEF' } })).toMatchObject({ isError: true, _meta: { code: 'INVALID_INPUT' } });
  expect(await client.callTool({ name: 'kingdown_decline_invite', arguments: { invite_id } })).toMatchObject({ _meta: { invitation: { state: 'declined' } } });
 } finally { await client.close(); await server.close(); }
});

it.each(['FRIEND_GAME_LIMIT', 'FRIEND_INVITE_LIMIT', 'OPEN_INVITE_LIMIT'] as const)('keeps the full %s notice in host metadata', async code => {
 const message = 'Private notice for rowan.', details = { count: 5, handle: 'rowan' };
 const service = { toolTry: vi.fn(), join: async () => { throw new MatchServiceError(code, 409, message, details); } } as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'http://localhost' });
 const client = new Client({ name: 'privacy-host', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const reply = await client.callTool({ name: 'kingdown_join', arguments: { code: 'ABCDEF' } });
  expect.soft(JSON.stringify([reply.content, reply.structuredContent])).not.toContain('rowan');
  expect(reply._meta).toMatchObject({ code, ...details, message });
 } finally { await client.close(); await server.close(); }
});

it.each(['kingdown_games', 'kingdown_invite'])('keeps recipient IDs in host metadata for %s', async name => {
 const game_id = '00000000-0000-4000-8000-000000000001', recipient_id = '00000000-0000-4000-8000-000000000002', invite_id = 'a'.repeat(64);
 const invite = { token: 'private-token', code: 'ABCDEF', expires_at: 'soon', invite_id, recipient_id };
 const row = { ...invite, game_id, direction: 'outgoing', state: 'open', player: { handle: 'rowan' }, revision: 1 };
 const service = { toolTry: vi.fn(), inbox: async () => [], invitations: async () => ({ invitations: [row], next_before: null }), invite: async () => invite } as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({ service, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'http://localhost' });
 const client = new Client({ name: 'privacy-host', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const reply = await client.callTool({ name, arguments: name === 'kingdown_games' ? {} : { game_id } });
  const visible = JSON.stringify([reply.content, reply.structuredContent]);
  expect.soft(visible).not.toContain(recipient_id); expect.soft(visible).not.toContain('rowan'); expect.soft(visible).not.toContain('private-token');
  expect(reply._meta).toMatchObject(name === 'kingdown_games' ? { invitations: [row] } : { invite });
 } finally { await client.close(); await server.close(); }
});
