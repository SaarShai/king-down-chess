/** The Muse tool documentation (ticket 16, step 2): writes docs/specs/muse-connector/tool-docs.md from the tool listing that
 *  an MCP client, and so the portal's MCP snapshot, gets from src/muse/tools.ts. Run `npm run muse:docs` after a tool change;
 *  tools/muse-tool-docs.docs.test.ts fails while the file and the listing differ. */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { MAX_ACTIVE_MCP, MAX_ACTIVE_MCP_PER_USER, MAX_MCP_BODY } from '../src/plugin/http';
import { TOOL_LIMITS } from '../src/plugin/service';
import { MUSE_METADATA_PATH } from '../src/muse/http';
import { COUNTERS, createMuseServer, REFUSED, type MuseGames } from '../src/muse/tools';

export const TOOL_DOCS = 'docs/specs/muse-connector/tool-docs.md';

/** What each tool changes. A listed tool with no line here, or a line with no listed tool, stops the generator. */
const EFFECTS: Record<string, string> = {
  kingdown_games: 'None. It reads the unfinished games of the account.',
  kingdown_view: 'None. It reads one game.',
  kingdown_explain: 'None. It reads the rules, and the position of a game against the computer.',
  kingdown_new_game: 'It makes one casual game against the computer in the account; the game also shows on kingdown.dev. When you play Black, the computer plays its first move. The same `request_id` gives the same game again, not a second game.',
  kingdown_move: 'It plays your complete turn and the computer\'s reply in that game; casual games change no rating. Choices, a refusal, an unfinished turn and an old revision play nothing.',
  kingdown_end: 'Resign ends the game, and the computer wins. Abort ends the game with no result. A game that ended does not start again. An old revision changes nothing.',
};
/** The meaning of each `result` value of the write tools. A value with no line here, or a line with no value, stops the generator. */
const RESULTS: Record<string, string> = {
  played: 'Your turn played, and the computer replied in the same call.',
  computer: 'An earlier call stopped before the computer moved. The computer moved now; say your move again.',
  choices: 'The words fit more than one move. The result gives numbered choices with their `move_ids`. Nothing played.',
  refused: 'The words fit no legal move. The result gives the reason and some legal moves. Nothing played.',
  pending: 'The turn has more actions (a king power such as Haste). The result gives the next choices. Nothing played.',
  changed: '`expected_revision` is not the revision of the game. Nothing changed; the result gives the current state.',
  ended: 'The game ended.',
};

type Schema = {
  type?: string | string[]; enum?: unknown[]; format?: string; pattern?: string; description?: string; minLength?: number; maxLength?: number;
  minimum?: number; maximum?: number; minItems?: number; maxItems?: number; items?: Schema; anyOf?: Schema[]; properties?: Record<string, Schema>; required?: string[];
};
const code = (text: string) => `\`${text}\``;
const cell = (text: string) => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
const yes = (value: unknown) => value ? 'yes' : 'no';

/** ", 1 to 60 characters" for the limits that a schema sets. The safe-integer limits of zod's int() say nothing. */
function bounds(min: number | undefined, max: number | undefined, unit: string): string {
  const set = (n?: number): n is number => n !== undefined && Math.abs(n) < Number.MAX_SAFE_INTEGER;
  return set(min) && set(max) ? `, ${min} to ${max}${unit}` : set(max) ? `, at most ${max}${unit}` : set(min) ? `, at least ${min}${unit}` : '';
}
/** A JSON Schema as a short type. */
function kind(s: Schema): string {
  if (s.anyOf) return s.anyOf.map(kind).join(' or ');
  if (s.enum) return `one of ${s.enum.map(v => code(String(v))).join(', ')}`;
  if (Array.isArray(s.type)) return s.type.join(' or ');
  if (s.type === 'array') {
    const item = s.items?.type === 'object' ? 'objects' : kind(s.items ?? {});
    return `array of ${item.includes(',') ? `(${item})` : item}${bounds(s.minItems, s.maxItems, ' items')}`;
  }
  if (s.format === 'uuid') return 'UUID';
  if (s.type === 'string') return s.pattern ? `string matching ${code(s.pattern)}` : `string${bounds(s.minLength, s.maxLength, ' characters')}`;
  if (s.type === 'integer' || s.type === 'number') return `${s.type}${bounds(s.minimum, s.maximum, '')}`;
  return s.type ?? 'any value';
}
/** One table row for each field; the fields of an array's objects follow as `name[].field`. */
function rows(s: Schema, notes: boolean, prefix = ''): string[] {
  return Object.entries(s.properties ?? {}).flatMap(([name, p]) => [
    `| ${code(prefix + name)} | ${cell(kind(p))} | ${yes(s.required?.includes(name))} |${notes ? ` ${cell(p.description ?? '')} |` : ''}`,
    ...(p.type === 'array' && p.items?.properties ? rows(p.items, notes, `${prefix}${name}[].`) : []),
  ]);
}
const fields = (s: Schema | undefined, notes: boolean) => Object.keys(s?.properties ?? {}).length
  ? [notes ? '| Field | Type | Required | Notes |' : '| Field | Type | Always given |', notes ? '|---|---|---|---|' : '|---|---|---|', ...rows(s!, notes)] : ['None.'];
