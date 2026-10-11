import { expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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
