import { expect, it } from 'vitest';
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

it('returns the same plain invalid-input reply for schema errors', async () => {
 const server = createPluginServer({service:{} as Parameters<typeof createPluginServer>[0]['service'],actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'invalid-input-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const game_id = '00000000-0000-4000-8000-000000000001';
  const tools = (await client.listTools()).tools;
  expect(tools.find(t=>t.name === 'kingdown_create')!.inputSchema.properties!.kind).toMatchObject({enum:['solo','friend','random']});
  expect(tools.find(t=>t.name === 'kingdown_create')!.inputSchema.properties!.options).toMatchObject({type:'object',properties:{fairy:{type:'boolean'}}});
  expect(tools.find(t=>t.name === 'kingdown_get')!.inputSchema.properties!.since_revision).toMatchObject({maximum:1100});
  for (const [name,args] of [
   ['kingdown_create',{kind:'solo',options:{...DEFAULT_OPTIONS,pool:[]}}], ['kingdown_handle',{icon:'photo'}],
   ['kingdown_get',{game_id,since_revision:1101}], ['kingdown_get',{game_id,actorId:'mallory'}], ['kingdown_move',{game_id,command_id:'bad',expected_revision:1101,lan:'e2-e4'}],
  ] as const) expect(await client.callTool({name,arguments:args})).toEqual({isError:true,content:[{type:'text',text:'Invalid input'}],_meta:{code:'INVALID_INPUT'}});
 } finally {await client.close(); await server.close();}
});

it('bounds report notes at 1000 characters apart from game revisions', async () => {
 const service = {report:async()=>({id:1,created_at:'2026-10-11T00:00:00.000Z'})} as unknown as Parameters<typeof createPluginServer>[0]['service'];
 const server = createPluginServer({service,actorId:'alice',resourceHtml:'<html>board</html>',publicOrigin:'https://kingdown.example'});
 const client = new Client({name:'report-bound-host',version:'1'}), [a,b] = InMemoryTransport.createLinkedPair();
 await server.connect(a); await client.connect(b);
 try {
  const args = {game_id:'00000000-0000-4000-8000-000000000001',target:'player',category:REPORT_CATEGORIES[0]};
  expect((await client.callTool({name:'kingdown_report',arguments:{...args,note:'x'.repeat(1000)}})).isError).not.toBe(true);
  expect(await client.callTool({name:'kingdown_report',arguments:{...args,note:'x'.repeat(1001)}})).toEqual({isError:true,content:[{type:'text',text:'Invalid input'}],_meta:{code:'INVALID_INPUT'}});
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
  expect(tools.find(t=>t.name === 'kingdown_seen')).toMatchObject({annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true},_meta:{ui:{visibility:['app']}}});
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
 try { expect((await client.callTool({name:'kingdown_open',arguments:{}})).content).toEqual([{type:'text',text:'Your move in 1 game.'}]); }
 finally {await client.close(); await server.close();}
});
