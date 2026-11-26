/** The written counter decision of each Muse tool. COUNTER is a Record<MuseTool, ...>, so a new name in MuseTool
 *  (src/muse/tools.ts) fails typecheck here until the tool has a decision: a TOOL_LIMITS key or 'none'.
 *  A write tool that makes games or plays the computer needs a counter. The second test calls each counted tool
 *  and asks that its body calls games.toolTry with its COUNTERS key before it does any other work. */
import { expect, it } from 'vitest';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { COUNTERS, createMuseServer, type MuseGames, type MuseTool } from '../src/muse/tools';
import type { TOOL_LIMITS } from '../src/plugin/service';

const COUNTER = {
  kingdown_games: 'none', kingdown_view: 'none', kingdown_explain: 'none', kingdown_end: 'none',
  kingdown_new_game: 'kingdown_create', kingdown_move: 'kingdown_computer',
} satisfies Record<MuseTool, keyof typeof TOOL_LIMITS | 'none'>;

it('gives each Muse tool the counter of its written decision', () => {
  const counters: Partial<Record<MuseTool, string>> = COUNTERS;
  for (const [name, counter] of Object.entries(COUNTER) as [MuseTool, string][])
    expect(counters[name] ?? 'none', `Muse tool ${name}: COUNTER in tools/muse-tool-counters.test.ts says ${counter}; set COUNTERS.${name} in src/muse/tools.ts to the same TOOL_LIMITS key (or remove it for 'none')`).toBe(counter);
});

/** Valid arguments for each counted tool. A new COUNTERS entry fails typecheck here until it has a sample. */
const SAMPLES: Record<keyof typeof COUNTERS, Record<string, unknown>> = {
  kingdown_new_game: { request_id: 'counter-sample-1' },
  kingdown_move: { expected_revision: 0, said: 'e4', game_id: 'd137864c-e174-4f38-9277-6bdd0a4289dc' },
};

it.each(Object.keys(SAMPLES) as (keyof typeof COUNTERS)[])('counts a call of the Muse tool %s with games.toolTry before any work', async name => {
  const tried: string[] = [], worked: string[] = [];
  const stop = (method: string) => async () => { worked.push(method); throw new Error(`games.${method} ran`); };
  const games: MuseGames = {
    create: stop('create'), command: stop('command'), view: stop('view'), inbox: stop('inbox'), previewDraft: stop('previewDraft'),
    toolTry: async (_actor, tool) => { tried.push(tool); throw new Error('counted'); },
  };
  const handler = createMcpHandler(() => createMuseServer({ games, actorId: 'alice', publicOrigin: 'https://kingdown.test' }));
  const client = new Client({ name: 'muse-tool-counters', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL('https://kingdown.test/muse/mcp'), { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  try { await client.callTool({ name, arguments: SAMPLES[name] }); } finally { await client.close(); }
  expect(tried, `Muse tool ${name} has COUNTERS.${name} = ${COUNTERS[name]} but its body in src/muse/tools.ts does not call games.toolTry(actorId, COUNTERS.${name}) before ${worked[0] ? `games.${worked[0]}` : 'it ends'}: add that call first in the body (or fix its sample in SAMPLES of tools/muse-tool-counters.test.ts)`).toEqual([COUNTERS[name]]);
});
