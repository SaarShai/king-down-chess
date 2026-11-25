/** Tool names in text: each `kingdown_<name>` in a tool description, an input field description and the ChatGPT
 *  submission texts must be a tool that the server lists, so a renamed or removed tool cannot leave a stale name.
 *  The model-visible list of docs/plugin-preparation.md must equal the model-visible tools of the listing. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client as MuseClient, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createPluginServer } from '../src/plugin/server';
import { createMuseServer } from '../src/muse/tools';

type Listed = { name: string; description?: string; inputSchema: unknown; _meta?: Record<string, unknown> };
/** Database and SQL names that also start with kingdown_; they are not tools. */
const NOT_TOOLS = new Set(['kingdown_access_token_hook', 'kingdown_auth', 'kingdown_before_user_created', 'kingdown_plugin_runtime', 'kingdown_plugin_test', 'kingdown_test']);
const names = (text: string) => [...new Set(text.match(/kingdown_[a-z_]*[a-z]/g) ?? [])].filter(name => !NOT_TOOLS.has(name));
/** Each description string in a JSON schema. */
const descriptions = (schema: unknown): string[] => !schema || typeof schema !== 'object' ? [] : Object.entries(schema).flatMap(([key, value]) => key === 'description' && typeof value === 'string' ? [value] : descriptions(value));

async function pluginTools(): Promise<Listed[]> {
  const server = createPluginServer({ service: {} as never, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
  const client = new Client({ name: 'tool-names-in-text', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  try { return (await client.listTools()).tools; } finally { await client.close(); await server.close(); }
}
async function museTools(): Promise<Listed[]> {
  const handler = createMcpHandler(() => createMuseServer({ games: {} as never, actorId: 'alice', publicOrigin: 'https://kingdown.test' }));
  const client = new MuseClient({ name: 'tool-names-in-text', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL('https://kingdown.test/muse/mcp'), { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  try { return (await client.listTools()).tools as Listed[]; } finally { await client.close(); }
}

it.each([['plugin', 'src/plugin/server.ts', pluginTools], ['Muse', 'src/muse/tools.ts', museTools]] as const)('the %s tool texts name only listed tools', async (_server, file, list) => {
  const tools = await list(), listed = new Set(tools.map(tool => tool.name));
  for (const tool of tools) for (const name of names([tool.description ?? '', ...descriptions(tool.inputSchema)].join('\n')))
    expect(listed.has(name), `Tool text of ${tool.name} (${file}) names ${name}, which is not a listed tool: change the text`).toBe(true);
});

it('the submission texts name only listed plugin tools', async () => {
  const listed = new Set((await pluginTools()).map(tool => tool.name));
  const files = ['docs/submission/package/skills/play-king-down/SKILL.md', 'docs/plugin-preparation.md',
    ...readdirSync('docs/submission', { recursive: true, encoding: 'utf8' }).filter(file => /\.(?:md|json)$/.test(file)).map(file => join('docs/submission', file))];
  for (const file of files) for (const name of names(readFileSync(file, 'utf8')))
    expect(listed.has(name), `${file} names ${name}, which is not a listed plugin tool: change the text (a database name goes in NOT_TOOLS of tools/tool-names-in-text.docs.test.ts)`).toBe(true);
});

it('docs/plugin-preparation.md lists the model-visible plugin tools', async () => {
  const visible = (await pluginTools()).filter(tool => (tool._meta?.ui as { visibility: string[] }).visibility.includes('model')).map(tool => tool.name).sort();
  const sentence = /The model sees (.+?)\. The other tools/.exec(readFileSync('docs/plugin-preparation.md', 'utf8'))?.[1];
  expect(sentence, 'docs/plugin-preparation.md: the sentence "The model sees ... The other tools are for the board only." is missing').toBeDefined();
  expect(names(sentence!).sort(), 'docs/plugin-preparation.md, "The model sees": the names differ from the model-visible tools of src/plugin/server.ts. Add or remove the names there').toEqual(visible);
});
