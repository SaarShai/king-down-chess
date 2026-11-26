/** The ChatGPT plugin tool table in npm test (tools/plugin-protocol-check.ts checks it in CI only): who may call each tool,
 *  its four hints (report part 03, section 4.5), and the written counter decision. The key sets are Record<PluginTool, ...>,
 *  so a new name in src/plugin/tool-names.ts fails typecheck here until each table has its row. */
import { expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginServer } from '../src/plugin/server';
import { TOOL_LIMITS } from '../src/plugin/service';
import type { PluginTool } from '../src/plugin/tool-names';
import { READ_TOOLS } from '../src/account-game/types';

interface Row { visibility: 'app' | 'model,app'; readOnly: boolean; destructive: boolean; idempotent: boolean; openWorld: boolean }
const app = (row: Partial<Row> = {}): Row => ({ visibility: 'app', readOnly: false, destructive: false, idempotent: true, openWorld: false, ...row });
const model = (row: Partial<Row> = {}): Row => app({ visibility: 'model,app', ...row });
const TABLE = {
  kingdown_open: model({ idempotent: false }), kingdown_create: model({ idempotent: false, openWorld: true }), kingdown_resume: app({ idempotent: false }),
  kingdown_games: model({ readOnly: true }), kingdown_get: app({ readOnly: true }), kingdown_preview: app({ readOnly: true }), kingdown_seen: app({ idempotent: false }),
  kingdown_lobby: app({ readOnly: true }), kingdown_accept: app({ destructive: true, openWorld: true }), kingdown_find: app({ destructive: true, idempotent: false, openWorld: true }),
  kingdown_cancel: app({ destructive: true }), kingdown_choose: app(), kingdown_rematch: app({ destructive: true }), kingdown_move: app(), kingdown_computer: app(),
  kingdown_say: app({ destructive: true, openWorld: true }), kingdown_draw: model({ destructive: true }), kingdown_claim: app({ destructive: true }),
  kingdown_resign: model({ destructive: true }), kingdown_abort: model({ destructive: true }), kingdown_invite: model({ destructive: true, idempotent: false, openWorld: true }),
  kingdown_join: model({ destructive: true, idempotent: false, openWorld: true }), kingdown_friends: app(), kingdown_decline_invite: app({ destructive: true }),
  kingdown_block: app({ destructive: true, openWorld: true }), kingdown_report: app({ destructive: true, idempotent: false }), kingdown_handle: app({ destructive: true, openWorld: true }),
  kingdown_settings: app({ destructive: true }), kingdown_profile: model({ readOnly: true }),
} satisfies Record<PluginTool, Row>;
/** The TOOL_LIMITS counter that each tool uses before it works (src/plugin/server.ts, register), or 'none'.
 *  A tool that makes games, boards or reports needs a counter. Join has its own hourly code limit in the service. */
const COUNTER = {
  kingdown_open: 'kingdown_open', kingdown_create: 'kingdown_create', kingdown_find: 'kingdown_create', kingdown_rematch: 'kingdown_create',
  kingdown_computer: 'kingdown_computer', kingdown_report: 'kingdown_report',
  kingdown_resume: 'none', kingdown_games: 'none', kingdown_get: 'none', kingdown_preview: 'none', kingdown_seen: 'none', kingdown_lobby: 'none',
  kingdown_accept: 'none', kingdown_cancel: 'none', kingdown_choose: 'none', kingdown_move: 'none', kingdown_say: 'none', kingdown_draw: 'none',
  kingdown_claim: 'none', kingdown_resign: 'none', kingdown_abort: 'none', kingdown_invite: 'none', kingdown_join: 'none', kingdown_friends: 'none',
  kingdown_decline_invite: 'none', kingdown_block: 'none', kingdown_handle: 'none', kingdown_settings: 'none', kingdown_profile: 'none',
} satisfies Record<PluginTool, keyof typeof TOOL_LIMITS | 'none'>;

async function listing() {
  const server = createPluginServer({ service: {} as never, actorId: 'alice', resourceHtml: '<html>board</html>', publicOrigin: 'https://kingdown.example' });
  const client = new Client({ name: 'plugin-tool-table', version: '1' }), [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  try { return (await client.listTools()).tools; } finally { await client.close(); await server.close(); }
}

it('lists each plugin tool with the hints of its table row', async () => {
  const tools = await listing();
  for (const tool of tools) expect(Object.hasOwn(TABLE, tool.name), `New plugin tool ${tool.name}: add it to PluginTool in src/plugin/tool-names.ts, then add its rows to TABLE and COUNTER in tools/plugin-tool-table.test.ts`).toBe(true);
  for (const name of Object.keys(TABLE)) expect(tools.some(tool => tool.name === name), `Plugin tool ${name} is not listed: remove it from PluginTool (src/plugin/tool-names.ts) and from the tables of tools/plugin-tool-table.test.ts`).toBe(true);
  for (const tool of tools) {
    const ui = tool._meta?.ui as { visibility: string[] }, hints = tool.annotations;
    const row: Row = { visibility: ui.visibility.join(',') as Row['visibility'], readOnly: hints?.readOnlyHint === true, destructive: hints?.destructiveHint === true, idempotent: hints?.idempotentHint === true, openWorld: hints?.openWorldHint === true };
    expect(row, `Plugin tool ${tool.name}: its hints in src/plugin/server.ts and its TABLE row in tools/plugin-tool-table.test.ts differ (also change TABLE in tools/plugin-protocol-check.ts)`).toEqual(TABLE[tool.name as PluginTool]);
  }
});

it('gives each tool named in TOOL_LIMITS its own counter', () => {
  for (const name of Object.keys(TOOL_LIMITS)) if (Object.hasOwn(COUNTER, name)) expect(COUNTER[name as PluginTool], `src/plugin/server.ts counts ${name} against its own TOOL_LIMITS key: set COUNTER.${name} in tools/plugin-tool-table.test.ts`).toBe(name);
});

/** Read-only tools that the account game does not queue as reads, each with its reason. */
const NOT_READ_TOOLS: Partial<Record<PluginTool, string>> = {
  kingdown_preview: 'only the plugin board sends it (src/plugin/screens/board.ts, background: true); the account-game queue never sends it',
};

it('queues each read-only tool as a read in the account game (READ_TOOLS)', () => {
  const readOnly = (Object.keys(TABLE) as PluginTool[]).filter(name => TABLE[name].readOnly);
  for (const name of readOnly) if (!Object.hasOwn(NOT_READ_TOOLS, name)) expect(READ_TOOLS, `Plugin tool ${name} is readOnly: add it to READ_TOOLS in src/account-game/types.ts (else the account game queues it as a write), or add it to NOT_READ_TOOLS in tools/plugin-tool-table.test.ts with a reason`).toContain(name);
  for (const name of READ_TOOLS) expect(TABLE[name as PluginTool]?.readOnly, `READ_TOOLS in src/account-game/types.ts has ${name}, which is not a readOnly tool in TABLE: remove it there, or make the tool readOnly`).toBe(true);
  for (const name of Object.keys(NOT_READ_TOOLS) as PluginTool[]) expect(TABLE[name].readOnly && !READ_TOOLS.includes(name), `NOT_READ_TOOLS in tools/plugin-tool-table.test.ts: remove ${name}; it is not readOnly or it is in READ_TOOLS`).toBe(true);
});
