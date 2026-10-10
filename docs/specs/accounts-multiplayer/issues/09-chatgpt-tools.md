# 09 — ChatGPT tools

Type: task
Status: ready-for-agent
Wave: 3 (after 02, 07) · Model: Opus · Branch: `claude/mp-09`

## What to build

Read part 03 of the report, section 4.5 (the tool table, the read-only poll, poll rules), and part 01, section 6.

Update `src/plugin/server.ts` (and `src/plugin/app.ts` only where the new view shape needs it; no new visual controls):

- `kingdown_open` accepts a game ID or `next` (the most urgent game) and keeps the board resource; no other tool carries the resource.
- `kingdown_create` adds speed (Daily by default), days per move and colour.
- `kingdown_invite` returns the `kingdown.dev/j/<token>` link and the short code.
- `kingdown_join` accepts a token, a full link or a short code.
- New: `kingdown_games` (the inbox, read-only), `kingdown_say`, `kingdown_draw`, `kingdown_resign`, `kingdown_abort`, `kingdown_claim`, `kingdown_report`, `kingdown_profile` (`_meta['openai/profile']: true`; returns the user ID and the handle, never an email).
- `kingdown_get` takes `since_revision` and writes nothing.
- Every tool has explicit `readOnlyHint`, `destructiveHint` and `openWorldHint`.
- In games between people, the model gets no position: board data goes in `_meta` for the board only; `content` gives a short text.

## Checks

- Protocol check (`npm run plugin:check:protocol`) lists the tools with their hints; a test proves `kingdown_get` writes no row.
- The plugin browser checks pass (`plugin-ui`, `plugin-ui-http`, `plugin-oauth`).
- `npm test` passes.

## Comments
