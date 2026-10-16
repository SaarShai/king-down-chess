import { expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { REPORT_CATEGORIES } from '../account/profile';
import { DEFAULT_OPTIONS } from '../match/setup';
import { ART_ORIGIN, createPluginServer } from './server';

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
  expect(resource._meta).toMatchObject({ui:{permissions:{clipboardWrite:{}}},'openai/ui':{availableDisplayModes:['inline','fullscreen'],preferredDisplayMode:'inline'}});
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
 const service = {report:async()=>({id:1,created_at:'2026-10-11T00:00:00.000Z'})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
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

it('says "1 game" for one game on the home summary', async () => {
 const service = {openBoard:async()=>'00000000-0000-4000-8000-000000000002',inbox:async()=>[{action:'ready'}],profile:async()=>({handle:null,icon:null}),settings:async()=>({})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
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
  for (const name of ['invite','say','rematch','handle','settings','report','block']) expect(tools.find(t=>t.name===`kingdown_${name}`)?.annotations?.destructiveHint, name).toBe(true);
  for (const name of ['join','seen']) expect(tools.find(t=>t.name===`kingdown_${name}`)?.annotations?.idempotentHint, name).toBe(false);
  expect(tools.find(t=>t.name==='kingdown_open')?.description).toContain('board record');
  expect(tools.find(t=>t.name==='kingdown_create')?.description).toContain('last setup');
  expect(tools.find(t=>t.name==='kingdown_join')?.description).toContain('hourly limit');
 } finally {await client.close(); await server.close();}
});

it('uses singular and plural words for badge and lobby counts', async () => {
 let count = 0;
 const service = {profile:async()=>({user_id:'alice'}),record:async()=>({rating:{rating:1500,provisional:true},totals:{played:0,won:0,drawn:0,lost:0},badges:Array(count).fill({})}),history:async()=>({games:[],next_before:null}),lobby:async()=>({games:Array(count).fill({})})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
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
 const find = vi.fn().mockResolvedValue(view), service = {find,profile:async () => ({handle:'ann',icon:null})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'any-rules-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const tools = (await client.listTools()).tools, create = tools.find(t=>t.name === 'kingdown_create')!;
  expect(create.description).toContain('the colour applies only to a new table');
  for (const name of ['kingdown_create','kingdown_find']) expect(tools.find(t=>t.name === name)!.inputSchema.properties!.any_rules).toMatchObject({type:'boolean'});
  await client.callTool({name:'kingdown_create',arguments:{kind:'random',options:DEFAULT_OPTIONS,any_rules:true,command_id:'c1'}});
  await client.callTool({name:'kingdown_find',arguments:{options:DEFAULT_OPTIONS,colour:'black'}});
  expect(find.mock.calls).toEqual([['alice',DEFAULT_OPTIONS,undefined,'c1',true],['alice',DEFAULT_OPTIONS,'black',undefined,undefined]]);
 } finally {await client.close(); await server.close();}
});