function same(what: string, found: Iterable<string>, written: Record<string, string>): void {
  const a = [...new Set(found)].sort().join(', '), b = Object.keys(written).sort().join(', ');
  if (a !== b) throw new Error(`The ${what} of the listing (${a}) and of tools/muse-tool-docs.ts (${b}) differ`);
}

/** The listing as a client gets it: the real server in process, with no game port (a listing calls no game). */
async function listing() {
  const handler = createMcpHandler(() => createMuseServer({ games: {} as MuseGames, actorId: 'docs', publicOrigin: 'https://kingdown.dev' }));
  const client = new Client({ name: 'muse-tool-docs', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL('https://kingdown.dev/muse/mcp'), { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  try { return (await client.listTools()).tools; } finally { await client.close(); }
}

export async function toolDocs(): Promise<string> {
  const tools = await listing(), counters: Record<string, keyof typeof TOOL_LIMITS> = COUNTERS;
  same('tool names', tools.map(t => t.name), EFFECTS);
  same('result values', tools.flatMap(t => ((t.outputSchema?.properties as Record<string, Schema> | undefined)?.result?.enum ?? []).map(String)), RESULTS);
  const classOf = (t: (typeof tools)[number]) => t.annotations?.readOnlyHint ? 'Read' : 'Write';
  const limit = (name: string) => counters[name] ? `${TOOL_LIMITS[counters[name]].count} calls in ${TOOL_LIMITS[counters[name]].seconds} seconds` : 'none';
  const used = [...new Set(Object.values(counters))];
  return [
    '# Muse tool documentation',
    '',
    'This file comes from the tool listing of [src/muse/tools.ts](../../../src/muse/tools.ts), through [tools/muse-tool-docs.ts](../../../tools/muse-tool-docs.ts). Do not edit it. After a tool change, run `npm run muse:docs`. The test `tools/muse-tool-docs.docs.test.ts` fails while this file and the listing differ.',
    '',
    'The listing is the answer to `tools/list` that each MCP client gets, and so the portal\'s MCP snapshot.',
    '',
    '## Summary',
    '',
    '| Tool | Title | Class | Read only | Destructive | Idempotent | Open world | Limit for each account |',
    '|---|---|---|---|---|---|---|---|',
    ...tools.map(t => `| ${code(t.name)} | ${t.title} | ${classOf(t)} | ${yes(t.annotations?.readOnlyHint)} | ${yes(t.annotations?.destructiveHint)} | ${yes(t.annotations?.idempotentHint)} | ${yes(t.annotations?.openWorldHint)} | ${limit(t.name)} |`),
    '',
    'The class comes from the read-only hint: a read-only tool is a Read, and each other tool is a Write. No tool is a Sensitive write: no tool sends a message, spends money, or shares data outside King Down. Each tool acts only on the games of the signed-in King Down account. The account comes from the access token, never from a tool field.',
    '',
    '## Results',
    '',
    'Each result starts with one or two sentences that Muse can speak as they are. Detail lines follow: the board, the choices or a link. `structuredContent` gives the same facts and agrees with the output schema of the tool. No result has a widget or an image.',
    '',
    '## Status and retries',
    '',
    'Each write tool gives a `result` value:',
    '',
    '| `result` | Meaning |',
    '|---|---|',
    ...Object.entries(RESULTS).map(([value, meaning]) => `| ${code(value)} | ${cell(meaning)} |`),
    '',
    '- `kingdown_move` and `kingdown_end` carry `expected_revision`, the revision of the last result for the game. When it is not the revision of the game, the tool changes nothing and gives the current state (`changed`).',
    '- A write that comes again changes nothing more. The same `kingdown_move` or `kingdown_end` again has an old `expected_revision`, so it gives `changed`, with the current state and the last turns. The same `request_id` again gives the same game in its current position, with `computer: []`: the first move of the computer does not come again. Thus each tool has the idempotent hint.',
    '- The server makes the command ID of each write from the game ID, the revision and the actions; `kingdown_new_game` makes it from `request_id`. Two equal calls at the same time have the same command ID, and the game service plays the command once: the second call gets the receipt of the first, or `STALE_REVISION` (`src/match/service.ts`, `command`).',
    '- After a lost reply, send the same call again: the answer gives the current state. Or read the game with `kingdown_view`.',
    '',
    '## Errors',
    '',
    'A call that a tool refuses sets `isError`. Its text is one fixed sentence, and its `structuredContent` is `{ "code": "<code>" }`. The text never repeats the input. The text of the game service never goes to Muse; this table gives the sentence for each code of the game service.',
    '',
    '| Code | Sentence |',
    '|---|---|',
    ...Object.entries(REFUSED).map(([c, sentence]) => `| ${code(c)} | ${cell(sentence)} |`),
    '',
    'The connector has more codes, each with its own fixed sentence: `NO_GAME` (no game against the computer), `PERSON_GAME` (the game is against a person; the sentence gives its link), `NOT_STARTED` (the setup of the game is not complete) and `INTERNAL_ERROR` (any other fault; "Could not update the game. Try again."). The server log records the tool name and a fixed error category only.',
    '',
    'A call that does not fit the input schema stops in the MCP SDK, before the tool runs. Its result sets `isError` and has no `structuredContent`. Its text starts with "Input validation error:" and names the field and the rule that the input breaks.',
    '',
    'Before a tool runs, the HTTP edge can refuse the request:',
    '',
    '| Status | When | Headers and body |',
    '|---|---|---|',
    `| 401 | No valid King Down access token: a wrong issuer, audience or client, an expired token, or a session that ended. | \`WWW-Authenticate: Bearer resource_metadata="https://kingdown.dev${MUSE_METADATA_PATH}", scope="openid"\` |`,
    `| 429 | The account has ${MAX_ACTIVE_MCP_PER_USER} requests in progress. | \`Retry-After: 1\`, code \`RATE_LIMITED\` |`,
    `| 503 | The server instance has ${MAX_ACTIVE_MCP} requests in progress, or the sign-in check is not available. | \`Retry-After: 1\` or \`Retry-After: 5\` |`,
    `| 413 | The body is larger than ${MAX_MCP_BODY / 1024} KiB. | |`,
    '| 400 | The body is not JSON, or it is a JSON-RPC batch. | |',
    '| 405 | The method is not POST or OPTIONS. | `Allow: POST, OPTIONS` |',
    '',
    '## Rate limits',
    '',
    'The server counts each counted call for the account in Postgres (`plugin_tool_tries`) before the game work starts, so a call that the game then refuses also counts. Two refusals come before the count and count nothing: a call that does not fit the input schema, and a `kingdown_move` call with no `said` and no `move_ids`. The website uses the same counters for the same actions (`src/api/http.ts`). The reads have no count limit. The limits of the HTTP edge (above) apply to all calls.',
    '',
    '| Counter | Tools | Limit for each account |',
    '|---|---|---|',
    ...used.map(c => `| ${code(c)} | ${Object.keys(counters).filter(n => counters[n] === c).map(code).join(', ')} | ${TOOL_LIMITS[c].count} calls in ${TOOL_LIMITS[c].seconds} seconds |`),
    '',
    `A call over the limit gives code \`RATE_LIMITED\` and "${REFUSED.RATE_LIMITED}"`,
    '',
    '## Tools',
    ...tools.flatMap(t => [
      '',
      `### ${code(t.name)}: ${t.title}`,
      '',
      `Class: ${classOf(t)}. Limit for each account: ${limit(t.name)}.`,
      '',
      `> ${t.description}`,
      '',
      `Side effects: ${EFFECTS[t.name]}`,
      '',
      'Input:',
      '',
      ...fields(t.inputSchema as Schema, true),
      '',
      'Output (`structuredContent`):',
      '',
      ...fields(t.outputSchema as Schema | undefined, false),
    ]),
    '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(TOOL_DOCS, await toolDocs());
  console.log(`Wrote ${TOOL_DOCS}`);
}
