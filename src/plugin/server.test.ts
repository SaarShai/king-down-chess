import { expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from './server';

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
   for (const tool of tools) expect((tool._meta?.ui as {resourceUri:string}).resourceUri).toBe(uri);
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
